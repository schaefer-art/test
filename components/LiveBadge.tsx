"use client";

import { useEffect, useState } from "react";
import { useT } from "@/lib/useT";

type Ausstellung = {
  md?: string;
  poster?: string;
  images?: string[];
  anfang?: string;
  ende?: string;
};

function parseDate(d?: string): Date | null {
  if (!d) return null;
  const s = d.trim();
  if (!s) return null;

  const de = s.match(/^(\d{2})\.(\d{2})\.(\d{2}|\d{4})$/);
  if (de) {
    const day = Number(de[1]);
    const month = Number(de[2]) - 1;
    let year = Number(de[3]);
    if (year < 100) year += 2000;
    return new Date(year, month, day, 12, 0, 0, 0);
  }

  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) {
    const y = Number(iso[1]);
    const m = Number(iso[2]) - 1;
    const d = Number(iso[3]);
    return new Date(y, m, d, 12, 0, 0, 0);
  }

  const dt = new Date(s);
  return isNaN(dt.getTime()) ? null : dt;
}

function isLiveNow(a: Ausstellung, now: Date): boolean {
  const start = parseDate(a.anfang);
  const end = parseDate(a.ende);
  if (!start || !end) return false;

  const n = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    12, 0, 0, 0
  );

  return start.getTime() <= n.getTime() && n.getTime() <= end.getTime();
}

export default function LiveBadge({
  className = "",
}: {
  className?: string;
}) {
  const tr = useT();
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        const res = await fetch("/data/ausstellungen.json", { cache: "no-store" });
        if (!res.ok) return;

        const data = (await res.json()) as Ausstellung[];
        const now = new Date();

        const live = Array.isArray(data) && data.some((x) => isLiveNow(x, now));
        if (!cancelled) setIsLive(live);
      } catch {
        // fail silently – no badge
      }
    }

    run();
    const t = setInterval(run, 60 * 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, []);

  if (!isLive) return null;

  return (
    <span
      className={`live-badge ${className}`}
      title={tr("live_badge_title")}
      aria-label={tr("live_badge_text")}
    >
      {tr("live_badge_text")}
    </span>
  );
}
