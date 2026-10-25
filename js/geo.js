'use strict';
/* Form evaluation math (minimum zone, Chebyshev) — pure functions, also runnable under Node */
const GEO = (() => {
  // ternary search on a convex function of one variable
  function tmin(f, a, b, it = 80) {
    for (let i = 0; i < it; i++) {
      const m1 = a + (b - a) / 3, m2 = b - (b - a) / 3;
      if (f(m1) <= f(m2)) b = m2; else a = m1;
    }
    const x = (a + b) / 2;
    return { x, v: f(x) };
  }
  const spread = (vals) => { let lo = Infinity, hi = -Infinity; for (const v of vals) { if (v < lo) lo = v; if (v > hi) hi = v; } return { lo, hi, w: hi - lo }; };

  // Straightness: two parallel lines of minimum separation (vertical distance; slopes are tiny)
  function minZoneLine(pts) {
    const xs = pts.map((p) => p.x), ys = pts.map((p) => p.y);
    const S = (Math.max(...ys) - Math.min(...ys)) / Math.max(1e-9, Math.max(...xs) - Math.min(...xs)) * 4 + 1e-6;
    const width = (s) => spread(pts.map((p) => p.y - s * p.x)).w;
    const r = tmin(width, -S, S);
    const sp = spread(pts.map((p) => p.y - r.x * p.x));
    return { w: sp.w, slope: r.x, lo: sp.lo, hi: sp.hi };
  }
  // zone width for a given slope (manual fitting)
  const lineWidth = (pts, s) => spread(pts.map((p) => p.y - s * p.x));

  // Flatness: two parallel planes z = ax + by + c (nested ternary search; width is convex in a, b)
  function minZonePlane(pts) {
    const zs = pts.map((p) => p.z);
    const span = Math.max(...pts.map((p) => Math.max(Math.abs(p.x), Math.abs(p.y)))) || 1;
    const S = (Math.max(...zs) - Math.min(...zs)) / span * 2 + 1e-6;
    const width = (a, b) => spread(pts.map((p) => p.z - a * p.x - b * p.y)).w;
    let best = null;
    const ra = tmin((a) => { const rb = tmin((b) => width(a, b), -S, S, 50); return rb.v; }, -S, S, 50);
    const rb = tmin((b) => width(ra.x, b), -S, S, 60);
    best = { a: ra.x, b: rb.x };
    const sp = spread(pts.map((p) => p.z - best.a * p.x - best.b * p.y));
    return { w: sp.w, a: best.a, b: best.b, lo: sp.lo, hi: sp.hi };
  }

  // Roundness: two concentric circles; search the centre with shrinking grids
  const ringWidth = (pts, cx, cy) => spread(pts.map((p) => Math.hypot(p.x - cx, p.y - cy)));
  function minZoneCircle(pts, start = { x: 0, y: 0 }, size = 1) {
    let c = { ...start }, step = size;
    let best = ringWidth(pts, c.x, c.y).w;
    for (let k = 0; k < 40; k++) {
      let moved = false;
      for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) {
        if (!i && !j) continue;
        const w = ringWidth(pts, c.x + i * step, c.y + j * step).w;
        if (w < best - 1e-12) { best = w; c = { x: c.x + i * step, y: c.y + j * step }; moved = true; }
      }
      if (!moved) step /= 2;
    }
    const sp = ringWidth(pts, c.x, c.y);
    return { w: sp.w, cx: c.x, cy: c.y, rmin: sp.lo, rmax: sp.hi };
  }

  // Best fit of a point pattern (translation + small rotation) minimising the largest position deviation
  function bestFitPattern(meas, nom) {
    const worst = (dx, dy, th) => {
      const c = Math.cos(th), s = Math.sin(th);
      let m = 0;
      meas.forEach((p, i) => {
        const x = p.x * c - p.y * s + dx, y = p.x * s + p.y * c + dy;
        m = Math.max(m, Math.hypot(x - nom[i].x, y - nom[i].y));
      });
      return m;
    };
    let st = { dx: 0, dy: 0, th: 0 }, best = worst(0, 0, 0), step = [0.2, 0.2, 0.004];
    for (let k = 0; k < 60; k++) {
      let moved = false;
      for (const [a, b, c] of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]) {
        const t = { dx: st.dx + a * step[0], dy: st.dy + b * step[1], th: st.th + c * step[2] };
        const w = worst(t.dx, t.dy, t.th);
        if (w < best - 1e-12) { best = w; st = t; moved = true; }
      }
      if (!moved) step = step.map((v) => v / 2);
    }
    return { ...st, worstR: best };
  }

  return { tmin, spread, minZoneLine, lineWidth, minZonePlane, ringWidth, minZoneCircle, bestFitPattern };
})();
if (typeof module !== 'undefined') module.exports = GEO;
