import {createHash,timingSafeEqual} from 'node:crypto';
import {cloudinaryConfig} from '@/lib/cms/cloudinary';
import {finishVideo,managedVideoId} from '@/lib/cms/video';
import {validUUID} from '@/lib/cms/content-types';

export async function POST(request:Request){
 const stamp=request.headers.get('x-cld-timestamp')??'';
 const signature=request.headers.get('x-cld-signature')??'';
 if(!/^\d{10}$/.test(stamp)||Math.abs(Date.now()/1000-Number(stamp))>7200||!/^[\da-f]{64}$/i.test(signature)&&!/^[\da-f]{40}$/i.test(signature))return new Response(null,{status:403});
 const raw=await request.text();
 if(raw.length>65536)return new Response(null,{status:413});
 const {secret}=cloudinaryConfig();
 const expected=createHash(signature.length===64?'sha256':'sha1').update(raw+stamp+secret).digest();
 if(!timingSafeEqual(Buffer.from(signature,'hex'),expected))return new Response(null,{status:403});
 const event=JSON.parse(raw);
 const id=typeof event.public_id==='string'?managedVideoId(event.public_id):null;
 if(id&&validUUID(id)&&event.resource_type==='video'){
  try{await finishVideo(id);}catch{return new Response(null,{status:503});}
 }
 return new Response(null,{status:204});
}
