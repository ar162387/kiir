-- Preserve the trusted packaged KIIR logo when replacing a managed upload.
-- Explicit removal stays blank; arbitrary submitted URLs are never adopted.
begin;
create or replace function cms_private.mutate_settings(setting_key text,payload jsonb,expected_version int)
returns int language plpgsql security definer set search_path='' as $$
declare current public.site_settings; permission text; field record; item jsonb; segment jsonb; language_key text;
 old_assets uuid[]; aid uuid; asset public.media_assets; next_version int;
begin
 permission:=case when setting_key in('org','about') then 'branding.edit' when setting_key='ticker' then 'announcement.edit' when setting_key in('contact','social') then 'contact.edit' else null end;
 if permission is null or auth.uid() is null or not cms_private.has_permission(permission) then raise exception 'Settings permission required.' using errcode='42501';end if;
 perform pg_catalog.pg_advisory_xact_lock(724991247);
 select * into current from public.site_settings where key=setting_key for update;
 if not found or current.version is distinct from expected_version then raise exception 'These settings changed. Reload before saving.' using errcode='PT409';end if;
 if payload is null or length(payload::text)>100000 then raise exception 'Settings are too large.' using errcode='23514';end if;
 if setting_key='ticker' then
  if jsonb_typeof(payload)<>'array' or jsonb_array_length(payload)>30 then raise exception 'Use at most 30 announcements.' using errcode='23514';end if;
  for item in select value from jsonb_array_elements(payload) loop
   if jsonb_typeof(item)<>'object' or coalesce(length(item->>'id'),0) not between 1 and 80 or jsonb_typeof(item->'is_active')<>'boolean' then raise exception 'Invalid announcement.' using errcode='23514';end if;
   for language_key in select unnest(array['segments','segments_ur']) loop
    if jsonb_typeof(item->language_key)<>'array' or jsonb_array_length(item->language_key)>20 then raise exception 'Invalid announcement text.' using errcode='23514';end if;
    for segment in select value from jsonb_array_elements(item->language_key) loop
     if jsonb_typeof(segment->'text')<>'string' or length(segment->>'text')>1000 or (coalesce(segment->>'href','')<>'' and not cms_private.valid_public_link(segment->>'href')) then raise exception 'Invalid announcement text or link.' using errcode='23514';end if;
    end loop;
   end loop;
   if coalesce(length(item->'segments'->0->>'text'),0)=0 then raise exception 'Add announcement text.' using errcode='23514';end if;
  end loop;
 else
  if jsonb_typeof(payload)<>'object' then raise exception 'Invalid settings.' using errcode='23514';end if;
  for field in select * from jsonb_each(payload) loop
   if field.key not in('principles','logo_asset_id') and (jsonb_typeof(field.value)<>'string' or length(field.value#>>'{}')>12000) then raise exception 'Invalid settings value.' using errcode='23514';end if;
  end loop;
  if setting_key='contact' then
   if payload-ARRAY['address','phone','email']<>'{}'::jsonb or length(coalesce(payload->>'address',''))>1000 or length(coalesce(payload->>'phone',''))>80 or length(coalesce(payload->>'email',''))>254 or (coalesce(payload->>'email','')<>'' and payload->>'email' !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$') then raise exception 'Invalid contact details.' using errcode='23514';end if;
  elsif setting_key='social' then
   if payload-ARRAY['facebook','instagram','x','linkedin']<>'{}'::jsonb then raise exception 'Invalid social field.' using errcode='23514';end if;
   for field in select * from jsonb_each_text(payload) loop if field.value<>'' and (field.value !~ '^https?://' or not cms_private.valid_public_link(field.value)) then raise exception 'Use valid HTTP or HTTPS social links.' using errcode='23514';end if;end loop;
  elsif setting_key='about' then
   if payload-ARRAY['founded','history_en','history_ur','principles']<>'{}'::jsonb or jsonb_typeof(payload->'principles')<>'array' or jsonb_array_length(payload->'principles')>12 then raise exception 'Invalid About settings.' using errcode='23514';end if;
   for item in select value from jsonb_array_elements(payload->'principles') loop
    if jsonb_typeof(item)<>'object' or item-ARRAY['title_en','title_ur','body_en','body_ur']<>'{}'::jsonb then raise exception 'Invalid principle.' using errcode='23514';end if;
    for field in select * from jsonb_each(item) loop if jsonb_typeof(field.value)<>'string' or length(field.value#>>'{}')>6000 then raise exception 'Invalid principle text.' using errcode='23514';end if;end loop;
   end loop;
  elsif setting_key='org' then
   if payload-ARRAY['name','name_ur','tagline','tagline_ur','strapline','strapline_ur','blurb','blurb_ur','mission','mission_ur','logo_url','logo_asset_id']<>'{}'::jsonb or coalesce(length(trim(payload->>'name')),0) not between 1 and 240 then raise exception 'Enter a valid organization name.' using errcode='23514';end if;
   aid:=nullif(payload->>'logo_asset_id','')::uuid;
   if aid is not null then
    select * into asset from public.media_assets where id=aid for update;
    if not found or asset.status<>'ready' or asset.resource_type<>'image' then raise exception 'Choose a ready logo image.' using errcode='23514';end if;
    payload:=payload||jsonb_build_object('logo_url','https://res.cloudinary.com/'||asset.cloud_name||'/image/upload/f_auto,q_auto,w_600,c_limit/v'||asset.version||'/'||asset.public_id);
   else
    payload:=payload||jsonb_build_object('logo_url',case when payload->>'logo_url'='/logo/kiirlogo.png' then '/logo/kiirlogo.png' when payload->>'logo_url'='' then '' when current.value->>'logo_asset_id' is null then current.value->>'logo_url' else '' end);
   end if;
  end if;
 end if;
 select array_agg(asset_id) into old_assets from public.media_references mr where mr.settings_key=mutate_settings.setting_key;
 update public.site_settings set value=payload,version=version+1,updated_by=auth.uid(),updated_at=now() where key=setting_key returning version into next_version;
 delete from public.media_references mr where mr.settings_key=mutate_settings.setting_key;
 if aid is not null then
  insert into public.media_references(asset_id,settings_key) values(aid,setting_key);
  update public.media_jobs set status='cancelled',last_error=null where asset_id=aid and status in('queued','failed');
 end if;
 foreach aid in array coalesce(old_assets,'{}'::uuid[]) loop perform cms_private.queue_unused_asset(aid);end loop;
 insert into public.cms_audit_logs(actor_id,action,summary) values(auth.uid(),'settings.update',jsonb_build_object('key',setting_key));
 return next_version;
end;
$$;
revoke all on function cms_private.mutate_settings(text,jsonb,int) from public,anon;
grant execute on function cms_private.mutate_settings(text,jsonb,int) to authenticated;
notify pgrst,'reload schema';
commit;
