var getScriptPromisify = (src) => {
  const __define = define;
  define = undefined;
  return new Promise((resolve) => {
    $.getScript(src, () => {
      define = __define;
      resolve();
    });
  });
};

(function () {
  const parseMetadata = (metadata) => {
    const { dimensions: dimensionsMap, mainStructureMembers: measuresMap } = metadata;
    const dimensions = [];
    for (const key in dimensionsMap) {
      const dimension = dimensionsMap[key];
      dimensions.push({ key, ...dimension });
    }
    const measures = [];
    for (const key in measuresMap) {
      const measure = measuresMap[key];
      measures.push({ key, ...measure });
    }
    return { dimensions, measures, dimensionsMap, measuresMap };
  };

  const appendSuperRoot = (data, labelAll) => {
    data = JSON.parse(JSON.stringify(data));
    const superRoot = {
      dimensions_0: { id: "superRoot", label: labelAll },
      measures_0: { raw: 0 },
    };
    data.forEach((data) => {
      if (data.dimensions_0.parentId) {
        return;
      }
      data.dimensions_0.parentId = "superRoot";
      superRoot.measures_0.raw += data.measures_0.raw;
    });
    return [superRoot].concat(data);
  };

  class Renderer {
    constructor(root) {
      this._root = root;
      this._echart = null;
    }

    async render(dataBinding, drillUpArea, stops, showAll, labelAll, tooltipConfig) {
      await getScriptPromisify("https://cdnjs.cloudflare.com/ajax/libs/echarts/5.0.0/echarts.min.js");
      this.dispose();
      if (dataBinding.state !== "success") {
        return;
      }

      let { data, metadata } = dataBinding;
      const { dimensions, measures } = parseMetadata(metadata);
      if (dimensions.length !== 1) {
        return;
      }

      const levels = [
        {
          itemStyle: { color: drillUpArea },
        },
      ];
      stops.forEach((stop) => {
        levels.push({
          itemStyle: { color: stop },
        });
      });
      const seriesData = [];
      if (showAll) {
        data = appendSuperRoot(data, labelAll);
      }
      data.forEach((row) => {
        const { id, label, parentId } = row[dimensions[0].key];
        const { raw } = row[measures[0].key];
        const dp = findDp(seriesData, id) || { id };
        dp.name = label;
        dp.value = raw;

        if (parentId) {
          const parent = findDp(seriesData, parentId);
          if (!parent) {
            console.error('Please check: "Include Parent Node"');
          }

          parent.dp.children = parent.dp.children || [];
          parent.dp.children.push(dp);
        } else {
          seriesData.push(dp);
        }
      });

      // ECharts tooltip formatter based on tooltipConfig
      const tooltipFormatter = (info) => {
        try {
          const data = info.data || {};
          const name = data.name ?? "";
          const value = data.value ?? 0;
          const parts = [];
          const cfg = tooltipConfig || {};
          const fmt = (v) => {
            const decimals = isFinite(cfg.decimals) ? Number(cfg.decimals) : 0;
            return Number(v).toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
          };
          // Header
          if (cfg.showHeader !== false) {
            const header = cfg.headerTemplate || "${name}";
            parts.push(header.replace(/\${name}/g, name));
          }
          // Body lines
          const fields = cfg.fields || [
            { label: "Value", key: "value", prefix: cfg.prefix || "", suffix: cfg.suffix || "" },
          ];
          fields.forEach((f) => {
            const rawVal = f.key === "value" ? value : data[f.key];
            if (rawVal === undefined) return;
            const line = `${f.label}: ${f.prefix || ""}${fmt(rawVal)}${f.suffix || ""}`;
            parts.push(line);
          });
          return parts.join(cfg.separator || "<br/>");
        } catch (e) {
          return info.name || "";
        }
      };

      this._echart = echarts.init(this._root);
      this._echart.setOption({
        tooltip: {
          show: true,
          trigger: "item",
          formatter: tooltipFormatter,
          backgroundColor: (tooltipConfig && tooltipConfig.bgColor) || "rgba(50,50,50,0.8)",
          textStyle: { color: (tooltipConfig && tooltipConfig.textColor) || "#fff" },
          borderColor: (tooltipConfig && tooltipConfig.borderColor) || "#333",
          borderWidth: (tooltipConfig && tooltipConfig.borderWidth) || 1,
        },
        series: {
          type: "sunburst",
          data: seriesData,
          levels,
          radius: [0, "90%"],
          label: {
            rotate: "radial",
          },
        },
      });
    }

    dispose() {
      if (this._echart) {
        echarts.dispose(this._echart);
      }
    }
  }

  const findDp = (seriesData, id, depth = 1) => {
    for (let i = 0; i < seriesData.length; i++) {
      const dp = seriesData[i];
      if (dp.id === id) {
        return { dp, depth };
      }
      if (dp.children) {
        const found = findDp(dp.children, id, depth + 1);
        if (found) {
          return found;
        }
      }
    }
  };

  const template = document.createElement("template");
  template.innerHTML = `
  <style>
      #chart { width: 100%; height: 100%; }
  </style>
  <div id="root" style="width: 100%; height: 100%;">
      <div id="chart"></div>
  </div>
  `;

  class Main extends HTMLElement {
    constructor() {
      super();
      this._shadowRoot = this.attachShadow({ mode: "open" });
      this._shadowRoot.appendChild(template.content.cloneNode(true));
      this._root = this._shadowRoot.getElementById("root");
      this._renderer = new Renderer(this._root);
    }

    async onCustomWidgetBeforeUpdate(changedProps) {}

    async onCustomWidgetAfterUpdate(changedProps) {
      this.render();
    }

    async onCustomWidgetResize(width, height) {
      this.render();
    }

    async onCustomWidgetDestroy() {
      this.dispose();
    }

    dispose() {
      this._renderer.dispose();
    }

    render() {
      if (!document.contains(this)) {
        setTimeout(this.render.bind(this), 0);
        return;
      }
      this._renderer.render(
        this.dataBinding,
        this.drillUpArea,
        this.stops,
        this.showAll,
        this.labelAll,
        this.tooltipConfig || {}
      );
    }
  }

  customElements.define("com-example-sunburst-advanced-tooltips", Main);
})();
