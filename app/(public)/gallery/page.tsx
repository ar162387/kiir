import {PublicMediaIndex} from '@/components/gallery/PublicMedia';
import {pageMetadata} from '@/lib/seo';
import {paginatedPath} from '@/lib/seo-content';
export async function generateMetadata({searchParams}:{searchParams:Promise<{page?:string}>}){
 return pageMetadata(paginatedPath('/gallery',(await searchParams).page),'Photo Gallery','تصویری گیلری','Explore published media from KIIR.');
}
export default async function Page({searchParams}:{searchParams:Promise<{page?:string}>}){
 return <PublicMediaIndex kind="album" pageParam={(await searchParams).page}/>;
}
