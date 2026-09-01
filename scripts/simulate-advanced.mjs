import {
  BOSS_PROTOCOLS,
  DIRECTIVES,
  calculateAdvancedBonus,
  directiveFor,
  evaluateDirectiveChallenge,
  protocolCue,
  protocolEffect,
  styleRank,
} from '../src/advanced-system.js';

function successMetrics(directive) {
  const base = {
    alert: 8,
    timeLeft: 18,
    maxCombo: 5,
    perfectHacks: 3,
    panelsRequired: 3,
    nearMisses: 3,
    integrity: 94,
    dashed: false,
    pickups: 6,
  };
  if (directive.challenge.type === 'perfect-hacks') base.perfectHacks = base.panelsRequired;
  return base;
}

const directiveRows = DIRECTIVES.map((directive) => {
  const challenge = evaluateDirectiveChallenge(directive, successMetrics(directive));
  const bonus = calculateAdvancedBonus({
    baseReward: 1000,
    styleScore: 330,
    directive,
    challengeMet: challenge.met,
  });
  return {
    directive: directive.code,
    challenge: challenge.met ? 'CLEAR' : 'FAIL',
    contract: bonus.contractReward,
    style: bonus.styleCoins,
    challengeBonus: bonus.challengeCoins,
    total: bonus.contractReward + bonus.totalCoins,
  };
});

const protocolRows = Object.entries(BOSS_PROTOCOLS).flatMap(([stageId, protocols]) => protocols.map((protocol, index) => {
  const phases = new Set();
  let successWindows = 0;
  let failureWindows = 0;
  for (let step = 0; step <= 160; step += 1) {
    const elapsed = step * 0.125;
    const cue = protocolCue(protocol, elapsed);
    phases.add(cue.phase);
    const safeAction = ['active', 'rest', 'silence', 'decay'].includes(cue.phase) ? false : true;
    const effect = protocolEffect(protocol, cue, {
      holding: safeAction,
      safe: true,
      pressure: cue.phase === 'right' ? 58 : 42,
      safeCenter: 50,
      dt: 0.125,
      elapsed,
    });
    if (effect.successWindow) successWindows += 1;
    if (effect.failureWindow) failureWindows += 1;
  }
  return {
    stage: stageId,
    lock: index + 1,
    protocol: protocol.code,
    phases: [...phases].join('/'),
    successWindows,
    failureWindows,
  };
}));

console.table(directiveRows);
console.table(protocolRows);

const rotation = new Set(Array.from({ length: 40 }, (_, index) => directiveFor(index + 2, 'old-central', 9).id));
const failedDirective = directiveRows.find((row) => row.challenge !== 'CLEAR' || row.total < row.contract);
const malformedProtocol = protocolRows.find((row) => !row.phases || row.lock < 1);
const rank = styleRank(330);

if (rotation.size < 6 || failedDirective || malformedProtocol || rank.id !== 'A') {
  console.error('Advanced balance simulation failed.', {
    rotation: [...rotation],
    failedDirective,
    malformedProtocol,
    rank,
  });
  process.exit(1);
}

console.log(`Advanced simulation passed: ${rotation.size} rotating directives, ${protocolRows.length} boss phases, style rank ${rank.id}.`);
