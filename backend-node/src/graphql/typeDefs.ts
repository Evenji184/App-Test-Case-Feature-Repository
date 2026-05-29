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

  # ===== User types =====
  type UserInfo {
    id: ID!
    username: String!
    email: String
    fullName: String
    avatar: String
    status: String!
    isSuperAdmin: Boolean!
    isSystem: Boolean!
    lastLoginAt: DateTime
    lastLoginIp: String
    createdAt: DateTime!
    updatedAt: DateTime!
    roles: [RoleInfo!]!
    permissions: [String!]!
  }

  type UserListItem {
    id: ID!
    username: String!
    email: String
    fullName: String
    avatar: String
    status: String!
    isSuperAdmin: Boolean!
    isSystem: Boolean!
    lastLoginAt: DateTime
    createdAt: DateTime!
    roles: [RoleInfo!]!
  }

  type UserListResult {
    total: Int!
    items: [UserListItem!]!
  }

  type UserMutationResult {
    success: Boolean!
    message: String!
    error: MutationError
    user: UserInfo
  }

  # ===== Role types =====
  type RoleInfo {
    id: ID!
    name: String!
    code: String!
    description: String
    isSystem: Boolean!
    status: String!
    createdAt: DateTime!
    permissions: [PermissionInfo!]!
  }

  type RoleListResult {
    total: Int!
    items: [RoleInfo!]!
  }

  type RoleMutationResult {
    success: Boolean!
    message: String!
    error: MutationError
    role: RoleInfo
  }

  # ===== Permission types =====
  type PermissionInfo {
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
    actions: [PermissionInfo!]!
  }

  type PermissionModuleGroup {
    module: String!
    resources: [PermissionResourceGroup!]!
  }

  # ===== FeatureNode types =====
  type NodeInfo {
    id: ID!
    name: String!
    code: String!
    description: String
    parentId: String
    path: String!
    level: Int!
    sortOrder: Int!
    isVisible: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
    children: [NodeInfo!]!
  }

  type NodeListItem {
    id: ID!
    name: String!
    code: String!
    description: String
    parentId: String
    path: String!
    level: Int!
    sortOrder: Int!
    isVisible: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type NodeListResult {
    total: Int!
    items: [NodeListItem!]!
  }

  type NodeMutationResult {
    success: Boolean!
    message: String!
    error: MutationError
    node: NodeInfo
  }

  # ===== Feature types =====
  type FeatureInfo {
    id: ID!
    nodeId: String!
    title: String!
    code: String!
    summary: String
    description: String
    platform: String
    priority: String
    status: String!
    isVisible: Boolean!
    archivedAt: DateTime
    createdAt: DateTime!
    updatedAt: DateTime!
    createdBy: String
  }

  type FeatureListResult {
    total: Int!
    items: [FeatureInfo!]!
  }

  type FeatureMutationResult {
    success: Boolean!
    message: String!
    error: MutationError
    feature: FeatureInfo
  }

  # ===== AI Provider types =====
  type AiProviderInfo {
    id: ID!
    name: String!
    providerFormat: String!
    requestUrl: String!
    apiKeyHint: String
    modelName: String
    isDefault: Boolean!
    status: String!
    description: String
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type AiProviderMutationResult {
    success: Boolean!
    message: String!
    error: MutationError
    provider: AiProviderInfo
  }

  # ===== Prompt types =====
  type PromptProviderInfo {
    id: ID!
    name: String!
    modelName: String
  }

  type PromptCreatedByUser {
    id: ID!
    username: String!
    fullName: String
  }

  type PromptInfo {
    id: ID!
    name: String
    content: String!
    model: String
    nodeIds: String
    featureIds: String
    customInstruction: String
    provider: PromptProviderInfo
    createdByUser: PromptCreatedByUser
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type PromptListResult {
    total: Int!
    items: [PromptInfo!]!
  }

  type PromptMutationResult {
    success: Boolean!
    message: String!
    error: MutationError
    prompt: PromptInfo
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
  type LoginResult {
    success: Boolean!
    message: String!
    error: MutationError
    token: String
    user: UserInfo
  }

  # ===== Inputs =====
  input CreateUserInput {
    username: String!
    password: String!
    email: String
    fullName: String
  }

  input UpdateUserInput {
    userId: ID!
    email: String
    fullName: String
  }

  input CreateRoleInput {
    name: String!
    code: String!
    description: String
  }

  input UpdateRoleInput {
    roleId: ID!
    name: String
    description: String
  }

  input CreateNodeInput {
    name: String!
    code: String!
    description: String
    parentId: ID
    sortOrder: Int
  }

  input UpdateNodeInput {
    nodeId: ID!
    name: String
    code: String
    description: String
    parentId: ID
    sortOrder: Int
  }

  input CreateFeatureInput {
    nodeId: ID!
    title: String!
    code: String!
    summary: String
    description: String
    platform: String
    priority: String
  }

  input UpdateFeatureInput {
    featureId: ID!
    title: String
    summary: String
    description: String
    platform: String
    priority: String
    expectedUpdatedAt: DateTime
  }

  input CreateAiProviderInput {
    name: String!
    providerFormat: String!
    requestUrl: String!
    apiKey: String
    modelName: String
    isDefault: Boolean
    description: String
  }

  input UpdateAiProviderInput {
    providerId: ID!
    name: String
    requestUrl: String
    apiKey: String
    modelName: String
    isDefault: Boolean
    description: String
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
    currentUser: UserInfo
    userList(keyword: String, page: Int, pageSize: Int): UserListResult!
    roleList(keyword: String, page: Int, pageSize: Int): RoleListResult!
    permissionTree: [PermissionModuleGroup!]!
    nodeTree: [NodeInfo!]!
    nodeList(keyword: String, page: Int, pageSize: Int): NodeListResult!
    nodeDetail(nodeId: ID!): NodeInfo
    searchNodes(keyword: String!): [NodeListItem!]!
    featureList(nodeId: ID, nodeIds: [ID!], keyword: String, page: Int, pageSize: Int, includeHidden: Boolean): FeatureListResult!
    featureDetail(featureId: ID!): FeatureInfo
    searchFeatures(keyword: String!): [FeatureInfo!]!
    auditLogList(keyword: String, action: String, operatorId: ID, page: Int, pageSize: Int): AuditLogListResult!
    requestLogList(keyword: String, userId: ID, page: Int, pageSize: Int): RequestLogListResult!
    loginLogList(keyword: String, userId: ID, success: Boolean, page: Int, pageSize: Int): LoginLogListResult!
    aiProviderList: [AiProviderInfo!]!
    promptList(providerId: ID, keyword: String, page: Int, pageSize: Int): PromptListResult!
  }

  # ===== Mutation =====
  type Mutation {
    # Auth
    login(username: String!, password: String!): LoginResult!
    logout: MutationResult!
    resetPassword(userId: ID!, newPassword: String!): MutationResult!
    changeMyPassword(oldPassword: String!, newPassword: String!): MutationResult!

    # User management
    createUser(input: CreateUserInput!): UserMutationResult!
    updateUser(input: UpdateUserInput!): UserMutationResult!
    enableUser(userId: ID!): MutationResult!
    disableUser(userId: ID!): MutationResult!
    assignRolesToUser(userId: ID!, roleIds: [ID!]!): MutationResult!
    deleteUser(userId: ID!): MutationResult!

    # Role management
    createRole(input: CreateRoleInput!): RoleMutationResult!
    updateRole(input: UpdateRoleInput!): RoleMutationResult!
    assignPermissionsToRole(roleId: ID!, permissionIds: [ID!]!): MutationResult!
    deleteRole(roleId: ID!): MutationResult!

    # Node management
    createNode(input: CreateNodeInput!): NodeMutationResult!
    updateNode(input: UpdateNodeInput!): NodeMutationResult!
    deleteNode(nodeId: ID!): MutationResult!
    hideNode(nodeId: ID!): MutationResult!
    showNode(nodeId: ID!): MutationResult!
    copyNode(nodeId: ID!): NodeMutationResult!
    moveNode(nodeId: ID!, targetParentId: ID): NodeMutationResult!

    # Feature management
    createFeature(input: CreateFeatureInput!): FeatureMutationResult!
    updateFeature(input: UpdateFeatureInput!): FeatureMutationResult!
    deleteFeature(featureId: ID!): MutationResult!
    hideFeature(featureId: ID!): MutationResult!
    showFeature(featureId: ID!): MutationResult!
    copyFeature(featureId: ID!, targetNodeId: ID): FeatureMutationResult!
    moveFeature(featureId: ID!, targetNodeId: ID!): FeatureMutationResult!

    # AI Provider management
    createAiProvider(input: CreateAiProviderInput!): AiProviderMutationResult!
    updateAiProvider(input: UpdateAiProviderInput!): AiProviderMutationResult!
    deleteAiProvider(providerId: ID!): MutationResult!
    testAiConnection(providerId: ID!): MutationResult!

    # Prompt management
    generatePrompt(input: GeneratePromptInput!): PromptMutationResult!
    savePrompt(input: SavePromptInput!): PromptMutationResult!
    deletePrompt(promptId: ID!): MutationResult!
    updatePromptName(promptId: ID!, name: String!): PromptMutationResult!
  }
`;
