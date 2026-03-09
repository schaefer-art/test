"use client";

import dynamic from "next/dynamic";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

const DesktopBilder = dynamic(() => import("./page.desktop"), { ssr: false });
const TabletBilder  = dynamic(() => import("./page.tablet"),  { ssr: false });
const MobileBilder  = dynamic(() => import("./page.mobile"),  { ssr: false });

type View = "mobile" | "tablet" | "desktop";

function BilderInner() {
  const [view, setView] = useState<View>("desktop");
  const searchParams = useSearchParams();
  const navS = searchParams.get("s");
  const navI = searchParams.get("i");

  useEffect(() => {
    const check = () => {
      const w = window.innerWidth;
      if (w <= 768) setView("mobile");
      else if (w <= 1024) setView("tablet");
      else setView("desktop");
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  if (view === "mobile") return <MobileBilder navS={navS} navI={navI} />;
  if (view === "tablet") return <TabletBilder navS={navS} navI={navI} />;
  return <DesktopBilder navS={navS} navI={navI} />;
}

export default function BilderPage() {
  return <Suspense><BilderInner /></Suspense>;
}
