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
  query PromptList($pagination: PaginationInput!, $keyword: String, $createdBy: String) {
    promptList(pagination: $pagination, keyword: $keyword, createdBy: $createdBy) {
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
