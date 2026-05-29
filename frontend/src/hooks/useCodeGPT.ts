import { useCallback, useEffect, useRef, useState } from 'react';
import { useMutation } from '@apollo/client';
import { SAVE_PROMPT_MUTATION } from '@/api/mutations/aiProvider';

export function useCodeGPT() {
  const instanceRef = useRef<CodeGPTInstance | null>(null);
  const [savePromptMut] = useMutation(SAVE_PROMPT_MUTATION);
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