import { Button, Popup } from 'antd-mobile';
import type { ReactNode } from 'react';

interface Props {
  open: boolean;
  title: string;
  onClose: () => void;
  onSubmit?: () => void;
  submitText?: string;
  children: ReactNode;
}

export function FormDrawer({ open, title, onClose, onSubmit, submitText, children }: Props) {
  return (
    <Popup
      position="right"
      visible={open}
      onClose={onClose}
      bodyStyle={{ width: 'min(100vw, 480px)', minHeight: '100vh' }}
    >
      <div style={{ padding: 16, display: 'grid', gap: 16 }}>
        <div style={{ fontSize: 18, fontWeight: 700 }}>{title}</div>
        {children}
        <Button color="primary" block onClick={onSubmit}>
          {submitText ?? '提交'}
        </Button>
      </div>
    </Popup>
  );
}
