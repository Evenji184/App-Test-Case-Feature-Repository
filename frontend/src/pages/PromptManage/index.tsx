import { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { Button, Dialog, List, Space, Tag, Toast } from 'antd-mobile';
import { DELETE_PROMPT_MUTATION } from '@/api/mutations/aiProvider';
import { PROMPT_LIST_QUERY } from '@/api/queries/aiProvider';
import { FormDrawer } from '@/components/FormDrawer';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/stores/auth';
import type { Prompt } from '@/types/models';
import type { PromptListQueryData, PromptListQueryVariables } from '@/types/graphql';

export function PromptManagePage() {
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState<Prompt | null>(null);
  const { isSuperAdmin } = useAuth();
  const hasPermission = useAuthStore((state) => state.hasPermission);

  const { data, refetch } = useQuery<PromptListQueryData, PromptListQueryVariables>(
    PROMPT_LIST_QUERY,
    { variables: { pagination: { page: 1, pageSize: 50 } } },
  );

  const [deletePromptMut] = useMutation(DELETE_PROMPT_MUTATION, {
    refetchQueries: [PROMPT_LIST_QUERY],
  });

  const prompts = data?.promptList.items ?? [];

  const handleDelete = async (prompt: Prompt) => {
    const confirmed = await Dialog.confirm({ content: '确定要删除该提示词记录吗？' });
    if (!confirmed) return;
    const { data: result } = await deletePromptMut({ variables: { promptId: prompt.id } });
    Toast.show({ content: result?.deletePrompt?.message ?? '删除成功' });
  };

  const handleView = (prompt: Prompt) => {
    setSelected(prompt);
    setDetailOpen(true);
  };

  return (
    <div className="card-section" style={{ display: 'grid', gap: 12 }}>
      <Space justify="between" block>
        <div>
          <h2 className="page-title">提示词管理</h2>
          <p className="page-subtitle">查看通过 AI 生成的测试要点提示词</p>
        </div>
      </Space>

      {prompts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
          暂无提示词记录
        </div>
      ) : (
        <List>
          {prompts.map((prompt) => (
            <List.Item
              key={prompt.id}
              description={`${prompt.createdByName ?? '未知'} · ${prompt.providerName} · ${prompt.model ?? ''}`}
              extra={
                <Space>
                  <Button size="mini" onClick={() => handleView(prompt)}>
                    查看
                  </Button>
                  {isSuperAdmin && (
                    <Button
                      size="mini"
                      color="danger"
                      onClick={(e) => { e.stopPropagation(); handleDelete(prompt); }}
                    >
                      删除
                    </Button>
                  )}
                </Space>
              }
              onClick={() => handleView(prompt)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Tag color="primary">提示词</Tag>
                <span style={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: 200,
                }}>
                  {prompt.content.slice(0, 60)}...
                </span>
              </div>
            </List.Item>
          ))}
        </List>
      )}

      <FormDrawer
        open={detailOpen}
        title="提示词详情"
        onClose={() => setDetailOpen(false)}
        submitText="关闭"
        onSubmit={() => setDetailOpen(false)}
      >
        {selected && (
          <div style={{ display: 'grid', gap: 12 }}>
            <div style={{ fontSize: 12, color: '#6b7280' }}>
              发起人：{selected.createdByName ?? '未知'} · 供应商：{selected.providerName} · 模型：{selected.model ?? '未知'}
            </div>
            <div style={{ fontSize: 12, color: '#6b7280' }}>
              创建时间：{selected.createdAt}
            </div>
            {selected.customInstruction && (
              <div>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>补充要求</div>
                <div style={{ background: '#f0f0f0', padding: 8, borderRadius: 8, fontSize: 13 }}>
                  {selected.customInstruction}
                </div>
              </div>
            )}
            <div>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>提示词内容</div>
              <div style={{
                background: '#f5f5f5',
                padding: 12,
                borderRadius: 8,
                whiteSpace: 'pre-wrap',
                fontSize: 13,
                maxHeight: 500,
                overflowY: 'auto',
              }}>
                {selected.content}
              </div>
            </div>
          </div>
        )}
      </FormDrawer>
    </div>
  );
}
