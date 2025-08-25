# SAC Custom Widget: Sunburst Chart with Advanced Tooltips

This package extends the SAP Analytics Cloud (SAC) "Sunburst Chart with Styling Panel" custom widget by adding a highly customizable tooltip system inspired by the "Widget Add-on Sample" tooltip implementation.

## Contents
- sunburst/ (base widget copied from SAP samples)
- addon-tooltips/ (tooltip module adapted from add-on sample)

## Features
- Configurable tooltip templates (text, HTML)
- Metric/value formatting (decimals, prefixes/suffixes)
- Conditional coloring and rules
- Show/hide fields, reorder fields
- Multi-line and custom separator support
- Styling panel bindings to control tooltip behavior per-widget

## How to use in SAC
1. Import the widget package (index.json + assets) via Custom Widgets.
2. Add the Sunburst widget to your story.
3. Configure tooltip settings in the Styling Panel.

## Development
- Source from SAP samples:
  - Sunburst base: SAC_Custom_Widgets/Sunbrust Chart with Styling Panel
  - Tooltip sample: SAC_Custom_Widgets/Widget Add-on Sample/widget-add-on-js-samples-master_without_icon_map/dist
- This package merges those concepts into a single, easy-to-import custom widget.

This project is licensed under the PolyForm Noncommercial License 1.0.0.

✅ Free for personal and noncommercial use.

❌ Commercial use is not permitted without prior written consent from the author.

See the full license text here: [PolyForm Noncommercial License 1.0.0](https://polyformproject.org/licenses/noncommercial/1.0.0/)
