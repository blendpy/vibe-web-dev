/**
 * ==============================================================
 * DYNAMIC INFOGRAPHIC VIEWERS (Hover & Fullscreen)
 * ==============================================================
 */
function initInfographicViewers() {
  const hoverViewer = document.createElement('div');
  hoverViewer.id = 'infographic-hover-viewer';
  hoverViewer.className = 'fixed top-6 left-6 bottom-6 right-[420px] z-[100] hidden items-center justify-center bg-black/80 backdrop-blur-md rounded-2xl border border-slate-700/50 shadow-2xl transition-opacity duration-300 opacity-0 pointer-events-none';
  hoverViewer.innerHTML = `<img id="infographic-hover-img" src="" class="max-w-full max-h-full object-contain rounded-xl" />`;
  document.body.appendChild(hoverViewer);

  const fsViewer = document.createElement('div');
  fsViewer.id = 'infographic-fullscreen-viewer';
  fsViewer.className = 'fixed inset-0 z-[9999] hidden items-center justify-center bg-black/95 backdrop-blur-xl cursor-zoom-out transition-opacity duration-300 opacity-0';
  fsViewer.innerHTML = `<img id="infographic-fullscreen-img" src="" class="max-w-[95%] max-h-[95%] object-contain shadow-2xl rounded-lg" />`;
  document.body.appendChild(fsViewer);

  const hoverImg = document.getElementById('infographic-hover-img');
  const fsImg = document.getElementById('infographic-fullscreen-img');

  const mainImg = document.getElementById('infographic-img');
  if (mainImg) {
    mainImg.style.cursor = 'zoom-in';

    mainImg.addEventListener('mouseenter', () => {
      if (!mainImg.src) return;
      hoverImg.src = mainImg.src;
      hoverViewer.classList.remove('hidden');
      hoverViewer.classList.add('flex');
      setTimeout(() => hoverViewer.classList.remove('opacity-0'), 10);
    });

    mainImg.addEventListener('mouseleave', () => {
      hoverViewer.classList.add('opacity-0');
      setTimeout(() => {
        if (hoverViewer.classList.contains('opacity-0')) {
          hoverViewer.classList.add('hidden');
          hoverViewer.classList.remove('flex');
        }
      }, 300);
    });

    mainImg.addEventListener('click', () => {
      if (!mainImg.src) return;
      hoverViewer.classList.add('opacity-0', 'hidden');
      hoverViewer.classList.remove('flex');
      fsImg.src = mainImg.src;
      fsViewer.classList.remove('hidden');
      fsViewer.classList.add('flex');
      setTimeout(() => fsViewer.classList.remove('opacity-0'), 10);
    });
  }

  fsViewer.addEventListener('click', () => {
    fsViewer.classList.add('opacity-0');
    setTimeout(() => {
      fsViewer.classList.add('hidden');
      fsViewer.classList.remove('flex');
    }, 300);
  });
}

/**
 * Universal Infographic Router (100% Linux-Safe Lowercase Version)
 */
function updateInfographicPanel(rawTarget) {
  const imgElement = document.getElementById('infographic-img');
  if (!imgElement || !rawTarget) return;

  const targetStr = String(rawTarget).trim().toLowerCase();
  imgElement.style.opacity = 0.5;

  let folder = 'planets';
  let fileName = `${targetStr}.jpg`;
  let fallbackImage = 'planets.jpg';

  const validCategories = ['planets', 'dwarfs', 'asteroids', 'comets', 'kbos', 'moons'];
  
  if (validCategories.includes(targetStr) || targetStr === 'dwarf planets') {
      const cat = targetStr === 'dwarf planets' ? 'dwarfs' : targetStr;
      folder = cat === 'kbos' ? 'kbos' : cat;
      fileName = `${folder}.jpg`;
      fallbackImage = fileName;
  } 
  else if (targetStr === 'sun') {
      folder = 'planets'; 
      fileName = 'sun.jpg'; 
      fallbackImage = 'planets.jpg';
  }
  else {
      let detectedCategory = null;
      let parentPlanet = null;

      // Simple direct lookup from categories array
      if (typeof CATEGORIES !== 'undefined') {
          for (const [catName, members] of Object.entries(CATEGORIES)) {
              const lowerMembers = members.map(m => String(m).toLowerCase());
              if (lowerMembers.includes(targetStr)) {
                  detectedCategory = catName.toLowerCase();
                  break;
              }
          }
      }

      if (!detectedCategory && typeof CELESTIAL_BODIES !== 'undefined' && CELESTIAL_BODIES[targetStr]) {
          if (CELESTIAL_BODIES[targetStr].category) {
              detectedCategory = String(CELESTIAL_BODIES[targetStr].category).toLowerCase();
          }
      }

      if (!detectedCategory && typeof PLANET_MOONS !== 'undefined') {
          for (const [parent, moons] of Object.entries(PLANET_MOONS)) {
              const matchedMoon = moons.find(m => m.name.toLowerCase() === targetStr);
              if (matchedMoon) {
                  detectedCategory = 'moons';
                  parentPlanet = parent.toLowerCase();
                  break;
              }
          }
      }

      if (detectedCategory) {
          if (detectedCategory.includes('asteroid')) { folder = 'asteroids'; fallbackImage = 'asteroids.jpg'; } 
          else if (detectedCategory.includes('comet')) { folder = 'comets'; fallbackImage = 'comets.jpg'; } 
          else if (detectedCategory.includes('kbo') || detectedCategory.includes('kuiper')) { folder = 'kbos'; fallbackImage = 'kbos.jpg'; } 
          else if (detectedCategory.includes('dwarf')) { folder = 'dwarfs'; fallbackImage = 'dwarfs.jpg'; } 
          else if (detectedCategory.includes('moon') || detectedCategory.includes('satellite')) { folder = 'moons'; fallbackImage = 'moons.jpg'; } 
      }

      if (folder === 'moons') {
          if (targetStr === 'moon' || targetStr === 'earth moon') fileName = 'earth moon.jpg';
          else if (parentPlanet) fileName = `${parentPlanet} ${targetStr}.jpg`;
      }
  }

  const primarySrc = `infographics/${folder}/${fileName}`;
  const fallbackSrc = `infographics/${folder}/${fallbackImage}`;
  
  imgElement.dataset.fallbackSrc = fallbackSrc;
  
  imgElement.onerror = null; 
  imgElement.onerror = function() {
    const currentFallback = imgElement.dataset.fallbackSrc;
    if (currentFallback && !imgElement.src.endsWith(currentFallback)) {
        imgElement.src = currentFallback;
    }
  };

  imgElement.src = primarySrc;
  imgElement.onload = () => { imgElement.style.opacity = 1; };

// Trigger the Ephemeris Panel update sync immediately after the panel updates!
  if (typeof window.updateEphemerisPanel === 'function') window.updateEphemerisPanel(targetStr);

}

document.addEventListener('DOMContentLoaded', () => {
  initInfographicViewers();
});




/**
 * Highly Optimized J2000 Ephemeris & Telemetry Engine
 * Updates the existing right-side UI panel in real-time.
 */

// Helper to securely grab the running clock from whichever engine is active
// Universal time retriever that reads from the running simulation clock
// Universal time retriever prioritizing the active simulation epoch
function getActiveSimTime() {
  if (typeof state !== 'undefined' && state.epochMs) {
    return state.epochMs;
  }
  if (window.timeController && window.timeController.currentDate) {
    return window.timeController.currentDate.getTime();
  }
  if (typeof currentSimTime !== 'undefined' && currentSimTime instanceof Date) {
    return currentSimTime.getTime();
  }
  return Date.now();
}

window.updateEphemerisPanel = function(targetId) {
  if (!targetId || typeof CELESTIAL_BODIES === 'undefined') return;

  window.currentEphemerisTarget = targetId;
  const rawKey = String(targetId).trim().toLowerCase();

  let lookupKey = rawKey;
  let isMoon = false;
  let moonData = null;

  // Handle Earth's Moon explicitly
  if (rawKey === 'moon' || rawKey === 'earth moon') {
    isMoon = true;
    lookupKey = 'earth';
  } else if (!CELESTIAL_BODIES[lookupKey]) {
    // Check secondary planetary satellites (Titan, Europa, etc.)
    if (typeof PLANET_MOONS !== 'undefined') {
      for (const [parent, moons] of Object.entries(PLANET_MOONS)) {
        const found = moons.find(m => m.name.toLowerCase() === rawKey);
        if (found) {
          lookupKey = parent.toLowerCase();
          isMoon = true;
          moonData = found;
          break;
        }
      }
    }
  }

  const body = CELESTIAL_BODIES[lookupKey];
  if (!body) return;

  const timeMs = getActiveSimTime();

  // 1. Calculate positions using the identical physics engine from 2D mode
  let targetPos;
  if (lookupKey === 'sun') {
    targetPos = { xAU: 0, yAU: 0, zAU: 0, rAU: 0 };
  } else if (typeof calculateHeliocentricPosition === 'function') {
    targetPos = calculateHeliocentricPosition(body, timeMs);
  } else {
    targetPos = { xAU: body.a0 || 1, yAU: 0, zAU: 0, rAU: body.a0 || 1 };
  }

  let earthPos;
  if (typeof calculateHeliocentricPosition === 'function' && CELESTIAL_BODIES['earth']) {
    earthPos = calculateHeliocentricPosition(CELESTIAL_BODIES['earth'], timeMs);
  } else {
    earthPos = { xAU: 1, yAU: 0, zAU: 0, rAU: 1 };
  }

  // 2. Calculate Distances
  let distSunAU = (lookupKey === 'sun') ? 0 : targetPos.rAU;
  let distEarthAU = 0;

  if (rawKey === 'moon' || rawKey === 'earth moon') {
    // Earth's Moon: Mean orbital distance to Earth is 384,400 km = 0.00257 AU
    distEarthAU = 0.00257;
  } else if (lookupKey === 'earth') {
    distEarthAU = 0;
  } else if (lookupKey === 'sun') {
    distEarthAU = earthPos.rAU;
  } else {
    const dx = targetPos.xAU - earthPos.xAU;
    const dy = targetPos.yAU - earthPos.yAU;
    const dz = (targetPos.zAU || 0) - (earthPos.zAU || 0);
    distEarthAU = Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  // 3. Dynamic Orbital Velocity via Vis-Viva Equation: v = 29.7847 * sqrt(2/r - 1/a)
  let v_kms = 0;
  if (lookupKey === 'sun') {
    v_kms = 0;
  } else if (rawKey === 'moon' || rawKey === 'earth moon') {
    v_kms = 1.022; // Moon mean orbital velocity around Earth
  } else if (targetPos.speedKmS) {
    v_kms = targetPos.speedKmS;
  } else if (targetPos.vKmS) {
    v_kms = targetPos.vKmS;
  } else {
    const aVal = body.a0 || targetPos.rAU || 1;
    v_kms = 29.7847 * Math.sqrt(Math.max(0, (2 / Math.max(0.001, targetPos.rAU)) - (1 / aVal)));
  }
  
  // 1. Guard DOM updates so the browser never repaints identical text
  const setTxt = (id, txt) => {
    const el = document.getElementById(id);
    if (el && el.innerText !== txt) {
      el.innerText = txt;
    }
  };

  // Heliocentric Dist: 3 decimal places (0.000 AU)
  setTxt('tel-helio-au', distSunAU.toFixed(3) + " AU");
  setTxt('tel-helio-km', (distSunAU * 149597870).toLocaleString(undefined, { maximumFractionDigits: 0 }) + " km");

  // Distance from Earth: 3 decimal places (0.000 AU)
  setTxt('tel-earth-dist', distEarthAU.toFixed(3) + " AU");

  // Signal propagation light-time
  const lightMins = distEarthAU * 8.316746;
  if (distEarthAU === 0) {
    setTxt('tel-light-time', "0.0 sec light-time");
  } else if (lightMins < 1) {
    setTxt('tel-light-time', (lightMins * 60).toFixed(1) + " sec light-time");
  } else {
    setTxt('tel-light-time', lightMins.toFixed(1) + " min light-time");
  }

  // Orbital Velocity: 2 decimal places (0.00 km/s)
  setTxt('tel-velocity', v_kms.toFixed(2) + " km/s");
  setTxt('tel-velocity-mph', (v_kms * 2236.94).toLocaleString(undefined, { maximumFractionDigits: 0 }) + " mph");

  // Heliocentric Ecliptic Longitude & Z Elevation
  let longitude = Math.atan2(targetPos.yAU, targetPos.xAU) * (180 / Math.PI);
  if (longitude < 0) longitude += 360;
  setTxt('tel-longitude', longitude.toFixed(1) + "°");

  // Round to nearest 0.000 AU (guards against -0.000)
  const zVal = targetPos ? (targetPos.zAU || 0) : (targetCoords.z || 0);
  const formattedZ = (Math.abs(zVal) < 0.0005 ? 0 : zVal).toFixed(3);
  setTxt('tel-z-elevation', `${Number(formattedZ) >= 0 ? '+' : ''}${formattedZ} AU`);

  // Orbital Characteristics & Physical Data
  if (rawKey === 'moon' || rawKey === 'earth moon') {
    setTxt('tel-inclination', "5.14° (to ecliptic)");
    setTxt('tel-asc-node', "Var (18.6 yr cycle)");
    setTxt('tel-desc-node', "Var (18.6 yr cycle)");
    setTxt('tel-perihelion-arg', "Var (8.85 yr cycle)");
    setTxt('tel-semi-major', "0.00257 AU (384,400 km)");
    setTxt('tel-eccentricity', "0.0549");
    setTxt('tel-period', "27.32 days");
    setTxt('tel-diameter', "3,474 km");
    setTxt('tel-description', "The Moon is Earth's only natural satellite. Distance shown reflects its actual orbit from Earth.");
  } else if (isMoon && moonData) {
    setTxt('tel-inclination', "Orbiting " + body.name);
    setTxt('tel-asc-node', "N/A");
    setTxt('tel-desc-node', "N/A");
    setTxt('tel-perihelion-arg', "N/A");
    setTxt('tel-semi-major', "N/A");
    setTxt('tel-eccentricity', "N/A");
    setTxt('tel-period', "N/A");
    setTxt('tel-diameter', (moonData.radius * 2 * 1000).toLocaleString() + " km (Est)");
    setTxt('tel-description', `${moonData.name} is a major moon of ${body.name}. Distances shown reflect the parent planet's position.`);
  } else {
    setTxt('tel-inclination', (body.I0 || 0).toFixed(2) + "°");
    setTxt('tel-asc-node', (body.node0 || 0).toFixed(2) + "°");
    setTxt('tel-desc-node', ((body.node0 || 0) + 180 > 360 ? (body.node0 || 0) - 180 : (body.node0 || 0) + 180).toFixed(2) + "°");
    // Round to nearest 0.0°
    const periArg = (body.longPeri0 !== undefined) ? body.longPeri0 : 0;
    setTxt('tel-perihelion-arg', periArg.toFixed(1) + "°");


    setTxt('tel-semi-major', (body.a0 || 0).toFixed(3) + " AU");
    setTxt('tel-eccentricity', (body.e0 || 0).toFixed(4));
    setTxt('tel-period', (body.periodDays ? (body.periodDays > 1000 ? (body.periodDays / 365.25).toFixed(1) + " years" : body.periodDays.toFixed(1) + " days") : "N/A"));
    setTxt('tel-diameter', (body.diameterKm ? body.diameterKm.toLocaleString() + " km" : "N/A"));
    setTxt('tel-description', body.description || `${body.name} (${body.type || body.category}).`);
  }
};

// Background timeline loop throttled to ~4 FPS (250ms)
let lastEphemerisTime = 0;
let lastDomUpdate = 0;

function ephemerisLoop(now) {
  requestAnimationFrame(ephemerisLoop);

  if (now - lastDomUpdate < 250) return;
  lastDomUpdate = now;

  const currentTime = getActiveSimTime();

  if (currentTime && currentTime !== lastEphemerisTime && window.currentEphemerisTarget) {
    lastEphemerisTime = currentTime;
    window.updateEphemerisPanel(window.currentEphemerisTarget);
  }
}
requestAnimationFrame(ephemerisLoop);

