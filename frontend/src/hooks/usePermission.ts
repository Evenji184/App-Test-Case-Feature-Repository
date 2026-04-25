import { useAuthStore } from '@/stores/auth';

export function usePermission(code?: string) {
  return useAuthStore((state) => state.hasPermission(code));
}
