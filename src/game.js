export const LANES = [-2.15, 0, 2.15];
export const CAT_Z = 2;
export const OBSTACLES = { box: { height: .86, halfZ: .55 }, chair: { height: 1.35, halfZ: .55 }, cart: { height: 2.1, halfZ: .65 } };
export function createGame(random = Math.random) {
  return { phase: 'ready', lane: 1, x: 0, y: 0, vy: 0, distance: 0, fish: 0, score: 0, speed: 10, time: 0, nextRow: 32, nextId: 1, objects: [], random, combo: 0 };
}
export function startGame(g) { const random = g.random; Object.assign(g, createGame(random), { phase: 'running' }); }
export function inputGame(g, action) {
  if (g.phase !== 'running') return false;
  if (action === 'left') g.lane = Math.max(0, g.lane - 1);
  if (action === 'right') g.lane = Math.min(2, g.lane + 1);
  if (action === 'jump' && g.y === 0) { g.vy = 10; return true; }
  return false;
}
export function spawnRow(g, at) {
  const safe = Math.floor(g.random() * 3);
  const blocked = [0, 1, 2].filter(l => l !== safe);
  const count = g.distance > 160 && g.random() > .35 ? 2 : 1;
  if (g.random() > .5) blocked.reverse();
  for (const lane of blocked.slice(0, count)) {
    const roll = g.random();
    const kind = roll < .5 ? 'box' : roll < .82 ? 'chair' : 'cart';
    g.objects.push({ id: g.nextId++, kind, lane, x: LANES[lane], at, ...OBSTACLES[kind] });
  }
  for (let i = 0; i < 5; i++) g.objects.push({ id: g.nextId++, kind: 'fish', lane: safe, x: LANES[safe], at: at - 5 + i * 2, height: .8 });
  return safe;
}
export function stepGame(g, dt) {
  if (g.phase !== 'running') return [];
  const events = [];
  // Fixed substeps prevent tunnelling through obstacles on slow devices.
  let remaining = Math.min(Math.max(dt, 0), .1);
  while (remaining > 0 && g.phase === 'running') {
    const h = Math.min(remaining, 1 / 120); remaining -= h;
    g.time += h; g.speed = Math.min(23, 10 + g.distance / 140); g.distance += g.speed * h;
    g.x += (LANES[g.lane] - g.x) * Math.min(1, h * 16);
    if (g.y > 0 || g.vy > 0) {
      g.vy -= 25 * h; g.y += g.vy * h;
      if (g.y <= 0) { g.y = 0; g.vy = 0; events.push({ type: 'land' }); }
    }
    while (g.nextRow < g.distance + 105) { spawnRow(g, g.nextRow); g.nextRow += 23 + g.random() * 9; }
    for (const obj of g.objects) {
      if (obj.collected) continue;
      const z = CAT_Z + g.distance - obj.at;
      if (obj.kind === 'fish') {
        if (Math.abs(z - CAT_Z) < .8 && Math.abs(g.x - obj.x) < .85 && Math.abs(g.y + .65 - obj.height) < 1) {
          obj.collected = true; g.fish++; g.combo++; events.push({ type: 'fish', x: obj.x, y: obj.height, z });
        }
      } else if (Math.abs(z - CAT_Z) < obj.halfZ + .32 && Math.abs(g.x - obj.x) < .91 && g.y + .15 < obj.height) {
        g.phase = 'over'; events.push({ type: 'crash' }); break;
      }
    }
    g.objects = g.objects.filter(o => o.at > g.distance - 12 && !o.collected);
    g.score = Math.floor(g.distance) + g.fish * 25;
  }
  return events;
}
export function seededRandom(seed) { return () => { seed = (Math.imul(1664525, seed) + 1013904223) >>> 0; return seed / 4294967296; }; }
