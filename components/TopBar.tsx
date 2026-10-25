"use client";

import { useLanguage } from "@/components/LanguageProvider";
import { FacebookIcon, InstagramIcon, LinkedInIcon, XIcon } from "@/components/icons";
import type { ContactSettings, SocialSettings } from "@/lib/types";

export default function TopBar({ contact, social }: { contact: ContactSettings; social: SocialSettings }) {
  const { lang, setLang } = useLanguage();
  const socialLinks = [
    { label: "Facebook", href: social.facebook, Icon: FacebookIcon, className: "bg-[#1877F2]" },
    { label: "Instagram", href: social.instagram, Icon: InstagramIcon, className: "bg-[#D62976]" },
    { label: "X", href: social.x, Icon: XIcon, className: "bg-black" },
    { label: "LinkedIn", href: social.linkedin, Icon: LinkedInIcon, className: "bg-[#0A66C2]" },
  ];

  return (
    <div className="bg-navy text-[#C6D2E0]">
      <div className="mx-auto flex min-h-10 max-w-[1520px] flex-wrap items-center justify-between gap-4 px-4 sm:px-6">
        {(socialLinks.some(s=>s.href)||contact.phone)&&<div className="flex items-center gap-2 py-2">
          {socialLinks.filter(s=>s.href).map(({label,href,Icon,className})=><a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className={`grid h-6 w-6 place-items-center rounded-full text-white ${className}`}><Icon size={12}/></a>)}
          {contact.phone&&<a href={`tel:${contact.phone.replace(/\s+/g,'')}`} className="ml-2 font-mono text-[12px] text-white hover:text-cyan">{contact.phone}</a>}
        </div>}
        <div className="ml-auto flex items-center gap-3.5 py-1.5">
          <div role="group" aria-label="Language" className="flex border border-white/[0.18]">
            <button
              type="button"
              onClick={() => setLang("en")}
              aria-pressed={lang === "en"}
              className={`cursor-pointer px-2.5 py-[5px] font-mono text-[10.5px] tracking-[0.08em] transition-colors duration-150 ${
                lang === "en" ? "bg-cyan text-navy" : "bg-transparent text-[#C6D2E0] hover:text-white"
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLang("ur")}
              aria-pressed={lang === "ur"}
              className={`cursor-pointer px-2.5 py-[5px] font-urdu text-[13px] tracking-normal transition-colors duration-150 ${
                lang === "ur" ? "bg-cyan text-navy" : "bg-transparent text-[#C6D2E0] hover:text-white"
              }`}
            >
              اردو
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
