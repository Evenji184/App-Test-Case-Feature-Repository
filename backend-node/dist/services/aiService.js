"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listProviders = listProviders;
exports.createProvider = createProvider;
exports.updateProvider = updateProvider;
exports.deleteProvider = deleteProvider;
exports.testAiConnection = testAiConnection;
exports.generatePrompt = generatePrompt;
exports.savePrompt = savePrompt;
exports.listPrompts = listPrompts;
exports.deletePrompt = deletePrompt;
exports.updatePromptName = updatePromptName;
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
const models_1 = require("../db/models");
const encryption_1 = require("../utils/encryption");
const audit_1 = require("../utils/audit");
const authService_1 = require("./authService");
const providerClient_1 = require("./providerClient");
async function listProviders() {
    return models_1.AiProvider.findAll({
        where: { deleted_at: null },
        order: [['created_at', 'ASC']],
    });
}
async function createProvider(params) {
    if (params.isDefault) {
        await models_1.AiProvider.update({ is_default: false }, { where: { deleted_at: null } });
    }
    const apiKeyEncrypted = params.apiKey ? (0, encryption_1.encryptApiKey)(params.apiKey) : null;
    const apiKeyHint = params.apiKey ? (0, encryption_1.maskApiKey)(params.apiKey) : '';
    const provider = await models_1.AiProvider.create({
        id: (0, uuid_1.v4)(),
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
    await (0, audit_1.logAudit)({
        userId: params.operatorId,
        action: 'create_ai_provider',
        targetType: 'ai_provider',
        targetId: provider.id,
        targetName: provider.name,
        ipAddress: params.ipAddress,
    });
    return provider;
}
async function updateProvider(params) {
    const provider = await models_1.AiProvider.findOne({ where: { id: params.providerId, deleted_at: null } });
    if (!provider)
        throw new authService_1.AppError('NOT_FOUND', 'AI 供应商不存在');
    if (params.isDefault) {
        await models_1.AiProvider.update({ is_default: false }, { where: { deleted_at: null } });
    }
    const updates = { updated_by: params.operatorId, updated_at: new Date() };
    if (params.name !== undefined)
        updates.name = params.name;
    if (params.requestUrl !== undefined)
        updates.request_url = params.requestUrl;
    if (params.modelName !== undefined)
        updates.model_name = params.modelName;
    if (params.isDefault !== undefined)
        updates.is_default = params.isDefault;
    if (params.description !== undefined)
        updates.remark = params.description;
    if (params.apiKey !== undefined) {
        if (params.apiKey === null || params.apiKey === '') {
            updates.api_key_encrypted = null;
            updates.api_key_hint = '';
        }
        else {
            updates.api_key_encrypted = (0, encryption_1.encryptApiKey)(params.apiKey);
            updates.api_key_hint = (0, encryption_1.maskApiKey)(params.apiKey);
        }
    }
    await models_1.AiProvider.update(updates, { where: { id: params.providerId } });
    const updated = await models_1.AiProvider.findByPk(params.providerId);
    await (0, audit_1.logAudit)({
        userId: params.operatorId,
        action: 'update_ai_provider',
        targetType: 'ai_provider',
        targetId: params.providerId,
        ipAddress: params.ipAddress,
    });
    return updated;
}
async function deleteProvider(providerId, operatorId, operatorUsername, ipAddress) {
    const provider = await models_1.AiProvider.findOne({ where: { id: providerId, deleted_at: null } });
    if (!provider)
        throw new authService_1.AppError('NOT_FOUND', 'AI 供应商不存在');
    await models_1.AiProvider.update({ deleted_at: new Date(), updated_by: operatorId }, { where: { id: providerId } });
    await (0, audit_1.logAudit)({ userId: operatorId, action: 'delete_ai_provider', targetType: 'ai_provider', targetId: providerId, ipAddress });
}
async function testAiConnection(providerId) {
    const provider = await models_1.AiProvider.findOne({ where: { id: providerId, deleted_at: null } });
    if (!provider)
        throw new authService_1.AppError('NOT_FOUND', 'AI 供应商不存在');
    if (!provider.api_key_encrypted)
        throw new authService_1.AppError('VALIDATION_ERROR', '未配置 API Key');
    if (!provider.model_name)
        throw new authService_1.AppError('VALIDATION_ERROR', '未配置模型名称');
    const apiKey = (0, encryption_1.decryptApiKey)(provider.api_key_encrypted);
    const testMessages = [{ role: 'user', content: 'Hello, please reply with "OK".' }];
    if (provider.provider_format === 'anthropic') {
        await (0, providerClient_1.callAnthropic)({
            requestUrl: provider.request_url,
            apiKey,
            modelName: provider.model_name,
            messages: testMessages,
        });
    }
    else {
        await (0, providerClient_1.callOpenAI)({
            requestUrl: provider.request_url,
            apiKey,
            modelName: provider.model_name,
            messages: testMessages,
        });
    }
}
function buildPromptText(nodes, features) {
    const parts = ['# 特征库数据\n'];
    for (const node of nodes) {
        const nodeFeatures = features.filter(f => f.node_id === node.id);
        if (!nodeFeatures.length)
            continue;
        parts.push(`## ${node.name} (${node.code})\n`);
        for (const feat of nodeFeatures) {
            parts.push(`### ${feat.title} [${feat.code}]`);
            if (feat.platform)
                parts.push(`平台: ${feat.platform}`);
            if (feat.priority)
                parts.push(`优先级: ${feat.priority}`);
            if (feat.summary)
                parts.push(`摘要: ${feat.summary}`);
            if (feat.description)
                parts.push(`详情: ${feat.description}`);
            parts.push('');
        }
    }
    return parts.join('\n');
}
async function generatePrompt(params) {
    let provider = null;
    if (params.providerId) {
        provider = await models_1.AiProvider.findOne({ where: { id: params.providerId, deleted_at: null, status: 'active' } });
    }
    else {
        provider = await models_1.AiProvider.findOne({ where: { deleted_at: null, is_default: true, status: 'active' } });
    }
    if (!provider)
        throw new authService_1.AppError('NOT_FOUND', '未找到可用的 AI 供应商');
    if (!provider.api_key_encrypted)
        throw new authService_1.AppError('VALIDATION_ERROR', '未配置 API Key');
    if (!provider.model_name)
        throw new authService_1.AppError('VALIDATION_ERROR', '未配置模型名称');
    const nodes = await models_1.FeatureNode.findAll({
        where: { id: { [sequelize_1.Op.in]: params.nodeIds }, deleted_at: null },
    });
    let features = [];
    if (params.featureIds && params.featureIds.length > 0) {
        features = await models_1.Feature.findAll({
            where: { id: { [sequelize_1.Op.in]: params.featureIds }, deleted_at: null },
        });
    }
    else {
        features = await models_1.Feature.findAll({
            where: { node_id: { [sequelize_1.Op.in]: params.nodeIds }, deleted_at: null, is_visible: true },
        });
    }
    const promptText = buildPromptText(nodes, features);
    const instruction = params.customInstruction || '请根据以上特征数据，生成详细的测试用例，包括正常流程和异常流程，覆盖主要功能点。';
    const messages = [
        { role: 'user', content: `${promptText}\n\n${instruction}` },
    ];
    const apiKey = (0, encryption_1.decryptApiKey)(provider.api_key_encrypted);
    let content;
    if (provider.provider_format === 'anthropic') {
        content = await (0, providerClient_1.callAnthropic)({
            requestUrl: provider.request_url,
            apiKey,
            modelName: provider.model_name,
            messages,
        });
    }
    else {
        content = await (0, providerClient_1.callOpenAI)({
            requestUrl: provider.request_url,
            apiKey,
            modelName: provider.model_name,
            messages,
        });
    }
    const prompt = await models_1.Prompt.create({
        id: (0, uuid_1.v4)(),
        content,
        model: provider.model_name,
        node_ids: params.nodeIds.join(','),
        feature_ids: params.featureIds?.join(',') ?? null,
        custom_instruction: params.customInstruction ?? null,
        provider_id: provider.id,
        created_by: params.operatorId,
        updated_by: params.operatorId,
    });
    await (0, audit_1.logAudit)({
        userId: params.operatorId,
        action: 'generate_prompt',
        targetType: 'prompt',
        targetId: prompt.id,
        ipAddress: params.ipAddress,
    });
    return prompt;
}
async function savePrompt(params) {
    return models_1.Prompt.create({
        id: (0, uuid_1.v4)(),
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
async function listPrompts(params) {
    const { keyword, page = 1, pageSize = 20 } = params;
    const where = { deleted_at: null };
    if (params.providerId)
        where.provider_id = params.providerId;
    if (keyword) {
        where[sequelize_1.Op.or] = [
            { name: { [sequelize_1.Op.like]: `%${keyword}%` } },
            { content: { [sequelize_1.Op.like]: `%${keyword}%` } },
        ];
    }
    const { count, rows } = await models_1.Prompt.findAndCountAll({
        where,
        order: [['created_at', 'DESC']],
        limit: pageSize,
        offset: (page - 1) * pageSize,
    });
    const providerIds = [...new Set(rows.map(r => r.provider_id).filter(Boolean))];
    const userIds = [...new Set(rows.map(r => r.created_by).filter(Boolean))];
    const providers = providerIds.length
        ? await models_1.AiProvider.findAll({ where: { id: { [sequelize_1.Op.in]: providerIds } } })
        : [];
    const users = userIds.length
        ? await models_1.User.findAll({ where: { id: { [sequelize_1.Op.in]: userIds } } })
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
async function deletePrompt(promptId, operatorId, operatorUsername, ipAddress) {
    const prompt = await models_1.Prompt.findOne({ where: { id: promptId, deleted_at: null } });
    if (!prompt)
        throw new authService_1.AppError('NOT_FOUND', '提示词不存在');
    await models_1.Prompt.update({ deleted_at: new Date(), updated_by: operatorId }, { where: { id: promptId } });
    await (0, audit_1.logAudit)({ userId: operatorId, action: 'delete_prompt', targetType: 'prompt', targetId: promptId, ipAddress });
}
async function updatePromptName(promptId, name, operatorId, operatorUsername, ipAddress) {
    const prompt = await models_1.Prompt.findOne({ where: { id: promptId, deleted_at: null } });
    if (!prompt)
        throw new authService_1.AppError('NOT_FOUND', '提示词不存在');
    await models_1.Prompt.update({ name, updated_by: operatorId, updated_at: new Date() }, { where: { id: promptId } });
    const updated = await models_1.Prompt.findByPk(promptId);
    await (0, audit_1.logAudit)({ userId: operatorId, action: 'update_prompt_name', targetType: 'prompt', targetId: promptId, ipAddress });
    return updated;
}
//# sourceMappingURL=aiService.js.map