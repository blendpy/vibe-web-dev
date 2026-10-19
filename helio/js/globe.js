// =============================================================
// GLOBE.JS - Core 3D Rendering & Visualization Engine
// =============================================================

let scene = null, camera = null, renderer = null, controls = null;
let raycaster = null, mouseVector = null;
let headlight = null, ambientLight = null;

let globeGroup = null;
let earthMesh = null, globeGeometry = null, earthMaterial = null;
let atmosphereMesh = null, atmosphereMaterial = null;

let graticuleGroup = null;
let celestialEquatorGroup = null;
let constellationsGroup = null;
let starfieldPoints = null;
let cloudMesh = null, venusCloudMesh = null, marsDustMesh = null;

let planetRingGroup = null;
let planetXRingMesh = null;
let planetPins = {};

let userPinGroup = null, sunPinGroup = null, moonPinGroup = null, earthPinGroup = null;

let celestialGroup = null;
let sunMesh = null, moonMesh = null, celestialSunLight = null;
let earthSkyMesh = null, earthSkyMaterial = null, sunHalo = null;

let parentSkyGroup = null;
let parentSkyMesh = null;
let parentSkyRingMesh = null;
let parentSkyMaterial = null;
let parentSkyRingMaterial = null;

let planetaryMoonsGroup = null;
const giantMoonMeshes = [];

let currentPlanet = 'earth';
const planetMaterials = {};

// Centralized Three.js disposal helper
function clearGroup(group) {
  if (!group) return;
  while (group.children.length > 0) {
    const child = group.children[0];
    if (child.geometry) child.geometry.dispose();
    if (child.material) {
      if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
      else child.material.dispose();
    }
    group.remove(child);
  }
}

// Helper: Determine if a body is a planet with moons or is itself a moon
function getParentPlanet(bodyName) {
  if (typeof PLANET_MOONS === 'undefined') return null;
  if (PLANET_MOONS[bodyName]) return bodyName;
  for (const [pName, moons] of Object.entries(PLANET_MOONS)) {
    if (moons.some(m => m.name.toLowerCase() === bodyName.toLowerCase())) {
      return pName;
    }
  }
  return null;
}

let activeHeliosCategory = 'planets';

window.lunarLandersGroup = window.lunarLandersGroup || null;
window.marsLandersGroup = window.marsLandersGroup || null;
window.venusLandersGroup = window.venusLandersGroup || null;

function loadTextureWithFallback(primaryUrl, fallbackUrl, onLoad, onFail) {
  const loader = new THREE.TextureLoader();
  loader.load(
    primaryUrl,
    (texture) => {
      texture.needsUpdate = true;
      if (onLoad) onLoad(texture);
    },
    undefined, 
    () => {
      if (fallbackUrl) {
        loader.load(
          fallbackUrl,
          (texture) => {
            texture.needsUpdate = true;
            if (onLoad) onLoad(texture);
          },
          undefined,
          (err) => {
            console.error(`Failed to load texture from fallback: ${fallbackUrl}`, err);
            if (onFail) onFail(); 
          }
        );
      } else {
        if (onFail) onFail(); 
      }
    }
  );
}

function latLonToVector3(lat, lng, radius = 5.0) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -(radius * Math.sin(phi) * Math.cos(theta)),
     radius * Math.cos(phi),
     radius * Math.sin(phi) * Math.sin(theta)
  );
}

// GLOBAL - Map & Boundary State
let activeContinent = 'N. America';
let countryBordersMesh = null, stateBordersMesh = null;
let countryColorsMesh = null, landmarksMeshGroup = null;
let countryHoverMesh = null, hoverCanvas = null, hoverCtx = null;
let hoverTexture = null, hoveredFeature = null;

const planetCloudStates = { earth: false, venus: true, mars: true, titan: true, triton: true, io: true, Callisto: true };

let currentSunLat = 0, currentSunLon = 0;
let currentMoonLat = 0, currentMoonLon = 0;

let isPlaying = false, isRealtimeSync = true, isReverse = false, simSpeed = 2000;
let currentSimTime = new Date();
let lastFrameTime = performance.now();

let activeUserLocation = null, isLocationFetched = false;
let eclipseCategoryFilter = 'Solar', eclipseCoverageFilter = 'Full';

let lastHoverCheck = 0;
let pendingHoverEvent = null;

// --- DYNAMIC SHADER INJECTION HELPER ---
function injectCutoutShader(material, cacheName) {
  material.userData = material.userData || {};
  material.userData.uEnableCutout = { value: false };
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uEnableCutout = material.userData.uEnableCutout;
    shader.vertexShader = shader.vertexShader.replace(
      '#include <common>', '#include <common>\nvarying vec3 vLocalPosCutout;'
    ).replace(
      '#include <begin_vertex>', '#include <begin_vertex>\nvLocalPosCutout = position;'
    );
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <common>', '#include <common>\nuniform bool uEnableCutout;\nvarying vec3 vLocalPosCutout;'
    ).replace(
      'void main() {', 'void main() {\nif (uEnableCutout && vLocalPosCutout.x > 0.0 && vLocalPosCutout.y > 0.0 && vLocalPosCutout.z > 0.0) discard;'
    );
  };
  material.customProgramCacheKey = () => cacheName + (material.map ? '_mapped' : '_nomap');
}

function initPlanetMaterials() {
  planetMaterials['earth'] = earthMaterial;

  const fallbackColors = {
    sun: 0xffffff,
    moon: 0x94a3b8, mercury: 0xa3a3a3, venus: 0xfcd34d, mars: 0xef4444,
    jupiter: 0xfdb147, saturn: 0xfde047, uranus: 0x7dd3fc, neptune: 0x3b82f6,
    planet_x: 0x090e18
  };

  Object.keys(fallbackColors).forEach(p => {
    if (p === 'earth') return;
    
    planetMaterials[p] = new THREE.MeshStandardMaterial({
      color: fallbackColors[p], 
      roughness: 0.85, 
      metalness: 0.05
    });

    if (p === 'sun') {
      planetMaterials[p].emissive = new THREE.Color(fallbackColors[p]);
      planetMaterials[p].emissiveIntensity = 1.0;
      planetMaterials[p].color = new THREE.Color(0x000000); 
    }
    
    injectCutoutShader(planetMaterials[p], 'cutout_mat_' + p);
  });
}

function loadPlanetTextureOnDemand(rawPlanetName) {
  if (!rawPlanetName) return;
  const planetKey = rawPlanetName;
  const targetStr = rawPlanetName.trim().toLowerCase();
  
  if (planetKey === 'earth' || !planetMaterials[planetKey]) return;
  const mat = planetMaterials[planetKey];
  if (mat.map) return; 

  const parentPlanet = typeof getParentPlanet === 'function' ? getParentPlanet(planetKey) : null;
  const isActuallyAMoon = parentPlanet && parentPlanet.toLowerCase() !== targetStr;
  const dwarfPlanets = ['pluto'];
  const isDwarfPlanet = dwarfPlanets.includes(targetStr);

  const primaryUrl = isActuallyAMoon ? encodeURI(`texture/moons/${parentPlanet.toLowerCase()} ${targetStr}.jpg`)
    : isDwarfPlanet ? encodeURI(`texture/dwarfs/${targetStr}.jpg`)
    : encodeURI(`texture/planets/${targetStr}.jpg`);

  let fallbackUrl = null;
  if (targetStr === 'sun') {
    fallbackUrl = 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@dev/examples/textures/planets/sun.jpg';
  }
  
  const originalColor = mat.color.clone();

  loadTextureWithFallback(
    primaryUrl, 
    fallbackUrl, 
    (tex) => {
      mat.map = tex;
      if (targetStr === 'sun') { mat.emissiveMap = tex; mat.emissive.setHex(0xffffff); }
      mat.color.setHex(0xffffff); 
      mat.needsUpdate = true;
    },
    () => {
      if (targetStr === 'planet_x') {
        mat.map = createProceduralPlanetXTexture();
        mat.color.setHex(0xffffff);
        mat.needsUpdate = true;
      } else if (targetStr !== 'sun') {
        setTimeout(() => {
          mat.map = createProceduralMoonTexture(originalColor);
          mat.color.setHex(0xffffff); 
          mat.needsUpdate = true;
        }, 10);
      }
    }
  );
}

window.updateCutout = function() {
  const chk = document.getElementById('chk-interior') || document.getElementById('chk-cutout');
  const state = chk ? chk.checked : false;
  
  const targetMaterials = [
    earthMesh?.material,
    cloudMesh?.material,
    venusCloudMesh?.material,
    marsDustMesh?.material,
    atmosphereMaterial
  ];

  if (typeof planetMaterials !== 'undefined') {
    Object.values(planetMaterials).forEach(mat => {
      if (mat && !targetMaterials.includes(mat)) {
        targetMaterials.push(mat);
      }
    });
  }

  targetMaterials.forEach(mat => {
    if (!mat) return;
    if (mat.uniforms && mat.uniforms.uEnableCutout) {
      mat.uniforms.uEnableCutout.value = state;
    } else if (mat.userData && mat.userData.uEnableCutout) {
      mat.userData.uEnableCutout.value = state;
    }
  });

  const interiorGroups = [
    window.interiorGroup,
    window.cutoutGroup,
    window.planetaryInteriorGroup,
    window.earthInteriorGroup,
    window.coreGroup
  ];
  interiorGroups.forEach(grp => {
    if (grp) grp.visible = state;
  });

  if (typeof window.updateInteriorVisibility === 'function') {
    window.updateInteriorVisibility(state);
  }
};

// -------------------------------------------------------------
// TEXTURE CACHING
// -------------------------------------------------------------
let cachedPlanetXTexture = null;
function getPlanetXTexture() {
  if (cachedPlanetXTexture) return cachedPlanetXTexture;
  cachedPlanetXTexture = createProceduralPlanetXTexture();
  return cachedPlanetXTexture;
}

let cachedDayTexture = null;
let cachedNightTexture = null;
let cachedWaterTexture = null;
let cachedCloudTexture = null;
let cachedMoonTexture = null;
let cachedSunHaloTexture = null;

// ==========================================
// PROCEDURAL TEXTURE GENERATION
// ==========================================
function createProceduralDayTexture() {
  if (cachedDayTexture) return cachedDayTexture;
  const canvas = document.createElement('canvas'); canvas.width = 1024; canvas.height = 512; const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#1a365d'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#2f855a';
  ctx.beginPath(); ctx.ellipse(250, 150, 120, 80, -0.2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(320, 320, 70, 110, 0.3, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(600, 160, 180, 100, 0.1, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(580, 300, 90, 110, -0.1, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(820, 340, 60, 45, 0.1, 0, Math.PI * 2); ctx.fill();
  cachedDayTexture = new THREE.CanvasTexture(canvas);
  return cachedDayTexture;
}

function createProceduralNightTexture() {
  if (cachedNightTexture) return cachedNightTexture;
  const canvas = document.createElement('canvas'); canvas.width = 1024; canvas.height = 512; const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#020617'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#fef08a';
  for (let i = 0; i < 2000; i++) {
    const x = Math.random() * canvas.width, y = Math.random() * canvas.height, r = Math.random() * 1.5;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  }
  cachedNightTexture = new THREE.CanvasTexture(canvas);
  return cachedNightTexture;
}

function createProceduralWaterTexture() {
  if (cachedWaterTexture) return cachedWaterTexture;
  const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 256; const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#000000';
  ctx.beginPath(); ctx.ellipse(125, 75, 60, 40, -0.2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(160, 160, 35, 55, 0.3, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(300, 80, 90, 50, 0.1, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(290, 150, 45, 55, -0.1, 0, Math.PI * 2); ctx.fill();
  cachedWaterTexture = new THREE.CanvasTexture(canvas);
  return cachedWaterTexture;
}

function createProceduralCloudTexture() {
  if (cachedCloudTexture) return cachedCloudTexture;
  const canvas = document.createElement('canvas');
  canvas.width = 1024; canvas.height = 512;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const numClusters = 50; 
  for (let i = 0; i < numClusters; i++) {
    const cx = Math.random() * canvas.width;
    const cy = 60 + Math.random() * (canvas.height - 120); 
    const numBlobs = 15 + Math.random() * 15;

    for (let j = 0; j < numBlobs; j++) {
      const offsetX = (Math.random() - 0.5) * 90; 
      const offsetY = (Math.random() - 0.5) * 90; 
      const x = cx + offsetX;
      const y = cy + offsetY;
      const r = 15 + Math.random() * 30;

      const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(0, 'rgb(180, 180, 180)'); 
      grad.addColorStop(0.4, 'rgb(60, 60, 60)');  
      grad.addColorStop(1, 'rgb(0, 0, 0)');       

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  cachedCloudTexture = new THREE.CanvasTexture(canvas);
  cachedCloudTexture.wrapS = THREE.RepeatWrapping;
  cachedCloudTexture.wrapT = THREE.ClampToEdgeWrapping;
  return cachedCloudTexture;
}

function createProceduralMoonTexture(baseColor) {
  if (cachedMoonTexture) return cachedMoonTexture;
  const canvas = document.createElement('canvas');
  canvas.width = 1024; 
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  const colorObj = (baseColor instanceof THREE.Color) ? baseColor : new THREE.Color('#94a3b8');
  const bgColor = colorObj.getHexString();
  
  ctx.fillStyle = '#' + bgColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const darkColor = colorObj.clone().multiplyScalar(0.6).getHexString();
  const lightColor = colorObj.clone().multiplyScalar(1.3).getHexString();

  for (let i = 0; i < 1500; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const r = Math.random() * 8 + 1;

    ctx.fillStyle = Math.random() > 0.5 ? '#' + darkColor : '#' + lightColor;
    ctx.globalAlpha = Math.random() * 0.3 + 0.1;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  for (let i = 0; i < 25; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const r = Math.random() * 25 + 10;
    
    ctx.fillStyle = '#' + darkColor;
    ctx.globalAlpha = 0.5;
    ctx.beginPath(); ctx.arc(x - r*0.15, y - r*0.15, r, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = '#' + lightColor;
    ctx.globalAlpha = 0.3;
    ctx.beginPath(); ctx.arc(x + r*0.15, y + r*0.15, r, 0, Math.PI * 2); ctx.fill();
    
    ctx.fillStyle = '#' + bgColor;
    ctx.globalAlpha = 0.9;
    ctx.beginPath(); ctx.arc(x, y, r * 0.85, 0, Math.PI * 2); ctx.fill();
  }

  ctx.globalAlpha = 1.0;
  cachedMoonTexture = new THREE.CanvasTexture(canvas);
  cachedMoonTexture.wrapS = THREE.RepeatWrapping;
  cachedMoonTexture.wrapT = THREE.ClampToEdgeWrapping;
  return cachedMoonTexture;
}

function createSunHaloTexture() {
  if (cachedSunHaloTexture) return cachedSunHaloTexture;
  const canvas = document.createElement('canvas'); 
  canvas.width = 512; canvas.height = 512; 
  const ctx = canvas.getContext('2d');
  const cx = 256, cy = 256, maxRadius = 220;
  ctx.clearRect(0, 0, 512, 512);
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxRadius);
  grad.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)');
  grad.addColorStop(0.12, 'rgba(254, 240, 138, 0.85)');
  grad.addColorStop(0.35, 'rgba(245, 158, 11, 0.35)');
  grad.addColorStop(0.65, 'rgba(217, 119, 6, 0.10)');
  grad.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)'); 
  ctx.fillStyle = grad;
  ctx.beginPath(); ctx.arc(cx, cy, maxRadius, 0, Math.PI * 2); ctx.fill();
  cachedSunHaloTexture = new THREE.CanvasTexture(canvas);
  cachedSunHaloTexture.wrapS = THREE.ClampToEdgeWrapping; 
  cachedSunHaloTexture.wrapT = THREE.ClampToEdgeWrapping;
  return cachedSunHaloTexture;
}

function createProceduralPlanetXTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024; canvas.height = 512;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#090e18'; ctx.fillRect(0, 0, canvas.width, canvas.height);

  const bands = [
    { y: 0.00, h: 0.13, color: '#090d16' }, { y: 0.13, h: 0.08, color: '#131c2e' },
    { y: 0.21, h: 0.07, color: '#1a273b' }, { y: 0.28, h: 0.06, color: '#121a28' },
    { y: 0.34, h: 0.09, color: '#223249' }, { y: 0.43, h: 0.05, color: '#162132' },
    { y: 0.48, h: 0.07, color: '#2b3d56' }, { y: 0.55, h: 0.08, color: '#182335' },
    { y: 0.63, h: 0.07, color: '#233348' }, { y: 0.70, h: 0.08, color: '#141d2c' },
    { y: 0.78, h: 0.08, color: '#1d2a3c' }, { y: 0.86, h: 0.14, color: '#090d16' }
  ];

  bands.forEach(b => {
    const yPx = b.y * canvas.height, hPx = b.h * canvas.height;
    const grad = ctx.createLinearGradient(0, yPx, 0, yPx + hPx);
    grad.addColorStop(0, b.color); grad.addColorStop(0.5, b.color); grad.addColorStop(1, '#0e1624');
    ctx.fillStyle = grad; ctx.fillRect(0, yPx, canvas.width, hPx);
  });

  for (let y = 0; y < canvas.height; y += 2) {
    const noise = Math.sin(y * 0.16) * 0.5 + Math.cos(y * 0.04) * 0.5;
    const alpha = 0.03 + 0.05 * Math.max(0, noise);
    ctx.fillStyle = `rgba(148, 190, 225, ${alpha.toFixed(3)})`;
    ctx.fillRect(0, y, canvas.width, 1.5);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping; texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

function createPlanetXRingTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024; canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  const cx = 512, cy = 512;

  ctx.clearRect(0, 0, 1024, 1024);
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 512);

  grad.addColorStop(0.00, 'rgba(0, 0, 0, 0.0)'); grad.addColorStop(0.46, 'rgba(0, 0, 0, 0.0)');
  grad.addColorStop(0.47, 'rgba(100, 130, 160, 0.15)'); grad.addColorStop(0.53, 'rgba(125, 155, 185, 0.32)');
  grad.addColorStop(0.55, 'rgba(90, 120, 150, 0.20)'); grad.addColorStop(0.56, 'rgba(175, 205, 235, 0.75)');
  grad.addColorStop(0.60, 'rgba(215, 235, 255, 0.92)'); grad.addColorStop(0.64, 'rgba(160, 195, 225, 0.78)');
  grad.addColorStop(0.68, 'rgba(230, 245, 255, 0.95)'); grad.addColorStop(0.73, 'rgba(180, 210, 238, 0.82)');
  grad.addColorStop(0.77, 'rgba(240, 250, 255, 0.90)'); grad.addColorStop(0.785, 'rgba(15, 23, 42, 0.06)');
  grad.addColorStop(0.815, 'rgba(15, 23, 42, 0.04)'); grad.addColorStop(0.825, 'rgba(160, 190, 220, 0.65)');
  grad.addColorStop(0.870, 'rgba(190, 220, 245, 0.72)'); grad.addColorStop(0.920, 'rgba(140, 175, 205, 0.50)');
  grad.addColorStop(0.935, 'rgba(15, 23, 42, 0.06)'); grad.addColorStop(0.950, 'rgba(170, 205, 235, 0.45)');
  grad.addColorStop(0.985, 'rgba(120, 160, 200, 0.20)'); grad.addColorStop(1.000, 'rgba(0, 0, 0, 0.0)');

  ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(cx, cy, 512, 0, Math.PI * 2); ctx.fill();

  ctx.globalCompositeOperation = 'source-atop';
  for (let r = 240; r < 505; r += 2) {
    const ringletAlpha = (Math.sin(r * 1.8) * 0.5 + 0.5) * 0.12;
    ctx.strokeStyle = `rgba(255, 255, 255, ${ringletAlpha.toFixed(3)})`;
    ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.globalCompositeOperation = 'source-over';

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping; texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

function createPlanetPinLabel(text, colorHex) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');

  // Dark translucent background pill badge
  ctx.fillStyle = 'rgba(2, 6, 23, 0.78)';
  ctx.beginPath();
  ctx.roundRect ? ctx.roundRect(16, 12, 224, 40, 10) : ctx.fillRect(16, 12, 224, 40);
  ctx.fill();

  // Border outline matching the planet's theme color
  ctx.strokeStyle = colorHex || '#38bdf8';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Planet name text
  ctx.font = 'bold 22px "Space Grotesk", sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 128, 32);

  const texture = new THREE.CanvasTexture(canvas);
  const mat = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: true,
    depthWrite: false
  });
  const sprite = new THREE.Sprite(mat);
  sprite.name = 'pinLabelSprite';
  sprite.scale.set(1.4, 0.35, 1);
  sprite.position.set(0.45, 0.45, 0.0); // Position slightly above the pin head
  return sprite;
}

// -------------------------------------------------------------
// CINEMATIC ORBITAL TRANSITION ENGINE
// -------------------------------------------------------------
let planetTransitionId = null;

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function getBodySubsolarCoords(bodyName, timeObj) {
  let subsolarLat = 0;
  let subsolarLon = 0;
  const isEarth = (bodyName === 'earth');
  const isMoon = (bodyName === 'moon');
  const jd2000 = Date.UTC(2000, 0, 1, 12, 0, 0);

  if (isEarth) {
    const diff = timeObj - new Date(Date.UTC(timeObj.getUTCFullYear(), 0, 0));
    subsolarLat = -23.44 * Math.cos((2 * Math.PI / 365) * (Math.floor(diff / 86400000) + 10));
    subsolarLon = (12 - (timeObj.getUTCHours() + timeObj.getUTCMinutes() / 60 + timeObj.getUTCSeconds() / 3600 + timeObj.getUTCMilliseconds() / 3600000)) * 15;
  } else if (isMoon) {
    const moonPhase = getMoonPhaseDetails(timeObj);
    subsolarLon = 180 - (moonPhase.phaseVal * 360);
    subsolarLat = -1.54 * Math.cos(moonPhase.phaseVal * Math.PI * 2);
  } else if (typeof PARENT_SKY_CONFIG !== 'undefined' && PARENT_SKY_CONFIG[bodyName]) {
    const cfg = PARENT_SKY_CONFIG[bodyName];
    const parentName = cfg.parent;
    const moonData = (typeof GIANT_MOON_ORBITS !== 'undefined' && GIANT_MOON_ORBITS[parentName])
      ? GIANT_MOON_ORBITS[parentName].find(m => m.name.toLowerCase() === bodyName.toLowerCase())
      : null;
    
    const elapsedDays = (timeObj.getTime() - jd2000) / 86400000;
    const PARENT_ORBIT_PERIODS = {
      Mars: 686.98, Jupiter: 4332.59, Saturn: 10759.22, Uranus: 30685.4, Neptune: 60189.0
    };
    const parentPeriod = PARENT_ORBIT_PERIODS[parentName] || 365.25;
    const sunPlanetAngle = (elapsedDays / parentPeriod) * (Math.PI * 2);
    const moonOrbitAngle = moonData 
      ? (moonData.epoch + ((2 * Math.PI) / moonData.period) * elapsedDays)
      : 0;
    const phaseAngle = moonOrbitAngle - sunPlanetAngle;

    subsolarLon = 180.0 - (phaseAngle * (180.0 / Math.PI));
    subsolarLat = 0.0;
  } else if (bodyName === 'sun') {
    subsolarLat = 0.0;
    subsolarLon = 0.0;
  } else {
    let tempPlanet = currentPlanet;
    currentPlanet = bodyName;
    if (typeof getSubPlanetaryPoint === 'function') {
      const sunCoords = getSubPlanetaryPoint('sun', timeObj);
      if (sunCoords && !isNaN(sunCoords.lat)) {
        subsolarLat = sunCoords.lat;
        subsolarLon = sunCoords.lon;
      }
    }
    currentPlanet = tempPlanet; 
  }

  subsolarLon = ((subsolarLon + 180) % 360 + 360) % 360 - 180;
  return { lat: subsolarLat, lon: subsolarLon };
}

function getSunlitFramingDirection(bodyName, timeObj) {
  if (bodyName === 'sun') {
    return new THREE.Vector3(0, 0.25, 1).normalize();
  }

  const coords = getBodySubsolarCoords(bodyName, timeObj);
  const sunDir = latLonToVector3(coords.lat, coords.lon, 1.0).normalize();

  if (typeof PARENT_SKY_CONFIG !== 'undefined' && PARENT_SKY_CONFIG[bodyName]) {
    const parentViewDir = new THREE.Vector3(-0.84, 0.11, 0.53).normalize();
    if (parentViewDir.dot(sunDir) > 0.3) return parentViewDir;
  }

  const sunlitDir = sunDir.clone();
  sunlitDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), 0.42);
  sunlitDir.y = Math.min(Math.max(sunlitDir.y + 0.18, -0.32), 0.38);
  return sunlitDir.normalize();
}

function transitionToPlanet(targetPlanet) {
  if (planetTransitionId) {
    cancelAnimationFrame(planetTransitionId);
    planetTransitionId = null;
  }

  const P0 = camera.position.clone();
  const startDistance = P0.length();
  const startTarget = controls.target.clone();

  const targetDistance = (targetPlanet === 'sun') ? 30.0 : (targetPlanet === 'saturn' ? 24.0 : 18.0);
  const endDir = getSunlitFramingDirection(targetPlanet, currentSimTime);

  const P1 = endDir.multiplyScalar(targetDistance);
  const endTarget = new THREE.Vector3(0, 0, 0);

  let rawMid = new THREE.Vector3().addVectors(P0.clone().normalize(), endDir);
  let midDir;
  if (rawMid.lengthSq() < 0.001) {
    midDir = new THREE.Vector3(0, 1, 0).cross(endDir);
    if (midDir.lengthSq() < 0.001) midDir = new THREE.Vector3(1, 0, 0).cross(endDir);
    midDir.normalize();
  } else {
    midDir = rawMid.normalize();
  }
  
  const apexDistance = Math.max(startDistance, targetDistance) * 1.75 + 10.0;
  const P_mid = midDir.multiplyScalar(apexDistance);

  const duration = 1350;
  const startTime = performance.now();
  let hasSwappedBody = false;

  controls.enabled = false;

  function step(now) {
    const rawProgress = Math.min((now - startTime) / duration, 1.0);
    const u = easeInOutCubic(rawProgress);

    if (rawProgress >= 0.5 && !hasSwappedBody) {
      if (typeof applyPlanetState === 'function') applyPlanetState(targetPlanet);
      hasSwappedBody = true;
    }

    const oneMinusU = 1.0 - u;
    const currentPos = new THREE.Vector3()
      .addScaledVector(P0, oneMinusU * oneMinusU)
      .addScaledVector(P_mid, 2.0 * oneMinusU * u)
      .addScaledVector(P1, u * u);

    camera.position.copy(currentPos);
    controls.target.lerpVectors(startTarget, endTarget, u);
    controls.update();

    if (rawProgress < 1.0) {
      planetTransitionId = requestAnimationFrame(step);
    } else {
      camera.position.copy(P1);
      controls.target.copy(endTarget);
      controls.enabled = true;
      controls.update();
      planetTransitionId = null;
    }
  }

  planetTransitionId = requestAnimationFrame(step);
}

function normalizeBodyName(name) {
  if (!name) return 'earth';
  const str = String(name).trim().toLowerCase();
  if (typeof HeliosBridge !== 'undefined' && typeof HeliosBridge.resolveTargetName === 'function') {
    return HeliosBridge.resolveTargetName(str).toLowerCase();
  }
  return str;
}

function setPlanet(planetName, immediate = false) {
  if (!planetName) return;

  if (typeof HeliosBridge !== 'undefined' && typeof HeliosBridge.resolveTargetName === 'function') {
    planetName = HeliosBridge.resolveTargetName(planetName).toLowerCase();
  } else {
    planetName = String(planetName).trim().toLowerCase();
  }

  if (planetTransitionId) {
    cancelAnimationFrame(planetTransitionId);
    planetTransitionId = null;
    if (controls) controls.enabled = true;
  }

  if (immediate || currentPlanet.toLowerCase() === planetName.toLowerCase()) {
    if (typeof applyPlanetState === 'function') applyPlanetState(planetName);

    const targetDistance = (planetName === 'sun') ? 30.0 : (planetName === 'saturn' ? 24.0 : 18.0);
    const sunlitDir = getSunlitFramingDirection(planetName, currentSimTime);
    camera.position.copy(sunlitDir.multiplyScalar(targetDistance));
    controls.target.set(0, 0, 0);
    controls.enabled = true;
    controls.update();
    return;
  }

  transitionToPlanet(planetName);
}

window.setPlanet = setPlanet;

function createEarthCloudLayer() {
  const cloudGeometry = new THREE.SphereGeometry(5.04, 64, 64);
  const baseCloudTexture = createProceduralCloudTexture();
  const cloudMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff, alphaMap: baseCloudTexture, transparent: true, opacity: 0.85,
    depthWrite: false, roughness: 1.0, metalness: 0.0, side: THREE.FrontSide
  });
  
  injectCutoutShader(cloudMaterial, 'cutout_earth_clouds');

  cloudMesh = new THREE.Mesh(cloudGeometry, cloudMaterial);
  cloudMesh.name = 'earthCloudMesh';
  cloudMesh.renderOrder = 2; 
  cloudMesh.visible = false; 
  globeGroup.add(cloudMesh);

  const textureLoader = new THREE.TextureLoader();
  const liveCloudUrl = 'https://clouds.matteason.co.uk/images/4096x2048/clouds.jpg';
  const cdnFallbackUrl = 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@dev/examples/textures/planets/earth_clouds_2048.png';
  textureLoader.load(
    liveCloudUrl,
    (tex) => { tex.encoding = THREE.sRGBEncoding; cloudMesh.material.alphaMap = tex; cloudMesh.material.needsUpdate = true; },
    undefined,
    () => {
      textureLoader.load(
        cdnFallbackUrl,
        (fallbackTex) => { fallbackTex.encoding = THREE.sRGBEncoding; cloudMesh.material.alphaMap = fallbackTex; cloudMesh.material.needsUpdate = true; }
      );
    }
  );
}

function createVenusCloudLayer() {
  const venusCloudGeo = new THREE.SphereGeometry(5.27, 64, 64);
  const venusCloudMat = new THREE.MeshStandardMaterial({
    color: 0xffffff, transparent: true, opacity: 0.60,
    roughness: 1.0, metalness: 0.0, depthWrite: false, side: THREE.FrontSide
  });

  injectCutoutShader(venusCloudMat, 'cutout_venus_clouds');

  venusCloudMesh = new THREE.Mesh(venusCloudGeo, venusCloudMat);
  venusCloudMesh.name = 'venusCloudMesh';
  venusCloudMesh.renderOrder = 2; 
  venusCloudMesh.visible = false;
  globeGroup.add(venusCloudMesh);
}

function createMarsDustLayer() {
  const dustGeometry = new THREE.SphereGeometry(5.04, 64, 64);
  const dustMaterial = new THREE.MeshStandardMaterial({
    color: 0xc2410c, transparent: true, opacity: 0.60,
    depthWrite: false, roughness: 1.0, metalness: 0.0, side: THREE.FrontSide
  });

  injectCutoutShader(dustMaterial, 'cutout_mars_dust');

  marsDustMesh = new THREE.Mesh(dustGeometry, dustMaterial);
  marsDustMesh.name = 'marsDustMesh';
  marsDustMesh.renderOrder = 2; 
  marsDustMesh.visible = false; 
  globeGroup.add(marsDustMesh);

  const textureLoader = new THREE.TextureLoader();
  const liveCloudUrl = 'https://clouds.matteason.co.uk/images/4096x2048/clouds.jpg';
  const cdnFallbackUrl = 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@dev/examples/textures/planets/earth_clouds_2048.png';
  
  textureLoader.load(
    liveCloudUrl,
    (tex) => { tex.encoding = THREE.sRGBEncoding; marsDustMesh.material.alphaMap = tex; marsDustMesh.material.needsUpdate = true; },
    undefined,
    () => {
      textureLoader.load(
        cdnFallbackUrl,
        (fallbackTex) => { fallbackTex.encoding = THREE.sRGBEncoding; marsDustMesh.material.alphaMap = fallbackTex; marsDustMesh.material.needsUpdate = true; }
      );
    }
  );
}

function createParentSkyObjects() {
  parentSkyGroup = new THREE.Group();
  parentSkyGroup.name = 'parentSkyGroup';
  parentSkyGroup.visible = false;

  parentSkyMaterial = new THREE.MeshStandardMaterial({ roughness: 0.82, metalness: 0.05 });
  parentSkyMesh = new THREE.Mesh(new THREE.SphereGeometry(1.0, 48, 48), parentSkyMaterial);
  parentSkyMesh.name = 'parentSkyPlanetSphere';
  parentSkyGroup.add(parentSkyMesh);

  parentSkyRingMaterial = new THREE.ShaderMaterial({
    vertexShader: (typeof parentSkyRingVertexShader !== 'undefined') ? parentSkyRingVertexShader : '',
    fragmentShader: (typeof parentSkyRingFragmentShader !== 'undefined') ? parentSkyRingFragmentShader : '',
    uniforms: {
      uColor: { value: new THREE.Color(0xfef08a) }, uOpacity: { value: 0.92 },
      uSunDirection: { value: new THREE.Vector3(1, 0, 0) },
      uPlanetWorldCenter: { value: new THREE.Vector3(0, 0, 0) },
      uPlanetRadius: { value: 6.8 }, uInnerRadius: { value: 8.2 }, uOuterRadius: { value: 16.3 }
    },
    side: THREE.DoubleSide, transparent: true, depthWrite: false
  });

  parentSkyRingMesh = new THREE.Mesh(new THREE.RingGeometry(1.2, 2.4, 128, 8), parentSkyRingMaterial);
  parentSkyRingMesh.name = 'parentSkyRingMesh';
  parentSkyRingMesh.visible = false;
  parentSkyGroup.add(parentSkyRingMesh);

  globeGroup.add(parentSkyGroup);
}

function initPlanetXRings() {
  const innerR = 6.4, outerR = 13.8;
  const geom = new THREE.RingGeometry(innerR, outerR, 128, 8);
  const mat = new THREE.MeshBasicMaterial({
    map: createPlanetXRingTexture(), side: THREE.DoubleSide, transparent: true, opacity: 0.92, depthWrite: false
  });
  planetXRingMesh = new THREE.Mesh(geom, mat);
  planetXRingMesh.name = 'planetXRingMesh';
  planetXRingMesh.visible = false;
  globeGroup.add(planetXRingMesh);
}

// =============================================================
// SUB-STELLAR GLOBE CONSTELLATION OVERLAY
// =============================================================
const CONSTELLATION_STARS = {
  // Ursa Major / Big Dipper
  dubhe:     { ra: 11.06, dec: 61.75, major: true },
  merak:     { ra: 11.03, dec: 56.38 },
  phecda:    { ra: 11.90, dec: 53.69 },
  megrez:    { ra: 12.25, dec: 57.03 },
  alioth:    { ra: 12.90, dec: 55.96, major: true },
  mizar:     { ra: 13.40, dec: 54.92 },
  alkaid:    { ra: 13.79, dec: 49.31, major: true },

  // Ursa Minor / Little Dipper (Polaris)
  polaris:     { ra: 2.53,  dec: 89.26, major: true }, // Alpha UMi (Handle tip)
  yildun:      { ra: 17.54, dec: 86.59 },              // Delta UMi (Handle mid-1)
  epsilon_umi: { ra: 16.77, dec: 82.04 },              // Epsilon UMi (Handle mid-2)
  zeta_umi:    { ra: 15.73, dec: 77.79 },              // Zeta UMi (Bowl top-inner)
  eta_umi:     { ra: 16.29, dec: 75.76 },              // Eta UMi (Bowl bottom-inner)
  pherkad:     { ra: 15.35, dec: 71.83 },              // Gamma UMi (Bowl bottom-outer)
  kochab:      { ra: 14.85, dec: 74.16, major: true }, // Beta UMi (Bowl top-outer)
  // Cassiopeia
  schedar:   { ra: 0.67,  dec: 56.54, major: true },
  caph:      { ra: 0.15,  dec: 59.15 },
  gamma_cas: { ra: 0.94,  dec: 60.72 },
  ruchbah:   { ra: 1.43,  dec: 60.23 },
  segin:     { ra: 1.90,  dec: 63.67 },

  // Orion
  betelgeuse:{ ra: 5.92,  dec: 7.41,  major: true },
  rigel:     { ra: 5.24,  dec: -8.20, major: true },
  bellatrix: { ra: 5.42,  dec: 6.35 },
  saiph:     { ra: 5.79,  dec: -9.67 },
  alnitak:   { ra: 5.68,  dec: -1.94 },
  alnilam:   { ra: 5.60,  dec: -1.20 },
  mintaka:   { ra: 5.53,  dec: -0.30 },

  // Canis Major (Sirius)
  sirius:    { ra: 6.75,  dec: -16.72, major: true },
  murzim:    { ra: 6.38,  dec: -17.96 },
  wezen:     { ra: 7.14,  dec: -26.39 },
  aludra:    { ra: 7.40,  dec: -29.30 },

  // Summer Triangle & Cygnus (Northern Cross)
  vega:      { ra: 18.62, dec: 38.78, major: true },
  altair:    { ra: 19.84, dec: 8.87,  major: true },
  deneb:     { ra: 20.69, dec: 45.28, major: true },
  albireo:   { ra: 19.51, dec: 27.96 },
  sadr:      { ra: 20.37, dec: 40.26 },
  gienah:    { ra: 20.77, dec: 33.97 },

  // Taurus (Aldebaran & Pleiades)
  aldebaran: { ra: 4.60,  dec: 16.51, major: true },
  elnath:    { ra: 5.44,  dec: 28.61 },
  tianguan:  { ra: 5.63,  dec: 21.14 },
  pleiades:  { ra: 3.79,  dec: 24.11, major: true },

  // Leo
  regulus:   { ra: 10.14, dec: 11.97, major: true },
  denebola:  { ra: 11.82, dec: 14.57 },
  algieba:   { ra: 10.33, dec: 19.84 },
  zosma:     { ra: 11.23, dec: 15.43 },

  // Crux (Southern Cross)
  acrux:     { ra: 12.44, dec: -63.10, major: true },
  mimosa:    { ra: 12.79, dec: -59.69, major: true },
  gacrux:    { ra: 12.52, dec: -57.11 },
  delta_cru: { ra: 12.25, dec: -58.75 },

  // Scorpius (Antares)
  antares:   { ra: 16.49, dec: -26.43, major: true },
  shaula:    { ra: 17.56, dec: -37.10 },
  sargas:    { ra: 17.62, dec: -42.99 },
  dschubba:  { ra: 16.01, dec: -22.62 },

  // Pegasus (Great Square)
  alpheratz: { ra: 0.14,  dec: 29.09, major: true },
  scheat:    { ra: 23.06, dec: 28.08 },
  markab:    { ra: 23.08, dec: 15.21 },
  algenib:   { ra: 0.22,  dec: 15.18 }
};

const CONSTELLATION_LINES = [
  ['dubhe', 'merak'], ['merak', 'phecda'], ['phecda', 'megrez'],
  ['megrez', 'dubhe'], ['megrez', 'alioth'], ['alioth', 'mizar'], ['mizar', 'alkaid'],
  ['polaris', 'yildun'], ['yildun', 'epsilon_umi'], ['epsilon_umi', 'zeta_umi'],
  ['zeta_umi', 'eta_umi'], ['eta_umi', 'pherkad'], ['pherkad', 'kochab'], ['kochab', 'zeta_umi'],
  ['caph', 'schedar'], ['schedar', 'gamma_cas'], ['gamma_cas', 'ruchbah'], ['ruchbah', 'segin'],
  ['betelgeuse', 'bellatrix'], ['betelgeuse', 'alnitak'], ['bellatrix', 'mintaka'],
  ['mintaka', 'alnilam'], ['alnilam', 'alnitak'], ['alnitak', 'saiph'], ['mintaka', 'rigel'],
  ['saiph', 'rigel'],
  ['sirius', 'murzim'], ['sirius', 'wezen'], ['wezen', 'aludra'],
  ['vega', 'deneb'], ['deneb', 'altair'], ['altair', 'vega'],
  ['deneb', 'sadr'], ['sadr', 'albireo'], ['gienah', 'sadr'],
  ['aldebaran', 'tianguan'], ['aldebaran', 'elnath'], ['aldebaran', 'pleiades'],
  ['regulus', 'algieba'], ['algieba', 'zosma'], ['zosma', 'denebola'], ['denebola', 'regulus'],
  ['gacrux', 'acrux'], ['mimosa', 'delta_cru'],
  ['dschubba', 'antares'], ['antares', 'shaula'], ['shaula', 'sargas'],
  ['scheat', 'markab'], ['markab', 'algenib'], ['algenib', 'alpheratz'], ['alpheratz', 'scheat']
];

const CONSTELLATION_LABELS = [
  { name: 'Big Dipper',      ra: 12.3, dec: 58.0 },
  { name: 'Little Dipper',   ra: 15.2, dec: 79.0 },
  { name: 'Cassiopeia',      ra: 1.0,  dec: 63.0 },
  { name: 'Orion',           ra: 5.6,  dec: 2.0 },
  { name: 'Canis Major',     ra: 6.9,  dec: -22.0 },
  { name: 'Summer Triangle', ra: 19.6, dec: 26.0 },
  { name: 'Cygnus',          ra: 20.3, dec: 42.0 },
  { name: 'Taurus',          ra: 4.6,  dec: 22.0 },
  { name: 'Leo',             ra: 10.9, dec: 16.0 },
  { name: 'Southern Cross',  ra: 12.5, dec: -60.0 },
  { name: 'Scorpius',        ra: 16.9, dec: -33.0 },
  { name: 'Pegasus',         ra: 23.6, dec: 22.0 }
];

function createConstellationLabelSprite(text) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = 'rgba(2, 6, 23, 0.78)';
  ctx.fillRect(14, 12, 228, 40);
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.65)';
  ctx.lineWidth = 2;
  ctx.strokeRect(14, 12, 228, 40);

  ctx.font = 'bold 20px sans-serif';
  ctx.fillStyle = '#fde047';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 128, 32);

  const texture = new THREE.CanvasTexture(canvas);
  const mat = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: true,
    depthWrite: false
  });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(1.25, 0.31, 1);
  sprite.renderOrder = 15;
  return sprite;
}

function initConstellations() {
  if (!globeGroup) return null;
  if (constellationsGroup) {
    if (!globeGroup.children.includes(constellationsGroup)) {
      globeGroup.add(constellationsGroup);
    }
    return constellationsGroup;
  }

  constellationsGroup = new THREE.Group();
  constellationsGroup.name = 'constellationsGroup';
  constellationsGroup.renderOrder = 15;

  const lineRadius = 5.08;
  const starRadius = 5.085;
  const labelRadius = 5.22;

  const segmentPoints = [];
  const arcSteps = 12;

  CONSTELLATION_LINES.forEach(([k1, k2]) => {
    const s1 = CONSTELLATION_STARS[k1];
    const s2 = CONSTELLATION_STARS[k2];
    if (!s1 || !s2) return;

    const v1 = latLonToVector3(s1.dec, (s1.ra * 15.0) % 360, lineRadius);
    const v2 = latLonToVector3(s2.dec, (s2.ra * 15.0) % 360, lineRadius);

    for (let i = 0; i < arcSteps; i++) {
      const pA = new THREE.Vector3().lerpVectors(v1, v2, i / arcSteps).normalize().multiplyScalar(lineRadius);
      const pB = new THREE.Vector3().lerpVectors(v1, v2, (i + 1) / arcSteps).normalize().multiplyScalar(lineRadius);
      segmentPoints.push(pA, pB);
    }
  });

  const lineGeo = new THREE.BufferGeometry().setFromPoints(segmentPoints);
  const lineMat = new THREE.LineBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.92,
    depthTest: true,
    depthWrite: false
  });
  const lineSegments = new THREE.LineSegments(lineGeo, lineMat);
  lineSegments.renderOrder = 15;
  constellationsGroup.add(lineSegments);

  const minorStarGeo = new THREE.SphereGeometry(0.042, 10, 10);
  const majorStarGeo = new THREE.SphereGeometry(0.068, 12, 12);
  const minorStarMat = new THREE.MeshBasicMaterial({ color: 0xe0f2fe });
  const majorStarMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });

  Object.values(CONSTELLATION_STARS).forEach(star => {
    const mesh = new THREE.Mesh(
      star.major ? majorStarGeo : minorStarGeo,
      star.major ? majorStarMat : minorStarMat
    );
    mesh.position.copy(latLonToVector3(star.dec, (star.ra * 15.0) % 360, starRadius));
    mesh.renderOrder = 15;
    constellationsGroup.add(mesh);
  });

  CONSTELLATION_LABELS.forEach(lbl => {
    const sprite = createConstellationLabelSprite(lbl.name);
    sprite.position.copy(latLonToVector3(lbl.dec, (lbl.ra * 15.0) % 360, labelRadius));
    constellationsGroup.add(sprite);
  });

  constellationsGroup.visible = false;
  globeGroup.add(constellationsGroup);
  return constellationsGroup;
}

function updateConstellationVisibility(visible) {
  if (!constellationsGroup) {
    initConstellations();
  }
  if (!constellationsGroup) return;

  const chk = document.getElementById('chk-planets');
  const isSun = (typeof currentPlanet !== 'undefined' && currentPlanet === 'sun');
  const isChecked = (typeof visible === 'boolean') ? visible : (chk ? chk.checked : false);

  const shouldShow = isChecked && !isSun;
  constellationsGroup.visible = shouldShow;

  if (shouldShow) {
    const jd2000 = Date.UTC(2000, 0, 1, 12, 0, 0);
    const ms = (typeof currentSimTime !== 'undefined' && currentSimTime)
      ? currentSimTime.getTime()
      : Date.now();
    const d = (ms - jd2000) / 86400000;

    const pName = (typeof currentPlanet !== 'undefined' && currentPlanet) ? currentPlanet : 'earth';
    const dyn = (typeof PLANET_DYNAMICS !== 'undefined' && PLANET_DYNAMICS[pName])
      ? PLANET_DYNAMICS[pName]
      : { tilt: 23.44, solarDayHours: 24.0 };

    let gmst;
    if (pName === 'earth') {
      gmst = (280.46061837 + 360.98564736629 * d) % 360;
    } else {
      const diffHours = (ms - jd2000) / 3600000;
      gmst = (diffHours / (dyn.solarDayHours || 24.0)) * 360;
    }

    // --- NEW TILT LOGIC: Align North Star based on Planet's Actual Pole ---
    // Right Ascension (RA) and Declination (Dec) of planetary north poles in degrees
    const PLANET_POLES = {
      mercury: { ra: 281.01, dec: 61.41 },
      venus:   { ra: 272.76, dec: 67.16 },
      earth:   { ra: 0.0,    dec: 90.0 }, 
      moon:    { ra: 266.86, dec: 65.64 },
      mars:    { ra: 317.68, dec: 52.88 },
      jupiter: { ra: 268.05, dec: 64.49 },
      saturn:  { ra: 40.58,  dec: 83.53 },
      uranus:  { ra: 257.31, dec: -15.17 },
      neptune: { ra: 299.36, dec: 42.95 },
      pluto:   { ra: 132.99, dec: -6.16 }
    };
    
    const pole = PLANET_POLES[pName] || { ra: 0, dec: 90 };
    
    // Find where the planet's North Pole sits on the standard celestial sphere
    const poleVec = latLonToVector3(pole.dec, pole.ra, 1.0).normalize();
    
    // 1. Quaternion to tilt the sphere so that the pole coordinate aligns with the 3D world's Y-axis (North)
    const tiltQuat = new THREE.Quaternion().setFromUnitVectors(poleVec, new THREE.Vector3(0, 1, 0));
    
    // 2. Quaternion for the daily rotation of the planet
    const dailyRot = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -gmst * (Math.PI / 180));
    
    // Combine rotations: Tilt the star sphere first, then spin it around the new local North pole
    constellationsGroup.quaternion.copy(dailyRot).multiply(tiltQuat);

    // Synchronize the procedural background starfield points to match the exact same rotation
    if (typeof starfieldPoints !== 'undefined' && starfieldPoints) {
        starfieldPoints.quaternion.copy(constellationsGroup.quaternion);
    }
  }
}
window.initConstellations = initConstellations;
window.updateConstellationVisibility = updateConstellationVisibility;


function initScene() {
  const container = document.getElementById('webgl-container');
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 2000);
  camera.position.set(0, 0, 18);
  headlight = new THREE.DirectionalLight(0xffffff, 0.85);
  camera.add(headlight);
  scene.add(camera);

  const isHighDPI = window.devicePixelRatio > 1;
  renderer = new THREE.WebGLRenderer({ antialias: !isHighDPI, alpha: false, powerPreference: "high-performance" });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(1.0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  container.appendChild(renderer.domElement);
  
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true; controls.dampingFactor = 0.08; 
  controls.minDistance = 6; controls.maxDistance = 80; controls.rotateSpeed = 0.8;
  raycaster = new THREE.Raycaster(); mouseVector = new THREE.Vector2();

  earthMaterial = new THREE.ShaderMaterial({
    vertexShader: (typeof earthVertexShader !== 'undefined') ? earthVertexShader : '',
    fragmentShader: (typeof earthFragmentShader !== 'undefined') ? earthFragmentShader : '',
    uniforms: {
      uDayTexture: { value: createProceduralDayTexture() }, 
      uNightTexture: { value: createProceduralNightTexture() }, 
      uWaterTexture: { value: createProceduralWaterTexture() },
      uSunDirection: { value: new THREE.Vector3(1, 0, 0) }, 
      uNightIntensity: { value: 1.2 }, 
      uEnableNightLights: { value: true }, 
      uEnableSpecular: { value: true }, 
      uIsBlueMarble: { value: false }, 
      uMoonShadowPos: { value: new THREE.Vector3(0, 0, 1) },
      uMoonShadowUV: { value: new THREE.Vector2(0.5, 0.5) }, 
      uEclipseIntensity: { value: 0.0 },
      uEnableCutout: { value: false } 
    }
  });

  globeGeometry = new THREE.SphereGeometry(5, 64, 64);
  globeGroup = new THREE.Group();
  scene.add(globeGroup);

  planetRingGroup = new THREE.Group();
  planetRingGroup.name = 'planetRingGroup';
  planetRingGroup.rotation.x = Math.PI / 2; 
  planetRingGroup.visible = false;
  globeGroup.add(planetRingGroup);

  earthMesh = new THREE.Mesh(globeGeometry, earthMaterial);
  globeGroup.add(earthMesh);

  if (typeof initPlanetMaterials === 'function') initPlanetMaterials();

  atmosphereMaterial = new THREE.ShaderMaterial({
    vertexShader: (typeof atmosphereVertexShader !== 'undefined') ? atmosphereVertexShader : '',
    fragmentShader: (typeof atmosphereFragmentShader !== 'undefined') ? atmosphereFragmentShader : '',
    uniforms: { uGlowIntensity: { value: 0.8 }, uEnableCutout: { value: false } }, 
    blending: THREE.AdditiveBlending, side: THREE.BackSide, transparent: true, depthWrite: false
  });
  const atmosphereGeometry = new THREE.SphereGeometry(5.15, 32, 32);
  atmosphereMesh = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
  globeGroup.add(atmosphereMesh);

  createEarthCloudLayer();
  createVenusCloudLayer();
  createMarsDustLayer();
  initPlanetXRings();

  if (typeof PLANET_CONFIG !== 'undefined') {
    const GAS_GIANTS = ['jupiter', 'saturn', 'uranus', 'neptune'];
    PLANET_CONFIG.forEach(cfg => {
      const isGasGiant = GAS_GIANTS.includes(cfg.name);
      const pin = createPinMarker(cfg.stem, cfg.color, cfg.ring);
      pin.name = `pin_${cfg.name}`;


      // === ADD THIS BLOCK: Attach text label to pin ===
      const displayName = cfg.name.charAt(0).toUpperCase() + cfg.name.slice(1).replace('_', ' ');
      const hexColor = '#' + new THREE.Color(cfg.color).getHexString();
      const labelSprite = createPlanetPinLabel(displayName, hexColor);
      pin.add(labelSprite);
      // ===============================================


      if (isGasGiant) {
        const outerRingGeom = new THREE.RingGeometry(0.28, 0.36, 32);
        const outerRingMat = new THREE.MeshBasicMaterial({ color: cfg.ring, side: THREE.DoubleSide, transparent: true, opacity: 0.45 });
        const outerBaseRing = new THREE.Mesh(outerRingGeom, outerRingMat);
        outerBaseRing.rotation.x = Math.PI / 2;
        pin.add(outerBaseRing);

        if (cfg.name === 'jupiter') {
          [-0.025, 0.025].forEach(yOffset => {
            const bandGeom = new THREE.TorusGeometry(0.122, 0.012, 8, 24);
            const bandMat = new THREE.MeshBasicMaterial({ color: 0x78350f, transparent: true, opacity: 0.85 });
            const band = new THREE.Mesh(bandGeom, bandMat);
            band.position.set(0, 0.5 + yOffset, 0); band.rotation.x = Math.PI / 2; pin.add(band);
          });
          const spotGeom = new THREE.SphereGeometry(0.034, 12, 12); spotGeom.scale(1.4, 0.85, 0.35);
          const redSpot = new THREE.Mesh(spotGeom, new THREE.MeshBasicMaterial({ color: 0xdc2626 }));
          redSpot.position.set(0.015, 0.468, 0.114); pin.add(redSpot);
        }
        if (cfg.name === 'saturn') {
          const ringGeom = new THREE.RingGeometry(0.15, 0.28, 36);
          const saturnRing = new THREE.Mesh(ringGeom, new THREE.MeshBasicMaterial({ color: 0xfef08a, side: THREE.DoubleSide, transparent: true, opacity: 0.9 }));
          saturnRing.position.set(0, 0.5, 0); saturnRing.rotation.x = Math.PI / 2.6; saturnRing.rotation.y = 0.2; pin.add(saturnRing);
          const outerRing = new THREE.Mesh(new THREE.RingGeometry(0.30, 0.34, 36), new THREE.MeshBasicMaterial({ color: 0xeab308, side: THREE.DoubleSide, transparent: true, opacity: 0.5 }));
          outerRing.position.set(0, 0.5, 0); outerRing.rotation.x = Math.PI / 2.6; outerRing.rotation.y = 0.2; pin.add(outerRing);
        }
        if (cfg.name === 'uranus') {
          const uRingGeom = new THREE.RingGeometry(0.16, 0.22, 32);
          const uranusRing = new THREE.Mesh(uRingGeom, new THREE.MeshBasicMaterial({ color: 0xbae6fd, side: THREE.DoubleSide, transparent: true, opacity: 0.75 }));
          uranusRing.position.set(0, 0.5, 0); uranusRing.rotation.y = Math.PI / 2; uranusRing.rotation.z = 0.15; pin.add(uranusRing);
        }

        if (cfg.name === 'neptune') {
          const nBand = new THREE.Mesh(new THREE.TorusGeometry(0.122, 0.009, 8, 24), new THREE.MeshBasicMaterial({ color: 0xe0f2fe, transparent: true, opacity: 0.9 }));

          nBand.position.set(0, 0.51, 0); nBand.rotation.x = Math.PI / 2; pin.add(nBand);
          const darkSpotGeom = new THREE.SphereGeometry(0.028, 10, 10); darkSpotGeom.scale(1.3, 0.8, 0.3);
          const darkSpot = new THREE.Mesh(darkSpotGeom, new THREE.MeshBasicMaterial({ color: 0x1e1b4b }));
          darkSpot.position.set(-0.02, 0.47, 0.116); pin.add(darkSpot);
        }
      }
      const scaleFactor = isGasGiant ? (1 / 1.6) : (1 / 2.4);
      pin.scale.setScalar(scaleFactor);
      pin.visible = false;
      globeGroup.add(pin);
      planetPins[cfg.name] = pin;
    });
  }

  const starGeometry = new THREE.BufferGeometry();
  const starCount = 3000;
  const starPositions = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount * 3; i += 3) {
    const r = 300 + Math.random() * 500, theta = Math.random() * Math.PI * 2, phi = Math.acos((Math.random() * 2) - 1);
    starPositions[i] = r * Math.sin(phi) * Math.cos(theta); starPositions[i + 1] = r * Math.sin(phi) * Math.sin(theta); starPositions[i + 2] = r * Math.cos(phi);
  }
  starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
  const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 1.2, transparent: true, opacity: 0.8 });
  starfieldPoints = new THREE.Points(starGeometry, starMaterial);
  scene.add(starfieldPoints);
  
  graticuleGroup = new THREE.Group();
  createGraticuleGrid();
  globeGroup.add(graticuleGroup);
  createCelestialEquator();
  initConstellations();
  if (typeof createPlanetaryMoons === 'function') createPlanetaryMoons();
  createParentSkyObjects();

  userPinGroup = createPinMarker(0xef4444, 0xf87171, 0xef4444); userPinGroup.visible = false; globeGroup.add(userPinGroup);
  sunPinGroup = createPinMarker(0xd97706, 0xfacc15, 0xf59e0b); sunPinGroup.visible = false; globeGroup.add(sunPinGroup);
  sunPinGroup.add(createPlanetPinLabel('Sun', '#f59e0b'));
  moonPinGroup = createPinMarker(0x475569, 0xf8fafc, 0x94a3b8); moonPinGroup.visible = false; globeGroup.add(moonPinGroup);
  moonPinGroup.add(createPlanetPinLabel('Moon', '#94a3b8'));

  earthPinGroup = createPinMarker(0x1d4ed8, 0x60a5fa, 0x3b82f6);
  earthPinGroup.name = 'pin_Earth_Zenith';
  earthPinGroup.scale.setScalar(1.0); 
  earthPinGroup.visible = false;
  globeGroup.add(earthPinGroup);
  earthPinGroup.add(createPlanetPinLabel('Earth', '#f59e0b'));

  createCelestialObjects();
  loadExternalTextures();
  if (typeof initCountryHoverMesh === 'function') initCountryHoverMesh();
  
  window.addEventListener('resize', onWindowResize);
  window.addEventListener('mousemove', onMouseMove);

  setPlanet('earth', true);
  updateNightLighting();

  // Initialize Comet Tail & Coma Group
  if (typeof initCometTail === 'function') {
    initCometTail();
  } else if (typeof createCometTailMesh === 'function') {
    const cGroup = createCometTailMesh();
    scene.add(cGroup);
  }
}

function updateParentSkyView(bodyName) {
  if (!parentSkyGroup) return;

  let cfg = null;
  if (typeof PARENT_SKY_CONFIG !== 'undefined') {
    const lowerBody = bodyName.toLowerCase();
    const foundKey = Object.keys(PARENT_SKY_CONFIG).find(k => k.toLowerCase() === lowerBody);
    if (foundKey) cfg = PARENT_SKY_CONFIG[foundKey];
  }

  if (!cfg) {
    parentSkyGroup.visible = false;
    return;
  }

  const chkCelestial = document.getElementById('chk-celestial')?.checked !== false;
  parentSkyGroup.visible = chkCelestial;
  if (!chkCelestial) return;

  parentSkyGroup.position.set(cfg.dist, 0, 0);
  parentSkyMesh.scale.setScalar(cfg.radius);

  const parentKey = cfg.parent.toLowerCase();
  const parentMat = planetMaterials[parentKey];
  if (parentMat && parentMat.map) {
    parentSkyMaterial.map = parentMat.map;
    parentSkyMaterial.color.setHex(0xffffff);
  } else {
    parentSkyMaterial.map = null;
    const fallbackColors = { mars: 0xef4444, jupiter: 0xfdb147, saturn: 0xfde047, uranus: 0x7dd3fc, neptune: 0x3b82f6 };
    parentSkyMaterial.color.setHex(fallbackColors[parentKey] || 0xcbd5e1);
  }
  parentSkyMaterial.needsUpdate = true;

  if (cfg.rings) {
    if (parentSkyRingMesh.geometry) parentSkyRingMesh.geometry.dispose();
    parentSkyRingMesh.geometry = new THREE.RingGeometry(cfg.rings.inner, cfg.rings.outer, 128, 8);

    parentSkyRingMaterial.uniforms.uInnerRadius.value = cfg.rings.inner;
    parentSkyRingMaterial.uniforms.uOuterRadius.value = cfg.rings.outer;
    parentSkyRingMaterial.uniforms.uPlanetRadius.value = cfg.radius;

    if (cfg.parent.toLowerCase() === 'saturn') {
      parentSkyRingMaterial.uniforms.uColor.value.setHex(0xfef08a);
      parentSkyRingMaterial.uniforms.uOpacity.value = 0.92;
    } else {
      parentSkyRingMaterial.uniforms.uColor.value.setHex(0xbae6fd);
      parentSkyRingMaterial.uniforms.uOpacity.value = 0.75;
    }

    const tiltX = cfg.tiltX || 0;
    parentSkyRingMesh.rotation.set(Math.PI / 2 + tiltX, 0, 0);
    parentSkyRingMesh.visible = true;
  } else {
    parentSkyRingMesh.visible = false;
  }
}

function onWindowResize() { camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight); }

function fetchUserLocation(onComplete) {
  if (isLocationFetched && activeUserLocation) { if (onComplete) onComplete(activeUserLocation); return; }
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition((position) => {
      activeUserLocation = { lat: position.coords.latitude, lon: position.coords.longitude }; isLocationFetched = true; updateLocationPin(activeUserLocation.lat, activeUserLocation.lon); if (onComplete) onComplete(activeUserLocation);
    }, () => {
      activeUserLocation = { lat: 35.7796, lon: -78.6382 }; isLocationFetched = true; updateLocationPin(activeUserLocation.lat, activeUserLocation.lon); if (onComplete) onComplete(activeUserLocation);
    });
  } else { activeUserLocation = { lat: 35.7796, lon: -78.6382 }; isLocationFetched = true; updateLocationPin(activeUserLocation.lat, activeUserLocation.lon); if (onComplete) onComplete(activeUserLocation); }
}

function createPinMarker(stemColor, headColor, ringColor) {
  const pinGroup = new THREE.Group();
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.08, 0.5, 16).translate(0, 0.25, 0), new THREE.MeshBasicMaterial({ color: stemColor }));
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16).translate(0, 0.5, 0), new THREE.MeshBasicMaterial({ color: headColor }));
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.1, 0.25, 32), new THREE.MeshBasicMaterial({ color: ringColor || stemColor, side: THREE.DoubleSide, transparent: true, opacity: 0.8 }));
  ring.rotation.x = Math.PI / 2; ring.name = 'pulseRing';
  pinGroup.add(stem); pinGroup.add(head); pinGroup.add(ring);
  return pinGroup;
}

function createCelestialObjects() {
  celestialGroup = new THREE.Group(); 
  celestialGroup.visible = true;
  
  const sunGeo = new THREE.SphereGeometry(1.5, 32, 32);
  const sunMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  loadTextureWithFallback(
    'texture/Sun.jpg',
    'https://cdn.jsdelivr.net/gh/mrdoob/three.js@dev/examples/textures/planets/sun.jpg',
    (tex) => {
      sunMat.map = tex;
      sunMat.color.setHex(0xffffff);
      sunMat.needsUpdate = true;
    }
  );

  sunMesh = new THREE.Mesh(sunGeo, sunMat);
  const haloMat = new THREE.SpriteMaterial({ 
    map: createSunHaloTexture(), 
    blending: THREE.AdditiveBlending, 
    transparent: true, 
    depthWrite: false, 
    opacity: 0.95 
  });
  
  sunHalo = new THREE.Sprite(haloMat); 
  sunHalo.scale.set(16, 16, 1); 
  sunHalo.name = 'sunHaloSprite'; 
  sunMesh.add(sunHalo);
  celestialSunLight = new THREE.DirectionalLight(0xffffff, 1.2); 
  celestialGroup.add(celestialSunLight);
  
  moonMesh = new THREE.Mesh(new THREE.SphereGeometry(0.7, 32, 32), new THREE.MeshPhongMaterial({ map: createProceduralMoonTexture(), shininess: 5, bumpScale: 0.05 }));
  
  const earthSkyGeo = new THREE.SphereGeometry(1.8, 48, 48);
  earthSkyMaterial = new THREE.ShaderMaterial({
    vertexShader: (typeof earthSkyVertexShader !== 'undefined') ? earthSkyVertexShader : '',
    fragmentShader: (typeof earthSkyFragmentShader !== 'undefined') ? earthSkyFragmentShader : '',
    uniforms: {
      uDayTexture: { value: null },
      uSunDirection: { value: new THREE.Vector3(1, 0, 0) },
      uMoonShadowLocalPos: { value: new THREE.Vector3(0, 0, 1) },
      uEclipseIntensity: { value: 0.0 }
    }
  });
  loadTextureWithFallback(
    (typeof TEXTURE_URLS_FULL !== 'undefined' ? TEXTURE_URLS_FULL.day : ''), 
    (typeof TEXTURE_URLS_FALLBACK !== 'undefined' ? TEXTURE_URLS_FALLBACK.day : ''), 
    (tex) => {
      earthSkyMaterial.uniforms.uDayTexture.value = tex;
      earthSkyMaterial.needsUpdate = true;
    }
  );
  earthSkyMesh = new THREE.Mesh(earthSkyGeo, earthSkyMaterial);
  earthSkyMesh.visible = false;
  
  ambientLight = new THREE.AmbientLight(0x334155, 0.4);
  celestialGroup.add(ambientLight);
  celestialGroup.add(sunMesh);
  celestialGroup.add(moonMesh);
  celestialGroup.add(earthSkyMesh);
  scene.add(celestialGroup);
}

function loadExternalTextures() {
  if (typeof TEXTURE_URLS_FULL === 'undefined') return;
  loadTextureWithFallback(TEXTURE_URLS_FULL.day, TEXTURE_URLS_FALLBACK.day, (texture) => {
    earthMaterial.uniforms.uDayTexture.value = texture;
  });
  loadTextureWithFallback(TEXTURE_URLS_FULL.night, TEXTURE_URLS_FALLBACK.night, (texture) => {
    earthMaterial.uniforms.uNightTexture.value = texture;
  });
  loadTextureWithFallback(TEXTURE_URLS_FULL.water, TEXTURE_URLS_FALLBACK.water, (texture) => {
    earthMaterial.uniforms.uWaterTexture.value = texture;
  });
}

function loadTextureToShader(keyOrUrl) {
  let primary = keyOrUrl;
  let fallback = null;
  if (typeof TEXTURE_URLS_FULL !== 'undefined' && TEXTURE_URLS_FULL[keyOrUrl]) {
    primary = TEXTURE_URLS_FULL[keyOrUrl];
    fallback = TEXTURE_URLS_FALLBACK[keyOrUrl];
  } else if (typeof TEXTURE_URLS_FULL !== 'undefined') {
    for (const [k, url] of Object.entries(TEXTURE_URLS_FULL)) {
      if (url === keyOrUrl) {
        fallback = TEXTURE_URLS_FALLBACK[k];
        break;
      }
    }
  }
  loadTextureWithFallback(primary, fallback, (texture) => {
    earthMaterial.uniforms.uDayTexture.value = texture;
  });
}

let graticuleMatsCreated = false;
let matLine, matTropic, matEqBase, matEqDash;

function createGraticuleGrid() {
  if (!graticuleMatsCreated) {
    matLine = new THREE.LineBasicMaterial({ color: 0xaa33ff, transparent: true, opacity: 0.25 });
    matTropic = new THREE.LineDashedMaterial({ color: 0xef4444, dashSize: 0.1, gapSize: 0.15, transparent: true, opacity: 0.8 });
    matEqBase = new THREE.LineBasicMaterial({color: 0xff2222, transparent: true, opacity: 0.4});
    matEqDash = new THREE.LineDashedMaterial({color: 0x000000, dashSize: 0.2, gapSize: 0.2, transparent: false, opacity: 1.0});
    graticuleMatsCreated = true;
  }

  if (!graticuleGroup) {
    graticuleGroup = new THREE.Group();
    graticuleGroup.name = 'graticuleGroup';
    if (typeof globeGroup !== 'undefined' && globeGroup) {
      globeGroup.add(graticuleGroup);
    }
  }
  clearGroup(graticuleGroup);

  const radius = 5.02;
  
  for (let lat = -75; lat <= 75; lat += 15) {
    const points = [];
    const radLat = (lat * Math.PI) / 180;
    const r = radius * Math.cos(radLat);
    const y = radius * Math.sin(radLat);
    for (let lon = 0; lon <= 360; lon += 5) {
      const radLon = (lon * Math.PI) / 180;
      points.push(new THREE.Vector3(r * Math.cos(radLon), y, -r * Math.sin(radLon)));
    }
    if (lat === 0) {
      const redEquator = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), matEqBase);
      graticuleGroup.add(redEquator);
      const dashPoints = [];
      const rDash = radius + 0.003;
      for (let lon = 0; lon <= 360; lon += 5) {
        const radLon = (lon * Math.PI) / 180;
        dashPoints.push(new THREE.Vector3(rDash * Math.cos(radLon), 0, -rDash * Math.sin(radLon)));
      }
      const blackDashEquator = new THREE.Line(new THREE.BufferGeometry().setFromPoints(dashPoints), matEqDash);
      blackDashEquator.computeLineDistances(); 
      graticuleGroup.add(blackDashEquator);
    } else {
      graticuleGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), matLine));
    }
  }
  for (let lon = 0; lon < 360; lon += 15) {
    const points = [];
    const radLon = (lon * Math.PI) / 180;
    for (let lat = -90; lat <= 90; lat += 5) {
      const radLat = (lat * Math.PI) / 180;
      points.push(new THREE.Vector3(radius * Math.cos(radLat) * Math.cos(radLon), radius * Math.sin(radLat), -radius * Math.cos(radLat) * Math.sin(radLon)));
    }
    graticuleGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), matLine));
  }
  let t = (typeof PLANET_DYNAMICS !== 'undefined' && PLANET_DYNAMICS[currentPlanet]) 
    ? PLANET_DYNAMICS[currentPlanet].tilt 
    : 23.44;
  if (t > 90) t = 180 - t;
  const tropics = [t, -t];

  tropics.forEach(lat => {
    const points = [];
    const radLat = (lat * Math.PI) / 180;
    const r = radius * Math.cos(radLat);
    const y = radius * Math.sin(radLat);
    for (let lon = 0; lon <= 360; lon += 5) {
      const radLon = (lon * Math.PI) / 180;
      points.push(new THREE.Vector3(r * Math.cos(radLon), y, -r * Math.sin(radLon)));
    }
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), matTropic);
    line.computeLineDistances();
    graticuleGroup.add(line);
  });
}

function createCelestialEquator() {
  if (!celestialEquatorGroup) {
    celestialEquatorGroup = new THREE.Group();
    celestialEquatorGroup.name = 'celestialEquatorGroup';
    globeGroup.add(celestialEquatorGroup);
  }
  clearGroup(celestialEquatorGroup);

  const surfaceRadius = 5.06; 
  const spaceRadius = 16.0;   
  const surfacePoints = [];
  for (let deg = 0; deg <= 360; deg += 1) {
    const rad = (deg * Math.PI) / 180;
    surfacePoints.push(new THREE.Vector3(surfaceRadius * Math.cos(rad), 0, surfaceRadius * Math.sin(rad)));
  }
  const surfaceGeo = new THREE.BufferGeometry().setFromPoints(surfacePoints);
  const surfaceMat = new THREE.LineBasicMaterial({
    color: 0x38bdf8, transparent: true, opacity: 0.95, depthTest: true, depthWrite: false
  });
  celestialEquatorGroup.add(new THREE.Line(surfaceGeo, surfaceMat));
  const spacePoints = [];
  for (let deg = 0; deg <= 360; deg += 1) {
    const rad = (deg * Math.PI) / 180;
    spacePoints.push(new THREE.Vector3(spaceRadius * Math.cos(rad), 0, spaceRadius * Math.sin(rad)));
  }
  const spaceGeo = new THREE.BufferGeometry().setFromPoints(spacePoints);
  const spaceMat = new THREE.LineDashedMaterial({
    color: 0x7dd3fc, dashSize: 0.6, gapSize: 0.3, transparent: true, opacity: 0.75, depthTest: true, depthWrite: false
  });
  const spaceLine = new THREE.Line(spaceGeo, spaceMat);
  spaceLine.computeLineDistances();
  celestialEquatorGroup.add(spaceLine);
  const spokeMat = new THREE.LineDashedMaterial({
    color: 0x38bdf8, dashSize: 0.3, gapSize: 0.25, transparent: true, opacity: 0.35
  });
  for (let deg = 0; deg < 360; deg += 30) {
    const rad = (deg * Math.PI) / 180;
    const cos = Math.cos(rad), sin = Math.sin(rad);
    const spokePoints = [
      new THREE.Vector3(surfaceRadius * cos, 0, surfaceRadius * sin),
      new THREE.Vector3(spaceRadius * cos, 0, spaceRadius * sin)
    ];
    const spokeLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints(spokePoints), spokeMat);
    spokeLine.computeLineDistances();
    celestialEquatorGroup.add(spokeLine);
  }

  const pyramidBaseRadius = 0.16; 
  const pyramidHeight = 0.55;     
  const pyramidGeo = new THREE.ConeGeometry(pyramidBaseRadius, pyramidHeight, 4);
  pyramidGeo.rotateY(Math.PI / 4);                
  pyramidGeo.translate(0, pyramidHeight / 2, 0);  
  const pyramidMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.45, roughness: 0.3, metalness: 0.15, flatShading: true 
  });
  [0, 90, 180, 270].forEach(deg => {
    const rad = (deg * Math.PI) / 180;
    const node = new THREE.Mesh(pyramidGeo, pyramidMat);
    const dir = new THREE.Vector3(Math.cos(rad), 0, Math.sin(rad)).normalize();
    node.position.copy(dir.clone().multiplyScalar(spaceRadius));
    node.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    celestialEquatorGroup.add(node);
  });
  updateCelestialEquatorVisibility();
}

function updateCelestialEquatorOrientation() {
  if (!celestialEquatorGroup || !celestialEquatorGroup.visible) return;
  const dyn = (typeof PLANET_DYNAMICS !== 'undefined' && PLANET_DYNAMICS[currentPlanet])
    ? PLANET_DYNAMICS[currentPlanet]
    : { tilt: 23.44, solarDayHours: 24.0 };
  const tilt = dyn.tilt || 0.0;
  const jd2000 = Date.UTC(2000, 0, 1, 12, 0, 0);
  const ms = currentSimTime.getTime();
  const d = (ms - jd2000) / 86400000;
  let gmst;
  if (currentPlanet === 'earth') {
    gmst = (280.46061837 + 360.98564736629 * d) % 360;
  } else {
    const diffHours = (ms - jd2000) / 3600000;
    gmst = (diffHours / (dyn.solarDayHours || 24.0)) * 360;
  }
  const decPole = 90.0 - tilt;
  let lonPole = -(gmst + 90.0) % 360;
  while (lonPole < -180) lonPole += 360;
  while (lonPole > 180) lonPole -= 360;
  const normalVec = latLonToVector3(decPole, lonPole, 1.0).normalize();
  celestialEquatorGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normalVec);
}

function updatePinPosition(pinGroup, lat, lon) {
  if (!pinGroup || !pinGroup.position) return;
  const radius = 5.05; const phi = (90 - lat) * (Math.PI / 180), theta = (lon + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta)), z = radius * Math.sin(phi) * Math.sin(theta), y = radius * Math.cos(phi);
  pinGroup.position.set(x, y, z);
  pinGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(x, y, z).normalize());
}

function updateLocationPin(lat, lon) { updatePinPosition(userPinGroup, lat, lon); }

function updateSunPosition() { 
  let subsolarLat = 0;
  let subsolarLon = 0;
  const isEarth = (currentPlanet === 'earth');
  const isSun = (currentPlanet === 'sun');
  const isMoon = (currentPlanet === 'moon');
  const chkCelestial = document.getElementById('chk-celestial')?.checked !== false;
  const jd2000 = Date.UTC(2000, 0, 1, 12, 0, 0);

  if (isEarth) {
    const diff = currentSimTime - new Date(Date.UTC(currentSimTime.getUTCFullYear(), 0, 0));
    subsolarLat = -23.44 * Math.cos((2 * Math.PI / 365) * (Math.floor(diff / 86400000) + 10));
    subsolarLon = (12 - (currentSimTime.getUTCHours() + currentSimTime.getUTCMinutes() / 60 + currentSimTime.getUTCSeconds() / 3600 + currentSimTime.getUTCMilliseconds() / 3600000)) * 15;
  } else if (isMoon) {
    const moonPhase = getMoonPhaseDetails(currentSimTime);
    subsolarLon = 180 - (moonPhase.phaseVal * 360);
    subsolarLat = -1.54 * Math.cos(moonPhase.phaseVal * Math.PI * 2);
  } else if (typeof PARENT_SKY_CONFIG !== 'undefined' && PARENT_SKY_CONFIG[currentPlanet]) {
    const cfg = PARENT_SKY_CONFIG[currentPlanet];
    const parentName = cfg.parent;
    const moonData = (typeof GIANT_MOON_ORBITS !== 'undefined' && GIANT_MOON_ORBITS[parentName])
      ? GIANT_MOON_ORBITS[parentName].find(m => m.name.toLowerCase() === currentPlanet.toLowerCase())
      : null;
    
    const elapsedDays = (currentSimTime.getTime() - jd2000) / 86400000;
    
    const PARENT_ORBIT_PERIODS = {
      Mars: 686.98, Jupiter: 4332.59, Saturn: 10759.22, Uranus: 30685.4, Neptune: 60189.0
    };
    const parentPeriod = PARENT_ORBIT_PERIODS[parentName] || 365.25;
    
    const sunPlanetAngle = (elapsedDays / parentPeriod) * (Math.PI * 2);
    
    const moonOrbitAngle = moonData 
      ? (moonData.epoch + ((2 * Math.PI) / moonData.period) * elapsedDays)
      : 0;
    
    const phaseAngle = moonOrbitAngle - sunPlanetAngle;

    subsolarLon = 180.0 - (phaseAngle * (180.0 / Math.PI));
    subsolarLat = 0.0;
  } else {
    if (typeof getSubPlanetaryPoint === 'function') {
      const sunCoords = getSubPlanetaryPoint('sun', currentSimTime);
      if (sunCoords && !isNaN(sunCoords.lat)) {
        subsolarLat = sunCoords.lat;
        subsolarLon = sunCoords.lon;
      }
    }
  }

  subsolarLon = ((subsolarLon + 180) % 360 + 360) % 360 - 180;
  currentSunLat = subsolarLat;
  currentSunLon = subsolarLon;
  updatePinPosition(sunPinGroup, subsolarLat, subsolarLon);

  const sunDirWorld = latLonToVector3(subsolarLat, subsolarLon, 1.0).normalize();

  if (earthMaterial && earthMaterial.uniforms && earthMaterial.uniforms.uSunDirection) {
    earthMaterial.uniforms.uSunDirection.value.copy(sunDirWorld);
  }
  if (typeof ringShadowUniforms !== 'undefined' && ringShadowUniforms.uSunDirection) {
    ringShadowUniforms.uSunDirection.value.copy(sunDirWorld);
  }

  if (parentSkyGroup) {
    parentSkyGroup.visible = !!(typeof PARENT_SKY_CONFIG !== 'undefined' && PARENT_SKY_CONFIG[currentPlanet]) && chkCelestial;
  }
  if (parentSkyRingMesh && parentSkyRingMesh.visible && parentSkyRingMaterial && parentSkyRingMaterial.uniforms) {
    parentSkyRingMaterial.uniforms.uSunDirection.value.copy(sunDirWorld);

    if (parentSkyMesh) {
      const planetWorldPos = new THREE.Vector3();
      parentSkyMesh.getWorldPosition(planetWorldPos);
      parentSkyRingMaterial.uniforms.uPlanetWorldCenter.value.copy(planetWorldPos);
    }
  }

  const eclipseInfo = (isEarth || isMoon) && typeof getEclipseInfo === 'function' ? getEclipseInfo(currentSimTime) : null;
  if (eclipseInfo && isEarth) {
    earthMaterial.uniforms.uEclipseIntensity.value = eclipseInfo.intensity || 0.0;
    if (eclipseInfo.active) {
      const shadowVec = latLonToVector3(eclipseInfo.lat, eclipseInfo.lon, 1.0).normalize();
      earthMaterial.uniforms.uMoonShadowPos.value.copy(shadowVec);
      earthMaterial.uniforms.uMoonShadowUV.value.set((eclipseInfo.lon + 180) / 360, (eclipseInfo.lat + 90) / 180);
    } else {
      earthMaterial.uniforms.uMoonShadowPos.value.copy(sunDirWorld);
      earthMaterial.uniforms.uMoonShadowUV.value.set((subsolarLon + 180) / 360, (subsolarLat + 90) / 180);
    }
  } else if (isEarth) {
    earthMaterial.uniforms.uEclipseIntensity.value = 0.0;
  }

  if (isEarth || isMoon) {
    let lunarEclipseIntensity = 0.0;
    const nowMs = currentSimTime.getTime();
    if (typeof LUNAR_ECLIPSE_DATE !== 'undefined') {
      for (let lDate of LUNAR_ECLIPSE_DATE) {
        const ldiff = Math.abs(nowMs - lDate.date.getTime());
        if (ldiff < 14400000) { 
          lunarEclipseIntensity = 1.0 - (ldiff / 14400000); 
          break; 
        }
      }
    }
    if (moonMesh && moonMesh.material) {
      if (lunarEclipseIntensity > 0) {
        moonMesh.material.color.setRGB(1.0, 0.25 * (1 - lunarEclipseIntensity * 0.7), 0.2 * (1 - lunarEclipseIntensity * 0.8));
      } else {
        moonMesh.material.color.setHex(0xffffff);
      }
    }
    const d = (nowMs - jd2000) / 86400000;
    const L = (218.316 + 13.176396 * d) % 360;
    const M = (134.963 + 13.064993 * d) % 360;
    const F = (93.272 + 13.229350 * d) % 360;
    const lRad = (L + 6.289 * Math.sin(M * Math.PI / 180)) * Math.PI / 180;
    const bRad = (5.128 * Math.sin(F * Math.PI / 180)) * Math.PI / 180;
    const eps = 23.439 * Math.PI / 180;
    const moonLat = Math.asin(Math.sin(bRad) * Math.cos(eps) + Math.cos(bRad) * Math.sin(eps) * Math.sin(lRad)) * (180 / Math.PI);
    const moonRA = Math.atan2(Math.sin(lRad) * Math.cos(eps) - Math.tan(bRad) * Math.sin(eps), Math.cos(lRad)) * (180 / Math.PI);
    let gha = ((280.46061837 + 360.98564736629 * d) % 360 - moonRA) % 360;
    if (gha < 0) gha += 360;
    let moonLon = -gha;
    moonLon = ((moonLon + 180) % 360 + 360) % 360 - 180;
    currentMoonLat = moonLat;
    currentMoonLon = moonLon;
    updatePinPosition(moonPinGroup, moonLat, moonLon);
    const moonPos = latLonToVector3(moonLat, moonLon, 22);

    if (moonMesh && moonMesh.position) {
      moonMesh.position.copy(moonPos);
      moonMesh.lookAt(0, 0, 0);
    }

    if (window.earthMoonOrbitGroup) {
        const gmst = (280.46061837 + 360.98564736629 * d) % 360;
        if (typeof window.updateEarthMoonOrbitLine === 'function') {
            window.updateEarthMoonOrbitLine(d, gmst);
        }
    }
  }

  //if (starfieldPoints) {   // handled in: updateConstellationVisibility
  //  const siderealDayMs = 86164090.5;
  //  const starAngle = ((currentSimTime.getTime() % siderealDayMs) / siderealDayMs) * Math.PI * 2;
  //  starfieldPoints.rotation.y = -starAngle;
  //}

  if (isMoon && earthSkyMesh && earthSkyMaterial) {
    const nowMs = currentSimTime.getTime();
    const d = (nowMs - jd2000) / 86400000;
    const M = (134.963 + 13.064993 * d) * (Math.PI / 180);
    const F = (93.272 + 13.229350 * d) * (Math.PI / 180);
    const libLon = -6.29 * Math.sin(M);
    const libLat = -1.54 * Math.sin(F);
    const earthPos = latLonToVector3(libLat, libLon, 25);
    earthSkyMesh.position.copy(earthPos);
    const subLunarLon = (eclipseInfo && eclipseInfo.active) ? eclipseInfo.lon : currentMoonLon;
    earthSkyMesh.rotation.y = (180 - subLunarLon) * (Math.PI / 180);
    earthSkyMaterial.uniforms.uSunDirection.value.copy(sunDirWorld);

    if (eclipseInfo && eclipseInfo.active) {
      earthSkyMaterial.uniforms.uEclipseIntensity.value = eclipseInfo.intensity || 1.0;
      const shadowLocal = latLonToVector3(eclipseInfo.lat, eclipseInfo.lon, 1.0).normalize();
      earthSkyMaterial.uniforms.uMoonShadowLocalPos.value.copy(shadowLocal);
    } else {
      earthSkyMaterial.uniforms.uEclipseIntensity.value = 0.0;
    }
  }

  if (sunPinGroup) sunPinGroup.visible = !isSun && chkCelestial;
  if (moonPinGroup) moonPinGroup.visible = isEarth && !isMoon && chkCelestial;
  if (moonMesh) moonMesh.visible = isEarth && !isMoon && chkCelestial;
  if (earthSkyMesh) earthSkyMesh.visible = isMoon && chkCelestial;

  if (celestialGroup) {
    sunMesh.visible = !isSun && chkCelestial;
    celestialSunLight.visible = !isSun;
    if (!isSun) {
      const sunPos = latLonToVector3(subsolarLat, subsolarLon, 38);
      sunMesh.position.copy(sunPos);
      celestialSunLight.position.copy(sunPos);
    }
  }

  const isPinSunActive = chkCelestial;
  const isSunPinVisible = !isSun && isPinSunActive;

  if (sunPinGroup) sunPinGroup.visible = isSunPinVisible;
  if (moonPinGroup) moonPinGroup.visible = isEarth && isPinSunActive;
  if (moonMesh) moonMesh.visible = isEarth && !isMoon && isPinSunActive;
  if (earthSkyMesh) earthSkyMesh.visible = isMoon && isPinSunActive;

  if (earthPinGroup) {
    earthPinGroup.visible = !isEarth && isSunPinVisible;

    if (earthPinGroup.visible) {
      if (isMoon) {
        const nowMs = currentSimTime.getTime();
        const d = (nowMs - jd2000) / 86400000;
        const M = (134.963 + 13.064993 * d) * (Math.PI / 180);
        const F = (93.272 + 13.229350 * d) * (Math.PI / 180);
        const libLon = -6.29 * Math.sin(M);
        const libLat = -1.54 * Math.sin(F);
        updatePinPosition(earthPinGroup, libLat, libLon);
      } else if (typeof getSubPlanetaryPoint === 'function') {
        const earthCoords = getSubPlanetaryPoint('earth', currentSimTime);
        if (earthCoords) {
          updatePinPosition(earthPinGroup, earthCoords.lat, earthCoords.lon);
        }
      }
    }
  }

  if (typeof PLANET_CONFIG !== 'undefined' && typeof getSubPlanetaryPoint === 'function') {
    const showPlanets = document.getElementById('chk-planets')?.checked === true;
    PLANET_CONFIG.forEach(cfg => {
      const pin = planetPins[cfg.name];
      if (pin) {
        if (cfg.name === currentPlanet || cfg.name === 'earth') {
          pin.visible = false;
        } else {
          const coords = getSubPlanetaryPoint(cfg.name, currentSimTime);
          updatePinPosition(pin, coords.lat, coords.lon);
          pin.visible = showPlanets;
        }
      }
    });
  }

  updateConstellationVisibility();

  if (typeof state !== 'undefined') {
    state.epochMs = currentSimTime.getTime();
  }

  if (currentPlanet === 'earth') {
    if (typeof updateMoonPhaseWidget === 'function') updateMoonPhaseWidget();
  } else {
    if (typeof updatePlanetDayClock === 'function') updatePlanetDayClock();
  }

  if (typeof updateHUD === 'function') updateHUD();
  if (typeof updateCelestialEquatorOrientation === 'function') updateCelestialEquatorOrientation();
  if (typeof updatePlanetaryMoons === 'function') updatePlanetaryMoons();
}

function flyToSunPosition() { flyToPosition(currentSunLat, currentSunLon); }
function flyToMoonPosition() { flyToPosition(currentMoonLat, currentMoonLon); }
function flyToEclipseOrSunPosition() {
  const eclipseInfo = (typeof getEclipseInfo === 'function') ? getEclipseInfo(currentSimTime) : null;
  if (eclipseInfo && eclipseInfo.active && currentPlanet === 'earth') flyToPosition(eclipseInfo.lat, eclipseInfo.lon);
  else flyToSunPosition();
}

function flyToUserLocation() {
  if (currentPlanet !== 'earth') {
    if (typeof setPlanet === 'function') setPlanet('earth');
  }
  fetchUserLocation((loc) => {
    if (userPinGroup) userPinGroup.visible = true;
    flyToPosition(loc.lat, loc.lon);
  });
}

function flyToPosition(targetLat, targetLon, distance = 16) {
  const localTarget = latLonToVector3(targetLat, targetLon, distance);
  const worldTarget = localTarget.applyEuler(globeGroup.rotation);
  const endPos = worldTarget.clone();
  const endTarget = new THREE.Vector3(0, 0, 0);
  const startPos = camera.position.clone();
  const startTarget = controls.target.clone();
  let progress = 0;
  function animateCamera() {
    progress += 0.04;
    if (progress <= 1) {
      camera.position.lerpVectors(startPos, endPos, progress);
      controls.target.lerpVectors(startTarget, endTarget, progress);
      controls.update();
      requestAnimationFrame(animateCamera);
    } else {
      camera.position.copy(endPos); controls.target.copy(endTarget); controls.update();
    }
  }
  animateCamera();
}

function initFromUrlParams() {
  const urlParams = new URLSearchParams(window.location.search);

  let targetName = urlParams.get('body') || urlParams.get('planet') || urlParams.get('target');
  let targetCategory = (urlParams.get('type') || urlParams.get('cat') || '').toLowerCase();

  if (targetName && typeof CELESTIAL_BODIES !== 'undefined') {
    const bodyData = CELESTIAL_BODIES[targetName.toLowerCase()];
    if (bodyData) {
      targetCategory = bodyData.category;
      targetName = bodyData.name;
    }
  }

  let targetTime = null;
  const epochParam = urlParams.get('epoch');
  const dateParam = urlParams.get('date');   
  const timeParam = urlParams.get('time');   

  if (epochParam) {
    const epochNum = Number(epochParam);
    targetTime = new Date(epochNum < 1e11 ? epochNum * 1000 : epochNum);
  } else if (dateParam) {
    const timeStr = timeParam || '12:00:00';
    targetTime = new Date(`${dateParam}T${timeStr}Z`);
  }

  if (targetTime && !isNaN(targetTime.getTime())) {
    currentSimTime = targetTime;
    isRealtimeSync = false; 

    // --- NEW: Force the global engines to use the URL time! ---
    if (typeof state !== 'undefined') {
      state.epochMs = currentSimTime.getTime();
    }
    if (window.timeController) {
      window.timeController.currentDate = currentSimTime;
      window.timeController.isLiveSync = false;
      if (typeof window.timeController.updateUI === 'function') {
        window.timeController.updateUI(true);
      }
    }
    // -----------------------------------------------------------

    if (typeof updateRealtimeSyncUI === 'function') updateRealtimeSyncUI();
    if (typeof updateHeliosClock === 'function') updateHeliosClock(currentSimTime);
    if (typeof updateSunPosition === 'function') updateSunPosition();
  }

  if (targetCategory) {
    document.querySelectorAll('.cat-tab-btn').forEach(b => {
      const isMatch = b.getAttribute('data-cat') === targetCategory;
      b.classList.toggle('active', isMatch);
      b.classList.toggle('bg-blue-600/30', isMatch);
      b.classList.toggle('border-blue-400/40', isMatch);
      b.classList.toggle('text-slate-200', isMatch);
      b.classList.toggle('border-transparent', !isMatch);
      b.classList.toggle('text-slate-400', !isMatch);
    });
  }

  // WAKE THE 3D GLOBE INSTEAD OF JUST SETTING THE PLANET
  if (targetName) {
    // --- NEW: Sync state once on load to prevent the 2-click bug ---
    if (typeof HeliosBridge !== 'undefined') {
      HeliosBridge.mode = 'INSPECTOR_VIEW';
    }
    
    if (typeof wakeGlobe === 'function') {
      wakeGlobe(targetName);
    } else if (typeof setPlanet === 'function') {
      setPlanet(targetName, true);
    }
  }
}

let isGlobeActive = false;
let globeAnimId = null;

function animate(now) {
  if (!isGlobeActive) return;

  if (controls) controls.update();

  if (!animate.lastTime) animate.lastTime = now;
  const elapsed = now - animate.lastTime;

  if (elapsed < 33.33) return;
  const dt = Math.min(elapsed / 1000, 0.1);
  animate.lastTime = now - (elapsed % 33.33);

  const isSimPlaying = (typeof state !== 'undefined' && state.isPlaying) || 
                       (window.timeController && window.timeController.isPlaying);

  if (isSimPlaying) {
    if (typeof state !== 'undefined' && state.epochMs) {
      currentSimTime = new Date(state.epochMs);
    }
    if (window.timeController) {
      window.timeController.currentDate = currentSimTime;
    }
    if (typeof updateSunPosition === 'function') {
      updateSunPosition();
    }
  }

  if (controls) controls.update();

  if (typeof sunHalo !== 'undefined' && sunHalo && sunMesh && camera) {
    const dir = new THREE.Vector3().subVectors(sunMesh.position, camera.position).normalize();
    sunHalo.position.copy(dir.multiplyScalar(2.0));
  }

  if (cloudMesh && cloudMesh.visible && currentPlanet === 'earth') {
    const baseSpeed = (window.timeController && window.timeController.isPlaying) 
      ? (window.timeController.timeScale * 0.0000005) 
      : 0.0005;
    const rotSpeed = Math.min(baseSpeed, 0.015);
    const direction = (window.timeController && window.timeController.isReverse) ? -1 : 1;
    cloudMesh.rotation.y += direction * rotSpeed;
  }
  
  if (typeof marsDustMesh !== 'undefined' && marsDustMesh && marsDustMesh.visible && currentPlanet === 'mars') {
    const baseSpeed = (window.timeController && window.timeController.isPlaying) 
      ? (window.timeController.timeScale * 0.000001) 
      : 0.001;
    const rotSpeed = Math.min(baseSpeed, 0.025);
    const direction = (window.timeController && window.timeController.isReverse) ? -1 : 1;
    marsDustMesh.rotation.y += direction * rotSpeed;
  }

  if (typeof update3DCometTail === 'function') {
    update3DCometTail(currentPlanet);
  }

  updateConstellationVisibility();

  renderer.render(scene, camera);
}

function globeLoop(now) {
  if (!isGlobeActive) return;
  animate(now);
  globeAnimId = requestAnimationFrame(globeLoop);
}

window.wakeGlobe = function(targetPlanet) {
  if (isGlobeActive) return;
  isGlobeActive = true;

  const container = document.getElementById('webgl-container');
  if (container) container.classList.remove('hidden');

  // --- NEW: DISABLE 2D SOLAR SYSTEM HOVERS ---
  const obsCanvas = document.getElementById('observatory-canvas');
  if (obsCanvas) obsCanvas.style.pointerEvents = 'none';
  const orbitHud = document.getElementById('orbit-hover-hud');
  if (orbitHud) orbitHud.style.setProperty('display', 'none', 'important');

  if (controls) controls.enabled = true;
  lastFrameTime = performance.now();
  setPlanet(targetPlanet, true);

  // Sync View Toggle Button Text
  const btnViewToggle = document.getElementById('btn-view-toggle');
  if (btnViewToggle) {
    btnViewToggle.innerHTML = '<i class="fa-solid fa-arrow-left"></i> Enter Solar System View';
    btnViewToggle.classList.replace('bg-blue-600', 'bg-slate-700');
    btnViewToggle.classList.replace('hover:bg-blue-500', 'hover:bg-slate-600');
    btnViewToggle.classList.replace('border-blue-400/50', 'border-slate-500/50');
  }

  if (globeAnimId) cancelAnimationFrame(globeAnimId);
  globeAnimId = requestAnimationFrame(globeLoop);
};

window.sleepGlobe = function() {
  isGlobeActive = false;

  if (globeAnimId) {
    cancelAnimationFrame(globeAnimId);
    globeAnimId = null;
  }

  if (controls) controls.enabled = false;

  const container = document.getElementById('webgl-container');
  if (container) container.classList.add('hidden');

  // --- NEW: RESTORE 2D SOLAR SYSTEM HOVERS ---
  const obsCanvas = document.getElementById('observatory-canvas');
  if (obsCanvas) obsCanvas.style.pointerEvents = 'auto';
  const orbitHud = document.getElementById('orbit-hover-hud');
  if (orbitHud) orbitHud.style.removeProperty('display');

  // Reset View Toggle Button Text
  const btnViewToggle = document.getElementById('btn-view-toggle');
  if (btnViewToggle) {
    btnViewToggle.innerHTML = '<i class="fa-solid fa-cube"></i> Enter 3d Inspector';
    btnViewToggle.classList.replace('bg-slate-700', 'bg-blue-600');
    btnViewToggle.classList.replace('hover:bg-slate-600', 'hover:bg-blue-500');
    btnViewToggle.classList.replace('border-slate-500/50', 'border-blue-400/50');
  }
};



window.addEventListener('DOMContentLoaded', () => {
  initScene(); 
  if (typeof setupEventListeners === 'function') setupEventListeners(); 
  if (typeof setupHeliosNavEvents === 'function') setupHeliosNavEvents(); 
  initFromUrlParams();
});
