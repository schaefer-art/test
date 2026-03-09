"use client";

import { useState, useEffect, useRef } from "react";
import rawData from "@/public/data/serien.json";
import { useSidebarInfo } from "@/components/SidebarInfoContext";

import { Swiper, SwiperSlide } from "swiper/react";
import { Zoom } from "swiper/modules";

import "swiper/css";
import "swiper/css/zoom";

interface Work {
  piece: string | number | null;
  year: number | null;
  type: string | null;
  size: string | null;
  filenames: string[];
  thumbs: string[];
}

interface Serie {
  series: string | number;
  year?: number | null;
  works: Work[];
}

const SERIEN: Serie[] = (rawData as any[]).map((serie) => ({
  ...serie,
  series: String(serie.series ?? ""),
  works: (serie.works ?? []).map((w: any) => ({
    ...w,
    piece: w.piece != null ? String(w.piece) : "",
    type: w.type ?? "",
    size: w.size ?? "",
    filenames: w.filenames ?? [],
    thumbs: Array.isArray(w.thumbs) ? w.thumbs : [],
  })),
}));

function initGridView(navS: string | null): boolean[] {
  const s = navS !== null ? parseInt(navS, 10) : NaN;
  return SERIEN.map((_, idx) => isNaN(s) || idx !== s);
}

function initImgIdx(navS: string | null, navI: string | null): number[] {
  const s = navS !== null ? parseInt(navS, 10) : NaN;
  const i = navI !== null ? parseInt(navI, 10) : 0;
  const validI = isNaN(i) ? 0 : i;
  return SERIEN.map((_, idx) => (!isNaN(s) && idx === s) ? validI : 0);
}

export default function SerienPageMobile({ navS, navI }: { navS: string | null; navI: string | null }) {
  const [activeSerie, setActiveSerie] = useState(() => {
    if (navS !== null) return 0;
    try {
      const saved = sessionStorage.getItem("viewer-serien");
      if (saved) {
        const data = JSON.parse(saved);
        if (typeof data?.section === "number") return data.section;
      }
    } catch {}
    return 0;
  });
  const [gridView, setGridView] = useState<boolean[]>(() => initGridView(navS));
  const [imgIdxBySerie, setImgIdxBySerie] = useState<number[]>(() => {
    const base = initImgIdx(navS, navI);
    if (navS === null) {
      try {
        const saved = sessionStorage.getItem("viewer-serien");
        if (saved) {
          const data = JSON.parse(saved);
          const parsed = data?.indexes ?? data;
          if (Array.isArray(parsed) && parsed.length === base.length) return parsed;
        }
      } catch {}
    }
    return base;
  });

  const { setActiveSection } = useSidebarInfo();

  useEffect(() => {
    try { sessionStorage.setItem("viewer-serien", JSON.stringify({ indexes: imgIdxBySerie, section: activeSerie })); } catch {}
  }, [imgIdxBySerie, activeSerie]);

  // Restore scroll position on mount
  useEffect(() => {
    if (navS !== null) return;
    try {
      const saved = sessionStorage.getItem("viewer-serien");
      if (saved) {
        const data = JSON.parse(saved);
        const s = typeof data?.section === "number" ? data.section : 0;
        if (s > 0) requestAnimationFrame(() => {
          document.getElementById(`section-${s}`)?.scrollIntoView({ behavior: "auto", block: "start" });
        });
      }
    } catch {}
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Swiper instance refs for programmatic navigation on same-page search updates
  const swiperRefs = useRef<any[]>([]);

  const [activeInfo, setActiveInfo] = useState<{
    title?: string;
    year?: string | number | null;
    size?: string | null;
    index?: number;
    total?: number;
  } | null>(null);

  // Scroll to nav target on mount
  useEffect(() => {
    if (navS === null) return;
    const s = parseInt(navS, 10);
    if (isNaN(s)) return;
    requestAnimationFrame(() => {
      document.getElementById(`section-${s}`)?.scrollIntoView({ behavior: "auto", block: "start" });
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setActiveSection(activeSerie);
  }, [setActiveSection, activeSerie]);

  // Scroll observer
  useEffect(() => {
    const sections = SERIEN.map((_, i) =>
      document.getElementById(`section-${i}`)
    );

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (visible) {
          const idx = sections.indexOf(visible.target as HTMLElement);
          if (idx !== -1 && idx !== activeSerie) {
            setActiveSerie(idx);
            setActiveSection(idx);

            const serie = SERIEN[idx];
            const workIdx = imgIdxBySerie[idx] ?? 0;
            const work = serie?.works[workIdx];
            const total = serie?.works?.length ?? 0;

            if (!gridView[idx] && work) {
              setActiveInfo({
                title:
                  work.piece != null && work.piece !== ""
                    ? String(work.piece)
                    : String(serie.series ?? ""),
                year: work.year ?? serie.year,
                size: work.size ?? "",
                index: workIdx + 1,
                total,
              });
            } else {
              setActiveInfo(null);
            }
          }
        }
      },
      { threshold: 0.5 }
    );

    sections.forEach((s) => s && observer.observe(s));
    return () => observer.disconnect();
  }, [activeSerie, gridView, imgIdxBySerie, setActiveSection]);

  // Handle same-page search navigation (params change after mount)
  useEffect(() => {
    if (navS === null) return;
    const s = parseInt(navS, 10);
    const i = navI !== null ? parseInt(navI, 10) : 0;
    if (isNaN(s) || isNaN(i)) return;

    setGridView((prev) => {
      const next = [...prev];
      next[s] = false;
      return next;
    });
    setImgIdxBySerie((prev) => {
      const next = [...prev];
      next[s] = i;
      return next;
    });

    requestAnimationFrame(() => {
      document.getElementById(`section-${s}`)?.scrollIntoView({ behavior: "auto", block: "start" });
      swiperRefs.current[s]?.slideTo(i, 0);
    });
  }, [navS, navI]); // eslint-disable-line react-hooks/exhaustive-deps

  const selectImage = (sIdx: number, workIndex: number) => {
    setImgIdxBySerie((prev) => {
      const next = [...prev];
      next[sIdx] = workIndex;
      return next;
    });

    setGridView((prev) => {
      const next = [...prev];
      next[sIdx] = false;
      return next;
    });

    const serie = SERIEN[sIdx];
    const work = serie?.works[workIndex];
    const total = serie?.works?.length ?? 0;

    if (work) {
      setActiveInfo({
        title:
          work.piece != null && work.piece !== ""
            ? String(work.piece)
            : String(serie.series ?? ""),
        year: work.year ?? serie.year,
        size: work.size ?? "",
        index: workIndex + 1,
        total,
      });
    }

    const sectionEl = document.getElementById(`section-${sIdx}`);
    if (sectionEl) {
      sectionEl.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const backToGrid = (sIdx: number) => {
    setGridView((prev) => {
      const next = [...prev];
      next[sIdx] = true;
      return next;
    });
    setActiveInfo(null);
  };

  const handleSlideChange = (sIdx: number, nextIdx: number) => {
    setImgIdxBySerie((prev) => {
      const next = [...prev];
      next[sIdx] = nextIdx;
      return next;
    });

    const serie = SERIEN[sIdx];
    const work = serie?.works[nextIdx];
    const total = serie?.works?.length ?? 0;

    if (work) {
      setActiveInfo({
        title:
          work.piece != null && work.piece !== ""
            ? String(work.piece)
            : String(serie.series ?? ""),
        year: work.year ?? serie.year,
        size: work.size ?? "",
        index: nextIdx + 1,
        total,
      });
    }
  };

  return (
    <main className="arbeiten-main mobile-view-only serien-main">
      {SERIEN.map((serie, sIdx) => {
        const works = serie.works;
        const activeWorkIdx = imgIdxBySerie[sIdx] ?? 0;

        const allImages = works.flatMap((w, wi) =>
          w.filenames.map((src, fi) => ({
            src,
            thumb: w.thumbs[fi] || src,
            title: w.piece != null ? String(w.piece) : "",
            workIndex: wi,
          }))
        );

        return (
          <section
            id={`section-${sIdx}`}
            key={sIdx}
            className="arbeiten-section serien-section"
          >
            <header className="technik-title-sticky">
              <h2>{String(serie.series ?? "")}</h2>
              {serie.year && (
                <div className="serien-year">{String(serie.year)}</div>
              )}
            </header>

            {gridView[sIdx] ? (
              <div className="grid-container serien-grid">
                {allImages.map((imgObj, idx) => (
                  <div
                    key={idx}
                    className="grid-item"
                    onClick={() => selectImage(sIdx, imgObj.workIndex)}
                  >
                    <img
                      src={imgObj.thumb}
                      alt={imgObj.title || String(serie.series)}
                      title={imgObj.title || ""}
                      className="grid-bild"
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <Swiper
                modules={[Zoom]}
                zoom
                className="mobile-swiper"
                initialSlide={activeWorkIdx}
                onSwiper={(swiper) => { swiperRefs.current[sIdx] = swiper; }}
                onSlideChange={(swiper) =>
                  handleSlideChange(sIdx, swiper.activeIndex)
                }
              >
                {works.map((w, wi) => {
                  const firstImg = w.filenames[0];
                  if (!firstImg) return null;
                  return (
                    <SwiperSlide key={wi}>
                      <div className="swiper-zoom-container">
                        <img
                          src={firstImg}
                          alt={
                            (w.piece != null && String(w.piece)) ||
                            String(serie.series)
                          }
                          className="carousel-image"
                          loading={sIdx === 0 && wi === 0 ? "eager" : "lazy"}
                          onClick={() => backToGrid(sIdx)}
                        />
                      </div>
                    </SwiperSlide>
                  );
                })}
              </Swiper>
            )}
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

        .serien-year {
          font-size: 0.8rem;
          margin-top: 4px;
          color: #555;
        }
      `}</style>
    </main>
  );
}
