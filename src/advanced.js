import { CREW, STAGES, getCrew, getStage } from './content.js';
import { TILE, createCharacterCanvas } from './pixel.js';
import { playSfx, unlockAudio } from './audio.js';
import {
  ADVANCED_SAVE_KEY,
  addStyle,
  bossProtocolFor,
  calculateAdvancedBonus,
  createAdvancedMeta,
  createMissionStyle,
  directiveFor,
  evaluateDirectiveChallenge,
  mapGamepad,
  nextBondEpisode,
  protocolCue,
  protocolEffect,
  styleRank,
} from './advanced-system.js';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const formatter = new Intl.NumberFormat('ko-KR');

function formatNumber(value) {
  return formatter.format(Math.max(0, Math.round(Number(value) || 0)));
}

function distance(a, b) {
  return Math.hypot((a?.x ?? 0) - (b?.x ?? 0), (a?.y ?? 0) - (b?.y ?? 0));
}

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

function visible(element) {
  if (!element || element.hidden) return false;
  return globalThis.getComputedStyle ? getComputedStyle(element).display !== 'none' : true;
}

function hideElement(element) {
  if (element) element.hidden = true;
}

function loadMeta() {
  try {
    return createAdvancedMeta(JSON.parse(localStorage.getItem(ADVANCED_SAVE_KEY) || 'null'));
  } catch {
    return createAdvancedMeta();
  }
}

function saveMeta(meta) {
  try {
    localStorage.setItem(ADVANCED_SAVE_KEY, JSON.stringify(meta));
  } catch {
    // The advanced layer remains playable when storage is unavailable.
  }
}

function findOpenCell(mission, preferredCol, preferredRow) {
  const candidates = [];
  for (let radius = 0; radius <= 8; radius += 1) {
    for (let dy = -radius; dy <= radius; dy += 1) {
      for (let dx = -radius; dx <= radius; dx += 1) {
        if (Math.abs(dx) !== radius && Math.abs(dy) !== radius) continue;
        candidates.push([preferredCol + dx, preferredRow + dy]);
      }
    }
  }
  const found = candidates.find(([col, row]) => (
    row > 1
    && col > 1
    && row < mission.rows - 1
    && col < mission.cols - 1
    && mission.map[row]?.[col] === 0
  ));
  const [col, row] = found ?? [preferredCol, preferredRow];
  return { x: col * TILE + TILE / 2, y: row * TILE + TILE / 2 };
}

function addHunter(mission) {
  const source = mission.guards.find((guard) => guard.type === 'guard') ?? mission.guards[0];
  if (!source || mission.guards.some((guard) => guard.id === 'directive-hunter')) return;
  const path = [...source.path].reverse().map((point) => ({ ...point }));
  mission.guards.push({
    ...source,
    id: 'directive-hunter',
    type: 'guard',
    x: path[0].x,
    y: path[0].y,
    path,
    target: 1,
    speed: source.speed * 1.18,
    range: source.range * 1.12,
    cone: Math.max(source.cone, 0.5),
    detecting: false,
    frozen: 0,
    elite: true,
  });
}

function addDirectivePickups(mission, count = 2) {
  const anchors = [[9, 39], [34, 10], [28, 29], [6, 18]];
  anchors.slice(0, count).forEach(([col, row], index) => {
    const position = findOpenCell(mission, col, row);
    mission.objects.push({
      id: `directive-pickup-${index}`,
      type: index % 2 === 0 ? 'coin' : 'intel',
      ...position,
      collected: false,
      directivePickup: true,
    });
  });
}

function missionMetrics(game) {
  const mission = game.mission;
  const vault = game.vault;
  const style = mission?.advanced?.style ?? createMissionStyle();
  return {
    alert: mission?.alert ?? 100,
    timeLeft: vault?.timeLeft ?? mission?.timeLeft ?? 0,
    maxCombo: vault?.maxCombo ?? 1,
    perfectHacks: mission?.perfectHacks ?? 0,
    panelsRequired: mission?.panelsRequired ?? 1,
    nearMisses: style.nearMisses,
    integrity: vault?.integrity ?? 0,
    dashed: style.dashed,
    pickups: style.pickups,
  };
}

function currentDirective(game) {
  return game.mission?.advanced?.directive
    ?? directiveFor(game.state.day, game.mission?.stage?.id ?? game.state.selectedStage, game.mission?.stage?.order ?? getStage(game.state.selectedStage).order);
}

function currentStyle(game) {
  return game.mission?.advanced?.style ?? createMissionStyle();
}

function updateStyle(game, type, count = 1) {
  if (!game.mission?.advanced) return;
  game.mission.advanced.style = addStyle(game.mission.advanced.style, type, count);
  updateAdvancedHud(game);
}

function injectStylesheet() {
  if ($('link[data-vaultbound-advanced]')) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = './styles/advanced.css';
  link.dataset.vaultboundAdvanced = 'true';
  document.head.append(link);
}

function injectUi() {
  const app = $('#app');
  if (!app || $('#advanced-field-hud')) return;

  const fieldHud = document.createElement('aside');
  fieldHud.id = 'advanced-field-hud';
  fieldHud.className = 'advanced-field-hud';
  fieldHud.hidden = true;
  fieldHud.innerHTML = `
    <div class="directive-chip"><span id="directive-code">STANDARD</span><b id="directive-name">표준 회수</b></div>
    <div class="directive-challenge"><span id="directive-challenge-label">추가 조건 없음</span><b id="directive-challenge-state">진행 중</b></div>
    <div class="style-chain"><span id="style-rank">C</span><div><small>NIGHT STYLE</small><strong id="style-label">CAREFUL</strong><i><b id="style-fill"></b></i></div><em id="style-score">0</em></div>
  `;
  app.append(fieldHud);

  const bossHud = document.createElement('aside');
  bossHud.id = 'boss-protocol-hud';
  bossHud.className = 'boss-protocol-hud';
  bossHud.hidden = true;
  bossHud.innerHTML = `
    <div class="boss-protocol-title"><span id="boss-protocol-code">PROTOCOL</span><strong id="boss-protocol-name">보스 프로토콜</strong></div>
    <p id="boss-protocol-instruction">전용 규칙을 확인하세요.</p>
    <div class="boss-protocol-meter"><i id="boss-protocol-fill"></i></div>
    <b id="boss-protocol-cue">STABLE</b>
  `;
  app.append(bossHud);

  const cutIn = document.createElement('div');
  cutIn.id = 'boss-cut-in';
  cutIn.className = 'boss-cut-in';
  cutIn.hidden = true;
  cutIn.innerHTML = `
    <div class="boss-cut-in-grid"></div>
    <span id="boss-cut-in-kicker">BOSS PROTOCOL</span>
    <strong id="boss-cut-in-name">보존 펄스</strong>
    <p id="boss-cut-in-instruction">전용 규칙</p>
  `;
  app.append(cutIn);

  const resultSummary = document.createElement('section');
  resultSummary.id = 'advanced-result-summary';
  resultSummary.className = 'advanced-result-summary';
  resultSummary.hidden = true;
  resultSummary.innerHTML = `
    <span id="result-directive-code">STANDARD</span>
    <div><small>야간 스타일</small><strong id="result-style-rank">C · CAREFUL</strong></div>
    <div><small>지령 도전</small><strong id="result-challenge-state">진행 중</strong></div>
    <b id="result-advanced-bonus">추가 보너스 ₩0</b>
  `;
  const resultCrewLine = $('#result-crew-line');
  resultCrewLine?.insertAdjacentElement('afterend', resultSummary);

  const episode = document.createElement('div');
  episode.id = 'bond-episode';
  episode.className = 'bond-episode';
  episode.hidden = true;
  episode.innerHTML = `
    <div class="bond-letterbox top"></div>
    <div class="bond-episode-stage">
      <div id="bond-episode-portrait" class="bond-episode-portrait"></div>
      <div class="bond-episode-copy">
        <span id="bond-episode-kicker">BOND EPISODE</span>
        <h2 id="bond-episode-title">관계 에피소드</h2>
        <small id="bond-episode-speaker">동료</small>
        <p id="bond-episode-line">대사</p>
        <div class="bond-episode-dots" id="bond-episode-dots"></div>
        <button id="bond-episode-next" class="pixel-button primary" type="button">다음</button>
      </div>
    </div>
    <div class="bond-letterbox bottom"></div>
  `;
  app.append(episode);

  const gamepadBadge = document.createElement('div');
  gamepadBadge.id = 'gamepad-badge';
  gamepadBadge.className = 'gamepad-badge';
  gamepadBadge.hidden = true;
  gamepadBadge.innerHTML = '<span>◉</span><b>GAMEPAD</b><small>연결됨</small>';
  app.append(gamepadBadge);
}

function updateAdvancedHud(game) {
  const hud = $('#advanced-field-hud');
  if (!hud || !game.mission?.advanced) return;
  const directive = currentDirective(game);
  const style = currentStyle(game);
  const rank = styleRank(style.score);
  const challenge = evaluateDirectiveChallenge(directive, missionMetrics(game));
  hud.hidden = !(game.scene === 'field' || visible($('#vault-overlay')));
  $('#directive-code').textContent = directive.code;
  $('#directive-code').style.color = directive.color;
  $('#directive-name').textContent = directive.label;
  $('#directive-challenge-label').textContent = challenge.label;
  $('#directive-challenge-state').textContent = directive.id === 'standard'
    ? '기본 계약'
    : `${challenge.met ? '달성 중' : '조건 확인'} · ${challenge.current}/${challenge.target}`;
  $('#directive-challenge-state').classList.toggle('met', challenge.met && directive.id !== 'standard');
  $('#style-rank').textContent = rank.id;
  $('#style-rank').style.color = rank.color;
  $('#style-label').textContent = rank.label;
  $('#style-score').textContent = formatNumber(style.score);
  const next = rank.id === 'S' ? rank.threshold : (['C', 'B', 'A'].includes(rank.id) ? ({ C: 110, B: 245, A: 420 }[rank.id]) : 420);
  $('#style-fill').style.width = `${rank.id === 'S' ? 100 : clamp((style.score / next) * 100, 0, 100)}%`;
}

function updateBossHud(game) {
  const hud = $('#boss-protocol-hud');
  const vault = game.vault;
  const advanced = vault?.advanced;
  if (!hud || !advanced?.protocol || vault.finished) {
    if (hud) hud.hidden = true;
    return;
  }
  const protocol = advanced.protocol;
  const cue = protocolCue(protocol, advanced.protocolElapsed);
  advanced.cue = cue;
  hud.hidden = false;
  hud.dataset.phase = cue.phase;
  hud.style.setProperty('--protocol-color', protocol.color);
  $('#boss-protocol-code').textContent = `${protocol.code} · LOCK ${vault.currentLock}/${vault.locks}`;
  $('#boss-protocol-name').textContent = protocol.name;
  $('#boss-protocol-instruction').textContent = protocol.instruction;
  $('#boss-protocol-fill').style.width = `${clamp(cue.progress * 100, 0, 100)}%`;
  $('#boss-protocol-cue').textContent = cue.label;

  const safe = $('#tension-safe');
  if (safe) {
    const hidden = protocol.type === 'memory' && cue.phase === 'hidden';
    safe.classList.toggle('protocol-hidden', hidden);
    if (hidden) safe.style.opacity = '0.03';
  }
}

function showBossCutIn(game, protocol) {
  const cutIn = $('#boss-cut-in');
  if (!cutIn || !protocol) return;
  $('#boss-cut-in-name').textContent = protocol.name;
  $('#boss-cut-in-instruction').textContent = protocol.instruction;
  $('#boss-cut-in-kicker').textContent = `${protocol.code} · PHASE ${game.vault?.currentLock ?? 1}`;
  cutIn.style.setProperty('--protocol-color', protocol.color);
  cutIn.hidden = false;
  cutIn.classList.remove('show');
  requestAnimationFrame(() => cutIn.classList.add('show'));
  playSfx('alert');
}

function hideBossCutIn() {
  const cutIn = $('#boss-cut-in');
  if (!cutIn) return;
  cutIn.hidden = true;
  cutIn.classList.remove('show');
}

function decorateContractPanel(game) {
  const panel = $('#panel-content');
  if (!panel) return;
  $$('.contract-card[data-stage-id]', panel).forEach((card) => {
    const stage = getStage(card.dataset.stageId);
    const directive = directiveFor(game.state.day, stage.id, stage.order);
    card.dataset.directive = directive.id;
    card.style.setProperty('--directive-color', directive.color);
    const old = $('.advanced-contract-directive', card);
    old?.remove();
    const strip = document.createElement('div');
    strip.className = 'advanced-contract-directive';
    strip.innerHTML = `<span>${directive.code}</span><b>${directive.label}</b><small>${directive.description}</small><em>보수 ×${directive.rewardMultiplier.toFixed(2)}</em>`;
    const meta = $('.contract-meta', card);
    meta?.insertAdjacentElement('beforebegin', strip);
    const metaSpans = $$('.contract-meta span', card);
    if (metaSpans[2]) metaSpans[2].textContent = `보수 ₩${formatNumber(stage.reward * directive.rewardMultiplier)}`;
  });
}

function awardNearMisses(game) {
  const mission = game.mission;
  if (!mission?.advanced || !mission.player?.moving) return;
  const now = performance.now();
  for (const guard of mission.guards) {
    if (guard.detecting || guard.frozen > 0 || guard.type === 'camera') continue;
    const separation = distance(guard, mission.player);
    if (separation < 22 || separation > 43) continue;
    const last = mission.advanced.nearMissAt[guard.id] ?? 0;
    if (now - last < 4200) continue;
    mission.advanced.nearMissAt[guard.id] = now;
    updateStyle(game, 'nearMiss');
    game.toast(`CLOSE CALL +${32} · ${styleRank(mission.advanced.style.score).label}`);
    playSfx('safe');
    break;
  }
}

function protocolSafe(vault) {
  const minimum = vault.safeCenter - vault.safeWidth / 2;
  const maximum = vault.safeCenter + vault.safeWidth / 2;
  return vault.pressure >= minimum && vault.pressure <= maximum;
}

function applyDirectiveVaultDeltas(vault, before, directive) {
  if (vault.currentLock !== before.lock || vault.finished) return;
  const heatGain = Math.max(0, vault.heat - before.heat);
  const noiseGain = Math.max(0, vault.noise - before.noise);
  const integrityLoss = Math.max(0, before.integrity - vault.integrity);
  vault.heat = before.heat + heatGain * directive.vault.heat + Math.min(0, vault.heat - before.heat);
  vault.noise = before.noise + noiseGain * directive.vault.noise + Math.min(0, vault.noise - before.noise);
  vault.integrity = before.integrity - integrityLoss * directive.vault.damage + Math.max(0, vault.integrity - before.integrity);
}

function applyBossProtocol(game, dt, before) {
  const vault = game.vault;
  const advanced = vault?.advanced;
  if (!advanced?.protocol || vault.finished || vault.currentLock !== before.lock) return;

  advanced.protocolElapsed += dt;
  const protocol = advanced.protocol;
  const cue = protocolCue(protocol, advanced.protocolElapsed);
  const safe = protocolSafe(vault);
  const effect = protocolEffect(protocol, cue, {
    holding: vault.holding,
    safe,
    pressure: vault.pressure,
    safeCenter: vault.safeCenter,
    dt,
    elapsed: advanced.protocolElapsed,
  });

  const progressGain = Math.max(0, vault.progress - before.progress);
  if (progressGain > 0) {
    vault.progress = before.progress + progressGain * effect.progressMultiplier + progressGain * effect.progressBonus;
  }
  vault.progress = Math.max(0, vault.progress - effect.progressLoss);

  const heatGain = Math.max(0, vault.heat - before.heat);
  const noiseGain = Math.max(0, vault.noise - before.noise);
  if (heatGain > 0 && effect.heatMultiplier !== 1) vault.heat += heatGain * (effect.heatMultiplier - 1);
  if (noiseGain > 0 && effect.noiseMultiplier !== 1) vault.noise += noiseGain * (effect.noiseMultiplier - 1);
  vault.integrity -= effect.integrityLoss;
  vault.heat += effect.heatGain;
  vault.noise += effect.noiseGain;
  vault.pressure += effect.pressureDelta;

  const cycleLength = protocol.interval ?? protocol.period ?? 1;
  const cycle = Math.floor(advanced.protocolElapsed / Math.max(0.1, cycleLength));
  if (effect.successWindow && advanced.successCycle !== cycle) {
    advanced.successCycle = cycle;
    advanced.protocolSuccesses += 1;
    updateStyle(game, 'protocolClear');
    if (protocol.type === 'release') game.toast('PROTOCOL CLEAR · 정확한 압력 해제');
  }
  if (effect.failureWindow && advanced.failureCycle !== cycle) {
    advanced.failureCycle = cycle;
    advanced.protocolFailures += 1;
    game.bumpShake(0.14);
    playSfx('strain');
  }

  vault.pressure = clamp(vault.pressure, 0, 100);
  vault.progress = clamp(vault.progress, 0, 100);
  vault.heat = clamp(vault.heat, 0, 100);
  vault.noise = clamp(vault.noise, 0, 100);
  vault.integrity = clamp(vault.integrity, 0, 100);

  if (vault.noise >= 100) {
    vault.noise = 54;
    vault.alarmStrikes += 1;
    vault.integrity = Math.max(0, vault.integrity - 9 - vault.stage.difficulty * 0.5);
    game.bumpShake(0.2);
    playSfx('alert');
  }
  if (vault.integrity <= 0 && !game.mission.finished) game.failCurrentMission('damaged');
  else if (vault.alarmStrikes >= 3 && !game.mission.finished) game.failCurrentMission('alarm');
  else if (vault.progress >= 100 && !vault.finished) game.completeVaultLock();
}

function showAdvancedResult(game) {
  const summary = $('#advanced-result-summary');
  if (!summary || !game.mission?.advanced) return;
  const directive = currentDirective(game);
  const style = currentStyle(game);
  const challenge = evaluateDirectiveChallenge(directive, missionMetrics(game));
  const bonus = calculateAdvancedBonus({
    baseReward: game.mission.stage.reward,
    styleScore: style.score,
    directive,
    challengeMet: challenge.met,
  });
  summary.hidden = false;
  summary.style.setProperty('--directive-color', directive.color);
  $('#result-directive-code').textContent = `${directive.code} ×${directive.rewardMultiplier.toFixed(2)}`;
  $('#result-style-rank').textContent = `${bonus.rank.id} · ${bonus.rank.label} · ${formatNumber(style.score)}점`;
  $('#result-style-rank').style.color = bonus.rank.color;
  $('#result-challenge-state').textContent = directive.id === 'standard'
    ? '기본 계약'
    : `${challenge.met ? '달성' : '미달'} · ${challenge.label}`;
  $('#result-challenge-state').classList.toggle('met', challenge.met && directive.id !== 'standard');
  $('#result-advanced-bonus').textContent = `선택 후 추가 보너스 ₩${formatNumber(bonus.totalCoins)}`;
}

function appendSettlementRow(label, value, className = '') {
  const rows = $('#settlement-rows');
  if (!rows) return;
  const row = document.createElement('div');
  row.className = `settlement-row advanced-settlement-row ${className}`.trim();
  row.innerHTML = `<span>${label}</span><b>${value}</b>`;
  rows.append(row);
}

function focusableButtons() {
  const roots = [
    $('#bond-episode'), $('#pause-overlay'), $('#settlement-overlay'), $('#result-overlay'),
    $('#loot-overlay'), $('#vault-overlay'), $('#hack-overlay'), $('#panel-overlay'), $('#dialogue-box'),
    $('#title-screen'),
  ].filter(visible);
  const root = roots[0];
  if (!root) return [];
  return $$('button:not([disabled])', root).filter((button) => visible(button));
}

class AdvancedDirector {
  constructor(game) {
    this.game = game;
    this.meta = loadMeta();
    this.episode = null;
    this.episodeIndex = 0;
    this.padPrevious = null;
    this.padActive = false;
    this.padFrame = null;
    this.keyboard = { up: false, down: false, left: false, right: false, dash: false };
    this.lastFocusedIndex = 0;
  }

  install() {
    injectStylesheet();
    injectUi();
    this.patchGame();
    this.bindUi();
    this.startGamepadLoop();
  }

  patchGame() {
    const game = this.game;

    const originalCreateMission = game.createMission.bind(game);
    game.createMission = (stage) => {
      const mission = originalCreateMission(stage);
      const directive = directiveFor(game.state.day, stage.id, stage.order);
      mission.advanced = {
        directive,
        style: createMissionStyle(),
        nearMissAt: {},
        blackoutActive: false,
      };
      mission.timeLeft *= directive.field.time;
      mission.guards.forEach((guard) => {
        guard.speed *= directive.field.guardSpeed;
        guard.range *= directive.field.guardRange;
      });
      if (directive.field.extraGuard > 0) addHunter(mission);
      if (directive.field.extraPickups > 0) addDirectivePickups(mission, directive.field.extraPickups);
      return mission;
    };

    const originalBeginField = game.beginField.bind(game);
    game.beginField = (stage, silent = false) => {
      originalBeginField(stage, silent);
      const directive = currentDirective(game);
      document.body.dataset.directive = directive.id;
      updateAdvancedHud(game);
      if (!silent && directive.id !== 'standard' && !this.meta.directiveTutorial) {
        this.meta.directiveTutorial = true;
        saveMeta(this.meta);
        game.say(game.state.selectedCrew, [
          `오늘 계약에는 야간 지령 “${directive.label}”이 붙었어.`,
          `${directive.challenge.label}. 성공하면 기본 보수 외에 지령 수당을 받을 수 있어.`,
        ]);
      } else if (!silent && directive.id !== 'standard') {
        game.toast(`${directive.code} · 보수 ×${directive.rewardMultiplier.toFixed(2)} · ${directive.challenge.label}`);
      }
    };

    const originalUpdateGuards = game.updateGuards.bind(game);
    game.updateGuards = (dt) => {
      const mission = game.mission;
      const beforeAlert = mission?.alert ?? 0;
      originalUpdateGuards(dt);
      if (!mission?.advanced || mission.finished) return;
      const delta = mission.alert - beforeAlert;
      if (delta > 0) mission.alert = clamp(beforeAlert + delta * mission.advanced.directive.field.alert, 0, 100);
    };

    const originalUpdateField = game.updateField.bind(game);
    game.updateField = (dt) => {
      const mission = game.mission;
      originalUpdateField(dt);
      if (!mission?.advanced || mission.finished) return;
      if (game.input.dash && mission.player.moving) mission.advanced.style.dashed = true;
      awardNearMisses(game);
      if (mission.panelsDone >= mission.panelsRequired && mission.alert <= 12 && !mission.advanced.style.ghostEntryAwarded) {
        updateStyle(game, 'ghostEntry');
        game.toast('GHOST ENTRY +125 · 무경보 금고실 진입');
      }
      const blackout = mission.advanced.directive.id === 'rolling-blackout'
        && Math.floor(game.totalTime / 2200) % 5 === 4;
      mission.advanced.blackoutActive = blackout;
      $('#app')?.classList.toggle('rolling-blackout-active', blackout);
      if (mission.alert >= 100 && !mission.finished) game.failCurrentMission('caught');
      updateAdvancedHud(game);
    };

    const originalInteractField = game.interactField.bind(game);
    game.interactField = () => {
      const object = game.mission?.nearObject;
      const wasCollected = object?.collected === true;
      originalInteractField();
      if (object && ['coin', 'intel'].includes(object.type) && !wasCollected && object.collected) {
        updateStyle(game, 'pickup');
      }
    };

    const originalResolveHack = game.resolveHack.bind(game);
    game.resolveHack = () => {
      const hack = game.hack;
      const perfect = Boolean(hack && Math.abs(hack.cursor - hack.center) <= (hack.width / 2) * 0.28);
      const unresolved = Boolean(hack && !hack.resolved);
      originalResolveHack();
      if (unresolved && perfect) {
        updateStyle(game, 'perfectHack');
        game.toast('PERFECT HACK +95 · 보안 흔적 삭제');
      }
    };

    const originalCreateVaultState = game.createVaultState.bind(game);
    game.createVaultState = (stage) => {
      const vault = originalCreateVaultState(stage);
      const directive = currentDirective(game);
      vault.baseWidth = clamp(vault.baseWidth * directive.vault.width, 7, 34);
      vault.safeWidth = vault.baseWidth;
      vault.timeLeft *= directive.vault.time;
      vault.nextEvent *= directive.vault.eventRate;
      const protocol = bossProtocolFor(stage.id, 1);
      vault.advanced = {
        directive,
        protocol,
        protocolElapsed: 0,
        protocolIntro: protocol ? 1.65 : 0,
        protocolSuccesses: 0,
        protocolFailures: 0,
        successCycle: -1,
        failureCycle: -1,
        lockStartIntegrity: 100,
      };
      return vault;
    };

    const originalBeginVault = game.beginVault.bind(game);
    game.beginVault = (silent = false) => {
      originalBeginVault(silent);
      if (game.mission?.alert <= 15 && !currentStyle(game).ghostEntryAwarded) updateStyle(game, 'ghostEntry');
      const protocol = game.vault?.advanced?.protocol;
      if (protocol) {
        showBossCutIn(game, protocol);
        if (!silent && !this.meta.bossTutorial) {
          this.meta.bossTutorial = true;
          saveMeta(this.meta);
          game.toast('보스 금고는 잠금축마다 전용 규칙이 바뀝니다. 중앙 프로토콜 HUD를 확인하세요.');
        }
      }
      updateAdvancedHud(game);
      updateBossHud(game);
    };

    const originalUpdateVault = game.updateVault.bind(game);
    game.updateVault = (dt) => {
      const vault = game.vault;
      if (!vault) return;
      if (vault.advanced?.protocolIntro > 0) {
        vault.advanced.protocolIntro = Math.max(0, vault.advanced.protocolIntro - dt);
        vault.holding = false;
        $('#vault-hold')?.classList.remove('pressed');
        game.renderVaultUi();
        updateAdvancedHud(game);
        updateBossHud(game);
        if (vault.advanced.protocolIntro <= 0) hideBossCutIn();
        return;
      }
      const before = {
        lock: vault.currentLock,
        heat: vault.heat,
        noise: vault.noise,
        integrity: vault.integrity,
        progress: vault.progress,
        event: vault.event,
        eventWarning: vault.eventWarning,
      };
      originalUpdateVault(dt);
      if (!game.vault || game.vault.finished || game.mission?.finished) return;
      applyDirectiveVaultDeltas(game.vault, before, game.vault.advanced.directive);
      if (before.event && !game.vault.event && !game.vault.eventWarning) {
        game.vault.nextEvent *= game.vault.advanced.directive.vault.eventRate;
      }
      applyBossProtocol(game, dt, before);
      game.renderVaultUi();
      updateAdvancedHud(game);
      updateBossHud(game);
    };

    const originalCompleteVaultLock = game.completeVaultLock.bind(game);
    game.completeVaultLock = () => {
      const vault = game.vault;
      if (!vault) return;
      const completedLock = vault.currentLock;
      const integrityLoss = Math.max(0, (vault.advanced?.lockStartIntegrity ?? vault.integrity) - vault.integrity);
      const wasBoss = Boolean(vault.advanced?.protocol);
      originalCompleteVaultLock();
      if (!game.vault?.advanced) return;
      if (integrityLoss <= 2.5) updateStyle(game, 'flawlessLock');
      if (wasBoss) updateStyle(game, 'protocolClear');
      if (!game.vault.finished && game.vault.currentLock !== completedLock) {
        const protocol = bossProtocolFor(game.vault.stage.id, game.vault.currentLock);
        game.vault.advanced.protocol = protocol;
        game.vault.advanced.protocolElapsed = 0;
        game.vault.advanced.protocolIntro = protocol ? 1.55 : 0;
        game.vault.advanced.successCycle = -1;
        game.vault.advanced.failureCycle = -1;
        game.vault.advanced.lockStartIntegrity = game.vault.integrity;
        game.vault.nextEvent *= game.vault.advanced.directive.vault.eventRate;
        if (protocol) showBossCutIn(game, protocol);
      }
    };

    const originalRenderVaultUi = game.renderVaultUi.bind(game);
    game.renderVaultUi = () => {
      originalRenderVaultUi();
      updateBossHud(game);
    };

    const originalShowResult = game.showResult.bind(game);
    game.showResult = (silent = false) => {
      const stage = game.mission?.stage;
      const directive = currentDirective(game);
      const baseReward = stage?.reward;
      if (stage && baseReward != null) stage.reward = Math.round(baseReward * directive.rewardMultiplier);
      try {
        originalShowResult(silent);
      } finally {
        if (stage && baseReward != null) stage.reward = baseReward;
      }
      showAdvancedResult(game);
      hideElement($('#advanced-field-hud'));
      hideElement($('#boss-protocol-hud'));
    };

    const originalResolveResultChoice = game.resolveResultChoice.bind(game);
    game.resolveResultChoice = (choice) => {
      const stage = game.mission?.stage;
      if (!stage) return originalResolveResultChoice(choice);
      const directive = currentDirective(game);
      const style = currentStyle(game);
      const metrics = missionMetrics(game);
      const challenge = evaluateDirectiveChallenge(directive, metrics);
      const bonus = calculateAdvancedBonus({
        baseReward: stage.reward,
        styleScore: style.score,
        directive,
        challengeMet: challenge.met,
      });
      const baseReward = stage.reward;
      stage.reward = Math.round(baseReward * directive.rewardMultiplier);
      try {
        originalResolveResultChoice(choice);
      } finally {
        stage.reward = baseReward;
      }

      if (bonus.totalCoins > 0) {
        game.state = {
          ...game.state,
          coins: game.state.coins + bonus.totalCoins,
          stats: {
            ...game.state.stats,
            totalEarned: game.state.stats.totalEarned + bonus.totalCoins,
          },
        };
        game.save();
      }
      this.meta.bestStyleScore = Math.max(this.meta.bestStyleScore, style.score);
      this.meta.directiveClears += directive.id === 'standard' ? 0 : 1;
      this.meta.directiveChallenges += directive.id !== 'standard' && challenge.met ? 1 : 0;
      this.meta.nearMisses += style.nearMisses;
      if (stage.boss) this.meta.bossClears[stage.id] = (this.meta.bossClears[stage.id] ?? 0) + 1;
      saveMeta(this.meta);

      appendSettlementRow(`야간 지령 · ${directive.label}`, `계약 보수 ×${directive.rewardMultiplier.toFixed(2)}`, 'directive-row');
      appendSettlementRow(`NIGHT STYLE · ${bonus.rank.id} ${bonus.rank.label}`, `₩ +${formatNumber(bonus.styleCoins)}`, 'style-row');
      if (directive.id !== 'standard') {
        appendSettlementRow(challenge.label, challenge.met ? `성공 · ₩ +${formatNumber(bonus.challengeCoins)}` : '미달성', challenge.met ? 'challenge-clear' : 'challenge-fail');
      }
      $('#advanced-result-summary').hidden = true;
    };

    const originalFailCurrentMission = game.failCurrentMission.bind(game);
    game.failCurrentMission = (reason) => {
      const mission = game.mission;
      const directive = mission?.advanced?.directive;
      const style = mission?.advanced?.style;
      originalFailCurrentMission(reason);
      if (style) {
        this.meta.bestStyleScore = Math.max(this.meta.bestStyleScore, style.score);
        this.meta.nearMisses += style.nearMisses;
        saveMeta(this.meta);
        appendSettlementRow(`NIGHT STYLE · ${styleRank(style.score).label}`, `${formatNumber(style.score)}점 · 보너스 소멸`, 'challenge-fail');
      }
      if (directive && directive.id !== 'standard') appendSettlementRow(`야간 지령 · ${directive.label}`, '실패', 'challenge-fail');
      hideElement($('#advanced-field-hud'));
      hideElement($('#boss-protocol-hud'));
      hideBossCutIn();
      $('#app')?.classList.remove('rolling-blackout-active');
    };

    const originalRenderContractsPanel = game.renderContractsPanel.bind(game);
    game.renderContractsPanel = () => {
      originalRenderContractsPanel();
      decorateContractPanel(game);
      const title = $('#panel-title');
      if (title) title.textContent = '야간 지령 계약 10선';
    };

    const originalEnterHub = game.enterHub.bind(game);
    game.enterHub = (showIntro = false) => {
      originalEnterHub(showIntro);
      hideElement($('#advanced-field-hud'));
      hideElement($('#boss-protocol-hud'));
      hideBossCutIn();
      $('#app')?.classList.remove('rolling-blackout-active');
      document.body.dataset.directive = '';
      window.setTimeout(() => this.tryBondEpisode(), 680);
    };

    const originalUpdate = game.update.bind(game);
    game.update = (dt) => {
      if (this.episode) {
        game.input.interactQueued = false;
        return;
      }
      originalUpdate(dt);
    };

    const originalOnKey = game.onKey.bind(game);
    game.onKey = (event, down) => {
      const map = {
        ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down',
        ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
        ShiftLeft: 'dash', ShiftRight: 'dash',
      };
      if (map[event.code]) this.keyboard[map[event.code]] = down;
      if (this.episode && down && !event.repeat && ['Space', 'Enter', 'KeyE'].includes(event.code)) {
        event.preventDefault();
        this.advanceEpisode();
        return;
      }
      originalOnKey(event, down);
    };
  }

  bindUi() {
    $('#bond-episode-next')?.addEventListener('click', () => this.advanceEpisode());
    window.addEventListener('gamepadconnected', (event) => {
      this.padActive = true;
      this.meta.gamepadSeen = true;
      saveMeta(this.meta);
      this.showGamepadBadge(event.gamepad.id);
      this.game.toast('게임패드 연결 · RT 금고 압력 / A 조사 / X 동료 / START 일시정지');
    });
    window.addEventListener('gamepaddisconnected', () => {
      this.padActive = false;
      $('#gamepad-badge').hidden = true;
      this.releasePadInput();
    });
    $('#reset-button')?.addEventListener('click', () => {
      window.setTimeout(() => {
        const clean = this.game.state.day === 1
          && this.game.state.stats.completed === 0
          && this.game.state.stats.failed === 0
          && Object.values(this.game.state.upgrades).every((level) => level === 0);
        if (!clean) return;
        this.meta = createAdvancedMeta();
        saveMeta(this.meta);
      }, 0);
    });
  }

  tryBondEpisode() {
    if (this.episode || this.game.scene !== 'hub' || this.game.dialogueActive || visible($('#panel-overlay'))) return;
    const crewId = this.game.state.selectedCrew;
    const episode = nextBondEpisode(this.meta, crewId, this.game.state.bonds[crewId] ?? 0);
    if (!episode) return;
    this.showEpisode(episode);
  }

  showEpisode(episode) {
    this.episode = episode;
    this.episodeIndex = 0;
    const crew = getCrew(episode.crewId);
    const portrait = $('#bond-episode-portrait');
    portrait.innerHTML = '';
    portrait.append(createCharacterCanvas(crew.id, { portrait: true, expression: 'happy' }));
    $('#bond-episode-kicker').textContent = `BOND EPISODE · LV.${episode.level}`;
    $('#bond-episode-title').textContent = episode.title;
    $('#bond-episode-speaker').textContent = `${crew.name} · ${crew.callsign}`;
    $('#bond-episode').style.setProperty('--episode-color', crew.color);
    $('#bond-episode').hidden = false;
    this.renderEpisodeLine();
    unlockAudio();
    playSfx('dialogue');
  }

  renderEpisodeLine() {
    if (!this.episode) return;
    $('#bond-episode-line').textContent = this.episode.lines[this.episodeIndex];
    $('#bond-episode-dots').innerHTML = this.episode.lines.map((_, index) => `<i class="${index <= this.episodeIndex ? 'active' : ''}"></i>`).join('');
    $('#bond-episode-next').textContent = this.episodeIndex >= this.episode.lines.length - 1 ? '에피소드 완료' : '다음';
  }

  advanceEpisode() {
    if (!this.episode) return;
    if (this.episodeIndex < this.episode.lines.length - 1) {
      this.episodeIndex += 1;
      this.renderEpisodeLine();
      playSfx('dialogue');
      return;
    }
    const episode = this.episode;
    this.meta.seenEpisodes.push(episode.key);
    this.meta.seenEpisodes = [...new Set(this.meta.seenEpisodes)];
    saveMeta(this.meta);
    this.game.state = {
      ...this.game.state,
      coins: this.game.state.coins + episode.reward.coins,
      intel: this.game.state.intel + episode.reward.intel,
      stats: {
        ...this.game.state.stats,
        totalEarned: this.game.state.stats.totalEarned + episode.reward.coins,
      },
    };
    this.game.save();
    $('#bond-episode').hidden = true;
    this.episode = null;
    this.game.toast(`관계 에피소드 완료 · ₩${formatNumber(episode.reward.coins)} · ◆${episode.reward.intel}`);
    playSfx('success');
    window.setTimeout(() => this.tryBondEpisode(), 850);
  }

  showGamepadBadge(id = '') {
    const badge = $('#gamepad-badge');
    if (!badge) return;
    badge.hidden = false;
    $('small', badge).textContent = id ? String(id).slice(0, 22) : '연결됨';
    badge.classList.add('show');
    window.setTimeout(() => badge.classList.remove('show'), 2300);
  }

  startGamepadLoop() {
    const loop = () => {
      this.pollGamepad();
      this.padFrame = requestAnimationFrame(loop);
    };
    this.padFrame = requestAnimationFrame(loop);
  }

  pollGamepad() {
    const pads = navigator.getGamepads?.() ?? [];
    const pad = [...pads].find(Boolean);
    if (!pad) {
      if (this.padActive) {
        this.padActive = false;
        this.padPrevious = null;
        this.releasePadInput();
        const badge = $('#gamepad-badge');
        if (badge) badge.hidden = true;
      }
      return;
    }
    if (!this.padActive) {
      this.padActive = true;
      this.showGamepadBadge(pad.id);
    }
    const mapped = mapGamepad(pad);
    const previous = this.padPrevious ?? Object.fromEntries(Object.keys(mapped).map((key) => [key, false]));
    const pressed = (key) => mapped[key] && !previous[key];
    const menuButtons = focusableButtons();
    const inMenu = menuButtons.length > 0 && !visible($('#vault-overlay'));

    if (this.episode) {
      if (pressed('interact')) this.advanceEpisode();
      this.padPrevious = mapped;
      return;
    }

    if (pressed('pause')) {
      if (visible($('#pause-overlay'))) this.game.closePause();
      else this.game.openPause();
    }

    if (inMenu) {
      const move = pressed('down') || pressed('right') || pressed('menuNext')
        ? 1
        : pressed('up') || pressed('left') || pressed('menuPrev')
          ? -1
          : 0;
      if (move !== 0) {
        const active = document.activeElement;
        const current = Math.max(0, menuButtons.indexOf(active));
        this.lastFocusedIndex = (current + move + menuButtons.length) % menuButtons.length;
        menuButtons[this.lastFocusedIndex].focus({ preventScroll: false });
        playSfx('interact');
      }
      if (pressed('interact')) {
        const target = menuButtons.includes(document.activeElement) ? document.activeElement : menuButtons[0];
        target?.click();
      }
      this.releasePadInput();
    } else {
      this.game.input.left = this.keyboard.left || mapped.left;
      this.game.input.right = this.keyboard.right || mapped.right;
      this.game.input.up = this.keyboard.up || mapped.up;
      this.game.input.down = this.keyboard.down || mapped.down;
      this.game.input.dash = this.keyboard.dash || mapped.dash;

      if (visible($('#hack-overlay')) && pressed('interact')) this.game.resolveHack();
      else if (visible($('#dialogue-box')) && pressed('interact')) this.game.advanceDialogue();
      else if (pressed('interact') && !visible($('#vault-overlay'))) this.game.queueInteract();
      if (pressed('skill')) {
        if (visible($('#vault-overlay'))) this.game.useCrewSkill();
        else if (this.game.scene === 'field') this.game.useFieldCrewSkill();
      }
    }

    if (visible($('#vault-overlay')) && this.game.vault && !this.game.vault.finished) {
      this.game.vault.holding = mapped.vaultHold;
      $('#vault-hold')?.classList.toggle('pressed', mapped.vaultHold);
    }
    this.padPrevious = mapped;
  }

  releasePadInput() {
    const game = this.game;
    game.input.left = this.keyboard.left;
    game.input.right = this.keyboard.right;
    game.input.up = this.keyboard.up;
    game.input.down = this.keyboard.down;
    game.input.dash = this.keyboard.dash;
    if (game.vault) game.vault.holding = false;
    $('#vault-hold')?.classList.remove('pressed');
  }
}

export function installAdvancedSystems(game) {
  if (!game || game.__advancedInstalled) return game?.advancedDirector ?? null;
  const director = new AdvancedDirector(game);
  game.__advancedInstalled = true;
  game.advancedDirector = director;
  director.install();
  return director;
}
