import { useMemo } from 'react';
import { useAuthStore } from '@/stores/auth';

export function useAuth() {
  const store = useAuthStore();

  return useMemo(
    () => ({
      ...store,
      displayName: store.user?.displayName || store.user?.username || '未登录用户',
    }),
    [store],
  );
}
