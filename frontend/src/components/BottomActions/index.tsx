import { ActionSheet, Button } from 'antd-mobile';
import { useState } from 'react';

interface ActionItem {
  key: string;
  text: string;
  danger?: boolean;
  onClick: () => void;
}

interface Props {
  actions: ActionItem[];
  triggerText?: string;
}

export function BottomActions({ actions, triggerText }: Props) {
  const [visible, setVisible] = useState(false);

  return (
    <>
      <Button size="small" onClick={(e) => { e.stopPropagation(); setVisible(true); }}>
        {triggerText ?? '更多操作'}
      </Button>
      <ActionSheet
        visible={visible}
        actions={actions.map((item) => ({ key: item.key, text: item.text, danger: item.danger }))}
        onClose={() => setVisible(false)}
        onAction={(action) => {
          setVisible(false);
          actions.find((item) => item.key === action.key)?.onClick();
        }}
      />
    </>
  );
}
