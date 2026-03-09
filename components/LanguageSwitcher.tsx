"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLang } from "@/lib/useLang";
import type { Lang } from "@/lib/translations";

const LANGS: Lang[] = ["de", "fr", "en"];

export default function LanguageSwitcher() {
  const pathname = usePathname();
  const currentLang = useLang();

  function switchTo(lang: Lang): string {
    // Strip the current lang prefix from pathname
    const withoutLang = pathname.replace(/^\/(de|fr|en)(\/|$)/, "/");
    const clean = withoutLang === "/" ? "" : withoutLang;
    return `/${lang}${clean}`;
  }

  return (
    <div className="lang-switcher">
      {LANGS.map((lang, i) => (
        <span key={lang}>
          {lang === currentLang ? (
            <span className="lang-current">{lang.toUpperCase()}</span>
          ) : (
            <Link href={switchTo(lang)}>{lang.toUpperCase()}</Link>
          )}
        </span>
      ))}
    </div>
  );
}
