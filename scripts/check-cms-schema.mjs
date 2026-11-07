import {createClient} from '@supabase/supabase-js';

const url=process.env.NEXT_PUBLIC_SUPABASE_URL||process.env.SUPABASE_PROJECT_URL;
const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||process.env.SUPABASE_PUBLISHABLE_KEY
 ||process.env.SUPBASE_PUBLISHABLE_KEY||process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if(!url||!key){
 console.log('CMS schema check skipped for the local seed preview.');
}else{
 const client=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const checks=[
  ['content_catalog','id,presentation,document_id,cover_width'],
  ['media_entries_live','id,kind,items'],
  ['gallery_photos','id,item'],
 ];
 const results=await Promise.all(checks.map(async([table,columns])=>{
  const {error}=await client.from(table).select(columns).limit(0).abortSignal(AbortSignal.timeout(15000));
  return error?table:null;
 }));
 const missing=results.filter(Boolean);
 if(missing.length)throw Error('Deployment stopped because the CMS database is not ready. Apply pending migrations before deploying. Failed checks: '+missing.join(', '));
 console.log('PASS deployed CMS schema supports content, gallery, and documentaries.');
}
