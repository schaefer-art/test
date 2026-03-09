// components/PressSlideshow.tsx
"use client";

import { useEffect, useCallback } from "react";
import { useT } from "@/lib/useT";

export type PressSlide = {
  src: string;
  caption?: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  slides?: PressSlide[];
  index: number;
  onIndexChange: (i: number) => void;
};

export default function PressSlideshow({
  open,
  onClose,
  slides = [],
  index,
  onIndexChange,
}: Props) {
  const tr = useT();
  const total = slides.length;
  const slide = slides[index] ?? null;

  const prev = useCallback(() => {
    onIndexChange((index - 1 + total) % total);
  }, [index, total, onIndexChange]);

  const next = useCallback(() => {
    onIndexChange((index + 1) % total);
  }, [index, total, onIndexChange]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, prev, next, onClose]);

  if (!open || !slide) return null;

  return (
    <div
      className="press-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={tr("press_label")}
    >
      <button className="press-x" onClick={onClose} type="button" aria-label={tr("press_close")}>
        ✕
      </button>

      {total > 1 && (
        <div className="press-counter">{index + 1} / {total}</div>
      )}

      <div className="press-stage">
        {total > 1 && (
          <button className="press-arrow press-arrow--left" onClick={prev} type="button" aria-label={tr("press_prev")}>
            ‹
          </button>
        )}

        <div className="press-img-wrap">
          <img
            key={slide.src}
            src={slide.src}
            alt={slide.caption ?? `${tr("press_image")} ${index + 1}`}
            className="press-img"
            draggable={false}
          />
          {slide.caption && (
            <div className="press-caption">{slide.caption}</div>
          )}
        </div>

        {total > 1 && (
          <button className="press-arrow press-arrow--right" onClick={next} type="button" aria-label={tr("press_next")}>
            ›
          </button>
        )}
      </div>

      {total > 1 && (
        <div className="press-dots" role="tablist">
          {slides.map((_, i) => (
            <button
              key={i}
              className={`press-dot ${i === index ? "is-active" : ""}`}
              onClick={() => onIndexChange(i)}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`${tr("press_image")} ${i + 1}`}
            />
          ))}
        </div>
      )}

      <style jsx>{`
        .press-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          background: rgba(255, 255, 255, 0.75);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 56px 24px 40px;
          gap: 0.85rem;
        }

        .press-x {
          position: fixed;
          top: 18px;
          right: 18px;
          z-index: 10000;
          appearance: none;
          border: 0;
          background: transparent;
          color: rgba(0, 0, 0, 0.8);
          width: 32px;
          height: 32px;
          border-radius: 999px;
          cursor: pointer;
          font-size: 18px;
          line-height: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 120ms;
        }

        .press-x:hover {
          background: rgba(0, 0, 0, 0.09);
        }

        .press-counter {
          position: fixed;
          top: 22px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 0.78rem;
          opacity: 0.4;
          letter-spacing: 0.06em;
          pointer-events: none;
          font-family: var(--font-inter, sans-serif);
        }

        .press-stage {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          max-width: 960px;
          flex: 1;
          min-height: 0;
        }

        .press-img-wrap {
          display: inline-flex;
          flex-direction: column;
          align-items: flex-start;
          max-width: 100%;
          background: #fff;
          padding: 10px;
          border-radius: 4px;
          box-shadow: 0 8px 36px rgba(0, 0, 0, 0.13);
        }

        .press-img {
          max-width: 100%;
          max-height: calc(100vh - 220px);
          object-fit: contain;
          display: block;
          user-select: none;
        }

        .press-arrow {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          appearance: none;
          border: 0;
          background: rgba(255, 255, 255, 0.78);
          backdrop-filter: blur(6px);
          color: rgba(0, 0, 0, 0.7);
          width: 44px;
          height: 44px;
          border-radius: 999px;
          cursor: pointer;
          font-size: 30px;
          line-height: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          transition: background 120ms, transform 120ms;
          z-index: 2;
        }

        .press-arrow:hover {
          background: rgba(255, 255, 255, 0.97);
          transform: translateY(-50%) scale(1.07);
        }

        .press-arrow--left { left: -22px; }
        .press-arrow--right { right: -22px; }

        @media (max-width: 600px) {
          .press-arrow--left { left: 4px; }
          .press-arrow--right { right: 4px; }
        }

        .press-caption {
          margin-top: 0.4rem;
          font-size: 0.75rem;
          color: rgba(0, 0, 0, 0.85);
          letter-spacing: 0.02em;
          text-align: left;
          font-family: var(--font-inter, sans-serif);
          font-style: italic;
          line-height: 1.4;
        }

        .press-dots {
          display: flex;
          gap: 0.45rem;
          align-items: center;
        }

        .press-dot {
          appearance: none;
          border: 0;
          background: rgba(0, 0, 0, 0.2);
          width: 7px;
          height: 7px;
          border-radius: 999px;
          cursor: pointer;
          padding: 0;
          transition: background 150ms, transform 150ms;
        }

        .press-dot.is-active {
          background: rgba(0, 0, 0, 0.72);
          transform: scale(1.35);
        }
      `}</style>
    </div>
  );
}
