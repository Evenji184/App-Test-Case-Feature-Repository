import { authenticate, changeMyPassword, resetPassword } from '../services/authService';
import { listUsers, getUserWithRolesAndPermissions, batchGetUsersWithRoles, createUser, updateUser, enableUser, disableUser, assignRolesToUser, deleteUser } from '../services/userService';
import { listRoles, getRoleWithPermissions, batchGetRolesWithPermissions, createRole, updateRole, assignPermissionsToRole, deleteRole } from '../services/roleService';
import { getPermissionTree, PermissionTree } from '../services/rbacService';
import { getNodeTree, listNodes, getNodeDetail, searchNodes, createNode, updateNode, deleteNode, hideNode, showNode, copyNode, moveNode } from '../services/nodeService';
import { listFeatures, getFeatureDetail, searchFeatures, createFeature, updateFeature, deleteFeature, hideFeature, showFeature, copyFeature, moveFeature } from '../services/featureService';
import { listProviders, createProvider, updateProvider, deleteProvider, testAiConnection, generatePrompt, savePrompt, listPrompts, deletePrompt, updatePromptName, getPromptById } from '../services/aiService';
import { listAuditLogs, listRequestLogs, listLoginLogs } from '../services/logService';
import { AppContext } from './context';
import { requireAuth, requirePermission, makeErrorResult } from './helpers';

type PaginationInput = { page?: number; pageSize?: number } | undefined;

function buildPageInfo(total: number, page: number, pageSize: number) {
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

function extractPagination(pagination: PaginationInput) {
  const page = pagination?.page ?? 1;
  const pageSize = pagination?.pageSize ?? 20;
  return { page, pageSize };
}

function formatUser(user: InstanceType<typeof import('../db/models').User>, roleIds: string[]) {
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

function formatRole(role: InstanceType<typeof import('../db/models').Role>, permissionIds: string[]) {
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

function formatNode(node: InstanceType<typeof import('../db/models').FeatureNode>, allNodes?: InstanceType<typeof import('../db/models').FeatureNode>[]): unknown {
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
    version: f.version ?? null,
    tags: f.tags ?? null,
    isVisible: f.is_visible,
    isArchived: f.is_archived ?? false,
    remark: f.remark ?? null,
    createdAt: f.created_at,
    updatedAt: f.updated_at,
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
    websiteUrl: p.website_url ?? null,
    isDefault: p.is_default,
    status: p.status,
    remark: p.remark ?? null,
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
      return formatUser(result.user, result.roles.map(r => r.id));
    },

    userList: async (_: unknown, args: { pagination: PaginationInput; keyword?: string }, ctx: AppContext) => {
      requirePermission(ctx, 'user:list');
      const { page, pageSize } = extractPagination(args.pagination);
      const result = await listUsers({ keyword: args.keyword, page, pageSize });
      const roleMap = await batchGetUsersWithRoles(result.items.map(u => u.id));
      const items = result.items.map(user => formatUser(user, roleMap.get(user.id) ?? []));
      return { items, pageInfo: buildPageInfo(result.total, page, pageSize) };
    },

    roleList: async (_: unknown, args: { pagination: PaginationInput }, ctx: AppContext) => {
      requirePermission(ctx, 'role:list');
      const { page, pageSize } = extractPagination(args.pagination);
      const result = await listRoles({ page, pageSize });
      const permMap = await batchGetRolesWithPermissions(result.items.map(r => r.id));
      const items = result.items.map(role => formatRole(role, permMap.get(role.id) ?? []));
      return { items, pageInfo: buildPageInfo(result.total, page, pageSize) };
    },

    permissionTree: async (_: unknown, __: unknown, ctx: AppContext) => {
      requirePermission(ctx, 'permission:list');
      const tree = await getPermissionTree();
      return tree.map((module: PermissionTree) => ({
        module: module.module,
        resources: module.resources.map(resource => ({
          resource: resource.resource,
          permissions: resource.actions,
        })),
      }));
    },

    nodeTree: async (_: unknown, __: unknown, ctx: AppContext) => {
      requireAuth(ctx);
      const nodes = await getNodeTree();
      const rootNodes = nodes.filter(n => !n.parent_id);
      return rootNodes.map(n => formatNode(n, nodes));
    },

    nodeList: async (_: unknown, args: { pagination: PaginationInput }, ctx: AppContext) => {
      requireAuth(ctx);
      const { page, pageSize } = extractPagination(args.pagination);
      const result = await listNodes({ page, pageSize });
      return { items: result.items.map(n => formatNode(n)), pageInfo: buildPageInfo(result.total, page, pageSize) };
    },

    nodeDetail: async (_: unknown, args: { nodeId: string }, ctx: AppContext) => {
      requireAuth(ctx);
      const node = await getNodeDetail(args.nodeId);
      return node ? formatNode(node) : null;
    },

    searchNodes: async (_: unknown, args: { keyword: string; pagination: PaginationInput }, ctx: AppContext) => {
      requireAuth(ctx);
      const { page, pageSize } = extractPagination(args.pagination);
      const nodes = await searchNodes(args.keyword);
      const sliced = nodes.slice((page - 1) * pageSize, page * pageSize);
      return { items: sliced.map(n => formatNode(n)), pageInfo: buildPageInfo(nodes.length, page, pageSize) };
    },

    featureList: async (_: unknown, args: { pagination: PaginationInput; nodeIds?: string[]; includeHidden?: boolean }, ctx: AppContext) => {
      requireAuth(ctx);
      const { page, pageSize } = extractPagination(args.pagination);
      const result = await listFeatures({ nodeIds: args.nodeIds, includeHidden: args.includeHidden, page, pageSize });
      return { items: result.items.map(formatFeature), pageInfo: buildPageInfo(result.total, page, pageSize) };
    },

    featureDetail: async (_: unknown, args: { featureId: string }, ctx: AppContext) => {
      requireAuth(ctx);
      const feature = await getFeatureDetail(args.featureId);
      return feature ? formatFeature(feature) : null;
    },

    searchFeatures: async (_: unknown, args: { keyword: string; pagination: PaginationInput; includeHidden?: boolean }, ctx: AppContext) => {
      requireAuth(ctx);
      const { page, pageSize } = extractPagination(args.pagination);
      const features = await searchFeatures(args.keyword);
      const sliced = features.slice((page - 1) * pageSize, page * pageSize);
      return { items: sliced.map(formatFeature), pageInfo: buildPageInfo(features.length, page, pageSize) };
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

    aiProviderList: async (_: unknown, args: { pagination: PaginationInput }, ctx: AppContext) => {
      requirePermission(ctx, 'ai:provider:list');
      const { page, pageSize } = extractPagination(args.pagination);
      const providers = await listProviders();
      const sliced = providers.slice((page - 1) * pageSize, page * pageSize);
      return { items: sliced.map(formatProvider), pageInfo: buildPageInfo(providers.length, page, pageSize) };
    },

    promptList: async (_: unknown, args: { pagination: PaginationInput; keyword?: string; createdBy?: string }, ctx: AppContext) => {
      requirePermission(ctx, 'ai:prompt:list');
      const { page, pageSize } = extractPagination(args.pagination);
      const result = await listPrompts({ keyword: args.keyword, createdBy: args.createdBy, page, pageSize });
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

    getPrompt: async (_: unknown, args: { id: string }, ctx: AppContext) => {
      requirePermission(ctx, 'ai:prompt:list');
      const p = await getPromptById(args.id);
      return {
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
      };
    },
  },

  Mutation: {
    login: async (_: unknown, args: { username: string; password: string }, ctx: AppContext) => {
      try {
        const result = await authenticate(args.username, args.password, ctx.ipAddress, ctx.req.headers['user-agent']);
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
      } catch (err) {
        return { ...makeErrorResult(err), data: null };
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

    createUser: async (_: unknown, args: { input: { username: string; password: string; email?: string; displayName?: string; phone?: string; avatarUrl?: string; remark?: string; isSuperAdmin?: boolean } }, ctx: AppContext) => {
      try {
        requirePermission(ctx, 'user:manage');
        const user = await createUser({
          username: args.input.username,
          password: args.input.password,
          email: args.input.email,
          fullName: args.input.displayName,
          operatorId: ctx.userId!,
          operatorUsername: ctx.username!,
          ipAddress: ctx.ipAddress,
        });
        const data = await getUserWithRolesAndPermissions(user.id);
        return { success: true, message: '用户创建成功', error: null, data: formatUser(data!.user, data!.roles.map(r => r.id)) };
      } catch (err) {
        return { ...makeErrorResult(err), data: null };
      }
    },

    updateUser: async (_: unknown, args: { userId: string; input: { email?: string; displayName?: string; phone?: string; avatarUrl?: string; remark?: string; isSuperAdmin?: boolean } }, ctx: AppContext) => {
      try {
        requirePermission(ctx, 'user:manage');
        const user = await updateUser({
          userId: args.userId,
          email: args.input.email,
          fullName: args.input.displayName,
          operatorId: ctx.userId!,
          operatorUsername: ctx.username!,
          ipAddress: ctx.ipAddress,
        });
        const data = await getUserWithRolesAndPermissions(user.id);
        return { success: true, message: '用户更新成功', error: null, data: formatUser(data!.user, data!.roles.map(r => r.id)) };
      } catch (err) {
        return { ...makeErrorResult(err), data: null };
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
        return { success: true, message: '角色创建成功', error: null, data: formatRole(role, []) };
      } catch (err) {
        return { ...makeErrorResult(err), data: null };
      }
    },

    updateRole: async (_: unknown, args: { roleId: string; input: { name?: string; description?: string | null; status?: string } }, ctx: AppContext) => {
      try {
        requirePermission(ctx, 'role:manage');
        const role = await updateRole({ roleId: args.roleId, ...args.input, operatorId: ctx.userId!, operatorUsername: ctx.username!, ipAddress: ctx.ipAddress });
        const data = await getRoleWithPermissions(role.id);
        return { success: true, message: '角色更新成功', error: null, data: formatRole(role, (data?.permissions ?? []).map(p => p.id)) };
      } catch (err) {
        return { ...makeErrorResult(err), data: null };
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

    createNode: async (_: unknown, args: { input: { name: string; code: string; nodeType?: string; parentId?: string; sortOrder?: number; remark?: string } }, ctx: AppContext) => {
      try {
        requirePermission(ctx, 'feature:node:manage');
        const node = await createNode({
          name: args.input.name,
          code: args.input.code,
          description: args.input.remark,
          parentId: args.input.parentId,
          sortOrder: args.input.sortOrder,
          operatorId: ctx.userId!,
          operatorUsername: ctx.username!,
          ipAddress: ctx.ipAddress,
        });
        return { success: true, message: '节点创建成功', error: null, data: formatNode(node) };
      } catch (err) {
        return { ...makeErrorResult(err), data: null };
      }
    },

    updateNode: async (_: unknown, args: { nodeId: string; input: { name?: string; code?: string; nodeType?: string; parentId?: string | null; sortOrder?: number; remark?: string | null } }, ctx: AppContext) => {
      try {
        requirePermission(ctx, 'feature:node:manage');
        const node = await updateNode({
          nodeId: args.nodeId,
          name: args.input.name,
          code: args.input.code,
          description: args.input.remark,
          parentId: args.input.parentId,
          sortOrder: args.input.sortOrder,
          operatorId: ctx.userId!,
          operatorUsername: ctx.username!,
          ipAddress: ctx.ipAddress,
        });
        return { success: true, message: '节点更新成功', error: null, data: formatNode(node) };
      } catch (err) {
        return { ...makeErrorResult(err), data: null };
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

    copyNode: async (_: unknown, args: { nodeId: string; targetParentId?: string | null; newName?: string | null }, ctx: AppContext) => {
      try {
        requirePermission(ctx, 'feature:node:manage');
        const node = await copyNode(args.nodeId, ctx.userId!, ctx.username!, ctx.ipAddress);
        return { success: true, message: '节点复制成功', error: null, data: formatNode(node) };
      } catch (err) {
        return { ...makeErrorResult(err), data: null };
      }
    },

    moveNode: async (_: unknown, args: { nodeId: string; targetParentId?: string | null }, ctx: AppContext) => {
      try {
        requirePermission(ctx, 'feature:node:manage');
        const node = await moveNode(args.nodeId, args.targetParentId ?? null, ctx.userId!, ctx.username!, ctx.ipAddress);
        return { success: true, message: '节点移动成功', error: null, data: formatNode(node) };
      } catch (err) {
        return { ...makeErrorResult(err), data: null };
      }
    },

    createFeature: async (_: unknown, args: { input: { nodeId: string; title: string; code: string; summary?: string; description?: string; platform?: string; priority?: string; version?: string; tags?: string; remark?: string } }, ctx: AppContext) => {
      try {
        requirePermission(ctx, 'feature:manage');
        const feature = await createFeature({ ...args.input, operatorId: ctx.userId!, operatorUsername: ctx.username!, ipAddress: ctx.ipAddress });
        return { success: true, message: '特征创建成功', error: null, data: formatFeature(feature) };
      } catch (err) {
        return { ...makeErrorResult(err), data: null };
      }
    },

    updateFeature: async (_: unknown, args: { featureId: string; input: { title?: string; summary?: string | null; description?: string | null; platform?: string | null; priority?: string | null; version?: string | null; tags?: string | null; remark?: string | null }; expectedUpdatedAt?: string | null }, ctx: AppContext) => {
      try {
        requirePermission(ctx, 'feature:manage');
        const feature = await updateFeature({
          featureId: args.featureId,
          ...args.input,
          expectedUpdatedAt: args.expectedUpdatedAt ? new Date(args.expectedUpdatedAt) : undefined,
          operatorId: ctx.userId!,
          operatorUsername: ctx.username!,
          ipAddress: ctx.ipAddress,
        });
        return { success: true, message: '特征更新成功', error: null, data: formatFeature(feature) };
      } catch (err) {
        return { ...makeErrorResult(err), data: null };
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
        return { success: true, message: '特征复制成功', error: null, data: formatFeature(feature) };
      } catch (err) {
        return { ...makeErrorResult(err), data: null };
      }
    },

    moveFeature: async (_: unknown, args: { featureId: string; targetNodeId: string }, ctx: AppContext) => {
      try {
        requirePermission(ctx, 'feature:manage');
        const feature = await moveFeature(args.featureId, args.targetNodeId, ctx.userId!, ctx.username!, ctx.ipAddress);
        return { success: true, message: '特征移动成功', error: null, data: formatFeature(feature) };
      } catch (err) {
        return { ...makeErrorResult(err), data: null };
      }
    },

    createAiProvider: async (_: unknown, args: { input: { name: string; providerFormat: string; requestUrl: string; apiKey?: string; modelName?: string; websiteUrl?: string; isDefault?: boolean; remark?: string } }, ctx: AppContext) => {
      try {
        requirePermission(ctx, 'ai:provider:manage');
        const provider = await createProvider({
          name: args.input.name,
          providerFormat: args.input.providerFormat,
          requestUrl: args.input.requestUrl,
          apiKey: args.input.apiKey,
          modelName: args.input.modelName,
          isDefault: args.input.isDefault,
          description: args.input.remark,
          operatorId: ctx.userId!,
          operatorUsername: ctx.username!,
          ipAddress: ctx.ipAddress,
        });
        return { success: true, message: 'AI 供应商创建成功', error: null, data: formatProvider(provider) };
      } catch (err) {
        return { ...makeErrorResult(err), data: null };
      }
    },

    updateAiProvider: async (_: unknown, args: { providerId: string; input: { name?: string; requestUrl?: string; apiKey?: string; modelName?: string | null; websiteUrl?: string | null; isDefault?: boolean; remark?: string | null; status?: string; providerFormat?: string } }, ctx: AppContext) => {
      try {
        requirePermission(ctx, 'ai:provider:manage');
        const provider = await updateProvider({
          providerId: args.providerId,
          name: args.input.name,
          requestUrl: args.input.requestUrl,
          apiKey: args.input.apiKey,
          modelName: args.input.modelName,
          isDefault: args.input.isDefault,
          description: args.input.remark,
          operatorId: ctx.userId!,
          operatorUsername: ctx.username!,
          ipAddress: ctx.ipAddress,
        });
        return { success: true, message: 'AI 供应商更新成功', error: null, data: formatProvider(provider) };
      } catch (err) {
        return { ...makeErrorResult(err), data: null };
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
        const result = await generatePrompt({ ...args.input, operatorId: ctx.userId!, operatorUsername: ctx.username!, ipAddress: ctx.ipAddress });
        return {
          success: true,
          message: '提示词生成成功',
          error: null,
          id: result.id ?? null,
          content: result.content ?? null,
          model: result.model ?? null,
          usage: null,
        };
      } catch (err) {
        return { ...makeErrorResult(err), id: null, content: null, model: null, usage: null };
      }
    },

    savePrompt: async (_: unknown, args: { input: { content: string; model?: string; name?: string; nodeIds?: string; featureIds?: string; customInstruction?: string } }, ctx: AppContext) => {
      try {
        requireAuth(ctx);
        requirePermission(ctx, 'ai:prompt:manage');
        await savePrompt({ ...args.input, operatorId: ctx.userId! });
        return { success: true, message: '提示词保存成功', error: null };
      } catch (err) {
        return makeErrorResult(err);
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
        await updatePromptName(args.promptId, args.name, ctx.userId!, ctx.username!, ctx.ipAddress);
        return { success: true, message: '提示词名称更新成功', error: null };
      } catch (err) {
        return makeErrorResult(err);
      }
    },
  },
};
