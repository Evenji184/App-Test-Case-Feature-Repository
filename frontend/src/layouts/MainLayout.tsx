import { AppOutline, LockOutline, TeamOutline, UnorderedListOutline, SetOutline } from 'antd-mobile-icons';
import { NavBar, SafeArea, TabBar } from 'antd-mobile';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/stores/auth';

const allTabs = [
  { key: '/features', title: '特征库', icon: <AppOutline />, permission: null },
  { key: '/manage/features', title: '管理', icon: <UnorderedListOutline />, permission: 'feature:list' },
  { key: '/manage/ai-providers', title: 'AI', icon: <SetOutline />, permission: 'ai:provider:list' },
  { key: '/manage/permissions', title: '权限', icon: <LockOutline />, permission: 'permission:list' },
  { key: '/manage/users', title: '人员', icon: <TeamOutline />, permission: 'user:list' },
];

export function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuth();
  const hasPermission = useAuthStore((state) => state.hasPermission);

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
          <div className="page-subtitle">当前账号：{auth.user?.username ?? '未登录'} / 权限数：{auth.permissions.length}</div>
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
    </div>
  );
}
