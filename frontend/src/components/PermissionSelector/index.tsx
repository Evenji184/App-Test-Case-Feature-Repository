import { Checkbox, Collapse } from 'antd-mobile';
import type { PermissionModuleGroup } from '@/types/models';

interface Props {
  value: string[];
  options: PermissionModuleGroup[];
  onChange: (value: string[]) => void;
}

export function PermissionSelector({ value, options, onChange }: Props) {
  const toggle = (permissionId: string, checked: boolean) => {
    if (checked) {
      onChange(Array.from(new Set([...value, permissionId])));
      return;
    }

    onChange(value.filter((item) => item !== permissionId));
  };

  return (
    <Collapse>
      {options.map((module) => (
        <Collapse.Panel key={module.module} title={module.module}>
          <div style={{ display: 'grid', gap: 12 }}>
            {module.resources.map((resource) => (
              <div key={resource.resource}>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>{resource.resource}</div>
                <div style={{ display: 'grid', gap: 8 }}>
                  {resource.permissions.map((permission) => (
                    <Checkbox
                      key={permission.id}
                      checked={value.includes(permission.id)}
                      onChange={(checked) => toggle(permission.id, checked)}
                    >
                      {permission.name}（{permission.code}）
                    </Checkbox>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Collapse.Panel>
      ))}
    </Collapse>
  );
}
