# Sunburst Chart (Advanced Tooltips)

A SAC custom widget based on the SAP sample "Sunbrust Chart with Styling Panel", extended with a highly configurable tooltip system.

Import-ready ZIP: see ../../dist/sunburst_advanced_tooltips.zip

## Data Binding
- One hierarchical Dimension (dimensions feed)
- One Measure (measures feed)

## Properties (index.json)
- drillUpArea (string): Color for drill-up area
- stops (string[]): 5 color stops for levels
- showAll (boolean): Add a synthetic super-root ("All")
- labelAll (string): Label for the super-root
- tooltipConfig (string JSON): Tooltip configuration object

## Styling Panel (styling.js)
- All / Label / Drill Up Area / Colors (as in original sample)
- Tooltip Settings:
  - decimals, separator (HTML), prefix, suffix
  - headerTemplate (supports ${name})
  - textColor, bgColor, borderColor, borderWidth
  - fields[]: list of {label, key, prefix, suffix}

## Behavior (main.js)
- ECharts 5 sunburst
- Tooltip formatter builds HTML from tooltipConfig
- Correctly formats numeric values with decimals, prefix/suffix
- Fields can reference "value" or any data property key

## Install
1) Import ZIP in SAC (Custom Widgets)
2) Add widget to a story, bind one dimension+measure
3) Configure tooltip in the Styling Panel
