import type {NextConfig} from 'next';
const nextConfig:NextConfig={
 async redirects(){return [
  {source:'/about-us',destination:'/about',permanent:true},
  {source:'/our-objectives',destination:'/about',permanent:true},
  {source:'/our-principles',destination:'/about',permanent:true},
  {source:'/blogs',destination:'/publications?kind=opinion-articles',permanent:true},
  {source:'/Research-Paper',destination:'/publications?kind=research-papers',permanent:true},
  {source:'/research-paper',destination:'/publications?kind=research-papers',permanent:true},
  {source:'/past-events',destination:'/events',permanent:true},
 ];},
 async headers(){return [{source:'/:path*',headers:[{key:'X-Content-Type-Options',value:'nosniff'},{key:'Referrer-Policy',value:'strict-origin-when-cross-origin'},{key:'X-Frame-Options',value:'DENY'},{key:'Permissions-Policy',value:'camera=(), microphone=(), geolocation=()'}]}];},
};
export default nextConfig;
