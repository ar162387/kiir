'use server';

import {randomUUID} from 'node:crypto';
import {revalidatePath} from 'next/cache';
import {redirect} from 'next/navigation';
import {requireStaff} from './session';
import {createStaffClient} from '@/lib/supabase/auth';
import {validUUID} from './content-types';
import {slugifyProgram} from './program-types';
import {wordCount,type MediaKind} from './media-workspace';

export async function saveMediaEntry(_: {error?:string},form:FormData):Promise<{error?:string}>{
 await requireStaff('content.edit');
 const operation=String(form.get('operation'));
 const kind=String(form.get('kind')) as MediaKind;
 if(!['album','photo','documentary'].includes(kind))return {error:'Choose a media type.'};
 if(operation==='delete'){await requireStaff('content.delete');if(form.get('confirm')!=='on')return {error:'Confirm permanent deletion first.'};}
 if(operation==='publish'||operation==='unpublish')await requireStaff('content.publish');
 const title=String(form.get('title')??'').trim();
 const description=String(form.get('description')??'').trim();
 const images=form.getAll('image').map(String);
 const videos=form.getAll('video').map(String);
 const asset_ids=form.getAll('asset').map(String);
 if(!asset_ids.every(validUUID))return {error:'Choose valid uploaded media.'};
 if(operation==='draft'||operation==='publish'){
  if(kind!=='photo'&&!title)return {error:'Enter a title.'};
  if(kind==='album'&&wordCount(description)>100)return {error:'Use 100 words or fewer for the album description.'};
  if(operation==='publish'){
   if(kind==='album'&&images.length<2)return {error:'Add at least two photos to publish this album.'};
   if(kind==='photo'&&images.length!==1)return {error:'Choose a photo before publishing.'};
   if(kind==='documentary'&&(!description||videos.length!==1))return {error:'Add a description and a video before publishing.'};
  }
 }
 const prefix=slugifyProgram(title).slice(0,85).replace(/-+$/,'')||kind;
 const client=await createStaffClient();
 const {data,error}=await client.rpc('cms_save_media_entry',{
  target:String(form.get('id')??'')||null,entry_kind:kind,
  payload:{title,description,asset_ids,slug:`${prefix}-${randomUUID().slice(0,8)}`},
  expected_version:Number(form.get('version'))||null,operation
 });
 if(error)return {error:error.code==='PT409'?'This entry changed in another session. Reload before saving.':error.code==='23514'?error.message:'Your changes could not be saved. Try again.'};
 revalidatePath('/','layout');
 const path=kind==='documentary'?'/admin/documentaries':'/admin/gallery';
 redirect(operation==='delete'?`${path}?notice=deleted`:`${path}/${data}?notice=${operation}`);
}
