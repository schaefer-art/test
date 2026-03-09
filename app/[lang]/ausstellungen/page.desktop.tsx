"use client";

import { useEffect, useState } from "react";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import ReactMarkdown from "react-markdown";
import PressSlideshow, { PressSlide } from "@/components/PressSlideshow";
import { useLang } from "@/lib/useLang";
import { useT } from "@/lib/useT";

type PressItem = {
  src: string;
  caption?: string;
};

type AusstellungFromJson = {
  md: string;
  hasPoster?: boolean;
  poster?: string | null;
  "plakat-urheber"?: string | null;
  press?: PressItem[];
  anfang?: string | null;  // DD.MM.YY
  ende?: string | null;    // DD.MM.YY
};

type BadgeStatus = "soon" | "now" | "recent" | null;

function parseDMY(s?: string | null): Date | null {
  if (!s) return null;
  const parts = s.split(".");
  if (parts.length !== 3) return null;
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const year = parseInt(parts[2], 10) + (parseInt(parts[2], 10) < 100 ? 2000 : 0);
  if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
  return new Date(year, month, day);
}

function getStatus(anfang?: string | null, ende?: string | null): BadgeStatus {
  if (!anfang && !ende) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = parseDMY(anfang);
  const end = parseDMY(ende);
  if (start && start > today) return "soon";
  if (end && end < today) return "recent";
  if (start && start <= today && (!end || end >= today)) return "now";
  return "recent";
}

type Ausstellung = AusstellungFromJson & {
  description: string;
};

const isAbs = (u: string) => /^https?:\/\//i.test(u) || u.startsWith("/");

const resolveAusstellungenAsset = (src: string) => {
  if (!src) return src;
  if (src.startsWith("presse:")) return src;
  if (isAbs(src)) return src;
  return `/content/ausstellungen/${src.replace(/^\.?\//, "")}`;
};

async function fetchLangMd(mdPath: string, lang: string): Promise<string> {
  const base = mdPath.replace(/\.md$/, "");
  const langUrl = `/${base}.${lang}.md`.replace(/^\/\//, "/");
  const langRes = await fetch(langUrl, { cache: "no-store" });
  if (langRes.ok) return langRes.text();

  const deUrl = `/${base}.de.md`.replace(/^\/\//, "/");
  const deRes = await fetch(deUrl, { cache: "no-store" });
  if (deRes.ok) return deRes.text();

  const origUrl = mdPath.startsWith("/") ? mdPath : `/${mdPath}`;
  const origRes = await fetch(origUrl, { cache: "no-store" });
  if (origRes.ok) return origRes.text();

  return "";
}

export default function AusstellungenPage() {
  const lang = useLang();
  const tr = useT();
  const [items, setItems] = useState<Ausstellung[]>([]);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxImages, setLightboxImages] = useState<{ src: string }[]>([]);

  const [pressOpen, setPressOpen] = useState(false);
  const [pressSlides, setPressSlides] = useState<PressSlide[]>([]);
  const [pressIndex, setPressIndex] = useState(0);

  useEffect(() => {
    const load = async () => {
      const res = await fetch("/data/ausstellungen.json", { cache: "no-store" });
      const data: AusstellungFromJson[] = await res.json();

      const withMd: Ausstellung[] = await Promise.all(
        (data || []).map(async (item) => {
          let description = "";
          try {
            description = await fetchLangMd(item.md, lang);
          } catch (err) {
            console.error("Error loading markdown for", item.md, err);
          }
          return { ...item, description };
        })
      );

      setItems(withMd);
    };

    load();
  }, [lang]);

  const featuredItem = items[0] ?? null;
  const pastItems = items.length > 1 ? items.slice(1) : [];

  const creditLabel = (v: AusstellungFromJson) => {
    const raw = v["plakat-urheber"];
    return typeof raw === "string" ? raw.trim() : "";
  };

  const openPressAt = (v: AusstellungFromJson, index: number) => {
    const slides: PressSlide[] = (v.press ?? []).map((p) => ({
      src: p.src,
      caption: p.caption,
    }));
    if (slides.length === 0) return;
    setPressSlides(slides);
    setPressIndex(index);
    setPressOpen(true);
  };

  const makeComponents = (v: Ausstellung) => ({
    img: ({ node, ...props }: any) => {
      const raw = typeof props.src === "string" ? props.src : "";
      const resolved = raw ? resolveAusstellungenAsset(raw) : "";
      return (
        <img
          {...props}
          src={resolved}
          className="aust-mdImage"
          loading="lazy"
          alt={props.alt ?? ""}
          onClick={() => {
            if (!resolved) return;
            setLightboxImages([{ src: resolved }]);
            setLightboxIndex(0);
            setLightboxOpen(true);
          }}
          style={{ cursor: resolved ? "zoom-in" : undefined }}
        />
      );
    },
    a: ({ node, href, children, ...props }: any) => {
      if (typeof href === "string" && href.startsWith("presse:")) {
        const raw = href.slice("presse:".length).trim();
        const filename = (() => { try { return decodeURIComponent(raw); } catch { return raw; } })();
        const press = v.press ?? [];
        const idx = press.findIndex((p) => p.src.split("/").pop() === filename);
        const targetIdx = idx !== -1 ? idx : 0;
        if (press.length > 0) {
          return (
            <a
              {...props}
              href="#"
              onClick={(e: React.MouseEvent) => {
                e.preventDefault();
                openPressAt(v, targetIdx);
              }}
              style={{ cursor: "pointer" }}
            >
              {children}
            </a>
          );
        }
      }
      return (
        <a href={href} {...props} target="_blank" rel="noopener noreferrer">
          {children}
        </a>
      );
    },
  });

  return (
    <div className="aust-page">
      {/* FEATURED CARD */}
      {featuredItem && (() => {
        const status = getStatus(featuredItem.anfang, featuredItem.ende);
        const badgeLabel = status === "soon" ? tr("ausstellungen_badge_soon")
          : status === "now" ? tr("ausstellungen_badge_now")
          : status === "recent" ? tr("ausstellungen_badge_recent")
          : null;
        return (
        <div className="aust-card aust-card--featured">
          <div className="aust-card-text">
            {badgeLabel && (
              <div className={`aust-badge aust-badge--${status}`}>{badgeLabel}</div>
            )}
            <ReactMarkdown
              urlTransform={resolveAusstellungenAsset}
              components={makeComponents(featuredItem)}
            >
              {featuredItem.description}
            </ReactMarkdown>
          </div>

          {!!featuredItem.hasPoster && !!featuredItem.poster && (
            <div className="aust-card-poster aust-card-poster--featured">
              <img
                src={featuredItem.poster as string}
                alt={tr("ausstellungen_plakat_label")}
                className="aust-poster-img"
                loading="lazy"
                onClick={() => {
                  setLightboxImages([{ src: featuredItem.poster as string }]);
                  setLightboxIndex(0);
                  setLightboxOpen(true);
                }}
                style={{ cursor: "zoom-in" }}
              />
              {creditLabel(featuredItem) && (
                <div className="aust-poster-credit">
                  {creditLabel(featuredItem)}
                </div>
              )}
            </div>
          )}
        </div>
      )})()}

      {/* DIVIDER */}
      {featuredItem && pastItems.length > 0 && (
        <div className="aust-divider">
          <div className="aust-divider-line" />
          <span className="aust-divider-text">{tr("ausstellungen_past_divider")}</span>
          <div className="aust-divider-line" />
        </div>
      )}

      {/* PAST CARDS */}
      {pastItems.map((v, i) => {
        const hasPoster = !!v.hasPoster && !!v.poster;

        return (
          <div key={`${v.md}-${i}`} className="aust-card aust-card--past">
            <div className="aust-card-text">
              <ReactMarkdown
                urlTransform={resolveAusstellungenAsset}
                components={makeComponents(v)}
              >
                {v.description}
              </ReactMarkdown>
            </div>

            {hasPoster && (
              <div className="aust-card-poster aust-card-poster--past">
                <img
                  src={v.poster as string}
                  alt={tr("ausstellungen_plakat_label")}
                  className="aust-poster-img"
                  loading="lazy"
                  onClick={() => {
                    setLightboxImages([{ src: v.poster as string }]);
                    setLightboxIndex(0);
                    setLightboxOpen(true);
                  }}
                  style={{ cursor: "zoom-in" }}
                />
                {creditLabel(v) && (
                  <div className="aust-poster-credit aust-poster-credit--small">
                    {creditLabel(v)}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        slides={lightboxImages}
        index={lightboxIndex}
        on={{ view: ({ index }) => setLightboxIndex(index) }}
      />

      <PressSlideshow
        open={pressOpen}
        onClose={() => setPressOpen(false)}
        slides={pressSlides}
        index={pressIndex}
        onIndexChange={setPressIndex}
      />

      <style jsx>{`
        .aust-page {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.5rem;
          padding: clamp(1.5rem, 3vw, 3rem);
          box-sizing: border-box;
          font-family: var(--font-spectral);
        }

        /* BADGE */
        .aust-badge {
          display: inline-block;
          font-family: var(--font-inter);
          font-size: 0.72rem;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 3px 10px;
          border-radius: 20px;
          margin-bottom: 0.75rem;
        }

        .aust-badge--soon {
          background: rgba(59, 130, 246, 0.12);
          color: #1d4ed8;
        }

        .aust-badge--now {
          background: rgba(34, 197, 94, 0.12);
          color: #15803d;
        }

        .aust-badge--recent {
          background: rgba(0, 0, 0, 0.07);
          color: rgba(0, 0, 0, 0.55);
        }

        /* CARDS */
        .aust-card {
          display: flex;
          background: #f2f2f2;
          border-radius: 6px;
          overflow: hidden;
          padding: 30px;
          gap: 1.5rem;
        }

        .aust-card--featured {
          width: clamp(600px, 65vw, 1100px);
          font-size: 1.04em;
          align-items: flex-start;
        }

        .aust-card--past {
          width: clamp(240px, 30vw, 800px);
          font-size: 0.88em;
          align-items: flex-start;
        }

        /* TEXT */
        .aust-card-text {
          flex: 1;
          min-width: 0;
          line-height: 1.75;
          text-align: justify;
          text-justify: inter-word;
          hyphens: auto;
        }

        .aust-card-text :global(h1) {
          font-family: var(--font-inter);
          font-weight: 500;
          font-size: 2rem;
          line-height: 1.08;
          letter-spacing: 0.015em;
          margin: 0 0 0.35rem 0;
        }

        .aust-card--past .aust-card-text :global(h1) {
          font-size: 1.2rem;
          margin-bottom: 0.45rem;
        }

        .aust-card-text :global(h2) {
          font-family: var(--font-inter);
          font-size: 0.95rem;
          font-weight: 500;
          letter-spacing: 0.015em;
          margin: 0.15rem 0 0.55rem 0;
        }

        .aust-card-text :global(h3) {
          font-family: var(--font-inter);
          font-size: 1.05rem;
          font-weight: 500;
          margin: 2rem 0 0.75rem 0;
        }

        .aust-card--past .aust-card-text :global(h3) {
          font-size: 0.9rem;
          margin: 1rem 0 0.4rem 0;
        }

        .aust-card-text :global(p) {
          margin: 0 0 1.1rem 0;
        }

        .aust-card--past .aust-card-text :global(p) {
          margin: 0 0 0.75rem 0;
        }

        .aust-card-text :global(ul),
        .aust-card-text :global(ol) {
          margin: 0.2rem 0 1.1rem 1.2rem;
          padding: 0;
        }

        .aust-card-text :global(li) {
          margin: 0.35rem 0;
        }

        .aust-card-text :global(a) {
          color: inherit;
          text-decoration-line: underline;
          text-decoration-style: dotted;
          text-decoration-thickness: 1px;
          text-underline-offset: 3px;
        }

        .aust-card-text :global(blockquote) {
          margin: 1.5rem 0;
          padding: 0.2rem 0 0.2rem 1rem;
          border-left: 2px solid rgba(0, 0, 0, 0.15);
          opacity: 0.9;
        }

        :global(.aust-mdImage) {
          max-width: 100%;
          width: 100%;
          height: 100%;
          display: block;
          margin: 1.4rem 0;
          border-radius: 6px;
          object-fit: contain;
          cursor: zoom-in;
        }

        /* POSTER */
        .aust-card-poster {
          flex-shrink: 0;
          display: flex;
          flex-direction: row;
          align-items: flex-end;
          gap: 6px;
        }

        .aust-card-poster--featured {
          height: 65vh;
        }

        .aust-card-poster--past {
          height: 220px;
        }

        .aust-poster-img {
          flex: 1;
          min-width: 0;
          width: auto;
          height: 100%;
          object-fit: contain;
          border-radius: 6px;
          cursor: zoom-in;
          display: block;
        }

        .aust-poster-credit {
          flex-shrink: 0;
          writing-mode: vertical-rl;
          transform: rotate(180deg);
          font-family: var(--font-inter);
          font-size: 0.72rem;
          color: rgba(0, 0, 0, 0.5);
          white-space: nowrap;
          line-height: 1;
          user-select: none;
          padding-bottom: 2px;
        }

        .aust-poster-credit--small {
          font-size: 0.62rem;
        }

        /* DIVIDER */
        .aust-divider {
          display: flex;
          align-items: center;
          gap: 1rem;
          width: clamp(240px, 30vw, 800px);
        }

        .aust-divider-line {
          flex: 1;
          border-top: 1px solid rgba(0, 0, 0, 0.12);
        }

        .aust-divider-text {
          font-family: var(--font-inter);
          font-size: 0.9rem;
          letter-spacing: 0.02em;
          color: rgba(0, 0, 0, 0.5);
          white-space: nowrap;
        }
      `}</style>
    </div>
  );
}
