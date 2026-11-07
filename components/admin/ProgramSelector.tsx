'use client';

import {useEffect,useState} from 'react';

type ProgramOption={id:string;name:string;is_active:boolean};

export default function ProgramSelector({initialPrograms,selected,onChange}:{
 initialPrograms?:ProgramOption[];selected:string[];onChange:(ids:string[])=>void;
}){
 const [programs,setPrograms]=useState(initialPrograms);
 const [open,setOpen]=useState(false);
 const [error,setError]=useState(false);
 const [attempt,setAttempt]=useState(0);

 useEffect(()=>{
  if(!open||programs)return;
  const controller=new AbortController();
  fetch('/api/cms/program-options',{signal:controller.signal})
   .then(async response=>{if(!response.ok)throw Error();return response.json();})
   .then(result=>{setPrograms(result.programs);setError(false);})
   .catch(()=>{if(!controller.signal.aborted)setError(true);});
  return ()=>controller.abort();
 },[open,programs,attempt]);

 return <details className="cms-panel" onToggle={event=>setOpen(event.currentTarget.open)}>
  <summary>Programs (optional){selected.length>0?` · ${selected.length} selected`:''}</summary>
  {open&&<>
   {!programs&&!error&&<p role="status" className="cms-help">Loading programs…</p>}
   {error&&<p role="alert">Programs could not be loaded. <button type="button" className="cms-text-link" onClick={()=>{setError(false);setAttempt(value=>value+1);}}>Try again</button></p>}
   {programs?.length===0&&<p className="cms-help">There are no programs to select yet.</p>}
   <div className="cms-check-grid">{programs?.map(program=><label className="cms-checkbox" key={program.id}>
    <input type="checkbox" checked={selected.includes(program.id)} onChange={event=>onChange(event.target.checked?[...selected,program.id]:selected.filter(id=>id!==program.id))}/>
    {program.name}{!program.is_active?' (hidden)':''}
   </label>)}</div>
  </>}
 </details>;
}
