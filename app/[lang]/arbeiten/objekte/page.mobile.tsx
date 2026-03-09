"use client";

import { useMemo, useEffect, useRef, useState } from "react";
import rawData from "@/public/data/objekte.json";
import { useSidebarInfo } from "@/components/SidebarInfoContext";

import { Swiper, SwiperSlide } from "swiper/react";
import { Zoom } from "swiper/modules";

import "swiper/css";
import "swiper/css/zoom";

type Objekt = {
  title: string;
  size?: string | null;
  filenames: string[];
  year?: string | number;
};

const normalize = (data: any): Objekt[] => {
  const arr = Array.isArray(data) ? data : [];
  const list = Array.isArray((data as any)?.works) ? (data as any).works : arr;
  return list.map((o: any) => ({
    title: o.title ?? "",
    size: o.size ?? null,
    filenames: o.filenames ?? (o.filename ? [o.filename] : []),
    year: o.year,
  }));
};

const normalizePath = (p: string) => p.replace(/^\/+/, "");

export default function ObjektePageMobile({ navS, navI: _navI }: { navS: string | null; navI: string | null }) {
  const works = useMemo(() => normalize(rawData), []);
  const { setActiveSection } = useSidebarInfo();

  const [activeSectionIdx, setActiveSectionIdxLocal] = useState(() => {
    if (navS !== null) return 0;
    try {
      const saved = sessionStorage.getItem("viewer-objekte");
      if (saved) {
        const data = JSON.parse(saved);
        if (typeof data?.section === "number") return data.section;
      }
    } catch {}
    return 0;
  });
  const activeSectionIdxRef = useRef(activeSectionIdx);

  const [activeIndexes, setActiveIndexes] = useState<number[]>(() => {
    const base = works.map(() => 0);
    if (navS === null) {
      try {
        const saved = sessionStorage.getItem("viewer-objekte");
        if (saved) {
          const data = JSON.parse(saved);
          const parsed = data?.indexes ?? data;
          if (Array.isArray(parsed) && parsed.length === base.length) return parsed;
        }
      } catch {}
    }
    return base;
  });

  useEffect(() => {
    activeSectionIdxRef.current = activeSectionIdx;
    try { sessionStorage.setItem("viewer-objekte", JSON.stringify({ indexes: activeIndexes, section: activeSectionIdx })); } catch {}
  }, [activeIndexes, activeSectionIdx]);

  // Restore scroll position on mount
  useEffect(() => {
    if (navS !== null) return;
    try {
      const saved = sessionStorage.getItem("viewer-objekte");
      if (saved) {
        const data = JSON.parse(saved);
        const s = typeof data?.section === "number" ? data.section : 0;
        if (s > 0) requestAnimationFrame(() => {
          document.getElementById(`section-${s}`)?.scrollIntoView({ behavior: "auto", block: "start" });
        });
      }
    } catch {}
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [activeInfo, setActiveInfo] = useState<{
    title?: string;
    year?: string | number | null;
    size?: string | null;
    index?: number;
    total?: number;
  } | null>(null);

  useEffect(() => {
    setActiveSection(activeSectionIdxRef.current);

    const sections = works.map((_, i) =>
      document.getElementById(`section-${i}`)
    );

    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (visible) {
          const idx = sections.indexOf(visible.target as HTMLElement);
          if (idx !== -1) {
            setActiveSection(idx);
            setActiveSectionIdxLocal(idx);

            const work = works[idx];
            const activeIdx = activeIndexes[idx] ?? 0;
            const total = work.filenames?.length ?? 0;
            const boundedIdx = total > 0 ? Math.min(activeIdx, total - 1) : 0;

            setActiveInfo({
              title: work.title,
              year: work.year,
              size: work.size,
              index: boundedIdx + 1,
              total,
            });
          }
        }
      },
      { threshold: 0.5 }
    );

    sections.forEach((s) => s && obs.observe(s));
    return () => obs.disconnect();
  }, [works, activeIndexes, setActiveSection]);

  useEffect(() => {
    const first = works[0];
    if (!first) return;
    const total = first.filenames?.length ?? 0;
    setActiveInfo({
      title: first.title,
      year: first.year,
      size: first.size,
      index: total > 0 ? 1 : 0,
      total,
    });
  }, [works]);

  // Handle search navigation — scroll to the target section
  useEffect(() => {
    if (navS === null) return;
    const s = parseInt(navS, 10);
    if (isNaN(s)) return;
    requestAnimationFrame(() => {
      document.getElementById(`section-${s}`)?.scrollIntoView({ behavior: "auto", block: "start" });
    });
  }, [navS]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <main className="arbeiten-main mobile-view-only">
      {works.map((work, wIdx) => {
        const activeIdx = activeIndexes[wIdx] ?? 0;
        const total = work.filenames?.length ?? 0;

        return (
          <section
            id={`section-${wIdx}`}
            key={wIdx}
            className="arbeiten-section"
          >
            <header className="technik-title-sticky">
              <h2>{work.title}</h2>
            </header>

            <Swiper
              modules={[Zoom]}
              zoom
              className="mobile-swiper"
              initialSlide={activeIdx}
              onSlideChange={(swiper) => {
                const nextIdx = swiper.activeIndex;

                setActiveIndexes((prev) => {
                  const arr = [...prev];
                  arr[wIdx] = nextIdx;
                  return arr;
                });

                setActiveInfo({
                  title: work.title,
                  year: work.year,
                  size: work.size,
                  index: nextIdx + 1,
                  total,
                });
              }}
            >
              {work.filenames.map((file, i) => (
                <SwiperSlide key={i}>
                  <div className="swiper-zoom-container">
                    <img
                      src={`/${normalizePath(file)}`}
                      alt={work.title}
                      className="carousel-image"
                      loading={wIdx === 0 && i === 0 ? "eager" : "lazy"}
                      onLoad={() => {
                        if (i === activeIdx) {
                          setActiveInfo({
                            title: work.title,
                            year: work.year,
                            size: work.size,
                            index: i + 1,
                            total,
                          });
                        }
                      }}
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
          height: 67vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .mobile-swiper :global(.swiper-wrapper) {
          width: 100%;
          height: 100%;
        }

        .mobile-swiper :global(.swiper-slide) {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .mobile-swiper :global(.swiper-zoom-container) {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .carousel-image {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
          user-select: none;
          -webkit-user-drag: none;
        }
      `}</style>
    </main>
  );
}
