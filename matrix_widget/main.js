(function(){
  const template = document.createElement('template');
  template.innerHTML = `
    <style>
      :host { display:block; }
      #root { width:100%; height:100%; overflow:auto; }
      .grid { display:grid; gap: 4px; width:100%; height:100%; }
      .cell { border: 1px solid #ddd; padding: 6px; display:flex; align-items:center; justify-content:center; position:relative; }
      .cell .asterisk { position:absolute; top:2px; right:4px; color:#888; font-size: 0.9em; }
      .cell[title] { cursor: help; }
    </style>
    <div id="root">
      <div id="grid" class="grid"></div>
    </div>
  `;

  function parseMetadata(metadata){
    const { dimensions: dimensionsMap, mainStructureMembers: measuresMap } = metadata;
    const dimensions = [], measures = [];
    for(const key in dimensionsMap){ dimensions.push({ key, ...dimensionsMap[key]}); }
    for(const key in measuresMap){ measures.push({ key, ...measuresMap[key]}); }
    return { dimensions, measures };
  }

  class MatrixRenderer{
    constructor(root){ this._root = root; }

    render(dataBinding, rows, cols, fieldMappings, cellStyles, opts){
      const grid = this._root.querySelector('#grid');
      grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
      grid.style.gridTemplateRows = `repeat(${rows}, minmax(40px, auto))`;
      grid.innerHTML = '';
      const size = rows*cols;

      for(let i=0;i<size;i++){
        const field = fieldMappings[i];
        const style = (cellStyles && cellStyles[i]) || {};
        const el = document.createElement('div');
        el.className = 'cell';
        // Apply styles
        if(style.fontFamily) el.style.fontFamily = style.fontFamily;
        if(style.fontSize) el.style.fontSize = style.fontSize + 'px';
        if(style.fontWeight) el.style.fontWeight = style.fontWeight;
        if(style.fontStyle) el.style.fontStyle = style.fontStyle;
        if(style.color) el.style.color = style.color;

        if(!field){
          el.textContent = '';
          grid.appendChild(el);
          continue;
        }

        const { label, value, values } = field; // field is resolved before render
        let text = value !== undefined ? value : '';
        if(typeof text === 'number'){
          const decimals = isFinite(opts.decimals)? Number(opts.decimals): 0;
          text = Number(text).toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
        }
        if(opts.prefix) text = opts.prefix + text;
        if(opts.suffix) text = text + opts.suffix;

        if(values && values.length > 1 && opts.showAsteriskMultiple){
          const star = document.createElement('span');
          star.className = 'asterisk';
          star.textContent = '*';
          el.appendChild(star);
        }
        if(values && values.length>1){
          el.title = values.join(opts.tooltipSeparator||', ');
        }

        el.appendChild(document.createTextNode(text));
        grid.appendChild(el);
      }
    }
  }

  class Main extends HTMLElement{
    constructor(){
      super();
      this._shadowRoot = this.attachShadow({mode:'open'});
      this._shadowRoot.appendChild(template.content.cloneNode(true));
      this._root = this._shadowRoot.getElementById('root');
      this._grid = this._shadowRoot.getElementById('grid');
      this._renderer = new MatrixRenderer(this._root);
    }

    _resolveFields(dataBinding, rows, cols, mappings){
      // mappings: [{type:'measure'|'dimension', key:'measures_0', filter: {...}}]
      const { data, metadata, state } = dataBinding || {};
      if(state!== 'success') return Array(rows*cols).fill(null);
      const { dimensions, measures } = parseMetadata(metadata);

      // Apply filters - basic AND filter on row objects
      const filteredData = (this.filters && this.filters.length)
        ? data.filter(row => this.filters.every(f => {
            const v = row[f.key] && (row[f.key].label ?? row[f.key].raw);
            if(f.op === 'eq') return String(v) === String(f.value);
            if(f.op === 'in') return (Array.isArray(f.value) ? f.value : [f.value]).map(String).includes(String(v));
            return true;
          }))
        : data;

      const resolved = [];
      const size = rows*cols;
      for(let i=0;i<size;i++){
        const map = mappings[i];
        if(!map){ resolved.push(null); continue; }
        const key = map.key; // e.g., measures_0 or dimensions_0
        const values = filteredData.map(r => {
          const cell = r[key];
          return (cell && (cell.raw ?? cell.label))
        }).filter(v => v!==undefined);
        let value = undefined;
        if(values.length>0){
          const unique = Array.from(new Set(values.map(v => String(v))));
          if(unique.length===1){ value = values[0]; }
          else { value = values[0]; } // show first; asterisk indicates multiples
        }
        resolved.push({ label: key, value, values });
      }
      return resolved;
    }

    async onCustomWidgetAfterUpdate(){ this.render(); }
    async onCustomWidgetResize(){ this.render(); }
    async onCustomWidgetDestroy(){ this.dispose(); }

    dispose(){ /* nothing to dispose */ }

    render(){
      if(!document.contains(this)){ setTimeout(this.render.bind(this), 0); return; }
      const rows = Number(this.rows)||2, cols = Number(this.cols)||3;
      let mappings = [];
      try { mappings = JSON.parse(this.fieldMappings||'[]'); } catch(e) {}
      let styles = [];
      try { styles = JSON.parse(this.cellStyles||'[]'); } catch(e) {}
      let filters = [];
      try { this.filters = JSON.parse(this.filters||'[]'); } catch(e) { this.filters=[]; }

      const resolved = this._resolveFields(this.dataBinding, rows, cols, mappings);
      this._renderer.render(this.dataBinding, rows, cols, resolved, styles, {
        decimals: this.decimals,
        prefix: this.prefix,
        suffix: this.suffix,
        tooltipSeparator: this.tooltipSeparator,
        showAsteriskMultiple: this.showAsteriskMultiple
      });
    }
  }

  customElements.define('com-example-matrix-field-grid', Main);
})();
