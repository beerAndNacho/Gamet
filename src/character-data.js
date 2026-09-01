export const CHARACTER_SAVE_KEY = 'vault-recovery-crew-v1';

export const CHARACTERS = [
  {
    id: 'seojin',
    name: '윤서진',
    callSign: 'STOPPER',
    role: '현장대장',
    age: 34,
    color: '#57e3d1',
    darkColor: '#173c43',
    skin: '#f0bf9d',
    hair: '#19242c',
    art: 'captain',
    personality: '무심한 안전광. 잔소리는 짧고 개입은 정확하다.',
    skillName: '강제 냉각',
    skillDescription: '작업 중 열이나 소음이 위험 수치에 도달하면 압력 입력을 자동으로 끊습니다.',
    intervention: 'thermal-stop',
    lines: {
      home: ['오늘 목표는 돈보다 손가락 보존이야.', '장비 점검했지? “대충”은 점검이 아니야.', '금고는 도망가지 않아. 천천히 정확하게.'],
      job: ['내가 위험 수치 볼게. 넌 안전 구간만 봐.', '과압은 용기가 아니라 수리비야.', '현장 규칙 하나. 살아서 정산한다.'],
      safe: ['좋아. 그 압력 그대로.', '정확해. 욕심내지 마.', '중앙 유지. 지금 아주 좋아.'],
      danger: ['손 떼. 지금.', '냉각 먼저! 보상은 나중이야.', '강제 정지. 장비 태울 셈이야?'],
      success: ['깔끔했어. 오늘은 잔소리 없음.', '금고보다 네 손이 더 멀쩡하네. 합격.', '좋아. 이제 물건의 선택이 남았어.'],
      fail: ['실패 기록은 남겨. 같은 실수만 안 하면 돼.', '장비 탓하기 전에 로그부터 보자.', '다시 열 수 있어. 망가진 습관부터 고치면.'],
    },
  },
  {
    id: 'harin',
    name: '박하린',
    callSign: 'PAPERMOON',
    role: '기록관',
    age: 29,
    color: '#f5c46d',
    darkColor: '#4d3520',
    skin: '#f4c5a7',
    hair: '#b85f45',
    art: 'archivist',
    personality: '사소한 영수증에서도 대서사를 찾아내는 이야기 수집가.',
    skillName: '사연 추적',
    skillDescription: '발견물과 의뢰인의 연결점을 빠르게 알려 주고 반환·보관 선택을 해설합니다.',
    intervention: 'story-sense',
    lines: {
      home: ['오늘은 왠지 편지가 나올 것 같아요. 근거는… 촉?', '금고 안 물건은 전부 누군가의 문장 끝이에요.', '경매가보다 뒷이야기가 비싼 날도 있죠.'],
      job: ['이 지점 폐쇄일과 사진 날짜가 같아요. 수상하죠?', '열면서 긁힌 자국도 기록해 주세요!', '잠깐, 이 금고 번호 전에 본 것 같은데…'],
      safe: ['좋아요! 이 리듬이면 기록도 깨끗해요.', '그대로, 그대로! 역사가 안 찌그러지고 있어요.', '완벽해요. 금고도 마음을 여는 중!'],
      danger: ['내용물 상태 떨어져요! 사연이 구겨진다고요!', '잠깐 쉬어요. 오래된 종이는 열에 약해요.', '과압 금지! 편지가 들어 있을 수도 있어요.'],
      success: ['열렸다! 자, 이제 이 물건이 누구를 기다렸는지 볼까요?', '이건 돈 냄새보다 이야기 냄새가 진해요.', '기록 카드 준비 완료. 표정도 기록할까요?'],
      fail: ['괜찮아요. 실패 로그도 다음 장의 복선이니까.', '오늘 기록 제목은 “너무 뜨거웠던 금고”.', '다음에는 제가 위험 부분에 형광펜 쳐 둘게요.'],
    },
  },
  {
    id: 'minhyuk',
    name: '강민혁',
    callSign: 'DEEP BLUE',
    role: '잠수 복구사',
    age: 31,
    color: '#67b7ef',
    darkColor: '#193c59',
    skin: '#c98962',
    hair: '#182028',
    art: 'diver',
    personality: '침수 금고 전문. 위험할수록 농담이 늘어나는 현장 체질.',
    skillName: '압력 읽기',
    skillDescription: '안전 구간을 크게 벗어난 과압을 감지하면 즉시 입력을 해제합니다.',
    intervention: 'pressure-cut',
    lines: {
      home: ['물속 금고보다 커피 자판기가 더 자주 날 배신해.', '압력은 파도랑 같아. 맞서지 말고 타는 거지.', '오늘도 깊게 들어가 보자고. 금고 안쪽으로.'],
      job: ['압력 파도 오면 내가 먼저 소리칠게.', '숨 길게. 손은 짧게 눌러.', '금고도 물고기랑 같아. 세게 잡으면 놓쳐.'],
      safe: ['파도 탔다! 그대로 가!', '좋은 압력이야. 바닥이 보여.', '오, 손맛 좋은데?'],
      danger: ['과압! 위로 뜬다, 손 떼!', '너무 깊어. 바로 감압!', '그건 드릴이 아니라 어뢰 압력이야!'],
      success: ['인양 성공. 물만 안 새면 완벽이지.', '오늘 건 묵직하다. 좋은 의미로.', '금고가 먼저 숨을 참다 포기했네.'],
      fail: ['한 번 잠겼다고 바다가 끝나는 건 아니지.', '다음 잠수는 더 짧고 정확하게 간다.', '장비 말리고 다시 들어가자.'],
    },
  },
  {
    id: 'juno',
    name: '오주노',
    callSign: 'SPARK',
    role: '장비 기술자',
    age: 27,
    color: '#bd8cff',
    darkColor: '#3b2758',
    skin: '#e7b38e',
    hair: '#7c4ac8',
    art: 'mechanic',
    personality: '고장 난 장비를 보면 신나고 멀쩡한 장비도 일단 분해한다.',
    skillName: '열 폭주 예측',
    skillDescription: '드릴 열 상승을 빠르게 감지해 냉각 타이밍을 앞당겨 알려 줍니다.',
    intervention: 'heat-coach',
    lines: {
      home: ['드릴에 새 이름 붙였어. “금고야 열려라 3호”.', '고장은 기능이 숨어 있다는 뜻이야. 아마도.', '업그레이드 버튼은 누르라고 있는 거야.'],
      job: ['소리 좋다. 아직은 폭발 안 할 소리야.', '내 개조품 믿지? 대답은 작업 끝나고 해.', '열 게이지 70부터는 드릴이 욕하는 구간이야.'],
      safe: ['주파수 딱 맞아! 기계가 노래한다!', '그 리듬 계속. 베어링이 행복해 보여.', '좋아! 내 드릴 천재 맞지?'],
      danger: ['뜨거워! 내 작품을 구워 먹지 마!', '냉각! 냉각! 머리 말고 드릴!', '그 연기 정상 아니야. 이번엔 진짜로.'],
      success: ['봤지? 장비가 좋으면 금고가 예의를 차린다니까.', '성공! 드릴에 스티커 하나 더 붙여야지.', '다음엔 레이저도 달까? 농담 반 진담 반.'],
      fail: ['좋아, 고장 데이터 확보. 나한텐 진전이야.', '분해할 이유가 생겼네. 신난 건 아니고.', '다음 버전은 덜 터지게 만들게. 아마도.'],
    },
  },
  {
    id: 'jaewook',
    name: '한재욱',
    callSign: 'LEDGER',
    role: '은행 출신 협상가',
    age: 38,
    color: '#77df9d',
    darkColor: '#204732',
    skin: '#e0aa84',
    hair: '#273028',
    art: 'banker',
    personality: '금리와 사람의 거짓말을 같은 표정으로 계산하는 전직 지점장.',
    skillName: '손익 브리핑',
    skillDescription: '결과 화면에서 경매와 반환의 장단점을 성격에 맞게 빠르게 비교합니다.',
    intervention: 'deal-advice',
    lines: {
      home: ['좋은 의뢰는 보수보다 조건표가 짧습니다.', '평판도 자산입니다. 다만 현금화가 느릴 뿐.', '금고는 숫자로 잠그고 사람은 사연으로 잠그죠.'],
      job: ['투입 비용은 이미 매몰됐습니다. 손실을 더 키우진 마세요.', '시간과 상태, 둘 중 하나를 포기할 때가 옵니다.', '서두르는 고객일수록 계약서를 천천히 읽어야 합니다.'],
      safe: ['효율 좋습니다. 지금 기대수익이 올라갑니다.', '안정적입니다. 이대로면 협상력이 생겨요.', '좋습니다. 숫자가 우리 편으로 움직입니다.'],
      danger: ['그 압력은 이자가 너무 높습니다.', '손실 제한선입니다. 입력을 줄이세요.', '감정가가 실시간으로 녹고 있습니다.'],
      success: ['이제 선택입니다. 돈, 평판, 혹은 사람.', '열렸군요. 가장 어려운 협상은 지금부터입니다.', '감정가만 보지 마세요. 미래 의뢰도 계산해야죠.'],
      fail: ['손실은 확정됐습니다. 교훈까지 손실 처리하진 맙시다.', '오늘 비용은 다음 성공의 데이터로 전환하죠.', '실패보다 나쁜 건 같은 조건으로 재계약하는 겁니다.'],
    },
  },
  {
    id: 'nabi',
    name: '나비',
    callSign: 'NAVI-7',
    role: '정찰 드론',
    age: null,
    color: '#ff8fa3',
    darkColor: '#532936',
    skin: '#d9f5f3',
    hair: '#25333d',
    art: 'drone',
    personality: '공식 명칭은 탐지 드론. 본인은 팀의 귀여움 담당이라고 주장한다.',
    skillName: '세이프 핑',
    skillDescription: '압력이 안전 구간에 진입하면 빛과 짧은 신호로 정확한 타이밍을 알려 줍니다.',
    intervention: 'safe-ping',
    lines: {
      home: ['삐빅! 오늘의 행운 수치 87%. 근거 데이터는 비공개!', '나비는 드론이 아니라 동료입니다. 충전은 해 주세요.', '금고 탐지 완료! 간식 탐지는 실패!'],
      job: ['안전 구간 락온 준비. 삐빅!', '금속 냄새 강함. 보물일 확률… 기분상 높음!', '나비가 보고 있어요. 부담 갖지 마세요. 많이만.'],
      safe: ['삐-빙! SAFE!', '락온 성공! 인간 손가락 훌륭함!', '정확도 반짝반짝!'],
      danger: ['삐비비빅! 위험! 손 떼기 권장!', '나비의 눈이 빨개졌습니다. 매우 위험!', '경고! 드릴이 뜨거운 감자 상태!'],
      success: ['개방 완료! 나비에게도 성과급 주세요!', '보물 발견! 사진 촬영 모드 찰칵!', '금고 0, 우리 팀 1. 삐빅!'],
      fail: ['실패 데이터를 귀엽게 저장했습니다.', '다음 성공 확률 상승! 아마도 0.7%!', '나비는 못 본 척 기능도 지원합니다.'],
    },
  },
];

export const JOB_CONTACT_ORDER = ['seojin', 'harin', 'minhyuk', 'jaewook'];

export const BOND_THRESHOLDS = [0, 4, 10, 19, 31, 46];

export function getCharacterById(characterId) {
  return CHARACTERS.find((character) => character.id === characterId) ?? CHARACTERS[0];
}

export function getJobContact(order) {
  const id = JOB_CONTACT_ORDER[(Math.max(1, order) - 1) % JOB_CONTACT_ORDER.length];
  return getCharacterById(id);
}

export function getBondLevel(xp) {
  const safeXp = Math.max(0, Number(xp) || 0);
  let level = 1;
  BOND_THRESHOLDS.forEach((threshold, index) => {
    if (safeXp >= threshold) level = index + 1;
  });
  return Math.min(BOND_THRESHOLDS.length, level);
}

export function getBondProgress(xp) {
  const level = getBondLevel(xp);
  if (level >= BOND_THRESHOLDS.length) return { level, current: 1, required: 1, percentage: 100 };
  const floor = BOND_THRESHOLDS[level - 1];
  const ceiling = BOND_THRESHOLDS[level];
  const current = Math.max(0, (Number(xp) || 0) - floor);
  const required = ceiling - floor;
  return {
    level,
    current,
    required,
    percentage: Math.min(100, Math.round((current / required) * 100)),
  };
}

export function getBondTitle(level) {
  return ['낯선 동료', '현장 파트너', '믿을 만한 팀원', '찰떡 호흡', '비밀 공유자', '평생 동료'][Math.max(1, Math.min(6, level)) - 1];
}

export function pickCharacterLine(character, category, seed = Date.now()) {
  const lines = character?.lines?.[category] ?? character?.lines?.home ?? ['준비됐습니다.'];
  const index = Math.abs(Number(seed) || 0) % lines.length;
  return lines[index];
}
