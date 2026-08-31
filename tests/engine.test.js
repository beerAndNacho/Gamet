import test from 'node:test';
import assert from 'node:assert/strict';

import { ITEMS, JOBS, UPGRADE_DEFINITIONS } from '../src/data.js';
import {
  canStartJob,
  calculateRunGrade,
  createInitialState,
  createRun,
  getCollectionProgress,
  getUpgradeCost,
  normalizeState,
  payJobEntry,
  purchaseUpgrade,
  rollLoot,
  settleSuccess,
  stepRun,
} from '../src/engine.js';

const firstJob = JOBS[0];

function fixedRandom(value = 0.5) {
  return () => value;
}

test('initial state is playable and has every upgrade slot', () => {
  const state = createInitialState();
  assert.equal(state.coins, 260);
  assert.equal(state.reputation, 0);
  assert.deepEqual(Object.keys(state.upgrades).sort(), Object.keys(UPGRADE_DEFINITIONS).sort());
  assert.equal(canStartJob(state, firstJob).ok, true);
});

test('normalizeState repairs malformed save data', () => {
  const normalized = normalizeState({
    coins: -10,
    reputation: Number.NaN,
    day: 0,
    upgrades: { drill: 999, coolant: -4 },
    collection: { unknown: { count: 9 } },
    settings: { sound: false, reducedMotion: true },
  });

  assert.equal(normalized.coins, 0);
  assert.equal(normalized.reputation, 0);
  assert.equal(normalized.day, 1);
  assert.equal(normalized.upgrades.drill, UPGRADE_DEFINITIONS.drill.maxLevel);
  assert.equal(normalized.upgrades.coolant, 0);
  assert.deepEqual(normalized.collection, {});
  assert.equal(normalized.settings.sound, false);
  assert.equal(normalized.settings.reducedMotion, true);
});

test('upgrade costs increase and a purchase deducts coins', () => {
  assert.ok(getUpgradeCost('drill', 1) > getUpgradeCost('drill', 0));
  const state = createInitialState();
  const result = purchaseUpgrade(state, 'drill');
  assert.equal(result.ok, true);
  assert.equal(result.state.upgrades.drill, 1);
  assert.equal(result.state.coins, state.coins - getUpgradeCost('drill', 0));
  assert.equal(state.upgrades.drill, 0, 'purchase remains immutable');
});

test('locked jobs require reputation before charging entry fee', () => {
  const state = createInitialState();
  const lockedJob = JOBS[2];
  assert.deepEqual(canStartJob(state, lockedJob), {
    ok: false,
    reason: 'reputation',
    required: lockedJob.unlockReputation,
  });

  const payment = payJobEntry({ ...state, reputation: lockedJob.unlockReputation, coins: 500 }, lockedJob);
  assert.equal(payment.ok, true);
  assert.equal(payment.state.coins, 500 - lockedJob.entryFee);
});

test('holding inside the safe pressure zone advances the lock', () => {
  const state = createInitialState();
  let run = createRun(firstJob, state, fixedRandom(0.5));
  run = {
    ...run,
    pressure: 50,
    target: { ...run.target, base: 50, amplitude: 0, speed: 0, phase: 0, width: 30 },
    targetCenter: 50,
  };

  const next = stepRun(run, { held: true }, 0.05, firstJob, state, fixedRandom(0.5));
  assert.ok(next.progress > run.progress);
  assert.equal(next.inTarget, true);
  assert.equal(next.event === 'perfect' || next.event === 'steady', true);
});

test('excess pressure damages integrity and raises risk meters', () => {
  const state = createInitialState();
  let run = createRun(firstJob, state, fixedRandom(0.5));
  run = {
    ...run,
    pressure: 94,
    target: { ...run.target, base: 40, amplitude: 0, speed: 0, phase: 0, width: 20 },
    targetCenter: 40,
  };

  const next = stepRun(run, { held: true }, 0.08, firstJob, state, fixedRandom(0.5));
  assert.ok(next.integrity < run.integrity);
  assert.ok(next.heat > run.heat);
  assert.ok(next.noise > run.noise);
  assert.equal(next.event, 'strain');
});

test('successful precision run receives an S grade', () => {
  const run = {
    status: 'success',
    integrity: 98,
    heldSeconds: 12,
    perfectSeconds: 11.5,
    timeRemaining: 20,
    elapsed: 18,
    alarmStrikes: 0,
  };
  assert.equal(calculateRunGrade(run), 'S');
});

test('high random roll can reveal a legendary item', () => {
  const state = {
    ...createInitialState(),
    upgrades: { drill: 0, coolant: 0, muffler: 0, scanner: 6 },
  };
  const run = {
    status: 'success',
    integrity: 100,
    heldSeconds: 10,
    perfectSeconds: 10,
    timeRemaining: 20,
    elapsed: 10,
    alarmStrikes: 0,
  };

  const find = rollLoot(JOBS[3], state, run, fixedRandom(0.999));
  const item = ITEMS.find((candidate) => candidate.id === find.itemId);
  assert.equal(item.rarity, 'legendary');
  assert.ok(find.appraisedValue > 0);
});

test('auction pays more while return grants more reputation', () => {
  const state = createInitialState();
  const item = ITEMS.find((candidate) => candidate.rarity === 'rare');
  const find = {
    itemId: item.id,
    grade: 'A',
    condition: 90,
    appraisedValue: 500,
    rarity: item.rarity,
  };

  const auction = settleSuccess(state, JOBS[1], find, 'auction');
  const returned = settleSuccess(state, JOBS[1], find, 'return');

  assert.ok(auction.payout > returned.payout);
  assert.ok(returned.reputationGained > auction.reputationGained);
  assert.equal(returned.state.collection[item.id].count, 1);
  assert.equal(getCollectionProgress(returned.state).discovered, 1);
});
