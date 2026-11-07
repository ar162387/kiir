'use client';

import {brandLogoUrl} from '@/lib/branding';
import { useRef, useState } from 'react';
import Image from 'next/image';
import ImageLibrary from './ImageLibrary';
import {confirmImage,uploadImage} from '@/lib/cms/image-upload';
import { imageDeliveryUrl, type MediaImage } from '@/lib/cms/program-types';

async function optimizeImage(file:File) {
  if(!['image/jpeg','image/png','image/webp'].includes(file.type)) throw new Error('Choose a JPG, PNG, or WebP image.');
  if(file.size>40*1024*1024) throw new Error('This image is too large to process safely. Choose an image smaller than 40 MB.');
  const bitmap=await createImageBitmap(file,{imageOrientation:'from-image'});
  try {
    if(bitmap.width*bitmap.height>80_000_000) throw new Error('This image has unusually large dimensions. Choose a smaller image.');
    const scale=Math.min(1,2400/Math.max(bitmap.width,bitmap.height));
    const canvas=document.createElement('canvas');
    canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));
    const context=canvas.getContext('2d');
    if(!context) throw new Error('Your browser could not prepare this image.');
    context.drawImage(bitmap,0,0,canvas.width,canvas.height);
    const blob=await new Promise<Blob|null>(resolve=>canvas.toBlob(resolve,file.type,0.86));
    if(!blob||blob.size>10*1024*1024) throw new Error('This image could not be optimized within the upload limit.');
    return blob;
  } finally {bitmap.close();}
}

export default function ImagePicker({url,onChange,onBusy,variant='image'}:{variant?:'image'|'logo';assetId:string|null;url:string|null;images:MediaImage[];
  onChange:(id:string|null,url:string|null,image?:MediaImage)=>void;onBusy:(busy:boolean)=>void}) {
  const input=useRef<HTMLInputElement>(null);
  const [busy,setBusy]=useState(false);
  const [progress,setProgress]=useState('');
  const [error,setError]=useState('');
  const [alt,setAlt]=useState('');
  const [pending,setPending]=useState<{id:string;filename:string;alt:string}|null>(null);
  async function confirm(upload:{id:string;filename:string;alt:string}) {
    const result=await confirmImage(upload);
    onChange(result.image.id,result.url,result.image);setPending(null);setProgress('Image uploaded and ready to save.');
  }
  async function upload(file:File) {
    setBusy(true);onBusy(true);setError('');setProgress('Optimizing image…');setPending(null);
    try {
      const optimized=await optimizeImage(file);
      const upload=await uploadImage(new File([optimized],file.name,{type:optimized.type}),alt,setProgress);
      setPending(upload);setProgress('Verifying image…');await confirm(upload);
    } catch(e) {setError(e instanceof Error?e.message:'The image could not be uploaded.');setProgress('');}
    finally {setBusy(false);onBusy(false);if(input.current)input.current.value='';}
  }
  return <div className={`cms-image-picker cms-image-picker-${variant}`}>
    {url?<div className="cms-image-preview">
      <Image unoptimized src={brandLogoUrl(url)} width={640} height={360} alt={variant==='logo'?'Organization logo preview':'Selected image preview'} />
      <button type="button" className="cms-image-remove" disabled={busy} onClick={()=>{onChange(null,null);setProgress('Image will be removed when you save.');}}>Remove image</button>
    </div>:<div className="cms-image-empty">{variant==='logo'?'Choose an organization logo.':'Add a photo for this content.'}</div>}
    <div className="cms-image-options">
    {variant==='image'&&<label>Description for a new upload<input value={alt} maxLength={500} onChange={e=>setAlt(e.target.value)} placeholder="Describe what is in the photo"/></label>}
    <label>{variant==='logo'?'Upload logo':'Upload image'}<input ref={input} type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={e=>{const file=e.target.files?.[0];if(file)void upload(file);}} /></label>
    <p className="cms-help">JPG, PNG, or WebP. Images are resized and optimized automatically. Changes take effect when you save.</p>
    <ImageLibrary onSelect={([image])=>onChange(image.id,imageDeliveryUrl(image),image)}/>
    <p className="cms-help" aria-live="polite">{progress}</p>
    {error&&<p className="cms-feedback cms-feedback-error" role="alert">{error}</p>}
    {pending&&!busy&&<button type="button" className="cms-secondary-button" onClick={async()=>{setBusy(true);onBusy(true);setError('');try{await confirm(pending);}catch(e){setError(e instanceof Error?e.message:'Confirmation failed.');}finally{setBusy(false);onBusy(false);}}}>Retry image confirmation</button>}
  </div></div>;
}
