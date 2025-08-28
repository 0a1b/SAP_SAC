var getScriptPromisify = (src) => new Promise((resolve)=> $.getScript(src, resolve));

(function(){
  const tpl = document.createElement('template');
  tpl.innerHTML = `
    <style>:host{display:block}</style>
    <div id="root" style="width:100%;height:100%"></div>
  `;

  function buildHalfDonutSeries(ring, data, ringIndex, totalRings, centerY){
    // Construct a half-donut series with fill record to hide the bottom
    const sum = data.reduce((a,b)=>a + (b.value||0), 0);
    const filled = data.concat([{
      value: sum,
      itemStyle: { color: 'none', decal: {symbol:'none'} },
      label: { show:false }
    }]);

    const outer = ring.outerRadius;
    const thickness = ring.thickness;
    const inner = Math.max(1, outer - thickness);

    return {
      name: ring.name || `Ring ${ringIndex+1}`,
      type: 'pie',
      radius: [inner+'%', outer+'%'],
      center: ['50%', centerY+'%'],
      startAngle: 180,
      color: ring.palette && ring.palette.length ? ring.palette : undefined,
      label: {
        show: (String(this.labelPosition)!=='none') && !!ring.showLabels,
        position: (this.labelPosition==='inside'?'inside': (this.labelPosition==='center'?'center': (this.labelPosition==='outside'?'outside':'outside'))),
        fontSize: Number(this.labelFontSize)||12,
        formatter: (p) => {
          const showV = !!ring.showValues, showP = !!ring.showPercents;
          const parts = [];
          if(showV){
            const vd = isFinite(ring.valueDecimals)? Number(ring.valueDecimals): (isFinite(p.$globals.valueDecimals)? Number(p.$globals.valueDecimals): 0);
            const vpref = (ring.valuePrefix!==undefined? ring.valuePrefix: p.$globals.valuePrefix)||'';
            const vsuf  = (ring.valueSuffix!==undefined? ring.valueSuffix: p.$globals.valueSuffix)||'';
            parts.push(vpref + Number(p.value).toLocaleString(undefined,{minimumFractionDigits:vd, maximumFractionDigits:vd}) + vsuf);
          }
          if(showP){
            const pd = isFinite(ring.percentDecimals)? Number(ring.percentDecimals): (isFinite(p.$globals.percentDecimals)? Number(p.$globals.percentDecimals): 1);
            const psuf = (ring.percentSuffix!==undefined? ring.percentSuffix: p.$globals.percentSuffix) || '%';
            parts.push(((p.percent*2)).toFixed(pd) + psuf); // correct half-donut percent
          }
          return [p.name, parts.join(' / ')].filter(Boolean).join(' ');
        }
      },
      data: filled
    };
  }

  class MultiHalfDonut extends HTMLElement{
    constructor(){
      super();
      this._shadowRoot = this.attachShadow({mode:'open'});
      this._shadowRoot.appendChild(tpl.content.cloneNode(true));
      this._root = this._shadowRoot.getElementById('root');
      this._props = {};
      this._chart = null;
    }

    set myDataSource(db){ this._db = db; this.render(); }
    onCustomWidgetResize(){ this.render(); }
    async onCustomWidgetAfterUpdate(){ this.render(); }

    _extractData(db, dimIdx, meaIdx, agg){
      const meta = db && db.metadata; const st = db && db.state;
      if(st!=='success') return [];
      const dimKey = meta.feeds.dimensions.values[dimIdx];
      const meaKey = meta.feeds.measures.values[meaIdx];
      const groups = new Map();
      (db.data||[]).forEach(r => {
        const k = r[dimKey].label;
        const v = Number(r[meaKey].raw||0);
        if(!groups.has(k)) groups.set(k, []);
        groups.get(k).push(v);
      });
      const out = [];
      for(const [k, arr] of groups.entries()){
        let val = 0;
        if(agg==='avg') val = arr.length? (arr.reduce((a,b)=>a+b,0)/arr.length) : 0;
        else if(agg==='min') val = arr.length? Math.min(...arr) : 0;
        else if(agg==='max') val = arr.length? Math.max(...arr) : 0;
        else val = arr.reduce((a,b)=>a+b,0); // sum
        out.push({ name: k, value: val });
      }
      return out;
    }

    _themePalette(){
      // Attempt to derive theme colors from CSS variables if available
      const vars = [
        '--sapChart_Color_1', '--sapChart_Color_2', '--sapChart_Color_3', '--sapChart_Color_4', '--sapChart_Color_5',
        '--sapChart_Color_6', '--sapChart_Color_7', '--sapChart_Color_8'
      ];
      const s = getComputedStyle(document.documentElement);
      const arr = vars.map(v => s.getPropertyValue(v).trim()).filter(Boolean);
      return arr.length ? arr : null;
    }

    _namesFromMeta(){
      const meta = this._db && this._db.metadata;
      if(!meta) return {dimKeys:[], dimNames:[], meaKeys:[], meaNames:[]};
      const dimKeys = meta.feeds.dimensions.values||[];
      const meaKeys = meta.feeds.measures.values||[];
      const dimNames = dimKeys.map(k => (meta.dimensions && meta.dimensions[k] && (meta.dimensions[k].label||meta.dimensions[k].name)) || k);
      const meaNames = meaKeys.map(k => (meta.mainStructureMembers && meta.mainStructureMembers[k] && (meta.mainStructureMembers[k].label||meta.mainStructureMembers[k].name)) || k);
      return {dimKeys, dimNames, meaKeys, meaNames};
    }

    _resolveIndexByName(name, keys, map){
      if(!name) return -1;
      const lc = String(name).toLowerCase();
      for(let i=0;i<keys.length;i++){
        const k = keys[i];
        const entry = map && map[k];
        const label = entry && (entry.label||entry.name||"");
        const id = k || "";
        if(String(label).toLowerCase()===lc || String(id).toLowerCase()===lc) return i;
      }
      return -1;
    }

    async render(){
      await getScriptPromisify('https://cdnjs.cloudflare.com/ajax/libs/echarts/5.0.0/echarts.min.js');
      if(!this._db || this._db.state!=='success') return;
      const meta = this._db.metadata;
      const {dimKeys, dimNames, meaKeys, meaNames} = this._namesFromMeta();
      // Also push names + keys into widget properties so styling has a guaranteed source
      try{
        this.dimensionNames = dimNames;
        this.measureNames = meaNames;
        this.dimensionKeys = dimKeys;
        this.measureKeys = meaKeys;
      }catch(e){}
      // Expose names globally for styling dropdowns (best-effort)
      try{ window.__com_example_multi_halfdonut_meta = {dimNames, meaNames}; }catch(e){}

      let rings = [];
      try{ rings = JSON.parse(this.rings||'[]'); } catch(e){}
      const maxRings = Math.min(5, rings.length);
      const centerY = Number(this.centerY)||70;

      const series = [];
      for(let i=0;i<maxRings;i++){
        // Compute default ring geometry: each inner ring subtracts (thickness + spacing)
        const baseOuter = Number(this.outerRadius)||70;
        const stepThick = Number(this.thickness)||14;
        const stepSpace = Number(this.spacing)||4;
        const defaultOuter = baseOuter - i * (stepThick + stepSpace);
        const ring = Object.assign({ outerRadius: defaultOuter, thickness: Number(this.thickness)||14, agg: (rings[i] && rings[i].agg) || this.defaultAgg || 'sum' }, rings[i]);
        // Resolve dimension/measure by name if provided, else fall back to index 0
        let dIdx = 0, mIdx = 0;
        if(ring.dimensionName){ const j=this._resolveIndexByName(ring.dimensionName, meta.feeds.dimensions.values, meta.dimensions); if(j>=0) dIdx=j; }
        else if(Number.isFinite(ring.dimensionIndex)) dIdx = ring.dimensionIndex;
        if(ring.measureName){ const j=this._resolveIndexByName(ring.measureName, meta.feeds.measures.values, meta.mainStructureMembers); if(j>=0) mIdx=j; }
        else if(Number.isFinite(ring.measureIndex)) mIdx = ring.measureIndex;
        let data = this._extractData(this._db, dIdx, mIdx, ring.agg);
        // Independent rings -> compute percentages independently by including fill record per ring (already handled)
        // If dependent (stacked totals across rings), we could normalize here. For now, independentRings toggle only affects labeling.
        series.push(buildHalfDonutSeries(ring, data, i, maxRings, centerY));
      }

      const themePalette = (String(this.useThemePalette)==='true') ? (this._themePalette() || (Array.isArray(this.globalPalette)&&this.globalPalette.length? this.globalPalette: undefined)) : ((Array.isArray(this.globalPalette)&&this.globalPalette.length)? this.globalPalette: undefined);
      const g = {
        valueDecimals: Number(this.valueDecimals)||0,
        valuePrefix: this.valuePrefix||'',
        valueSuffix: this.valueSuffix||'',
        percentDecimals: Number(this.percentDecimals)||1,
        percentSuffix: this.percentSuffix||'%',
        independentRings: String(this.independentRings)!=='false'
      };

      if(this._chart){ try{ this._chart.dispose(); }catch(e){} }
      const chart = this._chart = echarts.init(this._root, 'white');
      chart.setOption({
        color: themePalette || ((Array.isArray(this.globalPalette) && this.globalPalette.length) ? this.globalPalette : undefined),
        tooltip: { trigger:'item', formatter: (p)=> `${p.seriesName}<br/>${p.name}: ${p.value} (${(p.percent*2).toFixed(g.percentDecimals)}${g.percentSuffix})` },
        series: series.map(s => ({...s, label: {...s.label, formatter: ((fmt)=> (p)=>{ p.$globals=g; return fmt(p); })(s.label.formatter)}}))
      });
    }
  }

  customElements.define('com-example-multi-halfdonut', MultiHalfDonut);
})();
