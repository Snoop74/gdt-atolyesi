'use strict';
/* Module 8 — Yönelim toleransları (Sezgi: flat but tilted, Kavram: zones / hierarchy / deep holes / sine bar, Oyna: dial indicator bench, Sına) */
(() => {
  const N = GDT.num;
  const umTxt = (v) => `${Math.round(v)} µm`;

  // Dial indicator sweep: u ∈ [0,100] along the surface, deviation d(u) in µm, memory pointers and coverage
  function makeSweep(dev) {
    const seen = new Array(20).fill(false);
    let max = -Infinity, min = Infinity;
    return {
      read(u) {
        const v = dev(u);
        seen[Math.min(19, Math.floor(u / 5))] = true;
        max = Math.max(max, v);
        min = Math.min(min, v);
        return v;
      },
      get coverage() { return seen.filter(Boolean).length / seen.length; },
      get fim() { return max - min; },
      get max() { return max; },
      get min() { return min; },
      reset() { seen.fill(false); max = -Infinity; min = Infinity; },
    };
  }

  // Bench scene: 'par' block on a plate, 'perp' vertical face against a square, 'ang' block on a sine bar
  function benchSVG(type, dev, u, k = 1.2) {
    const pts = [];
    for (let s = 0; s <= 100; s += 2) pts.push([s, dev(s) * k]);
    if (type === 'perp') {
      const Y = (s) => 210 - s * 1.7, X = (d) => 360 + d;
      const face = pts.map(([s, d]) => `L${X(d).toFixed(1)} ${Y(s).toFixed(1)}`).join('');
      const yu = Y(u), xu = X(dev(u) * k);
      return `
        <rect class="fixture" x="20" y="210" width="540" height="16"/>
        <path class="square" d="M90 210V30h14V196h120V210Z"/>
        <text class="ax-lbl" x="96" y="24">gönye</text>
        <path class="drw-obj" d="M200 210${face}L200 ${Y(100)}Z"/>
        <line class="stylus" x1="${xu}" y1="${yu}" x2="${xu + 70}" y2="${yu}"/><circle class="stylus-tip" cx="${xu}" cy="${yu}" r="3"/>
        <rect class="ind-body" x="${xu + 70}" y="${yu - 10}" width="34" height="20" rx="4"/>
        <text class="ax-lbl" x="560" y="246" text-anchor="end">datum A: tabla · komparatör yüzey boyunca yukarı-aşağı · sapma abartılı</text>`;
    }
    const X = (s) => 110 + s * 3.6, top = (d) => 110 - d;
    const surf = pts.map(([s, d]) => `L${X(s).toFixed(1)} ${top(d).toFixed(1)}`).join('');
    const xu = X(u), yu = top(dev(u) * k);
    const ang = type === 'ang';
    return `
      <rect class="fixture" x="20" y="210" width="540" height="16"/>
      ${ang ? '<g class="sinebar"><path d="M90 194L470 194"/><circle cx="110" cy="202" r="8"/><circle cx="450" cy="202" r="8"/><rect x="438" y="200" width="24" height="10"/></g><text class="ax-lbl" x="470" y="190">sinüs cetveli + mastar bloğu</text>' : ''}
      <path class="drw-obj" d="M${X(0)} ${ang ? 190 : 210}${surf.replace(/^L/, 'L')}L${X(100)} ${ang ? 190 : 210}Z"/>
      <line class="stylus" x1="${xu}" y1="${yu}" x2="${xu}" y2="${yu - 60}"/><circle class="stylus-tip" cx="${xu}" cy="${yu}" r="3"/>
      <rect class="ind-body" x="${xu - 17}" y="${yu - 84}" width="34" height="24" rx="4"/>
      <text class="ax-lbl" x="560" y="246" text-anchor="end">datum A: tabla · komparatörü yüzey boyunca kaydır · sapma abartılı</text>`;
  }

  // ======================================================================
  // SEZGİ — flat, but not parallel
  // ======================================================================
  function sezgi(el, api) {
    const dev = (u) => 0.4 * u + 4 * Math.sin(u / 11 + 0.5);
    const sw = makeSweep(dev);
    let u = 0, asked = false;
    el.innerHTML = `
      <div class="story card">
        <p class="kicker">Durum</p>
        <p>Bir kalıp plakasının üst yüzeyi için resimde iki istek var: <b>düzlemsellik 0,02</b> ve alt yüzey A’ya <b>paralellik 0,03</b>. Düzlemsellik ölçüldü: <b class="mono">0,008</b>, sorun yok. Şimdi paralellik: plaka alt yüzeyiyle (A) granit masada. Komparatörü üst yüzeyin <b>tamamı</b> boyunca gezdir.</p>
      </div>
      <div class="card bench">
        <div class="bench-grid">
          <svg class="bench-svg" viewBox="0 0 580 250" role="img" aria-label="Paralellik ölçümü"></svg>
          <div class="dial-box"><div class="dial-wrap"></div><div class="cov"><i></i></div><small class="muted cov-txt"></small></div>
        </div>
        <label class="slider"><span>Komparatörün konumu <output class="mono" data-o></output></span><input type="range" min="0" max="100" step="0.5" value="0" data-u></label>
        <div class="cost-info sw-info"></div>
      </div>
      <div class="asks"></div>`;
    const $ = (q) => el.querySelector(q);
    function draw() {
      const v = sw.read(u);
      $('.bench-svg').innerHTML = benchSVG('par', dev, u);
      $('.dial-wrap').innerHTML = GDT.dialSVG(v, { max: sw.max, min: sw.min });
      $('[data-o]').textContent = `${N(u, 1)} mm`;
      $('.cov i').style.width = `${sw.coverage * 100}%`;
      $('.cov-txt').textContent = `taranan yüzey %${Math.round(sw.coverage * 100)}`;
      $('.sw-info').innerHTML = `
        <div><small>En büyük okuma (kırmızı ibre)</small><b class="mono">${GDT.signed(sw.max / 1000)}</b></div>
        <div><small>En küçük okuma (mavi ibre)</small><b class="mono">${GDT.signed(sw.min / 1000)}</b></div>
        <div><small>Fark: paralellik hatası</small><b class="mono">${sw.coverage >= 0.9 ? N(sw.fim / 1000) : '…tara'}</b></div>`;
      if (sw.coverage >= 0.9 && !asked) { asked = true; ask(); }
    }
    function ask() {
      GDT.ask($('.asks'), {
        q: `Düzlemsellik 0,008 (tolerans 0,02), komparatör farkı ${N(sw.fim / 1000)} (paralellik toleransı 0,03). Parça kabul mü?`,
        options: ['Kabul: yüzey düzlemsel', 'Ret: yüzey düzlemsel ama A’ya göre eğik; paralellik hatası 0,03’ü aşıyor', 'Kabul: paralellik düzlemselliğe dahildir', 'Karar verilemez: konum toleransı yok'],
        answer: 1,
        explain: 'Paralellik bölgesi iki paralel düzlemdir ama <b>datum A’ya paralel olmak zorundadır</b>; düzlemsellikteki gibi dilediği gibi dönemez. Yüzey kendi içinde düz, ama masaya göre eğik.',
        onDone: () => {
          const take = GDT.el(`
            <div class="takeaway card">
              <p class="kicker">Ana fikir</p>
              <p><b>Yönelim toleransı = form + datuma göre açı.</b> Bölge datuma göre sabit bir açıda durur (paralel, dik ya da teorik tam açı), ama yukarı-aşağı serbestçe kayabilir: yönelim, konumu sınırlamaz. Ve yönelim formu da sınırlar: 0,03 paralellik, yüzeyin 0,03’ten daha düz olmasını da zorunlu kılar.</p>
              <button class="btn" data-next>Kavram adımına geç →</button>
            </div>`);
          $('.asks').append(take);
          take.querySelector('[data-next]').onclick = api.next;
          api.done();
        },
      });
    }
    $('[data-u]').oninput = (e) => { u = +e.target.value; draw(); };
    draw();
  }

  // ======================================================================
  // KAVRAM
  // ======================================================================
  function kavram(el, api) {
    GDT.carousel(el, [slideZones, slideHierarchy, slideDeepHole, slideSineBar], api);
  }

  function slideZones(el) {
    let type = 'par', h = 0, tilt = 0.6;
    const T = { par: { sym: 'parallelism', name: 'Paralellik', ang: 0 }, perp: { sym: 'perpendicularity', name: 'Diklik', ang: 90 }, ang: { sym: 'angularity', name: 'Açısallık', ang: 30 } };
    el.innerHTML = `
      <div class="slide-grid">
        <div>
          <p class="kicker">1 · Üç yönelim karakteristiği</p>
          <h3>Bölge datuma göre döner, ama kayabilir</h3>
          <p>Yönelim bölgesi iki paralel düzlemdir (eksen için Ø ile silindir). Datuma göre açısı sabittir: <b>0°</b>, <b>90°</b> ya da teorik tam açı. Yeri ise sabit değildir.</p>
          <div class="seg wrap" data-t>${Object.entries(T).map(([k, v]) => `<button data-v="${k}">${GDT.sym(v.sym, 18)} ${v.name}</button>`).join('')}</div>
          <label class="slider"><span>Yüzeyin yüksekliği (konum) <output class="mono" data-oh></output></span><input type="range" min="-30" max="30" step="1" value="0" data-h></label>
          <label class="slider"><span>Yüzeyin eğikliği <output class="mono" data-ot></output></span><input type="range" min="-2" max="2" step="0.1" value="0.6" data-tl></label>
          <p class="callout zones-note"></p>
        </div>
        <svg class="or-svg" viewBox="0 0 360 260" role="img" aria-label="Yönelim tolerans bölgesi"></svg>
      </div>`;
    const svg = el.querySelector('.or-svg');
    const draw = () => {
      const t = T[type];
      el.querySelectorAll('[data-t] button').forEach((b) => b.classList.toggle('on', b.dataset.v === type));
      el.querySelector('[data-oh]').textContent = `${h > 0 ? '+' : ''}${h}`;
      el.querySelector('[data-ot]').textContent = `${N(tilt, 1)}° (abartılı)`;
      const tolDeg = 1.2, ok = Math.abs(tilt) <= tolDeg / 2;
      const a = (-t.ang * Math.PI) / 180, ta = (-(t.ang + tilt) * Math.PI) / 180;
      const cx = 180, cy = 150 - h;
      const dir = (ang, len) => [Math.cos(ang) * len, Math.sin(ang) * len];
      const [ux, uy] = dir(a, 110), [nx, ny] = dir(a - Math.PI / 2, 12);
      const [sx, sy] = dir(ta, 100);
      svg.innerHTML = `
        <rect class="fixture" x="20" y="226" width="320" height="12"/><text class="ax-lbl" x="24" y="252">datum A</text>
        ${type === 'ang' ? `<path class="ang-arc" d="M${cx + 50} ${cy}A50 50 0 0 0 ${cx + 50 * Math.cos(a)} ${cy + 50 * Math.sin(a)}"/><rect class="ted-box" x="${cx + 52}" y="${cy - 30}" width="30" height="16"/><text class="drw-txt sm" x="${cx + 67}" y="${cy - 18}" text-anchor="middle">30°</text>` : ''}
        <path class="geo-zone ${ok ? '' : 'badz'}" d="M${cx - ux + nx} ${cy - uy + ny}L${cx + ux + nx} ${cy + uy + ny}L${cx + ux - nx} ${cy + uy - ny}L${cx - ux - nx} ${cy - uy - ny}Z"/>
        <line class="ang-edge feat" x1="${cx - sx}" y1="${cy - sy}" x2="${cx + sx}" y2="${cy + sy}"/>
        <line class="drw-cl" x1="${cx}" y1="${cy}" x2="${cx}" y2="226"/>`;
      el.querySelector('.zones-note').innerHTML = `${ok ? '<b>Kabul.</b>' : '<b>Ret:</b> yüzey bölgeden taşıyor.'} Yüksekliği değiştir: bölge yüzeyle birlikte kayar, karar değişmez. Yönelim toleransı <b>konumu sınırlamaz</b>; yüksekliği boyut ya da konum toleransı belirler.`;
    };
    el.querySelector('[data-t]').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) { type = b.dataset.v; draw(); } });
    el.querySelector('[data-h]').oninput = (e) => { h = +e.target.value; draw(); };
    el.querySelector('[data-tl]').oninput = (e) => { tilt = +e.target.value; draw(); };
    draw();
  }

  function slideHierarchy(el) {
    const v = { form: 0.02, ori: 0.05, loc: 0.1 };
    el.innerHTML = `
      <div class="slide-grid">
        <div>
          <p class="kicker">2 · Tolerans merdiveni</p>
          <h3>Form ≤ yönelim ≤ konum</h3>
          <p>Konum toleransı yönelimi ve formu da sınırlar; yönelim toleransı formu sınırlar. Bu yüzden aynı yüzeye birden fazla çerçeve veriyorsan, alt basamak daha <b>dar</b> olmalı. Yoksa o çerçeve hiçbir şey eklemez.</p>
          <label class="slider"><span>${GDT.sym('flatness', 16)} Düzlemsellik <output class="mono" data-of></output></span><input type="range" min="0.01" max="0.15" step="0.01" value="0.02" data-k="form"></label>
          <label class="slider"><span>${GDT.sym('parallelism', 16)} Paralellik (A’ya) <output class="mono" data-oo></output></span><input type="range" min="0.01" max="0.15" step="0.01" value="0.05" data-k="ori"></label>
          <label class="slider"><span>Kalınlık ±<output class="mono" data-ol></output> (konum)</span><input type="range" min="0.01" max="0.15" step="0.01" value="0.1" data-k="loc"></label>
          <div class="hier-msgs"></div>
        </div>
        <svg class="hier-svg" viewBox="0 0 320 240" role="img" aria-label="İç içe tolerans bölgeleri"></svg>
      </div>`;
    const svg = el.querySelector('.hier-svg');
    const draw = () => {
      el.querySelector('[data-of]').textContent = N(v.form, 2);
      el.querySelector('[data-oo]').textContent = N(v.ori, 2);
      el.querySelector('[data-ol]').textContent = N(v.loc, 2);
      const msgs = [];
      const locW = 2 * v.loc;
      if (v.ori >= locW) msgs.push(['warn', `Paralellik ${N(v.ori, 2)} ≥ kalınlık bölgesi ${N(locW, 2)}: boyut toleransı paralelliği zaten bu kadar sınırlıyor. Paralellik çerçevesi gereksiz.`]);
      if (v.form >= v.ori) msgs.push(['warn', `Düzlemsellik ${N(v.form, 2)} ≥ paralellik ${N(v.ori, 2)}: paralellik zaten düzlemselliği ${N(v.ori, 2)} ile sınırlıyor. Düzlemsellik çerçevesi gereksiz.`]);
      if (!msgs.length) msgs.push(['ok', 'Merdiven doğru: her basamak bir öncekinden dar, her çerçeve bir şey ekliyor.']);
      el.querySelector('.hier-msgs').innerHTML = msgs.map(([k, m]) => `<div class="msg ${k}">${m}</div>`).join('');
      const s = 520; // px per mm
      const band = (w, y, cls, label) => `<rect class="hz ${cls}" x="40" y="${y - (w * s) / 2}" width="240" height="${Math.max(2, w * s)}"/><text class="ax-lbl strong" x="286" y="${y + 4}">${label}</text>`;
      const zl = Math.min(locW, 0.3), zo = Math.min(v.ori, zl), zf = Math.min(v.form, zo);
      svg.innerHTML = `${band(zl, 120, 'loc', 'konum')}${band(zo, 120, 'ori', 'yönelim')}${band(zf, 120, 'form', 'form')}
        <text class="ax-lbl" x="40" y="230">etkili bölgeler iç içe (bir alt basamak üst basamaktan geniş olamaz)</text>`;
    };
    el.addEventListener('input', (e) => { const k = e.target.dataset.k; if (k) { v[k] = +e.target.value; draw(); } });
    draw();
  }

  function slideDeepHole(el) {
    let L = 40, th = 3;
    el.innerHTML = `
      <div class="slide-grid">
        <div>
          <p class="kicker">3 · Eksenin yönelimi</p>
          <h3>Derin delikte küçük açı büyük hata</h3>
          <p>Bir itici pim deliği A yüzeyine <b>Ø0,05</b> dik olmalı. Bölge, A’ya dik ve delik boyunca uzanan Ø0,05’lik bir silindir. Delik ne kadar derinse, aynı açısal sapma eksenin o silindirden o kadar çabuk çıkmasına yol açar.</p>
          <label class="slider"><span>Delik derinliği <output class="mono" data-ol></output></span><input type="range" min="5" max="120" step="1" value="40" data-l></label>
          <label class="slider"><span>Eksenin eğikliği <output class="mono" data-ot></output></span><input type="range" min="0" max="10" step="0.5" value="3" data-t></label>
          <div class="cost-info hole-info"></div>
        </div>
        <svg class="hole-svg" viewBox="0 0 300 260" role="img" aria-label="Eğik delik ekseni"></svg>
      </div>`;
    const svg = el.querySelector('.hole-svg');
    const draw = () => {
      const dev = L * Math.tan((th / 60) * Math.PI / 180); // mm, axis drift over the depth
      const ok = dev <= 0.05;
      el.querySelector('[data-ol]').textContent = `${L} mm`;
      el.querySelector('[data-ot]').textContent = `${N(th, 1)}′ (açı dakikası)`;
      el.querySelector('.hole-info').innerHTML = `
        <div><small>Eksenin kayması (derinlik × tan θ)</small><b class="mono">${N(dev)}</b></div>
        <div><small>Gereken bölge</small><b class="mono">Ø${N(dev)}</b></div>
        <div><small>Ø0,05 diklik</small><b class="${ok ? 'good' : 'badc'}">${ok ? 'Kabul' : 'Ret'}</b></div>`;
      const top = 30, bot = 30 + Math.min(200, L * 1.7), ex = Math.min(60, dev * 400);
      svg.innerHTML = `
        <rect class="drw-obj" x="40" y="${top}" width="220" height="${bot - top}"/>
        <rect class="geo-zone ${ok ? '' : 'badz'}" x="${150 - 10}" y="${top}" width="20" height="${bot - top}"/>
        <path class="drw-hole-cut" d="M${135} ${top}L${135 + ex} ${bot}L${165 + ex} ${bot}L${165} ${top}Z"/>
        <line class="ang-edge feat" x1="150" y1="${top}" x2="${150 + ex}" y2="${bot}"/>
        <rect class="fixture" x="20" y="${bot}" width="260" height="10"/><text class="ax-lbl" x="24" y="${bot + 24}">datum A</text>
        <text class="ax-lbl" x="150" y="20" text-anchor="middle">açı ve bölge abartılı</text>`;
    };
    el.querySelector('[data-l]').oninput = (e) => { L = +e.target.value; draw(); };
    el.querySelector('[data-t]').oninput = (e) => { th = +e.target.value; draw(); };
    draw();
  }

  function slideSineBar(el) {
    let a = 30, Lb = 100;
    el.innerHTML = `
      <div class="slide-grid">
        <div>
          <p class="kicker">4 · Ölçüm</p>
          <h3>Açısallık için sinüs cetveli</h3>
          <p>Paralellikte parça doğrudan tablaya konur. Diklikte gönye ya da açı plakası kullanılır. Açısallıkta parça, <b>sinüs cetveliyle</b> teorik tam açı kadar eğilir; böylece kontrol edilen yüzey tablaya paralel hale gelir ve paralellik gibi ölçülür. Mastar bloğu yüksekliği: <b>h = L · sin α</b>.</p>
          <label class="slider"><span>Teorik tam açı α <output class="mono" data-oa></output></span><input type="range" min="5" max="60" step="0.5" value="30" data-a></label>
          <div class="seg" data-lb><button data-v="100">L = 100</button><button data-v="200">L = 200</button></div>
          <div class="lin-result sb-res"></div>
        </div>
        <svg class="sb-svg" viewBox="0 0 320 220" role="img" aria-label="Sinüs cetveli"></svg>
      </div>`;
    const svg = el.querySelector('.sb-svg');
    const draw = () => {
      const h = Lb * Math.sin((a * Math.PI) / 180);
      el.querySelector('[data-oa]').textContent = `${N(a, 1)}°`;
      el.querySelectorAll('[data-lb] button').forEach((b) => b.classList.toggle('on', +b.dataset.v === Lb));
      el.querySelector('.sb-res').innerHTML = `<span class="mono big">h = ${Lb} × sin ${N(a, 1)}° = ${N(h, 3)} mm</span>`;
      const r = (a * Math.PI) / 180, x0 = 40, y0 = 190, len = 230;
      const x1 = x0 + len * Math.cos(r), y1 = y0 - len * Math.sin(r);
      svg.innerHTML = `
        <rect class="fixture" x="10" y="190" width="300" height="12"/>
        <line class="sb-line" x1="${x0}" y1="${y0}" x2="${x1}" y2="${y1}"/>
        <rect class="gauge-block" x="${x1 - 14}" y="${y1}" width="28" height="${190 - y1}"/>
        <text class="ax-lbl strong" x="${x1 + 18}" y="${(y1 + 190) / 2}">h</text>
        <path class="ang-arc" d="M${x0 + 60} ${y0}A60 60 0 0 0 ${x0 + 60 * Math.cos(r)} ${y0 - 60 * Math.sin(r)}"/>
        <text class="drw-txt sm" x="${x0 + 66}" y="${y0 - 12}">α</text>`;
    };
    el.querySelector('[data-a]').oninput = (e) => { a = +e.target.value; draw(); };
    el.querySelector('[data-lb]').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) { Lb = +b.dataset.v; draw(); } });
    draw();
  }

  // ======================================================================
  // OYNA — dial indicator bench
  // ======================================================================
  const ROUNDS = 5;
  const STARS = ['En az 3 doğru karar', 'En az 4 doğru karar', '5 kararın hepsi doğru'];
  const TYPES = { par: { sym: 'parallelism', name: 'Paralellik' }, perp: { sym: 'perpendicularity', name: 'Diklik' }, ang: { sym: 'angularity', name: 'Açısallık' } };

  function genRound(i) {
    const type = ['par', 'perp', 'ang', 'par', 'perp'][i];
    const tol = GDT.pick([20, 30, 40, 50]);
    const want = Math.random() < 0.5; // half the rounds pass, so guessing does not pay
    for (;;) {
      const tilt = (Math.random() - 0.5) * 1.4, amp = 2 + Math.random() * 6, ph = Math.random() * 6, f = 8 + Math.random() * 10;
      const dev = (u) => tilt * u + amp * Math.sin(u / f + ph);
      let mx = -Infinity, mn = Infinity;
      for (let u = 0; u <= 100; u += 0.5) { mx = Math.max(mx, dev(u)); mn = Math.min(mn, dev(u)); }
      const fim = mx - mn;
      if (Math.abs(fim - tol) > tol * 0.18 && (fim <= tol) === want) return { type, tol, dev, fim, angle: type === 'ang' ? GDT.pick([15, 20, 30, 45]) : null };
    }
  }

  function oyna(el, api) {
    let round = 0, correct = 0, cur = null, sw = null, u = 0, setupOk = true;
    const results = [];
    el.innerHTML = `
      <div class="card brief">
        <div>
          <p class="kicker">Ölçüm tezgâhı</p>
          <h3>Komparatörle yönelim kontrolü</h3>
          <p>Her turda bir parça ve bir yönelim gerekliliği var. Komparatörü yüzey boyunca gezdir; kırmızı ve mavi ibreler en büyük ve en küçük okumayı hatırlar. Yüzeyin en az <b>%90’ını</b> taramadan karar veremezsin. Açısallıkta önce sinüs cetvelini kur.</p>
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
      const v = sw.read(u);
      $('.bench-svg').innerHTML = benchSVG(cur.type, cur.dev, u);
      $('.dial-wrap').innerHTML = GDT.dialSVG(v, { max: sw.max, min: sw.min });
      $('.cov i').style.width = `${sw.coverage * 100}%`;
      $('.cov-txt').textContent = `taranan yüzey %${Math.round(sw.coverage * 100)}`;
      $('.fim').textContent = sw.coverage > 0 ? N(sw.fim / 1000) : '—';
      el.querySelectorAll('.g-actions button').forEach((b) => { b.disabled = sw.coverage < 0.9 || !setupOk; });
    }
    function next() {
      if (round >= ROUNDS) return end();
      cur = genRound(round);
      sw = makeSweep(cur.dev);
      u = 0;
      setupOk = cur.type !== 'ang';
      header();
      const t = TYPES[cur.type];
      $('.game-stage').innerHTML = `
        <div class="lab-head">
          ${GDT.fcfHTML({ sym: t.sym, value: cur.tol / 1000, datums: ['A'] })}
          ${cur.angle ? `<span>Teorik tam açı ${GDT.tedHTML(`${cur.angle}°`)}</span>` : ''}
          <span>Komparatör farkı: <b class="mono fim">—</b></span>
        </div>
        ${cur.angle ? `
          <div class="setup-box">
            <label class="g-field"><span>Sinüs cetveli L = 100: mastar bloğu yüksekliği h (mm)</span><input inputmode="decimal" data-h placeholder="ör. 25,882"></label>
            <button class="btn ghost" data-set>Cetveli kur</button>
            <span class="setup-msg"></span>
          </div>` : ''}
        <div class="bench-grid">
          <svg class="bench-svg" viewBox="0 0 580 250" role="img" aria-label="Ölçüm tezgâhı"></svg>
          <div class="dial-box"><div class="dial-wrap"></div><div class="cov"><i></i></div><small class="muted cov-txt"></small></div>
        </div>
        <label class="slider"><span>Komparatörün konumu</span><input type="range" min="0" max="100" step="0.5" value="0" data-u ${setupOk ? '' : 'disabled'}></label>
        <div class="g-actions"><button class="btn ok-btn" data-v="1">✓ Kabul</button><button class="btn bad-btn" data-v="0">✗ Ret</button></div>
        <div class="g-result"></div>`;
      $('[data-u]').oninput = (e) => { u = +e.target.value; draw(); };
      if (cur.angle) {
        $('[data-set]').onclick = () => {
          const h = GDT.parseNum($('[data-h]').value), want = 100 * Math.sin((cur.angle * Math.PI) / 180);
          if (Math.abs(h - want) <= 0.01) {
            setupOk = true;
            $('[data-u]').disabled = false;
            $('.setup-msg').innerHTML = `<b class="good">✓ Doğru: ${N(want)} mm.</b> Yüzey artık tablaya paralel.`;
            $('[data-set]').disabled = true;
          } else {
            $('.setup-msg').innerHTML = `<b class="badc">Değil.</b> h = 100 × sin ${cur.angle}°`;
          }
          draw();
        };
      }
      el.querySelectorAll('.g-actions button').forEach((b) => { b.onclick = () => answer(b.dataset.v === '1'); });
      draw();
    }
    function answer(accept) {
      const truth = cur.fim <= cur.tol, ok = accept === truth;
      results[round] = ok;
      if (ok) correct++;
      el.querySelectorAll('.g-actions button, [data-u]').forEach((b) => { b.disabled = true; });
      $('.g-result').innerHTML = `
        <div class="msg ${ok ? 'ok' : 'bad'}"><b>${ok ? 'Doğru.' : 'Yanlış.'}</b> Bütün yüzeyde fark <b>${N(cur.fim / 1000)}</b> mm, tolerans ${N(cur.tol / 1000, 2)} → <b>${truth ? 'kabul' : 'ret'}</b>.${Math.abs(sw.fim - cur.fim) > 1 ? ' Taradığın bölümde en uç noktaları kaçırmış olabilirsin.' : ''}</div>
        <button class="btn" data-go>${round + 1 < ROUNDS ? 'Sonraki tur →' : 'Sonucu gör'}</button>`;
      $('[data-go]').onclick = () => { round++; next(); };
      header();
    }
    function end() {
      const stars = correct >= 5 ? 3 : correct >= 4 ? 2 : correct >= 3 ? 1 : 0;
      header();
      if (stars) { GDT.giveStars(8, stars, 'Ölçüm tezgâhı'); api.done(); }
      GDT.syncStars(el, 8);
      $('.game-stage').innerHTML = `
        <div class="quiz-end ${stars ? 'ok' : ''}">
          <div class="quiz-score mono">${correct}<small>/${ROUNDS}</small></div>
          <p>${'★'.repeat(stars) || 'Yıldız yok'} · Yönelimde ölçüm, datuma göre kurulmuş yüzeyde ibrenin toplam hareketidir.</p>
          <button class="btn" data-again>Yeniden oyna</button>
        </div>`;
      $('[data-again]').onclick = () => { round = 0; correct = 0; results.length = 0; next(); };
    }
    GDT.syncStars(el, 8);
    next();
  }

  // ======================================================================
  // SINA
  // ======================================================================
  const QUESTIONS = [
    {
      q: 'Paralellik ile düzlemsellik arasındaki fark nedir?',
      options: ['Fark yoktur', 'Paralellik bölgesi datuma paralel olmak zorundadır; düzlemsellik bölgesi serbestçe döner', 'Düzlemsellik daha geniştir', 'Paralellik yalnızca delikler içindir'],
      answer: 1,
      explain: 'Paralellik = form + datuma göre açı. Bu yüzden düzlemselliği de sınırlar.',
    },
    {
      q: 'Bir yüzeye 0,05 paralellik verilmiş. Yüzeyin düzlemselliği en fazla ne olabilir?',
      options: ['Sınırsız', '0,05', '0,10', '0,025'],
      answer: 1,
      explain: 'Yüzey 0,05 aralıklı iki düzlem arasında kaldığı için kendi düzlemselliği de en fazla 0,05 olabilir.',
    },
    {
      q: 'Yönelim toleransları neyi sınırlamaz?',
      options: ['Açıyı', 'Formu', 'Konumu (yüksekliği)', 'Hiçbirini'],
      answer: 2,
      explain: 'Bölge datuma göre açısını korur ama yukarı-aşağı serbestçe kayar. Yüksekliği boyut ya da konum toleransı belirler.',
    },
    {
      q: 'Düzlemsellik 0,05, aynı yüzeyin paralelliği 0,03. Ne söylenebilir?',
      options: ['Doğru bir kombinasyon', 'Düzlemsellik çerçevesi gereksiz; paralellik zaten 0,03 düzlemsellik sağlar', 'Paralellik çerçevesi gereksiz', 'Çelişki: parça üretilemez'],
      answer: 1,
      explain: 'Alt basamak (form) üst basamaktan (yönelim) dar olmalı; değilse hiçbir şey eklemez.',
    },
    {
      q: '60 mm derinliğinde bir deliğin ekseni 3 açı dakikası eğik. Eksen dipte ne kadar kayar?',
      options: ['Yaklaşık 0,005 mm', 'Yaklaşık 0,05 mm', 'Yaklaşık 0,5 mm', '3 mm'],
      answer: 1,
      explain: '60 × tan(3′) ≈ 60 × 0,00087 ≈ 0,052 mm. Derin deliklerde küçük açılar büyük sapma demektir.',
    },
    {
      q: 'Açısallık ölçümünde 100 mm’lik sinüs cetveliyle 30° kurmak için mastar bloğu yüksekliği nedir?',
      options: ['30 mm', '50 mm', '86,6 mm', '57,7 mm'],
      answer: 1,
      explain: 'h = L · sin α = 100 × sin 30° = 50 mm.',
    },
    {
      q: 'Açısallık çerçevesinde açı nasıl verilir?',
      options: ['Çerçeve içinde tolerans değeri olarak', 'Resimde teorik tam ölçü (çerçeveli) olarak', '± toleranslı açı olarak', 'Verilmez'],
      answer: 1,
      explain: 'Açı teorik tam ölçüdür (ör. [30°]); sapmayı açısallık bölgesi sınırlar. ± toleranslı açı kullanılırsa bölge kama biçimine döner ve yorum değişir.',
    },
  ];

  function sina(el, api) {
    el.append(GDT.el(`
      <div class="story card">
        <p class="kicker">Sına</p>
        <p>${QUESTIONS.length} soru. Geçmek için en az ${Math.ceil(QUESTIONS.length * 0.7)} doğru gerekiyor. Her doğru cevap +5 XP.</p>
      </div>`));
    GDT.quiz(el, { id: 'm8.quiz', questions: QUESTIONS, onPass: api.done });
  }

  GDT.registerModule(8, { steps: { sezgi, kavram, oyna, sina } });
})();
