'use client';

import {useEffect,useRef,useState} from 'react';
import Image from 'next/image';
import {imageDeliveryUrl,type MediaImage} from '@/lib/cms/program-types';

export default function ImageLibrary({onSelect,multiple=false}:{onSelect:(images:MediaImage[])=>void;multiple?:boolean}){
 const dialog=useRef<HTMLDialogElement>(null);
 const [open,setOpen]=useState(false);
 const [search,setSearch]=useState('');
 const [images,setImages]=useState<MediaImage[]>([]);
 const [selected,setSelected]=useState<MediaImage[]>([]);
 const [more,setMore]=useState(false);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const [request,setRequest]=useState({q:'',offset:0});

 useEffect(()=>{
  if(!open)return;
  const controller=new AbortController();
  fetch('/api/media/images?'+new URLSearchParams({q:request.q,offset:String(request.offset)}),{signal:controller.signal})
   .then(async response=>{if(!response.ok)throw Error();return response.json();})
   .then(result=>{setImages(previous=>request.offset?[...previous,...result.images]:result.images);setMore(result.more);})
   .catch(()=>{if(!controller.signal.aborted)setError('Could not load images. Try again.');})
   .finally(()=>{if(!controller.signal.aborted)setBusy(false);});
  return ()=>controller.abort();
 },[request,open]);

 function load(q:string,offset=0){
  setBusy(true);setError('');setRequest({q,offset});
 }
 function finish(items:MediaImage[]){
  onSelect(items);
  dialog.current?.close();
 }
 return <>
  <button type="button" className="cms-secondary-button" onClick={()=>{setOpen(true);setSelected([]);load(search);dialog.current?.showModal();}}>Choose from media library</button>
  <dialog ref={dialog} className="cms-media-dialog" onClose={()=>setOpen(false)}>
   <h3>Choose {multiple?'images':'an image'}</h3>
   <div className="cms-media-tools">
    <input aria-label="Search images" placeholder="Search by description or filename" value={search} onChange={e=>setSearch(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();load(search);}}}/>
    <button type="button" className="cms-secondary-button" onClick={()=>load(search)}>Search</button>
    <button type="button" className="cms-secondary-button" onClick={()=>dialog.current?.close()}>Close</button>
   </div>
   <div className="cms-media-grid">{images.map(image=><button type="button" key={image.id} aria-pressed={multiple?selected.some(item=>item.id===image.id):undefined} onClick={()=>{
    if(!multiple)finish([image]);
    else setSelected(items=>items.some(item=>item.id===image.id)?items.filter(item=>item.id!==image.id):[...items,image]);
   }}><Image unoptimized src={imageDeliveryUrl(image,320)} alt="" width={320} height={220}/><span>{image.alt_text||image.original_filename||'Uploaded image'}</span></button>)}</div>
   {busy&&<p role="status">Loading images…</p>}
   {error&&<p role="alert">{error}</p>}
   {!busy&&!error&&!images.length&&<p>No matching images.</p>}
   {(more||error)&&<button type="button" className="cms-secondary-button" disabled={busy} onClick={()=>load(request.q,error?request.offset:images.length)}>{error?'Retry':'Load more'}</button>}
   {multiple&&<button type="button" className="cms-button" disabled={!selected.length} onClick={()=>finish(selected)}>Use selected images ({selected.length})</button>}
  </dialog>
 </>;
}
