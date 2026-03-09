"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import LanguageSwitcher from "./LanguageSwitcher";
import SearchBox from "./SearchBox";
import { useLang } from "@/lib/useLang";
import { useT } from "@/lib/useT";

export default function MobileMenu() {
  const [open, setOpen] = useState(false);
  const lang = useLang();
  const tr = useT();
  const pathname = usePathname();

  // Close on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Lock body scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <>
      <button
        className={`burger${open ? " is-open" : ""}`}
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Menü schließen" : "Menü öffnen"}
        aria-expanded={open}
      >
        <span />
        <span />
        <span />
      </button>

      <div className={`mobile-nav${open ? " is-open" : ""}`} aria-hidden={!open}>
        <div className="mnav-inner">

          <div className="mnav-search">
            <SearchBox onNavigate={close} />
          </div>

          <div className="mnav-artist">
            <Link href={`/${lang}`} onClick={close}>Rüdiger Schäfer</Link>
          </div>

          <nav className="mnav-main">
            <Link href={`/${lang}/arbeiten/bilder`} onClick={close}>{tr("nav_bilder")}</Link>
            <Link href={`/${lang}/arbeiten/objekte`} onClick={close}>{tr("nav_objekte")}</Link>
            <Link href={`/${lang}/arbeiten/serien`} onClick={close}>{tr("nav_serien")}</Link>
          </nav>

          <nav className="mnav-secondary">
            <Link href={`/${lang}/ausstellungen`} onClick={close}>{tr("nav_ausstellungen")}</Link>
            <Link href={`/${lang}/vita`} onClick={close}>{tr("nav_vita")}</Link>
            <Link href={`/${lang}/kontakt`} onClick={close}>{tr("nav_kontakt")}</Link>
          </nav>

          <div className="mnav-footer">
            <div className="mnav-social">
              <a href="https://www.instagram.com/ricky_schaefer_art/" target="_blank" rel="noopener noreferrer" onClick={close}>
                <img src="/img/insta_icon.png" alt="Instagram" />
              </a>
              <a href="mailto:schaefer-art@mail.de" onClick={close}>
                <img src="/img/mail_icon.png" alt="E-Mail" />
              </a>
            </div>

            <LanguageSwitcher />

            <Link href={`/${lang}/impressum`} onClick={close} className="mnav-impressum">
              {tr("nav_impressum")}
            </Link>
          </div>

        </div>
      </div>
    </>
  );
}
