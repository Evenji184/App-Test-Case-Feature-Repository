import { Checkbox, Collapse, Empty, Tag } from 'antd-mobile';
import type { NodeTreeItem } from '@/types/models';

interface Props {
  tree: NodeTreeItem[];
  selectedId?: string;
  onSelect: (node: NodeTreeItem) => void;
  selectable?: boolean;
  selectedIds?: Set<string>;
  onCheck?: (id: string) => void;
}

function TreeNode({
  node,
  selectedId,
  onSelect,
  selectable,
  selectedIds,
  onCheck,
}: {
  node: NodeTreeItem;
  selectedId?: string;
  onSelect: (node: NodeTreeItem) => void;
  selectable?: boolean;
  selectedIds?: Set<string>;
  onCheck?: (id: string) => void;
}) {
  const isActive = selectable ? (selectedIds?.has(node.id) ?? false) : selectedId === node.id;

  const nameRow = (
    <div
      onClick={(e) => {
        e.stopPropagation();
        if (selectable) {
          onCheck?.(node.id);
        }
        onSelect(node);
      }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        background: isActive ? 'var(--color-primary-alpha)' : 'transparent',
        borderRadius: 8,
        padding: '4px 8px',
        cursor: 'pointer',
        transition: 'background 0.15s',
      }}
    >
      {selectable && (
        <Checkbox
          checked={selectedIds?.has(node.id) ?? false}
          onChange={() => onCheck?.(node.id)}
          onClick={(e) => e.stopPropagation()}
        />
      )}
      <span style={{ flex: 1, fontSize: 13 }}>{node.name}</span>
      <Tag color={node.isVisible ? 'primary' : 'default'} style={{ fontSize: 10 }}>
        {node.nodeType}
      </Tag>
    </div>
  );

  if (!node.children.length) {
    return (
      <div
        style={{
          borderRadius: 10,
          background: isActive ? 'var(--color-primary-alpha)' : 'var(--bg-elevated)',
          border: isActive ? '1px solid var(--color-border-accent)' : '1px solid var(--color-border)',
          marginBottom: 6,
          transition: 'background 0.15s, border-color 0.15s',
        }}
      >
        {nameRow}
      </div>
    );
  }

  return (
    <Collapse defaultActiveKey={[node.id]} style={{ marginBottom: 6 }}>
      <Collapse.Panel key={node.id} title={nameRow}>
        <div style={{ paddingLeft: 8 }}>
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              selectedId={selectedId}
              onSelect={onSelect}
              selectable={selectable}
              selectedIds={selectedIds}
              onCheck={onCheck}
            />
          ))}
        </div>
      </Collapse.Panel>
    </Collapse>
  );
}

export function TreeView({ tree, selectedId, onSelect, selectable, selectedIds, onCheck }: Props) {
  if (!tree.length) {
    return <Empty description="暂无节点数据" />;
  }

  return (
    <div>
      {tree.map((node) => (
        <TreeNode
          key={node.id}
          node={node}
          selectedId={selectedId}
          onSelect={onSelect}
          selectable={selectable}
          selectedIds={selectedIds}
          onCheck={onCheck}
        />
      ))}
    </div>
  );
}
