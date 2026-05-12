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
      closeOnMaskClick
      bodyStyle={{ width: 'min(100vw, 480px)', height: '100vh', display: 'flex', flexDirection: 'column' }}
    >
      <div style={{ padding: '16px 16px 0', flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 18, fontWeight: 700 }}>{title}</div>
        <div style={{ fontSize: 22, color: '#999', cursor: 'pointer', lineHeight: 1 }} onClick={onClose}>
          &times;
        </div>
      </div>
      <div style={{ padding: 16, flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
        {children}
      </div>
      <div style={{ padding: '0 16px 16px', flexShrink: 0, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Button onClick={onClose}>取消</Button>
        <Button color="primary" onClick={onSubmit}>
          {submitText ?? '提交'}
        </Button>
      </div>
    </Popup>
  );
}
