const altarCloseButton = document.getElementById('altarCloseButton');
const altarSearchInput = document.getElementById('altarSearchInput');
const altarClearSelectionButton = document.getElementById('altarClearSelectionButton');
const altarSelectionSummary = document.getElementById('altarSelectionSummary');
const altarShowBlockedRadiiInput = document.getElementById('altarShowBlockedRadii');
const altarShowBuildAreaSlotsInput = document.getElementById('altarShowBuildAreaSlots');
const altarShowGuildBuildAreaSlotsInput = document.getElementById('altarShowGuildBuildAreaSlots');
const altarResultsMeta = document.getElementById('altarResultsMeta');
const altarResultsList = document.getElementById('altarResultsList');

const PERSONAL_ALTAR_ICON_PATH = 'marker/standart/altar.png';
const GUILD_ALTAR_ICON_PATH = 'marker/standart/gildenaltar.png';
const CENTER_ICON_PATH = 'map/playercenter.png';

let uiSettings = null;
let authState = null;
let altarEntries = new Map();
let altarSearchQuery = '';
let selectedPersonalAltarId = null;
let selectedGuildAltarId = null;
let closingWindow = false;
let altarUiRenderTimer = null;

function getAltarPlacementTools() {
  return {
    showBlockedRadii: Boolean(uiSettings?.altarPlacementTools?.showBlockedRadii),
    showBuildAreaSlots: Boolean(uiSettings?.altarPlacementTools?.showBuildAreaSlots),
    showGuildBuildAreaSlots: Boolean(uiSettings?.altarPlacementTools?.showGuildBuildAreaSlots),
  };
}

function hasFeatureAccess(featureKey) {
  return Boolean(authState?.access?.features?.[featureKey]);
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

function saveUiSettings(patch) {
  uiSettings = {
    ...(uiSettings || {}),
    ...patch,
  };
  window.livemapApi.setUiSettings(patch);
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

function saveAltarPlacementTools(patch) {
  const nextTools = {
    ...getAltarPlacementTools(),
    ...(patch || {}),
  };

  if (nextTools.showBuildAreaSlots) {
    nextTools.showGuildBuildAreaSlots = false;
  }
  if (nextTools.showGuildBuildAreaSlots) {
    nextTools.showBuildAreaSlots = false;
  }

  saveUiSettings({
    altarPlacementTools: nextTools,
  });
}

function renderAltarPlacementTools() {
  const tools = getAltarPlacementTools();
  if (altarShowBlockedRadiiInput) {
    altarShowBlockedRadiiInput.checked = tools.showBlockedRadii;
  }
  if (altarShowBuildAreaSlotsInput) {
    altarShowBuildAreaSlotsInput.checked = tools.showBuildAreaSlots;
  }
  if (altarShowGuildBuildAreaSlotsInput) {
    altarShowGuildBuildAreaSlotsInput.checked = tools.showGuildBuildAreaSlots;
  }
}

function createAltarSummaryLabelHtml(kind) {
  const iconPath = kind === 'guild' ? GUILD_ALTAR_ICON_PATH : PERSONAL_ALTAR_ICON_PATH;
  return `<span class="altar-summary-label"><img src="${iconPath}" alt=""></span>`;
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

function matchesAltarSearch(entry, query) {
  if (!query) {
    return true;
  }

  const haystack = `${entry.name} ${entry.x} ${entry.y}`.toLowerCase();
  return haystack.includes(query);
}

function getFilteredAltars() {
  const query = altarSearchQuery.trim().toLowerCase();
  return Array.from(altarEntries.values())
    .filter((entry) => [1, 2].includes(Number(entry.altar_type)))
    .filter((entry) => matchesAltarSearch(entry, query))
    .sort((left, right) => left.name.localeCompare(right.name));
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
      actionButtons.push(`<button class="altar-action-button altar-action-button-personal" data-kind="personal" data-altar-id="${entry.id}" type="button" aria-label="Persönlichen Altar setzen"><img src="${PERSONAL_ALTAR_ICON_PATH}" alt="Persönlicher Altar"></button>`);
    }
    if (altarType === 2) {
      actionButtons.push(`<button class="altar-action-button altar-action-button-guild" data-kind="guild" data-altar-id="${entry.id}" type="button" aria-label="Gildenaltar setzen"><img src="${GUILD_ALTAR_ICON_PATH}" alt="Gildenaltar"></button>`);
    }

    actionButtons.push(`<button class="altar-action-button altar-action-button-center" data-kind="center" data-altar-id="${entry.id}" type="button" aria-label="Auf Altar zentrieren"><img src="${CENTER_ICON_PATH}" alt="Zentrieren"></button>`);

    const card = document.createElement('article');
    card.className = 'altar-result-card';
    card.innerHTML = `
      <div class="altar-result-head">
        <strong>${entry.name}</strong>
      </div>
      <div class="altar-result-actions">
        ${actionButtons.join('')}
      </div>
    `;
    altarResultsList.appendChild(card);
  }
}

function scheduleAltarUiRender() {
  if (altarUiRenderTimer) {
    return;
  }

  altarUiRenderTimer = setTimeout(() => {
    altarUiRenderTimer = null;
    renderAltarResults();
    renderAltarSelectionSummary();
  }, 80);
}

function setSelectedAltar(kind, altarId) {
  if (kind === 'guild') {
    selectedGuildAltarId = altarId;
  } else {
    selectedPersonalAltarId = altarId;
  }

  renderAltarSelectionSummary();
  renderAltarResults();
  saveSelectedAltarsState();
}

function clearSelectedAltars() {
  selectedPersonalAltarId = null;
  selectedGuildAltarId = null;
  renderAltarSelectionSummary();
  renderAltarResults();
  saveSelectedAltarsState();
}

function upsertAltarEntry(data) {
  const x = Number(data?.x);
  const y = Number(data?.y);
  const id = String(data?.id || `${data?.name || 'altar'}:${x}:${y}`);
  const name = String(data?.name || 'Unbekannter Altar').trim();
  const altarType = Number(data?.altar_type);

  if (!Number.isFinite(x) || !Number.isFinite(y) || !id) {
    return;
  }

  altarEntries.set(id, {
    id,
    name,
    x,
    y,
    altar_type: Number.isFinite(altarType) ? altarType : null,
  });
  scheduleAltarUiRender();
}

async function closeAltarWindow() {
  if (closingWindow) {
    return;
  }
  closingWindow = true;
  await window.livemapApi.setAltarTracking(false);
  await window.livemapApi.closeAltarSelectorWindow();
}

function applyAuthState(state) {
  authState = state || null;
  if (!hasFeatureAccess('altars')) {
    void closeAltarWindow();
  }
}

async function initialize() {
  uiSettings = await window.livemapApi.getUiSettings();
  authState = await window.livemapApi.getAuthState();
  applySelectedAltarsFromSettings(uiSettings);
  renderAltarSelectionSummary();
  renderAltarResults();
  renderAltarPlacementTools();

  if (!hasFeatureAccess('altars')) {
    await closeAltarWindow();
    return;
  }

  await window.livemapApi.setAltarTracking(true);

  window.livemapApi.onAltarPosition((data) => {
    upsertAltarEntry(data);
  });

  window.livemapApi.onUiSettings((nextSettings) => {
    uiSettings = nextSettings || uiSettings;
    applySelectedAltarsFromSettings(uiSettings);
    renderAltarSelectionSummary();
    renderAltarResults();
    renderAltarPlacementTools();
  });

  window.livemapApi.onAuthState((state) => {
    applyAuthState(state);
  });
}

altarCloseButton?.addEventListener('click', () => {
  void closeAltarWindow();
});

altarSearchInput?.addEventListener('input', (event) => {
  altarSearchQuery = event.target.value || '';
  renderAltarResults();
});

altarClearSelectionButton?.addEventListener('click', () => {
  clearSelectedAltars();
});

altarShowBlockedRadiiInput?.addEventListener('change', (event) => {
  saveAltarPlacementTools({ showBlockedRadii: Boolean(event.target.checked) });
});

altarShowBuildAreaSlotsInput?.addEventListener('change', (event) => {
  saveAltarPlacementTools({
    showBuildAreaSlots: Boolean(event.target.checked),
    showGuildBuildAreaSlots: Boolean(event.target.checked) ? false : getAltarPlacementTools().showGuildBuildAreaSlots,
  });
});

altarShowGuildBuildAreaSlotsInput?.addEventListener('change', (event) => {
  saveAltarPlacementTools({
    showGuildBuildAreaSlots: Boolean(event.target.checked),
    showBuildAreaSlots: Boolean(event.target.checked) ? false : getAltarPlacementTools().showBuildAreaSlots,
  });
});

altarResultsList?.addEventListener('click', (event) => {
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
    const entry = altarEntries.get(altarId);
    if (entry) {
      void window.livemapApi.focusAltarOnMap(entry);
    }
    return;
  }

  setSelectedAltar(kind, altarId);
});

window.addEventListener('beforeunload', () => {
  if (!closingWindow) {
    void window.livemapApi.setAltarTracking(false);
  }
});

void initialize();
