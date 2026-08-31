let context = null;
let enabled = true;

function getContext() {
  if (!enabled) return null;
  if (!context) {
    const AudioContextClass = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!AudioContextClass) return null;
    context = new AudioContextClass();
  }
  if (context.state === 'suspended') context.resume().catch(() => {});
  return context;
}

function tone({ frequency = 440, duration = 0.08, type = 'sine', volume = 0.04, slide = 0 }) {
  const ctx = getContext();
  if (!ctx) return;

  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  const now = ctx.currentTime;

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, now);
  if (slide !== 0) oscillator.frequency.linearRampToValueAtTime(frequency + slide, now + duration);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, volume), now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start(now);
  oscillator.stop(now + duration + 0.02);
}

export function setSoundEnabled(value) {
  enabled = value;
}

export function playSound(name) {
  if (!enabled) return;
  switch (name) {
    case 'tap':
      tone({ frequency: 310, duration: 0.045, type: 'triangle', volume: 0.025, slide: 25 });
      break;
    case 'upgrade':
      tone({ frequency: 420, duration: 0.09, type: 'triangle', volume: 0.045, slide: 210 });
      setTimeout(() => tone({ frequency: 680, duration: 0.09, type: 'sine', volume: 0.035, slide: 100 }), 70);
      break;
    case 'perfect':
      tone({ frequency: 680, duration: 0.04, type: 'sine', volume: 0.018, slide: 45 });
      break;
    case 'strain':
      tone({ frequency: 105, duration: 0.06, type: 'sawtooth', volume: 0.02, slide: -20 });
      break;
    case 'alarm':
      tone({ frequency: 190, duration: 0.11, type: 'square', volume: 0.035, slide: 80 });
      setTimeout(() => tone({ frequency: 250, duration: 0.11, type: 'square', volume: 0.03, slide: -60 }), 115);
      break;
    case 'success':
      tone({ frequency: 390, duration: 0.14, type: 'triangle', volume: 0.045, slide: 180 });
      setTimeout(() => tone({ frequency: 620, duration: 0.16, type: 'sine', volume: 0.04, slide: 160 }), 120);
      break;
    case 'fail':
      tone({ frequency: 210, duration: 0.22, type: 'sawtooth', volume: 0.035, slide: -110 });
      break;
    case 'reveal':
      tone({ frequency: 520, duration: 0.18, type: 'sine', volume: 0.035, slide: 270 });
      break;
    default:
      break;
  }
}

export function vibrate(pattern = 12) {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(pattern);
  }
}
