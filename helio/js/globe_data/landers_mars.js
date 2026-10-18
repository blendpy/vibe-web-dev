
let marsLandersGroup = null;

// --- 3D MODEL GENERATOR 1: MARS ROVER ---
function createMarsRoverMesh() {
  const roverGroup = new THREE.Group();

  // 1. Rover Main Chassis
  const bodyGeo = new THREE.BoxGeometry(0.08, 0.035, 0.11);
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    metalness: 0.6,
    roughness: 0.35
  });
  const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
  bodyMesh.position.y = 0.045;
  roverGroup.add(bodyMesh);

  // 2. Sensor Mast / Remote Sensing Head
  const mastGeo = new THREE.CylinderGeometry(0.004, 0.004, 0.08);
  const mastMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.7, roughness: 0.4 });
  const mastMesh = new THREE.Mesh(mastGeo, mastMat);
  mastMesh.position.set(0.02, 0.09, 0.035);
  roverGroup.add(mastMesh);

  // Mastcam / SuperCam head unit
  const headGeo = new THREE.BoxGeometry(0.024, 0.016, 0.016);
  const headMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.2 });
  const headMesh = new THREE.Mesh(headGeo, headMat);
  headMesh.position.set(0.02, 0.13, 0.035);
  roverGroup.add(headMesh);

  // 3. Power System (Cylindrical MMRTG Generator or Solar Deck)
  const rtgGeo = new THREE.CylinderGeometry(0.014, 0.014, 0.04, 8);
  const rtgMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8, roughness: 0.25 });
  const rtgMesh = new THREE.Mesh(rtgGeo, rtgMat);
  rtgMesh.rotation.x = Math.PI / 2;
  rtgMesh.position.set(0, 0.05, -0.055);
  roverGroup.add(rtgMesh);

  // 4. Rocker-Bogie 6-Wheel Suspension
  const wheelGeo = new THREE.CylinderGeometry(0.013, 0.013, 0.012, 12);
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8, metalness: 0.3 });
  
  const wheelOffsets = [
    [-0.055, 0.014, 0.042],  // Front Left
    [0.055, 0.014, 0.042],   // Front Right
    [-0.058, 0.014, 0.0],    // Mid Left
    [0.058, 0.014, 0.0],     // Mid Right
    [-0.055, 0.014, -0.042], // Rear Left
    [0.055, 0.014, -0.042]   // Rear Right
  ];

  wheelOffsets.forEach(([x, y, z]) => {
    const wheel = new THREE.Mesh(wheelGeo, wheelMat);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(x, y, z);
    roverGroup.add(wheel);
  });

  // 5. Orange Martian Ground Pulse Ring
  const beaconGeo = new THREE.RingGeometry(0.08, 0.13, 32);
  const beaconMat = new THREE.MeshBasicMaterial({
    color: 0xf97316,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.85
  });
  const beaconRing = new THREE.Mesh(beaconGeo, beaconMat);
  beaconRing.rotation.x = Math.PI / 2;
  beaconRing.position.y = 0.002;
  roverGroup.add(beaconRing);

  return roverGroup;
}

// --- 3D MODEL GENERATOR 2: STATIONARY LANDER ---
function createMarsLanderMesh() {
  const landerGroup = new THREE.Group();

  // 1. Central Instrument Deck
  const busGeo = new THREE.CylinderGeometry(0.055, 0.065, 0.035, 6);
  const busMat = new THREE.MeshStandardMaterial({ color: 0xd4d4d8, metalness: 0.65, roughness: 0.35 });
  const busMesh = new THREE.Mesh(busGeo, busMat);
  busMesh.position.y = 0.036;
  landerGroup.add(busMesh);

  // 2. Circular Deployable Solar Arrays (Phoenix / InSight style)
  const solarGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.003, 16);
  const solarMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, metalness: 0.85, roughness: 0.2 });
  [-0.085, 0.085].forEach(x => {
    const wing = new THREE.Mesh(solarGeo, solarMat);
    wing.position.set(x, 0.045, 0);
    landerGroup.add(wing);
  });

  // 3. Weather / Meteorology Mast & Sensor Claw
  const armGeo = new THREE.CylinderGeometry(0.003, 0.003, 0.06);
  const armMat = new THREE.MeshStandardMaterial({ color: 0x64748b });
  const armMesh = new THREE.Mesh(armGeo, armMat);
  armMesh.position.set(0, 0.075, 0.02);
  armMesh.rotation.x = -0.3;
  landerGroup.add(armMesh);

  // 4. Tripod Landing Struts & Footpads
  const strutMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.6 });
  const padGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.003, 8);
  for (let i = 0; i < 3; i++) {
    const angle = (i * Math.PI * 2) / 3;
    const px = Math.cos(angle) * 0.095;
    const pz = Math.sin(angle) * 0.095;

    const pad = new THREE.Mesh(padGeo, strutMat);
    pad.position.set(px, 0.002, pz);
    landerGroup.add(pad);

    const strutGeo = new THREE.CylinderGeometry(0.003, 0.003, 0.075);
    const strut = new THREE.Mesh(strutGeo, strutMat);
    strut.position.set(px * 0.5, 0.018, pz * 0.5);
    strut.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(px, -0.035, pz).normalize());
    landerGroup.add(strut);
  }

  // 5. Amber Landing Beacon Pulse Ring
  const beaconGeo = new THREE.RingGeometry(0.07, 0.12, 32);
  const beaconMat = new THREE.MeshBasicMaterial({
    color: 0xf59e0b,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.85
  });
  const beaconRing = new THREE.Mesh(beaconGeo, beaconMat);
  beaconRing.rotation.x = Math.PI / 2;
  beaconRing.position.y = 0.002;
  landerGroup.add(beaconRing);

  return landerGroup;
}

// --- ROOT MARS LANDERS SCENE GROUP ---
function createMarsLandersGroup(marsRadius = 5.0) {
  const rootGroup = new THREE.Group();
  rootGroup.name = "marsLandersGroup";

  MARS_LANDING_SITES.forEach(site => {
    const isRover = (site.type === "Rover");
    const model = isRover ? createMarsRoverMesh() : createMarsLanderMesh();

    const pos = latLonToVector3(site.lat, site.lon, marsRadius);
    model.position.copy(pos);

    const normal = pos.clone().normalize();
    model.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);

    model.userData = site;
    rootGroup.add(model);
  });

  rootGroup.renderOrder = 10;
  return rootGroup;
}

// --- SPATIAL HOVER LOOKUP ---
function findNearbyMarsLander(lat, lon, thresholdDeg = 3.5) {
  let closest = null;
  let minDist = Infinity;
  const rad = Math.PI / 180;
  const cosLat = Math.cos(lat * rad);

  for (const site of MARS_LANDING_SITES) {
    const dLat = lat - site.lat;
    let dLon = Math.abs(lon - site.lon);
    if (dLon > 180) dLon = 360 - dLon;
    const dLonScaled = dLon * cosLat;
    const dist = Math.sqrt(dLat * dLat + dLonScaled * dLonScaled);

    if (dist <= thresholdDeg && dist < minDist) {
      minDist = dist;
      closest = site;
    }
  }
  return closest;
}


/**
 * mars_landers.js
 * 3D Models and Ephemeris Catalog for Mars Rovers and Stationary Landers
 */

const MARS_LANDING_SITES = [
  // --- HISTORIC & RETIRED LANDERS ---
  {
    name: "Mars 3 Lander",
    category: "Robotic Stationary Lander",
    type: "Lander",
    flag: "🇷🇺",
    date: "December 2, 1971",
    lat: -45.0,
    lon: -158.0,
    site: "Sirenum Terra",
    details: "First spacecraft to survive a soft landing on Mars; transmitted a 20-second image fragment before succumbing to a massive global dust storm."
  },
  {
    name: "Viking 1 Lander",
    category: "Robotic Stationary Lander",
    type: "Lander",
    flag: "🇺🇸",
    date: "July 20, 1976",
    lat: 22.697,
    lon: -48.222,
    site: "Chryse Planitia (Plains of Gold)",
    details: "First long-duration operational lander on Mars (2,245 sols); took the first color photos of the surface and analyzed Martian soil chemistry."
  },
  {
    name: "Viking 2 Lander",
    category: "Robotic Stationary Lander",
    type: "Lander",
    flag: "🇺🇸",
    date: "September 3, 1976",
    lat: 48.269,
    lon: 134.01,
    site: "Utopia Planitia",
    details: "Operated for 1,281 sols; conducted biological experiments, recorded weather patterns, and detected subsurface water ice beneath regolith."
  },
  {
    name: "Mars Pathfinder (Sojourner)",
    category: "Robotic Rover & Base Station",
    type: "Rover",
    flag: "🇺🇸",
    date: "July 4, 1997",
    lat: 19.13,
    lon: -33.22,
    site: "Ares Vallis",
    details: "Historic airbag landing deploying Sojourner, humanity's first wheeled rover on Mars; analyzed catastrophic ancient flood channel rocks."
  },
  {
    name: "Spirit (MER-A)",
    category: "Robotic Solar-Powered Rover",
    type: "Rover",
    flag: "🇺🇸",
    date: "January 4, 2004",
    lat: -14.5684,
    lon: 175.4729,
    site: "Gusev Crater (Columbia Memorial Station)",
    details: "Operated for 2,210 sols (24x its planned warranty); discovered silica deposits that proved past hot springs and hydrothermal activity."
  },
  {
    name: "Opportunity (MER-B)",
    category: "Robotic Solar-Powered Rover",
    type: "Rover",
    flag: "🇺🇸",
    date: "January 25, 2004",
    lat: -1.9462,
    lon: -5.5266,
    site: "Meridiani Planum (Challenger Memorial Station)",
    details: "Traveled a record 45.16 km over 14.5 years; discovered hematite 'blueberries' providing definitive evidence of ancient standing water."
  },
  {
    name: "Phoenix",
    category: "Robotic Arctic Ice Lander",
    type: "Lander",
    flag: "🇺🇸",
    date: "May 25, 2008",
    lat: 68.2188,
    lon: -125.7492,
    site: "Vastitas Borealis (Green Valley)",
    details: "Northern polar plain lander; used a backhoe robotic arm to dig into frozen permafrost and directly verify pure subsurface water ice."
  },
  {
    name: "Beagle 2",
    category: "Robotic Stationary Lander",
    type: "Lander",
    flag: "🇬🇧",
    date: "December 25, 2003",
    lat: 11.5265,
    lon: 90.4295,
    site: "Isidis Planitia",
    details: "British astrobiology probe that successfully soft-landed on Christmas Day but failed to deploy its final solar panel covering the radio antenna."
  },
  {
    name: "InSight",
    category: "Robotic Geophysical Lander",
    type: "Lander",
    flag: "🇺🇸",
    date: "November 26, 2018",
    lat: 4.5024,
    lon: 135.6234,
    site: "Elysium Planitia",
    details: "Interior exploration lander; deployed the SEIS seismometer which recorded over 1,300 marsquakes and mapped Mars's crust, mantle, and molten core."
  },

  // --- MODERN & ACTIVE SURFACE EXPLORERS ---
  {
    name: "Curiosity (MSL)",
    category: "Robotic Nuclear-Powered Rover",
    type: "Rover",
    flag: "🇺🇸",
    date: "August 6, 2012",
    lat: -4.5895,
    lon: 137.4417,
    site: "Gale Crater (Bradbury Landing)",
    details: "SUV-sized rover powered by an MMRTG; climbing Mount Sharp, proved ancient Gale Crater held fresh water lakes capable of sustaining microbial life."
  },
  {
    name: "Tianwen-1 (Zhurong Rover)",
    category: "Robotic Rover & Lander",
    type: "Rover",
    flag: "🇨🇳",
    date: "May 15, 2021",
    lat: 25.066,
    lon: 109.925,
    site: "Southern Utopia Planitia",
    details: "China's first Mars surface mission; deployed the solar-powered Zhurong rover equipped with subsurface radar to map ancient lakebed sediment."
  },
  {
    name: "Perseverance & Ingenuity",
    category: "Robotic Rover & Mars Helicopter",
    type: "Rover",
    flag: "🇺🇸",
    date: "February 18, 2021",
    lat: 18.4447,
    lon: 77.4508,
    site: "Jezero Crater (Octavia E. Butler Landing)",
    details: "Drilling and caching core samples for Earth return; accompanied by Ingenuity, which performed 72 historic powered flights in the thin Martian atmosphere."
  }
];



