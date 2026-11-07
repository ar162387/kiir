import {getStaffSession} from '@/lib/cms/session';
import {isSameOriginRequest} from '@/lib/cms/request-origin';
import {createAdminClient} from '@/lib/supabase/admin';
import {validUUID} from '@/lib/cms/content-types';
import {finishVideo,videoUrl} from '@/lib/cms/video';

const json=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'private, no-store'}});

export async function POST(request:Request){
 if(!isSameOriginRequest(request))return json({error:'Invalid request origin.'},403);
 const {member}=await getStaffSession();
 if(!member||member.must_change_password)return json({error:'Staff sign-in required.'},403);
 const id=(await request.json().catch(()=>null))?.id;
 if(typeof id!=='string'||!validUUID(id))return json({error:'Choose a valid upload.'},400);
 const admin=createAdminClient();
 const {data}=await admin.from('media_assets').select('*').eq('id',id).eq('uploaded_by',member.user_id).eq('resource_type','video').maybeSingle();
 if(!data||!['ready','pending'].includes(data.status))return json({error:'This upload is no longer available. Upload it again.'},404);
 let asset=data.status==='ready'?data:null;
 if(!asset){
  const {data:allowed}=await admin.rpc('cms_consume_rate_limit',{bucket:`video-status:${member.user_id}`,max_attempts:180,window_seconds:3600});
  if(!allowed)return json({error:'Please wait before checking again.'},429);
  try{asset=await finishVideo(id);}catch{return json({pending:true},202);}
 }
 if(!asset)return json({pending:true},202);
 return json({item:{id,type:'video',url:videoUrl(asset),name:asset.original_filename,width:asset.width,height:asset.height,alt:''}});
}
