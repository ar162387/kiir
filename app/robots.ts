import type {MetadataRoute} from 'next';
import {absoluteUrl,siteOrigin} from '@/lib/seo';
export default function robots():MetadataRoute.Robots{return {rules:process.env.VERCEL_ENV==='preview'?{userAgent:'*',disallow:'/'}:{userAgent:'*',allow:'/',disallow:['/admin','/api/']},sitemap:absoluteUrl('/sitemap.xml'),host:siteOrigin()};}
