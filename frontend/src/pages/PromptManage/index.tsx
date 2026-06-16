import React, { useMemo, useRef, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { Button, Dialog, Form, Input, List, Selector, Tag, Toast } from 'antd-mobile';
import { DELETE_PROMPT_MUTATION, UPDATE_PROMPT_NAME_MUTATION } from '@/api/mutations/aiProvider';
import { PROMPT_LIST_QUERY } from '@/api/queries/aiProvider';
import { BottomActions } from '@/components/BottomActions';
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
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      refetch({ pagination: { page: 1, pageSize: 50 }, keyword: val || undefined, createdBy: filterCreatedBy[0] || undefined });
    }, 300);
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

  const fallbackCopy = (text: string) => {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    if (ok) {
      Toast.show({ content: '已复制到剪贴板', icon: 'success' });
    } else {
      Toast.show({ content: '复制失败，请手动选择文本', icon: 'fail' });
    }
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
    <div style={{ display: 'grid', gap: 12, overflowX: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 className="page-title">提示词管理</h2>
          <p className="page-subtitle">查看通过 AI 生成的测试要点提示词</p>
        </div>
      </div>

      <SearchBar value={keyword} onChange={handleSearch} placeholder="搜索名称或内容" />

      {initiatorOptions.length > 0 && (
        <div style={{ maxWidth: '100%', overflowX: 'hidden' }}>
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
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-text-muted)' }}>
          暂无提示词记录
        </div>
      ) : (
        <List style={{ '--extra-max-width': '60px' } as React.CSSProperties}>
          {prompts.map((prompt) => (
            <List.Item
              key={prompt.id}
              extra={
                <BottomActions
                  triggerText="操作"
                  actions={[
                    { key: 'view', text: '查看详情', onClick: () => handleView(prompt) },
                    { key: 'rename', text: '修改名称', onClick: () => openNameEditor(prompt) },
                    ...(canDeletePrompt ? [{ key: 'delete', text: '删除', danger: true, onClick: () => handleDelete(prompt) }] : []),
                  ]}
                />
              }
              onClick={() => handleView(prompt)}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {prompt.name ?? <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>未命名</span>}
                </div>
                <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {prompt.createdByName ?? '未知'} · {prompt.providerName} · {prompt.content.slice(0, 30)}
                </div>
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
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
              发起人：{selected.createdByName ?? '未知'} · 供应商：{selected.providerName} · 模型：{selected.model ?? '未知'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
              创建时间：{selected.createdAt}
            </div>
            {selected.customInstruction && (
              <div>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>补充要求</div>
                <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--color-border)', padding: 8, borderRadius: 8, fontSize: 13, color: 'var(--color-text)' }}>
                  {selected.customInstruction}
                </div>
              </div>
            )}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <div style={{ fontWeight: 600 }}>提示词内容</div>
                <Button
                  size="mini"
                  fill="outline"
                  onClick={() => {
                    try {
                      if (navigator.clipboard?.writeText) {
                        navigator.clipboard.writeText(selected.content)
                          .then(() => Toast.show({ content: '已复制到剪贴板', icon: 'success' }))
                          .catch(() => fallbackCopy(selected.content));
                      } else {
                        fallbackCopy(selected.content);
                      }
                    } catch {
                      fallbackCopy(selected.content);
                    }
                  }}
                >
                  复制
                </Button>
              </div>
              <div style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--color-border)',
                padding: 12,
                borderRadius: 8,
                whiteSpace: 'pre-wrap',
                fontSize: 13,
                color: 'var(--color-text)',
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
          <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
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