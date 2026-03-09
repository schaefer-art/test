"use client";

import { usePathname } from "next/navigation";
import SidebarLayout from "./SidebarLayout";
import { SidebarInfoProvider } from "@/components/SidebarInfoContext";

export function PathLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Home is /de, /fr, or /en (with or without trailing slash)
  const isHome = /^\/(de|fr|en)\/?$/.test(pathname ?? "");

  if (isHome) {
    return (
      <main>
        {children}
      </main>
    );
  }

  return (
    <SidebarInfoProvider>
      <SidebarLayout>{children}</SidebarLayout>
    </SidebarInfoProvider>
  );
}
