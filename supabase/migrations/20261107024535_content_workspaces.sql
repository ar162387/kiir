begin;
do $$
begin
 if exists(select 1 from public.content_records where (draft->>'is_activity')::boolean or ((draft->>'is_event')::boolean and draft->>'publication_kind' is not null))
 or exists(select 1 from public.content_live where is_activity or (is_event and publication_kind is not null)) then
   raise exception 'Review Activity and mixed Event/Publication records before upgrading.';
 end if;
end $$;
alter table public.media_assets add column alt_text text not null default '' check(length(alt_text)<=500);
update public.content_records set draft=draft||'{"presentation":"written"}' where draft->>'publication_kind'='research-papers';
update public.content_live set snapshot=snapshot||'{"presentation":"written"}' where publication_kind='research-papers';

update public.content_live l set snapshot=l.snapshot||jsonb_build_object('cover_width',a.width,'cover_height',a.height,'cover_alt',a.alt_text)
 from public.media_assets a where a.id::text=l.snapshot->>'cover_id' and a.resource_type='image';

create or replace function cms_private.mutate_content(payload jsonb,expected_version int,operation text)
returns uuid language plpgsql security definer set search_path='' as $$
declare
 target uuid:=nullif(payload->>'id','')::uuid; current public.content_records;
 d jsonb:=payload-'id'; old_assets uuid[]; aid uuid; pid uuid; urls jsonb:='{}';
 a public.media_assets; old_live_slug text; stamp timestamptz; attachments jsonb; published_files jsonb; pdf_only boolean; event_item boolean; cover uuid;
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
   event_item:=coalesce((d->>'is_event')::boolean,false);
   pdf_only:=coalesce(d->>'publication_kind'='reports' or (d->>'publication_kind'='research-papers' and d->>'presentation'='pdf'),false);
   if coalesce((d->>'is_activity')::boolean,false) or (event_item and d->>'publication_kind' is not null) then
     raise exception 'Choose one content type.' using errcode='23514';
   end if;
   if event_item then
     d:=(d-'document_id'-'document_ur_id'-'authors'-'abstract'-'keywords'-'references'-'issue'-'epigraph')||'{"excerpt":"","excerpt_ur":""}'::jsonb;
   end if;
   if length(coalesce(d->>'cover_alt',''))>500 then raise exception 'Keep image descriptions within 500 characters.' using errcode='23514';end if;
   if pdf_only then
     d:=d||'{"body":{"type":"doc"},"body_ur":{"type":"doc"},"body_text":"","body_text_ur":"","excerpt":"","excerpt_ur":"","gallery":[]}'::jsonb;
   else d:=d-'pdf_cover_id';end if;
   if nullif(d->>'document_id','') is null then d:=d-'pdf_cover_id';end if;
   cover:=coalesce(nullif(d->>'cover_id',''),nullif(d->>'pdf_cover_id',''))::uuid;
   if d->>'publication_kind' is not null and d->>'publication_kind' not in('opinion-articles','research-papers','short-stories','newsletters','reports') then raise exception 'Invalid publication category.' using errcode='23514';end if;
   if d->>'event_status' not in('scheduled','cancelled','postponed') or d->>'event_zone' not in(select name from pg_catalog.pg_timezone_names) then raise exception 'Invalid event settings.' using errcode='23514';end if;
   if nullif(d->>'event_end','')::timestamptz < nullif(d->>'event_start','')::timestamptz then raise exception 'Event ends before it starts.' using errcode='23514';end if;
   if nullif(d->>'event_end','') is not null and nullif(d->>'event_start','') is null then raise exception 'Add a start date before adding an end date.' using errcode='23514';end if;
   if operation='publish' and (
     (pdf_only and nullif(d->>'document_id','') is null) or
     (not pdf_only and not event_item and (
       (d->>'publication_kind' is distinct from 'opinion-articles' and length(trim(coalesce(d->>'excerpt','')))=0) or
       (coalesce(d->>'body_text','')='' and (nullif(d->>'document_id','') is null or d->>'publication_kind'='research-papers')) or
       (d->>'publication_kind' in('opinion-articles','short-stories','research-papers') and length(trim(coalesce(d->>'authors','')))=0) or
       (d->>'publication_kind'='research-papers' and length(trim(coalesce(d->>'abstract','')))=0) or
       (d->>'publication_kind'='newsletters' and length(trim(coalesce(d->>'issue','')))=0)
     )) or
     (coalesce((d->>'ur_ready')::boolean,false) and (length(trim(coalesce(d->>'title_ur','')))=0 or
       (not event_item and nullif(d->>'document_ur_id','') is null and (pdf_only or coalesce(d->>'body_text_ur','')=''))))
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
     lateral (select d->>'cover_id' as x union all select d->>'pdf_cover_id' union all select d->>'document_id' union all select d->>'document_ur_id'
       union all select value->>'id' from jsonb_array_elements(coalesce(d->'gallery','[]'))
       union all select value #>> '{}' from jsonb_path_query(d->'body','$.** ? (@.type == "managedImage").attrs.assetId') as j(value)
       union all select value #>> '{}' from jsonb_path_query(d->'body_ur','$.** ? (@.type == "managedImage").attrs.assetId') as j(value)) ids
     where nullif(x,'') is not null;
   d:=d||jsonb_build_object('asset_ids',attachments);
   delete from public.media_references where content_id=target and slot='draft';
   for aid in select distinct value::uuid from jsonb_array_elements_text(coalesce(d->'asset_ids','[]')) loop
     select * into a from public.media_assets where id=aid for update;
     if not found or a.status<>'ready' or ((aid::text in(d->>'document_id',d->>'document_ur_id')) and a.resource_type<>'raw') or ((aid::text not in(coalesce(d->>'document_id',''),coalesce(d->>'document_ur_id',''))) and a.resource_type<>'image') then raise exception 'A selected file is not ready.' using errcode='23514';end if;
     if aid=cover then
       d:=d||jsonb_build_object('cover_width',a.width,'cover_height',a.height,'cover_alt',coalesce(nullif(d->>'cover_alt',''),a.alt_text));
     end if;
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
       select cover::text x union all select d->>'document_id'
       union all select case when (d->>'ur_ready')::boolean then d->>'document_ur_id' end
       union all select value->>'id' from jsonb_array_elements(coalesce(d->'gallery','[]'))
       union all select value #>> '{}' from jsonb_path_query(d->'body','$.** ? (@.type == "managedImage").attrs.assetId') as j(value)
       union all select value #>> '{}' from jsonb_path_query(case when (d->>'ur_ready')::boolean then d->'body_ur' else '{"type":"doc"}'::jsonb end,'$.** ? (@.type == "managedImage").attrs.assetId') as j(value)
     ) ids where nullif(x,'') is not null;
     select coalesce(jsonb_object_agg(key,value),'{}') into urls from jsonb_each(urls) where published_files ? key;
     d:=(d-'pdf_cover_id')||jsonb_build_object('cover_id',cover,'asset_ids',published_files,'asset_urls',urls);
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

create or replace view public.content_catalog with(security_invoker=true) as
select l.id,l.slug,l.title,l.title_ur,l.short_description,l.short_description_ur,
 l.is_activity,l.is_event,l.publication_kind,l.event_start,l.event_end,l.event_status,
 l.published_at,l.is_featured,l.feature_order,
 (l.snapshot->>'ur_ready')::boolean ur_ready,l.snapshot->>'event_zone' event_zone,
 l.snapshot->>'cover_id' cover_id,
 case when l.snapshot->>'cover_id' is not null then
   jsonb_build_object(l.snapshot->>'cover_id',l.snapshot->'asset_urls'->(l.snapshot->>'cover_id')) else '{}'::jsonb end asset_urls,
 array(select p.slug from public.content_programs cp join public.programs p on p.id=cp.program_id
   where cp.content_id=l.id and cp.slot='published' and p.is_active order by p.sort_order,p.id) categories,case when l.is_featured then l.feature_order else 0 end feature_rank,
 l.snapshot->>'presentation' presentation, l.snapshot->>'authors' authors,
 l.snapshot->>'cover_alt' cover_alt, (l.snapshot->>'cover_width')::int cover_width, (l.snapshot->>'cover_height')::int cover_height,
 case when l.publication_kind='reports' or (l.publication_kind='research-papers' and l.snapshot->>'presentation'='pdf') then l.snapshot->>'document_id' end document_id,
 case when l.publication_kind='reports' or (l.publication_kind='research-papers' and l.snapshot->>'presentation'='pdf') then l.snapshot->>'document_ur_id' end document_ur_id
from public.content_live l;
revoke all on public.content_catalog from public,anon,authenticated;
grant select on public.content_catalog to anon,authenticated,service_role;

create index content_records_scroll on public.content_records(updated_at desc,id desc);
create function public.cms_content_page(search text, state text, kind text, program uuid, before_time timestamptz, before_id uuid)
returns table(id uuid,title text,status text,kind_label text,author text,date text,image_url text,updated_at timestamptz)
language sql stable security invoker set search_path='' as $$
 select r.id,r.draft->>'title',r.status,
 case when (r.draft->>'is_event')::boolean then 'event' else coalesce(r.draft->>'publication_kind','article') end,
 case when (r.draft->>'is_event')::boolean then null else r.draft->>'authors' end,
 coalesce(r.draft->>'event_start',l.published_at::text,r.updated_at::text),
 coalesce(r.draft->'asset_urls'->>(r.draft->>'cover_id'),r.draft->'asset_urls'->>(r.draft->>'pdf_cover_id'),
   (select r.draft->'asset_urls'->>(entry->>'id')
    from jsonb_array_elements(coalesce(r.draft->'gallery','[]')) entry
    where r.draft->'asset_urls' ? (entry->>'id') limit 1)),r.updated_at
 from public.content_records r left join public.content_live l on l.id=r.id
 where cms_private.has_permission('content.edit')
 and (nullif(search,'') is null or strpos(lower(r.draft->>'title'),lower(search))>0 or strpos(lower(r.draft->>'title_ur'),lower(search))>0)
 and (nullif(state,'') is null or r.status=state)
 and (nullif(kind,'') is null or kind=case when (r.draft->>'is_event')::boolean then 'event' else coalesce(r.draft->>'publication_kind','article') end)
 and (program is null or exists(select 1 from public.content_programs p where p.content_id=r.id and p.slot='draft' and p.program_id=program))
 and (before_time is null or (r.updated_at,r.id)<(before_time,before_id))
 order by r.updated_at desc,r.id desc limit 25;
$$;
revoke all on function public.cms_content_page(text,text,text,uuid,timestamptz,uuid) from public,anon;
grant execute on function public.cms_content_page(text,text,text,uuid,timestamptz,uuid) to authenticated;

alter table public.site_settings drop constraint site_settings_key_check;
alter table public.site_settings add check(key in('org','about','contact','social','ticker','hero_events','hero_publications','hero_about'));
create policy "public page heroes" on public.site_settings for select to anon,authenticated using(key in('hero_events','hero_publications','hero_about'));
insert into public.site_settings(key,value) select key,'{"image_id":null,"url":null,"x":50,"y":50}'::jsonb
from unnest(array['hero_events','hero_publications','hero_about']) key;
create function cms_private.save_page_hero(target text,asset uuid,x int,y int,expected_version int)
returns int language plpgsql security definer set search_path='' as $$
declare current_row public.site_settings; image public.media_assets; old_asset uuid; url text;
begin
 if not cms_private.has_permission('branding.edit') then raise exception 'Admin permission required.' using errcode='42501';end if;
 if target not in('hero_events','hero_publications','hero_about') or x is null or y is null or x not between 0 and 100 or y not between 0 and 100 then
   raise exception 'Choose a valid hero position.' using errcode='23514';
 end if;
 select * into current_row from public.site_settings where key=target for update;
 if current_row.version is distinct from expected_version then raise exception 'This hero changed.' using errcode='PT409';end if;
 if asset is not null then
   select * into image from public.media_assets where id=asset for update;
   if not found or image.resource_type<>'image' or image.status<>'ready' then raise exception 'Choose a ready image.' using errcode='23514';end if;
   url:='https://res.cloudinary.com/'||image.cloud_name||'/image/upload/f_auto,q_auto,w_1600,c_limit/v'||image.version||'/'||image.public_id;
 end if;
 old_asset:=nullif(current_row.value->>'image_id','')::uuid;
 delete from public.media_references where settings_key=target;
 if asset is not null then
   insert into public.media_references(asset_id,settings_key) values(asset,target);
   update public.media_jobs set status='cancelled',last_error=null where asset_id=asset and status in('queued','failed');
 end if;
 update public.site_settings set value=jsonb_build_object('image_id',asset,'url',url,'x',x,'y',y),
   version=version+1,updated_by=auth.uid(),updated_at=now() where key=target returning version into expected_version;
 perform cms_private.queue_unused_asset(old_asset);
 insert into public.cms_audit_logs(actor_id,action,summary) values(auth.uid(),'settings.hero',jsonb_build_object('section',target));
 return expected_version;
end;
$$;
revoke all on function cms_private.save_page_hero(text,uuid,int,int,int) from public,anon;
grant execute on function cms_private.save_page_hero(text,uuid,int,int,int) to authenticated;
create function public.cms_save_page_hero(target text,asset uuid,x int,y int,expected_version int)
returns int language sql security invoker set search_path='' as $$select cms_private.save_page_hero(target,asset,x,y,expected_version)$$;
revoke all on function public.cms_save_page_hero(text,uuid,int,int,int) from public,anon;
grant execute on function public.cms_save_page_hero(text,uuid,int,int,int) to authenticated;

notify pgrst,'reload schema';
commit;
