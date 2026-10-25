begin;
-- Hosted Auth account creation must come through the trusted provisioning path.
-- Only the Auth Admin API can choose the UUID of a new account; public signup
-- generates its own ID. User-editable metadata is never trusted.
create table cms_private.account_provisions(
 nonce uuid primary key default gen_random_uuid(),email text not null,expires_at timestamptz not null default now()+interval '5 minutes'
);
alter table cms_private.account_provisions enable row level security;
revoke all on cms_private.account_provisions from public,anon,authenticated;
grant select,insert,delete on cms_private.account_provisions to service_role;
create function public.cms_authorize_account(account_email text)
returns uuid language plpgsql security invoker set search_path='' as $$
declare token uuid;
begin
 if length(account_email) not between 3 and 254 then raise exception 'Invalid account email.';end if;
 delete from cms_private.account_provisions where nonce in(select nonce from cms_private.account_provisions where expires_at<now() limit 100);
 insert into cms_private.account_provisions(email) values(lower(trim(account_email))) returning nonce into token;
 return token;
end;
$$;
revoke all on function public.cms_authorize_account(text) from public,anon,authenticated;
grant execute on function public.cms_authorize_account(text) to service_role;
create function cms_private.require_account_provision()
returns trigger language plpgsql security definer set search_path='' as $$
begin
 delete from cms_private.account_provisions where nonce=new.id and email=lower(new.email) and expires_at>now();
 if not found then raise exception 'Staff accounts must be created by an administrator.' using errcode='42501';end if;
 return new;
end;
$$;
revoke all on function cms_private.require_account_provision() from public,anon,authenticated;
create trigger cms_staff_only_accounts before insert on auth.users for each row execute function cms_private.require_account_provision();
notify pgrst,'reload schema';
commit;
