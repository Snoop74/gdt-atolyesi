'use strict';
/* Module 5 — Tolerans çerçevesi ISO 1101 (Sezgi: label the compartments, Kavram: 4 slides, Oyna: frame builder, Sına) */
(() => {
  const N = GDT.num;

  // datum: 'never' | 'required' | 'optional'; zones: allowed zone prefixes
  const CHARS = [
    { id: 'straightness', name: 'Doğrusallık', group: 'Form', datum: 'never', zones: ['', 'Ø'] },
    { id: 'flatness', name: 'Düzlemsellik', group: 'Form', datum: 'never', zones: [''] },
    { id: 'circularity', name: 'Dairesellik', group: 'Form', datum: 'never', zones: [''] },
    { id: 'cylindricity', name: 'Silindiriklik', group: 'Form', datum: 'never', zones: [''] },
    { id: 'lineProfile', name: 'Çizgi profili', group: 'Profil', datum: 'optional', zones: [''] },
    { id: 'surfaceProfile', name: 'Yüzey profili', group: 'Profil', datum: 'optional', zones: [''] },
    { id: 'parallelism', name: 'Paralellik', group: 'Yönelim', datum: 'required', zones: ['', 'Ø'] },
    { id: 'perpendicularity', name: 'Diklik', group: 'Yönelim', datum: 'required', zones: ['', 'Ø'] },
    { id: 'angularity', name: 'Açısallık', group: 'Yönelim', datum: 'required', zones: ['', 'Ø'] },
    { id: 'position', name: 'Konum', group: 'Konum', datum: 'optional', zones: ['', 'Ø', 'SØ'] },
    { id: 'coaxiality', name: 'Eş eksenlilik', group: 'Konum', datum: 'required', zones: ['Ø'] },
    { id: 'symmetry', name: 'Simetri', group: 'Konum', datum: 'required', zones: [''] },
    { id: 'circularRunout', name: 'Dairesel salgı', group: 'Salgı', datum: 'required', zones: [''] },
    { id: 'totalRunout', name: 'Toplam salgı', group: 'Salgı', datum: 'required', zones: [''] },
  ];
  const CH = Object.fromEntries(CHARS.map((c) => [c.id, c]));
  const DATUM_NOTE = { never: 'Datum almaz', required: 'Datum gerekir', optional: 'Datum isteğe bağlı' };

  // ---------- reading a frame aloud ----------
  function zonePhrase(f) {
    const v = `${N(f.value, Math.max(GDT.decimals(f.value), 1))} mm`;
    if (f.zone === 'Ø') return `çapı ${v} olan bir silindir`;
    if (f.zone === 'SØ') return `çapı ${v} olan bir küre`;
    switch (f.sym) {
      case 'circularity': return `yarıçap farkı ${v} olan iki eş merkezli daire`;
      case 'cylindricity': return `yarıçap farkı ${v} olan iki eş eksenli silindir`;
      case 'lineProfile': case 'surfaceProfile': return `ideal profile göre ${v} genişliğinde bir bant`;
      case 'straightness': return `aralığı ${v} olan iki paralel doğru`;
      default: return `aralığı ${v} olan iki paralel düzlem`;
    }
  }
  function datumPhrase(d) {
    if (!d.length) return '';
    if (d.length === 1) return d[0].includes('-') ? `${d[0]} ortak datumuna göre` : `${d[0]} datumuna göre`;
    return `${d.join(' | ')} datum sistemine göre`;
  }
  // how the zone sits relative to the datums; single datum reads "A datumuna dik", several "A | B datum sistemine göre dik"
  const QUAL = {
    parallelism: 'paralel', perpendicularity: 'dik', angularity: 'teorik tam açıyla duran',
    position: 'teorik tam yerinde duran', coaxiality: 'eksen üzerinde duran', symmetry: 'simetrik duran',
  };
  function placePhrase(f) {
    const q = QUAL[f.sym], d = f.datums;
    if (!d.length) return q && f.sym === 'position' ? `${q} ` : '';
    if (!q) return `${datumPhrase(d)} `;
    if (d.length === 1 && !d[0].includes('-') && ['parallelism', 'perpendicularity'].includes(f.sym)) return `${d[0]} datumuna ${q} `;
    if (f.sym === 'coaxiality') return `${d.join(' | ')} datum ekseni üzerinde duran `;
    return `${datumPhrase(d)} ${q} `;
  }
  const MOD_TEXT = {
    M: 'Ⓜ maksimum malzeme gerekliliği: eleman maksimum malzeme boyutundan uzaklaştıkça ek tolerans kazanılır.',
    L: 'Ⓛ minimum malzeme gerekliliği: et kalınlığını korumak için.',
    P: 'Ⓟ izdüşümlü bölge: bölge elemanın dışına, karşı parçanın içine uzatılır.',
    F: 'Ⓕ serbest durum: parça bağlanmadan, serbest haldeyken geçerli.',
    CZ: 'CZ: birden çok eleman için tek ortak bölge.',
  };
  function readFrame(f) {
    const c = CH[f.sym];
    if (c.group === 'Salgı') {
      return `${c.name}: parça ${f.datums.length ? `${f.datums.join(' | ')} ekseni` : 'datum ekseni'} etrafında döndürülürken komparatörün gösterdiği toplam sapma ${f.sym === 'totalRunout' ? 'bütün yüzey boyunca' : 'her ölçüm kesitinde'} en fazla ${N(f.value, Math.max(GDT.decimals(f.value), 1))} mm olmalı.`;
    }
    return `${c.name}: tolere edilen eleman ${placePhrase(f)}${zonePhrase(f)} içinde kalmalı.`;
  }
  function validate(f) {
    const c = CH[f.sym], errs = [];
    if (!(f.value > 0)) errs.push('Bir tolerans değeri gir.');
    if (c.datum === 'never' && f.datums.length) errs.push(`${c.name} bir form toleransıdır; datum almaz. Elemanın yalnızca kendi şeklini sınırlar.`);
    if (c.datum === 'required' && !f.datums.length) errs.push(`${c.name} bir datuma göre tanımlanır; en az bir datum gerekir.`);
    if (!c.zones.includes(f.zone)) errs.push(f.zone ? `${c.name} bölgesi ${f.zone} ile başlamaz.` : `${c.name} için bölge çaplıdır: değerin önüne Ø yazılır.`);
    if (new Set(f.datums.map((d) => d.split('-')).flat()).size < f.datums.map((d) => d.split('-')).flat().length) errs.push('Aynı datum iki kez kullanılmış.');
    return errs;
  }

  // ======================================================================
  // SEZGİ — label the compartments
  // ======================================================================
  const PIECES = [
    { k: 'sym', html: () => GDT.sym('position', 30), label: 'Geometrik karakteristik' },
    { k: 'val', html: () => '<span class="mono">Ø0,1</span>', label: 'Tolerans bölgesinin şekli ve değeri' },
    { k: 'mod', html: () => GDT.circled('M', 26), label: 'Değiştirici (malzeme gerekliliği)' },
    { k: 'A', html: () => '<span class="mono">A</span>', label: 'Birincil datum' },
    { k: 'B', html: () => '<span class="mono">B</span>', label: 'İkincil datum' },
    { k: 'C', html: () => '<span class="mono">C</span>', label: 'Üçüncül datum' },
  ];

  function sezgi(el, api) {
    const done = new Set();
    let sel = null, misses = 0;
    el.innerHTML = `
      <div class="story card">
        <p class="kicker">Durum</p>
        <p>Yeni bir müşteri resmi geldi. Deliğin yanında bu kutu var ve atölyede kimse ne dediğinden emin değil. Önce kutunun parçalarını tanıyalım: aşağıdan bir etiket seç, sonra çerçevede ait olduğu bölmeye tıkla.</p>
      </div>
      <div class="card match">
        <div class="match-frame">
          <span class="fcf big">
            <span class="fcf-cell slot" data-k="sym">${PIECES[0].html()}</span>
            <span class="fcf-cell"><span class="slot" data-k="val">${PIECES[1].html()}</span><span class="slot" data-k="mod">${PIECES[2].html()}</span></span>
            <span class="fcf-cell slot" data-k="A">${PIECES[3].html()}</span>
            <span class="fcf-cell slot" data-k="B">${PIECES[4].html()}</span>
            <span class="fcf-cell slot" data-k="C">${PIECES[5].html()}</span>
          </span>
        </div>
        <div class="tags">${GDT.shuffle(PIECES).map((p) => `<button class="tag" data-k="${p.k}">${p.label}</button>`).join('')}</div>
        <p class="hint">Bir etiket seç.</p>
      </div>
      <div class="asks"></div>`;
    const $ = (s) => el.querySelector(s);

    function sync() {
      el.querySelectorAll('.tag').forEach((t) => {
        t.classList.toggle('on', t.dataset.k === sel);
        t.classList.toggle('used', done.has(t.dataset.k));
        t.disabled = done.has(t.dataset.k);
      });
      el.querySelectorAll('.slot').forEach((s) => s.classList.toggle('placed', done.has(s.dataset.k)));
    }
    el.querySelector('.tags').addEventListener('click', (e) => {
      const t = e.target.closest('.tag');
      if (!t) return;
      sel = t.dataset.k;
      $('.hint').textContent = 'Şimdi çerçevede bu etiketin bölmesine tıkla.';
      sync();
    });
    el.querySelector('.match-frame').addEventListener('click', (e) => {
      const s = e.target.closest('.slot');
      if (!s || !sel || done.has(s.dataset.k)) return;
      if (s.dataset.k === sel) {
        done.add(sel);
        const p = PIECES.find((x) => x.k === sel);
        $('.hint').innerHTML = `✓ <b>${p.label}</b>. ${done.size < PIECES.length ? `${PIECES.length - done.size} etiket kaldı.` : ''}`;
        sel = null;
        if (done.size === PIECES.length) finish();
      } else {
        misses++;
        s.classList.add('nope');
        setTimeout(() => s.classList.remove('nope'), 500);
        $('.hint').textContent = 'Bu bölme değil, tekrar dene.';
      }
      sync();
    });

    function finish() {
      const take = GDT.el(`
        <div class="takeaway card">
          <p class="kicker">Okunuşu</p>
          <p class="read-out">“Deliğin ekseni, <b>A | B | C</b> datum sistemine göre teorik tam yerinde duran <b>Ø0,1 mm çaplı bir silindir</b> içinde kalmalı; delik maksimum malzeme boyutundan uzaklaştıkça <b>ek tolerans</b> kazanılır.”</p>
          <p><b>Çerçeve soldan sağa okunur:</b> ne kontrol ediliyor, ne kadar ve hangi bölge şekliyle, neye göre. ${misses ? `${misses} yanlış denemeyle buldun.` : 'Hiç hata yapmadan buldun!'}</p>
          <button class="btn" data-next>Kavram adımına geç →</button>
        </div>`);
      $('.asks').append(take);
      take.querySelector('[data-next]').onclick = api.next;
      take.scrollIntoView({ block: 'nearest', behavior: GDT.reducedMotion() ? 'auto' : 'smooth' });
      api.done();
    }
    sync();
  }

  // ======================================================================
  // KAVRAM
  // ======================================================================
  function kavram(el, api) {
    GDT.carousel(el, [slideAnatomy, slideChars, slideArrow, slideTed], api);
  }

  const EXAMPLES = [
    { f: { sym: 'position', zone: 'Ø', value: 0.1, mods: ['M'], datums: ['A', 'B', 'C'] } },
    { f: { sym: 'flatness', zone: '', value: 0.05, mods: [], datums: [] } },
    { f: { sym: 'circularRunout', zone: '', value: 0.02, mods: [], datums: ['A-B'] } },
    { f: { sym: 'perpendicularity', zone: 'Ø', value: 0.02, mods: [], datums: ['A'] } },
  ];
  function slideAnatomy(el) {
    let ex = 0;
    el.innerHTML = `
      <p class="kicker">1 · Bölmeler</p>
      <h3>Çerçeve soldan sağa okunur</h3>
      <div class="cell-legend">
        <div><b>1. bölme</b><span>Geometrik karakteristiğin sembolü. Her çerçevede tek bir karakteristik.</span></div>
        <div><b>2. bölme</b><span>Tolerans değeri (mm). Bölge silindir ya da daireyse önüne <b>Ø</b>, küreyse <b>SØ</b>. Ardından değiştiriciler: Ⓜ Ⓛ Ⓟ Ⓕ CZ…</span></div>
        <div><b>3.–5. bölmeler</b><span>Datumlar, öncelik sırasıyla: birincil, ikincil, üçüncül. <b>A-B</b> iki elemandan oluşan ortak datumdur.</span></div>
      </div>
      <div class="seg wrap" data-ex>${EXAMPLES.map((e, i) => `<button data-i="${i}">Örnek ${i + 1}</button>`).join('')}</div>
      <div class="ex-frame"></div>
      <p class="read-out ex-read"></p>`;
    const draw = () => {
      el.querySelectorAll('[data-ex] button').forEach((b) => b.classList.toggle('on', +b.dataset.i === ex));
      const f = EXAMPLES[ex].f;
      el.querySelector('.ex-frame').innerHTML = GDT.fcfHTML(f, 'big');
      el.querySelector('.ex-read').innerHTML = `“${readFrame(f)}”${f.mods.map((m) => `<br><small>${MOD_TEXT[m]}</small>`).join('')}`;
    };
    el.querySelector('[data-ex]').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) { ex = +b.dataset.i; draw(); } });
    draw();
  }

  function slideChars(el) {
    let filter = 'Hepsi', reveal = false;
    const groups = ['Hepsi', 'Form', 'Yönelim', 'Konum', 'Salgı', 'Profil'];
    el.innerHTML = `
      <p class="kicker">2 · On dört karakteristik</p>
      <h3>Beş aile, bir kural: kim datum ister?</h3>
      <p>Form toleransları elemanın yalnızca kendi şeklini sınırlar; referansa ihtiyaçları yok. Yönelim, konum ve salgı ise bir şeye göre tanımlanır. Önce tahmin et, sonra göster.</p>
      <div class="chars-ctl">
        <div class="seg wrap" data-g>${groups.map((g) => `<button data-v="${g}">${g}</button>`).join('')}</div>
        <label class="switch"><input type="checkbox" data-r><span class="sw"></span><span>Datum ihtiyacını göster</span></label>
      </div>
      <div class="chars-grid"></div>`;
    const draw = () => {
      el.querySelectorAll('[data-g] button').forEach((b) => b.classList.toggle('on', b.dataset.v === filter));
      el.querySelector('.chars-grid').innerHTML = CHARS.filter((c) => filter === 'Hepsi' || c.group === filter).map((c) => `
        <div class="char-card g-${c.group.toLowerCase().replace('ö', 'o').replace('ı', 'i')}">
          ${GDT.sym(c.id, 30)}
          <b>${c.name}</b>
          <small>${c.group}</small>
          <span class="badge ${reveal ? (c.datum === 'never' ? 'ok' : c.datum === 'required' ? 'bad' : 'warn') : ''}">${reveal ? DATUM_NOTE[c.datum] : '?'}</span>
        </div>`).join('');
    };
    el.querySelector('[data-g]').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) { filter = b.dataset.v; draw(); } });
    el.querySelector('[data-r]').onchange = (e) => { reveal = e.target.checked; draw(); };
    draw();
  }

  function slideArrow(el) {
    let mode = 'surface';
    el.innerHTML = `
      <div class="slide-grid">
        <div>
          <p class="kicker">3 · Ok nereyi gösteriyor?</p>
          <h3>Yüzey mi, eksen mi?</h3>
          <p>Çerçevenin oku <b>yüzeye</b> (ölçü çizgisinden uzakta) değiyorsa tolerans o yüzeyi sınırlar. Ok <b>ölçü çizgisinin hizasında</b> duruyorsa tolerans, ölçülen boyut elemanının <b>eksenine</b> (türetilmiş eleman) uygulanır.</p>
          <div class="seg" data-m><button data-v="surface">Ok yüzeyde</button><button data-v="axis">Ok ölçü çizgisi hizasında</button></div>
          <p class="callout arrow-note"></p>
        </div>
        <svg class="arrow-svg" viewBox="0 0 360 260" role="img" aria-label="Mil üzerinde doğrusallık"></svg>
      </div>`;
    const svg = el.querySelector('.arrow-svg');
    const draw = () => {
      el.querySelectorAll('[data-m] button').forEach((b) => b.classList.toggle('on', b.dataset.v === mode));
      const surf = mode === 'surface';
      // shaft drawn bent a little so both readings show something
      const yTop = (x) => 120 - 4 * Math.sin((x - 40) / 280 * Math.PI);
      let top = '', bot = '', axis = '';
      for (let x = 40; x <= 320; x += 10) {
        top += `${x === 40 ? 'M' : 'L'}${x} ${yTop(x) - 30}`;
        bot = `L${x} ${yTop(x) + 30}` + bot;
        axis += `${x === 40 ? 'M' : 'L'}${x} ${yTop(x)}`;
      }
      svg.innerHTML = `
        <path class="drw-obj" d="${top}${bot}Z"/>
        <path class="drw-cl" d="${axis}"/>
        ${surf
          ? `<rect class="geo-zone" x="40" y="${86 - 10}" width="280" height="12"/>
             <path class="drw-dim" d="M180 ${yTop(180) - 30}V40h40"/><path class="drw-arrow" d="M180 ${yTop(180) - 30}l-3-8h6z"/>`
          : `<path class="geo-zone" d="M40 ${120 - 9}H320V${120 + 9}H40Z"/>
             <line class="drw-ext" x1="330" y1="90" x2="350" y2="90"/><line class="drw-ext" x1="330" y1="150" x2="350" y2="150"/>
             <line class="drw-dim" x1="342" y1="90" x2="342" y2="150"/><path class="drw-arrow" d="M342 90l-3 8h6z"/><path class="drw-arrow" d="M342 150l-3-8h6z"/>
             <text class="drw-txt sm" transform="translate(354 120) rotate(-90)" text-anchor="middle">Ø20</text>
             <path class="drw-dim" d="M342 90V40h-122"/>`}
        <g class="svg-fcf"><rect x="220" y="30" width="24" height="20"/><rect x="244" y="30" width="${surf ? 40 : 52}" height="20"/>
          <g transform="translate(223 31) scale(.75)" fill="none" stroke-width="1.8">${GDT.SYMBOLS.straightness}</g>
          <text x="${surf ? 264 : 270}" y="44" text-anchor="middle">${surf ? '0,02' : 'Ø0,02'}</text></g>
        <text class="ax-lbl" x="40" y="240">sapmalar ve bölge abartılı çizildi</text>`;
      el.querySelector('.arrow-note').innerHTML = surf
        ? 'Yüzeyin her bir doğrusu (ana doğrusu), aralığı <b>0,02</b> olan iki paralel doğru arasında kalmalı. Bölge yüzeyin üzerinde.'
        : 'Milin <b>ekseni</b>, çapı <b>Ø0,02</b> olan bir silindir içinde kalmalı. Değerin önünde Ø var, çünkü bölge silindir.';
    };
    el.querySelector('[data-m]').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) { mode = b.dataset.v; draw(); } });
    draw();
  }

  function slideTed(el) {
    const ITEMS = [
      { k: 'ted', title: 'Teorik tam ölçü (TED)', text: 'Çerçeve içindeki ölçü. Kendi toleransı yoktur ve genel tolerans uygulanmaz. Elemanın ideal yerini ya da şeklini tanımlar; sapmayı ilgili tolerans çerçevesi sınırlar.' },
      { k: 'datum', title: 'Datum göstergesi', text: 'İçi dolu (ya da boş) üçgen ve kutu içinde harf. Üçgen yüzeye değiyorsa datum o yüzeydir; ölçü çizgisi hizasındaysa ekseni.' },
      { k: 'fcf', title: 'Tolerans çerçevesi', text: 'Konum Ø0,2, A | B datum sistemine göre. Bölgenin merkezi, datumlardan teorik tam ölçülerle bulunur.' },
    ];
    el.innerHTML = `
      <div class="slide-grid">
        <div>
          <p class="kicker">4 · Çerçevenin yardımcıları</p>
          <h3>Teorik tam ölçüler ve datum göstergeleri</h3>
          <p>Çerçeve tek başına çalışmaz: bölgenin <b>nerede</b> olduğunu teorik tam ölçüler, <b>neye göre</b> olduğunu datum göstergeleri söyler. Resimdeki işaretlere tıkla.</p>
          <div class="ted-info callout">Bir işarete tıkla.</div>
        </div>
        <svg class="drw ted-svg" viewBox="0 0 330 240" role="img" aria-label="Teorik tam ölçüler ve datumlar">
          <rect class="drw-obj" x="50" y="40" width="250" height="150"/>
          <circle class="drw-hole" cx="150" cy="110" r="14"/><path class="drw-cl" d="M150 88v44M128 110h44"/>
          <g class="hot" data-k="ted">
            <line class="drw-ext" x1="50" y1="194" x2="50" y2="226"/><line class="drw-ext" x1="150" y1="128" x2="150" y2="226"/>
            <line class="drw-dim" x1="50" y1="218" x2="150" y2="218"/><path class="drw-arrow" d="M50 218l8-3v6z"/><path class="drw-arrow" d="M150 218l-8-3v6z"/>
            <rect class="ted-box" x="86" y="203" width="28" height="15"/><text class="drw-txt sm" x="100" y="215" text-anchor="middle">40</text>
            <line class="drw-ext" x1="304" y1="110" x2="320" y2="110"/><line class="drw-ext" x1="304" y1="190" x2="320" y2="190"/>
            <line class="drw-dim" x1="314" y1="110" x2="314" y2="190"/><path class="drw-arrow" d="M314 110l-3 8h6z"/><path class="drw-arrow" d="M314 190l-3-8h6z"/>
            <rect class="ted-box" x="303" y="136" width="15" height="28"/><text class="drw-txt sm" transform="translate(315 150) rotate(-90)" text-anchor="middle">40</text>
          </g>
          <g class="hot svg-datum" data-k="datum"><path d="M50 150l-10-6v12z"/><line x1="40" y1="150" x2="30" y2="150"/><rect x="14" y="142" width="16" height="16"/><text x="22" y="154" text-anchor="middle">B</text>
            <path d="M220 190l-6 10h12z"/><line x1="220" y1="200" x2="220" y2="206"/><rect x="212" y="206" width="16" height="16"/><text x="220" y="218" text-anchor="middle">A</text></g>
          <g class="hot" data-k="fcf"><path class="drw-dim" d="M160 100l30-40h20"/>
            <g class="svg-fcf"><rect x="210" y="50" width="22" height="20"/><rect x="232" y="50" width="38" height="20"/><rect x="270" y="50" width="18" height="20"/><rect x="288" y="50" width="18" height="20"/>
            <g transform="translate(212 51) scale(.75)" fill="none" stroke-width="1.8">${GDT.SYMBOLS.position}</g>
            <text x="251" y="64" text-anchor="middle">Ø0,2</text><text x="279" y="64" text-anchor="middle">A</text><text x="297" y="64" text-anchor="middle">B</text></g></g>
        </svg>
      </div>`;
    el.querySelector('.ted-svg').addEventListener('click', (e) => {
      const g = e.target.closest('.hot');
      if (!g) return;
      el.querySelectorAll('.hot').forEach((x) => x.classList.toggle('on', x === g));
      const it = ITEMS.find((x) => x.k === g.dataset.k);
      el.querySelector('.ted-info').innerHTML = `<b>${it.title}.</b> ${it.text}`;
    });
  }

  // ======================================================================
  // OYNA — frame builder
  // ======================================================================
  const TASKS = [
    { text: 'Üst yüzey <b>0,05 mm</b> düzlemsel olsun.', f: { sym: 'flatness', zone: '', value: 0.05, mods: [], datums: [] } },
    { text: 'Deliğin ekseni <b>A</b> datumuna dik olsun; bölge <b>Ø0,02</b> silindir.', f: { sym: 'perpendicularity', zone: 'Ø', value: 0.02, mods: [], datums: ['A'] } },
    { text: 'Üst yüzey <b>A</b> datumuna <b>0,03 mm</b> paralel olsun.', f: { sym: 'parallelism', zone: '', value: 0.03, mods: [], datums: ['A'] } },
    { text: 'Delik, <b>A | B | C</b> datum sistemine göre <b>Ø0,1</b> konum toleranslı olsun; <b>maksimum malzeme gerekliliği</b> ile.', f: { sym: 'position', zone: 'Ø', value: 0.1, mods: ['M'], datums: ['A', 'B', 'C'] } },
    { text: 'Mil yüzeyinin dairesel salgısı, iki muylunun oluşturduğu <b>A-B ortak ekseni</b>ne göre <b>0,02 mm</b> olsun.', f: { sym: 'circularRunout', zone: '', value: 0.02, mods: [], datums: ['A-B'] } },
    { text: 'Silindirik yüzeyin silindirikliği <b>0,01 mm</b> olsun.', f: { sym: 'cylindricity', zone: '', value: 0.01, mods: [], datums: [] } },
  ];
  const STARS = ['En az 2 görev', 'En az 4 görev', '6 görevin hepsi'];
  const DATUM_OPTS = ['', 'A', 'B', 'C', 'A-B'];
  const MOD_OPTS = ['M', 'L', 'P', 'F', 'CZ'];

  function oyna(el, api) {
    const solved = new Set(GDT.store.data.best['m5.tasks'] || []);
    let ti = Math.max(0, TASKS.findIndex((_, i) => !solved.has(i)));
    const F = { sym: null, zone: '', value: '', mods: [], datums: ['', '', ''] };
    el.innerHTML = `
      <div class="card brief">
        <div>
          <p class="kicker">Çerçeve kurucu</p>
          <h3>İsteği çerçeveye dönüştür</h3>
          <p>Her görevde bir tasarım isteği var. Paletlerden sembolü, bölge şeklini, değeri, değiştiriciyi ve datumları seç. Çerçeve ve okunuşu canlı oluşur; kural hatası yaparsan hemen söylenir.</p>
        </div>
        ${GDT.starsHTML(STARS)}
      </div>
      <div class="sim builder">
        <div class="card sim-ctl">
          <span class="lbl">1 · Karakteristik</span>
          <div class="sym-pal">${CHARS.map((c) => `<button data-sym="${c.id}" title="${c.name}">${GDT.sym(c.id, 22)}</button>`).join('')}</div>
          <span class="lbl">2 · Bölge şekli ve değer</span>
          <div class="val-row">
            <div class="seg" data-zone><button data-v="">—</button><button data-v="Ø">Ø</button><button data-v="SØ">SØ</button></div>
            <input class="val-in mono" inputmode="decimal" placeholder="0,05" data-val>
          </div>
          <span class="lbl">Değiştiriciler</span>
          <div class="seg wrap" data-mods>${MOD_OPTS.map((m) => `<button data-v="${m}">${m.length === 1 ? GDT.circled(m, 18) : m}</button>`).join('')}</div>
          <span class="lbl">3 · Datumlar (öncelik sırasıyla)</span>
          ${[0, 1, 2].map((i) => `<div class="seg datum-row" data-d="${i}"><small>${['Birincil', 'İkincil', 'Üçüncül'][i]}</small>${DATUM_OPTS.map((d) => `<button data-v="${d}">${d || '—'}</button>`).join('')}</div>`).join('')}
          <button class="btn ghost" data-clear>Temizle</button>
        </div>
        <div class="sim-out">
          <div class="card task-card">
            <div class="task-tabs">${TASKS.map((_, i) => `<button data-t="${i}">${i + 1}</button>`).join('')}</div>
            <p class="task-text"></p>
          </div>
          <div class="card frame-card">
            <div class="frame-live"></div>
            <p class="read-out frame-read"></p>
            <div class="frame-errs"></div>
            <button class="btn big" data-check>Görevi kontrol et</button>
            <div class="frame-result"></div>
          </div>
        </div>
      </div>`;
    const $ = (s) => el.querySelector(s);
    const frame = () => ({ sym: F.sym, zone: F.zone, value: GDT.parseNum(F.value), mods: F.mods.slice(), datums: F.datums.filter(Boolean) });

    function draw() {
      el.querySelectorAll('.sym-pal button').forEach((b) => b.classList.toggle('on', b.dataset.sym === F.sym));
      el.querySelectorAll('[data-zone] button').forEach((b) => b.classList.toggle('on', b.dataset.v === F.zone));
      el.querySelectorAll('[data-mods] button').forEach((b) => b.classList.toggle('on', F.mods.includes(b.dataset.v)));
      el.querySelectorAll('.datum-row').forEach((row) => {
        const i = +row.dataset.d;
        row.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.v === F.datums[i]));
      });
      el.querySelectorAll('.task-tabs button').forEach((b) => {
        b.classList.toggle('on', +b.dataset.t === ti);
        b.classList.toggle('done', solved.has(+b.dataset.t));
      });
      $('.task-text').innerHTML = `<b>Görev ${ti + 1}.</b> ${TASKS[ti].text}`;
      const f = frame();
      const shown = { ...f, value: F.value === '' ? '' : (Number.isFinite(f.value) ? f.value : F.value) };
      $('.frame-live').innerHTML = GDT.fcfHTML(shown, 'big');
      if (!f.sym) { $('.frame-read').textContent = 'Önce bir karakteristik seç.'; $('.frame-errs').innerHTML = ''; return; }
      const errs = validate(f);
      $('.frame-errs').innerHTML = errs.map((e) => `<div class="msg warn">${e}</div>`).join('');
      $('.frame-read').innerHTML = errs.length && !(f.value > 0) ? '' : `“${readFrame(f)}”${f.mods.map((m) => `<br><small>${MOD_TEXT[m]}</small>`).join('')}`;
    }

    function check() {
      const f = frame(), t = TASKS[ti].f, diffs = [];
      if (f.sym !== t.sym) diffs.push('karakteristik');
      if (f.zone !== t.zone) diffs.push('bölge şekli (Ø)');
      if (!(Math.abs(f.value - t.value) < 1e-9)) diffs.push('tolerans değeri');
      if (f.mods.slice().sort().join() !== t.mods.slice().sort().join()) diffs.push('değiştirici');
      if (f.datums.join('|') !== t.datums.join('|')) diffs.push('datumlar');
      if (!diffs.length) {
        solved.add(ti);
        GDT.store.data.best['m5.tasks'] = [...solved];
        GDT.store.save();
        const n = solved.size, stars = n >= 6 ? 3 : n >= 4 ? 2 : n >= 2 ? 1 : 0;
        if (stars) { GDT.giveStars(5, stars, 'Çerçeve kurucu'); api.done(); }
        GDT.syncStars(el, 5);
        $('.frame-result').innerHTML = `<div class="msg ok"><b>Doğru çerçeve.</b> ${n < TASKS.length ? 'Sıradaki görev açıldı.' : 'Altı görevin hepsi tamam!'}</div>`;
        const nx = TASKS.findIndex((_, i) => !solved.has(i));
        if (nx >= 0) { ti = nx; clear(false); }
      } else {
        $('.frame-result').innerHTML = `<div class="msg bad">Henüz değil. Farklı olanlar: <b>${diffs.join(', ')}</b>.</div>`;
      }
      draw();
    }

    function clear(resetMsg = true) {
      F.sym = null; F.zone = ''; F.value = ''; F.mods = []; F.datums = ['', '', ''];
      $('[data-val]').value = '';
      if (resetMsg) $('.frame-result').innerHTML = '';
    }

    el.querySelector('.builder .sim-ctl').addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      if (b.dataset.sym) F.sym = b.dataset.sym;
      else if (b.closest('[data-zone]')) F.zone = b.dataset.v;
      else if (b.closest('[data-mods]')) F.mods = F.mods.includes(b.dataset.v) ? F.mods.filter((m) => m !== b.dataset.v) : F.mods.concat(b.dataset.v);
      else if (b.closest('.datum-row')) F.datums[+b.closest('.datum-row').dataset.d] = b.dataset.v;
      else if ('clear' in b.dataset) clear();
      draw();
    });
    $('[data-val]').oninput = (e) => { F.value = e.target.value; draw(); };
    el.querySelector('.task-tabs').addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      ti = +b.dataset.t;
      clear();
      draw();
    });
    $('[data-check]').onclick = check;
    GDT.syncStars(el, 5);
    draw();
  }

  // ======================================================================
  // SINA
  // ======================================================================
  const fq = (f) => `<span class="quiz-fcf">${GDT.fcfHTML(f)}</span>`;
  const QUESTIONS = [
    {
      q: 'Tolerans çerçevesinin ilk bölmesinde ne bulunur?',
      options: ['Tolerans değeri', 'Geometrik karakteristiğin sembolü', 'Birincil datum', 'Malzeme'],
      answer: 1,
      explain: 'Çerçeve soldan sağa: sembol, bölge şekli + değer + değiştiriciler, datumlar.',
    },
    {
      q: `Bu çerçevede hata ne? ${fq({ sym: 'flatness', value: 0.05, datums: ['A'] })}`,
      options: ['Değer çok küçük', 'Düzlemsellik bir form toleransıdır, datum almaz', 'Ø eksik', 'Hata yok'],
      answer: 1,
      explain: 'Form toleransları elemanın kendi şeklini sınırlar; bir referansa göre değil. Datuma göre düzlem gerekiyorsa paralellik kullanılır.',
    },
    {
      q: 'Tolerans değerinin önündeki Ø neyi belirtir?',
      options: ['Elemanın bir delik olduğunu', 'Tolerans bölgesinin silindir ya da daire olduğunu', 'Ölçünün çap olduğunu', 'Maksimum malzeme gerekliliğini'],
      answer: 1,
      explain: 'Ø olmadan bölge iki paralel düzlem ya da doğrudur; Ø ile silindir ya da dairedir.',
    },
    {
      q: `${fq({ sym: 'position', zone: 'Ø', value: 0.1, datums: ['A', 'B', 'C'] })} çerçevesinde birincil datum hangisi?`,
      options: ['C', 'B', 'A', 'Hepsi eşit'],
      answer: 2,
      explain: 'Datumlar öncelik sırasıyla soldan sağa yazılır: A birincil, B ikincil, C üçüncül. Alfabetik sıra şart değildir; sıra yazıldığı gibidir.',
    },
    {
      q: 'Çerçevenin oku ölçü çizgisinin hizasında duruyorsa tolerans neye uygulanır?',
      options: ['Yüzeye', 'Boyut elemanının eksenine ya da orta düzlemine', 'Ölçü çizgisine', 'Datuma'],
      answer: 1,
      explain: 'Ölçü çizgisi hizasındaki ok, türetilmiş elemanı (eksen, orta düzlem) gösterir. Yüzeyde, ölçü çizgisinden uzaktaki ok ise yüzeyi.',
    },
    {
      q: 'Çerçeve içine yazılmış (kutulu) bir ölçü için hangisi doğrudur?',
      options: ['Genel toleransa tabidir', 'Teorik tam ölçüdür; kendi toleransı yoktur', 'Yardımcı ölçüdür', 'İnç cinsindendir'],
      answer: 1,
      explain: 'Teorik tam ölçü ideal geometriyi tanımlar. Sapmayı ilgili tolerans çerçevesi sınırlar; genel tolerans uygulanmaz.',
    },
    {
      q: 'Hangisi datum gerektirir?',
      options: ['Dairesellik', 'Silindiriklik', 'Diklik', 'Düzlemsellik'],
      answer: 2,
      explain: 'Diklik bir yönelim toleransıdır: “neye dik?” sorusunun cevabı datumdur. Diğer üçü form toleransıdır.',
    },
  ];

  function sina(el, api) {
    el.append(GDT.el(`
      <div class="story card">
        <p class="kicker">Sına</p>
        <p>${QUESTIONS.length} soru. Geçmek için en az ${Math.ceil(QUESTIONS.length * 0.7)} doğru gerekiyor. Her doğru cevap +5 XP.</p>
      </div>`));
    GDT.quiz(el, { id: 'm5.quiz', questions: QUESTIONS, onPass: api.done });
  }

  GDT.registerModule(5, { steps: { sezgi, kavram, oyna, sina } });
})();
