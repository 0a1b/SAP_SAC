# SAC Custom Widgets Collection (PolyForm Noncommercial License)

A curated set of SAP Analytics Cloud (SAC) Custom Widgets built on top of the official community samples, extended with advanced configuration and UX features.

All code in this directory is provided under the PolyForm Noncommercial License 1.0.0. See the License section below.

## Contents

- sunburst/
  - Sunburst Chart (Advanced Tooltips) – ECharts sunburst with a powerful, configurable tooltip system (fields, formatting, styles).
- matrix_widget/
  - Field Matrix (Configurable) – Table-like grid where each cell displays a dimension or KPI; supports per-cell filters and font styles.
- multi_half_donut/
  - Multi Half Donut (up to 5 rings) – Concentric half-donuts, each bound to its own dimension/measure pair; per-ring palettes and label controls.
- stacked_bar_matrix/
  - Stacked Bar Matrix – Grid of stacked bar charts, configurable legend location/formatting and value/percent labels.

## Common Requirements

- SAP Analytics Cloud tenant with Custom Widgets enabled.
- External CDN access for ECharts (cdnjs) or adapt to a hosted ECharts bundle.
- Data bindings: Each widget declares its own feeds (dimensions, measures) in `index.json`.

## Installation (Import into SAC)

1. Zip the files inside each widget folder (the 3 files: `index.json`, `main.js`, `styling.js`).
2. In SAC, go to Custom Widgets and import the ZIP.
3. Add the widget to a story and bind the required data feeds.
4. Open the Styling Panel to configure appearance and behavior.

Tip: If your environment doesn't have `zip`, use your OS archiving tool or PowerShell's `Compress-Archive`.

## Widgets Overview

### 1) Sunburst Chart (Advanced Tooltips) – `sunburst/`
- Data Binding: 1 hierarchical Dimension + 1 Measure.
- Key Features:
  - Tooltip fields array (label/key/prefix/suffix), reordering controls, header templates.
  - Number formatting (decimals, prefix/suffix), tooltip text/bg/border styles.
  - Optional synthetic root ("All") and color stops like the SAP sample.
- Styling Highlights:
  - All/Label/Drill-up Colors; Tooltip Settings; Tooltip Fields add/remove/reorder.

### 2) Field Matrix (Configurable) – `matrix_widget/`
- Data Binding: Dimensions + Measures.
- Key Features:
  - Grid size (rows × cols), per-cell mapping to a measure or dimension key (e.g., `measures_0`, `dimensions_0`).
  - Optional per-mapping filters; global numeric formatting; tooltips list multiple values.
  - Per-cell styles: font family/size/weight/style/color.
- Styling Highlights:
  - Editors for field mappings and per-cell styles; tooltip separator; show `*` for multi-values.

### 3) Multi Half Donut (up to 5 rings) – `multi_half_donut/`
- Data Binding: Dimensions + Measures.
- Key Features:
  - Up to 5 rings; each ring has its own dimension/measure, palette, and label toggles.
  - Global geometry (outer radius, thickness, spacing, centerY) and palette.
  - Global and per-ring value/percent formatting (decimals, prefix/suffix); percentage corrected for half chart (×2).
- Styling Highlights:
  - Ring editor with mapping/overrides; global format controls for values and percentages.

### 4) Stacked Bar Matrix – `stacked_bar_matrix/`
- Data Binding: Dimensions + Measures.
- Key Features:
  - Matrix of stacked bar charts; per-cell mapping (dimension index + measure indices).
  - Legend position (top/bottom/left/right), orientation, font size, color, item gap.
  - Spacing controls: chart–legend spacing and cell gap.
  - Labels: show values and/or percentages, with global formatting.
- Styling Highlights:
  - Cell config editor; legend and label format controls.


## Tools (Integrity generation)

A helper script is provided to generate Subresource Integrity (SRI) hashes for each widget’s `index.json` so SAC accepts the bundles in tenants that enforce integrity.

- Location: `sap_sac_custom_widgets/tools/generate_integrity.py`
- Purpose: computes SHA-256 SRI for each `webcomponents[].url` file and writes it to `webcomponents[].integrity`.
- It can also set `ignoreIntegrity=false` for “production” imports.

Usage:
- Dry run (preview changes):
  - `python3 sap_sac_custom_widgets/tools/generate_integrity.py --dry-run`
- Generate hashes (preserve ignore flags):
  - `python3 sap_sac_custom_widgets/tools/generate_integrity.py`
- Enforce production integrity (turn off ignoreIntegrity):
  - `python3 sap_sac_custom_widgets/tools/generate_integrity.py --enforce`
- Custom root (if you moved folders):
  - `python3 sap_sac_custom_widgets/tools/generate_integrity.py --root /path/to/widgets`

Notes:
- Script skips `dist`, `.git`, `node_modules`, `__pycache__`.
- Works with `url` (and older `src`) fields in `webcomponents`.

## License – PolyForm Noncommercial License 1.0.0

This work is licensed under the PolyForm Noncommercial License 1.0.0.

- You may use this software for noncommercial purposes only.
- Commercial use requires obtaining a separate commercial license from the author.
- Full license text: https://polyformproject.org/licenses/noncommercial/1.0.0/
- SPDX-Identifier: PolyForm-Noncommercial-1.0.0

By using or distributing this software, you agree to the terms of the PolyForm Noncommercial 1.0.0 license.

## Credits

- Based on and inspired by SAP Analytics Cloud community samples.
- Charting via ECharts (Apache-2.0). Consider hosting your own ECharts build for production.
