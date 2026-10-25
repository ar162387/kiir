begin;
create table if not exists public.contact_messages(
 id uuid primary key default gen_random_uuid(),name text not null check(length(name) between 1 and 120),
 email text not null check(length(email)<=254),subject text check(length(subject)<=240),
 message text not null check(length(message) between 10 and 10000),is_read boolean not null default false,created_at timestamptz not null default now()
);
alter table public.contact_messages enable row level security;
revoke all on public.contact_messages from public,anon,authenticated;
grant select on public.contact_messages to authenticated;
grant update(is_read) on public.contact_messages to authenticated;
grant all on public.contact_messages to service_role;
create policy "admin contact inbox" on public.contact_messages for select to authenticated using(cms_private.has_permission('users.manage'));
create policy "admin message status" on public.contact_messages for update to authenticated using(cms_private.has_permission('users.manage')) with check(cms_private.has_permission('users.manage'));
create index contact_messages_recent on public.contact_messages(created_at desc,id);
notify pgrst,'reload schema';
commit;
