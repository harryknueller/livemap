const routePlannerCloseButton = document.getElementById('routePlannerCloseButton');
const routeUsePlayerStartInput = document.getElementById('routeUsePlayerStart');
const routeGenerateButton = document.getElementById('routeGenerateButton');
const routeMarkerList = document.getElementById('routeMarkerList');
const routeResultsList = document.getElementById('routeResultsList');
const routeResultsTitle = document.getElementById('routeResultsTitle');
const routeResultsSubtitle = document.getElementById('routeResultsSubtitle');
const routeSimulationOverlay = document.getElementById('routeSimulationOverlay');
const routeSimulationBarFill = document.getElementById('routeSimulationBarFill');
const routeSimulationPercent = document.getElementById('routeSimulationPercent');
const routeSimulationCount = document.getElementById('routeSimulationCount');

const ROUTE_VARIANT_COUNT = 5;
const ROUTE_SIMULATION_DURATION_MS = 5000;

let oreData = {};
let uiSettings = null;
let playerPosition = null;
let currentChannelPort = null;
let routePlannerConfig = null;
let routePlannerResults = [];
let routeState = {
  activeRoute: null,
  previewRoute: null,
  paused: false,
};
let openCategories = new Set();
let routeSimulationToken = 0;

function getMarkerEntries() {
  return Object.values(oreData);
}

function getRoutePlannerMarkers() {
  return getMarkerEntries().filter((marker) => marker.category !== 'standart');
}

function getCurrentViewKey() {
  return uiSettings?.markerOnlyMode ? 'markerView' : 'normalView';
}

function isMarkerOnlyMode() {
  return getCurrentViewKey() === 'markerView';
}

function getDefaultRoutePlannerConfig() {
  const activeFilters = new Set(uiSettings?.[getCurrentViewKey()]?.activeOreFilters || []);
  const markerConfig = {};

  for (const marker of getRoutePlannerMarkers()) {
    markerConfig[marker.key] = {
      enabled: activeFilters.size ? activeFilters.has(marker.key) : true,
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

  uiSettings = {
    ...(uiSettings || {}),
    routePlannerConfig,
  };
  window.livemapApi.setUiSettings({ routePlannerConfig });
}

function syncRoutePlannerConfigFromInputs() {
  const config = getRoutePlannerConfig();
  if (routeUsePlayerStartInput) {
    config.usePlayerStart = routeUsePlayerStartInput.checked;
  }
  saveRoutePlannerConfig();
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
  const overrides = {
    flammenmargarete: 'flammenmargarite.png',
    mystische_lilie: 'mystische Lilie.png',
    weltbosse: 'weltboss.png',
  };
  const fileName = overrides[marker.name] || `${marker.name}.png`;
  return `map/icons/${encodeURIComponent(fileName).replace(/%2F/g, '/')}`;
}

function getRoutePlannerCategoryGroups() {
  const order = { standart: 0, erze: 1, pflanzen: 2 };
  const labels = { erze: 'Erze', pflanzen: 'Pflanzen', standart: 'Standart' };
  const groups = new Map();

  for (const marker of getRoutePlannerMarkers()) {
    if (!groups.has(marker.category)) {
      groups.set(marker.category, []);
    }
    groups.get(marker.category).push(marker);
  }

  return Array.from(groups.entries())
    .sort(([left], [right]) => (order[left] ?? 999) - (order[right] ?? 999))
    .map(([category, markers]) => ({
      category,
      label: labels[category] || category,
      markers: markers.sort((left, right) => left.name.localeCompare(right.name)),
    }));
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

function getMarkerCoordinateId(markerKey, index) {
  return `${markerKey}:${index}`;
}

function isMarkerOnCooldown(markerId, now = Date.now()) {
  const channelKey = currentChannelPort ? String(currentChannelPort) : null;
  if (!channelKey) {
    return false;
  }

  const expiresAt = uiSettings?.markerCooldownsByChannel?.[channelKey]?.[markerId];
  return Number(expiresAt) > now;
}

function countCompletedRouteMarkers(route) {
  if (!route?.points?.length) {
    return 0;
  }

  return route.points.reduce((sum, point) => (
    sum + (isMarkerOnCooldown(point.id) ? 1 : 0)
  ), 0);
}

function getRouteMarkerBreakdown(route) {
  const breakdown = new Map();
  for (const point of route?.points || []) {
    if (!breakdown.has(point.markerName)) {
      breakdown.set(point.markerName, { total: 0, completed: 0 });
    }
    const entry = breakdown.get(point.markerName);
    entry.total += 1;
    if (isMarkerOnCooldown(point.id)) {
      entry.completed += 1;
    }
  }
  return Array.from(breakdown.entries());
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
    pool.push(...sortedPoints.slice(offset, offset + desiredCount));
  }

  return { startPoint, pool };
}

function createSeededRandom(seed) {
  let state = seed % 2147483647;
  if (state <= 0) {
    state += 2147483646;
  }

  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

function buildRouteFromPool(startPoint, points, variantIndex, random) {
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
      const randomness = random ? ((random() - 0.5) * 18) : 0;

      if (variantIndex === 1) {
        score = distance * 0.94 + Math.abs(point.x - startPoint.x) * 0.02;
      } else if (variantIndex === 2) {
        score = distance + (route.some((entry) => entry.markerKey === point.markerKey) ? 18 : -12);
      } else if (variantIndex === 3) {
        score = distance * 0.92 + Math.abs(point.x - startPoint.x) * 0.03;
      } else if (variantIndex === 4) {
        score = distance * 0.88 + Math.abs(point.y - startPoint.y) * 0.03;
      } else if (variantIndex === 5) {
        score = distance * 0.9 + Math.abs(point.x - current.x) * 0.03 + Math.abs(point.y - startPoint.y) * 0.02;
      } else if (variantIndex === 6) {
        score = distance + (route.length % 2 === 0 ? -10 : 8);
      }

      score += randomness;

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

function buildRouteVariant(variantIndex, simulationIndex = 0) {
  const config = getRoutePlannerConfig();
  const flavorIndex = variantIndex % 7;
  const random = createSeededRandom((simulationIndex + 1) * 7919 + (variantIndex + 11) * 104729);
  const { startPoint, pool } = buildRoutePointPool(config, simulationIndex + flavorIndex);
  const routePoints = buildRouteFromPool(startPoint, pool, flavorIndex, random);
  const metrics = calculateRouteMetrics(startPoint, routePoints);
  return {
    id: `route-${simulationIndex + 1}-${variantIndex + 1}`,
    index: variantIndex,
    startPoint,
    configSnapshot: structuredClone(config),
    points: routePoints,
    ...metrics,
  };
}

function getRouteSignature(route) {
  return route.points.map((point) => point.id).join('|');
}

function openRouteSimulationProgress() {
  if (!routeSimulationOverlay) {
    return;
  }

  routeSimulationOverlay.hidden = false;
  routeSimulationOverlay.dataset.visible = 'true';
}

function closeRouteSimulationProgress() {
  if (!routeSimulationOverlay) {
    return;
  }

  delete routeSimulationOverlay.dataset.visible;
  routeSimulationOverlay.hidden = true;
}

function updateRouteSimulationProgress(percent, count) {
  if (routeSimulationBarFill) {
    routeSimulationBarFill.style.width = `${percent}%`;
  }
  if (routeSimulationPercent) {
    routeSimulationPercent.textContent = `${percent}%`;
  }
  if (routeSimulationCount) {
    routeSimulationCount.textContent = String(count);
  }
}

async function generateRouteSuggestions() {
  const currentToken = ++routeSimulationToken;
  const startedAt = performance.now();
  const deadline = startedAt + ROUTE_SIMULATION_DURATION_MS;
  const candidateMap = new Map();
  let simulatedRoutes = 0;

  openRouteSimulationProgress();
  updateRouteSimulationProgress(0, 0);
  routeGenerateButton.disabled = true;

  while (performance.now() < deadline) {
    for (let inner = 0; inner < 40; inner += 1) {
      const variantIndex = simulatedRoutes % 7;
      const simulationIndex = Math.floor(simulatedRoutes / 7);
      const candidate = buildRouteVariant(variantIndex, simulationIndex);
      simulatedRoutes += 1;

      if (!candidate.points.length) {
        continue;
      }

      const signature = getRouteSignature(candidate);
      const existing = candidateMap.get(signature);
      if (!existing || candidate.efficiencyScore < existing.efficiencyScore) {
        candidateMap.set(signature, candidate);
      }
    }

    if (currentToken !== routeSimulationToken) {
      return;
    }

    const elapsed = performance.now() - startedAt;
    const percent = Math.min(100, Math.round((elapsed / ROUTE_SIMULATION_DURATION_MS) * 100));
    updateRouteSimulationProgress(percent, simulatedRoutes);
    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  const rankedRoutes = Array.from(candidateMap.values())
    .sort((left, right) => left.efficiencyScore - right.efficiencyScore)
    .slice(0, ROUTE_VARIANT_COUNT)
    .map((route, index) => ({ ...route, rank: index + 1, id: `route-${index + 1}` }));

  if (currentToken !== routeSimulationToken) {
    return;
  }

  routePlannerResults = rankedRoutes;
  updateRouteSimulationProgress(100, simulatedRoutes);
  closeRouteSimulationProgress();
  routeGenerateButton.disabled = false;
}

function formatMeters(value) {
  return `${Math.round(value)}m`;
}

function toggleMarkerCard(markerKey) {
  const config = getRoutePlannerConfig();
  if (!config.markerConfig[markerKey]) {
    config.markerConfig[markerKey] = { enabled: false, minCount: 1 };
  }

  config.markerConfig[markerKey].enabled = !config.markerConfig[markerKey].enabled;
  saveRoutePlannerConfig();
  renderRouteMarkerList();
}

function toggleCategory(category) {
  if (openCategories.has(category)) {
    openCategories.delete(category);
  } else {
    openCategories.add(category);
  }

  renderRouteMarkerList();
}

function renderRouteMarkerList() {
  const config = getRoutePlannerConfig();
  routeMarkerList.innerHTML = '';

  for (const group of getRoutePlannerCategoryGroups()) {
    const groupElement = document.createElement('section');
    groupElement.className = 'planner-marker-group';

    const headerButton = document.createElement('button');
    headerButton.type = 'button';
    headerButton.className = 'planner-category-toggle';
    headerButton.dataset.open = openCategories.has(group.category) ? 'true' : 'false';
    headerButton.innerHTML = `<span>${group.label}</span><span>${openCategories.has(group.category) ? '\u2212' : '+'}</span>`;
    headerButton.addEventListener('click', () => {
      toggleCategory(group.category);
    });
    groupElement.appendChild(headerButton);

    if (openCategories.has(group.category)) {
      for (const marker of group.markers) {
        const markerConfig = config.markerConfig[marker.key] || { enabled: false, minCount: 1 };
        const row = document.createElement('div');
        row.className = 'planner-marker-row';

        const card = document.createElement('button');
        card.type = 'button';
        card.className = 'planner-marker-card';
        card.dataset.active = markerConfig.enabled ? 'true' : 'false';
        card.innerHTML = `
          <img src="${getMarkerIconPath(marker)}" alt="">
          <span>${formatMarkerLabel(marker.name)}</span>
        `;
        card.addEventListener('click', () => {
          toggleMarkerCard(marker.key);
        });

        const inputWrap = document.createElement('span');
        inputWrap.className = 'planner-marker-inputs';
        inputWrap.innerHTML = `<input data-field="minCount" data-marker-key="${marker.key}" type="number" min="1" max="25" value="${markerConfig.minCount}">`;

        row.appendChild(card);
        row.appendChild(inputWrap);
        groupElement.appendChild(row);
      }
    }

    routeMarkerList.appendChild(groupElement);
  }
}

function renderActiveRoute() {
  routeResultsTitle.textContent = 'Aktive Route';
  routeResultsSubtitle.textContent = 'Route ist aktiv';
  routeGenerateButton.hidden = true;
  routeResultsList.innerHTML = '';

  const route = routeState.activeRoute;
  if (!route) {
    return;
  }

  const completedCount = countCompletedRouteMarkers(route);
  const breakdownRows = getRouteMarkerBreakdown(route)
    .map(([markerName, counts]) => `<div><span>${formatMarkerLabel(markerName)}</span><strong>${counts.completed} / ${counts.total}</strong></div>`)
    .join('');
  const card = document.createElement('article');
  card.className = 'planner-route-card planner-route-card-active';
  card.innerHTML = `
    <div class="planner-route-head">
      <strong>Route läuft</strong>
      <span>${route.points.length} Marker</span>
    </div>
    <div class="planner-route-metrics">
      <div><span>Komplette Strecke</span><strong>${formatMeters(route.totalDistance)}</strong></div>
      <div><span>Ø Abstand</span><strong>${formatMeters(route.averageStepDistance)}</strong></div>
      <div><span>Abgelaufen</span><strong>${completedCount} / ${route.points.length}</strong></div>
      ${breakdownRows}
    </div>
    <div class="planner-route-actions-row">
      <button class="planner-danger" id="routeAbortActionButton" type="button">Route abbrechen</button>
    </div>
  `;
  routeResultsList.appendChild(card);

  card.querySelector('#routeAbortActionButton')?.addEventListener('click', () => {
    window.livemapApi.abortRoute();
  });
}

function renderRouteSuggestions() {
  routeResultsTitle.textContent = 'Vorschläge';
  routeResultsSubtitle.textContent = 'Nach Effizienz sortiert';
  routeGenerateButton.hidden = false;
  routeResultsList.innerHTML = '';

  if (!routePlannerResults.length) {
    routeResultsList.innerHTML = '<div class="planner-empty">Keine Route verfügbar. Marker-Auswahl oder Mindestanzahl anpassen.</div>';
    return;
  }

  for (const route of routePlannerResults) {
    const previewActive = routeState.previewRoute?.id === route.id;
    const card = document.createElement('article');
    card.className = 'planner-route-card';
    const previewAction = isMarkerOnlyMode()
      ? ''
      : `<button class="planner-secondary planner-preview-button" data-active="${previewActive ? 'true' : 'false'}" data-action="preview" data-route-id="${route.id}" type="button">${previewActive ? 'Vorschau stoppen' : 'Vorschau'}</button>`;
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
        ${previewAction}
        <button class="planner-primary" data-action="start" data-route-id="${route.id}" type="button">Starten</button>
      </div>
    `;
    routeResultsList.appendChild(card);
  }
}

function renderResults() {
  if (routeState.activeRoute) {
    renderActiveRoute();
  } else {
    renderRouteSuggestions();
  }
}

async function init() {
  oreData = await window.livemapApi.getOreData();
  uiSettings = await window.livemapApi.getUiSettings();
  routeState = await window.livemapApi.getRouteState();
  routePlannerConfig = null;
  openCategories = new Set();
  if (routeUsePlayerStartInput) {
    routeUsePlayerStartInput.checked = Boolean(getRoutePlannerConfig().usePlayerStart);
  }
  renderRouteMarkerList();
  renderResults();
}

routePlannerCloseButton?.addEventListener('click', () => {
  window.livemapApi.closeRoutePlanner();
});

routeGenerateButton?.addEventListener('click', () => {
  syncRoutePlannerConfigFromInputs();
  generateRouteSuggestions().then(() => {
    renderRouteSuggestions();
  });
});

routeMarkerList?.addEventListener('change', (event) => {
  const input = event.target.closest('input[data-marker-key]');
  if (!input) {
    return;
  }

  const config = getRoutePlannerConfig();
  const markerKey = input.dataset.markerKey;
  if (!config.markerConfig[markerKey]) {
    config.markerConfig[markerKey] = { enabled: false, minCount: 1 };
  }
  config.markerConfig[markerKey].minCount = Math.max(1, Number(input.value) || 1);
  saveRoutePlannerConfig();
});

routeResultsList?.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) {
    return;
  }

  const route = routePlannerResults.find((item) => item.id === button.dataset.routeId);
  if (!route) {
    return;
  }

  if (button.dataset.action === 'preview') {
    const nextPreview = routeState.previewRoute?.id === route.id ? null : route;
    window.livemapApi.previewRoute(nextPreview);
  } else if (button.dataset.action === 'start') {
    window.livemapApi.startRoute(route);
  }
});

window.livemapApi.onPlayerPosition((data) => {
  playerPosition = data;
  currentChannelPort = data.port;
  if (routeState.activeRoute) {
    renderActiveRoute();
  }
});

window.livemapApi.onRouteState((nextState) => {
  routeState = nextState || {
    activeRoute: null,
    previewRoute: null,
    paused: false,
  };
  renderResults();
});

init();
