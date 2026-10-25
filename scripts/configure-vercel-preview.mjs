import {spawnSync} from 'node:child_process';
// Values are sent only over stdin, never command arguments or logs.
const target=process.argv[2]??'preview';
if(!['preview','production'].includes(target))throw Error('Choose preview or production.');
const variables=['SUPABASE_PROJECT_URL','SUPABASE_PUBLISHABLE_KEY','SUPABASE_SECRET_KEY','CLOUDINARY_CLOUD_NAME','CLOUDINARY_API_KEY','CLOUDINARY_API_SECRET'];
for(const name of variables){if(!process.env[name])throw Error('Missing '+name);const result=spawnSync('vercel',['env','add',name,target,'--sensitive','--yes','--force'],{input:process.env[name],encoding:'utf8',env:process.env});if(result.status!==0)throw Error('Could not configure '+name);console.log('Configured '+target+' variable: '+name);}
const result=spawnSync('vercel',['env','add','NEXT_PUBLIC_SITE_URL',target,'--yes','--force'],{input:'https://kiir-opal.vercel.app',encoding:'utf8',env:process.env});if(result.status!==0)throw Error('Could not configure canonical site URL');console.log('Configured the canonical production site URL. Database passwords are not deployment variables.');
