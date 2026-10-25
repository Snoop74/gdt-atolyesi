'use strict';
/* GD&T Atölyesi — core: state, XP, router, shared UI (module frame, quiz, toast, symbols) */

const GDT = {
  modules: {},
  curriculum: [],
  glossary: [],
  cleanups: [],
};

// ---------- helpers ----------
GDT.$ = (s, r = document) => r.querySelector(s);
GDT.$$ = (s, r = document) => Array.from(r.querySelectorAll(s));
GDT.el = (markup) => {
  const t = document.createElement('template');
  t.innerHTML = markup.trim();
  return t.content.firstElementChild;
};
// Turkish decimal comma and a real minus sign
GDT.num = (v, d = 3) => v.toFixed(d).replace('.', ',').replace(/^-/, '−');
GDT.signed = (v, d = 3) => (v > 0 ? '+' : v < 0 ? '' : '') + GDT.num(v, d);
GDT.clamp = (v, a, b) => Math.min(b, Math.max(a, v));
GDT.gauss = () => {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
};
GDT.shuffle = (arr) => {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
GDT.reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- persistent state ----------
GDT.store = {
  key: 'gdt-atolye-v1',
  data: { awards: {}, stars: {}, best: {}, theme: null },
  load() {
    try {
      const raw = localStorage.getItem(this.key);
      if (raw) Object.assign(this.data, JSON.parse(raw));
    } catch (e) { /* storage unavailable: run without persistence */ }
  },
  save() {
    try { localStorage.setItem(this.key, JSON.stringify(this.data)); } catch (e) { /* ignore */ }
  },
};

// ---------- XP & levels ----------
GDT.LEVELS = [
  { xp: 0, name: 'Çırak' },
  { xp: 150, name: 'Kalfa' },
  { xp: 400, name: 'Usta' },
  { xp: 800, name: 'Kalite Uzmanı' },
  { xp: 1400, name: 'Metrolog' },
];
GDT.totalXP = () => Object.values(GDT.store.data.awards).reduce((a, b) => a + b, 0);
GDT.level = (xp) => {
  const L = GDT.LEVELS;
  let i = 0;
  while (i + 1 < L.length && xp >= L[i + 1].xp) i++;
  return { i, cur: L[i], next: L[i + 1] };
};
GDT.has = (key) => key in GDT.store.data.awards;
GDT.award = (key, amount, label = '') => {
  if (GDT.has(key)) return false;
  const before = GDT.level(GDT.totalXP()).i;
  GDT.store.data.awards[key] = amount;
  GDT.store.save();
  GDT.toast(`+${amount} XP`, label);
  const after = GDT.level(GDT.totalXP());
  if (after.i > before) GDT.toast(`Seviye atladın: ${after.cur.name}`, 'Tebrikler!', 'level');
  GDT.renderXP();
  return true;
};
GDT.renderXP = () => {
  const xp = GDT.totalXP();
  const { cur, next } = GDT.level(xp);
  GDT.$('#xp-level').textContent = cur.name;
  GDT.$('#xp-value').textContent = `${xp} XP`;
  const pct = next ? (xp - cur.xp) / (next.xp - cur.xp) : 1;
  GDT.$('#xp-fill').style.width = `${pct * 100}%`;
  GDT.$('#xp-bar').title = next ? `${next.name} seviyesine ${next.xp - xp} XP` : 'En üst seviye';
};

// ---------- toast ----------
GDT.toast = (msg, sub = '', kind = '') => {
  const t = GDT.el(`<div class="toast ${kind}"><b></b><span></span></div>`);
  t.querySelector('b').textContent = msg;
  t.querySelector('span').textContent = sub;
  GDT.$('#toasts').append(t);
  requestAnimationFrame(() => t.classList.add('in'));
  setTimeout(() => {
    t.classList.remove('in');
    setTimeout(() => t.remove(), 350);
  }, 2600);
};

// ---------- ISO 1101 symbols (24×24 stroke icons) ----------
GDT.SYMBOLS = {
  straightness: '<path d="M3 12h18"/>',
  flatness: '<path d="M8 7h13l-5 10H3z"/>',
  circularity: '<circle cx="12" cy="12" r="7.5"/>',
  cylindricity: '<circle cx="12" cy="12" r="5.5"/><path d="M19.85 4.96 14.69 22.2M9.31 1.8 4.15 19.04"/>',
  lineProfile: '<path d="M4 17a8 8 0 0 1 16 0"/>',
  surfaceProfile: '<path d="M4 17a8 8 0 0 1 16 0z"/>',
  parallelism: '<path d="M5 19 11 5M13 19l6-14"/>',
  perpendicularity: '<path d="M12 4v15M4 19h16"/>',
  angularity: '<path d="M4 19h16M4 19 18 8"/>',
  position: '<circle cx="12" cy="12" r="5.5"/><path d="M12 2.5v19M2.5 12h19"/>',
  coaxiality: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4"/>',
  symmetry: '<path d="M7 7.5h10M3 12h18M7 16.5h10"/>',
  circularRunout: '<path d="M6 19 14.16 9.21"/><path d="M18 4.6 16.08 10.81 12.24 7.61z" fill="currentColor"/>',
  totalRunout: '<path d="M4 19h9M4 19l4.48-5.38M11 19l4.48-5.38"/><path d="M11.68 9.78 10.02 14.9 6.94 12.34z" fill="currentColor"/><path d="M18.68 9.78 17.02 14.9 13.94 12.34z" fill="currentColor"/>',
};
GDT.sym = (name, size = 22) =>
  `<svg class="sym" viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${GDT.SYMBOLS[name] || ''}</svg>`;
GDT.circled = (ch, size = 22) =>
  `<svg class="sym" viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="12" cy="12" r="9.5"/><text x="12" y="16.3" text-anchor="middle" font-size="12" font-weight="600" fill="currentColor" stroke="none" font-family="IBM Plex Sans, sans-serif">${ch}</text></svg>`;

// ---------- module frame ----------
GDT.STEPS = [
  { key: 'sezgi', title: 'Sezgi', hint: 'Problemle tanış', xp: 10 },
  { key: 'kavram', title: 'Kavram', hint: 'Fikri oturt', xp: 10 },
  { key: 'oyna', title: 'Oyna', hint: 'Kurcala', xp: 20 },
  { key: 'sina', title: 'Sına', hint: 'Kendini test et', xp: 10 },
];
GDT.stepKey = (id, key) => `m${id}.step.${key}`;
GDT.moduleProgress = (id) =>
  GDT.STEPS.filter((s) => GDT.has(GDT.stepKey(id, s.key))).length / GDT.STEPS.length;
GDT.registerModule = (id, def) => { GDT.modules[id] = def; };

GDT.renderModule = (root, id, stepName) => {
  const meta = GDT.curriculum.find((m) => m.id === id);
  if (!meta) return GDT.renderHome(root);
  const sec = GDT.SECTIONS.find((s) => s.id === meta.section);
  const def = GDT.modules[id];
  const page = GDT.el(`
    <section class="mod">
      <nav class="crumb"><a href="#/">Müfredat</a><span>›</span><span>${sec.id} · ${sec.title}</span><span>›</span><span>Modül ${id}</span></nav>
      <header class="mod-head">
        <div class="mod-num mono">${String(id).padStart(2, '0')}</div>
        <div>
          <h1>${meta.title}</h1>
          <p class="lead">${meta.lead}</p>
        </div>
      </header>
      <div class="mod-body"></div>
    </section>`);
  root.append(page);
  const body = page.querySelector('.mod-body');

  if (!def) {
    body.append(GDT.el(`
      <div class="card soon">
        <p class="kicker">Yapım aşamasında</p>
        <h3>Bu modülde öğreneceklerin</h3>
        <ul class="goals">${meta.goals.map((g) => `<li>${g}</li>`).join('')}</ul>
        <p class="tool-line"><b>İnteraktif araç:</b> ${meta.tool}</p>
        <a class="btn ghost" href="#/">← Müfredata dön</a>
      </div>`));
    return;
  }

  const stepper = GDT.el(`<ol class="stepper">${GDT.STEPS.map((s, i) => `
    <li><button data-i="${i}">
      <span class="st-dot mono">${i + 1}</span>
      <span class="st-txt"><b>${s.title}</b><small>${s.hint}</small></span>
    </button></li>`).join('')}</ol>`);
  const host = GDT.el('<div class="step-host"></div>');
  const nav = GDT.el(`
    <div class="step-nav">
      <button class="btn ghost" data-prev>← Önceki</button>
      <button class="btn" data-next>Sonraki →</button>
    </div>`);
  body.append(stepper, host, nav);

  const panes = [];
  let cur = -1;

  const refresh = () => {
    GDT.STEPS.forEach((s, i) => {
      const li = stepper.children[i];
      li.classList.toggle('done', GDT.has(GDT.stepKey(id, s.key)));
      li.classList.toggle('on', i === cur);
    });
    nav.querySelector('[data-prev]').disabled = cur === 0;
    const last = cur === GDT.STEPS.length - 1;
    const nextBtn = nav.querySelector('[data-next]');
    nextBtn.textContent = last ? 'Müfredata dön' : 'Sonraki →';
    if (GDT.moduleProgress(id) === 1) GDT.award(`m${id}.complete`, 25, `Modül ${id} tamamlandı`);
  };

  const show = (i) => {
    if (i < 0) return;
    if (i >= GDT.STEPS.length) { location.hash = '#/'; return; }
    cur = i;
    const s = GDT.STEPS[i];
    if (!panes[i]) {
      panes[i] = GDT.el(`<div class="step" data-step="${s.key}"></div>`);
      host.append(panes[i]);
      const api = {
        id,
        done: () => { if (GDT.award(GDT.stepKey(id, s.key), s.xp, `${meta.title} · ${s.title}`)) refresh(); },
        next: () => show(i + 1),
        onCleanup: (fn) => GDT.cleanups.push(fn),
      };
      def.steps[s.key](panes[i], api);
    }
    panes.forEach((p, k) => { if (p) p.hidden = k !== i; });
    history.replaceState(null, '', `#/m/${id}/${s.key}`);
    refresh();
    stepper.scrollIntoView({ block: 'nearest', behavior: GDT.reducedMotion() ? 'auto' : 'smooth' });
  };

  stepper.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-i]');
    if (b) show(+b.dataset.i);
  });
  nav.querySelector('[data-prev]').onclick = () => show(cur - 1);
  nav.querySelector('[data-next]').onclick = () => show(cur + 1);

  let start = GDT.STEPS.findIndex((s) => s.key === stepName);
  if (start < 0) start = GDT.STEPS.findIndex((s) => !GDT.has(GDT.stepKey(id, s.key)));
  show(start < 0 ? 0 : start);
};

// ---------- quiz ----------
// questions: [{ q, options: [...], answer: index, explain, figure? }]
GDT.quiz = (host, { id, questions, pass = 0.7, onPass }) => {
  const need = Math.ceil(questions.length * pass);
  let qi = 0, score = 0;
  const box = GDT.el('<div class="quiz card"></div>');
  host.append(box);

  const render = () => {
    if (qi >= questions.length) return finish();
    const q = questions[qi];
    const order = GDT.shuffle(q.options.map((_, k) => k));
    box.innerHTML = `
      <div class="quiz-top">
        <span class="mono">Soru ${qi + 1} / ${questions.length}</span>
        <div class="quiz-dots">${questions.map((_, k) => `<i class="${k < qi ? 'past' : ''}${k === qi ? ' now' : ''}"></i>`).join('')}</div>
      </div>
      <h3 class="quiz-q">${q.q}</h3>
      ${q.figure ? `<div class="quiz-fig">${q.figure}</div>` : ''}
      <div class="quiz-opts">${order.map((k, n) => `<button class="opt" data-k="${k}"><span class="opt-key mono">${'ABCD'[n]}</span><span>${q.options[k]}</span></button>`).join('')}</div>
      <div class="quiz-explain" hidden></div>
      <div class="quiz-actions" hidden><button class="btn">${qi + 1 < questions.length ? 'Sonraki soru →' : 'Sonucu gör'}</button></div>`;
    box.querySelectorAll('.opt').forEach((b) => {
      b.onclick = () => {
        const ok = +b.dataset.k === q.answer;
        box.querySelectorAll('.opt').forEach((o) => {
          o.disabled = true;
          if (+o.dataset.k === q.answer) o.classList.add('right');
        });
        if (!ok) b.classList.add('wrong');
        if (ok) { score++; GDT.award(`${id}.q${qi}`, 5, 'Doğru cevap'); }
        const ex = box.querySelector('.quiz-explain');
        ex.hidden = false;
        ex.className = `quiz-explain ${ok ? 'ok' : 'bad'}`;
        ex.innerHTML = `<b>${ok ? 'Doğru.' : 'Tam değil.'}</b> ${q.explain}`;
        const act = box.querySelector('.quiz-actions');
        act.hidden = false;
        act.querySelector('button').onclick = () => { qi++; render(); };
      };
    });
  };

  const finish = () => {
    const passed = score >= need;
    GDT.store.data.best[id] = Math.max(GDT.store.data.best[id] || 0, score);
    GDT.store.save();
    box.innerHTML = `
      <div class="quiz-end ${passed ? 'ok' : ''}">
        <div class="quiz-score mono">${score}<small>/${questions.length}</small></div>
        <p>${passed ? 'Geçtin! Bu modülün sınavı tamam.' : `Geçmek için en az ${need} doğru gerekiyor. Açıklamaları okuyup tekrar dene.`}</p>
        <p class="muted">En iyi skorun: ${GDT.store.data.best[id]}/${questions.length}</p>
        <button class="btn ghost" data-retry>Tekrar çöz</button>
      </div>`;
    box.querySelector('[data-retry]').onclick = () => { qi = 0; score = 0; render(); };
    if (passed && onPass) onPass(score);
  };

  render();
};

// ---------- shared step widgets ----------
GDT.parseNum = (s) => parseFloat(String(s).trim().replace(/\s/g, '').replace('−', '-').replace(',', '.'));
GDT.pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
GDT.decimals = (x) => {
  for (let d = 0; d < 4; d++) if (Math.abs(Math.round(x * 10 ** d) - x * 10 ** d) < 1e-7) return d;
  return 4;
};

// A dimension as written on a drawing: deviation form, ± form or limit form (ISO 14405-1 conventions)
GDT.dimHTML = ({ nom, up = 0, lo = 0, form = 'dev', prefix = '' }) => {
  const N = GDT.num, dn = GDT.decimals(nom);
  if (form === 'pm') {
    return `<span class="dim"><span class="dim-nom">${prefix}${N(nom, dn)}</span><span class="dim-pm">±${N(up, GDT.decimals(up))}</span></span>`;
  }
  if (form === 'limit') {
    const d = Math.max(dn, GDT.decimals(up), GDT.decimals(lo));
    return `<span class="dim">${prefix ? `<span class="dim-nom">${prefix}</span>` : ''}<span class="dim-stack dim-lim"><span>${N(nom + up, d)}</span><span>${N(nom + lo, d)}</span></span></span>`;
  }
  const d = Math.max(GDT.decimals(up), GDT.decimals(lo), 1);
  const f = (v) => (Math.abs(v) < 1e-9 ? '0' : (v > 0 ? '+' : '') + N(v, d));
  return `<span class="dim"><span class="dim-nom">${prefix}${N(nom, dn)}</span><span class="dim-stack"><span>${f(up)}</span><span>${f(lo)}</span></span></span>`;
};

// ISO 1101 tolerance frame: symbol | zone + value + modifiers | datums
GDT.fcfHTML = ({ sym, zone = '', value = '', mods = [], datums = [] }, cls = '') => {
  const v = typeof value === 'number' ? GDT.num(value, Math.max(GDT.decimals(value), 1)) : value;
  const mod = mods.map((m) => (m.length === 1 ? GDT.circled(m, 18) : `<span class="fcf-mod mono">${m}</span>`)).join('');
  return `<span class="fcf ${cls}">
    <span class="fcf-cell" data-part="sym">${sym ? GDT.sym(sym, 24) : '<span class="fcf-empty">?</span>'}</span>
    <span class="fcf-cell" data-part="tol">${v === '' ? '<span class="fcf-empty">?</span>' : `<span class="mono">${zone}${v}</span>`}${mod}</span>
    ${datums.map((d, i) => `<span class="fcf-cell mono" data-part="d${i}">${d}</span>`).join('')}
  </span>`;
};
// Boxed theoretically exact dimension and datum feature indicator
GDT.tedHTML = (v) => `<span class="ted mono">${v}</span>`;

// Dial indicator, 0,01 mm per division (one turn = 1 mm). Optional drag pointers for max/min memory.
GDT.dialSVG = (um, { max = null, min = null, size = 150 } = {}) => {
  const ang = (v) => (v / 10) * 3.6; // degrees, 10 µm = one division = 3,6°
  const ticks = [];
  for (let i = 0; i < 100; i++) {
    const major = i % 10 === 0, mid = i % 5 === 0;
    const a = (i * 3.6 * Math.PI) / 180, r1 = major ? 52 : mid ? 56 : 59;
    ticks.push(`<line x1="${70 + r1 * Math.sin(a)}" y1="${70 - r1 * Math.cos(a)}" x2="${70 + 63 * Math.sin(a)}" y2="${70 - 63 * Math.cos(a)}" class="${major ? 'dt-major' : 'dt'}"/>`);
    if (major) ticks.push(`<text x="${70 + 43 * Math.sin(a)}" y="${74 - 43 * Math.cos(a)}" text-anchor="middle" class="dl">${i}</text>`);
  }
  const ptr = (v, cls) => (v == null ? '' : `<path class="${cls}" d="M70 4l-4 9h8z" transform="rotate(${ang(v)} 70 70)"/>`);
  return `<svg class="dial" viewBox="0 0 140 140" width="${size}" height="${size}" role="img" aria-label="Komparatör ${GDT.num(um / 1000)} mm">
    <circle cx="70" cy="70" r="67" class="dial-rim"/><circle cx="70" cy="70" r="64" class="dial-face"/>
    ${ticks.join('')}${ptr(max, 'dp-max')}${ptr(min, 'dp-min')}
    <line x1="70" y1="82" x2="70" y2="12" class="dial-needle" transform="rotate(${ang(um)} 70 70)"/>
    <circle cx="70" cy="70" r="5" class="dial-hub"/>
    <text x="70" y="100" text-anchor="middle" class="dial-read">${um >= 0 ? '+' : '−'}${GDT.num(Math.abs(um) / 1000)}</text>
    <text x="70" y="112" text-anchor="middle" class="dl">0,01 mm</text>
  </svg>`;
};

// Single inline question inside a story step
GDT.ask = (host, { q, options, answer, explain, onDone }) => {
  const box = GDT.el(`
    <div class="ask card">
      <h3 class="quiz-q">${q}</h3>
      <div class="quiz-opts">${options.map((o, k) => `<button class="opt" data-k="${k}"><span class="opt-key mono">${'ABCD'[k]}</span><span>${o}</span></button>`).join('')}</div>
      <div class="quiz-explain" hidden></div>
    </div>`);
  host.append(box);
  box.querySelectorAll('.opt').forEach((b) => {
    b.onclick = () => {
      const ok = +b.dataset.k === answer;
      box.querySelectorAll('.opt').forEach((o) => {
        o.disabled = true;
        if (+o.dataset.k === answer) o.classList.add('right');
      });
      if (!ok) b.classList.add('wrong');
      const ex = box.querySelector('.quiz-explain');
      ex.hidden = false;
      ex.className = `quiz-explain ${ok ? 'ok' : 'bad'}`;
      ex.innerHTML = `<b>${ok ? 'Doğru.' : 'Tam değil.'}</b> ${explain}`;
      onDone(ok);
    };
  });
  box.scrollIntoView({ block: 'nearest', behavior: GDT.reducedMotion() ? 'auto' : 'smooth' });
};

// Slide carousel for Kavram steps; completes the step when the last slide is reached
GDT.carousel = (el, slides, api) => {
  el.innerHTML = `
    <div class="carousel card">
      <div class="car-head"><div class="car-dots"></div><span class="mono car-count"></span></div>
      <div class="car-body"></div>
      <div class="car-nav"><button class="btn ghost" data-car-prev>← Geri</button><button class="btn" data-car-next>İleri →</button></div>
    </div>`;
  const body = el.querySelector('.car-body');
  const prevBtn = el.querySelector('[data-car-prev]'), nextBtn = el.querySelector('[data-car-next]');
  const dots = el.querySelector('.car-dots');
  const panes = [];
  let cur = 0, seen = 0;
  const show = (i) => {
    cur = GDT.clamp(i, 0, slides.length - 1);
    seen = Math.max(seen, cur);
    if (!panes[cur]) {
      panes[cur] = GDT.el('<div class="slide"></div>');
      body.append(panes[cur]);
      slides[cur](panes[cur], api);
    }
    panes.forEach((p, k) => { if (p) p.hidden = k !== cur; });
    dots.innerHTML = slides.map((_, k) => `<button class="${k === cur ? 'now' : k <= seen ? 'past' : ''}" data-k="${k}" aria-label="Slayt ${k + 1}"></button>`).join('');
    el.querySelector('.car-count').textContent = `${cur + 1} / ${slides.length}`;
    prevBtn.disabled = cur === 0;
    nextBtn.hidden = cur === slides.length - 1;
    if (cur === slides.length - 1) api.done();
  };
  dots.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) show(+b.dataset.k); });
  prevBtn.onclick = () => show(cur - 1);
  nextBtn.onclick = () => show(cur + 1);
  show(0);
};

// Three-star challenges: best result persists, each star gives XP once
GDT.starsHTML = (texts) =>
  `<ol class="stars-list">${texts.map((t, i) => `<li data-star="${i}"><span class="star">★</span><span>${t}</span></li>`).join('')}</ol>`;
GDT.giveStars = (id, n, label) => {
  const key = `m${id}`;
  if (n > (GDT.store.data.stars[key] || 0)) { GDT.store.data.stars[key] = n; GDT.store.save(); }
  for (let i = 1; i <= n; i++) GDT.award(`m${id}.star${i}`, 10, `${label} ${i}. yıldız`);
};
GDT.syncStars = (root, id) => {
  const best = GDT.store.data.stars[`m${id}`] || 0;
  root.querySelectorAll('.stars-list li').forEach((li, i) => li.classList.toggle('got', i < best));
};

// ---------- router ----------
GDT.route = () => {
  GDT.cleanups.splice(0).forEach((fn) => { try { fn(); } catch (e) { /* ignore */ } });
  const app = GDT.$('#app');
  app.innerHTML = '';
  window.scrollTo(0, 0);
  const m = location.hash.match(/^#\/m\/(\d+)(?:\/(\w+))?/);
  if (m) GDT.renderModule(app, +m[1], m[2]);
  else GDT.renderHome(app);
};
