-- KIIR public-site refresh: consolidate programs and update editable chrome.
-- Existing tag records follow the renamed categories, so historic content remains visible.

update public.categories set
  slug = 'international-advocacy',
  name = 'International Advocacy',
  name_ur = 'بین الاقوامی وکالت',
  description = 'Evidence-led engagement with international institutions.',
  description_ur = 'بین الاقوامی اداروں کے ساتھ شواہد پر مبنی رابطہ۔',
  sort_order = 4
where slug = 'political-development';

update public.categories set
  slug = 'training',
  name = 'Training',
  name_ur = 'تربیت',
  description = 'Practical learning for communities, journalists and civic leaders.',
  description_ur = 'کمیونٹیز، صحافیوں اور شہری رہنماؤں کے لیے عملی تربیت۔',
  sort_order = 3
where slug = 'media-development';

update public.categories set
  slug = 'climate-action',
  name = 'Climate Action',
  name_ur = 'موسمیاتی اقدام',
  description = 'Community-led climate resilience and preparedness.',
  description_ur = 'کمیونٹی کی قیادت میں موسمیاتی لچک اور تیاری۔',
  sort_order = 2
where slug = 'disaster-risk-reduction';

update public.categories set sort_order = 1 where slug = 'human-rights';
delete from public.categories where slug in ('gender', 'capacity-building-idps', 'conflict-resolution');

update public.site_settings
set value = jsonb_set(
  jsonb_set(value, '{name}', '"KASHMIR INSTITUTE OF INTERNATIONAL RELATIONS"'::jsonb),
  '{tagline}', '"Peace Through Dialogue"'::jsonb
)
where key = 'org';

update public.site_settings
set value = (value - 'youtube') || jsonb_build_object('instagram', coalesce(value->>'instagram', ''))
where key = 'social';
