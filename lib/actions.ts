'use server';
import {headers} from 'next/headers';
import {createHash} from 'node:crypto';
import {createAdminClient} from '@/lib/supabase/admin';
export interface ContactFormState{status:'idle'|'success'|'error';message?:string;fieldErrors?:Partial<Record<'name'|'email'|'message',string>>;}
export async function submitContactMessage(_previous:ContactFormState,form:FormData):Promise<ContactFormState>{
 const name=String(form.get('name')??'').trim(),email=String(form.get('email')??'').trim(),subject=String(form.get('subject')??'').trim(),message=String(form.get('message')??'').trim();
 const ur=form.get('language')==='ur';
 if(String(form.get('company')??'').trim())return {status:'success',message:ur?'آپ کا پیغام موصول ہو گیا ہے۔':'Thank you. Your message has been received.'};
 const fieldErrors:ContactFormState['fieldErrors']={};
 if(!name||name.length>120)fieldErrors.name='Enter a name of up to 120 characters.';
 if(email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))fieldErrors.email='Enter a valid email address.';
 if(message.length<10||message.length>10000)fieldErrors.message='Use 10–10,000 characters.';
 if(Object.keys(fieldErrors).length||subject.length>240)return {status:'error',fieldErrors,message:ur?'براہ کرم درج کردہ معلومات درست کریں۔':'Please check the highlighted fields. Keep the subject within 240 characters.'};
 try{
 const admin=createAdminClient(),h=await headers();const ip=h.get('x-forwarded-for')?.split(',')[0].trim()||'unknown';
 const bucket=createHash('sha256').update(ip).digest('hex');
 const{data:allowed,error:rateError}=await admin.rpc('cms_consume_rate_limit',{bucket:'contact:'+bucket,max_attempts:5,window_seconds:600});
 if(rateError||!allowed)return {status:'error',message:ur?'براہ کرم کچھ دیر بعد دوبارہ کوشش کریں۔':'Please wait a few minutes before sending another message.'};
 const{error}=await admin.from('contact_messages').insert({name,email,subject:subject||null,message});
 if(error)throw Error('Contact insert failed');
 return {status:'success',message:ur?'شکریہ۔ آپ کا پیغام موصول ہو گیا ہے۔':'Thank you. Your message has been received.'};
 }catch{return {status:'error',message:ur?'پیغام محفوظ نہیں ہو سکا۔ دوبارہ کوشش کریں۔':'Your message could not be saved. Please try again later.'};}
}
