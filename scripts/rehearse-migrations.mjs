import {spawnSync} from 'node:child_process';
import {readFileSync,readdirSync} from 'node:fs';
const binary=process.env.PG_REHEARSAL_BIN||'/opt/homebrew/opt/postgresql@16/bin/';
const args=['-h','127.0.0.1','-p','55439'];
spawnSync(binary+'dropdb',[...args,'--if-exists','kiir_replay'],{encoding:'utf8'});
let result=spawnSync(binary+'createdb',[...args,'-T','template0','-E','UTF8','kiir_replay'],{encoding:'utf8'});if(result.status!==0)throw Error('Could not create isolated migration database.');
const bootstrap="create schema auth;create table auth.users(id uuid primary key,email text,raw_app_meta_data jsonb);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;";
result=spawnSync(binary+'psql',[...args,'-X','-v','ON_ERROR_STOP=1','kiir_replay'],{input:bootstrap,encoding:'utf8'});if(result.status!==0)throw Error('Bootstrap failed');
let passed=0;
for(const filename of readdirSync('supabase/migrations').filter(f=>/^2026.*\.sql$/.test(f)).sort()){
 let sql=readFileSync('supabase/migrations/'+filename,'utf8');
 // Supabase-owned extensions and cron scheduling are checked on Supabase,
 // not installed or emulated on this isolated application-schema database.
 if(filename.includes('cms_media_cleanup_worker'))sql=sql.replace(/^create extension.*$/gm,'').replace(/^select cron.schedule.*$/gm,'');
 result=spawnSync(binary+'psql',[...args,'-X','-v','ON_ERROR_STOP=1','kiir_replay'],{input:sql,encoding:'utf8'});
 if(result.status!==0)throw Error('Migration replay failed: '+filename+' '+result.stderr.slice(-700));
 passed++;console.log('PASS '+filename);
}
console.log(`${passed} application migrations replayed on an empty isolated database; provider extensions/cron remain separately verified remotely.`);
