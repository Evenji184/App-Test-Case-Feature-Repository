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
  const isSelected = selectedId === node.id;
  const isChecked = selectedIds?.has(node.id) ?? false;

  const handleNameClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectable && onCheck) {
      onCheck(node.id);
    } else {
      onSelect(node);
    }
  };

  const nameRow = (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: 8,
        alignItems: 'center',
        background: (selectable ? isChecked : isSelected) ? '#e6f4ff' : undefined,
        borderRadius: 8,
        padding: '4px 8px',
      }}
    >
      {selectable && (
        <Checkbox
          checked={isChecked}
          onChange={() => onCheck?.(node.id)}
          onClick={(e) => e.stopPropagation()}
        />
      )}
      <span style={{ flex: 1 }} onClick={handleNameClick}>{node.name}</span>
      <Tag color={node.isVisible ? 'primary' : 'default'}>{node.nodeType}</Tag>
    </div>
  );

  if (!node.children.length) {
    return (
      <div
        style={{
          padding: '10px 12px',
          borderRadius: 12,
          background: (selectable ? isChecked : isSelected) ? '#e6f4ff' : '#f7f8fa',
          marginBottom: 8,
        }}
      >
        {nameRow}
      </div>
    );
  }

  return (
    <Collapse defaultActiveKey={[node.id]}>
      <Collapse.Panel key={node.id} title={nameRow}>
        <div style={{ paddingLeft: 8 }}>
          {node.children.map((child) => (
            <TreeNode key={child.id} node={child} selectedId={selectedId} onSelect={onSelect} selectable={selectable} selectedIds={selectedIds} onCheck={onCheck} />
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
        <TreeNode key={node.id} node={node} selectedId={selectedId} onSelect={onSelect} selectable={selectable} selectedIds={selectedIds} onCheck={onCheck} />
      ))}
    </div>
  );
}