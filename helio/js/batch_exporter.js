/**
 * CELESTIAL BATCH EXPORTER: CINEMATIC MOON EDITION v34.0
 * Restores all high-res textures via map extraction, fixes Sun/Mercury layouts,
 * updates modal defaults, and positions the Sun on the left.
 */

document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('btn-batch-export');
  if (btn) {
    btn.addEventListener('click', async () => {
      const { confirmed, roundKm, options } = await showExportConfirmModal();
      if (!confirmed) return;

      let targetsToExport = [];
      if (options.sun) targetsToExport.push('Sun');
      if (options.planets) targetsToExport.push('Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune');
      if (options.moons) {
        targetsToExport.push(
          'Moon', 'Phobos', 'Deimos', 'Io', 'Europa', 'Ganymede', 'Callisto', 
          'Mimas', 'Enceladus', 'Tethys', 'Dione', 'Rhea', 'Titan', 'Iapetus', 
          'Miranda', 'Ariel', 'Umbriel', 'Titania', 'Oberon', 
          'Proteus', 'Triton', 'Nereid', 
          'Pluto', 'Charon', 'Eris', 'Dysnomia', 'Orcus', 'Vanth'
        );
      }

      if (targetsToExport.length === 0) {
        alert("Please select at least one category to export.");
        return;
      }

      try {
        const originalText = btn.innerHTML;
        btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i><span>Rendering Cinematic...</span>`;
        btn.classList.add('opacity-50', 'cursor-not-allowed', 'text-amber-300');
        btn.disabled = true;

        await runCinematicExporter(targetsToExport, roundKm);

        btn.innerHTML = originalText;
        btn.classList.remove('opacity-50', 'cursor-not-allowed', 'text-amber-300');
        btn.disabled = false;
      } catch (err) {
        alert("Export Error: " + err.message);
        console.error(err);
        btn.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i><span>Error (Check Console)</span>`;
      }
    });
  }
});

function showExportConfirmModal() {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4';

    overlay.innerHTML = `
      <div class="glass-panel p-6 rounded-2xl w-full max-w-md shadow-2xl border border-slate-700/80 space-y-4 text-slate-100 font-sans">
        <div class="flex items-center justify-between border-b border-slate-700/60 pb-3">
          <h3 class="font-bold text-sm text-amber-300 flex items-center gap-2">
            <i class="fa-solid fa-triangle-exclamation text-amber-400"></i>
            <span>OLD Batch Export Settings</span>
          </h3>
        </div>

        <p class="text-xs text-slate-300 leading-relaxed mb-1">
          Select the celestial categories you wish to generate high-resolution comparison images for:
        </p>

        <div class="space-y-2 mb-4 bg-slate-900/50 p-3 rounded-xl border border-slate-700/50">
          <label class="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" id="chk-export-sun" checked class="w-4 h-4 rounded text-cyan-500 bg-slate-800 border-slate-600 focus:ring-0 cursor-pointer accent-cyan-400" />
            <span class="text-sm font-medium text-slate-200 select-none">The Sun</span>
          </label>
          <label class="flex items-center gap-3 cursor-pointer mt-2">
            <input type="checkbox" id="chk-export-planets" checked class="w-4 h-4 rounded text-cyan-500 bg-slate-800 border-slate-600 focus:ring-0 cursor-pointer accent-cyan-400" />
            <span class="text-sm font-medium text-slate-200 select-none">Planets <span class="text-xs text-slate-400 font-normal">(Mercury to Neptune)</span></span>
          </label>
          <label class="flex items-center gap-3 cursor-pointer mt-2">
            <input type="checkbox" id="chk-export-moons" class="w-4 h-4 rounded text-cyan-500 bg-slate-800 border-slate-600 focus:ring-0 cursor-pointer accent-cyan-400" />
            <span class="text-sm font-medium text-slate-200 select-none">Dwarf Planets & Moons</span>
          </label>
        </div>

        <label class="flex items-center gap-3 p-3 rounded-xl bg-slate-900/70 border border-slate-800 cursor-pointer hover:bg-slate-900 transition-colors">
          <input type="checkbox" id="chk-export-round-km" checked class="w-4 h-4 rounded text-cyan-500 focus:ring-0 cursor-pointer accent-cyan-400" />
          <span class="text-xs text-slate-200 select-none">
            Round all KM measurements to the nearest 10 KM
          </span>
        </label>

        <div class="flex justify-end gap-2 pt-2">
          <button id="btn-export-cancel" class="glass-button px-3.5 py-1.5 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800">
            Cancel
          </button>
          <button id="btn-export-proceed" class="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-cyan-600/30 transition-colors">
            Proceed
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const chkSun = overlay.querySelector('#chk-export-sun');
    const chkPlanets = overlay.querySelector('#chk-export-planets');
    const chkMoons = overlay.querySelector('#chk-export-moons');
    const chkRoundKm = overlay.querySelector('#chk-export-round-km');
    const btnCancel = overlay.querySelector('#btn-export-cancel');
    const btnProceed = overlay.querySelector('#btn-export-proceed');

    const cleanup = (confirmed) => {
      const options = {
        sun: chkSun.checked,
        planets: chkPlanets.checked,
        moons: chkMoons.checked
      };
      const roundKm = chkRoundKm ? chkRoundKm.checked : true;
      overlay.remove();
      resolve({ confirmed, roundKm, options });
    };

    btnCancel.addEventListener('click', () => cleanup(false));
    btnProceed.addEventListener('click', () => cleanup(true));
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) cleanup(false);
    });
  });
}

function formatKm(value, roundToTen) {
  const exactKm = Math.max(1, Math.round(value));
  if (roundToTen) {
    const roundedTen = Math.round(exactKm / 10) * 10;
    return (roundedTen > 0 ? roundedTen : exactKm).toLocaleString();
  }
  return exactKm.toLocaleString();
}

function getVisualRadii(layers) {
  const raw = layers.map(l => l.radius);
  const n = raw.length;
  if (n <= 1) return raw;

  const vis = [...raw];
  vis[n - 1] = 1.0;
  const minBand = 0.06;

  for (let i = n - 1; i >= 1; i--) {
    if (vis[i] - vis[i - 1] < minBand) {
      vis[i - 1] = Math.max((i - 1) * minBand + 0.12, vis[i] - minBand);
    }
  }
  return vis;
}

// Local cache ensures we don't bleed custom shaders into the main 3D globe scene
const exporterMatCache = {};

function getSafeMaterial(bodyName) {
  if (exporterMatCache[bodyName]) return exporterMatCache[bodyName];
  
  let bodyColor = '#94a3b8';
  let texMap = null;
  const lower = bodyName.toLowerCase();
  
  // Safely grab base fallback colors
  if (typeof CELESTIAL_BODIES !== 'undefined' && CELESTIAL_BODIES[lower]) {
    bodyColor = CELESTIAL_BODIES[lower].color;
  } else if (typeof PLANET_MOONS !== 'undefined') {
    for (const moons of Object.values(PLANET_MOONS)) {
      const match = moons.find(m => m.name.toLowerCase() === lower);
      if (match) { bodyColor = match.color; break; }
    }
  }

  const fallbackColors = {
    'sun': '#facc15', 'mercury': '#a3a3a3', 'venus': '#fcd34d', 
    'earth': '#3b82f6', 'mars': '#ef4444', 'jupiter': '#fdb147', 
    'saturn': '#fde047', 'uranus': '#7dd3fc', 'neptune': '#3b82f6',
    'pluto': '#fca5a5', 'eris': '#d6d3d1', 'orcus': '#a8a29e'
  };
  if (fallbackColors[lower]) bodyColor = fallbackColors[lower];

  // TEXTURE EXTRACTION: Look for standard maps or custom shader uniform maps
  if (typeof planetMaterials !== 'undefined' && planetMaterials[bodyName]) {
     if (planetMaterials[bodyName].map) texMap = planetMaterials[bodyName].map;
     else if (planetMaterials[bodyName].uniforms && planetMaterials[bodyName].uniforms.globeTexture) {
         texMap = planetMaterials[bodyName].uniforms.globeTexture.value;
     }
  }
  if (!texMap && bodyName === 'Earth' && typeof earthMaterial !== 'undefined') {
     if (earthMaterial.map) texMap = earthMaterial.map;
     else if (earthMaterial.uniforms && earthMaterial.uniforms.globeTexture) {
         texMap = earthMaterial.uniforms.globeTexture.value;
     }
  }
  if (!texMap && bodyName === 'Sun' && typeof sunMaterial !== 'undefined') {
     if (sunMaterial.map) texMap = sunMaterial.map;
     else if (sunMaterial.uniforms && sunMaterial.uniforms.globeTexture) {
         texMap = sunMaterial.uniforms.globeTexture.value;
     }
  }

  // Create pristine isolated material
  const mat = new THREE.MeshStandardMaterial({ 
    color: texMap ? 0xffffff : new THREE.Color(bodyColor), 
    map: texMap,
    roughness: 0.85, 
    metalness: 0.05 
  });
  
  mat.userData.uEnableCutout = { value: false };
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uEnableCutout = mat.userData.uEnableCutout;
    shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vLocalPosCutout;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvLocalPosCutout = position;');
    shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\nuniform bool uEnableCutout;\nvarying vec3 vLocalPosCutout;').replace('void main() {', 'void main() {\nif (uEnableCutout && vLocalPosCutout.x > 0.0 && vLocalPosCutout.y > 0.0 && vLocalPosCutout.z > 0.0) discard;');
  };
  mat.customProgramCacheKey = () => 'export_mat_v34_' + bodyName;
  exporterMatCache[bodyName] = mat; 
  return mat;
}

function createProceduralRing(innerR, outerR, colorHex, opacityVal) {
  const ringGeo = new THREE.RingGeometry(innerR, outerR, 128);
  const ringMat = new THREE.MeshStandardMaterial({ 
    color: colorHex, side: THREE.DoubleSide, transparent: true, opacity: opacityVal, roughness: 0.8 
  });
  ringMat.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec2 vRingUv;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvRingUv = uv;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec2 vRingUv;')
      .replace('#include <color_fragment>', `
        #include <color_fragment>
        float rDist = vRingUv.x;
        float bands = sin(rDist * 80.0) * 0.5 + 0.5;
        bands *= sin(rDist * 200.0) * 0.5 + 0.5;
        float gap1 = smoothstep(0.65, 0.68, rDist) - smoothstep(0.68, 0.72, rDist);
        float gap2 = smoothstep(0.18, 0.20, rDist) - smoothstep(0.20, 0.23, rDist);
        float gap3 = smoothstep(0.88, 0.89, rDist) - smoothstep(0.89, 0.90, rDist);
        if (gap1 > 0.1 || gap2 > 0.1 || gap3 > 0.1) discard;
        diffuseColor.a *= (0.4 + 0.6 * bands);
        diffuseColor.rgb *= (0.7 + 0.3 * bands);
      `);
  };
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.receiveShadow = true;
  ring.castShadow = true;
  return ring;
}

async function runCinematicExporter(targetsToExport, roundKm = true) {
  console.log(`Starting Cinematic Export for ${targetsToExport.length} targets...`);

  const RADIUS = { 
    Sun: 696340,
    Mercury: 2439.7, Venus: 6051.8, Earth: 6378.1, Mars: 3389.5,
    Jupiter: 71492, Saturn: 60268, Uranus: 25362, Neptune: 24764,
    Pluto: 1188, Eris: 1163, Orcus: 458,
    Moon: 1738.1, Phobos: 13.0, Deimos: 7.8,
    Ganymede: 2634.1, Io: 1830.0, Europa: 1560.8, Callisto: 2410.3, 
    Titan: 2574.7, Enceladus: 256.6, Mimas: 207.4, Tethys: 537.6, Dione: 562.5, Rhea: 764.3, Iapetus: 746.0,
    Miranda: 240.4, Ariel: 581.1, Umbriel: 584.7, Titania: 788.9, Oberon: 761.4,
    Triton: 1353.4, Proteus: 218.0, Nereid: 170.0,
    Charon: 606.0, Dysnomia: 350.0, Vanth: 221.0
  };
  
  const POLAR_RADIUS = { 
    Sun: 696340,
    Mercury: 2439.7, Venus: 6051.8, Earth: 6356.8, Mars: 3376.2,
    Jupiter: 66854, Saturn: 54364, Uranus: 24518, Neptune: 24341,
    Pluto: 1188, Eris: 1163, Orcus: 458,
    Moon: 1736.0, Phobos: 9.2, Deimos: 5.1,
    Ganymede: 2634.1, Io: 1815.3, Europa: 1560.8, Callisto: 2410.3, 
    Titan: 2574.7, Enceladus: 249.7, Mimas: 191.1, Tethys: 525.8, Dione: 560.5, Rhea: 763.1, Iapetus: 712.4,
    Miranda: 232.9, Ariel: 577.9, Umbriel: 584.7, Titania: 788.9, Oberon: 761.4,
    Triton: 1353.4, Proteus: 201.0, Nereid: 170.0,
    Charon: 606.0, Dysnomia: 350.0, Vanth: 221.0
  }; 

  const PARENT_PLANETS = {
    Phobos: 'Mars', Deimos: 'Mars',
    Ganymede: 'Jupiter', Io: 'Jupiter', Europa: 'Jupiter', Callisto: 'Jupiter',
    Titan: 'Saturn', Enceladus: 'Saturn', Mimas: 'Saturn', Tethys: 'Saturn', Dione: 'Saturn', Rhea: 'Saturn', Iapetus: 'Saturn',
    Miranda: 'Uranus', Ariel: 'Uranus', Umbriel: 'Uranus', Titania: 'Uranus', Oberon: 'Uranus',
    Triton: 'Neptune', Proteus: 'Neptune', Nereid: 'Neptune', 
    Charon: 'Pluto', Dysnomia: 'Eris', Vanth: 'Orcus'
  };

  const canvas = document.createElement('canvas');
  canvas.width = 1920; 
  canvas.height = 1080;
  const ctx = canvas.getContext('2d');

  const exportRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  exportRenderer.setSize(1920, 1080);
  exportRenderer.shadowMap.enabled = true;
  exportRenderer.shadowMap.type = THREE.PCFSoftShadowMap;
  
  const photoScene = new THREE.Scene();
  const photoCam = new THREE.PerspectiveCamera(45, 1920/1080, 0.1, 1000);
  photoCam.position.set(0, 0, 18);

  for (let i = 0; i < targetsToExport.length; i++) {
    const target = targetsToExport[i];
    const isSun = target === 'Sun';
    const isPlanet = ['Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune'].includes(target);
    const isMoon = !isSun && !isPlanet; 
    
    const hasInterior = typeof PLANETARY_INTERIORS !== 'undefined' && !!PLANETARY_INTERIORS[target];
    
    console.log(`Rendering: ${target} | Mode: ${isSun ? 'Sun' : isPlanet ? 'Planet' : 'Moon/Dwarf'}`);
    ctx.clearRect(0, 0, 1920, 1080);

    // ==========================================
    // 0. DRAW 2D BACKGROUND 
    // ==========================================
    ctx.fillStyle = '#030712'; 
    ctx.fillRect(0, 0, 1920, 1080);

    for(let s=0; s<600; s++) {
      ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.8})`;
      ctx.beginPath();
      ctx.arc(Math.random()*1920, Math.random()*1080, Math.random()*1.5, 0, Math.PI*2);
      ctx.fill();
    }

    ctx.save();
    const grad = ctx.createRadialGradient(960, 540, 50, 960, 540, 800);
    grad.addColorStop(0, 'rgba(56, 189, 248, 0.2)');
    grad.addColorStop(1, 'rgba(56, 189, 248, 0)');
    ctx.strokeStyle = grad;
    ctx.lineWidth = 1;
    for(let x=0; x<=1920; x+=60) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 1080); ctx.stroke(); }
    for(let y=0; y<=1080; y+=60) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(1920, y); ctx.stroke(); }
    ctx.restore();

    ctx.save();
    ctx.beginPath();
    ctx.ellipse(1150, 850, 600, 80, 0, 0, Math.PI * 2);
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 100;
    ctx.fillStyle = 'rgba(56, 189, 248, 0.05)';
    ctx.fill();
    ctx.restore();

    // ==========================================
    // 1. PASS ONE: RIGHT SCALED PLANETS & PLANE
    // ==========================================
    const ambientRight = new THREE.AmbientLight(0xffffff, 0.15);
    const lightRight = new THREE.DirectionalLight(0xffffff, 1.8);
    lightRight.position.set(-5, 5, 2); 
    lightRight.castShadow = true;
    lightRight.shadow.mapSize.width = 2048;
    lightRight.shadow.mapSize.height = 2048;
    photoScene.add(ambientRight, lightRight);

    const planeMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.85, roughness: 0.15 });
    planeMat.onBeforeCompile = (shader) => {
      shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nvarying vec2 vProceduralUV;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvProceduralUV = uv;');
      shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec2 vProceduralUV;').replace('#include <color_fragment>', `#include <color_fragment>\nvec2 grid = abs(fract(vProceduralUV * vec2(30.0, 15.0)) - 0.5) * 2.0;\nfloat lineIntensity = smoothstep(0.82, 0.95, max(grid.x, grid.y));\ndiffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.7, 0.9, 1.0), lineIntensity * 0.8);`);
    };

    const planeWidth = isMoon ? 13.5 : 30.0;
    const planeX = isMoon ? 5.4 : 0.0;
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(planeWidth, 8), planeMat);
    plane.rotation.x = -Math.PI / 2;
    plane.position.set(planeX, -4.0, 0);
    plane.receiveShadow = true;
    photoScene.add(plane);

    let lineup = [];
    let positionsX = [];
    let scaleFactor = 1.0;

    if (isSun) {
      lineup = ['Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune'];
      positionsX = [-1.5, -0.5, 0.5, 1.5, 4.5, 8.5, 11.5, 13.5]; // Shifted right so they don't clip the left-anchored Sun
      scaleFactor = 1.3 / RADIUS['Jupiter'];
    } else if (isPlanet) {
      scaleFactor = 3.78 / RADIUS[target];
      if (target === 'Earth') {
        lineup = ['Ganymede', 'Titan', 'Callisto', 'Io', 'Moon'];
        positionsX = [-0.5, 3.0, 6.2, 9.0, 11.5]; 
      } else if (target === 'Mars' || target === 'Mercury') {
        lineup = ['Moon', 'Earth'];
        const scaledEarthR = RADIUS['Earth'] * scaleFactor;
        const scaledMoonR = RADIUS['Moon'] * scaleFactor;
        
        // Pushes Earth almost entirely off screen to the right, Moon sits comfortably left of Earth
        const earthX = 14.0; 
        const moonX = earthX - scaledEarthR - 1.5 - scaledMoonR;
        positionsX = [moonX, earthX];
      } else {
        lineup = ['Moon', 'Earth']; 
        const scaledMoonR = RADIUS['Moon'] * scaleFactor;
        const scaledEarthR = RADIUS['Earth'] * scaleFactor;
        const gap = 4.0;
        const totalW = (scaledMoonR * 2) + gap + (scaledEarthR * 2);
        
        const groupStart = 8.0 - (totalW / 2);
        const moonX = groupStart + scaledMoonR;
        const earthX = moonX + scaledMoonR + gap + scaledEarthR;
        positionsX = [moonX, earthX];
      }
    } else {
      lineup = [target, 'Moon', 'Earth'];
      positionsX = [0.1, 3.9, 8.1]; 
      if (target === 'Moon') {
        lineup = ['Moon', 'Earth'];
        positionsX = [3.9, 8.1];
      }
      scaleFactor = 3.63 / RADIUS['Earth'];
    }

    const rightMeshes = [];
    lineup.forEach((bodyName, index) => {
      const r = RADIUS[bodyName] * scaleFactor;
      const mat = getSafeMaterial(bodyName);
      if (mat.userData && mat.userData.uEnableCutout) mat.userData.uEnableCutout.value = false;
      
      const sphere = new THREE.Mesh(new THREE.SphereGeometry(r, 64, 64), mat);
      sphere.position.set(positionsX[index], plane.position.y + r, 0); 
      sphere.castShadow = true;

      if (bodyName === 'Saturn') {
        const ring = createProceduralRing(r * 1.3, r * 2.3, 0xd4d4ce, 0.85);
        ring.rotation.x = Math.PI / 2 + 0.3;
        ring.rotation.y = -0.2;
        sphere.add(ring);
      }
      
      photoScene.add(sphere);
      rightMeshes.push(sphere);
    });

    let pMesh = null;
    const parentName = PARENT_PLANETS[target];
    if (parentName && isMoon) {
      const pMat = getSafeMaterial(parentName);
      if (pMat.userData && pMat.userData.uEnableCutout) pMat.userData.uEnableCutout.value = false;
      pMesh = new THREE.Mesh(new THREE.SphereGeometry(0.7, 64, 64), pMat);
      pMesh.position.set(-10.95, 5.5, 0); 
      pMesh.castShadow = true;

      if (parentName === 'Saturn') {
        const ring = createProceduralRing(0.9, 1.6, 0xd4d4ce, 0.85);
        ring.rotation.x = Math.PI / 2 + 0.3;
        ring.rotation.y = -0.2;
        pMesh.add(ring);
      }
      photoScene.add(pMesh);
    }

    exportRenderer.render(photoScene, photoCam);
    ctx.drawImage(exportRenderer.domElement, 0, 0, 1920, 1080); 

    // Remove Pass One items so they aren't double lit
    photoScene.remove(ambientRight, lightRight, plane);
    rightMeshes.forEach(m => photoScene.remove(m));
    if (pMesh) photoScene.remove(pMesh);


    // ==========================================
    // 2. PASS TWO: FOCUS OBJECT
    // ==========================================
    const ambientLeft = new THREE.AmbientLight(0xffffff, 0.1);
    const lightLeft = new THREE.DirectionalLight(0xffffff, 1.8);
    lightLeft.position.set(5, 5, 5); 
    photoScene.add(ambientLeft, lightLeft);

    const safeMat = getSafeMaterial(target);
    const focusRadius = 3.78; 
    const focusSphere = new THREE.Mesh(new THREE.SphereGeometry(focusRadius, 64, 64), safeMat);
    
    let fY = -0.5; 
    if (isPlanet) fY = -0.22; 
    if (isSun) fY = 0.65; // Sun pushed up ~50 pixels

    // Sun moves to the Left side completely
    focusSphere.position.set(-7.0, fY, 0);
    focusSphere.rotation.set(0.3, -0.1, 0); 

    if (['Jupiter', 'Saturn', 'Uranus', 'Neptune'].includes(target)) {
      let ringIn = 1.3, ringOut = 2.3, rColor = 0xd4d4ce, rOpac = 0.85;
      if (target === 'Jupiter') { ringIn = 1.2; ringOut = 1.8; rColor = 0x888888; rOpac = 0.25; }
      if (target === 'Uranus')  { ringIn = 1.4; ringOut = 2.0; rColor = 0xaaaaaa; rOpac = 0.45; }
      if (target === 'Neptune') { ringIn = 1.4; ringOut = 1.9; rColor = 0x888888; rOpac = 0.35; }

      const ring = createProceduralRing(focusRadius * ringIn, focusRadius * ringOut, rColor, rOpac);
      ring.rotation.x = Math.PI / 2;
      focusSphere.add(ring);
    }
    
    if (hasInterior && focusSphere.material.userData && focusSphere.material.userData.uEnableCutout) {
      focusSphere.material.userData.uEnableCutout.value = true;
    }
    
    let interior = null;
    if (hasInterior) {
      interior = createExportInterior(target, focusRadius);
      if (interior) {
        interior.position.copy(focusSphere.position);
        interior.rotation.copy(focusSphere.rotation);
        photoScene.add(interior);
      }
    }
    photoScene.add(focusSphere);

    exportRenderer.render(photoScene, photoCam);
    ctx.drawImage(exportRenderer.domElement, 0, 0, 1920, 1080);


    // ==========================================
    // 3. DRAW 2D OVERLAYS & TEXT
    // ==========================================
    focusSphere.updateMatrixWorld();

    if (hasInterior) {
      const layers = PLANETARY_INTERIORS[target].layers;
      const visRadii = getVisualRadii(layers);
      let labelYOffset = 230; 
      
      [...layers].reverse().forEach((layer, revIdx) => {
        const origIdx = layers.length - 1 - revIdx;
        const prevTrueFrac = origIdx > 0 ? layers[origIdx - 1].radius : 0.0;
        const rawLayerDepthKm = layer.depth !== undefined
          ? layer.depth
          : Math.max(1, Math.round((layer.radius - prevTrueFrac) * RADIUS[target]));

        const prevVisFrac = origIdx > 0 ? visRadii[origIdx - 1] : 0.0;
        const currVisFrac = visRadii[origIdx];
        const midVisFrac = origIdx === 0
          ? currVisFrac * 0.38
          : (prevVisFrac + currVisFrac) * 0.5;

        const localR = midVisFrac * focusRadius;
        
        const point3D = origIdx === 0
          ? new THREE.Vector3(localR * 0.45, localR * 0.65, localR * 0.60)
          : new THREE.Vector3(localR * 0.5, localR * 0.866, 0);

        point3D.applyMatrix4(focusSphere.matrixWorld);
        point3D.project(photoCam);

        const screenX = (point3D.x * 0.5 + 0.5) * 1920;
        const screenY = (point3D.y * -0.5 + 0.5) * 1080;

        const elbowStart = screenX + 25; 
        const elbowEndX = Math.max(screenX + 90, 680); 

        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(screenX, screenY, 3.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = 'rgba(56, 189, 248, 0.85)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(screenX, screenY);
        ctx.lineTo(elbowStart, screenY); 
        ctx.lineTo(elbowEndX, labelYOffset - 8); 
        ctx.lineTo(elbowEndX + 45, labelYOffset - 8); 
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'left';
        ctx.font = '22px "Trebuchet MS", sans-serif';
        ctx.fillText(layer.name.toUpperCase(), elbowEndX + 60, labelYOffset - 1);

        ctx.fillStyle = '#38bdf8';
        ctx.font = '20px "Trebuchet MS", sans-serif';
        ctx.fillText(`${formatKm(rawLayerDepthKm, roundKm)} km`, elbowEndX + 60, labelYOffset + 25);

        labelYOffset += 85; 
      });
    }

    const focusPos3D = new THREE.Vector3().setFromMatrixPosition(focusSphere.matrixWorld).project(photoCam);
    const focusTextX = (focusPos3D.x * 0.5 + 0.5) * 1920;
    const focusTextY = (focusPos3D.y * -0.5 + 0.5) * 1080;

    const eqDiamVal = RADIUS[target] * 2;
    const focusCircumferenceVal = eqDiamVal * Math.PI;
    const polarDiamVal = (POLAR_RADIUS[target] || RADIUS[target]) * 2;

    if (!isSun) {
      const eqLeft3D = new THREE.Vector3(-7.0 - focusRadius, fY, 0).project(photoCam);
      const eqRight3D = new THREE.Vector3(-7.0 + focusRadius, fY, 0).project(photoCam);
      const topEdge3D = new THREE.Vector3(-7.0, fY + focusRadius, 0).project(photoCam);
      const botEdge3D = new THREE.Vector3(-7.0, fY - focusRadius, 0).project(photoCam);

      const eqLeftX = (eqLeft3D.x * 0.5 + 0.5) * 1920;
      const eqRightX = (eqRight3D.x * 0.5 + 0.5) * 1920;
      const topEdgeY = (topEdge3D.y * -0.5 + 0.5) * 1080;
      const botEdgeY = (botEdge3D.y * -0.5 + 0.5) * 1080;

      const focusDiameterText = `${formatKm(eqDiamVal, roundKm)} km (diameter)`;
      ctx.font = '22px "Trebuchet MS", sans-serif';
      const focusTextWidth = ctx.measureText(focusDiameterText).width;
      const focusLineY = 963;
      const padding = 15;

      ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
      ctx.lineWidth = 1.5;
      
      ctx.beginPath(); ctx.moveTo(eqLeftX, focusLineY); ctx.lineTo(focusTextX - (focusTextWidth / 2) - padding, focusLineY); ctx.moveTo(eqLeftX, focusLineY - 5); ctx.lineTo(eqLeftX, focusLineY + 5); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(focusTextX + (focusTextWidth / 2) + padding, focusLineY); ctx.lineTo(eqRightX, focusLineY); ctx.moveTo(eqRightX, focusLineY - 5); ctx.lineTo(eqRightX, focusLineY + 5); ctx.stroke();

      ctx.textAlign = 'center';
      ctx.fillStyle = '#38bdf8';
      ctx.fillText(focusDiameterText, focusTextX, 970);

      ctx.fillStyle = '#94a3b8';
      ctx.fillText(`${formatKm(focusCircumferenceVal, roundKm)} km (Circumference)`, focusTextX, 1010);

      const polarDiameterText = `${formatKm(polarDiamVal, roundKm)} km (polar diameter)`;
      const polarTextWidth = ctx.measureText(polarDiameterText).width;
      const polarTextX = eqLeftX - 80; 
      const polarTextY = focusTextY;

      ctx.beginPath(); ctx.moveTo(polarTextX, topEdgeY); ctx.lineTo(polarTextX, polarTextY - (polarTextWidth / 2) - padding); ctx.moveTo(polarTextX - 5, topEdgeY); ctx.lineTo(polarTextX + 5, topEdgeY); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(polarTextX, botEdgeY); ctx.lineTo(polarTextX, polarTextY + (polarTextWidth / 2) + padding); ctx.moveTo(polarTextX - 5, botEdgeY); ctx.lineTo(polarTextX + 5, botEdgeY); ctx.stroke();

      ctx.save();
      ctx.translate(polarTextX, polarTextY);
      ctx.rotate(-Math.PI / 2); 
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle'; 
      ctx.fillStyle = '#38bdf8'; 
      ctx.fillText(polarDiameterText, 0, 0);
      ctx.restore();
    } else {
      ctx.textAlign = 'right';
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 32px "Trebuchet MS", sans-serif';
      ctx.fillText(`DIAMETER: ${formatKm(eqDiamVal, roundKm)} km`, 1860, 220);
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 24px "Trebuchet MS", sans-serif';
      ctx.fillText(`CIRCUMFERENCE: ${formatKm(focusCircumferenceVal, roundKm)} km`, 1860, 260);
    }

    // Right-Side Text Draw
    rightMeshes.forEach((sphere, index) => {
      const bodyName = lineup[index];
      
      sphere.updateMatrixWorld();
      const pos3D = new THREE.Vector3();
      pos3D.setFromMatrixPosition(sphere.matrixWorld);
      pos3D.project(photoCam);
      const textX = (pos3D.x * 0.5 + 0.5) * 1920; 
      
      ctx.font = isSun ? 'bold 18px "Trebuchet MS", sans-serif' : 'bold 24px "Trebuchet MS", sans-serif';
      const textWidth = ctx.measureText(bodyName.toUpperCase()).width;
      const width = isSun ? Math.max((textWidth / 2) + 10, 50) : Math.max((textWidth / 2) + 20, 85); 
      
      const topY = 910;
      const botY = isSun ? 975 : 980;

      ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(textX - width + 10, topY); ctx.lineTo(textX - width, topY); ctx.lineTo(textX - width, botY); ctx.lineTo(textX - width + 10, botY); ctx.moveTo(textX + width - 10, topY); ctx.lineTo(textX + width, topY); ctx.lineTo(textX + width, botY); ctx.lineTo(textX + width - 10, botY); ctx.stroke();
      
      ctx.textAlign = 'center';
      ctx.fillStyle = '#e2e8f0';
      ctx.fillText(bodyName.toUpperCase(), textX, isSun ? 930 : 935);
      
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.fillRect(textX - 70, 945, 140, 2); 
      
      const listDiamVal = RADIUS[bodyName] * 2;
      const listCircVal = listDiamVal * Math.PI;

      ctx.fillStyle = '#38bdf8';
      ctx.font = isSun ? '17px "Trebuchet MS", sans-serif' : '22px "Trebuchet MS", sans-serif';
      ctx.fillText(`${formatKm(listDiamVal, roundKm)} km`, textX, isSun ? 965 : 970); 

      ctx.fillStyle = '#94a3b8';
      ctx.font = isSun ? '15px "Trebuchet MS", sans-serif' : '22px "Trebuchet MS", sans-serif';
      ctx.fillText(`${formatKm(listCircVal, roundKm)} km`, textX, isSun ? 1000 : 1010); 
    });


    // ==========================================
    // 4. HI-TECH BORDER 
    // ==========================================
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.15)';
    ctx.lineWidth = 2;
    ctx.strokeRect(40, 40, 1840, 1000);

    ctx.strokeStyle = 'rgba(56, 189, 248, 0.8)';
    ctx.lineWidth = 4;
    const L = 40;
    ctx.beginPath(); ctx.moveTo(40, 40+L); ctx.lineTo(40, 40); ctx.lineTo(40+L, 40); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(1880-L, 40); ctx.lineTo(1880, 40); ctx.lineTo(1880, 40+L); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(40, 1040-L); ctx.lineTo(40, 1040); ctx.lineTo(40+L, 1040); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(1880-L, 1040); ctx.lineTo(1880, 1040); ctx.lineTo(1880, 1040-L); ctx.stroke();

    const earthPx = 526; 
    const midY = 540;
    const eTop = midY - earthPx/2;
    const eBot = midY + earthPx/2;

    ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)';
    ctx.lineWidth = 2;
    
    ctx.beginPath(); ctx.moveTo(40, eTop); ctx.lineTo(60, eTop); ctx.moveTo(40, eBot); ctx.lineTo(60, eBot); ctx.moveTo(40, midY); ctx.lineTo(50, midY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(1880, eTop); ctx.lineTo(1860, eTop); ctx.moveTo(1880, eBot); ctx.lineTo(1860, eBot); ctx.moveTo(1880, midY); ctx.lineTo(1870, midY); ctx.stroke();

    // ==========================================
    // 5. TITLES & EXPORT
    // ==========================================
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 44px "Trebuchet MS", sans-serif';
    ctx.fillText("CELESTIAL SIZE COMPARISON", 960, 100);
    
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 54px "Trebuchet MS", sans-serif';
    ctx.fillText(target.toUpperCase(), 960, 160);

    if (pMesh && parentName && isMoon) {
      pMesh.updateMatrixWorld();
      const pCenter3D = new THREE.Vector3(-10.95, 5.5, 0).project(photoCam);
      const px = (pCenter3D.x * 0.5 + 0.5) * 1920;
      const pBot3D = new THREE.Vector3(-10.95, 5.5 - 0.7, 0).project(photoCam);
      const pBotY = (pBot3D.y * -0.5 + 0.5) * 1080;

      ctx.textAlign = 'center';
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 27px "Trebuchet MS", sans-serif'; 
      ctx.fillText(parentName.toUpperCase(), px, pBotY + 48); 
    }

    const link = document.createElement('a');
    link.download = `Celestial_Comparison_${target}.jpg`;
    link.href = canvas.toDataURL('image/jpeg', 0.95);
    link.click();

    photoScene.remove(ambientLeft, lightLeft, focusSphere);
    if (interior) photoScene.remove(interior);

    await new Promise(res => setTimeout(res, 800)); 
  }

  exportRenderer.dispose();
  console.log("Cinematic Export Complete!");
}

const exportCapVertexShader = `
  varying vec3 vLocalPos;
  void main() {
    vLocalPos = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const exportCapFragmentShader = `
  uniform float uRadii[5];
  uniform vec3 uColors[5];
  uniform int uLayerTypes[5];
  uniform int uLayerCount;
  uniform bool uIsGas;

  varying vec3 vLocalPos;

  float hash3(vec3 p) {
    p = fract(p * 0.3183099 + 0.1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }

  float noise3(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hash3(i + vec3(0,0,0)), hash3(i + vec3(1,0,0)), f.x),
          mix(hash3(i + vec3(0,1,0)), hash3(i + vec3(1,1,0)), f.x), f.y),
      mix(mix(hash3(i + vec3(0,0,1)), hash3(i + vec3(1,0,1)), f.x),
          mix(hash3(i + vec3(0,1,1)), hash3(i + vec3(1,1,1)), f.x), f.y), f.z);
  }

  float fbm3(vec3 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 4; i++) {
      v += a * noise3(p);
      p = p * 2.05 + vec3(13.7, 7.2, 5.1);
      a *= 0.5;
    }
    return v;
  }

  void main() {
    float r = length(vLocalPos) / 5.0;
    if (r > 1.0) discard;

    if (uIsGas) {
      vec3 gasColor = uColors[0];
      for (int i = 0; i < 4; i++) {
        if (i + 1 < uLayerCount) {
          float prevR = uRadii[i];
          float nextR = uRadii[i + 1];
          float t = clamp((r - prevR) / max(nextR - prevR, 0.001), 0.0, 1.0);
          if (r >= prevR) gasColor = mix(uColors[i], uColors[i + 1], t);
        }
      }
      float band = fbm3(vLocalPos * 2.5 + vec3(r * 12.0));
      gasColor *= (0.9 + 0.2 * band);
      gl_FragColor = vec4(gasColor, 1.0);
      return;
    }

    vec3 baseColor = uColors[uLayerCount - 1];
    int matType = uLayerTypes[uLayerCount - 1];
    float distToBorder = 1.0;

    for (int i = 0; i < 5; i++) {
      if (i < uLayerCount) {
        if (r <= uRadii[i]) {
          baseColor = uColors[i];
          matType = uLayerTypes[i];
          distToBorder = abs(r - uRadii[i]);
          if (i > 0) distToBorder = min(distToBorder, abs(r - uRadii[i - 1]));
          break;
        }
      }
    }

    vec3 finalColor = baseColor;
    float n = fbm3(vLocalPos * 4.5);

    if (matType == 1) {
      float cracks = 1.0 - abs(noise3(vLocalPos * 9.0 + n * 2.0) * 2.0 - 1.0);
      cracks = pow(cracks, 4.0);
      finalColor = mix(baseColor * (0.88 + 0.24 * n), vec3(0.92, 0.98, 1.0), cracks * 0.45);
    } else if (matType == 3) {
      float veins = 1.0 - abs(noise3(vLocalPos * 6.5 + n * 2.5) * 2.0 - 1.0);
      veins = smoothstep(0.55, 0.92, veins);
      finalColor = mix(baseColor * 0.65, vec3(1.0, 0.65, 0.2), veins * 0.65);
    } else {
      float strata = sin(r * 75.0 + n * 5.0) * 0.5 + 0.5;
      finalColor = baseColor * (0.78 + 0.34 * n + 0.10 * strata);
    }

    float borderEdge = smoothstep(0.0, 0.006, distToBorder);
    finalColor *= (0.35 + 0.65 * borderEdge);

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

function createExportInterior(planetName, targetRadius) {
  const data = PLANETARY_INTERIORS[planetName];
  if (!data) return null;

  const group = new THREE.Group();
  const visRadii = getVisualRadii(data.layers);
  const uRadii = [], uColors = [], uLayerTypes = [];
  
  for (let i = 0; i < 5; i++) {
    if (i < data.layers.length) {
      uRadii.push(visRadii[i]);
      uColors.push(new THREE.Color(data.layers[i].color));
      const lName = (data.layers[i].name || '').toLowerCase();
      let matType = 0;
      if (lName.includes('lava') || lName.includes('magma') || lName.includes('molten') || lName.includes('asthenosphere')) matType = 3;
      else if (lName.includes('ice') || lName.includes('ocean') || lName.includes('water') || lName.includes('hydrosphere')) matType = 1;
      else if (i === 0 || lName.includes('core') || lName.includes('iron') || lName.includes('metallic')) matType = 2;
      uLayerTypes.push(matType);
    } else {
      uRadii.push(0.0);
      uColors.push(new THREE.Color(0x000000));
      uLayerTypes.push(0);
    }
  }

  const capMat = new THREE.ShaderMaterial({
    vertexShader: exportCapVertexShader,
    fragmentShader: exportCapFragmentShader,
    uniforms: {
      uRadii: { value: uRadii },
      uColors: { value: uColors },
      uLayerTypes: { value: uLayerTypes },
      uLayerCount: { value: data.layers.length },
      uIsGas: { value: data.isGas }
    },
    side: THREE.DoubleSide
  });

  const r = 5.0; 

  const planes = [
    new THREE.Mesh(new THREE.CircleGeometry(r, 32, 0, Math.PI/2), capMat),
    new THREE.Mesh(new THREE.CircleGeometry(r, 32, 0, Math.PI/2), capMat),
    new THREE.Mesh(new THREE.CircleGeometry(r, 32, 0, Math.PI/2), capMat)
  ];
  planes[0].rotation.set(0, 0, 0);
  planes[1].rotation.set(Math.PI/2, 0, 0);
  planes[2].rotation.set(0, -Math.PI/2, 0);
  planes.forEach(p => group.add(p));

  const innerRadius = visRadii[0] * r;
  const coreMat = new THREE.MeshStandardMaterial({
    color: data.layers[0].color,
    roughness: 1.0,
    metalness: 0.0
  });

  coreMat.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>\nvarying vec3 vLocalPosCutout;`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>\nvLocalPosCutout = position;`);

    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>
        varying vec3 vLocalPosCutout;
        float coreHash(vec3 p) {
          p = fract(p * 0.3183099 + 0.1);
          p *= 17.0;
          return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
        }
        float coreNoise(vec3 x) {
          vec3 i = floor(x);
          vec3 f = fract(x);
          f = f * f * (3.0 - 2.0 * f);
          return mix(
            mix(mix(coreHash(i + vec3(0,0,0)), coreHash(i + vec3(1,0,0)), f.x),
                mix(coreHash(i + vec3(0,1,0)), coreHash(i + vec3(1,1,0)), f.x), f.y),
            mix(mix(coreHash(i + vec3(0,0,1)), coreHash(i + vec3(1,0,1)), f.x),
                mix(coreHash(i + vec3(0,1,1)), coreHash(i + vec3(1,1,1)), f.x), f.y), f.z);
        }
        float coreFbm(vec3 p) {
          float v = 0.0, a = 0.5;
          for (int i = 0; i < 4; i++) {
            v += a * coreNoise(p);
            p = p * 2.05 + vec3(11.3, 7.1, 5.7);
            a *= 0.5;
          }
          return v;
        }
      `)
      .replace('#include <color_fragment>', `#include <color_fragment>
        vec3 normPos = normalize(vLocalPosCutout) * 4.5;
        float n = coreFbm(normPos);
        float ridge = 1.0 - abs(coreNoise(normPos * 2.2 + n * 1.8) * 2.0 - 1.0);
        float cracks = smoothstep(0.62, 0.94, ridge);
        float metalGrain = coreNoise(normPos * 14.0);

        float warmth = clamp((diffuseColor.r - diffuseColor.b) * 2.2, 0.0, 1.0);
        vec3 baseLook = diffuseColor.rgb * (0.65 + 0.45 * n + 0.20 * metalGrain);
        vec3 magmaGlow = mix(diffuseColor.rgb * 1.15, vec3(1.0, 0.88, 0.45), cracks * 0.75);
        diffuseColor.rgb = mix(baseLook, magmaGlow, cracks * (0.35 + 0.5 * warmth));
      `)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        totalEmissiveRadiance += diffuseColor.rgb * 0.35;
      `);
  };
  coreMat.customProgramCacheKey = () => 'export_core_mat_v34_' + planetName;

  const coreSphere = new THREE.Mesh(new THREE.SphereGeometry(innerRadius, 64, 64), coreMat);
  group.add(coreSphere);

  const seamLength = r - innerRadius;
  const seamCenter = innerRadius + (seamLength / 2);
  const seamRadius = r * 0.003; 
  const seamMat = new THREE.MeshBasicMaterial({ color: 0x000000 });

  const seamX = new THREE.Mesh(new THREE.CylinderGeometry(seamRadius, seamRadius, seamLength, 8), seamMat);
  seamX.rotation.z = Math.PI / 2;
  seamX.position.set(seamCenter, 0, 0);
  group.add(seamX);

  const seamY = new THREE.Mesh(new THREE.CylinderGeometry(seamRadius, seamRadius, seamLength, 8), seamMat);
  seamY.position.set(0, seamCenter, 0);
  group.add(seamY);

  const seamZ = new THREE.Mesh(new THREE.CylinderGeometry(seamRadius, seamRadius, seamLength, 8), seamMat);
  seamZ.rotation.x = Math.PI / 2;
  seamZ.position.set(0, 0, seamCenter);
  group.add(seamZ);

  group.scale.setScalar(targetRadius / 5.0);
  return group;
}
