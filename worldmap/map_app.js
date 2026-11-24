/*************************************************************************
 * 1. GLOBAL STATE & CONFIGURATION
 *************************************************************************/
let targetLat = 35.7796;
let targetLon = -78.6382;
let currentMarker = null;
let currentActiveLayer = 'shadedRelief';
let isDrawingAoi = false;
let aoiStartLngLat = null;
let currentAoiBounds = null;

// US bounding box [west, south, east, north] for USGS-only tile endpoints
const US_BOUNDS = [-179.9, 17.5, -64.5, 71.6];

// Maps each basemap card key to its active MapLibre layer IDs
const basemapLayerGroups = {
    worldTopo:    ['lyr-esri-world-topo', 'lyr-carto-voyager', 'lyr-usgs-topo'],
    usgsImagery:  ['lyr-esri-imagery', 'lyr-usgs-imagery-topo', 'lyr-ref-transport', 'lyr-ref-boundaries'],
    shadedRelief: ['lyr-esri-shaded-relief'],
    darkCarto:    ['lyr-carto-dark'],
    customDem:    ['lyr-custom-dem']
};

const layerTitles = {
    worldTopo:    'Global World Topo',
    usgsImagery:  'Imagery + Topo Hybrid',
    shadedRelief: 'Shaded Relief',
    darkCarto:    'CartoDB Dark Matter',
    customDem:    'Custom DEM (Hillshade + Color)'
};

const overlayLayerGroups = {
    hydro:     ['lyr-ovl-hydro'],
    hillshade: ['lyr-ovl-hillshade'],
    labels:    ['lyr-ovl-transport', 'lyr-ovl-boundaries']
};

/*************************************************************************
 * 2. MAPLIBRE STYLE DEFINITION (RASTER SOURCES + LAYERS)
 *************************************************************************/
const mapStyle = {
    version: 8,
    projection: {
        // Smoothly morphs from 3D Globe at zoom <= 4 to Flat 2D Mercator at zoom >= 5
        type: ['interpolate', ['linear'], ['zoom'], 4, 'globe', 5, 'mercator']
    },
    sky: {
        // Full atmospheric halo on the 3D globe, fading out smoothly as it flattens at Zoom 5
        'atmosphere-blend': ['interpolate', ['linear'], ['zoom'], 0, 1, 4, 1, 5.5, 0]
    },
    sources: {
        'src-esri-world-topo': {
            type: 'raster',
            tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}'],
            tileSize: 256, maxzoom: 19,
            attribution: 'Tiles &copy; Esri &mdash; USGS, NOAA, NRCan'
        },
        'src-usgs-topo': {
            type: 'raster',
            tiles: ['https://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer/tile/{z}/{y}/{x}'],
            tileSize: 256, maxzoom: 16, bounds: US_BOUNDS,
            attribution: 'USGS The National Map'
        },
        'src-esri-imagery': {
            type: 'raster',
            tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
            tileSize: 256, maxzoom: 19,
            attribution: 'Tiles &copy; Esri, Maxar'
        },
        'src-usgs-imagery-topo': {
            type: 'raster',
            tiles: ['https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryTopo/MapServer/tile/{z}/{y}/{x}'],
            tileSize: 256, maxzoom: 16, bounds: US_BOUNDS
        },
        'src-carto-voyager': {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256, maxzoom: 19,
            attribution: '&copy; OpenStreetMap contributors'
        },
        'src-esri-shaded-relief': {
            type: 'raster',
            tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Shaded_Relief/MapServer/tile/{z}/{y}/{x}'],
            tileSize: 256, maxzoom: 13
        },
        'src-carto-dark': {
            type: 'raster',
            tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}'],
            tileSize: 256, maxzoom: 16,
            attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ'
        },
        'src-custom-dem': {
            type: 'raster',
            tiles: [new URL('./dem_combined/', window.location.href).href + '{z}/{x}/{y}.webp'],
            tileSize: 256, minzoom: 0, maxzoom: 8,
            attribution: 'Custom Pre-baked DEM (Hillshade + Colormap)'
        },
        'src-ref-transport': {
            type: 'raster',
            tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}'],
            tileSize: 256, maxzoom: 19
        },
        'src-ref-boundaries': {
            type: 'raster',
            tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}'],
            tileSize: 256, maxzoom: 19
        },
        'src-ovl-hydro': {
            type: 'raster',
            tiles: ['https://basemap.nationalmap.gov/arcgis/rest/services/USGSHydroCached/MapServer/tile/{z}/{y}/{x}'],
            tileSize: 256, maxzoom: 16, bounds: US_BOUNDS
        },
        'src-ovl-hillshade': {
            type: 'raster',
            tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/Elevation/World_Hillshade/MapServer/tile/{z}/{y}/{x}'],
            tileSize: 256, maxzoom: 16
        },
        'src-graticule': {
            type: 'geojson',
            data: { type: 'FeatureCollection', features: [] }
        },
        'src-aoi': {
            type: 'geojson',
            data: { type: 'FeatureCollection', features: [] }
        }
    },
    layers: [
        // Basemap layers (default: Shaded Relief + Color Elevation + Labels visible)
        { id: 'lyr-esri-world-topo',    type: 'raster', source: 'src-esri-world-topo',    layout: { visibility: 'none' } },
        { id: 'lyr-carto-voyager',      type: 'raster', source: 'src-carto-voyager',      layout: { visibility: 'none' } },
        { id: 'lyr-usgs-topo',          type: 'raster', source: 'src-usgs-topo',          layout: { visibility: 'none' } },
        { id: 'lyr-esri-imagery',       type: 'raster', source: 'src-esri-imagery',       layout: { visibility: 'none' } },
        { id: 'lyr-usgs-imagery-topo',  type: 'raster', source: 'src-usgs-imagery-topo',  layout: { visibility: 'none' } },
        { id: 'lyr-esri-shaded-relief', type: 'raster', source: 'src-esri-shaded-relief', layout: { visibility: 'visible' }, paint: { 'raster-opacity': ['step', ['zoom'], 0, 4, 1] } },
        { id: 'lyr-carto-dark',         type: 'raster', source: 'src-carto-dark',         layout: { visibility: 'none' } },
        { id: 'lyr-custom-dem',         type: 'raster', source: 'src-custom-dem',         layout: { visibility: 'visible' }, paint: { 'raster-opacity': ['step', ['zoom'], 0.55, 8.01, 0] } },
        { id: 'lyr-ref-transport',      type: 'raster', source: 'src-ref-transport',      layout: { visibility: 'none' }, paint: { 'raster-opacity': 0.85 } },
        { id: 'lyr-ref-boundaries',     type: 'raster', source: 'src-ref-boundaries',     layout: { visibility: 'visible' } },

        // Optional Overlays
        { id: 'lyr-ovl-hydro',      type: 'raster', source: 'src-ovl-hydro',      layout: { visibility: 'none' }, paint: { 'raster-opacity': 0.9 } },
        { id: 'lyr-ovl-hillshade',  type: 'raster', source: 'src-ovl-hillshade',  layout: { visibility: 'none' }, paint: { 'raster-opacity': 0.4 } },
        { id: 'lyr-ovl-transport',  type: 'raster', source: 'src-ref-transport',  layout: { visibility: 'none' } },
        { id: 'lyr-ovl-boundaries', type: 'raster', source: 'src-ref-boundaries', layout: { visibility: 'none' } },

        // Automatic Graticule Grid (non-worldTopo, Zoom < 5)
        {
            id: 'lyr-graticule',
            type: 'line',
            source: 'src-graticule',
            paint: { 'line-color': '#38bdf8', 'line-width': 1, 'line-opacity': 0.5, 'line-dasharray': [4, 4] }
        },

        // AOI Bounding Box
        {
            id: 'lyr-aoi-fill',
            type: 'fill',
            source: 'src-aoi',
            paint: { 'fill-color': '#f59e0b', 'fill-opacity': 0.2 }
        },
        {
            id: 'lyr-aoi-line',
            type: 'line',
            source: 'src-aoi',
            paint: { 'line-color': '#d97706', 'line-width': 2, 'line-dasharray': [4, 3] }
        }
    ]
};

/*************************************************************************
 * 3. INITIALIZE MAPLIBRE MAP
 *************************************************************************/
const map = new maplibregl.Map({
    container: 'map',
    style: mapStyle,
    center: [targetLon, targetLat],
    zoom: 3.5, // Starts in 3D Globe mode; smoothly morphs to 2D around zoom 4-5
    minZoom: 1,
    maxZoom: 20
});

map.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'top-left');
map.addControl(new maplibregl.ScaleControl({ maxWidth: 120, unit: 'imperial' }), 'bottom-left');

/*************************************************************************
 * 4. BASEMAP & OVERLAY CONTROLS
 *************************************************************************/
function switchLayer(layerKey) {
    if (!basemapLayerGroups[layerKey]) return;

    // Hide all basemap layers first
    const allBasemapIds = new Set(Object.values(basemapLayerGroups).flat());
    allBasemapIds.forEach(id => {
        if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', 'none');
    });

    // Show selected basemap layers
    basemapLayerGroups[layerKey].forEach(id => {
        if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', 'visible');
    });

    currentActiveLayer = layerKey;

    if (layerKey === 'worldTopo') {
        updateWorldTopoSubLayers();
    } else if (layerKey === 'shadedRelief') {
        updateShadedReliefSubLayers();
    } else if (layerKey === 'customDem' && map.getLayer('lyr-custom-dem')) {
        map.setPaintProperty('lyr-custom-dem', 'raster-opacity', 1.0);
    }

    document.querySelectorAll('.basemap-card').forEach(card => {
        const isSelected = card.id === 'btn-' + layerKey;
        card.classList.toggle('active-basemap', isSelected);
        card.classList.toggle('border-sky-600', isSelected);
        card.classList.toggle('bg-sky-50/95', isSelected);
        card.classList.toggle('border-slate-200', !isSelected);
        card.classList.toggle('bg-white/95', !isSelected);
        const icon = card.querySelector('.check-icon');
        if (icon) icon.classList.toggle('hidden', !isSelected);
    });

    const badge = document.getElementById('active-layer-badge');
    if (badge) badge.innerText = layerTitles[layerKey];
    document.getElementById('floating-layer-label').innerText = layerTitles[layerKey];

    drawGraticule();
}

function onQuadCheckboxChange(which) {
    const usBox = document.getElementById('toggle-world-usgs');
    const naBox = document.getElementById('toggle-world-quad');

    if (which === 'us' && usBox?.checked && naBox) {
        naBox.checked = false;
    } else if (which === 'na' && naBox?.checked && usBox) {
        usBox.checked = false;
    }

    updateWorldTopoSubLayers();
}

function updateWorldTopoSubLayers() {
    if (currentActiveLayer !== 'worldTopo') return;

    const useOsm    = document.getElementById('toggle-world-osm')?.checked;
    const useUsQuad = document.getElementById('toggle-world-usgs')?.checked;

    if (map.getLayer('lyr-esri-world-topo')) {
        map.setLayoutProperty('lyr-esri-world-topo', 'visibility', useOsm ? 'none' : 'visible');
    }
    if (map.getLayer('lyr-carto-voyager')) {
        map.setLayoutProperty('lyr-carto-voyager', 'visibility', useOsm ? 'visible' : 'none');
    }
    if (map.getLayer('lyr-usgs-topo')) {
        map.setPaintProperty('lyr-usgs-topo', 'raster-opacity', 1.0);
        map.setLayoutProperty('lyr-usgs-topo', 'visibility', useUsQuad ? 'visible' : 'none');
    }
}

function updateShadedReliefSubLayers() {
    if (currentActiveLayer !== 'shadedRelief') return;

    const showLabels = document.getElementById('toggle-shaded-labels')?.checked;
    if (map.getLayer('lyr-ref-boundaries')) {
        map.setLayoutProperty('lyr-ref-boundaries', 'visibility', showLabels ? 'visible' : 'none');
    }

    const showDem = document.getElementById('toggle-shaded-dem')?.checked;
    if (map.getLayer('lyr-esri-shaded-relief')) {
        // When Custom DEM Color is ON, only show 3DEP Shaded Relief at Zoom >= 3
        map.setPaintProperty(
            'lyr-esri-shaded-relief',
            'raster-opacity',
            showDem ? ['step', ['zoom'], 0, 3, 1] : 1
        );
    }
    if (map.getLayer('lyr-custom-dem')) {
        // 55% opacity up to Zoom 8, automatically hidden beyond Zoom 8
        map.setPaintProperty('lyr-custom-dem', 'raster-opacity', ['step', ['zoom'], 0.55, 8.01, 0]);
        map.setLayoutProperty('lyr-custom-dem', 'visibility', showDem ? 'visible' : 'none');
    }
}

function toggleShadedReliefLabels() {
    updateShadedReliefSubLayers();
}

function toggleShadedReliefDem() {
    updateShadedReliefSubLayers();
}

function toggleOverlay(key, enabled) {
    const ids = overlayLayerGroups[key];
    if (!ids) return;
    ids.forEach(id => {
        if (map.getLayer(id)) {
            map.setLayoutProperty(id, 'visibility', enabled ? 'visible' : 'none');
        }
    });
}

function updateHillshadeOpacity(val) {
    document.getElementById('hillshade-opacity-label').innerText = val + '%';
    if (map.getLayer('lyr-ovl-hillshade')) {
        map.setPaintProperty('lyr-ovl-hillshade', 'raster-opacity', parseInt(val, 10) / 100);
    }
}

/*************************************************************************
 * 5. AUTOMATIC LAT/LON GRATICULE GRID (NON-WORLD-TOPO, ZOOM < 5)
 *************************************************************************/
function drawGraticule() {
    const src = map.getSource('src-graticule');
    if (!src) return;

    const zoom = map.getZoom();
    if (currentActiveLayer === 'worldTopo' || zoom >= 5) {
        src.setData({ type: 'FeatureCollection', features: [] });
        return;
    }

    const step = zoom >= 3 ? 10 : 15;
    const features = [];
    for (let lat = -80; lat <= 80; lat += step) {
        const coords = [];
        for (let lon = -180; lon <= 180; lon += 10) coords.push([lon, lat]);
        features.push({ type: 'Feature', geometry: { type: 'LineString', coordinates: coords } });
    }
    for (let lon = -180; lon < 180; lon += step) {
        const coords = [];
        for (let lat = -85; lat <= 85; lat += 5) coords.push([lon, lat]);
        features.push({ type: 'Feature', geometry: { type: 'LineString', coordinates: coords } });
    }

    src.setData({ type: 'FeatureCollection', features });
}

map.on('zoomend', () => {
    document.getElementById('track-zoom').innerText = map.getZoom().toFixed(1);
    drawGraticule();
});

/*************************************************************************
 * 6. ELEVATION INSPECTOR & MARKER UPDATES
 *************************************************************************/
async function fetchElevation(lat, lon) {
    const elevEl = document.getElementById('loc-elevation');
    if (elevEl) elevEl.innerText = 'Querying DEM...';

    try {
        const res = await fetch(`https://api.open-meteo.com/v1/elevation?latitude=${lat.toFixed(5)}&longitude=${lon.toFixed(5)}`);
        if (res.ok) {
            const data = await res.json();
            if (data && Array.isArray(data.elevation) && data.elevation.length > 0) {
                const meters = data.elevation[0];
                const feet = meters * 3.28084;
                const formatted = `${Math.round(meters)} m (${Math.round(feet).toLocaleString()} ft)`;
                if (elevEl) elevEl.innerText = formatted;
                return formatted;
            }
        }
        throw new Error('Fallback to USGS EPQS');
    } catch {
        try {
            const usgsRes = await fetch(`https://epqs.nationalmap.gov/v1/json?x=${lon.toFixed(5)}&y=${lat.toFixed(5)}&wkid=4326&units=Meters&includeDate=false`);
            const usgsData = await usgsRes.json();
            if (usgsData && usgsData.value !== undefined && usgsData.value !== '-1000000') {
                const meters = parseFloat(usgsData.value);
                const feet = meters * 3.28084;
                const formatted = `${Math.round(meters)} m (${Math.round(feet).toLocaleString()} ft)`;
                if (elevEl) elevEl.innerText = formatted;
                return formatted;
            }
        } catch {}
        if (elevEl) elevEl.innerText = 'N/A (Ocean / Offline)';
        return 'N/A';
    }
}

async function updateMapState(lat, lon, fullLabel, shortTitle = '', zoomLevel = null) {
    targetLat = lat;
    targetLon = lon;

    if (zoomLevel !== null) {
        map.flyTo({ center: [lon, lat], zoom: zoomLevel, essential: true });
    } else {
        map.easeTo({ center: [lon, lat] });
    }

    if (currentMarker) currentMarker.remove();

    const displayTitle = shortTitle || fullLabel.split(',')[0] || 'Selected Coordinates';
    const locNameEl = document.getElementById('loc-name');
    const locDetailsEl = document.getElementById('loc-details');
    if (locNameEl) locNameEl.innerText = displayTitle;
    if (locDetailsEl) locDetailsEl.innerText = `${lat.toFixed(4)}, ${lon.toFixed(4)}`;

    document.getElementById('track-lat').innerText = lat.toFixed(4);
    document.getElementById('track-lon').innerText = lon.toFixed(4);

    const popup = new maplibregl.Popup({ offset: 25 }).setHTML(`
        <div class="text-xs text-slate-800">
            <div class="font-bold text-slate-900 text-sm mb-0.5">${displayTitle}</div>
            <div class="text-slate-500 mb-1.5">${fullLabel}</div>
            <div class="font-mono-code text-[11px] bg-slate-100 px-2 py-1 rounded border border-slate-200">
                Lat: <b>${lat.toFixed(4)}</b>, Lon: <b>${lon.toFixed(4)}</b>
            </div>
            <div id="popup-elev-readout" class="mt-1.5 text-[11px] font-semibold text-emerald-700">
                <i class="fa-solid fa-mountain mr-1"></i>Fetching elevation...
            </div>
        </div>
    `);

    currentMarker = new maplibregl.Marker({ color: '#0284c7' })
        .setLngLat([lon, lat])
        .setPopup(popup)
        .addTo(map);
    currentMarker.togglePopup();

    const elevText = await fetchElevation(lat, lon);
    const popupElev = document.getElementById('popup-elev-readout');
    if (popupElev) {
        popupElev.innerHTML = `<i class="fa-solid fa-mountain mr-1"></i>Elevation: <b>${elevText}</b>`;
    }
}

map.on('click', (e) => {
    if (isDrawingAoi) return;
    const { lat, lng } = e.lngLat;
    updateMapState(lat, lng, `Point Inspection (${lat.toFixed(4)}, ${lng.toFixed(4)})`, 'Inspected Map Point', null);
});

// Close inspection popup whenever the user pans or zooms
map.on('movestart', (e) => {
    if (e.originalEvent && currentMarker) {
        const popup = currentMarker.getPopup();
        if (popup && popup.isOpen()) popup.remove();
    }
});

/*************************************************************************
 * 7. GEOCODER, PRESETS & NAVIGATION
 *************************************************************************/
const offlineLocations = {
    'raleigh':       { lat: 35.7796, lon: -78.6382, zoom: 12, label: 'Raleigh, North Carolina, USA' },
    'raleigh, nc':   { lat: 35.7796, lon: -78.6382, zoom: 12, label: 'Raleigh, North Carolina, USA' },
    'niagara falls': { lat: 43.0828, lon: -79.0742, zoom: 13, label: 'Niagara Falls (US / Canada Border)' },
    'grand canyon':  { lat: 36.0553, lon: -112.1218, zoom: 13, label: 'Grand Canyon National Park, AZ, USA' },
    'mount rainier': { lat: 46.8523, lon: -121.7603, zoom: 13, label: 'Mount Rainier, Washington, USA' },
    'banff':         { lat: 51.1784, lon: -115.5708, zoom: 12, label: 'Banff National Park, Alberta, Canada' },
    'paris':         { lat: 48.8566, lon: 2.3522, zoom: 12, label: 'Paris, France' },
    'tokyo':         { lat: 35.6762, lon: 139.6503, zoom: 12, label: 'Tokyo, Japan' },
    'london':        { lat: 51.5074, lon: -0.1278, zoom: 12, label: 'London, United Kingdom' },
    'new york':      { lat: 40.7128, lon: -74.0060, zoom: 12, label: 'New York City, NY, USA' }
};

async function searchLocation() {
    const query = document.getElementById('location-input').value.trim();
    if (!query) return;

    const searchBtn = document.getElementById('search-btn');
    searchBtn.innerText = '...';

    const coordMatch = query.match(/^([-+]?\d+(?:\.\d+)?)\s*[,\s]\s*([-+]?\d+(?:\.\d+)?)$/);
    if (coordMatch) {
        const lat = parseFloat(coordMatch[1]);
        const lon = parseFloat(coordMatch[2]);
        searchBtn.innerText = 'Search';
        updateMapState(lat, lon, `Direct Coordinates (${lat}, ${lon})`, `Coords: ${lat.toFixed(3)}, ${lon.toFixed(3)}`, 13);
        showStatus(`Jumped to coordinates ${lat.toFixed(4)}, ${lon.toFixed(4)}`);
        return;
    }

    try {
        const photonRes = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=1`);
        if (photonRes.ok) {
            const photonData = await photonRes.json();
            if (photonData.features && photonData.features.length > 0) {
                const feat = photonData.features[0];
                const [lon, lat] = feat.geometry.coordinates;
                const props = feat.properties;
                const name = props.name || props.city || query;
                const details = [props.name, props.state, props.country].filter(Boolean).join(', ');
                updateMapState(lat, lon, details || name, name, 12);
                showStatus(`Located: ${details || name}`);
                return;
            }
        }

        const meteoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`);
        if (meteoRes.ok) {
            const meteoData = await meteoRes.json();
            if (meteoData.results && meteoData.results.length > 0) {
                const item = meteoData.results[0];
                const details = [item.name, item.admin1, item.country].filter(Boolean).join(', ');
                updateMapState(item.latitude, item.longitude, details, item.name, 12);
                showStatus(`Located: ${details}`);
                return;
            }
        }
        throw new Error('Not found');
    } catch {
        const key = query.toLowerCase();
        if (offlineLocations[key]) {
            const item = offlineLocations[key];
            updateMapState(item.lat, item.lon, item.label, item.label.split(',')[0], item.zoom);
            showStatus(`Located via preset: ${item.label}`);
        } else {
            showStatus(`Could not find "${query}". Try a city name or "lat, lon".`, true);
        }
    } finally {
        searchBtn.innerText = 'Search';
    }
}

function jumpPreset(lat, lon, zoom, label) {
    document.getElementById('location-input').value = label.split('(')[0].trim();
    updateMapState(lat, lon, label, label.split('(')[0].trim(), zoom);
    showStatus(`Loaded preset: ${label}`);
}

function resetGlobeView() {
    map.flyTo({ center: [targetLon, targetLat], zoom: 2.5, pitch: 0, bearing: 0 });
}

function centerOnTarget() {
    map.flyTo({ center: [targetLon, targetLat], zoom: Math.max(map.getZoom(), 12) });
}

function locateUserGPS() {
    if (!navigator.geolocation) {
        showStatus('Geolocation is not supported by your browser.', true);
        return;
    }
    showStatus('Acquiring GPS coordinates...');
    navigator.geolocation.getCurrentPosition(
        (pos) => {
            updateMapState(pos.coords.latitude, pos.coords.longitude, 'Current GPS Position', 'My GPS Location', 13);
            showStatus('Centered on your GPS location.');
        },
        () => showStatus('Unable to retrieve GPS location.', true)
    );
}

/*************************************************************************
 * 8. AREA OF INTEREST (AOI) BOUNDING BOX TOOL
 *************************************************************************/
function startAoiDraw() {
    isDrawingAoi = !isDrawingAoi;
    const drawBtn = document.getElementById('btn-draw-aoi');
    const mapEl = document.getElementById('map');

    if (isDrawingAoi) {
        map.dragPan.disable();
        mapEl.classList.add('cursor-crosshair-map');
        drawBtn.classList.replace('bg-amber-600', 'bg-rose-600');
        drawBtn.innerHTML = `<i class="fa-solid fa-xmark"></i> Cancel`;
        showStatus('Click and drag on the map to draw an Area of Interest (AOI) bounding box.');
    } else {
        stopAoiDrawMode();
    }
}

function stopAoiDrawMode() {
    isDrawingAoi = false;
    aoiStartLngLat = null;
    map.dragPan.enable();
    document.getElementById('map').classList.remove('cursor-crosshair-map');
    const drawBtn = document.getElementById('btn-draw-aoi');
    drawBtn.classList.replace('bg-rose-600', 'bg-amber-600');
    drawBtn.innerHTML = `<i class="fa-solid fa-crop-simple"></i> Draw Box`;
}

function updateAoiGeometry(w, s, e, n) {
    currentAoiBounds = { w, s, e, n };
    const poly = {
        type: 'FeatureCollection',
        features: [{
            type: 'Feature',
            geometry: {
                type: 'Polygon',
                coordinates: [[[w, s], [e, s], [e, n], [w, n], [w, s]]]
            }
        }]
    };
    const src = map.getSource('src-aoi');
    if (src) src.setData(poly);

    document.getElementById('aoi-n').innerText = n.toFixed(4) + '°';
    document.getElementById('aoi-s').innerText = s.toFixed(4) + '°';
    document.getElementById('aoi-e').innerText = e.toFixed(4) + '°';
    document.getElementById('aoi-w').innerText = w.toFixed(4) + '°';

    const R = 6371;
    const areaKm2 = Math.abs(R * R * ((Math.abs(e - w) * Math.PI) / 180) * (Math.sin((n * Math.PI) / 180) - Math.sin((s * Math.PI) / 180)));
    document.getElementById('aoi-area-badge').innerText = areaKm2 < 1
        ? `${areaKm2.toFixed(2)} km²`
        : `${Math.round(areaKm2).toLocaleString()} km²`;
}

map.on('mousedown', (e) => {
    if (!isDrawingAoi) return;
    aoiStartLngLat = e.lngLat;
});

map.on('mousemove', (e) => {
    document.getElementById('track-lat').innerText = e.lngLat.lat.toFixed(4);
    document.getElementById('track-lon').innerText = e.lngLat.lng.toFixed(4);

    if (isDrawingAoi && aoiStartLngLat) {
        const w = Math.min(aoiStartLngLat.lng, e.lngLat.lng);
        const eLon = Math.max(aoiStartLngLat.lng, e.lngLat.lng);
        const s = Math.min(aoiStartLngLat.lat, e.lngLat.lat);
        const n = Math.max(aoiStartLngLat.lat, e.lngLat.lat);
        updateAoiGeometry(w, s, eLon, n);
    }
});

map.on('mouseup', () => {
    if (isDrawingAoi && aoiStartLngLat) {
        stopAoiDrawMode();
        showStatus('Area of Interest (AOI) bounding box captured.');
    }
});

function setAoiFromCurrentView() {
    const b = map.getBounds();
    const padLon = (b.getEast() - b.getWest()) * 0.15;
    const padLat = (b.getNorth() - b.getSouth()) * 0.15;
    updateAoiGeometry(b.getWest() + padLon, b.getSouth() + padLat, b.getEast() - padLon, b.getNorth() - padLat);
    showStatus('AOI set from current map viewport.');
}

function clearAoiBox() {
    currentAoiBounds = null;
    const src = map.getSource('src-aoi');
    if (src) src.setData({ type: 'FeatureCollection', features: [] });
    ['aoi-n', 'aoi-s', 'aoi-e', 'aoi-w'].forEach(id => document.getElementById(id).innerText = '--');
    document.getElementById('aoi-area-badge').innerText = 'No Box';
}

function copyAoiGeoJSON() {
    const b = currentAoiBounds || {
        w: map.getBounds().getWest(),
        s: map.getBounds().getSouth(),
        e: map.getBounds().getEast(),
        n: map.getBounds().getNorth()
    };
    const w = Number(b.w.toFixed(5)), s = Number(b.s.toFixed(5)), e = Number(b.e.toFixed(5)), n = Number(b.n.toFixed(5));
    const geojson = {
        type: 'Feature',
        properties: { source: 'National Map & Global GIS Explorer', bbox: [w, s, e, n] },
        geometry: { type: 'Polygon', coordinates: [[[w, s], [e, s], [e, n], [w, n], [w, s]]] }
    };
    navigator.clipboard.writeText(JSON.stringify(geojson, null, 2)).then(() => {
        showStatus('Copied AOI GeoJSON & Bounding Box to clipboard!');
    });
}

/*************************************************************************
 * 9. UI TABS & STATUS HELPERS
 *************************************************************************/
function switchTab(tabName) {
    ['overlays', 'tools'].forEach(t => {
        const panel = document.getElementById('tab-panel-' + t);
        const btn = document.getElementById('tab-btn-' + t);
        const isActive = t === tabName;
        if (panel) panel.classList.toggle('hidden', !isActive);
        if (btn) {
            btn.classList.toggle('bg-white', isActive);
            btn.classList.toggle('text-slate-900', isActive);
            btn.classList.toggle('shadow-sm', isActive);
        }
    });
}
let statusTimeout = null;
function showStatus(text, isError = false) {
    const box = document.getElementById('status-msg');
    document.getElementById('status-text').innerText = text;
    box.classList.remove('hidden', 'bg-emerald-50', 'text-emerald-800', 'border-emerald-200', 'bg-rose-50', 'text-rose-800', 'border-rose-200');
    box.classList.add('border');
    if (isError) {
        box.classList.add('bg-rose-50', 'text-rose-800', 'border-rose-200');
    } else {
        box.classList.add('bg-emerald-50', 'text-emerald-800', 'border-emerald-200');
    }
    if (statusTimeout) clearTimeout(statusTimeout);
    statusTimeout = setTimeout(hideStatus, 6000);
}

function hideStatus() {
    document.getElementById('status-msg').classList.add('hidden');
}

document.getElementById('location-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') searchLocation();
});

map.on('load', () => {
    switchLayer('shadedRelief');
    // updateWorldTopoSubLayers();
    // drawGraticule();
});
