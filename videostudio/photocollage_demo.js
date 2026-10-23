"use strict";

// ======================================================================
// TITLE FORMATTER UTILITY
// ======================================================================
function formatTitle(name) {
    return name
        .split(" ")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(" ");
}

// ======================================================================
// PROCEDURAL GRADIENT ITEM GENERATOR
// ======================================================================
function createGradientSlide(name, colorHex, titlePos = "CC") {
    const cvs = document.createElement("canvas");
    cvs.width = 1920;
    cvs.height = 1080;
    const ctx = cvs.getContext("2d");

    const grad = ctx.createLinearGradient(0, 0, 1920, 1080);
    grad.addColorStop(0, colorHex);
    grad.addColorStop(1, "#020617");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1920, 1080);

    const ItemClass = typeof MediaItem !== "undefined" ? MediaItem : window.MediaItem;
    const item = new ItemClass(`${name}.png`, 1920, 1080, cvs, false, null);
    item.title = name;
    item.isTitle = true;
    item.titlePos = titlePos;
    
    // Set move/zoom duration to 0.1 seconds
    item.moveDuration = 0.1;
    
    item.generateThumbnail();
    return item;
}

// ======================================================================
// SILENT URL ASSET LOADER (Skips missing assets without throwing errors)
// ======================================================================
function loadMediaFromUrl(url, title = "", titlePos = "LL", isTitle = true) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const w = img.naturalWidth || img.width || 1920;
            const h = img.naturalHeight || img.height || 1080;
            const filename = decodeURIComponent(url.split("/").pop());
            const ItemClass = typeof MediaItem !== "undefined" ? MediaItem : window.MediaItem;
            const item = new ItemClass(filename, w, h, img, false, null);

            if (title) item.title = title;
            item.isTitle = isTitle;
            item.titlePos = titlePos;
            item.generateThumbnail();

            resolve(item);
        };
        img.onerror = () => {
            resolve(null);
        };
        img.src = url;
    });
}

// ======================================================================
// UNIFIED DEMO LOADER (Combines Procedural Slides & Helio Assets)
// ======================================================================
async function loadDemoMedia(studioApp) {
    if (!studioApp) {
        studioApp = window.videoStudioApp;
    }
    if (!studioApp) return;

    studioApp.clearTimeline(false);
    if (typeof showToast === "function") {
        showToast("Loading slideshow demo...", "info");
    }

    const tasks = [];

    // 1. Crimson Nebula
    tasks.push(Promise.resolve(createGradientSlide("Crimson Nebula", "#dc2626", "CC")));

    // 2. Planets (Title: LL)
    const planetNames = [
        "sun", "mercury", "venus", "earth", "mars",
        "jupiter", "saturn", "uranus", "neptune"
    ];
    for (const name of planetNames) {
        tasks.push(
            loadMediaFromUrl(
                `../helio/infographics/planets/${name}.jpg`,
                formatTitle(name),
                "LL",
                true
            )
        );
    }

    // 3. Azure Horizon
    tasks.push(Promise.resolve(createGradientSlide("Azure Horizon", "#2563eb", "CC")));

    // 4. Moons (Title: LL)
    const moonNames = [
        "moons", "earth moon", "jupiter callisto", "jupiter europa", "jupiter io",
        "saturn iapetus", "saturn enceladus", "neptune triton", "neptune proteus"
    ];
    for (const name of moonNames) {
        tasks.push(
            loadMediaFromUrl(
                `../helio/infographics/moons/${name}.jpg`,
                formatTitle(name),
                "LL",
                true
            )
        );
    }

    // 5. Emerald Canopy
    tasks.push(Promise.resolve(createGradientSlide("Emerald Canopy", "#059669", "CC")));

    // 6. Dwarfs (Title: CC)
    tasks.push(
        loadMediaFromUrl(
            "../helio/infographics/dwarfs/dwarfs.jpg",
            "Dwarfs",
            "CC",
            true
        )
    );

    // 7. Amber Dunes
    tasks.push(Promise.resolve(createGradientSlide("Amber Dunes", "#d97706", "CC")));

    // 8. Comets (Title: CC)
    tasks.push(
        loadMediaFromUrl(
            "../helio/infographics/comets/comets.jpg",
            "Comets",
            "CC",
            true
        )
    );

    // 9. Purple Aurora
    tasks.push(Promise.resolve(createGradientSlide("Purple Aurora", "#7c3aed", "CC")));

    const results = await Promise.all(tasks);
    const loadedItems = results.filter(Boolean);

    if (loadedItems.length > 0) {
        studioApp.mediaItems = loadedItems;
        studioApp.selectedIndices = [0];
        studioApp.renderFilmstrip();
        studioApp.renderMainStage();
        if (typeof showToast === "function") {
            showToast(`Loaded ${loadedItems.length} demo slides`, "success");
        }
    }
}

// Global window assignments
window.loadMediaFromUrl = loadMediaFromUrl;
window.createGradientSlide = createGradientSlide;
window.loadDemoMedia = loadDemoMedia;
