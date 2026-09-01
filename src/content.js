export const GAME_VERSION = 3;
export const SAVE_KEY = 'vaultbound-night-shift-v3';
export const LEGACY_KEYS = ['vault-recovery-save-v1', 'vault-recovery-save-v2', 'vault-recovery-crew-v1'];

export const RARITIES = {
  common: { id: 'common', label: '일반', weight: 58, multiplier: 1, color: '#8fb0b5' },
  uncommon: { id: 'uncommon', label: '고급', weight: 27, multiplier: 1.35, color: '#63b6eb' },
  rare: { id: 'rare', label: '희귀', weight: 11, multiplier: 2.05, color: '#b991ff' },
  legendary: { id: 'legendary', label: '전설', weight: 4, multiplier: 3.7, color: '#f3c55b' },
};

export const CREW = [
  {
    id: 'seojin',
    name: '윤서진',
    callsign: 'STOPPER',
    role: '현장대장',
    color: '#56e2d0',
    coat: '#1d5760',
    skin: '#efbc98',
    hair: '#17242c',
    symbol: '■',
    passive: '열 또는 소음이 위험 단계에 도달하면 한 번 자동으로 압력 입력을 중단합니다.',
    active: '비상 정지',
    activeDescription: '열과 소음을 즉시 18 낮추고 2초 동안 내용물 손상을 막습니다.',
    lines: {
      hub: ['장비 점검했지? “대충”은 점검이 아니야.', '오늘 목표는 돈보다 손가락 보존이야.', '금고는 도망가지 않아. 천천히 정확하게.'],
      field: ['경비 동선은 내가 볼게. 넌 발소리만 줄여.', '시야에 들어가면 벽 뒤로 빠져.', '현장 규칙 하나. 살아서 정산한다.'],
      vault: ['과압은 용기가 아니라 수리비야.', '안전 구간 중앙. 거기서 욕심내지 마.', '열 오르면 바로 손 떼.'],
      success: ['깔끔했어. 오늘은 잔소리 없음.', '좋아. 이제 물건의 선택이 남았어.'],
      fail: ['실패 기록은 남겨. 같은 실수만 안 하면 돼.', '장비 탓하기 전에 로그부터 보자.'],
    },
  },
  {
    id: 'harin',
    name: '박하린',
    callsign: 'PAPERMOON',
    role: '기록관',
    color: '#f3c55b',
    coat: '#75412f',
    skin: '#f3c2a3',
    hair: '#a95242',
    symbol: '▤',
    passive: '보관함 선택에서 사건 단서가 있는 상자를 한 번 더 정확하게 감지합니다.',
    active: '사연 추적',
    activeDescription: '보관함 힌트를 갱신하고 사건 물품 확률을 높입니다.',
    lines: {
      hub: ['금고 안 물건은 전부 누군가의 문장 끝이에요.', '오늘은 편지가 나올 것 같아요. 근거는… 촉?', '경매가보다 뒷이야기가 비싼 날도 있죠.'],
      field: ['이 건물 폐쇄일과 사진 날짜가 같아요. 수상하죠?', '문서 보관실이 가까워요. 종이 냄새가 나요.', '발자국보다 메모를 먼저 찾아봐요.'],
      vault: ['내용물 상태 떨어져요! 사연이 구겨진다고요!', '완벽해요. 역사가 안 찌그러지고 있어요.', '오래된 종이는 열에 약해요.'],
      success: ['이건 돈 냄새보다 이야기 냄새가 진해요.', '자, 이 물건이 누구를 기다렸는지 볼까요?'],
      fail: ['실패 로그도 다음 장의 복선이니까요.', '다음에는 위험 부분에 형광펜 쳐 둘게요.'],
    },
  },
  {
    id: 'minhyuk',
    name: '강민혁',
    callsign: 'DEEP BLUE',
    role: '침수 복구사',
    color: '#63b6eb',
    coat: '#18496a',
    skin: '#c98661',
    hair: '#172027',
    symbol: '≈',
    passive: '현장 이동 속도가 8% 증가하고 압력 파동의 밀림이 감소합니다.',
    active: '압력 감압',
    activeDescription: '현재 압력을 안전 구간 중앙 쪽으로 당기고 콤보 손실을 막습니다.',
    lines: {
      hub: ['물속 금고보다 커피 자판기가 더 자주 날 배신해.', '압력은 파도랑 같아. 맞서지 말고 타는 거지.', '오늘도 깊게 들어가 보자고. 금고 안쪽으로.'],
      field: ['숨 길게. 발은 짧게.', '경비는 파도보다 느려. 방향만 읽어.', '젖은 바닥은 빛을 반사해. 그림자 조심.'],
      vault: ['파도 탔다! 그대로 가!', '과압! 위로 뜬다, 손 떼!', '그건 드릴이 아니라 어뢰 압력이야!'],
      success: ['인양 성공. 물만 안 새면 완벽이지.', '금고가 먼저 숨을 참다 포기했네.'],
      fail: ['한 번 잠겼다고 바다가 끝나는 건 아니지.', '장비 말리고 다시 들어가자.'],
    },
  },
  {
    id: 'juno',
    name: '오주노',
    callsign: 'SPARK',
    role: '장비 기술자',
    color: '#b991ff',
    coat: '#4b306e',
    skin: '#e4af88',
    hair: '#6842a6',
    symbol: '⚡',
    passive: '배전반 해킹의 안전 구간이 넓어지고 실패 패널티가 감소합니다.',
    active: '과충전 펄스',
    activeDescription: '현재 잠금축 진행률을 12 올리지만 열이 10 증가합니다.',
    lines: {
      hub: ['드릴에 새 이름 붙였어. “금고야 열려라 3호”.', '고장은 기능이 숨어 있다는 뜻이야. 아마도.', '업그레이드 버튼은 누르라고 있는 거야.'],
      field: ['저 배전반, 3초면 돼. 5초면 폭발도 가능해.', '카메라 선만 끊으면 거의 합법이야. 거의.', '내 개조품 믿지? 대답은 끝나고 해.'],
      vault: ['주파수 딱 맞아! 기계가 노래한다!', '뜨거워! 내 작품을 구워 먹지 마!', '다음엔 레이저도 달까?'],
      success: ['봤지? 장비가 좋으면 금고가 예의를 차린다니까.', '성공! 드릴에 스티커 하나 더 붙여야지.'],
      fail: ['좋아, 고장 데이터 확보. 나한텐 진전이야.', '분해할 이유가 생겼네. 신난 건 아니고.'],
    },
  },
  {
    id: 'jaewook',
    name: '한재욱',
    callsign: 'LEDGER',
    role: '전직 지점장',
    color: '#72df9b',
    coat: '#254936',
    skin: '#dda67f',
    hair: '#222c28',
    symbol: '₩',
    passive: '모든 계약 기본 보수가 8% 증가하고 야간 경매 수익이 높아집니다.',
    active: '손익 재계산',
    activeDescription: '남은 시간과 상태에 따라 진행률 또는 내용물 상태를 보정합니다.',
    lines: {
      hub: ['좋은 의뢰는 보수보다 조건표가 짧습니다.', '평판도 자산입니다. 현금화가 느릴 뿐.', '금고는 숫자로 잠그고 사람은 사연으로 잠그죠.'],
      field: ['투입 비용은 이미 매몰됐습니다. 손실을 더 키우지 마세요.', '경비보다 계약서의 작은 글씨가 더 위험합니다.', '시간과 상태, 둘 중 하나를 포기할 때가 옵니다.'],
      vault: ['그 압력은 이자가 너무 높습니다.', '효율 좋습니다. 기대수익이 올라갑니다.', '감정가가 실시간으로 녹고 있습니다.'],
      success: ['이제 선택입니다. 돈, 평판, 혹은 사람.', '가장 어려운 협상은 지금부터입니다.'],
      fail: ['손실은 확정됐습니다. 교훈까지 손실 처리하진 맙시다.', '오늘 비용은 다음 성공의 데이터로 전환하죠.'],
    },
  },
  {
    id: 'nabi',
    name: '나비',
    callsign: 'NAVI-7',
    role: '정찰 드론',
    color: '#ff91aa',
    coat: '#d8f3f2',
    skin: '#d8f3f2',
    hair: '#25333d',
    symbol: '●',
    passive: '경비의 시야와 숨은 수집품이 더 멀리서 표시됩니다.',
    active: '전자기 재밍',
    activeDescription: '현장 경비를 4초 멈추거나 금고 소음을 22 낮춥니다.',
    lines: {
      hub: ['삐빅! 오늘의 행운 87%. 근거는 비공개!', '나비는 드론이 아니라 동료입니다. 충전은 해 주세요.', '금고 탐지 완료! 간식 탐지는 실패!'],
      field: ['경비 락온! 놀라지 마세요. 아직 우리 말고요.', '숨은 동전 발견! 주운 사람 임자!', '카메라가 졸고 있어요. 지금 지나가요!'],
      vault: ['삐-빙! SAFE!', '경고! 드릴이 뜨거운 감자 상태!', '금고 0, 우리 팀 1 예정!'],
      success: ['개방 완료! 나비에게도 성과급 주세요!', '보물 발견! 사진 촬영 모드 찰칵!'],
      fail: ['실패 데이터를 귀엽게 저장했습니다.', '나비는 못 본 척 기능도 지원합니다.'],
    },
  },
];

export const CASES = [
  {
    id: 'case17',
    title: '사라진 17번 계좌',
    subtitle: '폐점은행에 남은 이름 없는 입금 기록',
    required: 12,
    color: '#56e2d0',
    chapters: [
      { at: 0, title: '마지막 영업일', text: '폐점 당일, 17번 계좌에는 같은 금액이 열두 번 입금됐다.' },
      { at: 3, title: '같은 필체', text: '가족사진과 거래 장부의 메모가 같은 사람의 필체다.' },
      { at: 7, title: '존재하지 않는 고객', text: '고객 명부에는 17번 계좌의 예금주가 처음부터 없었다.' },
      { at: 12, title: '대리 보관인', text: '계좌는 돈이 아니라 실종자들의 물건을 대신 지키기 위해 만들어졌다.' },
    ],
  },
  {
    id: 'baekya',
    title: '백야호텔의 마지막 손님',
    subtitle: '화재 직전 체크아웃하지 않은 608호',
    required: 14,
    color: '#f3c55b',
    chapters: [
      { at: 0, title: '608호 키', text: '비어 있었다는 객실의 열쇠가 호텔 지하 금고에서 발견됐다.' },
      { at: 4, title: '새벽 두 시', text: '카세트에는 “두 시 전에 은행으로 가라”는 목소리가 반복된다.' },
      { at: 9, title: '가짜 보석', text: '유리 반지의 문구는 실종된 배우의 마지막 무대 대사와 같다.' },
      { at: 14, title: '불이 난 이유', text: '화재는 증거를 지우기보다 지하 금고의 자동 잠금을 멈추기 위한 선택이었다.' },
    ],
  },
  {
    id: 'b7',
    title: '월식 계획 B-7',
    subtitle: '국고 벙커에 봉인된 두 개의 열쇠',
    required: 18,
    color: '#ff685f',
    chapters: [
      { at: 0, title: '지워진 지하도', text: '구도심 설계도에는 B-7으로 이어지는 통로가 검은 잉크로 덮여 있다.' },
      { at: 5, title: '0번 채권', text: '미발행 채권의 번호는 통화가 아니라 벙커 출입 순서를 뜻한다.' },
      { at: 11, title: '첫 번째 열쇠', text: '국새 모형 안쪽에 월식 문양 열쇠의 홈이 남아 있다.' },
      { at: 18, title: '복구할 사람들', text: 'B-7은 재산이 아니라 다음 재난 이후 도시를 복구할 사람들의 기록을 보관했다.' },
    ],
  },
];

export const STAGES = [
  {
    id: 'harbor-bank', order: 1, district: '항구 3동', name: '폐점은행 17호', icon: '▦',
    description: '가장 기본적인 야간 복구 현장. 낡은 카메라와 기계식 금고가 남아 있다.',
    unlockRep: 0, entry: 0, reward: 120, time: 80, difficulty: 1, map: 'bank', caseId: 'case17',
    hazards: ['camera'], palette: ['#10283a', '#19394a', '#355b64', '#f3c55b'], vaultEvents: ['jam'],
  },
  {
    id: 'baekya-hotel', order: 2, district: '백야로', name: '백야호텔 지하 금고', icon: '▥',
    description: '화재 흔적이 남은 호텔. 열기가 차오르고 무너진 가구가 통로를 가린다.',
    unlockRep: 4, entry: 55, reward: 210, time: 78, difficulty: 2, map: 'hotel', caseId: 'baekya',
    hazards: ['camera', 'heat'], palette: ['#261b1b', '#493025', '#7d4a2c', '#f29a4a'], vaultEvents: ['heat', 'fragile'],
  },
  {
    id: 'flooded-central', order: 3, district: '중앙 침수구역', name: '수몰 중앙지점', icon: '≈',
    description: '물에 잠긴 지점. 반사된 빛 때문에 경비 드론의 시야가 길다.',
    unlockRep: 9, entry: 105, reward: 340, time: 76, difficulty: 3, map: 'flood', caseId: 'b7',
    hazards: ['drone', 'water'], palette: ['#092334', '#0f3a50', '#2a6a79', '#73d6e3'], vaultEvents: ['wave', 'blackout'],
  },
  {
    id: 'midnight-casino', order: 4, district: '미드나이트 거리', name: '카지노 VIP 보관실', icon: '◆',
    description: '폐업 뒤에도 보안 로봇이 순찰한다. 고가 보관함이 많지만 소음 감지가 민감하다.',
    unlockRep: 15, entry: 175, reward: 490, time: 74, difficulty: 4, map: 'casino', caseId: 'case17',
    hazards: ['guard', 'laser'], palette: ['#17152e', '#2c2450', '#674888', '#f3c55b'], vaultEvents: ['scan', 'jam'],
  },
  {
    id: 'museum-vault', order: 5, district: '구시립박물관', name: '비공개 수장고', icon: '♜',
    description: '유물 보호 센서가 살아 있다. 첫 번째 보스 금고와 취약한 내용물이 기다린다.',
    unlockRep: 23, entry: 260, reward: 680, time: 72, difficulty: 5, map: 'museum', caseId: 'baekya',
    hazards: ['camera', 'laser', 'fragile'], palette: ['#16231f', '#254338', '#4f7461', '#d6c992'], vaultEvents: ['fragile', 'blackout', 'scan'], boss: true,
  },
  {
    id: 'night-train', order: 6, district: '북부 화물선', name: '야간 열차 장갑 화차', icon: '▰',
    description: '달리는 열차에서 수행하는 복구. 통로가 흔들리고 경비가 객차 사이를 이동한다.',
    unlockRep: 31, entry: 340, reward: 880, time: 70, difficulty: 6, map: 'train', caseId: 'case17',
    hazards: ['guard', 'shake'], palette: ['#17242b', '#2b3f45', '#7f5b36', '#e6b55b'], vaultEvents: ['wave', 'scan', 'jam'],
  },
  {
    id: 'loan-shark', order: 7, district: '청명시장 지하', name: '대부업자 비밀 창고', icon: '₩',
    description: '좁은 창고와 움직이는 경비. 현금은 많지만 증거물 처리에 따라 평판이 크게 변한다.',
    unlockRep: 41, entry: 450, reward: 1120, time: 68, difficulty: 7, map: 'warehouse', caseId: 'case17',
    hazards: ['guard', 'camera'], palette: ['#261c17', '#4b3426', '#755337', '#e5aa58'], vaultEvents: ['scan', 'heat', 'fragile'],
  },
  {
    id: 'arctic-data', order: 8, district: '북극권 연구기지', name: '극저온 데이터 금고', icon: '❄',
    description: '빙결된 서버 금고. 미끄러운 바닥과 간헐적 정전이 탐색을 어렵게 한다.',
    unlockRep: 53, entry: 580, reward: 1430, time: 68, difficulty: 8, map: 'arctic', caseId: 'b7',
    hazards: ['drone', 'ice', 'blackout'], palette: ['#10243a', '#1c4b68', '#5ba2b5', '#d5f4f4'], vaultEvents: ['blackout', 'jam', 'wave'],
  },
  {
    id: 'old-central', order: 9, district: '구 중앙은행', name: '봉인 아카이브', icon: '▤',
    description: '도시의 모든 사건이 교차하는 아카이브. 다중 카메라와 이중 금고가 배치됐다.',
    unlockRep: 67, entry: 760, reward: 1850, time: 66, difficulty: 9, map: 'archive', caseId: 'baekya',
    hazards: ['guard', 'camera', 'laser'], palette: ['#181c28', '#30384d', '#696f84', '#e3d8a8'], vaultEvents: ['scan', 'fragile', 'heat', 'blackout'], boss: true,
  },
  {
    id: 'national-b7', order: 10, district: '도시 지하 7구역', name: '국고 벙커 B-7', icon: '⬡',
    description: '모든 복구 기록의 종착지. 경비·센서·압력 장치가 동시에 작동하는 최종 금고.',
    unlockRep: 84, entry: 980, reward: 2600, time: 72, difficulty: 10, map: 'bunker', caseId: 'b7',
    hazards: ['guard', 'drone', 'camera', 'laser'], palette: ['#171b1d', '#303638', '#626b68', '#ff685f'], vaultEvents: ['scan', 'wave', 'heat', 'blackout', 'fragile', 'jam'], boss: true,
  },
];

export const ITEMS = [
  { id: 'watch', name: '멈춘 은제 회중시계', icon: '◷', rarity: 'common', value: 90, tags: ['personal', 'bank'], caseId: 'case17', clue: 1, story: '서로 다른 두 사람의 이니셜이 뒷면에 얕게 새겨져 있다.' },
  { id: 'coins', name: '해외 주화 봉투', icon: '◎', rarity: 'common', value: 82, tags: ['money', 'hotel'], caseId: null, clue: 0, story: '여행 날짜별로 나뉜 오래된 주화 묶음.' },
  { id: 'photo', name: '빛바랜 가족사진', icon: '▣', rarity: 'common', value: 48, tags: ['personal', 'bank'], caseId: 'case17', clue: 1, story: '사진 속 사람들은 은행 앞 계단에서 같은 방향을 바라본다.' },
  { id: 'ledger', name: '봉인된 거래 장부', icon: '▤', rarity: 'common', value: 115, tags: ['document', 'bank'], caseId: 'case17', clue: 2, story: '마지막 열두 장만 다른 잉크로 급하게 작성됐다.' },
  { id: 'hotel-key', name: '608호 황동 열쇠', icon: '⚿', rarity: 'common', value: 105, tags: ['hotel', 'personal'], caseId: 'baekya', clue: 1, story: '비어 있었다는 객실의 번호가 선명하다.' },
  { id: 'wet-letter', name: '방수 처리된 편지', icon: '▱', rarity: 'common', value: 122, tags: ['document', 'flood'], caseId: 'b7', clue: 1, story: '받는 사람 대신 강변의 오래된 좌표가 적혀 있다.' },
  { id: 'chip-stack', name: '카지노 칩 한 묶음', icon: '●', rarity: 'common', value: 135, tags: ['casino', 'money'], caseId: null, clue: 0, story: '폐업한 카지노 로고가 검게 지워져 있다.' },
  { id: 'train-ticket', name: '개찰되지 않은 야간표', icon: '▭', rarity: 'common', value: 98, tags: ['train', 'personal'], caseId: 'case17', clue: 1, story: '도착지가 존재하지 않는 역으로 인쇄돼 있다.' },

  { id: 'porcelain-token', name: '백자 보관표', icon: '⬡', rarity: 'uncommon', value: 175, tags: ['museum', 'bank'], caseId: 'case17', clue: 2, story: '금속 대신 백자로 만든 보관표. 같은 문양의 짝이 있다.' },
  { id: 'glass-ring', name: '붉은 유리 반지', icon: '◇', rarity: 'uncommon', value: 225, tags: ['hotel', 'jewelry'], caseId: 'baekya', clue: 2, story: '보석은 유리지만 안쪽의 약속 문구는 정교하다.' },
  { id: 'tunnel-plan', name: '구도심 지하도 설계도', icon: '⌁', rarity: 'uncommon', value: 255, tags: ['document', 'flood'], caseId: 'b7', clue: 2, story: '현재 지도에는 없는 통로가 은행 지하에서 강변까지 이어진다.' },
  { id: 'cassette', name: '무제 카세트테이프', icon: '▰', rarity: 'uncommon', value: 205, tags: ['hotel', 'evidence'], caseId: 'baekya', clue: 2, story: '첫 구간에 누군가의 떨리는 목소리가 녹음돼 있다.' },
  { id: 'blank-chip', name: '일련번호 없는 칩', icon: '◉', rarity: 'uncommon', value: 245, tags: ['casino', 'evidence'], caseId: 'case17', clue: 2, story: '정식 칩보다 무겁고 내부에서 필름 조각이 흔들린다.' },
  { id: 'glass-negative', name: '유리 건판 사진', icon: '▨', rarity: 'uncommon', value: 275, tags: ['museum', 'hotel'], caseId: 'baekya', clue: 2, story: '현상하면 화재 전날 지하에 모인 다섯 사람이 나타난다.' },
  { id: 'defense-map', name: '민방위 대피지도 원본', icon: '⌗', rarity: 'uncommon', value: 295, tags: ['archive', 'document'], caseId: 'b7', clue: 2, story: '공개 지도와 달리 강 아래의 보조 통로가 표시돼 있다.' },
  { id: 'frozen-drive', name: '서리 낀 데이터 드라이브', icon: '▮', rarity: 'uncommon', value: 315, tags: ['arctic', 'data'], caseId: 'b7', clue: 2, story: '영하 환경에서만 읽히는 복구 대상 명단이 담겨 있다.' },

  { id: 'meteor', name: '운석 조각 문진', icon: '✦', rarity: 'rare', value: 455, tags: ['museum', 'collectible'], caseId: null, clue: 0, story: '지역 천문대 폐쇄 당시 사라진 표본 번호가 남아 있다.' },
  { id: 'brooch', name: '에메랄드 제비 브로치', icon: '◆', rarity: 'rare', value: 535, tags: ['hotel', 'jewelry'], caseId: 'baekya', clue: 3, story: '실종된 배우의 마지막 공연 사진에서 같은 브로치가 보인다.' },
  { id: 'zero-bond', name: '미발행 0번 채권', icon: '▥', rarity: 'rare', value: 590, tags: ['bank', 'document'], caseId: 'b7', clue: 3, story: '공식 기록에 없는 인쇄본. 일련번호가 모두 0으로 시작한다.' },
  { id: 'gold-box', name: '금니가 든 작은 상자', icon: '⌂', rarity: 'rare', value: 490, tags: ['warehouse', 'evidence'], caseId: 'case17', clue: 3, story: '치과 차트 일부와 함께 보관돼 있다.' },
  { id: 'cipher-wheel', name: '황동 암호 원판', icon: '⊛', rarity: 'rare', value: 665, tags: ['archive', 'bunker'], caseId: 'b7', clue: 3, story: '월식 날짜에만 맞물리는 두 겹의 문자판.' },
  { id: 'stage-mask', name: '은실 무대 가면', icon: '◒', rarity: 'rare', value: 615, tags: ['hotel', 'museum'], caseId: 'baekya', clue: 3, story: '사라진 공연의 주연 배우 이름이 안쪽에 자수돼 있다.' },
  { id: 'black-cash', name: '검은 봉인의 현금 다발', icon: '▰', rarity: 'rare', value: 720, tags: ['warehouse', 'money'], caseId: 'case17', clue: 3, story: '모든 지폐가 같은 날 같은 창구에서 인출됐다.' },
  { id: 'train-core', name: '장갑 화차 제어 코어', icon: '◈', rarity: 'rare', value: 745, tags: ['train', 'data'], caseId: 'b7', clue: 3, story: '열차가 존재하지 않는 지하 노선으로 진입한 기록을 보관한다.' },

  { id: 'royal-seal', name: '분실된 황동 국새 모형', icon: '♜', rarity: 'legendary', value: 1040, tags: ['museum', 'collectible'], caseId: 'b7', clue: 5, story: '도난 목록에는 진품으로 기록됐지만 바닥에는 모형이라는 각인이 있다.' },
  { id: 'blue-diamond', name: '푸른 다이아 원석', icon: '⬙', rarity: 'legendary', value: 1350, tags: ['casino', 'jewelry'], caseId: null, clue: 0, story: '빛을 비추면 내부에 별 모양 균열이 나타난다.' },
  { id: 'black-book', name: '검은 명부 17번', icon: '▦', rarity: 'legendary', value: 1210, tags: ['archive', 'bank'], caseId: 'case17', clue: 6, story: '페이지마다 같은 날짜와 다른 이름이 반복된다. 마지막 줄은 비어 있다.' },
  { id: 'moon-key', name: '월식 문양의 두 번째 열쇠', icon: '⚿', rarity: 'legendary', value: 1480, tags: ['bunker', 'collectible'], caseId: 'b7', clue: 6, story: '첫 번째 열쇠가 존재한다는 메모와 함께 보관돼 있다.' },
  { id: 'white-film', name: '백색실 8mm 필름', icon: '◫', rarity: 'legendary', value: 1280, tags: ['hotel', 'evidence'], caseId: 'baekya', clue: 6, story: '호텔 지하의 존재하지 않는 방에서 촬영된 영상.' },
  { id: 'city-seed', name: '도시 복구 시드', icon: '✺', rarity: 'legendary', value: 1760, tags: ['bunker', 'data'], caseId: 'b7', clue: 7, story: '재난 이후 도시 기반시설을 되살릴 암호화된 설계 묶음.' },
];

export const UPGRADES = [
  { id: 'boots', name: '무소음 작업화', icon: '▾', max: 5, baseCost: 150, description: '현장 이동 속도와 경비에게 들키기까지 시간을 개선합니다.' },
  { id: 'jammer', name: '휴대 재머', icon: '⌁', max: 5, baseCost: 190, description: '경비와 카메라의 탐지 속도를 낮춥니다.' },
  { id: 'drill', name: '정밀 드릴', icon: '⚙', max: 6, baseCost: 180, description: '금고 진행 속도를 높이고 압력 상승을 부드럽게 합니다.' },
  { id: 'coolant', name: '냉각 순환기', icon: '❄', max: 6, baseCost: 165, description: '드릴 열 발생을 낮추고 냉각 속도를 높입니다.' },
  { id: 'muffler', name: '방진 흡음재', icon: '≋', max: 6, baseCost: 175, description: '금고 해체 소음과 경보 위험을 낮춥니다.' },
  { id: 'scanner', name: '투과 스캐너', icon: '⌖', max: 6, baseCost: 230, description: '희귀 보관함과 사건 물품을 찾을 확률을 높입니다.' },
];

export const OBJECTIVE_POOL = [
  { id: 'complete-2', type: 'complete', label: '의뢰 2회 완료', target: 2, coins: 150, intel: 0 },
  { id: 'stealth-1', type: 'stealth', label: '경보 30 이하로 현장 통과', target: 1, coins: 120, intel: 1 },
  { id: 'combo-4', type: 'combo', label: '정밀 콤보 4단계 달성', target: 4, coins: 130, intel: 1 },
  { id: 'return-1', type: 'return', label: '발견물 1회 반환', target: 1, coins: 75, intel: 2 },
  { id: 'archive-1', type: 'archive', label: '사건 물품 1회 보관', target: 1, coins: 60, intel: 3 },
  { id: 'rare-1', type: 'rare', label: '희귀 이상 물품 발견', target: 1, coins: 180, intel: 2 },
  { id: 'hack-2', type: 'hack', label: '배전반 2회 완벽 해킹', target: 2, coins: 110, intel: 1 },
  { id: 'condition-85', type: 'condition', label: '보존 상태 85% 이상', target: 85, coins: 140, intel: 1 },
];

export function getStage(id) {
  return STAGES.find((stage) => stage.id === id) ?? STAGES[0];
}

export function getCrew(id) {
  return CREW.find((crew) => crew.id === id) ?? CREW[0];
}

export function getItem(id) {
  return ITEMS.find((item) => item.id === id) ?? ITEMS[0];
}

export function getCase(id) {
  return CASES.find((caseFile) => caseFile.id === id) ?? CASES[0];
}

export function getUpgrade(id) {
  return UPGRADES.find((upgrade) => upgrade.id === id) ?? UPGRADES[0];
}
