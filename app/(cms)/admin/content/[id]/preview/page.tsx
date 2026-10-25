import {LanguageProvider} from '@/components/LanguageProvider';
import {notFound} from 'next/navigation';
import {requireStaff} from '@/lib/cms/session';
import {createStaffClient} from '@/lib/supabase/auth';
import {validUUID,type ContentDraft} from '@/lib/cms/content-types';
import {publicContent} from '@/lib/cms/content-public';
import ArticleClient from '@/components/articles/ArticleClient';
import type {Program} from '@/lib/types';
export default async function Preview({params}:{params:Promise<{id:string}>}){await requireStaff('content.edit');const{id}=await params;if(!validUUID(id))notFound();const client=await createStaffClient();const{data:r}=await client.from('content_records').select('slug,draft,updated_at').eq('id',id).single();if(!r)notFound();const d=r.draft as ContentDraft;const{data:programs}=await client.from('programs').select('*').in('id',d.program_ids??[]);const item=publicContent(d,r.slug,r.updated_at,programs?.map(p=>p.slug)??[],true);return <><p className="cms-feedback cms-feedback-success">Private preview of the last saved draft. Public pages use this same renderer. Save before previewing new edits.</p><LanguageProvider initialLang="en"><ArticleClient item={item} categories={programs as Program[]??[]} related={[]}/></LanguageProvider></>;}
