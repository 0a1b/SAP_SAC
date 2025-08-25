(function(){
  const tpl = document.createElement('template');
  tpl.innerHTML = `
    <style>
      #root{ width:100%; height:100%; overflow:auto; }
      .row{ display:flex; gap:8px; margin:6px 0; }
      .row>div{ flex:1; }
      input[type="text"], input[type="number"], select { width:100%; box-sizing:border-box; }
      .list{ border:1px solid #ddd; padding:6px; }
      .item{ border:1px dashed #ccc; padding:6px; margin:4px 0; }
    </style>
    <div id="root">
      <div class="row">
        <div><label>Rows</label><input id="rows" type="number" value="2" min="1"/></div>
        <div><label>Cols</label><input id="cols" type="number" value="2" min="1"/></div>
        <div><label>Cell Gap (px)</label><input id="cellGap" type="number" value="12" min="0"/></div>
      </div>

      <div class="row">
        <div><label>Legend Position</label><select id="legendPosition"><option value="bottom">bottom</option><option value="top">top</option><option value="left">left</option><option value="right">right</option></select></div>
        <div><label>Legend Orientation</label><select id="legendOrient"><option value="horizontal">horizontal</option><option value="vertical">vertical</option></select></div>
        <div><label>Legend Font Size</label><input id="legendFontSize" type="number" value="12" min="8" max="36"/></div>
      </div>
      <div class="row">
        <div><label>Legend Color</label><input id="legendColor" type="color" value="#333333"/></div>
        <div><label>Legend Item Gap</label><input id="legendItemGap" type="number" value="10" min="0"/></div>
        <div><label>Chart-Legend Spacing</label><input id="chartLegendSpacing" type="number" value="24" min="0"/></div>
      </div>

      <div class="row">
        <div><label>Show Values</label><select id="showValues"><option value="true">Yes</option><option value="false">No</option></select></div>
        <div><label>Show Percent</label><select id="showPercents"><option value="false">No</option><option value="true">Yes</option></select></div>
        <div><label>Value Decimals</label><input id="valueDecimals" type="number" value="0" min="0" max="6"/></div>
      </div>
      <div class="row">
        <div><label>Value Prefix</label><input id="valuePrefix" type="text" value=""/></div>
        <div><label>Value Suffix</label><input id="valueSuffix" type="text" value=""/></div>
        <div><label>Percent Decimals</label><input id="percentDecimals" type="number" value="1" min="0" max="6"/></div>
      </div>
      <div class="row">
        <div><label>Percent Suffix</label><input id="percentSuffix" type="text" value="%"/></div>
      </div>

      <h4>Cell Configs (index by left-to-right, top-to-bottom)</h4>
      <div id="cells" class="list"></div>
      <button id="addCell">Add Cell</button>

      <div>
        <button id="apply">Apply</button>
      </div>
    </div>
  `;

  class Styling extends HTMLElement{
    constructor(){
      super();
      this._shadowRoot = this.attachShadow({mode:'open'});
      this._shadowRoot.appendChild(tpl.content.cloneNode(true));
      this._root = this._shadowRoot.getElementById('root');

      this._cells = this._shadowRoot.getElementById('cells');
      this._shadowRoot.getElementById('addCell').addEventListener('click', () => this._addCell());
      this._shadowRoot.getElementById('apply').addEventListener('click', () => this._apply());
    }

    _addCell(c){
      const div = document.createElement('div');
      div.className='item';
      div.innerHTML = `
        <div class="row">
          <div><label>Index</label><input class="idx" type="number" min="0" value="0"/></div>
          <div><label>Dimension Index</label><input class="dimIdx" type="number" min="0" value="0"/></div>
          <div><label>Measure Indices (comma)</label><input class="meaIdx" type="text" value="0,1"/></div>
        </div>`;
      if(c){
        div.querySelector('.idx').value = c.index||0;
        div.querySelector('.dimIdx').value = c.dimensionIndex||0;
        div.querySelector('.meaIdx').value = (Array.isArray(c.measureIndices)? c.measureIndices.join(',') : c.measureIndices||'0,1');
      }
      this._cells.appendChild(div);
    }

    _apply(){
      const rows = Number(this._shadowRoot.getElementById('rows').value)||2;
      const cols = Number(this._shadowRoot.getElementById('cols').value)||2;
      const cellGap = Number(this._shadowRoot.getElementById('cellGap').value)||12;

      const legendPosition = this._shadowRoot.getElementById('legendPosition').value;
      const legendOrient = this._shadowRoot.getElementById('legendOrient').value;
      const legendFontSize = Number(this._shadowRoot.getElementById('legendFontSize').value)||12;
      const legendColor = this._shadowRoot.getElementById('legendColor').value||'#333333';
      const legendItemGap = Number(this._shadowRoot.getElementById('legendItemGap').value)||10;
      const chartLegendSpacing = Number(this._shadowRoot.getElementById('chartLegendSpacing').value)||24;

      const showValues = this._shadowRoot.getElementById('showValues').value==='true';
      const showPercents = this._shadowRoot.getElementById('showPercents').value==='true';
      const valueDecimals = Number(this._shadowRoot.getElementById('valueDecimals').value)||0;
      const valuePrefix = this._shadowRoot.getElementById('valuePrefix').value||'';
      const valueSuffix = this._shadowRoot.getElementById('valueSuffix').value||'';
      const percentDecimals = Number(this._shadowRoot.getElementById('percentDecimals').value)||1;
      const percentSuffix = this._shadowRoot.getElementById('percentSuffix').value||'%';

      const cells = Array.from(this._cells.children).map(div => ({
        index: Number(div.querySelector('.idx').value)||0,
        dimensionIndex: Number(div.querySelector('.dimIdx').value)||0,
        measureIndices: (div.querySelector('.meaIdx').value||'0,1').split(',').map(s=>Number(s.trim()||'0')).filter(n=>!Number.isNaN(n))
      }));
      const size = rows*cols; const cellConfigs = Array(size).fill(null);
      cells.forEach(c=>{ if(c.index>=0 && c.index<size) cellConfigs[c.index] = {dimensionIndex:c.dimensionIndex, measureIndices:c.measureIndices}; });

      this.dispatchEvent(new CustomEvent('propertiesChanged', { detail: { properties: {
        rows, cols, cellGap,
        legendPosition, legendOrient, legendFontSize, legendColor, legendItemGap, chartLegendSpacing,
        showValues, showPercents, valueDecimals, valuePrefix, valueSuffix, percentDecimals, percentSuffix,
        cellConfigs: JSON.stringify(cellConfigs)
      }}}));
    }
  }

  customElements.define('com-example-stacked-bar-matrix-styling', Styling);
})();
