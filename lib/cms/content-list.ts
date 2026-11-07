export type ContentFilters={q?:string;status?:string;kind?:string;program?:string};
export type ContentCard={id:string;title:string;status:string;kind_label:string;author:string|null;date:string;image_url:string|null;updated_at:string};
export type ContentPage={items:ContentCard[];cursor:string|null};
