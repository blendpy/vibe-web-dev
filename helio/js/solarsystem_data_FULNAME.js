// =============================================================
// SOLARSYSTEM_DATA.JS - Celestial Ephemeris & Categories
// =============================================================

/**
 * CELESTIAL EPHEMERIS DATABASE (J2000 Epoch)
 */
const CELESTIAL_BODIES = {
  // ===== 8 MAJOR PLANETS =====
  'mercury': {
    id: 'mercury', name: 'Mercury', category: 'planets',
    color: '#a3a3a3', glow: 'rgba(163, 163, 163, 0.45)', radius: 3.2,
    a0: 0.38709927, e0: 0.20563593, I0: 7.00497902, L0: 252.25032350, longPeri0: 77.45779628, node0: 48.33076593,
    LRate: 149472.67411175, periodDays: 87.97, diameterKm: 4879, type: 'Terrestrial Planet',
    description: 'The innermost planet in the Solar System. Completes one orbit every 87.97 days with a noticeable 7.0° inclination.'
  },
  'venus': {
    id: 'venus', name: 'Venus', category: 'planets',
    color: '#e2b36e', glow: 'rgba(226, 179, 110, 0.45)', radius: 4.8,
    a0: 0.72333566, e0: 0.00677672, I0: 3.39467605, L0: 181.97909950, longPeri0: 131.60246718, node0: 76.67984255,
    LRate: 58517.81538729, periodDays: 224.70, diameterKm: 12104, type: 'Terrestrial Planet',
    description: 'Second planet from the Sun with a dense atmosphere composed of 96.5% carbon dioxide.'
  },
  'earth': {
    id: 'earth', name: 'Earth', category: 'planets',
    color: '#3b82f6', glow: 'rgba(59, 130, 246, 0.5)', radius: 5.0,
    a0: 1.00000261, e0: 0.01671123, I0: 0.00001531, L0: 100.46457166, longPeri0: 102.93768193, node0: 0.0,
    LRate: 35999.37244981, periodDays: 365.25, diameterKm: 12742, type: 'Terrestrial Planet',
    description: 'The baseline reference plane of the Solar System (Ecliptic Plane, Inclination = 0.0°). Home of humanity.'
  },
  'mars': {
    id: 'mars', name: 'Mars', category: 'planets',
    color: '#ef4444', glow: 'rgba(239, 68, 68, 0.5)', radius: 3.8,
    a0: 1.52371034, e0: 0.09339410, I0: 1.84969142, L0: -4.55343205, longPeri0: -23.94362959, node0: 49.55953891,
    LRate: 19140.30268499, periodDays: 686.98, diameterKm: 6779, type: 'Terrestrial Planet',
    description: 'The Red Planet, home to Olympus Mons and Valles Marineris. Features seasonal dust storms.'
  },
  'jupiter': {
    id: 'jupiter', name: 'Jupiter', category: 'planets',
    color: '#f59e0b', glow: 'rgba(245, 158, 11, 0.45)', radius: 11.5,
    a0: 5.20288700, e0: 0.04838624, I0: 1.30439695, L0: 34.39644051, longPeri0: 14.72847983, node0: 100.47390909,
    LRate: 3034.74612775, periodDays: 4332.59, diameterKm: 139820, type: 'Gas Giant',
    description: 'The most massive planet in the Solar System, containing more than twice the mass of all other planets combined.'
  },
  'saturn': {
    id: 'saturn', name: 'Saturn', category: 'planets',
    color: '#eab308', glow: 'rgba(234, 179, 8, 0.4)', radius: 9.8, hasRings: true,
    a0: 9.53667594, e0: 0.05386179, I0: 2.48599187, L0: 49.95424423, longPeri0: 92.59887831, node0: 113.66242448,
    LRate: 1222.49362201, periodDays: 10759.22, diameterKm: 116460, type: 'Gas Giant',
    description: 'Famous for its extensive and dazzling ring system composed mostly of water-ice particles.'
  },
  'uranus': {
    id: 'uranus', name: 'Uranus', category: 'planets',
    color: '#38bdf8', glow: 'rgba(56, 189, 248, 0.45)', radius: 7.2,
    a0: 19.18916464, e0: 0.04725744, I0: 0.77263783, L0: 313.23810451, longPeri0: 170.95427630, node0: 74.01692503,
    LRate: 428.48202785, periodDays: 30685.4, diameterKm: 50724, type: 'Ice Giant',
    description: 'An ice giant with a dramatic axial tilt of 97.8°, essentially rotating on its side.'
  },
  'neptune': {
    id: 'neptune', name: 'Neptune', category: 'planets',
    color: '#6366f1', glow: 'rgba(99, 102, 241, 0.45)', radius: 7.0,
    a0: 30.06992276, e0: 0.00860610, I0: 1.77004347, L0: -55.12002969, longPeri0: 44.96476224, node0: 131.78422574,
    LRate: 218.45945325, periodDays: 60189.0, diameterKm: 49244, type: 'Ice Giant',
    description: 'The outermost major planet in the Solar System, possessing supersonic winds exceeding 2,100 km/h.'
  },

  // ===== 10 DWARF PLANETS =====
  'pluto': {
    id: 'pluto', name: 'Pluto', category: 'dwarfs', color: '#c29979', glow: 'rgba(194, 153, 121, 0.45)', radius: 3.4,
    a0: 39.48, e0: 0.2488, I0: 17.16, L0: 238.929, longPeri0: 224.067, node0: 110.303, LRate: 145.2, periodDays: 90560.0, diameterKm: 2377, type: 'Dwarf Planet (Kuiper Belt)', description: 'The largest dwarf planet in the Kuiper Belt.'
  },
  'haumea': {
    id: 'haumea', name: 'Haumea', category: 'dwarfs', color: '#a5f3fc', glow: 'rgba(165, 243, 252, 0.4)', radius: 3.1, isOval: true,
    a0: 43.218, e0: 0.1913, I0: 28.19, L0: 446.1, longPeri0: 240.2, node0: 122.1, LRate: 126.8, periodDays: 103774.0, diameterKm: 1595, type: 'Dwarf Planet (Kuiper Belt)', description: 'An elongated, rapidly rotating dwarf planet with its own ring system.'
  },
  'makemake': {
    id: 'makemake', name: 'Makemake', category: 'dwarfs', color: '#f97316', glow: 'rgba(249, 115, 22, 0.4)', radius: 3.0,
    a0: 45.79, e0: 0.159, I0: 28.96, L0: 462.3, longPeri0: 296.8, node0: 79.4, LRate: 116.5, periodDays: 112897.0, diameterKm: 1430, type: 'Dwarf Planet (Kuiper Belt)', description: 'A bright, frozen world covered in frozen methane and ethane.'
  },
  'eris': {
    id: 'eris', name: 'Eris', category: 'dwarfs', color: '#e2e8f0', glow: 'rgba(226, 232, 240, 0.45)', radius: 3.3,
    a0: 67.664, e0: 0.4407, I0: 44.19, L0: 349.0, longPeri0: 151.43, node0: 35.87, LRate: 64.5, periodDays: 203600.0, diameterKm: 2326, type: 'Dwarf Planet (Scattered Disc)', description: 'Massive dwarf planet with a steep 44.19° tilt relative to Earth\'s orbital plane.'
  },
  'gonggong': {
    id: 'gonggong', name: 'Gonggong', category: 'dwarfs', color: '#f87171', glow: 'rgba(248, 113, 113, 0.4)', radius: 2.8,
    a0: 67.38, e0: 0.500, I0: 30.7, L0: 553.7, longPeri0: 207.2, node0: 336.8, LRate: 65.0, periodDays: 202300.0, diameterKm: 1230, type: 'Dwarf Planet Candidate', description: 'Large resonant trans-Neptunian object with a reddish surface.'
  },
  'quaoar': {
    id: 'quaoar', name: 'Quaoar', category: 'dwarfs', color: '#d97706', glow: 'rgba(217, 119, 6, 0.4)', radius: 2.7,
    a0: 43.69, e0: 0.038, I0: 7.99, L0: 447.3, longPeri0: 150.3, node0: 189.1, LRate: 124.6, periodDays: 105500.0, diameterKm: 1110, type: 'Dwarf Planet (Kuiper Belt)', description: 'Classical Kuiper Belt object discovered in 2002.'
  },
  'sedna': {
    id: 'sedna', name: 'Sedna', category: 'dwarfs', color: '#dc2626', glow: 'rgba(220, 38, 38, 0.5)', radius: 2.6,
    a0: 506.0, e0: 0.849, I0: 11.93, L0: 669.4, longPeri0: 311.3, node0: 144.5, LRate: 3.15, periodDays: 4160000.0, diameterKm: 995, type: 'Detached Sednoid Object', description: 'One of the most distant known objects in the inner Oort cloud.'
  },
  'orcus': {
    id: 'orcus', name: 'Orcus', category: 'dwarfs', color: '#9ca3af', glow: 'rgba(156, 163, 175, 0.5)', radius: 2.6,
    a0: 39.17, e0: 0.227, I0: 20.59, L0: 165.2, longPeri0: 278.4, node0: 268.7, LRate: 146.0, periodDays: 89500.0, diameterKm: 910.0, type: 'Plutino (2:3 Resonance)', description: 'Known as the "anti-Pluto"; it shares a similar orbit but is always on the opposite side of the Sun.'
  },
  'ms4': {
    id: 'ms4', name: '2002 MS4', category: 'dwarfs', color: '#a1a1aa', glow: 'rgba(161, 161, 170, 0.35)', radius: 2.6,
    a0: 41.93, e0: 0.148, I0: 17.69, L0: 397.4, longPeri0: 286.0, node0: 216.1, LRate: 132.8, periodDays: 98900.0, diameterKm: 960, type: 'Dwarf Planet Candidate', description: 'Large trans-Neptunian object without known moons.'
  },
  'salacia': {
    id: 'salacia', name: '120347 Salacia', category: 'dwarfs', color: '#64748b', glow: 'rgba(100, 116, 139, 0.5)', radius: 2.5,
    a0: 42.24, e0: 0.103, I0: 23.9, L0: 85.5, longPeri0: 311.1, node0: 280.1, LRate: 131.0, periodDays: 100000.0, diameterKm: 846.0, type: 'Classical KBO', description: 'A large classical KBO with a known moon (Actaea), orbiting just beyond Pluto.'
  },

  // ===== 10 ASTEROIDS =====
  'ceres': {
    id: 'ceres', name: '1 Ceres', category: 'asteroids', color: '#cbd5e1', glow: 'rgba(203, 213, 225, 0.45)', radius: 2.7,
    a0: 2.767, e0: 0.0758, I0: 10.59, L0: 230.8, longPeri0: 153.4, node0: 80.3, LRate: 2141.0, periodDays: 1682.0, diameterKm: 940, type: 'Asteroid / Dwarf Planet', description: 'The largest body in the main asteroid belt, containing ~39.2% of the belt\'s total mass.'
  },
  'vesta': {
    id: 'vesta', name: '4 Vesta', category: 'asteroids', color: '#fef08a', glow: 'rgba(254, 240, 138, 0.45)', radius: 2.4,
    a0: 2.362, e0: 0.0887, I0: 7.14, L0: 275.3, longPeri0: 254.5, node0: 103.8, LRate: 2715.0, periodDays: 1325.0, diameterKm: 525, type: 'Differentiated Asteroid', description: 'Second-most massive object in the asteroid belt.'
  },
  'pallas': {
    id: 'pallas', name: '2 Pallas', category: 'asteroids', color: '#94a3b8', glow: 'rgba(148, 163, 184, 0.4)', radius: 2.3,
    a0: 2.772, e0: 0.231, I0: 34.84, L0: 182.8, longPeri0: 123.1, node0: 173.1, LRate: 2135.0, periodDays: 1686.0, diameterKm: 512, type: 'Main Belt Asteroid', description: 'Characterized by an unusually high 34.84° orbital inclination.'
  },
  'hygiea': {
    id: 'hygiea', name: '10 Hygiea', category: 'asteroids', color: '#64748b', glow: 'rgba(100, 116, 139, 0.4)', radius: 2.2,
    a0: 3.142, e0: 0.117, I0: 3.84, L0: 468.6, longPeri0: 236.6, node0: 283.4, LRate: 1769.0, periodDays: 2034.0, diameterKm: 430, type: 'Main Belt Asteroid', description: 'Fourth-largest asteroid, nearly spherical and composed of dark materials.'
  },
  'eros': {
    id: 'eros', name: '433 Eros', category: 'asteroids', color: '#d6d3d1', glow: 'rgba(214, 211, 209, 0.5)', radius: 1.8, isOval: true,
    a0: 1.458, e0: 0.223, I0: 10.83, L0: 243.1, longPeri0: 178.9, node0: 304.3, LRate: 20450.0, periodDays: 643.0, diameterKm: 16.8, type: 'Near-Earth Asteroid (Amor)', description: 'The first near-Earth asteroid discovered and the first orbited by a spacecraft (NEAR Shoemaker).'
  },
  'bennu': {
    id: 'bennu', name: '101955 Bennu', category: 'asteroids', color: '#4b5563', glow: 'rgba(75, 85, 99, 0.5)', radius: 1.5,
    a0: 1.126, e0: 0.203, I0: 6.03, L0: 105.4, longPeri0: 66.2, node0: 2.06, LRate: 30160.0, periodDays: 436.0, diameterKm: 0.49, type: 'Near-Earth Asteroid (Apollo)', description: 'A carbonaceous rubble-pile asteroid and the target of the OSIRIS-REx sample return mission.'
  },
  'ryugu': {
    id: 'ryugu', name: '162173 Ryugu', category: 'asteroids', color: '#6b7280', glow: 'rgba(107, 114, 128, 0.5)', radius: 1.5, isOval: true,
    a0: 1.189, e0: 0.190, I0: 5.88, L0: 204.1, longPeri0: 211.4, node0: 254.3, LRate: 27750.0, periodDays: 474.0, diameterKm: 0.86, type: 'Near-Earth Asteroid (Apollo)', description: 'A diamond-shaped, primitive carbonaceous asteroid sampled by Japan\'s Hayabusa2 spacecraft.'
  },
  'apophis': {
    id: 'apophis', name: '99942 Apophis', category: 'asteroids', color: '#9ca3af', glow: 'rgba(156, 163, 175, 0.5)', radius: 1.4,
    a0: 0.922, e0: 0.191, I0: 3.33, L0: 145.2, longPeri0: 126.4, node0: 204.4, LRate: 40700.0, periodDays: 323.0, diameterKm: 0.37, type: 'Near-Earth Asteroid (Aten)', description: 'A potentially hazardous asteroid that will make an exceptionally close flyby of Earth in 2029.'
  },
  'ida': {
    id: 'ida', name: '243 Ida', category: 'asteroids', color: '#a8a29e', glow: 'rgba(168, 162, 158, 0.5)', radius: 2.0, isOval: true,
    a0: 2.862, e0: 0.046, I0: 1.13, L0: 321.4, longPeri0: 316.5, node0: 324.2, LRate: 7430.0, periodDays: 1768.0, diameterKm: 31.4, type: 'Main Belt Asteroid', description: 'A heavily cratered S-type asteroid; the first asteroid found to possess its own moon (Dactyl).'
  },
  'gaspra': {
    id: 'gaspra', name: '951 Gaspra', category: 'asteroids', color: '#854d0e', glow: 'rgba(133, 77, 14, 0.5)', radius: 1.8, isOval: true,
    a0: 2.210, e0: 0.173, I0: 4.11, L0: 45.2, longPeri0: 129.5, node0: 253.2, LRate: 10960.0, periodDays: 1199.0, diameterKm: 12.2, type: 'Main Belt Asteroid', description: 'An S-type asteroid and the first ever closely approached and photographed by a spacecraft.'
  },

  // ===== 10 COMETS =====
  'halley': {
    id: 'halley', name: '1P/Halley', category: 'comets', color: '#67e8f9', glow: 'rgba(103, 232, 249, 0.55)', radius: 2.5, isComet: true,
    a0: 17.834, e0: 0.967, I0: 162.3, L0: 149.71, longPeri0: 111.33, node0: 58.42, LRate: 46.4, periodDays: 27500.0, diameterKm: 11, type: 'Periodic Comet (Retrograde)', description: 'The most famous comet in history. Orbits backward and swings out past Neptune.'
  },
  'encke': {
    id: 'encke', name: '2P/Encke', category: 'comets', color: '#a7f3d0', glow: 'rgba(167, 243, 208, 0.55)', radius: 2.3, isComet: true,
    a0: 2.214, e0: 0.848, I0: 11.78, L0: 346.5, longPeri0: 186.5, node0: 334.6, LRate: 387.0, periodDays: 1205.0, diameterKm: 4.8, type: 'Encke-type Comet', description: 'Shortest orbital period of any major comet (3.3 years).'
  },
  'churyumov': {
    id: 'churyumov', name: '67P/C-G', category: 'comets', color: '#cbd5e1', glow: 'rgba(203, 213, 225, 0.55)', radius: 2.4, isComet: true,
    a0: 3.463, e0: 0.641, I0: 7.04, L0: 22.8, longPeri0: 12.8, node0: 50.1, LRate: 196.0, periodDays: 2356.0, diameterKm: 4.1, type: 'Jupiter-Family Comet', description: 'Explored by ESA\'s Rosetta, revealing a rubber-duck shaped nucleus.'
  },
  'halebopp': {
    id: 'halebopp', name: 'Hale-Bopp', category: 'comets', color: '#f0abfc', glow: 'rgba(240, 171, 252, 0.6)', radius: 2.8, isComet: true,
    a0: 186.0, e0: 0.995, I0: 89.4, L0: 413.1, longPeri0: 130.6, node0: 282.5, LRate: 0.39, periodDays: 923500.0, diameterKm: 60, type: 'Long-Period Comet', description: 'The Great Comet of 1997 with an orbit nearly perpendicular to Earth\'s ecliptic plane.'
  },
  'swift-tuttle': {
    id: 'swift-tuttle', name: '109P/Swift-Tuttle', category: 'comets', color: '#cbd5e1', glow: 'rgba(203, 213, 225, 0.5)', radius: 1.9, isComet: true,
    a0: 26.09, e0: 0.963, I0: 113.5, L0: 180.5, longPeri0: 153.0, node0: 139.4, LRate: 270.0, periodDays: 48680.0, diameterKm: 26.0, type: 'Halley-type Comet', description: 'The massive parent body responsible for generating the annual Perseid meteor shower.'
  },
  'borrelly': {
    id: 'borrelly', name: '19P/Borrelly', category: 'comets', color: '#78716c', glow: 'rgba(120, 113, 108, 0.5)', radius: 1.7, isComet: true, isOval: true,
    a0: 3.61, e0: 0.624, I0: 30.3, L0: 20.4, longPeri0: 353.4, node0: 75.4, LRate: 5250.0, periodDays: 2502.0, diameterKm: 4.8, type: 'Jupiter-family Comet', description: 'A bowling-pin shaped comet visited by Deep Space 1, revealing a remarkably dark, dry surface.'
  },
  'wild2': {
    id: 'wild2', name: '81P/Wild', category: 'comets', color: '#d4d4d8', glow: 'rgba(212, 212, 216, 0.5)', radius: 1.6, isComet: true,
    a0: 3.45, e0: 0.537, I0: 3.24, L0: 110.2, longPeri0: 41.5, node0: 136.1, LRate: 5615.0, periodDays: 2341.0, diameterKm: 4.0, type: 'Jupiter-family Comet', description: 'Its coma dust was successfully captured and returned to Earth by the Stardust mission in 2006.'
  },
  'tempel1': {
    id: 'tempel1', name: '9P/Tempel', category: 'comets', color: '#a1a1aa', glow: 'rgba(161, 161, 170, 0.5)', radius: 1.7, isComet: true,
    a0: 3.14, e0: 0.510, I0: 10.5, L0: 310.8, longPeri0: 178.8, node0: 68.9, LRate: 6470.0, periodDays: 2030.0, diameterKm: 6.0, type: 'Jupiter-family Comet', description: 'The target of the Deep Impact mission, which fired an impactor into it to study its interior.'
  },
  'machholz': {
    id: 'machholz', name: '96P/Machholz', category: 'comets', color: '#94a3b8', glow: 'rgba(148, 163, 184, 0.5)', radius: 1.6, isComet: true,
    a0: 3.03, e0: 0.959, I0: 58.3, L0: 85.3, longPeri0: 14.8, node0: 94.3, LRate: 6815.0, periodDays: 1928.0, diameterKm: 3.0, type: 'Short-period Comet', description: 'A highly eccentric comet with an extremely close perihelion approach to the Sun.'
  },
  'neowise': {
    id: 'neowise', name: 'C/2020 F3 (NEOWISE)', category: 'comets', color: '#e2e8f0', glow: 'rgba(226, 232, 240, 0.5)', radius: 2.2, isComet: true,
    a0: 250.0, e0: 0.999, I0: 128.9, L0: 359.1, longPeri0: 37.2, node0: 61.0, LRate: 5.3, periodDays: 2471000.0, diameterKm: 5.0, type: 'Long-period Comet', description: 'A spectacular naked-eye comet that graced Earth\'s skies during the summer of 2020.'
  },

  // ===== 6 NEW KUIPER BELT OBJECTS (KBOs) =====
  'arrokoth': {
    id: 'arrokoth', name: '486958 Arrokoth', category: 'kbos', color: '#fb7185', glow: 'rgba(251, 113, 133, 0.5)', radius: 2.7, isContactBinary: true,
    a0: 44.58, e0: 0.042, I0: 2.45, L0: 484.6, longPeri0: 177.3, node0: 307.3, LRate: 121.2, periodDays: 108740.0, diameterKm: 36, type: 'Cold Classical KBO', description: 'Most distant world visited by spacecraft. A red contact binary.'
  },
  'varuna': {
    id: 'varuna', name: '20000 Varuna', category: 'kbos', color: '#fcd34d', glow: 'rgba(252, 211, 77, 0.4)', radius: 2.6, isOval: true,
    a0: 42.91, e0: 0.052, I0: 17.2, L0: 367.2, longPeri0: 269.8, node0: 97.4, LRate: 128.1, periodDays: 102640.0, diameterKm: 668, type: 'Classical KBO (Rapid Rotator)', description: 'Rapid rotation deformed it into an elongated, cigar-like shape.'
  },
  'ixion': {
    id: 'ixion', name: '28978 Ixion', category: 'kbos', color: '#fdba74', glow: 'rgba(253, 186, 116, 0.4)', radius: 2.5,
    a0: 39.68, e0: 0.242, I0: 19.6, L0: 370.8, longPeri0: 299.7, node0: 71.1, LRate: 144.1, periodDays: 91280.0, diameterKm: 650, type: 'Resonant Plutino (2:3 Neptune)', description: 'Locked in a 2:3 resonance with Neptune.'
  },
  'ux25': {
    id: 'ux25', name: '2002 UX25', category: 'kbos', color: '#cbd5e1', glow: 'rgba(203, 213, 225, 0.4)', radius: 2.5,
    a0: 42.71, e0: 0.142, I0: 19.5, L0: 492.1, longPeri0: 287.5, node0: 204.6, LRate: 129.0, periodDays: 101950.0, diameterKm: 665, type: 'Classical Kuiper Belt Object', description: 'Famous for having an extraordinarily low density, lower than water ice.'
  },
  'chaos': {
    id: 'chaos', name: '19521 Chaos', category: 'kbos', color: '#a8a29e', glow: 'rgba(168, 162, 158, 0.5)', radius: 2.4,
    a0: 45.22, e0: 0.105, I0: 12.0, L0: 110.3, longPeri0: 60.8, node0: 112.9, LRate: 118.0, periodDays: 111000.0, diameterKm: 600.0, type: 'Classical KBO (Cubewano)', description: 'A classical Kuiper Belt object that is not locked into any orbital resonance with Neptune.'
  },
  'varda': {
    id: 'varda', name: '174567 Varda', category: 'kbos', color: '#b91c1c', glow: 'rgba(185, 28, 28, 0.5)', radius: 2.5,
    a0: 46.33, e0: 0.146, I0: 21.5, L0: 275.4, longPeri0: 258.9, node0: 172.9, LRate: 114.0, periodDays: 115000.0, diameterKm: 740.0, type: 'Classical KBO', description: 'A sizable KBO with a moon (Ilmare), named after the queen of the Valar in Tolkien\'s mythos.'
  }
};

const CATEGORIES = {
  planets: ['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune'],
  dwarfs: ['pluto', 'haumea', 'makemake', 'eris', 'gonggong', 'quaoar', 'sedna', 'orcus', 'ms4', 'salacia'],
  asteroids: ['ceres', 'vesta', 'pallas', 'hygiea', 'eros', 'bennu', 'ryugu', 'apophis', 'ida', 'gaspra'],
  comets: ['halley', 'encke', 'halebopp', 'churyumov', 'swift-tuttle', 'borrelly', 'wild2', 'tempel1', 'machholz', 'neowise'],
  kbos: ['arrokoth', 'varuna', 'ixion', 'ux25', 'chaos', 'varda']
};
