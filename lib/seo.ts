import type {Metadata} from 'next';
import {getLocale} from './locale';
import {localePath} from './locale-path';
import type {ContentItem,Lang} from './types';
import {articleGraph,contentLanguage,searchDescription} from './seo-content';
export function siteOrigin(){const raw=process.env.NEXT_PUBLIC_SITE_URL||'https://kiir-opal.vercel.app';const u=new URL(raw);if(!['http:','https:'].includes(u.protocol)||u.username||u.password)throw Error('Configure a valid public site URL.');return u.origin;}
export const absoluteUrl=(path:string)=>new URL(path,siteOrigin()).toString();
export async function pageMetadata(path:string,en:string,ur:string,descriptionEn='',descriptionUr=''):Promise<Metadata>{
 const lang=await getLocale(),title=lang==='ur'?ur:en,description=searchDescription(lang==='ur'?(descriptionUr||descriptionEn):descriptionEn),canonical=absoluteUrl(localePath(path,lang));
 const image={url:absoluteUrl('/kiir-social.png'),width:1200,height:630,alt:'Kashmir Institute of International Relations — Peace Through Dialogue'};
 return {title,description:description||undefined,alternates:{canonical,languages:{en:absoluteUrl(path),ur:absoluteUrl(localePath(path,'ur')),'x-default':absoluteUrl(path)}},openGraph:{type:'website',title,description,url:canonical,locale:lang==='ur'?'ur_PK':'en_GB',siteName:'KIIR',images:[image]},twitter:{card:'summary_large_image',title,description,images:[image.url]}};
}
export async function articleMetadata(item:ContentItem):Promise<Metadata>{
 const actual=contentLanguage(item,await getLocale()),translated=contentLanguage(item,'ur')==='ur';
 const path='/articles/'+item.slug,title=actual==='ur'?item.title_ur!:(item.seo_title||item.title),description=searchDescription(actual==='ur'?(item.short_description_ur||item.body_ur||''):(item.seo_description||item.short_description||item.abstract||item.body||'')),canonical=absoluteUrl(localePath(path,actual));
 const image=absoluteUrl(item.thumbnail_url||'/kiir-social.png');
 return {title,description,alternates:{canonical,languages:{en:absoluteUrl(path),...(translated?{ur:absoluteUrl(localePath(path,'ur'))}:{}),'x-default':absoluteUrl(path)}},openGraph:{type:'article',title,description,url:canonical,locale:actual==='ur'?'ur_PK':'en_GB',siteName:'KIIR',publishedTime:item.item_date,...(item.authors?{authors:[item.authors]}:{}),images:[image]},twitter:{card:'summary_large_image',title,description,images:[image]}};
}
export function structuredArticle(item:ContentItem,lang:Lang,publisher?:{name:string;logo:string}){return articleGraph(item,lang,siteOrigin(),publisher);}
