import {notFound} from 'next/navigation';
import Link from '@/components/AppLink';
import {requireStaff} from '@/lib/cms/session';
import {createStaffClient} from '@/lib/supabase/auth';
import {validUUID} from '@/lib/cms/content-types';
import type {MediaKind,MediaRecord} from '@/lib/cms/media-workspace';
import MediaWorkspaceEditor from './MediaWorkspaceEditor';

type Section='gallery'|'documentaries';

export async function MediaWorkspaceList({section,page=1,notice}:{section:Section;page?:number;notice?:string}){
 await requireStaff('content.edit');
 const client=await createStaffClient();
 const path='/admin/'+section;
 const kinds=section==='gallery'?['album','photo']:['documentary'];
 const {data,error}=await client.from('media_entries').select('id,kind,draft').in('kind',kinds).order('updated_at',{ascending:false}).order('id').range((page-1)*24,page*24);
 if(error)throw Error('Media entries could not be loaded.');
 const ids=data.slice(0,24).map(row=>row.id);
 const {data:published}=ids.length?await client.from('media_entries_live').select('id').in('id',ids):{data:[]};
 return <>
  <header className="cms-page-heading"><h1>{section==='gallery'?'Photo Gallery':'Documentaries'}</h1>
   <div className="cms-media-tools">{section==='gallery'?<><Link className="cms-button" href={path+'/new?type=album'}>New album</Link><Link className="cms-secondary-button" href={path+'/new?type=photo'}>Add standalone photo</Link></>:<Link className="cms-button" href={path+'/new'}>New documentary</Link>}</div>
  </header>
  {notice==='deleted'&&<p role="status">Entry deleted. Unused files are queued for cleanup. <Link href="/admin/media">View media library</Link></p>}
  {!data.length&&<p className="cms-panel">No entries here yet.</p>}
  <div className="cms-card-grid">{data.slice(0,24).map(row=>{
   const draft=row.draft as MediaRecord['draft'];
   return <article className="cms-panel" key={row.id}><span className="cms-pill">{published?.some(item=>item.id===row.id)?'Published':'Draft'}</span><h2><Link href={path+'/'+row.id}>{draft.title||draft.items[0]?.alt||draft.items[0]?.name||'Standalone photo'}</Link></h2><p className="cms-help">{row.kind}</p></article>;
  })}</div>
  <nav className="cms-media-tools" aria-label="Media pages">{page>1&&<Link href={path+'?page='+(page-1)}>Previous</Link>}{data.length>24&&<Link href={path+'?page='+(page+1)}>Next</Link>}</nav>
 </>;
}

export async function MediaWorkspaceEdit({section,id,type,notice}:{section:Section;id:string;type?:string;notice?:string}){
 const staff=await requireStaff('content.edit');
 const client=await createStaffClient();
 let kind:MediaKind=section==='documentaries'?'documentary':type==='photo'?'photo':'album';
 let record:MediaRecord|undefined;
 let live=false;
 if(id!=='new'){
  if(!validUUID(id))notFound();
  const [{data,error},{data:published}]=await Promise.all([client.from('media_entries').select('*').eq('id',id).maybeSingle(),client.from('media_entries_live').select('id').eq('id',id).maybeSingle()]);
  if(error)throw Error('This media entry could not be loaded.');
  if(!data||(section==='documentaries')!==(data.kind==='documentary'))notFound();
  record=data as MediaRecord;
  kind=record.kind;
  live=Boolean(published);
 }
 return <>
  <Link className="cms-text-link" href={'/admin/'+section}>← {section==='gallery'?'Photo Gallery':'Documentaries'}</Link>
  <h1>{record?'Edit':'New'} {kind==='photo'?'standalone photo':kind}</h1>
  {notice&&<p role="status" className="cms-feedback cms-feedback-success">{notice==='publish'?'Published.':notice==='unpublish'?'Unpublished.':'Draft saved.'}</p>}
  <MediaWorkspaceEditor key={record?.version??kind} kind={kind} record={record} live={live} canDelete={staff.role==='admin'}/>
 </>;
}
