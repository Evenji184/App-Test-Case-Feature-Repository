import { gql } from '@apollo/client';
import { FEATURE_BASE_FRAGMENT } from '../fragments';

export const FEATURE_LIST_QUERY = gql`
  query FeatureList($pagination: PaginationInput!, $nodeId: String) {
    featureList(pagination: $pagination, nodeId: $nodeId) {
      items {
        ...FeatureBase
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
  ${FEATURE_BASE_FRAGMENT}
`;

export const FEATURE_DETAIL_QUERY = gql`
  query FeatureDetail($featureId: String!) {
    featureDetail(featureId: $featureId) {
      ...FeatureBase
    }
  }
  ${FEATURE_BASE_FRAGMENT}
`;

export const SEARCH_FEATURES_QUERY = gql`
  query SearchFeatures($keyword: String!, $pagination: PaginationInput!) {
    searchFeatures(keyword: $keyword, pagination: $pagination) {
      items {
        ...FeatureBase
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
  ${FEATURE_BASE_FRAGMENT}
`;
