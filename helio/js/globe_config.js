// =============================================================
// GLOBE_CONFIG.JS - Data Dictionary & Ephemeris Configurations
// =============================================================

const TEXTURE_URLS_FULL = {
  blueMarble: 'img/earth-blue-marble.jpg',  //=2k
  day:   'img/earth-day-solarsystemscope-8k-light-blue.jpg',  //=8K
  dark:  'img/earth-dark.png',
  night: 'img/earth-night.jpg',
  water: 'img/earth-water.png'
};

const TEXTURE_URLS_FALLBACK = {
  blueMarble: 'https://cdn.jsdelivr.net/gh/vasturiano/three-globe@master/example/img/earth-blue-marble.jpg',
  day: 'https://cdn.jsdelivr.net/gh/vasturiano/three-globe@master/example/img/earth-day.jpg',
  dark: 'https://cdn.jsdelivr.net/gh/vasturiano/three-globe@master/example/img/earth-dark.png',
  night: 'https://cdn.jsdelivr.net/gh/vasturiano/three-globe@master/example/img/earth-night.jpg',
  water: 'https://cdn.jsdelivr.net/gh/vasturiano/three-globe@master/example/img/earth-water.png'
};

// -------------------------------------------------------------
// PLANETARY SATELLITES & MOONS CATALOG
// -------------------------------------------------------------
const PLANET_MOONS = {
  earth: [
    { name: 'moon', icon: '🌕', color: 0x94a3b8 }
  ],
  mars: [
    { name: 'phobos', icon: '🥔', color: 0x78716c }, // 9,376 km
    { name: 'deimos', icon: '🥔', color: 0xa8a29e }  // 23,463 km
  ],
  jupiter: [
    { name: 'io',       icon: '🟡', color: 0xfacc15 }, // 421,700 km
    { name: 'europa',   icon: '⚪', color: 0xe2e8f0 }, // 670,900 km
    { name: 'ganymede', icon: '🟤', color: 0xa8a29e }, // 1,070,400 km
    { name: 'callisto', icon: '🌑', color: 0x64748b }  // 1,882,700 km
  ],
  saturn: [
    { name: 'mimas',     icon: '⚪', color: 0x94a3b8 }, // 185,539 km (Inner rim)
    { name: 'enceladus', icon: '⚪', color: 0xf8fafc }, // 237,948 km
    { name: 'tethys',    icon: '⚪', color: 0xd1d5db }, // 294,619 km
    { name: 'dione',     icon: '⚪', color: 0xe2e8f0 }, // 377,396 km
    { name: 'rhea',      icon: '⚪', color: 0xcbd5e1 }, // 527,108 km
    { name: 'titan',     icon: '🟠', color: 0xf59e0b }, // 1,221,870 km
    { name: 'iapetus',   icon: '🌗', color: 0x78716c }  // 3,560,820 km (Outer boundary)
  ],
  uranus: [
    { name: 'miranda', icon: '⚪', color: 0x94a3b8 }, // 129,390 km
    { name: 'ariel',   icon: '⚪', color: 0xe2e8f0 }, // 191,020 km
    { name: 'umbriel', icon: '🌑', color: 0x475569 }, // 266,000 km
    { name: 'titania', icon: '⚪', color: 0xcbd5e1 }, // 435,910 km
    { name: 'oberon',  icon: '🟤', color: 0x78716c }  // 583,520 km
  ],
  neptune: [
    { name: 'proteus', icon: '🌑', color: 0x64748b }, // 117,647 km (Closest major moon)
    { name: 'triton',  icon: '🔵', color: 0x38bdf8 }, // 354,759 km (Retrograde)
    { name: 'nereid',  icon: '🌑', color: 0x475569 }  // 5,513,818 km (Distant eccentric)
  ],
  pluto: [
    { name: 'charon', icon: '🌑', color: 0xd6d3d1 }
  ],
  eris: [
    { name: 'dysnomia', icon: '🌑', color: 0xa8a29e }
  ],
  orcus: [
    { name: 'vanth', icon: '🌑', color: 0x78716c }
  ]
};

// -------------------------------------------------------------
// 3D ORBITING SATELLITES EPHEMERIS CONFIGURATION
// -------------------------------------------------------------
const GIANT_MOON_ORBITS = {
  mars: [
    { name: 'phobos', period: 0.319, dist: 7.2, radius: 0.14, color: 0x78716c, epoch: 1.2 },
    { name: 'deimos', period: 1.262, dist: 11.5, radius: 0.11, color: 0xa8a29e, epoch: 3.5 }
  ],
  jupiter: [
    { name: 'io',       period: 1.769,  dist: 7.8,  radius: 0.32, color: 0xfacc15, epoch: 0.5 },
    { name: 'europa',   period: 3.551,  dist: 10.6, radius: 0.28, color: 0xe2e8f0, epoch: 1.8 },
    { name: 'ganymede', period: 7.155,  dist: 15.2, radius: 0.48, color: 0xa8a29e, epoch: 3.4 },
    { name: 'callisto', period: 16.689, dist: 21.0, radius: 0.44, color: 0x64748b, epoch: 5.1 }
  ],
  saturn: [
    { name: 'mimas',     period: 0.942,  dist: 11.165, radius: 0.10, color: 0xd1d5db, epoch: 0.8 },
    { name: 'enceladus', period: 1.370,  dist: 13.2, radius: 0.22, color: 0xf8fafc, epoch: 2.1 },
    { name: 'tethys',    period: 1.887,  dist: 14.2, radius: 0.26, color: 0xd1d5db, epoch: 3.5 },
    { name: 'dione',     period: 2.736,  dist: 15.4, radius: 0.28, color: 0xe2e8f0, epoch: 1.1 },
    { name: 'rhea',      period: 4.518,  dist: 16.8, radius: 0.32, color: 0xe2e8f0, epoch: 4.0 },
    { name: 'titan',     period: 15.945, dist: 21.5, radius: 0.52, color: 0xf59e0b, epoch: 1.2 },
    { name: 'iapetus',   period: 79.322, dist: 27.0, radius: 0.32, color: 0x78716c, epoch: 5.7, inc: 0.26 }
  ],
  uranus: [
    { name: 'miranda', period: 1.413,  dist: 7.6,  radius: 0.18, color: 0xd1d5db, epoch: 1.0 },
    { name: 'ariel',   period: 2.520,  dist: 10.2, radius: 0.28, color: 0xe2e8f0, epoch: 2.7 },
    { name: 'umbriel', period: 4.144,  dist: 13.2, radius: 0.28, color: 0x64748b, epoch: 4.3 },
    { name: 'titania', period: 8.706,  dist: 17.2, radius: 0.38, color: 0xcbd5e1, epoch: 0.2 },
    { name: 'oberon',  period: 13.463, dist: 21.8, radius: 0.36, color: 0x9ca3af, epoch: 3.8 }
  ],
  neptune: [
    { name: 'proteus', period: 1.122,   dist: 8.2,  radius: 0.20, color: 0x64748b, epoch: 2.2 },
    { name: 'triton',  period: -5.877,  dist: 13.8, radius: 0.42, color: 0x7dd3fc, epoch: 4.9, inc: 2.74 }, 
    { name: 'nereid',  period: 360.136, dist: 21.5, radius: 0.18, color: 0x475569, epoch: 1.5 }
  ]
};

// -------------------------------------------------------------
// PARENT PLANET SKY CONFIGURATION (Viewed from Moons)
// -------------------------------------------------------------
const PARENT_SKY_CONFIG = {
  // Mars Moons
  phobos:    { parent: 'mars', radius: 9.6, dist: 28.0 }, 
  deimos:    { parent: 'mars', radius: 4.0, dist: 28.0 }, 

  // Jupiter Galilean Moons
  io:        { parent: 'jupiter', radius: 4.8, dist: 28.0 }, 
  europa:    { parent: 'jupiter', radius: 3.0, dist: 28.0 }, 
  ganymede:  { parent: 'jupiter', radius: 1.8, dist: 28.0 }, 
  callisto:  { parent: 'jupiter', radius: 1.0, dist: 28.0 }, 

  // Saturn Moons
  mimas:     { parent: 'saturn', radius: 8.4, dist: 28.0, rings: { inner: 10.1, outer: 20.0 } },
  enceladus: { parent: 'saturn', radius: 6.8, dist: 28.0, rings: { inner: 8.2,  outer: 16.3 } },
  tethys:    { parent: 'saturn', radius: 5.6, dist: 28.0, rings: { inner: 6.7,  outer: 13.4 } },
  dione:     { parent: 'saturn', radius: 4.2, dist: 28.0, rings: { inner: 5.0,  outer: 10.0 } },
  rhea:      { parent: 'saturn', radius: 3.1, dist: 28.0, rings: { inner: 3.8,  outer: 7.5 } },
  titan:     { parent: 'saturn', radius: 1.35, dist: 28.0, rings: { inner: 1.6,  outer: 3.2 } },  
  iapetus:   { parent: 'saturn', radius: 0.46, dist: 28.0, rings: { inner: 0.55, outer: 1.1 }, tiltX: 0.26 }, 

  // Uranus Moons
  miranda:   { parent: 'uranus', radius: 5.5, dist: 28.0, rings: { inner: 6.6, outer: 9.2 } },
  ariel:     { parent: 'uranus', radius: 3.7, dist: 28.0, rings: { inner: 4.5, outer: 6.2 } },
  umbriel:   { parent: 'uranus', radius: 2.6, dist: 28.0 },
  titania:   { parent: 'uranus', radius: 1.6, dist: 28.0 },
  oberon:    { parent: 'uranus', radius: 1.2, dist: 28.0 },

  // Neptune Moons
  proteus:   { parent: 'neptune', radius: 5.8, dist: 28.0 },
  triton:    { parent: 'neptune', radius: 1.9, dist: 28.0, tiltX: 0.48 },
  nereid:    { parent: 'neptune', radius: 0.25, dist: 28.0 },

  // Dwarf Planet Moons
  charon:    { parent: 'pluto', radius: 8.5, dist: 28.0 }, // Charon is massive relative to Pluto
  dysnomia:  { parent: 'eris', radius: 1.5, dist: 28.0 },
  vanth:     { parent: 'orcus', radius: 3.5, dist: 28.0 }
};


// -------------------------------------------------------------
// PLANETARY INTERIOR COMPOSITIONS
// -------------------------------------------------------------
const PLANETARY_INTERIORS = {
  sun: {
    isGas: true, // Smooth plasma gradients
    layers: [
      { name: 'Nuclear Core', radius: 0.25, color: 0xffffff },       // 15 million °C fusion engine (White hot)
      { name: 'Radiative Zone', radius: 0.70, color: 0xfacc15 },     // Dense plasma (Yellow)
      { name: 'Convective Zone', radius: 1.0, color: 0xea580c }      // Boiling outer plasma (Orange-Red)
    ]
  },
  mercury: {
    isGas: false,
    layers: [
      { name: 'Massive Core', radius: 0.85, color: 0xd97706 }, // Takes up 85% of planet!
      { name: 'Mantle', radius: 0.96, color: 0x78716c },
      { name: 'Crust', radius: 1.0, color: 0xa3a3a3 }
    ]
  },
  venus: {
    isGas: false,
    layers: [
      { name: 'Metallic Core', radius: 0.51, color: 0xd97706 }, // ~3,100km iron-nickel core
      { name: 'Rocky Mantle', radius: 0.95, color: 0x991b1b },  // Thick silicate mantle
      { name: 'Crust', radius: 1.0, color: 0xb45309 }           // Exaggerated basaltic crust
    ]
  },
  earth: {
    isGas: false,
    layers: [
      { name: 'Inner Core', radius: 0.20, color: 0xffe066 }, // Solid iron/nickel
      { name: 'Outer Core', radius: 0.54, color: 0xf97316 }, // Liquid metal
      { name: 'Lower Mantle', radius: 0.88, color: 0xdc2626 }, // Silicate rock
      { name: 'Upper Mantle', radius: 0.95, color: 0x991b1b },
      { name: 'Crust', radius: 1.0, color: 0x78716c } // Exaggerated for visibility
    ]
  },
  mars: {
    isGas: false,
    layers: [
      { name: 'Inner Core', radius: 0.25, color: 0xd97706 }, // Solid/liquid iron
      { name: 'Outer Core', radius: 0.45, color: 0xb45309 },
      { name: 'Mantle', radius: 0.92, color: 0x991b1b }, // Rocky mantle
      { name: 'Crust', radius: 1.0, color: 0x9a3412 } 
    ]
  },
  moon: {
    isGas: false,
    layers: [
      { name: 'Solid Core', radius: 0.12, color: 0xfacc15 },
      { name: 'Fluid Core', radius: 0.20, color: 0xca8a04 },
      { name: 'Partial Melt', radius: 0.28, color: 0x991b1b },
      { name: 'Rigid Mantle', radius: 0.94, color: 0x475569 },
      { name: 'Crust', radius: 1.0, color: 0x94a3b8 }
    ]
  },
  jupiter: {
    isGas: true, // Triggers smooth gradient shader
    layers: [
      { name: 'Rock/Ice Core', radius: 0.15, color: 0x9ca3af },
      { name: 'Metallic Hydrogen', radius: 0.78, color: 0x1e3a8a }, 
      { name: 'Molecular Hydrogen', radius: 1.0, color: 0xfcd34d }
    ]
  },
  saturn: {
    isGas: true,
    layers: [
      { name: 'Rock/Ice Core', radius: 0.20, color: 0x9ca3af },
      { name: 'Metallic Hydrogen', radius: 0.55, color: 0x1e40af },
      { name: 'Molecular Hydrogen', radius: 1.0, color: 0xfef08a }
    ]
  },
  uranus: {
    isGas: true, // Creates a smooth transition from gas to fluid ice
    layers: [
      { name: 'Rocky Core', radius: 0.20, color: 0x9ca3af },             // Silicate/Iron-Nickel core
      { name: 'Icy Mantle', radius: 0.80, color: 0x2dd4bf },             // Slushy water, ammonia, methane
      { name: 'Hydrogen/Helium Envelope', radius: 1.0, color: 0xbae6fd } // Pale cyan atmosphere
    ]
  },
  neptune: {
    isGas: true, 
    layers: [
      { name: 'Rocky Core', radius: 0.20, color: 0x9ca3af },             // Silicate/Iron-Nickel core
      { name: 'Icy Mantle', radius: 0.80, color: 0x0369a1 },             // Slushy water, ammonia, methane
      { name: 'Hydrogen/Helium Envelope', radius: 1.0, color: 0x3b82f6 } // Vivid blue atmosphere
    ]
  },


  // --- JUPITER: THE GALILEAN MOONS ---
  ganymede: {
    isGas: false,
    layers: [
      { name: 'Metallic Core', radius: 0.30, color: 0xd97706 }, // Iron/nickel "iron snow"
      { name: 'Rocky Mantle', radius: 0.70, color: 0x57534e },  
      { name: 'Subsurface Ocean', radius: 0.85, color: 0x0284c7 }, // Deep briny water
      { name: 'Ice Shell', radius: 1.0, color: 0xe2e8f0 }
    ]
  },
  io: {
    isGas: false,
    layers: [
      { name: 'Massive Metallic Core', radius: 0.45, color: 0x78350f }, // Iron/iron sulfide
      { name: 'Molten Mantle', radius: 0.95, color: 0xf97316 }, // Magma ocean / tidal heating
      { name: 'Crust', radius: 1.0, color: 0xfacc15 } // Yellowish sulfur crust
    ]
  },
  europa: {
    isGas: false,
    layers: [
      { name: 'Metallic Core', radius: 0.20, color: 0xd97706 }, 
      { name: 'Rocky Mantle', radius: 0.80, color: 0x57534e },
      { name: 'Global Ocean', radius: 0.95, color: 0x0ea5e9 }, // Liquid water
      { name: 'Icy Crust', radius: 1.0, color: 0xffffff }
    ]
  },
  callisto: {
    isGas: false,
    layers: [
      { name: 'Primitive Center', radius: 0.25, color: 0x57534e }, // Undifferentiated rock/iron
      { name: 'Mixed Rock & Ice Slush', radius: 0.90, color: 0x94a3b8 }, // The incomplete differentiation
      { name: 'Icy Crust', radius: 1.0, color: 0xcbd5e1 }
    ]
  },

  // --- SATURN'S MAJOR MOONS ---
  dione: {
    isGas: false,
    layers: [
      { name: "Silicate Core", radius: 0.70, color: "#78716c" },
      { name: "Subsurface Ocean", radius: 0.75, color: "#0ea5e9" },
      { name: "Icy Crust", radius: 1.00, color: "#e2e8f0" }
    ]
  },
  titan: {
    isGas: false,
    layers: [
      { name: 'Mixed Rock/Ice Core', radius: 0.60, color: 0x475569 }, // Dense de-volatized rock/ice
      { name: 'High-Pressure Ice', radius: 0.75, color: 0x94a3b8 },
      { name: 'Subsurface Ocean', radius: 0.90, color: 0x0284c7 },
      { name: 'Ice Shell', radius: 1.0, color: 0xfcb045 } // Tinted orange for its hazy atmosphere interface
    ]
  },
  enceladus: {
    isGas: false,
    layers: [
      { name: 'Porous Fragmented Core', radius: 0.65, color: 0x78716c }, // Hot rock, sand, and mud
      { name: 'Global Ocean', radius: 0.85, color: 0x38bdf8 }, // Heated by tidal friction
      { name: 'Icy Crust', radius: 1.0, color: 0xf1f5f9 }
    ]
  },
  mimas: {
    isGas: false,
    layers: [
      { name: 'Elongated Rocky Core', radius: 0.45, color: 0x57534e }, // Football-shaped core
      { name: 'Subsurface Ocean / Slush', radius: 0.65, color: 0x0284c7 }, 
      { name: 'Thick Icy Crust', radius: 1.0, color: 0xe2e8f0 }
    ]
  },

  // --- NEPTUNE'S CAPTURED MOON ---
  triton: {
    isGas: false,
    layers: [
      { name: 'Dense Rock/Metal Core', radius: 0.70, color: 0x57534e }, // Roughly 2/3 of total mass
      { name: 'Subsurface Ocean', radius: 0.85, color: 0x0369a1 }, 
      { name: 'Icy Mantle & Crust', radius: 1.0, color: 0xa5f3fc }
    ]
  },
  // PLUTO
  charon: {
    isGas: false,
    layers: [
      { name: "Rocky Core", radius: 0.66, color: "#57534e" },
      { name: "Icy Mantle & Crust", radius: 1.00, color: "#d6d3d1" }
    ]
  },

};
