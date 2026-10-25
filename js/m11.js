'use strict';
/* Module 11 — Salgı toleransları (Sezgi: eccentric shaft between centres, Kavram: radial / axial / total / comparison, Oyna: runout bench, Sına) */
(() => {
  const N = GDT.num;
  const rad = (deg) => (deg * Math.PI) / 180;

  // Side view of a shaft between centres with a dial indicator at axial position z (0..1); angle marks rotation
  function latheSVG({ z = 0.5, angle = 0, face = false, ecc = 0, taper = 0 } = {}) {
    const x0 = 90, x1 = 470, yc = 120, r = 46;
    const ix = face ? x1 + 6 : x0 + 20 + z * (x1 - x0 - 40);
    const wob = ecc * 600 * Math.cos(rad(angle)); // exaggerated wobble of the drawn shaft
    const tp = taper * 600;
    return `
      <rect class="fixture" x="20" y="200" width="540" height="14"/>
      <path class="centre" d="M40 200V${yc}l30 0-12-8v16l12-8"/><path class="centre" d="M540 200V${yc}l-30 0 12-8v16l-12-8"/>
      <path class="drw-obj" d="M${x0} ${yc - r + wob}L${x1} ${yc - r - tp + wob}L${x1} ${yc + r + tp + wob}L${x0} ${yc + r + wob}Z"/>
      <line class="drw-cl" x1="40" y1="${yc}" x2="540" y2="${yc}"/>
      <g transform="translate(${x0 - 20} ${yc})"><circle r="16" class="spin"/><line x1="0" y1="0" x2="${14 * Math.cos(rad(angle))}" y2="${-14 * Math.sin(rad(angle))}" class="spin-mark"/></g>
      ${face
        ? `<line class="stylus" x1="${ix}" y1="${yc - 30}" x2="${ix + 50}" y2="${yc - 30}"/><circle class="stylus-tip" cx="${ix}" cy="${yc - 30}" r="3"/><rect class="ind-body" x="${ix + 50}" y="${yc - 42}" width="30" height="24" rx="4"/>`
        : `<line class="stylus" x1="${ix}" y1="${yc - r - 4}" x2="${ix}" y2="${yc - r - 50}"/><circle class="stylus-tip" cx="${ix}" cy="${yc - r - 4}" r="3"/><rect class="ind-body" x="${ix - 15}" y="${yc - r - 76}" width="30" height="26" rx="4"/>`}
      <text class="ax-lbl" x="20" y="232">puntalar arasında: datum A-B ortak ekseni · kusurlar abartılı</text>`;
  }

  // ======================================================================
  // SEZGİ — an eccentric but perfectly round shaft
  // ======================================================================
  function sezgi(el, api) {
    const e = 30; // µm
    const read = (a) => e * Math.cos(rad(a) - 0.7);
    let a = 0, max = -Infinity, min = Infinity, anim = 0, asked = false;
    const seen = new Array(36).fill(false);
    el.innerHTML = `
      <div class="story card">
        <p class="kicker">Durum</p>
        <p>Tornada işlenmiş bir mil, iki ucundaki punta deliklerinden <b>puntalar arasına</b> bağlandı. Bu iki punta deliği ortak datum A-B ekseni oluşturuyor. Komparatör çapa dayalı. Mili elle bir tur döndür ve ibreyi izle.</p>
      </div>
      <div class="card bench">
        <div class="bench-grid">
          <svg class="bench-svg" viewBox="0 0 580 240" role="img" aria-label="Puntalar arasında mil"></svg>
          <div class="dial-box"><div class="dial-wrap"></div><div class="cov"><i></i></div><small class="muted cov-txt"></small></div>
        </div>
        <label class="slider"><span>Mili döndür <output class="mono" data-o></output></span><input type="range" min="0" max="360" step="1" value="0" data-a></label>
        <button class="btn ghost" data-spin>Bir tur döndür ↻</button>
        <div class="cost-info ro-info"></div>
      </div>
      <div class="asks"></div>`;
    const $ = (q) => el.querySelector(q);
    const draw = () => {
      const v = read(a);
      seen[Math.floor((a % 360) / 10)] = true;
      max = Math.max(max, v); min = Math.min(min, v);
      const cov = seen.filter(Boolean).length / 36;
      $('.bench-svg').innerHTML = latheSVG({ angle: a, ecc: e / 1000 });
      $('.dial-wrap').innerHTML = GDT.dialSVG(v, { max, min });
      $('[data-o]').textContent = `${Math.round(a)}°`;
      $('.cov i').style.width = `${cov * 100}%`;
      $('.cov-txt').textContent = `tur %${Math.round(cov * 100)}`;
      $('.ro-info').innerHTML = `<div><small>En büyük</small><b class="mono">${GDT.signed(max / 1000)}</b></div><div><small>En küçük</small><b class="mono">${GDT.signed(min / 1000)}</b></div><div><small>Toplam ibre hareketi</small><b class="mono">${cov > 0.95 ? N((max - min) / 1000) : '…döndür'}</b></div>`;
      if (cov > 0.95 && !asked) { asked = true; ask(); }
    };
    function ask() {
      GDT.ask($('.asks'), {
        q: 'Bu çap kusursuz yuvarlak ama ekseni datum ekseninden 0,03 mm kaçık. Komparatörün toplam hareketi neden 0,06?',
        options: ['Ölçüm hatası', 'Bir tarafta +0,03, karşı tarafta −0,03: toplam 2 × kaçıklık', 'Dairesellik hatası 0,06 olduğu için', 'Komparatör iki kat gösterir'],
        answer: 1,
        explain: 'Döndükçe yüzey komparatöre 0,03 yaklaşır ve 0,03 uzaklaşır. Salgı, yuvarlaklıkla değil, <b>datum eksenine göre</b> dönüşle ilgilidir: kusursuz yuvarlak bir çap bile eksantrikse salgı verir.',
        onDone: () => {
          const take = GDT.el(`
            <div class="takeaway card">
              <p class="kicker">Ana fikir</p>
              <p><b>Salgı = parça datum ekseni etrafında dönerken komparatörün toplam hareketi.</b> Tek bir ölçümde konum (eksantriklik) ve form (yuvarlaklık) birlikte görünür. Atölyede ölçmesi en kolay geometrik toleranstır: puntalar ya da V-bloklar ve bir komparatör yeter.</p>
              <button class="btn" data-next>Kavram adımına geç →</button>
            </div>`);
          $('.asks').append(take);
          take.querySelector('[data-next]').onclick = api.next;
          api.done();
        },
      });
    }
    $('[data-a]').oninput = (ev) => { a = +ev.target.value; draw(); };
    $('[data-spin]').onclick = () => {
      cancelAnimationFrame(anim);
      const t0 = performance.now(), a0 = a;
      const step = (t) => {
        const f = Math.min(1, (t - t0) / (GDT.reducedMotion() ? 1 : 2400));
        a = (a0 + f * 360) % 360.0001;
        for (let k = 0; k <= 36; k++) { const aa = a0 + (f * 360 * k) / 36; seen[Math.floor((aa % 360) / 10)] = true; const v = read(aa); max = Math.max(max, v); min = Math.min(min, v); }
        $('[data-a]').value = Math.round(a);
        draw();
        if (f < 1) anim = requestAnimationFrame(step);
      };
      anim = requestAnimationFrame(step);
    };
    api.onCleanup(() => cancelAnimationFrame(anim));
    draw();
  }

  // ======================================================================
  // KAVRAM
  // ======================================================================
  function kavram(el, api) {
    GDT.carousel(el, [slideRadial, slideAxial, slideTotal, slideCompare], api);
  }

  function traceSVG(fn, { h = 110, scale = 1.4 } = {}) {
    let d = '', mx = -Infinity, mn = Infinity;
    for (let a = 0; a <= 360; a += 4) { const v = fn(a); mx = Math.max(mx, v); mn = Math.min(mn, v); d += `${a ? 'L' : 'M'}${(30 + a * 0.8).toFixed(1)} ${(h / 2 - v * scale).toFixed(1)}`; }
    return {
      svg: `<line class="ax" x1="30" y1="${h / 2}" x2="318" y2="${h / 2}"/>
        <line class="mz-line" x1="30" y1="${h / 2 - mx * scale}" x2="318" y2="${h / 2 - mx * scale}"/><line class="mz-line" x1="30" y1="${h / 2 - mn * scale}" x2="318" y2="${h / 2 - mn * scale}"/>
        <path class="prof-line" d="${d}"/><text class="ax-lbl" x="30" y="${h - 4}">0°</text><text class="ax-lbl" x="318" y="${h - 4}" text-anchor="end">360°</text>`,
      fim: mx - mn,
    };
  }

  function slideRadial(el) {
    let e = 15, a = 8, n = 3;
    el.innerHTML = `
      <div class="slide-grid">
        <div>
          <p class="kicker">1 · Dairesel salgı (radyal)</p>
          <h3>Tek kesitte, bir tur</h3>
          <p>Komparatör bir kesitte sabit durur; parça bir tur döner. Toplam ibre hareketi kaçıklıktan (2e) ve yuvarlaklık hatasından birlikte gelir. Kesit kesit tekrarlanır; her kesit ayrı değerlendirilir.</p>
          <label class="slider"><span>Eksen kaçıklığı e <output class="mono" data-oe></output></span><input type="range" min="0" max="30" step="1" value="15" data-e></label>
          <label class="slider"><span>Lob yüksekliği <output class="mono" data-oa></output></span><input type="range" min="0" max="15" step="1" value="8" data-a></label>
          <label class="slider"><span>Lob sayısı <output class="mono" data-on></output></span><input type="range" min="2" max="6" step="1" value="3" data-n></label>
          <div class="cost-info rad-info"></div>
        </div>
        <svg class="trace-svg" viewBox="0 0 340 120" role="img" aria-label="Komparatör okuması"></svg>
      </div>`;
    const draw = () => {
      el.querySelector('[data-oe]').textContent = `${e} µm`;
      el.querySelector('[data-oa]').textContent = `${a} µm`;
      el.querySelector('[data-on]').textContent = n;
      const tr = traceSVG((d) => e * Math.cos(rad(d)) + a * Math.cos(n * rad(d) + 0.6));
      el.querySelector('.trace-svg').innerHTML = tr.svg;
      el.querySelector('.rad-info').innerHTML = `
        <div><small>2 × kaçıklık</small><b class="mono">${2 * e} µm</b></div>
        <div><small>Yuvarlaklıktan</small><b class="mono">≈ ${2 * a} µm</b></div>
        <div><small>Dairesel salgı</small><b class="mono good">${Math.round(tr.fim)} µm</b></div>`;
    };
    el.addEventListener('input', (ev) => {
      if (ev.target.dataset.e != null) e = +ev.target.value;
      if (ev.target.dataset.a != null) a = +ev.target.value;
      if (ev.target.dataset.n != null) n = +ev.target.value;
      draw();
    });
    draw();
  }

  function slideAxial(el) {
    let w = 2, R = 40;
    el.innerHTML = `
      <div class="slide-grid">
        <div>
          <p class="kicker">2 · Eksenel salgı (alın)</p>
          <h3>Alın yüzeyi yalpalıyor</h3>
          <p>Komparatör alın yüzeyine, eksene paralel dayanır. Yüzey eksene tam dik değilse dönerken ileri-geri yalpalar. Aynı eğiklik, merkezden <b>uzakta</b> daha büyük salgı verir: fren diski ve flanşlarda ölçüm dış çapa yakın yapılır.</p>
          <label class="slider"><span>Alın yüzeyinin eğikliği <output class="mono" data-ow></output></span><input type="range" min="0" max="6" step="0.5" value="2" data-w></label>
          <label class="slider"><span>Ölçüm yarıçapı R <output class="mono" data-or></output></span><input type="range" min="10" max="80" step="1" value="40" data-r></label>
          <div class="lin-result ax-res"></div>
        </div>
        <svg class="axial-svg" viewBox="0 0 300 220" role="img" aria-label="Eksenel salgı"></svg>
      </div>`;
    const draw = () => {
      const fim = 2 * R * Math.tan(rad(w / 60)) * 1000;
      el.querySelector('[data-ow]').textContent = `${N(w, 1)}′`;
      el.querySelector('[data-or]').textContent = `${R} mm`;
      el.querySelector('.ax-res').innerHTML = `<span class="mono big">2 × R × tan θ = ${Math.round(fim)} µm</span>`;
      const tilt = w * 4; // degrees, exaggerated
      el.querySelector('.axial-svg').innerHTML = `
        <line class="drw-cl" x1="20" y1="110" x2="280" y2="110"/>
        <rect class="drw-obj" x="40" y="90" width="120" height="40"/>
        <g transform="rotate(${tilt} 170 110)"><rect class="drw-obj" x="160" y="20" width="24" height="180"/></g>
        <line class="stylus" x1="${190 + Math.sin(rad(tilt)) * (R * 1.1)}" y1="${110 - R * 1.1}" x2="260" y2="${110 - R * 1.1}"/>
        <circle class="stylus-tip" cx="${186 + Math.sin(rad(tilt)) * (R * 1.1)}" cy="${110 - R * 1.1}" r="3"/>
        <text class="ax-lbl" x="20" y="214">eğiklik abartılı</text>`;
    };
    el.querySelector('[data-w]').oninput = (ev) => { w = +ev.target.value; draw(); };
    el.querySelector('[data-r]').oninput = (ev) => { R = +ev.target.value; draw(); };
    draw();
  }

  function slideTotal(el) {
    let e = 5, tp = 20;
    el.innerHTML = `
      <div class="slide-grid">
        <div>
          <p class="kicker">3 · Toplam salgı</p>
          <h3>Komparatör yüzey boyunca da gezer</h3>
          <p>Dairesel salgıda her kesit ayrı değerlendirilir; bir koniklik her kesitte küçük kalabilir. <b>Toplam salgıda</b> parça dönerken komparatör bütün boy boyunca gezer ve tek bir toplam hareket okunur: koniklik, eğrilik ve kaçıklık birlikte yakalanır.</p>
          <label class="slider"><span>Kaçıklık e <output class="mono" data-oe></output></span><input type="range" min="0" max="20" step="1" value="5" data-e></label>
          <label class="slider"><span>Koniklik (boy boyunca yarıçap artışı) <output class="mono" data-ot></output></span><input type="range" min="0" max="40" step="1" value="20" data-t></label>
          <div class="cost-info tot-info"></div>
        </div>
        <svg class="bench-svg" viewBox="0 0 580 240" role="img" aria-label="Toplam salgı"></svg>
      </div>`;
    const draw = () => {
      el.querySelector('[data-oe]').textContent = `${e} µm`;
      el.querySelector('[data-ot]').textContent = `${tp} µm`;
      const circ = 2 * e, total = 2 * e + tp, tol = 25;
      el.querySelector('.tot-info').innerHTML = `
        <div><small>Her kesitte dairesel salgı</small><b class="mono ${circ <= tol ? 'good' : 'badc'}">${circ} µm</b></div>
        <div><small>Toplam salgı</small><b class="mono ${total <= tol ? 'good' : 'badc'}">${total} µm</b></div>
        <div><small>Tolerans 0,025 ile</small><b>${circ <= tol && total > tol ? 'Dairesel geçer, toplam kalır' : total <= tol ? 'İkisi de geçer' : 'İkisi de kalır'}</b></div>`;
      el.querySelector('.bench-svg').innerHTML = latheSVG({ z: 0.5, angle: 30, ecc: e / 1000, taper: tp / 1000 });
    };
    el.querySelector('[data-e]').oninput = (ev) => { e = +ev.target.value; draw(); };
    el.querySelector('[data-t]').oninput = (ev) => { tp = +ev.target.value; draw(); };
    draw();
  }

  function slideCompare(el) {
    const CASES = [
      { k: 'ecc', name: 'Yuvarlak ama kaçık', circ: false, coax: true, run: true, note: 'Dairesellik ölçüm cihazı kusur görmez; salgı ve eş eksenlilik görür.' },
      { k: 'oval', name: 'Ekseni doğru ama oval', circ: true, coax: false, run: true, note: 'Eş eksenlilik ekseni kontrol eder; ovallik ekseni kaydırmaz. Salgı ise yüzeye bakar ve görür.' },
      { k: 'both', name: 'Hem kaçık hem oval', circ: true, coax: true, run: true, note: 'Salgı ikisini birlikte okur; hangisinden geldiğini ayırmaz.' },
    ];
    let k = 'ecc';
    el.innerHTML = `
      <p class="kicker">4 · Kim neyi görür?</p>
      <h3>Salgı, eş eksenlilik ve dairesellik</h3>
      <div class="seg wrap" data-c>${CASES.map((c) => `<button data-v="${c.k}">${c.name}</button>`).join('')}</div>
      <div class="slide-grid">
        <div class="table-wrap"><table class="iso-table cmp-table see-table"></table></div>
        <svg class="see-svg" viewBox="0 0 220 220" role="img" aria-label="Kesit"></svg>
      </div>
      <p class="callout see-note"></p>
      <p class="muted small">Salgı yüzey üzerinden ölçüldüğü için hızlı ve ucuzdur; atölyede eş eksenlilik yerine sık tercih edilir. Ama yalnızca dönel elemanlarda ve bir datum eksenine göre kullanılır.</p>`;
    const draw = () => {
      const c = CASES.find((x) => x.k === k);
      el.querySelectorAll('[data-c] button').forEach((b) => b.classList.toggle('on', b.dataset.v === k));
      const row = (sym, name, v) => `<tr><th>${GDT.sym(sym, 18)} ${name}</th><td class="${v ? 'badc' : 'good'}">${v ? 'Kusuru görür' : 'Kusur görmez'}</td></tr>`;
      el.querySelector('.see-table').innerHTML = `<tbody>${row('circularity', 'Dairesellik', c.circ)}${row('coaxiality', 'Eş eksenlilik', c.coax)}${row('circularRunout', 'Dairesel salgı', c.run)}</tbody>`;
      const ex = c.k === 'oval' ? 0 : 18, ov = c.k === 'ecc' ? 0 : 14;
      el.querySelector('.see-svg').innerHTML = `
        <path class="drw-cl" d="M10 110h200M110 10v200"/>
        <ellipse class="drw-obj" cx="${110 + ex}" cy="110" rx="${70 + ov}" ry="${70 - ov}"/>
        <circle class="mz-ring" cx="110" cy="110" r="3"/><circle class="contact" cx="${110 + ex}" cy="110" r="4"/>
        <text class="ax-lbl" x="10" y="214">artı: datum ekseni · nokta: kesitin merkezi · abartılı</text>`;
      el.querySelector('.see-note').textContent = c.note;
    };
    el.querySelector('[data-c]').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) { k = b.dataset.v; draw(); } });
    draw();
  }

  // ======================================================================
  // OYNA — runout bench
  // ======================================================================
  const ROUNDS = 5;
  const STARS = ['En az 3 doğru karar', 'En az 4 doğru karar', '5 kararın hepsi doğru'];
  const KINDS = {
    circ: { sym: 'circularRunout', name: 'Dairesel salgı (radyal)' },
    total: { sym: 'totalRunout', name: 'Toplam salgı' },
    face: { sym: 'circularRunout', name: 'Eksenel salgı (alın)' },
  };
  function genRound(i) {
    const kind = ['circ', 'total', 'face', 'total', 'circ'][i];
    const tol = GDT.pick([20, 30, 40, 50]);
    const want = Math.random() < 0.5; // half the rounds pass, so guessing does not pay
    for (;;) {
      const e = Math.random() * tol * 0.6, a = Math.random() * tol * 0.25, n = GDT.pick([2, 3, 4]), tp = kind === 'total' ? Math.random() * tol * 0.8 : 0, ph = Math.random() * 6;
      // reading in µm at angle a (deg) and axial position z (0..1)
      const read = (deg, z) => kind === 'face'
        ? e * 1.6 * Math.cos(rad(deg) + ph) + a * Math.cos(n * rad(deg))
        : e * Math.cos(rad(deg) + ph) + a * Math.cos(n * rad(deg) + ph) + tp * z;
      let fim;
      if (kind === 'total') {
        let mx = -Infinity, mn = Infinity;
        for (let z = 0; z <= 1.0001; z += 0.05) for (let d = 0; d < 360; d += 3) { const v = read(d, z); mx = Math.max(mx, v); mn = Math.min(mn, v); }
        fim = mx - mn;
      } else {
        let mx = -Infinity, mn = Infinity;
        for (let d = 0; d < 360; d += 3) { const v = read(d, 0.5); mx = Math.max(mx, v); mn = Math.min(mn, v); }
        fim = mx - mn;
      }
      if (Math.abs(fim - tol) > tol * 0.15 && (fim <= tol) === want) return { kind, tol, read, fim, e };
    }
  }

  function oyna(el, api) {
    let round = 0, correct = 0, cur = null, a = 0, z = 0.5, max = -Infinity, min = Infinity, seen = null, anim = 0;
    const results = [];
    el.innerHTML = `
      <div class="card brief">
        <div>
          <p class="kicker">Salgı tezgâhı</p>
          <h3>Döndür, oku, karar ver</h3>
          <p>Parça puntalar arasında, datum A-B ortak ekseninde dönüyor. <b>Dairesel</b> ve <b>eksenel</b> salgıda bir tur yeter. <b>Toplam salgıda</b> döndürürken komparatörü bütün boy boyunca da gezdirmen gerekir. Taramayı bitirmeden karar veremezsin.</p>
        </div>
        ${GDT.starsHTML(STARS)}
      </div>
      <div class="card game">
        <div class="game-top"><span class="mono g-round"></span><div class="g-progress"></div></div>
        <div class="game-stage"></div>
      </div>`;
    const $ = (q) => el.querySelector(q);
    function header() {
      $('.g-round').textContent = round < ROUNDS ? `Tur ${round + 1} / ${ROUNDS}` : 'Bitti';
      $('.g-progress').innerHTML = Array.from({ length: ROUNDS }, (_, i) => `<i class="${results[i] === true ? 'ok' : results[i] === false ? 'bad' : i === round ? 'now' : ''}"></i>`).join('');
    }
    const zb = () => (cur.kind === 'total' ? Math.min(4, Math.floor(z * 5)) : 0);
    function sample(deg) {
      const v = cur.read(deg, cur.kind === 'total' ? z : 0.5);
      seen[zb()][Math.floor(((deg % 360) + 360) % 360 / 30)] = true;
      max = Math.max(max, v); min = Math.min(min, v);
      return v;
    }
    const coverage = () => {
      const rows = cur.kind === 'total' ? seen : [seen[0]];
      return rows.flat().filter(Boolean).length / (rows.length * 12);
    };
    function draw(v) {
      $('.bench-svg').innerHTML = latheSVG({ z, angle: a, face: cur.kind === 'face', ecc: cur.e / 1000 });
      $('.dial-wrap').innerHTML = GDT.dialSVG(v, { max, min });
      const cov = coverage();
      $('.cov i').style.width = `${cov * 100}%`;
      $('.cov-txt').textContent = `tarama %${Math.round(cov * 100)}`;
      $('.fim').textContent = Number.isFinite(max) ? N((max - min) / 1000) : '—';
      el.querySelectorAll('.g-actions button').forEach((b) => { b.disabled = cov < 0.95; });
    }
    function next() {
      if (round >= ROUNDS) return end();
      cur = genRound(round);
      a = 0; z = 0.5; max = -Infinity; min = Infinity;
      seen = Array.from({ length: 5 }, () => new Array(12).fill(false));
      header();
      const k = KINDS[cur.kind];
      $('.game-stage').innerHTML = `
        <div class="lab-head">${GDT.fcfHTML({ sym: k.sym, value: cur.tol / 1000, datums: ['A-B'] })}<span>${k.name}</span><span>İbre hareketi: <b class="mono fim">—</b></span></div>
        <div class="bench-grid">
          <svg class="bench-svg" viewBox="0 0 580 240" role="img" aria-label="Salgı tezgâhı"></svg>
          <div class="dial-box"><div class="dial-wrap"></div><div class="cov"><i></i></div><small class="muted cov-txt"></small></div>
        </div>
        <label class="slider"><span>Mili döndür</span><input type="range" min="0" max="360" step="1" value="0" data-a></label>
        ${cur.kind === 'total' ? '<label class="slider"><span>Komparatörü boy boyunca kaydır</span><input type="range" min="0" max="1" step="0.01" value="0.5" data-z></label>' : ''}
        <button class="btn ghost" data-spin>Bir tur döndür ↻</button>
        <div class="g-actions"><button class="btn ok-btn" data-v="1">✓ Kabul</button><button class="btn bad-btn" data-v="0">✗ Ret</button></div>
        <div class="g-result"></div>`;
      $('[data-a]').oninput = (ev) => { a = +ev.target.value; draw(sample(a)); };
      if ($('[data-z]')) $('[data-z]').oninput = (ev) => { z = +ev.target.value; draw(sample(a)); };
      $('[data-spin]').onclick = () => {
        cancelAnimationFrame(anim);
        const t0 = performance.now(), a0 = a;
        const step = (t) => {
          const f = Math.min(1, (t - t0) / (GDT.reducedMotion() ? 1 : 1800));
          for (let i = 0; i <= 36; i++) sample(a0 + (f * 360 * i) / 36);
          a = (a0 + f * 360) % 360;
          $('[data-a]').value = Math.round(a);
          draw(sample(a));
          if (f < 1) anim = requestAnimationFrame(step);
        };
        anim = requestAnimationFrame(step);
      };
      el.querySelectorAll('.g-actions button').forEach((b) => { b.onclick = () => answer(b.dataset.v === '1'); });
      draw(sample(0));
    }
    function answer(accept) {
      cancelAnimationFrame(anim);
      const truth = cur.fim <= cur.tol, ok = accept === truth;
      results[round] = ok;
      if (ok) correct++;
      el.querySelectorAll('.g-actions button, [data-a], [data-z], [data-spin]').forEach((b) => { b.disabled = true; });
      $('.g-result').innerHTML = `
        <div class="msg ${ok ? 'ok' : 'bad'}"><b>${ok ? 'Doğru.' : 'Yanlış.'}</b> ${cur.kind === 'total' ? 'Bütün yüzeyde' : 'Tam turda'} ibre hareketi <b>${N(cur.fim / 1000)}</b>, tolerans ${N(cur.tol / 1000, 2)} → <b>${truth ? 'kabul' : 'ret'}</b>.</div>
        <button class="btn" data-go>${round + 1 < ROUNDS ? 'Sonraki tur →' : 'Sonucu gör'}</button>`;
      $('[data-go]').onclick = () => { round++; next(); };
      header();
    }
    function end() {
      const stars = correct >= 5 ? 3 : correct >= 4 ? 2 : correct >= 3 ? 1 : 0;
      header();
      if (stars) { GDT.giveStars(11, stars, 'Salgı tezgâhı'); api.done(); }
      GDT.syncStars(el, 11);
      $('.game-stage').innerHTML = `
        <div class="quiz-end ${stars ? 'ok' : ''}">
          <div class="quiz-score mono">${correct}<small>/${ROUNDS}</small></div>
          <p>${'★'.repeat(stars) || 'Yıldız yok'} · Bölüm C tamam: 14 karakteristiğin hepsini gördün.</p>
          <button class="btn" data-again>Yeniden oyna</button>
        </div>`;
      $('[data-again]').onclick = () => { round = 0; correct = 0; results.length = 0; next(); };
    }
    api.onCleanup(() => cancelAnimationFrame(anim));
    GDT.syncStars(el, 11);
    next();
  }

  // ======================================================================
  // SINA
  // ======================================================================
  const QUESTIONS = [
    {
      q: 'Kusursuz yuvarlak bir çapın ekseni datum ekseninden 0,02 kaçık. Dairesel salgı nedir?',
      options: ['0', '0,01', '0,02', '0,04'],
      answer: 3,
      explain: 'Döndükçe yüzey 0,02 yaklaşır, 0,02 uzaklaşır: toplam 2 × 0,02 = 0,04.',
    },
    {
      q: 'Dairesel salgı ile toplam salgı arasındaki fark nedir?',
      options: ['Fark yoktur', 'Dairesel salgı her kesiti ayrı değerlendirir; toplam salgıda komparatör bütün yüzey boyunca gezer ve tek bir değer okunur', 'Toplam salgı yalnızca alın yüzeyleri içindir', 'Dairesel salgı datum almaz'],
      answer: 1,
      explain: 'Toplam salgı koniklik ve eğrilik gibi kesitler arası kusurları da yakalar.',
    },
    {
      q: 'Bir milin her kesitinde dairesel salgı 0,01, ama mil 0,03 konik. Toplam salgı toleransı 0,02 ise?',
      options: ['Kabul', 'Ret: koniklik toplam salgıya eklenir', 'Ret: dairesel salgı da kalır', 'Karar verilemez'],
      answer: 1,
      explain: 'Komparatör boy boyunca gezerken yarıçap 0,03 değişir; toplam hareket 0,02’yi aşar.',
    },
    {
      q: 'Alın yüzeyinde aynı eğiklik için eksenel salgı nerede daha büyük okunur?',
      options: ['Merkeze yakın', 'Dış çapa yakın', 'Her yerde aynı', 'Okunamaz'],
      answer: 1,
      explain: 'Okuma ≈ 2 × R × tan θ; yarıçap büyüdükçe artar.',
    },
    {
      q: 'Salgı toleransı neden her zaman bir datum gerektirir?',
      options: ['Standart öyle istediği için, mantığı yok', 'Ölçüm, parçanın bir datum ekseni etrafında döndürülmesiyle tanımlıdır', 'Datum yalnızca toplam salgıda gerekir', 'Gerektirmez'],
      answer: 1,
      explain: 'Salgı tanımı gereği bir dönme ekseni ister: puntalar, V-bloklar ya da bir mandrel bu ekseni temsil eder.',
    },
    {
      q: 'Ekseni doğru ama oval bir kesit için hangisi kusuru görmez?',
      options: ['Dairesellik', 'Dairesel salgı', 'Eş eksenlilik', 'Hepsi görür'],
      answer: 2,
      explain: 'Eş eksenlilik yalnızca ekseni kontrol eder; ovallik ekseni kaydırmaz.',
    },
    {
      q: 'Puntalar arasında ölçülen bir mil için çerçevede datum nasıl yazılır?',
      options: ['A', 'A | B', 'A-B', 'Datum yazılmaz'],
      answer: 2,
      explain: 'İki punta deliğinin oluşturduğu ortak eksen tek bir ortak datumdur: A-B.',
    },
  ];

  function sina(el, api) {
    el.append(GDT.el(`
      <div class="story card">
        <p class="kicker">Sına</p>
        <p>${QUESTIONS.length} soru. Geçmek için en az ${Math.ceil(QUESTIONS.length * 0.7)} doğru gerekiyor. Her doğru cevap +5 XP.</p>
      </div>`));
    GDT.quiz(el, { id: 'm11.quiz', questions: QUESTIONS, onPass: api.done });
  }

  GDT.registerModule(11, { steps: { sezgi, kavram, oyna, sina } });
})();
