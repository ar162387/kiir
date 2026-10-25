'use server';
import {revalidatePath} from 'next/cache';
import {requireStaff} from './session';
import {createStaffClient} from '@/lib/supabase/auth';
import {settingPermission,validateSettings,type SettingKey,type SettingsValue} from './settings-types';
export type SettingsState={error?:string;success?:boolean;version?:number};
export async function saveSettings(_previous:SettingsState,form:FormData):Promise<SettingsState>{
 const key=String(form.get('key')) as SettingKey;
 if(!['org','about','contact','social','ticker'].includes(key))return {error:'Invalid settings section.'};
 await requireStaff(settingPermission(key));
 const raw=String(form.get('value')??'');if(raw.length>100000)return {error:'These settings are too large.'};
 let value:SettingsValue;try{value=JSON.parse(raw);}catch{return {error:'The settings could not be read.'};}
 const issue=validateSettings(key,value);if(issue)return {error:issue};
 const client=await createStaffClient();const{data,error}=await client.rpc('cms_save_settings',{setting_key:key,payload:value,expected_version:Number(form.get('version'))});
 if(error)return {error:error.code==='PT409'?'These settings changed in another session. Reload before saving.':'The settings could not be saved. Check the fields and try again.'};
 revalidatePath('/','layout');return {success:true,version:data};
}
