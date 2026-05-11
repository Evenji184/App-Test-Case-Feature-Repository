import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { Button, Form, Input, List, Selector, Space, Switch, Tag, TextArea, Toast } from 'antd-mobile';
import {
  ASSIGN_ROLES_TO_USER_MUTATION,
  CREATE_USER_MUTATION,
  DELETE_USER_MUTATION,
  DISABLE_USER_MUTATION,
  ENABLE_USER_MUTATION,
  RESET_PASSWORD_MUTATION,
  UPDATE_USER_MUTATION,
} from '@/api/mutations/user';
import { USER_LIST_QUERY } from '@/api/queries/user';
import { BottomActions } from '@/components/BottomActions';
import { FormDrawer } from '@/components/FormDrawer';
import { SearchBar } from '@/components/SearchBar';
import { usePermissionStore } from '@/stores/permission';
import type { User } from '@/types/models';
import type { UserListQueryData, UserListQueryVariables } from '@/types/graphql';

export function UserManagePage() {
  const [keyword, setKeyword] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [roleDrawerOpen, setRoleDrawerOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [form] = Form.useForm();
  const { roles, fetchRoles } = usePermissionStore();

  const { data, refetch } = useQuery<UserListQueryData, UserListQueryVariables>(USER_LIST_QUERY, {
    variables: { pagination: { page: 1, pageSize: 50 }, keyword: keyword || undefined },
  });

  const [createUser] = useMutation(CREATE_USER_MUTATION);
  const [updateUser] = useMutation(UPDATE_USER_MUTATION);
  const [enableUser] = useMutation(ENABLE_USER_MUTATION);
  const [disableUser] = useMutation(DISABLE_USER_MUTATION);
  const [deleteUser] = useMutation(DELETE_USER_MUTATION, { refetchQueries: [USER_LIST_QUERY] });
  const [assignRoles] = useMutation(ASSIGN_ROLES_TO_USER_MUTATION);
  const [resetPassword] = useMutation(RESET_PASSWORD_MUTATION);

  useEffect(() => {
    void fetchRoles();
  }, [fetchRoles]);

  const openDrawer = (user?: User) => {
    setEditingUser(user ?? null);
    form.setFieldsValue(user ?? { isSuperAdmin: false });
    setDrawerOpen(true);
  };

  const roleOptions = roles.map((role) => ({ label: role.name, value: role.id }));

  return (
    <div className="card-section" style={{ display: 'grid', gap: 12 }}>
      <Space justify="between" block>
        <div>
          <h2 className="page-title">人员管理</h2>
          <p className="page-subtitle">用户维护、启停用与角色分配</p>
        </div>
        <Button color="primary" onClick={() => openDrawer()}>
          新建人员
        </Button>
      </Space>
      <SearchBar value={keyword} onChange={setKeyword} onSearch={() => void refetch()} placeholder="搜索用户名或邮箱" />
      <List>
        {(data?.userList.items ?? []).map((user) => (
          <List.Item
            key={user.id}
            description={`${user.email} · ${user.phone || '未填写手机号'}`}
            extra={
              <BottomActions
                actions={[
                  { key: 'edit', text: '编辑', onClick: () => openDrawer(user) },
                  {
                    key: 'toggle',
                    text: user.status === 'active' ? '禁用' : '启用',
                    onClick: async () => {
                      const { data: result } = user.status === 'active'
                        ? await disableUser({ variables: { userId: user.id } })
                        : await enableUser({ variables: { userId: user.id } });
                      Toast.show({ content: result?.disableUser?.message ?? result?.enableUser?.message ?? '操作成功' });
                      void refetch();
                    },
                  },
                  {
                    key: 'roles',
                    text: '分配角色',
                    onClick: () => {
                      setEditingUser(user);
                      setSelectedRoleIds(user.roleIds ?? []);
                      setRoleDrawerOpen(true);
                    },
                  },
                  {
                    key: 'password',
                    text: '重置密码',
                    onClick: async () => {
                      const { data: result } = await resetPassword({ variables: { userId: user.id, newPassword: '123456' } });
                      Toast.show({ content: result?.resetPassword?.message ?? '密码已重置为 123456' });
                    },
                  },
                  {
                    key: 'delete',
                    text: '删除',
                    danger: true,
                    onClick: async () => {
                      const { data: result } = await deleteUser({ variables: { userId: user.id } });
                      Toast.show({ content: result?.deleteUser?.message ?? '用户已删除' });
                    },
                  },
                ]}
              />
            }
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span>{user.displayName || user.username}</span>
              <span style={{ color: '#6b7280', fontSize: 12 }}>@{user.username}</span>
              <Tag color={user.status === 'active' ? 'success' : 'default'}>{user.status === 'active' ? '启用' : '禁用'}</Tag>
            </div>
          </List.Item>
        ))}
      </List>

      <FormDrawer open={drawerOpen} title={editingUser ? '编辑人员' : '新建人员'} onClose={() => setDrawerOpen(false)} onSubmit={() => form.submit()}>
        <Form
          form={form}
          layout="vertical"
          onFinish={async (values) => {
            try {
              const payload = { ...values, isSuperAdmin: Boolean(values.isSuperAdmin) };
              if (editingUser) {
                const { data: result } = await updateUser({ variables: { userId: editingUser.id, input: payload } });
                Toast.show({ content: result?.updateUser?.message ?? '用户更新成功' });
              } else {
                const { data: result } = await createUser({ variables: { input: { ...payload, password: values.password } } });
                Toast.show({ content: result?.createUser?.message ?? '用户创建成功' });
              }
              setDrawerOpen(false);
              void refetch();
            } catch {
              Toast.show({ content: '操作失败，请稍后重试' });
            }
          }}
          onFinishFailed={() => Toast.show({ content: '请检查表单填写是否完整' })}
        >
          {!editingUser ? (
            <>
              <Form.Item name="username" label="用户名" rules={[{ required: true, message: '请输入用户名' }]}>
                <Input placeholder="请输入用户名" />
              </Form.Item>
              <Form.Item name="password" label="初始密码" rules={[{ required: true, message: '请输入初始密码' }]}>
                <Input placeholder="请输入初始密码" type="password" />
              </Form.Item>
            </>
          ) : null}
          <Form.Item name="displayName" label="显示名称">
            <Input placeholder="请输入显示名称" />
          </Form.Item>
          <Form.Item name="email" label="邮箱" rules={[{ required: true, message: '请输入邮箱' }]}>
            <Input placeholder="请输入邮箱" />
          </Form.Item>
          <Form.Item name="phone" label="手机号">
            <Input placeholder="请输入手机号" />
          </Form.Item>
          <Form.Item name="avatarUrl" label="头像地址">
            <Input placeholder="请输入头像 URL" />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <TextArea placeholder="请输入备注" rows={2} />
          </Form.Item>
          <Form.Item name="isSuperAdmin" label="超级管理员" trigger="onChange" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </FormDrawer>

      <FormDrawer
        open={roleDrawerOpen}
        title={`分配角色${editingUser ? ` - ${editingUser.username}` : ''}`}
        onClose={() => setRoleDrawerOpen(false)}
        onSubmit={async () => {
          if (!editingUser) return;
          const { data: result } = await assignRoles({ variables: { userId: editingUser.id, roleIds: selectedRoleIds } });
          Toast.show({ content: result?.assignRolesToUser?.message ?? '角色分配成功' });
          setRoleDrawerOpen(false);
          void refetch();
        }}
      >
        <Selector
          options={roleOptions}
          value={selectedRoleIds}
          multiple
          onChange={setSelectedRoleIds}
        />
      </FormDrawer>
    </div>
  );
}
