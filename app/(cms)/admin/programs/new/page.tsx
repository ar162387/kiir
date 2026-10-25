import type { Metadata } from 'next';
import { requireStaff } from '@/lib/cms/session';
import { getReadyImages } from '@/lib/cms/media-queries';
import ProgramEditor from '@/components/admin/ProgramEditor';

export const metadata:Metadata={title:'New program'};
export default async function NewProgramPage() {
  await requireStaff('program.edit');
  const images=await getReadyImages();
  return <><p className="cms-eyebrow">OUR PROGRAMS</p><h1>A new area of work.</h1><p className="cms-description">Create a program once and it becomes available throughout the website.</p><ProgramEditor images={images} canDelete={false}/></>;
}
