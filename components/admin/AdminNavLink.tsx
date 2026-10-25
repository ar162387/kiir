'use client';
import {usePathname} from 'next/navigation';
import type {ComponentProps} from 'react';
import AppLink from '@/components/AppLink';
export default function AdminNavLink(props:ComponentProps<typeof AppLink>){
 const pathname=usePathname();const href=typeof props.href==='string'?props.href:'';
 const active=pathname===href||(href!=='/admin'&&pathname.startsWith(href+'/'));
 return <AppLink {...props} aria-current={active?'page':undefined}/>;
}
