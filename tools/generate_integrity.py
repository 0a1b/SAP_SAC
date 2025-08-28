#!/usr/bin/env python3
"""
Generate Subresource Integrity (SRI) hashes for all custom widget index.json files
under sap_sac_custom_widgets and write them into the webcomponents[].integrity fields.

By default, the script preserves the existing value of "ignoreIntegrity". Use --enforce
if you want to set ignoreIntegrity=false for all webcomponents after writing hashes.

Usage:
  python3 sap_sac_custom_widgets/tools/generate_integrity.py [--root sap_sac_custom_widgets] [--enforce] [--dry-run]
"""
from __future__ import annotations

import argparse
import base64
import hashlib
import json
import os
from pathlib import Path
from typing import Dict, Any, List

DEFAULT_ROOT = Path(__file__).resolve().parents[1]


def sri_sha256(path: Path) -> str:
    data = path.read_bytes()
    digest = hashlib.sha256(data).digest()
    return "sha256-" + base64.b64encode(digest).decode("ascii")


def update_index_json(index_path: Path, enforce: bool = False, dry_run: bool = False) -> bool:
    try:
        widget_dir = index_path.parent
        obj = json.loads(index_path.read_text(encoding="utf-8"))
        changed = False
        wc: List[Dict[str, Any]] = obj.get("webcomponents", [])
        for i, comp in enumerate(wc):
            url = comp.get("url")
            if not url:
                # Some manifests use "src" instead of url (older patterns). Try that too.
                url = comp.get("src")
                if not url:
                    continue
            # Normalize local path: urls usually start with "/" and are relative to widget dir
            local = url.lstrip("/")
            file_path = widget_dir / local
            if not file_path.exists():
                print(f"[WARN] {index_path}: referenced file not found: {url}")
                continue
            new_integrity = sri_sha256(file_path)
            old_integrity = comp.get("integrity")
            if old_integrity != new_integrity:
                print(f"[INFO] {index_path}: webcomponent[{i}] {url} integrity -> {new_integrity}")
                comp["integrity"] = new_integrity
                changed = True
            # Optionally enforce ignoreIntegrity=false
            if enforce:
                if comp.get("ignoreIntegrity", True):
                    comp["ignoreIntegrity"] = False
                    changed = True
        if changed and not dry_run:
            index_path.write_text(json.dumps(obj, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        return changed
    except Exception as e:
        print(f"[ERR] Failed to process {index_path}: {e}")
        return False


def scan_root(root: Path, enforce: bool = False, dry_run: bool = False) -> None:
    if not root.exists():
        print(f"[ERR] Root not found: {root}")
        return
    count = 0
    changed = 0
    for dirpath, dirnames, filenames in os.walk(root):
        # Skip dist or hidden folders
        parts = Path(dirpath).parts
        if any(p in ("dist", ".git", "node_modules", "__pycache__") for p in parts):
            continue
        if "index.json" in filenames:
            idx = Path(dirpath) / "index.json"
            count += 1
            if update_index_json(idx, enforce=enforce, dry_run=dry_run):
                changed += 1
    print(f"[DONE] Scanned {count} index.json files, updated {changed}.")


def main():
    ap = argparse.ArgumentParser(description="Generate integrity hashes for SAC widgets.")
    ap.add_argument("--root", type=str, default=str(DEFAULT_ROOT), help="Root folder (default: sap_sac_custom_widgets)")
    ap.add_argument("--enforce", action="store_true", help="Set ignoreIntegrity=false for all entries")
    ap.add_argument("--dry-run", action="store_true", help="Do not write files; just print changes")
    args = ap.parse_args()

    root = Path(args.root)
    scan_root(root, enforce=args.enforce, dry_run=args.dry_run)


if __name__ == "__main__":
    main()
