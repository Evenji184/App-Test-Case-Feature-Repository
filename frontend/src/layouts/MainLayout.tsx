import { useState } from 'react';
import { useMutation } from '@apollo/client';
import { AppOutline, LockOutline, TeamOutline, UnorderedListOutline, SetOutline, TextOutline } from 'antd-mobile-icons';
import { Button, Form, Input, NavBar, SafeArea, TabBar, Toast } from 'antd-mobile';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { CHANGE_MY_PASSWORD_MUTATION } from '@/api/mutations/user';
import { FormDrawer } from '@/components/FormDrawer';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/stores/auth';

const allTabs = [
  { key: '/features', title: '特征库', icon: <AppOutline />, permission: null },
  { key: '/manage/features', title: '管理', icon: <UnorderedListOutline />, permission: 'feature:list' },
  { key: '/manage/ai-providers', title: 'AI', icon: <SetOutline />, permission: 'ai:provider:list' },
  { key: '/manage/prompts', title: '提示词', icon: <TextOutline />, permission: 'ai:prompt:list' },
  { key: '/manage/permissions', title: '权限', icon: <LockOutline />, permission: 'permission:list' },
  { key: '/manage/users', title: '人员', icon: <TeamOutline />, permission: 'user:list' },
];

export function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuth();
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const logout = useAuthStore((state) => state.logout);
  const [passwordDrawerOpen, setPasswordDrawerOpen] = useState(false);
  const [passwordForm] = Form.useForm();
  const [changeMyPassword] = useMutation(CHANGE_MY_PASSWORD_MUTATION);

  const visibleTabs = allTabs.filter((tab) => tab.permission === null || hasPermission(tab.permission));

  const currentTab = visibleTabs.find((item) => location.pathname.startsWith(item.key));

  if (!currentTab && visibleTabs.length > 0) {
    return <Navigate to={visibleTabs[0].key} replace />;
  }

  return (
    <div className="app-shell" style={{ paddingBottom: 64 }}>
      <SafeArea position="top" />
      <NavBar back={null}>{import.meta.env.VITE_APP_TITLE || 'APP 特征库管理系统'}</NavBar>
      <div className="page-container">
        <div style={{ marginBottom: 12 }}>
          <div className="page-title">{auth.displayName}</div>
          <div className="page-subtitle">
            当前账号：{auth.user?.username ?? '未登录'} / 权限数：{auth.permissions.length}
            <Button size="mini" fill="outline" style={{ marginLeft: 8 }} onClick={() => setPasswordDrawerOpen(true)}>
              修改密码
            </Button>
            <Button size="mini" fill="outline" color="danger" style={{ marginLeft: 8 }} onClick={() => void logout()}>
              退出登录
            </Button>
          </div>
        </div>
        <Outlet />
      </div>
      <TabBar
        activeKey={currentTab?.key ?? '/features'}
        onChange={(value) => navigate(value)}
        style={{ position: 'fixed', bottom: 0, left: 0, right: 0, borderTop: '1px solid #f0f0f0', background: '#fff' }}
      >
        {visibleTabs.map((item) => (
          <TabBar.Item key={item.key} icon={item.icon} title={item.title} />
        ))}
      </TabBar>
      <SafeArea position="bottom" />

      <FormDrawer
        open={passwordDrawerOpen}
        title="修改密码"
        onClose={() => setPasswordDrawerOpen(false)}
        onSubmit={() => passwordForm.submit()}
      >
        <Form
          form={passwordForm}
          layout="vertical"
          onFinish={async (values) => {
            if (values.newPassword !== values.confirmPassword) {
              Toast.show({ content: '两次输入的密码不一致', icon: 'fail' });
              return;
            }
            if (values.newPassword.length < 6) {
              Toast.show({ content: '新密码长度不能少于 6 位', icon: 'fail' });
              return;
            }
            const { data } = await changeMyPassword({ variables: { oldPassword: values.oldPassword, newPassword: values.newPassword } });
            if (data?.changeMyPassword?.success) {
              Toast.show({ content: data.changeMyPassword.message ?? '密码修改成功' });
              setPasswordDrawerOpen(false);
              passwordForm.resetFields();
            } else {
              Toast.show({ content: data?.changeMyPassword?.message ?? '密码修改失败', icon: 'fail' });
            }
          }}
        >
          <Form.Item name="oldPassword" label="旧密码" rules={[{ required: true, message: '请输入旧密码' }]}>
            <Input placeholder="请输入旧密码" type="password" />
          </Form.Item>
          <Form.Item name="newPassword" label="新密码" rules={[{ required: true, message: '请输入新密码' }]}>
            <Input placeholder="新密码至少 6 位" type="password" />
          </Form.Item>
          <Form.Item name="confirmPassword" label="确认新密码" rules={[{ required: true, message: '请确认新密码' }]}>
            <Input placeholder="再次输入新密码" type="password" />
          </Form.Item>
        </Form>
      </FormDrawer>
    </div>
  );
}