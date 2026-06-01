"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolvers = void 0;
const authService_1 = require("../services/authService");
const userService_1 = require("../services/userService");
const roleService_1 = require("../services/roleService");
const rbacService_1 = require("../services/rbacService");
const nodeService_1 = require("../services/nodeService");
const featureService_1 = require("../services/featureService");
const aiService_1 = require("../services/aiService");
const logService_1 = require("../services/logService");
const helpers_1 = require("./helpers");
function buildPageInfo(total, page, pageSize) {
    const totalPages = Math.ceil(total / pageSize) || 1;
    return {
        total,
        page,
        pageSize,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
    };
}
function extractPagination(pagination) {
    const page = pagination?.page ?? 1;
    const pageSize = pagination?.pageSize ?? 20;
    return { page, pageSize };
}
function formatUser(user, roleIds) {
    return {
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.display_name,
        phone: user.phone ?? null,
        avatarUrl: user.avatar_url,
        status: user.status,
        isSuperAdmin: user.is_super_admin,
        roleIds,
        lastLoginAt: user.last_login_at,
        lastLoginIp: user.last_login_ip,
        remark: user.remark ?? null,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
    };
}
function formatRole(role, permissionIds) {
    return {
        id: role.id,
        name: role.name,
        code: role.code,
        description: role.description,
        isSystem: role.is_system,
        status: role.status,
        permissionIds,
        createdAt: role.created_at,
        updatedAt: role.updated_at,
    };
}
function formatNode(node, allNodes) {
    const children = allNodes
        ? allNodes.filter(n => n.parent_id === node.id).map(c => formatNode(c, allNodes))
        : [];
    return {
        id: node.id,
        parentId: node.parent_id,
        name: node.name,
        code: node.code,
        nodeType: node.node_type ?? null,
        path: node.path,
        level: node.level,
        sortOrder: node.sort_order,
        isVisible: node.is_visible,
        isLocked: node.is_locked ?? false,
        remark: node.remark ?? null,
        createdAt: node.created_at,
        updatedAt: node.updated_at,
        children,
    };
}
function formatFeature(f) {
    return {
        id: f.id,
        nodeId: f.node_id,
        title: f.title,
        code: f.code,
        summary: f.summary,
        description: f.description,
        platform: f.platform,
        priority: f.priority,
        status: f.status,
        version: f.version ?? null,
        tags: f.tags ?? null,
        isVisible: f.is_visible,
        isArchived: f.is_archived ?? false,
        remark: f.remark ?? null,
        createdAt: f.created_at,
        updatedAt: f.updated_at,
    };
}
function formatProvider(p) {
    return {
        id: p.id,
        name: p.name,
        providerFormat: p.provider_format,
        requestUrl: p.request_url,
        apiKeyHint: p.api_key_hint,
        modelName: p.model_name,
        websiteUrl: p.website_url ?? null,
        isDefault: p.is_default,
        status: p.status,
        remark: p.remark ?? null,
        createdAt: p.created_at,
        updatedAt: p.updated_at,
    };
}
exports.resolvers = {
    Query: {
        currentUser: async (_, __, ctx) => {
            if (!ctx.userId)
                return null;
            const result = await (0, userService_1.getUserWithRolesAndPermissions)(ctx.userId);
            if (!result)
                return null;
            return formatUser(result.user, result.roles.map(r => r.id));
        },
        userList: async (_, args, ctx) => {
            (0, helpers_1.requirePermission)(ctx, 'user:list');
            const { page, pageSize } = extractPagination(args.pagination);
            const result = await (0, userService_1.listUsers)({ keyword: args.keyword, page, pageSize });
            const items = await Promise.all(result.items.map(async (user) => {
                const data = await (0, userService_1.getUserWithRolesAndPermissions)(user.id);
                return formatUser(user, (data?.roles ?? []).map(r => r.id));
            }));
            return { items, pageInfo: buildPageInfo(result.total, page, pageSize) };
        },
        roleList: async (_, args, ctx) => {
            (0, helpers_1.requirePermission)(ctx, 'role:list');
            const { page, pageSize } = extractPagination(args.pagination);
            const result = await (0, roleService_1.listRoles)({ page, pageSize });
            const items = await Promise.all(result.items.map(async (role) => {
                const data = await (0, roleService_1.getRoleWithPermissions)(role.id);
                return formatRole(role, (data?.permissions ?? []).map(p => p.id));
            }));
            return { items, pageInfo: buildPageInfo(result.total, page, pageSize) };
        },
        permissionTree: async (_, __, ctx) => {
            (0, helpers_1.requirePermission)(ctx, 'permission:list');
            const tree = await (0, rbacService_1.getPermissionTree)();
            return tree.map((module) => ({
                module: module.module,
                resources: module.resources.map(resource => ({
                    resource: resource.resource,
                    permissions: resource.actions,
                })),
            }));
        },
        nodeTree: async (_, __, ctx) => {
            (0, helpers_1.requireAuth)(ctx);
            const nodes = await (0, nodeService_1.getNodeTree)();
            const rootNodes = nodes.filter(n => !n.parent_id);
            return rootNodes.map(n => formatNode(n, nodes));
        },
        nodeList: async (_, args, ctx) => {
            (0, helpers_1.requireAuth)(ctx);
            const { page, pageSize } = extractPagination(args.pagination);
            const result = await (0, nodeService_1.listNodes)({ page, pageSize });
            return { items: result.items.map(n => formatNode(n)), pageInfo: buildPageInfo(result.total, page, pageSize) };
        },
        nodeDetail: async (_, args, ctx) => {
            (0, helpers_1.requireAuth)(ctx);
            const node = await (0, nodeService_1.getNodeDetail)(args.nodeId);
            return node ? formatNode(node) : null;
        },
        searchNodes: async (_, args, ctx) => {
            (0, helpers_1.requireAuth)(ctx);
            const { page, pageSize } = extractPagination(args.pagination);
            const nodes = await (0, nodeService_1.searchNodes)(args.keyword);
            const sliced = nodes.slice((page - 1) * pageSize, page * pageSize);
            return { items: sliced.map(n => formatNode(n)), pageInfo: buildPageInfo(nodes.length, page, pageSize) };
        },
        featureList: async (_, args, ctx) => {
            (0, helpers_1.requireAuth)(ctx);
            const { page, pageSize } = extractPagination(args.pagination);
            const result = await (0, featureService_1.listFeatures)({ nodeIds: args.nodeIds, includeHidden: args.includeHidden, page, pageSize });
            return { items: result.items.map(formatFeature), pageInfo: buildPageInfo(result.total, page, pageSize) };
        },
        featureDetail: async (_, args, ctx) => {
            (0, helpers_1.requireAuth)(ctx);
            const feature = await (0, featureService_1.getFeatureDetail)(args.featureId);
            return feature ? formatFeature(feature) : null;
        },
        searchFeatures: async (_, args, ctx) => {
            (0, helpers_1.requireAuth)(ctx);
            const { page, pageSize } = extractPagination(args.pagination);
            const features = await (0, featureService_1.searchFeatures)(args.keyword);
            const sliced = features.slice((page - 1) * pageSize, page * pageSize);
            return { items: sliced.map(formatFeature), pageInfo: buildPageInfo(features.length, page, pageSize) };
        },
        auditLogList: async (_, args, ctx) => {
            (0, helpers_1.requirePermission)(ctx, 'log:audit:list');
            const result = await (0, logService_1.listAuditLogs)(args);
            return {
                total: result.total,
                items: result.items.map((l) => ({
                    id: l.id, operatorId: l.user_id, operatorUsername: l.operatorUsername,
                    action: l.action, resourceType: l.target_type, resourceId: l.target_id,
                    resourceName: l.target_name, detail: l.change_summary, ipAddress: l.ip_address, createdAt: l.created_at,
                })),
            };
        },
        requestLogList: async (_, args, ctx) => {
            (0, helpers_1.requirePermission)(ctx, 'log:request:list');
            const result = await (0, logService_1.listRequestLogs)(args);
            return {
                total: result.total,
                items: result.items.map((l) => ({
                    id: l.id, method: l.method, path: l.path, ipAddress: l.ip_address,
                    userId: l.user_id, username: l.username, statusCode: l.response_status,
                    responseTimeMs: l.duration_ms, userAgent: l.user_agent, createdAt: l.created_at,
                })),
            };
        },
        loginLogList: async (_, args, ctx) => {
            (0, helpers_1.requirePermission)(ctx, 'log:login:list');
            const result = await (0, logService_1.listLoginLogs)(args);
            return {
                total: result.total,
                items: result.items.map(l => ({
                    id: l.id, userId: l.user_id, username: l.username, success: l.login_status === 'success',
                    ipAddress: l.ip_address, userAgent: l.user_agent, failureReason: l.failure_reason, createdAt: l.occurred_at,
                })),
            };
        },
        aiProviderList: async (_, args, ctx) => {
            (0, helpers_1.requirePermission)(ctx, 'ai:provider:list');
            const { page, pageSize } = extractPagination(args.pagination);
            const providers = await (0, aiService_1.listProviders)();
            const sliced = providers.slice((page - 1) * pageSize, page * pageSize);
            return { items: sliced.map(formatProvider), pageInfo: buildPageInfo(providers.length, page, pageSize) };
        },
        promptList: async (_, args, ctx) => {
            (0, helpers_1.requirePermission)(ctx, 'ai:prompt:list');
            const { page, pageSize } = extractPagination(args.pagination);
            const result = await (0, aiService_1.listPrompts)({ keyword: args.keyword, page, pageSize });
            const items = result.items.map((p) => ({
                id: p.id,
                name: p.name,
                content: p.content,
                model: p.model,
                providerId: p.provider ? p.provider.id : null,
                providerName: p.provider ? p.provider.name : null,
                createdById: p.createdByUser ? p.createdByUser.id : null,
                createdByName: p.createdByUser
                    ? (p.createdByUser.display_name ?? p.createdByUser.username)
                    : null,
                nodeIds: p.node_ids,
                featureIds: p.feature_ids,
                customInstruction: p.custom_instruction,
                createdAt: p.created_at,
                updatedAt: p.updated_at,
            }));
            return { items, pageInfo: buildPageInfo(result.total, page, pageSize) };
        },
    },
    Mutation: {
        login: async (_, args, ctx) => {
            try {
                const result = await (0, authService_1.authenticate)(args.username, args.password, ctx.ipAddress, ctx.req.headers['user-agent']);
                return {
                    success: true,
                    message: '登录成功',
                    error: null,
                    data: {
                        accessToken: result.token,
                        tokenType: 'Bearer',
                        permissions: result.user.permissions,
                        user: {
                            id: result.user.id,
                            username: result.user.username,
                            email: result.user.email,
                            displayName: result.user.fullName,
                            status: 'active',
                            isSuperAdmin: result.user.isSuperAdmin,
                        },
                    },
                };
            }
            catch (err) {
                return { ...(0, helpers_1.makeErrorResult)(err), data: null };
            }
        },
        logout: async (_, __, ctx) => {
            return { success: true, message: '已退出登录', error: null };
        },
        resetPassword: async (_, args, ctx) => {
            try {
                (0, helpers_1.requirePermission)(ctx, 'user:manage');
                await (0, authService_1.resetPassword)(args.userId, args.newPassword, ctx.userId, ctx.username, ctx.ipAddress);
                return { success: true, message: '密码重置成功', error: null };
            }
            catch (err) {
                return (0, helpers_1.makeErrorResult)(err);
            }
        },
        changeMyPassword: async (_, args, ctx) => {
            try {
                (0, helpers_1.requireAuth)(ctx);
                await (0, authService_1.changeMyPassword)(ctx.userId, args.oldPassword, args.newPassword);
                return { success: true, message: '密码修改成功', error: null };
            }
            catch (err) {
                return (0, helpers_1.makeErrorResult)(err);
            }
        },
        createUser: async (_, args, ctx) => {
            try {
                (0, helpers_1.requirePermission)(ctx, 'user:manage');
                const user = await (0, userService_1.createUser)({
                    username: args.input.username,
                    password: args.input.password,
                    email: args.input.email,
                    fullName: args.input.displayName,
                    operatorId: ctx.userId,
                    operatorUsername: ctx.username,
                    ipAddress: ctx.ipAddress,
                });
                const data = await (0, userService_1.getUserWithRolesAndPermissions)(user.id);
                return { success: true, message: '用户创建成功', error: null, data: formatUser(data.user, data.roles.map(r => r.id)) };
            }
            catch (err) {
                return { ...(0, helpers_1.makeErrorResult)(err), data: null };
            }
        },
        updateUser: async (_, args, ctx) => {
            try {
                (0, helpers_1.requirePermission)(ctx, 'user:manage');
                const user = await (0, userService_1.updateUser)({
                    userId: args.userId,
                    email: args.input.email,
                    fullName: args.input.displayName,
                    operatorId: ctx.userId,
                    operatorUsername: ctx.username,
                    ipAddress: ctx.ipAddress,
                });
                const data = await (0, userService_1.getUserWithRolesAndPermissions)(user.id);
                return { success: true, message: '用户更新成功', error: null, data: formatUser(data.user, data.roles.map(r => r.id)) };
            }
            catch (err) {
                return { ...(0, helpers_1.makeErrorResult)(err), data: null };
            }
        },
        enableUser: async (_, args, ctx) => {
            try {
                (0, helpers_1.requirePermission)(ctx, 'user:manage');
                await (0, userService_1.enableUser)(args.userId, ctx.userId, ctx.username, ctx.ipAddress);
                return { success: true, message: '用户已启用', error: null };
            }
            catch (err) {
                return (0, helpers_1.makeErrorResult)(err);
            }
        },
        disableUser: async (_, args, ctx) => {
            try {
                (0, helpers_1.requirePermission)(ctx, 'user:manage');
                await (0, userService_1.disableUser)(args.userId, ctx.userId, ctx.username, ctx.ipAddress);
                return { success: true, message: '用户已禁用', error: null };
            }
            catch (err) {
                return (0, helpers_1.makeErrorResult)(err);
            }
        },
        assignRolesToUser: async (_, args, ctx) => {
            try {
                (0, helpers_1.requirePermission)(ctx, 'user:manage');
                await (0, userService_1.assignRolesToUser)(args.userId, args.roleIds, ctx.userId, ctx.username, ctx.ipAddress);
                return { success: true, message: '角色分配成功', error: null };
            }
            catch (err) {
                return (0, helpers_1.makeErrorResult)(err);
            }
        },
        deleteUser: async (_, args, ctx) => {
            try {
                (0, helpers_1.requirePermission)(ctx, 'user:manage');
                await (0, userService_1.deleteUser)(args.userId, ctx.userId, ctx.username, ctx.ipAddress);
                return { success: true, message: '用户删除成功', error: null };
            }
            catch (err) {
                return (0, helpers_1.makeErrorResult)(err);
            }
        },
        createRole: async (_, args, ctx) => {
            try {
                (0, helpers_1.requirePermission)(ctx, 'role:manage');
                const role = await (0, roleService_1.createRole)({ ...args.input, operatorId: ctx.userId, operatorUsername: ctx.username, ipAddress: ctx.ipAddress });
                return { success: true, message: '角色创建成功', error: null, data: formatRole(role, []) };
            }
            catch (err) {
                return { ...(0, helpers_1.makeErrorResult)(err), data: null };
            }
        },
        updateRole: async (_, args, ctx) => {
            try {
                (0, helpers_1.requirePermission)(ctx, 'role:manage');
                const role = await (0, roleService_1.updateRole)({ roleId: args.roleId, ...args.input, operatorId: ctx.userId, operatorUsername: ctx.username, ipAddress: ctx.ipAddress });
                const data = await (0, roleService_1.getRoleWithPermissions)(role.id);
                return { success: true, message: '角色更新成功', error: null, data: formatRole(role, (data?.permissions ?? []).map(p => p.id)) };
            }
            catch (err) {
                return { ...(0, helpers_1.makeErrorResult)(err), data: null };
            }
        },
        assignPermissionsToRole: async (_, args, ctx) => {
            try {
                (0, helpers_1.requirePermission)(ctx, 'role:manage');
                await (0, roleService_1.assignPermissionsToRole)(args.roleId, args.permissionIds, ctx.userId, ctx.username, ctx.ipAddress);
                return { success: true, message: '权限分配成功', error: null };
            }
            catch (err) {
                return (0, helpers_1.makeErrorResult)(err);
            }
        },
        deleteRole: async (_, args, ctx) => {
            try {
                (0, helpers_1.requirePermission)(ctx, 'role:manage');
                await (0, roleService_1.deleteRole)(args.roleId, ctx.userId, ctx.username, ctx.ipAddress);
                return { success: true, message: '角色删除成功', error: null };
            }
            catch (err) {
                return (0, helpers_1.makeErrorResult)(err);
            }
        },
        createNode: async (_, args, ctx) => {
            try {
                (0, helpers_1.requirePermission)(ctx, 'feature:node:manage');
                const node = await (0, nodeService_1.createNode)({
                    name: args.input.name,
                    code: args.input.code,
                    description: args.input.remark,
                    parentId: args.input.parentId,
                    sortOrder: args.input.sortOrder,
                    operatorId: ctx.userId,
                    operatorUsername: ctx.username,
                    ipAddress: ctx.ipAddress,
                });
                return { success: true, message: '节点创建成功', error: null, data: formatNode(node) };
            }
            catch (err) {
                return { ...(0, helpers_1.makeErrorResult)(err), data: null };
            }
        },
        updateNode: async (_, args, ctx) => {
            try {
                (0, helpers_1.requirePermission)(ctx, 'feature:node:manage');
                const node = await (0, nodeService_1.updateNode)({
                    nodeId: args.nodeId,
                    name: args.input.name,
                    code: args.input.code,
                    description: args.input.remark,
                    parentId: args.input.parentId,
                    sortOrder: args.input.sortOrder,
                    operatorId: ctx.userId,
                    operatorUsername: ctx.username,
                    ipAddress: ctx.ipAddress,
                });
                return { success: true, message: '节点更新成功', error: null, data: formatNode(node) };
            }
            catch (err) {
                return { ...(0, helpers_1.makeErrorResult)(err), data: null };
            }
        },
        deleteNode: async (_, args, ctx) => {
            try {
                (0, helpers_1.requirePermission)(ctx, 'feature:node:manage');
                await (0, nodeService_1.deleteNode)(args.nodeId, ctx.userId, ctx.username, ctx.ipAddress);
                return { success: true, message: '节点删除成功', error: null };
            }
            catch (err) {
                return (0, helpers_1.makeErrorResult)(err);
            }
        },
        hideNode: async (_, args, ctx) => {
            try {
                (0, helpers_1.requirePermission)(ctx, 'feature:node:manage');
                await (0, nodeService_1.hideNode)(args.nodeId, ctx.userId, ctx.username, ctx.ipAddress);
                return { success: true, message: '节点已隐藏', error: null };
            }
            catch (err) {
                return (0, helpers_1.makeErrorResult)(err);
            }
        },
        showNode: async (_, args, ctx) => {
            try {
                (0, helpers_1.requirePermission)(ctx, 'feature:node:manage');
                await (0, nodeService_1.showNode)(args.nodeId, ctx.userId, ctx.username, ctx.ipAddress);
                return { success: true, message: '节点已显示', error: null };
            }
            catch (err) {
                return (0, helpers_1.makeErrorResult)(err);
            }
        },
        copyNode: async (_, args, ctx) => {
            try {
                (0, helpers_1.requirePermission)(ctx, 'feature:node:manage');
                const node = await (0, nodeService_1.copyNode)(args.nodeId, ctx.userId, ctx.username, ctx.ipAddress);
                return { success: true, message: '节点复制成功', error: null, data: formatNode(node) };
            }
            catch (err) {
                return { ...(0, helpers_1.makeErrorResult)(err), data: null };
            }
        },
        moveNode: async (_, args, ctx) => {
            try {
                (0, helpers_1.requirePermission)(ctx, 'feature:node:manage');
                const node = await (0, nodeService_1.moveNode)(args.nodeId, args.targetParentId ?? null, ctx.userId, ctx.username, ctx.ipAddress);
                return { success: true, message: '节点移动成功', error: null, data: formatNode(node) };
            }
            catch (err) {
                return { ...(0, helpers_1.makeErrorResult)(err), data: null };
            }
        },
        createFeature: async (_, args, ctx) => {
            try {
                (0, helpers_1.requirePermission)(ctx, 'feature:manage');
                const feature = await (0, featureService_1.createFeature)({ ...args.input, operatorId: ctx.userId, operatorUsername: ctx.username, ipAddress: ctx.ipAddress });
                return { success: true, message: '特征创建成功', error: null, data: formatFeature(feature) };
            }
            catch (err) {
                return { ...(0, helpers_1.makeErrorResult)(err), data: null };
            }
        },
        updateFeature: async (_, args, ctx) => {
            try {
                (0, helpers_1.requirePermission)(ctx, 'feature:manage');
                const feature = await (0, featureService_1.updateFeature)({
                    featureId: args.featureId,
                    ...args.input,
                    expectedUpdatedAt: args.expectedUpdatedAt ? new Date(args.expectedUpdatedAt) : undefined,
                    operatorId: ctx.userId,
                    operatorUsername: ctx.username,
                    ipAddress: ctx.ipAddress,
                });
                return { success: true, message: '特征更新成功', error: null, data: formatFeature(feature) };
            }
            catch (err) {
                return { ...(0, helpers_1.makeErrorResult)(err), data: null };
            }
        },
        deleteFeature: async (_, args, ctx) => {
            try {
                (0, helpers_1.requirePermission)(ctx, 'feature:manage');
                await (0, featureService_1.deleteFeature)(args.featureId, ctx.userId, ctx.username, ctx.ipAddress);
                return { success: true, message: '特征删除成功', error: null };
            }
            catch (err) {
                return (0, helpers_1.makeErrorResult)(err);
            }
        },
        hideFeature: async (_, args, ctx) => {
            try {
                (0, helpers_1.requirePermission)(ctx, 'feature:manage');
                await (0, featureService_1.hideFeature)(args.featureId, ctx.userId, ctx.username, ctx.ipAddress);
                return { success: true, message: '特征已隐藏', error: null };
            }
            catch (err) {
                return (0, helpers_1.makeErrorResult)(err);
            }
        },
        showFeature: async (_, args, ctx) => {
            try {
                (0, helpers_1.requirePermission)(ctx, 'feature:manage');
                await (0, featureService_1.showFeature)(args.featureId, ctx.userId, ctx.username, ctx.ipAddress);
                return { success: true, message: '特征已显示', error: null };
            }
            catch (err) {
                return (0, helpers_1.makeErrorResult)(err);
            }
        },
        copyFeature: async (_, args, ctx) => {
            try {
                (0, helpers_1.requirePermission)(ctx, 'feature:manage');
                const feature = await (0, featureService_1.copyFeature)(args.featureId, args.targetNodeId ?? null, ctx.userId, ctx.username, ctx.ipAddress);
                return { success: true, message: '特征复制成功', error: null, data: formatFeature(feature) };
            }
            catch (err) {
                return { ...(0, helpers_1.makeErrorResult)(err), data: null };
            }
        },
        moveFeature: async (_, args, ctx) => {
            try {
                (0, helpers_1.requirePermission)(ctx, 'feature:manage');
                const feature = await (0, featureService_1.moveFeature)(args.featureId, args.targetNodeId, ctx.userId, ctx.username, ctx.ipAddress);
                return { success: true, message: '特征移动成功', error: null, data: formatFeature(feature) };
            }
            catch (err) {
                return { ...(0, helpers_1.makeErrorResult)(err), data: null };
            }
        },
        createAiProvider: async (_, args, ctx) => {
            try {
                (0, helpers_1.requirePermission)(ctx, 'ai:provider:manage');
                const provider = await (0, aiService_1.createProvider)({
                    name: args.input.name,
                    providerFormat: args.input.providerFormat,
                    requestUrl: args.input.requestUrl,
                    apiKey: args.input.apiKey,
                    modelName: args.input.modelName,
                    isDefault: args.input.isDefault,
                    description: args.input.remark,
                    operatorId: ctx.userId,
                    operatorUsername: ctx.username,
                    ipAddress: ctx.ipAddress,
                });
                return { success: true, message: 'AI 供应商创建成功', error: null, data: formatProvider(provider) };
            }
            catch (err) {
                return { ...(0, helpers_1.makeErrorResult)(err), data: null };
            }
        },
        updateAiProvider: async (_, args, ctx) => {
            try {
                (0, helpers_1.requirePermission)(ctx, 'ai:provider:manage');
                const provider = await (0, aiService_1.updateProvider)({
                    providerId: args.providerId,
                    name: args.input.name,
                    requestUrl: args.input.requestUrl,
                    apiKey: args.input.apiKey,
                    modelName: args.input.modelName,
                    isDefault: args.input.isDefault,
                    description: args.input.remark,
                    operatorId: ctx.userId,
                    operatorUsername: ctx.username,
                    ipAddress: ctx.ipAddress,
                });
                return { success: true, message: 'AI 供应商更新成功', error: null, data: formatProvider(provider) };
            }
            catch (err) {
                return { ...(0, helpers_1.makeErrorResult)(err), data: null };
            }
        },
        deleteAiProvider: async (_, args, ctx) => {
            try {
                (0, helpers_1.requirePermission)(ctx, 'ai:provider:manage');
                await (0, aiService_1.deleteProvider)(args.providerId, ctx.userId, ctx.username, ctx.ipAddress);
                return { success: true, message: 'AI 供应商删除成功', error: null };
            }
            catch (err) {
                return (0, helpers_1.makeErrorResult)(err);
            }
        },
        testAiConnection: async (_, args, ctx) => {
            try {
                (0, helpers_1.requirePermission)(ctx, 'ai:provider:manage');
                await (0, aiService_1.testAiConnection)(args.providerId);
                return { success: true, message: '连接测试成功', error: null };
            }
            catch (err) {
                return (0, helpers_1.makeErrorResult)(err);
            }
        },
        generatePrompt: async (_, args, ctx) => {
            try {
                (0, helpers_1.requirePermission)(ctx, 'ai:generate');
                const result = await (0, aiService_1.generatePrompt)({ ...args.input, operatorId: ctx.userId, operatorUsername: ctx.username, ipAddress: ctx.ipAddress });
                return {
                    success: true,
                    message: '提示词生成成功',
                    error: null,
                    content: result.content ?? null,
                    model: result.model ?? null,
                    usage: null,
                };
            }
            catch (err) {
                return { ...(0, helpers_1.makeErrorResult)(err), content: null, model: null, usage: null };
            }
        },
        savePrompt: async (_, args, ctx) => {
            try {
                (0, helpers_1.requireAuth)(ctx);
                await (0, aiService_1.savePrompt)({ ...args.input, operatorId: ctx.userId });
                return { success: true, message: '提示词保存成功', error: null };
            }
            catch (err) {
                return (0, helpers_1.makeErrorResult)(err);
            }
        },
        deletePrompt: async (_, args, ctx) => {
            try {
                (0, helpers_1.requirePermission)(ctx, 'ai:prompt:manage');
                await (0, aiService_1.deletePrompt)(args.promptId, ctx.userId, ctx.username, ctx.ipAddress);
                return { success: true, message: '提示词删除成功', error: null };
            }
            catch (err) {
                return (0, helpers_1.makeErrorResult)(err);
            }
        },
        updatePromptName: async (_, args, ctx) => {
            try {
                (0, helpers_1.requirePermission)(ctx, 'ai:prompt:manage');
                await (0, aiService_1.updatePromptName)(args.promptId, args.name, ctx.userId, ctx.username, ctx.ipAddress);
                return { success: true, message: '提示词名称更新成功', error: null };
            }
            catch (err) {
                return (0, helpers_1.makeErrorResult)(err);
            }
        },
    },
};
//# sourceMappingURL=resolvers.js.map