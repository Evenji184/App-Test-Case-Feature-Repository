import { useState } from 'react';
import { useLazyQuery, useMutation, useQuery } from '@apollo/client';
import { Button, Checkbox, Input, NavBar, Space, SpinLoading, TextArea, Toast } from 'antd-mobile';
import { GET_PROMPT_QUERY } from '@/api/queries/aiProvider';
import { FEATURE_LIST_QUERY } from '@/api/queries/feature';
import { NODE_TREE_QUERY } from '@/api/queries/node';
import { GENERATE_TEST_CASES_MUTATION } from '@/api/mutations/aiProvider';
import { FeatureList } from '@/components/FeatureList';
import { TreeView } from '@/components/TreeView';
import type { FeatureItem, Prompt } from '@/types/models';
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
  const [selectedNodeIds, setSelectedNodeIds] = useState<Set<string>>(new Set());
  const [selectedFeatureIds, setSelectedFeatureIds] = useState<Set<string>>(new Set());
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
        nodeIds: selectedNodeIds.size > 0 ? Array.from(selectedNodeIds) : null,
        includeHidden: false,
      },
      skip: selectedNodeIds.size === 0,
    },
  );

  const [generatePrompt] = useMutation<AiGenerateMutationData>(GENERATE_TEST_CASES_MUTATION);
  const [fetchPrompt] = useLazyQuery<GetPromptQueryData, GetPromptQueryVariables>(GET_PROMPT_QUERY);

  const features = featureData?.featureList?.items ?? [];
  const tree = nodeData?.nodeTree ?? [];

  function toggleNode(id: string) {
    setSelectedNodeIds((prevNodes) => {
      const nextNodes = new Set(prevNodes);
      const wasChecked = nextNodes.has(id);
      if (wasChecked) {
        nextNodes.delete(id);
      } else {
        nextNodes.add(id);
      }

      // 同步更新已选特征：勾选节点时全选该节点特征，取消时移除
      const nodeFeatureIds = features.filter((f) => f.nodeId === id).map((f) => f.id);
      if (nodeFeatureIds.length > 0) {
        setSelectedFeatureIds((prevFeatures) => {
          const nextFeatures = new Set(prevFeatures);
          if (wasChecked) {
            nodeFeatureIds.forEach((fid) => nextFeatures.delete(fid));
          } else {
            nodeFeatureIds.forEach((fid) => nextFeatures.add(fid));
          }
          return nextFeatures;
        });
      }

      return nextNodes;
    });
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
            nodeIds: Array.from(selectedNodeIds),
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
  }

  if (view === 'result' && promptResult) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--adm-color-background)' }}>
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--adm-color-background)' }}>
      <NavBar back={null} style={{ borderBottom: '1px solid var(--adm-color-border)' }}>
        APP 特征库 · 选择特征
      </NavBar>

      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {/* 节点树区域 */}
        <div
          style={{
            flexShrink: 0,
            maxHeight: '40%',
            borderBottom: '1px solid var(--adm-color-border)',
            overflow: 'auto',
            padding: '8px 12px',
            background: 'var(--adm-color-background)',
          }}
        >
          <div style={{ fontSize: 12, color: 'var(--adm-color-weak)', marginBottom: 6 }}>选择节点</div>
          {nodeLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12 }}>
              <SpinLoading />
            </div>
          ) : (
            <TreeView
              tree={tree}
              selectable
              selectedIds={selectedNodeIds}
              onCheck={toggleNode}
              onSelect={() => undefined}
            />
          )}
        </div>

        {/* 特征列表区域 */}
        <div style={{ flex: 1, overflow: 'auto', padding: 8 }}>
          {selectedNodeIds.size === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--adm-color-weak)', paddingTop: 40, fontSize: 13 }}>
              请先在上方选择节点
            </div>
          ) : featureLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 24 }}>
              <SpinLoading />
            </div>
          ) : (
            <>
              {features.length > 0 && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '4px 4px 8px',
                    borderBottom: '1px solid var(--adm-color-border)',
                    marginBottom: 8,
                  }}
                >
                  <Checkbox
                    checked={features.length > 0 && features.every((f) => selectedFeatureIds.has(f.id))}
                    indeterminate={
                      features.some((f) => selectedFeatureIds.has(f.id)) &&
                      !features.every((f) => selectedFeatureIds.has(f.id))
                    }
                    onChange={(checked) => {
                      setSelectedFeatureIds((prev) => {
                        const next = new Set(prev);
                        if (checked) {
                          features.forEach((f) => next.add(f.id));
                        } else {
                          features.forEach((f) => next.delete(f.id));
                        }
                        return next;
                      });
                    }}
                  >
                    <span style={{ fontSize: 13, color: 'var(--adm-color-text)' }}>
                      全选（{features.length} 条）
                    </span>
                  </Checkbox>
                </div>
              )}
              <FeatureList
                items={features}
                selectable
                selectedIds={selectedFeatureIds}
                onSelect={toggleFeature}
              />
            </>
          )}
        </div>
      </div>

      {/* 底部操作栏 */}
      <div
        style={{
          padding: '12px 16px',
          borderTop: '1px solid var(--adm-color-border)',
          background: 'var(--adm-color-background)',
        }}
      >
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Button
            size="small"
            disabled={selectedFeatureIds.size === 0}
            onClick={() => setSelectedFeatureIds(new Set())}
          >
            清除已选 ({selectedFeatureIds.size})
          </Button>
          <Button
            color="primary"
            disabled={selectedFeatureIds.size === 0}
            loading={isGenerating}
            onClick={handleGenerate}
          >
            生成提示词 ({selectedFeatureIds.size} 条特征)
          </Button>
        </Space>
      </div>
    </div>
  );
}
