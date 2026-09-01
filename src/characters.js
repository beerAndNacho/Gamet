import {
  BOND_THRESHOLDS,
  CHARACTER_SAVE_KEY,
  CHARACTERS,
  getBondLevel,
  getBondProgress,
  getBondTitle,
  getCharacterById,
  getJobContact,
  pickCharacterLine,
} from './character-data.js';

const MAIN_SAVE_KEY = 'vault-recovery-save-v1';
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

let crewState = null;
let lastTalkKey = '';
let lastTalkAt = 0;
let lastResultKey = '';
let lastSafeState = false;
let lastInterventionAt = 0;
let lastManualSkillAt = 0;
let lastPlayActive = false;
let monitorTimer = null;
let syncTimer = null;
let pingContext = null;

function parseJson(value, fallback = null) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function readMainState() {
  return parseJson(localStorage.getItem(MAIN_SAVE_KEY), null);
}

function createCrewState(mainState = readMainState()) {
  return {
    version: 1,
    selectedId: 'seojin',
    bonds: Object.fromEntries(CHARACTERS.map((character) => [character.id, 0])),
    lastCompleted: mainState?.stats?.jobsCompleted ?? 0,
    lastFailed: mainState?.stats?.jobsFailed ?? 0,
    lastRecentSignature: mainState?.recentFinds?.[0]
      ? `${mainState.recentFinds[0].day}:${mainState.recentFinds[0].itemId}`
      : '',
  };
}

function normalizeCrewState(candidate) {
  const fallback = createCrewState();
  if (!candidate || typeof candidate !== 'object') return fallback;
  const selectedId = CHARACTERS.some((character) => character.id === candidate.selectedId)
    ? candidate.selectedId
    : fallback.selectedId;
  const bonds = Object.fromEntries(CHARACTERS.map((character) => [
    character.id,
    Math.max(0, Math.floor(Number(candidate.bonds?.[character.id]) || 0)),
  ]));
  return {
    ...fallback,
    selectedId,
    bonds,
    lastCompleted: Math.max(0, Math.floor(Number(candidate.lastCompleted) || 0)),
    lastFailed: Math.max(0, Math.floor(Number(candidate.lastFailed) || 0)),
    lastRecentSignature: typeof candidate.lastRecentSignature === 'string'
      ? candidate.lastRecentSignature
      : '',
  };
}

function loadCrewState() {
  return normalizeCrewState(parseJson(localStorage.getItem(CHARACTER_SAVE_KEY), null));
}

function saveCrewState() {
  try {
    localStorage.setItem(CHARACTER_SAVE_KEY, JSON.stringify(crewState));
  } catch {
    // Character presentation remains usable even when storage is blocked.
  }
}

function selectedCharacter() {
  return getCharacterById(crewState?.selectedId);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function humanAccessory(character) {
  switch (character.art) {
    case 'captain':
      return `
        <path d="M20 82 Q50 65 80 82 L84 100 H16Z" fill="#193b45"/>
        <path d="M37 75 L50 91 L63 75" fill="none" stroke="${character.color}" stroke-width="5" stroke-linecap="round"/>
        <rect x="68" y="70" width="14" height="9" rx="3" fill="#d7f5ef" opacity=".86"/>
      `;
    case 'archivist':
      return `
        <path d="M18 83 Q50 67 82 83 L86 100 H14Z" fill="#5a342c"/>
        <path d="M28 84 Q50 75 72 84" fill="none" stroke="#f5c46d" stroke-width="5"/>
        <g fill="none" stroke="#5f3430" stroke-width="2.5"><circle cx="38" cy="49" r="9"/><circle cx="62" cy="49" r="9"/><path d="M47 49h6"/></g>
        <path d="M72 24 Q84 39 75 72 L66 68 Q72 51 66 32Z" fill="${character.hair}"/>
        <path d="M28 25 Q14 42 25 73 L35 68 Q27 48 35 31Z" fill="${character.hair}"/>
      `;
    case 'diver':
      return `
        <path d="M16 84 Q50 64 84 84 L88 100 H12Z" fill="#153f59"/>
        <path d="M26 82 Q50 74 74 82" fill="none" stroke="#67b7ef" stroke-width="6"/>
        <path d="M29 72 Q50 86 71 72" fill="none" stroke="#a8d9f7" stroke-width="4"/>
        <rect x="28" y="19" width="44" height="14" rx="7" fill="#15232d" stroke="#67b7ef" stroke-width="3"/>
        <circle cx="39" cy="26" r="5" fill="#bcecff"/><circle cx="61" cy="26" r="5" fill="#bcecff"/>
      `;
    case 'mechanic':
      return `
        <path d="M15 84 Q50 65 85 84 L89 100 H11Z" fill="#35264c"/>
        <path d="M24 84 L34 74 L50 90 L66 74 L77 84" fill="none" stroke="#bd8cff" stroke-width="5"/>
        <path d="M52 12 Q67 12 76 27 Q62 21 50 31Z" fill="${character.hair}"/>
        <path d="M68 73 l7 -11 l5 3 l-7 12" fill="#b8c7ca" stroke="#1d2a30" stroke-width="2"/>
        <circle cx="77" cy="62" r="5" fill="none" stroke="#b8c7ca" stroke-width="3"/>
      `;
    case 'banker':
      return `
        <path d="M15 84 Q50 64 85 84 L90 100 H10Z" fill="#1d3029"/>
        <path d="M35 75 L50 96 L65 75" fill="#edf7f4"/>
        <path d="M46 78 L54 78 L57 100 H43Z" fill="#77df9d"/>
        <path d="M23 34 Q27 11 54 12 Q75 13 79 35 Q64 24 42 27 Q31 29 23 34Z" fill="${character.hair}"/>
        <path d="M31 45 Q38 41 44 45 M56 45 Q63 41 70 45" fill="none" stroke="#202923" stroke-width="2.5" stroke-linecap="round"/>
      `;
    default:
      return '';
  }
}

function portraitSvg(character, expression = 'smile') {
  if (character.art === 'drone') {
    const eyeShape = expression === 'worried'
      ? '<path d="M33 51 l8 -4 M59 47 l8 4" stroke="#ff8fa3" stroke-width="4" stroke-linecap="round"/>'
      : '<rect x="31" y="45" width="11" height="8" rx="4" fill="#ff8fa3"/><rect x="58" y="45" width="11" height="8" rx="4" fill="#ff8fa3"/>';
    return `
      <svg class="crew-portrait-svg" viewBox="0 0 100 100" role="img" aria-label="${escapeHtml(character.name)}">
        <defs><linearGradient id="drone-bg-${character.id}" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${character.darkColor}"/><stop offset="1" stop-color="#09141c"/></linearGradient></defs>
        <rect width="100" height="100" rx="25" fill="url(#drone-bg-${character.id})"/>
        <path d="M18 52 H7 M93 52 H82" stroke="#9bb6c0" stroke-width="5" stroke-linecap="round"/>
        <circle cx="8" cy="52" r="6" fill="#ff8fa3"/><circle cx="92" cy="52" r="6" fill="#ff8fa3"/>
        <path d="M50 18 V8 M43 8 H57" stroke="#a8c1c8" stroke-width="4" stroke-linecap="round"/>
        <circle cx="50" cy="8" r="4" fill="#57e3d1"/>
        <rect x="18" y="24" width="64" height="57" rx="24" fill="#d9f5f3" stroke="#516b75" stroke-width="5"/>
        <rect x="25" y="36" width="50" height="28" rx="12" fill="#172a35"/>
        ${eyeShape}
        <path d="M39 69 Q50 ${expression === 'worried' ? 64 : 77} 61 69" fill="none" stroke="#45616a" stroke-width="3" stroke-linecap="round"/>
        <path d="M38 82 H62 L67 94 H33Z" fill="#526d76"/><circle cx="50" cy="88" r="5" fill="#57e3d1"/>
        <circle cx="26" cy="29" r="3" fill="#ff8fa3" opacity=".8"/>
      </svg>
    `;
  }

  const eyes = expression === 'worried'
    ? '<path d="M34 48 q5 -5 10 0 M56 48 q5 -5 10 0" fill="none" stroke="#3d2925" stroke-width="3" stroke-linecap="round"/>'
    : expression === 'excited'
      ? '<path d="M34 48 q5 5 10 0 M56 48 q5 5 10 0" fill="none" stroke="#3d2925" stroke-width="3" stroke-linecap="round"/>'
      : '<ellipse cx="39" cy="49" rx="3" ry="4" fill="#302421"/><ellipse cx="61" cy="49" rx="3" ry="4" fill="#302421"/>';
  const mouth = expression === 'worried'
    ? '<path d="M43 66 Q50 61 57 66" fill="none" stroke="#8e514b" stroke-width="3" stroke-linecap="round"/>'
    : expression === 'excited'
      ? '<path d="M41 63 Q50 75 59 63 Q50 69 41 63Z" fill="#913f46"/><path d="M44 65 H56" stroke="#fff2e8" stroke-width="2"/>'
      : '<path d="M42 64 Q50 70 58 64" fill="none" stroke="#8e514b" stroke-width="3" stroke-linecap="round"/>';
  const baseHair = character.art === 'archivist'
    ? '<path d="M25 41 Q20 15 51 12 Q78 13 75 43 Q66 31 49 29 Q35 29 25 41Z" fill="' + character.hair + '"/>'
    : character.art === 'mechanic'
      ? '<path d="M24 40 Q24 19 48 18 Q60 17 72 27 Q58 25 47 31 Q35 31 24 40Z" fill="#262b33"/>'
      : '<path d="M23 39 Q23 15 51 13 Q76 14 78 40 Q66 28 49 28 Q35 28 23 39Z" fill="' + character.hair + '"/>';

  return `
    <svg class="crew-portrait-svg" viewBox="0 0 100 100" role="img" aria-label="${escapeHtml(character.name)}">
      <defs><linearGradient id="crew-bg-${character.id}" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${character.darkColor}"/><stop offset="1" stop-color="#08131b"/></linearGradient></defs>
      <rect width="100" height="100" rx="25" fill="url(#crew-bg-${character.id})"/>
      <circle cx="78" cy="20" r="18" fill="${character.color}" opacity=".12"/>
      <circle cx="16" cy="84" r="24" fill="${character.color}" opacity=".08"/>
      ${humanAccessory(character)}
      <ellipse cx="50" cy="50" rx="27" ry="30" fill="${character.skin}"/>
      <ellipse cx="23" cy="52" rx="5" ry="8" fill="${character.skin}"/><ellipse cx="77" cy="52" rx="5" ry="8" fill="${character.skin}"/>
      ${baseHair}
      ${eyes}
      <path d="M49 51 Q47 58 51 59" fill="none" stroke="#ad755f" stroke-width="2" stroke-linecap="round" opacity=".7"/>
      ${mouth}
      <circle cx="32" cy="59" r="4" fill="#e9827c" opacity=".15"/><circle cx="68" cy="59" r="4" fill="#e9827c" opacity=".15"/>
    </svg>
  `;
}

function createInjectedUi() {
  const homeHero = $('.home-hero');
  if (homeHero && !$('#crew-home-card')) {
    const card = document.createElement('section');
    card.id = 'crew-home-card';
    card.className = 'crew-home-card panel';
    card.innerHTML = `
      <button id="crew-home-main" class="crew-home-main" type="button" aria-label="파트너 선택 열기">
        <span id="crew-home-avatar" class="crew-avatar crew-avatar-large"></span>
        <span class="crew-home-copy">
          <small>오늘의 현장 파트너</small>
          <strong id="crew-home-name">윤서진</strong>
          <i id="crew-home-role">현장대장</i>
        </span>
        <span class="crew-change-label">팀 변경 →</span>
      </button>
      <blockquote id="crew-home-quote">“장비 점검했지?”</blockquote>
      <div class="crew-bond-row">
        <span id="crew-bond-title">낯선 동료</span>
        <div><i id="crew-bond-bar"></i></div>
        <b id="crew-bond-level">LV.1</b>
      </div>
      <div id="crew-mini-row" class="crew-mini-row"></div>
    `;
    homeHero.insertAdjacentElement('afterend', card);

    const mascot = document.createElement('div');
    mascot.id = 'navi-home-float';
    mascot.className = 'navi-home-float';
    mascot.innerHTML = `${portraitSvg(getCharacterById('nabi'), 'excited')}<span>삐빅! 팀 준비 완료</span>`;
    homeHero.append(mascot);
  }

  const playEnvironment = $('#play-environment');
  if (playEnvironment && !$('#crew-play-hud')) {
    const hud = document.createElement('aside');
    hud.id = 'crew-play-hud';
    hud.className = 'crew-play-hud';
    hud.innerHTML = `
      <span id="crew-play-avatar" class="crew-avatar crew-avatar-play"></span>
      <div class="crew-play-copy"><small id="crew-play-role">현장대장</small><strong id="crew-play-name">윤서진</strong><p id="crew-play-line">압력은 내가 볼게.</p></div>
      <button id="crew-skill-button" type="button"><span>지원</span><b id="crew-skill-label">강제 냉각</b></button>
      <i id="crew-intervention-flash">PARTNER ASSIST</i>
    `;
    const workArea = $('#vault-work-area');
    playEnvironment.insertBefore(hud, workArea ?? null);
  }

  const successResult = $('#success-result');
  if (successResult && !$('#crew-result-reaction')) {
    const reaction = document.createElement('div');
    reaction.id = 'crew-result-reaction';
    reaction.className = 'crew-result-reaction';
    reaction.innerHTML = `<span id="crew-result-avatar" class="crew-avatar"></span><div><small id="crew-result-name"></small><p id="crew-result-line"></p></div>`;
    const subtitle = $('#result-subtitle');
    subtitle?.insertAdjacentElement('afterend', reaction);
  }

  const failureResult = $('#failure-result');
  if (failureResult && !$('#crew-failure-reaction')) {
    const reaction = document.createElement('div');
    reaction.id = 'crew-failure-reaction';
    reaction.className = 'crew-result-reaction crew-failure-reaction';
    reaction.innerHTML = `<span id="crew-failure-avatar" class="crew-avatar"></span><div><small id="crew-failure-name"></small><p id="crew-failure-line"></p></div>`;
    const description = $('#failure-description');
    description?.insertAdjacentElement('afterend', reaction);
  }

  const app = $('#app');
  if (app && !$('#crew-modal')) {
    const modal = document.createElement('div');
    modal.id = 'crew-modal';
    modal.className = 'modal-backdrop crew-modal-backdrop';
    modal.hidden = true;
    modal.innerHTML = `
      <div class="crew-modal-card" role="dialog" aria-modal="true" aria-labelledby="crew-modal-title">
        <div class="crew-modal-heading">
          <div><span>RECOVERY CREW</span><h2 id="crew-modal-title">현장 파트너 선택</h2><p>파트너는 작업 중 대사와 고유 지원 행동을 제공합니다.</p></div>
          <button id="crew-modal-close" type="button" aria-label="팀 선택 닫기">×</button>
        </div>
        <div id="crew-roster" class="crew-roster"></div>
      </div>
    `;
    app.append(modal);
  }
}

function renderCrewHome() {
  const character = selectedCharacter();
  const xp = crewState.bonds[character.id] ?? 0;
  const bond = getBondProgress(xp);
  $('#crew-home-avatar').innerHTML = portraitSvg(character, 'smile');
  $('#crew-home-name').textContent = `${character.name} · ${character.callSign}`;
  $('#crew-home-role').textContent = character.role;
  $('#crew-home-quote').textContent = `“${pickCharacterLine(character, 'home', Date.now() + xp)}”`;
  $('#crew-bond-title').textContent = getBondTitle(bond.level);
  $('#crew-bond-level').textContent = `LV.${bond.level}`;
  $('#crew-bond-bar').style.width = `${bond.percentage}%`;

  $('#crew-mini-row').innerHTML = CHARACTERS.map((candidate) => {
    const candidateLevel = getBondLevel(crewState.bonds[candidate.id] ?? 0);
    return `
      <button type="button" class="crew-mini ${candidate.id === character.id ? 'active' : ''}" data-crew-select="${candidate.id}" aria-label="${escapeHtml(candidate.name)} 선택">
        ${portraitSvg(candidate, candidate.id === character.id ? 'excited' : 'smile')}
        <span>${escapeHtml(candidate.name)}</span><b>LV.${candidateLevel}</b>
      </button>
    `;
  }).join('');
}

function renderCrewModal() {
  const selected = selectedCharacter();
  $('#crew-roster').innerHTML = CHARACTERS.map((character) => {
    const xp = crewState.bonds[character.id] ?? 0;
    const bond = getBondProgress(xp);
    const nextThreshold = BOND_THRESHOLDS[Math.min(BOND_THRESHOLDS.length - 1, bond.level)] ?? xp;
    return `
      <button type="button" class="crew-roster-card ${character.id === selected.id ? 'selected' : ''}" data-crew-select="${character.id}" style="--crew-color:${character.color}">
        <span class="crew-roster-avatar">${portraitSvg(character, character.id === selected.id ? 'excited' : 'smile')}</span>
        <span class="crew-roster-copy">
          <small>${escapeHtml(character.callSign)} · ${escapeHtml(character.role)}</small>
          <strong>${escapeHtml(character.name)}</strong>
          <em>${escapeHtml(character.personality)}</em>
          <span class="crew-skill"><i>${escapeHtml(character.skillName)}</i>${escapeHtml(character.skillDescription)}</span>
          <span class="crew-roster-bond"><span><i style="width:${bond.percentage}%"></i></span><b>관계 LV.${bond.level}${bond.level < 6 ? ` · ${xp}/${nextThreshold}` : ' · MAX'}</b></span>
        </span>
        <span class="crew-selected-mark">${character.id === selected.id ? '동행 중' : '선택'}</span>
      </button>
    `;
  }).join('');
}

function renderPlayCrew() {
  const character = selectedCharacter();
  const avatar = $('#crew-play-avatar');
  if (!avatar) return;
  avatar.innerHTML = portraitSvg(character, 'smile');
  $('#crew-play-name').textContent = `${character.name} · ${character.callSign}`;
  $('#crew-play-role').textContent = character.role;
  $('#crew-skill-label').textContent = character.skillName;
  $('#crew-play-line').textContent = pickCharacterLine(character, 'job', Date.now());
}

function renderResultCrew(category = 'success') {
  const character = selectedCharacter();
  const success = category === 'success';
  const avatar = success ? $('#crew-result-avatar') : $('#crew-failure-avatar');
  const name = success ? $('#crew-result-name') : $('#crew-failure-name');
  const line = success ? $('#crew-result-line') : $('#crew-failure-line');
  if (!avatar || !name || !line) return;
  avatar.innerHTML = portraitSvg(character, success ? 'excited' : 'worried');
  name.textContent = `${character.name} · ${character.role}`;
  line.textContent = pickCharacterLine(character, category, Date.now() + (crewState.bonds[character.id] ?? 0));
}

function renderAllCrew() {
  renderCrewHome();
  renderCrewModal();
  renderPlayCrew();
}

function decorateJobCards() {
  const cards = $$('.job-card');
  cards.forEach((card, index) => {
    if ($('.job-character-contact', card)) return;
    const contact = getJobContact(index + 1);
    const quote = pickCharacterLine(contact, 'job', index + 2);
    const block = document.createElement('div');
    block.className = 'job-character-contact';
    block.innerHTML = `
      <span class="job-contact-avatar">${portraitSvg(contact, 'smile')}</span>
      <span><small>현장 연락관 · ${escapeHtml(contact.role)}</small><strong>${escapeHtml(contact.name)}</strong><q>${escapeHtml(quote)}</q></span>
    `;
    const startButton = $('.job-start-button', card);
    card.insertBefore(block, startButton ?? null);
  });
}

function openCrewModal() {
  renderCrewModal();
  $('#crew-modal').hidden = false;
}

function closeCrewModal() {
  $('#crew-modal').hidden = true;
}

function selectCrewMember(characterId) {
  const character = getCharacterById(characterId);
  crewState.selectedId = character.id;
  saveCrewState();
  lastTalkKey = '';
  lastResultKey = '';
  renderAllCrew();
  closeCrewModal();
  showCrewToast(`${character.name}이(가) 오늘의 현장 파트너가 됐습니다.`);
  pulseCrewAvatar();
}

function showCrewToast(message) {
  const existing = $('#crew-toast');
  const toast = existing ?? document.createElement('div');
  toast.id = 'crew-toast';
  toast.className = 'crew-toast';
  toast.textContent = message;
  if (!existing) $('#app')?.append(toast);
  requestAnimationFrame(() => toast.classList.add('show'));
  clearTimeout(toast.hideTimer);
  toast.hideTimer = setTimeout(() => toast.classList.remove('show'), 2400);
}

function pulseCrewAvatar() {
  const card = $('#crew-home-card');
  card?.classList.remove('crew-pulse');
  requestAnimationFrame(() => card?.classList.add('crew-pulse'));
}

function talk(category, force = false) {
  const character = selectedCharacter();
  const now = Date.now();
  const key = `${character.id}:${category}`;
  if (!force && key === lastTalkKey && now - lastTalkAt < 4200) return;
  if (!force && now - lastTalkAt < 1600) return;
  const line = pickCharacterLine(character, category, Math.floor(now / 1300) + (crewState.bonds[character.id] ?? 0));
  const lineElement = $('#crew-play-line');
  const avatar = $('#crew-play-avatar');
  if (!lineElement || !avatar) return;
  lineElement.textContent = line;
  avatar.innerHTML = portraitSvg(character, ['danger', 'fail'].includes(category) ? 'worried' : category === 'safe' ? 'excited' : 'smile');
  const hud = $('#crew-play-hud');
  hud?.classList.remove('talking');
  requestAnimationFrame(() => hud?.classList.add('talking'));
  lastTalkKey = key;
  lastTalkAt = now;
}

function readPercent(selector) {
  return Number.parseFloat($(selector)?.textContent ?? '0') || 0;
}

function readTimerSeconds() {
  const value = $('#play-timer')?.textContent ?? '00:00';
  const [minutes, seconds] = value.split(':').map((part) => Number.parseInt(part, 10) || 0);
  return minutes * 60 + seconds;
}

function pressureSnapshot() {
  const needle = Number.parseFloat($('#pressure-needle')?.style.left ?? '0') || 0;
  const target = $('#target-zone');
  const left = Number.parseFloat(target?.style.left ?? '0') || 0;
  const width = Number.parseFloat(target?.style.width ?? '0') || 0;
  return {
    needle,
    left,
    right: left + width,
    safe: needle >= left && needle <= left + width,
  };
}

function forceRelease(reason) {
  const now = Date.now();
  if (now - lastInterventionAt < 6200) return false;
  lastInterventionAt = now;
  const PointerEventClass = window.PointerEvent ?? window.Event;
  window.dispatchEvent(new PointerEventClass('pointerup', { bubbles: true }));
  $('#hold-button')?.dispatchEvent(new PointerEventClass('pointerup', { bubbles: true }));
  const flash = $('#crew-intervention-flash');
  if (flash) {
    flash.textContent = reason;
    flash.classList.remove('show');
    requestAnimationFrame(() => flash.classList.add('show'));
    setTimeout(() => flash.classList.remove('show'), 1500);
  }
  talk('danger', true);
  navigator.vibrate?.([28, 20, 45]);
  return true;
}

function playPing(frequency = 760) {
  try {
    const Context = window.AudioContext || window.webkitAudioContext;
    if (!Context) return;
    pingContext ??= new Context();
    if (pingContext.state === 'suspended') pingContext.resume().catch(() => {});
    const oscillator = pingContext.createOscillator();
    const gain = pingContext.createGain();
    const now = pingContext.currentTime;
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, now);
    oscillator.frequency.linearRampToValueAtTime(frequency + 140, now + 0.06);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.035, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
    oscillator.connect(gain);
    gain.connect(pingContext.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.1);
  } catch {
    // Audio cue is optional.
  }
}

function runCharacterIntervention(metrics) {
  const character = selectedCharacter();
  const pressed = $('#hold-button')?.classList.contains('pressed');
  if (!pressed) return;

  if (character.intervention === 'thermal-stop' && (metrics.heat >= 80 || metrics.noise >= 88)) {
    forceRelease('윤서진 · 강제 냉각 개입');
  } else if (character.intervention === 'pressure-cut' && metrics.pressure.needle > metrics.pressure.right + 5.5) {
    forceRelease('강민혁 · 과압 차단');
  } else if (character.intervention === 'heat-coach' && metrics.heat >= 73) {
    forceRelease('오주노 · 열 폭주 예측');
  } else if (character.intervention === 'story-sense' && metrics.integrity <= 54 && metrics.heat >= 58) {
    forceRelease('박하린 · 기록물 보호');
  }
}

function updateManualSkillButton() {
  const button = $('#crew-skill-button');
  if (!button) return;
  const elapsed = Date.now() - lastManualSkillAt;
  const remaining = Math.max(0, Math.ceil((8000 - elapsed) / 1000));
  button.disabled = remaining > 0;
  const character = selectedCharacter();
  $('#crew-skill-label').textContent = remaining > 0 ? `${remaining}초 후 재사용` : character.skillName;
}

function useManualSkill() {
  const now = Date.now();
  if (now - lastManualSkillAt < 8000) return;
  lastManualSkillAt = now;
  const character = selectedCharacter();
  const metrics = {
    heat: readPercent('#heat-value'),
    noise: readPercent('#noise-value'),
    integrity: readPercent('#integrity-value'),
    timer: readTimerSeconds(),
    pressure: pressureSnapshot(),
  };

  if (['thermal-stop', 'pressure-cut', 'heat-coach'].includes(character.intervention)) {
    forceRelease(`${character.name} · ${character.skillName}`);
  } else if (character.intervention === 'story-sense') {
    const advice = metrics.integrity < 65
      ? '내용물 상태가 낮아요. 이제는 짧게 눌러 보존을 우선해요.'
      : metrics.heat > 55
        ? '오래된 기록물이 있을 수 있어요. 냉각 후 다시 진행해요.'
        : '상태가 좋아요. 이대로면 반환 보상도 기대할 수 있어요.';
    $('#crew-play-line').textContent = advice;
    talk('job', true);
  } else if (character.intervention === 'deal-advice') {
    $('#crew-play-line').textContent = `현재 상태 ${Math.round(metrics.integrity)}%, 남은 시간 ${metrics.timer}초. ${metrics.timer < 10 ? '속도 우선.' : '보존 우선.'}`;
    $('#crew-play-hud')?.classList.add('talking');
  } else if (character.intervention === 'safe-ping') {
    $('#pressure-track')?.classList.add('crew-lockon');
    playPing(820);
    navigator.vibrate?.(15);
    setTimeout(() => $('#pressure-track')?.classList.remove('crew-lockon'), 3200);
    talk('safe', true);
  }
  updateManualSkillButton();
}

function monitorPlay() {
  const playActive = $('#screen-play')?.classList.contains('active') ?? false;
  if (!playActive) {
    if (lastPlayActive) {
      lastTalkKey = '';
      lastSafeState = false;
    }
    lastPlayActive = false;
    monitorResult();
    return;
  }

  if (!lastPlayActive) {
    renderPlayCrew();
    talk('job', true);
    lastInterventionAt = 0;
    lastManualSkillAt = 0;
  }
  lastPlayActive = true;

  const metrics = {
    heat: readPercent('#heat-value'),
    noise: readPercent('#noise-value'),
    integrity: readPercent('#integrity-value'),
    progress: readPercent('#play-progress'),
    timer: readTimerSeconds(),
    pressure: pressureSnapshot(),
  };
  const pressed = $('#hold-button')?.classList.contains('pressed') ?? false;
  const message = $('#play-message')?.textContent ?? '';

  if (pressed && metrics.pressure.safe) talk('safe');
  else if (message.includes('과다') || metrics.heat >= 76 || metrics.noise >= 82 || metrics.integrity <= 45) talk('danger');
  else if (metrics.timer <= 8) talk('danger');
  else if (!pressed && metrics.heat > 35) talk('job');

  const character = selectedCharacter();
  if (character.intervention === 'safe-ping' && pressed && metrics.pressure.safe && !lastSafeState) {
    playPing(760 + Math.min(180, metrics.progress * 1.5));
    $('#target-zone')?.classList.add('crew-safe-flash');
    setTimeout(() => $('#target-zone')?.classList.remove('crew-safe-flash'), 280);
  }
  lastSafeState = metrics.pressure.safe;
  runCharacterIntervention(metrics);
  updateManualSkillButton();
}

function monitorResult() {
  const resultActive = $('#screen-result')?.classList.contains('active') ?? false;
  if (!resultActive) return;
  const successVisible = $('#success-result') && !$('#success-result').hidden;
  if (successVisible) {
    const itemName = $('#result-item-name')?.textContent ?? '';
    const rarity = $('#result-rarity')?.textContent ?? '';
    const key = `success:${itemName}:${rarity}`;
    if (key !== lastResultKey) {
      renderResultCrew('success');
      const character = selectedCharacter();
      if (character.intervention === 'deal-advice') {
        $('#crew-result-line').textContent = rarity.includes('전설')
          ? '전설급이면 현금보다 평판 효과까지 계산해야 합니다. 서두르지 마세요.'
          : pickCharacterLine(character, 'success', Date.now());
      } else if (character.intervention === 'story-sense' && itemName) {
        $('#crew-result-line').textContent = `${itemName}… 이름부터 수상해요. 경매 전에 반환할 사람부터 생각해 봐요.`;
      }
      lastResultKey = key;
    }
  } else {
    const failureTitle = $('#failure-title')?.textContent ?? '';
    const key = `fail:${failureTitle}`;
    if (key !== lastResultKey) {
      renderResultCrew('fail');
      lastResultKey = key;
    }
  }
}

function syncBondProgress() {
  const main = readMainState();
  if (!main?.stats) return;
  const completed = Math.max(0, Number(main.stats.jobsCompleted) || 0);
  const failed = Math.max(0, Number(main.stats.jobsFailed) || 0);

  if (completed < crewState.lastCompleted || failed < crewState.lastFailed) {
    crewState = createCrewState(main);
    saveCrewState();
    renderAllCrew();
    return;
  }

  const character = selectedCharacter();
  let gained = 0;
  if (completed > crewState.lastCompleted) {
    const count = completed - crewState.lastCompleted;
    gained += count * 3;
    const recent = main.recentFinds?.[0];
    const signature = recent ? `${recent.day}:${recent.itemId}` : '';
    if (recent && signature !== crewState.lastRecentSignature) {
      if (recent.grade === 'S') gained += 2;
      if (recent.choice === 'return') gained += 1;
      crewState.lastRecentSignature = signature;
    }
  }
  if (failed > crewState.lastFailed) gained += failed - crewState.lastFailed;

  if (gained > 0) {
    const previousLevel = getBondLevel(crewState.bonds[character.id] ?? 0);
    crewState.bonds[character.id] = (crewState.bonds[character.id] ?? 0) + gained;
    const nextLevel = getBondLevel(crewState.bonds[character.id]);
    crewState.lastCompleted = completed;
    crewState.lastFailed = failed;
    saveCrewState();
    renderAllCrew();
    if (nextLevel > previousLevel) {
      showCrewToast(`${character.name} 관계 LV.${nextLevel} · ${getBondTitle(nextLevel)} 해제`);
      pulseCrewAvatar();
    }
  } else {
    crewState.lastCompleted = completed;
    crewState.lastFailed = failed;
    saveCrewState();
  }
}

function bindCrewEvents() {
  document.addEventListener('click', (event) => {
    const selector = event.target.closest('[data-crew-select]');
    if (selector) {
      selectCrewMember(selector.dataset.crewSelect);
      return;
    }
    if (event.target.closest('#crew-home-main')) openCrewModal();
  });

  $('#crew-modal-close')?.addEventListener('click', closeCrewModal);
  $('#crew-modal')?.addEventListener('click', (event) => {
    if (event.target.id === 'crew-modal') closeCrewModal();
  });
  $('#crew-skill-button')?.addEventListener('click', useManualSkill);
}

function bootstrapCharacters() {
  if (!$('#app') || $('#crew-home-card')) return;
  crewState = loadCrewState();
  createInjectedUi();
  renderAllCrew();
  decorateJobCards();
  bindCrewEvents();

  const jobsObserver = new MutationObserver(decorateJobCards);
  const jobsList = $('#jobs-list');
  if (jobsList) jobsObserver.observe(jobsList, { childList: true });

  monitorTimer = window.setInterval(monitorPlay, 180);
  syncTimer = window.setInterval(syncBondProgress, 900);
  window.addEventListener('beforeunload', () => {
    clearInterval(monitorTimer);
    clearInterval(syncTimer);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => setTimeout(bootstrapCharacters, 0), { once: true });
} else {
  setTimeout(bootstrapCharacters, 0);
}
