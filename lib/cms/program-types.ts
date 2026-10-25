export interface ManagedProgram {
  id: string;
  slug: string;
  name: string;
  name_ur: string | null;
  description: string;
  description_ur: string | null;
  long_description: string | null;
  long_description_ur: string | null;
  image_asset_id: string | null;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
  version: number;
}

export interface MediaImage {
  id: string;
  public_id: string;
  cloud_name: string;
  version: number;
  original_filename: string;
  width: number;
  height: number;
  bytes: number;
}

export function imageDeliveryUrl(image: Pick<MediaImage,'cloud_name'|'version'|'public_id'>, width=640) {
  return `https://res.cloudinary.com/${image.cloud_name}/image/upload/f_auto,q_auto,w_${width},c_limit/v${image.version}/${image.public_id}`;
}

export function slugifyProgram(value: string) {
  return value.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,100).replace(/-$/,'');
}

export function validateProgram(p: Record<string, unknown>): string | null {
  if(typeof p.name!=='string'||!p.name.trim()||p.name.length>160) return 'Enter a program name with 1–160 characters.';
  if(typeof p.slug!=='string'||p.slug.length>100||!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(p.slug)) return 'Use lowercase letters, numbers, and single hyphens for the URL.';
  if(typeof p.description!=='string'||!p.description.trim()||p.description.length>600) return 'Enter a short description with 1–600 characters.';
  if(!Number.isInteger(p.sort_order)||Number(p.sort_order)<0||Number(p.sort_order)>9999) return 'Display order must be a number between 0 and 9999.';
  for(const [field,max] of [['name_ur',160],['description_ur',600],['long_description',6000],['long_description_ur',6000]] as const) {
    if(p[field]&& (typeof p[field]!=='string'||String(p[field]).length>max)) return `${field.replaceAll('_',' ')} must be at most ${max} characters.`;
  }
  if(p.image_asset_id && !/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(String(p.image_asset_id))) return 'Choose a valid uploaded image.';
  return null;
}
