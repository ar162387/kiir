-- Optimistic editing conflicts are HTTP 409 business errors, not transient database serialization failures.
begin;
create or replace function public.cms_save_program(payload jsonb, expected_version int default null)
returns uuid language plpgsql security invoker set search_path='' as $$
declare item_id uuid:=nullif(payload->>'id','')::uuid; changed uuid;
begin
  if not cms_private.has_permission('program.edit') then raise exception 'Program permission required.' using errcode='42501';end if;
  if item_id is null then
    insert into public.programs(slug,name,name_ur,description,description_ur,long_description,long_description_ur,image_asset_id,sort_order,is_active)
    values(payload->>'slug',payload->>'name',nullif(payload->>'name_ur',''),payload->>'description',nullif(payload->>'description_ur',''),
      nullif(payload->>'long_description',''),nullif(payload->>'long_description_ur',''),nullif(payload->>'image_asset_id','')::uuid,
      coalesce((payload->>'sort_order')::int,0),coalesce((payload->>'is_active')::boolean,true)) returning id into changed;
  else
    update public.programs set slug=payload->>'slug',name=payload->>'name',name_ur=nullif(payload->>'name_ur',''),
      description=payload->>'description',description_ur=nullif(payload->>'description_ur',''),long_description=nullif(payload->>'long_description',''),
      long_description_ur=nullif(payload->>'long_description_ur',''),image_asset_id=nullif(payload->>'image_asset_id','')::uuid,
      image_url=case when coalesce((payload->>'remove_image')::boolean,false) then null else image_url end,
      sort_order=coalesce((payload->>'sort_order')::int,0),is_active=coalesce((payload->>'is_active')::boolean,true)
    where id=item_id and version=expected_version returning id into changed;
    if changed is null then raise exception 'This program changed since you opened it. Reload before saving.' using errcode='PT409';end if;
  end if;
  return changed;
end;
$$;
revoke all on function public.cms_save_program(jsonb,int) from public,anon;
grant execute on function public.cms_save_program(jsonb,int) to authenticated;

create or replace function public.cms_delete_program(target uuid, expected_version int)
returns void language plpgsql security invoker set search_path='' as $$
begin
  if not cms_private.has_permission('program.delete') then raise exception 'Admin permission required.' using errcode='42501';end if;
  delete from public.programs where id=target and version=expected_version;
  if not found then raise exception 'This program changed. Reload before deleting.' using errcode='PT409';end if;
end;
$$;
revoke all on function public.cms_delete_program(uuid,int) from public,anon;
grant execute on function public.cms_delete_program(uuid,int) to authenticated;


notify pgrst,'reload schema';
commit;
