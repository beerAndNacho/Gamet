import {
  ITEMS,
  JOBS,
  RARITIES,
  UPGRADE_DEFINITIONS,
  getItemById,
  getJobById,
} from './data.js';
import {
  calculateRunGrade,
  canStartJob,
  createInitialState,
  createRun,
  getCollectionProgress,
  getUpgradeCost,
  markTutorialSeen,
  payJobEntry,
  purchaseUpgrade,
  rollLoot,
  settleFailure,
  settleSuccess,
  stepRun,
  updateSettings,
} from './engine.js';
import { clearState, loadState, saveState } from './storage.js';
import { playSound, setSoundEnabled, vibrate } from './audio.js';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const numberFormatter = new Intl.NumberFormat('ko-KR');

const elements = {
  app: $('#app'),
  header: $('#app-header'),
  bottomNav: $('#bottom-nav'),
  headerCoins: $('#header-coins'),
  headerReputation: $('#header-reputation'),
  brandHomeButton: $('#brand-home-button'),
  settingsButton: $('#settings-button'),
  goJobsButton: $('#go-jobs-button'),
  dayLabel: $('#day-label'),
  jobsDayStamp: $('#jobs-day-stamp'),
  metricCompleted: $('#metric-completed'),
  metricCollection: $('#metric-collection'),
  metricUpgrades: $('#metric-upgrades'),
  miniLevels: $('#mini-levels'),
  recentCard: $('#recent-card'),
  jobsList: $('#jobs-list'),
  upgradeBalance: $('#upgrade-balance'),
  upgradeList: $('#upgrade-list'),
  collectionRing: $('#collection-progress-ring'),
  collectionPercent: $('#collection-percent'),
  collectionDiscovered: $('#collection-discovered'),
  collectionTotal: $('#collection-total'),
  collectionLegendary: $('#collection-legendary'),
  collectionGrid: $('#collection-grid'),
  playEnvironment: $('#play-environment'),
  playClient: $('#play-client'),
  playJobName: $('#play-job-name'),
  playTimer: $('#play-timer'),
  timerBox: $('#timer-box'),
  vaultWorkArea: $('#vault-work-area'),
  vaultMachine: $('#vault-machine'),
  progressOrbit: $('#progress-orbit'),
  playConsole: $('#play-console'),
  playStage: $('#play-stage'),
  playMessage: $('#play-message'),
  playProgress: $('#play-progress'),
  targetZone: $('#target-zone'),
  pressureFill: $('#pressure-fill'),
  pressureNeedle: $('#pressure-needle'),
  integrityValue: $('#integrity-value'),
  integrityBar: $('#integrity-bar'),
  heatValue: $('#heat-value'),
  heatBar: $('#heat-bar'),
  noiseValue: $('#noise-value'),
  noiseBar: $('#noise-bar'),
  holdButton: $('#hold-button'),
  abortJobButton: $('#abort-job-button'),
  sceneParticles: $('#scene-particles'),
  successResult: $('#success-result'),
  failureResult: $('#failure-result'),
  settlementResult: $('#settlement-result'),
  resultGrade: $('#result-grade'),
  resultSubtitle: $('#result-subtitle'),
  resultItemCard: $('#result-item-card'),
  resultRarity: $('#result-rarity'),
  resultIcon: $('#result-icon'),
  resultCode: $('#result-code'),
  resultItemName: $('#result-item-name'),
  resultStory: $('#result-story'),
  resultValue: $('#result-value'),
  resultCondition: $('#result-condition'),
  resultConditionBar: $('#result-condition-bar'),
  returnReward: $('#return-reward'),
  auctionReward: $('#auction-reward'),
  returnItemButton: $('#return-item-button'),
  auctionItemButton: $('#auction-item-button'),
  failureTitle: $('#failure-title'),
  failureDescription: $('#failure-description'),
  failureProgress: $('#failure-progress'),
  failureIntegrity: $('#failure-integrity'),
  failureAlarms: $('#failure-alarms'),
  retryJobButton: $('#retry-job-button'),
  settlementHeading: $('#settlement-heading'),
  settlementCoins: $('#settlement-coins'),
  settlementReputation: $('#settlement-reputation'),
  settlementHomeButton: $('#settlement-home-button'),
  toast: $('#toast'),
  tutorialModal: $('#tutorial-modal'),
  tutorialStartButton: $('#tutorial-start-button'),
  settingsModal: $('#settings-modal'),
  settingsCloseButton: $('#settings-close-button'),
  soundToggle: $('#sound-toggle'),
  motionToggle: $('#motion-toggle'),
  resetSaveButton: $('#reset-save-button'),
  confirmModal: $('#confirm-modal'),
  confirmTitle: $('#confirm-title'),
  confirmMessage: $('#confirm-message'),
  confirmCancelButton: $('#confirm-cancel-button'),
  confirmActionButton: $('#confirm-action-button'),
};

let state = loadState();
let currentScreen = 'home';
let selectedJob = null;
let run = null;
let currentFind = null;
let frameRequest = null;
let lastFrameTime = 0;
let held = false;
let gamePaused = false;
let confirmAction = null;
let toastTimeout = null;
let lastFeedbackAt = 0;
let lastAlarmCount = 0;
let particleAccumulator = 0;
let settlementLocked = false;

function formatCoins(value) {
  return numberFormatter.format(Math.max(0, Math.round(value)));
}

function persist() {
  saveState(state);
}

function applySettings() {
  setSoundEnabled(state.settings.sound);
  elements.soundToggle.checked = state.settings.sound;
  elements.motionToggle.checked = state.settings.reducedMotion;
  elements.app.classList.toggle('reduce-motion', state.settings.reducedMotion);
}

function showToast(message, type = 'normal') {
  clearTimeout(toastTimeout);
  elements.toast.textContent = message;
  elements.toast.classList.toggle('error', type === 'error');
  elements.toast.classList.add('show');
  toastTimeout = setTimeout(() => elements.toast.classList.remove('show'), 2100);
}

function updateResourceHeader() {
  elements.headerCoins.textContent = formatCoins(state.coins);
  elements.headerReputation.textContent = formatCoins(state.reputation);
}

function renderHome() {
  const progress = getCollectionProgress(state);
  const totalUpgradeLevel = Object.values(state.upgrades).reduce((sum, level) => sum + level, 0);
  const displayLevel = Math.min(6, Math.floor(totalUpgradeLevel / 4));

  elements.dayLabel.textContent = `DAY ${String(state.day).padStart(2, '0')}`;
  elements.metricCompleted.textContent = formatCoins(state.stats.jobsCompleted);
  elements.metricCollection.textContent = `${progress.discovered}/${progress.total}`;
  elements.metricUpgrades.textContent = `${totalUpgradeLevel}`;
  elements.miniLevels.innerHTML = Array.from(
    { length: 6 },
    (_, index) => `<i class="${index < displayLevel ? 'active' : ''}" style="height:${9 + index * 6}px"></i>`,
  ).join('');

  const recent = state.recentFinds[0];
  if (!recent) {
    elements.recentCard.className = 'recent-card empty-state';
    elements.recentCard.innerHTML = '<span>아직 복구 기록이 없습니다.<br />첫 번째 금고를 열어 기록을 시작하세요.</span>';
    return;
  }

  const item = getItemById(recent.itemId);
  const rarity = RARITIES[item.rarity];
  elements.recentCard.className = 'recent-card';
  elements.recentCard.innerHTML = `
    <div class="recent-icon" data-rarity="${item.rarity}">${item.icon}</div>
    <div class="recent-copy">
      <span>DAY ${recent.day} · ${rarity.label} · ${recent.grade} 등급</span>
      <strong>${item.name}</strong>
    </div>
    <b class="recent-value">₩ ${formatCoins(recent.value)}</b>
  `;
}

function renderJobs() {
  elements.jobsDayStamp.textContent = `DAY ${String(state.day).padStart(2, '0')}`;
  elements.jobsList.innerHTML = JOBS.map((job) => {
    const availability = canStartJob(state, job);
    const reputationLocked = state.reputation < job.unlockReputation;
    const coinLocked = !reputationLocked && state.coins < job.entryFee;
    const expected = job.baseReward + 120 * job.difficulty;
    let actionLabel = '현장 투입';
    if (reputationLocked) actionLabel = `평판 ${job.unlockReputation} 필요`;
    else if (coinLocked) actionLabel = `투입 비용 ${formatCoins(job.entryFee)} 부족`;

    return `
      <article class="job-card ${availability.ok ? '' : 'locked'}" data-accent="${job.accent}">
        <div class="job-card-head">
          <span class="job-number">${String(job.order).padStart(2, '0')}</span>
          <div class="job-main-copy">
            <span>${job.client}</span>
            <h2>${job.name}</h2>
          </div>
          <div class="difficulty-badge" aria-label="난이도 ${job.difficulty}">
            ${Array.from({ length: 4 }, (_, index) => `<i class="${index < job.difficulty ? 'active' : ''}"></i>`).join('')}
          </div>
        </div>
        <p class="job-briefing">${job.briefing}</p>
        ${reputationLocked ? `<div class="job-lock-strip"><span>보안 등급 잠김</span><b>★ ${job.unlockReputation - state.reputation} 부족</b></div>` : ''}
        <div class="job-meta">
          <div><span>제한 시간</span><strong>${job.timeLimit}초</strong></div>
          <div><span>투입 비용</span><strong class="coin-value">${job.entryFee === 0 ? '무료' : `₩ ${formatCoins(job.entryFee)}`}</strong></div>
          <div><span>예상 수익</span><strong>₩ ${formatCoins(expected)}+</strong></div>
        </div>
        <button class="job-start-button" type="button" data-job-id="${job.id}" ${reputationLocked ? 'disabled' : ''}>
          ${actionLabel}
        </button>
      </article>
    `;
  }).join('');
}

function upgradeEffectText(id, level) {
  switch (id) {
    case 'drill':
      return `압력 제어 +${level * 6}% · 해체 속도 +${level * 13}%`;
    case 'coolant':
      return `열 발생 -${level * 8}% · 냉각 속도 +${level * 18}%`;
    case 'muffler':
      return `소음 발생 -${level * 8}% · 소음 회복 +${level * 17}%`;
    case 'scanner':
      return `희귀 발견 보정 +${level * 12}%`;
    default:
      return '';
  }
}

function renderUpgrades() {
  elements.upgradeBalance.textContent = formatCoins(state.coins);
  elements.upgradeList.innerHTML = Object.values(UPGRADE_DEFINITIONS).map((definition) => {
    const level = state.upgrades[definition.id];
    const isMax = level >= definition.maxLevel;
    const cost = getUpgradeCost(definition.id, level);
    const affordable = isMax || state.coins >= cost;

    return `
      <article class="upgrade-card">
        <div class="upgrade-icon" aria-hidden="true">${definition.icon}</div>
        <div class="upgrade-body">
          <div class="upgrade-title-row">
            <h2>${definition.name}</h2>
            <span class="upgrade-level">LV.${level} / ${definition.maxLevel}</span>
          </div>
          <p>${definition.description}</p>
          <div class="level-track" aria-label="${definition.name} 레벨 ${level}">
            ${Array.from({ length: definition.maxLevel }, (_, index) => `<i class="${index < level ? 'active' : ''}"></i>`).join('')}
          </div>
          <div class="upgrade-footer">
            <span class="upgrade-effect">${level === 0 ? '기본 장비' : upgradeEffectText(definition.id, level)}</span>
            <button class="upgrade-buy-button ${affordable ? '' : 'unaffordable'}" type="button" data-upgrade-id="${definition.id}" ${isMax ? 'disabled' : ''}>
              ${isMax ? '최대 강화' : `₩ ${formatCoins(cost)}`}
            </button>
          </div>
        </div>
      </article>
    `;
  }).join('');
}

function renderCollection() {
  const progress = getCollectionProgress(state);
  const legendaryFound = ITEMS.filter(
    (item) => item.rarity === 'legendary' && state.collection[item.id],
  ).length;

  elements.collectionPercent.textContent = `${progress.percentage}%`;
  elements.collectionDiscovered.textContent = progress.discovered;
  elements.collectionTotal.textContent = progress.total;
  elements.collectionLegendary.textContent = legendaryFound;
  elements.collectionRing.style.setProperty('--progress', `${progress.percentage * 3.6}deg`);

  elements.collectionGrid.innerHTML = ITEMS.map((item, index) => {
    const record = state.collection[item.id];
    const rarity = RARITIES[item.rarity];
    if (!record) {
      return `
        <article class="archive-card locked" data-rarity="${item.rarity}">
          <div class="archive-rarity"><span>ARCHIVE ${String(index + 1).padStart(2, '0')}</span><b>${rarity.label}</b></div>
          <div class="archive-icon">?</div>
          <h3>미발견 기록</h3>
          <p>해당 물품과 연결된 금고를 복구하면 사연이 공개됩니다.</p>
        </article>
      `;
    }

    return `
      <article class="archive-card" data-rarity="${item.rarity}">
        <div class="archive-rarity"><span>ARCHIVE ${String(index + 1).padStart(2, '0')}</span><b>${rarity.label}</b></div>
        <div class="archive-icon">${item.icon}</div>
        <h3>${item.name}</h3>
        <p>${item.story}</p>
        <span class="archive-value">최고 감정가 ₩ ${formatCoins(record.bestValue)} · ${record.count}회</span>
      </article>
    `;
  }).join('');
}

function renderAll() {
  updateResourceHeader();
  renderHome();
  renderJobs();
  renderUpgrades();
  renderCollection();
  applySettings();
}

function showScreen(screenName) {
  currentScreen = screenName;
  $$('.screen').forEach((screen) => {
    screen.classList.toggle('active', screen.dataset.screen === screenName);
  });

  const immersive = screenName === 'play' || screenName === 'result';
  elements.header.classList.toggle('hidden-for-play', immersive);
  elements.bottomNav.classList.toggle('hidden-for-play', immersive);
  $$('[data-nav]', elements.bottomNav).forEach((button) => {
    button.classList.toggle('active', button.dataset.nav === screenName);
  });

  if (!immersive) renderAll();
  window.scrollTo({ top: 0, behavior: state.settings.reducedMotion ? 'auto' : 'smooth' });
}

function openConfirm({ title, message, actionLabel, onConfirm }) {
  elements.confirmTitle.textContent = title;
  elements.confirmMessage.textContent = message;
  elements.confirmActionButton.textContent = actionLabel;
  confirmAction = onConfirm;
  elements.confirmModal.hidden = false;
}

function closeConfirm() {
  elements.confirmModal.hidden = true;
  confirmAction = null;
}

function createSceneParticle() {
  if (state.settings.reducedMotion || !run || currentScreen !== 'play') return;
  const particle = document.createElement('i');
  particle.style.left = `${10 + Math.random() * 80}%`;
  particle.style.top = `${35 + Math.random() * 45}%`;
  particle.style.setProperty('--drift', `${-20 + Math.random() * 40}px`);
  particle.style.setProperty('--duration', `${2.6 + Math.random() * 2.6}s`);
  elements.sceneParticles.append(particle);
  setTimeout(() => particle.remove(), 5600);
}

function setHeld(nextHeld) {
  if (!run || run.status !== 'running' || gamePaused) return;
  held = nextHeld;
  elements.holdButton.classList.toggle('pressed', held);
}

function resetPlayVisuals() {
  elements.sceneParticles.innerHTML = '';
  elements.vaultMachine.className = 'vault-machine';
  elements.playConsole.classList.remove('flash-warning');
  elements.holdButton.classList.remove('pressed');
  elements.timerBox.classList.remove('danger');
  $$('.stage-dot').forEach((dot, index) => dot.classList.toggle('active', index === 0));
}

function startJob(jobId) {
  const job = getJobById(jobId);
  if (!job) return;

  const payment = payJobEntry(state, job);
  if (!payment.ok) {
    if (payment.reason === 'reputation') {
      showToast(`평판 ${payment.required}이 필요합니다.`, 'error');
    } else {
      showToast(`투입 비용 ₩ ${formatCoins(payment.required)}이 필요합니다.`, 'error');
    }
    playSound('strain');
    return;
  }

  state = payment.state;
  persist();
  selectedJob = job;
  run = createRun(job, state);
  currentFind = null;
  settlementLocked = false;
  held = false;
  gamePaused = !state.tutorialSeen;
  lastAlarmCount = 0;
  particleAccumulator = 0;
  resetPlayVisuals();

  elements.playEnvironment.className = `play-environment environment-${job.environment}`;
  elements.playClient.textContent = job.client;
  elements.playJobName.textContent = job.name;
  showScreen('play');
  renderPlay();

  if (!state.tutorialSeen) {
    elements.tutorialModal.hidden = false;
  } else {
    beginGameLoop();
  }
}

function beginGameLoop() {
  cancelAnimationFrame(frameRequest);
  gamePaused = false;
  lastFrameTime = performance.now();
  frameRequest = requestAnimationFrame(gameFrame);
}

function stopGameLoop() {
  cancelAnimationFrame(frameRequest);
  frameRequest = null;
  held = false;
  elements.holdButton.classList.remove('pressed');
}

function gameFrame(timestamp) {
  if (!run || run.status !== 'running' || gamePaused) return;
  const delta = Math.min(0.08, Math.max(0, (timestamp - lastFrameTime) / 1000));
  lastFrameTime = timestamp;
  const previous = run;
  run = stepRun(run, { held }, delta, selectedJob, state);

  handleRunFeedback(previous, run, timestamp);
  renderPlay();

  particleAccumulator += delta;
  if (held && particleAccumulator > 0.25) {
    particleAccumulator = 0;
    createSceneParticle();
  }

  if (run.status === 'running') {
    frameRequest = requestAnimationFrame(gameFrame);
  } else {
    finishRun();
  }
}

function handleRunFeedback(previous, next, timestamp) {
  if (next.alarmStrikes > lastAlarmCount) {
    lastAlarmCount = next.alarmStrikes;
    playSound('alarm');
    vibrate([35, 25, 70]);
    return;
  }

  if (next.stage > previous.stage) {
    playSound('upgrade');
    vibrate(18);
  }

  if (timestamp - lastFeedbackAt < 190) return;
  if (held && next.event === 'perfect') {
    playSound('perfect');
    lastFeedbackAt = timestamp;
  } else if (held && next.event === 'strain') {
    playSound('strain');
    vibrate(8);
    lastFeedbackAt = timestamp;
  }
}

function formatTimer(seconds) {
  const safe = Math.max(0, Math.ceil(seconds));
  const minutes = Math.floor(safe / 60);
  const remainder = safe % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
}

function runMessage(activeRun) {
  if (!activeRun) return '';
  switch (activeRun.event) {
    case 'perfect':
      return '완벽한 압력입니다 · 해체 속도 상승';
    case 'steady':
      return '안전 구간 유지 중';
    case 'weak':
      return '압력이 낮습니다 · 조금 더 눌러주세요';
    case 'strain':
      return '압력 과다 · 즉시 손을 떼세요';
    case 'cooling':
      return '냉각 및 소음 회복 중';
    case 'alarm':
      return `보안 경보 ${activeRun.alarmStrikes}/3 · 소음을 낮추세요`;
    case 'ready':
    default:
      return '버튼을 누르고 압력을 올리세요';
  }
}

function renderPlay() {
  if (!run) return;
  const targetLeft = Math.max(0, run.targetCenter - run.target.width / 2);
  const isStraining = held && run.event === 'strain';
  const isPerfect = held && (run.event === 'perfect' || run.event === 'steady');

  elements.playTimer.textContent = formatTimer(run.timeRemaining);
  elements.timerBox.classList.toggle('danger', run.timeRemaining <= 9);
  elements.playStage.textContent = String(run.stage).padStart(2, '0');
  elements.playMessage.textContent = runMessage(run);
  elements.playProgress.textContent = `${Math.floor(run.progress)}%`;
  elements.progressOrbit.style.setProperty('--progress', `${run.progress * 3.6}deg`);

  elements.targetZone.style.left = `${targetLeft}%`;
  elements.targetZone.style.width = `${run.target.width}%`;
  elements.pressureFill.style.width = `${run.pressure}%`;
  elements.pressureNeedle.style.left = `${run.pressure}%`;

  elements.integrityValue.textContent = `${Math.round(run.integrity)}%`;
  elements.integrityBar.style.width = `${run.integrity}%`;
  elements.heatValue.textContent = `${Math.round(run.heat)}%`;
  elements.heatBar.style.width = `${run.heat}%`;
  elements.noiseValue.textContent = `${Math.round(run.noise)}%`;
  elements.noiseBar.style.width = `${run.noise}%`;

  const integrityMeter = elements.integrityBar.closest('.system-meter');
  const heatMeter = elements.heatBar.closest('.system-meter');
  const noiseMeter = elements.noiseBar.closest('.system-meter');
  integrityMeter.classList.toggle('danger', run.integrity < 38);
  heatMeter.classList.toggle('danger', run.heat > 78);
  noiseMeter.classList.toggle('danger', run.noise > 82);

  elements.vaultMachine.classList.toggle('drilling', held);
  elements.vaultMachine.classList.toggle('straining', isStraining && !state.settings.reducedMotion);
  elements.vaultMachine.classList.toggle('perfect', isPerfect);
  elements.playConsole.classList.toggle('flash-warning', run.warningFlash > 0);
  elements.holdButton.classList.toggle('pressed', held);

  $$('.stage-dot').forEach((dot, index) => {
    dot.classList.toggle('active', index + 1 <= run.stage);
  });
}

function finishRun() {
  stopGameLoop();
  if (!run || !selectedJob) return;

  if (run.status === 'success') {
    currentFind = rollLoot(selectedJob, state, run);
    renderSuccessResult();
    playSound('success');
    vibrate([25, 35, 90]);
  } else {
    state = settleFailure(state, run).state;
    persist();
    renderFailureResult();
    playSound('fail');
    vibrate([70, 40, 70]);
  }
}

function renderSuccessResult() {
  const item = getItemById(currentFind.itemId);
  const rarity = RARITIES[item.rarity];
  const itemIndex = ITEMS.findIndex((candidate) => candidate.id === item.id) + 1;
  const returnPreview = settleSuccess(state, selectedJob, currentFind, 'return');
  const auctionPreview = settleSuccess(state, selectedJob, currentFind, 'auction');

  elements.successResult.hidden = false;
  elements.failureResult.hidden = true;
  elements.settlementResult.hidden = true;
  elements.resultGrade.textContent = currentFind.grade;
  elements.resultSubtitle.textContent = currentFind.grade === 'S'
    ? '완벽한 상태로 잠금축을 해체했습니다. 희귀 물품 탐색 보정이 적용됐습니다.'
    : '내용물 상태를 유지한 채 잠금축을 모두 해체했습니다.';
  elements.resultItemCard.dataset.rarity = item.rarity;
  elements.resultRarity.textContent = rarity.label;
  elements.resultIcon.textContent = item.icon;
  elements.resultCode.textContent = `ARCHIVE ${String(itemIndex).padStart(2, '0')}`;
  elements.resultItemName.textContent = item.name;
  elements.resultStory.textContent = item.story;
  elements.resultValue.textContent = formatCoins(currentFind.appraisedValue);
  elements.resultCondition.textContent = `${currentFind.condition}%`;
  elements.resultConditionBar.style.width = `${currentFind.condition}%`;
  elements.returnReward.textContent = `₩ ${formatCoins(returnPreview.payout)} · ★ +${returnPreview.reputationGained}`;
  elements.auctionReward.textContent = `₩ ${formatCoins(auctionPreview.payout)} · ★ +${auctionPreview.reputationGained}`;
  elements.returnItemButton.disabled = false;
  elements.auctionItemButton.disabled = false;
  showScreen('result');
  setTimeout(() => playSound('reveal'), 330);
}

function failureCopy(reason) {
  switch (reason) {
    case 'integrity':
      return {
        title: '내용물 보호 한계를 넘었습니다.',
        description: '압력이 안전 구간을 넘은 시간이 길었습니다. 손을 떼어 열을 낮춘 뒤 다시 시도하세요.',
      };
    case 'timeout':
      return {
        title: '봉인 재잠금 시간이 끝났습니다.',
        description: '낮은 압력에서는 진행이 거의 오르지 않습니다. 초록색 구간을 더 오래 유지하세요.',
      };
    case 'alarm':
      return {
        title: '비상 셔터가 내려왔습니다.',
        description: '소음 경보가 세 번 발생했습니다. 방진 흡음재를 강화하거나 중간에 손을 떼어 소음을 회복하세요.',
      };
    case 'abort':
      return {
        title: '현장 작업을 포기했습니다.',
        description: '투입 비용은 소모됐지만 장비와 발견 기록은 그대로 유지됩니다.',
      };
    default:
      return {
        title: '작업이 중단됐습니다.',
        description: '장비를 점검한 뒤 다시 시도하세요.',
      };
  }
}

function renderFailureResult() {
  const copy = failureCopy(run.failReason);
  elements.successResult.hidden = true;
  elements.failureResult.hidden = false;
  elements.settlementResult.hidden = true;
  elements.failureTitle.textContent = copy.title;
  elements.failureDescription.textContent = copy.description;
  elements.failureProgress.textContent = `${Math.round(run.progress)}%`;
  elements.failureIntegrity.textContent = `${Math.round(run.integrity)}%`;
  elements.failureAlarms.textContent = `${run.alarmStrikes}`;
  showScreen('result');
}

function settleCurrentFind(choice) {
  if (settlementLocked || !currentFind || !selectedJob) return;
  settlementLocked = true;
  elements.returnItemButton.disabled = true;
  elements.auctionItemButton.disabled = true;

  const result = settleSuccess(state, selectedJob, currentFind, choice);
  state = result.state;
  persist();
  elements.successResult.hidden = true;
  elements.failureResult.hidden = true;
  elements.settlementResult.hidden = false;
  elements.settlementHeading.textContent = choice === 'return' ? '반환 절차가 완료됐습니다.' : '경매 낙찰이 완료됐습니다.';
  elements.settlementCoins.textContent = `+${formatCoins(result.payout)}`;
  elements.settlementReputation.textContent = `+${formatCoins(result.reputationGained)}`;
  playSound(choice === 'return' ? 'success' : 'upgrade');
  renderAll();
}

function handleUpgradePurchase(upgradeId) {
  const result = purchaseUpgrade(state, upgradeId);
  if (!result.ok) {
    if (result.reason === 'insufficient-coins') showToast('코인이 부족합니다.', 'error');
    else if (result.reason === 'max-level') showToast('이미 최대 레벨입니다.');
    playSound('strain');
    return;
  }
  state = result.state;
  persist();
  renderAll();
  playSound('upgrade');
  vibrate(18);
  showToast(`${UPGRADE_DEFINITIONS[upgradeId].name} LV.${state.upgrades[upgradeId]} 강화 완료`);
}

function abandonCurrentJob() {
  if (!run || run.status !== 'running') return;
  run = { ...run, status: 'failed', failReason: 'abort', event: 'aborted' };
  finishRun();
}

function bindNavigation() {
  document.addEventListener('click', (event) => {
    const navButton = event.target.closest('[data-nav]');
    if (!navButton) return;
    const target = navButton.dataset.nav;
    if (!target) return;
    playSound('tap');
    showScreen(target);
  });

  elements.brandHomeButton.addEventListener('click', () => {
    playSound('tap');
    showScreen('home');
  });
  elements.goJobsButton.addEventListener('click', () => {
    playSound('tap');
    showScreen('jobs');
  });
}

function bindJobsAndUpgrades() {
  elements.jobsList.addEventListener('click', (event) => {
    const button = event.target.closest('[data-job-id]');
    if (!button) return;
    playSound('tap');
    startJob(button.dataset.jobId);
  });

  elements.upgradeList.addEventListener('click', (event) => {
    const button = event.target.closest('[data-upgrade-id]');
    if (!button) return;
    handleUpgradePurchase(button.dataset.upgradeId);
  });
}

function bindGameControls() {
  const press = (event) => {
    event.preventDefault();
    if (event.currentTarget.setPointerCapture && event.pointerId !== undefined) {
      try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* ignored */ }
    }
    setHeld(true);
  };
  const release = (event) => {
    event?.preventDefault?.();
    setHeld(false);
  };

  elements.holdButton.addEventListener('pointerdown', press);
  elements.holdButton.addEventListener('pointerup', release);
  elements.holdButton.addEventListener('pointercancel', release);
  elements.holdButton.addEventListener('pointerleave', (event) => {
    if (event.buttons === 0) release(event);
  });
  elements.holdButton.addEventListener('contextmenu', (event) => event.preventDefault());

  elements.vaultWorkArea.addEventListener('pointerdown', (event) => {
    if (event.target.closest('button')) return;
    press(event);
  });
  elements.vaultWorkArea.addEventListener('pointerup', release);
  elements.vaultWorkArea.addEventListener('pointercancel', release);

  window.addEventListener('pointerup', () => setHeld(false));
  window.addEventListener('blur', () => setHeld(false));
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) setHeld(false);
  });

  document.addEventListener('keydown', (event) => {
    if (event.code !== 'Space' || event.repeat || currentScreen !== 'play') return;
    if (elements.tutorialModal.hidden === false || elements.confirmModal.hidden === false) return;
    event.preventDefault();
    setHeld(true);
  });
  document.addEventListener('keyup', (event) => {
    if (event.code !== 'Space') return;
    event.preventDefault();
    setHeld(false);
  });

  elements.abortJobButton.addEventListener('click', () => {
    setHeld(false);
    gamePaused = true;
    openConfirm({
      title: '작업을 포기할까요?',
      message: '투입 비용은 반환되지 않으며 오늘 작업은 실패로 기록됩니다.',
      actionLabel: '작업 포기',
      onConfirm: abandonCurrentJob,
    });
  });
}

function bindResults() {
  elements.returnItemButton.addEventListener('click', () => settleCurrentFind('return'));
  elements.auctionItemButton.addEventListener('click', () => settleCurrentFind('auction'));
  elements.retryJobButton.addEventListener('click', () => {
    if (!selectedJob) return showScreen('jobs');
    startJob(selectedJob.id);
  });
  elements.settlementHomeButton.addEventListener('click', () => {
    selectedJob = null;
    run = null;
    currentFind = null;
    showScreen('home');
  });
}

function bindModals() {
  elements.tutorialStartButton.addEventListener('click', () => {
    elements.tutorialModal.hidden = true;
    state = markTutorialSeen(state);
    persist();
    playSound('tap');
    beginGameLoop();
  });

  elements.settingsButton.addEventListener('click', () => {
    applySettings();
    elements.settingsModal.hidden = false;
    playSound('tap');
  });
  elements.settingsCloseButton.addEventListener('click', () => {
    elements.settingsModal.hidden = true;
    playSound('tap');
  });

  elements.soundToggle.addEventListener('change', () => {
    state = updateSettings(state, { sound: elements.soundToggle.checked });
    persist();
    applySettings();
    playSound('tap');
  });
  elements.motionToggle.addEventListener('change', () => {
    state = updateSettings(state, { reducedMotion: elements.motionToggle.checked });
    persist();
    applySettings();
  });

  elements.resetSaveButton.addEventListener('click', () => {
    elements.settingsModal.hidden = true;
    openConfirm({
      title: '모든 기록을 초기화할까요?',
      message: '코인, 장비, 평판과 발견물 기록이 모두 삭제됩니다. 이 작업은 되돌릴 수 없습니다.',
      actionLabel: '전체 초기화',
      onConfirm: () => {
        clearState();
        state = createInitialState();
        selectedJob = null;
        run = null;
        currentFind = null;
        persist();
        renderAll();
        showScreen('home');
        showToast('새 작업실로 초기화했습니다.');
      },
    });
  });

  elements.confirmCancelButton.addEventListener('click', () => {
    const shouldResume = currentScreen === 'play' && run?.status === 'running';
    closeConfirm();
    if (shouldResume) beginGameLoop();
  });
  elements.confirmActionButton.addEventListener('click', () => {
    const action = confirmAction;
    closeConfirm();
    action?.();
  });

  for (const modal of [elements.settingsModal, elements.confirmModal]) {
    modal.addEventListener('click', (event) => {
      if (event.target !== modal) return;
      if (modal === elements.confirmModal && currentScreen === 'play') return;
      modal.hidden = true;
    });
  }
}

function registerServiceWorker() {
  if (!('serviceWorker' in navigator) || location.protocol === 'file:') return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}

function init() {
  bindNavigation();
  bindJobsAndUpgrades();
  bindGameControls();
  bindResults();
  bindModals();
  applySettings();
  renderAll();
  showScreen('home');
  registerServiceWorker();
}

init();
