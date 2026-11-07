import {randomUUID} from 'node:crypto';
import {getStaffSession} from '@/lib/cms/session';
import {hasPermission} from '@/lib/cms/permissions';
import {isSameOriginRequest} from '@/lib/cms/request-origin';
import {cloudinaryConfig,signCloudinary} from '@/lib/cms/cloudinary';
import {createAdminClient} from '@/lib/supabase/admin';

const json=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'private, no-store'}});

export async function POST(request:Request){
 if(!isSameOriginRequest(request))return json({error:'Invalid upload origin.'},403);
 const {member}=await getStaffSession();
 if(!member||member.must_change_password||!hasPermission(member.role,'content.edit'))return json({error:'Staff sign-in required.'},403);
 try{
  const {filename,bytes}=await request.json();
  if(typeof filename!=='string'||filename.length>255||!/\.(mp4|mov)$/i.test(filename)||!Number.isInteger(bytes)||bytes<1||bytes>104857600)return json({error:'Choose an MP4 or MOV video up to 100 MB.'},400);
  const admin=createAdminClient();
  const {data:allowed,error}=await admin.rpc('cms_consume_rate_limit',{bucket:`video:${member.user_id}`,max_attempts:12,window_seconds:3600});
  if(error||!allowed)return json({error:'Video upload limit reached. Try again later.'},429);
  const {prefix,cloud,key}=cloudinaryConfig();
  const id=randomUUID();
  const notification=new URL('/api/media/video/notification',request.url);
  const parameters={
   public_id:prefix+'video/'+id,timestamp:Math.floor(Date.now()/1000),overwrite:false,async:true,
   allowed_formats:'mp4,mov',notification_url:notification.toString(),
   transformation:'a_auto/c_limit,h_720,w_1280,vc_h264,ac_aac,br_1200k/f_mp4'
  };
  const {error:insertError}=await admin.from('media_assets').insert({id,cloud_name:cloud,public_id:parameters.public_id,resource_type:'video',uploaded_by:member.user_id,original_filename:filename});
  if(insertError)throw insertError;
  return json({id,cloud,apiKey:key,parameters,signature:signCloudinary(parameters)});
 }catch{return json({error:'The video upload could not be started. Try again.'},503);}
}
