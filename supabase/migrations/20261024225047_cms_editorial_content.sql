begin;
-- Private current working copy, separate from the public snapshot. No draft columns
-- share a publicly readable row. Mutations are atomic and centrally authorized.
create table public.content_records (
 id uuid primary key default gen_random_uuid(), slug text not null unique,
 draft jsonb not null default '{}', version int not null default 1,
 status text not null default 'draft' check(status in('draft','published','archived')),
 created_by uuid references auth.users(id) on delete set null,
 updated_by uuid references auth.users(id) on delete set null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check(slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug)<=100)
);
create table public.content_live (
 id uuid primary key references public.content_records(id) on delete cascade,
 slug text not null unique, title text not null, title_ur text,
 short_description text,short_description_ur text,
 is_activity boolean not null,is_event boolean not null,publication_kind text,
 event_start timestamptz,event_end timestamptz,event_status text,
 published_at timestamptz not null, is_featured boolean not null default false,
 feature_order int not null default 0, snapshot jsonb not null
);
create table public.content_programs (
 content_id uuid not null references public.content_records(id) on delete cascade,
 program_id uuid not null references public.programs(id) on delete cascade,
 slot text not null check(slot in('draft','published')),
 primary key(content_id,program_id,slot)
);
create table public.content_redirects (
 old_slug text primary key,content_id uuid not null references public.content_records(id) on delete cascade
);
alter table public.content_records enable row level security;
alter table public.content_live enable row level security;
alter table public.content_programs enable row level security;
alter table public.content_redirects enable row level security;
revoke all on public.content_records,public.content_live,public.content_programs,public.content_redirects from public,anon,authenticated;
grant all on public.content_records,public.content_live,public.content_programs,public.content_redirects to service_role;
grant select on public.content_records to authenticated;
grant select on public.content_live,public.content_programs,public.content_redirects to anon,authenticated;
create policy "staff working copies" on public.content_records for select to authenticated using(cms_private.has_permission('content.edit'));
create policy "public snapshots only" on public.content_live for select to anon,authenticated using(true);
create policy "published program associations" on public.content_programs for select to anon,authenticated
 using((slot='published' and exists(select 1 from public.content_live l where l.id=content_id)) or
 (select auth.uid()) is not null and cms_private.has_permission('content.edit'));
-- anon cannot execute the permission helper; use a separate staff policy.
drop policy "published program associations" on public.content_programs;
create policy "public content program links" on public.content_programs for select to anon,authenticated
 using(slot='published' and exists(select 1 from public.content_live l where l.id=content_id));
create policy "staff content program links" on public.content_programs for select to authenticated using(cms_private.has_permission('content.edit'));
create policy "published content aliases" on public.content_redirects for select to anon,authenticated
 using(exists(select 1 from public.content_live l where l.id=content_id));
create index content_live_recent on public.content_live(published_at desc,id);
create index content_live_events on public.content_live(event_start) where is_event;
create index content_live_publications on public.content_live(publication_kind,published_at desc) where publication_kind is not null;
create index content_programs_reverse on public.content_programs(program_id,slot,content_id);
create index content_records_updated on public.content_records(updated_at desc,id);

-- Extend the single reference registry: current draft AND current published
-- snapshots retain their assets. No old snapshot retains a file indefinitely.
alter table public.media_references drop constraint media_references_pkey;
alter table public.media_references alter column program_id drop not null;
alter table public.media_references add column id bigint generated always as identity primary key;
alter table public.media_references add column content_id uuid references public.content_records(id) on delete cascade;
alter table public.media_references add column slot text check(slot in('draft','published'));
alter table public.media_references add constraint media_reference_owner check(
 (program_id is not null and content_id is null and slot is null) or
 (program_id is null and content_id is not null and slot is not null));
create unique index media_content_reference on public.media_references(asset_id,content_id,slot) where content_id is not null;
create index media_reference_content on public.media_references(content_id);
create index media_reference_asset on public.media_references(asset_id);
grant usage,select on sequence public.media_references_id_seq to service_role;

create function cms_private.mutate_content(payload jsonb,expected_version int,operation text)
returns uuid language plpgsql security definer set search_path='' as $$
declare
 target uuid:=nullif(payload->>'id','')::uuid; current public.content_records;
 d jsonb:=payload-'id'; old_assets uuid[]; aid uuid; pid uuid; urls jsonb:='{}';
 a public.media_assets; old_live_slug text; stamp timestamptz;
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
   delete from public.media_references where content_id=target and slot='draft';
   for aid in select distinct value::uuid from jsonb_array_elements_text(coalesce(d->'asset_ids','[]')) loop
     select * into a from public.media_assets where id=aid for update;
     if not found or a.status<>'ready' then raise exception 'A selected file is not ready.' using errcode='23514';end if;
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
     if not coalesce((d->>'ur_ready')::boolean,false) then d:=d-'title_ur'-'excerpt_ur'-'body_ur'-'body_text_ur'-'document_ur_id';end if;
     delete from public.content_live where id=target;
     insert into public.content_live(id,slug,title,title_ur,short_description,short_description_ur,is_activity,is_event,publication_kind,event_start,event_end,event_status,published_at,is_featured,feature_order,snapshot)
       values(target,d->>'slug',d->>'title',d->>'title_ur',d->>'excerpt',d->>'excerpt_ur',coalesce((d->>'is_activity')::boolean,false),coalesce((d->>'is_event')::boolean,false),d->>'publication_kind',
         nullif(d->>'event_start','')::timestamptz,nullif(d->>'event_end','')::timestamptz,d->>'event_status',coalesce(stamp,now()),coalesce((d->>'is_featured')::boolean,false),coalesce((d->>'feature_order')::int,0),d);
     delete from public.content_programs where content_id=target and slot='published';
     insert into public.content_programs select content_id,program_id,'published' from public.content_programs where content_id=target and slot='draft';
     delete from public.media_references where content_id=target and slot='published';
     insert into public.media_references(asset_id,content_id,slot) select asset_id,content_id,'published' from public.media_references where content_id=target and slot='draft';
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
create function public.cms_save_content(payload jsonb,expected_version int default null,operation text default 'draft')
returns uuid language sql security invoker set search_path='' as $$ select cms_private.mutate_content(payload,expected_version,operation); $$;
revoke all on function public.cms_save_content(jsonb,int,text) from public,anon;
grant execute on function public.cms_save_content(jsonb,int,text) to authenticated;
notify pgrst,'reload schema';
commit;
