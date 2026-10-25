import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
const versions=process.argv.slice(2);
if(!versions.length||versions.some(v=>!/^\d{14}$/.test(v)||!readdirSync('supabase/migrations').some(f=>f.startsWith(v+'_'))))throw new Error('Supply the timestamps of successfully applied CMS migrations.');
const url=new URL(process.env.SUPABASE_DB_POOLER_URL);url.password=process.env.SUPABASE_DATABASE_PASSWORD;
if(!url.password||!existsSync('supabase/migrations'))throw new Error('Database configuration required.');
const result=spawnSync('supabase',['migration','repair',...versions,'--status','applied','--db-url',url.toString()],{encoding:'utf8',env:process.env});
const safe=value=>(value??'').replaceAll(process.env.SUPABASE_DATABASE_PASSWORD,'[REDACTED]').replaceAll(encodeURIComponent(process.env.SUPABASE_DATABASE_PASSWORD),'[REDACTED]');
process.stdout.write(safe(result.stdout));process.stderr.write(safe(result.stderr));process.exit(result.status??1);
