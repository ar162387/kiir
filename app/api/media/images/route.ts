import {getStaffSession} from '@/lib/cms/session';
import {createStaffClient} from '@/lib/supabase/auth';

export async function GET(request:Request){
 const {member}=await getStaffSession();
 if(!member||member.must_change_password)return new Response(null,{status:403});
 const params=new URL(request.url).searchParams;
 const search=(params.get('q')??'').replace(/[^\p{L}\p{N} .-]/gu,'').slice(0,100);
 const offset=Math.max(0,Math.min(100000,Number(params.get('offset'))||0));
 const client=await createStaffClient();
 let query=client.from('media_assets').select('id,public_id,cloud_name,version,original_filename,alt_text,width,height,bytes').eq('status','ready').eq('resource_type','image');
 if(search)query=query.or(`alt_text.ilike.%${search}%,original_filename.ilike.%${search}%`);
 const {data,error}=await query.order('created_at',{ascending:false}).order('id').range(offset,offset+24);
 return Response.json(error?{error:'The image library could not be loaded.'}:{images:data.slice(0,24),more:data.length>24},{status:error?503:200,headers:{'Cache-Control':'private, no-store'}});
}
