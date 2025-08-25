# Field Matrix (Configurable)

A SAC custom widget that shows a configurable rows×columns grid of fields (dimensions or KPIs) with per-cell styles and tooltips for multi-values.

Import-ready ZIP: see ../../dist/matrix_field_grid.zip

## Data Binding
- Dimensions feed
- Measures feed

## Properties (index.json)
- rows, cols: grid size (default 2×3)
- fieldMappings (string JSON): Array sized rows*cols, each item is {type:'measure'|'dimension', key:'measures_0'|'dimensions_0', filter?}
- cellStyles (string JSON): Array sized rows*cols, each item is {fontFamily, fontSize, fontWeight, fontStyle, color}
- filters (string JSON): Global filter array [{key, op:'eq'|'in', value}]
- decimals, prefix, suffix: global numeric formatting
- tooltipSeparator: string between values in tooltip
- showAsteriskMultiple: show * when multiple results exist

## Styling Panel (styling.js)
- Grid size and numeric formatting
- Tooltip separator and asterisk toggle
- Field Mappings editor: index, type, key, optional filter
- Cell Styles editor: per-index fonts and colors

## Behavior (main.js)
- Resolves each cell’s field over filtered dataset rows
- If multiple distinct values exist: shows first value + asterisk; tooltip lists all
- Per-cell style overrides

## Install
1) Import ZIP in SAC (Custom Widgets)
2) Add widget to a story, bind appropriate dimensions/measures
3) Configure mappings/styles in the Styling Panel
