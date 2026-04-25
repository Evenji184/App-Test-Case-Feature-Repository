const TOKEN_KEY = 'app-feature-library-token';
const USER_KEY = 'app-feature-library-user';
const PERMISSION_KEY = 'app-feature-library-permissions';

export const storage = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  setToken: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clearToken: () => localStorage.removeItem(TOKEN_KEY),
  getUser: <T>() => {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as T) : null;
  },
  setUser: (user: unknown) => localStorage.setItem(USER_KEY, JSON.stringify(user)),
  clearUser: () => localStorage.removeItem(USER_KEY),
  getPermissions: () => {
    const raw = localStorage.getItem(PERMISSION_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  },
  setPermissions: (permissions: string[]) => localStorage.setItem(PERMISSION_KEY, JSON.stringify(permissions)),
  clearPermissions: () => localStorage.removeItem(PERMISSION_KEY),
  clearAuth: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(PERMISSION_KEY);
  },
};
