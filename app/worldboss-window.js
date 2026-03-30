const detachedShell = document.getElementById('worldBossDetachedShell');
const detachedOverlay = document.getElementById('worldBossDetachedOverlay');
const detachedList = document.getElementById('worldBossDetachedList');
const resizeHandles = Array.from(document.querySelectorAll('.worldboss-detached-resize'));

const WORLD_BOSS_DEFINITIONS = [
  { id: 'titanseal-runebound', name: 'Titanseal Runebound', hour: 17, minute: 0, icon: 'map/bosstimer/titan.png' },
  { id: 'aero-forge-colossus', name: 'Aero-Forge Colossus', hour: 18, minute: 0, icon: 'map/bosstimer/aero-forge.png' },
  { id: 'ironscale-draconarch', name: 'Ironscale Draconarch', hour: 19, minute: 0, icon: 'map/bosstimer/ironscale.png' },
  { id: 'doomcaller', name: 'Doomcaller', hour: 20, minute: 0, icon: 'map/bosstimer/doomcaller.png' },
  { id: 'vel-khurath', name: "Vel'khurath", hour: 21, minute: 0, icon: 'map/bosstimer/velkhurath.png' },
  { id: 'seraphiel', name: 'Seraphiel', hour: 22, minute: 0, icon: 'map/bosstimer/seraphiel.png' },
];

const WORLD_BOSS_TIMER_CORRECTION_MS = 2000;
const MIN_SCALE = 0.7;
const MAX_SCALE = 2.4;
const SHELL_PADDING = 12;
const MENU_GAP = 10;
const MENU_CLOSE_DELAY_MS = 320;
const MENU_HIDE_DURATION_MS = 120;
const BASE_MENU_WIDTH = 190;
const MIN_WINDOW_WIDTH = 92;
const MIN_WINDOW_HEIGHT = 140;
const ALARM_SOUND_DURATION_MS = 10000;

let uiSettings = null;
let overlayTimer = null;
let resizeState = null;
let activeMenuBossId = null;
let openingMenuBossId = null;
let menuCloseTimer = null;
let detachedScale = 1;
let detachedMenuSide = 'right';
let menuVisibilityLockUntil = 0;
let alarmAudioContext = null;
let alarmOscillator = null;
let alarmGainNode = null;
let alarmStopTimer = null;
let activeAlarmBossId = null;

function getWorldBossTrackerSettings() {
  return uiSettings?.worldBossTracker || { bosses: {} };
}

function formatWorldBossSpawnTime(boss) {
  return `${String(boss.hour).padStart(2, '0')}:${String(boss.minute).padStart(2, '0')}`;
}

function getNextWorldBossSpawnAt(boss) {
  const now = new Date();
  const nextSpawn = new Date(now);
  nextSpawn.setHours(boss.hour, boss.minute, 0, 0);
  if (nextSpawn.getTime() <= now.getTime()) {
    nextSpawn.setDate(nextSpawn.getDate() + 1);
  }
  return nextSpawn;
}

function getWorldBossRemainingMs(boss) {
  return Math.max(0, getNextWorldBossSpawnAt(boss).getTime() - Date.now() + WORLD_BOSS_TIMER_CORRECTION_MS);
}

function getWorldBossAlertSignature(boss, offsetMinutes) {
  return `${boss.id}:${getNextWorldBossSpawnAt(boss).toISOString()}:${offsetMinutes}`;
}

function formatWorldBossDuration(ms) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function saveTracker(tracker) {
  uiSettings = {
    ...(uiSettings || {}),
    worldBossTracker: tracker,
  };
  window.livemapApi.setUiSettings({
    worldBossTracker: tracker,
  });
}

function getActiveAlertBossId(nextSettings = uiSettings) {
  const tracker = nextSettings?.worldBossTracker || { bosses: {} };
  for (const boss of WORLD_BOSS_DEFINITIONS) {
    const state = tracker.bosses?.[boss.id] || {};
    const offsetMinutes = Number(state.alertOffsetMinutes);
    if (!Number.isFinite(offsetMinutes) || offsetMinutes <= 0) {
      continue;
    }
    if (state.activeAlertSignature === getWorldBossAlertSignature(boss, offsetMinutes)) {
      return boss.id;
    }
  }
  return null;
}

function stopAlarmSound() {
  if (alarmStopTimer) {
    clearTimeout(alarmStopTimer);
    alarmStopTimer = null;
  }
  if (alarmOscillator) {
    try {
      alarmOscillator.stop();
    } catch (_error) {
      // ignore
    }
    alarmOscillator.disconnect();
    alarmOscillator = null;
  }
  if (alarmGainNode) {
    alarmGainNode.disconnect();
    alarmGainNode = null;
  }
}

function startAlarmSoundForBoss(bossId) {
  if (!bossId || activeAlarmBossId === bossId) {
    return;
  }

  stopAlarmSound();
  activeAlarmBossId = bossId;
  const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextCtor) {
    alarmStopTimer = setTimeout(() => {
      stopAlarmSound();
      activeAlarmBossId = null;
    }, ALARM_SOUND_DURATION_MS);
    return;
  }

  if (!alarmAudioContext) {
    alarmAudioContext = new AudioContextCtor();
  }

  if (alarmAudioContext.state === 'suspended') {
    void alarmAudioContext.resume();
  }

  const now = alarmAudioContext.currentTime;
  alarmOscillator = alarmAudioContext.createOscillator();
  alarmGainNode = alarmAudioContext.createGain();
  alarmOscillator.type = 'square';
  alarmOscillator.frequency.setValueAtTime(880, now);
  alarmGainNode.gain.setValueAtTime(0.0001, now);

  for (let step = 0; step < 10; step += 1) {
    const start = now + step;
    alarmGainNode.gain.setValueAtTime(0.0001, start);
    alarmGainNode.gain.linearRampToValueAtTime(0.09, start + 0.03);
    alarmGainNode.gain.linearRampToValueAtTime(0.0001, start + 0.55);
  }

  alarmOscillator.connect(alarmGainNode);
  alarmGainNode.connect(alarmAudioContext.destination);
  alarmOscillator.start(now);
  alarmOscillator.stop(now + (ALARM_SOUND_DURATION_MS / 1000));
  alarmOscillator.onended = () => {
    stopAlarmSound();
  };
  alarmStopTimer = setTimeout(() => {
    stopAlarmSound();
  }, ALARM_SOUND_DURATION_MS);
}

function syncActiveAlarmPlayback(nextSettings = uiSettings) {
  const nextBossId = getActiveAlertBossId(nextSettings);
  if (!nextBossId) {
    activeAlarmBossId = null;
    stopAlarmSound();
    return;
  }
  if (activeAlarmBossId !== nextBossId) {
    startAlarmSoundForBoss(nextBossId);
  }
}

function applyScale() {
  detachedShell?.style.setProperty('--worldboss-detached-scale', detachedScale.toFixed(3));
}

function getCollapsedMetrics() {
  if (!detachedOverlay) {
    return { width: 96, height: 360 };
  }

  return {
    width: Math.ceil(detachedOverlay.offsetWidth * detachedScale) + (SHELL_PADDING * 2),
    height: Math.ceil(detachedOverlay.offsetHeight * detachedScale) + (SHELL_PADDING * 2),
  };
}

function getExpandedBaseMetrics() {
  const collapsed = getCollapsedMetrics();
  return {
    width: collapsed.width + Math.ceil((BASE_MENU_WIDTH + MENU_GAP) * detachedScale),
    height: collapsed.height,
  };
}

function getTargetWindowSize() {
  return (activeMenuBossId || openingMenuBossId) ? getExpandedBaseMetrics() : getCollapsedMetrics();
}

async function updateMenuSide() {
  const bounds = await window.livemapApi.getWindowBounds();
  const workArea = await window.livemapApi.getDisplayWorkArea();
  const windowCenterX = bounds.x + (bounds.width / 2);
  const screenCenterX = workArea.x + (workArea.width / 2);
  detachedMenuSide = windowCenterX >= screenCenterX ? 'left' : 'right';
  if (detachedShell) {
    detachedShell.dataset.menuSide = detachedMenuSide;
  }
}

function markActiveMenu() {
  for (const wrap of detachedList?.querySelectorAll('.worldboss-overlay-card-icon-wrap') || []) {
    wrap.classList.toggle('is-menu-open', wrap.dataset.bossId === activeMenuBossId);
  }
}

async function fitWindowToContent() {
  const targetSize = getTargetWindowSize();
  const currentBounds = await window.livemapApi.getWindowBounds();
  const nextBounds = buildAnchoredBounds(currentBounds, {
    width: Math.max(MIN_WINDOW_WIDTH, Math.round(targetSize.width)),
    height: Math.max(MIN_WINDOW_HEIGHT, Math.round(targetSize.height)),
  });

  await animateWindowBounds(currentBounds, nextBounds);
}

function buildAnchoredBounds(currentBounds, targetSize) {
  const nextBounds = {
    x: currentBounds.x,
    y: currentBounds.y,
    width: targetSize.width,
    height: targetSize.height,
    viewKey: 'worldBossOverlayWindow',
  };

  if (detachedMenuSide === 'left') {
    const rightEdge = currentBounds.x + currentBounds.width;
    nextBounds.x = rightEdge - nextBounds.width;
  }

  return nextBounds;
}

async function animateWindowBounds(fromBounds, toBounds) {
  if (
    fromBounds.x === toBounds.x
    && fromBounds.y === toBounds.y
    && fromBounds.width === toBounds.width
    && fromBounds.height === toBounds.height
  ) {
    return;
  }

  await window.livemapApi.setWindowBounds({
    x: Math.round(toBounds.x),
    y: Math.round(toBounds.y),
    width: Math.round(toBounds.width),
    height: Math.round(toBounds.height),
    viewKey: 'worldBossOverlayWindow',
    persist: false,
  });
}

function renderWorldBossOverlay() {
  if (!detachedList) {
    return;
  }

  const tracker = getWorldBossTrackerSettings();
  detachedList.innerHTML = WORLD_BOSS_DEFINITIONS.map((boss, index) => {
    const bossState = tracker.bosses?.[boss.id] || {};
    const hasAlert = Number.isFinite(Number(bossState.alertOffsetMinutes)) && Number(bossState.alertOffsetMinutes) > 0;
    const isAlertFiring = hasAlert
      && bossState.activeAlertSignature === getWorldBossAlertSignature(boss, Number(bossState.alertOffsetMinutes));
    const verticalAnchor = index <= 1 ? 'top' : index >= WORLD_BOSS_DEFINITIONS.length - 2 ? 'bottom' : 'center';
    return `
      <article class="worldboss-overlay-card" data-alert-active="${hasAlert ? 'true' : 'false'}" data-alert-firing="${isAlertFiring ? 'true' : 'false'}">
        <div class="worldboss-overlay-card-icon-wrap" data-boss-id="${boss.id}" data-menu-vertical="${verticalAnchor}">
          <img class="worldboss-overlay-card-icon" src="${boss.icon}" alt="${boss.name}" title="${boss.name}">
          <div class="worldboss-overlay-card-menu">
            <strong>${boss.name}</strong>
            <span>${formatWorldBossSpawnTime(boss)} Uhr</span>
            <strong data-worldboss-overlay-status="${boss.id}">${formatWorldBossDuration(getWorldBossRemainingMs(boss))}</strong>
          <label class="worldboss-overlay-card-menu-field">
            <span>Alarm</span>
            <select data-worldboss-overlay-alert="${boss.id}">
              <option value="">Kein Alarm</option>
              <option value="1" ${Number(bossState.alertOffsetMinutes) === 1 ? 'selected' : ''}>1 Min vorher</option>
                <option value="5" ${Number(bossState.alertOffsetMinutes) === 5 ? 'selected' : ''}>5 Min vorher</option>
                <option value="10" ${Number(bossState.alertOffsetMinutes) === 10 ? 'selected' : ''}>10 Min vorher</option>
                <option value="15" ${Number(bossState.alertOffsetMinutes) === 15 ? 'selected' : ''}>15 Min vorher</option>
              <option value="30" ${Number(bossState.alertOffsetMinutes) === 30 ? 'selected' : ''}>30 Min vorher</option>
              <option value="60" ${Number(bossState.alertOffsetMinutes) === 60 ? 'selected' : ''}>60 Min vorher</option>
            </select>
          </label>
        </div>
      </div>
    </article>`;
  }).join('');

  markActiveMenu();
  applyScale();
}

function updateWorldBossStatuses() {
  if (!detachedList) {
    return;
  }

  for (const boss of WORLD_BOSS_DEFINITIONS) {
    const statusElement = detachedList.querySelector(`[data-worldboss-overlay-status="${boss.id}"]`);
    if (statusElement) {
      statusElement.textContent = formatWorldBossDuration(getWorldBossRemainingMs(boss));
    }
  }
}

function notifyForBoss(boss, minutesBefore) {
  try {
    new Notification(`Weltboss-Alarm: ${boss.name}`, {
      body: `${boss.name} spawnt um ${formatWorldBossSpawnTime(boss)} Uhr. Alarm ${minutesBefore} Minuten vorher.`,
      silent: false,
    });
  } catch (_error) {
    // ignore notification errors
  }
}

function checkWorldBossAlerts() {
  const tracker = getWorldBossTrackerSettings();
  const now = Date.now();

  for (const boss of WORLD_BOSS_DEFINITIONS) {
    const state = tracker.bosses?.[boss.id] || {};
    const offsetMinutes = Number(state.alertOffsetMinutes);
    if (!Number.isFinite(offsetMinutes) || offsetMinutes <= 0) {
      continue;
    }

    const nextSpawnAt = getNextWorldBossSpawnAt(boss);
    const triggerAt = nextSpawnAt.getTime() - (offsetMinutes * 60 * 1000);
    const signature = getWorldBossAlertSignature(boss, offsetMinutes);
    if (now >= triggerAt && state.lastAlertSignature !== signature) {
      const nextTracker = {
        ...tracker,
        bosses: {
          ...(tracker.bosses || {}),
          [boss.id]: {
            ...state,
            activeAlertSignature: signature,
            lastAlertSignature: signature,
          },
        },
      };
      saveTracker(nextTracker);
      notifyForBoss(boss, offsetMinutes);
      syncActiveAlarmPlayback({
        ...(uiSettings || {}),
        worldBossTracker: nextTracker,
      });
    }
  }
}

function startOverlayLoop() {
  if (overlayTimer) {
    clearInterval(overlayTimer);
  }

  overlayTimer = setInterval(() => {
    updateWorldBossStatuses();
    checkWorldBossAlerts();
  }, 1000);
}

function scheduleMenuClose() {
  if (menuCloseTimer) {
    clearTimeout(menuCloseTimer);
  }
  menuCloseTimer = setTimeout(() => {
    if (Date.now() < menuVisibilityLockUntil) {
      scheduleMenuClose();
      return;
    }
    void closeActiveMenu();
  }, MENU_CLOSE_DELAY_MS);
}

function cancelScheduledMenuClose() {
  if (menuCloseTimer) {
    clearTimeout(menuCloseTimer);
    menuCloseTimer = null;
  }
}

async function openMenuForBoss(bossId) {
  cancelScheduledMenuClose();
  if (!bossId) {
    return;
  }

  if (activeMenuBossId === bossId) {
    return;
  }

  const activeElement = document.activeElement;
  if (activeElement instanceof HTMLSelectElement) {
    activeElement.blur();
  }

  openingMenuBossId = bossId;
  activeMenuBossId = null;
  for (const wrap of detachedList?.querySelectorAll('.worldboss-overlay-card-icon-wrap') || []) {
    wrap.classList.remove('is-menu-open');
  }
  await updateMenuSide();
  menuVisibilityLockUntil = Date.now() + 120;
  await fitWindowToContent();
  openingMenuBossId = null;
  activeMenuBossId = bossId;
  markActiveMenu();
}

async function closeActiveMenu() {
  cancelScheduledMenuClose();
  if (!activeMenuBossId) {
    return;
  }

  openingMenuBossId = null;
  activeMenuBossId = null;
  markActiveMenu();
  await new Promise((resolve) => {
    window.setTimeout(resolve, MENU_HIDE_DURATION_MS);
  });
  await fitWindowToContent();
}

async function startResize(event) {
  const direction = event.currentTarget?.dataset?.resize;
  if (!direction) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();
  cancelScheduledMenuClose();
  const bounds = await window.livemapApi.getWindowBounds();
  resizeState = {
    direction,
    startScreenX: event.screenX,
    startScreenY: event.screenY,
    startX: bounds.x,
    startY: bounds.y,
    startWidth: bounds.width,
    startHeight: bounds.height,
  };
  event.currentTarget.setPointerCapture?.(event.pointerId);
  document.body.dataset.resizing = 'true';
}

async function updateResize(event) {
  if (!resizeState) {
    return;
  }

  const dx = event.screenX - resizeState.startScreenX;
  const dy = event.screenY - resizeState.startScreenY;
  const baseMetrics = getExpandedBaseMetrics();
  let targetWidth = resizeState.startWidth;
  let targetHeight = resizeState.startHeight;

  if (resizeState.direction.includes('e')) {
    targetWidth += dx;
  }
  if (resizeState.direction.includes('w')) {
    targetWidth -= dx;
  }
  if (resizeState.direction.includes('s')) {
    targetHeight += dy;
  }
  if (resizeState.direction.includes('n')) {
    targetHeight -= dy;
  }

  const scaleFromWidth = targetWidth / Math.max(1, baseMetrics.width);
  const scaleFromHeight = targetHeight / Math.max(1, baseMetrics.height);
  detachedScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, Math.max(scaleFromWidth, scaleFromHeight)));
  applyScale();

  const nextBounds = {
    x: resizeState.startX,
    y: resizeState.startY,
    width: Math.max(MIN_WINDOW_WIDTH, Math.round(targetWidth)),
    height: Math.max(MIN_WINDOW_HEIGHT, Math.round(targetHeight)),
    viewKey: 'worldBossOverlayWindow',
  };

  if (resizeState.direction.includes('w')) {
    nextBounds.x = resizeState.startX + (resizeState.startWidth - nextBounds.width);
  }
  if (resizeState.direction.includes('n')) {
    nextBounds.y = resizeState.startY + (resizeState.startHeight - nextBounds.height);
  }

  await window.livemapApi.setWindowBounds(nextBounds);
}

function stopResize(event) {
  if (!resizeState) {
    return;
  }

  event?.currentTarget?.releasePointerCapture?.(event.pointerId);
  resizeState = null;
  delete document.body.dataset.resizing;
}

async function initialize() {
  uiSettings = await window.livemapApi.getUiSettings();
  renderWorldBossOverlay();
  await updateMenuSide();
  await fitWindowToContent();
  startOverlayLoop();
  syncActiveAlarmPlayback(uiSettings);

  window.livemapApi.onUiSettings((nextSettings) => {
    uiSettings = nextSettings || uiSettings;
    renderWorldBossOverlay();
    syncActiveAlarmPlayback(uiSettings);
  });
}

detachedList?.addEventListener('change', (event) => {
  const target = event.target;
  const bossId = target.dataset.worldbossOverlayAlert;
  if (!bossId) {
    return;
  }

  const tracker = getWorldBossTrackerSettings();
  const currentBoss = tracker.bosses?.[bossId] || {};
  saveTracker({
    ...tracker,
    bosses: {
      ...(tracker.bosses || {}),
      [bossId]: {
        ...currentBoss,
        alertOffsetMinutes: target.value ? Number(target.value) : null,
        lastAlertSignature: null,
      },
    },
  });
  renderWorldBossOverlay();
  void closeActiveMenu();
});

detachedList?.addEventListener('click', (event) => {
  const iconWrap = event.target.closest('.worldboss-overlay-card-icon-wrap');
  if (!iconWrap) {
    return;
  }

  const bossId = iconWrap.dataset.bossId;
  if (!bossId) {
    return;
  }

  const tracker = getWorldBossTrackerSettings();
  const currentBoss = tracker.bosses?.[bossId] || {};
  if (!currentBoss.activeAlertSignature) {
    return;
  }

  event.preventDefault();
  activeAlarmBossId = null;
  stopAlarmSound();
  saveTracker({
    ...tracker,
    bosses: {
      ...(tracker.bosses || {}),
      [bossId]: {
        ...currentBoss,
        activeAlertSignature: null,
      },
    },
  });
  renderWorldBossOverlay();
});

detachedList?.addEventListener('mouseenter', (event) => {
  const wrap = event.target.closest('.worldboss-overlay-card-icon-wrap');
  if (!wrap) {
    return;
  }
  void openMenuForBoss(wrap.dataset.bossId);
}, true);

detachedList?.addEventListener('mouseleave', (event) => {
  const wrap = event.target.closest('.worldboss-overlay-card-icon-wrap');
  if (!wrap) {
    return;
  }
  scheduleMenuClose();
}, true);

detachedList?.addEventListener('focusin', (event) => {
  const wrap = event.target.closest('.worldboss-overlay-card-icon-wrap');
  if (!wrap) {
    return;
  }
  void openMenuForBoss(wrap.dataset.bossId);
});

detachedList?.addEventListener('focusout', () => {
  scheduleMenuClose();
});

detachedList?.addEventListener('pointerenter', cancelScheduledMenuClose);
detachedList?.addEventListener('mousedown', () => {
  cancelScheduledMenuClose();
  menuVisibilityLockUntil = Date.now() + 800;
});
detachedList?.addEventListener('focusin', () => {
  cancelScheduledMenuClose();
  menuVisibilityLockUntil = Date.now() + 800;
});

for (const handle of resizeHandles) {
  handle.addEventListener('pointerdown', (event) => {
    void startResize(event);
  });
  handle.addEventListener('pointermove', updateResize);
  handle.addEventListener('pointerup', stopResize);
  handle.addEventListener('pointercancel', stopResize);
}

window.addEventListener('pointermove', updateResize);
window.addEventListener('pointerup', stopResize);
window.addEventListener('pointercancel', stopResize);
window.addEventListener('beforeunload', () => {
  activeAlarmBossId = null;
  stopAlarmSound();
  if (overlayTimer) {
    clearInterval(overlayTimer);
    overlayTimer = null;
  }
});

void initialize();
