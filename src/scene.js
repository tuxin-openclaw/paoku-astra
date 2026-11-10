import * as THREE from 'three';
import { CAT_Z } from './game';

const colors = { orange: 0xe89738, darkOrange: 0xb96524, cream: 0xffe5b6, pink: 0xdc8e88, dark: 0x293e36, wood: 0xc89361, leaf: 0x527358 };
export function createScene(container) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#ced8cb'); scene.fog = new THREE.Fog('#ced8cb', 40, 115);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.22;
  container.appendChild(renderer.domElement);
  const camera = new THREE.PerspectiveCamera(49, 1, .1, 170);
  const ambient = new THREE.HemisphereLight(0xfff8e5, 0x647c6e, 2.4); scene.add(ambient);
  const sun = new THREE.DirectionalLight(0xffe7bd, 3.7); sun.position.set(-12, 22, 6); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -20, right: 20, top: 24, bottom: -35, near: 1, far: 80 });
  sun.shadow.bias = -.0008; sun.shadow.normalBias = .03; scene.add(sun); scene.add(sun.target);
  const materials = new Map(); const geometries = [];
  const boxGeo = new THREE.BoxGeometry(1, 1, 1), sphereGeo = new THREE.SphereGeometry(1, 12, 10), cylinderGeo = new THREE.CylinderGeometry(1, 1, 1, 12);
  geometries.push(boxGeo, sphereGeo, cylinderGeo);
  function material(color, roughness = .8) { const key = `${color}-${roughness}`; if (!materials.has(key)) materials.set(key, new THREE.MeshStandardMaterial({ color, roughness })); return materials.get(key); }
  function shape(parent, geo, color, pos, scale, rotate) {
    const m = new THREE.Mesh(geo, material(color)); m.position.set(...pos); m.scale.set(...scale); if (rotate) m.rotation.set(...rotate); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
  }
  const box = (p, c, pos, scale, r) => shape(p, boxGeo, c, pos, scale, r);
  const ball = (p, c, pos, scale, r) => shape(p, sphereGeo, c, pos, scale, r);
  const cylinder = (p, c, pos, scale, r) => shape(p, cylinderGeo, c, pos, scale, r);
  function label(text, bg = '#385b49', fg = '#f3f0da', w = 512, h = 128) {
    const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h; const ctx = canvas.getContext('2d');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h); ctx.fillStyle = fg; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = `bold ${Math.floor(h * .45)}px sans-serif`; ctx.fillText(text, w / 2, h / 2);
    const tex = new THREE.CanvasTexture(canvas); tex.colorSpace = THREE.SRGBColorSpace;
    const mat = new THREE.MeshBasicMaterial({ map: tex }); textures.push(tex); extraMaterials.push(mat);
    const geo = new THREE.PlaneGeometry(1, 1); geometries.push(geo); return new THREE.Mesh(geo, mat);
  }
  const textures = [], extraMaterials = [];
  // An original, fully modelled orange tabby with articulated limbs and tail.
  const cat = new THREE.Group(); scene.add(cat); cat.position.z = CAT_Z;
  const body = new THREE.Group(); cat.add(body);
  ball(body, colors.orange, [0, .72, .05], [.44, .48, .68]);
  ball(body, colors.cream, [0, .6, -.39], [.30, .33, .29]);
  const head = new THREE.Group(); head.position.set(0, 1.15, -.49); body.add(head);
  ball(head, colors.orange, [0, .06, 0], [.51, .44, .40]);
  const earGeo = new THREE.ConeGeometry(.22, .42, 3); geometries.push(earGeo);
  for (const s of [-1, 1]) {
    shape(head, earGeo, colors.orange, [s * .32, .43, 0], [1, 1, .7], [0, 0, -s * .16]);
    shape(head, earGeo, colors.pink, [s * .32, .44, -.08], [.62, .65, .45], [0, 0, -s * .16]);
    ball(head, colors.cream, [s * .17, -.08, -.32], [.22, .16, .12]);
    ball(head, 0x283d31, [s * .22, .12, -.347], [.075, .105, .045]);
    ball(head, 0xfff8df, [s * .235, .15, -.385], [.024, .033, .016]);
    box(head, colors.darkOrange, [s * .40, .1, .15], [.08, .11, .25], [0, 0, s * .25]);
    box(head, colors.darkOrange, [s * .38, -.04, .19], [.07, .08, .22], [0, 0, s * .25]);
    for (let i = 0; i < 2; i++) box(head, 0x765539, [s * .39, -.10 - i * .07, -.33], [.25, .012, .012], [0, 0, s * (.1 + i * .25)]);
  }
  ball(head, colors.pink, [0, -.075, -.445], [.07, .045, .04]);
  for (const x of [-.16, 0, .16]) box(head, colors.darkOrange, [x, .36, -.21], [.065, .11, .13], [-.55, 0, 0]);
  for (let i = 0; i < 3; i++) ball(body, colors.darkOrange, [0, 1.10, -.1 + i * .24], [.38, .055, .065]);
  const legs = [];
  for (const x of [-.28, .28]) for (const z of [-.36, .45]) {
    const leg = new THREE.Group(); leg.position.set(x, .54, z); body.add(leg); legs.push(leg);
    cylinder(leg, colors.orange, [0, -.18, 0], [.13, .42, .13]); ball(leg, colors.cream, [0, -.39, -.055], [.15, .13, .2]);
  }
  const tail = new THREE.Group(); tail.position.set(0, .88, .58); body.add(tail);
  for (let i = 0; i < 7; i++) ball(tail, i % 3 === 1 ? colors.darkOrange : colors.orange, [0, .13 * i, .12 * i], [.13 - i * .006, .18, .16]);
  const collar = cylinder(body, 0x4a7962, [0, .98, -.4], [.32, .13, .32], [Math.PI / 2, 0, 0]);
  ball(body, 0xe9bf62, [0, .79, -.7], [.075, .085, .035]);

  const chunks = [];
  const ceilings = [];
  function plant(parent, x, z, size = 1) {
    const p = new THREE.Group(); p.position.set(x, 0, z); p.scale.setScalar(size); parent.add(p);
    cylinder(p, 0xe1c8a7, [0, .37, 0], [.37, .7, .37]); cylinder(p, 0x4d4235, [0, .74, 0], [.31, .02, .31]);
    cylinder(p, 0x6c7951, [0, 1.12, 0], [.04, .9, .04]);
    for (let i = 0; i < 7; i++) { const a = i * 2.4; ball(p, i % 2 ? 0x73915e : colors.leaf, [Math.sin(a) * .28, 1.12 + i * .12, Math.cos(a) * .28], [.17, .44, .12], [Math.cos(a) * .65, 0, Math.sin(a) * .7]); }
  }
  function desk(parent, side, z) {
    const x = side * 5.5;
    box(parent, colors.wood, [x, 1.46, z], [3.5, .17, 1.9]);
    for (const dx of [-1.4, 1.4]) for (const dz of [-.7, .7]) box(parent, 0xedefdf, [x + dx, .7, z + dz], [.1, 1.4, .1]);
    const monitor = new THREE.Group(); monitor.position.set(x, 1.55, z - .3); monitor.rotation.y = side * -.2; parent.add(monitor);
    box(monitor, 0x354740, [0, .62, 0], [1.3, .85, .09]); box(monitor, 0x809e96, [0, .62, .051], [1.16, .70, .012]);
    box(monitor, 0xb8cbb8, [-.27, .67, .063], [.44, .42, .013]);
    for (let i = 0; i < 3; i++) box(monitor, 0xd7dfc6, [.25, .81 - i * .14, .066], [.37, .035, .015]);
    box(monitor, 0x354740, [0, .13, 0], [.1, .3, .1]); box(monitor, 0x354740, [0, .03, .1], [.5, .06, .35]);
    box(parent, 0xe8e6d6, [x, 1.58, z + .39], [.9, .06, .28]);
    cylinder(parent, 0xc7744d, [x + 1, 1.76, z + .3], [.13, .42, .13]);
    box(parent, 0x557563, [x - 1.17, 1.59, z + .3], [.45, .1, .65]);
    box(parent, 0xe8dcbb, [x - 1.13, 1.67, z + .3], [.42, .06, .6]);
    cylinder(parent, 0x374d40, [x, .45, z + 1.4], [.06, .8, .06]);
    box(parent, 0x78917b, [x, .9, z + 1.4], [.85, .16, .85]); box(parent, 0x78917b, [x, 1.4, z + 1.78], [.85, .9, .13]);
  }
  for (let i = 0; i < 10; i++) {
    const chunk = new THREE.Group(); scene.add(chunk); chunks.push(chunk);
    const ceiling = box(chunk, 0xe9e8d8, [0, 6.67, 0], [17.2, .12, 14]); ceiling.castShadow = false; ceilings.push(ceiling);
    box(chunk, 0xd4cbbb, [0, -.18, 0], [18, .3, 14]);
    box(chunk, 0x789186, [0, -.013, 0], [7.25, .03, 14]);
    for (const x of [-3.57, 3.57]) box(chunk, 0xc7c6a7, [x, .009, 0], [.08, .02, 14]);
    for (const x of [-1.075, 1.075]) for (let z = -6; z < 7; z += 3.5) box(chunk, 0x9eafa0, [x, .012, z], [.035, .02, 1.1]);
    for (const side of [-1, 1]) {
      desk(chunk, side, -3); plant(chunk, side * 4.8, 3.8, 1.25);
      box(chunk, 0xe7e6d6, [side * 8.65, 3, 0], [.2, 6, 14]);
      box(chunk, 0xb0c9c2, [side * 8.5, 3.6, -.2], [.09, 3.7, 10.8]);
      for (const z of [-5.7, -.2, 5.2]) box(chunk, 0xf0eedd, [side * 8.4, 3.6, z], [.15, 3.9, .09]);
      box(chunk, 0xf0eedd, [side * 8.4, 2.5, -.2], [.15, .07, 11]);
      box(chunk, 0xb2b6a6, [side * 8.4, .35, 0], [.25, .6, 14]);
      box(chunk, 0xc3c6b4, [side * 7.9, 3.2, 6.7], [.65, 6.4, .5]);
    }
    box(chunk, 0xdfe0cd, [0, 6.4, 6.7], [17, .38, .6]);
    box(chunk, 0xfff3ce, [0, 6.15, 6.65], [3.7, .06, .35]);
    if (i % 2 === 0) {
      const sign = label(i % 4 ? 'TAKE A BREAK ☕' : 'EXIT  →'); sign.position.set(0, 4.65, -5); sign.scale.set(2.1, .53, 1); chunk.add(sign);
      for (const x of [-.8, .8]) box(chunk, 0x66796a, [x, 5.5, -5], [.025, 1.3, .025]);
    }
    // Warm pools of afternoon sunlight on the floor.
    const lightMat = new THREE.MeshBasicMaterial({ color: 0xffe8b0, transparent: true, opacity: .12, depthWrite: false }); extraMaterials.push(lightMat);
    const light = new THREE.Mesh(boxGeo, lightMat); light.position.set(-.8, .025, 2); light.scale.set(12, .006, 2.5); light.rotation.y = -.45; chunk.add(light);
  }
  const objects = new Map();
  function fish() {
    const p = new THREE.Group(); ball(p, 0xf5c75d, [0, 0, 0], [.30, .18, .10]);
    const tailGeo = new THREE.ConeGeometry(.19, .27, 3); geometries.push(tailGeo);
    shape(p, tailGeo, 0xf5c75d, [-.34, 0, 0], [1, 1, .6], [0, 0, -Math.PI / 2]);
    ball(p, 0x635430, [.15, .05, .09], [.025, .025, .02]); return p;
  }
  // Cache object prototypes; spawned rows share geometry and materials.
  const prototypes = {};
  for (const kind of ['fish', 'box', 'chair', 'cart']) {
    const p = kind === 'fish' ? fish() : new THREE.Group();
    if (kind === 'box') {
      box(p, 0xc59360, [0, .43, 0], [1.15, .86, 1.1]); box(p, 0xe5c393, [0, .866, 0], [.22, .015, 1.11]); box(p, 0xe5c393, [0, .44, .558], [.22, .86, .015]);
      box(p, 0xf1e3c7, [.29, .5, .567], [.27, .23, .015]);
    }
    if (kind === 'chair') {
      cylinder(p, 0x3c5146, [0, .38, 0], [.08, .7, .08]); box(p, 0x667d6c, [0, .77, 0], [1.05, .18, .95]); box(p, 0x667d6c, [0, 1.12, -.38], [1.05, .55, .15]);
      for (const a of [0, Math.PI / 2]) box(p, 0x3c5146, [0, .12, 0], [1.2, .08, .12], [0, a, 0]);
      for (const x of [-.5, .5]) for (const z of [-.4, .4]) ball(p, 0x364b40, [x, .09, z], [.1, .1, .1]);
    }
    if (kind === 'cart') {
      for (const y of [.22, 1.05, 1.88]) box(p, 0x587f71, [0, y, 0], [1.2, .1, 1.2]);
      for (const x of [-.53, .53]) for (const z of [-.5, .5]) cylinder(p, 0x66746b, [x, 1.06, z], [.04, 2.1, .04]);
      box(p, 0xd3bb8c, [0, .57, 0], [.9, .6, .9]); box(p, 0xe1d9bc, [-.2, 1.4, 0], [.5, .6, .8]);
      cylinder(p, 0xc08259, [.32, 2.06, 0], [.18, .3, .18]);
    }
    prototypes[kind] = p;
  }
  const particles = []; const particleGeo = new THREE.BoxGeometry(.09, .09, .09); geometries.push(particleGeo);
  function burst(x, y, z, color, count = 14) {
    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(particleGeo, material(color)); mesh.position.set(x, y, z); scene.add(mesh);
      particles.push({ mesh, vx: (Math.random() - .5) * 5, vy: 2 + Math.random() * 3, vz: (Math.random() - .5) * 5, life: .6 });
    }
  }
  let shake = 0;
  function effect(event) {
    if (event.type === 'fish') burst(event.x, event.y, event.z, 0xffd46c, 10);
    if (event.type === 'land') burst(cat.position.x, .12, CAT_Z, 0xdce0c5, 7);
    if (event.type === 'crash') { shake = .65; burst(cat.position.x, 1, CAT_Z, 0xefb66c, 25); }
  }
  let previousPhase = 'ready';
  function render(g, elapsed, dt) {
    const running = g.phase === 'running'; const ready = g.phase === 'ready';
    const travel = ready ? elapsed * 1.6 : g.distance;
    ceilings.forEach(ceiling => { ceiling.visible = !ready; });
    chunks.forEach((c, i) => { c.position.z = 18 - ((i * 14 + 18 - travel % 140 + 140) % 140); });
    const activeIds = new Set(g.objects.map(o => o.id));
    if (g.phase === 'running' && previousPhase !== 'running' && g.distance < 1) { for (const mesh of objects.values()) scene.remove(mesh); objects.clear(); }
    for (const [id, mesh] of objects) if (!activeIds.has(id)) { scene.remove(mesh); objects.delete(id); }
    for (const obj of g.objects) {
      let mesh = objects.get(obj.id); if (!mesh) { mesh = prototypes[obj.kind].clone(true); scene.add(mesh); objects.set(obj.id, mesh); }
      mesh.position.set(obj.x, obj.kind === 'fish' ? obj.height + Math.sin(elapsed * 4 + obj.id) * .09 : 0, CAT_Z + g.distance - obj.at);
      if (obj.kind === 'fish') mesh.rotation.y = elapsed * 2;
    }
    cat.position.set(ready ? 2.5 : g.x, g.y, ready ? 3.8 : CAT_Z);
    cat.scale.setScalar(ready ? 1.3 : 1);
    cat.rotation.y = ready ? Math.PI + .4 : (g.x - [-2.15, 0, 2.15][g.lane]) * .12;
    cat.rotation.z = g.phase === 'over' ? -.36 : ([-2.15, 0, 2.15][g.lane] - g.x) * -.07;
    const stride = g.time * (13 + g.speed * .36);
    body.position.y = running && g.y === 0 ? Math.sin(stride * 2) * .055 : ready ? Math.sin(elapsed * 2) * .035 : 0;
    body.rotation.x = g.y > 0 ? -.10 : 0;
    legs.forEach((leg, i) => { leg.rotation.x = running ? g.y > 0 ? (i % 2 ? .5 : -.6) : Math.sin(stride + (i === 0 || i === 3 ? 0 : Math.PI)) * .72 : .05; });
    tail.rotation.z = Math.sin((running ? g.time : elapsed) * 6) * .23; tail.rotation.x = -.2;
    head.rotation.y = ready ? Math.sin(elapsed * .7) * .12 : 0;
    const portrait = camera.aspect < .8;
    const target = ready ? new THREE.Vector3(8.8, 6.8, 12) : new THREE.Vector3(g.x * .22, (portrait ? 6.2 : 5.2) + g.y * .13, portrait ? 13 : 10.5);
    camera.position.lerp(target, Math.min(1, dt * 4));
    if (shake > 0) { shake -= dt; camera.position.x += Math.sin(elapsed * 70) * shake * .22; }
    camera.lookAt(ready ? new THREE.Vector3(-.8, .8, -7) : new THREE.Vector3(g.x * .24, 1, -9));
    camera.fov = (portrait ? 68 : 49) + (g.speed - 10) * .4; camera.updateProjectionMatrix();
    for (let i = particles.length - 1; i >= 0; i--) { const p = particles[i]; p.life -= dt; p.vy -= dt * 8; p.mesh.position.x += p.vx * dt; p.mesh.position.y += p.vy * dt; p.mesh.position.z += p.vz * dt; p.mesh.rotation.x += dt * 5; p.mesh.scale.setScalar(Math.max(0, p.life / .6)); if (p.life <= 0) { scene.remove(p.mesh); particles.splice(i, 1); } }
    previousPhase = g.phase; renderer.render(scene, camera);
  }
  camera.position.set(8.8, 6.8, 12);
  const resize = () => { const { width, height } = container.getBoundingClientRect(); renderer.setSize(width, height); camera.aspect = width / height; camera.updateProjectionMatrix(); };
  const observer = new ResizeObserver(resize); observer.observe(container); resize();
  return { render, effect, dispose() { observer.disconnect(); geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose()); extraMaterials.forEach(m => m.dispose()); textures.forEach(t => t.dispose()); renderer.dispose(); renderer.domElement.remove(); } };
}
