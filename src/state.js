import {
  CASES,
  CREW,
  GAME_VERSION,
  ITEMS,
  LEGACY_KEYS,
  OBJECTIVE_POOL,
  RARITIES,
  SAVE_KEY,
  STAGES,
  UPGRADES,
  getCase,
  getCrew,
  getItem,
  getStage,
  getUpgrade,
} from './content.js';

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function hashString(value) {
  let hash = 2166136261;
  for (const char of String(value)) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function createRng(seedValue) {
  let seed = hashString(seedValue) || 1;
  return () => {
    seed += 0x6d2b79f5;
    let value = seed;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function finite(value, fallback = 0) {
  return Number.isFinite(value) ? value : fallback;
}

function baseUpgrades() {
  return Object.fromEntries(UPGRADES.map((upgrade) => [upgrade.id, 0]));
}

function baseBonds() {
  return Object.fromEntries(CREW.map((crew) => [crew.id, 0]));
}

function baseCases() {
  return Object.fromEntries(CASES.map((caseFile) => [caseFile.id, 0]));
}

export function shiftIdForDay(day) {
  return Math.floor((Math.max(1, day) - 1) / 3) + 1;
}

export function createObjectives(shiftId) {
  const first = ['complete-2', 'condition-85', 'return-1'];
  const selected = shiftId === 1
    ? first.map((id) => OBJECTIVE_POOL.find((objective) => objective.id === id))
    : (() => {
        const rng = createRng(`shift-${shiftId}`);
        const pool = [...OBJECTIVE_POOL];
        const output = [];
        while (output.length < 3 && pool.length) {
          const index = Math.floor(rng() * pool.length);
          output.push(pool.splice(index, 1)[0]);
        }
        return output;
      })();

  return selected.filter(Boolean).map((objective) => ({
    ...objective,
    progress: 0,
    complete: false,
    claimed: false,
  }));
}

export function createInitialState() {
  return {
    version: GAME_VERSION,
    day: 1,
    coins: 340,
    reputation: 0,
    intel: 0,
    selectedCrew: 'seojin',
    selectedStage: 'harbor-bank',
    upgrades: baseUpgrades(),
    bonds: baseBonds(),
    cases: baseCases(),
    collection: {},
    shift: {
      id: 1,
      objectives: createObjectives(1),
    },
    stats: {
      completed: 0,
      failed: 0,
      bestGrade: '-',
      streak: 0,
      bestStreak: 0,
      totalEarned: 0,
      perfectHacks: 0,
      rareFinds: 0,
      caught: 0,
    },
    settings: {
      sound: true,
      shake: true,
    },
    tutorial: {
      hub: false,
      field: false,
      vault: false,
    },
  };
}

function normalizeCollection(candidate) {
  const output = {};
  if (!candidate || typeof candidate !== 'object') return output;
  for (const item of ITEMS) {
    const record = candidate[item.id];
    if (!record) continue;
    output[item.id] = {
      count: Math.max(1, Math.floor(finite(record.count, 1))),
      bestValue: Math.max(0, Math.floor(finite(record.bestValue, 0))),
      archived: Math.max(0, Math.floor(finite(record.archived, record.archivedCount ?? 0))),
      firstDay: Math.max(1, Math.floor(finite(record.firstDay, record.firstFoundDay ?? 1))),
    };
  }
  return output;
}

function normalizeObjectives(candidate, day) {
  const expectedId = shiftIdForDay(day);
  const defaults = createObjectives(expectedId);
  if (!candidate || candidate.id !== expectedId || !Array.isArray(candidate.objectives)) {
    return { id: expectedId, objectives: defaults };
  }
  const saved = new Map(candidate.objectives.map((objective) => [objective.id, objective]));
  return {
    id: expectedId,
    objectives: defaults.map((objective) => {
      const record = saved.get(objective.id);
      const progress = clamp(finite(record?.progress, 0), 0, objective.target);
      const complete = record?.complete === true || progress >= objective.target;
      return { ...objective, progress, complete, claimed: record?.claimed === true || complete };
    }),
  };
}

export function normalizeState(candidate) {
  const initial = createInitialState();
  if (!candidate || typeof candidate !== 'object') return initial;
  const day = Math.max(1, Math.floor(finite(candidate.day, 1)));
  const upgrades = baseUpgrades();
  for (const upgrade of UPGRADES) {
    upgrades[upgrade.id] = clamp(Math.floor(finite(candidate.upgrades?.[upgrade.id], 0)), 0, upgrade.max);
  }
  const bonds = baseBonds();
  for (const crew of CREW) {
    bonds[crew.id] = Math.max(0, Math.floor(finite(candidate.bonds?.[crew.id], 0)));
  }
  const cases = baseCases();
  for (const caseFile of CASES) {
    const oldCase = candidate.caseProgress?.[caseFile.id]?.clues;
    cases[caseFile.id] = Math.max(0, Math.floor(finite(candidate.cases?.[caseFile.id], oldCase ?? 0)));
  }

  return {
    ...initial,
    version: GAME_VERSION,
    day,
    coins: Math.max(0, Math.floor(finite(candidate.coins, initial.coins))),
    reputation: Math.max(0, Math.floor(finite(candidate.reputation, 0))),
    intel: Math.max(0, Math.floor(finite(candidate.intel, 0))),
    selectedCrew: CREW.some((crew) => crew.id === candidate.selectedCrew)
      ? candidate.selectedCrew
      : initial.selectedCrew,
    selectedStage: STAGES.some((stage) => stage.id === candidate.selectedStage)
      ? candidate.selectedStage
      : initial.selectedStage,
    upgrades,
    bonds,
    cases,
    collection: normalizeCollection(candidate.collection),
    shift: normalizeObjectives(candidate.shift, day),
    stats: {
      completed: Math.max(0, Math.floor(finite(candidate.stats?.completed, candidate.stats?.jobsCompleted ?? 0))),
      failed: Math.max(0, Math.floor(finite(candidate.stats?.failed, candidate.stats?.jobsFailed ?? 0))),
      bestGrade: typeof candidate.stats?.bestGrade === 'string' ? candidate.stats.bestGrade : '-',
      streak: Math.max(0, Math.floor(finite(candidate.stats?.streak, candidate.stats?.currentStreak ?? 0))),
      bestStreak: Math.max(0, Math.floor(finite(candidate.stats?.bestStreak, 0))),
      totalEarned: Math.max(0, Math.floor(finite(candidate.stats?.totalEarned, 0))),
      perfectHacks: Math.max(0, Math.floor(finite(candidate.stats?.perfectHacks, 0))),
      rareFinds: Math.max(0, Math.floor(finite(candidate.stats?.rareFinds, candidate.stats?.legendaryFinds ?? 0))),
      caught: Math.max(0, Math.floor(finite(candidate.stats?.caught, 0))),
    },
    settings: {
      sound: candidate.settings?.sound !== false,
      shake: candidate.settings?.shake !== false && candidate.settings?.reducedMotion !== true,
    },
    tutorial: {
      hub: candidate.tutorial?.hub === true || candidate.tutorialSeen === true,
      field: candidate.tutorial?.field === true,
      vault: candidate.tutorial?.vault === true || candidate.tutorialSeen === true,
    },
  };
}

export function loadState(storage = globalThis.localStorage) {
  if (!storage) return createInitialState();
  try {
    const current = storage.getItem(SAVE_KEY);
    if (current) return normalizeState(JSON.parse(current));

    let legacyGame = null;
    let legacyCrew = null;
    for (const key of LEGACY_KEYS) {
      const value = storage.getItem(key);
      if (!value) continue;
      if (key.includes('crew')) legacyCrew = JSON.parse(value);
      else legacyGame = JSON.parse(value);
    }
    if (legacyGame || legacyCrew) {
      const migrated = normalizeState({
        ...legacyGame,
        selectedCrew: legacyCrew?.selectedId ?? legacyGame?.selectedCrew,
        bonds: legacyCrew?.bonds ?? legacyGame?.bonds,
      });
      storage.setItem(SAVE_KEY, JSON.stringify(migrated));
      return migrated;
    }
  } catch {
    return createInitialState();
  }
  return createInitialState();
}

export function saveState(state, storage = globalThis.localStorage) {
  if (!storage) return false;
  try {
    storage.setItem(SAVE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export function clearState(storage = globalThis.localStorage) {
  if (!storage) return false;
  try {
    storage.removeItem(SAVE_KEY);
    for (const key of LEGACY_KEYS) storage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

export function bondLevel(xp) {
  const thresholds = [0, 4, 10, 18, 29, 43];
  let level = 1;
  thresholds.forEach((threshold, index) => {
    if (xp >= threshold) level = index + 1;
  });
  return Math.min(6, level);
}

export function bondProgress(xp) {
  const thresholds = [0, 4, 10, 18, 29, 43];
  const level = bondLevel(xp);
  if (level >= 6) return { level, percentage: 100, current: 1, required: 1 };
  const floor = thresholds[level - 1];
  const ceiling = thresholds[level];
  return {
    level,
    current: xp - floor,
    required: ceiling - floor,
    percentage: Math.round(((xp - floor) / (ceiling - floor)) * 100),
  };
}

export function crewBonuses(state) {
  const crew = getCrew(state.selectedCrew);
  const level = bondLevel(state.bonds[crew.id] ?? 0);
  return {
    crew,
    level,
    moveSpeed: crew.id === 'minhyuk' ? 1.08 + (level - 1) * 0.01 : 1,
    detection: crew.id === 'nabi' ? 0.86 - (level - 1) * 0.015 : 1,
    hackWidth: crew.id === 'juno' ? 1.25 + (level - 1) * 0.03 : 1,
    contractReward: crew.id === 'jaewook' ? 1.08 + (level - 1) * 0.012 : 1,
    clueChance: crew.id === 'harin' ? 0.25 + (level - 1) * 0.05 : 0,
    emergencyGuard: crew.id === 'seojin' ? 1 : 0,
  };
}

export function stageAvailability(state, stage) {
  if (state.reputation < stage.unlockRep) {
    return { ok: false, reason: 'reputation', required: stage.unlockRep };
  }
  if (state.coins < stage.entry) {
    return { ok: false, reason: 'coins', required: stage.entry };
  }
  return { ok: true };
}

export function getUpgradeCost(upgradeId, level) {
  const upgrade = getUpgrade(upgradeId);
  if (level >= upgrade.max) return 0;
  return Math.round((upgrade.baseCost * 1.68 ** level) / 5) * 5;
}

export function purchaseUpgrade(state, upgradeId) {
  const upgrade = getUpgrade(upgradeId);
  const level = state.upgrades[upgrade.id] ?? 0;
  if (level >= upgrade.max) return { ok: false, reason: 'max', state };
  const cost = getUpgradeCost(upgrade.id, level);
  if (state.coins < cost) return { ok: false, reason: 'coins', cost, state };
  return {
    ok: true,
    cost,
    state: {
      ...state,
      coins: state.coins - cost,
      upgrades: { ...state.upgrades, [upgrade.id]: level + 1 },
    },
  };
}

export function selectCrew(state, crewId) {
  const crew = getCrew(crewId);
  return { ...state, selectedCrew: crew.id };
}

export function selectStage(state, stageId) {
  const stage = getStage(stageId);
  return { ...state, selectedStage: stage.id };
}

export function startMission(state, stageId) {
  const stage = getStage(stageId);
  const availability = stageAvailability(state, stage);
  if (!availability.ok) return { ...availability, state };
  return {
    ok: true,
    stage,
    state: {
      ...state,
      selectedStage: stage.id,
      coins: state.coins - stage.entry,
    },
  };
}

export function gradeMission({ alert = 0, integrity = 100, maxCombo = 1, hacks = 0, timeLeft = 0, stageTime = 60 }) {
  const score = integrity * 0.5
    + (100 - alert) * 0.18
    + Math.min(5, maxCombo) * 4
    + Math.min(3, hacks) * 3
    + clamp(timeLeft / Math.max(1, stageTime), 0, 1) * 13;
  if (score >= 91) return 'S';
  if (score >= 80) return 'A';
  if (score >= 68) return 'B';
  if (score >= 54) return 'C';
  return 'D';
}

function weightedPick(entries, rng) {
  const total = entries.reduce((sum, entry) => sum + entry.weight, 0);
  let cursor = rng() * total;
  for (const entry of entries) {
    cursor -= entry.weight;
    if (cursor <= 0) return entry.value;
  }
  return entries.at(-1).value;
}

export function rarityWeights(state, stage, quality = 80) {
  const scanner = state.upgrades.scanner ?? 0;
  const difficulty = stage.difficulty;
  const qualityBoost = clamp((quality - 70) / 10, -2, 3);
  return {
    common: Math.max(14, RARITIES.common.weight - scanner * 4 - difficulty * 1.8 - qualityBoost * 2.2),
    uncommon: RARITIES.uncommon.weight + scanner * 1.2 + difficulty * 0.8,
    rare: RARITIES.rare.weight + scanner * 1.5 + difficulty * 1.1 + Math.max(0, qualityBoost),
    legendary: RARITIES.legendary.weight + scanner * 0.48 + difficulty * 0.27 + Math.max(0, qualityBoost) * 0.24,
  };
}

function tagsForStage(stage) {
  const tags = [stage.map];
  if (stage.map === 'bank') tags.push('bank');
  if (stage.map === 'hotel') tags.push('hotel');
  if (stage.map === 'flood') tags.push('flood');
  if (stage.map === 'casino') tags.push('casino');
  if (stage.map === 'museum') tags.push('museum');
  if (stage.map === 'train') tags.push('train');
  if (stage.map === 'warehouse') tags.push('warehouse');
  if (stage.map === 'arctic') tags.push('arctic');
  if (stage.map === 'archive') tags.push('archive');
  if (stage.map === 'bunker') tags.push('bunker');
  return tags;
}

export function rollLootBoxes(state, stage, mission, seed = `${state.day}:${stage.id}`) {
  const rng = createRng(seed);
  const quality = clamp(Math.round(mission.integrity * 0.78 + mission.maxCombo * 4 + 10), 35, 100);
  const weights = rarityWeights(state, stage, quality);
  const bonuses = crewBonuses(state);
  const stageTags = tagsForStage(stage);

  const boxes = Array.from({ length: 3 }, (_, boxIndex) => {
    const rarity = weightedPick(Object.entries(weights).map(([value, weight]) => ({ value, weight })), rng);
    let pool = ITEMS.filter((item) => item.rarity === rarity && item.tags.some((tag) => stageTags.includes(tag)));
    if (pool.length === 0) pool = ITEMS.filter((item) => item.rarity === rarity);
    const casePool = pool.filter((item) => item.caseId === stage.caseId);
    const useCase = casePool.length > 0 && rng() < 0.52 + bonuses.clueChance;
    const finalPool = useCase ? casePool : pool;
    const item = finalPool[Math.floor(rng() * finalPool.length)] ?? ITEMS[0];
    const condition = clamp(Math.round(quality - rng() * 8 + boxIndex * 1.5), 35, 100);
    const value = Math.round((item.value * (0.72 + condition / 230) * (1 + stage.difficulty * 0.045) * (0.94 + rng() * 0.14)) / 5) * 5;
    return {
      boxIndex,
      itemId: item.id,
      rarity: item.rarity,
      condition,
      value,
      clue: item.clue,
      caseId: item.caseId,
      scannerScore: Math.round((RARITIES[item.rarity].multiplier * 18 + rng() * 28 + (item.caseId ? 8 : 0)) * 10) / 10,
    };
  });

  const bestIndex = boxes.reduce((best, box, index) => box.scannerScore > boxes[best].scannerScore ? index : best, 0);
  return { boxes, bestIndex, quality };
}

export function choicePreview(state, stage, loot, choice) {
  const item = getItem(loot.itemId);
  const crew = crewBonuses(state);
  const baseReward = Math.round(stage.reward * crew.contractReward);
  const rarity = RARITIES[item.rarity];
  if (choice === 'auction') {
    return {
      coins: Math.round((baseReward + loot.value * (1.05 + (crew.crew.id === 'jaewook' ? 0.12 : 0))) / 5) * 5,
      reputation: Math.max(1, Math.floor(stage.difficulty / 3)),
      intel: 0,
      clues: 0,
      bond: 2,
    };
  }
  if (choice === 'return') {
    return {
      coins: Math.round((baseReward + loot.value * 0.36) / 5) * 5,
      reputation: 2 + Math.ceil(stage.difficulty / 2) + (rarity === RARITIES.legendary ? 2 : 0),
      intel: item.caseId ? 1 : 0,
      clues: item.caseId ? Math.max(1, Math.ceil(item.clue / 2)) : 0,
      bond: 4,
    };
  }
  return {
    coins: Math.round((baseReward + loot.value * 0.16) / 5) * 5,
    reputation: 1,
    intel: 2 + (rarity.multiplier >= 2 ? 2 : 0) + item.clue,
    clues: item.caseId ? item.clue + 1 : 0,
    bond: 3,
  };
}

function updateObjectives(objectives, mission, loot, choice) {
  const rewards = [];
  const updated = objectives.map((objective) => {
    if (objective.claimed) return objective;
    let progress = objective.progress;
    switch (objective.type) {
      case 'complete': progress += 1; break;
      case 'stealth': progress += mission.alert <= 30 ? 1 : 0; break;
      case 'combo': progress = Math.max(progress, mission.maxCombo); break;
      case 'return': progress += choice === 'return' ? 1 : 0; break;
      case 'archive': progress += choice === 'archive' && loot.caseId ? 1 : 0; break;
      case 'rare': progress += ['rare', 'legendary'].includes(loot.rarity) ? 1 : 0; break;
      case 'hack': progress += mission.perfectHacks; break;
      case 'condition': progress = Math.max(progress, loot.condition); break;
      default: break;
    }
    progress = clamp(progress, 0, objective.target);
    const complete = progress >= objective.target;
    if (complete) rewards.push(objective);
    return { ...objective, progress, complete, claimed: complete };
  });
  return { updated, rewards };
}

const GRADE_ORDER = ['-', 'D', 'C', 'B', 'A', 'S'];

export function settleMission(state, stage, mission, loot, choice) {
  const preview = choicePreview(state, stage, loot, choice);
  const item = getItem(loot.itemId);
  const previous = state.collection[item.id];
  const collection = {
    ...state.collection,
    [item.id]: {
      count: (previous?.count ?? 0) + 1,
      bestValue: Math.max(previous?.bestValue ?? 0, loot.value),
      archived: (previous?.archived ?? 0) + (choice === 'archive' ? 1 : 0),
      firstDay: previous?.firstDay ?? state.day,
    },
  };
  const cases = { ...state.cases };
  if (item.caseId && preview.clues > 0) cases[item.caseId] += preview.clues;

  const objectiveResult = updateObjectives(state.shift.objectives, mission, loot, choice);
  const objectiveCoins = objectiveResult.rewards.reduce((sum, objective) => sum + objective.coins, 0);
  const objectiveIntel = objectiveResult.rewards.reduce((sum, objective) => sum + objective.intel, 0);
  const grade = mission.grade ?? gradeMission({ ...mission, stageTime: stage.time });
  const currentBest = GRADE_ORDER.indexOf(grade) > GRADE_ORDER.indexOf(state.stats.bestGrade) ? grade : state.stats.bestGrade;
  const nextStreak = state.stats.streak + 1;
  const nextDay = state.day + 1;
  const nextShiftId = shiftIdForDay(nextDay);
  const shiftChanged = nextShiftId !== state.shift.id;

  let nextState = {
    ...state,
    day: nextDay,
    coins: state.coins + preview.coins + objectiveCoins,
    reputation: state.reputation + preview.reputation,
    intel: state.intel + preview.intel + objectiveIntel,
    bonds: {
      ...state.bonds,
      [state.selectedCrew]: (state.bonds[state.selectedCrew] ?? 0) + preview.bond + (grade === 'S' ? 2 : 0),
    },
    cases,
    collection,
    shift: shiftChanged
      ? { id: nextShiftId, objectives: createObjectives(nextShiftId) }
      : { ...state.shift, objectives: objectiveResult.updated },
    stats: {
      ...state.stats,
      completed: state.stats.completed + 1,
      bestGrade: currentBest,
      streak: nextStreak,
      bestStreak: Math.max(state.stats.bestStreak, nextStreak),
      totalEarned: state.stats.totalEarned + preview.coins + objectiveCoins,
      perfectHacks: state.stats.perfectHacks + mission.perfectHacks,
      rareFinds: state.stats.rareFinds + (['rare', 'legendary'].includes(item.rarity) ? 1 : 0),
    },
  };

  const unlockedStage = STAGES.find((candidate) => candidate.unlockRep > state.reputation && candidate.unlockRep <= nextState.reputation);
  const caseFile = item.caseId ? getCase(item.caseId) : null;
  const beforeClues = item.caseId ? state.cases[item.caseId] : 0;
  const afterClues = item.caseId ? nextState.cases[item.caseId] : 0;
  const unlockedChapter = caseFile?.chapters.find((chapter) => chapter.at > beforeClues && chapter.at <= afterClues) ?? null;

  return {
    state: nextState,
    preview,
    objectiveRewards: objectiveResult.rewards,
    unlockedStage,
    unlockedChapter,
    grade,
  };
}

export function failMission(state, mission) {
  const nextDay = state.day + 1;
  const nextShiftId = shiftIdForDay(nextDay);
  return {
    ...state,
    day: nextDay,
    shift: nextShiftId === state.shift.id
      ? state.shift
      : { id: nextShiftId, objectives: createObjectives(nextShiftId) },
    stats: {
      ...state.stats,
      failed: state.stats.failed + 1,
      streak: 0,
      caught: state.stats.caught + (mission?.reason === 'caught' ? 1 : 0),
    },
    bonds: {
      ...state.bonds,
      [state.selectedCrew]: (state.bonds[state.selectedCrew] ?? 0) + 1,
    },
  };
}

export function collectionProgress(state) {
  const found = Object.keys(state.collection).length;
  return { found, total: ITEMS.length, percentage: Math.round((found / ITEMS.length) * 100) };
}

export function caseProgress(state, caseId) {
  const caseFile = getCase(caseId);
  const clues = state.cases[caseFile.id] ?? 0;
  return {
    caseFile,
    clues,
    percentage: clamp(Math.round((clues / caseFile.required) * 100), 0, 100),
    unlocked: caseFile.chapters.filter((chapter) => clues >= chapter.at),
  };
}
