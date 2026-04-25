import { DotLoading } from 'antd-mobile';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth';

export function RequireAuth() {
  const location = useLocation();
  const { initialized, isAuthenticated } = useAuthStore();

  if (!initialized) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', minHeight: '100vh' }}>
        <DotLoading />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}

export function RequirePermission({ permission }: { permission: string }) {
  const canAccess = useAuthStore((state) => state.hasPermission(permission));

  if (!canAccess) {
    return <Navigate to="/features" replace />;
  }

  return <Outlet />;
}
