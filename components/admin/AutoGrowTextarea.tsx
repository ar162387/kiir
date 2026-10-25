'use client';

import {useLayoutEffect,useRef,type ComponentProps} from 'react';

type Props=ComponentProps<'textarea'>&{singleLine?:boolean};
/** Soft wrapping keeps long values visible without adding line breaks to saved single-line fields. */
export default function AutoGrowTextarea({singleLine=false,onChange,onKeyDown,rows=1,className='',...props}:Props){
 const ref=useRef<HTMLTextAreaElement>(null);
 useLayoutEffect(()=>{
  const field=ref.current;if(!field)return;
  const resize=()=>{
   if(field.getClientRects().length===0)return;
   field.style.height='auto';
   const style=getComputedStyle(field);
   field.style.height=`${field.scrollHeight+parseFloat(style.borderTopWidth)+parseFloat(style.borderBottomWidth)}px`;
  };
  resize();
  // Width changes, including revealing the Urdu tab, must recalculate wrapping.
  let width=field.getBoundingClientRect().width;
  const observer=new ResizeObserver(()=>{const next=field.getBoundingClientRect().width;if(next!==width){width=next;resize();}});
  observer.observe(field);field.addEventListener('input',resize);
  return()=>{observer.disconnect();field.removeEventListener('input',resize);};
 },[props.value,props.defaultValue,rows]);
 return <textarea {...props} ref={ref} rows={rows} className={`cms-auto-grow ${className}`} onKeyDown={e=>{onKeyDown?.(e);if(singleLine&&e.key==='Enter')e.preventDefault();}} onChange={e=>{if(singleLine)e.currentTarget.value=e.currentTarget.value.replace(/[\r\n]+/g,' ');onChange?.(e);}}/>;
}
