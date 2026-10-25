import type {AboutSettings,ContactSettings,OrgSettings,SocialSettings} from '../types';
export type TickerSegment={text:string;href?:string};
export type Announcement={id:string;is_active:boolean;segments:TickerSegment[];segments_ur:TickerSegment[]};
export type SettingKey='org'|'about'|'contact'|'social'|'ticker';
export type SettingsValue=OrgSettings|AboutSettings|ContactSettings|SocialSettings|Announcement[];
export type SettingRow={key:SettingKey;value:SettingsValue;version:number};
export const settingPermission=(key:SettingKey)=>key==='org'||key==='about'?'branding.edit':key==='ticker'?'announcement.edit':'contact.edit';
export function safePublicLink(value:string){
 if(!value||value.length>2000||/[\\\s\u0000-\u001f]/.test(value))return false;
 try{if(value.startsWith('/')){const u=new URL(value,'https://kiir.invalid');return u.origin==='https://kiir.invalid'&&!/^\/(admin|api)(\/|$)/i.test(u.pathname)&&!/%[025][0-9a-f]/i.test(value);}return ['http:','https:'].includes(new URL(value).protocol);}catch{return false;}
}
export function validateSettings(key:SettingKey,value:SettingsValue):string|null{
 if(JSON.stringify(value).length>100000)return 'These settings are too large.';
 if(key==='ticker'){
  if(!Array.isArray(value)||value.length>30)return 'Use at most 30 announcements.';
  for(const a of value as Announcement[]){if(!a.id||typeof a.is_active!=='boolean'||!a.segments?.some(s=>s.text.trim()))return 'Add text to every announcement.';for(const parts of [a.segments,a.segments_ur]){if(!Array.isArray(parts)||parts.length>20)return 'Use at most 20 text/link parts per language.';for(const p of parts)if(typeof p.text!=='string'||p.text.length>1000||p.href&&!safePublicLink(p.href))return 'Use valid internal paths or HTTP/HTTPS links, and text of at most 1,000 characters.';}}
 }else if(!value||Array.isArray(value)||typeof value!=='object')return 'Invalid settings.';
 else if(key==='contact'){const v=value as ContactSettings;if(['address','phone','email'].some(k=>typeof (value as unknown as Record<string,unknown>)[k]!=='string'))return 'Enter valid contact details.';if(v.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email))return 'Enter a valid email address.';if(v.address.length>1000||v.phone.length>80||v.email.length>254)return 'Contact details are too long.';}
 else if(key==='social'){for(const v of Object.values(value))if(typeof v!=='string'||v&&(!/^https?:\/\//.test(v)||!safePublicLink(v)))return 'Social links must be valid HTTP or HTTPS URLs.';}
 else if(key==='org'){const v=value as OrgSettings;if(typeof v.name!=='string'||!v.name.trim()||v.name.length>240)return 'Enter an organization name of up to 240 characters.';}
 return null;
}
export function activeAnnouncements(value:Announcement[]):Announcement[]{return value.filter(a=>a.is_active&&a.segments?.some(p=>p.text.trim()));}
