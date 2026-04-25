import { create } from 'zustand';
import { apolloClient } from '@/api/client';
import { LOGIN_MUTATION, LOGOUT_MUTATION } from '@/api/mutations/auth';
import { CURRENT_USER_QUERY } from '@/api/queries/auth';
import type { CurrentUserQueryData, LoginMutationData, LoginMutationVariables } from '@/types/graphql';
import type { AuthUser } from '@/types/models';
import { storage } from '@/utils/storage';
import { hasPermission } from '@/utils/permission';

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  permissions: string[];
  initialized: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  bootstrap: () => Promise<void>;
  setAuth: (payload: { user: AuthUser; token: string; permissions: string[] }) => void;
  clearAuth: () => void;
  hasPermission: (code?: string) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: storage.getUser<AuthUser>(),
  token: storage.getToken(),
  permissions: storage.getPermissions(),
  initialized: false,
  isAuthenticated: Boolean(storage.getToken()),
  async login(username, password) {
    const { data } = await apolloClient.mutate<LoginMutationData, LoginMutationVariables>({
      mutation: LOGIN_MUTATION,
      variables: { username, password },
    });

    const result = data?.login;
    if (!result?.success || !result.data) {
      return { success: false, message: result?.message ?? '登录失败' };
    }

    get().setAuth({
      user: result.data.user,
      token: result.data.accessToken,
      permissions: result.data.permissions,
    });

    return { success: true, message: result.message };
  },
  async logout() {
    try {
      await apolloClient.mutate({ mutation: LOGOUT_MUTATION });
    } finally {
      get().clearAuth();
      await apolloClient.clearStore();
    }
  },
  async bootstrap() {
    const token = storage.getToken();
    if (!token) {
      set({ initialized: true, isAuthenticated: false, user: null, permissions: [] });
      return;
    }

    try {
      const { data } = await apolloClient.query<CurrentUserQueryData>({
        query: CURRENT_USER_QUERY,
        fetchPolicy: 'network-only',
      });

      set({
        user: data.currentUser,
        token,
        permissions: storage.getPermissions(),
        initialized: true,
        isAuthenticated: true,
      });
      storage.setUser(data.currentUser);
    } catch {
      get().clearAuth();
      set({ initialized: true });
    }
  },
  setAuth(payload) {
    storage.setToken(payload.token);
    storage.setUser(payload.user);
    storage.setPermissions(payload.permissions);
    set({
      user: payload.user,
      token: payload.token,
      permissions: payload.permissions,
      isAuthenticated: true,
      initialized: true,
    });
  },
  clearAuth() {
    storage.clearAuth();
    set({ user: null, token: null, permissions: [], isAuthenticated: false, initialized: true });
  },
  hasPermission(code) {
    const state = get();
    return state.user?.isSuperAdmin ? true : hasPermission(state.permissions, code);
  },
}));
