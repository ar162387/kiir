import type {ContentItem,Lang} from './types';

export function contentHref(item:Pick<ContentItem,'slug'|'download_url'|'download_ur_url'>,lang:Lang='en'){
 return (lang==='ur'?item.download_ur_url:undefined)||item.download_url||`/articles/${item.slug}`;
}
