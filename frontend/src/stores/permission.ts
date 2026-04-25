import { create } from 'zustand';
import { apolloClient } from '@/api/client';
import { PERMISSION_TREE_QUERY, ROLE_LIST_QUERY } from '@/api/queries/role';
import type { PermissionTreeQueryData, RoleListQueryData, RoleListQueryVariables } from '@/types/graphql';
import type { PermissionModuleGroup, Role } from '@/types/models';

interface PermissionState {
  permissionTree: PermissionModuleGroup[];
  roles: Role[];
  loading: boolean;
  fetchPermissionTree: () => Promise<void>;
  fetchRoles: () => Promise<void>;
}

export const usePermissionStore = create<PermissionState>((set) => ({
  permissionTree: [],
  roles: [],
  loading: false,
  async fetchPermissionTree() {
    set({ loading: true });
    try {
      const { data } = await apolloClient.query<PermissionTreeQueryData>({
        query: PERMISSION_TREE_QUERY,
        fetchPolicy: 'network-only',
      });
      set({ permissionTree: data.permissionTree });
    } finally {
      set({ loading: false });
    }
  },
  async fetchRoles() {
    set({ loading: true });
    try {
      const { data } = await apolloClient.query<RoleListQueryData, RoleListQueryVariables>({
        query: ROLE_LIST_QUERY,
        variables: { pagination: { page: 1, pageSize: 100 } },
        fetchPolicy: 'network-only',
      });
      set({ roles: data.roleList.items });
    } finally {
      set({ loading: false });
    }
  },
}));
