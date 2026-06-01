export const typeDefs = `#graphql
  scalar DateTime

  type MutationError {
    code: String!
    message: String!
  }

  type MutationResult {
    success: Boolean!
    message: String!
    error: MutationError
  }

  type PageInfo {
    total: Int!
    page: Int!
    pageSize: Int!
    totalPages: Int!
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
  }

  # ===== User types =====
  type UserType {
    id: ID!
    username: String!
    email: String
    displayName: String
    phone: String
    avatarUrl: String
    status: String!
    isSuperAdmin: Boolean!
    roleIds: [String!]!
    lastLoginAt: DateTime
    lastLoginIp: String
    remark: String
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type UserListResult {
    items: [UserType!]!
    pageInfo: PageInfo!
  }

  type UserMutationResult {
    success: Boolean!
    message: String!
    error: MutationError
    data: UserType
  }

  # ===== Role types =====
  type RoleType {
    id: ID!
    name: String!
    code: String!
    description: String
    isSystem: Boolean!
    status: String!
    permissionIds: [String!]!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type RoleListResult {
    items: [RoleType!]!
    pageInfo: PageInfo!
  }

  type RoleMutationResult {
    success: Boolean!
    message: String!
    error: MutationError
    data: RoleType
  }

  # ===== Permission types =====
  type PermissionType {
    id: ID!
    name: String!
    code: String!
    module: String!
    resource: String!
    action: String!
    description: String
  }

  type PermissionResourceGroup {
    resource: String!
    permissions: [PermissionType!]!
  }

  type PermissionModuleGroup {
    module: String!
    resources: [PermissionResourceGroup!]!
  }

  # ===== Node types =====
  type NodeType {
    id: ID!
    parentId: String
    name: String!
    code: String!
    nodeType: String
    path: String!
    level: Int!
    sortOrder: Int!
    isVisible: Boolean!
    isLocked: Boolean!
    remark: String
    createdAt: DateTime!
    updatedAt: DateTime!
    children: [NodeType!]!
  }

  type NodeListResult {
    items: [NodeType!]!
    pageInfo: PageInfo!
  }

  type NodeMutationResult {
    success: Boolean!
    message: String!
    error: MutationError
    data: NodeType
  }

  # ===== Feature types =====
  type FeatureType {
    id: ID!
    nodeId: String!
    title: String!
    code: String!
    summary: String
    description: String
    platform: String
    status: String!
    priority: String
    version: String
    tags: String
    isVisible: Boolean!
    isArchived: Boolean!
    remark: String
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type FeatureListResult {
    items: [FeatureType!]!
    pageInfo: PageInfo!
  }

  type FeatureMutationResult {
    success: Boolean!
    message: String!
    error: MutationError
    data: FeatureType
  }

  # ===== AI Provider types =====
  type AiProviderType {
    id: ID!
    name: String!
    providerFormat: String!
    requestUrl: String!
    apiKeyHint: String
    modelName: String
    websiteUrl: String
    isDefault: Boolean!
    status: String!
    remark: String
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type AiProviderListResult {
    items: [AiProviderType!]!
    pageInfo: PageInfo!
  }

  type AiProviderMutationResult {
    success: Boolean!
    message: String!
    error: MutationError
    data: AiProviderType
  }

  # ===== Prompt types =====
  type PromptType {
    id: ID!
    name: String
    content: String!
    model: String
    providerId: String
    providerName: String
    createdById: String
    createdByName: String
    nodeIds: String
    featureIds: String
    customInstruction: String
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type PromptListResult {
    items: [PromptType!]!
    pageInfo: PageInfo!
  }

  type PromptMutationResult {
    success: Boolean!
    message: String!
    error: MutationError
    data: PromptType
  }

  type AiGenerateResult {
    success: Boolean!
    message: String!
    error: MutationError
    content: String
    model: String
    usage: String
  }

  # ===== Log types =====
  type AuditLogInfo {
    id: ID!
    operatorId: String
    operatorUsername: String
    action: String!
    resourceType: String
    resourceId: String
    resourceName: String
    detail: String
    ipAddress: String
    createdAt: DateTime!
  }

  type AuditLogListResult {
    total: Int!
    items: [AuditLogInfo!]!
  }

  type RequestLogInfo {
    id: ID!
    method: String!
    path: String!
    ipAddress: String
    userId: String
    username: String
    statusCode: Int
    responseTimeMs: Int
    userAgent: String
    createdAt: DateTime!
  }

  type RequestLogListResult {
    total: Int!
    items: [RequestLogInfo!]!
  }

  type LoginLogInfo {
    id: ID!
    userId: String
    username: String!
    success: Boolean!
    ipAddress: String
    userAgent: String
    failureReason: String
    createdAt: DateTime!
  }

  type LoginLogListResult {
    total: Int!
    items: [LoginLogInfo!]!
  }

  # ===== Auth types =====
  type AuthUserType {
    id: ID!
    username: String!
    email: String
    displayName: String
    status: String!
    isSuperAdmin: Boolean!
  }

  type LoginPayload {
    accessToken: String!
    tokenType: String!
    permissions: [String!]!
    user: AuthUserType!
  }

  type LoginResult {
    success: Boolean!
    message: String!
    error: MutationError
    data: LoginPayload
  }

  # ===== Inputs =====
  input PaginationInput {
    page: Int
    pageSize: Int
  }

  input CreateUserInput {
    username: String!
    password: String!
    email: String
    displayName: String
    phone: String
    avatarUrl: String
    remark: String
    isSuperAdmin: Boolean
  }

  input UpdateUserInput {
    email: String
    displayName: String
    phone: String
    avatarUrl: String
    remark: String
    isSuperAdmin: Boolean
  }

  input CreateRoleInput {
    name: String!
    code: String!
    description: String
    isSystem: Boolean
  }

  input UpdateRoleInput {
    name: String
    description: String
    status: String
  }

  input CreateNodeInput {
    name: String!
    code: String!
    nodeType: String
    parentId: ID
    sortOrder: Int
    remark: String
  }

  input UpdateNodeInput {
    name: String
    code: String
    nodeType: String
    parentId: ID
    sortOrder: Int
    remark: String
  }

  input CreateFeatureInput {
    nodeId: ID!
    title: String!
    code: String!
    summary: String
    description: String
    platform: String
    priority: String
    version: String
    tags: String
    remark: String
  }

  input UpdateFeatureInput {
    title: String
    summary: String
    description: String
    platform: String
    priority: String
    version: String
    tags: String
    remark: String
  }

  input CreateAiProviderInput {
    name: String!
    providerFormat: String!
    requestUrl: String!
    apiKey: String
    modelName: String
    websiteUrl: String
    isDefault: Boolean
    remark: String
  }

  input UpdateAiProviderInput {
    name: String
    requestUrl: String
    apiKey: String
    modelName: String
    websiteUrl: String
    isDefault: Boolean
    remark: String
    status: String
    providerFormat: String
  }

  input GeneratePromptInput {
    nodeIds: [ID!]!
    featureIds: [ID!]
    customInstruction: String
    providerId: ID
  }

  input SavePromptInput {
    content: String!
    model: String
    name: String
    nodeIds: String
    featureIds: String
    customInstruction: String
  }

  # ===== Query =====
  type Query {
    currentUser: UserType
    userList(pagination: PaginationInput!, keyword: String): UserListResult!
    roleList(pagination: PaginationInput!): RoleListResult!
    permissionTree: [PermissionModuleGroup!]!
    nodeTree: [NodeType!]!
    nodeList(pagination: PaginationInput!): NodeListResult!
    nodeDetail(nodeId: String!): NodeType
    searchNodes(keyword: String!, pagination: PaginationInput!): NodeListResult!
    featureList(pagination: PaginationInput!, nodeIds: [String!], includeHidden: Boolean): FeatureListResult!
    featureDetail(featureId: String!): FeatureType
    searchFeatures(keyword: String!, pagination: PaginationInput!, includeHidden: Boolean): FeatureListResult!
    auditLogList(keyword: String, action: String, operatorId: ID, page: Int, pageSize: Int): AuditLogListResult!
    requestLogList(keyword: String, userId: ID, page: Int, pageSize: Int): RequestLogListResult!
    loginLogList(keyword: String, userId: ID, success: Boolean, page: Int, pageSize: Int): LoginLogListResult!
    aiProviderList(pagination: PaginationInput!): AiProviderListResult!
    promptList(pagination: PaginationInput!, keyword: String, createdBy: String): PromptListResult!
  }

  # ===== Mutation =====
  type Mutation {
    # Auth
    login(username: String!, password: String!): LoginResult!
    logout: MutationResult!
    resetPassword(userId: String!, newPassword: String!): MutationResult!
    changeMyPassword(oldPassword: String!, newPassword: String!): MutationResult!

    # User management
    createUser(input: CreateUserInput!): UserMutationResult!
    updateUser(userId: String!, input: UpdateUserInput!): UserMutationResult!
    enableUser(userId: String!): MutationResult!
    disableUser(userId: String!): MutationResult!
    assignRolesToUser(userId: String!, roleIds: [String!]!): MutationResult!
    deleteUser(userId: String!): MutationResult!

    # Role management
    createRole(input: CreateRoleInput!): RoleMutationResult!
    updateRole(roleId: String!, input: UpdateRoleInput!): RoleMutationResult!
    assignPermissionsToRole(roleId: String!, permissionIds: [String!]!): MutationResult!
    deleteRole(roleId: String!): MutationResult!

    # Node management
    createNode(input: CreateNodeInput!): NodeMutationResult!
    updateNode(nodeId: String!, input: UpdateNodeInput!): NodeMutationResult!
    deleteNode(nodeId: String!): MutationResult!
    hideNode(nodeId: String!): MutationResult!
    showNode(nodeId: String!): MutationResult!
    copyNode(nodeId: String!, targetParentId: String, newName: String): NodeMutationResult!
    moveNode(nodeId: String!, targetParentId: String): NodeMutationResult!

    # Feature management
    createFeature(input: CreateFeatureInput!): FeatureMutationResult!
    updateFeature(featureId: String!, input: UpdateFeatureInput!, expectedUpdatedAt: String): FeatureMutationResult!
    deleteFeature(featureId: String!): MutationResult!
    hideFeature(featureId: String!): MutationResult!
    showFeature(featureId: String!): MutationResult!
    copyFeature(featureId: String!, targetNodeId: String!): FeatureMutationResult!
    moveFeature(featureId: String!, targetNodeId: String!): FeatureMutationResult!

    # AI Provider management
    createAiProvider(input: CreateAiProviderInput!): AiProviderMutationResult!
    updateAiProvider(providerId: String!, input: UpdateAiProviderInput!): AiProviderMutationResult!
    deleteAiProvider(providerId: String!): MutationResult!
    testAiConnection(providerId: String!): MutationResult!

    # Prompt management
    generatePrompt(input: GeneratePromptInput!): AiGenerateResult!
    savePrompt(input: SavePromptInput!): MutationResult!
    deletePrompt(promptId: String!): MutationResult!
    updatePromptName(promptId: String!, name: String): MutationResult!
  }
`;
