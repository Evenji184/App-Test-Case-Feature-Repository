"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNodeTree = getNodeTree;
exports.listNodes = listNodes;
exports.getNodeDetail = getNodeDetail;
exports.searchNodes = searchNodes;
exports.createNode = createNode;
exports.updateNode = updateNode;
exports.deleteNode = deleteNode;
exports.hideNode = hideNode;
exports.showNode = showNode;
exports.copyNode = copyNode;
exports.moveNode = moveNode;
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
const models_1 = require("../db/models");
const audit_1 = require("../utils/audit");
const authService_1 = require("./authService");
async function getNodeTree() {
    const nodes = await models_1.FeatureNode.findAll({
        where: { deleted_at: null, is_visible: true },
        order: [['level', 'ASC'], ['sort_order', 'ASC'], ['name', 'ASC']],
    });
    return nodes;
}
async function listNodes(params) {
    const { keyword, page = 1, pageSize = 50 } = params;
    const where = { deleted_at: null };
    if (keyword) {
        where[sequelize_1.Op.or] = [
            { name: { [sequelize_1.Op.like]: `%${keyword}%` } },
            { code: { [sequelize_1.Op.like]: `%${keyword}%` } },
        ];
    }
    const { count, rows } = await models_1.FeatureNode.findAndCountAll({
        where,
        order: [['level', 'ASC'], ['sort_order', 'ASC']],
        limit: pageSize,
        offset: (page - 1) * pageSize,
    });
    return { total: count, items: rows };
}
async function getNodeDetail(nodeId) {
    return models_1.FeatureNode.findOne({ where: { id: nodeId, deleted_at: null } });
}
async function searchNodes(keyword) {
    return models_1.FeatureNode.findAll({
        where: {
            deleted_at: null,
            [sequelize_1.Op.or]: [
                { name: { [sequelize_1.Op.like]: `%${keyword}%` } },
                { code: { [sequelize_1.Op.like]: `%${keyword}%` } },
            ],
        },
        order: [['level', 'ASC'], ['name', 'ASC']],
        limit: 50,
    });
}
async function computePathAndLevel(code, parentId) {
    if (!parentId) {
        return { path: `/${code}`, level: 1 };
    }
    const parent = await models_1.FeatureNode.findByPk(parentId);
    if (!parent)
        throw new authService_1.AppError('NOT_FOUND', '父节点不存在');
    return {
        path: `${parent.path}/${code}`,
        level: parent.level + 1,
    };
}
async function createNode(params) {
    const existing = await models_1.FeatureNode.findOne({ where: { code: params.code, deleted_at: null } });
    if (existing)
        throw new authService_1.AppError('CONFLICT', '节点编码已存在');
    const { path, level } = await computePathAndLevel(params.code, params.parentId);
    const node = await models_1.FeatureNode.create({
        id: (0, uuid_1.v4)(),
        name: params.name,
        code: params.code,
        remark: params.description ?? null,
        parent_id: params.parentId ?? null,
        path,
        level,
        sort_order: params.sortOrder ?? 0,
        is_visible: true,
        created_by: params.operatorId,
        updated_by: params.operatorId,
    });
    await (0, audit_1.logAudit)({
        userId: params.operatorId,
        action: 'create_node',
        targetType: 'node',
        targetId: node.id,
        targetName: node.name,
        ipAddress: params.ipAddress,
    });
    return node;
}
async function updateNode(params) {
    const node = await models_1.FeatureNode.findOne({ where: { id: params.nodeId, deleted_at: null } });
    if (!node)
        throw new authService_1.AppError('NOT_FOUND', '节点不存在');
    const updates = { updated_by: params.operatorId, updated_at: new Date() };
    if (params.name !== undefined)
        updates.name = params.name;
    if (params.description !== undefined)
        updates.remark = params.description;
    if (params.sortOrder !== undefined)
        updates.sort_order = params.sortOrder;
    const newCode = params.code ?? node.code;
    const newParentId = params.parentId !== undefined ? params.parentId : node.parent_id;
    if (params.code !== undefined || params.parentId !== undefined) {
        const { path, level } = await computePathAndLevel(newCode, newParentId);
        updates.code = newCode;
        updates.parent_id = newParentId;
        updates.path = path;
        updates.level = level;
        // Update descendant paths
        const oldPath = node.path;
        const descendants = await models_1.FeatureNode.findAll({
            where: { path: { [sequelize_1.Op.like]: `${oldPath}/%` }, deleted_at: null },
        });
        for (const desc of descendants) {
            const newDescPath = path + desc.path.slice(oldPath.length);
            const newDescLevel = level + desc.level - node.level;
            await models_1.FeatureNode.update({ path: newDescPath, level: newDescLevel }, { where: { id: desc.id } });
        }
    }
    await models_1.FeatureNode.update(updates, { where: { id: params.nodeId } });
    const updated = await models_1.FeatureNode.findByPk(params.nodeId);
    await (0, audit_1.logAudit)({
        userId: params.operatorId,
        action: 'update_node',
        targetType: 'node',
        targetId: params.nodeId,
        ipAddress: params.ipAddress,
    });
    return updated;
}
async function deleteNode(nodeId, operatorId, operatorUsername, ipAddress) {
    const node = await models_1.FeatureNode.findOne({ where: { id: nodeId, deleted_at: null } });
    if (!node)
        throw new authService_1.AppError('NOT_FOUND', '节点不存在');
    const children = await models_1.FeatureNode.findAll({
        where: { path: { [sequelize_1.Op.like]: `${node.path}/%` }, deleted_at: null },
    });
    if (children.length > 0)
        throw new authService_1.AppError('CONFLICT', '请先删除子节点');
    await models_1.FeatureNode.update({ deleted_at: new Date(), updated_by: operatorId }, { where: { id: nodeId } });
    await (0, audit_1.logAudit)({ userId: operatorId, action: 'delete_node', targetType: 'node', targetId: nodeId, ipAddress });
}
async function hideNode(nodeId, operatorId, operatorUsername, ipAddress) {
    const node = await models_1.FeatureNode.findOne({ where: { id: nodeId, deleted_at: null } });
    if (!node)
        throw new authService_1.AppError('NOT_FOUND', '节点不存在');
    await models_1.FeatureNode.update({ is_visible: false, updated_by: operatorId, updated_at: new Date() }, { where: { id: nodeId } });
    await (0, audit_1.logAudit)({ userId: operatorId, action: 'hide_node', targetType: 'node', targetId: nodeId, ipAddress });
}
async function showNode(nodeId, operatorId, operatorUsername, ipAddress) {
    const node = await models_1.FeatureNode.findOne({ where: { id: nodeId, deleted_at: null } });
    if (!node)
        throw new authService_1.AppError('NOT_FOUND', '节点不存在');
    await models_1.FeatureNode.update({ is_visible: true, updated_by: operatorId, updated_at: new Date() }, { where: { id: nodeId } });
    await (0, audit_1.logAudit)({ userId: operatorId, action: 'show_node', targetType: 'node', targetId: nodeId, ipAddress });
}
async function copyNode(nodeId, operatorId, operatorUsername, ipAddress) {
    const node = await models_1.FeatureNode.findOne({ where: { id: nodeId, deleted_at: null } });
    if (!node)
        throw new authService_1.AppError('NOT_FOUND', '节点不存在');
    const copyOpId = (0, uuid_1.v4)();
    const suffix = copyOpId.replace(/-/g, '').slice(0, 6);
    const newCode = `${node.code}_copy_${suffix}`;
    const { path, level } = await computePathAndLevel(newCode, node.parent_id);
    const newNode = await models_1.FeatureNode.create({
        id: (0, uuid_1.v4)(),
        name: `${node.name}_副本`,
        code: newCode,
        remark: node.remark,
        parent_id: node.parent_id,
        path,
        level,
        sort_order: node.sort_order + 1,
        is_visible: node.is_visible,
        source_node_id: node.source_node_id ?? nodeId,
        copied_from_node_id: nodeId,
        copy_operation_id: copyOpId,
        created_by: operatorId,
        updated_by: operatorId,
    });
    await (0, audit_1.logAudit)({ userId: operatorId, action: 'copy_node', targetType: 'node', targetId: nodeId, ipAddress });
    return newNode;
}
async function moveNode(nodeId, targetParentId, operatorId, operatorUsername, ipAddress) {
    const node = await models_1.FeatureNode.findOne({ where: { id: nodeId, deleted_at: null } });
    if (!node)
        throw new authService_1.AppError('NOT_FOUND', '节点不存在');
    if (targetParentId) {
        const targetParent = await models_1.FeatureNode.findOne({ where: { id: targetParentId, deleted_at: null } });
        if (!targetParent)
            throw new authService_1.AppError('NOT_FOUND', '目标父节点不存在');
        if (targetParent.path.startsWith(node.path + '/') || targetParent.path === node.path) {
            throw new authService_1.AppError('VALIDATION_ERROR', '不能移动到自身或子节点下');
        }
    }
    const moveOpId = (0, uuid_1.v4)();
    const oldPath = node.path;
    const { path, level } = await computePathAndLevel(node.code, targetParentId);
    const descendants = await models_1.FeatureNode.findAll({
        where: { path: { [sequelize_1.Op.like]: `${oldPath}/%` }, deleted_at: null },
    });
    await models_1.FeatureNode.update({
        parent_id: targetParentId,
        path,
        level,
        moved_from_node_id: node.parent_id,
        move_operation_id: moveOpId,
        updated_by: operatorId,
        updated_at: new Date(),
    }, { where: { id: nodeId } });
    for (const desc of descendants) {
        const newDescPath = path + desc.path.slice(oldPath.length);
        const newDescLevel = level + desc.level - node.level;
        await models_1.FeatureNode.update({ path: newDescPath, level: newDescLevel }, { where: { id: desc.id } });
    }
    const updated = await models_1.FeatureNode.findByPk(nodeId);
    await (0, audit_1.logAudit)({ userId: operatorId, action: 'move_node', targetType: 'node', targetId: nodeId, ipAddress });
    return updated;
}
//# sourceMappingURL=nodeService.js.map