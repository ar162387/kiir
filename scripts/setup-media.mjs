import { spawnSync } from 'node:child_process';

const { CLOUDINARY_CLOUD_NAME:cloud, CLOUDINARY_API_KEY:key, CLOUDINARY_API_SECRET:secret,
  SUPABASE_DB_POOLER_URL:connection, SUPABASE_DATABASE_PASSWORD:password }=process.env;
const projectUrl=process.env.NEXT_PUBLIC_SUPABASE_URL||process.env.SUPABASE_PROJECT_URL;
if(!cloud||!key||!secret||!connection||!password||!projectUrl)throw new Error('Cloudinary and database configuration are required.');
const preset='kiir_cms_images_v1';
const headers={Authorization:'Basic '+Buffer.from(`${key}:${secret}`).toString('base64')};
const endpoint=`https://api.cloudinary.com/v1_1/${cloud}/upload_presets`;
let response=await fetch(endpoint+'/'+preset,{headers});
if(response.status===404){
  const form=new FormData();
  for(const [k,v] of Object.entries({name:preset,unsigned:'false',allowed_formats:'jpg,jpeg,png,webp',
    overwrite:'false',transformation:'c_limit,w_2400,h_2400/q_auto:good'}))form.set(k,v);
  response=await fetch(endpoint,{method:'POST',headers,body:form});
  if(!response.ok)throw new Error(`Cloudinary preset setup failed (HTTP ${response.status}).`);
  response=await fetch(endpoint+'/'+preset,{headers});
}else if(!response.ok)throw new Error(`Cloudinary preset check failed (HTTP ${response.status}).`);
const config=await response.json();
if(config.unsigned!==false)throw new Error('The existing upload preset is not signed. No unsafe upload configuration was accepted.');
const settings=config.settings??{};
if(settings.overwrite!==false||JSON.stringify([...(settings.allowed_formats??[])].sort())!==JSON.stringify(['jpeg','jpg','png','webp'])
  ||!settings.transformation?.some(t=>t.crop==='limit'&&t.width===2400&&t.height===2400)
  ||!settings.transformation?.some(t=>t.quality==='auto:good'))throw new Error('The signed upload preset does not match the required optimization policy.');
// Never log the body: this configuration contains a server credential.
const value=JSON.stringify({cloud_name:cloud,api_key:key,api_secret:secret,
  prefix:`kiir-cms/${new URL(projectUrl).hostname.split('.')[0]}/`});
const literal="'"+value.replaceAll("'","''")+"'";
const sql=`begin;
select vault.update_secret(id,${literal}) from vault.secrets where name='kiir_cloudinary_cleanup';
select vault.create_secret(${literal},'kiir_cloudinary_cleanup','KIIR managed image cleanup')
where not exists(select 1 from vault.secrets where name='kiir_cloudinary_cleanup');
commit;`;
const url=new URL(connection);url.password='';url.searchParams.set('sslmode','require');url.searchParams.set('connect_timeout','10');
const result=spawnSync('psql',['-X','--no-password','-v','ON_ERROR_STOP=1',url.toString()],{
  input:sql,encoding:'utf8',env:{...process.env,PGPASSWORD:password},
});
if(result.status!==0)throw new Error('Could not install encrypted cleanup credentials. Inspect database extension permissions; no credential values were logged.');
console.log('Signed image preset verified; encrypted cleanup credentials configured in Supabase Vault.');
