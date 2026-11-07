'use client';

import {useEffect,useRef,useState} from 'react';
import type {WorkspaceAsset} from '@/lib/cms/media-workspace';

async function post(url:string,body:unknown){
 const response=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
 const result=await response.json();
 if(!response.ok)throw Error(result.error??'The request could not be completed.');
 return result;
}

export default function VideoPicker({onReady,onBusy}:{onReady:(item:WorkspaceAsset)=>void;onBusy:(busy:boolean)=>void}){
 const [message,setMessage]=useState('');
 const [error,setError]=useState('');
 const [busy,setBusy]=useState(false);
 const [pendingId,setPendingId]=useState<string|null>(null);
 const cancelled=useRef(false);
 const timer=useRef<ReturnType<typeof setTimeout>|null>(null);
 useEffect(()=>{cancelled.current=false;return ()=>{cancelled.current=true;if(timer.current)clearTimeout(timer.current);};},[]);

 function finish(){
  if(!cancelled.current){setBusy(false);onBusy(false);}
 }
 async function check(id:string,attempt=0){
  try{
   const result=await post('/api/media/video/status',{id});
   if(cancelled.current)return;
   if(result.item){onReady(result.item);setMessage('Video ready to save.');setPendingId(null);finish();return;}
   if(attempt>=59)throw Error('The video is still processing. Check again in a moment.');
   timer.current=setTimeout(()=>void check(id,attempt+1),5000);
  }catch(e){setError((e as Error).message);finish();}
 }
 async function upload(file:File){
  setError('');setPendingId(null);setBusy(true);onBusy(true);setMessage('Preparing upload…');
  try{
   const config=await post('/api/media/video/sign',{filename:file.name,bytes:file.size});
   const body=new FormData();
   body.set('file',file,file.name);
   for(const [key,value] of Object.entries({...config.parameters,api_key:config.apiKey,signature:config.signature}))body.set(key,String(value));
   await new Promise<void>((resolve,reject)=>{
    const xhr=new XMLHttpRequest();
    xhr.open('POST',`https://api.cloudinary.com/v1_1/${config.cloud}/video/upload`);
    xhr.timeout=600000;
    xhr.upload.onprogress=e=>setMessage(e.lengthComputable?`Uploading ${Math.round(e.loaded/e.total*100)}%…`:'Uploading…');
    xhr.onload=()=>xhr.status>=200&&xhr.status<300?resolve():reject(Error('The upload could not be accepted. Try the video again.'));
    xhr.onerror=xhr.ontimeout=()=>reject(Error('The upload was interrupted. Try again.'));
    xhr.send(body);
   });
   if(cancelled.current)return;
   setPendingId(config.id);setMessage('Optimizing video for playback…');await check(config.id);
  }catch(e){setError((e as Error).message);setMessage('');finish();}
 }
 return <div className="cms-field-stack">
  <label>Upload video<input type="file" accept="video/mp4,video/quicktime,.mp4,.mov" disabled={busy} onChange={e=>{const file=e.target.files?.[0];e.target.value='';if(file)void upload(file);}}/></label>
  <p className="cms-help">MP4 or MOV, up to 100 MB.</p>
  {message&&<p role="status">{message}</p>}
  {error&&<p role="alert">{error}</p>}
  {pendingId&&!busy&&<button type="button" className="cms-secondary-button" onClick={()=>{setError('');setBusy(true);onBusy(true);void check(pendingId);}}>Check processing</button>}
 </div>;
}
