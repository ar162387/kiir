'use client';
import Link from '@/components/LocalizedLink';
import {useState} from 'react';
import {useLanguage} from './LanguageProvider';
import {Diamond} from './icons';
import type {Announcement} from '@/lib/cms/settings-types';
export default function NewsTicker({items}:{items:Announcement[]}){
 const {t,isUr}=useLanguage();const[paused,setPaused]=useState(false);const[hover,setHover]=useState(false);const[focus,setFocus]=useState(false);
 if(!items.length)return null;
 const stopped=paused||hover||focus;
 return <div role="region" aria-label={isUr?'اعلانات':'Announcements'} className="kiir-ticker border-b border-white/10" style={{backgroundColor:'#6f1d2b'}} onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)} onFocusCapture={()=>setFocus(true)} onBlurCapture={e=>{if(!e.currentTarget.contains(e.relatedTarget))setFocus(false);}}>
 <div className="mx-auto flex max-w-[1520px] items-center gap-4 px-4 sm:px-6 min-h-[42px]">
 <span className="hidden flex-none bg-cyan px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-navy sm:block">{t.ticker}</span>
 <div className="kiir-ticker-viewport min-w-0 flex-1 overflow-hidden"><div className="kiir-marquee flex w-max items-center gap-14" style={{animation:`kiirMarquee ${28+items.length*6}s linear infinite`,animationDirection:isUr?'reverse':'normal',animationPlayState:stopped?'paused':'running'}}>
 {[0,1].map(copy=><div key={copy} className="kiir-ticker-copy flex items-center gap-14" aria-hidden={copy===1?true:undefined} inert={copy===1?true:undefined}>{items.map(a=>{const ur=isUr&&a.segments_ur.some(p=>p.text.trim());const parts=ur?a.segments_ur:a.segments;return <span key={a.id} lang={ur?'ur':'en'} dir={ur?'rtl':'ltr'} className={`inline-flex flex-none items-center whitespace-nowrap py-2 text-[#E8EDF3] ${ur?'font-urdu text-sm leading-9':'text-[13.5px]'}`}><Diamond className="mx-3 flex-none text-cyan"/><span>{parts.map((p,i)=>p.href&&copy===0?<Link href={p.href} key={i} className="underline underline-offset-4 hover:text-white focus:outline-2 focus:outline-cyan">{p.text}</Link>:<span key={i}>{p.text}</span>)}</span></span>;})}</div>)}
 </div></div><button type="button" aria-pressed={paused} onClick={()=>setPaused(v=>!v)} className="flex-none border border-white/40 px-2 py-1 text-xs text-white">{paused?(isUr?'چلائیں':'Play'):(isUr?'روکیں':'Pause')}</button>
 </div></div>;
}
