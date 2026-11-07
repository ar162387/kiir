import {PublicMediaIndex} from '@/components/gallery/PublicMedia';
import {pageMetadata} from '@/lib/seo';
import {paginatedPath} from '@/lib/seo-content';
export async function generateMetadata({searchParams}:{searchParams:Promise<{page?:string}>}){
 return pageMetadata(paginatedPath('/documentaries',(await searchParams).page),'Documentaries','دستاویزی فلمیں','Explore published media from KIIR.');
}
export default async function Page({searchParams}:{searchParams:Promise<{page?:string}>}){
 return <PublicMediaIndex kind="documentary" pageParam={(await searchParams).page}/>;
}
