import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { Button, Dialog, Form, Input, Selector, Space, Tabs, TextArea, Toast } from 'antd-mobile';
import {
  COPY_FEATURE_MUTATION,
  CREATE_FEATURE_MUTATION,
  DELETE_FEATURE_MUTATION,
  HIDE_FEATURE_MUTATION,
  MOVE_FEATURE_MUTATION,
  SHOW_FEATURE_MUTATION,
  UPDATE_FEATURE_MUTATION,
} from '@/api/mutations/feature';
import { GENERATE_TEST_CASES_MUTATION } from '@/api/mutations/aiProvider';
import { COPY_NODE_MUTATION, CREATE_NODE_MUTATION, DELETE_NODE_MUTATION, MOVE_NODE_MUTATION, UPDATE_NODE_MUTATION } from '@/api/mutations/node';
import { FEATURE_LIST_QUERY } from '@/api/queries/feature';
import { NODE_TREE_QUERY } from '@/api/queries/node';
import { BottomActions } from '@/components/BottomActions';
import { FeatureList } from '@/components/FeatureList';
import { FormDrawer } from '@/components/FormDrawer';
import { FormModal } from '@/components/FormModal';
import { SearchBar } from '@/components/SearchBar';
import { TreeView } from '@/components/TreeView';
import { useAppStore } from '@/stores/app';
import { useAuthStore } from '@/stores/auth';
import type { FeatureItem, NodeItem, NodeTreeItem } from '@/types/models';
import type { FeatureListQueryData, FeatureListQueryVariables, FeatureMutationData, NodeMutationData, NodeTreeQueryData } from '@/types/graphql';

function findNodeById(nodes: NodeItem[], nodeId?: string): NodeItem | undefined {
  return nodes.find((item) => item.id === nodeId);
}

const featureStatusOptions = [
  { label: '草稿', value: 'draft' },
  { label: '启用', value: 'active' },
  { label: '归档', value: 'archived' },
];

const priorityOptions = [
  { label: '低', value: 'low' },
  { label: '中', value: 'medium' },
  { label: '高', value: 'high' },
];

export function FeatureManagePage() {
  const { selectedNodeIds, toggleNodeSelection, clearNodeSelection, keyword, setKeyword } = useAppStore();
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const canManageNode = hasPermission('feature:node:manage');
  const canManageFeature = hasPermission('feature:item:manage');
  const canAiGenerate = hasPermission('ai:generate');
  const [activeTab, setActiveTab] = useState<'nodes' | 'features'>('nodes');
  const [featureDrawerOpen, setFeatureDrawerOpen] = useState(false);
  const [nodeDrawerOpen, setNodeDrawerOpen] = useState(false);
  const [editingFeature, setEditingFeature] = useState<FeatureItem | null>(null);
  const [editingNode, setEditingNode] = useState<NodeItem | null>(null);
  const [copyingNode, setCopyingNode] = useState<NodeItem | null>(null);
  const [movingNode, setMovingNode] = useState<NodeItem | null>(null);
  const [copyingFeature, setCopyingFeature] = useState<FeatureItem | null>(null);
  const [movingFeature, setMovingFeature] = useState<FeatureItem | null>(null);
  const [targetNodeId, setTargetNodeId] = useState<string>();
  const [copyNodeName, setCopyNodeName] = useState('');
  const [featureForm] = Form.useForm();
  const [nodeForm] = Form.useForm();
  const [selectedFeatureIds, setSelectedFeatureIds] = useState<Set<string>>(new Set());
  const [generatePrompt, { loading: isGenerating }] = useMutation(GENERATE_TEST_CASES_MUTATION);

  const nodeTreeQuery = useQuery<NodeTreeQueryData>(NODE_TREE_QUERY);

  const nodeIdsForQuery = selectedNodeIds.size > 0 ? Array.from(selectedNodeIds) : undefined;

  const featureQuery = useQuery<FeatureListQueryData, FeatureListQueryVariables>(FEATURE_LIST_QUERY, {
    variables: { pagination: { page: 1, pageSize: 50 }, nodeIds: nodeIdsForQuery, includeHidden: true },
    fetchPolicy: 'cache-and-network',
  });

  const [createFeature] = useMutation(CREATE_FEATURE_MUTATION);
  const [updateFeature] = useMutation(UPDATE_FEATURE_MUTATION);
  const [deleteFeature] = useMutation(DELETE_FEATURE_MUTATION);
  const [hideFeature] = useMutation(HIDE_FEATURE_MUTATION);
  const [showFeature] = useMutation(SHOW_FEATURE_MUTATION);
  const [copyFeature] = useMutation<FeatureMutationData>(COPY_FEATURE_MUTATION);
  const [moveFeature] = useMutation<FeatureMutationData>(MOVE_FEATURE_MUTATION);
  const [createNode] = useMutation(CREATE_NODE_MUTATION);
  const [updateNode] = useMutation(UPDATE_NODE_MUTATION);
  const [deleteNode] = useMutation(DELETE_NODE_MUTATION);
  const [copyNode] = useMutation<NodeMutationData>(COPY_NODE_MUTATION);
  const [moveNode] = useMutation<NodeMutationData>(MOVE_NODE_MUTATION);

  const features = useMemo(() => {
    const items = featureQuery.data?.featureList.items ?? [];
    if (!keyword) {
      return items;
    }
    return items.filter((item) => item.title.includes(keyword) || item.code.includes(keyword));
  }, [featureQuery.data, keyword]);

  const flatNodes = useMemo(() => {
    const walk = (items: NodeItem[]): NodeItem[] =>
      items.flatMap((item) => [item, ...walk((item as NodeItem & { children?: NodeItem[] }).children ?? [])]);
    return walk((nodeTreeQuery.data?.nodeTree ?? []) as NodeItem[]);
  }, [nodeTreeQuery.data]);

  const singleSelectedNodeId = selectedNodeIds.size === 1 ? Array.from(selectedNodeIds)[0] : undefined;
  const currentNode = findNodeById(flatNodes, singleSelectedNodeId);

  const handleNodeSelect = (_node: NodeTreeItem) => {
    setActiveTab('features');
  };

  const openFeatureDrawer = (feature?: FeatureItem) => {
    setEditingFeature(feature ?? null);
    featureForm.setFieldsValue(
      feature
        ? {
            ...feature,
            tags: feature.tags ?? '',
            status: [feature.status],
            priority: [feature.priority],
          }
        : { nodeId: singleSelectedNodeId ?? '', status: ['draft'], priority: ['medium'] },
    );
    setFeatureDrawerOpen(true);
  };

  const openNodeDrawer = (node?: NodeItem) => {
    setEditingNode(node ?? null);
    nodeForm.setFieldsValue(node ? node : { parentId: singleSelectedNodeId, nodeType: 'folder', sortOrder: 0 });
    setNodeDrawerOpen(true);
  };

  const resetNodeActionState = () => {
    setCopyingNode(null);
    setMovingNode(null);
    setTargetNodeId(undefined);
    setCopyNodeName('');
  };

  const resetFeatureActionState = () => {
    setCopyingFeature(null);
    setMovingFeature(null);
    setTargetNodeId(undefined);
  };

  const nodeTabTitle = `节点${selectedNodeIds.size > 0 ? ` (${selectedNodeIds.size})` : ''}`;

  return (
    <div>
      <Tabs
        activeKey={activeTab}
        onChange={(k) => setActiveTab(k as 'nodes' | 'features')}
        className="feature-manage-tabs"
      >
        {/* 节点 Tab */}
        <Tabs.Tab title={nodeTabTitle} key="nodes">
          <div style={{ padding: '12px 14px', display: 'grid', gap: 10 }}>
            <Space justify="between" block>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>节点管理</div>
                <div className="page-subtitle">点击节点查看特征，单选可编辑</div>
              </div>
              {canManageNode && (
                <Button size="small" color="primary" onClick={() => openNodeDrawer()}>
                  新建节点
                </Button>
              )}
            </Space>

            {selectedNodeIds.size > 0 && (
              <Button block fill="outline" size="small" onClick={clearNodeSelection}>
                清除筛选 ({selectedNodeIds.size} 个节点)
              </Button>
            )}

            <TreeView
              tree={nodeTreeQuery.data?.nodeTree ?? []}
              selectable
              selectedIds={selectedNodeIds}
              onCheck={toggleNodeSelection}
              selectedId={singleSelectedNodeId}
              onSelect={handleNodeSelect}
            />

            {canManageNode && (
              <BottomActions
                triggerText="节点操作"
                actions={[
                  {
                    key: 'edit',
                    text: '编辑节点',
                    onClick: () => {
                      if (currentNode) openNodeDrawer(currentNode);
                    },
                  },
                  {
                    key: 'copy-node',
                    text: '复制节点',
                    onClick: () => {
                      if (!currentNode) return;
                      setCopyingNode(currentNode);
                      setCopyNodeName(`${currentNode.name}-副本`);
                      setTargetNodeId(currentNode.parentId ?? undefined);
                    },
                  },
                  {
                    key: 'move-node',
                    text: '移动节点',
                    onClick: () => {
                      if (!currentNode) return;
                      setMovingNode(currentNode);
                      setTargetNodeId(currentNode.parentId ?? undefined);
                    },
                  },
                  {
                    key: 'delete',
                    text: '删除节点',
                    danger: true,
                    onClick: async () => {
                      if (!singleSelectedNodeId) return;
                      const confirmed = await Dialog.confirm({ content: `确定要删除节点「${currentNode?.name ?? ''}」吗？` });
                      if (!confirmed) return;
                      const { data } = await deleteNode({ variables: { nodeId: singleSelectedNodeId } });
                      Toast.show({ content: data?.deleteNode?.message ?? '节点已删除' });
                      toggleNodeSelection(singleSelectedNodeId);
                      await nodeTreeQuery.refetch();
                      await featureQuery.refetch();
                    },
                  },
                ]}
              />
            )}
          </div>
        </Tabs.Tab>

        {/* 特征 Tab */}
        <Tabs.Tab title="特征库" key="features">
          <div style={{ padding: '12px 14px', display: 'grid', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <div>
                <h2 className="page-title" style={{ fontSize: 16, margin: 0 }}>特征库</h2>
                <p className="page-subtitle" style={{ margin: 0 }}>管理操作按权限展示</p>
              </div>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                {canAiGenerate && selectedFeatureIds.size > 0 && (
                  <Button
                    color="primary"
                    fill="outline"
                    size="small"
                    loading={isGenerating}
                    onClick={async () => {
                      const selectedFeatures = features.filter((f) => selectedFeatureIds.has(f.id));
                      const nodeIds = [...new Set(selectedFeatures.map((f) => f.nodeId))];
                      const { data } = await generatePrompt({
                        variables: {
                          input: {
                            nodeIds,
                            featureIds: Array.from(selectedFeatureIds),
                          },
                        },
                      });
                      const result = data?.generatePrompt;
                      if (result?.success) {
                        Toast.show({ content: '提示词已生成并保存', icon: 'success' });
                        setSelectedFeatureIds(new Set());
                      } else {
                        Toast.show({ content: result?.error?.message ?? result?.message ?? '生成失败', icon: 'fail' });
                      }
                    }}
                  >
                    AI ({selectedFeatureIds.size})
                  </Button>
                )}
                <Button
                  size="small"
                  onClick={() => {
                    if (selectedFeatureIds.size > 0) {
                      setSelectedFeatureIds(new Set());
                    } else {
                      setSelectedFeatureIds(new Set(features.map((f) => f.id)));
                    }
                  }}
                >
                  {selectedFeatureIds.size > 0 ? '取消' : '全选'}
                </Button>
                {canManageFeature && (
                  <Button size="small" color="primary" disabled={!singleSelectedNodeId} onClick={() => openFeatureDrawer()}>
                    新建
                  </Button>
                )}
              </div>
            </div>
            <SearchBar value={keyword} onChange={setKeyword} placeholder="筛选当前节点下特征" />
            <FeatureList
              items={features}
              selectable
              selectedIds={selectedFeatureIds}
              onSelect={(id) => {
                setSelectedFeatureIds((prev) => {
                  const next = new Set(prev);
                  if (next.has(id)) {
                    next.delete(id);
                  } else {
                    next.add(id);
                  }
                  return next;
                });
              }}
              onClick={(item) => canManageFeature ? openFeatureDrawer(item) : undefined}
              extra={(item) => {
                if (!canManageFeature) return null;
                return (
                  <BottomActions
                    actions={[
                      { key: 'edit', text: '编辑', onClick: () => openFeatureDrawer(item) },
                      {
                        key: 'toggle',
                        text: item.isVisible ? '隐藏' : '显示',
                        onClick: async () => {
                          const { data } = item.isVisible
                            ? await hideFeature({ variables: { featureId: item.id } })
                            : await showFeature({ variables: { featureId: item.id } });
                          Toast.show({ content: data?.hideFeature?.message ?? data?.showFeature?.message ?? '操作成功' });
                          await featureQuery.refetch();
                        },
                      },
                      {
                        key: 'copy',
                        text: '复制',
                        onClick: () => {
                          setCopyingFeature(item);
                          setTargetNodeId(item.nodeId);
                        },
                      },
                      {
                        key: 'move',
                        text: '移动',
                        onClick: () => {
                          setMovingFeature(item);
                          setTargetNodeId(item.nodeId);
                        },
                      },
                      {
                        key: 'delete',
                        text: '删除',
                        danger: true,
                        onClick: async () => {
                          const { data } = await deleteFeature({ variables: { featureId: item.id } });
                          Toast.show({ content: data?.deleteFeature?.message ?? '删除成功' });
                          await featureQuery.refetch();
                        },
                      },
                    ]}
                  />
                );
              }}
            />
          </div>
        </Tabs.Tab>
      </Tabs>

      <FormDrawer
        open={featureDrawerOpen}
        title={editingFeature ? '编辑特征' : '新建特征'}
        onClose={() => setFeatureDrawerOpen(false)}
        onSubmit={() => featureForm.submit()}
      >
        <Form
          form={featureForm}
          layout="vertical"
          onFinish={async (values) => {
            const payload = {
              ...values,
              status: values.status?.[0] ?? 'draft',
              priority: values.priority?.[0] ?? 'medium',
              tags: typeof values.tags === 'string' ? values.tags : '',
            };
            if (!editingFeature) {
              const { data } = await createFeature({ variables: { input: payload } });
              Toast.show({ content: data?.createFeature?.message ?? '保存成功' });
              setFeatureDrawerOpen(false);
              await featureQuery.refetch();
              return;
            }
            const { data } = await updateFeature({
              variables: { featureId: editingFeature.id, input: payload, expectedUpdatedAt: editingFeature.updatedAt },
            });
            if (data?.updateFeature?.error?.code === 'CONFLICT') {
              const result = await Dialog.confirm({
                content: '该特征在您编辑期间已被其他用户修改，您的保存可能覆盖他人更改。',
                confirmText: '强制保存',
                cancelText: '刷新重编',
              });
              if (result) {
                const { data: forceData } = await updateFeature({
                  variables: { featureId: editingFeature.id, input: payload },
                });
                Toast.show({ content: forceData?.updateFeature?.message ?? '强制保存成功' });
                setFeatureDrawerOpen(false);
                await featureQuery.refetch();
              } else {
                await featureQuery.refetch();
                Toast.show({ content: '已刷新数据，请重新编辑', icon: 'fail' });
              }
              return;
            }
            Toast.show({ content: data?.updateFeature?.message ?? '保存成功' });
            setFeatureDrawerOpen(false);
            await featureQuery.refetch();
          }}
        >
          <Form.Item name="nodeId" label="所属节点" rules={[{ required: true, message: '请选择节点' }]}>
            <Input placeholder="请输入节点 ID" />
          </Form.Item>
          <Form.Item name="title" label="特征标题" rules={[{ required: true, message: '请输入标题' }]}>
            <Input placeholder="请输入特征标题" />
          </Form.Item>
          <Form.Item name="code" label="特征编码" rules={[{ required: true, message: '请输入编码' }]}>
            <Input placeholder="请输入特征编码" />
          </Form.Item>
          <Form.Item name="summary" label="摘要">
            <TextArea placeholder="请输入摘要" rows={2} />
          </Form.Item>
          <Form.Item name="description" label="详细描述">
            <TextArea placeholder="请输入详细描述" rows={4} />
          </Form.Item>
          <Form.Item name="platform" label="平台">
            <Input placeholder="如 iOS / Android / H5" />
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Selector options={featureStatusOptions} />
          </Form.Item>
          <Form.Item name="priority" label="优先级">
            <Selector options={priorityOptions} />
          </Form.Item>
          <Form.Item name="version" label="版本">
            <Input placeholder="请输入版本号" />
          </Form.Item>
          <Form.Item name="tags" label="标签">
            <Input placeholder="多个标签用逗号分隔" />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <TextArea placeholder="请输入备注" rows={2} />
          </Form.Item>
        </Form>
      </FormDrawer>

      <FormDrawer
        open={nodeDrawerOpen}
        title={editingNode ? '编辑节点' : '新建节点'}
        onClose={() => setNodeDrawerOpen(false)}
        onSubmit={() => nodeForm.submit()}
      >
        <Form
          form={nodeForm}
          layout="vertical"
          onFinish={async (values) => {
            const { data } = editingNode
              ? await updateNode({ variables: { nodeId: editingNode.id, input: values } })
              : await createNode({ variables: { input: values } });
            Toast.show({ content: data?.updateNode?.message ?? data?.createNode?.message ?? '保存成功' });
            setNodeDrawerOpen(false);
            await nodeTreeQuery.refetch();
          }}
        >
          <Form.Item name="parentId" label="父节点 ID">
            <Input placeholder="根节点可留空" />
          </Form.Item>
          <Form.Item name="name" label="节点名称" rules={[{ required: true, message: '请输入节点名称' }]}>
            <Input placeholder="请输入节点名称" />
          </Form.Item>
          <Form.Item name="code" label="节点编码" rules={[{ required: true, message: '请输入节点编码' }]}>
            <Input placeholder="请输入节点编码" />
          </Form.Item>
          <Form.Item name="nodeType" label="节点类型">
            <Input placeholder="folder / category / app" />
          </Form.Item>
          <Form.Item name="sortOrder" label="排序值">
            <Input placeholder="请输入排序值" />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <TextArea placeholder="请输入备注" rows={2} />
          </Form.Item>
        </Form>
      </FormDrawer>

      <FormModal
        open={Boolean(copyingNode)}
        title="复制节点"
        onClose={resetNodeActionState}
        onConfirm={async () => {
          if (!copyingNode) return;
          const { data } = await copyNode({ variables: { nodeId: copyingNode.id, targetParentId: targetNodeId, newName: copyNodeName || undefined } });
          Toast.show({ content: data?.copyNode?.message ?? '节点复制成功' });
          resetNodeActionState();
          await nodeTreeQuery.refetch();
          await featureQuery.refetch();
        }}
        content={
          <div style={{ display: 'grid', gap: 12 }}>
            <Input value={copyNodeName} onChange={setCopyNodeName} placeholder="请输入复制后的节点名称" />
            <div style={{ fontSize: 14, fontWeight: 600 }}>选择目标父节点</div>
            <TreeView tree={nodeTreeQuery.data?.nodeTree ?? []} selectedId={targetNodeId} onSelect={(node) => setTargetNodeId(node.id)} />
          </div>
        }
      />

      <FormModal
        open={Boolean(movingNode)}
        title="移动节点"
        onClose={resetNodeActionState}
        onConfirm={async () => {
          if (!movingNode) return;
          const { data } = await moveNode({ variables: { nodeId: movingNode.id, targetParentId: targetNodeId } });
          Toast.show({ content: data?.moveNode?.message ?? '节点移动成功' });
          resetNodeActionState();
          await nodeTreeQuery.refetch();
          await featureQuery.refetch();
        }}
        content={
          <div style={{ display: 'grid', gap: 12 }}>
            <div>选择目标父节点</div>
            <TreeView tree={nodeTreeQuery.data?.nodeTree ?? []} selectedId={targetNodeId} onSelect={(node) => setTargetNodeId(node.id)} />
          </div>
        }
      />

      <FormModal
        open={Boolean(copyingFeature)}
        title="复制特征"
        onClose={resetFeatureActionState}
        onConfirm={async () => {
          if (!copyingFeature || !targetNodeId) return;
          const { data } = await copyFeature({ variables: { featureId: copyingFeature.id, targetNodeId } });
          Toast.show({ content: data?.copyFeature?.message ?? '特征复制成功' });
          resetFeatureActionState();
          await featureQuery.refetch();
        }}
        content={
          <div style={{ display: 'grid', gap: 12 }}>
            <div>选择目标节点</div>
            <TreeView tree={nodeTreeQuery.data?.nodeTree ?? []} selectedId={targetNodeId} onSelect={(node) => setTargetNodeId(node.id)} />
          </div>
        }
      />

      <FormModal
        open={Boolean(movingFeature)}
        title="移动特征"
        onClose={resetFeatureActionState}
        onConfirm={async () => {
          if (!movingFeature || !targetNodeId) return;
          const { data } = await moveFeature({ variables: { featureId: movingFeature.id, targetNodeId } });
          Toast.show({ content: data?.moveFeature?.message ?? '特征移动成功' });
          resetFeatureActionState();
          await featureQuery.refetch();
        }}
        content={
          <div style={{ display: 'grid', gap: 12 }}>
            <div>选择目标节点</div>
            <TreeView tree={nodeTreeQuery.data?.nodeTree ?? []} selectedId={targetNodeId} onSelect={(node) => setTargetNodeId(node.id)} />
          </div>
        }
      />
    </div>
  );
}
