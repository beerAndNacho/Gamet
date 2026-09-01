import { STAGES } from '../src/content.js';
import { buildMissionLayout, isReachable } from '../src/mission-layouts.js';
import { getVaultTuning, simulateBaselineVault } from '../src/vault-balance.js';

const cell = (position) => [Math.floor(position.x / 16), Math.floor(position.y / 16)];
const rows = STAGES.map((stage) => {
  const layout = buildMissionLayout(stage);
  const targets = [...layout.panelPositions, layout.vaultPosition];
  let previous = cell(layout.start);
  const reachable = targets.every((position) => {
    const destination = cell(position);
    const ok = isReachable(layout.map, previous, destination);
    previous = destination;
    return ok;
  });
  const tuning = getVaultTuning(stage, {});
  const vault = simulateBaselineVault(stage, {});
  return {
    stage: stage.order,
    map: stage.map,
    panels: layout.panelPositions.length,
    reachable,
    locks: tuning.locks,
    timer: Number(tuning.timeLimit.toFixed(1)),
    clear: vault.success,
    clearTime: Number(vault.elapsed.toFixed(1)),
    remaining: Number(vault.timeLeft.toFixed(1)),
  };
});

console.table(rows);
if (rows.some((row) => !row.reachable || !row.clear)) {
  console.error('Review simulation failed: an objective route or baseline vault is impossible.');
  process.exit(1);
}
if (new Set(rows.map((row) => row.map)).size !== STAGES.length) {
  console.error('Review simulation failed: stage maps are not distinct.');
  process.exit(1);
}
console.log('Review simulation passed: ten distinct maps, reachable objectives, and mechanically completable vaults.');
