'use client';

import Link from '@/components/AppLink';
import { useActionState, useState } from 'react';
import SubmitButton from '@/components/SubmitButton';
import { saveProgram, deleteProgram } from '@/lib/cms/program-actions';
import { slugifyProgram, type ManagedProgram, type MediaImage } from '@/lib/cms/program-types';
import ImagePicker from './ImagePicker';
import AutoGrowTextarea from './AutoGrowTextarea';

function Submit({busy,label}:{busy?:boolean;label:string}) {
  return <SubmitButton className="cms-button" disabled={busy} pendingLabel="Saving…">{busy?'Wait for image upload…':label}</SubmitButton>;
}

export default function ProgramEditor({program,images,canDelete}:{program?:ManagedProgram;images:MediaImage[];canDelete:boolean}) {
  const [state,action]=useActionState(saveProgram,{});
  const [deleteState,deleteAction]=useActionState(deleteProgram,{});
  const [tab,setTab]=useState<'en'|'ur'>('en');
  const [busy,setBusy]=useState(false);
  const [image,setImage]=useState({id:program?.image_asset_id??null,url:program?.image_url??null});
  const [values,setValues]=useState({name:program?.name??'',slug:program?.slug??'',name_ur:program?.name_ur??'',
    description:program?.description??'',description_ur:program?.description_ur??'',long_description:program?.long_description??'',
    long_description_ur:program?.long_description_ur??'',sort_order:String(program?.sort_order??0),is_active:program?.is_active??true});
  const [slugEdited,setSlugEdited]=useState(Boolean(program));
  const change=(key:keyof typeof values,value:string|boolean)=>setValues(v=>({...v,[key]:value}));
  return <>
    <form action={action} className="cms-program-editor">
      <input type="hidden" name="id" value={program?.id??''}/><input type="hidden" name="version" value={program?.version??''}/>
      <input type="hidden" name="image_asset_id" value={image.id??''}/><input type="hidden" name="remove_image" value={String(!image.url)}/>
      <section className="cms-panel">
        <div className="cms-language-tabs" role="group" aria-label="Content language"><button type="button" aria-pressed={tab==='en'} onClick={()=>setTab('en')}>English</button><button type="button" aria-pressed={tab==='ur'} onClick={()=>setTab('ur')}>اردو <span>Optional</span></button></div>
        <div className="cms-form" hidden={tab!=='en'}>
          <label>Program name<AutoGrowTextarea singleLine name="name" required={tab==='en'} maxLength={160} value={values.name} onChange={e=>{change('name',e.target.value);if(!slugEdited)change('slug',slugifyProgram(e.target.value));}}/></label>
          <label>Short description<AutoGrowTextarea name="description" required={tab==='en'} maxLength={600} rows={3} value={values.description} onChange={e=>change('description',e.target.value)}/></label>
          <label>Program introduction <span className="cms-optional">Optional</span><AutoGrowTextarea name="long_description" maxLength={6000} rows={7} value={values.long_description} onChange={e=>change('long_description',e.target.value)}/></label>
          <p className="cms-help">The introduction appears at the top of the program page. If left empty, the short description is used.</p>
        </div>
        <div className="cms-form" hidden={tab!=='ur'}>
          <p className="cms-help">Add Urdu where available. Empty fields display the English version.</p>
          <label>Urdu name<AutoGrowTextarea singleLine name="name_ur" lang="ur" dir="rtl" maxLength={160} value={values.name_ur} onChange={e=>change('name_ur',e.target.value)}/></label>
          <label>Urdu short description<AutoGrowTextarea name="description_ur" lang="ur" dir="rtl" maxLength={600} rows={3} value={values.description_ur} onChange={e=>change('description_ur',e.target.value)}/></label>
          <label>Urdu program introduction<AutoGrowTextarea name="long_description_ur" lang="ur" dir="rtl" maxLength={6000} rows={7} value={values.long_description_ur} onChange={e=>change('long_description_ur',e.target.value)}/></label>
        </div>
        <div className="cms-form cms-program-url"><label>Program URL<input name="slug" required maxLength={100} pattern="[a-z0-9]+(-[a-z0-9]+)*" value={values.slug} onChange={e=>{setSlugEdited(true);change('slug',e.target.value);}}/></label><p className="cms-help">/programs/{values.slug||'your-program'}{program?' · Previous URLs redirect automatically after a change.':''}</p></div>
      </section>
      <aside className="cms-program-side"><section className="cms-panel cms-form"><h2>Program image</h2><ImagePicker assetId={image.id} url={image.url} images={images} onChange={(id,url)=>setImage({id,url})} onBusy={setBusy}/></section>
        <section className="cms-panel cms-form"><h2>Visibility & order</h2><label>Display order<input name="sort_order" type="number" min={0} max={9999} required value={values.sort_order} onChange={e=>change('sort_order',e.target.value)}/></label><p className="cms-help">Lower numbers appear first. Equal numbers are sorted by name.</p><label className="cms-checkbox"><input name="is_active" type="checkbox" checked={values.is_active} onChange={e=>change('is_active',e.target.checked)}/> Show this program on the website</label>
          {state.error&&<p className="cms-feedback cms-feedback-error" role="alert">{state.error}</p>}<Submit busy={busy} label={program?'Save changes':'Create program'}/><Link className="cms-text-link" href="/admin/programs">Cancel</Link>
        </section>
      </aside>
    </form>
    {program&&canDelete&&<details className="cms-panel cms-danger"><summary>Permanently delete this program</summary><p>Its program page and navigation links will be removed. Articles are preserved. Images are deleted only when no other content uses them.</p><form action={deleteAction} className="cms-form"><input type="hidden" name="id" value={program.id}/><input type="hidden" name="version" value={program.version}/><label className="cms-checkbox"><input type="checkbox" name="confirm" required/> I want to permanently delete {program.name}.</label>{deleteState.error&&<p role="alert" className="cms-feedback cms-feedback-error">{deleteState.error}</p>}<Submit label="Delete program"/></form></details>}
  </>;
}
