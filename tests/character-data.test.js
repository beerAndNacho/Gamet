import test from 'node:test';
import assert from 'node:assert/strict';

import {
  BOND_THRESHOLDS,
  CHARACTERS,
  JOB_CONTACT_ORDER,
  getBondLevel,
  getBondProgress,
  getBondTitle,
  getCharacterById,
  getJobContact,
  pickCharacterLine,
} from '../src/character-data.js';

test('crew roster contains six original characters with unique gameplay identities', () => {
  assert.equal(CHARACTERS.length, 6);
  assert.equal(new Set(CHARACTERS.map((character) => character.id)).size, CHARACTERS.length);
  assert.equal(new Set(CHARACTERS.map((character) => character.intervention)).size, CHARACTERS.length);

  for (const character of CHARACTERS) {
    assert.ok(character.name.length >= 2);
    assert.ok(character.role.length >= 3);
    assert.ok(character.skillName.length >= 3);
    assert.ok(character.skillDescription.length >= 10);
    assert.ok(character.lines.home.length >= 3);
    assert.ok(character.lines.job.length >= 3);
    assert.ok(character.lines.safe.length >= 3);
    assert.ok(character.lines.danger.length >= 3);
    assert.ok(character.lines.success.length >= 3);
    assert.ok(character.lines.fail.length >= 3);
  }
});

test('unknown character ids safely fall back to the field captain', () => {
  assert.equal(getCharacterById('missing').id, CHARACTERS[0].id);
  assert.equal(getCharacterById('nabi').art, 'drone');
});

test('job contacts rotate through defined crew members', () => {
  assert.equal(JOB_CONTACT_ORDER.length, 4);
  assert.equal(getJobContact(1).id, JOB_CONTACT_ORDER[0]);
  assert.equal(getJobContact(5).id, JOB_CONTACT_ORDER[0]);
  assert.equal(getJobContact(8).id, JOB_CONTACT_ORDER[3]);
});

test('bond progression follows six readable relationship levels', () => {
  assert.deepEqual(BOND_THRESHOLDS, [0, 4, 10, 19, 31, 46]);
  assert.equal(getBondLevel(0), 1);
  assert.equal(getBondLevel(4), 2);
  assert.equal(getBondLevel(18), 3);
  assert.equal(getBondLevel(46), 6);
  assert.equal(getBondLevel(999), 6);
  assert.equal(getBondTitle(1), '낯선 동료');
  assert.equal(getBondTitle(6), '평생 동료');

  const progress = getBondProgress(7);
  assert.equal(progress.level, 2);
  assert.equal(progress.current, 3);
  assert.equal(progress.required, 6);
  assert.equal(progress.percentage, 50);
});

test('dialogue selection is deterministic for a given seed and category', () => {
  const character = getCharacterById('harin');
  assert.equal(
    pickCharacterLine(character, 'home', 7),
    pickCharacterLine(character, 'home', 7),
  );
  assert.notEqual(
    pickCharacterLine(character, 'home', 7),
    pickCharacterLine(character, 'home', 8),
  );
});
