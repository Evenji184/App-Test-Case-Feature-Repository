import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { Button, Form, Input, Selector, Space, TextArea, Toast } from 'antd-mobile';
import {
  COPY_FEATURE_MUTATION,
  CREATE_FEATURE_MUTATION,
  DELETE_FEATURE_MUTATION,
  HIDE_FEATURE_MUTATION,
  MOVE_FEATURE_MUTATION,
  SHOW_FEATURE_MUTATION,
  UPDATE_FEATURE_MUTATION,
} from '@/api/mutations/feature';
import { COPY_NODE_MUTATION, CREATE_NODE_MUTATION, DELETE_NODE_MUTATION, MOVE_NODE_MUTATION, UPDATE_NODE_MUTATION } from '@/api/mutations/node';
import { GENERATE_TEST_CASES_MUTATION } from '@/api/mutations/aiProvider';
import { FEATURE_LIST_QUERY } from '@/api/queries/feature';
import { NODE_TREE_QUERY } from '@/api/queries/node';
import { AI_PROVIDER_LIST_QUERY } from '@/api/queries/aiProvider';
import { BottomActions } from '@/components/BottomActions';
import { FeatureList } from '@/components/FeatureList';
import { FormDrawer } from '@/components/FormDrawer';
import { FormModal } from '@/components/FormModal';
import { SearchBar } from '@/components/SearchBar';
import { TreeView } from '@/components/TreeView';
import { useAppStore } from '@/stores/app';
import { useAiProviderStore } from '@/stores/aiProvider';
import type { AiProvider, FeatureItem, NodeItem } from '@/types/models';
import type { AiProviderListResult, FeatureListQueryData, FeatureListQueryVariables, FeatureMutationData, NodeMutationData, NodeTreeQueryData } from '@/types/graphql';

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
  const { selectedNodeId, setSelectedNodeId } = useAppStore();
  const [keyword, setKeyword] = useState('');
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
  const [aiDrawerOpen, setAiDrawerOpen] = useState(false);
  const [aiProviderId, setAiProviderId] = useState('');
  const [aiCustomInstruction, setAiCustomInstruction] = useState('');
  const { isGenerating, setGeneratedContent, setIsGenerating, generatedContent } = useAiProviderStore();

  const nodeTreeQuery = useQuery<NodeTreeQueryData>(NODE_TREE_QUERY);
  const featureQuery = useQuery<FeatureListQueryData, FeatureListQueryVariables>(FEATURE_LIST_QUERY, {
    variables: { pagination: { page: 1, pageSize: 50 }, nodeId: selectedNodeId },
  });

  const [createFeature] = useMutation(CREATE_FEATURE_MUTATION, { refetchQueries: [FEATURE_LIST_QUERY, NODE_TREE_QUERY] });
  const [updateFeature] = useMutation(UPDATE_FEATURE_MUTATION, { refetchQueries: [FEATURE_LIST_QUERY] });
  const [deleteFeature] = useMutation(DELETE_FEATURE_MUTATION, { refetchQueries: [FEATURE_LIST_QUERY] });
  const [hideFeature] = useMutation(HIDE_FEATURE_MUTATION, { refetchQueries: [FEATURE_LIST_QUERY] });
  const [showFeature] = useMutation(SHOW_FEATURE_MUTATION, { refetchQueries: [FEATURE_LIST_QUERY] });
  const [copyFeature] = useMutation<FeatureMutationData>(COPY_FEATURE_MUTATION, { refetchQueries: [FEATURE_LIST_QUERY, NODE_TREE_QUERY] });
  const [moveFeature] = useMutation<FeatureMutationData>(MOVE_FEATURE_MUTATION, { refetchQueries: [FEATURE_LIST_QUERY, NODE_TREE_QUERY] });
  const [createNode] = useMutation(CREATE_NODE_MUTATION, { refetchQueries: [NODE_TREE_QUERY] });
  const [updateNode] = useMutation(UPDATE_NODE_MUTATION, { refetchQueries: [NODE_TREE_QUERY] });
  const [deleteNode] = useMutation(DELETE_NODE_MUTATION, { refetchQueries: [NODE_TREE_QUERY, FEATURE_LIST_QUERY] });
  const [copyNode] = useMutation<NodeMutationData>(COPY_NODE_MUTATION, { refetchQueries: [NODE_TREE_QUERY, FEATURE_LIST_QUERY] });
  const [moveNode] = useMutation<NodeMutationData>(MOVE_NODE_MUTATION, { refetchQueries: [NODE_TREE_QUERY, FEATURE_LIST_QUERY] });

  const providerQuery = useQuery<{ aiProviderList: AiProviderListResult }>(AI_PROVIDER_LIST_QUERY, {
    variables: { pagination: { page: 1, pageSize: 50 } },
  });
  const [generateTestCases] = useMutation(GENERATE_TEST_CASES_MUTATION);

  const aiProviders: AiProvider[] = providerQuery.data?.aiProviderList.items ?? [];
  const defaultProvider = aiProviders.find((p) => p.isDefault && p.status === 'active');

  const features = useMemo(() => {
    const items = featureQuery.data?.featureList.items ?? [];
    if (!keyword) {
      return items;
    }
    return items.filter((item) => item.title.includes(keyword) || item.code.includes(keyword));
  }, [featureQuery.data, keyword]);

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
        : { nodeId: selectedNodeId, status: ['draft'], priority: ['medium'] },
    );
    setFeatureDrawerOpen(true);
  };

  const openNodeDrawer = (node?: NodeItem) => {
    setEditingNode(node ?? null);
    nodeForm.setFieldsValue(node ? node : { parentId: selectedNodeId, nodeType: 'folder', sortOrder: 0 });
    setNodeDrawerOpen(true);
  };

  const flatNodes = useMemo(() => {
    const walk = (items: NodeItem[]): NodeItem[] =>
      items.flatMap((item) => [item, ...walk((item as NodeItem & { children?: NodeItem[] }).children ?? [])]);
    return walk((nodeTreeQuery.data?.nodeTree ?? []) as NodeItem[]);
  }, [nodeTreeQuery.data]);

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

  const currentNode = findNodeById(flatNodes, selectedNodeId);

  return (
    <div className="split-layout">
      <div className="card-section" style={{ display: 'grid', gap: 12 }}>
        <Space justify="between" block>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>节点管理</div>
            <div className="page-subtitle">维护特征树结构</div>
          </div>
          <Button size="small" color="primary" onClick={() => openNodeDrawer()}>
            新建节点
          </Button>
        </Space>
        <TreeView
          tree={nodeTreeQuery.data?.nodeTree ?? []}
          selectedId={selectedNodeId}
          onSelect={(node) => setSelectedNodeId(node.id)}
        />
        <Button
          block
          disabled={!selectedNodeId}
          onClick={() => {
            const current = findNodeById(flatNodes, selectedNodeId);
            if (current) {
              openNodeDrawer(current);
            }
          }}
        >
          编辑当前节点
        </Button>
        <BottomActions
          triggerText="节点更多操作"
          actions={[
            {
              key: 'copy-node',
              text: '复制当前节点',
              onClick: () => {
                if (!currentNode) return;
                setCopyingNode(currentNode);
                setCopyNodeName(`${currentNode.name}-副本`);
                setTargetNodeId(currentNode.parentId ?? undefined);
              },
            },
            {
              key: 'move-node',
              text: '移动当前节点',
              onClick: () => {
                if (!currentNode) return;
                setMovingNode(currentNode);
                setTargetNodeId(currentNode.parentId ?? undefined);
              },
            },
          ]}
        />
        <Button
          block
          color="danger"
          disabled={!selectedNodeId}
          onClick={async () => {
            if (!selectedNodeId) return;
            const { data } = await deleteNode({ variables: { nodeId: selectedNodeId } });
            Toast.show({ content: data?.deleteNode?.message ?? '节点已删除' });
            setSelectedNodeId(undefined);
          }}
        >
          删除当前节点
        </Button>
      </div>

      <div className="card-section" style={{ display: 'grid', gap: 12 }}>
        <Space justify="between" block>
          <div>
            <h2 className="page-title">特征库管理</h2>
            <p className="page-subtitle">支持新增、编辑、隐藏与删除特征</p>
          </div>
          <Space>
            {selectedFeatureIds.size > 0 && (
              <Button
                color="primary"
                fill="outline"
                onClick={() => {
                  setAiProviderId(defaultProvider?.id ?? aiProviders[0]?.id ?? '');
                  setAiCustomInstruction('');
                  setGeneratedContent('');
                  setAiDrawerOpen(true);
                }}
              >
                AI 生成 ({selectedFeatureIds.size})
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
              {selectedFeatureIds.size > 0 ? '取消选择' : '全选'}
            </Button>
            <Button color="primary" onClick={() => openFeatureDrawer()}>
              新建特征
            </Button>
          </Space>
        </Space>
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
          onClick={(item) => openFeatureDrawer(item)}
          extra={(item) => (
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
                  },
                },
              ]}
            />
          )}
        />
      </div>

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
            const { data } = editingFeature
              ? await updateFeature({ variables: { featureId: editingFeature.id, input: payload } })
              : await createFeature({ variables: { input: payload } });
            Toast.show({ content: data?.updateFeature?.message ?? data?.createFeature?.message ?? '保存成功' });
            setFeatureDrawerOpen(false);
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
        }}
        content={
          <div style={{ display: 'grid', gap: 12 }}>
            <div>选择目标节点</div>
            <TreeView tree={nodeTreeQuery.data?.nodeTree ?? []} selectedId={targetNodeId} onSelect={(node) => setTargetNodeId(node.id)} />
          </div>
        }
      />

      <FormDrawer
        open={aiDrawerOpen}
        title="AI 生成测试用例"
        onClose={() => setAiDrawerOpen(false)}
        onSubmit={async () => {
          if (!aiProviderId) {
            Toast.show({ content: '请选择 AI 供应商' });
            return;
          }
          setIsGenerating(true);
          setGeneratedContent('');
          try {
            const { data } = await generateTestCases({
              variables: {
                input: {
                  providerId: aiProviderId,
                  featureIds: Array.from(selectedFeatureIds),
                  nodeIds: selectedNodeId ? [selectedNodeId] : [],
                  customInstruction: aiCustomInstruction || undefined,
                },
              },
            });
            if (data?.generateTestCases?.success) {
              setGeneratedContent(data.generateTestCases.content ?? '');
              Toast.show({ content: '测试用例生成成功', icon: 'success' });
            } else {
              Toast.show({ content: data?.generateTestCases?.message ?? '生成失败', icon: 'fail' });
            }
          } catch {
            Toast.show({ content: '生成失败，请稍后重试', icon: 'fail' });
          } finally {
            setIsGenerating(false);
          }
        }}
        submitText={isGenerating ? '生成中...' : '生成'}
      >
        <div style={{ display: 'grid', gap: 12 }}>
          <div style={{ color: '#6b7280', fontSize: 13 }}>
            已选 {selectedFeatureIds.size} 个特征
          </div>
          <div style={{ fontWeight: 600 }}>选择 AI 供应商</div>
          {aiProviders.length === 0 ? (
            <div style={{ color: '#999' }}>暂无可用供应商，请先在 AI 管理页配置</div>
          ) : (
            <Selector
              options={aiProviders.map((p) => ({ label: `${p.name} (${p.modelName})`, value: p.id }))}
              value={[aiProviderId]}
              onChange={(v) => setAiProviderId(v[0])}
            />
          )}
          <div style={{ fontWeight: 600 }}>补充要求（可选）</div>
          <TextArea
            value={aiCustomInstruction}
            onChange={setAiCustomInstruction}
            placeholder="如：重点覆盖边界值和异常场景"
            rows={3}
          />
          {generatedContent && (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>生成结果</div>
              <div style={{
                background: '#f5f5f5',
                padding: 12,
                borderRadius: 8,
                whiteSpace: 'pre-wrap',
                fontSize: 13,
                maxHeight: 400,
                overflowY: 'auto',
              }}>
                {generatedContent}
              </div>
            </div>
          )}
        </div>
      </FormDrawer>
    </div>
  );
}
