import {permanentRedirect} from 'next/navigation';
export default async function News({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){const query=new URLSearchParams();for(const[k,v]of Object.entries(await searchParams)){if(Array.isArray(v))v.forEach(x=>query.append(k,x));else if(v)query.set(k,v);}permanentRedirect('/ur/publications'+(query.size?'?'+query:''));}
