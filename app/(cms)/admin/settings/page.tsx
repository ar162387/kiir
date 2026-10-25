import {siteOrigin,absoluteUrl} from '@/lib/seo';
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
 return <><p className="cms-eyebrow">WEBSITE</p><h1>Website settings</h1><p className="cms-description">Manage announcements, public contact details and site information.</p><nav aria-label="Settings sections" className="cms-settings-nav">{rows.map(r=><a key={r.key} href={`#${r.key}`}>{r.key==='org'?'Organization':r.key==='ticker'?'Announcements':r.key}</a>)}<a href="#search">Search visibility</a></nav>{rows.map(row=><SettingsEditor key={row.key} row={row} images={images}/>)}<section id="search" className="cms-panel cms-settings-section"><h2>Search visibility</h2><p className="cms-description">Published articles are prepared for search engines automatically. You can refine each article’s search title and description in the content editor.</p><div className="cms-field-stack" style={{marginTop:20}}><p>Current public address: <a href={siteOrigin()} target="_blank" rel="noopener noreferrer" className="cms-text-link">{siteOrigin()}</a></p><p className="cms-help">The sitemap includes published articles, ready Urdu translations, programs and publication categories. Drafts and staff pages are excluded. Article pages include sharing previews and structured article information.</p><p className="cms-help">Moving the old kiir.org.pk website also requires preserving its article addresses or mapping them to the matching new articles. The original domain’s search visibility does not transfer automatically to a different website address.</p><div className="cms-settings-actions"><a href={absoluteUrl('/sitemap.xml')} target="_blank" rel="noopener noreferrer">View sitemap ↗</a><a href={absoluteUrl('/robots.txt')} target="_blank" rel="noopener noreferrer">View crawler rules ↗</a></div></div></section></>;
}
