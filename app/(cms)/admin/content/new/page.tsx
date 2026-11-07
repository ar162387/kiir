import ContentEditor from '@/components/admin/ContentEditor';
import {requireStaff} from '@/lib/cms/session';

export default async function NewContent(){
 await requireStaff('content.edit');
 return <><p className="cms-eyebrow">EDITORIAL</p><h1>Create content</h1><p className="cms-description">One story, wherever it belongs.</p><ContentEditor/></>;
}
