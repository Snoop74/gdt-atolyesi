'use strict';
/* Module 1 — Boyutlandırma temelleri (Sezgi: four notations, Kavram: 4 slides, Oyna: dimension reading game, Sına: quiz) */
(() => {
  const N = GDT.num;
  const dim = GDT.dimHTML;

  // ======================================================================
  // SEZGİ — four notations, one of them describes a different part
  // ======================================================================
  const NOTES = [
    { k: 'A', nom: 20, up: 0.05, lo: -0.05, form: 'pm' },
    { k: 'B', nom: 20, up: 0.05, lo: -0.05, form: 'limit' },
    { k: 'C', nom: 19.95, up: 0.1, lo: 0, form: 'dev' },
    { k: 'D', nom: 20, up: 0.1, lo: 0, form: 'dev' },
  ];

  function sezgi(el, api) {
    const shown = new Set();
    let asked = false;
    el.innerHTML = `
      <div class="story card">
        <p class="kicker">Durum</p>
        <p>Dört farklı resimde aynı mil için dört farklı ölçü yazılmış. Tedarikçi “hepsi aynı şey” diyor. Haklı mı? Her yazıma tıkla, sayı doğrusunda hangi aralığı tarif ettiğini gör.</p>
      </div>
      <div class="card">
        <div class="notes4">${NOTES.map((n, i) => `
          <button class="note-card c${i + 1}" data-i="${i}">
            <span class="note-k mono">${n.k}</span>
            <span class="note-dim">${dim(n)}</span>
            <small>Sayı doğrusuna çiz</small>
          </button>`).join('')}
        </div>
        <div class="nl4"></div>
        <p class="hint">Dört yazımın dördünü de çiz.</p>
      </div>
      <div class="asks"></div>`;
    const $ = (s) => el.querySelector(s);
    const a = 19.9, b = 20.15, x = (v) => 30 + ((v - a) / (b - a)) * 540;

    function draw() {
      const ticks = [];
      for (let v = a; v <= b + 1e-9; v += 0.05) {
        ticks.push(`<line class="nl-tick" x1="${x(v)}" y1="86" x2="${x(v)}" y2="92"/><text class="nl-lbl" x="${x(v)}" y="106" text-anchor="middle">${N(v, 2)}</text>`);
      }
      const bands = NOTES.map((n, i) => {
        if (!shown.has(i)) return '';
        const lo = n.nom + n.lo, hi = n.nom + n.up, y = 8 + i * 19;
        return `<g class="band c${i + 1}"><rect x="${x(lo)}" y="${y}" width="${x(hi) - x(lo)}" height="14" rx="3"/>
          <text x="${x(lo) - 6}" y="${y + 11}" text-anchor="end">${n.k}</text>
          <text class="band-r" x="${x(hi) + 6}" y="${y + 11}">${N(lo, 2)} – ${N(hi, 2)}</text></g>`;
      }).join('');
      $('.nl4').innerHTML = `<svg viewBox="0 0 640 112" role="img" aria-label="Dört yazımın sayı doğrusu">
        <line class="nl-nom" x1="${x(20)}" y1="2" x2="${x(20)}" y2="86"/>
        ${bands}<line class="nl-axis" x1="30" y1="86" x2="570" y2="86"/>${ticks.join('')}</svg>`;
      el.querySelectorAll('.note-card').forEach((c) => c.classList.toggle('on', shown.has(+c.dataset.i)));
      if (shown.size === 4 && !asked) { asked = true; askOdd(); }
    }

    function askOdd() {
      $('.hint').textContent = 'Bantları karşılaştır.';
      GDT.ask($('.asks'), {
        q: 'Hangi yazım diğerlerinden farklı bir parça tarif ediyor?',
        options: NOTES.map((n) => `<span class="note-dim inline">${dim(n)}</span>`),
        answer: 3,
        explain: 'A, B ve C aynı aralığı tarif ediyor: <b>19,95 – 20,05</b>. D ise <b>20,00 – 20,10</b>. Tolerans genişliği aynı (0,1 mm) ama bölge kaymış; D’ye göre yapılan bir mil A’ya göre ret yiyebilir.',
        onDone: () => {
          const take = GDT.el(`
            <div class="takeaway card">
              <p class="kicker">Ana fikir</p>
              <p><b>Bir ölçünün asıl bilgisi iki sınır ölçüsüdür.</b> Nominal ölçü ve sapmalar yalnızca bu iki sınıra ulaşmanın yazım biçimidir. Ölçü okurken her zaman önce üst ve alt sınırı hesapla.</p>
              <button class="btn" data-next>Kavram adımına geç →</button>
            </div>`);
          $('.asks').append(take);
          take.querySelector('[data-next]').onclick = api.next;
          api.done();
        },
      });
    }

    el.querySelector('.notes4').addEventListener('click', (e) => {
      const c = e.target.closest('.note-card');
      if (!c) return;
      shown.add(+c.dataset.i);
      draw();
    });
    draw();
  }

  // ======================================================================
  // KAVRAM
  // ======================================================================
  function kavram(el, api) {
    GDT.carousel(el, [slideAnatomy, slideRules, slideChain, slideClosed], api);
  }

  // --- slide 1: anatomy of a toleranced size ---
  function slideAnatomy(el) {
    const S = { kind: 'mil', nom: 40, up: 0.1, lo: -0.05 };
    el.innerHTML = `
      <div class="slide-grid">
        <div>
          <p class="kicker">1 · Anatomi</p>
          <h3>Bir toleranslı ölçünün parçaları</h3>
          <p><b>Nominal ölçü</b> sıfır çizgisidir. <b>Sapmalar</b> sıfır çizgisinden ölçülür ve negatif olabilir. İkisinin arası <b>tolerans bölgesidir</b>; genişliği <b>tolerans</b>, yani her zaman pozitif bir sayıdır.</p>
          <div class="seg" data-kind><button data-v="mil">Mil (dış ölçü)</button><button data-v="delik">Delik (iç ölçü)</button></div>
          <label class="slider"><span>Nominal ölçü <output class="mono" data-o="nom"></output></span><input type="range" min="10" max="100" step="1" value="40" data-k="nom"></label>
          <label class="slider"><span><span data-l="up"></span> <output class="mono" data-o="up"></output></span><input type="range" min="-0.2" max="0.2" step="0.01" value="0.1" data-k="up"></label>
          <label class="slider"><span><span data-l="lo"></span> <output class="mono" data-o="lo"></output></span><input type="range" min="-0.2" max="0.2" step="0.01" value="-0.05" data-k="lo"></label>
        </div>
        <div>
          <svg class="anat" viewBox="0 0 460 290" role="img" aria-label="Tolerans bölgesi şeması"></svg>
          <div class="forms3"></div>
        </div>
      </div>`;
    const svg = el.querySelector('.anat');
    const y = (d) => 145 - d * 500;

    function draw() {
      const U = S.nom + S.up, L = S.nom + S.lo, T = S.up - S.lo;
      const hole = S.kind === 'delik';
      const nUp = hole ? 'ES' : 'es', nLo = hole ? 'EI' : 'ei';
      el.querySelectorAll('[data-kind] button').forEach((b) => b.classList.toggle('on', b.dataset.v === S.kind));
      el.querySelector('[data-l="up"]').textContent = `Üst sapma ${nUp}`;
      el.querySelector('[data-l="lo"]').textContent = `Alt sapma ${nLo}`;
      el.querySelector('[data-o="nom"]').textContent = `${S.nom} mm`;
      el.querySelector('[data-o="up"]').textContent = GDT.signed(S.up, 2);
      el.querySelector('[data-o="lo"]').textContent = GDT.signed(S.lo, 2);
      const yu = y(S.up), yl = y(S.lo);
      const arrow = (x, y1, y2) => Math.abs(y2 - y1) < 2 ? '' :
        `<line class="an-dim" x1="${x}" y1="${y1}" x2="${x}" y2="${y2}"/><path class="an-head" d="M${x} ${y2}l-3.5 ${y2 > y1 ? -8 : 8}h7z"/>`;
      svg.innerHTML = `
        <line class="an-zero" x1="20" y1="145" x2="440" y2="145"/>
        <text class="an-lbl" x="438" y="160" text-anchor="end">sıfır çizgisi = nominal ${S.nom}</text>
        <rect class="an-zone ${hole ? 'hole' : 'shaft'}" x="200" y="${yu}" width="110" height="${yl - yu}"/>
        ${arrow(150, 145, yu)}<text class="an-lbl strong" x="144" y="${(145 + yu) / 2 + 4}" text-anchor="end">${nUp} ${GDT.signed(S.up, 2)}</text>
        ${arrow(105, 145, yl)}<text class="an-lbl strong" x="99" y="${(145 + yl) / 2 + 4}" text-anchor="end">${nLo} ${GDT.signed(S.lo, 2)}</text>
        <line class="an-dim" x1="340" y1="${yu}" x2="340" y2="${yl}"/>
        <line class="an-ext" x1="310" y1="${yu}" x2="350" y2="${yu}"/><line class="an-ext" x1="310" y1="${yl}" x2="350" y2="${yl}"/>
        <text class="an-lbl strong tol" x="350" y="${(yu + yl) / 2 + 4}">tolerans ${N(T, 2)}</text>
        <text class="an-lbl" x="255" y="${yu - 8}" text-anchor="middle">üst sınır ${N(U, 2)}</text>
        <text class="an-lbl" x="255" y="${yl + 16}" text-anchor="middle">alt sınır ${N(L, 2)}</text>`;
      const sym = Math.abs(S.up + S.lo) < 1e-9;
      el.querySelector('.forms3').innerHTML = `
        <div><small>Sapma ile</small>${dim({ nom: S.nom, up: S.up, lo: S.lo })}</div>
        <div><small>± ile</small>${sym ? dim({ nom: S.nom, up: S.up, form: 'pm' }) : '<span class="muted small">yalnızca simetrik bölgede</span>'}</div>
        <div><small>Sınır ölçüleriyle</small>${dim({ nom: S.nom, up: S.up, lo: S.lo, form: 'limit' })}</div>`;
    }

    el.addEventListener('input', (e) => {
      const k = e.target.dataset.k;
      if (!k) return;
      S[k] = Math.round(+e.target.value * 100) / 100;
      // keep the zone at least 0,01 wide: the slider being dragged pushes the other one
      if (S.up - S.lo < 0.01) {
        if (k === 'up') { S.lo = Math.max(-0.2, S.up - 0.01); if (S.up - S.lo < 0.01) S.up = S.lo + 0.01; }
        else { S.up = Math.min(0.2, S.lo + 0.01); if (S.up - S.lo < 0.01) S.lo = S.up - 0.01; }
        el.querySelector('[data-k="up"]').value = S.up;
        el.querySelector('[data-k="lo"]').value = S.lo;
      }
      draw();
    });
    el.querySelector('[data-kind]').addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (b) { S.kind = b.dataset.v; draw(); }
    });
    draw();
  }

  // --- slide 2: writing rules, flip the wrong notations ---
  const raw = (top, bot, nom = '25') =>
    `<span class="dim">${nom ? `<span class="dim-nom">${nom}</span>` : ''}<span class="dim-stack${nom ? '' : ' dim-lim'}"><span>${top}</span><span>${bot}</span></span></span>`;
  const RULES = [
    { wrong: raw('+0,1', '−0,05'), right: dim({ nom: 25, up: 0.1, lo: -0.05 }), rule: 'İki sapma <b>aynı sayıda ondalıkla</b> yazılır.' },
    { wrong: raw('+0,1', '−0'), right: dim({ nom: 25, up: 0.1, lo: 0 }), rule: 'Sıfır sapma <b>işaretsiz</b> yazılır: “0”.' },
    { wrong: raw('−0,1', '+0,1'), right: dim({ nom: 25, up: 0.1, form: 'pm' }), rule: '<b>Üst sapma üstte</b> yazılır; iki sapma eşitse <b>±</b> kullanılır.' },
    { wrong: raw('24,9', '25,1', ''), right: dim({ nom: 25, up: 0.1, lo: -0.1, form: 'limit' }), rule: 'Sınır ölçüleriyle yazımda <b>büyük sınır üstte</b>.' },
  ];

  function slideRules(el) {
    el.innerHTML = `
      <p class="kicker">2 · Yazım kuralları</p>
      <h3>Hatayı bul</h3>
      <p>Aşağıdaki dört yazımın her birinde bir kural ihlali var. Karta tıkla, doğrusunu ve kuralı gör.</p>
      <div class="flips">${RULES.map((r, i) => `
        <button class="flip" data-i="${i}">
          <span class="flip-face front"><small>Hatalı</small><span class="note-dim">${r.wrong}</span><em>Tıkla</em></span>
          <span class="flip-face back"><small>Doğrusu</small><span class="note-dim">${r.right}</span><em>${r.rule}</em></span>
        </button>`).join('')}
      </div>
      <p class="muted small flips-sum">Ölçü birimi resimlerde varsayılan olarak mm’dir ve yazılmaz.</p>`;
    let n = 0;
    el.querySelector('.flips').addEventListener('click', (e) => {
      const f = e.target.closest('.flip');
      if (!f || f.classList.contains('flipped')) return;
      f.classList.add('flipped');
      if (++n === RULES.length) el.querySelector('.flips-sum').innerHTML = '<b>Dördünü de buldun.</b> Bu kurallar okuma hatalarını önler: atölyede “−0” ya da tek ondalık, sapmanın yanlış okunmasına yol açar.';
    });
  }

  // --- slide 3: chain vs baseline dimensioning ---
  function slideChain(el) {
    let mode = 'chain', T = 0.1;
    el.innerHTML = `
      <div class="slide-grid wide-right">
        <div>
          <p class="kicker">3 · Ölçülendirme biçimi</p>
          <h3>Zincir mi, referanstan mı?</h3>
          <p>Dört delik 25 mm arayla. Her ölçünün toleransı aynı. Ama ölçüleri nasıl yerleştirdiğin, hangi mesafenin ne kadar değişebileceğini belirler.</p>
          <div class="seg" data-mode><button data-v="chain">Zincir ölçülendirme</button><button data-v="base">Referanstan ölçülendirme</button></div>
          <label class="slider"><span>Her ölçünün toleransı <output class="mono" data-o></output></span><input type="range" min="0.02" max="0.2" step="0.01" value="0.1" data-t></label>
          <div class="cost-info chain-info"></div>
        </div>
        <svg class="chain-svg" viewBox="0 0 580 250" role="img" aria-label="Delikli plaka ölçülendirmesi"></svg>
      </div>
      <p class="callout">Kural (ISO 129-1): <b>fonksiyonel olarak önemli mesafeyi doğrudan ölçülendir.</b> Delikler arası mesafe önemliyse zincir, kenara göre konum önemliyse referanstan ölçülendirme.</p>`;
    const svg = el.querySelector('.chain-svg');
    const X = (mm) => 40 + mm * 4;
    const holes = [25, 50, 75, 100];

    function draw() {
      el.querySelectorAll('[data-mode] button').forEach((b) => b.classList.toggle('on', b.dataset.v === mode));
      el.querySelector('[data-o]').textContent = `±${N(T, 2)}`;
      // accumulated position uncertainty of each hole relative to the left edge
      const acc = holes.map((_, i) => (mode === 'chain' ? (i + 1) * T : T));
      const gap34 = mode === 'chain' ? T : 2 * T;
      el.querySelector('.chain-info').innerHTML = `
        <div><small>Kenar → 4. delik</small><b class="mono">±${N(acc[3], 2)}</b></div>
        <div><small>3. → 4. delik arası</small><b class="mono">±${N(gap34, 2)}</b></div>
        <div><small>Ölçü sayısı</small><b class="mono">4</b></div>`;
      let dims = '';
      const dimLine = (x1, x2, yy, txt) => `
        <line class="drw-ext" x1="${x1}" y1="92" x2="${x1}" y2="${yy - 4}"/><line class="drw-ext" x1="${x2}" y1="92" x2="${x2}" y2="${yy - 4}"/>
        <line class="drw-dim" x1="${x1}" y1="${yy}" x2="${x2}" y2="${yy}"/>
        <path class="drw-arrow" d="M${x1} ${yy}l8-3v6z"/><path class="drw-arrow" d="M${x2} ${yy}l-8-3v6z"/>
        <text class="drw-txt sm" x="${(x1 + x2) / 2}" y="${yy - 4}" text-anchor="middle">${txt} ±${N(T, 2)}</text>`;
      if (mode === 'chain') holes.forEach((h, i) => { dims += dimLine(X(i ? holes[i - 1] : 0), X(h), 70, 25); });
      else holes.forEach((h, i) => { dims += dimLine(X(0), X(h), 76 - i * 16, h); });
      const unc = holes.map((h, i) => {
        const w = acc[i] * 4 * 30;
        return `<rect class="unc" x="${X(h) - w}" y="96" width="${2 * w}" height="60" rx="4"/>`;
      }).join('');
      svg.innerHTML = `
        <rect class="drw-obj" x="${X(0)}" y="96" width="${125 * 4}" height="60"/>
        ${unc}
        ${holes.map((h) => `<circle class="drw-hole" cx="${X(h)}" cy="126" r="9"/><path class="drw-cl" d="M${X(h)} 108v36M${X(h) - 14} 126h28"/>`).join('')}
        ${dims}
        <text class="ax-lbl" x="${X(0)}" y="180">turuncu bant: deliğin kenara göre olası konum aralığı (×30 abartılı)</text>
        <text class="ax-lbl" x="${X(0)}" y="198">${mode === 'chain' ? 'Zincirde toleranslar birikir: son delik 4 toleransın toplamı kadar oynar.' : 'Referanstan her delik tek bir tolerans kadar oynar; ama iki delik arası iki toleransı toplar.'}</text>`;
    }
    el.querySelector('[data-mode]').addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (b) { mode = b.dataset.v; draw(); }
    });
    el.querySelector('[data-t]').oninput = (e) => { T = +e.target.value; draw(); };
    draw();
  }

  // --- slide 4: closed chain and auxiliary dimensions ---
  function slideClosed(el) {
    const segs = [{ v: 30, x0: 0, x1: 30 }, { v: 40, x0: 30, x1: 70 }, { v: 30, x0: 70, x1: 100 }, { v: 100, x0: 0, x1: 100, total: true }];
    const aux = new Set();
    el.innerHTML = `
      <p class="kicker">4 · Kapalı zincir</p>
      <h3>Bir ölçü fazla</h3>
      <p>Kademeli bir milde üç parça ölçüsü ve bir toplam boy verilmiş; hepsi ±0,1. Ölçülere tıklayıp birini <b>yardımcı ölçüye</b> (parantez içinde) çevir.</p>
      <svg class="closed-svg" viewBox="0 0 560 190" role="img" aria-label="Kademeli mil ölçüleri"></svg>
      <div class="msg closed-msg"></div>`;
    const svg = el.querySelector('.closed-svg');
    const X = (mm) => 60 + mm * 4.4;

    function draw() {
      const dims = segs.map((s, i) => {
        const yy = s.total ? 26 : 60, x1 = X(s.x0), x2 = X(s.x1);
        const txt = aux.has(i) ? `(${s.v})` : `${s.v} ±0,1`;
        return `<g class="cdim ${aux.has(i) ? 'aux' : ''}" data-i="${i}" tabindex="0" role="button">
          <line class="drw-ext" x1="${x1}" y1="${yy - 6}" x2="${x1}" y2="${s.total ? 92 : 92}"/><line class="drw-ext" x1="${x2}" y1="${yy - 6}" x2="${x2}" y2="92"/>
          <line class="drw-dim" x1="${x1}" y1="${yy}" x2="${x2}" y2="${yy}"/>
          <path class="drw-arrow" d="M${x1} ${yy}l8-3v6z"/><path class="drw-arrow" d="M${x2} ${yy}l-8-3v6z"/>
          <rect class="cdim-hit" x="${(x1 + x2) / 2 - 40}" y="${yy - 20}" width="80" height="22" rx="4"/>
          <text class="drw-txt sm" x="${(x1 + x2) / 2}" y="${yy - 5}" text-anchor="middle">${txt}</text></g>`;
      }).join('');
      svg.innerHTML = `
        <line class="drw-cl" x1="${X(-6)}" y1="135" x2="${X(106)}" y2="135"/>
        <path class="drw-obj" d="M${X(0)} 110H${X(30)}V95H${X(70)}V115H${X(100)}V155H${X(70)}V175H${X(30)}V160H${X(0)}Z"/>
        ${dims}`;
      const msg = el.querySelector('.closed-msg');
      if (aux.size === 0) {
        msg.className = 'msg bad closed-msg';
        msg.innerHTML = 'Çelişki: üç parça kendi toleranslarında yapılırsa toplam <b>99,7 – 100,3</b> olabilir, ama toplam ölçü <b>99,9 – 100,1</b> istiyor. Hangisine uyulacak? Resim kendisiyle çelişiyor; buna <b>kapalı zincir</b> denir.';
      } else if (aux.size === 1) {
        const s = segs[[...aux][0]];
        msg.className = 'msg ok closed-msg';
        msg.innerHTML = `Çözüldü. <b>(${s.v})</b> artık yardımcı ölçü: yalnızca bilgi verir, toleransı yoktur, muayene edilmez. Değeri diğer ölçülerden çıkar. ${s.total ? 'Toplam boy artık üç toleransın birikimi kadar (±0,3) değişebilir; toplam boy fonksiyonel ise onun yerine bir parça ölçüsünü yardımcı yap.' : 'Bu parçanın boyu artık diğer iki parça ve toplam boyun toleranslarından oluşur (±0,3).'}`;
      } else {
        msg.className = 'msg warn closed-msg';
        msg.textContent = 'Bu sefer eksik kaldı: iki ölçü yardımcı olunca parçanın boyları tam tanımlanmıyor. Yalnızca bir ölçüyü parantez içine al.';
      }
    }
    const toggle = (g) => {
      const i = +g.dataset.i;
      if (aux.has(i)) aux.delete(i); else aux.add(i);
      draw();
    };
    svg.addEventListener('click', (e) => { const g = e.target.closest('.cdim'); if (g) toggle(g); });
    svg.addEventListener('keydown', (e) => { const g = e.target.closest('.cdim'); if (g && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); toggle(g); } });
    draw();
  }

  // ======================================================================
  // OYNA — dimension reading game
  // ======================================================================
  const ROUNDS = 10;
  const STARS = ['En az 5 turu doğru bil', 'En az 8 turu doğru bil', '10 turun hepsini doğru bil'];
  const NOMS = [12, 16, 20, 25, 32, 40, 50, 63, 80, 100, 125, 160];
  const DEV_PAIRS = [[0.1, 0], [0, -0.1], [0.05, -0.02], [0.2, 0.1], [-0.02, -0.06], [0.15, -0.05], [0.03, 0], [0, -0.05], [0.25, 0.05], [-0.1, -0.3]];
  const r3 = (v) => Math.round(v * 1000) / 1000;

  function genRound() {
    const nom = GDT.pick(NOMS);
    const form = GDT.pick(['pm', 'dev', 'dev', 'limit']);
    let up, lo;
    if (form === 'pm') { up = GDT.pick([0.02, 0.05, 0.1, 0.2, 0.3]); lo = -up; }
    else [up, lo] = GDT.pick(DEV_PAIRS);
    const U = r3(nom + up), L = r3(nom + lo), T = up - lo;
    let m;
    do { m = r3(L - 0.6 * T + Math.random() * 2.2 * T); } while (Math.abs(m - U) < 0.0015 || Math.abs(m - L) < 0.0015);
    return { nom, up, lo, form, U, L, m, prefix: Math.random() < 0.5 ? 'Ø' : '' };
  }

  function oyna(el, api) {
    let round = 0, correct = 0, streak = 0, cur = null;
    el.innerHTML = `
      <div class="card brief">
        <div>
          <p class="kicker">Oyun</p>
          <h3>Ölçü okuma</h3>
          <p>Her turda resimden bir ölçü ve mikrometrenin okuduğu değer gelir. <b>Üst ve alt sınır ölçüsünü</b> yaz, sonra parçayı <b>kabul</b> ya da <b>ret</b> et. Bir tur, üç cevabın üçü de doğruysa sayılır. ${ROUNDS} tur. Ondalık için virgül ya da nokta kullanabilirsin.</p>
        </div>
        ${GDT.starsHTML(STARS)}
      </div>
      <div class="card game">
        <div class="game-top">
          <span class="mono g-round"></span>
          <div class="g-progress"></div>
          <span class="g-streak mono"></span>
        </div>
        <div class="game-stage"></div>
      </div>`;
    const $ = (s) => el.querySelector(s);
    const results = [];

    function header() {
      $('.g-round').textContent = round < ROUNDS ? `Tur ${round + 1} / ${ROUNDS}` : 'Bitti';
      $('.g-progress').innerHTML = Array.from({ length: ROUNDS }, (_, i) => `<i class="${results[i] === true ? 'ok' : results[i] === false ? 'bad' : i === round ? 'now' : ''}"></i>`).join('');
      $('.g-streak').textContent = streak >= 2 ? `🔥 ${streak} seri` : '';
    }

    function next() {
      if (round >= ROUNDS) return end();
      cur = genRound();
      header();
      $('.game-stage').innerHTML = `
        <div class="g-grid">
          <div class="g-drawing">
            <small class="muted">Resimdeki ölçü</small>
            <div class="g-dim">${dim(cur)}</div>
            <small class="muted">Mikrometre</small>
            <div class="g-meas mono">${N(cur.m)}</div>
          </div>
          <div class="g-form">
            <label class="g-field"><span>Üst sınır ölçüsü</span><input inputmode="decimal" autocomplete="off" data-f="U" placeholder="ör. ${N(cur.nom, 2)}"></label>
            <label class="g-field"><span>Alt sınır ölçüsü</span><input inputmode="decimal" autocomplete="off" data-f="L" placeholder="ör. ${N(cur.nom, 2)}"></label>
            <div class="g-actions">
              <button class="btn ok-btn" data-v="1">✓ Kabul</button>
              <button class="btn bad-btn" data-v="0">✗ Ret</button>
            </div>
          </div>
        </div>
        <div class="g-result"></div>`;
      $('[data-f="U"]').focus({ preventScroll: true });
      el.querySelectorAll('.g-actions button').forEach((b) => { b.onclick = () => check(b.dataset.v === '1'); });
    }

    function check(accept) {
      const u = GDT.parseNum($('[data-f="U"]').value), l = GDT.parseNum($('[data-f="L"]').value);
      const okU = Math.abs(u - cur.U) < 1e-6, okL = Math.abs(l - cur.L) < 1e-6;
      const inTol = cur.m >= cur.L - 1e-9 && cur.m <= cur.U + 1e-9;
      const okV = accept === inTol;
      const all = okU && okL && okV;
      results[round] = all;
      if (all) { correct++; streak++; } else streak = 0;
      el.querySelectorAll('.g-form input, .g-actions button').forEach((x) => { x.disabled = true; });
      $('[data-f="U"]').classList.add(okU ? 'right' : 'wrong');
      $('[data-f="L"]').classList.add(okL ? 'right' : 'wrong');
      const d = Math.max(3, GDT.decimals(cur.U));
      $('.g-result').innerHTML = `
        <div class="msg ${all ? 'ok' : 'bad'}">
          ${all ? '<b>Tam isabet.</b>' : '<b>Bu tur sayılmadı.</b>'}
          Üst sınır <b class="mono">${N(cur.U, d)}</b> ${okU ? '✓' : '✗'} · Alt sınır <b class="mono">${N(cur.L, d)}</b> ${okL ? '✓' : '✗'} ·
          ${N(cur.m)} ${inTol ? 'aralığın içinde: <b>kabul</b>' : `aralığın ${cur.m > cur.U ? 'üstünde' : 'altında'}: <b>ret</b>`} ${okV ? '✓' : '✗'}
        </div>
        <button class="btn" data-go>${round + 1 < ROUNDS ? 'Sonraki tur →' : 'Sonucu gör'}</button>`;
      $('[data-go]').onclick = () => { round++; next(); };
      $('[data-go]').focus({ preventScroll: true });
      header();
    }

    function end() {
      const stars = correct >= 10 ? 3 : correct >= 8 ? 2 : correct >= 5 ? 1 : 0;
      header();
      if (stars) GDT.giveStars(1, stars, 'Ölçü okuma');
      GDT.syncStars(el, 1);
      if (stars) api.done();
      $('.game-stage').innerHTML = `
        <div class="quiz-end ${stars ? 'ok' : ''}">
          <div class="quiz-score mono">${correct}<small>/${ROUNDS}</small></div>
          <p>${'★'.repeat(stars) || 'Yıldız yok'} · ${stars === 3 ? 'Kusursuz okuma!' : stars ? 'İyi iş. Yıldızların hepsi için tekrar dene.' : 'En az 5 doğru tur gerekiyor. İpucu: önce iki sınırı hesapla, sonra ölçüyü karşılaştır.'}</p>
          <button class="btn" data-again>Yeniden oyna</button>
        </div>`;
      $('[data-again]').onclick = () => { round = 0; correct = 0; streak = 0; results.length = 0; next(); };
    }

    GDT.syncStars(el, 1);
    next();
  }

  // ======================================================================
  // SINA
  // ======================================================================
  const QUESTIONS = [
    {
      q: `${dim({ nom: 30, up: 0.1, lo: -0.2, prefix: 'Ø' })} ölçüsünün sınırları nedir?`,
      options: ['30,1 ve 29,8', '30,2 ve 29,9', '30,1 ve 29,9', '30,3 ve 30,0'],
      answer: 0,
      explain: 'Üst sınır 30 + 0,1 = 30,1; alt sınır 30 − 0,2 = 29,8.',
    },
    {
      q: `${dim({ nom: 50, up: -0.02, lo: -0.06 })} ölçüsünün toleransı kaçtır?`,
      options: ['0,08', '0,04', '0,02', '0,06'],
      answer: 1,
      explain: 'Tolerans = üst sapma − alt sapma = −0,02 − (−0,06) = 0,04. Tolerans her zaman pozitiftir; sapmalar ise ikisi birden negatif olabilir.',
    },
    {
      q: 'Hangisi doğru yazılmış?',
      options: [raw('+0,1', '−0,05'), raw('−0,05', '+0,10'), dim({ nom: 25, up: 0.1, lo: -0.05 }), raw('+0,10', '−0')],
      answer: 2,
      explain: 'Üst sapma üstte, iki sapma aynı ondalık sayısıyla, sıfır işaretsiz yazılır.',
    },
    {
      q: 'Beş delik zincir ölçülendirilmiş, her aralık ±0,05. İlk delikten son deliğe kadar olan mesafe en kötü durumda ne kadar değişebilir?',
      options: ['±0,05', '±0,10', '±0,20', '±0,25'],
      answer: 2,
      explain: 'Beş delik arasında dört aralık var: 4 × 0,05 = ±0,20. Zincir ölçülendirmede toleranslar toplanır.',
    },
    {
      q: 'Resimde parantez içinde yazılmış (100) ölçüsü ne anlama gelir?',
      options: ['Toleransı ±0,1 olan önemli ölçü', 'Yardımcı ölçü: bilgi amaçlı, toleransı yok, muayene edilmez', 'Teorik tam ölçü', 'Ölçü inç cinsinden'],
      answer: 1,
      explain: 'Parantez içindeki ölçü yardımcı ölçüdür ve kapalı zinciri önlemek için kullanılır. Teorik tam ölçü (TED) ise çerçeve içinde yazılır; Modül 5’te göreceğiz.',
    },
    {
      q: `${dim({ nom: 20, up: -0.02, lo: -0.05 })} için hangisi doğru?`,
      options: ['Yazım hatalı: sapmalardan biri pozitif olmalı', 'Bütün kabul edilen parçalar 20’den küçüktür', 'Tolerans negatiftir', 'Nominal ölçüdeki parça kabul edilir'],
      answer: 1,
      explain: 'Sınırlar 19,98 ve 19,95. İki sapma da negatif olabilir; bu durumda nominal ölçüdeki (20,000) bir parça bile ret yer.',
    },
    {
      q: 'Bir flanşta iki cıvata deliği arasındaki mesafe montaj için kritik. Bu mesafe nasıl ölçülendirilmeli?',
      options: ['Her deliği parça kenarından ölçülendirip aradaki farkı hesaplatarak', 'Doğrudan iki delik arası ölçüyle', 'Yalnızca yardımcı ölçüyle', 'Hiç ölçü vermeden, CAD modeline bırakarak'],
      answer: 1,
      explain: 'Fonksiyonel olarak önemli mesafe doğrudan ölçülendirilir. Kenardan ölçülendirmede aradaki mesafe iki toleransın toplamı kadar değişir.',
    },
  ];

  function sina(el, api) {
    el.append(GDT.el(`
      <div class="story card">
        <p class="kicker">Sına</p>
        <p>${QUESTIONS.length} soru. Geçmek için en az ${Math.ceil(QUESTIONS.length * 0.7)} doğru gerekiyor. Her doğru cevap +5 XP.</p>
      </div>`));
    GDT.quiz(el, { id: 'm1.quiz', questions: QUESTIONS, onPass: api.done });
  }

  GDT.registerModule(1, { steps: { sezgi, kavram, oyna, sina } });
})();
