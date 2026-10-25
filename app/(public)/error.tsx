'use client';
export default function PublicError({reset}:{reset:()=>void}){return <div className="mx-auto max-w-[760px] px-6 py-16"><h1 className="font-serif text-3xl text-navy">This page is temporarily unavailable.</h1><p className="my-5">Please try again in a moment.</p><button className="bg-navy px-5 py-3 text-white" onClick={reset}>Try again</button></div>;}
