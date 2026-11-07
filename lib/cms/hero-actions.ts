'use server';

import {revalidatePath} from 'next/cache';
import {requireStaff} from './session';
import {createStaffClient} from '@/lib/supabase/auth';

type HeroState={message?:string;version?:number;error?:boolean};
export async function saveHero(_:HeroState,form:FormData):Promise<HeroState>{
 await requireStaff('branding.edit');
 const client=await createStaffClient();
 const {data,error}=await client.rpc('cms_save_page_hero',{
  target:String(form.get('key')),asset:String(form.get('image')??'')||null,
  x:Number(form.get('x')),y:Number(form.get('y')),expected_version:Number(form.get('version'))
 });
 if(error)return {message:error.code==='PT409'?'This hero changed in another session. Reload to continue.':'The hero could not be saved.',error:true};
 revalidatePath('/','layout');
 return {message:'Hero saved.',version:Number(data)};
}
