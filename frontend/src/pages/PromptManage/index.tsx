import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { Button, Dialog, Form, Input, List, Selector, Space, Tag, Toast } from 'antd-mobile';
import { DELETE_PROMPT_MUTATION, UPDATE_PROMPT_NAME_MUTATION } from '@/api/mutations/aiProvider';
import { PROMPT_LIST_QUERY } from '@/api/queries/aiProvider';
import { FormDrawer } from '@/components/FormDrawer';
import { SearchBar } from '@/components/SearchBar';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/stores/auth';
import type { Prompt } from '@/types/models';
import type { PromptListQueryData, PromptListQueryVariables } from '@/types/graphql';

export function PromptManagePage() {
  const [detailOpen, setDetailOpen] = useState(false);
  const [nameDrawerOpen, setNameDrawerOpen] = useState(false);
  const [selected, setSelected] = useState<Prompt | null>(null);
  const [editNameTarget, setEditNameTarget] = useState<Prompt | null>(null);
  const [editNameValue, setEditNameValue] = useState('');
  const [keyword, setKeyword] = useState('');
  const [filterCreatedBy, setFilterCreatedBy] = useState<string[]>([]);
  const { isSuperAdmin } = useAuth();
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const canDeletePrompt = isSuperAdmin || hasPermission('ai:provider:manage');

  const { data, refetch } = useQuery<PromptListQueryData, PromptListQueryVariables>(
    PROMPT_LIST_QUERY,
    {
      variables: {
        pagination: { page: 1, pageSize: 50 },
        keyword: keyword || undefined,
        createdBy: filterCreatedBy[0] || undefined,
      },
    },
  );

  const [deletePromptMut] = useMutation(DELETE_PROMPT_MUTATION);
  const [updateNameMut] = useMutation(UPDATE_PROMPT_NAME_MUTATION);

  const prompts = data?.promptList.items ?? [];

  const initiatorOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const p of prompts) {
      if (p.createdById && p.createdByName && !seen.has(p.createdById)) {
        seen.set(p.createdById, p.createdByName);
      }
    }
    return Array.from(seen.entries()).map(([id, name]) => ({ label: name, value: id }));
  }, [prompts]);

  const handleSearch = (val: string) => {
    setKeyword(val);
    refetch({ pagination: { page: 1, pageSize: 50 }, keyword: val || undefined, createdBy: filterCreatedBy[0] || undefined });
  };

  const handleFilterCreatedBy = (val: string[]) => {
    setFilterCreatedBy(val);
    refetch({ pagination: { page: 1, pageSize: 50 }, keyword: keyword || undefined, createdBy: val[0] || undefined });
  };

  const handleClearFilter = () => {
    setKeyword('');
    setFilterCreatedBy([]);
    refetch({ pagination: { page: 1, pageSize: 50 } });
  };

  const handleDelete = async (prompt: Prompt) => {
    const confirmed = await Dialog.confirm({ content: '确定要删除该提示词记录吗？' });
    if (!confirmed) return;
    const { data: result } = await deletePromptMut({ variables: { promptId: prompt.id } });
    Toast.show({ content: result?.deletePrompt?.message ?? '删除成功' });
    await refetch();
  };

  const handleView = (prompt: Prompt) => {
    setSelected(prompt);
    setDetailOpen(true);
  };

  const openNameEditor = (prompt: Prompt) => {
    setEditNameTarget(prompt);
    setEditNameValue(prompt.name ?? '');
    setNameDrawerOpen(true);
  };

  const handleSaveName = async () => {
    if (!editNameTarget) return;
    const { data: result } = await updateNameMut({
      variables: { promptId: editNameTarget.id, name: editNameValue || null },
    });
    if (result?.updatePromptName?.success) {
      Toast.show({ content: result.updatePromptName.message ?? '名称修改成功' });
      setNameDrawerOpen(false);
      await refetch();
    } else {
      Toast.show({ content: result?.updatePromptName?.message ?? '修改失败', icon: 'fail' });
    }
  };

  return (
    <div className="card-section" style={{ display: 'grid', gap: 12 }}>
      <Space justify="between" block>
        <div>
          <h2 className="page-title">提示词管理</h2>
          <p className="page-subtitle">查看通过 AI 生成的测试要点提示词</p>
        </div>
      </Space>

      <SearchBar value={keyword} onChange={handleSearch} placeholder="搜索提示词名称或内容" />

      {initiatorOptions.length > 0 && (
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>按发起人筛选</div>
          <Selector
            options={initiatorOptions}
            value={filterCreatedBy}
            onChange={handleFilterCreatedBy}
          />
        </div>
      )}

      {(keyword || filterCreatedBy.length > 0) && (
        <Button size="small" fill="outline" onClick={handleClearFilter}>
          清除筛选
        </Button>
      )}

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
                  <Button size="mini" onClick={(e) => { e.stopPropagation(); openNameEditor(prompt); }}>
                    改名
                  </Button>
                  <Button size="mini" onClick={() => handleView(prompt)}>
                    查看
                  </Button>
                  {canDeletePrompt && (
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
                <Tag color={prompt.name ? 'primary' : 'default'}>
                  {prompt.name ?? '未命名'}
                </Tag>
                {prompt.name && (
                  <span style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: 200,
                  }}>
                    {prompt.name}
                  </span>
                )}
                {!prompt.name && (
                  <span style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: 200,
                    color: '#999',
                  }}>
                    {prompt.content.slice(0, 40)}...
                  </span>
                )}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Tag color={selected.name ? 'primary' : 'default'}>
                {selected.name ?? '未命名'}
              </Tag>
              <Button size="mini" fill="outline" onClick={() => { setDetailOpen(false); openNameEditor(selected); }}>
                修改名称
              </Button>
            </div>
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

      <FormDrawer
        open={nameDrawerOpen}
        title="修改提示词名称"
        onClose={() => setNameDrawerOpen(false)}
        onSubmit={handleSaveName}
      >
        <div style={{ display: 'grid', gap: 12 }}>
          <div style={{ fontSize: 13, color: '#6b7280' }}>
            当前名称：{editNameTarget?.name ?? '未命名'}
          </div>
          <Input
            value={editNameValue}
            onChange={setEditNameValue}
            placeholder="输入新的提示词名称，留空则清除名称"
            clearable
          />
        </div>
      </FormDrawer>
    </div>
  );
}