'use client';

import {useActionState,useState} from 'react';
import Image from 'next/image';
import {saveMediaEntry} from '@/lib/cms/media-workspace-actions';
import {wordCount,type MediaKind,type MediaRecord,type WorkspaceAsset} from '@/lib/cms/media-workspace';
import {imageDeliveryUrl,type MediaImage} from '@/lib/cms/program-types';
import ImageLibrary from './ImageLibrary';
import ImagePicker from './ImagePicker';
import VideoPicker from './VideoPicker';

function photo(image:MediaImage):WorkspaceAsset{
 return {id:image.id,type:'image',url:imageDeliveryUrl(image),alt:image.alt_text??'',width:image.width,height:image.height,name:image.original_filename};
}

export default function MediaWorkspaceEditor({kind,record,live,canDelete}:{kind:MediaKind;record?:MediaRecord;live:boolean;canDelete:boolean}){
 const [items,setItems]=useState<WorkspaceAsset[]>(record?.draft.items??[]);
 const [title,setTitle]=useState(record?.draft.title??'');
 const [description,setDescription]=useState(record?.draft.description??'');
 const [uploadingImage,setUploadingImage]=useState(false);
 const [uploadingVideo,setUploadingVideo]=useState(false);
 const [state,action,pending]=useActionState(saveMediaEntry,{});
 const busy=uploadingImage||uploadingVideo||pending;
 function add(incoming:WorkspaceAsset[]){
  setItems(current=>kind==='album'?[...current,...incoming.filter(item=>!current.some(existing=>existing.id===item.id))]:incoming);
 }
 function move(index:number,offset:number){
  setItems(current=>{
   const next=current.slice();
   [next[index],next[index+offset]]=[next[index+offset],next[index]];
   return next;
  });
 }
 return <form action={action} className="cms-form">
  <input type="hidden" name="id" value={record?.id??''}/><input type="hidden" name="kind" value={kind}/><input type="hidden" name="version" value={record?.version??''}/>
  {items.map(item=><div hidden key={item.id}><input type="hidden" name="asset" value={item.id}/><input type="hidden" name={item.type} value={item.id}/></div>)}
  <div className="cms-panel cms-field-stack">
   <p className="cms-help">{live?'Published · Draft edits leave the public version visible.':'Draft · Publish when ready.'}</p>
   {kind!=='photo'&&<>
    <label>Title<input name="title" value={title} onChange={e=>setTitle(e.target.value)} maxLength={240}/></label>
    <label>Description {kind==='album'?'(optional)':''}<textarea name="description" rows={4} value={description} maxLength={12000} onChange={e=>setDescription(e.target.value)}/></label>
    {kind==='album'&&<p className="cms-help">{wordCount(description)} / 100 words</p>}
   </>}
   {kind!=='documentary'&&<>
    <ImagePicker assetId={null} url={null} images={[]} onChange={(_,__,image)=>{if(image)add([photo(image)]);}} onBusy={setUploadingImage}/>
    {kind==='album'&&<ImageLibrary multiple onSelect={images=>add(images.map(photo))}/>}
   </>}
   {kind!=='photo'&&<VideoPicker onReady={item=>add([item])} onBusy={setUploadingVideo}/>}
  </div>
  {items.length>0&&<section className="cms-panel"><h2>{kind==='album'?'Album media':'Selected media'}</h2>
   <div className="cms-card-grid">{items.map((item,index)=><div key={item.id} className="cms-panel">
    {item.type==='image'?<Image unoptimized src={item.url} alt={item.alt} width={item.width} height={item.height}/>:<video controls preload="none" aria-label={item.name} src={item.url} className="w-full"/>}
    <p>{item.alt||item.name}</p>
    <div className="cms-media-tools">
     {kind==='album'&&<><button type="button" disabled={index===0||busy} onClick={()=>move(index,-1)} aria-label={`Move item ${index+1} earlier`}>← Earlier</button><button type="button" disabled={index===items.length-1||busy} onClick={()=>move(index,1)} aria-label={`Move item ${index+1} later`}>Later →</button></>}
     <button type="button" disabled={busy} onClick={()=>setItems(current=>current.filter(asset=>asset.id!==item.id))}>Remove</button>
    </div>
   </div>)}</div>
  </section>}
  {state.error&&<p className="cms-feedback cms-feedback-error" role="alert">{state.error}</p>}
  <div className="cms-publish-bar">
   <button className="cms-secondary-button" name="operation" value="draft" disabled={busy}>Save draft</button>
   <button className="cms-button" name="operation" value="publish" disabled={busy}>{live?'Publish changes':'Publish'}</button>
   {live&&<button className="cms-secondary-button" name="operation" value="unpublish" disabled={busy}>Unpublish</button>}
  </div>
  {record&&canDelete&&<details className="cms-panel"><summary>Permanent deletion</summary><label className="cms-checkbox"><input name="confirm" type="checkbox"/>Permanently delete this entry and queue unused media for removal</label><button name="operation" value="delete" className="cms-danger-button" disabled={busy}>Delete permanently</button></details>}
 </form>;
}
