'use client';

import {useCallback,useEffect,useRef,useState} from 'react';
import Image from 'next/image';
import Link from '@/components/AppLink';
import {publicationLabels,type PublicationCategory} from '@/lib/cms/content-types';
import type {ContentFilters,ContentPage} from '@/lib/cms/content-list';

export default function ContentGrid({initial,filters}:{initial:ContentPage;filters:ContentFilters}){
 const [items,setItems]=useState(initial.items);
 const [cursor,setCursor]=useState(initial.cursor);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState(false);
 const pending=useRef(false);
 const sentinel=useRef<HTMLButtonElement>(null);
 const load=useCallback(async()=>{
  if(!cursor||pending.current)return;
  pending.current=true;setBusy(true);setError(false);
  try{
   const params=new URLSearchParams({cursor});
   for(const [key,value] of Object.entries(filters))if(value)params.set(key,value);
   const response=await fetch('/api/cms/content?'+params);
   if(!response.ok)throw Error();
   const next:ContentPage=await response.json();
   setItems(previous=>[...previous,...next.items.filter(item=>!previous.some(record=>record.id===item.id))]);
   setCursor(next.cursor);
  }catch{setError(true);}
  finally{pending.current=false;setBusy(false);}
 },[cursor,filters]);
 useEffect(()=>{
  if(error||!sentinel.current||!('IntersectionObserver' in window))return;
  const observer=new IntersectionObserver(([entry])=>{if(entry.isIntersecting)void load();},{rootMargin:'240px'});
  observer.observe(sentinel.current);
  return ()=>observer.disconnect();
 },[error,load]);
 if(!items.length)return <p className="cms-panel">No content matches these filters.</p>;
 return <>
  <div className="cms-card-grid">{items.map(item=><article className="cms-panel" key={item.id}>
   {item.image_url&&<Image unoptimized src={item.image_url} width={480} height={300} alt="" loading="lazy"/>}
   <div className="cms-card-meta"><span className="cms-pill">{item.status}</span><time dateTime={item.date}>{new Intl.DateTimeFormat('en',{dateStyle:'medium',timeZone:'Asia/Karachi'}).format(new Date(item.date))}</time></div>
   <h2><Link href={`/admin/content/${item.id}`}>{item.title}</Link></h2>
   <p className="cms-help">{publicationLabels[item.kind_label as PublicationCategory]??(item.kind_label==='event'?'Event':'Article')}{item.author&&` · ${item.author}`}</p>
  </article>)}</div>
  {error&&<p role="alert">More content could not be loaded.</p>}
  {cursor&&<button ref={sentinel} disabled={busy} className="cms-secondary-button" onClick={()=>void load()}>{busy?'Loading…':error?'Retry':'Load more'}</button>}
 </>;
}
