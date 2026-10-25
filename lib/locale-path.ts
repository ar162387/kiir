import type {Lang} from './types';
export function withoutLocale(path:string){return path==='/ur'?'/':path.startsWith('/ur/')?path.slice(3):path;}
export function localePath(path:string,lang:Lang){
 if(!path.startsWith('/')||path.startsWith('//')||/^\/(api|admin|_next)(\/|$)/.test(path)||/\.[a-z0-9]+(?:[?#]|$)/i.test(path))return path;
 const raw=withoutLocale(path);return lang==='ur'?'/ur'+(raw==='/'?'':raw):raw;
}
