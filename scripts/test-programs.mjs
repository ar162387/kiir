import {provisionUser} from './provision-user.mjs';
import assert from 'node:assert/strict';
import { createHash,randomUUID,randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const timedFetch=(input,init={})=>fetch(input,{...init,signal:AbortSignal.timeout(20000)});
const url=process.env.NEXT_PUBLIC_SUPABASE_URL||process.env.SUPABASE_PROJECT_URL;
const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||process.env.SUPABASE_PUBLISHABLE_KEY;
const admin=createClient(url,process.env.SUPABASE_SECRET_KEY,{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:timedFetch}});
const anon=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:timedFetch}});
const cloud=process.env.CLOUDINARY_CLOUD_NAME;const apiKey=process.env.CLOUDINARY_API_KEY;const secret=process.env.CLOUDINARY_API_SECRET;
const prefix=`kiir-cms/${new URL(url).hostname.split('.')[0]}/`;
const suffix=randomBytes(6).toString('hex');const users=[];const programs=[];const assets=[];const clients=[];let passed=0;
function pass(condition,message){assert.ok(condition,message);passed++;console.log('PASS '+message);}
function sign(parameters){return createHash('sha1').update(Object.keys(parameters).sort().map(k=>`${k}=${parameters[k]}`).join('&')+secret).digest('hex');}
async function resource(id){return fetch(`https://api.cloudinary.com/v1_1/${cloud}/resources/image/upload/${encodeURIComponent(id)}`,{headers:{Authorization:'Basic '+Buffer.from(`${apiKey}:${secret}`).toString('base64')}});}
async function readProgram(id){const{data,error}=await admin.from('programs').select('*').eq('id',id).single();assert.ifError(error);return data;}
async function createProgram(client,name,extra={}){const payload={name:`Disposable ${name}`,slug:`cms-test-${suffix}-${name}`,description:'Disposable program verification.',sort_order:9000,is_active:true,...extra};const{data,error}=await client.rpc('cms_save_program',{payload,expected_version:null});assert.ifError(error);programs.push(data);return readProgram(data);}
async function save(client,program,extra={}){const{data,error}=await client.rpc('cms_save_program',{payload:{...program,...extra},expected_version:program.version});assert.ifError(error);return readProgram(data);}
async function upload(owner){
  const id=randomUUID(),publicId=prefix+id;assets.push({id,public_id:publicId});
  const{error}=await admin.from('media_assets').insert({id,public_id:publicId,cloud_name:cloud,uploaded_by:owner});assert.ifError(error);
  const parameters={public_id:publicId,timestamp:Math.floor(Date.now()/1000),upload_preset:'kiir_cms_images_v1',overwrite:false};
  const form=new FormData();form.set('file',new Blob([readFileSync('public/photos/3_1624014649.jpg')],{type:'image/jpeg'}),'disposable-program-test.jpg');
  for(const[k,v]of Object.entries({...parameters,api_key:apiKey,signature:sign(parameters)}))form.set(k,String(v));
  const response=await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/upload`,{method:'POST',body:form});
  await response.json();assert.ok(response.ok,'Cloudinary fixture upload must succeed');
  const verified=await resource(publicId);assert.equal(verified.status,200);const actual=await verified.json();
  pass(actual.width<=2400&&actual.height<=2400&&['jpg','jpeg','png','webp'].includes(actual.format),'Cloudinary applies the signed image optimization policy');
  const{error:finishError}=await admin.from('media_assets').update({status:'ready',cloudinary_asset_id:actual.asset_id,version:actual.version,format:actual.format,
    width:actual.width,height:actual.height,bytes:actual.bytes,original_filename:'Disposable program test',finalized_at:new Date().toISOString()}).eq('id',id);assert.ifError(finishError);
  return id;
}
try{
  const identities={};
  for(const role of ['admin','content_manager','outsider']){
    const email=`kiir-program-test-${suffix}-${role}@example.invalid`,password='KiirTest1!'+randomBytes(18).toString('hex');
    const{data,error}=await provisionUser(admin,{email,password,email_confirm:true});assert.ifError(error);users.push(data.user.id);
    if(role!=='outsider'){const{error}=await admin.from('cms_memberships').insert({user_id:data.user.id,email,display_name:'Disposable program tester',role,must_change_password:false});assert.ifError(error);}
    const client=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:timedFetch}});clients.push(client);
    const{error:loginError}=await client.auth.signInWithPassword({email,password});assert.ifError(loginError);identities[role]={client,id:data.user.id};
  }
  const editor=identities.content_manager.client,owner=identities.admin.client;
  const{data:initial,error:initialError}=await anon.from('programs').select('slug');assert.ifError(initialError);pass(initial.length>=4,'public readers can access dynamic programs');
  const{error:outsiderWrite}=await identities.outsider.client.rpc('cms_save_program',{payload:{name:'No access',slug:`outsider-${suffix}`,description:'No access',sort_order:0}});pass(Boolean(outsiderWrite),'authenticated nonstaff users cannot create programs');
  let first=await createProgram(editor,'first',{name_ur:'امن',description_ur:'ایک آزمائشی پروگرام'});pass(first.name_ur==='امن','Content Manager creates a program with optional Urdu');
  const{data:visible}=await anon.from('programs').select('slug').eq('id',first.id);pass(visible.length===1,'a newly created fifth program is publicly visible without a whitelist');
  const stale={...first};first=await save(editor,first,{name:'Updated disposable program'});
  const{error:staleError}=await editor.rpc('cms_save_program',{payload:{...stale,name:'Stale overwrite'},expected_version:stale.version});
  if(staleError?.code!=='PT409')console.log('Stale-save diagnostic:',JSON.stringify(staleError));
  pass(staleError?.code==='PT409','stale edits cannot overwrite another saved update');
  const oldSlug=first.slug;first=await save(editor,first,{slug:first.slug+'-renamed'});
  const{data:alias,error:aliasError}=await anon.from('program_redirects').select('programs(slug)').eq('old_slug',oldSlug).single();assert.ifError(aliasError);pass(alias.programs.slug===first.slug,'renaming a program records a canonical redirect');
  first=await save(editor,first,{is_active:false});const{data:hidden}=await anon.from('programs').select('id').eq('id',first.id);pass(hidden.length===0,'hidden programs are excluded by public RLS');
  const{data:staffHidden}=await editor.from('programs').select('id').eq('id',first.id);pass(staffHidden.length===1,'staff can still edit hidden programs');
  first=await save(editor,first,{is_active:true});
  const{error:editorDelete}=await editor.rpc('cms_delete_program',{target:first.id,expected_version:first.version});pass(Boolean(editorDelete),'Content Manager cannot permanently delete programs');
  const{error:badImage}=await editor.rpc('cms_save_program',{payload:{...first,image_asset_id:randomUUID()},expected_version:first.version});pass(Boolean(badImage),'invalid media references fail without partially saving a program');
  const imageA=await upload(identities.content_manager.id),imageB=await upload(identities.content_manager.id);
  first=await save(editor,first,{image_asset_id:imageA});let second=await createProgram(editor,'shared',{image_asset_id:imageA});
  first=await save(editor,first,{image_asset_id:imageB});
  const{data:references}=await admin.from('media_references').select('program_id').eq('asset_id',imageA);pass(references.length===1&&references[0].program_id===second.id,'replacing a shared image preserves the other program reference');
  const{data:sharedJob}=await admin.from('media_jobs').select('status').eq('asset_id',imageA).maybeSingle();pass(!sharedJob||sharedJob.status==='cancelled','shared images are not queued for deletion');
  const{error:mediaWrite}=await editor.from('media_assets').update({status:'deleted'}).eq('id',imageA);pass(Boolean(mediaWrite),'staff cannot forge media lifecycle updates');
  const{error:removeFirst}=await owner.rpc('cms_delete_program',{target:first.id,expected_version:first.version});assert.ifError(removeFirst);
  const{error:removeSecond}=await owner.rpc('cms_delete_program',{target:second.id,expected_version:second.version});assert.ifError(removeSecond);
  const{data:jobs}=await admin.from('media_jobs').select('asset_id,status').in('asset_id',[imageA,imageB]);pass(jobs.length===2,'deleting programs transactionally queues their unused images');
  const{error:dueError}=await admin.from('media_jobs').update({not_before:new Date().toISOString()}).in('asset_id',[imageA,imageB]);assert.ifError(dueError);
  const{data:run,error:runError}=await admin.rpc('cms_run_media_cleanup');assert.ifError(runError);pass(run.configured===true,'durable cleanup worker has encrypted provider credentials');
  for(let attempt=0;attempt<20;attempt++){
    await new Promise(resolve=>setTimeout(resolve,2000));
    const{error}=await admin.rpc('cms_run_media_cleanup');assert.ifError(error);
    const{data}=await admin.from('media_jobs').select('status').in('asset_id',[imageA,imageB]);
    if(data.every(j=>j.status==='complete'))break;
    if(attempt===19)throw new Error('Cleanup did not finish within its verification window.');
  }
  for(const asset of assets){const response=await resource(asset.public_id);pass(response.status===404,'Cloudinary confirms the unused image was physically deleted');}
  const{error:reattach}=await editor.rpc('cms_save_program',{payload:{name:'Deleted image',slug:`cms-test-${suffix}-deleted-image`,description:'Must fail',image_asset_id:imageA}});pass(Boolean(reattach),'deleted/deleting images cannot be reattached');
  console.log(`${passed} live program/media checks passed.`);
}finally{
  for(const id of programs){const{error}=await admin.from('programs').delete().eq('id',id);if(error)console.error('Program cleanup needs attention:',id);}
  if(programs.length)await admin.from('cms_audit_logs').delete().in('entity_id',programs);
  for(const client of clients)await client.auth.signOut({scope:'local'});
  for(const id of users){const{error}=await admin.auth.admin.deleteUser(id);if(error)console.error('Disposable user cleanup needs attention:',id);}
  if(assets.length){
    const ids=assets.map(a=>a.id);
    const{data:deleted}=await admin.from('media_assets').select('id').in('id',ids).eq('status','deleted');
    if(deleted?.length){const completed=deleted.map(a=>a.id);await admin.from('media_jobs').delete().in('asset_id',completed);await admin.from('media_assets').delete().in('id',completed);}
    await admin.from('media_jobs').update({not_before:new Date().toISOString()}).in('asset_id',ids).eq('status','queued');
    await admin.rpc('cms_run_media_cleanup');
  }
  console.log('Disposable programs/accounts removed; any pending image cleanup remains durable.');
}
