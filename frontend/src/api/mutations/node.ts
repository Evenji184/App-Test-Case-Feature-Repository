import { gql } from '@apollo/client';
import { NODE_BASE_FRAGMENT } from '../fragments';

export const CREATE_NODE_MUTATION = gql`
  mutation CreateNode($input: CreateNodeInput!) {
    createNode(input: $input) {
      success
      message
      error {
        code
        message
      }
      data {
        ...NodeBase
      }
    }
  }
  ${NODE_BASE_FRAGMENT}
`;

export const UPDATE_NODE_MUTATION = gql`
  mutation UpdateNode($nodeId: String!, $input: UpdateNodeInput!) {
    updateNode(nodeId: $nodeId, input: $input) {
      success
      message
      error {
        code
        message
      }
      data {
        ...NodeBase
      }
    }
  }
  ${NODE_BASE_FRAGMENT}
`;

export const DELETE_NODE_MUTATION = gql`
  mutation DeleteNode($nodeId: String!) {
    deleteNode(nodeId: $nodeId) {
      success
      message
      error {
        code
        message
      }
    }
  }
`;

export const HIDE_NODE_MUTATION = gql`
  mutation HideNode($nodeId: String!) {
    hideNode(nodeId: $nodeId) {
      success
      message
      error {
        code
        message
      }
    }
  }
`;

export const SHOW_NODE_MUTATION = gql`
  mutation ShowNode($nodeId: String!) {
    showNode(nodeId: $nodeId) {
      success
      message
      error {
        code
        message
      }
    }
  }
`;

export const COPY_NODE_MUTATION = gql`
  mutation CopyNode($nodeId: String!, $targetParentId: String, $newName: String) {
    copyNode(nodeId: $nodeId, targetParentId: $targetParentId, newName: $newName) {
      success
      message
      error {
        code
        message
      }
      data {
        ...NodeBase
      }
    }
  }
  ${NODE_BASE_FRAGMENT}
`;

export const MOVE_NODE_MUTATION = gql`
  mutation MoveNode($nodeId: String!, $targetParentId: String) {
    moveNode(nodeId: $nodeId, targetParentId: $targetParentId) {
      success
      message
      error {
        code
        message
      }
      data {
        ...NodeBase
      }
    }
  }
  ${NODE_BASE_FRAGMENT}
`;
