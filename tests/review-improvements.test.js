import test from 'node:test';
import assert from 'node:assert/strict';

import { STAGES } from '../src/content.js';
import { MISSION_LAYOUT_COUNT, buildMissionLayout, isReachable } from '../src/mission-layouts.js';
import { getVaultTuning, simulateBaselineVault } from '../src/vault-balance.js';

function cell(position) {
  return [Math.floor(position.x / 16), Math.floor(position.y / 16)];
}

test('all ten stage themes produce distinct traversable layouts', () => {
  assert.equal(MISSION_LAYOUT_COUNT, 10);
  const signatures = new Set();
  for (const stage of STAGES) {
    const layout = buildMissionLayout(stage);
    signatures.add(layout.signature);
    assert.equal(layout.panelPositions.length, Math.min(3, 1 + Math.floor(stage.difficulty / 3)));
    let previous = cell(layout.start);
    for (const target of [...layout.panelPositions, layout.vaultPosition]) {
      const destination = cell(target);
      assert.equal(layout.map[previous[1]][previous[0]], 0, `${stage.id} route starts on a floor tile`);
      assert.equal(layout.map[destination[1]][destination[0]], 0, `${stage.id} target is on a floor tile`);
      assert.equal(isReachable(layout.map, previous, destination), true, `${stage.id} target must be reachable`);
      previous = destination;
    }
    for (const path of layout.guardPaths) {
      for (const position of path) {
        const [col, row] = cell(position);
        assert.equal(layout.map[row][col], 0, `${stage.id} guard patrol anchor must be on floor`);
      }
    }
  }
  assert.equal(signatures.size, STAGES.length);
});

test('the first mission is a forgiving two-lock tutorial instead of an impossible timer check', () => {
  const stage = STAGES[0];
  const tuning = getVaultTuning(stage, {});
  const run = simulateBaselineVault(stage, {});
  assert.equal(tuning.locks, 2);
  assert.ok(tuning.baseWidth >= 32);
  assert.ok(tuning.timeLimit >= 55);
  assert.ok(tuning.rescueSeconds >= 10);
  assert.equal(run.success, true);
  assert.ok(run.elapsed < tuning.timeLimit);
  assert.ok(run.timeLeft > 20);
});

test('every stage remains completable with baseline controls before optional hazards', () => {
  for (const stage of STAGES) {
    const run = simulateBaselineVault(stage, { drill: 0, coolant: 0, muffler: 0 });
    assert.equal(run.success, true, `${stage.name} baseline vault must be mechanically possible`);
    assert.equal(run.completedLocks, run.locks);
    assert.ok(run.maxCombo >= 3);
  }
});

test('drill upgrades improve control and completion time without removing stage identity', () => {
  const stage = STAGES[4];
  const base = getVaultTuning(stage, { drill: 0 });
  const upgraded = getVaultTuning(stage, { drill: 4 });
  const baseRun = simulateBaselineVault(stage, { drill: 0, coolant: 0, muffler: 0 });
  const upgradedRun = simulateBaselineVault(stage, { drill: 4, coolant: 2, muffler: 2 });
  assert.equal(base.locks, 4);
  assert.equal(upgraded.locks, 4);
  assert.ok(upgraded.baseWidth > base.baseWidth);
  assert.ok(upgraded.progressRate > base.progressRate);
  assert.ok(upgraded.pressureRise < base.pressureRise);
  assert.ok(upgradedRun.elapsed < baseRun.elapsed);
});

test('reputation curve unlocks the second contract after a strong first return', () => {
  assert.deepEqual(STAGES.map((stage) => stage.unlockRep), [0, 3, 7, 12, 18, 25, 33, 42, 52, 63]);
});
