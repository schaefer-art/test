"use client";

import React, { createContext, useContext, useState } from "react";

interface Info {
  title?: string;
  year?: string | number | null;
  size?: string | null;
  index?: number;
  total?: number;
  misc?: string;
}

interface SidebarInfoContextType {
  info: Info | null;
  setInfo: (info: Info | null) => void;
  activeSection: number | null;                // 🆕 add this
  setActiveSection: (index: number | null) => void; // 🆕 add this
}

const SidebarInfoContext = createContext<SidebarInfoContextType>({
  info: null,
  setInfo: () => {},
  activeSection: null,
  setActiveSection: () => {},
});

export function SidebarInfoProvider({ children }: { children: React.ReactNode }) {
  const [info, setInfo] = useState<Info | null>(null);
  const [activeSection, setActiveSection] = useState<number | null>(null); // 🆕

  return (
    <SidebarInfoContext.Provider value={{ info, setInfo, activeSection, setActiveSection }}>
      {children}
    </SidebarInfoContext.Provider>
  );
}

export function useSidebarInfo() {
  return useContext(SidebarInfoContext);
}
