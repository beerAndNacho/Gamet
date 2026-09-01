import test from 'node:test';
import assert from 'node:assert/strict';

import {
  HUB_ENTRY_SPAWN,
  findNearestSafePoint,
  installMovementSafety,
  repairFieldPlayer,
  repairHubPlayer,
} from '../src/movement-safety.js';

const HUB_COLLIDERS = [
  { x: 12, y: 107, w: 84, h: 80 },
  { x: 271, y: 107, w: 101, h: 84 },
  { x: 112, y: 201, w: 155, h: 77 },
  { x: 14, y: 374, w: 76, h: 93 },
  { x: 282, y: 349, w: 76, h: 76 },
  { x: 105, y: 470, w: 102, h: 61 },
  { x: 254, y: 472, w: 96, h: 59 },
  { x: 152, y: 535, w: 80, h: 90 },
];

function pointInRect(x, y, rect, padding = 0) {
  return x >= rect.x - padding
    && x <= rect.x + rect.w + padding
    && y >= rect.y - padding
    && y <= rect.y + rect.h + padding;
}

function hubCollision(x, y) {
  return HUB_COLLIDERS.some((rect) => pointInRect(x, y, rect, 5));
}

class MockGame {
  constructor() {
    this.input = { up: false, down: false, left: false, right: false, dash: false };
    this.hub = this.createHubWorld();
    this.mission = null;
  }

  createHubWorld() {
    return { player: { x: 192, y: 520, direction: 'up', moving: false } };
  }

  hubCollision(x, y) {
    return hubCollision(x, y);
  }

  updateHub(dt) {
    const player = this.hub.player;
    const dx = (this.input.right ? 1 : 0) - (this.input.left ? 1 : 0);
    const dy = (this.input.down ? 1 : 0) - (this.input.up ? 1 : 0);
    const moving = dx !== 0 || dy !== 0;
    const speed = 72 * dt;
    const nextX = player.x + dx * speed;
    const nextY = player.y + dy * speed;
    if (!this.hubCollision(nextX, player.y)) player.x = nextX;
    if (!this.hubCollision(player.x, nextY)) player.y = nextY;
    player.moving = moving;
  }
}

test('the old office spawn is inside furniture while the repaired entrance spawn is open', () => {
  assert.equal(hubCollision(192, 520), true);
  assert.equal(hubCollision(HUB_ENTRY_SPAWN.x, HUB_ENTRY_SPAWN.y), false);
});

test('hub rescue moves an embedded player to a walkable point', () => {
  const game = new MockGame();
  assert.equal(repairHubPlayer(game), true);
  assert.deepEqual(
    { x: game.hub.player.x, y: game.hub.player.y },
    HUB_ENTRY_SPAWN,
  );
  assert.equal(game.hubCollision(game.hub.player.x, game.hub.player.y), false);
});

test('installed safety fixes every newly-created hub and coordinates actually change', () => {
  const game = new MockGame();
  installMovementSafety(game, { documentRef: null });
  game.hub = game.createHubWorld();

  assert.equal(game.hubCollision(game.hub.player.x, game.hub.player.y), false);
  const before = game.hub.player.x;
  game.input.right = true;
  game.updateHub(0.1);

  assert.ok(game.hub.player.x > before);
  assert.equal(game.hub.player.moving, true);
  assert.ok(game.__movementSafetyDiagnostics.hubRescues >= 1);
});

test('walking animation is disabled when a wall rejects all movement', () => {
  const game = new MockGame();
  installMovementSafety(game, { documentRef: null });
  game.hub.player.x = 213;
  game.hub.player.y = 500;
  game.input.left = true;
  game.updateHub(0.1);

  assert.equal(game.hub.player.x, 213);
  assert.equal(game.hub.player.moving, false);
});

test('field rescue searches outward until the player footprint is walkable', () => {
  const game = {
    mission: {
      rows: 20,
      cols: 20,
      player: { x: 32, y: 32, moving: true },
      camera: { x: 0, y: 0 },
    },
    fieldCollision(x, y) {
      return x < 64 && y < 64;
    },
  };

  assert.equal(repairFieldPlayer(game), true);
  assert.equal(game.fieldCollision(game.mission.player.x, game.mission.player.y), false);
  assert.equal(game.mission.player.moving, false);
});

test('safe-point search is deterministic and respects bounds', () => {
  const result = findNearestSafePoint({
    origin: { x: 5, y: 5 },
    collision: (x, y) => x < 20 || y < 20,
    bounds: { minX: 0, maxX: 40, minY: 0, maxY: 40 },
    preferred: [],
    maxRadius: 40,
  });

  assert.deepEqual(result, { x: 21, y: 21 });
});
