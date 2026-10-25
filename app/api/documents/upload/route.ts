import {randomUUID} from 'node:crypto';
import {getStaffSession} from '@/lib/cms/session';
import {createAdminClient} from '@/lib/supabase/admin';
import {cloudinaryConfig,signCloudinary} from '@/lib/cms/cloudinary';
import {isSameOriginRequest} from '@/lib/cms/request-origin';
const json=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'private, no-store'}});
// Sign a direct raw upload; file bytes never cross Vercel's request-body limit.
export async function POST(request:Request){
 if(!isSameOriginRequest(request))return json({error:'Invalid upload origin.'},403);
 const{member}=await getStaffSession();if(!member||member.must_change_password)return json({error:'Staff sign-in required.'},403);
 if(Number(request.headers.get('content-length')??0)>2048)return json({error:'Invalid upload request.'},400);
 try{
 const{filename}=await request.json();if(typeof filename!=='string'||filename.length>255||!filename.toLowerCase().endsWith('.pdf'))return json({error:'Choose a PDF file.'},400);
 const admin=createAdminClient();const{data:allowed,error:rateError}=await admin.rpc('cms_consume_rate_limit',{bucket:`pdf:${member.user_id}`,max_attempts:20,window_seconds:3600});if(rateError||!allowed)return json({error:'PDF upload limit reached. Try later.'},429);
 const config=cloudinaryConfig(),id=randomUUID(),parameters={public_id:config.prefix+id+'.pdf',timestamp:Math.floor(Date.now()/1000),overwrite:false};
 const{error}=await admin.from('media_assets').insert({id,public_id:parameters.public_id,cloud_name:config.cloud,resource_type:'raw',uploaded_by:member.user_id});if(error)throw Error();
 return json({id,cloud:config.cloud,apiKey:config.key,parameters,signature:signCloudinary(parameters)});
 }catch{return json({error:'The PDF upload could not be prepared. Please try again.'},503);}
}
