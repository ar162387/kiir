import Link from '@/components/AppLink';
import ContentGrid from '@/components/admin/ContentGrid';
import {requireStaff} from '@/lib/cms/session';
import {createStaffClient} from '@/lib/supabase/auth';
import {publicationLabels} from '@/lib/cms/content-types';
import {getContentPage} from '@/lib/cms/content-list-query';
import type {ContentFilters} from '@/lib/cms/content-list';

export default async function ContentList({searchParams}:{searchParams:Promise<ContentFilters&{notice?:string}>}){
 await requireStaff('content.edit');
 const {q,status,kind,program,notice}=await searchParams;
 const filters={q,status,kind,program};
 const client=await createStaffClient();
 const [initial,{data:programs}]=await Promise.all([
  getContentPage(filters).catch(()=>null),
  client.from('programs').select('id,name').order('sort_order')
 ]);
 return <>
  <header className="cms-page-heading"><div><p className="cms-eyebrow">EDITORIAL</p><h1>Content</h1></div><Link className="cms-button" href="/admin/content/new">Create content +</Link></header>
  {notice==='deleted'&&<p role="status" className="cms-feedback cms-feedback-success">Content deleted. Unused files are queued for cleanup.</p>}
  <form className="cms-panel cms-content-filters" method="get">
   <label>Search title<input name="q" defaultValue={q} maxLength={150}/></label>
   <label>Status<select name="status" defaultValue={status??''}><option value="">All statuses</option><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select></label>
   <label>Type<select name="kind" defaultValue={kind??''}><option value="">All content</option><option value="article">Article</option><option value="event">Event</option>{Object.entries(publicationLabels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
   <label>Program<select name="program" defaultValue={program??''}><option value="">All programs</option>{programs?.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
   <button className="cms-secondary-button">Filter</button>
  </form>
  {initial?<ContentGrid key={JSON.stringify(filters)} initial={initial} filters={filters}/>:<p role="alert">Content could not be loaded. Refresh to try again.</p>}
 </>;
}
