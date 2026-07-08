import { useCallback, useEffect, useRef, useState } from 'react';
import { useMutation } from '@apollo/client';
import { Toast } from 'antd-mobile';
import { SAVE_PROMPT_MUTATION } from '@/api/mutations/aiProvider';
import type { SavePromptMutationData } from '@/types/graphql';

export function useCodeGPT() {
  const instanceRef = useRef<CodeGPTInstance | null>(null);
  const [savePromptMut] = useMutation<SavePromptMutationData>(SAVE_PROMPT_MUTATION);
  const savePromptRef = useRef(savePromptMut);
  savePromptRef.current = savePromptMut;

  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof CodeGPT === 'undefined') return;

    const templateId = import.meta.env.VITE_CODEGPT_TEMPLATE_ID || undefined;
    const pluginId = import.meta.env.VITE_CODEGPT_PLUGIN_ID || undefined;
    const model = import.meta.env.VITE_CODEGPT_MODEL || undefined;

    const inst = new CodeGPT({
      templateId,
      pluginId,
      model,
      showBtn: false,
      displayMode: 'overlay',
    });

    inst.onChatResult((result) => {
      if (!result.data.content) return;
      savePromptRef.current({
        variables: {
          input: {
            content: result.data.content,
            model: result.data.modelType,
          },
        },
      })
        .then((res) => {
          const saved = res.data?.savePrompt;
          if (saved?.success) {
            Toast.show({ content: saved.message ?? '提示词已保存', icon: 'success' });
          } else {
            Toast.show({ content: saved?.error?.message ?? '提示词保存失败', icon: 'fail' });
          }
        })
        .catch(() => {
          Toast.show({ content: '提示词保存失败，请稍后重试', icon: 'fail' });
        });
    });

    instanceRef.current = inst;
    setReady(true);

    return () => {
      inst.destroy();
      instanceRef.current = null;
      setReady(false);
    };
  }, []);

  const use = useCallback((params: UseParams) => {
    if (instanceRef.current) {
      instanceRef.current.use(params);
    }
  }, []);

  const show = useCallback(() => {
    if (instanceRef.current) {
      instanceRef.current.show();
    }
  }, []);

  const hide = useCallback(() => {
    if (instanceRef.current) {
      instanceRef.current.hide();
    }
  }, []);

  return { ready, use, show, hide };
}
