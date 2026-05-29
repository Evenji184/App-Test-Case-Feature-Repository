import { Op } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import { Feature, FeatureNode } from '../db/models';
import { logAudit } from '../utils/audit';
import { AppError } from './authService';

async function expandNodeIds(nodeIds: string[]): Promise<string[]> {
  if (!nodeIds.length) return [];

  const nodes = await FeatureNode.findAll({
    where: { id: { [Op.in]: nodeIds }, deleted_at: null },
  });

  if (!nodes.length) return nodeIds;

  // Collect all descendant node IDs via path prefix
  const allPaths = nodes.map(n => n.path);
  const conditions = allPaths.flatMap(p => [
    { path: p },
    { path: { [Op.like]: `${p}/%` } },
  ]);

  const allNodes = await FeatureNode.findAll({
    where: { [Op.or]: conditions, deleted_at: null },
  });

  return allNodes.map(n => n.id);
}

export async function listFeatures(params: {
  nodeId?: string;
  nodeIds?: string[];
  keyword?: string;
  page?: number;
  pageSize?: number;
  includeHidden?: boolean;
}) {
  const { keyword, page = 1, pageSize = 20, includeHidden = false } = params;
  const where: Record<string, unknown> = { deleted_at: null };

  if (!includeHidden) {
    where.is_visible = true;
  }

  let targetNodeIds: string[] | undefined;
  if (params.nodeId) {
    targetNodeIds = await expandNodeIds([params.nodeId]);
  } else if (params.nodeIds && params.nodeIds.length > 0) {
    targetNodeIds = await expandNodeIds(params.nodeIds);
  }

  if (targetNodeIds !== undefined) {
    where.node_id = { [Op.in]: targetNodeIds };
  }

  if (keyword) {
    where[Op.or as unknown as string] = [
      { title: { [Op.like]: `%${keyword}%` } },
      { code: { [Op.like]: `%${keyword}%` } },
      { summary: { [Op.like]: `%${keyword}%` } },
    ];
  }

  const { count, rows } = await Feature.findAndCountAll({
    where,
    order: [['created_at', 'DESC']],
    limit: pageSize,
    offset: (page - 1) * pageSize,
  });
  return { total: count, items: rows };
}

export async function getFeatureDetail(featureId: string) {
  return Feature.findOne({ where: { id: featureId, deleted_at: null } });
}

export async function searchFeatures(keyword: string) {
  return Feature.findAll({
    where: {
      deleted_at: null,
      [Op.or]: [
        { title: { [Op.like]: `%${keyword}%` } },
        { code: { [Op.like]: `%${keyword}%` } },
        { summary: { [Op.like]: `%${keyword}%` } },
        { description: { [Op.like]: `%${keyword}%` } },
      ],
    },
    order: [['updated_at', 'DESC']],
    limit: 50,
  });
}

export async function createFeature(params: {
  nodeId: string;
  title: string;
  code: string;
  summary?: string;
  description?: string;
  platform?: string;
  priority?: string;
  operatorId: string;
  operatorUsername: string;
  ipAddress?: string;
}) {
  const node = await FeatureNode.findOne({ where: { id: params.nodeId, deleted_at: null } });
  if (!node) throw new AppError('NOT_FOUND', '节点不存在');

  const existing = await Feature.findOne({ where: { code: params.code, deleted_at: null } });
  if (existing) throw new AppError('CONFLICT', '特征编码已存在');

  const feature = await Feature.create({
    id: uuidv4(),
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

  await logAudit({
    userId: params.operatorId,
    action: 'create_feature', targetType: 'feature', targetId: feature.id, targetName: feature.title,
    ipAddress: params.ipAddress,
  });
  return feature;
}

export async function updateFeature(params: {
  featureId: string;
  title?: string;
  summary?: string | null;
  description?: string | null;
  platform?: string | null;
  priority?: string | null;
  expectedUpdatedAt?: Date | null;
  operatorId: string;
  operatorUsername: string;
  ipAddress?: string;
}) {
  const feature = await Feature.findOne({ where: { id: params.featureId, deleted_at: null } });
  if (!feature) throw new AppError('NOT_FOUND', '特征不存在');

  if (params.expectedUpdatedAt) {
    const expected = new Date(params.expectedUpdatedAt).getTime();
    const actual = new Date(feature.updated_at).getTime();
    if (Math.abs(expected - actual) > 1000) {
      throw new AppError('CONFLICT', '数据已被他人修改，请刷新后重试');
    }
  }

  const updates: Record<string, unknown> = { updated_by: params.operatorId, updated_at: new Date() };
  if (params.title !== undefined) updates.title = params.title;
  if (params.summary !== undefined) updates.summary = params.summary;
  if (params.description !== undefined) updates.description = params.description;
  if (params.platform !== undefined) updates.platform = params.platform;
  if (params.priority !== undefined) updates.priority = params.priority;

  await Feature.update(updates, { where: { id: params.featureId } });
  const updated = await Feature.findByPk(params.featureId);

  await logAudit({
    userId: params.operatorId,
    action: 'update_feature', targetType: 'feature', targetId: params.featureId,
    ipAddress: params.ipAddress,
  });
  return updated!;
}

export async function deleteFeature(featureId: string, operatorId: string, operatorUsername: string, ipAddress?: string) {
  const feature = await Feature.findOne({ where: { id: featureId, deleted_at: null } });
  if (!feature) throw new AppError('NOT_FOUND', '特征不存在');

  await Feature.update({ deleted_at: new Date(), updated_by: operatorId }, { where: { id: featureId } });
  await logAudit({ userId: operatorId, action: 'delete_feature', targetType: 'feature', targetId: featureId, ipAddress });
}

export async function hideFeature(featureId: string, operatorId: string, operatorUsername: string, ipAddress?: string) {
  const feature = await Feature.findOne({ where: { id: featureId, deleted_at: null } });
  if (!feature) throw new AppError('NOT_FOUND', '特征不存在');

  await Feature.update({ is_visible: false, updated_by: operatorId, updated_at: new Date() }, { where: { id: featureId } });
  await logAudit({ userId: operatorId, action: 'hide_feature', targetType: 'feature', targetId: featureId, ipAddress });
}

export async function showFeature(featureId: string, operatorId: string, operatorUsername: string, ipAddress?: string) {
  const feature = await Feature.findOne({ where: { id: featureId, deleted_at: null } });
  if (!feature) throw new AppError('NOT_FOUND', '特征不存在');

  await Feature.update({ is_visible: true, updated_by: operatorId, updated_at: new Date() }, { where: { id: featureId } });
  await logAudit({ userId: operatorId, action: 'show_feature', targetType: 'feature', targetId: featureId, ipAddress });
}

export async function copyFeature(featureId: string, targetNodeId: string | null, operatorId: string, operatorUsername: string, ipAddress?: string) {
  const feature = await Feature.findOne({ where: { id: featureId, deleted_at: null } });
  if (!feature) throw new AppError('NOT_FOUND', '特征不存在');

  const copyOpId = uuidv4();
  const suffix = copyOpId.replace(/-/g, '').slice(0, 6);
  const newCode = `${feature.code}_copy_${suffix}`;
  const nodeId = targetNodeId ?? feature.node_id;

  const newFeature = await Feature.create({
    id: uuidv4(),
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

  await logAudit({ userId: operatorId, action: 'copy_feature', targetType: 'feature', targetId: featureId, ipAddress });
  return newFeature;
}

export async function moveFeature(featureId: string, targetNodeId: string, operatorId: string, operatorUsername: string, ipAddress?: string) {
  const feature = await Feature.findOne({ where: { id: featureId, deleted_at: null } });
  if (!feature) throw new AppError('NOT_FOUND', '特征不存在');

  const targetNode = await FeatureNode.findOne({ where: { id: targetNodeId, deleted_at: null } });
  if (!targetNode) throw new AppError('NOT_FOUND', '目标节点不存在');

  const moveOpId = uuidv4();

  await Feature.update(
    {
      node_id: targetNodeId,
      moved_from_node_id: feature.node_id,
      move_operation_id: moveOpId,
      last_moved_at: new Date(),
      updated_by: operatorId,
      updated_at: new Date(),
    },
    { where: { id: featureId } }
  );

  const updated = await Feature.findByPk(featureId);
  await logAudit({ userId: operatorId, action: 'move_feature', targetType: 'feature', targetId: featureId, ipAddress });
  return updated!;
}
