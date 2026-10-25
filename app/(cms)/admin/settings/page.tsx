import type {Metadata} from 'next';
import {requireStaff} from '@/lib/cms/session';
import {createStaffClient} from '@/lib/supabase/auth';
import {hasPermission} from '@/lib/cms/permissions';
import {settingPermission,type SettingRow} from '@/lib/cms/settings-types';
import {getReadyImages} from '@/lib/cms/media-queries';
import SettingsEditor from '@/components/admin/SettingsEditor';
export const metadata:Metadata={title:'Website settings'};
export default async function SettingsPage(){
 const member=await requireStaff('contact.edit');const client=await createStaffClient();
 const[{data,error},images]=await Promise.all([client.from('site_settings').select('key,value,version'),getReadyImages()]);
 if(error)throw Error('Website settings could not be loaded.');
 const rows=(data as SettingRow[]).filter(row=>hasPermission(member.role,settingPermission(row.key)));
 const order=['contact','social','ticker','org','about'];rows.sort((a,b)=>order.indexOf(a.key)-order.indexOf(b.key));
 return <><p className="cms-eyebrow">WEBSITE</p><h1>Website settings</h1><p className="cms-description">Manage announcements, public contact details and site information.</p><nav aria-label="Settings sections" className="cms-settings-nav">{rows.map(r=><a key={r.key} href={`#${r.key}`}>{r.key==='org'?'Organization':r.key==='ticker'?'Announcements':r.key}</a>)}</nav>{rows.map(row=><SettingsEditor key={row.key} row={row} images={images}/>)}</>;
}
