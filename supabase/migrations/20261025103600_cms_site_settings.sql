begin;
create table if not exists public.site_settings(
 key text primary key check(key in('org','about','contact','social','ticker')),
 value jsonb not null,version int not null default 1,
 updated_by uuid references auth.users(id) on delete set null,updated_at timestamptz not null default now()
);
alter table public.site_settings enable row level security;
revoke all on public.site_settings from public,anon,authenticated;
grant select on public.site_settings to anon,authenticated;
grant all on public.site_settings to service_role;
create policy "public approved settings" on public.site_settings for select to anon,authenticated using(key in('org','about','contact','social','ticker'));
alter table public.media_references add column settings_key text references public.site_settings(key);
alter table public.media_references drop constraint media_reference_owner;
alter table public.media_references add constraint media_reference_owner check(
 num_nonnulls(program_id,content_id,settings_key)=1 and ((content_id is not null and slot is not null) or (content_id is null and slot is null)));
create unique index media_settings_reference on public.media_references(asset_id,settings_key) where settings_key is not null;
create index media_reference_settings on public.media_references(settings_key);
insert into public.site_settings(key,value) values('org',$json${"name": "KASHMIR INSTITUTE OF INTERNATIONAL RELATIONS", "name_ur": "کشمیر انسٹیٹیوٹ آف انٹرنیشنل ریلیشنز", "tagline": "Peace Through Dialogue", "tagline_ur": "مکالمے کے ذریعے امن", "strapline": "Islamabad · Est. 1990 · Research, advocacy & peacebuilding on Kashmir", "strapline_ur": "اسلام آباد · قائم 1990 · کشمیر پر تحقیق، وکالت اور امن سازی", "blurb": "An independent think tank documenting the Kashmir conflict, human rights and pathways to peace.", "blurb_ur": "ایک آزاد تھنک ٹینک جو کشمیر تنازعہ، انسانی حقوق اور امن کے راستوں کو دستاویز کرتا ہے۔", "mission": "We document the human cost of the Kashmir conflict and build the local capacity — political, civic and media — needed for a just and durable peace.", "mission_ur": "ہم کشمیر تنازعہ کی انسانی قیمت کو دستاویز کرتے ہیں اور ایک منصفانہ و پائیدار امن کے لیے درکار مقامی سیاسی، شہری اور میڈیا استعداد تعمیر کرتے ہیں۔", "logo_url": "/logo/kiirlogo.png", "logo_asset_id": null}$json$::jsonb) on conflict(key) do nothing;
insert into public.site_settings(key,value) values('about',$json${"founded": "1990", "history_en": "KIIR was founded in Islamabad in 1990 as an independent research body focused on the Kashmir conflict. Over three decades, its work has grown from published research into direct programming — training, legal aid, dialogue facilitation and international advocacy — carried out with communities on both sides of the Line of Control.", "history_ur": "کے آئی آئی آر 1990 میں اسلام آباد میں کشمیر تنازعہ پر تحقیق کے لیے ایک آزاد ادارے کے طور پر قائم کیا گیا۔ تین دہائیوں کے دوران اس کا کام تحقیق سے بڑھ کر براہ راست پروگرامنگ تک پھیل گیا — تربیت، قانونی امداد، مکالمے کی سہولت کاری اور بین الاقوامی وکالت — جو لائن آف کنٹرول کے دونوں اطراف کی کمیونٹیز کے ساتھ کی جاتی ہے۔", "principles": [{"title_en": "Independence", "title_ur": "آزادی", "body_en": "KIIR does not represent any government, party or armed group. Findings are published regardless of which side they implicate.", "body_ur": "کے آئی آئی آر کسی حکومت، جماعت یا مسلح گروہ کی نمائندگی نہیں کرتا۔ نتائج کسی بھی فریق کے حق میں ہوں، شائع کیے جاتے ہیں۔"}, {"title_en": "Documentation first", "title_ur": "پہلے دستاویز سازی", "body_en": "Advocacy is built on verified, sourced case data — not anecdote — maintained to a standard that can withstand scrutiny by UN mechanisms.", "body_ur": "وکالت مصدقہ اور ماخذ شدہ ڈیٹا پر مبنی ہوتی ہے، سنی سنائی باتوں پر نہیں — ایسا معیار جو اقوام متحدہ کے میکانزم کی جانچ پر پورا اترے۔"}, {"title_en": "Local leadership", "title_ur": "مقامی قیادت", "body_en": "Programs are designed and delivered with local committees, journalists and civic groups, not parachuted in from outside.", "body_ur": "پروگرام مقامی کمیٹیوں، صحافیوں اور شہری گروہوں کے ساتھ مل کر ڈیزائن اور فراہم کیے جاتے ہیں۔"}]}$json$::jsonb) on conflict(key) do nothing;
insert into public.site_settings(key,value) values('contact',$json${"address": "", "phone": "", "email": ""}$json$::jsonb) on conflict(key) do nothing;
insert into public.site_settings(key,value) values('social',$json${"facebook": "", "instagram": "", "x": "", "linkedin": ""}$json$::jsonb) on conflict(key) do nothing;
insert into public.site_settings(key,value) values('ticker',$json$[]$json$::jsonb) on conflict(key) do nothing;

create function cms_private.valid_public_link(link text) returns boolean language sql immutable set search_path='' as $$
 select link is not null and length(link) between 1 and 2000 and link !~ '[[:cntrl:]\\]' and
 (link ~ '^https?://[^/[:space:]]+' or (link ~ '^/[^/]' and link !~* '^/(admin|api)(/|[?#]|$)' and link !~ '%[025][0-9a-fA-F]') or link='/');
$$;
revoke all on function cms_private.valid_public_link(text) from public,anon,authenticated;
create function cms_private.mutate_settings(setting_key text,payload jsonb,expected_version int)
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
    payload:=payload||jsonb_build_object('logo_url',case when payload->>'logo_url'='' then '' when current.value->>'logo_asset_id' is null then current.value->>'logo_url' else '' end);
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
create function public.cms_save_settings(setting_key text,payload jsonb,expected_version int)
returns int language sql security invoker set search_path='' as $$select cms_private.mutate_settings(setting_key,payload,expected_version);$$;
revoke all on function public.cms_save_settings(text,jsonb,int) from public,anon;
grant execute on function public.cms_save_settings(text,jsonb,int) to authenticated;
notify pgrst,'reload schema';
commit;
