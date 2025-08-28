(function(){
  const tpl = document.createElement('template');
  tpl.innerHTML = `
    <style>
      #root{ width:100%; height:100%; overflow:auto; }
      .row{ display:flex; gap:8px; margin:6px 0; flex-wrap: wrap; }
      .row>div{ flex: 1 1 200px; min-width: 180px; }
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

      <div class="row">
        <div><label>Use Theme Palette</label><select id="useThemePalette"><option value="false">No</option><option value="true">Yes</option></select></div>
        <div><label>Independent Rings</label><select id="independentRings"><option value="true">Yes</option><option value="false">No</option></select></div>
        <div><label>Label Position</label><select id="labelPosition"><option value="outside">outside</option><option value="inside">inside</option><option value="center">center</option><option value="none">none</option></select></div>
        <div><label>Label Font Size</label><input id="labelFontSize" type="number" value="12" min="8" max="36"/></div>
      </div>
      <h4>Global Palette</h4>
      <div class="row themePalette" style="display:flex; gap:8px; align-items:center">
        <span>Theme colors will be used if enabled.</span>
      </div>
      <div class="row customPalette">
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
      this._shadowRoot.getElementById('apply').addEventListener('click', () => { this._apply(); });
      // Add a quick metadata refresh if dropdowns are empty
      const metaRefresh = document.createElement('button');
      metaRefresh.textContent = 'Refresh Dimension/Measure Names';
      metaRefresh.addEventListener('click', ()=> this._populateAllDropdowns());
      this._root.insertBefore(metaRefresh, this._root.firstChild.nextSibling);
      // Auto-apply geometry/format changes for quicker feedback
      ['outerRadius','thickness','spacing','centerY','valueDecimals','valuePrefix','valueSuffix','percentDecimals','percentSuffix']
        .forEach(id => {
          const el = this._shadowRoot.getElementById(id);
          if(el) el.addEventListener('change', () => this._apply());
        });
    }

    _populateDropdown(div){
      try{
        // Prefer names provided via widget properties (reliable); fallback to global var
        const dimNames = (this.dimensionNames && this.dimensionNames.length? this.dimensionNames: ((window.__com_example_multi_halfdonut_meta && window.__com_example_multi_halfdonut_meta.dimNames)||[]));
        const meaNames = (this.measureNames && this.measureNames.length? this.measureNames: ((window.__com_example_multi_halfdonut_meta && window.__com_example_multi_halfdonut_meta.meaNames)||[]));
        const dSel = div.querySelector('.dimName');
        const mSel = div.querySelector('.meaName');
        if(dSel && !dSel.options.length){ dimNames.forEach(n => { const o=document.createElement('option'); o.value=n; o.textContent=n; dSel.appendChild(o); }); }
        if(mSel && !mSel.options.length){ meaNames.forEach(n => { const o=document.createElement('option'); o.value=n; o.textContent=n; mSel.appendChild(o); }); }
      }catch(e){}
    }

    _populateAllDropdowns(){
      Array.from(this._rings.children).forEach(div => this._populateDropdown(div));
    }

    _addRing(r){
      if(this._rings.children.length>=5) return;
      const div = document.createElement('div');
      div.className = 'item';
      div.innerHTML = `
        <div class="row">
          <div><label>Name</label><input class="name" type="text" placeholder="Ring name"/></div>
          <div><label>Dimension</label><select class="dimName"></select></div>
          <div><label>Measure</label><select class="meaName"></select></div>
          <div><label>Aggregation</label><select class="agg"><option value="sum">sum</option><option value="avg">avg</option><option value="min">min</option><option value="max">max</option></select></div>
        </div>
        <div class="row">
          <div><label>Show Labels</label><select class="showLabels"><option value="false" selected>No</option><option value="true">Yes</option></select></div>
          <div><label>Show Values</label><select class="showValues"><option value="false" selected>No</option><option value="true">Yes</option></select></div>
          <div><label>Show %</label><select class="showPercents"><option value="false" selected>No</option><option value="true">Yes</option></select></div>
        </div>
        <div class="row">
          <div>
            <label>Ring Palette</label>
            <div class="row palRow">
              <input class="pal" type="color" value="#0070F2"/>
              <input class="pal" type="color" value="#4CB1FF"/>
              <input class="pal" type="color" value="#A6E0FF"/>
              <input class="pal" type="color" value="#D2EFFF"/>
              <input class="pal" type="color" value="#0057D2"/>
            </div>
          </div>
          <div><label>Outer Radius (%)</label><input class="outerRadius" type="number" value="" placeholder="optional override"/></div>
          <div><label>Thickness (%)</label><input class="thickness" type="number" value="" placeholder="optional override"/></div>
        </div>
        <div class="row"><button class="removeRing">Remove Ring</button></div>`;
      // Populate name dropdowns from global meta (best-effort)
      try{
        const meta = window.__com_example_multi_halfdonut_meta || {};
        const dSel = div.querySelector('.dimName');
        const mSel = div.querySelector('.meaName');
        (meta.dimNames||[]).forEach(n => { const o=document.createElement('option'); o.value=n; o.textContent=n; dSel.appendChild(o); });
        (meta.meaNames||[]).forEach(n => { const o=document.createElement('option'); o.value=n; o.textContent=n; mSel.appendChild(o); });
      }catch(e){}

      if(r){
        div.querySelector('.name').value = r.name||'';
        if(r.dimensionName){ const el=div.querySelector('.dimName'); if(el) el.value = r.dimensionName; }
        if(r.measureName){ const el=div.querySelector('.meaName'); if(el) el.value = r.measureName; }
        div.querySelector('.showLabels').value = String(!!r.showLabels);
        div.querySelector('.showValues').value = String(!!r.showValues);
        div.querySelector('.showPercents').value = String(!!r.showPercents);
        if(Array.isArray(r.palette)){
          const pals = div.querySelectorAll('.pal');
          r.palette.slice(0, pals.length).forEach((c, i)=> pals[i].value = c);
        }
        if(r.outerRadius!==undefined) div.querySelector('.outerRadius').value = r.outerRadius;
        if(r.thickness!==undefined) div.querySelector('.thickness').value = r.thickness;
        if(r.agg) div.querySelector('.agg').value = r.agg;
      }
      div.querySelector('.removeRing').addEventListener('click', ()=> div.remove());
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

      const useThemePalette = this._shadowRoot.getElementById('useThemePalette').value==='true';
      const independentRings = this._shadowRoot.getElementById('independentRings').value==='true';
      const labelPosition = this._shadowRoot.getElementById('labelPosition').value;
      const labelFontSize = Number(this._shadowRoot.getElementById('labelFontSize').value)||12;
      const globalPalette = Array.from(this._shadowRoot.querySelectorAll('.customPalette .palette')).map(i => i.value).filter(Boolean);

      const rings = Array.from(this._rings.children).map(div => ({
        name: div.querySelector('.name').value,
        dimensionName: (div.querySelector('.dimName') && div.querySelector('.dimName').value) || undefined,
        measureName: (div.querySelector('.meaName') && div.querySelector('.meaName').value) || undefined,
        showLabels: div.querySelector('.showLabels').value==='true',
        showValues: div.querySelector('.showValues').value==='true',
        showPercents: div.querySelector('.showPercents').value==='true',
        palette: Array.from(div.querySelectorAll('.pal')).map(i=>i.value).filter(Boolean),
        outerRadius: (div.querySelector('.outerRadius').value || undefined) && Number(div.querySelector('.outerRadius').value),
        thickness: (div.querySelector('.thickness').value || undefined) && Number(div.querySelector('.thickness').value),
        agg: (div.querySelector('.agg') && div.querySelector('.agg').value) || undefined
      }));

      this.dispatchEvent(new CustomEvent('propertiesChanged', { detail: { properties: {
        outerRadius, thickness, spacing, centerY,
        valueDecimals, valuePrefix, valueSuffix,
        percentDecimals, percentSuffix,
        globalPalette,
        useThemePalette, independentRings,
        labelPosition, labelFontSize,
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
