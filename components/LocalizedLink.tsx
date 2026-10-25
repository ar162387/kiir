'use client';
import Link from '@/components/AppLink';
import {useLanguage} from './LanguageProvider';
import {localePath} from '@/lib/locale-path';
import type {ComponentProps} from 'react';
export default function LocalizedLink(props:ComponentProps<typeof Link>){const{lang}=useLanguage();const href=typeof props.href==='string'?localePath(props.href,lang):props.href;return <Link {...props} href={href}/>;}
