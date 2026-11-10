import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame, startGame, stepGame, inputGame, spawnRow, seededRandom, OBSTACLES } from '../src/game.js';
const fresh = () => { const g = createGame(seededRandom(42)); startGame(g); g.nextRow = Infinity; return g; };
const advance = (g, seconds) => { for (let t = 0; t < seconds; t += 1 / 60) stepGame(g, 1 / 60); };
test('ready and paused states do not advance', () => { const g = createGame(); stepGame(g, 1); assert.equal(g.distance, 0); startGame(g); g.phase = 'paused'; stepGame(g, 1); assert.equal(g.distance, 0); });
test('lane bounds and physical lateral movement', () => { const g = fresh(); inputGame(g, 'left'); inputGame(g, 'left'); assert.equal(g.lane, 0); advance(g, .6); assert.ok(Math.abs(g.x + 2.15) < .01); for (let i = 0; i < 4; i++) inputGame(g, 'right'); assert.equal(g.lane, 2); });
test('jump lands and cannot double jump', () => { const g = fresh(); assert.equal(inputGame(g, 'jump'), true); advance(g, .2); const v = g.vy; assert.equal(inputGame(g, 'jump'), false); assert.equal(g.vy, v); assert.ok(g.y > 1); advance(g, 1); assert.equal(g.y, 0); assert.equal(g.vy, 0); });
test('collision ends run; restart resets all mutable gameplay state', () => { const g = fresh(); g.objects.push({ id: 1, kind: 'box', x: 0, lane: 1, at: 3, ...OBSTACLES.box }); advance(g, 1); assert.equal(g.phase, 'over'); const d = g.distance; advance(g, 1); assert.equal(g.distance, d); startGame(g); assert.equal(g.phase, 'running'); assert.equal(g.score, 0); assert.equal(g.y, 0); assert.equal(g.objects.length, 0); });
test('correctly timed jump clears boxes and chairs', () => { for (const kind of ['box', 'chair']) { const g = fresh(); g.objects.push({ id: 1, kind, x: 0, lane: 1, at: 4, ...OBSTACLES[kind] }); inputGame(g, 'jump'); advance(g, 1); assert.equal(g.phase, 'running'); } });
test('high cart cannot be jumped over', () => { const g = fresh(); g.objects.push({ id: 1, kind: 'cart', x: 0, lane: 1, at: 4, ...OBSTACLES.cart }); inputGame(g, 'jump'); advance(g, 1); assert.equal(g.phase, 'over'); });
test('fish collected once with 25 point bonus, adjacent fish untouched', () => { const g = fresh(); g.objects.push({ id: 1, kind: 'fish', x: 0, height: .8, at: 2 }, { id: 2, kind: 'fish', x: 2.15, height: .8, at: 2 }); advance(g, .5); assert.equal(g.fish, 1); assert.equal(g.score, Math.floor(g.distance) + 25); });
test('speed increases and is capped', () => { const g = fresh(); advance(g, 10); assert.ok(g.speed > 10); g.distance = 10000; stepGame(g, 1 / 60); assert.equal(g.speed, 23); });
test('1000 generated rows always have a clear lane and fish on that lane', () => { const g = fresh(); g.distance = 1000; for (let i = 0; i < 1000; i++) { g.objects = []; const safe = spawnRow(g, i * 30); const obstacles = g.objects.filter(o => o.kind !== 'fish'); assert.ok(obstacles.length >= 1 && obstacles.length <= 2); assert.ok(obstacles.every(o => o.lane !== safe)); assert.ok(g.objects.filter(o => o.kind === 'fish').every(o => o.lane === safe)); } });
test('frame stalls do not tunnel through a nearby obstacle', () => { const g = fresh(); g.speed = 23; g.distance = 2000; g.objects.push({ id: 1, kind: 'box', x: 0, at: 2001, ...OBSTACLES.box }); stepGame(g, 2); assert.equal(g.phase, 'over'); });
test('offscreen objects are pruned', () => { const g = fresh(); g.objects.push({ id: 1, kind: 'fish', x: 2.15, height: .8, at: -30 }); stepGame(g, .01); assert.equal(g.objects.length, 0); });

test('ten minute seeded run stays playable and memory stays bounded', () => {
  const g = createGame(seededRandom(9001)); startGame(g);
  let maxObjects = 0;
  for (let frame = 0; frame < 60 * 600; frame++) {
    const next = g.objects.filter(o => o.kind !== 'fish' && o.at > g.distance - 1).sort((a, b) => a.at - b.at)[0];
    if (next) {
      const blocked = new Set(g.objects.filter(o => o.kind !== 'fish' && o.at === next.at).map(o => o.lane));
      if (blocked.has(g.lane)) {
        const target = [0, 1, 2].find(lane => !blocked.has(lane));
        while (g.lane !== target) inputGame(g, g.lane < target ? 'right' : 'left');
      }
    }
    stepGame(g, 1 / 60); maxObjects = Math.max(maxObjects, g.objects.length);
    assert.equal(g.phase, 'running', `collision at ${g.distance.toFixed(1)}m`);
  }
  assert.equal(g.speed, 23); assert.ok(g.distance > 12000); assert.ok(maxObjects < 45);
});
