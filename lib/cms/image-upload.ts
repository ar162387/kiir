import type {MediaImage} from './program-types';

export async function confirmImage(upload:{id:string;filename:string;alt:string}):Promise<{image:MediaImage;url:string}> {
 const response=await fetch('/api/media/finalize',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(upload)});
 const result=await response.json();
 if(!response.ok)throw Error(result.error??'The image could not be confirmed.');
 return result;
}

export async function uploadImage(file:File,alt:string,progress:(message:string)=>void){
 const response=await fetch('/api/media/sign',{method:'POST'});
 const config=await response.json();
 if(!response.ok)throw Error(config.error??'The upload could not be started.');
 const body=new FormData();
 body.set('file',file,file.name);
 for(const [key,value] of Object.entries({...config.parameters,api_key:config.apiKey,signature:config.signature}))body.set(key,String(value));
 await new Promise<void>((resolve,reject)=>{
  const xhr=new XMLHttpRequest();
  xhr.open('POST',`https://api.cloudinary.com/v1_1/${config.cloud}/image/upload`);
  xhr.timeout=120000;
  xhr.upload.onprogress=e=>progress(e.lengthComputable?`Uploading ${Math.round(e.loaded/e.total*100)}%…`:'Uploading…');
  xhr.onload=()=>xhr.status>=200&&xhr.status<300?resolve():reject(Error('The image could not be uploaded. Please retry.'));
  xhr.onerror=xhr.ontimeout=()=>reject(Error('The upload was interrupted. Please retry.'));
  xhr.send(body);
 });
 return {id:config.id as string,filename:file.name.slice(0,255),alt};
}
