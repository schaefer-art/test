// app/[lang]/vita/page.desktop.tsx
"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { useLang } from "@/lib/useLang";
import { useT } from "@/lib/useT";

export default function VitaPage() {
  const lang = useLang();
  const tr = useT();
  const [bioMd, setBioMd] = useState("");
  const [kunstMd, setKunstMd] = useState("");

  useEffect(() => {
    fetch(`/content/vita-bio.${lang}.md`)
      .then((res) => {
        if (!res.ok) throw new Error("Bio MD not found");
        return res.text();
      })
      .then(setBioMd)
      .catch(() => {
        fetch("/content/vita-bio.de.md")
          .then((r) => r.ok ? r.text() : Promise.reject())
          .then(setBioMd)
          .catch(() => setBioMd(tr("vita_error_bio")));
      });

    fetch(`/content/vita-kunst.${lang}.md`)
      .then((res) => {
        if (!res.ok) throw new Error("Kunst MD not found");
        return res.text();
      })
      .then(setKunstMd)
      .catch(() => {
        fetch("/content/vita-kunst.de.md")
          .then((r) => r.ok ? r.text() : Promise.reject())
          .then(setKunstMd)
          .catch(() => setKunstMd(tr("vita_error_kunst")));
      });
  }, [lang]);

  return (
    <div className="vita-page">
      <div className="vita-card">
        <div className="vita-card-image">
          <img src="/img/vita/DSC_0031.jpg" alt={tr("vita_img_atelier")} />
        </div>
        <div className="vita-card-text">
          <ReactMarkdown>{bioMd}</ReactMarkdown>
        </div>
      </div>

      <div className="vita-card">
        <div className="vita-card-text">
          <ReactMarkdown>{kunstMd}</ReactMarkdown>
        </div>
        <div className="vita-card-image">
          <img src="/img/vita/Profil_2024.jpg" alt={tr("vita_img_profil")} />
        </div>
      </div>

      <style jsx>{`
        .vita-page {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2rem;
          padding: clamp(1.5rem, 3vw, 3rem);
          min-height: 100vh;
          box-sizing: border-box;
          justify-content: center;
        }

        .vita-card {
          display: flex;
          background: #f2f2f2;
          border-radius: 6px;
          overflow: hidden;
          width: clamp(500px, 45vw, 1000px);
          padding: 30px;
        }

        .vita-card-image {
          width: 220px;
          min-width: 220px;
          flex-shrink: 0;
        }

        .vita-card-image img {
          width: 100%;
          height: 100%;
          border-radius: 6px;
          object-fit: cover;
          display: block;
        }

        .vita-card-text {
          flex: 1;
          padding: clamp(1.2rem, 2vw, 2rem);
          font-family: var(--font-spectral);
          font-size: 0.95rem;
          line-height: 1.65;
          overflow: auto;
        }

        .vita-card-text :global(h2) {
          margin: 0 0 0.6rem 0;
          font-size: 1.15rem;
          font-weight: 600;
          line-height: 1.2;
        }

        .vita-card-text :global(p) {
          margin: 0.6rem 0 0 0;
        }

        .vita-card-text :global(ul) {
          margin: 0.6rem 0 0 0;
          padding-left: 0;
          list-style: none;
        }

        .vita-card-text :global(li) {
          margin: 0.3rem 0;
        }
      `}</style>
    </div>
  );
}
