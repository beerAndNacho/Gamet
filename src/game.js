import {
  CASES,
  CREW,
  ITEMS,
  RARITIES,
  STAGES,
  UPGRADES,
  getCase,
  getCrew,
  getItem,
  getStage,
} from './content.js';
import {
  bondProgress,
  caseProgress,
  choicePreview,
  clamp,
  clearState,
  collectionProgress,
  crewBonuses,
  createInitialState,
  failMission,
  getUpgradeCost,
  gradeMission,
  loadState,
  purchaseUpgrade,
  rollLootBoxes,
  saveState,
  selectCrew,
  selectStage,
  settleMission,
  shiftIdForDay,
  stageAvailability,
  startMission,
} from './state.js';
import {
  TILE,
  VIEW_HEIGHT,
  VIEW_WIDTH,
  appendCharacterCanvas,
  createCharacterCanvas,
  drawField,
  drawHub,
  drawPanelCharacterCanvas,
  drawTitleCrew,
} from './pixel.js';
import { playSfx, setAudioEnabled, setMusicScene, unlockAudio } from './audio.js';
import { buildMissionLayout } from './mission-layouts.js';
import { getVaultTuning } from './vault-balance.js';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const formatter = new Intl.NumberFormat('ko-KR');

const ELEMENTS = {
  app: $('#app'),
  canvas: $('#game-canvas'),
  titleScreen: $('#title-screen'),
  titleCrew: $('#title-crew'),
  startButton: $('#start-button'),
  continueButton: $('#continue-button'),
  topHud: $('#top-hud'),
  hudScene: $('#hud-scene'),
  hudDay: $('#hud-day'),
  hudCoins: $('#hud-coins'),
  hudReputation: $('#hud-reputation'),
  hudIntel: $('#hud-intel'),
  pauseButton: $('#pause-button'),
  objectiveHud: $('#objective-hud'),
  objectiveIcon: $('#objective-icon'),
  objectiveText: $('#objective-text'),
  dialogueBox: $('#dialogue-box'),
  dialoguePortrait: $('#dialogue-portrait'),
  dialogueName: $('#dialogue-name'),
  dialogueText: $('#dialogue-text'),
  dialogueNext: $('#dialogue-next'),
  panelOverlay: $('#panel-overlay'),
  panelKicker: $('#panel-kicker'),
  panelTitle: $('#panel-title'),
  panelClose: $('#panel-close'),
  panelTabs: $('#panel-tabs'),
  panelContent: $('#panel-content'),
  hackOverlay: $('#hack-overlay'),
  hackZone: $('#hack-zone'),
  hackCursor: $('#hack-cursor'),
  hackMessage: $('#hack-message'),
  hackAction: $('#hack-action'),
  vaultOverlay: $('#vault-overlay'),
  vaultStageLabel: $('#vault-stage-label'),
  vaultTitle: $('#vault-title'),
  vaultTimer: $('#vault-timer'),
  pixelVault: $('#pixel-vault'),
  vaultCombo: $('#vault-combo'),
  vaultProgress: $('#vault-progress'),
  vaultStatus: $('#vault-status'),
  tensionTrack: $('#tension-track'),
  tensionSafe: $('#tension-safe'),
  tensionFill: $('#tension-fill'),
  tensionNeedle: $('#tension-needle'),
  vaultIntegrity: $('#vault-integrity'),
  vaultHeat: $('#vault-heat'),
  vaultNoise: $('#vault-noise'),
  integrityFill: $('#integrity-fill'),
  heatFill: $('#heat-fill'),
  noiseFill: $('#noise-fill'),
  vaultEvent: $('#vault-event'),
  vaultEventIcon: $('#vault-event-icon'),
  vaultEventText: $('#vault-event-text'),
  crewSkill: $('#crew-skill'),
  crewSkillIcon: $('#crew-skill-icon'),
  crewSkillName: $('#crew-skill-name'),
  crewSkillCooldown: $('#crew-skill-cooldown'),
  vaultHold: $('#vault-hold'),
  lootOverlay: $('#loot-overlay'),
  lootHint: $('#loot-hint'),
  lootBoxes: $('#loot-boxes'),
  resultOverlay: $('#result-overlay'),
  resultGrade: $('#result-grade'),
  resultItemIcon: $('#result-item-icon'),
  resultRarity: $('#result-rarity'),
  resultItemName: $('#result-item-name'),
  resultItemStory: $('#result-item-story'),
  resultValue: $('#result-value'),
  resultCondition: $('#result-condition'),
  resultCombo: $('#result-combo'),
  resultCrewLine: $('#result-crew-line'),
  returnPreview: $('#return-preview'),
  archivePreview: $('#archive-preview'),
  auctionPreview: $('#auction-preview'),
  settlementOverlay: $('#settlement-overlay'),
  settlementTitle: $('#settlement-title'),
  settlementRows: $('#settlement-rows'),
  unlockNotice: $('#unlock-notice'),
  settlementContinue: $('#settlement-continue'),
  pauseOverlay: $('#pause-overlay'),
  resumeButton: $('#resume-button'),
  soundButton: $('#sound-button'),
  motionButton: $('#motion-button'),
  resetButton: $('#reset-button'),
  toast: $('#toast'),
  mobileControls: $('#mobile-controls'),
  fieldSkillButton: $('#field-skill-button'),
  dashButton: $('#dash-button'),
  interactButton: $('#interact-button'),
};

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

const HUB_NPCS = [
  { id: 'seojin', x: 116, y: 340, direction: 'right' },
  { id: 'harin', x: 57, y: 326, direction: 'down' },
  { id: 'minhyuk', x: 326, y: 304, direction: 'left' },
  { id: 'juno', x: 296, y: 214, direction: 'down' },
  { id: 'jaewook', x: 229, y: 383, direction: 'left' },
  { id: 'nabi', x: 257, y: 300, direction: 'left' },
];

const HUB_INTERACTABLES = [
  { id: 'board', x: 54, y: 169, radius: 35 },
  { id: 'workbench', x: 319, y: 174, radius: 38 },
  { id: 'archive', x: 51, y: 454, radius: 34 },
  { id: 'door', x: 192, y: 611, radius: 36 },
  ...HUB_NPCS.map((npc) => ({ id: `crew:${npc.id}`, x: npc.x, y: npc.y, radius: npc.id === 'nabi' ? 31 : 28 })),
];

const GRADE_LABELS = { S: '완벽 복구', A: '정밀 복구', B: '안정 복구', C: '위험 복구', D: '간신히 복구' };

function number(value) {
  return formatter.format(Math.max(0, Math.round(value)));
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function pointInRect(x, y, rect, padding = 0) {
  return x >= rect.x - padding && x <= rect.x + rect.w + padding && y >= rect.y - padding && y <= rect.y + rect.h + padding;
}

function directionFromVector(x, y, fallback = 'down') {
  if (Math.abs(x) > Math.abs(y)) return x < 0 ? 'left' : 'right';
  if (Math.abs(y) > 0.01) return y < 0 ? 'up' : 'down';
  return fallback;
}

function formatTimer(seconds) {
  const safe = Math.max(0, Math.ceil(seconds));
  return `${String(Math.floor(safe / 60)).padStart(2, '0')}:${String(safe % 60).padStart(2, '0')}`;
}

function hide(element) {
  if (element) element.hidden = true;
}

function show(element) {
  if (element) element.hidden = false;
}

export class VaultboundGame {
  constructor() {
    this.canvas = ELEMENTS.canvas;
    this.ctx = this.canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;
    this.state = loadState();
    this.scene = 'title';
    this.running = false;
    this.lastTime = performance.now();
    this.totalTime = 0;
    this.input = {
      up: false,
      down: false,
      left: false,
      right: false,
      dash: false,
      interactQueued: false,
    };
    this.hub = this.createHubWorld();
    this.mission = null;
    this.hack = null;
    this.vault = null;
    this.lootRoll = null;
    this.selectedLoot = null;
    this.dialogueQueue = [];
    this.dialogueActive = false;
    this.panelMode = null;
    this.panelTab = null;
    this.toastTimer = null;
    this.lastFootstep = 0;
    this.shakeTime = 0;
    this.demoMode = new URLSearchParams(location.search).get('demo');

    drawTitleCrew(ELEMENTS.titleCrew);
    this.bindEvents();
    this.syncSettings();
    this.updateContinueButton();
    this.handleDemoMode();
  }

  createHubWorld() {
    return {
      player: { x: 192, y: 520, direction: 'up', moving: false },
      npcs: HUB_NPCS.map((npc) => ({ ...npc })),
      nearInteractable: null,
    };
  }

  handleDemoMode() {
    if (!this.demoMode) return;
    this.state = {
      ...this.state,
      coins: Math.max(this.state.coins, 2400),
      reputation: Math.max(this.state.reputation, 32),
      intel: Math.max(this.state.intel, 12),
      upgrades: { boots: 2, jammer: 2, drill: 2, coolant: 2, muffler: 1, scanner: 2 },
    };
    hide(ELEMENTS.titleScreen);
    this.startLoop();
    if (this.demoMode === 'field') {
      const result = startMission(this.state, 'midnight-casino');
      this.state = result.state;
      this.beginField(result.stage, true);
    } else if (this.demoMode === 'vault') {
      const result = startMission(this.state, 'museum-vault');
      this.state = result.state;
      this.mission = this.createMission(result.stage);
      this.mission.panelsDone = this.mission.panelsRequired;
      this.beginVault(true);
    } else if (this.demoMode === 'result') {
      const result = startMission(this.state, 'museum-vault');
      this.state = result.state;
      this.mission = this.createMission(result.stage);
      this.mission.alert = 14;
      this.mission.perfectHacks = 3;
      this.vault = this.createVaultState(result.stage);
      this.vault.integrity = 96;
      this.vault.maxCombo = 5;
      this.vault.timeLeft = 24;
      this.lootRoll = rollLootBoxes(this.state, result.stage, this.combinedMissionSummary(), 'demo-result');
      this.selectLootBox(this.lootRoll.bestIndex, true);
    } else {
      this.enterHub(false);
    }
  }

  updateContinueButton() {
    const hasProgress = this.state.stats.completed > 0 || this.state.stats.failed > 0 || Object.values(this.state.upgrades).some((level) => level > 0);
    ELEMENTS.continueButton.hidden = !hasProgress;
  }

  bindEvents() {
    ELEMENTS.startButton.addEventListener('click', () => {
      unlockAudio();
      playSfx('interact');
      hide(ELEMENTS.titleScreen);
      this.enterHub(true);
      this.startLoop();
    });

    ELEMENTS.continueButton.addEventListener('click', () => {
      unlockAudio();
      playSfx('interact');
      hide(ELEMENTS.titleScreen);
      this.enterHub(false);
      this.startLoop();
    });

    ELEMENTS.pauseButton.addEventListener('click', () => this.openPause());
    ELEMENTS.resumeButton.addEventListener('click', () => this.closePause());
    ELEMENTS.panelClose.addEventListener('click', () => this.closePanel());
    ELEMENTS.dialogueNext.addEventListener('click', () => this.advanceDialogue());
    ELEMENTS.interactButton.addEventListener('click', () => this.queueInteract());
    ELEMENTS.fieldSkillButton.addEventListener('click', () => this.useFieldCrewSkill());

    ELEMENTS.hackAction.addEventListener('click', () => this.resolveHack());
    ELEMENTS.crewSkill.addEventListener('click', () => this.useCrewSkill());

    const vaultPress = (event) => {
      event.preventDefault();
      if (!this.vault || this.vault.finished) return;
      this.vault.holding = true;
      ELEMENTS.vaultHold.classList.add('pressed');
      unlockAudio();
    };
    const vaultRelease = (event) => {
      event?.preventDefault?.();
      if (this.vault) this.vault.holding = false;
      ELEMENTS.vaultHold.classList.remove('pressed');
    };
    ELEMENTS.vaultHold.addEventListener('pointerdown', vaultPress);
    ELEMENTS.vaultHold.addEventListener('pointerup', vaultRelease);
    ELEMENTS.vaultHold.addEventListener('pointercancel', vaultRelease);
    window.addEventListener('pointerup', vaultRelease);

    ELEMENTS.lootBoxes.addEventListener('click', (event) => {
      const button = event.target.closest('[data-loot-box]');
      if (!button) return;
      this.selectLootBox(Number(button.dataset.lootBox));
    });

    ELEMENTS.resultOverlay.addEventListener('click', (event) => {
      const button = event.target.closest('[data-result-choice]');
      if (!button) return;
      this.resolveResultChoice(button.dataset.resultChoice);
    });

    ELEMENTS.settlementContinue.addEventListener('click', () => {
      hide(ELEMENTS.settlementOverlay);
      this.enterHub(false);
    });

    ELEMENTS.soundButton.addEventListener('click', () => {
      this.state = { ...this.state, settings: { ...this.state.settings, sound: !this.state.settings.sound } };
      saveState(this.state);
      this.syncSettings();
      if (this.state.settings.sound) unlockAudio();
    });

    ELEMENTS.motionButton.addEventListener('click', () => {
      this.state = { ...this.state, settings: { ...this.state.settings, shake: !this.state.settings.shake } };
      saveState(this.state);
      this.syncSettings();
    });

    ELEMENTS.resetButton.addEventListener('click', () => {
      if (!confirm('코인, 동료 관계, 장비, 사건과 수집 기록을 모두 초기화할까요?')) return;
      clearState();
      this.state = createInitialState();
      saveState(this.state);
      this.hub = this.createHubWorld();
      this.closePause();
      this.toast('새로운 야간 근무 기록을 시작합니다.');
      this.enterHub(true);
    });

    document.addEventListener('keydown', (event) => this.onKey(event, true));
    document.addEventListener('keyup', (event) => this.onKey(event, false));
    window.addEventListener('blur', () => this.clearInput());

    for (const button of $$('[data-move]')) {
      const move = button.dataset.move;
      const press = (event) => {
        event.preventDefault();
        this.input[move] = true;
        button.classList.add('pressed');
        unlockAudio();
      };
      const release = (event) => {
        event?.preventDefault?.();
        this.input[move] = false;
        button.classList.remove('pressed');
      };
      button.addEventListener('pointerdown', press);
      button.addEventListener('pointerup', release);
      button.addEventListener('pointercancel', release);
      button.addEventListener('pointerleave', release);
    }

    const dashPress = (event) => {
      event.preventDefault();
      this.input.dash = true;
      ELEMENTS.dashButton.classList.add('pressed');
    };
    const dashRelease = (event) => {
      event?.preventDefault?.();
      this.input.dash = false;
      ELEMENTS.dashButton.classList.remove('pressed');
    };
    ELEMENTS.dashButton.addEventListener('pointerdown', dashPress);
    ELEMENTS.dashButton.addEventListener('pointerup', dashRelease);
    ELEMENTS.dashButton.addEventListener('pointercancel', dashRelease);

    ELEMENTS.panelContent.addEventListener('click', (event) => this.handlePanelClick(event));
    ELEMENTS.panelTabs.addEventListener('click', (event) => {
      const tab = event.target.closest('[data-panel-tab]');
      if (!tab) return;
      this.panelTab = tab.dataset.panelTab;
      playSfx('interact');
      this.renderPanel();
    });
  }

  onKey(event, down) {
    if (!down && event.code === 'Space' && !ELEMENTS.vaultOverlay.hidden) {
      event.preventDefault();
      if (this.vault) this.vault.holding = false;
      ELEMENTS.vaultHold.classList.remove('pressed');
      return;
    }
    const tag = event.target?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    const map = {
      ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down',
      ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
      ShiftLeft: 'dash', ShiftRight: 'dash',
    };
    if (map[event.code]) {
      event.preventDefault();
      this.input[map[event.code]] = down;
      if (down) unlockAudio();
      return;
    }
    if (!down || event.repeat) return;
    if (event.code === 'KeyE' || event.code === 'Space' || event.code === 'Enter') {
      event.preventDefault();
      if (!ELEMENTS.vaultOverlay.hidden && event.code === 'Space') {
        this.vault.holding = true;
        ELEMENTS.vaultHold.classList.add('pressed');
        return;
      }
      if (!ELEMENTS.hackOverlay.hidden) {
        this.resolveHack();
        return;
      }
      if (!ELEMENTS.dialogueBox.hidden) {
        this.advanceDialogue();
        return;
      }
      this.queueInteract();
    }
    if (event.code === 'KeyF') {
      event.preventDefault();
      if (!ELEMENTS.vaultOverlay.hidden) this.useCrewSkill();
      else if (this.scene === 'field') this.useFieldCrewSkill();
    }
    if (event.code === 'Escape') {
      event.preventDefault();
      if (!ELEMENTS.panelOverlay.hidden) this.closePanel();
      else if (!ELEMENTS.pauseOverlay.hidden) this.closePause();
      else this.openPause();
    }
  }

  clearInput() {
    this.input.up = false;
    this.input.down = false;
    this.input.left = false;
    this.input.right = false;
    this.input.dash = false;
    if (this.vault) this.vault.holding = false;
    ELEMENTS.vaultHold.classList.remove('pressed');
    $$('[data-move], #dash-button').forEach((button) => button.classList.remove('pressed'));
  }

  queueInteract() {
    unlockAudio();
    this.input.interactQueued = true;
  }

  startLoop() {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    requestAnimationFrame((time) => this.loop(time));
  }

  loop(time) {
    if (!this.running) return;
    const dt = clamp((time - this.lastTime) / 1000, 0, 0.05);
    this.lastTime = time;
    this.totalTime += dt * 1000;
    this.update(dt);
    this.render();
    requestAnimationFrame((nextTime) => this.loop(nextTime));
  }

  update(dt) {
    if (!ELEMENTS.pauseOverlay.hidden || this.dialogueActive || !ELEMENTS.panelOverlay.hidden || !ELEMENTS.resultOverlay.hidden || !ELEMENTS.settlementOverlay.hidden || !ELEMENTS.lootOverlay.hidden) {
      this.input.interactQueued = false;
      return;
    }
    if (!ELEMENTS.hackOverlay.hidden) {
      this.updateHack(dt);
      return;
    }
    if (!ELEMENTS.vaultOverlay.hidden) {
      this.updateVault(dt);
      return;
    }
    if (this.scene === 'hub') this.updateHub(dt);
    if (this.scene === 'field') this.updateField(dt);
  }

  render() {
    if (this.shakeTime > 0) {
      this.shakeTime -= 0.016;
      ELEMENTS.app.classList.add('screen-shake');
    } else {
      ELEMENTS.app.classList.remove('screen-shake');
    }
    if (this.scene === 'hub') drawHub(this.ctx, this.hub, this.state, this.totalTime);
    if (this.scene === 'field' && this.mission) drawField(this.ctx, this.mission, this.state, this.totalTime);
  }

  syncSettings() {
    setAudioEnabled(this.state.settings.sound);
    ELEMENTS.soundButton.textContent = `사운드: ${this.state.settings.sound ? 'ON' : 'OFF'}`;
    ELEMENTS.motionButton.textContent = `화면 흔들림: ${this.state.settings.shake ? 'ON' : 'OFF'}`;
  }

  save() {
    saveState(this.state);
    this.syncHud();
  }

  syncHud() {
    ELEMENTS.hudDay.textContent = `DAY ${String(this.state.day).padStart(2, '0')} · SHIFT ${String(shiftIdForDay(this.state.day)).padStart(2, '0')}`;
    ELEMENTS.hudCoins.textContent = number(this.state.coins);
    ELEMENTS.hudReputation.textContent = number(this.state.reputation);
    ELEMENTS.hudIntel.textContent = number(this.state.intel);
  }

  setObjective(text, icon = '!') {
    ELEMENTS.objectiveText.textContent = text;
    ELEMENTS.objectiveIcon.textContent = icon;
  }

  enterHub(showIntro = false) {
    this.scene = 'hub';
    this.hub = this.createHubWorld();
    this.mission = null;
    this.hack = null;
    this.vault = null;
    this.lootRoll = null;
    this.selectedLoot = null;
    hide(ELEMENTS.panelOverlay);
    hide(ELEMENTS.hackOverlay);
    hide(ELEMENTS.vaultOverlay);
    hide(ELEMENTS.lootOverlay);
    hide(ELEMENTS.resultOverlay);
    hide(ELEMENTS.settlementOverlay);
    hide(ELEMENTS.pauseOverlay);
    show(ELEMENTS.topHud);
    show(ELEMENTS.objectiveHud);
    show(ELEMENTS.mobileControls);
    ELEMENTS.fieldSkillButton.hidden = true;
    ELEMENTS.hudScene.textContent = '야간 복구 작업실';
    this.syncHud();
    setMusicScene('hub');
    this.setObjective('계약 게시판에서 오늘의 현장을 선택하세요', '▦');
    if (showIntro || !this.state.tutorial.hub) {
      this.state = { ...this.state, tutorial: { ...this.state.tutorial, hub: true } };
      this.save();
      const crew = getCrew(this.state.selectedCrew);
      this.say(crew.id, [
        `${crew.name}: 야간 근무 시작. 게시판에서 계약을 고르고, 장비와 동료를 준비해.`,
        '작업실에서는 직접 걸어 다닐 수 있어. 빛나는 물체 근처에서 조사 버튼을 누르면 돼.',
      ]);
    }
  }

  updateHub(dt) {
    const player = this.hub.player;
    let dx = (this.input.right ? 1 : 0) - (this.input.left ? 1 : 0);
    let dy = (this.input.down ? 1 : 0) - (this.input.up ? 1 : 0);
    const moving = dx !== 0 || dy !== 0;
    if (moving) {
      const length = Math.hypot(dx, dy) || 1;
      dx /= length;
      dy /= length;
      const speed = (this.input.dash ? 104 : 72) * dt;
      const nextX = clamp(player.x + dx * speed, 13, VIEW_WIDTH - 13);
      const nextY = clamp(player.y + dy * speed, 112, VIEW_HEIGHT - 25);
      if (!this.hubCollision(nextX, player.y)) player.x = nextX;
      if (!this.hubCollision(player.x, nextY)) player.y = nextY;
      player.direction = directionFromVector(dx, dy, player.direction);
      if (this.totalTime - this.lastFootstep > (this.input.dash ? 165 : 240)) {
        playSfx('move');
        this.lastFootstep = this.totalTime;
      }
    }
    player.moving = moving;
    this.hub.nearInteractable = this.findNearest(HUB_INTERACTABLES, player, 42);
    if (this.input.interactQueued) {
      this.input.interactQueued = false;
      this.interactHub();
    }
  }

  hubCollision(x, y) {
    return HUB_COLLIDERS.some((rect) => pointInRect(x, y, rect, 5));
  }

  findNearest(objects, point, maximum) {
    let nearest = null;
    let nearestDistance = maximum;
    for (const object of objects) {
      const current = distance(object, point);
      if (current <= Math.min(maximum, object.radius ?? maximum) && current < nearestDistance) {
        nearest = object;
        nearestDistance = current;
      }
    }
    return nearest;
  }

  interactHub() {
    const target = this.hub.nearInteractable;
    if (!target) {
      this.toast('가까이 다가가 조사해 보세요.');
      return;
    }
    playSfx('interact');
    if (target.id === 'board') this.openPanel('contracts');
    else if (target.id === 'workbench') this.openPanel('upgrades');
    else if (target.id === 'archive') this.openPanel('archive', 'cases');
    else if (target.id === 'door') this.deploySelectedStage();
    else if (target.id.startsWith('crew:')) {
      const crewId = target.id.split(':')[1];
      const crew = getCrew(crewId);
      const selected = crewId === this.state.selectedCrew;
      const lines = [crew.lines.hub[(this.state.day + crewId.length) % crew.lines.hub.length]];
      if (!selected) lines.push(`${crew.name}: 같이 갈래? 팀 패널에서 나를 선택하면 돼.`);
      else lines.push(`${crew.name}: 오늘도 내가 옆에서 보조할게.`);
      this.say(crew.id, lines, () => {
        if (!selected) this.openPanel('archive', 'crew');
      });
    }
  }

  say(crewId, lines, onDone = null) {
    this.dialogueQueue = lines.map((line) => ({ crewId, text: line.replace(`${getCrew(crewId).name}: `, '') }));
    this.dialogueOnDone = onDone;
    this.dialogueActive = true;
    this.showNextDialogue();
  }

  showNextDialogue() {
    const line = this.dialogueQueue.shift();
    if (!line) {
      hide(ELEMENTS.dialogueBox);
      this.dialogueActive = false;
      const done = this.dialogueOnDone;
      this.dialogueOnDone = null;
      done?.();
      return;
    }
    const crew = getCrew(line.crewId);
    ELEMENTS.dialogueName.textContent = `${crew.name} · ${crew.role}`;
    ELEMENTS.dialogueText.textContent = line.text;
    appendCharacterCanvas(ELEMENTS.dialoguePortrait, crew.id, { portrait: true });
    show(ELEMENTS.dialogueBox);
    playSfx('dialogue');
  }

  advanceDialogue() {
    this.showNextDialogue();
  }

  openPanel(mode, tab = null) {
    this.panelMode = mode;
    this.panelTab = tab;
    show(ELEMENTS.panelOverlay);
    hide(ELEMENTS.mobileControls);
    this.renderPanel();
  }

  closePanel() {
    hide(ELEMENTS.panelOverlay);
    show(ELEMENTS.mobileControls);
    this.panelMode = null;
    this.panelTab = null;
    playSfx('interact');
  }

  renderPanel() {
    if (this.panelMode === 'contracts') this.renderContractsPanel();
    else if (this.panelMode === 'upgrades') this.renderUpgradesPanel();
    else this.renderArchivePanel();
  }

  renderContractsPanel() {
    ELEMENTS.panelKicker.textContent = 'RECOVERY CONTRACT BOARD';
    ELEMENTS.panelTitle.textContent = '야간 복구 의뢰 10선';
    hide(ELEMENTS.panelTabs);
    const selected = getStage(this.state.selectedStage);
    ELEMENTS.panelContent.innerHTML = `
      <div class="contract-list">
        ${STAGES.map((stage) => {
          const available = stageAvailability(this.state, stage);
          const active = stage.id === selected.id;
          return `
            <article class="contract-card ${available.ok ? '' : 'locked'} ${active ? 'selected' : ''}" data-stage-id="${stage.id}">
              <div class="contract-thumbnail" style="color:${stage.palette[3]}">${stage.icon}</div>
              <div class="contract-copy">
                <small>NO.${String(stage.order).padStart(2, '0')} · ${stage.district}${stage.boss ? ' · BOSS VAULT' : ''}</small>
                <strong>${stage.name}</strong>
                <p>${stage.description}</p>
                <div class="contract-meta">
                  <span>난도 ${'★'.repeat(Math.ceil(stage.difficulty / 2))}</span>
                  <span>투입 ₩${number(stage.entry)}</span>
                  <span>보수 ₩${number(stage.reward)}</span>
                  <span>${available.ok ? '출동 가능' : available.reason === 'reputation' ? `평판 ${available.required}` : `코인 ${number(available.required)}`}</span>
                </div>
              </div>
            </article>
          `;
        }).join('')}
      </div>
      <div class="panel-footer-action">
        <p><b>${selected.name}</b><br>${selected.description}</p>
        <button class="pixel-button primary" type="button" data-panel-action="select-stage">계약 확정</button>
      </div>
    `;
  }

  renderUpgradesPanel() {
    ELEMENTS.panelKicker.textContent = 'PIXEL EQUIPMENT LAB';
    ELEMENTS.panelTitle.textContent = `장비 작업대 · 보유 ₩${number(this.state.coins)}`;
    hide(ELEMENTS.panelTabs);
    ELEMENTS.panelContent.innerHTML = `
      <div class="upgrade-list">
        ${UPGRADES.map((upgrade) => {
          const level = this.state.upgrades[upgrade.id] ?? 0;
          const cost = getUpgradeCost(upgrade.id, level);
          const max = level >= upgrade.max;
          return `
            <article class="upgrade-card">
              <div class="upgrade-head">
                <span class="upgrade-icon">${upgrade.icon}</span>
                <div><strong>${upgrade.name} · LV.${level}/${upgrade.max}</strong><small>${upgrade.description}</small></div>
              </div>
              <div class="level-pips">${Array.from({ length: upgrade.max }, (_, index) => `<i class="${index < level ? 'active' : ''}"></i>`).join('')}</div>
              <div class="upgrade-buy-row">
                <span>${max ? '최대 개조 완료' : `다음 단계 비용 ₩${number(cost)}`}</span>
                <button class="pixel-button ${max ? 'ghost' : 'primary'}" type="button" data-upgrade-id="${upgrade.id}" ${max ? 'disabled' : ''}>${max ? 'MAX' : '개조'}</button>
              </div>
            </article>
          `;
        }).join('')}
      </div>
    `;
  }

  renderArchivePanel() {
    ELEMENTS.panelKicker.textContent = 'RECOVERY ARCHIVE';
    ELEMENTS.panelTitle.textContent = '동료·사건·발견 기록';
    ELEMENTS.panelTabs.hidden = false;
    const tabs = [
      ['crew', '동료'], ['cases', '사건'], ['collection', '발견물'], ['objectives', '사이클 목표'],
    ];
    if (!this.panelTab) this.panelTab = 'cases';
    ELEMENTS.panelTabs.innerHTML = tabs.map(([id, label]) => `<button type="button" data-panel-tab="${id}" class="${this.panelTab === id ? 'active' : ''}">${label}</button>`).join('');

    if (this.panelTab === 'crew') this.renderCrewTab();
    else if (this.panelTab === 'cases') this.renderCasesTab();
    else if (this.panelTab === 'collection') this.renderCollectionTab();
    else this.renderObjectivesTab();
  }

  renderCrewTab() {
    ELEMENTS.panelContent.innerHTML = `
      <div class="crew-list">
        ${CREW.map((crew) => {
          const bond = bondProgress(this.state.bonds[crew.id] ?? 0);
          const active = crew.id === this.state.selectedCrew;
          const canvas = drawPanelCharacterCanvas(crew.id, { portrait: true });
          return `
            <article class="crew-card ${active ? 'active' : ''}" data-crew-id="${crew.id}">
              <div class="crew-canvas-slot" data-canvas-crew="${crew.id}"></div>
              <div class="crew-card-copy">
                <small>${crew.callsign} · ${crew.role}</small>
                <strong>${crew.name}</strong>
                <p>${crew.passive}</p>
                <em>지원: ${crew.active} — ${crew.activeDescription}</em>
                <div class="case-progress"><i style="width:${bond.percentage}%"></i></div>
              </div>
              <b class="crew-bond">LV.${bond.level}${active ? '<br>동행 중' : ''}</b>
            </article>
          `;
        }).join('')}
      </div>
    `;
    $$('[data-canvas-crew]', ELEMENTS.panelContent).forEach((slot) => slot.append(createCharacterCanvas(slot.dataset.canvasCrew, { portrait: true })));
  }

  renderCasesTab() {
    ELEMENTS.panelContent.innerHTML = `
      <div class="case-list">
        ${CASES.map((caseFile) => {
          const progress = caseProgress(this.state, caseFile.id);
          return `
            <article class="case-card">
              <div class="case-head"><span class="case-icon" style="color:${caseFile.color}">◇</span><div><strong>${caseFile.title}</strong><small>${caseFile.subtitle}</small></div><b>${progress.clues}/${caseFile.required}</b></div>
              <div class="case-progress"><i style="width:${progress.percentage}%;background:${caseFile.color}"></i></div>
              <div class="case-chapters">
                ${caseFile.chapters.map((chapter) => {
                  const unlocked = progress.clues >= chapter.at;
                  return `<section class="case-chapter ${unlocked ? 'unlocked' : ''}"><strong>${unlocked ? chapter.title : `단서 ${chapter.at} 필요`}</strong><p>${unlocked ? chapter.text : '기록이 검게 지워져 있다.'}</p></section>`;
                }).join('')}
              </div>
            </article>
          `;
        }).join('')}
      </div>
    `;
  }

  renderCollectionTab() {
    const progress = collectionProgress(this.state);
    ELEMENTS.panelContent.innerHTML = `
      <div class="panel-footer-action"><p>발견 ${progress.found}/${progress.total} · 수집률 ${progress.percentage}%</p><span>전설 ${ITEMS.filter((item) => item.rarity === 'legendary' && this.state.collection[item.id]).length}</span></div>
      <div class="collection-list">
        ${ITEMS.map((item) => {
          const record = this.state.collection[item.id];
          return `
            <article class="collection-card ${record ? '' : 'locked'}" data-rarity="${item.rarity}">
              <div class="item-pixel">${record ? item.icon : '?'}</div>
              <strong>${record ? item.name : '미발견 물품'}</strong>
              <small>${record ? `${RARITIES[item.rarity].label} · 최고 ₩${number(record.bestValue)} · ${record.count}회` : '금고를 복구해 기록을 해제하세요.'}</small>
            </article>
          `;
        }).join('')}
      </div>
    `;
  }

  renderObjectivesTab() {
    ELEMENTS.panelContent.innerHTML = `
      <div class="panel-footer-action"><p>SHIFT ${String(this.state.shift.id).padStart(2, '0')} · 3일 단위 목표<br>완료 즉시 보상이 정산됩니다.</p><span>DAY ${this.state.day}</span></div>
      <div class="objective-list">
        ${this.state.shift.objectives.map((objective) => {
          const percentage = Math.round((objective.progress / objective.target) * 100);
          return `
            <article class="objective-card ${objective.complete ? 'complete' : ''}">
              <div><strong>${objective.complete ? '✓ ' : ''}${objective.label}</strong><small>${Math.round(objective.progress)}/${objective.target}</small><div class="objective-progress"><i style="width:${percentage}%"></i></div></div>
              <b>₩${number(objective.coins)}<br>◆${objective.intel}</b>
            </article>
          `;
        }).join('')}
      </div>
    `;
  }

  handlePanelClick(event) {
    const stageCard = event.target.closest('[data-stage-id]');
    if (stageCard) {
      const stage = getStage(stageCard.dataset.stageId);
      const availability = stageAvailability(this.state, stage);
      if (!availability.ok) {
        this.toast(availability.reason === 'reputation' ? `평판 ${availability.required}이 필요합니다.` : `코인 ${number(availability.required)}이 필요합니다.`);
        playSfx('hack-bad');
        return;
      }
      this.state = selectStage(this.state, stage.id);
      this.save();
      playSfx('interact');
      this.renderContractsPanel();
      return;
    }

    const action = event.target.closest('[data-panel-action]');
    if (action?.dataset.panelAction === 'select-stage') {
      const stage = getStage(this.state.selectedStage);
      this.closePanel();
      this.toast(`${stage.name} 계약이 출동 장치에 등록됐습니다.`);
      this.setObjective('출동문으로 이동해 현장에 진입하세요', '▼');
      return;
    }

    const upgradeButton = event.target.closest('[data-upgrade-id]');
    if (upgradeButton) {
      const result = purchaseUpgrade(this.state, upgradeButton.dataset.upgradeId);
      if (!result.ok) {
        this.toast(result.reason === 'coins' ? `코인 ₩${number(result.cost)}이 필요합니다.` : '이미 최대 개조 단계입니다.');
        playSfx('hack-bad');
        return;
      }
      this.state = result.state;
      this.save();
      playSfx('upgrade');
      this.toast(`${UPGRADES.find((upgrade) => upgrade.id === upgradeButton.dataset.upgradeId).name} 개조 완료`);
      this.renderUpgradesPanel();
      return;
    }

    const crewCard = event.target.closest('[data-crew-id]');
    if (crewCard) {
      const crew = getCrew(crewCard.dataset.crewId);
      this.state = selectCrew(this.state, crew.id);
      this.save();
      playSfx('skill');
      this.toast(`${crew.name}이(가) 오늘의 현장 파트너입니다.`);
      this.renderCrewTab();
    }
  }

  deploySelectedStage() {
    const stage = getStage(this.state.selectedStage);
    const availability = stageAvailability(this.state, stage);
    if (!availability.ok) {
      this.toast(availability.reason === 'reputation' ? `평판 ${availability.required}이 필요합니다.` : `투입 비용 ₩${number(availability.required)}이 필요합니다.`);
      this.openPanel('contracts');
      return;
    }
    const crew = getCrew(this.state.selectedCrew);
    this.say(crew.id, [
      `${stage.name}. ${stage.description}`,
      crew.lines.field[(this.state.day + stage.order) % crew.lines.field.length],
      `배전반 ${Math.min(3, 1 + Math.floor(stage.difficulty / 3))}개를 끄고 금고실로 들어가자.`,
    ], () => {
      const result = startMission(this.state, stage.id);
      if (!result.ok) return;
      this.state = result.state;
      this.save();
      this.beginField(result.stage);
    });
  }

  createMission(stage) {
    const layout = buildMissionLayout(stage, TILE);
    const panelsRequired = layout.panelPositions.length;
    const objects = [
      ...layout.panelPositions.map((position, index) => ({ id: `panel-${index}`, type: 'panel', ...position, done: false })),
      { id: 'vault', type: 'vault', ...layout.vaultPosition },
      ...layout.pickupPositions.map((position, index) => ({
        id: `${position.type}-${index}`,
        type: position.type,
        x: position.x,
        y: position.y,
        collected: false,
      })),
      ...layout.coverPositions.map((position, index) => ({ id: `cover-${index}`, type: 'cover', ...position })),
    ];

    const guardCount = Math.min(7, 1 + Math.floor(stage.difficulty / 2));
    const guards = Array.from({ length: guardCount }, (_, index) => {
      const path = layout.guardPaths[index % layout.guardPaths.length].map((position) => ({ ...position }));
      const type = stage.hazards.includes('drone') && index % 3 === 1
        ? 'drone'
        : stage.hazards.includes('camera') && index === guardCount - 1
          ? 'camera'
          : 'guard';
      return {
        id: `guard-${index}`,
        type,
        x: path[0].x,
        y: path[0].y,
        path,
        target: 1,
        speed: type === 'camera' ? 0 : 22 + stage.difficulty * 1.8,
        angle: type === 'camera' ? -Math.PI / 2 : 0,
        rotateSpeed: type === 'camera' ? 0.55 + stage.difficulty * 0.025 : 0,
        range: 64 + stage.difficulty * 2.5,
        cone: 0.45,
        detecting: false,
        frozen: 0,
      };
    });

    return {
      stage,
      map: layout.map,
      cols: layout.cols,
      rows: layout.rows,
      layoutSignature: layout.signature,
      player: { ...layout.start, direction: 'up', moving: false },
      companion: { x: layout.start.x - 18, y: layout.start.y + 14, direction: 'up', moving: false },
      camera: { x: 0, y: 96 },
      guards,
      objects,
      panelsRequired,
      panelsDone: 0,
      perfectHacks: 0,
      alert: 0,
      timeLeft: stage.time + (this.state.upgrades.boots ?? 0) * 1.5,
      nearObject: null,
      collectedCoins: 0,
      collectedIntel: 0,
      particles: [],
      skillCooldown: 0,
      skillActive: 0,
      finished: false,
      reason: null,
    };
  }

  beginField(stage, silent = false) {
    this.scene = 'field';
    this.mission = this.createMission(stage);
    hide(ELEMENTS.panelOverlay);
    hide(ELEMENTS.dialogueBox);
    show(ELEMENTS.topHud);
    show(ELEMENTS.objectiveHud);
    show(ELEMENTS.mobileControls);
    ELEMENTS.fieldSkillButton.hidden = false;
    ELEMENTS.fieldSkillButton.querySelector('span').textContent = '동료';
    ELEMENTS.hudScene.textContent = `${stage.district} · ${stage.name}`;
    setMusicScene('field');
    this.setObjective(`배전반 ${this.mission.panelsRequired}개를 해킹하세요`, '⌁');
    if (!silent && !this.state.tutorial.field) {
      this.state = { ...this.state, tutorial: { ...this.state.tutorial, field: true } };
      this.save();
      this.say(this.state.selectedCrew, [
        '경비의 붉은 시야를 피하고 배전반에 접근해. 벽과 상자 뒤에서는 시야가 막혀.',
        '경보가 100%가 되거나 시간이 끝나면 현장이 봉쇄돼. 달리기는 빠르지만 발각도 빠르다.',
      ]);
    }
  }

  updateField(dt) {
    const mission = this.mission;
    if (!mission || mission.finished) return;
    mission.timeLeft = Math.max(0, mission.timeLeft - dt);
    mission.skillCooldown = Math.max(0, mission.skillCooldown - dt);
    ELEMENTS.fieldSkillButton.disabled = mission.skillCooldown > 0;
    ELEMENTS.fieldSkillButton.querySelector('span').textContent = mission.skillCooldown > 0 ? `${Math.ceil(mission.skillCooldown)}초` : '동료';
    mission.skillActive = Math.max(0, mission.skillActive - dt);

    let dx = (this.input.right ? 1 : 0) - (this.input.left ? 1 : 0);
    let dy = (this.input.down ? 1 : 0) - (this.input.up ? 1 : 0);
    const moving = dx !== 0 || dy !== 0;
    const bonuses = crewBonuses(this.state);
    if (moving) {
      const length = Math.hypot(dx, dy) || 1;
      dx /= length;
      dy /= length;
      const dash = this.input.dash ? 1.52 : 1;
      const speed = (62 + (this.state.upgrades.boots ?? 0) * 4.2) * bonuses.moveSpeed * dash * dt;
      const nextX = mission.player.x + dx * speed;
      const nextY = mission.player.y + dy * speed;
      if (!this.fieldCollision(nextX, mission.player.y)) mission.player.x = nextX;
      if (!this.fieldCollision(mission.player.x, nextY)) mission.player.y = nextY;
      mission.player.direction = directionFromVector(dx, dy, mission.player.direction);
      if (this.totalTime - this.lastFootstep > (this.input.dash ? 150 : 235)) {
        playSfx('move');
        this.lastFootstep = this.totalTime;
      }
    }
    mission.player.moving = moving;
    this.updateCompanion(dt);
    this.updateGuards(dt);
    this.updateMissionCamera();
    this.updateFieldObjects();
    this.updateFieldParticles(dt);

    if (this.input.interactQueued) {
      this.input.interactQueued = false;
      this.interactField();
    }

    if (mission.timeLeft <= 0) this.failCurrentMission('timeout');
    if (mission.alert >= 100) this.failCurrentMission('caught');
  }

  fieldCollision(x, y) {
    const mission = this.mission;
    const half = 5;
    const points = [
      [x - half, y - 10], [x + half, y - 10], [x - half, y + 10], [x + half, y + 10],
    ];
    return points.some(([px, py]) => {
      const col = Math.floor(px / TILE);
      const row = Math.floor(py / TILE);
      return row < 0 || col < 0 || row >= mission.rows || col >= mission.cols || mission.map[row][col] === 1;
    });
  }

  updateCompanion(dt) {
    const mission = this.mission;
    const companion = mission.companion;
    const player = mission.player;
    const desired = { x: player.x - (player.direction === 'right' ? 18 : player.direction === 'left' ? -18 : 10), y: player.y + 17 };
    const dx = desired.x - companion.x;
    const dy = desired.y - companion.y;
    const d = Math.hypot(dx, dy);
    companion.moving = d > 4;
    if (d > 4) {
      const speed = Math.min(d, 75 * dt);
      companion.x += dx / d * speed;
      companion.y += dy / d * speed;
      companion.direction = directionFromVector(dx, dy, companion.direction);
    }
  }

  updateGuards(dt) {
    const mission = this.mission;
    const bonuses = crewBonuses(this.state);
    let detected = false;
    for (const guard of mission.guards) {
      guard.frozen = Math.max(0, guard.frozen - dt);
      if (guard.type === 'camera') {
        if (guard.frozen <= 0) guard.angle += guard.rotateSpeed * dt;
      } else if (guard.frozen <= 0) {
        const target = guard.path[guard.target];
        const dx = target.x - guard.x;
        const dy = target.y - guard.y;
        const d = Math.hypot(dx, dy);
        if (d < 3) guard.target = guard.target === 0 ? 1 : 0;
        else {
          guard.x += dx / d * guard.speed * dt;
          guard.y += dy / d * guard.speed * dt;
          guard.angle = Math.atan2(dy, dx);
        }
      }
      const visible = guard.frozen <= 0 && this.guardCanSeePlayer(guard);
      guard.detecting = visible;
      if (visible) detected = true;
    }

    const jammer = this.state.upgrades.jammer ?? 0;
    const dashPenalty = this.input.dash && this.mission.player.moving ? 1.45 : 1;
    if (detected) {
      const gain = (19 + mission.stage.difficulty * 1.6) * (1 - jammer * 0.065) * bonuses.detection * dashPenalty * dt;
      mission.alert = clamp(mission.alert + gain, 0, 100);
      if (mission.alert > 45 && Math.floor(mission.alert) % 12 === 0) playSfx('alert');
    } else {
      mission.alert = clamp(mission.alert - (8 + jammer * 0.8) * dt, 0, 100);
    }
  }

  guardCanSeePlayer(guard) {
    const mission = this.mission;
    const dx = mission.player.x - guard.x;
    const dy = (mission.player.y - 6) - (guard.y - 5);
    const d = Math.hypot(dx, dy);
    if (d > guard.range) return false;
    const angle = Math.atan2(dy, dx);
    let diff = Math.atan2(Math.sin(angle - guard.angle), Math.cos(angle - guard.angle));
    if (Math.abs(diff) > guard.cone) return false;
    if (!this.hasLineOfSight(guard.x, guard.y, mission.player.x, mission.player.y)) return false;
    if (this.playerBehindCover(guard)) return false;
    return true;
  }

  hasLineOfSight(x1, y1, x2, y2) {
    const mission = this.mission;
    const distanceValue = Math.hypot(x2 - x1, y2 - y1);
    const steps = Math.ceil(distanceValue / 7);
    for (let index = 1; index < steps; index += 1) {
      const t = index / steps;
      const x = x1 + (x2 - x1) * t;
      const y = y1 + (y2 - y1) * t;
      const col = Math.floor(x / TILE);
      const row = Math.floor(y / TILE);
      if (mission.map[row]?.[col] === 1) return false;
    }
    return true;
  }

  playerBehindCover(guard) {
    const mission = this.mission;
    return mission.objects.some((object) => {
      if (object.type !== 'cover') return false;
      const playerDistance = distance(object, mission.player);
      const guardDistance = distance(object, guard);
      return playerDistance < 17 && guardDistance > playerDistance;
    });
  }

  updateMissionCamera() {
    const mission = this.mission;
    const targetX = clamp(mission.player.x - VIEW_WIDTH / 2, 0, mission.cols * TILE - VIEW_WIDTH);
    const targetY = clamp(mission.player.y - VIEW_HEIGHT / 2, 0, mission.rows * TILE - VIEW_HEIGHT + 95);
    mission.camera.x += (targetX - mission.camera.x) * 0.12;
    mission.camera.y += (targetY - mission.camera.y) * 0.12;
  }

  updateFieldObjects() {
    const mission = this.mission;
    const interactable = mission.objects.filter((object) => {
      if ((object.type === 'coin' || object.type === 'intel') && object.collected) return false;
      if (object.type === 'cover') return false;
      return true;
    });
    mission.nearObject = this.findNearest(interactable, mission.player, 27);
  }

  updateFieldParticles(dt) {
    const mission = this.mission;
    for (const particle of mission.particles) {
      particle.life -= dt;
      particle.y += particle.vy * dt;
      particle.x += particle.vx * dt;
    }
    mission.particles = mission.particles.filter((particle) => particle.life > 0);
    if (Math.random() < dt * 7) {
      const stage = mission.stage;
      const color = stage.map === 'hotel' ? '#f29a4a' : stage.map === 'arctic' ? '#d5f4f4' : '#56e2d0';
      mission.particles.push({
        x: mission.camera.x + Math.random() * VIEW_WIDTH,
        y: mission.camera.y + 110 + Math.random() * (VIEW_HEIGHT - 140),
        vx: -3 + Math.random() * 6,
        vy: stage.map === 'flood' ? -3 : 5 + Math.random() * 8,
        life: 1.2 + Math.random() * 2,
        size: Math.random() > 0.75 ? 2 : 1,
        color,
      });
    }
  }

  interactField() {
    const object = this.mission.nearObject;
    if (!object) {
      this.toast('조사할 대상 가까이 이동하세요.');
      return;
    }
    if (object.type === 'coin') {
      object.collected = true;
      const amount = 25 + this.mission.stage.difficulty * 7;
      this.mission.collectedCoins += amount;
      playSfx('coin');
      this.toast(`현장 현금 ₩${number(amount)} 회수`);
      return;
    }
    if (object.type === 'intel') {
      object.collected = true;
      this.mission.collectedIntel += 1;
      playSfx('intel');
      this.toast('숨은 사건 정보 ◆1 회수');
      return;
    }
    if (object.type === 'panel' && !object.done) {
      this.beginHack(object);
      return;
    }
    if (object.type === 'vault') {
      if (this.mission.panelsDone < this.mission.panelsRequired) {
        const remaining = this.mission.panelsRequired - this.mission.panelsDone;
        this.say(this.state.selectedCrew, [`보안 전력이 남아 있어. 배전반 ${remaining}개를 더 해킹해야 해.`]);
      } else {
        this.beginVault();
      }
    }
  }

  beginHack(panel) {
    const juno = this.state.selectedCrew === 'juno';
    const width = clamp(17 + (this.state.upgrades.jammer ?? 0) * 1.5 + (juno ? 7 : 0) - this.mission.stage.difficulty * 0.45, 12, 29);
    const center = 26 + Math.random() * 48;
    this.hack = {
      panel,
      cursor: 5,
      direction: 1,
      speed: 58 + this.mission.stage.difficulty * 4,
      center,
      width,
      resolved: false,
    };
    ELEMENTS.hackZone.style.left = `${center - width / 2}%`;
    ELEMENTS.hackZone.style.width = `${width}%`;
    ELEMENTS.hackCursor.style.left = '5%';
    ELEMENTS.hackMessage.textContent = '커서가 녹색 신호에 들어올 때 연결하세요.';
    ELEMENTS.hackAction.disabled = false;
    show(ELEMENTS.hackOverlay);
    hide(ELEMENTS.mobileControls);
  }

  updateHack(dt) {
    if (!this.hack || this.hack.resolved) return;
    this.hack.cursor += this.hack.direction * this.hack.speed * dt;
    if (this.hack.cursor >= 97) {
      this.hack.cursor = 97;
      this.hack.direction = -1;
    } else if (this.hack.cursor <= 3) {
      this.hack.cursor = 3;
      this.hack.direction = 1;
    }
    ELEMENTS.hackCursor.style.left = `${this.hack.cursor}%`;
  }

  resolveHack() {
    if (!this.hack || this.hack.resolved) return;
    const half = this.hack.width / 2;
    const distanceFromCenter = Math.abs(this.hack.cursor - this.hack.center);
    const success = distanceFromCenter <= half;
    const perfect = distanceFromCenter <= half * 0.28;
    this.hack.resolved = true;
    ELEMENTS.hackAction.disabled = true;
    if (success) {
      this.hack.panel.done = true;
      this.mission.panelsDone += 1;
      if (perfect) this.mission.perfectHacks += 1;
      ELEMENTS.hackMessage.textContent = perfect ? 'PERFECT! 경보 없이 회로가 차단됐습니다.' : '연결 성공. 보안 회로를 차단했습니다.';
      playSfx('hack-good');
      setTimeout(() => {
        hide(ELEMENTS.hackOverlay);
        show(ELEMENTS.mobileControls);
        this.hack = null;
        if (this.mission.panelsDone >= this.mission.panelsRequired) {
          this.setObjective('금고실로 이동해 금고를 해체하세요', '⬡');
          this.say(this.state.selectedCrew, ['모든 배전반이 꺼졌어. 이제 금고실로 이동하자.']);
        } else {
          this.setObjective(`남은 배전반 ${this.mission.panelsRequired - this.mission.panelsDone}개를 해킹하세요`, '⌁');
        }
      }, 650);
    } else {
      const penalty = this.state.selectedCrew === 'juno' ? 14 : 23;
      this.mission.alert = clamp(this.mission.alert + penalty, 0, 100);
      ELEMENTS.hackMessage.textContent = `신호 충돌! 경보 +${penalty}. 다시 접근해야 합니다.`;
      playSfx('hack-bad');
      this.bumpShake(0.18);
      setTimeout(() => {
        hide(ELEMENTS.hackOverlay);
        show(ELEMENTS.mobileControls);
        this.hack = null;
      }, 750);
    }
  }

  createVaultState(stage) {
    const tuning = getVaultTuning(stage, this.state.upgrades);
    return {
      stage,
      tuning,
      locks: tuning.locks,
      currentLock: 1,
      pressure: 0,
      safeCenter: 47,
      safeWidth: tuning.baseWidth,
      baseWidth: tuning.baseWidth,
      progress: 0,
      totalProgress: 0,
      heat: 0,
      noise: 0,
      integrity: 100,
      timeLeft: tuning.timeLimit,
      comboSeconds: 0,
      comboGrace: 0,
      combo: 1,
      maxCombo: 1,
      holding: false,
      finished: false,
      event: null,
      eventWarning: null,
      nextEvent: 5.5,
      eventTime: 0,
      skillCooldown: 0,
      skillShield: 0,
      lootHintBoost: 0,
      alarmStrikes: 0,
      safeWasActive: false,
      rescueUsed: false,
    };
  }

  beginVault(silent = false) {
    this.vault = this.createVaultState(this.mission.stage);
    show(ELEMENTS.vaultOverlay);
    hide(ELEMENTS.mobileControls);
    setMusicScene('vault');
    this.renderVaultUi();
    if (!silent && !this.state.tutorial.vault) {
      this.state = { ...this.state, tutorial: { ...this.state.tutorial, vault: true } };
      this.save();
      this.toast('누르고 유지해 압력을 SAFE 구간에 맞추세요. F는 동료 지원입니다.');
    }
  }

  updateVault(dt) {
    const vault = this.vault;
    if (!vault || vault.finished) return;
    const tuning = vault.tuning ?? getVaultTuning(vault.stage, this.state.upgrades);
    vault.tuning = tuning;
    vault.timeLeft = Math.max(0, vault.timeLeft - dt);
    vault.skillCooldown = Math.max(0, vault.skillCooldown - dt);
    vault.skillShield = Math.max(0, vault.skillShield - dt);
    vault.comboGrace = Math.max(0, (vault.comboGrace ?? 0) - dt);
    vault.nextEvent -= dt;
    if (vault.nextEvent <= 0 && !vault.event && !vault.eventWarning) {
      const events = vault.stage.vaultEvents;
      vault.eventWarning = events[Math.floor(Math.random() * events.length)];
      vault.eventTime = 1.15;
      playSfx('alert');
    }
    if (vault.eventWarning) {
      vault.eventTime -= dt;
      if (vault.eventTime <= 0) {
        vault.event = vault.eventWarning;
        vault.eventWarning = null;
        vault.eventTime = 2.6 + vault.stage.difficulty * 0.06;
      }
    } else if (vault.event) {
      vault.eventTime -= dt;
      if (vault.eventTime <= 0) {
        vault.event = null;
        vault.nextEvent = Math.max(3.8, 7.2 - vault.stage.difficulty * 0.25 + Math.random() * 2.2);
      }
    }

    const centerWave = Math.sin((this.totalTime / 1000) * tuning.centerSpeed + vault.currentLock) * tuning.centerAmplitude;
    vault.safeCenter = clamp(48 + centerWave, 18, 82);
    let width = vault.baseWidth;
    if (vault.event === 'jam') width *= 0.58;
    if (vault.event === 'fragile') width *= 0.75;
    vault.safeWidth = clamp(width, 8, 36);

    if (vault.holding) vault.pressure += tuning.pressureRise * dt;
    else vault.pressure -= tuning.pressureFall * dt;
    if (vault.event === 'wave') vault.pressure += (this.state.selectedCrew === 'minhyuk' ? 8 : 14) * dt;
    vault.pressure = clamp(vault.pressure, 0, 100);

    const min = vault.safeCenter - vault.safeWidth / 2;
    const max = vault.safeCenter + vault.safeWidth / 2;
    const safe = vault.pressure >= min && vault.pressure <= max;
    const centerDistance = Math.abs(vault.pressure - vault.safeCenter) / Math.max(1, vault.safeWidth / 2);
    const exact = safe && centerDistance < 0.28;
    const scanPunish = vault.event === 'scan' && vault.holding;

    if (vault.holding) {
      if (safe && !scanPunish) {
        vault.comboGrace = tuning.comboGraceSeconds;
        vault.comboSeconds += dt * (exact ? tuning.exactComboGain : tuning.safeComboGain);
        vault.combo = clamp(1 + Math.floor(vault.comboSeconds / 1.7), 1, 5);
        vault.maxCombo = Math.max(vault.maxCombo, vault.combo);
        const progressRate = tuning.progressRate * (1 + (vault.combo - 1) * 0.14) * (exact ? 1.12 : 1);
        vault.progress += progressRate * dt;
        vault.heat += (tuning.heatGain + (vault.event === 'heat' ? 10.5 : 0)) * dt;
        vault.noise += tuning.noiseGain * dt;
        if (!vault.safeWasActive) playSfx('safe');
      } else if (vault.pressure < min && !scanPunish) {
        if (vault.comboGrace <= 0) vault.comboSeconds = Math.max(0, vault.comboSeconds - tuning.missComboDecay * dt);
        vault.combo = clamp(1 + Math.floor(vault.comboSeconds / 1.7), 1, 5);
        vault.progress += tuning.progressRate * 0.08 * dt;
        vault.heat += (tuning.heatLowGain + (vault.event === 'heat' ? 12 : 0)) * dt;
        vault.noise += tuning.noiseLowGain * dt;
      } else {
        const over = Math.max(0, vault.pressure - max);
        vault.comboGrace = 0;
        vault.comboSeconds = Math.max(0, vault.comboSeconds - 3.2 * dt);
        vault.combo = clamp(1 + Math.floor(vault.comboSeconds / 1.7), 1, 5);
        vault.heat += (tuning.heatOverGain + over * 0.11) * dt;
        vault.noise += (vault.event === 'scan' ? 34 : tuning.noiseOverGain + over * 0.1) * dt;
        if (vault.skillShield <= 0) {
          const fragile = vault.event === 'fragile' ? 1.65 : 1;
          vault.integrity -= (4 + vault.stage.difficulty * 0.62 + over * 0.075) * fragile * dt;
        }
        playSfx('strain');
        if (over > 7) this.bumpShake(0.08);
      }
    } else {
      if (vault.comboGrace <= 0) vault.comboSeconds = Math.max(0, vault.comboSeconds - tuning.releaseComboDecay * dt);
      vault.combo = clamp(1 + Math.floor(vault.comboSeconds / 1.7), 1, 5);
      vault.heat -= tuning.coolingRate * dt;
      vault.noise -= tuning.noiseRecovery * dt;
    }
    vault.safeWasActive = safe && vault.holding;

    if (vault.heat > 82 && vault.skillShield <= 0) vault.integrity -= (vault.heat - 82) * 0.04 * dt;
    if (vault.noise >= 100) {
      vault.noise = 54;
      vault.alarmStrikes += 1;
      if (vault.skillShield <= 0) vault.integrity -= 11 + vault.stage.difficulty;
      playSfx('alert');
      this.bumpShake(0.2);
    }

    if (this.state.selectedCrew === 'seojin' && (vault.heat > 88 || vault.noise > 92) && !vault.autoStopped) {
      vault.holding = false;
      vault.autoStopped = true;
      vault.heat = Math.max(0, vault.heat - 8);
      vault.noise = Math.max(0, vault.noise - 8);
      ELEMENTS.vaultHold.classList.remove('pressed');
      this.toast('윤서진: 강제 정지. 냉각부터 해.');
      playSfx('skill');
    }

    vault.progress = clamp(vault.progress, 0, 100);
    vault.heat = clamp(vault.heat, 0, 100);
    vault.noise = clamp(vault.noise, 0, 100);
    vault.integrity = clamp(vault.integrity, 0, 100);

    if (vault.progress >= 100) this.completeVaultLock();
    if (vault.finished || this.mission?.finished) return;
    if (vault.timeLeft <= 0) {
      if (tuning.rescueSeconds > 0 && !vault.rescueUsed) {
        vault.rescueUsed = true;
        vault.timeLeft = tuning.rescueSeconds;
        vault.holding = false;
        vault.heat = Math.max(0, vault.heat - 14);
        vault.noise = Math.max(0, vault.noise - 14);
        ELEMENTS.vaultHold.classList.remove('pressed');
        this.toast(`윤서진: 훈련용 비상 전원 ${tuning.rescueSeconds}초 투입. 이번엔 끝내자.`);
        playSfx('skill');
      } else {
        this.failCurrentMission('vault-timeout');
      }
    }
    if (vault.integrity <= 0) this.failCurrentMission('damaged');
    if (vault.alarmStrikes >= 3) this.failCurrentMission('alarm');
    this.renderVaultUi();
  }

  renderVaultUi() {
    const vault = this.vault;
    if (!vault) return;
    ELEMENTS.vaultStageLabel.textContent = `LOCK ${vault.currentLock}/${vault.locks}`;
    ELEMENTS.vaultTitle.textContent = vault.stage.boss ? '보스 금고 다중 잠금축' : '기계식 잠금축';
    ELEMENTS.vaultTimer.textContent = formatTimer(vault.timeLeft);
    ELEMENTS.vaultCombo.textContent = `×${vault.combo}`;
    const overallProgress = ((vault.currentLock - 1) * 100 + vault.progress) / (vault.locks * 100) * 100;
    ELEMENTS.vaultProgress.textContent = `${Math.floor(overallProgress)}%`;
    ELEMENTS.tensionSafe.style.left = `${vault.safeCenter - vault.safeWidth / 2}%`;
    ELEMENTS.tensionSafe.style.width = `${vault.safeWidth}%`;
    ELEMENTS.tensionFill.style.width = `${vault.pressure}%`;
    ELEMENTS.tensionNeedle.style.left = `${vault.pressure}%`;
    ELEMENTS.vaultIntegrity.textContent = `${Math.round(vault.integrity)}%`;
    ELEMENTS.vaultHeat.textContent = `${Math.round(vault.heat)}%`;
    ELEMENTS.vaultNoise.textContent = `${Math.round(vault.noise)}%`;
    ELEMENTS.integrityFill.style.width = `${vault.integrity}%`;
    ELEMENTS.heatFill.style.width = `${vault.heat}%`;
    ELEMENTS.noiseFill.style.width = `${vault.noise}%`;
    ELEMENTS.pixelVault.classList.toggle('drilling', vault.holding);

    const crew = getCrew(this.state.selectedCrew);
    ELEMENTS.crewSkillIcon.textContent = crew.symbol;
    ELEMENTS.crewSkillName.textContent = crew.active;
    ELEMENTS.crewSkill.disabled = vault.skillCooldown > 0;
    ELEMENTS.crewSkillCooldown.textContent = vault.skillCooldown > 0 ? `${vault.skillCooldown.toFixed(1)}s` : 'READY · F';

    const min = vault.safeCenter - vault.safeWidth / 2;
    const max = vault.safeCenter + vault.safeWidth / 2;
    if (vault.eventWarning) {
      ELEMENTS.vaultEvent.hidden = false;
      ELEMENTS.vaultEventIcon.textContent = '!';
      ELEMENTS.vaultEventText.textContent = `예고: ${this.eventLabel(vault.eventWarning)}`;
    } else if (vault.event) {
      ELEMENTS.vaultEvent.hidden = false;
      ELEMENTS.vaultEventIcon.textContent = '⚠';
      ELEMENTS.vaultEventText.textContent = this.eventLabel(vault.event);
    } else {
      ELEMENTS.vaultEvent.hidden = true;
    }
    if (vault.event === 'blackout') {
      ELEMENTS.tensionSafe.style.opacity = '0.08';
      ELEMENTS.vaultStatus.textContent = '센서 암전 · 위치를 기억하세요';
    } else {
      ELEMENTS.tensionSafe.style.opacity = '1';
      ELEMENTS.vaultStatus.textContent = vault.pressure < min ? '압력이 낮습니다' : vault.pressure > max ? '과압 · 손을 떼세요' : 'SAFE 구간 유지';
    }
  }

  eventLabel(event) {
    return {
      scan: '보안 스캔 · 손을 떼세요',
      wave: '압력 파동 · 게이지가 밀립니다',
      heat: '열 역류 · 짧게 조작하세요',
      blackout: '센서 암전 · 위치 기억',
      fragile: '취약층 · 상단 과압 금지',
      jam: '잠금핀 걸림 · 중앙만 유효',
    }[event] ?? event;
  }

  completeVaultLock() {
    const vault = this.vault;
    vault.totalProgress += 100;
    playSfx('lock');
    this.bumpShake(0.12);
    if (vault.currentLock >= vault.locks) {
      vault.finished = true;
      vault.holding = false;
      ELEMENTS.vaultHold.classList.remove('pressed');
      setTimeout(() => this.beginLoot(), 450);
      return;
    }
    vault.currentLock += 1;
    vault.progress = 0;
    vault.pressure = Math.min(vault.pressure, 45);
    vault.safeCenter = 35 + Math.random() * 30;
    vault.comboSeconds = Math.max(0, vault.comboSeconds - 1.2);
    vault.comboGrace = vault.tuning?.comboGraceSeconds ?? 0.45;
    vault.autoStopped = false;
    vault.nextEvent = 3.2 + Math.random() * 2;
    this.toast(`잠금축 ${vault.currentLock - 1} 해제 · 다음 축 진입`);
  }

  useCrewSkill() {
    const vault = this.vault;
    if (!vault || vault.skillCooldown > 0 || vault.finished) return;
    const crew = getCrew(this.state.selectedCrew);
    vault.skillCooldown = Math.max(8, 13 - bondProgress(this.state.bonds[crew.id] ?? 0).level * 0.6);
    if (crew.id === 'seojin') {
      vault.heat = Math.max(0, vault.heat - 18);
      vault.noise = Math.max(0, vault.noise - 18);
      vault.skillShield = 2;
      vault.holding = false;
      ELEMENTS.vaultHold.classList.remove('pressed');
    } else if (crew.id === 'harin') {
      vault.safeWidth = Math.min(38, vault.safeWidth + 9);
      vault.baseWidth = Math.min(34, vault.baseWidth + 3);
      vault.lootHintBoost += 0.18;
    } else if (crew.id === 'minhyuk') {
      vault.pressure += (vault.safeCenter - vault.pressure) * 0.8;
      vault.comboSeconds += 1.2;
    } else if (crew.id === 'juno') {
      vault.progress = Math.min(100, vault.progress + 12);
      vault.heat = Math.min(100, vault.heat + 10);
    } else if (crew.id === 'jaewook') {
      if (vault.timeLeft < 20) vault.timeLeft += 7;
      else vault.integrity = Math.min(100, vault.integrity + 10);
    } else {
      vault.noise = Math.max(0, vault.noise - 22);
      vault.event = null;
      vault.eventWarning = null;
      vault.nextEvent = 5;
    }
    playSfx('skill');
    this.toast(`${crew.name}: ${crew.active}!`);
    this.renderVaultUi();
  }

  combinedMissionSummary() {
    return {
      alert: this.mission?.alert ?? 0,
      integrity: this.vault?.integrity ?? 100,
      maxCombo: this.vault?.maxCombo ?? 1,
      perfectHacks: this.mission?.perfectHacks ?? 0,
      timeLeft: this.vault?.timeLeft ?? this.mission?.timeLeft ?? 0,
      stageTime: this.mission?.stage.time ?? 60,
    };
  }

  beginLoot() {
    hide(ELEMENTS.vaultOverlay);
    const summary = this.combinedMissionSummary();
    summary.grade = gradeMission(summary);
    this.lootRoll = rollLootBoxes(this.state, this.mission.stage, summary, `${this.state.day}:${this.mission.stage.id}:${summary.maxCombo}:${Math.round(summary.integrity)}`);
    const crew = getCrew(this.state.selectedCrew);
    const scanner = this.state.upgrades.scanner ?? 0;
    let hint = `${crew.name}: ${crew.lines.success[(this.state.day + scanner) % crew.lines.success.length]}`;
    let highlighted = -1;
    if (scanner > 0 || crew.id === 'harin') {
      highlighted = this.lootRoll.bestIndex;
      const confidence = clamp(45 + scanner * 8 + (crew.id === 'harin' ? 18 : 0) + (this.vault?.lootHintBoost ?? 0) * 100, 45, 96);
      hint += ` 스캐너 신뢰도 ${Math.round(confidence)}%. ${highlighted + 1}번 보관함의 신호가 가장 강해.`;
    } else {
      hint += ' 세 보관함의 신호가 비슷해. 감으로 골라야겠어.';
    }
    ELEMENTS.lootHint.textContent = hint;
    ELEMENTS.lootBoxes.innerHTML = this.lootRoll.boxes.map((box, index) => `
      <button class="loot-box ${index === highlighted ? 'glow' : ''}" type="button" data-loot-box="${index}"><span>BOX ${String(index + 1).padStart(2, '0')}</span></button>
    `).join('');
    show(ELEMENTS.lootOverlay);
    setMusicScene('result');
  }

  selectLootBox(index, silent = false) {
    if (!this.lootRoll) return;
    this.selectedLoot = this.lootRoll.boxes[index] ?? this.lootRoll.boxes[0];
    hide(ELEMENTS.lootOverlay);
    this.showResult(silent);
  }

  showResult(silent = false) {
    const loot = this.selectedLoot;
    const item = getItem(loot.itemId);
    const missionSummary = this.combinedMissionSummary();
    missionSummary.grade = gradeMission(missionSummary);
    this.missionSummary = missionSummary;
    const crew = getCrew(this.state.selectedCrew);

    ELEMENTS.resultGrade.textContent = missionSummary.grade;
    ELEMENTS.resultItemIcon.textContent = item.icon;
    ELEMENTS.resultItemIcon.style.color = RARITIES[item.rarity].color;
    ELEMENTS.resultRarity.textContent = RARITIES[item.rarity].label;
    ELEMENTS.resultRarity.style.borderColor = RARITIES[item.rarity].color;
    ELEMENTS.resultRarity.style.color = RARITIES[item.rarity].color;
    ELEMENTS.resultItemName.textContent = item.name;
    ELEMENTS.resultItemStory.textContent = item.story;
    ELEMENTS.resultValue.textContent = `₩ ${number(loot.value)}`;
    ELEMENTS.resultCondition.textContent = `${loot.condition}%`;
    ELEMENTS.resultCombo.textContent = `×${missionSummary.maxCombo}`;
    const lineCanvas = createCharacterCanvas(crew.id, { portrait: true, expression: 'happy' });
    ELEMENTS.resultCrewLine.innerHTML = '';
    ELEMENTS.resultCrewLine.append(lineCanvas);
    const line = document.createElement('p');
    line.textContent = `${crew.name}: ${crew.lines.success[(this.state.day + item.name.length) % crew.lines.success.length]}`;
    ELEMENTS.resultCrewLine.append(line);

    const returnValue = choicePreview(this.state, this.mission.stage, loot, 'return');
    const archiveValue = choicePreview(this.state, this.mission.stage, loot, 'archive');
    const auctionValue = choicePreview(this.state, this.mission.stage, loot, 'auction');
    ELEMENTS.returnPreview.textContent = `₩${number(returnValue.coins)} · ★+${returnValue.reputation}`;
    ELEMENTS.archivePreview.textContent = `◆+${archiveValue.intel} · 단서+${archiveValue.clues}`;
    ELEMENTS.auctionPreview.textContent = `₩${number(auctionValue.coins)}`;
    show(ELEMENTS.resultOverlay);
    if (!silent) playSfx(item.rarity === 'legendary' ? 'legendary' : 'loot');
  }

  resolveResultChoice(choice) {
    const result = settleMission(this.state, this.mission.stage, this.missionSummary, this.selectedLoot, choice);
    // Add field pickups after mission settlement.
    result.state = {
      ...result.state,
      coins: result.state.coins + this.mission.collectedCoins,
      intel: result.state.intel + this.mission.collectedIntel,
      stats: {
        ...result.state.stats,
        totalEarned: result.state.stats.totalEarned + this.mission.collectedCoins,
      },
    };
    this.state = result.state;
    this.save();
    hide(ELEMENTS.resultOverlay);
    this.renderSettlement(result, choice);
    playSfx('success');
  }

  renderSettlement(result, choice) {
    const labels = { return: '주인에게 반환 완료', archive: '기록 보존 완료', auction: '야간 경매 낙찰' };
    ELEMENTS.settlementTitle.textContent = labels[choice];
    const rows = [
      ['기본 정산', `₩ ${number(result.preview.coins)}`],
      ['현장 회수', `₩ ${number(this.mission.collectedCoins)}`],
      ['평판', `★ +${result.preview.reputation}`],
      ['정보', `◆ +${result.preview.intel + this.mission.collectedIntel}`],
      ['동료 관계', `+${result.preview.bond}${result.grade === 'S' ? ' + S보너스 2' : ''}`],
      ['복구 등급', `${result.grade} · ${GRADE_LABELS[result.grade]}`],
    ];
    if (result.objectiveRewards.length) {
      rows.push(['사이클 목표', `₩ ${number(result.objectiveRewards.reduce((sum, objective) => sum + objective.coins, 0))} · ◆ ${result.objectiveRewards.reduce((sum, objective) => sum + objective.intel, 0)}`]);
    }
    ELEMENTS.settlementRows.innerHTML = rows.map(([label, value]) => `<div class="settlement-row"><span>${label}</span><b>${value}</b></div>`).join('');

    const notices = [];
    if (result.unlockedStage) notices.push(`NEW STAGE · ${result.unlockedStage.name} 출동 허가`);
    if (result.unlockedChapter) notices.push(`CASE UPDATE · ${result.unlockedChapter.title}\n${result.unlockedChapter.text}`);
    if (notices.length) {
      ELEMENTS.unlockNotice.hidden = false;
      ELEMENTS.unlockNotice.textContent = notices.join('\n\n');
    } else {
      ELEMENTS.unlockNotice.hidden = true;
    }
    show(ELEMENTS.settlementOverlay);
  }

  failCurrentMission(reason) {
    if (!this.mission || this.mission.finished) return;
    this.mission.finished = true;
    this.mission.reason = reason;
    if (this.vault) this.vault.finished = true;
    hide(ELEMENTS.hackOverlay);
    hide(ELEMENTS.vaultOverlay);
    hide(ELEMENTS.lootOverlay);
    this.state = failMission(this.state, { reason });
    this.save();
    const crew = getCrew(this.state.selectedCrew);
    ELEMENTS.settlementTitle.textContent = '현장 철수';
    const reasonLabel = {
      timeout: '현장 제한 시간 초과',
      caught: '경보 100% · 현장 봉쇄',
      'vault-timeout': '금고 재잠금 시간 초과',
      damaged: '내용물 보호 한계 초과',
      alarm: '금고 보안 경보 3회',
    }[reason] ?? '작업 중단';
    ELEMENTS.settlementRows.innerHTML = `
      <div class="settlement-row"><span>철수 원인</span><b>${reasonLabel}</b></div>
      <div class="settlement-row"><span>동료 메시지</span><b>${crew.lines.fail[this.state.day % crew.lines.fail.length]}</b></div>
      <div class="settlement-row"><span>관계 경험</span><b>+1</b></div>
    `;
    ELEMENTS.unlockNotice.hidden = true;
    show(ELEMENTS.settlementOverlay);
    playSfx('fail');
    this.bumpShake(0.28);
  }

  useFieldCrewSkill() {
    const mission = this.mission;
    if (!mission || mission.skillCooldown > 0) return;
    const crew = getCrew(this.state.selectedCrew);
    mission.skillCooldown = 11;
    if (crew.id === 'nabi') {
      mission.guards.forEach((guard) => { guard.frozen = 4; });
      mission.skillActive = 4;
      this.toast('나비: 전자기 재밍! 경비 4초 정지.');
    } else if (crew.id === 'minhyuk') {
      mission.alert = Math.max(0, mission.alert - 24);
      this.toast('강민혁: 우회 동선 확보. 경보 -24.');
    } else if (crew.id === 'juno') {
      const undone = mission.objects.find((object) => object.type === 'panel' && !object.done);
      if (undone && distance(undone, mission.player) < 90) {
        undone.done = true;
        mission.panelsDone += 1;
        this.toast('오주노: 원격 회로 차단 성공.');
        if (mission.panelsDone >= mission.panelsRequired) this.setObjective('금고실로 이동해 금고를 해체하세요', '⬡');
      } else {
        mission.alert = Math.max(0, mission.alert - 12);
        this.toast('오주노: 감시 회로에 잡음 주입.');
      }
    } else if (crew.id === 'harin') {
      const intel = mission.objects.find((object) => object.type === 'intel' && !object.collected);
      if (intel) this.toast(`박하린: 숨은 기록은 금고실 기준 ${Math.round(distance(intel, mission.player) / TILE)}칸 거리예요.`);
      else this.toast('박하린: 이 현장의 숨은 기록은 모두 회수했어요.');
    } else if (crew.id === 'jaewook') {
      mission.timeLeft += 8;
      this.toast('한재욱: 계약 지연 조항 적용. 시간 +8초.');
    } else {
      mission.alert = Math.max(0, mission.alert - 18);
      mission.timeLeft += 3;
      this.toast('윤서진: 동선 재정비. 경보 -18, 시간 +3초.');
    }
    playSfx('skill');
  }

  openPause() {
    if (this.scene === 'title') return;
    show(ELEMENTS.pauseOverlay);
    hide(ELEMENTS.mobileControls);
    this.clearInput();
  }

  closePause() {
    hide(ELEMENTS.pauseOverlay);
    if (this.scene === 'hub' || this.scene === 'field') show(ELEMENTS.mobileControls);
  }

  toast(message) {
    clearTimeout(this.toastTimer);
    ELEMENTS.toast.textContent = message;
    ELEMENTS.toast.classList.add('show');
    this.toastTimer = setTimeout(() => ELEMENTS.toast.classList.remove('show'), 2200);
  }

  bumpShake(duration) {
    if (!this.state.settings.shake) return;
    this.shakeTime = Math.max(this.shakeTime, duration);
  }
}
