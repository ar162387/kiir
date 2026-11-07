import {getGalleryPhotos} from '@/lib/cms/media-public';
import {validUUID} from '@/lib/cms/content-types';

export async function GET(request:Request){
 const params=new URL(request.url).searchParams;
 const pivot=params.get('pivot')??'';
 const cursor=params.get('cursor')??'';
 const [after,wrapped]=cursor.split(':');
 if(!validUUID(pivot)||!validUUID(after)||!['0','1'].includes(wrapped))return new Response(null,{status:400});
 try{return Response.json(await getGalleryPhotos(pivot,cursor),{headers:{'Cache-Control':'no-store'}});}
 catch{return new Response(null,{status:503});}
}
