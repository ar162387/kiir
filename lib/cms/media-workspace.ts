export type MediaKind='album'|'photo'|'documentary';
export type WorkspaceAsset={id:string;type:'image'|'video';url:string;alt:string;width:number;height:number;name:string};
export type MediaDraft={title:string;description:string;items:WorkspaceAsset[]};
export type MediaRecord={id:string;kind:MediaKind;slug:string;draft:MediaDraft;version:number;updated_at:string};
export type PublishedMedia=MediaDraft&{id:string;kind:MediaKind;slug:string;published_at:string};

export function wordCount(text:string){return text.trim().split(/\s+/u).filter(Boolean).length;}
