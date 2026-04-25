import { useState } from 'react';
import { Button, Form, Input, Toast } from 'antd-mobile';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export function LoginPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);

  const from = (location.state as { from?: string } | null)?.from ?? '/features';

  return (
    <div>
      <h1 className="page-title">登录系统</h1>
      <p className="page-subtitle">支持手机端 H5 与中后台统一访问</p>
      <Form
        layout="vertical"
        onFinish={async (values) => {
          setLoading(true);
          try {
            const result = await auth.login(values.username, values.password);
            if (!result.success) {
              Toast.show({ icon: 'fail', content: result.message });
              return;
            }
            Toast.show({ icon: 'success', content: result.message });
            navigate(from, { replace: true });
          } finally {
            setLoading(false);
          }
        }}
        footer={
          <Button block type="submit" color="primary" loading={loading}>
            登录
          </Button>
        }
      >
        <Form.Item name="username" label="用户名" rules={[{ required: true, message: '请输入用户名' }]}>
          <Input placeholder="请输入用户名" clearable />
        </Form.Item>
        <Form.Item name="password" label="密码" rules={[{ required: true, message: '请输入密码' }]}>
          <Input placeholder="请输入密码" type="password" clearable />
        </Form.Item>
      </Form>
    </div>
  );
}
