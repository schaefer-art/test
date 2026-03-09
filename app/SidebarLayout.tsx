"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebarInfo } from "@/components/SidebarInfoContext";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import rawBilder from "@/public/data/bilder.json";
import rawObjekte from "@/public/data/objekte.json";
import rawSerien from "@/public/data/serien.json";

import LiveBadge from "@/components/LiveBadge";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import SearchBox from "@/components/SearchBox";
import { useLang } from "@/lib/useLang";
import { useT } from "@/lib/useT";

export default function SidebarLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const lang = useLang();
  const tr = useT();
  const { setInfo, activeSection } = useSidebarInfo();
  const [activeMenu, setActiveMenu] = useState<"bilder" | "objekte" | "serien" | null>(null);

  const bilderData = useMemo(
    () => (rawBilder as any[]).map((t) => t[`technique_${lang}`] ?? t.technique),
    [lang]
  );
  const objekteData = useMemo(() => (rawObjekte as any[]).map((o) => o.title), []);
  const serienData = useMemo(() => (rawSerien as any[]).map((s) => s.series), []);

  useEffect(() => {
    if (!pathname?.startsWith(`/${lang}/arbeiten`)) setInfo(null);
  }, [pathname, lang, setInfo]);

  useEffect(() => {
    if (!pathname) return;

    if (pathname.startsWith(`/${lang}/arbeiten/bilder`)) setActiveMenu("bilder");
    else if (pathname.startsWith(`/${lang}/arbeiten/objekte`)) setActiveMenu("objekte");
    else if (pathname.startsWith(`/${lang}/arbeiten/serien`)) setActiveMenu("serien");
    else setActiveMenu(null);
  }, [pathname, lang]);

  const isActive = (path: string) => {
    if (!pathname) return "";
    const cleanPath = pathname.endsWith("/") && pathname.length > 1 ? pathname.slice(0, -1) : pathname;
    return cleanPath === path || cleanPath.startsWith(path + "/") ? "active" : "";
  };

  const subList = useMemo(() => {
    if (activeMenu === "bilder") return bilderData;
    if (activeMenu === "objekte") return objekteData;
    if (activeMenu === "serien") return serienData;
    return [];
  }, [activeMenu, bilderData, objekteData, serienData]);

  // ===== AUTO-SCALE NAV FONT-SIZE TO MATCH LOGO WIDTH =====
  const logoRef = useRef<HTMLDivElement | null>(null);
  const navRowRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    const logoEl = logoRef.current;
    const navEl = navRowRef.current;
    if (!logoEl || !navEl) return;

    let raf = 0;

    const compute = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const targetW = logoEl.getBoundingClientRect().width;
        if (!targetW || targetW < 10) return;

        // Reset font-size to measure natural text width
        const prev = navEl.style.fontSize;
        navEl.style.fontSize = "16px";
        const naturalW = navEl.scrollWidth;
        navEl.style.fontSize = prev;

        if (!naturalW || naturalW < 10) return;

        const scaled = 16 * (targetW / naturalW);
        const clamped = Math.max(10, Math.min(scaled, 28));
        navEl.style.fontSize = `${clamped}px`;
      });
    };

    compute();

    const ro = new ResizeObserver(compute);
    ro.observe(logoEl);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [lang]);
  // =========================================================

  return (
    <div className="sidebar-layout">
      <aside className="sidebar sidebar-remodel">
        <div className="sidebar-header">
          <div className="sidebar-logo" ref={logoRef}>
            <Link href={`/${lang}`} className="sidebar-logoLink" aria-label="Rüdiger Schäfer">
              <span className="sidebar-logoMark" />
            </Link>
          </div>

          <div
            ref={navRowRef}
            className="sidebar-work-main sidebar-work-main--row"
            aria-label={tr("nav_arbeiten_label")}
          >
            <Link href={`/${lang}/arbeiten/bilder`} className={isActive(`/${lang}/arbeiten/bilder`)}>
              {tr("nav_bilder")}
            </Link>
            <span className="sidebar-dot" aria-hidden="true">·</span>
            <Link href={`/${lang}/arbeiten/objekte`} className={isActive(`/${lang}/arbeiten/objekte`)}>
              {tr("nav_objekte")}
            </Link>
            <span className="sidebar-dot" aria-hidden="true">·</span>
            <Link href={`/${lang}/arbeiten/serien`} className={isActive(`/${lang}/arbeiten/serien`)}>
              {tr("nav_serien")}
            </Link>
          </div>
        </div>

        <div className="sidebar-work" aria-label="Unterkapitel">
          <div className="sidebar-subchapters">
            {subList.length > 0 ? (
              <ul>
                {subList.map((name, i) => (
                  <li key={i}>
                    <a href={`#section-${i}`} className={activeSection === i ? "active" : ""}>
                      {name}
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="sidebar-subchapters-empty" />
            )}
          </div>
        </div>

        <div className="sidebar-secondary">
          <span className="link-with-badge">
            <Link href={`/${lang}/ausstellungen`} className={isActive(`/${lang}/ausstellungen`)}>
              {tr("nav_ausstellungen")}
            </Link>
            <LiveBadge />
          </span>

          <Link href={`/${lang}/vita`} className={isActive(`/${lang}/vita`)}>
            {tr("nav_vita")}
          </Link>

          <Link href={`/${lang}/kontakt`} className={isActive(`/${lang}/kontakt`)}>
            {tr("nav_kontakt")}
          </Link>

          <SearchBox />

          <div className="sidebar-meta">
            <div className="sidebar-meta-row">
              <div className="sidebar-icons">
                <a href="https://www.instagram.com/ricky_schaefer_art/" target="_blank" rel="noopener noreferrer">
                  <img src="/img/insta_icon.png" alt="Instagram" />
                </a>
                <a href="mailto:schaefer-art@mail.de">
                  <img src="/img/mail_icon.png" alt="E-Mail" />
                </a>
              </div>
              <LanguageSwitcher />
            </div>
            <div className="sidebar-legal">
              <Link href={`/${lang}/impressum`} className={isActive(`/${lang}/impressum`)}>
                {tr("nav_impressum")}
              </Link>
            </div>
          </div>
        </div>
      </aside>

      <main className="sidebar-main">{children}</main>
    </div>
  );
}
