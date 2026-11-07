/* =========================================================================
   BOTANICAL EXPLORER ENGINE (plants_app.js)
   ========================================================================= */

const USER_EDITS_STORAGE_KEY = 'botanical_explorer_user_edits_v1';

let plants = [];
let baselinePlantsById = {};
let userPlantEdits = {};

let selectedZone = 'all';
let selectedClimate = 'all';
let searchQuery = '';
let selectedSun = 'all';
let selectedWater = 'all';
let filterInfographics = false;
let filterAvailable = false; // Available (inventory > 0, default OFF)
let filterNonInvasive = false;
let filterSepticSafe = false;

let isAllPlantsMode = false;
let columnCategories = ['Tree','Fruit','Fern'];

// Active subtype per category (Single-select: at most 1 subtype per category, or empty for all)
let selectedSubtypesByCategory = {};

// Persistent Lightbox Edit Mode States (stay ON until turned OFF)
let isEditMode = false;
let isInventoryEditMode = false;

// "Show Items" Dialog Checkboxes State
let showSamplePicture = true;
let showLatinName = false;
let useMetric = false;        // Metric toggle (°C for zones, m/cm for heights)
let showZone = true;
let showClimate = false;
let showWater = true;
let showHeight = true;
let showFlower = true;        // Flower (size & color) placed to the right of Height
let showCost = false;
let showLifespan = true;
let showOrigin = true;
let showInventory = false;    // Defaults to OFF
let showDateAcquired = false; // Defaults to OFF
let showLocation = false;     // Defaults to OFF
let showWarn = false;
let showNotes = false;
let showPropagation = false;
let showGridView = false;

// First visible plant in the main list (used for live preview)
let firstVisiblePlant = null;

// Ordered list of currently displayed plants across active columns (for modal navigation)
let visiblePlantsOrder = [];

// Sorting State
let currentSortGroup = null;
let currentSortDirection = null;

// Hover overlay debouncer for top buttons/pills
let hoverOverlayTimeout = null;

// Discrete Height Breaks (in feet)
const HEIGHT_BREAKS = [0, 1, 2, 5, 10, 15, 20, 40, 80, Infinity];
const HEIGHT_LABELS_IMPERIAL = ['0', '1 ft', '2 ft', '5 ft', '10 ft', '15 ft', '20 ft', '40 ft', '80 ft', 'Any'];
const HEIGHT_LABELS_METRIC = ['0', '0.3 m', '0.6 m', '1.5 m', '3 m', '4.5 m', '6 m', '12 m', '24 m', 'Any'];
let minHeightIdx = 0;
let maxHeightIdx = 9;

// Discrete Cost Breaks
const COST_BREAKS = [25, 50, 75, 100, 125, 150, 175, 200, Infinity];
const COST_LABELS = ['≤ $25', '≤ $50', '≤ $75', '≤ $100', '≤ $125', '≤ $150', '≤ $175', '≤ $200', 'Any Cost'];
let maxCostIdx = 8;

// Discrete Lifespan Breaks (in Years)
const LIFESPAN_BREAKS = [0, 1, 3, 5, 10, 25, 50, 100, Infinity];
const LIFESPAN_LABELS = ['0', '1 yr', '3 yrs', '5 yrs', '10 yrs', '25 yrs', '50 yrs', '100 yrs', 'Any'];
let minLifespanIdx = 0;
let maxLifespanIdx = 8;

// Lightbox Zoom, Pan & Fullscreen State (1.0 = 100% to 4.0 = 400%)
let currentZoom = 1;
let panX = 0;
let panY = 0;
let isPanning = false;
let panStartX = 0;
let panStartY = 0;
let isLightboxFullscreen = false;
let currentPlantInModal = null;

// Categories
const ALL_CATEGORIES = [
  { val: "Tree", label: "🌳 Tree", file: "tree" },
  { val: "Conifer", label: "🌲 Conifer", file: "conifer" },
  { val: "Fruit", label: "🍎 Fruit", file: "fruit" },
  { val: "Shrub", label: "🌺 Shrub", file: "shrub" },
  { val: "Fern", label: "🌿 Fern", file: "fern" },
  { val: "Cover", label: "☘️ Cover", file: "cover" },
  { val: "Perennial", label: "🌸 Perennial", file: "perennial" },
  { val: "Annual", label: "🌻 Annual", file: "annual" },
  { val: "Herb", label: "🌿 Herb", file: "herb" },
  { val: "Fungus", label: "🍄 Fungus", file: "fungus" },
  { val: "Specialty", label: "🪴 Specialty", file: "specialty" },
  { val: "Cactus", label: "🌵 Cactus", file: "cactus" }
];

// Canonical Subtypes per Category for the Edit Mode Dropdown
const CATEGORY_SUBTYPES_MAP = {
  "Tree": ["Evergreen", "Deciduous", "Tropical"],
  "Conifer": ["Pine","Spruce","Firs","Hemlocks","Cedar","Redwood"],
  "Shrub": ["Evergreen", "Deciduous", "Tropical"],
  "Fruit": ["Pome", "Stone", "Citrus", "Native & Specialty"],
  "Fern": ["Fern", "Moss"],
  "Cover": ["Grasses & Lilyturf", "Flowering Groundcovers", "Foliage & Woody Groundcovers"],
  "Perennial": ["Shade Perennials", "Sun Perennials"],
  "Annual": ["Warm-Season", "Cool-Season", "Foliage & Accents"],
  "Herb": ["Perennial Culinary", "Annual & Tender", "Aromatic & Medicinal"],
  "Fungus": ["Cultivated & Culinary", "Wild & Foraged", "Medicinal"],
  "Specialty": ["Carnivorous", "Trap & Corpse Flowers", "Botanical Oddities"],
  "Cactus": ["Cacti", "Agaves & Yuccas", "Succulents"]
};

const CLIMATES_LIST = [
  "Tropical", "Subtropical", "Warm / Dry", "Wet / Boggy", "Temperate", "Woodland Shade", "Northern", "House Plant"
];

const SUN_OPTIONS = ["Full Sun", "Part Sun", "Part Shade", "Full Shade"];
const WATER_OPTIONS = ["Low", "Medium", "High", "Bog"];

const CLIMATE_ZONE_RULES = {
  "Tropical": { min: 10, max: 13 },
  "Subtropical": { min: 8, max: 11 },
  "Warm / Dry": { min: 8, max: 11 },
  "Wet / Boggy": { min: 3, max: 10 },
  "Temperate": { min: 5, max: 8 },
  "Woodland Shade": { min: 3, max: 8 },
  "Northern": { min: 3, max: 6 },
  "House Plant": { min: 1, max: 13 }
};

// Zone metadata with custom Metric °C ranges:
const ZONE_METADATA = {
  13: { temp: "60°F to 70°F",   tempC: "15°C to 20°C",   minF: 60,  maxF: 70,  minC: 15,  maxC: 20,  color: "#8e1b22", bg: "#fef2f2", text: "#8e1b22", border: "#fca5a5", mapColor: "#8e1b22", mapText: "#ffffff" },
  12: { temp: "50°F to 60°F",   tempC: "10°C to 15°C",   minF: 50,  maxF: 60,  minC: 10,  maxC: 15,  color: "#d75032", bg: "#fff1ee", text: "#9f1239", border: "#f43f5e", mapColor: "#d75032", mapText: "#ffffff" },
  11: { temp: "40°F to 50°F",   tempC: "5°C to 10°C",    minF: 40,  maxF: 50,  minC: 5,   maxC: 10,  color: "#f28723", bg: "#fff7ed", text: "#9a3412", border: "#fb923c", mapColor: "#f28723", mapText: "#ffffff" },
  10: { temp: "30°F to 40°F",   tempC: "0°C to 5°C",     minF: 30,  maxF: 40,  minC: 0,   maxC: 5,   color: "#f3b75d", bg: "#fffbeb", text: "#78350f", border: "#fde68a", mapColor: "#f3b75d", mapText: "#3b2002" },
  9:  { temp: "20°F to 30°F",   tempC: "-5°C to 0°C",    minF: 20,  maxF: 30,  minC: -5,  maxC: 0,   color: "#fae581", bg: "#fefce8", text: "#713f12", border: "#fef08a", mapColor: "#fae581", mapText: "#3a2d02" },
  8:  { temp: "10°F to 20°F",   tempC: "-10°C to -5°C",  minF: 10,  maxF: 20,  minC: -10, maxC: -5,  color: "#c5e870", bg: "#f7fee7", text: "#3f6212", border: "#d9f99d", mapColor: "#c5e870", mapText: "#223502" },
  7:  { temp: "0°F to 10°F",    tempC: "-20°C to -10°C", minF: 0,   maxF: 10,  minC: -20, maxC: -10, color: "#a5da5e", bg: "#f0fdf4", text: "#166534", border: "#bbf7d0", mapColor: "#a5da5e", mapText: "#183602" },
  6:  { temp: "-10°F to 0°F",   tempC: "-25°C to -20°C", minF: -10, maxF: 0,   minC: -25, maxC: -20, color: "#79d251", bg: "#ecfdf5", text: "#115e59", border: "#a7f3d0", mapColor: "#79d251", mapText: "#0e3401" },
  5:  { temp: "-20°F to -10°F", tempC: "-30°C to -25°C", minF: -20, maxF: -10, minC: -30, maxC: -25, color: "#59bca0", bg: "#f0fdfa", text: "#0f766e", border: "#99f6e4", mapColor: "#59bca0", mapText: "#092f26" },
  4:  { temp: "-30°F to -20°F", tempC: "-35°C to -30°C", minF: -30, maxF: -20, minC: -35, maxC: -30, color: "#4fa3a6", bg: "#f0f9ff", text: "#0369a1", border: "#bae6fd", mapColor: "#4fa3a6", mapText: "#ffffff" },
  3:  { temp: "-40°F to -30°F", tempC: "-40°C to -35°C", minF: -40, maxF: -30, minC: -40, maxC: -35, color: "#4e73a8", bg: "#eff6ff", text: "#1d4ed8", border: "#bfdbfe", mapColor: "#4e73a8", mapText: "#ffffff" }
};

const LIGHT_RANK = {
  "Full Sun": 1,
  "Part Sun": 2,
  "Part Shade": 3,
  "Full Shade": 4,
  "Shade": 4
};

const WATER_RANK = {
  "Low": 1,
  "Medium": 2,
  "Med": 2,
  "High": 3,
  "Bog": 4
};

function applyUrlParameters() {
  const rawParams = new URLSearchParams(window.location.search);
  if ([...rawParams.keys()].length === 0) return;

  // Normalize keys to lowercase so ?metric=True, ?Metric=true, and ?metric=1 all work
  const params = {};
  for (const [k, v] of rawParams.entries()) {
    params[k.toLowerCase().trim()] = v.toLowerCase().trim();
  }

  const parseBool = (val) => val === 'true' || val === '1' || val === 'yes' || val === 'on' || val === '';

  const paramMap = {
    metric:       (v) => { useMetric = v; },
    sample:       (v) => { showSamplePicture = v; },
    picture:      (v) => { showSamplePicture = v; },
    gridview:     (v) => { showGridView = v; },
    latin:        (v) => { showLatinName = v; },
    zone:         (v) => { showZone = v; },
    climate:      (v) => { showClimate = v; },
    water:        (v) => { showWater = v; },
    height:       (v) => { showHeight = v; },
    flower:       (v) => { showFlower = v; },
    cost:         (v) => { showCost = v; },
    lifespan:     (v) => { showLifespan = v; },
    origin:       (v) => { showOrigin = v; },
    inventory:    (v) => { showInventory = v; },
    dateacquired: (v) => { showDateAcquired = v; },
    location:     (v) => { showLocation = v; },
    warn:         (v) => { showWarn = v; },
    notes:        (v) => { showNotes = v; },
    note:         (v) => { showNotes = v; },
    prop:         (v) => { showPropagation = v; },
    propagation:  (v) => { showPropagation = v; }
  };

  // 1. Handle individual parameters: e.g. ?metric=True&latin=True&origin=False
  Object.keys(paramMap).forEach((key) => {
    if (key in params) {
      paramMap[key](parseBool(params[key]));
    }
  });

  // 2. Optional shorthand list: e.g. ?show=metric,latin,cost,notes
  if (params.show) {
    params.show.split(',').forEach((item) => {
      const k = item.trim().toLowerCase();
      if (paramMap[k]) paramMap[k](true);
    });
  }
}


function initExplorer() {
  applyUrlParameters();
  loadUserEditsFromStorage();
  loadPlantsData();
  sortColumnCategories();
  syncShowItemsCheckboxesFromDOM();
  renderZoneButtons();
  renderClimatePills();
  renderCategoryToggleButtons();
  updateHeightSliderUI();
  updateCostSliderUI();
  updateLifespanSliderUI();
  updateSortUI();
  initLightboxInteractions();
  renderPlants();
  updateShowItemsPreview();
}

// =========================================================================
// INVENTORY & EMOJI HELPERS
// =========================================================================
function hasPositiveInventory(p) {
  if (!p || p.inventory === undefined || p.inventory === null) return false;
  const s = String(p.inventory).trim();
  if (!s || s === '0') return false;
  const numMatch = s.match(/^-?\d+(\.\d+)?/);
  if (numMatch) {
    return parseFloat(numMatch[0]) > 0;
  }
  const lower = s.toLowerCase();
  if (lower === 'none' || lower === 'out' || lower === 'no' || lower === 'false') return false;
  return true;
}

function getPlantEmoji(plant) {
  if (!plant) return '';
  if (plant.emoji && String(plant.emoji).trim() !== '') {
    return String(plant.emoji).trim();
  }
  return getCategoryIcon(plant.category);
}

// =========================================================================
// METRIC CONVERSION HELPERS (ZONES & HEIGHTS)
// =========================================================================
function getZoneTempText(z) {
  if (z === 'all') {
    return useMetric ? '-40°C to 20°C' : '-40°F to 70°F';
  }
  const meta = ZONE_METADATA[z];
  if (!meta) return '';
  return useMetric ? meta.tempC : meta.temp;
}

function getPlantZoneRangeTempText(plant) {
  const minMeta = ZONE_METADATA[plant.minZone] || ZONE_METADATA[3];
  const maxMeta = ZONE_METADATA[plant.maxZone] || ZONE_METADATA[13];
  if (!minMeta || !maxMeta) return '';
  if (useMetric) {
    return `${minMeta.minC}°C to ${maxMeta.maxC}°C`;
  }
  return `${minMeta.minF}°F to ${maxMeta.maxF}°F`;
}

function formatFeetToMetricStr(ftVal) {
  const meters = ftVal * 0.3048;
  if (meters < 1) {
    return `${Math.round(meters * 100)} cm`;
  }
  const rounded = Math.round(meters * 10) / 10;
  return `${rounded} m`;
}

function formatSizeDisplay(sizeStr) {
  if (!sizeStr) return '';
  if (!useMetric) return sizeStr;

  let s = String(sizeStr);

  s = s.replace(/(\d+(?:\.\d+)?)\s*([-–—])\s*(\d+(?:\.\d+)?)\s*(?:ft\b|feet\b|')/gi, (m, n1, dash, n2) => {
    const m1 = Math.round(parseFloat(n1) * 0.3048 * 10) / 10;
    const m2 = Math.round(parseFloat(n2) * 0.3048 * 10) / 10;
    return `${m1}${dash}${m2} m`;
  });

  s = s.replace(/(\d+(?:\.\d+)?)\s*(?:ft\b|feet\b|')/gi, (m, n1) => {
    return formatFeetToMetricStr(parseFloat(n1));
  });

  s = s.replace(/(\d+(?:\.\d+)?)\s*([-–—])\s*(\d+(?:\.\d+)?)\s*(?:in\b|inches\b|")/gi, (m, n1, dash, n2) => {
    const cm1 = Math.round(parseFloat(n1) * 2.54);
    const cm2 = Math.round(parseFloat(n2) * 2.54);
    return `${cm1}${dash}${cm2} cm`;
  });

  s = s.replace(/(\d+(?:\.\d+)?)\s*(?:in\b|inches\b|")/gi, (m, n1) => {
    const cm = Math.round(parseFloat(n1) * 2.54);
    return `${cm} cm`;
  });

  return s;
}

// =========================================================================
// LOCAL STORAGE DELTA OVERLAY & EDIT MODES (BOTANICAL + INVENTORY)
// =========================================================================
function loadUserEditsFromStorage() {
  try {
    const raw = localStorage.getItem(USER_EDITS_STORAGE_KEY);
    userPlantEdits = raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.warn('Could not load user plant edits from localStorage:', e);
    userPlantEdits = {};
  }
}

function saveUserEditsToStorage() {
  try {
    localStorage.setItem(USER_EDITS_STORAGE_KEY, JSON.stringify(userPlantEdits));
  } catch (e) {
    console.warn('Could not save user plant edits to localStorage:', e);
  }
}

function normalizePlantRecord(rawPlant, defaultCat) {
  let assignedCat = rawPlant.category ? getDisplayCategory(rawPlant.category, rawPlant.name) : (defaultCat || 'Specialty');
  if (rawPlant.id === 'tree-pawpaw-american' || rawPlant.id.startsWith('fruit-')) {
    assignedCat = 'Fruit';
  }
  const zRange = parseZoneRange(rawPlant);
  const lifeRange = parseLifespanRange(rawPlant.lifespan);
  const costRange = parsePlantCost(rawPlant.cost);
  const resolvedSubcategory = (rawPlant.subcategory && String(rawPlant.subcategory).trim()) || 'General';
  const resolvedEmoji = (rawPlant.emoji !== undefined && rawPlant.emoji !== null && String(rawPlant.emoji).trim() !== '')
    ? String(rawPlant.emoji).trim()
    : getCategoryIcon(assignedCat);

  return {
    ...rawPlant,
    zone: rawPlant.zone || `${zRange.min}-${zRange.max}`,
    minZone: zRange.min,
    maxZone: zRange.max,
    category: assignedCat,
    subcategory: resolvedSubcategory,
    emoji: resolvedEmoji,
    climates: normalizeClimates(rawPlant.climates),
    sun: normalizeLight(rawPlant.sun),
    water: normalizeWater(rawPlant.water),
    flower: rawPlant.flower ? String(rawPlant.flower).trim() : null,
    cost: (rawPlant.cost !== undefined && rawPlant.cost !== null && String(rawPlant.cost).trim() !== '') ? String(rawPlant.cost).trim() : "$0",
    costParsed: costRange,
    lifespan: rawPlant.lifespan || null,
    lifespanParsed: lifeRange,
    origin: rawPlant.origin || null,
    inventory: rawPlant.inventory !== undefined && rawPlant.inventory !== null ? String(rawPlant.inventory) : "0",
    dateAcquired: rawPlant.dateAcquired || '',
    location: rawPlant.location || '',
    propagation: rawPlant.propagation || null,
    septicRisk: rawPlant.septicRisk || null,
    invasive: rawPlant.invasive === true
  };
}

function toggleLightboxEditMode() {
  isEditMode = !isEditMode;
  if (isEditMode) {
    isInventoryEditMode = false;
  }
  syncLightboxEditModeUI();
}

function toggleLightboxInventoryEditMode() {
  isInventoryEditMode = !isInventoryEditMode;
  if (isInventoryEditMode) {
    isEditMode = false;
  }
  syncLightboxEditModeUI();
}

function syncLightboxEditModeUI() {
  const editBtn = document.getElementById('lightbox-edit-btn');
  const invEditBtn = document.getElementById('lightbox-inv-edit-btn');
  const viewContent = document.getElementById('lightbox-view-content');
  const editContent = document.getElementById('lightbox-edit-content');
  const invEditContent = document.getElementById('lightbox-inventory-edit-content');
  const leftPane = document.getElementById('lightbox-left-pane');
  const rightPane = document.getElementById('lightbox-right-pane');

  const anyEditActive = isEditMode || isInventoryEditMode;

  if (editBtn) editBtn.classList.toggle('edit-btn-active', isEditMode);
  if (invEditBtn) invEditBtn.classList.toggle('inv-edit-btn-active', isInventoryEditMode);

  if (viewContent) viewContent.classList.toggle('hidden', anyEditActive);
  if (editContent) editContent.classList.toggle('hidden', !isEditMode);
  if (invEditContent) invEditContent.classList.toggle('hidden', !isInventoryEditMode);

  if (leftPane && rightPane) {
    if (anyEditActive) {
      leftPane.classList.remove('flex-1', 'lg:min-h-[600px]');
      leftPane.classList.add('w-full', 'lg:w-1/3', 'xl:w-4/12', 'lg:min-h-[420px]');

      rightPane.classList.remove('lg:w-80', 'xl:w-96');
      rightPane.classList.add('flex-1', 'lg:w-2/3', 'xl:w-8/12');
    } else {
      leftPane.classList.add('flex-1', 'lg:min-h-[600px]');
      leftPane.classList.remove('w-full', 'lg:w-1/3', 'xl:w-4/12', 'lg:min-h-[420px]');

      rightPane.classList.add('lg:w-80', 'xl:w-96');
      rightPane.classList.remove('flex-1', 'lg:w-2/3', 'xl:w-8/12');
    }
  }

  if (currentPlantInModal) {
    refreshLightboxViewFields(currentPlantInModal);
    if (anyEditActive) {
      populateLightboxEditInputs(currentPlantInModal);
    }
  }
}

function getSubtypesForCategory(catVal, currentSub) {
  const canonical = CATEGORY_SUBTYPES_MAP[catVal] ? [...CATEGORY_SUBTYPES_MAP[catVal]] : [];
  plants.forEach(p => {
    if (getDisplayCategory(p.category, p.name) === catVal && p.subcategory && !canonical.includes(p.subcategory)) {
      canonical.push(p.subcategory);
    }
  });
  if (currentSub && !canonical.includes(currentSub)) {
    canonical.push(currentSub);
  }
  if (canonical.length === 0) {
    canonical.push('General');
  }
  return canonical;
}

function renderEditClimatesMultiSelect(plant) {
  const container = document.getElementById('edit-climates-list');
  if (!container) return;

  const activeClimates = Array.isArray(plant.climates) ? plant.climates : [];
  const allOptions = [...CLIMATES_LIST];
  activeClimates.forEach(c => {
    if (c && !allOptions.includes(c)) allOptions.push(c);
  });

  container.innerHTML = allOptions.map(c => {
    const isSelected = activeClimates.includes(c);
    const escapedC = escapeXml(c).replace(/'/g, "\\'");
    const btnClasses = isSelected
      ? 'bg-teal-700 text-white border-teal-800 font-bold shadow-2xs'
      : 'bg-stone-100 text-stone-700 border-stone-300 hover:bg-teal-50 hover:text-teal-900 font-medium';

    return `
      <button
        type="button"
        onclick="toggleEditPlantClimate('${escapedC}')"
        class="px-2.5 py-1 rounded-lg border text-[11px] transition cursor-pointer select-none flex items-center gap-1 ${btnClasses}"
      >
        <span>${isSelected ? '✓ ' : ''}${escapeXml(c)}</span>
      </button>
    `;
  }).join('');
}

function toggleEditPlantClimate(climateName) {
  if (!currentPlantInModal) return;
  const currentList = Array.isArray(currentPlantInModal.climates) ? [...currentPlantInModal.climates] : [];
  const idx = currentList.indexOf(climateName);
  if (idx !== -1) {
    currentList.splice(idx, 1);
  } else {
    currentList.push(climateName);
  }
  handlePlantEditInput('climates', currentList);
  renderEditClimatesMultiSelect(currentPlantInModal);
}

function populateLightboxEditInputs(plant) {
  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el && document.activeElement !== el) {
      el.value = val !== undefined && val !== null ? val : '';
    }
  };

  const subSelect = document.getElementById('edit-field-subcategory');
  if (subSelect) {
    const catDisplay = getDisplayCategory(plant.category, plant.name);
    const options = getSubtypesForCategory(catDisplay, plant.subcategory);
    subSelect.innerHTML = options.map(opt =>
      `<option value="${escapeXml(opt)}" ${opt === plant.subcategory ? 'selected' : ''}>${escapeXml(opt)}</option>`
    ).join('');
  }

  renderEditClimatesMultiSelect(plant);

  setVal('edit-field-name', plant.name || '');
  setVal('edit-field-emoji', plant.emoji || '');
  setVal('edit-field-botanical', plant.botanical || '');
  setVal('edit-field-origin', plant.origin || '');
  setVal('edit-field-zone', plant.zone || '');
  setVal('edit-field-sun', plant.sun || 'Full Sun');
  setVal('edit-field-water', plant.water || 'Medium');
  setVal('edit-field-size', plant.size || '');
  setVal('edit-field-flower', plant.flower || '');
  setVal('edit-field-lifespan', plant.lifespan || '');
  setVal('edit-field-propagation', plant.propagation || '');
  setVal('edit-field-notes', plant.notes || '');

  setVal('inv-edit-field-inventory', plant.inventory || '0');
  setVal('inv-edit-field-cost', plant.cost && plant.cost !== '$0' ? plant.cost : '');
  setVal('inv-edit-field-date-acquired', plant.dateAcquired || '');
  setVal('inv-edit-field-location', plant.location || '');
}

function handlePlantEditInput(field, rawValue) {
  if (!currentPlantInModal) return;
  const pid = currentPlantInModal.id;

  if (!userPlantEdits[pid]) {
    userPlantEdits[pid] = {};
  }

  if (field === 'climates') {
    userPlantEdits[pid].climates = Array.isArray(rawValue)
      ? rawValue
      : String(rawValue).split(',').map(s => s.trim()).filter(Boolean);
  } else if (field === 'origin') {
    userPlantEdits[pid].origin = rawValue;
  } else {
    userPlantEdits[pid][field] = rawValue;
  }

  saveUserEditsToStorage();

  const base = baselinePlantsById[pid] || currentPlantInModal;
  const updatedPlant = normalizePlantRecord({ ...base, ...userPlantEdits[pid] }, base.category);

  const idx = plants.findIndex(p => p.id === pid);
  if (idx !== -1) {
    plants[idx] = updatedPlant;
  }
  currentPlantInModal = updatedPlant;

  refreshLightboxViewFields(updatedPlant);
  renderPlants();
}

function revertCurrentPlantEdits() {
  if (!currentPlantInModal) return;
  const pid = currentPlantInModal.id;
  if (!userPlantEdits[pid]) {
    showToast('No local changes to revert for this plant.');
    return;
  }

  delete userPlantEdits[pid];
  saveUserEditsToStorage();

  const base = baselinePlantsById[pid];
  if (base) {
    const restored = normalizePlantRecord({ ...base }, base.category);
    const idx = plants.findIndex(p => p.id === pid);
    if (idx !== -1) plants[idx] = restored;
    currentPlantInModal = restored;
    populateLightboxEditInputs(restored);
    refreshLightboxViewFields(restored);
  }

  renderPlants();
  showToast('Reverted plant to default values.');
}

function exportUserEditsToFile() {
  const count = Object.keys(userPlantEdits).length;
  if (count === 0) {
    showToast('No edited plants to export yet.');
    return;
  }
  const dataStr = JSON.stringify(userPlantEdits, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = 'plant_database_edits.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast(`Exported edits for ${count} plant(s).`);
}

function importUserEditsFromFile(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const imported = JSON.parse(e.target.result);
      if (typeof imported !== 'object' || imported === null) {
        throw new Error('Invalid JSON structure');
      }
      userPlantEdits = { ...userPlantEdits, ...imported };
      saveUserEditsToStorage();
      loadPlantsData();
      renderPlants();

      if (currentPlantInModal) {
        const refreshed = plants.find(p => p.id === currentPlantInModal.id);
        if (refreshed) {
          currentPlantInModal = refreshed;
          populateLightboxEditInputs(refreshed);
          refreshLightboxViewFields(refreshed);
        }
      }
      showToast(`Imported edits for ${Object.keys(imported).length} plant(s)!`);
    } catch (err) {
      alert('Failed to import JSON file: ' + err.message);
    } finally {
      event.target.value = '';
    }
  };
  reader.readAsText(file);
}

// =========================================================================
// HOVER OVERLAY & SYNCHRONIZED ZONE PALETTE ILLUMINATION
// =========================================================================
function setZoneButtonsMapPalette(active) {
  for (let z = 13; z >= 3; z--) {
    const btn = document.querySelector(`.zone-btn[data-zone="${z}"]`);
    if (!btn) continue;
    const meta = ZONE_METADATA[z];

    if (active) {
      btn.style.transition = 'all 300ms ease';
      btn.style.backgroundColor = meta.mapColor;
      btn.style.borderColor = meta.mapColor;
      btn.style.color = meta.mapText;
      btn.style.boxShadow = `0 2px 8px ${meta.mapColor}66`;
      btn.style.transform = 'translateY(-1px)';
    } else {
      btn.style.boxShadow = 'none';
      btn.style.transform = 'none';
    }
  }

  if (!active) {
    updateZoneUI();
  }
}

function triggerButtonHoverOverlay(imgPath) {
  if (hoverOverlayTimeout) clearTimeout(hoverOverlayTimeout);
  hoverOverlayTimeout = setTimeout(() => {
    const overlay = document.getElementById('button-hover-infographic-overlay');
    const img = document.getElementById('button-hover-overlay-img');
    if (!overlay || !img) return;

    const isLightOrWater = imgPath.includes('light.') || imgPath.includes('water.');
    const isCategory = ALL_CATEGORIES.some(cat =>
      imgPath.includes(`/${cat.file}/`) ||
      imgPath.endsWith(`/${cat.file}.webp`) ||
      imgPath.endsWith(`/${cat.file}.jpg`)
    );

    if (isLightOrWater) {
      overlay.style.top = '200px';
      img.style.maxHeight = 'calc(100vh - 235px)';
      img.style.maxWidth = '50%';
    } else if (isCategory) {
      overlay.style.top = '300px';
      img.style.maxHeight = 'calc(100vh - 235px)';
      img.style.maxWidth = '50%';
    } else {
      overlay.style.top = '150px';
      img.style.maxHeight = 'calc(100vh - 175px)';
      img.style.maxWidth = '50%';
    }

    img.src = imgPath;
    overlay.classList.remove('hidden');
    requestAnimationFrame(() => {
      overlay.classList.remove('opacity-0');
      overlay.classList.add('opacity-100');
    });

    if (imgPath.includes('zones')) {
      setZoneButtonsMapPalette(true);
    }
  }, 1000);
}

function clearButtonHoverOverlay() {
  if (hoverOverlayTimeout) clearTimeout(hoverOverlayTimeout);
  const overlay = document.getElementById('button-hover-infographic-overlay');
  if (overlay) {
    overlay.classList.add('opacity-0');
    overlay.classList.remove('opacity-100');
    setTimeout(() => {
      if (overlay.classList.contains('opacity-0')) {
        overlay.classList.add('hidden');
      }
    }, 500);
  }
  setZoneButtonsMapPalette(false);
}

// =========================================================================
// "SHOW ITEMS" DIALOG MODAL & LIVE EXAMPLE PANEL
// =========================================================================
function syncShowItemsCheckboxesFromDOM() {
  const map = [
    ['chk-show-sample', showSamplePicture],
    ['chk-show-grid-view', showGridView],
    ['chk-show-latin', showLatinName],
    ['chk-show-metric', useMetric],
    ['chk-show-zone', showZone],
    ['chk-show-climate', showClimate],
    ['chk-show-water', showWater],
    ['chk-show-height', showHeight],
    ['chk-show-flower', showFlower],
    ['chk-show-cost', showCost],
    ['chk-show-lifespan', showLifespan],
    ['chk-show-origin', showOrigin],
    ['chk-show-inventory', showInventory],
    ['chk-show-date-acquired', showDateAcquired],
    ['chk-show-location', showLocation],
    ['chk-show-warn', showWarn],
    ['chk-show-notes', showNotes],
    ['chk-show-propagation', showPropagation]
  ];

  map.forEach(([id, stateVal]) => {
    const el = document.getElementById(id);
    if (el) {
      el.checked = stateVal;
      if (id !== 'chk-show-grid-view') {
        el.disabled = showGridView;
      }
    }
  });
  // Dim and disable all other Show Items options when Grid View is active
  const sampleLbl = document.getElementById('lbl-show-sample');
  const rightOpts = document.getElementById('show-items-right-options');
  const bottomOpts = document.getElementById('show-items-bottom-options');
  [sampleLbl, rightOpts, bottomOpts].forEach(container => {
    if (container) {
      container.classList.toggle('opacity-40', showGridView);
      container.classList.toggle('pointer-events-none', showGridView);
    }
  });


}

function openShowItemsModal() {
  const modal = document.getElementById('show-items-modal');
  if (modal) {
    modal.classList.remove('hidden');
    syncShowItemsCheckboxesFromDOM();
    updateShowItemsPreview();
  }
}

function closeShowItemsModal() {
  const modal = document.getElementById('show-items-modal');
  if (modal) modal.classList.add('hidden');
}

function toggleShowItem(item, checked) {
  if (item === 'gridView') {
    showGridView = checked;
    syncShowItemsCheckboxesFromDOM();
  } else if (item === 'sample') showSamplePicture = checked;
  else if (item === 'latin') showLatinName = checked;
  else if (item === 'metric') {
    useMetric = checked;
    updateHeightSliderUI();
    updateZoneUI();
    if (currentPlantInModal) refreshLightboxViewFields(currentPlantInModal);
  }
  else if (item === 'zone') showZone = checked;
  else if (item === 'climate') showClimate = checked;
  else if (item === 'water') showWater = checked;
  else if (item === 'height') showHeight = checked;
  else if (item === 'flower') showFlower = checked;
  else if (item === 'cost') showCost = checked;
  else if (item === 'lifespan') showLifespan = checked;
  else if (item === 'origin') showOrigin = checked;
  else if (item === 'inventory') showInventory = checked;
  else if (item === 'dateAcquired') showDateAcquired = checked;
  else if (item === 'location') showLocation = checked;
  else if (item === 'warn') showWarn = checked;
  else if (item === 'notes') showNotes = checked;
  else if (item === 'propagation') showPropagation = checked;

  renderPlants();
  updateShowItemsPreview();
}
function updateShowItemsPreview() {
  const container = document.getElementById('show-items-preview-container');
  if (!container) return;

  const samplePlant = firstVisiblePlant || plants[0];
  if (!samplePlant) {
    container.innerHTML = `<div class="text-xs text-stone-400 italic text-center py-4">No plants available to preview</div>`;
    return;
  }

  container.innerHTML = generatePlantCardHTML(samplePlant, true);
}

function generateSimpleThumbSvg(cat) {
  const icon = getCategoryIcon(cat);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 170 100" width="170" height="100">
      <rect width="170" height="100" fill="#f5f6f3"/>
      <text x="85" y="58" text-anchor="middle" font-size="32" opacity="0.45">${icon}</text>
    </svg>
  `;
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg.trim());
}

// =========================================================================
// PLANT CARD HTML GENERATOR (Thumbnail Expanded to Fill Row Height & Left Edge)
// =========================================================================
function generatePlantCardHTML(plant, isPreview = false) {
  const catKey = getCategoryFileKey(plant.category);
  const thumbPath = `sample/${catKey}/thumbnails/xx_${plant.id}.webp`;

  let legacyFolder = null;
  if (plant.id.startsWith('moss-')) legacyFolder = 'moss';
  else if (plant.id.startsWith('tree-pawpaw')) legacyFolder = 'tree';
  const legacyThumbPath = legacyFolder ? `sample/${legacyFolder}/thumbnails/xx_${plant.id}.webp` : '';

  const rawHeightPart = plant.size ? plant.size.split('×')[0].trim() : '';
  const heightPart = formatSizeDisplay(rawHeightPart);
  const rawFlowerPart = plant.flower || (isPreview ? '2" Pink-White Blooms' : '');
  const flowerPart = formatSizeDisplay(rawFlowerPart);
  const hasPrice = plant.cost && plant.cost !== '$0';
  const plantEmoji = getPlantEmoji(plant);

  let thumbnailHtml = '';
  const effectiveColCount = isAllPlantsMode ? 1 : columnCategories.length;
  if (showSamplePicture && effectiveColCount <= 3) {
    const onErrorScript = legacyThumbPath
      ? `if (!this.dataset.triedLegacy) { this.dataset.triedLegacy = '1'; this.src = '${legacyThumbPath}'; } else { this.onerror = null; this.src = generateSimpleThumbSvg('${escapeXml(plant.category)}'); }`
      : `this.onerror=null; this.src=generateSimpleThumbSvg('${escapeXml(plant.category)}');`;

    thumbnailHtml = `
      <img
        src="${thumbPath}"
        alt=""
        style="width: 170px; min-width: 170px;"
        class="w-[170px] min-w-[170px] h-full object-cover rounded-xl -ml-2 -my-2 mr-2 border-r border-stone-300 bg-stone-100 block self-stretch shrink-0"
        onerror="${onErrorScript}"
      />
    `;
  }

  let latinRowHtml = '';
  if (showLatinName && plant.botanical) {
    latinRowHtml = `<div class="text-[11px] italic text-stone-500 truncate leading-snug">${escapeXml(plant.botanical)}</div>`;
  }

  const metaItems = [];
  if (isAllPlantsMode) {
    metaItems.push(`<span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-stone-100 text-stone-800 border border-stone-200">${escapeXml(plant.category)}</span>`);
  }
  if (showZone) {
    const zoneTempStr = getPlantZoneRangeTempText(plant);
    const zoneBadgeLabel = useMetric
      ? `Z${escapeXml(String(plant.zone))} (${zoneTempStr})`
      : `Z${escapeXml(String(plant.zone))}`;
    metaItems.push(`<span class="inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-900 border border-emerald-200 leading-none select-none" title="Hardiness Range: ${zoneTempStr}">${zoneBadgeLabel}</span>`);
  }
  if (showWater) {
    metaItems.push(`<span class="text-xs leading-none select-none" title="Water: ${escapeXml(plant.water || 'Med')}">${getWaterEmoji(plant.water)}</span>`);
  }
  if (showCost && hasPrice) {
    metaItems.push(`<span class="font-semibold text-stone-700">${escapeXml(plant.cost)}</span>`);
  }
  if (showLifespan && plant.lifespan) {
    metaItems.push(`<span>⏳${escapeXml(String(plant.lifespan))}y</span>`);
  }
  if (showHeight && heightPart) {
    metaItems.push(`<span class="inline-flex items-center gap-0.5 font-medium text-stone-700"><span class="text-xs font-bold text-stone-600 leading-none">↕</span>${escapeXml(heightPart)}</span>`);
  }
  if (showFlower && flowerPart) {
    metaItems.push(`<span class="inline-flex items-center gap-0.5 font-medium text-pink-900"><span class="text-xs leading-none">🌸</span>${escapeXml(flowerPart)}</span>`);
  }

  const metaRowHtml = metaItems.length > 0
    ? `<div class="flex items-center gap-1 text-[11px] text-stone-500 mt-0.5 flex-wrap">${metaItems.join(' &bull; ')}</div>`
    : '';

  let originRowHtml = '';
  const plantOrigin = plant.origin;
  if (showOrigin && plantOrigin) {
    originRowHtml = `
      <div class="text-[11px] text-stone-600 truncate mt-0.5 flex items-center gap-1">
        <span class="font-semibold text-stone-700 shrink-0">📍 Origin:</span>
        <span class="truncate">${escapeXml(plantOrigin)}</span>
      </div>
    `;
  }

  const invItems = [];
  if (showInventory) {
    const invVal = hasPositiveInventory(plant) ? plant.inventory : (isPreview ? '3 in stock' : '0');
    invItems.push(`<span class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-300">📦 Inv: ${escapeXml(invVal)}</span>`);
  }
  if (showDateAcquired) {
    const dateVal = plant.dateAcquired || (isPreview ? '2026-04-15' : '');
    if (dateVal) {
      invItems.push(`<span class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-stone-100 text-stone-800 border border-stone-300">📅 ${escapeXml(dateVal)}</span>`);
    }
  }
  if (showLocation) {
    const locVal = plant.location || (isPreview ? 'South Patio Bed' : '');
    if (locVal) {
      invItems.push(`<span class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-teal-50 text-teal-900 border border-teal-300">📌 ${escapeXml(locVal)}</span>`);
    }
  }
  const inventoryRowHtml = invItems.length > 0
    ? `<div class="flex flex-wrap items-center gap-1 mt-1">${invItems.join('')}</div>`
    : '';

  let warningsRowHtml = '';
  if (showWarn) {
    let badges = [];
    if (plant.invasive) {
      badges.push(`<span class="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-300">⚠️ Invasive Species</span>`);
    }
    if (plant.septicRisk) {
      const isSevere = plant.septicRisk.toLowerCase().includes('severe') || plant.septicRisk.toLowerCase().includes('high');
      if (isSevere) {
        badges.push(`<span class="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-900 border border-red-300">🚫 Septic Hazard: 50'+ Setback</span>`);
      } else {
        badges.push(`<span class="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">⚠️ Septic: Buffer 20'+</span>`);
      }
    }
    if (isPreview && badges.length === 0) {
      badges.push(`<span class="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">🛡️ Non-Invasive &amp; Septic Safe</span>`);
    }
    if (badges.length > 0) {
      warningsRowHtml = `
        <div class="mt-1.5 pt-1.5 border-t border-stone-100 flex flex-wrap items-center gap-1">
          ${badges.join('')}
        </div>
      `;
    }
  }

  let notesHtml = '';
  if (showNotes && plant.notes) {
    notesHtml = `
      <div class="mt-1.5 pt-1.5 border-t border-sky-100 flex items-start gap-1 text-[10px] text-stone-600 bg-sky-50/60 p-1.5 rounded-lg leading-relaxed whitespace-normal">
        <span class="shrink-0 font-bold text-sky-800">📝 Note:</span>
        <span class="break-words flex-1">${escapeXml(plant.notes)}</span>
      </div>
    `;
  }

  let propagationHtml = '';
  if (showPropagation) {
    const propText = plant.propagation || 'Division or seed in spring.';
    propagationHtml = `
      <div class="mt-1.5 pt-1.5 border-t border-emerald-100/80 flex items-start gap-1 text-[10px] text-emerald-950 bg-emerald-50/60 p-1.5 rounded-lg leading-relaxed whitespace-normal">
        <span class="shrink-0 font-bold text-emerald-700">🌱 Prop:</span>
        <span class="break-words flex-1">${escapeXml(propText)}</span>
      </div>
    `;
  }

  let climateHtml = '';
  if (showClimate && plant.climates && plant.climates.length > 0) {
    const pills = plant.climates.map(c =>
      `<span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-teal-50 text-teal-900 border border-teal-200 leading-none select-none">${escapeXml(c)}</span>`
    ).join('');
    climateHtml = `
      <div class="mt-1.5 pt-1.5 border-t border-teal-100/80 flex flex-wrap items-center gap-1 text-[10px] text-teal-950">
        <span class="shrink-0 font-bold text-teal-800">🌍 Climate:</span>
        ${pills}
      </div>
    `;
  }

  const interactionAttrs = isPreview
    ? ''
    : `onclick="openInfographicModal('${plant.id}')"`;

  // Grid View Mode: Show only the plant image tile
  if (showGridView) {
    const onErrorScript = legacyThumbPath
      ? `if (!this.dataset.triedLegacy) { this.dataset.triedLegacy = '1'; this.src = '${legacyThumbPath}'; } else { this.onerror = null; this.src = generateSimpleThumbSvg('${escapeXml(plant.category)}'); }`
      : `this.onerror=null; this.src=generateSimpleThumbSvg('${escapeXml(plant.category)}');`;

    return `
      <div
        class="group relative rounded-xl overflow-hidden border border-stone-300 bg-stone-100 hover:border-emerald-600 hover:shadow-md transition-all cursor-pointer aspect-square flex items-center justify-center"
        title="${escapeXml(plant.name)}"
        ${interactionAttrs}
      >
        <img
          src="${thumbPath}"
          alt="${escapeXml(plant.name)}"
          class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200 block"
          onerror="${onErrorScript}"
        />
      </div>
    `;
  }

  return `
    <div
      class="group flex flex-col p-2 rounded-xl border border-stone-200 bg-white hover:border-emerald-600 hover:bg-emerald-50/40 transition-all shadow-2xs cursor-pointer overflow-hidden"
      ${interactionAttrs}
    >
      <div class="flex flex-row items-stretch gap-2.5">
        ${thumbnailHtml}

        <div class="flex items-start justify-between gap-2 flex-1 min-w-0 py-0.5">
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-1.5 min-w-0">
              <span class="font-semibold text-xs sm:text-sm text-stone-900 group-hover:text-emerald-950 truncate block flex-1">
                ${escapeXml(plant.name)}
              </span>
              ${plantEmoji ? `<span class="text-xs shrink-0 select-none" title="Plant Emoji">${escapeXml(plantEmoji)}</span>` : ''}
            </div>

            ${latinRowHtml}
            ${metaRowHtml}
            ${originRowHtml}
            ${inventoryRowHtml}
          </div>

          <div class="flex items-center shrink-0 select-none pt-0.5" title="Light: ${escapeXml(plant.sun || 'Sun')}">
            <span class="text-base hover:scale-110 transition-transform leading-none">${getSunEmoji(plant.sun)}</span>
          </div>
        </div>
      </div>

      ${warningsRowHtml}
      ${notesHtml}
      ${propagationHtml}
      ${climateHtml}
    </div>
  `;
}

// =========================================================================
// FILTER DIALOG MODAL CONTROLS
// =========================================================================
function openFilterModal() {
  const modal = document.getElementById('filter-dialog-modal');
  if (modal) modal.classList.remove('hidden');
}

function closeFilterModal() {
  const modal = document.getElementById('filter-dialog-modal');
  if (modal) modal.classList.add('hidden');
}

function resetDialogFilters() {
  filterInfographics = false;
  filterAvailable = false;
  filterNonInvasive = false;
  filterSepticSafe = false;
  minHeightIdx = 0;
  maxHeightIdx = 9;
  minLifespanIdx = 0;
  maxLifespanIdx = 8;
  maxCostIdx = 8;

  if (currentSortGroup === 'height' || currentSortGroup === 'cost' || currentSortGroup === 'lifespan') {
    currentSortGroup = null;
    currentSortDirection = null;
  }

  const infoTog = document.getElementById('toggle-infographics');
  if (infoTog) infoTog.checked = false;
  const availTog = document.getElementById('toggle-available');
  if (availTog) availTog.checked = false;
  const nonInvTog = document.getElementById('toggle-non-invasive');
  if (nonInvTog) nonInvTog.checked = false;
  const septicTog = document.getElementById('toggle-septic-safe');
  if (septicTog) septicTog.checked = false;

  const minSlider = document.getElementById('height-min-slider');
  if (minSlider) minSlider.value = 0;
  const maxSlider = document.getElementById('height-max-slider');
  if (maxSlider) maxSlider.value = 9;

  const minLifeSlider = document.getElementById('lifespan-min-slider');
  if (minLifeSlider) minLifeSlider.value = 0;
  const maxLifeSlider = document.getElementById('lifespan-max-slider');
  if (maxLifeSlider) maxLifeSlider.value = 8;

  const costSlider = document.getElementById('cost-max-slider');
  if (costSlider) costSlider.value = 8;

  updateHeightSliderUI();
  updateLifespanSliderUI();
  updateCostSliderUI();
  updateSortUI();
  renderPlants();
}

function updateFilterButtonBadge() {
  let count = 0;
  if (filterInfographics) count++;
  if (filterAvailable) count++;
  if (filterNonInvasive) count++;
  if (filterSepticSafe) count++;
  if (minHeightIdx > 0 || maxHeightIdx < 9) count++;
  if (minLifespanIdx > 0 || maxLifespanIdx < 8) count++;
  if (maxCostIdx < 8) count++;

  const badge = document.getElementById('filter-active-count-badge');
  const btn = document.getElementById('open-filter-modal-btn');
  if (badge) {
    badge.textContent = count;
    badge.classList.toggle('hidden', count === 0);
  }
  if (btn) {
    if (count > 0) {
      btn.classList.add('bg-emerald-700', 'text-white', 'border-emerald-800');
      btn.classList.remove('bg-emerald-50/90', 'text-emerald-950', 'border-emerald-700/40');
    } else {
      btn.classList.remove('bg-emerald-700', 'text-white', 'border-emerald-800');
      btn.classList.add('bg-emerald-50/90', 'text-emerald-950', 'border-emerald-700/40');
    }
  }
}

// =========================================================================
// SORTING SYSTEM
// =========================================================================


function capitalize(s) {
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
}


function toggleSort(group) {
  if (group === 'type') {
    // Toggles between Not Sorted (null) and Sorted by Plant Name ('type')
    if (currentSortGroup === 'type') {
      currentSortGroup = null;
      currentSortDirection = null;
    } else {
      currentSortGroup = 'type';
      currentSortDirection = 'asc';
    }
  } else {
    if (currentSortGroup === group) {
      currentSortDirection = (currentSortDirection === 'desc') ? 'asc' : 'desc';
    } else {
      currentSortGroup = group;
      currentSortDirection = 'desc';
    }
  }
  updateSortUI();
  renderPlants();
}

function updateSortUI() {
  const groups = ['type', 'zone', 'climate', 'light', 'water', 'height', 'cost', 'lifespan'];
  groups.forEach(group => {
    const iconEl = document.getElementById(`sort-icon-${group}`);
    const btnEl = document.getElementById(`sort-btn-${group}`);
    if (!iconEl || !btnEl) return;

    if (currentSortGroup === group) {
      if (group === 'type') {
        iconEl.textContent = '↓';
        btnEl.title = 'Sorted by Plant Name (Click to return to Unsorted)';
      } else {
        const arrow = currentSortDirection === 'desc' ? '↓' : '↑';
        iconEl.textContent = arrow;
        btnEl.title = `Sorted by ${capitalize(group)} (${currentSortDirection === 'desc' ? 'Descending' : 'Ascending'} - Click to toggle)`;
      }
      btnEl.classList.add('bg-stone-900', 'text-white', 'border-stone-950', 'shadow-xs');
      btnEl.classList.remove('bg-stone-100', 'bg-white', 'text-stone-700', 'text-stone-600', 'border-stone-300');
    } else {
      iconEl.textContent = '⇅';
      btnEl.title = group === 'type' ? 'Sort by Plant Name (Default: Not Sorted)' : `Sort by ${capitalize(group)}`;
      btnEl.classList.remove('bg-stone-900', 'text-white', 'border-stone-950', 'shadow-xs');
      if (group === 'type' || group === 'zone' || group === 'climate') {
        btnEl.classList.add('bg-stone-100', 'text-stone-700', 'border-stone-300');
      } else if (group === 'height' || group === 'cost' || group === 'lifespan') {
        btnEl.classList.add('bg-white', 'text-stone-700', 'border-stone-300');
      } else {
        btnEl.classList.add('text-stone-600');
      }
    }
  });
}

function sortPlantList(list) {
  // Default is not sorted (preserves original database order)
  if (!currentSortGroup) {
    return list.slice();
  }

  // Sorted by plant name when Type sort button is active
  if (currentSortGroup === 'type') {
    return list.slice().sort((a, b) => a.name.localeCompare(b.name));
  }

  const isDesc = (currentSortDirection === 'desc');

  return list.slice().sort((a, b) => {
    let diff = 0;

    if (currentSortGroup === 'light') {
      const rankA = LIGHT_RANK[a.sun] || 99;
      const rankB = LIGHT_RANK[b.sun] || 99;
      diff = isDesc ? (rankA - rankB) : (rankB - rankA);
    } else if (currentSortGroup === 'water') {
      const rankA = WATER_RANK[a.water] || 99;
      const rankB = WATER_RANK[b.water] || 99;
      diff = isDesc ? (rankA - rankB) : (rankB - rankA);
    } else if (currentSortGroup === 'zone') {
      if (isDesc) {
        diff = b.maxZone - a.maxZone;
        if (diff === 0) diff = b.minZone - a.minZone;
      } else {
        diff = a.minZone - b.minZone;
        if (diff === 0) diff = a.maxZone - b.maxZone;
      }
    } else if (currentSortGroup === 'climate') {
      const climA = (a.climates && a.climates.length > 0) ? a.climates.join(', ') : '';
      const climB = (b.climates && b.climates.length > 0) ? b.climates.join(', ') : '';
      diff = isDesc ? climB.localeCompare(climA) : climA.localeCompare(climB);
    } else if (currentSortGroup === 'height') {
      const hA = parsePlantHeight(a.size);
      const hB = parsePlantHeight(b.size);
      diff = isDesc ? (hB - hA) : (hA - hB);
    } else if (currentSortGroup === 'lifespan') {
      const lA = (a.lifespanParsed && a.lifespanParsed.avg) ? a.lifespanParsed.avg : 0;
      const lB = (b.lifespanParsed && b.lifespanParsed.avg) ? b.lifespanParsed.avg : 0;
      diff = isDesc ? (lB - lA) : (lA - lB);
    } else if (currentSortGroup === 'cost') {
      const cA = a.costParsed ? a.costParsed.avg : 0;
      const cB = b.costParsed ? b.costParsed.avg : 0;
      diff = isDesc ? (cB - cA) : (cA - cB);
    }

    if (diff !== 0) return diff;
    return a.name.localeCompare(b.name);
  });
}






function parsePlantCost(costStr) {
  if (costStr === undefined || costStr === null || costStr === '' || costStr === '$0') {
    return { min: 0.0, max: 0.0, avg: 0.0 };
  }
  if (typeof costStr === 'number') {
    return { min: costStr, max: costStr, avg: costStr };
  }
  const nums = String(costStr).match(/([\d.]+)/g);
  if (!nums || nums.length === 0) return { min: 0.0, max: 0.0, avg: 0.0 };
  if (nums.length === 1) {
    const val = parseFloat(nums[0]);
    return { min: val, max: val, avg: val };
  }
  const n1 = parseFloat(nums[0]);
  const n2 = parseFloat(nums[1]);
  const mn = Math.min(n1, n2);
  const mx = Math.max(n1, n2);
  return { min: mn, max: mx, avg: (mn + mx) / 2.0 };
}

function parseLifespanRange(str) {
  if (!str) return { min: 0, max: Infinity, avg: 0 };
  const parts = String(str).replace(/[–—]/g, '-').split('-').map(n => parseInt(n.trim(), 10)).filter(n => !isNaN(n));
  if (parts.length === 1) return { min: parts[0], max: parts[0], avg: parts[0] };
  if (parts.length >= 2) {
    const mn = Math.min(parts[0], parts[1]);
    const mx = Math.max(parts[0], parts[1]);
    return { min: mn, max: mx, avg: (mn + mx) / 2.0 };
  }
  return { min: 0, max: Infinity, avg: 0 };
}



// =========================================================================
// NORMALIZATION ENGINE
// =========================================================================
function normalizeLight(val) {
  if (!val) return "Full Sun";
  const s = String(val).toLowerCase().trim();
  if (s.includes("full sun")) return "Full Sun";
  if (s.includes("part sun")) return "Part Sun";
  if (s.includes("part shade") || s.includes("dapple")) return "Part Shade";
  if (s.includes("full shade") || s === "shade") return "Full Shade";
  if (s.includes("sun")) return "Full Sun";
  if (s.includes("shade")) return "Part Shade";
  return "Full Sun";
}

function normalizeWater(val) {
  if (!val) return "Medium";
  const s = String(val).toLowerCase().trim();
  if (s.includes("bog") || s.includes("standing") || s.includes("aquatic") || s.includes("creek")) return "Bog";
  if (s.includes("low") || s.includes("dry") || s.includes("drought")) return "Low";
  if (s.includes("high") || s.includes("wet") || s.includes("moist") || s.includes("swamp")) return "High";
  return "Medium";
}

function parseZoneRange(plant) {
  if (plant.zone !== undefined && plant.zone !== null) {
    if (typeof plant.zone === 'number') return { min: plant.zone, max: plant.zone };
    const parts = String(plant.zone).replace(/[–—]/g, '-').split('-').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
    if (parts.length === 1) return { min: parts[0], max: parts[0] };
    if (parts.length >= 2) return { min: Math.min(parts[0], parts[1]), max: Math.max(parts[0], parts[1]) };
  }
  const minZ = plant.minZone !== undefined ? parseInt(plant.minZone, 10) : 3;
  const maxZ = plant.maxZone !== undefined ? parseInt(plant.maxZone, 10) : 12;
  return { min: minZ, max: maxZ };
}

function hasInfographic(plant) {
  if (!plant) return false;
  return plant.infographic === true || (typeof plant.infographic === 'string' && plant.infographic.trim() !== '' && plant.infographic !== 'false');
}

function getPlantInfographicPath(plant) {
  if (!plant) return null;
  if (typeof plant.infographic === 'string' && plant.infographic.includes('/')) {
    return plant.infographic.replace(/\.jpe?g$/i, '.webp');
  }
  const catKey = getCategoryFileKey(plant.category);
  return `sample/${catKey}/${plant.id}.webp`;
}

function getCategoryFileKey(catName) {
  const match = ALL_CATEGORIES.find(c => c.val === catName);
  if (match && match.file) return match.file;
  return (catName || 'specialty').toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function getDisplayCategory(cat, name) {
  if (!cat) return 'Specialty';
  const c = String(cat).trim();
  const l = c.toLowerCase();

  if (l === 'annual') return 'Annual';
  if (l === 'cactus' || l === 'cacti') return 'Cactus';
  if (l === 'fungus' || l === 'mushroom') return 'Fungus';
  if (l === 'fern') return 'Fern';
  if (l === 'herb') return 'Herb';
  if (l === 'perennial') return 'Perennial';
  if (l === 'cover') return 'Cover';
  if (l === 'nut') return 'Nut';
  if (l === 'fruit') return 'Fruit';
  if (l === 'conifer') return 'Conifer';
  if (l === 'tree') return 'Tree';
  if (l === 'shrub') return 'Shrub';
  if (l === 'specialty') return 'Specialty';

  return c;
}

function normalizeClimates(climates) {
  if (!Array.isArray(climates)) {
    if (typeof climates === 'string' && climates.trim() !== '') {
      return climates.split(',').map(s => s.trim()).map(c => {
        if (c === "Humid Subtropical") return "Subtropical";
        if (c === "Cool Northern" || c === "Continental") return "Northern";
        if (c === "Mediterranean") return "Warm / Dry";
        return c;
      }).filter(Boolean);
    }
    return [];
  }
  return climates.map(c => {
    if (c === "Humid Subtropical") return "Subtropical";
    if (c === "Cool Northern" || c === "Continental") return "Northern";
    if (c === "Mediterranean") return "Warm / Dry";
    return c;
  });
}

function parsePlantHeight(sizeStr) {
  if (!sizeStr) return 0;
  const str = String(sizeStr).trim();
  const inchMatch = str.match(/^([\d.]+)\s*"/);
  if (inchMatch) return parseFloat(inchMatch[1]) / 12.0;
  const feetMatch = str.match(/^([\d.]+)\s*'/);
  if (feetMatch) return parseFloat(feetMatch[1]);
  const numMatch = str.match(/^([\d.]+)/);
  if (numMatch) return parseFloat(numMatch[1]);
  return 0;
}

function loadPlantsData() {
  const mergedList = [];
  const seenIds = new Set();
  baselinePlantsById = {};

  function addItems(arr, defaultCat) {
    if (!Array.isArray(arr)) return;
    arr.forEach(p => {
      if (p && p.id && !seenIds.has(p.id)) {
        seenIds.add(p.id);
        const baseRecord = normalizePlantRecord(p, defaultCat);
        baselinePlantsById[p.id] = baseRecord;

        const userOverrides = userPlantEdits[p.id] || {};
        const finalRecord = Object.keys(userOverrides).length > 0
          ? normalizePlantRecord({ ...baseRecord, ...userOverrides }, baseRecord.category)
          : baseRecord;

        mergedList.push(finalRecord);
      }
    });
  }

  if (window.NUT_DATA) addItems(window.NUT_DATA, 'Nut');
  if (window.FRUIT_DATA) addItems(window.FRUIT_DATA, 'Fruit');
  if (window.TREES_DATA) addItems(window.TREES_DATA, 'Tree');
  if (window.CONIFERS_DATA) addItems(window.CONIFERS_DATA, 'Conifer');
  if (window.SHRUBS_DATA) addItems(window.SHRUBS_DATA, 'Shrub');
  if (window.FERNS_DATA) addItems(window.FERNS_DATA, 'Fern');
  if (window.COVER_DATA) addItems(window.COVER_DATA, 'Cover');
  if (window.PERENNIALS_DATA) addItems(window.PERENNIALS_DATA, 'Perennial');
  if (window.ANNUALS_DATA) addItems(window.ANNUALS_DATA, 'Annual');
  if (window.HERBS_DATA) addItems(window.HERBS_DATA, 'Herb');
  if (window.FUNGUS_DATA) addItems(window.FUNGUS_DATA, 'Fungus');
  if (window.SPECIALTY_DATA) addItems(window.SPECIALTY_DATA, 'Specialty');
  if (window.CACTUS_DATA) addItems(window.CACTUS_DATA, 'Cactus');

  plants = mergedList;
}

// =========================================================================
// SUBTYPE SINGLE-SELECT TOGGLE LOGIC
// =========================================================================
function toggleCategorySubtype(catVal, subtype) {
  if (!selectedSubtypesByCategory[catVal]) {
    selectedSubtypesByCategory[catVal] = new Set();
  }
  const set = selectedSubtypesByCategory[catVal];
  if (set.has(subtype)) {
    set.clear();
  } else {
    set.clear();
    set.add(subtype);
  }
  renderPlants();
}

function hasAnyActiveSubtypeFilter() {
  if (isAllPlantsMode) return false;
  return Object.entries(selectedSubtypesByCategory).some(
    ([cat, set]) => columnCategories.includes(cat) && set && set.size > 0
  );
}

// =========================================================================
// UNIFIED CROSS-FILTER MATCHING
// =========================================================================
function doesPlantMatchFilters(p, ignoreDimension = null) {
  const minH = HEIGHT_BREAKS[minHeightIdx];
  const maxH = HEIGHT_BREAKS[maxHeightIdx];
  const minL = LIFESPAN_BREAKS[minLifespanIdx];
  const maxL = LIFESPAN_BREAKS[maxLifespanIdx];
  const maxC = COST_BREAKS[maxCostIdx];

  if (ignoreDimension !== 'category') {
    if (!isAllPlantsMode) {
      const cat = getDisplayCategory(p.category, p.name);
      if (columnCategories.length > 0 && !columnCategories.includes(cat)) {
        return false;
      }
      if (ignoreDimension !== 'subtype') {
        const activeSubSet = selectedSubtypesByCategory[cat];
        if (activeSubSet && activeSubSet.size > 0 && !activeSubSet.has(p.subcategory)) {
          return false;
        }
      }
    }
  }

  if (ignoreDimension !== 'zone' && selectedZone !== 'all') {
    const z = parseInt(selectedZone, 10);
    if (z < p.minZone || z > p.maxZone) return false;
  }

  if (ignoreDimension !== 'climate' && selectedClimate !== 'all') {
    if (p.climates && p.climates.length > 0 && !p.climates.includes(selectedClimate)) {
      return false;
    }
  }

  if (ignoreDimension !== 'sun' && selectedSun !== 'all') {
    if (p.sun !== selectedSun) return false;
  }

  if (ignoreDimension !== 'water' && selectedWater !== 'all') {
    if (p.water !== selectedWater) return false;
  }

  if (ignoreDimension !== 'height' && (minH > 0 || maxH < Infinity)) {
    const h = parsePlantHeight(p.size);
    if (minH > 0 && h < minH) return false;
    if (maxH < Infinity && (h <= 0 || h > maxH)) return false;
  }

  if (ignoreDimension !== 'lifespan' && (minL > 0 || maxL < Infinity)) {
    if (p.lifespanParsed && p.lifespanParsed.max < Infinity) {
      if (minL > 0 && p.lifespanParsed.max < minL) return false;
      if (maxL < Infinity && p.lifespanParsed.min > maxL) return false;
    }
  }

  if (ignoreDimension !== 'cost' && maxC < Infinity) {
    const costMin = p.costParsed ? p.costParsed.min : 0;
    if (costMin > maxC) return false;
  }

  if (ignoreDimension !== 'infographics' && filterInfographics) {
    if (!hasInfographic(p)) return false;
  }

  if (ignoreDimension !== 'available' && filterAvailable) {
    if (!hasPositiveInventory(p)) return false;
  }

  if (ignoreDimension !== 'nonInvasive' && filterNonInvasive) {
    if (p.invasive === true) return false;
  }

  if (ignoreDimension !== 'septicSafe' && filterSepticSafe) {
    if (p.septicRisk) return false;
  }

  if (ignoreDimension !== 'search' && searchQuery) {
    const originStr = p.origin || '';
    const locStr = p.location || '';
    const flowerStr = p.flower || '';
    const text = `${p.name} ${p.botanical || ''} ${flowerStr} ${originStr} ${locStr} ${p.notes || ''} ${p.category} ${p.subcategory || ''}`.toLowerCase();
    if (!text.includes(searchQuery)) return false;
  }

  return true;
}

function isZoneSupported(z) {
  if (selectedClimate !== 'all') {
    const rule = CLIMATE_ZONE_RULES[selectedClimate];
    if (rule && (z < rule.min || z > rule.max)) return false;
  }
  return plants.some(p => z >= p.minZone && z <= p.maxZone && doesPlantMatchFilters(p, 'zone'));
}

function isClimateSupported(climateName) {
  if (selectedZone !== 'all') {
    const z = parseInt(selectedZone, 10);
    const rule = CLIMATE_ZONE_RULES[climateName];
    if (rule && (z < rule.min || z > rule.max)) return false;
  }
  return plants.some(p => p.climates && p.climates.includes(climateName) && doesPlantMatchFilters(p, 'climate'));
}

function isSunSupported(sunVal) {
  return plants.some(p => p.sun === sunVal && doesPlantMatchFilters(p, 'sun'));
}

function isWaterSupported(waterVal) {
  return plants.some(p => p.water === waterVal && doesPlantMatchFilters(p, 'water'));
}

function isCategorySupported(catVal) {
  return plants.some(p => getDisplayCategory(p.category, p.name) === catVal && doesPlantMatchFilters(p, 'category'));
}

function updateFilterAvailability() {
  const anyPlantHasInventory = plants.some(p => hasPositiveInventory(p));
  const availLabel = document.getElementById('available-filter-label');
  const attrGrid = document.getElementById('attribute-checkboxes-grid');
  if (availLabel) {
    availLabel.classList.toggle('hidden', !anyPlantHasInventory);
  }
  if (attrGrid) {
    attrGrid.className = anyPlantHasInventory ? 'grid grid-cols-3 gap-1.5' : 'grid grid-cols-2 gap-1.5';
  }
  if (!anyPlantHasInventory && filterAvailable) {
    filterAvailable = false;
    const availTog = document.getElementById('toggle-available');
    if (availTog) availTog.checked = false;
  }

  for (let pass = 0; pass < 3; pass++) {
    let changed = false;

    if (!isAllPlantsMode) {
      Object.keys(selectedSubtypesByCategory).forEach(cat => {
        if (!columnCategories.includes(cat)) {
          if (selectedSubtypesByCategory[cat] && selectedSubtypesByCategory[cat].size > 0) {
            selectedSubtypesByCategory[cat].clear();
            changed = true;
          }
          return;
        }
        const activeSet = selectedSubtypesByCategory[cat];
        if (!activeSet || activeSet.size === 0) return;

        const validCategoryPlants = plants.filter(
          p => getDisplayCategory(p.category, p.name) === cat && doesPlantMatchFilters(p, 'subtype')
        );
        const validSubs = new Set(validCategoryPlants.map(p => p.subcategory));
        Array.from(activeSet).forEach(sub => {
          if (!validSubs.has(sub)) {
            activeSet.delete(sub);
            changed = true;
          }
        });
      });
    }

    if (selectedZone !== 'all' && !isZoneSupported(parseInt(selectedZone, 10))) {
      selectedZone = 'all';
      changed = true;
    }

    if (selectedClimate !== 'all' && !isClimateSupported(selectedClimate)) {
      selectedClimate = 'all';
      changed = true;
    }

    if (selectedSun !== 'all' && !isSunSupported(selectedSun)) {
      selectedSun = 'all';
      changed = true;
    }

    if (selectedWater !== 'all' && !isWaterSupported(selectedWater)) {
      selectedWater = 'all';
      changed = true;
    }

    if (!changed) break;
  }

  // Zone Buttons (13 down to 3)
  for (let z = 13; z >= 3; z--) {
    const btn = document.querySelector(`.zone-btn[data-zone="${z}"]`);
    if (!btn) continue;
    const isSupported = isZoneSupported(z);
    btn.disabled = !isSupported;
    btn.classList.toggle('opacity-20', !isSupported);
    btn.classList.toggle('cursor-not-allowed', !isSupported);
    btn.classList.toggle('pointer-events-none', !isSupported);
    btn.classList.toggle('grayscale', !isSupported);
  }

  // Climate Pills
  CLIMATES_LIST.forEach(climateName => {
    const pill = document.querySelector(`.climate-pill[data-climate="${climateName}"]`);
    if (!pill) return;
    const isSupported = isClimateSupported(climateName);
    pill.disabled = !isSupported;
    pill.classList.toggle('opacity-25', !isSupported);
    pill.classList.toggle('cursor-not-allowed', !isSupported);
    pill.classList.toggle('pointer-events-none', !isSupported);
    pill.classList.toggle('line-through', !isSupported);
  });

  // Light Buttons
  SUN_OPTIONS.forEach(sunVal => {
    const btn = document.querySelector(`.sun-slider-btn[data-sun="${sunVal}"]`);
    if (!btn) return;
    const isSupported = isSunSupported(sunVal);
    btn.disabled = !isSupported;
    btn.classList.toggle('opacity-25', !isSupported);
    btn.classList.toggle('cursor-not-allowed', !isSupported);
    btn.classList.toggle('pointer-events-none', !isSupported);
    btn.classList.toggle('line-through', !isSupported);
  });

  // Water Buttons
  WATER_OPTIONS.forEach(waterVal => {
    const btn = document.querySelector(`.water-slider-btn[data-water="${waterVal}"]`);
    if (!btn) return;
    const isSupported = isWaterSupported(waterVal);
    btn.disabled = !isSupported;
    btn.classList.toggle('opacity-25', !isSupported);
    btn.classList.toggle('cursor-not-allowed', !isSupported);
    btn.classList.toggle('pointer-events-none', !isSupported);
    btn.classList.toggle('line-through', !isSupported);
  });

  const allPlantsSupported = plants.some(p => doesPlantMatchFilters(p, 'category'));
  const allPlantsBtn = document.getElementById('cat-tab-all-plants');
  if (allPlantsBtn) {
    allPlantsBtn.disabled = !allPlantsSupported && !isAllPlantsMode;
    allPlantsBtn.classList.toggle('opacity-25', !allPlantsSupported);
    allPlantsBtn.classList.toggle('cursor-not-allowed', !allPlantsSupported && !isAllPlantsMode);
    allPlantsBtn.classList.toggle('pointer-events-none', !allPlantsSupported && !isAllPlantsMode);
    allPlantsBtn.classList.toggle('line-through', !allPlantsSupported);
  }

  // Individual Category Buttons & Column Selects
  ALL_CATEGORIES.forEach(cat => {
    const isSupported = isCategorySupported(cat.val);
    const isActiveCol = !isAllPlantsMode && columnCategories.includes(cat.val);
    const btn = document.querySelector(`#category-tabs-container button[data-category="${cat.val}"]`);

    if (btn) {
      const disableBtn = !isSupported && !isActiveCol;
      btn.disabled = disableBtn;
      btn.classList.toggle('opacity-25', !isSupported);
      btn.classList.toggle('cursor-not-allowed', disableBtn);
      btn.classList.toggle('pointer-events-none', disableBtn);
      btn.classList.toggle('line-through', !isSupported);
    }

    document.querySelectorAll(`select[id^="col-select-"] option[value="${cat.val}"]`).forEach(opt => {
      opt.disabled = !isSupported && !isActiveCol;
    });
  });

  // Dialog Checkboxes
  const dialogChecks = [
    { id: 'toggle-infographics', dim: 'infographics', fn: p => hasInfographic(p), active: filterInfographics },
    { id: 'toggle-available', dim: 'available', fn: p => hasPositiveInventory(p), active: filterAvailable },
    { id: 'toggle-non-invasive', dim: 'nonInvasive', fn: p => p.invasive !== true, active: filterNonInvasive },
    { id: 'toggle-septic-safe', dim: 'septicSafe', fn: p => !p.septicRisk, active: filterSepticSafe }
  ];
  dialogChecks.forEach(({ id, dim, fn, active }) => {
    const chk = document.getElementById(id);
    if (!chk) return;
    const supported = active || plants.some(p => fn(p) && doesPlantMatchFilters(p, dim));
    chk.disabled = !supported;
    if (chk.parentElement) {
      chk.parentElement.classList.toggle('opacity-40', !supported);
      chk.parentElement.classList.toggle('pointer-events-none', !supported);
    }
  });

  updateZoneUI();
  updateClimatePillsUI();
  updateSunSliderUI();
  updateWaterSliderUI();
  updateCategoryTabsUI();
}

function updateClimatePillsUI() {
  document.querySelectorAll('.climate-pill').forEach(btn => {
    btn.classList.toggle('climate-pill-active', btn.dataset.climate === selectedClimate);
  });
}

function sortColumnCategories() {
  const order = ALL_CATEGORIES.map(c => c.val);
  columnCategories.sort((a, b) => order.indexOf(a) - order.indexOf(b));
}

function handleAllPlantsClick() {
  isAllPlantsMode = true;
  columnCategories = [];
  renderPlants();
}

function handleCategoryTabClick(catVal) {
  if (isAllPlantsMode) {
    if (!isCategorySupported(catVal)) return;
    isAllPlantsMode = false;
    columnCategories = [catVal];
    renderPlants();
    return;
  }

  const idx = columnCategories.indexOf(catVal);
  if (idx !== -1) {
    columnCategories.splice(idx, 1);
    if (selectedSubtypesByCategory[catVal]) {
      selectedSubtypesByCategory[catVal].clear();
    }
    if (columnCategories.length === 0) {
      isAllPlantsMode = true;
    }
  } else {
    if (!isCategorySupported(catVal)) return;
    columnCategories.push(catVal);
    sortColumnCategories();
  }
  renderPlants();
}

function closeColumnByIndex(idx) {
  if (isAllPlantsMode) return;

  if (idx >= 0 && idx < columnCategories.length) {
    const removedCat = columnCategories[idx];
    columnCategories.splice(idx, 1);
    if (removedCat && selectedSubtypesByCategory[removedCat]) {
      selectedSubtypesByCategory[removedCat].clear();
    }
    if (columnCategories.length === 0) {
      isAllPlantsMode = true;
    }
    renderPlants();
  }
}






function renderCategoryToggleButtons() {
  const container = document.getElementById('category-tabs-container');
  if (!container) return;

  const allPlantsBtn = `
    <button
      id="cat-tab-all-plants"
      data-category="ALL"
      onclick="handleAllPlantsClick()"
      class="cat-tab px-2.5 py-1 rounded-xl border border-stone-300 bg-stone-100 text-xs font-semibold text-stone-700 hover:bg-stone-200 transition cursor-pointer whitespace-nowrap flex items-center gap-1 shrink-0"
    >
      <span>🌐 All Plants</span>
    </button>
  `;

  const categoryBtns = ALL_CATEGORIES.map(cat => `
    <button
      data-category="${cat.val}"
      onclick="handleCategoryTabClick('${cat.val}')"
      onmouseenter="triggerButtonHoverOverlay('infographics/${cat.file}/${cat.file}.webp')"
      onmouseleave="clearButtonHoverOverlay()"
      class="cat-tab px-2.5 py-1 rounded-xl border border-stone-300 bg-stone-100 text-xs font-semibold text-stone-700 hover:bg-stone-200 transition cursor-pointer whitespace-nowrap flex items-center gap-1 shrink-0"
    >
      <span>${cat.label}</span>
    </button>
  `).join('');

  // Sort icon button placed on Row 3 immediately after the Cactus button
  const sortTypeBtn = `
    <button
      type="button"
      id="sort-btn-type"
      onclick="toggleSort('type')"
      class="px-2 py-1 rounded-xl border border-stone-300 bg-stone-100 font-bold text-stone-700 hover:bg-stone-200 transition flex items-center justify-center cursor-pointer text-xs shadow-2xs shrink-0"
      title="Sort by Plant Name (Default: Not Sorted)"
    >
      <span id="sort-icon-type" class="text-xs">⇅</span>
    </button>
  `;

  container.innerHTML = allPlantsBtn + categoryBtns + sortTypeBtn;
  updateSortUI();
}






function updateCategoryTabsUI() {
  const allBtn = document.getElementById('cat-tab-all-plants');
  if (allBtn) {
    if (isAllPlantsMode) {
      allBtn.classList.add('cat-tab-active');
    } else {
      allBtn.classList.remove('cat-tab-active');
    }
  }

  ALL_CATEGORIES.forEach(cat => {
    const btn = document.querySelector(`#category-tabs-container button[data-category="${cat.val}"]`);
    const colIdx = !isAllPlantsMode ? columnCategories.indexOf(cat.val) : -1;

    if (btn) {
      if (colIdx !== -1) {
        btn.classList.add('cat-tab-active');
      } else {
        btn.classList.remove('cat-tab-active');
      }
    }
  });
}

function updateGridContainerLayout(numCols) {
  const gridEl = document.getElementById('three-column-grid');
  if (!gridEl) return;

  if (numCols <= 1) {
    gridEl.className = "grid grid-cols-1 w-full gap-4 items-start";
  } else if (numCols === 2) {
    gridEl.className = "grid grid-cols-1 md:grid-cols-2 w-full gap-4 items-start";
  } else if (numCols === 3) {
    gridEl.className = "grid grid-cols-1 md:grid-cols-3 w-full gap-4 items-start";
  } else if (numCols === 4) {
    gridEl.className = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 w-full gap-3.5 items-start";
  } else {
    gridEl.className = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 w-full gap-3.5 items-start";
  }
}

function renderColumnList(colIndex, plantList, colTitle) {
  const listEl = document.getElementById(`col-list-${colIndex}`);
  const countEl = document.getElementById(`col-count-${colIndex}`);
  if (!listEl) return;

  if (countEl) countEl.textContent = plantList.length;

  const catKey = getCategoryFileKey(colTitle);
  let html = '';

  if (filterInfographics && colTitle !== 'All Plants' && !showGridView) {
    html += `
      <div class="mb-2.5 rounded-2xl overflow-hidden border border-amber-300/80 bg-stone-900 shadow-xs relative group">
        <div class="aspect-[16/9] w-full bg-stone-950 flex items-center justify-center overflow-hidden">
          <img
            src="infographics/${catKey}/${catKey}.webp"
            alt="${colTitle} Infographic"
            onerror="this.onerror=null; this.src=generateCategoryBannerSvg('${colTitle}');"
            class="w-full h-full object-cover group-hover:scale-102 transition duration-300"
          />
          <div class="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-stone-950/25 to-transparent flex flex-col justify-end p-2.5 text-white pointer-events-none">
            <span class="text-[9px] font-bold tracking-widest uppercase text-amber-400">Category Infographic</span>
            <h4 class="text-xs sm:text-sm font-serif-title font-bold text-white drop-shadow">${colTitle}</h4>
          </div>
        </div>
      </div>
    `;
  }

  if (plantList.length === 0) {
    listEl.className = "space-y-1.5";
    listEl.style.gridTemplateColumns = "";
    html += `<div class="text-[11px] text-stone-400 italic text-center py-5 bg-white rounded-xl border border-dashed border-stone-200">No matching plants</div>`;
    listEl.innerHTML = html;
    return;
  }

  // Pack as many images per row as possible when Grid View is active
  if (showGridView) {
    listEl.className = "grid gap-2";
    listEl.style.gridTemplateColumns = "repeat(auto-fill, minmax(145px, 1fr))";
  } else {
    listEl.className = "space-y-1.5";
    listEl.style.gridTemplateColumns = "";
  }

  html += plantList.map(plant => generatePlantCardHTML(plant, false)).join('');
  listEl.innerHTML = html;
}

function renderColumnContainers() {
  const gridEl = document.getElementById('three-column-grid');
  if (!gridEl) return;

  if (!isAllPlantsMode && columnCategories.length === 0) {
    isAllPlantsMode = true;
  }

  if (isAllPlantsMode) {
    updateGridContainerLayout(1);
    gridEl.innerHTML = `
      <div
        id="col-container-0"
        data-col-idx="0"
        class="bg-white border-2 border-stone-200 rounded-2xl p-2.5 flex flex-col shadow-xs transition-all min-w-0"
      >
        <div class="flex items-center justify-between gap-1.5 pb-2 mb-2 border-b border-stone-200">
          <div class="flex items-center gap-1 flex-1 min-w-0">
            <span class="text-xs sm:text-sm font-bold text-stone-900">🌐 All</span>
          </div>
          <div class="flex items-center gap-1 shrink-0">
            <span id="col-count-0" class="text-[11px] font-semibold px-2 py-0.2 rounded-full bg-stone-100 text-stone-700">0</span>
          </div>
        </div>
        <div id="col-list-0" class="space-y-1.5"></div>
      </div>
    `;
    return;
  }

  updateGridContainerLayout(columnCategories.length);

  gridEl.innerHTML = columnCategories.map((cat, i) => `
    <div
      id="col-container-${i}"
      data-col-idx="${i}"
      class="bg-white border-2 border-stone-200 rounded-2xl p-2.5 flex flex-col shadow-xs transition-all min-w-0"
    >
      <div class="flex items-center justify-between gap-1.5 pb-2 mb-2 border-b border-stone-200">
        <div class="flex items-center gap-1 flex-1 min-w-0">
          <select
            id="col-select-${i}"
            onchange="changeColumnCategory(${i}, this.value)"
            class="text-xs sm:text-sm font-bold text-stone-900 bg-transparent border-0 focus:ring-0 cursor-pointer truncate"
          >
            ${ALL_CATEGORIES.map(c => `<option value="${c.val}" ${c.val === cat ? 'selected' : ''}>${c.label}</option>`).join('')}
          </select>
        </div>
        <div class="flex items-center gap-1 shrink-0">
          <span id="col-count-${i}" class="text-[11px] font-semibold px-2 py-0.2 rounded-full bg-stone-100 text-stone-700">0</span>
          <button onclick="closeColumnByIndex(${i})" class="w-5 h-5 rounded-md text-stone-400 hover:text-rose-600 hover:bg-stone-100 flex items-center justify-center text-xs cursor-pointer" title="Close this column">✕</button>
        </div>
      </div>

      <div id="col-subtypes-${i}" class="subtype-bar pb-2 mb-2 border-b border-stone-100 hidden"></div>
      <div id="col-list-${i}" class="space-y-1.5"></div>
    </div>
  `).join('');
}

function changeColumnCategory(colIndex, newCat) {
  const oldCat = columnCategories[colIndex];
  if (oldCat === newCat) return;

  const otherIdx = columnCategories.indexOf(newCat);
  if (otherIdx !== -1) {
    columnCategories[otherIdx] = oldCat;
  } else {
    if (selectedSubtypesByCategory[oldCat]) {
      selectedSubtypesByCategory[oldCat].clear();
    }
  }
  columnCategories[colIndex] = newCat;
  sortColumnCategories();
  renderPlants();
}

// --- FILTER ACTIONS ---
function toggleInfographics(checked) {
  filterInfographics = checked;
  renderPlants();
}

function toggleAvailable(checked) {
  filterAvailable = checked;
  renderPlants();
}

function toggleNonInvasive(checked) {
  filterNonInvasive = checked;
  renderPlants();
}

function toggleSepticSafe(checked) {
  filterSepticSafe = checked;
  renderPlants();
}

function handleMinHeightChange(val) {
  let v = parseInt(val, 10);
  if (v >= maxHeightIdx) {
    v = maxHeightIdx - 1;
    const minSlider = document.getElementById('height-min-slider');
    if (minSlider) minSlider.value = v;
  }
  minHeightIdx = v;
  updateHeightSliderUI();
  renderPlants();
}

function handleMaxHeightChange(val) {
  let v = parseInt(val, 10);
  if (v <= minHeightIdx) {
    v = minHeightIdx + 1;
    const maxSlider = document.getElementById('height-max-slider');
    if (maxSlider) maxSlider.value = v;
  }
  maxHeightIdx = v;
  updateHeightSliderUI();
  renderPlants();
}

function updateHeightSliderUI() {
  const label = document.getElementById('height-value-label');
  if (!label) return;

  const labels = useMetric ? HEIGHT_LABELS_METRIC : HEIGHT_LABELS_IMPERIAL;
  const minLabel = labels[minHeightIdx];
  const maxLabel = labels[maxHeightIdx];

  if (minHeightIdx === 0 && maxHeightIdx === 9) {
    label.textContent = "0 – Any";
  } else if (minHeightIdx === 0) {
    label.textContent = `≤ ${maxLabel}`;
  } else if (maxHeightIdx === 9) {
    label.textContent = `≥ ${minLabel}`;
  } else {
    label.textContent = `${minLabel} – ${maxLabel}`;
  }
}

function handleCostChange(val) {
  maxCostIdx = parseInt(val, 10);
  updateCostSliderUI();
  renderPlants();
}

function updateCostSliderUI() {
  const label = document.getElementById('cost-value-label');
  if (!label) return;
  label.textContent = COST_LABELS[maxCostIdx] || 'Any Cost';
}

function handleMinLifespanChange(val) {
  let v = parseInt(val, 10);
  if (v >= maxLifespanIdx) {
    v = maxLifespanIdx - 1;
    const minSlider = document.getElementById('lifespan-min-slider');
    if (minSlider) minSlider.value = v;
  }
  minLifespanIdx = v;
  updateLifespanSliderUI();
  renderPlants();
}

function handleMaxLifespanChange(val) {
  let v = parseInt(val, 10);
  if (v <= minLifespanIdx) {
    v = minLifespanIdx + 1;
    const maxSlider = document.getElementById('lifespan-max-slider');
    if (maxSlider) maxSlider.value = v;
  }
  maxLifespanIdx = v;
  updateLifespanSliderUI();
  renderPlants();
}

function updateLifespanSliderUI() {
  const label = document.getElementById('lifespan-value-label');
  if (!label) return;

  const minLabel = LIFESPAN_LABELS[minLifespanIdx];
  const maxLabel = LIFESPAN_LABELS[maxLifespanIdx];

  if (minLifespanIdx === 0 && maxLifespanIdx === 8) {
    label.textContent = "0 – Any";
  } else if (minLifespanIdx === 0) {
    label.textContent = `≤ ${maxLabel}`;
  } else if (maxLifespanIdx === 8) {
    label.textContent = `≥ ${minLabel}`;
  } else {
    label.textContent = `${minLabel} – ${maxLabel}`;
  }
}

// --- MAIN RENDER PIPELINE ---
function renderPlants() {
  renderColumnContainers();
  updateFilterAvailability();
  updateFilterButtonBadge();

  const emptyState = document.getElementById('empty-state');
  const matchBadge = document.getElementById('header-match-badge');
  const resetBtn = document.getElementById('reset-all-btn');

  const globallyFiltered = plants.filter(p => doesPlantMatchFilters(p, 'category'));
  const activeFiltered = isAllPlantsMode ? globallyFiltered : plants.filter(p => doesPlantMatchFilters(p, null));

  if (matchBadge) matchBadge.textContent = `${activeFiltered.length} Plants`;

  const isFiltered = (
    !isAllPlantsMode ||
    selectedZone !== 'all' ||
    selectedClimate !== 'all' ||
    selectedSun !== 'all' ||
    selectedWater !== 'all' ||
    minHeightIdx > 0 ||
    maxHeightIdx < 9 ||
    minLifespanIdx > 0 ||
    maxLifespanIdx < 8 ||
    maxCostIdx < 8 ||
    filterInfographics ||
    filterAvailable ||
    filterNonInvasive ||
    filterSepticSafe ||
    searchQuery ||
    currentSortGroup !== null ||
    hasAnyActiveSubtypeFilter()
  );
  if (resetBtn) resetBtn.classList.toggle('hidden', !isFiltered);

  const banner = document.getElementById('active-filter-banner');
  const bannerText = document.getElementById('active-filter-text');
  if (banner && bannerText) {
    if (isFiltered) {
      banner.classList.remove('hidden');
      let heightText = '';
      if (minHeightIdx > 0 || maxHeightIdx < 9) {
        heightText = `height <span class="bg-stone-200 text-stone-800 px-2 py-0.5 rounded text-xs font-bold">${document.getElementById('height-value-label').textContent}</span> `;
      }
      let lifeText = '';
      if (minLifespanIdx > 0 || maxLifespanIdx < 8) {
        lifeText = `lifespan <span class="bg-stone-200 text-stone-800 px-2 py-0.5 rounded text-xs font-bold">${document.getElementById('lifespan-value-label').textContent}</span> `;
      }
      let costText = '';
      if (maxCostIdx < 8) {
        costText = `cost <span class="bg-stone-200 text-stone-800 px-2 py-0.5 rounded text-xs font-bold">${COST_LABELS[maxCostIdx]}</span> `;
      }
      let sortText = '';
      if (currentSortGroup) {
        const dirSymbol = currentSortDirection === 'desc' ? '↓' : '↑';
        sortText = `sorted by <span class="bg-stone-200 text-stone-800 px-2 py-0.5 rounded text-xs font-bold">${capitalize(currentSortGroup)} ${dirSymbol}</span> `;
      }
      bannerText.innerHTML = `Showing <strong>${activeFiltered.length}</strong> matching plants ` +
        (!isAllPlantsMode && columnCategories.length > 0 ? `in <span class="bg-emerald-100 text-emerald-950 px-2 py-0.5 rounded text-xs font-bold">${columnCategories.join(', ')}</span> ` : '') +
        (selectedZone !== 'all' ? `in <span class="bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded text-xs">Zone ${selectedZone} (${getZoneTempText(selectedZone)})</span> ` : '') +
        (selectedClimate !== 'all' ? `with climate <span class="bg-teal-100 text-teal-900 px-2 py-0.5 rounded text-xs">${selectedClimate}</span> ` : '') +
        (selectedSun !== 'all' ? `with light <span class="bg-amber-100 text-amber-900 px-2 py-0.5 rounded text-xs">${selectedSun}</span> ` : '') +
        (selectedWater !== 'all' ? `water <span class="bg-sky-100 text-sky-900 px-2 py-0.5 rounded text-xs">${selectedWater}</span> ` : '') +
        heightText +
        lifeText +
        costText +
        sortText +
        (filterInfographics ? `<span class="bg-amber-100 text-amber-900 px-2 py-0.5 rounded text-xs font-bold">📊 Infographics Only</span> ` : '') +
        (filterAvailable ? `<span class="bg-amber-100 text-amber-950 px-2 py-0.5 rounded text-xs font-bold">📦 Available Only</span> ` : '') +
        (filterNonInvasive ? `<span class="bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded text-xs font-bold">🛡️ non-Invasive Only</span> ` : '') +
        (filterSepticSafe ? `<span class="bg-teal-100 text-teal-900 px-2 py-0.5 rounded text-xs font-bold">🚽 Septic Safe Only</span> ` : '');
    } else {
      banner.classList.add('hidden');
    }
  }

  firstVisiblePlant = null;
  visiblePlantsOrder = [];

  if (isAllPlantsMode) {
    const matched = sortPlantList(globallyFiltered);
    if (matched.length > 0) {
      firstVisiblePlant = matched[0];
    }
    visiblePlantsOrder = matched;
    renderColumnList(0, matched, 'All');

    if (matched.length === 0) {
      if (emptyState) emptyState.classList.remove('hidden');
    } else {
      if (emptyState) emptyState.classList.add('hidden');
    }
    updateShowItemsPreview();
    return;
  }

  columnCategories.forEach((cat, i) => {
    const categoryValidPlants = globallyFiltered.filter(p => getDisplayCategory(p.category, p.name) === cat);

    const validSubtypes = [];
    categoryValidPlants.forEach(p => {
      if (p.subcategory && !validSubtypes.includes(p.subcategory)) {
        validSubtypes.push(p.subcategory);
      }
    });

    const activeSet = selectedSubtypesByCategory[cat] || new Set();
    const activeValidSubtypes = validSubtypes.filter(s => activeSet.has(s));

    renderColumnSubtypesBar(i, cat, validSubtypes, activeSet);

    let matched = activeValidSubtypes.length > 0
      ? categoryValidPlants.filter(p => activeValidSubtypes.includes(p.subcategory))
      : categoryValidPlants;

    matched = sortPlantList(matched);
    if (!firstVisiblePlant && matched.length > 0) {
      firstVisiblePlant = matched[0];
    }
    visiblePlantsOrder.push(...matched);
    renderColumnList(i, matched, cat);
  });

  if (visiblePlantsOrder.length === 0 && activeFiltered.length > 0) {
    visiblePlantsOrder = sortPlantList(activeFiltered);
  }

  if (!firstVisiblePlant && activeFiltered.length > 0) {
    firstVisiblePlant = activeFiltered[0];
  } else if (!firstVisiblePlant && plants.length > 0) {
    firstVisiblePlant = plants[0];
  }

  if (activeFiltered.length === 0 && columnCategories.length > 0) {
    if (emptyState) emptyState.classList.remove('hidden');
  } else {
    if (emptyState) emptyState.classList.add('hidden');
  }

  updateShowItemsPreview();
}

function renderColumnSubtypesBar(colIndex, catVal, validSubtypes, activeSet) {
  const barEl = document.getElementById(`col-subtypes-${colIndex}`);
  if (!barEl) return;

  if (!validSubtypes || validSubtypes.length === 0) {
    barEl.innerHTML = '';
    barEl.classList.add('hidden');
    return;
  }

  barEl.classList.remove('hidden');
  barEl.innerHTML = validSubtypes.map(sub => {
    const isActive = activeSet.has(sub);
    const escapedCat = escapeXml(catVal).replace(/'/g, "\\'");
    const escapedSub = escapeXml(sub).replace(/'/g, "\\'");
    const activeClasses = isActive
      ? 'subtype-btn-active bg-emerald-800 text-white border-emerald-900 font-bold shadow-2xs'
      : 'bg-stone-100 text-stone-700 border-stone-300 hover:bg-stone-200 font-semibold';

    return `
      <button
        type="button"
        onclick="toggleCategorySubtype('${escapedCat}', '${escapedSub}')"
        title="${escapeXml(sub)}"
        class="subtype-btn px-2 py-1 rounded-lg border text-[11px] transition cursor-pointer select-none ${activeClasses}"
      >
        ${escapeXml(sub)}
      </button>
    `;
  }).join('');
}


function getSunEmoji(sun) {
  if (!sun) return '☀️';
  if (sun.includes('Full Sun')) return '☀️';
  if (sun.includes('Part Sun')) return '🌤️';
  if (sun.includes('Part Shade')) return '⛅';
  if (sun.includes('Shade')) return '🌑';
  return '☀️';
}

function getWaterEmoji(water) {
  if (!water) return '💧';
  if (water === 'Bog') return '🍄';
  if (water === 'Low') return '🌵';
  if (water === 'High') return '💦';
  return '💧';
}

// =========================================================================
// ZONE BUTTONS (13 TO 3) + ZONE SORT BUTTON
// =========================================================================
function renderZoneButtons() {
  const container = document.getElementById('zone-buttons-container');
  if (!container) return;

  let html = `
    <button
      data-zone="all"
      onclick="selectZone('all')"
      onmouseenter="previewZoneTemp('all')"
      onmouseleave="restoreZoneTemp()"
      class="zone-btn zone-btn-active px-2 py-0.5 rounded-lg border border-stone-300 bg-stone-100 text-xs font-semibold text-stone-800 hover:bg-stone-200 transition cursor-pointer"
    >
      <span class="font-bold">All</span> <span class="text-[9px] font-normal opacity-75">Zones</span>
    </button>
  `;

  for (let z = 13; z >= 3; z--) {
    const meta = ZONE_METADATA[z];
    html += `
      <button
        data-zone="${z}"
        onclick="selectZone(${z})"
        onmouseenter="previewZoneTemp(${z})"
        onmouseleave="restoreZoneTemp()"
        style="background-color: ${meta.bg}; color: ${meta.text}; border-color: ${meta.border};"
        class="zone-btn px-2 py-0.5 rounded-lg border text-xs transition cursor-pointer hover:brightness-95"
        title="Zone ${z}: ${getZoneTempText(z)}"
      >
        <span class="text-[9px] font-normal opacity-75 mr-0.5">Zone</span><span class="font-bold text-xs">${z}</span>
      </button>
    `;
  }

  html += `
    <button
      type="button"
      id="sort-btn-zone"
      onclick="toggleSort('zone')"
      class="px-2 py-0.5 rounded-lg border border-stone-300 bg-stone-100 font-bold text-stone-700 hover:bg-stone-200 transition flex items-center justify-center cursor-pointer text-xs shadow-2xs"
      title="Sort by Zone"
    >
      <span id="sort-icon-zone" class="text-xs">⇅</span>
    </button>
  `;

  html += `
    <div
      id="zone-temp-display"
      class="ml-0.5 px-2.5 py-0.5 rounded-lg text-xs font-bold border transition-all select-none whitespace-nowrap bg-stone-100 border-stone-300 text-stone-700 shadow-2xs"
    >
      🌡️ ${getZoneTempText('all')} (All Zones)
    </div>
  `;

  container.innerHTML = html;
  updateZoneUI();
  updateSortUI();
}

function selectZone(z) {
  if (z === 'all') {
    selectedZone = 'all';
  } else {
    selectedZone = (selectedZone === String(z)) ? 'all' : String(z);
  }
  renderPlants();
}

function previewZoneTemp(z) {
  updateZoneTempDisplay(z);
}

function restoreZoneTemp() {
  updateZoneTempDisplay(selectedZone);
}

function updateZoneTempDisplay(z) {
  const display = document.getElementById('zone-temp-display');
  if (!display) return;

  if (z === 'all') {
    display.innerHTML = `🌡️ All Zones (${getZoneTempText('all')})`;
    display.style.backgroundColor = '#f5f5f4';
    display.style.color = '#44403c';
    display.style.borderColor = '#d6d3d1';
  } else {
    const meta = ZONE_METADATA[z];
    if (meta) {
      display.innerHTML = `🌡️ Zone ${z}: <strong>${getZoneTempText(z)}</strong>`;
      display.style.backgroundColor = meta.bg;
      display.style.color = meta.text;
      display.style.borderColor = meta.border;
    }
  }
}

function updateZoneUI() {
  document.querySelectorAll('.zone-btn').forEach(btn => {
    const z = btn.dataset.zone;
    const isActive = (String(z) === String(selectedZone));

    if (z === 'all') {
      if (isActive) {
        btn.className = "zone-btn px-2 py-0.5 rounded-lg border text-xs font-bold transition cursor-pointer bg-stone-900 text-white border-stone-950 shadow-sm";
      } else {
        btn.className = "zone-btn px-2 py-0.5 rounded-lg border border-stone-300 bg-stone-100 text-xs font-semibold text-stone-800 hover:bg-stone-200 transition cursor-pointer";
      }
    } else {
      const meta = ZONE_METADATA[z];
      if (meta) {
        btn.title = `Zone ${z}: ${getZoneTempText(z)}`;
        if (isActive) {
          btn.style.backgroundColor = meta.mapColor;
          btn.style.color = meta.mapText;
          btn.style.borderColor = meta.mapColor;
          btn.style.boxShadow = `0 3px 8px ${meta.mapColor}55`;
          btn.style.fontWeight = '700';
          btn.style.transform = 'scale(1.03)';
        } else {
          btn.style.backgroundColor = meta.bg;
          btn.style.color = meta.text;
          btn.style.borderColor = meta.border;
          btn.style.boxShadow = 'none';
          btn.style.fontWeight = '500';
          btn.style.transform = 'none';
        }
      }
    }
  });

  updateZoneTempDisplay(selectedZone);
}

// --- CLIMATE PILLS + SORT BUTTON ---
function renderClimatePills() {
  const container = document.getElementById('climate-pills-container');
  if (!container) return;

  let html = CLIMATES_LIST.map(c => 
    `<button 
      data-climate="${c}" 
      onclick="toggleClimate('${c}')" 
      class="climate-pill px-2 py-0.5 rounded-lg border border-teal-200 bg-teal-50/60 text-xs font-semibold text-teal-900 hover:bg-teal-100 transition cursor-pointer">${c}</button>`
  ).join('');

  html += `
    <button
      type="button"
      id="sort-btn-climate"
      onclick="toggleSort('climate')"
      class="px-2 py-0.5 rounded-lg border border-stone-300 bg-stone-100 font-bold text-stone-700 hover:bg-stone-200 transition flex items-center justify-center cursor-pointer text-xs shadow-2xs"
      title="Sort by Climate &amp; Habitat"
    >
      <span id="sort-icon-climate" class="text-xs">⇅</span>
    </button>
  `;

  container.innerHTML = html;
  updateSortUI();
}

function toggleClimate(c) {
  selectedClimate = (selectedClimate === c) ? 'all' : c;
  renderPlants();
}

// --- 4-BUTTON LIGHT SLIDER ---
function setSunFilter(val) {
  selectedSun = (selectedSun === val) ? 'all' : val;
  renderPlants();
}

function updateSunSliderUI() {
  document.querySelectorAll('.sun-slider-btn').forEach(btn => {
    const isActive = (btn.dataset.sun === selectedSun);
    btn.classList.toggle('slider-track-btn-active', isActive);
    if (isActive) {
      btn.classList.remove('text-stone-700');
    } else {
      btn.classList.add('text-stone-700');
    }
  });
}

// --- 4-BUTTON WATER SLIDER ---
function setWaterFilter(val) {
  selectedWater = (selectedWater === val) ? 'all' : val;
  renderPlants();
}

function updateWaterSliderUI() {
  document.querySelectorAll('.water-slider-btn').forEach(btn => {
    const isActive = (btn.dataset.water === selectedWater);
    btn.classList.toggle('water-track-btn-active', isActive);
    if (isActive) {
      btn.classList.remove('text-stone-700');
    } else {
      btn.classList.add('text-stone-700');
    }
  });
}

function handleSearchInput(val) {
  searchQuery = (val || '').toLowerCase().trim();
  const input = document.getElementById('search-input');
  if (input && input.value !== val) input.value = val;
  const clearBtn = document.getElementById('clear-search-btn');
  if (clearBtn) clearBtn.classList.toggle('hidden', !searchQuery);
  renderPlants();
}

function resetAllFilters() {
  isAllPlantsMode = false;
  columnCategories = ['Tree','Fruit','Fern'];
  selectedZone = 'all';
  selectedClimate = 'all';
  searchQuery = '';
  selectedSun = 'all';
  selectedWater = 'all';
  filterInfographics = false;
  filterAvailable = false;
  filterNonInvasive = false;
  filterSepticSafe = false;
  selectedSubtypesByCategory = {};
  currentSortGroup = null;
  currentSortDirection = null;
  minHeightIdx = 0;
  maxHeightIdx = 9;
  minLifespanIdx = 0;
  maxLifespanIdx = 8;
  maxCostIdx = 8;

  const sInput = document.getElementById('search-input');
  if (sInput) sInput.value = '';
  const clearBtn = document.getElementById('clear-search-btn');
  if (clearBtn) clearBtn.classList.add('hidden');

  const minSlider = document.getElementById('height-min-slider');
  if (minSlider) minSlider.value = 0;
  const maxSlider = document.getElementById('height-max-slider');
  if (maxSlider) maxSlider.value = 9;

  const minLifeSlider = document.getElementById('lifespan-min-slider');
  if (minLifeSlider) minLifeSlider.value = 0;
  const maxLifeSlider = document.getElementById('lifespan-max-slider');
  if (maxLifeSlider) maxLifeSlider.value = 8;

  const costSlider = document.getElementById('cost-max-slider');
  if (costSlider) costSlider.value = 8;

  const infoTog = document.getElementById('toggle-infographics');
  if (infoTog) infoTog.checked = false;
  const availTog = document.getElementById('toggle-available');
  if (availTog) availTog.checked = false;
  const nonInvTog = document.getElementById('toggle-non-invasive');
  if (nonInvTog) nonInvTog.checked = false;
  const septicTog = document.getElementById('toggle-septic-safe');
  if (septicTog) septicTog.checked = false;

  updateHeightSliderUI();
  updateLifespanSliderUI();
  updateCostSliderUI();
  updateSortUI();
  clearButtonHoverOverlay();
  renderPlants();
}

// =========================================================================
// INFOGRAPHIC LIGHTBOX MODAL
// =========================================================================
function initLightboxInteractions() {
  const viewport = document.getElementById('lightbox-viewport');
  if (viewport) {
    viewport.addEventListener('wheel', function(e) {
      const modal = document.getElementById('infographic-modal');
      if (!modal || modal.classList.contains('hidden')) return;
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.15 : -0.15;
      setZoomLevel(currentZoom + delta);
    }, { passive: false });

    viewport.addEventListener('mousedown', function(e) {
      if (e.button !== 0) return;
      e.preventDefault();
      isPanning = true;
      panStartX = e.clientX - panX;
      panStartY = e.clientY - panY;
      updateLightboxTransform();
    });
  }

  window.addEventListener('mousemove', function(e) {
    if (!isPanning) return;
    panX = e.clientX - panStartX;
    panY = e.clientY - panStartY;
    updateLightboxTransform();
  });

  window.addEventListener('mouseup', function() {
    if (isPanning) {
      isPanning = false;
      updateLightboxTransform();
    }
  });

  window.addEventListener('keydown', function(e) {
    const modal = document.getElementById('infographic-modal');
    if (!modal || modal.classList.contains('hidden')) return;

    const activeTag = document.activeElement ? document.activeElement.tagName : '';
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(activeTag)) {
      if (e.key === 'Escape') {
        document.activeElement.blur();
      }
      return;
    }

    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      navigateModalPlant(-1);
    } else if (e.key === 'ArrowRight' || e.key === ' ') {
      e.preventDefault();
      navigateModalPlant(1);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      closeInfographicModal();
    }
  });

  document.addEventListener('fullscreenchange', function() {
    isLightboxFullscreen = !!document.fullscreenElement;
    applyLightboxFullscreenClasses();
  });
}

function toggleLightboxFullscreen() {
  const modal = document.getElementById('infographic-modal');
  if (!modal) return;

  if (!document.fullscreenElement && modal.requestFullscreen) {
    modal.requestFullscreen().then(() => {
      isLightboxFullscreen = true;
      applyLightboxFullscreenClasses();
    }).catch(() => {
      isLightboxFullscreen = !isLightboxFullscreen;
      applyLightboxFullscreenClasses();
    });
  } else if (document.fullscreenElement && document.exitFullscreen) {
    document.exitFullscreen().then(() => {
      isLightboxFullscreen = false;
      applyLightboxFullscreenClasses();
    }).catch(() => {
      isLightboxFullscreen = false;
      applyLightboxFullscreenClasses();
    });
  } else {
    isLightboxFullscreen = !isLightboxFullscreen;
    applyLightboxFullscreenClasses();
  }
}

function applyLightboxFullscreenClasses() {
  const modal = document.getElementById('infographic-modal');
  const card = document.getElementById('infographic-modal-card');
  const btn = document.getElementById('lightbox-fullscreen-btn');
  if (!modal || !card) return;

  if (isLightboxFullscreen) {
    modal.classList.remove('p-2', 'sm:p-5');
    card.classList.remove('max-w-6xl', 'max-h-[94vh]', 'rounded-3xl');
    card.classList.add('w-screen', 'h-screen', 'max-w-none', 'max-h-none', 'rounded-none');
    if (btn) btn.title = 'Exit Full Screen';
  } else {
    modal.classList.add('p-2', 'sm:p-5');
    card.classList.add('max-w-6xl', 'max-h-[94vh]', 'rounded-3xl');
    card.classList.remove('w-screen', 'h-screen', 'max-w-none', 'max-h-none', 'rounded-none');
    if (btn) btn.title = 'Toggle Full Screen';
  }
}

function navigateModalPlant(step) {
  if (!currentPlantInModal) return;
  const list = visiblePlantsOrder.length > 0 ? visiblePlantsOrder : plants;
  if (list.length === 0) return;

  const idx = list.findIndex(p => p.id === currentPlantInModal.id);
  let nextIdx = 0;
  if (idx !== -1) {
    nextIdx = (idx + step + list.length) % list.length;
  }
  openInfographicModal(list[nextIdx].id);
}

function refreshLightboxViewFields(plant) {
  const catDisplay = getDisplayCategory(plant.category, plant.name);
  document.getElementById('lightbox-TopTitle').textContent = plant.name;
  document.getElementById('lightbox-category').textContent = plant.subcategory
    ? `${catDisplay} • ${plant.subcategory}`
    : catDisplay;

  const editedBadge = document.getElementById('lightbox-edited-badge');
  if (editedBadge) {
    const hasEdits = !!userPlantEdits[plant.id] && Object.keys(userPlantEdits[plant.id]).length > 0;
    editedBadge.classList.toggle('hidden', !hasEdits);
  }

  document.getElementById('lightbox-name').textContent = plant.name;
  document.getElementById('lightbox-botanical').textContent = plant.botanical || '';

  const zoneTempRange = getPlantZoneRangeTempText(plant);
  document.getElementById('lightbox-zone-text').textContent = `Zones ${plant.zone} (${zoneTempRange})`;
  document.getElementById('lightbox-sun').textContent = plant.sun || '—';
  document.getElementById('lightbox-water').textContent = plant.water || '—';
  document.getElementById('lightbox-size').textContent = formatSizeDisplay(plant.size) || '—';

  const flowerEl = document.getElementById('lightbox-flower');
  if (flowerEl) {
    flowerEl.textContent = plant.flower ? formatSizeDisplay(plant.flower) : '—';
  }

  document.getElementById('lightbox-lifespan').textContent = plant.lifespan ? `${plant.lifespan} Years` : '—';

  const costEl = document.getElementById('lightbox-cost');
  if (costEl) costEl.textContent = plant.cost && plant.cost !== '$0' ? plant.cost : '—';

  const hasInv = hasPositiveInventory(plant);
  const invBox = document.getElementById('lightbox-inventory-box');
  const dateAcqBox = document.getElementById('lightbox-date-acquired-box');
  const locBox = document.getElementById('lightbox-location-box');

  if (invBox) invBox.classList.toggle('hidden', !hasInv);
  if (dateAcqBox) dateAcqBox.classList.toggle('hidden', !hasInv);
  if (locBox) locBox.classList.toggle('hidden', !hasInv);

  const invEl = document.getElementById('lightbox-inventory');
  if (invEl) invEl.textContent = plant.inventory || '0';

  const dateAcqEl = document.getElementById('lightbox-date-acquired');
  if (dateAcqEl) dateAcqEl.textContent = plant.dateAcquired || '—';

  const locEl = document.getElementById('lightbox-location');
  if (locEl) locEl.textContent = plant.location || '—';

  const originEl = document.getElementById('lightbox-origin');
  if (originEl) {
    originEl.textContent = plant.origin || '—';
  }

  document.getElementById('lightbox-propagation').textContent = plant.propagation || 'Propagation details: Can be grown via seed stratification or division in spring.';
  document.getElementById('lightbox-notes').textContent = plant.notes || 'No extra notes recorded.';

  const cContainer = document.getElementById('lightbox-climates');
  if (cContainer) {
    cContainer.innerHTML = (plant.climates || []).map(c => 
      `<span class="text-xs px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200 font-medium">${escapeXml(c)}</span>`
    ).join('');
  }

  const zBar = document.getElementById('lightbox-zone-bar');
  if (zBar) {
    let html = '';
    for (let z = 13; z >= 3; z--) {
      const inRange = (z >= plant.minZone && z <= plant.maxZone);
      const meta = ZONE_METADATA[z];
      const tip = `Zone ${z}: ${getZoneTempText(z)}`;
      if (inRange) {
        html += `<div title="${tip}" style="background-color: ${meta.color}; color: #fff;" class="py-0.5 rounded font-bold">${z}</div>`;
      } else {
        html += `<div title="${tip}" class="py-0.5 rounded bg-stone-200 text-stone-400 font-medium">${z}</div>`;
      }
    }
    zBar.innerHTML = html;
  }
}

function openInfographicModal(plantId) {
  clearButtonHoverOverlay();
  const plant = plants.find(p => p.id === plantId);
  if (!plant) return;
  currentPlantInModal = plant;

  refreshLightboxViewFields(plant);
  syncLightboxEditModeUI();

  const catKey = getCategoryFileKey(plant.category);
  const sampleImgPath = `sample/${catKey}/${plant.id}.webp`;
  const imgPath = getPlantInfographicPath(plant);

  const img = document.getElementById('lightbox-image');
  if (img) {
    img.style.width = '100%';
    img.style.maxWidth = '100%';
    img.style.height = 'auto';
    img.style.display = 'block';

    img.onerror = function() {
      if (img.src.includes(`sample/${catKey}/`)) {
        img.onerror = function() {
          img.onerror = null;
          img.src = generateSvgDataUrl(plant);
        };
        img.src = imgPath || generateSvgDataUrl(plant);
      } else {
        img.onerror = null;
        img.src = generateSvgDataUrl(plant);
      }
    };
    img.src = sampleImgPath;
  }

  resetZoom();
  document.getElementById('infographic-modal').classList.remove('hidden');
}

function closeInfographicModal() {
  if (document.fullscreenElement && document.exitFullscreen) {
    document.exitFullscreen().catch(() => {});
  }
  isLightboxFullscreen = false;
  applyLightboxFullscreenClasses();

  const modal = document.getElementById('infographic-modal');
  if (modal) modal.classList.add('hidden');
  isPanning = false;
}

function setZoomLevel(newZoom) {
  currentZoom = Math.max(1.0, Math.min(4.0, newZoom));
  if (currentZoom <= 1.0) {
    panX = 0;
    panY = 0;
  }
  updateLightboxTransform();
}

function setZoomFromSlider(sliderVal) {
  const z = parseFloat(sliderVal) / 100.0;
  setZoomLevel(z);
}

function adjustZoom(delta) {
  setZoomLevel(currentZoom + delta);
}

function resetZoom() {
  currentZoom = 1.0;
  panX = 0;
  panY = 0;
  isPanning = false;
  updateLightboxTransform();
}

function updateLightboxTransform() {
  const img = document.getElementById('lightbox-image');
  const label = document.getElementById('zoom-level-label');
  const slider = document.getElementById('zoom-slider');
  const viewport = document.getElementById('lightbox-viewport');

  const pct = Math.round(currentZoom * 100);
  if (img) {
    img.style.transition = isPanning ? 'none' : 'transform 100ms ease-out';
    img.style.transform = `translate(${panX}px, ${panY}px) scale(${currentZoom})`;
  }
  if (label) label.textContent = `${pct}%`;
  if (slider && Number(slider.value) !== pct) slider.value = pct;
  if (viewport) {
    viewport.style.cursor = isPanning ? 'grabbing' : 'grab';
  }
}

function showToast(msg) {
  const t = document.getElementById('toast-notification');
  const m = document.getElementById('toast-message');
  if (!t || !m) return;
  m.textContent = msg;
  t.classList.remove('hidden');
  setTimeout(() => { t.classList.add('hidden'); }, 3000);
}

function generateCategoryBannerSvg(catTitle) {
  const catKey = getCategoryFileKey(catTitle);
  const icon = getCategoryIcon(catTitle);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 340" width="100%" height="100%">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#14261b"/>
          <stop offset="100%" stop-color="#0b1a11"/>
        </linearGradient>
      </defs>
      <rect width="600" height="340" fill="url(#bg)"/>
      <circle cx="300" cy="140" r="60" fill="#1b3a28" stroke="#34d399" stroke-width="2"/>
      <text x="300" y="160" text-anchor="middle" font-size="50">${icon}</text>
      <text x="300" y="240" text-anchor="middle" fill="#5eead4" font-family="sans-serif" font-size="12" font-weight="bold" letter-spacing="3">CATEGORY INFOGRAPHIC</text>
      <text x="300" y="275" text-anchor="middle" fill="#ffffff" font-family="serif" font-size="28" font-weight="bold">${escapeXml(catTitle)}</text>
      <text x="300" y="305" text-anchor="middle" fill="#94a3b8" font-family="sans-serif" font-size="11">infographics/${escapeXml(catKey)}/${escapeXml(catKey)}.webp</text>
    </svg>
  `;
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg.trim());
}

function getCategoryIcon(cat) {
  const c = String(cat || '').toLowerCase();
  if (c.includes('annual')) return '🌻';
  if (c.includes('cactus')) return '🌵';
  if (c.includes('nut')) return '🌰';
  if (c.includes('fruit')) return '🍎';
  if (c.includes('tree')) return '🌳';
  if (c.includes('conifer')) return '🌲';
  if (c.includes('shrub')) return '🌺';
  if (c.includes('fern')) return '🌿';
  if (c.includes('moss')) return '🌱';
  if (c.includes('cvoer')) return '☘️';
  if (c.includes('perennial')) return '🌸';
  if (c.includes('herb')) return '🌿';
  if (c.includes('fungus') || c.includes('mushroom')) return '🍄';
  return '🪴';
}

function generateSvgDataUrl(plant) {
  const icon = getPlantEmoji(plant);
  const waterFormatted = plant.water === 'Bog' ? '🍄 Bog' : (plant.water === 'Low' ? '🌵 Low' : (plant.water === 'High' ? '💦 High' : '💧 Medium'));
  const flowerDisplay = plant.flower ? formatSizeDisplay(plant.flower) : (plant.lifespan ? `${plant.lifespan} Yrs` : 'Seasonal');

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000" width="100%" height="100%">
      <defs>
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#14261b"/>
          <stop offset="100%" stop-color="#09140d"/>
        </linearGradient>
        <linearGradient id="cardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#1e3a29"/>
          <stop offset="100%" stop-color="#13271b"/>
        </linearGradient>
      </defs>

      <rect width="800" height="1000" fill="url(#bgGrad)" />
      <rect x="25" y="25" width="750" height="950" rx="24" fill="none" stroke="#2d523a" stroke-width="2" />

      <text x="400" y="120" text-anchor="middle" fill="#ffffff" font-family="serif" font-size="34" font-weight="bold">${escapeXml(plant.name)}</text>
      <text x="400" y="160" text-anchor="middle" fill="#a7f3d0" font-family="sans-serif" font-size="18" font-style="italic">${escapeXml(plant.botanical || plant.category)}</text>

      <circle cx="400" cy="300" r="95" fill="#1e3a29" stroke="#34d399" stroke-width="3" />
      <text x="400" y="325" text-anchor="middle" font-size="80">${icon}</text>

      <rect x="60" y="430" width="680" height="90" rx="16" fill="url(#cardGrad)" stroke="#2d523a" />
      <text x="80" y="465" fill="#94a3b8" font-family="sans-serif" font-size="14" font-weight="bold">HARDINESS RANGE</text>
      <text x="80" y="500" fill="#facc15" font-family="sans-serif" font-size="28" font-weight="bold">USDA Zones ${escapeXml(String(plant.zone || ''))}</text>
      <text x="440" y="485" fill="#e2e8f0" font-family="sans-serif" font-size="14">${escapeXml(getPlantZoneRangeTempText(plant))}</text>

      <g transform="translate(60, 545)">
        <rect width="325" height="100" rx="16" fill="url(#cardGrad)" stroke="#2d523a"/>
        <text x="25" y="40" fill="#94a3b8" font-family="sans-serif" font-size="13">☀️ SUNLIGHT</text>
        <text x="25" y="75" fill="#ffffff" font-family="sans-serif" font-size="20" font-weight="bold">${escapeXml(plant.sun || 'Full / Part')}</text>

        <rect x="355" width="325" height="100" rx="16" fill="url(#cardGrad)" stroke="#2d523a"/>
        <text x="380" y="40" fill="#94a3b8" font-family="sans-serif" font-size="13">💧 WATER &amp; MOISTURE</text>
        <text x="380" y="75" fill="#ffffff" font-family="sans-serif" font-size="20" font-weight="bold">${escapeXml(waterFormatted)}</text>

        <rect y="120" width="325" height="100" rx="16" fill="url(#cardGrad)" stroke="#2d523a"/>
        <text x="25" y="160" fill="#94a3b8" font-family="sans-serif" font-size="13">↕️ MATURE SIZE</text>
        <text x="25" y="195" fill="#ffffff" font-family="sans-serif" font-size="20" font-weight="bold">${escapeXml(formatSizeDisplay(plant.size) || 'Standard')}</text>

        <rect x="355" y="120" width="325" height="100" rx="16" fill="url(#cardGrad)" stroke="#2d523a"/>
        <text x="380" y="160" fill="#94a3b8" font-family="sans-serif" font-size="13">🌸 FLOWER</text>
        <text x="380" y="195" fill="#ffffff" font-family="sans-serif" font-size="20" font-weight="bold">${escapeXml(flowerDisplay)}</text>
      </g>

      <rect x="60" y="795" width="680" height="140" rx="16" fill="url(#cardGrad)" stroke="#2d523a" />
      <text x="80" y="825" fill="#5eead4" font-family="sans-serif" font-size="12" font-weight="bold" letter-spacing="1">GROWING &amp; LANDSCAPE NOTES</text>
      <foreignObject x="80" y="835" width="640" height="90">
        <p xmlns="http://www.w3.org/1999/xhtml" style="color: #cbd5e1; font-family: sans-serif; font-size: 14px; line-height: 1.5; margin: 0;">
          ${escapeXml(plant.notes || 'Thrives when provided appropriate moisture, soil, and sunlight for its hardiness range.')}
        </p>
      </foreignObject>
    </svg>
  `;
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg.trim());
}

function escapeXml(unsafe) {
  if (!unsafe) return '';
  return String(unsafe).replace(/[<>&'"]/g, function (c) {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initExplorer);
} else {
  initExplorer();
}
