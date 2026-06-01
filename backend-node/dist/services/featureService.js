"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listFeatures = listFeatures;
exports.getFeatureDetail = getFeatureDetail;
exports.searchFeatures = searchFeatures;
exports.createFeature = createFeature;
exports.updateFeature = updateFeature;
exports.deleteFeature = deleteFeature;
exports.hideFeature = hideFeature;
exports.showFeature = showFeature;
exports.copyFeature = copyFeature;
exports.moveFeature = moveFeature;
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
const models_1 = require("../db/models");
const audit_1 = require("../utils/audit");
const authService_1 = require("./authService");
async function expandNodeIds(nodeIds) {
    if (!nodeIds.length)
        return [];
    const nodes = await models_1.FeatureNode.findAll({
        where: { id: { [sequelize_1.Op.in]: nodeIds }, deleted_at: null },
    });
    if (!nodes.length)
        return nodeIds;
    // Collect all descendant node IDs via path prefix
    const allPaths = nodes.map(n => n.path);
    const conditions = allPaths.flatMap(p => [
        { path: p },
        { path: { [sequelize_1.Op.like]: `${p}/%` } },
    ]);
    const allNodes = await models_1.FeatureNode.findAll({
        where: { [sequelize_1.Op.or]: conditions, deleted_at: null },
    });
    return allNodes.map(n => n.id);
}
async function listFeatures(params) {
    const { keyword, page = 1, pageSize = 20, includeHidden = false } = params;
    const where = { deleted_at: null };
    if (!includeHidden) {
        where.is_visible = true;
    }
    let targetNodeIds;
    if (params.nodeId) {
        targetNodeIds = await expandNodeIds([params.nodeId]);
    }
    else if (params.nodeIds && params.nodeIds.length > 0) {
        targetNodeIds = await expandNodeIds(params.nodeIds);
    }
    if (targetNodeIds !== undefined) {
        where.node_id = { [sequelize_1.Op.in]: targetNodeIds };
    }
    if (keyword) {
        where[sequelize_1.Op.or] = [
            { title: { [sequelize_1.Op.like]: `%${keyword}%` } },
            { code: { [sequelize_1.Op.like]: `%${keyword}%` } },
            { summary: { [sequelize_1.Op.like]: `%${keyword}%` } },
        ];
    }
    const { count, rows } = await models_1.Feature.findAndCountAll({
        where,
        order: [['created_at', 'DESC']],
        limit: pageSize,
        offset: (page - 1) * pageSize,
    });
    return { total: count, items: rows };
}
async function getFeatureDetail(featureId) {
    return models_1.Feature.findOne({ where: { id: featureId, deleted_at: null } });
}
async function searchFeatures(keyword) {
    return models_1.Feature.findAll({
        where: {
            deleted_at: null,
            [sequelize_1.Op.or]: [
                { title: { [sequelize_1.Op.like]: `%${keyword}%` } },
                { code: { [sequelize_1.Op.like]: `%${keyword}%` } },
                { summary: { [sequelize_1.Op.like]: `%${keyword}%` } },
                { description: { [sequelize_1.Op.like]: `%${keyword}%` } },
            ],
        },
        order: [['updated_at', 'DESC']],
        limit: 50,
    });
}
async function createFeature(params) {
    const node = await models_1.FeatureNode.findOne({ where: { id: params.nodeId, deleted_at: null } });
    if (!node)
        throw new authService_1.AppError('NOT_FOUND', '节点不存在');
    const existing = await models_1.Feature.findOne({ where: { code: params.code, deleted_at: null } });
    if (existing)
        throw new authService_1.AppError('CONFLICT', '特征编码已存在');
    const feature = await models_1.Feature.create({
        id: (0, uuid_1.v4)(),
        node_id: params.nodeId,
        title: params.title,
        code: params.code,
        summary: params.summary ?? null,
        description: params.description ?? null,
        platform: params.platform ?? null,
        priority: params.priority ?? null,
        status: 'active',
        is_visible: true,
        created_by: params.operatorId,
        updated_by: params.operatorId,
    });
    await (0, audit_1.logAudit)({
        userId: params.operatorId,
        action: 'create_feature', targetType: 'feature', targetId: feature.id, targetName: feature.title,
        ipAddress: params.ipAddress,
    });
    return feature;
}
async function updateFeature(params) {
    const feature = await models_1.Feature.findOne({ where: { id: params.featureId, deleted_at: null } });
    if (!feature)
        throw new authService_1.AppError('NOT_FOUND', '特征不存在');
    if (params.expectedUpdatedAt) {
        const expected = new Date(params.expectedUpdatedAt).getTime();
        const actual = new Date(feature.updated_at).getTime();
        if (Math.abs(expected - actual) > 1000) {
            throw new authService_1.AppError('CONFLICT', '数据已被他人修改，请刷新后重试');
        }
    }
    const updates = { updated_by: params.operatorId, updated_at: new Date() };
    if (params.title !== undefined)
        updates.title = params.title;
    if (params.summary !== undefined)
        updates.summary = params.summary;
    if (params.description !== undefined)
        updates.description = params.description;
    if (params.platform !== undefined)
        updates.platform = params.platform;
    if (params.priority !== undefined)
        updates.priority = params.priority;
    await models_1.Feature.update(updates, { where: { id: params.featureId } });
    const updated = await models_1.Feature.findByPk(params.featureId);
    await (0, audit_1.logAudit)({
        userId: params.operatorId,
        action: 'update_feature', targetType: 'feature', targetId: params.featureId,
        ipAddress: params.ipAddress,
    });
    return updated;
}
async function deleteFeature(featureId, operatorId, operatorUsername, ipAddress) {
    const feature = await models_1.Feature.findOne({ where: { id: featureId, deleted_at: null } });
    if (!feature)
        throw new authService_1.AppError('NOT_FOUND', '特征不存在');
    await models_1.Feature.update({ deleted_at: new Date(), updated_by: operatorId }, { where: { id: featureId } });
    await (0, audit_1.logAudit)({ userId: operatorId, action: 'delete_feature', targetType: 'feature', targetId: featureId, ipAddress });
}
async function hideFeature(featureId, operatorId, operatorUsername, ipAddress) {
    const feature = await models_1.Feature.findOne({ where: { id: featureId, deleted_at: null } });
    if (!feature)
        throw new authService_1.AppError('NOT_FOUND', '特征不存在');
    await models_1.Feature.update({ is_visible: false, updated_by: operatorId, updated_at: new Date() }, { where: { id: featureId } });
    await (0, audit_1.logAudit)({ userId: operatorId, action: 'hide_feature', targetType: 'feature', targetId: featureId, ipAddress });
}
async function showFeature(featureId, operatorId, operatorUsername, ipAddress) {
    const feature = await models_1.Feature.findOne({ where: { id: featureId, deleted_at: null } });
    if (!feature)
        throw new authService_1.AppError('NOT_FOUND', '特征不存在');
    await models_1.Feature.update({ is_visible: true, updated_by: operatorId, updated_at: new Date() }, { where: { id: featureId } });
    await (0, audit_1.logAudit)({ userId: operatorId, action: 'show_feature', targetType: 'feature', targetId: featureId, ipAddress });
}
async function copyFeature(featureId, targetNodeId, operatorId, operatorUsername, ipAddress) {
    const feature = await models_1.Feature.findOne({ where: { id: featureId, deleted_at: null } });
    if (!feature)
        throw new authService_1.AppError('NOT_FOUND', '特征不存在');
    const copyOpId = (0, uuid_1.v4)();
    const suffix = copyOpId.replace(/-/g, '').slice(0, 6);
    const newCode = `${feature.code}_copy_${suffix}`;
    const nodeId = targetNodeId ?? feature.node_id;
    const newFeature = await models_1.Feature.create({
        id: (0, uuid_1.v4)(),
        node_id: nodeId,
        title: `${feature.title}_副本`,
        code: newCode,
        summary: feature.summary,
        description: feature.description,
        platform: feature.platform,
        priority: feature.priority,
        status: feature.status,
        is_visible: feature.is_visible,
        source_feature_id: feature.source_feature_id ?? featureId,
        copied_from_id: featureId,
        copy_operation_id: copyOpId,
        last_copied_at: new Date(),
        created_by: operatorId,
        updated_by: operatorId,
    });
    await (0, audit_1.logAudit)({ userId: operatorId, action: 'copy_feature', targetType: 'feature', targetId: featureId, ipAddress });
    return newFeature;
}
async function moveFeature(featureId, targetNodeId, operatorId, operatorUsername, ipAddress) {
    const feature = await models_1.Feature.findOne({ where: { id: featureId, deleted_at: null } });
    if (!feature)
        throw new authService_1.AppError('NOT_FOUND', '特征不存在');
    const targetNode = await models_1.FeatureNode.findOne({ where: { id: targetNodeId, deleted_at: null } });
    if (!targetNode)
        throw new authService_1.AppError('NOT_FOUND', '目标节点不存在');
    const moveOpId = (0, uuid_1.v4)();
    await models_1.Feature.update({
        node_id: targetNodeId,
        moved_from_node_id: feature.node_id,
        move_operation_id: moveOpId,
        last_moved_at: new Date(),
        updated_by: operatorId,
        updated_at: new Date(),
    }, { where: { id: featureId } });
    const updated = await models_1.Feature.findByPk(featureId);
    await (0, audit_1.logAudit)({ userId: operatorId, action: 'move_feature', targetType: 'feature', targetId: featureId, ipAddress });
    return updated;
}
//# sourceMappingURL=featureService.js.map