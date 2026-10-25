import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { requireStaff } from '@/lib/cms/session';
import { createStaffClient } from '@/lib/supabase/auth';
import { getReadyImages } from '@/lib/cms/media-queries';
import type { ManagedProgram } from '@/lib/cms/program-types';
import ProgramEditor from '@/components/admin/ProgramEditor';

export const metadata:Metadata={title:'Edit program'};
export default async function EditProgramPage({params}:{params:Promise<{id:string}>}) {
  const member=await requireStaff('program.edit');
  const {id}=await params;
  if(!/^[\da-f-]{36}$/i.test(id)) notFound();
  const client=await createStaffClient();
  const [{data,error},images]=await Promise.all([client.from('programs').select('*').eq('id',id).maybeSingle(),getReadyImages()]);
  if(error) throw new Error('This program could not be loaded.');
  if(!data)notFound();
  return <><p className="cms-eyebrow">OUR PROGRAMS</p><h1>Edit program</h1><p className="cms-description">Update how {data.name} appears across the website.</p><ProgramEditor program={data as ManagedProgram} images={images} canDelete={member.role==='admin'}/></>;
}
