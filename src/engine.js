import {
  ITEMS,
  RARITIES,
  SAVE_VERSION,
  UPGRADE_DEFINITIONS,
} from './data.js';

export function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

export function createInitialState() {
  return {
    version: SAVE_VERSION,
    coins: 260,
    reputation: 0,
    day: 1,
    upgrades: {
      drill: 0,
      coolant: 0,
      muffler: 0,
      scanner: 0,
    },
    collection: {},
    recentFinds: [],
    stats: {
      jobsCompleted: 0,
      jobsFailed: 0,
      totalEarned: 0,
      itemsRecovered: 0,
      bestGrade: '-',
      alarmsTriggered: 0,
    },
    settings: {
      sound: true,
      reducedMotion: false,
    },
    tutorialSeen: false,
  };
}

function finiteNumber(value, fallback) {
  return Number.isFinite(value) ? value : fallback;
}

export function normalizeState(candidate) {
  const initial = createInitialState();
  if (!candidate || typeof candidate !== 'object') return initial;

  const upgrades = Object.fromEntries(
    Object.entries(UPGRADE_DEFINITIONS).map(([key, definition]) => {
      const rawLevel = candidate.upgrades?.[key];
      return [key, clamp(Math.floor(finiteNumber(rawLevel, 0)), 0, definition.maxLevel)];
    }),
  );

  const collection = {};
  if (candidate.collection && typeof candidate.collection === 'object') {
    for (const item of ITEMS) {
      const record = candidate.collection[item.id];
      if (!record || typeof record !== 'object') continue;
      collection[item.id] = {
        count: Math.max(1, Math.floor(finiteNumber(record.count, 1))),
        bestValue: Math.max(0, Math.floor(finiteNumber(record.bestValue, 0))),
        firstFoundDay: Math.max(1, Math.floor(finiteNumber(record.firstFoundDay, 1))),
      };
    }
  }

  return {
    ...initial,
    version: SAVE_VERSION,
    coins: Math.max(0, Math.floor(finiteNumber(candidate.coins, initial.coins))),
    reputation: Math.max(0, Math.floor(finiteNumber(candidate.reputation, initial.reputation))),
    day: Math.max(1, Math.floor(finiteNumber(candidate.day, initial.day))),
    upgrades,
    collection,
    recentFinds: Array.isArray(candidate.recentFinds)
      ? candidate.recentFinds
          .filter((entry) => entry && ITEMS.some((item) => item.id === entry.itemId))
          .slice(0, 8)
      : [],
    stats: {
      jobsCompleted: Math.max(0, Math.floor(finiteNumber(candidate.stats?.jobsCompleted, 0))),
      jobsFailed: Math.max(0, Math.floor(finiteNumber(candidate.stats?.jobsFailed, 0))),
      totalEarned: Math.max(0, Math.floor(finiteNumber(candidate.stats?.totalEarned, 0))),
      itemsRecovered: Math.max(0, Math.floor(finiteNumber(candidate.stats?.itemsRecovered, 0))),
      bestGrade: typeof candidate.stats?.bestGrade === 'string' ? candidate.stats.bestGrade : '-',
      alarmsTriggered: Math.max(0, Math.floor(finiteNumber(candidate.stats?.alarmsTriggered, 0))),
    },
    settings: {
      sound: candidate.settings?.sound !== false,
      reducedMotion: candidate.settings?.reducedMotion === true,
    },
    tutorialSeen: candidate.tutorialSeen === true,
  };
}

export function getUpgradeCost(upgradeId, level) {
  const definition = UPGRADE_DEFINITIONS[upgradeId];
  if (!definition) return Infinity;
  if (level >= definition.maxLevel) return 0;
  return Math.round((definition.baseCost * definition.growth ** level) / 10) * 10;
}

export function getEquipmentStats(state) {
  const drill = state.upgrades.drill;
  const coolant = state.upgrades.coolant;
  const muffler = state.upgrades.muffler;
  const scanner = state.upgrades.scanner;

  return {
    drill,
    coolant,
    muffler,
    scanner,
    pressureRise: Math.max(29, 50 - drill * 2.55),
    pressureFall: 31 + drill * 1.7,
    progressRate: 11.4 + drill * 1.45,
    zoneBonus: drill * 1.15,
    heatGainMultiplier: Math.max(0.47, 1 - coolant * 0.085),
    coolingRate: 17 + coolant * 3.25,
    noiseGainMultiplier: Math.max(0.48, 1 - muffler * 0.082),
    noiseRecoveryRate: 12 + muffler * 2.55,
    rarityBoost: scanner * 1.15,
  };
}

export function purchaseUpgrade(state, upgradeId) {
  const definition = UPGRADE_DEFINITIONS[upgradeId];
  if (!definition) return { ok: false, reason: 'unknown-upgrade', state };

  const level = state.upgrades[upgradeId];
  if (level >= definition.maxLevel) return { ok: false, reason: 'max-level', state };

  const cost = getUpgradeCost(upgradeId, level);
  if (state.coins < cost) return { ok: false, reason: 'insufficient-coins', state };

  return {
    ok: true,
    cost,
    state: {
      ...state,
      coins: state.coins - cost,
      upgrades: {
        ...state.upgrades,
        [upgradeId]: level + 1,
      },
    },
  };
}

export function canStartJob(state, job) {
  if (state.reputation < job.unlockReputation) {
    return { ok: false, reason: 'reputation', required: job.unlockReputation };
  }
  if (state.coins < job.entryFee) {
    return { ok: false, reason: 'entry-fee', required: job.entryFee };
  }
  return { ok: true };
}

export function payJobEntry(state, job) {
  const availability = canStartJob(state, job);
  if (!availability.ok) return { ...availability, state };
  return {
    ok: true,
    state: {
      ...state,
      coins: state.coins - job.entryFee,
    },
  };
}

function createTarget(job, equipment, random) {
  const difficulty = job.difficulty;
  const width = clamp(28.5 - difficulty * 2.75 + equipment.zoneBonus, 13, 31);
  const edge = width / 2 + 5;
  return {
    width,
    base: edge + random() * (100 - edge * 2),
    amplitude: 7 + difficulty * 1.7 + random() * 3.2,
    speed: 0.66 + difficulty * 0.145 + random() * 0.12,
    phase: random() * Math.PI * 2,
  };
}

export function createRun(job, state, random = Math.random) {
  const equipment = getEquipmentStats(state);
  const target = createTarget(job, equipment, random);

  return {
    jobId: job.id,
    status: 'running',
    failReason: null,
    elapsed: 0,
    timeRemaining: job.timeLimit + equipment.drill * 0.35,
    pressure: 0,
    progress: 0,
    heat: 0,
    noise: 0,
    integrity: 100,
    stage: 1,
    target,
    targetCenter: target.base,
    inTarget: false,
    relation: 'below',
    perfectSeconds: 0,
    heldSeconds: 0,
    currentStreak: 0,
    maxStreak: 0,
    alarmStrikes: 0,
    alarmCooldown: 0,
    stageFlash: 0,
    warningFlash: 0,
    event: 'ready',
  };
}

function moveTarget(run) {
  const edge = run.target.width / 2 + 4;
  const raw = run.target.base
    + Math.sin(run.elapsed * run.target.speed + run.target.phase) * run.target.amplitude;
  return clamp(raw, edge, 100 - edge);
}

function refreshTarget(run, job, equipment, random) {
  run.target = createTarget(job, equipment, random);
  run.targetCenter = moveTarget(run);
  run.stageFlash = 1;
}

export function stepRun(run, input, deltaSeconds, job, state, random = Math.random) {
  if (run.status !== 'running') return run;

  const equipment = getEquipmentStats(state);
  const next = {
    ...run,
    target: { ...run.target },
  };
  const dt = clamp(finiteNumber(deltaSeconds, 0), 0, 0.08);
  const held = input?.held === true;

  next.elapsed += dt;
  next.timeRemaining = Math.max(0, next.timeRemaining - dt);
  next.alarmCooldown = Math.max(0, next.alarmCooldown - dt);
  next.stageFlash = Math.max(0, next.stageFlash - dt * 2.4);
  next.warningFlash = Math.max(0, next.warningFlash - dt * 3.2);

  const pressureChange = held ? equipment.pressureRise : -equipment.pressureFall;
  next.pressure = clamp(next.pressure + pressureChange * dt, 0, 100);
  next.targetCenter = moveTarget(next);

  const halfZone = next.target.width / 2;
  const minimum = next.targetCenter - halfZone;
  const maximum = next.targetCenter + halfZone;
  next.inTarget = next.pressure >= minimum && next.pressure <= maximum;
  next.relation = next.pressure < minimum ? 'below' : next.pressure > maximum ? 'above' : 'inside';

  if (held) {
    next.heldSeconds += dt;
    const difficultyDrag = 1 - (job.difficulty - 1) * 0.035;

    if (next.inTarget) {
      const centerDistance = Math.abs(next.pressure - next.targetCenter) / Math.max(1, halfZone);
      const precision = 1.14 - centerDistance * 0.22;
      next.progress += equipment.progressRate * difficultyDrag * precision * dt;
      next.perfectSeconds += dt;
      next.currentStreak += dt;
      next.maxStreak = Math.max(next.maxStreak, next.currentStreak);
      next.heat += 8.5 * equipment.heatGainMultiplier * dt;
      next.noise += 5.8 * equipment.noiseGainMultiplier * dt;
      next.event = centerDistance < 0.24 ? 'perfect' : 'steady';
    } else if (next.relation === 'below') {
      next.progress += equipment.progressRate * 0.12 * dt;
      next.currentStreak = Math.max(0, next.currentStreak - dt * 1.8);
      next.heat += 11.8 * equipment.heatGainMultiplier * dt;
      next.noise += 7.4 * equipment.noiseGainMultiplier * dt;
      next.event = 'weak';
    } else {
      const overshoot = (next.pressure - maximum) / Math.max(1, 100 - maximum);
      next.progress += equipment.progressRate * 0.075 * dt;
      next.currentStreak = 0;
      next.integrity -= (5.2 + job.difficulty * 1.65 + overshoot * 7.5) * dt;
      next.heat += (17 + overshoot * 8) * equipment.heatGainMultiplier * dt;
      next.noise += (13.8 + overshoot * 8) * equipment.noiseGainMultiplier * dt;
      next.warningFlash = Math.max(next.warningFlash, 0.35);
      next.event = 'strain';
    }
  } else {
    next.currentStreak = Math.max(0, next.currentStreak - dt * 2.3);
    next.heat -= equipment.coolingRate * dt;
    next.noise -= equipment.noiseRecoveryRate * dt;
    next.event = next.heat > 32 ? 'cooling' : 'ready';
  }

  if (next.heat > 78) {
    next.integrity -= (next.heat - 78) * (0.055 + job.difficulty * 0.007) * dt;
    next.warningFlash = Math.max(next.warningFlash, 0.22);
  }

  if (next.noise >= 100 && next.alarmCooldown <= 0) {
    next.alarmStrikes += 1;
    next.noise = 58;
    next.integrity -= 12 + job.difficulty * 2.2;
    next.alarmCooldown = 1.25;
    next.warningFlash = 1;
    next.event = 'alarm';
  }

  next.progress = clamp(next.progress, 0, 100);
  next.heat = clamp(next.heat, 0, 100);
  next.noise = clamp(next.noise, 0, 100);
  next.integrity = clamp(next.integrity, 0, 100);

  const calculatedStage = Math.min(4, Math.floor(next.progress / 25) + 1);
  if (calculatedStage > next.stage) {
    next.stage = calculatedStage;
    refreshTarget(next, job, equipment, random);
    next.pressure = Math.min(next.pressure, next.targetCenter + next.target.width * 0.25);
  }

  if (next.progress >= 100) {
    next.status = 'success';
    next.progress = 100;
    next.event = 'opened';
  } else if (next.integrity <= 0) {
    next.status = 'failed';
    next.failReason = 'integrity';
    next.event = 'broken';
  } else if (next.timeRemaining <= 0) {
    next.status = 'failed';
    next.failReason = 'timeout';
    next.event = 'timeout';
  } else if (next.alarmStrikes >= 3) {
    next.status = 'failed';
    next.failReason = 'alarm';
    next.event = 'locked';
  }

  return next;
}

const GRADE_ORDER = ['D', 'C', 'B', 'A', 'S'];

export function calculateRunGrade(run) {
  if (run.status !== 'success') return 'D';
  const precisionRatio = run.heldSeconds > 0 ? run.perfectSeconds / run.heldSeconds : 0;
  const timeRatio = run.timeRemaining / Math.max(1, run.elapsed + run.timeRemaining);
  const score = run.integrity * 0.58 + precisionRatio * 28 + timeRatio * 14 - run.alarmStrikes * 6;
  if (score >= 90) return 'S';
  if (score >= 78) return 'A';
  if (score >= 64) return 'B';
  if (score >= 48) return 'C';
  return 'D';
}

function weightedPick(entries, random) {
  const total = entries.reduce((sum, entry) => sum + Math.max(0, entry.weight), 0);
  if (total <= 0) return entries[0]?.value ?? null;
  let cursor = random() * total;
  for (const entry of entries) {
    cursor -= Math.max(0, entry.weight);
    if (cursor <= 0) return entry.value;
  }
  return entries.at(-1)?.value ?? null;
}

export function getRarityWeights(job, scannerLevel, condition) {
  const conditionBoost = clamp((condition - 60) / 16, -1.5, 2.5);
  const scannerBoost = scannerLevel * 1.15;
  const difficultyBoost = Math.max(0, job.difficulty - 1);

  return {
    common: Math.max(22, RARITIES.common.weight - scannerBoost * 4.4 - difficultyBoost * 3.5 - conditionBoost * 1.8),
    uncommon: RARITIES.uncommon.weight + scannerBoost * 1.5 + difficultyBoost * 1.3,
    rare: RARITIES.rare.weight + scannerBoost * 1.55 + difficultyBoost * 1.7 + Math.max(0, conditionBoost) * 0.9,
    legendary: RARITIES.legendary.weight + scannerBoost * 0.48 + difficultyBoost * 0.42 + Math.max(0, conditionBoost) * 0.2,
  };
}

export function rollLoot(job, state, run, random = Math.random) {
  const grade = calculateRunGrade(run);
  const gradeBonus = { S: 12, A: 7, B: 3, C: 0, D: -8 }[grade] ?? 0;
  const condition = clamp(Math.round(run.integrity * 0.82 + gradeBonus + 12), 35, 100);
  const scannerLevel = state.upgrades.scanner;
  const weights = getRarityWeights(job, scannerLevel, condition);

  const rarity = weightedPick(
    Object.entries(weights).map(([value, weight]) => ({ value, weight })),
    random,
  );

  const taggedPool = ITEMS.filter(
    (item) => item.rarity === rarity && item.tags.some((tag) => job.lootTags.includes(tag)),
  );
  const fallbackPool = ITEMS.filter((item) => item.rarity === rarity);
  const pool = taggedPool.length > 0 ? taggedPool : fallbackPool;
  const item = pool[Math.min(pool.length - 1, Math.floor(random() * pool.length))];

  const conditionFactor = 0.68 + condition / 250;
  const difficultyFactor = 1 + (job.difficulty - 1) * 0.075;
  const marketFactor = 0.93 + random() * 0.15;
  const appraisedValue = Math.max(
    1,
    Math.round((item.baseValue * conditionFactor * difficultyFactor * marketFactor) / 5) * 5,
  );

  return {
    itemId: item.id,
    rarity: item.rarity,
    condition,
    grade,
    appraisedValue,
  };
}

function betterGrade(current, candidate) {
  const currentIndex = GRADE_ORDER.indexOf(current);
  const candidateIndex = GRADE_ORDER.indexOf(candidate);
  return candidateIndex > currentIndex ? candidate : current;
}

export function settleSuccess(state, job, find, choice) {
  const item = ITEMS.find((candidate) => candidate.id === find.itemId);
  if (!item) throw new Error(`Unknown item: ${find.itemId}`);

  const rarity = RARITIES[item.rarity];
  const isReturn = choice === 'return';
  const itemPayout = isReturn
    ? Math.round(find.appraisedValue * 0.34)
    : find.appraisedValue;
  const payout = job.baseReward + itemPayout;
  const reputationGained = isReturn
    ? 1 + job.difficulty + rarity.reputationBonus
    : Math.max(1, Math.floor(job.difficulty / 2));

  const previousRecord = state.collection[item.id];
  const collection = {
    ...state.collection,
    [item.id]: {
      count: (previousRecord?.count ?? 0) + 1,
      bestValue: Math.max(previousRecord?.bestValue ?? 0, find.appraisedValue),
      firstFoundDay: previousRecord?.firstFoundDay ?? state.day,
    },
  };

  const recentFinds = [
    {
      itemId: item.id,
      value: find.appraisedValue,
      grade: find.grade,
      day: state.day,
      choice: isReturn ? 'return' : 'auction',
    },
    ...state.recentFinds,
  ].slice(0, 8);

  return {
    payout,
    reputationGained,
    state: {
      ...state,
      coins: state.coins + payout,
      reputation: state.reputation + reputationGained,
      day: state.day + 1,
      collection,
      recentFinds,
      stats: {
        ...state.stats,
        jobsCompleted: state.stats.jobsCompleted + 1,
        totalEarned: state.stats.totalEarned + payout,
        itemsRecovered: state.stats.itemsRecovered + 1,
        bestGrade: betterGrade(state.stats.bestGrade, find.grade),
      },
    },
  };
}

export function settleFailure(state, run) {
  return {
    state: {
      ...state,
      day: state.day + 1,
      stats: {
        ...state.stats,
        jobsFailed: state.stats.jobsFailed + 1,
        alarmsTriggered: state.stats.alarmsTriggered + run.alarmStrikes,
      },
    },
  };
}

export function markTutorialSeen(state) {
  return {
    ...state,
    tutorialSeen: true,
  };
}

export function updateSettings(state, patch) {
  return {
    ...state,
    settings: {
      ...state.settings,
      ...patch,
    },
  };
}

export function getCollectionProgress(state) {
  const discovered = Object.keys(state.collection).length;
  return {
    discovered,
    total: ITEMS.length,
    percentage: Math.round((discovered / ITEMS.length) * 100),
  };
}
