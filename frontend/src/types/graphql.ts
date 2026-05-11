import type {
  AiGenerateResult,
  AiProvider,
  AiProviderListResult,
  AiProviderMutationResult,
  FeatureItem,
  FeatureListResult,
  FeatureMutationResult,
  LoginResult,
  NodeItem,
  NodeListResult,
  NodeMutationResult,
  NodeTreeItem,
  PermissionModuleGroup,
  RoleListResult,
  RoleMutationResult,
  User,
  UserListResult,
  UserMutationResult,
} from './models';
import type { MutationResult, PaginationInput } from './common';

export interface CurrentUserQueryData {
  currentUser: User;
}

export interface LoginMutationData {
  login: LoginResult;
}

export interface LoginMutationVariables {
  username: string;
  password: string;
}

export interface UserListQueryData {
  userList: UserListResult;
}

export interface UserListQueryVariables {
  pagination?: PaginationInput;
  keyword?: string;
}

export interface RoleListQueryData {
  roleList: RoleListResult;
}

export interface RoleListQueryVariables {
  pagination?: PaginationInput;
}

export interface PermissionTreeQueryData {
  permissionTree: PermissionModuleGroup[];
}

export interface NodeTreeQueryData {
  nodeTree: NodeTreeItem[];
}

export interface NodeListQueryData {
  nodeList: NodeListResult;
}

export interface NodeDetailQueryData {
  nodeDetail: NodeItem;
}

export interface NodeDetailQueryVariables {
  nodeId: string;
}

export interface SearchNodesQueryData {
  searchNodes: NodeListResult;
}

export interface SearchNodesQueryVariables {
  keyword: string;
  pagination?: PaginationInput;
}

export interface FeatureListQueryData {
  featureList: FeatureListResult;
}

export interface FeatureListQueryVariables {
  pagination?: PaginationInput;
  nodeIds?: string[] | null;
}

export interface FeatureDetailQueryData {
  featureDetail: FeatureItem;
}

export interface FeatureDetailQueryVariables {
  featureId: string;
}

export interface SearchFeaturesQueryData {
  searchFeatures: FeatureListResult;
}

export interface SearchFeaturesQueryVariables {
  keyword: string;
  pagination?: PaginationInput;
}

export interface CreateUserInput {
  username: string;
  email: string;
  password: string;
  displayName?: string;
  phone?: string;
  avatarUrl?: string;
  remark?: string;
  isSuperAdmin?: boolean;
}

export interface UpdateUserInput {
  email?: string;
  displayName?: string;
  phone?: string;
  avatarUrl?: string;
  remark?: string;
  isSuperAdmin?: boolean;
}

export interface CreateRoleInput {
  name: string;
  code: string;
  description?: string;
  isSystem?: boolean;
}

export interface UpdateRoleInput {
  name?: string;
  description?: string;
  status?: string;
}

export interface CreateNodeInput {
  parentId?: string | null;
  name: string;
  code: string;
  nodeType?: string;
  sortOrder?: number;
  remark?: string;
}

export interface UpdateNodeInput extends Partial<CreateNodeInput> {}

export interface CreateFeatureInput {
  nodeId: string;
  title: string;
  code: string;
  summary?: string;
  description?: string;
  platform?: string;
  status?: string;
  priority?: string;
  version?: string;
  tags?: string;
  remark?: string;
}

export interface UpdateFeatureInput extends Partial<CreateFeatureInput> {}

export interface UserMutationData {
  createUser?: UserMutationResult;
  updateUser?: UserMutationResult;
}

export interface RoleMutationData {
  createRole?: RoleMutationResult;
  updateRole?: RoleMutationResult;
}

export interface NodeMutationData {
  createNode?: NodeMutationResult;
  updateNode?: NodeMutationResult;
  copyNode?: NodeMutationResult;
  moveNode?: NodeMutationResult;
}

export interface FeatureMutationData {
  createFeature?: FeatureMutationResult;
  updateFeature?: FeatureMutationResult;
  copyFeature?: FeatureMutationResult;
  moveFeature?: FeatureMutationResult;
}

export interface SimpleMutationData {
  logout?: MutationResult;
  resetPassword?: MutationResult;
  enableUser?: MutationResult;
  disableUser?: MutationResult;
  assignRolesToUser?: MutationResult;
  assignPermissionsToRole?: MutationResult;
  deleteNode?: MutationResult;
  hideNode?: MutationResult;
  showNode?: MutationResult;
  deleteFeature?: MutationResult;
  hideFeature?: MutationResult;
  showFeature?: MutationResult;
  deleteAiProvider?: MutationResult;
  testAiConnection?: MutationResult;
}

export interface AiProviderListQueryData {
  aiProviderList: AiProviderListResult;
}

export interface AiProviderListQueryVariables {
  pagination?: PaginationInput;
}

export interface CreateAiProviderInput {
  name: string;
  websiteUrl?: string;
  apiKey: string;
  requestUrl: string;
  modelName: string;
  providerFormat?: string;
  isDefault?: boolean;
  status?: string;
  remark?: string;
}

export interface UpdateAiProviderInput {
  name?: string;
  websiteUrl?: string;
  apiKey?: string;
  requestUrl?: string;
  modelName?: string;
  providerFormat?: string;
  isDefault?: boolean;
  status?: string;
  remark?: string;
}

export interface GenerateTestCasesInput {
  providerId: string;
  nodeIds?: string[];
  featureIds?: string[];
  customInstruction?: string;
}

export interface AiProviderMutationData {
  createAiProvider?: AiProviderMutationResult;
  updateAiProvider?: AiProviderMutationResult;
}

export interface AiGenerateMutationData {
  generateTestCases?: AiGenerateResult;
}
