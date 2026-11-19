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
const flagEU = (x, y, w, h) => {
  let s = `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#1f3f99"/>`;
  for (let i = 0; i < 12; i++) s += star(x + w / 2 + h * 0.32 * Math.cos((i * Math.PI) / 6), y + h / 2 + h * 0.32 * Math.sin((i * Math.PI) / 6), h * 0.065, '#ffd23f');
  return s;
};
const flagVE = (x, y, w, h) => {
  let s = `<rect x="${x}" y="${y}" width="${w}" height="${h / 3}" fill="#fcd116"/><rect x="${x}" y="${y + h / 3}" width="${w}" height="${h / 3}" fill="#00247d"/><rect x="${x}" y="${y + (2 * h) / 3}" width="${w}" height="${h / 3}" fill="#cf142b"/>`;
  for (let i = 0; i < 8; i++) {
    const a = Math.PI * (0.82 - (0.64 * i) / 7);
    s += star(x + w / 2 + h * 0.26 * Math.cos(a), y + h * 0.62 - h * 0.26 * Math.sin(a), h * 0.045, '#fff');
  }
  return s + frame(x, y, w, h);
};
const pill = (x, y, text, bg = '#13213c', size = 10) =>
  `<rect x="${x}" y="${y}" width="${(text.length * size * 0.71 + 12).toFixed(0)}" height="${size + 7}" rx="3" fill="${bg}"/><text x="${x + 6}" y="${y + size + 2}" font-size="${size}" font-weight="700" fill="#fff" letter-spacing="0.5">${text}</text>`;
const label = (x, y, t, size = 10, fill = '#3a2a12', anchor = 'start') =>
  `<text x="${x}" y="${y}" font-size="${size}" font-weight="700" fill="${fill}" letter-spacing="0.6" text-anchor="${anchor}">${t}</text>`;

// ---------- lead drawings (322 x 140, shown from y 14 to 126) ----------
const LEAD_ART = {
  tarmac() {
    let s = `<rect width="322" height="140" fill="#f1e3c8"/><circle cx="276" cy="34" r="15" fill="#f4b860"/>`;
    const sky = [[0, 30], [16, 46], [30, 24], [44, 58], [60, 76], [76, 40], [92, 52], [108, 34], [124, 62], [140, 44], [156, 28], [170, 50], [186, 36], [204, 58], [220, 30], [236, 46], [252, 26], [268, 40], [284, 54], [300, 32]];
    for (const [x, h] of sky) s += `<rect x="${x}" y="${92 - h}" width="15" height="${h}" fill="#cdb896"/>`;
    s += `<rect y="92" width="322" height="48" fill="#7d828a"/><line x1="0" y1="122" x2="322" y2="122" stroke="#f2f2f2" stroke-width="2" stroke-dasharray="14 10"/>`;
    s += `<polygon points="96,140 146,140 186,96 172,96" fill="#b3261e"/>`;
    s += `<polygon points="226,82 268,82 252,104 214,104" fill="#d7dce3"/><rect x="150" y="62" width="166" height="24" rx="12" fill="#fbfbfb" stroke="#b9c0ca"/>`;
    s += `<rect x="156" y="72" width="156" height="4" fill="#2b4c8c"/><polygon points="292,64 312,30 320,30 316,66" fill="#2b4c8c"/>`;
    for (let x = 178; x < 296; x += 10) s += `<rect x="${x}" y="65" width="5" height="4" rx="1" fill="#5b6b82"/>`;
    s += `<rect x="186" y="64" width="9" height="16" rx="2" fill="#5b6b82"/><polygon points="186,80 195,80 180,100 170,100" fill="#e9ebee" stroke="#9aa3ae" stroke-width="0.8"/>`;
    s += `<circle cx="150" cy="96" r="4.6" fill="#e2b48c"/><rect x="145" y="101" width="10" height="20" rx="3" fill="#1f2a44"/>`;
    s += `<circle cx="162" cy="96" r="4.6" fill="#e2b48c"/><rect x="157" y="101" width="10" height="20" rx="3" fill="#2f3340"/><path d="M154,107 L159,107" stroke="#1f2a44" stroke-width="3" stroke-linecap="round"/>`;
    [[10, flagUS], [40, flagCN], [70, flagRU]].forEach(([x, f]) => (s += `<rect x="${x}" y="44" width="2" height="56" fill="#555"/>` + f(x + 2, 46, 24, 15)));
    return s + pill(10, 104, 'SHENZHEN · APEC SUMMIT');
  },
  gulf() {
    let s = `<rect width="322" height="140" fill="#a9cfe0"/>`;
    s += `<path d="M118,0 L322,0 L322,74 L300,66 L268,54 L232,44 L196,36 L164,24 L136,10 Z" fill="#e3d3ae"/>`;
    s += `<path d="M0,0 L62,0 L70,20 L64,38 L84,56 L112,86 L146,106 L196,122 L240,140 L0,140 Z" fill="#ecdcb6"/>`;
    s += `<ellipse cx="186" cy="104" rx="5.5" ry="9" fill="#ecdcb6"/><ellipse cx="282" cy="82" rx="22" ry="5" fill="#e3d3ae" transform="rotate(-12 282 82)"/>`;
    s += `<path d="M220,40 Q140,10 52,32" fill="none" stroke="#7f1d1d" stroke-width="1.6" stroke-dasharray="5 4"/><path d="M246,52 Q218,70 190,98" fill="none" stroke="#7f1d1d" stroke-width="1.6" stroke-dasharray="5 4"/>`;
    const drone = (x, y, a) => `<g transform="translate(${x} ${y}) rotate(${a})"><polygon points="0,-5 9,0 0,5 2,0" fill="#3b0d0d"/></g>`;
    s += drone(150, 19, 196) + drone(212, 76, 132) + burst(58, 33, 11) + burst(190, 94, 9) + burst(282, 80, 9);
    s += `<path d="M322,104 L292,86" stroke="#1d4ed8" stroke-width="1.6" stroke-dasharray="4 3"/>`;
    s += label(250, 32, 'IRAN', 13) + label(10, 56, 'KUWAIT', 11) + label(132, 122, 'BAHRAIN', 11) + label(254, 104, 'QESHM', 10, '#0b3a66');
    return s + pill(8, 74, 'IRAN SAYS: US BASE TARGETED', '#7f1d1d', 9.5) + pill(8, 94, 'KUWAIT: NO DAMAGE REPORTED', '#13213c', 9.5);
  },
  house() {
    let s = `<rect width="322" height="140" fill="#e6edf6"/><rect y="112" width="322" height="28" fill="#b9c7a5"/>`;
    // the Capitol: two wings, a columned centre, the drum and the dome
    s += `<rect x="18" y="84" width="196" height="30" fill="#f8f7f2" stroke="#b5bcc6"/>`;
    for (let x = 24; x < 210; x += 9) if (x < 76 || x > 152) s += `<rect x="${x}" y="91" width="4" height="8" fill="#c9cfd8"/><rect x="${x}" y="103" width="4" height="7" fill="#c9cfd8"/>`;
    s += `<rect x="78" y="70" width="76" height="44" fill="#fbfaf6" stroke="#b5bcc6"/><polygon points="74,71 116,57 158,71" fill="#f1efe8" stroke="#b5bcc6"/>`;
    for (let i = 0; i < 8; i++) s += `<rect x="${(82 + i * 9.4).toFixed(1)}" y="74" width="3.6" height="38" fill="#d6dbe2"/>`;
    s += `<rect x="94" y="40" width="44" height="18" fill="#f4f2ec" stroke="#b5bcc6"/>`;
    for (let x = 97; x < 136; x += 6) s += `<rect x="${x}" y="43" width="2.6" height="13" fill="#d6dbe2"/>`;
    s += `<path d="M90,42 Q116,-4 142,42 Z" fill="#fbfaf6" stroke="#b5bcc6"/><rect x="112" y="12" width="8" height="12" fill="#fbfaf6" stroke="#b5bcc6"/><circle cx="116" cy="9" r="3" fill="#8a94a3"/>`;
    s += `<polygon points="84,114 148,114 158,124 74,124" fill="#e2e0d8"/>`;
    // a gavel over its sound block
    s += `<g transform="rotate(-28 262 70)"><rect x="232" y="64" width="60" height="7" rx="3" fill="#8b5a2b"/><rect x="284" y="50" width="16" height="34" rx="4" fill="#6b3f1d"/></g>`;
    s += `<rect x="236" y="98" width="56" height="12" rx="3" fill="#6b3f1d"/>`;
    return s + pill(148, 20, 'DEMOCRATS’ NOMINEE', '#1d4ed8') + label(116, 123, 'US HOUSE · FULL VOTE IN JANUARY', 10, '#374151', 'middle');
  },
};

// ---------- tile drawings (240 x 80, one wide scene per story) ----------
const TILE_ART = {
  yellowline() {
    let s = `<rect width="240" height="80" fill="#efe6d2"/><rect y="58" width="240" height="22" fill="#d8c59c"/>`;
    s += `<line x1="140" y1="0" x2="140" y2="80" stroke="#e8b10e" stroke-width="4" stroke-dasharray="8 5"/>`;
    // a tank rolling right, its gun already past the line; tents on the far side
    s += `<g transform="translate(16 -6) scale(1.55)"><rect x="24" y="42" width="40" height="11" rx="5.5" fill="#3f4a3c"/><rect x="28" y="33" width="32" height="10" rx="2" fill="#5b6b4f"/><rect x="38" y="26" width="16" height="9" rx="3" fill="#4a5a40"/><rect x="53" y="29" width="30" height="3" fill="#4a5a40"/>`;
    for (const x of [29, 37, 45, 53, 59]) s += `<circle cx="${x}" cy="47.5" r="3" fill="#232a22"/>`;
    s += `</g>`;
    for (const x of [168, 194, 220]) s += `<polygon points="${x - 12},59 ${x},38 ${x + 12},59" fill="#f8f5ee" stroke="#9c907c"/><polygon points="${x - 3},59 ${x},50 ${x + 3},59" fill="#6b6152"/>`;
    return s + label(146, 14, 'YELLOW LINE', 9, '#8a6a00') + label(8, 14, 'CENTRAL GAZA', 9, '#5b4a2e');
  },
  eu() {
    let s = `<rect width="240" height="80" fill="#e8ecf7"/>` + flagEU(14, 12, 66, 44);
    s += `<rect x="160" y="12" width="66" height="22" fill="#0057b7"/><rect x="160" y="34" width="66" height="22" fill="#ffd700"/>` + frame(160, 12, 66, 44);
    s += `<text x="120" y="34" text-anchor="middle" font-size="21" font-weight="800" fill="#1f3f99">€45bn</text>`;
    s += `<line x1="90" y1="44" x2="146" y2="44" stroke="#1f3f99" stroke-width="2.6"/><polygon points="152,44 142,38 142,50" fill="#1f3f99"/>`;
    return s + label(120, 73, 'PROPOSED LOAN FOR 2027', 9, '#13213c', 'middle');
  },
  measles() {
    let s = `<rect width="240" height="80" fill="#fbe9e7"/><g transform="translate(44 40)">`;
    for (let i = 0; i < 14; i++) {
      const c = Math.cos((i * Math.PI) / 7), d = Math.sin((i * Math.PI) / 7);
      s += `<line x1="${(19 * c).toFixed(1)}" y1="${(19 * d).toFixed(1)}" x2="${(26 * c).toFixed(1)}" y2="${(26 * d).toFixed(1)}" stroke="#b91c1c" stroke-width="2.4"/><circle cx="${(28 * c).toFixed(1)}" cy="${(28 * d).toFixed(1)}" r="3.2" fill="#b91c1c"/>`;
    }
    s += `<circle r="19" fill="#e05252"/><circle cx="-6" cy="-5" r="4" fill="#f6b4b4"/><circle cx="6" cy="6" r="3" fill="#f6b4b4"/><circle cx="8" cy="-8" r="2.2" fill="#f6b4b4"/></g>`;
    s += `<text x="122" y="48" text-anchor="middle" font-size="36" font-weight="800" fill="#7f1d1d">26</text>` + label(122, 66, 'YEARS', 10, '#7f1d1d', 'middle');
    return s + flagUS(172, 16, 52, 32) + label(198, 66, 'STATUS LOST', 8.5, '#7f1d1d', 'middle');
  },
  pact() {
    let s = `<rect width="240" height="80" fill="#eef0f5"/>` + flagUS(14, 12, 64, 40) + flagVE(162, 12, 64, 40);
    s += `<path d="M86,40 Q100,28 114,38 L126,38 Q140,28 154,40" fill="none" stroke="#13213c" stroke-width="3" stroke-linecap="round"/>`;
    s += `<rect x="108" y="34" width="24" height="10" rx="5" fill="#13213c"/>`;
    return s + label(120, 70, 'DEFENCE PACT · CARACAS', 9, '#13213c', 'middle');
  },
  senegal() {
    let s = `<rect width="240" height="80" fill="#f2efe4"/><rect x="14" y="12" width="22" height="44" fill="#00853f"/><rect x="36" y="12" width="22" height="44" fill="#fdef42"/><rect x="58" y="12" width="22" height="44" fill="#e31b23"/>`;
    s += star(47, 35, 9, '#00853f') + frame(14, 12, 66, 44);
    // a party card torn in two
    s += `<path d="M120,10 L164,10 L156,24 L166,36 L154,48 L160,60 L120,60 Z" fill="#fff" stroke="#9c907c"/><rect x="128" y="20" width="22" height="4" fill="#c7bfae"/><rect x="128" y="30" width="16" height="4" fill="#c7bfae"/>`;
    s += `<path d="M174,14 L222,14 L222,64 L172,64 L166,50 L176,38 L168,26 Z" fill="#fff" stroke="#9c907c" transform="rotate(7 196 39)"/>`;
    return s + label(172, 75, 'RULING PARTY SPLIT', 9, '#3a2a12', 'middle');
  },
  cyclone() {
    let s = `<rect width="240" height="80" fill="#a9cfe0"/><path d="M196,0 L240,0 L240,80 L226,80 Q216,62 222,48 Q212,32 218,16 Q214,8 216,0 Z" fill="#e3d3ae"/>`;
    s += `<g transform="translate(78 40)">`;
    for (const k of [0, 120, 240]) s += `<path d="M0,-8 A8,8 0 0 1 8,0 M0,-19 A19,19 0 0 1 19,0 M0,-30 A30,30 0 0 1 30,0" transform="rotate(${k})" fill="none" stroke="#fff" stroke-width="4.2" stroke-linecap="round"/>`;
    s += `<circle r="4" fill="#7fb3cc"/></g><path d="M116,40 Q160,30 204,30" fill="none" stroke="#7f1d1d" stroke-width="2.2" stroke-dasharray="5 3"/><polygon points="210,30 200,25 201,35" fill="#7f1d1d"/>`;
    return s + label(8, 74, 'AKVAN', 10, '#0b3a66') + label(234, 72, 'INDIA', 9, '#5b4a2e', 'end') + pill(118, 50, 'LANDFALL FRIDAY', '#7f1d1d', 9);
  },
  cop() {
    let s = `<rect width="240" height="80" fill="#f4ead5"/><circle cx="40" cy="40" r="28" fill="#4f8fbf"/><path d="M22,26 Q32,16 44,24 Q52,32 42,40 Q30,46 22,38 Z M44,50 Q58,44 62,54 Q56,62 46,60 Z" fill="#7fb069"/>`;
    s += `<rect x="82" y="8" width="12" height="54" rx="6" fill="#fff" stroke="#555"/><rect x="85.5" y="24" width="5" height="40" fill="#dc2626"/><circle cx="88" cy="66" r="9" fill="#dc2626"/>`;
    s += `<rect x="118" y="8" width="104" height="58" rx="3" fill="#fff" stroke="#9c907c"/>` + label(126, 22, 'DRAFT DEAL', 9, '#3a2a12');
    for (const y of [30, 38]) s += `<rect x="126" y="${y}" width="86" height="3.5" fill="#d6cfc0"/>`;
    s += label(126, 55, 'FOSSIL FUELS', 10, '#7f1d1d') + `<line x1="124" y1="51.5" x2="206" y2="51.5" stroke="#b91c1c" stroke-width="2"/>`;
    return s + label(170, 77, 'COP31 · ANTALYA', 8.5, '#5b4a2e', 'middle');
  },
  voyager() {
    let s = `<rect width="240" height="80" fill="#0f1628"/>`;
    for (const [x, y] of [[20, 8], [44, 68], [70, 12], [96, 62], [130, 8], [150, 70], [178, 14], [200, 66], [232, 10], [112, 74]]) s += `<circle cx="${x}" cy="${y}" r="1" fill="#cbd5e1"/>`;
    s += `<circle cx="24" cy="42" r="11" fill="#4ea3ff"/><path d="M18,36 Q24,32 28,38 Q26,44 20,44 Z" fill="#7fb069"/><line x1="40" y1="42" x2="196" y2="42" stroke="#cbd5e1" stroke-width="1.6" stroke-dasharray="4 4"/>`;
    s += label(118, 32, '1 LIGHT-DAY · 24 H SIGNAL', 9, '#fff', 'middle') + label(24, 68, 'EARTH', 8, '#cbd5e1', 'middle');
    s += `<circle cx="214" cy="42" r="13" fill="#e5e7eb"/><circle cx="214" cy="42" r="5" fill="#9ca3af"/><line x1="222" y1="52" x2="236" y2="66" stroke="#e5e7eb" stroke-width="1.8"/><line x1="206" y1="52" x2="200" y2="70" stroke="#e5e7eb" stroke-width="1.8"/>`;
    return s + label(214, 18, 'VOYAGER 1', 8, '#cbd5e1', 'middle');
  },
};

// ---------- the map: filled land, numbered pins for the stories with pictures, dots for the briefs ----------
const MAP_W = 380, LAT_TOP = 80, LAT_BOT = -56, MAP_H = Math.round((MAP_W * (LAT_TOP - LAT_BOT)) / 360);
const proj = ([lat, lon]) => [((lon + 180) / 360) * MAP_W, ((LAT_TOP - lat) / (LAT_TOP - LAT_BOT)) * MAP_H];
const rings = land.features.flatMap((f) => (f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates)).flat();
const landPath = rings.map((ring) => 'M' + ring.map(([lon, lat]) => proj([lat, lon]).map((v) => v.toFixed(1)).join(',')).join('L') + 'Z').join('');

function mapSvg(numbered, small) {
  let s = `<rect width="${MAP_W}" height="${MAP_H}" fill="#b9d8e8"/><path d="${landPath}" fill="#c3d7a6" stroke="#8fac74" stroke-width="0.6"/>`;
  for (const b of small) {
    const [x, y] = proj(b.pin);
    s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.1" fill="${color(b.region)}" stroke="#fff" stroke-width="0.9"/>`;
  }
  const placed = [];
  for (const st of numbered) {
    const [tx, ty] = proj(st.pin);
    let x = tx, y = ty, k = 0;
    while (placed.some(([px, py]) => Math.hypot(px - x, py - y) < 18.5) && k < 16) {
      k++;
      const a = -Math.PI / 2 + k * 1.15;
      x = tx + 19 * Math.ceil(k / 5) * Math.cos(a);
      y = ty + 19 * Math.ceil(k / 5) * Math.sin(a);
    }
    placed.push([x, y]);
    if (k) s += `<line x1="${tx.toFixed(1)}" y1="${ty.toFixed(1)}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="#1f2937" stroke-width="1"/><circle cx="${tx.toFixed(1)}" cy="${ty.toFixed(1)}" r="2" fill="#1f2937"/>`;
    s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="9" fill="${color(st.region)}" stroke="#fff" stroke-width="1.5"/>`;
    s += `<text x="${x.toFixed(1)}" y="${(y + 3.8).toFixed(1)}" text-anchor="middle" font-size="10.5" font-weight="800" fill="#fff">${st.id}</text>`;
  }
  return `<svg viewBox="0 0 ${MAP_W} ${MAP_H}" width="${MAP_W}" height="${MAP_H}" style="border-radius:4px;display:block">${s}</svg>`;
}

// ---------- page ----------
const tag = (st) => `<div class="tag" style="color:${color(st.region)}"><span class="num" style="background:${color(st.region)}">${st.id}</span>${esc(REGIONS[st.region][0])} · ${esc(st.beat)}</div>`;
const lead = (st) => `<div class="card lead"><svg class="art" viewBox="0 14 322 112">${LEAD_ART[st.art]()}</svg><div class="txt">${tag(st)}<h2>${esc(st.head)}</h2><p>${esc(st.deck)}</p></div></div>`;
const tile = (st) => `<div class="card tile"><svg class="art" viewBox="0 0 240 80">${TILE_ART[st.art]()}</svg><div class="txt">${tag(st)}<h3>${esc(st.head)}</h3><p>${esc(st.deck)}</p></div></div>`;

const all = [...data.leads, ...data.tiles, ...data.briefs];
const legendRegions = Object.keys(REGIONS).filter((r) => r !== 'global');
// how many stories each region gets, drawn as one bar under the date
const regionBar = Object.keys(REGIONS)
  .map((r) => [r, all.filter((s) => s.region === r).length])
  .filter(([, c]) => c)
  .map(([r, c]) => `<span style="flex:${c} 1 0;background:${color(r)}">${esc(REGIONS[r][0])} ${c}</span>`)
  .join('');

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
*{box-sizing:border-box;margin:0;padding:0}
body{position:relative;width:1024px;height:1024px;overflow:hidden;background:#f3ede1;color:#15171c;font-family:"Avenir Next","Helvetica Neue",Arial,sans-serif;padding:0 18px}
.mast{background:#13213c;color:#fff;margin:0 -18px;padding:9px 18px 7px}
.kick{display:flex;justify-content:space-between;font:700 12.5px "Avenir Next Condensed","Avenir Next",sans-serif;letter-spacing:.16em}
.kick b{color:#f2c14e}
h1{font-family:ui-serif,"New York",Georgia,serif;font-weight:800;font-size:78px;line-height:1;letter-spacing:-.012em;margin:2px 0 0;white-space:nowrap;display:inline-block}
.bar{display:flex;gap:2px;margin:5px 0 0}
.bar span{min-width:max-content;padding:2px 6px;border-radius:2px;color:#fff;text-align:center;font:700 10.5px "Avenir Next Condensed","Avenir Next",sans-serif;letter-spacing:.1em;text-transform:uppercase}
.card{background:#fffdf8;border:1px solid #d8ccb6;border-radius:6px;overflow:hidden}
.card .art{display:block;width:100%;height:auto}
.txt{padding:6px 10px 8px}
.leads{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;padding-top:9px}
.tag{display:flex;align-items:center;gap:5px;font:700 11px "Avenir Next Condensed","Avenir Next",sans-serif;letter-spacing:.08em;text-transform:uppercase;margin-bottom:3px;white-space:nowrap}
.num{display:inline-block;min-width:17px;height:17px;padding:0 3px;border-radius:9px;color:#fff;font:800 10.5px/17px "Avenir Next",sans-serif;text-align:center;letter-spacing:0}
h2{font-family:ui-serif,"New York",Georgia,serif;font-weight:800;font-size:25.5px;line-height:1.08;letter-spacing:-.012em}
.lead p{font-size:13.6px;line-height:1.3;color:#3a3f47;margin-top:4px}
.tiles{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px 12px;margin-top:9px}
.tile .txt{padding:5px 9px 7px}
.tile .tag{font-size:10px;margin-bottom:2px}.tile .num{min-width:15px;height:15px;font-size:9.5px;line-height:15px}
h3{font-family:ui-serif,"New York",Georgia,serif;font-weight:700;font-size:18.4px;line-height:1.08;letter-spacing:-.01em}
.tile p{font-size:12.4px;line-height:1.25;color:#3a3f47;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.bottom{display:grid;grid-template-columns:${MAP_W}px minmax(0,1fr);gap:16px;margin-top:11px;padding-top:7px;border-top:2px solid #15171c}
.lbl{font:700 12px "Avenir Next Condensed","Avenir Next",sans-serif;letter-spacing:.14em;margin-bottom:5px;display:flex;justify-content:space-between}
.lbl i{font:italic 10.5px "Avenir Next",sans-serif;letter-spacing:0;color:#555}
.legend{display:flex;flex-wrap:wrap;gap:3px 7px;font-size:9.3px;color:#3a3f47;margin-top:4px}
.legend span::before{content:"";display:inline-block;width:8px;height:8px;border-radius:4px;background:var(--c);margin-right:4px}
.check{margin-top:6px;padding:5px 8px;border-left:3px solid #b91c1c;background:#e9dfcb;font-size:10.4px;line-height:1.32;color:#3a3f47}
.check b{color:#b91c1c;font-size:9.8px;letter-spacing:.1em;margin-right:4px}
ul{list-style:none;columns:2;column-gap:14px}
li{font-size:12.2px;line-height:1.3;break-inside:avoid;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
li .num{min-width:17px;height:15px;font-size:9.4px;line-height:15px;margin-right:4px;vertical-align:1px;border-radius:8px}
.foot{position:absolute;left:18px;right:18px;bottom:7px;border-top:1px solid #15171c55;padding-top:5px;font-size:10.3px;white-space:nowrap;color:#3a3f47;display:flex;justify-content:space-between}
</style></head><body>
<div class="mast"><div class="kick"><b>THE DAY IN WORLD NEWS</b><span>${all.length} STORIES · ${data.continents} CONTINENTS · ALL FROM ONE DAY</span></div><h1>${esc(data.date)}</h1><div class="bar">${regionBar}</div></div>
<div class="leads">${data.leads.map(lead).join('')}</div>
<div class="tiles">${data.tiles.map(tile).join('')}</div>
<div class="bottom">
  <div><div class="lbl">WHERE IT HAPPENED<i>numbers = stories above · dots = briefs</i></div>${mapSvg([...data.leads, ...data.tiles].filter((s) => s.pin), data.briefs.filter((b) => b.pin))}
  <div class="legend">${legendRegions.map((r) => `<span style="--c:${color(r)}">${REGIONS[r][0]}</span>`).join('')}</div>
  <div class="check"><b>DATE CHECK</b>${esc(data.datecheck)}</div></div>
  <div><div class="lbl">ALSO ON WEDNESDAY 18 NOVEMBER</div><ul>${data.briefs.map((b) => `<li><span class="num" style="background:${color(b.region)}">${b.id}</span><b>${esc(b.place)}:</b> ${esc(b.text)}</li>`).join('')}</ul></div>
</div>
<div class="foot"><span>${esc(data.footer)}</span><span>Sources: ${esc(data.sources)} · Original drawings</span></div>
<script>
// fit the date to the page width, then check the layout: nothing past the footer, no line cut
// short, no headline over two lines; any failure paints the page red
document.fonts.ready.then(() => {
  const h = document.querySelector('h1'); let f = 78;
  while (h.getBoundingClientRect().width > 988 && f > 30) h.style.fontSize = (f -= 0.5) + 'px';
  const end = Math.max(...[...document.querySelectorAll('.bottom > div, .tiles')].map((d) => d.getBoundingClientRect().bottom));
  const cut = [...document.querySelectorAll('li, .tile p, .foot')].filter((el) => el.scrollWidth > el.clientWidth + 1).length;
  const tall = [...document.querySelectorAll('h2, h3, .lead p')].filter((el) => el.getBoundingClientRect().height > 2.3 * parseFloat(getComputedStyle(el).lineHeight)).length;
  const foot = document.querySelector('.foot').getBoundingClientRect().top;
  document.body.dataset.fit = Math.round(end) + '/' + Math.round(foot) + '/' + (cut + tall);
  if (end > foot - 2 || cut + tall) document.body.style.background = '#ff8080';
});
</script>
</body></html>`;

mkdirSync(here('./out'), { recursive: true });
writeFileSync(here('./out/front.html'), html);
const page = `file://${here('./out/front.html')}`;
const chrome = (...args) => execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1', '--window-size=1024,1024', '--virtual-time-budget=3000', ...args, page], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
const fit = chrome('--dump-dom').match(/data-fit="(\d+)\/(\d+)\/(\d+)"/);
console.log(fit ? `content ends at ${fit[1]}px, footer starts at ${fit[2]}px, ${fit[3]} lines cut short or too long` : 'layout check did not run');
if (!fit || +fit[1] > +fit[2] - 2 || +fit[3] > 0) process.exitCode = 1;
chrome(`--screenshot=${here('./entry.png')}`);
const bytes = statSync(here('./entry.png')).size;
console.log(`entry.png ${bytes} bytes${bytes > 1048576 ? '  TOO BIG (limit 1 MiB)' : ''}`);
