import {PublicMediaDetail} from '@/components/gallery/PublicMedia';
import {getMediaBySlug} from '@/lib/cms/media-public';
import {pageMetadata} from '@/lib/seo';
export async function generateMetadata({params}:{params:Promise<{slug:string}>}){
 const {slug}=await params;
 const item=await getMediaBySlug('album',slug);
 return item?pageMetadata('/gallery/'+slug,item.title,item.title,item.description):{robots:{index:false,follow:false}};
}
export default async function Page({params}:{params:Promise<{slug:string}>}){
 return <PublicMediaDetail kind="album" slug={(await params).slug}/>;
}
