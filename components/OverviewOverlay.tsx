// components/OverviewOverlay.tsx
"use client";
import React, { useMemo } from "react";
import { useT } from "@/lib/useT";

const toThumb = (src: string) => src.replace(/\/([^/]+)$/, "/thumbs/$1");

export type OverviewItem = {
  key: string | number;
  /** full image (for fallback / future use) */
  src: string;
  /** preferred thumbnail src if you already have it in JSON */
  thumbSrc?: string;
  alt: string;
  title?: string; // line 1
  size?: string;  // line 2
  /** index to select when clicked */
  index: number;
  /** dimensions of the THUMB (preferred) or image, used for aspect-ratio */
  w?: number;
  h?: number;
};

type Props = {
  open: boolean;
  onClose: () => void;
  items: OverviewItem[];
  activeIndex: number;
  onSelect: (index: number) => void;
  // thumb refs for "scroll active into view"
  setThumbRef?: (i: number) => (el: HTMLButtonElement | null) => void;
};

export default function OverviewOverlay({
  open,
  onClose,
  items,
  activeIndex,
  onSelect,
  setThumbRef,
}: Props) {
  const tr = useT();
  const rendered = useMemo(() => items, [items]);
  if (!open) return null;

  return (
    <>
      {/* Close button OUTSIDE the scrolling container */}
      <button
        className="overview-x"
        onClick={onClose}
        aria-label={tr("overview_close")}
        title={tr("overview_close")}
        type="button"
      >
        ✕
      </button>

      <div
        className="overview-overlay"
        role="dialog"
        aria-modal="true"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div className="overview-masonry" aria-label={tr("overview_thumbnails")}>
          {rendered.map((it, i) => {
            const isActive = it.index === activeIndex;
            const hasMeta = Boolean(
              (it.title && it.title.trim()) || (it.size && it.size.trim())
            );
            const tooltip = [it.title, it.size].filter(Boolean).join(" · ");
            const thumbSrc = it.thumbSrc ?? toThumb(it.src);
            const ar =
              it.w && it.h && it.w > 0 && it.h > 0 ? `${it.w} / ${it.h}` : undefined;

            return (
              <button
                key={it.key}
                ref={setThumbRef ? setThumbRef(i) : undefined}
                className={`overview-tile ${isActive ? "is-active" : ""}`}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={() => onSelect(it.index)}
                aria-current={isActive ? "true" : "false"}
                title={tooltip}
                type="button"
                style={ar ? ({ ["--ar" as any]: ar } as React.CSSProperties) : undefined}
              >
                <img
                  src={thumbSrc}
                  alt={it.alt}
                  loading={i < 12 ? "eager" : "lazy"}
                  fetchPriority={i < 12 ? "high" : "auto"}
                  decoding="async"
                  draggable={false}
                  onLoad={(e) => {
                    const img = e.currentTarget;
                    const done = () => img.setAttribute("data-loaded", "true");
                    // @ts-ignore
                    if (img.decode) img.decode().then(done).catch(done);
                    else done();
                  }}
                  onError={(e) => {
                    const img = e.currentTarget;
                    // fallback to full image if thumb missing
                    if (img.src !== it.src) img.src = it.src;
                  }}
                />
                {hasMeta && (
                  <span className="overview-meta" aria-hidden="true">
                    <span className="overview-meta-text">
                      {it.title && <span className="overview-meta-title">{it.title}</span>}
                      {it.size && <span className="overview-meta-size">{it.size}</span>}
                    </span>
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}