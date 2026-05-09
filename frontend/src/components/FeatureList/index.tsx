import { Card, Checkbox, Empty, Tag } from 'antd-mobile';
import type { FeatureItem } from '@/types/models';

interface Props {
  items: FeatureItem[];
  onClick?: (item: FeatureItem) => void;
  extra?: (item: FeatureItem) => React.ReactNode;
  selectable?: boolean;
  selectedIds?: Set<string>;
  onSelect?: (id: string) => void;
}

export function FeatureList({ items, onClick, extra, selectable, selectedIds, onSelect }: Props) {
  if (!items.length) {
    return <Empty description="暂无特征数据" />;
  }

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {items.map((item) => (
        <Card key={item.id} onClick={() => onClick?.(item)}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', flex: 1 }}>
              {selectable && (
                <Checkbox
                  checked={selectedIds?.has(item.id) ?? false}
                  onClick={(e) => { e.stopPropagation(); onSelect?.(item.id); }}
                />
              )}
              <div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>{item.title}</div>
                <div style={{ color: '#6b7280', fontSize: 12, marginTop: 4 }}>{item.code}</div>
              </div>
            </div>
            {extra?.(item)}
          </div>
          <div style={{ color: '#4b5563', marginTop: 8 }}>{item.summary || '暂无摘要'}</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
            <Tag color="primary">{item.status}</Tag>
            <Tag color="warning">{item.priority}</Tag>
            {item.platform ? <Tag>{item.platform}</Tag> : null}
            {item.isVisible ? <Tag color="success">可见</Tag> : <Tag>隐藏</Tag>}
          </div>
        </Card>
      ))}
    </div>
  );
}
