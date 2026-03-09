import json
import pandas as pd
from pathlib import Path

from PIL import Image

# ==== CONFIG ==================================================================
REPO_ROOT = Path(__file__).resolve().parents[1]

DATABASE_XLSX = REPO_ROOT / "Datenbank.xlsx"
PUBLIC_DIR    = REPO_ROOT / "public"
DATA_DIR      = PUBLIC_DIR / "data"

# Ausstellungen content — each slug now has its own subfolder:
#   public/content/ausstellungen/<slug>/
#     <slug>.md
#     Plakat_<slug>.<ext>
#     presse/
#       artikel1.jpg
#       artikel1.pdf
AUSSTELLUNGEN_CONTENT_DIR = PUBLIC_DIR / "content" / "ausstellungen"

IMG_DIR      = PUBLIC_DIR / "img" / "ausstellungen"  # kept for other exports
DATA_DIR.mkdir(parents=True, exist_ok=True)

BILDER_JSON    = DATA_DIR / "bilder.json"
OBJEKTE_JSON   = DATA_DIR / "objekte.json"
SERIEN_JSON    = DATA_DIR / "serien.json"
AKTUELLES_JSON = DATA_DIR / "ausstellungen.json"

THUMB_EXT = "avif"
# ==============================================================================

IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".avif", ".gif"}
PRESS_EXTS = IMAGE_EXTS | {".pdf"}


def clean(value, cast_int=False):
    if pd.isna(value) or str(value).strip() == "":
        return None
    if cast_int:
        try:
            return int(value)
        except Exception:
            return None
    return value


def col(row, key: str):
    try:
        return row.get(key, None)
    except Exception:
        try:
            return row[key]
        except Exception:
            return None


def thumb_name(filename: str, ext: str = THUMB_EXT) -> str:
    stem = Path(filename).stem
    return f"{stem}.{ext}"


# ---------------- dimension helpers ------------------------------------------

def public_path_from_url(url_path: str) -> Path:
    if not url_path:
        return Path()
    return PUBLIC_DIR / url_path.lstrip("/")


def read_image_size(path: Path) -> tuple[int | None, int | None]:
    try:
        if not path or not path.is_file():
            return (None, None)
        with Image.open(path) as im:
            return im.size
    except Exception:
        return (None, None)


def pick_size_for_pair(original_url: str | None, thumb_url: str | None) -> tuple[int | None, int | None]:
    tw, th = read_image_size(public_path_from_url(thumb_url or ""))
    if tw and th:
        return (tw, th)
    ow, oh = read_image_size(public_path_from_url(original_url or ""))
    return (ow, oh)


# -----------------------------------------------------------------------------

def export_bilder(sheet: pd.DataFrame, outpath: Path):
    sheet = sheet.dropna(how="all")
    sheet = sheet[sheet["technique"].notna() & (sheet["technique"].astype(str).str.strip() != "")]

    grouped = {}
    for _, row in sheet.iterrows():
        technique = str(row["technique"])
        fn = str(row["filename"]).strip()

        original = f"/img/arbeiten/bilder/{fn}"
        thumb = f"/img/arbeiten/bilder/thumbs/{thumb_name(fn)}"
        w, h = pick_size_for_pair(original, thumb)

        grouped.setdefault(technique, []).append({
            "title": clean(row["title"]),
            "year": clean(row["year"], cast_int=True),
            "size": clean(row["size"]),
            "misc": clean(col(row, "misc")),
            "misc_fr": clean(col(row, "misc_fr")),
            "misc_en": clean(col(row, "misc_en")),
            "filename": original,
            "thumb": thumb,
            "w": w,
            "h": h,
        })

    # Build a lookup for technique translations (first row per technique wins)
    tech_fr_map: dict[str, str] = {}
    tech_en_map: dict[str, str] = {}
    for _, row in sheet.iterrows():
        tech = str(row["technique"])
        if tech not in tech_fr_map:
            fr_val = clean(col(row, "technique_fr"))
            en_val = clean(col(row, "technique_en"))
            tech_fr_map[tech] = fr_val if fr_val else tech
            tech_en_map[tech] = en_val if en_val else tech

    seen, data = set(), []
    for tech in sheet["technique"]:
        tech = str(tech)
        if tech not in seen:
            data.append({
                "technique":    tech,
                "technique_fr": tech_fr_map.get(tech, tech),
                "technique_en": tech_en_map.get(tech, tech),
                "works":        grouped[tech],
            })
            seen.add(tech)

    Path(outpath).write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")


def export_objekte(sheet: pd.DataFrame, outpath: Path):
    sheet = sheet.dropna(how="all")
    data = []
    for _, row in sheet.iterrows():
        raw = str(row["filename"]) if not pd.isna(row["filename"]) else ""
        filenames = [fn.strip() for fn in raw.split(",") if fn.strip()]
        filenames = [f"/img/arbeiten/objekte/{fn}" for fn in filenames] if filenames else None

        thumbs = dims = None
        if filenames:
            thumbs, dims = [], []
            for f in filenames:
                base = Path(f).name
                t = f.replace("/objekte/", "/objekte/thumbs/").replace(base, thumb_name(base))
                thumbs.append(t)
                w, h = pick_size_for_pair(f, t)
                dims.append({"w": w, "h": h})

        data.append({
            "title": clean(row["title"]),
            "year": clean(col(row, "year"), cast_int=True),
            "size": clean(row["size"]),
            "misc": clean(col(row, "misc")),
            "misc_fr": clean(col(row, "misc_fr")),
            "misc_en": clean(col(row, "misc_en")),
            "filenames": filenames,
            "thumbs": thumbs,
            "dims": dims,
        })

    Path(outpath).write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")


def export_serien(sheet: pd.DataFrame, outpath: Path):
    sheet = sheet.dropna(how="all")
    grouped = {}

    for _, row in sheet.iterrows():
        series_title = str(row["series title"])
        grouped.setdefault(series_title, [])

        raw = str(row["filename"]) if not pd.isna(row["filename"]) else ""
        filenames = [fn.strip() for fn in raw.split(",") if fn.strip()]
        filenames = [f"/img/arbeiten/serien/{fn}" for fn in filenames] if filenames else None

        thumbs = dims = None
        if filenames:
            thumbs, dims = [], []
            for f in filenames:
                base = Path(f).name
                t = f.replace("/serien/", "/serien/thumbs/").replace(base, thumb_name(base))
                thumbs.append(t)
                w, h = pick_size_for_pair(f, t)
                dims.append({"w": w, "h": h})

        grouped[series_title].append({
            "piece": clean(row["piece title"]),
            "year": clean(row["year"], cast_int=True),
            "type": clean(row["type"]),
            "size": clean(row["size"]),
            "misc": clean(col(row, "misc")),
            "misc_fr": clean(col(row, "misc_fr")),
            "misc_en": clean(col(row, "misc_en")),
            "filenames": filenames,
            "thumbs": thumbs,
            "dims": dims,
        })

    seen, data = set(), []
    for s in sheet["series title"]:
        s = str(s)
        if s not in seen:
            data.append({"series": s, "works": grouped[s]})
            seen.add(s)

    Path(outpath).write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")


# --- Ausstellungen -----------------------------------------------------------

def is_x(value) -> bool:
    if value is None or pd.isna(value):
        return False
    return str(value).strip().lower() == "x"


def normalize_datei(value: str) -> str:
    s = str(value).strip().replace("\\", "/")
    if s.lower().endswith(".md"):
        s = s[:-3]
    return s.strip()


def fmt_excel_date(value) -> str:
    if value is None or pd.isna(value):
        return ""
    if isinstance(value, pd.Timestamp):
        return value.strftime("%d.%m.%y")
    s = str(value).strip()
    if not s:
        return ""
    try:
        dt = pd.to_datetime(value)
        if isinstance(dt, pd.Timestamp) and not pd.isna(dt):
            return dt.strftime("%d.%m.%y")
    except Exception:
        pass
    return s


def find_poster_file(base: Path, slug: str) -> tuple[Path | None, str | None]:
    """
    Search for the poster image for a given slug.

    Search order (first match wins):
      1. public/content/ausstellungen/<slug>/Plakat_<slug>.<ext>
      2. public/content/ausstellungen/<slug>/Poster_<slug>.<ext>
      3. public/content/ausstellungen/Plakat_<slug>.<ext>   ← legacy flat location
      4. public/content/ausstellungen/Poster_<slug>.<ext>   ← legacy flat location

    Returns (Path, url_string) or (None, None).
    """
    slug_low = slug.lower()

    search_dirs = [
        (base / slug,  f"/content/ausstellungen/{slug}/"),   # ← preferred: inside slug folder
        (base,         f"/content/ausstellungen/"),           # ← legacy: flat
    ]

    for dirpath, url_prefix in search_dirs:
        if not dirpath.is_dir():
            continue
        for p in dirpath.iterdir():
            if not p.is_file() or p.suffix.lower() not in IMAGE_EXTS:
                continue
            stem = p.stem.lower()
            if stem == f"plakat_{slug_low}" or stem == f"poster_{slug_low}":
                return p, f"{url_prefix}{p.name}"

    return None, None


def find_md_file(base: Path, slug: str) -> str:
    """
    Returns the md URL path.

    Looks for the .md file in:
      1. public/content/ausstellungen/<slug>/<slug>.md   ← preferred
      2. public/content/ausstellungen/<slug>.md          ← legacy flat

    Always returns the path string for the JSON (no leading slash).
    The URL used at runtime is constructed by the page component.
    """
    # Preferred: inside slug folder
    inside = base / slug / f"{slug}.md"
    if inside.is_file():
        return f"content/ausstellungen/{slug}/{slug}.md"

    # Legacy: flat
    return f"content/ausstellungen/{slug}.md"


def read_presse_captions(xls: pd.ExcelFile) -> dict[str, str]:
    """
    Read the 'Presse' sheet → dict mapping filename → meta caption string.
    Columns: 'file', 'meta'
    """
    if "Presse" not in xls.sheet_names:
        return {}
    sheet = pd.read_excel(xls, "Presse").dropna(how="all")
    result: dict[str, str] = {}
    for _, row in sheet.iterrows():
        fname = col(row, "file")
        meta  = col(row, "meta")
        if fname is None or str(fname).strip() == "":
            continue
        caption = str(meta).strip() if meta is not None and not pd.isna(meta) else ""
        result[str(fname).strip()] = caption
    return result


def find_press_files(base: Path, slug: str, captions: dict[str, str]) -> list[dict]:
    """
    Collect press article images for a given slug.

    Location:  public/content/ausstellungen/<slug>/presse/
    Caption:   looked up by filename from the Presse Excel sheet (captions dict).
               Falls back to a .txt sidecar if present.
    """
    presse_dir = base / slug / "presse"
    if not presse_dir.is_dir():
        return []

    items = []
    for f in sorted(presse_dir.iterdir()):
        if not f.is_file() or f.suffix.lower() not in IMAGE_EXTS:
            continue

        src = f"/content/ausstellungen/{slug}/presse/{f.name}"

        # 1. Caption from Presse sheet
        caption = captions.get(f.name, "").strip()

        # 2. Fallback: .txt sidecar
        if not caption:
            txt = presse_dir / (f.stem + ".txt")
            if txt.exists():
                caption = txt.read_text(encoding="utf-8").strip()

        entry: dict = {"src": src}
        if caption:
            entry["caption"] = caption
        items.append(entry)

    return items


def export_ausstellungen(sheet: pd.DataFrame, outpath: Path, captions: dict[str, str]):
    """
    Output shape per exhibition:
      {
        "title":          str,
        "anfang":         str,
        "ende":           str,
        "md":             "content/ausstellungen/<slug>/<slug>.md",
        "hasPoster":      bool,
        "poster":         "/content/ausstellungen/<slug>/Plakat_<slug>.<ext>" | null,
        "plakat-urheber": str | null,
        "press": [
          {"src": "/content/ausstellungen/<slug>/presse/<file>", "caption": str},
          ...
        ]
      }
    """
    sheet = sheet.dropna(how="all")

    base = Path(AUSSTELLUNGEN_CONTENT_DIR)
    if not base.is_dir():
        raise FileNotFoundError(f"Ausstellungen content dir not found: {base}")

    items = []

    for i, row in sheet.iterrows():
        datei_raw = col(row, "Datei")
        if datei_raw is None or str(datei_raw).strip() == "":
            print(f"Warning: missing Datei in row {i} → skipping")
            continue

        slug = normalize_datei(datei_raw)
        title  = clean(col(row, "Titel")) or slug
        anfang = fmt_excel_date(col(row, "Anfang"))
        ende   = fmt_excel_date(col(row, "Ende"))

        md_rel = find_md_file(base, slug)

        has_poster = is_x(col(row, "Poster"))
        poster_path, poster_url = (None, None)
        if has_poster:
            poster_path, poster_url = find_poster_file(base, slug)
            if poster_path is None:
                print(
                    f"Warning: Poster marked 'x' but not found for '{slug}'. "
                    f"Expected Plakat_{slug}.* inside {base / slug}/ or {base}/"
                )

        press = find_press_files(base, slug, captions)

        items.append({
            "title":          title,
            "anfang":         anfang,
            "ende":           ende,
            "md":             md_rel,
            "hasPoster":      has_poster,
            "poster":         poster_url,
            "plakat-urheber": clean(col(row, "Urheber")),
            "press":          press,
        })

    outpath = Path(outpath)
    outpath.parent.mkdir(parents=True, exist_ok=True)
    outpath.write_text(json.dumps(items, indent=2, ensure_ascii=False), encoding="utf-8")


# ------------------------------------------------------------------------------

def main():
    if not DATABASE_XLSX.is_file():
        raise FileNotFoundError(f"Database not found: {DATABASE_XLSX}")

    with pd.ExcelFile(DATABASE_XLSX) as xls:
        # Read Presse captions once, share with export_ausstellungen
        captions = read_presse_captions(xls)

        export_bilder(pd.read_excel(xls, "Bilder"),           BILDER_JSON)
        export_objekte(pd.read_excel(xls, "Objekte"),         OBJEKTE_JSON)
        export_serien(pd.read_excel(xls, "Serien"),           SERIEN_JSON)
        export_ausstellungen(pd.read_excel(xls, "Ausstellungen"), AKTUELLES_JSON, captions)

    print(f"✅ JSON export finished. Files written to {DATA_DIR}")
    print(f"✅ Thumb extension in JSON: .{THUMB_EXT}")
    if captions:
        print(f"✅ Presse captions loaded: {len(captions)} entries")


if __name__ == "__main__":
    main()