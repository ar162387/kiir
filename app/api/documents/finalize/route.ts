import {getStaffSession} from '@/lib/cms/session';
import {createAdminClient} from '@/lib/supabase/admin';
import {cloudinaryConfig,getCloudinaryAsset,signCloudinary} from '@/lib/cms/cloudinary';
import {isSameOriginRequest} from '@/lib/cms/request-origin';
import {validUUID} from '@/lib/cms/content-types';
const json=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'private, no-store'}});
export async function POST(request:Request){
 if(!isSameOriginRequest(request))return json({error:'Invalid upload origin.'},403);
 const{member}=await getStaffSession();if(!member||member.must_change_password)return json({error:'Staff sign-in required.'},403);
 if(Number(request.headers.get('content-length')??0)>2048)return json({error:'Invalid PDF confirmation.'},400);
 try{
 const{id,filename}=await request.json();if(typeof id!=='string'||!validUUID(id)||typeof filename!=='string'||filename.length>255)return json({error:'Invalid PDF confirmation.'},400);
 const admin=createAdminClient();const{data:asset}=await admin.from('media_assets').select('*').eq('id',id).eq('uploaded_by',member.user_id).eq('resource_type','raw').single();
 if(asset?.status==='ready')return json({id:asset.id,name:asset.original_filename});
 if(!asset||asset.status!=='pending'||Date.now()-Date.parse(asset.created_at)>3600000)return json({error:'This upload expired. Upload the PDF again.'},409);
 const{data:allowed,error:rateError}=await admin.rpc('cms_consume_rate_limit',{bucket:`pdf-finalize:${member.user_id}`,max_attempts:60,window_seconds:3600});if(rateError||!allowed)return json({error:'Too many upload confirmations. Try later.'},429);
 const file=await getCloudinaryAsset(asset.public_id,'raw');if(file.public_id!==asset.public_id||file.resource_type!=='raw'||file.type!=='upload'||file.bytes<5||file.bytes>10*1024*1024||!file.asset_id||!Number.isSafeInteger(file.version))return json({error:'Choose a PDF up to 10 MB.'},400);
 const config=cloudinaryConfig(),parameters={public_id:asset.public_id,format:'pdf',type:'upload',attachment:true,timestamp:Math.floor(Date.now()/1000),expires_at:Math.floor(Date.now()/1000)+60};
 const query=new URLSearchParams({...Object.fromEntries(Object.entries(parameters).map(([k,v])=>[k,String(v)])),api_key:config.key,signature:signCloudinary(parameters)});
 const response=await fetch(`https://api.cloudinary.com/v1_1/${config.cloud}/raw/download?${query}`,{cache:'no-store',headers:{Range:'bytes=0-7'},signal:AbortSignal.timeout(20000)});if(!response.ok||!response.body)throw Error();
 const reader=response.body.getReader();let header='';try{while(header.length<5){const{done,value}=await reader.read();if(done)break;header+=new TextDecoder().decode(value.slice(0,8));}}finally{await reader.cancel();}
 if(!header.startsWith('%PDF-'))return json({error:'The uploaded file is not a PDF.'},400);
 const{data:ready,error}=await admin.from('media_assets').update({status:'ready',cloudinary_asset_id:file.asset_id,version:file.version,format:'pdf',bytes:file.bytes,original_filename:filename,finalized_at:new Date().toISOString()}).eq('id',id).eq('status','pending').select('id,original_filename').single();if(error||!ready)return json({error:'PDF confirmation could not be saved. Retry confirmation.'},409);
 return json({id:ready.id,name:ready.original_filename});
 }catch{return json({error:'The PDF could not be verified. Retry confirmation; abandoned uploads are cleaned up automatically.'},503);}
}
