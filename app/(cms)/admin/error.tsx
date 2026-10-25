'use client';

export default function AdminError({ reset }: { reset: () => void }) {
  return <section className="cms-panel"><p className="cms-eyebrow">PLEASE TRY AGAIN</p><h1>The workspace could not be loaded.</h1><p>Your saved changes are safe. Try again, or contact your site administrator if this continues.</p><button className="cms-button" onClick={reset}>Try again</button></section>;
}
