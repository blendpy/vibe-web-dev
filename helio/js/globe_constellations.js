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
    color: 0xffff00,
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


