import {randomUUID} from 'node:crypto';
import {notFound} from 'next/navigation';
import Image from 'next/image';
import Link from '@/components/LocalizedLink';
import PageHero from '@/components/PageHero';
import {getLocale} from '@/lib/locale';
import {getGalleryPhotos,getMediaBySlug,getPublishedMedia} from '@/lib/cms/media-public';
import {archivePage} from '@/lib/seo-content';
import PhotoCollage from './PhotoCollage';
import PhotoViewer from './PhotoViewer';

const labels={album:{en:'Photo Gallery',ur:'تصویری گیلری',path:'/gallery'},documentary:{en:'Documentaries',ur:'دستاویزی فلمیں',path:'/documentaries'}};

export async function PublicMediaIndex({kind,pageParam}:{kind:'album'|'documentary';pageParam?:string}){
 const lang=await getLocale();
 const ur=lang==='ur';
 const page=archivePage(pageParam);
 const pivot=randomUUID();
 const [result,initial]=await Promise.all([getPublishedMedia(kind,page),kind==='album'?getGalleryPhotos(pivot):null]);
 if(page>1&&!result.items.length)notFound();
 const label=labels[kind];
 return <>
  <PageHero><div className="mx-auto max-w-[1520px] px-4 py-10 sm:px-6"><h1 className="font-serif text-4xl text-navy">{label[lang]}</h1></div></PageHero>
  {initial&&<PhotoCollage initial={initial} pivot={pivot} ur={ur}/>}
  <section className="mx-auto max-w-[1520px] px-4 py-8 sm:px-6">
   {kind==='album'&&<h2 className="mb-6 font-serif text-3xl text-navy">{ur?'البمز':'Albums'}</h2>}
   {!result.items.length&&<p>{ur?'ابھی کوئی مواد شائع نہیں ہوا۔':'Nothing has been published here yet.'}</p>}
   <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">{result.items.map(item=>{
    const photo=item.items.find(media=>media.type==='image');
    return <Link key={item.id} href={label.path+'/'+item.slug} className="grid content-start gap-2 border border-line bg-surface p-4 hover:border-cyan">
     {photo&&<Image unoptimized src={photo.url.replace('w_1600','w_800')} width={photo.width} height={photo.height} alt={photo.alt} className="h-auto w-full"/>}
     <h2 className="font-serif text-xl text-navy" dir="auto">{item.title}</h2>
     {item.description&&<p className="line-clamp-3 text-sm text-slate" dir="auto">{item.description}</p>}
     {kind==='documentary'&&<span className="text-sm font-semibold text-teal">{ur?'دیکھیں':'Watch video'} →</span>}
    </Link>;
   })}</div>
   {(page>1||result.more)&&<nav className="mt-6 flex gap-4" aria-label={ur?'صفحات':'Pages'}>
    {page>1&&<Link href={label.path+(page>2?'?page='+(page-1):'')}>{ur?'پچھلا صفحہ':'Previous page'}</Link>}
    {result.more&&<Link href={label.path+'?page='+(page+1)}>{ur?'اگلا صفحہ':'Next page'}</Link>}
   </nav>}
  </section>
 </>;
}

export async function PublicMediaDetail({kind,slug}:{kind:'album'|'documentary';slug:string}){
 const [item,lang]=await Promise.all([getMediaBySlug(kind,slug),getLocale()]);
 if(!item)notFound();
 const ur=lang==='ur';
 const label=labels[kind];
 const photos=item.items.filter(media=>media.type==='image');
 const videos=item.items.filter(media=>media.type==='video');
 return <article className="mx-auto max-w-[1520px] space-y-6 px-4 py-9 sm:px-6">
  <Link href={label.path} className="text-sm font-semibold text-teal">← {label[lang]}</Link>
  <h1 className="font-serif text-4xl text-navy" dir="auto">{item.title}</h1>
  {item.description&&<p className="max-w-[70ch] whitespace-pre-line text-slate" dir="auto">{item.description}</p>}
  {kind==='album'&&<PhotoViewer photos={photos} items={item.items} ur={ur}/>}
  {kind==='documentary'&&videos.map(video=><video key={video.id} controls playsInline preload="none" src={video.url}
   aria-label={item.title} className="max-h-[75vh] w-full max-w-4xl bg-navy" style={{aspectRatio:`${video.width}/${video.height}`}}>
   {ur?'آپ کا براؤزر اس ویڈیو کو نہیں چلا سکتا۔':'Your browser cannot play this video.'}
  </video>)}
 </article>;
}
