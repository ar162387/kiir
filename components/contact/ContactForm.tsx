'use client';
import {useActionState} from 'react';
import {submitContactMessage,type ContactFormState} from '@/lib/actions';
import {useLanguage} from '../LanguageProvider';
export default function ContactForm(){
 const{isUr}=useLanguage();const[state,action,pending]=useActionState(submitContactMessage,{status:'idle'} as ContactFormState);
 if(state.status==='success')return <p role="status" className="border border-teal bg-tint p-6 text-navy">{state.message}</p>;
 const input='mt-2 w-full border border-line bg-white px-3 py-3 text-navy';
 return <form action={action} className="grid gap-5" dir={isUr?'rtl':'ltr'}><input type="hidden" name="language" value={isUr?'ur':'en'}/><div aria-hidden="true" className="hidden"><label>Company<input name="company" tabIndex={-1} autoComplete="off"/></label></div>
 <label>{isUr?'نام':'Name'}<input className={input} name="name" autoComplete="name" required maxLength={120} aria-invalid={Boolean(state.fieldErrors?.name)}/>{state.fieldErrors?.name&&<span role="alert">{state.fieldErrors.name}</span>}</label>
 <label>{isUr?'ای میل':'Email'}<input className={input} name="email" type="email" autoComplete="email" required maxLength={254} dir="ltr" aria-invalid={Boolean(state.fieldErrors?.email)}/>{state.fieldErrors?.email&&<span role="alert">{state.fieldErrors.email}</span>}</label>
 <label>{isUr?'موضوع':'Subject'}<input className={input} name="subject" maxLength={240}/></label>
 <label>{isUr?'پیغام':'Message'}<textarea className={input} name="message" required minLength={10} maxLength={10000} rows={7} aria-invalid={Boolean(state.fieldErrors?.message)}/>{state.fieldErrors?.message&&<span role="alert">{state.fieldErrors.message}</span>}</label>
 {state.status==='error'&&<p role="alert" className="text-red-800">{state.message}</p>}<button className="bg-navy px-6 py-3 text-white disabled:opacity-60" type="submit" disabled={pending} aria-busy={pending}>{pending&&<span className="kiir-spinner me-2" aria-hidden="true"/>}{pending?(isUr?'بھیجا جا رہا ہے…':'Sending…'):(isUr?'پیغام بھیجیں':'Send message')}</button>
 </form>;
}
