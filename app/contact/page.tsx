import type { Metadata } from "next";
import ContactClient from "@/components/contact/ContactClient";
import { getContactSettings } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with the Kashmir Institute of International Relations.",
};

export default async function ContactPage() {
  const contact = await getContactSettings();
  return <ContactClient contact={contact} />;
}
