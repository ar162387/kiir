import 'server-only';
import { createStaffClient } from '@/lib/supabase/auth';
import type { MediaImage } from './program-types';

export async function getReadyImages():Promise<MediaImage[]> {
  const client=await createStaffClient();
  const {data,error}=await client.from('media_assets').select('id,public_id,cloud_name,version,original_filename,width,height,bytes')
    .eq('status','ready').eq('resource_type','image').order('created_at',{ascending:false}).limit(100);
  if(error) throw new Error('The image library could not be loaded.');
  return data as MediaImage[];
}
