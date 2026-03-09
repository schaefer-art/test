"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Ausstellung = { anfang?: string; ende?: string };

function parseISODate(d?: string): Date | null {
  if (!d) return null;
  const s = d.trim();
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12, 0, 0, 0);
  const dt = new Date(s);
  return isNaN(dt.getTime()) ? null : dt;
}

function isLiveNow(a: Ausstellung, now: Date) {
  const start = parseISODate(a.anfang);
  const end = parseISODate(a.ende);
  if (!start || !end) return false;
  const n = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0, 0);
  return start.getTime() <= n.getTime() && n.getTime() <= end.getTime();
}

export default function AusstellungenLink({
  href = "/ausstellungen",
  children = "Ausstellungen",
}: {
  href?: string;
  children?: React.ReactNode;
}) {
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        const res = await fetch("/data/ausstellungen.json", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as Ausstellung[];
        const live = Array.isArray(data) && data.some((x) => isLiveNow(x, new Date()));
        if (!cancelled) setIsLive(live);
      } catch {}
    }

    run();
    const t = setInterval(run, 60 * 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, []);

  return (
    <span className={`link-with-badge ${isLive ? "has-live" : ""}`}>
      <Link href={href}>{children}</Link>
      {isLive && <span className="live-badge">LIVE</span>}
    </span>
  );
}
