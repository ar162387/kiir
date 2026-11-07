-- Run after the application migrations in an isolated rehearsal database.
begin;
alter table auth.users disable trigger cms_staff_only_accounts;
insert into auth.users(id,email,raw_app_meta_data) values('10000000-0000-0000-0000-000000000001','fixture@example.test','{}');
alter table auth.users enable trigger cms_staff_only_accounts;
insert into public.cms_memberships(user_id,email,display_name,role,must_change_password)
values('10000000-0000-0000-0000-000000000001','fixture@example.test','Fixture','admin',false);
insert into public.media_assets(id,public_id,cloud_name,resource_type,version,format,width,height,bytes,status)
values
 ('10000000-0000-0000-0000-000000000010','kiir-cms/fixture/file.pdf','fixture','raw',1,'pdf',null,null,1000,'ready'),
 ('10000000-0000-0000-0000-000000000011','kiir-cms/fixture/photo1','fixture','image',1,'jpg',500,800,1000,'ready'),
 ('10000000-0000-0000-0000-000000000012','kiir-cms/fixture/photo2','fixture','image',1,'jpg',800,500,1000,'ready'),
 ('10000000-0000-0000-0000-000000000013','kiir-cms/fixture/video','fixture','video',1,'mp4',1280,720,1000,'ready');
insert into public.content_records(slug,draft)
select 'cursor-'||n,jsonb_build_object('title','Cursor fixture '||n) from generate_series(1,30) n;
set local role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000001',true);
do $$
declare event_id uuid; report_id uuid; album_id uuid; documentary_id uuid; selected uuid;
 cursor_at timestamptz; cursor_id uuid;
begin
 event_id:=public.cms_save_content('{"title":"Fixture event","slug":"fixture-event","is_event":true,"event_zone":"Asia/Karachi","event_status":"scheduled"}',null,'publish');
 report_id:=public.cms_save_content('{"title":"Fixture report","slug":"fixture-report","publication_kind":"reports","document_id":"10000000-0000-0000-0000-000000000010","pdf_cover_id":"10000000-0000-0000-0000-000000000011","event_zone":"Asia/Karachi","event_status":"scheduled"}',null,'publish');
 if not exists(select 1 from public.content_catalog where id=report_id and document_id is not null and cover_height=800) then raise exception 'Report catalog projection failed';end if;
 if not exists(select 1 from public.content_catalog where id=event_id and is_event and event_start is null) then raise exception 'Undated event failed';end if;
 select id into selected from public.cms_content_page('Fixture report','published','reports',null,null,null);
 if selected is distinct from report_id then raise exception 'Content filters failed';end if;
 select updated_at,id into cursor_at,cursor_id from public.cms_content_page('Cursor fixture','draft','article',null,null,null) offset 23 limit 1;
 if (select count(*) from public.cms_content_page('Cursor fixture','draft','article',null,cursor_at,cursor_id))<>6 then
  raise exception 'Content cursor did not advance across equal timestamps';
 end if;
 album_id:=public.cms_save_media_entry(null,'album','{"title":"Fixture album","slug":"fixture-album","asset_ids":["10000000-0000-0000-0000-000000000011","10000000-0000-0000-0000-000000000012"]}',null,'publish');
 perform public.cms_save_media_entry(null,'photo','{"slug":"fixture-photo","asset_ids":["10000000-0000-0000-0000-000000000011"]}',null,'publish');
 if (select count(*) from public.gallery_photos)<>2 then raise exception 'Gallery photo deduplication failed';end if;
 documentary_id:=public.cms_save_media_entry(null,'documentary','{"title":"Fixture documentary","description":"Published description","slug":"fixture-documentary","asset_ids":["10000000-0000-0000-0000-000000000013"]}',null,'publish');
 perform public.cms_save_media_entry(documentary_id,'documentary','{"title":"New title","description":"Draft description","asset_ids":[]}',1,'draft');
 if not exists(select 1 from public.media_entries_live where id=documentary_id and description='Published description') then raise exception 'Draft changed published snapshot';end if;
 if exists(select 1 from public.media_jobs where asset_id='10000000-0000-0000-0000-000000000013') then raise exception 'Published video queued early';end if;
 begin
  perform public.cms_save_media_entry(documentary_id,'documentary','{}',1,'delete');
  raise exception 'Stale delete was accepted';
 exception when sqlstate 'PT409' then null;
 end;
 perform public.cms_save_media_entry(documentary_id,'documentary','{}',2,'delete');
 if not exists(select 1 from public.media_jobs where asset_id='10000000-0000-0000-0000-000000000013' and status='queued') then raise exception 'Video cleanup was not queued';end if;
 perform public.cms_save_media_entry(album_id,'album','{}',1,'delete');
 if exists(select 1 from public.media_jobs where asset_id='10000000-0000-0000-0000-000000000011') then raise exception 'Shared image queued for cleanup';end if;
 if public.cms_save_page_hero('hero_events','10000000-0000-0000-0000-000000000012',35,70,1)<>2 then raise exception 'Hero version failed';end if;
end $$;
reset role;
set local role anon;
do $$
begin
 if not exists(select 1 from public.content_catalog where slug='fixture-report' and document_id is not null) then raise exception 'Public report missing';end if;
 if not exists(select 1 from public.site_settings where key='hero_events' and value->>'x'='35') then raise exception 'Public hero missing';end if;
 if has_table_privilege('public.media_entries','SELECT') then raise exception 'Draft table exposed';end if;
end $$;
rollback;
