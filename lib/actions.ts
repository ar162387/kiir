"use server";

import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/server";

export interface ContactFormState {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Partial<Record<"name" | "email" | "message", string>>;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function submitContactMessage(
  _prevState: ContactFormState,
  formData: FormData
): Promise<ContactFormState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const subject = String(formData.get("subject") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();
  // Honeypot — real users never fill a visually-hidden field.
  const honeypot = String(formData.get("company") ?? "").trim();

  const fieldErrors: ContactFormState["fieldErrors"] = {};
  if (!name) fieldErrors.name = "Enter your name.";
  if (!email) fieldErrors.email = "Enter your email.";
  else if (!EMAIL_RE.test(email)) fieldErrors.email = "Enter a valid email address.";
  if (!message || message.length < 10) fieldErrors.message = "Message must be at least 10 characters.";

  if (Object.keys(fieldErrors).length > 0) {
    return { status: "error", fieldErrors, message: "Please fix the highlighted fields." };
  }
  if (honeypot) {
    // Silently succeed for bots without writing anything.
    return { status: "success" };
  }

  if (!isSupabaseConfigured()) {
    return {
      status: "error",
      message:
        "This form isn't wired to a backend yet — Supabase isn't configured. Set NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY, or email info@kiir.org directly.",
    };
  }

  const sb = getSupabase();
  const { error } = await sb!.from("contact_messages").insert({
    name,
    email,
    subject: subject || null,
    message,
  });

  if (error) {
    return { status: "error", message: "Something went wrong sending your message. Please try again or email us directly." };
  }

  return { status: "success", message: "Thanks — your message has been sent. We'll get back to you soon." };
}
