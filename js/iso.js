'use strict';
/* ISO tables: ISO 2768-1/-2 general tolerances, ISO 286-1 IT grades and fundamental deviations (sizes up to 120 mm) */
const ISO = (() => {
  // ---------- ISO 2768-1 ----------
  // Linear dimensions, permissible deviation ± mm. null = not defined for that class.
  const LINEAR = [
    { lo: 0.5, hi: 3, f: 0.05, m: 0.1, c: 0.2, v: null },
    { lo: 3, hi: 6, f: 0.05, m: 0.1, c: 0.3, v: 0.5 },
    { lo: 6, hi: 30, f: 0.1, m: 0.2, c: 0.5, v: 1 },
    { lo: 30, hi: 120, f: 0.15, m: 0.3, c: 0.8, v: 1.5 },
    { lo: 120, hi: 400, f: 0.2, m: 0.5, c: 1.2, v: 2.5 },
    { lo: 400, hi: 1000, f: 0.3, m: 0.8, c: 2, v: 4 },
    { lo: 1000, hi: 2000, f: 0.5, m: 1.2, c: 3, v: 6 },
    { lo: 2000, hi: 4000, f: null, m: 2, c: 4, v: 8 },
  ];
  // Broken edges (external radii, chamfer heights), ± mm
  const EDGE = [
    { lo: 0.5, hi: 3, f: 0.2, m: 0.2, c: 0.4, v: 0.4 },
    { lo: 3, hi: 6, f: 0.5, m: 0.5, c: 1, v: 1 },
    { lo: 6, hi: Infinity, f: 1, m: 1, c: 2, v: 2 },
  ];
  // Angular dimensions by length of the shorter leg, ± minutes of arc
  const ANGLE = [
    { lo: 0, hi: 10, f: 60, m: 60, c: 90, v: 180 },
    { lo: 10, hi: 50, f: 30, m: 30, c: 60, v: 120 },
    { lo: 50, hi: 120, f: 20, m: 20, c: 30, v: 60 },
    { lo: 120, hi: 400, f: 10, m: 10, c: 15, v: 30 },
    { lo: 400, hi: Infinity, f: 5, m: 5, c: 10, v: 20 },
  ];

  // ---------- ISO 2768-2 ----------
  const STRAIGHT = [
    { lo: 0, hi: 10, H: 0.02, K: 0.05, L: 0.1 },
    { lo: 10, hi: 30, H: 0.05, K: 0.1, L: 0.2 },
    { lo: 30, hi: 100, H: 0.1, K: 0.2, L: 0.4 },
    { lo: 100, hi: 300, H: 0.2, K: 0.4, L: 0.8 },
    { lo: 300, hi: 1000, H: 0.3, K: 0.6, L: 1.2 },
    { lo: 1000, hi: 3000, H: 0.4, K: 0.8, L: 1.6 },
  ];
  const PERP = [
    { lo: 0, hi: 100, H: 0.2, K: 0.4, L: 0.6 },
    { lo: 100, hi: 300, H: 0.3, K: 0.6, L: 1 },
    { lo: 300, hi: 1000, H: 0.4, K: 0.8, L: 1.5 },
    { lo: 1000, hi: 3000, H: 0.5, K: 1, L: 2 },
  ];
  const SYM = [
    { lo: 0, hi: 100, H: 0.5, K: 0.6, L: 0.6 },
    { lo: 100, hi: 300, H: 0.5, K: 0.6, L: 1 },
    { lo: 300, hi: 1000, H: 0.5, K: 0.8, L: 1.5 },
    { lo: 1000, hi: 3000, H: 0.5, K: 1, L: 2 },
  ];
  const RUNOUT = { H: 0.1, K: 0.2, L: 0.5 };

  // First range includes its lower bound ("0,5 up to 3"), later ranges are "over lo up to hi"
  const range = (rows, size) =>
    rows.find((r, i) => (i === 0 ? size >= r.lo && size > 0 : size > r.lo) && size <= r.hi) || null;
  const linear = (size, cls) => { const r = range(LINEAR, size); return r ? r[cls] : null; };
  const edge = (size, cls) => { const r = range(EDGE, size); return r ? r[cls] : null; };
  const angle = (leg, cls) => { const r = range(ANGLE, leg); return r ? r[cls] : null; };
  const fmtAngle = (min) => {
    const d = Math.floor(min / 60), m = min % 60;
    return d ? `${d}°${m ? `${m}′` : ''}` : `0°${m}′`;
  };

  // ---------- ISO 286-1 ----------
  const SIZES = [[0, 3], [3, 6], [6, 10], [10, 18], [18, 30], [30, 50], [50, 80], [80, 120]];
  const IT = {
    5: [4, 5, 6, 8, 9, 11, 13, 15],
    6: [6, 8, 9, 11, 13, 16, 19, 22],
    7: [10, 12, 15, 18, 21, 25, 30, 35],
    8: [14, 18, 22, 27, 33, 39, 46, 54],
    9: [25, 30, 36, 43, 52, 62, 74, 87],
    10: [40, 48, 58, 70, 84, 100, 120, 140],
    11: [60, 75, 90, 110, 130, 160, 190, 220],
  };
  // Shaft fundamental deviations, µm: es for d…h, ei for k…p
  const SHAFT_FD = {
    d: [-20, -30, -40, -50, -65, -80, -100, -120],
    e: [-14, -20, -25, -32, -40, -50, -60, -72],
    f: [-6, -10, -13, -16, -20, -25, -30, -36],
    g: [-2, -4, -5, -6, -7, -9, -10, -12],
    h: [0, 0, 0, 0, 0, 0, 0, 0],
    k: [0, 1, 1, 1, 2, 2, 2, 3],
    m: [2, 4, 6, 7, 8, 9, 11, 13],
    n: [4, 8, 10, 12, 15, 17, 20, 23],
    p: [6, 12, 15, 18, 22, 26, 32, 37],
  };
  const SHAFT_LETTERS = ['d', 'e', 'f', 'g', 'h', 'js', 'k', 'm', 'n', 'p'];
  const HOLE_LETTERS = ['D', 'E', 'F', 'G', 'H', 'JS'];
  const GRADES = [5, 6, 7, 8, 9, 10, 11];

  const sizeIndex = (D) => SIZES.findIndex(([lo, hi], i) => (i === 0 ? D > 0 : D > lo) && D <= hi);
  const it = (D, grade) => IT[grade][sizeIndex(D)];
  const halfIT = (t) => (t % 2 ? t - 1 : t) / 2;   // js/JS: odd IT values rounded down to even

  function shaft(D, letter, grade) {
    const i = sizeIndex(D), t = IT[grade][i];
    if (letter === 'js') return { up: halfIT(t), lo: -halfIT(t) };
    if ('defgh'.includes(letter)) { const es = SHAFT_FD[letter][i]; return { up: es, lo: es - t }; }
    const ei = letter === 'k' && (grade < 4 || grade > 7) ? 0 : SHAFT_FD[letter][i];
    return { up: ei + t, lo: ei };
  }
  // Holes A…H mirror the shafts: EI = −es
  function hole(D, letter, grade) {
    const i = sizeIndex(D), t = IT[grade][i];
    if (letter === 'JS') return { up: halfIT(t), lo: -halfIT(t) };
    const EI = -SHAFT_FD[letter.toLowerCase()][i];
    return { up: EI + t, lo: EI };
  }
  // max/min clearance in µm; negative clearance = interference
  function fit(D, h, s) {
    const H = hole(D, h.letter, h.grade), S = shaft(D, s.letter, s.grade);
    const max = H.up - S.lo, min = H.lo - S.up;
    const type = min >= 0 ? 'clearance' : max <= 0 ? 'interference' : 'transition';
    return { H, S, max, min, type };
  }

  return {
    LINEAR, EDGE, ANGLE, STRAIGHT, PERP, SYM, RUNOUT, range, linear, edge, angle, fmtAngle,
    SIZES, IT, SHAFT_FD, SHAFT_LETTERS, HOLE_LETTERS, GRADES, sizeIndex, it, shaft, hole, fit,
  };
})();
if (typeof module !== 'undefined') module.exports = ISO;
