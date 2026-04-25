import { gql } from '@apollo/client';
import { FEATURE_BASE_FRAGMENT } from '../fragments';

export const CREATE_FEATURE_MUTATION = gql`
  mutation CreateFeature($input: CreateFeatureInput!) {
    createFeature(input: $input) {
      success
      message
      error {
        code
        message
      }
      data {
        ...FeatureBase
      }
    }
  }
  ${FEATURE_BASE_FRAGMENT}
`;

export const UPDATE_FEATURE_MUTATION = gql`
  mutation UpdateFeature($featureId: String!, $input: UpdateFeatureInput!) {
    updateFeature(featureId: $featureId, input: $input) {
      success
      message
      error {
        code
        message
      }
      data {
        ...FeatureBase
      }
    }
  }
  ${FEATURE_BASE_FRAGMENT}
`;

export const DELETE_FEATURE_MUTATION = gql`
  mutation DeleteFeature($featureId: String!) {
    deleteFeature(featureId: $featureId) {
      success
      message
      error {
        code
        message
      }
    }
  }
`;

export const HIDE_FEATURE_MUTATION = gql`
  mutation HideFeature($featureId: String!) {
    hideFeature(featureId: $featureId) {
      success
      message
      error {
        code
        message
      }
    }
  }
`;

export const SHOW_FEATURE_MUTATION = gql`
  mutation ShowFeature($featureId: String!) {
    showFeature(featureId: $featureId) {
      success
      message
      error {
        code
        message
      }
    }
  }
`;

export const COPY_FEATURE_MUTATION = gql`
  mutation CopyFeature($featureId: String!, $targetNodeId: String!) {
    copyFeature(featureId: $featureId, targetNodeId: $targetNodeId) {
      success
      message
      error {
        code
        message
      }
      data {
        ...FeatureBase
      }
    }
  }
  ${FEATURE_BASE_FRAGMENT}
`;

export const MOVE_FEATURE_MUTATION = gql`
  mutation MoveFeature($featureId: String!, $targetNodeId: String!) {
    moveFeature(featureId: $featureId, targetNodeId: $targetNodeId) {
      success
      message
      error {
        code
        message
      }
      data {
        ...FeatureBase
      }
    }
  }
  ${FEATURE_BASE_FRAGMENT}
`;
