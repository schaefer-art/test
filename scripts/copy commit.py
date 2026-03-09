import os
import shutil
from datetime import datetime
from pathlib import Path

from pathspec import PathSpec


# -------------------------
# CONFIG
# -------------------------
SOURCE_DIR  = Path(r"C:\Users\David Schäfer\Documents\GitHub\homepage").resolve()
BACKUP_BASE = Path(r"C:\Users\David Schäfer\OneDrive - Justus-Liebig-Universität Gießen\_Privat\homepage-versions").resolve()
TEST_DIR    = Path(r"C:\Users\David Schäfer\Documents\GitHub\test").resolve()


# -------------------------
# USER INPUT (mode)
# -------------------------
print("Where do you want to copy to?")
print("  1 = new versioned folder in OneDrive")
print("  2 = overwrite test  (" + str(TEST_DIR) + ")")
mode = input("Choose [1/2]: ").strip()

if mode == "2":
    DEST_DIR = TEST_DIR
    OVERWRITE = True
else:
    # ---- versioned OneDrive snapshot ----
    user_label = input("Enter version label (e.g. feature-lightbox, before-refactor): ").strip()
    if not user_label:
        user_label = "snapshot"
    safe_label = "".join(c for c in user_label if c.isalnum() or c in ("-", "_")).rstrip()

    PROJECT_NAME = SOURCE_DIR.name
    TIMESTAMP    = datetime.now().strftime("%Y-%m-%d")
    DEST_DIR     = BACKUP_BASE / f"{PROJECT_NAME}_{TIMESTAMP}_{safe_label}"
    OVERWRITE    = False


# -------------------------
# ALWAYS IGNORE
# -------------------------
ALWAYS_IGNORE = [
    ".git/",
    ".DS_Store",
    "Thumbs.db",
]


# -------------------------
# HELPERS
# -------------------------
def read_ignore_file(path: Path) -> list[str]:
    if not path.exists():
        return []
    lines = []
    for raw in path.read_text(encoding="utf-8", errors="ignore").splitlines():
        s = raw.strip()
        if not s or s.startswith("#"):
            continue
        lines.append(s)
    return lines


def build_gitignore_spec(repo_root: Path) -> tuple[PathSpec, bool]:
    patterns = []
    patterns += read_ignore_file(repo_root / ".gitignore")
    patterns += read_ignore_file(repo_root / ".git" / "info" / "exclude")
    patterns += ALWAYS_IGNORE

    has_negation = any(p.startswith("!") for p in patterns)

    spec = PathSpec.from_lines("gitwildmatch", patterns)
    return spec, has_negation


def is_ignored(spec: PathSpec, rel_posix: str, is_dir: bool) -> bool:
    if is_dir and not rel_posix.endswith("/"):
        rel_posix = rel_posix + "/"
    return spec.match_file(rel_posix)


def ensure_dir(path: Path) -> None:
    path.mkdir(parents=True, exist_ok=True)


# -------------------------
# MAIN COPY LOGIC
# -------------------------
def snapshot_copy(source: Path, dest: Path, overwrite: bool = False) -> None:
    if not source.exists() or not source.is_dir():
        raise ValueError(f"Source directory does not exist or is not a folder: {source}")

    ensure_dir(dest.parent)

    spec, has_negation = build_gitignore_spec(source)
    allow_prune_dirs = not has_negation

    if overwrite and dest.exists():
        def _force_remove(func, path, _exc):
            os.chmod(path, 0o666)
            func(path)
        # Delete everything except .git so GitHub Desktop keeps tracking the repo
        for item in dest.iterdir():
            if item.name == ".git":
                continue
            if item.is_dir():
                shutil.rmtree(item, onexc=_force_remove)
            else:
                _force_remove(os.unlink, str(item), None)

    ensure_dir(dest)

    for root, dirs, files in os.walk(source):
        root_path = Path(root)
        rel_root = root_path.relative_to(source)
        rel_root_posix = rel_root.as_posix()

        if allow_prune_dirs:
            kept_dirs = []
            for d in dirs:
                rel_d = (rel_root / d).as_posix()
                if not is_ignored(spec, rel_d, is_dir=True):
                    kept_dirs.append(d)
            dirs[:] = kept_dirs

        dest_root = dest / rel_root
        ensure_dir(dest_root)

        for f in files:
            rel_f = (rel_root / f).as_posix()
            if is_ignored(spec, rel_f, is_dir=False):
                continue

            src_file = root_path / f
            dst_file = dest_root / f
            ensure_dir(dst_file.parent)
            shutil.copy2(src_file, dst_file)

    print(f"\nSnapshot created at:\n{dest}")


if __name__ == "__main__":
    snapshot_copy(SOURCE_DIR, DEST_DIR, overwrite=OVERWRITE)