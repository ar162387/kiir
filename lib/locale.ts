import 'server-only';
import {headers} from 'next/headers';
import type {Lang} from './types';
export async function getLocale():Promise<Lang>{return (await headers()).get('x-kiir-language')==='ur'?'ur':'en';}
