
// Procedural fallback if createPlanetXRingTexture is not loaded from globe_comet.js
function getPlanetXRingTexture() {
  if (typeof createPlanetXRingTexture === 'function') {
    return createPlanetXRingTexture();
  }
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 16;
  const ctx = canvas.getContext('2d');

  // Silvery-cyan high-contrast ice-and-dust ring stripes
  const grad = ctx.createLinearGradient(0, 0, 512, 0);
  grad.addColorStop(0.00, 'rgba(0, 0, 0, 0)');
  grad.addColorStop(0.05, 'rgba(56, 189, 248, 0.45)');
  grad.addColorStop(0.25, 'rgba(186, 230, 253, 0.90)');
  grad.addColorStop(0.48, 'rgba(14, 165, 233, 0.85)');
  grad.addColorStop(0.52, 'rgba(2, 6, 23, 0.10)'); // Cassini-like gap
  grad.addColorStop(0.58, 'rgba(56, 189, 248, 0.75)');
  grad.addColorStop(0.85, 'rgba(125, 211, 252, 0.60)');
  grad.addColorStop(1.00, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 16);

  // Micro-grooves
  for (let i = 0; i < 512; i += 4) {
    if (Math.sin(i * 0.4) > 0.2) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.fillRect(i, 0, 2, 16);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

function updatePlanetRings(planetName) {
  if (typeof planetRingGroup === 'undefined' || !planetRingGroup) return;

  while (planetRingGroup.children.length > 0) {
    const child = planetRingGroup.children[0];
    if (child.geometry) child.geometry.dispose();
    if (child.material) child.material.dispose();
    planetRingGroup.remove(child);
  }

  const PLANET_RINGS_DATA = {
    saturn: [
      { inner: 5.55, outer: 6.10, color: 0xc4b584, opacity: 0.28 },
      { inner: 6.20, outer: 7.20, color: 0xd9c89e, opacity: 0.55 },
      { inner: 7.30, outer: 8.35, color: 0xfef08a, opacity: 0.90 },
      { inner: 8.40, outer: 9.30, color: 0xfde047, opacity: 0.96 },
      { inner: 9.65, outer: 10.40, color: 0xf5deb3, opacity: 0.82 },
      { inner: 10.52, outer: 10.95, color: 0xe6cca0, opacity: 0.68 },
      { inner: 11.38, outer: 11.58, color: 0xfef9c3, opacity: 0.50 }
    ],
    jupiter: [
      { inner: 5.25, outer: 5.52, color: 0xb45309, opacity: 0.22 },
      { inner: 5.58, outer: 5.85, color: 0xf59e0b, opacity: 0.48 },
      { inner: 5.95, outer: 6.45, color: 0xfb923c, opacity: 0.25 },
      { inner: 6.55, outer: 7.15, color: 0xea580c, opacity: 0.14 }
    ],
    uranus: [
      { inner: 5.95, outer: 6.25, color: 0x7dd3fc, opacity: 0.35 },
      { inner: 6.45, outer: 6.85, color: 0x38bdf8, opacity: 0.50 },
      { inner: 7.05, outer: 7.55, color: 0xbae6fd, opacity: 0.60 },
      { inner: 7.85, outer: 8.30, color: 0xe0f2fe, opacity: 0.82 },
      { inner: 8.50, outer: 8.95, color: 0x0284c7, opacity: 0.22 }
    ],
    neptune: [
      { inner: 5.65, outer: 5.95, color: 0x1e40af, opacity: 0.25 },
      { inner: 6.15, outer: 6.65, color: 0x2563eb, opacity: 0.38 },
      { inner: 6.85, outer: 7.15, color: 0x60a5fa, opacity: 0.32 },
      { inner: 7.40, outer: 7.80, color: 0x93c5fd, opacity: 0.62 }
    ],
    planet_x: [
      { inner: 6.40, outer: 13.80, color: 0x38bdf8, opacity: 0.92, isTextureMode: true }
    ],

  };

  // Normalize spaces and hyphens to underscores so both 'Planet X' and 'planet_x' resolve
  const rawKey = String(planetName || '').toLowerCase().trim();
  const normalizedKey = rawKey.replace(/[\s\-]/g, '_');
  const ringList = PLANET_RINGS_DATA[rawKey] || PLANET_RINGS_DATA[normalizedKey];

  if (ringList && ringList.length > 0) {
    ringList.forEach(band => {
      const geom = new THREE.RingGeometry(band.inner, band.outer, 128, 8);
      let mat;

      if (band.isTextureMode) {
        mat = new THREE.MeshBasicMaterial({
          map: getPlanetXRingTexture(),
          side: THREE.DoubleSide,
          transparent: true,
          opacity: band.opacity,
          depthWrite: false
        });
      } else {
        mat = new THREE.ShaderMaterial({
          vertexShader: (typeof ringVertexShader !== 'undefined') ? ringVertexShader : '',
          fragmentShader: (typeof ringFragmentShader !== 'undefined') ? ringFragmentShader : '',
          uniforms: {
            uColor: { value: new THREE.Color(band.color) },
            uOpacity: { value: band.opacity },
            uSunDirection: (typeof ringShadowUniforms !== 'undefined' && ringShadowUniforms.uSunDirection) 
              ? ringShadowUniforms.uSunDirection 
              : { value: new THREE.Vector3(1, 0, 0) }
          },
          side: THREE.DoubleSide,
          transparent: true,
          depthWrite: false
        });
      }

      const mesh = new THREE.Mesh(geom, mat);
      planetRingGroup.add(mesh);
    });
    planetRingGroup.visible = true;
  } else {
    planetRingGroup.visible = false;
  }
}




// Keplerian orbital elements at J2000.0 and their rates per century (T)
// Formula: value = base + rate * T
const PLANETARY_ELEMENTS = {
  earth: {
    a:  [1.00000261,   0.00000562],
    e:  [0.01671123,  -0.00004392],
    I:  [0.00001531,  -0.01294668],
    L:  [100.46457166, 35999.37244981],
    w:  [102.93768193, 0.32327364],
    node: [0.0, 0.0]
  },
  mercury: {
    a:  [0.38709927,   0.00000037],
    e:  [0.20563593,   0.00001906],
    I:  [7.00497902,  -0.00594749],
    L:  [252.25032350, 149472.67411175],
    w:  [77.45779628,  0.16047689],
    node: [48.33076593, -0.12534081]
  },
  venus: {
    a:  [0.72333566,   0.00000490],
    e:  [0.00677672,  -0.00004107],
    I:  [3.39467605,  -0.00078890],
    L:  [181.97909950, 58517.81538729],
    w:  [131.60246718, 0.00268329],
    node: [76.67984255, -0.27769418]
  },
  mars: {
    a:  [1.52371034,   0.00001847],
    e:  [0.09339410,   0.00007882],
    I:  [1.84969142,  -0.00813131],
    L:  [-4.55343205,  19140.30268499],
    w:  [-23.94362959, 0.44441088],
    node: [49.55953891, -0.29257343]
  },
  jupiter: {
    a:  [5.20288700,  -0.00011607],
    e:  [0.04838624,  -0.00013253],
    I:  [1.30439695,  -0.00183714],
    L:  [34.39644051,  3034.74612775],
    w:  [14.72847983,  0.21252668],
    node: [100.47390909, 0.20469106]
  },
  saturn: {
    a:  [9.53667594,  -0.00125060],
    e:  [0.05386179,  -0.00050991],
    I:  [2.48599187,   0.00193609],
    L:  [49.95424423,  1222.49362201],
    w:  [92.59887831, -0.41897216],
    node: [113.66242448, -0.28867794]
  },
  uranus: {
    a:  [19.18916464, -0.00196176],
    e:  [0.04725744,  -0.00004397],
    I:  [0.77263783,  -0.00242939],
    L:  [313.23810451, 428.48202785],
    w:  [170.95427630, 0.40805281],
    node: [74.01692503,  0.04240589]
  },
  neptune: {
    a:  [30.06992276,  0.00026291],
    e:  [0.00860610,   0.00005105],
    I:  [1.77004347,   0.00035372],
    L:  [-55.12002969, 218.45945325],
    w:  [44.96476224, -0.32241464],
    node: [131.78422574, -0.00508664]
  }
};

const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;

/**
 * Solves Kepler's Equation M = E - e * sin(E) using Newton-Raphson iteration
 */
function solveKepler(M, e) {
  let E = M;
  for (let i = 0; i < 5; i++) {
    const delta = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
    E -= delta;
    if (Math.abs(delta) < 1e-6) break;
  }
  return E;
}

/**
 * Calculates 3D heliocentric ecliptic coordinates (AU) for a given body
 */
function getHeliocentricPosition(elem, T) {
  const a = elem.a[0] + elem.a[1] * T;
  const e = elem.e[0] + elem.e[1] * T;
  const I = (elem.I[0] + elem.I[1] * T) * DEG2RAD;
  const L = (elem.L[0] + elem.L[1] * T) * DEG2RAD;
  const w = (elem.w[0] + elem.w[1] * T) * DEG2RAD;
  const node = (elem.node[0] + elem.node[1] * T) * DEG2RAD;

  const peri = w - node; // Argument of perihelion
  let M = (L - w) % (2 * Math.PI);
  if (M < 0) M += 2 * Math.PI;

  const E = solveKepler(M, e);

  // Position in orbital plane
  const xPrime = a * (Math.cos(E) - e);
  const yPrime = a * Math.sqrt(1 - e * e) * Math.sin(E);

  // Transform to Heliocentric Ecliptic coordinates
  const cosNode = Math.cos(node), sinNode = Math.sin(node);
  const cosPeri = Math.cos(peri), sinPeri = Math.sin(peri);
  const cosI = Math.cos(I), sinI = Math.sin(I);

  const Px = cosPeri * cosNode - sinPeri * sinNode * cosI;
  const Py = cosPeri * sinNode + sinPeri * cosNode * cosI;
  const Pz = sinPeri * sinI;

  const Qx = -sinPeri * cosNode - cosPeri * sinNode * cosI;
  const Qy = -sinPeri * sinNode + cosPeri * cosNode * cosI;
  const Qz = cosPeri * sinI;

  return {
    x: xPrime * Px + yPrime * Qx,
    y: xPrime * Py + yPrime * Qy,
    z: xPrime * Pz + yPrime * Qz
  };
}

function getSubPlanetaryPoint(targetPlanetName, date) {
  const ms = date.getTime();
  const d = (ms - Date.UTC(2000, 0, 1, 12, 0, 0)) / (86400 * 1000);
  const T = d / 36525; // Julian centuries since J2000.0

  const isTargetSun = (targetPlanetName === 'sun');
  const tgtName = targetPlanetName; 
  const tarElems = PLANETARY_ELEMENTS[tgtName];

  // Allow 'Sun' to proceed even without orbital elements
  if (!tarElems && !isTargetSun) return { lat: 0, lon: 0 };

  // Heliocentric position: Sun is at (0, 0, 0)
  const tarPos = isTargetSun ? { x: 0, y: 0, z: 0 } : getHeliocentricPosition(tarElems, T);
  let gx, gy, gz;

  if (currentPlanet === 'sun') {
    gx = tarPos.x;
    gy = tarPos.y;
    gz = tarPos.z;
  } else {
    const obsName = currentPlanet; // Fixed syntax error
    const obsElems = PLANETARY_ELEMENTS[obsName] || PLANETARY_ELEMENTS.earth;
    const obsPos = getHeliocentricPosition(obsElems, T);
    gx = tarPos.x - obsPos.x;
    gy = tarPos.y - obsPos.y;
    gz = tarPos.z - obsPos.z;
  }

  const dyn = PLANET_DYNAMICS[currentPlanet] || PLANET_DYNAMICS.earth;
  const eps = dyn.tilt * (Math.PI / 180);



  const cosEps = Math.cos(eps);
  const sinEps = Math.sin(eps);

  const xEq = gx;
  const yEq = gy * cosEps - gz * sinEps;
  const zEq = gy * sinEps + gz * cosEps;

  const dist = Math.sqrt(xEq * xEq + yEq * yEq + zEq * zEq);
  const dec = Math.asin(zEq / dist) * (180 / Math.PI);
  let ra = Math.atan2(yEq, xEq) * (180 / Math.PI);
  if (ra < 0) ra += 360;

  let gmst;
  if (currentPlanet === 'earth') {
    gmst = (280.46061837 + 360.98564736629 * d) % 360;
  } else {
    const diffHours = (ms - Date.UTC(2000, 0, 1, 12, 0, 0)) / 3600000;
    gmst = (diffHours / dyn.solarDayHours) * 360;
  }

  let gha = (gmst - ra) % 360;
  if (gha < 0) gha += 360;

  let lon = -gha;
  while (lon < -180) lon += 360;
  while (lon > 180)  lon -= 360;

  return { lat: dec, lon: lon };
}



function populatePlanetTable() {  // Currently not being used but might be added back later. (do not delete)
  const container = document.getElementById('planet-table-container');
  if (!container) return;

  const BODIES = [
    { name: 'sun',     icon: '☀️', type: 'Yellow Dwarf (G2V)', diam: '1,392,700 km', dist: '0.00 AU',  tilt: '7.25°',   day: '27.4 days',   year: '—',           majorMoons: 0, otherMoons: 0 },
    { name: 'mercury', icon: '☿',  type: 'Terrestrial',        diam: '4,879 km',     dist: '0.39 AU',  tilt: '0.03°',   day: '176.0 days',  year: '88.0 days',   majorMoons: 0, otherMoons: 0 },
    { name: 'venus',   icon: '♀',  type: 'Terrestrial',        diam: '12,104 km',    dist: '0.72 AU',  tilt: '177.36°', day: '116.7 days',  year: '224.7 days',  majorMoons: 0, otherMoons: 0 },
    { name: 'earth',   icon: '🌍', type: 'Terrestrial',        diam: '12,742 km',    dist: '1.00 AU',  tilt: '23.44°',  day: '24.0 hours',  year: '365.25 days', majorMoons: 1, otherMoons: 0 },
    { name: 'moon',    icon: '🌑', type: 'Natural Satellite',  diam: '3,474 km',     dist: '1.00 AU',  tilt: '1.54°',   day: '29.53 days',  year: '365.25 days', majorMoons: 0, otherMoons: 0 },
    { name: 'mars',    icon: '♂',  type: 'Terrestrial',        diam: '6,779 km',     dist: '1.52 AU',  tilt: '25.19°',  day: '24.66 hours', year: '687.0 days',  majorMoons: 0, otherMoons: 2 },
    { name: 'jupiter', icon: '♃',  type: 'Gas Giant',          diam: '139,820 km',   dist: '5.20 AU',  tilt: '3.13°',   day: '9.93 hours',  year: '11.86 years', majorMoons: 4, otherMoons: 91 },
    { name: 'saturn',  icon: '♄',  type: 'Gas Giant',          diam: '116,460 km',   dist: '9.58 AU',  tilt: '26.73°',  day: '10.66 hours', year: '29.45 years', majorMoons: 7, otherMoons: 139 },
    { name: 'uranus',  icon: '♅',  type: 'Ice Giant',          diam: '50,724 km',    dist: '19.20 AU', tilt: '97.77°',  day: '17.24 hours', year: '84.02 years', majorMoons: 5, otherMoons: 23 },
    { name: 'neptune', icon: '♆',  type: 'Ice Giant',          diam: '49,244 km',    dist: '30.05 AU', tilt: '28.32°',  day: '16.11 hours', year: '164.79 years',majorMoons: 1, otherMoons: 15 }
  ];

  let html = `
    <table class="w-full text-left border-collapse">
      <thead>
        <tr class="border-b border-slate-700/80 text-[11px] uppercase tracking-wider text-slate-400 bg-slate-900/80 sticky top-0">
          <th class="p-2.5">Body</th>
          <th class="p-2.5">Classification</th>
          <th class="p-2.5 leading-tight">Equatorial<br>Diameter</th>
          <th class="p-2.5 leading-tight">Distance<br>From Sun</th>
          <th class="p-2.5">Axial Tilt</th>
          <th class="p-2.5">Solar Day</th>
          <th class="p-2.5 leading-tight">Orbital<br>Period</th>
          <th class="p-2.5 leading-tight text-center">Major<br>Moons</th>
          <th class="p-2.5 leading-tight text-center">Other<br>Moons</th>
          <th class="p-2.5 text-right">View</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-slate-800/60">
  `;

  BODIES.forEach(b => {
    const isCurrent = (currentPlanet === b.name);
    html += `
      <tr class="hover:bg-slate-800/40 transition-colors ${isCurrent ? 'bg-blue-600/15' : ''}">
        <td class="p-2.5 font-semibold text-slate-100 flex items-center gap-2">
          <span class="text-base">${b.icon}</span> ${b.name}
        </td>
        <td class="p-2.5 text-slate-300">${b.type}</td>
        <td class="p-2.5 font-mono text-slate-300">${b.diam}</td>
        <td class="p-2.5 font-mono text-slate-300">${b.dist}</td>
        <td class="p-2.5 font-mono text-slate-300">${b.tilt}</td>
        <td class="p-2.5 font-mono text-slate-300">${b.day}</td>
        <td class="p-2.5 font-mono text-slate-300">${b.year}</td>
        <td class="p-2.5 font-mono text-slate-200 text-center font-semibold">${b.majorMoons}</td>
        <td class="p-2.5 font-mono text-slate-400 text-center">${b.otherMoons}</td>
        <td class="p-2.5 text-right">
          <button class="planet-table-select-btn px-2.5 py-1 rounded-lg text-[10px] font-semibold tracking-wider uppercase transition-all ${isCurrent ? 'bg-blue-600 text-white' : 'glass-button text-slate-300 hover:text-white'}" data-planet="${b.name}">
            ${isCurrent ? 'Active' : 'Select'}
          </button>
        </td>
      </tr>
    `;
  });

  html += `</tbody></table>`;
  container.innerHTML = html;

  container.querySelectorAll('.planet-table-select-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const pName = e.currentTarget.getAttribute('data-planet');
      setPlanet(pName);
      document.getElementById('planet-table-modal')?.classList.add('hidden');
    });
  });
}




/**
 * planets.js
 * Low-precision Keplerian ephemeris for Mercury through Neptune relative to J2000.0.
 * Produces sub-planetary coordinates (latitude & longitude) on Earth.
 */

const PLANET_CONFIG = [
  { name: 'mercury', icon: '☿', color: 0x94a3b8, stem: 0x64748b, ring: 0xcbd5e1, size: 0.08 },
  { name: 'venus',   icon: '♀', color: 0xfef08a, stem: 0xeab308, ring: 0xfef9c3, size: 0.11 },
  { name: 'earth',   icon: '🌍', color: 0x3b82f6, stem: 0x1d4ed8, ring: 0x60a5fa, size: 1.00 }, 
  { name: 'mars',    icon: '♂', color: 0xef4444, stem: 0xb91c1c, ring: 0xf87171, size: 0.09 },
  { name: 'jupiter', icon: '♃', color: 0xfb923c, stem: 0xc2410c, ring: 0xfdba74, size: 0.16 },
  { name: 'saturn',  icon: '♄', color: 0xfde047, stem: 0xa16207, ring: 0xfef08a, size: 0.14 },
  { name: 'uranus',  icon: '♅', color: 0x38bdf8, stem: 0x0284c7, ring: 0x7dd3fc, size: 0.12 },
  { name: 'neptune', icon: '♆', color: 0x6366f1, stem: 0x4338ca, ring: 0x818cf8, size: 0.12 },
];


// Planetary Dynamics (Axial Tilt in degrees, Year in Earth Days, Solar Day in Hours)
const PLANET_DYNAMICS = {
  sun:     { tilt: 7.25,   yearDays: 1,       solarDayHours: 657.6 }, 
  moon:    { tilt: 1.54,   yearDays: 365.25,  solarDayHours: 708.73 },
  mercury: { tilt: 0.034,  yearDays: 87.97,   solarDayHours: 4224 },
  venus:   { tilt: 177.36, yearDays: 224.70,  solarDayHours: 2802 },
  earth:   { tilt: 23.44,  yearDays: 365.25,  solarDayHours: 24 },
  mars:    { tilt: 25.19,  yearDays: 686.98,  solarDayHours: 24.6597 },
  jupiter: { tilt: 3.13,   yearDays: 4332.59, solarDayHours: 9.925 },
  saturn:  { tilt: 26.73,  yearDays: 10759,   solarDayHours: 10.656 },
  uranus:  { tilt: 97.77,  yearDays: 30688,   solarDayHours: 17.24 }, 
  neptune: { tilt: 28.32,  yearDays: 60182,   solarDayHours: 16.11 }
};

