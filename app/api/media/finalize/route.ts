import { getStaffSession } from '@/lib/cms/session';
import { hasPermission } from '@/lib/cms/permissions';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCloudinaryImage } from '@/lib/cms/cloudinary';
import { imageDeliveryUrl } from '@/lib/cms/program-types';
import { isSameOriginRequest } from '@/lib/cms/request-origin';

const json=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'private, no-store'}});
export async function POST(request:Request) {
  if(!isSameOriginRequest(request)) return json({error:'Invalid upload origin.'},403);
  const {member}=await getStaffSession();
  if(!member||member.must_change_password||!hasPermission(member.role,'program.edit')) return json({error:'Sign in with an active staff account to finish uploading.'},403);
  try {
    if(Number(request.headers.get('content-length')??0)>2048) return json({error:'Invalid image confirmation.'},400);
    const {id,filename}=await request.json();
    if(typeof id!=='string'||!/^[\da-f-]{36}$/i.test(id)||typeof filename!=='string'||filename.length>255) return json({error:'Invalid image confirmation.'},400);
    const admin=createAdminClient();
    const {data:asset}=await admin.from('media_assets').select('*').eq('id',id).eq('uploaded_by',member.user_id).single();
    if(asset?.status==='ready') return json({image:asset,url:imageDeliveryUrl(asset)});
    if(!asset||asset.status!=='pending'||Date.now()-Date.parse(asset.created_at)>60*60*1000) return json({error:'This upload expired. Upload the image again.'},409);
    const {data:allowed,error:limitError}=await admin.rpc('cms_consume_rate_limit',{bucket:`finalize:${member.user_id}`,max_attempts:80,window_seconds:3600});
    if(limitError||!allowed) return json({error:'Too many upload confirmations. Try again later.'},429);
    // Never trust browser-supplied dimensions, format, URL or asset identity.
    const image=await getCloudinaryImage(asset.public_id);
    if(image.public_id!==asset.public_id||image.resource_type!=='image'||image.type!=='upload'
      ||!['jpg','jpeg','png','webp'].includes(image.format)||image.width>2400||image.height>2400
      ||image.width<1||image.height<1||image.bytes>10*1024*1024||!image.asset_id||!Number.isSafeInteger(image.version)) {
      return json({error:'This file could not be accepted as an optimized image.'},400);
    }
    const values={cloudinary_asset_id:image.asset_id,version:image.version,format:image.format,width:image.width,height:image.height,
      bytes:image.bytes,original_filename:filename,finalized_at:new Date().toISOString(),status:'ready'};
    const {data:ready,error}=await admin.from('media_assets').update(values).eq('id',id).eq('status','pending')
      .select('id,public_id,cloud_name,version,original_filename,width,height,bytes').single();
    if(error||!ready) return json({error:'Image confirmation could not be saved. Please retry.'},409);
    return json({image:ready,url:imageDeliveryUrl(ready)});
  } catch { return json({error:'The image could not be verified. Please retry; unsaved uploads are cleaned up automatically.'},503); }
}
