// PricetoFly — interactions du site.
// Avec les View Transitions d'Astro, ce module n'est chargé qu'une fois :
// chaque page est (ré)initialisée sur l'événement « astro:page-load ».
// Toutes les données chiffrées viennent de pricetofly-v1.html, sans modification.

const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (id) => document.getElementById(id);

let intervals = [];
let observers = [];
let loops = []; // jetons { on: true } pour arrêter les boucles requestAnimationFrame

function cleanup() {
  intervals.forEach(clearInterval);
  observers.forEach((o) => o.disconnect());
  loops.forEach((t) => { t.on = false; });
  intervals = []; observers = []; loops = [];
}

/* ---------- Menu mobile ---------- */
function initNav() {
  const btn = document.querySelector('.nav-toggle');
  const menu = $('nav-menu');
  if (!btn || !menu) return;
  btn.addEventListener('click', () => {
    const open = menu.classList.toggle('open');
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
}

/* ---------- Apparition au défilement + compteurs ---------- */
function initReveal() {
  const els = document.querySelectorAll('.reveal, .traj, .rank, [data-count]');
  if (!els.length) return;
  if (!('IntersectionObserver' in window)) { els.forEach((e) => e.classList.add('in')); return; }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      en.target.classList.add('in');
      if (en.target.hasAttribute('data-count')) count(en.target);
      io.unobserve(en.target);
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -6% 0px' });
  els.forEach((e) => io.observe(e));
  observers.push(io);
}

// Compteur animé : le texte final est toujours exactement celui écrit dans la page.
function count(el) {
  const final = el.textContent;
  const m = final.match(/^(\D*)(\d+)(.*)$/);
  if (reduce || !m) return;
  const target = parseInt(m[2], 10);
  const token = { on: true }; loops.push(token);
  const t0 = performance.now(), D = 900;
  (function step(now) {
    if (!token.on) { el.textContent = final; return; }
    const t = Math.min((now - t0) / D, 1);
    const e = 1 - Math.pow(1 - t, 3);
    el.textContent = t < 1 ? m[1] + Math.round(target * e) + m[3] : final;
    if (t < 1) requestAnimationFrame(step);
  })(t0);
}

/* ---------- Accueil : l'avion fait le tour de l'orbite autour du titre ---------- */
function initOrbit() {
  const zone = document.querySelector('.orbit');
  if (!zone) return;
  const svg = zone.querySelector('svg');
  const ell = zone.querySelector('ellipse');
  const plane = zone.querySelector('.plane');
  const TILT = -7 * Math.PI / 180;
  let W = 0, H = 0, rx = 0, ry = 0;
  function size() {
    W = zone.clientWidth; H = zone.clientHeight;
    if (!W || !H) return;
    rx = W / 2 - 6; ry = H / 2 - 10;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    ell.setAttribute('cx', W / 2); ell.setAttribute('cy', H / 2);
    ell.setAttribute('rx', rx); ell.setAttribute('ry', ry);
    ell.setAttribute('transform', `rotate(-7 ${W / 2} ${H / 2})`);
    place(angle);
  }
  let angle = -2.2;
  function pt(a) {
    const x = rx * Math.cos(a), y = ry * Math.sin(a);
    return [W / 2 + x * Math.cos(TILT) - y * Math.sin(TILT), H / 2 + x * Math.sin(TILT) + y * Math.cos(TILT)];
  }
  function place(a) {
    const p = pt(a), q = pt(a + 0.01);
    const rot = Math.atan2(q[1] - p[1], q[0] - p[0]) * 180 / Math.PI;
    plane.setAttribute('transform', `translate(${p[0]} ${p[1]}) rotate(${rot})`);
  }
  if ('ResizeObserver' in window) { const ro = new ResizeObserver(size); ro.observe(zone); observers.push(ro); }
  size();
  if (reduce) return;
  const token = { on: true }; loops.push(token);
  let last = performance.now();
  const PERIOD = 18000; // un tour lent, en boucle
  (function step(now) {
    if (!token.on) return;
    angle += (now - last) / PERIOD * Math.PI * 2; last = now;
    place(angle);
    requestAnimationFrame(step);
  })(last);
}

/* ---------- Accueil : tableau des départs à palettes ---------- */
const DEPARTS = [
  ['400 €', 'SEUL', 'PORTO', 'AVION'],
  ['400 €', 'À 3', 'LISBONNE', 'AVION'],
  ['180 €', 'À 2', 'LA ROCHELLE', 'TRAIN'],
  ['350 €', 'À 3', 'BIARRITZ', 'VOITURE'],
  ['300 €', 'SEUL', 'BRUXELLES', 'TRAIN'],
  ['400 €', 'À 3', 'BARCELONE', 'TRAIN'],
];
function initBoard() {
  const rowsEl = $('board-rows');
  if (!rowsEl) return;
  const WIDTHS = [5, 4, 11, 7];
  const CHARS = 'ABCDEFGHIJKLMNOPRSTUVWXYZ0123456789€';
  const VISIBLE = 4;
  let offset = 0;
  const cells = [];
  const pad = (s, n) => String(s).padEnd(n, ' ').slice(0, n);
  rowsEl.textContent = '';
  for (let r = 0; r < VISIBLE; r++) {
    const row = document.createElement('div');
    row.className = 'board-row';
    const rowCells = [];
    for (let c = 0; c < 4; c++) {
      const flap = document.createElement('div');
      flap.className = 'flap' + (c === 1 ? ' dim' : '') + (c === 3 ? ' col-mode dim' : '');
      const spans = [];
      for (let k = 0; k < WIDTHS[c]; k++) { const sp = document.createElement('span'); sp.textContent = ' '; flap.appendChild(sp); spans.push(sp); }
      row.appendChild(flap);
      rowCells.push(spans);
    }
    rowsEl.appendChild(row);
    cells.push(rowCells);
  }
  function setRow(rIdx, data, animate) {
    for (let c = 0; c < 4; c++) {
      const target = pad(data[c], WIDTHS[c]);
      cells[rIdx][c].forEach((sp, k) => {
        const ch = target.charAt(k);
        if (!animate || reduce) { sp.textContent = ch; return; }
        if (sp.textContent === ch && ch === ' ') return;
        const steps = 4 + Math.floor(Math.random() * 5);
        let i = 0;
        setTimeout(function tick() {
          if (!sp.isConnected) return;
          if (i < steps) { sp.textContent = CHARS.charAt(Math.floor(Math.random() * CHARS.length)); i++; setTimeout(tick, 55); }
          else sp.textContent = ch;
        }, rIdx * 90 + k * 22);
      });
    }
  }
  const render = (animate) => { for (let r = 0; r < VISIBLE; r++) setRow(r, DEPARTS[(offset + r) % DEPARTS.length], animate); };
  render(true); // les palettes tournent à l'arrivée sur la page
  if (!reduce) intervals.push(setInterval(() => { offset = (offset + 1) % DEPARTS.length; render(true); }, 4200));
}

/* ---------- Appli : aperçu interactif ---------- */
const COLORS = { transport: '#0A3D4A', logement: '#00A0C3', voiture: '#7CCBDD', activites: '#85D8C4', courses: '#C9EEE5' };
const LABELS = { transport: 'Transport', logement: 'Logement', activites: 'Activités', courses: 'Courses', voiture: 'Voiture partagée' };
const DECK = {
  solo: [
    { dest: 'Porto', meta: 'Portugal · 3 nuits · vol depuis Nantes', co2: 'CO₂ modéré', tags: ['Street art', 'Bord de mer'], parts: { transport: 130, logement: 150, activites: 60, courses: 60 } },
    { dest: 'Bruxelles', meta: 'Belgique · 2 nuits · train direct', co2: 'Bas carbone', tags: ['Train', 'Ville'], parts: { transport: 110, logement: 110, activites: 45, courses: 35 } },
    { dest: 'La Rochelle', meta: 'France · 2 nuits · train', co2: 'Bas carbone', tags: ['Train', 'Océan'], parts: { transport: 50, logement: 130, activites: 40, courses: 40 } },
  ],
  group: [
    { dest: 'Lisbonne', meta: 'Portugal · 4 nuits · logement entier · voiture', co2: 'CO₂ partagé à 3', tags: ['Logement entier', 'Road trip'], parts: { transport: 140, logement: 125, voiture: 45, activites: 55, courses: 35 } },
    { dest: 'Barcelone', meta: 'Espagne · 3 nuits · train · appartement', co2: 'Bas carbone', tags: ['Train', 'Plage'], parts: { transport: 150, logement: 120, activites: 70, courses: 60 } },
    { dest: 'Biarritz', meta: 'France · 3 nuits · voiture partagée', co2: 'CO₂ partagé à 3', tags: ['Surf', 'Covoiturage'], parts: { transport: 70, logement: 140, activites: 80, courses: 60 } },
  ],
};
function initPhone() {
  const card = $('card');
  if (!card) return;
  const tSolo = $('t-solo'), tGroup = $('t-group');
  let mode = 'solo', idx = 0, swipes = 10, busy = false;
  const euro = (n) => n.toLocaleString('fr-FR') + ' €';
  function drawCard() {
    const d = DECK[mode][idx % DECK[mode].length];
    const total = Object.values(d.parts).reduce((a, b) => a + b, 0);
    let bar = '', leg = '';
    for (const k in d.parts) {
      bar += `<i style="width:${(d.parts[k] / total * 100).toFixed(1)}%;background:${COLORS[k]}"></i>`;
      leg += `<li style="--c:${COLORS[k]}"><span>${LABELS[k]}</span><span class="num">${euro(d.parts[k])}</span></li>`;
    }
    const who = mode === 'solo' ? 'Seul' : 'À 3';
    const chips = d.tags.map((t) => `<span class="chip">${t}</span>`).join('') + `<span class="chip co2">${d.co2}</span>`;
    card.innerHTML =
      `<span class="meta">${who} · ${d.meta}</span>` +
      `<span class="dest"><svg class="pin" aria-hidden="true"><use href="#i-pin"/></svg>${d.dest}</span>` +
      `<span class="price num">${euro(total)} <small>tout compris / pers.</small></span>` +
      `<div class="split" aria-hidden="true">${bar}</div>` +
      `<ul class="legend">${leg}</ul>` +
      `<div class="chips">${chips}</div>`;
  }
  function setMode(m) {
    mode = m; idx = 0;
    tSolo.setAttribute('aria-pressed', m === 'solo' ? 'true' : 'false');
    tGroup.setAttribute('aria-pressed', m === 'group' ? 'true' : 'false');
    drawCard();
  }
  function swipe(dir) {
    if (busy) return;
    swipes = swipes > 0 ? swipes - 1 : 10;
    $('swipes-left').textContent = swipes + ' swipes restants';
    if (reduce) { idx++; drawCard(); card.style.transform = ''; return; }
    busy = true;
    card.style.transform = '';
    card.classList.add(dir === 'left' ? 'out-left' : 'out-right');
    setTimeout(() => {
      idx++; drawCard();
      card.style.transition = 'none';
      card.classList.remove('out-left', 'out-right');
      card.style.opacity = '0'; card.style.transform = 'scale(.94)';
      void card.offsetWidth;
      card.style.transition = '';
      card.style.opacity = ''; card.style.transform = '';
      busy = false;
    }, 320);
  }
  tSolo.addEventListener('click', () => setMode('solo'));
  tGroup.addEventListener('click', () => setMode('group'));
  $('btn-no').addEventListener('click', () => swipe('left'));
  $('btn-yes').addEventListener('click', () => swipe('right'));

  // Swipe au doigt ou à la souris
  let startX = null, dx = 0;
  card.addEventListener('pointerdown', (e) => {
    if (busy) return;
    startX = e.clientX; dx = 0;
    card.classList.add('dragging');
    try { card.setPointerCapture(e.pointerId); } catch (_) {}
  });
  card.addEventListener('pointermove', (e) => {
    if (startX === null) return;
    dx = e.clientX - startX;
    card.style.transform = `translateX(${dx}px) rotate(${dx / 18}deg)`;
  });
  const end = () => {
    if (startX === null) return;
    startX = null;
    card.classList.remove('dragging');
    if (Math.abs(dx) > 70) swipe(dx < 0 ? 'left' : 'right');
    else card.style.transform = '';
  };
  card.addEventListener('pointerup', end);
  card.addEventListener('pointercancel', end);
  drawCard();
}

/* ---------- Offres : calculateur des frais de groupe ---------- */
function initCalc() {
  const fb = $('f-budget'), fp = $('f-people'), fpl = $('f-plan');
  if (!fb || !fp || !fpl) return;
  const money = (n) => n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
  const groupFee = (budget, factor) => Math.min(budget * 0.05, 25) * factor; // 5 %, plafonnés à 25 €
  function calc() {
    const b = +fb.value, p = +fp.value, f = +fpl.value;
    const fee = groupFee(b, f);
    $('o-budget').textContent = b + ' €';
    $('o-people').textContent = p;
    $('r-fee').textContent = money(fee);
    $('r-pct').textContent = (fee / b * 100).toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' %';
    $('r-total').textContent = money(fee * p);
    $('r-comp').textContent = money(b * 0.18 * p);
  }
  [fb, fp, fpl].forEach((el) => el.addEventListener('input', calc));
  calc();
}

/* ---------- Investisseurs : graphique CA + EBITDA sur 5 ans ---------- */
function initChart() {
  const svg = $('chart');
  if (!svg) return;
  svg.textContent = '';
  const YEARS = ['A1', 'A2', 'A3', 'A4', 'A5'];
  const CA = [0.118, 1.03, 4.01, 10.9, 25.0];
  const EBITDA = [-0.458, -0.427, 0.639, 3.32, 9.53];
  const USERS = ['5 k', '40 k', '150 k', '400 k', '900 k'];
  const NS = 'http://www.w3.org/2000/svg';
  function el(name, attrs, text) {
    const e = document.createElementNS(NS, name);
    for (const a in attrs) e.setAttribute(a, attrs[a]);
    if (text != null) e.textContent = text;
    svg.appendChild(e); return e;
  }
  const fmt = (v) => { const d = Math.abs(v) < 10 ? 2 : 1; return v.toLocaleString('fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d }); };
  const X0 = 48, X1 = 628, TOP = 24, BASE = 230, MAX = 25;
  const h = BASE - TOP;
  [0, 5, 10, 15, 20, 25].forEach((t) => {
    const y = BASE - t / MAX * h;
    el('line', { x1: X0, x2: X1, y1: y, y2: y, stroke: 'rgba(255,255,255,.16)', 'stroke-width': 1 });
    el('text', { x: X0 - 10, y: y + 4, 'text-anchor': 'end', fill: '#a9cfc9', 'font-size': 11 }, t);
  });
  const slot = (X1 - X0) / YEARS.length, bw = slot * 0.5;
  YEARS.forEach((yr, i) => {
    const cx = X0 + slot * i + slot / 2;
    const bh = Math.max(CA[i] / MAX * h, 2);
    el('rect', { class: 'bar', style: `--i:${i}`, x: cx - bw / 2, y: BASE - bh, width: bw, height: bh, rx: 4, fill: i === 4 ? '#85D8C4' : '#00A0C3' });
    el('text', { class: 'val', style: `--i:${i}`, x: cx, y: BASE - bh - 8, 'text-anchor': 'middle', fill: '#FFFFFF', 'font-size': 13, 'font-weight': 700 }, fmt(CA[i]));
    el('text', { x: cx, y: BASE + 20, 'text-anchor': 'middle', fill: '#FFFFFF', 'font-size': 13, 'font-weight': 700 }, yr);
    el('text', { x: cx, y: BASE + 36, 'text-anchor': 'middle', fill: '#a9cfc9', 'font-size': 11 }, USERS[i] + ' util.');
    const pos = EBITDA[i] >= 0;
    const label = (pos ? '+' : '−') + fmt(Math.abs(EBITDA[i]));
    const pw = 62;
    el('rect', { x: cx - pw / 2, y: BASE + 50, width: pw, height: 24, rx: 12, fill: pos ? '#85D8C4' : 'none', stroke: pos ? '#85D8C4' : 'rgba(255,255,255,.55)', 'stroke-width': 1.5, 'stroke-dasharray': pos ? 'none' : '3 3' });
    el('text', { x: cx, y: BASE + 66, 'text-anchor': 'middle', fill: pos ? '#0A3D4A' : '#FFFFFF', 'font-size': 12, 'font-weight': 700 }, label);
  });
  el('text', { x: X0 - 40, y: BASE + 66, fill: '#a9cfc9', 'font-size': 11 }, 'EBITDA');
  el('text', { x: X0 - 40, y: TOP - 8, fill: '#a9cfc9', 'font-size': 11 }, 'CA, M€');
}

/* ---------- Transition entre pages : l'avion traverse l'écran en pointillés ---------- */
let flightToken = null;
function fly() {
  if (reduce) return;
  const box = $('flight');
  if (!box) return;
  const svg = box.querySelector('svg');
  const trail = box.querySelector('.trail');
  const mask = box.querySelector('.trail-mask');
  const plane = box.querySelector('.plane');
  const w = window.innerWidth, h = window.innerHeight;
  svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
  const d = `M -70 ${h * 0.74} C ${w * 0.28} ${h * 0.1}, ${w * 0.6} ${h * 0.86}, ${w + 70} ${h * 0.24}`;
  trail.setAttribute('d', d); mask.setAttribute('d', d);
  const L = mask.getTotalLength();
  mask.style.strokeDasharray = L;
  mask.style.strokeDashoffset = L;
  box.classList.add('on');
  if (flightToken) flightToken.on = false;
  const token = flightToken = { on: true };
  const t0 = performance.now(), D = 1050;
  (function step(now) {
    if (!token.on) return;
    const t = Math.min(Math.max((now - t0) / D, 0), 1);
    const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    const p = mask.getPointAtLength(e * L), q = mask.getPointAtLength(Math.min(e * L + 2, L));
    const rot = Math.atan2(q.y - p.y, q.x - p.x) * 180 / Math.PI;
    plane.setAttribute('transform', `translate(${p.x} ${p.y}) rotate(${rot})`);
    mask.style.strokeDashoffset = L * (1 - e);
    if (t < 1) requestAnimationFrame(step);
    else box.classList.remove('on');
  })(t0);
}

/* ---------- Cycle de vie ---------- */
function init() {
  document.documentElement.classList.add('js');
  initNav(); initOrbit(); initBoard(); initPhone(); initCalc(); initChart(); initReveal();
}
document.addEventListener('astro:page-load', init);
document.addEventListener('astro:before-preparation', fly);
document.addEventListener('astro:before-swap', cleanup);
document.addEventListener('astro:after-swap', () => document.documentElement.classList.add('js'));
