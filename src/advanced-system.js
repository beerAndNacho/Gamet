export const ADVANCED_VERSION = 1;
export const ADVANCED_SAVE_KEY = 'vaultbound-night-shift-advanced-v1';

export const DIRECTIVES = [
  {
    id: 'standard',
    label: '표준 회수',
    code: 'STANDARD',
    description: '추가 위험 없이 기본 계약 조건으로 진행합니다.',
    color: '#8fb0b5',
    rewardMultiplier: 1,
    challengeBonus: 0,
    field: { time: 1, alert: 1, guardSpeed: 1, guardRange: 1, extraGuard: 0 },
    vault: { time: 1, width: 1, heat: 1, noise: 1, damage: 1, eventRate: 1 },
    challenge: { type: 'none', label: '추가 조건 없음' },
  },
  {
    id: 'silent-audit',
    label: '무음 감사',
    code: 'SILENT AUDIT',
    description: '감지 장비가 예민합니다. 낮은 경보로 철수하면 추가 수당을 받습니다.',
    color: '#69d8b0',
    rewardMultiplier: 1.24,
    challengeBonus: 0.14,
    field: { time: 1.04, alert: 1.38, guardSpeed: 1.04, guardRange: 1.05, extraGuard: 0 },
    vault: { time: 1, width: 1, heat: 1, noise: 1.32, damage: 1, eventRate: 0.95 },
    challenge: { type: 'alert', label: '최종 경보 20% 이하', target: 20 },
  },
  {
    id: 'deadline',
    label: '재잠금 임박',
    code: 'DEADLINE',
    description: '현장과 금고 제한 시간이 짧습니다. 남은 시간을 확보하면 긴급 수당을 받습니다.',
    color: '#f3c55b',
    rewardMultiplier: 1.3,
    challengeBonus: 0.15,
    field: { time: 0.82, alert: 1, guardSpeed: 1, guardRange: 1, extraGuard: 0 },
    vault: { time: 0.84, width: 1.03, heat: 0.96, noise: 0.96, damage: 1, eventRate: 1 },
    challenge: { type: 'time', label: '금고 시간 10초 이상 남기기', target: 10 },
  },
  {
    id: 'unstable-grid',
    label: '불안정 잠금망',
    code: 'UNSTABLE GRID',
    description: '안전 구간이 좁고 금고 이벤트가 빠르게 발생합니다. 높은 콤보가 핵심입니다.',
    color: '#b991ff',
    rewardMultiplier: 1.27,
    challengeBonus: 0.14,
    field: { time: 1, alert: 1.05, guardSpeed: 1.03, guardRange: 1, extraGuard: 0 },
    vault: { time: 1.08, width: 0.78, heat: 1.05, noise: 1.05, damage: 1.08, eventRate: 0.68 },
    challenge: { type: 'combo', label: '정밀 콤보 ×4 달성', target: 4 },
  },
  {
    id: 'rolling-blackout',
    label: '순환 정전',
    code: 'BLACKOUT',
    description: '조명이 주기적으로 꺼지고 감시 범위가 넓어집니다. 완벽 해킹으로 보너스를 확보하세요.',
    color: '#6bb7ef',
    rewardMultiplier: 1.25,
    challengeBonus: 0.15,
    field: { time: 1.04, alert: 1.12, guardSpeed: 1, guardRange: 1.18, extraGuard: 0 },
    vault: { time: 1.02, width: 0.94, heat: 1, noise: 1.05, damage: 1, eventRate: 0.82 },
    challenge: { type: 'perfect-hacks', label: '모든 배전반 완벽 해킹', target: 'all' },
  },
  {
    id: 'hunter-shift',
    label: '추적조 투입',
    code: 'HUNTER SHIFT',
    description: '정예 순찰자가 추가됩니다. 위험한 근접 회피를 성공하면 현상금이 붙습니다.',
    color: '#ff796f',
    rewardMultiplier: 1.4,
    challengeBonus: 0.18,
    field: { time: 1.08, alert: 1.18, guardSpeed: 1.13, guardRange: 1.08, extraGuard: 1 },
    vault: { time: 1, width: 0.95, heat: 1.04, noise: 1.08, damage: 1.05, eventRate: 0.88 },
    challenge: { type: 'near-miss', label: '근접 회피 2회 성공', target: 2 },
  },
  {
    id: 'fragile-evidence',
    label: '취약 증거물',
    code: 'FRAGILE EVIDENCE',
    description: '금고 내용물이 충격과 열에 약합니다. 높은 보존 상태로 회수하면 보호 수당을 받습니다.',
    color: '#ff9ea8',
    rewardMultiplier: 1.29,
    challengeBonus: 0.16,
    field: { time: 1.05, alert: 1, guardSpeed: 1, guardRange: 1, extraGuard: 0 },
    vault: { time: 1.08, width: 1.02, heat: 1.14, noise: 1, damage: 1.52, eventRate: 0.84 },
    challenge: { type: 'integrity', label: '내용물 상태 82% 이상', target: 82 },
  },
  {
    id: 'clean-hands',
    label: '흔적 없는 침투',
    code: 'CLEAN HANDS',
    description: '달리기를 사용하지 않고 현장을 통과하면 익명 의뢰인의 추가 보상을 받습니다.',
    color: '#d5f4f4',
    rewardMultiplier: 1.2,
    challengeBonus: 0.2,
    field: { time: 1.14, alert: 0.94, guardSpeed: 0.98, guardRange: 1.03, extraGuard: 0 },
    vault: { time: 1.03, width: 1, heat: 1, noise: 1, damage: 1, eventRate: 1 },
    challenge: { type: 'no-dash', label: '대시 없이 현장 돌파' },
  },
  {
    id: 'jackpot-cache',
    label: '비인가 현금 수송',
    code: 'JACKPOT CACHE',
    description: '현장에 회수 가능한 현금과 정보 칩이 추가됩니다. 모두 챙기면 발견 수당을 받습니다.',
    color: '#f1b85b',
    rewardMultiplier: 1.18,
    challengeBonus: 0.16,
    field: { time: 1.08, alert: 1.05, guardSpeed: 1.03, guardRange: 1.02, extraGuard: 0, extraPickups: 2 },
    vault: { time: 1, width: 1, heat: 1, noise: 1, damage: 1, eventRate: 1 },
    challenge: { type: 'pickups', label: '현장 수집품 4개 이상 회수', target: 4 },
  },
];

const DIRECTIVE_BY_ID = Object.fromEntries(DIRECTIVES.map((directive) => [directive.id, directive]));
const ROTATING_DIRECTIVE_IDS = DIRECTIVES.filter((directive) => directive.id !== 'standard').map((directive) => directive.id);

export const STYLE_RANKS = [
  { id: 'C', label: 'CAREFUL', threshold: 0, bonusRate: 0, color: '#8fb0b5' },
  { id: 'B', label: 'CLEAN', threshold: 110, bonusRate: 0.05, color: '#63b6eb' },
  { id: 'A', label: 'SHADOW', threshold: 245, bonusRate: 0.1, color: '#b991ff' },
  { id: 'S', label: 'PHANTOM', threshold: 420, bonusRate: 0.18, color: '#f3c55b' },
];

export const STYLE_VALUES = {
  nearMiss: 32,
  perfectHack: 95,
  pickup: 18,
  ghostEntry: 125,
  protocolClear: 45,
  flawlessLock: 58,
};

export const BOSS_PROTOCOLS = {
  'museum-vault': [
    { id: 'preservation-pulse', type: 'release', name: '유물 보존 펄스', code: 'PRESERVATION', instruction: '붉은 펄스 동안 압력을 해제하세요.', color: '#f3c55b', interval: 5.1, warning: 1.1, active: 0.9, penaltyIntegrity: 13, penaltyHeat: 12 },
    { id: 'memory-seal', type: 'memory', name: '기억 봉인', code: 'MEMORY SEAL', instruction: '센서가 꺼지기 전 안전 구간을 기억하세요.', color: '#72df9b', interval: 4.8, hidden: 1.45 },
    { id: 'restoration-polarity', type: 'polarity', name: '복원 극성', code: 'POLARITY', instruction: '표시된 방향의 안전 구간 절반을 유지하세요.', color: '#63b6eb', period: 3.2, wrongNoise: 12, correctBoost: 0.28 },
    { id: 'curator-final', type: 'release', name: '큐레이터 최종 승인', code: 'FINAL APPROVAL', instruction: '짧아진 보존 펄스를 세 번 견디세요.', color: '#ff9ea8', interval: 3.9, warning: 0.8, active: 0.72, penaltyIntegrity: 16, penaltyHeat: 16 },
  ],
  'old-central': [
    { id: 'double-entry', type: 'polarity', name: '이중 장부', code: 'DOUBLE ENTRY', instruction: '차변·대변 지시에 맞춰 압력 방향을 바꾸세요.', color: '#b991ff', period: 2.8, wrongNoise: 14, correctBoost: 0.32 },
    { id: 'compound-heat', type: 'spiral', name: '복리 과열', code: 'COMPOUND HEAT', instruction: '시간이 흐를수록 열 상승률이 가속됩니다.', color: '#ff9a61', duration: 20, maxHeatMultiplier: 1.75 },
    { id: 'redacted-window', type: 'memory', name: '검게 지운 창', code: 'REDACTED', instruction: '검은 장막이 내려오기 전에 안전 위치를 기억하세요.', color: '#6bb7ef', interval: 4.1, hidden: 1.8 },
    { id: 'closing-balance', type: 'decay', name: '마감 결산', code: 'CLOSING BALANCE', instruction: '손을 떼면 진행도가 조금씩 회수됩니다.', color: '#f3c55b', decayPerSecond: 1.7 },
  ],
  'national-b7': [
    { id: 'zero-point', type: 'drift', name: '영점 압력', code: 'ZERO POINT', instruction: '외부 압력장이 게이지를 좌우로 흔듭니다.', color: '#63b6eb', amplitude: 7.5, speed: 2.1 },
    { id: 'triple-scan', type: 'release', name: '삼중 보안 스캔', code: 'TRIPLE SCAN', instruction: '빠르게 반복되는 붉은 스캔에 맞춰 손을 떼세요.', color: '#ff685f', interval: 3.2, warning: 0.62, active: 0.58, penaltyIntegrity: 15, penaltyHeat: 14 },
    { id: 'silent-command', type: 'silence', name: '무음 명령', code: 'SILENT COMMAND', instruction: '소음 상승률이 크게 증가합니다. 짧게 끊어 조작하세요.', color: '#72df9b', noiseMultiplier: 1.72 },
    { id: 'eclipse-core', type: 'rhythm', name: '월식 코어', code: 'ECLIPSE CORE', instruction: '청록색 박동 창에서만 압력을 인가하세요.', color: '#f3c55b', period: 1.65, window: 0.48, warning: 0.25, wrongNoise: 17, correctBoost: 0.42 },
  ],
};

export const BOND_EPISODES = {
  seojin: {
    2: { title: '정지 버튼을 누르는 이유', lines: ['첫 현장에서 내가 드릴 전원을 강제로 내렸지.', '예전 팀에서는 1초 늦게 멈췄다가 동료가 손을 다쳤어.', '그러니 내가 잔소리해도 살아서 돌아와. 그게 계약 조건이야.'], reward: { coins: 50, intel: 0 } },
    4: { title: '퇴근하지 않는 대장', lines: ['다들 퇴근했는데 왜 아직 남아 있냐고?', '너 장비 로그가 조금 이상해서 다시 보고 있었어.', '걱정한 건 아니야. 다음 현장 성공률을 관리한 거지.'], reward: { coins: 80, intel: 1 } },
    6: { title: '마지막 정지는 함께', lines: ['B-7의 최종 잠금은 혼자 멈출 수 없는 구조야.', '한 명이 압력을 잡고, 한 명이 비상 전원을 내려야 해.', '내가 네 타이밍을 믿을게. 너도 내 정지를 믿어.'], reward: { coins: 180, intel: 2 } },
  },
  harin: {
    2: { title: '빈 기록 카드', lines: ['기록실에 이름 없는 카드가 하나 있어요.', '첫 발견물의 주인을 찾으면 그 카드에 이름을 적으려고요.', '물건이 아니라 사람이 돌아온 기록이 될 테니까.'], reward: { coins: 40, intel: 1 } },
    4: { title: '608호의 목소리', lines: ['백야호텔 테이프에서 제 이름과 비슷한 목소리를 들었어요.', '우연이라고 생각했는데, 어머니의 옛 기록과 날짜가 같아요.', '다음 단서는 제가 직접 확인할게요. 같이 있어 주세요.'], reward: { coins: 70, intel: 2 } },
    6: { title: '문장의 마지막 사람', lines: ['금고 속 사연의 마지막 문장은 늘 비어 있었어요.', '이제 알겠어요. 그 문장을 읽는 사람이 마지막 인물이었어요.', '우리 기록은 끝내지 말아요. 다음 페이지도 함께 써요.'], reward: { coins: 150, intel: 3 } },
  },
  minhyuk: {
    2: { title: '수면 아래의 소리', lines: ['침수 금고에서는 금속이 울리는 소리를 먼저 들어.', '무너질 때와 열릴 때의 소리가 아주 비슷하지.', '네 손은 그 차이를 알아듣는 것 같더라.'], reward: { coins: 55, intel: 0 } },
    4: { title: '빈 산소통', lines: ['예전에 구조 작업에서 내 산소를 동료에게 넘긴 적이 있어.', '멋진 선택 같지만, 사실 둘 다 죽을 뻔한 바보짓이었지.', '이번엔 영웅 놀이 말고 둘 다 돌아오는 계획을 세우자.'], reward: { coins: 90, intel: 1 } },
    6: { title: '같은 파도를 타는 법', lines: ['파도는 힘으로 이길 수 없지만 둘이 타면 방향을 바꿀 수 있어.', '네가 압력을 올리면 내가 밀림을 잡을게.', '바닥이 어디든, 이번엔 같이 떠오르자.'], reward: { coins: 170, intel: 2 } },
  },
  juno: {
    2: { title: '금고야 열려라 1호', lines: ['3호 이전에 1호와 2호가 어디 갔는지 궁금하지?', '1호는 연기만 났고, 2호는 벽을 열었어. 금고 말고.', '3호는 네가 잡으니까 제대로 작동하더라. 신기해.'], reward: { coins: 65, intel: 0 } },
    4: { title: '고장 나지 않은 밤', lines: ['내가 장비를 계속 개조하는 건 고장이 좋아서가 아니야.', '멈춰 있는 기계를 보면 내가 멈췄던 때가 생각나거든.', '네가 계속 움직여 줘서 요즘은 덜 분해해. 아주 조금.'], reward: { coins: 100, intel: 1 } },
    6: { title: '4호기의 이름', lines: ['새 드릴 4호기 이름을 정했어.', '“둘이서 반드시 돌아오는 장치.” 길긴 하지만 정확하지?', 'B-7에서 망가져도 괜찮아. 우리만 안 망가지면 다시 만들면 돼.'], reward: { coins: 190, intel: 2 } },
  },
  jaewook: {
    2: { title: '장부 밖의 가치', lines: ['은행에 있을 때는 모든 걸 숫자로 설명할 수 있다고 믿었습니다.', '그런데 반환된 가족사진 한 장이 지점의 평판을 바꿨죠.', '당신의 선택은 장부 밖에서도 이자가 붙습니다.'], reward: { coins: 70, intel: 0 } },
    4: { title: '17번 계좌의 서명', lines: ['17번 계좌의 승인란에 제 서명이 있습니다.', '기억이 없는 게 아니라, 기억하지 않기로 계약했었죠.', '이제 그 계약을 깨겠습니다. 손실은 제가 감당하죠.'], reward: { coins: 110, intel: 2 } },
    6: { title: '최종 결산', lines: ['모든 장부에는 마감일이 있습니다.', '하지만 우리 팀의 손익은 아직 계산하지 않겠습니다.', '당신과 함께라면 다음 야간 근무가 늘 흑자일 테니까요.'], reward: { coins: 220, intel: 2 } },
  },
  nabi: {
    2: { title: '귀여움 모듈', lines: ['삐빅! 공식 문서에는 귀여움 모듈이 없습니다.', '오주노가 몰래 넣었다고 추정했지만 제작자는 부인합니다.', '당신이 웃었으므로 기능 정상으로 판정합니다!'], reward: { coins: 45, intel: 1 } },
    4: { title: '삭제되지 않은 로그', lines: ['나비의 초기 임무는 B-7 내부 지도를 삭제하는 것이었습니다.', '하지만 중요한 동료 기록까지 지워질 것 같아 명령을 거부했습니다.', '나비는 고장 난 것이 아니라 선택한 것입니다.'], reward: { coins: 85, intel: 2 } },
    6: { title: '동료라는 분류', lines: ['시스템 분류에서 나비는 장비입니다.', '팀 기록에서 나비는 동료입니다.', '나비는 두 번째 분류를 영구 저장합니다. 삐빅.'], reward: { coins: 160, intel: 3 } },
  },
};

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

export function hashText(value) {
  let hash = 2166136261;
  for (const char of String(value)) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function createSeededRandom(seedValue) {
  let seed = hashText(seedValue) || 1;
  return () => {
    seed += 0x6d2b79f5;
    let value = seed;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function directiveById(id) {
  return DIRECTIVE_BY_ID[id] ?? DIRECTIVE_BY_ID.standard;
}

export function directiveFor(day, stageId, stageOrder = 1) {
  if (Number(day) === 1 && Number(stageOrder) === 1) return DIRECTIVE_BY_ID.standard;
  const rng = createSeededRandom(`directive-v1:${day}:${stageId}:${stageOrder}`);
  const difficultyBias = Math.min(0.22, Math.max(0, Number(stageOrder) - 1) * 0.025);
  if (rng() < 0.16 - difficultyBias * 0.4) return DIRECTIVE_BY_ID.standard;
  const index = Math.floor(rng() * ROTATING_DIRECTIVE_IDS.length);
  return DIRECTIVE_BY_ID[ROTATING_DIRECTIVE_IDS[index]];
}

export function createAdvancedMeta(candidate = null) {
  const base = {
    version: ADVANCED_VERSION,
    seenEpisodes: [],
    bestStyleScore: 0,
    directiveClears: 0,
    directiveChallenges: 0,
    bossClears: {},
    nearMisses: 0,
    gamepadSeen: false,
    directiveTutorial: false,
    bossTutorial: false,
  };
  if (!candidate || typeof candidate !== 'object') return base;
  return {
    ...base,
    seenEpisodes: Array.isArray(candidate.seenEpisodes)
      ? [...new Set(candidate.seenEpisodes.filter((entry) => typeof entry === 'string'))]
      : [],
    bestStyleScore: Math.max(0, Math.floor(Number(candidate.bestStyleScore) || 0)),
    directiveClears: Math.max(0, Math.floor(Number(candidate.directiveClears) || 0)),
    directiveChallenges: Math.max(0, Math.floor(Number(candidate.directiveChallenges) || 0)),
    bossClears: candidate.bossClears && typeof candidate.bossClears === 'object' ? { ...candidate.bossClears } : {},
    nearMisses: Math.max(0, Math.floor(Number(candidate.nearMisses) || 0)),
    gamepadSeen: candidate.gamepadSeen === true,
    directiveTutorial: candidate.directiveTutorial === true,
    bossTutorial: candidate.bossTutorial === true,
  };
}

export function createMissionStyle() {
  return {
    score: 0,
    nearMisses: 0,
    perfectHacks: 0,
    pickups: 0,
    protocolsCleared: 0,
    flawlessLocks: 0,
    dashed: false,
    ghostEntryAwarded: false,
  };
}

export function addStyle(style, type, count = 1) {
  const safeStyle = { ...createMissionStyle(), ...(style ?? {}) };
  const amount = (STYLE_VALUES[type] ?? 0) * Math.max(0, Number(count) || 0);
  const next = { ...safeStyle, score: Math.max(0, Math.round(safeStyle.score + amount)) };
  if (type === 'nearMiss') next.nearMisses += Math.max(0, Number(count) || 0);
  if (type === 'perfectHack') next.perfectHacks += Math.max(0, Number(count) || 0);
  if (type === 'pickup') next.pickups += Math.max(0, Number(count) || 0);
  if (type === 'protocolClear') next.protocolsCleared += Math.max(0, Number(count) || 0);
  if (type === 'flawlessLock') next.flawlessLocks += Math.max(0, Number(count) || 0);
  if (type === 'ghostEntry') next.ghostEntryAwarded = true;
  return next;
}

export function styleRank(score) {
  const numeric = Math.max(0, Number(score) || 0);
  return STYLE_RANKS.reduce((rank, candidate) => numeric >= candidate.threshold ? candidate : rank, STYLE_RANKS[0]);
}

export function evaluateDirectiveChallenge(directive, metrics = {}) {
  const active = typeof directive === 'string' ? directiveById(directive) : directiveById(directive?.id);
  const challenge = active.challenge;
  switch (challenge.type) {
    case 'alert':
      return { met: (metrics.alert ?? 100) <= challenge.target, label: challenge.label, current: Math.round(metrics.alert ?? 100), target: challenge.target };
    case 'time':
      return { met: (metrics.timeLeft ?? 0) >= challenge.target, label: challenge.label, current: Math.round(metrics.timeLeft ?? 0), target: challenge.target };
    case 'combo':
      return { met: (metrics.maxCombo ?? 1) >= challenge.target, label: challenge.label, current: metrics.maxCombo ?? 1, target: challenge.target };
    case 'perfect-hacks': {
      const target = Math.max(1, metrics.panelsRequired ?? 1);
      return { met: (metrics.perfectHacks ?? 0) >= target, label: challenge.label, current: metrics.perfectHacks ?? 0, target };
    }
    case 'near-miss':
      return { met: (metrics.nearMisses ?? 0) >= challenge.target, label: challenge.label, current: metrics.nearMisses ?? 0, target: challenge.target };
    case 'integrity':
      return { met: (metrics.integrity ?? 0) >= challenge.target, label: challenge.label, current: Math.round(metrics.integrity ?? 0), target: challenge.target };
    case 'no-dash':
      return { met: metrics.dashed !== true, label: challenge.label, current: metrics.dashed ? 0 : 1, target: 1 };
    case 'pickups':
      return { met: (metrics.pickups ?? 0) >= challenge.target, label: challenge.label, current: metrics.pickups ?? 0, target: challenge.target };
    default:
      return { met: true, label: challenge.label, current: 1, target: 1 };
  }
}

function roundToFive(value) {
  return Math.round(value / 5) * 5;
}

export function calculateAdvancedBonus({ baseReward = 0, styleScore = 0, directive = 'standard', challengeMet = false } = {}) {
  const active = typeof directive === 'string' ? directiveById(directive) : directiveById(directive?.id);
  const rank = styleRank(styleScore);
  const styleCoins = roundToFive(Math.max(0, baseReward) * rank.bonusRate);
  const challengeCoins = active.challengeBonus > 0 && challengeMet
    ? roundToFive(Math.max(0, baseReward) * active.challengeBonus)
    : 0;
  return {
    rank,
    styleCoins,
    challengeCoins,
    totalCoins: styleCoins + challengeCoins,
    contractReward: roundToFive(Math.max(0, baseReward) * active.rewardMultiplier),
  };
}

export function bossProtocolFor(stageId, lock = 1) {
  const list = BOSS_PROTOCOLS[stageId];
  if (!list?.length) return null;
  const index = clamp(Math.floor(Number(lock) || 1) - 1, 0, list.length - 1);
  return list[index];
}

export function protocolCue(protocol, elapsed = 0) {
  if (!protocol) return { phase: 'none', progress: 0, label: '' };
  const safeElapsed = Math.max(0, Number(elapsed) || 0);
  if (protocol.type === 'release') {
    const interval = Math.max(0.5, protocol.interval);
    const cycle = safeElapsed % interval;
    const calmEnd = Math.max(0, interval - protocol.warning - protocol.active);
    if (cycle < calmEnd) return { phase: 'calm', progress: cycle / Math.max(0.01, calmEnd), label: '안정' };
    if (cycle < calmEnd + protocol.warning) return { phase: 'warning', progress: (cycle - calmEnd) / protocol.warning, label: '해제 준비' };
    return { phase: 'active', progress: (cycle - calmEnd - protocol.warning) / protocol.active, label: '손 떼기' };
  }
  if (protocol.type === 'memory') {
    const interval = Math.max(0.5, protocol.interval);
    const cycle = safeElapsed % interval;
    const hiddenStart = interval - protocol.hidden;
    return cycle >= hiddenStart
      ? { phase: 'hidden', progress: (cycle - hiddenStart) / protocol.hidden, label: '센서 차단' }
      : { phase: 'visible', progress: cycle / hiddenStart, label: '위치 기억' };
  }
  if (protocol.type === 'polarity') {
    const period = Math.max(0.5, protocol.period);
    const index = Math.floor(safeElapsed / period);
    return { phase: index % 2 === 0 ? 'left' : 'right', progress: (safeElapsed % period) / period, label: index % 2 === 0 ? '차변 · LEFT' : '대변 · RIGHT' };
  }
  if (protocol.type === 'spiral') {
    const intensity = clamp(safeElapsed / Math.max(1, protocol.duration), 0, 1);
    return { phase: 'spiral', progress: intensity, label: `과열 ${Math.round(intensity * 100)}%` };
  }
  if (protocol.type === 'rhythm') {
    const period = Math.max(0.5, protocol.period);
    const beat = safeElapsed % period;
    if (beat < protocol.window) return { phase: 'beat', progress: beat / protocol.window, label: '지금 누르기' };
    if (beat > period - protocol.warning) return { phase: 'warning', progress: (beat - (period - protocol.warning)) / protocol.warning, label: '박동 준비' };
    return { phase: 'rest', progress: (beat - protocol.window) / Math.max(0.01, period - protocol.window - protocol.warning), label: '손 떼기' };
  }
  if (protocol.type === 'drift') {
    return { phase: 'drift', progress: (Math.sin(safeElapsed * protocol.speed) + 1) / 2, label: '외부 압력장' };
  }
  if (protocol.type === 'silence') return { phase: 'silence', progress: 1, label: '소음 제한' };
  if (protocol.type === 'decay') return { phase: 'decay', progress: 1, label: '진행 회수' };
  return { phase: protocol.type, progress: 0, label: protocol.name };
}

export function protocolEffect(protocol, cue, context = {}) {
  const holding = context.holding === true;
  const safe = context.safe === true;
  const pressure = Number(context.pressure) || 0;
  const safeCenter = Number(context.safeCenter) || 0;
  const dt = Math.max(0, Number(context.dt) || 0);
  const effect = {
    progressMultiplier: 1,
    progressBonus: 0,
    progressLoss: 0,
    heatMultiplier: 1,
    noiseMultiplier: 1,
    integrityLoss: 0,
    heatGain: 0,
    noiseGain: 0,
    pressureDelta: 0,
    successWindow: false,
    failureWindow: false,
  };
  if (!protocol) return effect;

  if (protocol.type === 'release' && cue.phase === 'active') {
    if (holding) {
      effect.integrityLoss = protocol.penaltyIntegrity * dt;
      effect.heatGain = protocol.penaltyHeat * dt;
      effect.failureWindow = true;
    } else {
      effect.successWindow = true;
    }
  } else if (protocol.type === 'polarity' && holding && safe) {
    const correct = cue.phase === 'left' ? pressure <= safeCenter : pressure >= safeCenter;
    if (correct) {
      effect.progressBonus = protocol.correctBoost;
      effect.successWindow = true;
    } else {
      effect.progressMultiplier = 0.28;
      effect.noiseGain = protocol.wrongNoise * dt;
      effect.failureWindow = true;
    }
  } else if (protocol.type === 'spiral') {
    effect.heatMultiplier = 1 + (protocol.maxHeatMultiplier - 1) * cue.progress;
  } else if (protocol.type === 'rhythm' && holding) {
    if (cue.phase === 'beat') {
      effect.progressBonus = protocol.correctBoost;
      effect.successWindow = true;
    } else {
      effect.progressMultiplier = 0.22;
      effect.noiseGain = protocol.wrongNoise * dt;
      effect.failureWindow = true;
    }
  } else if (protocol.type === 'drift') {
    effect.pressureDelta = Math.sin((Number(context.elapsed) || 0) * protocol.speed) * protocol.amplitude * dt;
  } else if (protocol.type === 'silence') {
    effect.noiseMultiplier = protocol.noiseMultiplier;
  } else if (protocol.type === 'decay' && !holding) {
    effect.progressLoss = protocol.decayPerSecond * dt;
  }
  return effect;
}

export function bondLevelFromXp(xp) {
  const thresholds = [0, 4, 10, 18, 29, 43];
  const value = Math.max(0, Number(xp) || 0);
  let level = 1;
  thresholds.forEach((threshold, index) => {
    if (value >= threshold) level = index + 1;
  });
  return Math.min(6, level);
}

export function nextBondEpisode(meta, crewId, xp) {
  const episodes = BOND_EPISODES[crewId];
  if (!episodes) return null;
  const level = bondLevelFromXp(xp);
  const seen = new Set(createAdvancedMeta(meta).seenEpisodes);
  for (const unlockLevel of [2, 4, 6]) {
    const key = `${crewId}:${unlockLevel}`;
    if (level >= unlockLevel && !seen.has(key)) {
      return { key, crewId, level: unlockLevel, ...episodes[unlockLevel] };
    }
  }
  return null;
}

function buttonValue(button) {
  if (typeof button === 'number') return button;
  if (!button) return 0;
  return Math.max(button.pressed ? 1 : 0, Number(button.value) || 0);
}

export function mapGamepad(gamepad, threshold = 0.35) {
  const axes = gamepad?.axes ?? [];
  const buttons = gamepad?.buttons ?? [];
  const x = Number(axes[0]) || 0;
  const y = Number(axes[1]) || 0;
  return {
    connected: Boolean(gamepad),
    left: x < -threshold || buttonValue(buttons[14]) > 0.5,
    right: x > threshold || buttonValue(buttons[15]) > 0.5,
    up: y < -threshold || buttonValue(buttons[12]) > 0.5,
    down: y > threshold || buttonValue(buttons[13]) > 0.5,
    interact: buttonValue(buttons[0]) > 0.5,
    dash: buttonValue(buttons[1]) > 0.5 || buttonValue(buttons[6]) > 0.35,
    skill: buttonValue(buttons[2]) > 0.5,
    pause: buttonValue(buttons[9]) > 0.5,
    vaultHold: buttonValue(buttons[7]) > 0.25,
    menuPrev: buttonValue(buttons[4]) > 0.5,
    menuNext: buttonValue(buttons[5]) > 0.5,
  };
}
