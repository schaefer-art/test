"use client";

import { useParams } from "next/navigation";
import type { Lang } from "./translations";

export function useLang(): Lang {
  const params = useParams();
  const lang = params?.lang;
  if (lang === "fr" || lang === "en") return lang;
  return "de";
}
