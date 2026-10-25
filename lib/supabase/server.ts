import {createClient,type SupabaseClient} from '@supabase/supabase-js';
import {getSupabaseConfig} from './config';
let client:SupabaseClient|null=null;
export function getSupabase(){const config=getSupabaseConfig();if(!config)return null;return client??=createClient(config.url,config.key,{auth:{persistSession:false,autoRefreshToken:false}});}
export function isSupabaseConfigured(){return Boolean(getSupabaseConfig());}
