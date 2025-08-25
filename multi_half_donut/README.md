# Multi Half Donut (up to 5 rings)

A SAC custom widget that renders up to 5 concentric half-donut rings, each bound to a dimension/measure pair, with per-ring palettes and label options.

Import-ready ZIP: see ../../dist/multi_half_donut.zip

## Data Binding
- myDataSource: dimensions feed + measures feed

## Properties (index.json)
- outerRadius (integer%): default outer radius for outermost ring
- thickness (integer%): default ring thickness
- spacing (integer%): gap between rings
- centerY (integer%): vertical center
- globalPalette (string[]): default colors
- rings (string JSON): array with up to 5 entries:
  - name: string
  - dimensionIndex: integer (index in dimensions feed)
  - measureIndex: integer (index in measures feed)
  - showLabels, showValues, showPercents: booleans
  - palette: [hex,...] optional per-ring palette
  - outerRadius, thickness: optional overrides per ring

## Styling Panel (styling.js)
- Geometry: outer radius, thickness, spacing, center Y
- Global palette (5 colors)
- Ring editor (up to 5): mapping + display options + per-ring overrides

## Behavior (main.js)
- Each ring is a half-donut (top 180°)
- Percentages corrected for 180° (percent×2)
- Tooltip shows series/name/value and corrected %
- Per-ring palette overrides global palette

## Install
1) Import ZIP in SAC (Custom Widgets)
2) Add widget to a story, bind dimensions/measures
3) Configure rings in the Styling Panel
