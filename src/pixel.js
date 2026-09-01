import { CREW, getCrew } from './content.js';

export const VIEW_WIDTH = 384;
export const VIEW_HEIGHT = 672;
export const TILE = 16;

const COLORS = {
  outline: '#061018',
  shadow: '#02070b',
  white: '#e8f5ee',
  muted: '#78979d',
  cyan: '#56e2d0',
  gold: '#f3c55b',
  red: '#ff685f',
  green: '#72df9b',
  blue: '#63b6eb',
};

function rect(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

function line(ctx, x1, y1, x2, y2, color, width = 1) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(Math.round(x1), Math.round(y1));
  ctx.lineTo(Math.round(x2), Math.round(y2));
  ctx.stroke();
}

function text(ctx, value, x, y, color = COLORS.white, size = 8, align = 'left') {
  ctx.fillStyle = color;
  ctx.font = `bold ${size}px monospace`;
  ctx.textAlign = align;
  ctx.textBaseline = 'top';
  ctx.fillText(String(value), Math.round(x), Math.round(y));
}

export function clearCanvas(ctx, color = '#07101a') {
  ctx.imageSmoothingEnabled = false;
  rect(ctx, 0, 0, VIEW_WIDTH, VIEW_HEIGHT, color);
}

export function drawCharacter(ctx, crewOrId, x, y, options = {}) {
  const crew = typeof crewOrId === 'string' ? getCrew(crewOrId) : crewOrId;
  const scale = options.scale ?? 1;
  const frame = Math.floor(options.frame ?? 0) % 2;
  const direction = options.direction ?? 'down';
  const alpha = options.alpha ?? 1;
  const highlight = options.highlight ?? false;
  const drone = crew.id === 'nabi';
  const px = Math.round(x);
  const py = Math.round(y + (frame ? 1 : 0));

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(px, py);
  ctx.scale(scale, scale);

  if (highlight) {
    rect(ctx, -8, 13, 16, 3, 'rgba(86,226,208,0.28)');
    rect(ctx, -6, 14, 12, 2, crew.color);
  } else {
    rect(ctx, -6, 13, 12, 2, 'rgba(0,0,0,0.32)');
  }

  if (drone) {
    rect(ctx, -7, -7, 14, 12, COLORS.outline);
    rect(ctx, -6, -6, 12, 10, '#cbe8e8');
    rect(ctx, -5, -4, 10, 5, '#183342');
    rect(ctx, -3, -3, 2, 2, crew.color);
    rect(ctx, 1, -3, 2, 2, crew.color);
    rect(ctx, -8, -3, 2, 5, '#7f9da3');
    rect(ctx, 6, -3, 2, 5, '#7f9da3');
    rect(ctx, -11, -2, 3, 2, crew.color);
    rect(ctx, 8, -2, 3, 2, crew.color);
    rect(ctx, -1, 4, 2, 5, '#7f9da3');
    rect(ctx, -3, 8, 6, 3, '#314f59');
    rect(ctx, -1, 8, 2, 2, COLORS.cyan);
    ctx.restore();
    return;
  }

  const facingSide = direction === 'left' || direction === 'right';
  const flip = direction === 'left' ? -1 : 1;
  ctx.scale(flip, 1);

  // legs
  rect(ctx, -5, 7, 4, 6 + frame, COLORS.outline);
  rect(ctx, 1, 7, 4, 6 + (frame ? 0 : 1), COLORS.outline);
  rect(ctx, -4, 7, 3, 5 + frame, '#1a2933');
  rect(ctx, 1, 7, 3, 5 + (frame ? 0 : 1), '#1a2933');
  rect(ctx, -5, 12 + frame, 5, 2, '#071018');
  rect(ctx, 1, 12 + (frame ? 0 : 1), 5, 2, '#071018');

  // body and arms
  rect(ctx, -7, -1, 14, 10, COLORS.outline);
  rect(ctx, -6, 0, 12, 8, crew.coat);
  rect(ctx, -8, 0 + frame, 3, 8, COLORS.outline);
  rect(ctx, 5, 0 + (frame ? 0 : 1), 3, 8, COLORS.outline);
  rect(ctx, -7, 1 + frame, 2, 6, crew.coat);
  rect(ctx, 5, 1 + (frame ? 0 : 1), 2, 6, crew.coat);
  rect(ctx, -1, 0, 2, 8, crew.color);

  // neck/head
  rect(ctx, -2, -4, 4, 4, crew.skin);
  rect(ctx, -6, -13, 12, 10, COLORS.outline);
  rect(ctx, -5, -12, 10, 9, crew.skin);

  // hair
  rect(ctx, -6, -14, 12, 4, COLORS.outline);
  rect(ctx, -5, -13, 10, 3, crew.hair);
  rect(ctx, -5, -10, 2, 3, crew.hair);
  if (crew.id === 'harin') {
    rect(ctx, 4, -12, 3, 12, crew.hair);
    rect(ctx, -7, -12, 3, 12, crew.hair);
  }
  if (crew.id === 'juno') {
    rect(ctx, 1, -15, 4, 4, crew.color);
    rect(ctx, 4, -13, 4, 3, crew.hair);
  }
  if (crew.id === 'minhyuk') {
    rect(ctx, -5, -15, 10, 2, COLORS.blue);
    rect(ctx, -3, -14, 2, 2, '#bcecff');
    rect(ctx, 1, -14, 2, 2, '#bcecff');
  }
  if (crew.id === 'jaewook') {
    rect(ctx, -5, -14, 10, 2, crew.hair);
    rect(ctx, -2, 1, 4, 5, '#dcecea');
    rect(ctx, -1, 2, 2, 6, crew.color);
  }

  // face details
  if (!facingSide && direction !== 'up') {
    rect(ctx, -3, -8, 2, 2, '#30231f');
    rect(ctx, 2, -8, 2, 2, '#30231f');
    rect(ctx, -1, -4, 3, 1, '#9b504a');
  } else if (facingSide) {
    rect(ctx, 2, -8, 2, 2, '#30231f');
  }

  // equipment detail
  if (crew.id === 'seojin') rect(ctx, 3, 1, 3, 3, '#d9f7f0');
  if (crew.id === 'juno') {
    rect(ctx, 6, 1, 3, 8, '#aebfc2');
    rect(ctx, 7, -1, 2, 3, crew.color);
  }
  if (crew.id === 'harin') rect(ctx, 4, 2, 3, 5, '#f1e2aa');

  ctx.restore();
}

export function createCharacterCanvas(crewId, { portrait = false, expression = 'normal' } = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = portrait ? 48 : 32;
  canvas.height = portrait ? 54 : 48;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  const crew = getCrew(crewId);
  rect(ctx, 0, 0, canvas.width, canvas.height, '#0a1b28');
  rect(ctx, 2, 2, canvas.width - 4, canvas.height - 4, crew.coat);
  for (let yy = 4; yy < canvas.height - 4; yy += 4) {
    for (let xx = 4; xx < canvas.width - 4; xx += 4) {
      if ((xx + yy) % 12 === 0) rect(ctx, xx, yy, 2, 2, 'rgba(255,255,255,0.035)');
    }
  }

  if (!portrait) {
    drawCharacter(ctx, crew, 16, 29, { scale: 1.65, frame: 0, highlight: true });
    return canvas;
  }

  if (crew.id === 'nabi') {
    ctx.save();
    ctx.translate(24, 28);
    ctx.scale(2.2, 2.2);
    drawCharacter(ctx, crew, 0, 0, { scale: 1, frame: 0, highlight: false });
    ctx.restore();
    return canvas;
  }

  // Pixel portrait: upper body and expressive face.
  rect(ctx, 7, 40, 34, 14, COLORS.outline);
  rect(ctx, 9, 40, 30, 14, crew.coat);
  rect(ctx, 22, 40, 4, 14, crew.color);
  rect(ctx, 20, 35, 8, 7, crew.skin);
  rect(ctx, 10, 12, 28, 26, COLORS.outline);
  rect(ctx, 12, 14, 24, 23, crew.skin);
  rect(ctx, 9, 9, 30, 9, COLORS.outline);
  rect(ctx, 11, 10, 26, 8, crew.hair);
  rect(ctx, 10, 15, 5, 14, crew.hair);
  if (crew.id === 'harin') rect(ctx, 34, 15, 6, 27, crew.hair);
  if (crew.id === 'juno') {
    rect(ctx, 26, 6, 9, 6, crew.color);
    rect(ctx, 34, 9, 6, 6, crew.hair);
  }
  if (crew.id === 'minhyuk') {
    rect(ctx, 13, 8, 22, 4, COLORS.blue);
    rect(ctx, 17, 9, 5, 3, '#c8f4ff');
    rect(ctx, 27, 9, 5, 3, '#c8f4ff');
  }

  if (expression === 'worried') {
    rect(ctx, 17, 23, 5, 2, '#34231f');
    rect(ctx, 27, 23, 5, 2, '#34231f');
    rect(ctx, 21, 32, 8, 2, '#945148');
  } else if (expression === 'happy') {
    rect(ctx, 17, 24, 5, 2, '#34231f');
    rect(ctx, 27, 24, 5, 2, '#34231f');
    rect(ctx, 20, 30, 10, 3, '#914948');
    rect(ctx, 23, 30, 5, 1, '#f6e9df');
  } else {
    rect(ctx, 18, 23, 3, 3, '#34231f');
    rect(ctx, 28, 23, 3, 3, '#34231f');
    rect(ctx, 22, 31, 7, 2, '#945148');
  }
  return canvas;
}

function drawFloor(ctx, yStart, colors, phase = 0) {
  const [floorA, floorB, seam] = colors;
  for (let y = yStart; y < VIEW_HEIGHT; y += TILE) {
    for (let x = 0; x < VIEW_WIDTH; x += TILE) {
      const checker = ((x / TILE) + (y / TILE)) % 2;
      rect(ctx, x, y, TILE, TILE, checker ? floorA : floorB);
      if (((x + y + phase) / TILE) % 5 === 0) rect(ctx, x + 3, y + 4, 2, 2, seam);
      line(ctx, x, y + TILE - 1, x + TILE, y + TILE - 1, 'rgba(0,0,0,0.12)');
      line(ctx, x + TILE - 1, y, x + TILE - 1, y + TILE, 'rgba(255,255,255,0.025)');
    }
  }
}

function drawWindow(ctx, x, y, w = 48, h = 34, time = 0) {
  rect(ctx, x - 3, y - 3, w + 6, h + 6, '#061018');
  rect(ctx, x, y, w, h, '#0a1d35');
  rect(ctx, x + 2, y + 2, w - 4, h - 4, '#102b51');
  for (let i = 0; i < 7; i += 1) {
    const sx = x + 5 + ((i * 13 + 7) % (w - 9));
    const sy = y + 4 + ((i * 7 + Math.floor(time / 800)) % (h - 8));
    rect(ctx, sx, sy, i % 2 ? 1 : 2, i % 2 ? 1 : 2, i % 3 ? '#d6f4f0' : '#f3c55b');
  }
  line(ctx, x + w / 2, y, x + w / 2, y + h, '#0a1522', 2);
}

function drawDesk(ctx, x, y, w = 64, color = '#684731') {
  rect(ctx, x, y, w, 17, COLORS.outline);
  rect(ctx, x + 2, y + 2, w - 4, 12, color);
  rect(ctx, x + 5, y + 17, 5, 17, COLORS.outline);
  rect(ctx, x + w - 10, y + 17, 5, 17, COLORS.outline);
}

function drawBoard(ctx, x, y, glow = false) {
  rect(ctx, x, y, 64, 45, COLORS.outline);
  rect(ctx, x + 3, y + 3, 58, 39, '#433324');
  rect(ctx, x + 8, y + 8, 14, 10, '#d9c79b');
  rect(ctx, x + 28, y + 7, 24, 13, '#d5b58a');
  rect(ctx, x + 12, y + 25, 18, 11, '#cab07e');
  rect(ctx, x + 37, y + 24, 16, 11, '#e2d1aa');
  if (glow) {
    line(ctx, x - 2, y - 2, x + 66, y - 2, COLORS.gold, 2);
    line(ctx, x - 2, y + 47, x + 66, y + 47, COLORS.gold, 2);
  }
}

function drawWorkbench(ctx, x, y, glow = false, frame = 0) {
  drawDesk(ctx, x, y + 24, 74, '#654737');
  rect(ctx, x + 6, y + 8, 24, 17, COLORS.outline);
  rect(ctx, x + 8, y + 10, 20, 13, '#183348');
  rect(ctx, x + 11, y + 13, 12, 2, COLORS.cyan);
  rect(ctx, x + 15, y + 17, 8, 2, COLORS.green);
  rect(ctx, x + 42, y + 13, 22, 9, '#87989b');
  rect(ctx, x + 49 + frame, y + 5, 5, 16, '#b991ff');
  if (glow) rect(ctx, x + 5, y + 4, 64, 2, COLORS.cyan);
}

function drawArchive(ctx, x, y, glow = false) {
  rect(ctx, x, y, 54, 55, COLORS.outline);
  rect(ctx, x + 3, y + 3, 48, 49, '#344452');
  for (let row = 0; row < 3; row += 1) {
    rect(ctx, x + 6, y + 7 + row * 14, 42, 10, '#1b2f3d');
    rect(ctx, x + 10, y + 10 + row * 14, 9, 4, row === 0 ? '#f3c55b' : '#7da4ad');
    rect(ctx, x + 22, y + 10 + row * 14, 18, 3, '#637e84');
  }
  if (glow) rect(ctx, x - 2, y + 19, 2, 18, COLORS.violet ?? '#b991ff');
}

function drawDoor(ctx, x, y, glow = false, color = '#4e6570') {
  rect(ctx, x, y, 46, 62, COLORS.outline);
  rect(ctx, x + 4, y + 4, 38, 58, color);
  rect(ctx, x + 9, y + 9, 28, 37, '#102331');
  rect(ctx, x + 31, y + 51, 4, 4, COLORS.gold);
  if (glow) {
    rect(ctx, x - 3, y - 3, 52, 3, COLORS.cyan);
    rect(ctx, x - 3, y + 62, 52, 3, COLORS.cyan);
  }
}

export function drawHub(ctx, world, state, time) {
  clearCanvas(ctx, '#07101a');
  const yStart = 50;
  rect(ctx, 0, yStart, VIEW_WIDTH, 58, '#182e3b');
  rect(ctx, 0, yStart + 52, VIEW_WIDTH, 5, '#315464');
  drawFloor(ctx, yStart + 57, ['#142d38', '#17343f', '#244854'], Math.floor(time / 600));

  // walls and windows
  drawWindow(ctx, 22, 63, 54, 31, time);
  drawWindow(ctx, 164, 63, 56, 31, time + 320);
  drawWindow(ctx, 307, 63, 54, 31, time + 640);
  rect(ctx, 95, 62, 47, 33, '#0b1d29');
  text(ctx, 'UNIT 07', 118, 74, COLORS.cyan, 8, 'center');
  text(ctx, 'RECOVERY', 118, 84, '#7899a0', 5, 'center');
  rect(ctx, 239, 66, 48, 24, '#071722');
  text(ctx, `DAY ${String(state.day).padStart(2, '0')}`, 263, 72, COLORS.gold, 7, 'center');
  text(ctx, 'NIGHT', 263, 82, '#7899a0', 5, 'center');

  // stations
  const near = world.nearInteractable;
  drawBoard(ctx, 23, 123, near?.id === 'board');
  text(ctx, 'CONTRACTS', 55, 171, '#8ca6aa', 6, 'center');
  drawWorkbench(ctx, 282, 118, near?.id === 'workbench', Math.floor(time / 400) % 2);
  text(ctx, 'WORKBENCH', 319, 173, '#8ca6aa', 6, 'center');
  drawArchive(ctx, 24, 390, near?.id === 'archive');
  text(ctx, 'ARCHIVE', 51, 450, '#8ca6aa', 6, 'center');
  drawDoor(ctx, 169, 555, near?.id === 'door', state.selectedStage ? '#486276' : '#354852');
  text(ctx, state.selectedStage ? 'DEPLOY' : 'LOCKED', 192, 622, state.selectedStage ? COLORS.cyan : '#64777b', 7, 'center');

  // office props
  drawDesk(ctx, 126, 228, 128, '#5a4231');
  rect(ctx, 151, 208, 34, 21, COLORS.outline);
  rect(ctx, 154, 211, 28, 16, '#102a3e');
  rect(ctx, 159, 215, 18, 2, COLORS.cyan);
  rect(ctx, 199, 210, 30, 18, '#d4be8d');
  rect(ctx, 204, 214, 20, 2, '#8d7650');
  rect(ctx, 122, 247, 12, 20, '#263946');
  rect(ctx, 247, 247, 12, 20, '#263946');
  rect(ctx, 293, 365, 55, 45, COLORS.outline);
  rect(ctx, 297, 369, 47, 37, '#243946');
  for (let row = 0; row < 3; row += 1) {
    rect(ctx, 302, 374 + row * 10, 12, 5, row === 1 ? COLORS.gold : '#617b80');
    rect(ctx, 319, 374 + row * 10, 18, 5, '#455e65');
  }
  rect(ctx, 117, 483, 77, 32, COLORS.outline);
  rect(ctx, 120, 486, 71, 25, '#343e45');
  text(ctx, 'REST', 155, 495, '#82999b', 7, 'center');
  rect(ctx, 268, 488, 68, 28, COLORS.outline);
  rect(ctx, 271, 491, 62, 22, '#223945');
  text(ctx, 'LOCKERS', 302, 499, '#82999b', 6, 'center');

  // ambient lamps
  const lampGlow = 0.65 + Math.sin(time / 520) * 0.12;
  ctx.globalAlpha = lampGlow;
  rect(ctx, 92, 110, 13, 5, COLORS.gold);
  rect(ctx, 263, 110, 13, 5, COLORS.gold);
  ctx.globalAlpha = 1;

  // crew NPCs
  for (const npc of world.npcs) {
    const crew = getCrew(npc.id);
    const bob = Math.sin(time / 700 + npc.x) > 0 ? 1 : 0;
    drawCharacter(ctx, crew, npc.x, npc.y + bob, {
      direction: npc.direction,
      frame: Math.floor(time / 450 + npc.x) % 2,
      highlight: near?.id === `crew:${npc.id}`,
    });
    if (near?.id === `crew:${npc.id}`) {
      rect(ctx, npc.x - 11, npc.y - 33, 22, 11, '#061018');
      text(ctx, 'E', npc.x, npc.y - 31, COLORS.gold, 7, 'center');
    }
  }

  // player
  drawCharacter(ctx, getCrew(state.selectedCrew), world.player.x, world.player.y, {
    direction: world.player.direction,
    frame: world.player.moving ? Math.floor(time / 120) % 2 : 0,
    highlight: true,
  });

  // interaction label
  if (near) {
    const labels = {
      board: 'E 계약 게시판',
      workbench: 'E 장비 개조',
      archive: 'E 사건 기록',
      door: state.selectedStage ? 'E 현장 출동' : '계약을 먼저 선택',
    };
    const label = near.id.startsWith('crew:') ? `E ${getCrew(near.id.split(':')[1]).name}와 대화` : labels[near.id];
    rect(ctx, 88, 635, 208, 20, 'rgba(3,9,14,0.86)');
    text(ctx, label, 192, 641, near.id === 'door' && !state.selectedStage ? COLORS.muted : COLORS.white, 7, 'center');
  }
}

function drawWallTile(ctx, x, y, palette, variant = 0) {
  rect(ctx, x, y, TILE, TILE, palette[1]);
  rect(ctx, x, y, TILE, 3, palette[2]);
  rect(ctx, x + 2, y + 5, 12, 7, palette[0]);
  if (variant % 3 === 0) rect(ctx, x + 4, y + 7, 3, 2, 'rgba(255,255,255,0.06)');
}

function drawFloorTile(ctx, x, y, stage, tileValue, time) {
  const [base, mid, accent] = stage.palette;
  const checker = ((x / TILE) + (y / TILE)) % 2;
  rect(ctx, x, y, TILE, TILE, checker ? base : mid);
  if (stage.map === 'flood') {
    rect(ctx, x, y + 12, TILE, 4, 'rgba(99,182,235,0.13)');
    const wave = (Math.floor(time / 220) + x / TILE) % 4;
    if (wave === 0) rect(ctx, x + 3, y + 6, 8, 1, 'rgba(160,235,244,0.22)');
  }
  if (stage.map === 'casino' && (x / TILE + y / TILE) % 5 === 0) rect(ctx, x + 6, y + 6, 4, 4, accent);
  if (stage.map === 'arctic') rect(ctx, x + 1, y + 1, 5, 1, 'rgba(220,255,255,0.18)');
  if (stage.map === 'train') line(ctx, x, y + 8, x + TILE, y + 8, 'rgba(255,255,255,0.05)');
  if (tileValue === 3) rect(ctx, x + 6, y + 6, 4, 4, accent);
}

function drawFieldObject(ctx, object, stage, time, active = false) {
  const x = object.x;
  const y = object.y;
  if (object.type === 'panel') {
    rect(ctx, x - 8, y - 12, 16, 22, COLORS.outline);
    rect(ctx, x - 6, y - 10, 12, 18, '#2d424b');
    rect(ctx, x - 4, y - 7, 8, 6, object.done ? '#1c3b31' : '#112837');
    rect(ctx, x - 3, y - 6, 2, 2, object.done ? COLORS.green : COLORS.red);
    rect(ctx, x + 1, y - 6, 2, 2, object.done ? COLORS.green : COLORS.gold);
    if (active && !object.done) rect(ctx, x - 10, y - 15, 20, 2, COLORS.cyan);
  } else if (object.type === 'vault') {
    rect(ctx, x - 17, y - 24, 34, 46, COLORS.outline);
    rect(ctx, x - 14, y - 21, 28, 40, '#3a5057');
    rect(ctx, x - 10, y - 15, 20, 25, '#142b35');
    ctx.strokeStyle = '#8fa2a3';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y - 3, 7, 0, Math.PI * 2);
    ctx.stroke();
    rect(ctx, x - 1, y - 10, 2, 14, '#8fa2a3');
    rect(ctx, x - 7, y - 4, 14, 2, '#8fa2a3');
    if (active) {
      rect(ctx, x - 19, y - 27, 38, 2, COLORS.gold);
      rect(ctx, x - 19, y + 23, 38, 2, COLORS.gold);
    }
  } else if (object.type === 'intel') {
    const bob = Math.floor(time / 280 + x) % 2;
    rect(ctx, x - 5, y - 6 - bob, 10, 9, COLORS.outline);
    rect(ctx, x - 4, y - 5 - bob, 8, 7, object.collected ? '#27353b' : COLORS.violet ?? '#b991ff');
    rect(ctx, x - 2, y - 3 - bob, 4, 1, '#edf7f4');
  } else if (object.type === 'coin') {
    const bob = Math.floor(time / 220 + x) % 2;
    rect(ctx, x - 4, y - 5 - bob, 8, 8, COLORS.outline);
    rect(ctx, x - 3, y - 4 - bob, 6, 6, object.collected ? '#27353b' : COLORS.gold);
    rect(ctx, x, y - 3 - bob, 1, 4, '#fff0b5');
  } else if (object.type === 'cover') {
    rect(ctx, x - 11, y - 9, 22, 18, COLORS.outline);
    rect(ctx, x - 9, y - 7, 18, 14, stage.map === 'museum' ? '#715e45' : '#5a4332');
    rect(ctx, x - 6, y - 4, 12, 2, 'rgba(255,255,255,0.1)');
  }
}

function drawVisionCone(ctx, guard, detection, color = 'rgba(255,104,95,0.11)') {
  const length = guard.range ?? 72;
  const width = guard.cone ?? 0.65;
  ctx.save();
  ctx.translate(guard.x, guard.y - 5);
  ctx.rotate(guard.angle);
  ctx.fillStyle = detection ? 'rgba(255,104,95,0.23)' : color;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(length, -length * width);
  ctx.lineTo(length, length * width);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawGuard(ctx, guard, time) {
  if (guard.type === 'camera') {
    rect(ctx, guard.x - 5, guard.y - 7, 10, 7, COLORS.outline);
    rect(ctx, guard.x - 4, guard.y - 6, 8, 5, '#7c8f93');
    rect(ctx, guard.x + Math.cos(guard.angle) * 4, guard.y - 5 + Math.sin(guard.angle) * 4, 3, 3, COLORS.red);
    rect(ctx, guard.x - 1, guard.y, 2, 7, '#4a5f65');
    return;
  }
  if (guard.type === 'drone') {
    const bob = Math.floor(time / 260 + guard.x) % 2;
    rect(ctx, guard.x - 7, guard.y - 7 - bob, 14, 9, COLORS.outline);
    rect(ctx, guard.x - 5, guard.y - 5 - bob, 10, 5, '#9fb5b7');
    rect(ctx, guard.x - 2, guard.y - 4 - bob, 4, 3, guard.detecting ? COLORS.red : COLORS.cyan);
    rect(ctx, guard.x - 11, guard.y - 4 - bob, 4, 2, '#71888d');
    rect(ctx, guard.x + 7, guard.y - 4 - bob, 4, 2, '#71888d');
    return;
  }
  rect(ctx, guard.x - 6, guard.y + 10, 12, 2, 'rgba(0,0,0,0.28)');
  rect(ctx, guard.x - 5, guard.y - 10, 10, 20, COLORS.outline);
  rect(ctx, guard.x - 4, guard.y - 2, 8, 11, '#493642');
  rect(ctx, guard.x - 4, guard.y - 9, 8, 7, '#c39470');
  rect(ctx, guard.x - 5, guard.y - 11, 10, 4, '#20282e');
  rect(ctx, guard.x + Math.cos(guard.angle) * 5 - 1, guard.y - 7 + Math.sin(guard.angle) * 5, 3, 3, guard.detecting ? COLORS.red : COLORS.gold);
}

function missionObjective(mission) {
  return mission.objects.find((object) => object.type === 'panel' && !object.done)
    ?? mission.objects.find((object) => object.type === 'vault')
    ?? null;
}

function objectiveLabel(object) {
  return object?.type === 'panel' ? '배전반' : object?.type === 'vault' ? '금고실' : '목표';
}

function drawObjectiveMarker(ctx, object, time) {
  if (!object) return;
  const pulse = Math.floor(time / 260) % 2;
  const color = object.type === 'vault' ? COLORS.gold : COLORS.cyan;
  const y = object.y - (object.type === 'vault' ? 36 : 25) - pulse * 2;
  rect(ctx, object.x - 9, y, 18, 2, color);
  rect(ctx, object.x - 9, y, 2, 6, color);
  rect(ctx, object.x + 7, y, 2, 6, color);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(object.x, y + 10);
  ctx.lineTo(object.x - 5, y + 4);
  ctx.lineTo(object.x + 5, y + 4);
  ctx.closePath();
  ctx.fill();
  text(ctx, 'TARGET', object.x, y - 8, color, 6, 'center');
}

function drawObjectiveCompass(ctx, mission, target, time) {
  if (!target) return;
  const dx = target.x - mission.player.x;
  const dy = target.y - mission.player.y;
  const distanceTiles = Math.max(1, Math.round(Math.hypot(dx, dy) / TILE));
  const angle = Math.atan2(dy, dx);
  const directions = ['→', '↘', '↓', '↙', '←', '↖', '↑', '↗'];
  const normalized = (angle + Math.PI * 2) % (Math.PI * 2);
  const direction = directions[Math.round(normalized / (Math.PI / 4)) % 8];
  const label = `${direction} ${objectiveLabel(target)} ${distanceTiles}칸`;
  const width = Math.min(146, 42 + label.length * 7);
  const x = Math.round((VIEW_WIDTH - width) / 2);
  const pulse = Math.floor(time / 320) % 2;
  rect(ctx, x, 146, width, 19, 'rgba(4,12,18,0.92)');
  rect(ctx, x + 1, 147, width - 2, 17, '#102637');
  rect(ctx, x + 1, 147, 3, 17, target.type === 'vault' ? COLORS.gold : COLORS.cyan);
  text(ctx, label, VIEW_WIDTH / 2 + pulse, 152, target.type === 'vault' ? COLORS.gold : COLORS.cyan, 7, 'center');

  const screenX = target.x - mission.camera.x;
  const screenY = target.y - mission.camera.y;
  const visibleTarget = screenX > 18 && screenX < VIEW_WIDTH - 18 && screenY > 172 && screenY < 560;
  if (visibleTarget) return;
  const edgeX = Math.min(VIEW_WIDTH - 22, Math.max(22, screenX));
  const edgeY = Math.min(555, Math.max(178, screenY));
  ctx.save();
  ctx.translate(edgeX, edgeY);
  ctx.rotate(angle);
  ctx.fillStyle = target.type === 'vault' ? COLORS.gold : COLORS.cyan;
  ctx.beginPath();
  ctx.moveTo(8 + pulse * 2, 0);
  ctx.lineTo(-5, -6);
  ctx.lineTo(-5, 6);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function drawField(ctx, mission, state, time) {
  const stage = mission.stage;
  clearCanvas(ctx, stage.palette[0]);
  const camera = mission.camera;
  const target = missionObjective(mission);
  ctx.save();
  ctx.translate(-Math.round(camera.x), -Math.round(camera.y));

  for (let row = 0; row < mission.map.length; row += 1) {
    for (let col = 0; col < mission.map[row].length; col += 1) {
      const tile = mission.map[row][col];
      const x = col * TILE;
      const y = row * TILE;
      if (tile === 1) drawWallTile(ctx, x, y, stage.palette, col + row);
      else drawFloorTile(ctx, x, y, stage, tile, time);
    }
  }

  for (const guard of mission.guards) drawVisionCone(ctx, guard, guard.detecting);
  for (const object of mission.objects) {
    if ((object.type === 'intel' || object.type === 'coin') && object.collected) continue;
    drawFieldObject(ctx, object, stage, time, mission.nearObject?.id === object.id);
  }
  drawObjectiveMarker(ctx, target, time);
  for (const guard of mission.guards) drawGuard(ctx, guard, time);

  const crew = getCrew(state.selectedCrew);
  if (mission.companion) {
    drawCharacter(ctx, crew, mission.companion.x, mission.companion.y, {
      direction: mission.companion.direction,
      frame: mission.companion.moving ? Math.floor(time / 150) % 2 : 0,
      alpha: 0.92,
    });
  }
  drawCharacter(ctx, crew, mission.player.x, mission.player.y, {
    direction: mission.player.direction,
    frame: mission.player.moving ? Math.floor(time / 105) % 2 : 0,
    highlight: true,
  });

  for (const particle of mission.particles) {
    rect(ctx, particle.x, particle.y, particle.size, particle.size, particle.color);
  }

  ctx.restore();
  drawObjectiveCompass(ctx, mission, target, time);

  // Field HUD inside canvas
  const top = 107;
  rect(ctx, 8, top, 138, 33, 'rgba(4,12,18,0.88)');
  rect(ctx, 10, top + 2, 134, 29, '#0b1d29');
  text(ctx, `ALERT ${Math.round(mission.alert)}%`, 17, top + 7, mission.alert > 70 ? COLORS.red : COLORS.gold, 7);
  rect(ctx, 17, top + 19, 116, 6, '#061018');
  rect(ctx, 18, top + 20, 114 * (mission.alert / 100), 4, mission.alert > 70 ? COLORS.red : COLORS.gold);

  rect(ctx, 238, top, 138, 33, 'rgba(4,12,18,0.88)');
  rect(ctx, 240, top + 2, 134, 29, '#0b1d29');
  text(ctx, `TIME ${Math.ceil(mission.timeLeft)}s`, 248, top + 7, mission.timeLeft < 15 ? COLORS.red : COLORS.cyan, 7);
  text(ctx, `PANEL ${mission.panelsDone}/${mission.panelsRequired}`, 248, top + 19, '#9db4b7', 6);

  if (mission.nearObject) {
    rect(ctx, 84, 589, 216, 24, 'rgba(4,12,18,0.88)');
    const labels = { panel: 'A 배전반 해킹', vault: 'A 금고 해체', intel: 'A 정보 회수', coin: 'A 현금 회수' };
    text(ctx, labels[mission.nearObject.type] ?? 'A 조사', 192, 596, COLORS.white, 7, 'center');
  }
}

export function drawTitleCrew(container) {
  container.innerHTML = '';
  for (const crew of CREW) {
    const canvas = createCharacterCanvas(crew.id);
    container.append(canvas);
  }
}

export function appendCharacterCanvas(container, crewId, options = {}) {
  container.innerHTML = '';
  container.append(createCharacterCanvas(crewId, options));
}

export function drawPanelCharacterCanvas(crewId, options = {}) {
  return createCharacterCanvas(crewId, options);
}
