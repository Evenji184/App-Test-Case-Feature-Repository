import { Op } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import { FeatureNode } from '../db/models';
import { logAudit } from '../utils/audit';
import { AppError } from './authService';

export async function getNodeTree() {
  const nodes = await FeatureNode.findAll({
    where: { deleted_at: null, is_visible: true },
    order: [['level', 'ASC'], ['sort_order', 'ASC'], ['name', 'ASC']],
  });
  return nodes;
}

export async function listNodes(params: { keyword?: string; page?: number; pageSize?: number }) {
  const { keyword, page = 1, pageSize = 50 } = params;
  const where: Record<string, unknown> = { deleted_at: null };
  if (keyword) {
    where[Op.or as unknown as string] = [
      { name: { [Op.like]: `%${keyword}%` } },
      { code: { [Op.like]: `%${keyword}%` } },
    ];
  }
  const { count, rows } = await FeatureNode.findAndCountAll({
    where,
    order: [['level', 'ASC'], ['sort_order', 'ASC']],
    limit: pageSize,
    offset: (page - 1) * pageSize,
  });
  return { total: count, items: rows };
}

export async function getNodeDetail(nodeId: string) {
  return FeatureNode.findOne({ where: { id: nodeId, deleted_at: null } });
}

export async function searchNodes(keyword: string) {
  return FeatureNode.findAll({
    where: {
      deleted_at: null,
      [Op.or]: [
        { name: { [Op.like]: `%${keyword}%` } },
        { code: { [Op.like]: `%${keyword}%` } },
      ],
    },
    order: [['level', 'ASC'], ['name', 'ASC']],
    limit: 50,
  });
}

async function computePathAndLevel(code: string, parentId?: string | null) {
  if (!parentId) {
    return { path: `/${code}`, level: 1 };
  }
  const parent = await FeatureNode.findByPk(parentId);
  if (!parent) throw new AppError('NOT_FOUND', '父节点不存在');
  return {
    path: `${parent.path}/${code}`,
    level: parent.level + 1,
  };
}

export async function createNode(params: {
  name: string;
  code: string;
  description?: string;
  parentId?: string | null;
  sortOrder?: number;
  operatorId: string;
  operatorUsername: string;
  ipAddress?: string;
}) {
  const existing = await FeatureNode.findOne({ where: { code: params.code, deleted_at: null } });
  if (existing) throw new AppError('CONFLICT', '节点编码已存在');

  const { path, level } = await computePathAndLevel(params.code, params.parentId);

  const node = await FeatureNode.create({
    id: uuidv4(),
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

  await logAudit({
    userId: params.operatorId,
    action: 'create_node',
    targetType: 'node',
    targetId: node.id,
    targetName: node.name,
    ipAddress: params.ipAddress,
  });
  return node;
}

export async function updateNode(params: {
  nodeId: string;
  name?: string;
  code?: string;
  description?: string | null;
  parentId?: string | null;
  sortOrder?: number;
  operatorId: string;
  operatorUsername: string;
  ipAddress?: string;
}) {
  const node = await FeatureNode.findOne({ where: { id: params.nodeId, deleted_at: null } });
  if (!node) throw new AppError('NOT_FOUND', '节点不存在');

  const updates: Record<string, unknown> = { updated_by: params.operatorId, updated_at: new Date() };
  if (params.name !== undefined) updates.name = params.name;
  if (params.description !== undefined) updates.remark = params.description;
  if (params.sortOrder !== undefined) updates.sort_order = params.sortOrder;

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
    const descendants = await FeatureNode.findAll({
      where: { path: { [Op.like]: `${oldPath}/%` }, deleted_at: null },
    });
    for (const desc of descendants) {
      const newDescPath = path + desc.path.slice(oldPath.length);
      const newDescLevel = level + desc.level - node.level;
      await FeatureNode.update(
        { path: newDescPath, level: newDescLevel },
        { where: { id: desc.id } }
      );
    }
  }

  await FeatureNode.update(updates, { where: { id: params.nodeId } });
  const updated = await FeatureNode.findByPk(params.nodeId);

  await logAudit({
    userId: params.operatorId,
    action: 'update_node',
    targetType: 'node',
    targetId: params.nodeId,
    ipAddress: params.ipAddress,
  });
  return updated!;
}

export async function deleteNode(nodeId: string, operatorId: string, operatorUsername: string, ipAddress?: string) {
  const node = await FeatureNode.findOne({ where: { id: nodeId, deleted_at: null } });
  if (!node) throw new AppError('NOT_FOUND', '节点不存在');

  const children = await FeatureNode.findAll({
    where: { path: { [Op.like]: `${node.path}/%` }, deleted_at: null },
  });
  if (children.length > 0) throw new AppError('CONFLICT', '请先删除子节点');

  await FeatureNode.update({ deleted_at: new Date(), updated_by: operatorId }, { where: { id: nodeId } });
  await logAudit({ userId: operatorId, action: 'delete_node', targetType: 'node', targetId: nodeId, ipAddress });
}

export async function hideNode(nodeId: string, operatorId: string, operatorUsername: string, ipAddress?: string) {
  const node = await FeatureNode.findOne({ where: { id: nodeId, deleted_at: null } });
  if (!node) throw new AppError('NOT_FOUND', '节点不存在');

  await FeatureNode.update({ is_visible: false, updated_by: operatorId, updated_at: new Date() }, { where: { id: nodeId } });
  await logAudit({ userId: operatorId, action: 'hide_node', targetType: 'node', targetId: nodeId, ipAddress });
}

export async function showNode(nodeId: string, operatorId: string, operatorUsername: string, ipAddress?: string) {
  const node = await FeatureNode.findOne({ where: { id: nodeId, deleted_at: null } });
  if (!node) throw new AppError('NOT_FOUND', '节点不存在');

  await FeatureNode.update({ is_visible: true, updated_by: operatorId, updated_at: new Date() }, { where: { id: nodeId } });
  await logAudit({ userId: operatorId, action: 'show_node', targetType: 'node', targetId: nodeId, ipAddress });
}

export async function copyNode(nodeId: string, operatorId: string, operatorUsername: string, ipAddress?: string) {
  const node = await FeatureNode.findOne({ where: { id: nodeId, deleted_at: null } });
  if (!node) throw new AppError('NOT_FOUND', '节点不存在');

  const copyOpId = uuidv4();
  const suffix = copyOpId.replace(/-/g, '').slice(0, 6);
  const newCode = `${node.code}_copy_${suffix}`;
  const { path, level } = await computePathAndLevel(newCode, node.parent_id);

  const newNode = await FeatureNode.create({
    id: uuidv4(),
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

  await logAudit({ userId: operatorId, action: 'copy_node', targetType: 'node', targetId: nodeId, ipAddress });
  return newNode;
}

export async function moveNode(
  nodeId: string,
  targetParentId: string | null,
  operatorId: string,
  operatorUsername: string,
  ipAddress?: string
) {
  const node = await FeatureNode.findOne({ where: { id: nodeId, deleted_at: null } });
  if (!node) throw new AppError('NOT_FOUND', '节点不存在');

  if (targetParentId) {
    const targetParent = await FeatureNode.findOne({ where: { id: targetParentId, deleted_at: null } });
    if (!targetParent) throw new AppError('NOT_FOUND', '目标父节点不存在');
    if (targetParent.path.startsWith(node.path + '/') || targetParent.path === node.path) {
      throw new AppError('VALIDATION_ERROR', '不能移动到自身或子节点下');
    }
  }

  const moveOpId = uuidv4();
  const oldPath = node.path;
  const { path, level } = await computePathAndLevel(node.code, targetParentId);

  const descendants = await FeatureNode.findAll({
    where: { path: { [Op.like]: `${oldPath}/%` }, deleted_at: null },
  });

  await FeatureNode.update(
    {
      parent_id: targetParentId,
      path,
      level,
      moved_from_node_id: node.parent_id,
      move_operation_id: moveOpId,
      updated_by: operatorId,
      updated_at: new Date(),
    },
    { where: { id: nodeId } }
  );

  for (const desc of descendants) {
    const newDescPath = path + desc.path.slice(oldPath.length);
    const newDescLevel = level + desc.level - node.level;
    await FeatureNode.update({ path: newDescPath, level: newDescLevel }, { where: { id: desc.id } });
  }

  const updated = await FeatureNode.findByPk(nodeId);
  await logAudit({ userId: operatorId, action: 'move_node', targetType: 'node', targetId: nodeId, ipAddress });
  return updated!;
}
