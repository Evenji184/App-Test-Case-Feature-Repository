import { gql } from '@apollo/client';
import { AUTH_USER_FRAGMENT } from '../fragments';

export const LOGIN_MUTATION = gql`
  mutation Login($username: String!, $password: String!) {
    login(username: $username, password: $password) {
      success
      message
      error {
        code
        message
      }
      data {
        accessToken
        tokenType
        permissions
        user {
          ...AuthUserBase
        }
      }
    }
  }
  ${AUTH_USER_FRAGMENT}
`;

export const LOGOUT_MUTATION = gql`
  mutation Logout {
    logout {
      success
      message
      error {
        code
        message
      }
    }
  }
`;
