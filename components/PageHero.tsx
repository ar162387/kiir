import type {PageHero as Hero} from '@/lib/cms/page-hero';

export default function PageHero({hero,children}:{hero?:Hero;children:React.ReactNode}){
 return <section className={`border-b border-line bg-tint kiir-page-hero${hero?.url?' kiir-page-hero-image':''}`} style={hero?.url?{
  backgroundImage:`linear-gradient(90deg,#0c2939e6,#0c293996),url("${hero.url}")`,
  backgroundPosition:`center,${hero.x}% ${hero.y}%`
 }:undefined}>{children}</section>;
}
