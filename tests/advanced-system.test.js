import test from 'node:test';
import assert from 'node:assert/strict';

import {
  BOND_EPISODES,
  BOSS_PROTOCOLS,
  DIRECTIVES,
  addStyle,
  bossProtocolFor,
  calculateAdvancedBonus,
  createAdvancedMeta,
  createMissionStyle,
  directiveFor,
  evaluateDirectiveChallenge,
  mapGamepad,
  nextBondEpisode,
  protocolCue,
  protocolEffect,
  styleRank,
} from '../src/advanced-system.js';

test('advanced release has diverse directives and three four-phase boss encounters', () => {
  assert.equal(DIRECTIVES.length, 9);
  assert.equal(new Set(DIRECTIVES.map((directive) => directive.id)).size, DIRECTIVES.length);
  assert.deepEqual(Object.keys(BOSS_PROTOCOLS).sort(), ['museum-vault', 'national-b7', 'old-central']);
  for (const protocols of Object.values(BOSS_PROTOCOLS)) assert.equal(protocols.length, 4);
});

test('night directives are deterministic and the tutorial contract stays standard', () => {
  assert.equal(directiveFor(1, 'harbor-bank', 1).id, 'standard');
  assert.equal(directiveFor(7, 'loan-shark', 7).id, directiveFor(7, 'loan-shark', 7).id);
  const ids = new Set(Array.from({ length: 30 }, (_, index) => directiveFor(index + 2, 'old-central', 9).id));
  assert.ok(ids.size >= 5);
});

test('style events build a mission score and rank up through phantom', () => {
  let style = createMissionStyle();
  style = addStyle(style, 'perfectHack', 2);
  style = addStyle(style, 'nearMiss', 3);
  style = addStyle(style, 'ghostEntry');
  style = addStyle(style, 'protocolClear');
  assert.equal(style.perfectHacks, 2);
  assert.equal(style.nearMisses, 3);
  assert.equal(style.ghostEntryAwarded, true);
  assert.equal(styleRank(style.score).id, 'S');
});

test('directive challenges evaluate each risk condition', () => {
  assert.equal(evaluateDirectiveChallenge('silent-audit', { alert: 18 }).met, true);
  assert.equal(evaluateDirectiveChallenge('silent-audit', { alert: 21 }).met, false);
  assert.equal(evaluateDirectiveChallenge('deadline', { timeLeft: 10 }).met, true);
  assert.equal(evaluateDirectiveChallenge('unstable-grid', { maxCombo: 4 }).met, true);
  assert.equal(evaluateDirectiveChallenge('rolling-blackout', { perfectHacks: 2, panelsRequired: 3 }).met, false);
  assert.equal(evaluateDirectiveChallenge('hunter-shift', { nearMisses: 2 }).met, true);
  assert.equal(evaluateDirectiveChallenge('fragile-evidence', { integrity: 81 }).met, false);
  assert.equal(evaluateDirectiveChallenge('clean-hands', { dashed: false }).met, true);
  assert.equal(evaluateDirectiveChallenge('jackpot-cache', { pickups: 4 }).met, true);
});

test('advanced bonuses combine contract, style and optional challenge rewards', () => {
  const bonus = calculateAdvancedBonus({
    baseReward: 1000,
    styleScore: 500,
    directive: 'hunter-shift',
    challengeMet: true,
  });
  assert.equal(bonus.rank.id, 'S');
  assert.equal(bonus.contractReward, 1400);
  assert.equal(bonus.styleCoins, 180);
  assert.equal(bonus.challengeCoins, 180);
  assert.equal(bonus.totalCoins, 360);
});

test('boss protocol selection clamps to valid lock phases', () => {
  assert.equal(bossProtocolFor('museum-vault', 1).id, 'preservation-pulse');
  assert.equal(bossProtocolFor('museum-vault', 99).id, 'curator-final');
  assert.equal(bossProtocolFor('harbor-bank', 1), null);
});

test('release protocol alternates calm, warning and active windows', () => {
  const protocol = bossProtocolFor('museum-vault', 1);
  assert.equal(protocolCue(protocol, 0).phase, 'calm');
  assert.equal(protocolCue(protocol, 3.4).phase, 'warning');
  assert.equal(protocolCue(protocol, 4.5).phase, 'active');
  const danger = protocolEffect(protocol, protocolCue(protocol, 4.5), { holding: true, dt: 0.5 });
  assert.ok(danger.integrityLoss > 0);
  assert.equal(danger.failureWindow, true);
  const safe = protocolEffect(protocol, protocolCue(protocol, 4.5), { holding: false, dt: 0.5 });
  assert.equal(safe.successWindow, true);
});

test('polarity and rhythm protocols reward correct timing and punish wrong input', () => {
  const polarity = bossProtocolFor('old-central', 1);
  const leftCue = protocolCue(polarity, 0.5);
  const correct = protocolEffect(polarity, leftCue, { holding: true, safe: true, pressure: 40, safeCenter: 50, dt: 0.1 });
  const wrong = protocolEffect(polarity, leftCue, { holding: true, safe: true, pressure: 60, safeCenter: 50, dt: 0.1 });
  assert.ok(correct.progressBonus > 0);
  assert.ok(wrong.noiseGain > 0);
  assert.ok(wrong.progressMultiplier < 1);

  const rhythm = bossProtocolFor('national-b7', 4);
  assert.equal(protocolCue(rhythm, 0.1).phase, 'beat');
  const offBeat = protocolEffect(rhythm, protocolCue(rhythm, 0.9), { holding: true, safe: true, dt: 0.1 });
  assert.equal(offBeat.failureWindow, true);
});

test('crew episodes unlock at bond levels and are marked with stable keys', () => {
  const meta = createAdvancedMeta();
  const episode = nextBondEpisode(meta, 'seojin', 4);
  assert.equal(episode.key, 'seojin:2');
  const after = createAdvancedMeta({ seenEpisodes: [episode.key] });
  assert.equal(nextBondEpisode(after, 'seojin', 4), null);
  assert.equal(Object.keys(BOND_EPISODES).length, 6);
});

test('gamepad mapping supports stick, d-pad, actions and trigger pressure', () => {
  const buttons = Array.from({ length: 16 }, () => ({ pressed: false, value: 0 }));
  buttons[0] = { pressed: true, value: 1 };
  buttons[2] = { pressed: true, value: 1 };
  buttons[7] = { pressed: false, value: 0.8 };
  buttons[15] = { pressed: true, value: 1 };
  const mapped = mapGamepad({ axes: [-0.8, 0.7], buttons });
  assert.equal(mapped.left, true);
  assert.equal(mapped.right, true);
  assert.equal(mapped.down, true);
  assert.equal(mapped.interact, true);
  assert.equal(mapped.skill, true);
  assert.equal(mapped.vaultHold, true);
});
