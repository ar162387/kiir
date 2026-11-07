'use client';

import {useActionState,useState} from 'react';
import {saveHero} from '@/lib/cms/hero-actions';
import {emptyPageHero,type PageHero as Hero} from '@/lib/cms/page-hero';
import PageHero from '@/components/PageHero';
import ImagePicker from './ImagePicker';

export default function HeroEditor({name,setting,initial,version}:{name:string;setting:string;initial?:Hero;version:number}){
 const [hero,setHero]=useState(initial??emptyPageHero);
 const [uploading,setUploading]=useState(false);
 const [state,action,pending]=useActionState(saveHero,{});
 return <form action={action} className="cms-panel cms-form">
  <h3>{name}</h3>
  <p className="cms-help">Preview the wide banner and adjust which part of the image appears behind the text.</p>
  <PageHero hero={hero}><div className={`mx-auto max-w-[1520px] px-4 sm:px-6 ${setting==='hero_about'?'py-11 sm:py-14':'py-10 sm:py-12'}`}>
   {setting==='hero_about'&&<div className="text-xs uppercase tracking-wider text-teal">About us</div>}
   <h1 className="font-serif text-[clamp(30px,4vw,46px)] leading-[1.08] text-navy">{setting==='hero_about'?'Kashmir Institute of International Relations':name}</h1>
   <p className="mt-3 max-w-[60ch] text-[15px] leading-relaxed text-slate">Preview of the introduction and image placement on the public page.</p>
  </div></PageHero>
  <ImagePicker assetId={hero.image_id} url={hero.url} images={[]} onChange={(image_id,url)=>setHero({...hero,image_id,url})} onBusy={setUploading}/>
  <div className="cms-editor-type">
   <label>Horizontal position<input name="x" type="range" min={0} max={100} value={hero.x} onChange={e=>setHero({...hero,x:Number(e.target.value)})}/></label>
   <label>Vertical position<input name="y" type="range" min={0} max={100} value={hero.y} onChange={e=>setHero({...hero,y:Number(e.target.value)})}/></label>
  </div>
  <input type="hidden" name="key" value={setting}/><input type="hidden" name="image" value={hero.image_id??''}/><input type="hidden" name="version" value={state.version??version}/>
  <button className="cms-button" disabled={pending||uploading}>{pending?'Saving…':'Save hero'}</button>
  {state.message&&<p role={state.error?'alert':'status'}>{state.message}</p>}
 </form>;
}
