import type {MetadataRoute} from 'next';
import {getPrograms} from '@/lib/queries';
import {getSupabase} from '@/lib/supabase/server';
import {absoluteUrl} from '@/lib/seo';
export const dynamic='force-dynamic';
export default async function sitemap():Promise<MetadataRoute.Sitemap>{
 const paths=['/','/about','/events','/gallery','/documentaries','/publications','/contact','/privacy','/terms',...['opinion-articles','research-papers','short-stories','newsletters','reports'].map(kind=>'/publications?kind='+kind),...(await getPrograms()).map(p=>'/programs/'+p.slug)];
 const entries:MetadataRoute.Sitemap=paths.flatMap(p=>[{url:absoluteUrl(p),alternates:{languages:{en:absoluteUrl(p),ur:absoluteUrl('/ur'+(p==='/'?'':p))}}},{url:absoluteUrl('/ur'+(p==='/'?'':p)),alternates:{languages:{en:absoluteUrl(p),ur:absoluteUrl('/ur'+(p==='/'?'':p))}}}]);
 const client=getSupabase();if(!client)return entries;
 // Bounded projections and pages; no editor bodies are fetched for discovery.
 for(let offset=0;;offset+=500){
  const {data,error}=await client.from('media_entries_live').select('kind,slug,published_at').in('kind',['album','documentary']).order('id').range(offset,offset+499);
  if(error)throw Error('The media sitemap is temporarily unavailable.');
  for(const row of data){
   const path=(row.kind==='album'?'/gallery/':'/documentaries/')+row.slug;
   const languages={en:absoluteUrl(path),ur:absoluteUrl('/ur'+path)};
   for(const url of Object.values(languages))entries.push({url,lastModified:row.published_at,alternates:{languages}});
  }
  if(data.length<500)break;
 }
 for(let offset=0;offset<24000;offset+=500){const{data,error}=await client.from('content_catalog').select('slug,published_at,ur_ready').is('document_id',null).order('id').range(offset,offset+499);if(error)throw Error('The sitemap is temporarily unavailable.');for(const row of data){const en=absoluteUrl('/articles/'+row.slug),ur=absoluteUrl('/ur/articles/'+row.slug),languages={en,...(row.ur_ready?{ur}:{})};entries.push({url:en,lastModified:row.published_at,alternates:{languages}});if(row.ur_ready)entries.push({url:ur,lastModified:row.published_at,alternates:{languages}});}if(data.length<500)return entries;}
 throw Error('Split the sitemap before publishing more than 24,000 articles.');
}
