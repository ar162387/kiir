import test from 'node:test';
import assert from 'node:assert/strict';
import { hasPermission, safeAdminReturnPath, validatePassword } from '../lib/cms/permissions.ts';

test('Content Managers cannot access staff, audit, branding, or permanent-delete capabilities', () => {
  for (const p of ['users.manage', 'audit.read', 'branding.edit', 'program.delete', 'media.delete'] as const) {
    assert.equal(hasPermission('content_manager', p), false);
    assert.equal(hasPermission('admin', p), true);
  }
  for (const p of ['content.edit', 'content.publish', 'program.edit', 'announcement.edit', 'contact.edit'] as const) {
    assert.equal(hasPermission('content_manager', p), true);
  }
});

test('login return paths cannot redirect outside the protected CMS', () => {
  for (const value of ['https://evil.example/admin', '//evil.example/admin', '/about', '/admin/../../about', '/admin\\evil', '/admin/login', '/admin\n', null, {}, '/administrator']) {
    assert.equal(safeAdminReturnPath(value), '/admin');
  }
  assert.equal(safeAdminReturnPath('/admin/users?tab=active'), '/admin/users?tab=active');
});

test('new staff passwords have bounded length and a minimum complexity', () => {
  assert.ok(validatePassword('short'));
  assert.ok(validatePassword('abcdefghijklmnop'));
  assert.ok(validatePassword('Aa1' + 'x'.repeat(126)));
  assert.equal(validatePassword('A long KIIR password 123!'), null);
});
