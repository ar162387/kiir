import {pageMetadata} from "@/lib/seo";
import AboutClient from "@/components/about/AboutClient";
import { getOrgSettings, getPrograms, getAboutSettings } from "@/lib/queries";

export async function generateMetadata(){return pageMetadata('/about','About KIIR','کے آئی آئی آر کے بارے میں','Research, advocacy and peacebuilding on Kashmir.','کشمیر پر تحقیق، وکالت اور امن سازی۔');}

export default async function AboutPage() {
  const [org, programs,about] = await Promise.all([getOrgSettings(), getPrograms(),getAboutSettings()]);
  return <AboutClient org={org} programs={programs} about={about} />;
}
