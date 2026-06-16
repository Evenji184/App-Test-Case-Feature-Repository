import { gql } from '@apollo/client';
import { USER_BASE_FRAGMENT } from '../fragments';

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
