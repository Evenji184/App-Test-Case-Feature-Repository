import { Modal } from 'antd-mobile';
import type { ReactNode } from 'react';

interface Props {
  open: boolean;
  title: string;
  content: ReactNode;
  onClose: () => void;
  onConfirm?: () => void;
}

export function FormModal({ open, title, content, onClose, onConfirm }: Props) {
  return (
    <Modal
      visible={open}
      title={title}
      content={content}
      closeOnAction
      actions={[
        { key: 'cancel', text: '取消', onClick: onClose },
        { key: 'confirm', text: '确认', primary: true, onClick: onConfirm },
      ]}
    />
  );
}
