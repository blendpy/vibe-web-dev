
let venusLandersGroup = null;

// --- 3D MODEL GENERATOR: SOVIET VENERA / VEGA LANDER ---
function createVenusLanderMesh() {
  const landerGroup = new THREE.Group();

  // 1. Torus Shock-Absorbing Landing Ring (Crushable landing base)
  const ringGeo = new THREE.TorusGeometry(0.065, 0.012, 12, 24);
  const ringMat = new THREE.MeshStandardMaterial({
    color: 0x78716c,
    metalness: 0.8,
    roughness: 0.4
  });
  const landingRing = new THREE.Mesh(ringGeo, ringMat);
  landingRing.rotation.x = Math.PI / 2;
  landingRing.position.y = 0.012;
  landerGroup.add(landingRing);

  // 2. Heavy Titanium Spherical Pressure Vessel (houses cameras & electronics)
  const sphereGeo = new THREE.SphereGeometry(0.045, 16, 16);
  const vesselMat = new THREE.MeshStandardMaterial({
    color: 0xd6d3d1,
    metalness: 0.65,
    roughness: 0.35
  });
  const pressureVessel = new THREE.Mesh(sphereGeo, vesselMat);
  pressureVessel.position.y = 0.048;
  landerGroup.add(pressureVessel);

  // 3. Conical Aerodynamic Braking Disc / Drag Plate (Aero-disk shield)
  const diskGeo = new THREE.CylinderGeometry(0.085, 0.075, 0.008, 24);
  const diskMat = new THREE.MeshStandardMaterial({
    color: 0xb45309, // Heat-tempered titanium bronze
    metalness: 0.75,
    roughness: 0.3
  });
  const dragDisk = new THREE.Mesh(diskGeo, diskMat);
  dragDisk.position.y = 0.088;
  landerGroup.add(dragDisk);

  // 4. Helical Telemetry Antenna Mast
  const mastGeo = new THREE.CylinderGeometry(0.003, 0.003, 0.05, 8);
  const mastMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.9, roughness: 0.2 });
  const mast = new THREE.Mesh(mastGeo, mastMat);
  mast.position.set(0, 0.115, 0);
  landerGroup.add(mast);

  // Antenna top spiral cone
  const topGeo = new THREE.ConeGeometry(0.015, 0.02, 8);
  const topMesh = new THREE.Mesh(topGeo, mastMat);
  topMesh.position.set(0, 0.14, 0);
  landerGroup.add(topMesh);

  // 5. Golden-Amber Venusian Ground Pulse Ring
  const beaconGeo = new THREE.RingGeometry(0.075, 0.125, 32);
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

// --- ROOT VENUS LANDERS SCENE GROUP ---
function createVenusLandersGroup(venusRadius = 5.0) {
  const rootGroup = new THREE.Group();
  rootGroup.name = "venusLandersGroup";

  VENUS_LANDING_SITES.forEach(site => {
    const model = createVenusLanderMesh();

    const pos = latLonToVector3(site.lat, site.lon, venusRadius);
    model.position.copy(pos);

    const normal = pos.clone().normalize();
    model.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);

    model.userData = site;
    rootGroup.add(model);
  });

  rootGroup.renderOrder = 10;
  return rootGroup;
}

// --- SPATIAL HOVER QUERY FUNCTION ---
function findNearbyVenusLander(lat, lon, thresholdDeg = 3.5) {
  let closest = null;
  let minDist = Infinity;
  const rad = Math.PI / 180;
  const cosLat = Math.cos(lat * rad);

  for (const site of VENUS_LANDING_SITES) {
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
 * venus_landers.js
 * 3D Models and Ephemeris Catalog for Venus Landing Sites (Venera, Vega, and Pioneer Venus)
 */

const VENUS_LANDING_SITES = [
  {
    name: "Venera 7",
    category: "Robotic Atmospheric Lander",
    type: "Venera",
    flag: "🇷🇺",
    date: "December 15, 1970",
    lat: -5.0,
    lon: -9.0,
    site: "Navka Planitia",
    details: "First human spacecraft to successfully land on another planet and transmit telemetry; survived 23 minutes in 475°C heat and 90 atm pressure."
  },
  {
    name: "Venera 8",
    category: "Robotic Atmospheric Lander",
    type: "Venera",
    flag: "🇷🇺",
    date: "July 22, 1972",
    lat: -10.70,
    lon: -24.75,
    site: "Vasilisa Regio",
    details: "Transmitted for 50 minutes from the ground; confirmed that surface illumination was bright enough for photography and measured granite-like rocks."
  },
  {
    name: "Venera 9",
    category: "Robotic Imaging Lander",
    type: "Venera",
    flag: "🇷🇺",
    date: "October 22, 1975",
    lat: 31.01,
    lon: -68.36,
    site: "Beta Regio",
    details: "Historic mission transmitting the first black-and-white panoramic photograph of another planetary surface, revealing sharp volcanic slab rocks."
  },
  {
    name: "Venera 10",
    category: "Robotic Imaging Lander",
    type: "Venera",
    flag: "🇷🇺",
    date: "October 25, 1975",
    lat: 15.42,
    lon: -68.49,
    site: "Beta Regio",
    details: "Transmitted surface imagery and wind speed measurements for 65 minutes; photographed pancake-like lava formations and weathered basalt."
  },
  {
    name: "Pioneer Venus Day Probe",
    category: "Robotic Impact Probe",
    type: "Pioneer",
    flag: "🇺🇸",
    date: "December 9, 1978",
    lat: -31.3,
    lon: -43.0,
    site: "Southern Lowlands",
    details: "NASA probe designed to analyze the atmosphere; remarkably survived surface impact without a parachute and continued transmitting signals for 67 minutes."
  },
  {
    name: "Venera 11",
    category: "Robotic Soil & Atmospheric Lander",
    type: "Venera",
    flag: "🇷🇺",
    date: "December 25, 1978",
    lat: -14.0,
    lon: -61.0,
    site: "Phoebe Regio",
    details: "Survived 95 minutes on the surface; detected powerful low-frequency electrical discharges (Martian/Venusian lightning) in the clouds."
  },
  {
    name: "Venera 12",
    category: "Robotic Atmosphere & Soil Lander",
    type: "Venera",
    flag: "🇷🇺",
    date: "December 21, 1978",
    lat: -37.0,
    lon: -70.0,
    site: "Southern Beta Regio",
    details: "Operated for 110 minutes on the scorching surface; detected carbon monoxide, sulfur dioxide, and chlorine in the dense lower atmosphere."
  },
  {
    name: "Venera 13",
    category: "Robotic Color Imaging & Drill Lander",
    type: "Venera",
    flag: "🇷🇺",
    date: "March 1, 1982",
    lat: -7.5,
    lon: -57.0,
    site: "Phoebe Regio",
    details: "Returned the first color panoramic photographs and recorded the sound of wind on Venus; drilled and analyzed alkaline leucite basalt (survived 127 min)."
  },
  {
    name: "Venera 14",
    category: "Robotic Color Imaging & Drill Lander",
    type: "Venera",
    flag: "🇷🇺",
    date: "March 5, 1982",
    lat: -13.25,
    lon: -50.0,
    site: "Phoebe Regio",
    details: "Operated for 57 minutes; returned 360° color panoramas and extracted drill samples revealing tholeiitic basalt similar to Earth's mid-ocean ridges."
  },
  {
    name: "Vega 1 Lander",
    category: "Robotic Lander & Balloon Carrier",
    type: "Venera",
    flag: "🇷🇺",
    date: "June 11, 1985",
    lat: 7.5,
    lon: 177.7,
    site: "Mermaid Plain (Rusalka Planitia)",
    details: "Deployed a long-duration floating atmospheric balloon before landing; conducted automated surface drilling and soil fluorescence analysis."
  },
  {
    name: "Vega 2 Lander",
    category: "Robotic Lander & Balloon Carrier",
    type: "Venera",
    flag: "🇷🇺",
    date: "June 15, 1985",
    lat: -8.5,
    lon: 164.5,
    site: "Eastern Aphrodite Terra",
    details: "Operated for 56 minutes on the surface; collected and analyzed basic rock samples containing anorthosite-troctolite mineral composition."
  }
];

