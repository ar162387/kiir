import 'server-only';
import { createHash } from 'node:crypto';
import { getSupabaseConfig } from '@/lib/supabase/config';

export const IMAGE_PRESET = 'kiir_cms_images_v1';
export function cloudinaryConfig() {
  const cloud = process.env.CLOUDINARY_CLOUD_NAME;
  const key = process.env.CLOUDINARY_API_KEY;
  const secret = process.env.CLOUDINARY_API_SECRET;
  if (!cloud || !key || !secret) throw new Error('Image uploads are not configured.');
  return { cloud, key, secret, prefix: `kiir-cms/${new URL(getSupabaseConfig()!.url).hostname.split('.')[0]}/` };
}

export function signCloudinary(parameters: Record<string,string|number|boolean>) {
  const { secret } = cloudinaryConfig();
  return createHash('sha1').update(Object.keys(parameters).sort().map(key=>`${key}=${parameters[key]}`).join('&')+secret).digest('hex');
}

export async function getCloudinaryAsset(publicId:string,resourceType:'image'|'raw') {
  const config = cloudinaryConfig();
  if (!publicId.startsWith(config.prefix)) throw new Error('Image is outside the managed folder.');
  const response = await fetch(`https://api.cloudinary.com/v1_1/${config.cloud}/resources/${resourceType}/upload/${encodeURIComponent(publicId)}`, {
    headers: { Authorization: 'Basic '+Buffer.from(`${config.key}:${config.secret}`).toString('base64') },
    cache: 'no-store', signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error('The uploaded image could not be verified. Please try again.');
  return response.json();
}

export async function getCloudinaryImage(publicId:string){return getCloudinaryAsset(publicId,'image');}
