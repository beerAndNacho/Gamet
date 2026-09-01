import test from 'node:test';
import assert from 'node:assert/strict';

import {
  CASES,
  CREW,
  ITEMS,
  OBJECTIVE_POOL,
  RARITIES,
  STAGES,
  UPGRADES,
  getCase,
  getCrew,
  getItem,
  getStage,
} from '../src/content.js';
import {
  bondLevel,
  bondProgress,
  caseProgress,
  choicePreview,
  collectionProgress,
  createInitialState,
  createObjectives,
  createRng,
  crewBonuses,
  gradeMission,
  loadState,
  normalizeState,
  purchaseUpgrade,
  rarityWeights,
  rollLootBoxes,
  selectCrew,
  settleMission,
  stageAvailability,
  startMission,
} from '../src/state.js';

function memoryStorage(entries = {}) {
  const values = new Map(Object.entries(entries));
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
    values,
  };
}

function sampleMission(overrides = {}) {
  return {
    alert: 18,
    integrity: 93,
    maxCombo: 4,
    perfectHacks: 2,
    hacks: 2,
    timeLeft: 31,
    stageTime: 80,
    ...overrides,
  };
}

test('pixel release ships a complete progression set', () => {
  assert.equal(STAGES.length, 10);
  assert.equal(CREW.length, 6);
  assert.equal(ITEMS.length, 30);
  assert.equal(CASES.length, 3);
  assert.equal(UPGRADES.length, 6);
  assert.ok(OBJECTIVE_POOL.length >= 8);

  for (const collection of [STAGES, CREW, ITEMS, CASES, UPGRADES, OBJECTIVE_POOL]) {
    assert.equal(new Set(collection.map((entry) => entry.id)).size, collection.length);
  }
  assert.deepEqual(STAGES.map((stage) => stage.order), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  assert.equal(STAGES.filter((stage) => stage.boss).length, 3);
});

test('content lookup functions fall back safely', () => {
  assert.equal(getStage('missing').id, STAGES[0].id);
  assert.equal(getCrew('missing').id, CREW[0].id);
  assert.equal(getItem('missing').id, ITEMS[0].id);
  assert.equal(getCase('missing').id, CASES[0].id);
});

test('initial state is playable and includes every meta system', () => {
  const state = createInitialState();
  assert.equal(state.version, 3);
  assert.equal(state.coins, 340);
  assert.equal(state.selectedCrew, 'seojin');
  assert.equal(Object.keys(state.upgrades).length, UPGRADES.length);
  assert.equal(Object.keys(state.bonds).length, CREW.length);
  assert.equal(Object.keys(state.cases).length, CASES.length);
  assert.equal(state.shift.objectives.length, 3);
  assert.equal(stageAvailability(state, STAGES[0]).ok, true);
});

test('daily objectives are deterministic and first shift teaches the core loop', () => {
  assert.deepEqual(createObjectives(8), createObjectives(8));
  assert.deepEqual(createObjectives(1).map((objective) => objective.id), ['complete-2', 'condition-85', 'return-1']);
});

test('seeded RNG and loot boxes are deterministic', () => {
  const a = createRng('vault');
  const b = createRng('vault');
  assert.deepEqual([a(), a(), a()], [b(), b(), b()]);

  const state = createInitialState();
  const mission = sampleMission();
  assert.deepEqual(
    rollLootBoxes(state, STAGES[0], mission, 'same-seed'),
    rollLootBoxes(state, STAGES[0], mission, 'same-seed'),
  );
});

test('legacy save is migrated without losing progress', () => {
  const storage = memoryStorage({
    'vault-recovery-save-v1': JSON.stringify({
      coins: 777,
      reputation: 9,
      day: 4,
      upgrades: { drill: 2, coolant: 1 },
      collection: { watch: { count: 2, bestValue: 130, firstFoundDay: 2 } },
      stats: { jobsCompleted: 3, jobsFailed: 1, currentStreak: 2 },
      tutorialSeen: true,
    }),
    'vault-recovery-crew-v1': JSON.stringify({ selectedId: 'nabi', bonds: { nabi: 11 } }),
  });
  const state = loadState(storage);
  assert.equal(state.version, 3);
  assert.equal(state.coins, 777);
  assert.equal(state.selectedCrew, 'nabi');
  assert.equal(state.bonds.nabi, 11);
  assert.equal(state.stats.completed, 3);
  assert.equal(state.collection.watch.count, 2);
  assert.equal(state.tutorial.hub, true);
});

test('normalization repairs malformed values', () => {
  const state = normalizeState({
    day: 0,
    coins: -9,
    selectedCrew: 'ghost',
    selectedStage: 'nowhere',
    upgrades: { drill: 99, boots: -8 },
  });
  assert.equal(state.day, 1);
  assert.equal(state.coins, 0);
  assert.equal(state.selectedCrew, 'seojin');
  assert.equal(state.selectedStage, 'harbor-bank');
  assert.equal(state.upgrades.drill, 6);
  assert.equal(state.upgrades.boots, 0);
});

test('contracts enforce reputation and entry fees', () => {
  const state = createInitialState();
  assert.equal(stageAvailability(state, STAGES[4]).reason, 'reputation');
  const eligible = { ...state, reputation: 999, coins: STAGES[4].entry - 1 };
  assert.equal(stageAvailability(eligible, STAGES[4]).reason, 'coins');
  const funded = { ...eligible, coins: STAGES[4].entry + 50 };
  const started = startMission(funded, STAGES[4].id);
  assert.equal(started.ok, true);
  assert.equal(started.state.coins, 50);
});

test('upgrades increase in cost and purchase immutably', () => {
  const state = { ...createInitialState(), coins: 10_000 };
  const first = purchaseUpgrade(state, 'drill');
  const second = purchaseUpgrade(first.state, 'drill');
  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  assert.equal(state.upgrades.drill, 0);
  assert.equal(second.state.upgrades.drill, 2);
  assert.ok(second.cost > first.cost);
});

test('crew members provide distinct strategic bonuses', () => {
  const base = createInitialState();
  const juno = crewBonuses(selectCrew(base, 'juno'));
  const minhyuk = crewBonuses(selectCrew(base, 'minhyuk'));
  const nabi = crewBonuses(selectCrew(base, 'nabi'));
  const jaewook = crewBonuses(selectCrew(base, 'jaewook'));
  assert.ok(juno.hackWidth > 1);
  assert.ok(minhyuk.moveSpeed > 1);
  assert.ok(nabi.detection < 1);
  assert.ok(jaewook.contractReward > 1);
});

test('mission grade rewards stealth, condition, skill and speed', () => {
  assert.equal(gradeMission(sampleMission({ alert: 0, integrity: 100, maxCombo: 5, hacks: 3, timeLeft: 60 })), 'S');
  assert.equal(gradeMission(sampleMission({ alert: 100, integrity: 20, maxCombo: 1, hacks: 0, timeLeft: 0 })), 'D');
});

test('scanner, quality and difficulty increase rare item odds', () => {
  const base = createInitialState();
  const advanced = {
    ...base,
    upgrades: { ...base.upgrades, scanner: 6 },
  };
  const low = rarityWeights(base, STAGES[0], 60);
  const high = rarityWeights(advanced, STAGES[9], 100);
  assert.ok(high.rare > low.rare);
  assert.ok(high.legendary > low.legendary);
  assert.ok(high.common < low.common);
});

test('loot contains three meaningful choices and a valid scanner recommendation', () => {
  const roll = rollLootBoxes(createInitialState(), STAGES[2], sampleMission(), 'three-box-test');
  assert.equal(roll.boxes.length, 3);
  assert.ok(roll.bestIndex >= 0 && roll.bestIndex < 3);
  for (const box of roll.boxes) {
    assert.ok(ITEMS.some((item) => item.id === box.itemId));
    assert.ok(RARITIES[box.rarity]);
    assert.ok(box.value > 0);
    assert.ok(box.condition >= 35 && box.condition <= 100);
  }
});

test('result choices create a cash, reputation and story tradeoff', () => {
  const state = { ...createInitialState(), reputation: 99, coins: 99_999 };
  const stage = STAGES[4];
  const mission = sampleMission({ stageTime: stage.time });
  const roll = rollLootBoxes(state, stage, mission, 'choice-test');
  const loot = roll.boxes.find((box) => box.caseId) ?? roll.boxes[0];
  const auction = choicePreview(state, stage, loot, 'auction');
  const returned = choicePreview(state, stage, loot, 'return');
  const archived = choicePreview(state, stage, loot, 'archive');
  assert.ok(auction.coins > returned.coins);
  assert.ok(returned.coins > archived.coins);
  assert.ok(returned.reputation > auction.reputation);
  assert.ok(archived.intel >= returned.intel);
  if (loot.caseId) assert.ok(archived.clues > returned.clues);
});

test('settlement advances collection, bond, objectives and case progress', () => {
  const state = { ...createInitialState(), reputation: 99, coins: 99_999 };
  const stage = STAGES[0];
  const mission = { ...sampleMission({ stageTime: stage.time }), grade: 'A' };
  const loot = {
    itemId: 'ledger', rarity: 'common', condition: 91, value: 180,
    clue: 2, caseId: 'case17', scannerScore: 55, boxIndex: 0,
  };
  const result = settleMission(state, stage, mission, loot, 'archive');
  assert.equal(result.state.day, 2);
  assert.equal(result.state.stats.completed, 1);
  assert.equal(result.state.collection.ledger.count, 1);
  assert.equal(result.state.collection.ledger.archived, 1);
  assert.ok(result.state.cases.case17 > 0);
  assert.ok(result.state.bonds.seojin > 0);
  assert.equal(collectionProgress(result.state).found, 1);
  assert.ok(caseProgress(result.state, 'case17').unlocked.length >= 1);
});

test('bond progression reaches six stable relationship levels', () => {
  assert.equal(bondLevel(0), 1);
  assert.equal(bondLevel(4), 2);
  assert.equal(bondLevel(43), 6);
  assert.equal(bondProgress(7).level, 2);
  assert.equal(bondProgress(43).percentage, 100);
});
