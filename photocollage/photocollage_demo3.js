"use strict";

// ======================================================================
// TITLE FORMATTER UTILITIES
// ======================================================================
function formatTitle(name) {
    return name
        .split(" ")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(" ");
}

function formatWikimediaTitle(pageTitle, extmetadata) {
    let candidate = extmetadata?.ObjectName?.value || "";

    if (!candidate && extmetadata?.ImageDescription?.value) {
        const text = extmetadata.ImageDescription.value
            .replace(/<[^>]*>?/gm, "")
            .replace(/http[^\s]+/g, "")
            .split(/[.;\n]/)[0];
        if (text && text.length > 4 && text.length < 50) {
            candidate = text;
        }
    }

    if (!candidate || candidate.trim().length === 0) {
        candidate = pageTitle;
    }

    let clean = candidate
        .replace(/^File:/i, "")
        .replace(/\.[^/.]+$/, "")
        .replace(/[_-]/g, " ")
        .replace(/\b(photo(graph)?|taken|captured)?\s*(by|courtesy of)\s+[^,;.\n]+/gi, "")
        .replace(/\bby:\s*[^,;.\n]+/gi, "")
        .replace(/\b(DSC|IMG|PANO|DJI|PIC)[\d\s_-]+\b/gi, "")
        .replace(/\b\d{4}[-_/]\d{2}[-_/]\d{2}\b/g, "")
        .replace(/\b\d{4}\b/g, "")
        .replace(/\((cropped|restored|retouched|edited|pano|hdr|focus stacked)[^)]*\)/gi, "")
        .replace(/\b(cropped|restored|retouched|edit|high res)\b/gi, "")
        .replace(/\s+/g, " ")
        .trim();

    clean = clean.replace(/^[,\s-]+|[,\s-]+$/g, "");

    if (!clean || clean.length < 3) {
        clean = "Scenic Landmark";
    } else if (clean.length > 34) {
        clean = clean.slice(0, 34).replace(/\s\S*$/, "") + "...";
    }

    return clean;
}

// ======================================================================
// STATUS BAR / PROGRESS CONTROLLER
// ======================================================================
class DemoProgressTracker {
    constructor(title = "Downloading Media...", subtitle = "Fetching image assets...") {
        ensureDemoModalDom();
        this.overlay = document.getElementById("demoLoadingOverlay");
        this.bar = document.getElementById("demoProgressBar");
        this.percent = document.getElementById("lblDemoProgressPercent");
        this.lblTitle = document.getElementById("lblDemoLoadingTitle");
        this.lblStatus = document.getElementById("lblDemoLoadingStatus");

        if (this.lblTitle) this.lblTitle.textContent = title;
        if (this.lblStatus) this.lblStatus.textContent = subtitle;

        this.currentVal = 0;
        this.targetVal = 0;
        this.isDone = false;
        this.timer = null;

        this.show();
        this.startTicker();
    }

    show() {
        if (this.overlay) this.overlay.classList.remove("hidden");
        this.updateUI(0);
    }

    startTicker() {
        this.timer = setInterval(() => {
            if (this.currentVal < this.targetVal) {
                this.currentVal = Math.min(this.targetVal, this.currentVal + 2);
                this.updateUI(this.currentVal);
            } else if (this.currentVal < 88 && !this.isDone) {
                this.currentVal += 0.5;
                this.updateUI(this.currentVal);
            }
        }, 30);
    }

    setTarget(pct) {
        this.targetVal = Math.min(95, Math.max(this.targetVal, pct));
    }

    updateUI(pct) {
        const rounded = Math.min(100, Math.round(pct));
        if (this.bar) this.bar.style.width = `${rounded}%`;
        if (this.percent) this.percent.textContent = `${rounded}%`;
    }

    finish() {
        this.isDone = true;
        this.targetVal = 100;
        this.currentVal = 100;
        this.updateUI(100);

        if (this.timer) clearInterval(this.timer);
        setTimeout(() => {
            if (this.overlay) this.overlay.classList.add("hidden");
            this.updateUI(0);
        }, 300);
    }
}

// ======================================================================
// PHOTO & SLIDE GENERATION HELPERS
// ======================================================================
function createChapterSlide(titleText, colorHex, isGradient = true) {
    const cvs = document.createElement("canvas");
    cvs.width = 1200;
    cvs.height = 800;
    const ctx = cvs.getContext("2d");

    if (isGradient) {
        const grad = ctx.createLinearGradient(0, 0, 1200, 800);
        grad.addColorStop(0, colorHex);
        grad.addColorStop(1, "#020617");
        ctx.fillStyle = grad;
    } else {
        ctx.fillStyle = colorHex;
    }
    ctx.fillRect(0, 0, 1200, 800);

    const cleanTitle = (titleText || "").trim();
    if (cleanTitle) {
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 52px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
        ctx.shadowBlur = 14;
        ctx.fillText(cleanTitle, 600, 400);
    }

    const filename = cleanTitle ? `${cleanTitle}.png` : "Color_Panel.png";
    return new Photo(filename, 1200, 800, 0, cvs, false);
}

function loadMediaFromUrl(url, title = "") {
    return new Promise((resolve) => {
        let settled = false;
        const img = new Image();
        img.crossOrigin = "anonymous";

        const timeoutId = setTimeout(() => {
            if (!settled) {
                settled = true;
                img.src = "";
                resolve(null);
            }
        }, 7000);

        img.onload = () => {
            if (settled) return;
            settled = true;
            clearTimeout(timeoutId);

            try {
                const w = img.naturalWidth || img.width || 1200;
                const h = img.naturalHeight || img.height || 800;
                let cleanFilename = title ? `${title}.jpg` : decodeURIComponent(url.split("/").pop());
                if (!/\.(jpe?g|png|webp|gif)$/i.test(cleanFilename)) {
                    cleanFilename += ".jpg";
                }
                const photo = new Photo(cleanFilename, w, h, 0, img, false);
                resolve(photo);
            } catch (err) {
                console.warn("Photo decode error:", err);
                resolve(null);
            }
        };

        img.onerror = () => {
            if (!settled) {
                settled = true;
                clearTimeout(timeoutId);
                resolve(null);
            }
        };

        img.src = url;
    });
}

function applyPhotosToCollage(app, photos, clearCollage = true) {
    if (!photos || !photos.length) return;
    app.cancel_sequential_zoom();
    app.stop_single_zoom();
    if (clearCollage) {
        const newCollage = new UserCollage(photos);
        newCollage.make_page(app.opts);
        app.render_from_new_collage(newCollage);
    } else {
        app.update_photolist(photos);
    }
}

// ======================================================================
// DEMO 1: DAILY BING & NATURE WALLPAPERS (With Category & Year Filtering)
// ======================================================================
async function loadBingWallpapers(app, count = 8, clearCollage = true, category = "random", year = "random") {
    const progress = new DemoProgressTracker("Downloading Bing Wallpapers...", "Searching wallpaper archives...");

    const availableYears = ["2026", "2025", "2024", "2023", "2022", "2021", "2020"];
    const chosenYear = (year === "random")
        ? availableYears[Math.floor(Math.random() * availableYears.length)]
        : (year === "all" ? "" : year);

    const categoryKeywords = {
        nature: "nature landscape mountain forest",
        wildlife: "wildlife animal bird fauna",
        architecture: "architecture city bridge building",
        ocean: "ocean beach sea coastal",
        space: "space stars astronomy night cosmos"
    };

    const catKeys = Object.keys(categoryKeywords);
    const chosenCatKey = (category === "random" || !categoryKeywords[category])
        ? catKeys[Math.floor(Math.random() * catKeys.length)]
        : category;
    const catQuery = categoryKeywords[chosenCatKey];

    const searchQuery = `Bing wallpaper ${catQuery} ${chosenYear}`.trim();

    try {
        const apiUrl = `https://commons.wikimedia.org/w/api.php?action=query` +
            `&generator=search` +
            `&gsrsearch=${encodeURIComponent(searchQuery)}` +
            `&gsrnamespace=6` +
            `&gsrlimit=36` +
            `&prop=imageinfo` +
            `&iiprop=url|size|extmetadata` +
            `&iiurlwidth=1920` +
            `&format=json` +
            `&origin=*`;

        const res = await fetch(apiUrl);
        if (!res.ok) throw new Error("Search API request failed");

        const data = await res.json();
        const pages = Object.values(data?.query?.pages || {});

        const validPhotos = pages.filter(p => {
            const info = p.imageinfo?.[0];
            if (!info || (!info.thumburl && !info.url)) return false;
            const target = info.thumburl || info.url;
            const isRaster = /\.(jpe?g|png|webp)/i.test(target);
            const isLandscape = (info.width || 0) >= (info.height || 0);
            return isRaster && isLandscape;
        });

        let selected = validPhotos.sort(() => 0.5 - Math.random()).slice(0, count);

        // Fallback to broader Bing search if category+year had few results
        if (selected.length < count) {
            const fallbackRes = await fetch(
                `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(`Bing wallpaper ${catQuery}`)}&gsrnamespace=6&gsrlimit=30&prop=imageinfo&iiprop=url|size|extmetadata&iiurlwidth=1920&format=json&origin=*`
            );
            if (fallbackRes.ok) {
                const fbData = await fallbackRes.json();
                const fbPages = Object.values(fbData?.query?.pages || {}).filter(p => {
                    const info = p.imageinfo?.[0];
                    return info && (info.thumburl || info.url) && /\.(jpe?g|png|webp)/i.test(info.thumburl || info.url);
                });
                const combined = [...selected, ...fbPages];
                const seen = new Set();
                selected = combined.filter(p => {
                    if (seen.has(p.pageid)) return false;
                    seen.add(p.pageid);
                    return true;
                }).slice(0, count);
            }
        }

        if (!selected.length) throw new Error("No qualifying wallpaper photos found");

        let loadedCount = 0;
        const tasks = selected.map(p => {
            const info = p.imageinfo[0];
            const cleanTitle = formatWikimediaTitle(p.title, info.extmetadata);
            const targetUrl = info.thumburl || info.url;

            return loadMediaFromUrl(targetUrl, cleanTitle).then(item => {
                loadedCount++;
                progress.setTarget(Math.round((loadedCount / selected.length) * 90));
                return item;
            });
        });

        const results = await Promise.all(tasks);
        const loadedItems = results.filter(Boolean);

        if (loadedItems.length > 0) {
            applyPhotosToCollage(app, loadedItems, clearCollage);
            const yearLabel = chosenYear ? ` • ${chosenYear}` : "";
            showToast(`Loaded ${loadedItems.length} Bing wallpapers (${formatTitle(chosenCatKey)}${yearLabel})`, "success");
        } else {
            throw new Error("Zero photo assets decoded");
        }
    } catch (err) {
        console.warn("Wallpaper archive query failed, falling back to photography feed:", err);
        const randomPage = Math.floor(Math.random() * 25) + 1;
        try {
            const res = await fetch(`https://picsum.photos/v2/list?page=${randomPage}&limit=${Math.max(count + 4, 16)}`);
            const items = await res.json();
            const landscapes = items
                .filter(item => (item.width || 0) >= (item.height || 0))
                .slice(0, count);

            let loadedCount = 0;
            const tasks = landscapes.map((photo, idx) => {
                const targetUrl = `https://picsum.photos/id/${photo.id}/1920/1080`;
                const title = `Bing Wallpaper ${idx + 1}`;
                return loadMediaFromUrl(targetUrl, title).then(item => {
                    loadedCount++;
                    progress.setTarget(Math.round((loadedCount / landscapes.length) * 90));
                    return item;
                });
            });

            const results = await Promise.all(tasks);
            const loadedItems = results.filter(Boolean);
            if (loadedItems.length > 0) {
                applyPhotosToCollage(app, loadedItems, clearCollage);
                showToast(`Loaded ${loadedItems.length} wallpapers`, "success");
            }
        } catch (_) {
            showToast("Could not download wallpapers. Please try again.", "error");
        }
    } finally {
        progress.finish();
    }
}

// ======================================================================
// DEMO 2: HELIO SOLAR SYSTEM
// ======================================================================
async function loadHelioDemo(app, clearCollage = true) {
    const progress = new DemoProgressTracker("Loading Helio Solar System...", "Generating astronomical assets & infographics...");
    const HELIO_BASE = "https://blendpy.github.io/vibe-web-dev/helio/infographics";

    try {
        const rawTasks = [];
        rawTasks.push(Promise.resolve(createChapterSlide("Crimson Nebula", "#dc2626", true)));

        const planetNames = ["sun", "mercury", "venus", "earth", "mars", "jupiter", "saturn", "uranus", "neptune"];
        for (const name of planetNames) {
            rawTasks.push(loadMediaFromUrl(`${HELIO_BASE}/planets/${name}.jpg`, formatTitle(name)));
        }

        rawTasks.push(Promise.resolve(createChapterSlide("Azure Horizon", "#2563eb", true)));

        const moonNames = [
            "moons", "earth moon", "jupiter callisto", "jupiter europa", "jupiter io",
            "saturn iapetus", "saturn enceladus", "neptune triton", "neptune proteus"
        ];
        for (const name of moonNames) {
            rawTasks.push(loadMediaFromUrl(`${HELIO_BASE}/moons/${name}.jpg`, formatTitle(name)));
        }

        rawTasks.push(Promise.resolve(createChapterSlide("Emerald Canopy", "#059669", true)));
        rawTasks.push(loadMediaFromUrl(`${HELIO_BASE}/dwarfs/dwarfs.jpg`, "Dwarfs"));

        rawTasks.push(Promise.resolve(createChapterSlide("Amber Dunes", "#d97706", true)));
        rawTasks.push(loadMediaFromUrl(`${HELIO_BASE}/comets/comets.jpg`, "Comets"));

        rawTasks.push(Promise.resolve(createChapterSlide("Purple Aurora", "#7c3aed", true)));

        const total = rawTasks.length;
        let completed = 0;
        const tasks = rawTasks.map(p =>
            p.then(res => {
                completed++;
                progress.setTarget(Math.round((completed / total) * 90));
                return res;
            })
        );

        const results = await Promise.all(tasks);
        const loadedItems = results.filter(Boolean);

        if (loadedItems.length > 0) {
            applyPhotosToCollage(app, loadedItems, clearCollage);
            showToast(`Loaded ${loadedItems.length} Helio slides`, "success");
        }
    } finally {
        progress.finish();
    }
}

// ======================================================================
// DEMO 3: WIKIMEDIA COMMONS (With Default Random Topic Support)
// ======================================================================
async function loadWikimediaDemo(app, count = 8, clearCollage = true, topic = "random") {
    const progress = new DemoProgressTracker("Loading Wikimedia Works...", "Fetching landscape art & photography...");

    const randomTopics = [
        "mountain landscape", "national park", "scenic valley", "castle landscape",
        "glacier national park", "coastline cliff", "forest waterfall", "desert dunes",
        "aurora borealis", "lake reflection"
    ];

    const activeTopic = (topic === "random" || !topic)
        ? randomTopics[Math.floor(Math.random() * randomTopics.length)]
        : topic;

    try {
        const apiUrl = `https://commons.wikimedia.org/w/api.php?action=query` +
            `&generator=search` +
            `&gsrsearch=${encodeURIComponent(activeTopic)}` +
            `&gsrnamespace=6` +
            `&gsrlimit=30` +
            `&prop=imageinfo` +
            `&iiprop=url|size|extmetadata` +
            `&iiurlwidth=1280` +
            `&format=json` +
            `&origin=*`;

        const res = await fetch(apiUrl);
        if (!res.ok) throw new Error("Wikimedia network request failed");

        const data = await res.json();
        const pages = Object.values(data?.query?.pages || {});

        const validPhotos = pages.filter(p => {
            const info = p.imageinfo?.[0];
            if (!info || (!info.thumburl && !info.url)) return false;
            const target = info.thumburl || info.url;
            const isRaster = /\.(jpe?g|png|webp)/i.test(target);
            const isLandscape = (info.width || 0) >= (info.height || 0);
            return isRaster && isLandscape;
        });

        const selected = validPhotos.sort(() => 0.5 - Math.random()).slice(0, count);
        if (!selected.length) throw new Error("No qualifying images found");

        let loadedCount = 0;
        const tasks = selected.map(p => {
            const info = p.imageinfo[0];
            const cleanTitle = formatWikimediaTitle(p.title, info.extmetadata);
            const targetUrl = info.thumburl || info.url;

            return loadMediaFromUrl(targetUrl, cleanTitle).then(item => {
                loadedCount++;
                progress.setTarget(Math.round((loadedCount / selected.length) * 90));
                return item;
            });
        });

        const results = await Promise.all(tasks);
        const loadedItems = results.filter(Boolean);

        if (loadedItems.length > 0) {
            applyPhotosToCollage(app, loadedItems, clearCollage);
            showToast(`Loaded ${loadedItems.length} Wikimedia works (${formatTitle(activeTopic)})`, "success");
        } else {
            throw new Error("Unable to decode Wikimedia thumbnails");
        }
    } catch (err) {
        console.error("Wikimedia loader error:", err);
        showToast("Could not load Wikimedia images. Please try again.", "error");
    } finally {
        progress.finish();
    }
}

// ======================================================================
// DEMO PICKER MODAL CONTROLLER & DOM INJECTION
// ======================================================================
const DEMO_TAB_STORAGE_KEY = "photocollage_active_demo_tab";
let currentDemoCategory = localStorage.getItem(DEMO_TAB_STORAGE_KEY) || "bing";
let selectedChapterColor = "#dc2626";

function ensureDemoModalDom() {
    if (document.getElementById("demoPickerModal")) return;

    const modalHtml = `
    <!-- Demo Loading Progress Overlay -->
    <div id="demoLoadingOverlay" class="hidden fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 w-80 text-center animate-fadeIn">
            <p id="lblDemoLoadingTitle" class="text-sm font-bold text-slate-800 mb-1">Downloading Media...</p>
            <p id="lblDemoLoadingStatus" class="text-xs text-slate-500 mb-4">Fetching image assets...</p>
            <div class="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                <div id="demoProgressBar" class="h-full bg-blue-600 transition-all duration-150" style="width: 0%"></div>
            </div>
            <p id="lblDemoProgressPercent" class="text-xs font-semibold text-slate-600 mt-2">0%</p>
        </div>
    </div>

    <!-- Demo Picker Dialog Modal -->
    <div id="demoPickerModal" class="hidden fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-fadeIn flex flex-col max-h-[90vh]">
            <!-- Modal Header -->
            <div class="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
                <div class="flex items-center gap-2">
                    <span class="text-xl">🖼️</span>
                    <h2 class="text-base font-bold text-slate-800">Select Demo Photo Collection</h2>
                </div>
                <button id="btnDemoModalClose" class="text-slate-400 hover:text-slate-700 text-lg font-bold p-1">✕</button>
            </div>

            <!-- Tab Navigation Bar -->
            <div class="flex items-center gap-1.5 px-6 pt-3 bg-slate-100/70 border-b border-slate-200 overflow-x-auto shrink-0">
                <button id="tabDemoBing" class="px-3.5 py-2 text-xs font-medium rounded-t-lg bg-slate-200 text-slate-700 whitespace-nowrap transition">Bing Wallpapers</button>
                <button id="tabDemoHelio" class="px-3.5 py-2 text-xs font-medium rounded-t-lg bg-slate-200 text-slate-700 whitespace-nowrap transition">Helio Space</button>
                <button id="tabDemoWiki" class="px-3.5 py-2 text-xs font-medium rounded-t-lg bg-slate-200 text-slate-700 whitespace-nowrap transition">Wikimedia</button>
                <button id="tabDemoChapter" class="px-3.5 py-2 text-xs font-medium rounded-t-lg bg-slate-200 text-slate-700 whitespace-nowrap transition">Color Panels</button>
                <button id="tabDemoCurated" class="px-3.5 py-2 text-xs font-medium rounded-t-lg bg-slate-200 text-slate-700 whitespace-nowrap transition">Curated Art</button>
            </div>

            <!-- Modal Content Panels -->
            <div class="p-6 overflow-y-auto space-y-4 flex-1">
                <!-- Panel 1: Bing Wallpapers -->
                <div id="panelDemoBing" class="space-y-4">
                    <p class="text-xs text-slate-600 leading-relaxed">
                        Fetches high-resolution Bing landscape and nature wallpapers filtered by category and year.
                    </p>
                    <div class="space-y-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                        <!-- Category Dropdown -->
                        <div class="flex items-center justify-between gap-3">
                            <label for="selBingCategory" class="text-xs font-semibold text-slate-700 shrink-0">Category:</label>
                            <select id="selBingCategory" class="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <option value="random" selected>Random (All Categories)</option>
                                <option value="nature">Nature & Landscapes</option>
                                <option value="wildlife">Wildlife & Animals</option>
                                <option value="architecture">Architecture & Cities</option>
                                <option value="ocean">Oceans & Beaches</option>
                                <option value="space">Space & Astronomy</option>
                            </select>
                        </div>
                        <!-- Year Dropdown -->
                        <div class="flex items-center justify-between gap-3 pt-1 border-t border-slate-200/70">
                            <label for="selBingYear" class="text-xs font-semibold text-slate-700 shrink-0">Year:</label>
                            <select id="selBingYear" class="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <option value="random" selected>Random Year</option>
                                <option value="2026">2026</option>
                                <option value="2025">2025</option>
                                <option value="2024">2024</option>
                                <option value="2023">2023</option>
                                <option value="2022">2022</option>
                                <option value="2021">2021</option>
                                <option value="2020">2020</option>
                                <option value="all">All Years</option>
                            </select>
                        </div>
                        <!-- Photo Count Dropdown -->
                        <div class="flex items-center justify-between gap-3 pt-1 border-t border-slate-200/70">
                            <label for="selBingCount" class="text-xs font-semibold text-slate-700">Number of photos:</label>
                            <select id="selBingCount" class="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <option value="4">4 Photos</option>
                                <option value="8" selected>8 Photos</option>
                                <option value="12">12 Photos</option>
                                <option value="16">16 Photos</option>
                            </select>
                        </div>
                    </div>
                </div>

                <!-- Panel 2: Helio Solar System -->
                <div id="panelDemoHelio" class="space-y-4 hidden">
                    <p class="text-xs text-slate-600 leading-relaxed">
                        Loads astronomical infographics including the Sun, planets, major solar system moons, and comets.
                    </p>
                    <div class="bg-indigo-50/70 border border-indigo-200/80 rounded-xl p-3.5 text-xs text-indigo-950 space-y-1">
                        <div class="font-semibold flex items-center gap-1.5">
                            <span>🪐</span>
                            <span>Infographics for Solar System</span>
                        </div>
                    </div>
                </div>

                <!-- Panel 3: Wikimedia Commons -->
                <div id="panelDemoWiki" class="space-y-4 hidden">
                    <p class="text-xs text-slate-600 leading-relaxed">
                        Searches and streams public domain and Creative Commons landscape photography directly from Wikimedia Commons.
                    </p>
                    <div class="space-y-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                        <div class="flex items-center justify-between gap-3">
                            <label for="selWikiTopic" class="text-xs font-semibold text-slate-700 shrink-0">Search Theme:</label>
                            <select id="selWikiTopic" class="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <option value="random" selected>Random (All Themes)</option>
                                <option value="mountain landscape">Mountain Landscapes</option>
                                <option value="national park">National Parks</option>
                                <option value="castle landscape">Castle Landscapes</option>
                                <option value="glacier national park">Glacial Scenery</option>
                                <option value="coastline cliff">Coastlines & Cliffs</option>
                                <option value="forest waterfall">Forests & Waterfalls</option>
                                <option value="desert dunes">Deserts & Dunes</option>
                                <option value="aurora borealis">Aurora & Night Sky</option>
                            </select>
                        </div>
                        <div class="flex items-center justify-between gap-3 pt-1 border-t border-slate-200/70">
                            <label for="selWikiCount" class="text-xs font-semibold text-slate-700">Number of photos:</label>
                            <select id="selWikiCount" class="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <option value="4">4 Photos</option>
                                <option value="8" selected>8 Photos</option>
                                <option value="12">12 Photos</option>
                                <option value="16">16 Photos</option>
                            </select>
                        </div>
                    </div>
                </div>

                <!-- Panel 4: Color & Title Panels -->
                <div id="panelDemoChapter" class="space-y-4 hidden">
                    <p class="text-xs text-slate-600 leading-relaxed">
                        Generate solid or gradient title panels to use as dividers, collage backdrops, or color blocks.
                    </p>
                    <div class="space-y-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                        <div>
                            <label for="txtChapterTitle" class="block text-xs font-semibold text-slate-700 mb-1">Panel Title (Optional)</label>
                            <input type="text" id="txtChapterTitle" placeholder="e.g., Vacation 2026" class="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500">
                        </div>
                        <div class="flex items-center justify-between pt-1">
                            <label class="inline-flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" id="chkChapterGradient" checked class="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300">
                                <span class="text-xs font-medium text-slate-700">Apply Dark Gradient Vignette</span>
                            </label>
                            <div class="flex items-center gap-2">
                                <label for="pickerCustomChapterColor" class="text-xs text-slate-600 font-medium">Custom:</label>
                                <input type="color" id="pickerCustomChapterColor" value="#dc2626" class="w-7 h-7 rounded border border-slate-300 cursor-pointer p-0.5 bg-white">
                            </div>
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-slate-700 mb-1.5">Preset Swatches:</label>
                            <div id="chapterColorSwatches" class="flex flex-wrap gap-2"></div>
                        </div>
                    </div>
                </div>

                <!-- Panel 5: Curated Art (Default) -->
                <div id="panelDemoCurated" class="space-y-4 hidden">
                    <p class="text-xs text-slate-600 leading-relaxed">
                        Generates the 8 procedural art photographs loaded at startup.
                    </p>
                    <div class="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-900">
                        ✨ Instant 0ms generation with mathematical landscapes, cityscapes, and varied aspect ratios.
                    </div>
                </div>

                <!-- Clear Existing Photos Checkbox -->
                <div class="pt-2">
                    <label class="inline-flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" id="chkDemoClearCollage" checked class="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300">
                        <span class="text-xs font-medium text-slate-700">Replace existing collage photos (uncheck to append)</span>
                    </label>
                </div>
            </div>

            <!-- Modal Footer -->
            <div class="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0 gap-2.5">
                <button id="btnDemoCancel" class="px-4 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs sm:text-sm font-medium transition">
                    Cancel
                </button>
                <button id="btnDemoConfirmLoad" class="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs sm:text-sm font-medium shadow-sm transition flex items-center gap-1.5">
                    <span>🖼️</span>
                    <span id="lblDemoConfirmText">Load Collection</span>
                </button>
            </div>
        </div>
    </div>`;

    const wrapper = document.createElement("div");
    wrapper.innerHTML = modalHtml;
    while (wrapper.firstChild) {
        document.body.appendChild(wrapper.firstChild);
    }
}

function openDemoPickerModal(app) {
    ensureDemoModalDom();

    const modal = document.getElementById("demoPickerModal");
    if (!modal) {
        loadBingWallpapers(app, 8, true);
        return;
    }

    modal.classList.remove("hidden");

    const tabs = {
        bing: document.getElementById("tabDemoBing"),
        helio: document.getElementById("tabDemoHelio"),
        wiki: document.getElementById("tabDemoWiki"),
        chapter: document.getElementById("tabDemoChapter"),
        curated: document.getElementById("tabDemoCurated")
    };

    const panels = {
        bing: document.getElementById("panelDemoBing"),
        helio: document.getElementById("panelDemoHelio"),
        wiki: document.getElementById("panelDemoWiki"),
        chapter: document.getElementById("panelDemoChapter"),
        curated: document.getElementById("panelDemoCurated")
    };

    const lblConfirm = document.getElementById("lblDemoConfirmText");
    const btnConfirm = document.getElementById("btnDemoConfirmLoad");
    const btnClose = document.getElementById("btnDemoModalClose");
    const btnCancel = document.getElementById("btnDemoCancel");

    const switchTab = (tabKey) => {
        currentDemoCategory = tabKey;
        try {
            localStorage.setItem(DEMO_TAB_STORAGE_KEY, tabKey);
        } catch (_) {}
        modal.dataset.activeTab = tabKey;

        const activeClass = "px-3.5 py-2 text-xs font-semibold rounded-t-lg bg-blue-600 text-white shadow whitespace-nowrap transition";
        const inactiveClass = "px-3.5 py-2 text-xs font-medium rounded-t-lg bg-slate-200 hover:bg-slate-300 text-slate-700 whitespace-nowrap transition";

        Object.keys(tabs).forEach(k => {
            if (tabs[k]) tabs[k].className = (k === tabKey) ? activeClass : inactiveClass;
            if (panels[k]) panels[k].classList.toggle("hidden", k !== tabKey);
        });

        if (lblConfirm) {
            if (tabKey === "bing") lblConfirm.textContent = "Load Wallpapers";
            else if (tabKey === "helio") lblConfirm.textContent = "Load Helio Slides";
            else if (tabKey === "wiki") lblConfirm.textContent = "Load Wikimedia Works";
            else if (tabKey === "chapter") lblConfirm.textContent = "Add Color Panel";
            else if (tabKey === "curated") lblConfirm.textContent = "Load Curated Art";
        }
    };

    const swatchContainer = document.getElementById("chapterColorSwatches");
    if (swatchContainer && swatchContainer.children.length === 0) {
        const swatches = [
            "#dc2626", "#e11d48", "#d97706", "#ca8a04",
            "#059669", "#0d9488", "#0891b2", "#2563eb",
            "#4f46e5", "#7c3aed", "#c026d3", "#475569"
        ];
        swatches.forEach(hex => {
            const box = document.createElement("button");
            box.type = "button";
            box.className = "swatch-box w-7 h-7 rounded-lg border border-slate-300 hover:scale-105 transition-all shadow-sm";
            box.style.backgroundColor = hex;
            box.dataset.color = hex;
            box.onclick = () => {
                selectedChapterColor = hex;
                updateSwatchSelection();
            };
            swatchContainer.appendChild(box);
        });
    }

    const updateSwatchSelection = () => {
        document.querySelectorAll(".swatch-box").forEach(b => {
            if (b.dataset.color.toLowerCase() === selectedChapterColor.toLowerCase()) {
                b.className = "swatch-box w-7 h-7 rounded-lg border-2 border-white ring-2 ring-blue-500 scale-110 transition-all shadow";
            } else {
                b.className = "swatch-box w-7 h-7 rounded-lg border border-slate-300 hover:scale-105 transition-all shadow-sm";
            }
        });
        const picker = document.getElementById("pickerCustomChapterColor");
        if (picker) picker.value = selectedChapterColor;
    };

    const pickerCustom = document.getElementById("pickerCustomChapterColor");
    if (pickerCustom) {
        pickerCustom.oninput = (e) => {
            selectedChapterColor = e.target.value;
            updateSwatchSelection();
        };
    }

    if (tabs.bing) tabs.bing.onclick = () => switchTab("bing");
    if (tabs.helio) tabs.helio.onclick = () => switchTab("helio");
    if (tabs.wiki) tabs.wiki.onclick = () => switchTab("wiki");
    if (tabs.chapter) tabs.chapter.onclick = () => switchTab("chapter");
    if (tabs.curated) tabs.curated.onclick = () => switchTab("curated");

    switchTab(currentDemoCategory);
    updateSwatchSelection();

    const closeModal = () => modal.classList.add("hidden");
    if (btnClose) btnClose.onclick = closeModal;
    if (btnCancel) btnCancel.onclick = closeModal;

    if (btnConfirm) {
        btnConfirm.onclick = async () => {
            const active = modal.dataset.activeTab || currentDemoCategory;
            const clear = document.getElementById("chkDemoClearCollage")?.checked ?? true;

            closeModal();

            if (active === "bing") {
                const count = parseInt(document.getElementById("selBingCount")?.value || "8", 10);
                const category = document.getElementById("selBingCategory")?.value || "random";
                const year = document.getElementById("selBingYear")?.value || "random";
                await loadBingWallpapers(app, count, clear, category, year);
            } else if (active === "helio") {
                await loadHelioDemo(app, clear);
            } else if (active === "wiki") {
                const count = parseInt(document.getElementById("selWikiCount")?.value || "8", 10);
                const topic = document.getElementById("selWikiTopic")?.value || "random";
                await loadWikimediaDemo(app, count, clear, topic);
            } else if (active === "chapter") {
                const titleText = document.getElementById("txtChapterTitle")?.value || "";
                const isGrad = document.getElementById("chkChapterGradient")?.checked ?? true;
                const slide = createChapterSlide(titleText, selectedChapterColor, isGrad);
                applyPhotosToCollage(app, [slide], clear);
                showToast("Added color panel", "success");
            } else if (active === "curated") {
                const demoPhotos = createDemoPhotoList();
                applyPhotosToCollage(app, demoPhotos, clear);
                showToast("Loaded standard curated demo photos!", "success");
            }
        };
    }
}

// ======================================================================
// CURATED DEMO PHOTO GENERATOR (Standard Startup Procedural Photography Art)
// ======================================================================
function createDemoPhotoList() {
    const specs = [
        { name: "Alpine_Sunset.jpg", w: 1200, h: 800, theme: "mountains" },
        { name: "Tokyo_Neon_Night.jpg", w: 800, h: 1100, theme: "city" },
        { name: "Pacific_Coastline.jpg", w: 1200, h: 750, theme: "ocean" },
        { name: "Botanical_Monstera.jpg", w: 900, h: 900, theme: "botanical" },
        { name: "Sahara_Dunes.jpg", w: 1100, h: 750, theme: "desert" },
        { name: "Nordic_Lighthouse.jpg", w: 750, h: 1050, theme: "lighthouse" },
        { name: "Autumn_Birch_Forest.jpg", w: 1000, h: 800, theme: "forest" },
        { name: "Modern_Architecture.jpg", w: 850, h: 1050, theme: "architecture" }
    ];

    return specs.map(spec => {
        const c = document.createElement("canvas");
        c.width = spec.w;
        c.height = spec.h;
        const ctx = c.getContext("2d");
        const W = spec.w;
        const H = spec.h;

        if (spec.theme === "mountains") {
            const grad = ctx.createLinearGradient(0, 0, 0, H);
            grad.addColorStop(0, "#1e1b4b");
            grad.addColorStop(0.45, "#c026d3");
            grad.addColorStop(0.75, "#f97316");
            grad.addColorStop(1, "#fde047");
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, W, H);

            ctx.fillStyle = "rgba(254, 240, 138, 0.92)";
            ctx.beginPath();
            ctx.arc(W * 0.68, H * 0.42, H * 0.14, 0, Math.PI * 2);
            ctx.fill();

            const layers = [
                { color: "#4c1d95", yBase: 0.55, amp: 0.15, seed: 1.2 },
                { color: "#311042", yBase: 0.68, amp: 0.12, seed: 2.7 },
                { color: "#0f172a", yBase: 0.82, amp: 0.08, seed: 4.5 }
            ];
            layers.forEach(layer => {
                ctx.fillStyle = layer.color;
                ctx.beginPath();
                ctx.moveTo(0, H);
                for (let x = 0; x <= W; x += 20) {
                    const y = H * layer.yBase - Math.sin(x * 0.005 + layer.seed) * H * layer.amp - Math.cos(x * 0.013 - layer.seed) * H * (layer.amp * 0.5);
                    ctx.lineTo(x, y);
                }
                ctx.lineTo(W, H);
                ctx.closePath();
                ctx.fill();
            });
        } else if (spec.theme === "city") {
            const grad = ctx.createLinearGradient(0, 0, 0, H);
            grad.addColorStop(0, "#020617");
            grad.addColorStop(0.6, "#0f172a");
            grad.addColorStop(1, "#1e1b4b");
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, W, H);

            const radial = ctx.createRadialGradient(W * 0.5, H * 0.65, 20, W * 0.5, H * 0.65, W * 0.7);
            radial.addColorStop(0, "rgba(56, 189, 248, 0.35)");
            radial.addColorStop(0.5, "rgba(236, 72, 153, 0.2)");
            radial.addColorStop(1, "transparent");
            ctx.fillStyle = radial;
            ctx.fillRect(0, 0, W, H);

            const blds = [
                [0.05, 0.45, 0.14], [0.17, 0.30, 0.16], [0.31, 0.22, 0.18],
                [0.47, 0.35, 0.15], [0.60, 0.18, 0.17], [0.75, 0.38, 0.15], [0.88, 0.48, 0.12]
            ];
            blds.forEach(([bx, by, bw], i) => {
                const x = bx * W, y = by * H, w = bw * W, h = H - y;
                ctx.fillStyle = i % 2 === 0 ? "#0f172a" : "#1e293b";
                ctx.fillRect(x, y, w, h);
                for (let wy = y + 18; wy < H - 40; wy += 24) {
                    for (let wx = x + 12; wx < x + w - 16; wx += 18) {
                        if (((wx * 13 + wy * 7) % 5) !== 0) {
                            ctx.fillStyle = ((wx + wy) % 3 === 0) ? "#38bdf8" : "#f472b6";
                            ctx.fillRect(wx, wy, 8, 12);
                        }
                    }
                }
            });
        } else if (spec.theme === "ocean") {
            const sky = ctx.createLinearGradient(0, 0, 0, H * 0.55);
            sky.addColorStop(0, "#0284c7");
            sky.addColorStop(1, "#bae6fd");
            ctx.fillStyle = sky;
            ctx.fillRect(0, 0, W, H * 0.55);

            const sea = ctx.createLinearGradient(0, H * 0.5, 0, H);
            sea.addColorStop(0, "#0369a1");
            sea.addColorStop(0.5, "#0d9488");
            sea.addColorStop(1, "#f59e0b");
            ctx.fillStyle = sea;
            ctx.fillRect(0, H * 0.5, W, H * 0.5);

            for (let i = 0; i < 6; i++) {
                ctx.strokeStyle = `rgba(255,255,255,${0.35 + i * 0.1})`;
                ctx.lineWidth = 4 + i * 2;
                ctx.beginPath();
                const baseY = H * (0.56 + i * 0.07);
                for (let x = 0; x <= W; x += 15) {
                    const y = baseY + Math.sin(x * 0.012 + i) * 14;
                    if (x === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.stroke();
            }
        } else if (spec.theme === "botanical") {
            const bg = ctx.createLinearGradient(0, 0, W, H);
            bg.addColorStop(0, "#064e3b");
            bg.addColorStop(1, "#022c22");
            ctx.fillStyle = bg;
            ctx.fillRect(0, 0, W, H);

            const leaves = [
                { x: W * 0.3, y: H * 0.35, r: 220, c: "#059669" },
                { x: W * 0.72, y: H * 0.32, r: 200, c: "#10b981" },
                { x: W * 0.5, y: H * 0.65, r: 250, c: "#34d399" }
            ];
            leaves.forEach(lf => {
                ctx.fillStyle = lf.c;
                ctx.beginPath();
                ctx.ellipse(lf.x, lf.y, lf.r, lf.r * 0.72, -0.4, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = "#064e3b";
                ctx.lineWidth = 6;
                ctx.beginPath();
                ctx.moveTo(lf.x - lf.r * 0.6, lf.y + lf.r * 0.3);
                ctx.lineTo(lf.x + lf.r * 0.6, lf.y - lf.r * 0.3);
                ctx.stroke();
            });
        } else if (spec.theme === "desert") {
            const sky = ctx.createLinearGradient(0, 0, 0, H);
            sky.addColorStop(0, "#fbbf24");
            sky.addColorStop(0.5, "#f59e0b");
            sky.addColorStop(1, "#b45309");
            ctx.fillStyle = sky;
            ctx.fillRect(0, 0, W, H);

            ctx.fillStyle = "#fef3c7";
            ctx.beginPath();
            ctx.arc(W * 0.25, H * 0.26, 75, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = "#d97706";
            ctx.beginPath();
            ctx.moveTo(0, H);
            ctx.quadraticCurveTo(W * 0.35, H * 0.38, W, H * 0.68);
            ctx.lineTo(W, H);
            ctx.fill();

            ctx.fillStyle = "#92400e";
            ctx.beginPath();
            ctx.moveTo(0, H);
            ctx.quadraticCurveTo(W * 0.65, H * 0.48, W, H * 0.55);
            ctx.lineTo(W, H);
            ctx.fill();
        } else if (spec.theme === "lighthouse") {
            const sky = ctx.createLinearGradient(0, 0, 0, H);
            sky.addColorStop(0, "#1e3a8a");
            sky.addColorStop(0.6, "#60a5fa");
            sky.addColorStop(1, "#e0f2fe");
            ctx.fillStyle = sky;
            ctx.fillRect(0, 0, W, H);

            ctx.fillStyle = "rgba(254, 249, 195, 0.28)";
            ctx.beginPath();
            ctx.moveTo(W * 0.5, H * 0.3);
            ctx.lineTo(0, H * 0.12);
            ctx.lineTo(0, H * 0.45);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = "#f8fafc";
            ctx.beginPath();
            ctx.moveTo(W * 0.44, H * 0.78);
            ctx.lineTo(W * 0.47, H * 0.28);
            ctx.lineTo(W * 0.53, H * 0.28);
            ctx.lineTo(W * 0.56, H * 0.78);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = "#dc2626";
            ctx.fillRect(W * 0.455, H * 0.42, W * 0.09, H * 0.1);
            ctx.fillRect(W * 0.448, H * 0.60, W * 0.104, H * 0.1);
            ctx.fillRect(W * 0.46, H * 0.23, W * 0.08, H * 0.05);

            ctx.fillStyle = "#334155";
            ctx.beginPath();
            ctx.arc(W * 0.5, H * 0.95, W * 0.38, Math.PI, 0);
            ctx.fill();
        } else if (spec.theme === "forest") {
            const bg = ctx.createLinearGradient(0, 0, 0, H);
            bg.addColorStop(0, "#7c2d12");
            bg.addColorStop(0.6, "#ea580c");
            bg.addColorStop(1, "#facc15");
            ctx.fillStyle = bg;
            ctx.fillRect(0, 0, W, H);

            for (let i = 0; i < 9; i++) {
                const tx = (i + 0.5) * (W / 9) + Math.sin(i * 3) * 25;
                const tw = 24 + (i % 3) * 12;
                ctx.fillStyle = "#f8fafc";
                ctx.fillRect(tx, 0, tw, H);
                ctx.fillStyle = "#1e293b";
                for (let y = 40; y < H; y += 75) {
                    ctx.fillRect(tx, y + (i * 17) % 30, tw * 0.65, 8);
                }
            }
        } else {
            const bg = ctx.createLinearGradient(0, 0, W, H);
            bg.addColorStop(0, "#0f172a");
            bg.addColorStop(1, "#334155");
            ctx.fillStyle = bg;
            ctx.fillRect(0, 0, W, H);

            const colors = ["#38bdf8", "#818cf8", "#f43f5e", "#fbbf24", "#e2e8f0"];
            for (let i = 0; i < 7; i++) {
                ctx.fillStyle = colors[i % colors.length];
                ctx.beginPath();
                ctx.moveTo(W * (0.1 + i * 0.12), H);
                ctx.lineTo(W * (0.28 + i * 0.1), H * (0.15 + (i % 3) * 0.14));
                ctx.lineTo(W * (0.48 + i * 0.1), H);
                ctx.closePath();
                ctx.fill();
            }
        }

        const vig = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75);
        vig.addColorStop(0, "transparent");
        vig.addColorStop(1, "rgba(0,0,0,0.22)");
        ctx.fillStyle = vig;
        ctx.fillRect(0, 0, W, H);

        return new Photo(spec.name, W, H, 0, c, false);
    });
}

// Global window assignments
window.createDemoPhotoList = createDemoPhotoList;
window.loadBingWallpapers = loadBingWallpapers;
window.loadHelioDemo = loadHelioDemo;
window.loadWikimediaDemo = loadWikimediaDemo;
window.createChapterSlide = createChapterSlide;
window.openDemoPickerModal = openDemoPickerModal;
