'use client';
import Link from '@/components/AppLink';
import {useLanguage} from './LanguageProvider';
import {localePath} from '@/lib/locale-path';
import type {ComponentProps} from 'react';
export default function LocalizedLink(props:ComponentProps<typeof Link>){const{lang}=useLanguage();const href=typeof props.href==='string'?localePath(props.href,lang):props.href;if(typeof href==='string'&&href.startsWith('/api/documents/'))return <a href={href} className={props.className} aria-label={props['aria-label']} title={props.title}>{props.children}</a>;return <Link {...props} href={href}/>;}
