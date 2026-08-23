import type { Metadata } from "next";
import AboutClient from "@/components/about/AboutClient";
import { getOrgSettings, getPrograms } from "@/lib/queries";

export const metadata: Metadata = {
  title: "About Us",
  description: "KIIR is an independent think tank documenting the Kashmir conflict, human rights and pathways to peace.",
};

export default async function AboutPage() {
  const [org, programs] = await Promise.all([getOrgSettings(), getPrograms()]);
  return <AboutClient org={org} programs={programs} />;
}
