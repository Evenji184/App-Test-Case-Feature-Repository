import { gql } from '@apollo/client';
import { USER_BASE_FRAGMENT, ROLE_BASE_FRAGMENT } from '../fragments';

export const USER_LIST_QUERY = gql`
  query UserList($pagination: PaginationInput!, $keyword: String) {
    userList(pagination: $pagination, keyword: $keyword) {
      items {
        ...UserBase
      }
      pageInfo {
        total
        page
        pageSize
        totalPages
        hasNextPage
        hasPreviousPage
      }
    }
  }
  ${USER_BASE_FRAGMENT}
`;

export const ROLE_LIST_FOR_USER_QUERY = gql`
  query RoleListForUser($pagination: PaginationInput!) {
    roleList(pagination: $pagination) {
      items {
        ...RoleBase
      }
      pageInfo {
        total
        page
        pageSize
        totalPages
        hasNextPage
        hasPreviousPage
      }
    }
  }
  ${ROLE_BASE_FRAGMENT}
`;
