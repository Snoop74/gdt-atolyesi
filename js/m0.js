'use strict';
/* Module 0 — Neden tolerans? (Sezgi: micrometer, Kavram: 4 slides, Oyna: assembly simulator, Sına: quiz) */
(() => {
  const N = GDT.num;

  // ---------- shared drawing bits ----------
  const arrowV = (x, y1, y2) =>
    `<line class="drw-dim" x1="${x}" y1="${y1}" x2="${x}" y2="${y2}"/>
     <path class="drw-arrow" d="M${x} ${y1}l-3 9h6z"/><path class="drw-arrow" d="M${x} ${y2}l-3-9h6z"/>`;

  const shaftDrawing = () => `
    <svg class="drw" viewBox="0 0 380 150" role="img" aria-label="Mil teknik resmi">
      <line class="drw-cl" x1="80" y1="75" x2="356" y2="75"/>
      <path class="drw-obj" d="M96 30H334l6 6v78l-6 6H96l-6-6V36z"/>
      <path class="drw-thin" d="M96 30v90M334 30v90"/>
      <path class="drw-ext" d="M88 30H40M88 120H40"/>
      ${arrowV(52, 30, 120)}
      <text class="drw-txt dim-txt" transform="translate(42 75) rotate(-90)" text-anchor="middle">Ø20</text>
    </svg>`;

  const miniShaft = `<svg viewBox="0 0 60 24" width="60" height="24" aria-hidden="true"><path d="M5 4h48l3 3v10l-3 3H5l-3-3V7z" class="mini-shaft"/></svg>`;

  // ======================================================================
  // SEZGİ — six shafts, a micrometer, and a drawing that only says Ø20
  // ======================================================================
  function sezgi(el, api) {
    const TOL = 0.010;
    let dec = 1, parts = [], tol = false, stage = 0;

    el.innerHTML = `
      <div class="story card">
        <p class="kicker">Durum</p>
        <p>Teknik resimde mil için yalnızca <b class="mono">Ø20</b> yazıyor. Tezgâhtan altı mil geldi. Senin işin, hangilerinin kabul edileceğine karar vermek.</p>
      </div>
      <div class="bench card">
        <div class="bench-top">
          <div class="bench-draw">${shaftDrawing()}</div>
          <div class="bench-ctl">
            <span class="lbl">Mikrometre çözünürlüğü (mm)</span>
            <div class="seg" data-res>${[1, 2, 3, 4].map((d) => `<button data-d="${d}">${N(10 ** -d, d)}</button>`).join('')}</div>
            <button class="btn" data-make>Tezgâhtan 6 mil al</button>
          </div>
        </div>
        <div class="parts"></div>
        <div class="numline" hidden></div>
        <p class="hint"></p>
      </div>
      <div class="asks"></div>`;

    const $ = (s) => el.querySelector(s);
    const isOk = (d) => Math.abs(d - 20) <= TOL + 1e-9;
    const reading = (d) => N(Math.round(d * 10 ** dec) / 10 ** dec, dec);

    function make() {
      // keep the lesson intact: nothing reads 20,000 and the batch has both good and bad parts
      do {
        parts = Array.from({ length: 6 }, () => 20 + GDT.clamp(GDT.gauss() * 0.008, -0.03, 0.03));
      } while (parts.some((d) => Math.round(d * 1000) === 20000) || parts.every(isOk) || !parts.some(isOk));
      if (stage === 0) stage = 1;
      render();
    }

    function render() {
      el.querySelectorAll('[data-res] button').forEach((b) => b.classList.toggle('on', +b.dataset.d === dec));
      $('.parts').innerHTML = parts.map((d, i) => {
        const cls = tol ? (isOk(d) ? 'ok' : 'bad') : '';
        return `<div class="part ${cls}">
          ${miniShaft}
          <span class="part-id mono">#${i + 1}</span>
          <span class="part-val mono">${reading(d)}</span>
          ${tol ? `<span class="part-verdict">${isOk(d) ? 'Kabul' : 'Ret'}</span>` : ''}
        </div>`;
      }).join('');
      let hint;
      if (!parts.length) hint = 'Önce tezgâhtan parçaları al.';
      else if (tol) hint = `Tolerans ±${N(TOL)} mm: <b>19,990</b> ile <b>20,010</b> arası kabul. ${parts.filter(isOk).length} kabul, ${parts.filter((d) => !isOk(d)).length} ret.`;
      else if (dec === 1) hint = 'Hepsi <b>20,0</b> okunuyor. Hepsi kusursuz mu? Mikrometreyi hassaslaştır.';
      else if (dec === 2) hint = 'Farklar belirmeye başladı. Bir kademe daha?';
      else hint = 'Artık her mil farklı. Peki hangisi “doğru” ölçüde?';
      $('.hint').innerHTML = hint;
      if (tol) renderNumline();
      if (parts.length && dec >= 3 && stage === 1) { stage = 2; askQ1(); }
    }

    function renderNumline() {
      const a = 19.98, b = 20.02, x = (v) => 30 + ((v - a) / (b - a)) * 540;
      const ticks = [];
      for (let v = a; v <= b + 1e-9; v += 0.005) {
        const major = Math.round(v * 1000) % 10 === 0;
        ticks.push(`<line class="nl-tick" x1="${x(v)}" y1="62" x2="${x(v)}" y2="${major ? 70 : 66}"/>`
          + (major ? `<text class="nl-lbl" x="${x(v)}" y="84" text-anchor="middle">${N(v)}</text>` : ''));
      }
      const dots = parts.map((d, i) => {
        const cx = GDT.clamp(x(d), 30, 570), cy = 46 - (i % 2) * 18;
        return `<g class="nl-dot ${isOk(d) ? 'ok' : 'bad'}"><line x1="${cx}" y1="${cy}" x2="${cx}" y2="62"/><circle cx="${cx}" cy="${cy}" r="7"/><text x="${cx}" y="${cy + 3.5}" text-anchor="middle">${i + 1}</text></g>`;
      }).join('');
      const nl = $('.numline');
      nl.hidden = false;
      nl.innerHTML = `
        <svg viewBox="0 0 600 92" role="img" aria-label="Tolerans bölgesi ve ölçülen miller">
          <rect class="nl-zone" x="${x(19.99)}" y="8" width="${x(20.01) - x(19.99)}" height="54" rx="3"/>
          <text class="nl-zlbl" x="${x(20)}" y="20" text-anchor="middle">tolerans bölgesi</text>
          <line class="nl-axis" x1="30" y1="62" x2="570" y2="62"/>
          ${ticks.join('')}${dots}
        </svg>`;
    }

    function askQ1() {
      GDT.ask($('.asks'), {
        q: 'Altı milden kaç tanesi tam 20,000 mm?',
        options: ['Hiçbiri', 'Bir tanesi', 'Yarısı', 'Hepsi'],
        answer: 0,
        explain: 'Hiçbiri. Çözünürlüğü artırdıkça farklar büyür; 0,0001 mm’de bile “tam 20” çıkmaz. Tam ölçü yalnızca resimdeki bir fikirdir.',
        onDone: askQ2,
      });
    }

    function askQ2() {
      GDT.ask($('.asks'), {
        q: 'O zaman hangi miller kabul edilmeli?',
        options: [
          'Hepsi: hepsi 20’ye çok yakın',
          'Yalnızca 20,000’a en yakın olanı',
          'Hiçbiri: hiçbiri tam 20 değil',
          'Karar verilemez: resim ne kadar sapmaya izin verildiğini söylemiyor',
        ],
        answer: 3,
        explain: '“Çok yakın” kişiden kişiye değişir; tornacıyla kalite kontrolcü sonsuza kadar tartışır. Resim, ölçüyle birlikte bir <b>kabul aralığı</b> vermeli. İşte tolerans budur.',
        onDone: () => {
          const btn = GDT.el('<button class="btn big tol-btn">Resme toleransı ekle: <span class="mono">Ø20 ±0,010</span></button>');
          $('.asks').append(btn);
          btn.onclick = () => { btn.remove(); addTolerance(); };
        },
      });
    }

    function addTolerance() {
      tol = true;
      el.querySelector('.dim-txt').textContent = 'Ø20 ±0,010';
      el.querySelector('.bench-draw').classList.add('flash');
      render();
      const take = GDT.el(`
        <div class="takeaway card">
          <p class="kicker">Ana fikir</p>
          <p><b>Tolerans, izin verilen sapmadır.</b> Hiçbir parça tam nominal ölçüde üretilemez; resim ölçüyle birlikte bir kabul aralığı vermelidir. Aralığı dar tutmak pahalı, geniş tutmak riskli. Bu dengeyi modülün geri kalanında kuracağız.</p>
          <p class="muted">Yeni parti alıp sonucu tekrar görebilirsin.</p>
          <button class="btn" data-next>Kavram adımına geç →</button>
        </div>`);
      $('.asks').append(take);
      take.querySelector('[data-next]').onclick = api.next;
      take.scrollIntoView({ block: 'nearest', behavior: GDT.reducedMotion() ? 'auto' : 'smooth' });
      api.done();
    }

    el.querySelector('[data-res]').addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      dec = +b.dataset.d;
      render();
    });
    $('[data-make]').onclick = make;
    render();
  }

  // ======================================================================
  // KAVRAM — four slides
  // ======================================================================
  function kavram(el, api) {
    GDT.carousel(el, [slideSpread, slideInterchange, slideCost, slideRule], api);
  }

  // --- slide 1: every process has a spread ---
  function slideSpread(el) {
    let proc = 1, samples = [];
    el.innerHTML = `
      <div class="slide-grid">
        <div>
          <p class="kicker">1 · Değişkenlik</p>
          <h3>Her süreç bir dağılım üretir</h3>
          <p>Aynı tezgâh, aynı takım, aynı operatör; yine de parçalar birbirinden farklı çıkar. Takım aşınır, sıcaklık değişir, malzeme homojen değildir. Ölçüler çoğunlukla <b>normal dağılım</b> gösterir; yayılımını <b>σ (standart sapma)</b> ile anlatırız.</p>
          <span class="lbl">Süreç</span>
          <div class="seg wrap" data-proc>${Sim0.PROCESSES.map((p, i) => `<button data-i="${i}">${p.shaft}</button>`).join('')}</div>
          <p class="callout"></p>
          <button class="btn ghost" data-sample>30 parça üret</button>
        </div>
        <svg class="bell" viewBox="0 0 520 250" role="img" aria-label="Normal dağılım eğrisi"></svg>
      </div>`;
    const svg = el.querySelector('.bell');
    const x = (v) => 260 + v * 6;

    function draw(animateDots) {
      const s = Sim0.PROCESSES[proc].sigma;
      el.querySelectorAll('[data-proc] button').forEach((b) => b.classList.toggle('on', +b.dataset.i === proc));
      el.querySelector('.callout').innerHTML = `σ = <b class="mono">${N(s, 1)} µm</b>. Parçaların <b>%99,73</b>’ü ortalamanın <b class="mono">±3σ = ±${N(3 * s, 1)} µm</b> yakınında kalır.`;
      let path = '';
      for (let px = 20; px <= 500; px += 2) {
        const v = (px - 260) / 6;
        const y = 170 - 140 * Math.exp(-0.5 * (v / s) ** 2);
        path += `${px === 20 ? 'M' : 'L'}${px} ${y.toFixed(1)}`;
      }
      const ticks = [];
      for (let v = -40; v <= 40; v += 10) {
        ticks.push(`<line class="ax-tick" x1="${x(v)}" y1="170" x2="${x(v)}" y2="175"/><text class="ax-lbl" x="${x(v)}" y="188" text-anchor="middle">${v > 0 ? '+' : ''}${v === 0 ? '0' : String(v).replace('-', '−')}</text>`);
      }
      // stacked dot plot of the samples, 2 µm bins
      const stacks = {};
      const dotsSvg = samples.map((v, i) => {
        const bin = Math.round(v / 2);
        stacks[bin] = (stacks[bin] || 0) + 1;
        const cx = GDT.clamp(x(bin * 2), 24, 496), cy = 236 - (stacks[bin] - 1) * 9;
        return `<circle class="bell-dot${animateDots ? ' drop' : ''}" cx="${cx}" cy="${Math.max(cy, 196)}" r="4" style="animation-delay:${animateDots ? i * 25 : 0}ms"/>`;
      }).join('');
      const s3 = 3 * s;
      svg.innerHTML = `
        <rect class="bell-band" x="${x(-s3)}" y="24" width="${x(s3) - x(-s3)}" height="146"/>
        <path class="bell-curve" d="${path}"/>
        <line class="bell-3s" x1="${x(-s3)}" y1="24" x2="${x(-s3)}" y2="170"/>
        <line class="bell-3s" x1="${x(s3)}" y1="24" x2="${x(s3)}" y2="170"/>
        <text class="ax-lbl strong" x="${Math.max(x(-s3) - 4, 40)}" y="18" text-anchor="middle">−3σ</text>
        <text class="ax-lbl strong" x="${Math.min(x(s3) + 4, 480)}" y="18" text-anchor="middle">+3σ</text>
        <line class="ax" x1="20" y1="170" x2="500" y2="170"/>
        ${ticks.join('')}
        <text class="ax-lbl" x="500" y="204" text-anchor="end">µm (hedeften sapma)</text>
        ${dotsSvg}`;
    }
    el.querySelector('[data-proc]').addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      proc = +b.dataset.i;
      samples = [];
      draw(false);
    });
    el.querySelector('[data-sample]').onclick = () => {
      const s = Sim0.PROCESSES[proc].sigma;
      samples = Array.from({ length: 30 }, () => GDT.clamp(GDT.gauss() * s, -40, 40));
      draw(true);
    };
    draw(false);
  }

  // --- slide 2: interchangeability ---
  function slideInterchange(el) {
    let mode = 1;
    el.innerHTML = `
      <div class="slide-grid">
        <div>
          <p class="kicker">2 · Değiştirilebilirlik</p>
          <h3>Herhangi bir mil, herhangi bir delikle</h3>
          <p>18. yüzyılın sonuna kadar parçalar karşılığına göre tek tek eğelenip alıştırılırdı; bir tüfeğin kilidi başka tüfeğe uymazdı. 1780’lerde Fransız silah ustası Honoré Blanc, rastgele seçilen kilit parçalarının birbirine uyduğunu gösterdi.</p>
          <p>Bunu mümkün kılan fikir: her parçayı kendi karşılığına göre değil, <b>ortak bir kabul aralığına</b> göre üretmek. Delikleri bir atölye, milleri başka bir atölye yapabilir.</p>
          <div class="seg" data-mode>
            <button data-m="0">Toleranssız: “yaklaşık 20”</button>
            <button data-m="1">Toleranslı: delik +0,025/0 · mil −0,010/−0,035</button>
          </div>
          <button class="btn ghost" data-pair>Rastgele 8 çift eşleştir</button>
        </div>
        <div>
          <div class="pairs"></div>
          <p class="muted small pair-sum">Atölye A delik, atölye B mil üretiyor. Montaj için boşluk 10–60 µm olmalı.</p>
        </div>
      </div>`;
    const sync = () => el.querySelectorAll('[data-mode] button').forEach((b) => b.classList.toggle('on', +b.dataset.m === mode));
    function pair() {
      let C;
      if (mode === 1) {
        const r = Sim0.run({ Th: 25, Ts: 25, procH: 1, procS: 1, inspect: true, N: 40 });
        C = r.C.slice(0, 8);
      } else {
        // both shops aim at "about 20" with their own habits
        C = Array.from({ length: 8 }, () => (GDT.gauss() * 15 - 5) - (GDT.gauss() * 15 + 3));
      }
      const ok = C.filter((c) => c >= Sim0.FIT.min && c <= Sim0.FIT.max).length;
      el.querySelector('.pairs').innerHTML = C.map((c, i) => {
        const st = c < Sim0.FIT.min ? 'tight' : c > Sim0.FIT.max ? 'loose' : 'ok';
        const r = GDT.clamp(26 - c * 0.12, 16, 31);
        return `<div class="pair ${st}" style="animation-delay:${i * 60}ms">
          <svg viewBox="0 0 70 70" width="62" height="62" aria-hidden="true">
            <circle cx="35" cy="35" r="32" class="pair-bush"/><circle cx="35" cy="35" r="26" class="pair-hole"/>
            <circle cx="35" cy="${st === 'loose' ? 35 + (26 - r) : 35}" r="${r}" class="pair-shaft"/>
          </svg>
          <span class="mono">${c >= 0 ? '' : '−'}${Math.abs(Math.round(c))} µm</span>
          <b>${st === 'ok' ? '✓' : st === 'tight' ? 'Sıkı' : 'Boş'}</b>
        </div>`;
      }).join('');
      el.querySelector('.pair-sum').innerHTML = `<b>${ok}/8</b> çift çalışıyor. ${mode === 1 ? 'Toleranslar fonksiyondan türetildiği için hangi çifti seçersen seç çalışır.' : 'Ortak bir sınır olmadığı için çiftlerin çoğu ya sıkışıyor ya sallanıyor; usta her çifti elle alıştırmak zorunda.'}`;
    }
    el.querySelector('[data-mode]').addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      mode = +b.dataset.m;
      sync();
      pair();
    });
    el.querySelector('[data-pair]').onclick = pair;
    sync();
    pair();
  }

  // --- slide 3: tight tolerances cost money ---
  const PROCESS_BANDS = [
    { name: 'Döküm / oksijen kesim', it: 'IT13–IT16', lo: 330, hi: 1300 },
    { name: 'Kaba torna / freze', it: 'IT10–IT12', lo: 84, hi: 210 },
    { name: 'Hassas torna / freze', it: 'IT7–IT9', lo: 21, hi: 52 },
    { name: 'Taşlama', it: 'IT5–IT7', lo: 9, hi: 21 },
    { name: 'Honlama / lepleme', it: 'IT3–IT5', lo: 4, hi: 9 },
  ];
  // ISO 286 standard tolerance values for nominal sizes 18–30 mm, µm
  const IT_18_30 = [[3, 4], [4, 6], [5, 9], [6, 13], [7, 21], [8, 33], [9, 52], [10, 84], [11, 130], [12, 210], [13, 330], [14, 520], [15, 840], [16, 1300]];
  const relCost = (t) => 1 + 40 / t ** 0.85;   // illustrative cost curve

  function slideCost(el) {
    el.innerHTML = `
      <div class="slide-grid">
        <div>
          <p class="kicker">3 · Maliyet</p>
          <h3>Dar tolerans pahalıdır</h3>
          <p>Toleransı daralttıkça daha hassas, daha yavaş bir süreç ve daha sık ölçüm gerekir. Maliyet doğrusal değil, <b>üstel</b> artar: son birkaç mikron en pahalısıdır.</p>
          <label class="slider"><span>Ø20 için toplam tolerans <output class="mono" data-o></output></span><input type="range" min="0" max="1000" value="520" data-t></label>
          <div class="cost-info"></div>
          <p class="muted small">Süreç aralıkları ve maliyet eğrisi temsilidir; değerler atölyeye ve malzemeye göre değişir. IT değerleri ISO 286, 18–30 mm aralığı.</p>
        </div>
        <svg class="cost-chart" viewBox="0 0 520 250" role="img" aria-label="Tolerans ve maliyet grafiği"></svg>
      </div>`;
    const svg = el.querySelector('.cost-chart');
    const TMIN = 4, TMAX = 2000;
    const x = (t) => 50 + (Math.log10(t / TMIN) / Math.log10(TMAX / TMIN)) * 450;
    const y = (c) => 210 - c * 13.5;
    const tOf = (v) => TMIN * (TMAX / TMIN) ** (v / 1000);

    function draw() {
      const t = tOf(+el.querySelector('[data-t]').value);
      el.querySelector('[data-o]').textContent = t >= 100 ? `${Math.round(t)} µm` : `${N(t, 1)} µm`;
      const band = PROCESS_BANDS.slice().sort((a, b) => b.lo - a.lo).find((b) => b.lo <= t) || null;
      const grade = IT_18_30.filter(([, v]) => v <= t).pop();
      const c = relCost(t);
      el.querySelector('.cost-info').innerHTML = band
        ? `<div><small>En ucuz yeterli süreç</small><b>${band.name}</b></div>
           <div><small>Yaklaşık kalite</small><b class="mono">${grade ? `IT${grade[0]}` : '< IT3'}</b></div>
           <div><small>Göreli maliyet</small><b class="mono">×${N(c, 1)}</b></div>`
        : '<div><small>Uyarı</small><b>Bu tolerans ölçmek için bile özel metroloji ister.</b></div>';
      let path = '';
      for (let px = 50; px <= 500; px += 3) {
        const tt = TMIN * (TMAX / TMIN) ** ((px - 50) / 450);
        path += `${px === 50 ? 'M' : 'L'}${px} ${y(relCost(tt)).toFixed(1)}`;
      }
      const bands = PROCESS_BANDS.map((b) => {
        const cy = y(relCost(Math.sqrt(b.lo * b.hi)));
        const on = band === b;
        return `<g class="cband${on ? ' on' : ''}">
          <rect x="${x(b.lo)}" y="${cy - 7}" width="${x(b.hi) - x(b.lo)}" height="14" rx="7"/>
          <text x="${(x(b.lo) + x(b.hi)) / 2}" y="${cy - 12}" text-anchor="middle">${b.name}</text>
        </g>`;
      }).join('');
      const ticks = [5, 10, 20, 50, 100, 200, 500, 1000, 2000].map((v) =>
        `<line class="ax-tick" x1="${x(v)}" y1="210" x2="${x(v)}" y2="215"/><text class="ax-lbl" x="${x(v)}" y="228" text-anchor="middle">${v}</text>`).join('');
      svg.innerHTML = `
        <line class="ax" x1="50" y1="210" x2="500" y2="210"/>
        <line class="ax" x1="50" y1="20" x2="50" y2="210"/>
        ${ticks}
        <text class="ax-lbl" x="500" y="244" text-anchor="end">tolerans, µm (logaritmik)</text>
        <text class="ax-lbl" x="44" y="16" text-anchor="start">göreli maliyet</text>
        <path class="cost-curve" d="${path}"/>
        ${bands}
        <line class="cost-marker" x1="${x(t)}" y1="${y(c)}" x2="${x(t)}" y2="210"/>
        <circle class="cost-dot" cx="${x(t)}" cy="${y(c)}" r="6"/>`;
    }
    el.querySelector('[data-t]').oninput = draw;
    draw();
  }

  // --- slide 4: the golden rule ---
  function slideRule(el, api) {
    el.innerHTML = `
      <p class="kicker">4 · Altın kural</p>
      <h3>Tolerans, fonksiyonun izin verdiği kadar geniş olmalı</h3>
      <p>Tolerans tasarımcı ile üretici arasındaki sözleşmedir. Doğru tolerans “olabildiğince dar” değil, <b>parçanın görevini hâlâ garanti eden en geniş</b> değerdir.</p>
      <div class="rule-grid">
        <div class="rule bad"><h4>Gereğinden dar</h4><ul><li>Pahalı süreç, yavaş üretim</li><li>Yüksek hurda oranı</li><li>Gereksiz muayene yükü</li></ul></div>
        <div class="rule good"><h4>Fonksiyondan türetilmiş</h4><ul><li>Montaj ve çalışma garanti</li><li>En ucuz yeterli süreç</li><li>Tedarikçiler arası değiştirilebilirlik</li></ul></div>
        <div class="rule bad"><h4>Gereğinden geniş</h4><ul><li>Montajda sıkışma ya da boşluk</li><li>Sahada arıza, iade</li><li>Güvenilmez ürün</li></ul></div>
      </div>
      <p>Sıradaki adımda bunu kendin deneyeceksin: bir mil-burç montajı ancak boşluk <b>10–60 µm</b> arasındaysa çalışıyor. Toleransları, süreçleri ve muayeneyi sen seçeceksin.</p>
      <button class="btn" data-go>Simülatöre geç →</button>`;
    el.querySelector('[data-go]').onclick = api.next;
  }

  // ======================================================================
  // OYNA — assembly simulator
  // ======================================================================
  const AX = { hole: [-40, 100], shaft: [-110, 40], clr: [-40, 140] };

  function maxBin(data, [a, b]) {
    const bins = new Array(Math.ceil((b - a) / 2)).fill(0);
    data.forEach((v) => { const i = Math.floor((v - a) / 2); if (i >= 0 && i < bins.length) bins[i]++; });
    return Math.max(1, ...bins);
  }

  function histSVG({ axis: [a, b], data = [], count = 0, zone, ymax = 1, fit = false }) {
    const x = (v) => 20 + ((v - a) / (b - a)) * 560;
    const nb = Math.ceil((b - a) / 2);
    const bins = new Array(nb).fill(0);
    for (let i = 0; i < count; i++) {
      const k = Math.floor((data[i] - a) / 2);
      if (k >= 0 && k < nb) bins[k]++;
    }
    let pin = '', pout = '';
    bins.forEach((n, k) => {
      if (!n) return;
      const v0 = a + k * 2, h = (n / ymax) * 74;
      const seg = `M${x(v0) + 0.6} 95V${(95 - h).toFixed(1)}H${x(v0 + 2) - 0.6}V95Z`;
      if (v0 + 1 >= zone.lo && v0 + 1 <= zone.hi) pin += seg; else pout += seg;
    });
    const ticks = [];
    for (let v = Math.ceil(a / 20) * 20; v <= b; v += 20) {
      ticks.push(`<line class="ax-tick" x1="${x(v)}" y1="95" x2="${x(v)}" y2="99"/><text class="ax-lbl" x="${x(v)}" y="111" text-anchor="middle">${v > 0 ? '+' : ''}${String(v).replace('-', '−')}</text>`);
    }
    const zl = GDT.clamp(x(zone.lo), 20, 580), zh = GDT.clamp(x(zone.hi), 20, 580);
    return `
      <rect class="${fit ? 'zone-fit' : 'zone'}" x="${zl}" y="8" width="${Math.max(0, zh - zl)}" height="87"/>
      <line class="zone-edge" x1="${zl}" y1="8" x2="${zl}" y2="95"/><line class="zone-edge" x1="${zh}" y1="8" x2="${zh}" y2="95"/>
      <path class="bar-in" d="${pin}"/><path class="bar-out" d="${pout}"/>
      <line class="ax" x1="20" y1="95" x2="580" y2="95"/>
      ${ticks.join('')}`;
  }

  function oyna(el, api) {
    const P = { Th: 30, Ts: 30, procH: 1, procS: 1, inspect: false, drift: 0, N: 500 };
    const runs = [];
    let anim = 0, last = null;

    const partCtl = (kind, title) => {
      const tk = kind === 'hole' ? 'Th' : 'Ts', pk = kind === 'hole' ? 'procH' : 'procS';
      return `
        <div class="ctl-block" data-part="${kind}">
          <h4>${title}</h4>
          <label class="slider"><span>Tolerans <output class="mono" data-o="${tk}"></output></span>
            <input type="range" min="4" max="60" step="2" value="${P[tk]}" data-k="${tk}"></label>
          <div class="lim mono" data-lim="${kind}"></div>
          <span class="lbl">Süreç</span>
          <div class="proc">${Sim0.PROCESSES.map((p, i) => `
            <button data-k="${pk}" data-v="${i}"><b>${kind === 'hole' ? p.hole : p.shaft}</b><small class="mono">σ ${N(p.sigma, 1)} µm · ₺${p.cost}</small></button>`).join('')}
          </div>
        </div>`;
    };
    const kpi = (k, label) => `<div class="kpi" data-kpi="${k}"><small>${label}</small><b class="mono">—</b><span class="kpi-sub"></span></div>`;
    const chart = (k, title) => `
      <div class="chart" data-c="${k}">
        <div class="chart-h"><b>${title}</b><span class="mono zone-lbl"></span></div>
        <svg viewBox="0 0 600 116" preserveAspectRatio="none"></svg>
      </div>`;

    el.innerHTML = `
      <div class="card brief">
        <div>
          <p class="kicker">Görev</p>
          <h3>Ø20 mil-burç montajı</h3>
          <p>Mil burcun içinde dönecek. Çalışması için çaptaki <b>boşluk 10–60 µm</b> arasında olmalı: daha azı sıkışır, fazlası sallanır. ${P.N} delik ve ${P.N} mil üret, rastgele eşleştir. Hedef: <b>sıfır fonksiyon hatası</b> ve <b>çalışan montaj başına en düşük maliyet</b>. Çalışmayan her montaj ₺${Sim0.FAIL_COST}’a mal olur (iade, söküm).</p>
        </div>
        <ol class="stars-list">${Sim0.STARS.map((s, i) => `<li data-star="${i}"><span class="star">★</span><span>${s.text}</span></li>`).join('')}</ol>
      </div>
      <div class="sim">
        <div class="card sim-ctl">
          ${partCtl('hole', 'Delik (burç)')}
          ${partCtl('shaft', 'Mil')}
          <div class="ctl-block">
            <h4>Atölye</h4>
            <label class="switch"><input type="checkbox" data-k="inspect"><span class="sw"></span><span>%100 muayene <small>₺${Sim0.INSPECT_COST}/parça, toleranstan çıkanı ayırır</small></span></label>
            <label class="slider"><span>Tezgâh ayar kayması (mil) <output class="mono" data-o="drift"></output></span>
              <input type="range" min="0" max="15" step="1" value="0" data-k="drift"></label>
          </div>
          <div class="cost-pre"></div>
          <button class="btn big run" data-run>▶ ${P.N} çift üret</button>
        </div>
        <div class="sim-out">
          <div class="kpis">
            ${kpi('scrap', 'Hurda')}${kpi('asm', 'Montaj')}${kpi('ok', 'Çalışan')}
            ${kpi('tight', 'Sıkışan')}${kpi('loose', 'Boşluklu')}${kpi('unit', '₺ / çalışan montaj')}
          </div>
          <div class="card charts">
            ${chart('hole', 'Delik çapı, 20 mm’den sapma (µm)')}
            ${chart('shaft', 'Mil çapı, 20 mm’den sapma (µm)')}
            ${chart('clr', 'Montaj boşluğu (µm): yeşil bant çalışma penceresi')}
          </div>
          <div class="card fit">
            <svg class="fit-svg" viewBox="0 0 200 200" role="img" aria-label="Montaj kesiti"></svg>
            <div class="fit-side">
              <p class="kicker">Montaj hattı</p>
              <p class="fit-state">Üretimi başlat, montajlar burada görünecek.</p>
              <div class="strip"></div>
              <p class="muted small">Kesitte boşluk abartılı çizildi.</p>
            </div>
          </div>
          <div class="feedback"></div>
          <div class="card runs" hidden>
            <h4>Deneme geçmişi</h4>
            <div class="table-wrap"><table>
              <thead><tr><th>#</th><th>Delik</th><th>Mil</th><th>Muayene</th><th>Kayma</th><th>Hata</th><th>₺/çalışan</th><th>★</th></tr></thead>
              <tbody></tbody>
            </table></div>
          </div>
        </div>
      </div>`;

    const $ = (s) => el.querySelector(s);
    const limText = (z) => `Ø20 ${z.hi === 0 ? '0' : GDT.signed(z.hi / 1000)} / ${z.lo === 0 ? '0' : GDT.signed(z.lo / 1000)}`;

    function syncControls() {
      const z = Sim0.zones(P);
      $('[data-o="Th"]').textContent = `${P.Th} µm`;
      $('[data-o="Ts"]').textContent = `${P.Ts} µm`;
      $('[data-o="drift"]').textContent = `${P.drift} µm`;
      $('[data-lim="hole"]').innerHTML = `${limText(z.hole)} <small>(${N(20 + z.hole.lo / 1000)} – ${N(20 + z.hole.hi / 1000)})</small>`;
      $('[data-lim="shaft"]').innerHTML = `${limText(z.shaft)} <small>(${N(20 + z.shaft.lo / 1000)} – ${N(20 + z.shaft.hi / 1000)})</small>`;
      el.querySelectorAll('.proc button').forEach((b) => b.classList.toggle('on', P[b.dataset.k] === +b.dataset.v));
      $('[data-k="inspect"]').checked = P.inspect;
      const ph = Sim0.PROCESSES[P.procH], ps = Sim0.PROCESSES[P.procS];
      const per = ph.cost + ps.cost + (P.inspect ? 2 * Sim0.INSPECT_COST : 0);
      $('.cost-pre').innerHTML = `
        <div><small>Çift başı üretim</small><b class="mono">₺${per}</b></div>
        <div><small>Parti (${P.N} çift)</small><b class="mono">₺${(per * P.N).toLocaleString('tr-TR')}</b></div>
        <div><small>Tolerans toplamı</small><b class="mono">${P.Th + P.Ts} µm</b></div>`;
      if (!anim) drawCharts(last);
    }

    function drawCharts(res, k = res ? P.N : 0, ka = res ? res.assemblies : 0, ymax) {
      const z = res ? { hole: res.hole, shaft: res.shaft } : Sim0.zones(P);
      const ym = ymax || (res ? { hole: maxBin(res.H, AX.hole), shaft: maxBin(res.S, AX.shaft), clr: maxBin(res.C, AX.clr) } : { hole: 1, shaft: 1, clr: 1 });
      $('[data-c="hole"] svg').innerHTML = histSVG({ axis: AX.hole, data: res ? res.H : [], count: k, zone: z.hole, ymax: ym.hole });
      $('[data-c="shaft"] svg').innerHTML = histSVG({ axis: AX.shaft, data: res ? res.S : [], count: k, zone: z.shaft, ymax: ym.shaft });
      $('[data-c="clr"] svg').innerHTML = histSVG({ axis: AX.clr, data: res ? res.C : [], count: ka, zone: { lo: Sim0.FIT.min, hi: Sim0.FIT.max }, ymax: ym.clr, fit: true });
      $('[data-c="hole"] .zone-lbl').textContent = `bölge ${GDT.signed(z.hole.lo, 0)}…${GDT.signed(z.hole.hi, 0)}`;
      $('[data-c="shaft"] .zone-lbl').textContent = `bölge ${GDT.signed(z.shaft.lo, 0)}…${GDT.signed(z.shaft.hi, 0)}`;
      $('[data-c="clr"] .zone-lbl').textContent = `pencere +${Sim0.FIT.min}…+${Sim0.FIT.max}`;
    }

    function drawFit(c) {
      const svg = $('.fit-svg');
      if (c == null) { svg.innerHTML = '<circle cx="100" cy="100" r="88" class="fit-bush"/><circle cx="100" cy="100" r="66" class="fit-hole"/>'; return; }
      const R = 66, r = R - c * 0.32;
      const st = c < 0 ? 'jam' : c < Sim0.FIT.min ? 'tight' : c > Sim0.FIT.max ? 'loose' : 'ok';
      const cy = st === 'loose' ? 100 + (R - r) : 100;
      svg.innerHTML = `
        <defs><pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="6" class="hatch-line"/></pattern></defs>
        <circle cx="100" cy="100" r="88" class="fit-bush"/>
        <circle cx="100" cy="100" r="88" fill="url(#hatch)"/>
        <circle cx="100" cy="100" r="${R}" class="fit-hole"/>
        <g class="${st === 'loose' ? 'wobble' : ''}"><circle cx="100" cy="${cy}" r="${r}" class="fit-shaft ${st}"/>
        <path d="M${100 - r * 0.6} ${cy}h${r * 1.2}M100 ${cy - r * 0.6}v${r * 1.2}" class="fit-cl"/></g>`;
      const txt = {
        ok: `Çalışıyor ✓ boşluk <b class="mono">${Math.round(c)} µm</b>`,
        tight: `Çok sıkı: boşluk <b class="mono">${Math.round(c)} µm</b>, sürtünür ve ısınır`,
        jam: `Girmiyor! Girişim <b class="mono">${Math.round(-c)} µm</b>`,
        loose: `Çok boşluklu: <b class="mono">${Math.round(c)} µm</b>, mil sallanıyor`,
      }[st];
      $('.fit-state').innerHTML = txt;
    }

    function drawStrip(C, n) {
      const from = Math.max(0, n - 48);
      $('.strip').innerHTML = C.slice(from, n).map((c) =>
        `<i class="${c < Sim0.FIT.min ? 'tight' : c > Sim0.FIT.max ? 'loose' : 'ok'}"></i>`).join('');
    }

    function setKpis(res, f) {
      const set = (k, val, sub = '', cls = '') => {
        const box = $(`[data-kpi="${k}"]`);
        box.querySelector('b').textContent = val;
        box.querySelector('.kpi-sub').textContent = sub;
        box.className = `kpi ${cls}`;
      };
      const r = (v) => Math.round(v * f);
      if (P.inspect) set('scrap', r(res.scrapH + res.scrapS), `delik ${r(res.scrapH)} · mil ${r(res.scrapS)}`);
      else set('scrap', '—', 'muayene yok');
      set('asm', r(res.assemblies), res.spare ? `${res.spare} sağlam parça eşsiz kaldı` : '');
      set('ok', r(res.working), res.assemblies ? `%${Math.round((res.working / res.assemblies) * 100)}` : '', 'good');
      set('tight', r(res.tight), '', res.tight ? 'bad' : '');
      set('loose', r(res.loose), '', res.loose ? 'bad' : '');
      if (f < 1) set('unit', '…', '');
      else set('unit', Number.isFinite(res.unitCost) ? `₺${N(res.unitCost, 2)}` : '—', `parti ₺${Math.round(res.cost).toLocaleString('tr-TR')}`, res.stars ? 'good' : '');
    }

    function feedback(res) {
      const msgs = [];
      const sumT = P.Th + P.Ts, win = Sim0.FIT.max - Sim0.FIT.min;
      const scrapRate = P.inspect ? (res.scrapH + res.scrapS) / (2 * P.N) : 0;
      if (res.fails && P.inspect && sumT > win) {
        msgs.push(['bad', `Muayeneden geçen parçalar bile <b>${res.fails}</b> çalışmayan montaj verdi. Delik ve mil toleranslarının toplamı <b>${sumT} µm</b>, fonksiyon penceresi ise yalnızca <b>${win} µm</b> (${Sim0.FIT.max} − ${Sim0.FIT.min}). En kötü durumda boşluk ${N(Sim0.CENTER - sumT / 2, 0)}…${N(Sim0.CENTER + sumT / 2, 0)} µm olabilir.`]);
      }
      if (res.fails && !P.inspect) {
        msgs.push(['bad', `Muayene yok: toleranstan çıkan parçalar doğrudan montaja gitti ve <b>${res.fails}</b> montaj çalışmadı (her biri ₺${Sim0.FAIL_COST}).`]);
      }
      if (P.drift > 0 && res.tight > 0) {
        msgs.push(['warn', `Tezgâh ${P.drift} µm kaymış: miller büyük çıkıyor, boşluk daralıyor. Süreci tolerans bölgesinin ortasına ayarlamak bedava kalitedir.`]);
      }
      if (scrapRate > 0.25) {
        msgs.push(['warn', `Parçaların <b>%${Math.round(scrapRate * 100)}</b>’i hurdaya gitti. Süreç yayılımı (±3σ) toleransa göre çok geniş. Ya daha hassas süreç seç ya da fonksiyon izin veriyorsa toleransı genişlet.`]);
      }
      if (!res.fails && sumT < win - 10) {
        msgs.push(['info', `Sıfır hata, ama tolerans toplamı ${sumT} µm. Fonksiyonun izin verdiği ${win} µm’nin ${win - sumT} µm’sini kullanmıyorsun; genişletirsen daha ucuz üretebilirsin.`]);
      }
      if (!res.fails && res.stars < 3) msgs.push(['info', 'Sıfır hata! Şimdi maliyeti düşürmeyi dene: süreç, tolerans ve muayene dengesini değiştir.']);
      if (res.stars === 3) msgs.push(['ok', 'Mükemmel denge: fonksiyon penceresini tam kullandın, en ucuz yeterli süreçle ürettin ve kötü parçayı muayenede yakaladın. Tolerans tasarımı tam olarak budur.']);
      $('.feedback').innerHTML = msgs.map(([k, m]) => `<div class="msg ${k}">${m}</div>`).join('');
    }

    function syncStars() {
      const best = GDT.store.data.stars.m0 || 0;
      el.querySelectorAll('.stars-list li').forEach((li, i) => li.classList.toggle('got', i < best));
    }

    function finish(res) {
      anim = 0;
      last = res;
      $('[data-run]').disabled = false;
      setKpis(res, 1);
      feedback(res);
      const prev = GDT.store.data.stars.m0 || 0;
      if (res.stars > prev) { GDT.store.data.stars.m0 = res.stars; GDT.store.save(); }
      for (let i = 1; i <= res.stars; i++) GDT.award(`m0.star${i}`, 10, `Simülatör ${i}. yıldız`);
      syncStars();
      if (res.stars >= 1) api.done();
      runs.unshift({ ...P, res });
      if (runs.length > 8) runs.pop();
      $('.runs').hidden = false;
      $('.runs tbody').innerHTML = runs.map((r, i) => `
        <tr class="${r.res.stars ? 'good' : ''}">
          <td>${runs.length - i}</td>
          <td>${r.Th} µm · ${Sim0.PROCESSES[r.procH].hole}</td>
          <td>${r.Ts} µm · ${Sim0.PROCESSES[r.procS].shaft}</td>
          <td>${r.inspect ? 'Var' : 'Yok'}</td>
          <td>${r.drift} µm</td>
          <td class="${r.res.fails ? 'bad' : ''}">${r.res.fails}</td>
          <td class="mono">${Number.isFinite(r.res.unitCost) ? N(r.res.unitCost, 2) : '—'}</td>
          <td>${'★'.repeat(r.res.stars) || '·'}</td>
        </tr>`).join('');
    }

    function run() {
      if (anim) cancelAnimationFrame(anim);
      const res = Sim0.run(P);
      const ym = { hole: maxBin(res.H, AX.hole), shaft: maxBin(res.S, AX.shaft), clr: maxBin(res.C, AX.clr) };
      const dur = GDT.reducedMotion() ? 0 : 1500;
      const t0 = performance.now();
      $('[data-run]').disabled = true;
      $('.feedback').innerHTML = '';
      let lastShown = -1;
      const frame = (t) => {
        const f = dur ? Math.min(1, (t - t0) / dur) : 1;
        const e = 1 - (1 - f) ** 2;
        const k = Math.round(e * P.N), ka = Math.round(e * res.assemblies);
        drawCharts(res, k, ka, ym);
        setKpis(res, e);
        drawStrip(res.C, ka);
        // show a new assembly in the cross-section every ~120 ms, not every frame
        const slot = Math.floor((t - t0) / 120);
        if (ka > 0 && (slot !== lastShown || f === 1)) { lastShown = slot; drawFit(res.C[ka - 1]); }
        if (f < 1) anim = requestAnimationFrame(frame);
        else finish(res);
      };
      anim = requestAnimationFrame(frame);
    }

    el.querySelector('.sim-ctl').addEventListener('input', (e) => {
      const k = e.target.dataset.k;
      if (!k) return;
      P[k] = e.target.type === 'checkbox' ? e.target.checked : +e.target.value;
      syncControls();
    });
    el.querySelector('.sim-ctl').addEventListener('click', (e) => {
      const b = e.target.closest('.proc button');
      if (!b) return;
      P[b.dataset.k] = +b.dataset.v;
      syncControls();
    });
    $('[data-run]').onclick = run;
    api.onCleanup(() => cancelAnimationFrame(anim));
    syncControls();
    syncStars();
    drawFit(null);
  }

  // ======================================================================
  // SINA — quiz
  // ======================================================================
  const QUESTIONS = [
    {
      q: 'Bir teknik resimde yalnızca “Ø20” yazıyor; ölçünün yanında tolerans, antette de genel tolerans notu yok. Muayeneci ne yapabilir?',
      options: ['Ø20,000 olmayan her parçayı reddeder', 'Kendi tecrübesine göre ±0,1 kabul eder', 'Kabul/ret kararı veremez; resim eksiktir', 'Parçayı 20 mm’lik bir tampon mastarla dener'],
      answer: 2,
      explain: 'Toleransı belirsiz bir ölçü ile kabul aralığı tanımlanmamış olur. Bu yüzden resimlerde genel tolerans notu (ISO 2768 gibi) bulunur. Bunu Modül 2’de göreceğiz.',
    },
    {
      q: '“Ø20 ±0,010” olarak verilmiş bir mil için hangi aralık kabul edilir?',
      options: ['19,900 – 20,100', '19,990 – 20,010', '20,000 – 20,010', '19,980 – 20,020'],
      answer: 1,
      explain: '±0,010 iki yöne de 0,010 mm sapma demektir: alt sınır 19,990, üst sınır 20,010. Toplam tolerans 0,020 mm.',
    },
    {
      q: 'Bir süreç σ = 5 µm yayılımla üretiyor ve ortalaması tam hedefte. Toleransı ±5 µm verirsen ne olur?',
      options: ['Parçaların neredeyse hepsi geçer', 'Yaklaşık üçte biri tolerans dışına çıkar', 'Yaklaşık yarısı tolerans dışına çıkar', 'Hiçbiri geçmez'],
      answer: 1,
      explain: 'Normal dağılımda ±1σ içinde parçaların yaklaşık %68’i kalır; yani %32’si dışarıda. Hurdayı azaltmak için tolerans en az ±3σ kadar olmalı (%99,73).',
    },
    {
      q: 'Simülatörde muayene açıkken bile çalışmayan montajlar çıktı. En olası sebep hangisi?',
      options: ['Muayene cihazı yanlış ölçüyor', 'Delik ve mil toleranslarının toplamı fonksiyon penceresinden büyük', 'Süreç çok hassas seçilmiş', 'Parti küçük'],
      answer: 1,
      explain: 'Muayene yalnızca toleransa uyan parçaları geçirir. Toleransların kendisi fonksiyondan geniş seçildiyse, iyi parçaların bazı kombinasyonları yine çalışmaz. Tolerans fonksiyondan türetilmelidir.',
    },
    {
      q: 'Değiştirilebilirlik (interchangeability) ne demektir?',
      options: ['Her parçanın karşılığına göre alıştırılması', 'Rastgele seçilen bir milin rastgele seçilen bir delikle seçme yapmadan çalışması', 'Parçaların farklı malzemelerden yapılabilmesi', 'Bir tasarımın farklı tezgâhlarda üretilebilmesi'],
      answer: 1,
      explain: 'Ortak kabul aralıkları sayesinde parçalar seçilmeden, eşlenmeden ve alıştırılmadan birleşir. Seri üretimin ve yedek parçanın temeli budur.',
    },
    {
      q: 'Toleransı 50 µm’den 10 µm’ye daraltmak genellikle neye yol açar?',
      options: ['Maliyet yaklaşık aynı kalır', 'Maliyet doğrusal olarak 5 kat artar', 'Daha hassas bir süreç gerekir ve maliyet orantısızca artar', 'Hurda oranı azalır'],
      answer: 2,
      explain: 'Hassas torna yerine taşlama gibi daha yavaş ve pahalı süreçler gerekir; ölçüm de zorlaşır. Maliyet eğrisi dar toleranslarda dikleşir.',
    },
    {
      q: 'Doğru tolerans felsefesi hangisi?',
      options: ['Her zaman olabildiğince dar', 'Atölyenin en kolay tuttuğu değer', 'Parçanın fonksiyonunu garanti eden en geniş değer', 'Her ölçüye aynı tolerans'],
      answer: 2,
      explain: 'Tolerans, fonksiyonun izin verdiği kadar geniş olmalı. Daha darı para kaybettirir, daha genişi ürünü bozar.',
    },
  ];

  function sina(el, api) {
    el.append(GDT.el(`
      <div class="story card">
        <p class="kicker">Sına</p>
        <p>${QUESTIONS.length} soru. Geçmek için en az ${Math.ceil(QUESTIONS.length * 0.7)} doğru gerekiyor. Her doğru cevap +5 XP; yanlışta açıklamayı oku, istediğin kadar tekrar çözebilirsin.</p>
      </div>`));
    GDT.quiz(el, { id: 'm0.quiz', questions: QUESTIONS, onPass: api.done });
  }

  GDT.registerModule(0, { steps: { sezgi, kavram, oyna, sina } });
})();
