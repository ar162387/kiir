import {getStaffSession} from '@/lib/cms/session';
import {hasPermission} from '@/lib/cms/permissions';
import {createStaffClient} from '@/lib/supabase/auth';

export async function GET(){
 const {member}=await getStaffSession();
 if(!member||member.must_change_password||!hasPermission(member.role,'content.edit'))return new Response(null,{status:403});
 const client=await createStaffClient();
 const {data,error}=await client.from('programs').select('id,name,is_active').order('sort_order').order('id');
 return Response.json(error?{error:'Programs could not be loaded.'}:{programs:data},{status:error?503:200,headers:{'Cache-Control':'private, no-store'}});
}
