import { Modal, Toast } from 'antd-mobile';
import { useState } from 'react';
import type { ReactNode } from 'react';

interface Props {
  open: boolean;
  title: string;
  content: ReactNode;
  onClose: () => void;
  onConfirm?: () => Promise<void> | void;
}

export function FormModal({ open, title, content, onClose, onConfirm }: Props) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!onConfirm || loading) return;
    setLoading(true);
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      Toast.show({
        content: err instanceof Error ? err.message : '操作失败，请稍后重试',
        icon: 'fail',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={open}
      title={title}
      content={content}
      closeOnAction={false}
      actions={[
        { key: 'cancel', text: '取消', disabled: loading, onClick: onClose },
        { key: 'confirm', text: loading ? '确认中...' : '确认', primary: true, disabled: loading, onClick: handleConfirm },
      ]}
    />
  );
}
