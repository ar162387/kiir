'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireStaff } from './session';
import { validateProgram } from './program-types';
import { createStaffClient } from '@/lib/supabase/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import type { ActionState } from './actions';

const text=(form:FormData,key:string)=>String(form.get(key)??'').trim();
const uuid=(value:string)=>/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(value);

export async function saveProgram(_previous:ActionState,form:FormData):Promise<ActionState> {
  await requireStaff('program.edit');
  const payload={id:text(form,'id')||undefined,name:text(form,'name'),slug:text(form,'slug'),name_ur:text(form,'name_ur'),
    description:text(form,'description'),description_ur:text(form,'description_ur'),long_description:text(form,'long_description'),
    long_description_ur:text(form,'long_description_ur'),image_asset_id:text(form,'image_asset_id')||null,
    remove_image:form.get('remove_image')==='true',sort_order:Number(form.get('sort_order')),is_active:form.get('is_active')==='on'};
  const validation=validateProgram(payload);
  if(validation) return {error:validation};
  if(payload.id&&!uuid(payload.id)) return {error:'Invalid program. Reload and try again.'};
  const client=await createStaffClient();
  const {error}=await client.rpc('cms_save_program',{payload,expected_version:payload.id?Number(form.get('version')):null});
  if(error) {
    if(error.code==='23505') return {error:'This program URL is already used or reserved. Choose a different URL.'};
    if((error.code==='PT409'||error.code==='40001')) return {error:'Another person changed this program. Reload the page before saving.'};
    if(error.code==='23514') return {error:'Check the program fields and choose a ready image before saving.'};
    return {error:'The program could not be saved. Your changes are still in this form.'};
  }
  revalidatePath('/', 'layout');
  redirect('/admin/programs?notice=saved');
}

export async function deleteProgram(_previous:ActionState,form:FormData):Promise<ActionState> {
  await requireStaff('program.delete');
  const id=text(form,'id');
  if(!uuid(id)||form.get('confirm')!=='on') return {error:'Confirm that you want to permanently delete this program.'};
  const client=await createStaffClient();
  const {error}=await client.rpc('cms_delete_program',{target:id,expected_version:Number(form.get('version'))});
  if(error) return {error:(error.code==='PT409'||error.code==='40001')?'This program changed. Reload before deleting.':'The program could not be deleted. Please try again.'};
  revalidatePath('/','layout');
  redirect('/admin/programs?notice=deleted');
}

export async function retryMediaCleanup():Promise<ActionState> {
  await requireStaff('media.delete');
  const admin=createAdminClient();
  const {error:resetError}=await admin.from('media_jobs').update({status:'queued',attempts:0,not_before:new Date().toISOString(),last_error:null}).eq('status','failed');
  if(resetError) return {error:'Cleanup jobs could not be retried.'};
  const {data,error}=await admin.rpc('cms_run_media_cleanup');
  if(error) return {error:'Cleanup could not run. The scheduled worker will retry.'};
  revalidatePath('/admin/media');
  return data?.configured ? {success:'Cleanup checked. Newly dispatched deletions finish in the next scheduled pass.'} : {error:'Automatic cleanup credentials are not configured. Contact the site administrator.'};
}
