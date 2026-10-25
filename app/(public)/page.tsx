import {pageMetadata,siteOrigin} from '@/lib/seo';
import JsonLd from '@/components/JsonLd';
import HomeClient from "@/components/home/HomeClient";
import { getOrgSettings,getContactSettings,getSocialSettings,getFeaturedItems, getFeed, getProgramCounts, getPrograms, getPublications, getUpcomingEvents } from "@/lib/queries";

export async function generateMetadata(){const org=await getOrgSettings();return pageMetadata('/',org.name,org.name_ur||org.name,org.blurb,org.blurb_ur);}

export default async function HomePage() {
  const [featured, feedResult, programs, upcoming, publications, counts,org,contact,social] = await Promise.all([
    getFeaturedItems(5),
    getFeed({ limit: 60 }),
    getPrograms(),
    getUpcomingEvents(3),
    getPublications(4),
    getProgramCounts(),getOrgSettings(),getContactSettings(),getSocialSettings(),
  ]);

  return (
    <><JsonLd value={{'@context':'https://schema.org','@type':'Organization',name:org.name,url:siteOrigin(),...(org.logo_url?{logo:new URL(org.logo_url,siteOrigin()).toString()}:{}),...(contact.email?{email:contact.email}:{}),...(contact.phone?{telephone:contact.phone}:{}),...(contact.address?{address:contact.address}:{}),sameAs:Object.values(social).filter(Boolean)}}/><HomeClient
      featured={featured}
      feed={feedResult.items}
      programs={programs}
      upcoming={upcoming}
      publications={publications}
      counts={counts}
    /></>
  );
}
