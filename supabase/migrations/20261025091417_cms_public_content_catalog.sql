begin;
-- Body-free listing projection. Invoker security applies RLS on every source.
create or replace view public.content_catalog with(security_invoker=true) as
select l.id,l.slug,l.title,l.title_ur,l.short_description,l.short_description_ur,
 l.is_activity,l.is_event,l.publication_kind,l.event_start,l.event_end,l.event_status,
 l.published_at,l.is_featured,l.feature_order,
 (l.snapshot->>'ur_ready')::boolean ur_ready,l.snapshot->>'event_zone' event_zone,
 l.snapshot->>'cover_id' cover_id,
 case when l.snapshot->>'cover_id' is not null then
   jsonb_build_object(l.snapshot->>'cover_id',l.snapshot->'asset_urls'->(l.snapshot->>'cover_id')) else '{}'::jsonb end asset_urls,
 array(select p.slug from public.content_programs cp join public.programs p on p.id=cp.program_id
   where cp.content_id=l.id and cp.slot='published' and p.is_active order by p.sort_order,p.id) categories,case when l.is_featured then l.feature_order else 0 end feature_rank
from public.content_live l;
revoke all on public.content_catalog from public,anon,authenticated;
grant select on public.content_catalog to anon,authenticated,service_role;
notify pgrst,'reload schema';
commit;
