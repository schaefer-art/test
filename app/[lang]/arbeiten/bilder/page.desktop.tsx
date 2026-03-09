// app/arbeiten/bilder/page.tsx
"use client";

import { useEffect, useMemo, useRef } from "react";
import { useSidebarInfo } from "@/components/SidebarInfoContext";
import { getTechniken, type Technik } from "@/components/normalizeBilder";
import { useLang } from "@/lib/useLang";
import { useSectionViewer } from "@/components/useSectionViewer";
import OverviewOverlay, { type OverviewItem } from "@/components/OverviewOverlay";

const normalizePath = (path: string) => path.replace(/^\/+/, "");

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

// Optional fallback if thumb isn't present in JSON yet
const toThumb = (src: string) =>
  src.includes("/thumbs/") ? src : src.replace(/\/([^/]+)$/, "/thumbs/$1");

export default function BilderPage({ navS, navI }: { navS: string | null; navI: string | null }) {
  const techniken: Technik[] = useMemo(() => getTechniken(), []);
  const { setInfo, setActiveSection } = useSidebarInfo();
  const lang = useLang();

  const viewer = useSectionViewer<Technik, Technik["works"][number]>(
    techniken,
    {
      getItems: (_tIdx, t) => t?.works ?? [],
      getSrc: (w) => (w?.filename ? `/${normalizePath(w.filename)}` : ""),
      getAlt: (w) => w?.title ?? "",
      getSidebarInfo: (w, idx, total) => ({
        title: w.title ?? "",
        year: typeof w.year === "number" ? String(w.year) : undefined,
        size: w.size ? `${String(w.size)} cm` : undefined,
        misc: pickMisc(w as any, lang),
        index: idx + 1,
        total,
      }),
    },
    { setInfo, setActiveSection },
    { enableSwipe: true, enableKeyboard: true, storageKey: "viewer-bilder" }
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
    const t = techniken[viewer.overviewSectionIdx];

    return (t?.works ?? []).map((w, i) => {
      const original = w?.filename ? `/${normalizePath(w.filename)}` : "";
      const thumb =
        (w as any)?.thumb ? `/${normalizePath((w as any).thumb)}` : toThumb(original);

      return {
        key: i,
        src: original,
        thumbSrc: thumb,
        w: (w as any)?.w ?? undefined,
        h: (w as any)?.h ?? undefined,
        alt: w?.title ?? "",
        title: w?.title ?? "",
        size: w?.size ? `${String(w.size)} cm` : "",
        index: i,
      };
    });
  }, [viewer.overviewSectionIdx, techniken]);

  return (
    <>
      <main
        ref={viewer.mainRef}
        tabIndex={0}
        className={`arbeiten-main ${viewer.overviewOpen ? "no-snap" : ""}`}
      >
        {techniken.map((technik, tIdx) => {
          const works = technik.works ?? [];
          const currentIdx = viewer.idxBySection[tIdx] ?? 0;
          const work = works[currentIdx];

          const src = work?.filename ? `/${normalizePath(work.filename)}` : "";

          const metaTitle = work?.title ?? "";
          const metaMisc = pickMisc(work as any, lang) ?? "";
          const metaYear =
            typeof work?.year === "number" ? String(work.year) : work?.year ? String(work.year) : "";
          const metaSize = work?.size ? `${String(work.size)} cm` : "";
          const metaCount = works.length ? `${currentIdx + 1} / ${works.length}` : "";

          return (
            <section id={`section-${tIdx}`} key={tIdx} className="arbeiten-section">
              <div
                className="arbeit-einzeln"
                onTouchStart={viewer.onTouchStart}
                onTouchMove={viewer.onTouchMove}
                onTouchEnd={() => viewer.onTouchEnd?.(tIdx)}
              >
                {/* IMAGE STAGE (row 1) */}
                <div className="arbeit-stage">
                  <img
                    ref={viewer.setImgRef(tIdx)}
                    src={src}
                    alt={metaTitle}
                    className="arbeit-bild"
                    draggable={false}
                    loading={tIdx === 0 ? "eager" : "lazy"}
                  />
                  <div ref={viewer.setOverlayRef(tIdx)} className="image-flash" />
                </div>

                {/* META (row 2, always bottom) */}
                {!viewer.overviewOpen && metaTitle && (
                  <div className="arbeit-meta" aria-live="polite">
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

                {!viewer.isSwiping && (
                  <>
                    <div onClick={() => viewer.prev(tIdx)} className="click-zone left" title="Vorheriges Bild" />
                    <div onClick={() => viewer.openOverview(tIdx)} className="click-zone center" title="Übersicht anzeigen" />
                    <div onClick={() => viewer.next(tIdx)} className="click-zone right" title="Nächstes Bild" />
                  </>
                )}
              </div>
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
