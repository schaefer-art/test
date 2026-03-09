"use client";

import { useCallback } from "react";
import { useLang } from "./useLang";
import { t } from "./translations";

export function useT() {
  const lang = useLang();
  return useCallback((key: string): string => t[lang][key] ?? t.de[key] ?? key, [lang]);
}
