"use client";

import dynamic from "next/dynamic";
import { useState, useEffect } from "react";

const DesktopHome = dynamic(() => import("./page.desktop"), { ssr: false });
const TabletHome  = dynamic(() => import("./page.tablet"),  { ssr: false });
const MobileHome  = dynamic(() => import("./page.mobile"),  { ssr: false });

type View = "mobile" | "tablet" | "desktop";

export default function HomePage() {
  const [view, setView] = useState<View>("desktop");

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

  if (view === "mobile") return <MobileHome />;
  if (view === "tablet") return <TabletHome />;
  return <DesktopHome />;
}
