'use strict';
/* Module 2 — Genel toleranslar ISO 2768 (Sezgi: drawing + title block, Kavram: 4 slides, Oyna: inspection desk, Sına: quiz) */
(() => {
  const N = GDT.num;
  const CLASSES = ['f', 'm', 'c', 'v'];
  const CLASS_NAMES = { f: 'ince', m: 'orta', c: 'kaba', v: 'çok kaba' };
  const tolText = (t) => (t == null ? '—' : `±${N(t, GDT.decimals(t) || 1)}`);
  const logSlider = (v, a, b) => a * (b / a) ** (v / 1000);
  const roundSize = (s) => (s < 10 ? Math.round(s * 10) / 10 : Math.round(s));

  // ======================================================================
  // SEZGİ — a drawing where only one dimension has its own tolerance
  // ======================================================================
  const SX = (mm) => 100 + mm * 3.2, SY = (mm) => 252 - mm * 3.2;
  const SDIMS = [
    { key: 'L120', kind: 'len', nom: 120, label: '120' },
    { key: 'L60', kind: 'len', nom: 60, label: '60' },
    { key: 'L30', kind: 'len', nom: 30, label: '30' },
    { key: 'L90', kind: 'len', nom: 90, label: '90' },
    { key: 'L25', kind: 'len', nom: 25, label: '25' },
    { key: 'R5', kind: 'edge', nom: 5, label: 'R5' },
    { key: 'HOLE', kind: 'own', nom: 10, label: '2× Ø10' },
  ];

  function plateSVG() {
    const hd = (x1, x2, y, key, txt) => `
      <g class="gdim" data-key="${key}">
        <line class="drw-ext" x1="${x1}" y1="${y + 6}" x2="${x1}" y2="${y < 60 ? 58 : y - 6}"/>
        <line class="drw-ext" x1="${x2}" y1="${y + 6}" x2="${x2}" y2="${y < 60 ? 58 : y - 6}"/>
        <line class="drw-dim" x1="${x1}" y1="${y}" x2="${x2}" y2="${y}"/>
        <path class="drw-arrow" d="M${x1} ${y}l8-3v6z"/><path class="drw-arrow" d="M${x2} ${y}l-8-3v6z"/>
        <rect class="gdim-hit" x="${(x1 + x2) / 2 - 26}" y="${y - 19}" width="52" height="20" rx="4"/>
        <text class="drw-txt sm" x="${(x1 + x2) / 2}" y="${y - 5}" text-anchor="middle">${txt}</text>
        <text class="gtag" x="${(x1 + x2) / 2}" y="${y + 15}" text-anchor="middle"></text>
      </g>`;
    const vd = (x, y1, y2, key, txt) => `
      <g class="gdim" data-key="${key}">
        <line class="drw-dim" x1="${x}" y1="${y1}" x2="${x}" y2="${y2}"/>
        <path class="drw-arrow" d="M${x} ${y1}l-3 8h6z"/><path class="drw-arrow" d="M${x} ${y2}l-3-8h6z"/>
        <rect class="gdim-hit" x="${x - 20}" y="${(y1 + y2) / 2 - 24}" width="18" height="48" rx="4"/>
        <text class="drw-txt sm" transform="translate(${x - 6} ${(y1 + y2) / 2}) rotate(-90)" text-anchor="middle">${txt}</text>
        <text class="gtag" transform="translate(${x + 15} ${(y1 + y2) / 2}) rotate(-90)" text-anchor="middle"></text>
      </g>`;
    return `
      <svg class="drw plate" viewBox="0 0 640 360" role="img" aria-label="Plaka teknik resmi">
        <rect class="drw-obj" x="${SX(0)}" y="${SY(60)}" width="${120 * 3.2}" height="${60 * 3.2}" rx="16"/>
        ${[30, 90].map((h) => `<circle class="drw-hole" cx="${SX(h)}" cy="${SY(25)}" r="16"/><path class="drw-cl" d="M${SX(h)} ${SY(25) - 24}v48M${SX(h) - 24} ${SY(25)}h48"/>`).join('')}
        <line class="drw-ext" x1="${SX(0)}" y1="${SY(0) + 4}" x2="${SX(0)}" y2="${SY(0) + 40}"/><line class="drw-ext" x1="${SX(120)}" y1="${SY(0) + 4}" x2="${SX(120)}" y2="${SY(0) + 40}"/>
        ${hd(SX(0), SX(120), 290, 'L120', '120')}
        <line class="drw-ext" x1="${SX(0) - 4}" y1="${SY(60)}" x2="${SX(0) - 50}" y2="${SY(60)}"/><line class="drw-ext" x1="${SX(0) - 4}" y1="${SY(0)}" x2="${SX(0) - 50}" y2="${SY(0)}"/>
        ${vd(SX(0) - 40, SY(60), SY(0), 'L60', '60')}
        <line class="drw-ext" x1="${SX(30)}" y1="${SY(25) - 20}" x2="${SX(30)}" y2="44"/><line class="drw-ext" x1="${SX(90)}" y1="${SY(25) - 20}" x2="${SX(90)}" y2="24"/>
        <line class="drw-ext" x1="${SX(0)}" y1="${SY(60) - 4}" x2="${SX(0)}" y2="20"/>
        ${hd(SX(0), SX(30), 46, 'L30', '30')}
        ${hd(SX(0), SX(90), 26, 'L90', '90')}
        <line class="drw-ext" x1="${SX(90) + 20}" y1="${SY(25)}" x2="${SX(120) + 50}" y2="${SY(25)}"/><line class="drw-ext" x1="${SX(120) + 4}" y1="${SY(0)}" x2="${SX(120) + 50}" y2="${SY(0)}"/>
        ${vd(SX(120) + 40, SY(25), SY(0), 'L25', '25')}
        <g class="gdim" data-key="R5">
          <path class="drw-dim" d="M${SX(120) - 5} ${SY(60) + 5}L${SX(120) + 30} ${SY(60) - 28}h26"/>
          <path class="drw-arrow" d="M${SX(120) - 5} ${SY(60) + 5}l2.5-8.5 4.2 4.4z"/>
          <rect class="gdim-hit" x="${SX(120) + 30}" y="${SY(60) - 46}" width="34" height="20" rx="4"/>
          <text class="drw-txt sm" x="${SX(120) + 34}" y="${SY(60) - 32}">R5</text>
          <text class="gtag" x="${SX(120) + 66}" y="${SY(60) - 32}"></text>
        </g>
        <g class="gdim own" data-key="HOLE">
          <path class="drw-dim" d="M${SX(30) + 11} ${SY(25) - 11}L${SX(30) + 60} ${SY(25) - 60}h70"/>
          <path class="drw-arrow" d="M${SX(30) + 11} ${SY(25) - 11}l2.5-8.5 4.2 4.4z"/>
          <rect class="gdim-hit" x="${SX(30) + 60}" y="${SY(25) - 84}" width="104" height="26" rx="4"/>
          <text class="drw-txt sm" x="${SX(30) + 62}" y="${SY(25) - 64}">2× Ø10</text>
          <text class="drw-txt xs" x="${SX(30) + 122}" y="${SY(25) - 72}">+0,015</text>
          <text class="drw-txt xs" x="${SX(30) + 122}" y="${SY(25) - 62}">0</text>
          <text class="gtag" x="${SX(30) + 62}" y="${SY(25) - 46}"></text>
        </g>
        <g class="tblock">
          <rect x="380" y="306" width="250" height="46"/>
          <line x1="380" y1="322" x2="630" y2="322"/>
          <text x="388" y="318">Malzeme: S235 · Ölçek 1:1 · mm</text>
          <text x="388" y="342">Genel toleranslar:</text>
          <text class="tb-note" x="512" y="342">? ? ?</text>
        </g>
      </svg>`;
  }

  function sezgi(el, api) {
    let revealed = false;
    const seen = new Set();
    el.innerHTML = `
      <div class="story card">
        <p class="kicker">Durum</p>
        <p>Bir plakanın resmi geldi. Antetin köşesine kahve dökülmüş, bir satır okunmuyor. Tornacı soruyor: “120’lik boy için ne kadar sapma kabul?”</p>
      </div>
      <div class="card plate-card">
        <div class="plate-grid">
          <div class="plate-draw">${plateSVG()}</div>
          <div class="plate-side">
            <p class="kicker">Ölçü listesi</p>
            <div class="gd-list"><p class="muted small">Sorulardan sonra ölçülere tıklayarak toleranslarını burada topla.</p></div>
          </div>
        </div>
      </div>
      <div class="asks"></div>`;
    const $ = (s) => el.querySelector(s);

    function tolOf(d) {
      if (d.kind === 'len') return ISO.linear(d.nom, 'm');
      if (d.kind === 'edge') return ISO.edge(d.nom, 'm');
      return null;
    }
    function list() {
      $('.gd-list').innerHTML = `
        <table class="mini-table"><thead><tr><th>Ölçü</th><th>Tolerans</th><th>Sınırlar</th></tr></thead><tbody>
        ${SDIMS.filter((d) => seen.has(d.key)).map((d) => {
          if (d.kind === 'own') return `<tr class="own"><td>Ø10</td><td colspan="2">Kendi toleransı: 10,000 – 10,015</td></tr>`;
          const t = tolOf(d);
          return `<tr><td class="mono">${d.label}</td><td class="mono">${tolText(t)}</td><td class="mono">${N(d.nom - t, 1)} – ${N(d.nom + t, 1)}</td></tr>`;
        }).join('')}</tbody></table>
        <p class="muted small">${SDIMS.filter((d) => d.kind !== 'own' && !seen.has(d.key)).length} genel toleranslı ölçü kaldı.</p>`;
    }
    function clickDim(g) {
      if (!revealed) return;
      const d = SDIMS.find((x) => x.key === g.dataset.key);
      seen.add(d.key);
      g.classList.add('seen');
      g.querySelector('.gtag').textContent = d.kind === 'own' ? 'kendi toleransı' : tolText(tolOf(d));
      list();
      if (SDIMS.every((x) => x.kind === 'own' || seen.has(x.key)) && !el.querySelector('.takeaway')) finish();
    }
    function finish() {
      const take = GDT.el(`
        <div class="takeaway card">
          <p class="kicker">Ana fikir</p>
          <p><b>Resimde toleransı yazılmamış ölçü yoktur.</b> Kendi toleransı olmayan her ölçü antetteki genel tolerans sınıfına bağlıdır. Aynı “m” sınıfında 30 mm ±0,2 alırken 60 mm ±0,3 alır: tolerans ölçü aralığına göre kademeli büyür.</p>
          <p class="muted">Not’taki “K” harfi düzlemsellik, diklik gibi geometrik genel toleransları belirler; Kavram adımında göreceğiz.</p>
          <button class="btn" data-next>Kavram adımına geç →</button>
        </div>`);
      $('.asks').append(take);
      take.querySelector('[data-next]').onclick = api.next;
      take.scrollIntoView({ block: 'nearest', behavior: GDT.reducedMotion() ? 'auto' : 'smooth' });
      api.done();
    }

    GDT.ask($('.asks'), {
      q: 'Bu resimde kaç ölçünün kendi toleransı yazılı?',
      options: ['Hiçbirinin', 'Bir tanesinin', 'Üç tanesinin', 'Hepsinin'],
      answer: 1,
      explain: 'Yalnızca 2× Ø10 deliğin kendi toleransı var (+0,015 / 0). 120, 60, 30, 90, 25 ve R5 çıplak yazılmış.',
      onDone: () => GDT.ask($('.asks'), {
        q: 'Peki çıplak yazılmış ölçüler için hangi tolerans geçerli?',
        options: ['Sıfır: tam ölçüde olmalılar', 'Atölyenin alışkanlığı neyse o', 'Antetteki genel tolerans notu', 'Toleransları olmadığı için muayene edilmezler'],
        answer: 2,
        explain: 'Antetteki genel tolerans notu bütün çıplak ölçüleri bağlar. Kahve lekesinin altında şu yazıyordu: <b>ISO 2768-mK</b>. Şimdi resimdeki ölçülere tıkla.',
        onDone: () => {
          revealed = true;
          const note = el.querySelector('.tb-note');
          note.textContent = 'ISO 2768-mK';
          el.querySelector('.tblock').classList.add('flash-note');
          el.querySelector('.plate').classList.add('live');
          list();
          $('.plate-card').scrollIntoView({ block: 'nearest', behavior: GDT.reducedMotion() ? 'auto' : 'smooth' });
        },
      }),
    });

    el.querySelector('.plate').addEventListener('click', (e) => { const g = e.target.closest('.gdim'); if (g) clickDim(g); });
  }

  // ======================================================================
  // KAVRAM
  // ======================================================================
  function kavram(el, api) {
    GDT.carousel(el, [slideLinear, slideAngle, slideGeo, slideNote], api);
  }

  // --- slide 1: ISO 2768-1 linear table explorer ---
  function slideLinear(el) {
    let cls = 'm', size = 60;
    const rangeLabel = (r, i) => (i === 0 ? `${N(r.lo, 1)}–${r.hi}` : `>${r.lo}–${r.hi}`);
    el.innerHTML = `
      <p class="kicker">1 · ISO 2768-1</p>
      <h3>Doğrusal ölçüler için dört sınıf</h3>
      <p><b>f</b> ince, <b>m</b> orta, <b>c</b> kaba, <b>v</b> çok kaba. Tolerans ölçü büyüdükçe kademeli artar; aynı aralıktaki her ölçü aynı toleransı alır. Bir hücreye tıkla ya da kaydırıcıyı oynat.</p>
      <div class="lin-ctl">
        <label class="slider"><span>Ölçü <output class="mono" data-o></output></span><input type="range" min="0" max="1000" value="${Math.round(1000 * Math.log(60 / 0.5) / Math.log(4000 / 0.5))}" data-s></label>
        <div class="seg" data-cls>${CLASSES.map((c) => `<button data-v="${c}">${c} · ${CLASS_NAMES[c]}</button>`).join('')}</div>
      </div>
      <div class="lin-result"></div>
      <div class="table-wrap"><table class="iso-table">
        <thead><tr><th>Sınıf</th>${ISO.LINEAR.map((r, i) => `<th data-c="${i}">${rangeLabel(r, i)}</th>`).join('')}</tr></thead>
        <tbody>${CLASSES.map((c) => `<tr data-r="${c}"><th>${c}</th>${ISO.LINEAR.map((r, i) => `<td data-c="${i}" data-cls="${c}">${tolText(r[c])}</td>`).join('')}</tr>`).join('')}</tbody>
      </table></div>
      <p class="muted small">Değerler ± mm. “—”: bu sınıf için tanımlı değil.</p>`;
    function draw() {
      const ri = ISO.LINEAR.indexOf(ISO.range(ISO.LINEAR, size));
      const t = ISO.linear(size, cls);
      el.querySelector('[data-o]').textContent = `${N(size, size < 10 ? 1 : 0)} mm`;
      el.querySelectorAll('[data-cls] button').forEach((b) => b.classList.toggle('on', b.dataset.v === cls));
      el.querySelectorAll('.iso-table td, .iso-table th[data-c]').forEach((c) => {
        const col = +c.dataset.c === ri;
        c.classList.toggle('col', col);
        c.classList.toggle('hit', col && c.dataset.cls === cls);
      });
      el.querySelectorAll('.iso-table tr[data-r]').forEach((r) => r.classList.toggle('row', r.dataset.r === cls));
      el.querySelector('.lin-result').innerHTML = t == null
        ? `<b>${N(size, size < 10 ? 1 : 0)} mm</b> için <b>${cls}</b> sınıfında tolerans tanımlı değil.`
        : `<span class="mono big">${N(size, size < 10 ? 1 : 0)} ${tolText(t)}</span> <span class="muted">→</span> <span class="mono">${N(size - t, 2)} – ${N(size + t, 2)}</span>`;
    }
    el.querySelector('[data-s]').oninput = (e) => { size = roundSize(logSlider(+e.target.value, 0.5, 4000)); draw(); };
    el.querySelector('[data-cls]').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) { cls = b.dataset.v; draw(); } });
    el.querySelector('.iso-table tbody').addEventListener('click', (e) => {
      const td = e.target.closest('td');
      if (!td) return;
      const r = ISO.LINEAR[+td.dataset.c];
      cls = td.dataset.cls;
      size = Math.min(r.hi, Math.max(r.lo, roundSize(Math.sqrt(Math.max(r.lo, 0.5) * r.hi))));
      el.querySelector('[data-s]').value = Math.round(1000 * Math.log(size / 0.5) / Math.log(4000 / 0.5));
      draw();
    });
    draw();
  }

  // --- slide 2: angles and broken edges ---
  function slideAngle(el) {
    let cls = 'm', leg = 30;
    el.innerHTML = `
      <div class="slide-grid">
        <div>
          <p class="kicker">2 · Açılar ve kırık kenarlar</p>
          <h3>Açı toleransı kısa kenara göre seçilir</h3>
          <p>Açısal sapma derece ve dakikayla verilir. Kenar uzadıkça aynı açı sapması uçta daha büyük bir mesafe yaratır; bu yüzden uzun kenarlarda açı toleransı daralır.</p>
          <label class="slider"><span>Kısa kenar uzunluğu <output class="mono" data-o></output></span><input type="range" min="0" max="1000" value="${Math.round(1000 * Math.log(30 / 2) / Math.log(600 / 2))}" data-s></label>
          <div class="seg" data-cls>${CLASSES.map((c) => `<button data-v="${c}">${c}</button>`).join('')}</div>
          <div class="cost-info ang-info"></div>
          <p class="kicker">Kırık kenarlar: dış radyüs ve pah</p>
          <div class="edge-table"></div>
        </div>
        <svg class="ang-svg" viewBox="0 0 420 300" role="img" aria-label="Açı toleransı"></svg>
      </div>`;
    const svg = el.querySelector('.ang-svg');
    function draw() {
      const min = ISO.angle(leg, cls);
      const dev = leg * Math.tan((min / 60) * Math.PI / 180);
      el.querySelector('[data-o]').textContent = `${N(leg, 0)} mm`;
      el.querySelectorAll('[data-cls] button').forEach((b) => b.classList.toggle('on', b.dataset.v === cls));
      el.querySelector('.ang-info').innerHTML = `
        <div><small>Açı toleransı</small><b class="mono">±${ISO.fmtAngle(min)}</b></div>
        <div><small>Kenar ucunda</small><b class="mono">±${N(dev, 2)} mm</b></div>
        <div><small>Sınıf</small><b>${cls} · ${CLASS_NAMES[cls]}</b></div>`;
      el.querySelector('.edge-table').innerHTML = `<table class="mini-table"><thead><tr><th>Radyüs / pah</th>${ISO.EDGE.map((r, i) => `<th>${i === 0 ? '0,5–3' : i === 1 ? '>3–6' : '>6'}</th>`).join('')}</tr></thead>
        <tbody><tr><td>${cls}</td>${ISO.EDGE.map((r) => `<td class="mono">${tolText(r[cls])}</td>`).join('')}</tr></tbody></table>`;
      // exaggerated wedge: 1 arc-minute drawn as 0,4°
      const ex = (min / 60) * 24;
      const L = 260, ox = 70, oy = 250;
      const pt = (deg) => [ox + L * Math.cos((deg * Math.PI) / 180), oy - L * Math.sin((deg * Math.PI) / 180)];
      const [ax, ay] = pt(90 - ex), [bx, by] = pt(90 + ex), [cx, cy] = pt(90);
      svg.innerHTML = `
        <path class="ang-zone" d="M${ox} ${oy}L${ax} ${ay}A${L} ${L} 0 0 0 ${bx} ${by}Z"/>
        <path class="drw-obj" d="M${ox - 10} ${oy + 10}H${ox + 300}V${oy}H${ox}V${oy - L}H${ox - 10}Z"/>
        <line class="ang-edge" x1="${ox}" y1="${oy}" x2="${ax}" y2="${ay}"/>
        <line class="ang-edge" x1="${ox}" y1="${oy}" x2="${bx}" y2="${by}"/>
        <line class="drw-cl" x1="${ox}" y1="${oy}" x2="${cx}" y2="${cy - 10}"/>
        <path class="ang-arc" d="M${ox + 40} ${oy}A40 40 0 0 0 ${ox} ${oy - 40}"/>
        <text class="drw-txt sm" x="${ox + 34}" y="${oy - 30}">90°</text>
        <text class="ax-lbl strong" x="${(ax + bx) / 2}" y="${ay - 10}" text-anchor="middle">±${ISO.fmtAngle(min)}</text>
        <text class="ax-lbl" x="${ox + 120}" y="${oy + 32}" text-anchor="middle">kısa kenar ${N(leg, 0)} mm · açı ×24 abartılı</text>`;
    }
    el.querySelector('[data-s]').oninput = (e) => { leg = Math.round(logSlider(+e.target.value, 2, 600)); draw(); };
    el.querySelector('[data-cls]').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) { cls = b.dataset.v; draw(); } });
    draw();
  }

  // --- slide 3: ISO 2768-2 geometric general tolerances ---
  const GEO = [
    { k: 'flat', name: 'Doğrusallık / düzlemsellik', sym: 'flatness', rows: () => ISO.STRAIGHT, note: 'İlgili yüzeyin ya da çizginin uzunluğuna göre.' },
    { k: 'perp', name: 'Diklik', sym: 'perpendicularity', rows: () => ISO.PERP, note: 'Kısa kenar datum kabul edilir; uzunluk olarak kısa kenar alınır.' },
    { k: 'sym', name: 'Simetri', sym: 'symmetry', rows: () => ISO.SYM, note: 'Uzun eleman datum kabul edilir.' },
    { k: 'run', name: 'Dairesel salgı', sym: 'circularRunout', rows: null, note: 'Uzunluktan bağımsız tek değer.' },
  ];
  function slideGeo(el) {
    let cls = 'K', g = GEO[0], len = 200;
    el.innerHTML = `
      <div class="slide-grid">
        <div>
          <p class="kicker">3 · ISO 2768-2</p>
          <h3>Geometrik genel toleranslar: H, K, L</h3>
          <p>Notun ikinci harfi, şekli ve konumu belirtilmemiş elemanların ne kadar <b>eğri, eğik ya da kaçık</b> olabileceğini sınırlar. Yalnızca ölçü toleransı, bir plakanın pervane gibi çarpılmasını engellemez.</p>
          <div class="seg wrap" data-geo>${GEO.map((x) => `<button data-v="${x.k}">${GDT.sym(x.sym, 18)} ${x.name}</button>`).join('')}</div>
          <div class="seg" data-cls>${['H', 'K', 'L'].map((c) => `<button data-v="${c}">${c}</button>`).join('')}</div>
          <label class="slider geo-len"><span>Uzunluk <output class="mono" data-o></output></span><input type="range" min="0" max="1000" value="${Math.round(1000 * Math.log(200 / 5) / Math.log(3000 / 5))}" data-s></label>
          <div class="lin-result geo-result"></div>
          <p class="muted small">Genel tolerans, resimde açıkça belirtilmiş bir geometrik toleransın yerini tutmaz; yalnızca belirtilmemiş olanları kapsar. GPS sistemiyle uyumlu yeni genel spesifikasyon standardı ISO 22081’dir; atölyede en yaygın olan hâlâ ISO 2768.</p>
        </div>
        <svg class="geo-svg" viewBox="0 0 420 260" role="img" aria-label="Geometrik genel tolerans bölgesi"></svg>
      </div>`;
    const svg = el.querySelector('.geo-svg');
    function draw() {
      const t = g.rows ? (ISO.range(g.rows(), len) || {})[cls] : ISO.RUNOUT[cls];
      el.querySelectorAll('[data-geo] button').forEach((b) => b.classList.toggle('on', b.dataset.v === g.k));
      el.querySelectorAll('[data-cls] button').forEach((b) => b.classList.toggle('on', b.dataset.v === cls));
      el.querySelector('.geo-len').hidden = !g.rows;
      el.querySelector('[data-o]').textContent = `${len} mm`;
      el.querySelector('.geo-result').innerHTML = t == null
        ? 'Bu uzunluk için tablo tanımlı değil.'
        : `<span class="mono big">${GDT.sym(g.sym, 22)} ${N(t, GDT.decimals(t))} mm</span> <span class="muted">${g.note}</span>`;
      const z = Math.min(80, (t || 0) * 50 + 6); // exaggerated zone width, px
      let art = '';
      if (g.k === 'flat') {
        let p = '';
        for (let x = 40; x <= 380; x += 10) p += `${x === 40 ? 'M' : 'L'}${x},${(130 + Math.sin(x / 23) * z * 0.38 + Math.sin(x / 9) * z * 0.1).toFixed(1)}`;
        art = `<rect class="geo-zone" x="30" y="${130 - z / 2}" width="360" height="${z}"/>
          <path class="drw-obj" d="${p}L380 220H40Z"/>
          <text class="ax-lbl strong" x="395" y="134">${N(t || 0, 2)}</text>`;
      } else if (g.k === 'perp') {
        art = `<rect class="drw-obj" x="40" y="200" width="340" height="24"/>
          <rect class="geo-zone" x="${200 - z / 2}" y="30" width="${z}" height="170"/>
          <path class="drw-obj" d="M${200 - 14 - z * 0.3} 40L${200 + 14 - z * 0.3} 40L${200 + 14 + z * 0.3} 200L${200 - 14 + z * 0.3} 200Z"/>
          <text class="ax-lbl" x="60" y="244">datum: alttaki kenar</text>
          <text class="ax-lbl strong" x="${200 + z / 2 + 6}" y="44">${N(t || 0, 2)}</text>`;
      } else if (g.k === 'sym') {
        art = `<path class="drw-obj" d="M40 60H160V150H260V60H380V220H40Z"/>
          <rect class="geo-zone" x="${210 - z / 2}" y="30" width="${z}" height="200"/>
          <line class="drw-cl" x1="210" y1="20" x2="210" y2="240"/>
          <text class="ax-lbl strong" x="${210 + z / 2 + 6}" y="44">${N(t || 0, 2)}</text>`;
      } else {
        art = `<circle class="drw-obj" cx="200" cy="140" r="80"/>
          <circle class="geo-zone ring" cx="200" cy="140" r="${80 + z / 4}" stroke-width="${z / 2}"/>
          <path class="drw-cl" d="M110 140h180M200 50v180"/>
          <path class="geo-ind" d="M200 30v-18M192 12h16"/><text class="ax-lbl" x="214" y="22">komparatör</text>
          <text class="ax-lbl strong" x="295" y="70">${N(t || 0, 2)}</text>`;
      }
      svg.innerHTML = `${art}<text class="ax-lbl" x="40" y="256">bölge abartılı çizildi</text>`;
    }
    el.querySelector('[data-geo]').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) { g = GEO.find((x) => x.k === b.dataset.v); draw(); } });
    el.querySelector('[data-cls]').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) { cls = b.dataset.v; draw(); } });
    el.querySelector('[data-s]').oninput = (e) => { len = Math.round(logSlider(+e.target.value, 5, 3000)); draw(); };
    draw();
  }

  // --- slide 4: reading the title block note, and the rules ---
  const NOTE_PARTS = [
    { t: 'ISO 2768', d: 'Hangi standardın uygulandığı. Notta yazmazsa genel tolerans yoktur ve resim eksiktir.' },
    { t: 'm', d: '<b>ISO 2768-1</b> sınıfı: doğrusal ölçüler, açılar, dış radyüs ve pahlar. f · m · c · v.' },
    { t: 'K', d: '<b>ISO 2768-2</b> sınıfı: doğrusallık, düzlemsellik, diklik, simetri, dairesel salgı. H · K · L.' },
    { t: '-E', d: 'İsteğe bağlı: tek bir boyut elemanına (delik, mil) <b>zarf gerekliliği</b> uygulanır. ISO 8015 bağımsızlık ilkesinin yerine geçer; Modül 12’de.' },
  ];
  function slideNote(el) {
    el.innerHTML = `
      <p class="kicker">4 · Antet notu ve kurallar</p>
      <h3>“ISO 2768-mK-E” nasıl okunur?</h3>
      <div class="note-chips">${NOTE_PARTS.map((p, i) => `<button class="note-chip mono" data-i="${i}">${p.t}</button>`).join('')}</div>
      <p class="note-exp callout">Notun parçalarına tıkla.</p>
      <div class="rule-grid">
        <div class="rule"><h4>Genel tolerans uygulanmaz</h4><ul><li>Kendi toleransı yazılmış ölçülere</li><li>Parantez içindeki yardımcı ölçülere</li><li>Çerçeve içindeki teorik tam ölçülere (TED)</li><li>Başka standarda bağlanmış elemanlara</li></ul></div>
        <div class="rule good"><h4>Otomatik ret yok</h4><ul><li>ISO 2768-1’e göre genel toleransı aşan parça, <b>işlevi bozulmuyorsa</b> otomatik olarak reddedilmez</li><li>Genel tolerans “fonksiyonel değil” anlamına gelir</li><li>Kritik ölçüye mutlaka kendi toleransını yaz</li></ul></div>
        <div class="rule"><h4>Sınıf seçimi</h4><ul><li><b>f</b>: hassas talaşlı imalat</li><li><b>m</b>: genel talaşlı imalat (en yaygın)</li><li><b>c</b>: kaba işleme, kaynaklı parçalar</li><li><b>v</b>: çok kaba işler</li></ul></div>
      </div>`;
    el.querySelector('.note-chips').addEventListener('click', (e) => {
      const b = e.target.closest('.note-chip');
      if (!b) return;
      el.querySelectorAll('.note-chip').forEach((x) => x.classList.toggle('on', x === b));
      el.querySelector('.note-exp').innerHTML = NOTE_PARTS[+b.dataset.i].d;
    });
  }

  // ======================================================================
  // OYNA — inspection desk: three job orders, one general tolerance class each
  // ======================================================================
  const JOBS = [
    { cls: 'm', geo: 'K', title: 'Freze braket', feats: [
      { t: 'len', nom: 15 }, { t: 'len', nom: 48 }, { t: 'len', nom: 160 }, { t: 'len', nom: 4 },
      { t: 'edge', nom: 3, label: 'R3' }, { t: 'angle', nom: 90, leg: 30 }, { t: 'len', nom: 520 }] },
    { cls: 'f', geo: 'H', title: 'Hassas plaka', feats: [
      { t: 'len', nom: 2.5 }, { t: 'len', nom: 22 }, { t: 'len', nom: 75 }, { t: 'len', nom: 250 },
      { t: 'edge', nom: 1, label: 'Pah 1×45°' }, { t: 'angle', nom: 45, leg: 80 }, { t: 'len', nom: 900 }] },
    { cls: 'c', geo: 'L', title: 'Kaynaklı şase', feats: [
      { t: 'len', nom: 10 }, { t: 'len', nom: 35 }, { t: 'len', nom: 300 }, { t: 'len', nom: 1200 },
      { t: 'edge', nom: 8, label: 'R8' }, { t: 'angle', nom: 120, leg: 8 }, { t: 'len', nom: 5 }] },
  ];
  const STARS = ['Bir raporda en az 6/7 doğru karar', 'Bir raporu hatasız teslim et', 'Üç iş emrinin üçünü de hatasız teslim et'];
  const featTol = (f, cls) => (f.t === 'len' ? ISO.linear(f.nom, cls) : f.t === 'edge' ? ISO.edge(f.nom, cls) : ISO.angle(f.leg, cls));
  const fmtDeg = (totalMin) => { const d = Math.floor(totalMin / 60), m = Math.round(totalMin - d * 60); return `${d}°${String(m).padStart(2, '0')}′`; };
  const featName = (f) => (f.t === 'len' ? 'Uzunluk' : f.t === 'edge' ? 'Kırık kenar' : `Açı (kısa kenar ${f.leg})`);

  function measure(job) {
    let rows, okCount;
    do {
      rows = job.feats.map((f) => {
        const tol = featTol(f, job.cls);
        let dev;
        do { dev = (Math.random() * 3.2 - 1.6) * tol; } while (Math.abs(Math.abs(dev) - tol) < tol * 0.1);
        if (f.t === 'angle') {
          dev = Math.round(dev);
          return { f, tol, dev, shown: fmtDeg(f.nom * 60 + dev), ok: Math.abs(dev) <= tol };
        }
        const d = job.cls === 'f' ? 3 : 2;
        const val = Math.round((f.nom + dev) * 10 ** d) / 10 ** d;
        return { f, tol, dev, shown: N(val, d), ok: Math.abs(val - f.nom) <= tol + 1e-9 };
      });
      okCount = rows.filter((r) => r.ok).length;
    } while (okCount < 2 || okCount > rows.length - 2);
    return rows;
  }

  function oyna(el, api) {
    const perfect = new Set(GDT.store.data.best['m2.perfect'] || []);
    let ji = 0, rows = null, picks = [], submitted = false;
    const calc = { t: 'len', size: 60, cls: 'm' };
    el.innerHTML = `
      <div class="card brief">
        <div>
          <p class="kicker">Muayene masası</p>
          <h3>Ölçüm raporlarını değerlendir</h3>
          <p>Üç iş emri, her birinin anteti farklı bir genel tolerans sınıfında. Ölçüm raporundaki her satır için <b>kabul</b> ya da <b>ret</b> kararı ver. Soldaki hesaplayıcıyı serbestçe kullanabilirsin; tabloyu ezberlemek gerekmez, doğru okumak gerekir.</p>
        </div>
        ${GDT.starsHTML(STARS)}
      </div>
      <div class="sim">
        <div class="card sim-ctl calc">
          <h4>Tolerans hesaplayıcı</h4>
          <div class="seg" data-ct><button data-v="len">Uzunluk</button><button data-v="edge">Kırık kenar</button><button data-v="angle">Açı</button></div>
          <label class="g-field"><span data-cl>Nominal ölçü (mm)</span><input inputmode="decimal" value="60" data-cs></label>
          <span class="lbl">Sınıf</span>
          <div class="seg" data-cc>${CLASSES.map((c) => `<button data-v="${c}">${c}</button>`).join('')}</div>
          <div class="calc-out"></div>
        </div>
        <div class="card report">
          <div class="job-tabs">${JOBS.map((j, i) => `<button data-j="${i}">İş emri ${i + 1}<small>${j.title}</small></button>`).join('')}</div>
          <div class="job-body"></div>
        </div>
      </div>`;
    const $ = (s) => el.querySelector(s);

    function drawCalc() {
      el.querySelectorAll('[data-ct] button').forEach((b) => b.classList.toggle('on', b.dataset.v === calc.t));
      el.querySelectorAll('[data-cc] button').forEach((b) => b.classList.toggle('on', b.dataset.v === calc.cls));
      $('[data-cl]').textContent = calc.t === 'angle' ? 'Kısa kenar uzunluğu (mm)' : calc.t === 'edge' ? 'Radyüs / pah ölçüsü (mm)' : 'Nominal ölçü (mm)';
      const s = calc.size;
      let out;
      if (!(s > 0)) out = '<span class="muted">Bir ölçü gir.</span>';
      else if (calc.t === 'angle') { const m = ISO.angle(s, calc.cls); out = `<b class="mono big">±${ISO.fmtAngle(m)}</b>`; }
      else {
        const t = calc.t === 'len' ? ISO.linear(s, calc.cls) : ISO.edge(s, calc.cls);
        out = t == null ? '<span class="muted">Bu ölçü/sınıf için tanımlı değil.</span>'
          : `<b class="mono big">${tolText(t)}</b><span class="mono muted">${N(s - t, 3)} – ${N(s + t, 3)}</span>`;
      }
      $('.calc-out').innerHTML = out;
    }

    function drawTabs() {
      el.querySelectorAll('.job-tabs button').forEach((b) => {
        const i = +b.dataset.j;
        b.classList.toggle('on', i === ji);
        b.classList.toggle('perfect', perfect.has(i));
      });
    }

    function load(i, fresh) {
      ji = i;
      if (fresh || !rows) { rows = measure(JOBS[ji]); picks = rows.map(() => null); submitted = false; }
      drawTabs();
      const job = JOBS[ji];
      $('.job-body').innerHTML = `
        <div class="tb-strip"><span>${job.title}</span><span class="mono">Genel toleranslar: <b>ISO 2768-${job.cls}${job.geo}</b></span></div>
        <div class="table-wrap"><table class="rep-table">
          <thead><tr><th>#</th><th>Özellik</th><th>Nominal</th><th>Ölçülen</th><th class="tcol">Tolerans</th><th>Karar</th></tr></thead>
          <tbody>${rows.map((r, k) => `
            <tr data-k="${k}">
              <td>${k + 1}</td>
              <td>${featName(r.f)}</td>
              <td class="mono">${r.f.label || (r.f.t === 'angle' ? `${r.f.nom}°` : N(r.f.nom, GDT.decimals(r.f.nom)))}</td>
              <td class="mono">${r.f.t === 'edge' && !r.f.label.startsWith('R') ? r.shown : r.f.t === 'edge' ? `R${r.shown}` : r.shown}</td>
              <td class="mono tcol">${submitted ? (r.f.t === 'angle' ? `±${ISO.fmtAngle(r.tol)}` : tolText(r.tol)) : '?'}</td>
              <td><div class="pick"><button data-v="1" class="${picks[k] === true ? 'on ok' : ''}">Kabul</button><button data-v="0" class="${picks[k] === false ? 'on bad' : ''}">Ret</button></div></td>
            </tr>`).join('')}</tbody>
        </table></div>
        <div class="rep-actions">
          <button class="btn" data-submit>Raporu teslim et</button>
          <button class="btn ghost" data-new>Yeni ölçümler</button>
        </div>
        <div class="rep-result"></div>`;
      if (submitted) mark();
      el.querySelectorAll('.pick button').forEach((b) => {
        b.onclick = () => {
          if (submitted) return;
          const k = +b.closest('tr').dataset.k;
          picks[k] = b.dataset.v === '1';
          b.parentElement.querySelectorAll('button').forEach((x) => { x.className = ''; });
          b.className = `on ${picks[k] ? 'ok' : 'bad'}`;
        };
      });
      $('[data-submit]').onclick = submit;
      $('[data-new]').onclick = () => load(ji, true);
    }

    function mark() {
      let right = 0;
      rows.forEach((r, k) => {
        const tr = el.querySelector(`tr[data-k="${k}"]`);
        const ok = picks[k] === r.ok;
        if (ok) right++;
        tr.classList.add(ok ? 'right' : 'wrong');
      });
      return right;
    }

    function submit() {
      if (picks.some((p) => p === null)) {
        $('.rep-result').innerHTML = '<div class="msg warn">Her satır için bir karar ver.</div>';
        return;
      }
      submitted = true;
      load(ji, false);
      const right = mark();
      const n = rows.length;
      if (right === n) {
        perfect.add(ji);
        GDT.store.data.best['m2.perfect'] = [...perfect];
        GDT.store.save();
      }
      const stars = perfect.size === JOBS.length ? 3 : perfect.size ? 2 : right >= n - 1 ? 1 : 0;
      if (stars) { GDT.giveStars(2, stars, 'Muayene masası'); api.done(); }
      GDT.syncStars(el, 2);
      drawTabs();
      const wrong = rows.map((r, k) => ({ r, k })).filter(({ r, k }) => picks[k] !== r.ok);
      $('.rep-result').innerHTML = `
        <div class="msg ${right === n ? 'ok' : right >= n - 1 ? 'info' : 'bad'}">
          <b>${right}/${n} doğru karar.</b> ${right === n ? (perfect.size < JOBS.length ? 'Kusursuz rapor. Diğer iş emirlerine geç.' : 'Üç raporun üçü de kusursuz!') : 'Yanlış satırlar kırmızı; tolerans sütununa bak.'}
          ${wrong.slice(0, 3).map(({ r, k }) => `<br>#${k + 1}: ${r.f.t === 'angle' ? `sapma ${r.dev > 0 ? '+' : '−'}${Math.abs(r.dev)}′, tolerans ±${ISO.fmtAngle(r.tol)}` : `sapma ${GDT.signed(r.dev, 3)}, tolerans ${tolText(r.tol)}`} → ${r.ok ? 'kabul' : 'ret'}`).join('')}
        </div>`;
      $('[data-submit]').disabled = true;
    }

    el.querySelector('.calc').addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      if (b.closest('[data-ct]')) calc.t = b.dataset.v;
      if (b.closest('[data-cc]')) calc.cls = b.dataset.v;
      drawCalc();
    });
    $('[data-cs]').oninput = (e) => { calc.size = GDT.parseNum(e.target.value); drawCalc(); };
    el.querySelector('.job-tabs').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) load(+b.dataset.j, true); });
    GDT.syncStars(el, 2);
    drawCalc();
    load(0, true);
  }

  // ======================================================================
  // SINA
  // ======================================================================
  const QUESTIONS = [
    {
      q: 'Antette “ISO 2768-m” yazıyor. Resimde çıplak yazılmış 80 mm’lik bir ölçünün toleransı nedir?',
      options: ['±0,15', '±0,2', '±0,3', '±0,5'],
      answer: 2,
      explain: '80 mm, “30’dan büyük – 120’ye kadar” aralığında; m sınıfında ±0,3.',
    },
    {
      q: '“ISO 2768-mK” notundaki K neyi belirtir?',
      options: ['Malzeme sınıfını', 'Yüzey pürüzlülüğünü', 'ISO 2768-2 geometrik genel tolerans sınıfını', 'Ölçü birimini'],
      answer: 2,
      explain: 'K, belirtilmemiş doğrusallık, düzlemsellik, diklik, simetri ve dairesel salgı toleranslarının sınıfıdır (H, K, L).',
    },
    {
      q: 'Hangisine antetteki genel tolerans uygulanmaz?',
      options: ['Çıplak yazılmış 45 ölçüsüne', 'Yanında +0,1/0 yazan 45 ölçüsüne', 'R3 dış radyüsüne', '90°’lik çıplak açıya'],
      answer: 1,
      explain: 'Kendi toleransı yazılmış ölçü, genel toleransın kapsamı dışındadır. Yardımcı ölçüler ve teorik tam ölçüler de öyle.',
    },
    {
      q: 'ISO 2768-m sınıfında 30 mm ve 31 mm ölçülerin toleransları nedir?',
      options: ['İkisi de ±0,2', 'İkisi de ±0,3', '30 için ±0,2, 31 için ±0,3', '30 için ±0,3, 31 için ±0,2'],
      answer: 2,
      explain: 'Aralık sınırı 30’dadır: 30 “6’dan büyük – 30’a kadar” aralığında (±0,2), 31 ise sonraki aralıkta (±0,3).',
    },
    {
      q: 'Genel toleransı biraz aşan, ama işlevini tam yerine getiren bir parça için ISO 2768-1 ne der?',
      options: ['Kesinlikle reddedilmeli', 'İşlevi bozulmuyorsa otomatik olarak reddedilmez', 'Bir üst sınıfa göre yeniden değerlendirilir', 'Tolerans iki katına çıkarılır'],
      answer: 1,
      explain: 'Genel toleranslar fonksiyonel olarak kritik olmayan ölçüler içindir. Kritik bir ölçünün mutlaka kendi toleransı yazılmalıdır.',
    },
    {
      q: 'Bir açının genel toleransı neye göre seçilir?',
      options: ['Açının büyüklüğüne', 'Açıyı oluşturan kısa kenarın uzunluğuna', 'Parçanın toplam boyuna', 'Malzemeye'],
      answer: 1,
      explain: 'Kısa kenar uzadıkça aynı açısal sapma uçta daha büyük bir mesafe yarattığı için tolerans daralır.',
    },
    {
      q: 'Aynı ölçü için hangi sınıf en dar toleransı verir?',
      options: ['v', 'c', 'm', 'f'],
      answer: 3,
      explain: 'f (ince) en dar, v (çok kaba) en geniş sınıftır.',
    },
  ];

  function sina(el, api) {
    el.append(GDT.el(`
      <div class="story card">
        <p class="kicker">Sına</p>
        <p>${QUESTIONS.length} soru. Geçmek için en az ${Math.ceil(QUESTIONS.length * 0.7)} doğru gerekiyor. Her doğru cevap +5 XP.</p>
      </div>`));
    GDT.quiz(el, { id: 'm2.quiz', questions: QUESTIONS, onPass: api.done });
  }

  GDT.registerModule(2, { steps: { sezgi, kavram, oyna, sina } });
})();
