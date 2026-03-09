"use client";

import { useMemo, useEffect, useRef, useState } from "react";
import { useSidebarInfo } from "@/components/SidebarInfoContext";
import { getTechniken, type Technik } from "@/components/normalizeBilder";
import { useLang } from "@/lib/useLang";

import { Swiper, SwiperSlide } from "swiper/react";
import { Zoom } from "swiper/modules";

import "swiper/css";
import "swiper/css/zoom";

function getTechniqueName(t: Technik, lang: string): string {
  if (lang === "fr") return t.technique_fr ?? t.technique;
  if (lang === "en") return t.technique_en ?? t.technique;
  return t.technique;
}

export default function BilderPageMobile({ navS, navI }: { navS: string | null; navI: string | null }) {
  const lang = useLang();
  const techniken: Technik[] = useMemo(() => getTechniken(), []);
  const { setActiveSection } = useSidebarInfo();

  const [activeSectionIdx, setActiveSectionIdx] = useState(() => {
    if (navS !== null) return 0;
    try {
      const saved = sessionStorage.getItem("viewer-bilder");
      if (saved) {
        const data = JSON.parse(saved);
        if (typeof data?.section === "number") return data.section;
      }
    } catch {}
    return 0;
  });

  // Initialise with navI at navS position so Swiper's initialSlide is correct on first render
  const [activeIndexes, setActiveIndexes] = useState<number[]>(() => {
    const base = techniken.map(() => 0);
    if (navS === null) {
      try {
        const saved = sessionStorage.getItem("viewer-bilder");
        if (saved) {
          const data = JSON.parse(saved);
          const parsed = data?.indexes ?? data;
          if (Array.isArray(parsed) && parsed.length === base.length) {
            parsed.forEach((v: number, i: number) => { base[i] = v; });
          }
        }
      } catch {}
    }
    if (navS !== null && navI !== null) {
      const s = parseInt(navS, 10);
      const i = parseInt(navI, 10);
      if (!isNaN(s) && !isNaN(i) && s < base.length) base[s] = i;
    }
    return base;
  });

  // Swiper instance refs so we can call slideTo() for same-page search updates
  const swiperRefs = useRef<any[]>([]);

  const activeIndexesRef = useRef(activeIndexes);
  useEffect(() => {
    activeIndexesRef.current = activeIndexes;
    try { sessionStorage.setItem("viewer-bilder", JSON.stringify({ indexes: activeIndexes, section: activeSectionIdx })); } catch {}
  }, [activeIndexes, activeSectionIdx]);

  // Restore scroll position on mount
  useEffect(() => {
    if (navS !== null) return;
    try {
      const saved = sessionStorage.getItem("viewer-bilder");
      if (saved) {
        const data = JSON.parse(saved);
        const s = typeof data?.section === "number" ? data.section : 0;
        if (s > 0) requestAnimationFrame(() => {
          document.getElementById(`section-${s}`)?.scrollIntoView({ behavior: "auto", block: "start" });
        });
      }
    } catch {}
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setActiveSection(activeSectionIdx);
  }, [activeSectionIdx, setActiveSection]);

  useEffect(() => {
    const sections = techniken
      .map((_, i) => document.getElementById(`section-${i}`))
      .filter(Boolean) as HTMLElement[];

    if (!sections.length) return;

    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => (b.intersectionRatio ?? 0) - (a.intersectionRatio ?? 0))[0];

        if (!visible) return;

        const idx = sections.indexOf(visible.target as HTMLElement);
        if (idx !== -1) setActiveSectionIdx(idx);
      },
      { threshold: 0.5 }
    );

    sections.forEach((s) => obs.observe(s));
    return () => obs.disconnect();
  }, [techniken]);

  // Handle search navigation (works on mount and on same-page param changes)
  useEffect(() => {
    if (navS === null) return;
    const s = parseInt(navS, 10);
    const i = navI !== null ? parseInt(navI, 10) : 0;
    if (isNaN(s) || isNaN(i)) return;
    requestAnimationFrame(() => {
      document.getElementById(`section-${s}`)?.scrollIntoView({ behavior: "auto", block: "start" });
      swiperRefs.current[s]?.slideTo(i, 0);
      setActiveIndexes((prev) => {
        const next = [...prev];
        next[s] = i;
        return next;
      });
    });
  }, [navS, navI]); // eslint-disable-line react-hooks/exhaustive-deps

  const activeInfo = useMemo(() => {
    const t = techniken[activeSectionIdx];
    if (!t) return null;

    const works = t.works ?? [];
    const slideIdx = activeIndexes[activeSectionIdx] ?? 0;
    const w = works[slideIdx] ?? works[0];
    if (!w) return null;

    return {
      title: w.title,
      year: typeof w.year === "number" ? String(w.year) : w.year ? String(w.year) : undefined,
      size: w.size ? String(w.size) : undefined,
      index: slideIdx + 1,
      total: works.length,
    };
  }, [techniken, activeSectionIdx, activeIndexes]);

  return (
    <main className="arbeiten-main mobile-view-only">
      {techniken.map((technik, tIdx) => {
        const works = technik.works ?? [];
        const activeIdx = activeIndexes[tIdx] ?? 0;

        return (
          <section id={`section-${tIdx}`} key={tIdx} className="arbeiten-section">
            <header className="technik-title-sticky">
              <h2>{getTechniqueName(technik, lang)}</h2>
            </header>

            <Swiper
              modules={[Zoom]}
              zoom
              className="mobile-swiper"
              initialSlide={activeIdx}
              onSwiper={(swiper) => { swiperRefs.current[tIdx] = swiper; }}
              onSlideChange={(swiper) => {
                const nextIdx = swiper.activeIndex;
                setActiveIndexes((prev) => {
                  const arr = prev.slice();
                  arr[tIdx] = nextIdx;
                  return arr;
                });
              }}
            >
              {works.map((w, i) => (
                <SwiperSlide key={i}>
                  <div className="swiper-zoom-container">
                    <img
                      src={`/${w.filename.replace(/^\/+/, "")}`}
                      alt={w.title}
                      className="carousel-image"
                      draggable={false}
                      loading={tIdx === 0 && i === 0 ? "eager" : "lazy"}
                    />
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </section>
        );
      })}

      {activeInfo && activeInfo.title && (
        <div className="arbeit-meta">
          <div className="arbeit-meta-head">
            <strong className="arbeit-meta-title">{activeInfo.title}</strong>
          </div>
          <div className="arbeit-meta-lines">
            {activeInfo.year && <div>{activeInfo.year}</div>}
            {activeInfo.size && <div>{activeInfo.size} cm</div>}
          </div>
          {typeof activeInfo.index === "number" &&
            typeof activeInfo.total === "number" &&
            activeInfo.total > 1 && (
              <small className="arbeit-meta-count">{activeInfo.index} / {activeInfo.total}</small>
            )}
        </div>
      )}

      <style jsx>{`
        .mobile-swiper {
          width: 100%;
          height: 100%;
        }
      `}</style>
    </main>
  );
}
