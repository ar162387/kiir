'use client';
import { useActionState } from 'react';
import SubmitButton from '@/components/SubmitButton';
import { retryMediaCleanup } from '@/lib/cms/program-actions';
function Button(){return <SubmitButton className="cms-secondary-button" pendingLabel="Checking…">Retry cleanup now</SubmitButton>;}
export default function MediaCleanup(){const[state,action]=useActionState(retryMediaCleanup,{});return <form action={action}><Button/>{state.error&&<p role="alert" className="cms-feedback cms-feedback-error">{state.error}</p>}{state.success&&<p role="status" className="cms-feedback cms-feedback-success">{state.success}</p>}</form>;}
