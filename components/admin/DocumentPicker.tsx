'use client';
import {generatePdfCover} from '@/lib/cms/pdf-cover';
import type {MediaImage} from '@/lib/cms/program-types';
import {useRef,useState} from 'react';
export default function DocumentPicker({label,id,onChange,onBusy,autoCover=false,hasGeneratedCover=false}:{label:string;id:string|null;autoCover?:boolean;hasGeneratedCover?:boolean;onChange:(id:string|null,cover?:{image:MediaImage;url:string})=>void;onBusy:(busy:boolean)=>void}){
 const source=useRef<File|null>(null);
 const input=useRef<HTMLInputElement>(null);const[busy,setBusy]=useState(false),[progress,setProgress]=useState(''),[error,setError]=useState(''),[name,setName]=useState(''),[pending,setPending]=useState<{id:string;filename:string}|null>(null);
 async function confirm(upload:{id:string;filename:string}){const response=await fetch('/api/documents/finalize',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(upload)});const result=await response.json();if(!response.ok)throw Error(result.error??'The PDF could not be confirmed.');setName(result.name);setPending(null);
 let cover;
 if(autoCover&&source.current){
  setProgress('Creating a cover from page one…');
  try{cover=await generatePdfCover(await source.current.arrayBuffer(),upload.filename);}
  catch{setError('The PDF is ready. Choose a custom image if you would like a cover.');}
 }
 source.current=null;
 onChange(result.id,cover);setProgress('PDF uploaded and verified. Save to attach it.');}
 async function upload(file:File){source.current=file;setBusy(true);onBusy(true);setError('');setPending(null);setProgress('Preparing PDF…');try{
 if(!file.name.toLowerCase().endsWith('.pdf')||file.size<5||file.size>10*1024*1024)throw Error('Choose a PDF up to 10 MB.');if(!new TextDecoder().decode(await file.slice(0,5).arrayBuffer()).startsWith('%PDF-'))throw Error('The selected file is not a PDF.');
 const signed=await fetch('/api/documents/upload',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({filename:file.name.slice(0,255)})});const config=await signed.json();if(!signed.ok)throw Error(config.error??'The upload could not be started.');
 const body=new FormData();body.set('file',file,file.name);for(const[k,v]of Object.entries({...config.parameters,api_key:config.apiKey,signature:config.signature}))body.set(k,String(v));
 await new Promise<void>((resolve,reject)=>{const xhr=new XMLHttpRequest();xhr.open('POST',`https://api.cloudinary.com/v1_1/${config.cloud}/raw/upload`);xhr.timeout=120000;xhr.upload.onprogress=e=>setProgress(e.lengthComputable?`Uploading PDF ${Math.round(e.loaded/e.total*100)}%…`:'Uploading PDF…');xhr.onload=()=>xhr.status>=200&&xhr.status<300?resolve():reject(Error('The PDF upload failed. Please try again.'));xhr.onerror=()=>reject(Error('The upload connection was interrupted.'));xhr.ontimeout=()=>reject(Error('The upload took too long. Please try again.'));xhr.send(body);});
 const upload={id:config.id,filename:file.name.slice(0,255)};setPending(upload);setProgress('Verifying PDF…');await confirm(upload);
 }catch(e){setError(e instanceof Error?e.message:'PDF upload failed.');setProgress('');}finally{setBusy(false);onBusy(false);if(input.current)input.current.value='';}}
 async function regenerate(){
  if(!id)return;
  setBusy(true);onBusy(true);setError('');setProgress('Creating a cover from page one…');
  try{
   const response=await fetch(`/api/documents/${id}`);
   if(!response.ok)throw Error();
   onChange(id,await generatePdfCover(await response.arrayBuffer(),name||'Publication PDF'));
   setProgress('Cover ready. Save to keep it.');
  }catch{setError('The first page could not be rendered. You can choose a custom image.');setProgress('');}
  finally{setBusy(false);onBusy(false);}
 }
 return <div className="cms-panel cms-document-picker"><label>{label}<input ref={input} type="file" accept="application/pdf,.pdf" disabled={busy} onChange={e=>{const file=e.target.files?.[0];if(file)void upload(file);}}/></label>{id&&<p className="cms-help">{name||'PDF attached'} · <a href={`/api/documents/${id}`} target="_blank" rel="noopener noreferrer">Download</a> <button type="button" disabled={busy} onClick={()=>onChange(null)}>Remove PDF</button></p>}<p role="status" className="cms-help">{progress}</p>{error&&<p role="alert" className="cms-feedback cms-feedback-error">{error}</p>}{pending&&!busy&&<button type="button" className="cms-secondary-button" onClick={async()=>{setBusy(true);onBusy(true);setError('');try{await confirm(pending);}catch(e){setError((e as Error).message);}finally{setBusy(false);onBusy(false);}}}>Retry PDF confirmation</button>}{id&&autoCover&&!hasGeneratedCover&&!busy&&<button className="cms-secondary-button" type="button" onClick={()=>void regenerate()}>Use the PDF’s first page as cover</button>}<p className="cms-help">PDF up to 10 MB. The original formatting is preserved.</p></div>;
}
