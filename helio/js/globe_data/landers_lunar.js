
let lunarLandersGroup = null;

// --- 3D MODEL GENERATOR 1: APOLLO LUNAR MODULE ---
function createApolloLanderMesh() {
  const lmGroup = new THREE.Group();

  // 1. Octagonal Descent Stage (gold thermal foil)
  const descentGeo = new THREE.CylinderGeometry(0.08, 0.088, 0.045, 8);
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xdfb14b,
    metalness: 0.85,
    roughness: 0.25
  });
  const descentMesh = new THREE.Mesh(descentGeo, goldMat);
  descentMesh.position.y = 0.038;
  lmGroup.add(descentMesh);

  // 2. Faceted Ascent Stage Cabin (silver/grey anodized aluminium)
  const cabinGeo = new THREE.BoxGeometry(0.065, 0.055, 0.06);
  const silverMat = new THREE.MeshStandardMaterial({
    color: 0xd1d5db,
    metalness: 0.7,
    roughness: 0.4
  });
  const cabinMesh = new THREE.Mesh(cabinGeo, silverMat);
  cabinMesh.position.y = 0.082;
  lmGroup.add(cabinMesh);

  // 3. Side Cylindrical Fuel Tanks
  const tankGeo = new THREE.CylinderGeometry(0.016, 0.016, 0.045, 8);
  [-0.036, 0.036].forEach(x => {
    const tank = new THREE.Mesh(tankGeo, silverMat);
    tank.position.set(x, 0.082, 0);
    lmGroup.add(tank);
  });

  // 4. Steerable Rendezvous Antenna Dish
  const dishGeo = new THREE.ConeGeometry(0.022, 0.012, 8, 1, true);
  const antennaMesh = new THREE.Mesh(dishGeo, goldMat);
  antennaMesh.rotation.x = -Math.PI / 3;
  antennaMesh.position.set(0, 0.125, 0);
  lmGroup.add(antennaMesh);

  // 5. 4 Tripod Landing Struts & Footpads
  const legMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.6, roughness: 0.3 });
  const padMat = new THREE.MeshStandardMaterial({ color: 0xdfb14b, metalness: 0.9, roughness: 0.2 });
  const padGeo = new THREE.CylinderGeometry(0.014, 0.014, 0.004, 8);

  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI) / 2 + Math.PI / 4;
    const px = Math.cos(angle) * 0.11;
    const pz = Math.sin(angle) * 0.11;

    // Footpad on ground
    const pad = new THREE.Mesh(padGeo, padMat);
    pad.position.set(px, 0.002, pz);
    lmGroup.add(pad);

    // Diagonal strut connecting to descent stage
    const strutGeo = new THREE.CylinderGeometry(0.004, 0.004, 0.09);
    const strut = new THREE.Mesh(strutGeo, legMat);
    strut.position.set(px * 0.55, 0.022, pz * 0.55);
    strut.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(px, -0.04, pz).normalize());
    lmGroup.add(strut);
  }

  // 6. Amber Ground Beacon Pulse Ring
  const beaconGeo = new THREE.RingGeometry(0.08, 0.13, 32);
  const beaconMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b, side: THREE.DoubleSide, transparent: true, opacity: 0.85 });
  const beaconRing = new THREE.Mesh(beaconGeo, beaconMat);
  beaconRing.rotation.x = Math.PI / 2;
  beaconRing.position.y = 0.002;
  lmGroup.add(beaconRing);

  return lmGroup;
}

// --- 3D MODEL GENERATOR 2: ROBOTIC PROBE / LANDER ---
function createRoboticLanderMesh() {
  const probeGroup = new THREE.Group();

  // 1. Hexagonal Bus Body (white/metallic spacecraft shell)
  const busGeo = new THREE.CylinderGeometry(0.05, 0.055, 0.045, 6);
  const busMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, metalness: 0.4, roughness: 0.3 });
  const busMesh = new THREE.Mesh(busGeo, busMat);
  busMesh.position.y = 0.035;
  probeGroup.add(busMesh);

  // 2. Deployable Solar Panel Wings (deep solar blue)
  const panelGeo = new THREE.BoxGeometry(0.16, 0.004, 0.045);
  const panelMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, metalness: 0.85, roughness: 0.2 });
  const panelMesh = new THREE.Mesh(panelGeo, panelMat);
  panelMesh.position.set(0, 0.045, 0);
  probeGroup.add(panelMesh);

  // 3. High-Gain Parabolic Communications Dish
  const dishGeo = new THREE.CylinderGeometry(0.032, 0.006, 0.015, 12, 1, true);
  const dishMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.7, roughness: 0.3, side: THREE.DoubleSide });
  const dishMesh = new THREE.Mesh(dishGeo, dishMat);
  dishMesh.position.set(0, 0.075, 0.015);
  dishMesh.rotation.x = 0.35;
  probeGroup.add(dishMesh);

  // 4. Central Instrument Mast / Antenna
  const mastGeo = new THREE.CylinderGeometry(0.003, 0.003, 0.06);
  const mastMat = new THREE.MeshBasicMaterial({ color: 0x94a3b8 });
  const mastMesh = new THREE.Mesh(mastGeo, mastMat);
  mastMesh.position.set(0, 0.085, -0.015);
  probeGroup.add(mastMesh);

  // 5. 3 Tripod Landing Legs
  const legMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.7, roughness: 0.3 });
  for (let i = 0; i < 3; i++) {
    const angle = (i * Math.PI * 2) / 3;
    const px = Math.cos(angle) * 0.09;
    const pz = Math.sin(angle) * 0.09;

    const strutGeo = new THREE.CylinderGeometry(0.004, 0.004, 0.07);
    const strut = new THREE.Mesh(strutGeo, legMat);
    strut.position.set(px * 0.5, 0.018, pz * 0.5);
    strut.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(px, -0.035, pz).normalize());
    probeGroup.add(strut);
  }

  // 6. Cyan Ground Beacon Pulse Ring
  const beaconGeo = new THREE.RingGeometry(0.065, 0.11, 32);
  const beaconMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide, transparent: true, opacity: 0.85 });
  const beaconRing = new THREE.Mesh(beaconGeo, beaconMat);
  beaconRing.rotation.x = Math.PI / 2;
  beaconRing.position.y = 0.002;
  probeGroup.add(beaconRing);

  return probeGroup;
}

// --- BUILD LUNAR LANDERS ROOT GROUP ---
function createLunarLandersGroup(moonRadius = 5.0) {
  const rootGroup = new THREE.Group();
  rootGroup.name = "lunarLandersGroup";

  LUNAR_LANDING_SITES.forEach(site => {
    const isApollo = (site.type === "Apollo");
    const model = isApollo ? createApolloLanderMesh() : createRoboticLanderMesh();

    // Position directly on the surface (radius 5.0)
    const pos = latLonToVector3(site.lat, site.lon, moonRadius);
    model.position.copy(pos);

    // Align local Y-axis with the surface normal vector
    const normal = pos.clone().normalize();
    model.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);

    // Attach data reference for hover lookups
    model.userData = site;
    rootGroup.add(model);
  });

  rootGroup.renderOrder = 10;
  return rootGroup;
}

// --- SPATIAL HOVER QUERY FUNCTION ---
function findNearbyLunarLander(lat, lon, thresholdDeg = 3.2) {
  let closest = null;
  let minDist = Infinity;
  const rad = Math.PI / 180;
  const cosLat = Math.cos(lat * rad);

  for (const site of LUNAR_LANDING_SITES) {
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
 * lunar_landers.js
 * 3D Models and Ephemeris Catalog for Apollo and Robotic Lunar Landing Sites
 */

const LUNAR_LANDING_SITES = [
  // --- 6 APOLLO CREWED LANDINGS ---
  {
    name: "Apollo 11 (LM Eagle)",
    category: "Crewed Apollo Lander",
    type: "Apollo",
    flag: "🇺🇸",
    date: "July 20, 1969",
    lat: 0.6741,
    lon: 23.4730,
    site: "Mare Tranquillitatis (Sea of Tranquility)",
    details: "First crewed landing. Neil Armstrong & Buzz Aldrin spent 21.6 hrs on the surface and gathered 21.5 kg of lunar regolith."
  },
  {
    name: "Apollo 12 (LM Intrepid)",
    category: "Crewed Apollo Lander",
    type: "Apollo",
    flag: "🇺🇸",
    date: "November 19, 1969",
    lat: -3.0124,
    lon: -23.4216,
    site: "Oceanus Procellarum (Ocean of Storms)",
    details: "Precision landing within 160m of Surveyor 3. Pete Conrad & Alan Bean retrieved parts of the robotic probe for Earth return."
  },
  {
    name: "Apollo 14 (LM Antares)",
    category: "Crewed Apollo Lander",
    type: "Apollo",
    flag: "🇺🇸",
    date: "February 5, 1971",
    lat: -3.6453,
    lon: -17.4714,
    site: "Fra Mauro Highlands",
    details: "Alan Shepard & Edgar Mitchell deployed the ALSEP station; Shepard famously struck two golf balls on the lunar surface."
  },
  {
    name: "Apollo 15 (LM Falcon)",
    category: "Crewed Apollo Lander",
    type: "Apollo",
    flag: "🇺🇸",
    date: "July 30, 1971",
    lat: 26.1322,
    lon: 3.6339,
    site: "Hadley Rille / Apennine Mountains",
    details: "First extended J-mission featuring the Lunar Roving Vehicle (LRV). David Scott & James Irwin collected the 4-billion-year-old Genesis Rock."
  },
  {
    name: "Apollo 16 (LM Orion)",
    category: "Crewed Apollo Lander",
    type: "Apollo",
    flag: "🇺🇸",
    date: "April 21, 1972",
    lat: -8.9730,
    lon: 15.4981,
    site: "Descartes Highlands",
    details: "Explored the rugged central lunar highlands. John Young & Charlie Duke drove 26.7 km in the LRV and returned 95.8 kg of highland samples."
  },
  {
    name: "Apollo 17 (LM Challenger)",
    category: "Crewed Apollo Lander",
    type: "Apollo",
    flag: "🇺🇸",
    date: "December 11, 1972",
    lat: 20.1908,
    lon: 30.7717,
    site: "Taurus-Littrow Valley",
    details: "Final Apollo lunar mission. Eugene Cernan & Harrison Schmitt (first professional geologist on the Moon) discovered pyroclastic orange soil."
  },

  // --- 12 ROBOTIC LUNAR LANDERS & PROBES ---
  {
    name: "Luna 2",
    category: "Robotic Lunar Impactor",
    type: "Robotic",
    flag: "🇷🇺",
    date: "September 13, 1959",
    lat: 29.10,
    lon: 0.00,
    site: "Palus Putredinis",
    details: "First human-made spacecraft to reach the surface of the Moon; confirmed the absence of a strong lunar magnetic field."
  },
  {
    name: "Luna 9",
    category: "Robotic Soft Lander",
    type: "Robotic",
    flag: "🇷🇺",
    date: "February 3, 1966",
    lat: 7.08,
    lon: -64.37,
    site: "Oceanus Procellarum",
    details: "First successful robotic soft landing in history; transmitted the first television panoramas directly from the lunar ground."
  },
  {
    name: "Surveyor 1",
    category: "Robotic Soft Lander",
    type: "Robotic",
    flag: "🇺🇸",
    date: "June 2, 1966",
    lat: -2.474,
    lon: -43.340,
    site: "Oceanus Procellarum",
    details: "First American lunar soft landing. Transmitted 11,200 photos and confirmed the lunar regolith could support the weight of an Apollo lander."
  },
  {
    name: "Surveyor 3",
    category: "Robotic Soil Sampler",
    type: "Robotic",
    flag: "🇺🇸",
    date: "April 20, 1967",
    lat: -3.016,
    lon: -23.418,
    site: "Oceanus Procellarum",
    details: "First probe equipped with a surface sampling claw; famously visited and examined by the Apollo 12 crew in November 1969."
  },
  {
    name: "Surveyor 7",
    category: "Robotic Highland Lander",
    type: "Robotic",
    flag: "🇺🇸",
    date: "January 10, 1968",
    lat: -40.976,
    lon: -11.458,
    site: "Tycho Crater Rim",
    details: "Final Surveyor spacecraft; landed on the rugged ejecta blanket of Tycho Crater and analyzed highland chemical composition."
  },
  {
    name: "Luna 16",
    category: "Robotic Sample Return",
    type: "Robotic",
    flag: "🇷🇺",
    date: "September 20, 1970",
    lat: -0.68,
    lon: 56.30,
    site: "Mare Fecunditatis",
    details: "First fully automated robotic sample return mission; drilled and returned 101 grams of lunar soil to Earth."
  },
  {
    name: "Luna 17 (Lunokhod 1)",
    category: "Robotic Rover Carrier",
    type: "Robotic",
    flag: "🇷🇺",
    date: "November 17, 1970",
    lat: 38.28,
    lon: -35.00,
    site: "Mare Imbrium",
    details: "Deployed Lunokhod 1, the first roving remote-controlled vehicle on another celestial body, operating for 322 days and covering 10.5 km."
  },
  {
    name: "Luna 24",
    category: "Robotic Deep Drill Return",
    type: "Robotic",
    flag: "🇷🇺",
    date: "August 18, 1976",
    lat: 12.71,
    lon: 62.20,
    site: "Mare Crisium",
    details: "Final mission of the Soviet Luna program; used a rotary drill to extract a 2-meter core sample, returning 170g of layered regolith."
  },
  {
    name: "Chang'e 3 (Yutu Rover)",
    category: "Robotic Lander & Rover",
    type: "Robotic",
    flag: "🇨🇳",
    date: "December 14, 2013",
    lat: 44.12,
    lon: -19.51,
    site: "Mare Imbrium",
    details: "First lunar soft landing in 37 years; deployed the Yutu rover equipped with ground-penetrating radar to measure regolith depth."
  },
  {
    name: "Chang'e 4 (Yutu-2)",
    category: "Robotic Farside Lander",
    type: "Robotic",
    flag: "🇨🇳",
    date: "January 3, 2019",
    lat: -45.44,
    lon: 177.60,
    site: "Von Kármán Crater (Farside)",
    details: "Historic first-ever soft landing on the far side of the Moon; communicates via the Queqiao relay satellite at the Earth-Moon L2 point."
  },
  {
    name: "Chang'e 5",
    category: "Robotic Sample Return",
    type: "Robotic",
    flag: "🇨🇳",
    date: "December 1, 2020",
    lat: 43.06,
    lon: -51.92,
    site: "Northern Oceanus Procellarum",
    details: "Robotic lunar sample return mission; drilled and scooped 1.731 kg of geologically young volcanic basalts (~2 billion years old)."
  },
  {
    name: "Chandrayaan-3 (Vikram / Pragyan)",
    category: "Robotic Polar Lander",
    type: "Robotic",
    flag: "🇮🇳",
    date: "August 23, 2023",
    lat: -69.37,
    lon: 32.32,
    site: "Shiv Shakti Point (South Polar Region)",
    details: "First spacecraft to land near the lunar south polar region; deployed the Pragyan rover which confirmed the presence of sulfur and measured plasma density."
  }
];

