import { gql } from '@apollo/client';
import { AI_PROVIDER_BASE_FRAGMENT, PROMPT_BASE_FRAGMENT } from '../fragments';

export const AI_PROVIDER_LIST_QUERY = gql`
  query AiProviderList($pagination: PaginationInput!) {
    aiProviderList(pagination: $pagination) {
      items {
        ...AiProviderBase
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
  ${AI_PROVIDER_BASE_FRAGMENT}
`;

export const PROMPT_LIST_QUERY = gql`
  query PromptList($pagination: PaginationInput!) {
    promptList(pagination: $pagination) {
      items {
        ...PromptBase
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
  ${PROMPT_BASE_FRAGMENT}
`;
