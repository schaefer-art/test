"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/lib/useLang";
import { useT } from "@/lib/useT";
import rawBilder from "@/public/data/bilder.json";
import rawObjekte from "@/public/data/objekte.json";
import rawSerien from "@/public/data/serien.json";

type Category = "bilder" | "objekte" | "serien";

type SearchEntry = {
  title: string;
  category: Category;
  sectionIdx: number;
  itemIdx: number;
};

// Built once at module level from static JSON
const INDEX: SearchEntry[] = (() => {
  const entries: SearchEntry[] = [];

  (rawBilder as any[]).forEach((group, sIdx) => {
    (group.works ?? []).forEach((w: any, iIdx: number) => {
      if (w?.title) {
        entries.push({ title: String(w.title), category: "bilder", sectionIdx: sIdx, itemIdx: iIdx });
      }
    });
  });

  (rawObjekte as any[]).forEach((obj, sIdx) => {
    if (obj?.title) {
      entries.push({ title: String(obj.title), category: "objekte", sectionIdx: sIdx, itemIdx: 0 });
    }
  });

  (rawSerien as any[]).forEach((serie, sIdx) => {
    const seriesLabel = String(serie?.series ?? "");
    (serie?.works ?? []).forEach((w: any, iIdx: number) => {
      const pieceTitle = w?.piece ? String(w.piece) : seriesLabel;
      if (pieceTitle) {
        entries.push({ title: pieceTitle, category: "serien", sectionIdx: sIdx, itemIdx: iIdx });
      }
    });
  });

  return entries;
})();

export default function SearchBox({ onNavigate }: { onNavigate?: () => void } = {}) {
  const router = useRouter();
  const lang = useLang();
  const tr = useT();

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return INDEX.filter((e) => e.title.toLowerCase().includes(q)).slice(0, 10);
  }, [query]);

  useEffect(() => {
    setHighlighted(0);
    setOpen(results.length > 0);
  }, [results]);

  const navigateTo = useCallback(
    (entry: SearchEntry) => {
      setQuery("");
      setOpen(false);
      onNavigate?.();
      router.push(`/${lang}/arbeiten/${entry.category}?s=${entry.sectionIdx}&i=${entry.itemIdx}`);
    },
    [lang, router, onNavigate]
  );

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((h) => Math.min(h + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const entry = results[highlighted];
      if (entry) navigateTo(entry);
    } else if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
    }
  };

  // Close on outside click
  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  const catLabel = (cat: Category): string => {
    if (cat === "bilder") return tr("nav_bilder");
    if (cat === "objekte") return tr("nav_objekte");
    return tr("nav_serien");
  };

  return (
    <div className="search-box" ref={containerRef}>
      <input
        ref={inputRef}
        className="search-input"
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => { if (results.length > 0) setOpen(true); }}
        onKeyDown={onKeyDown}
        placeholder={tr("search_placeholder")}
        autoComplete="off"
        spellCheck={false}
        aria-label={tr("search_placeholder")}
      />
      {query && (
        <button
          className="search-clear"
          onMouseDown={(e) => { e.preventDefault(); setQuery(""); setOpen(false); }}
          tabIndex={-1}
          aria-label="Clear search"
        >
          ×
        </button>
      )}
      {open && (
        <ul className="search-dropdown" role="listbox">
          {results.map((entry, idx) => (
            <li
              key={`${entry.category}-${entry.sectionIdx}-${entry.itemIdx}`}
              className={`search-result${idx === highlighted ? " highlighted" : ""}`}
              onMouseEnter={() => setHighlighted(idx)}
              onMouseDown={(e) => {
                e.preventDefault();
                navigateTo(entry);
              }}
              role="option"
              aria-selected={idx === highlighted}
            >
              <span className="search-result-title">{entry.title}</span>
              <span className="search-result-cat">{catLabel(entry.category)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
