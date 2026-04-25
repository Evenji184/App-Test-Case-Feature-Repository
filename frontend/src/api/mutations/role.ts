import { gql } from '@apollo/client';
import { ROLE_BASE_FRAGMENT } from '../fragments';

export const CREATE_ROLE_MUTATION = gql`
  mutation CreateRole($input: CreateRoleInput!) {
    createRole(input: $input) {
      success
      message
      error {
        code
        message
      }
      data {
        ...RoleBase
      }
    }
  }
  ${ROLE_BASE_FRAGMENT}
`;

export const UPDATE_ROLE_MUTATION = gql`
  mutation UpdateRole($roleId: String!, $input: UpdateRoleInput!) {
    updateRole(roleId: $roleId, input: $input) {
      success
      message
      error {
        code
        message
      }
      data {
        ...RoleBase
      }
    }
  }
  ${ROLE_BASE_FRAGMENT}
`;

export const ASSIGN_PERMISSIONS_TO_ROLE_MUTATION = gql`
  mutation AssignPermissionsToRole($roleId: String!, $permissionIds: [String!]!) {
    assignPermissionsToRole(roleId: $roleId, permissionIds: $permissionIds) {
      success
      message
      error {
        code
        message
      }
    }
  }
`;
