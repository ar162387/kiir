'use server';
import {revalidatePath} from 'next/cache';
import {redirect} from 'next/navigation';
import {requireStaff} from './session';
import {createStaffClient} from '@/lib/supabase/auth';
import {documentText,documentAssets,validateContent,type ContentDraft} from './content-types';
import type {ActionState} from './actions';
export async function saveContent(_previous:ActionState,form:FormData):Promise<ActionState>{
 await requireStaff('content.edit');
 const operation=String(form.get('operation')??'draft');
 if(operation==='delete'){const member=await requireStaff();if(member.role!=='admin'||form.get('confirm')!=='on')return {error:'Admin confirmation is required for permanent deletion.'};}
 let draft:ContentDraft;
 try{const raw=String(form.get('payload'));if(raw.length>450000)throw Error();draft=JSON.parse(raw);const error=validateContent(draft,operation==='publish');if(error&&!['delete','archive','unpublish'].includes(operation))return {error};
 draft.asset_ids=[...new Set([draft.cover_id,draft.document_id,draft.document_ur_id,...draft.gallery.map(i=>i.id),...documentAssets(draft.body),...documentAssets(draft.body_ur)].filter(Boolean) as string[])];draft.body_text=documentText(draft.body).trim();draft.body_text_ur=documentText(draft.body_ur).trim();
 }catch{return {error:'This document could not be saved. Check its size and fields; your work remains in the editor.'};}
 const client=await createStaffClient();
 const {data:id,error}=await client.rpc('cms_save_content',{payload:{...draft,id:String(form.get('id')??'')||null},expected_version:Number(form.get('version'))||null,operation});
 if(error){if(error.code==='23505')return {error:'This URL is already used or reserved. Choose another URL.'};if(error.code==='PT409')return {error:'Someone changed this record. Copy your work and reload before saving.'};if(error.code==='23514')return {error:error.message};return {error:'The content could not be saved. Your changes are still in this form.'};}
 revalidatePath('/','layout');
 redirect(operation==='delete'?'/admin/content?notice=deleted':`/admin/content/${id}?notice=${operation}`);
}
