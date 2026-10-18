// ---------------- Master Group Creator ---------------- //
function createLandmarksGroup(globeRadius = 5.0) {
  const landmarksGroup = new THREE.Group();
  const surfaceRadius = globeRadius * 1.002;

  // 1. 3D Architectural Landmarks
  const ringMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24, side: THREE.DoubleSide });
  const ringGeom = new THREE.RingGeometry(0.035, 0.06, 16);

  LANDMARK_DATA.forEach(item => {
    const model = item.build();

    const phi = (90 - item.lat) * (Math.PI / 180);
    const theta = (item.lon + 180) * (Math.PI / 180);

    const x = -(surfaceRadius * Math.sin(phi) * Math.cos(theta));
    const z = surfaceRadius * Math.sin(phi) * Math.sin(theta);
    const y = surfaceRadius * Math.cos(phi);

    const container = new THREE.Group();
    container.position.set(x, y, z);

    const normal = new THREE.Vector3(x, y, z).normalize();
    container.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);

    const ringMesh = new THREE.Mesh(ringGeom, ringMat);
    ringMesh.rotation.x = Math.PI / 2;
    container.add(ringMesh);

    container.userData = {
      category: 'Landmark',
      icon: '🏛️',
      name: item.name,
      country: item.country,
      details: item.details,
      lat: item.lat,
      lon: item.lon
    };

    container.add(model);
    landmarksGroup.add(container);
  });

  // Helper for 2D Sprites
  function addBillboardSprites(dataList, texture, categoryName, defaultIcon) {
    const mat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false });
    const spriteRadius = globeRadius * 1.018;

    dataList.forEach(item => {
      const phi = (90 - item.lat) * (Math.PI / 180);
      const theta = (item.lon + 180) * (Math.PI / 180);

      const x = -(spriteRadius * Math.sin(phi) * Math.cos(theta));
      const z = spriteRadius * Math.sin(phi) * Math.sin(theta);
      const y = surfaceRadius * Math.cos(phi);

      const sprite = new THREE.Sprite(mat);
      sprite.position.set(x, y, z);
      sprite.scale.set(0.24, 0.24, 1.0);

      sprite.userData = {
        category: categoryName,
        icon: item.icon || defaultIcon,
        name: item.name,
        country: item.country,
        details: item.details,
        lat: item.lat,
        lon: item.lon
      };

      landmarksGroup.add(sprite);
    });
  }

  // 2. Mountains (2D)
  addBillboardSprites(MOUNTAIN_DATA, getMountainIconTexture(), 'Mountain', '🏔️');

  // 3. Bridges (2D)
  addBillboardSprites(BRIDGE_DATA, getBridgeIconTexture(), 'Bridge', '🌉');

  // 4. Waterfalls (2D)
  addBillboardSprites(WATERFALL_DATA, getWaterfallIconTexture(), 'Waterfall', '🌊');

  // 5. Radioactive Sites (2D)
  addBillboardSprites(RADIOACTIVE_DATA, getRadioactiveIconTexture(), 'Hazard', '☢️');

  // 6. Chemical / Toxic Waste Sites (2D)
  addBillboardSprites(TOXIC_WASTE_DATA, getToxicIconTexture(), 'Hazard', '☠️');

  // 7. Major Dams (2D)
  addBillboardSprites(DAM_DATA, getDamIconTexture(), 'Dam', '🧱');

  return landmarksGroup;
}

// ---------------- Proximity Search Utility for Hover ---------------- //
function findNearbyLandmarkOrMountain(lat, lon, thresholdDeg = 2.8) {
  const rad = Math.PI / 180;
  let closestItem = null;
  let minDistance = Infinity;

  const allItems = [
    ...LANDMARK_DATA.map(d => ({ ...d, category: 'Landmark', icon: '🏛️' })),
    ...MOUNTAIN_DATA.map(d => ({ ...d, category: 'Mountain', icon: '🏔️' })),
    ...BRIDGE_DATA.map(d => ({ ...d, category: 'Bridge', icon: '🌉' })),
    ...WATERFALL_DATA.map(d => ({ ...d, category: 'Waterfall', icon: '🌊' })),
    ...RADIOACTIVE_DATA.map(d => ({ ...d, category: 'Hazard', icon: d.icon || '☢️' })),
    ...TOXIC_WASTE_DATA.map(d => ({ ...d, category: 'Hazard', icon: d.icon || '☠️' })),
    ...DAM_DATA.map(d => ({ ...d, category: 'Dam', icon: '🧱' }))
  ];

  allItems.forEach(item => {
    const dLat = (item.lat - lat) * rad;
    let dLon = Math.abs(item.lon - lon);
    if (dLon > 180) dLon = 360 - dLon;
    dLon *= rad;

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat * rad) * Math.cos(item.lat * rad) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const distDeg = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * (180 / Math.PI);

    if (distDeg <= thresholdDeg && distDeg < minDistance) {
      minDistance = distDeg;
      closestItem = item;
    }
  });

  return closestItem;
}


/**
 * landmarks.js
 * 3D Architectural Landmarks, 2D Mountains, 2D Bridges, 2D Waterfalls, 2D Hazards & 2D Major Dams for Terra3D Globe
 */

// ---------------- 2D Mountain Symbol Texture Generator ---------------- //
let cachedMountainTexture = null;

function getMountainIconTexture() {
  if (cachedMountainTexture) return cachedMountainTexture;

  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  ctx.beginPath();
  ctx.arc(64, 64, 54, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#38bdf8';
  ctx.stroke();

  // Secondary Peak
  ctx.beginPath();
  ctx.moveTo(86, 52);
  ctx.lineTo(108, 92);
  ctx.lineTo(64, 92);
  ctx.closePath();
  ctx.fillStyle = '#64748b';
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(86, 52);
  ctx.lineTo(95, 68);
  ctx.lineTo(88, 65);
  ctx.lineTo(77, 68);
  ctx.closePath();
  ctx.fillStyle = '#f8fafc';
  ctx.fill();

  // Main Peak
  ctx.beginPath();
  ctx.moveTo(56, 32);
  ctx.lineTo(92, 92);
  ctx.lineTo(20, 92);
  ctx.closePath();
  ctx.fillStyle = '#334155';
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(56, 32);
  ctx.lineTo(70, 56);
  ctx.lineTo(62, 52);
  ctx.lineTo(55, 57);
  ctx.lineTo(48, 52);
  ctx.lineTo(42, 56);
  ctx.closePath();
  ctx.fillStyle = '#ffffff';
  ctx.fill();

  cachedMountainTexture = new THREE.CanvasTexture(canvas);
  return cachedMountainTexture;
}

// ---------------- 2D Bridge Symbol Texture Generator ---------------- //
let cachedBridgeTexture = null;

function getBridgeIconTexture() {
  if (cachedBridgeTexture) return cachedBridgeTexture;

  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  ctx.beginPath();
  ctx.arc(64, 64, 54, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#f59e0b';
  ctx.stroke();

  ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
  ctx.fillRect(22, 88, 84, 6);

  ctx.fillStyle = '#e2e8f0';
  ctx.fillRect(44, 38, 7, 50);
  ctx.fillRect(77, 38, 7, 50);

  ctx.fillStyle = '#94a3b8';
  ctx.fillRect(22, 74, 84, 5);

  ctx.lineWidth = 2.5;
  ctx.strokeStyle = '#f59e0b';

  ctx.beginPath();
  ctx.moveTo(47.5, 38);
  ctx.quadraticCurveTo(64, 74, 80.5, 38);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(47.5, 38);
  ctx.lineTo(24, 74);
  ctx.moveTo(80.5, 38);
  ctx.lineTo(104, 74);
  ctx.stroke();

  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(245, 158, 11, 0.7)';
  [53, 59, 64, 69, 75].forEach(x => {
    ctx.beginPath();
    ctx.moveTo(x, 62);
    ctx.lineTo(x, 74);
    ctx.stroke();
  });

  cachedBridgeTexture = new THREE.CanvasTexture(canvas);
  return cachedBridgeTexture;
}

// ---------------- 2D Waterfall Symbol Texture Generator ---------------- //
let cachedWaterfallTexture = null;

function getWaterfallIconTexture() {
  if (cachedWaterfallTexture) return cachedWaterfallTexture;

  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  ctx.beginPath();
  ctx.arc(64, 64, 54, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#06b6d4';
  ctx.stroke();

  ctx.fillStyle = '#334155';
  ctx.beginPath();
  ctx.moveTo(20, 44);
  ctx.lineTo(46, 44);
  ctx.lineTo(46, 88);
  ctx.lineTo(20, 88);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(82, 44);
  ctx.lineTo(108, 44);
  ctx.lineTo(108, 88);
  ctx.lineTo(82, 88);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#475569';
  ctx.fillRect(20, 40, 88, 6);

  ctx.fillStyle = '#38bdf8';
  ctx.fillRect(46, 36, 36, 8);

  const grad = ctx.createLinearGradient(64, 44, 64, 86);
  grad.addColorStop(0, '#38bdf8');
  grad.addColorStop(0.5, '#bae6fd');
  grad.addColorStop(1, '#ffffff');

  ctx.fillStyle = grad;
  ctx.fillRect(46, 44, 36, 42);

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  [52, 58, 64, 70, 76].forEach(x => {
    ctx.beginPath();
    ctx.moveTo(x, 46);
    ctx.lineTo(x, 84);
    ctx.stroke();
  });

  ctx.fillStyle = 'rgba(6, 182, 212, 0.45)';
  ctx.beginPath();
  ctx.ellipse(64, 88, 36, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(52, 86, 7, 0, Math.PI * 2);
  ctx.arc(64, 85, 9, 0, Math.PI * 2);
  ctx.arc(76, 86, 7, 0, Math.PI * 2);
  ctx.fill();

  cachedWaterfallTexture = new THREE.CanvasTexture(canvas);
  return cachedWaterfallTexture;
}

// ---------------- 2D Nuclear Radioactive Symbol Texture Generator ---------------- //
let cachedRadioactiveTexture = null;

function getRadioactiveIconTexture() {
  if (cachedRadioactiveTexture) return cachedRadioactiveTexture;

  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  ctx.beginPath();
  ctx.arc(64, 64, 54, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#facc15';
  ctx.stroke();

  const cx = 64, cy = 64;
  const innerR = 14;
  const outerR = 42;
  const blades = [
    { start: Math.PI / 3, end: (2 * Math.PI) / 3 },
    { start: Math.PI, end: (4 * Math.PI) / 3 },
    { start: (5 * Math.PI) / 3, end: 2 * Math.PI }
  ];

  ctx.fillStyle = '#facc15';

  blades.forEach(b => {
    ctx.beginPath();
    ctx.arc(cx, cy, outerR, b.start, b.end, false);
    ctx.arc(cx, cy, innerR, b.end, b.start, true);
    ctx.closePath();
    ctx.fill();
  });

  ctx.beginPath();
  ctx.arc(cx, cy, 9, 0, Math.PI * 2);
  ctx.fillStyle = '#facc15';
  ctx.fill();

  cachedRadioactiveTexture = new THREE.CanvasTexture(canvas);
  return cachedRadioactiveTexture;
}

// ---------------- 2D Chemical / Toxic Waste Hazard Symbol Texture Generator ---------------- //
let cachedToxicTexture = null;

function getToxicIconTexture() {
  if (cachedToxicTexture) return cachedToxicTexture;

  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  ctx.beginPath();
  ctx.arc(64, 64, 54, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#a3e635';
  ctx.stroke();

  ctx.strokeStyle = '#a3e635';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';

  ctx.beginPath();
  ctx.moveTo(34, 34);
  ctx.lineTo(94, 94);
  ctx.moveTo(94, 34);
  ctx.lineTo(34, 94);
  ctx.stroke();

  ctx.fillStyle = '#ecfccb';
  ctx.beginPath();
  ctx.arc(64, 56, 21, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.roundRect ? ctx.roundRect(54, 70, 20, 14, 4) : ctx.rect(54, 70, 20, 14);
  ctx.fill();

  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(57, 57, 5, 0, Math.PI * 2);
  ctx.arc(71, 57, 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(64, 65);
  ctx.lineTo(61, 70);
  ctx.lineTo(67, 70);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(60, 74); ctx.lineTo(60, 82);
  ctx.moveTo(64, 74); ctx.lineTo(64, 82);
  ctx.moveTo(68, 74); ctx.lineTo(68, 82);
  ctx.stroke();

  cachedToxicTexture = new THREE.CanvasTexture(canvas);
  return cachedToxicTexture;
}

// ---------------- 2D Dam Symbol Texture Generator ---------------- //
let cachedDamTexture = null;

function getDamIconTexture() {
  if (cachedDamTexture) return cachedDamTexture;

  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  ctx.beginPath();
  ctx.arc(64, 64, 54, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#10b981';
  ctx.stroke();

  ctx.fillStyle = '#0284c7';
  ctx.beginPath();
  ctx.arc(64, 64, 48, Math.PI * 1.15, Math.PI * 1.85, false);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#94a3b8';
  ctx.beginPath();
  ctx.moveTo(24, 54);
  ctx.quadraticCurveTo(64, 66, 104, 54);
  ctx.lineTo(96, 78);
  ctx.quadraticCurveTo(64, 88, 32, 78);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(24, 54);
  ctx.quadraticCurveTo(64, 66, 104, 54);
  ctx.stroke();

  ctx.fillStyle = '#38bdf8';
  ctx.beginPath();
  ctx.moveTo(52, 63);
  ctx.lineTo(76, 63);
  ctx.lineTo(82, 86);
  ctx.lineTo(46, 86);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.8;
  [53, 59, 64, 69, 75].forEach(x => {
    ctx.beginPath();
    ctx.moveTo(x, 65);
    ctx.lineTo(x + (x - 64) * 0.25, 88);
    ctx.stroke();
  });

  ctx.fillStyle = 'rgba(56, 189, 248, 0.7)';
  ctx.fillRect(44, 88, 40, 8);

  cachedDamTexture = new THREE.CanvasTexture(canvas);
  return cachedDamTexture;
}

// ---------------- FAMOUS WORLD MOUNTAINS & VOLCANOES ---------------- //
const MOUNTAIN_DATA = [
  { name: "Mount Everest", country: "Nepal / China", lat: 27.9881, lon: 86.9250, details: "Elevation: 8,849 m • Highest peak on Earth" },
  { name: "K2", country: "Pakistan / China", lat: 35.8808, lon: 76.5133, details: "Elevation: 8,611 m • Karakoram Range" },
  { name: "Mount Kilimanjaro", country: "Tanzania", lat: -3.0674, lon: 37.3556, details: "Elevation: 5,895 m • Dormant stratovolcano" },
  { name: "Matterhorn", country: "Switzerland / Italy", lat: 45.9765, lon: 7.6585, details: "Elevation: 4,478 m • Pennine Alps" },
  { name: "Mount Fuji", country: "Japan", lat: 35.3606, lon: 138.7274, details: "Elevation: 3,776 m • Active stratovolcano" },
  { name: "Denali (Mt. McKinley)", country: "United States", lat: 63.0692, lon: -151.0070, details: "Elevation: 6,190 m • Alaska Range" },
  { name: "Aconcagua", country: "Argentina", lat: -32.6532, lon: -70.0109, details: "Elevation: 6,961 m • Andes Mountain Range" },
  { name: "Mount Elbrus", country: "Russia", lat: 43.3499, lon: 42.4453, details: "Elevation: 5,642 m • Caucasus Mountains" },
  { name: "Table Mountain", country: "South Africa", lat: -33.9628, lon: 18.4098, details: "Elevation: 1,085 m • Sandstone plateau" },
  { name: "Aoraki / Mount Cook", country: "New Zealand", lat: -43.5950, lon: 170.1418, details: "Elevation: 3,724 m • Southern Alps" },
  { name: "Mount St. Helens", country: "United States", lat: 46.1914, lon: -122.1956, details: "Elevation: 2,549 m • 1980 eruption horseshoe caldera" },
  { name: "Mount Vesuvius", country: "Italy", lat: 40.8214, lon: 14.4260, details: "Elevation: 1,281 m • Campanian volcanic arc" },
  { name: "Half Dome", country: "United States", lat: 37.7460, lon: -119.5332, details: "Elevation: 2,694 m • 1,444 m cliff face above Yosemite" },
  { name: "Krakatoa", country: "Indonesia", lat: -6.1021, lon: 105.4230, details: "Elevation: 155 m • Sunda Strait caldera island" },
  { name: "Kīlauea", country: "United States (Hawaii)", lat: 19.4069, lon: -155.2834, details: "Elevation: 1,247 m • Active shield caldera" },
  { name: "Popocatépetl", country: "Mexico", lat: 19.0228, lon: -98.6278, details: "Elevation: 5,426 m • Active glacier-capped stratovolcano" },
  { name: "Mount Tambora", country: "Indonesia", lat: -8.2479, lon: 117.9911, details: "Elevation: 2,850 m • 6 km wide caldera (1815 eruption)" },
  { name: "Grand Teton", country: "United States", lat: 43.7410, lon: -110.8024, details: "Elevation: 4,199 m • Fault-block Teton Range" },
  { name: "Monte Roraima", country: "Venezuela / Brazil / Guyana", lat: 5.1433, lon: -60.7625, details: "Elevation: 2,810 m • 31 km² flat tabletop tepui" }
];

// ---------------- FAMOUS WORLD BRIDGES ---------------- //
const BRIDGE_DATA = [
  { name: "Golden Gate Bridge", country: "United States", lat: 37.8199, lon: -122.4783, details: "Built: 1937 • Length: 2,737 m • Main Span: 1,280 m • Suspension" },
  { name: "Bridge of the Americas", country: "Panama", lat: 8.9431, lon: -79.5706, details: "Built: 1962 • Length: 1,654 m • Main Span: 344 m • Panama Canal Tied-Arch" },
  { name: "Millau Viaduct", country: "France", lat: 44.0778, lon: 3.0219, details: "Built: 2004 • Length: 2,460 m • Structural Height: 336 m • Cable-Stayed" },
  { name: "Charles Bridge", country: "Czech Republic", lat: 50.0865, lon: 14.4114, details: "Built: 1402 • Length: 516 m • 16 Stone Arches • Vltava River" },
  { name: "Akashi Kaikyō Bridge", country: "Japan", lat: 34.6167, lon: 135.0214, details: "Built: 1998 • Length: 3,911 m • Main Span: 1,991 m • Suspension" }
];

// ---------------- FAMOUS WORLD WATERFALLS ---------------- //
const WATERFALL_DATA = [
  { name: "Angel Falls", country: "Venezuela", lat: 5.9675, lon: -62.5356, details: "Height: 979 m • Max Volume: ~150 m³/s (Wet season)" },
  { name: "Victoria Falls", country: "Zambia / Zimbabwe", lat: -17.9243, lon: 25.8572, details: "Height: 108 m • Max Volume: ~12,800 m³/s (Record flood)" },
  { name: "Iguazu Falls", country: "Argentina / Brazil", lat: -25.6953, lon: -54.4367, details: "Height: 82 m • Max Volume: ~45,000 m³/s (Record flood)" },
  { name: "Niagara Falls", country: "United States / Canada", lat: 43.0800, lon: -79.0710, details: "Height: 51 m • Max Volume: ~6,400 m³/s (Historical peak)" },
  { name: "Shoshone Falls", country: "United States", lat: 42.5947, lon: -114.4022, details: "Height: 65 m • Max Volume: ~900 m³/s (Spring runoff)" },
  { name: "Gullfoss", country: "Iceland", lat: 64.3271, lon: -20.1199, details: "Height: 32 m • Max Volume: ~2,000 m³/s (Glacial flood)" },
  { name: "Tugela Falls", country: "South Africa", lat: -28.7525, lon: 28.8961, details: "Height: 983 m • Max Volume: ~50 m³/s (Flash flood)" },
  { name: "Plitvice Waterfalls", country: "Croatia", lat: 44.8654, lon: 15.6040, details: "Height: 78 m • Max Volume: ~30 m³/s (16 Terraced Lakes)" },
  { name: "Jog Falls", country: "India", lat: 14.2289, lon: 74.8122, details: "Height: 253 m • Max Volume: ~3,400 m³/s (Monsoon peak)" },
  { name: "Ban Gioc–Detian Falls", country: "Vietnam / China", lat: 22.8540, lon: 106.7230, details: "Height: 30 m • Max Volume: ~1,000 m³/s (Summer flood)" }
];

// ---------------- DANGEROUS RADIOACTIVE SITES ---------------- //
const RADIOACTIVE_DATA = [
  { name: "Chernobyl Exclusion Zone", country: "Ukraine", lat: 51.3890, lon: 30.0998, icon: "☢️", details: "30 km exclusion zone • Reactor 4 meltdown (1986)" },
  { name: "Fukushima Daiichi", country: "Japan", lat: 37.4211, lon: 141.0328, icon: "☢️", details: "Triple meltdown (2011) • Active cleanup zone" },
  { name: "Mayak & Lake Karachay", country: "Russia", lat: 55.6986, lon: 60.7986, icon: "☢️", details: "Mayak plutonium plant • Lake Karachay subsurface waste" },
  { name: "Mailuu-Suu", country: "Kyrgyzstan", lat: 41.2942, lon: 72.4497, icon: "☢️", details: "36 unstable uranium tailings • ~3 million m³ radioactive waste" },
  { name: "Hanford Site", country: "United States", lat: 46.5505, lon: -119.4882, icon: "☢️", details: "~210,000 m³ high-level waste in 177 underground tanks" },
  { name: "The Polygon (Semipalatinsk)", country: "Kazakhstan", lat: 50.0000, lon: 78.4333, icon: "☢️", details: "456 nuclear detonations across 18,500 km²" },
  { name: "Sellafield", country: "United Kingdom", lat: 54.4206, lon: -3.4975, icon: "☢️", details: "Europe's largest waste inventory (~140 t plutonium)" }
];

// ---------------- NON-NUCLEAR CHEMICAL & TOXIC WASTE HAZARD SITES ---------------- //
const TOXIC_WASTE_DATA = [
  { name: "Dzerzhinsk Chemical Zone", country: "Russia", lat: 56.2389, lon: 43.4631, icon: "☠️", details: "Cold War chemical arms manufacturing • ~300,000 t arsenic & lead" },
  { name: "Kabwe Lead Smelter Zone", country: "Zambia", lat: -14.4469, lon: 28.4464, icon: "☠️", details: "Century of lead smelting • Extreme soil contamination" },
  { name: "Agbogbloshie E-Waste Dump", country: "Ghana", lat: 5.5492, lon: -0.2248, icon: "☠️", details: "Global e-waste burn yard • ~250,000 t scrap/year" }
];

// ---------------- MAJOR DAMS OF THE WORLD ---------------- //
const DAM_DATA = [
  { name: "Three Gorges Dam", country: "China", lat: 30.8267, lon: 111.0078, details: "Built: 2012 • Height: 181 m • Capacity: 22,500 MW • Yangtze River" },
  { name: "Belo Monte Dam", country: "Brazil", lat: -3.1256, lon: -51.7744, details: "Built: 2019 • Height: 90 m • Capacity: 11,233 MW • Xingu River" },
  { name: "Guri Dam", country: "Venezuela", lat: 7.7667, lon: -62.9989, details: "Built: 1986 • Height: 162 m • Capacity: 10,235 MW • Caroní River" },
  { name: "Hoover Dam", country: "United States", lat: 36.0156, lon: -114.7378, details: "Built: 1936 • Height: 221 m • Lake Mead • Arch-Gravity" },
  { name: "Tucuruí Dam", country: "Brazil", lat: -3.8328, lon: -49.6469, details: "Built: 1984 • Height: 78 m • Capacity: 8,370 MW" },
  { name: "Aswan High Dam", country: "Egypt", lat: 23.9700, lon: 32.8800, details: "Built: 1970 • Height: 111 m • Lake Nasser • Embankment" },
  { name: "Grand Ethiopian Renaissance Dam (GERD)", country: "Ethiopia", lat: 11.2158, lon: 35.0931, details: "Built: 2023 • Height: 145 m • Capacity: 5,150 MW" },
  { name: "Gordon Dam", country: "Australia", lat: -42.7303, lon: 145.9758, details: "Built: 1974 • Height: 140 m • Double-Curvature Arch" },
  { name: "Daniel-Johnson Dam (Manic-5)", country: "Canada", lat: 50.6406, lon: -68.7231, details: "Built: 1968 • Height: 214 m • Multi-Arch Buttress" },
  { name: "Sayano-Shushenskaya Dam", country: "Russia", lat: 52.8317, lon: 91.3692, details: "Built: 1978 • Height: 242 m • Capacity: 6,400 MW" },
  { name: "Tarbela Dam", country: "Pakistan", lat: 34.0886, lon: 72.6983, details: "Built: 1976 • Height: 143 m • Earth and Rock-Fill" }
];

// ---------------- 3D ARCHITECTURAL LANDMARKS ---------------- //
const LANDMARK_DATA = [
  {
    name: "One World Trade Center (Freedom Tower)",
    country: "United States",
    lat: 40.7127,
    lon: -74.0134,
    details: "Built: 2014 • Height: 541 m • 94 Floors",
    build: () => {
      const g = new THREE.Group();
      const glassMat = new THREE.MeshStandardMaterial({ color: 0x93c5fd, metalness: 0.85, roughness: 0.15 });
      const steelMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.7 });

      const base = new THREE.BoxGeometry(0.045, 0.03, 0.045);
      base.translate(0, 0.015, 0);
      g.add(new THREE.Mesh(base, steelMat));

      const tower = new THREE.CylinderGeometry(0.024, 0.044, 0.20, 8);
      tower.translate(0, 0.13, 0);
      tower.rotateY(Math.PI / 8);
      g.add(new THREE.Mesh(tower, glassMat));

      const ring = new THREE.CylinderGeometry(0.016, 0.016, 0.01, 16);
      ring.translate(0, 0.235, 0);
      g.add(new THREE.Mesh(ring, steelMat));

      const spire = new THREE.CylinderGeometry(0.002, 0.005, 0.08, 6);
      spire.translate(0, 0.28, 0);
      g.add(new THREE.Mesh(spire, steelMat));
      return g;
    }
  },
  {
    name: "Willis Tower",
    country: "United States",
    lat: 41.8789,
    lon: -87.6359,
    details: "Built: 1974 • Height: 442 m (527 m with antennas) • Bundled Tube",
    build: () => {
      const g = new THREE.Group();
      const darkMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.6, roughness: 0.4 });
      const antMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc });

      const t1 = new THREE.BoxGeometry(0.05, 0.12, 0.05);
      t1.translate(0, 0.06, 0);
      g.add(new THREE.Mesh(t1, darkMat));

      const t2 = new THREE.BoxGeometry(0.035, 0.06, 0.035);
      t2.translate(-0.005, 0.15, -0.005);
      g.add(new THREE.Mesh(t2, darkMat));

      const t3 = new THREE.BoxGeometry(0.02, 0.05, 0.02);
      t3.translate(-0.01, 0.205, -0.01);
      g.add(new THREE.Mesh(t3, darkMat));

      [-0.005, 0.005].forEach(x => {
        const ant = new THREE.CylinderGeometry(0.0015, 0.002, 0.06, 4);
        ant.translate(x, 0.26, 0);
        g.add(new THREE.Mesh(ant, antMat));
      });
      return g;
    }
  },
  {
    name: "U.S. Capitol",
    country: "United States",
    lat: 38.8899,
    lon: -77.0091,
    details: "Built: 1800 • Height: 88 m • Neoclassical Rotunda",
    build: () => {
      const g = new THREE.Group();
      const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 });

      const wings = new THREE.BoxGeometry(0.12, 0.03, 0.04);
      wings.translate(0, 0.015, 0);
      g.add(new THREE.Mesh(wings, whiteMat));

      const rotunda = new THREE.CylinderGeometry(0.025, 0.025, 0.03, 16);
      rotunda.translate(0, 0.045, 0);
      g.add(new THREE.Mesh(rotunda, whiteMat));

      const dome = new THREE.SphereGeometry(0.025, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
      dome.translate(0, 0.06, 0);
      g.add(new THREE.Mesh(dome, whiteMat));

      const cupola = new THREE.CylinderGeometry(0.004, 0.004, 0.02, 8);
      cupola.translate(0, 0.09, 0);
      g.add(new THREE.Mesh(cupola, whiteMat));
      return g;
    }
  },
  {
    name: "CN Tower",
    country: "Canada",
    lat: 43.6426,
    lon: -79.3871,
    details: "Built: 1976 • Height: 553 m • Concrete Observation Tower",
    build: () => {
      const g = new THREE.Group();
      const towerMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.4 });
      const podMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.6 });

      const core = new THREE.CylinderGeometry(0.008, 0.022, 0.18, 6);
      core.translate(0, 0.09, 0);
      g.add(new THREE.Mesh(core, towerMat));

      const pod = new THREE.CylinderGeometry(0.032, 0.025, 0.02, 16);
      pod.translate(0, 0.16, 0);
      g.add(new THREE.Mesh(pod, podMat));

      const upperPod = new THREE.CylinderGeometry(0.012, 0.012, 0.01, 12);
      upperPod.translate(0, 0.19, 0);
      g.add(new THREE.Mesh(upperPod, podMat));

      const needle = new THREE.CylinderGeometry(0.002, 0.004, 0.07, 4);
      needle.translate(0, 0.23, 0);
      g.add(new THREE.Mesh(needle, towerMat));
      return g;
    }
  },
  {
    name: "Space Needle",
    country: "United States",
    lat: 47.6205,
    lon: -122.3493,
    details: "Built: 1962 • Height: 184 m • Seattle Observation Tower",
    build: () => {
      const g = new THREE.Group();
      const steelMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.5 });

      const core = new THREE.CylinderGeometry(0.008, 0.02, 0.16, 6);
      core.translate(0, 0.08, 0);
      g.add(new THREE.Mesh(core, steelMat));

      const saucer = new THREE.CylinderGeometry(0.05, 0.05, 0.012, 16);
      saucer.translate(0, 0.16, 0);
      g.add(new THREE.Mesh(saucer, steelMat));

      const spire = new THREE.CylinderGeometry(0.002, 0.005, 0.05, 4);
      spire.translate(0, 0.19, 0);
      g.add(new THREE.Mesh(spire, steelMat));
      return g;
    }
  },
  {
    name: "Gateway Arch",
    country: "United States",
    lat: 38.6247,
    lon: -90.1848,
    details: "Built: 1965 • Height: 192 m • Stainless Steel Catenary Arch",
    build: () => {
      const g = new THREE.Group();
      const steelMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, metalness: 0.9, roughness: 0.1 });
      const archGeom = new THREE.TorusGeometry(0.07, 0.01, 8, 24, Math.PI);
      archGeom.translate(0, 0.01, 0);
      g.add(new THREE.Mesh(archGeom, steelMat));
      return g;
    }
  },
  {
    name: "Chichen Itza (El Castillo)",
    country: "Mexico",
    lat: 20.6843,
    lon: -88.5678,
    details: "Built: c. 800–900 CE • Height: 30 m • Mesoamerican Step Pyramid",
    build: () => {
      const g = new THREE.Group();
      const stoneMat = new THREE.MeshStandardMaterial({ color: 0xcdb49b, roughness: 0.8 });

      const t1 = new THREE.BoxGeometry(0.12, 0.03, 0.12);
      t1.translate(0, 0.015, 0);
      g.add(new THREE.Mesh(t1, stoneMat));

      const t2 = new THREE.BoxGeometry(0.08, 0.03, 0.08);
      t2.translate(0, 0.045, 0);
      g.add(new THREE.Mesh(t2, stoneMat));

      const temple = new THREE.BoxGeometry(0.04, 0.025, 0.04);
      temple.translate(0, 0.0725, 0);
      g.add(new THREE.Mesh(temple, stoneMat));
      return g;
    }
  },
  {
    name: "Christ the Redeemer",
    country: "Brazil",
    lat: -22.9519,
    lon: -43.2105,
    details: "Built: 1931 • Height: 38 m • Corcovado Mountain Peak",
    build: () => {
      const g = new THREE.Group();
      const mat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.6 });

      const base = new THREE.BoxGeometry(0.04, 0.04, 0.04);
      base.translate(0, 0.02, 0);
      g.add(new THREE.Mesh(base, mat));

      const body = new THREE.CylinderGeometry(0.015, 0.02, 0.11, 8);
      body.translate(0, 0.095, 0);
      g.add(new THREE.Mesh(body, mat));

      const arms = new THREE.BoxGeometry(0.12, 0.015, 0.015);
      arms.translate(0, 0.13, 0);
      g.add(new THREE.Mesh(arms, mat));

      const head = new THREE.SphereGeometry(0.014, 8, 8);
      head.translate(0, 0.16, 0);
      g.add(new THREE.Mesh(head, mat));
      return g;
    }
  },
  {
    name: "Machu Picchu Citadel",
    country: "Peru",
    lat: -13.1631,
    lon: -72.5450,
    details: "Built: c. 1450 CE • Elevation: 2,430 m • Inca Stone Citadel",
    build: () => {
      const g = new THREE.Group();
      const grassMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.9 });
      const stoneMat = new THREE.MeshStandardMaterial({ color: 0xa8a29e, roughness: 0.7 });

      const t1 = new THREE.BoxGeometry(0.13, 0.02, 0.09);
      t1.translate(0, 0.01, 0);
      g.add(new THREE.Mesh(t1, grassMat));

      const t2 = new THREE.BoxGeometry(0.09, 0.02, 0.06);
      t2.translate(0, 0.025, 0);
      g.add(new THREE.Mesh(t2, grassMat));

      [-0.025, 0, 0.025].forEach(x => {
        const hut = new THREE.BoxGeometry(0.018, 0.016, 0.018);
        hut.translate(x, 0.04, 0);
        g.add(new THREE.Mesh(hut, stoneMat));
      });
      return g;
    }
  },
  {
    name: "Moai Statues (Easter Island)",
    country: "Chile",
    lat: -27.1127,
    lon: -109.3497,
    details: "Carved: c. 1250–1500 CE • Height: 4–10 m • Volcanic Tuff Monoliths",
    build: () => {
      const g = new THREE.Group();
      const stoneMat = new THREE.MeshStandardMaterial({ color: 0x57534e, roughness: 0.9 });
      const pukaoMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.8 });

      const ahu = new THREE.BoxGeometry(0.12, 0.015, 0.04);
      ahu.translate(0, 0.0075, 0);
      g.add(new THREE.Mesh(ahu, stoneMat));

      [-0.03, 0, 0.03].forEach(x => {
        const body = new THREE.BoxGeometry(0.018, 0.045, 0.018);
        body.translate(x, 0.035, 0);
        g.add(new THREE.Mesh(body, stoneMat));

        const head = new THREE.BoxGeometry(0.016, 0.03, 0.02);
        head.translate(x, 0.07, 0.002);
        g.add(new THREE.Mesh(head, stoneMat));

        const hat = new THREE.CylinderGeometry(0.008, 0.01, 0.012, 8);
        hat.translate(x, 0.09, 0.002);
        g.add(new THREE.Mesh(hat, pukaoMat));
      });
      return g;
    }
  },
  {
    name: "Obelisco de Buenos Aires",
    country: "Argentina",
    lat: -34.6037,
    lon: -58.3816,
    details: "Built: 1936 • Height: 67.5 m • White Cordoba Stone",
    build: () => {
      const g = new THREE.Group();
      const mat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 });

      const base = new THREE.BoxGeometry(0.04, 0.01, 0.04);
      base.translate(0, 0.005, 0);
      g.add(new THREE.Mesh(base, mat));

      const shaft = new THREE.CylinderGeometry(0.008, 0.018, 0.16, 4);
      shaft.translate(0, 0.09, 0);
      shaft.rotateY(Math.PI / 4);
      g.add(new THREE.Mesh(shaft, mat));

      const apex = new THREE.ConeGeometry(0.011, 0.025, 4);
      apex.translate(0, 0.18, 0);
      apex.rotateY(Math.PI / 4);
      g.add(new THREE.Mesh(apex, mat));
      return g;
    }
  },
  {
    name: "Great Pyramid of Giza",
    country: "Egypt",
    lat: 29.9792,
    lon: 31.1342,
    details: "Built: c. 2560 BCE • Height: 138.8 m • Limestone Block Mass",
    build: () => {
      const g = new THREE.Group();
      const mat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.85 });
      
      const pyrGeom = new THREE.ConeGeometry(0.12, 0.14, 4);
      pyrGeom.translate(0, 0.07, 0);
      const pyr = new THREE.Mesh(pyrGeom, mat);
      pyr.rotation.y = Math.PI / 4;
      g.add(pyr);

      const pyr2Geom = new THREE.ConeGeometry(0.08, 0.1, 4);
      pyr2Geom.translate(0, 0.05, 0.06);
      const pyr2 = new THREE.Mesh(pyr2Geom, mat);
      pyr2.rotation.y = Math.PI / 4;
      g.add(pyr2);
      return g;
    }
  },
  {
    name: "Church of Saint George (Lalibela)",
    country: "Ethiopia",
    lat: 12.0319,
    lon: 39.0411,
    details: "Carved: c. 1200 CE • Height: 12 m • Monolithic Rock-Hewn Greek Cross",
    build: () => {
      const g = new THREE.Group();
      const rockTrenchMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 });
      const churchMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.7 });

      const trench = new THREE.BoxGeometry(0.12, 0.03, 0.12);
      trench.translate(0, 0.015, 0);
      g.add(new THREE.Mesh(trench, rockTrenchMat));

      const beamX = new THREE.BoxGeometry(0.07, 0.06, 0.025);
      beamX.translate(0, 0.035, 0);
      g.add(new THREE.Mesh(beamX, churchMat));

      const beamZ = new THREE.BoxGeometry(0.025, 0.06, 0.07);
      beamZ.translate(0, 0.035, 0);
      g.add(new THREE.Mesh(beamZ, churchMat));
      return g;
    }
  },
  {
    name: "Great Mosque of Djenné",
    country: "Mali",
    lat: 13.9051,
    lon: -4.5557,
    details: "Rebuilt: 1907 • Height: 20 m • World's Largest Adobe Mud Building",
    build: () => {
      const g = new THREE.Group();
      const adobeMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.95 });

      const hall = new THREE.BoxGeometry(0.11, 0.04, 0.06);
      hall.translate(0, 0.02, 0);
      g.add(new THREE.Mesh(hall, adobeMat));

      [-0.035, 0, 0.035].forEach(x => {
        const tower = new THREE.CylinderGeometry(0.008, 0.012, 0.06, 4);
        tower.translate(x, 0.05, 0.02);
        tower.rotateY(Math.PI / 4);
        g.add(new THREE.Mesh(tower, adobeMat));

        const pinnacle = new THREE.ConeGeometry(0.008, 0.02, 4);
        pinnacle.translate(x, 0.085, 0.02);
        pinnacle.rotateY(Math.PI / 4);
        g.add(new THREE.Mesh(pinnacle, adobeMat));
      });
      return g;
    }
  },
  {
    name: "Burj Khalifa",
    country: "United Arab Emirates",
    lat: 25.1972,
    lon: 55.2744,
    details: "Built: 2010 • Height: 828 m • World's Tallest Structure (163 Floors)",
    build: () => {
      const g = new THREE.Group();
      const glassMat = new THREE.MeshStandardMaterial({ color: 0x93c5fd, metalness: 0.8, roughness: 0.2 });

      const t1 = new THREE.CylinderGeometry(0.035, 0.045, 0.1, 6);
      t1.translate(0, 0.05, 0);
      g.add(new THREE.Mesh(t1, glassMat));

      const t2 = new THREE.CylinderGeometry(0.02, 0.03, 0.1, 6);
      t2.translate(0, 0.15, 0);
      g.add(new THREE.Mesh(t2, glassMat));

      const t3 = new THREE.CylinderGeometry(0.008, 0.015, 0.08, 6);
      t3.translate(0, 0.24, 0);
      g.add(new THREE.Mesh(t3, glassMat));

      const spire = new THREE.CylinderGeometry(0.002, 0.006, 0.06, 4);
      spire.translate(0, 0.31, 0);
      g.add(new THREE.Mesh(spire, glassMat));
      return g;
    }
  },
  {
    name: "Abraj Al Bait & The Kaaba (Mecca)",
    country: "Saudi Arabia",
    lat: 21.4225,
    lon: 39.8262,
    details: "Built: 2012 • Height: 601 m • Clock Tower with 43 m Clock Faces",
    build: () => {
      const g = new THREE.Group();
      const clockTowerMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, metalness: 0.4 });
      const goldMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.8 });
      const kaabaMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 });

      const kaaba = new THREE.BoxGeometry(0.03, 0.03, 0.03);
      kaaba.translate(0.04, 0.015, 0.02);
      g.add(new THREE.Mesh(kaaba, kaabaMat));

      const band = new THREE.BoxGeometry(0.031, 0.006, 0.031);
      band.translate(0.04, 0.024, 0.02);
      g.add(new THREE.Mesh(band, goldMat));

      const tower = new THREE.BoxGeometry(0.04, 0.18, 0.04);
      tower.translate(-0.02, 0.09, -0.01);
      g.add(new THREE.Mesh(tower, clockTowerMat));

      const clockFace = new THREE.BoxGeometry(0.048, 0.03, 0.048);
      clockFace.translate(-0.02, 0.19, -0.01);
      g.add(new THREE.Mesh(clockFace, clockTowerMat));

      const spire = new THREE.ConeGeometry(0.014, 0.07, 8);
      spire.translate(-0.02, 0.24, -0.01);
      g.add(new THREE.Mesh(spire, goldMat));
      return g;
    }
  },
  {
    name: "Hagia Sophia",
    country: "Turkey",
    lat: 41.0086,
    lon: 28.9802,
    details: "Built: 537 CE • Dome Height: 55 m • Byzantine Architectural Wonder",
    build: () => {
      const g = new THREE.Group();
      const terraMat = new THREE.MeshStandardMaterial({ color: 0xbe123c, roughness: 0.8 });
      const stoneMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.6 });

      const base = new THREE.BoxGeometry(0.09, 0.04, 0.08);
      base.translate(0, 0.02, 0);
      g.add(new THREE.Mesh(base, terraMat));

      const dome = new THREE.SphereGeometry(0.035, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
      dome.translate(0, 0.04, 0);
      g.add(new THREE.Mesh(dome, terraMat));

      const minarets = [
        [-0.05, -0.045], [0.05, -0.045],
        [-0.05, 0.045],  [0.05, 0.045]
      ];
      minarets.forEach(([x, z]) => {
        const m = new THREE.CylinderGeometry(0.005, 0.008, 0.12, 6);
        m.translate(x, 0.06, z);
        g.add(new THREE.Mesh(m, stoneMat));

        const cap = new THREE.ConeGeometry(0.006, 0.025, 6);
        cap.translate(x, 0.13, z);
        g.add(new THREE.Mesh(cap, stoneMat));
      });
      return g;
    }
  },
  {
    name: "Eiffel Tower",
    country: "France",
    lat: 48.8584,
    lon: 2.2945,
    details: "Built: 1889 • Height: 330 m • Wrought-Iron Lattice Tower",
    build: () => {
      const g = new THREE.Group();
      const mat = new THREE.MeshStandardMaterial({ color: 0xc89d66, metalness: 0.6, roughness: 0.4 });
      
      const baseGeom = new THREE.CylinderGeometry(0.04, 0.08, 0.08, 4);
      baseGeom.translate(0, 0.04, 0);
      const base = new THREE.Mesh(baseGeom, mat);
      base.rotation.y = Math.PI / 4;
      g.add(base);

      const midGeom = new THREE.CylinderGeometry(0.02, 0.04, 0.08, 4);
      midGeom.translate(0, 0.12, 0);
      const mid = new THREE.Mesh(midGeom, mat);
      mid.rotation.y = Math.PI / 4;
      g.add(mid);

      const spireGeom = new THREE.ConeGeometry(0.015, 0.14, 4);
      spireGeom.translate(0, 0.23, 0);
      const spire = new THREE.Mesh(spireGeom, mat);
      spire.rotation.y = Math.PI / 4;
      g.add(spire);
      return g;
    }
  },
  {
    name: "Big Ben (Elizabeth Tower)",
    country: "United Kingdom",
    lat: 51.5007,
    lon: -0.1246,
    details: "Built: 1859 • Height: 96 m • Neo-Gothic Clock Tower",
    build: () => {
      const g = new THREE.Group();
      const stoneMat = new THREE.MeshStandardMaterial({ color: 0xca8a04, roughness: 0.7 });
      const roofMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4 });

      const tower = new THREE.BoxGeometry(0.035, 0.18, 0.035);
      tower.translate(0, 0.09, 0);
      g.add(new THREE.Mesh(tower, stoneMat));

      const clock = new THREE.BoxGeometry(0.045, 0.03, 0.045);
      clock.translate(0, 0.19, 0);
      g.add(new THREE.Mesh(clock, stoneMat));

      const roof = new THREE.ConeGeometry(0.032, 0.07, 4);
      roof.translate(0, 0.24, 0);
      roof.rotateY(Math.PI / 4);
      g.add(new THREE.Mesh(roof, roofMat));
      return g;
    }
  },
  {
    name: "Sagrada Família",
    country: "Spain",
    lat: 41.4036,
    lon: 2.1744,
    details: "Begun: 1882 • Height: 172.5 m (Planned) • Antoni Gaudí Basilica",
    build: () => {
      const g = new THREE.Group();
      const stoneMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.8 });
      const tipMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, metalness: 0.8 });

      const nave = new THREE.BoxGeometry(0.08, 0.08, 0.05);
      nave.translate(0, 0.04, 0);
      g.add(new THREE.Mesh(nave, stoneMat));

      const spires = [
        [-0.025, 0.02], [-0.008, 0.025], [0.008, 0.025], [0.025, 0.02]
      ];
      spires.forEach(([x, z], i) => {
        const height = (i === 1 || i === 2) ? 0.16 : 0.14;
        const sp = new THREE.CylinderGeometry(0.006, 0.012, height, 6);
        sp.translate(x, height / 2 + 0.04, z);
        g.add(new THREE.Mesh(sp, stoneMat));

        const tip = new THREE.SphereGeometry(0.008, 6, 6);
        tip.translate(x, height + 0.04, z);
        g.add(new THREE.Mesh(tip, tipMat));
      });
      return g;
    }
  },
  {
    name: "Leaning Tower of Pisa",
    country: "Italy",
    lat: 43.7230,
    lon: 10.3966,
    details: "Built: 1372 • Height: 56.7 m • 3.97° Lean • Marble Campanile",
    build: () => {
      const g = new THREE.Group();
      const mat = new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.5 });
      
      const towerGroup = new THREE.Group();
      const cyl = new THREE.CylinderGeometry(0.03, 0.035, 0.16, 12);
      cyl.translate(0, 0.08, 0);
      towerGroup.add(new THREE.Mesh(cyl, mat));

      const cap = new THREE.CylinderGeometry(0.02, 0.025, 0.03, 12);
      cap.translate(0, 0.175, 0);
      towerGroup.add(new THREE.Mesh(cap, mat));

      towerGroup.rotation.z = 0.1;
      g.add(towerGroup);
      return g;
    }
  },
  {
    name: "Neuschwanstein Castle",
    country: "Germany",
    lat: 47.5576,
    lon: 10.7498,
    details: "Built: 1886 • Height: 65 m • Bavarian Romanesque Revival Castle",
    build: () => {
      const g = new THREE.Group();
      const wallMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.6 });
      const roofMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.4 });

      const palace = new THREE.BoxGeometry(0.09, 0.06, 0.04);
      palace.translate(0, 0.03, 0);
      g.add(new THREE.Mesh(palace, wallMat));

      const mainTower = new THREE.CylinderGeometry(0.016, 0.018, 0.11, 8);
      mainTower.translate(-0.03, 0.055, 0);
      g.add(new THREE.Mesh(mainTower, wallMat));

      const turret = new THREE.ConeGeometry(0.02, 0.06, 8);
      turret.translate(-0.03, 0.14, 0);
      g.add(new THREE.Mesh(turret, roofMat));

      const gateTower = new THREE.CylinderGeometry(0.012, 0.012, 0.08, 8);
      gateTower.translate(0, 0.04, 0);
      g.add(new THREE.Mesh(gateTower, wallMat));

      const gateRoof = new THREE.ConeGeometry(0.015, 0.04, 8);
      gateRoof.translate(0, 0.10, 0);
      g.add(new THREE.Mesh(gateRoof, roofMat));
      return g;
    }
  },
  {
    name: "St. Basil's Cathedral",
    country: "Russia",
    lat: 55.7525,
    lon: 37.6231,
    details: "Built: 1561 • Height: 47.5 m • Red Square Onion Domes",
    build: () => {
      const g = new THREE.Group();
      const brickMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.8 });
      const goldMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.8, roughness: 0.2 });
      const tealMat = new THREE.MeshStandardMaterial({ color: 0x0d9488, roughness: 0.5 });

      const base = new THREE.BoxGeometry(0.08, 0.04, 0.08);
      base.translate(0, 0.02, 0);
      g.add(new THREE.Mesh(base, brickMat));

      const spire = new THREE.ConeGeometry(0.025, 0.11, 8);
      spire.translate(0, 0.095, 0);
      g.add(new THREE.Mesh(spire, brickMat));

      const centralDome = new THREE.SphereGeometry(0.018, 12, 12);
      centralDome.translate(0, 0.155, 0);
      g.add(new THREE.Mesh(centralDome, goldMat));

      const domes = [
        [-0.03, -0.03, tealMat], [0.03, -0.03, goldMat],
        [-0.03, 0.03, goldMat],  [0.03, 0.03, tealMat]
      ];
      domes.forEach(([x, z, mat]) => {
        const t = new THREE.CylinderGeometry(0.012, 0.012, 0.04, 6);
        t.translate(x, 0.06, z);
        g.add(new THREE.Mesh(t, brickMat));

        const d = new THREE.SphereGeometry(0.016, 10, 10);
        d.scale(1, 1.3, 1);
        d.translate(x, 0.09, z);
        g.add(new THREE.Mesh(d, mat));
      });
      return g;
    }
  },
  {
    name: "Taj Mahal",
    country: "India",
    lat: 27.1751,
    lon: 78.0421,
    details: "Built: 1653 • Height: 73 m • White Marble Mughal Mausoleum",
    build: () => {
      const g = new THREE.Group();
      const marbleMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.2 });

      const baseGeom = new THREE.BoxGeometry(0.14, 0.02, 0.14);
      baseGeom.translate(0, 0.01, 0);
      g.add(new THREE.Mesh(baseGeom, marbleMat));

      const chamberGeom = new THREE.BoxGeometry(0.08, 0.06, 0.08);
      chamberGeom.translate(0, 0.05, 0);
      g.add(new THREE.Mesh(chamberGeom, marbleMat));

      const domeGeom = new THREE.SphereGeometry(0.035, 12, 12);
      domeGeom.translate(0, 0.105, 0);
      g.add(new THREE.Mesh(domeGeom, marbleMat));

      const corners = [
        [-0.055, -0.055], [0.055, -0.055],
        [-0.055, 0.055],  [0.055, 0.055]
      ];
      corners.forEach(([x, z]) => {
        const minaretGeom = new THREE.CylinderGeometry(0.006, 0.008, 0.11, 6);
        minaretGeom.translate(x, 0.055, z);
        g.add(new THREE.Mesh(minaretGeom, marbleMat));
      });
      return g;
    }
  },
  {
    name: "Angkor Wat",
    country: "Cambodia",
    lat: 13.4125,
    lon: 103.8670,
    details: "Built: 12th Century • Height: 65 m • Sandstone Khmer Temple Complex",
    build: () => {
      const g = new THREE.Group();
      const stoneMat = new THREE.MeshStandardMaterial({ color: 0x78716c, roughness: 0.9 });

      const t1 = new THREE.BoxGeometry(0.14, 0.015, 0.12);
      t1.translate(0, 0.0075, 0);
      g.add(new THREE.Mesh(t1, stoneMat));

      const t2 = new THREE.BoxGeometry(0.10, 0.02, 0.08);
      t2.translate(0, 0.025, 0);
      g.add(new THREE.Mesh(t2, stoneMat));

      const towers = [
        [0, 0, 0.08, 0.018],
        [-0.035, -0.025, 0.055, 0.014],
        [0.035, -0.025, 0.055, 0.014],
        [-0.035, 0.025, 0.055, 0.014],
        [0.035, 0.025, 0.055, 0.014]
      ];
      towers.forEach(([x, z, h, r]) => {
        const tower = new THREE.ConeGeometry(r, h, 6);
        tower.translate(x, h / 2 + 0.035, z);
        g.add(new THREE.Mesh(tower, stoneMat));
      });
      return g;
    }
  },
  {
    name: "Oriental Pearl Tower",
    country: "China",
    lat: 31.2397,
    lon: 121.4998,
    details: "Built: 1994 • Height: 468 m • Multi-Sphere Broadcast Tower",
    build: () => {
      const g = new THREE.Group();
      const colMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.5 });
      const pearlMat = new THREE.MeshStandardMaterial({ color: 0xf43f5e, metalness: 0.6, roughness: 0.2 });

      const cols = new THREE.CylinderGeometry(0.012, 0.025, 0.12, 6);
      cols.translate(0, 0.06, 0);
      g.add(new THREE.Mesh(cols, colMat));

      const sphere1 = new THREE.SphereGeometry(0.03, 16, 16);
      sphere1.translate(0, 0.12, 0);
      g.add(new THREE.Mesh(sphere1, pearlMat));

      const midCol = new THREE.CylinderGeometry(0.008, 0.008, 0.07, 6);
      midCol.translate(0, 0.17, 0);
      g.add(new THREE.Mesh(midCol, colMat));

      const sphere2 = new THREE.SphereGeometry(0.022, 16, 16);
      sphere2.translate(0, 0.21, 0);
      g.add(new THREE.Mesh(sphere2, pearlMat));

      const needle = new THREE.CylinderGeometry(0.002, 0.005, 0.08, 4);
      needle.translate(0, 0.26, 0);
      g.add(new THREE.Mesh(needle, colMat));
      return g;
    }
  },
  {
    name: "Shanghai World Financial Center",
    country: "China",
    lat: 31.2367,
    lon: 121.5033,
    details: "Built: 2008 • Height: 492 m • 101 Floors • Trapezoid Sky Aperture",
    build: () => {
      const g = new THREE.Group();
      const glassMat = new THREE.MeshStandardMaterial({ color: 0x60a5fa, metalness: 0.85, roughness: 0.1 });

      const tower = new THREE.CylinderGeometry(0.018, 0.038, 0.22, 4);
      tower.translate(0, 0.11, 0);
      tower.rotateY(Math.PI / 4);
      g.add(new THREE.Mesh(tower, glassMat));

      const topBeam = new THREE.BoxGeometry(0.024, 0.01, 0.014);
      topBeam.translate(0, 0.225, 0);
      g.add(new THREE.Mesh(topBeam, glassMat));
      return g;
    }
  },
  {
    name: "Sydney Opera House",
    country: "Australia",
    lat: -33.8568,
    lon: 151.2153,
    details: "Built: 1973 • Roof Shell Height: 65 m • Expressionist Concert Complex",
    build: () => {
      const g = new THREE.Group();
      const baseMat = new THREE.MeshStandardMaterial({ color: 0x475569 });
      const shellMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });

      const base = new THREE.BoxGeometry(0.14, 0.015, 0.08);
      base.translate(0, 0.0075, 0);
      g.add(new THREE.Mesh(base, baseMat));

      [-0.03, 0.0, 0.03].forEach((x, i) => {
        const height = 0.06 + i * 0.015;
        const shell = new THREE.ConeGeometry(0.03, height, 4);
        shell.translate(x, height / 2 + 0.075, 0);
        shell.rotateZ(0.2);
        g.add(new THREE.Mesh(shell, shellMat));
      });
      return g;
    }
  },
  {
    name: "Monas (National Monument)",
    country: "Indonesia",
    lat: -6.1754,
    lon: 106.8272,
    details: "Built: 1975 • Height: 132 m • Marble Obelisk with Golden Flame of Independence",
    build: () => {
      const g = new THREE.Group();
      const marbleMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.3 });
      const goldMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.85, roughness: 0.15 });

      const base = new THREE.BoxGeometry(0.11, 0.016, 0.11);
      base.translate(0, 0.008, 0);
      g.add(new THREE.Mesh(base, marbleMat));

      const cawan = new THREE.CylinderGeometry(0.046, 0.034, 0.02, 4);
      cawan.translate(0, 0.026, 0);
      cawan.rotateY(Math.PI / 4);
      g.add(new THREE.Mesh(cawan, marbleMat));

      const shaft = new THREE.CylinderGeometry(0.009, 0.016, 0.16, 4);
      shaft.translate(0, 0.116, 0);
      shaft.rotateY(Math.PI / 4);
      g.add(new THREE.Mesh(shaft, marbleMat));

      const deck = new THREE.CylinderGeometry(0.016, 0.016, 0.008, 16);
      deck.translate(0, 0.20, 0);
      g.add(new THREE.Mesh(deck, marbleMat));

      const flame = new THREE.ConeGeometry(0.009, 0.028, 8);
      flame.translate(0, 0.218, 0);
      g.add(new THREE.Mesh(flame, goldMat));
      return g;
    }
  },
  {
    name: "Jatiya Sangsad Bhaban (National Parliament)",
    country: "Bangladesh",
    lat: 23.7625,
    lon: 90.3788,
    details: "Built: 1982 • Height: 50 m • Louis Kahn Monumental Brutalist Complex",
    build: () => {
      const g = new THREE.Group();
      const waterMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.3, metalness: 0.5 });
      const concreteMat = new THREE.MeshStandardMaterial({ color: 0xcfd8dc, roughness: 0.75 });
      const accentMat = new THREE.MeshStandardMaterial({ color: 0x90a4ae, roughness: 0.8 });

      const lake = new THREE.BoxGeometry(0.14, 0.008, 0.14);
      lake.translate(0, 0.004, 0);
      g.add(new THREE.Mesh(lake, waterMat));

      const core = new THREE.CylinderGeometry(0.038, 0.038, 0.07, 16);
      core.translate(0, 0.043, 0);
      g.add(new THREE.Mesh(core, concreteMat));

      const cornerOffsets = [
        [-0.038, -0.038], [0.038, -0.038],
        [-0.038, 0.038],  [0.038, 0.038]
      ];
      cornerOffsets.forEach(([x, z]) => {
        const cornerBlock = new THREE.CylinderGeometry(0.018, 0.018, 0.062, 8);
        cornerBlock.translate(x, 0.039, z);
        g.add(new THREE.Mesh(cornerBlock, accentMat));
      });

      const flankE = new THREE.BoxGeometry(0.022, 0.055, 0.05);
      flankE.translate(0.045, 0.035, 0);
      g.add(new THREE.Mesh(flankE, concreteMat));

      const flankW = new THREE.BoxGeometry(0.022, 0.055, 0.05);
      flankW.translate(-0.045, 0.035, 0);
      g.add(new THREE.Mesh(flankW, concreteMat));

      return g;
    }
  },
  {
    name: "Tokyo Skytree",
    country: "Japan",
    lat: 35.7100,
    lon: 139.8107,
    details: "Built: 2012 • Height: 634 m • World's Tallest Freestanding Broadcast Tower",
    build: () => {
      const g = new THREE.Group();
      const whiteSteel = new THREE.MeshStandardMaterial({ color: 0xf0f9ff, metalness: 0.65, roughness: 0.25 });
      const podGlass = new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.85, roughness: 0.15 });

      const lowerTower = new THREE.CylinderGeometry(0.016, 0.036, 0.16, 6);
      lowerTower.translate(0, 0.08, 0);
      g.add(new THREE.Mesh(lowerTower, whiteSteel));

      const temboDeck = new THREE.CylinderGeometry(0.032, 0.026, 0.024, 20);
      temboDeck.translate(0, 0.155, 0);
      g.add(new THREE.Mesh(temboDeck, podGlass));

      const midShaft = new THREE.CylinderGeometry(0.010, 0.013, 0.06, 12);
      midShaft.translate(0, 0.197, 0);
      g.add(new THREE.Mesh(midShaft, whiteSteel));

      const temboGalleria = new THREE.CylinderGeometry(0.020, 0.016, 0.018, 16);
      temboGalleria.translate(0, 0.228, 0);
      g.add(new THREE.Mesh(temboGalleria, podGlass));

      const antenna = new THREE.CylinderGeometry(0.0025, 0.007, 0.09, 6);
      antenna.translate(0, 0.282, 0);
      g.add(new THREE.Mesh(antenna, whiteSteel));

      return g;
    }
  },
  {
    name: "India Gate",
    country: "India",
    lat: 28.6129,
    lon: 77.2295,
    details: "Built: 1931 • Height: 42 m • Sandstone Triumphal National Memorial Arch",
    build: () => {
      const g = new THREE.Group();
      const sandstoneMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.75 });
      const darkStoneMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.8 });

      const base = new THREE.BoxGeometry(0.10, 0.012, 0.045);
      base.translate(0, 0.006, 0);
      g.add(new THREE.Mesh(base, darkStoneMat));

      const pillarL = new THREE.BoxGeometry(0.026, 0.062, 0.036);
      pillarL.translate(-0.028, 0.043, 0);
      g.add(new THREE.Mesh(pillarL, sandstoneMat));

      const pillarR = new THREE.BoxGeometry(0.026, 0.062, 0.036);
      pillarR.translate(0.028, 0.043, 0);
      g.add(new THREE.Mesh(pillarR, sandstoneMat));

      const lintel = new THREE.BoxGeometry(0.082, 0.032, 0.038);
      lintel.translate(0, 0.09, 0);
      g.add(new THREE.Mesh(lintel, sandstoneMat));

      const crown = new THREE.BoxGeometry(0.065, 0.012, 0.03);
      crown.translate(0, 0.112, 0);
      g.add(new THREE.Mesh(crown, darkStoneMat));

      const domeBowl = new THREE.CylinderGeometry(0.014, 0.018, 0.008, 16);
      domeBowl.translate(0, 0.122, 0);
      g.add(new THREE.Mesh(domeBowl, sandstoneMat));

      return g;
    }
  },
  {
    name: "Canton Tower",
    country: "China",
    lat: 23.1065,
    lon: 113.3189,
    details: "Built: 2010 • Height: 604 m • Hyperboloid Twisted Lattice Tower",
    build: () => {
      const g = new THREE.Group();
      const latticeMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.7, roughness: 0.2 });
      const coreMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4 });

      const lowerFunnel = new THREE.CylinderGeometry(0.012, 0.034, 0.12, 16);
      lowerFunnel.translate(0, 0.06, 0);
      g.add(new THREE.Mesh(lowerFunnel, latticeMat));

      const upperFunnel = new THREE.CylinderGeometry(0.024, 0.012, 0.11, 16);
      upperFunnel.translate(0, 0.175, 0);
      g.add(new THREE.Mesh(upperFunnel, latticeMat));

      const roofDeck = new THREE.CylinderGeometry(0.025, 0.024, 0.012, 16);
      roofDeck.translate(0, 0.236, 0);
      roofDeck.rotateX(0.12);
      g.add(new THREE.Mesh(roofDeck, coreMat));

      const mast = new THREE.CylinderGeometry(0.002, 0.005, 0.085, 6);
      mast.translate(0, 0.285, 0);
      g.add(new THREE.Mesh(mast, coreMat));

      return g;
    }
  },
  {
    name: "Manila Cathedral",
    country: "Philippines",
    lat: 14.5916,
    lon: 120.9734,
    details: "Built: 1958 • Height: 44 m • Neo-Romanesque Minor Basilica of the Immaculate Conception",
    build: () => {
      const g = new THREE.Group();
      const stoneMat = new THREE.MeshStandardMaterial({ color: 0xd6d3d1, roughness: 0.65 });
      const roofMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.7 });

      const nave = new THREE.BoxGeometry(0.065, 0.038, 0.09);
      nave.translate(0, 0.019, 0);
      g.add(new THREE.Mesh(nave, stoneMat));

      const facade = new THREE.BoxGeometry(0.07, 0.048, 0.015);
      facade.translate(0, 0.024, 0.045);
      g.add(new THREE.Mesh(facade, stoneMat));

      const dome = new THREE.SphereGeometry(0.022, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
      dome.translate(0, 0.038, -0.015);
      g.add(new THREE.Mesh(dome, roofMat));

      const bellTower = new THREE.BoxGeometry(0.022, 0.095, 0.022);
      bellTower.translate(-0.042, 0.0475, 0.035);
      g.add(new THREE.Mesh(bellTower, stoneMat));

      const towerCap = new THREE.ConeGeometry(0.014, 0.025, 4);
      towerCap.translate(-0.042, 0.1075, 0.035);
      towerCap.rotateY(Math.PI / 4);
      g.add(new THREE.Mesh(towerCap, roofMat));

      return g;
    }
  },
  {
    name: "Victoria Memorial",
    country: "India",
    lat: 22.5448,
    lon: 88.3426,
    details: "Built: 1921 • Height: 56 m • White Makrana Marble Indo-Saracenic Monument",
    build: () => {
      const g = new THREE.Group();
      const marbleMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.25 });
      const goldMat = new THREE.MeshStandardMaterial({ color: 0xca8a04, metalness: 0.75, roughness: 0.2 });

      const terrace = new THREE.BoxGeometry(0.14, 0.014, 0.10);
      terrace.translate(0, 0.007, 0);
      g.add(new THREE.Mesh(terrace, marbleMat));

      const body = new THREE.BoxGeometry(0.108, 0.036, 0.072);
      body.translate(0, 0.032, 0);
      g.add(new THREE.Mesh(body, marbleMat));

      const drum = new THREE.CylinderGeometry(0.028, 0.028, 0.016, 16);
      drum.translate(0, 0.058, 0);
      g.add(new THREE.Mesh(drum, marbleMat));

      const dome = new THREE.SphereGeometry(0.028, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
      dome.translate(0, 0.066, 0);
      g.add(new THREE.Mesh(dome, marbleMat));

      const angel = new THREE.ConeGeometry(0.005, 0.018, 6);
      angel.translate(0, 0.098, 0);
      g.add(new THREE.Mesh(angel, goldMat));

      const cornerOffsets = [
        [-0.042, -0.026], [0.042, -0.026],
        [-0.042, 0.026],  [0.042, 0.026]
      ];
      cornerOffsets.forEach(([x, z]) => {
        const cDome = new THREE.SphereGeometry(0.012, 10, 10, 0, Math.PI * 2, 0, Math.PI / 2);
        cDome.translate(x, 0.05, z);
        g.add(new THREE.Mesh(cDome, marbleMat));
      });

      return g;
    }
  },
  {
    name: "N Seoul Tower",
    country: "South Korea",
    lat: 37.5512,
    lon: 126.9882,
    details: "Built: 1975 • Height: 236 m (480 m MSL) • Iconic Namsan Mountain Observation Tower",
    build: () => {
      const g = new THREE.Group();
      const towerMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.35 });
      const deckMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.6, roughness: 0.2 });
      const antMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.8 });

      const base = new THREE.CylinderGeometry(0.038, 0.048, 0.02, 8);
      base.translate(0, 0.01, 0);
      g.add(new THREE.Mesh(base, towerMat));

      const shaft = new THREE.CylinderGeometry(0.009, 0.014, 0.14, 6);
      shaft.translate(0, 0.09, 0);
      g.add(new THREE.Mesh(shaft, towerMat));

      const pod = new THREE.CylinderGeometry(0.028, 0.022, 0.026, 16);
      pod.translate(0, 0.173, 0);
      g.add(new THREE.Mesh(pod, deckMat));

      const mast = new THREE.CylinderGeometry(0.0025, 0.006, 0.08, 6);
      mast.translate(0, 0.226, 0);
      g.add(new THREE.Mesh(mast, antMat));

      return g;
    }
  },
  {
    name: "Mazar-e-Quaid (Jinnah Mausoleum)",
    country: "Pakistan",
    lat: 24.8753,
    lon: 67.0409,
    details: "Built: 1970 • Height: 43 m • White Marble Modernist National Mausoleum of Muhammad Ali Jinnah",
    build: () => {
      const g = new THREE.Group();
      const marbleMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.15 });
      const archMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 });

      const terrace = new THREE.BoxGeometry(0.12, 0.012, 0.12);
      terrace.translate(0, 0.006, 0);
      g.add(new THREE.Mesh(terrace, marbleMat));

      const cube = new THREE.CylinderGeometry(0.054, 0.064, 0.062, 4);
      cube.translate(0, 0.043, 0);
      cube.rotateY(Math.PI / 4);
      g.add(new THREE.Mesh(cube, marbleMat));

      const arch1 = new THREE.BoxGeometry(0.024, 0.038, 0.08);
      arch1.translate(0, 0.038, 0);
      g.add(new THREE.Mesh(arch1, archMat));

      const arch2 = new THREE.BoxGeometry(0.08, 0.038, 0.024);
      arch2.translate(0, 0.038, 0);
      g.add(new THREE.Mesh(arch2, archMat));

      const dome = new THREE.SphereGeometry(0.038, 20, 20, 0, Math.PI * 2, 0, Math.PI / 2);
      dome.translate(0, 0.074, 0);
      g.add(new THREE.Mesh(dome, marbleMat));

      return g;
    }
  },
  {
    name: "Gateway of India",
    country: "India",
    lat: 18.9220,
    lon: 72.8347,
    details: "Built: 1924 • Height: 26 m • Yellow Basalt Indo-Saracenic Waterfront Arch",
    build: () => {
      const g = new THREE.Group();
      const basaltMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.75 });
      const darkBasalt = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.8 });

      const base = new THREE.BoxGeometry(0.11, 0.014, 0.05);
      base.translate(0, 0.007, 0);
      g.add(new THREE.Mesh(base, darkBasalt));

      const block = new THREE.BoxGeometry(0.092, 0.056, 0.038);
      block.translate(0, 0.042, 0);
      g.add(new THREE.Mesh(block, basaltMat));

      const dome = new THREE.SphereGeometry(0.022, 14, 14, 0, Math.PI * 2, 0, Math.PI / 2);
      dome.translate(0, 0.07, 0);
      g.add(new THREE.Mesh(dome, basaltMat));

      const turrets = [
        [-0.042, -0.016], [0.042, -0.016],
        [-0.042, 0.016],  [0.042, 0.016]
      ];
      turrets.forEach(([x, z]) => {
        const t = new THREE.CylinderGeometry(0.006, 0.006, 0.075, 6);
        t.translate(x, 0.052, z);
        g.add(new THREE.Mesh(t, basaltMat));

        const cap = new THREE.SphereGeometry(0.007, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2);
        cap.translate(x, 0.09, z);
        g.add(new THREE.Mesh(cap, darkBasalt));
      });

      return g;
    }
  },
  {
    name: "Edifício Copan",
    country: "Brazil",
    lat: -23.5467,
    lon: -46.6447,
    details: "Built: 1966 • Height: 115 m • 38 Floors • Oscar Niemeyer S-Wave Modernist Landmark",
    build: () => {
      const g = new THREE.Group();
      const concreteMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.45 });
      const glassMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.5 });

      const segmentOffsets = [
        { x: -0.042, z: -0.015, rot: 0.32 },
        { x: -0.015, z: 0.005,  rot: -0.25 },
        { x: 0.015,  z: -0.005, rot: 0.28 },
        { x: 0.042,  z: 0.015,  rot: -0.32 }
      ];

      segmentOffsets.forEach(seg => {
        const block = new THREE.BoxGeometry(0.034, 0.09, 0.016);
        block.translate(seg.x, 0.045, seg.z);
        block.rotateY(seg.rot);
        g.add(new THREE.Mesh(block, concreteMat));

        const louvers = new THREE.BoxGeometry(0.035, 0.006, 0.018);
        louvers.translate(seg.x, 0.05, seg.z);
        louvers.rotateY(seg.rot);
        g.add(new THREE.Mesh(louvers, glassMat));
      });

      return g;
    }
  },
  {
    name: "The Grand Palace (Wat Phra Kaew)",
    country: "Thailand",
    lat: 13.7516,
    lon: 100.4927,
    details: "Built: 1782 • Golden Phra Si Rattana Chedi & Royal Temple Complex",
    build: () => {
      const g = new THREE.Group();
      const goldMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.85, roughness: 0.2 });
      const redRoof = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.6 });
      const greenTile = new THREE.MeshStandardMaterial({ color: 0x059669, roughness: 0.5 });

      const base = new THREE.BoxGeometry(0.12, 0.012, 0.09);
      base.translate(0, 0.006, 0);
      g.add(new THREE.Mesh(base, redRoof));

      const chediBase = new THREE.CylinderGeometry(0.026, 0.032, 0.02, 16);
      chediBase.translate(-0.03, 0.022, 0);
      g.add(new THREE.Mesh(chediBase, goldMat));

      const chediBell = new THREE.SphereGeometry(0.024, 16, 16);
      chediBell.translate(-0.03, 0.044, 0);
      g.add(new THREE.Mesh(chediBell, goldMat));

      const chediSpire = new THREE.ConeGeometry(0.012, 0.075, 12);
      chediSpire.translate(-0.03, 0.092, 0);
      g.add(new THREE.Mesh(chediSpire, goldMat));

      const hall = new THREE.BoxGeometry(0.055, 0.035, 0.055);
      hall.translate(0.03, 0.028, 0);
      g.add(new THREE.Mesh(hall, redRoof));

      const roof1 = new THREE.BoxGeometry(0.062, 0.01, 0.062);
      roof1.translate(0.03, 0.048, 0);
      g.add(new THREE.Mesh(roof1, greenTile));

      const roofSpire = new THREE.ConeGeometry(0.008, 0.05, 8);
      roofSpire.translate(0.03, 0.078, 0);
      g.add(new THREE.Mesh(roofSpire, goldMat));

      return g;
    }
  },
  {
    name: "Palacio de Bellas Artes",
    country: "Mexico",
    lat: 19.4352,
    lon: -99.1412,
    details: "Built: 1934 • Height: 53 m • Carrara Marble & Golden Domed Cultural Palace",
    build: () => {
      const g = new THREE.Group();
      const marbleMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 });
      const goldenDome = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.65, roughness: 0.3 });

      const base = new THREE.BoxGeometry(0.12, 0.015, 0.08);
      base.translate(0, 0.0075, 0);
      g.add(new THREE.Mesh(base, marbleMat));

      const hall = new THREE.BoxGeometry(0.095, 0.042, 0.065);
      hall.translate(0, 0.036, 0);
      g.add(new THREE.Mesh(hall, marbleMat));

      const mainDome = new THREE.SphereGeometry(0.028, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
      mainDome.translate(0, 0.057, 0);
      g.add(new THREE.Mesh(mainDome, goldenDome));

      [-0.035, 0.035].forEach(x => {
        const subDome = new THREE.SphereGeometry(0.014, 12, 12, 0, Math.PI * 2, 0, Math.PI / 2);
        subDome.translate(x, 0.057, 0);
        g.add(new THREE.Mesh(subDome, goldenDome));
      });

      return g;
    }
  },
  {
    name: "The Forbidden City (Hall of Supreme Harmony)",
    country: "China",
    lat: 39.9163,
    lon: 116.3972,
    details: "Built: 1420 • UNESCO World Heritage • World's Largest Imperial Palace Complex",
    build: () => {
      const g = new THREE.Group();
      const marbleTerrace = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.5 });
      const crimsonMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.7 });
      const yellowTile = new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.35, metalness: 0.4 });

      const t1 = new THREE.BoxGeometry(0.14, 0.008, 0.095);
      t1.translate(0, 0.004, 0);
      g.add(new THREE.Mesh(t1, marbleTerrace));

      const t2 = new THREE.BoxGeometry(0.12, 0.008, 0.08);
      t2.translate(0, 0.012, 0);
      g.add(new THREE.Mesh(t2, marbleTerrace));

      const hall = new THREE.BoxGeometry(0.092, 0.026, 0.054);
      hall.translate(0, 0.029, 0);
      g.add(new THREE.Mesh(hall, crimsonMat));

      const roofLower = new THREE.BoxGeometry(0.108, 0.012, 0.07);
      roofLower.translate(0, 0.046, 0);
      g.add(new THREE.Mesh(roofLower, yellowTile));

      const roofUpper = new THREE.BoxGeometry(0.086, 0.015, 0.052);
      roofUpper.translate(0, 0.058, 0);
      g.add(new THREE.Mesh(roofUpper, yellowTile));

      return g;
    }
  },
  {
    name: "Badshahi Mosque",
    country: "Pakistan",
    lat: 31.5882,
    lon: 74.3095,
    details: "Built: 1673 • Mughal Red Sandstone Imperial Mosque with 3 White Marble Domes",
    build: () => {
      const g = new THREE.Group();
      const redSandstone = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.8 });
      const whiteMarble = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.25 });

      const base = new THREE.BoxGeometry(0.13, 0.012, 0.11);
      base.translate(0, 0.006, 0);
      g.add(new THREE.Mesh(base, redSandstone));

      const chamber = new THREE.BoxGeometry(0.088, 0.038, 0.046);
      chamber.translate(0, 0.031, -0.022);
      g.add(new THREE.Mesh(chamber, redSandstone));

      const domeC = new THREE.SphereGeometry(0.022, 16, 16);
      domeC.scale(1, 1.3, 1);
      domeC.translate(0, 0.058, -0.022);
      g.add(new THREE.Mesh(domeC, whiteMarble));

      [-0.028, 0.028].forEach(x => {
        const domeF = new THREE.SphereGeometry(0.015, 12, 12);
        domeF.scale(1, 1.25, 1);
        domeF.translate(x, 0.054, -0.022);
        g.add(new THREE.Mesh(domeF, whiteMarble));
      });

      const minaretCorners = [
        [-0.055, -0.045], [0.055, -0.045],
        [-0.055, 0.045],  [0.055, 0.045]
      ];
      minaretCorners.forEach(([x, z]) => {
        const m = new THREE.CylinderGeometry(0.006, 0.008, 0.11, 8);
        m.translate(x, 0.061, z);
        g.add(new THREE.Mesh(m, redSandstone));

        const pavilion = new THREE.ConeGeometry(0.008, 0.016, 8);
        pavilion.translate(x, 0.124, z);
        g.add(new THREE.Mesh(pavilion, whiteMarble));
      });

      return g;
    }
  },
  {
    name: "Saigon Notre-Dame Basilica",
    country: "Vietnam",
    lat: 10.7798,
    lon: 106.6990,
    details: "Built: 1880 • Height: 58 m • French Colonial Red Marseilles Brick Cathedral",
    build: () => {
      const g = new THREE.Group();
      const redBrick = new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.85 });
      const ironSpire = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.65, roughness: 0.35 });

      const nave = new THREE.BoxGeometry(0.055, 0.038, 0.088);
      nave.translate(0, 0.019, -0.015);
      g.add(new THREE.Mesh(nave, redBrick));

      [-0.018, 0.018].forEach(x => {
        const tower = new THREE.BoxGeometry(0.018, 0.09, 0.02);
        tower.translate(x, 0.045, 0.03);
        g.add(new THREE.Mesh(tower, redBrick));

        const spire = new THREE.ConeGeometry(0.013, 0.052, 8);
        spire.translate(x, 0.116, 0.03);
        g.add(new THREE.Mesh(spire, ironSpire));
      });

      return g;
    }
  },

  // --- NEW BUILDINGS (AFRICA & SOUTH AMERICA) ---
  {
    name: "Ponte City Apartments",
    country: "South Africa",
    lat: -26.1906,
    lon: 28.0575,
    details: "Built: 1975 • Height: 173 m • 54 Floors • Iconic Hollow-Core Cylindrical Skyscraper",
    build: () => {
      const g = new THREE.Group();
      const concreteMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.6 });
      const innerCoreMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 });
      const adBandMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.4 });

      // Base podium
      const base = new THREE.CylinderGeometry(0.032, 0.036, 0.015, 24);
      base.translate(0, 0.0075, 0);
      g.add(new THREE.Mesh(base, concreteMat));

      // Cylindrical Tower Outer Shell
      const outerTower = new THREE.CylinderGeometry(0.024, 0.024, 0.16, 24);
      outerTower.translate(0, 0.095, 0);
      g.add(new THREE.Mesh(outerTower, concreteMat));

      // Red Top Ring
      const adRing = new THREE.CylinderGeometry(0.0245, 0.0245, 0.02, 24);
      adRing.translate(0, 0.185, 0);
      g.add(new THREE.Mesh(adRing, adBandMat));

      // Hollow Inner Core (Dark top recess)
      const coreRecess = new THREE.CylinderGeometry(0.012, 0.012, 0.025, 16);
      coreRecess.translate(0, 0.185, 0);
      g.add(new THREE.Mesh(coreRecess, innerCoreMat));

      return g;
    }
  },
  {
    name: "Kenyatta Int'l Convention Centre (KICC)",
    country: "Kenya",
    lat: -1.2884,
    lon: 36.8233,
    details: "Built: 1973 • Height: 105 m • 28 Floors • Cylindrical Tower & Amphitheatre",
    build: () => {
      const g = new THREE.Group();
      const terracottaMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.65 });
      const darkPlinth = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.8 });
      const deckMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.5 });

      // Plinth base
      const base = new THREE.BoxGeometry(0.09, 0.012, 0.06);
      base.translate(0, 0.006, 0);
      g.add(new THREE.Mesh(base, darkPlinth));

      // Main Cylindrical Tower Shaft
      const tower = new THREE.CylinderGeometry(0.018, 0.020, 0.12, 18);
      tower.translate(-0.015, 0.072, 0);
      g.add(new THREE.Mesh(tower, terracottaMat));

      // Rooftop Saucer / Amphitheater Deck
      const saucer = new THREE.CylinderGeometry(0.028, 0.022, 0.012, 18);
      saucer.translate(-0.015, 0.138, 0);
      g.add(new THREE.Mesh(saucer, deckMat));

      // Adjacent Conical Plenary Hall
      const amphitheatre = new THREE.ConeGeometry(0.024, 0.038, 12);
      amphitheatre.translate(0.025, 0.031, 0);
      g.add(new THREE.Mesh(amphitheatre, terracottaMat));

      return g;
    }
  },
  {
    name: "Commercial Bank of Ethiopia (CBE) Headquarters",
    country: "Ethiopia",
    lat: 9.0182,
    lon: 38.7525,
    details: "Built: 2022 • Height: 209 m • 53 Floors • Tallest Skyscraper in East Africa",
    build: () => {
      const g = new THREE.Group();
      const glassMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.85, roughness: 0.15 });
      const baseMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.5 });

      // Podium
      const base = new THREE.BoxGeometry(0.065, 0.018, 0.05);
      base.translate(0, 0.009, 0);
      g.add(new THREE.Mesh(base, baseMat));

      // Diamond-Faceted Modern Skyscraper
      const tower = new THREE.CylinderGeometry(0.016, 0.024, 0.17, 8);
      tower.translate(0, 0.103, 0);
      g.add(new THREE.Mesh(tower, glassMat));

      // Slanted Apex Crown
      const crown = new THREE.ConeGeometry(0.016, 0.035, 8);
      crown.translate(0, 0.205, 0);
      crown.rotateX(0.15);
      g.add(new THREE.Mesh(crown, glassMat));

      return g;
    }
  },
  {
    name: "Hassan II Mosque",
    country: "Morocco",
    lat: 33.6086,
    lon: -7.6328,
    details: "Built: 1993 • Minaret Height: 210 m • Atlantic Ocean Waterfront Mosque",
    build: () => {
      const g = new THREE.Group();
      const marbleMat = new THREE.MeshStandardMaterial({ color: 0xf5f5f4, roughness: 0.35 });
      const roofMat = new THREE.MeshStandardMaterial({ color: 0x047857, roughness: 0.45 });
      const goldMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.8 });

      // Waterfront Plinth
      const base = new THREE.BoxGeometry(0.12, 0.014, 0.08);
      base.translate(0, 0.007, 0);
      g.add(new THREE.Mesh(base, marbleMat));

      // Main Prayer Hall with Green Gabled Roof
      const hall = new THREE.BoxGeometry(0.075, 0.032, 0.055);
      hall.translate(0.015, 0.03, 0);
      g.add(new THREE.Mesh(hall, marbleMat));

      const roof = new THREE.BoxGeometry(0.08, 0.012, 0.06);
      roof.translate(0.015, 0.052, 0);
      g.add(new THREE.Mesh(roof, roofMat));

      // Square Minaret (210 m)
      const minaret = new THREE.BoxGeometry(0.018, 0.17, 0.018);
      minaret.translate(-0.035, 0.099, 0);
      g.add(new THREE.Mesh(minaret, marbleMat));

      // Minaret lantern & golden finial
      const lantern = new THREE.BoxGeometry(0.012, 0.025, 0.012);
      lantern.translate(-0.035, 0.196, 0);
      g.add(new THREE.Mesh(lantern, roofMat));

      const spire = new THREE.CylinderGeometry(0.002, 0.005, 0.02, 4);
      spire.translate(-0.035, 0.218, 0);
      g.add(new THREE.Mesh(spire, goldMat));

      return g;
    }
  },
  {
    name: "NECOM House",
    country: "Nigeria",
    lat: 6.4520,
    lon: 3.3958,
    details: "Built: 1979 • Height: 160 m • 32 Floors • Communications Tower with Lighthouse Beacon",
    build: () => {
      const g = new THREE.Group();
      const concreteMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.5 });
      const glassMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.3 });
      const beaconMat = new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.7 });

      // Podium base
      const base = new THREE.BoxGeometry(0.05, 0.018, 0.05);
      base.translate(0, 0.009, 0);
      g.add(new THREE.Mesh(base, concreteMat));

      // Main Office Tower Block
      const tower = new THREE.BoxGeometry(0.032, 0.13, 0.032);
      tower.translate(0, 0.083, 0);
      g.add(new THREE.Mesh(tower, concreteMat));

      // Recessed glass strip core
      const core = new THREE.BoxGeometry(0.034, 0.12, 0.018);
      core.translate(0, 0.083, 0);
      g.add(new THREE.Mesh(core, glassMat));

      // Lighthouse beacon and spire
      const beacon = new THREE.CylinderGeometry(0.008, 0.008, 0.018, 12);
      beacon.translate(0, 0.157, 0);
      g.add(new THREE.Mesh(beacon, beaconMat));

      const spire = new THREE.CylinderGeometry(0.0015, 0.003, 0.045, 4);
      spire.translate(0, 0.188, 0);
      g.add(new THREE.Mesh(spire, concreteMat));

      return g;
    }
  },
  {
    name: "Great Mosque of Algiers (Djamaâ el-Djazaïr)",
    country: "Algeria",
    lat: 36.7344,
    lon: 3.1424,
    details: "Built: 2019 • Height: 265 m • World's Tallest Minaret • Bay of Algiers",
    build: () => {
      const g = new THREE.Group();
      const marbleMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.25 });
      const domeMat = new THREE.MeshStandardMaterial({ color: 0x059669, roughness: 0.35 });

      // Courtyard plinth
      const base = new THREE.BoxGeometry(0.13, 0.012, 0.08);
      base.translate(0, 0.006, 0);
      g.add(new THREE.Mesh(base, marbleMat));

      // Prayer Hall with large dome
      const hall = new THREE.BoxGeometry(0.065, 0.035, 0.065);
      hall.translate(0.025, 0.029, 0);
      g.add(new THREE.Mesh(hall, marbleMat));

      const dome = new THREE.SphereGeometry(0.024, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
      dome.translate(0.025, 0.046, 0);
      g.add(new THREE.Mesh(dome, domeMat));

      // World's Tallest Minaret (265 m)
      const minaret = new THREE.BoxGeometry(0.015, 0.21, 0.015);
      minaret.translate(-0.042, 0.117, 0);
      g.add(new THREE.Mesh(minaret, marbleMat));

      const minaretCap = new THREE.ConeGeometry(0.01, 0.028, 4);
      minaretCap.translate(-0.042, 0.236, 0);
      minaretCap.rotateY(Math.PI / 4);
      g.add(new THREE.Mesh(minaretCap, domeMat));

      return g;
    }
  },
  {
    name: "Nabemba Tower",
    country: "Republic of the Congo",
    lat: -4.2711,
    lon: 15.2861,
    details: "Built: 1986 • Height: 106 m • 30 Floors • Concave Cylindrical Tower on Congo River",
    build: () => {
      const g = new THREE.Group();
      const glassMat = new THREE.MeshStandardMaterial({ color: 0x60a5fa, metalness: 0.7, roughness: 0.2 });
      const concreteMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.6 });

      // Base
      const base = new THREE.CylinderGeometry(0.032, 0.036, 0.014, 20);
      base.translate(0, 0.007, 0);
      g.add(new THREE.Mesh(base, concreteMat));

      // Hourglass / Concave Cylinder Form
      const lowerHalf = new THREE.CylinderGeometry(0.018, 0.024, 0.065, 20);
      lowerHalf.translate(0, 0.0465, 0);
      g.add(new THREE.Mesh(lowerHalf, glassMat));

      const upperHalf = new THREE.CylinderGeometry(0.024, 0.018, 0.065, 20);
      upperHalf.translate(0, 0.1115, 0);
      g.add(new THREE.Mesh(upperHalf, glassMat));

      // Flat Roof Disc
      const roof = new THREE.CylinderGeometry(0.025, 0.025, 0.006, 20);
      roof.translate(0, 0.147, 0);
      g.add(new THREE.Mesh(roof, concreteMat));

      return g;
    }
  },
  {
    name: "St. Paul's Cathedral",
    country: "Ivory Coast",
    lat: 5.3302,
    lon: -4.0186,
    details: "Built: 1985 • Height: 70 m • Modernist Cathedral with Soaring Pylon Arch",
    build: () => {
      const g = new THREE.Group();
      const blueRoofMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.4 });
      const concreteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4 });

      // Sweeping triangular tent nave
      const nave = new THREE.ConeGeometry(0.045, 0.042, 3);
      nave.translate(0, 0.021, -0.01);
      g.add(new THREE.Mesh(nave, blueRoofMat));

      // Soaring Modernist Cross Pylon Tower
      const pylon = new THREE.BoxGeometry(0.014, 0.14, 0.014);
      pylon.translate(0, 0.07, 0.025);
      pylon.rotateX(-0.1);
      g.add(new THREE.Mesh(pylon, concreteMat));

      const crossbar = new THREE.BoxGeometry(0.05, 0.01, 0.01);
      crossbar.translate(0, 0.115, 0.03);
      g.add(new THREE.Mesh(crossbar, concreteMat));

      return g;
    }
  },
  {
    name: "Gran Torre Santiago",
    country: "Chile",
    lat: -33.4178,
    lon: -70.6067,
    details: "Built: 2014 • Height: 300 m • 62 Floors • Tallest Skyscraper in South America",
    build: () => {
      const g = new THREE.Group();
      const glassMat = new THREE.MeshStandardMaterial({ color: 0x60a5fa, metalness: 0.9, roughness: 0.1 });
      const podiumMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.5 });

      // Costanera shopping podium
      const podium = new THREE.BoxGeometry(0.08, 0.02, 0.06);
      podium.translate(0, 0.01, 0);
      g.add(new THREE.Mesh(podium, podiumMat));

      // Tapering 300 m Glass Skyscraper
      const tower = new THREE.CylinderGeometry(0.018, 0.032, 0.22, 4);
      tower.translate(0, 0.13, 0);
      tower.rotateY(Math.PI / 4);
      g.add(new THREE.Mesh(tower, glassMat));

      // Open-air crown petals
      const crown = new THREE.CylinderGeometry(0.019, 0.017, 0.02, 4);
      crown.translate(0, 0.25, 0);
      crown.rotateY(Math.PI / 4);
      g.add(new THREE.Mesh(crown, glassMat));

      return g;
    }
  },
  {
    name: "Torre Colpatria",
    country: "Colombia",
    lat: 4.6106,
    lon: -74.0700,
    details: "Built: 1978 • Height: 196 m • 50 Floors • White Octagonal Tower with Rooftop Viewpoint",
    build: () => {
      const g = new THREE.Group();
      const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.25 });
      const blueDeckMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.4 });

      // Base
      const base = new THREE.BoxGeometry(0.05, 0.015, 0.05);
      base.translate(0, 0.0075, 0);
      g.add(new THREE.Mesh(base, whiteMat));

      // Slender Octagonal Fluted Tower Shaft
      const tower = new THREE.CylinderGeometry(0.022, 0.022, 0.18, 8);
      tower.translate(0, 0.105, 0);
      g.add(new THREE.Mesh(tower, whiteMat));

      // Rooftop Viewpoint Platform
      const viewpoint = new THREE.CylinderGeometry(0.024, 0.024, 0.008, 8);
      viewpoint.translate(0, 0.199, 0);
      g.add(new THREE.Mesh(viewpoint, blueDeckMat));

      return g;
    }
  },
  {
    name: "Cathedral of Lima",
    country: "Peru",
    lat: -12.0469,
    lon: -77.0305,
    details: "Built: 1797 • Height: 48 m • Historic Spanish Colonial Plaza Mayor Cathedral",
    build: () => {
      const g = new THREE.Group();
      const ochreMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.75 });
      const darkMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 });

      // Plinth and central nave
      const nave = new THREE.BoxGeometry(0.088, 0.038, 0.055);
      nave.translate(0, 0.019, 0);
      g.add(new THREE.Mesh(nave, ochreMat));

      // Twin Neoclassical Bell Towers
      [-0.036, 0.036].forEach(x => {
        const tower = new THREE.BoxGeometry(0.018, 0.075, 0.018);
        tower.translate(x, 0.0475, 0.022);
        g.add(new THREE.Mesh(tower, ochreMat));

        const spire = new THREE.ConeGeometry(0.012, 0.028, 8);
        spire.translate(x, 0.099, 0.022);
        g.add(new THREE.Mesh(spire, darkMat));
      });

      return g;
    }
  },
  {
    name: "Parque Central Complex",
    country: "Venezuela",
    lat: 10.4996,
    lon: -66.9038,
    details: "Built: 1979 • Height: 225 m • 59 Floors • Iconic Octagonal Twin Towers",
    build: () => {
      const g = new THREE.Group();
      const towerMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, metalness: 0.5, roughness: 0.4 });
      const podiumMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.6 });

      // Megastructure podium
      const podium = new THREE.BoxGeometry(0.10, 0.018, 0.06);
      podium.translate(0, 0.009, 0);
      g.add(new THREE.Mesh(podium, podiumMat));

      // Twin Octagonal Towers (East & West)
      [-0.026, 0.026].forEach(x => {
        const tower = new THREE.CylinderGeometry(0.016, 0.016, 0.17, 8);
        tower.translate(x, 0.103, 0);
        g.add(new THREE.Mesh(tower, towerMat));

        const antenna = new THREE.CylinderGeometry(0.0015, 0.003, 0.04, 4);
        antenna.translate(x, 0.208, 0);
        g.add(new THREE.Mesh(antenna, towerMat));
      });

      return g;
    }

  },
  {

    name: "Taipei 101",
    country: "Taiwan",
    lat: 25.0338,
    lon: 121.5645,
    details: "Built: 2004 • Height: 508 m • 101 Floors • Pagoda-style 8-Tiered Megastructure",
    build: () => {
      const g = new THREE.Group();
      const glassMat = new THREE.MeshStandardMaterial({ color: 0x2dd4bf, metalness: 0.8, roughness: 0.2 }); // Greenish blue reflective tint
      const steelMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.6, roughness: 0.3 });

      // Base Podium (slanted foundation)
      const base = new THREE.CylinderGeometry(0.026, 0.032, 0.045, 4);
      base.translate(0, 0.0225, 0);
      base.rotateY(Math.PI / 4);
      g.add(new THREE.Mesh(base, steelMat));

      // 8 Inverted Trapezoid Tiers (Pagoda modules)
      for (let i = 0; i < 8; i++) {
        const yOffset = 0.045 + i * 0.019;
        const segment = new THREE.CylinderGeometry(0.024 - i * 0.0006, 0.017 - i * 0.0006, 0.019, 4);
        segment.translate(0, yOffset + 0.0095, 0);
        segment.rotateY(Math.PI / 4);
        g.add(new THREE.Mesh(segment, glassMat));

        // Tier joint ring
        const belt = new THREE.BoxGeometry(0.028 - i * 0.0008, 0.002, 0.028 - i * 0.0008);
        belt.translate(0, yOffset + 0.019, 0);
        g.add(new THREE.Mesh(belt, steelMat));
      }

      // Upper Mechanical Floors & Pinnacle
      const crown = new THREE.CylinderGeometry(0.010, 0.016, 0.025, 4);
      crown.translate(0, 0.21, 0);
      crown.rotateY(Math.PI / 4);
      g.add(new THREE.Mesh(crown, glassMat));

      // Spire / Mast
      const spire = new THREE.CylinderGeometry(0.0015, 0.004, 0.065, 6);
      spire.translate(0, 0.2525, 0);
      g.add(new THREE.Mesh(spire, steelMat));

      return g;
    }
  },
  {
    name: "Eureka Tower",
    country: "Australia",
    lat: -37.8216,
    lon: 144.9647,
    details: "Built: 2006 • Height: 297 m • 91 Floors • Golden Crown & Red Eureka Stockade Stripe",
    build: () => {
      const g = new THREE.Group();
      const blueGlass = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, metalness: 0.85, roughness: 0.2 });
      const goldCrownMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.95, roughness: 0.1 });
      const redStripeMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.4 });
      const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.5 });

      // Podium / Base
      const podium = new THREE.BoxGeometry(0.038, 0.02, 0.038);
      podium.translate(0, 0.01, 0);
      g.add(new THREE.Mesh(podium, whiteMat));

      // Main Slender Blue-Glass Shaft
      const tower = new THREE.BoxGeometry(0.026, 0.165, 0.026);
      tower.translate(0, 0.1025, 0);
      g.add(new THREE.Mesh(tower, blueGlass));

      // Iconic 24k Gold-Plated Top Floors (top 10 levels)
      const goldCrown = new THREE.BoxGeometry(0.0262, 0.038, 0.0262);
      goldCrown.translate(0, 0.194, 0);
      g.add(new THREE.Mesh(goldCrown, goldCrownMat));

      // Asymmetric Stepped Blade Cutout
      const blade = new THREE.BoxGeometry(0.008, 0.045, 0.0264);
      blade.translate(0.009, 0.198, 0);
      g.add(new THREE.Mesh(blade, whiteMat));

      // Red Stripe (commemorating the Eureka Stockade rebellion)
      const redStripe = new THREE.BoxGeometry(0.003, 0.14, 0.0266);
      redStripe.translate(0.012, 0.115, 0);
      g.add(new THREE.Mesh(redStripe, redStripeMat));

      return g;
    }
  },
  {
    name: "Marina Bay Sands",
    country: "Singapore",
    lat: 1.2838,
    lon: 103.8591,
    details: "Built: 2010 • Height: 207 m • 57 Floors • Triple Curved Towers with SkyPark Cantilever",
    build: () => {
      const g = new THREE.Group();
      const towerMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.8, roughness: 0.2 });
      const skyParkMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4 });
      const poolMat = new THREE.MeshStandardMaterial({ color: 0x06b6d4, metalness: 0.9, roughness: 0.1 });

      // Shared ground platform
      const base = new THREE.BoxGeometry(0.12, 0.008, 0.045);
      base.translate(0, 0.004, 0);
      g.add(new THREE.Mesh(base, skyParkMat));

      // 3 Curved Profile Towers (West side straight, East side splayed)
      [-0.036, 0.0, 0.036].forEach(x => {
        // Vertical/Straight leg
        const leg1 = new THREE.BoxGeometry(0.012, 0.12, 0.012);
        leg1.translate(x, 0.065, -0.005);
        g.add(new THREE.Mesh(leg1, towerMat));

        // Angled/Splayed leg joining at mid-height
        const leg2 = new THREE.BoxGeometry(0.011, 0.075, 0.01);
        leg2.translate(x, 0.042, 0.007);
        leg2.rotateX(0.18);
        g.add(new THREE.Mesh(leg2, towerMat));
      });

      // Continuous SkyPark "Ship" Hull bridging all 3 towers
      const skyPark = new THREE.BoxGeometry(0.118, 0.01, 0.026);
      skyPark.translate(0, 0.128, 0);
      g.add(new THREE.Mesh(skyPark, skyParkMat));

      // Curved North Cantilever Nose (extends 67 m out over Tower 1)
      const cantilever = new THREE.ConeGeometry(0.013, 0.032, 4);
      cantilever.translate(-0.065, 0.128, 0);
      cantilever.rotateZ(Math.PI / 2);
      g.add(new THREE.Mesh(cantilever, skyParkMat));

      // Rooftop Infinity Pool Strip
      const pool = new THREE.BoxGeometry(0.08, 0.002, 0.009);
      pool.translate(0.005, 0.134, -0.004);
      g.add(new THREE.Mesh(pool, poolMat));

      return g;
    }
  },



];


