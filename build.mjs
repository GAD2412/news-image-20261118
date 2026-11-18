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
  asia: ['Asia', '#d9480f'],
  mideast: ['Middle East', '#b91c1c'],
  europe: ['Europe', '#5b21b6'],
  africa: ['Africa', '#2f7d32'],
  americas: ['Americas', '#1d4ed8'],
  oceania: ['Oceania', '#0f766e'],
  global: ['Global', '#3f4650'],
};
const color = (r) => REGIONS[r][1];
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// ---------- small drawing helpers ----------
function star(cx, cy, r, fill, n = 5, inner = 0.4, rot = -90) {
  const pts = [];
  for (let i = 0; i < n * 2; i++) {
    const a = ((rot + (i * 180) / n) * Math.PI) / 180;
    const rr = i % 2 ? r * inner : r;
    pts.push(`${(cx + rr * Math.cos(a)).toFixed(1)},${(cy + rr * Math.sin(a)).toFixed(1)}`);
  }
  return `<polygon points="${pts.join(' ')}" fill="${fill}"/>`;
}
const burst = (cx, cy, r) => star(cx, cy, r, '#f59e0b', 8, 0.5) + star(cx, cy, r * 0.55, '#dc2626', 8, 0.5, -68);
const flagUS = (x, y, w, h) => {
  let s = `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#fff"/>`;
  for (let i = 0; i < 7; i++) s += `<rect x="${x}" y="${(y + (i * 2 * h) / 13).toFixed(2)}" width="${w}" height="${(h / 13).toFixed(2)}" fill="#b22234"/>`;
  return s + `<rect x="${x}" y="${y}" width="${w * 0.42}" height="${(h * 7) / 13}" fill="#3c3b6e"/>`;
};
const flagCN = (x, y, w, h) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#de2910"/>` +
  star(x + w * 0.17, y + h * 0.27, h * 0.16, '#ffde00') +
  [[0.33, 0.1], [0.4, 0.2], [0.4, 0.35], [0.33, 0.45]].map(([a, b]) => star(x + w * a, y + h * b, h * 0.055, '#ffde00')).join('');
const flagRU = (x, y, w, h) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h / 3}" fill="#fff"/><rect x="${x}" y="${y + h / 3}" width="${w}" height="${h / 3}" fill="#0039a6"/><rect x="${x}" y="${y + (2 * h) / 3}" width="${w}" height="${h / 3}" fill="#d52b1e"/>`;
const frame = (x, y, w, h) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="#00000033" stroke-width="0.8"/>`;

// ---------- the drawings, one per illustrated story ----------
const ART = {
  tarmac() {
    let s = `<rect width="322" height="140" fill="#f1e3c8"/><circle cx="276" cy="28" r="15" fill="#f4b860"/>`;
    const sky = [[0, 30], [16, 46], [30, 24], [44, 58], [60, 76], [76, 40], [92, 52], [108, 34], [124, 62], [140, 44], [156, 28], [170, 50], [186, 36], [204, 58], [220, 30], [236, 46], [252, 26], [268, 40], [284, 54], [300, 32]];
    for (const [x, h] of sky) s += `<rect x="${x}" y="${92 - h}" width="15" height="${h}" fill="#cdb896"/>`;
    s += `<rect x="64" y="8" width="3" height="12" fill="#cdb896"/>`;
    s += `<rect y="92" width="322" height="48" fill="#7d828a"/><rect y="92" width="322" height="3" fill="#6b7078"/>`;
    s += `<line x1="0" y1="124" x2="322" y2="124" stroke="#f2f2f2" stroke-width="2" stroke-dasharray="14 10"/>`;
    s += `<polygon points="96,140 146,140 186,96 172,96" fill="#b3261e"/>`;
    // the aircraft
    s += `<polygon points="226,82 268,82 252,104 214,104" fill="#d7dce3"/>`;
    s += `<rect x="150" y="62" width="166" height="24" rx="12" fill="#fbfbfb" stroke="#b9c0ca"/>`;
    s += `<rect x="156" y="72" width="156" height="4" fill="#2b4c8c"/>`;
    s += `<polygon points="292,64 312,30 320,30 316,66" fill="#2b4c8c"/>`;
    for (let x = 178; x < 296; x += 10) s += `<rect x="${x}" y="65" width="5" height="4" rx="1" fill="#5b6b82"/>`;
    s += `<rect x="186" y="64" width="9" height="16" rx="2" fill="#5b6b82"/>`;
    s += `<polygon points="186,80 195,80 180,100 170,100" fill="#e9ebee" stroke="#9aa3ae" stroke-width="0.8"/>`;
    // two leaders meet at the foot of the steps
    s += `<circle cx="150" cy="96" r="4.6" fill="#e2b48c"/><rect x="145" y="101" width="10" height="20" rx="3" fill="#1f2a44"/>`;
    s += `<circle cx="163" cy="96" r="4.6" fill="#e2b48c"/><rect x="158" y="101" width="10" height="20" rx="3" fill="#2f3340"/>`;
    s += `<path d="M154,107 L159,107" stroke="#1f2a44" stroke-width="3" stroke-linecap="round"/>`;
    // the three flags of Thursday's summit
    [[10, flagUS], [40, flagCN], [70, flagRU]].forEach(([x, f]) => {
      s += `<rect x="${x}" y="44" width="2" height="56" fill="#555"/>` + f(x + 2, 46, 24, 15) + frame(x + 2, 46, 24, 15);
    });
    s += `<text x="12" y="132" font-size="10.5" font-weight="700" fill="#fff" letter-spacing="1">SHENZHEN · 18 NOV</text>`;
    return s;
  },
  gulf() {
    let s = `<rect width="322" height="140" fill="#a9cfe0"/>`;
    s += `<path d="M118,0 L322,0 L322,74 L300,66 L268,54 L232,44 L196,36 L164,24 L136,10 Z" fill="#e3d3ae"/>`;
    s += `<path d="M0,0 L62,0 L70,20 L64,38 L84,56 L112,86 L146,106 L196,122 L240,140 L0,140 Z" fill="#ecdcb6"/>`;
    s += `<ellipse cx="186" cy="104" rx="5.5" ry="9" fill="#ecdcb6"/>`;
    s += `<ellipse cx="282" cy="82" rx="22" ry="5" fill="#e3d3ae" transform="rotate(-12 282 82)"/>`;
    // Iranian drones toward Kuwait and Bahrain, met by air defences
    s += `<path d="M220,40 Q140,4 52,30" fill="none" stroke="#7f1d1d" stroke-width="1.6" stroke-dasharray="5 4"/>`;
    s += `<path d="M246,52 Q218,70 190,98" fill="none" stroke="#7f1d1d" stroke-width="1.6" stroke-dasharray="5 4"/>`;
    const drone = (x, y, a) => `<g transform="translate(${x} ${y}) rotate(${a})"><polygon points="0,-5 9,0 0,5 2,0" fill="#3b0d0d"/></g>`;
    s += drone(150, 15, 196) + drone(212, 76, 132);
    s += burst(58, 31, 11) + burst(190, 94, 9);
    // the US strike on Qeshm
    s += burst(282, 80, 9);
    s += `<path d="M322,104 L292,86" stroke="#1d4ed8" stroke-width="1.6" stroke-dasharray="4 3"/>`;
    const lab = (x, y, t, sz = 11, fill = '#3a2a12') => `<text x="${x}" y="${y}" font-size="${sz}" font-weight="700" fill="${fill}" letter-spacing="0.8">${t}</text>`;
    s += lab(250, 24, 'IRAN', 13) + lab(10, 56, 'KUWAIT') + lab(6, 70, 'Ali Al Salem air base', 9, '#5b4a2e');
    s += lab(150, 128, 'BAHRAIN') + lab(258, 102, 'QESHM', 10, '#0b3a66');
    s += lab(8, 132, 'GULF · 18 NOV', 10.5, '#fff');
    return s;
  },
  senate() {
    let s = `<rect width="322" height="140" fill="#e9eef6"/>`;
    const rows = 5, r0 = 52, r1 = 96, cx = 161, cy = 112;
    const radii = Array.from({ length: rows }, (_, i) => r0 + ((r1 - r0) * i) / (rows - 1));
    const total = radii.reduce((a, b) => a + b, 0);
    const counts = radii.map((r) => Math.round((100 * r) / total));
    counts[rows - 1] += 100 - counts.reduce((a, b) => a + b, 0);
    const seats = [];
    radii.forEach((r, i) => {
      for (let k = 0; k < counts[i]; k++) seats.push({ a: Math.PI - (Math.PI * k) / (counts[i] - 1), r });
    });
    seats.sort((p, q) => q.a - p.a || p.r - q.r);
    seats.forEach((p, i) => {
      s += `<circle cx="${(cx + p.r * Math.cos(p.a)).toFixed(1)}" cy="${(cy - p.r * Math.sin(p.a)).toFixed(1)}" r="4" fill="${i < 56 ? '#1d4ed8' : '#c1272d'}"/>`;
    });
    s += `<text x="${cx}" y="${cy - 4}" text-anchor="middle" font-size="25" font-weight="800" fill="#111827">56–44</text>`;
    s += `<text x="10" y="20" font-size="11" font-weight="800" fill="#1d4ed8" letter-spacing="1">DEM 56</text>`;
    s += `<text x="312" y="20" text-anchor="end" font-size="11" font-weight="800" fill="#c1272d" letter-spacing="1">REP 44</text>`;
    s += `<text x="${cx}" y="133" text-anchor="middle" font-size="10.5" font-weight="700" fill="#374151" letter-spacing="1.2">US SENATE FROM JANUARY · ALASKA FLIPS</text>`;
    return s;
  },
  'flags-cn-ru'() {
    return `<rect width="187" height="62" fill="#f3e9dc"/>` + flagCN(26, 12, 56, 37) + frame(26, 12, 56, 37) + flagRU(105, 12, 56, 37) + frame(105, 12, 56, 37);
  },
  jets() {
    let s = `<rect width="187" height="62" fill="#dfe6ec"/><rect y="46" width="187" height="16" fill="#cdb98f"/>`;
    s += burst(54, 47, 10) + burst(96, 50, 8) + burst(136, 46, 11);
    const jet = (x, y) => `<polygon transform="translate(${x} ${y})" points="0,4 26,2 32,4 26,6 0,4 12,4 6,-6 10,-6 18,4 10,14 6,14 12,4" fill="#374151"/>`;
    return s + jet(18, 10) + jet(118, 6);
  },
  tents() {
    let s = `<rect width="187" height="62" fill="#e5dccd"/><rect y="52" width="187" height="10" fill="#b9a98a"/>`;
    for (const x of [8, 46, 84, 122]) s += `<polygon points="${x},53 ${x + 20},24 ${x + 40},53" fill="#f6f2ea" stroke="#9c907c"/><polygon points="${x + 16},53 ${x + 20},40 ${x + 24},53" fill="#6b6152"/>`;
    for (let x = 6; x < 187; x += 13) s += `<line x1="${x}" y1="${2 + (x % 3) * 4}" x2="${x - 4}" y2="${12 + (x % 3) * 4}" stroke="#5c8fb0" stroke-width="1.3"/>`;
    s += `<rect x="160" y="10" width="22" height="30" fill="#fff" stroke="#9c907c"/><text x="171" y="33" text-anchor="middle" font-size="20" font-weight="800" fill="#b91c1c">!</text>`;
    return s;
  },
  pump() {
    let s = `<rect width="187" height="62" fill="#ece6f5"/>`;
    s += `<rect x="20" y="12" width="26" height="42" rx="3" fill="#5b21b6"/><rect x="25" y="17" width="16" height="10" fill="#fff"/>`;
    s += `<path d="M46,20 Q58,20 58,34 L58,44" fill="none" stroke="#1f2937" stroke-width="3"/><rect x="54" y="42" width="8" height="6" fill="#1f2937"/>`;
    s += `<polyline points="74,50 96,44 114,46 134,32 156,24" fill="none" stroke="#b91c1c" stroke-width="3" stroke-linejoin="round"/>`;
    s += `<polygon points="156,24 146,23 152,32" fill="#b91c1c"/>`;
    return s + `<text x="164" y="54" text-anchor="end" font-size="17" font-weight="800" fill="#1f2937">3.6%</text>`;
  },
  eu() {
    let s = `<rect width="187" height="62" fill="#e8ecf7"/><rect x="14" y="10" width="62" height="42" fill="#1f3f99"/>`;
    for (let i = 0; i < 12; i++) {
      const a = (i * Math.PI) / 6;
      s += star(45 + 13 * Math.cos(a), 31 + 13 * Math.sin(a), 2.8, '#ffd23f');
    }
    return s + `<text x="86" y="38" font-size="24" font-weight="800" fill="#1f3f99">€45bn</text><text x="88" y="52" font-size="9.5" font-weight="700" fill="#374151" letter-spacing="1">FOR 2027</text>`;
  },
  chip() {
    let s = `<rect width="187" height="62" fill="#e6eefc"/><rect x="18" y="10" width="42" height="42" rx="4" fill="#1f2937"/><rect x="27" y="19" width="24" height="24" fill="none" stroke="#9ca3af" stroke-width="1.5"/>`;
    for (let i = 0; i < 5; i++) {
      const p = 16 + i * 7.5;
      s += `<rect x="${p}" y="5" width="3" height="5" fill="#6b7280"/><rect x="${p}" y="52" width="3" height="5" fill="#6b7280"/><rect x="13" y="${p}" width="5" height="3" fill="#6b7280"/><rect x="60" y="${p}" width="5" height="3" fill="#6b7280"/>`;
    }
    return s + `<text x="72" y="36" font-size="20" font-weight="800" fill="#1d4ed8">$115.8bn</text><text x="73" y="51" font-size="9.5" font-weight="700" fill="#374151" letter-spacing="1">QUARTER · ×2</text>`;
  },
  controller() {
    let s = `<rect width="187" height="62" fill="#1f2430"/><circle cx="164" cy="15" r="8" fill="#f5e7b2"/><circle cx="168" cy="12" r="7" fill="#1f2430"/>`;
    for (const [x, y] of [[12, 8], [60, 6], [100, 14], [140, 40], [178, 50], [120, 4]]) s += `<circle cx="${x}" cy="${y}" r="1" fill="#e5e7eb"/>`;
    s += `<path d="M24,22 Q44,14 64,22 Q76,24 80,44 Q82,54 72,52 Q64,44 44,44 Q24,44 16,52 Q6,54 8,44 Q12,24 24,22 Z" fill="#e5e7eb"/>`;
    s += `<rect x="24" y="30" width="12" height="4" fill="#374151"/><rect x="28" y="26" width="4" height="12" fill="#374151"/>`;
    s += `<circle cx="58" cy="29" r="2.6" fill="#ef4444"/><circle cx="64" cy="34" r="2.6" fill="#22c55e"/><circle cx="52" cy="34" r="2.6" fill="#3b82f6"/>`;
    return s + `<text x="96" y="42" font-size="20" font-weight="800" fill="#fff" font-family="Menlo, monospace">00:00</text>`;
  },
  nigeria() {
    let s = `<rect width="187" height="62" fill="#edf5ee"/><rect x="16" y="12" width="20" height="38" fill="#118a4c"/><rect x="36" y="12" width="20" height="38" fill="#fff"/><rect x="56" y="12" width="20" height="38" fill="#118a4c"/>` + frame(16, 12, 60, 38);
    s += `<path d="M118,8 L146,14 L146,32 Q146,48 118,56 Q90,48 90,32 L90,14 Z" fill="#2f3b52"/>` + star(118, 31, 10, '#f4d35e');
    return s;
  },
  voyager() {
    let s = `<rect width="187" height="62" fill="#0f1628"/>`;
    for (const [x, y] of [[30, 8], [70, 52], [96, 10], [120, 50], [150, 6], [60, 20], [176, 44], [10, 50]]) s += `<circle cx="${x}" cy="${y}" r="0.9" fill="#cbd5e1"/>`;
    s += `<circle cx="14" cy="36" r="5" fill="#4ea3ff"/><line x1="22" y1="36" x2="140" y2="36" stroke="#cbd5e1" stroke-width="1.2" stroke-dasharray="4 3"/>`;
    s += `<text x="30" y="28" font-size="9.5" font-weight="700" fill="#fff" letter-spacing="0.6">1 LIGHT-DAY · 25.9bn km</text>`;
    s += `<circle cx="158" cy="36" r="11" fill="#e5e7eb"/><circle cx="158" cy="36" r="4" fill="#9ca3af"/><line x1="166" y1="40" x2="184" y2="52" stroke="#e5e7eb" stroke-width="1.5"/><line x1="150" y1="44" x2="144" y2="58" stroke="#e5e7eb" stroke-width="1.5"/>`;
    return s;
  },
  falklands() {
    let s = `<rect width="187" height="62" fill="#d7e9f5"/><rect x="12" y="12" width="56" height="37" fill="#74acdf"/><rect x="12" y="24.3" width="56" height="12.4" fill="#fff"/><circle cx="40" cy="30.5" r="4" fill="#f6b40e"/>` + frame(12, 12, 56, 37);
    s += `<path d="M92,30 Q98,18 112,22 Q122,26 118,38 Q110,46 98,42 Q90,38 92,30 Z" fill="#b9cf95"/>`;
    s += `<path d="M126,26 Q140,16 156,22 Q168,30 160,40 Q146,48 132,42 Q122,36 126,26 Z" fill="#b9cf95"/>`;
    return s + `<text x="128" y="54" text-anchor="middle" font-size="9" font-weight="700" fill="#1e3a5f" letter-spacing="1">FALKLANDS</text>`;
  },
};

// ---------- the dot map ----------
const MAP_W = 330, MAP_H = 128, LAT_TOP = 80, LAT_BOT = -58;
const proj = ([lat, lon]) => [((lon + 180) / 360) * MAP_W, ((LAT_TOP - lat) / (LAT_TOP - LAT_BOT)) * MAP_H];
function inRing(x, y, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
const polys = land.features.flatMap((f) => (f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates));
const isLand = (lon, lat) => polys.some((p) => inRing(lon, lat, p[0]) && !p.slice(1).some((h) => inRing(lon, lat, h)));

function mapSvg(numbered, small) {
  let s = '';
  const step = 3.7;
  for (let y = step / 2; y < MAP_H; y += step) {
    for (let x = step / 2; x < MAP_W; x += step) {
      const lon = (x / MAP_W) * 360 - 180, lat = LAT_TOP - (y / MAP_H) * (LAT_TOP - LAT_BOT);
      if (isLand(lon, lat)) s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="1.25" fill="#c4baa6"/>`;
    }
  }
  for (const b of small) {
    const [x, y] = proj(b.pin);
    s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.3" fill="${color(b.region)}" stroke="#fff" stroke-width="0.7"/>`;
  }
  const placed = [];
  for (const st of numbered) {
    const [tx, ty] = proj(st.pin);
    let x = tx, y = ty, k = 0;
    while (placed.some(([px, py]) => Math.hypot(px - x, py - y) < 13.5) && k < 12) {
      k++;
      const a = (-Math.PI / 2) + k * 1.1;
      x = tx + 14 * Math.ceil(k / 5) * Math.cos(a);
      y = ty + 14 * Math.ceil(k / 5) * Math.sin(a);
    }
    placed.push([x, y]);
    if (k) s += `<line x1="${tx.toFixed(1)}" y1="${ty.toFixed(1)}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="#333" stroke-width="0.8"/>`;
    s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="6.6" fill="${color(st.region)}" stroke="#fff" stroke-width="1"/>`;
    s += `<text x="${x.toFixed(1)}" y="${(y + 3).toFixed(1)}" text-anchor="middle" font-size="8.4" font-weight="800" fill="#fff">${st.id}</text>`;
  }
  return `<svg viewBox="0 0 ${MAP_W} ${MAP_H}" width="${MAP_W}" height="${MAP_H}">${s}</svg>`;
}

// ---------- page ----------
const tag = (st) => `<div class="tag" style="color:${color(st.region)}"><span class="num" style="background:${color(st.region)}">${st.id}</span>${esc(REGIONS[st.region][0])} · ${esc(st.beat)}</div>`;
// shown = the height the drawing is cropped to on the page (the middle of it is kept)
const card = (st, cls, w, h, shown) => `<div class="${cls}"><div class="art"><svg viewBox="0 0 ${w} ${h}" width="${w}" height="${shown}" preserveAspectRatio="xMidYMid slice">${ART[st.art]()}</svg></div>${tag(st)}<h${cls === 'lead' ? 2 : 3}>${esc(st.head)}</h${cls === 'lead' ? 2 : 3}><p>${esc(st.deck)}</p></div>`;

const order = Object.keys(REGIONS);
const briefs = [...data.briefs].sort((a, b) => order.indexOf(a.region) - order.indexOf(b.region));
const count = data.leads.length + data.tiles.length + data.briefs.length;
const continents = data.continents; // Asia, Europe, Africa, North and South America, Oceania
const numbered = [...data.leads, ...data.tiles].filter((s) => s.pin);

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
*{box-sizing:border-box;margin:0;padding:0}
body{position:relative;width:1024px;height:1024px;overflow:hidden;background:#f6f1e7;color:#15171c;font-family:"Avenir Next","Helvetica Neue",Arial,sans-serif;padding:0 18px}
.serif{font-family:ui-serif,"New York",Georgia,serif}
.kick{display:flex;justify-content:space-between;padding-top:11px;font:700 12.5px "Avenir Next Condensed","Avenir Next",sans-serif;letter-spacing:.16em}
.kick b{color:#b3261e}
h1{font-family:ui-serif,"New York",Georgia,serif;font-weight:800;font-size:72px;line-height:1;letter-spacing:-.012em;margin:3px 0 7px;white-space:nowrap;display:inline-block}
.band{display:flex;height:5px;margin-bottom:6px}.band i{flex:1}
.sub{display:flex;justify-content:space-between;font:italic 14px ui-serif,"New York",Georgia,serif;color:#3a3f47;padding-bottom:8px;border-bottom:2px solid #15171c}
.leads{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;padding-top:10px}
.tiles{display:grid;grid-template-columns:repeat(5,1fr);gap:12px;padding-top:12px;margin-top:12px;border-top:1px solid #15171c55}
.art{border-radius:5px;overflow:hidden;line-height:0}
.tag{display:flex;align-items:center;gap:5px;font:700 11px "Avenir Next Condensed","Avenir Next",sans-serif;letter-spacing:.09em;text-transform:uppercase;margin:7px 0 3px}
.num{display:inline-block;min-width:17px;height:17px;border-radius:9px;color:#fff;font:800 11px/17px "Avenir Next",sans-serif;text-align:center;letter-spacing:0}
h2{font-family:ui-serif,"New York",Georgia,serif;font-weight:800;font-size:24px;line-height:1.07;letter-spacing:-.01em}
.lead p{font-size:13.5px;line-height:1.3;color:#3a3f47;margin-top:5px}
h3{font-family:ui-serif,"New York",Georgia,serif;font-weight:700;font-size:17.5px;line-height:1.1;letter-spacing:-.005em}
.tile .tag{font-size:10px;margin:6px 0 2px}.tile .num{min-width:15px;height:15px;font-size:9.5px;line-height:15px}
.tile p{font-size:11.5px;line-height:1.25;color:#3a3f47;margin-top:3px}
.bottom{display:grid;grid-template-columns:330px 1fr;gap:18px;margin-top:12px;padding-top:9px;border-top:2px solid #15171c}
.lbl{font:700 11.5px "Avenir Next Condensed","Avenir Next",sans-serif;letter-spacing:.14em;margin-bottom:5px}
.legend{display:flex;flex-wrap:wrap;gap:3px 8px;font-size:10px;color:#3a3f47;margin-top:5px}
.legend span::before{content:"";display:inline-block;width:8px;height:8px;border-radius:4px;background:var(--c);margin-right:4px}
ul{list-style:none;columns:2;column-gap:18px}
li{font-size:11.8px;line-height:1.33;break-inside:avoid;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
li::before{content:"";display:inline-block;width:7px;height:7px;border-radius:4px;background:var(--c);margin-right:5px;vertical-align:1px}
li b{font-weight:700}
.foot{position:absolute;left:18px;right:18px;bottom:8px;border-top:1px solid #15171c55;padding-top:5px;font-size:10.5px;color:#3a3f47;display:flex;justify-content:space-between}
</style></head><body>
<div class="kick"><b>THE DAY IN WORLD NEWS</b><span>${count} STORIES · ${continents} CONTINENTS · ONE DAY</span></div>
<h1>${esc(data.date)}</h1>
<div class="band">${order.map((r) => `<i style="background:${color(r)}"></i>`).join('')}</div>
<div class="sub"><span>${esc(data.note)}</span><span>Numbers match the map</span></div>
<div class="leads">${data.leads.map((s) => card(s, 'lead', 322, 140, 140)).join('')}</div>
<div class="tiles">${data.tiles.map((s) => card(s, 'tile', 187, 62, 54)).join('')}</div>
<div class="bottom">
  <div><div class="lbl">WHERE IT HAPPENED</div>${mapSvg(numbered, briefs.filter((b) => b.pin))}
  <div class="legend">${order.filter((r) => r !== 'global').map((r) => `<span style="--c:${color(r)}">${REGIONS[r][0]}</span>`).join('')}</div></div>
  <div><div class="lbl">ALSO ON WEDNESDAY 18 NOVEMBER</div><ul>${briefs.map((b) => `<li style="--c:${color(b.region)}"><b>${esc(b.place)}:</b> ${esc(b.text)}</li>`).join('')}</ul></div>
</div>
<div class="foot"><span>Reported 18 Nov 2026. Figures as given by the officials and agencies named.</span><span>Sources: ${esc(data.sources)} · Original drawings</span></div>
<script>
// fit the date to the page width, and paint the page red if anything spills past the footer
document.fonts.ready.then(() => {
  const h = document.querySelector('h1'); let f = 72;
  while (h.getBoundingClientRect().width > 988 && f > 30) h.style.fontSize = (f -= 0.5) + 'px';
  const end = Math.max(...[...document.querySelectorAll('.bottom > div')].map((d) => d.getBoundingClientRect().bottom));
  const foot = document.querySelector('.foot').getBoundingClientRect().top;
  document.body.dataset.fit = Math.round(end) + '/' + Math.round(foot);
  if (end > foot - 2) document.body.style.background = '#ff8080';
});
</script>
</body></html>`;

mkdirSync(here('./out'), { recursive: true });
writeFileSync(here('./out/front.html'), html);
const page = `file://${here('./out/front.html')}`;
const chrome = (...args) => execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1', '--window-size=1024,1024', '--virtual-time-budget=3000', ...args, page], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
const fit = chrome('--dump-dom').match(/data-fit="(\d+)\/(\d+)"/);
console.log(fit ? `content ends at ${fit[1]}px, footer starts at ${fit[2]}px` : 'layout check did not run');
if (!fit || +fit[1] > +fit[2] - 2) process.exitCode = 1;
chrome(`--screenshot=${here('./entry.png')}`);
const bytes = statSync(here('./entry.png')).size;
console.log(`entry.png ${bytes} bytes${bytes > 1048576 ? '  TOO BIG (limit 1 MiB)' : ''}`);
