"use client";

import dynamic from "next/dynamic";
import { useState, useEffect } from "react";

const DesktopImpressum = dynamic(() => import("./page.desktop"), { ssr: false });
const MobileImpressum = dynamic(() => import("./page.mobile"), { ssr: false });

export default function ImpressumPage() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return isMobile ? <MobileImpressum /> : <DesktopImpressum />;
}
