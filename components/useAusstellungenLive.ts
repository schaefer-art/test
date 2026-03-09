"use client";

import { useEffect, useState } from "react";

type Ausstellung = {
  anfang?: string;
  ende?: string;
};

function parseISODate(d?: string): Date | null {
  if (!d) return null;
  const s = d.trim();
  if (!s) return null;

  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) {
    const y = Number(m[1]);
    const mo = Number(m[2]) - 1;
    const da = Number(m[3]);
    return new Date(y, mo, da, 12, 0, 0, 0); // stable local noon
  }

  const dt = new Date(s);
  return isNaN(dt.getTime()) ? null : dt;
}

function isLiveNow(a: Ausstellung, now: Date): boolean {
  const start = parseISODate(a.anfang);
  const end = parseISODate(a.ende);
  if (!start || !end) return false;

  const n = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0, 0);
  return start.getTime() <= n.getTime() && n.getTime() <= end.getTime();
}

export function useAusstellungenLive() {
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
        // silent
      }
    }

    run();
    const t = setInterval(run, 60 * 60 * 1000); // refresh hourly
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, []);

  return isLive;
}
