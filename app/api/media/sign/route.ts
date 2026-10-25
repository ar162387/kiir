import { randomUUID } from 'node:crypto';
import { getStaffSession } from '@/lib/cms/session';
import { hasPermission } from '@/lib/cms/permissions';
import { createAdminClient } from '@/lib/supabase/admin';
import { cloudinaryConfig, IMAGE_PRESET, signCloudinary } from '@/lib/cms/cloudinary';
import { isSameOriginRequest } from '@/lib/cms/request-origin';

const json=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'private, no-store'}});
export async function POST(request:Request) {
  if(!isSameOriginRequest(request)) return json({error:'Invalid upload origin.'},403);
  const {member}=await getStaffSession();
  if(!member||member.must_change_password||!hasPermission(member.role,'program.edit')) return json({error:'Sign in with an active staff account to upload.'},403);
  try {
    const admin=createAdminClient();
    const {data:allowed,error:limitError}=await admin.rpc('cms_consume_rate_limit',{bucket:`upload:${member.user_id}`,max_attempts:40,window_seconds:3600});
    if(limitError||!allowed) return json({error:'The upload limit has been reached. Please try again later.'},429);
    const config=cloudinaryConfig();
    const id=randomUUID();
    const parameters={public_id:config.prefix+id,timestamp:Math.floor(Date.now()/1000),upload_preset:IMAGE_PRESET,overwrite:false};
    const {error}=await admin.from('media_assets').insert({id,public_id:parameters.public_id,cloud_name:config.cloud,uploaded_by:member.user_id});
    if(error) return json({error:'The upload could not be prepared. Please try again.'},503);
    return json({id,cloud:config.cloud,apiKey:config.key,parameters,signature:signCloudinary(parameters)});
  } catch { return json({error:'Image uploads are temporarily unavailable. Please try again.'},503); }
}
