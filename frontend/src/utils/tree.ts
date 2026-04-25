import type { NodeTreeItem } from '@/types/models';

export function flattenTree(tree: NodeTreeItem[]): NodeTreeItem[] {
  return tree.flatMap((item) => [item, ...flattenTree(item.children)]);
}

export function findNodeById(tree: NodeTreeItem[], nodeId?: string | null): NodeTreeItem | null {
  if (!nodeId) {
    return null;
  }

  for (const item of tree) {
    if (item.id === nodeId) {
      return item;
    }

    const child = findNodeById(item.children, nodeId);
    if (child) {
      return child;
    }
  }

  return null;
}
