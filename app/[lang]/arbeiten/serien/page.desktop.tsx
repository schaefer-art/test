"use client";

import { useEffect, useMemo, useRef } from "react";
import rawData from "@/public/data/serien.json";
import { useSidebarInfo } from "@/components/SidebarInfoContext";
import { useLang } from "@/lib/useLang";
import { useSectionViewer } from "@/components/useSectionViewer";
import OverviewOverlay, { type OverviewItem } from "@/components/OverviewOverlay";

const toThumb = (src: string) =>
  src.includes("/thumbs/") ? src : src.replace(/\/([^/]+)$/, "/thumbs/$1");

interface Work {
  piece: string | number | null;
  year: number | null;
  type: string | null;
  size: string | null;
  filenames: string[];
  thumbs?: string[];
  misc?: string | null;
  misc_fr?: string | null;
  misc_en?: string | null;
}

interface Serie {
  series: string | number;
  year?: number | null;
  works: Work[];
}

function normStr(raw: unknown): string | null {
  if (raw === null || raw === undefined || String(raw).trim() === "") return null;
  return String(raw);
}

function pickMisc(
  w: { misc?: string | null; misc_fr?: string | null; misc_en?: string | null },
  lang: string
): string | undefined {
  const raw =
    lang === "fr" ? (w.misc_fr || w.misc) :
    lang === "en" ? (w.misc_en || w.misc) :
    w.misc;
  return raw ? String(raw) : undefined;
}

const normalizeSerien = (data: Serie[]): Serie[] =>
  (Array.isArray(data) ? data : []).map((serie) => ({
    ...serie,
    series: String(serie?.series ?? ""),
    year: serie?.year ?? null,
    works: Array.isArray(serie?.works)
      ? serie.works.map((w) => ({
          ...w,
          piece: w?.piece != null ? String(w.piece) : "",
          year: w?.year ?? null,
          type: w?.type ?? "",
          size: w?.size ?? "",
          filenames: Array.isArray(w?.filenames) ? w.filenames : [],
          thumbs: Array.isArray((w as any)?.thumbs) ? (w as any).thumbs : [],
          misc: normStr((w as any)?.misc),
          misc_fr: normStr((w as any)?.misc_fr),
          misc_en: normStr((w as any)?.misc_en),
        }))
      : [],
  }));

export default function SerienPage({ navS, navI }: { navS: string | null; navI: string | null }) {
  const serien = useMemo(() => normalizeSerien(rawData as Serie[]), []);
  const { setInfo, setActiveSection } = useSidebarInfo();
  const lang = useLang();

  const viewer = useSectionViewer<Serie, Work>(
    serien,
    {
      getItems: (_sIdx, s) => s?.works ?? [],
      getSrc: (w) => w?.filenames?.[0] ?? "",
      getAlt: (w, _sIdx, s) => String(w?.piece ?? s?.series ?? ""),
      getSidebarInfo: (w, idx, total, _sIdx, s) => ({
        title: String(w?.piece ?? s?.series ?? ""),
        misc: pickMisc(w, lang),
        year: w?.year != null ? String(w.year) : undefined,
        size: w?.size ? `${String(w.size)} cm` : undefined,
        index: idx + 1,
        total,
      }),
    },
    { setInfo, setActiveSection },
    { enableSwipe: false, enableKeyboard: true, storageKey: "viewer-serien" }
  );

  const viewerRef = useRef(viewer);
  useEffect(() => { viewerRef.current = viewer; });

  useEffect(() => {
    if (navS === null || navI === null) return;
    const s = parseInt(navS, 10);
    const i = parseInt(navI, 10);
    if (isNaN(s) || isNaN(i)) return;
    requestAnimationFrame(() => {
      document.getElementById(`section-${s}`)?.scrollIntoView({ behavior: "auto", block: "start" });
      viewerRef.current.select(s, i);
    });
  }, [navS, navI]); // eslint-disable-line react-hooks/exhaustive-deps

  const overviewItems: OverviewItem[] = useMemo(() => {
    if (viewer.overviewSectionIdx == null) return [];
    const serie = serien[viewer.overviewSectionIdx];
    const fallback = String(serie?.series ?? "");

    return (serie?.works ?? [])
      .map((w, wi) => {
        const original = w?.filenames?.[0] ?? "";
        const thumb = w?.thumbs?.[0] || (original ? toThumb(original) : "");

        return {
          key: wi,
          src: thumb,
          alt: w?.piece ? String(w.piece) : fallback,
          title: w?.piece ? String(w.piece) : fallback,
          size: w?.size ? `${String(w.size)} cm` : "",
          index: wi,
        };
      })
      .filter((it) => it.src);
  }, [viewer.overviewSectionIdx, serien]);

  return (
    <>
      <main
        ref={viewer.mainRef}
        tabIndex={0}
        className={`arbeiten-main ${viewer.overviewOpen ? "no-snap" : ""}`}
      >
        {serien.map((serie, sIdx) => {
          const works = serie.works ?? [];
          const currentIdx = viewer.idxBySection[sIdx] ?? 0;
          const work = works[currentIdx];

          const src = work?.filenames?.[0] ?? "";

          const metaTitle = String(work?.piece ?? serie.series ?? "");
          const metaMisc = pickMisc(work, lang) ?? "";
          const metaYear = work?.year != null ? String(work.year) : "";
          const metaSize = work?.size ? `${String(work.size)} cm` : "";
          const metaCount = works.length ? `${currentIdx + 1} / ${works.length}` : "";

          return (
            <section
              id={`section-${sIdx}`}
              key={sIdx}
              className="arbeiten-section serien-section"
            >
              <div className="arbeit-einzeln">
                <div className="arbeit-stage">
                  {src && (
                    <img
                      ref={viewer.setImgRef(sIdx)}
                      src={src}
                      alt={metaTitle}
                      className="arbeit-bild"
                      draggable={false}
                      loading={sIdx === 0 ? "eager" : "lazy"}
                    />
                  )}
                  <div ref={viewer.setOverlayRef(sIdx)} className="image-flash" />
                </div>

                {!viewer.overviewOpen && metaTitle && (
                  <div className="arbeit-meta arbeit-meta--full" aria-live="polite">
                    <div className="arbeit-meta-head">
                      <strong className="arbeit-meta-title">{metaTitle}</strong>
                      {metaMisc && <span className="arbeit-meta-misc">{metaMisc}</span>}
                    </div>

                    <div className="arbeit-meta-lines">
                      {metaYear && <div className="arbeit-meta-year">{metaYear}</div>}
                      {metaSize && <div className="arbeit-meta-size">{metaSize}</div>}
                    </div>

                    {metaCount && <small className="arbeit-meta-count">{metaCount}</small>}
                  </div>
                )}

                <div
                  onClick={() => viewer.prev(sIdx)}
                  className="click-zone left"
                  title="Vorheriges Werk"
                />
                <div
                  onClick={() => viewer.openOverview(sIdx)}
                  className="click-zone center"
                  title="Übersicht anzeigen"
                />
                <div
                  onClick={() => viewer.next(sIdx)}
                  className="click-zone right"
                  title="Nächstes Werk"
                />
              </div>

              <style jsx>{`
                .arbeit-einzeln {
                  width: 100%;
                  align-self: stretch;
                }
                .arbeit-stage {
                  width: 100%;
                }
                .arbeit-meta--full {
                  width: 100%;
                  align-self: stretch;
                  text-align: left;
                }
                .arbeit-meta-head {
                  display: inline-flex;
                  align-items: baseline;
                  gap: 0.55em;
                }
                .arbeit-meta-misc {
                  font-size: 0.95em;
                  color: rgba(0, 0, 0, 0.55);
                  font-weight: 400;
                  white-space: nowrap;
                }
              `}</style>
            </section>
          );
        })}
      </main>

      <OverviewOverlay
        open={viewer.overviewOpen && viewer.overviewSectionIdx !== null}
        onClose={viewer.closeOverview}
        items={overviewItems}
        activeIndex={
          viewer.overviewSectionIdx !== null
            ? viewer.idxBySection[viewer.overviewSectionIdx] ?? 0
            : 0
        }
        onSelect={(idx) => viewer.select(viewer.overviewSectionIdx!, idx)}
        setThumbRef={viewer.setThumbRef}
      />
    </>
  );
}
