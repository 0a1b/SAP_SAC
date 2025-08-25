(function(){
  const template = document.createElement('template');
  template.innerHTML = `
    <style>
      #root{ width:100%; height:100%; overflow:auto; }
      .row{ display:flex; gap:8px; margin:6px 0; }
      .row>div{ flex:1; }
      input[type="text"], input[type="number"], select{ width:100%; box-sizing: border-box; }
      .list{ border:1px solid #ddd; padding:6px; }
      .item{ border:1px dashed #ccc; padding:6px; margin:4px 0; }
    </style>
    <div id="root">
      <div class="row">
        <div>
          <label>Rows</label>
          <input id="rows" type="number" min="1" value="2" />
        </div>
        <div>
          <label>Columns</label>
          <input id="cols" type="number" min="1" value="3" />
        </div>
      </div>

      <div class="row">
        <div>
          <label>Decimals</label>
          <input id="decimals" type="number" min="0" max="6" value="0" />
        </div>
        <div>
          <label>Prefix</label>
          <input id="prefix" type="text" />
        </div>
        <div>
          <label>Suffix</label>
          <input id="suffix" type="text" />
        </div>
      </div>

      <div class="row">
        <div>
          <label>Tooltip Separator</label>
          <input id="tooltipSeparator" type="text" value=", " />
        </div>
        <div>
          <label>Show * on Multiple</label>
          <select id="showAsteriskMultiple"><option value="true">Yes</option><option value="false">No</option></select>
        </div>
      </div>

      <h4>Field Mappings (index is left-to-right, top-to-bottom)</h4>
      <div class="list" id="fields"></div>
      <button id="addField">Add Mapping</button>

      <h4>Cell Styles</h4>
      <div class="list" id="styles"></div>
      <button id="addStyle">Add Style</button>

      <div>
        <button id="apply">Apply</button>
      </div>
    </div>
  `;

  class Styling extends HTMLElement{
    constructor(){
      super();
      this._shadowRoot = this.attachShadow({mode:'open'});
      this._shadowRoot.appendChild(template.content.cloneNode(true));
      this._root = this._shadowRoot.getElementById('root');

      this._fields = this._shadowRoot.getElementById('fields');
      this._styles = this._shadowRoot.getElementById('styles');
      this._shadowRoot.getElementById('addField').addEventListener('click', () => this._addField());
      this._shadowRoot.getElementById('addStyle').addEventListener('click', () => this._addStyle());
      this._shadowRoot.getElementById('apply').addEventListener('click', () => this._apply());
    }

    _addField(item){
      const div = document.createElement('div');
      div.className='item';
      div.innerHTML = `
        <div class="row">
          <div><label>Index</label><input class="idx" type="number" min="0" value="0"/></div>
          <div><label>Type</label><select class="type"><option value="measure">Measure</option><option value="dimension">Dimension</option></select></div>
          <div><label>Key</label><input class="key" type="text" placeholder="measures_0 or dimensions_0"/></div>
        </div>
        <div class="row">
          <div><label>Filter Key</label><input class="fkey" type="text" placeholder="dimensions_0"/></div>
          <div><label>Op</label><select class="fop"><option value="eq">=</option><option value="in">in</option></select></div>
          <div><label>Value</label><input class="fval" type="text" placeholder="e.g., 2024"/></div>
        </div>`;
      if(item){
        div.querySelector('.idx').value = item.index ?? 0;
        div.querySelector('.type').value = item.type || 'measure';
        div.querySelector('.key').value = item.key || '';
        if(item.filter){
          div.querySelector('.fkey').value = item.filter.key || '';
          div.querySelector('.fop').value = item.filter.op || 'eq';
          div.querySelector('.fval').value = Array.isArray(item.filter.value) ? item.filter.value.join(',') : (item.filter.value || '');
        }
      }
      this._fields.appendChild(div);
    }

    _addStyle(item){
      const div = document.createElement('div');
      div.className='item';
      div.innerHTML = `
        <div class="row">
          <div><label>Index</label><input class="idx" type="number" min="0" value="0"/></div>
          <div><label>Font family</label><input class="fontFamily" type="text" placeholder="e.g., Arial"/></div>
          <div><label>Font size</label><input class="fontSize" type="number" min="8" max="72" value="14"/></div>
        </div>
        <div class="row">
          <div><label>Weight</label><select class="fontWeight"><option value="normal">normal</option><option value="bold">bold</option></select></div>
          <div><label>Style</label><select class="fontStyle"><option value="normal">normal</option><option value="italic">italic</option></select></div>
          <div><label>Color</label><input class="color" type="color" value="#222222"/></div>
        </div>`;
      if(item){
        div.querySelector('.idx').value = item.index ?? 0;
        div.querySelector('.fontFamily').value = item.fontFamily || '';
        div.querySelector('.fontSize').value = item.fontSize || 14;
        div.querySelector('.fontWeight').value = item.fontWeight || 'normal';
        div.querySelector('.fontStyle').value = item.fontStyle || 'normal';
        div.querySelector('.color').value = item.color || '#222222';
      }
      this._styles.appendChild(div);
    }

    _apply(){
      const rows = Number(this._shadowRoot.getElementById('rows').value) || 2;
      const cols = Number(this._shadowRoot.getElementById('cols').value) || 3;
      const decimals = Number(this._shadowRoot.getElementById('decimals').value) || 0;
      const prefix = this._shadowRoot.getElementById('prefix').value || '';
      const suffix = this._shadowRoot.getElementById('suffix').value || '';
      const tooltipSeparator = this._shadowRoot.getElementById('tooltipSeparator').value || ', ';
      const showAsteriskMultiple = this._shadowRoot.getElementById('showAsteriskMultiple').value === 'true';

      const mappings = Array.from(this._fields.children).map(div => ({
        index: Number(div.querySelector('.idx').value) || 0,
        type: div.querySelector('.type').value,
        key: div.querySelector('.key').value,
        filter: (div.querySelector('.fkey').value) ? {
          key: div.querySelector('.fkey').value,
          op: div.querySelector('.fop').value,
          value: (div.querySelector('.fval').value||'').split(',').map(s=>s.trim()).filter(Boolean)
        } : undefined
      }));

      // Normalize to rows*cols length array by index position
      const size = rows*cols; const fieldMappings = Array(size).fill(null);
      mappings.forEach(m => { if(m.index>=0 && m.index<size) fieldMappings[m.index] = {type:m.type, key:m.key, filter:m.filter}; });

      const styles = Array.from(this._styles.children).map(div => ({
        index: Number(div.querySelector('.idx').value) || 0,
        fontFamily: div.querySelector('.fontFamily').value,
        fontSize: Number(div.querySelector('.fontSize').value)||14,
        fontWeight: div.querySelector('.fontWeight').value,
        fontStyle: div.querySelector('.fontStyle').value,
        color: div.querySelector('.color').value
      }));
      const cellStyles = Array(size).fill(null);
      styles.forEach(s=>{ if(s.index>=0 && s.index<size) cellStyles[s.index]=s; });

      this.dispatchEvent(new CustomEvent('propertiesChanged', { detail: { properties: {
        rows, cols,
        decimals, prefix, suffix,
        tooltipSeparator, showAsteriskMultiple,
        fieldMappings: JSON.stringify(fieldMappings),
        cellStyles: JSON.stringify(cellStyles)
      }}}));
    }

    async onCustomWidgetAfterUpdate(changedProps){
      // Optionally populate UI from changedProps
    }
  }

  customElements.define('com-example-matrix-field-grid-styling', Styling);
})();
