import { gql } from '@apollo/client';
import { USER_BASE_FRAGMENT } from '../fragments';

export const CREATE_USER_MUTATION = gql`
  mutation CreateUser($input: CreateUserInput!) {
    createUser(input: $input) {
      success
      message
      error {
        code
        message
      }
      data {
        ...UserBase
      }
    }
  }
  ${USER_BASE_FRAGMENT}
`;

export const UPDATE_USER_MUTATION = gql`
  mutation UpdateUser($userId: String!, $input: UpdateUserInput!) {
    updateUser(userId: $userId, input: $input) {
      success
      message
      error {
        code
        message
      }
      data {
        ...UserBase
      }
    }
  }
  ${USER_BASE_FRAGMENT}
`;

export const ENABLE_USER_MUTATION = gql`
  mutation EnableUser($userId: String!) {
    enableUser(userId: $userId) {
      success
      message
      error {
        code
        message
      }
    }
  }
`;

export const DISABLE_USER_MUTATION = gql`
  mutation DisableUser($userId: String!) {
    disableUser(userId: $userId) {
      success
      message
      error {
        code
        message
      }
    }
  }
`;

export const ASSIGN_ROLES_TO_USER_MUTATION = gql`
  mutation AssignRolesToUser($userId: String!, $roleIds: [String!]!) {
    assignRolesToUser(userId: $userId, roleIds: $roleIds) {
      success
      message
      error {
        code
        message
      }
    }
  }
`;

export const RESET_PASSWORD_MUTATION = gql`
  mutation ResetPassword($userId: String!, $newPassword: String!) {
    resetPassword(userId: $userId, newPassword: $newPassword) {
      success
      message
      error {
        code
        message
      }
    }
  }
`;
