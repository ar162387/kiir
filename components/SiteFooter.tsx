"use client";
import FieldText from "@/components/FieldText";

import Image from "next/image";
import Link from "@/components/LocalizedLink";
import { useLanguage } from "@/components/LanguageProvider";
import { FacebookIcon, InstagramIcon, LinkedInIcon, XIcon } from "@/components/icons";
import type { ContactSettings, OrgSettings, Program, SocialSettings } from "@/lib/types";

export default function SiteFooter({
  org,
  programs,
  contact,
  social,
}: {
  org: OrgSettings;
  programs: Program[];
  contact: ContactSettings;
  social: SocialSettings;
}) {
  const { t, isUr } = useLanguage();

  const socialLinks = [
    { key: "facebook", label: "Facebook", href: social.facebook, Icon: FacebookIcon, color: "bg-[#1877F2]" },
    { key: "instagram", label: "Instagram", href: social.instagram, Icon: InstagramIcon, color: "bg-[#D62976]" },
    { key: "x", label: "X (Twitter)", href: social.x, Icon: XIcon, color: "bg-black" },
    { key: "linkedin", label: "LinkedIn", href: social.linkedin, Icon: LinkedInIcon, color: "bg-[#0A66C2]" },
  ];

  return (
    <footer className="mt-auto bg-navy text-[#B9C7D6]">
      <div className="mx-auto grid max-w-[1520px] grid-cols-1 gap-9 px-4 py-10 sm:grid-cols-2 sm:px-6 sm:py-[54px] lg:grid-cols-5">
        <div className="min-w-0 sm:col-span-2">
          <div className="flex items-center gap-3">
            {org.logo_url&&<Image unoptimized src={org.logo_url} alt="KIIR" width={128} height={128} className="brand-on-dark block h-28 w-28 shrink-0 object-contain" />}
            <span className="font-mono text-[13px] tracking-[0.14em] text-[#7FD4E6]">
              <FieldText en={org.tagline} ur={org.tagline_ur}/>
            </span>
          </div>
          <p className={isUr ? "mt-4.5 max-w-[46ch] font-urdu text-[17px] leading-relaxed text-[#DCE4EC]" : "mt-4.5 max-w-[46ch] font-serif text-[17px] leading-relaxed text-[#DCE4EC]"}>
            <FieldText en={org.mission} ur={org.mission_ur}/>
          </p>
          {socialLinks.some(s=>s.href)&&<div className="mt-5.5 flex gap-2.5">{socialLinks.filter(s=>s.href).map(({key,label,href,Icon,color})=><a key={key} href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className={`grid h-8.5 w-8.5 place-items-center rounded-full text-white ${color}`}><Icon/></a>)}</div>}

        </div>

        <div>
          <div className="mb-3.5 font-mono text-[10.5px] uppercase tracking-[0.14em] text-cyan">{t.quickLinks}</div>
          <div className="flex flex-col gap-2.5 text-[16px]">
            <Link href="/" className="text-[#B9C7D6] hover:text-white">
              {t.home}
            </Link>
            <Link href="/contact">{t.contactCol}</Link>
            <Link href="/about" className="text-[#B9C7D6] hover:text-white">
              {t.about}
            </Link>
            <Link href="/activities" className="text-[#B9C7D6] hover:text-white">
              {t.activitiesNav}
            </Link>
            <Link href="/events" className="text-[#B9C7D6] hover:text-white">
              {t.eventsNav}
            </Link>
            <Link href="/publications" className="text-[#B9C7D6] hover:text-white">
              {t.news}
            </Link>
          </div>
        </div>

        <div>
          <div className="mb-3.5 font-mono text-[10.5px] uppercase tracking-[0.14em] text-cyan">{t.programsCol}</div>
          <div className="flex flex-col gap-2.5 text-[16px]">
            {programs.map((p) => (
              <Link key={p.slug} href={`/programs/${p.slug}`} className="text-[#B9C7D6] hover:text-white">
                <FieldText en={p.name} ur={p.name_ur} serif/>
              </Link>
            ))}
          </div>
        </div>

        {(contact.address||contact.phone||contact.email)&&<div>
          <div className="mb-3.5 font-mono text-[10.5px] uppercase tracking-[0.14em] text-cyan">{t.contactCol}</div>
          <div className="flex flex-col gap-2.5 text-[16px] leading-relaxed text-[#B9C7D6]">
            {contact.address&&<span>{contact.address}</span>}
            {contact.phone&&<a href={`tel:${contact.phone.replace(/\s+/g, "")}`} className="text-[#B9C7D6] hover:text-white">
              {contact.phone}
            </a>}
            {contact.email&&<a href={`mailto:${contact.email}`} className="text-[#B9C7D6] hover:text-white">
              {contact.email}
            </a>}
          </div>
        </div>}
      </div>
      <div className="border-t border-white/[0.12]">
        <div className="mx-auto flex max-w-[1520px] flex-wrap justify-between gap-4 px-4 py-5 font-mono text-[10.5px] tracking-[0.06em] text-[#7E8FA1] sm:px-6 sm:py-[16px_24px_28px]">
          <span>© {new Date().getFullYear()} {org.name}</span>
          <span className="flex gap-4.5">
            <Link href="/privacy" className="text-[#7E8FA1] hover:text-white">
              {isUr?'رازداری':'Privacy'}
            </Link>
            <Link href="/terms" className="text-[#7E8FA1] hover:text-white">
              {isUr?'شرائط':'Terms'}
            </Link>
            <a href={isUr?"/ur/rss.xml":"/rss.xml"} className="text-[#7E8FA1] hover:text-white">
              RSS
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}
