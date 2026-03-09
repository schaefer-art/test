"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLang } from "@/lib/useLang";
import { useT } from "@/lib/useT";

const CATEGORIES = [
  { key: "nav_bilder", slug: "bilder" },
  { key: "nav_objekte", slug: "objekte" },
  { key: "nav_serien", slug: "serien" },
] as const;

interface Vernissage {
  title: string;
  date: string;
  time: string;
  location: string;
  poster: string;
}

export default function HomePageMobile() {
  const lang = useLang();
  const tr = useT();
  const [latest, setLatest] = useState<Vernissage | null>(null);

  useEffect(() => {
    fetch("/data/ausstellungen.json")
      .then((res) => res.json())
      .then((data: Vernissage[]) => setLatest(data?.[0] ?? null))
      .catch(() => {});
  }, []);

  return (
    <div className="home-mobile">
      <section className="home-mobile-section intro">
        <h1 className="home-mobile-title">RÜDIGER SCHÄFER</h1>
        <p className="home-mobile-subtitle">
          {CATEGORIES.map((cat, i) => (
            <span key={cat.slug}>
              {i > 0 && <span className="home-mobile-dot"> · </span>}
              <Link href={`/${lang}/arbeiten/${cat.slug}`} className="home-mobile-cat-link">
                {tr(cat.key)}
              </Link>
            </span>
          ))}
        </p>

        <div className="home-mobile-image">
          <Link href={`/${lang}/arbeiten/bilder`}>
            <Image
              src="/img/wintergipfel.jpg"
              alt="Wintergipfel"
              width={800}
              height={600}
              style={{
                width: "100%",
                height: "auto",
                borderRadius: "8px",
                objectFit: "cover",
              }}
              priority
            />
          </Link>
        </div>
      </section>

      {latest && (
        <section className="home-mobile-section ausstellungen">
          <h2>{tr("nav_ausstellungen")}</h2>
          <h3>{latest.title}</h3>
          <p>
            {latest.date} – {latest.time} <br />
            {latest.location}
          </p>

          <Link href={`/${lang}/ausstellungen`} className="poster-link">
            <Image
              src={latest.poster}
              alt={`Poster: ${latest.title}`}
              width={500}
              height={700}
              style={{
                width: "100%",
                height: "auto",
                borderRadius: "8px",
                marginTop: "10px",
              }}
            />
          </Link>
        </section>
      )}

      <div className="home-mobile-lang">
        <LanguageSwitcher />
      </div>
    </div>
  );
}
