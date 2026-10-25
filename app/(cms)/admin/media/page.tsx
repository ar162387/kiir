import type { Metadata } from 'next';
import Image from 'next/image';
import { requireStaff } from '@/lib/cms/session';
import { createStaffClient } from '@/lib/supabase/auth';
import { imageDeliveryUrl } from '@/lib/cms/program-types';
import MediaCleanup from '@/components/admin/MediaCleanup';

export const metadata:Metadata={title:'Media library'};
export default async function MediaPage(){
  const member=await requireStaff('program.edit');
  const client=await createStaffClient();
  const [{data:images,error},{data:jobs}]=await Promise.all([
    client.from('media_assets').select('id,public_id,cloud_name,version,original_filename,width,height,bytes,status,resource_type,media_references(program_id,content_id,slot)').eq('status','ready').order('created_at',{ascending:false}).limit(100),
    member.role==='admin'?client.from('media_jobs').select('id,status,last_error,attempts,not_before').in('status',['queued','processing','failed']).order('id',{ascending:false}).limit(30):Promise.resolve({data:null}),
  ]);
  return <><p className="cms-eyebrow">EDITORIAL</p><h1>Media library</h1><p className="cms-description">Images and publication PDFs uploaded through the CMS. Reuse images from the editor’s image selector.</p>
    {member.role==='admin'&&<section className="cms-panel cms-cleanup-panel"><div><h2>Automatic cleanup</h2><p className="cms-description">Unused files are deleted by the scheduled worker. Shared files stay safe.</p><p className="cms-help">{jobs?.length??0} queued, processing, or failed jobs shown. Unattached uploads expire after 24 hours.</p></div><MediaCleanup/>{jobs?.some(j=>j.status==='failed')&&<p role="alert" className="cms-feedback cms-feedback-error">Some deletions need attention. Retry cleanup; contact the site administrator if they keep failing.</p>}</section>}
    {error?<p role="alert" className="cms-feedback cms-feedback-error">The media library could not be loaded.</p>:images?.length?<div className="cms-media-grid">{images.map(image=><article className="cms-panel cms-media-card" key={image.id}>{image.resource_type==='raw'?<a className="cms-button cms-button-secondary" href={`/api/documents/${image.id}`}>Download PDF ↓</a>:<Image unoptimized src={imageDeliveryUrl(image)} width={640} height={360} alt={image.original_filename||'Uploaded image'}/>}<div><h3>{image.original_filename||'Uploaded image'}</h3><p className="cms-help">{image.resource_type==='image'?`${image.width} × ${image.height} · `:'PDF · '}{Math.round(image.bytes/1024)} KB</p><span className="cms-pill">{new Set(image.media_references?.map(r=>r.program_id??r.content_id)).size} content references</span></div></article>)}</div>:<section className="cms-panel cms-empty-state"><h2>Your files will appear here.</h2><p>Upload images or PDFs while editing a program or publication. Image sizes are optimized automatically.</p></section>}
  </>;
}
