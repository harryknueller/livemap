const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const { createUpdater } = require('./updater');

let playerProcess;
let inventoryProcess;
let mainWindow = null;
let plannerWindow = null;
let settings;
let updater;
let lastPlayerPosition = null;
let routeState = {
  activeRoute: null,
  previewRoute: null,
  paused: false,
};

const DEFAULT_WINDOW_BOUNDS = {
  width: 1100,
  height: 820,
};

const DEFAULT_SETTINGS = {
  markerOnlyMode: false,
  markerCooldownsByChannel: {},
  updater: {
    currentCommit: null,
    latestCommit: null,
    lastCheckedAt: null,
    pendingUpdate: null,
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

function sanitizeBounds(bounds, fallback) {
  const safeFallback = fallback || DEFAULT_WINDOW_BOUNDS;
  const x = Number(bounds?.x);
  const y = Number(bounds?.y);
  const width = Number(bounds?.width);
  const height = Number(bounds?.height);

  return {
    x: Number.isFinite(x) ? Math.round(x) : safeFallback.x,
    y: Number.isFinite(y) ? Math.round(y) : safeFallback.y,
    width: Number.isFinite(width) && width >= 260 ? Math.round(width) : safeFallback.width,
    height: Number.isFinite(height) && height >= 220 ? Math.round(height) : safeFallback.height,
  };
}

function getSettingsPath() {
  return path.join(app.getPath('userData'), 'livemap-settings.json');
}

function loadSettings() {
  try {
    const payload = JSON.parse(fs.readFileSync(getSettingsPath(), 'utf8'));
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
        markerOnlyMode: Boolean(payload.markerOnlyMode),
        markerCooldownsByChannel: payload.markerCooldownsByChannel || {},
        updater: {
          ...DEFAULT_SETTINGS.updater,
          ...(payload.updater || {}),
        },
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
    };
  } catch (_error) {
      settings = {
        ...DEFAULT_SETTINGS,
        markerCooldownsByChannel: {},
        updater: {
          ...DEFAULT_SETTINGS.updater,
        },
        normalView: {
          ...DEFAULT_SETTINGS.normalView,
          bounds: { ...DEFAULT_SETTINGS.normalView.bounds },
      },
      markerView: {
        ...DEFAULT_SETTINGS.markerView,
        bounds: { ...DEFAULT_SETTINGS.markerView.bounds },
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
    updater: {
      ...settings.updater,
      ...(patch.updater || {}),
    },
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

function stopBackgroundProcesses() {
  if (playerProcess && !playerProcess.killed) {
    playerProcess.kill();
  }
  if (inventoryProcess && !inventoryProcess.killed) {
    inventoryProcess.kill();
  }
}

function broadcastUpdaterState(state) {
  sendToWindow(mainWindow, 'updater-state', state);
  sendToWindow(plannerWindow, 'updater-state', state);
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
  return process.platform === 'win32' ? 'python' : 'python3';
}

function startPlayerStream(window) {
  const scriptPath = path.join(__dirname, 'playerposition.py');
  playerProcess = spawn(getPythonCommand(), [scriptPath, '--json'], {
    cwd: __dirname,
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
  const scriptPath = path.join(__dirname, 'inventar.py');
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
  startPlayerStream(win);
  startInventoryStream(win);
  if (updater) {
    sendToWindow(win, 'updater-state', updater.getState());
  }

  win.on('closed', () => {
    if (mainWindow === win) {
      mainWindow = null;
    }
    if (plannerWindow && !plannerWindow.isDestroyed()) {
      plannerWindow.close();
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

app.whenReady().then(() => {
  loadSettings();
  updater = createUpdater({
    app,
    getSettings: () => settings,
    updateSettings,
    onStateChange: broadcastUpdaterState,
  });
  ipcMain.handle('get-ore-data', () => loadOreData());
  ipcMain.handle('ui-settings-get', () => settings);
  ipcMain.handle('ui-settings-set', (_event, patch) => {
    updateSettings(patch || {});
    return settings;
  });
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
  ipcMain.handle('window-get-bounds', () => {
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
      const nextBounds = {
        x: Number.isFinite(nextX) ? Math.round(nextX) : currentBounds.x,
        y: Number.isFinite(nextY) ? Math.round(nextY) : currentBounds.y,
        width: Math.max(260, Math.round(bounds.width)),
        height: Math.max(220, Math.round(bounds.height)),
      };
      targetWindow.setBounds(nextBounds);
      const appliedBounds = targetWindow.getBounds();
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
      return appliedBounds;
    }

    return { x: 0, y: 0, ...DEFAULT_WINDOW_BOUNDS };
  });
  ipcMain.handle('route-planner-open', () => {
    createPlannerWindow();
    broadcastRouteState();
    return true;
  });
  ipcMain.handle('route-planner-close', () => {
    if (plannerWindow && !plannerWindow.isDestroyed()) {
      plannerWindow.close();
    }
    return true;
  });
  ipcMain.handle('route-state-get', () => routeState);
  ipcMain.handle('route-preview-set', (_event, route) => {
    routeState = {
      ...routeState,
      previewRoute: route || null,
    };
    sendToWindow(mainWindow, 'route-preview', route || null);
    broadcastRouteState();
    return true;
  });
  ipcMain.handle('route-start-set', (_event, route) => {
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
    routeState = {
      ...routeState,
      paused: !routeState.paused,
    };
    sendToWindow(mainWindow, 'route-state', routeState);
    broadcastRouteState();
    return true;
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
  createWindow();
  updater.checkForUpdates();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  stopBackgroundProcesses();

  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', async (event) => {
  if (!updater) {
    return;
  }

  const pendingUpdate = settings?.updater?.pendingUpdate;
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
