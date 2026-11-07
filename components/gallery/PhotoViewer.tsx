'use client';

import {useRef,useState} from 'react';
import Image from 'next/image';
import type {WorkspaceAsset} from '@/lib/cms/media-workspace';

export default function PhotoViewer({photos,ur,collage=false,items=photos}:{photos:WorkspaceAsset[];ur:boolean;collage?:boolean;items?:WorkspaceAsset[]}){
 const [index,setIndex]=useState(0);
 const dialog=useRef<HTMLDialogElement>(null);
 const selected=photos[index];
 return <>
  <div className={collage?'kiir-photo-row':'kiir-album-grid'}>{items.map(photo=>photo.type==='video'?<video key={photo.id} controls playsInline preload="none" src={photo.url}
   aria-label={ur?'البم کی ویڈیو':'Album video'} className="w-full bg-navy" style={{aspectRatio:`${photo.width}/${photo.height}`}}/>:<button key={photo.id} type="button" style={collage?{flexGrow:photo.width/photo.height,flexBasis:0}:undefined} aria-label={photo.alt||(ur?'تصویر دیکھیں':'View photo')+` ${photos.indexOf(photo)+1}`} onClick={()=>{setIndex(photos.indexOf(photo));dialog.current?.showModal();}}>
   <Image unoptimized src={photo.url.replace('w_1600','w_800')} width={photo.width} height={photo.height} alt={photo.alt}/>
  </button>)}</div>
  <dialog ref={dialog} className="kiir-photo-dialog" aria-label={ur?'تصویر':'Photo viewer'} onKeyDown={e=>{
   if(e.key==='ArrowRight')setIndex(i=>(i+1)%photos.length);
   if(e.key==='ArrowLeft')setIndex(i=>(i+photos.length-1)%photos.length);
  }}>
   {selected&&<Image unoptimized src={selected.url} width={selected.width} height={selected.height} alt={selected.alt}/>}
   <div className="kiir-photo-controls">
    {photos.length>1&&<button type="button" onClick={()=>setIndex(i=>(i+photos.length-1)%photos.length)}>{ur?'پچھلی':'Previous'}</button>}
    <button type="button" onClick={()=>dialog.current?.close()}>{ur?'بند کریں':'Close'}</button>
    {photos.length>1&&<button type="button" onClick={()=>setIndex(i=>(i+1)%photos.length)}>{ur?'اگلی':'Next'}</button>}
   </div>
  </dialog>
 </>;
}
