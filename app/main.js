const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const { createAuthManager } = require('./auth');
const { createUpdater } = require('./updater');

let playerProcess;
let inventoryProcess;
let altarProcess;
let mainWindow = null;
let plannerWindow = null;
let altarWindow = null;
let worldBossWindow = null;
let tutorialWindow = null;
let tutorialStepPayload = null;
let worldBossWindowTransientBounds = false;
let authRefreshInterval = null;
let authRefreshInFlight = false;
let settings;
let updater;
let authManager;
let authState = {
  configured: false,
  loading: false,
  configError: null,
  session: {
    loggedIn: false,
    userId: null,
    email: null,
    displayName: null,
    avatarUrl: null,
  },
  access: {
    role: 'public',
    blocked: false,
    features: {
      findNearest: false,
      routePlanner: false,
      altars: false,
      worldBossTimer: false,
      admin: false,
    },
    message: 'Bitte mit Discord anmelden.',
  },
};
let lastPlayerPosition = null;
let routeState = {
  activeRoute: null,
  previewRoute: null,
  paused: false,
};

function hasFeatureAccess(featureKey) {
  return Boolean(authState?.access?.features?.[featureKey]);
}

function isAuthenticatedAndAllowed() {
  return Boolean(authState?.session?.loggedIn && authState?.session?.userId && !authState?.access?.blocked);
}

function stopAuthRefreshInterval() {
  if (authRefreshInterval) {
    clearInterval(authRefreshInterval);
    authRefreshInterval = null;
  }
}

function startAuthRefreshInterval() {
  stopAuthRefreshInterval();
  if (!authState?.session?.loggedIn || !authManager) {
    return;
  }

  authRefreshInterval = setInterval(async () => {
    if (authRefreshInFlight || !authState?.session?.loggedIn || !authManager) {
      return;
    }

    authRefreshInFlight = true;
    try {
      await authManager.refreshAccess();
    } catch (_error) {
      // Ignore transient polling errors and retry on the next interval.
    } finally {
      authRefreshInFlight = false;
    }
  }, AUTH_REFRESH_INTERVAL_MS);
}

function resetRouteState() {
  routeState = {
    activeRoute: null,
    previewRoute: null,
    paused: false,
  };
}

const DEFAULT_WINDOW_BOUNDS = {
  width: 1100,
  height: 820,
};

const AUTH_REFRESH_INTERVAL_MS = 10000;

const DEFAULT_SETTINGS = {
  markerOnlyMode: false,
  altarTrackingEnabled: false,
  markerCooldownsByChannel: {},
  worldBossOverlayWindow: {
    bounds: {
      width: 320,
      height: 460,
    },
  },
  normalView: {
    windowOpacity: 100,
    activeOreFilters: [],
    bounds: { ...DEFAULT_WINDOW_BOUNDS },
  },
  markerView: {
    windowOpacity: 100,
    activeOreFilters: [],
    frameVisible: false,
    bounds: {
      width: 720,
      height: 720,
    },
  },
};

function getPlayerLockPath() {
  return path.join(app.getPath('userData'), 'playerposition-lock.json');
}

function readPlayerLock() {
  try {
    const raw = fs.readFileSync(getPlayerLockPath(), 'utf8').replace(/^\uFEFF/, '');
    const payload = JSON.parse(raw);
    const position = payload?.position || {};
    const x = Number(position.x);
    const y = Number(position.y);
    const z = Number(position.z);
    const signature = typeof payload?.signature === 'string' ? payload.signature : '';

    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z) || !signature) {
      return { active: false };
    }

    return {
      active: true,
      signature,
      position: { x, y, z },
      updatedAt: payload?.updatedAt || null,
    };
  } catch (_error) {
    return { active: false };
  }
}

function writePlayerLock(payload) {
  if (!payload?.active || !payload?.signature) {
    try {
      fs.rmSync(getPlayerLockPath(), { force: true });
    } catch (_error) {
      // ignore
    }
    return { active: false };
  }

  const position = payload?.position || {};
  const nextPayload = {
    signature: String(payload?.signature || ''),
    position: {
      x: Number(position.x),
      y: Number(position.y),
      z: Number(position.z),
    },
    updatedAt: new Date().toISOString(),
  };

  fs.writeFileSync(getPlayerLockPath(), JSON.stringify(nextPayload, null, 2), 'utf8');
  return readPlayerLock();
}

function sanitizeBounds(bounds, fallback, minWidth = 260, minHeight = 220) {
  const safeFallback = fallback || DEFAULT_WINDOW_BOUNDS;
  const x = Number(bounds?.x);
  const y = Number(bounds?.y);
  const width = Number(bounds?.width);
  const height = Number(bounds?.height);

  return {
    x: Number.isFinite(x) ? Math.round(x) : safeFallback.x,
    y: Number.isFinite(y) ? Math.round(y) : safeFallback.y,
    width: Number.isFinite(width) && width >= minWidth ? Math.round(width) : safeFallback.width,
    height: Number.isFinite(height) && height >= minHeight ? Math.round(height) : safeFallback.height,
  };
}

function saveWorldBossOverlayWindowBounds(bounds) {
  if (!settings) {
    return;
  }

  const fallback = {
    ...DEFAULT_SETTINGS.worldBossOverlayWindow.bounds,
    x: bounds?.x,
    y: bounds?.y,
  };
  settings = {
    ...settings,
    worldBossOverlayWindow: {
      ...(settings.worldBossOverlayWindow || {}),
      bounds: sanitizeBounds(
        bounds,
        fallback,
        92,
        140,
      ),
    },
  };
  saveSettings();
  broadcastUiSettings();
}

function getSettingsPath() {
  return path.join(app.getPath('userData'), 'livemap-settings.json');
}

function loadSettings() {
  try {
    const rawSettings = fs.readFileSync(getSettingsPath(), 'utf8').replace(/^\uFEFF/, '');
    const payload = JSON.parse(rawSettings);
    const normalView = payload.normalView || {
      windowOpacity: payload.windowOpacity,
      activeOreFilters: payload.activeOreFilters,
      bounds: payload.normalBounds,
    };
    const markerView = payload.markerView || {
      windowOpacity: payload.windowOpacity,
      activeOreFilters: payload.activeOreFilters,
      frameVisible: payload.markerFrameVisible,
      bounds: payload.markerBounds,
    };

      settings = {
        ...DEFAULT_SETTINGS,
        ...payload,
        // Always boot into the normal livemap; marker-only remains a runtime toggle.
        markerOnlyMode: false,
        markerCooldownsByChannel: payload.markerCooldownsByChannel || {},
        normalView: {
          ...DEFAULT_SETTINGS.normalView,
          ...normalView,
        bounds: sanitizeBounds(normalView.bounds, DEFAULT_SETTINGS.normalView.bounds),
      },
      markerView: {
        ...DEFAULT_SETTINGS.markerView,
        ...markerView,
        frameVisible: Boolean(markerView.frameVisible),
        bounds: sanitizeBounds(markerView.bounds, DEFAULT_SETTINGS.markerView.bounds),
      },
      worldBossOverlayWindow: {
        ...DEFAULT_SETTINGS.worldBossOverlayWindow,
        ...(payload.worldBossOverlayWindow || {}),
        bounds: sanitizeBounds(
          payload.worldBossOverlayWindow?.bounds,
          DEFAULT_SETTINGS.worldBossOverlayWindow.bounds,
          92,
          140,
        ),
      },
    };
  } catch (_error) {
      settings = {
        ...DEFAULT_SETTINGS,
        markerCooldownsByChannel: {},
        normalView: {
          ...DEFAULT_SETTINGS.normalView,
          bounds: { ...DEFAULT_SETTINGS.normalView.bounds },
      },
      markerView: {
        ...DEFAULT_SETTINGS.markerView,
        bounds: { ...DEFAULT_SETTINGS.markerView.bounds },
      },
      worldBossOverlayWindow: {
        ...DEFAULT_SETTINGS.worldBossOverlayWindow,
        bounds: { ...DEFAULT_SETTINGS.worldBossOverlayWindow.bounds },
      },
    };
  }
}

function saveSettings() {
  if (!settings) {
    return;
  }

  fs.writeFileSync(getSettingsPath(), JSON.stringify(settings, null, 2), 'utf8');
}

function updateSettings(patch) {
  settings = {
    ...settings,
    ...patch,
    normalView: {
      ...settings.normalView,
      ...(patch.normalView || {}),
      bounds: sanitizeBounds(
        {
          ...settings.normalView.bounds,
          ...(patch.normalView?.bounds || {}),
        },
        DEFAULT_SETTINGS.normalView.bounds,
      ),
    },
    markerView: {
      ...settings.markerView,
      ...(patch.markerView || {}),
      frameVisible: patch.markerView?.frameVisible ?? settings.markerView.frameVisible,
      bounds: sanitizeBounds(
        {
          ...settings.markerView.bounds,
          ...(patch.markerView?.bounds || {}),
        },
        DEFAULT_SETTINGS.markerView.bounds,
      ),
    },
  };
  saveSettings();
  broadcastUiSettings();
}

function sendToWindow(window, channel, payload) {
  if (!window || window.isDestroyed()) {
    return;
  }

  const { webContents } = window;
  if (!webContents || webContents.isDestroyed()) {
    return;
  }

  webContents.send(channel, payload);
}

function broadcastRouteState() {
  sendToWindow(mainWindow, 'route-state', routeState);
  sendToWindow(plannerWindow, 'route-state', routeState);
}

function broadcastUiSettings() {
  sendToWindow(mainWindow, 'ui-settings-updated', settings);
  sendToWindow(plannerWindow, 'ui-settings-updated', settings);
  sendToWindow(altarWindow, 'ui-settings-updated', settings);
  sendToWindow(worldBossWindow, 'ui-settings-updated', settings);
}

function stopBackgroundProcesses() {
  if (playerProcess && !playerProcess.killed) {
    playerProcess.kill();
  }
  if (inventoryProcess && !inventoryProcess.killed) {
    inventoryProcess.kill();
  }
  if (altarProcess && !altarProcess.killed) {
    altarProcess.kill();
  }
}

function broadcastUpdaterState(state) {
  sendToWindow(mainWindow, 'updater-state', state);
  sendToWindow(plannerWindow, 'updater-state', state);
  sendToWindow(altarWindow, 'updater-state', state);
  sendToWindow(worldBossWindow, 'updater-state', state);
}

function broadcastAuthState(state = authState) {
  sendToWindow(mainWindow, 'auth-state', state);
  sendToWindow(plannerWindow, 'auth-state', state);
  sendToWindow(altarWindow, 'auth-state', state);
  sendToWindow(worldBossWindow, 'auth-state', state);
}

function syncRuntimeAccess() {
  if (!authState?.session?.loggedIn) {
    stopAuthRefreshInterval();
    stopBackgroundProcesses();
    resetRouteState();
    sendToWindow(mainWindow, 'route-abort');
    broadcastRouteState();
    if (plannerWindow && !plannerWindow.isDestroyed()) {
      plannerWindow.close();
    }
    if (altarWindow && !altarWindow.isDestroyed()) {
      altarWindow.close();
    }
    if (worldBossWindow && !worldBossWindow.isDestroyed()) {
      worldBossWindow.close();
    }
    return;
  }

  startAuthRefreshInterval();

  if (!isAuthenticatedAndAllowed()) {
    stopBackgroundProcesses();
    resetRouteState();
    sendToWindow(mainWindow, 'route-abort');
    broadcastRouteState();
    if (plannerWindow && !plannerWindow.isDestroyed()) {
      plannerWindow.close();
    }
    if (altarWindow && !altarWindow.isDestroyed()) {
      altarWindow.close();
    }
    if (worldBossWindow && !worldBossWindow.isDestroyed()) {
      worldBossWindow.close();
    }
    return;
  }

  if (!hasFeatureAccess('routePlanner')) {
    resetRouteState();
    sendToWindow(mainWindow, 'route-abort');
    broadcastRouteState();
    if (plannerWindow && !plannerWindow.isDestroyed()) {
      plannerWindow.close();
    }
  }

  if (!hasFeatureAccess('altars')) {
    if (settings?.altarTrackingEnabled) {
      updateSettings({ altarTrackingEnabled: false });
    }
    stopAltarStream();
    if (altarWindow && !altarWindow.isDestroyed()) {
      altarWindow.close();
    }
  }

  if (!hasFeatureAccess('worldBossTimer') && worldBossWindow && !worldBossWindow.isDestroyed()) {
    worldBossWindow.close();
  }

  if (mainWindow && !mainWindow.isDestroyed()) {
    if (!playerProcess) {
      startPlayerStream(mainWindow);
    }
    if (!inventoryProcess) {
      startInventoryStream(mainWindow);
    }
    if (hasFeatureAccess('altars') && settings?.altarTrackingEnabled && !altarProcess) {
      startAltarStream(mainWindow);
    }
  }
}

function loadOreData() {
  const result = {};
  const markerDirectory = path.join(__dirname, 'marker');
  const markerFiles = fs.readdirSync(markerDirectory, { recursive: true });

  for (const relativePath of markerFiles) {
    if (typeof relativePath !== 'string' || !relativePath.endsWith('.json')) {
      continue;
    }

    const filePath = path.join(markerDirectory, relativePath);
    const markerName = path.basename(relativePath, '.json');
    const normalizedPath = relativePath.replace(/\\/g, '/');
    const [category = 'sonstiges'] = normalizedPath.split('/');
    const markerKey = normalizedPath.replace(/\.json$/i, '');
    const payload = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    result[markerKey] = {
      key: markerKey,
      name: markerName,
      category,
      coordinates: payload?.data?.coordinates ?? [],
    };
  }

  return result;
}

function getPythonCommand() {
  const venvPythonPath = process.platform === 'win32'
    ? path.join(__dirname, '..', '.venv', 'Scripts', 'python.exe')
    : path.join(__dirname, '..', '.venv', 'bin', 'python');

  if (fs.existsSync(venvPythonPath)) {
    return venvPythonPath;
  }

  return process.platform === 'win32' ? 'python' : 'python3';
}

function startPlayerStream(window) {
  if (!isAuthenticatedAndAllowed()) {
    return;
  }

  const scriptPath = path.join(__dirname, '..', 'scripts', 'playerposition.py');
  playerProcess = spawn(getPythonCommand(), [scriptPath, '--json'], {
    cwd: __dirname,
    env: {
      ...process.env,
      PLAYERPOSITION_LOCK_PATH: getPlayerLockPath(),
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let stdoutBuffer = '';
  playerProcess.stdout.on('data', (chunk) => {
    stdoutBuffer += chunk.toString();
    const lines = stdoutBuffer.split(/\r?\n/);
    stdoutBuffer = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.trim()) {
        continue;
      }

      try {
        const data = JSON.parse(line);
        lastPlayerPosition = data;
        sendToWindow(window, 'player-position', data);
        sendToWindow(plannerWindow, 'player-position', data);
      } catch (error) {
        sendToWindow(window, 'player-error', `Ungueltige JSON-Zeile: ${line}`);
        sendToWindow(plannerWindow, 'player-error', `Ungueltige JSON-Zeile: ${line}`);
      }
    }
  });

  playerProcess.stderr.on('data', (chunk) => {
    const message = chunk.toString().trim();
    if (message) {
      sendToWindow(window, 'player-error', message);
      sendToWindow(plannerWindow, 'player-error', message);
    }
  });

  playerProcess.on('exit', (code) => {
    sendToWindow(window, 'player-error', `Player-Stream beendet mit Code ${code ?? 'null'}`);
    sendToWindow(plannerWindow, 'player-error', `Player-Stream beendet mit Code ${code ?? 'null'}`);
    playerProcess = null;
  });
}

function startInventoryStream(window) {
  if (!isAuthenticatedAndAllowed()) {
    return;
  }

  const scriptPath = path.join(__dirname, '..', 'scripts', 'inventar.py');
  inventoryProcess = spawn(getPythonCommand(), [scriptPath, '--json'], {
    cwd: __dirname,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let stdoutBuffer = '';
  inventoryProcess.stdout.on('data', (chunk) => {
    stdoutBuffer += chunk.toString();
    const lines = stdoutBuffer.split(/\r?\n/);
    stdoutBuffer = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.trim()) {
        continue;
      }

      try {
        const data = JSON.parse(line);
        sendToWindow(window, 'inventory-update', data);
      } catch (_error) {
        sendToWindow(window, 'inventory-error', `Ungueltige Inventar-JSON-Zeile: ${line}`);
      }
    }
  });

  inventoryProcess.stderr.on('data', (chunk) => {
    const message = chunk.toString().trim();
    if (message) {
      sendToWindow(window, 'inventory-error', message);
    }
  });

  inventoryProcess.on('exit', (code) => {
    sendToWindow(window, 'inventory-error', `Inventar-Stream beendet mit Code ${code ?? 'null'}`);
    inventoryProcess = null;
  });
}

function startAltarStream(window) {
  if (!isAuthenticatedAndAllowed() || !hasFeatureAccess('altars')) {
    return true;
  }

  if (altarProcess && !altarProcess.killed) {
    return true;
  }

  const scriptPath = path.join(__dirname, '..', 'scripts', 'altarposition.py');
  altarProcess = spawn(getPythonCommand(), [scriptPath, '--json'], {
    cwd: __dirname,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let stdoutBuffer = '';
  altarProcess.stdout.on('data', (chunk) => {
    stdoutBuffer += chunk.toString();
    const lines = stdoutBuffer.split(/\r?\n/);
    stdoutBuffer = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.trim()) {
        continue;
      }

      try {
        const data = JSON.parse(line);
        sendToWindow(mainWindow, 'altar-position', data);
        sendToWindow(altarWindow, 'altar-position', data);
      } catch (_error) {
        sendToWindow(mainWindow, 'altar-error', `Ungueltige Altar-JSON-Zeile: ${line}`);
        sendToWindow(altarWindow, 'altar-error', `Ungueltige Altar-JSON-Zeile: ${line}`);
      }
    }
  });

  altarProcess.stderr.on('data', (chunk) => {
    const message = chunk.toString().trim();
    if (message) {
      sendToWindow(mainWindow, 'altar-error', message);
      sendToWindow(altarWindow, 'altar-error', message);
    }
  });

  altarProcess.on('exit', (code) => {
    sendToWindow(mainWindow, 'altar-error', `Altar-Stream beendet mit Code ${code ?? 'null'}`);
    sendToWindow(altarWindow, 'altar-error', `Altar-Stream beendet mit Code ${code ?? 'null'}`);
    altarProcess = null;
  });

  return true;
}

function stopAltarStream() {
  if (altarProcess && !altarProcess.killed) {
    altarProcess.kill();
  }
}

function setAltarTrackingEnabled(active) {
  if (!hasFeatureAccess('altars')) {
    return settings;
  }

  const nextActive = Boolean(active);
  updateSettings({ altarTrackingEnabled: nextActive });

  if (nextActive) {
    startAltarStream(mainWindow);
  } else {
    stopAltarStream();
  }

  return settings;
}

function createWindow() {
  const activeView = settings?.markerOnlyMode ? settings.markerView : settings.normalView;
  const initialBounds = activeView.bounds;
  const windowOptions = {
    width: initialBounds.width,
    height: initialBounds.height,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: true,
    hasShadow: false,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  };

  if (Number.isFinite(initialBounds.x)) {
    windowOptions.x = initialBounds.x;
  }
  if (Number.isFinite(initialBounds.y)) {
    windowOptions.y = initialBounds.y;
  }

  const win = new BrowserWindow(windowOptions);
  mainWindow = win;
  win.setOpacity((activeView.windowOpacity ?? 100) / 100);

  const persistWindowBounds = () => {
    if (!settings) {
      return;
    }

    const bounds = win.getBounds();
    const viewKey = settings.markerOnlyMode ? 'markerView' : 'normalView';
    updateSettings({
      [viewKey]: {
        bounds: {
          x: bounds.x,
          y: bounds.y,
          width: bounds.width,
          height: bounds.height,
        },
      },
    });
  };

  const keepOnTop = () => {
    win.setAlwaysOnTop(true, 'screen-saver');
    win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  };

  win.once('ready-to-show', keepOnTop);
  win.on('show', keepOnTop);
  win.on('focus', keepOnTop);
  win.on('move', persistWindowBounds);
  win.on('resize', persistWindowBounds);
  win.on('close', persistWindowBounds);

  win.loadFile('index.html');
  win.webContents.once('did-finish-load', () => {
    if (updater) {
      sendToWindow(win, 'updater-state', updater.getState());
    }
    sendToWindow(win, 'auth-state', authState);
  });
  syncRuntimeAccess();

  win.on('closed', () => {
    if (mainWindow === win) {
      mainWindow = null;
    }
    if (plannerWindow && !plannerWindow.isDestroyed()) {
      plannerWindow.close();
    }
    if (altarWindow && !altarWindow.isDestroyed()) {
      altarWindow.close();
    }
    if (worldBossWindow && !worldBossWindow.isDestroyed()) {
      worldBossWindow.close();
    }
    if (tutorialWindow && !tutorialWindow.isDestroyed()) {
      tutorialWindow.close();
    }
  });
}

function createPlannerWindow() {
  if (plannerWindow && !plannerWindow.isDestroyed()) {
    plannerWindow.focus();
    return plannerWindow;
  }

  const bounds = mainWindow && !mainWindow.isDestroyed() ? mainWindow.getBounds() : DEFAULT_WINDOW_BOUNDS;
  plannerWindow = new BrowserWindow({
    width: 980,
    height: 820,
    x: Math.round(bounds.x + Math.max(40, (bounds.width - 980) / 2)),
    y: Math.round(bounds.y + Math.max(32, (bounds.height - 820) / 2)),
    minWidth: 760,
    minHeight: 620,
    frame: false,
    transparent: true,
    resizable: true,
    hasShadow: true,
    backgroundColor: '#00000000',
    alwaysOnTop: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  plannerWindow.loadFile('route-planner.html');
  const keepPlannerOnTop = () => {
    if (!plannerWindow || plannerWindow.isDestroyed()) {
      return;
    }
    plannerWindow.setAlwaysOnTop(true, 'screen-saver');
    plannerWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  };
  plannerWindow.once('ready-to-show', () => {
    if (plannerWindow && !plannerWindow.isDestroyed()) {
      keepPlannerOnTop();
      plannerWindow.show();
      plannerWindow.focus();
      if (lastPlayerPosition) {
        sendToWindow(plannerWindow, 'player-position', lastPlayerPosition);
      }
      if (updater) {
        sendToWindow(plannerWindow, 'updater-state', updater.getState());
      }
      sendToWindow(plannerWindow, 'auth-state', authState);
    }
  });
  plannerWindow.on('show', keepPlannerOnTop);
  plannerWindow.on('focus', keepPlannerOnTop);
  plannerWindow.on('blur', keepPlannerOnTop);

  plannerWindow.on('closed', () => {
    plannerWindow = null;
  });

  return plannerWindow;
}

function createAltarWindow() {
  if (altarWindow && !altarWindow.isDestroyed()) {
    altarWindow.focus();
    return altarWindow;
  }

  const bounds = mainWindow && !mainWindow.isDestroyed() ? mainWindow.getBounds() : DEFAULT_WINDOW_BOUNDS;
  altarWindow = new BrowserWindow({
    width: 980,
    height: 760,
    x: Math.round(bounds.x + Math.max(48, (bounds.width - 980) / 2)),
    y: Math.round(bounds.y + Math.max(48, (bounds.height - 760) / 2)),
    minWidth: 760,
    minHeight: 520,
    frame: false,
    transparent: true,
    resizable: true,
    hasShadow: true,
    backgroundColor: '#00000000',
    alwaysOnTop: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  altarWindow.loadFile('altar-selector.html');
  const keepAltarOnTop = () => {
    if (!altarWindow || altarWindow.isDestroyed()) {
      return;
    }
    altarWindow.setAlwaysOnTop(true, 'screen-saver');
    altarWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  };

  altarWindow.once('ready-to-show', () => {
    if (altarWindow && !altarWindow.isDestroyed()) {
      keepAltarOnTop();
      altarWindow.show();
      sendToWindow(altarWindow, 'auth-state', authState);
      sendToWindow(altarWindow, 'ui-settings-updated', settings);
      if (updater) {
        sendToWindow(altarWindow, 'updater-state', updater.getState());
      }
    }
  });
  altarWindow.on('show', keepAltarOnTop);
  altarWindow.on('focus', keepAltarOnTop);
  altarWindow.on('closed', () => {
    altarWindow = null;
    setAltarTrackingEnabled(false);
  });

  return altarWindow;
}

function createWorldBossWindow() {
  if (worldBossWindow && !worldBossWindow.isDestroyed()) {
    worldBossWindow.focus();
    return worldBossWindow;
  }

  const mainBounds = mainWindow && !mainWindow.isDestroyed() ? mainWindow.getBounds() : DEFAULT_WINDOW_BOUNDS;
  const display = screen.getDisplayNearestPoint({
    x: mainBounds.x + Math.round(mainBounds.width / 2),
    y: mainBounds.y + Math.round(mainBounds.height / 2),
  });
  const workArea = display?.workArea || display?.bounds || screen.getPrimaryDisplay().workArea;
  const fallbackBounds = {
    x: workArea.x + 12,
    y: workArea.y + Math.max(24, Math.round((workArea.height - DEFAULT_SETTINGS.worldBossOverlayWindow.bounds.height) / 2)),
    width: DEFAULT_SETTINGS.worldBossOverlayWindow.bounds.width,
    height: DEFAULT_SETTINGS.worldBossOverlayWindow.bounds.height,
  };
  const configuredBounds = sanitizeBounds(settings?.worldBossOverlayWindow?.bounds, fallbackBounds, 92, 140);
  worldBossWindow = new BrowserWindow({
    width: configuredBounds.width,
    height: configuredBounds.height,
    x: configuredBounds.x,
    y: configuredBounds.y,
    minWidth: 92,
    minHeight: 140,
    frame: false,
    transparent: true,
    resizable: true,
    hasShadow: true,
    skipTaskbar: true,
    backgroundColor: '#00000000',
    alwaysOnTop: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  worldBossWindow.loadFile('worldboss-window.html');
  const keepWorldBossOnTop = () => {
    if (!worldBossWindow || worldBossWindow.isDestroyed()) {
      return;
    }
    worldBossWindow.setAlwaysOnTop(true, 'screen-saver');
    worldBossWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  };

  worldBossWindow.once('ready-to-show', () => {
    if (worldBossWindow && !worldBossWindow.isDestroyed()) {
      keepWorldBossOnTop();
      worldBossWindow.show();
      sendToWindow(worldBossWindow, 'auth-state', authState);
      sendToWindow(worldBossWindow, 'ui-settings-updated', settings);
      if (updater) {
        sendToWindow(worldBossWindow, 'updater-state', updater.getState());
      }
    }
  });
  worldBossWindow.on('show', keepWorldBossOnTop);
  worldBossWindow.on('focus', keepWorldBossOnTop);
  worldBossWindow.on('move', () => {
    if (!worldBossWindow || worldBossWindow.isDestroyed() || worldBossWindowTransientBounds) {
      return;
    }
    saveWorldBossOverlayWindowBounds(worldBossWindow.getBounds());
  });
  worldBossWindow.on('resize', () => {
    if (!worldBossWindow || worldBossWindow.isDestroyed() || worldBossWindowTransientBounds) {
      return;
    }
    saveWorldBossOverlayWindowBounds(worldBossWindow.getBounds());
  });
  worldBossWindow.on('closed', () => {
    worldBossWindow = null;
  });

  return worldBossWindow;
}

function createTutorialWindow() {
  if (tutorialWindow && !tutorialWindow.isDestroyed()) {
    return tutorialWindow;
  }

  const referenceBounds = mainWindow && !mainWindow.isDestroyed()
    ? mainWindow.getBounds()
    : { x: 0, y: 0, width: DEFAULT_WINDOW_BOUNDS.width, height: DEFAULT_WINDOW_BOUNDS.height };
  const display = screen.getDisplayNearestPoint({
    x: referenceBounds.x + Math.round(referenceBounds.width / 2),
    y: referenceBounds.y + Math.round(referenceBounds.height / 2),
  });
  const workArea = display?.workArea || display?.bounds || screen.getPrimaryDisplay().workArea;

  tutorialWindow = new BrowserWindow({
    x: workArea.x,
    y: workArea.y,
    width: workArea.width,
    height: workArea.height,
    frame: false,
    transparent: true,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    hasShadow: false,
    backgroundColor: '#00000000',
    alwaysOnTop: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  tutorialWindow.loadFile('tutorial.html');
  const keepTutorialOnTop = () => {
    if (!tutorialWindow || tutorialWindow.isDestroyed()) {
      return;
    }
    tutorialWindow.setAlwaysOnTop(true, 'screen-saver');
    tutorialWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  };

  tutorialWindow.once('ready-to-show', () => {
    if (tutorialWindow && !tutorialWindow.isDestroyed()) {
      keepTutorialOnTop();
      if (tutorialStepPayload) {
        sendToWindow(tutorialWindow, 'tutorial-step', tutorialStepPayload);
        tutorialWindow.show();
        tutorialWindow.focus();
      }
    }
  });
  tutorialWindow.on('show', keepTutorialOnTop);
  tutorialWindow.on('focus', keepTutorialOnTop);
  tutorialWindow.on('blur', keepTutorialOnTop);
  tutorialWindow.on('closed', () => {
    tutorialWindow = null;
  });

  return tutorialWindow;
}

app.whenReady().then(() => {
  loadSettings();
  authManager = createAuthManager({
    app,
    appDir: __dirname,
    onStateChange: (nextState) => {
      authState = nextState;
      broadcastAuthState(nextState);
      syncRuntimeAccess();
    },
  });
  updater = createUpdater({
    app,
    getSettings: () => settings,
    updateSettings,
    onStateChange: broadcastUpdaterState,
  });
  authState = authManager.getState();
  ipcMain.handle('get-ore-data', () => loadOreData());
  ipcMain.handle('ui-settings-get', () => settings);
  ipcMain.handle('ui-settings-set', (_event, patch) => {
    updateSettings(patch || {});
    return settings;
  });
  ipcMain.handle('player-lock-get', () => readPlayerLock());
  ipcMain.handle('player-lock-set', (_event, payload) => {
    return writePlayerLock(payload || {});
  });
  ipcMain.handle('altar-tracking-set', (_event, active) => setAltarTrackingEnabled(active));
  ipcMain.handle('auth-state-get', () => authState);
  ipcMain.handle('auth-login-discord', async (_event, options) => {
    await authManager.signInWithDiscord(options || {});
    return authState;
  });
  ipcMain.handle('auth-logout', async () => {
    await authManager.signOut();
    return authState;
  });
  ipcMain.handle('auth-refresh-access', async () => {
    await authManager.refreshAccess();
    return authState;
  });
  ipcMain.handle('auth-set-auto-login', async (_event, enabled) => authManager.setAutoLogin(enabled));
  ipcMain.handle('admin-profiles-list', async () => authManager.listProfiles());
  ipcMain.handle('admin-profile-update', async (_event, payload) => authManager.updateProfileAccess(payload || {}));
  ipcMain.handle('window-minimize', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.minimize();
    }
  });
  ipcMain.handle('window-close', () => {
    const focusedWindow = BrowserWindow.getFocusedWindow();
    if (focusedWindow && !focusedWindow.isDestroyed()) {
      focusedWindow.close();
    } else if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.close();
    }
  });
  ipcMain.handle('window-close-skip-update', () => {
    app.skipPendingUpdateOnQuit = true;
    const focusedWindow = BrowserWindow.getFocusedWindow();
    if (focusedWindow && !focusedWindow.isDestroyed()) {
      focusedWindow.close();
    } else if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.close();
    }
  });
  ipcMain.handle('window-get-opacity', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      return Math.round(mainWindow.getOpacity() * 100);
    }

    return 100;
  });
  ipcMain.handle('window-set-opacity', (_event, value) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      const opacity = Math.min(1, Math.max(0.2, Number(value) / 100));
      mainWindow.setOpacity(opacity);
      const roundedOpacity = Math.round(opacity * 100);
      const viewKey = settings?.markerOnlyMode ? 'markerView' : 'normalView';
      updateSettings({
        [viewKey]: {
          windowOpacity: roundedOpacity,
        },
      });
      return roundedOpacity;
    }

    return 100;
  });
  ipcMain.handle('window-get-bounds', (_event) => {
    const senderWindow = BrowserWindow.fromWebContents(_event.sender);
    if (senderWindow && !senderWindow.isDestroyed()) {
      return senderWindow.getBounds();
    }

    const focusedWindow = BrowserWindow.getFocusedWindow();
    if (focusedWindow && !focusedWindow.isDestroyed()) {
      return focusedWindow.getBounds();
    }

    if (mainWindow && !mainWindow.isDestroyed()) {
      return mainWindow.getBounds();
    }

    return { x: 0, y: 0, ...DEFAULT_WINDOW_BOUNDS };
  });
  ipcMain.handle('window-set-bounds', (_event, bounds) => {
    const targetWindow = BrowserWindow.fromWebContents(_event.sender) || mainWindow;
    if (targetWindow && !targetWindow.isDestroyed() && bounds) {
      const currentBounds = targetWindow.getBounds();
      const nextX = Number(bounds.x);
      const nextY = Number(bounds.y);
      const minWidth = targetWindow === worldBossWindow ? 92 : 260;
      const minHeight = targetWindow === worldBossWindow ? 140 : 220;
      const nextBounds = {
        x: Number.isFinite(nextX) ? Math.round(nextX) : currentBounds.x,
        y: Number.isFinite(nextY) ? Math.round(nextY) : currentBounds.y,
        width: Math.max(minWidth, Math.round(bounds.width)),
        height: Math.max(minHeight, Math.round(bounds.height)),
      };
      const shouldPersist = bounds.persist !== false;
      if (targetWindow === worldBossWindow && !shouldPersist) {
        worldBossWindowTransientBounds = true;
      }
      targetWindow.setBounds(nextBounds);
      const appliedBounds = targetWindow.getBounds();
      if (targetWindow === worldBossWindow) {
        if (shouldPersist) {
          saveWorldBossOverlayWindowBounds(appliedBounds);
        }
        worldBossWindowTransientBounds = false;
      } else if (shouldPersist) {
        const viewKey = bounds.viewKey || (settings?.markerOnlyMode ? 'markerView' : 'normalView');
        updateSettings({
          [viewKey]: {
            bounds: {
              x: appliedBounds.x,
              y: appliedBounds.y,
              width: appliedBounds.width,
              height: appliedBounds.height,
            },
          },
        });
      }
      return appliedBounds;
    }

    return { x: 0, y: 0, ...DEFAULT_WINDOW_BOUNDS };
  });
  ipcMain.handle('route-planner-open', () => {
    if (!hasFeatureAccess('routePlanner')) {
      return { ok: false, error: 'access_denied' };
    }
    createPlannerWindow();
    broadcastRouteState();
    return { ok: true };
  });
  ipcMain.handle('route-planner-close', () => {
    if (plannerWindow && !plannerWindow.isDestroyed()) {
      plannerWindow.close();
    }
    return true;
  });
  ipcMain.handle('altar-selector-open', () => {
    if (!hasFeatureAccess('altars')) {
      return { ok: false, error: 'access_denied' };
    }
    createAltarWindow();
    return { ok: true };
  });
  ipcMain.handle('altar-selector-close', () => {
    if (altarWindow && !altarWindow.isDestroyed()) {
      altarWindow.close();
    }
    return true;
  });
  ipcMain.handle('worldboss-window-open', () => {
    createWorldBossWindow();
    return { ok: true };
  });
  ipcMain.handle('worldboss-window-close', () => {
    if (worldBossWindow && !worldBossWindow.isDestroyed()) {
      worldBossWindow.close();
    }
    return true;
  });
  ipcMain.handle('altar-focus-request', (_event, payload) => {
    sendToWindow(mainWindow, 'altar-focus-request', payload || null);
    return true;
  });
  ipcMain.handle('route-state-get', () => routeState);
  ipcMain.handle('route-preview-set', (_event, route) => {
    if (!hasFeatureAccess('routePlanner')) {
      return false;
    }
    routeState = {
      ...routeState,
      previewRoute: route || null,
    };
    sendToWindow(mainWindow, 'route-preview', route || null);
    broadcastRouteState();
    return true;
  });
  ipcMain.handle('route-start-set', (_event, route) => {
    if (!hasFeatureAccess('routePlanner')) {
      return false;
    }
    routeState = {
      activeRoute: route || null,
      previewRoute: route || null,
      paused: false,
    };
    sendToWindow(mainWindow, 'route-start', route || null);
    broadcastRouteState();
    return true;
  });
  ipcMain.handle('route-abort', () => {
    if (!hasFeatureAccess('routePlanner')) {
      resetRouteState();
      return true;
    }
    routeState = {
      activeRoute: null,
      previewRoute: null,
      paused: false,
    };
    sendToWindow(mainWindow, 'route-abort');
    broadcastRouteState();
    return true;
  });
  ipcMain.handle('route-pause-toggle', () => {
    if (!hasFeatureAccess('routePlanner')) {
      return false;
    }
    routeState = {
      ...routeState,
      paused: !routeState.paused,
    };
    sendToWindow(mainWindow, 'route-state', routeState);
    broadcastRouteState();
    return true;
  });
  ipcMain.handle('tutorial-open', () => {
    createTutorialWindow();
    return true;
  });
  ipcMain.handle('tutorial-close', () => {
    if (tutorialWindow && !tutorialWindow.isDestroyed()) {
      tutorialWindow.close();
    }
    return true;
  });
  ipcMain.handle('tutorial-step-update', (_event, payload) => {
    tutorialStepPayload = payload || null;
    createTutorialWindow();
    if (tutorialWindow && !tutorialWindow.isDestroyed()) {
      const workArea = payload?.workArea
        || (mainWindow && !mainWindow.isDestroyed()
          ? (() => {
              const bounds = mainWindow.getBounds();
              const display = screen.getDisplayNearestPoint({
                x: bounds.x + Math.round(bounds.width / 2),
                y: bounds.y + Math.round(bounds.height / 2),
              });
              return display?.workArea || display?.bounds || screen.getPrimaryDisplay().workArea;
            })()
          : screen.getPrimaryDisplay().workArea);
      tutorialWindow.setBounds({
        x: workArea.x,
        y: workArea.y,
        width: workArea.width,
        height: workArea.height,
      });
    }
    sendToWindow(tutorialWindow, 'tutorial-step', tutorialStepPayload);
    if (tutorialWindow && !tutorialWindow.isDestroyed() && !tutorialWindow.webContents.isLoading()) {
      tutorialWindow.show();
      tutorialWindow.focus();
    }
    return true;
  });
  ipcMain.handle('tutorial-action', (_event, action) => {
    sendToWindow(mainWindow, 'tutorial-action', action);
    return true;
  });
  ipcMain.handle('display-workarea-get', (_event) => {
    const senderWindow = BrowserWindow.fromWebContents(_event.sender);
    const referenceBounds = senderWindow && !senderWindow.isDestroyed()
      ? senderWindow.getBounds()
      : (mainWindow && !mainWindow.isDestroyed() ? mainWindow.getBounds() : { x: 0, y: 0, ...DEFAULT_WINDOW_BOUNDS });
    const display = screen.getDisplayNearestPoint({
      x: referenceBounds.x + Math.round(referenceBounds.width / 2),
      y: referenceBounds.y + Math.round(referenceBounds.height / 2),
    });
    return display?.workArea || display?.bounds || screen.getPrimaryDisplay().workArea;
  });
  ipcMain.handle('updater-state-get', () => updater.getState());
  ipcMain.handle('updater-install-now', async () => {
    const started = await updater.applyPendingUpdateAndQuit();
    if (started) {
      app.isQuittingForUpdate = true;
      stopBackgroundProcesses();
      app.quit();
      setTimeout(() => {
        app.exit(0);
      }, 250);
    }
    return started;
  });
  authManager.initialize().finally(() => {
    createWindow();
    updater.checkForUpdates();
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  stopAuthRefreshInterval();
  stopBackgroundProcesses();

  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', async (event) => {
  stopAuthRefreshInterval();
  if (!updater) {
    return;
  }

  if (app.skipPendingUpdateOnQuit) {
    return;
  }

  const pendingUpdate = updater.getState()?.pendingUpdate;
  if (!pendingUpdate || app.isQuittingForUpdate) {
    return;
  }

  event.preventDefault();
  app.isQuittingForUpdate = true;
  const started = await updater.applyPendingUpdateAndQuit();
  if (started) {
    stopBackgroundProcesses();
    app.quit();
    setTimeout(() => {
      app.exit(0);
    }, 250);
  } else {
    app.isQuittingForUpdate = false;
  }
});
