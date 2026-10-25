'use strict';
/* Module 7 — Form toleransları (Sezgi: tilt is not form, Kavram: zones / 3D flatness / lobing / envelope, Oyna: form lab, Sına) */
(() => {
  const N = GDT.num;
  const umTxt = (v) => `${Math.round(v * 10) / 10} µm`.replace('.', ',');

  // Profile plot: x in mm (0..100), y in µm; two parallel lines y = s·x + lo / hi
  function lineSVG(pts, s, { yMin, yMax, tol = null, minW = null } = {}) {
    const X = (x) => 40 + x * 5.2, Y = (y) => 210 - ((y - yMin) / (yMax - yMin)) * 180;
    const { lo, hi, w } = GEO.lineWidth(pts, s);
    const ln = (c, cls) => `<line class="${cls}" x1="${X(0)}" y1="${Y(c)}" x2="${X(100)}" y2="${Y(s * 100 + c)}"/>`;
    const ticks = [];
    for (let v = Math.ceil(yMin / 10) * 10; v <= yMax; v += 10) ticks.push(`<line class="zp-grid" x1="40" y1="${Y(v)}" x2="560" y2="${Y(v)}"/><text class="ax-lbl" x="34" y="${Y(v) + 3}" text-anchor="end">${v}</text>`);
    const ok = tol != null && w <= tol;
    return `
      ${ticks.join('')}
      <path class="mz-band ${tol == null ? '' : ok ? 'ok' : 'bad'}" d="M${X(0)} ${Y(lo)}L${X(100)} ${Y(s * 100 + lo)}L${X(100)} ${Y(s * 100 + hi)}L${X(0)} ${Y(hi)}Z"/>
      ${ln(lo, 'mz-line')}${ln(hi, 'mz-line')}
      <polyline class="prof-line" points="${pts.map((p) => `${X(p.x)},${Y(p.y)}`).join(' ')}"/>
      ${pts.map((p) => `<circle class="prof-pt" cx="${X(p.x)}" cy="${Y(p.y)}" r="3.5"/>`).join('')}
      <text class="ax-lbl" x="560" y="232" text-anchor="end">uzunluk 0–100 mm · komparatör okuması µm</text>
      <text class="ax-lbl strong" x="${X(100) - 4}" y="${Y(s * 100 + hi) - 8}" text-anchor="end">bölge ${umTxt(w)}${minW != null ? ` · en küçük ${umTxt(minW)}` : ''}</text>`;
  }

  // ======================================================================
  // SEZGİ — tilt is not a form error
  // ======================================================================
  function sezgi(el, api) {
    const pts = [];
    for (let x = 0; x <= 100; x += 10) pts.push({ x, y: 0.3 * x + 5 * Math.sin(x / 13 + 0.4) + (x === 60 ? 1.5 : 0) });
    const raw = GEO.spread(pts.map((p) => p.y)).w;
    const mz = GEO.minZoneLine(pts);
    let s = 0, found = false;
    el.innerHTML = `
      <div class="story card">
        <p class="kicker">Durum</p>
        <p>Freze tezgâhının kızak yüzeyi için resimde <b>doğrusallık 0,02</b> isteniyor. Parça granit masada; komparatörü cetvel boyunca kaydırıp 11 nokta okudun. En büyük ile en küçük okuma arasındaki fark <b class="mono">${N(raw / 1000)}</b> mm. Toleransın neredeyse iki katı. Parçayı reddedecek misin?</p>
      </div>
      <div class="card">
        <svg class="mz-svg" viewBox="0 0 580 240" role="img" aria-label="Doğrusallık profili"></svg>
        <label class="slider"><span>İki paralel doğrunun eğimi <output class="mono" data-o></output></span><input type="range" min="-0.2" max="0.8" step="0.005" value="0" data-s></label>
        <p class="hint">Okumalar yatay doğrulara göre alınmış: bölge ${N(raw, 0)} µm. Doğruları döndür, noktaları saran bölge daralıyor mu?</p>
      </div>
      <div class="asks"></div>`;
    const $ = (q) => el.querySelector(q);
    function draw() {
      $('.mz-svg').innerHTML = lineSVG(pts, s, { yMin: -10, yMax: 40, tol: 20 });
      $('[data-o]').textContent = `${N(s * 100, 1)} µm / 100 mm`;
      const w = GEO.lineWidth(pts, s).w;
      if (!found && w <= mz.w + 0.6) {
        found = true;
        $('.hint').innerHTML = `<b>Buldun:</b> noktaları saran en dar bölge <b>${umTxt(mz.w)}</b>. Buna <b>minimum bölge</b> denir.`;
        ask();
      }
    }
    function ask() {
      GDT.ask($('.asks'), {
        q: 'Doğrusallık toleransı 0,02. Parça kabul mü?',
        options: [
          'Ret: okumalar arasında 0,03’ten fazla fark var',
          `Kabul: form hatası ${N(mz.w / 1000)} ≤ 0,02; eğim form hatası değildir`,
          'Ret: eğim de bir doğrusallık hatasıdır',
          'Karar verilemez',
        ],
        answer: 1,
        explain: 'Form toleransı yalnızca elemanın kendi şeklini sınırlar; bölge istediği gibi dönebilir. Okumaların büyük kısmı, parçanın masaya göre eğik durmasından geliyor. O eğimi sınırlamak istiyorsan bir <b>yönelim</b> toleransı (paralellik) gerekir: Modül 8.',
        onDone: () => {
          const take = GDT.el(`
            <div class="takeaway card">
              <p class="kicker">Ana fikir</p>
              <p><b>Form toleransları datum almaz ve bölge serbestçe döner.</b> Değerlendirme, kusurlu elemanı saran en dar bölgeyle yapılır (minimum bölge, ISO 1101 varsayılanı). Ham okumaların farkı, elemanın duruşunu da içerdiği için yanıltır.</p>
              <button class="btn" data-next>Kavram adımına geç →</button>
            </div>`);
          $('.asks').append(take);
          take.querySelector('[data-next]').onclick = api.next;
          api.done();
        },
      });
    }
    $('[data-s]').oninput = (e) => { s = +e.target.value; draw(); };
    draw();
  }

  // ======================================================================
  // KAVRAM
  // ======================================================================
  function kavram(el, api) {
    GDT.carousel(el, [slideZones, slideFlat3D, slideLobes, slideEnvelope], api);
  }

  const ZONES = [
    { k: 'straightness', name: 'Doğrusallık', zone: 'İki paralel doğru (bir kesitte) ya da Ø ile bir silindir (eksen için).', how: 'Cetvel veya granit + komparatör, CMM.' },
    { k: 'flatness', name: 'Düzlemsellik', zone: 'Aralığı t olan iki paralel düzlem.', how: 'Granit masa + komparatör, CMM, optik düz.' },
    { k: 'circularity', name: 'Dairesellik', zone: 'Her kesitte, yarıçap farkı t olan iki eş merkezli daire.', how: 'Dairesellik ölçme cihazı (döner tabla), CMM.' },
    { k: 'cylindricity', name: 'Silindiriklik', zone: 'Yarıçap farkı t olan iki eş eksenli silindir. Dairesellik, doğrusallık ve koniklik birlikte.', how: 'Form ölçme cihazı, CMM.' },
  ];
  function wavy(n, f) { let d = ''; for (let i = 0; i <= n; i++) d += (i ? 'L' : 'M') + f(i / n).map((v) => v.toFixed(1)).join(' '); return d; }
  function zoneArt(k) {
    if (k === 'straightness') {
      return `<rect class="geo-zone" x="30" y="90" width="300" height="34"/>
        <path class="prof-line" d="${wavy(60, (t) => [30 + 300 * t, 107 + 9 * Math.sin(t * 13) + 4 * Math.sin(t * 31)])}"/>
        <text class="ax-lbl strong" x="336" y="111">t</text>`;
    }
    if (k === 'flatness') {
      const P = (x, y, z) => [60 + x * 240 + y * 70, 150 - y * 70 - z];
      const quad = (z) => [P(0, 0, z), P(1, 0, z), P(1, 1, z), P(0, 1, z)].map((p) => p.join(' ')).join('L');
      return `<path class="geo-zone" d="M${quad(-14)}Z"/><path class="geo-zone" d="M${quad(14)}Z"/>
        ${[0.2, 0.4, 0.6, 0.8].map((y) => `<path class="prof-line" d="${wavy(30, (t) => P(t, y, 8 * Math.sin(t * 9 + y * 5)))}"/>`).join('')}
        <text class="ax-lbl strong" x="314" y="150">t</text>`;
    }
    if (k === 'circularity') {
      return `<circle class="geo-zone ring2" cx="180" cy="110" r="74"/><circle class="geo-ring-in" cx="180" cy="110" r="60"/>
        <path class="prof-line" d="${wavy(90, (t) => { const a = t * 2 * Math.PI, r = 67 + 5 * Math.cos(3 * a) + 2 * Math.sin(7 * a); return [180 + r * Math.cos(a), 110 + r * Math.sin(a)]; })}Z"/>
        <text class="ax-lbl strong" x="258" y="60">t (yarıçap farkı)</text>`;
    }
    return `<rect class="geo-zone" x="40" y="46" width="280" height="14"/><rect class="geo-zone" x="40" y="160" width="280" height="14"/>
      <ellipse class="geo-ring-in" cx="40" cy="110" rx="18" ry="64"/><ellipse class="geo-ring-in" cx="320" cy="110" rx="18" ry="64"/>
      <path class="prof-line" d="${wavy(60, (t) => [40 + 280 * t, 53 + 4 * Math.sin(t * 11)])}"/>
      <path class="prof-line" d="${wavy(60, (t) => [40 + 280 * t, 167 + 4 * Math.sin(t * 9 + 1)])}"/>
      <line class="drw-cl" x1="20" y1="110" x2="340" y2="110"/>`;
  }
  function slideZones(el) {
    let k = 'straightness';
    el.innerHTML = `
      <p class="kicker">1 · Dört form karakteristiği</p>
      <h3>Datum yok, yalnızca şekil</h3>
      <div class="seg wrap" data-z>${ZONES.map((z) => `<button data-v="${z.k}">${GDT.sym(z.k, 18)} ${z.name}</button>`).join('')}</div>
      <div class="slide-grid">
        <div class="zone-text"></div>
        <svg class="zone-art" viewBox="0 0 360 220" role="img" aria-label="Form tolerans bölgesi"></svg>
      </div>`;
    const draw = () => {
      const z = ZONES.find((x) => x.k === k);
      el.querySelectorAll('[data-z] button').forEach((b) => b.classList.toggle('on', b.dataset.v === k));
      el.querySelector('.zone-text').innerHTML = `
        <div class="ex-frame">${GDT.fcfHTML({ sym: k, zone: k === 'straightness' ? '' : '', value: 0.02 }, 'big')}</div>
        <p><b>Bölge:</b> ${z.zone}</p><p><b>Datum:</b> almaz. Bölge elemana en iyi oturacak şekilde döner ve kayar.</p><p><b>Ölçüm:</b> ${z.how}</p>`;
      el.querySelector('.zone-art').innerHTML = zoneArt(k);
    };
    el.querySelector('[data-z]').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) { k = b.dataset.v; draw(); } });
    draw();
  }

  function slideFlat3D(el, api) {
    let seed = 1;
    el.innerHTML = `
      <div class="slide-grid">
        <div>
          <p class="kicker">2 · Düzlemsellik</p>
          <h3>Eğri bir yüzeyi iki düzlem arasına sıkıştır</h3>
          <p>Yüzey 9 × 9 noktada ölçüldü (yükseklikler binlerce kez abartılı). Turuncu iki düzlem, bütün noktaları saran en dar paralel düzlem çifti: <b>düzlemsellik hatası</b> aralarındaki mesafedir. Ham yükseklik farkı, yüzeyin masaya göre eğimini de içerir.</p>
          <div class="cost-info flat-info"></div>
          <button class="btn ghost" data-new>Yeni yüzey</button>
          <p class="muted small">Sahneyi sürükleyerek döndür.</p>
        </div>
        <div class="three-host"></div>
      </div>`;
    const sc = GDT.three.create(el.querySelector('.three-host'), { height: 320, dist: 8.5, phi: 1.1 });
    let group = null;
    const build = () => {
      const rnd = (i) => { const x = Math.sin(i * 12.9898 + seed * 78.233) * 43758.5453; return x - Math.floor(x); };
      const pts = [];
      const ta = (rnd(1) - 0.5) * 0.4, tb = (rnd(2) - 0.5) * 0.4; // tilt, µm per mm
      for (let i = 0; i <= 8; i++) for (let j = 0; j <= 8; j++) {
        const x = (i - 4) * 10, y = (j - 4) * 10;
        const z = ta * x + tb * y + 4 * Math.sin(x / 14 + rnd(3) * 6) * Math.cos(y / 17 + rnd(4) * 6) + 2.5 * (rnd(i * 9 + j + 10) - 0.5);
        pts.push({ x, y, z });
      }
      const mz = GEO.minZonePlane(pts);
      const raw = GEO.spread(pts.map((p) => p.z)).w;
      el.querySelector('.flat-info').innerHTML = `
        <div><small>Ham yükseklik farkı</small><b class="mono">${umTxt(raw)}</b></div>
        <div><small>Düzlemsellik (min. bölge)</small><b class="mono good">${umTxt(mz.w)}</b></div>
        <div><small>Eğimden gelen</small><b class="mono">${umTxt(raw - mz.w)}</b></div>`;
      if (!sc) return;
      if (group) sc.scene.remove(group);
      group = new THREE.Group();
      const S = 0.05, H = 0.06; // mm → scene, µm → scene (exaggerated)
      const geo = new THREE.PlaneGeometry(4, 4, 8, 8);
      geo.rotateX(-Math.PI / 2);
      const pos = geo.attributes.position, colors = [];
      const zs = pts.map((p) => p.z), zmin = Math.min(...zs), zmax = Math.max(...zs);
      for (let v = 0; v < pos.count; v++) {
        const x = pos.getX(v) / S, y = -pos.getZ(v) / S;
        const p = pts.reduce((b, q) => (Math.hypot(q.x - x, q.y - y) < Math.hypot(b.x - x, b.y - y) ? q : b));
        pos.setY(v, p.z * H);
        const c = new THREE.Color().setHSL(0.6 - 0.6 * (p.z - zmin) / (zmax - zmin || 1), 0.55, 0.55);
        colors.push(c.r, c.g, c.b);
      }
      geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
      geo.computeVertexNormals();
      group.add(new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6, side: THREE.DoubleSide, flatShading: true })));
      // the two zone planes z = a·x + b·y + c
      const plane = (c) => {
        const g = new THREE.BufferGeometry();
        const corner = (x, y) => [x * S, (mz.a * x + mz.b * y + c) * H, -y * S];
        const v = [corner(-45, -45), corner(45, -45), corner(45, 45), corner(-45, -45), corner(45, 45), corner(-45, 45)].flat();
        g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
        return new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: 0xd24a12, transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false }));
      };
      group.add(plane(mz.lo), plane(mz.hi));
      sc.scene.add(group);
    };
    if (sc) api.onCleanup(() => sc.dispose());
    el.querySelector('[data-new]').onclick = () => { seed++; build(); };
    build();
  }

  function slideLobes(el) {
    let n = 3, a = 8;
    el.innerHTML = `
      <div class="slide-grid">
        <div>
          <p class="kicker">3 · Dairesellik</p>
          <h3>Mikrometrenin göremediği kusur</h3>
          <p>Puntasız taşlamada parçalar sık sık <b>tek sayıda lobla</b> çıkar. Böyle bir parçayı mikrometreyle (iki nokta) hangi yönden ölçersen ölç aynı çapı okursun. Ama parça yuvarlak değildir.</p>
          <label class="slider"><span>Lob sayısı <output class="mono" data-on></output></span><input type="range" min="2" max="7" step="1" value="3" data-n></label>
          <label class="slider"><span>Lob yüksekliği <output class="mono" data-oa></output></span><input type="range" min="2" max="15" step="1" value="8" data-a></label>
          <div class="cost-info lobe-info"></div>
          <p class="callout lobe-note"></p>
        </div>
        <div>
          <svg class="lobe-svg" viewBox="0 0 300 300" role="img" aria-label="Loblu profil"></svg>
          <svg class="dia-svg" viewBox="0 0 300 90" role="img" aria-label="İki noktadan çap"></svg>
        </div>
      </div>`;
    const draw = () => {
      el.querySelector('[data-on]').textContent = n;
      el.querySelector('[data-oa]').textContent = `${a} µm`;
      const R = 10, pts = [], dias = [];
      for (let k = 0; k < 180; k++) {
        const t = (k / 180) * 2 * Math.PI, r = R + (a / 1000) * Math.cos(n * t);
        pts.push({ x: r * Math.cos(t), y: r * Math.sin(t) });
        if (k < 90) dias.push((r + R + (a / 1000) * Math.cos(n * (t + Math.PI)) - 2 * R) * 1000);
      }
      const mz = GEO.minZoneCircle(pts, { x: 0, y: 0 }, 0.01);
      const dr = GEO.spread(dias);
      el.querySelector('.lobe-info').innerHTML = `
        <div><small>Mikrometre (2 nokta), çap değişimi</small><b class="mono ${dr.w < 0.5 ? 'badc' : ''}">${umTxt(dr.w)}</b></div>
        <div><small>Dairesellik (min. bölge)</small><b class="mono good">${umTxt(mz.w * 1000)}</b></div>`;
      el.querySelector('.lobe-note').innerHTML = n % 2
        ? '<b>Tek sayıda lob:</b> karşılıklı iki nokta arası her yönde aynı. Mikrometre kusursuz der; dairesellik ölçme cihazı ya da V-blok gerçeği gösterir.'
        : '<b>Çift sayıda lob:</b> mikrometre çap farkını görür, çünkü lobların tepeleri karşı karşıya gelir.';
      const k = 6; // px per µm
      el.querySelector('.lobe-svg').innerHTML = `
        <circle class="geo-ring-in" cx="150" cy="150" r="${100 - a * k / 2 * 0.0 - (a * k) / 2}"/><circle class="geo-ring-in" cx="150" cy="150" r="${100 + (a * k) / 2}"/>
        <path class="prof-line fill" d="${pts.map((p, i) => { const t = Math.atan2(p.y, p.x), dev = (Math.hypot(p.x, p.y) - R) * 1000; const r = 100 + dev * k / 2; return `${i ? 'L' : 'M'}${(150 + r * Math.cos(t)).toFixed(1)} ${(150 + r * Math.sin(t)).toFixed(1)}`; }).join('')}Z"/>
        <line class="meas-line" x1="${150 - 130}" y1="150" x2="${150 + 130}" y2="150"/>
        <text class="ax-lbl" x="150" y="292" text-anchor="middle">sapmalar abartılı çizildi</text>`;
      const X = (i) => 20 + (i / 89) * 260, Y = (v) => 45 - v * 1.4;
      el.querySelector('.dia-svg').innerHTML = `
        <line class="ax" x1="20" y1="45" x2="280" y2="45"/>
        <polyline class="prof-line" points="${dias.map((v, i) => `${X(i)},${Y(v)}`).join(' ')}"/>
        <text class="ax-lbl" x="20" y="86">mikrometre okuması, 0–180° döndürürken (µm)</text>`;
    };
    el.querySelector('[data-n]').oninput = (e) => { n = +e.target.value; draw(); };
    el.querySelector('[data-a]').oninput = (e) => { a = +e.target.value; draw(); };
    draw();
  }

  function slideEnvelope(el) {
    let bow = 0.02, env = false;
    el.innerHTML = `
      <div class="slide-grid">
        <div>
          <p class="kicker">4 · Boyut ve form</p>
          <h3>Zarf gerekliliği Ⓔ</h3>
          <p>Mil <b class="mono">Ø20 h7</b> (19,979 – 20,000). Her yerel çap 19,990; ama mil eğri. ISO 8015’e göre boyut toleransı formu sınırlamaz. Ölçünün yanına <b>Ⓔ</b> eklenirse mil, maksimum malzeme boyutundaki (20,000) kusursuz bir silindirden taşamaz.</p>
          <label class="slider"><span>Eğrilik <output class="mono" data-o></output></span><input type="range" min="0" max="0.05" step="0.002" value="0.02" data-b></label>
          <label class="switch"><input type="checkbox" data-e><span class="sw"></span><span>Ø20 h7 <b>Ⓔ</b> <small>zarf gerekliliği (ISO 14405-1)</small></span></label>
          <div class="cost-info env-info"></div>
        </div>
        <svg class="env-svg" viewBox="0 0 340 200" role="img" aria-label="Eğri mil ve zarf"></svg>
      </div>`;
    const draw = () => {
      el.querySelector('[data-o]').textContent = `${N(bow)} mm`;
      const mating = 19.99 + bow, ok = !env || mating <= 20.0 + 1e-9;
      el.querySelector('.env-info').innerHTML = `
        <div><small>Yerel çaplar</small><b class="mono good">19,990 ✓</b></div>
        <div><small>Zarf (takılma çapı)</small><b class="mono">${N(mating)}</b></div>
        <div><small>Karar</small><b class="${ok ? 'good' : 'badc'}">${ok ? 'Kabul' : 'Ret: zarf aşıldı'}</b></div>`;
      const k = 1400, yc = (x) => 100 - bow * k * (1 - ((x - 170) / 140) ** 2);
      let top = '', bot = '';
      for (let x = 30; x <= 310; x += 5) { top += `${x === 30 ? 'M' : 'L'}${x} ${yc(x) - 40}`; bot = `L${x} ${yc(x) + 40}` + bot; }
      const half = 40 + (20 - 19.99) * k / 2;
      svg.innerHTML = `
        ${env ? `<rect class="env-box" x="25" y="${100 - half - 0.0}" width="290" height="${2 * half}"/>` : ''}
        <path class="drw-obj ${ok ? '' : 'jam-part'}" d="${top}${bot}Z"/>
        <text class="ax-lbl" x="20" y="194">${env ? 'kesikli: Ø20,000 kusursuz silindir (zarf)' : 'zarf kontrolü yok'} · eğrilik abartılı</text>`;
    };
    const svg = el.querySelector('.env-svg');
    el.querySelector('[data-b]').oninput = (e) => { bow = +e.target.value; draw(); };
    el.querySelector('[data-e]').onchange = (e) => { env = e.target.checked; draw(); };
    draw();
  }

  // ======================================================================
  // OYNA — form lab: fit the zone yourself, then decide
  // ======================================================================
  const ROUNDS = 6;
  const STARS = ['En az 4 doğru karar', 'En az 5 doğru karar', '6 kararın hepsi doğru'];

  // half the rounds pass, so guessing does not pay
  function genLine(tol, want = Math.random() < 0.5) {
    for (;;) {
      const tilt = (Math.random() - 0.3) * 0.5, amp = tol * (0.25 + Math.random() * 0.55), ph = Math.random() * 6, f = 9 + Math.random() * 10;
      const pts = [];
      for (let x = 0; x <= 100; x += 5) pts.push({ x, y: tilt * x + amp * Math.sin(x / f + ph) + (Math.random() - 0.5) * amp * 0.6 });
      const w = GEO.minZoneLine(pts).w;
      if (Math.abs(w - tol) > tol * 0.15 && (w <= tol) === want) return { type: 'line', tol, pts, w };
    }
  }
  function genCircle(tol, want = Math.random() < 0.5) {
    for (;;) {
      const ex = (Math.random() - 0.5) * 50, ey = (Math.random() - 0.5) * 50, n = GDT.pick([2, 3, 4, 5]), a = tol * (0.2 + Math.random() * 0.45);
      const pts = [];
      for (let k = 0; k < 72; k++) {
        const t = (k / 72) * 2 * Math.PI, r = 10000 + a * Math.cos(n * t) + (Math.random() - 0.5) * a * 0.5; // µm
        pts.push({ x: ex + r * Math.cos(t), y: ey + r * Math.sin(t) });
      }
      const mz = GEO.minZoneCircle(pts, { x: 0, y: 0 }, 8);
      if (Math.abs(mz.w - tol) > tol * 0.15 && (mz.w <= tol) === want) return { type: 'circle', tol, pts, w: mz.w, c: mz };
    }
  }

  function oyna(el, api) {
    let round = 0, correct = 0, cur = null, fit = { s: 0, cx: 0, cy: 0 }, drag = null;
    const results = [];
    el.innerHTML = `
      <div class="card brief">
        <div>
          <p class="kicker">Form laboratuvarı</p>
          <h3>Bölgeyi kendin oturt, sonra karar ver</h3>
          <p>Her turda bir ölçüm verisi gelir: bir doğrusallık profili ya da bir dairesellik taraması. <b>Doğrusallıkta</b> doğruları döndür; <b>dairesellikte</b> merkezi sürükle. Bölgeyi olabildiğince daralt ve toleransla karşılaştır.</p>
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
    function width() {
      return cur.type === 'line' ? GEO.lineWidth(cur.pts, fit.s).w : GEO.ringWidth(cur.pts, fit.cx, fit.cy).w;
    }
    function drawPlot(reveal = false) {
      const svg = $('.lab-svg');
      if (cur.type === 'line') {
        const ys = cur.pts.map((p) => p.y);
        svg.setAttribute('viewBox', '0 0 580 240');
        svg.innerHTML = lineSVG(cur.pts, fit.s, { yMin: Math.floor(Math.min(...ys) / 10) * 10 - 5, yMax: Math.ceil(Math.max(...ys) / 10) * 10 + 5, minW: reveal ? cur.w : null });
      } else {
        svg.setAttribute('viewBox', '0 0 300 300');
        const sp = GEO.ringWidth(cur.pts, fit.cx, fit.cy), mean = (sp.lo + sp.hi) / 2;
        const k = cur.k; // px per µm of radial deviation, fixed for the round
        const P = (p) => { const t = Math.atan2(p.y - fit.cy, p.x - fit.cx), r = 100 + (Math.hypot(p.x - fit.cx, p.y - fit.cy) - mean) * k; return [150 + r * Math.cos(t), 150 - r * Math.sin(t)]; };
        const sorted = cur.pts.map((p) => ({ p, t: Math.atan2(p.y - fit.cy, p.x - fit.cx) })).sort((a, b) => a.t - b.t);
        svg.innerHTML = `
          <circle class="mz-ring ${''}" cx="150" cy="150" r="${100 + (sp.hi - mean) * k}"/>
          <circle class="mz-ring" cx="150" cy="150" r="${Math.max(4, 100 + (sp.lo - mean) * k)}"/>
          <path class="prof-line fill" d="${sorted.map((o, i) => `${i ? 'L' : 'M'}${P(o.p).map((v) => v.toFixed(1)).join(' ')}`).join('')}Z"/>
          <g class="ctr"><path d="M142 150h16M150 142v16"/><circle cx="150" cy="150" r="7"/></g>
          <text class="ax-lbl strong" x="150" y="20" text-anchor="middle">bölge ${umTxt(sp.w)}${reveal ? ` · en küçük ${umTxt(cur.w)}` : ''}</text>
          <text class="ax-lbl" x="150" y="294" text-anchor="middle">merkez: X ${N(fit.cx, 1)} µm · Y ${N(fit.cy, 1)} µm · sürükle</text>`;
      }
      $('.lab-w').textContent = umTxt(width());
    }

    function next() {
      if (round >= ROUNDS) return end();
      const tol = GDT.pick([10, 15, 20, 25]);
      cur = round % 2 === 0 ? genLine(tol) : genCircle(tol);
      fit = { s: 0, cx: 0, cy: 0 };
      if (cur.type === 'circle') cur.k = 80 / Math.max(GEO.ringWidth(cur.pts, 0, 0).w, cur.tol);
      header();
      const isLine = cur.type === 'line';
      $('.game-stage').innerHTML = `
        <div class="lab-head">
          ${GDT.fcfHTML({ sym: isLine ? 'straightness' : 'circularity', value: tol / 1000 })}
          <span>Senin bölgen: <b class="mono lab-w"></b></span>
        </div>
        <svg class="lab-svg ${isLine ? '' : 'round'}" role="img" aria-label="Ölçüm verisi"></svg>
        ${isLine
          ? `<label class="slider"><span>Doğruların eğimi</span><input type="range" min="-0.4" max="0.6" step="0.002" value="0" data-fs></label>`
          : '<p class="muted small">Merkez işaretini sürükle: profilin tepeleri ve çukurları ortalandığında halka en ince olur.</p>'}
        <div class="g-actions"><button class="btn ok-btn" data-v="1">✓ Kabul</button><button class="btn bad-btn" data-v="0">✗ Ret</button></div>
        <div class="g-result"></div>`;
      drawPlot();
      if (isLine) $('[data-fs]').oninput = (e) => { fit.s = +e.target.value; drawPlot(); };
      else {
        const svg = $('.lab-svg');
        svg.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, y: e.clientY, cx: fit.cx, cy: fit.cy }; svg.setPointerCapture(e.pointerId); });
        svg.addEventListener('pointermove', (e) => {
          if (!drag) return;
          const sc = 300 / svg.getBoundingClientRect().width;
          fit.cx = drag.cx + (e.clientX - drag.x) * sc * 0.25;
          fit.cy = drag.cy - (e.clientY - drag.y) * sc * 0.25;
          drawPlot();
        });
        svg.addEventListener('pointerup', () => { drag = null; });
      }
      el.querySelectorAll('.g-actions button').forEach((b) => { b.onclick = () => answer(b.dataset.v === '1'); });
    }

    function answer(accept) {
      const truth = cur.w <= cur.tol, ok = accept === truth, mine = width();
      results[round] = ok;
      if (ok) correct++;
      el.querySelectorAll('.g-actions button, [data-fs]').forEach((b) => { b.disabled = true; });
      if (cur.type === 'line') fit.s = GEO.minZoneLine(cur.pts).slope; else { fit.cx = cur.c.cx; fit.cy = cur.c.cy; }
      drawPlot(true);
      const close = mine <= cur.w * 1.08;
      $('.g-result').innerHTML = `
        <div class="msg ${ok ? 'ok' : 'bad'}"><b>${ok ? 'Doğru.' : 'Yanlış.'}</b> Minimum bölge <b>${umTxt(cur.w)}</b>, tolerans ${cur.tol} µm → <b>${truth ? 'kabul' : 'ret'}</b>. ${close ? 'Bölgeyi neredeyse en iyi konuma oturtmuştun.' : `Senin bölgen ${umTxt(mine)} idi; en iyi konuma göre daha geniş. Sahnede şimdi en iyi konum görünüyor.`}</div>
        <button class="btn" data-go>${round + 1 < ROUNDS ? 'Sonraki tur →' : 'Sonucu gör'}</button>`;
      $('[data-go]').onclick = () => { round++; next(); };
      header();
    }

    function end() {
      const stars = correct >= 6 ? 3 : correct >= 5 ? 2 : correct >= 4 ? 1 : 0;
      header();
      if (stars) { GDT.giveStars(7, stars, 'Form laboratuvarı'); api.done(); }
      GDT.syncStars(el, 7);
      $('.game-stage').innerHTML = `
        <div class="quiz-end ${stars ? 'ok' : ''}">
          <div class="quiz-score mono">${correct}<small>/${ROUNDS}</small></div>
          <p>${'★'.repeat(stars) || 'Yıldız yok'} · ${stars === 3 ? 'Kusursuz!' : 'Ham okumaya değil, en dar bölgeye bak.'}</p>
          <button class="btn" data-again>Yeniden oyna</button>
        </div>`;
      $('[data-again]').onclick = () => { round = 0; correct = 0; results.length = 0; next(); };
    }

    GDT.syncStars(el, 7);
    next();
  }

  // ======================================================================
  // SINA
  // ======================================================================
  const QUESTIONS = [
    {
      q: 'Form toleransları için hangisi doğrudur?',
      options: ['Her zaman bir datuma göre tanımlanır', 'Datum almaz; bölge elemana en iyi oturacak şekilde döner ve kayar', 'Yalnızca delikler için kullanılır', 'Boyut toleransının yerine geçer'],
      answer: 1,
      explain: 'Form toleransı yalnızca elemanın kendi şeklini sınırlar.',
    },
    {
      q: 'Granit masada bir yüzeyin okumaları 0,030 mm farklı; minimum bölgeye göre düzlemsellik 0,008. Düzlemsellik toleransı 0,01 ise?',
      options: ['Ret, çünkü 0,030 > 0,01', 'Kabul, çünkü form hatası 0,008', 'Ret, çünkü eğim de sayılır', 'Paralellik ölçülmeden karar verilemez'],
      answer: 1,
      explain: 'Aradaki fark yüzeyin masaya göre eğimidir; eğimi paralellik sınırlar, düzlemsellik değil.',
    },
    {
      q: 'Üç loblu puntasız taşlanmış bir mil mikrometreyle ölçülüyor. Ne görülür?',
      options: ['Çap üç kez değişir', 'Çap her yönde aynı okunur; dairesellik hatası görülmez', 'Mikrometre kusuru iki katı gösterir', 'Ölçüm yapılamaz'],
      answer: 1,
      explain: 'Tek sayıda lobda karşılıklı iki nokta arası sabittir. Dairesellik ölçme cihazı ya da V-blok gerekir.',
    },
    {
      q: 'Dairesellik tolerans bölgesi nedir?',
      options: ['İki paralel düzlem', 'Bir kesitte yarıçap farkı t olan iki eş merkezli daire', 'Çapı t olan bir silindir', 'İki eş eksenli silindir'],
      answer: 1,
      explain: 'İki eş eksenli silindir silindiriklik bölgesidir; dairesellik her kesitte ayrı değerlendirilir.',
    },
    {
      q: 'Silindiriklik hangi kusurları birlikte sınırlar?',
      options: ['Yalnızca dairesellik', 'Dairesellik, doğrusallık ve koniklik', 'Konum ve yönelim', 'Yüzey pürüzlülüğü'],
      answer: 1,
      explain: 'İki eş eksenli silindir bölgesi; kesitlerin yuvarlaklığını, ana doğruların düzlüğünü ve çapın boyunca değişimini birlikte kapsar.',
    },
    {
      q: 'Ø20 h7 Ⓔ yazılmış bir mil için hangisi doğru?',
      options: ['Ⓔ’nin form üzerinde etkisi yoktur', 'Mil, Ø20,000’lik kusursuz bir silindirden taşamaz; eğrilik buna göre sınırlanır', 'Mil her yerde tam Ø20,000 olmalı', 'Ⓔ yalnızca deliklerde kullanılır'],
      answer: 1,
      explain: 'Zarf gerekliliği (ISO 14405-1), ISO 8015 bağımsızlık ilkesini bu eleman için kaldırır.',
    },
    {
      q: 'Bir milin ekseninin doğrusallığı çerçevede nasıl yazılır?',
      options: ['Değerin önünde Ø ile, ok ölçü çizgisi hizasında', 'Ø olmadan, ok yüzeyde', 'Bir datum ile', 'Doğrusallık eksene uygulanamaz'],
      answer: 0,
      explain: 'Eksen için bölge bir silindirdir (Ø) ve ok, türetilmiş elemanı göstermek için ölçü çizgisinin hizasında durur.',
    },
  ];

  function sina(el, api) {
    el.append(GDT.el(`
      <div class="story card">
        <p class="kicker">Sına</p>
        <p>${QUESTIONS.length} soru. Geçmek için en az ${Math.ceil(QUESTIONS.length * 0.7)} doğru gerekiyor. Her doğru cevap +5 XP.</p>
      </div>`));
    GDT.quiz(el, { id: 'm7.quiz', questions: QUESTIONS, onPass: api.done });
  }

  GDT.registerModule(7, { steps: { sezgi, kavram, oyna, sina } });
})();
