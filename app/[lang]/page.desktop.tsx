"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import LiveBadge from "@/components/LiveBadge";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLang } from "@/lib/useLang";
import { useT } from "@/lib/useT";

type AusstellungJson = {
  md?: string;
  hasPoster?: boolean;
  poster?: string | null;
  anfang?: string;
  ende?: string;
  title?: string;
};

export default function HomePage() {
  const lang = useLang();
  const tr = useT();
  const [hovered, setHovered] = useState<"bilder" | "objekte" | "serien" | null>(null);

  const [latestPoster, setLatestPoster] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadPoster() {
      try {
        const res = await fetch("/data/ausstellungen.json", { cache: "no-store" });
        if (!res.ok) return;

        const data = (await res.json()) as AusstellungJson[];
        if (!Array.isArray(data) || data.length === 0) return;

        const firstWithPoster = data.find((x) => !!x?.hasPoster && !!x?.poster);
        if (!firstWithPoster?.poster) return;

        if (!cancelled) setLatestPoster(firstWithPoster.poster);
      } catch {
        // silently ignore
      }
    }

    loadPoster();
    return () => { cancelled = true; };
  }, []);

  return (
    <>
      <div className="homepage">
        <div className="homepage-inner">
          <div className="home-intro">
            <h2>RÜDIGER SCHÄFER</h2>
            <p className="home-intro-main">
              <Link
                href={`/${lang}/arbeiten/bilder`}
                onMouseEnter={() => setHovered("bilder")}
                onMouseLeave={() => setHovered(null)}
                className={hovered === "bilder" ? "underline" : ""}
              >
                {tr("nav_bilder")}
              </Link>

              {" · "}

              <Link
                href={`/${lang}/arbeiten/objekte`}
                onMouseEnter={() => setHovered("objekte")}
                onMouseLeave={() => setHovered(null)}
                className={hovered === "objekte" ? "underline" : ""}
              >
                {tr("nav_objekte")}
              </Link>

              {" · "}

              <Link
                href={`/${lang}/arbeiten/serien`}
                onMouseEnter={() => setHovered("serien")}
                onMouseLeave={() => setHovered(null)}
                className={hovered === "serien" ? "underline" : ""}
              >
                {tr("nav_serien")}
              </Link>
            </p>
          </div>

          <div className="home-blocks">
            <Link
              href={`/${lang}/arbeiten/bilder`}
              className="home-section"
              onMouseEnter={() => setHovered("bilder")}
              onMouseLeave={() => setHovered(null)}
            >
              <div className="home-image">
                <Image
                  src="/img/average_surprise_a.jpg"
                  alt="Wintergipfel"
                  fill
                  priority
                  style={{ objectFit: "cover" }}
                />
              </div>
            </Link>

            <Link
              href={`/${lang}/arbeiten/objekte`}
              className="home-section"
              onMouseEnter={() => setHovered("objekte")}
              onMouseLeave={() => setHovered(null)}
            >
              <div className="home-image">
                <Image
                  src="/img/prey_and_predator_1a.jpg"
                  alt="Beispiel Objekt"
                  fill
                  priority
                  style={{ objectFit: "cover" }}
                />
              </div>
            </Link>

            <Link
              href={`/${lang}/arbeiten/serien`}
              className="home-section"
              onMouseEnter={() => setHovered("serien")}
              onMouseLeave={() => setHovered(null)}
            >
              <div className="series-stack">
                <Image
                  src="/img/Exploring_the_orbits_1.jpg"
                  alt="Serie 1"
                  width={800}
                  height={1200}
                />
                <Image
                  src="/img/Exploring_the_orbits_2.jpg"
                  alt="Serie 2"
                  width={800}
                  height={1200}
                />
                <Image
                  src="/img/Exploring_the_orbits_3.jpg"
                  alt="Serie 3"
                  width={800}
                  height={1200}
                />
              </div>
            </Link>
          </div>

          <div className="home-intro">
            <p>
              <span className="link-with-badge">
                <Link href={`/${lang}/ausstellungen`}>{tr("nav_ausstellungen")}</Link>
                <span className="live-badge-slot">
                  <LiveBadge />
                </span>
              </span>

              {" · "}

              <Link href={`/${lang}/vita`}>{tr("nav_vita")}</Link>

              {" · "}

              <Link href={`/${lang}/kontakt`}>{tr("nav_kontakt")}</Link>

              {" · "}

              <Link href={`/${lang}/impressum`}>{tr("nav_impressum")}</Link>
            </p>
            <LanguageSwitcher />
          </div>
        </div>
      </div>

      {latestPoster && (
        <section className="extra-section">
          <div className="extra-image">
            <Link href={`/${lang}/ausstellungen`}>
              <Image
                src={latestPoster}
                alt="Aktuelles Plakat"
                width={600}
                height={900}
                style={{
                  height: "80vh",
                  width: "auto",
                  objectFit: "cover",
                  borderRadius: "8px",
                }}
                priority
              />
            </Link>
          </div>

          <div className="extra-text">
            <h2>{tr("nav_ausstellungen")}</h2>
            <p>{tr("home_section_desc")}</p>
            <p>
              <Link href={`/${lang}/ausstellungen`}>{tr("home_cta")}</Link>
            </p>
          </div>
        </section>
      )}
    </>
  );
}
