export function hasPermission(permissions: string[], code?: string) {
  if (!code) {
    return true;
  }

  return permissions.includes(code) || permissions.includes('*:*');
}

export function hasAnyPermission(permissions: string[], codes: string[]) {
  return codes.some((code) => hasPermission(permissions, code));
}
