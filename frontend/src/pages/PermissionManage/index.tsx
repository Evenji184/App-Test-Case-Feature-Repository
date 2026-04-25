import { useEffect, useMemo, useState } from 'react';
import { useMutation } from '@apollo/client';
import { Button, Form, Input, List, Space, Tag, TextArea, Toast } from 'antd-mobile';
import { ASSIGN_PERMISSIONS_TO_ROLE_MUTATION, CREATE_ROLE_MUTATION, UPDATE_ROLE_MUTATION } from '@/api/mutations/role';
import { FormDrawer } from '@/components/FormDrawer';
import { PermissionSelector } from '@/components/PermissionSelector';
import { usePermissionStore } from '@/stores/permission';
import type { Role } from '@/types/models';

export function PermissionManagePage() {
  const { permissionTree, roles, fetchPermissionTree, fetchRoles } = usePermissionStore();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [permissionDrawerOpen, setPermissionDrawerOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>([]);
  const [form] = Form.useForm();

  const [createRole] = useMutation(CREATE_ROLE_MUTATION);
  const [updateRole] = useMutation(UPDATE_ROLE_MUTATION);
  const [assignPermissions] = useMutation(ASSIGN_PERMISSIONS_TO_ROLE_MUTATION);

  useEffect(() => {
    void fetchPermissionTree();
    void fetchRoles();
  }, [fetchPermissionTree, fetchRoles]);

  const permissionCount = useMemo(
    () => permissionTree.reduce((sum, module) => sum + module.resources.reduce((acc, resource) => acc + resource.permissions.length, 0), 0),
    [permissionTree],
  );

  return (
    <div className="card-section" style={{ display: 'grid', gap: 12 }}>
      <Space justify="between" block>
        <div>
          <h2 className="page-title">权限管理</h2>
          <p className="page-subtitle">角色维护与权限分配，当前权限总数 {permissionCount}</p>
        </div>
        <Button
          color="primary"
          onClick={() => {
            setEditingRole(null);
            form.resetFields();
            setDrawerOpen(true);
          }}
        >
          新建角色
        </Button>
      </Space>

      <List>
        {roles.map((role) => (
          <List.Item
            key={role.id}
            description={role.description || '暂无描述'}
            extra={
              <Space>
                <Button
                  size="mini"
                  onClick={() => {
                    setEditingRole(role);
                    form.setFieldsValue(role);
                    setDrawerOpen(true);
                  }}
                >
                  编辑
                </Button>
                <Button
                  size="mini"
                  color="primary"
                  onClick={() => {
                    setEditingRole(role);
                    setSelectedPermissionIds([]);
                    setPermissionDrawerOpen(true);
                  }}
                >
                  分配权限
                </Button>
              </Space>
            }
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span>{role.name}</span>
              <Tag color={role.status === 'active' ? 'success' : 'default'}>{role.status}</Tag>
              <Tag>{role.code}</Tag>
            </div>
          </List.Item>
        ))}
      </List>

      <FormDrawer open={drawerOpen} title={editingRole ? '编辑角色' : '新建角色'} onClose={() => setDrawerOpen(false)} onSubmit={() => form.submit()}>
        <Form
          form={form}
          layout="vertical"
          onFinish={async (values) => {
            const { data } = editingRole
              ? await updateRole({ variables: { roleId: editingRole.id, input: values } })
              : await createRole({ variables: { input: values } });
            Toast.show({ content: data?.updateRole?.message ?? data?.createRole?.message ?? '保存成功' });
            setDrawerOpen(false);
            void fetchRoles();
          }}
        >
          <Form.Item name="name" label="角色名称" rules={[{ required: true, message: '请输入角色名称' }]}>
            <Input placeholder="请输入角色名称" />
          </Form.Item>
          <Form.Item name="code" label="角色编码" rules={[{ required: true, message: '请输入角色编码' }]}>
            <Input placeholder="请输入角色编码" />
          </Form.Item>
          <Form.Item name="description" label="角色描述">
            <TextArea placeholder="请输入角色描述" rows={3} />
          </Form.Item>
        </Form>
      </FormDrawer>

      <FormDrawer
        open={permissionDrawerOpen}
        title={`分配权限${editingRole ? ` - ${editingRole.name}` : ''}`}
        onClose={() => setPermissionDrawerOpen(false)}
        onSubmit={async () => {
          if (!editingRole) return;
          const { data } = await assignPermissions({ variables: { roleId: editingRole.id, permissionIds: selectedPermissionIds } });
          Toast.show({ content: data?.assignPermissionsToRole.message ?? '权限分配成功' });
          setPermissionDrawerOpen(false);
        }}
      >
        <PermissionSelector value={selectedPermissionIds} options={permissionTree} onChange={setSelectedPermissionIds} />
      </FormDrawer>
    </div>
  );
}
