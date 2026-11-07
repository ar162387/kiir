'use client';

import {useEffect,useState} from 'react';
import type {GalleryBatch} from '@/lib/cms/media-public';
import PhotoViewer from './PhotoViewer';

export default function PhotoCollage({initial,pivot,ur}:{initial:GalleryBatch;pivot:string;ur:boolean}){
 const [photos,setPhotos]=useState(initial.photos);
 const [cursor,setCursor]=useState(initial.cursor);
 const [visibleRows,setVisibleRows]=useState(2);
 const [rowSize,setRowSize]=useState(4);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState(false);
 useEffect(()=>{
  const media=window.matchMedia('(max-width: 639px)');
  function update(){setRowSize(media.matches?2:4);}
  update();media.addEventListener('change',update);
  return ()=>media.removeEventListener('change',update);
 },[]);
 async function more(){
  setError(false);
  if(photos.length>=(visibleRows+2)*rowSize||!cursor){setVisibleRows(rows=>rows+2);return;}
  setBusy(true);
  try{
   const response=await fetch('/api/gallery?'+new URLSearchParams({pivot,cursor}));
   if(!response.ok)throw Error();
   const next:GalleryBatch=await response.json();
   setPhotos(items=>[...items,...next.photos.filter(photo=>!items.some(item=>item.id===photo.id))]);
   setCursor(next.cursor);setVisibleRows(rows=>rows+2);
  }catch{setError(true);}
  finally{setBusy(false);}
 }
 if(!photos.length)return <p className="p-6 text-slate">{ur?'ابھی کوئی تصویر نہیں ہے۔':'No photos have been published yet.'}</p>;
 const rows=Array.from({length:Math.min(visibleRows,Math.ceil(photos.length/rowSize))},(_,index)=>photos.slice(index*rowSize,(index+1)*rowSize));
 return <section aria-label={ur?'تصاویر':'Photos'}>
  {rows.map((row,index)=><PhotoViewer key={index} photos={row} ur={ur} collage/>)}
  <div className="p-5 text-center">{error&&<p role="alert">{ur?'تصاویر لوڈ نہیں ہو سکیں۔':'More photos could not be loaded.'}</p>}
   {(cursor||photos.length>visibleRows*rowSize)&&<button className="border border-line px-5 py-2 font-semibold text-navy" type="button" disabled={busy} onClick={()=>void more()}>{busy?(ur?'لوڈ ہو رہا ہے…':'Loading…'):error?(ur?'دوبارہ کوشش کریں':'Retry'):(ur?'مزید دیکھیں':'Load more')}</button>}
  </div>
 </section>;
}
