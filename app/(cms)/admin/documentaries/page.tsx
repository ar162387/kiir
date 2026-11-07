import {MediaWorkspaceList} from '@/components/admin/MediaWorkspace';
export default async function Page({searchParams}:{searchParams:Promise<{page?:string;notice?:string}>}){
 const {page,notice}=await searchParams;
 return <MediaWorkspaceList section="documentaries" page={Math.max(1,Math.min(10000,Math.trunc(Number(page)||1)))} notice={notice}/>;
}
