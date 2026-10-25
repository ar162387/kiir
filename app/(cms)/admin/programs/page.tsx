import Link from '@/components/AppLink';
import Image from 'next/image';
import type { Metadata } from 'next';
import { requireStaff } from '@/lib/cms/session';
import { createStaffClient } from '@/lib/supabase/auth';

export const metadata:Metadata={title:'Programs'};
export default async function ProgramsPage({searchParams}:{searchParams:Promise<{notice?:string}>}) {
  await requireStaff('program.edit');
  const {notice}=await searchParams;
  const client=await createStaffClient();
  const {data,error}=await client.from('programs').select('id,slug,name,name_ur,description,image_url,is_active,sort_order').order('sort_order').order('name').order('id');
  return <>
    <div className="cms-page-heading"><div><p className="cms-eyebrow">EDITORIAL</p><h1>Our programs</h1><p className="cms-description">The areas of work that connect KIIR’s stories, activities, and publications.</p></div><Link className="cms-button" href="/admin/programs/new">Add program +</Link></div>
    {notice==='saved'&&<p role="status" className="cms-feedback cms-feedback-success">Program saved. The website now reflects these changes.</p>}
    {notice==='deleted'&&<p role="status" className="cms-feedback cms-feedback-success">Program deleted. Unused uploaded images are queued for automatic cleanup.</p>}
    {error?<p role="alert" className="cms-feedback cms-feedback-error">Programs could not be loaded. Please try again.</p>:data?.length?<div className="cms-program-grid">{data.map(program=><article className="cms-panel cms-program-card" key={program.id}>
      {program.image_url?<div className="cms-program-card-image"><Image unoptimized src={program.image_url} width={640} height={360} alt=""/></div>:<div className="cms-program-card-image cms-image-empty">No image</div>}
      <div className="cms-program-card-body"><div className="cms-member-heading"><span className="cms-eyebrow">ORDER {program.sort_order}</span><span className={`cms-pill ${program.is_active?'':'cms-pill-muted'}`}>{program.is_active?'Visible':'Hidden'}</span></div><h2>{program.name}</h2>{program.name_ur&&<p className="cms-program-urdu" lang="ur" dir="rtl">{program.name_ur}</p>}<p className="cms-description">{program.description}</p><div className="cms-program-card-actions"><Link className="cms-text-link" href={`/admin/programs/${program.id}`}>Edit program →</Link>{program.is_active&&<Link className="cms-text-link" target="_blank" rel="noopener noreferrer" href={`/programs/${program.slug}`}>View page ↗</Link>}</div></div>
    </article>)}</div>:<section className="cms-panel cms-empty-state"><h2>Create your first program.</h2><p>Add a name, description, and photo to introduce an area of KIIR’s work.</p><Link href="/admin/programs/new" className="cms-button">Add program</Link></section>}
  </>;
}
