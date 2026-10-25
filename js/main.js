'use strict';
/* Home page, glossary drawer, theme, boot */

const CARD_SYMBOLS = {
  7: ['straightness', 'flatness', 'circularity', 'cylindricity'],
  8: ['parallelism', 'perpendicularity', 'angularity'],
  9: ['position', 'coaxiality', 'symmetry'],
  10: ['lineProfile', 'surfaceProfile'],
  11: ['circularRunout', 'totalRunout'],
};

// Hero tolerance frame: each cell explains itself on hover/focus
const HERO_FRAME = [
  { html: () => GDT.sym('position', 26), tip: '<b>Karakteristik:</b> konum. Elemanın ideal yerinden ne kadar sapabileceğini sınırlar.' },
  { html: () => `<span class="mono">Ø0,1</span>${GDT.circled('M', 20)}`, tip: '<b>Tolerans:</b> Ø0,1 mm silindirik bölge. <b>Ⓜ</b> ile delik büyüdükçe ek tolerans kazanılır.' },
  { html: () => '<span class="mono">A</span>', tip: '<b>Birincil datum A:</b> parça önce bu yüzeye oturur, 3 serbestlik kilitlenir.' },
  { html: () => '<span class="mono">B</span>', tip: '<b>İkincil datum B:</b> 2 serbestlik daha kilitlenir.' },
  { html: () => '<span class="mono">C</span>', tip: '<b>Üçüncül datum C:</b> kalan son serbestlik. Artık ölçüm başlangıcı belli.' },
];

GDT.renderHome = (root) => {
  const ready = GDT.curriculum.filter((m) => GDT.modules[m.id]);
  const nextMod = ready.find((m) => GDT.moduleProgress(m.id) < 1) || ready[0];
  const started = GDT.totalXP() > 0;
  const doneCount = GDT.curriculum.filter((m) => GDT.moduleProgress(m.id) === 1).length;

  const page = GDT.el(`
    <div class="home">
      <section class="hero">
        <div class="hero-txt">
          <p class="kicker">ISO GPS · interaktif müfredat</p>
          <h1>Toleransı <em>kurcalayarak</em> öğren.</h1>
          <p class="lead">15 modülde genel toleranslardan ileri GD&amp;T'ye. Her modülde önce bir problemle karşılaşır, sonra kavramı oturtur, araçla oynar ve kendini sınarsın.</p>
          <div class="hero-cta">
            <a class="btn big" href="#/m/${nextMod.id}">${started ? 'Devam et' : 'Başla'}: Modül ${nextMod.id}</a>
            <button class="btn ghost big" data-gloss>Sembol sözlüğü</button>
          </div>
        </div>
        <div class="hero-art card">
          <p class="kicker">Bir tolerans çerçevesi. Bölmelerin üzerine gel.</p>
          <div class="fcf hero-fcf" role="group" aria-label="Örnek tolerans çerçevesi">
            ${HERO_FRAME.map((c, i) => `<button class="fcf-cell" data-i="${i}">${c.html()}</button>`).join('')}
          </div>
          <p class="fcf-tip" id="hero-tip">Final modülünde bunun gibi bir çerçeveyi gözünü kırpmadan okuyacaksın.</p>
        </div>
      </section>

      <section class="loop">
        ${GDT.STEPS.map((s, i) => `
          <div class="loop-step"><span class="st-dot mono">${i + 1}</span><div><b>${s.title}</b><small>${s.hint}</small></div></div>
          ${i < GDT.STEPS.length - 1 ? '<span class="loop-arrow" aria-hidden="true">→</span>' : ''}`).join('')}
      </section>

      <section class="stats">
        <div class="stat"><span class="mono">${GDT.totalXP()}</span><small>XP</small></div>
        <div class="stat"><span class="mono">${doneCount}/${GDT.curriculum.length}</span><small>modül tamam</small></div>
        <div class="stat"><span>${GDT.level(GDT.totalXP()).cur.name}</span><small>seviye</small></div>
      </section>

      ${GDT.SECTIONS.map((sec) => `
        <section class="section">
          <header class="section-head">
            <span class="section-id mono">${sec.id}</span>
            <div><h2>${sec.title}</h2><p>${sec.sub}</p></div>
          </header>
          <div class="cards">
            ${GDT.curriculum.filter((m) => m.section === sec.id).map(card).join('')}
          </div>
        </section>`).join('')}

      <footer class="foot">
        <p>Referans standartlar: ISO 1101 (geometrik toleranslar), ISO 5459 (datumlar), ISO 2692 (malzeme gereklilikleri), ISO 8015 (temel kavramlar), ISO 14405-1 (boyut toleransları), ISO 2768, ISO 286. Sayısal örnekler eğitim amaçlıdır; tasarımda standardın güncel baskısına bakın.</p>
      </footer>
    </div>`);
  root.append(page);

  const tip = page.querySelector('#hero-tip');
  page.querySelectorAll('.fcf-cell').forEach((b) => {
    const showTip = () => {
      page.querySelectorAll('.fcf-cell').forEach((x) => x.classList.toggle('on', x === b));
      tip.innerHTML = HERO_FRAME[+b.dataset.i].tip;
    };
    b.addEventListener('mouseenter', showTip);
    b.addEventListener('focus', showTip);
    b.addEventListener('click', showTip);
  });
  page.querySelector('[data-gloss]').onclick = () => openGlossary();
};

function card(m) {
  const isReady = !!GDT.modules[m.id];
  const prog = GDT.moduleProgress(m.id);
  const state = !isReady ? 'soon' : prog === 1 ? 'done' : 'ready';
  const badge = { soon: 'Yakında', ready: prog > 0 ? 'Devam ediyor' : 'Hazır', done: 'Tamamlandı ✓' }[state];
  const r = 15, c = 2 * Math.PI * r;
  const syms = CARD_SYMBOLS[m.id];
  return `
    <a class="mcard ${state}" href="#/m/${m.id}">
      <div class="mcard-top">
        <span class="mcard-num mono">${String(m.id).padStart(2, '0')}</span>
        ${isReady ? `<svg class="ring" viewBox="0 0 36 36" width="34" height="34" aria-label="İlerleme %${Math.round(prog * 100)}">
          <circle cx="18" cy="18" r="${r}" class="ring-bg"/>
          <circle cx="18" cy="18" r="${r}" class="ring-fg" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - prog)}"/>
        </svg>` : ''}
      </div>
      <h3>${m.title}</h3>
      <p>${m.lead}</p>
      ${syms ? `<div class="mcard-syms">${syms.map((s) => GDT.sym(s, 20)).join('')}</div>` : ''}
      <div class="mcard-foot">
        <span class="mcard-tool">${m.tool}</span>
        <span class="badge">${badge}</span>
      </div>
    </a>`;
}

// ---------- glossary drawer ----------
function renderGlossary(filter = '') {
  const q = filter.trim().toLocaleLowerCase('tr');
  const list = GDT.$('#glossary-list');
  const hits = GDT.glossary.filter((g) =>
    !q || `${g.name} ${g.en} ${g.def} ${g.group}`.toLocaleLowerCase('tr').includes(q));
  const groups = [...new Set(hits.map((g) => g.group))];
  list.innerHTML = groups.length ? groups.map((grp) => `
    <h3 class="gl-group">${grp}</h3>
    ${hits.filter((g) => g.group === grp).map((g) => `
      <article class="gl-item">
        <div class="gl-icon">${GDT.glossaryIcon(g)}</div>
        <div>
          <h4>${g.name} <small>${g.en}</small></h4>
          <p>${g.def}</p>
          <a href="#/m/${g.module}" class="gl-link">Modül ${g.module} →</a>
        </div>
      </article>`).join('')}`).join('')
    : '<p class="muted">Sonuç yok.</p>';
}
function openGlossary() {
  const d = GDT.$('#glossary');
  d.classList.add('open');
  d.setAttribute('aria-hidden', 'false');
  GDT.$('#scrim').hidden = false;
  GDT.$('#glossary-search').focus();
}
function closeGlossary() {
  const d = GDT.$('#glossary');
  d.classList.remove('open');
  d.setAttribute('aria-hidden', 'true');
  GDT.$('#scrim').hidden = true;
}

// ---------- theme ----------
function applyTheme() {
  const t = GDT.store.data.theme;
  if (t) document.documentElement.dataset.theme = t;
  else delete document.documentElement.dataset.theme;
}
function toggleTheme() {
  const dark = document.documentElement.dataset.theme
    ? document.documentElement.dataset.theme === 'dark'
    : window.matchMedia('(prefers-color-scheme: dark)').matches;
  GDT.store.data.theme = dark ? 'light' : 'dark';
  GDT.store.save();
  applyTheme();
}

// ---------- boot ----------
GDT.store.load();
applyTheme();
GDT.renderXP();
renderGlossary();
GDT.$('#btn-glossary').onclick = openGlossary;
GDT.$('#btn-glossary-close').onclick = closeGlossary;
GDT.$('#scrim').onclick = closeGlossary;
GDT.$('#glossary-search').oninput = (e) => renderGlossary(e.target.value);
GDT.$('#glossary-list').addEventListener('click', (e) => { if (e.target.closest('a')) closeGlossary(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeGlossary(); });
GDT.$('#btn-theme').onclick = toggleTheme;
window.addEventListener('hashchange', GDT.route);
GDT.route();
