(function () {
  let template = document.createElement("template");
  template.innerHTML = `
    <style>
    #root div { margin: 0.5rem; }
    #root .title { font-weight: bold; }
    input[type="text"], input[type="number"] { width: 100%; box-sizing: border-box; }
    .row { display: flex; gap: 0.5rem; }
    .row > div { flex: 1; }
    </style>
    <div id="root" style="width: 100%; height: 100%; overflow:auto;">
      <div class="title">All</div>
      <div>
          <input id="showAll" type="checkbox" checked /><label for="reverse">Show</label>
      </div>

      <div class="title">Label</div>
      <div>
          <input id="labelAll" type="text" value="All" />
      </div>
      <div class="title">Drill Up Area</div>
      <div>
          <input id="drillUpArea" type="color" value="#ffffff" />
      </div>
      <div class="title">Colors</div>
      <div class="row">
          <input id="stop0" type="color" value="#c04851" />
          <input id="stop1" type="color" value="#ed5a65" />
          <input id="stop2" type="color" value="#f07c82" />
          <input id="stop3" type="color" value="#eea2a4" />
          <input id="stop4" type="color" value="#ee3f4d" />
      </div>

      <div class="title">Tooltip Settings</div>
      <div class="row">
        <div><label>Decimals</label><input id="tt_decimals" type="number" value="0" min="0" max="6"/></div>
        <div><label>Separator (HTML)</label><input id="tt_separator" type="text" value="<br/>"/></div>
      </div>
      <div class="row">
        <div><label>Prefix</label><input id="tt_prefix" type="text" value=""/></div>
        <div><label>Suffix</label><input id="tt_suffix" type="text" value=""/></div>
      </div>
      <div class="row">
        <div><label>Header Template</label><input id="tt_header" type="text" value="${name}"/></div>
      </div>
      <div class="row">
        <div><label>Text Color</label><input id="tt_textColor" type="color" value="#ffffff"/></div>
        <div><label>Background</label><input id="tt_bgColor" type="color" value="#323232"/></div>
        <div><label>Border</label><input id="tt_borderColor" type="color" value="#333333"/></div>
      </div>
      <div class="row">
        <div><label>Border Width</label><input id="tt_borderWidth" type="number" value="1" min="0" max="10"/></div>
      </div>

      <div class="title">Tooltip Fields</div>
      <div id="fields" style="min-height:8px;border:1px dashed #ccc;padding:4px"></div>
      <div class="row"><button id="addField">Add Field</button><button id="up">Move Up</button><button id="down">Move Down</button></div>

      <div>
        <button id="button">Apply</button>
      </div>
    </div>
  `;

  class Styling extends HTMLElement {
    constructor() {
      super();
      this._shadowRoot = this.attachShadow({ mode: "open" });
      this._shadowRoot.appendChild(template.content.cloneNode(true));
      this._root = this._shadowRoot.getElementById("root");

      this._fieldsContainer = this._shadowRoot.getElementById("fields");
      this._shadowRoot.getElementById("addField").addEventListener("click", () => this._addField());
      this._shadowRoot.getElementById("up").addEventListener("click", () => this._move(-1));
      this._shadowRoot.getElementById("down").addEventListener("click", () => this._move(1));

      this._button = this._shadowRoot.getElementById("button");
      this._button.addEventListener("click", () => this._apply());
    }

    _addField(field) {
      const wrapper = document.createElement("div");
      wrapper.className = "row item";
      wrapper.innerHTML = `
        <div><label>Label</label><input class="f_label" type="text" value="${(field && field.label) || 'Value'}"/></div>
        <div><label>Key</label><input class="f_key" type="text" value="${(field && field.key) || 'value'}"/></div>
        <div><label>Prefix</label><input class="f_prefix" type="text" value="${(field && field.prefix) || ''}"/></div>
        <div><label>Suffix</label><input class="f_suffix" type="text" value="${(field && field.suffix) || ''}"/></div>
        <div><button class="remove">Remove</button></div>
      `;
      wrapper.querySelector(".remove").addEventListener("click", () => wrapper.remove());
      this._fieldsContainer.appendChild(wrapper);
    }

    _move(dir){
      const items = Array.from(this._fieldsContainer.querySelectorAll('.item'));
      if(items.length<2) return;
      const last = items[items.length-1]; // move last item for quick demo
      const idx = items.indexOf(last);
      const target = idx + dir;
      if(target<0 || target>=items.length) return;
      const ref = dir>0 ? items[target].nextSibling : items[target];
      this._fieldsContainer.insertBefore(last, ref);
    }

    _apply() {
      const drillUpArea = this._shadowRoot.getElementById("drillUpArea").value;
      const stops = [
        this._shadowRoot.getElementById("stop0").value,
        this._shadowRoot.getElementById("stop1").value,
        this._shadowRoot.getElementById("stop2").value,
        this._shadowRoot.getElementById("stop3").value,
        this._shadowRoot.getElementById("stop4").value,
      ];
      const showAll = this._shadowRoot.getElementById("showAll").checked;
      const labelAll = this._shadowRoot.getElementById("labelAll").value;

      const tooltipConfig = {
        decimals: Number(this._shadowRoot.getElementById("tt_decimals").value) || 0,
        separator: this._shadowRoot.getElementById("tt_separator").value || "<br/>",
        prefix: this._shadowRoot.getElementById("tt_prefix").value || "",
        suffix: this._shadowRoot.getElementById("tt_suffix").value || "",
        headerTemplate: this._shadowRoot.getElementById("tt_header").value || "${name}",
        textColor: this._shadowRoot.getElementById("tt_textColor").value || "#ffffff",
        bgColor: this._shadowRoot.getElementById("tt_bgColor").value || "#323232",
        borderColor: this._shadowRoot.getElementById("tt_borderColor").value || "#333333",
        borderWidth: Number(this._shadowRoot.getElementById("tt_borderWidth").value) || 1,
        fields: Array.from(this._fieldsContainer.children).map(row => ({
          label: row.querySelector('.f_label').value,
          key: row.querySelector('.f_key').value,
          prefix: row.querySelector('.f_prefix').value,
          suffix: row.querySelector('.f_suffix').value,
        }))
      };

      this.dispatchEvent(
        new CustomEvent("propertiesChanged", {
          detail: { properties: { drillUpArea, stops, showAll, labelAll, tooltipConfig } },
        })
      );
    }

    async onCustomWidgetAfterUpdate(changedProps) {
      const p = changedProps || {};
      if (p.drillUpArea) this._shadowRoot.getElementById("drillUpArea").value = p.drillUpArea;
      if (p.stops) {
        this._shadowRoot.getElementById("stop0").value = p.stops[0];
        this._shadowRoot.getElementById("stop1").value = p.stops[1];
        this._shadowRoot.getElementById("stop2").value = p.stops[2];
        this._shadowRoot.getElementById("stop3").value = p.stops[3];
        this._shadowRoot.getElementById("stop4").value = p.stops[4];
      }
      if (p.showAll !== undefined) this._shadowRoot.getElementById("showAll").checked = p.showAll;
      if (p.labelAll !== undefined) this._shadowRoot.getElementById("labelAll").value = p.labelAll;

      const cfg = p.tooltipConfig || {};
      if (cfg.decimals !== undefined) this._shadowRoot.getElementById("tt_decimals").value = cfg.decimals;
      if (cfg.separator !== undefined) this._shadowRoot.getElementById("tt_separator").value = cfg.separator;
      if (cfg.prefix !== undefined) this._shadowRoot.getElementById("tt_prefix").value = cfg.prefix;
      if (cfg.suffix !== undefined) this._shadowRoot.getElementById("tt_suffix").value = cfg.suffix;
      if (cfg.headerTemplate !== undefined) this._shadowRoot.getElementById("tt_header").value = cfg.headerTemplate;
      if (cfg.textColor !== undefined) this._shadowRoot.getElementById("tt_textColor").value = cfg.textColor;
      if (cfg.bgColor !== undefined) this._shadowRoot.getElementById("tt_bgColor").value = cfg.bgColor;
      if (cfg.borderColor !== undefined) this._shadowRoot.getElementById("tt_borderColor").value = cfg.borderColor;
      if (cfg.borderWidth !== undefined) this._shadowRoot.getElementById("tt_borderWidth").value = cfg.borderWidth;

      if (Array.isArray(cfg.fields)) {
        this._fieldsContainer.innerHTML = '';
        cfg.fields.forEach(f => this._addField(f));
      }
    }

    async onCustomWidgetBeforeUpdate(changedProps) {}
    async onCustomWidgetResize(width, height) {}
    async onCustomWidgetDestroy() {}
  }

  customElements.define("com-example-sunburst-advanced-tooltips-styling", Styling);
})();
