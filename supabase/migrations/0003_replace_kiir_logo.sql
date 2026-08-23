-- Use the refreshed KIIR logo throughout the shared site header and footer.
update public.site_settings
set value = jsonb_set(value, '{logo_url}', '"/logo/kiirlogo.png"'::jsonb)
where key = 'org';
