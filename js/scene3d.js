'use strict';
/* Minimal three.js scene helper: transparent renderer, drag-to-orbit camera, per-frame ticks, labels.
   Axis convention in the UI: X right, Y depth, Z up (three.js Y). */
GDT.three = {
  ok: () => typeof THREE !== 'undefined',

  create(host, { height = 340, dist = 11, theta = 0.75, phi = 1.05 } = {}) {
    if (!GDT.three.ok()) {
      host.innerHTML = '<div class="msg warn">3B sahne yüklenemedi: three.js için internet bağlantısı gerekiyor. Konu anlatımı ve sorular yine çalışır.</div>';
      return null;
    }
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.outputEncoding = THREE.sRGBEncoding;
    const canvas = renderer.domElement;
    canvas.className = 'three-canvas';
    host.append(canvas);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 200);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x8899aa, 0.85));
    const sun = new THREE.DirectionalLight(0xffffff, 0.75);
    sun.position.set(6, 10, 7);
    scene.add(sun);

    const orbit = { theta, phi, dist, target: new THREE.Vector3(0, 0, 0) };
    const place = () => {
      const { theta: t, phi: p, dist: d, target } = orbit;
      camera.position.set(target.x + d * Math.sin(p) * Math.sin(t), target.y + d * Math.cos(p), target.z + d * Math.sin(p) * Math.cos(t));
      camera.lookAt(target);
    };
    place();

    let drag = null;
    canvas.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, y: e.clientY }; canvas.setPointerCapture(e.pointerId); });
    canvas.addEventListener('pointermove', (e) => {
      if (!drag) return;
      orbit.theta -= (e.clientX - drag.x) * 0.008;
      orbit.phi = GDT.clamp(orbit.phi - (e.clientY - drag.y) * 0.008, 0.25, 1.5);
      drag = { x: e.clientX, y: e.clientY };
      place();
    });
    const end = () => { drag = null; };
    canvas.addEventListener('pointerup', end);
    canvas.addEventListener('pointercancel', end);

    const resize = () => {
      const w = host.clientWidth || 300;
      renderer.setSize(w, height);
      camera.aspect = w / height;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(host);

    const ticks = [];
    let raf = 0, alive = true, last = performance.now();
    const loop = (t) => {
      if (!alive) return;
      const dt = Math.min(0.05, (t - last) / 1000);
      last = t;
      if (host.offsetParent !== null) {
        ticks.forEach((fn) => fn(dt, t / 1000));
        renderer.render(scene, camera);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return {
      scene, camera, renderer, orbit, place,
      onTick: (fn) => ticks.push(fn),
      dispose() {
        alive = false;
        cancelAnimationFrame(raf);
        ro.disconnect();
        renderer.dispose();
        canvas.remove();
      },
    };
  },

  // text label that always faces the camera
  label(text, color = '#d24a12', size = 0.7) {
    const c = document.createElement('canvas');
    c.width = 256; c.height = 128;
    const g = c.getContext('2d');
    g.fillStyle = color;
    g.beginPath();
    g.roundRect ? g.roundRect(28, 14, 200, 100, 22) : g.rect(28, 14, 200, 100);
    g.fill();
    g.fillStyle = '#fff';
    g.font = '600 64px IBM Plex Sans, sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(text, 128, 68);
    const tex = new THREE.CanvasTexture(c);
    tex.encoding = THREE.sRGBEncoding;
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true }));
    s.scale.set(size * 2, size, 1);
    s.renderOrder = 10;
    return s;
  },

  mat(color, opts = {}) {
    return new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0.15, ...opts });
  },

  // translation arrow + rotation ring for each of the six degrees of freedom
  dofGizmo(size = 2.6) {
    const group = new THREE.Group();
    const items = {};
    const axes = { X: new THREE.Vector3(1, 0, 0), Y: new THREE.Vector3(0, 0, -1), Z: new THREE.Vector3(0, 1, 0) };
    Object.entries(axes).forEach(([k, v]) => {
      // thick arrow (rod + cone) drawn on top of the part so it stays readable from every angle
      const arrow = new THREE.Group();
      const am = new THREE.MeshBasicMaterial({ color: 0x5c6b7a, depthTest: false });
      const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, size - 0.4, 10), am);
      rod.position.y = (size - 0.4) / 2;
      const cone = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.42, 16), am);
      cone.position.y = size - 0.2;
      rod.renderOrder = cone.renderOrder = 5;
      arrow.add(rod, cone);
      arrow.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v);
      arrow.material = am;
      group.add(arrow);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.06, 8, 40, Math.PI * 1.5), new THREE.MeshBasicMaterial({ color: 0x5c6b7a, depthTest: false }));
      ring.renderOrder = 5;
      ring.position.copy(v.clone().multiplyScalar(size * 0.72));
      ring.lookAt(v.clone().multiplyScalar(size * 2));
      group.add(ring);
      items[`t${k.toLowerCase()}`] = arrow;
      items[`r${k.toLowerCase()}`] = ring;
    });
    const paint = (key, hex) => { items[key].material.color.set(hex); };
    return { group, items, axes, paint };
  },
};

// Six degrees of freedom, labels used across module 6
GDT.DOF = [
  { k: 'tx', name: 'Tx', text: 'X boyunca kayma' },
  { k: 'ty', name: 'Ty', text: 'Y boyunca kayma' },
  { k: 'tz', name: 'Tz', text: 'Z boyunca kayma' },
  { k: 'rx', name: 'Rx', text: 'X etrafında dönme' },
  { k: 'ry', name: 'Ry', text: 'Y etrafında dönme' },
  { k: 'rz', name: 'Rz', text: 'Z etrafında dönme' },
];
// Apply a small motion along one DOF to an object (UI axes → three axes)
GDT.dofOffset = (obj, key, amt, base) => {
  obj.position.copy(base.pos);
  obj.rotation.copy(base.rot);
  if (key === 'tx') obj.position.x += amt;
  if (key === 'ty') obj.position.z -= amt;
  if (key === 'tz') obj.position.y += amt;
  if (key === 'rx') obj.rotation.x += amt * 0.35;
  if (key === 'ry') obj.rotation.z -= amt * 0.35;
  if (key === 'rz') obj.rotation.y += amt * 0.35;
};
