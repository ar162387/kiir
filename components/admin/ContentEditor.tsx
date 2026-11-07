'use client';
import {useActionState,useEffect,useState} from 'react';
import Link from '@/components/AppLink';
import {eventLocal,eventInstant} from '@/lib/cms/event-time';
import {saveContent} from '@/lib/cms/content-actions';
import {emptyDraft,pdfOnly,publicationLabels,type ContentDraft,type ContentRecord,type PublicationCategory} from '@/lib/cms/content-types';
import {imageDeliveryUrl,type MediaImage} from '@/lib/cms/program-types';
import dynamic from 'next/dynamic';
import ProgramSelector from './ProgramSelector';

const RichTextEditor=dynamic(()=>import('./RichTextEditor'),{
 ssr:false,loading:()=> <p role="status" className="cms-help">Loading article editor…</p>,
});
import ImagePicker from './ImagePicker';
import ImageLibrary from './ImageLibrary';
import DocumentPicker from './DocumentPicker';
import AutoGrowTextarea from './AutoGrowTextarea';

export default function ContentEditor({record,programs,images=[],canDelete=false}:{record?:ContentRecord;programs?:{id:string;name:string;is_active:boolean}[];images?:MediaImage[];canDelete?:boolean}){
 const [d,setD]=useState<ContentDraft>({...emptyDraft(),...record?.draft});const [state,action,pending]=useActionState(saveContent,{});
 const [eventError,setEventError]=useState('');
 const [language,setLanguage]=useState<'en'|'ur'>('en');const [dirty,setDirty]=useState(false);const [uploads,setUploads]=useState<Record<string,boolean>>({});
 const busy=Object.values(uploads).some(Boolean);const update=(changes:Partial<ContentDraft>)=>{setD(p=>({...p,...changes}));setDirty(true);};
 useEffect(()=>{if(!dirty||pending)return;const warn=(e:BeforeUnloadEvent)=>{e.preventDefault();};const navigate=(e:MouseEvent)=>{const anchor=(e.target as Element).closest('a');if(anchor&&!anchor.target&&!window.confirm('Leave this editor? Unsaved changes will be lost.'))e.preventDefault();};window.addEventListener('beforeunload',warn);document.addEventListener('click',navigate,true);return()=>{window.removeEventListener('beforeunload',warn);document.removeEventListener('click',navigate,true);};},[dirty,pending]);
 const input=(key:keyof ContentDraft,label:string,multiline=false,max=500)=>{const value=String(d[key]??'');return <label key={key}>{label}{multiline?<AutoGrowTextarea value={value} maxLength={max} rows={4} onChange={e=>update({[key]:e.target.value})}/>:<AutoGrowTextarea singleLine value={value} maxLength={max} onChange={e=>update({[key]:e.target.value})}/>}</label>;};
 const imageURL=(id:string|null)=>id?(d.asset_urls?.[id]??(images.find(i=>i.id===id)?imageDeliveryUrl(images.find(i=>i.id===id)!):null)):null;
 const galleryImages=d.gallery.map(g=>({...g,url:imageURL(g.id)??'',caption:language==='ur'?g.caption_ur:g.caption}));
 const kind=d.publication_kind;
 const pdf=pdfOnly(d);
 const type=d.is_event?'event':kind??'article';
 const description=language==='en'?'body':'body_ur';
 const changeType=(value:string)=>update({is_event:value==='event',publication_kind:value==='event'||value==='article'?null:value as PublicationCategory,presentation:value==='research-papers'||value==='reports'?'pdf':'written'});
 return <form action={action} className="cms-form cms-content-form">
 <input type="hidden" name="id" value={record?.id??''}/><input type="hidden" name="version" value={record?.version??''}/><input type="hidden" name="payload" value={JSON.stringify(d)}/>
 <div className="cms-editor-status"><span className="cms-pill">{record?.status??'New draft'}</span><span role="status">{pending&&<><span className="kiir-spinner" aria-hidden="true"/> </>}{dirty?'Unsaved changes':'Working copy'} · {pending?'Saving…':'Draft edits do not change the live page.'}</span>{record&&<Link href={`/admin/content/${record.id}/preview`} target="_blank">Preview saved draft ↗</Link>}{record?.status==='published'&&<Link href={`/articles/${record.slug}`} target="_blank">View published article ↗</Link>}</div>
 {state.error&&<p role="alert" className="cms-feedback cms-feedback-error">{state.error}</p>}
 <section className="cms-panel cms-editor-essentials"><div className="cms-editor-type">
 <label>Content type<select value={type} disabled={busy} onChange={e=>changeType(e.target.value)}><option value="article">Article</option><option value="event">Event</option>{Object.entries(publicationLabels).map(([value,label])=><option value={value} key={value}>{label}</option>)}</select></label>
 {kind==='research-papers'&&<label>Publishing format<select value={d.presentation??'written'} disabled={busy} onChange={e=>update({presentation:e.target.value as 'pdf'|'written'})}><option value="pdf">Downloadable PDF</option><option value="written">Article with optional PDF</option></select></label>}
 </div>
 <div className="cms-tabs" role="group" aria-label="Content language">{(['en','ur'] as const).map(l=><button type="button" aria-pressed={language===l} key={l} onClick={()=>setLanguage(l)}>{l==='en'?'English':'اردو (optional)'}</button>)}</div>
 <div className="cms-field-stack" lang={language} dir={language==='ur'?'rtl':'ltr'}>
 {input(language==='en'?'title':'title_ur',language==='en'?'Title':'Urdu title',false,240)}
 {d.is_event?<label>{language==='en'?'Description (optional)':'Urdu description (optional)'}<AutoGrowTextarea value={d[description].content?.map(node=>node.content?.map(child=>child.text??'').join('')??'').join('\n')??''} maxLength={12000} onChange={e=>update({[description]:{type:'doc',content:e.target.value.split('\n').map(line=>({type:'paragraph',content:line?[{type:'text',text:line}]:[]}))}})}/></label>
 :!pdf&&<>{input(language==='en'?'excerpt':'excerpt_ur',kind==='opinion-articles'||language==='ur'?'Summary (optional)':'Summary',true,1200)}
 <RichTextEditor key={`${language}-${kind}`} variant={kind} assets={d.asset_urls} language={language} label={language==='en'?'Article body':'Urdu article body'} value={d[description]} onChange={body=>update({[description]:body})} images={galleryImages}/></>}
 </div>
 {kind&&<><div hidden={language!=='en'}><DocumentPicker key="en-pdf" label={pdf?'PDF':'Publication PDF (optional)'} id={d.document_id} autoCover={pdf} hasGeneratedCover={Boolean(d.pdf_cover_id)} onChange={(document_id,cover)=>update({document_id,pdf_cover_id:cover?.image.id??null,asset_urls:cover?{...d.asset_urls,[cover.image.id]:cover.url}:d.asset_urls})} onBusy={b=>setUploads(p=>({...p,pdf:b}))}/></div><div hidden={language!=='ur'}><DocumentPicker key="ur-pdf" label="Urdu publication PDF" id={d.document_ur_id} onChange={document_ur_id=>update({document_ur_id})} onBusy={b=>setUploads(p=>({...p,pdfUr:b}))}/></div></>}
 <label className="cms-checkbox"><input type="checkbox" checked={d.ur_ready} onChange={e=>update({ur_ready:e.target.checked})}/>Publish Urdu translation when complete</label><p className="cms-help">Urdu drafts remain private until this is selected. Otherwise the complete English article appears in the Urdu site shell.</p></section>
 {!d.is_event&&<section className="cms-panel"><h2>Byline and details</h2>{input('authors',pdf||!kind||kind==='newsletters'?'Author / byline (optional)':'Author / byline',false,500)}
 {kind==='research-papers'&&!pdf&&<>{input('abstract','Abstract (required to publish)',true,8000)}{input('keywords','Keywords, separated by commas',false,1000)}{input('references','References — one entry per line',true,15000)}</>}
 {kind==='short-stories'&&input('epigraph','Epigraph (optional)',true,2000)}{kind==='newsletters'&&input('issue','Issue / edition (required to publish)',false,200)}
 </section>}
 {d.is_event&&<section className="cms-panel"><h2>Event details</h2><p className="cms-help">Dates and times use the selected event time zone.</p>{(['event_start','event_end'] as const).map(key=><label key={key}>{key==='event_start'?'Start date and time (optional)':'End date and time (optional)'}<input type="datetime-local" value={eventLocal(d[key],d.event_zone)} onChange={e=>{try{update({[key]:eventInstant(e.target.value,d.event_zone)});setEventError('');}catch(e){setEventError((e as Error).message);}}}/></label>)}{eventError&&<p role="alert">{eventError}</p>}{input('event_zone','Display time zone',false,100)}<label>Status<select value={d.event_status} onChange={e=>update({event_status:e.target.value})}><option value="scheduled">Scheduled</option><option value="cancelled">Cancelled</option><option value="postponed">Postponed</option></select></label>{input('event_venue','Venue or online meeting details')}{input('event_url','Event information URL')}{input('registration_url','Registration URL')}</section>}
 <section className="cms-panel"><h2>Cover image</h2>{pdf&&d.pdf_cover_id&&!d.cover_id&&<p className="cms-help">Using page one of the PDF. Choose another image to override it.</p>}<ImagePicker assetId={d.cover_id} url={imageURL(d.cover_id??d.pdf_cover_id??null)} images={images} onChange={(id,url,image)=>update({cover_id:id,pdf_cover_id:!id&&!d.cover_id?null:d.pdf_cover_id,cover_alt:image?.alt_text??'',asset_urls:id&&url?{...d.asset_urls,[id]:url}:d.asset_urls})} onBusy={b=>setUploads(p=>({...p,cover:b}))}/>{d.cover_id&&input('cover_alt','Cover image description (alt text)',false,500)}</section>
 {!pdf&&<section className="cms-panel"><h2>Images and captions</h2><p className="cms-help">Upload up to 30 images. Add descriptions for accessibility.</p>{d.gallery.map((g,n)=><div key={n} className="cms-panel"><h3>Image {n+1}</h3><ImagePicker assetId={g.id||null} url={imageURL(g.id)} images={images} onChange={(id,url,image)=>update({gallery:d.gallery.map((v,i)=>i===n?{...v,id:id??'',alt:image?.alt_text??''}:v),asset_urls:id&&url?{...d.asset_urls,[id]:url}:d.asset_urls})} onBusy={b=>setUploads(p=>({...p,[`gallery${n}`]:b}))}/><label>Alt text<AutoGrowTextarea singleLine value={g.alt} maxLength={500} onChange={e=>update({gallery:d.gallery.map((v,i)=>i===n?{...v,alt:e.target.value}:v)})}/></label><label>Caption<AutoGrowTextarea singleLine value={g.caption} maxLength={1000} onChange={e=>update({gallery:d.gallery.map((v,i)=>i===n?{...v,caption:e.target.value}:v)})}/></label><label>Urdu caption (optional)<AutoGrowTextarea singleLine dir="rtl" value={g.caption_ur} maxLength={1000} onChange={e=>update({gallery:d.gallery.map((v,i)=>i===n?{...v,caption_ur:e.target.value}:v)})}/></label><button className="cms-danger-button" type="button" onClick={()=>update({gallery:d.gallery.filter((_,i)=>i!==n)})}>Remove gallery image</button></div>)}<button className="cms-secondary-button" type="button" disabled={d.gallery.length>=30||busy} onClick={()=>update({gallery:[...d.gallery,{id:'',alt:'',caption:'',caption_ur:''}]})}>Add image +</button>
 {d.gallery.length<30&&<ImageLibrary multiple onSelect={selected=>{
  const additions=selected.filter(image=>!d.gallery.some(item=>item.id===image.id)).slice(0,30-d.gallery.length);
  update({gallery:[...d.gallery,...additions.map(image=>({id:image.id,alt:image.alt_text??'',caption:'',caption_ur:''}))],
   asset_urls:{...d.asset_urls,...Object.fromEntries(additions.map(image=>[image.id,imageDeliveryUrl(image)]))}});
 }}/>}
 </section>}
 <ProgramSelector initialPrograms={programs} selected={d.program_ids} onChange={program_ids=>update({program_ids})}/>
 <details className="cms-panel"><summary>Advanced publishing settings</summary>{input('slug','Page address (generated from title if blank)',false,100)}<p className="cms-help">Search title and description are optional. The article title and summary are used automatically when these are empty. Published articles enter the sitemap automatically; drafts stay private. Search engines decide indexing and rankings.</p><label className="cms-checkbox"><input type="checkbox" checked={d.is_featured} onChange={e=>update({is_featured:e.target.checked})}/>Feature on homepage</label><label>Feature order<input type="number" min={0} max={9999} value={d.feature_order} onChange={e=>update({feature_order:Number(e.target.value)})}/></label>{input('seo_title','Search title (optional)',false,240)}{input('seo_description','Search description (optional)',true,500)}</details>
 <div className="cms-publish-bar" aria-busy={pending}><button className="cms-secondary-button" name="operation" value="draft" disabled={busy||pending}>{pending?'Saving…':'Save draft'}</button><button className="cms-button" name="operation" value="publish" disabled={busy||pending}>{pending?'Working…':record?.status==='published'?'Publish changes':'Publish'}</button>{busy&&<span role="status">Finish uploads before saving.</span>}{record?.status==='published'&&<button name="operation" value="unpublish" disabled={busy||pending}>Unpublish</button>}{record&&<button name="operation" value="archive" disabled={busy||pending}>Archive</button>}</div>
 {record&&canDelete&&<details className="cms-panel cms-danger-zone"><summary>Permanent deletion</summary><p>This permanently removes the article and queues its unused files for deletion. Archive keeps it recoverable.</p><label className="cms-checkbox"><input name="confirm" type="checkbox"/>Permanently delete this article and its unused files</label><button name="operation" value="delete" className="cms-danger-button" disabled={busy||pending}>Delete permanently</button></details>}
 </form>;
}
