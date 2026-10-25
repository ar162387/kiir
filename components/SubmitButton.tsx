'use client';
import {useFormStatus} from 'react-dom';
import type {ComponentProps} from 'react';
export default function SubmitButton({children,pendingLabel='Saving…',disabled,...props}:ComponentProps<'button'>&{pendingLabel?:string}){
 const{pending}=useFormStatus();
 return <button {...props} type="submit" disabled={disabled||pending} aria-busy={pending}>{pending?<><span className="kiir-spinner" aria-hidden="true"/> {pendingLabel}</>:children}</button>;
}
