// =============================================================
// SOLARSYSTEM_UI.JS - DOM Interaction & Telemetry Display
// =============================================================

const drawer = document.getElementById('telemetry-drawer');

function populateCategoryDock(categoryKey) {
  state.activeCategory = categoryKey;
  
  let membersDock = document.getElementById('category-members-dock') || document.getElementById('member-dock');
  if (!membersDock) return;
  membersDock.innerHTML = '';

  const moonContainer = document.getElementById('moon-dock-container');
  if (moonContainer) {
    moonContainer.classList.add('hidden');
    moonContainer.classList.remove('flex');
    const moonsDock = document.getElementById('moon-dock');
    if (moonsDock) moonsDock.innerHTML = '';
  }

  const bodyKeys = CATEGORIES[categoryKey] || [];

  bodyKeys.forEach(key => {
    const body = CELESTIAL_BODIES[key];
    if (!body) return;
    
    const btn = document.createElement('button');
    btn.dataset.body = body.id;
    // Default inactive classes applied here
    btn.className = 'planet-pill px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg text-[11px] font-mono font-medium flex items-center gap-1.5 transition-all shrink-0 glass-button text-slate-300 hover:text-white border-transparent';
    
    let iconHtml = '';
    if (categoryKey === 'asteroids') {
      iconHtml = '<span class="text-[10px] shrink-0 select-none leading-none inline-block">🪨</span>';
    } else if (categoryKey === 'comets') {
      iconHtml = '<span class="text-xs shrink-0 select-none leading-none inline-block">☄️</span>';
    } else if (categoryKey === 'planets') {
      const terrestrialIds = ['mercury', 'venus', 'earth', 'mars'];
      if (terrestrialIds.includes(body.id)) {
        iconHtml = `<span class="w-2.5 h-2.5 rounded-full shrink-0 border border-white/40 ring-1 ring-white/20 shadow-sm" style="background-color: ${body.color}; box-shadow: 0 0 6px ${body.color};"></span>`;
      } else {
        iconHtml = `<span class="w-[15px] h-[15px] rounded-full shrink-0 border border-white/40 ring-1 ring-white/20 shadow-md" style="background-color: ${body.color}; box-shadow: 0 0 9px ${body.color};"></span>`;
      }
    } else {
      iconHtml = `<span class="w-1.5 h-1.5 rounded-full shrink-0 opacity-90" style="background-color: ${body.color};"></span>`;
    }

    btn.innerHTML = `${iconHtml}<span class="whitespace-nowrap">${body.name}</span>`;
    
    btn.addEventListener('click', () => {
      if (typeof HeliosBridge !== 'undefined' && HeliosBridge.mode === 'INSPECTOR_VIEW') {
        HeliosBridge.enterInspectorView(body.id);
      } else {
        if (typeof handleSelectCelestialBody === 'function') handleSelectCelestialBody(body.id);
      }
    });

    btn.addEventListener('dblclick', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (typeof window.zoomToPlanet3D === 'function') {
        window.zoomToPlanet3D(body.id);
      } else if (typeof zoomToPlanet3D === 'function') {
        zoomToPlanet3D(body.id);
      }
    });

    membersDock.appendChild(btn);
  });
  
  updatePillActiveStates();
}

/**
 * Universal Button State Updater
 * Scans BOTH Row 2 (Planets) and Row 3 (Moons) and explicitly swaps text colors
 * to prevent previously clicked buttons from getting stuck white.
 */
function updatePillActiveStates() {
  document.querySelectorAll('.planet-pill').forEach(pill => {
    // Determine if this is a Row 2 pill (body) or Row 3 pill (moon)
    const id = pill.dataset.body || pill.dataset.moon;
    
    if (id && state.selectedBodyId && id.toLowerCase() === state.selectedBodyId.toLowerCase()) {
      pill.classList.add('bg-cyan-500/20', 'border-cyan-400', 'text-white');
      pill.classList.remove('border-transparent', 'text-slate-300');
    } else {
      pill.classList.remove('bg-cyan-500/20', 'border-cyan-400', 'text-white');
      pill.classList.add('border-transparent', 'text-slate-300');
    }
  });
}

function isMoon(id) {
  if (!id || typeof PLANET_MOONS === 'undefined') return false;
  const lowerId = id.toLowerCase();
  for (const moons of Object.values(PLANET_MOONS)) {
    if (moons.some(m => m.name.toLowerCase() === lowerId)) return true;
  }
  return false;
}

function renderMoonsRow(planetId) {
  const moonContainer = document.getElementById('moon-dock-container');
  const moonsDock = document.getElementById('moon-dock');
  
  if (!moonContainer || !moonsDock || !planetId) return;

  moonsDock.innerHTML = ''; 
  let planetMoons = null;

  if (typeof PLANET_MOONS !== 'undefined') {
    for (const [key, moons] of Object.entries(PLANET_MOONS)) {
      if (key.toLowerCase() === planetId.toLowerCase()) {
        planetMoons = moons;
        break;
      }
    }
  }
  
  if (!planetMoons || planetMoons.length === 0) {
    moonContainer.classList.add('hidden');
    moonContainer.classList.remove('flex');
    return;
  }

  moonContainer.classList.remove('hidden');
  moonContainer.classList.add('flex');

  planetMoons.forEach(moon => {
    const moonBtn = document.createElement('button');

    // Default inactive classes applied here
    moonBtn.className = 'planet-pill px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg text-[11px] font-mono font-medium flex items-center gap-1.5 transition-all shrink-0 glass-button text-slate-300 hover:text-white border-transparent';
    moonBtn.dataset.moon = moon.name.toLowerCase();
    moonBtn.innerHTML = `<span>${moon.icon || '🌙'}</span> <span class="whitespace-nowrap capitalize">${moon.name}</span>`;
    
    moonBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      selectBody(moon.name);
    });

    moonBtn.addEventListener('dblclick', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (typeof window.zoomToPlanet3D === 'function') {
        window.zoomToPlanet3D(moon.name);
      } else if (typeof zoomToPlanet3D === 'function') {
        zoomToPlanet3D(moon.name);
      }
    });
    
    moonsDock.appendChild(moonBtn);
  });
}

function selectBody(id) {
  if (!id) return;
  const normalizedId = id.toLowerCase();
  
  state.selectedBodyId = normalizedId;
  openTelemetryDrawer(normalizedId);
  updateHUD(); 
  
  if (typeof updateInfographicPanel === 'function') {
    updateInfographicPanel(normalizedId);
  }

  // If it's a primary planet, rebuild the moon dock
  if (!isMoon(normalizedId)) {
    renderMoonsRow(normalizedId);
  }
  
  // Call this LAST so newly built moon buttons get correctly styled immediately
  updatePillActiveStates();
}

function deselectBody() {
  state.selectedBodyId = null;
  state.cameraLockId = null;
  updatePillActiveStates();
  closeTelemetryDrawer();
}

function updateCameraLockUI() {
  const btnLock = document.getElementById('btn-lock-camera');
  const label = document.getElementById('lock-camera-label');
  if (!btnLock || !label) return;
  if (state.cameraLockId) {
    btnLock.classList.add('bg-cyan-500/20', 'border-cyan-400', 'text-white');
    label.textContent = 'Tracking';
  } else {
    btnLock.classList.remove('bg-cyan-500/20', 'border-cyan-400', 'text-white');
    label.textContent = 'Track';
  }
}

function openTelemetryDrawer(bodyId) {
  if (!drawer || !bodyId) return;
  
  const lowerId = bodyId.toLowerCase();
  
  if (lowerId === 'sun') {
    renderSunTelemetry();
  } else if (CELESTIAL_BODIES[bodyId]) {
    renderBodyTelemetry(CELESTIAL_BODIES[bodyId]);
  } else {
    let foundBody = null;
    for (const [k, v] of Object.entries(CELESTIAL_BODIES)) {
      if (k.toLowerCase() === lowerId) { foundBody = v; break; }
    }

    if (foundBody) {
      renderBodyTelemetry(foundBody);
    } else {
      let moonData = null;
      if (typeof PLANET_MOONS !== 'undefined') {
        for (const [parent, moons] of Object.entries(PLANET_MOONS)) {
          const match = moons.find(m => m.name.toLowerCase() === lowerId);
          if (match) {
            const orbitInfo = (typeof GIANT_MOON_ORBITS !== 'undefined' && GIANT_MOON_ORBITS[parent]) 
              ? GIANT_MOON_ORBITS[parent].find(o => o.name.toLowerCase() === lowerId) 
              : {};
            moonData = { ...match, ...orbitInfo, parentPlanet: parent };
            break;
          }
        }
      }
      if (moonData) renderMoonTelemetry(moonData);
    }
  }
  
  drawer.classList.remove('translate-x-full');
  updateCameraLockUI();
}

function renderMoonTelemetry(moon) {
  const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  setEl('drawer-planet-name', moon.name);
  setEl('drawer-planet-type', `Natural Satellite of ${moon.parentPlanet}`);
  
  setEl('tel-semi-major', moon.dist ? `Scale Dist: ${moon.dist}` : 'N/A');
  setEl('tel-eccentricity', '0.0000');
  setEl('tel-inclination', moon.inc !== undefined ? `${(moon.inc * 180 / Math.PI).toFixed(2)}°` : '0.00°');
  setEl('tel-period', moon.period ? `${Math.abs(moon.period).toFixed(3)} Earth Days` : 'N/A');
  setEl('tel-diameter', 'Varies');
  setEl('tel-description', `A natural satellite orbiting ${moon.parentPlanet}.`);

  setEl('tel-asc-node', 'N/A');
  setEl('tel-desc-node', 'N/A');

  const avatar = document.getElementById('drawer-planet-avatar');
  if (avatar) {
    let hexColor = '#94a3b8';
    if (typeof moon.color === 'number') {
      hexColor = '#' + moon.color.toString(16).padStart(6, '0');
    } else if (typeof moon.color === 'string') {
      hexColor = moon.color;
    }
    avatar.style.backgroundColor = hexColor;
    avatar.style.color = '#000000';
    avatar.textContent = moon.icon || moon.name.charAt(0);
  }
}

function updateHUD() {
  const d = new Date(state.epochMs);

  // Format using local calendar so Friday evening does not roll over to Saturday
  const localYear = d.getFullYear();
  const localMonth = String(d.getMonth() + 1).padStart(2, '0');
  const localDay = String(d.getDate()).padStart(2, '0');
  const localDateStr = `${localYear}-${localMonth}-${localDay}`;

  const iso = d.toISOString();
  const datePart = iso.slice(0, 10);
  const timePart = iso.slice(11, 19) + ' UTC';

  const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  setEl('telemetry-date', datePart);
  setEl('display-date', localDateStr); // Uses local date string instead of UTC ISO slice
  setEl('telemetry-utc', timePart);

  const startOfYear = new Date(localYear, 0, 1);
  const doy = Math.floor((d - startOfYear) / 86400000) + 1;
  const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thr', 'Fri', 'Sat'][d.getDay()];
  setEl('telemetry-doy', `DOY ${doy}`);
  setEl('display-doy', `${dayName}, DOY ${doy}`); // Uses local day name ("Fri") instead of UTC ("Sat")


  if (state.selectedBodyId && state.selectedBodyId !== 'sun') {
    let p = null;
    for (const [k, v] of Object.entries(calculatedPositions)) {
      if (k.toLowerCase() === state.selectedBodyId) { p = v; break; }
    }

    if (p) {
      setEl('tel-helio-au', `${p.rAU.toFixed(3)} AU`);
      setEl('tel-helio-km', `${Math.round(p.rAU * 149597870.7).toLocaleString()} km`);
      setEl('tel-velocity', `${p.velocityKmS.toFixed(2)} km/s`);
      setEl('tel-velocity-mph', `${Math.round(p.velocityKmS * 2236.94).toLocaleString()} mph`);
      setEl('tel-longitude', `${p.eclipticLongDeg.toFixed(1)}°`);

      const zSign = p.zAU >= 0 ? '+' : '';
      const zTag = p.zAU > 0.005 ? ' (North)' : (p.zAU < -0.005 ? ' (South)' : ' (Coplanar)');
      setEl('tel-z-elevation', `${zSign}${p.zAU.toFixed(3)} AU${zTag}`);
      setEl('tel-perihelion-arg', `${p.omega_deg.toFixed(1)}°`);

      const earthPos = calculatedPositions['earth'] || { xAU: 1, yAU: 0, zAU: 0 };
      const dEarth = Math.hypot(p.xAU - earthPos.xAU, p.yAU - earthPos.yAU, (p.zAU || 0) - (earthPos.zAU || 0));
      setEl('tel-earth-dist', `${dEarth.toFixed(3)} AU`);
      setEl('tel-light-time', `${(dEarth * 8.317).toFixed(1)} min light-time`);
    } else {
      const parent = typeof getParentPlanet === 'function' ? getParentPlanet(state.selectedBodyId) : 'Primary';
      setEl('tel-helio-au', `Orbits ${parent}`);
      setEl('tel-helio-km', 'N/A');
      setEl('tel-velocity', 'N/A');
      setEl('tel-velocity-mph', 'N/A');
      setEl('tel-longitude', 'N/A');
      setEl('tel-z-elevation', 'N/A');
      setEl('tel-perihelion-arg', 'N/A');
      setEl('tel-earth-dist', 'N/A');
      setEl('tel-light-time', 'N/A');
    }
  }
}

function closeTelemetryDrawer() {
  if (drawer) drawer.classList.add('translate-x-full');
}

function renderSunTelemetry() {
  const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  setEl('drawer-planet-name', 'The Sun (Sol)');
  setEl('drawer-planet-type', 'G-Type Main-Sequence Star (Yellow Dwarf)');
  setEl('tel-helio-au', '0.000 AU');
  setEl('tel-helio-km', '0 km (System Barycenter)');
  setEl('tel-velocity', '0.00 km/s');
  setEl('tel-velocity-mph', 'System Anchor');
  setEl('tel-longitude', 'N/A');

  const earthPos = calculatedPositions['earth'] || { rAU: 1.0 };
  setEl('tel-earth-dist', `${earthPos.rAU.toFixed(3)} AU`);
  setEl('tel-light-time', `${(earthPos.rAU * 8.317).toFixed(1)} min light-time`);
  setEl('tel-z-elevation', '0.000 AU (Origin)');
  setEl('tel-inclination', '0.00°');
  setEl('tel-asc-node', 'N/A');
  setEl('tel-desc-node', 'N/A');
  setEl('tel-perihelion-arg', 'N/A');
  setEl('tel-semi-major', '0.000 AU');
  setEl('tel-eccentricity', '0.0000');
  setEl('tel-period', '~230M Years');
  setEl('tel-diameter', '1,392,700 km');
  setEl('tel-description', 'The Sun is the star at the center of the Solar System. It holds 99.86% of the system\'s mass.');

  const avatar = document.getElementById('drawer-planet-avatar');
  if (avatar) {
    avatar.style.backgroundColor = '#fbbf24';
    avatar.style.color = '#78350f';
    avatar.textContent = '☉';
  }
}


function renderBodyTelemetry(body) {
  const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  setEl('drawer-planet-name', body.name);
  setEl('drawer-planet-type', body.type); // Stripped '(Click to Inspect 3D)' prefix
  setEl('tel-semi-major', `${body.a0.toFixed(3)} AU`);
  setEl('tel-eccentricity', `${body.e0.toFixed(4)}`);
  setEl('tel-inclination', `${body.I0.toFixed(2)}°`);
  setEl('tel-period', `${body.periodDays.toLocaleString()} days`);
  setEl('tel-diameter', `${body.diameterKm.toLocaleString()} km`);
  setEl('tel-description', body.description);



  const nodes = calculateOrbitalNodes(body, state.epochMs);
  setEl('tel-asc-node', `${nodes.asc.longDeg.toFixed(1)}° (r = ${nodes.asc.rAU.toFixed(2)} AU)`);
  setEl('tel-desc-node', `${nodes.desc.longDeg.toFixed(1)}° (r = ${nodes.desc.rAU.toFixed(2)} AU)`);

  const avatar = document.getElementById('drawer-planet-avatar');
  if (avatar) {
    avatar.style.backgroundColor = body.color;
    avatar.style.color = '#000000';
    avatar.textContent = body.name.charAt(0);
  }
}

function updatePlaybackUI() {
  const playIcon = document.getElementById('play-icon');
  const btnPlay = document.getElementById('btn-play-pause');
  const btnReverse = document.getElementById('btn-reverse-time');
  if (!playIcon || !btnPlay) return;

  if (!state.isPlaying) {
    playIcon.className = 'fa-solid fa-play text-xs';
    btnPlay.classList.remove('active');
    btnReverse?.classList.remove('active');
  } else if (state.playbackDirection === -1) {
    playIcon.className = 'fa-solid fa-play text-xs';
    btnPlay.classList.remove('active');
    btnReverse?.classList.add('active');
  } else {
    playIcon.className = 'fa-solid fa-pause text-xs';
    btnPlay.classList.add('active');
    btnReverse?.classList.remove('active');
  }
}

// -------------------------------------------------------------
// CORE 3D INTERSECTION LOGIC (Zoom & Pan)
// -------------------------------------------------------------
function zoomToPlanet3D(targetId) {
  if (!targetId || targetId.toLowerCase() === 'sun') return;
  
  if (typeof selectBody === 'function') selectBody(targetId);

  if (typeof HeliosBridge !== 'undefined' && typeof HeliosBridge.enterInspectorView === 'function') {
    HeliosBridge.enterInspectorView(targetId);
    return;
  }
  
  if (typeof window.enterInspectorView === 'function') {
    window.enterInspectorView(targetId);
    return;
  }

  window.location.href = `terra3d.html?planet=${encodeURIComponent(targetId)}&epoch=${state.epochMs}`;
}

// -------------------------------------------------------------
// KEYBOARD NAVIGATION LOGIC
// -------------------------------------------------------------
function handleKeyboardNavigation(direction) {
  if (!state.selectedBodyId) return;

  let currentList = [];
  
  if (isMoon(state.selectedBodyId)) {
    if (typeof PLANET_MOONS !== 'undefined') {
      for (const [parent, moons] of Object.entries(PLANET_MOONS)) {
        if (moons.some(m => m.name.toLowerCase() === state.selectedBodyId)) {
          currentList = moons.map(m => m.name.toLowerCase());
          break;
        }
      }
    }
  } else if (state.activeCategory && typeof CATEGORIES !== 'undefined' && CATEGORIES[state.activeCategory]) {
    currentList = CATEGORIES[state.activeCategory].map(k => k.toLowerCase());
    
    if (state.activeCategory === 'planets') {
      currentList = ['sun', ...currentList];
    }
  }

  if (currentList.length > 0) {
    let currentIndex = currentList.indexOf(state.selectedBodyId);
    
    if (currentIndex === -1) {
        currentIndex = 0; 
    }

    let newIndex = (currentIndex + direction + currentList.length) % currentList.length;
    let targetBody = currentList[newIndex];

    if (typeof HeliosBridge !== 'undefined' && HeliosBridge.mode === 'INSPECTOR_VIEW') {
      HeliosBridge.enterInspectorView(targetBody);
    } else {
      if (typeof handleSelectCelestialBody === 'function') {
        handleSelectCelestialBody(targetBody);
      } else {
        selectBody(targetBody);
      }
    }
  }
}

// -------------------------------------------------------------
// HTML EVENT LISTENERS
// -------------------------------------------------------------
document.addEventListener('keydown', (e) => {
  if (e.target.tagName.toLowerCase() === 'input' || e.target.tagName.toLowerCase() === 'textarea') return;
  
  if (e.key === 'ArrowLeft') {
    e.preventDefault();
    handleKeyboardNavigation(-1);
  } else if (e.key === 'ArrowRight') {
    e.preventDefault();
    handleKeyboardNavigation(1);
  }
});

document.querySelectorAll('.tab-btn, .cat-tab-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    document.querySelectorAll('.tab-btn, .cat-tab-btn').forEach(b => b.classList.remove('active'));
    e.currentTarget.classList.add('active');
    const catData = e.currentTarget.getAttribute('data-cat');
    
    if (catData) {
      populateCategoryDock(catData);
      if (typeof updateInfographicPanel === 'function') {
        updateInfographicPanel(catData);
      }
    }
  });
});

document.getElementById('toggle-nodes-btn')?.addEventListener('click', () => {
  state.showNodesOverlay = !state.showNodesOverlay;
  const toggleNodesBtn = document.getElementById('toggle-nodes-btn');
  const nodesToggleText = document.getElementById('nodes-toggle-text');
  const nodesLegend = document.getElementById('nodes-legend');
  if (state.showNodesOverlay) {
    toggleNodesBtn?.classList.add('toggle-active');
    if (nodesToggleText) nodesToggleText.textContent = 'Nodes: ON';
    nodesLegend?.classList.remove('hidden');
  } else {
    toggleNodesBtn?.classList.remove('toggle-active');
    if (nodesToggleText) nodesToggleText.textContent = 'Nodes: OFF';
    nodesLegend?.classList.add('hidden');
  }
});

document.getElementById('btn-sun-focus')?.addEventListener('click', () => { 
  if(typeof handleSelectCelestialBody === 'function') handleSelectCelestialBody('sun'); 
  if(typeof updateInfographicPanel === 'function') updateInfographicPanel('Sun');
});
document.getElementById('btn-sun-focus')?.addEventListener('dblclick', (e) => {
  e.preventDefault(); e.stopPropagation();
  if (typeof window.zoomToPlanet3D === 'function') window.zoomToPlanet3D('sun');
  else if (typeof zoomToPlanet3D === 'function') zoomToPlanet3D('sun');
});

document.getElementById('btn-target-sun')?.addEventListener('click', () => { 
  if(typeof handleSelectCelestialBody === 'function') handleSelectCelestialBody('sun'); 
  if(typeof updateInfographicPanel === 'function') updateInfographicPanel('Sun');
});
document.getElementById('btn-target-sun')?.addEventListener('dblclick', (e) => {
  e.preventDefault(); e.stopPropagation();
  if (typeof window.zoomToPlanet3D === 'function') window.zoomToPlanet3D('sun');
  else if (typeof zoomToPlanet3D === 'function') zoomToPlanet3D('sun');
});


document.getElementById('btn-zoom-in')?.addEventListener('click', () => { state.zoom = Math.min(22.0, state.zoom * 1.35); });
document.getElementById('btn-zoom-out')?.addEventListener('click', () => { state.zoom = Math.max(0.12, state.zoom / 1.35); });
document.getElementById('btn-target')?.addEventListener('click', () => { state.pan = { x: 0, y: 0 }; state.cameraLockId = null; updateCameraLockUI(); });
document.getElementById('reset-view-btn')?.addEventListener('click', () => { state.pan = { x: 0, y: 0 }; state.zoom = 1.0; state.cameraLockId = null; updateCameraLockUI(); });

document.getElementById('scale-readable')?.addEventListener('click', () => {
  state.scaleMode = 'readable';
  document.getElementById('scale-readable')?.classList.add('active');
  document.getElementById('scale-true')?.classList.remove('active');
});
document.getElementById('scale-true')?.addEventListener('click', () => {
  state.scaleMode = 'true';
  document.getElementById('scale-true')?.classList.add('active');
  document.getElementById('scale-readable')?.classList.remove('active');
});

document.getElementById('btn-close-drawer')?.addEventListener('click', deselectBody);
document.getElementById('btn-lock-camera')?.addEventListener('click', () => {
  state.cameraLockId = (state.cameraLockId === state.selectedBodyId) ? null : state.selectedBodyId;
  updateCameraLockUI();
});
document.getElementById('btn-focus-planet')?.addEventListener('click', () => { if(typeof zoomAndPanToBody === 'function') zoomAndPanToBody(state.selectedBodyId); });
document.getElementById('drawer-zoom-trigger')?.addEventListener('click', () => { 
  if(typeof window.zoomToPlanet3D === 'function') window.zoomToPlanet3D(state.selectedBodyId); 
  else if(typeof zoomToPlanet3D === 'function') zoomToPlanet3D(state.selectedBodyId); 
});
document.getElementById('btn-inspect-3d')?.addEventListener('click', () => { 
  if(typeof window.zoomToPlanet3D === 'function') window.zoomToPlanet3D(state.selectedBodyId); 
  else if(typeof zoomToPlanet3D === 'function') zoomToPlanet3D(state.selectedBodyId); 
});

document.getElementById('btn-reverse-time')?.addEventListener('click', () => {
  if (state.isPlaying && state.playbackDirection === -1) state.isPlaying = false;
  else { state.playbackDirection = -1; state.isPlaying = true; }
  updatePlaybackUI();
});
document.getElementById('btn-play-pause')?.addEventListener('click', () => {
  if (state.isPlaying && state.playbackDirection === 1) state.isPlaying = false;
  else { state.playbackDirection = 1; state.isPlaying = true; }
  updatePlaybackUI();
});
document.getElementById('btn-realtime-sync')?.addEventListener('click', () => {
  state.epochMs = Date.now();
  state.playbackDirection = 1;
  state.isPlaying = true;
  state.simSpeed = 1;
  updatePlaybackUI();
});
