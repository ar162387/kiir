'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
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

export default function ImagePicker({assetId,url,images,onChange,onBusy,variant='image'}:{variant?:'image'|'logo';assetId:string|null;url:string|null;images:MediaImage[];
  onChange:(id:string|null,url:string|null)=>void;onBusy:(busy:boolean)=>void}) {
  const input=useRef<HTMLInputElement>(null);
  const [busy,setBusy]=useState(false);
  const [progress,setProgress]=useState('');
  const [error,setError]=useState('');
  const [pending,setPending]=useState<{id:string;filename:string}|null>(null);
  async function confirm(upload:{id:string;filename:string}) {
    const response=await fetch('/api/media/finalize',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(upload)});
    const result=await response.json();
    if(!response.ok) throw new Error(result.error??'The upload could not be confirmed.');
    onChange(result.image.id,result.url);setPending(null);setProgress('Image uploaded and ready to save.');
  }
  async function upload(file:File) {
    setBusy(true);onBusy(true);setError('');setProgress('Optimizing image…');setPending(null);
    try {
      const optimized=await optimizeImage(file);
      const signed=await fetch('/api/media/sign',{method:'POST'});
      const config=await signed.json();
      if(!signed.ok) throw new Error(config.error??'The upload could not be started.');
      const body=new FormData();
      body.set('file',optimized,file.name);body.set('api_key',config.apiKey);body.set('signature',config.signature);
      Object.entries(config.parameters).forEach(([key,value])=>body.set(key,String(value)));
      await new Promise<void>((resolve,reject)=>{
        const xhr=new XMLHttpRequest();
        xhr.open('POST',`https://api.cloudinary.com/v1_1/${config.cloud}/image/upload`);
        xhr.timeout=120000;
        xhr.upload.onprogress=e=>setProgress(e.lengthComputable?`Uploading ${Math.round(e.loaded/e.total*100)}%…`:'Uploading…');
        xhr.onload=()=>xhr.status>=200&&xhr.status<300?resolve():reject(new Error('Cloudinary could not accept this image. Please retry.'));
        xhr.onerror=()=>reject(new Error('The upload connection was interrupted. Please retry.'));
        xhr.ontimeout=()=>reject(new Error('The upload took too long. Please retry.'));
        xhr.send(body);
      });
      const upload={id:config.id,filename:file.name.slice(0,255)};
      setPending(upload);setProgress('Verifying image…');await confirm(upload);
    } catch(e) {setError(e instanceof Error?e.message:'The image could not be uploaded.');setProgress('');}
    finally {setBusy(false);onBusy(false);if(input.current)input.current.value='';}
  }
  return <div className={`cms-image-picker cms-image-picker-${variant}`}>
    {url?<div className="cms-image-preview">
      <Image unoptimized src={url} width={640} height={360} alt={variant==='logo'?'Organization logo preview':'Selected image preview'} />
      <button type="button" className="cms-image-remove" disabled={busy} onClick={()=>{onChange(null,null);setProgress('Image will be removed when you save.');}}>Remove image</button>
    </div>:<div className="cms-image-empty">{variant==='logo'?'Choose an organization logo.':'Add a photo for this content.'}</div>}
    <label>{variant==='logo'?'Upload logo':'Upload image'}<input ref={input} type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={e=>{const file=e.target.files?.[0];if(file)void upload(file);}} /></label>
    <p className="cms-help">JPG, PNG, or WebP. Images are resized and optimized automatically. Changes take effect when you save.</p>
    {images.length>0&&<label>Or reuse an existing image<select disabled={busy} value={images.some(i=>i.id===assetId)?assetId??'':''} onChange={e=>{const image=images.find(i=>i.id===e.target.value);if(image)onChange(image.id,imageDeliveryUrl(image));}}><option value="">Choose from uploaded images</option>{images.map(image=><option key={image.id} value={image.id}>{image.original_filename||'Uploaded image'}</option>)}</select></label>}
    <p className="cms-help" aria-live="polite">{progress}</p>
    {error&&<p className="cms-feedback cms-feedback-error" role="alert">{error}</p>}
    {pending&&!busy&&<button type="button" className="cms-secondary-button" onClick={async()=>{setBusy(true);onBusy(true);setError('');try{await confirm(pending);}catch(e){setError(e instanceof Error?e.message:'Confirmation failed.');}finally{setBusy(false);onBusy(false);}}}>Retry image confirmation</button>}
  </div>;
}
