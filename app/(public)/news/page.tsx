import {permanentRedirect} from 'next/navigation';
export default async function NewsRedirect({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){const sp=await searchParams;const q=new URLSearchParams();for(const[k,v]of Object.entries(sp)){for(const value of Array.isArray(v)?v:v?[v]:[])q.append(k,value);}permanentRedirect('/publications'+(q.size?'?'+q:''));}
