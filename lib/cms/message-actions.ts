'use server';
import {revalidatePath} from 'next/cache';
import {requireStaff} from './session';
import {createStaffClient} from '@/lib/supabase/auth';
import {validUUID} from './content-types';
export async function markMessageRead(form:FormData){await requireStaff('users.manage');const id=String(form.get('id'));if(!validUUID(id))throw Error('Invalid message.');const client=await createStaffClient();const{error}=await client.from('contact_messages').update({is_read:form.get('read')==='true'}).eq('id',id);if(error)throw Error('The message could not be updated.');revalidatePath('/admin/messages');}
