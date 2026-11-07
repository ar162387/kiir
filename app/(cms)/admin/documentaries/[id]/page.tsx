import {MediaWorkspaceEdit} from '@/components/admin/MediaWorkspace';
export default async function Page({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<{type?:string;notice?:string}>}){
 const [{id},{type,notice}]=await Promise.all([params,searchParams]);
 return <MediaWorkspaceEdit section="documentaries" id={id} type={type} notice={notice}/>;
}
