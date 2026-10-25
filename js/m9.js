'use strict';
/* Module 9 — Konum toleransları (Sezgi: hole vs pin, Kavram: TED+datums / pattern fit / coaxiality / symmetry, Oyna: hole pattern report, Sına) */
(() => {
  const N = GDT.num;
  const posDev = (dx, dy) => 2 * Math.hypot(dx, dy);

  // ======================================================================
  // SEZGİ — how much position tolerance does a clearance hole allow?
  // ======================================================================
  function sezgi(el, api) {
    const F = 6;
    let H = 6.6, e = { x: 0.1, y: 0.05 }, drag = false, maxSeen = 0, asked = false;
    el.innerHTML = `
      <div class="story card">
        <p class="kicker">Durum</p>
        <p>Bir kapak, gövdedeki <b>Ø6</b> pime takılacak. Pim kusursuz yerinde. Kapaktaki delik ne kadar kaçarsa pim yine girer? Delik çapını seç ve deliği sürükle.</p>
      </div>
      <div class="card">
        <div class="m4-grid">
          <div>
            <span class="lbl">Kapaktaki delik çapı</span>
            <div class="seg" data-h>${[6.2, 6.4, 6.6, 7].map((h) => `<button data-v="${h}">Ø${N(h, 1)}</button>`).join('')}</div>
            <div class="cost-info pin-info"></div>
            <p class="hint">Deliği pim sıyırana kadar her yöne sürükle.</p>
          </div>
          <svg class="zplot pin-svg" viewBox="0 0 300 300" role="img" aria-label="Pim ve delik"></svg>
        </div>
      </div>
      <div class="asks"></div>`;
    const $ = (q) => el.querySelector(q);
    const svg = $('.pin-svg');
    const k = 220; // px per mm for the gap and the offset (exaggerated, same scale for both)
    function draw() {
      el.querySelectorAll('[data-h] button').forEach((b) => b.classList.toggle('on', +b.dataset.v === H));
      const off = Math.hypot(e.x, e.y), gap = (H - F) / 2, fits = off <= gap + 1e-9;
      maxSeen = fits ? Math.max(maxSeen, off) : maxSeen;
      const rp = 80, rh = rp + gap * k;
      svg.innerHTML = `
        <circle class="hole-ring" cx="${150 + e.x * k}" cy="${150 - e.y * k}" r="${rh}"/>
        <circle class="pin ${fits ? '' : 'jam'}" cx="150" cy="150" r="${rp}"/>
        <path class="drw-cl" d="M60 150h180M150 60v180"/>
        <circle class="zp-circle" cx="150" cy="150" r="${gap * k}"/>
        <g class="ctr"><circle cx="${150 + e.x * k}" cy="${150 - e.y * k}" r="6"/></g>
        <text class="ax-lbl" x="150" y="292" text-anchor="middle">boşluk ve kaçıklık abartılı · yeşil daire: deliğin merkezinin gidebileceği yer</text>`;
      $('.pin-info').innerHTML = `
        <div><small>Delik merkezi kaçıklığı</small><b class="mono">${N(off)}</b></div>
        <div><small>Konum sapması (Ø)</small><b class="mono">Ø${N(2 * off)}</b></div>
        <div><small>Montaj</small><b class="${fits ? 'good' : 'badc'}">${fits ? 'Pim girer' : 'Girmez'}</b></div>`;
      if (!asked && maxSeen >= gap * 0.85) { asked = true; ask(); }
    }
    function ask() {
      GDT.ask($('.asks'), {
        q: 'Ø6 pim, Ø6,6 delik ve kusursuz yerleştirilmiş pim için kapaktaki deliğe en fazla ne kadar konum toleransı verilebilir?',
        options: ['Ø0,3', 'Ø0,6', 'Ø1,2', 'Ø6,6'],
        answer: 1,
        explain: 'Delik merkezi her yönde (6,6 − 6)/2 = 0,3 kaçabilir: bu, çapı <b>0,6</b> olan bir daire. Genel kural: <b>T = H − F</b> (delik çapı eksi pim/cıvata çapı), karşı parça kusursuzsa. İki parça da toleransı paylaşıyorsa bu değer aralarında bölünür.',
        onDone: () => {
          const take = GDT.el(`
            <div class="takeaway card">
              <p class="kicker">Ana fikir</p>
              <p><b>Konum toleransı fonksiyondan gelir:</b> delik ile pim arasındaki boşluk, deliğin ne kadar kaçabileceğini belirler. Bölge dairedir, çünkü pim her yönde aynı boşluğa sahiptir. Bu yüzden konum toleransı Ø ile yazılır ve teorik tam yerinde, datumlara göre durur.</p>
              <button class="btn" data-next>Kavram adımına geç →</button>
            </div>`);
          $('.asks').append(take);
          take.querySelector('[data-next]').onclick = api.next;
          api.done();
        },
      });
    }
    const move = (ev) => {
      const p = GDT.svgPoint(svg, ev);
      e = { x: Math.round(((p.x - 150) / k) * 1000) / 1000, y: Math.round(((150 - p.y) / k) * 1000) / 1000 };
      draw();
    };
    svg.addEventListener('pointerdown', (ev) => { drag = true; svg.setPointerCapture(ev.pointerId); move(ev); });
    svg.addEventListener('pointermove', (ev) => { if (drag) move(ev); });
    svg.addEventListener('pointerup', () => { drag = false; });
    el.querySelector('[data-h]').addEventListener('click', (ev) => { const b = ev.target.closest('button'); if (b) { H = +b.dataset.v; maxSeen = 0; draw(); } });
    draw();
  }

  // ======================================================================
  // KAVRAM
  // ======================================================================
  function kavram(el, api) {
    GDT.carousel(el, [slideTed, slidePattern, slideCoax, slideSym], api);
  }

  const NOM = [{ x: 20, y: 15 }, { x: 80, y: 15 }, { x: 80, y: 55 }, { x: 20, y: 55 }];
  // measured: the whole pattern shifted +0,12 / −0,09 and turned slightly, holes also scattered a little
  const MEAS = NOM.map((p, i) => {
    const th = 0.0012, c = Math.cos(th), s = Math.sin(th);
    return { x: Math.round((p.x * c - p.y * s + 0.12 + [0.01, -0.012, 0.008, -0.006][i]) * 1000) / 1000, y: Math.round((p.x * s + p.y * c - 0.09 + [-0.008, 0.01, -0.004, 0.012][i]) * 1000) / 1000 };
  });

  function plateSVG(meas, zones, { k = 4.2, ex = 120, tol = 0.2 } = {}) {
    // plate 100 × 70, holes at TED positions; deviations drawn ×ex
    const X = (x) => 30 + x * k, Y = (y) => 330 - y * k;
    return `
      <rect class="drw-obj" x="${X(0)}" y="${Y(70)}" width="${100 * k}" height="${70 * k}"/>
      <g class="svg-datum"><path d="M${X(50)} ${Y(0)}l-6 10h12z"/><rect x="${X(50) - 8}" y="${Y(0) + 14}" width="16" height="16"/><text x="${X(50)}" y="${Y(0) + 26}" text-anchor="middle">B</text></g>
      <g class="svg-datum"><path d="M${X(0)} ${Y(35)}l-10 -6v12z"/><rect x="${X(0) - 28}" y="${Y(35) - 8}" width="16" height="16"/><text x="${X(0) - 20}" y="${Y(35) + 4}" text-anchor="middle">C</text></g>
      ${zones.map((z, i) => `<circle class="zp-circle" cx="${X(z.x)}" cy="${Y(z.y)}" r="${(tol / 2) * ex}"/>
        <circle class="drw-hole" cx="${X(NOM[i].x)}" cy="${Y(NOM[i].y)}" r="16" opacity=".35"/>
        <circle class="zp-pt ${posDev(meas[i].x - z.x, meas[i].y - z.y) <= tol + 1e-9 ? 'ok' : 'bad'}" cx="${X(z.x) + (meas[i].x - z.x) * ex}" cy="${Y(z.y) - (meas[i].y - z.y) * ex}" r="5"/>
        <text class="zp-n dark" x="${X(NOM[i].x)}" y="${Y(NOM[i].y) - 22}" text-anchor="middle">${i + 1}</text>`).join('')}
      <text class="ax-lbl" x="${X(0)}" y="${Y(0) + 48}">bölgeler ve sapmalar ×${ex} abartılı</text>`;
  }

  function slideTed(el) {
    let tol = 0.3;
    el.innerHTML = `
      <div class="slide-grid wide-right">
        <div>
          <p class="kicker">1 · Konum = TED + datum + Ø bölge</p>
          <h3>Bölgeler datumlardan, teorik tam ölçülerle</h3>
          <p>Dört deliğin ideal yerleri, A | B | C datum sisteminden teorik tam ölçülerle verilir. Her deliğin bölgesi kendi ideal yerinde duran Ø dairedir. Ölçülen merkezin bölgeye düşmesi gerekir.</p>
          <div class="ex-frame">${GDT.fcfHTML({ sym: 'position', zone: 'Ø', value: tol, datums: ['A', 'B', 'C'] }, 'big')}</div>
          <label class="slider"><span>Konum toleransı <output class="mono" data-o></output></span><input type="range" min="0.1" max="0.4" step="0.02" value="0.3" data-t></label>
          <div class="table-wrap"><table class="mini-table pos-table"></table></div>
        </div>
        <svg class="pat-svg" viewBox="0 0 480 400" role="img" aria-label="Delik deseni"></svg>
      </div>`;
    const draw = () => {
      el.querySelector('.ex-frame').innerHTML = GDT.fcfHTML({ sym: 'position', zone: 'Ø', value: tol, datums: ['A', 'B', 'C'] }, 'big');
      el.querySelector('[data-o]').textContent = `Ø${N(tol, 2)}`;
      el.querySelector('.pat-svg').innerHTML = plateSVG(MEAS, NOM, { tol });
      el.querySelector('.pos-table').innerHTML = `<thead><tr><th>#</th><th>ΔX</th><th>ΔY</th><th>Sapma</th></tr></thead><tbody>${MEAS.map((m, i) => {
        const dx = m.x - NOM[i].x, dy = m.y - NOM[i].y, d = posDev(dx, dy);
        return `<tr><td>${i + 1}</td><td class="mono">${GDT.signed(dx)}</td><td class="mono">${GDT.signed(dy)}</td><td class="mono ${d <= tol ? 'good' : 'badc'}">Ø${N(d)}</td></tr>`;
      }).join('')}</tbody>`;
    };
    el.querySelector('[data-t]').oninput = (e) => { tol = +e.target.value; draw(); };
    draw();
  }

  function slidePattern(el) {
    let mode = 'abc';
    const tol = 0.1;
    const fit = GEO.bestFitPattern(MEAS, NOM);
    // zones that follow the best-fitted pattern (inverse transform of the nominal grid)
    const c = Math.cos(-fit.th), s = Math.sin(-fit.th);
    const floatZones = NOM.map((p) => { const x = p.x - fit.dx, y = p.y - fit.dy; return { x: x * c - y * s, y: x * s + y * c }; });
    el.innerHTML = `
      <div class="slide-grid wide-right">
        <div>
          <p class="kicker">2 · Desen ne kadar serbest?</p>
          <h3>Datumlar değişince karar değişir</h3>
          <p>Dört delik montajda karşı parçadaki dört pime giriyorsa önemli olan <b>deliklerin birbirine göre</b> yeridir. Çerçevede yalnızca A varsa, desen bütün olarak A üzerinde kayabilir ve dönebilir; bölgeler deliklere en iyi oturacak yere gider.</p>
          <div class="seg" data-m><button data-v="abc">⌖ Ø0,1 | A | B | C</button><button data-v="a">⌖ Ø0,1 | A</button></div>
          <p class="callout pat-note"></p>
        </div>
        <svg class="pat-svg" viewBox="0 0 480 400" role="img" aria-label="Desen değerlendirmesi"></svg>
      </div>`;
    const draw = () => {
      el.querySelectorAll('[data-m] button').forEach((b) => b.classList.toggle('on', b.dataset.v === mode));
      const zones = mode === 'abc' ? NOM : floatZones;
      el.querySelector('.pat-svg').innerHTML = plateSVG(MEAS, zones, { tol, ex: 400 });
      const devs = MEAS.map((m, i) => posDev(m.x - zones[i].x, m.y - zones[i].y));
      const bad = devs.filter((d) => d > tol + 1e-9).length;
      el.querySelector('.pat-note').innerHTML = mode === 'abc'
        ? `B ve C’ye göre bütün desen 0,12 / 0,09 kaymış: <b>${bad} delik ret</b>. Deliklerin birbirine göre yeri ise neredeyse kusursuz.`
        : `Desen A üzerinde en iyi konuma kaydırıldı ve döndürüldü: en büyük sapma <b>Ø${N(2 * fit.worstR)}</b>, ${bad ? `${bad} delik ret` : '<b>hepsi kabul</b>'}. Kapak dört pime takılır; kenarlara göre yeri önemli değilse doğru çerçeve budur.`;
    };
    el.querySelector('[data-m]').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) { mode = b.dataset.v; draw(); } });
    draw();
  }

  function slideCoax(el) {
    let off = 0.02, tilt = 0.02;
    el.innerHTML = `
      <div class="slide-grid">
        <div>
          <p class="kicker">3 · Eş eksenlilik</p>
          <h3>İkinci çapın ekseni datum ekseninin etrafında</h3>
          <p>Kademeli bir milde büyük çap datum A. Küçük çapın ekseni, A ekseni etrafındaki <b>Ø t</b>’lik bir silindirin içinde kalmalı. Değer, eksenin datum ekseninden en uzak noktasının <b>iki katıdır</b>.</p>
          <label class="slider"><span>Eksen kaçıklığı (başta) <output class="mono" data-oo></output></span><input type="range" min="-0.05" max="0.05" step="0.002" value="0.02" data-o></label>
          <label class="slider"><span>Eksen eğikliği (uçta ek kayma) <output class="mono" data-ot></output></span><input type="range" min="-0.05" max="0.05" step="0.002" value="0.02" data-t></label>
          <div class="cost-info coax-info"></div>
        </div>
        <svg class="coax-svg" viewBox="0 0 340 200" role="img" aria-label="Eş eksenlilik"></svg>
      </div>`;
    const draw = () => {
      const e1 = off, e2 = off + tilt, val = 2 * Math.max(Math.abs(e1), Math.abs(e2)), ok = val <= 0.08;
      el.querySelector('[data-oo]').textContent = GDT.signed(off);
      el.querySelector('[data-ot]').textContent = GDT.signed(tilt);
      el.querySelector('.coax-info').innerHTML = `
        <div><small>Başta / uçta kaçıklık</small><b class="mono">${N(Math.abs(e1))} / ${N(Math.abs(e2))}</b></div>
        <div><small>Eş eksenlilik</small><b class="mono">Ø${N(val)}</b></div>
        <div><small>${GDT.fcfHTML({ sym: 'coaxiality', zone: 'Ø', value: 0.08, datums: ['A'] }, 'sm')}</small><b class="${ok ? 'good' : 'badc'}">${ok ? 'Kabul' : 'Ret'}</b></div>`;
      const k = 900, y1 = 100 - e1 * k, y2 = 100 - e2 * k;
      el.querySelector('.coax-svg').innerHTML = `
        <rect class="drw-obj" x="20" y="40" width="130" height="120"/>
        <path class="drw-obj" d="M150 ${y1 - 35}L310 ${y2 - 35}L310 ${y2 + 35}L150 ${y1 + 35}Z"/>
        <rect class="geo-zone" x="150" y="${100 - 0.04 * k}" width="160" height="${0.08 * k}"/>
        <line class="drw-cl" x1="10" y1="100" x2="330" y2="100"/>
        <line class="ang-edge feat" x1="150" y1="${y1}" x2="310" y2="${y2}"/>
        <g class="svg-datum"><path d="M85 160l-6 10h12z"/><rect x="77" y="172" width="16" height="16"/><text x="85" y="184" text-anchor="middle">A</text></g>
        <text class="ax-lbl" x="170" y="192">bölge Ø0,08 · sapmalar abartılı</text>`;
    };
    el.querySelector('[data-o]').oninput = (e) => { off = +e.target.value; draw(); };
    el.querySelector('[data-t]').oninput = (e) => { tilt = +e.target.value; draw(); };
    draw();
  }

  function slideSym(el) {
    let off = 0.03;
    el.innerHTML = `
      <div class="slide-grid">
        <div>
          <p class="kicker">4 · Simetri</p>
          <h3>Kanalın orta düzlemi, datumun orta düzleminde</h3>
          <p>Bir kama kanalı ya da yuva, parçanın orta düzlemine göre simetrik olmalı. Bölge, datum orta düzlemine simetrik duran ve aralığı t olan iki paralel düzlem. Kanalın orta düzlemi t/2’den fazla kaçamaz.</p>
          <label class="slider"><span>Kanalın kaçıklığı <output class="mono" data-oo></output></span><input type="range" min="-0.08" max="0.08" step="0.002" value="0.03" data-o></label>
          <div class="cost-info sym-info"></div>
          <p class="muted small">ISO 1101’de simetri ve eş eksenlilik konum ailesindedir. ASME Y14.5-2018 bu iki sembolü kaldırdı ve yerine konum ya da profil kullanıyor; ISO’da ikisi de geçerli.</p>
        </div>
        <svg class="sym-svg" viewBox="0 0 320 220" role="img" aria-label="Simetri"></svg>
      </div>`;
    const draw = () => {
      const val = 2 * Math.abs(off), ok = val <= 0.1;
      el.querySelector('[data-oo]').textContent = GDT.signed(off);
      el.querySelector('.sym-info').innerHTML = `
        <div><small>Orta düzlemin kaçıklığı</small><b class="mono">${N(Math.abs(off))}</b></div>
        <div><small>Simetri sapması (2 × kaçıklık)</small><b class="mono">${N(val)}</b></div>
        <div><small>${GDT.fcfHTML({ sym: 'symmetry', value: 0.1, datums: ['A'] }, 'sm')}</small><b class="${ok ? 'good' : 'badc'}">${ok ? 'Kabul' : 'Ret'}</b></div>`;
      const k = 900, cx = 160 + off * k;
      el.querySelector('.sym-svg').innerHTML = `
        <path class="drw-obj" d="M30 40H${cx - 30}V130H${cx + 30}V40H290V200H30Z"/>
        <rect class="geo-zone ${ok ? '' : 'badz'}" x="${160 - 0.05 * k}" y="20" width="${0.1 * k}" height="190"/>
        <line class="drw-cl" x1="160" y1="10" x2="160" y2="214"/>
        <line class="ang-edge feat" x1="${cx}" y1="34" x2="${cx}" y2="136"/>
        <text class="ax-lbl" x="34" y="214">datum A: parçanın orta düzlemi · abartılı</text>`;
    };
    el.querySelector('[data-o]').oninput = (e) => { off = +e.target.value; draw(); };
    draw();
  }

  // ======================================================================
  // OYNA — hole pattern inspection report
  // ======================================================================
  const PARTS = 3;
  const STARS = ['Bir raporda en az 3/4 doğru karar', 'Bir raporu hatasız teslim et', 'Üç raporun üçü de hatasız'];
  const TEDS = [
    [{ x: 15, y: 12 }, { x: 65, y: 12 }, { x: 65, y: 42 }, { x: 15, y: 42 }],
    [{ x: 25, y: 20 }, { x: 75, y: 20 }, { x: 50, y: 60 }, { x: 25, y: 60 }],
    [{ x: 30, y: 30 }, { x: 90, y: 30 }, { x: 90, y: 70 }, { x: 30, y: 70 }],
  ];
  function genPart(pi) {
    const tol = GDT.pick([0.1, 0.2, 0.25, 0.3]);
    let holes, okN;
    do {
      holes = TEDS[pi].map((p) => {
        for (;;) {
          const a = Math.random() * 2 * Math.PI, r = Math.sqrt(Math.random()) * tol * 0.85;
          const dx = Math.round(r * Math.cos(a) * 1000) / 1000, dy = Math.round(r * Math.sin(a) * 1000) / 1000;
          const d = posDev(dx, dy);
          if (Math.abs(d - tol) > 0.012) return { nom: p, x: Math.round((p.x + dx) * 1000) / 1000, y: Math.round((p.y + dy) * 1000) / 1000, d, ok: d <= tol };
        }
      });
      okN = holes.filter((h) => h.ok).length;
    } while (okN === 0 || okN === 4);
    return { tol, holes };
  }

  function oyna(el, api) {
    const perfect = new Set(GDT.store.data.best['m9.perfect'] || []);
    let pi = 0, part = null, picks = [], done = false;
    el.innerHTML = `
      <div class="card brief">
        <div>
          <p class="kicker">Ölçüm raporu</p>
          <h3>Delik deseni muayenesi</h3>
          <p>CMM, A | B | C datum sistemine göre her deliğin merkez koordinatlarını verdi. Teorik tam yerlerle karşılaştır, her delik için kabul ya da ret de. Hesaplayıcıyı kullanabilirsin.</p>
        </div>
        ${GDT.starsHTML(STARS)}
      </div>
      <div class="sim">
        <div class="card sim-ctl calc">
          <h4>Konum hesaplayıcı</h4>
          <label class="g-field"><span>ΔX (mm)</span><input inputmode="decimal" data-cx placeholder="0,05"></label>
          <label class="g-field"><span>ΔY (mm)</span><input inputmode="decimal" data-cy placeholder="−0,03"></label>
          <div class="calc-out"></div>
          <p class="muted small">Konum sapması = 2 × √(ΔX² + ΔY²)</p>
        </div>
        <div class="card report">
          <div class="job-tabs">${Array.from({ length: PARTS }, (_, i) => `<button data-j="${i}">Parça ${i + 1}<small>4 delik</small></button>`).join('')}</div>
          <div class="job-body"></div>
        </div>
      </div>`;
    const $ = (q) => el.querySelector(q);

    function calc() {
      const dx = GDT.parseNum($('[data-cx]').value), dy = GDT.parseNum($('[data-cy]').value);
      $('.calc-out').innerHTML = Number.isFinite(dx) && Number.isFinite(dy) ? `<b class="mono big">Ø${N(posDev(dx, dy))}</b>` : '<span class="muted">ΔX ve ΔY gir</span>';
    }
    function tabs() {
      el.querySelectorAll('.job-tabs button').forEach((b) => { b.classList.toggle('on', +b.dataset.j === pi); b.classList.toggle('perfect', perfect.has(+b.dataset.j)); });
    }
    function load(fresh) {
      if (fresh || !part) { part = genPart(pi); picks = part.holes.map(() => null); done = false; }
      tabs();
      $('.job-body').innerHTML = `
        <div class="tb-strip"><span>4× Ø8 delik</span><span>${GDT.fcfHTML({ sym: 'position', zone: 'Ø', value: part.tol, datums: ['A', 'B', 'C'] }, 'sm')}</span></div>
        <div class="table-wrap"><table class="rep-table">
          <thead><tr><th>#</th><th>TED X</th><th>TED Y</th><th>Ölçülen X</th><th>Ölçülen Y</th><th class="tcol">Sapma</th><th>Karar</th></tr></thead>
          <tbody>${part.holes.map((h, i) => `
            <tr data-k="${i}">
              <td>${i + 1}</td><td class="mono">${GDT.tedHTML(h.nom.x)}</td><td class="mono">${GDT.tedHTML(h.nom.y)}</td>
              <td class="mono">${N(h.x)}</td><td class="mono">${N(h.y)}</td>
              <td class="mono tcol">${done ? `Ø${N(h.d)}` : '?'}</td>
              <td><div class="pick"><button data-v="1" class="${picks[i] === true ? 'on ok' : ''}">Kabul</button><button data-v="0" class="${picks[i] === false ? 'on bad' : ''}">Ret</button></div></td>
            </tr>`).join('')}</tbody>
        </table></div>
        <div class="rep-actions"><button class="btn" data-submit ${done ? 'disabled' : ''}>Raporu teslim et</button><button class="btn ghost" data-new>Yeni ölçümler</button></div>
        <div class="rep-result"></div>
        <svg class="pat-mini" viewBox="0 0 480 140" ${done ? '' : 'hidden'}></svg>`;
      el.querySelectorAll('.pick button').forEach((b) => {
        b.onclick = () => {
          if (done) return;
          const i = +b.closest('tr').dataset.k;
          picks[i] = b.dataset.v === '1';
          b.parentElement.querySelectorAll('button').forEach((x) => { x.className = ''; });
          b.className = `on ${picks[i] ? 'ok' : 'bad'}`;
        };
      });
      $('[data-submit]').onclick = submit;
      $('[data-new]').onclick = () => load(true);
      if (done) mark();
    }
    function mark() {
      let right = 0;
      part.holes.forEach((h, i) => {
        const ok = picks[i] === h.ok;
        if (ok) right++;
        el.querySelector(`tr[data-k="${i}"]`).classList.add(ok ? 'right' : 'wrong');
      });
      const k = 110 / (part.tol * 1.2);
      $('.pat-mini').innerHTML = part.holes.map((h, i) => {
        const cx = 60 + i * 120, cy = 70;
        return `<circle class="zp-circle" cx="${cx}" cy="${cy}" r="${(part.tol / 2) * k}"/><path class="drw-cl" d="M${cx - 50} ${cy}h100M${cx} ${cy - 50}v100"/>
          <circle class="zp-pt ${h.ok ? 'ok' : 'bad'}" cx="${cx + (h.x - h.nom.x) * k}" cy="${cy - (h.y - h.nom.y) * k}" r="5"/>
          <text class="ax-lbl" x="${cx}" y="134" text-anchor="middle">#${i + 1} Ø${N(h.d)}</text>`;
      }).join('');
      return right;
    }
    function submit() {
      if (picks.some((p) => p === null)) { $('.rep-result').innerHTML = '<div class="msg warn">Her delik için karar ver.</div>'; return; }
      done = true;
      load(false);
      const right = mark();
      if (right === 4) { perfect.add(pi); GDT.store.data.best['m9.perfect'] = [...perfect]; GDT.store.save(); }
      const stars = perfect.size === PARTS ? 3 : perfect.size ? 2 : right >= 3 ? 1 : 0;
      if (stars) { GDT.giveStars(9, stars, 'Desen muayenesi'); api.done(); }
      GDT.syncStars(el, 9);
      tabs();
      $('.rep-result').innerHTML = `<div class="msg ${right === 4 ? 'ok' : 'bad'}"><b>${right}/4 doğru karar.</b> ${right === 4 ? 'Kusursuz rapor.' : 'Önce ΔX = ölçülen − TED, sonra Ø = 2√(ΔX² + ΔY²).'}</div>`;
    }
    $('[data-cx]').oninput = calc;
    $('[data-cy]').oninput = calc;
    el.querySelector('.job-tabs').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) { pi = +b.dataset.j; load(true); } });
    GDT.syncStars(el, 9);
    calc();
    load(true);
  }

  // ======================================================================
  // SINA
  // ======================================================================
  const QUESTIONS = [
    {
      q: 'Ø8,4 delikten Ø8 cıvata geçecek; karşı parçadaki dişli delik kusursuz yerinde. Delikteki konum toleransı en fazla?',
      options: ['Ø0,2', 'Ø0,4', 'Ø0,8', 'Ø8,4'],
      answer: 1,
      explain: 'T = H − F = 8,4 − 8 = Ø0,4. Delik merkezi her yönde 0,2 kaçabilir.',
    },
    {
      q: 'Konum toleransının bölgesi nerede durur?',
      options: ['Ölçülen deliğin merkezinde', 'Teorik tam ölçülerle datumlardan tanımlanan ideal yerde', 'Parçanın ortasında', 'Herhangi bir yerde'],
      answer: 1,
      explain: 'TED’ler ideal yeri, datumlar başlangıcı verir; bölge orada sabittir.',
    },
    {
      q: 'Delik merkezi TED’e göre ΔX = 0,03, ΔY = 0,04 kaçmış. Ø0,08 konum toleransına göre?',
      options: ['Kabul: Ø0,05', 'Kabul: Ø0,07', 'Ret: Ø0,10', 'Ret: Ø0,14'],
      answer: 2,
      explain: '√(0,03² + 0,04²) = 0,05; çap olarak 0,10 > 0,08.',
    },
    {
      q: 'Dört delik bir kapağı dört pime bağlıyor; kenarlara göre yeri önemsiz. Hangisi daha uygun?',
      options: ['⌖ Ø0,1 | A | B | C', '⌖ Ø0,1 | A', 'Her deliğe ± koordinat', 'Konum toleransı verilmez'],
      answer: 1,
      explain: 'Yalnızca A’ya göre desen kayabilir ve dönebilir; önemli olan deliklerin birbirine göre yeri kontrol edilir.',
    },
    {
      q: 'Eş eksenlilikte sonuç neden “2 × kaçıklık” olarak verilir?',
      options: ['Ölçüm iki kez yapıldığı için', 'Bölge bir silindirdir ve tolerans onun çapıdır', 'İki datum olduğu için', 'Güvenlik payı olarak'],
      answer: 1,
      explain: 'Eksen datum ekseninden r kadar uzaksa, onu içine alan silindirin çapı 2r’dir.',
    },
    {
      q: 'Bir kanal parçanın orta düzlemine göre 0,03 kaçmış. Simetri sapması nedir?',
      options: ['0,015', '0,03', '0,06', '0,09'],
      answer: 2,
      explain: 'Bölge datum düzlemine simetrik iki düzlemdir; kaçıklığın iki katı.',
    },
    {
      q: 'Konum toleransı yönelim ve form üzerinde ne yapar?',
      options: ['Hiçbir etkisi yoktur', 'Onları da sınırlar: bölgeden çıkmayan eleman ne çok eğik ne çok eğri olabilir', 'Yalnızca formu sınırlar', 'Yalnızca yönelimi sınırlar'],
      answer: 1,
      explain: 'Merdivenin en üst basamağı: konum ≥ yönelim ≥ form.',
    },
  ];

  function sina(el, api) {
    el.append(GDT.el(`
      <div class="story card">
        <p class="kicker">Sına</p>
        <p>${QUESTIONS.length} soru. Geçmek için en az ${Math.ceil(QUESTIONS.length * 0.7)} doğru gerekiyor. Her doğru cevap +5 XP.</p>
      </div>`));
    GDT.quiz(el, { id: 'm9.quiz', questions: QUESTIONS, onPass: api.done });
  }

  GDT.registerModule(9, { steps: { sezgi, kavram, oyna, sina } });
})();
