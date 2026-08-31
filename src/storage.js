import { SAVE_KEY } from './data.js';
import { createInitialState, normalizeState } from './engine.js';

function resolveStorage(storage) {
  if (storage) return storage;
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

export function loadState(storage) {
  const target = resolveStorage(storage);
  if (!target) return createInitialState();
  try {
    const raw = target.getItem(SAVE_KEY);
    if (!raw) return createInitialState();
    return normalizeState(JSON.parse(raw));
  } catch {
    return createInitialState();
  }
}

export function saveState(state, storage) {
  const target = resolveStorage(storage);
  if (!target) return false;
  try {
    target.setItem(SAVE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export function clearState(storage) {
  const target = resolveStorage(storage);
  if (!target) return false;
  try {
    target.removeItem(SAVE_KEY);
    return true;
  } catch {
    return false;
  }
}
