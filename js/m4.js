'use strict';
/* Module 4 — ± sisteminin sınırları (Sezgi: square vs functional circle, Kavram: 4 slides, Oyna: hole position inspection, Sına) */
(() => {
  const N = GDT.num;
  const r3 = (v) => Math.round(v * 1000) / 1000;

  // Magnified deviation plot: square zone ±t, circle of diameter D, points {x, y, cls}
  function zonePlot({ R = 0.2, t = null, D = null, pts = [], probe = null, labels = true }) {
    const k = 135 / R, c = 150, X = (v) => c + v * k, Y = (v) => c - v * k;
    const grid = [];
    const step = R <= 0.25 ? 0.05 : 0.1;
    for (let v = -R; v <= R + 1e-9; v += step) {
      const major = Math.abs(v) < 1e-9;
      grid.push(`<line class="zp-grid${major ? ' major' : ''}" x1="${X(v)}" y1="${Y(-R)}" x2="${X(v)}" y2="${Y(R)}"/><line class="zp-grid${major ? ' major' : ''}" x1="${X(-R)}" y1="${Y(v)}" x2="${X(R)}" y2="${Y(v)}"/>`);
    }
    return `
      ${grid.join('')}
      ${D != null ? `<circle class="zp-circle" cx="${c}" cy="${c}" r="${(D / 2) * k}"/>` : ''}
      ${t != null ? `<rect class="zp-square" x="${X(-t)}" y="${Y(t)}" width="${2 * t * k}" height="${2 * t * k}"/>` : ''}
      ${labels && t != null ? `<text class="zp-lbl sq" x="${X(-t) + 4}" y="${Y(t) - 5}">±${N(t, 2)} kare</text>` : ''}
      ${labels && D != null ? `<text class="zp-lbl ci" x="${c}" y="${Y(-D / 2) + 14}" text-anchor="middle">Ø${N(D, 3).replace(/0+$/, '').replace(/,$/, '')}</text>` : ''}
      ${pts.map((p, i) => `<circle class="zp-pt ${p.cls || ''}" cx="${X(p.x)}" cy="${Y(p.y)}" r="6"/>${p.n != null ? `<text class="zp-n" x="${X(p.x)}" y="${Y(p.y) + 3}" text-anchor="middle">${p.n}</text>` : ''}`).join('')}
      ${probe ? `<g class="zp-probe"><line x1="${c}" y1="${c}" x2="${X(probe.x)}" y2="${Y(probe.y)}"/><circle cx="${X(probe.x)}" cy="${Y(probe.y)}" r="9"/></g>` : ''}
      <text class="zp-ax" x="${X(R) - 2}" y="${c - 4}" text-anchor="end">X</text>
      <text class="zp-ax" x="${c + 4}" y="${Y(R) + 12}">Y</text>`;
  }
  const svgPoint = (svg, e) => {
    const p = svg.createSVGPoint();
    p.x = e.clientX; p.y = e.clientY;
    return p.matrixTransform(svg.getScreenCTM().inverse());
  };

  const plateDrawing = (mode = 'pm') => `
    <svg class="drw m4-drw" viewBox="0 0 320 240" role="img" aria-label="Delikli plaka">
      <rect class="drw-obj" x="40" y="40" width="260" height="156"/>
      <circle class="drw-hole" cx="144" cy="118" r="16"/>
      <path class="drw-cl" d="M144 94v48M120 118h48"/>
      <line class="drw-ext" x1="40" y1="200" x2="40" y2="228"/><line class="drw-ext" x1="144" y1="138" x2="144" y2="228"/>
      <line class="drw-dim" x1="40" y1="222" x2="144" y2="222"/><path class="drw-arrow" d="M40 222l8-3v6z"/><path class="drw-arrow" d="M144 222l-8-3v6z"/>
      <line class="drw-ext" x1="36" y1="196" x2="10" y2="196"/><line class="drw-ext" x1="124" y1="118" x2="10" y2="118"/>
      <line class="drw-dim" x1="18" y1="118" x2="18" y2="196"/><path class="drw-arrow" d="M18 118l-3 8h6z"/><path class="drw-arrow" d="M18 196l-3-8h6z"/>
      ${mode === 'pm'
        ? `<text class="drw-txt sm" x="92" y="217" text-anchor="middle">40 ±0,1</text>
           <text class="drw-txt sm" transform="translate(13 157) rotate(-90)" text-anchor="middle">30 ±0,1</text>`
        : `<rect class="ted-box" x="78" y="206" width="28" height="14"/><text class="drw-txt sm" x="92" y="217" text-anchor="middle">40</text>
           <rect class="ted-box" x="4" y="143" width="14" height="28"/><text class="drw-txt sm" transform="translate(14 157) rotate(-90)" text-anchor="middle">30</text>
           <path class="drw-dim" d="M155 107l40-40h20"/>
           <g class="svg-fcf"><rect x="215" y="56" width="22" height="20"/><rect x="237" y="56" width="40" height="20"/><rect x="277" y="56" width="18" height="20"/><rect x="295" y="56" width="18" height="20"/>
             <g transform="translate(217 57) scale(.75)" fill="none" stroke-width="1.8">${GDT.SYMBOLS.position}</g>
             <text x="257" y="70" text-anchor="middle">Ø0,28</text><text x="286" y="70" text-anchor="middle">A</text><text x="304" y="70" text-anchor="middle">B</text></g>
           <g class="svg-datum"><path d="M40 70l-10-6v12z"/><line x1="30" y1="70" x2="22" y2="70"/><rect x="8" y="62" width="14" height="16"/><text x="15" y="74" text-anchor="middle">B</text></g>
           <g class="svg-datum"><path d="M250 196l-6 10h12z"/><line x1="250" y1="206" x2="250" y2="212"/><rect x="243" y="212" width="14" height="16"/><text x="250" y="224" text-anchor="middle">A</text></g>`}
    </svg>`;

  // ======================================================================
  // SEZGİ
  // ======================================================================
  function sezgi(el, api) {
    const T = 0.1, RF = Math.SQRT2 * T;
    let pts = [], stage = 0, probe = { x: 0.06, y: 0.05 }, dragging = false;
    el.innerHTML = `
      <div class="story card">
        <p class="kicker">Durum</p>
        <p>Plakadaki delik, karşı parçadaki bir pime oturuyor. Resimde konumu <b class="mono">40 ±0,1</b> ve <b class="mono">30 ±0,1</b> ile verilmiş. Montaj denemeleri gösterdi ki pim, delik merkezi nominal yerden <b>0,141 mm’ye kadar</b> kaçtığında rahatça giriyor. <b>Yön fark etmiyor.</b></p>
      </div>
      <div class="card">
        <div class="m4-grid">
          <div>
            ${plateDrawing('pm')}
            <div class="cost-info m4-read"></div>
            <div class="m4-btns">
              <button class="btn" data-insp>8 plakayı muayene et</button>
              <button class="btn ghost" data-asm disabled>Hepsini montajda dene</button>
            </div>
          </div>
          <div>
            <svg class="zplot" viewBox="0 0 300 300" role="img" aria-label="Delik merkezi sapma grafiği"></svg>
            <div class="legend"><span class="lg sq">± kare bölge</span><span class="lg ci">pimin girdiği sınır</span></div>
          </div>
        </div>
        <p class="hint">Mavi noktayı (delik merkezini) sürükle. Karenin köşesine, sonra karenin hemen dışına ama dairenin içine götür.</p>
      </div>
      <div class="asks"></div>`;
    const $ = (s) => el.querySelector(s);
    const svg = $('.zplot');
    const inSq = (p) => Math.abs(p.x) <= T + 1e-9 && Math.abs(p.y) <= T + 1e-9;
    const fits = (p) => Math.hypot(p.x, p.y) <= RF + 1e-9;

    function draw() {
      const ptsDrawn = pts.map((p, i) => {
        let cls = inSq(p) ? 'ok' : 'bad';
        if (stage >= 2 && !inSq(p) && fits(p)) cls = 'waste';
        return { ...p, cls, n: i + 1 };
      });
      svg.innerHTML = zonePlot({ R: 0.2, t: T, D: 2 * RF, pts: ptsDrawn, probe });
      const r = Math.hypot(probe.x, probe.y);
      $('.m4-read').innerHTML = `
        <div><small>Sapma X / Y</small><b class="mono">${GDT.signed(probe.x, 3)} / ${GDT.signed(probe.y, 3)}</b></div>
        <div><small>± kuralına göre</small><b class="${inSq(probe) ? 'good' : 'badc'}">${inSq(probe) ? 'Kabul' : 'Ret'}</b></div>
        <div><small>Merkezden ${N(r, 3)} · montaj</small><b class="${fits(probe) ? 'good' : 'badc'}">${fits(probe) ? 'Pim girer' : 'Girmez'}</b></div>`;
    }

    function move(e) {
      const p = svgPoint(svg, e), k = 135 / 0.2;
      probe = { x: r3(GDT.clamp((p.x - 150) / k, -0.2, 0.2)), y: r3(GDT.clamp((150 - p.y) / k, -0.2, 0.2)) };
      draw();
    }
    svg.addEventListener('pointerdown', (e) => { dragging = true; svg.setPointerCapture(e.pointerId); move(e); });
    svg.addEventListener('pointermove', (e) => { if (dragging) move(e); });
    svg.addEventListener('pointerup', () => { dragging = false; });

    function genBatch() {
      const pick = (want) => {
        for (;;) {
          const p = { x: r3((Math.random() * 2 - 1) * 0.17), y: r3((Math.random() * 2 - 1) * 0.17) };
          const cat = inSq(p) ? 'sq' : fits(p) ? 'circ' : 'out';
          // keep points visibly away from the boundaries
          const nearSq = Math.abs(Math.max(Math.abs(p.x), Math.abs(p.y)) - T) < 0.008;
          const nearCi = Math.abs(Math.hypot(p.x, p.y) - RF) < 0.008;
          if (cat === want && !nearSq && !nearCi) return p;
        }
      };
      return GDT.shuffle(['sq', 'sq', 'sq', 'circ', 'circ', 'circ', 'out', 'out'].map(pick));
    }

    $('[data-insp]').onclick = () => {
      pts = genBatch();
      stage = 1;
      $('[data-asm]').disabled = false;
      $('.hint').innerHTML = `± kuralına göre <b>${pts.filter(inSq).length} kabul</b>, <b>${pts.filter((p) => !inSq(p)).length} ret</b>. Ret edilenler hurdaya gidecek. Göndermeden önce hepsini montajda deneyelim mi?`;
      draw();
    };
    $('[data-asm]').onclick = () => {
      if (stage >= 2) return;
      stage = 2;
      const wasted = pts.filter((p) => !inSq(p) && fits(p)).length;
      $('.hint').innerHTML = `Sarı noktalar: ± kuralı <b>ret</b> dedi, ama pim <b>giriyor</b>.`;
      draw();
      GDT.ask($('.asks'), {
        q: 'Kaç plaka, görevini yapabilecekken hurdaya ayrıldı?',
        options: [0, wasted, wasted + 2, 8].map(String),
        answer: 1,
        explain: `${wasted} plaka. Kare bölgenin köşeleri merkezden 0,141 uzakta; fonksiyon bu mesafeyi her yönde kabul ediyor. Yani gerçek kabul bölgesi <b>bir daire</b>. ± ölçülendirme ise kare bir bölge çiziyor ve köşegen dışındaki her yönde iyi parçayı reddediyor.`,
        onDone: () => {
          const take = GDT.el(`
            <div class="takeaway card">
              <p class="kicker">Ana fikir</p>
              <p><b>Fonksiyon çoğu zaman dairesel, ± toleransı ise karedir.</b> Kareyi çevreleyen daire, kareden <b>yaklaşık %57 daha büyük</b>. Bu fark, hiçbir işe yaramadan hurdaya giden iyi parçalardır. GD&T’nin konum toleransı bu daireyi doğrudan tarif eder.</p>
              <button class="btn" data-next>Kavram adımına geç →</button>
            </div>`);
          $('.asks').append(take);
          take.querySelector('[data-next]').onclick = api.next;
          api.done();
        },
      });
    };
    draw();
  }

  // ======================================================================
  // KAVRAM
  // ======================================================================
  function kavram(el, api) {
    GDT.carousel(el, [slideArea, slideOrigin, slideForm, slideCompare], api);
  }

  function slideArea(el) {
    let t = 0.1, pts = [];
    el.innerHTML = `
      <div class="slide-grid">
        <div>
          <p class="kicker">1 · Alan</p>
          <h3>Kare ve onu çevreleyen daire</h3>
          <p>Koordinat toleransı ±t, kenarı 2t olan bir kare çizer. Köşeleri fonksiyonel olarak kabul edilebiliyorsa, aynı uzaklıktaki her yön de kabul edilmeli: çapı <b>2√2·t</b> olan daire.</p>
          <label class="slider"><span>± tolerans <output class="mono" data-o></output></span><input type="range" min="0.05" max="0.2" step="0.01" value="0.1" data-t></label>
          <div class="cost-info area-info"></div>
          <button class="btn ghost" data-gen>1000 delik üret</button>
          <p class="muted small area-sum"></p>
        </div>
        <svg class="zplot" viewBox="0 0 300 300" role="img" aria-label="Kare ve daire bölge"></svg>
      </div>`;
    const svg = el.querySelector('.zplot');
    function draw() {
      const D = 2 * Math.SQRT2 * t;
      el.querySelector('[data-o]').textContent = `±${N(t, 2)}`;
      const sq = (2 * t) ** 2, ci = Math.PI * (D / 2) ** 2;
      el.querySelector('.area-info').innerHTML = `
        <div><small>Kare alanı</small><b class="mono">${N(sq, 4)} mm²</b></div>
        <div><small>Daire Ø${N(D, 3)}</small><b class="mono">${N(ci, 4)} mm²</b></div>
        <div><small>Fark</small><b class="mono">+%${Math.round((ci / sq - 1) * 100)}</b></div>`;
      const R = Math.max(0.2, t * 2);
      svg.innerHTML = zonePlot({
        R, t, D,
        pts: pts.map((p) => ({ ...p, cls: Math.abs(p.x) <= t && Math.abs(p.y) <= t ? 'ok tiny' : Math.hypot(p.x, p.y) <= D / 2 ? 'waste tiny' : 'bad tiny' })),
      });
      if (pts.length) {
        const a = pts.filter((p) => Math.abs(p.x) <= t && Math.abs(p.y) <= t).length;
        const b = pts.filter((p) => Math.hypot(p.x, p.y) <= D / 2).length;
        el.querySelector('.area-sum').innerHTML = `Kare <b>${a}</b> deliği, daire <b>${b}</b> deliği kabul ediyor. Aradaki <b>${b - a}</b> delik (sarı) işini görür ama ± ile reddedilir.`;
      }
    }
    el.querySelector('[data-t]').oninput = (e) => { t = +e.target.value; pts = []; el.querySelector('.area-sum').textContent = ''; draw(); };
    el.querySelector('[data-gen]').onclick = () => {
      const s = t * 0.65;
      pts = Array.from({ length: 1000 }, () => ({ x: GDT.gauss() * s, y: GDT.gauss() * s }));
      draw();
    };
    draw();
  }

  function slideOrigin(el) {
    let h = 30, datum = false;
    const edge = (y) => 0.12 * Math.sin(y / 8) + 0.05 * Math.sin(y / 3.1) + 0.003 * y; // edge deviation, mm
    let minE = Infinity;
    for (let y = 0; y <= 60; y += 0.5) minE = Math.min(minE, edge(y));
    el.innerHTML = `
      <div class="slide-grid">
        <div>
          <p class="kicker">2 · Başlangıç belirsiz</p>
          <h3>“40 mm” ama nereden?</h3>
          <p>Delik kenardan 40 ±0,1 mm. Ama gerçek kenar düz değil (büyütülmüş çizim). Ölçüyü kenarın hangi noktasından alırsan sonuç değişir; ± ölçüsü bunu söylemez.</p>
          <label class="slider"><span>Kenarda ölçüm yüksekliği <output class="mono" data-o></output></span><input type="range" min="0" max="60" step="1" value="30" data-h></label>
          <label class="switch"><input type="checkbox" data-d><span class="sw"></span><span>Datum düzlemi ekle <small>kenara malzeme dışından temas eden ideal düzlem</small></span></label>
          <div class="cost-info org-info"></div>
        </div>
        <svg class="org-svg" viewBox="0 0 320 260" role="img" aria-label="Kusurlu kenardan ölçüm"></svg>
      </div>`;
    const svg = el.querySelector('.org-svg');
    const ex = 200; // exaggeration for the edge
    const X = (dev) => 60 + dev * ex, Y = (y) => 230 - y * 3.4;
    function draw() {
      el.querySelector('[data-o]').textContent = `${h} mm`;
      let path = `M${X(edge(0))} ${Y(0)}`;
      for (let y = 0.5; y <= 60; y += 0.5) path += `L${X(edge(y))} ${Y(y)}`;
      const reading = 40 - edge(h), readingD = 40 - minE;
      const hx = 260, hy = Y(30);
      svg.innerHTML = `
        <path class="drw-obj" d="${path}L300 ${Y(60)}L300 ${Y(0)}Z"/>
        <circle class="drw-hole" cx="${hx}" cy="${hy}" r="12"/><path class="drw-cl" d="M${hx - 18} ${hy}h36M${hx} ${hy - 18}v36"/>
        ${datum ? `<line class="datum-plane" x1="${X(minE)}" y1="10" x2="${X(minE)}" y2="250"/><text class="ax-lbl strong" x="${X(minE) - 6}" y="20" text-anchor="end">datum</text>` : ''}
        <line class="meas-line" x1="${datum ? X(minE) : X(edge(h))}" y1="${datum ? hy : Y(h)}" x2="${hx}" y2="${hy}"/>
        <circle class="meas-dot" cx="${X(edge(h))}" cy="${Y(h)}" r="5"/>
        <text class="ax-lbl" x="10" y="252">kenar sapması ×${ex} abartılı</text>`;
      el.querySelector('.org-info').innerHTML = `
        <div><small>Bu noktadan ölçüm</small><b class="mono">${N(reading, 3)}</b></div>
        <div><small>Datumdan ölçüm</small><b class="mono">${datum ? N(readingD, 3) : '—'}</b></div>
        <div><small>Karar (40 ±0,1)</small><b class="${Math.abs((datum ? readingD : reading) - 40) <= 0.1 ? 'good' : 'badc'}">${Math.abs((datum ? readingD : reading) - 40) <= 0.1 ? 'Kabul' : 'Ret'}</b></div>`;
    }
    el.querySelector('[data-h]').oninput = (e) => { h = +e.target.value; draw(); };
    el.querySelector('[data-d]').onchange = (e) => { datum = e.target.checked; draw(); };
    draw();
  }

  function slideForm(el) {
    let bend = 0.6;
    el.innerHTML = `
      <div class="slide-grid">
        <div>
          <p class="kicker">3 · Boyut formu sınırlamaz</p>
          <h3>Muz gibi eğri ama her yerde 10,00</h3>
          <p>Plaka kalınlığı <b class="mono">10 ±0,1</b>. Kumpas hangi noktada ölçerse ölçsün 10,00 okuyor; plaka yine de 10,2 mm’lik yuvaya girmiyor.</p>
          <label class="slider"><span>Eğilme (sehim) <output class="mono" data-o></output></span><input type="range" min="0" max="1.5" step="0.05" value="0.6" data-b></label>
          <div class="cost-info form-info"></div>
          <p class="callout">ISO GPS’te varsayılan kural <b>bağımsızlık ilkesidir (ISO 8015)</b>: boyut toleransı yalnızca yerel iki nokta ölçüsünü sınırlar, formu değil. Formu sınırlamak için düzlemsellik gibi bir geometrik tolerans ya da zarf gerekliliği <b>Ⓔ</b> gerekir.</p>
        </div>
        <svg class="form-svg" viewBox="0 0 340 200" role="img" aria-label="Eğilmiş plaka ve yuva"></svg>
      </div>`;
    const svg = el.querySelector('.form-svg');
    function draw() {
      el.querySelector('[data-o]').textContent = `${N(bend, 2)} mm`;
      const k = 40; // px per mm for the bend (exaggerated); thickness drawn 10 mm = 40 px
      const y = (x) => 100 - bend * k * (1 - ((x - 170) / 140) ** 2) * 0.9;
      let top = '', bot = '';
      for (let x = 30; x <= 310; x += 5) { top += `${x === 30 ? 'M' : 'L'}${x} ${y(x) - 20}`; bot = `L${x} ${y(x) + 20}` + bot; }
      const env = 10 + bend, fits = env <= 10.2;
      svg.innerHTML = `
        <rect class="slot-r" x="20" y="${100 - 20 - 0.2 * 2}" width="300" height="${40 + 0.8}"/>
        <line class="slot-edge" x1="20" y1="80" x2="320" y2="80"/><line class="slot-edge" x1="20" y1="121" x2="320" y2="121"/>
        <path class="drw-obj ${fits ? '' : 'jam-part'}" d="${top}${bot.replace(/^L/, 'L')}Z"/>
        ${[70, 170, 270].map((x) => `<line class="meas-line" x1="${x}" y1="${y(x) - 20}" x2="${x}" y2="${y(x) + 20}"/><text class="ax-lbl strong" x="${x + 4}" y="${y(x) - 24}">10,00</text>`).join('')}
        <text class="ax-lbl" x="20" y="190">yuva 10,2 mm · eğilme abartılı</text>`;
      el.querySelector('.form-info').innerHTML = `
        <div><small>Yerel kalınlık</small><b class="mono good">10,00 ✓</b></div>
        <div><small>Zarf (toplam yükseklik)</small><b class="mono">${N(env, 2)}</b></div>
        <div><small>10,2 yuvaya</small><b class="${fits ? 'good' : 'badc'}">${fits ? 'Girer' : 'Girmez'}</b></div>`;
    }
    el.querySelector('[data-b]').oninput = (e) => { bend = +e.target.value; draw(); };
    draw();
  }

  function slideCompare(el) {
    const ROWS = [
      ['Tolerans bölgesi', 'Kare, 0,2 × 0,2', 'Daire, Ø0,28: fonksiyonun bölgesi'],
      ['Ölçüm başlangıcı', 'Belirsiz: kenarın hangi noktası?', 'A ve B datumları: ideal düzlemler'],
      ['Ölçüler', '± toleranslı, zincirde birikir', 'Teorik tam ölçüler (çerçeveli), birikmez'],
      ['Form', 'Kontrol edilmez (ISO 8015)', 'Gerekirse ayrı form toleransı'],
      ['Ek tolerans', 'Yok', 'Ⓜ ile delik büyüdükçe artar (Modül 12)'],
    ];
    el.innerHTML = `
      <p class="kicker">4 · GD&T ile aynı delik</p>
      <h3>Aynı delik, iki dil</h3>
      <div class="cmp-grid">
        <div class="cmp-card"><small>± ile</small>${plateDrawing('pm')}</div>
        <div class="cmp-card"><small>GD&T (ISO 1101) ile</small>${plateDrawing('gdt')}</div>
      </div>
      <div class="table-wrap"><table class="iso-table cmp-table"><thead><tr><th></th><th>± ölçülendirme</th><th>Konum toleransı</th></tr></thead>
        <tbody>${ROWS.map((r) => `<tr><th>${r[0]}</th><td>${r[1]}</td><td>${r[2]}</td></tr>`).join('')}</tbody></table></div>
      <p class="muted small">Ø0,28, ±0,1 karesini çevreleyen dairedir (2√2 × 0,1 ≈ 0,283). Çerçeveyi Modül 5’te, datumları Modül 6’da tek tek açacağız.</p>`;
  }

  // ======================================================================
  // OYNA — CMM readouts, two kinds of specs
  // ======================================================================
  const ROUNDS = 10;
  const STARS = ['En az 6 doğru karar', 'En az 8 doğru karar', '10 kararın hepsi doğru'];

  function genRound() {
    const pm = Math.random() < 0.5;
    const t = pm ? GDT.pick([0.05, 0.1, 0.2]) : null;
    const D = pm ? null : GDT.pick([0.1, 0.2, 0.28, 0.4]);
    const R = pm ? t * 1.55 : D * 0.75;
    for (;;) {
      const a = Math.random() * 2 * Math.PI, r = Math.sqrt(Math.random()) * R;
      const x = r3(r * Math.cos(a)), y = r3(r * Math.sin(a));
      const pos = 2 * Math.hypot(x, y);
      const ok = pm ? Math.abs(x) <= t && Math.abs(y) <= t : pos <= D;
      const near = pm ? Math.min(Math.abs(Math.abs(x) - t), Math.abs(Math.abs(y) - t)) < 0.005 : Math.abs(pos - D) < 0.008;
      if (!near) return { pm, t, D, x, y, pos, ok };
    }
  }

  function oyna(el, api) {
    let round = 0, correct = 0, cur = null;
    const results = [];
    el.innerHTML = `
      <div class="card brief">
        <div>
          <p class="kicker">Ölçüm odası</p>
          <h3>Delik konumu muayenesi</h3>
          <p>Koordinat ölçme makinesi (CMM) her turda bir deliğin nominal yerden X ve Y sapmasını veriyor. Resim bazen <b>± koordinat toleransı</b>, bazen <b>konum toleransı Ø</b> istiyor. Kararını ver.</p>
          <p class="callout small">Konum sapması = <b class="mono">2 × √(ΔX² + ΔY²)</b>. Çap olarak çıkar ve çerçevedeki Ø değeriyle karşılaştırılır.</p>
        </div>
        ${GDT.starsHTML(STARS)}
      </div>
      <div class="card game">
        <div class="game-top"><span class="mono g-round"></span><div class="g-progress"></div></div>
        <div class="game-stage"></div>
      </div>`;
    const $ = (s) => el.querySelector(s);

    function header() {
      $('.g-round').textContent = round < ROUNDS ? `Tur ${round + 1} / ${ROUNDS}` : 'Bitti';
      $('.g-progress').innerHTML = Array.from({ length: ROUNDS }, (_, i) => `<i class="${results[i] === true ? 'ok' : results[i] === false ? 'bad' : i === round ? 'now' : ''}"></i>`).join('');
    }

    function next() {
      if (round >= ROUNDS) return end();
      cur = genRound();
      header();
      const spec = cur.pm
        ? `<div class="spec-box"><small>Resimdeki gereklilik</small><span class="dim-line mono">X: 40 ±${N(cur.t, 2)} · Y: 30 ±${N(cur.t, 2)}</span></div>`
        : `<div class="spec-box"><small>Resimdeki gereklilik</small>${GDT.fcfHTML({ sym: 'position', zone: 'Ø', value: cur.D, datums: ['A', 'B'] }, 'sm')}<span class="muted small">Konum ${GDT.tedHTML('40')} ${GDT.tedHTML('30')}</span></div>`;
      $('.game-stage').innerHTML = `
        <div class="g-grid">
          <div class="g-drawing">
            ${spec}
            <small class="muted">CMM çıktısı</small>
            <div class="g-meas mono cmm">ΔX ${GDT.signed(cur.x, 3)}<br>ΔY ${GDT.signed(cur.y, 3)}</div>
          </div>
          <div class="g-form">
            <div class="g-actions"><button class="btn ok-btn" data-v="1">✓ Kabul</button><button class="btn bad-btn" data-v="0">✗ Ret</button></div>
            <div class="g-plot" hidden><svg class="zplot sm" viewBox="0 0 300 300"></svg></div>
          </div>
        </div>
        <div class="g-result"></div>`;
      el.querySelectorAll('.g-actions button').forEach((b) => { b.onclick = () => answer(b.dataset.v === '1'); });
    }

    function answer(accept) {
      const ok = accept === cur.ok;
      results[round] = ok;
      if (ok) correct++;
      el.querySelectorAll('.g-actions button').forEach((b) => { b.disabled = true; });
      const R = cur.pm ? Math.max(cur.t * 1.8, 0.1) : Math.max(cur.D * 0.85, 0.1);
      $('.g-plot').hidden = false;
      $('.g-plot svg').innerHTML = zonePlot({ R, t: cur.pm ? cur.t : null, D: cur.pm ? null : cur.D, pts: [{ x: cur.x, y: cur.y, cls: cur.ok ? 'ok' : 'bad' }] });
      const why = cur.pm
        ? `|ΔX| = ${N(Math.abs(cur.x))} ve |ΔY| = ${N(Math.abs(cur.y))}; ikisi de ${N(cur.t, 2)} içinde ${cur.ok ? 'kalıyor' : 'kalmıyor'}.`
        : `Konum sapması 2 × √(${N(cur.x)}² + ${N(cur.y)}²) = <b>Ø${N(cur.pos)}</b> ${cur.ok ? '≤' : '>'} Ø${N(cur.D, 2)}.`;
      $('.g-result').innerHTML = `
        <div class="msg ${ok ? 'ok' : 'bad'}"><b>${ok ? 'Doğru.' : 'Yanlış.'}</b> ${why} → <b>${cur.ok ? 'kabul' : 'ret'}</b></div>
        <button class="btn" data-go>${round + 1 < ROUNDS ? 'Sonraki tur →' : 'Sonucu gör'}</button>`;
      $('[data-go]').onclick = () => { round++; next(); };
      header();
    }

    function end() {
      const stars = correct >= 10 ? 3 : correct >= 8 ? 2 : correct >= 6 ? 1 : 0;
      header();
      if (stars) { GDT.giveStars(4, stars, 'Konum muayenesi'); api.done(); }
      GDT.syncStars(el, 4);
      $('.game-stage').innerHTML = `
        <div class="quiz-end ${stars ? 'ok' : ''}">
          <div class="quiz-score mono">${correct}<small>/${ROUNDS}</small></div>
          <p>${'★'.repeat(stars) || 'Yıldız yok'} · ${stars === 3 ? 'Kusursuz muayene!' : 'İpucu: ± için iki eksene ayrı ayrı bak; Ø için merkeze uzaklığın iki katını al.'}</p>
          <button class="btn" data-again>Yeniden oyna</button>
        </div>`;
      $('[data-again]').onclick = () => { round = 0; correct = 0; results.length = 0; next(); };
    }

    GDT.syncStars(el, 4);
    next();
  }

  // ======================================================================
  // SINA
  // ======================================================================
  const QUESTIONS = [
    {
      q: 'Bir deliğin konumu X ve Y’de ±0,1 ile verilmiş. Tolerans bölgesinin şekli nedir?',
      options: ['Ø0,1 daire', 'Ø0,2 daire', '0,2 × 0,2 kare', '0,1 × 0,1 kare'],
      answer: 2,
      explain: 'Her eksen ayrı ayrı ±0,1 olduğu için bölge kenarı 0,2 olan bir karedir.',
    },
    {
      q: 'Kareyi çevreleyen daire, kareden yaklaşık ne kadar daha büyüktür?',
      options: ['%14', '%41', '%57', '%100'],
      answer: 2,
      explain: 'Daire alanı / kare alanı = π/2 ≈ 1,57. Yani yaklaşık %57 daha fazla kabul alanı.',
    },
    {
      q: 'ΔX = 0,12 ve ΔY = 0 ölçülen bir delik için hangisi doğru? (±0,1 kare ve Ø0,28 konum toleransı karşılaştırılıyor)',
      options: ['İkisinde de kabul', '± ile ret, Ø0,28 ile kabul', '± ile kabul, Ø0,28 ile ret', 'İkisinde de ret'],
      answer: 1,
      explain: '±0,1 sınırını X’te aşıyor. Konum sapması 2 × 0,12 = Ø0,24 ≤ Ø0,28 olduğu için konum toleransına göre kabul.',
    },
    {
      q: 'ΔX = 0,06 ve ΔY = 0,08 ise konum sapması (çap olarak) kaçtır?',
      options: ['Ø0,10', 'Ø0,14', 'Ø0,20', 'Ø0,28'],
      answer: 2,
      explain: '√(0,06² + 0,08²) = 0,10; çap olarak iki katı: Ø0,20.',
    },
    {
      q: 'ISO 8015 bağımsızlık ilkesine göre 10 ±0,1 kalınlık toleransı neyi sınırlar?',
      options: ['Kalınlığı ve düzlemselliği', 'Yalnızca yerel kalınlığı; form serbesttir', 'Plakanın tüm zarfını', 'Kalınlığı ve paralelliği'],
      answer: 1,
      explain: 'ISO GPS’te boyut toleransı formu sınırlamaz. Formu sınırlamak için geometrik tolerans veya Ⓔ zarf gerekliliği eklenir.',
    },
    {
      q: '± ölçülendirmede “kenardan 40 mm” ölçüsü hangi soruyu cevapsız bırakır?',
      options: ['Ölçünün birimi', 'Kusurlu kenarın hangi noktasından ölçüleceği', 'Deliğin çapı', 'Malzeme'],
      answer: 1,
      explain: 'Gerçek kenar düz değildir. Datum, kenarın yerine ideal bir başlangıç düzlemi koyarak bu belirsizliği kaldırır.',
    },
    {
      q: 'GD&T’de deliğin ideal yerini veren 40 ve 30 ölçüleri nasıl yazılır?',
      options: ['40 ±0,1 ve 30 ±0,1', 'Parantez içinde (40) ve (30)', 'Çerçeve içinde: teorik tam ölçü', 'Hiç yazılmaz'],
      answer: 2,
      explain: 'Teorik tam ölçüler (TED) çerçeve içinde yazılır, kendi toleransları yoktur; sapmayı konum toleransı sınırlar.',
    },
  ];

  function sina(el, api) {
    el.append(GDT.el(`
      <div class="story card">
        <p class="kicker">Sına</p>
        <p>${QUESTIONS.length} soru. Geçmek için en az ${Math.ceil(QUESTIONS.length * 0.7)} doğru gerekiyor. Her doğru cevap +5 XP.</p>
      </div>`));
    GDT.quiz(el, { id: 'm4.quiz', questions: QUESTIONS, onPass: api.done });
  }

  GDT.registerModule(4, { steps: { sezgi, kavram, oyna, sina } });
})();
