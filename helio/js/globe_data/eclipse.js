
function latLonToVector3(lat, lon, radius = 1.0) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

function getEquinox(fromDate, forward = true) {
  const year = fromDate.getUTCFullYear();
  const candidates = [
    new Date(Date.UTC(year - 1, 2, 20, 14, 46, 0)),
    new Date(Date.UTC(year - 1, 8, 22, 20, 5, 0)),
    new Date(Date.UTC(year, 2, 20, 14, 46, 0)),
    new Date(Date.UTC(year, 8, 22, 20, 5, 0)),
    new Date(Date.UTC(year + 1, 2, 20, 14, 46, 0)),
    new Date(Date.UTC(year + 1, 8, 22, 20, 5, 0))
  ];
  if (forward) {
    for (let d of candidates) {
      if (d > fromDate) return d;
    }
    return candidates[candidates.length - 1];
  } else {
    for (let i = candidates.length - 1; i >= 0; i--) {
      if (candidates[i] < fromDate) return candidates[i];
    }
    return candidates[0];
  }
}

function getSummerSolstice(fromDate, forward = true) {
  const year = fromDate.getUTCFullYear();
  if (forward) {
    let solstice = new Date(Date.UTC(year, 5, 21, 12, 0, 0));
    if (solstice <= fromDate) {
      solstice = new Date(Date.UTC(year + 1, 5, 21, 12, 0, 0));
    }
    return solstice;
  } else {
    let solstice = new Date(Date.UTC(year, 5, 21, 12, 0, 0));
    if (solstice >= fromDate) {
      solstice = new Date(Date.UTC(year - 1, 5, 21, 12, 0, 0));
    }
    return solstice;
  }
}

function getWinterSolstice(fromDate, forward = true) {
  const year = fromDate.getUTCFullYear();
  if (forward) {
    let solstice = new Date(Date.UTC(year, 11, 21, 12, 0, 0));
    if (solstice <= fromDate) {
      solstice = new Date(Date.UTC(year + 1, 11, 21, 12, 0, 0));
    }
    return solstice;
  } else {
    let solstice = new Date(Date.UTC(year, 11, 21, 12, 0, 0));
    if (solstice >= fromDate) {
      solstice = new Date(Date.UTC(year - 1, 11, 21, 12, 0, 0));
    }
    return solstice;
  }
}

function getSolarEclipse(fromDate, forward = true) {
  if (forward) {
    for (let item of SOLAR_ECLIPSE_DATE) {
      if (item.date > fromDate) return item.date;
    }
    const last = new Date(SOLAR_ECLIPSE_DATE[SOLAR_ECLIPSE_DATE.length - 1].date);
    while (last <= fromDate) {
      last.setMonth(last.getMonth() + 6);
    }
    return last;
  } else {
    for (let i = SOLAR_ECLIPSE_DATE.length - 1; i >= 0; i--) {
      if (SOLAR_ECLIPSE_DATE[i].date < fromDate) return SOLAR_ECLIPSE_DATE[i].date;
    }
    const first = new Date(SOLAR_ECLIPSE_DATE[0].date);
    while (first >= fromDate) {
      first.setMonth(first.getMonth() - 6);
    }
    return first;
  }
}

function getEclipseInfo(simTime) {
  const nowMs = simTime.getTime();
  const eclipseWindowMs = 3 * 3600 * 1000;

  for (let item of SOLAR_ECLIPSE_DATE) {
    const ediff = Math.abs(nowMs - item.date.getTime());
    if (ediff < eclipseWindowMs) {
      const intensity = 1.0 - (ediff / eclipseWindowMs);
      return {
        active: true,
        intensity: intensity,
        lat: item.lat,
        lon: item.lon,
        date: item.date
      };
    }
  }
  return { active: false, intensity: 0.0, lat: 0, lon: 0 };
}

function getLunarEclipse(fromDate, forward = true) {
  if (forward) {
    for (let d of LUNAR_ECLIPSE_DATE) {
      if (d.date > fromDate) return d.date;
    }
    const last = new Date(LUNAR_ECLIPSE_DATE[LUNAR_ECLIPSE_DATE.length - 1].date);
    while (last <= fromDate) {
      last.setMonth(last.getMonth() + 6);
    }
    return last;
  } else {
    for (let i = LUNAR_ECLIPSE_DATE.length - 1; i >= 0; i--) {
      if (LUNAR_ECLIPSE_DATE[i].date < fromDate) return LUNAR_ECLIPSE_DATE[i].date;
    }
    const first = new Date(LUNAR_ECLIPSE_DATE[0].date);
    while (first >= fromDate) {
      first.setMonth(first.getMonth() - 6);
    }
    return first;
  }
}



function createSunHaloTexture22() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  const cx = 256;
  const cy = 256;
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 256);

  // 1. Intense solar core
  grad.addColorStop(0.00, 'rgba(255, 255, 255, 1.0)');
  grad.addColorStop(0.12, 'rgba(254, 240, 138, 0.95)');

  // 2. Inner corona glow
  grad.addColorStop(0.25, 'rgba(245, 158, 11, 0.60)');
  grad.addColorStop(0.40, 'rgba(245, 158, 11, 0.15)');

  // 3. Solar Halo Ring (Optical halo / 22° halo effect)
  grad.addColorStop(0.55, 'rgba(252, 211, 77, 0.45)');
  grad.addColorStop(0.62, 'rgba(248, 113, 113, 0.25)');
  grad.addColorStop(0.68, 'rgba(96, 165, 250, 0.15)');

  // 4. Soft outer atmospheric fade
  grad.addColorStop(0.85, 'rgba(245, 158, 11, 0.05)');
  grad.addColorStop(1.00, 'rgba(0, 0, 0, 0.0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  return new THREE.CanvasTexture(canvas);
}


// eclipse.js
// Catalog of Solar and Lunar Eclipses (2010 - 2060)
// Includes astronomical helper functions for equinoxes, solstices, and eclipse calculations.

const SOLAR_ECLIPSE_DATE = [
  // 2010 - 2019
  { date: new Date(Date.UTC(2010, 0, 15, 7, 7, 0)), lat: 1.6, lon: 69.3, type: 'Annular', location: 'India, Sri Lanka, Maldives, Myanmar' },
  { date: new Date(Date.UTC(2010, 6, 11, 19, 34, 0)), lat: -19.7, lon: -121.9, type: 'Total', location: 'Easter Island (Chile), Patagonia (Argentina)' },
  { date: new Date(Date.UTC(2011, 0, 4, 8, 51, 0)), lat: 64.7, lon: 20.8, type: 'Partial', location: 'Europe (London, Stockholm), North Africa' },
  { date: new Date(Date.UTC(2011, 5, 1, 21, 17, 0)), lat: 67.8, lon: 46.8, type: 'Partial', location: 'Arctic, Northern Canada, Siberia (Russia)' },
  { date: new Date(Date.UTC(2011, 6, 1, 8, 39, 0)), lat: -65.2, lon: 28.6, type: 'Partial', location: 'Southern Ocean (Antarctica)' },
  { date: new Date(Date.UTC(2011, 10, 25, 6, 21, 0)), lat: -68.6, lon: 82.4, type: 'Partial', location: 'Antarctica, South Africa, New Zealand' },
  { date: new Date(Date.UTC(2012, 4, 20, 23, 53, 0)), lat: 35.4, lon: 176.9, type: 'Annular', location: 'Tokyo (Japan), California / Nevada (US)' },
  { date: new Date(Date.UTC(2012, 10, 13, 22, 12, 0)), lat: -40.0, lon: -161.3, type: 'Total', location: 'Cairns (Australia), South Pacific' },
  { date: new Date(Date.UTC(2013, 4, 10, 0, 26, 0)), lat: 2.2, lon: 175.5, type: 'Annular', location: 'Northern Australia, Solomon Islands, Kiribati' },
  { date: new Date(Date.UTC(2013, 10, 3, 12, 47, 0)), lat: 3.5, lon: -11.7, type: 'Hybrid', location: 'Gabon, Congo, Uganda, Kenya' },
  { date: new Date(Date.UTC(2014, 3, 29, 6, 4, 0)), lat: -70.6, lon: 131.3, type: 'Annular', location: 'Wilkes Land (Antarctica), Southern Australia' },
  { date: new Date(Date.UTC(2014, 9, 23, 21, 45, 0)), lat: 71.2, lon: -97.2, type: 'Partial', location: 'North America (US, Canada, Mexico)' },
  { date: new Date(Date.UTC(2015, 2, 20, 9, 46, 0)), lat: 64.4, lon: -6.6, type: 'Total', location: 'Svalbard (Norway), Faroe Islands' },
  { date: new Date(Date.UTC(2015, 8, 13, 6, 55, 0)), lat: -72.1, lon: 2.3, type: 'Partial', location: 'South Africa, Madagascar, Antarctica' },
  { date: new Date(Date.UTC(2016, 2, 9, 1, 58, 0)), lat: 10.1, lon: 148.8, type: 'Total', location: 'Sumatra / Borneo (Indonesia), Pacific Ocean' },
  { date: new Date(Date.UTC(2016, 8, 1, 9, 8, 0)), lat: -10.7, lon: 37.8, type: 'Annular', location: 'Tanzania, Madagascar, Réunion Island' },
  { date: new Date(Date.UTC(2017, 1, 26, 14, 54, 0)), lat: -34.7, lon: -31.2, type: 'Annular', location: 'Chile, Patagonia (Argentina), Angola' },
  { date: new Date(Date.UTC(2017, 7, 21, 18, 26, 0)), lat: 37.0, lon: -87.7, type: 'Total', location: 'US (Oregon, Nashville TN, Charleston SC)' },
  { date: new Date(Date.UTC(2018, 1, 15, 20, 52, 0)), lat: -71.0, lon: -0.6, type: 'Partial', location: 'Chile, Argentina, Antarctica' },
  { date: new Date(Date.UTC(2018, 6, 13, 3, 1, 0)), lat: -67.9, lon: 125.1, type: 'Partial', location: 'Southern Australia, Tasmania' },
  { date: new Date(Date.UTC(2018, 7, 11, 9, 47, 0)), lat: 70.4, lon: 174.5, type: 'Partial', location: 'Scandinavia, Russia, Northern China' },
  { date: new Date(Date.UTC(2019, 0, 6, 1, 42, 0)), lat: 67.4, lon: 153.6, type: 'Partial', location: 'Tokyo (Japan), Seoul (South Korea), Russia' },
  { date: new Date(Date.UTC(2019, 6, 2, 19, 24, 0)), lat: -17.4, lon: -109.0, type: 'Total', location: 'La Serena (Chile), San Juan (Argentina)' },
  { date: new Date(Date.UTC(2019, 11, 26, 5, 18, 0)), lat: 1.0, lon: 102.3, type: 'Annular', location: 'Saudi Arabia, Southern India, Singapore' },

  // 2020 - 2029
  { date: new Date(Date.UTC(2020, 5, 21, 6, 40, 0)), lat: 30.5, lon: 79.7, type: 'Annular', location: 'Congo, Ethiopia, Oman, India, Taiwan' },
  { date: new Date(Date.UTC(2020, 11, 14, 16, 14, 0)), lat: -40.3, lon: -67.9, type: 'Total', location: 'Temuco (Chile), Rio Negro (Argentina)' },
  { date: new Date(Date.UTC(2021, 5, 10, 10, 43, 0)), lat: 80.8, lon: -66.8, type: 'Annular', location: 'Northern Canada, Greenland, Russia' },
  { date: new Date(Date.UTC(2021, 11, 4, 7, 34, 0)), lat: -76.8, lon: -46.2, type: 'Total', location: 'Union Glacier (Antarctica)' },
  { date: new Date(Date.UTC(2022, 3, 30, 20, 42, 0)), lat: -62.1, lon: -71.3, type: 'Partial', location: 'Chile, Argentina, Southeastern Pacific' },
  { date: new Date(Date.UTC(2022, 9, 25, 11, 0, 0)), lat: 61.6, lon: 77.4, type: 'Partial', location: 'Europe (Berlin, Rome), Middle East, Western Asia' },
  { date: new Date(Date.UTC(2023, 3, 20, 4, 17, 0)), lat: -9.6, lon: 125.8, type: 'Hybrid', location: 'Exmouth (Australia), Timor-Leste, West Papua' },
  { date: new Date(Date.UTC(2023, 9, 14, 18, 0, 0)), lat: 11.4, lon: -83.1, type: 'Annular', location: 'US (Oregon, Texas), Mexico, Panama, Brazil' },
  { date: new Date(Date.UTC(2024, 3, 8, 18, 17, 0)), lat: 25.3, lon: -104.1, type: 'Total', location: 'Mazatlán (Mexico), Texas / NY (US), Canada' },
  { date: new Date(Date.UTC(2024, 9, 2, 18, 45, 0)), lat: -22.0, lon: -114.5, type: 'Annular', location: 'Easter Island (Chile), Patagonia (Chile/Argentina)' },
  { date: new Date(Date.UTC(2025, 2, 29, 10, 48, 0)), lat: 61.1, lon: -37.1, type: 'Partial', location: 'Eastern Canada, Greenland, Northwest Europe' },
  { date: new Date(Date.UTC(2025, 8, 21, 19, 43, 0)), lat: -60.9, lon: 153.5, type: 'Partial', location: 'Auckland (New Zealand), Antarctica' },
  { date: new Date(Date.UTC(2026, 1, 17, 12, 1, 0)), lat: -64.7, lon: 86.8, type: 'Annular', location: 'Antarctica' },
  { date: new Date(Date.UTC(2026, 7, 12, 17, 47, 0)), lat: 65.2, lon: -25.2, type: 'Total', location: 'Reykjavik (Iceland), Madrid / Mallorca (Spain)' },
  { date: new Date(Date.UTC(2027, 1, 6, 16, 0, 0)), lat: -31.3, lon: -17.2, type: 'Annular', location: 'Chile, Argentina, South Atlantic Ocean, West Africa' },
  { date: new Date(Date.UTC(2027, 7, 2, 10, 7, 0)), lat: 25.5, lon: 33.2, type: 'Total', location: 'Luxor (Egypt), Gibraltar, Saudi Arabia' },
  { date: new Date(Date.UTC(2028, 0, 26, 15, 8, 0)), lat: 3.0, lon: -51.5, type: 'Annular', location: 'Galapagos Islands, Ecuador, Colombia, Brazil' },
  { date: new Date(Date.UTC(2028, 6, 22, 2, 56, 0)), lat: -15.6, lon: 126.6, type: 'Total', location: 'Sydney (Australia), Dunedin (New Zealand)' },
  { date: new Date(Date.UTC(2029, 0, 14, 17, 13, 0)), lat: 63.7, lon: -11.4, type: 'Partial', location: 'North America (US, Canada), Central America' },
  { date: new Date(Date.UTC(2029, 5, 12, 15, 45, 0)), lat: 65.6, lon: -27.7, type: 'Partial', location: 'Arctic, Scandinavia, Northern Russia, Greenland' },
  { date: new Date(Date.UTC(2029, 6, 11, 15, 37, 0)), lat: -64.3, lon: -85.6, type: 'Partial', location: 'South Pacific Ocean, Southern Chile, Antarctica' },
  { date: new Date(Date.UTC(2029, 11, 5, 15, 3, 0)), lat: -67.5, lon: -135.7, type: 'Partial', location: 'Southern Chile, Argentina, Antarctica' },

  // 2030 - 2039
  { date: new Date(Date.UTC(2030, 5, 1, 6, 29, 0)), lat: 56.5, lon: 80.1, type: 'Annular', location: 'Algeria, Greece, Turkey, Russia, China' },
  { date: new Date(Date.UTC(2030, 10, 25, 6, 51, 0)), lat: -43.6, lon: 71.2, type: 'Total', location: 'Namibia, Botswana, South Africa, Australia' },
  { date: new Date(Date.UTC(2031, 4, 21, 7, 16, 0)), lat: 8.9, lon: 71.7, type: 'Annular', location: 'Angola, Zambia, India, Malaysia, Indonesia' },
  { date: new Date(Date.UTC(2031, 10, 14, 21, 7, 0)), lat: -0.6, lon: -137.6, type: 'Hybrid', location: 'Central Pacific Ocean, Panama' },
  { date: new Date(Date.UTC(2032, 4, 9, 13, 26, 0)), lat: -51.3, lon: -7.1, type: 'Annular', location: 'South Atlantic Ocean, Southern Ocean' },
  { date: new Date(Date.UTC(2032, 10, 3, 5, 34, 0)), lat: 70.4, lon: 97.0, type: 'Partial', location: 'Asia (China, Korea), Russia, Eastern Europe' },
  { date: new Date(Date.UTC(2033, 2, 30, 18, 2, 0)), lat: 61.3, lon: -155.8, type: 'Total', location: 'Kotzebue / Utqiagvik (Alaska, US), Russia' },
  { date: new Date(Date.UTC(2033, 8, 23, 13, 54, 0)), lat: -62.2, lon: 26.6, type: 'Partial', location: 'Eastern South America, Antarctica' },
  { date: new Date(Date.UTC(2034, 2, 20, 10, 18, 0)), lat: 16.1, lon: 36.6, type: 'Total', location: 'Nigeria, Chad, Sudan, Egypt, Saudi Arabia' },
  { date: new Date(Date.UTC(2034, 8, 12, 8, 21, 0)), lat: -18.2, lon: 52.6, type: 'Annular', location: 'Chile, Argentina, South Atlantic, Indian Ocean' },
  { date: new Date(Date.UTC(2035, 2, 9, 23, 5, 0)), lat: -64.7, lon: -92.1, type: 'Partial', location: 'Southern Ocean, Antarctica' },
  { date: new Date(Date.UTC(2035, 8, 2, 1, 56, 0)), lat: 35.4, lon: 141.0, type: 'Total', location: 'Beijing (China), Pyongyang (N. Korea), Tokyo (Japan)' },
  { date: new Date(Date.UTC(2036, 1, 27, 4, 46, 0)), lat: -68.8, lon: 12.6, type: 'Partial', location: 'South America, Antarctica' },
  { date: new Date(Date.UTC(2036, 6, 23, 10, 32, 0)), lat: 64.2, lon: -28.9, type: 'Partial', location: 'Atlantic Ocean, Western Europe' },
  { date: new Date(Date.UTC(2036, 7, 21, 17, 25, 0)), lat: -67.0, lon: -153.0, type: 'Partial', location: 'Southern Ocean, Antarctica' },
  { date: new Date(Date.UTC(2037, 0, 16, 9, 48, 0)), lat: 66.4, lon: 148.2, type: 'Partial', location: 'North America, Arctic' },
  { date: new Date(Date.UTC(2037, 6, 13, 2, 40, 0)), lat: -24.8, lon: 139.1, type: 'Total', location: 'Western Australia, Alice Springs, Brisbane (Australia)' },
  { date: new Date(Date.UTC(2037, 11, 26, 1, 0, 0)), lat: -66.1, lon: 114.0, type: 'Partial', location: 'Southern South America, Antarctica' },
  { date: new Date(Date.UTC(2038, 0, 5, 13, 47, 0)), lat: 2.1, lon: -25.4, type: 'Annular', location: 'Caribbean, Atlantic Ocean, West Africa' },
  { date: new Date(Date.UTC(2038, 6, 2, 13, 32, 0)), lat: 24.1, lon: 12.4, type: 'Annular', location: 'Northern South America, Africa, Middle East' },
  { date: new Date(Date.UTC(2038, 11, 26, 1, 0, 0)), lat: -40.3, lon: 148.0, type: 'Total', location: 'Melbourne (Australia), Auckland (New Zealand)' },
  { date: new Date(Date.UTC(2039, 5, 21, 17, 12, 0)), lat: 68.9, lon: -93.3, type: 'Annular', location: 'Alaska, Northern Canada, Greenland, Scandinavia' },
  { date: new Date(Date.UTC(2039, 11, 15, 16, 23, 0)), lat: -80.9, lon: -20.9, type: 'Total', location: 'Antarctica' },

  // 2040 - 2049
  { date: new Date(Date.UTC(2040, 4, 11, 19, 10, 0)), lat: -63.0, lon: -160.0, type: 'Partial', location: 'Australia, New Zealand, Antarctica' },
  { date: new Date(Date.UTC(2040, 10, 4, 19, 9, 0)), lat: 62.2, lon: -8.8, type: 'Partial', location: 'North America, Central America' },
  { date: new Date(Date.UTC(2041, 3, 30, 11, 52, 0)), lat: -9.6, lon: 12.2, type: 'Total', location: 'Angola, Congo, Uganda, Kenya' },
  { date: new Date(Date.UTC(2041, 9, 25, 1, 36, 0)), lat: 31.6, lon: 142.9, type: 'Annular', location: 'Japan, Pacific Ocean' },
  { date: new Date(Date.UTC(2042, 3, 20, 2, 17, 0)), lat: 27.0, lon: 137.3, type: 'Total', location: 'Indonesia, Philippines, Pacific Ocean' },
  { date: new Date(Date.UTC(2042, 9, 14, 2, 0, 0)), lat: -23.7, lon: 137.8, type: 'Annular', location: 'Indian Ocean, Australia, Pacific Ocean' },
  { date: new Date(Date.UTC(2043, 3, 9, 18, 57, 0)), lat: 61.3, lon: 152.0, type: 'Total', location: 'Kamchatka (Russia), Northeast Asia' },
  { date: new Date(Date.UTC(2043, 9, 3, 3, 1, 0)), lat: -61.0, lon: 102.0, type: 'Annular', location: 'Antarctica' },
  { date: new Date(Date.UTC(2044, 1, 28, 20, 24, 0)), lat: -62.2, lon: -25.6, type: 'Annular', location: 'South Atlantic Ocean' },
  { date: new Date(Date.UTC(2044, 7, 23, 1, 17, 0)), lat: 64.3, lon: -120.4, type: 'Total', location: 'Greenland, Northern Canada, Montana / ND (US)' },
  { date: new Date(Date.UTC(2045, 1, 16, 23, 56, 0)), lat: -62.0, lon: -170.0, type: 'Annular', location: 'New Zealand, Pacific Ocean' },
  { date: new Date(Date.UTC(2045, 7, 12, 17, 42, 0)), lat: 25.9, lon: -78.5, type: 'Total', location: 'US (California to Miami FL), Caribbean, Brazil' },
  { date: new Date(Date.UTC(2046, 1, 5, 23, 6, 0)), lat: 36.4, lon: -150.0, type: 'Annular', location: 'Idaho / Oregon (US), Pacific Ocean' },
  { date: new Date(Date.UTC(2046, 7, 2, 10, 21, 0)), lat: -25.0, lon: -29.0, type: 'Total', location: 'Eastern Brazil, South Atlantic, South Africa' },
  { date: new Date(Date.UTC(2047, 0, 26, 1, 33, 0)), lat: 62.0, lon: 95.0, type: 'Partial', location: 'Asia, Russia' },
  { date: new Date(Date.UTC(2047, 5, 23, 10, 23, 0)), lat: 66.0, lon: -50.0, type: 'Partial', location: 'Northern Canada, Greenland' },
  { date: new Date(Date.UTC(2047, 6, 22, 22, 36, 0)), lat: -63.0, lon: 160.0, type: 'Partial', location: 'Southern Ocean' },
  { date: new Date(Date.UTC(2047, 11, 16, 23, 50, 0)), lat: -66.0, lon: -10.0, type: 'Partial', location: 'Antarctica' },
  { date: new Date(Date.UTC(2048, 5, 11, 12, 58, 0)), lat: 43.7, lon: -41.7, type: 'Annular', location: 'US (Midwest to Northeast), Quebec (Canada), UK' },
  { date: new Date(Date.UTC(2048, 11, 5, 15, 35, 0)), lat: -46.1, lon: -70.0, type: 'Total', location: 'Chile, Argentina, South Atlantic' },
  { date: new Date(Date.UTC(2049, 4, 31, 13, 59, 0)), lat: -15.3, lon: -29.9, type: 'Hybrid', location: 'Pacific Ocean, Ecuador, Peru' },
  { date: new Date(Date.UTC(2049, 10, 25, 5, 33, 0)), lat: 3.8, lon: 95.2, type: 'Hybrid', location: 'Red Sea, Saudi Arabia, India, Indonesia' },

  // 2050 - 2060
  { date: new Date(Date.UTC(2050, 4, 20, 20, 42, 0)), lat: -40.0, lon: -123.0, type: 'Hybrid', location: 'South Pacific Ocean' },
  { date: new Date(Date.UTC(2050, 10, 14, 13, 30, 0)), lat: 62.0, lon: -34.0, type: 'Partial', location: 'North America, Central America' },
  { date: new Date(Date.UTC(2051, 3, 11, 2, 10, 0)), lat: 66.0, lon: 160.0, type: 'Partial', location: 'North America, Arctic' },
  { date: new Date(Date.UTC(2051, 9, 4, 13, 0, 0)), lat: -65.0, lon: -30.0, type: 'Partial', location: 'Antarctica, Australia' },
  { date: new Date(Date.UTC(2052, 2, 30, 18, 31, 0)), lat: 22.4, lon: -100.0, type: 'Total', location: 'Central America, Florida (US), Atlantic Ocean' },
  { date: new Date(Date.UTC(2052, 8, 22, 23, 39, 0)), lat: -25.7, lon: 175.0, type: 'Annular', location: 'Indian Ocean, Australia' },
  { date: new Date(Date.UTC(2053, 2, 20, 7, 8, 0)), lat: -23.0, lon: 23.0, type: 'Annular', location: 'South America, Atlantic Ocean, Africa' },
  { date: new Date(Date.UTC(2053, 8, 12, 9, 34, 0)), lat: 21.5, lon: 14.8, type: 'Total', location: 'Morocco, Algeria, Tunisia, Egypt, Saudi Arabia' },
  { date: new Date(Date.UTC(2054, 2, 9, 13, 23, 0)), lat: -62.0, lon: -80.0, type: 'Partial', location: 'Antarctica, South America' },
  { date: new Date(Date.UTC(2054, 7, 3, 18, 4, 0)), lat: 64.0, lon: -90.0, type: 'Partial', location: 'Arctic, North America' },
  { date: new Date(Date.UTC(2054, 8, 2, 1, 0, 0)), lat: -66.0, lon: 120.0, type: 'Partial', location: 'Southern Ocean' },
  { date: new Date(Date.UTC(2055, 0, 27, 17, 54, 0)), lat: 62.0, lon: -120.0, type: 'Partial', location: 'North America, East Asia' },
  { date: new Date(Date.UTC(2055, 6, 24, 8, 57, 0)), lat: -27.2, lon: 44.6, type: 'Total', location: 'South Africa, Madagascar, Indian Ocean' },
  { date: new Date(Date.UTC(2055, 11, 19, 13, 0, 0)), lat: -66.0, lon: -20.0, type: 'Partial', location: 'South America, Antarctica' },
  { date: new Date(Date.UTC(2056, 0, 16, 11, 50, 0)), lat: 3.0, lon: -40.0, type: 'Annular', location: 'Central America, Colombia, Brazil' },
  { date: new Date(Date.UTC(2056, 6, 12, 11, 10, 0)), lat: 10.0, lon: 25.0, type: 'Annular', location: 'Central Africa, Ethiopia, Somalia' },
  { date: new Date(Date.UTC(2056, 11, 8, 1, 30, 0)), lat: -45.0, lon: 170.0, type: 'Total', location: 'New Zealand, South Pacific' },
  { date: new Date(Date.UTC(2057, 6, 1, 23, 40, 0)), lat: 70.0, lon: -100.0, type: 'Annular', location: 'North America, Canada, Greenland' },
  { date: new Date(Date.UTC(2057, 11, 26, 1, 0, 0)), lat: -82.0, lon: 100.0, type: 'Total', location: 'Antarctica' },
  { date: new Date(Date.UTC(2058, 4, 22, 10, 30, 0)), lat: -63.0, lon: 20.0, type: 'Partial', location: 'South Africa, Antarctica' },
  { date: new Date(Date.UTC(2058, 5, 21, 0, 10, 0)), lat: 65.0, lon: 100.0, type: 'Partial', location: 'Northern Europe, Russia' },
  { date: new Date(Date.UTC(2058, 10, 16, 13, 30, 0)), lat: -62.0, lon: -60.0, type: 'Partial', location: 'Central America, South America' },
  { date: new Date(Date.UTC(2059, 4, 11, 19, 18, 0)), lat: -10.7, lon: -82.0, type: 'Total', location: 'Ecuador, Peru, Brazil' },
  { date: new Date(Date.UTC(2059, 10, 5, 9, 18, 0)), lat: 19.3, lon: 17.1, type: 'Annular', location: 'France, Libya, Egypt, Sudan, Ethiopia' },
  { date: new Date(Date.UTC(2060, 3, 30, 10, 9, 0)), lat: 28.0, lon: 20.9, type: 'Total', location: 'Ivory Coast, Nigeria, Egypt, Turkey, Moscow (Russia)' },
  { date: new Date(Date.UTC(2060, 9, 24, 9, 24, 0)), lat: -32.0, lon: 35.0, type: 'Annular', location: 'South Africa, Indian Ocean' }
];

const LUNAR_ECLIPSE_DATE = [
  // 2010 - 2019
  { date: new Date(Date.UTC(2010, 5, 26, 11, 38, 0)), type: 'Partial', location: 'Asia, Australia, Pacific, Americas' },
  { date: new Date(Date.UTC(2010, 11, 21, 8, 17, 0)), type: 'Total', location: 'North America (US), South America, Europe' },
  { date: new Date(Date.UTC(2011, 5, 15, 20, 12, 0)), type: 'Total', location: 'South America, Europe, Africa, Asia, Australia' },
  { date: new Date(Date.UTC(2011, 11, 10, 14, 31, 0)), type: 'Total', location: 'Asia, Australia, Pacific, Western US / Canada' },
  { date: new Date(Date.UTC(2012, 5, 4, 11, 4, 0)), type: 'Partial', location: 'Asia, Australia, Pacific, Americas' },
  { date: new Date(Date.UTC(2012, 10, 28, 14, 34, 0)), type: 'Penumbral', location: 'Europe, East Africa, Asia, Australia, North America' },
  { date: new Date(Date.UTC(2013, 3, 25, 20, 8, 0)), type: 'Partial', location: 'Europe (London, Paris), Africa, Asia, Australia' },
  { date: new Date(Date.UTC(2013, 4, 25, 4, 11, 0)), type: 'Penumbral', location: 'Americas, Africa' },
  { date: new Date(Date.UTC(2013, 9, 18, 23, 51, 0)), type: 'Penumbral', location: 'Americas, Europe, Africa, Asia' },
  { date: new Date(Date.UTC(2014, 3, 15, 7, 46, 0)), type: 'Total', location: 'Americas (US, Brazil), Pacific Ocean, Australia' },
  { date: new Date(Date.UTC(2014, 9, 8, 10, 55, 0)), type: 'Total', location: 'Asia, Australia, Pacific, Americas' },
  { date: new Date(Date.UTC(2015, 3, 4, 12, 1, 0)), type: 'Total', location: 'Asia, Australia, Pacific, Americas' },
  { date: new Date(Date.UTC(2015, 8, 28, 2, 48, 0)), type: 'Total', location: 'Americas, Europe (London), Africa, Western Asia' },
  { date: new Date(Date.UTC(2016, 2, 23, 11, 48, 0)), type: 'Penumbral', location: 'Asia, Australia, Pacific, Western Americas' },
  { date: new Date(Date.UTC(2016, 8, 16, 18, 55, 0)), type: 'Penumbral', location: 'Europe, Africa, Asia, Australia' },
  { date: new Date(Date.UTC(2017, 1, 11, 0, 45, 0)), type: 'Penumbral', location: 'Americas, Europe, Africa, Asia' },
  { date: new Date(Date.UTC(2017, 7, 7, 18, 21, 0)), type: 'Partial', location: 'Europe, Africa, Asia, Australia' },
  { date: new Date(Date.UTC(2018, 0, 31, 13, 31, 0)), type: 'Total', location: 'Asia, Australia, Pacific, Western North America' },
  { date: new Date(Date.UTC(2018, 6, 27, 20, 22, 0)), type: 'Total', location: 'Europe, Africa, Asia, Australia, South America' },
  { date: new Date(Date.UTC(2019, 0, 21, 5, 13, 0)), type: 'Total', location: 'Americas (US, Mexico), Western Europe, Africa' },
  { date: new Date(Date.UTC(2019, 6, 16, 21, 31, 0)), type: 'Partial', location: 'South America, Europe, Africa, Asia, Australia' },

  // 2020 - 2029
  { date: new Date(Date.UTC(2020, 0, 10, 19, 11, 0)), type: 'Penumbral', location: 'Europe, Africa, Asia, Australia' },
  { date: new Date(Date.UTC(2020, 5, 5, 19, 26, 0)), type: 'Penumbral', location: 'Europe, Africa, Asia, Australia' },
  { date: new Date(Date.UTC(2020, 6, 5, 4, 31, 0)), type: 'Penumbral', location: 'Americas, Southwest Europe, Africa' },
  { date: new Date(Date.UTC(2020, 10, 30, 9, 44, 0)), type: 'Penumbral', location: 'Asia, Australia, Pacific, Americas' },
  { date: new Date(Date.UTC(2021, 4, 26, 11, 18, 0)), type: 'Total', location: 'East Asia, Australia, Pacific Ocean, Americas' },
  { date: new Date(Date.UTC(2021, 10, 19, 9, 3, 0)), type: 'Partial', location: 'Americas, Northern Europe, East Asia, Australia' },
  { date: new Date(Date.UTC(2022, 4, 16, 4, 11, 0)), type: 'Total', location: 'Americas, Europe, Africa' },
  { date: new Date(Date.UTC(2022, 10, 8, 10, 59, 0)), type: 'Total', location: 'Asia, Australia, Pacific Ocean, Americas' },
  { date: new Date(Date.UTC(2023, 4, 5, 17, 23, 0)), type: 'Penumbral', location: 'Africa, Asia, Australia' },
  { date: new Date(Date.UTC(2023, 9, 28, 20, 14, 0)), type: 'Partial', location: 'Europe, Africa, Asia, Australia' },
  { date: new Date(Date.UTC(2024, 2, 25, 7, 0, 0)), type: 'Penumbral', location: 'Americas, Western Europe, Africa' },
  { date: new Date(Date.UTC(2024, 8, 18, 2, 44, 0)), type: 'Partial', location: 'Americas, Europe, Africa' },
  { date: new Date(Date.UTC(2025, 2, 14, 6, 59, 0)), type: 'Total', location: 'Americas (US, Canada, Brazil), Pacific Ocean' },
  { date: new Date(Date.UTC(2025, 8, 7, 18, 12, 0)), type: 'Total', location: 'Europe, Africa, Asia, Australia' },
  { date: new Date(Date.UTC(2026, 2, 3, 11, 34, 0)), type: 'Total', location: 'Asia, Australia, Pacific Ocean, Americas' },
  { date: new Date(Date.UTC(2026, 7, 28, 4, 14, 0)), type: 'Partial', location: 'Americas, Europe, Africa' },
  { date: new Date(Date.UTC(2027, 1, 20, 23, 14, 0)), type: 'Penumbral', location: 'Americas, Europe, Africa, Asia' },
  { date: new Date(Date.UTC(2027, 7, 17, 7, 14, 0)), type: 'Penumbral', location: 'Americas, Europe, Africa' },
  { date: new Date(Date.UTC(2028, 0, 12, 4, 14, 0)), type: 'Partial', location: 'Americas, Europe, Africa' },
  { date: new Date(Date.UTC(2028, 6, 6, 18, 20, 0)), type: 'Partial', location: 'Europe, Africa, Asia, Australia' },
  { date: new Date(Date.UTC(2028, 11, 31, 16, 53, 0)), type: 'Total', location: 'Europe, Africa, Asia, Australia' },
  { date: new Date(Date.UTC(2029, 5, 26, 3, 22, 0)), type: 'Total', location: 'Americas, Europe, Africa' },
  { date: new Date(Date.UTC(2029, 11, 20, 22, 43, 0)), type: 'Total', location: 'Americas, Europe, Africa, Asia' },

  // 2030 - 2039
  { date: new Date(Date.UTC(2030, 5, 15, 18, 34, 0)), type: 'Partial', location: 'Europe, Africa, Asia, Australia' },
  { date: new Date(Date.UTC(2030, 11, 9, 22, 28, 0)), type: 'Penumbral', location: 'Americas, Europe, Africa, Asia' },
  { date: new Date(Date.UTC(2031, 4, 7, 3, 52, 0)), type: 'Penumbral', location: 'Americas, Europe, Africa' },
  { date: new Date(Date.UTC(2031, 9, 30, 7, 46, 0)), type: 'Penumbral', location: 'Americas, Europe, Africa' },
  { date: new Date(Date.UTC(2032, 3, 25, 15, 14, 0)), type: 'Total', location: 'Asia, Australia, Pacific Ocean, Western Americas' },
  { date: new Date(Date.UTC(2032, 9, 18, 19, 0, 0)), type: 'Total', location: 'Europe, Africa, Asia, Australia' },
  { date: new Date(Date.UTC(2033, 3, 14, 19, 13, 0)), type: 'Total', location: 'Europe, Africa, Asia, Australia' },
  { date: new Date(Date.UTC(2033, 9, 8, 10, 55, 0)), type: 'Partial', location: 'Asia, Australia, Pacific Ocean, Americas' },
  { date: new Date(Date.UTC(2034, 3, 3, 19, 6, 0)), type: 'Penumbral', location: 'Europe, Africa, Asia, Australia' },
  { date: new Date(Date.UTC(2034, 8, 28, 2, 47, 0)), type: 'Penumbral', location: 'Americas, Europe, Africa' },
  { date: new Date(Date.UTC(2035, 2, 22, 9, 11, 0)), type: 'Partial', location: 'Asia, Australia, Pacific Ocean, Americas' },
  { date: new Date(Date.UTC(2035, 8, 16, 12, 10, 0)), type: 'Penumbral', location: 'Asia, Australia, Pacific Ocean, Western Americas' },
  { date: new Date(Date.UTC(2036, 1, 11, 22, 13, 0)), type: 'Total', location: 'Americas, Europe, Africa, Asia' },
  { date: new Date(Date.UTC(2036, 7, 7, 16, 52, 0)), type: 'Total', location: 'Asia, Australia, Pacific Ocean, Americas' },
  { date: new Date(Date.UTC(2037, 0, 31, 14, 0, 0)), type: 'Total', location: 'Asia, Australia, Pacific Ocean, Western North America' },
  { date: new Date(Date.UTC(2037, 6, 27, 4, 10, 0)), type: 'Partial', location: 'Americas, Europe, Africa' },
  { date: new Date(Date.UTC(2038, 0, 21, 17, 30, 0)), type: 'Penumbral', location: 'Europe, Africa, Asia, Australia' },
  { date: new Date(Date.UTC(2038, 6, 17, 2, 20, 0)), type: 'Partial', location: 'Americas, Europe, Africa' },
  { date: new Date(Date.UTC(2038, 11, 11, 17, 45, 0)), type: 'Penumbral', location: 'Europe, Africa, Asia, Australia' },
  { date: new Date(Date.UTC(2039, 5, 6, 18, 50, 0)), type: 'Partial', location: 'Europe, Africa, Asia, Australia' },

  // 2040 - 2049
  { date: new Date(Date.UTC(2040, 4, 26, 11, 20, 0)), type: 'Total', location: 'Asia, Australia, Pacific Ocean, Americas' },
  { date: new Date(Date.UTC(2040, 10, 18, 19, 5, 0)), type: 'Total', location: 'Europe, Africa, Asia, Australia' },
  { date: new Date(Date.UTC(2041, 4, 16, 0, 40, 0)), type: 'Total', location: 'Americas, Europe, Africa' },
  { date: new Date(Date.UTC(2041, 10, 8, 4, 30, 0)), type: 'Partial', location: 'Americas, Europe, Africa' },
  { date: new Date(Date.UTC(2042, 3, 5, 14, 20, 0)), type: 'Penumbral', location: 'Asia, Australia, Pacific Ocean, Americas' },
  { date: new Date(Date.UTC(2042, 8, 29, 22, 10, 0)), type: 'Penumbral', location: 'Americas, Europe, Africa, Asia' },
  { date: new Date(Date.UTC(2042, 9, 28, 11, 15, 0)), type: 'Penumbral', location: 'Asia, Australia, Pacific Ocean' },
  { date: new Date(Date.UTC(2043, 2, 25, 14, 30, 0)), type: 'Total', location: 'Asia, Australia, Pacific Ocean, Americas' },
  { date: new Date(Date.UTC(2043, 8, 19, 1, 50, 0)), type: 'Total', location: 'Americas, Europe, Africa' },
  { date: new Date(Date.UTC(2044, 2, 13, 19, 40, 0)), type: 'Total', location: 'Europe, Africa, Asia, Australia' },
  { date: new Date(Date.UTC(2044, 8, 7, 11, 20, 0)), type: 'Partial', location: 'Asia, Australia, Pacific Ocean, Americas' },
  { date: new Date(Date.UTC(2045, 2, 3, 8, 10, 0)), type: 'Penumbral', location: 'Americas, Europe, Africa' },
  { date: new Date(Date.UTC(2045, 7, 27, 18, 30, 0)), type: 'Penumbral', location: 'Europe, Africa, Asia, Australia' },
  { date: new Date(Date.UTC(2046, 1, 22, 23, 0, 0)), type: 'Total', location: 'Americas, Europe, Africa, Asia' },
  { date: new Date(Date.UTC(2046, 7, 18, 17, 10, 0)), type: 'Total', location: 'Europe, Africa, Asia, Australia' },
  { date: new Date(Date.UTC(2047, 0, 12, 1, 20, 0)), type: 'Total', location: 'Americas, Europe, Africa' },
  { date: new Date(Date.UTC(2047, 6, 7, 18, 30, 0)), type: 'Partial', location: 'Europe, Africa, Asia, Australia' },
  { date: new Date(Date.UTC(2048, 0, 1, 6, 40, 0)), type: 'Penumbral', location: 'Americas, Europe, Africa' },
  { date: new Date(Date.UTC(2048, 5, 26, 1, 10, 0)), type: 'Partial', location: 'Americas, Europe, Africa' },
  { date: new Date(Date.UTC(2048, 11, 20, 12, 0, 0)), type: 'Penumbral', location: 'Asia, Australia, Pacific Ocean, Americas' },
  { date: new Date(Date.UTC(2049, 5, 17, 10, 30, 0)), type: 'Partial', location: 'Asia, Australia, Pacific Ocean, Americas' },
  { date: new Date(Date.UTC(2049, 11, 10, 1, 40, 0)), type: 'Partial', location: 'Americas, Europe, Africa' },

  // 2050 - 2060
  { date: new Date(Date.UTC(2050, 4, 6, 22, 10, 0)), type: 'Total', location: 'Americas, Europe, Africa, Asia' },
  { date: new Date(Date.UTC(2050, 10, 30, 6, 30, 0)), type: 'Total', location: 'Americas, Europe, Africa' },
  { date: new Date(Date.UTC(2051, 3, 26, 2, 16, 0)), type: 'Total', location: 'Americas (US, Brazil), Europe, Africa' },
  { date: new Date(Date.UTC(2051, 9, 19, 19, 11, 0)), type: 'Total', location: 'Europe, Africa, Asia, Australia' },
  { date: new Date(Date.UTC(2052, 3, 14, 2, 18, 0)), type: 'Penumbral', location: 'Americas, Europe, Africa' },
  { date: new Date(Date.UTC(2052, 9, 8, 10, 45, 0)), type: 'Partial', location: 'East Asia, Australia, Americas' },
  { date: new Date(Date.UTC(2053, 2, 4, 17, 22, 0)), type: 'Penumbral', location: 'Europe, Africa, Asia, Australia' },
  { date: new Date(Date.UTC(2053, 7, 29, 8, 5, 0)), type: 'Penumbral', location: 'Asia, Australia, Americas' },
  { date: new Date(Date.UTC(2054, 1, 22, 6, 51, 0)), type: 'Total', location: 'Americas, Europe, Africa' },
  { date: new Date(Date.UTC(2054, 7, 18, 9, 26, 0)), type: 'Total', location: 'Asia, Australia, Americas' },
  { date: new Date(Date.UTC(2055, 1, 11, 22, 46, 0)), type: 'Total', location: 'Americas, Europe, Africa, Asia' },
  { date: new Date(Date.UTC(2055, 7, 7, 10, 53, 0)), type: 'Partial', location: 'East Asia, Australia, Americas' },
  { date: new Date(Date.UTC(2056, 1, 1, 12, 26, 0)), type: 'Penumbral', location: 'East Asia, Australia, North America' },
  { date: new Date(Date.UTC(2056, 5, 27, 10, 3, 0)), type: 'Penumbral', location: 'East Asia, Australia, South America' },
  { date: new Date(Date.UTC(2056, 6, 26, 18, 43, 0)), type: 'Penumbral', location: 'Europe, Africa, Asia, Australia' },
  { date: new Date(Date.UTC(2056, 11, 22, 1, 48, 0)), type: 'Penumbral', location: 'Americas, Europe, Africa' },
  { date: new Date(Date.UTC(2057, 5, 17, 2, 26, 0)), type: 'Partial', location: 'Americas, Europe, Africa, Middle East' },
  { date: new Date(Date.UTC(2057, 11, 11, 0, 53, 0)), type: 'Partial', location: 'Americas, Europe, Africa, Asia' },
  { date: new Date(Date.UTC(2058, 5, 6, 19, 15, 0)), type: 'Total', location: 'Europe, Africa, Asia, Australia' },
  { date: new Date(Date.UTC(2058, 10, 30, 3, 16, 0)), type: 'Total', location: 'Americas, Europe, Africa' },
  { date: new Date(Date.UTC(2059, 4, 27, 7, 55, 0)), type: 'Partial', location: 'Australia, Americas, West Africa' },
  { date: new Date(Date.UTC(2059, 10, 19, 13, 1, 0)), type: 'Partial', location: 'Europe, Asia, Australia, North America' },
  { date: new Date(Date.UTC(2060, 3, 15, 21, 37, 0)), type: 'Penumbral', location: 'South America, Europe, Africa, Asia' },
  { date: new Date(Date.UTC(2060, 9, 9, 18, 53, 0)), type: 'Penumbral', location: 'Europe, Africa, Asia, Australia' },
  { date: new Date(Date.UTC(2060, 10, 8, 4, 4, 0)), type: 'Penumbral', location: 'Americas, Europe, Africa, West Asia' }
];

