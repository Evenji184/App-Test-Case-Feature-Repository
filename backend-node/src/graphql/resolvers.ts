import { authenticate, changeMyPassword, resetPassword } from '../services/authService';
import { listUsers, getUserWithRolesAndPermissions, createUser, updateUser, enableUser, disableUser, assignRolesToUser, deleteUser } from '../services/userService';
import { listRoles, getRoleWithPermissions, createRole, updateRole, assignPermissionsToRole, deleteRole } from '../services/roleService';
import { getPermissionTree } from '../services/rbacService';
import { getNodeTree, listNodes, getNodeDetail, searchNodes, createNode, updateNode, deleteNode, hideNode, showNode, copyNode, moveNode } from '../services/nodeService';
import { listFeatures, getFeatureDetail, searchFeatures, createFeature, updateFeature, deleteFeature, hideFeature, showFeature, copyFeature, moveFeature } from '../services/featureService';
import { listProviders, createProvider, updateProvider, deleteProvider, testAiConnection, generatePrompt, savePrompt, listPrompts, deletePrompt, updatePromptName } from '../services/aiService';
import { listAuditLogs, listRequestLogs, listLoginLogs } from '../services/logService';
import { AppContext } from './context';
import { requireAuth, requirePermission, makeErrorResult } from './helpers';
import { getUserPermissions } from '../services/rbacService';
import { FeatureNode } from '../db/models';

function formatUser(user: InstanceType<typeof import('../db/models').User>, roles: InstanceType<typeof import('../db/models').Role>[], permissions: string[]) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    fullName: user.display_name,
    avatar: user.avatar_url,
    status: user.status,
    isSuperAdmin: user.is_super_admin,
    isSystem: false,
    lastLoginAt: user.last_login_at,
    lastLoginIp: user.last_login_ip,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
    roles: roles.map(r => ({ id: r.id, name: r.name, code: r.code, description: r.description, isSystem: r.is_system, status: r.status, createdAt: r.created_at, permissions: [] })),
    permissions,
  };
}

function formatNode(node: InstanceType<typeof import('../db/models').FeatureNode>, allNodes?: InstanceType<typeof import('../db/models').FeatureNode>[]): unknown {
  const children = allNodes
    ? allNodes.filter(n => n.parent_id === node.id).map(c => formatNode(c, allNodes))
    : [];
  return {
    id: node.id,
    name: node.name,
    code: node.code,
    description: node.remark,
    parentId: node.parent_id,
    path: node.path,
    level: node.level,
    sortOrder: node.sort_order,
    isVisible: node.is_visible,
    createdAt: node.created_at,
    updatedAt: node.updated_at,
    children,
  };
}

function formatFeature(f: InstanceType<typeof import('../db/models').Feature>) {
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
    isVisible: f.is_visible,
    archivedAt: f.is_archived ? f.updated_at : null,
    createdAt: f.created_at,
    updatedAt: f.updated_at,
    createdBy: f.created_by,
  };
}

function formatProvider(p: InstanceType<typeof import('../db/models').AiProvider>) {
  return {
    id: p.id,
    name: p.name,
    providerFormat: p.provider_format,
    requestUrl: p.request_url,
    apiKeyHint: p.api_key_hint,
    modelName: p.model_name,
    isDefault: p.is_default,
    status: p.status,
    description: p.remark,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
  };
}

export const resolvers = {
  Query: {
    currentUser: async (_: unknown, __: unknown, ctx: AppContext) => {
      if (!ctx.userId) return null;
      const result = await getUserWithRolesAndPermissions(ctx.userId);
      if (!result) return null;
      return formatUser(result.user, result.roles, result.permissions);
    },

    userList: async (_: unknown, args: { keyword?: string; page?: number; pageSize?: number }, ctx: AppContext) => {
      requirePermission(ctx, 'user:list');
      const result = await listUsers(args);
      const items = await Promise.all(result.items.map(async (user) => {
        const data = await getUserWithRolesAndPermissions(user.id);
        return {
          id: user.id, username: user.username, email: user.email,
          fullName: user.display_name, avatar: user.avatar_url, status: user.status,
          isSuperAdmin: user.is_super_admin, isSystem: false,
          lastLoginAt: user.last_login_at, createdAt: user.created_at,
          roles: (data?.roles ?? []).map(r => ({ id: r.id, name: r.name, code: r.code, description: r.description, isSystem: r.is_system, status: r.status, createdAt: r.created_at, permissions: [] })),
        };
      }));
      return { total: result.total, items };
    },

    roleList: async (_: unknown, args: { keyword?: string; page?: number; pageSize?: number }, ctx: AppContext) => {
      requirePermission(ctx, 'role:list');
      const result = await listRoles(args);
      const items = await Promise.all(result.items.map(async (role) => {
        const data = await getRoleWithPermissions(role.id);
        return {
          id: role.id, name: role.name, code: role.code, description: role.description,
          isSystem: role.is_system, status: role.status, createdAt: role.created_at,
          permissions: (data?.permissions ?? []).map(p => ({ id: p.id, name: p.name, code: p.code, module: p.module, resource: p.resource, action: p.action, description: p.description })),
        };
      }));
      return { total: result.total, items };
    },

    permissionTree: async (_: unknown, __: unknown, ctx: AppContext) => {
      requirePermission(ctx, 'permission:list');
      const tree = await getPermissionTree();
      return tree;
    },

    nodeTree: async (_: unknown, __: unknown, ctx: AppContext) => {
      requireAuth(ctx);
      const nodes = await getNodeTree();
      const rootNodes = nodes.filter(n => !n.parent_id);
      return rootNodes.map(n => formatNode(n, nodes));
    },

    nodeList: async (_: unknown, args: { keyword?: string; page?: number; pageSize?: number }, ctx: AppContext) => {
      requireAuth(ctx);
      const result = await listNodes(args);
      return { total: result.total, items: result.items.map(n => formatNode(n)) };
    },

    nodeDetail: async (_: unknown, args: { nodeId: string }, ctx: AppContext) => {
      requireAuth(ctx);
      const node = await getNodeDetail(args.nodeId);
      return node ? formatNode(node) : null;
    },

    searchNodes: async (_: unknown, args: { keyword: string }, ctx: AppContext) => {
      requireAuth(ctx);
      const nodes = await searchNodes(args.keyword);
      return nodes.map(n => formatNode(n));
    },

    featureList: async (_: unknown, args: { nodeId?: string; nodeIds?: string[]; keyword?: string; page?: number; pageSize?: number; includeHidden?: boolean }, ctx: AppContext) => {
      requireAuth(ctx);
      const result = await listFeatures(args);
      return { total: result.total, items: result.items.map(formatFeature) };
    },

    featureDetail: async (_: unknown, args: { featureId: string }, ctx: AppContext) => {
      requireAuth(ctx);
      const feature = await getFeatureDetail(args.featureId);
      return feature ? formatFeature(feature) : null;
    },

    searchFeatures: async (_: unknown, args: { keyword: string }, ctx: AppContext) => {
      requireAuth(ctx);
      const features = await searchFeatures(args.keyword);
      return features.map(formatFeature);
    },

    auditLogList: async (_: unknown, args: { keyword?: string; action?: string; operatorId?: string; page?: number; pageSize?: number }, ctx: AppContext) => {
      requirePermission(ctx, 'log:audit:list');
      const result = await listAuditLogs(args);
      return {
        total: result.total,
        items: result.items.map((l: Record<string, unknown>) => ({
          id: l.id, operatorId: l.user_id, operatorUsername: l.operatorUsername,
          action: l.action, resourceType: l.target_type, resourceId: l.target_id,
          resourceName: l.target_name, detail: l.change_summary, ipAddress: l.ip_address, createdAt: l.created_at,
        })),
      };
    },

    requestLogList: async (_: unknown, args: { keyword?: string; userId?: string; page?: number; pageSize?: number }, ctx: AppContext) => {
      requirePermission(ctx, 'log:request:list');
      const result = await listRequestLogs(args);
      return {
        total: result.total,
        items: result.items.map((l: Record<string, unknown>) => ({
          id: l.id, method: l.method, path: l.path, ipAddress: l.ip_address,
          userId: l.user_id, username: l.username, statusCode: l.response_status,
          responseTimeMs: l.duration_ms, userAgent: l.user_agent, createdAt: l.created_at,
        })),
      };
    },

    loginLogList: async (_: unknown, args: { keyword?: string; userId?: string; success?: boolean; page?: number; pageSize?: number }, ctx: AppContext) => {
      requirePermission(ctx, 'log:login:list');
      const result = await listLoginLogs(args);
      return {
        total: result.total,
        items: result.items.map(l => ({
          id: l.id, userId: l.user_id, username: l.username, success: l.login_status === 'success',
          ipAddress: l.ip_address, userAgent: l.user_agent, failureReason: l.failure_reason, createdAt: l.occurred_at,
        })),
      };
    },

    aiProviderList: async (_: unknown, __: unknown, ctx: AppContext) => {
      requirePermission(ctx, 'ai:provider:list');
      const providers = await listProviders();
      return providers.map(formatProvider);
    },

    promptList: async (_: unknown, args: { providerId?: string; keyword?: string; page?: number; pageSize?: number }, ctx: AppContext) => {
      requirePermission(ctx, 'ai:prompt:list');
      const result = await listPrompts(args);
      return {
        total: result.total,
        items: result.items.map((p: Record<string, unknown>) => ({
          id: p.id,
          name: p.name,
          content: p.content,
          model: p.model,
          nodeIds: p.node_ids,
          featureIds: p.feature_ids,
          customInstruction: p.custom_instruction,
          provider: p.provider ? { id: (p.provider as Record<string, unknown>).id, name: (p.provider as Record<string, unknown>).name, modelName: (p.provider as Record<string, unknown>).model_name } : null,
          createdByUser: p.createdByUser ? { id: (p.createdByUser as Record<string, unknown>).id, username: (p.createdByUser as Record<string, unknown>).username, fullName: (p.createdByUser as Record<string, unknown>).display_name } : null,
          createdAt: p.created_at,
          updatedAt: p.updated_at,
        })),
      };
    },
  },

  Mutation: {
    login: async (_: unknown, args: { username: string; password: string }, ctx: AppContext) => {
      try {
        const result = await authenticate(args.username, args.password, ctx.ipAddress, ctx.req.headers['user-agent']);
        const userResult = await getUserWithRolesAndPermissions(result.user.id);
        return {
          success: true,
          message: '登录成功',
          token: result.token,
          user: formatUser(userResult!.user, userResult!.roles, userResult!.permissions),
        };
      } catch (err) {
        return { ...makeErrorResult(err), token: null, user: null };
      }
    },

    logout: async (_: unknown, __: unknown, ctx: AppContext) => {
      return { success: true, message: '已退出登录', error: null };
    },

    resetPassword: async (_: unknown, args: { userId: string; newPassword: string }, ctx: AppContext) => {
      try {
        requirePermission(ctx, 'user:manage');
        await resetPassword(args.userId, args.newPassword, ctx.userId!, ctx.username!, ctx.ipAddress);
        return { success: true, message: '密码重置成功', error: null };
      } catch (err) {
        return makeErrorResult(err);
      }
    },

    changeMyPassword: async (_: unknown, args: { oldPassword: string; newPassword: string }, ctx: AppContext) => {
      try {
        requireAuth(ctx);
        await changeMyPassword(ctx.userId!, args.oldPassword, args.newPassword);
        return { success: true, message: '密码修改成功', error: null };
      } catch (err) {
        return makeErrorResult(err);
      }
    },

    createUser: async (_: unknown, args: { input: { username: string; password: string; email?: string; fullName?: string } }, ctx: AppContext) => {
      try {
        requirePermission(ctx, 'user:manage');
        const user = await createUser({ ...args.input, operatorId: ctx.userId!, operatorUsername: ctx.username!, ipAddress: ctx.ipAddress });
        const data = await getUserWithRolesAndPermissions(user.id);
        return { success: true, message: '用户创建成功', error: null, user: formatUser(data!.user, data!.roles, data!.permissions) };
      } catch (err) {
        return { ...makeErrorResult(err), user: null };
      }
    },

    updateUser: async (_: unknown, args: { input: { userId: string; email?: string; fullName?: string } }, ctx: AppContext) => {
      try {
        requirePermission(ctx, 'user:manage');
        const user = await updateUser({ ...args.input, operatorId: ctx.userId!, operatorUsername: ctx.username!, ipAddress: ctx.ipAddress });
        const data = await getUserWithRolesAndPermissions(user.id);
        return { success: true, message: '用户更新成功', error: null, user: formatUser(data!.user, data!.roles, data!.permissions) };
      } catch (err) {
        return { ...makeErrorResult(err), user: null };
      }
    },

    enableUser: async (_: unknown, args: { userId: string }, ctx: AppContext) => {
      try {
        requirePermission(ctx, 'user:manage');
        await enableUser(args.userId, ctx.userId!, ctx.username!, ctx.ipAddress);
        return { success: true, message: '用户已启用', error: null };
      } catch (err) {
        return makeErrorResult(err);
      }
    },

    disableUser: async (_: unknown, args: { userId: string }, ctx: AppContext) => {
      try {
        requirePermission(ctx, 'user:manage');
        await disableUser(args.userId, ctx.userId!, ctx.username!, ctx.ipAddress);
        return { success: true, message: '用户已禁用', error: null };
      } catch (err) {
        return makeErrorResult(err);
      }
    },

    assignRolesToUser: async (_: unknown, args: { userId: string; roleIds: string[] }, ctx: AppContext) => {
      try {
        requirePermission(ctx, 'user:manage');
        await assignRolesToUser(args.userId, args.roleIds, ctx.userId!, ctx.username!, ctx.ipAddress);
        return { success: true, message: '角色分配成功', error: null };
      } catch (err) {
        return makeErrorResult(err);
      }
    },

    deleteUser: async (_: unknown, args: { userId: string }, ctx: AppContext) => {
      try {
        requirePermission(ctx, 'user:manage');
        await deleteUser(args.userId, ctx.userId!, ctx.username!, ctx.ipAddress);
        return { success: true, message: '用户删除成功', error: null };
      } catch (err) {
        return makeErrorResult(err);
      }
    },

    createRole: async (_: unknown, args: { input: { name: string; code: string; description?: string } }, ctx: AppContext) => {
      try {
        requirePermission(ctx, 'role:manage');
        const role = await createRole({ ...args.input, operatorId: ctx.userId!, operatorUsername: ctx.username!, ipAddress: ctx.ipAddress });
        return { success: true, message: '角色创建成功', error: null, role: { id: role.id, name: role.name, code: role.code, description: role.description, isSystem: role.is_system, status: role.status, createdAt: role.created_at, permissions: [] } };
      } catch (err) {
        return { ...makeErrorResult(err), role: null };
      }
    },

    updateRole: async (_: unknown, args: { input: { roleId: string; name?: string; description?: string | null } }, ctx: AppContext) => {
      try {
        requirePermission(ctx, 'role:manage');
        const role = await updateRole({ ...args.input, operatorId: ctx.userId!, operatorUsername: ctx.username!, ipAddress: ctx.ipAddress });
        const data = await getRoleWithPermissions(role.id);
        return { success: true, message: '角色更新成功', error: null, role: { id: role.id, name: role.name, code: role.code, description: role.description, isSystem: role.is_system, status: role.status, createdAt: role.created_at, permissions: (data?.permissions ?? []).map(p => ({ id: p.id, name: p.name, code: p.code, module: p.module, resource: p.resource, action: p.action, description: p.description })) } };
      } catch (err) {
        return { ...makeErrorResult(err), role: null };
      }
    },

    assignPermissionsToRole: async (_: unknown, args: { roleId: string; permissionIds: string[] }, ctx: AppContext) => {
      try {
        requirePermission(ctx, 'role:manage');
        await assignPermissionsToRole(args.roleId, args.permissionIds, ctx.userId!, ctx.username!, ctx.ipAddress);
        return { success: true, message: '权限分配成功', error: null };
      } catch (err) {
        return makeErrorResult(err);
      }
    },

    deleteRole: async (_: unknown, args: { roleId: string }, ctx: AppContext) => {
      try {
        requirePermission(ctx, 'role:manage');
        await deleteRole(args.roleId, ctx.userId!, ctx.username!, ctx.ipAddress);
        return { success: true, message: '角色删除成功', error: null };
      } catch (err) {
        return makeErrorResult(err);
      }
    },

    createNode: async (_: unknown, args: { input: { name: string; code: string; description?: string; parentId?: string; sortOrder?: number } }, ctx: AppContext) => {
      try {
        requirePermission(ctx, 'feature:node:manage');
        const node = await createNode({ ...args.input, operatorId: ctx.userId!, operatorUsername: ctx.username!, ipAddress: ctx.ipAddress });
        return { success: true, message: '节点创建成功', error: null, node: formatNode(node) };
      } catch (err) {
        return { ...makeErrorResult(err), node: null };
      }
    },

    updateNode: async (_: unknown, args: { input: { nodeId: string; name?: string; code?: string; description?: string | null; parentId?: string | null; sortOrder?: number } }, ctx: AppContext) => {
      try {
        requirePermission(ctx, 'feature:node:manage');
        const node = await updateNode({ ...args.input, operatorId: ctx.userId!, operatorUsername: ctx.username!, ipAddress: ctx.ipAddress });
        return { success: true, message: '节点更新成功', error: null, node: formatNode(node) };
      } catch (err) {
        return { ...makeErrorResult(err), node: null };
      }
    },

    deleteNode: async (_: unknown, args: { nodeId: string }, ctx: AppContext) => {
      try {
        requirePermission(ctx, 'feature:node:manage');
        await deleteNode(args.nodeId, ctx.userId!, ctx.username!, ctx.ipAddress);
        return { success: true, message: '节点删除成功', error: null };
      } catch (err) {
        return makeErrorResult(err);
      }
    },

    hideNode: async (_: unknown, args: { nodeId: string }, ctx: AppContext) => {
      try {
        requirePermission(ctx, 'feature:node:manage');
        await hideNode(args.nodeId, ctx.userId!, ctx.username!, ctx.ipAddress);
        return { success: true, message: '节点已隐藏', error: null };
      } catch (err) {
        return makeErrorResult(err);
      }
    },

    showNode: async (_: unknown, args: { nodeId: string }, ctx: AppContext) => {
      try {
        requirePermission(ctx, 'feature:node:manage');
        await showNode(args.nodeId, ctx.userId!, ctx.username!, ctx.ipAddress);
        return { success: true, message: '节点已显示', error: null };
      } catch (err) {
        return makeErrorResult(err);
      }
    },

    copyNode: async (_: unknown, args: { nodeId: string }, ctx: AppContext) => {
      try {
        requirePermission(ctx, 'feature:node:manage');
        const node = await copyNode(args.nodeId, ctx.userId!, ctx.username!, ctx.ipAddress);
        return { success: true, message: '节点复制成功', error: null, node: formatNode(node) };
      } catch (err) {
        return { ...makeErrorResult(err), node: null };
      }
    },

    moveNode: async (_: unknown, args: { nodeId: string; targetParentId?: string | null }, ctx: AppContext) => {
      try {
        requirePermission(ctx, 'feature:node:manage');
        const node = await moveNode(args.nodeId, args.targetParentId ?? null, ctx.userId!, ctx.username!, ctx.ipAddress);
        return { success: true, message: '节点移动成功', error: null, node: formatNode(node) };
      } catch (err) {
        return { ...makeErrorResult(err), node: null };
      }
    },

    createFeature: async (_: unknown, args: { input: { nodeId: string; title: string; code: string; summary?: string; description?: string; platform?: string; priority?: string } }, ctx: AppContext) => {
      try {
        requirePermission(ctx, 'feature:manage');
        const feature = await createFeature({ ...args.input, operatorId: ctx.userId!, operatorUsername: ctx.username!, ipAddress: ctx.ipAddress });
        return { success: true, message: '特征创建成功', error: null, feature: formatFeature(feature) };
      } catch (err) {
        return { ...makeErrorResult(err), feature: null };
      }
    },

    updateFeature: async (_: unknown, args: { input: { featureId: string; title?: string; summary?: string | null; description?: string | null; platform?: string | null; priority?: string | null; expectedUpdatedAt?: Date } }, ctx: AppContext) => {
      try {
        requirePermission(ctx, 'feature:manage');
        const feature = await updateFeature({ ...args.input, operatorId: ctx.userId!, operatorUsername: ctx.username!, ipAddress: ctx.ipAddress });
        return { success: true, message: '特征更新成功', error: null, feature: formatFeature(feature) };
      } catch (err) {
        return { ...makeErrorResult(err), feature: null };
      }
    },

    deleteFeature: async (_: unknown, args: { featureId: string }, ctx: AppContext) => {
      try {
        requirePermission(ctx, 'feature:manage');
        await deleteFeature(args.featureId, ctx.userId!, ctx.username!, ctx.ipAddress);
        return { success: true, message: '特征删除成功', error: null };
      } catch (err) {
        return makeErrorResult(err);
      }
    },

    hideFeature: async (_: unknown, args: { featureId: string }, ctx: AppContext) => {
      try {
        requirePermission(ctx, 'feature:manage');
        await hideFeature(args.featureId, ctx.userId!, ctx.username!, ctx.ipAddress);
        return { success: true, message: '特征已隐藏', error: null };
      } catch (err) {
        return makeErrorResult(err);
      }
    },

    showFeature: async (_: unknown, args: { featureId: string }, ctx: AppContext) => {
      try {
        requirePermission(ctx, 'feature:manage');
        await showFeature(args.featureId, ctx.userId!, ctx.username!, ctx.ipAddress);
        return { success: true, message: '特征已显示', error: null };
      } catch (err) {
        return makeErrorResult(err);
      }
    },

    copyFeature: async (_: unknown, args: { featureId: string; targetNodeId?: string | null }, ctx: AppContext) => {
      try {
        requirePermission(ctx, 'feature:manage');
        const feature = await copyFeature(args.featureId, args.targetNodeId ?? null, ctx.userId!, ctx.username!, ctx.ipAddress);
        return { success: true, message: '特征复制成功', error: null, feature: formatFeature(feature) };
      } catch (err) {
        return { ...makeErrorResult(err), feature: null };
      }
    },

    moveFeature: async (_: unknown, args: { featureId: string; targetNodeId: string }, ctx: AppContext) => {
      try {
        requirePermission(ctx, 'feature:manage');
        const feature = await moveFeature(args.featureId, args.targetNodeId, ctx.userId!, ctx.username!, ctx.ipAddress);
        return { success: true, message: '特征移动成功', error: null, feature: formatFeature(feature) };
      } catch (err) {
        return { ...makeErrorResult(err), feature: null };
      }
    },

    createAiProvider: async (_: unknown, args: { input: { name: string; providerFormat: string; requestUrl: string; apiKey?: string; modelName?: string; isDefault?: boolean; description?: string } }, ctx: AppContext) => {
      try {
        requirePermission(ctx, 'ai:provider:manage');
        const provider = await createProvider({ ...args.input, operatorId: ctx.userId!, operatorUsername: ctx.username!, ipAddress: ctx.ipAddress });
        return { success: true, message: 'AI 供应商创建成功', error: null, provider: formatProvider(provider) };
      } catch (err) {
        return { ...makeErrorResult(err), provider: null };
      }
    },

    updateAiProvider: async (_: unknown, args: { input: { providerId: string; name?: string; requestUrl?: string; apiKey?: string; modelName?: string | null; isDefault?: boolean; description?: string | null } }, ctx: AppContext) => {
      try {
        requirePermission(ctx, 'ai:provider:manage');
        const provider = await updateProvider({ ...args.input, operatorId: ctx.userId!, operatorUsername: ctx.username!, ipAddress: ctx.ipAddress });
        return { success: true, message: 'AI 供应商更新成功', error: null, provider: formatProvider(provider) };
      } catch (err) {
        return { ...makeErrorResult(err), provider: null };
      }
    },

    deleteAiProvider: async (_: unknown, args: { providerId: string }, ctx: AppContext) => {
      try {
        requirePermission(ctx, 'ai:provider:manage');
        await deleteProvider(args.providerId, ctx.userId!, ctx.username!, ctx.ipAddress);
        return { success: true, message: 'AI 供应商删除成功', error: null };
      } catch (err) {
        return makeErrorResult(err);
      }
    },

    testAiConnection: async (_: unknown, args: { providerId: string }, ctx: AppContext) => {
      try {
        requirePermission(ctx, 'ai:provider:manage');
        await testAiConnection(args.providerId);
        return { success: true, message: '连接测试成功', error: null };
      } catch (err) {
        return makeErrorResult(err);
      }
    },

    generatePrompt: async (_: unknown, args: { input: { nodeIds: string[]; featureIds?: string[]; customInstruction?: string; providerId?: string } }, ctx: AppContext) => {
      try {
        requirePermission(ctx, 'ai:generate');
        const prompt = await generatePrompt({ ...args.input, operatorId: ctx.userId!, operatorUsername: ctx.username!, ipAddress: ctx.ipAddress });
        return {
          success: true, message: '提示词生成成功', error: null,
          prompt: { id: prompt.id, name: prompt.name, content: prompt.content, model: prompt.model, nodeIds: prompt.node_ids, featureIds: prompt.feature_ids, customInstruction: prompt.custom_instruction, provider: null, createdByUser: null, createdAt: prompt.created_at, updatedAt: prompt.updated_at },
        };
      } catch (err) {
        return { ...makeErrorResult(err), prompt: null };
      }
    },

    savePrompt: async (_: unknown, args: { input: { content: string; model?: string; name?: string; nodeIds?: string; featureIds?: string; customInstruction?: string } }, ctx: AppContext) => {
      try {
        requireAuth(ctx);
        const prompt = await savePrompt({ ...args.input, operatorId: ctx.userId! });
        return {
          success: true, message: '提示词保存成功', error: null,
          prompt: { id: prompt.id, name: prompt.name, content: prompt.content, model: prompt.model, nodeIds: prompt.node_ids, featureIds: prompt.feature_ids, customInstruction: prompt.custom_instruction, provider: null, createdByUser: null, createdAt: prompt.created_at, updatedAt: prompt.updated_at },
        };
      } catch (err) {
        return { ...makeErrorResult(err), prompt: null };
      }
    },

    deletePrompt: async (_: unknown, args: { promptId: string }, ctx: AppContext) => {
      try {
        requirePermission(ctx, 'ai:prompt:manage');
        await deletePrompt(args.promptId, ctx.userId!, ctx.username!, ctx.ipAddress);
        return { success: true, message: '提示词删除成功', error: null };
      } catch (err) {
        return makeErrorResult(err);
      }
    },

    updatePromptName: async (_: unknown, args: { promptId: string; name: string }, ctx: AppContext) => {
      try {
        requirePermission(ctx, 'ai:prompt:manage');
        const prompt = await updatePromptName(args.promptId, args.name, ctx.userId!, ctx.username!, ctx.ipAddress);
        return {
          success: true, message: '提示词名称更新成功', error: null,
          prompt: { id: prompt.id, name: prompt.name, content: prompt.content, model: prompt.model, nodeIds: prompt.node_ids, featureIds: prompt.feature_ids, customInstruction: prompt.custom_instruction, provider: null, createdByUser: null, createdAt: prompt.created_at, updatedAt: prompt.updated_at },
        };
      } catch (err) {
        return { ...makeErrorResult(err), prompt: null };
      }
    },
  },
};
