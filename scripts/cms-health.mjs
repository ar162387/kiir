import {createClient} from '@supabase/supabase-js';
const client=createClient(process.env.SUPABASE_PROJECT_URL,process.env.SUPABASE_SECRET_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const{data:jobs,error}=await client.from('media_jobs').select('status,attempts,last_error').in('status',['failed','processing','queued']).limit(100);if(error)throw Error('Cleanup health unavailable');
const{data:settings,error:sError}=await client.from('site_settings').select('key,version');if(sError)throw Error('Settings health unavailable');
const{data:worker,error:wError}=await client.rpc('cms_run_media_cleanup');if(wError)throw Error('Cleanup worker unavailable');
console.log(JSON.stringify({settings:settings.map(s=>s.key),cleanupConfigured:worker.configured??null,cleanupJobs:jobs.map(j=>({status:j.status,attempts:j.attempts,error:j.last_error})),checkedAt:new Date().toISOString()},null,2));
if(jobs.some(j=>j.status==='failed'))process.exitCode=1;
