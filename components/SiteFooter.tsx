"use client";

import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "@/components/LanguageProvider";
import { FacebookIcon, LinkedInIcon, XIcon, YouTubeIcon } from "@/components/icons";
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
  const { t, isUr, pick } = useLanguage();

  // Real brand marks, but KIIR's actual account URLs aren't in the source
  // material this site was built from (the old site's footer only had
  // unlinked template placeholders — see PROJECT-NOTES.md §5 for the same
  // issue with the logo). Wire real handles via the `social` site_setting;
  // until then these render as inert (no fabricated links).
  const socialLinks = [
    { key: "x", label: "X (Twitter)", href: social.x, Icon: XIcon },
    { key: "facebook", label: "Facebook", href: social.facebook, Icon: FacebookIcon },
    { key: "linkedin", label: "LinkedIn", href: social.linkedin, Icon: LinkedInIcon },
    { key: "youtube", label: "YouTube", href: social.youtube, Icon: YouTubeIcon },
  ];

  return (
    <footer className="mt-auto bg-navy text-[#B9C7D6]">
      <div className="mx-auto grid max-w-[1520px] grid-cols-1 gap-9 px-4 py-10 sm:grid-cols-2 sm:px-6 sm:py-[54px] lg:grid-cols-5">
        <div className="min-w-0 sm:col-span-2">
          <div className="flex items-center gap-3">
            <Image src={org.logo_url} alt="KIIR" width={140} height={42} className="block h-[42px] w-auto bg-white px-2.5 py-1.5" />
            <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-[#7FD4E6]">
              Peace through dialogue
            </span>
          </div>
          <p className={isUr ? "mt-4.5 max-w-[46ch] font-urdu text-[17px] leading-relaxed text-[#DCE4EC]" : "mt-4.5 max-w-[46ch] font-serif text-[17px] leading-relaxed text-[#DCE4EC]"}>
            {pick(org.mission, org.mission_ur)}
          </p>
          <div className="mt-5.5 flex gap-2.5">
            {socialLinks.map(({ key, label, href, Icon }) =>
              href ? (
                <a
                  key={key}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="grid h-8.5 w-8.5 place-items-center border border-white/25 text-[#C6D2E0] transition-colors duration-150 hover:border-cyan hover:text-cyan"
                >
                  <Icon />
                </a>
              ) : (
                <span
                  key={key}
                  aria-hidden
                  className="grid h-8.5 w-8.5 cursor-default place-items-center border border-white/10 text-[#5A6C7A]"
                >
                  <Icon />
                </span>
              )
            )}
          </div>
        </div>

        <div>
          <div className="mb-3.5 font-mono text-[10.5px] uppercase tracking-[0.14em] text-cyan">{t.quickLinks}</div>
          <div className="flex flex-col gap-2.5 text-[13.5px]">
            <Link href="/" className="text-[#B9C7D6] hover:text-white">
              {t.home}
            </Link>
            <Link href="/about" className="text-[#B9C7D6] hover:text-white">
              {t.about}
            </Link>
            <Link href="/activities" className="text-[#B9C7D6] hover:text-white">
              {t.activitiesNav}
            </Link>
            <Link href="/events" className="text-[#B9C7D6] hover:text-white">
              {t.eventsNav}
            </Link>
            <Link href="/news" className="text-[#B9C7D6] hover:text-white">
              {t.news}
            </Link>
            <Link href="/contact" className="text-[#B9C7D6] hover:text-white">
              {t.getInvolved}
            </Link>
          </div>
        </div>

        <div>
          <div className="mb-3.5 font-mono text-[10.5px] uppercase tracking-[0.14em] text-cyan">{t.programsCol}</div>
          <div className="flex flex-col gap-2.5 text-[13.5px]">
            {programs.map((p) => (
              <Link key={p.slug} href={`/programs/${p.slug}`} className="text-[#B9C7D6] hover:text-white">
                {pick(p.name, p.name_ur)}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-3.5 font-mono text-[10.5px] uppercase tracking-[0.14em] text-cyan">{t.contactCol}</div>
          <div className="flex flex-col gap-2.5 text-[13.5px] leading-relaxed text-[#B9C7D6]">
            <span>{contact.address}</span>
            <a href={`tel:${contact.phone.replace(/\s+/g, "")}`} className="text-[#B9C7D6] hover:text-white">
              {contact.phone}
            </a>
            <a href={`mailto:${contact.email}`} className="text-[#B9C7D6] hover:text-white">
              {contact.email}
            </a>
          </div>
        </div>
      </div>
      <div className="border-t border-white/[0.12]">
        <div className="mx-auto flex max-w-[1520px] flex-wrap justify-between gap-4 px-4 py-5 font-mono text-[10.5px] tracking-[0.06em] text-[#7E8FA1] sm:px-6 sm:py-[16px_24px_28px]">
          <span>© {new Date().getFullYear()} Kashmir Institute of International Relations</span>
          <span className="flex gap-4.5">
            <Link href="/privacy" className="text-[#7E8FA1] hover:text-white">
              Privacy
            </Link>
            <Link href="/terms" className="text-[#7E8FA1] hover:text-white">
              Terms
            </Link>
            <a href="/rss.xml" className="text-[#7E8FA1] hover:text-white">
              RSS
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}
