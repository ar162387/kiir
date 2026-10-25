begin;
alter table public.media_assets drop constraint media_assets_resource_type_check;
alter table public.media_assets add check(resource_type in('image','raw'));
alter table public.media_assets drop constraint media_assets_format_check;
alter table public.media_assets add check(format in('jpg','jpeg','png','webp','pdf'));
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
      and resource_type in('image','raw') and delivery_type='upload') then
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

create or replace function cms_private.prepare_program()
returns trigger language plpgsql security definer set search_path='' as $$
declare asset public.media_assets; actor uuid:=auth.uid();
begin
  perform pg_catalog.pg_advisory_xact_lock(724991244);
  if tg_op='DELETE' then return old; end if;
  if exists(select 1 from public.program_redirects where old_slug=new.slug and program_id<>new.id) then
    raise exception 'This URL is reserved by an existing program redirect.' using errcode='23505';
  end if;
  if new.image_asset_id is not null then
    select * into asset from public.media_assets where id=new.image_asset_id for update;
    if not found or (asset.status<>'ready' or asset.resource_type<>'image') then raise exception 'Select a ready image before saving.' using errcode='23514'; end if;
    new.image_url:='https://res.cloudinary.com/'||asset.cloud_name||'/image/upload/f_auto,q_auto,w_1600,c_limit/v'||asset.version||'/'||asset.public_id;
  elsif tg_op='INSERT' or new.image_asset_id is distinct from old.image_asset_id then
    new.image_url:=null;
  else
    -- Existing local seed images may stay until replaced; clients cannot set arbitrary URLs.
    new.image_url:=case when new.image_url is null then null else old.image_url end;
  end if;
  new.updated_by:=actor;
  new.updated_at:=now();
  if tg_op='INSERT' then new.created_by:=actor;new.version:=1;
  else new.created_by:=old.created_by;new.created_at:=old.created_at;new.version:=old.version+1;end if;
  return new;
end;
$$;
revoke all on function cms_private.prepare_program() from public,anon,authenticated;

notify pgrst,'reload schema';
commit;
