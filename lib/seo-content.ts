import type {ContentItem,Lang} from './types';

export function searchDescription(text:string){
 const plain=text.replace(/<[^>]*>/g,' ').replace(/&(?:amp|lt|gt|quot|#39|nbsp);/g,s=>({'&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&#39;':"'",'&nbsp;':' '}[s]??s)).replace(/\s+/g,' ').trim();
 if(plain.length<=170)return plain;
 const shortened=plain.slice(0,167);const breakAt=shortened.lastIndexOf(' ');
 return shortened.slice(0,breakAt>120?breakAt:undefined).trimEnd()+'…';
}
export function contentLanguage(item:ContentItem,requested:Lang):Lang{return requested==='ur'&&Boolean(item.title_ur&&(item.body_ur||item.document_ur_url))?'ur':'en';}
export function archivePage(page?:string){const value=Number(page);return Number.isSafeInteger(value)&&value>=1&&value<=10000?value:1;}
export function paginatedPath(path:string,page?:string){const value=archivePage(page);return value>1?path+(path.includes('?')?'&':'?')+'page='+value:path;}
export const publicationSearch={
 'opinion-articles':{en:'Opinion Articles',ur:'رائے کے مضامین',description:'Analysis, commentary and perspectives on Kashmir, human rights and regional peace from KIIR.'},
 'research-papers':{en:'Research Papers',ur:'تحقیقی مقالے',description:'Research papers on Kashmir, international relations, human rights and peacebuilding from KIIR.'},
 'short-stories':{en:'Short Stories',ur:'مختصر کہانیاں',description:'Short stories and personal narratives published by the Kashmir Institute of International Relations.'},
 newsletters:{en:'Newsletters',ur:'نیوز لیٹر',description:'KIIR newsletters covering research, activities, dialogue and advocacy.'},
} as const;
export function articleGraph(item:ContentItem,requested:Lang,origin:string,publisher={name:'Kashmir Institute of International Relations',logo:'/icon.png'}){
 const lang=contentLanguage(item,requested),ur=lang==='ur';const absolute=(path:string)=>new URL(path,origin).toString();
 const path='/articles/'+item.slug,canonical=absolute(ur?'/ur'+path:path),headline=ur?item.title_ur!:item.title;
 const description=searchDescription(ur?(item.short_description_ur||item.body_ur||''):(item.seo_description||item.short_description||item.abstract||item.body||''));
 const article={'@type':item.publication_kind==='research-papers'?'ScholarlyArticle':'Article','@id':canonical+'#article',url:canonical,headline,description,inLanguage:lang,datePublished:item.item_date,mainEntityOfPage:{'@type':'WebPage','@id':canonical},isPartOf:{'@type':'WebSite','@id':absolute('/#website')},publisher:{'@type':'Organization','@id':absolute('/#organization'),name:publisher.name,url:origin,...(publisher.logo?{logo:{'@type':'ImageObject',url:absolute(publisher.logo)}}:{})},...(item.authors?{author:{'@type':'Person',name:item.authors}}:{}),...(item.thumbnail_url?{image:[absolute(item.thumbnail_url)]}:{}),...(item.keywords?{keywords:item.keywords}: {})};
 const breadcrumb={'@type':'BreadcrumbList','@id':canonical+'#breadcrumb',itemListElement:[{'@type':'ListItem',position:1,name:ur?'ہوم':'Home',item:absolute(ur?'/ur':'/')},{'@type':'ListItem',position:2,name:headline,item:canonical}]};
 const event=item.is_event?{'@type':'Event','@id':canonical+'#event',url:canonical,name:headline,description,inLanguage:lang,startDate:item.event_start,...(item.event_end?{endDate:item.event_end}:{}),eventStatus:'https://schema.org/'+(item.event_status==='cancelled'?'EventCancelled':item.event_status==='postponed'?'EventPostponed':'EventScheduled'),...(item.thumbnail_url?{image:[absolute(item.thumbnail_url)]}:{}),...(item.event_venue?{location:{'@type':'Place',name:item.event_venue}}:{})}:null;
 return {'@context':'https://schema.org','@graph':[article,breadcrumb,...(event?[event]:[])]};
}
