import { gql } from '@apollo/client';
import { PERMISSION_BASE_FRAGMENT, ROLE_BASE_FRAGMENT } from '../fragments';

export const ROLE_LIST_QUERY = gql`
  query RoleList($pagination: PaginationInput!) {
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

export const PERMISSION_TREE_QUERY = gql`
  query PermissionTree {
    permissionTree {
      module
      resources {
        resource
        permissions {
          ...PermissionBase
        }
      }
    }
  }
  ${PERMISSION_BASE_FRAGMENT}
`;
