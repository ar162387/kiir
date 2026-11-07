import {confirmImage,uploadImage} from './image-upload';

export async function generatePdfCover(bytes:ArrayBuffer,title:string){
 const pdfjs=await import('pdfjs-dist');
 pdfjs.GlobalWorkerOptions.workerSrc=new URL('pdfjs-dist/build/pdf.worker.min.mjs',import.meta.url).toString();
 const task=pdfjs.getDocument({data:bytes,enableXfa:false,stopAtErrors:true});
 try{
  const pdf=await task.promise;
  const first=await pdf.getPage(1);
  const natural=first.getViewport({scale:1});
  const viewport=first.getViewport({scale:Math.min(2,1440/Math.max(natural.width,natural.height))});
  const canvas=document.createElement('canvas');
  canvas.width=Math.ceil(viewport.width);
  canvas.height=Math.ceil(viewport.height);
  await first.render({canvas,viewport}).promise;
  const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(value=>value?resolve(value):reject(Error('No cover image')), 'image/jpeg',0.85));
  return await confirmImage(await uploadImage(new File([blob],title.replace(/\.pdf$/i,'')+' — cover.jpg',{type:'image/jpeg'}),'',()=>{}));
 } finally {await task.destroy();}
}
