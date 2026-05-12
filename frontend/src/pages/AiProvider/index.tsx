import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { Button, Card, Dialog, Form, Input, Selector, Space, Switch, Tag, TextArea, Toast } from 'antd-mobile';
import {
  CREATE_AI_PROVIDER_MUTATION,
  DELETE_AI_PROVIDER_MUTATION,
  TEST_AI_CONNECTION_MUTATION,
  UPDATE_AI_PROVIDER_MUTATION,
} from '@/api/mutations/aiProvider';
import { AI_PROVIDER_LIST_QUERY } from '@/api/queries/aiProvider';
import { FormDrawer } from '@/components/FormDrawer';
import { useAuthStore } from '@/stores/auth';
import type { AiProvider } from '@/types/models';
import type { AiProviderListResult } from '@/types/models';

const formatOptions = [
  { label: 'OpenAI 兼容', value: 'openai_compatible' },
  { label: 'Anthropic', value: 'anthropic' },
];

const statusOptions = [
  { label: '活跃', value: 'active' },
  { label: '禁用', value: 'disabled' },
];

const requestUrlPlaceholder: Record<string, string> = {
  openai_compatible: '完整端点，如 https://api.openai.com/v1/chat/completions',
  anthropic: '基础地址，如 https://api.anthropic.com 或 https://api.deepseek.com/anthropic',
};

export function AiProviderPage() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<AiProvider | null>(null);
  const [form] = Form.useForm();
  const selectedFormat = Form.useWatch('providerFormat', form)?.[0] ?? 'openai_compatible';
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const canManage = hasPermission('ai:provider:manage');

  const providerQuery = useQuery<{ aiProviderList: AiProviderListResult }>(AI_PROVIDER_LIST_QUERY, {
    variables: { pagination: { page: 1, pageSize: 50 } },
  });

  const [createProvider] = useMutation(CREATE_AI_PROVIDER_MUTATION, { refetchQueries: [AI_PROVIDER_LIST_QUERY] });
  const [updateProvider] = useMutation(UPDATE_AI_PROVIDER_MUTATION, { refetchQueries: [AI_PROVIDER_LIST_QUERY] });
  const [deleteProvider] = useMutation(DELETE_AI_PROVIDER_MUTATION, { refetchQueries: [AI_PROVIDER_LIST_QUERY] });
  const [testConnection] = useMutation(TEST_AI_CONNECTION_MUTATION);

  const providers = providerQuery.data?.aiProviderList.items ?? [];

  const openDrawer = (provider?: AiProvider) => {
    setEditingProvider(provider ?? null);
    if (provider) {
      form.setFieldsValue({
        name: provider.name,
        websiteUrl: provider.websiteUrl ?? '',
        requestUrl: provider.requestUrl,
        modelName: provider.modelName,
        providerFormat: [provider.providerFormat],
        isDefault: provider.isDefault,
        status: [provider.status],
        remark: provider.remark ?? '',
        apiKey: '',
      });
    } else {
      form.resetFields();
      form.setFieldsValue({
        providerFormat: ['openai_compatible'],
        isDefault: false,
        status: ['active'],
      });
    }
    setDrawerOpen(true);
  };

  const handleDelete = async (provider: AiProvider) => {
    const confirmed = await Dialog.confirm({ content: `确定要删除供应商「${provider.name}」吗？` });
    if (!confirmed) return;
    const { data } = await deleteProvider({ variables: { providerId: provider.id } });
    Toast.show({ content: data?.deleteAiProvider?.message ?? '删除成功' });
  };

  const handleTestConnection = async (provider: AiProvider) => {
    Toast.show({ icon: 'loading', content: '正在测试连接...', duration: 0 });
    const { data } = await testConnection({ variables: { providerId: provider.id } });
    Toast.clear();
    if (data?.testAiConnection?.success) {
      Toast.show({ content: data.testAiConnection.message, icon: 'success' });
    } else {
      Toast.show({ content: data?.testAiConnection?.message ?? '连接测试失败', icon: 'fail' });
    }
  };

  return (
    <div className="card-section" style={{ display: 'grid', gap: 12 }}>
      <Space justify="between" block>
        <div>
          <h2 className="page-title">AI 供应商管理</h2>
          <p className="page-subtitle">管理 AI 供应商配置和 API 连接</p>
        </div>
        {canManage && (
          <Button color="primary" onClick={() => openDrawer()}>
            新建供应商
          </Button>
        )}
      </Space>

      {providers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
          暂无供应商配置，请点击"新建供应商"添加
        </div>
      ) : (
        providers.map((provider) => (
          <Card key={provider.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                  {provider.name}
                  {provider.isDefault && <Tag color="primary">默认</Tag>}
                  <Tag color={provider.status === 'active' ? 'success' : 'default'}>{provider.status === 'active' ? '活跃' : '禁用'}</Tag>
                </div>
                <div style={{ color: '#6b7280', fontSize: 12, marginTop: 4 }}>
                  模型: {provider.modelName} | 格式: {provider.providerFormat === 'anthropic' ? 'Anthropic' : 'OpenAI 兼容'}
                </div>
                <div style={{ color: '#6b7280', fontSize: 12, marginTop: 2 }}>
                  URL: {provider.requestUrl}
                </div>
                <div style={{ color: '#6b7280', fontSize: 12, marginTop: 2 }}>
                  API Key: {provider.apiKeyHint}
                </div>
              </div>
              {canManage ? (
                <Space>
                  <Button size="mini" onClick={() => handleTestConnection(provider)}>
                    测试连接
                  </Button>
                  <Button size="mini" onClick={() => openDrawer(provider)}>
                    编辑
                  </Button>
                  <Button size="mini" color="danger" onClick={() => handleDelete(provider)}>
                    删除
                  </Button>
                </Space>
              ) : null}
            </div>
          </Card>
        ))
      )}

      <FormDrawer
        open={drawerOpen}
        title={editingProvider ? '编辑供应商' : '新建供应商'}
        onClose={() => setDrawerOpen(false)}
        onSubmit={() => form.submit()}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={async (values) => {
            try {
              const payload = {
                name: values.name,
                websiteUrl: values.websiteUrl || undefined,
                requestUrl: values.requestUrl,
                modelName: values.modelName,
                providerFormat: values.providerFormat?.[0] ?? 'openai_compatible',
                isDefault: values.isDefault ?? false,
                status: values.status?.[0] ?? 'active',
                remark: values.remark || undefined,
              };

              if (editingProvider) {
                const updatePayload: Record<string, unknown> = { ...payload };
                if (values.apiKey) {
                  updatePayload.apiKey = values.apiKey;
                }
                const { data } = await updateProvider({
                  variables: { providerId: editingProvider.id, input: updatePayload },
                });
                Toast.show({ content: data?.updateAiProvider?.message ?? '供应商更新成功' });
              } else {
                if (!values.apiKey) {
                  Toast.show({ content: '请输入 API Key' });
                  return;
                }
                const { data } = await createProvider({
                  variables: { input: { ...payload, apiKey: values.apiKey } },
                });
                Toast.show({ content: data?.createAiProvider?.message ?? '供应商创建成功' });
              }
              setDrawerOpen(false);
            } catch {
              Toast.show({ content: '操作失败，请稍后重试' });
            }
          }}
          onFinishFailed={() => Toast.show({ content: '请检查表单填写是否完整' })}
        >
          <Form.Item name="name" label="供应商名称" rules={[{ required: true, message: '请输入供应商名称' }]}>
            <Input placeholder="如 DeepSeek、Qwen" />
          </Form.Item>
          <Form.Item name="websiteUrl" label="官网地址">
            <Input placeholder="https://..." />
          </Form.Item>
          <Form.Item name="apiKey" label="API Key" rules={editingProvider ? [] : [{ required: true, message: '请输入 API Key' }]}>
            <Input placeholder={editingProvider ? '留空则不修改' : '请输入 API Key'} type="password" />
          </Form.Item>
          <Form.Item name="requestUrl" label="请求地址" rules={[{ required: true, message: '请输入请求地址' }]}>
            <Input placeholder={requestUrlPlaceholder[selectedFormat] ?? requestUrlPlaceholder.openai_compatible} />
          </Form.Item>
          <Form.Item name="modelName" label="模型名称" rules={[{ required: true, message: '请输入模型名称' }]}>
            <Input placeholder="如 deepseek-chat" />
          </Form.Item>
          <Form.Item name="providerFormat" label="接口格式">
            <Selector options={formatOptions} />
          </Form.Item>
          <Form.Item name="isDefault" label="设为默认" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Selector options={statusOptions} />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <TextArea placeholder="请输入备注" rows={2} />
          </Form.Item>
        </Form>
      </FormDrawer>
    </div>
  );
}
