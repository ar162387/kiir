begin;
create table public.media_assets (
  id uuid primary key,
  public_id text not null unique check (public_id like 'kiir-cms/%'),
  cloudinary_asset_id text unique,
  cloud_name text not null,
  resource_type text not null default 'image' check (resource_type='image'),
  delivery_type text not null default 'upload' check (delivery_type='upload'),
  version bigint,
  format text check (format in ('jpg','jpeg','png','webp')),
  width int check (width between 1 and 2400),
  height int check (height between 1 and 2400),
  bytes bigint check (bytes between 1 and 10485760),
  original_filename text not null default '' check (length(original_filename)<=255),
  status text not null default 'pending' check (status in ('pending','ready','deleting','deleted')),
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  finalized_at timestamptz
);
alter table public.media_assets enable row level security;
revoke all on public.media_assets from anon, authenticated;
grant select on public.media_assets to authenticated;
grant all on public.media_assets to service_role;
create policy "staff media registry" on public.media_assets for select to authenticated
  using (cms_private.has_permission('program.edit') and
    (status='ready' or uploaded_by=(select auth.uid()) or cms_private.has_permission('media.delete')));

create table public.programs (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug)<=100),
  name text not null check (length(trim(name)) between 1 and 160),
  name_ur text check (length(name_ur)<=160),
  description text not null check (length(trim(description)) between 1 and 600),
  description_ur text check (length(description_ur)<=600),
  long_description text check (length(long_description)<=6000),
  long_description_ur text check (length(long_description_ur)<=6000),
  image_asset_id uuid references public.media_assets(id),
  image_url text,
  sort_order int not null default 0 check (sort_order between 0 and 9999),
  is_active boolean not null default true,
  version int not null default 1,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.programs enable row level security;
revoke all on public.programs from anon, authenticated;
grant select on public.programs to anon, authenticated;
grant insert, update, delete on public.programs to authenticated;
grant all on public.programs to service_role;
create policy "active programs public" on public.programs for select to anon using (is_active);
create policy "staff program reads" on public.programs for select to authenticated
  using (is_active or cms_private.has_permission('program.edit'));
create policy "staff program inserts" on public.programs for insert to authenticated
  with check (cms_private.has_permission('program.edit'));
create policy "staff program updates" on public.programs for update to authenticated
  using (cms_private.has_permission('program.edit')) with check (cms_private.has_permission('program.edit'));
create policy "admin program deletes" on public.programs for delete to authenticated
  using (cms_private.has_permission('program.delete'));
create index programs_display on public.programs(is_active,sort_order,id);

create table public.program_redirects (
  old_slug text primary key,
  program_id uuid not null references public.programs(id) on delete cascade
);
alter table public.program_redirects enable row level security;
revoke all on public.program_redirects from anon,authenticated;
grant select on public.program_redirects to anon,authenticated;
grant all on public.program_redirects to service_role;
create policy "public program aliases" on public.program_redirects for select to anon,authenticated
  using (exists(select 1 from public.programs p where p.id=program_id and p.is_active));

create table public.media_references (
  asset_id uuid not null references public.media_assets(id),
  program_id uuid not null unique references public.programs(id) on delete cascade,
  primary key(asset_id,program_id)
);
alter table public.media_references enable row level security;
revoke all on public.media_references from anon,authenticated;
grant select on public.media_references to authenticated;
grant all on public.media_references to service_role;
create policy "staff see media usage" on public.media_references for select to authenticated
  using(cms_private.has_permission('program.edit'));

create table public.media_jobs (
  id bigint generated always as identity primary key,
  asset_id uuid not null unique references public.media_assets(id),
  status text not null default 'queued' check(status in('queued','processing','failed','complete','cancelled')),
  attempts int not null default 0,
  not_before timestamptz not null default now()+interval '1 minute',
  request_id bigint,
  started_at timestamptz,
  last_error text,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.media_jobs enable row level security;
revoke all on public.media_jobs from anon,authenticated;
grant select on public.media_jobs to authenticated;
grant all on public.media_jobs to service_role;
grant usage,select on sequence public.media_jobs_id_seq to service_role;
create policy "admins see cleanup jobs" on public.media_jobs for select to authenticated
  using(cms_private.has_permission('media.delete'));
create index media_jobs_due on public.media_jobs(status,not_before);

create function cms_private.queue_unused_asset(asset uuid)
returns void language plpgsql security definer set search_path='' as $$
begin
  if asset is null then return; end if;
  perform 1 from public.media_assets where id=asset for update;
  if exists(select 1 from public.media_references where asset_id=asset) then return; end if;
  insert into public.media_jobs(asset_id) select asset where exists(
    select 1 from public.media_assets where id=asset and status in('ready','pending'))
  on conflict(asset_id) do update set status='queued',not_before=now()+interval '1 minute',
    last_error=null,request_id=null,started_at=null
  where public.media_jobs.status in('cancelled','failed');
end;
$$;
revoke all on function cms_private.queue_unused_asset(uuid) from public,anon,authenticated;

-- Internal triggers own derived image URLs, versioning, aliases, references,
-- auditing and cleanup. Direct API writes cannot bypass these invariants.
create function cms_private.prepare_program()
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
    if not found or asset.status<>'ready' then raise exception 'Select a ready image before saving.' using errcode='23514'; end if;
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
create trigger prepare_program before insert or update or delete on public.programs
  for each row execute function cms_private.prepare_program();

create function cms_private.finish_program()
returns trigger language plpgsql security definer set search_path='' as $$
declare old_asset uuid; item_id uuid; item_name text; item_slug text;
begin
  if tg_op<>'INSERT' then old_asset:=old.image_asset_id;end if;
  if tg_op='DELETE' then item_id:=old.id;item_name:=old.name;item_slug:=old.slug;
  else item_id:=new.id;item_name:=new.name;item_slug:=new.slug;end if;
  delete from public.media_references where program_id=item_id;
  if tg_op<>'DELETE' and new.image_asset_id is not null then
    insert into public.media_references(asset_id,program_id) values(new.image_asset_id,new.id);
    update public.media_jobs set status='cancelled',last_error=null
      where asset_id=new.image_asset_id and status in('queued','failed');
  end if;
  if tg_op='UPDATE' and old.slug<>new.slug then
    delete from public.program_redirects where old_slug=new.slug and program_id=new.id;
    insert into public.program_redirects(old_slug,program_id) values(old.slug,new.id)
      on conflict(old_slug) do update set program_id=excluded.program_id;
  end if;
  perform cms_private.queue_unused_asset(old_asset);
  insert into public.cms_audit_logs(actor_id,action,entity_id,summary)
    values(auth.uid(),'program.'||lower(tg_op),item_id,jsonb_build_object('name',item_name,'slug',item_slug));
  if tg_op='DELETE' then return old;end if;return new;
end;
$$;
revoke all on function cms_private.finish_program() from public,anon,authenticated;
create trigger finish_program after insert or update or delete on public.programs
  for each row execute function cms_private.finish_program();

create function public.cms_save_program(payload jsonb, expected_version int default null)
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
    if changed is null then raise exception 'This program changed since you opened it. Reload before saving.' using errcode='40001';end if;
  end if;
  return changed;
end;
$$;
revoke all on function public.cms_save_program(jsonb,int) from public,anon;
grant execute on function public.cms_save_program(jsonb,int) to authenticated;

create function public.cms_delete_program(target uuid, expected_version int)
returns void language plpgsql security invoker set search_path='' as $$
begin
  if not cms_private.has_permission('program.delete') then raise exception 'Admin permission required.' using errcode='42501';end if;
  delete from public.programs where id=target and version=expected_version;
  if not found then raise exception 'This program changed. Reload before deleting.' using errcode='40001';end if;
end;
$$;
revoke all on function public.cms_delete_program(uuid,int) from public,anon;
grant execute on function public.cms_delete_program(uuid,int) to authenticated;

-- Initial records are data, not an application whitelist. No automatic reseeding.
insert into public.programs(slug,name,name_ur,description,description_ur,long_description,long_description_ur,sort_order) values
 ('human-rights','Human Rights','انسانی حقوق','Monitoring, documentation and support for rights and dignity.','حقوق اور وقار کی نگرانی، دستاویز سازی اور معاونت۔','Monitoring, documentation and support for rights and dignity.','حقوق اور وقار کی نگرانی، دستاویز سازی اور معاونت۔',1),
 ('climate-action','Climate Action','موسمیاتی اقدام','Community-led climate resilience and preparedness.','کمیونٹی کی قیادت میں موسمیاتی لچک اور تیاری۔','Community-led climate resilience and preparedness.','کمیونٹی کی قیادت میں موسمیاتی لچک اور تیاری۔',2),
 ('training','Training','تربیت','Practical learning for communities, journalists and civic leaders.','کمیونٹیز، صحافیوں اور شہری رہنماؤں کے لیے عملی تربیت۔','Practical learning for communities, journalists and civic leaders.','کمیونٹیز، صحافیوں اور شہری رہنماؤں کے لیے عملی تربیت۔',3),
 ('international-advocacy','International Advocacy','بین الاقوامی وکالت','Evidence-led engagement with international institutions.','بین الاقوامی اداروں کے ساتھ شواہد پر مبنی رابطہ۔','Evidence-led engagement with international institutions.','بین الاقوامی اداروں کے ساتھ شواہد پر مبنی رابطہ۔',4);

-- Preserve current design assets while uploads migrate to managed Cloudinary assets.
-- Internal trigger prevents users changing URL fields; seed these through a trusted one-time bypass.
alter table public.programs disable trigger prepare_program;
update public.programs set image_url=case slug
  when 'human-rights' then '/photos/3_1624014649.jpg'
  when 'climate-action' then '/photos/5_1623823336.jpg'
  when 'training' then '/photos/4_1623823333.jpg'
  when 'international-advocacy' then '/photos/3_1623823321.jpg' end;
alter table public.programs enable trigger prepare_program;
notify pgrst,'reload schema';
commit;
