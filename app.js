/* KLM QR Studio — semua dibuat di perangkat, tanpa server */
'use strict';
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const f3 = n => +(+n).toFixed(3);
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const LS = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } }
};

/* ---------------- STATE ---------------- */
const DEFAULT = {
  type: 'url',
  fields: {},
  ecl: 'Q', boost: true, mask: -1, minVer: 1, margin: 2,
  dotStyle: 'rounded', dotScale: 0.9,
  eyeFrame: 'rounded', eyeBall: 'rounded',
  dotFill: { mode: 'solid', c1: '#1b1640', c2: '#6d5efc', angle: 45 },
  eyeSame: true, eyeFrameColor: '#6d5efc', eyeBallColor: '#1b1640',
  bgTransparent: false,
  bgFill: { mode: 'solid', c1: '#ffffff', c2: '#efeaff', angle: 135 },
  radius: 2,
  logo: { src: null, size: 22, margin: 1, round: 20, hide: true, bg: true, bgColor: '#ffffff' },
  frame: { style: 'none', text: 'PINDAI SAYA', color: '#1b1640', textColor: '#ffffff', font: 'sans', weight: '800', size: 3, spacing: 0.15 },
  texts: [], textBg: { mode: 'auto', color: '#ffffff' },
  photo: { src: null, proc: null, avg: 0, mode: 'halftone', shape: 'square', dot: 0.42, opacity: 1, light: '#ffffff',
    zoom: 1, px: 50, py: 50, bright: 0, contrast: 0, gray: false, minVer: 6, safe: true },
  exportSize: 1024, fmt: 'png', quality: 0.92, fileName: 'qr-code'
};
const clone = o => JSON.parse(JSON.stringify(o));
function merge(base, add) {
  const out = clone(base);
  for (const k in add || {}) {
    if (add[k] && typeof add[k] === 'object' && !Array.isArray(add[k]) && base[k] && typeof base[k] === 'object') out[k] = merge(base[k], add[k]);
    else out[k] = add[k];
  }
  return out;
}
let S = merge(DEFAULT, LS.get('qrs.state', {}));
const STYLE_KEYS = ['dotStyle','dotScale','eyeFrame','eyeBall','dotFill','eyeSame','eyeFrameColor','eyeBallColor','bgTransparent','bgFill','radius','logo','frame','margin','ecl','texts','textBg'];
const pickStyle = (st = S) => { const o = {}; STYLE_KEYS.forEach(k => o[k] = clone(st[k])); return o; };

/* ---------------- ICONS ---------------- */
const IC = {
  url:'<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
  text:'<path d="M4 7V4h16v3M9 20h6M12 4v16"/>',
  wifi:'<path d="M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0M2 9a15 15 0 0 1 20 0"/><circle cx="12" cy="19.5" r=".6"/>',
  vcard:'<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="11" r="2.5"/><path d="M5.5 17a4 4 0 0 1 7 0M15 9h3M15 13h3"/>',
  email:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  sms:'<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  tel:'<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>',
  wa:'<path d="M3 21l1.6-4.7A9 9 0 1 1 8 19.6z"/><path d="M9 8.5c0 3.5 3 6.5 6.5 6.5l1-1.6-2-1-1 .8c-1-.5-2-1.5-2.5-2.5l.8-1-1-2z"/>',
  geo:'<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>',
  event:'<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  social:'<circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8"/>',
  pay:'<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M6 15h4"/>'
};
const icon = k => `<svg viewBox="0 0 24 24">${IC[k]}</svg>`;

/* ---------------- CONTENT TYPES ---------------- */
const wifiEsc = s => String(s || '').replace(/([\\;,:"])/g, '\\$1');
const vEsc = s => String(s || '').replace(/([\\;,])/g, '\\$1').replace(/\n/g, '\\n');
const pad2 = n => String(n).padStart(2, '0');
const icsDate = v => { if (!v) return ''; const d = new Date(v); return `${d.getUTCFullYear()}${pad2(d.getUTCMonth()+1)}${pad2(d.getUTCDate())}T${pad2(d.getUTCHours())}${pad2(d.getUTCMinutes())}00Z`; };
const digits = s => String(s || '').replace(/[^\d+]/g, '');

const TYPES = {
  url: { label:'Tautan', fields:[{k:'url',l:'Alamat web (URL)',t:'url',ph:'https://contoh.com',d:'https://klm.id'}],
    build:f => { let u = (f.url||'').trim(); if (u && !/^[a-z][a-z0-9+.-]*:/i.test(u)) u = 'https://' + u; return u; } },
  text: { label:'Teks', fields:[{k:'text',l:'Teks',t:'textarea',ph:'Tulis apa saja…',d:'Halo dari KLM QR Studio!'}], build:f => f.text || '' },
  wifi: { label:'WiFi', fields:[
      {k:'ssid',l:'Nama jaringan (SSID)',ph:'WiFi-Rumah'},
      {k:'pass',l:'Kata sandi',t:'password'},
      {k:'enc',l:'Keamanan',t:'select',o:[['WPA','WPA/WPA2/WPA3'],['WEP','WEP'],['nopass','Tanpa sandi']],d:'WPA',half:1},
      {k:'hidden',l:'Jaringan tersembunyi',t:'switch'}],
    build:f => `WIFI:T:${f.enc||'WPA'};S:${wifiEsc(f.ssid)};${f.enc==='nopass'?'':`P:${wifiEsc(f.pass)};`}${f.hidden?'H:true;':''};` },
  vcard: { label:'Kontak', fields:[
      {k:'fn',l:'Nama depan',half:1},{k:'ln',l:'Nama belakang',half:1},
      {k:'org',l:'Perusahaan',half:1},{k:'title',l:'Jabatan',half:1},
      {k:'tel',l:'Telepon',t:'tel',half:1},{k:'mob',l:'HP',t:'tel',half:1},
      {k:'email',l:'Email',t:'email'},{k:'web',l:'Situs web',t:'url'},
      {k:'adr',l:'Alamat'},{k:'note',l:'Catatan',t:'textarea'}],
    build:f => ['BEGIN:VCARD','VERSION:3.0',`N:${vEsc(f.ln)};${vEsc(f.fn)};;;`,`FN:${vEsc([f.fn,f.ln].filter(Boolean).join(' '))}`,
      f.org&&`ORG:${vEsc(f.org)}`,f.title&&`TITLE:${vEsc(f.title)}`,f.tel&&`TEL;TYPE=WORK,VOICE:${f.tel}`,f.mob&&`TEL;TYPE=CELL:${f.mob}`,
      f.email&&`EMAIL:${f.email}`,f.web&&`URL:${f.web}`,f.adr&&`ADR:;;${vEsc(f.adr)};;;;`,f.note&&`NOTE:${vEsc(f.note)}`,'END:VCARD'].filter(Boolean).join('\n') },
  email: { label:'Email', fields:[{k:'to',l:'Kepada',t:'email',ph:'nama@contoh.com'},{k:'sub',l:'Subjek'},{k:'body',l:'Isi pesan',t:'textarea'}],
    build:f => { const q = []; if (f.sub) q.push('subject=' + encodeURIComponent(f.sub)); if (f.body) q.push('body=' + encodeURIComponent(f.body)); return `mailto:${f.to||''}${q.length?'?'+q.join('&'):''}`; } },
  sms: { label:'SMS', fields:[{k:'num',l:'Nomor tujuan',t:'tel'},{k:'msg',l:'Pesan',t:'textarea'}], build:f => `SMSTO:${digits(f.num)}:${f.msg||''}` },
  tel: { label:'Telepon', fields:[{k:'num',l:'Nomor telepon',t:'tel',ph:'+62812…'}], build:f => `tel:${digits(f.num)}` },
  wa: { label:'WhatsApp', fields:[{k:'num',l:'Nomor WhatsApp',t:'tel',ph:'0812… atau +62812…'},{k:'msg',l:'Pesan otomatis',t:'textarea'}],
    build:f => { let n = String(f.num||'').replace(/\D/g,''); if (n.startsWith('0')) n = '62' + n.slice(1); return `https://wa.me/${n}${f.msg?'?text='+encodeURIComponent(f.msg):''}`; } },
  geo: { label:'Lokasi', fields:[{k:'lat',l:'Lintang',t:'number',half:1,ph:'-6.2'},{k:'lng',l:'Bujur',t:'number',half:1,ph:'106.8'},
      {k:'fmt',l:'Format',t:'select',o:[['gmaps','Tautan Google Maps'],['geo','geo: (standar)']],d:'gmaps'},{k:'q',l:'Nama tempat (opsional)'}],
    build:f => f.fmt==='geo' ? `geo:${f.lat||0},${f.lng||0}${f.q?'?q='+encodeURIComponent(f.q):''}` : `https://www.google.com/maps/search/?api=1&query=${f.lat||0},${f.lng||0}` },
  event: { label:'Acara', fields:[{k:'sum',l:'Judul acara'},{k:'start',l:'Mulai',t:'datetime-local',half:1},{k:'end',l:'Selesai',t:'datetime-local',half:1},{k:'loc',l:'Tempat'},{k:'desc',l:'Keterangan',t:'textarea'}],
    build:f => ['BEGIN:VEVENT',`SUMMARY:${vEsc(f.sum)}`,f.start&&`DTSTART:${icsDate(f.start)}`,f.end&&`DTEND:${icsDate(f.end)}`,f.loc&&`LOCATION:${vEsc(f.loc)}`,f.desc&&`DESCRIPTION:${vEsc(f.desc)}`,'END:VEVENT'].filter(Boolean).join('\n') },
  social: { label:'Sosmed', fields:[{k:'net',l:'Platform',t:'select',o:[['ig','Instagram'],['tt','TikTok'],['yt','YouTube'],['fb','Facebook'],['x','X / Twitter'],['tg','Telegram'],['li','LinkedIn']],d:'ig'},{k:'user',l:'Nama pengguna',ph:'tanpa @'}],
    build:f => { const u = String(f.user||'').replace(/^@/,''); return ({ig:`https://instagram.com/${u}`,tt:`https://www.tiktok.com/@${u}`,yt:`https://www.youtube.com/@${u}`,fb:`https://facebook.com/${u}`,x:`https://x.com/${u}`,tg:`https://t.me/${u}`,li:`https://www.linkedin.com/in/${u}`})[f.net||'ig']; } },
  pay: { label:'Transfer', fields:[{k:'bank',l:'Bank / dompet digital',ph:'BCA, DANA, GoPay…'},{k:'acc',l:'Nomor rekening / akun'},{k:'name',l:'Atas nama'},{k:'amt',l:'Nominal (opsional)',t:'number'},{k:'note',l:'Keterangan'}],
    build:f => [`${f.bank||'Bank'}: ${f.acc||''}`, f.name&&`a.n. ${f.name}`, f.amt&&`Nominal: Rp ${Number(f.amt).toLocaleString('id-ID')}`, f.note&&`Ket: ${f.note}`].filter(Boolean).join('\n') }
};
function fieldsOf(type) {
  const t = TYPES[type]; S.fields[type] = S.fields[type] || {};
  const f = S.fields[type];
  t.fields.forEach(x => { if (f[x.k] === undefined && x.d !== undefined) f[x.k] = x.d; });
  return f;
}
const dataOf = (st = S) => { const t = TYPES[st.type] || TYPES.text; return t.build(st.fields[st.type] || {}); };

/* ---------------- QR ENCODE ---------------- */
const ECC = () => qrcodegen.QrCode.Ecc;
function encode(text, st = S) {
  const lv = { L: ECC().LOW, M: ECC().MEDIUM, Q: ECC().QUARTILE, H: ECC().HIGH };
  let ecl = lv[st.ecl] || lv.Q;
  if (st.logo.src && (st.ecl === 'L' || st.ecl === 'M')) ecl = lv.Q;
  const hasPh = !!(st.photo && st.photo.proc);
  if (hasPh) ecl = lv.H;
  const segs = qrcodegen.QrSegment.makeSegments(text || ' ');
  // logo menutup sebagian modul: versi kecil terlalu rapuh, jadi naikkan versi minimum
  let minV = +st.minVer || 1;
  if (st.logo.src) minV = Math.max(minV, st.logo.size > 30 && st.logo.margin > .5 ? 7 : 5);
  if (hasPh) minV = Math.max(minV, +st.photo.minVer || 1);
  return qrcodegen.QrCode.encodeSegments(segs, ecl, minV, 40, +st.mask, st.boost || !!st.logo.src);
}

/* ---------------- SHAPES ---------------- */
function rr(x, y, w, h, r) {
  const m = Math.min(w, h) / 2; let [a, b, c, d] = r.map(v => Math.min(v || 0, m));
  return `M${f3(x+a)} ${f3(y)}H${f3(x+w-b)}${b?`A${f3(b)} ${f3(b)} 0 0 1 ${f3(x+w)} ${f3(y+b)}`:''}V${f3(y+h-c)}${c?`A${f3(c)} ${f3(c)} 0 0 1 ${f3(x+w-c)} ${f3(y+h)}`:''}H${f3(x+d)}${d?`A${f3(d)} ${f3(d)} 0 0 1 ${f3(x)} ${f3(y+h-d)}`:''}V${f3(y+a)}${a?`A${f3(a)} ${f3(a)} 0 0 1 ${f3(x+a)} ${f3(y)}`:''}Z`;
}
const circ = (cx, cy, r) => `M${f3(cx-r)} ${f3(cy)}a${f3(r)} ${f3(r)} 0 1 0 ${f3(2*r)} 0a${f3(r)} ${f3(r)} 0 1 0 ${f3(-2*r)} 0Z`;
const diamond = (cx, cy, r) => `M${f3(cx)} ${f3(cy-r)}L${f3(cx+r)} ${f3(cy)}L${f3(cx)} ${f3(cy+r)}L${f3(cx-r)} ${f3(cy)}Z`;
function star(cx, cy, R, pts = 5, inner = .45) {
  let p = ''; for (let i = 0; i < pts * 2; i++) { const rad = i % 2 ? R * inner : R, a = Math.PI * i / pts - Math.PI / 2; p += (i ? 'L' : 'M') + f3(cx + rad * Math.cos(a)) + ' ' + f3(cy + rad * Math.sin(a)); }
  return p + 'Z';
}
function heart(cx, cy, s) {
  const x = cx, y = cy; s *= .52;
  return `M${f3(x)} ${f3(y+s*.9)}C${f3(x-s*1.4)} ${f3(y)} ${f3(x-s*.9)} ${f3(y-s*1.1)} ${f3(x)} ${f3(y-s*.45)}C${f3(x+s*.9)} ${f3(y-s*1.1)} ${f3(x+s*1.4)} ${f3(y)} ${f3(x)} ${f3(y+s*.9)}Z`;
}

const DOT_STYLES = [
  ['square','Kotak'],['rounded','Membulat'],['extra','Halus'],['dots','Bulat'],['classy','Klasik'],['classy-r','Klasik bulat'],
  ['mini','Kotak kecil'],['diamond','Wajik'],['star','Bintang'],['heart','Hati'],['vlines','Garis tegak'],['hlines','Garis datar'],['cross','Plus']
];
function dotPath(style, x, y, nb, s) {
  const e = .03, R = .5;
  switch (style) {
    case 'square': return rr(x, y, 1 + (nb.r ? e : 0), 1 + (nb.b ? e : 0), [0,0,0,0]);
    case 'rounded': case 'extra': {
      const r = style === 'rounded' ? .3 : R;
      return rr(x, y, 1 + (nb.r ? e : 0), 1 + (nb.b ? e : 0), [!nb.t&&!nb.l?r:0, !nb.t&&!nb.r?r:0, !nb.b&&!nb.r?r:0, !nb.b&&!nb.l?r:0]);
    }
    case 'classy': case 'classy-r': {
      const r2 = style === 'classy-r' ? .2 : 0;
      return rr(x, y, 1 + (nb.r ? e : 0), 1 + (nb.b ? e : 0), [!nb.t&&!nb.l?R:0, !nb.t&&!nb.r?r2:0, !nb.b&&!nb.r?R:0, !nb.b&&!nb.l?r2:0]);
    }
    case 'dots': return circ(x + .5, y + .5, .5 * s);
    case 'mini': { const w = s * .85, o = (1 - w) / 2; return rr(x + o, y + o, w, w, [.12,.12,.12,.12]); }
    case 'diamond': return diamond(x + .5, y + .5, .56 * s);
    case 'star': return star(x + .5, y + .52, .62 * s);
    case 'heart': return heart(x + .5, y + .5, s);
    case 'cross': { const w = .36 * s, o = (1 - w) / 2, L = s, lo = (1 - L) / 2; return rr(x + o, y + lo, w, L, [.06,.06,.06,.06]) + rr(x + lo, y + o, L, w, [.06,.06,.06,.06]); }
    case 'vlines': { const w = .78 * s, o = (1 - w) / 2, rt = !nb.t ? w / 2 : 0, rb = !nb.b ? w / 2 : 0; return rr(x + o, y, w, 1 + (nb.b ? e : 0), [rt, rt, rb, rb]); }
    case 'hlines': { const h = .78 * s, o = (1 - h) / 2, rl = !nb.l ? h / 2 : 0, rrr = !nb.r ? h / 2 : 0; return rr(x, y + o, 1 + (nb.r ? e : 0), h, [rl, rrr, rrr, rl]); }
  }
  return rr(x, y, 1, 1, [0,0,0,0]);
}

const EYE_FRAMES = [['square','Kotak'],['rounded','Membulat'],['soft','Lembut'],['circle','Lingkaran'],['leaf','Daun'],['drop','Tetes'],['dash','Putus'],['dotted','Titik']];
const EYE_BALLS = [['square','Kotak'],['rounded','Membulat'],['circle','Bulat'],['leaf','Daun'],['drop','Tetes'],['diamond','Wajik'],['star','Bintang'],['heart','Hati']];
// idx: 0=kiri atas,1=kanan atas,2=kiri bawah ; sudut tajam menghadap ke tengah QR
const SHARP = [2, 3, 1];
function cornersFor(style, idx, big) {
  const sharp = SHARP[idx]; const arr = [big, big, big, big];
  if (style === 'drop') { arr[sharp] = 0; return arr; }
  if (style === 'leaf') { arr[sharp] = 0; arr[(sharp + 2) % 4] = 0; return arr; }
  return arr;
}
function eyeFramePath(style, x, y, idx) {
  switch (style) {
    case 'square': return rr(x, y, 7, 7, [0,0,0,0]) + rr(x + 1, y + 1, 5, 5, [0,0,0,0]);
    case 'rounded': return rr(x, y, 7, 7, [1.6,1.6,1.6,1.6]) + rr(x + 1, y + 1, 5, 5, [.8,.8,.8,.8]);
    case 'soft': return rr(x, y, 7, 7, [2.6,2.6,2.6,2.6]) + rr(x + 1, y + 1, 5, 5, [1.7,1.7,1.7,1.7]);
    case 'circle': return circ(x + 3.5, y + 3.5, 3.5) + circ(x + 3.5, y + 3.5, 2.5);
    case 'leaf': case 'drop': return rr(x, y, 7, 7, cornersFor(style, idx, 3)) + rr(x + 1, y + 1, 5, 5, cornersFor(style, idx, 2));
    case 'dash': { let p = ''; for (let i = 0; i < 7; i++) for (let j = 0; j < 7; j++) if (i === 0 || j === 0 || i === 6 || j === 6) p += rr(x + i + .08, y + j + .08, .84, .84, [.2,.2,.2,.2]); return p; }
    case 'dotted': { let p = ''; for (let i = 0; i < 7; i++) for (let j = 0; j < 7; j++) if (i === 0 || j === 0 || i === 6 || j === 6) p += circ(x + i + .5, y + j + .5, .46); return p; }
  }
  return rr(x, y, 7, 7, [0,0,0,0]) + rr(x + 1, y + 1, 5, 5, [0,0,0,0]);
}
function eyeBallPath(style, x, y, idx) {
  const cx = x + 1.5, cy = y + 1.5;
  switch (style) {
    case 'square': return rr(x, y, 3, 3, [0,0,0,0]);
    case 'rounded': return rr(x, y, 3, 3, [.9,.9,.9,.9]);
    case 'circle': return circ(cx, cy, 1.5);
    case 'leaf': case 'drop': return rr(x, y, 3, 3, cornersFor(style, idx, 1.5));
    case 'diamond': return diamond(cx, cy, 1.85);
    case 'star': return star(cx, cy + .08, 1.9, 5, .5);
    case 'heart': return heart(cx, cy + .05, 3.1);
  }
  return rr(x, y, 3, 3, [0,0,0,0]);
}

/* ---------------- RENDER ---------------- */
let uid = 0;
function paintDef(id, fill, box) {
  if (fill.mode === 'solid') return { def: '', ref: fill.c1 };
  const [x0, y0, w] = box;
  if (fill.mode === 'radial') {
    return { def: `<radialGradient id="${id}" gradientUnits="userSpaceOnUse" cx="${f3(x0+w/2)}" cy="${f3(y0+w/2)}" r="${f3(w*.62)}"><stop offset="0" stop-color="${fill.c1}"/><stop offset="1" stop-color="${fill.c2}"/></radialGradient>`, ref: `url(#${id})` };
  }
  const a = (fill.angle || 0) * Math.PI / 180, cx = x0 + w / 2, cy = y0 + w / 2, L = w / 2;
  const dx = Math.cos(a) * L, dy = Math.sin(a) * L;
  return { def: `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${f3(cx-dx)}" y1="${f3(cy-dy)}" x2="${f3(cx+dx)}" y2="${f3(cy+dy)}"><stop offset="0" stop-color="${fill.c1}"/><stop offset="1" stop-color="${fill.c2}"/></linearGradient>`, ref: `url(#${id})` };
}
const FONTS = {
  sans: '"Segoe UI",system-ui,-apple-system,Roboto,Arial,sans-serif',
  rounded: '"Arial Rounded MT Bold","Nunito","Varela Round","Segoe UI",system-ui,sans-serif',
  serif: 'Georgia,"Times New Roman",serif',
  mono: 'Consolas,"SF Mono",Menlo,"Courier New",monospace',
  condensed: '"Bahnschrift","Arial Narrow","Roboto Condensed",sans-serif-condensed,Arial,sans-serif'
};

function renderSVG(st = S, text = dataOf(st), opt = {}) {
  let qr; try { qr = encode(text, st); } catch (err) { return { svg: '', error: 'Data terlalu panjang untuk QR code.' }; }
  const n = qr.size, m = +st.margin, Q = n + 2 * m, id = 'q' + (++uid);
  const isFinder = (x, y) => (x < 7 && y < 7) || (x >= n - 7 && y < 7) || (x < 7 && y >= n - 7);
  // logo
  const lg = st.logo, hasLogo = !!lg.src && !opt.noLogo;
  const L = hasLogo ? n * lg.size / 100 : 0, lx = (n - L) / 2;
  const hideR = hasLogo && lg.hide ? [lx - lg.margin, lx + L + lg.margin] : null;
  const hidden = (x, y) => hideR && x + 1 > hideR[0] && x < hideR[1] && y + 1 > hideR[0] && y < hideR[1];
  const on = (x, y) => x >= 0 && y >= 0 && x < n && y < n && qr.getModule(x, y) && !isFinder(x, y) && !hidden(x, y);
  let dp = '';
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    if (!on(x, y)) continue;
    dp += dotPath(st.dotStyle, x + m, y + m, { t: on(x, y - 1), r: on(x + 1, y), b: on(x, y + 1), l: on(x - 1, y) }, +st.dotScale);
  }
  // foto
  const ph = Object.assign({}, DEFAULT.photo, st.photo), hasPhoto = !!ph.proc && !opt.noPhoto, half = hasPhoto && ph.mode === 'halftone';
  let lp = '', photoUnder = '', photoDef = '';
  if (half) {
    // modul fungsi (timing, alignment, format, versi) digambar penuh supaya mudah dikenali pemindai
    const full = new Set(), mark = (x, y) => { if (x >= 0 && y >= 0 && x < n && y < n) full.add(y * n + x); };
    for (let i = 0; i < n; i++) { mark(6, i); mark(i, 6); }
    for (let i = 0; i < 9; i++) { mark(8, i); mark(i, 8); }
    for (let i = 0; i < 8; i++) { mark(n - 1 - i, 8); mark(8, n - 1 - i); }
    const ap = qr.getAlignmentPatternPositions(), last = ap.length - 1;
    ap.forEach((a, i) => ap.forEach((b, j) => { if ((i === 0 && j === 0) || (i === 0 && j === last) || (i === last && j === 0)) return;
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) mark(a + dx, b + dy); }));
    if (qr.version >= 7) for (let i = 0; i < 6; i++) for (let j = 0; j < 3; j++) { mark(n - 11 + j, i); mark(i, n - 11 + j); }
    const ds = Math.max(.15, Math.min(1, +ph.dot)), o = (1 - ds) / 2;
    const cell = (x, y, f) => f ? rr(x, y, 1.02, 1.02, [0,0,0,0]) : ph.shape === 'circle' ? circ(x + .5, y + .5, ds / 2) : rr(x + o, y + o, ds, ds, Array(4).fill(ds * .18));
    dp = '';
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      if (isFinder(x, y) || hidden(x, y)) continue;
      const f = full.has(y * n + x);
      if (qr.getModule(x, y)) dp += cell(x + m, y + m, f); else lp += cell(x + m, y + m, f);
    }
    [[0, 0], [n - 8, 0], [0, n - 8]].forEach(([fx, fy]) => { lp += rr(fx + m, fy + m, 8, 8, [0,0,0,0]); });
    photoUnder = `<image href="${ph.proc}" x="${f3(m)}" y="${f3(m)}" width="${n}" height="${n}" preserveAspectRatio="none" opacity="${f3(ph.opacity)}"/>`;
  } else if (hasPhoto) {
    photoDef = `<pattern id="${id}p" patternUnits="userSpaceOnUse" x="${f3(m)}" y="${f3(m)}" width="${n}" height="${n}"><image href="${ph.proc}" width="${n}" height="${n}" preserveAspectRatio="none"/></pattern>`;
  }
  let fp = '', bp = '';
  [[0, 0], [n - 7, 0], [0, n - 7]].forEach(([ex, ey], i) => { fp += eyeFramePath(st.eyeFrame, ex + m, ey + m, i); bp += eyeBallPath(st.eyeBall, ex + m + 2, ey + m + 2, i); });

  // layout & frame
  const fr = st.frame, fs = +fr.size, hasText = fr.style !== 'none' && fr.text.trim();
  const P = 1.6; let W = Q, H = Q, ox = 0, oy = 0, back = '', fore = '';
  const qrRad = +st.radius;
  const textEl = (x, y, color) => hasText ? `<text x="${f3(x)}" y="${f3(y)}" text-anchor="middle" dominant-baseline="central" font-family='${FONTS[fr.font] || FONTS.sans}' font-weight="${fr.weight}" font-size="${f3(fs)}" letter-spacing="${f3(fs * fr.spacing)}" fill="${color}">${esc(fr.text)}</text>` : '';
  const th = hasText ? fs * 2.3 : 0;
  if (fr.style === 'bottom' || fr.style === 'top') {
    W = Q + 2 * P; H = Q + 2 * P + (hasText ? th - P * .35 : 0);
    ox = P; oy = fr.style === 'top' ? H - P - Q : P;
    back = `<rect width="${f3(W)}" height="${f3(H)}" rx="${f3(qrRad + P * .8)}" fill="${fr.color}"/>`;
    const ty = fr.style === 'top' ? (oy) / 2 + .1 : oy + Q + (H - oy - Q) / 2 - .05;
    fore = textEl(W / 2, ty, fr.textColor);
  } else if (fr.style === 'outline') {
    const sw = .7; W = Q + 2 * P; H = Q + 2 * P + (hasText ? th - P * .3 : 0); ox = P; oy = P;
    back = `<rect x="${sw/2}" y="${sw/2}" width="${f3(W - sw)}" height="${f3(H - sw)}" rx="${f3(qrRad + P * .8)}" fill="${st.bgTransparent ? 'none' : 'var(--x)'}" stroke="${fr.color}" stroke-width="${sw}"/>`;
    fore = textEl(W / 2, oy + Q + (H - oy - Q) / 2 - .1, fr.color);
  } else if (fr.style === 'bubble' || fr.style === 'pill') {
    const gap = fr.style === 'bubble' ? 1.6 : .8, ph = fs * 2.1;
    const tw = Math.min(Q - 1, Math.max(fs * 6, [...fr.text].length * fs * .62 + fs * 2.6 + fr.text.length * fs * fr.spacing));
    W = Q; H = Q + (hasText ? gap + ph : 0); ox = 0; oy = 0;
    if (hasText) {
      const bx = (W - tw) / 2, by = Q + gap;
      fore = `<path d="${rr(bx, by, tw, ph, Array(4).fill(fr.style === 'pill' ? ph / 2 : ph * .3))}${fr.style === 'bubble' ? `M${f3(W/2-1)} ${f3(by+.02)}L${f3(W/2)} ${f3(by-1.1)}L${f3(W/2+1)} ${f3(by+.02)}Z` : ''}" fill="${fr.color}"/>` + textEl(W / 2, by + ph / 2, fr.textColor);
    }
  }
  const box = [ox + m, oy + m, n];
  let dF = paintDef(id + 'd', st.dotFill, box);
  if (photoDef) dF = { def: dF.def + photoDef, ref: `url(#${id}p)` };
  const efF = st.eyeSame ? dF : { def: '', ref: st.eyeFrameColor };
  const ebF = st.eyeSame ? dF : { def: '', ref: st.eyeBallColor };
  const bgF = paintDef(id + 'b', st.bgFill, [ox, oy, Q]);
  const bgFillRef = bgF.ref;
  back = back.replace('var(--x)', bgFillRef);
  const qrBg = st.bgTransparent ? '' : `<rect x="${f3(ox)}" y="${f3(oy)}" width="${f3(Q)}" height="${f3(Q)}" rx="${f3(qrRad)}" fill="${bgFillRef}"/>`;
  // logo
  let logoEl = '', logoDef = '';
  if (hasLogo) {
    const x = ox + m + lx, y = oy + m + lx, rad = L * lg.round / 100, pad = Math.max(.2, lg.margin * .5);
    if (lg.bg) logoEl += `<rect x="${f3(x - pad)}" y="${f3(y - pad)}" width="${f3(L + 2 * pad)}" height="${f3(L + 2 * pad)}" rx="${f3(rad + pad * .6)}" fill="${lg.bgColor}"/>`;
    logoDef = `<clipPath id="${id}c"><rect x="${f3(x)}" y="${f3(y)}" width="${f3(L)}" height="${f3(L)}" rx="${f3(rad)}"/></clipPath>`;
    logoEl += `<image href="${lg.src}" x="${f3(x)}" y="${f3(y)}" width="${f3(L)}" height="${f3(L)}" preserveAspectRatio="xMidYMid meet" clip-path="url(#${id}c)"/>`;
  }
  const inner = `${back}${qrBg}<g transform="translate(${f3(ox)} ${f3(oy)})">${photoUnder}${lp ? `<path d="${lp}" fill="${ph.light}"/>` : ''}<path d="${dp}" fill="${dF.ref}"/><path d="${fp}" fill="${efF.ref}" fill-rule="evenodd"/><path d="${bp}" fill="${ebF.ref}"/></g>${logoEl}${fore}`;
  const T = layoutTexts(st, W, H, inner, opt);
  const px = opt.px || null;
  const sizeAttr = px ? ` width="${Math.round(px * T.W / Q)}" height="${Math.round(px * T.H / Q)}"` : '';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${f3(T.W)} ${f3(T.H)}"${sizeAttr}><defs>${dF.def}${st.eyeSame ? '' : efF.def + ebF.def}${bgF.def}${logoDef}</defs>${T.body}</svg>`;
  return { svg, qr, W: T.W, H: T.H, Q, n };
}

/* ---------------- TEXT LAYERS (render) ---------------- */
const TFONTS = Object.assign({}, FONTS, {
  display: 'Impact,"Haettenschweiler","Arial Black","Franklin Gothic Heavy",sans-serif',
  script: '"Segoe Script","Brush Script MT","Lucida Handwriting",cursive',
  hand: '"Segoe Print","Comic Sans MS","Chalkboard SE","Marker Felt",cursive'
});
const TEXT_DEF = { text: 'Teks baru', pos: 'bottom', align: 'middle', font: 'sans', weight: '700', italic: false, size: 3, spacing: 0, lineH: 1.25,
  color: '#1b1640', bg: false, bgColor: '#ffd60a', bgRound: 50, gap: 1, x: 50, y: 50, rotate: 0 };
let mctx;
function measureW(t, L) {
  mctx = mctx || document.createElement('canvas').getContext('2d');
  mctx.font = `${L.italic ? 'italic ' : ''}${L.weight} 100px ${TFONTS[L.font] || TFONTS.sans}`;
  return mctx.measureText(t).width / 100 * L.size + Math.max(0, [...t].length - 1) * L.size * L.spacing;
}
function textBlock(L0, i) {
  const L = Object.assign({}, TEXT_DEF, L0), lines = String(L.text).split('\n');
  const tw = Math.max(L.size * .5, ...lines.map(l => measureW(l, L)));
  const lh = L.size * L.lineH, th = (lines.length - 1) * lh + L.size * 1.05;
  const px = L.bg ? L.size * .65 : 0, py = L.bg ? L.size * .38 : 0, bw = tw + 2 * px, bh = th + 2 * py;
  const anchor = { start: 'start', end: 'end' }[L.align] || 'middle', ax = L.align === 'start' ? -tw / 2 : L.align === 'end' ? tw / 2 : 0;
  let s = L.bg ? `<rect x="${f3(-bw / 2)}" y="${f3(-bh / 2)}" width="${f3(bw)}" height="${f3(bh)}" rx="${f3(Math.min(bh, bw) / 2 * L.bgRound / 100)}" fill="${L.bgColor}"/>` : '';
  lines.forEach((l, k) => {
    s += `<text x="${f3(ax)}" y="${f3(-th / 2 + L.size * .525 + k * lh)}" text-anchor="${anchor}" dominant-baseline="central" font-family='${TFONTS[L.font] || TFONTS.sans}' font-weight="${L.weight}"${L.italic ? ' font-style="italic"' : ''}${L.spacing ? ` letter-spacing="${f3(L.size * L.spacing)}"` : ''} font-size="${f3(L.size)}" fill="${L.color}" xml:space="preserve">${esc(l)}</text>`;
  });
  return { w: bw, h: bh, svg: s, L };
}
function layoutTexts(st, W0, H0, inner, opt = {}) {
  const list = opt.noText ? [] : (st.texts || []).map((L, i) => [L, i]).filter(([L]) => String(L.text || '').trim());
  if (!list.length) return { W: W0, H: H0, body: inner };
  const items = list.map(([L, i]) => Object.assign(textBlock(L, i), { i }));
  const side = p => items.filter(b => b.L.pos === p);
  const T = side('top'), B = side('bottom'), Lf = side('left'), R = side('right'), F = side('free');
  const outside = T.length + B.length + Lf.length + R.length > 0, pad = outside ? 1.4 : 0;
  const sum = a => a.reduce((s, b) => s + b.h + +b.L.gap, 0);
  const topH = sum(T), botH = sum(B), leftW = sum(Lf), rightW = sum(R);
  const tbMax = Math.max(0, ...T.concat(B).map(b => b.w)), sideMax = Math.max(0, ...Lf.concat(R).map(b => b.w));
  const innerW = Math.max(leftW + W0 + rightW, tbMax), innerH = Math.max(H0, sideMax);
  const W = innerW + 2 * pad, H = topH + innerH + botH + 2 * pad;
  const bx = pad + (innerW - (leftW + W0 + rightW)) / 2 + leftW, by = pad + topH + (innerH - H0) / 2;
  const g = (b, cx, cy, rot) => `<g data-tl="${b.i}" data-cx="${f3(cx / W * 100)}" data-cy="${f3(cy / H * 100)}" transform="translate(${f3(cx)} ${f3(cy)})${rot ? ` rotate(${f3(rot)})` : ''}">${b.svg}</g>`;
  const clampX = (c, w) => Math.min(W - pad - w / 2, Math.max(pad + w / 2, c)), clampY = (c, h) => Math.min(H - pad - h / 2, Math.max(pad + h / 2, c));
  const hx = b => clampX(b.L.align === 'start' ? bx + b.w / 2 : b.L.align === 'end' ? bx + W0 - b.w / 2 : bx + W0 / 2, b.w);
  const vy = b => clampY(b.L.align === 'start' ? by + b.w / 2 : b.L.align === 'end' ? by + H0 - b.w / 2 : by + H0 / 2, b.w);
  let out = '', y = pad;
  T.forEach(b => { out += g(b, hx(b), y + b.h / 2, 0); y += b.h + +b.L.gap; });
  y = by + H0; B.forEach(b => { y += +b.L.gap; out += g(b, hx(b), y + b.h / 2, 0); y += b.h; });
  let x = bx; Lf.forEach(b => { x -= +b.L.gap + b.h; out += g(b, x + b.h / 2, vy(b), -90); });
  x = bx + W0; R.forEach(b => { x += +b.L.gap; out += g(b, x + b.h / 2, vy(b), 90); x += b.h; });
  F.forEach(b => { // jaga teks bebas tetap di dalam gambar
    const r = (+b.L.rotate || 0) * Math.PI / 180, ex = Math.abs(Math.cos(r)) * b.w / 2 + Math.abs(Math.sin(r)) * b.h / 2, ey = Math.abs(Math.sin(r)) * b.w / 2 + Math.abs(Math.cos(r)) * b.h / 2;
    const cx = ex * 2 >= W ? W / 2 : Math.min(W - ex, Math.max(ex, b.L.x / 100 * W)), cy = ey * 2 >= H ? H / 2 : Math.min(H - ey, Math.max(ey, b.L.y / 100 * H));
    out += g(b, cx, cy, +b.L.rotate);
  });
  const tb = st.textBg || { mode: 'auto' };
  const fill = tb.mode === 'color' ? tb.color : tb.mode === 'none' || st.bgTransparent ? '' : st.bgFill.c1;
  const bgRect = outside && fill ? `<rect width="${f3(W)}" height="${f3(H)}" rx="${f3(+st.radius + pad * .6)}" fill="${fill}"/>` : '';
  return { W, H, body: `${bgRect}<g transform="translate(${f3(bx)} ${f3(by)})">${inner}</g>${out}` };
}

/* ---------------- SAMPLE ICONS (chip previews) ---------------- */
const SAMPLE = ['1101','1111','0110','1011'].map(r => [...r].map(c => c === '1'));
function sampleDots(style) {
  const g = (x, y) => SAMPLE[y] && SAMPLE[y][x]; let p = '';
  for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) if (g(x, y)) p += dotPath(style, x, y, { t: g(x, y - 1), r: g(x + 1, y), b: g(x, y + 1), l: g(x - 1, y) }, .9);
  return `<svg viewBox="-.3 -.3 4.6 4.6"><path d="${p}" fill="currentColor"/></svg>`;
}
const sampleEyeFrame = s => `<svg viewBox="-.4 -.4 7.8 7.8"><path d="${eyeFramePath(s, 0, 0, 0)}" fill="currentColor" fill-rule="evenodd"/><path d="${rr(2, 2, 3, 3, [.6,.6,.6,.6])}" fill="currentColor" opacity=".3"/></svg>`;
const sampleEyeBall = s => `<svg viewBox="-.4 -.4 7.8 7.8"><path d="${rr(0,0,7,7,[1.5,1.5,1.5,1.5]) + rr(1,1,5,5,[.8,.8,.8,.8])}" fill="currentColor" fill-rule="evenodd" opacity=".3"/><path d="${eyeBallPath(s, 2, 2, 0)}" fill="currentColor"/></svg>`;

/* ---------------- PRESETS ---------------- */
const PRESETS = [
  ['Klasik', { dotStyle:'square', eyeFrame:'square', eyeBall:'square', dotFill:{mode:'solid',c1:'#000000'}, eyeSame:true, bgFill:{mode:'solid',c1:'#ffffff'}, radius:0, frame:{style:'none'} }],
  ['Ungu', { dotStyle:'rounded', eyeFrame:'rounded', eyeBall:'rounded', dotFill:{mode:'linear',c1:'#1b1640',c2:'#6d5efc',angle:45}, eyeSame:false, eyeFrameColor:'#6d5efc', eyeBallColor:'#1b1640', bgFill:{mode:'solid',c1:'#ffffff'}, radius:2, frame:{style:'none'} }],
  ['Sunset', { dotStyle:'dots', dotScale:.9, eyeFrame:'soft', eyeBall:'circle', dotFill:{mode:'linear',c1:'#e0245e',c2:'#e8541f',angle:30}, eyeSame:true, bgFill:{mode:'solid',c1:'#fff7f0'}, radius:3, frame:{style:'bubble',text:'PINDAI SAYA',color:'#e0245e',textColor:'#ffffff'} }],
  ['Laut', { dotStyle:'extra', eyeFrame:'leaf', eyeBall:'leaf', dotFill:{mode:'radial',c1:'#0077b6',c2:'#00b4d8'}, eyeSame:false, eyeFrameColor:'#03045e', eyeBallColor:'#0096c7', bgFill:{mode:'solid',c1:'#eefaff'}, radius:3, frame:{style:'none'} }],
  ['Hutan', { dotStyle:'classy-r', eyeFrame:'drop', eyeBall:'drop', dotFill:{mode:'solid',c1:'#1f4d2b'}, eyeSame:false, eyeFrameColor:'#2d6a4f', eyeBallColor:'#1f4d2b', bgFill:{mode:'solid',c1:'#f2f7ec'}, radius:2, frame:{style:'bottom',text:'MENU',color:'#1f4d2b',textColor:'#f2f7ec'} }],
  ['Malam', { dotStyle:'rounded', eyeFrame:'circle', eyeBall:'circle', dotFill:{mode:'linear',c1:'#7ef9ff',c2:'#c77dff',angle:90}, eyeSame:true, bgFill:{mode:'solid',c1:'#14112b'}, radius:3, frame:{style:'none'} }],
  ['Emas', { dotStyle:'diamond', dotScale:.95, eyeFrame:'rounded', eyeBall:'diamond', dotFill:{mode:'linear',c1:'#8a6a1e',c2:'#d4af37',angle:60}, eyeSame:true, bgFill:{mode:'solid',c1:'#111111'}, radius:2, frame:{style:'outline',text:'VIP',color:'#d4af37',textColor:'#d4af37'} }],
  ['Permen', { dotStyle:'heart', dotScale:1, eyeFrame:'soft', eyeBall:'heart', dotFill:{mode:'linear',c1:'#ff4d8d',c2:'#9b5de5',angle:135}, eyeSame:true, bgFill:{mode:'solid',c1:'#fff0f6'}, radius:4, frame:{style:'pill',text:'Love ya',color:'#ff4d8d',textColor:'#ffffff'} }],
  ['Garis', { dotStyle:'vlines', dotScale:.9, eyeFrame:'rounded', eyeBall:'rounded', dotFill:{mode:'solid',c1:'#232323'}, eyeSame:true, bgFill:{mode:'solid',c1:'#f5f5f0'}, radius:2, frame:{style:'none'} }],
  ['Bintang', { dotStyle:'star', dotScale:1, eyeFrame:'soft', eyeBall:'star', dotFill:{mode:'radial',c1:'#f48c06',c2:'#9d0208'}, eyeSame:true, bgFill:{mode:'solid',c1:'#fffaf0'}, radius:3, frame:{style:'none'} }]
];
const applyStyle = s => { const keep = { type: S.type, fields: S.fields, logo: S.logo, photo: S.photo }; S = merge(merge(DEFAULT, pickStyle(S)), s); Object.assign(S, keep); if (s.logo) S.logo = merge(DEFAULT.logo, s.logo); };

/* ---------------- UI BUILD ---------------- */
function chipGrid(el, list, key, sampler) {
  el.innerHTML = list.map(([v, l]) => `<button class="chip" data-v="${v}" data-tip="${l}" title="${l}">${sampler(v)}</button>`).join('');
  el.onclick = e => { const b = e.target.closest('.chip'); if (!b) return; S[key] = b.dataset.v; update(); };
}
function syncChips() {
  [['#dotGrid','dotStyle'],['#eyeFrameGrid','eyeFrame'],['#eyeBallGrid','eyeBall']].forEach(([s, k]) => $$(s + ' .chip').forEach(b => b.classList.toggle('on', b.dataset.v === S[k])));
  $$('#frameGrid .chip').forEach(b => b.classList.toggle('on', b.dataset.v === S.frame.style));
}
function buildTypeGrid() {
  $('#typeGrid').innerHTML = Object.entries(TYPES).map(([k, t]) => `<button data-t="${k}">${icon(k)}${t.label}</button>`).join('');
  $('#typeGrid').onclick = e => { const b = e.target.closest('button'); if (!b) return; S.type = b.dataset.t; buildForm(); update(); };
}
function buildForm() {
  $$('#typeGrid button').forEach(b => b.classList.toggle('on', b.dataset.t === S.type));
  const f = fieldsOf(S.type);
  $('#typeForm').innerHTML = TYPES[S.type].fields.map(x => {
    const v = f[x.k] ?? '';
    if (x.t === 'switch') return `<label class="switch"><input type="checkbox" data-k="${x.k}" ${v ? 'checked' : ''}><i></i><span>${x.l}</span></label>`;
    let inp;
    if (x.t === 'textarea') inp = `<textarea data-k="${x.k}" rows="4" placeholder="${esc(x.ph||'')}">${esc(v)}</textarea>`;
    else if (x.t === 'select') inp = `<select data-k="${x.k}">${x.o.map(([a, b]) => `<option value="${a}" ${a === v ? 'selected' : ''}>${b}</option>`).join('')}</select>`;
    else inp = `<input type="${x.t || 'text'}" data-k="${x.k}" value="${esc(v)}" placeholder="${esc(x.ph||'')}" ${x.t==='number'?'step="any"':''}>`;
    return `<label class="field ${x.half ? 'half' : ''}"><span>${x.l}</span>${inp}</label>`;
  }).join('') + `<div class="counter" id="counter"></div>`;
  if (S.type === 'geo') $('#typeForm').insertAdjacentHTML('beforeend', `<button class="btn sm ghost full" id="myLoc" type="button">${icon('geo')} Pakai lokasi saya</button>`);
}
$('#typeForm').addEventListener('input', e => {
  const k = e.target.dataset.k; if (!k) return;
  S.fields[S.type][k] = e.target.type === 'checkbox' ? e.target.checked : e.target.value; update();
});
$('#typeForm').addEventListener('click', e => {
  if (e.target.closest('#myLoc')) {
    if (!navigator.geolocation) return toast('Lokasi tidak didukung');
    navigator.geolocation.getCurrentPosition(p => { const f = S.fields.geo; f.lat = p.coords.latitude.toFixed(6); f.lng = p.coords.longitude.toFixed(6); buildForm(); update(); }, () => toast('Izin lokasi ditolak'));
  }
});

function fillUI(el, key, label) {
  const F = S[key];
  el.innerHTML = `<div class="seg" data-key="${key}">${[['solid','Polos'],['linear','Gradasi'],['radial','Radial']].map(([v, l]) => `<button data-m="${v}" class="${F.mode === v ? 'on' : ''}">${l}</button>`).join('')}</div>
  <div class="row2">
    <label class="field"><span>${F.mode === 'solid' ? label : 'Warna 1'}</span><div class="color"><input type="color" data-fk="${key}.c1" value="${F.c1}"><input class="hex" data-fh="${key}.c1" value="${F.c1}"></div></label>
    ${F.mode !== 'solid' ? `<label class="field"><span>Warna 2</span><div class="color"><input type="color" data-fk="${key}.c2" value="${F.c2}"><input class="hex" data-fh="${key}.c2" value="${F.c2}"></div></label>` : '<div></div>'}
  </div>
  ${F.mode === 'linear' ? `<div class="field"><span>Sudut gradasi <output>${F.angle}°</output></span><input type="range" min="0" max="360" step="5" data-fk="${key}.angle" value="${F.angle}"></div>` : ''}`;
}
function onFillEvent(e) {
  const seg = e.target.closest('.seg[data-key] button');
  if (seg && e.type === 'click') { const key = seg.parentNode.dataset.key; S[key].mode = seg.dataset.m; if (!S[key].c2) S[key].c2 = '#6d5efc'; buildFills(); update(); return; }
  const fk = e.target.dataset.fk, fh = e.target.dataset.fh;
  if (fk && e.type === 'input') { const [k, p] = fk.split('.'); S[k][p] = p === 'angle' ? +e.target.value : e.target.value;
    if (p === 'angle') e.target.previousElementSibling.querySelector('output').textContent = e.target.value + '°';
    const h = e.target.parentNode.querySelector('.hex'); if (h) h.value = e.target.value; update(); }
  if (fh && e.type === 'input') { const v = normHex(e.target.value); if (v) { const [k, p] = fh.split('.'); S[k][p] = v; e.target.previousElementSibling.value = v; update(); } }
}
['click','input'].forEach(ev => { $('#dotFillUI').addEventListener(ev, onFillEvent); $('#bgFillUI').addEventListener(ev, onFillEvent); });
function buildFills() { fillUI($('#dotFillUI'), 'dotFill', 'Warna titik'); fillUI($('#bgFillUI'), 'bgFill', 'Warna latar'); }
const normHex = v => { v = v.trim().replace(/^#?/, '#'); if (/^#[0-9a-f]{3}$/i.test(v)) v = '#' + [...v.slice(1)].map(c => c + c).join(''); return /^#[0-9a-f]{6}$/i.test(v) ? v.toLowerCase() : null; };

// generic bindings: id -> path in S
const BIND = {
  dotScale: ['dotScale', v => v / 100, v => Math.round(v * 100), v => Math.round(v * 100) + '%'],
  radius: ['radius', Number, v => v, v => v],
  eyeSame: ['eyeSame'], bgTransparent: ['bgTransparent'],
  eyeFrameColor: ['eyeFrameColor'], eyeBallColor: ['eyeBallColor'],
  logoSize: ['logo.size', Number, v => v, v => v + '%'], logoMargin: ['logo.margin', Number, v => v, v => v],
  logoRound: ['logo.round', Number, v => v, v => v + '%'], logoHide: ['logo.hide'], logoBg: ['logo.bg'], logoBgColor: ['logo.bgColor'],
  frameText: ['frame.text'], frameColor: ['frame.color'], frameTextColor: ['frame.textColor'], frameFont: ['frame.font'], frameWeight: ['frame.weight'],
  frameSize: ['frame.size', Number, v => v, v => (+v).toFixed(1)], frameSpacing: ['frame.spacing', Number, v => v, v => (+v).toFixed(2)],
  ecl: ['ecl'], boost: ['boost'], margin: ['margin', Number, v => v, v => v + ' modul'], minVer: ['minVer', Number], mask: ['mask', Number],
  quality: ['quality', Number, v => v, v => Math.round(v * 100) + '%'],
  fmt: ['fmt'], exportSize: ['exportSize', Number], fileName: ['fileName'],
  photoDot: ['photo.dot', v => v / 100, v => Math.round(v * 100), v => Math.round(v * 100) + '%'],
  photoOpacity: ['photo.opacity', v => v / 100, v => Math.round(v * 100), v => Math.round(v * 100) + '%'],
  photoLight: ['photo.light'], photoGray: ['photo.gray'], photoSafe: ['photo.safe'],
  photoZoom: ['photo.zoom', Number, v => v, v => (+v).toFixed(1) + '×'],
  photoPx: ['photo.px', Number, v => v, v => Math.round(v) + '%'], photoPy: ['photo.py', Number, v => v, v => Math.round(v) + '%'],
  photoBright: ['photo.bright', Number, v => v, v => (v > 0 ? '+' : '') + v], photoContrast: ['photo.contrast', Number, v => v, v => (v > 0 ? '+' : '') + v],
  photoMinVer: ['photo.minVer', Number, v => v, v => 'versi ' + v]
};
const getP = p => p.split('.').reduce((o, k) => o[k], S);
const setP = (p, v) => { const ks = p.split('.'), last = ks.pop(); ks.reduce((o, k) => o[k], S)[last] = v; };
function syncInputs() {
  for (const id in BIND) {
    const el = document.getElementById(id); if (!el) continue;
    const [p, , toUI = v => v, fmt] = BIND[id]; const v = getP(p);
    if (el.type === 'checkbox') el.checked = !!v; else el.value = toUI(v);
    const out = document.getElementById(id + 'Out'); if (out && fmt) out.textContent = fmt(v);
    const hex = document.querySelector(`.hex[data-for="${id}"]`); if (hex) hex.value = v;
  }
  $('#eyeColors').style.display = S.eyeSame ? 'none' : '';
  $('#bgFillUI').style.display = S.bgTransparent ? 'none' : '';
}
for (const id in BIND) {
  const el = document.getElementById(id); if (!el) continue;
  el.addEventListener(el.tagName === 'SELECT' || el.type === 'checkbox' ? 'change' : 'input', () => {
    const [p, conv = v => v] = BIND[id];
    setP(p, el.type === 'checkbox' ? el.checked : conv(el.value));
    const hex = document.querySelector(`.hex[data-for="${id}"]`); if (hex) hex.value = el.value;
    if (id === 'eyeSame' || id === 'bgTransparent') syncInputs();
    if (/^photo(Zoom|Px|Py|Bright|Contrast|Gray|Safe)$/.test(id)) { const out = document.getElementById(id + 'Out'); if (out && BIND[id][3]) out.textContent = BIND[id][3](getP(BIND[id][0])); return schedPhoto(); }
    const out = document.getElementById(id + 'Out'); if (out && BIND[id][3]) out.textContent = BIND[id][3](getP(p));
    update(id === 'fileName' || id === 'fmt' || id === 'exportSize' || id === 'quality');
  });
}
$$('.hex[data-for]').forEach(h => h.addEventListener('input', () => { const v = normHex(h.value); if (!v) return; const id = h.dataset.for; setP(BIND[id][0], v); document.getElementById(id).value = v; update(); }));

// frames
const FRAMES = [['none','Tanpa'],['bottom','Bawah'],['top','Atas'],['bubble','Gelembung'],['pill','Kapsul'],['outline','Garis']];
function frameSample(style) {
  const st = merge(S, { frame: { style, text: 'SCAN', size: 3.4 }, logo: { src: null }, texts: [] });
  st.margin = 1; return renderSVG(st, 'KLM', { noLogo: true, noText: true }).svg;
}
$('#frameGrid').onclick = e => { const b = e.target.closest('.chip'); if (!b) return; S.frame.style = b.dataset.v; update(); };

// swatches
const SW = [['#000000','#ffffff'],['#1b1640','#ffffff'],['#6d5efc','#f3f1ff'],['#e63946','#fff5f5'],['#2a9d8f','#effaf8'],['#f77f00','#fff8ef'],['#0b3954','#e0f2ff'],['#ffffff','#111111'],['#d4af37','#121212'],['#ff4d8d','#fff0f6']];
$('#swatches').innerHTML = SW.map(([a, b]) => `<button data-a="${a}" data-b="${b}" style="background:linear-gradient(135deg,${a} 50%,${b} 50%)" title="${a} / ${b}"></button>`).join('');
$('#swatches').onclick = e => { const b = e.target.closest('button'); if (!b) return; S.dotFill = { ...S.dotFill, mode: 'solid', c1: b.dataset.a }; S.bgFill = { ...S.bgFill, mode: 'solid', c1: b.dataset.b }; S.eyeSame = true; S.bgTransparent = false; refreshAll(); };
$('#swapBtn').onclick = () => { const a = S.dotFill.c1; S.dotFill.c1 = S.bgFill.c1; S.bgFill.c1 = a; refreshAll(); };

// presets
function buildPresets() {
  $('#presetGrid').innerHTML = PRESETS.map(([name, p], i) => {
    const st = merge(DEFAULT, p); st.margin = 1; st.logo = clone(DEFAULT.logo);
    if (st.frame.style !== 'none') st.frame = merge(DEFAULT.frame, p.frame);
    return `<button class="preset" data-i="${i}">${renderSVG(st, 'https://klm.id/' + name).svg}${name}</button>`;
  }).join('');
  $('#presetGrid').onclick = e => { const b = e.target.closest('.preset'); if (!b) return; const p = clone(PRESETS[b.dataset.i][1]);
    p.frame = p.frame.style === 'none' ? { ...S.frame, style: 'none' } : merge(DEFAULT.frame, p.frame); if (!p.dotScale) p.dotScale = .9; applyStyle(p); refreshAll(); toast('Template diterapkan'); };
}

// logo
const QUICK_LOGOS = {
  wifi: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="#6d5efc"/><g fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round"><path d="M14 28a26 26 0 0 1 36 0M21 36a16 16 0 0 1 22 0"/></g><circle cx="32" cy="45" r="4" fill="#fff"/></svg>',
  wa: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="#25d366"/><path d="M15 49l2.6-8.3A17 17 0 1 1 24 46.6z" fill="none" stroke="#fff" stroke-width="4" stroke-linejoin="round"/><path d="M26 23c0 8 7 15 15 15l2-3.5-4.5-2.2-2 1.7c-2.3-1.1-4.4-3.2-5.5-5.5l1.7-2-2.2-4.5z" fill="#fff"/></svg>',
  ig: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="g" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#feda75"/><stop offset=".4" stop-color="#d62976"/><stop offset="1" stop-color="#4f5bd5"/></linearGradient></defs><rect width="64" height="64" rx="16" fill="url(#g)"/><rect x="16" y="16" width="32" height="32" rx="9" fill="none" stroke="#fff" stroke-width="4"/><circle cx="32" cy="32" r="7.5" fill="none" stroke="#fff" stroke-width="4"/><circle cx="41.5" cy="22.5" r="2.4" fill="#fff"/></svg>',
  mail: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="#ea4335"/><rect x="14" y="19" width="36" height="26" rx="4" fill="none" stroke="#fff" stroke-width="4"/><path d="M15 22l17 12 17-12" fill="none" stroke="#fff" stroke-width="4" stroke-linejoin="round"/></svg>',
  pin: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="#ff5c5c"/><path d="M32 52s-14-11-14-23a14 14 0 0 1 28 0c0 12-14 23-14 23z" fill="#fff"/><circle cx="32" cy="29" r="5" fill="#ff5c5c"/></svg>',
  web: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="#1b1640"/><g fill="none" stroke="#fff" stroke-width="3.5"><circle cx="32" cy="32" r="16"/><path d="M16 32h32M32 16c-6 6-6 26 0 32M32 16c6 6 6 26 0 32"/></g></svg>',
  heart: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="#ff4d8d"/><path d="M32 48C14 36 16 20 26 20c3 0 5 2 6 4 1-2 3-4 6-4 10 0 12 16-6 28z" fill="#fff"/></svg>',
  star: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="#ffb703"/><path d="M32 14l5.5 11.6 12.6 1.6-9.3 8.7 2.4 12.5L32 42.3l-11.2 6.1 2.4-12.5-9.3-8.7 12.6-1.6z" fill="#fff"/></svg>'
};
$('#logoQuick').innerHTML = Object.entries(QUICK_LOGOS).map(([k, s]) => `<button data-k="${k}" title="${k}">${s}</button>`).join('');
$('#logoQuick').onclick = e => { const b = e.target.closest('button'); if (!b) return; setLogo('data:image/svg+xml;base64,' + btoa(QUICK_LOGOS[b.dataset.k])); };
function setLogo(src) { S.logo.src = src; syncLogo(); update(); }
function syncLogo() { const i = $('#logoPrev'); if (S.logo.src) { i.src = S.logo.src; i.classList.remove('hidden'); } else i.classList.add('hidden'); }
function readLogo(file) {
  if (!file || !file.type.startsWith('image/')) return toast('Pilih file gambar');
  const r = new FileReader();
  r.onload = () => {
    if (file.type === 'image/svg+xml') return setLogo(r.result);
    const img = new Image(); img.onload = () => { // kecilkan supaya ringan
      const max = 512, k = Math.min(1, max / Math.max(img.width, img.height)), c = document.createElement('canvas');
      c.width = Math.round(img.width * k); c.height = Math.round(img.height * k); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      setLogo(c.toDataURL('image/png'));
    }; img.src = r.result;
  };
  r.readAsDataURL(file);
}
const drop = $('#logoDrop');
drop.onclick = () => $('#logoFile').click();
$('#logoFile').onchange = e => readLogo(e.target.files[0]);
['dragenter','dragover'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add('over'); }));
['dragleave','drop'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove('over'); }));
drop.addEventListener('drop', e => readLogo(e.dataTransfer.files[0]));
document.addEventListener('paste', e => { const f = [...(e.clipboardData?.files || [])].find(f => f.type.startsWith('image/')); if (!f) return; if ($('[data-panel="logo"]').classList.contains('on')) readLogo(f); else if ($('[data-panel="foto"]').classList.contains('on')) readPhoto(f); });
$('#logoClear').onclick = () => setLogo(null);

// foto
let photoImg = null, photoImgSrc = null, photoRAF = 0;
function processPhoto() {
  const P = S.photo;
  if (!photoImg || !P.src) { P.proc = null; return; }
  const N = 480, c = document.createElement('canvas'); c.width = c.height = N; const x = c.getContext('2d');
  const iw = photoImg.naturalWidth, ih = photoImg.naturalHeight, side = Math.min(iw, ih) / Math.max(1, +P.zoom);
  x.drawImage(photoImg, (iw - side) * P.px / 100, (ih - side) * P.py / 100, side, side, 0, 0, N, N);
  const capL = P.mode === 'fill' && P.safe !== false ? .4 : 0;
  const d = x.getImageData(0, 0, N, N), a = d.data, br = P.bright / 100 * 160, ct = (+P.contrast + 100) / 100; let sum = 0;
  for (let i = 0; i < a.length; i += 4) {
    let r = a[i], g = a[i + 1], b = a[i + 2];
    if (P.gray) r = g = b = .299 * r + .587 * g + .114 * b;
    r = (r - 128) * ct + 128 + br; g = (g - 128) * ct + 128 + br; b = (b - 128) * ct + 128 + br;
    a[i] = r < 0 ? 0 : r > 255 ? 255 : r; a[i + 1] = g < 0 ? 0 : g > 255 ? 255 : g; a[i + 2] = b < 0 ? 0 : b > 255 ? 255 : b;
    let l = (.299 * a[i] + .587 * a[i + 1] + .114 * a[i + 2]) / 255;
    if (capL && l > capL) { const k = capL / l; a[i] *= k; a[i + 1] *= k; a[i + 2] *= k; l = capL; }
    sum += l * 255;
  }
  x.putImageData(d, 0, 0); P.proc = c.toDataURL('image/jpeg', .86); P.avg = sum / (N * N) / 255;
}
function schedPhoto() { if (photoRAF) return; photoRAF = requestAnimationFrame(() => { photoRAF = 0; processPhoto(); update(); }); }
function loadPhoto(then) {
  const src = S.photo.src;
  if (!src) { photoImg = photoImgSrc = null; S.photo.proc = null; return then && then(); }
  if (photoImg && photoImgSrc === src) return then && then();
  const im = new Image(); im.onload = () => { photoImg = im; photoImgSrc = src; then && then(); }; im.src = src;
}
function syncPhoto() {
  const P = S.photo, prev = $('#photoPrev');
  if (P.src) { prev.src = P.proc || P.src; prev.classList.remove('hidden'); } else prev.classList.add('hidden');
  $$('#photoMode button').forEach(b => b.classList.toggle('on', b.dataset.v === P.mode));
  $$('#photoShape button').forEach(b => b.classList.toggle('on', b.dataset.v === P.shape));
  $('#htOpts').classList.toggle('hidden', P.mode !== 'halftone'); $('#fillOpts').classList.toggle('hidden', P.mode !== 'fill');
  $('#photoModeHint').textContent = P.mode === 'halftone'
    ? 'Foto tampil penuh di belakang QR. Titik kecil di tengah tiap modul menjaga QR tetap bisa dipindai.'
    : 'Titik-titik QR diisi dengan foto, latar tetap polos. Pakai foto yang cukup gelap atau turunkan kecerahan.';
  if (P.src && !photoImg) loadPhoto(() => { processPhoto(); syncPhoto(); update(); });
}
function readPhoto(file) {
  if (!file || !file.type.startsWith('image/')) return toast('Pilih file gambar');
  const r = new FileReader();
  r.onload = () => {
    const img = new Image(); img.onload = () => {
      const max = 1200, k = Math.min(1, max / Math.max(img.width, img.height)), c = document.createElement('canvas');
      c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(img, 0, 0, c.width, c.height);
      Object.assign(S.photo, { src: c.toDataURL('image/jpeg', .88), zoom: 1, px: 50, py: 50 });
      photoImg = null; loadPhoto(() => { processPhoto();
        syncInputs(); syncPhoto(); update(); toast('Foto dipasang'); });
    }; img.src = r.result;
  };
  r.readAsDataURL(file);
}
const pDrop = $('#photoDrop');
pDrop.onclick = () => $('#photoFile').click();
$('#photoFile').onchange = e => { readPhoto(e.target.files[0]); e.target.value = ''; };
['dragenter','dragover'].forEach(ev => pDrop.addEventListener(ev, e => { e.preventDefault(); pDrop.classList.add('over'); }));
['dragleave','drop'].forEach(ev => pDrop.addEventListener(ev, e => { e.preventDefault(); pDrop.classList.remove('over'); }));
pDrop.addEventListener('drop', e => readPhoto(e.dataTransfer.files[0]));
$('#photoClear').onclick = () => { S.photo.src = S.photo.proc = null; photoImg = null; syncPhoto(); update(); };
$('#photoMode').onclick = e => { const b = e.target.closest('button'); if (!b) return; S.photo.mode = b.dataset.v;
  processPhoto();
  syncPhoto(); update(); };
$('#photoShape').onclick = e => { const b = e.target.closest('button'); if (!b) return; S.photo.shape = b.dataset.v; syncPhoto(); update(); };

// tabs
$('#tabs').onclick = e => { const b = e.target.closest('button'); if (!b) return; $$('#tabs button').forEach(x => x.classList.toggle('on', x === b)); $$('.panel').forEach(p => p.classList.toggle('on', p.dataset.panel === b.dataset.tab));
  if (b.dataset.tab === 'riwayat') renderHistory(); if (b.dataset.tab === 'lanjut') renderSaved(); if (b.dataset.tab === 'bingkai') buildFrameGrid(); if (b.dataset.tab === 'teks') renderTextList(); };
function buildFrameGrid() { $('#frameGrid').innerHTML = FRAMES.map(([v, l]) => `<button class="chip frame-chip" data-v="${v}" title="${l}" data-tip="${l}">${frameSample(v)}</button>`).join(''); syncChips(); }

// selects
$('#minVer').innerHTML = Array.from({ length: 40 }, (_, i) => `<option value="${i + 1}">${i + 1} (${21 + 4 * i}×${21 + 4 * i})</option>`).join('');
$('#mask').innerHTML += Array.from({ length: 8 }, (_, i) => `<option value="${i}">Mask ${i}</option>`).join('');

/* ---------------- UPDATE ---------------- */
let lastRender = null, saveT;
const lum = hex => { const c = hex.slice(1).match(/../g).map(h => { const v = parseInt(h, 16) / 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }); return .2126 * c[0] + .7152 * c[1] + .0722 * c[2]; };
const contrast = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
function update(skipRender) {
  clearTimeout(saveT); saveT = setTimeout(() => { if (LS.set('qrs.state', S)) return; const t = clone(S); t.photo.src = t.photo.proc = null; if (LS.set('qrs.state', t)) return; t.logo.src = null; LS.set('qrs.state', t); }, 300);
  if (skipRender) return;
  syncChips();
  const data = dataOf();
  $('#rawData').textContent = data;
  const r = renderSVG(); lastRender = r;
  if (r.error) { $('#qrOut').innerHTML = `<p class="hint">${r.error}</p>`; $('#meta').innerHTML = ''; return; }
  $('#qrOut').innerHTML = r.svg;
  const bytes = new TextEncoder().encode(data).length;
  const eclName = ['L','M','Q','H'][r.qr.errorCorrectionLevel.ordinal];
  $('#meta').innerHTML = `<span>Versi ${r.qr.version}</span><span>${r.n}×${r.n} modul</span><span>ECC ${eclName}</span><span>${bytes} byte</span><span>Mask ${r.qr.mask}</span>`;
  const cnt = $('#counter'); if (cnt) cnt.textContent = `${data.length} karakter`;
  // peringatan keterbacaan
  const w = [];
  const dc = S.dotFill.c1, dc2 = S.dotFill.mode === 'solid' ? dc : S.dotFill.c2, bc = S.bgTransparent ? '#ffffff' : S.bgFill.c1;
  const cr = Math.min(contrast(dc, bc), contrast(dc2, bc));
  if (cr < 3) w.push('Kontras warna titik dan latar rendah — QR bisa sulit dipindai.');
  if (lum(dc) > lum(bc) + .2) w.push('Titik lebih terang dari latar (warna terbalik). Sebagian pemindai tidak bisa membacanya.');
  if (S.photo.proc && S.photo.mode === 'fill' && S.photo.avg > .45) w.push('Foto terlalu terang untuk mengisi titik — turunkan kecerahan atau naikkan kontras di tab Foto.');
  if (S.photo.proc && S.photo.mode === 'halftone' && S.photo.dot < .38) w.push('Titik pusat kecil — QR foto perlu dicetak cukup besar (min. ±3 cm) agar mudah dipindai.');
  if (S.photo.proc && S.photo.minVer > 8 && +S.exportSize < 800) w.push('QR foto rapat — unduh dengan ukuran besar dan cetak minimal ±4 cm.');
  if (S.logo.src && S.logo.size > 28 && eclName !== 'H') w.push('Logo besar — pertimbangkan ECC H atau kecilkan logo.');
  if (+S.margin < 2 && S.frame.style === 'none') w.push('Zona tenang kecil — sisakan margin minimal 2 bila latar sekitar ramai.');
  if (S.dotScale < .6 && ['dots','mini','diamond','star','heart','cross'].includes(S.dotStyle)) w.push('Titik sangat kecil bisa menurunkan keterbacaan.');
  $('#warn').innerHTML = w.map(x => '⚠ ' + x).join('<br>'); $('#warn').classList.toggle('hidden', !w.length);
}
function refreshAll() { buildFills(); syncInputs(); syncLogo(); syncPhoto(); buildForm(); renderTextList(); if ($('[data-panel="bingkai"]').classList.contains('on')) buildFrameGrid(); update(); }

/* ---------------- EXPORT ---------------- */
function rasterize(svg, w, h, fmt, quality, bgFill) {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d');
      if (fmt === 'jpg') { x.fillStyle = bgFill || '#ffffff'; x.fillRect(0, 0, w, h); }
      x.imageSmoothingQuality = 'high'; x.drawImage(img, 0, 0, w, h);
      c.toBlob(b => b ? res(b) : rej(new Error('Gagal membuat gambar')), fmt === 'jpg' ? 'image/jpeg' : fmt === 'webp' ? 'image/webp' : 'image/png', quality);
    };
    img.onerror = () => rej(new Error('Gagal merender gambar'));
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  });
}
async function makeBlob(st = S, text = dataOf(st), fmt = st.fmt) {
  const r = renderSVG(st, text); if (r.error) throw new Error(r.error);
  const px = +st.exportSize, w = Math.round(px * r.W / r.Q), h = Math.round(px * r.H / r.Q);
  if (fmt === 'svg') { const s = renderSVG(st, text, { px }).svg; return new Blob(['<?xml version="1.0" encoding="UTF-8"?>\n' + s], { type: 'image/svg+xml' }); }
  return rasterize(r.svg, w, h, fmt, +st.quality, st.bgTransparent ? '#ffffff' : st.bgFill.c1);
}
const safeName = s => (s || 'qr-code').replace(/[\\/:*?"<>|]+/g, '-').trim().slice(0, 80) || 'qr-code';
function saveBlob(blob, name) {
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}
$('#dlBtn').onclick = async () => {
  try { const b = await makeBlob(); saveBlob(b, safeName(S.fileName) + '.' + S.fmt); addHistory(); toast('Tersimpan: ' + safeName(S.fileName) + '.' + S.fmt); }
  catch (e) { toast(e.message); }
};
$('#copyBtn').onclick = async () => {
  try {
    const b = await makeBlob(S, dataOf(), 'png');
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': b })]); addHistory(); toast('Gambar QR disalin');
  } catch (e) { try { await navigator.clipboard.writeText(lastRender.svg); toast('Kode SVG disalin'); } catch { toast('Tidak bisa menyalin di perangkat ini'); } }
};
$('#shareBtn').onclick = async () => {
  try {
    const b = await makeBlob(S, dataOf(), 'png'); const file = new File([b], safeName(S.fileName) + '.png', { type: 'image/png' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: 'QR code' }); addHistory(); }
    else { saveBlob(b, file.name); toast('Berbagi tidak didukung — gambar diunduh'); }
  } catch (e) { if (e.name !== 'AbortError') toast(e.message); }
};
$('#printBtn').onclick = () => {
  const w = window.open('', '_blank'); if (!w) return toast('Pop-up diblokir');
  w.document.write(`<!doctype html><title>Cetak QR</title><style>body{margin:0;display:grid;place-items:center;min-height:100vh}svg{width:70vmin;height:auto}</style>${lastRender.svg}<script>onload=()=>{print();}<\/script>`);
  w.document.close(); addHistory();
};

/* ---------------- ZIP (store) ---------------- */
const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc32 = u => { let c = 0xFFFFFFFF; for (let i = 0; i < u.length; i++) c = CRC[(c ^ u[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
function zip(files) {
  const enc = new TextEncoder(), parts = [], central = []; let off = 0;
  const d = new Date(), dt = ((d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1)), dd = (((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate());
  for (const f of files) {
    const name = enc.encode(f.name), data = f.data, crc = crc32(data);
    const h = new DataView(new ArrayBuffer(30));
    h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(8, 0, true);
    h.setUint16(10, dt, true); h.setUint16(12, dd, true); h.setUint32(14, crc, true); h.setUint32(18, data.length, true); h.setUint32(22, data.length, true);
    h.setUint16(26, name.length, true); h.setUint16(28, 0, true);
    parts.push(h, name, data);
    const c = new DataView(new ArrayBuffer(46));
    c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true); c.setUint16(10, 0, true);
    c.setUint16(12, dt, true); c.setUint16(14, dd, true); c.setUint32(16, crc, true); c.setUint32(20, data.length, true); c.setUint32(24, data.length, true);
    c.setUint16(28, name.length, true); c.setUint32(42, off, true);
    central.push(c, name); off += 30 + name.length + data.length;
  }
  const csize = central.reduce((s, p) => s + p.byteLength, 0), e = new DataView(new ArrayBuffer(22));
  e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true); e.setUint32(12, csize, true); e.setUint32(16, off, true);
  return new Blob([...parts, ...central, e], { type: 'application/zip' });
}
$('#batchBtn').onclick = async () => {
  const lines = $('#batchInput').value.split('\n').map(s => s.trim()).filter(Boolean);
  if (!lines.length) return toast('Isi daftar dulu'); if (lines.length > 500) return toast('Maksimal 500 baris');
  const fmt = $('#batchFmt').value, prog = $('#batchProg'), bar = prog.querySelector('i'); prog.classList.remove('hidden');
  const files = [], used = {};
  for (let i = 0; i < lines.length; i++) {
    let name, text; const m = lines[i].split(/\s*\|\s*/);
    if (m.length > 1) { name = m.shift(); text = m.join(' | '); } else { text = lines[i]; name = String(i + 1).padStart(3, '0'); }
    const st = clone(S); if ($('#batchLabel').value === 'name' && st.frame.style !== 'none') st.frame.text = name;
    const sub = t => String(t).replace(/\{nama\}/gi, name).replace(/\{no\}/gi, String(i + 1)).replace(/\{isi\}/gi, text);
    st.frame.text = sub(st.frame.text); st.texts.forEach(L => L.text = sub(L.text));
    try {
      const b = await makeBlob(st, text, fmt); let fn = safeName(name); if (used[fn]) fn += '-' + (++used[fn]); else used[fn] = 1;
      files.push({ name: fn + '.' + fmt, data: new Uint8Array(await b.arrayBuffer()) });
    } catch (e) { toast(`Baris ${i + 1}: ${e.message}`); }
    bar.style.width = ((i + 1) / lines.length * 100) + '%';
    if (i % 5 === 4) await new Promise(r => setTimeout(r));
  }
  saveBlob(zip(files), safeName(S.fileName) + '-massal.zip'); toast(`${files.length} QR dibuat`);
  setTimeout(() => prog.classList.add('hidden'), 1200);
};

/* ---------------- TEXT LAYERS (UI) ---------------- */
const TPOS = [['top','Atas'],['bottom','Bawah'],['left','Kiri'],['right','Kanan'],['free','Bebas']];
const TALIGN = [['start','Kiri'],['middle','Tengah'],['end','Kanan']];
const TFONT_LIST = [['sans','Sans'],['rounded','Bulat'],['serif','Serif'],['mono','Mono'],['condensed','Ramping'],['display','Display tebal'],['script','Sambung'],['hand','Tulisan tangan']];
const TWEIGHTS = [['400','Normal'],['600','Agak tebal'],['700','Tebal'],['800','Sangat tebal'],['900','Hitam']];
const TFMT = { size: v => (+v).toFixed(1), spacing: v => (+v).toFixed(2), lineH: v => (+v).toFixed(2), gap: v => (+v).toFixed(1), x: v => Math.round(v) + '%', y: v => Math.round(v) + '%', rotate: v => Math.round(v) + '°', bgRound: v => Math.round(v) + '%' };
let tlSel = 0;
const segHTML = (key, list, v) => `<div class="seg" data-seg="${key}">${list.map(([a, b]) => `<button type="button" data-v="${a}" class="${a === v ? 'on' : ''}">${b}</button>`).join('')}</div>`;
const rngHTML = (L, k, l, min, max, step) => `<div class="field"><span>${l} <output data-out="${k}">${TFMT[k](L[k])}</output></span><input type="range" data-tk="${k}" data-num min="${min}" max="${max}" step="${step}" value="${L[k]}"></div>`;
const colHTML = (k, l, v) => `<label class="field"><span>${l}</span><div class="color"><input type="color" data-tk="${k}" value="${v}"><input class="hex" data-tkh="${k}" value="${v}"></div></label>`;
const optHTML = (list, v) => list.map(([a, b]) => `<option value="${a}" ${a === v ? 'selected' : ''}>${b}</option>`).join('');
function renderTextList() {
  const el = $('#tlList'), T = S.texts;
  T.forEach((L, i) => T[i] = Object.assign({}, TEXT_DEF, L));
  $('#qrStage').classList.toggle('has-text', T.length > 0);
  syncTextBg();
  if (!T.length) { el.innerHTML = '<div class="empty">Belum ada teks. Pilih salah satu tombol di atas untuk menambah.</div>'; return; }
  tlSel = Math.max(0, Math.min(tlSel, T.length - 1));
  el.innerHTML = T.map((L, i) => {
    const open = i === tlSel;
    return `<div class="tl${open ? ' open' : ''}" data-i="${i}">
      <div class="tl-head" data-act="sel"><span class="tl-pos">${TPOS.find(p => p[0] === L.pos)[1]}</span><b>${esc(String(L.text).split('\n')[0] || '(kosong)')}</b>
        <span class="tl-acts"><button type="button" data-act="up" title="Naikkan">↑</button><button type="button" data-act="down" title="Turunkan">↓</button><button type="button" data-act="dup" title="Duplikat">⧉</button><button type="button" data-act="del" class="d" title="Hapus">×</button></span></div>
      ${open ? `<div class="tl-body">
        <label class="field"><span>Teks <small>Enter = baris baru</small></span><textarea data-tk="text" rows="2">${esc(L.text)}</textarea></label>
        <div class="field"><span>Posisi</span>${segHTML('pos', TPOS, L.pos)}</div>
        <div class="field"><span>Rata</span>${segHTML('align', TALIGN, L.align)}</div>
        <div class="row2"><label class="field"><span>Huruf</span><select data-tk="font">${optHTML(TFONT_LIST, L.font)}</select></label>
          <label class="field"><span>Ketebalan</span><select data-tk="weight">${optHTML(TWEIGHTS, String(L.weight))}</select></label></div>
        <div class="row2">${colHTML('color', 'Warna teks', L.color)}<label class="switch tl-it"><input type="checkbox" data-tk="italic" ${L.italic ? 'checked' : ''}><i></i><span>Miring</span></label></div>
        ${rngHTML(L, 'size', 'Ukuran', 1, 10, .1)}
        <div class="row2">${rngHTML(L, 'spacing', 'Jarak huruf', 0, .8, .02)}${rngHTML(L, 'lineH', 'Jarak baris', .9, 2.2, .05)}</div>
        ${L.pos === 'free' ? `<div class="row2">${rngHTML(L, 'x', 'Posisi X', 0, 100, .5)}${rngHTML(L, 'y', 'Posisi Y', 0, 100, .5)}</div>${rngHTML(L, 'rotate', 'Putar', -180, 180, 1)}
          <p class="hint">Seret teks di pratinjau untuk memindahkan. Teks bebas bisa menutupi QR — jangan letakkan di atas mata (kotak sudut).</p>`
          : rngHTML(L, 'gap', 'Jarak dari QR', 0, 8, .1)}
        <label class="switch"><input type="checkbox" data-tk="bg" ${L.bg ? 'checked' : ''}><i></i><span>Latar label di belakang teks</span></label>
        ${L.bg ? `<div class="row2">${colHTML('bgColor', 'Warna label', L.bgColor)}${rngHTML(L, 'bgRound', 'Sudut label', 0, 100, 5)}</div>` : ''}
      </div>` : ''}
    </div>`;
  }).join('');
}
function syncTextBg() {
  const tb = S.textBg; $$('#textBgSeg button').forEach(b => b.classList.toggle('on', b.dataset.v === tb.mode));
  $('#textBgColorF').classList.toggle('hidden', tb.mode !== 'color'); $('#textBgColor').value = tb.color; $('#textBgHex').value = tb.color;
}
const TL_PRESETS = {
  top: () => ({ text: 'JUDUL DI SINI', pos: 'top', size: 4, weight: '800', spacing: .05 }),
  bottom: () => ({ text: 'Pindai untuk membuka', pos: 'bottom', size: 2.6, weight: '600' }),
  left: () => ({ text: 'KLM QR Studio', pos: 'left', size: 2.2, weight: '700', spacing: .1 }),
  right: () => ({ text: 'KLM QR Studio', pos: 'right', size: 2.2, weight: '700', spacing: .1 }),
  free: () => ({ text: 'BARU!', pos: 'free', x: 82, y: 12, rotate: 12, size: 3, weight: '800', bg: true, bgColor: '#ff5c8a', color: '#ffffff' }),
  data: () => ({ text: dataOf().split('\n')[0].replace(/^https?:\/\//, '').slice(0, 60), pos: 'bottom', size: 2.2, weight: '600', font: 'mono' })
};
$('#tlAdd').onclick = e => {
  const b = e.target.closest('[data-add]'); if (!b) return;
  const L = Object.assign({}, TEXT_DEF, { color: S.dotFill.c1 }, TL_PRESETS[b.dataset.add]());
  S.texts.push(L); tlSel = S.texts.length - 1; renderTextList(); update();
};
$('#tlList').addEventListener('click', e => {
  const tl = e.target.closest('.tl'); if (!tl) return; const i = +tl.dataset.i, T = S.texts;
  const act = e.target.closest('[data-act]');
  if (act) {
    const a = act.dataset.act;
    if (a === 'sel') { tlSel = i; renderTextList(); return; }
    if (a === 'up' && i > 0) { [T[i - 1], T[i]] = [T[i], T[i - 1]]; tlSel = i - 1; }
    else if (a === 'down' && i < T.length - 1) { [T[i + 1], T[i]] = [T[i], T[i + 1]]; tlSel = i + 1; }
    else if (a === 'dup') { const c = clone(T[i]); if (c.pos === 'free') { c.x = Math.min(95, c.x + 5); c.y = Math.min(95, c.y + 5); } T.splice(i + 1, 0, c); tlSel = i + 1; }
    else if (a === 'del') { T.splice(i, 1); tlSel = Math.min(i, T.length - 1); }
    else return;
    e.stopPropagation(); renderTextList(); update(); return;
  }
  const sb = e.target.closest('[data-seg] button');
  if (sb) { const k = sb.parentNode.dataset.seg; T[i][k] = sb.dataset.v; renderTextList(); update(); }
});
$('#tlList').addEventListener('input', e => {
  const tl = e.target.closest('.tl'); if (!tl) return; const L = S.texts[+tl.dataset.i], t = e.target;
  if (t.dataset.tkh) { const v = normHex(t.value); if (!v) return; L[t.dataset.tkh] = v; t.previousElementSibling.value = v; return update(); }
  const k = t.dataset.tk; if (!k) return;
  L[k] = t.type === 'checkbox' ? t.checked : t.hasAttribute('data-num') ? +t.value : t.value;
  const out = tl.querySelector(`[data-out="${k}"]`); if (out) out.textContent = TFMT[k](L[k]);
  if (t.type === 'color') t.nextElementSibling.value = t.value;
  if (k === 'text') tl.querySelector('.tl-head b').textContent = L.text.split('\n')[0] || '(kosong)';
  if (k === 'bg') renderTextList();
  update();
});
$('#textBgSeg').onclick = e => { const b = e.target.closest('button'); if (!b) return; S.textBg.mode = b.dataset.v; syncTextBg(); update(); };
$('#textBgColor').oninput = e => { S.textBg.color = e.target.value; $('#textBgHex').value = e.target.value; update(); };
$('#textBgHex').oninput = e => { const v = normHex(e.target.value); if (v) { S.textBg.color = v; $('#textBgColor').value = v; update(); } };

// seret teks langsung di pratinjau
let drag = null, dragRAF = 0;
function svgPoint(ev) {
  const svg = $('#qrOut svg'); if (!svg) return null;
  const m = svg.getScreenCTM(); if (!m) return null;
  const p = new DOMPoint(ev.clientX, ev.clientY).matrixTransform(m.inverse()), vb = svg.viewBox.baseVal;
  return { x: p.x / vb.width * 100, y: p.y / vb.height * 100 };
}
$('#qrOut').addEventListener('pointerdown', e => {
  const g = e.target.closest('[data-tl]'); if (!g) return;
  e.preventDefault(); const i = +g.dataset.tl, L = S.texts[i], p = svgPoint(e); if (!p) return;
  if (L.pos !== 'free') { L.pos = 'free'; L.x = p.x; L.y = p.y; L.rotate = 0; drag = { i, dx: 0, dy: 0, converted: true }; update(); }
  else drag = { i, dx: L.x - p.x, dy: L.y - p.y };
  tlSel = i; document.body.classList.add('dragging');
});
window.addEventListener('pointermove', e => {
  if (!drag) return; const p = svgPoint(e); if (!p) return;
  const L = S.texts[drag.i];
  L.x = Math.max(0, Math.min(100, p.x + drag.dx)); L.y = Math.max(0, Math.min(100, p.y + drag.dy));
  if (!dragRAF) dragRAF = requestAnimationFrame(() => { dragRAF = 0; update(); });
});
window.addEventListener('pointerup', () => {
  if (!drag) return; drag = null; document.body.classList.remove('dragging');
  if (!$('[data-panel="teks"]').classList.contains('on')) $('[data-tab="teks"]').click(); else renderTextList();
});

/* ---------------- HISTORY & SAVED ---------------- */
function addHistory() {
  const h = LS.get('qrs.hist', []), data = dataOf();
  const item = { t: Date.now(), type: S.type, fields: clone(S.fields[S.type]), style: pickStyle(), data };
  const idx = h.findIndex(x => x.data === data && JSON.stringify(x.style) === JSON.stringify(item.style)); if (idx >= 0) h.splice(idx, 1);
  h.unshift(item); while (h.length > 30) h.pop();
  if (!LS.set('qrs.hist', h)) { h.forEach(x => x.style.logo.src = null); LS.set('qrs.hist', h); }
}
function thumb(style, data) { const st = merge(DEFAULT, style); st.frame.style = st.frame.style || 'none'; return renderSVG(st, data).svg; }
function renderHistory() {
  const h = LS.get('qrs.hist', []);
  $('#histList').innerHTML = h.length ? h.map((x, i) => `<div class="hist-item" data-i="${i}"><button class="del" data-del="${i}" title="Hapus">×</button>${thumb(x.style, x.data)}<b>${TYPES[x.type]?.label || ''}</b><p title="${esc(x.data)}">${esc(x.data.split('\n')[0])}</p></div>`).join('') : '<div class="empty">Belum ada riwayat</div>';
}
$('#histList').onclick = e => {
  const h = LS.get('qrs.hist', []);
  const d = e.target.closest('[data-del]'); if (d) { h.splice(+d.dataset.del, 1); LS.set('qrs.hist', h); return renderHistory(); }
  const it = e.target.closest('.hist-item'); if (!it) return; const x = h[+it.dataset.i];
  S.type = x.type; S.fields[x.type] = clone(x.fields); applyStyle(x.style); if (x.style.logo) S.logo = merge(DEFAULT.logo, x.style.logo);
  refreshAll(); $('[data-tab="isi"]').click(); toast('Dimuat dari riwayat');
};
$('#histClear').onclick = () => { if (confirm('Hapus semua riwayat?')) { LS.set('qrs.hist', []); renderHistory(); } };
function renderSaved() {
  const s = LS.get('qrs.saved', []);
  $('#savedGrid').innerHTML = s.length ? s.map((x, i) => `<div class="saved-item" data-i="${i}" title="${esc(x.name)}"><button class="del" data-del="${i}">×</button>${thumb(x.style, 'https://klm.id')}</div>`).join('') : '<div class="empty">Belum ada gaya tersimpan</div>';
}
$('#savedGrid').onclick = e => {
  const s = LS.get('qrs.saved', []);
  const d = e.target.closest('[data-del]'); if (d) { s.splice(+d.dataset.del, 1); LS.set('qrs.saved', s); return renderSaved(); }
  const it = e.target.closest('.saved-item'); if (!it) return; applyStyle(s[+it.dataset.i].style); S.logo = merge(DEFAULT.logo, s[+it.dataset.i].style.logo || {}); refreshAll(); toast('Gaya diterapkan');
};
$('#saveStyleBtn').onclick = () => { const s = LS.get('qrs.saved', []); s.unshift({ name: 'Gaya ' + (s.length + 1), style: pickStyle() }); if (!LS.set('qrs.saved', s.slice(0, 24))) { s[0].style.logo.src = null; LS.set('qrs.saved', s.slice(0, 24)); toast('Disimpan (tanpa logo — memori penuh)'); } else toast('Gaya disimpan'); renderSaved(); };
$('#exportCfgBtn').onclick = () => saveBlob(new Blob([JSON.stringify({ app: 'klm-qr-studio', v: 1, state: S }, null, 2)], { type: 'application/json' }), safeName(S.fileName) + '-pengaturan.json');
$('#importCfgBtn').onclick = () => $('#importCfg').click();
$('#importCfg').onchange = e => { const f = e.target.files[0]; if (!f) return; f.text().then(t => { try { const j = JSON.parse(t); S = merge(DEFAULT, j.state || j); refreshAll(); toast('Pengaturan diimpor'); } catch { toast('File tidak valid'); } }); e.target.value = ''; };
$('#resetBtn').onclick = () => { if (!confirm('Kembalikan semua pengaturan ke awal?')) return; S = clone(DEFAULT); refreshAll(); toast('Diatur ulang'); };

/* ---------------- THEME, TOAST, PWA ---------------- */
function setTheme(t) { document.documentElement.dataset.theme = t; LS.set('qrs.theme', t); document.querySelector('meta[name=theme-color]').content = t === 'dark' ? '#0f0e1a' : '#6d5efc'; }
setTheme(LS.get('qrs.theme', matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
$('#themeBtn').onclick = () => setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
let toastT; function toast(m) { const t = $('#toast'); t.textContent = m; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2200); }
let deferred; window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferred = e; $('#installBtn').classList.remove('hidden'); });
$('#installBtn').onclick = async () => { if (!deferred) return; deferred.prompt(); await deferred.userChoice; deferred = null; $('#installBtn').classList.add('hidden'); };
window.addEventListener('appinstalled', () => { $('#installBtn').classList.add('hidden'); toast('Aplikasi terpasang'); });
if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => {});
// versi Windows: beri tahu peluncur bahwa jendela masih terbuka
if (location.hostname === '127.0.0.1' && location.port === '47821') { const ping = () => fetch('/__ping', { cache: 'no-store' }).catch(() => {}); ping(); setInterval(ping, 15000); }
document.addEventListener('keydown', e => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); $('#dlBtn').click(); } });

/* ---------------- INIT ---------------- */
buildTypeGrid();
chipGrid($('#dotGrid'), DOT_STYLES, 'dotStyle', sampleDots);
chipGrid($('#eyeFrameGrid'), EYE_FRAMES, 'eyeFrame', sampleEyeFrame);
chipGrid($('#eyeBallGrid'), EYE_BALLS, 'eyeBall', sampleEyeBall);
buildPresets();
refreshAll();
