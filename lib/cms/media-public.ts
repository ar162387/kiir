import 'server-only';

import {getSupabase} from '@/lib/supabase/server';
import type {PublishedMedia,WorkspaceAsset} from './media-workspace';

export async function getPublishedMedia(kind:'album'|'documentary',page=1){
 const client=getSupabase();
 if(!client)return {items:[],more:false};
 const {data,error}=await client.from('media_entries_live').select('*').eq('kind',kind)
  .order('published_at',{ascending:false}).order('id').range((page-1)*12,page*12);
 if(error)throw Error('Published media is temporarily unavailable.');
 return {items:data.slice(0,12) as PublishedMedia[],more:data.length>12};
}

export async function getMediaBySlug(kind:'album'|'documentary',slug:string){
 const client=getSupabase();
 if(!client)return null;
 const {data,error}=await client.from('media_entries_live').select('*').eq('kind',kind).eq('slug',slug).maybeSingle();
 if(error)throw Error('Published media is temporarily unavailable.');
 return data as PublishedMedia|null;
}

export type GalleryBatch={photos:WorkspaceAsset[];cursor:string|null};
export async function getGalleryPhotos(pivot:string,cursor?:string):Promise<GalleryBatch>{
 const client=getSupabase();
 if(!client)return {photos:[],cursor:null};
 const [after,wrapped]=cursor?.split(':')??[];
 async function read(wrap:boolean,lower:string|undefined,size:number){
  let query=client!.from('gallery_photos').select('id,item').order('id').limit(size);
  if(wrap)query=query.lt('id',pivot);
  else query=query.gte('id',pivot);
  if(lower)query=query.gt('id',lower);
  const {data,error}=await query;
  if(error)throw Error('Gallery photos could not be loaded.');
  return data as {id:string;item:WorkspaceAsset}[];
 }
 let rows=await read(wrapped==='1',after,25);
 let wrap=wrapped==='1';
 const leading=rows.length;
 if(!wrap&&rows.length<25){
  rows=[...rows,...await read(true,undefined,25-rows.length)];
  wrap=leading<24;
 }
 const batch=rows.slice(0,24);
 return {photos:batch.map(row=>row.item),cursor:rows.length>24?`${batch[23].id}:${wrap?'1':'0'}`:null};
}
