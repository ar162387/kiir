-- Staff identity is separate from public content. Only trusted server operations
-- can grant/revoke membership. Ordinary authenticated users are not CMS staff.
begin;
create schema if not exists cms_private;
revoke all on schema cms_private from public;
grant usage on schema cms_private to authenticated;

create table public.cms_memberships (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null check (length(email) <= 254),
  display_name text not null check (length(display_name) between 1 and 120),
  role text not null check (role in ('admin', 'content_manager')),
  is_enabled boolean not null default true,
  must_change_password boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.cms_memberships enable row level security;
revoke all on public.cms_memberships from anon, authenticated;
grant select on public.cms_memberships to authenticated;
grant all on public.cms_memberships to service_role;

create table public.cms_audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_id uuid,
  summary jsonb not null default '{}',
  created_at timestamptz not null default now()
);
alter table public.cms_audit_logs enable row level security;
revoke all on public.cms_audit_logs from anon, authenticated;
grant select on public.cms_audit_logs to authenticated;
grant all on public.cms_audit_logs to service_role;
grant usage, select on sequence public.cms_audit_logs_id_seq to service_role;

create table cms_private.rate_limits (
  bucket_key text primary key,
  window_start timestamptz not null,
  attempts int not null
);
alter table cms_private.rate_limits enable row level security;
revoke all on cms_private.rate_limits from public, anon, authenticated;

-- Definer is narrowly required to avoid recursively evaluating membership RLS.
-- No caller-selected identity; no default public execution privilege.
create function cms_private.has_permission(permission text)
returns boolean language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null and exists (
    select 1 from public.cms_memberships m
    where m.user_id = auth.uid() and m.is_enabled and not m.must_change_password
      and (m.role = 'admin' or permission = any(array[
        'content.edit','content.publish','program.edit','announcement.edit','contact.edit'
      ]))
  );
$$;
revoke all on function cms_private.has_permission(text) from public, anon;
grant execute on function cms_private.has_permission(text) to authenticated;

create policy "staff can read own membership; admins can read staff"
  on public.cms_memberships for select to authenticated
  using (user_id = (select auth.uid()) or cms_private.has_permission('users.manage'));
create policy "admins can read audit" on public.cms_audit_logs
  for select to authenticated using (cms_private.has_permission('audit.read'));

create function cms_private.protect_last_admin()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  perform pg_catalog.pg_advisory_xact_lock(724991243);
  if old.role = 'admin' and old.is_enabled then
    if tg_op = 'DELETE' or new.role <> 'admin' or not new.is_enabled then
      if not exists (select 1 from public.cms_memberships
        where role = 'admin' and is_enabled and user_id <> old.user_id) then
        raise exception 'The last enabled Admin cannot be removed or demoted.' using errcode = '23514';
      end if;
    end if;
  end if;
  if tg_op = 'DELETE' then return old; end if;
  new.updated_at = now();
  return new;
end;
$$;
revoke all on function cms_private.protect_last_admin() from public, anon, authenticated;
create trigger protect_last_admin before update or delete on public.cms_memberships
  for each row execute function cms_private.protect_last_admin();

-- Service-only: actor is supplied by the server after validating Auth identity.
-- The database independently verifies the actor's current Admin membership.
create function public.cms_set_member(
  actor uuid, target uuid, member_email text, member_name text, member_role text,
  enabled boolean, require_password_change boolean default true
) returns void language plpgsql security invoker set search_path = '' as $$
begin
  perform pg_catalog.pg_advisory_xact_lock(724991243);
  if not exists (select 1 from public.cms_memberships where user_id = actor
    and role = 'admin' and is_enabled and not must_change_password) then
    raise exception 'Admin permission required.' using errcode = '42501';
  end if;
  insert into public.cms_memberships(user_id,email,display_name,role,is_enabled,must_change_password)
    values(target,member_email,member_name,member_role,enabled,require_password_change)
  on conflict(user_id) do update set email=excluded.email,display_name=excluded.display_name,
    role=excluded.role,is_enabled=excluded.is_enabled,must_change_password=excluded.must_change_password;
  insert into public.cms_audit_logs(actor_id,action,entity_id,summary)
    values(actor,'staff.updated',target,jsonb_build_object('role',member_role,'enabled',enabled));
end;
$$;
revoke all on function public.cms_set_member(uuid,uuid,text,text,text,boolean,boolean) from public, anon, authenticated;
grant execute on function public.cms_set_member(uuid,uuid,text,text,text,boolean,boolean) to service_role;

create function public.cms_record_password_change(target uuid)
returns void language plpgsql security invoker set search_path = '' as $$
begin
  update public.cms_memberships set must_change_password=false,updated_at=now()
    where user_id=target and is_enabled;
  if not found then raise exception 'Active staff membership required.'; end if;
  insert into public.cms_audit_logs(actor_id,action,entity_id)
    values(target,'staff.password_changed',target);
end;
$$;
revoke all on function public.cms_record_password_change(uuid) from public, anon, authenticated;
grant execute on function public.cms_record_password_change(uuid) to service_role;

create function public.cms_consume_rate_limit(bucket text, max_attempts int, window_seconds int)
returns boolean language plpgsql security definer set search_path = '' as $$
declare count_now int;
begin
  if max_attempts not between 1 and 1000 or window_seconds not between 1 and 86400
    or length(bucket) > 200 then raise exception 'Invalid rate limit.'; end if;
  insert into cms_private.rate_limits(bucket_key,window_start,attempts) values(bucket,now(),1)
  on conflict(bucket_key) do update set
    attempts=case when cms_private.rate_limits.window_start < now()-make_interval(secs=>window_seconds)
      then 1 else cms_private.rate_limits.attempts+1 end,
    window_start=case when cms_private.rate_limits.window_start < now()-make_interval(secs=>window_seconds)
      then now() else cms_private.rate_limits.window_start end
  returning attempts into count_now;
  -- Bounded per-request housekeeping; no contact/email values are stored here.
  delete from cms_private.rate_limits where bucket_key in (
    select bucket_key from cms_private.rate_limits where window_start < now()-interval '2 days' limit 100
  );
  return count_now <= max_attempts;
end;
$$;
revoke all on function public.cms_consume_rate_limit(text,int,int) from public, anon, authenticated;
grant execute on function public.cms_consume_rate_limit(text,int,int) to service_role;
notify pgrst, 'reload schema';
commit;
