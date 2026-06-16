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

  if (selectable) {
    return (
      <div>
        {items.map((item) => (
          <div
            key={item.id}
            onClick={() => onSelect?.(item.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 0',
              borderBottom: '1px solid var(--color-border)',
              cursor: 'pointer',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <Checkbox
              checked={selectedIds?.has(item.id) ?? false}
              onClick={(e) => e.stopPropagation()}
              onChange={() => onSelect?.(item.id)}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: 'var(--color-text)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {item.title}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: 'var(--color-text-secondary)',
                  marginTop: 2,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {item.code}
                {item.summary ? ` · ${item.summary}` : ''}
              </div>
            </div>
            <Tag
              color={item.priority === 'high' ? 'danger' : item.priority === 'medium' ? 'warning' : 'default'}
              style={{ fontSize: 10, flexShrink: 0 }}
            >
              {item.priority}
            </Tag>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {items.map((item) => (
        <Card key={item.id} onClick={() => onClick?.(item)}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{item.title}</div>
              <div style={{ color: 'var(--color-text-secondary)', fontSize: 12, marginTop: 4 }}>{item.code}</div>
            </div>
            {extra?.(item)}
          </div>
          <div style={{ color: 'var(--color-text-secondary)', marginTop: 8 }}>{item.summary || '暂无摘要'}</div>
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
