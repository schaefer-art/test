"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import Link from "next/link";

export default function ImpressumPage() {
  const [markdown, setMarkdown] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/content/impressum.md", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const text = await res.text();
        setMarkdown(text);
      } catch (e: any) {
        setError(e?.message ?? "Failed to load impressum.md");
      }
    })();
  }, []);

  return (
    <div className="impressum-wrap">
      <div className="impressum-box">
        {error ? (
          <>
            <h1>Impressum</h1>
            <p className="muted">
              Konnte impressum.md nicht laden: {error}
            </p>
          </>
        ) : !markdown ? (
          <>
            <h1>Impressum</h1>
            <p className="muted">Lade…</p>
          </>
        ) : (
          <ReactMarkdown
            components={{
              a: ({ href, children }) =>
                href ? <Link href={href}>{children}</Link> : <>{children}</>,
            }}
          >
            {markdown}
          </ReactMarkdown>
        )}
      </div>

      <style jsx>{`
        .impressum-wrap {
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: flex-start;
          padding: 6rem 1.25rem 3rem;
          box-sizing: border-box;
        }

        .impressum-box {
          width: 100%;
          max-width: 680px;
          font-family: var(--font-spectral);
        }

        :global(h1) {
          margin: 0 0 1.5rem 0;
          font-size: 1.6rem;
          line-height: 1.15;
        }

        :global(h2) {
          margin: 1.6rem 0 0.35rem 0;
          font-size: 1rem;
          font-weight: 600;
          line-height: 1.2;
        }

        :global(p) {
          margin: 0.4rem 0 0 0;
          line-height: 1.55;
        }

        .muted,
        :global(em) {
          color: rgba(0, 0, 0, 0.55);
          font-style: normal;
        }

        :global(hr) {
          margin: 2rem 0;
          border: 0;
          height: 1px;
          background: rgba(0, 0, 0, 0.15);
        }

        :global(a),
        :global(a:visited),
        :global(a:active) {
          color: #333;
          font-family: var(--font-spectral);
          font-weight: 400;
          letter-spacing: 0.02em;
          line-height: 1.35;
          font-size: 1rem;
          opacity: 0.85;

          text-decoration-line: underline;
          text-decoration-thickness: 1px;
          text-decoration-color: rgba(0, 0, 0, 0.25);
          text-underline-offset: 2px;

          border: none;
        }

        :global(a:hover) {
          opacity: 1;
          text-decoration-color: rgba(0, 0, 0, 0.45);
        }
      `}</style>
    </div>
  );
}
