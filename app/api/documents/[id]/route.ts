import {createAdminClient} from '@/lib/supabase/admin';
import {getStaffSession} from '@/lib/cms/session';
import {cloudinaryConfig,signCloudinary} from '@/lib/cms/cloudinary';
import {validUUID} from '@/lib/cms/content-types';
export const maxDuration=180;
export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){
 const {id}=await params;if(!validUUID(id))return new Response('Not found',{status:404});
 const admin=createAdminClient();
 // A file must be referenced by a live snapshot; unpublished files require staff.
 const {data:refs}=await admin.from('media_references').select('content_id').eq('asset_id',id).eq('slot','published');
 const ids=refs?.map(r=>r.content_id)??[];let publicFile=false;
 if(ids.length){const{data:live}=await admin.from('content_live').select('id').in('id',ids).limit(1);publicFile=Boolean(live?.length);}
 if(!publicFile){const{member}=await getStaffSession();if(!member||member.must_change_password)return new Response('Not found',{status:404});}
 const {data:a}=await admin.from('media_assets').select('*').eq('id',id).eq('resource_type','raw').eq('status','ready').single();if(!a)return new Response('Not found',{status:404});
 const config=cloudinaryConfig();const parameters={public_id:a.public_id,format:'pdf',type:'upload',attachment:true,timestamp:Math.floor(Date.now()/1000),expires_at:Math.floor(Date.now()/1000)+60};
 const query=new URLSearchParams({...Object.fromEntries(Object.entries(parameters).map(([k,v])=>[k,String(v)])),api_key:config.key,signature:signCloudinary(parameters)});
 try{
 const response=await fetch(`https://api.cloudinary.com/v1_1/${config.cloud}/raw/download?${query}`,{cache:'no-store',signal:AbortSignal.timeout(120000)});
 if(!response.ok)return new Response('Document delivery is temporarily unavailable. Please try again.',{status:503});
 return new Response(response.body,{headers:{'Content-Type':'application/pdf','Content-Disposition':`attachment; filename="${a.original_filename.replace(/[^a-zA-Z0-9._-]/g,'_')}"`,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex'}});
 }catch{return new Response('Document delivery is temporarily unavailable.',{status:503});}
}
