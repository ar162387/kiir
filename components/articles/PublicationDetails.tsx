import type {ContentItem} from '@/lib/types';
export function PublicationDetails({item,isUr}:{item:ContentItem;isUr:boolean}){
 const document=isUr?item.document_ur_url:item.document_url;
 return <>
 {item.authors&&<p lang="en" dir="ltr" className="font-mono text-sm mt-5">{item.authors}</p>}
 {item.publication_kind==='newsletters'&&item.issue&&<p lang="en" dir="ltr" className="publication-meta"><strong>{item.issue}</strong></p>}
 {item.publication_kind==='research-papers'&&item.abstract&&<section className="publication-meta"><h2>{isUr?'خلاصہ':'Abstract'}</h2><p lang="en" dir="ltr">{item.abstract}</p>{item.keywords&&<p><strong>{isUr?'کلیدی الفاظ':'Keywords'}: </strong><span lang="en" dir="ltr">{item.keywords}</span></p>}</section>}
 {item.publication_kind==='research-papers'&&Boolean((isUr?item.contents_ur:item.contents)?.length)&&<nav className="publication-meta" aria-label="Article contents"><h2>{isUr?'مندرجات':'Contents'}</h2><ol>{(isUr?item.contents_ur:item.contents)?.map(h=><li key={h.id}><a href={`#${h.id}`}>{h.text}</a></li>)}</ol></nav>}
 {item.publication_kind==='short-stories'&&item.epigraph&&<p lang="en" dir="ltr" className="publication-epigraph">{item.epigraph}</p>}
 {document&&<p className="my-6"><a href={document} className="border border-teal px-4 py-3 text-teal inline-block">{isUr?'پی ڈی ایف ڈاؤن لوڈ کریں':'Download publication PDF'} ↓</a></p>}
 {item.is_event&&item.event_start&&<section className="content-event-details"><h2 className="font-serif text-xl mb-3">{isUr?'تقریب کی تفصیلات':'Event details'}</h2><p><time dateTime={item.event_start}>{new Intl.DateTimeFormat(isUr?'ur-PK':'en-GB',{dateStyle:'full',timeStyle:'short',timeZone:item.event_zone??'Asia/Karachi'}).format(new Date(item.event_start))}</time> ({item.event_zone})</p>{item.event_end&&<p>— {new Intl.DateTimeFormat(isUr?'ur-PK':'en-GB',{dateStyle:'medium',timeStyle:'short',timeZone:item.event_zone??'Asia/Karachi'}).format(new Date(item.event_end))}</p>}<p className="capitalize">{item.event_status}</p>{item.event_venue&&<p>{item.event_venue}</p>}{item.event_url&&<p><a href={item.event_url}>Event information ↗</a></p>}{item.registration_url&&<p><a href={item.registration_url}>Registration ↗</a></p>}</section>}
 </>;
}
