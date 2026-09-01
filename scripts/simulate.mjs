import { CREW, STAGES } from '../src/content.js';
import {
  choicePreview,
  createInitialState,
  crewBonuses,
  gradeMission,
  purchaseUpgrade,
  rollLootBoxes,
  settleMission,
  stageAvailability,
  startMission,
} from '../src/state.js';

function preparedState(stage) {
  let state = createInitialState();
  state = {
    ...state,
    coins: 999_999,
    reputation: 999,
    upgrades: { boots: 3, jammer: 3, drill: 3, coolant: 3, muffler: 3, scanner: 3 },
  };
  for (const crew of CREW) state.bonds[crew.id] = 20;
  state.selectedStage = stage.id;
  return state;
}

const rows = [];
for (const stage of STAGES) {
  const state = preparedState(stage);
  const availability = stageAvailability(state, stage);
  if (!availability.ok) throw new Error(`Stage ${stage.id} unexpectedly locked`);
  const started = startMission(state, stage.id);
  const mission = {
    alert: Math.min(48, 8 + stage.difficulty * 3.5),
    integrity: Math.max(72, 99 - stage.difficulty * 2),
    maxCombo: Math.min(5, 2 + Math.floor(stage.difficulty / 2)),
    perfectHacks: Math.min(3, Math.max(1, Math.ceil(stage.difficulty / 4))),
    hacks: Math.min(3, Math.max(1, Math.ceil(stage.difficulty / 4))),
    timeLeft: Math.max(12, 42 - stage.difficulty * 2),
    stageTime: stage.time,
  };
  mission.grade = gradeMission(mission);
  const lootRoll = rollLootBoxes(started.state, stage, mission, `simulation:${stage.id}`);
  const loot = lootRoll.boxes[lootRoll.bestIndex];
  const cash = choicePreview(started.state, stage, loot, 'auction');
  const returnValue = choicePreview(started.state, stage, loot, 'return');
  const archive = choicePreview(started.state, stage, loot, 'archive');
  const settled = settleMission(started.state, stage, mission, loot, 'return');

  rows.push({
    stage: stage.order,
    name: stage.name,
    grade: mission.grade,
    loot: loot.rarity,
    cash: cash.coins,
    reputation: returnValue.reputation,
    clues: archive.clues,
    net: settled.state.coins - state.coins,
  });

  if (cash.coins <= returnValue.coins || returnValue.coins <= archive.coins) {
    throw new Error(`Reward choice ordering failed at ${stage.id}`);
  }
  if (loot.value <= 0 || settled.state.day !== state.day + 1) {
    throw new Error(`Settlement failed at ${stage.id}`);
  }
}

const upgradeState = { ...createInitialState(), coins: 999_999 };
for (const id of ['boots', 'jammer', 'drill', 'coolant', 'muffler', 'scanner']) {
  let state = upgradeState;
  for (let level = 0; level < 3; level += 1) {
    const result = purchaseUpgrade(state, id);
    if (!result.ok) throw new Error(`Upgrade simulation failed for ${id}`);
    state = result.state;
  }
}

for (const crew of CREW) {
  const state = preparedState(STAGES[0]);
  state.selectedCrew = crew.id;
  const bonus = crewBonuses(state);
  if (!bonus.crew || bonus.level < 1) throw new Error(`Crew bonus failed for ${crew.id}`);
}

console.table(rows);
console.log('Balance simulation passed: all ten contracts are playable and every progression branch returns valid rewards.');
