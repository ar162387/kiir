-- The rate limiter is service-only and does not need definer privileges.
begin;
grant usage on schema cms_private to service_role;
grant select, insert, update, delete on cms_private.rate_limits to service_role;
alter function public.cms_consume_rate_limit(text,int,int) security invoker;
commit;
