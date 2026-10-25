import 'server-only';
import type {SupabaseClient} from '@supabase/supabase-js';
/** The service authorizes the UUID, which only the Auth Admin API can supply. */
export async function provisionAuthUser(client:SupabaseClient,values:{email:string;password:string;email_confirm:true}){
 const{data:nonce,error}=await client.rpc('cms_authorize_account',{account_email:values.email});
 if(error)return {data:{user:null},error};
 return client.auth.admin.createUser({...values,id:nonce});
}
