import {getContactSettings} from '@/lib/queries';
import {getLocale} from '@/lib/locale';
import {pageMetadata} from '@/lib/seo';
import ContactForm from '@/components/contact/ContactForm';
export async function generateMetadata(){return pageMetadata('/contact','Contact KIIR','رابطہ','Get in touch with KIIR.','کے آئی آئی آر سے رابطہ کریں۔');}
export default async function ContactPage(){const[contact,lang]=await Promise.all([getContactSettings(),getLocale()]);const ur=lang==='ur';return <div className="mx-auto max-w-[1100px] px-4 py-12 sm:px-6"><h1 className="font-serif text-4xl text-navy">{ur?'رابطہ کریں':'Contact KIIR'}</h1><div className="mt-10 grid gap-12 md:grid-cols-2"><div>{(contact.address||contact.phone||contact.email)&&<address className="mb-8 grid gap-4 not-italic text-lg">{contact.address&&<p>{contact.address}</p>}{contact.phone&&<a dir="ltr" href={`tel:${contact.phone.replace(/\s+/g,'')}`}>{contact.phone}</a>}{contact.email&&<a dir="ltr" href={`mailto:${contact.email}`}>{contact.email}</a>}</address>}<p>{ur?'آپ کا پیغام محفوظ ان باکس میں موصول ہوگا۔':'Use this form to send an enquiry to our staff inbox.'}</p></div><ContactForm/></div></div>;}
