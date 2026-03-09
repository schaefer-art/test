// components/viewer/useSectionViewer.ts
"use client";

import { useEffect, useRef, useState } from "react";

type SidebarInfo = {
  title: string;
  year?: string;
  size?: string;
  index: number;
  total: number;
};

type Getters<Item, Section> = {
  getItems: (sectionIndex: number, section: Section) => Item[];
  getSrc: (item: Item, sectionIndex: number, section: Section) => string;
  getAlt?: (item: Item, sectionIndex: number, section: Section) => string;
  getSidebarInfo?: (
    item: Item,
    itemIndex: number,
    total: number,
    sectionIndex: number,
    section: Section
  ) => SidebarInfo | null;
};

type Options = {
  threshold?: number;
  enableSwipe?: boolean;
  enableKeyboard?: boolean;
  storageKey?: string;
};

export function useSectionViewer<Section, Item>(
  sections: Section[],
  getters: Getters<Item, Section>,
  deps: {
    setInfo: (v: any) => void;
    setActiveSection: (idx: number) => void;
  },
  options: Options = {}
) {
  const { threshold = 0.5, enableSwipe = false, enableKeyboard = true, storageKey } = options;

  // ✅ store latest getters + deps in refs so effects don't depend on object identity
  const gettersRef = useRef(getters);
  const depsRef = useRef(deps);

  useEffect(() => {
    gettersRef.current = getters;
  }, [getters]);

  useEffect(() => {
    depsRef.current = deps;
  }, [deps]);

  const [idxBySection, setIdxBySection] = useState<number[]>(() => {
    if (storageKey && typeof window !== "undefined") {
      try {
        const saved = sessionStorage.getItem(storageKey);
        if (saved) {
          const data = JSON.parse(saved) as { indexes: number[]; section: number };
          if (Array.isArray(data?.indexes) && data.indexes.length === sections.length) {
            return data.indexes;
          }
        }
      } catch {}
    }
    return sections.map(() => 0);
  });

  const [activeSectionIdx, setActiveSectionIdx] = useState(() => {
    if (storageKey && typeof window !== "undefined") {
      try {
        const saved = sessionStorage.getItem(storageKey);
        if (saved) {
          const data = JSON.parse(saved) as { indexes: number[]; section: number };
          if (typeof data?.section === "number") return data.section;
        }
      } catch {}
    }
    return 0;
  });

  // ✅ keep latest values in refs to avoid stale closures in listeners
  const sectionsRef = useRef(sections);
  const idxBySectionRef = useRef(idxBySection);
  const activeSectionIdxRef = useRef(activeSectionIdx);

  useEffect(() => {
    sectionsRef.current = sections;
  }, [sections]);

  useEffect(() => {
    idxBySectionRef.current = idxBySection;
    if (storageKey && typeof window !== "undefined") {
      try {
        sessionStorage.setItem(storageKey, JSON.stringify({
          indexes: idxBySection,
          section: activeSectionIdxRef.current,
        }));
      } catch {}
    }
  }, [idxBySection, storageKey]);

  useEffect(() => {
    activeSectionIdxRef.current = activeSectionIdx;
    if (storageKey && typeof window !== "undefined") {
      try {
        sessionStorage.setItem(storageKey, JSON.stringify({
          indexes: idxBySectionRef.current,
          section: activeSectionIdx,
        }));
      } catch {}
    }
  }, [activeSectionIdx, storageKey]);

  // Restore scroll position on mount when returning via language switch
  useEffect(() => {
    if (!storageKey) return;
    try {
      const saved = sessionStorage.getItem(storageKey);
      if (saved) {
        const data = JSON.parse(saved) as { indexes: number[]; section: number };
        if (typeof data?.section === "number" && data.section > 0) {
          requestAnimationFrame(() => {
            document.getElementById(`section-${data.section}`)?.scrollIntoView({ behavior: "auto", block: "start" });
          });
        }
      }
    } catch {}
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Pattern B overview
  const [overviewOpen, setOverviewOpen] = useState(false);
  const [overviewSectionIdx, setOverviewSectionIdx] = useState<number | null>(
    null
  );

  const openOverview = (sIdx: number) => {
    setOverviewSectionIdx(sIdx);
    setOverviewOpen(true);
  };

  const closeOverview = () => {
    setOverviewOpen(false);
    setOverviewSectionIdx(null);
  };

  // refs
  const overlayRefs = useRef<(HTMLDivElement | null)[]>([]);
  const imgRefs = useRef<(HTMLImageElement | null)[]>([]);
  const thumbRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const mainRef = useRef<HTMLElement | null>(null);

  const setOverlayRef = (idx: number) => (el: HTMLDivElement | null) => {
    overlayRefs.current[idx] = el;
  };
  const setImgRef = (idx: number) => (el: HTMLImageElement | null) => {
    imgRefs.current[idx] = el;
  };
  const setThumbRef = (i: number) => (el: HTMLButtonElement | null) => {
    thumbRefs.current[i] = el;
  };

  // focus for arrow up/down
  useEffect(() => {
    mainRef.current?.focus({ preventScroll: true });
  }, []);

  // ✅ highlight active section on mount (run exactly once)
  useEffect(() => {
    depsRef.current.setActiveSection(activeSectionIdxRef.current);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // keep idx array aligned if sections length changes
  useEffect(() => {
    setIdxBySection((prev) => {
      if (prev.length === sections.length) return prev;
      const next = sections.map((_, i) => prev[i] ?? 0);
      return next;
    });
  }, [sections.length]);

  const clamp = (v: number, min: number, max: number) =>
    Math.max(min, Math.min(max, v));

  const preload = (src: string) =>
    new Promise<void>((resolve) => {
      const im = new Image();
      im.src = src;
      if ("decode" in im && typeof (im as any).decode === "function") {
        (im as any).decode().then(resolve).catch(resolve);
      } else {
        im.onload = () => resolve();
        im.onerror = () => resolve();
      }
    });

  const flashSwap = async (sIdx: number, nextIdx: number) => {
    const overlay = overlayRefs.current[sIdx];
    const img = imgRefs.current[sIdx];
    const section = sectionsRef.current[sIdx];
    if (!overlay || !img || !section) return;

    const items = gettersRef.current.getItems(sIdx, section);
    const item = items[nextIdx];
    const nextSrc = item ? gettersRef.current.getSrc(item, sIdx, section) : "";

    if (!nextSrc) return;

    overlay.classList.add("instant");
    overlay.getBoundingClientRect();

    await preload(nextSrc);
    img.src = nextSrc;

    setIdxBySection((prev) => {
      const next = [...prev];
      next[sIdx] = nextIdx;
      return next;
    });

    requestAnimationFrame(() => overlay.classList.remove("instant"));
  };

  const next = (sIdx: number) => {
    const section = sectionsRef.current[sIdx];
    if (!section) return;

    const items = gettersRef.current.getItems(sIdx, section);
    const current = idxBySectionRef.current[sIdx] ?? 0;
    const max = Math.max(0, items.length - 1);
    const target = clamp(current + 1, 0, max);
    if (target !== current) flashSwap(sIdx, target);
  };

  const prev = (sIdx: number) => {
    const section = sectionsRef.current[sIdx];
    if (!section) return;

    const items = gettersRef.current.getItems(sIdx, section);
    const current = idxBySectionRef.current[sIdx] ?? 0;
    const max = Math.max(0, items.length - 1);
    const target = clamp(current - 1, 0, max);
    if (target !== current) flashSwap(sIdx, target);
  };

  const select = (sIdx: number, itemIdx: number) => {
    setIdxBySection((prev) => {
      const next = [...prev];
      next[sIdx] = itemIdx;
      return next;
    });
    flashSwap(sIdx, itemIdx);
    closeOverview();
  };

  // intersection observer
  useEffect(() => {
    const nodes = sections.map((_, i) => document.getElementById(`section-${i}`));

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (!visible) return;

        const idx = nodes.indexOf(visible.target as HTMLElement);
        if (idx !== -1 && idx !== activeSectionIdxRef.current) {
          setActiveSectionIdx(idx);
          depsRef.current.setActiveSection(idx);
        }
      },
      { threshold }
    );

    nodes.forEach((n) => n && observer.observe(n));
    return () => observer.disconnect();
  }, [sections, threshold]);

  // sidebar info
  useEffect(() => {
    if (overviewOpen) {
      depsRef.current.setInfo(null);
      return;
    }

    const section = sectionsRef.current[activeSectionIdxRef.current];
    if (!section) {
      depsRef.current.setInfo(null);
      return;
    }

    const items = gettersRef.current.getItems(activeSectionIdxRef.current, section);
    const idx = idxBySectionRef.current[activeSectionIdxRef.current] ?? 0;
    const item = items[idx];

    if (!item) {
      depsRef.current.setInfo(null);
      return;
    }

    const info = gettersRef.current.getSidebarInfo
      ? gettersRef.current.getSidebarInfo(
          item,
          idx,
          items.length,
          activeSectionIdxRef.current,
          section
        )
      : null;

    depsRef.current.setInfo(info);
  }, [overviewOpen, idxBySection, activeSectionIdx, sections]);

  // overview lock scroll + ESC
  useEffect(() => {
    if (!overviewOpen) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeOverview();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [overviewOpen]);

  // scroll active thumb into view
  useEffect(() => {
    if (!overviewOpen || overviewSectionIdx === null) return;

    const activeIdx = idxBySectionRef.current[overviewSectionIdx] ?? 0;
    thumbRefs.current = [];

    requestAnimationFrame(() => {
      thumbRefs.current[activeIdx]?.scrollIntoView({
        behavior: "auto",
        block: "nearest",
        inline: "nearest",
      });
    });
  }, [overviewOpen, overviewSectionIdx, idxBySection]);

  // keyboard (✅ uses refs)
  useEffect(() => {
    if (!enableKeyboard) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (overviewOpen) return;

      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      if (
        tag === "input" ||
        tag === "textarea" ||
        tag === "select" ||
        target?.isContentEditable
      )
        return;

      const activeIdx = activeSectionIdxRef.current;

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        prev(activeIdx);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        next(activeIdx);
      } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
        e.preventDefault();
        const delta = e.key === "ArrowDown" ? 1 : -1;
        const max = sectionsRef.current.length - 1;
        const nextIdx = clamp(activeIdx + delta, 0, max);
        const el = document.getElementById(`section-${nextIdx}`);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    };

    window.addEventListener("keydown", onKeyDown, { passive: false });
    return () => window.removeEventListener("keydown", onKeyDown as any);
  }, [enableKeyboard, overviewOpen]);

  // optional swipe
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchDeltaX, setTouchDeltaX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);

  const onTouchStart = enableSwipe
    ? (e: React.TouchEvent) => {
        setTouchStartX(e.touches[0].clientX);
        setTouchDeltaX(0);
        setIsSwiping(false);
      }
    : undefined;

  const onTouchMove = enableSwipe
    ? (e: React.TouchEvent) => {
        if (touchStartX === null) return;
        const delta = e.touches[0].clientX - touchStartX;
        if (Math.abs(delta) > 10) setIsSwiping(true);
        setTouchDeltaX(delta);
      }
    : undefined;

  const onTouchEnd = enableSwipe
    ? (sectionIdx: number) => {
        const thresholdSwipe = 80;
        if (touchDeltaX < -thresholdSwipe) next(sectionIdx);
        else if (touchDeltaX > thresholdSwipe) prev(sectionIdx);
        setTouchStartX(null);
        setTouchDeltaX(0);
        setIsSwiping(false);
      }
    : undefined;

  return {
    idxBySection,
    activeSectionIdx,

    overviewOpen,
    overviewSectionIdx,
    openOverview,
    closeOverview,

    next,
    prev,
    select,

    mainRef,
    setImgRef,
    setOverlayRef,
    setThumbRef,

    isSwiping,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
  };
}
