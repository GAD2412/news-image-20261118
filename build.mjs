// Draws entry.png: one 1024x1024 front page of the world's news on 18 November 2026.
// stories.json holds the words; every drawing below is plain SVG made here; the map's land
// comes from Natural Earth's public-domain 110m land outline (pass its path in NE_LAND).
// Render step: headless Google Chrome screenshots the generated page. Run once, commit the PNG.
//   NE_LAND=/path/ne_110m_land.geojson node build.mjs
import { readFileSync, writeFileSync, mkdirSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = (p) => fileURLToPath(new URL(p, import.meta.url));
const data = JSON.parse(readFileSync(here('./stories.json'), 'utf8'));
const land = JSON.parse(readFileSync(process.env.NE_LAND || here('./.cache/ne_110m_land.geojson'), 'utf8'));
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const REGIONS = {
  namerica: ['N. America', '#1d4ed8'],
  samerica: ['S. America', '#a21caf'],
  europe: ['Europe', '#5b21b6'],
  mideast: ['Middle East', '#b91c1c'],
  africa: ['Africa', '#2f7d32'],
  asia: ['Asia', '#d9480f'],
  oceania: ['Oceania', '#0f766e'],
  global: ['Global', '#3f4650'],
};
const color = (r) => REGIONS[r][1];
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// every story gets one number, in reading order: leads, then tiles, then briefs
let n = 0;
for (const s of [...data.leads, ...data.tiles, ...data.briefs]) s.id = ++n;

// ---------- small drawing helpers ----------
function star(cx, cy, r, fill, pts = 5, inner = 0.4, rot = -90) {
  const p = [];
  for (let i = 0; i < pts * 2; i++) {
    const a = ((rot + (i * 180) / pts) * Math.PI) / 180;
    const rr = i % 2 ? r * inner : r;
    p.push(`${(cx + rr * Math.cos(a)).toFixed(1)},${(cy + rr * Math.sin(a)).toFixed(1)}`);
  }
  return `<polygon points="${p.join(' ')}" fill="${fill}"/>`;
}
const burst = (cx, cy, r) => star(cx, cy, r, '#f59e0b', 8, 0.5) + star(cx, cy, r * 0.55, '#dc2626', 8, 0.5, -68);
const frame = (x, y, w, h) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="#00000033" stroke-width="0.8"/>`;
const flagUS = (x, y, w, h) => {
  let s = `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#fff"/>`;
  for (let i = 0; i < 7; i++) s += `<rect x="${x}" y="${(y + (i * 2 * h) / 13).toFixed(2)}" width="${w}" height="${(h / 13).toFixed(2)}" fill="#b22234"/>`;
  return s + `<rect x="${x}" y="${y}" width="${w * 0.42}" height="${(h * 7) / 13}" fill="#3c3b6e"/>` + frame(x, y, w, h);
};
const flagCN = (x, y, w, h) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#de2910"/>` + star(x + w * 0.17, y + h * 0.27, h * 0.16, '#ffde00') +
  [[0.33, 0.1], [0.4, 0.2], [0.4, 0.35], [0.33, 0.45]].map(([a, b]) => star(x + w * a, y + h * b, h * 0.055, '#ffde00')).join('');
const flagRU = (x, y, w, h) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h / 3}" fill="#fff"/><rect x="${x}" y="${y + h / 3}" width="${w}" height="${h / 3}" fill="#0039a6"/><rect x="${x}" y="${y + (2 * h) / 3}" width="${w}" height="${h / 3}" fill="#d52b1e"/>` + frame(x, y, w, h);
const pill = (x, y, text, bg = '#13213c', size = 10) =>
  `<rect x="${x}" y="${y}" width="${(text.length * size * 0.66 + 12).toFixed(0)}" height="${size + 7}" rx="3" fill="${bg}"/><text x="${x + 6}" y="${y + size + 2}" font-size="${size}" font-weight="700" fill="#fff" letter-spacing="0.5">${text}</text>`;
const label = (x, y, t, size = 10, fill = '#3a2a12', anchor = 'start') =>
  `<text x="${x}" y="${y}" font-size="${size}" font-weight="700" fill="${fill}" letter-spacing="0.6" text-anchor="${anchor}">${t}</text>`;
const jet = (x, y, k = 1) => `<polygon transform="translate(${x} ${y}) scale(${k})" points="0,4 26,2 32,4 26,6 0,4 12,4 6,-6 10,-6 18,4 10,14 6,14 12,4" fill="#374151"/>`;

// ---------- lead drawings (322 x 140) ----------
const LEAD_ART = {
  tarmac() {
    let s = `<rect width="322" height="140" fill="#f1e3c8"/><circle cx="276" cy="30" r="15" fill="#f4b860"/>`;
    const sky = [[0, 30], [16, 46], [30, 24], [44, 58], [60, 76], [76, 40], [92, 52], [108, 34], [124, 62], [140, 44], [156, 28], [170, 50], [186, 36], [204, 58], [220, 30], [236, 46], [252, 26], [268, 40], [284, 54], [300, 32]];
    for (const [x, h] of sky) s += `<rect x="${x}" y="${92 - h}" width="15" height="${h}" fill="#cdb896"/>`;
    s += `<rect y="92" width="322" height="48" fill="#7d828a"/><line x1="0" y1="124" x2="322" y2="124" stroke="#f2f2f2" stroke-width="2" stroke-dasharray="14 10"/>`;
    s += `<polygon points="96,140 146,140 186,96 172,96" fill="#b3261e"/>`;
    s += `<polygon points="226,82 268,82 252,104 214,104" fill="#d7dce3"/><rect x="150" y="62" width="166" height="24" rx="12" fill="#fbfbfb" stroke="#b9c0ca"/>`;
    s += `<rect x="156" y="72" width="156" height="4" fill="#2b4c8c"/><polygon points="292,64 312,30 320,30 316,66" fill="#2b4c8c"/>`;
    for (let x = 178; x < 296; x += 10) s += `<rect x="${x}" y="65" width="5" height="4" rx="1" fill="#5b6b82"/>`;
    s += `<rect x="186" y="64" width="9" height="16" rx="2" fill="#5b6b82"/><polygon points="186,80 195,80 180,100 170,100" fill="#e9ebee" stroke="#9aa3ae" stroke-width="0.8"/>`;
    s += `<circle cx="150" cy="96" r="4.6" fill="#e2b48c"/><rect x="145" y="101" width="10" height="20" rx="3" fill="#1f2a44"/>`;
    s += `<circle cx="162" cy="96" r="4.6" fill="#e2b48c"/><rect x="157" y="101" width="10" height="20" rx="3" fill="#2f3340"/><path d="M154,107 L159,107" stroke="#1f2a44" stroke-width="3" stroke-linecap="round"/>`;
    [[10, flagUS], [40, flagCN], [70, flagRU]].forEach(([x, f]) => (s += `<rect x="${x}" y="44" width="2" height="56" fill="#555"/>` + f(x + 2, 46, 24, 15)));
    return s + pill(10, 108, 'SHENZHEN · APEC SUMMIT');
  },
  gulf() {
    let s = `<rect width="322" height="140" fill="#a9cfe0"/>`;
    s += `<path d="M118,0 L322,0 L322,74 L300,66 L268,54 L232,44 L196,36 L164,24 L136,10 Z" fill="#e3d3ae"/>`;
    s += `<path d="M0,0 L62,0 L70,20 L64,38 L84,56 L112,86 L146,106 L196,122 L240,140 L0,140 Z" fill="#ecdcb6"/>`;
    s += `<ellipse cx="186" cy="104" rx="5.5" ry="9" fill="#ecdcb6"/><ellipse cx="282" cy="82" rx="22" ry="5" fill="#e3d3ae" transform="rotate(-12 282 82)"/>`;
    s += `<path d="M220,40 Q140,4 52,30" fill="none" stroke="#7f1d1d" stroke-width="1.6" stroke-dasharray="5 4"/><path d="M246,52 Q218,70 190,98" fill="none" stroke="#7f1d1d" stroke-width="1.6" stroke-dasharray="5 4"/>`;
    const drone = (x, y, a) => `<g transform="translate(${x} ${y}) rotate(${a})"><polygon points="0,-5 9,0 0,5 2,0" fill="#3b0d0d"/></g>`;
    s += drone(150, 15, 196) + drone(212, 76, 132) + burst(58, 31, 11) + burst(190, 94, 9) + burst(282, 80, 9);
    s += `<path d="M322,104 L292,86" stroke="#1d4ed8" stroke-width="1.6" stroke-dasharray="4 3"/>`;
    s += label(250, 24, 'IRAN', 13) + label(10, 54, 'KUWAIT', 11) + label(132, 128, 'BAHRAIN', 11) + label(254, 104, 'QESHM', 10, '#0b3a66');
    return s + pill(8, 76, 'IRAN SAYS: US BASE TARGETED', '#7f1d1d', 9.5) + pill(8, 96, 'KUWAIT: NO DAMAGE REPORTED', '#13213c', 9.5);
  },
  senate() {
    let s = `<rect width="322" height="140" fill="#e9eef6"/>`;
    const rows = 5, r0 = 52, r1 = 96, cx = 161, cy = 112;
    const radii = Array.from({ length: rows }, (_, i) => r0 + ((r1 - r0) * i) / (rows - 1));
    const total = radii.reduce((a, b) => a + b, 0);
    const counts = radii.map((r) => Math.round((100 * r) / total));
    counts[rows - 1] += 100 - counts.reduce((a, b) => a + b, 0);
    const seats = [];
    radii.forEach((r, i) => { for (let k = 0; k < counts[i]; k++) seats.push({ a: Math.PI - (Math.PI * k) / (counts[i] - 1), r }); });
    seats.sort((p, q) => q.a - p.a || p.r - q.r);
    seats.forEach((p, i) => (s += `<circle cx="${(cx + p.r * Math.cos(p.a)).toFixed(1)}" cy="${(cy - p.r * Math.sin(p.a)).toFixed(1)}" r="4" fill="${i < 56 ? '#1d4ed8' : '#c1272d'}"/>`));
    s += `<text x="${cx}" y="${cy - 4}" text-anchor="middle" font-size="25" font-weight="800" fill="#111827">56–44</text>`;
    s += label(10, 22, 'DEM 56', 11, '#1d4ed8') + label(312, 22, 'REP 44', 11, '#c1272d', 'end');
    return s + label(cx, 130, 'US SENATE FROM JANUARY · ALASKA FLIPS', 10, '#374151', 'middle');
  },
};

// ---------- tile drawings (104 x 70) ----------
const TILE_ART = {
  cnru: () => `<rect width="104" height="70" fill="#f3e9dc"/>` + flagCN(8, 12, 40, 27) + frame(8, 12, 40, 27) + flagRU(56, 12, 40, 27) + label(52, 58, 'SHENZHEN', 9, '#6b4f2a', 'middle'),
  jets: () => `<rect width="104" height="70" fill="#dfe6ec"/><rect y="52" width="104" height="18" fill="#cdb98f"/>` + burst(24, 53, 9) + burst(54, 56, 7) + burst(84, 52, 9) + jet(8, 12, 0.85) + jet(58, 24, 0.85),
  tents() {
    let s = `<rect width="104" height="70" fill="#e5dccd"/><rect y="58" width="104" height="12" fill="#b9a98a"/>`;
    for (const x of [4, 34, 64]) s += `<polygon points="${x},59 ${x + 16},34 ${x + 32},59" fill="#f6f2ea" stroke="#9c907c"/><polygon points="${x + 13},59 ${x + 16},48 ${x + 19},59" fill="#6b6152"/>`;
    for (let x = 4; x < 76; x += 9) s += `<line x1="${x}" y1="${4 + (x % 3) * 4}" x2="${x - 3}" y2="${12 + (x % 3) * 4}" stroke="#5c8fb0" stroke-width="1.2"/>`;
    return s + `<rect x="80" y="6" width="19" height="25" fill="#fff" stroke="#9c907c"/><text x="89.5" y="26" text-anchor="middle" font-size="17" font-weight="800" fill="#b91c1c">!</text>`;
  },
  eu() {
    let s = `<rect width="104" height="70" fill="#e8ecf7"/><rect x="27" y="5" width="50" height="33" fill="#1f3f99"/>`;
    for (let i = 0; i < 12; i++) s += star(52 + 10.5 * Math.cos((i * Math.PI) / 6), 21.5 + 10.5 * Math.sin((i * Math.PI) / 6), 2.3, '#ffd23f');
    return s + `<text x="52" y="62" text-anchor="middle" font-size="19" font-weight="800" fill="#1f3f99">€45bn</text>`;
  },
  pump: () =>
    `<rect width="104" height="70" fill="#ece6f5"/><rect x="8" y="14" width="20" height="42" rx="3" fill="#5b21b6"/><rect x="12" y="18" width="12" height="8" fill="#fff"/>` +
    `<path d="M28,20 Q38,20 38,32 L38,44" fill="none" stroke="#1f2937" stroke-width="2.6"/><rect x="35" y="42" width="6" height="5" fill="#1f2937"/>` +
    `<polyline points="48,50 60,44 72,46 84,32 96,24" fill="none" stroke="#b91c1c" stroke-width="2.6" stroke-linejoin="round"/><polygon points="97,23 88,22 93,30" fill="#b91c1c"/>` +
    `<text x="100" y="66" text-anchor="end" font-size="15" font-weight="800" fill="#1f2937">3.6%</text>`,
  chip() {
    let s = `<rect width="104" height="70" fill="#e6eefc"/><rect x="36" y="6" width="32" height="32" rx="3" fill="#1f2937"/><rect x="43" y="13" width="18" height="18" fill="none" stroke="#9ca3af" stroke-width="1.3"/>`;
    for (let i = 0; i < 4; i++) {
      const p = 40 + i * 7;
      s += `<rect x="${p}" y="2" width="2.5" height="4" fill="#6b7280"/><rect x="${p}" y="38" width="2.5" height="4" fill="#6b7280"/><rect x="32" y="${p - 30}" width="4" height="2.5" fill="#6b7280"/><rect x="68" y="${p - 30}" width="4" height="2.5" fill="#6b7280"/>`;
    }
    return s + `<text x="52" y="62" text-anchor="middle" font-size="17" font-weight="800" fill="#1d4ed8">$115.8bn</text>`;
  },
  nigeria: () =>
    `<rect width="104" height="70" fill="#edf5ee"/><rect x="6" y="18" width="16" height="32" fill="#118a4c"/><rect x="22" y="18" width="16" height="32" fill="#fff"/><rect x="38" y="18" width="16" height="32" fill="#118a4c"/>` +
    frame(6, 18, 48, 32) + `<path d="M80,12 L98,17 L98,32 Q98,47 80,56 Q62,47 62,32 L62,17 Z" fill="#2f3b52"/>` + star(80, 33, 8, '#f4d35e'),
  cyclone() {
    let s = `<rect width="104" height="70" fill="#a9cfe0"/><path d="M82,0 L104,0 L104,70 L94,70 Q88,52 92,40 Q86,28 90,14 Z" fill="#e3d3ae"/>`;
    s += `<g transform="translate(38 34)">`;
    for (const k of [0, 120, 240]) s += `<path d="M0,-6 A6,6 0 0 1 6,0 M0,-14 A14,14 0 0 1 14,0 M0,-22 A22,22 0 0 1 22,0" transform="rotate(${k})" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round"/>`;
    s += `<circle r="3" fill="#7fb3cc"/></g><path d="M62,40 L82,30" stroke="#7f1d1d" stroke-width="1.8" stroke-dasharray="3 2"/><polygon points="84,29 76,28 79,35" fill="#7f1d1d"/>`;
    return s + label(6, 66, 'AKVAN', 8.5, '#0b3a66');
  },
  cop: () =>
    `<rect width="104" height="70" fill="#f4ead5"/><circle cx="32" cy="32" r="21" fill="#4f8fbf"/><path d="M18,22 Q26,14 34,20 Q40,26 32,32 Q24,36 18,30 Z M34,40 Q44,36 48,44 Q44,50 36,48 Z" fill="#7fb069"/>` +
    `<rect x="70" y="6" width="9" height="42" rx="4.5" fill="#fff" stroke="#555"/><rect x="72.5" y="20" width="4" height="30" fill="#dc2626"/><circle cx="74.5" cy="54" r="7.5" fill="#dc2626"/>` +
    label(32, 66, 'COP31', 9, '#5b4a2e', 'middle'),
  voyager() {
    let s = `<rect width="104" height="70" fill="#0f1628"/>`;
    for (const [x, y] of [[20, 8], [44, 60], [60, 10], [74, 56], [96, 8], [30, 52], [88, 64]]) s += `<circle cx="${x}" cy="${y}" r="0.9" fill="#cbd5e1"/>`;
    s += `<circle cx="9" cy="40" r="4.5" fill="#4ea3ff"/><line x1="16" y1="40" x2="74" y2="40" stroke="#cbd5e1" stroke-width="1.2" stroke-dasharray="3 3"/>`;
    s += label(12, 30, '1 LIGHT-DAY', 8.5, '#fff');
    return s + `<circle cx="86" cy="40" r="9" fill="#e5e7eb"/><circle cx="86" cy="40" r="3.5" fill="#9ca3af"/><line x1="93" y1="45" x2="103" y2="55" stroke="#e5e7eb" stroke-width="1.4"/><line x1="80" y1="47" x2="76" y2="60" stroke="#e5e7eb" stroke-width="1.4"/>`;
  },
  falklands: () =>
    `<rect width="104" height="70" fill="#d7e9f5"/><rect x="6" y="8" width="42" height="27" fill="#74acdf"/><rect x="6" y="17" width="42" height="9" fill="#fff"/><circle cx="27" cy="21.5" r="3" fill="#f6b40e"/>` + frame(6, 8, 42, 27) +
    `<path d="M54,40 Q58,30 68,33 Q76,36 73,45 Q66,52 58,49 Q52,46 54,40 Z" fill="#b9cf95"/><path d="M76,36 Q86,28 96,33 Q103,40 97,47 Q88,53 80,49 Q74,44 76,36 Z" fill="#b9cf95"/>` +
    label(76, 64, 'FALKLANDS', 7.5, '#1e3a5f', 'middle'),
  controller() {
    let s = `<rect width="104" height="70" fill="#1f2430"/><circle cx="92" cy="12" r="6.5" fill="#f5e7b2"/><circle cx="95" cy="10" r="5.5" fill="#1f2430"/>`;
    for (const [x, y] of [[10, 8], [40, 6], [70, 14], [60, 62], [100, 60]]) s += `<circle cx="${x}" cy="${y}" r="0.9" fill="#e5e7eb"/>`;
    s += `<g transform="translate(-2 12) scale(0.72)"><path d="M24,22 Q44,14 64,22 Q76,24 80,44 Q82,54 72,52 Q64,44 44,44 Q24,44 16,52 Q6,54 8,44 Q12,24 24,22 Z" fill="#e5e7eb"/>`;
    s += `<rect x="24" y="30" width="12" height="4" fill="#374151"/><rect x="28" y="26" width="4" height="12" fill="#374151"/><circle cx="58" cy="29" r="2.6" fill="#ef4444"/><circle cx="64" cy="34" r="2.6" fill="#22c55e"/><circle cx="52" cy="34" r="2.6" fill="#3b82f6"/></g>`;
    return s + `<text x="100" y="58" text-anchor="end" font-size="13" font-weight="800" fill="#fff" font-family="Menlo, monospace">00:00</text>`;
  },
};

// ---------- the map: filled land, numbered pins for stories 1-15, dots for the briefs ----------
const MAP_W = 396, LAT_TOP = 80, LAT_BOT = -56, MAP_H = Math.round((MAP_W * (LAT_TOP - LAT_BOT)) / 360);
const proj = ([lat, lon]) => [((lon + 180) / 360) * MAP_W, ((LAT_TOP - lat) / (LAT_TOP - LAT_BOT)) * MAP_H];
const rings = land.features.flatMap((f) => (f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates)).flat();
const landPath = rings.map((ring) => 'M' + ring.map(([lon, lat]) => proj([lat, lon]).map((v) => v.toFixed(1)).join(',')).join('L') + 'Z').join('');

function mapSvg(numbered, small) {
  let s = `<rect width="${MAP_W}" height="${MAP_H}" fill="#dfeaf0"/><path d="${landPath}" fill="#e6dcc6" stroke="#cbbd9f" stroke-width="0.5"/>`;
  for (const b of small) {
    const [x, y] = proj(b.pin);
    s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.6" fill="${color(b.region)}" stroke="#fff" stroke-width="0.8"/>`;
  }
  const placed = [];
  for (const st of numbered) {
    const [tx, ty] = proj(st.pin);
    let x = tx, y = ty, k = 0;
    while (placed.some(([px, py]) => Math.hypot(px - x, py - y) < 15.5) && k < 16) {
      k++;
      const a = -Math.PI / 2 + k * 1.15;
      x = tx + 16 * Math.ceil(k / 5) * Math.cos(a);
      y = ty + 16 * Math.ceil(k / 5) * Math.sin(a);
    }
    placed.push([x, y]);
    if (k) s += `<line x1="${tx.toFixed(1)}" y1="${ty.toFixed(1)}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="#333" stroke-width="0.9"/><circle cx="${tx.toFixed(1)}" cy="${ty.toFixed(1)}" r="1.8" fill="#333"/>`;
    s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="7.4" fill="${color(st.region)}" stroke="#fff" stroke-width="1.2"/>`;
    s += `<text x="${x.toFixed(1)}" y="${(y + 3.2).toFixed(1)}" text-anchor="middle" font-size="9" font-weight="800" fill="#fff">${st.id}</text>`;
  }
  return `<svg viewBox="0 0 ${MAP_W} ${MAP_H}" width="${MAP_W}" height="${MAP_H}" style="border-radius:4px">${s}</svg>`;
}

// ---------- page ----------
const tag = (st) => `<div class="tag" style="color:${color(st.region)}"><span class="num" style="background:${color(st.region)}">${st.id}</span>${esc(REGIONS[st.region][0])} · ${esc(st.beat)}</div>`;
const lead = (st) => `<div class="lead"><div class="art"><svg viewBox="0 6 322 128" width="322" height="128">${LEAD_ART[st.art]()}</svg></div>${tag(st)}<h2>${esc(st.head)}</h2><p>${esc(st.deck)}</p></div>`;
const tile = (st) => `<div class="tile"><div class="art"><svg viewBox="0 0 104 70" width="104" height="70">${TILE_ART[st.art]()}</svg></div><div>${tag(st)}<h3>${esc(st.head)}</h3><p>${esc(st.deck)}</p></div></div>`;

const all = [...data.leads, ...data.tiles, ...data.briefs];
const legendRegions = Object.keys(REGIONS).filter((r) => r !== 'global');

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
*{box-sizing:border-box;margin:0;padding:0}
body{position:relative;width:1024px;height:1024px;overflow:hidden;background:#f6f1e7;color:#15171c;font-family:"Avenir Next","Helvetica Neue",Arial,sans-serif;padding:0 18px}
.mast{background:#13213c;color:#fff;margin:0 -18px;padding:9px 18px 6px}
.kick{display:flex;justify-content:space-between;font:700 12.5px "Avenir Next Condensed","Avenir Next",sans-serif;letter-spacing:.16em}
.kick b{color:#f2c14e}
h1{font-family:ui-serif,"New York",Georgia,serif;font-weight:800;font-size:78px;line-height:1;letter-spacing:-.012em;margin:2px 0 0;white-space:nowrap;display:inline-block}
.sub{display:flex;justify-content:space-between;font:italic 13.5px ui-serif,"New York",Georgia,serif;color:#3a3f47;padding:6px 0 6px;border-bottom:2px solid #15171c}
.leads{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;padding-top:9px}
.art{border-radius:5px;overflow:hidden;line-height:0}
.tag{display:flex;align-items:center;gap:5px;font:700 11px "Avenir Next Condensed","Avenir Next",sans-serif;letter-spacing:.08em;text-transform:uppercase;margin:6px 0 3px;white-space:nowrap}
.num{display:inline-block;min-width:17px;height:17px;padding:0 3px;border-radius:9px;color:#fff;font:800 10.5px/17px "Avenir Next",sans-serif;text-align:center;letter-spacing:0}
h2{font-family:ui-serif,"New York",Georgia,serif;font-weight:800;font-size:24px;line-height:1.07;letter-spacing:-.01em}
.lead p{font-size:13.3px;line-height:1.28;color:#3a3f47;margin-top:4px}
.tiles{display:grid;grid-template-columns:repeat(3,1fr);gap:9px 14px;margin-top:10px;padding-top:10px;border-top:1px solid #15171c55}
.tile{display:grid;grid-template-columns:104px 1fr;gap:9px;align-items:start}
.tile .tag{font-size:9.6px;margin:0 0 2px}.tile .num{min-width:15px;height:15px;font-size:9px;line-height:15px}
h3{font-family:ui-serif,"New York",Georgia,serif;font-weight:700;font-size:15.6px;line-height:1.1;letter-spacing:-.005em}
.tile p{font-size:11.2px;line-height:1.22;color:#3a3f47;margin-top:2px}
.bottom{display:grid;grid-template-columns:${MAP_W}px minmax(0,1fr);gap:16px;margin-top:10px;padding-top:8px;border-top:2px solid #15171c}
.lbl{font:700 11.5px "Avenir Next Condensed","Avenir Next",sans-serif;letter-spacing:.14em;margin-bottom:5px;display:flex;justify-content:space-between}
.lbl i{font:italic 10.5px "Avenir Next",sans-serif;letter-spacing:0;color:#555}
.legend{display:flex;flex-wrap:wrap;gap:3px 9px;font-size:10px;color:#3a3f47;margin-top:4px}
.legend span::before{content:"";display:inline-block;width:8px;height:8px;border-radius:4px;background:var(--c);margin-right:4px}
ul{list-style:none;columns:2;column-gap:14px}
li{font-size:11.4px;line-height:1.36;break-inside:avoid;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
li .num{min-width:16px;height:14px;font-size:8.8px;line-height:14px;margin-right:4px;vertical-align:1px;border-radius:7px}
.foot{position:absolute;left:18px;right:18px;bottom:7px;border-top:1px solid #15171c55;padding-top:5px;font-size:10.3px;white-space:nowrap;color:#3a3f47;display:flex;justify-content:space-between}
</style></head><body>
<div class="mast"><div class="kick"><b>THE DAY IN WORLD NEWS</b><span>${all.length} STORIES · ${data.continents} CONTINENTS · ONE DAY</span></div><h1>${esc(data.date)}</h1></div>
<div class="sub"><span>${esc(data.note)}</span><span>Numbers 1–${data.leads.length + data.tiles.length} are pinned on the map</span></div>
<div class="leads">${data.leads.map(lead).join('')}</div>
<div class="tiles">${data.tiles.map(tile).join('')}</div>
<div class="bottom">
  <div><div class="lbl">WHERE IT HAPPENED<i>big numbers = stories above · dots = briefs</i></div>${mapSvg([...data.leads, ...data.tiles].filter((s) => s.pin), data.briefs.filter((b) => b.pin))}
  <div class="legend">${legendRegions.map((r) => `<span style="--c:${color(r)}">${REGIONS[r][0]}</span>`).join('')}</div></div>
  <div><div class="lbl">ALSO ON WEDNESDAY 18 NOVEMBER</div><ul>${data.briefs.map((b) => `<li><span class="num" style="background:${color(b.region)}">${b.id}</span><b>${esc(b.place)}:</b> ${esc(b.text)}</li>`).join('')}</ul></div>
</div>
<div class="foot"><span>${esc(data.footer)}</span><span>Sources: ${esc(data.sources)} · Original drawings</span></div>
<script>
// fit the date to the page width, and paint the page red if anything spills past the footer
document.fonts.ready.then(() => {
  const h = document.querySelector('h1'); let f = 78;
  while (h.getBoundingClientRect().width > 988 && f > 30) h.style.fontSize = (f -= 0.5) + 'px';
  const end = Math.max(...[...document.querySelectorAll('.bottom > div, .tiles')].map((d) => d.getBoundingClientRect().bottom));
  const clipped = [...document.querySelectorAll('li')].filter((li) => li.scrollWidth > li.clientWidth + 1).length;
  const foot = document.querySelector('.foot').getBoundingClientRect().top;
  document.body.dataset.fit = Math.round(end) + '/' + Math.round(foot) + '/' + clipped;
  if (end > foot - 2 || clipped) document.body.style.background = '#ff8080';
});
</script>
</body></html>`;

mkdirSync(here('./out'), { recursive: true });
writeFileSync(here('./out/front.html'), html);
const page = `file://${here('./out/front.html')}`;
const chrome = (...args) => execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1', '--window-size=1024,1024', '--virtual-time-budget=3000', ...args, page], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
const fit = chrome('--dump-dom').match(/data-fit="(\d+)\/(\d+)\/(\d+)"/);
console.log(fit ? `content ends at ${fit[1]}px, footer starts at ${fit[2]}px, ${fit[3]} brief lines cut short` : 'layout check did not run');
if (!fit || +fit[1] > +fit[2] - 2 || +fit[3] > 0) process.exitCode = 1;
chrome(`--screenshot=${here('./entry.png')}`);
const bytes = statSync(here('./entry.png')).size;
console.log(`entry.png ${bytes} bytes${bytes > 1048576 ? '  TOO BIG (limit 1 MiB)' : ''}`);
