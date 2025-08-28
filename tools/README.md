# Tools for SAC Custom Widgets

This folder contains helper scripts for preparing SAP Analytics Cloud (SAC) custom widgets for import and production use.

## generate_integrity.py

Generate Subresource Integrity (SRI) hashes for all custom widget `index.json` manifests under the widgets root (default: parent folder).

SAC requires an `integrity` property on each `webcomponents` entry. In development, you may set `ignoreIntegrity: true` and use an empty string, but for production we recommend providing real hashes and setting `ignoreIntegrity: false`.

### Usage

- Dry run (compute, do not write):
  ```bash
  python3 sap_sac_custom_widgets/tools/generate_integrity.py --dry-run
  ```

- Write hashes (preserve ignore flags):
  ```bash
  python3 sap_sac_custom_widgets/tools/generate_integrity.py
  ```

- Write hashes and enforce `ignoreIntegrity=false` (production mode):
  ```bash
  python3 sap_sac_custom_widgets/tools/generate_integrity.py --enforce
  ```

- Custom root path:
  ```bash
  python3 sap_sac_custom_widgets/tools/generate_integrity.py --root /path/to/widgets
  ```

### What it does

- Finds `index.json` files recursively (skips `dist`, `.git`, `node_modules`, `__pycache__`).
- For each `webcomponents` entry, reads the referenced `url` (or `src`) file, computes SHA-256 SRI, and updates the `integrity` field.
- Optionally sets `ignoreIntegrity=false` when `--enforce` is provided.

### Why use it?

- SAC schemas require an `integrity` field. This script ensures valid hashes are present.
- Makes widget bundles production-ready by enforcing integrity.

License: PolyForm Noncommercial 1.0.0 (see parent README).
