begin;
create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron;

-- Runs independently of Vercel/local development. Vault credentials are installed
-- separately by an owner-run setup script, never embedded in migration history.
create function cms_private.process_media_cleanup()
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
      and resource_type='image' and delivery_type='upload') then
      update public.media_jobs set status='failed',last_error='Asset is outside the managed account/prefix.' where id=job.id;
      continue;
    end if;
    stamp:=floor(extract(epoch from clock_timestamp()))::bigint;
    select encode(extensions.digest('invalidate=true&public_id='||a.public_id||'&timestamp='||stamp||(config->>'api_secret'),'sha1'),'hex')
      into signature from public.media_assets a where a.id=job.asset_id;
    select net.http_post(
      url:='https://api.cloudinary.com/v1_1/'||(config->>'cloud_name')||'/image/destroy',
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

-- Service wrapper used only for the Admin's retry button; the scheduler calls
-- the nonexposed private function directly.
create function public.cms_run_media_cleanup()
returns jsonb language sql security invoker set search_path='' as $$
  select cms_private.process_media_cleanup();
$$;
revoke all on function public.cms_run_media_cleanup() from public,anon,authenticated;
grant execute on function public.cms_run_media_cleanup() to service_role;

select cron.schedule('kiir-media-cleanup','* * * * *','select cms_private.process_media_cleanup();');
commit;
