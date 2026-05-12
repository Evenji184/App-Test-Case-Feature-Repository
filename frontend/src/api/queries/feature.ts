import { gql } from '@apollo/client';
import { FEATURE_BASE_FRAGMENT } from '../fragments';

export const FEATURE_LIST_QUERY = gql`
  query FeatureList($pagination: PaginationInput!, $nodeIds: [String!], $includeHidden: Boolean) {
    featureList(pagination: $pagination, nodeIds: $nodeIds, includeHidden: $includeHidden) {
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
  query SearchFeatures($keyword: String!, $pagination: PaginationInput!, $includeHidden: Boolean) {
    searchFeatures(keyword: $keyword, pagination: $pagination, includeHidden: $includeHidden) {
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
