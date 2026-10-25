import {provisionUser} from './provision-user.mjs';
import assert from 'node:assert/strict';
import {randomBytes,randomUUID,createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {createClient} from '@supabase/supabase-js';
const options={auth:{persistSession:false,autoRefreshToken:false},global:{fetch:(u,i={})=>fetch(u,{...i,signal:AbortSignal.timeout(25000)})}};
const admin=createClient(process.env.SUPABASE_PROJECT_URL,process.env.SUPABASE_SECRET_KEY,options),anon=createClient(process.env.SUPABASE_PROJECT_URL,process.env.SUPABASE_PUBLISHABLE_KEY,options);
const suffix=randomBytes(6).toString('hex'),users=[],clients=[],changed=new Map();let passed=0,asset,program,message,owner;
const pass=(v,label)=>{assert.ok(v,label);passed++;console.log('PASS '+label);};
async function staff(role){const email=`kiir-settings-${suffix}-${role}@example.invalid`,password='KiirSettings1!'+randomBytes(12).toString('hex');const{data,error}=await provisionUser(admin,{email,password,email_confirm:true});assert.ifError(error);users.push(data.user.id);assert.ifError((await admin.from('cms_memberships').insert({user_id:data.user.id,email,display_name:'Settings Verification',role,is_enabled:true,must_change_password:false})).error);const client=createClient(process.env.SUPABASE_PROJECT_URL,process.env.SUPABASE_PUBLISHABLE_KEY,options);assert.ifError((await client.auth.signInWithPassword({email,password})).error);clients.push(client);return {id:data.user.id,client};}
const row=async(key)=>{const{data,error}=await admin.from('site_settings').select('*').eq('key',key).single();assert.ifError(error);return data;};
async function save(client,key,value){const current=await row(key);if(!changed.has(key))changed.set(key,{original:current.value,version:current.version});const result=await client.rpc('cms_save_settings',{setting_key:key,payload:value,expected_version:current.version});assert.ifError(result.error);changed.get(key).version=result.data;return result.data;}
try{
 owner=await staff('admin');const manager=await staff('content_manager');
 const{data:settings,error}=await anon.from('site_settings').select('key,value');assert.ifError(error);pass(settings.length===5,'all five approved settings sections are publicly readable');
 pass(Boolean((await anon.from('site_settings').update({value:{}}).eq('key','contact')).error),'anonymous direct settings writes are denied');
 const org=await row('org');pass(Boolean((await manager.client.rpc('cms_save_settings',{setting_key:'org',payload:org.value,expected_version:org.version})).error),'Content Managers cannot change branding');
 const about=await row('about');pass(Boolean((await manager.client.rpc('cms_save_settings',{setting_key:'about',payload:about.value,expected_version:about.version})).error),'Content Managers cannot change organization About settings');
 const v=await save(manager.client,'contact',{address:'',phone:'',email:''});const{data:empty}=await anon.from('site_settings').select('value').eq('key','contact').single();pass(Object.values(empty.value).every(x=>x===''),'clearing every contact field persists intentional blanks');
 const{error:stale}=await manager.client.rpc('cms_save_settings',{setting_key:'contact',payload:{email:'test@example.invalid',phone:'',address:''},expected_version:v-1});pass(stale?.code==='PT409','stale settings saves are rejected');
 const social=await row('social');pass(Boolean((await manager.client.rpc('cms_save_settings',{setting_key:'social',payload:{...social.value,facebook:'javascript:alert(1)'},expected_version:social.version})).error),'unsafe social protocols are rejected by the database');
 await save(manager.client,'social',{facebook:'',instagram:'',x:'',linkedin:''});pass(true,'Content Managers can clear all social links without fallback placeholders');
 const ticker=[{id:'verify-'+suffix,is_active:true,segments:[{text:'Read '},{text:'the research',href:'/publications?kind=research-papers'},{text:' or visit '},{text:'the source',href:'https://example.com/'}],segments_ur:[]}];
 await save(manager.client,'ticker',ticker);const{data:t}=await anon.from('site_settings').select('value').eq('key','ticker').single();pass(t.value[0].segments[1].href.includes('research-papers'),'announcements preserve inline text and internal/external links');
 const tr=await row('ticker');const bad=structuredClone(ticker);bad[0].segments[1].href='//evil.invalid';pass(Boolean((await manager.client.rpc('cms_save_settings',{setting_key:'ticker',payload:bad,expected_version:tr.version})).error),'protocol-relative announcement links are denied');
 pass(Boolean((await anon.rpc('cms_save_settings',{setting_key:'ticker',payload:[],expected_version:tr.version})).error),'anonymous settings RPC execution is denied');
 const{data:inserted,error:insertError}=await admin.from('contact_messages').insert({name:'Verification '+suffix,email:'test@example.invalid',subject:'Disposable verification',message:'A disposable message to verify inbox privacy.'}).select('id').single();assert.ifError(insertError);message=inserted.id;
 const{data:publicRows,error:publicError}=await anon.from('contact_messages').select('id').eq('id',message);pass(Boolean(publicError)||publicRows.length===0,'contact messages are private from public readers');
 const{data:managerRows}=await manager.client.from('contact_messages').select('id').eq('id',message);pass(managerRows.length===0,'Content Managers cannot read the Admin inbox');
 const{data:ownerRows}=await owner.client.from('contact_messages').select('id').eq('id',message);assert.ifError((await owner.client.from('contact_messages').update({is_read:true}).eq('id',message)).error);pass(ownerRows.length===1,'Admins can read and mark contact messages');
 pass(Boolean((await anon.from('contact_messages').insert({name:'Bypass',email:'test@example.invalid',message:'Bypass rate limiting attempt.'})).error),'public direct contact inserts cannot bypass server rate limits');
 // Exercise the shared reference registry with a real managed logo and program.
 const id=randomUUID(),cloud=process.env.CLOUDINARY_CLOUD_NAME,publicId=`kiir-cms/${new URL(process.env.SUPABASE_PROJECT_URL).hostname.split('.')[0]}/${id}`;
 asset=id;assert.ifError((await admin.from('media_assets').insert({id,public_id:publicId,cloud_name:cloud,resource_type:'image',uploaded_by:owner.id})).error);
 const parameters={public_id:publicId,timestamp:Math.floor(Date.now()/1000),overwrite:false,upload_preset:'kiir_cms_images_v1'};
 const signature=createHash('sha1').update(Object.keys(parameters).sort().map(k=>`${k}=${parameters[k]}`).join('&')+process.env.CLOUDINARY_API_SECRET).digest('hex');
 const form=new FormData();form.set('file',new Blob([readFileSync('public/photos/3_1624014649.jpg')],{type:'image/jpeg'}),'Verification logo.jpg');for(const[k,value]of Object.entries({...parameters,api_key:process.env.CLOUDINARY_API_KEY,signature}))form.set(k,String(value));
 const uploaded=await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/upload`,{method:'POST',body:form});assert.ok(uploaded.ok);const image=await uploaded.json();assert.ifError((await admin.from('media_assets').update({status:'ready',cloudinary_asset_id:image.asset_id,version:image.version,format:image.format,width:image.width,height:image.height,bytes:image.bytes,original_filename:'Disposable verification logo.jpg',finalized_at:new Date().toISOString()}).eq('id',id)).error);
 await save(owner.client,'org',{...org.value,logo_asset_id:id});const saved=await row('org');pass(saved.value.logo_url.includes(publicId),'branding resolves a managed optimized logo URL');
 const{data:pid,error:pError}=await manager.client.rpc('cms_save_program',{payload:{name:'Temporary settings verification',slug:'cms-settings-'+suffix,description:'Disposable program to verify shared logo preservation.',image_asset_id:id}});assert.ifError(pError);program=pid;
 await save(owner.client,'org',org.value);const restored=await row('org');pass(restored.value.logo_url===org.value.logo_url&&restored.value.logo_asset_id===org.value.logo_asset_id,'restoring branding preserves the original logo after a managed upload');const{data:refs}=await admin.from('media_references').select('program_id').eq('asset_id',id);const{data:jobs}=await admin.from('media_jobs').select('status').eq('asset_id',id).in('status',['queued','processing']);pass(refs.some(r=>r.program_id===pid)&&jobs.length===0,'replacing a logo preserves the same file used by another program');
 assert.ifError((await admin.from('programs').delete().eq('id',pid)).error);await admin.from('media_jobs').update({not_before:new Date().toISOString()}).eq('asset_id',id);
 for(let i=0;i<20;i++){assert.ifError((await admin.rpc('cms_run_media_cleanup')).error);await new Promise(r=>setTimeout(r,2000));const{data:j}=await admin.from('media_jobs').select('status').eq('asset_id',id).single();if(j?.status==='complete')break;if(i===19)throw Error('Logo cleanup did not complete');}
 const provider=await fetch(`https://api.cloudinary.com/v1_1/${cloud}/resources/image/upload/${encodeURIComponent(publicId)}`,{headers:{Authorization:'Basic '+Buffer.from(process.env.CLOUDINARY_API_KEY+':'+process.env.CLOUDINARY_API_SECRET).toString('base64')}});pass(provider.status===404,'the worker physically removes the logo after its final reference is deleted');
 console.log(`${passed} live settings/contact/logo checks passed.`);
}finally{
 for(const[key,tracked]of changed){const current=await row(key);if(current.version!==tracked.version)throw Error('Concurrent settings update detected; refusing to overwrite '+key);assert.ifError((await owner.client.rpc('cms_save_settings',{setting_key:key,payload:tracked.original,expected_version:tracked.version})).error);}
 const restoredOrg=await row('org');if(changed.has('org'))assert.deepEqual(restoredOrg.value,changed.get('org').original,'Final cleanup must preserve every original branding field, including the logo');
 if(program){await admin.from('programs').delete().eq('id',program);await admin.from('cms_audit_logs').delete().eq('entity_id',program);}
 if(message)await admin.from('contact_messages').delete().eq('id',message);
 if(asset){const{data:a}=await admin.from('media_assets').select('status').eq('id',asset).single();if(a?.status==='deleted'){await admin.from('media_jobs').delete().eq('asset_id',asset);await admin.from('media_assets').delete().eq('id',asset);}else {await admin.from('media_jobs').update({not_before:new Date().toISOString()}).eq('asset_id',asset);await admin.rpc('cms_run_media_cleanup');}}
 for(const c of clients)await c.auth.signOut();for(const id of users){await admin.from('cms_audit_logs').delete().eq('actor_id',id);await admin.auth.admin.deleteUser(id);}
 console.log('Original settings restored; disposable identities, inbox message, program and logo removed.');
}
