import { AppOutline, LockOutline, TeamOutline, UnorderedListOutline, SetOutline } from 'antd-mobile-icons';
import { NavBar, SafeArea, TabBar } from 'antd-mobile';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

const tabs = [
  { key: '/features', title: '特征库', icon: <AppOutline /> },
  { key: '/manage/features', title: '管理', icon: <UnorderedListOutline /> },
  { key: '/manage/ai-providers', title: 'AI', icon: <SetOutline /> },
  { key: '/manage/permissions', title: '权限', icon: <LockOutline /> },
  { key: '/manage/users', title: '人员', icon: <TeamOutline /> },
];

export function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuth();

  return (
    <div className="app-shell" style={{ paddingBottom: 64 }}>
      <SafeArea position="top" />
      <NavBar back={null}>{import.meta.env.VITE_APP_TITLE || 'APP 特征库管理系统'}</NavBar>
      <div className="page-container">
        <div style={{ marginBottom: 12 }}>
          <div className="page-title">{auth.displayName}</div>
          <div className="page-subtitle">当前账号：{auth.user?.username ?? '未登录'} / 权限数：{auth.permissions.length}</div>
        </div>
        <Outlet />
      </div>
      <TabBar
        activeKey={tabs.find((item) => location.pathname.startsWith(item.key))?.key ?? '/features'}
        onChange={(value) => navigate(value)}
        style={{ position: 'fixed', bottom: 0, left: 0, right: 0, borderTop: '1px solid #f0f0f0', background: '#fff' }}
      >
        {tabs.map((item) => (
          <TabBar.Item key={item.key} icon={item.icon} title={item.title} />
        ))}
      </TabBar>
      <SafeArea position="bottom" />
    </div>
  );
}
