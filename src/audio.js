let context = null;
let master = null;
let musicGain = null;
let sfxGain = null;
let enabled = true;
let currentScene = 'title';
let musicTimer = null;
let musicStep = 0;

const SCENE_PATTERNS = {
  title: {
    tempo: 520,
    bass: [55, 55, 65.41, 49],
    melody: [220, 0, 246.94, 0, 293.66, 0, 246.94, 0, 220, 0, 196, 0, 164.81, 0, 196, 0],
  },
  hub: {
    tempo: 500,
    bass: [55, 61.74, 73.42, 65.41],
    melody: [0, 329.63, 0, 392, 0, 440, 0, 392, 0, 293.66, 0, 349.23, 0, 392, 0, 349.23],
  },
  field: {
    tempo: 330,
    bass: [65.41, 65.41, 73.42, 58.27],
    melody: [261.63, 0, 293.66, 0, 311.13, 293.66, 0, 0, 261.63, 0, 233.08, 0, 220, 0, 233.08, 0],
  },
  vault: {
    tempo: 250,
    bass: [73.42, 69.3, 65.41, 58.27],
    melody: [293.66, 0, 311.13, 0, 349.23, 0, 311.13, 0, 293.66, 0, 261.63, 0, 233.08, 0, 261.63, 0],
  },
  result: {
    tempo: 440,
    bass: [73.42, 98, 110, 82.41],
    melody: [293.66, 369.99, 440, 587.33, 0, 440, 369.99, 293.66, 0, 329.63, 392, 493.88, 0, 392, 329.63, 0],
  },
};

function ensureAudio() {
  if (context) return context;
  const Context = globalThis.AudioContext || globalThis.webkitAudioContext;
  if (!Context) return null;
  context = new Context();
  master = context.createGain();
  musicGain = context.createGain();
  sfxGain = context.createGain();
  master.gain.value = 0.72;
  musicGain.gain.value = 0.16;
  sfxGain.gain.value = 0.9;
  musicGain.connect(master);
  sfxGain.connect(master);
  master.connect(context.destination);
  return context;
}

function note({ frequency, duration = 0.1, volume = 0.05, type = 'square', destination = 'sfx', delay = 0, slide = 0 }) {
  if (!enabled || !frequency) return;
  const ctx = ensureAudio();
  if (!ctx) return;
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  const out = destination === 'music' ? musicGain : sfxGain;
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  const start = ctx.currentTime + delay;
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(Math.max(20, frequency), start);
  if (slide) oscillator.frequency.linearRampToValueAtTime(Math.max(20, frequency + slide), start + duration);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, volume), start + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gain);
  gain.connect(out);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.03);
}

function musicTick() {
  if (!enabled || !context || context.state !== 'running') return;
  const pattern = SCENE_PATTERNS[currentScene] ?? SCENE_PATTERNS.hub;
  const index = musicStep % pattern.melody.length;
  const bass = pattern.bass[Math.floor(index / 4) % pattern.bass.length];
  const melody = pattern.melody[index];

  if (index % 2 === 0) {
    note({ frequency: bass, duration: pattern.tempo / 1000 * 1.7, volume: 0.17, type: 'triangle', destination: 'music' });
  }
  if (melody) {
    note({ frequency: melody, duration: pattern.tempo / 1000 * 0.68, volume: 0.07, type: currentScene === 'vault' ? 'square' : 'triangle', destination: 'music' });
  }
  if (currentScene === 'field' && [3, 7, 11, 15].includes(index)) {
    note({ frequency: 880, duration: 0.035, volume: 0.025, type: 'square', destination: 'music' });
  }
  if (currentScene === 'vault' && index % 4 === 3) {
    note({ frequency: 120, duration: 0.045, volume: 0.06, type: 'square', destination: 'music' });
  }
  musicStep += 1;
}

function restartMusic() {
  if (musicTimer) clearInterval(musicTimer);
  musicTimer = null;
  if (!enabled) return;
  const pattern = SCENE_PATTERNS[currentScene] ?? SCENE_PATTERNS.hub;
  musicStep = 0;
  musicTick();
  musicTimer = setInterval(musicTick, pattern.tempo);
}

export function unlockAudio() {
  const ctx = ensureAudio();
  if (!ctx) return;
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  if (!musicTimer) restartMusic();
}

export function setAudioEnabled(value) {
  enabled = value === true;
  if (master && context) master.gain.setTargetAtTime(enabled ? 0.72 : 0, context.currentTime, 0.03);
  if (enabled) restartMusic();
  else if (musicTimer) {
    clearInterval(musicTimer);
    musicTimer = null;
  }
}

export function setMusicScene(scene) {
  if (currentScene === scene) return;
  currentScene = scene;
  restartMusic();
}

export function playSfx(name) {
  if (!enabled) return;
  switch (name) {
    case 'move':
      note({ frequency: 105, duration: 0.025, volume: 0.015, type: 'square' });
      break;
    case 'interact':
      note({ frequency: 350, duration: 0.055, volume: 0.035, type: 'square', slide: 60 });
      break;
    case 'dialogue':
      note({ frequency: 510, duration: 0.035, volume: 0.025, type: 'square', slide: 25 });
      break;
    case 'coin':
      note({ frequency: 660, duration: 0.06, volume: 0.04, type: 'square', slide: 120 });
      note({ frequency: 880, duration: 0.07, volume: 0.03, type: 'square', delay: 0.06 });
      break;
    case 'intel':
      note({ frequency: 440, duration: 0.12, volume: 0.035, type: 'triangle', slide: 330 });
      break;
    case 'hack-good':
      note({ frequency: 520, duration: 0.08, volume: 0.04, type: 'square', slide: 180 });
      note({ frequency: 780, duration: 0.08, volume: 0.035, type: 'square', delay: 0.07 });
      break;
    case 'hack-bad':
      note({ frequency: 190, duration: 0.18, volume: 0.05, type: 'sawtooth', slide: -70 });
      break;
    case 'alert':
      note({ frequency: 220, duration: 0.11, volume: 0.05, type: 'square', slide: 70 });
      note({ frequency: 290, duration: 0.11, volume: 0.04, type: 'square', delay: 0.12, slide: -60 });
      break;
    case 'safe':
      note({ frequency: 720, duration: 0.035, volume: 0.018, type: 'sine', slide: 60 });
      break;
    case 'strain':
      note({ frequency: 115, duration: 0.06, volume: 0.025, type: 'sawtooth', slide: -25 });
      break;
    case 'lock':
      note({ frequency: 360, duration: 0.08, volume: 0.04, type: 'square', slide: 160 });
      note({ frequency: 620, duration: 0.1, volume: 0.035, type: 'square', delay: 0.08 });
      break;
    case 'skill':
      note({ frequency: 260, duration: 0.24, volume: 0.035, type: 'triangle', slide: 520 });
      note({ frequency: 780, duration: 0.18, volume: 0.025, type: 'sine', delay: 0.11, slide: 120 });
      break;
    case 'loot':
      note({ frequency: 392, duration: 0.12, volume: 0.04, type: 'triangle', slide: 180 });
      note({ frequency: 587.33, duration: 0.15, volume: 0.04, type: 'square', delay: 0.1, slide: 180 });
      break;
    case 'legendary':
      [392, 493.88, 587.33, 783.99].forEach((frequency, index) => {
        note({ frequency, duration: 0.18, volume: 0.04, type: 'triangle', delay: index * 0.105, slide: 70 });
      });
      break;
    case 'success':
      [293.66, 369.99, 440, 587.33].forEach((frequency, index) => {
        note({ frequency, duration: 0.16, volume: 0.04, type: 'square', delay: index * 0.09 });
      });
      break;
    case 'fail':
      note({ frequency: 240, duration: 0.28, volume: 0.05, type: 'sawtooth', slide: -140 });
      break;
    case 'upgrade':
      note({ frequency: 390, duration: 0.09, volume: 0.04, type: 'square', slide: 160 });
      note({ frequency: 620, duration: 0.11, volume: 0.035, type: 'square', delay: 0.08, slide: 120 });
      break;
    default:
      break;
  }
}
