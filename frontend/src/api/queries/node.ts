import { gql } from '@apollo/client';
import { NODE_BASE_FRAGMENT } from '../fragments';

export const NODE_TREE_QUERY = gql`
  query NodeTree {
    nodeTree {
      id
      parentId
      name
      code
      nodeType
      path
      level
      sortOrder
      isVisible
      children {
        id
        parentId
        name
        code
        nodeType
        path
        level
        sortOrder
        isVisible
        children {
          id
          parentId
          name
          code
          nodeType
          path
          level
          sortOrder
          isVisible
          children {
            id
            parentId
            name
            code
            nodeType
            path
            level
            sortOrder
            isVisible
          }
        }
      }
    }
  }
`;

export const NODE_LIST_QUERY = gql`
  query NodeList($pagination: PaginationInput!) {
    nodeList(pagination: $pagination) {
      items {
        ...NodeBase
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
  ${NODE_BASE_FRAGMENT}
`;

export const NODE_DETAIL_QUERY = gql`
  query NodeDetail($nodeId: String!) {
    nodeDetail(nodeId: $nodeId) {
      ...NodeBase
    }
  }
  ${NODE_BASE_FRAGMENT}
`;

export const SEARCH_NODES_QUERY = gql`
  query SearchNodes($keyword: String!, $pagination: PaginationInput!) {
    searchNodes(keyword: $keyword, pagination: $pagination) {
      items {
        ...NodeBase
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
  ${NODE_BASE_FRAGMENT}
`;
