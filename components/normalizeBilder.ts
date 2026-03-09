import rawData from "@/public/data/bilder.json";

export interface Work {
  title: string;
  year?: number;
  size?: string | null;
  filename: string;
  misc?: string | null;
  misc_fr?: string | null;
  misc_en?: string | null;
  thumb?: string;
  w?: number | null;
  h?: number | null;
}

export interface Technik {
  technique: string;
  technique_fr?: string;
  technique_en?: string;
  works: Work[];
}

interface WorkRaw {
  title: string;
  year: number | null;
  size: string | number | null;
  filename: string;
  misc?: string | null;
  misc_fr?: string | null;
  misc_en?: string | null;
  thumb?: string;
  w?: number | null;
  h?: number | null;
}

interface TechnikRaw {
  technique: string;
  technique_fr?: string;
  technique_en?: string;
  works: WorkRaw[];
}

export function getTechniken(): Technik[] {
  const data = rawData as unknown as TechnikRaw[];

  return data.map((t) => ({
    technique: t.technique,
    technique_fr: t.technique_fr,
    technique_en: t.technique_en,
    works: t.works.map((w) => ({
      title: String(w.title ?? ""),
      filename: String(w.filename ?? ""),
      year: w.year === null ? undefined : w.year,
      size:
        w.size === null || w.size === undefined
          ? null
          : typeof w.size === "number"
          ? String(w.size)
          : String(w.size),

      misc:
        w.misc === null || w.misc === undefined || String(w.misc).trim() === ""
          ? null
          : String(w.misc),
      misc_fr:
        w.misc_fr === null || w.misc_fr === undefined || String(w.misc_fr).trim() === ""
          ? null
          : String(w.misc_fr),
      misc_en:
        w.misc_en === null || w.misc_en === undefined || String(w.misc_en).trim() === ""
          ? null
          : String(w.misc_en),

      // optional passthroughs
      thumb: w.thumb ? String(w.thumb) : undefined,
      w: w.w ?? null,
      h: w.h ?? null,
    })),
  }));
}
