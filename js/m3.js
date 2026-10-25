'use strict';
/* Module 3 — Geçmeler ISO 286 (Sezgi: one hole, three shafts; Kavram: 4 slides; Oyna: fit visualizer + tasks; Sına: quiz) */
(() => {
  const N = GDT.num;
  const TYPE = {
    clearance: { name: 'Boşluklu geçme', cls: 'ok' },
    transition: { name: 'Geçiş geçme', cls: 'warn' },
    interference: { name: 'Sıkı geçme', cls: 'bad' },
  };
  const um = (v) => `${v > 0 ? '+' : v < 0 ? '−' : ''}${Math.abs(v)}`;
  const fitCode = (D, h, s) => `Ø${D} ${h.letter}${h.grade}/${s.letter}${s.grade}`;
  // "max clearance 41 / min clearance 7" in plain words
  const fitWords = (f) => {
    if (f.type === 'clearance') return `boşluk ${f.min} … ${f.max} µm`;
    if (f.type === 'interference') return `sıkılık ${-f.max} … ${-f.min} µm`;
    return `en fazla ${f.max} µm boşluk, en fazla ${-f.min} µm sıkılık`;
  };

  // Zone diagram shared by Kavram and Oyna: zones drawn against the zero line
  function zoneSVG(zones, { w = 520, h = 260, scale = null, zeroLabel = '' } = {}) {
    const ext = Math.max(20, ...zones.map((z) => Math.max(Math.abs(z.up), Math.abs(z.lo))));
    const k = scale || (h / 2 - 26) / ext;
    const y0 = h / 2, y = (v) => y0 - v * k;
    const n = zones.length, slot = (w - 60) / n, bw = Math.min(58, slot * 0.62);
    const rects = zones.map((z, i) => {
      const cx = 50 + slot * (i + 0.5);
      return `<g class="zz ${z.kind}${z.on ? ' on' : ''}${z.cls ? ` ${z.cls}` : ''}" data-i="${i}">
        <rect x="${cx - bw / 2}" y="${y(z.up)}" width="${bw}" height="${Math.max(1.5, (z.up - z.lo) * k)}" rx="2"/>
        <text class="zz-lbl" x="${cx}" y="${z.up >= 0 && z.kind === 'hole' ? y(z.up) - 6 : y(z.lo) + 14}" text-anchor="middle">${z.label}</text>
      </g>`;
    }).join('');
    return `<svg class="zone-svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="Tolerans bölgeleri şeması">
      <line class="an-zero" x1="10" y1="${y0}" x2="${w - 10}" y2="${y0}"/>
      <text class="an-lbl" x="12" y="${y0 - 6}">0 ${zeroLabel}</text>
      ${rects}</svg>`;
  }

  // ======================================================================
  // SEZGİ — one measured hole, three functions, choose the shaft
  // ======================================================================
  const HOLE = 20.010;
  const TASKS = [
    { name: 'Dişli mil üzerinde serbestçe dönmeli', lo: 10, hi: 40, hint: 'Rahat bir boşluk: ne sıkışsın ne sallansın.' },
    { name: 'Konum pimi: ne sallansın ne pres gereksin', lo: -5, hi: 5, hint: 'Neredeyse sıfır: elle ya da hafif tokmakla.' },
    { name: 'Rulman iç bileziği: presle, kendi kendine dönmesin', lo: -45, hi: -15, hint: 'Belirgin bir sıkılık, ama aşırı değil.' },
  ];

  function sezgi(el, api) {
    let shaft = 19.985, active = 0, busy = false;
    const solved = new Set();
    el.innerHTML = `
      <div class="story card">
        <p class="kicker">Durum</p>
        <p>Bir burcun deliği ölçüldü: <b class="mono">Ø${N(HOLE)}</b>. Aynı deliğe üç farklı görev için mil yapacaksın. Her görev için mil çapını ayarla ve takmayı dene.</p>
      </div>
      <div class="card fit-bench">
        <div class="fit-tasks">${TASKS.map((t, i) => `<button class="ftask" data-i="${i}"><span class="ftask-n mono">${i + 1}</span><span><b>${t.name}</b><small>${t.hint}</small></span><span class="ftask-ok">✓</span></button>`).join('')}</div>
        <svg class="press-svg" viewBox="0 0 600 210" role="img" aria-label="Milin burca takılması"></svg>
        <div class="fit-ctl">
          <label class="slider"><span>Mil çapı <output class="mono" data-o></output></span><input type="range" min="19.94" max="20.08" step="0.001" value="${shaft}" data-s></label>
          <div class="cost-info fit-read"></div>
          <button class="btn big" data-try>Takmayı dene</button>
        </div>
        <div class="fit-msg"></div>
      </div>
      <div class="asks"></div>`;
    const $ = (s) => el.querySelector(s);
    const clr = () => Math.round((HOLE - shaft) * 1000);

    function drawStatic(offset = 0, state = '') {
      const c = clr();
      const R = 30, r = GDT.clamp(R - c * 0.16, 14, 42);
      $('.press-svg').innerHTML = `
        <defs><pattern id="hatch3" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="7" class="hatch-line"/></pattern></defs>
        <g class="bush"><rect class="fit-bush" x="320" y="40" width="220" height="${110 - R - 40}"/><rect fill="url(#hatch3)" x="320" y="40" width="220" height="${110 - R - 40}"/>
          <rect class="fit-bush" x="320" y="${110 + R}" width="220" height="${180 - 110 - R}"/><rect fill="url(#hatch3)" x="320" y="${110 + R}" width="220" height="${180 - 110 - R}"/></g>
        <line class="drw-cl" x1="10" y1="110" x2="590" y2="110"/>
        <g class="shaft-g ${state}" style="transform: translateX(${offset}px)">
          <rect class="fit-shaft ${c < 0 ? 'jam' : c > 40 ? 'loose' : 'ok'}" x="30" y="${110 - r}" width="260" height="${2 * r}" rx="3"/>
          <path class="fit-cl" d="M36 110h248"/>
        </g>
        <text class="ax-lbl" x="320" y="200">burç Ø${N(HOLE)} · ölçü farkı abartılı çizildi</text>`;
      $('[data-o]').textContent = `Ø${N(shaft)}`;
      $('.fit-read').innerHTML = `
        <div><small>Delik</small><b class="mono">${N(HOLE)}</b></div>
        <div><small>Mil</small><b class="mono">${N(shaft)}</b></div>
        <div><small>${c >= 0 ? 'Boşluk' : 'Sıkılık'}</small><b class="mono ${c >= 0 ? 'good' : 'badc'}">${Math.abs(c)} µm</b></div>`;
      el.querySelectorAll('.ftask').forEach((b) => {
        const i = +b.dataset.i;
        b.classList.toggle('on', i === active);
        b.classList.toggle('done', solved.has(i));
      });
    }

    function tryFit() {
      if (busy) return;
      busy = true;
      const c = clr(), t = TASKS[active];
      const g = () => $('.shaft-g');
      let how, end = 250, dur = 900;
      if (c > 40) how = 'Kolayca girdi ama mil burç içinde <b>sallanıyor</b>.';
      else if (c >= 10) how = 'Elle rahatça girdi ve <b>serbestçe dönüyor</b>.';
      else if (c >= 0) { how = 'Elle iterek kaydı; boşluk çok az, <b>sallanmıyor ama döndürmek zor</b>.'; dur = 1200; }
      else if (c >= -8) { how = 'Elle bastırınca ya da hafif tokmakla girdi; <b>dönmüyor ama sökülebilir</b>.'; dur = 1600; }
      else if (c >= -60) { how = '<b>Pres gerekti.</b> Girdi ve artık yerinden oynamıyor.'; dur = 2200; }
      else { how = '<b>Girmiyor!</b> Bu sıkılık için pres de yetmez; burcu ısıtıp sıcak geçme gerekir.'; end = 18; dur = 500; }
      drawStatic(0, '');
      g().style.transition = 'none';
      requestAnimationFrame(() => {
        g().style.transition = `transform ${GDT.reducedMotion() ? 0 : dur}ms ${c < -8 ? 'linear' : 'ease-out'}`;
        g().style.transform = `translateX(${end}px)`;
        if (c < -8 && c >= -60) $('.press-svg').classList.add('pressing');
      });
      setTimeout(() => {
        $('.press-svg').classList.remove('pressing');
        if (c < -60) g().classList.add('shake');
        else if (c > 40) g().classList.add('wobble-x');
        const ok = c >= t.lo && c <= t.hi;
        if (ok) solved.add(active);
        $('.fit-msg').innerHTML = `<div class="msg ${ok ? 'ok' : 'bad'}">${how} ${ok ? `<b>Görev ${active + 1} tamam.</b>` : `Görev için ${t.lo >= 0 ? `boşluk ${t.lo}–${t.hi} µm` : t.hi <= 0 ? `sıkılık ${-t.hi}–${-t.lo} µm` : `±${t.hi} µm civarı`} gerekiyordu.`}</div>`;
        el.querySelectorAll('.ftask').forEach((b) => b.classList.toggle('done', solved.has(+b.dataset.i)));
        busy = false;
        if (ok) {
          const nextTask = TASKS.findIndex((_, i) => !solved.has(i));
          if (nextTask >= 0) active = nextTask;
          else if (!el.querySelector('.takeaway')) finish();
        }
      }, (GDT.reducedMotion() ? 0 : dur) + 150);
    }

    function finish() {
      const take = GDT.el(`
        <div class="takeaway card">
          <p class="kicker">Ana fikir</p>
          <p><b>Aynı deliğe üç farklı mil: aradaki fark yalnızca birkaç on mikron.</b> Üç ayrı fonksiyonun hepsi bu küçük farkta saklı. Bir üretim resminde bu farkı tarif etmenin standart yolu <b>ISO 286 geçme kodlarıdır</b>: boşluklu, geçiş ve sıkı geçme için H7/g6, H7/k6, H7/p6 gibi.</p>
          <p class="muted">Gerçekte delik de tek bir ölçü değil, bir tolerans bölgesi. İki bölge birlikte geçmenin türünü belirler.</p>
          <button class="btn" data-next>Kavram adımına geç →</button>
        </div>`);
      $('.asks').append(take);
      take.querySelector('[data-next]').onclick = api.next;
      take.scrollIntoView({ block: 'nearest', behavior: GDT.reducedMotion() ? 'auto' : 'smooth' });
      api.done();
    }

    $('[data-s]').oninput = (e) => { shaft = Math.round(+e.target.value * 1000) / 1000; if (!busy) drawStatic(); };
    el.querySelector('.fit-tasks').addEventListener('click', (e) => { const b = e.target.closest('.ftask'); if (b && !busy) { active = +b.dataset.i; drawStatic(); } });
    $('[data-try]').onclick = tryFit;
    drawStatic();
  }

  // ======================================================================
  // KAVRAM
  // ======================================================================
  function kavram(el, api) {
    GDT.carousel(el, [slideIT, slideFD, slideSystem, slidePreferred], api);
  }
  const sizeLabel = (i) => { const [lo, hi] = ISO.SIZES[i]; return i === 0 ? `≤${hi}` : `>${lo}–${hi}`; };

  // --- slide 1: IT grades ---
  function slideIT(el) {
    let grade = 7, D = 20;
    el.innerHTML = `
      <div class="slide-grid">
        <div>
          <p class="kicker">1 · IT tolerans kalitesi</p>
          <h3>Sayı: toleransın genişliği</h3>
          <p>“H7”deki <b>7</b>, tolerans kalitesidir (IT7). Küçük sayı dar tolerans demek. Aynı kalitede tolerans çapla birlikte büyür, çünkü büyük parçayı hem üretmek hem ölçmek zordur.</p>
          <label class="slider"><span>IT kalitesi <output class="mono" data-og></output></span><input type="range" min="5" max="11" step="1" value="7" data-g></label>
          <label class="slider"><span>Nominal çap <output class="mono" data-od></output></span><input type="range" min="1" max="120" step="1" value="20" data-d></label>
          <div class="lin-result it-result"></div>
          <p class="muted small">Her kalite bir öncekinin yaklaşık 1,6 katıdır. Tipik kullanım: IT5–7 hassas geçmeler, IT8–11 genel işler, IT12 ve üstü kaba imalat.</p>
        </div>
        <svg class="it-svg" viewBox="0 0 440 260" role="img" aria-label="IT değerleri grafiği"></svg>
      </div>`;
    const svg = el.querySelector('.it-svg');
    function draw() {
      const vals = ISO.IT[grade], si = ISO.sizeIndex(D), max = Math.max(...vals);
      el.querySelector('[data-og]').textContent = `IT${grade}`;
      el.querySelector('[data-od]').textContent = `Ø${D}`;
      el.querySelector('.it-result').innerHTML = `<span class="mono big">Ø${D} · IT${grade} = ${vals[si]} µm</span> <span class="muted">(${N(vals[si] / 1000)} mm)</span>`;
      const bw = 40, gap = 12, x0 = 30;
      svg.innerHTML = vals.map((v, i) => {
        const hgt = (v / max) * 180, x = x0 + i * (bw + gap);
        return `<g class="itbar${i === si ? ' on' : ''}"><rect x="${x}" y="${210 - hgt}" width="${bw}" height="${hgt}" rx="3"/>
          <text class="ax-lbl strong" x="${x + bw / 2}" y="${204 - hgt}" text-anchor="middle">${v}</text>
          <text class="ax-lbl" x="${x + bw / 2}" y="228" text-anchor="middle">${sizeLabel(i)}</text></g>`;
      }).join('') + `<line class="ax" x1="20" y1="210" x2="430" y2="210"/><text class="ax-lbl" x="430" y="250" text-anchor="end">çap aralığı (mm) · değerler µm</text>`;
    }
    el.querySelector('[data-g]').oninput = (e) => { grade = +e.target.value; draw(); };
    el.querySelector('[data-d]').oninput = (e) => { D = +e.target.value; draw(); };
    draw();
  }

  // --- slide 2: fundamental deviation letters ---
  function slideFD(el) {
    let D = 20, show = 'shaft', sel = 3;
    el.innerHTML = `
      <p class="kicker">2 · Temel sapma</p>
      <h3>Harf: bölgenin sıfır çizgisine göre yeri</h3>
      <p>“g6”daki <b>g</b>, tolerans bölgesinin nominal ölçüye göre nerede durduğunu söyler. Büyük harf delik, küçük harf mil. <b>H</b> deliği sıfır çizgisinden yukarı, <b>h</b> mili sıfırdan aşağı başlar; alfabede ilerledikçe mil bölgesi yukarı çıkar. Bir bölgeye tıkla.</p>
      <div class="fd-ctl">
        <div class="seg" data-show><button data-v="shaft">Miller d…p (IT6)</button><button data-v="hole">Delikler D…JS (IT7)</button></div>
        <label class="slider"><span>Nominal çap <output class="mono" data-od></output></span><input type="range" min="1" max="120" step="1" value="20" data-d></label>
      </div>
      <div class="fd-wrap"></div>
      <div class="lin-result fd-info"></div>`;
    function zones() {
      if (show === 'shaft') return ISO.SHAFT_LETTERS.map((l) => ({ kind: 'shaft', label: `${l}6`, letter: l, grade: 6, ...ISO.shaft(D, l, 6) }));
      return ISO.HOLE_LETTERS.map((l) => ({ kind: 'hole', label: `${l}7`, letter: l, grade: 7, ...ISO.hole(D, l, 7) }));
    }
    function draw() {
      const zs = zones();
      sel = Math.min(sel, zs.length - 1);
      zs[sel].on = true;
      el.querySelectorAll('[data-show] button').forEach((b) => b.classList.toggle('on', b.dataset.v === show));
      el.querySelector('[data-od]').textContent = `Ø${D}`;
      el.querySelector('.fd-wrap').innerHTML = zoneSVG(zs, { w: 600, h: 300, zeroLabel: `= Ø${D}` });
      const z = zs[sel], up = z.kind === 'hole' ? 'ES' : 'es', lo = z.kind === 'hole' ? 'EI' : 'ei';
      el.querySelector('.fd-info').innerHTML = `<span class="mono big">Ø${D} ${z.label}</span>
        <span class="mono">${up} ${um(z.up)} µm · ${lo} ${um(z.lo)} µm</span>
        <span class="mono muted">${N(D + z.lo / 1000)} – ${N(D + z.up / 1000)}</span>`;
    }
    el.querySelector('.fd-wrap').addEventListener('click', (e) => { const g = e.target.closest('.zz'); if (g) { sel = +g.dataset.i; draw(); } });
    el.querySelector('[data-show]').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) { show = b.dataset.v; sel = show === 'shaft' ? 3 : 4; draw(); } });
    el.querySelector('[data-d]').oninput = (e) => { D = +e.target.value; draw(); };
    draw();
  }

  // --- slide 3: hole basis vs shaft basis ---
  function slideSystem(el) {
    let sys = 'hole';
    el.innerHTML = `
      <div class="slide-grid">
        <div>
          <p class="kicker">3 · Geçme sistemi</p>
          <h3>Delik tabanlı mı, mil tabanlı mı?</h3>
          <p><b>Delik tabanlı sistemde</b> delik hep H’dir; geçmenin türünü milin harfi seçer. <b>Mil tabanlı sistemde</b> mil hep h’dir, delik değişir.</p>
          <div class="seg" data-sys><button data-v="hole">Delik tabanlı (H7)</button><button data-v="shaft">Mil tabanlı (h6)</button></div>
          <p class="sys-note callout"></p>
        </div>
        <div class="sys-wrap"></div>
      </div>`;
    const D = 25;
    function draw() {
      el.querySelectorAll('[data-sys] button').forEach((b) => b.classList.toggle('on', b.dataset.v === sys));
      let zs;
      if (sys === 'hole') {
        const H = ISO.hole(D, 'H', 7);
        zs = [{ kind: 'hole', label: 'H7', ...H, on: true }].concat(['f7', 'g6', 'h6', 'k6', 'n6', 'p6'].map((c) => {
          const l = c[0], g = +c[1], f = ISO.fit(D, { letter: 'H', grade: 7 }, { letter: l, grade: g });
          return { kind: 'shaft', label: c, ...f.S, cls: TYPE[f.type].cls };
        }));
        el.querySelector('.sys-note').innerHTML = 'Atölyede en yaygın olanı. Rayba, tampon mastar gibi delik takımları ve kontrol aletleri sabit ölçülüdür; tek bir H7 rayba ile bütün geçmeler yapılır. Mili tornada ya da taşlamada istenen ölçüye getirmek ise kolaydır.';
      } else {
        const S = ISO.shaft(D, 'h', 6);
        zs = [{ kind: 'shaft', label: 'h6', ...S, on: true }].concat(['E8', 'F7', 'G7', 'H7', 'JS7'].map((c) => {
          const l = c.replace(/\d+/, ''), g = +c.match(/\d+/)[0], f = ISO.fit(D, { letter: l, grade: g }, { letter: 'h', grade: 6 });
          return { kind: 'hole', label: c, ...f.H, cls: TYPE[f.type].cls };
        }));
        el.querySelector('.sys-note').innerHTML = 'Bir milin üzerine farklı geçmelerle birçok parça takılacaksa (ör. çekme çelik mil, uzun transmisyon mili) tercih edilir: mil tek parça, hazır ölçüde kalır. Sıkı geçme için K, N, P delikleri de vardır; bu araçta yer almıyor.';
      }
      el.querySelector('.sys-wrap').innerHTML = zoneSVG(zs, { w: 460, h: 280, zeroLabel: `= Ø${D}` }) +
        `<div class="legend"><span class="lg ok">boşluklu</span><span class="lg warn">geçiş</span><span class="lg bad">sıkı</span></div>`;
    }
    el.querySelector('[data-sys]').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) { sys = b.dataset.v; draw(); } });
    draw();
  }

  // --- slide 4: preferred fits ---
  const PREFERRED = [
    { h: ['H', 9], s: ['d', 9], use: 'Serbest çalışma: büyük boşluk, toz ve ısıl genleşmeye tolerans (kaba yataklar, tarım makineleri)' },
    { h: ['H', 8], s: ['f', 7], use: 'Normal dönen geçme: kaymalı yatakta mil (pompa, dişli kutusu)' },
    { h: ['H', 7], s: ['g', 6], use: 'Hassas kayma: yavaş dönme veya kayma, hassas kılavuzlama (kayar dişli)' },
    { h: ['H', 7], s: ['h', 6], use: 'Kayar konumlama: elle takılır, yağlıyken kayar (merkezleme, sökülebilir parçalar)' },
    { h: ['H', 7], s: ['js', 6], use: 'Geçiş: hafif tokmakla, hassas konum (kaplin, kasnak)' },
    { h: ['H', 7], s: ['k', 6], use: 'Geçiş: tokmakla takılır, kama ile sabitlenen kasnak ve dişliler' },
    { h: ['H', 7], s: ['n', 6], use: 'Geçiş, sıkıya yakın: preslenir, burçlar' },
    { h: ['H', 7], s: ['p', 6], use: 'Sıkı: pres geçme yatak burcu; sökülmesi zor, moment iletebilir' },
  ];
  function slidePreferred(el) {
    const D = 25;
    let sel = 2;
    el.innerHTML = `
      <p class="kicker">4 · Tercih edilen geçmeler</p>
      <h3>Her iş için yeni geçme icat etme</h3>
      <p>Firmalar ve kitaplar birkaç <b>tercih edilen geçme</b> kullanır: takım ve mastar sayısı azalır, herkes aynı dili konuşur. Ø${D} için hesaplanmış değerler; bir satıra tıkla.</p>
      <div class="table-wrap"><table class="iso-table pref-table">
        <thead><tr><th>Geçme</th><th>Tür</th><th>Boşluk (µm)</th><th>Kullanım</th></tr></thead>
        <tbody>${PREFERRED.map((p, i) => {
          const f = ISO.fit(D, { letter: p.h[0], grade: p.h[1] }, { letter: p.s[0], grade: p.s[1] });
          return `<tr data-i="${i}"><th class="mono">${p.h.join('')}/${p.s.join('')}</th><td><span class="badge ${TYPE[f.type].cls}">${TYPE[f.type].name.split(' ')[0]}</span></td><td class="mono">${um(f.min)} … ${um(f.max)}</td><td>${p.use}</td></tr>`;
        }).join('')}</tbody>
      </table></div>
      <div class="pref-bar"></div>`;
    function draw() {
      el.querySelectorAll('.pref-table tbody tr').forEach((tr) => tr.classList.toggle('row', +tr.dataset.i === sel));
      const p = PREFERRED[sel];
      const f = ISO.fit(D, { letter: p.h[0], grade: p.h[1] }, { letter: p.s[0], grade: p.s[1] });
      el.querySelector('.pref-bar').innerHTML = rangeBar(f, `Ø${D} ${p.h.join('')}/${p.s.join('')}: ${fitWords(f)}`);
    }
    el.querySelector('.pref-table tbody').addEventListener('click', (e) => { const tr = e.target.closest('tr'); if (tr) { sel = +tr.dataset.i; draw(); } });
    draw();
  }

  // clearance range on a fixed axis, interference to the left of zero
  function rangeBar(f, caption) {
    const a = -80, b = 220, x = (v) => 20 + ((GDT.clamp(v, a, b) - a) / (b - a)) * 560;
    const ticks = [];
    for (let v = -80; v <= 220; v += 40) ticks.push(`<line class="ax-tick" x1="${x(v)}" y1="44" x2="${x(v)}" y2="49"/><text class="ax-lbl" x="${x(v)}" y="62" text-anchor="middle">${um(v)}</text>`);
    return `<p class="small">${caption}</p>
      <svg class="rbar" viewBox="0 0 600 70" role="img" aria-label="Boşluk aralığı">
        <rect class="rb-int" x="20" y="14" width="${x(0) - 20}" height="30"/>
        <rect class="rb-clr" x="${x(0)}" y="14" width="${580 - x(0)}" height="30"/>
        <text class="ax-lbl" x="26" y="10">← sıkılık</text><text class="ax-lbl" x="574" y="10" text-anchor="end">boşluk →</text>
        <rect class="rb-fit ${TYPE[f.type].cls}" x="${x(f.min)}" y="20" width="${Math.max(3, x(f.max) - x(f.min))}" height="18" rx="4"/>
        <line class="rb-zero" x1="${x(0)}" y1="8" x2="${x(0)}" y2="50"/>
        <line class="ax" x1="20" y1="44" x2="580" y2="44"/>${ticks.join('')}
      </svg>`;
  }

  // ======================================================================
  // OYNA — fit visualizer with design tasks
  // ======================================================================
  const FIT_TASKS = [
    { D: 25, title: 'Kayar dişli', text: 'Ø25 milde kayan dişli: boşluk her durumda en az 5, en çok 50 µm.', check: (f) => f.min >= 5 && f.max <= 50 },
    { D: 40, title: 'Merkezleme pimi', text: 'Ø40 merkezleme: geçiş geçme; en büyük boşluk ve en büyük sıkılık 25 µm’yi geçmesin.', check: (f) => f.type === 'transition' && f.max <= 25 && -f.min <= 25 },
    { D: 60, title: 'Pres burç', text: 'Ø60 burç: her durumda sıkı; sıkılık en az 1, en çok 55 µm.', check: (f) => f.max <= -1 && -f.min <= 55 },
  ];

  function oyna(el, api) {
    const S = { D: 25, h: { letter: 'H', grade: 7 }, s: { letter: 'f', grade: 7 } };
    const solved = new Set(GDT.store.data.best['m3.tasks'] || []);
    el.innerHTML = `
      <div class="card brief">
        <div>
          <p class="kicker">Geçme görselleştirici</p>
          <h3>Geçmeyi kur, sonucu gör</h3>
          <p>Çapı, delik ve mil bölgelerini seç. Bölgeler, sınır ölçüleri ve oluşan boşluk/sıkılık anında hesaplanır. Sağdaki üç tasarım görevini çöz: her görev bir yıldız.</p>
        </div>
        ${GDT.starsHTML(FIT_TASKS.map((t) => `${t.title}: ${t.text}`))}
      </div>
      <div class="sim">
        <div class="card sim-ctl">
          <label class="slider"><span>Nominal çap <output class="mono" data-o="D"></output></span><input type="range" min="1" max="120" step="1" value="25" data-k="D"></label>
          <div class="ctl-block">
            <h4>Delik</h4>
            <div class="seg letters" data-hl>${ISO.HOLE_LETTERS.map((l) => `<button data-v="${l}">${l}</button>`).join('')}</div>
            <div class="seg letters" data-hg>${ISO.GRADES.filter((g) => g >= 6).map((g) => `<button data-v="${g}">${g}</button>`).join('')}</div>
          </div>
          <div class="ctl-block">
            <h4>Mil</h4>
            <div class="seg letters" data-sl>${ISO.SHAFT_LETTERS.map((l) => `<button data-v="${l}">${l}</button>`).join('')}</div>
            <div class="seg letters" data-sg>${ISO.GRADES.map((g) => `<button data-v="${g}">${g}</button>`).join('')}</div>
          </div>
          <p class="muted small">Delik harfleri D…H ve JS; K, N, P delikleri bu araçta yok. Sıkı geçme için delik tabanlı sistemde mil harfini değiştir.</p>
        </div>
        <div class="sim-out">
          <div class="card fit-head">
            <span class="fit-code mono"></span>
            <span class="badge fit-type"></span>
          </div>
          <div class="card fit-diag"></div>
          <div class="kpis kpis4"></div>
          <div class="card fit-range"></div>
          <div class="card fit-tasks2">
            <h4>Tasarım görevleri</h4>
            ${FIT_TASKS.map((t, i) => `<div class="ftask2" data-i="${i}"><div><b>${i + 1}. ${t.title}</b><small>${t.text}</small></div><button class="btn ghost" data-check="${i}">Bu geçmeyle kontrol et</button></div>`).join('')}
            <div class="task-msg"></div>
          </div>
        </div>
      </div>`;
    const $ = (s) => el.querySelector(s);

    function draw() {
      const f = ISO.fit(S.D, S.h, S.s);
      const segOn = (sel, v) => el.querySelectorAll(`${sel} button`).forEach((b) => b.classList.toggle('on', b.dataset.v === String(v)));
      segOn('[data-hl]', S.h.letter); segOn('[data-hg]', S.h.grade); segOn('[data-sl]', S.s.letter); segOn('[data-sg]', S.s.grade);
      $('[data-o="D"]').textContent = `Ø${S.D}`;
      $('.fit-code').textContent = fitCode(S.D, S.h, S.s);
      const t = $('.fit-type');
      t.textContent = TYPE[f.type].name;
      t.className = `badge fit-type ${TYPE[f.type].cls}`;
      $('.fit-diag').innerHTML = zoneSVG([
        { kind: 'hole', label: `${S.h.letter}${S.h.grade}`, ...f.H, on: true },
        { kind: 'shaft', label: `${S.s.letter}${S.s.grade}`, ...f.S, cls: TYPE[f.type].cls },
      ], { w: 520, h: 240, zeroLabel: `= Ø${S.D}` });
      const k = (label, val, sub = '', cls = '') => `<div class="kpi ${cls}"><small>${label}</small><b class="mono">${val}</b><span class="kpi-sub">${sub}</span></div>`;
      $('.kpis4').innerHTML =
        k('Delik sınırları', `${N(S.D + f.H.lo / 1000)} – ${N(S.D + f.H.up / 1000)}`, `ES ${um(f.H.up)} · EI ${um(f.H.lo)} µm`) +
        k('Mil sınırları', `${N(S.D + f.S.lo / 1000)} – ${N(S.D + f.S.up / 1000)}`, `es ${um(f.S.up)} · ei ${um(f.S.lo)} µm`) +
        k(f.max >= 0 ? 'En büyük boşluk' : 'En küçük sıkılık', `${Math.abs(f.max)} µm`, 'büyük delik + küçük mil', f.max >= 0 ? 'good' : 'bad') +
        k(f.min >= 0 ? 'En küçük boşluk' : 'En büyük sıkılık', `${Math.abs(f.min)} µm`, 'küçük delik + büyük mil', f.min >= 0 ? 'good' : 'bad');
      // share of random pairs that end up with clearance, uniform within each zone
      let share = '';
      if (f.type === 'transition') {
        let c = 0;
        for (let i = 0; i < 4000; i++) {
          const hv = f.H.lo + Math.random() * (f.H.up - f.H.lo), sv = f.S.lo + Math.random() * (f.S.up - f.S.lo);
          if (hv - sv >= 0) c++;
        }
        share = `<p class="muted small">Geçiş geçmede rastgele eşleşen her 100 çiftten yaklaşık <b>${Math.round(c / 40)}</b> tanesi boşluklu, kalanı sıkı çıkar (bölge içinde düzgün dağılım varsayımıyla).</p>`;
      }
      $('.fit-range').innerHTML = rangeBar(f, `${fitCode(S.D, S.h, S.s)}: ${fitWords(f)}`) + share;
      el.querySelectorAll('.ftask2').forEach((d) => d.classList.toggle('done', solved.has(+d.dataset.i)));
      GDT.syncStars(el, 3);
    }

    function check(i) {
      const t = FIT_TASKS[i];
      const msg = $('.task-msg');
      if (S.D !== t.D) { msg.innerHTML = `<div class="msg warn">Bu görev Ø${t.D} için. Önce nominal çapı ${t.D} yap.</div>`; return; }
      const f = ISO.fit(S.D, S.h, S.s);
      if (t.check(f)) {
        solved.add(i);
        GDT.store.data.best['m3.tasks'] = [...solved];
        GDT.store.save();
        GDT.giveStars(3, solved.size, 'Geçme tasarımı');
        api.done();
        msg.innerHTML = `<div class="msg ok"><b>${fitCode(S.D, S.h, S.s)} uygun:</b> ${fitWords(f)}. ${solved.size < FIT_TASKS.length ? 'Sıradaki göreve geç.' : 'Üç görev de tamam!'}</div>`;
      } else {
        msg.innerHTML = `<div class="msg bad"><b>${fitCode(S.D, S.h, S.s)} uymuyor:</b> ${fitWords(f)}. Görev: ${t.text}</div>`;
      }
      draw();
    }

    $('[data-k="D"]').oninput = (e) => { S.D = +e.target.value; draw(); };
    el.querySelector('.sim-ctl').addEventListener('click', (e) => {
      const b = e.target.closest('.seg button');
      if (!b) return;
      const p = b.parentElement.dataset;
      if ('hl' in p) S.h.letter = b.dataset.v;
      if ('hg' in p) S.h.grade = +b.dataset.v;
      if ('sl' in p) S.s.letter = b.dataset.v;
      if ('sg' in p) S.s.grade = +b.dataset.v;
      draw();
    });
    el.querySelector('.fit-tasks2').addEventListener('click', (e) => { const b = e.target.closest('[data-check]'); if (b) check(+b.dataset.check); });
    draw();
  }

  // ======================================================================
  // SINA
  // ======================================================================
  const QUESTIONS = [
    {
      q: 'Ø20 H7/g6 hangi tür geçmedir?',
      options: ['Boşluklu', 'Geçiş', 'Sıkı', 'Bilgi yetersiz'],
      answer: 0,
      explain: 'H7 deliği 0…+21 µm, g6 mili −20…−7 µm. Delik her zaman milden büyük: boşluk 7…41 µm.',
    },
    {
      q: '“H7” ifadesinde H ve 7 neyi belirtir?',
      options: ['H: malzeme sertliği, 7: yüzey kalitesi', 'H: bölgenin konumu (temel sapma), 7: tolerans genişliği (IT kalitesi)', 'H: delik çapı, 7: tolerans mm cinsinden', 'H: yatay eksen, 7: işleme sırası'],
      answer: 1,
      explain: 'Harf, tolerans bölgesinin sıfır çizgisine göre yerini; sayı, IT kalitesini yani bölgenin genişliğini verir.',
    },
    {
      q: 'H deliğinin alt sapması (EI) her çapta kaçtır?',
      options: ['0', 'IT/2', 'Negatif bir değer', 'Çapa göre değişir'],
      answer: 0,
      explain: 'H deliği tam nominal ölçüden başlar ve yukarı doğru tolerans kadar uzanır. Delik tabanlı sistemin temeli budur.',
    },
    {
      q: 'Geçiş geçme ne demektir?',
      options: ['Montajda ısıtma gereken geçme', 'Delik ve mil bölgeleri örtüşür; bir çift boşluklu, başka bir çift sıkı çıkabilir', 'Boşluğun her zaman sıfır olduğu geçme', 'Yalnızca mil tabanlı sistemde olan geçme'],
      answer: 1,
      explain: 'Bölgeler örtüştüğü için hangi çiftin nasıl oturacağı gerçek ölçülere bağlıdır. H7/k6 tipik örnektir.',
    },
    {
      q: 'Delik tabanlı sistem atölyede neden daha yaygındır?',
      options: ['Delikler her zaman daha hassas işlenir', 'Rayba ve tampon mastar gibi delik takımları sabit ölçülüdür; mili istenen ölçüye getirmek daha kolaydır', 'Standart başka sisteme izin vermez', 'Mil tabanlı sistem yalnızca inç ölçülerde kullanılır'],
      answer: 1,
      explain: 'Tek bir H7 rayba ve mastarla birçok farklı geçme kurulabilir; geçmenin türünü mil belirler.',
    },
    {
      q: 'IT7 kalitesinde Ø10 ve Ø100 için tolerans genişliği hakkında hangisi doğru?',
      options: ['İkisi aynıdır', 'Ø100 daha geniştir', 'Ø10 daha geniştir', 'IT kalitesi çapa bağlı değildir'],
      answer: 1,
      explain: 'IT7 Ø10 için 15 µm, Ø100 için 35 µm. Aynı kalitede tolerans çapla büyür.',
    },
    {
      q: 'Ø25 H7 (0…+21 µm) ile p6 (+22…+35 µm) birleşince ne olur?',
      options: ['Boşluk 1…35 µm', 'Her durumda sıkı: sıkılık 1…35 µm', 'Geçiş geçme', 'Sıkılık 22…56 µm'],
      answer: 1,
      explain: 'En büyük delik (21) bile en küçük milden (22) 1 µm küçük; en küçük delik ile en büyük mil arasında 35 µm sıkılık var.',
    },
  ];

  function sina(el, api) {
    el.append(GDT.el(`
      <div class="story card">
        <p class="kicker">Sına</p>
        <p>${QUESTIONS.length} soru. Geçmek için en az ${Math.ceil(QUESTIONS.length * 0.7)} doğru gerekiyor. Her doğru cevap +5 XP.</p>
      </div>`));
    GDT.quiz(el, { id: 'm3.quiz', questions: QUESTIONS, onPass: api.done });
  }

  GDT.registerModule(3, { steps: { sezgi, kavram, oyna, sina } });
})();
