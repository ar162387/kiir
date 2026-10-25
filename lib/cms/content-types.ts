export const publicationLabels = {'opinion-articles':'Opinion Article','research-papers':'Research Paper','short-stories':'Short Story','newsletters':'Newsletter'} as const;
export type PublicationCategory=keyof typeof publicationLabels;
export type EditorNode={type:string;text?:string;attrs?:Record<string,unknown>;marks?:{type:string;attrs?:Record<string,unknown>}[];content?:EditorNode[]};
export type ContentDraft={
 title:string;slug:string;excerpt:string;title_ur:string;excerpt_ur:string;body:EditorNode;body_ur:EditorNode;ur_ready:boolean;
 program_ids:string[];is_activity:boolean;is_event:boolean;publication_kind:PublicationCategory|null;
 event_start:string|null;event_end:string|null;event_zone:string;event_status:string;event_venue:string;event_url:string;registration_url:string;
 authors:string;abstract:string;keywords:string;references:string;issue:string;epigraph:string;
 is_featured:boolean;feature_order:number;cover_id:string|null;gallery:{id:string;caption:string;caption_ur:string;alt:string}[];
 document_id:string|null;document_ur_id:string|null;seo_title:string;seo_description:string;
 asset_ids?:string[];asset_urls?:Record<string,string>;body_text?:string;body_text_ur?:string;
};
export type ContentRecord={id:string;slug:string;draft:ContentDraft;status:'draft'|'published'|'archived';version:number;updated_at:string};
export const emptyDocument:EditorNode={type:'doc',content:[{type:'paragraph'}]};
export function emptyDraft():ContentDraft{return {title:'',slug:'',excerpt:'',title_ur:'',excerpt_ur:'',body:emptyDocument,body_ur:emptyDocument,ur_ready:false,
 program_ids:[],is_activity:false,is_event:false,publication_kind:null,event_start:null,event_end:null,event_zone:'Asia/Karachi',event_status:'scheduled',event_venue:'',event_url:'',registration_url:'',
 authors:'',abstract:'',keywords:'',references:'',issue:'',epigraph:'',is_featured:false,feature_order:0,cover_id:null,gallery:[],document_id:null,document_ur_id:null,seo_title:'',seo_description:''};}
export function documentText(node:EditorNode):string{return node.text??node.content?.map(documentText).join(' ')??'';}
export const validUUID=(s:string)=>/^[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}$/i.test(s);
export function safeLink(value:string):boolean {try{const u=new URL(value);return ['https:','http:','mailto:','tel:'].includes(u.protocol);}catch{return false;}}
export function documentAssets(node:EditorNode):string[]{return [...(node.type==='managedImage'?[String(node.attrs?.assetId??'')]:[]),...(node.content??[]).flatMap(documentAssets)];}
export function validateDocument(node:EditorNode,depth=0,count={n:0}):void {
 if(!node||typeof node!=='object'||depth>30||++count.n>15000)throw new Error('The document is too complex. Split it into shorter sections.');
 const allowed=['doc','paragraph','text','heading','blockquote','bulletList','orderedList','listItem','hardBreak','horizontalRule','table','tableRow','tableCell','tableHeader','managedImage'];
 if(!allowed.includes(node.type))throw new Error(`Unsupported document block: ${node.type}.`);
 if(node.text!==undefined&&(typeof node.text!=='string'||node.text.length>100000))throw new Error('Invalid text block.');
 if(node.type==='managedImage'&&!validUUID(String(node.attrs?.assetId)))throw new Error('Choose a managed image.');
 if(node.type==='heading'&&![2,3,4].includes(Number(node.attrs?.level)))throw new Error('Use a level 2, 3 or 4 section heading.');
 if(node.attrs?.textAlign&&!['left','center','right','justify'].includes(String(node.attrs.textAlign)))throw new Error('Invalid text alignment.');
 for(const mark of node.marks??[]){if(!['bold','italic','underline','strike','superscript','subscript','link'].includes(mark.type))throw new Error('Unsupported text style.');if(mark.type==='link'&&!safeLink(String(mark.attrs?.href)))throw new Error('Links must use HTTP, HTTPS, email or telephone URLs.');}
 for(const child of node.content??[])validateDocument(child,depth+1,count);
}
export function validateContent(d:ContentDraft,publish:boolean):string|null {
 try{validateDocument(d.body);validateDocument(d.body_ur);}catch(e){return (e as Error).message;}
 if(!d.title.trim()||d.title.length>240)return 'Enter a title of up to 240 characters.';
 if(!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(d.slug)||d.slug.length>100)return 'Choose a URL using lowercase letters, numbers and hyphens.';
 if(d.excerpt.length>1200||d.excerpt_ur.length>1200)return 'Keep each summary within 1,200 characters.';
 if(d.publication_kind&&!Object.hasOwn(publicationLabels,d.publication_kind))return 'Choose a valid publication category.';
 if(d.program_ids.length>50||d.gallery.length>30)return 'Use at most 50 programs and 30 gallery images.';
 if(!Number.isInteger(d.feature_order)||d.feature_order<0||d.feature_order>9999)return 'Feature order must be between 0 and 9999.';
 for(const link of [d.event_url,d.registration_url])if(link&&!/^https?:\/\//i.test(link))return 'Event links must start with https:// or http://.';
 try{new Intl.DateTimeFormat('en',{timeZone:d.event_zone});}catch{return 'Use a valid IANA event time zone.';}
 if(d.event_start&&Number.isNaN(Date.parse(d.event_start))||d.event_end&&Number.isNaN(Date.parse(d.event_end)))return 'Enter valid event dates.';
 if(d.event_end&&d.event_start&&Date.parse(d.event_end)<Date.parse(d.event_start))return 'The event must end after it starts.';
 const assets=[d.cover_id,d.document_id,d.document_ur_id,...d.gallery.map(i=>i.id),...documentAssets(d.body),...documentAssets(d.body_ur)].filter(Boolean) as string[];
 if(assets.some(id=>!validUUID(id))||d.program_ids.some(id=>!validUUID(id)))return 'Select valid programs and uploaded files.';
 if(publish){
  if(!d.excerpt.trim())return 'Add a summary before publishing.';
  if(!documentText(d.body).trim()&&!d.document_id)return 'Write the article or attach a PDF before publishing.';
  if(d.is_event&&!d.event_start)return 'Set the event start before publishing.';
  if(d.publication_kind&&d.publication_kind!=='newsletters'&&!d.authors.trim())return 'Add the author or byline before publishing.';
  if(d.publication_kind==='research-papers'&&!d.abstract.trim())return 'Add the research abstract before publishing.';
  if(d.publication_kind==='newsletters'&&!d.issue.trim())return 'Add the newsletter issue before publishing.';
  if(d.ur_ready&&(!d.title_ur.trim()||(!documentText(d.body_ur).trim()&&!d.document_ur_id)))return 'Complete the Urdu title and body/PDF, or turn off “Publish Urdu translation”.';
 }
 return null;
}
