-- Run against the real schema; all verification is rolled back.
begin;
do $$
declare admin_id uuid;
begin
  if (select count(*) from public.cms_memberships where role='admin' and is_enabled) <> 1 then
    raise exception 'This check expects exactly one enabled Admin; no changes made.';
  end if;
  select user_id into admin_id from public.cms_memberships where role='admin' and is_enabled;
  begin
    update public.cms_memberships set is_enabled=false where user_id=admin_id;
    raise exception 'FAIL: last Admin disablement succeeded';
  exception when check_violation then
    raise notice 'PASS: last Admin cannot be disabled';
  end;
  begin
    update public.cms_memberships set role='content_manager' where user_id=admin_id;
    raise exception 'FAIL: last Admin demotion succeeded';
  exception when check_violation then
    raise notice 'PASS: last Admin cannot be demoted';
  end;
  begin
    delete from public.cms_memberships where user_id=admin_id;
    raise exception 'FAIL: last Admin deletion succeeded';
  exception when check_violation then
    raise notice 'PASS: last Admin cannot be deleted';
  end;
end;
$$;
rollback;
