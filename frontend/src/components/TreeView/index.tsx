import { Collapse, Empty, Tag } from 'antd-mobile';
import type { NodeTreeItem } from '@/types/models';

interface Props {
  tree: NodeTreeItem[];
  selectedId?: string;
  onSelect: (node: NodeTreeItem) => void;
}

function TreeNode({ node, selectedId, onSelect }: { node: NodeTreeItem; selectedId?: string; onSelect: (node: NodeTreeItem) => void }) {
  const isSelected = selectedId === node.id;

  if (!node.children.length) {
    return (
      <div
        style={{
          padding: '10px 12px',
          borderRadius: 12,
          background: isSelected ? '#e6f4ff' : '#f7f8fa',
          marginBottom: 8,
        }}
        onClick={() => onSelect(node)}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
          <span>{node.name}</span>
          <Tag color={node.isVisible ? 'primary' : 'default'}>{node.nodeType}</Tag>
        </div>
      </div>
    );
  }

  return (
    <Collapse defaultActiveKey={[node.id]}>
      <Collapse.Panel
        key={node.id}
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', paddingRight: 8 }} onClick={() => onSelect(node)}>
            <span>{node.name}</span>
            <Tag color={node.isVisible ? 'primary' : 'default'}>{node.nodeType}</Tag>
          </div>
        }
      >
        <div style={{ paddingLeft: 8 }}>
          {node.children.map((child) => (
            <TreeNode key={child.id} node={child} selectedId={selectedId} onSelect={onSelect} />
          ))}
        </div>
      </Collapse.Panel>
    </Collapse>
  );
}

export function TreeView({ tree, selectedId, onSelect }: Props) {
  if (!tree.length) {
    return <Empty description="暂无节点数据" />;
  }

  return (
    <div>
      {tree.map((node) => (
        <TreeNode key={node.id} node={node} selectedId={selectedId} onSelect={onSelect} />
      ))}
    </div>
  );
}
