import type {ContentDraft} from './content-types';
import {documentAssets} from './content-types';
import {renderDocument,documentHeadings,escapeHtml} from './content-render';
import type {ContentItem} from '@/lib/types';
export function publicContent(d:ContentDraft,slug:string,date:string,categories:string[],detail=false):ContentItem {
 const assets=d.asset_urls??{},translated=Boolean(d.ur_ready);
 const render=(ur=false)=>{const document=ur?d.body_ur:d.body;return document?renderDocument(document,assets):'';};
 const inline=new Set([...(d.body?documentAssets(d.body):[]),...(translated&&d.body_ur?documentAssets(d.body_ur):[])]);
 const gallery=detail?(d.gallery??[]).filter(g=>!inline.has(g.id)&&assets[g.id]).map(g=>({url:assets[g.id],alt:g.alt,caption:g.caption,caption_ur:translated?g.caption_ur:''})):[];
 const eventStart=d.event_start??null;
 return {slug,type:d.publication_kind?'publication':d.is_event?'event':d.is_activity?'activity':'article',title:d.title,title_ur:translated?d.title_ur:null,
 short_description:d.excerpt||null,short_description_ur:translated?d.excerpt_ur||null:null,
 body:detail?render():null,body_ur:detail&&translated?render(true):null,item_date:date,priority:d.feature_order??0,is_featured:d.is_featured??false,
 thumbnail_url:d.cover_id?assets[d.cover_id]??null:null,publication_kind:d.publication_kind??null,categories,is_activity:d.is_activity,is_event:d.is_event,
 event_start:eventStart,event_end:d.event_end,event_zone:d.event_zone,event_status:d.event_status,
 event_venue:detail?d.event_venue:undefined,event_url:detail&&/^https?:\/\//i.test(d.event_url)?d.event_url:undefined,
 registration_url:detail&&/^https?:\/\//i.test(d.registration_url)?d.registration_url:undefined,
 authors:detail?d.authors:undefined,abstract:detail?d.abstract:undefined,keywords:detail?d.keywords:undefined,references:detail?d.references:undefined,issue:detail?d.issue:undefined,epigraph:detail?d.epigraph:undefined,
 document_url:detail&&d.document_id&&assets[d.document_id]?`/api/documents/${escapeHtml(d.document_id)}`:undefined,
 document_ur_url:detail&&translated&&d.document_ur_id&&assets[d.document_ur_id]?`/api/documents/${escapeHtml(d.document_ur_id)}`:undefined,
 contents:detail&&d.body?documentHeadings(d.body):[],contents_ur:detail&&translated&&d.body_ur?documentHeadings(d.body_ur):[],gallery,seo_title:d.seo_title,seo_description:d.seo_description};
}
