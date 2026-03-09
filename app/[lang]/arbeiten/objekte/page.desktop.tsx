"use client";

import { useEffect, useMemo, useRef } from "react";
import rawData from "@/public/data/objekte.json";
import { useSidebarInfo } from "@/components/SidebarInfoContext";
import { useLang } from "@/lib/useLang";
import { useSectionViewer } from "@/components/useSectionViewer";
import OverviewOverlay, { type OverviewItem } from "@/components/OverviewOverlay";

const toThumb = (src: string) =>
  src.includes("/thumbs/") ? src : src.replace(/\/([^/]+)$/, "/thumbs/$1");

type Objekt = {
  title: string;
  size?: string | null;
  filenames: string[];
  thumbs?: string[];
  year?: string | number;
  misc?: string | null;
  misc_fr?: string | null;
  misc_en?: string | null;
};

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

const normalize = (data: any): Objekt[] => {
  const arr = Array.isArray(data) ? data : [];
  const list = Array.isArray((data as any)?.works) ? (data as any).works : arr;

  return list.map((o: any) => {
    const filenames: string[] = Array.isArray(o?.filenames)
      ? o.filenames
      : o?.filename
      ? [o.filename]
      : [];

    const thumbs: string[] = Array.isArray(o?.thumbs)
      ? o.thumbs
      : filenames.map((f) => (typeof f === "string" ? toThumb(f) : "")).filter(Boolean);

    const misc =
      o?.misc === null || o?.misc === undefined || String(o.misc).trim() === ""
        ? null
        : String(o.misc);
    const misc_fr =
      o?.misc_fr === null || o?.misc_fr === undefined || String(o.misc_fr).trim() === ""
        ? null
        : String(o.misc_fr);
    const misc_en =
      o?.misc_en === null || o?.misc_en === undefined || String(o.misc_en).trim() === ""
        ? null
        : String(o.misc_en);

    return {
      title: o.title ?? "",
      size: o.size ?? null,
      filenames,
      thumbs,
      year: o.year ?? o.jahr ?? o.date ?? o.datum ?? null,
      misc,
      misc_fr,
      misc_en,
    };
  });
};

export default function ObjektePage({ navS, navI: _navI }: { navS: string | null; navI: string | null }) {
  const works = useMemo(() => normalize(rawData), []);
  const { setInfo, setActiveSection } = useSidebarInfo();
  const lang = useLang();

  const viewer = useSectionViewer<Objekt, string>(
    works,
    {
      getItems: (_wIdx, w) => w?.filenames ?? [],
      getSrc: (filename) => filename ?? "",
      getAlt: (_filename, _wIdx, w) => w?.title ?? "",
      getSidebarInfo: (_filename, idx, total, _wIdx, w) => ({
        title: String(w?.title ?? ""),
        misc: pickMisc(w, lang),
        year: w?.year != null ? String(w.year) : undefined,
        size: w?.size ? `${String(w.size)} cm` : undefined,
        index: idx + 1,
        total,
      }),
    },
    { setInfo, setActiveSection },
    { enableSwipe: false, enableKeyboard: true, storageKey: "viewer-objekte" }
  );

  const viewerRef = useRef(viewer);
  useEffect(() => { viewerRef.current = viewer; });

  useEffect(() => {
    if (navS === null) return;
    const s = parseInt(navS, 10);
    if (isNaN(s)) return;
    requestAnimationFrame(() => {
      document.getElementById(`section-${s}`)?.scrollIntoView({ behavior: "auto", block: "start" });
      viewerRef.current.select(s, 0);
    });
  }, [navS]); // eslint-disable-line react-hooks/exhaustive-deps

  // overview uses thumbs (unchanged)
  const overviewItems: OverviewItem[] = useMemo(() => {
    if (viewer.overviewSectionIdx == null) return [];
    const w = works[viewer.overviewSectionIdx];
    const title = w?.title ?? "";
    const size = w?.size ? `${String(w.size)} cm` : "";

    const originals = (w?.filenames ?? []).filter(Boolean);
    const thumbs = (w?.thumbs ?? []).filter(Boolean);

    return originals.map((orig, i) => ({
      key: i,
      src: thumbs[i] || toThumb(orig),
      alt: title,
      title,
      size,
      index: i,
    }));
  }, [viewer.overviewSectionIdx, works]);

  return (
    <div>
      <main
        ref={viewer.mainRef}
        tabIndex={0}
        className={`arbeiten-main ${viewer.overviewOpen ? "no-snap" : ""}`}
      >
        {works.map((work, wIdx) => {
          const i = viewer.idxBySection[wIdx] ?? 0;

          // main viewer uses ORIGINAL
          const src = work.filenames?.[i] ?? "";

          const metaTitle = work?.title ?? "";
          const metaMisc = pickMisc(work, lang) ?? "";
          const metaYear = work?.year != null ? String(work.year) : "";
          const metaSize = work?.size ? `${String(work.size)} cm` : "";
          const metaCount = work?.filenames?.length ? `${i + 1} / ${work.filenames.length}` : "";

          return (
            <section id={`section-${wIdx}`} key={wIdx} className="arbeiten-section">
              <div className="arbeit-einzeln">
                <div className="arbeit-stage">
                  {src && (
                    <img
                      ref={viewer.setImgRef(wIdx)}
                      src={src}
                      alt={metaTitle}
                      className="arbeit-bild objekt"
                      draggable={false}
                      loading={wIdx === 0 ? "eager" : "lazy"}
                    />
                  )}
                  <div ref={viewer.setOverlayRef(wIdx)} className="image-flash" />
                </div>

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

                <div
                  onClick={() => viewer.prev(wIdx)}
                  className="click-zone left"
                  title="Vorheriges Bild"
                />
                <div
                  onClick={() => viewer.openOverview(wIdx)}
                  className="click-zone center"
                  title="Übersicht anzeigen"
                />
                <div
                  onClick={() => viewer.next(wIdx)}
                  className="click-zone right"
                  title="Nächstes Bild"
                />
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
    </div>
  );
}
