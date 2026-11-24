// Paste into the overlays object in your National Map & Global GIS Explorer index.html:
qgisCustom: L.tileLayer('./custom_tiles/{z}/{x}/{y}.webp', {
    minZoom: 0,
    maxNativeZoom: 8,
    maxZoom: 20,
    tileSize: 256,
    opacity: 0.85,
    errorTileUrl: EMPTY_TILE,
    attribution: 'Custom QGIS XYZ Layer'
})
