'use client';

import {useEffect,useRef} from 'react';
import Image from 'next/image';
import Link from '@/components/LocalizedLink';
import FieldText from '@/components/FieldText';
import {useLanguage} from '@/components/LanguageProvider';
import {contentHref} from '@/lib/content-link';
import {formatDate} from '@/lib/format';
import {publicationLabels} from '@/lib/cms/content-types';
import {TYPE_LABEL,type ContentItem} from '@/lib/types';

export default function ContentMoodboard({items}:{items:ContentItem[]}){
 const {isUr}=useLanguage();
 const grid=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  if(!grid.current||!('ResizeObserver' in window))return;
  const observer=new ResizeObserver(entries=>{
   for(const {target} of entries){
    const card=target.parentElement;
    if(card)card.style.gridRowEnd=`span ${Math.ceil(target.getBoundingClientRect().height/8)+2}`;
   }
  });
  for(const card of grid.current.querySelectorAll('.kiir-moodboard-card'))observer.observe(card);
  grid.current.dataset.measured='true';
  return ()=>observer.disconnect();
 },[items]);
 return <div className="kiir-moodboard" ref={grid}>{items.map(item=>{
  const download=Boolean(item.download_url);
  const title=<FieldText en={item.title} ur={item.title_ur} serif/>;
  const author=item.publication_kind&&item.authors?.trim();
  return <div key={item.slug} className={item.cover_width&&item.cover_height&&item.cover_width/item.cover_height>1.75?'kiir-wide-card':undefined}>
   <Link href={contentHref(item,isUr?'ur':'en')} prefetch={download?false:undefined} className="kiir-moodboard-card">
    {item.thumbnail_url&&<div className="kiir-moodboard-cover">
     <Image unoptimized src={item.thumbnail_url} alt={item.cover_alt??''} width={item.cover_width??640} height={item.cover_height??420}/>
     {download&&<div className="kiir-download-title">{title}{author&&<span className="text-sm" dir="auto">{author}</span>}<small>{isUr?'پی ڈی ایف ڈاؤن لوڈ کریں':'Download PDF'}</small></div>}
    </div>}
    {(!download||!item.thumbnail_url)&&<>
     <h2 className={isUr?'font-urdu':'font-serif'}>{title}</h2>
     {author&&<p className="text-sm text-slate" dir="auto">{author}</p>}
     <p className="kiir-moodboard-meta">{(isUr?null:item.publication_kind&&publicationLabels[item.publication_kind])??TYPE_LABEL[item.type][isUr?'ur':'en']} · {formatDate(item.item_date,isUr?'ur':'en')}{download&&(isUr?' · پی ڈی ایف':' · Download PDF')}</p>
     {item.short_description&&<div className="line-clamp-3 text-sm text-slate"><FieldText en={item.short_description} ur={item.short_description_ur}/></div>}
     {!download&&item.short_description&&<span className="text-sm font-semibold text-teal underline underline-offset-2">{isUr?'مزید پڑھیں…':'Read more…'}</span>}
    </>}
   </Link>
  </div>;
 })}</div>;
}
