import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { Button, Form, Input, Selector, Space, TextArea, Toast } from 'antd-mobile';
import {
  CREATE_FEATURE_MUTATION,
  DELETE_FEATURE_MUTATION,
  HIDE_FEATURE_MUTATION,
  SHOW_FEATURE_MUTATION,
  UPDATE_FEATURE_MUTATION,
} from '@/api/mutations/feature';
import { CREATE_NODE_MUTATION, DELETE_NODE_MUTATION, UPDATE_NODE_MUTATION } from '@/api/mutations/node';
import { FEATURE_LIST_QUERY } from '@/api/queries/feature';
import { NODE_TREE_QUERY } from '@/api/queries/node';
import { BottomActions } from '@/components/BottomActions';
import { FeatureList } from '@/components/FeatureList';
import { FormDrawer } from '@/components/FormDrawer';
import { SearchBar } from '@/components/SearchBar';
import { TreeView } from '@/components/TreeView';
import { useAppStore } from '@/stores/app';
import type { FeatureItem, NodeItem } from '@/types/models';
import type { FeatureListQueryData, FeatureListQueryVariables, NodeTreeQueryData } from '@/types/graphql';

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
  const [featureForm] = Form.useForm();
  const [nodeForm] = Form.useForm();

  const nodeTreeQuery = useQuery<NodeTreeQueryData>(NODE_TREE_QUERY);
  const featureQuery = useQuery<FeatureListQueryData, FeatureListQueryVariables>(FEATURE_LIST_QUERY, {
    variables: { pagination: { page: 1, pageSize: 50 }, nodeId: selectedNodeId },
  });

  const [createFeature] = useMutation(CREATE_FEATURE_MUTATION, { refetchQueries: [FEATURE_LIST_QUERY, NODE_TREE_QUERY] });
  const [updateFeature] = useMutation(UPDATE_FEATURE_MUTATION, { refetchQueries: [FEATURE_LIST_QUERY] });
  const [deleteFeature] = useMutation(DELETE_FEATURE_MUTATION, { refetchQueries: [FEATURE_LIST_QUERY] });
  const [hideFeature] = useMutation(HIDE_FEATURE_MUTATION, { refetchQueries: [FEATURE_LIST_QUERY] });
  const [showFeature] = useMutation(SHOW_FEATURE_MUTATION, { refetchQueries: [FEATURE_LIST_QUERY] });
  const [createNode] = useMutation(CREATE_NODE_MUTATION, { refetchQueries: [NODE_TREE_QUERY] });
  const [updateNode] = useMutation(UPDATE_NODE_MUTATION, { refetchQueries: [NODE_TREE_QUERY] });
  const [deleteNode] = useMutation(DELETE_NODE_MUTATION, { refetchQueries: [NODE_TREE_QUERY, FEATURE_LIST_QUERY] });

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
        <Button
          block
          color="danger"
          disabled={!selectedNodeId}
          onClick={async () => {
            if (!selectedNodeId) return;
            const { data } = await deleteNode({ variables: { nodeId: selectedNodeId } });
            Toast.show({ content: data?.deleteNode.message ?? '节点已删除' });
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
          <Button color="primary" onClick={() => openFeatureDrawer()}>
            新建特征
          </Button>
        </Space>
        <SearchBar value={keyword} onChange={setKeyword} placeholder="筛选当前节点下特征" />
        <FeatureList
          items={features}
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
                  key: 'delete',
                  text: '删除',
                  danger: true,
                  onClick: async () => {
                    const { data } = await deleteFeature({ variables: { featureId: item.id } });
                    Toast.show({ content: data?.deleteFeature.message ?? '删除成功' });
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
    </div>
  );
}
