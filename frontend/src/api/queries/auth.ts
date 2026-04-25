import { gql } from '@apollo/client';
import { USER_BASE_FRAGMENT } from '../fragments';

export const CURRENT_USER_QUERY = gql`
  query CurrentUser {
    currentUser {
      ...UserBase
    }
  }
  ${USER_BASE_FRAGMENT}
`;
