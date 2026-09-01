const COLS = 40;
const ROWS = 48;
const DEFAULT_TILE = 16;

function point(col, row, tile = DEFAULT_TILE) {
  return { x: col * tile + 8, y: row * tile + 8 };
}

function baseMap() {
  return Array.from({ length: ROWS }, (_, row) => Array.from({ length: COLS }, (_, col) => (
    row === 0 || col === 0 || row === ROWS - 1 || col === COLS - 1 ? 1 : 0
  )));
}

function horizontal(map, row, gaps = [], start = 2, end = COLS - 3) {
  for (let col = start; col <= end; col += 1) {
    if (!gaps.includes(col)) map[row][col] = 1;
  }
}

function vertical(map, col, gaps = [], start = 3, end = ROWS - 4) {
  for (let row = start; row <= end; row += 1) {
    if (!gaps.includes(row)) map[row][col] = 1;
  }
}

function block(map, col, row, width, height) {
  for (let y = row; y < row + height; y += 1) {
    for (let x = col; x < col + width; x += 1) {
      if (x > 0 && x < COLS - 1 && y > 0 && y < ROWS - 1) map[y][x] = 1;
    }
  }
}

function carve(map, col, row, radius = 1) {
  for (let y = row - radius; y <= row + radius; y += 1) {
    for (let x = col - radius; x <= col + radius; x += 1) {
      if (x > 0 && x < COLS - 1 && y > 0 && y < ROWS - 1) map[y][x] = 0;
    }
  }
}

function carveLine(map, from, to, width = 1) {
  let x = from[0];
  let y = from[1];
  carve(map, x, y, width);
  while (x !== to[0]) {
    x += Math.sign(to[0] - x);
    carve(map, x, y, width);
  }
  while (y !== to[1]) {
    y += Math.sign(to[1] - y);
    carve(map, x, y, width);
  }
}

function ensureRoute(map, route) {
  for (let index = 0; index < route.length - 1; index += 1) {
    const from = route[index];
    const to = route[index + 1];
    // Alternating axis order keeps routes from looking identical while guaranteeing connectivity.
    if (index % 2 === 0) carveLine(map, from, [to[0], from[1]], 1), carveLine(map, [to[0], from[1]], to, 1);
    else carveLine(map, from, [from[0], to[1]], 1), carveLine(map, [from[0], to[1]], to, 1);
  }
}

const DEFINITIONS = {
  bank: {
    panels: [[16, 36], [34, 24], [5, 8]], vault: [20, 4],
    setup(map) {
      horizontal(map, 10, [5, 6, 30, 31]); horizontal(map, 20, [12, 13, 34, 35]);
      horizontal(map, 30, [4, 5, 23, 24]); horizontal(map, 39, [16, 17, 34, 35]);
      vertical(map, 9, [14, 15, 34, 35, 43, 44]); vertical(map, 27, [6, 7, 25, 26, 42, 43]);
    },
    covers: [[14, 14], [31, 34], [5, 42]],
    pickups: [[31, 15], [7, 27], [34, 44], [15, 17]],
    paths: [[[13, 44], [30, 44]], [[31, 33], [31, 23]], [[4, 26], [20, 26]], [[16, 17], [34, 17]], [[4, 7], [18, 7]], [[30, 7], [30, 17]], [[13, 34], [23, 34]]],
  },
  hotel: {
    panels: [[31, 38], [7, 25], [31, 10]], vault: [20, 4],
    setup(map) {
      horizontal(map, 12, [7, 8, 20, 21, 32, 33]); horizontal(map, 24, [5, 6, 18, 19, 34, 35]);
      horizontal(map, 35, [10, 11, 28, 29]); vertical(map, 13, [7, 8, 17, 18, 29, 30, 42, 43]);
      vertical(map, 27, [10, 11, 20, 21, 39, 40]); block(map, 17, 16, 6, 4); block(map, 4, 38, 5, 3);
    },
    covers: [[18, 18], [8, 31], [30, 28], [31, 42]],
    pickups: [[7, 16], [32, 20], [6, 42], [25, 31]],
    paths: [[[28, 42], [35, 42]], [[5, 31], [11, 31]], [[30, 18], [35, 18]], [[15, 27], [24, 27]], [[5, 9], [12, 9]], [[29, 8], [35, 8]], [[17, 40], [24, 40]]],
  },
  flood: {
    panels: [[8, 39], [31, 26], [10, 11]], vault: [32, 4],
    setup(map) {
      vertical(map, 7, [8, 9, 21, 22, 36, 37]); vertical(map, 18, [14, 15, 30, 31, 42, 43]);
      vertical(map, 30, [6, 7, 23, 24, 39, 40]); horizontal(map, 17, [4, 5, 14, 15, 25, 26, 35, 36]);
      horizontal(map, 33, [8, 9, 20, 21, 31, 32]); block(map, 22, 7, 4, 5); block(map, 10, 25, 4, 4);
    },
    covers: [[12, 40], [25, 36], [34, 20]],
    pickups: [[4, 28], [24, 14], [35, 42], [14, 7]],
    paths: [[[12, 43], [26, 43]], [[24, 36], [35, 36]], [[9, 28], [17, 28]], [[32, 22], [35, 12]], [[4, 13], [15, 13]], [[20, 18], [28, 18]], [[9, 40], [9, 34]]],
  },
  casino: {
    panels: [[32, 39], [6, 25], [31, 11]], vault: [7, 4],
    setup(map) {
      block(map, 12, 14, 16, 3); block(map, 12, 29, 16, 3); block(map, 12, 17, 3, 12); block(map, 25, 17, 3, 12);
      horizontal(map, 40, [6, 7, 19, 20, 32, 33]); vertical(map, 34, [8, 9, 22, 23, 37, 38]);
      block(map, 4, 14, 4, 4); block(map, 32, 28, 4, 4);
    },
    covers: [[19, 23], [6, 34], [33, 18], [19, 43]],
    pickups: [[20, 23], [5, 38], [34, 10], [30, 35]],
    paths: [[[11, 43], [30, 43]], [[5, 34], [10, 34]], [[30, 35], [35, 35]], [[17, 23], [23, 23]], [[5, 10], [18, 10]], [[30, 8], [35, 8]], [[31, 21], [35, 21]]],
  },
  museum: {
    panels: [[20, 39], [6, 22], [33, 9]], vault: [20, 4],
    setup(map) {
      horizontal(map, 13, [5, 6, 19, 20, 33, 34]); horizontal(map, 26, [10, 11, 28, 29]);
      horizontal(map, 38, [5, 6, 19, 20, 33, 34]); vertical(map, 10, [7, 8, 19, 20, 32, 33, 43, 44]);
      vertical(map, 29, [9, 10, 22, 23, 34, 35]); block(map, 16, 17, 8, 5); block(map, 16, 29, 8, 5);
    },
    covers: [[18, 19], [22, 31], [6, 32], [33, 21]],
    pickups: [[5, 42], [34, 31], [6, 16], [32, 16]],
    paths: [[[12, 43], [28, 43]], [[5, 34], [9, 34]], [[31, 34], [35, 34]], [[5, 18], [12, 18]], [[28, 18], [35, 18]], [[14, 10], [25, 10]], [[14, 36], [25, 36]]],
  },
  train: {
    panels: [[8, 38], [30, 25], [9, 12]], vault: [30, 4],
    setup(map) {
      vertical(map, 4, [], 2, 45); vertical(map, 35, [], 2, 45);
      horizontal(map, 11, [7, 8, 31, 32], 5, 34); horizontal(map, 22, [18, 19, 30, 31], 5, 34);
      horizontal(map, 33, [8, 9, 24, 25], 5, 34); horizontal(map, 42, [17, 18, 30, 31], 5, 34);
      block(map, 13, 15, 5, 3); block(map, 23, 27, 5, 3);
    },
    covers: [[15, 16], [25, 28], [10, 37]],
    pickups: [[31, 39], [7, 28], [29, 14], [12, 7]],
    paths: [[[7, 44], [31, 44]], [[7, 36], [31, 36]], [[7, 25], [31, 25]], [[7, 14], [31, 14]], [[7, 7], [31, 7]], [[19, 19], [30, 19]], [[9, 30], [20, 30]]],
  },
  warehouse: {
    panels: [[31, 39], [6, 27], [32, 13]], vault: [6, 4],
    setup(map) {
      [[5, 34], [13, 34], [22, 34], [30, 34], [5, 22], [14, 22], [24, 22], [31, 22], [7, 10], [18, 10], [29, 10]].forEach(([x, y], i) => block(map, x, y, i % 3 === 0 ? 5 : 4, 4));
      vertical(map, 20, [6, 7, 17, 18, 29, 30, 42, 43]); horizontal(map, 17, [7, 8, 19, 20, 32, 33]);
    },
    covers: [[8, 36], [25, 36], [11, 25], [29, 25], [14, 13]],
    pickups: [[34, 42], [4, 31], [34, 18], [23, 8]],
    paths: [[[10, 43], [30, 43]], [[4, 31], [17, 31]], [[23, 30], [35, 30]], [[5, 19], [17, 19]], [[23, 18], [35, 18]], [[10, 7], [27, 7]], [[22, 39], [33, 39]]],
  },
  arctic: {
    panels: [[9, 38], [31, 25], [9, 11]], vault: [31, 4],
    setup(map) {
      horizontal(map, 9, [7, 8, 28, 29]); horizontal(map, 19, [14, 15, 34, 35]);
      horizontal(map, 29, [5, 6, 22, 23]); horizontal(map, 39, [16, 17, 32, 33]);
      vertical(map, 12, [13, 14, 24, 25, 43, 44]); vertical(map, 25, [5, 6, 15, 16, 34, 35]);
      block(map, 16, 22, 6, 4); block(map, 29, 32, 5, 3);
    },
    covers: [[18, 24], [31, 34], [7, 43]],
    pickups: [[4, 34], [34, 42], [6, 15], [30, 13]],
    paths: [[[13, 43], [31, 43]], [[5, 34], [20, 34]], [[28, 34], [35, 34]], [[4, 24], [11, 24]], [[27, 24], [35, 24]], [[5, 14], [20, 14]], [[29, 7], [35, 7]]],
  },
  archive: {
    panels: [[32, 39], [7, 23], [30, 9]], vault: [20, 4],
    setup(map) {
      for (const col of [6, 12, 18, 24, 30, 36]) vertical(map, col, [7, 8, 15, 16, 24, 25, 33, 34, 42, 43], 5, 44);
      horizontal(map, 12, [3, 4, 9, 10, 15, 16, 21, 22, 27, 28, 33, 34]);
      horizontal(map, 28, [5, 6, 12, 13, 18, 19, 25, 26, 31, 32, 36, 37]);
    },
    covers: [[9, 39], [21, 36], [15, 22], [33, 18]],
    pickups: [[4, 43], [35, 43], [4, 18], [35, 14]],
    paths: [[[8, 44], [34, 44]], [[8, 36], [28, 36]], [[8, 26], [34, 26]], [[8, 18], [34, 18]], [[8, 9], [32, 9]], [[20, 32], [20, 21]], [[27, 22], [35, 22]]],
  },
  bunker: {
    panels: [[20, 40], [6, 24], [34, 12]], vault: [20, 4],
    setup(map) {
      horizontal(map, 10, [5, 6, 19, 20, 33, 34]); horizontal(map, 20, [10, 11, 28, 29]);
      horizontal(map, 30, [5, 6, 19, 20, 33, 34]); horizontal(map, 40, [9, 10, 29, 30]);
      vertical(map, 10, [6, 7, 15, 16, 25, 26, 35, 36, 44]); vertical(map, 20, [10, 20, 30, 40]);
      vertical(map, 30, [6, 7, 15, 16, 25, 26, 35, 36, 44]); block(map, 14, 14, 4, 4); block(map, 22, 24, 4, 4); block(map, 14, 34, 4, 3);
    },
    covers: [[17, 16], [24, 26], [16, 36], [33, 34]],
    pickups: [[5, 35], [35, 42], [5, 14], [34, 24]],
    paths: [[[11, 44], [29, 44]], [[5, 35], [19, 35]], [[21, 35], [35, 35]], [[5, 25], [18, 25]], [[22, 25], [35, 25]], [[5, 15], [18, 15]], [[22, 15], [35, 15]]],
  },
};

function definitionFor(stage) {
  return DEFINITIONS[stage.map] ?? DEFINITIONS.bank;
}

export function buildMissionLayout(stage, tile = DEFAULT_TILE) {
  const definition = definitionFor(stage);
  const map = baseMap();
  definition.setup(map);
  const panelsRequired = Math.min(3, 1 + Math.floor(stage.difficulty / 3));
  const panelCells = definition.panels.slice(0, panelsRequired);
  const startCell = [20, 45];
  const route = [startCell, ...panelCells, definition.vault];
  ensureRoute(map, route);
  for (const guardPath of definition.paths) {
    for (let index = 0; index < guardPath.length - 1; index += 1) {
      const from = guardPath[index];
      const to = guardPath[index + 1];
      carveLine(map, from, [to[0], from[1]], 0);
      carveLine(map, [to[0], from[1]], to, 0);
    }
  }
  for (const cell of [...route, ...definition.covers, ...definition.pickups, ...definition.paths.flat()]) carve(map, cell[0], cell[1], 1);

  const panelPositions = panelCells.map(([col, row]) => point(col, row, tile));
  const vaultPosition = point(definition.vault[0], definition.vault[1], tile);
  const pickupPositions = definition.pickups.map(([col, row], index) => ({
    ...point(col, row, tile),
    type: index < 2 ? 'intel' : 'coin',
  }));
  const coverPositions = definition.covers.map(([col, row]) => point(col, row, tile));
  const guardPaths = definition.paths.map((path) => path.map(([col, row]) => point(col, row, tile)));

  return {
    map,
    cols: COLS,
    rows: ROWS,
    start: point(startCell[0], startCell[1], tile),
    panelPositions,
    vaultPosition,
    pickupPositions,
    coverPositions,
    guardPaths,
    signature: `${stage.map}:${definition.panels.join('|')}:${definition.vault.join(',')}`,
  };
}

export function isReachable(map, from, to) {
  const queue = [from];
  const seen = new Set([`${from[0]},${from[1]}`]);
  while (queue.length) {
    const [col, row] = queue.shift();
    if (col === to[0] && row === to[1]) return true;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const next = [col + dx, row + dy];
      const key = `${next[0]},${next[1]}`;
      if (seen.has(key) || map[next[1]]?.[next[0]] !== 0) continue;
      seen.add(key);
      queue.push(next);
    }
  }
  return false;
}

export const MISSION_LAYOUT_COUNT = Object.keys(DEFINITIONS).length;
