'use client';

import {usePathname} from 'next/navigation';
import TopLoadingLine from './TopLoadingLine';

type Variant='public'|'article'|'cms'|'editor'|'login';
export default function PageSkeleton({variant='public'}:{variant?:Variant}){
 const pathname=usePathname();
 const isUr=pathname==='/ur'||pathname.startsWith('/ur/');
 const cms=variant==='cms'||variant==='editor'||variant==='login';
 return <section className={`kiir-loading kiir-loading-${variant}`} aria-busy="true" aria-label={isUr?'صفحہ کھل رہا ہے':'Loading page'} lang={isUr?'ur':'en'} dir={isUr?'rtl':'ltr'}>
  <TopLoadingLine isUr={isUr}/>
  <div aria-hidden="true">
   <div className="kiir-skeleton kiir-skeleton-eyebrow"/><div className="kiir-skeleton kiir-skeleton-title"/><div className="kiir-skeleton kiir-skeleton-intro"/>
   {variant==='article'||variant==='editor'?<div className="kiir-skeleton-reading"><div className="kiir-skeleton kiir-skeleton-cover"/>{Array.from({length:6},(_,i)=><div key={i} className="kiir-skeleton kiir-skeleton-line"/>)}</div>:variant==='login'?<div className="kiir-skeleton-panel">{[0,1,2].map(i=><div key={i} className="kiir-skeleton kiir-skeleton-field"/>)}</div>:<div className="kiir-skeleton-grid">{[0,1,2].map(i=><div key={i} className="kiir-skeleton-card">{!cms&&<div className="kiir-skeleton kiir-skeleton-image"/>}<div className="kiir-skeleton-copy">{[0,1,2].map(j=><div key={j} className="kiir-skeleton kiir-skeleton-line"/>)}</div></div>)}</div>}
  </div>
 </section>;
}
