import 'server-only';
import {createStaffClient} from '@/lib/supabase/auth';
import {validUUID} from './content-types';
import type {ContentFilters,ContentPage,ContentCard} from './content-list';

export async function getContentPage(filters:ContentFilters,cursor?:string):Promise<ContentPage>{
 const [time,id]=(cursor??'').split('|');
 const hasCursor=Boolean(id&&validUUID(id)&&Number.isFinite(Date.parse(time)));
 const client=await createStaffClient();
 const {data,error}=await client.rpc('cms_content_page',{
  search:filters.q?.trim().slice(0,150)??'',state:filters.status??'',kind:filters.kind??'',
  program:filters.program&&validUUID(filters.program)?filters.program:null,
  before_time:hasCursor?time:null,before_id:hasCursor?id:null
 });
 if(error)throw Error('Content could not be loaded.');
 const items=(data as ContentCard[]).slice(0,24);
 const last=items.at(-1);
 return {items,cursor:data.length>24&&last?`${last.updated_at}|${last.id}`:null};
}
