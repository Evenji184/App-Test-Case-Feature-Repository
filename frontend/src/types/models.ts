import type { ListResult, MutationResult } from './common';

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  displayName?: string | null;
  status: string;
  isSuperAdmin: boolean;
}

export interface User extends AuthUser {
  phone?: string | null;
  avatarUrl?: string | null;
  lastLoginAt?: string | null;
  lastLoginIp?: string | null;
  remark?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Role {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  isSystem: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface Permission {
  id: string;
  name: string;
  code: string;
  module: string;
  resource: string;
  action: string;
  description?: string | null;
}

export interface PermissionResourceGroup {
  resource: string;
  permissions: Permission[];
}

export interface PermissionModuleGroup {
  module: string;
  resources: PermissionResourceGroup[];
}

export interface NodeItem {
  id: string;
  parentId?: string | null;
  name: string;
  code: string;
  nodeType: string;
  path: string;
  level: number;
  sortOrder: number;
  isVisible: boolean;
  isLocked?: boolean;
  remark?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface NodeTreeItem extends NodeItem {
  children: NodeTreeItem[];
}

export interface FeatureItem {
  id: string;
  nodeId: string;
  title: string;
  code: string;
  summary?: string | null;
  description?: string | null;
  platform?: string | null;
  status: string;
  priority: string;
  version?: string | null;
  tags?: string | null;
  isVisible: boolean;
  isArchived: boolean;
  remark?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LoginPayload {
  accessToken: string;
  tokenType: string;
  permissions: string[];
  user: AuthUser;
}

export interface LoginResult extends MutationResult {
  data?: LoginPayload | null;
}

export type UserListResult = ListResult<User>;
export type RoleListResult = ListResult<Role>;
export type NodeListResult = ListResult<NodeItem>;
export type FeatureListResult = ListResult<FeatureItem>;

export interface UserMutationResult extends MutationResult {
  data?: User | null;
}

export interface RoleMutationResult extends MutationResult {
  data?: Role | null;
}

export interface NodeMutationResult extends MutationResult {
  data?: NodeItem | null;
}

export interface FeatureMutationResult extends MutationResult {
  data?: FeatureItem | null;
}

export interface AiProvider {
  id: string;
  name: string;
  websiteUrl?: string | null;
  apiKeyHint: string;
  requestUrl: string;
  modelName: string;
  providerFormat: string;
  isDefault: boolean;
  status: string;
  remark?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type AiProviderListResult = ListResult<AiProvider>;

export interface AiProviderMutationResult extends MutationResult {
  data?: AiProvider | null;
}

export interface AiGenerateResult extends MutationResult {
  content?: string | null;
  model?: string | null;
  usage?: string | null;
}
