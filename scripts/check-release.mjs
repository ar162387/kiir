import {readdirSync,readFileSync,statSync} from 'node:fs';
import assert from 'node:assert/strict';
const required=['SUPABASE_PROJECT_URL','SUPABASE_PUBLISHABLE_KEY','SUPABASE_SECRET_KEY','CLOUDINARY_CLOUD_NAME','CLOUDINARY_API_KEY','CLOUDINARY_API_SECRET'];for(const name of required)assert.ok(process.env[name],'Missing runtime configuration: '+name);
assert.ok(!process.env.SUPABASE_PUBLISHABLE_KEY.startsWith('sb_secret_'),'A secret key was used as the public key');
function files(path){return readdirSync(path).flatMap(name=>{const p=path+'/'+name;return statSync(p).isDirectory()?files(p):[p];});}
const secrets=['SUPABASE_SECRET_KEY','CLOUDINARY_API_SECRET','SUPABASE_DATABASE_PASSWORD'].map(name=>process.env[name]).filter(v=>v&&v.length>=8);
for(const path of files('.next/static')){const data=readFileSync(path);for(const secret of secrets)assert.ok(!data.includes(Buffer.from(secret)),'A server secret was found in the public build.');}
console.log('PASS runtime configuration is present and server secrets are absent from public build files.');
const html=await(await fetch('http://localhost:3001/')).text();const paths=[...html.matchAll(/src="(\/_next\/static\/[^"?]+\.js)/g)].map(m=>m[1]);assert.ok(paths.length);
for(const path of paths){const data=readFileSync('.next/'+path.replace('/_next/',''),'utf8');assert.ok(!/ProseMirror|@tiptap|cms-rich-editor/.test(data),'The publication editor leaked into a public page bundle.');}
console.log('PASS public homepage bundles exclude the publication editor.');
