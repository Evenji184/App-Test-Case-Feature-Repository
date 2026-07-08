import { useMemo, useState } from 'react';
import { useLazyQuery, useMutation, useQuery } from '@apollo/client';
import { Badge, Button, Checkbox, Input, NavBar, SearchBar, Space, SpinLoading, Tabs, TextArea, Toast } from 'antd-mobile';
import { GET_PROMPT_QUERY } from '@/api/queries/aiProvider';
import { FEATURE_LIST_QUERY } from '@/api/queries/feature';
import { NODE_TREE_QUERY } from '@/api/queries/node';
import { GENERATE_TEST_CASES_MUTATION } from '@/api/mutations/aiProvider';
import { FeatureList } from '@/components/FeatureList';
import { TreeView } from '@/components/TreeView';
import type { NodeTreeItem, Prompt } from '@/types/models';
import type {
  AiGenerateMutationData,
  FeatureListQueryData,
  FeatureListQueryVariables,
  GetPromptQueryData,
  GetPromptQueryVariables,
  NodeTreeQueryData,
} from '@/types/graphql';

type View = 'select' | 'result';

export function FeaturePickerPage() {
  const [focusedNode, setFocusedNode] = useState<NodeTreeItem | null>(null);
  const [selectedFeatureIds, setSelectedFeatureIds] = useState<Set<string>>(new Set());
  const [searchKeyword, setSearchKeyword] = useState('');
  const [activeTab, setActiveTab] = useState<'nodes' | 'features'>('nodes');
  const [view, setView] = useState<View>('select');
  const [promptResult, setPromptResult] = useState<Prompt | null>(null);
  const [promptName, setPromptName] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: nodeData, loading: nodeLoading } = useQuery<NodeTreeQueryData>(NODE_TREE_QUERY);

  const { data: featureData, loading: featureLoading } = useQuery<FeatureListQueryData, FeatureListQueryVariables>(
    FEATURE_LIST_QUERY,
    {
      variables: {
        pagination: { page: 1, pageSize: 200 },
        nodeIds: focusedNode ? [focusedNode.id] : null,
        includeHidden: false,
      },
      skip: !focusedNode,
      fetchPolicy: 'cache-first',
    },
  );

  const [generatePrompt] = useMutation<AiGenerateMutationData>(GENERATE_TEST_CASES_MUTATION);
  const [fetchPrompt] = useLazyQuery<GetPromptQueryData, GetPromptQueryVariables>(GET_PROMPT_QUERY);

  const currentFeatures = featureData?.featureList?.items ?? [];
  const tree = nodeData?.nodeTree ?? [];

  const filteredFeatures = useMemo(() => {
    if (!searchKeyword.trim()) return currentFeatures;
    const kw = searchKeyword.trim().toLowerCase();
    return currentFeatures.filter(
      (f) =>
        f.title?.toLowerCase().includes(kw) ||
        f.code?.toLowerCase().includes(kw) ||
        f.summary?.toLowerCase().includes(kw),
    );
  }, [currentFeatures, searchKeyword]);

  const currentAllChecked =
    filteredFeatures.length > 0 && filteredFeatures.every((f) => selectedFeatureIds.has(f.id));
  const currentSomeChecked =
    filteredFeatures.some((f) => selectedFeatureIds.has(f.id)) && !currentAllChecked;

  function handleNodeSelect(node: NodeTreeItem) {
    setFocusedNode(node);
    setSearchKeyword('');
    setActiveTab('features');
  }

  function toggleFeature(id: string) {
    setSelectedFeatureIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function toggleAllCurrentFeatures(checked: boolean) {
    setSelectedFeatureIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        filteredFeatures.forEach((f) => next.add(f.id));
      } else {
        filteredFeatures.forEach((f) => next.delete(f.id));
      }
      return next;
    });
  }

  async function handleGenerate() {
    if (selectedFeatureIds.size === 0) {
      Toast.show({ content: '请先选择特征', icon: 'fail' });
      return;
    }

    setIsGenerating(true);
    try {
      const { data } = await generatePrompt({
        variables: {
          input: {
            nodeIds: focusedNode ? [focusedNode.id] : [],
            featureIds: Array.from(selectedFeatureIds),
          },
        },
      });

      const result = data?.generatePrompt;
      if (!result?.success) {
        Toast.show({ content: result?.error?.message ?? result?.message ?? '生成失败', icon: 'fail' });
        return;
      }

      if (!result.id) {
        Toast.show({ content: '生成成功但未获取到提示词 ID', icon: 'fail' });
        return;
      }

      const { data: promptData } = await fetchPrompt({ variables: { id: result.id } });
      const prompt = promptData?.getPrompt;
      if (!prompt) {
        Toast.show({ content: '提示词查询失败', icon: 'fail' });
        return;
      }

      setPromptResult(prompt);
      setPromptName(prompt.name ?? '');
      setView('result');
    } catch (err) {
      const msg = err instanceof Error ? err.message : '未知错误';
      Toast.show({ content: msg, icon: 'fail' });
      window.parent.postMessage({ type: 'PROMPT_ERROR', message: msg }, '*');
    } finally {
      setIsGenerating(false);
    }
  }

  function handleSend() {
    if (!promptResult) return;
    const payload = {
      type: 'PROMPT_READY',
      prompt: {
        id: promptResult.id,
        name: promptName || promptResult.name || null,
        content: promptResult.content,
        model: promptResult.model ?? null,
        providerName: promptResult.providerName,
        createdByName: promptResult.createdByName ?? null,
        nodeIds: promptResult.nodeIds ?? null,
        featureIds: promptResult.featureIds ?? null,
        createdAt: promptResult.createdAt,
      },
    };
    window.parent.postMessage(payload, '*');
    Toast.show({ content: '已发送提示词', icon: 'success' });
  }

  function handleReset() {
    setView('select');
    setPromptResult(null);
    setPromptName('');
    setSelectedFeatureIds(new Set());
    setFocusedNode(null);
    setActiveTab('nodes');
  }

  if (view === 'result' && promptResult) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: 'var(--adm-color-background)' }}>
        <NavBar back={null} style={{ borderBottom: '1px solid var(--adm-color-border)' }}>
          提示词已生成
        </NavBar>

        <div style={{ flex: 1, overflow: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <div style={{ fontSize: 12, color: 'var(--adm-color-weak)', marginBottom: 4 }}>提示词名称（可选修改）</div>
            <Input
              value={promptName}
              onChange={setPromptName}
              placeholder="留空使用自动生成的名称"
              style={{ '--font-size': '14px' }}
            />
          </div>

          <div>
            <div style={{ fontSize: 12, color: 'var(--adm-color-weak)', marginBottom: 4 }}>
              生成内容 · 模型：{promptResult.model ?? '未知'}
            </div>
            <TextArea
              value={promptResult.content}
              readOnly
              rows={12}
              style={{ '--font-size': '13px', background: 'var(--adm-color-fill-content)', borderRadius: 8, padding: 12 }}
            />
          </div>
        </div>

        <div
          style={{
            padding: '12px 16px',
            borderTop: '1px solid var(--adm-color-border)',
            background: 'var(--adm-color-background)',
            display: 'flex',
            gap: 12,
          }}
        >
          <Button style={{ flex: 1 }} onClick={handleReset}>
            重新选择
          </Button>
          <Button color="primary" style={{ flex: 2 }} onClick={handleSend}>
            发送结果
          </Button>
        </div>
      </div>
    );
  }

  const featureTabTitle = focusedNode
    ? `特征 · ${focusedNode.name.length > 8 ? focusedNode.name.slice(0, 8) + '…' : focusedNode.name}`
    : '特征';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: 'var(--adm-color-background)' }}>
      <NavBar back={null} style={{ borderBottom: '1px solid var(--adm-color-border)' }}>
        APP 特征库 · 选择特征
      </NavBar>

      <Tabs
        activeKey={activeTab}
        onChange={(k) => setActiveTab(k as 'nodes' | 'features')}
        className="feature-picker-tabs"
      >
        {/* 节点 Tab */}
        <Tabs.Tab title="节点" key="nodes">
          <div style={{ height: '100%', overflow: 'auto', padding: '10px 14px' }}>
            <div style={{ fontSize: 11, color: 'var(--adm-color-weak)', marginBottom: 8 }}>
              点击节点查看对应特征
            </div>
            {nodeLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 32 }}>
                <SpinLoading />
              </div>
            ) : (
              <TreeView
                tree={tree}
                selectedId={focusedNode?.id}
                onSelect={handleNodeSelect}
              />
            )}
          </div>
        </Tabs.Tab>

        {/* 特征 Tab */}
        <Tabs.Tab title={featureTabTitle} key="features">
          <div style={{ height: '100%', overflow: 'auto', padding: '10px 14px', display: 'flex', flexDirection: 'column' }}>
            {!focusedNode ? (
              <div style={{ textAlign: 'center', color: 'var(--adm-color-weak)', paddingTop: 64, fontSize: 13 }}>
                请先在「节点」Tab 中选择节点
              </div>
            ) : (
              <>
                {/* 搜索框 */}
                {!featureLoading && currentFeatures.length > 0 && (
                  <SearchBar
                    placeholder="搜索特征名称 / 编码 / 摘要"
                    value={searchKeyword}
                    onChange={setSearchKeyword}
                    onClear={() => setSearchKeyword('')}
                    style={{ marginBottom: 6 }}
                  />
                )}

                {/* 全选行 */}
                {!featureLoading && filteredFeatures.length > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: 6 }}>
                    <Checkbox
                      checked={currentAllChecked}
                      indeterminate={currentSomeChecked}
                      onChange={toggleAllCurrentFeatures}
                    >
                      <span style={{ fontSize: 12, color: 'var(--adm-color-weak)' }}>
                        全选（{filteredFeatures.length} 条）
                      </span>
                    </Checkbox>
                  </div>
                )}

                {featureLoading ? (
                  <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 32 }}>
                    <SpinLoading />
                  </div>
                ) : (
                  <FeatureList
                    items={filteredFeatures}
                    selectable
                    selectedIds={selectedFeatureIds}
                    onSelect={toggleFeature}
                  />
                )}
              </>
            )}
          </div>
        </Tabs.Tab>
      </Tabs>

      {/* 底部操作栏 */}
      <div
        style={{
          padding: '10px 16px',
          borderTop: '1px solid var(--adm-color-border)',
          background: 'var(--adm-color-background)',
          flexShrink: 0,
        }}
      >
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Button
            size="small"
            disabled={selectedFeatureIds.size === 0}
            onClick={() => setSelectedFeatureIds(new Set())}
          >
            清除已选
            {selectedFeatureIds.size > 0 && (
              <Badge
                content={String(selectedFeatureIds.size)}
                style={{ '--right': '-6px', '--top': '-4px', fontSize: 10 }}
              />
            )}
          </Button>
          <Button
            color="primary"
            disabled={selectedFeatureIds.size === 0}
            loading={isGenerating}
            onClick={handleGenerate}
          >
            生成提示词 · {selectedFeatureIds.size} 条
          </Button>
        </Space>
      </div>
    </div>
  );
}
