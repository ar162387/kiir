"use client";

import { useActionState } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { submitContactMessage, type ContactFormState } from "@/lib/actions";
import type { ContactSettings } from "@/lib/types";

const initialState: ContactFormState = { status: "idle" };

export default function ContactClient({ contact }: { contact: ContactSettings }) {
  const { t, isUr } = useLanguage();
  const [state, formAction, pending] = useActionState(submitContactMessage, initialState);

  return (
    <div>
      <section className="border-b border-line bg-tint">
        <div className="mx-auto max-w-[1520px] px-4 py-11 sm:px-6 sm:py-14">
          <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-teal">{t.contact}</div>
          <h1 className={isUr ? "mt-2.5 font-urdu text-[32px] leading-[2] text-navy" : "mt-2.5 font-serif text-[clamp(30px,4vw,46px)] leading-[1.1] tracking-[-0.02em] text-navy"}>
            {t.getInvolved}
          </h1>
          <p className={isUr ? "mt-3 max-w-[60ch] font-urdu text-sm leading-[2.2] text-slate" : "mt-3 max-w-[60ch] text-[15px] leading-relaxed text-slate"}>
            {t.giBody}
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1520px] grid-cols-1 gap-11 px-4 py-11 sm:px-6 lg:grid-cols-[1.4fr_1fr]">
        <form action={formAction} noValidate aria-describedby={state.status === "error" && state.message ? "form-error" : undefined}>
          {/* Honeypot — hidden from real users, visible to naive bots */}
          <div className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
            <label htmlFor="company">Company</label>
            <input id="company" name="company" type="text" tabIndex={-1} autoComplete="off" />
          </div>

          {state.status === "success" && (
            <div role="status" className="mb-5 border border-cyan bg-tint px-4 py-3.5 text-sm text-navy">
              {state.message}
            </div>
          )}
          {state.status === "error" && state.message && (
            <div id="form-error" role="alert" className="mb-5 border border-red-300 bg-red-50 px-4 py-3.5 text-sm text-red-800">
              {state.message}
            </div>
          )}

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field label="Name" htmlFor="name" required error={state.fieldErrors?.name}>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                aria-invalid={Boolean(state.fieldErrors?.name)}
                aria-describedby={state.fieldErrors?.name ? "name-error" : undefined}
                className={inputClass(Boolean(state.fieldErrors?.name))}
              />
            </Field>
            <Field label="Email" htmlFor="email" required error={state.fieldErrors?.email}>
              <input
                id="email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                required
                aria-invalid={Boolean(state.fieldErrors?.email)}
                aria-describedby={state.fieldErrors?.email ? "email-error" : undefined}
                className={inputClass(Boolean(state.fieldErrors?.email))}
              />
            </Field>
          </div>

          <div className="mt-5">
            <Field label="Subject" htmlFor="subject">
              <input id="subject" name="subject" type="text" autoComplete="off" className={inputClass(false)} />
            </Field>
          </div>

          <div className="mt-5">
            <Field label="Message" htmlFor="message" required error={state.fieldErrors?.message}>
              <textarea
                id="message"
                name="message"
                rows={6}
                required
                minLength={10}
                aria-invalid={Boolean(state.fieldErrors?.message)}
                aria-describedby={state.fieldErrors?.message ? "message-error" : undefined}
                className={inputClass(Boolean(state.fieldErrors?.message))}
              />
            </Field>
          </div>

          <button
            type="submit"
            disabled={pending}
            className="mt-6.5 cursor-pointer bg-navy px-6 py-3.5 font-mono text-[11px] uppercase tracking-[0.14em] text-canvas transition-colors duration-150 hover:bg-cyan hover:text-navy disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "Sending…" : t.contactBtn}
          </button>
        </form>

        <aside className="flex flex-col gap-6">
          <div className="border border-line p-5.5">
            <h2 className="m-0 mb-3.5 font-mono text-[10.5px] font-medium uppercase tracking-[0.14em] text-teal">
              {t.contactCol}
            </h2>
            <div className="flex flex-col gap-2.5 text-sm leading-relaxed text-slate">
              <span>{contact.address}</span>
              <a href={`tel:${contact.phone.replace(/\s+/g, "")}`} className="text-navy hover:text-teal">
                {contact.phone}
              </a>
              <a href={`mailto:${contact.email}`} className="text-navy hover:text-teal">
                {contact.email}
              </a>
            </div>
          </div>
          <div className="bg-tint p-5.5">
            <h2 className="m-0 font-serif text-lg text-navy">{t.subscribe}</h2>
            <p className="mt-2.5 text-[13px] leading-relaxed text-slate">{t.supportBody}</p>
          </div>
        </aside>
      </section>
    </div>
  );
}

function inputClass(hasError: boolean) {
  return `w-full border bg-surface px-3.5 py-2.5 text-[14px] text-navy outline-none transition-colors duration-150 focus:border-cyan ${
    hasError ? "border-red-400" : "border-line"
  }`;
}

function Field({
  label,
  htmlFor,
  required,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block font-mono text-[10.5px] uppercase tracking-[0.1em] text-slate">
        {label}
        {required && (
          <span aria-hidden className="ml-1 text-teal">
            *
          </span>
        )}
      </label>
      {children}
      {error && (
        <p id={`${htmlFor}-error`} className="mt-1.5 text-xs text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
