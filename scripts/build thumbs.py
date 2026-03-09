# -*- coding: utf-8 -*-
"""
Spyder-friendly thumbnail generator with selectable output format.

HOW TO USE (Spyder):
- Set OUTPUT_EXT below ("jpg", "webp", "png", "avif")
- Set THUMBS_DIR (e.g. "thumbs", "thumbs_avif")
- Press Run ▶️

Requirements:
  pip install pillow
  For AVIF:
    pip install pillow-avif-plugin
"""

from pathlib import Path
from PIL import Image, ImageOps, features


# =========================
# USER CONFIG (EDIT THIS)
# =========================

OUTPUT_EXT = "png"          # "jpg" | "webp" | "png" | "avif"
THUMBS_DIR = "thumbs"        # output folder name

MAX_W = 640
MAX_H = 960

QUALITY = 55                # jpg / webp / avif
AVIF_SPEED = 6              # 0..10 (higher = faster)
AVIF_MAX_KB = 70             # None to disable size cap

FORCE_REGEN = False         # True = regenerate even if up-to-date


# =========================
# PROJECT PATHS
# =========================

PROJECT_ROOT = Path(__file__).resolve().parent.parent
IMG_DIR = PROJECT_ROOT / "public" / "img"

ARBEITEN_ROOT = IMG_DIR / "arbeiten"
AUSSTELLUNGEN_ROOT = IMG_DIR / "ausstellungen"

IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp"}
SKIP_NAME_SUBSTRINGS = {"poster", "plakat"}


# =========================
# SAFETY CHECKS
# =========================

if OUTPUT_EXT == "avif" and not features.check("avif"):
    raise RuntimeError(
        "AVIF not supported in your Pillow build.\n"
        "Install with: pip install pillow-avif-plugin"
    )

if OUTPUT_EXT == "webp" and not features.check("webp"):
    raise RuntimeError(
        "WebP not supported in your Pillow build."
    )


# =========================
# HELPERS
# =========================

def is_image(p: Path) -> bool:
    return p.is_file() and p.suffix.lower() in IMAGE_EXTS and not p.name.startswith(".")

def is_in_thumbs_dir(p: Path) -> bool:
    return any(part.lower() in {"thumbs", "thumbs_avif", THUMBS_DIR.lower()} for part in p.parts)

def should_skip_file(p: Path) -> bool:
    return any(s in p.name.lower() for s in SKIP_NAME_SUBSTRINGS)

def thumb_path(src: Path) -> Path:
    return src.parent / THUMBS_DIR / f"{src.stem}.{OUTPUT_EXT}"

def open_size(path: Path):
    with Image.open(path) as im:
        return im.size

def is_up_to_date(src: Path, dst: Path) -> bool:
    if FORCE_REGEN:
        return False
    if not dst.exists():
        return False
    if dst.stat().st_mtime < src.stat().st_mtime:
        return False
    try:
        w, h = open_size(dst)
    except Exception:
        return False
    return w <= MAX_W and h <= MAX_H

def flatten_alpha(im: Image.Image) -> Image.Image:
    if im.mode in ("RGBA", "LA", "P"):
        rgba = im.convert("RGBA")
        bg = Image.new("RGB", rgba.size, (255, 255, 255))
        bg.paste(rgba, mask=rgba.split()[-1])
        return bg
    if im.mode not in ("RGB", "L"):
        return im.convert("RGB")
    return im

def save_thumb(im: Image.Image, dst: Path):
    dst.parent.mkdir(parents=True, exist_ok=True)

    if OUTPUT_EXT in {"jpg", "jpeg", "webp", "avif"}:
        im = flatten_alpha(im)

    if OUTPUT_EXT in {"jpg", "jpeg"}:
        im.save(dst, "JPEG", quality=QUALITY, optimize=True, progressive=True)

    elif OUTPUT_EXT == "webp":
        im.save(dst, "WEBP", quality=QUALITY, method=6)

    elif OUTPUT_EXT == "png":
        im.save(dst, "PNG", optimize=True)

    elif OUTPUT_EXT == "avif":
        q = QUALITY
        cap = None if AVIF_MAX_KB is None else AVIF_MAX_KB * 1024

        while True:
            im.save(dst, "AVIF", quality=q, speed=AVIF_SPEED)
            if cap is None or dst.stat().st_size <= cap or q <= 30:
                break
            q -= 5

    else:
        raise ValueError("Unsupported OUTPUT_EXT")

def make_one(src: Path) -> str:
    dst = thumb_path(src)

    if is_up_to_date(src, dst):
        return f"SKIP  {src}"

    with Image.open(src) as im:
        im = ImageOps.exif_transpose(im)
        w, h = im.size

        if w > MAX_W or h > MAX_H:
            im.thumbnail((MAX_W, MAX_H), Image.Resampling.LANCZOS)

        save_thumb(im, dst)

    tw, th = open_size(dst)
    return f"DONE  {src} → {dst}  ({w}x{h} → {tw}x{th})"


# =========================
# COLLECTORS
# =========================

def collect_arbeiten():
    if not ARBEITEN_ROOT.exists():
        return []
    return sorted(
        p for p in ARBEITEN_ROOT.rglob("*")
        if is_image(p) and not is_in_thumbs_dir(p) and not should_skip_file(p)
    )

def collect_ausstellungen():
    if not AUSSTELLUNGEN_ROOT.exists():
        return []
    out = []
    for p in AUSSTELLUNGEN_ROOT.rglob("*"):
        if not is_image(p):
            continue
        if is_in_thumbs_dir(p) or should_skip_file(p):
            continue
        if any(part.lower() == "vernissage" for part in p.parts):
            out.append(p)
    return sorted(out)


# =========================
# MAIN
# =========================

def run():
    arbeiten = collect_arbeiten()
    ausstellungen = collect_ausstellungen()

    print("=== CONFIG ===")
    print(f"EXT: .{OUTPUT_EXT}  |  DIR: {THUMBS_DIR}")
    print(f"MAX: {MAX_W} x {MAX_H}  |  QUALITY: {QUALITY}")
    print()

    for src in arbeiten:
        print(make_one(src))

    print()

    for src in ausstellungen:
        print(make_one(src))

    print("\nDONE.")

if __name__ == "__main__":
    run()
