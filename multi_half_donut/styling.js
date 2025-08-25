(function(){
  const tpl = document.createElement('template');
  tpl.innerHTML = `
    <style>
      #root{ width:100%; height:100%; overflow:auto; }
      .row{ display:flex; gap:8px; margin:6px 0; }
      .row>div{ flex: 1; }
      input[type="text"], input[type="number"], select{ width:100%; box-sizing:border-box; }
      .list{ border:1px solid #ddd; padding:6px; }
      .item{ border:1px dashed #ccc; padding:6px; margin:4px 0; }
    </style>
    <div id="root">
      <div class="row">
        <div><label>Outer Radius (%)</label><input id="outerRadius" type="number" value="70" min="10" max="90"/></div>
        <div><label>Thickness (%)</label><input id="thickness" type="number" value="14" min="2" max="40"/></div>
        <div><label>Spacing (%)</label><input id="spacing" type="number" value="4" min="0" max="20"/></div>
        <div><label>Center Y (%)</label><input id="centerY" type="number" value="70" min="50" max="90"/></div>
      </div>
      <div class="row">
        <div><label>Value Decimals</label><input id="valueDecimals" type="number" value="0" min="0" max="6"/></div>
        <div><label>Value Prefix</label><input id="valuePrefix" type="text" value=""/></div>
        <div><label>Value Suffix</label><input id="valueSuffix" type="text" value=""/></div>
      </div>
      <div class="row">
        <div><label>Percent Decimals</label><input id="percentDecimals" type="number" value="1" min="0" max="6"/></div>
        <div><label>Percent Suffix</label><input id="percentSuffix" type="text" value="%"/></div>
      </div>

      <h4>Global Palette</h4>
      <div class="row">
        <div><input class="palette" type="color" value="#0070F2"/></div>
        <div><input class="palette" type="color" value="#4CB1FF"/></div>
        <div><input class="palette" type="color" value="#A6E0FF"/></div>
        <div><input class="palette" type="color" value="#D2EFFF"/></div>
        <div><input class="palette" type="color" value="#0057D2"/></div>
      </div>

      <h4>Rings (up to 5)</h4>
      <div id="rings" class="list"></div>
      <button id="addRing">Add Ring</button>

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

      this._rings = this._shadowRoot.getElementById('rings');
      this._shadowRoot.getElementById('addRing').addEventListener('click', () => this._addRing());
      this._shadowRoot.getElementById('apply').addEventListener('click', () => this._apply());
    }

    _addRing(r){
      if(this._rings.children.length>=5) return;
      const div = document.createElement('div');
      div.className = 'item';
      div.innerHTML = `
        <div class="row">
          <div><label>Name</label><input class="name" type="text" placeholder="Ring name"/></div>
          <div><label>Dimension Index</label><input class="dimIdx" type="number" min="0" value="0"/></div>
          <div><label>Measure Index</label><input class="meaIdx" type="number" min="0" value="0"/></div>
        </div>
        <div class="row">
          <div><label>Show Labels</label><select class="showLabels"><option value="true">Yes</option><option value="false">No</option></select></div>
          <div><label>Show Values</label><select class="showValues"><option value="true">Yes</option><option value="false">No</option></select></div>
          <div><label>Show %</label><select class="showPercents"><option value="true">Yes</option><option value="false">No</option></select></div>
        </div>
        <div class="row">
          <div><label>Palette (comma separated hex)</label><input class="palette" type="text" placeholder="#0070F2,#4CB1FF"/></div>
          <div><label>Outer Radius (%)</label><input class="outerRadius" type="number" value="" placeholder="optional override"/></div>
          <div><label>Thickness (%)</label><input class="thickness" type="number" value="" placeholder="optional override"/></div>
        </div>`;
      if(r){
        div.querySelector('.name').value = r.name||'';
        div.querySelector('.dimIdx').value = r.dimensionIndex||0;
        div.querySelector('.meaIdx').value = r.measureIndex||0;
        div.querySelector('.showLabels').value = String(!!r.showLabels);
        div.querySelector('.showValues').value = String(!!r.showValues);
        div.querySelector('.showPercents').value = String(!!r.showPercents);
        div.querySelector('.palette').value = (Array.isArray(r.palette)? r.palette.join(',') : (r.palette||''));
        if(r.outerRadius!==undefined) div.querySelector('.outerRadius').value = r.outerRadius;
        if(r.thickness!==undefined) div.querySelector('.thickness').value = r.thickness;
      }
      this._rings.appendChild(div);
    }

    _apply(){
      const outerRadius = Number(this._shadowRoot.getElementById('outerRadius').value)||70;
      const thickness   = Number(this._shadowRoot.getElementById('thickness').value)||14;
      const spacing     = Number(this._shadowRoot.getElementById('spacing').value)||4;
      const centerY     = Number(this._shadowRoot.getElementById('centerY').value)||70;

      const valueDecimals = Number(this._shadowRoot.getElementById('valueDecimals').value)||0;
      const valuePrefix   = this._shadowRoot.getElementById('valuePrefix').value||'';
      const valueSuffix   = this._shadowRoot.getElementById('valueSuffix').value||'';
      const percentDecimals = Number(this._shadowRoot.getElementById('percentDecimals').value)||1;
      const percentSuffix   = this._shadowRoot.getElementById('percentSuffix').value||'%';

      const globalPalette = Array.from(this._shadowRoot.querySelectorAll('.palette')).map(i => i.value).filter(Boolean);

      const rings = Array.from(this._rings.children).map(div => ({
        name: div.querySelector('.name').value,
        dimensionIndex: Number(div.querySelector('.dimIdx').value)||0,
        measureIndex: Number(div.querySelector('.meaIdx').value)||0,
        showLabels: div.querySelector('.showLabels').value==='true',
        showValues: div.querySelector('.showValues').value==='true',
        showPercents: div.querySelector('.showPercents').value==='true',
        palette: (div.querySelector('.palette').value||'').split(',').map(s=>s.trim()).filter(Boolean),
        outerRadius: (div.querySelector('.outerRadius').value || undefined) && Number(div.querySelector('.outerRadius').value),
        thickness: (div.querySelector('.thickness').value || undefined) && Number(div.querySelector('.thickness').value)
      }));

      this.dispatchEvent(new CustomEvent('propertiesChanged', { detail: { properties: {
        outerRadius, thickness, spacing, centerY,
        valueDecimals, valuePrefix, valueSuffix,
        percentDecimals, percentSuffix,
        globalPalette,
        rings: JSON.stringify(rings)
      }}}));
    }

    async onCustomWidgetAfterUpdate(changedProps){
      // Optional: populate styling UI from model if needed
    }
  }

  customElements.define('com-example-multi-halfdonut-styling', Styling);
})();
