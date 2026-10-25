'use strict';
/* Module 10 — Profil toleransları (Sezgi: mould contour band, Kavram: line vs surface / datum vs none / UZ / colour map, Oyna: profile inspection, Sına) */
(() => {
  const N = GDT.num;
  const EX = 220; // px per mm for deviations

  // Nominal contour (px): a mould-like curve; deviations are drawn along the outward normal
  const curve = (s) => ({ x: 40 + 500 * s, y: 175 - 110 * Math.sin(Math.PI * s) * (0.75 + 0.35 * s) });
  function normal(s) {
    const a = curve(Math.max(0, s - 0.002)), b = curve(Math.min(1, s + 0.002));
    const dx = b.x - a.x, dy = b.y - a.y, l = Math.hypot(dx, dy);
    return { x: dy / l, y: -dx / l }; // pointing up/out of the material (material is below the curve)
  }
  const offsetPath = (off, steps = 80) => {
    let d = '';
    for (let i = 0; i <= steps; i++) {
      const s = i / steps, p = curve(s), n = normal(s);
      d += `${i ? 'L' : 'M'}${(p.x + n.x * off * EX).toFixed(1)} ${(p.y + n.y * off * EX).toFixed(1)}`;
    }
    return d;
  };
  // devs: [{s, d}] in mm, positive = outside the material; band [lo, hi] in mm
  function contourSVG(devs, lo, hi, { showMat = true } = {}) {
    let band = offsetPath(hi);
    for (let i = 80; i >= 0; i--) { const s = i / 80, p = curve(s), n = normal(s); band += `L${(p.x + n.x * lo * EX).toFixed(1)} ${(p.y + n.y * lo * EX).toFixed(1)}`; }
    return `
      ${showMat ? `<path class="drw-obj" d="${offsetPath(0)}L540 230L40 230Z"/>` : ''}
      <path class="pf-band" d="${band}Z"/>
      <path class="pf-nom" d="${offsetPath(0)}"/>
      ${devs.map((v) => {
        const p = curve(v.s), n = normal(v.s), ok = v.d >= lo - 1e-9 && v.d <= hi + 1e-9;
        return `<line class="pf-dev" x1="${p.x}" y1="${p.y}" x2="${p.x + n.x * v.d * EX}" y2="${p.y + n.y * v.d * EX}"/><circle class="zp-pt ${ok ? 'ok' : 'bad'}" cx="${p.x + n.x * v.d * EX}" cy="${p.y + n.y * v.d * EX}" r="4"/>`;
      }).join('')}
      <text class="ax-lbl" x="40" y="246">ideal profil (kesikli) · bant ve sapmalar abartılı · + malzeme dışına</text>`;
  }

  // ======================================================================
  // SEZGİ
  // ======================================================================
  function sezgi(el, api) {
    const devs = Array.from({ length: 24 }, (_, i) => { const s = (i + 0.5) / 24; return { s, d: Math.round((0.13 + 0.07 * Math.sin(s * 9 + 0.6)) * 1000) / 1000 }; });
    const mx = Math.max(...devs.map((v) => v.d)), mn = Math.min(...devs.map((v) => v.d));
    let t = 0.2, asked = false;
    el.innerHTML = `
      <div class="story card">
        <p class="kicker">Durum</p>
        <p>Bir EPS kalıbının kavite yüzeyi frezelendi ve 3B tarayıcıyla CAD modeline göre karşılaştırıldı. Bu eğriyi radyüsler ve merkezlerle ± ölçülendirmek imkânsıza yakın. Bunun yerine tek bir istek var: <b>yüzey profili</b>. İdeal profilin iki yanında eşit bir bant.</p>
      </div>
      <div class="card">
        <svg class="pf-svg" viewBox="0 0 580 250" role="img" aria-label="Kalıp profili ve bant"></svg>
        <label class="slider"><span>Profil toleransı t (bant ±t/2) <output class="mono" data-o></output></span><input type="range" min="0.05" max="0.5" step="0.01" value="0.2" data-t></label>
        <div class="cost-info pf-info"></div>
        <p class="hint">Bütün noktalar bantta kalana kadar toleransı büyüt.</p>
      </div>
      <div class="asks"></div>`;
    const $ = (q) => el.querySelector(q);
    const draw = () => {
      const out = devs.filter((v) => Math.abs(v.d) > t / 2 + 1e-9).length;
      $('.pf-svg').innerHTML = contourSVG(devs, -t / 2, t / 2);
      $('[data-o]').textContent = N(t, 2);
      $('.pf-info').innerHTML = `
        <div><small>Sapmalar</small><b class="mono">+${N(mn)} … +${N(mx)}</b></div>
        <div><small>Bant</small><b class="mono">±${N(t / 2)}</b></div>
        <div><small>Bant dışı nokta</small><b class="mono ${out ? 'badc' : 'good'}">${out}</b></div>`;
      if (!out && !asked) { asked = true; ask(); }
    };
    function ask() {
      GDT.ask($('.asks'), {
        q: `Bütün sapmalar +${N(mn)} ile +${N(mx)} arasında, yani hep malzeme dışına doğru. Simetrik bir bant için en küçük profil toleransı nedir?`,
        options: [N(mx - mn, 2), N(mx, 2), N(2 * mx, 2), N(mn, 2)],
        answer: 2,
        explain: `Simetrik bant ideal profilin iki yanına eşit uzanır: en uzak nokta +${N(mx)} olduğu için t/2 ≥ ${N(mx)}, yani t = ${N(2 * mx, 2)}. Bandın yarısı boşa gidiyor. ISO 1101:2017’deki <b>UZ</b> değiştiricisiyle bant kaydırılırsa ${N(mx - mn, 2)} yeterdi; Kavram adımında göreceğiz.`,
        onDone: () => {
          const take = GDT.el(`
            <div class="takeaway card">
              <p class="kicker">Ana fikir</p>
              <p><b>Profil toleransı, herhangi bir şekli tek bir istekle kontrol eder:</b> ideal profil (CAD modeli ya da teorik tam ölçülerle tanımlı eğri) ve onun etrafında t genişliğinde bir bant. Kalıp, döküm ve plastik parçaların serbest yüzeyleri için en doğal dil budur.</p>
              <button class="btn" data-next>Kavram adımına geç →</button>
            </div>`);
          $('.asks').append(take);
          take.querySelector('[data-next]').onclick = api.next;
          api.done();
        },
      });
    }
    $('[data-t]').oninput = (e) => { t = +e.target.value; draw(); };
    draw();
  }

  // ======================================================================
  // KAVRAM
  // ======================================================================
  function kavram(el, api) {
    GDT.carousel(el, [slideLineSurface, slideDatum, slideUZ, slideColorMap], api);
  }

  function slideLineSurface(el) {
    let mode = 'line', sec = 0.5;
    el.innerHTML = `
      <div class="slide-grid">
        <div>
          <p class="kicker">1 · Çizgi profili ve yüzey profili</p>
          <h3>Kesit kesit mi, bütün yüzey mi?</h3>
          <p><b>${GDT.sym('lineProfile', 18)} Çizgi profili</b> her kesiti ayrı değerlendirir: kesitteki eğri, iki eğri arasındaki bantta kalmalı. <b>${GDT.sym('surfaceProfile', 18)} Yüzey profili</b> bütün yüzeyi tek bir kabuk içinde ister. Kalıp yüzeylerinde çoğunlukla yüzey profili kullanılır.</p>
          <div class="seg" data-m><button data-v="line">Çizgi profili</button><button data-v="surf">Yüzey profili</button></div>
          <label class="slider sec-sl"><span>Kesit konumu</span><input type="range" min="0.05" max="0.95" step="0.01" value="0.5" data-s></label>
        </div>
        <svg class="ls-svg" viewBox="0 0 340 240" role="img" aria-label="Çizgi ve yüzey profili"></svg>
      </div>`;
    const svg = el.querySelector('.ls-svg');
    const draw = () => {
      el.querySelectorAll('[data-m] button').forEach((b) => b.classList.toggle('on', b.dataset.v === mode));
      el.querySelector('.sec-sl').hidden = mode !== 'line';
      // a curved surface drawn as an oblique extrusion of the profile
      const P = (s, depth) => { const c = curve(s); return [30 + (c.x - 40) * 0.5 + depth * 80, 60 + (c.y - 40) * 0.6 - depth * 50]; };
      let front = '', back = '', ribs = '';
      for (let i = 0; i <= 40; i++) { const s = i / 40; front += `${i ? 'L' : 'M'}${P(s, 0).join(' ')}`; back += `${i ? 'L' : 'M'}${P(s, 1).join(' ')}`; }
      for (let j = 0; j <= 8; j++) { const s = j / 8; ribs += `M${P(s, 0).join(' ')}L${P(s, 1).join(' ')}`; }
      let sel = '';
      if (mode === 'line') {
        let d = '';
        for (let i = 0; i <= 40; i++) d += `${i ? 'L' : 'M'}${P(i / 40, sec).join(' ')}`;
        sel = `<path class="pf-sec" d="${d}"/><text class="ax-lbl strong" x="${P(1, sec)[0] + 6}" y="${P(1, sec)[1]}">bu kesit</text>`;
      } else {
        sel = `<path class="pf-shell" d="${front}L${P(1, 1).join(' ')}${back.replace('M', 'L').split('L').reverse().filter(Boolean).map((q) => `L${q}`).join('')}Z"/>`;
      }
      svg.innerHTML = `<path class="pf-nom solid" d="${front}"/><path class="pf-nom solid" d="${back}"/><path class="pf-rib" d="${ribs}"/>${sel}`;
    };
    el.querySelector('[data-m]').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) { mode = b.dataset.v; draw(); } });
    el.querySelector('[data-s]').oninput = (e) => { sec = +e.target.value; draw(); };
    draw();
  }

  function slideDatum(el) {
    let mode = 'datum';
    const shift = 0.09;
    const devs = Array.from({ length: 20 }, (_, i) => { const s = (i + 0.5) / 20; return { s, d: Math.round((shift + 0.04 * Math.sin(s * 11)) * 1000) / 1000 }; });
    const t = 0.12, mx = Math.max(...devs.map((v) => v.d)), mn = Math.min(...devs.map((v) => v.d));
    el.innerHTML = `
      <p class="kicker">2 · Datumlu ve datumsuz profil</p>
      <h3>Şekil mi, şekil + yer mi?</h3>
      <p>Datumsuz profil yalnızca <b>şekli</b> kontrol eder: bant, profile en iyi oturacak şekilde kayabilir ve dönebilir. Datumlu profil ise bandı datumlara göre sabitler: şekil, yönelim ve konum birlikte kontrol edilir.</p>
      <div class="seg" data-m><button data-v="datum">${GDT.sym('surfaceProfile', 16)} 0,12 | A | B</button><button data-v="free">${GDT.sym('surfaceProfile', 16)} 0,12 (datumsuz)</button></div>
      <svg class="pf-svg" viewBox="0 0 580 250" role="img" aria-label="Datumlu ve datumsuz profil"></svg>
      <p class="callout pfd-note"></p>`;
    const draw = () => {
      el.querySelectorAll('[data-m] button').forEach((b) => b.classList.toggle('on', b.dataset.v === mode));
      const c = mode === 'free' ? (mx + mn) / 2 : 0;
      el.querySelector('.pf-svg').innerHTML = contourSVG(devs, c - t / 2, c + t / 2);
      const bad = devs.filter((v) => v.d < c - t / 2 - 1e-9 || v.d > c + t / 2 + 1e-9).length;
      el.querySelector('.pfd-note').innerHTML = mode === 'datum'
        ? `Profil kendi içinde düzgün, ama bütün yüzey A ve B’ye göre <b>+${N(shift, 2)}</b> kaymış: <b>${bad} nokta bant dışı</b>. Kalıp yüzeyi bağlama yüzeylerine göre yanlış yerde.`
        : `Bant profile en iyi şekilde oturtuldu (+${N(c)} kaydırıldı): şekil hatası yalnızca <b>${N(mx - mn)}</b>, ${bad ? `${bad} nokta dışarıda` : '<b>hepsi bantta</b>'}. Yer kontrol edilmiyor.`;
    };
    el.querySelector('[data-m]').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) { mode = b.dataset.v; draw(); } });
    draw();
  }

  function slideUZ(el) {
    let uz = 0.06;
    const t = 0.14;
    const devs = Array.from({ length: 24 }, (_, i) => { const s = (i + 0.5) / 24; return { s, d: Math.round((0.13 + 0.07 * Math.sin(s * 9 + 0.6)) * 1000) / 1000 }; });
    el.innerHTML = `
      <p class="kicker">3 · UZ: kaydırılmış bant</p>
      <h3>Bandı malzeme dışına ya da içine kaydır</h3>
      <p>ISO 1101:2017 ile gelen <b>UZ</b> değiştiricisi bandın merkezini ideal profilden belirtilen miktar kadar kaydırır. Pozitif değer malzeme dışına, negatif değer içine doğrudur. Kalıpta, sonradan parlatılacak yüzeylere bilerek talaş payı bırakmak için idealdir. Sezgi adımındaki yüzey burada <b>0,14</b> ile kabul edilebilir mi?</p>
      <div class="ex-frame uz-frame"></div>
      <label class="slider"><span>UZ kaydırması <output class="mono" data-o></output></span><input type="range" min="-0.1" max="0.2" step="0.01" value="0.06" data-u></label>
      <svg class="pf-svg" viewBox="0 0 580 250" role="img" aria-label="UZ ile kaydırılmış bant"></svg>
      <p class="callout uz-note"></p>`;
    const draw = () => {
      el.querySelector('[data-o]').textContent = GDT.signed(uz, 2);
      el.querySelector('.uz-frame').innerHTML = GDT.fcfHTML({ sym: 'surfaceProfile', value: t, mods: [`UZ${GDT.signed(uz, 2)}`], datums: ['A', 'B'] }, 'big');
      el.querySelector('.pf-svg').innerHTML = contourSVG(devs, uz - t / 2, uz + t / 2);
      const bad = devs.filter((v) => v.d < uz - t / 2 - 1e-9 || v.d > uz + t / 2 + 1e-9).length;
      el.querySelector('.uz-note').innerHTML = bad
        ? `<b>${bad} nokta bant dışı.</b> Bant ${N(uz - t / 2, 2)} ile ${N(uz + t / 2, 2)} arasında. Kaydırmayı ayarla.`
        : `<b>Hepsi bantta.</b> Bant ${N(uz - t / 2, 2)} … ${N(uz + t / 2, 2)}: simetrik bantla 0,40 gerekirken UZ ile 0,14 yetiyor.`;
    };
    el.querySelector('[data-u]').oninput = (e) => { uz = +e.target.value; draw(); };
    draw();
  }

  function slideColorMap(el) {
    let t = 0.3;
    const W = 16, H = 9;
    const vals = [];
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
      vals.push(0.06 * Math.sin(i / 2.3) + 0.08 * Math.cos(j / 1.7 + i / 6) + (i > 11 && j < 3 ? 0.14 : 0) - (i < 3 && j > 5 ? 0.12 : 0));
    }
    el.innerHTML = `
      <p class="kicker">4 · Renk haritası</p>
      <h3>Kalıp yüzeyini 3B taramayla karşılaştırmak</h3>
      <p>Serbest yüzeylerde ölçüm çoğu zaman 3B tarama ya da CMM ile yapılır; sonuç, CAD modeline göre <b>renkli sapma haritasıdır</b>. Yüzey profili toleransı bu haritadaki bütün değerlerin ±t/2 içinde olmasını ister.</p>
      <label class="slider"><span>Yüzey profili toleransı t <output class="mono" data-o></output></span><input type="range" min="0.1" max="0.6" step="0.02" value="0.3" data-t></label>
      <div class="cmap"></div>
      <div class="cmap-legend"><span>−</span><i></i><span>+</span><small class="muted cmap-sum"></small></div>`;
    const col = (v) => {
      const k = GDT.clamp(v / 0.25, -1, 1);
      return k >= 0 ? `hsl(${120 - 120 * k}, 70%, ${55 - 8 * k}%)` : `hsl(${120 - 100 * k}, 65%, ${55 + 6 * k}%)`;
    };
    const draw = () => {
      el.querySelector('[data-o]').textContent = N(t, 2);
      const bad = vals.filter((v) => Math.abs(v) > t / 2).length;
      el.querySelector('.cmap').innerHTML = vals.map((v) => `<i style="background:${col(v)}" class="${Math.abs(v) > t / 2 ? 'out' : ''}" title="${GDT.signed(v)}"></i>`).join('');
      el.querySelector('.cmap-sum').innerHTML = `${bad ? `<b class="badc">${bad} bölge tolerans dışı</b> (çerçeveli)` : '<b class="good">bütün yüzey bantta</b>'}`;
    };
    el.querySelector('[data-t]').oninput = (e) => { t = +e.target.value; draw(); };
    draw();
  }

  // ======================================================================
  // OYNA — profile inspection
  // ======================================================================
  const ROUNDS = 5;
  const STARS = ['En az 3 doğru karar', 'En az 4 doğru karar', '5 kararın hepsi doğru'];
  function genRound(i) {
    const kind = ['datum', 'free', 'uz', 'free', 'datum'][i];
    const t = GDT.pick([0.1, 0.15, 0.2, 0.3]);
    const uz = kind === 'uz' ? GDT.pick([0.05, -0.05, 0.08]) : 0;
    const want = Math.random() < 0.5; // half the rounds pass, so guessing does not pay
    for (;;) {
      const shift = kind === 'free' ? (Math.random() - 0.5) * 0.3 : uz + (Math.random() - 0.5) * t * 0.6;
      const amp = t * (0.25 + Math.random() * 0.4), f = 6 + Math.random() * 8, ph = Math.random() * 6;
      const devs = Array.from({ length: 22 }, (_, k) => { const s = (k + 0.5) / 22; return { s, d: Math.round((shift + amp * Math.sin(s * f + ph)) * 1000) / 1000 }; });
      const mx = Math.max(...devs.map((v) => v.d)), mn = Math.min(...devs.map((v) => v.d));
      // distance of the decision from its boundary, so no round is a coin toss
      const margin = kind === 'free' ? t - (mx - mn) : Math.min(uz + t / 2 - mx, mn - (uz - t / 2));
      if (Math.abs(margin) > t * 0.12 && (margin >= 0) === want) return { kind, t, uz, devs, mx, mn, ok: margin >= 0 };
    }
  }

  function oyna(el, api) {
    let round = 0, correct = 0, cur = null, off = 0;
    const results = [];
    el.innerHTML = `
      <div class="card brief">
        <div>
          <p class="kicker">Profil muayenesi</p>
          <h3>Tarama sonucunu çerçeveye göre değerlendir</h3>
          <p>Her turda bir kalıp kesitinin tarama sapmaları ve bir profil çerçevesi var. Çerçeve <b>datumluysa</b> bant yerinde sabittir. <b>Datumsuzsa</b> bandı kaydırarak profile en iyi oturtmayı deneyebilirsin. <b>UZ</b> varsa bant o kadar kaymış başlar.</p>
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
    function draw() {
      const c = cur.kind === 'free' ? off : cur.uz;
      $('.pf-svg').innerHTML = contourSVG(cur.devs, c - cur.t / 2, c + cur.t / 2);
    }
    function next() {
      if (round >= ROUNDS) return end();
      cur = genRound(round);
      off = 0;
      header();
      const mods = cur.kind === 'uz' ? [`UZ${GDT.signed(cur.uz, 2)}`] : [];
      $('.game-stage').innerHTML = `
        <div class="lab-head">${GDT.fcfHTML({ sym: 'surfaceProfile', value: cur.t, mods, datums: cur.kind === 'free' ? [] : ['A', 'B'] })}
          <span class="muted small">${cur.kind === 'free' ? 'Datumsuz: bandı kaydırabilirsin' : cur.kind === 'uz' ? 'Bant UZ kadar kaymış, yerinde sabit' : 'Datumlu: bant yerinde sabit'}</span></div>
        <svg class="pf-svg" viewBox="0 0 580 250" role="img" aria-label="Tarama sapmaları"></svg>
        ${cur.kind === 'free' ? '<label class="slider"><span>Bandı kaydır</span><input type="range" min="-0.25" max="0.25" step="0.005" value="0" data-off></label>' : ''}
        <div class="g-actions"><button class="btn ok-btn" data-v="1">✓ Kabul</button><button class="btn bad-btn" data-v="0">✗ Ret</button></div>
        <div class="g-result"></div>`;
      if (cur.kind === 'free') $('[data-off]').oninput = (e) => { off = +e.target.value; draw(); };
      el.querySelectorAll('.g-actions button').forEach((b) => { b.onclick = () => answer(b.dataset.v === '1'); });
      draw();
    }
    function answer(accept) {
      const ok = accept === cur.ok;
      results[round] = ok;
      if (ok) correct++;
      el.querySelectorAll('.g-actions button, [data-off]').forEach((b) => { b.disabled = true; });
      if (cur.kind === 'free') { off = (cur.mx + cur.mn) / 2; draw(); }
      const why = cur.kind === 'free'
        ? `Şekil hatası (en büyük − en küçük) ${N(cur.mx - cur.mn)} ${cur.ok ? '≤' : '>'} ${N(cur.t, 2)}.`
        : `Bant ${N(cur.uz - cur.t / 2)} … ${N(cur.uz + cur.t / 2)}; sapmalar ${N(cur.mn)} … ${N(cur.mx)}.`;
      $('.g-result').innerHTML = `
        <div class="msg ${ok ? 'ok' : 'bad'}"><b>${ok ? 'Doğru.' : 'Yanlış.'}</b> ${why} → <b>${cur.ok ? 'kabul' : 'ret'}</b></div>
        <button class="btn" data-go>${round + 1 < ROUNDS ? 'Sonraki tur →' : 'Sonucu gör'}</button>`;
      $('[data-go]').onclick = () => { round++; next(); };
      header();
    }
    function end() {
      const stars = correct >= 5 ? 3 : correct >= 4 ? 2 : correct >= 3 ? 1 : 0;
      header();
      if (stars) { GDT.giveStars(10, stars, 'Profil muayenesi'); api.done(); }
      GDT.syncStars(el, 10);
      $('.game-stage').innerHTML = `
        <div class="quiz-end ${stars ? 'ok' : ''}">
          <div class="quiz-score mono">${correct}<small>/${ROUNDS}</small></div>
          <p>${'★'.repeat(stars) || 'Yıldız yok'} · Datumlu bant yerinde durur; datumsuz bant profile oturur.</p>
          <button class="btn" data-again>Yeniden oyna</button>
        </div>`;
      $('[data-again]').onclick = () => { round = 0; correct = 0; results.length = 0; next(); };
    }
    GDT.syncStars(el, 10);
    next();
  }

  // ======================================================================
  // SINA
  // ======================================================================
  const QUESTIONS = [
    {
      q: 'Yüzey profili toleransı 0,2 ise (UZ yok) bant ideal profile göre nasıl durur?',
      options: ['Tamamı malzeme dışında, 0,2', 'İki yana eşit: ±0,1', 'Tamamı malzeme içinde, 0,2', '±0,2'],
      answer: 1,
      explain: 'Varsayılan bant ideal profile simetriktir: her yana t/2.',
    },
    {
      q: 'Çizgi profili ile yüzey profili arasındaki fark nedir?',
      options: ['Fark yoktur', 'Çizgi profili her kesiti ayrı değerlendirir; yüzey profili bütün yüzeyi tek bir kabukta', 'Çizgi profili datum almaz', 'Yüzey profili yalnızca düz yüzeyler içindir'],
      answer: 1,
      explain: 'Çizgi profilinde her kesitin bandı ayrıdır; yüzey profilinde bant bütün yüzeyi saran tek bir kabuktur.',
    },
    {
      q: 'Datumsuz bir profil toleransı neyi kontrol eder?',
      options: ['Şekli, yönelimi ve konumu', 'Yalnızca şekli; bant profile en iyi oturacak şekilde kayar', 'Yalnızca konumu', 'Hiçbir şeyi'],
      answer: 1,
      explain: 'Datum yoksa bandın yeri sabit değildir; form kontrolü gibi çalışır.',
    },
    {
      q: '“⌓ 0,2 UZ+0,05 | A | B” için bant nerededir?',
      options: ['−0,1 … +0,1', '−0,05 … +0,15', '+0,05 … +0,25', '0 … +0,2'],
      answer: 1,
      explain: 'Bandın merkezi +0,05 kayar: 0,05 − 0,1 = −0,05 ile 0,05 + 0,1 = +0,15 arası. Pozitif yön malzeme dışına doğrudur.',
    },
    {
      q: 'Sapmaların hepsi +0,04 ile +0,16 arasında. Simetrik bantlı profil toleransı en az kaç olmalı?',
      options: ['0,12', '0,16', '0,20', '0,32'],
      answer: 3,
      explain: 't/2 ≥ 0,16 → t = 0,32. UZ+0,10 ile 0,12 yeterdi.',
    },
    {
      q: 'Bir kalıp yüzeyinin ideal şekli resimde nasıl tanımlanır?',
      options: ['± toleranslı radyüslerle', 'CAD modeli ya da teorik tam ölçülerle; sapmayı profil toleransı sınırlar', 'Genel toleransla', 'Tanımlanmaz'],
      answer: 1,
      explain: 'Profil toleransı ideal geometriye göre çalışır; ideal geometri TED’lerle ya da modelle (ISO 16792) verilir.',
    },
    {
      q: 'Datumlu yüzey profili hangi kusurları sınırlar?',
      options: ['Yalnızca formu', 'Form, yönelim ve konumu birlikte', 'Yalnızca konumu', 'Yalnızca yüzey pürüzlülüğünü'],
      answer: 1,
      explain: 'Bant datumlara göre sabit olduğu için yüzeyin şekli, açısı ve yeri birlikte kontrol edilir.',
    },
  ];

  function sina(el, api) {
    el.append(GDT.el(`
      <div class="story card">
        <p class="kicker">Sına</p>
        <p>${QUESTIONS.length} soru. Geçmek için en az ${Math.ceil(QUESTIONS.length * 0.7)} doğru gerekiyor. Her doğru cevap +5 XP.</p>
      </div>`));
    GDT.quiz(el, { id: 'm10.quiz', questions: QUESTIONS, onPass: api.done });
  }

  GDT.registerModule(10, { steps: { sezgi, kavram, oyna, sina } });
})();
