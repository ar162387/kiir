'use client';

import { useActionState, useState } from 'react';
import SubmitButton from '@/components/SubmitButton';
import { login, changePassword, createStaffUser, updateStaffUser, resetStaffPassword, type ActionState } from '@/lib/cms/actions';
import type { StaffMember } from '@/lib/cms/session';

function Submit({ children }: { children: React.ReactNode }) {
  return <SubmitButton className="cms-button" pendingLabel="Please wait…">{children}</SubmitButton>;
}

function Feedback({ state }: { state: ActionState }) {
  return <div aria-live="polite">
    {state.error && <p role="alert" className="cms-feedback cms-feedback-error">{state.error}</p>}
    {state.success && <p className="cms-feedback cms-feedback-success">{state.success}</p>}
  </div>;
}

export function LoginForm({ next, configured }: { next: string; configured: boolean }) {
  const [state, action] = useActionState(login, {});
  const [email, setEmail] = useState('');
  return <form action={action} className="cms-form">
    <input type="hidden" name="next" value={next} />
    <label>Email address<input name="email" type="email" autoComplete="username" required maxLength={254} value={email} onChange={e => setEmail(e.target.value)} placeholder="you@kiir.org.pk" /></label>
    <label>Password<input name="password" type="password" autoComplete="current-password" required maxLength={128} /></label>
    <Feedback state={state} />
    {configured ? <Submit>Sign in to CMS <span aria-hidden>→</span></Submit> : <p className="cms-feedback cms-feedback-error">Staff sign-in is not configured. Contact the site administrator.</p>}
    <p className="cms-help">Staff accounts are created by an Admin. If you need access or a password reset, contact your Admin.</p>
  </form>;
}

export function PasswordForm() {
  const [state, action] = useActionState(changePassword, {});
  return <form action={action} className="cms-form">
    <label>Current password<input name="current_password" type="password" autoComplete="current-password" required maxLength={128} /></label>
    <label>New password<input name="password" type="password" autoComplete="new-password" minLength={12} maxLength={128} required aria-describedby="password-help" /></label>
    <p id="password-help" className="cms-help">Use 12–128 characters, with uppercase and lowercase letters and a number.</p>
    <label>Confirm new password<input name="confirmation" type="password" autoComplete="new-password" minLength={12} maxLength={128} required /></label>
    <Feedback state={state} /><Submit>Update password</Submit>
  </form>;
}

export function CreateStaffForm() {
  const [state, action] = useActionState(createStaffUser, {});
  return <form action={action} className="cms-form">
    <label>Full name<input name="display_name" autoComplete="off" required maxLength={120} /></label>
    <label>Email address<input name="email" type="email" autoComplete="off" required maxLength={254} /></label>
    <label>Role<select name="role" defaultValue="content_manager"><option value="content_manager">Content Manager</option><option value="admin">Admin</option></select></label>
    <label>Temporary password<input name="password" type="password" autoComplete="new-password" minLength={12} maxLength={128} required /></label>
    <p className="cms-help">Use at least 12 characters with uppercase, lowercase, and a number. Share this password privately. No confirmation email is sent.</p>
    <Feedback state={state} /><Submit>Create staff account</Submit>
  </form>;
}

export function EditStaffForm({ member, isSelf }: { member: StaffMember; isSelf: boolean }) {
  const [state, action] = useActionState(updateStaffUser, {});
  const [resetState, resetAction] = useActionState(resetStaffPassword, {});
  return <div className="cms-member-actions">
    <form action={action} className="cms-form">
      <input type="hidden" name="user_id" value={member.user_id} />
      <fieldset disabled={isSelf}>
        <label>Role for {member.display_name}<select name="role" defaultValue={member.role}><option value="content_manager">Content Manager</option><option value="admin">Admin</option></select></label>
        <label className="cms-checkbox"><input type="checkbox" name="enabled" defaultChecked={member.is_enabled} /> CMS access enabled</label>
        {!isSelf && <Submit>Save access</Submit>}
      </fieldset>
      <Feedback state={state} />
      {isSelf && <p className="cms-help">Your account. Another Admin can change your access.</p>}
    </form>
    {!isSelf && <details className="cms-reset"><summary>Set a temporary password</summary>
      <form action={resetAction} className="cms-form">
        <input type="hidden" name="user_id" value={member.user_id} />
        <label>Temporary password<input name="password" type="password" autoComplete="new-password" minLength={12} maxLength={128} required /></label>
        <p className="cms-help">The staff member must change it on next sign-in. Share it privately.</p>
        <Feedback state={resetState} /><Submit>Reset password</Submit>
      </form>
    </details>}
  </div>;
}
