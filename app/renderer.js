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

const WORLD_BOSS_DEFINITIONS = [
  { id: 'titanseal-runebound', name: 'Titanseal Runebound', hour: 17, minute: 0, icon: 'map/bosstimer/titan.png' },
  { id: 'aero-forge-colossus', name: 'Aero-Forge Colossus', hour: 18, minute: 0, icon: 'map/bosstimer/aero-forge.png' },
  { id: 'ironscale-draconarch', name: 'Ironscale Draconarch', hour: 19, minute: 0, icon: 'map/bosstimer/ironscale.png' },
  { id: 'doomcaller', name: 'Doomcaller', hour: 20, minute: 0, icon: 'map/bosstimer/doomcaller.png' },
  { id: 'vel-khurath', name: "Vel'khurath", hour: 21, minute: 0, icon: 'map/bosstimer/velkhurath.png' },
  { id: 'seraphiel', name: 'Seraphiel', hour: 22, minute: 0, icon: 'map/bosstimer/seraphiel.png' },
];

const WORLD_BOSS_TIMER_CORRECTION_MS = 2000;

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
const mapViewportElement = document.querySelector('.map-viewport');
const resizeHandles = document.getElementById('resizeHandles');
const mapFrameButton = document.getElementById('mapFrameButton');
const playerLockButton = document.getElementById('playerLockButton');
const worldBossButton = document.getElementById('worldBossButton');
const worldBossOverlay = document.getElementById('worldBossOverlay');
const worldBossOverlayHeader = document.getElementById('worldBossOverlayHeader');
const worldBossOverlayList = document.getElementById('worldBossOverlayList');
const altarTrackerButton = document.getElementById('altarTrackerButton');
const routePlannerButton = document.getElementById('routePlannerButton');
const findNearestButton = document.getElementById('findNearestButton');
const playerCenterButton = document.getElementById('playerCenterButton');
const opacityButton = document.getElementById('opacityButton');
const opacityPopover = document.getElementById('opacityPopover');
const opacitySlider = document.getElementById('opacitySlider');
const tutorialButton = document.getElementById('tutorialButton');
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
const routeRequirePersonalAltarInput = document.getElementById('routeRequirePersonalAltar');
const routeRequireGuildAltarInput = document.getElementById('routeRequireGuildAltar');
const routeRequireBothAltarsInput = document.getElementById('routeRequireBothAltars');
const routeGenerateButton = document.getElementById('routeGenerateButton');
const routeAbortButton = document.getElementById('routeAbortButton');
const routeResultsList = document.getElementById('routeResultsList');
const altarOverlay = document.getElementById('altarOverlay');
const altarBackdrop = document.getElementById('altarBackdrop');
const altarCloseButton = document.getElementById('altarCloseButton');
const altarSearchInput = document.getElementById('altarSearchInput');
const altarClearSelectionButton = document.getElementById('altarClearSelectionButton');
const altarSelectionSummary = document.getElementById('altarSelectionSummary');
const altarResultsMeta = document.getElementById('altarResultsMeta');
const altarResultsList = document.getElementById('altarResultsList');
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
const authOverlay = document.getElementById('authOverlay');
const authCloseButton = document.getElementById('authCloseButton');
const authTitle = document.getElementById('authTitle');
const authUser = document.getElementById('authUser');
const authAvatar = document.getElementById('authAvatar');
const authUserName = document.getElementById('authUserName');
const authUserEmail = document.getElementById('authUserEmail');
const authLoginButton = document.getElementById('authLoginButton');
const authLogoutButton = document.getElementById('authLogoutButton');
const authAutoLoginCheckbox = document.getElementById('authAutoLoginCheckbox');
const mapAccount = document.getElementById('mapAccount');
const mapAccountButton = document.getElementById('mapAccountButton');
const mapAccountAvatar = document.getElementById('mapAccountAvatar');
const mapAccountName = document.getElementById('mapAccountName');
const mapAccountRole = document.getElementById('mapAccountRole');
const mapAccountMenu = document.getElementById('mapAccountMenu');
const mapAccountAdminButton = document.getElementById('mapAccountAdminButton');
const mapAccountRefreshButton = document.getElementById('mapAccountRefreshButton');
const mapAccountLogoutButton = document.getElementById('mapAccountLogoutButton');
const adminOverlay = document.getElementById('adminOverlay');
const adminProfilesList = document.getElementById('adminProfilesList');
const adminStatusMessage = document.getElementById('adminStatusMessage');
const adminSearchInput = document.getElementById('adminSearchInput');
const adminRefreshButton = document.getElementById('adminRefreshButton');
const adminCloseButton = document.getElementById('adminCloseButton');
const tutorialOverlay = document.getElementById('tutorialOverlay');
const tutorialTitle = document.getElementById('tutorialTitle');
const tutorialStepLabel = document.getElementById('tutorialStepLabel');
const tutorialTargetLabel = document.getElementById('tutorialTargetLabel');
const tutorialText = document.getElementById('tutorialText');
const tutorialNextButton = document.getElementById('tutorialNextButton');
const tutorialSkipButton = document.getElementById('tutorialSkipButton');

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
const BUILD_AREA_RADIUS_METERS = 450;
const BUILD_AREA_RADIUS_PIXELS = BUILD_AREA_RADIUS_METERS / ((METERS_PER_PIXEL_X + METERS_PER_PIXEL_Z) / 2);
const ALTAR_RADIUS_METERS = 5000;
const ALTAR_RADIUS_PIXELS = ALTAR_RADIUS_METERS / ((METERS_PER_PIXEL_X + METERS_PER_PIXEL_Z) / 2);
const GUILD_ALTAR_BLOCK_RADIUS_METERS = 70;
const PERSONAL_ALTAR_BLOCK_RADIUS_METERS = 40;
const PRIVATE_ALTAR_SLOT_RADIUS_METERS = 40;
const PERSONAL_ALTAR_ICON_PATH = 'marker/standart/altar.png';
const GUILD_ALTAR_ICON_PATH = 'marker/standart/gildenaltar.png';
const CENTER_ICON_PATH = 'map/playercenter.png';
const CLUSTER_HIDDEN_BUILD_AREA_KEYS = new Set([
  'standart/gefährlicher_bau',
  'standart/sicherer_bau',
]);
const BUILD_AREA_STYLES = {
  'standart/gefährlicher_bau': {
    color: '#ef4444',
    fillColor: '#ef4444',
    fillOpacity: 0.18,
  },
  'standart/sicherer_bau': {
    color: '#3b82f6',
    fillColor: '#3b82f6',
    fillOpacity: 0.18,
  },
};

const BUILD_AREA_FILTER_KEYS_LEGACY = new Set([
  'standart/gefÃ¤hrlicher_bau',
  'standart/sicherer_bau',
]);

const BUILD_AREA_FILTER_KEYS = new Set([
  'standart/gefährlicher_bau',
  'standart/gefährlicher_bau',
  'standart/gefÃ¤hrlicher_bau',
  'standart/gefÃƒÂ¤hrlicher_bau',
  'standart/sicherer_bau',
]);

let map;
let oreData = {};
let playerPosition = null;
let activeOreFilters = new Set(Object.keys(ORE_COLORS));
let oreLayers = new Map();
let markerOnlyOreLayers = new Map();
let tileOverlays = [];
let playerMarker = null;
let altarLayer = null;
let altarMarkers = new Map();
let altarPlacementRadiusCircles = [];
let altarPlacementLiveMarkers = [];
let altarPlacementCandidateMarkers = [];
let altarPlacementCandidateRadiusCircles = [];
let altarPlacementPatternMarkers = [];
let altarFocusPingMarker = null;
let altarFocusPingTimer = null;
let altarOverlayTransitionTimer = null;
let altarUiRenderTimer = null;
let altarMapRenderTimer = null;
let altarsVisible = true;
let altarTrackingEnabled = false;
let altarEntries = new Map();
let altarSearchQuery = '';
let selectedPersonalAltarId = null;
let selectedGuildAltarId = null;
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
let altarPlacementTarget = null;
let altarMapRenderSignature = '';
let playerPositionLockState = { active: false, signature: null };
let routePlannerConfig = null;
let routePlannerResults = [];
let routePreview = null;
let activeRoute = null;
let routePreviewLine = null;
let routeGuideLine = null;
let routeFilterOverrideBackup = null;
let routePlannerDragState = null;
let worldBossOverlayTimer = null;
let worldBossOverlayDragState = null;
let routePlannerWindowBoundsBackup = null;
let routePreviewPlaybackToken = 0;
let confirmDialogResolver = null;
let updaterState = null;
let startupUpdaterResolved = false;
let startupUpdaterStartedAt = 0;
let startupGateFinished = false;
let tutorialActive = false;
let tutorialStepIndex = 0;
let tutorialHighlightedElement = null;
let currentAuthState = null;
let appCoreInitialized = false;
let livemapStarted = false;
let livemapStartPending = false;
let livemapStartTimer = null;
let adminProfilesCache = [];
let adminSearchQuery = '';
let mapAccountMenuOpen = false;

const ACCESS_ROLE_LABELS = {
  public: 'Public',
  prem: 'Prem',
  guild: 'Guild',
  beta: 'Beta',
  admin: 'Admin',
};

const ACCESS_FEATURE_LABELS = {
  findNearest: 'Find nearest',
  routePlanner: 'Routenplaner',
  altars: 'Altars',
  worldBossTimer: 'Weltbosstimer',
  mapMarkerOnly: 'Mapmarkeronly',
  admin: 'Admin',
};
let tutorialRunningTransition = false;
let tutorialRequiredAction = null;
let buildAreaCircles = [];
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
const TUTORIAL_VERSION = 1;

const TUTORIAL_STEPS = [
  {
    title: 'Livemap Überblick',
    targetLabel: 'Karte',
    text: 'Das ist die normale Livemap. Hier siehst du die Weltkarte, deinen Spieler, Marker, Koordinaten und das Inventargewicht in einer Ansicht.',
    selector: '.map-viewport',
  },
  {
    title: 'Hauptfilter',
    targetLabel: 'Filterleiste',
    text: 'Unter der Karte findest du die Hauptkategorien. Standardmäßig siehst du nur die Oberkategorien wie Erze, Pflanzen und Standart.',
    selector: '.legend',
  },
  {
    title: 'Unterfilter',
    targetLabel: 'Kategorie-Filter',
    text: 'Wenn du über eine Hauptkategorie hoverst, öffnet sich das Untermenü. Dort kannst du einzelne Unterkategorien per Klick an- und ausschalten.',
    selector: '.legend-category-button[data-category="erze"]',
    beforeShow: async () => {
      if (isMarkerOnlyMode) {
        await toggleMapMode();
      }
      openLegendCategory = 'erze';
      renderLegend();
    },
    afterHide: () => {
      openLegendCategory = null;
      renderLegend();
    },
  },
  {
    title: 'Routenplaner',
    targetLabel: 'Routenplaner',
    text: 'Der Routenplaner berechnet mehrere effiziente Routen, zeigt Details an und kann eine aktive Route später wieder aufnehmen.',
    selector: '#routePlannerButton',
  },
  {
    title: 'Nächster Marker',
    targetLabel: 'Find Nearest',
    text: 'Dieser Button zeigt dir die Linie zum nächstgelegenen aktiven Marker und blendet über deinem Spieler die Entfernung ein.',
    selector: '#findNearestButton',
  },
  {
    title: 'Spieler zentrieren',
    targetLabel: 'Center-Button',
    text: 'Mit diesem Button zentrierst du die Karte wieder direkt auf deinen Spieler, falls du dich auf der Karte verschoben hast.',
    selector: '#playerCenterButton',
  },
  {
    title: 'Fenster-Sichtbarkeit',
    targetLabel: 'Opacity',
    text: 'Hier stellst du die Transparenz des Overlays ein. Das ist praktisch, wenn du die Livemap über der Minimap oder direkt über dem Spiel nutzen möchtest.',
    selector: '#opacityButton',
  },
  {
    title: 'Moduswechsel',
    targetLabel: 'Switch-Button',
    text: 'Mit diesem Button wechselst du in den Mapmarker-Only-Modus. Dort bleibt nur die Markeransicht übrig. Mit Weiter wechseln wir jetzt in diesen Modus.',
    selector: '#mapModeButton',
    nextLabel: 'In Marker-Only wechseln',
  },
  {
    title: 'Marker-Only Übersicht',
    targetLabel: 'Marker-Only',
    text: 'Jetzt bist du im Marker-Only-Modus. Links liegen die kompakten Filter- und Funktionsbuttons, rechts der eigentliche Markerbereich.',
    selector: '.board',
    requiresMarkerOnly: true,
    beforeShow: async () => {
      if (!isMarkerOnlyMode) {
        await toggleMapMode();
        await wait(420);
      }
    },
  },
  {
    title: 'Marker-Only Filter',
    targetLabel: 'Filter-Icons',
    text: 'Die Hauptfilter funktionieren hier genauso wie in der normalen Livemap. Hover auf ein Icon öffnet das Untermenü, Klick auf die Hauptkategorie schaltet die aktiven Unterfilter der Kategorie.',
    selector: '.marker-only-filter-button[data-category="erze"]',
    requiresMarkerOnly: true,
    beforeShow: async () => {
      if (!isMarkerOnlyMode) {
        await toggleMapMode();
        await wait(420);
      }
      openLegendCategory = 'erze';
      renderLegend();
    },
    afterHide: () => {
      openLegendCategory = null;
      renderLegend();
    },
  },
  {
    title: 'Marker-Only Zusatzbuttons',
    targetLabel: 'Funktionsbuttons',
    text: 'Unter den Kategorie-Icons findest du auch hier den Button für Nächster Marker und den Routenplaner. Die Logik ist dieselbe wie in der normalen Ansicht.',
    selector: '.marker-only-nearest-button',
    requiresMarkerOnly: true,
    beforeShow: async () => {
      if (!isMarkerOnlyMode) {
        await toggleMapMode();
        await wait(420);
      }
    },
  },
  {
    title: 'Border einblenden',
    targetLabel: 'Border-Button',
    text: 'Für die Einrichtung des Marker-Only-Modus musst du jetzt diesen Border-Button anklicken. Erst dadurch erscheint der grüne Rahmen, den du danach über deine Minimap legen kannst.',
    selector: '#mapFrameButton',
    requiredAction: 'border-enable',
    advanceOnAction: false,
    requiresMarkerOnly: true,
    beforeShow: async () => {
      if (!isMarkerOnlyMode) {
        await toggleMapMode();
        await wait(420);
      }
      if (isMarkerFrameVisible) {
        toggleMarkerFrame();
      }
    },
  },
  {
    title: 'Rahmen ausrichten',
    targetLabel: 'Grüner Rahmen',
    text: 'Ziehe und skaliere den grünen Rahmen jetzt so, dass er genau über deiner Minimap liegt. So richtest du den Marker-Only-Modus sauber ein.',
    selector: '.map-viewport',
    requiresMarkerOnly: true,
    beforeShow: async () => {
      if (!isMarkerOnlyMode) {
        await toggleMapMode();
        await wait(420);
      }
      if (!isMarkerFrameVisible) {
        toggleMarkerFrame();
      }
    },
  },
  {
    title: 'Einrichtung beenden',
    targetLabel: 'Border-Button',
    text: 'Wenn der Rahmen korrekt sitzt, musst du den Border-Button jetzt erneut anklicken. Damit beendest du die Einrichtung und der grüne Rahmen verschwindet wieder.',
    selector: '#mapFrameButton',
    requiredAction: 'border-disable',
    requiresMarkerOnly: true,
    beforeShow: async () => {
      if (!isMarkerOnlyMode) {
        await toggleMapMode();
        await wait(420);
      }
      if (!isMarkerFrameVisible) {
        toggleMarkerFrame();
      }
    },
    nextLabel: 'Fertig',
  },
];

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
          if (entry.marker?.category === 'standart') {
            continue;
          }
          if (isAltarIntersectionFilterActive() && !isPointInsideBothAltars(entry.x, entry.y)) {
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

function getSelectedAltarEntries() {
  return {
    personal: selectedPersonalAltarId ? altarEntries.get(selectedPersonalAltarId) : null,
    guild: selectedGuildAltarId ? altarEntries.get(selectedGuildAltarId) : null,
  };
}

function isPointInsidePersonalAltar(x, y) {
  const { personal } = getSelectedAltarEntries();
  if (!personal) {
    return false;
  }

  return Math.hypot(x - personal.x, y - personal.y) <= ALTAR_RADIUS_METERS;
}

function isPointInsideGuildAltar(x, y) {
  const { guild } = getSelectedAltarEntries();
  if (!guild) {
    return false;
  }

  return Math.hypot(x - guild.x, y - guild.y) <= ALTAR_RADIUS_METERS;
}

function isPointInsideBothAltars(x, y) {
  const { personal, guild } = getSelectedAltarEntries();
  if (!personal || !guild) {
    return false;
  }

  return Math.hypot(x - personal.x, y - personal.y) <= ALTAR_RADIUS_METERS
    && Math.hypot(x - guild.x, y - guild.y) <= ALTAR_RADIUS_METERS;
}

function isAltarIntersectionFilterActive() {
  return altarsVisible && Boolean(selectedPersonalAltarId && selectedGuildAltarId);
}

function matchesRouteAltarConstraint(x, y, constraintMode) {
  if (constraintMode === 'personal') {
    return isPointInsidePersonalAltar(x, y);
  }
  if (constraintMode === 'guild') {
    return isPointInsideGuildAltar(x, y);
  }
  if (constraintMode === 'both') {
    return isPointInsideBothAltars(x, y);
  }
  return true;
}

function getRouteAltarConstraintModeFromInputs() {
  if (routeRequireBothAltarsInput?.checked) {
    return 'both';
  }
  if (routeRequireGuildAltarInput?.checked) {
    return 'guild';
  }
  if (routeRequirePersonalAltarInput?.checked) {
    return 'personal';
  }
  return 'none';
}

function applyRouteAltarConstraintSelection(mode) {
  if (routeRequirePersonalAltarInput) {
    routeRequirePersonalAltarInput.checked = mode === 'personal';
  }
  if (routeRequireGuildAltarInput) {
    routeRequireGuildAltarInput.checked = mode === 'guild';
  }
  if (routeRequireBothAltarsInput) {
    routeRequireBothAltarsInput.checked = mode === 'both';
  }
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

function getVisibleCategoryGroups() {
  return getCategoryGroups();
}

function getRoutePlannerCategoryGroups() {
  return getCategoryGroups().filter((group) => group.category !== 'standart');
}

function getActiveCategoryKeys(group) {
  return group.markers
    .map((marker) => marker.key)
    .filter((key) => activeOreFilters.has(key));
}

function getCategoryFilterCounts(group) {
  const markerTotal = group.markers.length;
  const markerActive = getActiveCategoryKeys(group).length;

  if (group.category !== 'standart') {
    return { active: markerActive, total: markerTotal };
  }

  return {
    active: markerActive + (altarsVisible ? 1 : 0),
    total: markerTotal + 1,
  };
}

function createCategoryButton(group, options = {}) {
  const { compact = false } = options;
  const categoryButton = document.createElement('button');
  categoryButton.type = 'button';
  categoryButton.className = compact ? 'marker-only-filter-button' : 'legend-category-button';
  categoryButton.dataset.category = group.category;
  categoryButton.dataset.selected = openLegendCategory === group.category ? 'true' : 'false';
  const iconPath = CATEGORY_ICONS[group.category];
  const { active: activeCount, total: totalCount } = getCategoryFilterCounts(group);
  categoryButton.dataset.active = activeCount > 0 ? 'true' : 'false';

  if (compact) {
    categoryButton.setAttribute('aria-label', `${group.label} ${activeCount}/${totalCount}`);
    categoryButton.innerHTML = `${iconPath ? `<img class="marker-only-filter-icon" src="${iconPath}" alt="">` : ''}`;
  } else {
    categoryButton.innerHTML = `${iconPath ? `<img class="legend-category-icon" src="${iconPath}" alt="">` : ''}<span class="legend-category-label">${group.label}</span><span class="legend-category-count">${activeCount}/${totalCount}</span>`;
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

  findNearestButton.classList.toggle('feature-locked', !hasFeatureAccess('findNearest'));
  findNearestButton.dataset.active = nearestMarkerEnabled ? 'true' : 'false';

  const compactButton = markerOnlyFiltersElement?.querySelector('.marker-only-nearest-button');
  if (compactButton) {
    compactButton.classList.toggle('feature-locked', !hasFeatureAccess('findNearest'));
    compactButton.dataset.active = nearestMarkerEnabled ? 'true' : 'false';
  }
}

function updatePlayerLockButtonState() {
  if (!playerLockButton) {
    return;
  }

  playerLockButton.dataset.active = playerPositionLockState?.active ? 'true' : 'false';
}

async function saveCurrentPlayerLock() {
  if (playerPositionLockState?.active) {
    playerPositionLockState = await window.livemapApi.setPlayerPositionLock({ active: false });
    updatePlayerLockButtonState();
    return;
  }

  if (!playerPosition?.signature) {
    console.warn('Keine Spieler-Signatur verfügbar, Lock kann nicht gesetzt werden.');
    return;
  }

  playerPositionLockState = await window.livemapApi.setPlayerPositionLock({
    active: true,
    signature: playerPosition.signature,
    position: {
      x: playerPosition.x,
      y: playerPosition.y,
      z: playerPosition.z,
    },
  });
  updatePlayerLockButtonState();
}

function getTutorialTarget(step) {
  if (!step?.selector) {
    return null;
  }

  return document.querySelector(step.selector);
}

async function buildTutorialStepPayload(step) {
  const target = getTutorialTarget(step);
  let targetRect = null;
  const workArea = await window.livemapApi.getDisplayWorkArea();

  if (target) {
    const rect = target.getBoundingClientRect();
    const windowBounds = await window.livemapApi.getWindowBounds();
    targetRect = {
      left: Math.round((windowBounds.x - workArea.x) + rect.left),
      top: Math.round((windowBounds.y - workArea.y) + rect.top),
      width: Math.round(rect.width),
      height: Math.round(rect.height),
    };
  }

  return {
    title: step.title,
    stepLabel: `Schritt ${tutorialStepIndex + 1}/${TUTORIAL_STEPS.length}`,
    targetLabel: step.targetLabel,
    text: step.text,
    nextLabel: step.nextLabel || (tutorialStepIndex === TUTORIAL_STEPS.length - 1 ? 'Fertig' : 'Weiter'),
    targetRect,
    nextDisabled: Boolean(step.requiredAction),
    action: step.requiredAction || 'next',
    workArea,
  };
}

async function waitForMarkerOnlyTutorialLayout(timeoutMs = 2500) {
  const startedAt = Date.now();

  while ((Date.now() - startedAt) < timeoutMs) {
    const markerOnlyReady = document.body.classList.contains('marker-only-mode')
      && markerOnlyCanvas
      && markerOnlyCanvas.getBoundingClientRect().width >= 40
      && markerOnlyCanvas.getBoundingClientRect().height >= 40;

    if (markerOnlyReady) {
      await wait(120);
      return;
    }

    await wait(60);
  }
}

async function waitForTutorialTarget(step, timeoutMs = 2000) {
  const startedAt = Date.now();

  while ((Date.now() - startedAt) < timeoutMs) {
    const target = getTutorialTarget(step);
    if (target) {
      const rect = target.getBoundingClientRect();
      const style = window.getComputedStyle(target);
      const isVisible = rect.width >= 8
        && rect.height >= 8
        && style.display !== 'none'
        && style.visibility !== 'hidden'
        && style.opacity !== '0';

      if (isVisible) {
        await wait(80);
        return target;
      }
    }

    await wait(50);
  }

  return getTutorialTarget(step);
}

async function showTutorialStep(index) {
  if (tutorialRunningTransition) {
    return;
  }

  tutorialRunningTransition = true;

  const previousStep = TUTORIAL_STEPS[tutorialStepIndex];
  if (previousStep?.afterHide) {
    previousStep.afterHide();
  }

  tutorialStepIndex = index;
  const step = TUTORIAL_STEPS[tutorialStepIndex];
  tutorialRequiredAction = step?.requiredAction || null;

  if (step?.beforeShow) {
    await step.beforeShow();
  }

  if (step?.requiresMarkerOnly) {
    await waitForMarkerOnlyTutorialLayout();
  }

  await waitForTutorialTarget(step);
  const payload = await buildTutorialStepPayload(step);
  await window.livemapApi.updateTutorialStep(payload);

  tutorialRunningTransition = false;
}

async function finishTutorial() {
  tutorialRequiredAction = null;
  const currentStep = TUTORIAL_STEPS[tutorialStepIndex];
  if (currentStep?.afterHide) {
    currentStep.afterHide();
  }

  if (isMarkerOnlyMode && isMarkerFrameVisible) {
    toggleMarkerFrame();
  }
  if (isMarkerOnlyMode) {
    await toggleMapMode();
  }

  tutorialActive = false;
  await window.livemapApi.closeTutorial();
  saveUiSettings({
    tutorialCompleted: true,
    tutorialVersion: TUTORIAL_VERSION,
  });
}

async function startTutorial(force = false) {
  const alreadyShown = uiSettings?.tutorialShownVersion === TUTORIAL_VERSION;
  if (!force && alreadyShown) {
    return;
  }

  if (!force) {
    saveUiSettings({
      tutorialShownVersion: TUTORIAL_VERSION,
    });
  }

  tutorialActive = true;
  tutorialStepIndex = -1;
  await window.livemapApi.openTutorial();
  await showTutorialStep(0);
}

async function advanceTutorial() {
  if (!tutorialActive || tutorialRunningTransition || tutorialRequiredAction) {
    return;
  }

  if (tutorialStepIndex >= TUTORIAL_STEPS.length - 1) {
    await finishTutorial();
    return;
  }

  await showTutorialStep(tutorialStepIndex + 1);
}

async function skipTutorial() {
  if (!tutorialActive || tutorialRunningTransition) {
    return;
  }

  await finishTutorial();
}

async function handleTutorialRequiredAction(action) {
  if (!tutorialActive || tutorialRunningTransition) {
    return;
  }

  if (!tutorialRequiredAction || tutorialRequiredAction !== action) {
    return;
  }

  const currentStep = TUTORIAL_STEPS[tutorialStepIndex];
  tutorialRequiredAction = null;

  if (currentStep?.advanceOnAction === false) {
    const payload = await buildTutorialStepPayload({
      ...currentStep,
      requiredAction: null,
    });
    await window.livemapApi.updateTutorialStep(payload);
    return;
  }

  await wait(120);
  await advanceTutorial();
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

function updateAltarTrackerButtonState() {
  if (altarTrackerButton) {
    altarTrackerButton.dataset.active = altarTrackingEnabled ? 'true' : 'false';
    altarTrackerButton.dataset.filterActive = altarsVisible ? 'true' : 'false';
  }
}

async function syncAltarStreamForCurrentModes(nextActive = altarTrackingEnabled) {
  const shouldTrackAltars = Boolean(nextActive);
  uiSettings = await window.livemapApi.setAltarTracking(shouldTrackAltars);
  altarTrackingEnabled = Boolean(uiSettings?.altarTrackingEnabled);
  updateAltarTrackerButtonState();
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
  if (!hasFeatureAccess('findNearest')) {
    return;
  }

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

function getNavigationTargetForPosition(position) {
  if (altarPlacementTarget && Number.isFinite(altarPlacementTarget.x) && Number.isFinite(altarPlacementTarget.y)) {
    return altarPlacementTarget;
  }

  if (!nearestMarkerEnabled || !position || !Number.isFinite(position.x) || !Number.isFinite(position.y)) {
    return null;
  }

  return findNearestActiveMarkerEntry(position.x, position.y);
}

function getNearestLineTarget() {
  return getNavigationTargetForPosition(playerPosition);
}

function refreshNearestMarkerLine() {
  if (!map) {
    return;
  }

  ensureNearestMarkerLine();
  ensurePlayerDistanceBadge();
  updateNearestMarkerButtonState();

  const targetEntry = getNearestLineTarget();
  const shouldShow = Boolean(targetEntry) && !activeRoute && !isMarkerOnlyMode && playerPosition;
  if (!shouldShow) {
    if (nearestMarkerLine && map.hasLayer(nearestMarkerLine)) {
      map.removeLayer(nearestMarkerLine);
    }
    if (playerDistanceBadge && map.hasLayer(playerDistanceBadge) && !activeRoute) {
      map.removeLayer(playerDistanceBadge);
    }
    return;
  }

  if (!targetEntry) {
    if (map.hasLayer(nearestMarkerLine)) {
      map.removeLayer(nearestMarkerLine);
    }
    if (playerDistanceBadge && map.hasLayer(playerDistanceBadge) && !activeRoute) {
      map.removeLayer(playerDistanceBadge);
    }
    return;
  }

  const playerLatLng = playerToLatLng(playerPosition.x, playerPosition.y);
  const markerLatLng = oreToLatLng(targetEntry.x, targetEntry.y);
  const distanceMeters = Math.round(Math.hypot(targetEntry.x - playerPosition.x, targetEntry.y - playerPosition.y));
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
  if (!hasFeatureAccess('findNearest')) {
    button.classList.add('feature-locked');
  }
  button.setAttribute('aria-label', 'Nächsten Marker finden');
  button.innerHTML = '<img class="marker-only-filter-icon marker-only-nearest-icon" src="map/findnearest.png" alt="">';
  button.addEventListener('click', (event) => {
    event.stopPropagation();
    if (!hasFeatureAccess('findNearest')) {
      return;
    }
    toggleNearestMarkerWithRouteGuard();
  });
  return button;
}

function createMarkerOnlyRoutePlannerButton() {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'marker-only-filter-button marker-only-route-button';
  button.dataset.active = activeRoute ? 'true' : 'false';
  if (!hasFeatureAccess('routePlanner')) {
    button.classList.add('feature-locked');
  }
  button.setAttribute('aria-label', 'Routenplaner');
  button.innerHTML = '<img class="marker-only-filter-icon marker-only-route-icon" src="map/routenplaner.png" alt="">';
  button.addEventListener('click', (event) => {
    event.stopPropagation();
    if (!hasFeatureAccess('routePlanner')) {
      return;
    }
    window.livemapApi.openRoutePlanner();
  });
  return button;
}

function createMarkerOnlyWorldBossButton() {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'marker-only-filter-button marker-only-worldboss-button';
  button.dataset.active = hasFeatureAccess('worldBossTimer') && isWorldBossOverlayVisible() ? 'true' : 'false';
  button.setAttribute('aria-label', 'Weltbosse');
  button.disabled = !hasFeatureAccess('worldBossTimer');
  button.classList.toggle('feature-locked', !hasFeatureAccess('worldBossTimer'));
  button.innerHTML = '<img class="marker-only-filter-icon marker-only-worldboss-icon" src="map/weltboss.png" alt="">';
  button.addEventListener('click', (event) => {
    event.stopPropagation();
    toggleWorldBossOverlay();
  });
  return button;
}

function createMarkerOnlyAltarTargetStopButton() {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'marker-only-filter-button marker-only-altar-stop-button';
  button.dataset.active = altarPlacementTarget ? 'true' : 'false';
  button.setAttribute('aria-label', 'Zielführung zum freien Altarplatz stoppen');
  button.innerHTML = '<span class="marker-only-stop-label">X</span>';
  button.addEventListener('click', (event) => {
    event.stopPropagation();
    setAltarPlacementTarget(null);
  });
  return button;
}

function syncRoutePlannerConfigFromInputs() {
  const config = getRoutePlannerConfig();
  if (routeUsePlayerStartInput) {
    config.usePlayerStart = routeUsePlayerStartInput.checked;
  }
  config.altarConstraintMode = getRouteAltarConstraintModeFromInputs();

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
    altarConstraintMode: 'none',
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
  if (config.altarConstraintMode === 'both' && !isAltarIntersectionFilterActive()) {
    return { startPoint: getRouteStartPoint(config), pool: [] };
  }
  if (config.altarConstraintMode === 'personal' && !selectedPersonalAltarId) {
    return { startPoint: getRouteStartPoint(config), pool: [] };
  }
  if (config.altarConstraintMode === 'guild' && !selectedGuildAltarId) {
    return { startPoint: getRouteStartPoint(config), pool: [] };
  }

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
      .filter((point) => matchesRouteAltarConstraint(point.x, point.y, config.altarConstraintMode))
      .filter((point) => !isMarkerOnCooldown(point.id))
      .sort((left, right) => left.distanceToStart - right.distanceToStart);

    if (!sortedPoints.length) {
      continue;
    }

    pool.push(...selectRouteCandidates(sortedPoints, requiredCount, variantIndex));
  }

  return { startPoint, pool };
}

function selectRouteCandidates(sortedPoints, requiredCount, variantIndex) {
  const minimumCount = Math.min(sortedPoints.length, requiredCount);
  if (!minimumCount) {
    return [];
  }

  const cutoffDistance = sortedPoints[minimumCount - 1].distanceToStart;
  const nearbyWindow = Math.max(350, cutoffDistance * 0.18);
  const maxCount = Math.min(
    sortedPoints.length,
    minimumCount + Math.max(2, Math.min(6, Math.ceil(requiredCount * 0.75))),
  );

  const candidateWindow = sortedPoints.filter((point, index) => (
    index < minimumCount || point.distanceToStart <= cutoffDistance + nearbyWindow
  ));

  const takeCount = Math.min(maxCount, candidateWindow.length);
  const maxOffset = Math.max(0, candidateWindow.length - takeCount);
  const offset = Math.min(variantIndex, maxOffset);
  return candidateWindow.slice(offset, offset + takeCount);
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
  applyRouteAltarConstraintSelection(config.altarConstraintMode || 'none');
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

  refreshClusteredBuildAreaVisibility();

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
  const navigationTarget = !activeRoute
    ? getNavigationTargetForPosition(displayPosition)
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

  if (navigationTarget) {
    const nearestPixel = gameToPixel(navigationTarget.x, navigationTarget.y);
    nearestDrawPoint = {
      x: centerX + ((nearestPixel.x - displayPixel.x) * MARKER_ONLY_SCALE),
      y: centerY - ((nearestPixel.y - displayPixel.y) * MARKER_ONLY_SCALE),
      distance: Math.round(Math.hypot(navigationTarget.x - displayPosition.x, navigationTarget.y - displayPosition.y)),
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

  if (altarPlacementTarget && nearestDrawPoint) {
    ctx.save();
    ctx.strokeStyle = 'rgba(121, 242, 168, 0.95)';
    ctx.fillStyle = 'rgba(121, 242, 168, 0.22)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(nearestDrawPoint.x, nearestDrawPoint.y, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.fillStyle = 'rgba(121, 242, 168, 1)';
    ctx.arc(nearestDrawPoint.x, nearestDrawPoint.y, 4.5, 0, Math.PI * 2);
    ctx.fill();
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

function getWorldBossTrackerSettings() {
  return uiSettings?.worldBossTracker || { bosses: {} };
}

function isWorldBossOverlayVisible() {
  return uiSettings?.worldBossOverlayVisible !== false;
}

function formatWorldBossSpawnTime(boss) {
  return `${String(boss.hour).padStart(2, '0')}:${String(boss.minute).padStart(2, '0')}`;
}

function getNextWorldBossSpawnAt(boss) {
  const now = new Date();
  const next = new Date(now);
  next.setHours(boss.hour, boss.minute, 0, 0);

  if (next.getTime() <= now.getTime()) {
    next.setDate(next.getDate() + 1);
  }

  return next;
}

function getWorldBossRemainingMs(boss) {
  return Math.max(0, getNextWorldBossSpawnAt(boss).getTime() - Date.now() + WORLD_BOSS_TIMER_CORRECTION_MS);
}

function formatWorldBossDuration(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function getWorldBossOverlayModeKey() {
  return isMarkerOnlyMode ? 'markerOnly' : 'normal';
}

function getWorldBossOverlayPosition(modeKey = getWorldBossOverlayModeKey()) {
  return {
    x: 4,
    y: null,
  };
}

function clampWorldBossOverlayPosition(nextX, nextY) {
  if (!worldBossOverlay || !mapViewportElement) {
    return { x: nextX, y: nextY };
  }

  const margin = 12;
  const viewportRect = mapViewportElement.getBoundingClientRect();
  const overlayRect = worldBossOverlay.getBoundingClientRect();
  const maxX = Math.max(margin, viewportRect.width - overlayRect.width - margin);
  const maxY = Math.max(margin, viewportRect.height - overlayRect.height - margin);

  return {
    x: Math.min(Math.max(nextX, margin), maxX),
    y: Math.min(Math.max(nextY, margin), maxY),
  };
}

function applyWorldBossOverlayPosition() {
  if (!worldBossOverlay) {
    return;
  }

  const position = getWorldBossOverlayPosition();
  worldBossOverlay.style.left = `${Math.round(position.x)}px`;
  worldBossOverlay.style.top = '50%';
}

function syncWorldBossOverlayVisibility() {
  const visible = hasFeatureAccess('worldBossTimer') && isWorldBossOverlayVisible();
  if (worldBossOverlay) {
    worldBossOverlay.dataset.visible = !isMarkerOnlyMode && visible ? 'true' : 'false';
  }
  if (worldBossButton) {
    worldBossButton.dataset.active = visible ? 'true' : 'false';
  }
  const compactButton = markerOnlyFiltersElement?.querySelector('.marker-only-worldboss-button');
  if (compactButton) {
    compactButton.dataset.active = visible ? 'true' : 'false';
  }
}

async function syncWorldBossPresentation() {
  syncWorldBossOverlayVisibility();

  if (!hasFeatureAccess('worldBossTimer')) {
    await window.livemapApi.closeWorldBossWindow();
    return;
  }

  if (isMarkerOnlyMode) {
    if (isWorldBossOverlayVisible()) {
      await window.livemapApi.openWorldBossWindow();
    } else {
      await window.livemapApi.closeWorldBossWindow();
    }
    return;
  }

  await window.livemapApi.closeWorldBossWindow();
  applyWorldBossOverlayPosition();
}

function renderWorldBossOverlay() {
  if (!worldBossOverlayList) {
    return;
  }

  const tracker = getWorldBossTrackerSettings();
  worldBossOverlayList.innerHTML = WORLD_BOSS_DEFINITIONS.map((boss) => {
    const bossState = tracker.bosses?.[boss.id] || {};
    const hasAlert = Number.isFinite(Number(bossState.alertOffsetMinutes)) && Number(bossState.alertOffsetMinutes) > 0;
    return `
    <article class="worldboss-overlay-card" data-alert-active="${hasAlert ? 'true' : 'false'}">
      <div class="worldboss-overlay-card-icon-wrap">
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

  applyWorldBossOverlayPosition();
}

function updateWorldBossOverlayStatuses() {
  if (!worldBossOverlayList) {
    return;
  }

  for (const boss of WORLD_BOSS_DEFINITIONS) {
    const statusElement = worldBossOverlayList.querySelector(`[data-worldboss-overlay-status="${boss.id}"]`);
    if (statusElement) {
      statusElement.textContent = formatWorldBossDuration(getWorldBossRemainingMs(boss));
    }
  }
}

function startWorldBossOverlayLoop() {
  if (worldBossOverlayTimer) {
    clearInterval(worldBossOverlayTimer);
  }

  worldBossOverlayTimer = setInterval(() => {
    updateWorldBossOverlayStatuses();
  }, 1000);
}

function startWorldBossOverlayDrag(event) {
  if (!worldBossOverlay || !worldBossOverlayHeader) {
    return;
  }

  const rect = worldBossOverlay.getBoundingClientRect();
  const viewportRect = mapViewportElement?.getBoundingClientRect();
  worldBossOverlayDragState = {
    pointerId: event.pointerId,
    offsetX: event.clientX - rect.left,
    offsetY: event.clientY - rect.top,
    viewportLeft: viewportRect?.left || 0,
    viewportTop: viewportRect?.top || 0,
  };

  worldBossOverlayHeader.setPointerCapture?.(event.pointerId);
  worldBossOverlay.dataset.dragging = 'true';
}

function updateWorldBossOverlayDrag(event) {
  if (!worldBossOverlayDragState || worldBossOverlayDragState.pointerId !== event.pointerId) {
    return;
  }

  const nextX = event.clientX - worldBossOverlayDragState.viewportLeft - worldBossOverlayDragState.offsetX;
  const currentTop = Number.parseFloat(worldBossOverlay.style.top || '0');
  const clamped = clampWorldBossOverlayPosition(nextX, currentTop);
  worldBossOverlay.style.left = `${Math.round(clamped.x)}px`;
}

function stopWorldBossOverlayDrag(event) {
  if (!worldBossOverlayDragState) {
    return;
  }

  if (!event || worldBossOverlayDragState.pointerId === event.pointerId) {
    worldBossOverlayHeader?.releasePointerCapture?.(worldBossOverlayDragState.pointerId);
    worldBossOverlayDragState = null;
    delete worldBossOverlay?.dataset.dragging;
    applyWorldBossOverlayPosition();
  }
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
    altarFilterEnabled: altarsVisible,
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

function saveSelectedAltarsState() {
  const personal = selectedPersonalAltarId ? altarEntries.get(selectedPersonalAltarId) : null;
  const guild = selectedGuildAltarId ? altarEntries.get(selectedGuildAltarId) : null;
  saveUiSettings({
    selectedAltars: {
      personal: personal ? { ...personal } : null,
      guild: guild ? { ...guild } : null,
    },
  });
}

function getAltarPlacementTools() {
  return {
    showBlockedRadii: Boolean(uiSettings?.altarPlacementTools?.showBlockedRadii),
    showBuildAreaSlots: Boolean(uiSettings?.altarPlacementTools?.showBuildAreaSlots),
    showGuildBuildAreaSlots: Boolean(uiSettings?.altarPlacementTools?.showGuildBuildAreaSlots),
  };
}

function applySelectedAltarsFromSettings(nextSettings = uiSettings) {
  selectedPersonalAltarId = nextSettings?.selectedAltars?.personal?.id || null;
  selectedGuildAltarId = nextSettings?.selectedAltars?.guild?.id || null;

  if (nextSettings?.selectedAltars?.personal?.id) {
    altarEntries.set(nextSettings.selectedAltars.personal.id, { ...nextSettings.selectedAltars.personal });
  }
  if (nextSettings?.selectedAltars?.guild?.id) {
    altarEntries.set(nextSettings.selectedAltars.guild.id, { ...nextSettings.selectedAltars.guild });
  }
}

function syncAltarLayerVisibility() {
  if (!map || !altarLayer) {
    return;
  }

  const hasSelectedAltars = Boolean(selectedPersonalAltarId || selectedGuildAltarId);
  const tools = getAltarPlacementTools();
  const hasPlacementHelpers = (tools.showBlockedRadii || tools.showBuildAreaSlots || tools.showGuildBuildAreaSlots) && altarEntries.size > 0;
  const shouldShow = altarsVisible && (altarTrackingEnabled || hasSelectedAltars || hasPlacementHelpers);

  if (shouldShow && !map.hasLayer(altarLayer)) {
    altarLayer.addTo(map);
  }

  if (!shouldShow && map.hasLayer(altarLayer)) {
    map.removeLayer(altarLayer);
  }

  if (shouldShow) {
    renderSelectedAltarsOnMap();
  }
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
  altarTrackingEnabled = Boolean(uiSettings?.altarTrackingEnabled);
  altarsVisible = viewSettings.altarFilterEnabled !== false;
  applySelectedAltarsFromSettings(uiSettings);
  nearestMarkerEnabled = getSharedNearestMarkerEnabled();
  categoryFilterMemory = { ...(viewSettings.lastActiveFiltersByCategory || {}) };
  if (activeRoute && routeFilterOverrideBackup) {
    applyRouteFilterOverride();
  }
  openLegendCategory = null;
  renderLegend();
  syncOreLayers();
  syncAltarLayerVisibility();
  scheduleMarkerOnlyCanvasDraw();
  updateAltarTrackerButtonState();
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

function latLngToGame(latLng) {
  if (!latLng || !Number.isFinite(latLng.lat) || !Number.isFinite(latLng.lng)) {
    return null;
  }

  return {
    x: (latLng.lng - ORIGIN_PIXEL.x) * METERS_PER_PIXEL_X,
    y: (latLng.lat - ORIGIN_PIXEL.y) * METERS_PER_PIXEL_Z,
  };
}

function oreToLatLng(x, y) {
  return gameToLatLng(x, y);
}

function getBuildAreaRadiusAtCurrentZoom() {
  if (!map) {
    return BUILD_AREA_RADIUS_PIXELS;
  }

  return BUILD_AREA_RADIUS_PIXELS * map.getZoomScale(map.getZoom(), 0);
}

function refreshBuildAreaCircles() {
  const radius = getBuildAreaRadiusAtCurrentZoom();

  for (const entry of buildAreaCircles) {
    entry.circle.setRadius(radius);
  }

  refreshClusteredBuildAreaVisibility();
}

function refreshClusteredBuildAreaVisibility() {
  for (const entry of buildAreaCircles) {
    if (!entry.hideWhenClustered) {
      continue;
    }

    const clusterLayerVisible = entry.layer.hasLayer(entry.clusterLayer);
    const visibleParent = clusterLayerVisible
      ? entry.clusterLayer.getVisibleParent(entry.leafletMarker)
      : entry.leafletMarker;
    const shouldHide = visibleParent !== entry.leafletMarker;
    const isVisible = entry.layer.hasLayer(entry.circle);

    if (shouldHide && isVisible) {
      entry.layer.removeLayer(entry.circle);
    }

    if (!shouldHide && !isVisible) {
      entry.layer.addLayer(entry.circle);
    }
  }
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
  altarLayer = L.layerGroup().addTo(map);
  map.on('zoomend', refreshBuildAreaCircles);
  map.on('zoomend', refreshSelectedAltarCircles);
  map.on('moveend', () => {
    refreshClusteredBuildAreaVisibility();
    const tools = getAltarPlacementTools();
    if (tools.showBuildAreaSlots || tools.showGuildBuildAreaSlots) {
      renderSelectedAltarsOnMap();
    }
  });
}

function getAltarRadiusAtCurrentZoom() {
  if (!map) {
    return ALTAR_RADIUS_PIXELS;
  }

  return ALTAR_RADIUS_PIXELS * map.getZoomScale(map.getZoom(), 0);
}

function getMeterRadiusAtCurrentZoom(meters) {
  const baseRadius = meters / ((METERS_PER_PIXEL_X + METERS_PER_PIXEL_Z) / 2);
  if (!map) {
    return baseRadius;
  }

  return baseRadius * map.getZoomScale(map.getZoom(), 0);
}

function createHatchedCircleMarker(latLng, meters, color, popup) {
  const pixelRadius = Math.max(8, getMeterRadiusAtCurrentZoom(meters));
  const diameter = Math.round(pixelRadius * 2);
  const marker = L.marker(latLng, {
    keyboard: false,
    interactive: true,
    icon: L.divIcon({
      className: 'altar-block-area-wrap',
      html: `<div class="altar-block-area" style="width:${diameter}px;height:${diameter}px;--block-color:${color};"></div>`,
      iconSize: [diameter, diameter],
      iconAnchor: [diameter / 2, diameter / 2],
    }),
  }).bindPopup(popup, { autoPan: true, className: 'map-popup-shell' });

  return { marker, meters, color };
}

function setAltarPlacementTarget(target) {
  if (target && Number.isFinite(target.x) && Number.isFinite(target.y)) {
    altarPlacementTarget = {
      id: String(target.id || `altar-slot:${target.x}:${target.y}`),
      x: Number(target.x),
      y: Number(target.y),
      name: target.name || 'Freier Platz',
    };
  } else {
    altarPlacementTarget = null;
  }

  renderLegend();
  renderSelectedAltarsOnMap();
  refreshNearestMarkerLine();
  scheduleMarkerOnlyCanvasDraw();
}

function createAltarMarkerIcon(kind) {
  const iconPath = kind === 'guild' ? GUILD_ALTAR_ICON_PATH : PERSONAL_ALTAR_ICON_PATH;
  return L.divIcon({
    className: 'altar-marker-wrap',
    html: `
      <div style="width:32px;height:32px;display:grid;place-items:center;">
        <img src="${iconPath}" alt="" style="width:32px;height:32px;object-fit:contain;filter:drop-shadow(0 10px 16px rgba(0,0,0,0.34));">
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -10],
  });
}

function createAltarPlacementSlotIcon() {
  return L.divIcon({
    className: 'altar-slot-marker-wrap',
    html: `
      <div class="altar-slot-marker-hitbox">
        <div class="altar-slot-marker-core"></div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -10],
  });
}

function clearAltarMarkers() {
  if (altarLayer) {
    altarLayer.clearLayers();
  }
  altarMarkers = new Map();
  altarPlacementRadiusCircles = [];
  altarPlacementLiveMarkers = [];
  altarPlacementCandidateMarkers = [];
  altarPlacementCandidateRadiusCircles = [];
  altarPlacementPatternMarkers = [];
}

function scheduleAltarResultsRender() {
  if (altarUiRenderTimer) {
    return;
  }

  altarUiRenderTimer = setTimeout(() => {
    altarUiRenderTimer = null;
    renderAltarResults();
    renderAltarSelectionSummary();
  }, 80);
}

function scheduleAltarMapRender() {
  if (altarMapRenderTimer || !altarsVisible) {
    return;
  }

  altarMapRenderTimer = setTimeout(() => {
    altarMapRenderTimer = null;
    renderSelectedAltarsOnMap();
  }, 220);
}

function getAltarMapRenderSignature() {
  const tools = getAltarPlacementTools();
  const selectedEntries = [
    selectedPersonalAltarId ? altarEntries.get(selectedPersonalAltarId) : null,
    selectedGuildAltarId ? altarEntries.get(selectedGuildAltarId) : null,
  ]
    .filter(Boolean)
    .map((entry) => `${entry.id}:${entry.x}:${entry.y}:${entry.altar_type}`)
    .join('|');

  const helperEntries = (tools.showBlockedRadii || tools.showBuildAreaSlots || tools.showGuildBuildAreaSlots)
    ? getLiveTrackedAltars()
      .map((entry) => `${entry.id}:${entry.x}:${entry.y}:${entry.altar_type}`)
      .sort()
      .join('|')
    : '';

  const centerReference = map ? latLngToGame(map.getCenter()) : null;
  const referencePoint = (
    (centerReference && Number.isFinite(centerReference.x) && Number.isFinite(centerReference.y))
      ? `${Math.round(centerReference.x)}:${Math.round(centerReference.y)}`
      : selectedPersonalAltarId || selectedGuildAltarId || 'none'
  );

  return [
    altarsVisible ? 'visible' : 'hidden',
    selectedEntries,
    tools.showBlockedRadii ? 'helpers:on' : 'helpers:off',
    tools.showBuildAreaSlots ? 'slots:on' : 'slots:off',
    tools.showGuildBuildAreaSlots ? 'guild-slots:on' : 'guild-slots:off',
    helperEntries,
    altarPlacementTarget?.id || 'no-target',
    referencePoint,
  ].join('::');
}

function createAltarFilterIconHtml() {
  return `
    <span class="legend-icon-wrap">
      <img class="legend-item-icon" src="${PERSONAL_ALTAR_ICON_PATH}" alt="">
    </span>
  `;
}

function createAltarSummaryLabelHtml(kind) {
  const iconPath = kind === 'guild' ? GUILD_ALTAR_ICON_PATH : PERSONAL_ALTAR_ICON_PATH;
  return `
    <span class="altar-summary-label">
      <img src="${iconPath}" alt="">
    </span>
  `;
}

function buildAltarPopup(entry, kind) {
  const title = kind === 'guild' ? 'Gildenaltar' : 'Persönlicher Altar';
  return `
    <div class="map-popup">
      <div class="map-popup-title">${title}</div>
      <div class="map-popup-row"><span>Name</span><strong>${entry.name}</strong></div>
      <div class="map-popup-row"><span>X</span><strong>${entry.x.toFixed(2)}</strong></div>
      <div class="map-popup-row"><span>Y</span><strong>${entry.y.toFixed(2)}</strong></div>
    </div>
  `;
}

function getAltarKindFromEntry(entry) {
  return Number(entry?.altar_type) === 2 ? 'guild' : 'personal';
}

function getBuildAreaCenters() {
  const centers = [];

  for (const key of BUILD_AREA_FILTER_KEYS) {
    const marker = oreData[key];
    if (!marker?.coordinates?.length) {
      continue;
    }

    for (const [x, y] of marker.coordinates) {
      if (Number.isFinite(x) && Number.isFinite(y)) {
        centers.push({ key, x, y });
      }
    }
  }

  return centers;
}

function getLiveTrackedAltars() {
  return Array.from(altarEntries.values()).filter((entry) => [1, 2].includes(Number(entry?.altar_type)));
}

function getAltarBlockRadiusMeters(entry) {
  return Number(entry?.altar_type) === 2
    ? GUILD_ALTAR_BLOCK_RADIUS_METERS
    : PERSONAL_ALTAR_BLOCK_RADIUS_METERS;
}

function renderLiveAltarPlacementHelpers() {
  const tools = getAltarPlacementTools();
  const liveAltars = getLiveTrackedAltars();

  if (altarPlacementTarget || !tools.showBlockedRadii || !liveAltars.length) {
    return;
  }

  for (const entry of liveAltars) {
    const kind = getAltarKindFromEntry(entry);
    const color = kind === 'guild' ? '#a855f7' : '#3b82f6';
    const latLng = oreToLatLng(entry.x, entry.y);
    const popup = buildAltarPopup(entry, kind);
    const isSelected = entry.id === selectedPersonalAltarId || entry.id === selectedGuildAltarId;
    const radiusCircle = createHatchedCircleMarker(latLng, getAltarBlockRadiusMeters(entry), color, popup);
    radiusCircle.marker.addTo(altarLayer);
    altarPlacementRadiusCircles.push(radiusCircle);
    altarPlacementPatternMarkers.push(radiusCircle.marker);
    if (!isSelected) {
      const marker = L.marker(latLng, {
        icon: createAltarMarkerIcon(kind),
        keyboard: false,
        opacity: 0.92,
      }).bindPopup(popup, { autoPan: true, className: 'map-popup-shell' });
      marker.addTo(altarLayer);
      altarPlacementLiveMarkers.push(marker);
    }
  }
}

function renderPotentialBuildAreaSlots() {
  const tools = getAltarPlacementTools();
  const showPrivateSlots = tools.showBuildAreaSlots;
  const showGuildSlots = tools.showGuildBuildAreaSlots;
  if (!showPrivateSlots && !showGuildSlots) {
    return;
  }

  const buildAreas = getBuildAreaCenters();
  const liveAltars = getLiveTrackedAltars();
  if (!buildAreas.length) {
    return;
  }

  const centerReference = map ? latLngToGame(map.getCenter()) : null;
  const referencePoint = (
    (centerReference && Number.isFinite(centerReference.x) && Number.isFinite(centerReference.y))
      ? centerReference
      : (selectedPersonalAltarId && altarEntries.get(selectedPersonalAltarId))
  ) || (selectedGuildAltarId && altarEntries.get(selectedGuildAltarId)) || buildAreas[0];
  const nearestBuildArea = buildAreas
    .slice()
    .sort((left, right) => (
      Math.hypot(left.x - referencePoint.x, left.y - referencePoint.y)
      - Math.hypot(right.x - referencePoint.x, right.y - referencePoint.y)
    ))[0];

  if (!nearestBuildArea) {
    return;
  }

  const candidateStep = showGuildSlots ? 40 : 28;
  const candidateRadius = showGuildSlots
    ? GUILD_ALTAR_BLOCK_RADIUS_METERS
    : PRIVATE_ALTAR_SLOT_RADIUS_METERS;
  const candidateTitle = showGuildSlots
    ? 'Freier Platz für Gildenaltar'
    : 'Freier Platz f?r privaten Altar';
  const candidateTargetName = showGuildSlots
    ? 'Freier Platz für Gildenaltar'
    : 'Freier Platz für privaten Altar';
  const usableRadius = Math.max(0, BUILD_AREA_RADIUS_METERS - candidateRadius);
  const maxCandidates = 48;
  const acceptedCandidates = [];

  for (let offsetX = -usableRadius; offsetX <= usableRadius; offsetX += candidateStep) {
    for (let offsetY = -usableRadius; offsetY <= usableRadius; offsetY += candidateStep) {
      const distanceToCenter = Math.hypot(offsetX, offsetY);
      if (distanceToCenter > usableRadius) {
        continue;
      }

      const x = nearestBuildArea.x + offsetX;
      const y = nearestBuildArea.y + offsetY;
      const blockedByExistingAltars = liveAltars.some((entry) => (
        Math.hypot(entry.x - x, entry.y - y) < (getAltarBlockRadiusMeters(entry) + candidateRadius)
      ));
      if (blockedByExistingAltars) {
        continue;
      }

      const blockedByAcceptedCandidates = acceptedCandidates.some((entry) => (
        Math.hypot(entry.x - x, entry.y - y) < (candidateRadius * 2)
      ));
      if (blockedByAcceptedCandidates) {
        continue;
      }

      const candidateId = `altar-slot:${nearestBuildArea.key}:${x}:${y}`;
      acceptedCandidates.push({ id: candidateId, x, y });
      const latLng = oreToLatLng(x, y);
      const targetIsActive = altarPlacementTarget?.id === candidateId;
      if (altarPlacementTarget && !targetIsActive) {
        continue;
      }
      const candidateCircle = L.circleMarker(latLng, {
        radius: getMeterRadiusAtCurrentZoom(candidateRadius),
        color: '#22c55e',
        weight: 1.5,
        fillColor: '#22c55e',
        fillOpacity: 0.08,
        dashArray: '6 6',
        interactive: false,
        renderer: L.canvas({ padding: 0.4 }),
      });
      const marker = L.marker(latLng, {
        icon: createAltarPlacementSlotIcon(),
        keyboard: false,
      }).bindPopup(`
        <div class="map-popup">
          <div class="map-popup-title">${candidateTitle}</div>
          <div class="map-popup-row"><span>X</span><strong>${x.toFixed(2)}</strong></div>
          <div class="map-popup-row"><span>Y</span><strong>${y.toFixed(2)}</strong></div>
          <div class="map-popup-actions">
            ${targetIsActive
              ? '<button class="map-popup-action-button map-popup-action-button-danger altar-slot-clear-button" type="button">Ziel entfernen</button>'
              : `<button class="map-popup-action-button map-popup-action-button-primary altar-slot-target-button" type="button" data-slot-id="${candidateId}" data-slot-x="${x}" data-slot-y="${y}" data-slot-name="${candidateTargetName}">Als Ziel setzen</button>`}
          </div>
        <span class="admin-row-state ${isBlocked ? 'is-blocked' : 'is-active'}">${isBlocked ? 'Account gesperrt' : 'Account aktiv'}</span>
      </div>
      `, { autoPan: true, className: 'map-popup-shell' });

      candidateCircle.addTo(altarLayer);
      marker.addTo(altarLayer);
      altarPlacementCandidateRadiusCircles.push({ circle: candidateCircle, meters: candidateRadius });
      altarPlacementCandidateMarkers.push(candidateCircle);
      altarPlacementCandidateMarkers.push(marker);
      if (acceptedCandidates.length >= maxCandidates) {
        return;
      }
    }
  }
}

function renderSelectedAltarsOnMap() {
  if (!map || !altarLayer || !altarsVisible) {
    altarMapRenderSignature = '';
    return;
  }

  const nextSignature = getAltarMapRenderSignature();
  if (nextSignature === altarMapRenderSignature) {
    return;
  }

  clearAltarMarkers();
  if (!altarPlacementTarget) {
    const selections = [
      { id: selectedPersonalAltarId, kind: 'personal', color: '#3b82f6', fillOpacity: 0.12 },
      { id: selectedGuildAltarId, kind: 'guild', color: '#a855f7', fillOpacity: 0.12 },
    ];

    for (const selection of selections) {
      const entry = selection.id ? altarEntries.get(selection.id) : null;
      if (!entry) {
        continue;
      }

      const latLng = oreToLatLng(entry.x, entry.y);
      const popup = buildAltarPopup(entry, selection.kind);
      const circle = L.circleMarker(latLng, {
        radius: getAltarRadiusAtCurrentZoom(),
        color: selection.color,
        weight: 1.5,
        fillColor: selection.color,
        fillOpacity: selection.fillOpacity,
        interactive: false,
        renderer: L.canvas({ padding: 0.4 }),
      });
      const marker = L.marker(latLng, {
        icon: createAltarMarkerIcon(selection.kind),
        keyboard: false,
      }).bindPopup(popup, { autoPan: true, className: 'map-popup-shell' });

      circle.addTo(altarLayer);
      marker.addTo(altarLayer);
      altarMarkers.set(selection.kind, { marker, circle });
    }
  }

  renderLiveAltarPlacementHelpers();
  renderPotentialBuildAreaSlots();
  altarMapRenderSignature = nextSignature;
}

function refreshSelectedAltarCircles() {
  for (const entry of altarPlacementRadiusCircles) {
    const pixelRadius = Math.max(8, getMeterRadiusAtCurrentZoom(entry.meters));
    const diameter = Math.round(pixelRadius * 2);
    const html = `<div class="altar-block-area" style="width:${diameter}px;height:${diameter}px;--block-color:${entry.color};"></div>`;
    if (entry.marker) {
      entry.marker.setIcon(L.divIcon({
        className: 'altar-block-area-wrap',
        html,
        iconSize: [diameter, diameter],
        iconAnchor: [diameter / 2, diameter / 2],
      }));
    }
  }
  const radius = getAltarRadiusAtCurrentZoom();
  for (const entry of altarMarkers.values()) {
    entry.circle?.setRadius(radius);
  }
  const tools = getAltarPlacementTools();
  const candidateRadius = getMeterRadiusAtCurrentZoom(
    tools.showGuildBuildAreaSlots ? GUILD_ALTAR_BLOCK_RADIUS_METERS : PRIVATE_ALTAR_SLOT_RADIUS_METERS
  );
  for (const entry of altarPlacementCandidateRadiusCircles) {
    entry.circle?.setRadius(candidateRadius);
  }
}

function setSelectedAltar(kind, altarId) {
  if (kind === 'guild') {
    selectedGuildAltarId = altarId;
  } else {
    selectedPersonalAltarId = altarId;
  }

  renderAltarSelectionSummary();
  renderAltarResults();
  renderSelectedAltarsOnMap();
  saveSelectedAltarsState();
}

function pruneAltarEntriesToSelections() {
  const preservedIds = new Set(
    [selectedPersonalAltarId, selectedGuildAltarId].filter(Boolean),
  );

  altarEntries = new Map(
    Array.from(altarEntries.entries()).filter(([id]) => preservedIds.has(id)),
  );
}

function clearSelectedAltars() {
  selectedPersonalAltarId = null;
  selectedGuildAltarId = null;
  pruneAltarEntriesToSelections();
  renderAltarSelectionSummary();
  renderAltarResults();
  renderSelectedAltarsOnMap();
  syncAltarLayerVisibility();
  saveSelectedAltarsState();
}

function matchesAltarSearch(entry, query) {
  if (!query) {
    return true;
  }

  const haystack = `${entry.name} ${entry.x} ${entry.y}`.toLowerCase();
  return haystack.includes(query);
}

function getFilteredAltars() {
  const query = altarSearchQuery.trim().toLowerCase();
  const sourceEntries = Array.from(altarEntries.values())
    .filter((entry) => [1, 2].includes(Number(entry.altar_type)));

  return sourceEntries
    .filter((entry) => matchesAltarSearch(entry, query))
    .sort((left, right) => left.name.localeCompare(right.name));
}

function renderAltarSelectionSummary() {
  if (!altarSelectionSummary) {
    return;
  }

  const personal = selectedPersonalAltarId ? altarEntries.get(selectedPersonalAltarId) : null;
  const guild = selectedGuildAltarId ? altarEntries.get(selectedGuildAltarId) : null;
  altarSelectionSummary.innerHTML = `
    <div class="altar-summary-card">
      <strong>${personal ? `${createAltarSummaryLabelHtml('personal')}<span>${personal.name}</span>` : `${createAltarSummaryLabelHtml('personal')}<span>Nicht gesetzt</span>`}</strong>
    </div>
    <div class="altar-summary-card">
      <strong>${guild ? `${createAltarSummaryLabelHtml('guild')}<span>${guild.name}</span>` : `${createAltarSummaryLabelHtml('guild')}<span>Nicht gesetzt</span>`}</strong>
    </div>
  `;
}

function renderAltarResults() {
  if (!altarResultsList || !altarResultsMeta) {
    return;
  }

  const entries = getFilteredAltars();
  altarResultsMeta.textContent = `${entries.length} Einträge`;
  altarResultsList.innerHTML = '';

  if (!entries.length) {
    altarResultsList.innerHTML = '<div class="planner-empty">Keine Altäre gefunden.</div>';
    return;
  }

  for (const entry of entries) {
    const altarType = Number(entry.altar_type);
    const actionButtons = [];
    if (altarType === 1) {
      actionButtons.push(`<button class="altar-action-button altar-action-button-personal" data-kind="personal" data-altar-id="${entry.id}" type="button" aria-label="Persoenlichen Altar setzen">
          <img src="${PERSONAL_ALTAR_ICON_PATH}" alt="Persoenlicher Altar">
        </button>`);
    }
    if (altarType === 2) {
      actionButtons.push(`<button class="altar-action-button altar-action-button-guild" data-kind="guild" data-altar-id="${entry.id}" type="button" aria-label="Gildenaltar setzen">
          <img src="${GUILD_ALTAR_ICON_PATH}" alt="Gildenaltar">
        </button>`);
    }
    const card = document.createElement('article');
    card.className = 'altar-result-card';
    card.innerHTML = `
      <div class="altar-result-head">
        <strong>${entry.name}</strong>
      </div>
      <div class="altar-result-actions">
        ${actionButtons.join('')}
        <button class="altar-action-button altar-action-button-center" data-kind="center" data-altar-id="${entry.id}" type="button" aria-label="Auf Altar zentrieren">
          <img src="${CENTER_ICON_PATH}" alt="Zentrieren">
        </button>
      </div>
    `;
    altarResultsList.appendChild(card);
  }
}

function openAltarOverlay() {
  if (!hasFeatureAccess('altars')) {
    return;
  }

  if (altarOverlay) {
    altarOverlay.hidden = false;
  }
  renderAltarSelectionSummary();
  renderAltarResults();
}

async function closeAltarOverlay() {
  if (altarOverlay) {
    altarOverlay.hidden = true;
  }

  altarSearchQuery = '';
  if (altarSearchInput) {
    altarSearchInput.value = '';
  }
  renderAltarSelectionSummary();
  renderAltarResults();

  if (altarTrackingEnabled) {
    await syncAltarStreamForCurrentModes(false);
  }
  syncAltarLayerVisibility();
}

function upsertAltarEntry(data) {
  const x = Number(data?.x);
  const y = Number(data?.y);
  const name = String(data?.name || 'Unbekannter Altar').trim();
  const altarType = Number(data?.altar_type);
  const normalizedAltarType = Number.isFinite(altarType) ? altarType : null;
  const stableId = `${name}:${x}:${y}:${normalizedAltarType ?? 'unknown'}`;
  const incomingId = String(data?.id || stableId);
  const id = stableId;

  if (!Number.isFinite(x) || !Number.isFinite(y) || !id) {
    return;
  }

  for (const [existingId, existingEntry] of altarEntries.entries()) {
    if (
      existingId !== id
      && existingEntry?.name === name
      && Number(existingEntry?.x) === x
      && Number(existingEntry?.y) === y
      && Number(existingEntry?.altar_type) === normalizedAltarType
    ) {
      altarEntries.delete(existingId);
      if (selectedPersonalAltarId === existingId) {
        selectedPersonalAltarId = id;
      }
      if (selectedGuildAltarId === existingId) {
        selectedGuildAltarId = id;
      }
    }
  }

  const nextEntry = {
    id,
    sourceId: incomingId,
    name,
    x,
    y,
    altar_type: normalizedAltarType,
  };
  const previousEntry = altarEntries.get(id);
  if (previousEntry
    && previousEntry.name === nextEntry.name
    && previousEntry.x === nextEntry.x
    && previousEntry.y === nextEntry.y
    && Number(previousEntry.altar_type) === Number(nextEntry.altar_type)) {
    return;
  }

  altarEntries.set(id, nextEntry);
  scheduleAltarResultsRender();

  const tools = getAltarPlacementTools();
  const affectsMap = (
    id === selectedPersonalAltarId
    || id === selectedGuildAltarId
    || tools.showBlockedRadii
    || tools.showBuildAreaSlots
  );
  if (affectsMap) {
    scheduleAltarMapRender();
  }
}

function clearAltarFocusPing() {
  if (altarFocusPingTimer) {
    clearTimeout(altarFocusPingTimer);
    altarFocusPingTimer = null;
  }
  if (altarFocusPingMarker && map?.hasLayer(altarFocusPingMarker)) {
    map.removeLayer(altarFocusPingMarker);
  }
  altarFocusPingMarker = null;
}

function clearAltarOverlayTransitionTimer() {
  if (altarOverlayTransitionTimer) {
    clearTimeout(altarOverlayTransitionTimer);
    altarOverlayTransitionTimer = null;
  }
}

function fadeOutAltarOverlay() {
  if (!altarOverlay || altarOverlay.hidden) {
    return Promise.resolve();
  }

  clearAltarOverlayTransitionTimer();
  altarOverlay.dataset.transition = 'out';

  return new Promise((resolve) => {
    altarOverlayTransitionTimer = setTimeout(() => {
      altarOverlay.hidden = true;
      delete altarOverlay.dataset.transition;
      altarOverlayTransitionTimer = null;
      resolve();
    }, 220);
  });
}

function fadeInAltarOverlay() {
  if (!altarOverlay) {
    return Promise.resolve();
  }

  clearAltarOverlayTransitionTimer();
  altarOverlay.hidden = false;
  altarOverlay.dataset.transition = 'in';

  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        altarOverlayTransitionTimer = setTimeout(() => {
          delete altarOverlay.dataset.transition;
          altarOverlayTransitionTimer = null;
          resolve();
        }, 220);
      });
    });
  });
}

function showAltarFocusPing(entry) {
  if (!entry || !map) {
    return;
  }

  clearAltarFocusPing();
  altarFocusPingMarker = L.marker(oreToLatLng(entry.x, entry.y), {
    interactive: false,
    keyboard: false,
    zIndexOffset: 2000,
    icon: L.divIcon({
      className: 'altar-focus-ping-wrap',
      html: '<div class="altar-focus-ping-ring"></div><div class="altar-focus-ping-core"></div>',
      iconSize: [74, 74],
      iconAnchor: [37, 37],
    }),
  }).addTo(map);

  altarFocusPingTimer = setTimeout(() => {
    clearAltarFocusPing();
  }, 3000);
}

async function centerMapOnAltarEntry(altarId) {
  const entry = altarEntries.get(altarId);
  if (!entry || !map) {
    return;
  }

  const shouldRestoreOverlay = Boolean(altarOverlay && !altarOverlay.hidden);
  await fadeOutAltarOverlay();

  map.flyTo(oreToLatLng(entry.x, entry.y), Math.max(map.getZoom(), 1.8), {
    animate: true,
    duration: 0.6,
  });
  showAltarFocusPing(entry);

  await new Promise((resolve) => {
    setTimeout(resolve, 3000);
  });

  if (shouldRestoreOverlay && altarOverlay) {
    renderAltarSelectionSummary();
    renderAltarResults();
    await fadeInAltarOverlay();
  }
}

async function openAltarSelector() {
  if (!hasFeatureAccess('altars')) {
    return;
  }
  await window.livemapApi.openAltarSelectorWindow();
}

function toggleWorldBossOverlay() {
  if (!hasFeatureAccess('worldBossTimer')) {
    return;
  }

  saveUiSettings({
    worldBossOverlayVisible: !isWorldBossOverlayVisible(),
  });
  void syncWorldBossPresentation();
}

function buildOreLayers() {
  oreLayers = new Map();
  markerOnlyOreLayers = new Map();
  markerSpatialIndex = new Map();
  markerEntriesById = new Map();
  markerLeafletMarkers = new Map();
  markerDwellStarts = new Map();
  buildAreaCircles = [];
  const canvasRenderer = L.canvas({ padding: 0.4 });

  for (const marker of getMarkerEntries()) {
    const color = getMarkerColor(marker);
    const paneName = getMarkerPaneName(marker.key);
    ensureMarkerPane(marker.key);
    const clusterLayer = L.markerClusterGroup({
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
    const layer = L.layerGroup();
    const markerOnlyLayer = L.layerGroup();
    const buildAreaStyle = BUILD_AREA_STYLES[marker.key];

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
        .addTo(clusterLayer);
      markerLeafletMarkers.set(markerId, { leafletMarker, marker, color });

      if (buildAreaStyle) {
        const buildAreaCircle = L.circleMarker(latLng, {
          pane: paneName,
          radius: getBuildAreaRadiusAtCurrentZoom(),
          color: buildAreaStyle.color,
          weight: 1.5,
          fillColor: buildAreaStyle.fillColor,
          fillOpacity: buildAreaStyle.fillOpacity,
          renderer: canvasRenderer,
        })
          .bindPopup(popup, { autoPan: true, className: 'map-popup-shell' })
          .addTo(layer);
        buildAreaCircles.push({
          circle: buildAreaCircle,
          clusterLayer,
          hideWhenClustered: CLUSTER_HIDDEN_BUILD_AREA_KEYS.has(marker.key),
          layer,
          leafletMarker,
        });
      }

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

    layer.addLayer(clusterLayer);
    clusterLayer.on('animationend', refreshClusteredBuildAreaVisibility);
    clusterLayer.on('spiderfied', refreshClusteredBuildAreaVisibility);
    clusterLayer.on('unspiderfied', refreshClusteredBuildAreaVisibility);

    oreLayers.set(marker.key, layer);
    markerOnlyOreLayers.set(marker.key, markerOnlyLayer);
  }

  refreshBuildAreaCircles();
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
  updateMarkerStatus();
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

  const groups = getVisibleCategoryGroups();
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
    markerOnlyFiltersElement.appendChild(createMarkerOnlyWorldBossButton());
    if (altarPlacementTarget) {
      markerOnlyFiltersElement.appendChild(createMarkerOnlyAltarTargetStopButton());
    }
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

  if (activeGroup.category === 'standart' && hasFeatureAccess('altars')) {
    const altarButton = document.createElement('button');
    altarButton.type = 'button';
    altarButton.className = 'legend-item';
    altarButton.dataset.ore = 'altars';
    altarButton.dataset.active = altarsVisible ? 'true' : 'false';
    altarButton.innerHTML = `${createAltarFilterIconHtml()}<span class="legend-item-label">Altäre</span>`;
    altarButton.addEventListener('click', (event) => {
      event.stopPropagation();
      if (activeRoute) {
        return;
      }

      altarsVisible = !altarsVisible;
      syncAltarLayerVisibility();
      updateAltarTrackerButtonState();
      renderLegend();
      saveFilterState();
    });
    itemsBody.appendChild(altarButton);
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

function formatMarkerCount(value) {
  return new Intl.NumberFormat('de-DE').format(Math.max(0, Number(value) || 0));
}

function getActiveMarkerCount() {
  return getMarkerEntries().reduce((sum, marker) => {
    if (!activeOreFilters.has(marker.key)) {
      return sum;
    }

    return sum + (Array.isArray(marker.coordinates) ? marker.coordinates.length : 0);
  }, 0);
}

function updateMarkerStatus() {
  if (!markerStatusElement) {
    return;
  }

  const markerCount = getActiveMarkerCount();
  setStatusPill(markerStatusElement, `${formatMarkerCount(markerCount)} Marker`, 'marker');
}

function hasFeatureAccess(featureKey) {
  return Boolean(currentAuthState?.access?.features?.[featureKey]);
}

function isAccountBlocked() {
  return Boolean(currentAuthState?.access?.blocked);
}

function updateFeatureLockedState(element, isAllowed) {
  if (!element) {
    return;
  }

  element.classList.toggle('feature-locked', !isAllowed);
  if ('disabled' in element) {
    element.disabled = !isAllowed;
  }
}

function setMapAccountMenuOpen(isOpen) {
  mapAccountMenuOpen = Boolean(isOpen);
  if (mapAccountMenu) {
    mapAccountMenu.hidden = !mapAccountMenuOpen;
  }
}

function closeMapAccountMenu() {
  setMapAccountMenuOpen(false);
}

function closeAdminOverlay() {
  if (adminOverlay) {
    adminOverlay.hidden = true;
  }
}

function getFilteredAdminProfiles() {
  const query = adminSearchQuery.trim().toLowerCase();
  if (!query) {
    return adminProfilesCache;
  }

  return adminProfilesCache.filter((profile) => {
    const displayName = String(profile.discord_username || '').toLowerCase();
    const discordId = String(profile.discord_user_id || '').toLowerCase();
    const email = String(profile.email || '').toLowerCase();
    return displayName.includes(query) || discordId.includes(query) || email.includes(query);
  });
}

function renderAdminProfiles(profiles = adminProfilesCache) {
  if (!adminProfilesList) {
    return;
  }

  adminProfilesList.innerHTML = '';
  if (!profiles.length) {
    adminProfilesList.innerHTML = '<div class="planner-empty">Keine Profile gefunden.</div>';
    return;
  }

  for (const profile of profiles) {
    const isBlocked = Boolean(profile.blocked);
    const row = document.createElement('div');
    row.className = 'admin-row';
    row.dataset.userId = profile.id;
    row.innerHTML = `
      <div class="admin-row-meta">
        <strong class="admin-row-name">${profile.discord_username || profile.id}</strong>
        <span class="admin-row-discord">${profile.discord_user_id ? `Discord ID: ${profile.discord_user_id}` : 'Discord ID nicht verfügbar'}</span>
        <span class="admin-row-state ${isBlocked ? 'is-blocked' : 'is-active'}">${isBlocked ? 'Account gesperrt' : 'Account aktiv'}</span>
      </div>
      <div class="admin-row-actions">
        <select data-field="role">
        ${Object.entries(ACCESS_ROLE_LABELS).map(([role, label]) => `<option value="${role}" ${String(profile.role || 'public').toLowerCase() === role ? 'selected' : ''}>${label}</option>`).join('')}
        </select>
        <label class="admin-row-toggle">
          <input data-field="blocked" type="checkbox" ${isBlocked ? 'checked' : ''}>
          <span>Gesperrt</span>
        </label>
        <button class="planner-primary" type="button" data-action="save-access">Speichern</button>
      </div>
    `;
    adminProfilesList.appendChild(row);
  }
}

async function loadAdminProfiles() {
  if (!adminStatusMessage || !adminProfilesList) {
    return;
  }

  adminStatusMessage.textContent = 'Nutzer werden geladen...';
  try {
    const profiles = await window.livemapApi.listAdminProfiles();
    adminProfilesCache = profiles;
    const filteredProfiles = getFilteredAdminProfiles();
    renderAdminProfiles(filteredProfiles);
    adminStatusMessage.textContent = `${filteredProfiles.length} von ${profiles.length} Nutzern angezeigt.`;
  } catch (error) {
    adminStatusMessage.textContent = error?.message || 'Nutzer konnten nicht geladen werden.';
    adminProfilesList.innerHTML = '<div class="planner-empty">Zugriffsverwaltung konnte nicht geladen werden.</div>';
  }
}

async function openAdminOverlay() {
  if (!hasFeatureAccess('admin') || !adminOverlay) {
    return;
  }

  adminOverlay.hidden = false;
  await loadAdminProfiles();
}

function updateFeatureAccessUi() {
  if (!hasFeatureAccess('mapMarkerOnly') && isMarkerOnlyMode) {
    isMarkerOnlyMode = false;
    saveUiSettings({
      markerOnlyMode: false,
    });
    applyMapMode();
  }

  if (!hasFeatureAccess('findNearest') && nearestMarkerEnabled) {
    saveNearestMarkerState(false);
    refreshNearestMarkerLine();
    scheduleMarkerOnlyCanvasDraw();
  }

  if (!hasFeatureAccess('routePlanner')) {
    abortRoute();
  }

  if (!hasFeatureAccess('worldBossTimer') && isWorldBossOverlayVisible()) {
    saveUiSettings({
      worldBossOverlayVisible: false,
    });
  }

  updateFeatureLockedState(findNearestButton, hasFeatureAccess('findNearest'));
  updateFeatureLockedState(routePlannerButton, hasFeatureAccess('routePlanner'));
  updateFeatureLockedState(altarTrackerButton, hasFeatureAccess('altars'));
  updateFeatureLockedState(worldBossButton, hasFeatureAccess('worldBossTimer'));
  updateFeatureLockedState(mapModeButton, hasFeatureAccess('mapMarkerOnly'));
  updateFeatureLockedState(compactMapModeButton, hasFeatureAccess('mapMarkerOnly'));
  updateFeatureLockedState(
    markerOnlyFiltersElement?.querySelector('.marker-only-worldboss-button'),
    hasFeatureAccess('worldBossTimer'),
  );
  if (mapAccountAdminButton) {
    mapAccountAdminButton.hidden = !hasFeatureAccess('admin');
  }

  if (!hasFeatureAccess('altars')) {
    closeAltarOverlay();
  }

  if (!hasFeatureAccess('routePlanner')) {
    closeRoutePlannerOverlay();
  }

  if (!hasFeatureAccess('admin')) {
    closeAdminOverlay();
  }

  if (!hasFeatureAccess('worldBossTimer')) {
    void window.livemapApi.closeWorldBossWindow();
  }

  if (legend) {
    renderLegend();
  }

  syncWorldBossOverlayVisibility();
}

function cancelPendingLivemapStart() {
  if (livemapStartTimer) {
    window.clearTimeout(livemapStartTimer);
    livemapStartTimer = null;
  }
  livemapStartPending = false;
}

async function startLivemapWithDelay() {
  if (
    livemapStarted
    || livemapStartPending
    || !currentAuthState?.session?.loggedIn
    || isAccountBlocked()
  ) {
    return;
  }

  livemapStartPending = true;
  applyAuthState(currentAuthState);

  livemapStartTimer = window.setTimeout(async () => {
    livemapStartTimer = null;
    try {
      if (!currentAuthState?.session?.loggedIn) {
        return;
      }
      if (!appCoreInitialized) {
        await initializeAuthorizedApp();
      }
      livemapStarted = true;
    } finally {
      livemapStartPending = false;
      applyAuthState(currentAuthState);
    }
  }, 2000);
}

function syncLivemapStartState(state) {
  const loggedIn = Boolean(state?.session?.loggedIn && state?.session?.userId);
  const autoStartEnabled = Boolean(state?.preferences?.autoLogin);
  const blocked = Boolean(state?.access?.blocked);

  if (!loggedIn || blocked) {
    cancelPendingLivemapStart();
    livemapStarted = false;
    return;
  }

  if (livemapStarted || livemapStartPending) {
    return;
  }

  if (autoStartEnabled) {
    void startLivemapWithDelay();
  }
}

function applyAuthState(state) {
  currentAuthState = state || null;
  syncLivemapStartState(currentAuthState);

  if (!authOverlay || !authTitle) {
    return;
  }

  const configured = Boolean(state?.configured);
  const hasSessionIdentity = Boolean(state?.session?.loggedIn && state?.session?.userId);
  const loggedIn = hasSessionIdentity;
  const blocked = Boolean(state?.access?.blocked);
  const loading = Boolean(state?.loading || livemapStartPending);
  const accessMessage = String(state?.access?.message || '');

  document.body.classList.toggle('access-locked', !livemapStarted);
  authOverlay.hidden = !startupGateFinished || livemapStarted;

  authTitle.textContent = !loggedIn
    ? 'Discord Login erforderlich'
    : blocked
      ? 'Account gesperrt'
    : livemapStartPending
      ? 'Livemap wird gestartet'
      : 'Discord verbunden';

  if (authUser) {
    authUser.hidden = false;
  }
  if (loggedIn) {
    authUserName.textContent = state?.session?.displayName || 'Discord Nutzer';
    authUserEmail.textContent = blocked
      ? accessMessage
      : livemapStartPending
      ? 'Userdaten werden geladen...'
      : (state?.session?.email || '');
    authAvatar.textContent = '';
    authAvatar.style.backgroundImage = state?.session?.avatarUrl ? `url("${state.session.avatarUrl}")` : '';
  } else {
    if (authUserName) {
      authUserName.textContent = 'Bitte mit Discord anmelden';
    }
    if (authUserEmail) {
      authUserEmail.textContent = '';
    }
    if (authAvatar) {
      authAvatar.textContent = '';
      authAvatar.style.backgroundImage = '';
    }
  }

  if (mapAccount) {
    mapAccount.hidden = !startupGateFinished || !loggedIn || !livemapStarted;
  }
  if (loggedIn) {
    if (mapAccountName) {
      mapAccountName.textContent = state?.session?.displayName || 'Discord Nutzer';
    }
    if (mapAccountRole) {
      mapAccountRole.textContent = ACCESS_ROLE_LABELS[String(state?.access?.role || 'public').toLowerCase()] || 'Public';
    }
    if (mapAccountAvatar) {
      mapAccountAvatar.textContent = '';
      mapAccountAvatar.style.backgroundImage = state?.session?.avatarUrl ? `url("${state.session.avatarUrl}")` : '';
    }
  } else {
    closeMapAccountMenu();
    if (mapAccountName) {
      mapAccountName.textContent = 'Discord Nutzer';
    }
    if (mapAccountRole) {
      mapAccountRole.textContent = 'Public';
    }
    if (mapAccountAvatar) {
      mapAccountAvatar.textContent = '';
      mapAccountAvatar.style.backgroundImage = '';
    }
  }

  if (authAutoLoginCheckbox) {
    authAutoLoginCheckbox.checked = Boolean(state?.preferences?.autoLogin);
    authAutoLoginCheckbox.disabled = Boolean(state?.loading || blocked);
  }

  if (authLoginButton) {
    authLoginButton.disabled = loading || !configured || blocked;
    authLoginButton.hidden = blocked;
    authLoginButton.textContent = !loggedIn
      ? 'Mit Discord anmelden'
      : livemapStartPending
        ? 'Userdaten werden geladen...'
        : 'Livemap starten';
    authLoginButton.classList.add('planner-primary');
    authLoginButton.classList.remove('planner-danger');
    authLoginButton.classList.toggle('auth-button-loading', livemapStartPending);
  }
  if (authLogoutButton) {
    authLogoutButton.hidden = !loggedIn;
    authLogoutButton.disabled = loading || !loggedIn;
    authLogoutButton.style.display = loggedIn ? '' : 'none';
  }
  if (mapAccountRefreshButton) {
    mapAccountRefreshButton.disabled = loading || !configured || !loggedIn;
  }
  if (mapAccountLogoutButton) {
    mapAccountLogoutButton.disabled = loading || !loggedIn;
  }

  updateFeatureAccessUi();
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

function initializeAuthUi() {
  if (authLoginButton) {
    authLoginButton.addEventListener('click', async () => {
      try {
        if (currentAuthState?.session?.loggedIn) {
          await startLivemapWithDelay();
          return;
        }

        await window.livemapApi.signInWithDiscord();
      } catch (error) {
        if (authUserName) {
          authUserName.textContent = error?.message || 'Discord-Login fehlgeschlagen.';
        }
        if (authUserEmail) {
          authUserEmail.textContent = '';
        }
      }
    });
  }

  if (authAutoLoginCheckbox) {
    authAutoLoginCheckbox.addEventListener('change', async () => {
      try {
        const nextState = await window.livemapApi.setAuthAutoLogin(authAutoLoginCheckbox.checked);
        applyAuthState(nextState);
      } catch (error) {
        if (authUserName) {
          authUserName.textContent = error?.message || 'Automatischer Start konnte nicht gespeichert werden.';
        }
        if (authUserEmail) {
          authUserEmail.textContent = '';
        }
      }
    });
  }

  if (authLogoutButton) {
    authLogoutButton.addEventListener('click', async () => {
      try {
        const nextState = await window.livemapApi.signOutAuth();
        applyAuthState(nextState);
      } catch (error) {
        if (authUserName) {
          authUserName.textContent = error?.message || 'Abmeldung fehlgeschlagen.';
        }
        if (authUserEmail) {
          authUserEmail.textContent = '';
        }
      }
    });
  }

  if (authCloseButton) {
    authCloseButton.addEventListener('click', () => {
      window.livemapApi.closeWindow();
    });
  }

  if (mapAccountButton) {
    mapAccountButton.addEventListener('click', (event) => {
      event.stopPropagation();
      setMapAccountMenuOpen(!mapAccountMenuOpen);
    });
  }

  if (mapAccountRefreshButton) {
    mapAccountRefreshButton.addEventListener('click', async (event) => {
      event.stopPropagation();
      try {
        const nextState = await window.livemapApi.refreshAuthAccess();
        applyAuthState(nextState);
      } catch (error) {
        if (authUserName) {
          authUserName.textContent = error?.message || 'Zugriff konnte nicht aktualisiert werden.';
        }
        if (authUserEmail) {
          authUserEmail.textContent = '';
        }
      } finally {
        closeMapAccountMenu();
      }
    });
  }

  if (mapAccountLogoutButton) {
    mapAccountLogoutButton.addEventListener('click', async (event) => {
      event.stopPropagation();
      try {
        const nextState = await window.livemapApi.signOutAuth();
        applyAuthState(nextState);
      } catch (error) {
        if (authUserName) {
          authUserName.textContent = error?.message || 'Abmeldung fehlgeschlagen.';
        }
        if (authUserEmail) {
          authUserEmail.textContent = '';
        }
      } finally {
        closeMapAccountMenu();
      }
    });
  }

  if (mapAccountAdminButton) {
    mapAccountAdminButton.addEventListener('click', (event) => {
      event.stopPropagation();
      closeMapAccountMenu();
      void openAdminOverlay();
    });
  }

  if (adminCloseButton) {
    adminCloseButton.addEventListener('click', () => {
      closeAdminOverlay();
    });
  }

  if (adminRefreshButton) {
    adminRefreshButton.addEventListener('click', () => {
      void loadAdminProfiles();
    });
  }

  if (adminSearchInput) {
    adminSearchInput.addEventListener('input', () => {
      adminSearchQuery = adminSearchInput.value || '';
      const filteredProfiles = getFilteredAdminProfiles();
      renderAdminProfiles(filteredProfiles);
      if (adminStatusMessage) {
        adminStatusMessage.textContent = `${filteredProfiles.length} von ${adminProfilesCache.length} Nutzern angezeigt.`;
      }
    });
  }

  if (adminProfilesList) {
    adminProfilesList.addEventListener('click', async (event) => {
      const button = event.target.closest('button[data-action="save-access"]');
      if (!button) {
        return;
      }

      const row = button.closest('.admin-row');
      if (!row) {
        return;
      }

      const roleSelect = row.querySelector('select[data-field="role"]');
      const blockedInput = row.querySelector('input[data-field="blocked"]');
      button.disabled = true;
      try {
        await window.livemapApi.updateAdminProfile({
          userId: row.dataset.userId,
          role: roleSelect?.value,
          blocked: Boolean(blockedInput?.checked),
        });
        adminStatusMessage.textContent = 'Zugriff gespeichert.';
        await loadAdminProfiles();
        applyAuthState(await window.livemapApi.getAuthState());
      } catch (error) {
        adminStatusMessage.textContent = error?.message || 'Zugriff konnte nicht gespeichert werden.';
      } finally {
        button.disabled = false;
      }
    });
  }

  if (adminOverlay) {
    adminOverlay.addEventListener('click', (event) => {
      if (event.target === adminOverlay.querySelector('.dialog-backdrop')) {
        closeAdminOverlay();
      }
    });
  }

  window.livemapApi.onAuthState((state) => {
    applyAuthState(state);
  });
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
  coordYElement.textContent = Math.round(nextPosition.y).toString();
  coordZElement.textContent = Math.round(nextPosition.z).toString();
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
  void syncWorldBossPresentation();
  updateWorldBossOverlayStatuses();
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
  if (!hasFeatureAccess('mapMarkerOnly')) {
    return;
  }

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

async function initializeAuthorizedApp() {
  if (appCoreInitialized) {
    return;
  }

  appCoreInitialized = true;

  uiSettings = await window.livemapApi.getUiSettings();
  saveUiSettings({
    altarPlacementTools: {
      showBlockedRadii: false,
      showBuildAreaSlots: false,
      showGuildBuildAreaSlots: false,
    },
  });
  uiSettings = await window.livemapApi.getUiSettings();
  oreData = await window.livemapApi.getOreData();
  isMarkerOnlyMode = Boolean(uiSettings?.markerOnlyMode);
  isMarkerFrameVisible = Boolean(getViewSettings('markerView').frameVisible);

  initMap();
  buildOreLayers();
  ensureMarkerCooldownTimer();
  await applyCurrentViewSettings();

  setChannelStatus(null);
  updateMarkerStatus();
  setLiveStatus('Warten auf spielerkoordinate', 'waiting');

  window.livemapApi.onPlayerPosition((data) => {
    updatePlayerMarker(data);
  });

  window.livemapApi.onAltarPosition((data) => {
    upsertAltarEntry(data);
  });

  window.livemapApi.onAltarFocusRequest((entry) => {
    if (!entry) {
      return;
    }
    upsertAltarEntry(entry);
    void centerMapOnAltarEntry(entry.id);
  });

  window.livemapApi.onUiSettings((nextSettings) => {
    uiSettings = nextSettings || uiSettings;
  altarTrackingEnabled = Boolean(uiSettings?.altarTrackingEnabled);
  applySelectedAltarsFromSettings(uiSettings);
  const tools = getAltarPlacementTools();
  if (!tools.showBuildAreaSlots && !tools.showGuildBuildAreaSlots) {
    setAltarPlacementTarget(null);
  }
  renderWorldBossOverlay();
  void syncWorldBossPresentation();
  syncAltarLayerVisibility();
  renderSelectedAltarsOnMap();
  updateAltarTrackerButtonState();
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

  window.livemapApi.onAltarError((message) => {
    console.error(message);
  });

  renderUpdaterState(await window.livemapApi.getUpdaterState());
  playerPositionLockState = await window.livemapApi.getPlayerPositionLock();
  updatePlayerLockButtonState();
  renderWorldBossOverlay();
  startWorldBossOverlayLoop();
  void syncWorldBossPresentation();
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
      void toggleNearestMarkerWithRouteGuard();
    });
  }

  if (routePlannerButton) {
    routePlannerButton.addEventListener('click', async () => {
      const result = await window.livemapApi.openRoutePlanner();
      if (result && result.ok === false) {
        applyAuthState(await window.livemapApi.getAuthState());
      }
    });
  }

  if (altarTrackerButton) {
    altarTrackerButton.addEventListener('click', () => {
      void openAltarSelector();
    });
  }

  if (worldBossButton) {
    worldBossButton.addEventListener('click', () => {
      toggleWorldBossOverlay();
    });
  }

  if (worldBossOverlayList) {
    worldBossOverlayList.addEventListener('change', (event) => {
      const target = event.target;
      const bossId = target.dataset.worldbossOverlayAlert;
      if (!bossId) {
        return;
      }

      const tracker = getWorldBossTrackerSettings();
      const currentBoss = tracker.bosses?.[bossId] || {};
      saveUiSettings({
        worldBossTracker: {
          ...tracker,
          bosses: {
            ...(tracker.bosses || {}),
            [bossId]: {
              ...currentBoss,
              alertOffsetMinutes: target.value ? Number(target.value) : null,
              lastAlertSignature: null,
            },
          },
        },
      });
      renderWorldBossOverlay();
    });
  }

  if (altarBackdrop) {
    altarBackdrop.addEventListener('click', () => {
      void closeAltarOverlay();
    });
  }

  if (altarCloseButton) {
    altarCloseButton.addEventListener('click', () => {
      void closeAltarOverlay();
    });
  }

  if (altarSearchInput) {
    altarSearchInput.addEventListener('input', (event) => {
      altarSearchQuery = event.target.value || '';
      renderAltarResults();
    });
  }

  if (altarResultsList) {
    altarResultsList.addEventListener('click', (event) => {
      const button = event.target.closest('button[data-kind][data-altar-id]');
      if (!button) {
        return;
      }

      const kind = button.dataset.kind;
      const altarId = button.dataset.altarId;
      if (!altarId) {
        return;
      }

      if (kind === 'center') {
        centerMapOnAltarEntry(altarId);
        return;
      }

      setSelectedAltar(kind, altarId);
    });
  }

  if (altarClearSelectionButton) {
    altarClearSelectionButton.addEventListener('click', () => {
      clearSelectedAltars();
    });
  }

  if (playerLockButton) {
    playerLockButton.addEventListener('click', () => {
      void saveCurrentPlayerLock();
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

  window.livemapApi.onTutorialAction((action) => {
    if (action === 'border-enable') {
      if (!isMarkerFrameVisible) {
        toggleMarkerFrame();
      }
      void handleTutorialRequiredAction('border-enable');
      return;
    }

    if (action === 'border-disable') {
      if (isMarkerFrameVisible) {
        toggleMarkerFrame();
      }
      void handleTutorialRequiredAction('border-disable');
      return;
    }

    if (action === 'next') {
      void advanceTutorial();
      return;
    }

    if (action === 'skip') {
      void skipTutorial();
    }
  });

  if (routeMarkerList) {
    routeMarkerList.addEventListener('change', () => {
      syncRoutePlannerConfigFromInputs();
    });
  }

  if (routeUsePlayerStartInput) {
    routeUsePlayerStartInput.addEventListener('change', () => {
      syncRoutePlannerConfigFromInputs();
    });
  }

  const routeAltarConstraintInputs = [
    routeRequirePersonalAltarInput,
    routeRequireGuildAltarInput,
    routeRequireBothAltarsInput,
  ].filter(Boolean);
  for (const input of routeAltarConstraintInputs) {
    input.addEventListener('change', (event) => {
      if (event.target.checked) {
        applyRouteAltarConstraintSelection(event.target.id === 'routeRequireBothAltars'
          ? 'both'
          : event.target.id === 'routeRequireGuildAltar'
            ? 'guild'
            : 'personal');
      }
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
      void handleTutorialRequiredAction(isMarkerFrameVisible ? 'border-enable' : 'border-disable');
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

  if (tutorialButton) {
    tutorialButton.addEventListener('click', () => {
      void startTutorial(true);
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
    const altarSlotButton = event.target.closest('.altar-slot-target-button');
    if (altarSlotButton) {
      setAltarPlacementTarget({
        id: altarSlotButton.dataset.slotId || `altar-slot:${altarSlotButton.dataset.slotX}:${altarSlotButton.dataset.slotY}`,
        x: Number(altarSlotButton.dataset.slotX),
        y: Number(altarSlotButton.dataset.slotY),
        name: altarSlotButton.dataset.slotName || 'Freier Platz',
      });
      void window.livemapApi.closeAltarSelectorWindow();
      return;
    }

    const altarSlotClearButton = event.target.closest('.altar-slot-clear-button');
    if (altarSlotClearButton) {
      setAltarPlacementTarget(null);
      return;
    }

    const clickedPopover = (
      opacityPopover && opacityPopover.contains(event.target)
    );
    const clickedButton = (
      opacityButton && opacityButton.contains(event.target)
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

    if (mapAccountMenuOpen && mapAccount && !mapAccount.contains(event.target)) {
      closeMapAccountMenu();
    }
  });

  window.addEventListener('resize', () => {
    if (isMarkerOnlyMode && targetPlayerLatLng) {
      scheduleMarkerOnlyCanvasDraw();
    }
    if (!isMarkerOnlyMode) {
      applyWorldBossOverlayPosition();
    }
  });

  if (worldBossOverlayHeader) {
    worldBossOverlayHeader.addEventListener('pointerdown', startWorldBossOverlayDrag);
    worldBossOverlayHeader.addEventListener('pointermove', updateWorldBossOverlayDrag);
    worldBossOverlayHeader.addEventListener('pointerup', stopWorldBossOverlayDrag);
    worldBossOverlayHeader.addEventListener('pointercancel', stopWorldBossOverlayDrag);
  }

  window.addEventListener('pointermove', updateWorldBossOverlayDrag);
  window.addEventListener('pointerup', stopWorldBossOverlayDrag);
  window.addEventListener('pointercancel', stopWorldBossOverlayDrag);

  applyMapMode();
  updateFeatureAccessUi();
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      document.body.classList.add('app-ready');
      window.setTimeout(() => {
        void startTutorial();
      }, 240);
    });
  });
}

async function bootstrap() {
  try {
    const canContinue = await runStartupUpdaterGate();
    if (!canContinue) {
      return;
    }

    startupGateFinished = true;
    initializeAuthUi();
    applyAuthState(await window.livemapApi.getAuthState());
    renderUpdaterState(await window.livemapApi.getUpdaterState());
    window.livemapApi.onUpdaterState((state) => {
      renderUpdaterState(state);
    });
    document.body.classList.add('app-ready');
  } catch (error) {
    setLiveStatus('Warten auf spielerkoordinate', 'waiting');
    throw error;
  }
}

bootstrap();
