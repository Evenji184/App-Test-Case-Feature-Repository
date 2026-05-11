import type { CSSProperties } from 'react';
import { useMemo, useState } from 'react';
import { useQuery } from '@apollo/client';
import { Button, DotLoading, Empty, ErrorBlock, FloatingBubble, Toast } from 'antd-mobile';
import { FilterOutline } from 'antd-mobile-icons';
import { FEATURE_LIST_QUERY, SEARCH_FEATURES_QUERY } from '@/api/queries/feature';
import { NODE_TREE_QUERY } from '@/api/queries/node';
import { FeatureList } from '@/components/FeatureList';
import { SearchBar } from '@/components/SearchBar';
import { TreeView } from '@/components/TreeView';
import { FormDrawer } from '@/components/FormDrawer';
import { useAppStore } from '@/stores/app';
import type {
  FeatureListQueryData,
  FeatureListQueryVariables,
  NodeTreeQueryData,
  SearchFeaturesQueryData,
  SearchFeaturesQueryVariables,
} from '@/types/graphql';

export function FeatureLibraryPage() {
  const { selectedNodeIds, setSelectedNodeIds, toggleNodeSelection, clearNodeSelection, keyword, setKeyword } = useAppStore();
  const [treeVisible, setTreeVisible] = useState(false);

  const nodeTreeQuery = useQuery<NodeTreeQueryData>(NODE_TREE_QUERY);

  const nodeIdsForQuery = selectedNodeIds.size > 0 ? Array.from(selectedNodeIds) : undefined;

  const featureQuery = useQuery<FeatureListQueryData, FeatureListQueryVariables>(FEATURE_LIST_QUERY, {
    variables: { pagination: { page: 1, pageSize: 20 }, nodeIds: nodeIdsForQuery },
    skip: Boolean(keyword),
  });
  const searchQuery = useQuery<SearchFeaturesQueryData, SearchFeaturesQueryVariables>(SEARCH_FEATURES_QUERY, {
    variables: { keyword, pagination: { page: 1, pageSize: 20 } },
    skip: !keyword,
  });

  const features = useMemo(() => {
    if (keyword) {
      return searchQuery.data?.searchFeatures.items ?? [];
    }
    return featureQuery.data?.featureList.items ?? [];
  }, [featureQuery.data, keyword, searchQuery.data]);

  const loading = nodeTreeQuery.loading || featureQuery.loading || searchQuery.loading;
  const error = nodeTreeQuery.error || featureQuery.error || searchQuery.error;

  return (
    <div className="split-layout">
      <div className="card-section" style={{ display: 'none' }} />
      <div className="card-section" style={{ display: 'grid', gap: 12 }}>
        <div>
          <h2 className="page-title">特征库展示</h2>
          <p className="page-subtitle">勾选节点筛选特征，未选则显示全部</p>
        </div>
        {selectedNodeIds.size > 0 && (
          <Button block fill="outline" onClick={() => { clearNodeSelection(); }}>
            清除筛选 ({selectedNodeIds.size} 个节点)
          </Button>
        )}
        <SearchBar value={keyword} onChange={setKeyword} onSearch={setKeyword} placeholder="搜索特征标题、编码" />
        {loading ? (
          <div style={{ display: 'grid', placeItems: 'center', minHeight: 240 }}>
            <DotLoading />
          </div>
        ) : error ? (
          <ErrorBlock status="default" title="数据加载失败" description={error.message} />
        ) : features.length ? (
          <FeatureList
            items={features}
            onClick={(item) => Toast.show({ content: `已选择特征：${item.title}` })}
          />
        ) : (
          <Empty description="暂无特征数据" />
        )}
      </div>

      <FloatingBubble
        axis="xy"
        magnetic="x"
        style={{ '--initial-position-bottom': '96px', '--initial-position-right': '24px' } as CSSProperties}
        onClick={() => setTreeVisible(true)}
      >
        <FilterOutline fontSize={24} />
      </FloatingBubble>

      <FormDrawer open={treeVisible} title="节点筛选" onClose={() => setTreeVisible(false)}>
        {nodeTreeQuery.data?.nodeTree?.length ? (
          <>
            {selectedNodeIds.size > 0 && (
              <Button block fill="outline" style={{ marginBottom: 12 }} onClick={clearNodeSelection}>
                清除筛选 ({selectedNodeIds.size} 个节点)
              </Button>
            )}
            <TreeView
              tree={nodeTreeQuery.data.nodeTree}
              selectable
              selectedIds={selectedNodeIds}
              onCheck={toggleNodeSelection}
              selectedId={undefined}
              onSelect={() => {}}
            />
          </>
        ) : (
          <Empty description="暂无节点" />
        )}
      </FormDrawer>
    </div>
  );
}