export type StaffRole = 'admin' | 'content_manager';
export type Permission = 'content.edit' | 'content.publish' | 'content.delete' | 'program.edit' | 'program.delete'
  | 'announcement.edit' | 'contact.edit' | 'branding.edit' | 'users.manage' | 'audit.read' | 'media.delete';

const editorial: Permission[] = ['content.edit', 'content.publish', 'program.edit', 'announcement.edit', 'contact.edit'];
export function hasPermission(role: StaffRole, permission: Permission) {
  return role === 'admin' || editorial.includes(permission);
}

export function safeAdminReturnPath(value: unknown): string {
  if (typeof value !== 'string' || /[\\\r\n\u0000]/.test(value)) return '/admin';
  try {
    const url = new URL(value, 'https://kiir.invalid');
    if (url.origin !== 'https://kiir.invalid') return '/admin';
    if (url.pathname !== '/admin' && !url.pathname.startsWith('/admin/')) return '/admin';
    if (url.pathname.startsWith('/admin/login')) return '/admin';
    return url.pathname + url.search;
  } catch { return '/admin'; }
}

export function validatePassword(password: string): string | null {
  if (password.length < 12 || password.length > 128) return 'Use a password with 12–128 characters.';
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)) {
    return 'Include uppercase and lowercase letters and a number.';
  }
  return null;
}
