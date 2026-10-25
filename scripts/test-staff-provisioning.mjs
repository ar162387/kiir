import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {createClient} from '@supabase/supabase-js';
import {provisionUser} from './provision-user.mjs';
const options={auth:{persistSession:false,autoRefreshToken:false}},url=process.env.SUPABASE_PROJECT_URL;
const admin=createClient(url,process.env.SUPABASE_SECRET_KEY,options),anon=createClient(url,process.env.SUPABASE_PUBLISHABLE_KEY,options);
const email='kiir-signup-'+randomBytes(6).toString('hex')+'@example.invalid',password='KiirPrivate1!'+randomBytes(12).toString('hex');let id;
try{
 assert.ok((await anon.auth.signUp({email,password,options:{data:{role:'admin',cms_provisioning_nonce:'00000000-0000-0000-0000-000000000001'}}})).error);console.log('PASS public signup is rejected before account creation');
 assert.ok((await anon.rpc('cms_authorize_account',{account_email:email})).error);console.log('PASS anonymous callers cannot authorize provisioning');
 const{data:token,error}=await admin.rpc('cms_authorize_account',{account_email:email});assert.ifError(error);
 const response=await fetch(url+'/auth/v1/signup',{method:'POST',headers:{apikey:process.env.SUPABASE_PUBLISHABLE_KEY,'Content-Type':'application/json'},body:JSON.stringify({email,password,id:token,app_metadata:{cms_provisioning_nonce:token}})});assert.ok(!response.ok);console.log('PASS public signup cannot choose an authorized server account ID');
 const{data,error:provisionError}=await provisionUser(admin,{email,password,email_confirm:true});assert.ifError(provisionError);id=data.user.id;
 const{data:actual}=await admin.auth.admin.getUserById(id);assert.ok(!actual.user.app_metadata.cms_provisioning_nonce);console.log('PASS authorized staff provisioning succeeds with a server-authorized account ID');
 const client=createClient(url,process.env.SUPABASE_PUBLISHABLE_KEY,options);assert.ifError((await client.auth.signInWithPassword({email,password})).error);
 assert.ok((await client.rpc('cms_authorize_account',{account_email:'other@example.invalid'})).error);await client.auth.signOut();console.log('PASS an ordinary authenticated account cannot authorize more accounts');
 console.log('5 staff-only account checks passed.');
}finally{if(id)await admin.auth.admin.deleteUser(id);console.log('Disposable identity removed.');}
