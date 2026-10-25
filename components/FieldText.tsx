'use client';
import {useLanguage} from './LanguageProvider';
export default function FieldText({en,ur,serif=false}:{en?:string|null;ur?:string|null;serif?:boolean}){const{isUr}=useLanguage();const translated=isUr&&Boolean(ur?.trim());return <span lang={translated?'ur':'en'} dir={translated?'rtl':'ltr'} className={translated?'font-urdu':isUr?(serif?'font-serif':'font-sans'):undefined}>{translated?ur:en}</span>;}
