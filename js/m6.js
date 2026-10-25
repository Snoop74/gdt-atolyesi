'use strict';
/* Module 6 — Datumlar ISO 5459 (Sezgi: two inspectors, two setups; Kavram: 3D DOF + 3-2-1 + simulators; Oyna: DOF detective in 3D; Sına) */
(() => {
  const N = GDT.num;
  const COL = { A: 0xd24a12, B: 0x1c7ed6, C: 0x2d8a46, part: 0xb8c2cc, dark: 0x1b2836 };
  const HEX = { A: '#d24a12', B: '#1c7ed6', C: '#2d8a46' };
  const ALL = ['tx', 'ty', 'tz', 'rx', 'ry', 'rz'];

  // ======================================================================
  // SEZGİ — the same part, two setups, two different readings
  // ======================================================================
  const ALPHA = 1;          // real squareness error of the left face, degrees
  const ALPHA_DRAW = 7;     // drawn exaggerated
  function setupPose(which, alphaDeg) {
    return which === 1 ? 0 : (alphaDeg * Math.PI) / 180;
  }
  function holeReading(which) {
    const a = setupPose(which, ALPHA);
    return { x: 30 * Math.cos(a) - 20 * Math.sin(a), y: 30 * Math.sin(a) + 20 * Math.cos(a) };
  }

  function sezgi(el, api) {
    let which = 1, shown = 1, measured = new Set(), asked = false, anim = 0;
    el.innerHTML = `
      <div class="story card">
        <p class="kicker">Durum</p>
        <p>Resimde delik, sol kenardan <b class="mono">30 ±0,2</b> ve alt kenardan <b class="mono">20 ±0,2</b>. İki muayeneci aynı parçayı ölçüyor. Ayşe parçayı önce <b>alt yüzeyine</b> oturtup sola yaslıyor; Mehmet önce <b>sol yüzeyini</b> gönyeye dayayıp aşağı indiriyor. Parçanın sol yüzeyi tam dik değil (çizimde abartılı).</p>
      </div>
      <div class="card">
        <div class="seg" data-w><button data-v="1">Ayşe: önce alt yüzey</button><button data-v="2">Mehmet: önce sol yüzey</button></div>
        <svg class="setup-svg" viewBox="0 0 520 270" role="img" aria-label="İki farklı bağlama"></svg>
        <div class="cost-info setup-read"></div>
        <button class="btn" data-meas>Ölç</button>
      </div>
      <div class="asks"></div>`;
    const $ = (s) => el.querySelector(s);
    const svg = $('.setup-svg');

    function draw(angleDraw) {
      const a = (angleDraw * Math.PI) / 180, k = 3.2, ox = 70, oy = 230;
      const t = Math.tan((ALPHA_DRAW * Math.PI) / 180);
      const P = [[0, 0], [80, 0], [80, 50], [50 * t, 50]];
      const tr = ([x, y]) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];
      const Q = P.map(tr), H = tr([30, 20]);
      const sx = (x) => ox + x * k, sy = (y) => oy - y * k;
      svg.innerHTML = `
        <rect class="fixture" x="20" y="${oy}" width="480" height="18"/>
        <rect class="fixture" x="${ox - 18}" y="40" width="18" height="${oy - 40}"/>
        <text class="ax-lbl" x="${ox + 260}" y="${oy + 32}" text-anchor="middle">ölçme tablası</text>
        <text class="ax-lbl" transform="translate(${ox - 24} 140) rotate(-90)" text-anchor="middle">gönye</text>
        <path class="drw-obj" d="M${Q.map(([x, y]) => `${sx(x)} ${sy(y)}`).join('L')}Z"/>
        <circle class="drw-hole" cx="${sx(H[0])}" cy="${sy(H[1])}" r="${3.2 * 4}"/>
        <path class="drw-cl" d="M${sx(H[0]) - 20} ${sy(H[1])}h40M${sx(H[0])} ${sy(H[1]) - 20}v40"/>
        <line class="meas-line" x1="${ox}" y1="${sy(H[1])}" x2="${sx(H[0])}" y2="${sy(H[1])}"/>
        <line class="meas-line" x1="${sx(H[0])}" y1="${oy}" x2="${sx(H[0])}" y2="${sy(H[1])}"/>
        <text class="ax-lbl" x="20" y="22">diklik hatası ×${ALPHA_DRAW} abartılı · gerçek hata ${ALPHA}°</text>`;
    }
    function readout() {
      const r = holeReading(which);
      const okX = Math.abs(r.x - 30) <= 0.2, okY = Math.abs(r.y - 20) <= 0.2;
      $('.setup-read').innerHTML = measured.has(which)
        ? `<div><small>${which === 1 ? 'Ayşe' : 'Mehmet'} · X</small><b class="mono ${okX ? 'good' : 'badc'}">${N(r.x)}</b></div>
           <div><small>Y</small><b class="mono ${okY ? 'good' : 'badc'}">${N(r.y)}</b></div>
           <div><small>Karar</small><b class="${okX && okY ? 'good' : 'badc'}">${okX && okY ? 'Kabul' : 'Ret'}</b></div>`
        : '<div><small>Ölçüm</small><b class="muted">“Ölç”e bas</b></div>';
    }
    function animateTo(target) {
      cancelAnimationFrame(anim);
      const from = shown, t0 = performance.now(), dur = GDT.reducedMotion() ? 0 : 700;
      const step = (t) => {
        const f = dur ? Math.min(1, (t - t0) / dur) : 1;
        shown = from + (target - from) * (1 - (1 - f) ** 3);
        draw(shown === 1 ? 0 : (shown - 1) * ALPHA_DRAW);
        if (f < 1) anim = requestAnimationFrame(step);
      };
      anim = requestAnimationFrame(step);
    }
    el.querySelector('[data-w]').addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      which = +b.dataset.v;
      el.querySelectorAll('[data-w] button').forEach((x) => x.classList.toggle('on', x === b));
      animateTo(which);
      readout();
    });
    $('[data-meas]').onclick = () => {
      measured.add(which);
      readout();
      if (measured.size === 2 && !asked) {
        asked = true;
        GDT.ask($('.asks'), {
          q: 'Ayşe kabul, Mehmet ret diyor. Hangisi haklı?',
          options: ['Ayşe', 'Mehmet', 'İkisi de kendi bağlamasında doğru ölçtü; resim hangi yüzeyden başlanacağını söylemiyor', 'İkisi de yanlış ölçtü'],
          answer: 2,
          explain: 'İkisi de doğru ölçtü. Kusurlu bir parça, hangi yüzeyi önce dayadığına göre uzayda farklı yerde durur. Resim bunu belirtmezse sonuç muayeneciye kalır. <b>Datumlar ve sıraları</b> tam bunu belirler.',
          onDone: () => {
            const take = GDT.el(`
              <div class="takeaway card">
                <p class="kicker">Ana fikir</p>
                <p><b>Datum sistemi, parçanın ölçüm için uzayda nasıl kilitleneceğini söyler.</b> Çerçevede “| A | B |” yazıyorsa önce A yüzeyi oturtulur, sonra B’ye yaslanır. Ayşe’nin yaptığı buydu. Sıra değişirse, aynı kusurlu parça farklı sonuç verir.</p>
                <button class="btn" data-next>Kavram adımına geç →</button>
              </div>`);
            $('.asks').append(take);
            take.querySelector('[data-next]').onclick = api.next;
            api.done();
          },
        });
      }
    };
    api.onCleanup(() => cancelAnimationFrame(anim));
    el.querySelector('[data-w] button').classList.add('on');
    draw(0);
    readout();
  }

  // ======================================================================
  // 3D part builders
  // ======================================================================
  const T3 = () => GDT.three;
  function darkCyl(r, h, x = 0, y = 0, z = 0) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 32), T3().mat(COL.dark, { roughness: 0.9 }));
    m.position.set(x, y, z);
    return m;
  }
  function buildPart(kind) {
    const g = new THREE.Group();
    const steel = T3().mat(COL.part, { metalness: 0.35 });
    if (kind === 'block') {
      const m = new THREE.Mesh(new THREE.BoxGeometry(4, 1.4, 2.6), steel);
      m.position.y = 0.7;
      g.add(m, darkCyl(0.35, 1.42, 0.6, 0.7, 0.2));
    } else if (kind === 'shaft') {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 4, 40), steel);
      m.position.y = 2;
      const shoulder = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.05, 0.5, 40), steel);
      shoulder.position.y = 2.6;
      // a key on the shoulder makes rotation about the axis visible
      const key = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.52, 0.28), T3().mat(COL.dark));
      key.position.set(0.9, 2.6, 0);
      g.add(m, shoulder, key);
    } else if (kind === 'plate') {
      const m = new THREE.Mesh(new THREE.BoxGeometry(4, 0.5, 3), steel);
      m.position.y = 0.25;
      g.add(m, darkCyl(0.45, 0.52, 0, 0.25, 0), darkCyl(0.18, 0.52, 1.4, 0.25, 0.9), darkCyl(0.18, 0.52, -1.4, 0.25, -0.9));
    } else if (kind === 'flange') {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(1.9, 1.9, 0.6, 56), steel);
      m.position.y = 0.3;
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 48), steel);
      hub.position.y = 1.1;
      g.add(m, hub, darkCyl(0.55, 1.62, 0, 0.8, 0), darkCyl(0.18, 0.62, 1.4, 0.3, 0));
    }
    return g;
  }
  // Datum feature markers: planes for surfaces, rods for axes
  function datumMarker(letter, where) {
    const g = new THREE.Group();
    const mat = new THREE.MeshBasicMaterial({ color: COL[letter], transparent: true, opacity: 0.28, side: THREE.DoubleSide, depthWrite: false });
    const rod = (x, z, h = 5.2) => {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, h, 12), new THREE.MeshBasicMaterial({ color: COL[letter] }));
      m.position.set(x, h / 2 - 0.4, z);
      return m;
    };
    let lab = new THREE.Vector3();
    if (where === 'bottom' || where === 'face') {
      const p = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 5), mat);
      p.rotation.x = -Math.PI / 2;
      p.position.y = -0.01;
      g.add(p);
      lab.set(2.6, 0.1, 2.1);
    } else if (where === 'back') {
      const p = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 3), mat);
      p.position.set(0, 1.4, -1.32);
      g.add(p);
      lab.set(2.6, 2.6, -1.32);
    } else if (where === 'side') {
      const p = new THREE.Mesh(new THREE.PlaneGeometry(5, 3), mat);
      p.rotation.y = Math.PI / 2;
      p.position.set(-2.02, 1.4, 0);
      g.add(p);
      lab.set(-2.02, 2.6, 1.9);
    } else if (where === 'axis' || where === 'bore' || where === 'hole') {
      g.add(rod(0, 0));
      lab.set(0, 5.1, 0);
    } else if (where === 'pin') {
      g.add(rod(1.4, 0, 3));
      lab.set(1.4, 2.9, 0);
    }
    const s = T3().label(letter, HEX[letter], 0.6);
    s.position.copy(lab);
    g.add(s);
    return g;
  }

  // ======================================================================
  // KAVRAM
  // ======================================================================
  function kavram(el, api) {
    GDT.carousel(el, [slideDof, slide321, slideSimulator, slideCommon], api);
  }

  function dofButtons(locked = new Set()) {
    return GDT.DOF.map((d) => `<button class="dof ${locked.has(d.k) ? 'locked' : ''}" data-k="${d.k}"><b class="mono">${d.name}</b><small>${d.text}</small></button>`).join('');
  }

  function slideDof(el, api) {
    el.innerHTML = `
      <div class="slide-grid">
        <div>
          <p class="kicker">1 · Altı serbestlik derecesi</p>
          <h3>Boşlukta duran bir parça nasıl hareket edebilir?</h3>
          <p>Uzaydaki serbest bir cisim üç eksen boyunca <b>kayabilir</b> (T) ve üç eksen etrafında <b>dönebilir</b> (R). Ölçüm yapabilmek için bu altı hareketin hepsini kilitlemek gerekir. Bir harekete tıkla.</p>
          <div class="dofs">${dofButtons()}</div>
          <p class="muted small">Sahneyi sürükleyerek döndürebilirsin. Z yukarı.</p>
        </div>
        <div class="three-host"></div>
      </div>`;
    const sc = GDT.three.create(el.querySelector('.three-host'), { height: 320, dist: 10 });
    if (!sc) return;
    api.onCleanup(() => sc.dispose());
    const part = buildPart('block');
    const holder = new THREE.Group();
    holder.add(part);
    part.position.y = -0.7;
    holder.position.y = 1.2;
    sc.scene.add(holder);
    const gz = GDT.three.dofGizmo(2.8);
    gz.group.position.y = 1.2;
    sc.scene.add(gz.group);
    const base = { pos: holder.position.clone(), rot: holder.rotation.clone() };
    let active = null, t0 = 0;
    sc.onTick((dt, t) => {
      if (!active) return;
      const k = t - t0;
      GDT.dofOffset(holder, active, Math.sin(k * 3.2) * 0.6, base);
      if (k > 4) { active = null; GDT.dofOffset(holder, 'tx', 0, base); ALL.forEach((d) => gz.paint(d, 0x5c6b7a)); }
    });
    el.querySelector('.dofs').addEventListener('click', (e) => {
      const b = e.target.closest('.dof');
      if (!b) return;
      active = b.dataset.k;
      t0 = performance.now() / 1000;
      ALL.forEach((d) => gz.paint(d, d === active ? 0xd24a12 : 0x5c6b7a));
      el.querySelectorAll('.dof').forEach((x) => x.classList.toggle('on', x === b));
    });
  }

  function slide321(el, api) {
    const STEPS = [
      { title: 'Birincil: A', text: 'Parça A yüzeyine oturur. Üç yüksek noktası değer: <b>Tz, Rx, Ry</b> kilitlenir.', lock: ['tz', 'rx', 'ry'] },
      { title: 'İkincil: B', text: 'A üzerinde kalarak B’ye yaslanır. İki nokta değer: <b>Ty, Rz</b> kilitlenir.', lock: ['ty', 'rz'] },
      { title: 'Üçüncül: C', text: 'A ve B’de kalarak C’ye kaydırılır. Bir nokta değer: <b>Tx</b> kilitlenir. Altısı da kilitli.', lock: ['tx'] },
    ];
    let step = 0;
    const locked = new Set();
    el.innerHTML = `
      <div class="slide-grid">
        <div>
          <p class="kicker">2 · 3-2-1 kuralı</p>
          <h3>Üç datum, altı kilit</h3>
          <p>Prizmatik bir parça, birbirine dik üç ideal düzleme sırayla dayanır: <b>birincil 3, ikincil 2, üçüncül 1</b> serbestliği kilitler. Bu ideal düzlemler tezgâhta bir tabla, bir gönye, bir dayamadır: <b>datum simülatörleri</b>.</p>
          <div class="steps321">${STEPS.map((s, i) => `<button class="btn ghost" data-s="${i}">${i + 1}. ${s.title}</button>`).join('')}<button class="btn ghost" data-reset>↺ Baştan</button></div>
          <p class="callout step-note">Parça boşlukta: altı serbestlik açık. Kalan serbest hareketler sahnede sırayla gösterilir.</p>
          <div class="dofs mini"></div>
        </div>
        <div class="three-host"></div>
      </div>`;
    const sc = GDT.three.create(el.querySelector('.three-host'), { height: 340, dist: 12, theta: 0.6 });
    const drawDofs = () => { el.querySelector('.dofs').innerHTML = dofButtons(locked); };
    drawDofs();
    if (!sc) return;
    api.onCleanup(() => sc.dispose());
    sc.orbit.target.set(0, 1, 0);
    sc.place();
    ['bottom', 'back', 'side'].forEach((w, i) => sc.scene.add(datumMarker('ABC'[i], w)));
    // datum planes are placed for a block whose back face sits at z = −1.32 and side at x = −2.02
    const part = buildPart('block');
    const holder = new THREE.Group();
    holder.add(part);
    sc.scene.add(holder);
    const POSES = [
      { pos: new THREE.Vector3(0.6, 1.6, 0.6), rot: new THREE.Euler(0.12, 0.18, -0.1) },
      { pos: new THREE.Vector3(0.6, 0, 0.6), rot: new THREE.Euler(0, 0.18, 0) },
      { pos: new THREE.Vector3(0.6, 0, -0.02), rot: new THREE.Euler(0, 0, 0) },
      { pos: new THREE.Vector3(-0.02, 0, -0.02), rot: new THREE.Euler(0, 0, 0) },
    ];
    const CONTACTS = [
      [[-1.6, 0, -1], [1.6, 0, -1], [0, 0, 1.1]],
      [[-1.4, 0.7, -1.32], [1.4, 0.7, -1.32]],
      [[-2.02, 0.7, 0]],
    ];
    const dots = new THREE.Group();
    sc.scene.add(dots);
    let pose = { pos: POSES[0].pos.clone(), rot: POSES[0].rot.clone() }, anim = null;
    holder.position.copy(pose.pos);
    holder.rotation.copy(pose.rot);
    sc.onTick((dt, t) => {
      if (anim) {
        anim.f = Math.min(1, anim.f + dt / 0.9);
        const e = 1 - (1 - anim.f) ** 3;
        holder.position.lerpVectors(anim.from.pos, anim.to.pos, e);
        holder.rotation.set(
          anim.from.rot.x + (anim.to.rot.x - anim.from.rot.x) * e,
          anim.from.rot.y + (anim.to.rot.y - anim.from.rot.y) * e,
          anim.from.rot.z + (anim.to.rot.z - anim.from.rot.z) * e);
        if (anim.f >= 1) { pose = { pos: anim.to.pos.clone(), rot: anim.to.rot.clone() }; anim = null; }
        return;
      }
      // wiggle the DOFs that are still free, one after another
      const free = ALL.filter((d) => !locked.has(d));
      if (!free.length) { holder.position.copy(pose.pos); holder.rotation.copy(pose.rot); return; }
      const slot = Math.floor(t / 1.6) % free.length, ph = (t % 1.6) / 1.6;
      GDT.dofOffset(holder, free[slot], Math.sin(ph * Math.PI * 2) * 0.22, pose);
      el.querySelectorAll('.dofs .dof').forEach((b) => b.classList.toggle('on', b.dataset.k === free[slot]));
    });
    const goTo = (s) => {
      step = s;
      locked.clear();
      STEPS.slice(0, s).forEach((st) => st.lock.forEach((d) => locked.add(d)));
      anim = { f: 0, from: { pos: holder.position.clone(), rot: holder.rotation.clone() }, to: POSES[s] };
      dots.clear();
      CONTACTS.slice(0, s).flat().forEach(([x, y, z], i) => {
        const m = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 12), new THREE.MeshBasicMaterial({ color: 0xffd43b, depthTest: false }));
        m.position.set(x, y, z);
        m.renderOrder = 6;
        dots.add(m);
      });
      el.querySelector('.step-note').innerHTML = s ? STEPS[s - 1].text : 'Parça boşlukta: altı serbestlik açık.';
      el.querySelectorAll('[data-s]').forEach((b) => b.classList.toggle('on', +b.dataset.s === s - 1));
      drawDofs();
    };
    el.querySelector('.steps321').addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      if ('reset' in b.dataset) goTo(0);
      else {
        const want = +b.dataset.s + 1;
        // datums are applied in order: jumping ahead runs the earlier steps too
        goTo(want);
      }
    });
  }

  function slideSimulator(el) {
    let shape = 'convex', tilt = 0;
    el.innerHTML = `
      <div class="slide-grid">
        <div>
          <p class="kicker">3 · Datum elemanı ve datum</p>
          <h3>Gerçek yüzey kusurludur, datum ideal</h3>
          <p>Resimde üçgenle işaretlenen gerçek yüzey <b>datum elemanıdır</b>. Ölçümde onun yerine, yüzeye malzeme dışından değen ideal bir düzlem kullanılır: <b>datum</b>. Atölyede bu düzlemi ölçme tablası gibi bir <b>simülatör</b> temsil eder.</p>
          <div class="seg" data-sh><button data-v="wavy">Dalgalı yüzey</button><button data-v="convex">Dışbükey yüzey</button></div>
          <label class="slider sim-tilt"><span>Parçayı salla <output class="mono" data-o></output></span><input type="range" min="-6" max="6" step="0.5" value="0" data-t></label>
          <p class="callout sim-note"></p>
        </div>
        <svg class="sim-svg" viewBox="0 0 340 220" role="img" aria-label="Datum elemanı ve simülatör"></svg>
      </div>`;
    const svg = el.querySelector('.sim-svg');
    const draw = () => {
      el.querySelectorAll('[data-sh] button').forEach((b) => b.classList.toggle('on', b.dataset.v === shape));
      const conv = shape === 'convex';
      el.querySelector('.sim-tilt').hidden = !conv;
      el.querySelector('[data-o]').textContent = `${GDT.signed(tilt, 1)}°`;
      // bottom profile in part coordinates, x ∈ [-120,120]
      const prof = (x) => (conv ? 14 * (x / 120) ** 2 : 3 * Math.sin(x / 9) + 2 * Math.sin(x / 23));
      const a = (conv ? tilt : 0) * Math.PI / 180;
      // place the part so its lowest point touches the table (y = 0)
      const pts = [];
      for (let x = -120; x <= 120; x += 4) pts.push([x, prof(x)]);
      const rot = ([x, y]) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];
      const R = pts.map(rot);
      const minY = Math.min(...R.map((p) => p[1]));
      const cx = 170, base = 170;
      const sx = (x) => cx + x, sy = (y) => base - (y - minY);
      const top = [[120, 70], [-120, 70]].map(rot);
      const contact = R.filter((p) => p[1] - minY < 0.6);
      svg.innerHTML = `
        <rect class="fixture" x="20" y="${base}" width="300" height="16"/>
        <text class="ax-lbl" x="320" y="${base + 30}" text-anchor="end">simülatör: ölçme tablası (datum A)</text>
        <path class="drw-obj" d="M${R.map(([x, y]) => `${sx(x)} ${sy(y)}`).join('L')}L${sx(top[0][0])} ${sy(top[0][1])}L${sx(top[1][0])} ${sy(top[1][1])}Z"/>
        ${contact.map(([x, y]) => `<circle class="contact" cx="${sx(x)}" cy="${sy(y)}" r="4"/>`).join('')}
        <text class="ax-lbl strong" x="${sx(-118)}" y="${sy(R[0][1]) - 8}">datum elemanı (gerçek yüzey)</text>
        <text class="ax-lbl" x="20" y="20">yüzey kusurları abartılı çizildi</text>`;
      el.querySelector('.sim-note').innerHTML = conv
        ? 'Dışbükey yüzey tablada <b>sallanır</b>: tek noktada değer ve her konum farklı bir datum verir. ISO 5459’un varsayılan çözümü: yüzeyden en büyük uzaklığı <b>en küçük yapan</b> konum. Tasarımcı bunu önlemek için datum yüzeyine düzlemsellik verir ya da <b>datum hedefleri</b> kullanır.'
        : 'Dalgalı ama genelde düz yüzey, tablaya en yüksek noktalarından değer ve kararlı oturur. Ölçüm artık yüzeyin kusurlarından değil, bu ideal düzlemden başlar.';
    };
    el.querySelector('[data-sh]').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) { shape = b.dataset.v; tilt = 0; el.querySelector('[data-t]').value = 0; draw(); } });
    el.querySelector('[data-t]').oninput = (e) => { tilt = +e.target.value; draw(); };
    draw();
  }

  function slideCommon(el) {
    el.innerHTML = `
      <p class="kicker">4 · Ortak datumlar ve datum hedefleri</p>
      <h3>Her datum tek bir düz yüzey değildir</h3>
      <div class="cmp-grid">
        <div class="cmp-card">
          <small>Ortak datum A-B</small>
          <svg class="drw" viewBox="0 0 320 150" role="img" aria-label="İki muylulu mil">
            <line class="drw-cl" x1="10" y1="75" x2="310" y2="75"/>
            <path class="drw-obj" d="M30 55H90V40H230V55H290V95H230V110H90V95H30Z"/>
            <rect class="dz a" x="30" y="55" width="60" height="40"/><rect class="dz b" x="230" y="55" width="60" height="40"/>
            <g class="svg-datum"><path d="M60 95l-6 10h12z"/><line x1="60" y1="105" x2="60" y2="112"/><rect x="52" y="112" width="16" height="16"/><text x="60" y="124" text-anchor="middle">A</text></g>
            <g class="svg-datum"><path d="M260 95l-6 10h12z"/><line x1="260" y1="105" x2="260" y2="112"/><rect x="252" y="112" width="16" height="16"/><text x="260" y="124" text-anchor="middle">B</text></g>
            <g class="svg-fcf"><rect x="120" y="10" width="22" height="20"/><rect x="142" y="10" width="36" height="20"/><rect x="178" y="10" width="34" height="20"/>
              <g transform="translate(122 11) scale(.75)" fill="none" stroke-width="1.8">${GDT.SYMBOLS.circularRunout}</g>
              <text x="160" y="24" text-anchor="middle">0,02</text><text x="195" y="24" text-anchor="middle">A-B</text></g>
            <path class="drw-dim" d="M160 40V30"/>
          </svg>
          <p class="small">Mil iki rulman muylusunda döner. İki muylunun ortak ekseni tek bir datumdur: <b>A-B</b>. Çerçevede tek bölmeye tire ile yazılır.</p>
        </div>
        <div class="cmp-card">
          <small>Datum hedefleri A1, A2, A3</small>
          <svg class="drw" viewBox="0 0 320 150" role="img" aria-label="Döküm parça ve datum hedefleri">
            <path class="drw-obj" d="M30 30C80 20 240 40 290 28V120C220 128 100 112 30 122Z"/>
            ${[[80, 70, 'A1'], [230, 55, 'A2'], [160, 100, 'A3']].map(([x, y, n]) => `
              <g class="target"><path d="M${x - 7} ${y - 7}l14 14M${x + 7} ${y - 7}l-14 14"/>
              <line x1="${x}" y1="${y}" x2="${x + 18}" y2="${y - 22}"/><circle cx="${x + 30}" cy="${y - 30}" r="13"/><line x1="${x + 17}" y1="${y - 30}" x2="${x + 43}" y2="${y - 30}"/>
              <text x="${x + 30}" y="${y - 33}" text-anchor="middle">Ø6</text><text x="${x + 30}" y="${y - 20}" text-anchor="middle">${n}</text></g>`).join('')}
          </svg>
          <p class="small">Döküm ve dövme yüzeyler tablaya kararlı oturmaz. Bunun yerine yüzeyde belirli noktalar ya da küçük alanlar seçilir: <b>datum hedefleri</b>. Kalıp ve fikstür tasarımında sık kullanılır.</p>
        </div>
      </div>`;
  }

  // ======================================================================
  // OYNA — DOF detective
  // ======================================================================
  const CASES = [
    { part: 'block', datums: [['A', 'bottom']], fcf: { sym: 'parallelism', value: 0.05, datums: ['A'] }, title: 'Prizmatik parça, yalnızca alt yüzey A', locked: ['tz', 'rx', 'ry'] },
    { part: 'block', datums: [['A', 'bottom'], ['B', 'back']], fcf: { sym: 'position', zone: 'Ø', value: 0.1, datums: ['A', 'B'] }, title: 'Alt yüzey A, arka yüzey B', locked: ['tz', 'rx', 'ry', 'ty', 'rz'] },
    { part: 'block', datums: [['A', 'bottom'], ['B', 'back'], ['C', 'side']], fcf: { sym: 'position', zone: 'Ø', value: 0.1, datums: ['A', 'B', 'C'] }, title: 'A, B ve C: üç dik yüzey', locked: ALL },
    { part: 'shaft', datums: [['A', 'axis']], fcf: { sym: 'circularRunout', value: 0.02, datums: ['A'] }, title: 'Mil, datum A: silindirin ekseni', locked: ['tx', 'ty', 'rx', 'ry'] },
    { part: 'plate', datums: [['A', 'bottom'], ['B', 'hole']], fcf: { sym: 'position', zone: 'Ø', value: 0.2, datums: ['A', 'B'] }, title: 'Plaka: alt yüzey A, ortadaki delik ekseni B', locked: ['tz', 'rx', 'ry', 'tx', 'ty'] },
    { part: 'flange', datums: [['A', 'face'], ['B', 'bore'], ['C', 'pin']], fcf: { sym: 'position', zone: 'Ø', value: 0.1, datums: ['A', 'B', 'C'] }, title: 'Flanş: alın yüzeyi A, merkez delik B, küçük delik C', locked: ALL },
  ];
  const STARS = ['En az 4 vakayı tam doğru çöz', 'En az 5 vaka', '6 vakanın hepsi'];
  const EXPLAIN = {
    0: 'Tek bir düzlem yalnızca üç serbestliği kilitler: yukarı kalkma ve iki yatırma. Parça tabla üzerinde kayabilir ve dönebilir.',
    1: 'B düzlemi A’ya diktir; Y boyunca kaymayı ve dikey eksen etrafında dönmeyi durdurur. X boyunca hâlâ kayabilir.',
    2: 'Üç dik düzlem: 3 + 2 + 1 = 6. Parça tamamen kilitli.',
    3: 'Bir silindirin ekseni dört serbestliği kilitler. Eksen boyunca kayma ve eksen etrafında dönme serbest kalır; salgı ölçümünde parça zaten bu eksen etrafında döner.',
    4: 'A üç serbestliği, A’ya dik delik ekseni B iki kaymayı kilitler. Delik etrafında dönme (Rz) serbest: bunu kilitlemek için üçüncü bir datum gerekir.',
    5: 'Flanşın alın yüzeyi A (3), merkez deliği B (Tx, Ty) ve küçük delik C (delik ekseni etrafında dönme) birlikte altısını kilitler.',
  };

  function oyna(el, api) {
    let ci = 0, score = 0, checked = false;
    const marks = new Set();
    const results = [];
    el.innerHTML = `
      <div class="card brief">
        <div>
          <p class="kicker">Serbestlik dedektifi</p>
          <h3>Bu datumlar neyi kilitliyor?</h3>
          <p>Her vakada bir parça ve çerçevesindeki datum referansı var. Datumların birlikte <b>hangi serbestlikleri kilitlediğini</b> işaretle, sonra kontrol et. Serbest kalanlar sahnede hareket edecek.</p>
        </div>
        ${GDT.starsHTML(STARS)}
      </div>
      <div class="sim det">
        <div class="card sim-ctl">
          <div class="game-top"><span class="mono g-round"></span><div class="g-progress"></div></div>
          <h4 class="case-title"></h4>
          <div class="case-fcf"></div>
          <span class="lbl">Kilitli olanları işaretle</span>
          <div class="dofs pick6"></div>
          <button class="btn big" data-check>Kontrol et</button>
          <div class="case-msg"></div>
        </div>
        <div class="card three-card"><div class="three-host"></div><p class="muted small">Sürükleyerek döndür. Renkli düzlem ve çubuklar datum elemanlarıdır.</p></div>
      </div>`;
    const $ = (s) => el.querySelector(s);
    const sc = GDT.three.create($('.three-host'), { height: 380, dist: 12 });
    let holder = null, markers = null, gz = null, base = null, free = [];
    if (sc) {
      api.onCleanup(() => sc.dispose());
      sc.orbit.target.set(0, 1, 0);
      sc.place();
      gz = GDT.three.dofGizmo(2.6);
      sc.scene.add(gz.group);
      sc.onTick((dt, t) => {
        if (!holder || !checked || !free.length) return;
        const slot = Math.floor(t / 1.5) % free.length, ph = (t % 1.5) / 1.5;
        GDT.dofOffset(holder, free[slot], Math.sin(ph * Math.PI * 2) * 0.3, base);
        el.querySelectorAll('.pick6 .dof').forEach((b) => b.classList.toggle('on', b.dataset.k === free[slot]));
      });
    }

    function header() {
      $('.g-round').textContent = ci < CASES.length ? `Vaka ${ci + 1} / ${CASES.length}` : 'Bitti';
      $('.g-progress').innerHTML = CASES.map((_, i) => `<i class="${results[i] === true ? 'ok' : results[i] === false ? 'bad' : i === ci ? 'now' : ''}"></i>`).join('');
    }

    function load() {
      if (ci >= CASES.length) return end();
      const c = CASES[ci];
      checked = false;
      marks.clear();
      header();
      $('.case-title').textContent = c.title;
      $('.case-fcf').innerHTML = GDT.fcfHTML(c.fcf);
      $('.pick6').innerHTML = dofButtons();
      $('.case-msg').innerHTML = '';
      $('[data-check]').textContent = 'Kontrol et';
      if (!sc) return;
      if (holder) sc.scene.remove(holder);
      if (markers) sc.scene.remove(markers);
      holder = new THREE.Group();
      holder.add(buildPart(c.part));
      markers = new THREE.Group();
      c.datums.forEach(([L, w]) => markers.add(datumMarker(L, w)));
      sc.scene.add(holder, markers);
      base = { pos: holder.position.clone(), rot: holder.rotation.clone() };
      gz.group.position.set(c.part === 'shaft' ? 2.2 : 0, c.part === 'shaft' ? 2 : 1.1, c.part === 'shaft' ? 1.5 : 0);
      ALL.forEach((d) => gz.paint(d, 0x5c6b7a));
    }

    function check() {
      if (checked) { ci++; load(); return; }
      const c = CASES[ci], want = new Set(c.locked);
      const ok = ALL.every((d) => want.has(d) === marks.has(d));
      checked = true;
      results[ci] = ok;
      if (ok) score++;
      free = ALL.filter((d) => !want.has(d));
      el.querySelectorAll('.pick6 .dof').forEach((b) => {
        const k = b.dataset.k;
        b.classList.add(want.has(k) === marks.has(k) ? 'right' : 'wrong');
        b.classList.toggle('locked', want.has(k));
        b.disabled = true;
      });
      if (gz) ALL.forEach((d) => gz.paint(d, want.has(d) ? 0xc43030 : 0x2d8a46));
      $('.case-msg').innerHTML = `<div class="msg ${ok ? 'ok' : 'bad'}"><b>${ok ? 'Doğru.' : 'Tam değil.'}</b> Kilitli: <b class="mono">${c.locked.map((d) => GDT.DOF.find((x) => x.k === d).name).join(', ')}</b> (${c.locked.length}). ${EXPLAIN[ci]}</div>`;
      $('[data-check]').textContent = ci + 1 < CASES.length ? 'Sonraki vaka →' : 'Sonucu gör';
      header();
    }

    function end() {
      const stars = score >= 6 ? 3 : score >= 5 ? 2 : score >= 4 ? 1 : 0;
      header();
      if (stars) { GDT.giveStars(6, stars, 'Serbestlik dedektifi'); api.done(); }
      GDT.syncStars(el, 6);
      free = [];
      $('.case-title').textContent = `${score} / ${CASES.length} vaka tam doğru`;
      $('.case-fcf').innerHTML = '';
      $('.pick6').innerHTML = '';
      $('.case-msg').innerHTML = `<div class="msg ${stars ? 'ok' : 'warn'}">${'★'.repeat(stars) || 'Yıldız yok'} · ${stars === 3 ? 'Kusursuz!' : 'Kural: düzlem 3, ona dik ikinci düzlem 2, üçüncüsü 1; silindir ekseni 4, ona dik düzlem/delik eksenleri ise eksik kalanları kilitler.'}</div>`;
      $('[data-check]').textContent = 'Yeniden oyna';
      $('[data-check]').onclick = () => { ci = 0; score = 0; results.length = 0; $('[data-check]').onclick = check; load(); };
    }

    el.querySelector('.pick6').addEventListener('click', (e) => {
      const b = e.target.closest('.dof');
      if (!b || checked) return;
      const k = b.dataset.k;
      if (marks.has(k)) marks.delete(k); else marks.add(k);
      b.classList.toggle('marked', marks.has(k));
    });
    $('[data-check]').onclick = check;
    GDT.syncStars(el, 6);
    load();
  }

  // ======================================================================
  // SINA
  // ======================================================================
  const QUESTIONS = [
    {
      q: 'Uzayda serbest bir parçanın kaç serbestlik derecesi vardır?',
      options: ['3', '4', '6', '12'],
      answer: 2,
      explain: 'Üç eksen boyunca kayma ve üç eksen etrafında dönme: toplam 6.',
    },
    {
      q: 'Birincil datum bir düzlemse, kaç serbestliği kilitler?',
      options: ['1', '2', '3', '6'],
      answer: 2,
      explain: 'Bir düzlem; ona dik kaymayı ve iki eğilme dönüşünü kilitler: 3 serbestlik. Sonra ikincil 2, üçüncül 1 (3-2-1).',
    },
    {
      q: `${GDT.fcfHTML({ sym: 'position', zone: 'Ø', value: 0.1, datums: ['B', 'A', 'C'] })} çerçevesinde parça ölçüm için önce hangi yüzeye oturtulur?`,
      options: ['A’ya, çünkü alfabede önce', 'B’ye, çünkü çerçevede ilk sırada', 'C’ye', 'Fark etmez'],
      answer: 1,
      explain: 'Öncelik çerçevedeki sıradır, harfin alfabedeki yeri değil. Kusurlu bir parçada sıra değişirse sonuç da değişir.',
    },
    {
      q: 'Datum elemanı ile datum arasındaki fark nedir?',
      options: ['Aynı şeydir', 'Datum elemanı parçanın gerçek yüzeyi; datum ise ondan elde edilen ideal düzlem/eksen', 'Datum elemanı resimdeki harf, datum ise üçgen', 'Datum yalnızca CMM’de vardır'],
      answer: 1,
      explain: 'Gerçek yüzey kusurludur. Ölçüm, ona malzeme dışından değen ideal geometriden başlar. Atölyede bunu tabla, gönye, mastar gibi simülatörler temsil eder.',
    },
    {
      q: 'Bir milin silindirik yüzeyinden alınan datum ekseni kaç serbestliği kilitler?',
      options: ['2', '4', '5', '6'],
      answer: 1,
      explain: 'İki kayma ve iki eğilme kilitlenir. Eksen boyunca kayma ve eksen etrafında dönme serbest kalır.',
    },
    {
      q: 'İki rulman muylusunun oluşturduğu eksen çerçevede nasıl yazılır?',
      options: ['A | B', 'A-B', 'AB', 'A, B'],
      answer: 1,
      explain: 'Ortak datum tek bir bölmeye tire ile yazılır: A-B. “A | B” ise iki ayrı datumun öncelik sırasıdır.',
    },
    {
      q: 'Döküm bir yüzey tablaya kararlı oturmuyorsa ne yapılır?',
      options: ['Yüzey datum olarak kullanılamaz', 'Datum hedefleri: yüzey üzerinde belirli nokta veya alanlar', 'Datumsuz tolerans verilir', 'Parça zımparalanır'],
      answer: 1,
      explain: 'Datum hedefleri (A1, A2, A3…) ham yüzeylerde kararlı ve tekrarlanabilir bir datum sağlar.',
    },
  ];

  function sina(el, api) {
    el.append(GDT.el(`
      <div class="story card">
        <p class="kicker">Sına</p>
        <p>${QUESTIONS.length} soru. Geçmek için en az ${Math.ceil(QUESTIONS.length * 0.7)} doğru gerekiyor. Her doğru cevap +5 XP.</p>
      </div>`));
    GDT.quiz(el, { id: 'm6.quiz', questions: QUESTIONS, onPass: api.done });
  }

  GDT.registerModule(6, { steps: { sezgi, kavram, oyna, sina } });
})();
