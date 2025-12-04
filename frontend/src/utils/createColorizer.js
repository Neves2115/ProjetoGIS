// src/utils/createColorizer.js

function isNumber(v) { return v !== null && v !== undefined && !Number.isNaN(Number(v)); }

function quantile(sortedArr, q) {
  if (!sortedArr.length) return null;
  const pos = (sortedArr.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  if (sortedArr[base+1] !== undefined) {
    return sortedArr[base] + rest * (sortedArr[base+1] - sortedArr[base]);
  }
  return sortedArr[base];
}

function getNumeric(vals) {
  return vals.filter(isNumber).map(v => Number(v)).sort((a,b)=>a-b);
}

const PALETTES = {
  blues: ['#f7fbff','#deebf7','#c6dbef','#9ecae1','#6baed6','#3182bd','#08519c'],
  greens: ['#f7fcf5','#e5f5e0','#c7e9c0','#a1d99b','#74c476','#31a354','#006d2c'],
  oranges: ['#fff5eb','#fee6ce','#fdd0a2','#fdae6b','#fd8d3c','#f16913','#d94801'],
  purples: ['#fcfbfd','#efedf5','#dadaeb','#bcbddc','#9e9ac8','#756bb1','#54278f'],
  reds: ['#fff5f0','#fee0d2','#fcbba1','#fc9272','#fb6a4a','#ef3b2c','#cb181d']
}

export default function createColorizer(indicator, allValues = [], opts = {}) {
  const nClasses = opts.nClasses || 5;
  // palette heurística
  const paletteName = opts.palette || (indicator === 'renda_per_capita' ? 'blues' : (indicator === 'saneamento' ? 'greens' : 'purples'));
  const palette = PALETTES[paletteName] || PALETTES.purples;
  const colors = (nClasses <= palette.length) ? palette.slice(palette.length - nClasses) : palette;

  const nums = getNumeric(allValues);

  // IDH: categorias fixas
  if (indicator === 'idh') {
    const fn = v => {
      if (!isNumber(v)) return '#999';
      if (v >= 0.800) return '#0b5ed7';
      if (v >= 0.700) return '#0a9d58';
      if (v >= 0.600) return '#c6a600';
      return '#e67e22';
    };
    const legend = [
      { label: 'Muito Alto (>= 0.800)', color: '#0b5ed7' },
      { label: 'Alto (0.700–0.799)', color: '#0a9d58' },
      { label: 'Médio (0.600–0.699)', color: '#c6a600' },
      { label: 'Baixo (<0.600)', color: '#e67e22' },
      { label: 'Sem dados', color: '#999' }
    ];
    return { colorFor: fn, legend, method: 'idh' };
  }

  // detectar skew (heurística)
  let useLog = false;
  if (nums.length > 0) {
    const median = nums[Math.floor(nums.length/2)] || nums[0];
    const max = nums[nums.length-1];
    if (median > 0 && (max / Math.max(1, median) > 10)) useLog = true;
  }

  // calcular breaks (quantis); se useLog -> quantis em log space
  let breaks = [];
  if (nums.length === 0) {
    breaks = [];
  } else if (useLog) {
    const logs = nums.map(v => Math.log(v + 1)).sort((a,b)=>a-b);
    for (let i=0;i<=nClasses;i++) breaks.push(Math.exp(quantile(logs, i / nClasses)) - 1);
  } else {
    for (let i=0;i<=nClasses;i++) breaks.push(quantile(nums, i / nClasses));
  }
  breaks = breaks.map(b => (b === undefined || Number.isNaN(b) ? null : b));

  function colorFor(value) {
    if (!isNumber(value)) return '#999';
    const v = Number(value);
    if (!breaks || breaks.length <= 1 || breaks.every(b => b==null)) {
      return colors[Math.floor(colors.length/2)];
    }
    for (let i=0;i<breaks.length-1;i++) {
      const lo = breaks[i] == null ? -Infinity : breaks[i];
      const hi = breaks[i+1] == null ? Infinity : breaks[i+1];
      if ((v >= lo && v < hi) || (i === breaks.length-2 && v >= lo && v <= hi)) {
        const idx = Math.min(colors.length-1, Math.max(0, i));
        return colors[idx];
      }
    }
    return colors[colors.length-1];
  }

  // legenda
  const legend = [];
  for (let i=0;i<breaks.length-1;i++){
    const lo = breaks[i];
    const hi = breaks[i+1];
    const fmt = (n) => {
      if (n == null) return '—';
      if (Math.abs(n) >= 1000) return Math.round(n).toLocaleString('pt-BR');
      return Number(Math.round(n * 100) / 100).toLocaleString('pt-BR');
    }
    let label;
    if (lo == null && hi != null) label = `< ${fmt(hi)}`;
    else if (lo != null && hi == null) label = `≥ ${fmt(lo)}`;
    else label = `${fmt(lo)} — ${fmt(hi)}`;
    legend.push({ label, color: colors[Math.min(i, colors.length-1)], from: lo, to: hi });
  }
  legend.push({ label: 'Sem dados', color: '#999' });

  return { colorFor, legend, method: useLog ? 'log-quantiles' : 'quantiles' };
}
