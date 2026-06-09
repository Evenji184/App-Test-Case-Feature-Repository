import { Op } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import { AiProvider, Prompt, FeatureNode, Feature, User } from '../db/models';
import { encryptApiKey, decryptApiKey, maskApiKey } from '../utils/encryption';
import { logAudit } from '../utils/audit';
import { AppError } from './authService';
import { callOpenAI, callAnthropic } from './providerClient';

export async function listProviders() {
  return AiProvider.findAll({
    where: { deleted_at: null },
    order: [['created_at', 'ASC']],
  });
}

export async function createProvider(params: {
  name: string;
  providerFormat: string;
  requestUrl: string;
  apiKey?: string;
  modelName?: string;
  isDefault?: boolean;
  description?: string;
  operatorId: string;
  operatorUsername: string;
  ipAddress?: string;
}) {
  if (params.isDefault) {
    await AiProvider.update({ is_default: false }, { where: { deleted_at: null } });
  }

  const apiKeyEncrypted = params.apiKey ? encryptApiKey(params.apiKey) : null;
  const apiKeyHint = params.apiKey ? maskApiKey(params.apiKey) : '';

  const provider = await AiProvider.create({
    id: uuidv4(),
    name: params.name,
    provider_format: params.providerFormat ?? 'openai_compatible',
    request_url: params.requestUrl,
    api_key_encrypted: apiKeyEncrypted,
    api_key_hint: apiKeyHint,
    model_name: params.modelName ?? null,
    is_default: params.isDefault ?? false,
    status: 'active',
    remark: params.description ?? null,
    created_by: params.operatorId,
    updated_by: params.operatorId,
  });

  await logAudit({
    userId: params.operatorId,
    action: 'create_ai_provider',
    targetType: 'ai_provider',
    targetId: provider.id,
    targetName: provider.name,
    ipAddress: params.ipAddress,
  });
  return provider;
}

export async function updateProvider(params: {
  providerId: string;
  name?: string;
  requestUrl?: string;
  apiKey?: string | null;
  modelName?: string | null;
  isDefault?: boolean;
  description?: string | null;
  operatorId: string;
  operatorUsername: string;
  ipAddress?: string;
}) {
  const provider = await AiProvider.findOne({ where: { id: params.providerId, deleted_at: null } });
  if (!provider) throw new AppError('NOT_FOUND', 'AI 供应商不存在');

  if (params.isDefault) {
    await AiProvider.update({ is_default: false }, { where: { deleted_at: null } });
  }

  const updates: Record<string, unknown> = { updated_by: params.operatorId, updated_at: new Date() };
  if (params.name !== undefined) updates.name = params.name;
  if (params.requestUrl !== undefined) updates.request_url = params.requestUrl;
  if (params.modelName !== undefined) updates.model_name = params.modelName;
  if (params.isDefault !== undefined) updates.is_default = params.isDefault;
  if (params.description !== undefined) updates.remark = params.description;
  if (params.apiKey !== undefined) {
    if (params.apiKey === null || params.apiKey === '') {
      updates.api_key_encrypted = null;
      updates.api_key_hint = '';
    } else {
      updates.api_key_encrypted = encryptApiKey(params.apiKey);
      updates.api_key_hint = maskApiKey(params.apiKey);
    }
  }

  await AiProvider.update(updates, { where: { id: params.providerId } });
  const updated = await AiProvider.findByPk(params.providerId);

  await logAudit({
    userId: params.operatorId,
    action: 'update_ai_provider',
    targetType: 'ai_provider',
    targetId: params.providerId,
    ipAddress: params.ipAddress,
  });
  return updated!;
}

export async function deleteProvider(providerId: string, operatorId: string, operatorUsername: string, ipAddress?: string) {
  const provider = await AiProvider.findOne({ where: { id: providerId, deleted_at: null } });
  if (!provider) throw new AppError('NOT_FOUND', 'AI 供应商不存在');

  await AiProvider.update({ deleted_at: new Date(), updated_by: operatorId }, { where: { id: providerId } });
  await logAudit({ userId: operatorId, action: 'delete_ai_provider', targetType: 'ai_provider', targetId: providerId, ipAddress });
}

export async function testAiConnection(providerId: string) {
  const provider = await AiProvider.findOne({ where: { id: providerId, deleted_at: null } });
  if (!provider) throw new AppError('NOT_FOUND', 'AI 供应商不存在');
  if (!provider.api_key_encrypted) throw new AppError('VALIDATION_ERROR', '未配置 API Key');
  if (!provider.model_name) throw new AppError('VALIDATION_ERROR', '未配置模型名称');

  const apiKey = decryptApiKey(provider.api_key_encrypted);
  const testMessages = [{ role: 'user', content: 'Hello, please reply with "OK".' }];

  if (provider.provider_format === 'anthropic') {
    await callAnthropic({
      requestUrl: provider.request_url,
      apiKey,
      modelName: provider.model_name,
      messages: testMessages,
    });
  } else {
    await callOpenAI({
      requestUrl: provider.request_url,
      apiKey,
      modelName: provider.model_name,
      messages: testMessages,
    });
  }
}

function buildPromptText(nodes: FeatureNode[], features: Feature[]): string {
  const parts: string[] = ['# 特征库数据\n'];

  for (const node of nodes) {
    const nodeFeatures = features.filter(f => f.node_id === node.id);
    if (!nodeFeatures.length) continue;

    parts.push(`## ${node.name} (${node.code})\n`);
    for (const feat of nodeFeatures) {
      parts.push(`### ${feat.title} [${feat.code}]`);
      if (feat.platform) parts.push(`- 平台: ${feat.platform}`);
      if (feat.priority) parts.push(`- 优先级: ${feat.priority}`);
      if (feat.summary) parts.push(`- 摘要: ${feat.summary}`);
      if (feat.description) parts.push(`- 详情: ${feat.description}`);
      if (feat.tags) parts.push(`- 标签: ${feat.tags}`);
      parts.push('');
    }
  }

  return parts.join('\n');
}

export async function generatePrompt(params: {
  nodeIds: string[];
  featureIds?: string[];
  customInstruction?: string;
  providerId?: string;
  operatorId: string;
  operatorUsername: string;
  ipAddress?: string;
}) {
  let provider: AiProvider | null = null;
  if (params.providerId) {
    provider = await AiProvider.findOne({ where: { id: params.providerId, deleted_at: null, status: 'active' } });
  } else {
    provider = await AiProvider.findOne({ where: { deleted_at: null, is_default: true, status: 'active' } });
  }
  if (!provider) throw new AppError('NOT_FOUND', '未找到可用的 AI 供应商');
  if (!provider.api_key_encrypted) throw new AppError('VALIDATION_ERROR', '未配置 API Key');
  if (!provider.model_name) throw new AppError('VALIDATION_ERROR', '未配置模型名称');

  const nodes = await FeatureNode.findAll({
    where: { id: { [Op.in]: params.nodeIds }, deleted_at: null },
  });

  let features: Feature[] = [];
  if (params.featureIds && params.featureIds.length > 0) {
    features = await Feature.findAll({
      where: { id: { [Op.in]: params.featureIds }, deleted_at: null },
    });
  } else {
    features = await Feature.findAll({
      where: { node_id: { [Op.in]: params.nodeIds }, deleted_at: null, is_visible: true },
    });
  }

  const promptText = buildPromptText(nodes, features);
  const instruction = params.customInstruction || `你是一名资深软件测试工程师，擅长根据产品特征描述提炼测试要点。

请根据以上特征库数据，为每个特征生成一份测试分析提纲。

**输出规则：**
- 每个特征单独输出，特征之间用 --- 分隔
- 仅描述"要测什么"，不展开为具体的测试步骤和预期结果
- 测试要点按高/中/低三个优先级分组，每条用 [维度标签] 标注测试维度（功能/边界/异常/权限/并发/性能/兼容）
- 有平台字段时，在对应优先级组内直接标注平台差异点（iOS：… / Android：…），无平台字段或全平台无差异时省略
- 涉及系统权限才列权限要点，否则跳过；无并发风险则跳过并发；无性能/兼容隐患则省略对应条目
- 内容精炼，结合特征的标题/摘要/描述/标签给出针对性要点，禁止照搬描述原文或泛泛而谈
- 只输出 Markdown 正文，不输出任何前言、结语或多余解释

**模板（每个特征严格按此结构输出）：**

## {特征标题}（{特征编码}）

- **适用平台**：{iOS / Android / 全平台；无平台字段则填"全平台"}

**高优先级**
- [功能] {核心主流程与关键状态变化}
- [功能] {与其他模块的联动关系（如有）}
- [边界] {最关键的输入/数量/状态边界}
- [异常] {断网、服务端错误、操作中断等核心异常场景}
- {iOS/Android 平台差异（如有）}

**中优先级**
- [权限] {需申请的系统权限及降级策略（无则省略此条）}
- [并发] {多设备/多用户/重复操作的冲突场景（无则省略此条）}
- [边界] {次要边界：特殊字符、emoji、弱网等}
- [异常] {杀进程/切后台/来电中断后的恢复逻辑}
- {iOS/Android 平台差异（如有）}

**低优先级**
- [性能] {首屏加载、列表流畅度、流量/电量影响（无明显风险则省略）}
- [兼容] {最低系统版本、刘海屏/折叠屏、深色模式/大字号（无明显风险则省略）}
- {iOS/Android 平台差异（如有）}

---`;

  const messages = [
    { role: 'user', content: `${promptText}\n\n${instruction}` },
  ];

  const apiKey = decryptApiKey(provider.api_key_encrypted);
  let content: string;

  if (provider.provider_format === 'anthropic') {
    content = await callAnthropic({
      requestUrl: provider.request_url,
      apiKey,
      modelName: provider.model_name,
      messages,
    });
  } else {
    content = await callOpenAI({
      requestUrl: provider.request_url,
      apiKey,
      modelName: provider.model_name,
      messages,
    });
  }

  const prompt = await Prompt.create({
    id: uuidv4(),
    content,
    model: provider.model_name,
    node_ids: params.nodeIds.join(','),
    feature_ids: params.featureIds?.join(',') ?? null,
    custom_instruction: params.customInstruction ?? null,
    provider_id: provider.id,
    created_by: params.operatorId,
    updated_by: params.operatorId,
  });

  await logAudit({
    userId: params.operatorId,
    action: 'generate_prompt',
    targetType: 'prompt',
    targetId: prompt.id,
    ipAddress: params.ipAddress,
  });

  return prompt;
}

export async function savePrompt(params: {
  content: string;
  model?: string;
  name?: string;
  nodeIds?: string;
  featureIds?: string;
  customInstruction?: string;
  operatorId: string;
}) {
  return Prompt.create({
    id: uuidv4(),
    content: params.content,
    model: params.model ?? null,
    name: params.name ?? null,
    node_ids: params.nodeIds ?? null,
    feature_ids: params.featureIds ?? null,
    custom_instruction: params.customInstruction ?? null,
    provider_id: null,
    created_by: params.operatorId,
    updated_by: params.operatorId,
  });
}

export async function listPrompts(params: {
  providerId?: string;
  keyword?: string;
  createdBy?: string;
  page?: number;
  pageSize?: number;
}) {
  const { keyword, createdBy, page = 1, pageSize = 20 } = params;
  const where: Record<string, unknown> = { deleted_at: null };
  if (params.providerId) where.provider_id = params.providerId;
  if (createdBy) where.created_by = createdBy;
  if (keyword) {
    where[Op.or as unknown as string] = [
      { name: { [Op.like]: `%${keyword}%` } },
      { content: { [Op.like]: `%${keyword}%` } },
    ];
  }

  const { count, rows } = await Prompt.findAndCountAll({
    where,
    order: [['created_at', 'DESC']],
    limit: pageSize,
    offset: (page - 1) * pageSize,
  });

  const providerIds = [...new Set(rows.map(r => r.provider_id).filter(Boolean) as string[])];
  const userIds = [...new Set(rows.map(r => r.created_by).filter(Boolean) as string[])];

  const providers = providerIds.length
    ? await AiProvider.findAll({ where: { id: { [Op.in]: providerIds } } })
    : [];
  const users = userIds.length
    ? await User.findAll({ where: { id: { [Op.in]: userIds } } })
    : [];

  const providerMap = new Map(providers.map(p => [p.id, p]));
  const userMap = new Map(users.map(u => [u.id, u]));

  const items = rows.map(p => ({
    ...p.toJSON(),
    provider: p.provider_id ? providerMap.get(p.provider_id) ?? null : null,
    createdByUser: p.created_by ? userMap.get(p.created_by) ?? null : null,
  }));

  return { total: count, items };
}

export async function deletePrompt(promptId: string, operatorId: string, operatorUsername: string, ipAddress?: string) {
  const prompt = await Prompt.findOne({ where: { id: promptId, deleted_at: null } });
  if (!prompt) throw new AppError('NOT_FOUND', '提示词不存在');

  await Prompt.update({ deleted_at: new Date(), updated_by: operatorId }, { where: { id: promptId } });
  await logAudit({ userId: operatorId, action: 'delete_prompt', targetType: 'prompt', targetId: promptId, ipAddress });
}

export async function updatePromptName(promptId: string, name: string, operatorId: string, operatorUsername: string, ipAddress?: string) {
  const prompt = await Prompt.findOne({ where: { id: promptId, deleted_at: null } });
  if (!prompt) throw new AppError('NOT_FOUND', '提示词不存在');

  await Prompt.update({ name, updated_by: operatorId, updated_at: new Date() }, { where: { id: promptId } });
  const updated = await Prompt.findByPk(promptId);

  await logAudit({ userId: operatorId, action: 'update_prompt_name', targetType: 'prompt', targetId: promptId, ipAddress });
  return updated!;
}

export async function getPromptById(promptId: string) {
  const prompt = await Prompt.findOne({ where: { id: promptId, deleted_at: null } });
  if (!prompt) throw new AppError('NOT_FOUND', '提示词不存在');

  const [provider, createdByUser] = await Promise.all([
    prompt.provider_id ? AiProvider.findByPk(prompt.provider_id) : null,
    prompt.created_by ? User.findByPk(prompt.created_by) : null,
  ]);

  return {
    ...prompt.toJSON(),
    provider: provider ?? null,
    createdByUser: createdByUser ?? null,
  };
}
