begin;
alter table public.media_assets drop constraint media_assets_resource_type_check;
alter table public.media_assets drop constraint media_assets_format_check;
alter table public.media_assets drop constraint media_assets_bytes_check;
alter table public.media_assets add check(resource_type in('image','raw','video'));
alter table public.media_assets add check(format in('jpg','jpeg','png','webp','pdf','mp4'));
alter table public.media_assets add check(bytes between 1 and case when resource_type='video' then 104857600 else 10485760 end);

create table public.media_entries (
 id uuid primary key default gen_random_uuid(),
 kind text not null check(kind in('album','photo','documentary')),
 slug text not null unique,
 draft jsonb not null,
 version int not null default 1,
 updated_at timestamptz not null default now()
);
create table public.media_entries_live (
 id uuid primary key references public.media_entries(id) on delete cascade,
 kind text not null check(kind in('album','photo','documentary')),
 slug text not null unique,
 title text not null,
 description text not null,
 items jsonb not null,
 published_at timestamptz not null default now()
);
create index media_entries_kind_recent on public.media_entries(kind,updated_at desc,id);
create index media_entries_live_kind_recent on public.media_entries_live(kind,published_at desc,id);
alter table public.media_entries enable row level security;
alter table public.media_entries_live enable row level security;
revoke all on public.media_entries,public.media_entries_live from public,anon,authenticated;
grant select on public.media_entries to authenticated;
grant select on public.media_entries_live to anon,authenticated;
grant all on public.media_entries,public.media_entries_live to service_role;
create policy "staff media workspace" on public.media_entries for select to authenticated using(cms_private.has_permission('content.edit'));
create policy "public media workspace" on public.media_entries_live for select to anon,authenticated using(true);

alter table public.media_references add column media_entry_id uuid references public.media_entries(id) on delete cascade;
alter table public.media_references drop constraint media_reference_owner;
alter table public.media_references add constraint media_reference_owner check(
 num_nonnulls(program_id,content_id,settings_key,media_entry_id)=1
 and ((num_nonnulls(content_id,media_entry_id)=1)=(slot is not null))
);
create unique index media_entry_asset on public.media_references(media_entry_id,slot,asset_id) where media_entry_id is not null;

create function cms_private.save_media_entry(target uuid,entry_kind text,payload jsonb,expected_version int,operation text)
returns uuid language plpgsql security definer set search_path='' as $$
declare
 previous public.media_entries; asset public.media_assets; items jsonb:='[]';
 ids uuid[]; aid uuid; old_assets uuid[]; url text; photo_count int:=0;
 title text:=trim(coalesce(payload->>'title','')); description text:=trim(coalesce(payload->>'description',''));
 entry_slug text:=payload->>'slug'; stamp timestamptz;
begin
 if not cms_private.has_permission('content.edit') then raise exception 'Staff permission required.' using errcode='42501';end if;
 if operation not in('draft','publish','unpublish','delete') or entry_kind not in('album','photo','documentary') then
  raise exception 'Choose a valid operation and media type.' using errcode='23514';
 end if;
 if operation='delete' and not cms_private.has_permission('content.delete') then raise exception 'Admin permission required.' using errcode='42501';end if;
 if operation in('publish','unpublish') and not cms_private.has_permission('content.publish') then raise exception 'Publishing permission required.' using errcode='42501';end if;
 perform pg_catalog.pg_advisory_xact_lock(724991247);
 if target is not null then
  select * into previous from public.media_entries where id=target for update;
  if not found or previous.version is distinct from expected_version or previous.kind<>entry_kind then raise exception 'This entry changed. Reload before saving.' using errcode='PT409';end if;
  entry_slug:=previous.slug;
 elsif operation in('unpublish','delete') then
  raise exception 'Choose an existing entry.' using errcode='23514';
 end if;
 select array_agg(distinct asset_id order by asset_id) into old_assets from public.media_references where media_entry_id=target;
 if operation='delete' then
  delete from public.media_entries where id=target;
 elsif operation='unpublish' then
  delete from public.media_entries_live where id=target;
  delete from public.media_references where media_entry_id=target and slot='published';
  update public.media_entries set version=version+1,updated_at=now() where id=target;
 else
  if length(title)>240 or (entry_kind<>'photo' and length(title)=0) or length(description)>12000
   or (entry_kind='album' and cardinality(regexp_split_to_array(description,'[[:space:]]+'))>100)
   or coalesce(entry_slug,'') !~ '^[a-z0-9]+(-[a-z0-9]+)*$' or length(entry_slug)>100
   or jsonb_typeof(payload->'asset_ids') is distinct from 'array' or octet_length(payload::text)>200000 then
   raise exception 'Check the title, description, and selected files.' using errcode='23514';
  end if;
  select coalesce(array_agg(value::uuid order by ord),'{}') into ids
   from jsonb_array_elements_text(payload->'asset_ids') with ordinality as selected(value,ord);
  if (select count(distinct v) from unnest(ids) v)<>cardinality(ids) or (entry_kind<>'album' and cardinality(ids)>1) then
   raise exception 'Choose distinct media files.' using errcode='23514';
  end if;
  if target is null then
   insert into public.media_entries(kind,slug,draft) values(entry_kind,entry_slug,'{}') returning id into target;
  end if;
  delete from public.media_references where media_entry_id=target and slot='draft';
  perform 1 from public.media_assets where id=any(ids) order by id for update;
  foreach aid in array ids loop
   select * into asset from public.media_assets where id=aid;
   if not found or asset.status<>'ready' or asset.resource_type not in('image','video')
     or (entry_kind='photo' and asset.resource_type<>'image')
     or (entry_kind='documentary' and asset.resource_type<>'video') then
    raise exception 'Choose ready media of the appropriate type.' using errcode='23514';
   end if;
   if asset.resource_type='video' then
    if exists(select 1 from public.media_references where asset_id=aid and media_entry_id is distinct from target) then
     raise exception 'Upload a separate video for this entry.' using errcode='23514';
    end if;
    url:='https://res.cloudinary.com/'||asset.cloud_name||'/video/upload/v'||asset.version||'/'||asset.public_id||'.mp4';
   else
    photo_count:=photo_count+1;
    url:='https://res.cloudinary.com/'||asset.cloud_name||'/image/upload/f_auto,q_auto,w_1600,c_limit/v'||asset.version||'/'||asset.public_id;
   end if;
   items:=items||jsonb_build_array(jsonb_build_object('id',aid,'type',asset.resource_type,'url',url,
    'alt',asset.alt_text,'width',asset.width,'height',asset.height,'name',asset.original_filename));
   insert into public.media_references(asset_id,media_entry_id,slot) values(aid,target,'draft');
   update public.media_jobs set status='cancelled',last_error=null where asset_id=aid and status in('queued','failed');
  end loop;
  update public.media_entries set draft=jsonb_build_object('title',title,'description',description,'items',items),updated_at=now(),
   version=case when previous.id is null then 1 else version+1 end where id=target;
  if operation='publish' then
   if (entry_kind='album' and photo_count<2) or (entry_kind='photo' and photo_count<>1)
    or (entry_kind='documentary' and (description='' or cardinality(ids)<>1)) then
    raise exception 'Complete the required description and media before publishing.' using errcode='23514';
   end if;
   select published_at into stamp from public.media_entries_live where id=target;
   insert into public.media_entries_live(id,kind,slug,title,description,items,published_at)
   values(target,entry_kind,entry_slug,title,description,items,coalesce(stamp,now()))
   on conflict(id) do update set title=excluded.title,description=excluded.description,items=excluded.items;
   delete from public.media_references where media_entry_id=target and slot='published';
   insert into public.media_references(asset_id,media_entry_id,slot)
    select asset_id,target,'published' from public.media_references where media_entry_id=target and slot='draft';
  end if;
 end if;
 foreach aid in array coalesce(old_assets,'{}'::uuid[]) loop perform cms_private.queue_unused_asset(aid);end loop;
 insert into public.cms_audit_logs(actor_id,action,entity_id,summary)
 values(auth.uid(),entry_kind||'.'||operation,target,jsonb_build_object('name',coalesce(nullif(title,''),previous.draft->>'title')));
 return target;
end;
$$;
revoke all on function cms_private.save_media_entry(uuid,text,jsonb,int,text) from public,anon;
grant execute on function cms_private.save_media_entry(uuid,text,jsonb,int,text) to authenticated;
create function public.cms_save_media_entry(target uuid,entry_kind text,payload jsonb,expected_version int,operation text)
returns uuid language sql security invoker set search_path='' as $$
 select cms_private.save_media_entry(target,entry_kind,payload,expected_version,operation)
$$;
revoke all on function public.cms_save_media_entry(uuid,text,jsonb,int,text) from public,anon;
grant execute on function public.cms_save_media_entry(uuid,text,jsonb,int,text) to authenticated;

create view public.gallery_photos with(security_invoker=true) as
 select distinct on ((item->>'id')::uuid) (item->>'id')::uuid id,item
 from public.media_entries_live e cross join lateral jsonb_array_elements(e.items) item
 where e.kind in('album','photo') and item->>'type'='image'
 order by (item->>'id')::uuid,e.published_at desc,e.id;
revoke all on public.gallery_photos from public,anon,authenticated;
grant select on public.gallery_photos to anon,authenticated,service_role;
create or replace function cms_private.process_media_cleanup()
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  job record; response record; config jsonb; result jsonb; stamp bigint;
  request bigint; signature text; done_count int:=0; queued_count int:=0;
begin
  if not pg_catalog.pg_try_advisory_xact_lock(724991245) then return '{"busy":true}'::jsonb;end if;
  -- Abandoned uploads/drafts must not accumulate indefinitely.
  insert into public.media_jobs(asset_id)
    select a.id from public.media_assets a where a.status in('pending','ready')
      and a.created_at<now()-interval '24 hours'
      and not exists(select 1 from public.media_references r where r.asset_id=a.id)
      and not exists(select 1 from public.media_jobs j where j.asset_id=a.id)
    order by a.created_at limit 100 on conflict do nothing;

  for job in select j.* from public.media_jobs j where j.status='processing' order by j.id limit 20 for update skip locked loop
    select * into response from net._http_response where id=job.request_id;
    if not found and job.started_at>now()-interval '2 minutes' then continue;end if;
    result:=null;
    if response.content is not null then
      begin result:=response.content::jsonb;exception when others then result:=null;end;
    end if;
    if response.status_code between 200 and 299 and result->>'result' in('ok','not found') then
      update public.media_assets set status='deleted' where id=job.asset_id;
      update public.media_jobs set status='complete',completed_at=now(),last_error=null where id=job.id;
      done_count:=done_count+1;
    else
      update public.media_jobs set status=case when attempts>=8 then 'failed' else 'queued' end,
        not_before=now()+make_interval(secs=>least(3600,30*power(2,least(attempts,7))::int)),
        last_error=case when response.status_code is null then 'Cloudinary did not respond; retry scheduled.'
          else 'Cloudinary deletion returned HTTP '||response.status_code end,
        request_id=null,started_at=null where id=job.id;
    end if;
  end loop;

  select decrypted_secret::jsonb into config from vault.decrypted_secrets where name='kiir_cloudinary_cleanup';
  if config is null then return jsonb_build_object('completed',done_count,'configured',false);end if;
  for job in select j.* from public.media_jobs j where j.status='queued' and j.not_before<=now()
    order by j.not_before,j.id limit 5 for update skip locked loop
    -- The same row lock is held by program attachments. Deleting assets cannot be reattached.
    perform 1 from public.media_assets where id=job.asset_id for update;
    if exists(select 1 from public.media_references where asset_id=job.asset_id) then
      update public.media_jobs set status='cancelled',last_error=null where id=job.id;
      continue;
    end if;
    if not exists(select 1 from public.media_assets where id=job.asset_id
      and public_id like (config->>'prefix')||'%' and cloud_name=config->>'cloud_name'
      and resource_type in('image','raw','video') and delivery_type='upload') then
      update public.media_jobs set status='failed',last_error='Asset is outside the managed account/prefix.' where id=job.id;
      continue;
    end if;
    stamp:=floor(extract(epoch from clock_timestamp()))::bigint;
    select encode(extensions.digest('invalidate=true&public_id='||a.public_id||'&timestamp='||stamp||(config->>'api_secret'),'sha1'),'hex')
      into signature from public.media_assets a where a.id=job.asset_id;
    select net.http_post(
      url:='https://api.cloudinary.com/v1_1/'||(config->>'cloud_name')||'/'||a.resource_type||'/destroy',
      headers:='{"Content-Type":"application/json"}'::jsonb,
      body:=jsonb_build_object('public_id',a.public_id,'invalidate',true,'timestamp',stamp,
        'api_key',config->>'api_key','signature',signature),timeout_milliseconds:=10000)
      into request from public.media_assets a where a.id=job.asset_id;
    update public.media_assets set status='deleting' where id=job.asset_id;
    update public.media_jobs set status='processing',attempts=attempts+1,request_id=request,started_at=now(),last_error=null where id=job.id;
    queued_count:=queued_count+1;
  end loop;
  return jsonb_build_object('completed',done_count,'dispatched',queued_count,'configured',true);
end;
$$;
revoke all on function cms_private.process_media_cleanup() from public,anon,authenticated;
grant execute on function cms_private.process_media_cleanup() to service_role;


notify pgrst,'reload schema';
commit;
