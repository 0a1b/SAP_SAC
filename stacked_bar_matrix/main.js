var getScriptPromisify = (src) => new Promise((resolve)=> $.getScript(src, resolve));

(function(){
  const tpl = document.createElement('template');
  tpl.innerHTML = `
    <style>
      :host{display:block}
      #root{width:100%;height:100%;overflow:auto}
      .grid{display:grid;gap: var(--cell-gap,12px);width:100%;height:100%}
      .cell{border:1px solid #eee;padding:6px;display:flex;flex-direction:column}
      .legend { margin-top: var(--legend-spacing,24px); font-size: var(--legend-font-size,12px); color: var(--legend-color,#333); display:flex; gap: var(--legend-gap,10px); flex-wrap: wrap; }
      .legend-item{display:flex;align-items:center;gap:6px}
      .legend-color{width:12px;height:12px;border-radius:2px;display:inline-block}
    </style>
    <div id="root"><div id="grid" class="grid"></div></div>
  `;

  function parseMetadata(metadata){
    const { dimensions: dimensionsMap, mainStructureMembers: measuresMap } = metadata;
    const dimensions = [], measures = [];
    for(const k in dimensionsMap) dimensions.push({key:k, ...dimensionsMap[k]});
    for(const k in measuresMap) measures.push({key:k, ...measuresMap[k]});
    return { dimensions, measures };
  }

  function aggregateStacked(data, dimKey, measureKeys){
    // returns categories and series for stacked bar chart
    const groups = new Map();
    data.forEach(r => {
      const cat = r[dimKey].label;
      const entry = groups.get(cat) || {}; // measureKey->value
      measureKeys.forEach(mk => entry[mk] = (entry[mk]||0) + Number(r[mk].raw||0));
      groups.set(cat, entry);
    });
    const categories = Array.from(groups.keys());
    const series = measureKeys.map((mk,i)=>({ name: mk, type:'bar', stack:'total', emphasis:{focus:'series'}, data: categories.map(cat => groups.get(cat)[mk] || 0) }));
    return { categories, series };
  }

  class StackedBarMatrix extends HTMLElement{
    constructor(){
      super();
      this._shadowRoot = this.attachShadow({mode:'open'});
      this._shadowRoot.appendChild(tpl.content.cloneNode(true));
      this._root = this._shadowRoot.getElementById('root');
      this._grid = this._shadowRoot.getElementById('grid');
    }

    set myDataSource(db){ this._db = db; this.render(); }
    async onCustomWidgetAfterUpdate(){ this.render(); }
    onCustomWidgetResize(){ this.render(); }

    _buildCell(container, cfg, g){
      const chartEl = document.createElement('div');
      chartEl.style.width='100%'; chartEl.style.height='100%'; chartEl.style.minHeight='140px';
      container.appendChild(chartEl);
      const legendEl = document.createElement('div');
      legendEl.className='legend';
      container.appendChild(legendEl);

      const meta = this._db.metadata;
      const dimKey = meta.feeds.dimensions.values[cfg.dimensionIndex||0];
      const measureKeys = (cfg.measureIndices||[0]).map(i=> meta.feeds.measures.values[i]);
      const rows = this._db.data || [];
      const { categories, series } = aggregateStacked(rows, dimKey, measureKeys);

      const showV = g.showValues, showP = g.showPercents;
      function labelFormatter(params){
        const value = params.value;
        const total = params.seriesType==='bar' ? params.dataIndex>=0 ? series.reduce((sum,s)=> sum + (s.data[params.dataIndex]||0), 0) : 0 : 0;
        const parts=[];
        if(showV){
          parts.push((g.valuePrefix||'') + Number(value).toLocaleString(undefined,{minimumFractionDigits:g.valueDecimals, maximumFractionDigits:g.valueDecimals}) + (g.valueSuffix||''));
        }
        if(showP && total>0){
          parts.push(((value/total)*100).toFixed(g.percentDecimals) + (g.percentSuffix||'%'));
        }
        return parts.join(' / ');
      }

      // Chart
      const chart = echarts.init(chartEl, 'white');
      chart.setOption({
        color: g.globalPalette,
        grid: { top: 20, left: 40, right: 10, bottom: (g.legendPosition==='bottom'? (g.chartLegendSpacing||24)+20 : 30) },
        xAxis: { type:'category', data: categories },
        yAxis: { type:'value' },
        series: series.map(s => ({...s, label:{show:(showV||showP), position:'inside', formatter:labelFormatter}}))
      });

      // Legend
      legendEl.style.justifyContent = (g.legendOrient==='horizontal'?'center':'flex-start');
      legendEl.style.flexDirection = (g.legendOrient==='horizontal'?'row':'column');
      legendEl.style.setProperty('--legend-font-size', (g.legendFontSize||12)+'px');
      legendEl.style.setProperty('--legend-color', g.legendColor||'#333');
      legendEl.style.setProperty('--legend-gap', (g.legendItemGap||10)+'px');
      legendEl.style.setProperty('--legend-spacing', (g.chartLegendSpacing||24)+'px');

      const names = measureKeys.map((mk,i)=> ({ name: mk, color: (g.globalPalette && g.globalPalette[i]) || undefined }));
      names.forEach(n => {
        const item = document.createElement('div'); item.className='legend-item';
        const color = document.createElement('span'); color.className='legend-color'; if(n.color) color.style.backgroundColor=n.color;
        const label = document.createElement('span'); label.textContent = n.name;
        item.appendChild(color); item.appendChild(label);
        legendEl.appendChild(item);
      });

      if(g.legendPosition==='top') container.insertBefore(legendEl, chartEl);
      if(g.legendPosition==='right' || g.legendPosition==='left'){
        container.style.flexDirection = 'row';
        legendEl.style.marginTop = '0px';
        legendEl.style.alignItems = 'center';
        if(g.legendPosition==='left') container.insertBefore(legendEl, chartEl);
      }
    }

    async render(){
      await getScriptPromisify('https://cdnjs.cloudflare.com/ajax/libs/echarts/5.0.0/echarts.min.js');
      if(!this._db || this._db.state!=='success') return;

      const rows = Number(this.rows)||2, cols=Number(this.cols)||2;
      this._grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
      this._grid.style.gridTemplateRows    = `repeat(${rows}, minmax(200px, auto))`;
      this._grid.style.setProperty('--cell-gap', (Number(this.cellGap)||12)+'px');
      this._grid.innerHTML='';

      let configs=[]; try{ configs = JSON.parse(this.cellConfigs||'[]'); } catch(e){}
      const size = rows*cols;

      for(let i=0;i<size;i++){
        const cfg = configs[i] || { dimensionIndex:0, measureIndices:[0,1] };
        const cell = document.createElement('div'); cell.className='cell';
        this._grid.appendChild(cell);
        this._buildCell(cell, cfg, {
          legendPosition: this.legendPosition||'bottom',
          legendOrient: this.legendOrient||'horizontal',
          legendFontSize: Number(this.legendFontSize)||12,
          legendColor: this.legendColor||'#333',
          legendItemGap: Number(this.legendItemGap)||10,
          chartLegendSpacing: Number(this.chartLegendSpacing)||24,
          cellGap: Number(this.cellGap)||12,
          showValues: !!this.showValues,
          showPercents: !!this.showPercents,
          valueDecimals: Number(this.valueDecimals)||0,
          valuePrefix: this.valuePrefix||'',
          valueSuffix: this.valueSuffix||'',
          percentDecimals: Number(this.percentDecimals)||1,
          percentSuffix: this.percentSuffix||'%',
          globalPalette: this.globalPalette
        });
      }
    }
  }

  customElements.define('com-example-stacked-bar-matrix', StackedBarMatrix);
})();
