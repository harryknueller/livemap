const ORE_COLORS = {
  adamantit: '#6c7a89',
  eisen: '#c06339',
  gold: '#e2bf4f',
  kobalt: '#4d79c7',
  kohle: '#4b4b4b',
  kupfer: '#b87333',
  mithril: '#79d4e5',
  obsidian: '#6d55a3',
  schwefel: '#d8d04e',
  silber: '#cfd6db',
};

const CATEGORY_LABELS = {
  erze: 'Erze',
  pflanzen: 'Pflanzen',
  standart: 'Standart',
};

const CATEGORY_ICONS = {
  erze: 'map/icons/cat_bergbau.png',
  pflanzen: 'map/icons/cat_ernten.png',
  standart: 'map/icons/cat_standart.png',
};

const MARKER_ICON_OVERRIDES = {
  flammenmargarete: 'flammenmargarite.png',
  mystische_lilie: 'mystische Lilie.png',
  weltbosse: 'weltboss.png',
};

const CATEGORY_ORDER = {
  standart: 0,
  erze: 1,
  pflanzen: 2,
};

const legend = document.getElementById('legend');
const legendOverlayRoot = document.getElementById('legendOverlayRoot');
const channelStatusElement = document.getElementById('channelStatus');
const markerStatusElement = document.getElementById('markerStatus');
const liveStatusElement = document.getElementById('liveStatus');
const compactLiveStatusElement = document.getElementById('compactLiveStatus');
const coordXElement = document.getElementById('coordX');
const coordZElement = document.getElementById('coordZ');
const coordYElement = document.getElementById('coordY');
const inventoryPanel = document.getElementById('inventoryPanel');
const inventoryUsageTopElement = document.getElementById('inventoryUsageTop');
const inventoryUsageElement = document.getElementById('inventoryUsage');
const compactInventoryPanelElement = document.getElementById('compactInventoryPanel');
const compactInventoryUsageTopElement = document.getElementById('compactInventoryUsageTop');
const markerOnlyFiltersElement = document.getElementById('markerOnlyFilters');
const markerOnlyCanvas = document.getElementById('markerOnlyCanvas');
const resizeHandles = document.getElementById('resizeHandles');
const mapFrameButton = document.getElementById('mapFrameButton');
const routePlannerButton = document.getElementById('routePlannerButton');
const findNearestButton = document.getElementById('findNearestButton');
const playerCenterButton = document.getElementById('playerCenterButton');
const opacityButton = document.getElementById('opacityButton');
const opacityPopover = document.getElementById('opacityPopover');
const opacitySlider = document.getElementById('opacitySlider');
const minimizeButton = document.getElementById('minimizeButton');
const closeButton = document.getElementById('closeButton');
const mapModeButton = document.getElementById('mapModeButton');
const compactMapModeButton = document.getElementById('compactMapModeButton');
const routePlannerOverlay = document.getElementById('routePlannerOverlay');
const routePlannerBackdrop = document.getElementById('routePlannerBackdrop');
const routePlannerCloseButton = document.getElementById('routePlannerCloseButton');
const routePlannerPanel = routePlannerOverlay?.querySelector('.planner-panel');
const routePlannerHeader = routePlannerOverlay?.querySelector('.planner-header');
const routeMarkerList = document.getElementById('routeMarkerList');
const routeUsePlayerStartInput = document.getElementById('routeUsePlayerStart');
const routeGenerateButton = document.getElementById('routeGenerateButton');
const routeAbortButton = document.getElementById('routeAbortButton');
const routeResultsList = document.getElementById('routeResultsList');
const confirmDialog = document.getElementById('confirmDialog');
const confirmDialogMessage = document.getElementById('confirmDialogMessage');
const confirmDialogCancel = document.getElementById('confirmDialogCancel');
const confirmDialogConfirm = document.getElementById('confirmDialogConfirm');
const updateToast = document.getElementById('updateToast');
const updateToastMessage = document.getElementById('updateToastMessage');
const updateToastInstallButton = document.getElementById('updateToastInstallButton');
const startupUpdater = document.getElementById('startupUpdater');
const startupUpdaterTitle = document.getElementById('startupUpdaterTitle');
const startupUpdaterMessage = document.getElementById('startupUpdaterMessage');
const startupUpdaterVersion = document.getElementById('startupUpdaterVersion');
const startupUpdaterCommit = document.getElementById('startupUpdaterCommit');
const startupUpdaterProgressLabel = document.getElementById('startupUpdaterProgressLabel');
const startupUpdaterStatusValue = document.getElementById('startupUpdaterStatusValue');
const startupUpdaterBarFill = document.getElementById('startupUpdaterBarFill');
const startupUpdaterActions = document.getElementById('startupUpdaterActions');
const startupUpdaterPatchButton = document.getElementById('startupUpdaterPatchButton');
const startupUpdaterExitButton = document.getElementById('startupUpdaterExitButton');

const TILE_COLUMNS = 5;
const TILE_ROWS = 4;
const IMAGE_WIDTH = 16287;
const IMAGE_HEIGHT = 9910;
const TILE_PIXEL_WIDTH = Math.ceil(IMAGE_WIDTH / TILE_COLUMNS);
const TILE_PIXEL_HEIGHT = Math.ceil(IMAGE_HEIGHT / TILE_ROWS);
const METERS_PER_PIXEL_X = 3.553;
const METERS_PER_PIXEL_Z = 3.54335;
const ORIGIN_PIXEL = {
  x: (IMAGE_WIDTH / 2) - 266 - 31,
  y: (IMAGE_HEIGHT / 2) + 116,
};
const MAP_CENTER_OFFSET = {
  x: 0,
  z: 0,
};

let map;
let oreData = {};
let playerPosition = null;
let activeOreFilters = new Set(Object.keys(ORE_COLORS));
let oreLayers = new Map();
let markerOnlyOreLayers = new Map();
let tileOverlays = [];
let playerMarker = null;
let playerDistanceBadge = null;
let didAutoCenterPlayer = false;
let lastFollowPosition = null;
let currentPlayerLatLng = null;
let targetPlayerLatLng = null;
let markerAnimationFrame = null;
let isMarkerOnlyMode = false;
let isMarkerFrameVisible = false;
let resizeSession = null;
let uiSettings = null;
let filteredPlayerPosition = null;
let markerOnlyCanvasFrame = null;
let markerOnlyDisplayPosition = null;
let markerOnlyAnimationFrame = null;
let markerOnlyTargetPosition = null;
let openLegendCategory = null;
let closeLegendMenuTimer = null;
let categoryFilterMemory = {};
let lastValidInventoryUsage = null;
const markerIconImageCache = new Map();
const markerOnlySpriteCache = new Map();
const layerVisibilityTimers = new Map();
let markerSpatialIndex = new Map();
let markerEntriesById = new Map();
let markerLeafletMarkers = new Map();
let markerDwellStarts = new Map();
let markerCooldowns = new Map();
let markerCooldownTimer = null;
let currentChannelPort = null;
let nearestMarkerLine = null;
let nearestMarkerEnabled = false;
let routePlannerConfig = null;
let routePlannerResults = [];
let routePreview = null;
let activeRoute = null;
let routePreviewLine = null;
let routeGuideLine = null;
let routeFilterOverrideBackup = null;
let routePlannerDragState = null;
let routePlannerWindowBoundsBackup = null;
let routePreviewPlaybackToken = 0;
let confirmDialogResolver = null;
let updaterState = null;
let startupUpdaterResolved = false;
let startupUpdaterStartedAt = 0;
const CHANNEL_BY_PORT = {
  6061: { label: '🛡️ CH 1', state: 'normal' },
  6062: { label: '🛡️ CH 2', state: 'normal' },
  6063: { label: '🛡️ CH 3', state: 'normal' },
  6064: { label: '⚔️ CH 4', state: 'war' },
};
const PLAYER_MOVE_EPSILON = 1;
const MAP_FOLLOW_EPSILON = 1.0;
const PLAYER_RENDER_LERP = 0.3;
const PLAYER_RENDER_SNAP = 0.12;
const MARKER_ONLY_CULL_MARGIN = 16;
const MARKER_ONLY_QUERY_MARGIN = 32;
const MARKER_LAYER_FADE_MS = 160;
const MARKER_ONLY_ZOOM = 2.6;
const MARKER_ONLY_SCALE = 2 ** MARKER_ONLY_ZOOM;
const MARKER_ONLY_RENDER_LERP = 0.2;
const MARKER_ONLY_RENDER_LERP_FAST = 0.38;
const MARKER_ONLY_RENDER_SNAP = 0.12;
const MARKER_ONLY_RENDER_SNAP_FAST = 0.45;
const MARKER_ONLY_FAST_DISTANCE = 3.2;
const MARKER_ONLY_ICON_SIZE = 28;
const MARKER_DEACTIVATION_DISTANCE = 3;
const MARKER_DEACTIVATION_DWELL_MS = 3000;
const MARKER_DEACTIVATION_COOLDOWN_MS = 10 * 60 * 1000;
const MARKER_SPATIAL_CELL_SIZE = 8;
const MODE_TRANSITION_MS = 180;
const ROUTE_VARIANT_COUNT = 5;
const ROUTE_COMPLETE_DISTANCE = 3;
const ROUTE_PLANNER_WINDOW_BOUNDS = {
  normal: { width: 1180, height: 820 },
  markerOnly: { width: 1220, height: 860 },
};

function getMarkerEntries() {
  return Object.values(oreData);
}

function getRoutePlannerMarkers() {
  return getMarkerEntries().filter((marker) => marker.category !== 'standart');
}

function getMarkerCoordinateId(markerKey, index) {
  return `${markerKey}:${index}`;
}

function getSpatialCellKey(x, y) {
  return `${Math.floor(x / MARKER_SPATIAL_CELL_SIZE)}:${Math.floor(y / MARKER_SPATIAL_CELL_SIZE)}`;
}

function addMarkerEntryToSpatialIndex(entry) {
  const cellKey = getSpatialCellKey(entry.x, entry.y);
  if (!markerSpatialIndex.has(cellKey)) {
    markerSpatialIndex.set(cellKey, []);
  }
  markerSpatialIndex.get(cellKey).push(entry);
}

function queryNearbyMarkerEntries(x, y) {
  const baseCellX = Math.floor(x / MARKER_SPATIAL_CELL_SIZE);
  const baseCellY = Math.floor(y / MARKER_SPATIAL_CELL_SIZE);
  const entries = [];

  for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
    for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
      const bucket = markerSpatialIndex.get(`${baseCellX + offsetX}:${baseCellY + offsetY}`);
      if (bucket?.length) {
        entries.push(...bucket);
      }
    }
  }

  return entries;
}

function queryVisibleMarkerEntriesForMarkerOnly(centerPosition, width, height) {
  if (!Number.isFinite(centerPosition?.x) || !Number.isFinite(centerPosition?.y)) {
    return [];
  }

  const halfWorldWidth = ((width / 2) + MARKER_ONLY_QUERY_MARGIN) / MARKER_ONLY_SCALE * METERS_PER_PIXEL_X;
  const halfWorldHeight = ((height / 2) + MARKER_ONLY_QUERY_MARGIN) / MARKER_ONLY_SCALE * METERS_PER_PIXEL_Z;
  const minX = centerPosition.x - halfWorldWidth;
  const maxX = centerPosition.x + halfWorldWidth;
  const minY = centerPosition.y - halfWorldHeight;
  const maxY = centerPosition.y + halfWorldHeight;

  const minCellX = Math.floor(minX / MARKER_SPATIAL_CELL_SIZE);
  const maxCellX = Math.floor(maxX / MARKER_SPATIAL_CELL_SIZE);
  const minCellY = Math.floor(minY / MARKER_SPATIAL_CELL_SIZE);
  const maxCellY = Math.floor(maxY / MARKER_SPATIAL_CELL_SIZE);
  const visibleEntries = [];

  for (let cellX = minCellX; cellX <= maxCellX; cellX += 1) {
    for (let cellY = minCellY; cellY <= maxCellY; cellY += 1) {
      const bucket = markerSpatialIndex.get(`${cellX}:${cellY}`);
      if (!bucket?.length) {
        continue;
      }

      for (const entry of bucket) {
        if (
          entry.x >= minX && entry.x <= maxX
          && entry.y >= minY && entry.y <= maxY
        ) {
          visibleEntries.push(entry);
        }
      }
    }
  }

  return visibleEntries;
}

function findNearestActiveMarkerEntry(x, y) {
  if (!Number.isFinite(x) || !Number.isFinite(y) || markerEntriesById.size === 0) {
    return null;
  }

  const baseCellX = Math.floor(x / MARKER_SPATIAL_CELL_SIZE);
  const baseCellY = Math.floor(y / MARKER_SPATIAL_CELL_SIZE);
  const maxRing = 512;
  let bestEntry = null;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (let ring = 0; ring <= maxRing; ring += 1) {
    for (let offsetX = -ring; offsetX <= ring; offsetX += 1) {
      for (let offsetY = -ring; offsetY <= ring; offsetY += 1) {
        if (ring > 0 && Math.abs(offsetX) !== ring && Math.abs(offsetY) !== ring) {
          continue;
        }

        const bucket = markerSpatialIndex.get(`${baseCellX + offsetX}:${baseCellY + offsetY}`);
        if (!bucket?.length) {
          continue;
        }

        for (const entry of bucket) {
          if (!activeOreFilters.has(entry.key)) {
            continue;
          }
          if (isMarkerOnCooldown(entry.id)) {
            continue;
          }

          const distance = Math.hypot(entry.x - x, entry.y - y);
          if (distance < bestDistance) {
            bestDistance = distance;
            bestEntry = entry;
          }
        }
      }
    }

    if (bestEntry && (ring * MARKER_SPATIAL_CELL_SIZE) > bestDistance) {
      break;
    }
  }

  return bestEntry;
}

function isMarkerOnCooldown(markerId, now = Date.now()) {
  return (markerCooldowns.get(markerId) || 0) > now;
}

function getMarkerCooldownRemainingMs(markerId, now = Date.now()) {
  return Math.max(0, (markerCooldowns.get(markerId) || 0) - now);
}

function formatCooldownLabel(remainingMs) {
  const totalSeconds = Math.ceil(Math.max(0, remainingMs) / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function wait(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

async function runViewTransition(callback) {
  document.body.classList.add('mode-transitioning');
  await wait(MODE_TRANSITION_MS);
  await callback();
  requestAnimationFrame(() => {
    document.body.classList.remove('mode-transitioning');
  });
}

function getStoredCooldownsByChannel() {
  return uiSettings?.markerCooldownsByChannel || {};
}

function getSharedNearestMarkerEnabled() {
  return Boolean(uiSettings?.nearestMarkerEnabled ?? getViewSettings().nearestMarkerEnabled);
}

function getChannelKey(port = currentChannelPort) {
  return Number.isFinite(Number(port)) ? String(port) : null;
}

function loadCooldownsForChannel(port) {
  const channelKey = getChannelKey(port);
  currentChannelPort = channelKey ? Number(channelKey) : null;
  markerDwellStarts = new Map();

  if (!channelKey) {
    markerCooldowns = new Map();
    refreshMarkerCooldownVisuals();
    return;
  }

  const now = Date.now();
  const stored = getStoredCooldownsByChannel()[channelKey] || {};
  markerCooldowns = new Map(
    Object.entries(stored).filter(([, expiresAt]) => Number(expiresAt) > now),
  );
  refreshMarkerCooldownVisuals(now);
}

function persistMarkerCooldowns() {
  const channelKey = getChannelKey();
  if (!channelKey) {
    return;
  }

  const now = Date.now();
  const allCooldowns = { ...getStoredCooldownsByChannel() };
  const nextChannelCooldowns = {};

  for (const [markerId, expiresAt] of Array.from(markerCooldowns.entries())) {
    if (expiresAt > now) {
      nextChannelCooldowns[markerId] = expiresAt;
    }
  }

  allCooldowns[channelKey] = nextChannelCooldowns;
  saveUiSettings({
    markerCooldownsByChannel: allCooldowns,
  });
}

function getMarkerColor(marker) {
  return ORE_COLORS[marker.name] || '#ffffff';
}

function formatMarkerLabel(value) {
  return value
    .replace(/_/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function getMarkerIconPath(marker) {
  const fileName = MARKER_ICON_OVERRIDES[marker.name] || `${marker.name}.png`;
  return `map/icons/${encodeURIComponent(fileName).replace(/%2F/g, '/')}`;
}

function getMarkerIconImage(marker) {
  const iconPath = getMarkerIconPath(marker);
  if (markerIconImageCache.has(iconPath)) {
    return markerIconImageCache.get(iconPath);
  }

  const image = new Image();
  image.decoding = 'async';
  image.src = iconPath;
  image.addEventListener('load', () => {
    scheduleMarkerOnlyCanvasDraw();
  });
  image.addEventListener('error', () => {
    scheduleMarkerOnlyCanvasDraw();
  });
  markerIconImageCache.set(iconPath, image);
  return image;
}

function createMarkerIcon(marker, color, options = {}) {
  const { cooldownLabel = null } = options;
  const iconPath = getMarkerIconPath(marker);

  return L.divIcon({
    className: 'ore-point-icon',
    html: `
      <span class="ore-point-icon-wrap ${cooldownLabel ? 'is-cooldown' : ''}">
        ${cooldownLabel ? `<span class="ore-point-icon-cooldown">${cooldownLabel}</span>` : ''}
        <img class="ore-point-icon-image" src="${iconPath}" alt="">
        <span class="ore-point-icon-glow" style="--ore-color:${color}"></span>
      </span>
    `,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -10],
  });
}

function createFilterIconHtml(marker, color) {
  const iconPath = getMarkerIconPath(marker);
  return `
    <span class="legend-icon-wrap">
      <img class="legend-item-icon" src="${iconPath}" alt="">
      <span class="legend-item-icon-glow" style="--ore-color:${color}"></span>
    </span>
  `;
}

function sanitizeMarkerKey(markerKey) {
  return markerKey.replace(/[^a-zA-Z0-9_-]/g, '-');
}

function getMarkerPaneName(markerKey) {
  return `marker-pane-${sanitizeMarkerKey(markerKey)}`;
}

function ensureMarkerPane(markerKey) {
  const paneName = getMarkerPaneName(markerKey);
  let pane = map.getPane(paneName);

  if (!pane) {
    pane = map.createPane(paneName);
    pane.classList.add('marker-fade-pane');
    pane.style.zIndex = '450';
    pane.style.opacity = '0';
  }

  return pane;
}

function getCategoryGroups() {
  const groups = new Map();

  for (const marker of getMarkerEntries()) {
    if (!groups.has(marker.category)) {
      groups.set(marker.category, []);
    }
    groups.get(marker.category).push(marker);
  }

  return Array.from(groups.entries())
    .sort(([left], [right]) => (CATEGORY_ORDER[left] ?? 999) - (CATEGORY_ORDER[right] ?? 999))
    .map(([category, markers]) => ({
      category,
      label: CATEGORY_LABELS[category] || category,
      markers: markers.sort((left, right) => left.name.localeCompare(right.name)),
    }));
}

function getRoutePlannerCategoryGroups() {
  return getCategoryGroups().filter((group) => group.category !== 'standart');
}

function getActiveCategoryKeys(group) {
  return group.markers
    .map((marker) => marker.key)
    .filter((key) => activeOreFilters.has(key));
}

function createCategoryButton(group, options = {}) {
  const { compact = false } = options;
  const categoryButton = document.createElement('button');
  categoryButton.type = 'button';
  categoryButton.className = compact ? 'marker-only-filter-button' : 'legend-category-button';
  categoryButton.dataset.category = group.category;
  categoryButton.dataset.selected = openLegendCategory === group.category ? 'true' : 'false';
  const iconPath = CATEGORY_ICONS[group.category];
  const activeCount = getActiveCategoryKeys(group).length;
  categoryButton.dataset.active = activeCount > 0 ? 'true' : 'false';

  if (compact) {
    categoryButton.setAttribute('aria-label', `${group.label} ${activeCount}/${group.markers.length}`);
    categoryButton.innerHTML = `${iconPath ? `<img class="marker-only-filter-icon" src="${iconPath}" alt="">` : ''}`;
  } else {
    categoryButton.innerHTML = `${iconPath ? `<img class="legend-category-icon" src="${iconPath}" alt="">` : ''}<span class="legend-category-label">${group.label}</span><span class="legend-category-count">${activeCount}/${group.markers.length}</span>`;
  }

  categoryButton.addEventListener('mouseenter', () => {
    cancelLegendMenuClose();
    if (openLegendCategory !== group.category) {
      openLegendCategory = group.category;
      renderLegend();
    }
  });
  categoryButton.addEventListener('click', (event) => {
    event.stopPropagation();
    toggleCategoryFilters(group);
  });

  return categoryButton;
}

function saveFilterState() {
  saveSharedFilterState();
}

function updateMarkerLeafletIcon(markerId) {
  const markerRef = markerLeafletMarkers.get(markerId);
  if (!markerRef) {
    return;
  }

  const cooldownLabel = isMarkerOnCooldown(markerId)
    ? formatCooldownLabel(getMarkerCooldownRemainingMs(markerId))
    : null;

  markerRef.leafletMarker.setIcon(
    createMarkerIcon(markerRef.marker, markerRef.color, { cooldownLabel }),
  );
}

function refreshMarkerCooldownVisuals(now = Date.now()) {
  let needsCanvasRefresh = false;
  let cooldownsChanged = false;

  for (const [markerId, expiresAt] of Array.from(markerCooldowns.entries())) {
    if (expiresAt <= now) {
      markerCooldowns.delete(markerId);
      cooldownsChanged = true;
    }

    updateMarkerLeafletIcon(markerId);
    needsCanvasRefresh = true;
  }

  if (cooldownsChanged) {
    persistMarkerCooldowns();
  }

  if (needsCanvasRefresh) {
    scheduleMarkerOnlyCanvasDraw();
  }

  refreshNearestMarkerLine();
}

function ensureMarkerCooldownTimer() {
  if (markerCooldownTimer) {
    return;
  }

  markerCooldownTimer = setInterval(() => {
    processMarkerProximity(playerPosition);
    refreshMarkerCooldownVisuals();
  }, 1000);
}

function processMarkerProximity(position) {
  if (!position) {
    return;
  }

  const now = Date.now();
  const nearbyIds = new Set();

  for (const entry of queryNearbyMarkerEntries(position.x, position.y)) {
    if (Math.hypot(entry.x - position.x, entry.y - position.y) > MARKER_DEACTIVATION_DISTANCE) {
      continue;
    }

    nearbyIds.add(entry.id);

    if (isMarkerOnCooldown(entry.id, now)) {
      markerDwellStarts.delete(entry.id);
      continue;
    }

    const dwellStart = markerDwellStarts.get(entry.id);
    if (!dwellStart) {
      markerDwellStarts.set(entry.id, now);
      continue;
    }

    if ((now - dwellStart) >= MARKER_DEACTIVATION_DWELL_MS) {
      markerDwellStarts.delete(entry.id);
      markerCooldowns.set(entry.id, now + MARKER_DEACTIVATION_COOLDOWN_MS);
      persistMarkerCooldowns();
      updateMarkerLeafletIcon(entry.id);
      scheduleMarkerOnlyCanvasDraw();
    }
  }

  for (const markerId of Array.from(markerDwellStarts.keys())) {
    if (!nearbyIds.has(markerId)) {
      markerDwellStarts.delete(markerId);
    }
  }
}

function updateNearestMarkerButtonState() {
  if (!findNearestButton) {
    return;
  }

  findNearestButton.dataset.active = nearestMarkerEnabled ? 'true' : 'false';

  const compactButton = markerOnlyFiltersElement?.querySelector('.marker-only-nearest-button');
  if (compactButton) {
    compactButton.dataset.active = nearestMarkerEnabled ? 'true' : 'false';
  }
}

function updateRoutePlannerButtonState() {
  if (routePlannerButton) {
    routePlannerButton.dataset.active = activeRoute ? 'true' : 'false';
  }

  const compactButton = markerOnlyFiltersElement?.querySelector('.marker-only-route-button');
  if (compactButton) {
    compactButton.dataset.active = activeRoute ? 'true' : 'false';
  }
}

function saveNearestMarkerState(enabled) {
  nearestMarkerEnabled = enabled;
  saveUiSettings({
    nearestMarkerEnabled: enabled,
    normalView: {
      ...getViewSettings('normalView'),
      nearestMarkerEnabled: enabled,
    },
    markerView: {
      ...getViewSettings('markerView'),
      nearestMarkerEnabled: enabled,
    },
  });
  updateNearestMarkerButtonState();
}

function openConfirmDialog(message) {
  if (!confirmDialog || !confirmDialogMessage || !confirmDialogCancel || !confirmDialogConfirm) {
    return Promise.resolve(window.confirm(message));
  }

  confirmDialogMessage.textContent = message;
  confirmDialog.hidden = false;

  return new Promise((resolve) => {
    confirmDialogResolver = resolve;
  });
}

function closeConfirmDialog(confirmed) {
  if (!confirmDialog) {
    return;
  }

  confirmDialog.hidden = true;
  if (confirmDialogResolver) {
    confirmDialogResolver(Boolean(confirmed));
    confirmDialogResolver = null;
  }
}

async function toggleNearestMarkerWithRouteGuard() {
  const nextEnabled = !nearestMarkerEnabled;
  if (nextEnabled && activeRoute) {
    const confirmed = await openConfirmDialog('Der Routenplaner ist aktiv. Wenn du jetzt "Nearest" startest, wird die Route beendet und deine alten Filter werden wiederhergestellt.');
    if (!confirmed) {
      return;
    }
    abortRoute();
  }

  saveNearestMarkerState(nextEnabled);
  refreshNearestMarkerLine();
  scheduleMarkerOnlyCanvasDraw();
}

function ensureRouteFilterOverrideBackup() {
  if (!routeFilterOverrideBackup) {
    routeFilterOverrideBackup = {
      activeOreFilters: Array.from(activeOreFilters),
      categoryFilterMemory: structuredClone(categoryFilterMemory),
    };
  }
}

function ensureNearestMarkerLine() {
  if (!map || nearestMarkerLine) {
    return;
  }

  nearestMarkerLine = L.polyline([], {
    pane: 'overlayPane',
    interactive: false,
    color: '#9cf7be',
    weight: 3,
    opacity: 0.88,
    lineCap: 'round',
    lineJoin: 'round',
    dashArray: '10 8',
  });
}

function ensurePlayerDistanceBadge() {
  if (!map || playerDistanceBadge) {
    return;
  }

  playerDistanceBadge = L.marker([0, 0], {
    interactive: false,
    zIndexOffset: 900,
    icon: L.divIcon({
      className: 'player-distance-badge-wrap',
      html: '<span class="ore-point-icon-cooldown player-distance-badge">0m</span>',
      iconSize: [44, 20],
      iconAnchor: [22, 30],
    }),
  });
}

function refreshNearestMarkerLine() {
  if (!map) {
    return;
  }

  ensureNearestMarkerLine();
  ensurePlayerDistanceBadge();
  updateNearestMarkerButtonState();

  const shouldShow = nearestMarkerEnabled && !activeRoute && !isMarkerOnlyMode && playerPosition;
  if (!shouldShow) {
    if (nearestMarkerLine && map.hasLayer(nearestMarkerLine)) {
      map.removeLayer(nearestMarkerLine);
    }
    if (playerDistanceBadge && map.hasLayer(playerDistanceBadge) && !activeRoute) {
      map.removeLayer(playerDistanceBadge);
    }
    return;
  }

  const nearestEntry = findNearestActiveMarkerEntry(playerPosition.x, playerPosition.y);
  if (!nearestEntry) {
    if (map.hasLayer(nearestMarkerLine)) {
      map.removeLayer(nearestMarkerLine);
    }
    if (playerDistanceBadge && map.hasLayer(playerDistanceBadge) && !activeRoute) {
      map.removeLayer(playerDistanceBadge);
    }
    return;
  }

  const playerLatLng = playerToLatLng(playerPosition.x, playerPosition.y);
  const markerLatLng = oreToLatLng(nearestEntry.x, nearestEntry.y);
  const distanceMeters = Math.round(Math.hypot(nearestEntry.x - playerPosition.x, nearestEntry.y - playerPosition.y));
  nearestMarkerLine.setLatLngs([playerLatLng, markerLatLng]);

  if (!map.hasLayer(nearestMarkerLine)) {
    nearestMarkerLine.addTo(map);
  }

  playerDistanceBadge.setLatLng(playerLatLng);
  playerDistanceBadge.setIcon(L.divIcon({
    className: 'player-distance-badge-wrap',
    html: `<span class="ore-point-icon-cooldown player-distance-badge">${distanceMeters}m</span>`,
    iconSize: [44, 20],
    iconAnchor: [22, 30],
  }));
  if (!map.hasLayer(playerDistanceBadge)) {
    playerDistanceBadge.addTo(map);
  }
}

function createMarkerOnlyNearestButton() {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'marker-only-filter-button marker-only-nearest-button';
  button.dataset.active = nearestMarkerEnabled ? 'true' : 'false';
  button.setAttribute('aria-label', 'Nächsten Marker finden');
  button.innerHTML = '<img class="marker-only-filter-icon marker-only-nearest-icon" src="map/findnearest.png" alt="">';
  button.addEventListener('click', (event) => {
    event.stopPropagation();
    toggleNearestMarkerWithRouteGuard();
  });
  return button;
}

function createMarkerOnlyRoutePlannerButton() {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'marker-only-filter-button marker-only-route-button';
  button.dataset.active = activeRoute ? 'true' : 'false';
  button.setAttribute('aria-label', 'Routenplaner');
  button.innerHTML = '<img class="marker-only-filter-icon marker-only-route-icon" src="map/routenplaner.png" alt="">';
  button.addEventListener('click', (event) => {
    event.stopPropagation();
    window.livemapApi.openRoutePlanner();
  });
  return button;
}

function syncRoutePlannerConfigFromInputs() {
  const config = getRoutePlannerConfig();
  if (routeUsePlayerStartInput) {
    config.usePlayerStart = routeUsePlayerStartInput.checked;
  }

  if (routeMarkerList) {
    for (const input of routeMarkerList.querySelectorAll('input[data-marker-key]')) {
      const markerKey = input.dataset.markerKey;
      const field = input.dataset.field;
      if (!config.markerConfig[markerKey]) {
        config.markerConfig[markerKey] = { enabled: false, minCount: 1 };
      }

      if (field === 'enabled') {
        config.markerConfig[markerKey].enabled = input.checked;
      } else if (field === 'minCount') {
        config.markerConfig[markerKey].minCount = Math.max(1, Number(input.value) || 1);
      }
    }
  }

  saveRoutePlannerConfig();
}

function getDefaultRoutePlannerConfig() {
  const markerConfig = {};
  for (const marker of getRoutePlannerMarkers()) {
    markerConfig[marker.key] = {
      enabled: activeOreFilters.has(marker.key),
      minCount: marker.category === 'erze' ? 3 : 1,
    };
  }

  return {
    usePlayerStart: true,
    markerConfig,
  };
}

function getRoutePlannerConfig() {
  if (!routePlannerConfig) {
    const savedConfig = uiSettings?.routePlannerConfig;
    const defaultConfig = getDefaultRoutePlannerConfig();
    routePlannerConfig = {
      ...defaultConfig,
      ...(savedConfig || {}),
      markerConfig: {
        ...defaultConfig.markerConfig,
        ...(savedConfig?.markerConfig || {}),
      },
    };
  }

  return routePlannerConfig;
}

function saveRoutePlannerConfig() {
  if (!routePlannerConfig) {
    return;
  }

  saveUiSettings({
    routePlannerConfig,
  });
}

function ensureRouteLines() {
  if (!map) {
    return;
  }

  if (!routePreviewLine) {
    routePreviewLine = L.polyline([], {
      pane: 'overlayPane',
      interactive: false,
      color: '#7db6ff',
      weight: 3,
      opacity: 0.5,
      lineCap: 'round',
      lineJoin: 'round',
      dashArray: '4 8',
    });
  }

  if (!routeGuideLine) {
    routeGuideLine = L.polyline([], {
      pane: 'overlayPane',
      interactive: false,
      color: '#9cf7be',
      weight: 3,
      opacity: 0.9,
      lineCap: 'round',
      lineJoin: 'round',
      dashArray: '10 8',
    });
  }
}

function getSelectedRouteMarkerConfigs() {
  const config = getRoutePlannerConfig();
  return getRoutePlannerMarkers()
    .map((marker) => ({
      marker,
      config: config.markerConfig[marker.key] || { enabled: false, minCount: 1 },
    }))
    .filter(({ config: itemConfig }) => itemConfig.enabled);
}

function getRouteStartPoint(config) {
  if (config.usePlayerStart && playerPosition) {
    return { x: playerPosition.x, y: playerPosition.y };
  }

  const selectedPoints = [];
  for (const { marker } of getSelectedRouteMarkerConfigs()) {
    for (const [x, y] of marker.coordinates) {
      selectedPoints.push({ x, y });
    }
  }

  if (!selectedPoints.length) {
    return { x: 0, y: 0 };
  }

  const sum = selectedPoints.reduce((acc, point) => ({
    x: acc.x + point.x,
    y: acc.y + point.y,
  }), { x: 0, y: 0 });

  return {
    x: sum.x / selectedPoints.length,
    y: sum.y / selectedPoints.length,
  };
}

function buildRoutePointPool(config, variantIndex) {
  const startPoint = getRouteStartPoint(config);
  const pool = [];

  for (const { marker, config: markerConfig } of getSelectedRouteMarkerConfigs()) {
    const requiredCount = Math.max(1, Number(markerConfig.minCount) || 1);
    const sortedPoints = marker.coordinates
      .map(([x, y], coordinateIndex) => ({
        id: getMarkerCoordinateId(marker.key, coordinateIndex),
        markerKey: marker.key,
        markerName: marker.name,
        marker,
        x,
        y,
        distanceToStart: Math.hypot(x - startPoint.x, y - startPoint.y),
      }))
      .filter((point) => !isMarkerOnCooldown(point.id))
      .sort((left, right) => left.distanceToStart - right.distanceToStart);

    if (!sortedPoints.length) {
      continue;
    }

    const desiredCount = Math.min(sortedPoints.length, requiredCount);
    const offset = Math.min(variantIndex, Math.max(0, sortedPoints.length - desiredCount));
    const slice = sortedPoints.slice(offset, offset + desiredCount);
    pool.push(...slice);
  }

  return { startPoint, pool };
}

function buildRouteFromPool(startPoint, points, variantIndex) {
  if (!points.length) {
    return [];
  }

  const remaining = [...points];
  const route = [];
  let current = { ...startPoint };

  if (variantIndex === 3) {
    remaining.sort((left, right) => Math.hypot(right.x - startPoint.x, right.y - startPoint.y) - Math.hypot(left.x - startPoint.x, left.y - startPoint.y));
  } else if (variantIndex === 4) {
    remaining.sort((left, right) => Math.atan2(left.y - startPoint.y, left.x - startPoint.x) - Math.atan2(right.y - startPoint.y, right.x - startPoint.x));
  }

  while (remaining.length > 0) {
    let bestIndex = 0;
    let bestScore = Number.POSITIVE_INFINITY;

    for (let index = 0; index < remaining.length; index += 1) {
      const point = remaining[index];
      const distance = Math.hypot(point.x - current.x, point.y - current.y);
      let score = distance;

      if (variantIndex === 1) {
        score = distance * 0.94 + Math.abs(point.x - startPoint.x) * 0.02;
      } else if (variantIndex === 2) {
        score = distance + (route.some((entry) => entry.markerKey === point.markerKey) ? 18 : -12);
      } else if (variantIndex === 3) {
        score = distance * 0.92 + Math.abs(point.x - startPoint.x) * 0.03;
      } else if (variantIndex === 4) {
        score = distance * 0.88 + Math.abs(point.y - startPoint.y) * 0.03;
      }

      if (score < bestScore) {
        bestScore = score;
        bestIndex = index;
      }
    }

    const [nextPoint] = remaining.splice(bestIndex, 1);
    route.push(nextPoint);
    current = nextPoint;
  }

  return route;
}

function calculateRouteMetrics(startPoint, routePoints) {
  if (!routePoints.length) {
    return {
      totalDistance: 0,
      averageStepDistance: 0,
      efficiencyScore: 0,
    };
  }

  let totalDistance = 0;
  let current = startPoint;
  for (const point of routePoints) {
    totalDistance += Math.hypot(point.x - current.x, point.y - current.y);
    current = point;
  }

  return {
    totalDistance,
    averageStepDistance: totalDistance / routePoints.length,
    efficiencyScore: totalDistance / Math.max(routePoints.length, 1),
  };
}

function buildRouteVariant(variantIndex) {
  const config = getRoutePlannerConfig();
  const { startPoint, pool } = buildRoutePointPool(config, variantIndex);
  const routePoints = buildRouteFromPool(startPoint, pool, variantIndex);
  const metrics = calculateRouteMetrics(startPoint, routePoints);
  return {
    id: `route-${variantIndex + 1}`,
    index: variantIndex,
    startPoint,
    configSnapshot: structuredClone(config),
    points: routePoints,
    ...metrics,
  };
}

function generateRouteSuggestions() {
  routePlannerResults = Array.from({ length: ROUTE_VARIANT_COUNT }, (_, index) => buildRouteVariant(index))
    .filter((route) => route.points.length > 0)
    .sort((left, right) => left.efficiencyScore - right.efficiencyScore)
    .map((route, index) => ({ ...route, rank: index + 1 }));
}

function formatMeters(value) {
  return `${Math.round(value)}m`;
}

function renderRouteResults() {
  if (!routeResultsList) {
    return;
  }

  routeResultsList.innerHTML = '';

  if (!routePlannerResults.length) {
    routeResultsList.innerHTML = '<div class="planner-empty">Keine Route verfügbar. Marker-Auswahl oder Mindestanzahl anpassen.</div>';
    return;
  }

  for (const route of routePlannerResults) {
    const card = document.createElement('article');
    card.className = 'planner-route-card';
    card.innerHTML = `
      <div class="planner-route-head">
        <strong>Route ${route.rank}</strong>
        <span>${route.points.length} Marker</span>
      </div>
      <div class="planner-route-metrics">
        <div><span>Komplette Strecke</span><strong>${formatMeters(route.totalDistance)}</strong></div>
        <div><span>Ø Abstand</span><strong>${formatMeters(route.averageStepDistance)}</strong></div>
      </div>
      <div class="planner-route-actions-row">
        <button class="planner-secondary" data-action="preview" data-route-id="${route.id}" type="button">Vorschau</button>
        <button class="planner-primary" data-action="start" data-route-id="${route.id}" type="button">Starten</button>
      </div>
    `;
    routeResultsList.appendChild(card);
  }
}

function renderRouteMarkerList() {
  if (!routeMarkerList) {
    return;
  }

  const config = getRoutePlannerConfig();
  routeMarkerList.innerHTML = '';

  for (const group of getRoutePlannerCategoryGroups()) {
    const groupElement = document.createElement('section');
    groupElement.className = 'planner-marker-group';
    groupElement.innerHTML = `<h3>${group.label}</h3>`;

    for (const marker of group.markers) {
      const markerConfig = config.markerConfig[marker.key] || { enabled: false, minCount: 1 };
      const row = document.createElement('label');
      row.className = 'planner-marker-row';
      row.innerHTML = `
        <span class="planner-marker-main">
          <input data-field="enabled" data-marker-key="${marker.key}" type="checkbox" ${markerConfig.enabled ? 'checked' : ''}>
          <img src="${getMarkerIconPath(marker)}" alt="">
          <span>${formatMarkerLabel(marker.name)}</span>
        </span>
        <span class="planner-marker-inputs">
          <input data-field="minCount" data-marker-key="${marker.key}" type="number" min="1" max="25" value="${markerConfig.minCount}">
        </span>
      `;
      groupElement.appendChild(row);
    }

    routeMarkerList.appendChild(groupElement);
  }
}

function renderRouteResults() {
  if (!routeResultsList) {
    return;
  }

  routeResultsList.innerHTML = '';

  if (!routePlannerResults.length) {
    routeResultsList.innerHTML = '<div class="planner-empty">Keine Route verfügbar. Marker-Auswahl oder Mindestanzahl anpassen.</div>';
    return;
  }

  for (const route of routePlannerResults) {
    const card = document.createElement('article');
    card.className = 'planner-route-card';
    card.innerHTML = `
      <div class="planner-route-head">
        <strong>Route ${route.rank}</strong>
        <span>${route.points.length} Marker</span>
      </div>
      <div class="planner-route-metrics">
        <div><span>Komplette Strecke</span><strong>${formatMeters(route.totalDistance)}</strong></div>
        <div><span>Ø Abstand</span><strong>${formatMeters(route.averageStepDistance)}</strong></div>
      </div>
      <div class="planner-route-actions-row">
        <button class="planner-secondary" data-action="preview" data-route-id="${route.id}" type="button">Vorschau</button>
        <button class="planner-primary" data-action="start" data-route-id="${route.id}" type="button">Starten</button>
      </div>
    `;
    routeResultsList.appendChild(card);
  }
}

async function openRoutePlannerOverlay(prefillActive = false) {
  if (!routePlannerOverlay || !window.location.pathname.toLowerCase().endsWith('index.html')) {
    return;
  }

  if (prefillActive && activeRoute?.configSnapshot) {
    routePlannerConfig = structuredClone(activeRoute.configSnapshot);
  }

  const config = getRoutePlannerConfig();
  if (routeUsePlayerStartInput) {
    routeUsePlayerStartInput.checked = Boolean(config.usePlayerStart);
  }
  renderRouteMarkerList();
  renderRouteResults();
  resetRoutePlannerPanelPosition();
  await expandWindowForRoutePlanner();
  routePlannerOverlay.hidden = false;
}

async function closeRoutePlannerOverlay() {
  if (routePlannerOverlay) {
    routePlannerOverlay.hidden = true;
  }
  await restoreWindowAfterRoutePlanner();
  if (!activeRoute) {
    routePreview = null;
    updateRoutePreviewAndGuidance();
    scheduleMarkerOnlyCanvasDraw();
  }
}

function applyRoutePreview(route) {
  if (!route) {
    routePreview = null;
    stopRoutePreviewPlayback(true);
    if (!activeRoute) {
      restoreRouteFilterOverride();
    }
    updateRoutePreviewAndGuidance();
    scheduleMarkerOnlyCanvasDraw();
    return;
  }

  ensureRouteFilterOverrideBackup();
  routePreview = route;
  applyRouteFilterOverride(routePreview);
  startRoutePreviewPlayback(routePreview);
  updateRoutePreviewAndGuidance();
  scheduleMarkerOnlyCanvasDraw();
}

function applyRouteStart(route) {
  if (!route) {
    return;
  }

  ensureRouteFilterOverrideBackup();

  activeRoute = {
    ...route,
    currentIndex: 0,
  };
  saveNearestMarkerState(false);
  routePreview = route;
  stopRoutePreviewPlayback(false);
  applyRouteFilterOverride(activeRoute);
  updateRoutePreviewAndGuidance();
  refreshNearestMarkerLine();
  scheduleMarkerOnlyCanvasDraw();
}

function stopRoutePreviewPlayback(centerOnPlayer) {
  routePreviewPlaybackToken += 1;
  if (centerOnPlayer && targetPlayerLatLng && map && !isMarkerOnlyMode) {
    map.flyTo(targetPlayerLatLng, map.getZoom(), {
      animate: true,
      duration: 0.7,
      easeLinearity: 0.2,
    });
  }
}

async function startRoutePreviewPlayback(route) {
  if (!map || !route?.points?.length || isMarkerOnlyMode) {
    return;
  }

  routePreviewPlaybackToken += 1;
  const currentToken = routePreviewPlaybackToken;
  const previewPoints = [route.startPoint, ...route.points];

  for (let index = 0; index < previewPoints.length; index += 1) {
    if (currentToken !== routePreviewPlaybackToken || !routePreview || routePreview.id !== route.id || activeRoute) {
      return;
    }

    const point = previewPoints[index];
    const latLng = oreToLatLng(point.x, point.y);
    if (index === 0) {
      map.flyTo(latLng, 2.6, {
        animate: true,
        duration: 0.8,
        easeLinearity: 0.1,
      });
    } else {
      map.panTo(latLng, {
        animate: true,
        duration: 0.42,
        easeLinearity: 0.12,
        noMoveStart: true,
      });
    }
    await wait(index === 0 ? 620 : 340);
  }

  if (currentToken === routePreviewPlaybackToken && routePreview?.id === route.id) {
    routePreview = null;
    updateRoutePreviewAndGuidance();
    scheduleMarkerOnlyCanvasDraw();
    window.livemapApi.previewRoute(null);
  }
}

function resetRoutePlannerPanelPosition() {
  if (!routePlannerOverlay) {
    return;
  }

  routePlannerOverlay.style.removeProperty('--planner-offset-x');
  routePlannerOverlay.style.removeProperty('--planner-offset-y');
}

async function expandWindowForRoutePlanner() {
  const currentBounds = await window.livemapApi.getWindowBounds();
  if (!routePlannerWindowBoundsBackup) {
    routePlannerWindowBoundsBackup = { ...currentBounds };
  }

  const target = isMarkerOnlyMode
    ? ROUTE_PLANNER_WINDOW_BOUNDS.markerOnly
    : ROUTE_PLANNER_WINDOW_BOUNDS.normal;

  const nextWidth = Math.max(currentBounds.width, target.width);
  const nextHeight = Math.max(currentBounds.height, target.height);

  if (nextWidth === currentBounds.width && nextHeight === currentBounds.height) {
    return;
  }

  const nextBounds = {
    x: currentBounds.x - Math.round((nextWidth - currentBounds.width) / 2),
    y: currentBounds.y - Math.round((nextHeight - currentBounds.height) / 2),
    width: nextWidth,
    height: nextHeight,
    viewKey: getCurrentViewKey(),
  };
  await window.livemapApi.setWindowBounds(nextBounds);
}

async function restoreWindowAfterRoutePlanner() {
  if (!routePlannerWindowBoundsBackup) {
    return;
  }

  const restoreBounds = {
    ...routePlannerWindowBoundsBackup,
    viewKey: getCurrentViewKey(),
  };
  routePlannerWindowBoundsBackup = null;
  await window.livemapApi.setWindowBounds(restoreBounds);
}

function clampRoutePlannerPanelPosition(nextX, nextY) {
  if (!routePlannerPanel || !routePlannerOverlay) {
    return { x: nextX, y: nextY };
  }

  const margin = 16;
  const overlayRect = routePlannerOverlay.getBoundingClientRect();
  const panelRect = routePlannerPanel.getBoundingClientRect();
  const maxX = Math.max(0, (overlayRect.width - panelRect.width) / 2 - margin);
  const maxY = Math.max(0, (overlayRect.height - panelRect.height) / 2 - margin);

  return {
    x: Math.min(Math.max(nextX, -maxX), maxX),
    y: Math.min(Math.max(nextY, -maxY), maxY),
  };
}

function startRoutePlannerDrag(event) {
  if (!routePlannerOverlay || !routePlannerPanel || !routePlannerHeader) {
    return;
  }

  if (event.target.closest('button, input, label')) {
    return;
  }

  const offsetX = Number.parseFloat(routePlannerOverlay.style.getPropertyValue('--planner-offset-x') || '0');
  const offsetY = Number.parseFloat(routePlannerOverlay.style.getPropertyValue('--planner-offset-y') || '0');
  routePlannerDragState = {
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    originX: Number.isFinite(offsetX) ? offsetX : 0,
    originY: Number.isFinite(offsetY) ? offsetY : 0,
  };

  routePlannerHeader.setPointerCapture?.(event.pointerId);
  routePlannerOverlay.dataset.dragging = 'true';
}

function updateRoutePlannerDrag(event) {
  if (!routePlannerDragState || routePlannerDragState.pointerId !== event.pointerId) {
    return;
  }

  const nextX = routePlannerDragState.originX + (event.clientX - routePlannerDragState.startX);
  const nextY = routePlannerDragState.originY + (event.clientY - routePlannerDragState.startY);
  const clamped = clampRoutePlannerPanelPosition(nextX, nextY);
  routePlannerOverlay.style.setProperty('--planner-offset-x', `${Math.round(clamped.x)}px`);
  routePlannerOverlay.style.setProperty('--planner-offset-y', `${Math.round(clamped.y)}px`);
}

function stopRoutePlannerDrag(event) {
  if (!routePlannerDragState) {
    return;
  }

  if (!event || routePlannerDragState.pointerId === event.pointerId) {
    routePlannerHeader?.releasePointerCapture?.(routePlannerDragState.pointerId);
    routePlannerDragState = null;
    if (routePlannerOverlay) {
      delete routePlannerOverlay.dataset.dragging;
    }
  }
}

function applyRouteFilterOverride(routeSource = activeRoute) {
  if (!routeSource?.configSnapshot) {
    return;
  }

  const routeKeys = getRoutePlannerMarkers()
    .map((marker) => marker.key)
    .filter((key) => routeSource.configSnapshot.markerConfig[key]?.enabled);

  activeOreFilters = new Set(routeKeys);
  categoryFilterMemory = {
    ...categoryFilterMemory,
    erze: routeKeys.filter((key) => oreData[key]?.category === 'erze'),
    pflanzen: routeKeys.filter((key) => oreData[key]?.category === 'pflanzen'),
  };
  syncOreLayers();
  renderLegend();
  scheduleMarkerOnlyCanvasDraw();
  refreshNearestMarkerLine();
}

function restoreRouteFilterOverride() {
  if (!routeFilterOverrideBackup) {
    return;
  }

  activeOreFilters = new Set(routeFilterOverrideBackup.activeOreFilters);
  categoryFilterMemory = { ...routeFilterOverrideBackup.categoryFilterMemory };
  routeFilterOverrideBackup = null;
  syncOreLayers();
  renderLegend();
  scheduleMarkerOnlyCanvasDraw();
  refreshNearestMarkerLine();
}

function updateRoutePreviewAndGuidance() {
  if (!map) {
    return;
  }

  ensureRouteLines();
  updateRoutePlannerButtonState();
  const route = activeRoute || routePreview;
  const showRoute = Boolean(route && route.points.length);

  if (!showRoute || isMarkerOnlyMode) {
    if (routePreviewLine && map.hasLayer(routePreviewLine)) {
      map.removeLayer(routePreviewLine);
    }
    if (routeGuideLine && map.hasLayer(routeGuideLine)) {
      map.removeLayer(routeGuideLine);
    }
    if (activeRoute && playerDistanceBadge && map.hasLayer(playerDistanceBadge)) {
      map.removeLayer(playerDistanceBadge);
    }
    return;
  }

  const visiblePoints = activeRoute
    ? route.points.slice(Math.max(0, activeRoute.currentIndex))
    : route.points;
  const previewLatLngs = visiblePoints.map((point) => oreToLatLng(point.x, point.y));
  routePreviewLine.setLatLngs(previewLatLngs);
  if (!map.hasLayer(routePreviewLine)) {
    routePreviewLine.addTo(map);
  }

  if (activeRoute && playerPosition) {
    const nextPoint = activeRoute.points[activeRoute.currentIndex];
    if (nextPoint) {
      const distanceMeters = Math.round(Math.hypot(nextPoint.x - playerPosition.x, nextPoint.y - playerPosition.y));
      routeGuideLine.setLatLngs([
        playerToLatLng(playerPosition.x, playerPosition.y),
        oreToLatLng(nextPoint.x, nextPoint.y),
      ]);
      if (!map.hasLayer(routeGuideLine)) {
        routeGuideLine.addTo(map);
      }
      playerDistanceBadge.setLatLng(playerToLatLng(playerPosition.x, playerPosition.y));
      playerDistanceBadge.setIcon(L.divIcon({
        className: 'player-distance-badge-wrap',
        html: `<span class="ore-point-icon-cooldown player-distance-badge">${distanceMeters}m</span>`,
        iconSize: [44, 20],
        iconAnchor: [22, 30],
      }));
      if (!map.hasLayer(playerDistanceBadge)) {
        playerDistanceBadge.addTo(map);
      }
    } else if (map.hasLayer(routeGuideLine)) {
      map.removeLayer(routeGuideLine);
    }
  } else {
    if (map.hasLayer(routeGuideLine)) {
      map.removeLayer(routeGuideLine);
    }
    if (playerDistanceBadge && map.hasLayer(playerDistanceBadge)) {
      map.removeLayer(playerDistanceBadge);
    }
  }
}

function previewRoute(routeId) {
  const route = routePlannerResults.find((item) => item.id === routeId) || null;
  applyRoutePreview(route);
}

function startRoute(routeId) {
  const route = routePlannerResults.find((route) => route.id === routeId);
  if (!route) {
    return;
  }
  applyRouteStart(route);
  closeRoutePlannerOverlay();
}

function abortRoute(notifyMain = true) {
  activeRoute = null;
  routePreview = null;
  stopRoutePreviewPlayback(false);
  restoreRouteFilterOverride();
  updateRoutePreviewAndGuidance();
  refreshNearestMarkerLine();
  scheduleMarkerOnlyCanvasDraw();
  if (notifyMain) {
    window.livemapApi.abortRoute();
  }
}

function updateRouteProgress() {
  if (!activeRoute || activeRoute.paused || !playerPosition) {
    return;
  }

  const nextPoint = activeRoute.points[activeRoute.currentIndex];
  if (!nextPoint) {
    abortRoute();
    return;
  }

  if (isMarkerOnCooldown(nextPoint.id)) {
    activeRoute.currentIndex += 1;
    if (activeRoute.currentIndex >= activeRoute.points.length) {
      abortRoute();
      return;
    }
    updateRoutePreviewAndGuidance();
    refreshNearestMarkerLine();
    scheduleMarkerOnlyCanvasDraw();
  }
}

function clearLayerVisibilityTimer(markerKey) {
  if (!layerVisibilityTimers.has(markerKey)) {
    return;
  }

  clearTimeout(layerVisibilityTimers.get(markerKey));
  layerVisibilityTimers.delete(markerKey);
}

function showMarkerLayer(markerKey, layer) {
  const pane = ensureMarkerPane(markerKey);
  clearLayerVisibilityTimer(markerKey);

  if (!map.hasLayer(layer)) {
    layer.addTo(map);
  }

  requestAnimationFrame(() => {
    pane.style.opacity = '1';
  });
}

function hideMarkerLayer(markerKey, layer) {
  const pane = ensureMarkerPane(markerKey);
  clearLayerVisibilityTimer(markerKey);
  pane.style.opacity = '0';

  layerVisibilityTimers.set(markerKey, setTimeout(() => {
    if (map.hasLayer(layer)) {
      map.removeLayer(layer);
    }
    layerVisibilityTimers.delete(markerKey);
  }, MARKER_LAYER_FADE_MS));
}

function cancelLegendMenuClose() {
  if (closeLegendMenuTimer) {
    clearTimeout(closeLegendMenuTimer);
    closeLegendMenuTimer = null;
  }
}

function scheduleLegendMenuClose() {
  cancelLegendMenuClose();
  closeLegendMenuTimer = setTimeout(() => {
    closeLegendMenu();
  }, 120);
}

function closeLegendMenu() {
  if (!openLegendCategory) {
    return;
  }

  const openCategory = openLegendCategory;
  const overlayMenu = legendOverlayRoot?.querySelector('.legend-overlay-menu');
  if (!overlayMenu) {
    openLegendCategory = null;
    renderLegend();
    return;
  }

  overlayMenu.dataset.closing = 'true';
  setTimeout(() => {
    if (openLegendCategory !== openCategory) {
      return;
    }
    openLegendCategory = null;
    renderLegend();
  }, 120);
}

function toggleCategoryFilters(group) {
  if (activeRoute) {
    return;
  }

  const markerKeys = group.markers.map((marker) => marker.key);
  const activeKeys = getActiveCategoryKeys(group);

  if (activeKeys.length > 0) {
    categoryFilterMemory[group.category] = [...activeKeys];
    for (const key of activeKeys) {
      activeOreFilters.delete(key);
    }
  } else {
    const rememberedKeys = categoryFilterMemory[group.category]?.filter((key) => markerKeys.includes(key));
    const keysToEnable = rememberedKeys?.length ? rememberedKeys : markerKeys;

    for (const key of keysToEnable) {
      activeOreFilters.add(key);
    }
  }

  syncOreLayers();
  renderLegend();
  saveFilterState();
  refreshNearestMarkerLine();
}

function scheduleMarkerOnlyCanvasDraw() {
  if (!markerOnlyCanvas || !isMarkerOnlyMode || markerOnlyCanvasFrame) {
    return;
  }

  markerOnlyCanvasFrame = requestAnimationFrame(() => {
    markerOnlyCanvasFrame = null;
    drawMarkerOnlyCanvas();
  });
}

function stopMarkerOnlyAnimation() {
  if (markerOnlyAnimationFrame) {
    cancelAnimationFrame(markerOnlyAnimationFrame);
    markerOnlyAnimationFrame = null;
  }
}

function animateMarkerOnlyCanvas() {
  if (!isMarkerOnlyMode || !markerOnlyTargetPosition) {
    markerOnlyAnimationFrame = null;
    return;
  }

  if (!markerOnlyDisplayPosition) {
    markerOnlyDisplayPosition = { ...markerOnlyTargetPosition };
    scheduleMarkerOnlyCanvasDraw();
    markerOnlyAnimationFrame = null;
    return;
  }

  const deltaX = markerOnlyTargetPosition.x - markerOnlyDisplayPosition.x;
  const deltaY = markerOnlyTargetPosition.y - markerOnlyDisplayPosition.y;
  const distance = Math.hypot(deltaX, deltaY);
  const isFastMovement = distance >= MARKER_ONLY_FAST_DISTANCE;
  const lerpFactor = isFastMovement ? MARKER_ONLY_RENDER_LERP_FAST : MARKER_ONLY_RENDER_LERP;
  const snapDistance = isFastMovement ? MARKER_ONLY_RENDER_SNAP_FAST : MARKER_ONLY_RENDER_SNAP;

  if (distance <= snapDistance) {
    markerOnlyDisplayPosition = { ...markerOnlyTargetPosition };
    scheduleMarkerOnlyCanvasDraw();
    markerOnlyAnimationFrame = null;
    return;
  }

  markerOnlyDisplayPosition = {
    x: markerOnlyDisplayPosition.x + (deltaX * lerpFactor),
    y: markerOnlyDisplayPosition.y + (deltaY * lerpFactor),
  };

  scheduleMarkerOnlyCanvasDraw();
  markerOnlyAnimationFrame = requestAnimationFrame(animateMarkerOnlyCanvas);
}

function drawMarkerOnlyCanvas() {
  if (!markerOnlyCanvas || !map) {
    return;
  }

  const rect = markerOnlyCanvas.getBoundingClientRect();
  const width = Math.max(1, Math.round(rect.width));
  const height = Math.max(1, Math.round(rect.height));
  const dpr = window.devicePixelRatio || 1;

  if (markerOnlyCanvas.width !== Math.round(width * dpr) || markerOnlyCanvas.height !== Math.round(height * dpr)) {
    markerOnlyCanvas.width = Math.round(width * dpr);
    markerOnlyCanvas.height = Math.round(height * dpr);
  }

  const ctx = markerOnlyCanvas.getContext('2d');
  if (!ctx) {
    return;
  }

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);

  if (!isMarkerOnlyMode) {
    return;
  }

  const displayPosition = markerOnlyDisplayPosition || markerOnlyTargetPosition || playerPosition;
  if (!displayPosition) {
    return;
  }

  const displayPixel = gameToPixel(displayPosition.x, displayPosition.y);
  const centerX = width / 2;
  const centerY = height / 2;

  const now = Date.now();
  const nearestEntry = !activeRoute && nearestMarkerEnabled
    ? findNearestActiveMarkerEntry(displayPosition.x, displayPosition.y)
    : null;
  let nearestDrawPoint = null;
  const routeToDraw = activeRoute || routePreview;
  const visibleRoutePoints = activeRoute
    ? routeToDraw?.points?.slice(Math.max(0, activeRoute.currentIndex))
    : routeToDraw?.points;
  const routePreviewPoints = visibleRoutePoints?.map((point) => {
    const routePixel = gameToPixel(point.x, point.y);
    return {
      x: centerX + ((routePixel.x - displayPixel.x) * MARKER_ONLY_SCALE),
      y: centerY - ((routePixel.y - displayPixel.y) * MARKER_ONLY_SCALE),
    };
  }) || [];
  const routeGuidePoint = activeRoute?.points?.[activeRoute.currentIndex] || null;
  let routeGuideDrawPoint = null;

  if (nearestEntry) {
    const nearestPixel = gameToPixel(nearestEntry.x, nearestEntry.y);
    nearestDrawPoint = {
      x: centerX + ((nearestPixel.x - displayPixel.x) * MARKER_ONLY_SCALE),
      y: centerY - ((nearestPixel.y - displayPixel.y) * MARKER_ONLY_SCALE),
      distance: Math.round(Math.hypot(nearestEntry.x - displayPosition.x, nearestEntry.y - displayPosition.y)),
    };
  }

  if (routePreviewPoints.length > 1) {
    ctx.save();
    ctx.strokeStyle = 'rgba(125, 182, 255, 0.5)';
    ctx.lineWidth = 3;
    ctx.setLineDash([4, 8]);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(routePreviewPoints[0].x, routePreviewPoints[0].y);
    for (let index = 1; index < routePreviewPoints.length; index += 1) {
      ctx.lineTo(routePreviewPoints[index].x, routePreviewPoints[index].y);
    }
    ctx.stroke();
    ctx.restore();
  }

  if (routeGuidePoint) {
    const guidePixel = gameToPixel(routeGuidePoint.x, routeGuidePoint.y);
    routeGuideDrawPoint = {
      x: centerX + ((guidePixel.x - displayPixel.x) * MARKER_ONLY_SCALE),
      y: centerY - ((guidePixel.y - displayPixel.y) * MARKER_ONLY_SCALE),
      distance: Math.round(Math.hypot(routeGuidePoint.x - displayPosition.x, routeGuidePoint.y - displayPosition.y)),
    };
  }

  const navigationPoint = routeGuideDrawPoint || nearestDrawPoint;

  if (navigationPoint) {
    ctx.save();
    ctx.strokeStyle = 'rgba(156, 247, 190, 0.88)';
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 8]);
    ctx.lineCap = 'round';
    ctx.shadowColor = 'rgba(156, 247, 190, 0.2)';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(navigationPoint.x, navigationPoint.y);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.font = '700 12px Segoe UI';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const distanceLabel = `${navigationPoint.distance}m`;
    const textWidth = ctx.measureText(distanceLabel).width;
    const badgeWidth = Math.max(44, textWidth + 14);
    const badgeHeight = 20;
    const badgeX = centerX - (badgeWidth / 2);
    const badgeY = centerY - 34;
    ctx.fillStyle = 'rgba(10, 15, 19, 0.92)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, badgeWidth, badgeHeight, 999);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#d8e3e8';
    ctx.fillText(distanceLabel, centerX, badgeY + (badgeHeight / 2) + 0.5);
    ctx.restore();
  }

  const visibleEntries = queryVisibleMarkerEntriesForMarkerOnly(displayPosition, width, height);
  for (const entry of visibleEntries) {
    if (!activeOreFilters.has(entry.key)) {
      continue;
    }

    const iconImage = getMarkerIconImage(entry.marker);
    ctx.fillStyle = entry.color;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = 1;

    const markerPixel = entry.pixel;
    const drawX = centerX + ((markerPixel.x - displayPixel.x) * MARKER_ONLY_SCALE);
    const drawY = centerY - ((markerPixel.y - displayPixel.y) * MARKER_ONLY_SCALE);

    if (
      drawX < -MARKER_ONLY_CULL_MARGIN || drawX > width + MARKER_ONLY_CULL_MARGIN
      || drawY < -MARKER_ONLY_CULL_MARGIN || drawY > height + MARKER_ONLY_CULL_MARGIN
    ) {
      continue;
    }

    const cooldownLabel = isMarkerOnCooldown(entry.id, now)
      ? formatCooldownLabel(getMarkerCooldownRemainingMs(entry.id, now))
      : null;

    if (iconImage.complete && iconImage.naturalWidth > 0) {
      const sprite = getMarkerOnlySprite(entry.marker, Boolean(cooldownLabel));
      if (sprite) {
        ctx.drawImage(sprite.canvas, drawX - sprite.halfWidth, drawY - sprite.halfHeight);
      }
    } else {
      ctx.beginPath();
      ctx.arc(drawX, drawY, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    if (cooldownLabel) {
      ctx.save();
      ctx.font = '700 12px Segoe UI';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const textWidth = ctx.measureText(cooldownLabel).width;
      const badgeWidth = Math.max(44, textWidth + 14);
      const badgeHeight = 20;
      const badgeX = drawX - (badgeWidth / 2);
      const badgeY = drawY - (MARKER_ONLY_ICON_SIZE / 2) - 18;
      ctx.fillStyle = 'rgba(10, 15, 19, 0.92)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(badgeX, badgeY, badgeWidth, badgeHeight, 999);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#d8e3e8';
      ctx.fillText(cooldownLabel, drawX, badgeY + (badgeHeight / 2) + 0.5);
      ctx.restore();
    }
  }
}

function getMarkerOnlySprite(marker, disabled) {
  const cacheKey = `${marker.key}:${disabled ? 'disabled' : 'normal'}`;
  if (markerOnlySpriteCache.has(cacheKey)) {
    return markerOnlySpriteCache.get(cacheKey);
  }

  const iconImage = getMarkerIconImage(marker);
  if (!iconImage.complete || iconImage.naturalWidth <= 0) {
    return null;
  }

  const iconSize = MARKER_ONLY_ICON_SIZE;
  const padding = 16;
  const canvas = document.createElement('canvas');
  canvas.width = iconSize + (padding * 2);
  canvas.height = iconSize + (padding * 2);
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return null;
  }

  const x = padding;
  const y = padding;

  if (disabled) {
    ctx.save();
    ctx.filter = 'grayscale(1) saturate(0.12) brightness(0.92)';
    ctx.globalAlpha = 0.32;
    ctx.shadowColor = 'rgba(0, 0, 0, 1)';
    ctx.shadowBlur = 3;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.drawImage(iconImage, x, y, iconSize, iconSize);
    ctx.restore();

    ctx.save();
    ctx.filter = 'grayscale(1) saturate(0.12) brightness(0.92)';
    ctx.globalAlpha = 0.32;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.82)';
    ctx.shadowBlur = 11;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 3;
    ctx.drawImage(iconImage, x, y, iconSize, iconSize);
    ctx.restore();

    ctx.save();
    ctx.filter = 'grayscale(1) saturate(0.12) brightness(0.92)';
    ctx.globalAlpha = 0.32;
    ctx.drawImage(iconImage, x, y, iconSize, iconSize);
    ctx.restore();

    ctx.save();
    ctx.fillStyle = 'rgba(14, 18, 22, 0.42)';
    ctx.beginPath();
    ctx.arc(x + (iconSize / 2), y + (iconSize / 2), (iconSize / 2) - 1, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else {
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 1)';
    ctx.shadowBlur = 3;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.drawImage(iconImage, x, y, iconSize, iconSize);
    ctx.restore();

    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.72)';
    ctx.shadowBlur = 9;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 3;
    ctx.drawImage(iconImage, x, y, iconSize, iconSize);
    ctx.restore();

    ctx.drawImage(iconImage, x, y, iconSize, iconSize);
  }

  const sprite = {
    canvas,
    halfWidth: canvas.width / 2,
    halfHeight: canvas.height / 2,
  };
  markerOnlySpriteCache.set(cacheKey, sprite);
  return sprite;
}
function updateOpacityLabel(value) {
  [opacityButton].forEach((button) => {
    if (button) {
      button.textContent = `${value}%`;
    }
  });
  [opacitySlider].forEach((slider) => {
    if (slider) {
      slider.value = value.toString();
    }
  });
}

function toggleOpacityPopover(popover) {
  if (!popover) {
    return;
  }

  popover.hidden = !popover.hidden;
}

function hideOpacityPopovers() {
  [opacityPopover].forEach((popover) => {
    if (popover) {
      popover.hidden = true;
    }
  });
}

function saveUiSettings(patch) {
  uiSettings = {
    ...(uiSettings || {}),
    ...patch,
  };
  window.livemapApi.setUiSettings(patch);
}

function getCurrentViewKey() {
  return isMarkerOnlyMode ? 'markerView' : 'normalView';
}

function getViewSettings(viewKey = getCurrentViewKey()) {
  return uiSettings?.[viewKey] || {};
}

function saveCurrentViewSettings(patch) {
  const viewKey = getCurrentViewKey();
  const nextViewSettings = {
    ...getViewSettings(viewKey),
    ...patch,
  };
  saveUiSettings({ [viewKey]: nextViewSettings });
}

function saveSharedFilterState() {
  const filterPatch = {
    activeOreFilters: Array.from(activeOreFilters),
    lastActiveFiltersByCategory: categoryFilterMemory,
  };

  saveUiSettings({
    normalView: {
      ...getViewSettings('normalView'),
      ...filterPatch,
    },
    markerView: {
      ...getViewSettings('markerView'),
      ...filterPatch,
    },
  });
}

async function applyCurrentViewSettings() {
  const viewSettings = getViewSettings();
  const allCooldowns = getStoredCooldownsByChannel();
  const cleanedCooldownsByChannel = {};
  const now = Date.now();

  for (const [channelKey, channelCooldowns] of Object.entries(allCooldowns)) {
    const nextChannelCooldowns = Object.fromEntries(
      Object.entries(channelCooldowns || {}).filter(([, expiresAt]) => Number(expiresAt) > now),
    );
    if (Object.keys(nextChannelCooldowns).length > 0) {
      cleanedCooldownsByChannel[channelKey] = nextChannelCooldowns;
    }
  }

  if (JSON.stringify(allCooldowns) !== JSON.stringify(cleanedCooldownsByChannel)) {
    saveUiSettings({
      markerCooldownsByChannel: cleanedCooldownsByChannel,
    });
  }

  activeOreFilters = new Set(
    viewSettings.activeOreFilters?.length ? viewSettings.activeOreFilters : getMarkerEntries().map((marker) => marker.key),
  );
  nearestMarkerEnabled = getSharedNearestMarkerEnabled();
  categoryFilterMemory = { ...(viewSettings.lastActiveFiltersByCategory || {}) };
  if (activeRoute && routeFilterOverrideBackup) {
    applyRouteFilterOverride();
  }
  openLegendCategory = null;
  renderLegend();
  syncOreLayers();
  scheduleMarkerOnlyCanvasDraw();
  updateNearestMarkerButtonState();
  refreshNearestMarkerLine();

  if (typeof viewSettings.windowOpacity === 'number') {
    const appliedOpacity = await window.livemapApi.setWindowOpacity(viewSettings.windowOpacity);
    updateOpacityLabel(appliedOpacity);
  }
}

function gameToPixel(x, z) {
  return {
    x: ORIGIN_PIXEL.x + (x / METERS_PER_PIXEL_X),
    y: ORIGIN_PIXEL.y + (z / METERS_PER_PIXEL_Z),
  };
}

function gameToLatLng(x, z) {
  const pixel = gameToPixel(x, z);
  return L.latLng(pixel.y, pixel.x);
}

function oreToLatLng(x, y) {
  return gameToLatLng(x, y);
}

function playerToLatLng(x, y) {
  return gameToLatLng(x - MAP_CENTER_OFFSET.x, y - MAP_CENTER_OFFSET.z);
}

function createTileBounds(row, column) {
  const left = column * TILE_PIXEL_WIDTH;
  const top = row * TILE_PIXEL_HEIGHT;
  const right = Math.min(left + TILE_PIXEL_WIDTH, IMAGE_WIDTH);
  const bottom = Math.min(top + TILE_PIXEL_HEIGHT, IMAGE_HEIGHT);
  return [[top, left], [bottom, right]];
}

function addTileOverlays() {
  tileOverlays = [];
  for (let row = 0; row < TILE_ROWS; row += 1) {
    for (let column = 0; column < TILE_COLUMNS; column += 1) {
      const sourceRow = TILE_ROWS - 1 - row;
      const overlay = L.imageOverlay(
        `map/tiles/0/${sourceRow}/${column}.png`,
        createTileBounds(row, column),
        { interactive: false, opacity: 1 }
      ).addTo(map);
      tileOverlays.push(overlay);
    }
  }
}

function setTileVisibility(visible) {
  if (!map) {
    return;
  }

  for (const overlay of tileOverlays) {
    if (visible && !map.hasLayer(overlay)) {
      overlay.addTo(map);
    }

    if (!visible && map.hasLayer(overlay)) {
      map.removeLayer(overlay);
    }
  }
}

function initMap() {
  const bounds = L.latLngBounds([0, 0], [IMAGE_HEIGHT, IMAGE_WIDTH]);

  map = L.map('map', {
    crs: L.CRS.Simple,
    minZoom: -3.8,
    maxZoom: 2.6,
    zoomControl: true,
    zoomSnap: 0.1,
    zoomDelta: 0.1,
    wheelDebounceTime: 40,
    wheelPxPerZoomLevel: 90,
    preferCanvas: true,
    inertia: true,
    maxBoundsViscosity: 1.0,
    renderer: L.canvas({ padding: 0.4 }),
  });

  addTileOverlays();
  map.fitBounds(bounds);
  map.setMaxBounds(bounds);
}

function buildOreLayers() {
  oreLayers = new Map();
  markerOnlyOreLayers = new Map();
  markerSpatialIndex = new Map();
  markerEntriesById = new Map();
  markerLeafletMarkers = new Map();
  markerDwellStarts = new Map();
  const canvasRenderer = L.canvas({ padding: 0.4 });

  for (const marker of getMarkerEntries()) {
    const color = getMarkerColor(marker);
    const paneName = getMarkerPaneName(marker.key);
    ensureMarkerPane(marker.key);
    const layer = L.markerClusterGroup({
      showCoverageOnHover: false,
      spiderfyOnMaxZoom: true,
      removeOutsideVisibleBounds: true,
      disableClusteringAtZoom: 1,
      maxClusterRadius: 80,
      clusterPane: paneName,
      iconCreateFunction(cluster) {
        return L.divIcon({
          className: 'ore-cluster-icon',
          html: `
            <div class="ore-cluster-badge" style="--cluster-color:${color}">
              <img class="ore-cluster-image" src="${getMarkerIconPath(marker)}" alt="">
              <span>${cluster.getChildCount()}</span>
            </div>
          `,
          iconSize: [38, 38],
        });
        },
      });
    const markerOnlyLayer = L.layerGroup();

    marker.coordinates.forEach(([x, y], index) => {
      const markerId = getMarkerCoordinateId(marker.key, index);
      const markerEntry = {
        id: markerId,
        key: marker.key,
        marker,
        color,
        x,
        y,
        pixel: gameToPixel(x, y),
      };
      markerEntriesById.set(markerId, markerEntry);
      addMarkerEntryToSpatialIndex(markerEntry);
      const latLng = oreToLatLng(x, y);
      const popup = `
        <div class="map-popup">
          <div class="map-popup-title">${formatMarkerLabel(marker.name)}</div>
          <div class="map-popup-row"><span>X</span><strong>${x.toFixed(2)}</strong></div>
          <div class="map-popup-row"><span>Y</span><strong>${y.toFixed(2)}</strong></div>
        </div>
      `;

      const leafletMarker = L.marker(latLng, {
        pane: paneName,
        icon: createMarkerIcon(marker, color),
      })
        .bindPopup(
          popup,
          { autoPan: true, className: 'map-popup-shell' }
        )
        .addTo(layer);
      markerLeafletMarkers.set(markerId, { leafletMarker, marker, color });

      L.circleMarker(latLng, {
        pane: paneName,
        radius: 4,
        color,
        weight: 1,
        fillColor: color,
        fillOpacity: 0.95,
        renderer: canvasRenderer,
      })
        .bindPopup(popup, { autoPan: true, className: 'map-popup-shell' })
        .addTo(markerOnlyLayer);
    });

    oreLayers.set(marker.key, layer);
    markerOnlyOreLayers.set(marker.key, markerOnlyLayer);
  }
}

function syncOreLayers() {
  const activeLayerMap = isMarkerOnlyMode ? markerOnlyOreLayers : oreLayers;
  const inactiveLayerMap = isMarkerOnlyMode ? oreLayers : markerOnlyOreLayers;

  for (const layer of inactiveLayerMap.values()) {
    if (map.hasLayer(layer)) {
      map.removeLayer(layer);
    }
  }

  for (const [oreName, layer] of activeLayerMap.entries()) {
    const shouldShow = activeOreFilters.has(oreName);
    const isShown = map.hasLayer(layer);

    if (shouldShow && !isShown) {
      showMarkerLayer(oreName, layer);
    }

    if (!shouldShow && isShown) {
      hideMarkerLayer(oreName, layer);
    }
  }

  scheduleMarkerOnlyCanvasDraw();
}

function renderLegend() {
  legend.innerHTML = '';
  if (markerOnlyFiltersElement) {
    markerOnlyFiltersElement.innerHTML = '';
  }
  if (legendOverlayRoot) {
    legendOverlayRoot.innerHTML = '';
    legendOverlayRoot.hidden = true;
  }

  const groups = getCategoryGroups();
  const categoryMenu = document.createElement('div');
  categoryMenu.className = 'legend-category-menu';

  for (const group of groups) {
    const categoryButton = createCategoryButton(group);
    categoryMenu.appendChild(categoryButton);

    if (markerOnlyFiltersElement) {
      markerOnlyFiltersElement.appendChild(createCategoryButton(group, { compact: true }));
    }
  }

  if (markerOnlyFiltersElement) {
    markerOnlyFiltersElement.appendChild(createMarkerOnlyNearestButton());
    markerOnlyFiltersElement.appendChild(createMarkerOnlyRoutePlannerButton());
  }

  categoryMenu.addEventListener('mouseleave', () => {
    if (openLegendCategory) {
      scheduleLegendMenuClose();
    }
  });
  categoryMenu.addEventListener('mouseenter', cancelLegendMenuClose);
  if (markerOnlyFiltersElement) {
    markerOnlyFiltersElement.addEventListener('mouseleave', () => {
      if (openLegendCategory) {
        scheduleLegendMenuClose();
      }
    });
    markerOnlyFiltersElement.addEventListener('mouseenter', cancelLegendMenuClose);
  }
  legend.appendChild(categoryMenu);
  updateNearestMarkerButtonState();

  const activeGroup = groups.find((group) => group.category === openLegendCategory);
  if (!activeGroup) {
    return;
  }

  const anchorButton = isMarkerOnlyMode
    ? markerOnlyFiltersElement?.querySelector(`.marker-only-filter-button[data-category="${activeGroup.category}"]`)
    : legend.querySelector(`.legend-category-button[data-category="${activeGroup.category}"]`);
  if (!anchorButton || !legendOverlayRoot) {
    return;
  }

  const anchorRect = anchorButton.getBoundingClientRect();
  const items = document.createElement('div');
  items.className = 'legend-overlay-menu';
  if (isMarkerOnlyMode) {
    items.dataset.align = 'right';
    items.style.left = `${anchorRect.right + 10}px`;
    items.style.top = `${anchorRect.top + (anchorRect.height / 2)}px`;
  } else {
    items.style.left = `${anchorRect.left + (anchorRect.width / 2)}px`;
    items.style.top = `${anchorRect.top - 10}px`;
  }
  items.addEventListener('mouseenter', cancelLegendMenuClose);
  items.addEventListener('mouseleave', scheduleLegendMenuClose);

  const itemsTitle = document.createElement('div');
  itemsTitle.className = 'legend-overlay-title';
  itemsTitle.textContent = activeGroup.label;
  items.appendChild(itemsTitle);

  const itemsBody = document.createElement('div');
  itemsBody.className = 'legend-group-items';

  for (const marker of activeGroup.markers) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'legend-item';
      button.dataset.ore = marker.key;
      button.dataset.active = activeOreFilters.has(marker.key) ? 'true' : 'false';
      button.innerHTML = `${createFilterIconHtml(marker, getMarkerColor(marker))}<span class="legend-item-label">${formatMarkerLabel(marker.name)}</span>`;
      button.addEventListener('click', (event) => {
        event.stopPropagation();
        if (activeRoute) {
          return;
        }
        if (activeOreFilters.has(marker.key)) {
        activeOreFilters.delete(marker.key);
      } else {
        activeOreFilters.add(marker.key);
      }

      categoryFilterMemory[activeGroup.category] = getActiveCategoryKeys(activeGroup);

      syncOreLayers();
      renderLegend();
      saveFilterState();
    });
    itemsBody.appendChild(button);
  }

  items.appendChild(itemsBody);
  legendOverlayRoot.appendChild(items);
  legendOverlayRoot.hidden = false;

  requestAnimationFrame(() => {
    const overlayRect = items.getBoundingClientRect();
    if (items.dataset.align !== 'right' && overlayRect.left < 8) {
      const currentLeft = Number.parseFloat(items.style.left || '0');
      items.style.left = `${currentLeft + (8 - overlayRect.left)}px`;
    }
  });
}

function setStatusPill(element, label, tone) {
  element.dataset.tone = tone;
  element.innerHTML = `<span class="status-dot"></span><span class="status-label">${label}</span>`;
}

function renderUpdaterState(nextState) {
  updaterState = nextState || null;
  if (!updateToast || !updateToastMessage || !updaterState) {
    return;
  }

  const visibleStates = new Set(['checking', 'downloading', 'ready', 'error']);
  updateToast.hidden = !visibleStates.has(updaterState.status);
  updateToast.dataset.state = updaterState.status || 'idle';
  updateToastMessage.textContent = updaterState.message || 'Updater bereit';

  if (updateToastInstallButton) {
    updateToastInstallButton.hidden = updaterState.status !== 'ready';
  }
}

function renderStartupUpdaterState(state) {
  if (!startupUpdater || !startupUpdaterTitle || !startupUpdaterMessage || !startupUpdaterBarFill) {
    return;
  }

  const status = state?.status || 'checking';
  const shouldShowPatchActions = status === 'ready'
    && Boolean(state?.latestCommit)
    && state?.currentCommit !== state?.latestCommit;
  startupUpdater.dataset.state = status;
  const currentVersion = state?.currentCommit ? state.currentCommit.slice(0, 7) : 'lokal';
  const nextVersion = state?.latestCommit ? state.latestCommit.slice(0, 7) : '-';

  if (startupUpdaterVersion) {
    startupUpdaterVersion.hidden = !(state?.currentCommit || state?.latestCommit);
    startupUpdaterVersion.innerHTML = `<strong>${currentVersion}</strong> → <strong>${nextVersion}</strong>`;
  }

  if (startupUpdaterCommit) {
    startupUpdaterCommit.hidden = !state?.latestMessage;
    startupUpdaterCommit.innerHTML = state?.latestMessage
      ? `<strong>Commit:</strong> ${state.latestMessage}`
      : '';
  }

  const setStartupStatusText = (text) => {
    if (startupUpdaterStatusValue) {
      startupUpdaterStatusValue.textContent = text;
    }
  };

  if (startupUpdaterActions) {
    startupUpdaterActions.hidden = !shouldShowPatchActions;
  }
  if (startupUpdaterPatchButton) {
    startupUpdaterPatchButton.hidden = !shouldShowPatchActions;
  }
  if (startupUpdaterExitButton) {
    startupUpdaterExitButton.hidden = !shouldShowPatchActions;
  }

  if (status === 'ready') {
    startupUpdaterTitle.textContent = 'Update verfügbar';
    startupUpdaterMessage.textContent = 'Ein neuer Patch wurde gefunden. Du musst jetzt patchen oder die App beenden.';
    startupUpdaterBarFill.style.width = '100%';
    setStartupStatusText('Patch wurde vorbereitet und wartet auf deine Aktion.');
    if (startupUpdaterProgressLabel) {
      startupUpdaterProgressLabel.textContent = 'Patch bereit';
    }
    return;
  }

  if (status === 'up-to-date') {
    startupUpdaterTitle.textContent = 'Kein Update verfügbar';
    startupUpdaterMessage.textContent = 'Die Livemap ist aktuell. Starte Overlay...';
    startupUpdaterBarFill.style.width = '100%';
    setStartupStatusText('Kein neuer Commit gefunden.');
    if (startupUpdaterProgressLabel) {
      startupUpdaterProgressLabel.textContent = 'Kein Patch nötig';
    }
    return;
  }

  if (status === 'error') {
    startupUpdaterTitle.textContent = 'Updateprüfung fehlgeschlagen';
    startupUpdaterMessage.textContent = 'Die Livemap startet jetzt mit dem lokalen Stand.';
    startupUpdaterBarFill.style.width = '100%';
    setStartupStatusText('Patch-Prüfung fehlgeschlagen. Lokaler Stand wird verwendet.');
    if (startupUpdaterProgressLabel) {
      startupUpdaterProgressLabel.textContent = 'Lokalen Stand verwenden';
    }
    return;
  }

  if (status === 'downloading') {
    startupUpdaterTitle.textContent = 'Update wird vorbereitet';
    startupUpdaterMessage.textContent = state?.message || 'Patch wird heruntergeladen und vorbereitet...';
    startupUpdaterBarFill.style.width = '72%';
    setStartupStatusText('Archiv wird von GitHub geladen und vorbereitet.');
    if (startupUpdaterProgressLabel) {
      startupUpdaterProgressLabel.textContent = 'Patch wird geladen';
    }
    return;
  }

  startupUpdaterTitle.textContent = 'Prüfe auf Updates';
  startupUpdaterMessage.textContent = state?.message || 'Bitte kurz warten...';
  startupUpdaterBarFill.style.width = '28%';
  setStartupStatusText('GitHub-Stand wird geprüft.');
  if (startupUpdaterProgressLabel) {
    startupUpdaterProgressLabel.textContent = 'Prüfung läuft';
  }
}

function showStartupUpdater() {
  if (!startupUpdater) {
    return;
  }

  startupUpdater.hidden = false;
  requestAnimationFrame(() => {
    startupUpdater.dataset.visible = 'true';
  });
}

async function hideStartupUpdater() {
  if (!startupUpdater) {
    return;
  }

  delete startupUpdater.dataset.visible;
  await wait(220);
  startupUpdater.hidden = true;
}

async function runStartupUpdaterGate() {
  startupUpdaterStartedAt = Date.now();
  showStartupUpdater();
  const initialState = await window.livemapApi.getUpdaterState();
  renderStartupUpdaterState(initialState);

  const waitForStartupUpdaterMinimum = async () => {
    const elapsed = Date.now() - startupUpdaterStartedAt;
    const remaining = Math.max(0, 5000 - elapsed);
    if (remaining > 0) {
      await wait(remaining);
    }
  };

  if (initialState?.status === 'ready') {
    await waitForStartupUpdaterMinimum();
    renderStartupUpdaterState(initialState);
    return new Promise((resolve) => {
      const patchNow = async () => {
        if (startupUpdaterResolved) {
          return;
        }
        startupUpdaterResolved = true;
        startupUpdater.dataset.state = 'installing';
        startupUpdaterTitle.textContent = 'Patch wird installiert';
        startupUpdaterMessage.textContent = 'Die Livemap wird gleich geschlossen, aktualisiert und neu gestartet.';
        startupUpdaterBarFill.style.width = '100%';
        if (startupUpdaterStatusValue) {
          startupUpdaterStatusValue.textContent = 'Patchskript wird gestartet.';
        }
        if (startupUpdaterProgressLabel) {
          startupUpdaterProgressLabel.textContent = 'Patch läuft';
        }
        await wait(250);
        if (startupUpdaterStatusValue) {
          startupUpdaterStatusValue.textContent = 'Livemap wird beendet.';
        }
        await wait(250);
        if (startupUpdaterStatusValue) {
          startupUpdaterStatusValue.textContent = 'Dateien werden ersetzt und die App wird neu gestartet.';
        }
        await window.livemapApi.installUpdateNow();
        resolve(false);
      };

      const exitApp = async () => {
        if (startupUpdaterResolved) {
          return;
        }
        startupUpdaterResolved = true;
        await window.livemapApi.closeWindowSkipUpdate();
        resolve(false);
      };

      startupUpdaterPatchButton?.addEventListener('click', () => { void patchNow(); }, { once: true });
      startupUpdaterExitButton?.addEventListener('click', () => { void exitApp(); }, { once: true });
    });
  }

  if (initialState?.status === 'up-to-date') {
    startupUpdaterResolved = true;
    await waitForStartupUpdaterMinimum();
    await hideStartupUpdater();
    return true;
  }

  if (initialState?.status === 'error') {
    startupUpdaterResolved = true;
    await waitForStartupUpdaterMinimum();
    await hideStartupUpdater();
    return true;
  }

  return new Promise((resolve) => {
    const handleState = async (state) => {
      if (startupUpdaterResolved) {
        return;
      }

      renderStartupUpdaterState(state);
      if (state?.status === 'ready') {
        await waitForStartupUpdaterMinimum();
        renderStartupUpdaterState(state);
        startupUpdaterPatchButton?.addEventListener('click', async () => {
          if (startupUpdaterResolved) {
            return;
          }
          startupUpdaterResolved = true;
          startupUpdater.dataset.state = 'installing';
          startupUpdaterTitle.textContent = 'Patch wird installiert';
          startupUpdaterMessage.textContent = 'Die Livemap wird gleich geschlossen, aktualisiert und neu gestartet.';
          startupUpdaterBarFill.style.width = '100%';
          if (startupUpdaterStatusValue) {
            startupUpdaterStatusValue.textContent = 'Patchskript wird gestartet.';
          }
          if (startupUpdaterProgressLabel) {
            startupUpdaterProgressLabel.textContent = 'Patch läuft';
          }
          await wait(250);
          if (startupUpdaterStatusValue) {
            startupUpdaterStatusValue.textContent = 'Livemap wird beendet.';
          }
          await wait(250);
          if (startupUpdaterStatusValue) {
            startupUpdaterStatusValue.textContent = 'Dateien werden ersetzt und die App wird neu gestartet.';
          }
          await window.livemapApi.installUpdateNow();
          resolve(false);
        }, { once: true });
        startupUpdaterExitButton?.addEventListener('click', async () => {
          if (startupUpdaterResolved) {
            return;
          }
          startupUpdaterResolved = true;
          await window.livemapApi.closeWindowSkipUpdate();
          resolve(false);
        }, { once: true });
        return;
      }

      if (state?.status === 'up-to-date' || state?.status === 'error') {
        startupUpdaterResolved = true;
        await waitForStartupUpdaterMinimum();
        await hideStartupUpdater();
        resolve(true);
      }
    };

    window.livemapApi.onUpdaterState((state) => {
      void handleState(state);
    });
  });
}

function setChannelStatus(port) {
  const channel = CHANNEL_BY_PORT[port] || { label: 'CH ?', state: 'normal' };
  if (port && Number(port) !== currentChannelPort) {
    loadCooldownsForChannel(port);
  }
  channelStatusElement.dataset.state = channel.state;
  setStatusPill(channelStatusElement, channel.label, 'channel');
}

function setLiveStatus(label, state) {
  [liveStatusElement, compactLiveStatusElement].forEach((element) => {
    if (!element) {
      return;
    }

    element.dataset.state = state;
    setStatusPill(element, label, 'live');
  });
}

function updateInventoryPanel(data) {
  if (!inventoryUsageTopElement || !inventoryUsageElement) {
    return;
  }

  const usageValue = Number(data.usage);
  if (!Number.isFinite(usageValue) || usageValue < 0 || usageValue > 200) {
    return;
  }

  lastValidInventoryUsage = usageValue;
  const roundedUsage = Math.round(lastValidInventoryUsage);
  const usageLabel = `${roundedUsage}%`;
  let inventoryTone = 'normal';

  if (roundedUsage >= 150) {
    inventoryTone = 'danger';
  } else if (roundedUsage >= 125) {
    inventoryTone = 'high';
  } else if (roundedUsage >= 100) {
    inventoryTone = 'warn';
  }

  inventoryPanel.dataset.tone = inventoryTone;
  inventoryUsageTopElement.textContent = usageLabel;
  inventoryUsageElement.textContent = 'Gewicht';
  if (compactInventoryUsageTopElement) {
    compactInventoryUsageTopElement.textContent = usageLabel;
  }
  if (compactInventoryPanelElement) {
    compactInventoryPanelElement.dataset.tone = inventoryTone;
    compactInventoryPanelElement.hidden = false;
  }
}

function setPlayerMarkerVisibility(visible) {
  if (!playerMarker || !map) {
    return;
  }

  if (visible) {
    if (!map.hasLayer(playerMarker)) {
      playerMarker.addTo(map);
    }
    return;
  }

  if (map.hasLayer(playerMarker)) {
    map.removeLayer(playerMarker);
  }
  if (playerDistanceBadge && map.hasLayer(playerDistanceBadge)) {
    map.removeLayer(playerDistanceBadge);
  }
}

function ensurePlayerMarker() {
  if (playerMarker) {
    return;
  }

  playerMarker = L.marker([0, 0], {
    interactive: false,
    icon: L.divIcon({
      className: 'player-marker-wrap',
      html: '<div class="player-marker-glow"></div><div class="player-marker-core"></div>',
      iconSize: [60, 60],
      iconAnchor: [30, 30],
    }),
  });

  if (!isMarkerOnlyMode) {
    playerMarker.addTo(map);
  }
}

function stopPlayerMarkerAnimation() {
  if (markerAnimationFrame) {
    cancelAnimationFrame(markerAnimationFrame);
    markerAnimationFrame = null;
  }
}

function animatePlayerMarker() {
  if (!playerMarker || !currentPlayerLatLng || !targetPlayerLatLng) {
    markerAnimationFrame = null;
    return;
  }

  const latDelta = targetPlayerLatLng.lat - currentPlayerLatLng.lat;
  const lngDelta = targetPlayerLatLng.lng - currentPlayerLatLng.lng;
  const distance = Math.hypot(latDelta, lngDelta);

  if (distance <= PLAYER_RENDER_SNAP) {
    currentPlayerLatLng = targetPlayerLatLng;
    playerMarker.setLatLng(currentPlayerLatLng);
    markerAnimationFrame = null;
    return;
  }

  currentPlayerLatLng = L.latLng(
    currentPlayerLatLng.lat + (latDelta * PLAYER_RENDER_LERP),
    currentPlayerLatLng.lng + (lngDelta * PLAYER_RENDER_LERP),
  );
  playerMarker.setLatLng(currentPlayerLatLng);
  markerAnimationFrame = requestAnimationFrame(animatePlayerMarker);
}

function updatePlayerMarker(data) {
  const nextPosition = data;
  playerPosition = nextPosition;
  processMarkerProximity(nextPosition);
  ensurePlayerMarker();

  if (!playerMarker) {
    return;
  }

  targetPlayerLatLng = playerToLatLng(nextPosition.x, nextPosition.y);
  if (isMarkerOnlyMode) {
    stopPlayerMarkerAnimation();
    currentPlayerLatLng = targetPlayerLatLng;
    playerMarker.setLatLng(currentPlayerLatLng);
    markerOnlyTargetPosition = { x: nextPosition.x, y: nextPosition.y };
    if (!markerOnlyDisplayPosition) {
      markerOnlyDisplayPosition = { ...markerOnlyTargetPosition };
      scheduleMarkerOnlyCanvasDraw();
    } else if (!markerOnlyAnimationFrame) {
      markerOnlyAnimationFrame = requestAnimationFrame(animateMarkerOnlyCanvas);
    }
  } else if (!currentPlayerLatLng) {
    currentPlayerLatLng = targetPlayerLatLng;
    playerMarker.setLatLng(currentPlayerLatLng);
  } else if (!markerAnimationFrame) {
    markerAnimationFrame = requestAnimationFrame(animatePlayerMarker);
  }
  setChannelStatus(nextPosition.port);
  setLiveStatus('Live', 'live');
  coordXElement.textContent = Math.round(nextPosition.x).toString();
  coordZElement.textContent = Math.round(nextPosition.y).toString();
  coordYElement.textContent = Math.round(nextPosition.z).toString();
  updateRouteProgress();
  updateRoutePreviewAndGuidance();
  refreshNearestMarkerLine();

  const hasMoved = !lastFollowPosition
    || Math.abs(nextPosition.x - lastFollowPosition.x) > PLAYER_MOVE_EPSILON
    || Math.abs(nextPosition.y - lastFollowPosition.y) > PLAYER_MOVE_EPSILON
    || Math.abs(nextPosition.z - lastFollowPosition.z) > PLAYER_MOVE_EPSILON;
  const shouldRecenterMap = !lastFollowPosition
    || Math.abs(nextPosition.x - lastFollowPosition.x) > MAP_FOLLOW_EPSILON
    || Math.abs(nextPosition.y - lastFollowPosition.y) > MAP_FOLLOW_EPSILON;

  if (!didAutoCenterPlayer || shouldRecenterMap) {
    didAutoCenterPlayer = true;
    map.panTo(targetPlayerLatLng, {
      animate: true,
      duration: 0.16,
      easeLinearity: 0.45,
      noMoveStart: true,
    });
  }

  if (hasMoved) {
    lastFollowPosition = {
      x: nextPosition.x,
      y: nextPosition.y,
      z: nextPosition.z,
    };
  }
}

function centerMapOnPlayer() {
  if (!map || !targetPlayerLatLng) {
    return;
  }

  map.flyTo(targetPlayerLatLng, 2.6, {
    animate: true,
    duration: 1.35,
    easeLinearity: 0.08,
  });
}

function applyMapMode() {
  if (!map) {
    return;
  }

  document.body.classList.toggle('marker-only-mode', isMarkerOnlyMode);
  document.body.classList.toggle('marker-frame-visible', isMarkerOnlyMode && isMarkerFrameVisible);
  setTileVisibility(!isMarkerOnlyMode);
  setPlayerMarkerVisibility(!isMarkerOnlyMode);
  syncOreLayers();

  if (isMarkerOnlyMode) {
    stopPlayerMarkerAnimation();
    markerOnlyTargetPosition = playerPosition ? { x: playerPosition.x, y: playerPosition.y } : null;
    markerOnlyDisplayPosition = markerOnlyTargetPosition ? { ...markerOnlyTargetPosition } : null;
    map.scrollWheelZoom.disable();
    map.doubleClickZoom.disable();
    map.boxZoom.disable();
    map.keyboard.disable();
    map.touchZoom.disable();
  } else {
    stopMarkerOnlyAnimation();
    markerOnlyTargetPosition = null;
    markerOnlyDisplayPosition = null;
    map.scrollWheelZoom.enable();
    map.doubleClickZoom.enable();
    map.boxZoom.enable();
    map.keyboard.enable();
    map.touchZoom.enable();
  }

  map.invalidateSize();
  if (isMarkerOnlyMode) {
    requestAnimationFrame(() => {
      if (!map || !isMarkerOnlyMode) {
        return;
      }

      const nextCenter = targetPlayerLatLng || map.getCenter();
      map.setView(nextCenter, 2.6, { animate: false });
    });
  }
  scheduleMarkerOnlyCanvasDraw();
  updateRoutePreviewAndGuidance();
  refreshNearestMarkerLine();
}

async function toggleMapMode() {
  await runViewTransition(async () => {
    const currentBounds = await window.livemapApi.getWindowBounds();
    const currentFilters = Array.from(activeOreFilters);
    const currentCategoryMemory = { ...categoryFilterMemory };
    saveCurrentViewSettings({
      bounds: currentBounds,
      activeOreFilters: currentFilters,
      lastActiveFiltersByCategory: currentCategoryMemory,
    });
    saveSharedFilterState();
    isMarkerOnlyMode = !isMarkerOnlyMode;
    const targetViewKey = isMarkerOnlyMode ? 'markerView' : 'normalView';
    isMarkerFrameVisible = Boolean(getViewSettings(targetViewKey).frameVisible);

    saveUiSettings({
      markerOnlyMode: isMarkerOnlyMode,
    });
    const nextBounds = getViewSettings(targetViewKey).bounds;
    if (nextBounds) {
      await window.livemapApi.setWindowBounds({ ...nextBounds, viewKey: targetViewKey });
    }
    await applyCurrentViewSettings();
    applyMapMode();
  });
}

function toggleMarkerFrame() {
  if (!isMarkerOnlyMode) {
    return;
  }

  isMarkerFrameVisible = !isMarkerFrameVisible;
  document.body.classList.toggle('marker-frame-visible', isMarkerFrameVisible);
  saveUiSettings({
    markerView: {
      ...getViewSettings('markerView'),
      frameVisible: isMarkerFrameVisible,
    },
  });
}

function computeResizedBounds(bounds, direction, deltaX, deltaY) {
  const nextBounds = { ...bounds };

  if (direction.includes('e')) {
    nextBounds.width = bounds.width + deltaX;
  }
  if (direction.includes('s')) {
    nextBounds.height = bounds.height + deltaY;
  }
  if (direction.includes('w')) {
    nextBounds.x = bounds.x + deltaX;
    nextBounds.width = bounds.width - deltaX;
  }
  if (direction.includes('n')) {
    nextBounds.y = bounds.y + deltaY;
    nextBounds.height = bounds.height - deltaY;
  }

  if (nextBounds.width < 260) {
    if (direction.includes('w')) {
      nextBounds.x -= 260 - nextBounds.width;
    }
    nextBounds.width = 260;
  }

  if (nextBounds.height < 220) {
    if (direction.includes('n')) {
      nextBounds.y -= 220 - nextBounds.height;
    }
    nextBounds.height = 220;
  }

  return nextBounds;
}

async function startResizeSession(direction, event) {
  if (!isMarkerOnlyMode || !isMarkerFrameVisible) {
    return;
  }

  resizeSession = {
    direction,
    startScreenX: event.screenX,
    startScreenY: event.screenY,
    startBounds: await window.livemapApi.getWindowBounds(),
  };
}

async function handleResizeMove(event) {
  if (!resizeSession) {
    return;
  }

  const deltaX = event.screenX - resizeSession.startScreenX;
  const deltaY = event.screenY - resizeSession.startScreenY;
  const nextBounds = computeResizedBounds(
    resizeSession.startBounds,
    resizeSession.direction,
    deltaX,
    deltaY,
  );
  await window.livemapApi.setWindowBounds(nextBounds);
  if (isMarkerOnlyMode && targetPlayerLatLng) {
    scheduleMarkerOnlyCanvasDraw();
  }
}

function stopResizeSession() {
  resizeSession = null;
}

async function bootstrap() {
  try {
    const canContinue = await runStartupUpdaterGate();
    if (!canContinue) {
      return;
    }

    uiSettings = await window.livemapApi.getUiSettings();
    oreData = await window.livemapApi.getOreData();
    isMarkerOnlyMode = Boolean(uiSettings?.markerOnlyMode);
    isMarkerFrameVisible = Boolean(getViewSettings('markerView').frameVisible);

      initMap();
      buildOreLayers();
      ensureMarkerCooldownTimer();
      await applyCurrentViewSettings();

      const oreCount = getMarkerEntries().reduce((sum, marker) => sum + marker.coordinates.length, 0);
    setChannelStatus(null);
    setStatusPill(markerStatusElement, `${oreCount} Marker`, 'marker');
    setLiveStatus('Warten auf spielerkoordinate', 'waiting');
    if (oreCount <= 0) {
      setStatusPill(markerStatusElement, '0 Marker', 'marker');
    }

    window.livemapApi.onPlayerPosition((data) => {
      updatePlayerMarker(data);
    });

      window.livemapApi.onPlayerError((message) => {
        stopPlayerMarkerAnimation();
        stopMarkerOnlyAnimation();
        currentPlayerLatLng = null;
        targetPlayerLatLng = null;
        filteredPlayerPosition = null;
        playerPosition = null;
        markerOnlyTargetPosition = null;
        markerOnlyDisplayPosition = null;
        setLiveStatus('Warten auf spielerkoordinate', 'waiting');
        coordXElement.textContent = '-';
      coordZElement.textContent = '-';
      coordYElement.textContent = '-';
      console.error(message);
    });

    window.livemapApi.onInventoryUpdate((data) => {
      updateInventoryPanel(data);
    });

    window.livemapApi.onInventoryError((message) => {
      console.error(message);
    });

    renderUpdaterState(await window.livemapApi.getUpdaterState());
    window.livemapApi.onUpdaterState((state) => {
      renderUpdaterState(state);
    });

    if (playerCenterButton) {
      playerCenterButton.addEventListener('click', () => {
        centerMapOnPlayer();
      });
    }

    if (findNearestButton) {
      findNearestButton.addEventListener('click', () => {
        toggleNearestMarkerWithRouteGuard();
      });
    }

    if (routePlannerButton) {
      routePlannerButton.addEventListener('click', () => {
        window.livemapApi.openRoutePlanner();
      });
    }

    if (routePlannerBackdrop) {
      routePlannerBackdrop.addEventListener('click', () => {
        closeRoutePlannerOverlay();
      });
    }

    if (routePlannerCloseButton) {
      routePlannerCloseButton.addEventListener('click', () => {
        closeRoutePlannerOverlay();
      });
    }

    if (routePlannerHeader) {
      routePlannerHeader.addEventListener('pointerdown', startRoutePlannerDrag);
      routePlannerHeader.addEventListener('pointermove', updateRoutePlannerDrag);
      routePlannerHeader.addEventListener('pointerup', stopRoutePlannerDrag);
      routePlannerHeader.addEventListener('pointercancel', stopRoutePlannerDrag);
    }

    if (confirmDialogCancel) {
      confirmDialogCancel.addEventListener('click', () => {
        closeConfirmDialog(false);
      });
    }

    if (confirmDialogConfirm) {
      confirmDialogConfirm.addEventListener('click', () => {
        closeConfirmDialog(true);
      });
    }

    if (routeGenerateButton) {
      routeGenerateButton.addEventListener('click', () => {
        syncRoutePlannerConfigFromInputs();
        generateRouteSuggestions();
        renderRouteResults();
      });
    }

    if (routeAbortButton) {
      routeAbortButton.addEventListener('click', () => {
        abortRoute();
      });
    }

    if (routeMarkerList) {
      routeMarkerList.addEventListener('change', () => {
        syncRoutePlannerConfigFromInputs();
      });
    }

    if (routeResultsList) {
      routeResultsList.addEventListener('click', (event) => {
        const button = event.target.closest('button[data-action]');
        if (!button) {
          return;
        }

        const routeId = button.dataset.routeId;
        if (button.dataset.action === 'preview') {
          previewRoute(routeId);
          return;
        }

        if (button.dataset.action === 'start') {
          startRoute(routeId);
        }
      });
    }

    window.livemapApi.onRoutePreview((route) => {
      applyRoutePreview(route);
    });
    window.livemapApi.onRouteStart((route) => {
      applyRouteStart(route);
    });
    window.livemapApi.onRouteAbort(() => {
      abortRoute(false);
    });
    window.livemapApi.onRouteState((state) => {
      if (activeRoute && state?.activeRoute) {
        activeRoute.paused = Boolean(state.paused);
        updateRoutePreviewAndGuidance();
        scheduleMarkerOnlyCanvasDraw();
      }
    });

    if (mapFrameButton) {
      mapFrameButton.addEventListener('click', () => {
        toggleMarkerFrame();
      });
    }

    if (resizeHandles) {
      for (const handle of resizeHandles.querySelectorAll('.resize-handle')) {
        handle.addEventListener('pointerdown', async (event) => {
          event.preventDefault();
          await startResizeSession(handle.dataset.resize, event);
        });
      }

      window.addEventListener('pointermove', (event) => {
        handleResizeMove(event);
      });
      window.addEventListener('pointerup', stopResizeSession);
      window.addEventListener('pointercancel', stopResizeSession);
    }

    if (opacityButton) {
      const opacity = await window.livemapApi.getWindowOpacity();
      updateOpacityLabel(opacity);
      opacityButton.addEventListener('click', (event) => {
        event.stopPropagation();
        hideOpacityPopovers();
        toggleOpacityPopover(opacityPopover);
      });
    }

    if (opacitySlider) {
      opacitySlider.addEventListener('input', async (event) => {
        const value = Number(event.target.value);
        const appliedValue = await window.livemapApi.setWindowOpacity(value);
        updateOpacityLabel(appliedValue);
        saveCurrentViewSettings({ windowOpacity: appliedValue });
      });
    }

    if (minimizeButton) {
      minimizeButton.addEventListener('click', () => {
        window.livemapApi.minimizeWindow();
      });
    }

    if (closeButton) {
      closeButton.addEventListener('click', () => {
        window.livemapApi.closeWindow();
      });
    }

    if (updateToastInstallButton) {
      updateToastInstallButton.addEventListener('click', async () => {
        updateToastInstallButton.disabled = true;
        try {
          await window.livemapApi.installUpdateNow();
        } finally {
          updateToastInstallButton.disabled = false;
        }
      });
    }

    if (mapModeButton) {
      mapModeButton.addEventListener('click', () => {
        void toggleMapMode();
      });
    }

    if (compactMapModeButton) {
      compactMapModeButton.addEventListener('click', () => {
        void toggleMapMode();
      });
    }

      document.addEventListener('click', (event) => {
        const clickedPopover = (
        (opacityPopover && opacityPopover.contains(event.target))
        );
        const clickedButton = (
        (opacityButton && opacityButton.contains(event.target))
        );

      if (!opacityPopover) {
          return;
        }

        if (!clickedPopover && !clickedButton) {
          hideOpacityPopovers();
        }

        if (openLegendCategory
          && legend
          && !legend.contains(event.target)
          && (!legendOverlayRoot || !legendOverlayRoot.contains(event.target))) {
          closeLegendMenu();
        }
      });

    window.addEventListener('resize', () => {
      if (isMarkerOnlyMode && targetPlayerLatLng) {
        scheduleMarkerOnlyCanvasDraw();
      }
    });

      applyMapMode();
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          document.body.classList.add('app-ready');
        });
      });
    } catch (error) {
      setLiveStatus('Warten auf spielerkoordinate', 'waiting');
      throw error;
  }
}

bootstrap();
