import ContentEditor from '@/components/admin/ContentEditor';
import {requireStaff} from '@/lib/cms/session';
import {createStaffClient} from '@/lib/supabase/auth';
import {getReadyImages} from '@/lib/cms/media-queries';
export default async function NewContent(){await requireStaff('content.edit');const client=await createStaffClient();const [{data:programs},images]=await Promise.all([client.from('programs').select('id,name,is_active').order('sort_order'),getReadyImages()]);return <><p className="cms-eyebrow">EDITORIAL</p><h1>Create content</h1><p className="cms-description">One story, wherever it belongs.</p><ContentEditor programs={programs??[]} images={images}/></>;}
