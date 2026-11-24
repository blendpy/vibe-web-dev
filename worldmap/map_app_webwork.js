/*************************************************************************
 * 10. CLIENT-SIDE RIVER SMOOTHER (WEB WORKER)
 *************************************************************************/
const riverWorker = new Worker('./river_smoother_worker.js');
let riverJobId = 0;
const pendingRiverJobs = new Map();

riverWorker.onmessage = (e) => {
    const { id, geojson, stats } = e.data;
    const resolve = pendingRiverJobs.get(id);
    if (resolve) {
        pendingRiverJobs.delete(id);
        resolve({ geojson, stats });
    }
};

function smoothRiversInWorker(rawGeoJson, options = {}) {
    return new Promise((resolve) => {
        const id = ++riverJobId;
        pendingRiverJobs.set(id, resolve);
        riverWorker.postMessage({ id, geojson: rawGeoJson, options });
    });
}

async function loadSmoothedRivers(geojsonUrl, options = {}) {
    showStatus('Loading & smoothing river network...');
    const res = await fetch(geojsonUrl);
    const rawGeoJson = await res.json();

    const { geojson, stats } = await smoothRiversInWorker(rawGeoJson, {
        zigzagTolMeters: 30.0,
        splineMethod: 'chaikin',   // 'chaikin', 'bspline', or 'none'
        splineStepMeters: 30.0,
        angleGenDeg: 3.0,
        lockEnds: true,
        ...options
    });

    if (map.getSource('src-rivers-smooth')) {
        map.getSource('src-rivers-smooth').setData(geojson);
    } else {
        map.addSource('src-rivers-smooth', { type: 'geojson', data: geojson });
        map.addLayer({
            id: 'lyr-rivers-smooth',
            type: 'line',
            source: 'src-rivers-smooth',
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: { 'line-color': '#0284c7', 'line-width': 2 }
        });
    }

    showStatus(
        `Smoothed rivers in ${stats.elapsedMs} ms (${stats.vertsBefore.toLocaleString()} -> ${stats.vertsAfter.toLocaleString()} vertices)`
    );
}