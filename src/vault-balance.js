export function clampValue(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

export function getVaultTuning(stage, upgrades = {}) {
  const drill = upgrades.drill ?? 0;
  const coolant = upgrades.coolant ?? 0;
  const muffler = upgrades.muffler ?? 0;
  const tutorial = stage.order === 1;
  const boss = Boolean(stage.boss);
  const locks = tutorial ? 2 : boss ? 4 : 3;
  const baseWidth = clampValue(
    31 - stage.difficulty * 1.08 + drill * 1.45 + (tutorial ? 3.2 : 0),
    boss ? 12 : 14,
    tutorial ? 35 : 33,
  );
  return {
    tutorial,
    boss,
    locks,
    baseWidth,
    timeLimit: tutorial
      ? 58 + drill * 1.5
      : 58 + drill * 1.8 - stage.difficulty * 0.62 + (boss ? 17 : 0),
    pressureRise: Math.max(25, 34 - drill * 1.35),
    pressureFall: 50 + drill * 2.15,
    progressRate: Math.max(7.8, 10.2 + drill * 0.88 - stage.difficulty * 0.12),
    centerAmplitude: tutorial ? 6.2 : 8.2 + stage.difficulty * 0.55,
    centerSpeed: tutorial ? 0.5 : 0.61 + stage.difficulty * 0.045,
    safeComboGain: 1.55,
    exactComboGain: 2.05,
    releaseComboDecay: 0.35,
    missComboDecay: 2.1,
    comboGraceSeconds: 0.55,
    heatGain: 7.1 * Math.max(0.45, 1 - coolant * 0.075),
    heatLowGain: 9.7 * Math.max(0.45, 1 - coolant * 0.075),
    heatOverGain: 16 * Math.max(0.45, 1 - coolant * 0.075),
    coolingRate: 16 + coolant * 2.8,
    noiseGain: 5 * Math.max(0.45, 1 - muffler * 0.072),
    noiseLowGain: 6.5 * Math.max(0.45, 1 - muffler * 0.072),
    noiseOverGain: 12.5 * Math.max(0.45, 1 - muffler * 0.072),
    noiseRecovery: 11 + muffler * 2.2,
    rescueSeconds: tutorial ? 12 : 0,
  };
}

export function simulateBaselineVault(stage, upgrades = {}, options = {}) {
  const tuning = getVaultTuning(stage, upgrades);
  const dt = options.dt ?? 0.05;
  const maxSeconds = options.maxSeconds ?? tuning.timeLimit + tuning.rescueSeconds;
  let elapsed = 0;
  let timeLeft = tuning.timeLimit;
  let lock = 1;
  let progress = 0;
  let pressure = 0;
  let heat = 0;
  let noise = 0;
  let comboSeconds = 0;
  let combo = 1;
  let maxCombo = 1;
  let grace = 0;
  let holding = false;
  let rescueUsed = false;

  while (elapsed < maxSeconds && lock <= tuning.locks) {
    const center = clampValue(
      48 + Math.sin(elapsed * tuning.centerSpeed + lock) * tuning.centerAmplitude,
      18,
      82,
    );
    const min = center - tuning.baseWidth / 2;
    const max = center + tuning.baseWidth / 2;

    if (heat > 86 || noise > 88) holding = false;
    else if (pressure < center - 2.2) holding = true;
    else if (pressure > center + 2.2) holding = false;

    pressure += (holding ? tuning.pressureRise : -tuning.pressureFall) * dt;
    pressure = clampValue(pressure, 0, 100);
    const safe = pressure >= min && pressure <= max;
    const exact = safe && Math.abs(pressure - center) / Math.max(1, tuning.baseWidth / 2) < 0.28;

    if (holding && safe) {
      grace = tuning.comboGraceSeconds;
      comboSeconds += dt * (exact ? tuning.exactComboGain : tuning.safeComboGain);
      combo = clampValue(1 + Math.floor(comboSeconds / 1.7), 1, 5);
      maxCombo = Math.max(maxCombo, combo);
      progress += tuning.progressRate * (1 + (combo - 1) * 0.14) * (exact ? 1.12 : 1) * dt;
      heat += tuning.heatGain * dt;
      noise += tuning.noiseGain * dt;
    } else if (holding && pressure < min) {
      grace = Math.max(0, grace - dt);
      if (grace <= 0) comboSeconds = Math.max(0, comboSeconds - tuning.missComboDecay * dt);
      progress += tuning.progressRate * 0.08 * dt;
      heat += tuning.heatLowGain * dt;
      noise += tuning.noiseLowGain * dt;
    } else if (holding) {
      grace = 0;
      comboSeconds = Math.max(0, comboSeconds - 3.2 * dt);
      heat += tuning.heatOverGain * dt;
      noise += tuning.noiseOverGain * dt;
    } else {
      grace = Math.max(0, grace - dt);
      if (grace <= 0) comboSeconds = Math.max(0, comboSeconds - tuning.releaseComboDecay * dt);
      heat -= tuning.coolingRate * dt;
      noise -= tuning.noiseRecovery * dt;
    }

    combo = clampValue(1 + Math.floor(comboSeconds / 1.7), 1, 5);
    heat = clampValue(heat, 0, 100);
    noise = clampValue(noise, 0, 100);
    progress = clampValue(progress, 0, 100);
    elapsed += dt;
    timeLeft -= dt;

    if (progress >= 100) {
      lock += 1;
      progress = 0;
      pressure = Math.min(pressure, 42);
      grace = tuning.comboGraceSeconds;
    }
    if (timeLeft <= 0 && tuning.rescueSeconds > 0 && !rescueUsed) {
      rescueUsed = true;
      timeLeft = tuning.rescueSeconds;
    }
    if (timeLeft <= 0) break;
  }

  return {
    success: lock > tuning.locks,
    elapsed,
    timeLeft,
    completedLocks: Math.min(tuning.locks, lock - 1),
    locks: tuning.locks,
    progress,
    maxCombo,
    heat,
    noise,
    rescueUsed,
  };
}
