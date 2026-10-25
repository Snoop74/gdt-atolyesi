'use strict';
/* Module 0 assembly simulation — pure logic, also runs under Node for tuning */
const Sim0 = (() => {
  const NOMINAL = 20;                    // mm
  const FIT = { min: 10, max: 60 };      // functional clearance window, µm
  const CENTER = (FIT.min + FIT.max) / 2;
  const PROCESSES = [
    { hole: 'Matkap + bara', shaft: 'Kaba torna', sigma: 10, cost: 3 },
    { hole: 'Rayba', shaft: 'Hassas torna', sigma: 5, cost: 6 },
    { hole: 'Honlama', shaft: 'Taşlama', sigma: 2, cost: 14 },
    { hole: 'Lepleme', shaft: 'Lepleme', sigma: 0.8, cost: 40 },
  ];
  const INSPECT_COST = 1;      // ₺ per inspected part
  const FAIL_COST = 80;        // ₺ per non-working assembly (return, rework)
  const STARS = [
    { text: 'Fonksiyon hatası sıfır olan bir parti üret', max: Infinity },
    { text: 'Sıfır hata ve çalışan montaj başına ≤ ₺13,0', max: 13 },
    { text: 'Sıfır hata ve çalışan montaj başına ≤ ₺10,8', max: 10.8 },
  ];

  const gauss = () => {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };

  // Hole-basis system: hole zone starts at nominal, shaft zone placed so mid clearance = CENTER
  function zones({ Th, Ts }) {
    const c = Th / 2 - CENTER;
    return { hole: { lo: 0, hi: Th }, shaft: { lo: c - Ts / 2, hi: c + Ts / 2 } };
  }

  function run(p, rand = gauss) {
    const { hole, shaft } = zones(p);
    const ph = PROCESSES[p.procH], ps = PROCESSES[p.procS];
    const mh = (hole.lo + hole.hi) / 2;
    const ms = (shaft.lo + shaft.hi) / 2 + (p.drift || 0);
    const H = [], S = [];
    for (let i = 0; i < p.N; i++) {
      H.push(mh + ph.sigma * rand());
      S.push(ms + ps.sigma * rand());
    }
    const goodH = p.inspect ? H.filter((x) => x >= hole.lo && x <= hole.hi) : H;
    const goodS = p.inspect ? S.filter((x) => x >= shaft.lo && x <= shaft.hi) : S;
    const n = Math.min(goodH.length, goodS.length);
    const C = [];
    let tight = 0, loose = 0;
    for (let i = 0; i < n; i++) {
      const c = goodH[i] - goodS[i];
      C.push(c);
      if (c < FIT.min) tight++;
      else if (c > FIT.max) loose++;
    }
    const fails = tight + loose;
    const working = n - fails;
    const cost = p.N * (ph.cost + ps.cost)
      + (p.inspect ? 2 * p.N * INSPECT_COST : 0)
      + fails * FAIL_COST;
    let stars = 0;
    if (working > 0 && fails === 0) STARS.forEach((s, i) => { if (cost / working <= s.max) stars = i + 1; });
    return {
      H, S, C, hole, shaft,
      scrapH: H.length - goodH.length, scrapS: S.length - goodS.length,
      assemblies: n, tight, loose, fails, working, cost,
      unitCost: working ? cost / working : Infinity,
      spare: Math.abs(goodH.length - goodS.length), stars,
    };
  }

  return { NOMINAL, FIT, CENTER, PROCESSES, INSPECT_COST, FAIL_COST, STARS, zones, run };
})();
if (typeof module !== 'undefined') module.exports = Sim0;
