import {getStaffSession} from '@/lib/cms/session';
import {hasPermission} from '@/lib/cms/permissions';
import {getContentPage} from '@/lib/cms/content-list-query';

export async function GET(request:Request){
 const {member}=await getStaffSession();
 if(!member||member.must_change_password||!hasPermission(member.role,'content.edit'))return new Response(null,{status:403});
 const params=new URL(request.url).searchParams;
 try{return Response.json(await getContentPage(Object.fromEntries(params),params.get('cursor')??undefined),{headers:{'Cache-Control':'private, no-store'}});}
 catch{return Response.json({error:'Content could not be loaded.'},{status:503});}
}
