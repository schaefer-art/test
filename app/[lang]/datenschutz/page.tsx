"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";

export default function DatenschutzPage() {
  const [md, setMd] = useState<string>("");

  useEffect(() => {
    fetch("/content/datenschutz.md")
      .then((res) => {
        if (!res.ok) throw new Error("Markdown not found");
        return res.text();
      })
      .then(setMd)
      .catch(() => {
        setMd("# Fehler\nDie Datenschutzerklärung konnte nicht geladen werden.");
      });
  }, []);

  return (
    <main className="datenschutz-page">
      <article className="datenschutz-wrap">
        <ReactMarkdown rehypePlugins={[rehypeRaw]}>
          {md}
        </ReactMarkdown>

        <style jsx>{`
          .datenschutz-wrap {
            max-width: 820px;
            margin: 0 auto;
            padding: clamp(24px, 5vw, 64px);
            font-size: 15px;
            line-height: 1.6;
          }

          .datenschutz-wrap :global(h1) {
            font-size: 1.8rem;
            margin-bottom: 1.2em;
          }

          .datenschutz-wrap :global(h2) {
            font-size: 1.25rem;
            margin-top: 2.2em;
            margin-bottom: 0.6em;
          }

          .datenschutz-wrap :global(h3) {
            font-size: 1.1rem;
            margin-top: 1.6em;
          }

          .datenschutz-wrap :global(p) {
            margin: 0.7em 0;
          }

          .datenschutz-wrap :global(ul) {
            padding-left: 1.2em;
            margin: 0.6em 0;
          }

          .datenschutz-wrap :global(li) {
            margin: 0.35em 0;
          }

          .datenschutz-wrap :global(a) {
            text-decoration: underline;
          }

          @media (max-width: 640px) {
            .datenschutz-wrap {
              font-size: 14px;
              padding: 20px;
            }

            .datenschutz-wrap :global(h1) {
              font-size: 1.5rem;
            }
          }
        `}</style>
      </article>
    </main>
  );
}
