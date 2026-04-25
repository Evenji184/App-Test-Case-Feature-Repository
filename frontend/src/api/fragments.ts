import { gql } from '@apollo/client';

export const USER_BASE_FRAGMENT = gql`
  fragment UserBase on UserType {
    id
    username
    email
    displayName
    phone
    avatarUrl
    status
    isSuperAdmin
    lastLoginAt
    lastLoginIp
    remark
    createdAt
    updatedAt
  }
`;

export const AUTH_USER_FRAGMENT = gql`
  fragment AuthUserBase on AuthUserType {
    id
    username
    email
    displayName
    status
    isSuperAdmin
  }
`;

export const ROLE_BASE_FRAGMENT = gql`
  fragment RoleBase on RoleType {
    id
    name
    code
    description
    isSystem
    status
    createdAt
    updatedAt
  }
`;

export const PERMISSION_BASE_FRAGMENT = gql`
  fragment PermissionBase on PermissionType {
    id
    name
    code
    module
    resource
    action
    description
  }
`;

export const NODE_BASE_FRAGMENT = gql`
  fragment NodeBase on NodeType {
    id
    parentId
    name
    code
    nodeType
    path
    level
    sortOrder
    isVisible
    isLocked
    remark
    createdAt
    updatedAt
  }
`;

export const FEATURE_BASE_FRAGMENT = gql`
  fragment FeatureBase on FeatureType {
    id
    nodeId
    title
    code
    summary
    description
    platform
    status
    priority
    version
    tags
    isVisible
    isArchived
    remark
    createdAt
    updatedAt
  }
`;
