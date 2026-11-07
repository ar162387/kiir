import 'server-only';

import {createAdminClient} from '@/lib/supabase/admin';
import {cloudinaryConfig,getCloudinaryAsset} from './cloudinary';

export async function finishVideo(id:string){
 const admin=createAdminClient();
 const {data:asset}=await admin.from('media_assets').select('*').eq('id',id).eq('resource_type','video').maybeSingle();
 if(!asset||!['ready','pending'].includes(asset.status))return null;
 if(asset.status==='ready')return asset;
 const video=await getCloudinaryAsset(asset.public_id,'video');
 if(video.public_id!==asset.public_id||video.resource_type!=='video'||video.type!=='upload'
  ||video.format!=='mp4'||!Number.isInteger(video.width)||!Number.isInteger(video.height)
  ||Math.max(video.width,video.height)>1280||Math.min(video.width,video.height)>720
  ||video.bytes<1||video.bytes>104857600||!video.asset_id||!Number.isSafeInteger(video.version)||!Number.isFinite(video.duration)||video.duration<=0)throw Error('The video has not finished processing.');
 const {data,error}=await admin.from('media_assets').update({
  status:'ready',cloudinary_asset_id:video.asset_id,version:video.version,format:'mp4',
  width:video.width,height:video.height,bytes:video.bytes,finalized_at:new Date().toISOString()
 }).eq('id',id).eq('status','pending').select('*').maybeSingle();
 if(error)throw error;
 return data;
}

export function videoUrl(asset:{cloud_name:string;version:number;public_id:string}){
 return `https://res.cloudinary.com/${asset.cloud_name}/video/upload/v${asset.version}/${asset.public_id}.mp4`;
}

export function managedVideoId(publicId:string){
 const {prefix}=cloudinaryConfig();
 if(!publicId.startsWith(prefix+'video/'))return null;
 return publicId.slice((prefix+'video/').length);
}
