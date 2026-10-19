
function populateCityList() {
  const container = document.getElementById('city-list-container');
  const continentContainer = document.getElementById('continent-toggle-container');
  if (!container || !continentContainer) return;

  const continents = ['N. America', 'S. America', 'Europe', 'Asia', 'Africa', 'Oceania'];

  continentContainer.innerHTML = continents.map(c => {
    const isActive = c === activeContinent;
    const btnClass = isActive
      ? 'py-1.5 px-2 rounded-lg font-medium transition-all bg-blue-600/50 text-white border border-blue-400/40 text-center truncate'
      : 'py-1.5 px-2 rounded-lg font-medium transition-all text-slate-400 hover:text-slate-200 border border-transparent text-center truncate';
    return `<button class="continent-btn ${btnClass}" data-continent="${c}">${c}</button>`;
  }).join('');

  continentContainer.querySelectorAll('.continent-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      activeContinent = e.currentTarget.getAttribute('data-continent');
      populateCityList();
    });
  });

  const cities = (typeof MAJOR_CITIES !== 'undefined' ? MAJOR_CITIES[activeContinent] : []) || [];
  container.innerHTML = cities.map(city => `
    <div class="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 hover:bg-slate-800/80 cursor-pointer flex items-center justify-between transition-colors city-item" data-lat="${city.lat}" data-lon="${city.lon}">
      <div class="flex items-center gap-2.5 min-w-0">
        <i class="fa-solid fa-location-dot text-red-400 shrink-0"></i>
        <span class="text-xs font-medium text-slate-200 truncate">${city.name}, ${city.country}</span>
      </div>
      <i class="fa-solid fa-chevron-right text-[10px] text-slate-500 shrink-0 ml-1"></i>
    </div>
  `).join('');

  container.querySelectorAll('.city-item').forEach(item => {
    item.addEventListener('click', () => {
      const lat = parseFloat(item.getAttribute('data-lat'));
      const lon = parseFloat(item.getAttribute('data-lon'));

      // Auto-switch back to Earth if clicking a city while looking at another planet
      if (currentPlanet !== 'earth' && typeof setPlanet === 'function') {
        setPlanet('earth');
      }

      activeUserLocation = { lat, lon };
      isLocationFetched = true;
      if (userPinGroup) userPinGroup.visible = true;
      updateLocationPin(lat, lon);
      flyToPosition(lat, lon);

      document.getElementById('city-list-modal').classList.add('hidden');
    });
  });
}

function createCountryColorsMesh(geoJsonData, globeRadius = 5.0) {
  const canvas = document.createElement('canvas');
  canvas.width = 2048; canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  const palette = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899'];
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  function lonToX(lon) { return ((lon + 180) / 360) * canvas.width; }
  function latToY(lat) { return ((90 - lat) / 180) * canvas.height; }
  if (geoJsonData && geoJsonData.features) {
    geoJsonData.features.forEach((feature, idx) => {
      const rawColor = getPropertyCaseInsensitive(feature.properties, 'mapcolor7') ||
                       getPropertyCaseInsensitive(feature.properties, 'map_color7') ||
                       getPropertyCaseInsensitive(feature.properties, 'mapcolor');
      const colorNum = parseInt(rawColor, 10);
      const fillColor = (!isNaN(colorNum) && colorNum >= 1 && colorNum <= 7) ? palette[colorNum - 1] : palette[idx % 7];
      ctx.fillStyle = fillColor;
      const geom = feature.geometry;
      if (!geom) return;
      let polygons = [];
      if (geom.type === 'Polygon') polygons = [geom.coordinates];
      else if (geom.type === 'MultiPolygon') polygons = geom.coordinates;
      polygons.forEach((polyCoords) => {
        ctx.beginPath();
        polyCoords.forEach((ring) => {
          if (!ring || ring.length === 0) return;
          ctx.moveTo(lonToX(ring[0][0]), latToY(ring[0][1]));
          for (let i = 1; i < ring.length; i++) {
            const prevLon = ring[i - 1][0];
            const currLon = ring[i][0];
            if (Math.abs(currLon - prevLon) < 180) ctx.lineTo(lonToX(currLon), latToY(ring[i][1]));
            else ctx.moveTo(lonToX(currLon), latToY(ring[i][1]));
          }
          ctx.closePath();
        });
        ctx.fill('evenodd');
      });
    });
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  const colorGeometry = new THREE.SphereGeometry(globeRadius * 1.0015, 64, 64);
  const colorMaterial = new THREE.MeshBasicMaterial({ map: texture, transparent: true, opacity: 0.65, depthWrite: false });
  return new THREE.Mesh(colorGeometry, colorMaterial);
}

function createStateBordersMesh(geoJsonData, globeRadius = 5.0) {
  const borderRadius = globeRadius * 1.0026;
  const positions = [];
  if (!geoJsonData || !geoJsonData.features) return null;
  geoJsonData.features.forEach((feature) => {
    const { geometry } = feature;
    if (!geometry) return;
    let rings = [];
    if (geometry.type === 'Polygon') rings = geometry.coordinates;
    else if (geometry.type === 'MultiPolygon') rings = geometry.coordinates.flat(1);
    rings.forEach((ring) => {
      for (let i = 0; i < ring.length - 1; i++) {
        const [lng1, lat1] = ring[i];
        const [lng2, lat2] = ring[i + 1];
        const v1 = latLonToVector3(lat1, lng1, borderRadius);
        const v2 = latLonToVector3(lat2, lng2, borderRadius);
        positions.push(v1.x, v1.y, v1.z);
        positions.push(v2.x, v2.y, v2.z);
      }
    });
  });
  const borderGeometry = new THREE.BufferGeometry();
  borderGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  const borderMaterial = new THREE.LineBasicMaterial({ color: 0xef4444, transparent: true, opacity: 0.85, depthTest: true, depthWrite: false });
  const mesh = new THREE.LineSegments(borderGeometry, borderMaterial);
  mesh.renderOrder = 1; 
  return mesh;
}

function updateStateBordersVisibility() {
  const chk = document.getElementById('chk-state-borders');
  const isChecked = chk ? chk.checked : false;
  if (isChecked && currentPlanet === 'earth') {
    if (!stateBordersMesh && typeof createStateBordersMesh === 'function' && typeof stateprovGeoData !== 'undefined') {
      stateBordersMesh = createStateBordersMesh(stateprovGeoData);
      if (stateBordersMesh) globeGroup.add(stateBordersMesh);
    }
    if (stateBordersMesh) stateBordersMesh.visible = true;
  } else {
    if (stateBordersMesh) stateBordersMesh.visible = false;
  }
}

function updateCountryBordersVisibility() {
const chk = document.getElementById('chk-country-borders');
const isChecked = chk ? chk.checked : false;
if (isChecked && currentPlanet === 'earth') {
if (!countryBordersMesh && typeof createCountryBordersMesh === 'function' && typeof countryGeoData !== 'undefined') {
countryBordersMesh = createCountryBordersMesh(countryGeoData);
if (countryBordersMesh) globeGroup.add(countryBordersMesh);
}
if (countryBordersMesh) countryBordersMesh.visible = true;
} else {
if (countryBordersMesh) countryBordersMesh.visible = false;
}
}

function updateCountryColorsVisibility() {
const chk = document.getElementById('chk-country-7-colors');
const isChecked = chk ? chk.checked : false;
if (isChecked && currentPlanet === 'earth') {
if (!countryColorsMesh && typeof createCountryColorsMesh === 'function' && typeof countryGeoData !== 'undefined') {
countryColorsMesh = createCountryColorsMesh(countryGeoData);
if (countryColorsMesh) globeGroup.add(countryColorsMesh);
}
if (countryColorsMesh) countryColorsMesh.visible = true;
} else {
if (countryColorsMesh) countryColorsMesh.visible = false;
}
}

function initCountryHoverMesh(globeRadius = 5.0) {
  hoverCanvas = document.createElement('canvas');
  hoverCanvas.width = 1024; hoverCanvas.height = 512;
  hoverCtx = hoverCanvas.getContext('2d');
  hoverTexture = new THREE.CanvasTexture(hoverCanvas);
  const hoverGeom = new THREE.SphereGeometry(globeRadius * 1.002, 64, 64);
  const hoverMat = new THREE.MeshBasicMaterial({ map: hoverTexture, transparent: true, opacity: 0.85, depthWrite: false });
  countryHoverMesh = new THREE.Mesh(hoverGeom, hoverMat);
  countryHoverMesh.visible = false;
  globeGroup.add(countryHoverMesh);
}

function drawCountryHighlight(feature) {
  if (!hoverCtx || !hoverCanvas || !hoverTexture) return;
  hoverCtx.clearRect(0, 0, hoverCanvas.width, hoverCanvas.height);
  if (!feature || !feature.geometry) {
    hoverTexture.needsUpdate = true;
    if (countryHoverMesh) countryHoverMesh.visible = false;
    return;
  }
  function lonToX(lon) { return ((lon + 180) / 360) * hoverCanvas.width; }
  function latToY(lat) { return ((90 - lat) / 180) * hoverCanvas.height; }
  if (feature._isState) {
    hoverCtx.fillStyle = '#7f1d1d'; hoverCtx.strokeStyle = '#450a0a'; hoverCtx.lineWidth = 2.5;
    if (countryHoverMesh && countryHoverMesh.material) countryHoverMesh.material.opacity = 0.95;
  } else {
    hoverCtx.fillStyle = 'rgba(139, 69, 19, 0.75)'; hoverCtx.strokeStyle = 'rgba(139, 69, 19, 0.95)'; hoverCtx.lineWidth = 1.5;
    if (countryHoverMesh && countryHoverMesh.material) countryHoverMesh.material.opacity = 0.85;
  }
  const geom = feature.geometry;
  let polygons = [];
  if (geom.type === 'Polygon') polygons = [geom.coordinates];
  else if (geom.type === 'MultiPolygon') polygons = geom.coordinates;
  polygons.forEach((polyCoords) => {
    hoverCtx.beginPath();
    polyCoords.forEach((ring) => {
      if (!ring || ring.length === 0) return;
      hoverCtx.moveTo(lonToX(ring[0][0]), latToY(ring[0][1]));
      for (let i = 1; i < ring.length; i++) {
        const prevLon = ring[i - 1][0];
        const currLon = ring[i][0];
        if (Math.abs(currLon - prevLon) < 180) hoverCtx.lineTo(lonToX(currLon), latToY(ring[i][1]));
        else hoverCtx.moveTo(lonToX(currLon), latToY(ring[i][1]));
      }
      hoverCtx.closePath();
    });
    hoverCtx.fill('evenodd'); hoverCtx.stroke();
  });
  hoverTexture.needsUpdate = true;
  if (countryHoverMesh) countryHoverMesh.visible = true;
}

function setLandmarksRenderOrder(group) {
  if (!group) return;
  group.renderOrder = 10;
  group.traverse((child) => {
    if (child.isMesh || child.isSprite || child.isLine || child.isPoints || child.isGroup) {
      child.renderOrder = 10;
    }
  });
}


function updateLandmarksVisibility() {
  const chk = document.getElementById('chk-landmarks');
  const isChecked = chk ? chk.checked : false;

  // 1. Earth Landmarks
  if (currentPlanet === 'earth') {
    if (typeof lunarLandersGroup !== 'undefined' && lunarLandersGroup) lunarLandersGroup.visible = false;
    if (typeof marsLandersGroup !== 'undefined' && marsLandersGroup) marsLandersGroup.visible = false;
    if (typeof venusLandersGroup !== 'undefined' && venusLandersGroup) venusLandersGroup.visible = false;

    if (isChecked) {
      if (!landmarksMeshGroup && typeof createLandmarksGroup === 'function') {
        landmarksMeshGroup = createLandmarksGroup(5.0);
        if (landmarksMeshGroup) {
          setLandmarksRenderOrder(landmarksMeshGroup);
          globeGroup.add(landmarksMeshGroup);
        }
      }
      if (landmarksMeshGroup) {
        setLandmarksRenderOrder(landmarksMeshGroup);
        landmarksMeshGroup.visible = true;
      }
    } else if (landmarksMeshGroup) {
      landmarksMeshGroup.visible = false;
    }
  } 
  // 2. Moon Landing Sites
  else if (currentPlanet === 'moon') {
    if (landmarksMeshGroup) landmarksMeshGroup.visible = false;
    if (typeof marsLandersGroup !== 'undefined' && marsLandersGroup) marsLandersGroup.visible = false;
    if (typeof venusLandersGroup !== 'undefined' && venusLandersGroup) venusLandersGroup.visible = false;

    if (isChecked) {
      if (!lunarLandersGroup && typeof createLunarLandersGroup === 'function') {
        lunarLandersGroup = createLunarLandersGroup(5.0);
        if (lunarLandersGroup) globeGroup.add(lunarLandersGroup);
      }
      if (lunarLandersGroup) lunarLandersGroup.visible = true;
    } else if (lunarLandersGroup) {
      lunarLandersGroup.visible = false;
    }
  }
  // 3. Mars Landing Sites
  else if (currentPlanet === 'mars') {
    if (landmarksMeshGroup) landmarksMeshGroup.visible = false;
    if (typeof lunarLandersGroup !== 'undefined' && lunarLandersGroup) lunarLandersGroup.visible = false;
    if (typeof venusLandersGroup !== 'undefined' && venusLandersGroup) venusLandersGroup.visible = false;

    if (isChecked) {
      if (!marsLandersGroup && typeof createMarsLandersGroup === 'function') {
        marsLandersGroup = createMarsLandersGroup(5.0);
        if (marsLandersGroup) globeGroup.add(marsLandersGroup);
      }
      if (marsLandersGroup) marsLandersGroup.visible = true;
    } else if (marsLandersGroup) {
      marsLandersGroup.visible = false;
    }
  }
  // 4. Venus Landing Sites (Venera & Vega)
  else if (currentPlanet === 'venus') {
    if (landmarksMeshGroup) landmarksMeshGroup.visible = false;
    if (typeof lunarLandersGroup !== 'undefined' && lunarLandersGroup) lunarLandersGroup.visible = false;
    if (typeof marsLandersGroup !== 'undefined' && marsLandersGroup) marsLandersGroup.visible = false;

    if (isChecked) {
      if (!venusLandersGroup && typeof createVenusLandersGroup === 'function') {
        venusLandersGroup = createVenusLandersGroup(5.0);
        if (venusLandersGroup) globeGroup.add(venusLandersGroup);
      }
      if (venusLandersGroup) venusLandersGroup.visible = true;
    } else if (venusLandersGroup) {
      venusLandersGroup.visible = false;
    }
  }
  // 5. All Other Planets
  else {
    if (landmarksMeshGroup) landmarksMeshGroup.visible = false;
    if (typeof lunarLandersGroup !== 'undefined' && lunarLandersGroup) lunarLandersGroup.visible = false;
    if (typeof marsLandersGroup !== 'undefined' && marsLandersGroup) marsLandersGroup.visible = false;
    if (typeof venusLandersGroup !== 'undefined' && venusLandersGroup) venusLandersGroup.visible = false;
  }
}

function getPropertyCaseInsensitive(props, target) {
  if (!props) return null;
  const lower = target.toLowerCase();
  for (let key in props) {
    if (key.toLowerCase() === lower) return props[key];
  }
  return null;
}

function formatFlagEmoji(val) {
  if (!val) return '';
  val = String(val).trim();
  if (/^[a-zA-Z]{2}$/.test(val)) {
    const codePoints = val.toUpperCase().split('').map(c => 127397 + c.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  }
  return val;
}

function createCountryBordersMesh(geoJsonData, globeRadius = 5.0) {
  const borderRadius = globeRadius * 1.0032; 
  const positions = [];
  geoJsonData.features.forEach((feature) => {
    const { geometry } = feature;
    if (!geometry) return;
    let rings = [];
    if (geometry.type === 'Polygon') {
      rings = geometry.coordinates;
    } else if (geometry.type === 'MultiPolygon') {
      rings = geometry.coordinates.flat(1);
    }
    rings.forEach((ring) => {
      for (let i = 0; i < ring.length - 1; i++) {
        const [lng1, lat1] = ring[i];
        const [lng2, lat2] = ring[i + 1];
        const v1 = latLonToVector3(lat1, lng1, borderRadius);
        const v2 = latLonToVector3(lat2, lng2, borderRadius);
        positions.push(v1.x, v1.y, v1.z);
        positions.push(v2.x, v2.y, v2.z);
      }
    });
  });
  const borderGeometry = new THREE.BufferGeometry();
  borderGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  const borderMaterial = new THREE.LineBasicMaterial({
    color: 0xffffff, transparent: true, opacity: 0.75, depthTest: true, depthWrite: false
  });
  const mesh = new THREE.LineSegments(borderGeometry, borderMaterial);
  mesh.renderOrder = 2; 
  return mesh;
}

function getFeatureBBox(feature) {
  if (feature._bbox) return feature._bbox;
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  function checkCoord(coord) {
    const [x, y] = coord;
    if (x < minX) minX = x; if (x > maxX) maxX = x;
    if (y < minY) minY = y; if (y > maxY) maxY = y;
  }
  function processRings(rings) { rings.forEach(ring => ring.forEach(checkCoord)); }
  const geom = feature.geometry;
  if (geom) {
    if (geom.type === 'Polygon') processRings(geom.coordinates);
    else if (geom.type === 'MultiPolygon') geom.coordinates.forEach(processRings);
  }
  feature._bbox = [minX, minY, maxX, maxY];
  return feature._bbox;
}

function isBBoxNearPoint(bbox, ptLon, ptLat, threshold) {
  const [minX, minY, maxX, maxY] = bbox;
  if (ptLat < minY - threshold || ptLat > maxY + threshold) return false;
  if (ptLon >= minX && ptLon <= maxX) return true;
  let d1 = Math.abs(ptLon - minX); if (d1 > 180) d1 = 360 - d1;
  let d2 = Math.abs(ptLon - maxX); if (d2 > 180) d2 = 360 - d2;
  return Math.min(d1, d2) <= threshold;
}

function getDistanceToFeature(pt, feature) {
  const [ptLon, ptLat] = pt;
  const geom = feature.geometry;
  if (!geom) return Infinity;
  let minDistSq = Infinity;
  const rad = Math.PI / 180;
  const cosLat = Math.cos(ptLat * rad);
  function checkRing(ring) {
    if (!ring || ring.length === 0) return;
    const step = ring.length > 50 ? Math.ceil(ring.length / 50) : 1;
    for (let i = 0; i < ring.length; i += step) {
      const vLon = ring[i][0], vLat = ring[i][1];
      const dLat = ptLat - vLat;
      let dLon = Math.abs(ptLon - vLon); if (dLon > 180) dLon = 360 - dLon;
      const dLonScaled = dLon * cosLat;
      const distSq = dLat * dLat + dLonScaled * dLonScaled;
      if (distSq < minDistSq) minDistSq = distSq;
    }
  }
  if (geom.type === 'Polygon') geom.coordinates.forEach(checkRing);
  else if (geom.type === 'MultiPolygon') geom.coordinates.forEach(poly => poly.forEach(checkRing));
  return Math.sqrt(minDistSq);
}

function isPointInRing(pt, ring) {
  const [x, y] = pt; let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1], xj = ring[j][0], yj = ring[j][1];
    const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

function isPointInFeature(pt, feature) {
  const bbox = getFeatureBBox(feature);
  if (pt[0] < bbox[0] || pt[0] > bbox[2] || pt[1] < bbox[1] || pt[1] > bbox[3]) return false;
  const geom = feature.geometry;
  if (!geom) return false;
  if (geom.type === 'Polygon') {
    if (!isPointInRing(pt, geom.coordinates[0])) return false;
    for (let i = 1; i < geom.coordinates.length; i++) {
      if (isPointInRing(pt, geom.coordinates[i])) return false;
    }
    return true;
  } else if (geom.type === 'MultiPolygon') {
    for (let poly of geom.coordinates) {
      if (isPointInRing(pt, poly[0])) {
        let inHole = false;
        for (let i = 1; i < poly.length; i++) { if (isPointInRing(pt, poly[i])) { inHole = true; break; } }
        if (!inHole) return true;
      }
    }
  }
  return false;
}

function findCountryAtLatLng(lat, lon) {
  const geoData = typeof countryGeoData !== 'undefined' ? countryGeoData : null;
  if (!geoData || !geoData.features) return null;
  const pt = [lon, lat];
  for (let feature of geoData.features) { if (isPointInFeature(pt, feature)) return feature; }
  let closestFeature = null, minEffectiveDist = Infinity;
  const DEFAULT_SNAP_RADIUS = 1.6, ISLAND_SNAP_RADIUS = 3.2;
  for (let feature of geoData.features) {
    const bbox = getFeatureBBox(feature);
    const spanX = Math.abs(bbox[2] - bbox[0]), spanY = Math.abs(bbox[3] - bbox[1]);
    const isSmallIsland = (spanX < 6.0 && spanY < 6.0);
    const allowedRadius = isSmallIsland ? ISLAND_SNAP_RADIUS : DEFAULT_SNAP_RADIUS;
    if (!isBBoxNearPoint(bbox, lon, lat, allowedRadius)) continue;
    const dist = getDistanceToFeature(pt, feature);
    if (dist <= allowedRadius) {
      const effectiveDist = isSmallIsland ? dist * 0.75 : dist;
      if (effectiveDist < minEffectiveDist) { minEffectiveDist = effectiveDist; closestFeature = feature; }
    }
  }
  return closestFeature;
}

function findStateAtLatLng(lat, lon) {
  const geoData = typeof stateprovGeoData !== 'undefined' ? stateprovGeoData : null;
  if (!geoData || !geoData.features) return null;
  const pt = [lon, lat];
  for (let feature of geoData.features) {
    if (isPointInFeature(pt, feature)) { feature._isState = true; return feature; }
  }
  let closestFeature = null, minEffectiveDist = Infinity;
  for (let feature of geoData.features) {
    const bbox = getFeatureBBox(feature);
    if (!isBBoxNearPoint(bbox, lon, lat, 1.4)) continue;
    const dist = getDistanceToFeature(pt, feature);
    if (dist <= 1.4 && dist < minEffectiveDist) { minEffectiveDist = dist; closestFeature = feature; }
  }
  if (closestFeature) closestFeature._isState = true;
  return closestFeature;
}

function formatPopulation(val) {
  if (val === null || val === undefined || isNaN(val)) return '';
  const num = Number(val);
  if (num >= 1e6) return Math.round(num / 1e6).toLocaleString() + ' million';
  if (num >= 1e3) return Math.round(num / 1e3).toLocaleString() + ' thousand';
  return num.toLocaleString();
}




function handleCountryHover(event) {
  const chkCountryBorders = document.getElementById('chk-country-borders');
  const chkStateBorders = document.getElementById('chk-state-borders');
  const chkCountry7Colors = document.getElementById('chk-country-7-colors');
  const chkLandmarks = document.getElementById('chk-landmarks');
  const chkLandingSites = document.getElementById('chk-landing-sites');
  const chkCelestial = document.getElementById('chk-celestial');
  const chkPlanets = document.getElementById('chk-planets');

  const isEarth = (currentPlanet === 'earth');
  const countryBordersActive = isEarth && (chkCountryBorders ? chkCountryBorders.checked : false);
  const stateBordersActive = isEarth && (chkStateBorders ? chkStateBorders.checked : false);
  const countryColorsActive = isEarth && (chkCountry7Colors ? chkCountry7Colors.checked : false);
  const celestialActive = chkCelestial ? chkCelestial.checked : true;
  const planetsActive = chkPlanets ? chkPlanets.checked : true;
  
  const countryHoverActive = countryBordersActive || stateBordersActive || countryColorsActive;
  const landmarksActive = isEarth && (chkLandmarks ? chkLandmarks.checked : false);
  const isLandingSitesChecked = chkLandingSites ? chkLandingSites.checked : true;

  const tooltip = document.getElementById('country-hover-tooltip');
  const tooltipName = document.getElementById('country-hover-name');
  const tooltipFlag = document.getElementById('country-hover-flag');
  const tooltipDefaultIcon = document.getElementById('country-hover-default-icon');
  const tooltipCategory = document.getElementById('country-hover-category');
  const tooltipPop = document.getElementById('country-hover-pop');

  if (!countryHoverActive && !landmarksActive && !celestialActive && !planetsActive && !isLandingSitesChecked) {
    if (tooltip) tooltip.classList.add('hidden');
    if (hoveredFeature) { hoveredFeature = null; drawCountryHighlight(null); }
    return;
  }

  if (event.target.closest('aside, header, footer, .glass-panel, button, input')) {
    if (tooltip) tooltip.classList.add('hidden');
    if (hoveredFeature) { hoveredFeature = null; drawCountryHighlight(null); }
    return;
  }

  if (!earthMesh || !camera) return;

  raycaster.setFromCamera(mouseVector, camera);
  const intersects = raycaster.intersectObject(earthMesh);

  if (intersects.length > 0) {
    const localP = earthMesh.worldToLocal(intersects[0].point.clone());
    const r = localP.length();
    const phi = Math.acos(Math.max(-1, Math.min(1, localP.y / r)));
    const lat = 90 - (phi * 180 / Math.PI);
    let lng = (Math.atan2(localP.z, -localP.x) * 180 / Math.PI) - 180;
    while (lng < -180) lng += 360;
    while (lng > 180) lng -= 360;

    // --- CELESTIAL SUN & MOON ZENITH POINTS ---
    if (celestialActive) {
      const dLatSun = Math.abs(currentSunLat - lat);
      let dLonSun = Math.abs(currentSunLon - lng);
      if (dLonSun > 180) dLonSun = 360 - dLonSun;

      if (dLatSun < 2.0 && dLonSun < 2.0) {
        if (hoveredFeature) { hoveredFeature = null; drawCountryHighlight(null); }
        tooltipName.textContent = "The Sun";
        if (tooltipFlag) { tooltipFlag.textContent = "☀️"; tooltipFlag.classList.remove('hidden'); }
        if (tooltipDefaultIcon) tooltipDefaultIcon.classList.add('hidden');
        if (tooltipCategory) { tooltipCategory.textContent = "Star • Subsolar Zenith Point"; tooltipCategory.classList.remove('hidden'); }
        if (tooltipPop) { tooltipPop.textContent = `Lat: ${currentSunLat.toFixed(2)}° • Lon: ${currentSunLon.toFixed(2)}°`; tooltipPop.classList.remove('hidden'); }
        tooltip.style.left = `${event.clientX + 16}px`; tooltip.style.top = `${event.clientY - 16}px`;
        tooltip.classList.remove('hidden');
        return;
      }

      if (isEarth) {
        const dLatMoon = Math.abs(currentMoonLat - lat);
        let dLonMoon = Math.abs(currentMoonLon - lng);
        if (dLonMoon > 180) dLonMoon = 360 - dLonMoon;

        if (dLatMoon < 2.0 && dLonMoon < 2.0) {
          if (hoveredFeature) { hoveredFeature = null; drawCountryHighlight(null); }
          const details = typeof getMoonPhaseDetails === 'function' ? getMoonPhaseDetails(currentSimTime) : null;
          tooltipName.textContent = "The Moon";
          if (tooltipFlag) { tooltipFlag.textContent = "🌕"; tooltipFlag.classList.remove('hidden'); }
          if (tooltipDefaultIcon) tooltipDefaultIcon.classList.add('hidden');
          if (tooltipCategory) { tooltipCategory.textContent = details ? `Moon • Sub-Lunar Point (${details.phaseName})` : "Moon • Sub-Lunar Point"; tooltipCategory.classList.remove('hidden'); }
          if (tooltipPop) {
            tooltipPop.textContent = details ? `Lat: ${currentMoonLat.toFixed(2)}° • Lon: ${currentMoonLon.toFixed(2)}° • ${details.illumination}% Illum` : `Lat: ${currentMoonLat.toFixed(2)}° • Lon: ${currentMoonLon.toFixed(2)}°`;
            tooltipPop.classList.remove('hidden');
          }
          tooltip.style.left = `${event.clientX + 16}px`; tooltip.style.top = `${event.clientY - 16}px`;
          tooltip.classList.remove('hidden');
          return;
        }
      }
    }

    // --- LUNAR LANDING SITES HOVER (Moon) ---
    if (currentPlanet === 'moon' && typeof findNearbyLunarLander === 'function' && isLandingSitesChecked) {
      const nearbyLander = findNearbyLunarLander(lat, lng, 3.5);
      if (nearbyLander) {
        if (hoveredFeature) { hoveredFeature = null; drawCountryHighlight(null); }
        tooltipName.textContent = nearbyLander.name;
        if (tooltipFlag) { tooltipFlag.textContent = nearbyLander.flag; tooltipFlag.classList.remove('hidden'); }
        if (tooltipDefaultIcon) tooltipDefaultIcon.classList.add('hidden');
        if (tooltipCategory) { 
          tooltipCategory.textContent = `${nearbyLander.category} • Landed: ${nearbyLander.date}`; 
          tooltipCategory.classList.remove('hidden'); 
        }
        if (tooltipPop) { 
          tooltipPop.textContent = `${nearbyLander.site} — ${nearbyLander.details}`; 
          tooltipPop.classList.remove('hidden'); 
        }
        tooltip.style.left = `${event.clientX + 16}px`; 
        tooltip.style.top = `${event.clientY - 16}px`;
        tooltip.classList.remove('hidden');
        return;
      }
    }

    // --- EARTH PIN HOVER (When viewing Moon, Mars, Venus, etc.) ---
    if (!isEarth && earthPinGroup && earthPinGroup.visible && celestialActive) {
      let eLat = 0, eLon = 0;
      if (currentPlanet === 'moon') {
        const nowMs = currentSimTime.getTime();
        const jd2000 = Date.UTC(2000, 0, 1, 12, 0, 0);
        const d = (nowMs - jd2000) / 86400000;
        eLon = -6.29 * Math.sin((134.963 + 13.064993 * d) * (Math.PI / 180));
        eLat = -1.54 * Math.sin((93.272 + 13.229350 * d) * (Math.PI / 180));
      } else if (typeof getSubPlanetaryPoint === 'function') {
        const coords = getSubPlanetaryPoint('earth', currentSimTime);
        if (coords) { eLat = coords.lat; eLon = coords.lon; }
      }

      const dLatEarth = Math.abs(eLat - lat);
      let dLonEarth = Math.abs(eLon - lng);
      if (dLonEarth > 180) dLonEarth = 360 - dLonEarth;

      if (dLatEarth < 2.0 && dLonEarth < 2.0) {
        if (hoveredFeature) { hoveredFeature = null; drawCountryHighlight(null); }
        tooltipName.textContent = "Earth";
        if (tooltipFlag) { tooltipFlag.textContent = "🜨"; tooltipFlag.classList.remove('hidden'); }
        if (tooltipDefaultIcon) tooltipDefaultIcon.classList.add('hidden');
        if (tooltipCategory) { 
          tooltipCategory.textContent = "Terrestrial Planet • Sub-Earth Zenith Point"; 
          tooltipCategory.classList.remove('hidden'); 
        }
        if (tooltipPop) { 
          tooltipPop.textContent = `Lat: ${eLat.toFixed(2)}° • Lon: ${eLon.toFixed(2)}°`; 
          tooltipPop.classList.remove('hidden'); 
        }
        tooltip.style.left = `${event.clientX + 16}px`; 
        tooltip.style.top = `${event.clientY - 16}px`;
        tooltip.classList.remove('hidden');
        return;
      }
    }

    // --- MARS LANDING SITES HOVER (Mars) ---
    if (currentPlanet === 'mars' && typeof findNearbyMarsLander === 'function' && isLandingSitesChecked) {
      const nearbyLander = findNearbyMarsLander(lat, lng, 3.5);
      if (nearbyLander) {
        if (hoveredFeature) { hoveredFeature = null; drawCountryHighlight(null); }
        tooltipName.textContent = nearbyLander.name;
        if (tooltipFlag) { tooltipFlag.textContent = nearbyLander.flag; tooltipFlag.classList.remove('hidden'); }
        if (tooltipDefaultIcon) tooltipDefaultIcon.classList.add('hidden');
        if (tooltipCategory) { 
          tooltipCategory.textContent = `${nearbyLander.category} • Landed: ${nearbyLander.date}`; 
          tooltipCategory.classList.remove('hidden'); 
        }
        if (tooltipPop) { 
          tooltipPop.textContent = `${nearbyLander.site} — ${nearbyLander.details}`; 
          tooltipPop.classList.remove('hidden'); 
        }
        tooltip.style.left = `${event.clientX + 16}px`; 
        tooltip.style.top = `${event.clientY - 16}px`;
        tooltip.classList.remove('hidden');
        return;
      }
    }

    // --- VENUS LANDING SITES HOVER (Venus) ---
    if (currentPlanet === 'venus' && typeof findNearbyVenusLander === 'function' && isLandingSitesChecked) {
      const nearbyLander = findNearbyVenusLander(lat, lng, 3.5);
      if (nearbyLander) {
        if (hoveredFeature) { hoveredFeature = null; drawCountryHighlight(null); }
        tooltipName.textContent = nearbyLander.name;
        if (tooltipFlag) { tooltipFlag.textContent = nearbyLander.flag; tooltipFlag.classList.remove('hidden'); }
        if (tooltipDefaultIcon) tooltipDefaultIcon.classList.add('hidden');
        if (tooltipCategory) { 
          tooltipCategory.textContent = `${nearbyLander.category} • Landed: ${nearbyLander.date}`; 
          tooltipCategory.classList.remove('hidden'); 
        }
        if (tooltipPop) { 
          tooltipPop.textContent = `${nearbyLander.site} — ${nearbyLander.details}`; 
          tooltipPop.classList.remove('hidden'); 
        }
        tooltip.style.left = `${event.clientX + 16}px`; 
        tooltip.style.top = `${event.clientY - 16}px`;
        tooltip.classList.remove('hidden');
        return;
      }
    }

    // --- CROSS-PLANET ZENITH PINS ---
    if (planetsActive && typeof PLANET_CONFIG !== 'undefined' && typeof getSubPlanetaryPoint === 'function') {
      const GAS_GIANTS = ['Jupiter', 'Saturn', 'Uranus', 'Neptune'];

      for (const cfg of PLANET_CONFIG) {
        if (cfg.name === currentPlanet) continue; 
        const coords = getSubPlanetaryPoint(cfg.name, currentSimTime);
        const dLat = Math.abs(coords.lat - lat);
        let dLon = Math.abs(coords.lon - lng);
        if (dLon > 180) dLon = 360 - dLon;

        const isGasGiant = GAS_GIANTS.includes(cfg.name);
        const threshold = isGasGiant ? 1.8 : 1.3;

        if (dLat < threshold && dLon < threshold) {
          if (hoveredFeature) { hoveredFeature = null; drawCountryHighlight(null); }
          tooltipName.textContent = cfg.name;
          if (tooltipFlag) { tooltipFlag.textContent = cfg.icon; tooltipFlag.classList.remove('hidden'); }
          if (tooltipDefaultIcon) tooltipDefaultIcon.classList.add('hidden');
          if (tooltipCategory) { tooltipCategory.textContent = isGasGiant ? "Gas / Ice Giant • Zenith Point" : "Terrestrial Planet • Zenith Point"; tooltipCategory.classList.remove('hidden'); }
          if (tooltipPop) { tooltipPop.textContent = `Lat: ${coords.lat.toFixed(2)}° • Lon: ${coords.lon.toFixed(2)}°`; tooltipPop.classList.remove('hidden'); }
          tooltip.style.left = `${event.clientX + 16}px`; tooltip.style.top = `${event.clientY - 16}px`;
          tooltip.classList.remove('hidden');
          return;
        }
      }
    }

    // --- EARTH LANDMARKS ---
    if (landmarksActive && typeof findNearbyLandmarkOrMountain === 'function') {
      const nearbyPOI = findNearbyLandmarkOrMountain(lat, lng, 3.2);
      if (nearbyPOI) {
        if (hoveredFeature) { hoveredFeature = null; drawCountryHighlight(null); }
        const iconMap = { 'Mountain': '🏔️', 'Bridge': '🌉', 'Waterfall': '🌊', 'Hazard': '☢️', 'Dam': '🧱', 'Landmark': '🏛️' };
        tooltipName.textContent = nearbyPOI.name;
        if (tooltipFlag) { tooltipFlag.textContent = nearbyPOI.icon || iconMap[nearbyPOI.category] || '📍'; tooltipFlag.classList.remove('hidden'); }
        if (tooltipDefaultIcon) tooltipDefaultIcon.classList.add('hidden');
        if (tooltipCategory) { tooltipCategory.textContent = `${nearbyPOI.category} • ${nearbyPOI.country}`; tooltipCategory.classList.remove('hidden'); }
        if (tooltipPop) { tooltipPop.textContent = nearbyPOI.details || ''; tooltipPop.classList.remove('hidden'); }
        tooltip.style.left = `${event.clientX + 16}px`; tooltip.style.top = `${event.clientY - 16}px`;
        tooltip.classList.remove('hidden');
        return;
      }
    }

    // --- US / REGIONAL PROVINCES ---
    if (stateBordersActive && typeof findStateAtLatLng === 'function') {
      const stateFeature = findStateAtLatLng(lat, lng);
      if (stateFeature) {
        if (hoveredFeature !== stateFeature) { hoveredFeature = stateFeature; drawCountryHighlight(stateFeature); }
        const stateName = getPropertyCaseInsensitive(stateFeature.properties, 'name') || 'Unknown State/Province';
        const parentCountry = getPropertyCaseInsensitive(stateFeature.properties, 'admin') || getPropertyCaseInsensitive(stateFeature.properties, 'sov_a3') || '';
        const stateType = getPropertyCaseInsensitive(stateFeature.properties, 'type') || getPropertyCaseInsensitive(stateFeature.properties, 'type_en') || 'State / Province';
        const regionCode = getPropertyCaseInsensitive(stateFeature.properties, 'code') || getPropertyCaseInsensitive(stateFeature.properties, 'postal') || '';
        tooltipName.textContent = stateName;
        if (tooltipFlag) { tooltipFlag.textContent = '📍'; tooltipFlag.classList.remove('hidden'); }
        if (tooltipDefaultIcon) tooltipDefaultIcon.classList.add('hidden');
        if (tooltipCategory) { tooltipCategory.textContent = parentCountry ? `${stateType} • ${parentCountry}` : stateType; tooltipCategory.classList.remove('hidden'); }
        if (tooltipPop) { tooltipPop.textContent = regionCode ? `Region Code: ${regionCode}` : 'Administrative Boundary'; tooltipPop.classList.remove('hidden'); }
        tooltip.style.left = `${event.clientX + 16}px`; tooltip.style.top = `${event.clientY - 16}px`;
        tooltip.classList.remove('hidden');
        return;
      }
    }

    // --- NATIONAL BOUNDARIES & 7-COLOR REGIONS ---
    if (countryBordersActive || countryColorsActive) {
      const feature = findCountryAtLatLng(lat, lng);
      if (feature) {
        feature._isState = false;
        if (hoveredFeature !== feature) { hoveredFeature = feature; drawCountryHighlight(feature); }
        const name = getPropertyCaseInsensitive(feature.properties, 'name') || getPropertyCaseInsensitive(feature.properties, 'admin') || getPropertyCaseInsensitive(feature.properties, 'sovereignt') || 'Unknown Country';
        const flagVal = getPropertyCaseInsensitive(feature.properties, 'flag');
        const popVal = getPropertyCaseInsensitive(feature.properties, 'pop_est');
        const formattedFlag = formatFlagEmoji(flagVal);
        tooltipName.textContent = name;
        if (formattedFlag) {
          if (tooltipFlag) { tooltipFlag.textContent = formattedFlag; tooltipFlag.classList.remove('hidden'); }
          if (tooltipDefaultIcon) tooltipDefaultIcon.classList.add('hidden');
        } else {
          if (tooltipFlag) { tooltipFlag.textContent = ''; tooltipFlag.classList.add('hidden'); }
          if (tooltipDefaultIcon) { tooltipDefaultIcon.className = "fa-solid fa-location-dot text-amber-400"; tooltipDefaultIcon.classList.remove('hidden'); }
        }
        if (tooltipCategory) { tooltipCategory.textContent = "Country / Territory"; tooltipCategory.classList.remove('hidden'); }
        if (tooltipPop) {
          if (popVal !== null && popVal !== undefined) { tooltipPop.textContent = `Population: ${formatPopulation(popVal)}`; tooltipPop.classList.remove('hidden'); } 
          else { tooltipPop.textContent = ''; tooltipPop.classList.add('hidden'); }
        }
        tooltip.style.left = `${event.clientX + 16}px`; tooltip.style.top = `${event.clientY - 16}px`;
        tooltip.classList.remove('hidden');
        return;
      }
    }
  }

  if (hoveredFeature) { hoveredFeature = null; drawCountryHighlight(null); }
  if (tooltip) tooltip.classList.add('hidden');
}



// const: MAJOR_CITIES
// function:createCountryBordersMesh

const MAJOR_CITIES = {
'N. America': [
{ name: 'Chicago', country: 'United States', lat: 41.8781, lon: -87.6298 },
{ name: 'Houston', country: 'United States', lat: 29.7604, lon: -95.3698 },
{ name: 'Los Angeles', country: 'United States', lat: 34.0522, lon: -118.2437 },
{ name: 'New York City', country: 'United States', lat: 40.7128, lon: -74.0060 },
{ name: 'Montreal', country: 'Canada', lat: 45.5017, lon: -73.5673 },
{ name: 'Toronto', country: 'Canada', lat: 43.6532, lon: -79.3832 },
{ name: 'Vancouver', country: 'Canada', lat: 49.2827, lon: -123.1207 },
{ name: 'Mexico City', country: 'Mexico', lat: 19.4326, lon: -99.1332 },
{ name: 'Guadalajara', country: 'Mexico', lat: 20.6597, lon: -103.3496 },
{ name: 'Panama City', country: 'Panama', lat: 8.9824, lon: -79.5199 },
{ name: 'Havana', country: 'Cuba', lat: 23.1136, lon: -82.3666 },
{ name: 'San Jose', country: 'Costa Rica', lat: 9.9281, lon: -84.0907 },
],
'Asia': [
{ name: 'Beijing', country: 'China', lat: 39.9042, lon: 116.4074 },
{ name: 'Shanghai', country: 'China', lat: 31.2304, lon: 121.4737 },
{ name: 'Delhi', country: 'India', lat: 28.6139, lon: 77.2090 },
{ name: 'Mumbai', country: 'India', lat: 19.0760, lon: 72.8777 },
{ name: 'Jakarta', country: 'Indonesia', lat: -6.2088, lon: 106.8456 },
{ name: 'Tokyo', country: 'Japan', lat: 35.6762, lon: 139.6503 },
{ name: 'Manila', country: 'Philippines', lat: 14.5995, lon: 120.9842 },
{ name: 'Riyadh', country: 'Saudi Arabia', lat: 24.7136, lon: 46.6753 },
{ name: 'Seoul', country: 'South Korea', lat: 37.5665, lon: 126.9780 },
{ name: 'Singapore', country: 'Singapore', lat: 1.3521, lon: 103.8198 },
{ name: 'Bangkok', country: 'Thailand', lat: 13.7563, lon: 100.5018 },
{ name: 'Dubai', country: 'United Arab Emirates', lat: 25.2048, lon: 55.2708 },
],
'Africa': [
{ name: 'Algiers', country: 'Algeria', lat: 36.7538, lon: 3.0588 },
{ name: 'Kinshasa', country: 'DR Congo', lat: -4.4419, lon: 15.2663 },
{ name: 'Cairo', country: 'Egypt', lat: 30.0444, lon: 31.2357 },
{ name: 'Addis Ababa', country: 'Ethiopia', lat: 9.0300, lon: 38.7400 },
{ name: 'Accra', country: 'Ghana', lat: 5.6037, lon: -0.1870 },
{ name: 'Nairobi', country: 'Kenya', lat: -1.2921, lon: 36.8219 },
{ name: 'Lagos', country: 'Nigeria', lat: 6.5244, lon: 3.3792 },
{ name: 'Casablanca', country: 'Morocco', lat: 33.5731, lon: -7.5898 },
{ name: 'Dakar', country: 'Senegal', lat: 14.7167, lon: -17.4677 },
{ name: 'Cape Town', country: 'South Africa', lat: -33.9249, lon: 18.4241 },
{ name: 'Johannesburg', country: 'South Africa', lat: -26.2041, lon: 28.0473 },
{ name: 'Dar es Salaam', country: 'Tanzania', lat: -6.7924, lon: 39.2083 },
],
'S. America': [
{ name: 'Buenos Aires', country: 'Argentina', lat: -34.6037, lon: -58.3816 },
{ name: 'Rio de Janeiro', country: 'Brazil', lat: -22.9068, lon: -43.1729 },
{ name: 'São Paulo', country: 'Brazil', lat: -23.5505, lon: -46.6333 },
{ name: 'La Paz', country: 'Bolivia', lat: -16.4897, lon: -68.1193 },
{ name: 'Santiago', country: 'Chile', lat: -33.4489, lon: -70.6693 },
{ name: 'Bogotá', country: 'Colombia', lat: 4.7110, lon: -74.0721 },
{ name: 'Medellín', country: 'Colombia', lat: 6.2442, lon: -75.5812 },
{ name: 'Quito', country: 'Ecuador', lat: -0.1807, lon: -78.4678 },
{ name: 'Asunción', country: 'Paraguay', lat: -25.2637, lon: -57.5759 },
{ name: 'Lima', country: 'Peru', lat: -12.0463, lon: -77.0428 },
{ name: 'Montevideo', country: 'Uruguay', lat: -34.9011, lon: -56.1645 },
{ name: 'Caracas', country: 'Venezuela', lat: 10.4806, lon: -66.9036 },
],
'Europe': [
{ name: 'Vienna', country: 'Austria', lat: 48.2082, lon: 16.3738 },
{ name: 'Paris', country: 'France', lat: 48.8566, lon: 2.3522 },
{ name: 'Berlin', country: 'Germany', lat: 52.5200, lon: 13.4050 },
{ name: 'Athens', country: 'Greece', lat: 37.9838, lon: 23.7275 },
{ name: 'Istanbul', country: 'Turkey', lat: 41.0082, lon: 28.9784 },
{ name: 'Rome', country: 'Italy', lat: 41.9028, lon: 12.4964 },
{ name: 'Amsterdam', country: 'Netherlands', lat: 52.3676, lon: 4.9041 },
{ name: 'Warsaw', country: 'Poland', lat: 52.2297, lon: 21.0122 },
{ name: 'Lisbon', country: 'Portugal', lat: 38.7223, lon: -9.1393 },
{ name: 'Moscow', country: 'Russia', lat: 55.7558, lon: 37.6173 },
{ name: 'Madrid', country: 'Spain', lat: 40.4168, lon: -3.7038 },
{ name: 'London', country: 'United Kingdom', lat: 51.5074, lon: -0.1278 },
],
'Oceania': [
{ name: 'Adelaide', country: 'Australia', lat: -34.9285, lon: 138.6007 },
{ name: 'Brisbane', country: 'Australia', lat: -27.4705, lon: 153.0260 },
{ name: 'Melbourne', country: 'Australia', lat: -37.8136, lon: 144.9631 },
{ name: 'Perth', country: 'Australia', lat: -31.9505, lon: 115.8605 },
{ name: 'Sydney', country: 'Australia', lat: -33.8688, lon: 151.2093 },
{ name: 'Nouméa', country: 'New Caledonia', lat: -22.2711, lon: 166.4416 },
{ name: 'Auckland', country: 'New Zealand', lat: -36.8485, lon: 174.7633 },
{ name: 'Wellington', country: 'New Zealand', lat: -41.2924, lon: 174.7787 },
{ name: 'Suva', country: 'Fiji', lat: -18.1416, lon: 178.4419 },
{ name: 'Christchurch', country: 'New Zealand', lat: -43.5321, lon: 172.6362 },
{ name: 'Port Moresby', country: 'Papua New Guinea', lat: -9.4438, lon: 147.1803 },
{ name: 'Honolulu', country: 'United States', lat: 21.3069, lon: -157.8583 },
]
};



