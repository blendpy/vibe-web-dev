// =============================================================
// GLOBE_UI.JS - DOM Interaction & Layer Panel Controller
// =============================================================

function renderMoonDock(parentBody) {
  if (typeof HeliosBridge !== 'undefined' && HeliosBridge.mode === 'MACRO_VIEW') {
    return; 
  }

  const container = document.getElementById('moon-dock-container');
  const dock = document.getElementById('moon-dock');
  if (!container || !dock) return;

  const moons = parentBody ? PLANET_MOONS[parentBody] : null;

  if (!moons || moons.length === 0) {
    container.classList.add('hidden');
    container.classList.remove('flex');
    dock.innerHTML = '';
    return;
  }

  container.classList.remove('hidden');
  container.classList.add('flex');
  dock.innerHTML = '';

  moons.forEach(item => {
    const btn = document.createElement('button');
    const isSelected = (typeof currentPlanet !== 'undefined' && currentPlanet.toLowerCase() === item.name.toLowerCase());

    btn.className = `body-nav-btn flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium whitespace-nowrap transition-all border ${
      isSelected
        ? 'border-blue-400 bg-blue-600/30 text-white shadow-[0_0_10px_rgba(59,130,246,0.3)]'
        : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
    }`;
    btn.setAttribute('data-body', item.name);

    const displayName = item.name.charAt(0).toUpperCase() + item.name.slice(1);
    btn.innerHTML = `<span>${item.icon}</span> <span>${displayName}</span>`;

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (typeof window.setPlanet === 'function') window.setPlanet(item.name);
      if (window.timeController) window.timeController.setTargetPlanet(item.name);
      
      if (typeof updateInfographicPanel === 'function') updateInfographicPanel(item.name);
    });

    dock.appendChild(btn);
  });
}

function setupHeliosNavEvents() {
  const memberDock = document.getElementById('member-dock');
  if (memberDock) {
    memberDock.addEventListener('click', (e) => {
      const is3D = (typeof isGlobeActive !== 'undefined' && isGlobeActive) || 
                   (typeof HeliosBridge !== 'undefined' && HeliosBridge.mode === 'INSPECTOR_VIEW');
      
      if (!is3D) return;

      const btn = e.target.closest('button');
      if (!btn) return;

      const targetBody = btn.getAttribute('data-body') || 
                         btn.getAttribute('data-planet') || 
                         btn.getAttribute('data-id');
                         
      if (targetBody) {
        e.preventDefault();
        e.stopPropagation();
        if (typeof setPlanet === 'function') setPlanet(targetBody);
        if (typeof updateInfographicPanel === 'function') updateInfographicPanel(targetBody);
      }
    }, true); 
  }

  document.querySelectorAll('.cat-tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      document.querySelectorAll('.cat-tab-btn').forEach(b => {
        b.classList.remove('active', 'bg-blue-600/30', 'border-blue-400/40', 'text-slate-200');
        b.classList.add('border-transparent', 'text-slate-400');
      });
      btn.classList.add('active', 'bg-blue-600/30', 'border-blue-400/40', 'text-slate-200');
      btn.classList.remove('border-transparent', 'text-slate-400');

      const cat = btn.getAttribute('data-cat');
      if (cat && typeof updateInfographicPanel === 'function') {
        updateInfographicPanel(cat);
      }
    });
  });

  document.getElementById('btn-target-sun')?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const container3D = document.getElementById('webgl-container');
    const in3D = (typeof isGlobeActive !== 'undefined' && isGlobeActive) ||
                 (typeof HeliosBridge !== 'undefined' && HeliosBridge.mode === 'INSPECTOR_VIEW') ||
                 (container3D && !container3D.classList.contains('hidden'));

    if (in3D) {
      if (typeof setPlanet === 'function') setPlanet('sun');
      if (window.timeController) window.timeController.setTargetPlanet('Sun');
    } else {
      if (typeof handleSelectCelestialBody === 'function') {
        handleSelectCelestialBody('sun');
      }
    }
    
    if (typeof updateInfographicPanel === 'function') updateInfographicPanel('Sun');
  });
}


function updatePlanetVisibility() {
  const chk = document.getElementById('chk-planets');
  const isChecked = chk ? chk.checked : false; 
  if (typeof planetPins !== 'undefined') {
    Object.values(planetPins).forEach(pin => {
      pin.visible = isChecked && pin.name !== `pin_${typeof currentPlanet !== 'undefined' ? currentPlanet : ''}`;
    });
  }

  // Synchronize constellation lines and stars
  if (typeof updateConstellationVisibility === 'function') {
    updateConstellationVisibility();
  }
}

function updateCelestialEquatorVisibility() {
  const chkGraticule = document.getElementById('chk-graticule');
  const chkPlanets = document.getElementById('chk-planets');
  if (chkPlanets) {
    chkPlanets.addEventListener('change', () => {
      updatePlanetVisibility();
      updateCelestialEquatorVisibility();
    });
  }
  const isGraticuleOn = chkGraticule ? chkGraticule.checked : false;
  const isPlanetsOn = chkPlanets ? chkPlanets.checked : false;
  if (typeof celestialEquatorGroup !== 'undefined' && celestialEquatorGroup) {
    celestialEquatorGroup.visible = isGraticuleOn && isPlanetsOn;
  }
}

function getMoonPhaseTargetDate(fromDate, targetPhase, forward = true) {
  const synodicMonth = 29.53058770576;
  const synodicMs = synodicMonth * 86400 * 1000;
  const knownNewMoon = Date.UTC(2024, 0, 11, 11, 57, 0);
  const currentMs = fromDate.getTime();
  const diffDays = (currentMs - knownNewMoon) / (86400 * 1000);
  let phaseVal = (diffDays % synodicMonth) / synodicMonth;
  if (phaseVal < 0) phaseVal += 1.0;
  let delta;
  if (forward) {
    delta = (targetPhase - phaseVal) % 1.0;
    if (delta <= 0) delta += 1.0;
    if (delta < 0.02) delta += 1.0;
  } else {
    delta = (phaseVal - targetPhase) % 1.0;
    if (delta <= 0) delta += 1.0;
    if (delta < 0.02) delta += 1.0;
    delta = -delta;
  }
  return new Date(currentMs + delta * synodicMs);
}
function getFullMoon(fromDate, forward = true) { return getMoonPhaseTargetDate(fromDate, 0.5, forward); }
function getNewMoon(fromDate, forward = true) { return getMoonPhaseTargetDate(fromDate, 0.0, forward); }

function getMoonPhaseDetails(date) {
  const synodicMonth = 29.53058770576;
  const knownNewMoon = Date.UTC(2024, 0, 11, 11, 57, 0);
  const diffDays = (date.getTime() - knownNewMoon) / (86400 * 1000);
  let phaseVal = (diffDays % synodicMonth) / synodicMonth;
  if (phaseVal < 0) phaseVal += 1.0;
  const illumination = Math.round((1 - Math.cos(phaseVal * 2 * Math.PI)) / 2 * 100);
  let phaseName = "", trend = "";
  if (phaseVal < 0.03 || phaseVal >= 0.97) { phaseName = "New Moon"; trend = "New"; }
  else if (phaseVal < 0.22) { phaseName = "Waxing Crescent"; trend = "Waxing"; }
  else if (phaseVal < 0.28) { phaseName = "First Quarter"; trend = "Waxing"; }
  else if (phaseVal < 0.47) { phaseName = "Waxing Gibbous"; trend = "Waxing"; }
  else if (phaseVal < 0.53) { phaseName = "Full Moon"; trend = "Full"; }
  else if (phaseVal < 0.72) { phaseName = "Waning Gibbous"; trend = "Waning"; }
  else if (phaseVal < 0.78) { phaseName = "Third Quarter"; trend = "Waning"; }
  else { phaseName = "Waning Crescent"; trend = "Waning"; }
  return { phaseVal, phaseName, illumination, trend };
}

function drawMoonPhase(canvas, phaseVal) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height, cx = w / 2, cy = h / 2, r = (w / 2) - 1.5;
  ctx.clearRect(0, 0, w, h);
  const imgData = ctx.createImageData(w, h), data = imgData.data;
  const phaseAngle = phaseVal * Math.PI * 2, lx = Math.sin(phaseAngle), ly = 0, lz = -Math.cos(phaseAngle);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dx = (x - cx) / r, dy = (y - cy) / r, distSq = dx * dx + dy * dy;
      if (distSq <= 1.0) {
        const dz = Math.sqrt(Math.max(0, 1.0 - distSq));
        const nx = dx, ny = dy, nz = dz;
        const dot = nx * lx + ny * ly + nz * lz;
        const idx = (y * w + x) * 4;
        const craterNoise = Math.sin(nx * 8 + ny * 5) * Math.cos(ny * 9 - nz * 6) * 0.15 + Math.sin(nx * 15 - nz * 12) * 0.08;
        if (dot > 0) {
          const intensity = Math.pow(dot, 0.65), edgeFactor = Math.pow(dz, 0.25);
          let red = (241 + craterNoise * 40) * edgeFactor, green = (245 + craterNoise * 40) * edgeFactor, blue = (249 + craterNoise * 30) * edgeFactor;
          data[idx] = Math.min(255, Math.max(0, red * intensity));
          data[idx + 1] = Math.min(255, Math.max(0, green * intensity));
          data[idx + 2] = Math.min(255, Math.max(0, blue * intensity));
          data[idx + 3] = 255;
        } else {
          let red = 24 + craterNoise * 15, green = 30 + craterNoise * 15, blue = 42 + craterNoise * 20;
          data[idx] = Math.min(255, Math.max(0, red)); data[idx + 1] = Math.min(255, Math.max(0, green)); data[idx + 2] = Math.min(255, Math.max(0, blue)); data[idx + 3] = 255;
        }
      }
    }
  }
  ctx.putImageData(imgData, 0, 0);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
}
let lastRenderedPhase = -1;

function updateLandingSitesVisibility() {
  const chk = document.getElementById('chk-landing-sites');
  const isChecked = chk ? chk.checked : true;

  function ensureLanderRenderOrder(group) {
    if (!group) return;
    group.renderOrder = 10;
    group.traverse(child => {
      if (child.isMesh || child.isSprite || child.isLine || child.isPoints) {
        child.renderOrder = 10;
        if (child.material) {
          child.material.depthTest = true;
          child.material.depthWrite = false;
        }
      }
    });
  }

  if (typeof currentPlanet === 'undefined') return;

  if (currentPlanet === 'moon') {
    if (isChecked) {
      if (!window.lunarLandersGroup && typeof createLunarLandersGroup === 'function') {
        window.lunarLandersGroup = createLunarLandersGroup(5.0);
        if (window.lunarLandersGroup && typeof globeGroup !== 'undefined') {
          ensureLanderRenderOrder(window.lunarLandersGroup);
          globeGroup.add(window.lunarLandersGroup);
        }
      }
      if (window.lunarLandersGroup) {
        ensureLanderRenderOrder(window.lunarLandersGroup);
        window.lunarLandersGroup.visible = true;
      }
    } else if (window.lunarLandersGroup) {
      window.lunarLandersGroup.visible = false;
    }
  } else if (window.lunarLandersGroup) {
    window.lunarLandersGroup.visible = false;
  }

  if (currentPlanet === 'mars') {
    if (isChecked) {
      if (!window.marsLandersGroup && typeof createMarsLandersGroup === 'function') {
        window.marsLandersGroup = createMarsLandersGroup(5.0);
        if (window.marsLandersGroup && typeof globeGroup !== 'undefined') {
          ensureLanderRenderOrder(window.marsLandersGroup);
          globeGroup.add(window.marsLandersGroup);
        }
      }
      if (window.marsLandersGroup) {
        ensureLanderRenderOrder(window.marsLandersGroup);
        window.marsLandersGroup.visible = true;
      }
    } else if (window.marsLandersGroup) {
      window.marsLandersGroup.visible = false;
    }
  } else if (window.marsLandersGroup) {
    window.marsLandersGroup.visible = false;
  }

  if (currentPlanet === 'venus') {
    if (isChecked) {
      if (!window.venusLandersGroup && typeof createVenusLandersGroup === 'function') {
        window.venusLandersGroup = createVenusLandersGroup(5.0);
        if (window.venusLandersGroup && typeof globeGroup !== 'undefined') {
          ensureLanderRenderOrder(window.venusLandersGroup);
          globeGroup.add(window.venusLandersGroup);
        }
      }
      if (window.venusLandersGroup) {
        ensureLanderRenderOrder(window.venusLandersGroup);
        window.venusLandersGroup.visible = true;
      }
    } else if (window.venusLandersGroup) {
      window.venusLandersGroup.visible = false;
    }
  } else if (window.venusLandersGroup) {
    window.venusLandersGroup.visible = false;
  }
}

function setActiveTextureButton(activeBtn) {
  document.querySelectorAll('#btn-tex-day, #btn-tex-marble').forEach(b => b.classList.remove('active'));
  activeBtn.classList.add('active');
}

function updateEclipseToggleStyles() {
  const btnSolar = document.getElementById('btn-eclipse-cat-solar');
  const btnLunar = document.getElementById('btn-eclipse-cat-lunar');
  const btnFull = document.getElementById('btn-eclipse-cov-full');
  const btnPartial = document.getElementById('btn-eclipse-cov-partial');

  if (btnSolar && btnLunar) {
    if (typeof eclipseCategoryFilter !== 'undefined' && eclipseCategoryFilter === 'Solar') {
      btnSolar.className = 'py-1.5 rounded-lg font-medium transition-all bg-blue-600/50 text-white border border-blue-400/40';
      btnLunar.className = 'py-1.5 rounded-lg font-medium transition-all text-slate-400 hover:text-slate-200 border border-transparent';
    } else {
      btnLunar.className = 'py-1.5 rounded-lg font-medium transition-all bg-rose-600/50 text-white border border-rose-400/40';
      btnSolar.className = 'py-1.5 rounded-lg font-medium transition-all text-slate-400 hover:text-slate-200 border border-transparent';
    }
  }

  if (btnFull && btnPartial) {
    if (typeof eclipseCoverageFilter !== 'undefined' && eclipseCoverageFilter === 'Full') {
      btnFull.className = 'py-1.5 rounded-lg font-medium transition-all bg-purple-600/50 text-white border border-purple-400/40';
      btnPartial.className = 'py-1.5 rounded-lg font-medium transition-all text-slate-400 hover:text-slate-200 border border-transparent';
    } else {
      btnPartial.className = 'py-1.5 rounded-lg font-medium transition-all bg-purple-600/50 text-white border border-purple-400/40';
      btnFull.className = 'py-1.5 rounded-lg font-medium transition-all text-slate-400 hover:text-slate-200 border border-transparent';
    }
  }
}

// =============================================================
// GLOBAL TIMELINE & ECLIPSE APPLICATION CONTROLLER
// =============================================================
function applyDate(dateInput, centerTarget = null) {
  if (!dateInput) return;

  let targetDate = null;
  let targetLat = undefined;
  let targetLon = undefined;

  if (dateInput instanceof Date) {
    targetDate = dateInput;
  } else if (dateInput && dateInput.date) {
    targetDate = (dateInput.date instanceof Date) ? dateInput.date : new Date(dateInput.date);
    targetLat = dateInput.lat;
    targetLon = dateInput.lon;
  } else if (typeof dateInput === 'string' || typeof dateInput === 'number') {
    targetDate = new Date(dateInput);
  }

  if (!targetDate || isNaN(targetDate.getTime())) return;
  const targetMs = targetDate.getTime();

  // 1. Keep view strictly anchored to Earth
  if (typeof setPlanet === 'function' && typeof currentPlanet !== 'undefined' && currentPlanet.toLowerCase() !== 'earth') {
    setPlanet('earth');
  }

  // 2. Set simulation time
  currentSimTime = new Date(targetMs);
  if (typeof isRealtimeSync !== 'undefined') isRealtimeSync = false;

  // 3. Keep moving forward at the current speed dropdown rate
  const speedSelect = document.getElementById('sim-speed-select');
  const activeSpeed = (speedSelect && speedSelect.value) ? parseFloat(speedSelect.value) : 1;

  if (window.timeController) {
    window.timeController.isLiveSync = false; 
    window.timeController.isPlaying = true;   
    window.timeController.isReverse = false;
    window.timeController.timeScale = activeSpeed;
    window.timeController.currentDate = new Date(targetMs);
    
    if (typeof window.timeController.updateTransportButtons === 'function') window.timeController.updateTransportButtons();
    if (typeof window.timeController.updateStatusBadge === 'function') window.timeController.updateStatusBadge();
    if (typeof window.timeController.updateUI === 'function') window.timeController.updateUI(true);
  }

  // 4. Sync 2D solar system engine
  if (typeof state !== 'undefined' && state) {
    state.epochMs = targetMs;
    state.isPlaying = true;
    state.playbackDirection = 1;
    state.simSpeed = activeSpeed;
  }

  if (typeof updatePlaybackUI === 'function') updatePlaybackUI();
  if (typeof updateRealtimeSyncUI === 'function') updateRealtimeSyncUI();
  if (typeof updateSunPosition === 'function') updateSunPosition();

  // 5. Position Camera
  if (targetLat !== undefined && targetLon !== undefined && typeof flyToPosition === 'function') {
    flyToPosition(targetLat, targetLon);
  } else if (centerTarget === 'moon') {
    if (typeof flyToMoonPosition === 'function') flyToMoonPosition();
  } else if (centerTarget === 'sun' || centerTarget === true) {
    if (typeof flyToEclipseOrSunPosition === 'function') flyToEclipseOrSunPosition();
    else if (typeof flyToSunPosition === 'function') flyToSunPosition();
  }

  // 6. Dismiss modals
  const dateModal = document.getElementById('date-picker-modal');
  if (dateModal) dateModal.classList.add('hidden');
  const eclipseModal = document.getElementById('eclipse-list-modal');
  if (eclipseModal) eclipseModal.classList.add('hidden');
}

function populateEclipseList() {
  const container = document.getElementById('eclipse-list-container');
  if (!container) return;
  updateEclipseToggleStyles();

  const rawData = eclipseCategoryFilter === 'Solar'
    ? (typeof SOLAR_ECLIPSE_DATE !== 'undefined' ? SOLAR_ECLIPSE_DATE : [])
    : (typeof LUNAR_ECLIPSE_DATE !== 'undefined' ? LUNAR_ECLIPSE_DATE : []);

  const filteredEclipses = rawData.filter(e => {
    const typeStr = (e.type || '').toLowerCase();
    if (eclipseCoverageFilter === 'Full') {
      return typeStr.includes('total') || typeStr.includes('annular') || typeStr.includes('full') || typeStr.includes('hybrid');
    } else {
      return typeStr.includes('partial');
    }
  }).sort((a, b) => a.date - b.date);
  
  container.innerHTML = '';
  
  if (filteredEclipses.length === 0) {
    container.innerHTML = `<div class="p-4 text-center text-slate-400 text-xs italic">No ${eclipseCategoryFilter.toLowerCase()} eclipses found for the selected extent.</div>`;
    return;
  }
  
  let firstUpcomingElement = null;
  filteredEclipses.forEach(e => {
    const isPast = typeof currentSimTime !== 'undefined' && e.date.getTime() < currentSimTime.getTime();
    const div = document.createElement('div');
    const bgBorderClass = isPast
      ? 'bg-slate-950/40 border-slate-800/40 hover:bg-slate-900/50'
      : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800/80';

    const titleColor = isPast ? 'text-slate-400 font-normal' : 'text-slate-200 font-semibold';
    const textColor = isPast ? 'text-slate-500' : 'text-slate-400';
    const iconColor = isPast
      ? 'text-slate-500'
      : (eclipseCategoryFilter === 'Solar' ? 'text-purple-400' : 'text-rose-400');
    div.className = `p-3 rounded-xl border flex items-center justify-between transition-colors cursor-pointer gap-3 ${bgBorderClass}`;
    
    const dObj = e.date instanceof Date ? e.date : new Date(e.date);
    const dateStr = `${dObj.getUTCFullYear()}-${String(dObj.getUTCMonth()+1).padStart(2,'0')}-${String(dObj.getUTCDate()).padStart(2,'0')} UTC`;
    
    const iconClass = eclipseCategoryFilter === 'Solar' ? 'fa-cloud-sun' : 'fa-moon';
    const locText = e.location || 'Global / Ocean';
    div.innerHTML = `
    <div class="flex items-center gap-3 min-w-0">
      <i class="fa-solid ${iconClass} ${iconColor} text-base shrink-0"></i>
      <div class="min-w-0">
        <div class="${titleColor} text-xs truncate">${eclipseCategoryFilter} Eclipse (${e.type || 'N/A'})</div>
        <div class="text-[11px] ${textColor} font-mono truncate">${dateStr}</div>
      </div>
    </div>
    <div class="flex items-center gap-2 text-right shrink-0">
      <span class="text-[11px] ${textColor} font-medium max-w-[160px] sm:max-w-[220px] truncate" title="${locText}">${locText}</span>
      <i class="fa-solid fa-chevron-right text-[10px] ${textColor}"></i>
    </div>
    `;

    if (!isPast && !firstUpcomingElement) {
      firstUpcomingElement = div;
    }
    
    div.addEventListener('click', (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      applyDate(e, eclipseCategoryFilter === 'Lunar' ? 'moon' : true);
    });

    container.appendChild(div);
  });

  if (firstUpcomingElement) {
    setTimeout(() => {
      container.scrollTop = firstUpcomingElement.offsetTop - container.offsetTop;
    }, 0);
  }
}

function updateNightLighting() {
  const isNightView = document.getElementById('chk-night-lights')?.checked;
  if (typeof earthMaterial !== 'undefined' && earthMaterial && earthMaterial.uniforms && earthMaterial.uniforms.uEnableNightLights) {
    earthMaterial.uniforms.uEnableNightLights.value = !!isNightView;
  }
  if (typeof headlight === 'undefined' || typeof ambientLight === 'undefined' || !headlight || !ambientLight) return;

  if (isNightView) {
    headlight.intensity = 0.0;
    ambientLight.intensity = 0.04;

    if (typeof currentPlanet !== 'undefined' && currentPlanet !== 'earth' && currentPlanet !== 'sun') {
      const coords = getBodySubsolarCoords(currentPlanet, currentSimTime);
      const sunDir = latLonToVector3(coords.lat, coords.lon, 1.0).normalize();
      const camDir = camera.position.clone().normalize();

      if (camDir.dot(sunDir) <= 0.1) {
        flyToPosition(coords.lat, coords.lon, camera.position.length());
      }
    }
  } else {
    headlight.intensity = 0.85;
    ambientLight.intensity = 0.4;
  }
}

function updateCelestialVisibility() {
  const chkCelestial = document.getElementById('chk-celestial')?.checked !== false;
  const isEarth = (typeof currentPlanet !== 'undefined' && currentPlanet === 'earth');
  const isSun = (typeof currentPlanet !== 'undefined' && currentPlanet === 'sun');
  const isMoon = (typeof currentPlanet !== 'undefined' && currentPlanet === 'moon');
  
  if (typeof celestialGroup !== 'undefined' && celestialGroup) {
    celestialGroup.visible = true;
    if (typeof sunMesh !== 'undefined' && sunMesh) sunMesh.visible = !isSun && chkCelestial;
    if (typeof celestialSunLight !== 'undefined' && celestialSunLight) celestialSunLight.visible = !isSun;
  }

  if (typeof sunPinGroup !== 'undefined' && sunPinGroup) sunPinGroup.visible = !isSun && chkCelestial;
  if (typeof moonPinGroup !== 'undefined' && moonPinGroup) moonPinGroup.visible = isEarth && !isMoon && chkCelestial;
  if (typeof moonMesh !== 'undefined' && moonMesh) moonMesh.visible = isEarth && !isMoon && chkCelestial;
  if (typeof earthSkyMesh !== 'undefined' && earthSkyMesh) earthSkyMesh.visible = isMoon && chkCelestial;
}

function onMouseMove(event) {
  if (typeof isGlobeActive === 'undefined' || !isGlobeActive) return;

  if (typeof mouseVector !== 'undefined') {
    mouseVector.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouseVector.y = -(event.clientY / window.innerHeight) * 2 + 1;
  }

  if (typeof pendingHoverEvent !== 'undefined') {
    pendingHoverEvent = { clientX: event.clientX, clientY: event.clientY, target: event.target };
  }
  
  const now = performance.now();
  if (typeof lastHoverCheck !== 'undefined' && now - lastHoverCheck > 35) {
    lastHoverCheck = now;
    if (typeof pendingHoverEvent !== 'undefined' && pendingHoverEvent && typeof handleCountryHover === 'function') {
      handleCountryHover(pendingHoverEvent);
    }
  }
}

function setupEventListeners() {
  // Tabs: Layers, Earth, Presets
  const tabBtnLayers = document.getElementById('tab-btn-layers');
  const tabBtnEarth = document.getElementById('tab-btn-earth');
  const tabBtnPresets = document.getElementById('tab-btn-presets');
  
  const tabPanelLayers = document.getElementById('tab-panel-layers');
  const tabPanelEarth = document.getElementById('tab-panel-earth');
  const tabPanelPresets = document.getElementById('tab-panel-presets');

  document.querySelectorAll('.scale-toggle').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.scale-toggle').forEach(b => {
        b.classList.remove('active', 'text-cyan-300', 'bg-cyan-950/80', 'border-cyan-500/40', 'font-medium');
        b.classList.add('text-slate-400', 'hover:text-slate-200', 'border-transparent');
      });
      e.currentTarget.classList.add('active', 'text-cyan-300', 'bg-cyan-950/80', 'border-cyan-500/40', 'font-medium');
      e.currentTarget.classList.remove('text-slate-400', 'hover:text-slate-200', 'border-transparent');
    });
  });

  function clearHoverIfNeeded() {
    const countryBordersActive = document.getElementById('chk-country-borders')?.checked;
    const stateBordersActive = document.getElementById('chk-state-borders')?.checked;
    const countryColorsActive = document.getElementById('chk-country-7-colors')?.checked;
    if (typeof hoveredFeature !== 'undefined' && hoveredFeature) {
      if (!countryBordersActive && !stateBordersActive && !countryColorsActive) { hoveredFeature = null; if(typeof drawCountryHighlight === 'function') drawCountryHighlight(null); const tooltip = document.getElementById('country-hover-tooltip'); if (tooltip) tooltip.classList.add('hidden'); } 
      else if (!stateBordersActive && hoveredFeature._isState) { hoveredFeature = null; if(typeof drawCountryHighlight === 'function') drawCountryHighlight(null); const tooltip = document.getElementById('country-hover-tooltip'); if (tooltip) tooltip.classList.add('hidden'); } 
      else if (!countryBordersActive && !countryColorsActive && !hoveredFeature._isState) { hoveredFeature = null; if(typeof drawCountryHighlight === 'function') drawCountryHighlight(null); const tooltip = document.getElementById('country-hover-tooltip'); if (tooltip) tooltip.classList.add('hidden'); }
    }
  }

  const chkPlanets = document.getElementById('chk-planets');
  if (chkPlanets) chkPlanets.addEventListener('change', updatePlanetVisibility);
  const chkLandmarks = document.getElementById('chk-landmarks');
  if (chkLandmarks && typeof updateLandmarksVisibility === 'function') chkLandmarks.addEventListener('change', updateLandmarksVisibility);
  const chkStateBorders = document.getElementById('chk-state-borders');
  if (chkStateBorders) chkStateBorders.addEventListener('change', () => { if(typeof updateStateBordersVisibility === 'function') updateStateBordersVisibility(); clearHoverIfNeeded(); });
  
  const chkMoonOrbits = document.getElementById('chk-moon-orbits');
  if (chkMoonOrbits) chkMoonOrbits.addEventListener('change', () => {
      if (typeof updateMoonOrbitsVisibility === 'function') updateMoonOrbitsVisibility();
  });

  const chkLandingSites = document.getElementById('chk-landing-sites');
  if (chkLandingSites) { chkLandingSites.addEventListener('change', updateLandingSitesVisibility); }

  // 3-Way Tab Switcher (Layers, Earth, Presets)
  function switchSidebarTab(targetTab) {
    const tabs = [
      { btn: tabBtnLayers, panel: tabPanelLayers, id: 'layers' },
      { btn: tabBtnEarth, panel: tabPanelEarth, id: 'earth' },
      { btn: tabBtnPresets, panel: tabPanelPresets, id: 'presets' }
    ];
    tabs.forEach(t => {
      if (t.btn && t.panel) {
        if (t.id === targetTab) { 
          t.btn.classList.add('active'); 
          t.btn.classList.remove('text-slate-400', 'text-slate-300'); 
          t.btn.classList.add('text-slate-200'); 
          t.panel.classList.remove('hidden'); 
        } else { 
          t.btn.classList.remove('active'); 
          t.btn.classList.remove('text-slate-200'); 
          t.btn.classList.add('text-slate-400'); 
          t.panel.classList.add('hidden'); 
        }
      }
    });
  }
  if (tabBtnLayers) tabBtnLayers.addEventListener('click', () => switchSidebarTab('layers'));
  // if (tabBtnEarth) tabBtnEarth.addEventListener('click', () => switchSidebarTab('earth'));
  // Switch sidebar panel to Earth AND switch the 3D globe to Earth
  
  // Switch sidebar panel to Earth AND switch the 3D globe to Earth
  if (tabBtnEarth) tabBtnEarth.addEventListener('click', () => {
    switchSidebarTab('earth');
    // If in 2D Solar System mode, wake the 3D globe targeting Earth
    if (typeof isGlobeActive !== 'undefined' && !isGlobeActive) {
      if (typeof wakeGlobe === 'function') wakeGlobe('earth');
    } 
    // If already in 3D mode, just transition the camera to Earth
    else {
      if (typeof setPlanet === 'function') setPlanet('earth');
    }
  });


  if (tabBtnPresets) tabBtnPresets.addEventListener('click', () => switchSidebarTab('presets'));

  if (tabBtnPresets) tabBtnPresets.addEventListener('click', () => switchSidebarTab('presets'));
  
  const dateModal = document.getElementById('date-picker-modal'), dateInput = document.getElementById('input-custom-date'), chkMoveForward = document.getElementById('chk-move-forward');
  const getIsMoveForward = () => chkMoveForward ? chkMoveForward.checked : true;
  const updateEquinoxButtonText = () => { const btnEquinox = document.getElementById('btn-next-equinox'); if (btnEquinox) { btnEquinox.innerHTML = `<i class="fa-solid fa-seedling"></i> ${getIsMoveForward() ? 'Next' : 'Prev'} Equinox`; } };
  if (chkMoveForward) chkMoveForward.addEventListener('change', updateEquinoxButtonText);
  
  document.getElementById('btn-date-picker')?.addEventListener('click', () => {
    if (typeof currentSimTime !== 'undefined' && currentSimTime) {
      dateInput.value = `${currentSimTime.getFullYear()}-${String(currentSimTime.getMonth() + 1).padStart(2, '0')}-${String(currentSimTime.getDate()).padStart(2, '0')}`;
    }
    updateEquinoxButtonText();
    dateModal.classList.remove('hidden');
  });
  
  const closeDateModal = () => dateModal.classList.add('hidden');
  document.getElementById('btn-close-date-modal')?.addEventListener('click', closeDateModal);
  document.getElementById('btn-cancel-date')?.addEventListener('click', closeDateModal);

  document.getElementById('btn-summer-solstice')?.addEventListener('click', () => { if(typeof getSummerSolstice === 'function') applyDate(getSummerSolstice(typeof currentSimTime !== 'undefined' ? currentSimTime : new Date(), getIsMoveForward()), true); });
  document.getElementById('btn-winter-solstice')?.addEventListener('click', () => { if(typeof getWinterSolstice === 'function') applyDate(getWinterSolstice(typeof currentSimTime !== 'undefined' ? currentSimTime : new Date(), getIsMoveForward()), true); });
  document.getElementById('btn-next-equinox')?.addEventListener('click', () => { if(typeof getEquinox === 'function') applyDate(getEquinox(typeof currentSimTime !== 'undefined' ? currentSimTime : new Date(), getIsMoveForward()), true); });
  document.getElementById('btn-next-solar-eclipse')?.addEventListener('click', () => {
    if (typeof SOLAR_ECLIPSE_DATE !== 'undefined' && typeof applyDate === 'function') {
      const nowMs = (typeof currentSimTime !== 'undefined' && currentSimTime) ? currentSimTime.getTime() : Date.now();
      const isForward = getIsMoveForward();

      // Filter exclusively for full/total/annular/hybrid solar eclipses
      const fullSolarEclipses = SOLAR_ECLIPSE_DATE.filter(e => {
        const typeStr = (e.type || '').toLowerCase();
        return typeStr.includes('total') || typeStr.includes('annular') || typeStr.includes('full') || typeStr.includes('hybrid');
      });

      // Find the next/previous occurrence relative to current simulation time
      let targetEclipse = null;
      if (isForward) {
        targetEclipse = fullSolarEclipses.find(e => e.date.getTime() >= nowMs);
      } else {
        // Reverse search
        const pastEclipses = fullSolarEclipses.filter(e => e.date.getTime() <= nowMs);
        targetEclipse = pastEclipses[pastEclipses.length - 1];
      }

      if (targetEclipse) {
        applyDate(targetEclipse, true);
      }
    }
  });
  document.getElementById('btn-next-lunar-eclipse')?.addEventListener('click', () => { if(typeof getLunarEclipse === 'function') applyDate(getLunarEclipse(typeof currentSimTime !== 'undefined' ? currentSimTime : new Date(), getIsMoveForward()), 'moon'); });
  
  document.getElementById('btn-full-moon')?.addEventListener('click', () => applyDate(getFullMoon(typeof currentSimTime !== 'undefined' ? currentSimTime : new Date(), getIsMoveForward()), 'moon'));
  document.getElementById('btn-new-moon')?.addEventListener('click', () => applyDate(getNewMoon(typeof currentSimTime !== 'undefined' ? currentSimTime : new Date(), getIsMoveForward()), 'moon'));

  const eclipseModal = document.getElementById('eclipse-list-modal');
  document.getElementById('btn-list-eclipses')?.addEventListener('click', () => { populateEclipseList(); eclipseModal.classList.remove('hidden'); });
  document.getElementById('btn-close-eclipse-modal')?.addEventListener('click', () => eclipseModal.classList.add('hidden'));

  const cityModal = document.getElementById('city-list-modal');
  document.getElementById('btn-preset-city')?.addEventListener('click', () => { if(typeof populateCityList === 'function') populateCityList(); cityModal.classList.remove('hidden'); });
  document.getElementById('btn-close-city-modal')?.addEventListener('click', () => cityModal.classList.add('hidden'));
  document.getElementById('btn-eclipse-cat-solar')?.addEventListener('click', () => { eclipseCategoryFilter = 'Solar'; populateEclipseList(); });
  document.getElementById('btn-eclipse-cat-lunar')?.addEventListener('click', () => { eclipseCategoryFilter = 'Lunar'; populateEclipseList(); });
  document.getElementById('btn-eclipse-cov-full')?.addEventListener('click', () => { eclipseCoverageFilter = 'Full'; populateEclipseList(); });
  document.getElementById('btn-eclipse-cov-partial')?.addEventListener('click', () => { eclipseCoverageFilter = 'Partial'; populateEclipseList(); });
  
  document.getElementById('btn-tex-marble')?.addEventListener('click', function() {
    setActiveTextureButton(this); if (typeof earthMaterial !== 'undefined') earthMaterial.uniforms.uIsBlueMarble.value = true; if(typeof loadTextureToShader === 'function') loadTextureToShader(typeof TEXTURE_URLS_FULL !== 'undefined' ? TEXTURE_URLS_FULL.blueMarble : '');
  });
  document.getElementById('btn-tex-day')?.addEventListener('click', function() {
    setActiveTextureButton(this); if (typeof earthMaterial !== 'undefined') earthMaterial.uniforms.uIsBlueMarble.value = false; if(typeof loadTextureToShader === 'function') loadTextureToShader(typeof TEXTURE_URLS_FULL !== 'undefined' ? TEXTURE_URLS_FULL.day : '');
  });
  
  document.getElementById('chk-lakes-rivers')?.addEventListener('change', () => { if (typeof updateWaterVisibility === 'function') updateWaterVisibility(); }); 
  document.getElementById('chk-country-borders')?.addEventListener('change', () => { if(typeof updateCountryBordersVisibility === 'function') updateCountryBordersVisibility(); clearHoverIfNeeded(); });
  document.getElementById('chk-country-7-colors')?.addEventListener('change', () => { if(typeof updateCountryColorsVisibility === 'function') updateCountryColorsVisibility(); clearHoverIfNeeded(); });
  document.getElementById('chk-night-lights')?.addEventListener('change', (e) => { if (typeof earthMaterial !== 'undefined') earthMaterial.uniforms.uEnableNightLights.value = e.target.checked; updateNightLighting(); });
  document.getElementById('chk-specular')?.addEventListener('change', (e) => { if (typeof earthMaterial !== 'undefined') earthMaterial.uniforms.uEnableSpecular.value = e.target.checked; });
  
  document.getElementById('chk-graticule')?.addEventListener('change', (e) => {
    if (typeof graticuleGroup !== 'undefined') graticuleGroup.visible = e.target.checked;
    updateCelestialEquatorVisibility();
  });
  document.getElementById('chk-celestial')?.addEventListener('change', updateCelestialVisibility);

  // Standardized Planetary Interior Checkbox Listener
  const chkInterior = document.getElementById('chk-interior');
  if (chkInterior) {
    chkInterior.addEventListener('change', () => {
      if (typeof updateCutout === 'function') updateCutout();
    });
  }

  const cloudToggle = document.getElementById('chk-clouds');
  if (cloudToggle) {
    cloudToggle.addEventListener('change', (e) => {
      const isChecked = e.target.checked;
      if (typeof currentPlanet !== 'undefined' && currentPlanet in planetCloudStates) {
        planetCloudStates[currentPlanet] = isChecked;
      }
      if (typeof currentPlanet !== 'undefined') {
        if (currentPlanet === 'earth' && typeof cloudMesh !== 'undefined' && cloudMesh) {
          cloudMesh.visible = isChecked;
          if (!isChecked) cloudMesh.rotation.y = 0;
        } else if (currentPlanet === 'venus' && typeof venusCloudMesh !== 'undefined' && venusCloudMesh) {
          venusCloudMesh.visible = isChecked;
          if (!isChecked) venusCloudMesh.rotation.y = 0;
        } else if (currentPlanet === 'mars' && typeof marsDustMesh !== 'undefined' && marsDustMesh) {
          marsDustMesh.visible = isChecked;
          if (!isChecked) marsDustMesh.rotation.y = 0;
        }
      }
    });
  }

  document.getElementById('btn-preset-sun')?.addEventListener('click', () => { if(typeof flyToSunPosition === 'function') flyToSunPosition(); });
  document.getElementById('btn-preset-dark')?.addEventListener('click', () => {
    if (typeof currentSunLon !== 'undefined' && typeof currentSunLat !== 'undefined' && typeof flyToPosition === 'function') {
      let antiLon = currentSunLon + 180; if (antiLon > 180) antiLon -= 360; flyToPosition(-currentSunLat, antiLon);
    }
  });
  document.getElementById('btn-preset-north')?.addEventListener('click', () => { if(typeof flyToPosition === 'function') flyToPosition(85, 0); });
  document.getElementById('btn-preset-south')?.addEventListener('click', () => { if(typeof flyToPosition === 'function') flyToPosition(-85, 0); });
  document.getElementById('btn-preset-user')?.addEventListener('click', () => { if(typeof flyToUserLocation === 'function') flyToUserLocation(); });

  document.querySelectorAll('.planet-btn').forEach(btn => {
    btn.addEventListener('click', (e) => { if (typeof setPlanet === 'function') setPlanet(e.currentTarget.getAttribute('data-planet')); });
  });
  
  const planetModal = document.getElementById('planet-table-modal');
  const btnPlanetTable = document.getElementById('btn-planet-table');
  const btnClosePlanetModal = document.getElementById('btn-close-planet-modal');
  btnPlanetTable?.addEventListener('click', () => {
    if(typeof populatePlanetTable === 'function') populatePlanetTable();
    planetModal?.classList.remove('hidden');
  });
  btnClosePlanetModal?.addEventListener('click', () => {
    planetModal?.classList.add('hidden');
  });
  planetModal?.addEventListener('click', (e) => {
    if (e.target === planetModal) {
      planetModal.classList.add('hidden');
    }
  });

  const taskbarWrapper = document.getElementById('taskbar-wrapper');
  const btnCloseTaskbar = document.getElementById('btn-close-taskbar');
  
  const otherUIElements = [
    document.querySelector('header'),                     
    document.getElementById('sim-control-panel'),             
    document.getElementById('moon-phase-container'),      
    document.getElementById('planet-day-container'),      
    document.getElementById('country-hover-tooltip')       
  ].filter(Boolean);

  let isTaskbarPinned = false;

  function setOtherPanelsVisibility(visible) {
    otherUIElements.forEach(el => {
      if (!el) return;
      el.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
      if (visible) {
        el.style.opacity = '1';
        el.style.pointerEvents = 'auto';
        el.style.transform = 'none';
      } else {
        el.style.opacity = '0';
        el.style.pointerEvents = 'none';
        if (el.tagName === 'HEADER') el.style.transform = 'translateY(-15px)';
        if (el.tagName === 'FOOTER') el.style.transform = 'translateY(15px)';
      }
    });
  }

  taskbarWrapper?.addEventListener('mouseenter', () => { setOtherPanelsVisibility(false); });
  taskbarWrapper?.addEventListener('mouseleave', () => { if (!isTaskbarPinned) setOtherPanelsVisibility(true); });
  btnCloseTaskbar?.addEventListener('click', () => {
    isTaskbarPinned = false;
    taskbarWrapper.classList.add('-translate-x-[calc(100%-14px)]');
    setOtherPanelsVisibility(true);
  });
}
