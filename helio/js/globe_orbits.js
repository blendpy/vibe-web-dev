function createPlanetaryMoons() {
  planetaryMoonsGroup = new THREE.Group();
  planetaryMoonsGroup.name = 'planetaryMoonsGroup';
  globeGroup.add(planetaryMoonsGroup);

  // 1. Create a dedicated group to hold all the orbit lines
  window.planetaryMoonOrbitsGroup = new THREE.Group();
  window.planetaryMoonOrbitsGroup.name = 'planetaryMoonOrbitsGroup';
  globeGroup.add(window.planetaryMoonOrbitsGroup);

  if (typeof GIANT_MOON_ORBITS !== 'undefined') {
    Object.entries(GIANT_MOON_ORBITS).forEach(([planetName, moons]) => {
      moons.forEach(m => {
        // 2. Create the solid 3D Moon Mesh
        const geo = new THREE.SphereGeometry(m.radius, 24, 24);
        const mat = new THREE.MeshStandardMaterial({
          color: m.color, roughness: 0.85, metalness: 0.05
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.name = `3d_moon_${m.name}`;
        mesh.userData = { ...m, parentPlanet: planetName };
        mesh.visible = false;
        planetaryMoonsGroup.add(mesh);
        giantMoonMeshes.push(mesh);

        // 3. Generate the 3D Orbital Path Points
        const half1 = [];
        const half2 = [];

        const getPos = (angle) => {
          let x = m.dist * Math.cos(angle);
          let z = m.dist * Math.sin(angle);
          let y = 0;
          if (m.inc) {
            const yTemp = y * Math.cos(m.inc) - z * Math.sin(m.inc);
            z = y * Math.sin(m.inc) + z * Math.cos(m.inc);
            y = yTemp;
          }
          return new THREE.Vector3(x, y, z);
        };

        for(let i = 0; i <= 64; i++) { half1.push(getPos((i / 64) * Math.PI)); }
        for(let i = 0; i <= 64; i++) { half2.push(getPos(Math.PI + (i / 64) * Math.PI)); }

        const half1IsAbove = (half1[32].y >= 0);
        const half2IsAbove = (half2[32].y >= 0);

        const solidMat = new THREE.LineBasicMaterial({ color: m.color, transparent: true, opacity: 0.45 });
        const dashedMat = new THREE.LineDashedMaterial({ color: m.color, dashSize: 0.3, gapSize: 0.15, transparent: true, opacity: 0.25 });

        // 4. Build the separate Solid/Dashed arcs
        const line1 = new THREE.Line(new THREE.BufferGeometry().setFromPoints(half1), half1IsAbove ? solidMat : dashedMat);
        if (!half1IsAbove) line1.computeLineDistances(); 

        const line2 = new THREE.Line(new THREE.BufferGeometry().setFromPoints(half2), half2IsAbove ? solidMat : dashedMat);
        if (!half2IsAbove) line2.computeLineDistances();

        const orbitGroup = new THREE.Group();
        orbitGroup.name = `orbit_${planetName}_${m.name}`;
        orbitGroup.userData = { parentPlanet: planetName };
        orbitGroup.visible = false;
        orbitGroup.add(line1);
        orbitGroup.add(line2);

        window.planetaryMoonOrbitsGroup.add(orbitGroup);
      });
    });
  }

  // --- 5. THE EARTH MOON (Moved here from applyPlanetState) ---
  window.earthMoonOrbitGroup = new THREE.Group();
  window.earthMoonOrbitGroup.userData = { parentPlanet: 'earth' };
  window.earthMoonOrbitGroup.visible = false;

  const eSolidMat = new THREE.LineBasicMaterial({ color: 0x94a3b8, transparent: true, opacity: 0.45 });
  const eDashedMat = new THREE.LineDashedMaterial({ color: 0x94a3b8, dashSize: 0.6, gapSize: 0.3, transparent: true, opacity: 0.25 });

  window.updateEarthMoonOrbitLine = function(d, gmst) {
      if (!window.earthMoonOrbitGroup) return;

      while(window.earthMoonOrbitGroup.children.length > 0){
          const child = window.earthMoonOrbitGroup.children[0];
          if(child.geometry) child.geometry.dispose();
          window.earthMoonOrbitGroup.remove(child);
      }

      const eps = 23.439 * Math.PI / 180;
      const L_base = (218.316 + 13.176396 * d) % 360;
      const M_base = (134.963 + 13.064993 * d) % 360;
      const F_base = (93.272 + 13.229350 * d) % 360;

      const solidSegments = [];
      const dashedSegments = [];
      let currentSegment = [];
      let isCurrentlyAbove = null;

      // Mathematically locked sweep: Sweeps the actual physics variables the moon uses
      for(let i = 0; i <= 128; i++) {
          const offset = (i / 128) * 360; 
          
          const lRad = (L_base + offset + 6.289 * Math.sin((M_base + offset) * Math.PI / 180)) * Math.PI / 180;
          const bRad = (5.128 * Math.sin((F_base + offset) * Math.PI / 180)) * Math.PI / 180;

          const moonLat = Math.asin(Math.sin(bRad) * Math.cos(eps) + Math.cos(bRad) * Math.sin(eps) * Math.sin(lRad)) * (180 / Math.PI);
          const moonRA = Math.atan2(Math.sin(lRad) * Math.cos(eps) - Math.tan(bRad) * Math.sin(eps), Math.cos(lRad)) * (180 / Math.PI);

          let gha = (gmst - moonRA) % 360;
          if (gha < 0) gha += 360;
          let moonLon = -gha;
          moonLon = ((moonLon + 180) % 360 + 360) % 360 - 180;

          const phi = (90 - moonLat) * (Math.PI / 180);
          const theta = (moonLon + 180) * (Math.PI / 180);
          const radius = 22;
          const pos = new THREE.Vector3(
            -(radius * Math.sin(phi) * Math.cos(theta)),
             radius * Math.cos(phi),
             radius * Math.sin(phi) * Math.sin(theta)
          );

          const isAbove = pos.y >= 0; 
          if (isCurrentlyAbove === null) {
              isCurrentlyAbove = isAbove;
          } else if (isAbove !== isCurrentlyAbove) {
              currentSegment.push(pos);
              if (isCurrentlyAbove) solidSegments.push(currentSegment);
              else dashedSegments.push(currentSegment);
              currentSegment = [pos];
              isCurrentlyAbove = isAbove;
              continue;
          }
          currentSegment.push(pos);
      }
      
      if (isCurrentlyAbove) solidSegments.push(currentSegment);
      else dashedSegments.push(currentSegment);

      solidSegments.forEach(pts => {
          window.earthMoonOrbitGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), eSolidMat));
      });
      dashedSegments.forEach(pts => {
          const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), eDashedMat);
          line.computeLineDistances();
          window.earthMoonOrbitGroup.add(line);
      });
  };

  if (typeof celestialGroup !== 'undefined' && celestialGroup) {
    celestialGroup.add(window.earthMoonOrbitGroup);
  } else {
    setTimeout(() => { 
      if (typeof celestialGroup !== 'undefined' && celestialGroup) {
        celestialGroup.add(window.earthMoonOrbitGroup); 
      }
    }, 500);
  }


}

// Global visibility toggle
window.updateMoonOrbitsVisibility = function() {
    const chk = document.getElementById('chk-moon-orbits');
    const isChecked = chk ? chk.checked : true;
    
    if (window.planetaryMoonOrbitsGroup) {
        window.planetaryMoonOrbitsGroup.children.forEach(orbit => {
            orbit.visible = isChecked && (orbit.userData.parentPlanet === currentPlanet);
        });
    }
    
    // Explicitly toggle the standalone Earth Moon group
    if (window.earthMoonOrbitGroup) {
        window.earthMoonOrbitGroup.visible = isChecked && (currentPlanet === 'earth');
    }
};


function updatePlanetaryMoons() {
  if (!planetaryMoonsGroup || giantMoonMeshes.length === 0) return;

  const jd2000 = Date.UTC(2000, 0, 1, 12, 0, 0);
  const elapsedDays = (currentSimTime.getTime() - jd2000) / 86400000;

  giantMoonMeshes.forEach(mesh => {
    const parent = mesh.userData.parentPlanet ? mesh.userData.parentPlanet.toLowerCase() : '';
    if (parent !== currentPlanet.toLowerCase()) {
      mesh.visible = false;
      return;
    }

    mesh.visible = true;

    const data = mesh.userData;
    const angle = data.epoch + ((2 * Math.PI) / data.period) * elapsedDays;

    let x = data.dist * Math.cos(angle);
    let z = data.dist * Math.sin(angle);
    let y = 0;

    if (data.inc) {
      const yTemp = y * Math.cos(data.inc) - z * Math.sin(data.inc);
      z = y * Math.sin(data.inc) + z * Math.cos(data.inc);
      y = yTemp;
    }

    mesh.position.set(x, y, z);
  });
}



function applyPlanetState(planetName) {
  //const target = String(planetName || '').trim().toLowerCase();
  //const isEarth = (target === 'earth');

  // If navigating away from Earth while on the Earth tab, switch to Layers
  //const tabBtnEarth = document.getElementById('tab-btn-earth');
  //if (!isEarth && tabBtnEarth && tabBtnEarth.classList.contains('active')) {
  //  document.getElementById('tab-btn-layers')?.click();
  //}

  currentPlanet = planetName;
  const parentPlanet = getParentPlanet(planetName);

  const uiBodyId = planetName.toLowerCase();

  if (typeof selectBody === 'function') selectBody(uiBodyId);
  if (typeof updateInfographicPanel === 'function') updateInfographicPanel(uiBodyId);

  updateParentSkyView(planetName);

  if (window.timeController) {
    window.timeController.setTargetPlanet(planetName);
  }

  document.querySelectorAll('.planet-btn, .body-nav-btn, .planet-pill').forEach(btn => {
    const target = btn.getAttribute('data-planet') || btn.getAttribute('data-body') || btn.getAttribute('data-id');
    const isExact = (target && target.toLowerCase() === planetName.toLowerCase());
    const isParentInRow2 = (parentPlanet && target && target.toLowerCase() === parentPlanet.toLowerCase() && (btn.closest('#member-dock') || btn.closest('#category-members-dock')));

    if (isExact || isParentInRow2) {
      if (btn.classList.contains('planet-pill')) {
        btn.classList.add('bg-cyan-500/20', 'border-cyan-400', 'text-white');
      } else {
        btn.classList.add('border-blue-400', 'bg-blue-600/30', 'text-white', 'shadow-[0_0_10px_rgba(59,130,246,0.3)]');
        btn.classList.remove('border-transparent', 'text-slate-400');
      }
    } else {
      if (btn.classList.contains('planet-pill')) {
        btn.classList.remove('bg-cyan-500/20', 'border-cyan-400', 'text-white');
      } else {
        btn.classList.remove('border-blue-400', 'bg-blue-600/30', 'text-white', 'shadow-[0_0_10px_rgba(59,130,246,0.3)]');
        btn.classList.add('border-transparent', 'text-slate-400');
      }
    }
  });

  if (typeof renderMoonDock === 'function') renderMoonDock(parentPlanet);

  if (!planetMaterials[planetName]) {
    let bodyColor = '#94a3b8';
    const lowerName = planetName.toLowerCase();

    if (typeof CELESTIAL_BODIES !== 'undefined' && CELESTIAL_BODIES[lowerName]) {
      bodyColor = CELESTIAL_BODIES[lowerName].color;
    } else if (typeof PLANET_MOONS !== 'undefined') {
      for (const moons of Object.values(PLANET_MOONS)) {
        const match = moons.find(m => m.name.toLowerCase() === lowerName);
        if (match) { bodyColor = match.color; break; }
      }
    }

    planetMaterials[planetName] = new THREE.MeshStandardMaterial({
      color: new THREE.Color(bodyColor),
      roughness: 0.85,
      metalness: 0.05
    });
    injectCutoutShader(planetMaterials[planetName], 'cutout_mat_' + planetName);
  }

  if (earthMesh) {
    earthMesh.material = planetMaterials[planetName] || planetMaterials['earth'];
  }
  loadPlanetTextureOnDemand(planetName);
  
  const TILTED_BODIES = ['jupiter', 'saturn', 'uranus', 'neptune'];
  const tilt = TILTED_BODIES.includes(planetName) && (typeof PLANET_DYNAMICS !== 'undefined' && PLANET_DYNAMICS[planetName])
    ? PLANET_DYNAMICS[planetName].tilt 
    : 0;
  globeGroup.rotation.z = -tilt * (Math.PI / 180);

  if (typeof updatePlanetRings === 'function') updatePlanetRings(planetName);
  createGraticuleGrid();
  
  if (typeof updatePlanetAtmosphere === 'function') updatePlanetAtmosphere(planetName);

  // Explicitly trigger comet tail update/visibility check upon body selection
  if (typeof window.cometTailMesh !== 'undefined' && window.cometTailMesh) {
    window.cometTailMesh.visible = isCometBody(planetName);
  }

  const isEarth = (planetName === 'earth');
  const isSun = (planetName === 'sun');
  const isMoon = (planetName === 'moon');
  const isMars = (planetName === 'mars');
  const isVenus = (planetName === 'venus');
  
  if (planetaryMoonsGroup) {
    const hasMoons = (typeof GIANT_MOON_ORBITS !== 'undefined') && !!GIANT_MOON_ORBITS[planetName];
    planetaryMoonsGroup.visible = hasMoons;
    if (hasMoons) updatePlanetaryMoons();
  }

  if (typeof updateMoonOrbitsVisibility === 'function') updateMoonOrbitsVisibility();

  const moonBox = document.getElementById('moon-phase-container');
  const planetClockBox = document.getElementById('planet-day-container');
  if (moonBox) {
    moonBox.classList.toggle('hidden', !isEarth);
    moonBox.style.display = isEarth ? 'flex' : 'none';
  }
  if (planetClockBox) {
    planetClockBox.classList.toggle('hidden', isEarth);
    planetClockBox.style.display = isEarth ? 'none' : 'flex';
  }

  const lblSpecular = document.getElementById('lbl-specular');
  const lblNightLights = document.getElementById('lbl-night-lights');

  const tabBtnPresets = document.getElementById('tab-btn-presets');
  if (tabBtnPresets) {
    if (isEarth || isMoon) {
      tabBtnPresets.innerHTML = '<i class="fa-solid fa-cloud-sun text-[11px] text-purple-400 mr-1.5"></i> Eclipse';
    } else {
      tabBtnPresets.innerHTML = '<i class="fa-solid fa-compass text-[11px] text-amber-400 mr-1.5"></i> Presets';
    }
  }

  const chkCelestial = document.getElementById('chk-celestial');
  const lblCelestialSpan = chkCelestial?.parentElement?.querySelector('span');
  if (lblCelestialSpan) {
    if (isEarth) {
      lblCelestialSpan.innerHTML = '<i class="fa-solid fa-sun text-amber-300"></i> Pin Sun & Moon Position';
    } else {
      lblCelestialSpan.innerHTML = '<i class="fa-solid fa-sun text-amber-300"></i> Pin Sun & Earth Position';
    }
  }

  if (lblSpecular) lblSpecular.style.display = isEarth ? 'flex' : 'none';
  if (lblNightLights) lblNightLights.style.display = isSun ? 'none' : 'flex';

  const lblClouds = document.getElementById('lbl-clouds');
  const cloudToggle = document.getElementById('chk-clouds');
  const cloudSpan = cloudToggle?.parentElement?.querySelector('span');

  const hasClouds = planetName in planetCloudStates;

  if (lblClouds) {
    // lblClouds.style.display = hasClouds ? 'flex' : 'none';
    lblClouds.style.visibility = hasClouds ? 'visible' : 'hidden';
  }

  if (hasClouds && cloudToggle) {
    cloudToggle.checked = planetCloudStates[planetName];
    if (cloudSpan) {
      if (planetName === 'earth') cloudSpan.innerHTML = '<i class="fa-solid fa-cloud text-blue-300"></i> Real-Time Cloud Cover';
      else if (planetName === 'venus') cloudSpan.innerHTML = '<i class="fa-solid fa-smog text-amber-100"></i> Cloud Cover (300 km Haze)';
      else if (planetName === 'mars') cloudSpan.innerHTML = '<i class="fa-solid fa-wind text-orange-500"></i> Global Dust Storm';
      else cloudSpan.innerHTML = `<i class="fa-solid fa-cloud text-slate-300"></i> ${planetName} Atmosphere`;
    }
  }

  if (cloudMesh) cloudMesh.visible = (planetName === 'earth') && planetCloudStates['earth'];
  if (venusCloudMesh) venusCloudMesh.visible = (planetName === 'venus') && planetCloudStates['venus'];
  if (marsDustMesh) marsDustMesh.visible = (planetName === 'mars') && planetCloudStates['mars'];

  const eBounds = document.getElementById('earth-only-boundaries');
  const eEclipses = document.getElementById('earth-only-eclipses');
  const btnUser = document.getElementById('btn-preset-user');
  const btnCity = document.getElementById('btn-preset-city');
  const btnPresetSun = document.getElementById('btn-preset-sun');
  const btnPresetDark = document.getElementById('btn-preset-dark');

  const isLanderBody = (isMoon || isMars || isVenus);
  const lblLandingSites = document.getElementById('lbl-landing-sites');
  const lblLandingText = document.getElementById('lbl-landing-sites-text');

  if (lblLandingSites) {
    if (isLanderBody) {
      lblLandingSites.classList.remove('hidden');
      lblLandingSites.style.display = 'flex';
      if (lblLandingText) {
        if (isVenus) lblLandingText.innerHTML = '<i class="fa-solid fa-fire-burner text-amber-400"></i> Venus Landing Sites (Venera & Vega)';
        else if (isMars) lblLandingText.innerHTML = '<i class="fa-solid fa-robot text-orange-400"></i> Mars Landing Sites (Rovers & Landers)';
        else if (isMoon) lblLandingText.innerHTML = '<i class="fa-solid fa-shuttle-space text-amber-300"></i> Lunar Landing Sites (Apollo & Robotic)';
      }
    } else {
      lblLandingSites.classList.add('hidden');
      lblLandingSites.style.display = 'none';
    }
  }

  if (!isEarth) {
    if (countryBordersMesh) countryBordersMesh.visible = false;
    if (stateBordersMesh) stateBordersMesh.visible = false;
    if (countryColorsMesh) countryColorsMesh.visible = false;
    if (landmarksMeshGroup) landmarksMeshGroup.visible = false;
  } else {
    if (typeof updateCountryBordersVisibility === 'function') updateCountryBordersVisibility();
    if (typeof updateStateBordersVisibility === 'function') updateStateBordersVisibility();
    if (typeof updateCountryColorsVisibility === 'function') updateCountryColorsVisibility();
    if (typeof updateLandmarksVisibility === 'function') updateLandmarksVisibility();
  }

  // --- PLANETARY INTERIOR AVAILABILITY GUARD ---
  const hasInterior = (typeof PLANETARY_INTERIORS !== 'undefined') && !!PLANETARY_INTERIORS[currentPlanet];
  const lblInterior = document.getElementById('lbl-interior');
  const chkInterior = document.getElementById('chk-interior');

  if (chkInterior) {
    if (!hasInterior && chkInterior.checked) {
      chkInterior.checked = false;
    }
    chkInterior.disabled = !hasInterior;
  }

  if (lblInterior) {
    if (hasInterior) {
      lblInterior.classList.remove('opacity-35', 'pointer-events-none', 'cursor-not-allowed');
      lblInterior.removeAttribute('title');
    } else {
      lblInterior.classList.add('opacity-35', 'pointer-events-none', 'cursor-not-allowed');
      lblInterior.setAttribute('title', 'Interior model not defined for this object');
    }
  }


  if (typeof updateLandingSitesVisibility === 'function') updateLandingSitesVisibility();
  updateSunPosition();
  window.updateCutout(); 
  if (typeof updatePlanetVisibility === 'function') updatePlanetVisibility();
  if (typeof updateCelestialVisibility === 'function') updateCelestialVisibility();
  if (typeof updateCelestialEquatorVisibility === 'function') updateCelestialEquatorVisibility();
}


function updatePlanetAtmosphere(planetName) {
  if (typeof atmosphereMesh === 'undefined' || !atmosphereMesh) return;

  const profiles = {
    'earth':   { color: 0x38bdf8, intensity: 0.85, scale: 1.025 },
    'venus':   { color: 0xfcd34d, intensity: 1.4,  scale: 1.03 },
    'mars':    { color: 0xef4444, intensity: 0.35, scale: 1.01 },
    'titan':   { color: 0xf59e0b, intensity: 1.2,  scale: 1.04 },
    'triton':  { color: 0xbae6fd, intensity: 0.85, scale: 1.015 },
    'io':      { color: 0xfef08a, intensity: 0.95, scale: 1.015 },
    'planet_x':{ color: 0x60a5fa, intensity: 0.22, scale: 1.02 }
  };

  const data = profiles[planetName ? planetName.toLowerCase() : ''];

  if (!data) {
    atmosphereMesh.visible = false;
    return;
  }

  atmosphereMesh.visible = true;
  atmosphereMesh.scale.setScalar(data.scale);

  if (!atmosphereMaterial.userData.isDynamic) {
    atmosphereMaterial = new THREE.ShaderMaterial({
      uniforms: { 
        uGlowIntensity: { value: data.intensity }, 
        uAtmosphereColor: { value: new THREE.Color(data.color) },
        uEnableCutout: { value: false } 
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vLocalPosCutout;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vLocalPosCutout = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uAtmosphereColor;
        uniform float uGlowIntensity;
        uniform bool uEnableCutout;
        varying vec3 vNormal;
        varying vec3 vLocalPosCutout;
        void main() {
          if (uEnableCutout && vLocalPosCutout.x > 0.0 && vLocalPosCutout.y > 0.0 && vLocalPosCutout.z > 0.0) discard;
          
          // True Fresnel: 0.0 at center, rising strictly at the outer curved limb
          float viewDot = clamp(dot(vNormal, vec3(0.0, 0.0, 1.0)), 0.0, 1.0);
          float intensity = pow(1.0 - viewDot, 3.5) * uGlowIntensity;
          
          // CRITICAL: Multiply RGB by intensity so center disk stays crystal clear
          gl_FragColor = vec4(uAtmosphereColor * intensity, intensity);
        }
      `, // <--- ADD THIS BACKTICK AND COMMA
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false
    });
    
    atmosphereMaterial.userData.isDynamic = true;
    atmosphereMesh.material = atmosphereMaterial;
    
    if (typeof window.updateCutout === 'function') window.updateCutout();
  } else {
    atmosphereMaterial.uniforms.uGlowIntensity.value = data.intensity;
    atmosphereMaterial.uniforms.uAtmosphereColor.value.setHex(data.color);
  }
}
