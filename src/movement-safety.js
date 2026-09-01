const EPSILON = 0.05;
const SEARCH_STEP = 4;

export const HUB_ENTRY_SPAWN = Object.freeze({ x: 232, y: 520 });
export const HUB_BOUNDS = Object.freeze({ minX: 13, maxX: 371, minY: 112, maxY: 647 });

const HUB_FALLBACKS = Object.freeze([
  HUB_ENTRY_SPAWN,
  { x: 224, y: 448 },
  { x: 192, y: 330 },
  { x: 240, y: 444 },
]);

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

function insideBounds(point, bounds) {
  return point.x >= bounds.minX
    && point.x <= bounds.maxX
    && point.y >= bounds.minY
    && point.y <= bounds.maxY;
}

function normalizePoint(point, bounds) {
  return {
    x: clamp(Number(point?.x) || bounds.minX, bounds.minX, bounds.maxX),
    y: clamp(Number(point?.y) || bounds.minY, bounds.minY, bounds.maxY),
  };
}

/**
 * Finds an open point without allowing a player that starts inside a collider
 * to become permanently trapped. Preferred points are checked before the
 * deterministic radial search so the office entrance remains visually stable.
 */
export function findNearestSafePoint({ origin, collision, bounds, preferred = [], maxRadius = 192 }) {
  if (typeof collision !== 'function') return normalizePoint(origin, bounds);
  const start = normalizePoint(origin, bounds);
  const candidates = [...preferred, start]
    .map((point) => normalizePoint(point, bounds))
    .filter((point, index, list) => list.findIndex((other) => other.x === point.x && other.y === point.y) === index);

  for (const point of candidates) {
    if (insideBounds(point, bounds) && !collision(point.x, point.y)) return point;
  }

  for (let radius = SEARCH_STEP; radius <= maxRadius; radius += SEARCH_STEP) {
    for (let offset = -radius; offset <= radius; offset += SEARCH_STEP) {
      const ring = [
        { x: start.x + offset, y: start.y - radius },
        { x: start.x + radius, y: start.y + offset },
        { x: start.x + offset, y: start.y + radius },
        { x: start.x - radius, y: start.y + offset },
      ];
      for (const point of ring) {
        if (!insideBounds(point, bounds)) continue;
        if (!collision(point.x, point.y)) return point;
      }
    }
  }

  return null;
}

export function repairHubPlayer(game, world = game?.hub) {
  const player = world?.player;
  if (!player || typeof game?.hubCollision !== 'function') return false;
  if (!game.hubCollision(player.x, player.y)) return false;

  const safe = findNearestSafePoint({
    origin: player,
    collision: (x, y) => game.hubCollision(x, y),
    bounds: HUB_BOUNDS,
    preferred: HUB_FALLBACKS,
  });
  if (!safe) return false;

  player.x = safe.x;
  player.y = safe.y;
  player.direction = 'up';
  player.moving = false;
  return true;
}

function fieldBounds(game) {
  const mission = game?.mission;
  if (!mission) return null;
  return {
    minX: 12,
    maxX: Math.max(12, mission.cols * 16 - 12),
    minY: 12,
    maxY: Math.max(12, mission.rows * 16 - 12),
  };
}

export function repairFieldPlayer(game) {
  const player = game?.mission?.player;
  const bounds = fieldBounds(game);
  if (!player || !bounds || typeof game?.fieldCollision !== 'function') return false;
  if (!game.fieldCollision(player.x, player.y)) return false;

  const safe = findNearestSafePoint({
    origin: player,
    collision: (x, y) => game.fieldCollision(x, y),
    bounds,
    maxRadius: 256,
  });
  if (!safe) return false;

  player.x = safe.x;
  player.y = safe.y;
  player.moving = false;
  if (game.mission?.camera) {
    game.mission.camera.x = Math.max(0, safe.x - 192);
    game.mission.camera.y = Math.max(0, safe.y - 336);
  }
  return true;
}

function wrapMovement(game, methodName, getPlayer, repair) {
  const original = game?.[methodName];
  if (typeof original !== 'function') return;

  game[methodName] = function movementSafeUpdate(...args) {
    repair(this);
    const playerBefore = getPlayer(this);
    const previousX = playerBefore?.x;
    const previousY = playerBefore?.y;
    const result = original.apply(this, args);
    const playerAfter = getPlayer(this);

    if (playerAfter && Number.isFinite(previousX) && Number.isFinite(previousY)) {
      const moved = Math.hypot(playerAfter.x - previousX, playerAfter.y - previousY) > EPSILON;
      // Do not display a walking animation when collision rejected both axes.
      playerAfter.moving = moved;
    }
    repair(this);
    return result;
  };
}

function installPointerCapture(game, documentRef) {
  if (!documentRef?.querySelectorAll) return;
  for (const button of documentRef.querySelectorAll('[data-move]')) {
    const direction = button.dataset.move;
    button.style.touchAction = 'none';
    button.addEventListener('pointerdown', (event) => {
      try {
        button.setPointerCapture?.(event.pointerId);
      } catch {
        // Pointer capture is an enhancement; movement still works without it.
      }
    }, { capture: true });
    button.addEventListener('lostpointercapture', () => {
      if (direction && game.input) game.input[direction] = false;
      button.classList.remove('pressed');
    });
  }
}

export function installMovementSafety(game, { documentRef = globalThis.document } = {}) {
  if (!game || game.__movementSafetyInstalled) return game;
  game.__movementSafetyInstalled = true;
  game.__movementSafetyDiagnostics = { hubRescues: 0, fieldRescues: 0 };

  const originalCreateHubWorld = game.createHubWorld?.bind(game);
  if (originalCreateHubWorld) {
    game.createHubWorld = (...args) => {
      const world = originalCreateHubWorld(...args);
      if (repairHubPlayer(game, world)) game.__movementSafetyDiagnostics.hubRescues += 1;
      return world;
    };
  }

  if (repairHubPlayer(game)) game.__movementSafetyDiagnostics.hubRescues += 1;

  wrapMovement(
    game,
    'updateHub',
    (current) => current.hub?.player,
    (current) => {
      const rescued = repairHubPlayer(current);
      if (rescued) current.__movementSafetyDiagnostics.hubRescues += 1;
      return rescued;
    },
  );
  wrapMovement(
    game,
    'updateField',
    (current) => current.mission?.player,
    (current) => {
      const rescued = repairFieldPlayer(current);
      if (rescued) current.__movementSafetyDiagnostics.fieldRescues += 1;
      return rescued;
    },
  );

  installPointerCapture(game, documentRef);
  return game;
}
