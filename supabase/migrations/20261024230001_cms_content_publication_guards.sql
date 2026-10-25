begin;
create or replace function cms_private.mutate_content(payload jsonb,expected_version int,operation text)
returns uuid language plpgsql security definer set search_path='' as $$
declare
 target uuid:=nullif(payload->>'id','')::uuid; current public.content_records;
 d jsonb:=payload-'id'; old_assets uuid[]; aid uuid; pid uuid; urls jsonb:='{}';
 a public.media_assets; old_live_slug text; stamp timestamptz; attachments jsonb; published_files jsonb;
begin
 if auth.uid() is null or not cms_private.has_permission('content.edit') then raise exception 'Staff permission required.' using errcode='42501';end if;
 if operation not in('draft','publish','unpublish','archive','delete') then raise exception 'Invalid operation.' using errcode='23514';end if;
 if operation='delete' and not cms_private.has_permission('content.delete') then raise exception 'Admin permission required.' using errcode='42501';end if;
 if operation in('publish','unpublish') and not cms_private.has_permission('content.publish') then raise exception 'Publishing permission required.' using errcode='42501';end if;
 perform pg_catalog.pg_advisory_xact_lock(724991246);
 if target is not null then
   select * into current from public.content_records where id=target for update;
   if not found or current.version is distinct from expected_version then raise exception 'This record changed. Reload before saving.' using errcode='PT409';end if;
 end if;
 select array_agg(distinct asset_id) into old_assets from public.media_references where content_id=target;
 if operation='delete' then
   delete from public.content_records where id=target;
 elsif operation in('archive','unpublish') then
   delete from public.content_live where id=target;
   -- Keep its last published assets for restoring a hidden record.
   update public.content_records set status=case when operation='archive' then 'archived' else 'draft' end,
    version=version+1,updated_by=auth.uid(),updated_at=now() where id=target;
 else
   if octet_length(d::text)>500000 or jsonb_typeof(d)<>'object' or length(trim(coalesce(d->>'title',''))) not between 1 and 240
     or length(coalesce(d->>'excerpt',''))>1200 or length(coalesce(d->>'title_ur',''))>240
     or length(coalesce(d->>'excerpt_ur',''))>1200 or coalesce(d->>'slug','') !~ '^[a-z0-9]+(-[a-z0-9]+)*$'
     or length(d->>'slug')>100 then raise exception 'Check title, URL and content length.' using errcode='23514';end if;
   if d->>'publication_kind' is not null and d->>'publication_kind' not in('opinion-articles','research-papers','short-stories','newsletters') then raise exception 'Invalid publication category.' using errcode='23514';end if;
   if d->>'event_status' not in('scheduled','cancelled','postponed') or d->>'event_zone' not in(select name from pg_catalog.pg_timezone_names) then raise exception 'Invalid event settings.' using errcode='23514';end if;
   if nullif(d->>'event_end','')::timestamptz < nullif(d->>'event_start','')::timestamptz then raise exception 'Event ends before it starts.' using errcode='23514';end if;
   if operation='publish' and (
     length(trim(coalesce(d->>'excerpt','')))=0 or
     (coalesce(d->>'body_text','')='' and nullif(d->>'document_id','') is null) or
     ((d->>'is_event')::boolean and nullif(d->>'event_start','') is null) or
     (d->>'publication_kind' in('opinion-articles','short-stories','research-papers') and length(trim(coalesce(d->>'authors','')))=0) or
     (d->>'publication_kind'='research-papers' and length(trim(coalesce(d->>'abstract','')))=0) or
     (d->>'publication_kind'='newsletters' and length(trim(coalesce(d->>'issue','')))=0) or
     ((d->>'ur_ready')::boolean and (length(trim(coalesce(d->>'title_ur','')))=0 or
       (coalesce(d->>'body_text_ur','')='' and nullif(d->>'document_ur_id','') is null)))
   ) then raise exception 'Complete the required publishing fields.' using errcode='23514';end if;
   if exists(select 1 from public.content_records where slug=d->>'slug' and id is distinct from target) or
      exists(select 1 from public.content_redirects where old_slug=d->>'slug' and content_id is distinct from target) or
      exists(select 1 from public.content_live where slug=d->>'slug' and id is distinct from target) then raise exception 'URL already reserved.' using errcode='23505';end if;
   if target is null then
     insert into public.content_records(slug,draft,created_by,updated_by) values(d->>'slug',d,auth.uid(),auth.uid()) returning id into target;
   else
     update public.content_records set slug=d->>'slug',draft=d,version=version+1,updated_by=auth.uid(),updated_at=now() where id=target;
   end if;
   delete from public.content_programs where content_id=target and slot='draft';
   for pid in select value::text::uuid from jsonb_array_elements_text(coalesce(d->'program_ids','[]')) loop
     insert into public.content_programs values(target,pid,'draft') on conflict do nothing;
   end loop;
   -- Derive attachments from document content rather than trusting a caller's list.
   select coalesce(jsonb_agg(distinct x),'[]') into attachments from (select d as original) source,
     lateral (select d->>'cover_id' as x union all select d->>'document_id' union all select d->>'document_ur_id'
       union all select value->>'id' from jsonb_array_elements(coalesce(d->'gallery','[]'))
       union all select value #>> '{}' from jsonb_path_query(d->'body','$.** ? (@.type == "managedImage").attrs.assetId') as j(value)
       union all select value #>> '{}' from jsonb_path_query(d->'body_ur','$.** ? (@.type == "managedImage").attrs.assetId') as j(value)) ids
     where nullif(x,'') is not null;
   d:=d||jsonb_build_object('asset_ids',attachments);
   delete from public.media_references where content_id=target and slot='draft';
   for aid in select distinct value::uuid from jsonb_array_elements_text(coalesce(d->'asset_ids','[]')) loop
     select * into a from public.media_assets where id=aid for update;
     if not found or a.status<>'ready' or ((aid::text in(d->>'document_id',d->>'document_ur_id')) and a.resource_type<>'raw') or ((aid::text not in(coalesce(d->>'document_id',''),coalesce(d->>'document_ur_id',''))) and a.resource_type<>'image') then raise exception 'A selected file is not ready.' using errcode='23514';end if;
     urls:=urls||jsonb_build_object(aid::text,case when a.resource_type='image' then
       'https://res.cloudinary.com/'||a.cloud_name||'/image/upload/f_auto,q_auto,w_1600,c_limit/v'||a.version||'/'||a.public_id
       else '/api/documents/'||aid end);
     insert into public.media_references(asset_id,content_id,slot) values(aid,target,'draft');
     update public.media_jobs set status='cancelled',last_error=null where asset_id=aid and status in('queued','failed');
   end loop;
   d:=d||jsonb_build_object('asset_urls',urls);
   update public.content_records set draft=d where id=target;
   if operation='publish' then
     select slug,published_at into old_live_slug,stamp from public.content_live where id=target;
     if old_live_slug is not null and old_live_slug<>d->>'slug' then
       insert into public.content_redirects values(old_live_slug,target) on conflict(old_slug) do update set content_id=target;
     end if;
     delete from public.content_redirects where old_slug=d->>'slug' and content_id=target;
     -- Do not publish private Urdu document/image URLs before translation is ready.
     select coalesce(jsonb_agg(distinct x),'[]') into published_files from (
       select d->>'cover_id' x union all select d->>'document_id'
       union all select case when (d->>'ur_ready')::boolean then d->>'document_ur_id' end
       union all select value->>'id' from jsonb_array_elements(coalesce(d->'gallery','[]'))
       union all select value #>> '{}' from jsonb_path_query(d->'body','$.** ? (@.type == "managedImage").attrs.assetId') as j(value)
       union all select value #>> '{}' from jsonb_path_query(case when (d->>'ur_ready')::boolean then d->'body_ur' else '{"type":"doc"}'::jsonb end,'$.** ? (@.type == "managedImage").attrs.assetId') as j(value)
     ) ids where nullif(x,'') is not null;
     select coalesce(jsonb_object_agg(key,value),'{}') into urls from jsonb_each(urls) where published_files ? key;
     d:=d||jsonb_build_object('asset_ids',published_files,'asset_urls',urls);
     if not coalesce((d->>'ur_ready')::boolean,false) then d:=d-'title_ur'-'excerpt_ur'-'body_ur'-'body_text_ur'-'document_ur_id';end if;
     delete from public.content_live where id=target;
     insert into public.content_live(id,slug,title,title_ur,short_description,short_description_ur,is_activity,is_event,publication_kind,event_start,event_end,event_status,published_at,is_featured,feature_order,snapshot)
       values(target,d->>'slug',d->>'title',d->>'title_ur',d->>'excerpt',d->>'excerpt_ur',coalesce((d->>'is_activity')::boolean,false),coalesce((d->>'is_event')::boolean,false),d->>'publication_kind',
         nullif(d->>'event_start','')::timestamptz,nullif(d->>'event_end','')::timestamptz,d->>'event_status',coalesce(stamp,now()),coalesce((d->>'is_featured')::boolean,false),coalesce((d->>'feature_order')::int,0),d);
     delete from public.content_programs where content_id=target and slot='published';
     insert into public.content_programs select content_id,program_id,'published' from public.content_programs where content_id=target and slot='draft';
     delete from public.media_references where content_id=target and slot='published';
     insert into public.media_references(asset_id,content_id,slot) select asset_id,content_id,'published' from public.media_references where content_id=target and slot='draft' and published_files ? asset_id::text;
     update public.content_records set status='published' where id=target;
   end if;
 end if;
 foreach aid in array coalesce(old_assets,'{}'::uuid[]) loop perform cms_private.queue_unused_asset(aid);end loop;
 insert into public.cms_audit_logs(actor_id,action,entity_id,summary) values(auth.uid(),'content.'||operation,target,jsonb_build_object('name',coalesce(d->>'title',current.draft->>'title')));
 return target;
end;
$$;
revoke all on function cms_private.mutate_content(jsonb,int,text) from public,anon;
grant execute on function cms_private.mutate_content(jsonb,int,text) to authenticated;

notify pgrst,'reload schema';
commit;
