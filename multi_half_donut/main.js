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
        show: !!ring.showLabels,
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
    }

    set myDataSource(db){ this._db = db; this.render(); }
    onCustomWidgetResize(){ this.render(); }
    async onCustomWidgetAfterUpdate(){ this.render(); }

    _extractData(db, dimIdx, meaIdx){
      const meta = db && db.metadata; const st = db && db.state;
      if(st!=='success') return [];
      const dimKey = meta.feeds.dimensions.values[dimIdx];
      const meaKey = meta.feeds.measures.values[meaIdx];
      return db.data.map(r => ({ name: r[dimKey].label, value: r[meaKey].raw }));
    }

    async render(){
      await getScriptPromisify('https://cdnjs.cloudflare.com/ajax/libs/echarts/5.0.0/echarts.min.js');
      if(!this._db || this._db.state!=='success') return;
      const opts = this._props || {};

      let rings = [];
      try{ rings = JSON.parse(this.rings||'[]'); } catch(e){}
      const maxRings = Math.min(5, rings.length);
      const centerY = Number(this.centerY)||70;

      const series = [];
      for(let i=0;i<maxRings;i++){
        const ring = Object.assign({ outerRadius: (Number(this.outerRadius)||70) - i*(Number(this.spacing)||4), thickness: Number(this.thickness)||14 }, rings[i]);
        const data = this._extractData(this._db, ring.dimensionIndex||0, ring.measureIndex||0);
        series.push(buildHalfDonutSeries(ring, data, i, maxRings, centerY));
      }

      const g = {
        valueDecimals: Number(this.valueDecimals)||0,
        valuePrefix: this.valuePrefix||'',
        valueSuffix: this.valueSuffix||'',
        percentDecimals: Number(this.percentDecimals)||1,
        percentSuffix: this.percentSuffix||'%'
      };

      const chart = echarts.init(this._root, 'white');
      chart.setOption({
        color: (Array.isArray(this.globalPalette) && this.globalPalette.length) ? this.globalPalette : undefined,
        tooltip: { trigger:'item', formatter: (p)=> `${p.seriesName}<br/>${p.name}: ${p.value} (${(p.percent*2).toFixed(g.percentDecimals)}${g.percentSuffix})` },
        series: series.map(s => ({...s, label: {...s.label, formatter: ((fmt)=> (p)=>{ p.$globals=g; return fmt(p); })(s.label.formatter)}}))
      });
    }
  }

  customElements.define('com-example-multi-halfdonut', MultiHalfDonut);
})();
