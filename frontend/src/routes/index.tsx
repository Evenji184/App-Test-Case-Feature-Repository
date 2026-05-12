import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthLayout } from '@/layouts/AuthLayout';
import { MainLayout } from '@/layouts/MainLayout';
import { LoginPage } from '@/pages/Login';
import { FeatureManagePage } from '@/pages/FeatureManage';
import { PermissionManagePage } from '@/pages/PermissionManage';
import { UserManagePage } from '@/pages/UserManage';
import { AiProviderPage } from '@/pages/AiProvider';
import { PromptManagePage } from '@/pages/PromptManage';
import { RequireAuth, RequirePermission } from './guards';
import { useAuthStore } from '@/stores/auth';

export function AppRoutes() {
  const bootstrap = useAuthStore((state) => state.bootstrap);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  return (
    <Routes>
      <Route
        path="/login"
        element={
          <AuthLayout>
            <LoginPage />
          </AuthLayout>
        }
      />
      <Route element={<RequireAuth />}>
        <Route element={<MainLayout />}>
          <Route path="/features" element={<FeatureManagePage />} />
          <Route element={<RequirePermission permission="ai:provider:list" />}>
            <Route path="/manage/ai-providers" element={<AiProviderPage />} />
          </Route>
          <Route element={<RequirePermission permission="ai:prompt:list" />}>
            <Route path="/manage/prompts" element={<PromptManagePage />} />
          </Route>
          <Route element={<RequirePermission permission="permission:list" />}>
            <Route path="/manage/permissions" element={<PermissionManagePage />} />
          </Route>
          <Route element={<RequirePermission permission="user:list" />}>
            <Route path="/manage/users" element={<UserManagePage />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/features" replace />} />
    </Routes>
  );
}
