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
};

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
          loading="lazy"
          alt={props.alt ?? ""}
          className="mdImage"
          onClick={() => {
            if (!resolved) return;
            setLightboxImages([{ src: resolved }]);
            setLightboxIndex(0);
            setLightboxOpen(true);
          }}
          style={{ cursor: "zoom-in" }}
        />
      );
    },
    a: ({ node, href, children, ...props }: any) => {
      if (typeof href === "string" && href.startsWith("presse:")) {
        const raw = href.slice("presse:".length).trim();
        const filename = (() => {
          try { return decodeURIComponent(raw); }
          catch { return raw; }
        })();
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
    <div className="root">
      {featuredItem && (
        <article className="block featured">
          <ReactMarkdown
            urlTransform={resolveAusstellungenAsset}
            components={makeComponents(featuredItem)}
          >
            {featuredItem.description}
          </ReactMarkdown>

          {!!featuredItem.hasPoster && !!featuredItem.poster && (
            <div className="posterWrapper">
              <img
                src={featuredItem.poster}
                alt={tr("ausstellungen_plakat_label")}
                className="poster"
                loading="lazy"
                onClick={() => {
                  setLightboxImages([{ src: featuredItem.poster! }]);
                  setLightboxIndex(0);
                  setLightboxOpen(true);
                }}
              />
              {creditLabel(featuredItem) && (
                <div className="posterCredit">{creditLabel(featuredItem)}</div>
              )}
            </div>
          )}
        </article>
      )}

      {featuredItem && (
        <div className="divider">{tr("ausstellungen_past_divider")}</div>
      )}

      {pastItems.map((v, i) => (
        <article key={i} className="block past">
          <ReactMarkdown
            urlTransform={resolveAusstellungenAsset}
            components={makeComponents(v)}
          >
            {v.description}
          </ReactMarkdown>

          {!!v.hasPoster && !!v.poster && (
            <div className="posterWrapper small">
              <img
                src={v.poster}
                alt={tr("ausstellungen_plakat_label")}
                className="poster"
                loading="lazy"
                onClick={() => {
                  setLightboxImages([{ src: v.poster! }]);
                  setLightboxIndex(0);
                  setLightboxOpen(true);
                }}
              />
            </div>
          )}
        </article>
      ))}

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
        .root {
          padding: 5.5rem 1.2rem 2.5rem;
          font-family: var(--font-spectral);
        }

        .root :global(h1) {
          font-family: var(--font-inter);
          font-weight: 500;
          font-size: 1.65rem;
          line-height: 1.1;
          letter-spacing: 0.015em;
          margin: 0 0 0.6rem 0;
        }

        .root :global(h2) {
          font-family: var(--font-inter);
          font-size: 1rem;
          font-weight: 500;
          line-height: 1.2;
          letter-spacing: 0.015em;
          margin: 0.2rem 0 0.8rem 0;
        }

        .root :global(h3) {
          font-family: var(--font-inter);
          font-size: 0.95rem;
          font-weight: 500;
          line-height: 1.25;
          margin: 1.4rem 0 0.5rem 0;
        }

        .root :global(p) {
          margin: 0 0 1rem 0;
          line-height: 1.7;
          text-align: left;
          hyphens: auto;
        }

        .root :global(ul),
        .root :global(ol) {
          margin: 0.2rem 0 1rem 1.2rem;
          padding: 0;
        }

        .root :global(li) {
          margin: 0.25rem 0;
        }

        .root :global(blockquote) {
          margin: 1.1rem 0;
          padding-left: 0.8rem;
          border-left: 2px solid rgba(0, 0, 0, 0.15);
          opacity: 0.9;
        }

        .root :global(a) {
          color: inherit;
          text-decoration-line: underline;
          text-decoration-style: dotted;
          text-decoration-thickness: 1px;
          text-underline-offset: 3px;
        }

        .block {
          margin-bottom: 3rem;
        }

        .featured {
          margin-bottom: 2rem;
        }

        .past {
          opacity: 0.95;
        }

        .divider {
          font-family: var(--font-inter);
          font-size: 0.9rem;
          text-align: center;
          margin: 2rem 0 1.5rem;
          opacity: 0.6;
        }

        :global(.mdImage) {
          width: 100%;
          border-radius: 6px;
          margin: 1.4rem 0;
          background: #f6f6f6;
        }

        .posterWrapper {
          margin-top: 1.5rem;
          position: relative;
        }

        .posterWrapper.small {
          margin-top: 1rem;
        }

        .poster {
          width: 100%;
          border-radius: 6px;
          cursor: zoom-in;
        }

        .posterCredit {
          position: absolute;
          right: -0.8rem;
          bottom: 0;
          writing-mode: vertical-rl;
          transform: rotate(180deg);
          font-size: 0.75rem;
          opacity: 0.6;
        }
      `}</style>
    </div>
  );
}
