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

// Cleans Wikimedia filenames into pure subject titles (removes photographers, camera codes, dates)
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
        // Remove photographer and attribution phrases
        .replace(/\b(photo(graph)?|taken|captured)?\s*(by|courtesy of)\s+[^,;.\n]+/gi, "")
        .replace(/\bby:\s*[^,;.\n]+/gi, "")
        // Remove camera model prefixes
        .replace(/\b(DSC|IMG|PANO|DJI|PIC)[\d\s_-]+\b/gi, "")
        // Remove dates (YYYY-MM-DD or YYYY)
        .replace(/\b\d{4}[-_/]\d{2}[-_/]\d{2}\b/g, "")
        .replace(/\b\d{4}\b/g, "")
        // Remove modification tags
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
// CHAPTER DIVIDER / GRADIENT SLIDE GENERATOR
// ======================================================================
function createChapterSlide(titleText, colorHex, isGradient = true, titlePos = "CC", isTitle = true) {
    const cvs = document.createElement("canvas");
    cvs.width = 1920;
    cvs.height = 1080;
    const ctx = cvs.getContext("2d");

    if (isGradient) {
        const grad = ctx.createLinearGradient(0, 0, 1920, 1080);
        grad.addColorStop(0, colorHex);
        grad.addColorStop(1, "#020617");
        ctx.fillStyle = grad;
    } else {
        ctx.fillStyle = colorHex;
    }
    ctx.fillRect(0, 0, 1920, 1080);

    const ItemClass = typeof MediaItem !== "undefined" ? MediaItem : window.MediaItem;
    const item = new ItemClass(titleText ? `${titleText}.png` : "Chapter Divider.png", 1920, 1080, cvs, false, null);

    item.isZoom = false;
    item.resetToFullExtent();

    const cleanTitle = (titleText || "").trim();
    item.title = cleanTitle || "Chapter Divider";
    // Sets isTitle to false for Helio dividers while preserving the slide's name
    item.isTitle = isTitle && Boolean(cleanTitle);
    item.titlePos = titlePos;

    item.moveDuration = 0.1;
    item.generateThumbnail();
    return item;
}

function createGradientSlide(name, colorHex, titlePos = "CC") {
    // Passes isTitle = false for all 5 Helio dividers
    return createChapterSlide(name, colorHex, true, titlePos, false);
}


// ======================================================================
// SILENT URL ASSET LOADER (Timeout Protected & Taint-Proof)
// ======================================================================
function loadMediaFromUrl(url, title = "", titlePos = "LL", isTitle = true) {
    return new Promise((resolve) => {
        let settled = false;
        const img = new Image();
        img.crossOrigin = "anonymous";

        // 7-second hard safety timeout per image: guarantees Promise.all never deadlocks
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
                const w = img.naturalWidth || img.width || 1920;
                const h = img.naturalHeight || img.height || 1080;
                const filename = title ? `${title}.jpg` : decodeURIComponent(url.split("/").pop());
                const ItemClass = typeof MediaItem !== "undefined" ? MediaItem : window.MediaItem;
                const item = new ItemClass(filename, w, h, img, false, null);

                if (title) item.title = title;
                item.isTitle = isTitle;
                item.titlePos = titlePos;

                try {
                    item.generateThumbnail();
                } catch (_) {
                    item.thumbUrl = url;
                }

                resolve(item);
            } catch (err) {
                console.warn("MediaItem decode error:", err);
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

// ======================================================================
// DEMO 1: DAILY BING & NATURE WALLPAPERS (Scenic Titles Only)
// ======================================================================
async function loadBingWallpapers(studioApp, count = 8, clearTimeline = true) {
    const progress = new DemoProgressTracker("Downloading Wallpapers...", "Connecting to landscape photography feed...");

    const scenicTitles = [
        "Alpine Vista", "Pacific Coastline", "Misty Forest", "Desert Sunset",
        "Canyon Overlook", "Emerald Valley", "Glacial River", "Autumn Highlands",
        "Golden Hour Dunes", "Coastal Archipelago", "Granite Peaks", "Arctic Horizon",
        "Cascading Falls", "Lakeside Reflection", "Sunlit Meadow", "Mountain Pass",
        "Tranquil Cove", "Highland Ridge", "Pine Ridge", "Ocean Bluff"
    ];
    const shuffledTitles = scenicTitles.sort(() => 0.5 - Math.random());

    try {
        const randomPage = Math.floor(Math.random() * 30) + 1;
        const res = await fetch(`https://picsum.photos/v2/list?page=${randomPage}&limit=${Math.max(count + 4, 16)}`);
        if (!res.ok) throw new Error("Metadata catalog request failed");

        const items = await res.json();
        const landscapes = items
            .filter(item => (item.width || 0) >= (item.height || 0))
            .sort(() => 0.5 - Math.random())
            .slice(0, count);

        if (!landscapes.length) throw new Error("No qualifying landscape photos found");

        let loadedCount = 0;
        const tasks = landscapes.map((photo, idx) => {
            const targetUrl = `https://picsum.photos/id/${photo.id}/1920/1080`;
            const title = shuffledTitles[idx % shuffledTitles.length];

            return loadMediaFromUrl(targetUrl, title, "LL", true).then(item => {
                loadedCount++;
                progress.setTarget(Math.round((loadedCount / landscapes.length) * 90));
                return item;
            });
        });

        const results = await Promise.all(tasks);
        const loadedItems = results.filter(Boolean);

        if (loadedItems.length > 0) {
            if (clearTimeline) studioApp.clearTimeline(false);
            studioApp.mediaItems = clearTimeline ? loadedItems : [...studioApp.mediaItems, ...loadedItems];
            studioApp.selectedIndices = [0];
            studioApp.renderFilmstrip();
            studioApp.renderMainStage();
            if (typeof showToast === "function") showToast(`Loaded ${loadedItems.length} wallpapers`, "success");
        } else {
            throw new Error("Zero photo assets loaded");
        }
    } catch (err) {
        console.warn("Picsum catalog failed, using direct CDN feed:", err);
        const timestamp = Date.now();
        const fallbackTasks = [];

        for (let i = 0; i < count; i++) {
            const url = `https://picsum.photos/1920/1080?random=${timestamp + i}`;
            const title = shuffledTitles[i % shuffledTitles.length];
            fallbackTasks.push(
                loadMediaFromUrl(url, title, "LL", true).then(res => {
                    progress.setTarget(Math.round(((i + 1) / count) * 90));
                    return res;
                })
            );
        }

        const results = await Promise.all(fallbackTasks);
        const loadedItems = results.filter(Boolean);

        if (loadedItems.length > 0) {
            if (clearTimeline) studioApp.clearTimeline(false);
            studioApp.mediaItems = clearTimeline ? loadedItems : [...studioApp.mediaItems, ...loadedItems];
            studioApp.selectedIndices = [0];
            studioApp.renderFilmstrip();
            studioApp.renderMainStage();
            if (typeof showToast === "function") showToast(`Loaded ${loadedItems.length} wallpapers`, "success");
        }
    } finally {
        progress.finish();
    }
}

// ======================================================================
// DEMO 2: HELIO SOLAR SYSTEM (Remote Infographics CDN)
// ======================================================================
async function loadHelioDemo(studioApp, clearTimeline = true) {
    const progress = new DemoProgressTracker("Loading Helio Solar System...", "Generating astronomical assets & infographics...");
    const HELIO_BASE = "https://blendpy.github.io/vibe-web-dev/helio/infographics";

    try {
        const rawTasks = [];
        rawTasks.push(Promise.resolve(createGradientSlide("Crimson Nebula", "#dc2626", "CC")));

        const planetNames = ["sun", "mercury", "venus", "earth", "mars", "jupiter", "saturn", "uranus", "neptune"];
        for (const name of planetNames) {
            rawTasks.push(loadMediaFromUrl(`${HELIO_BASE}/planets/${name}.jpg`, formatTitle(name), "LL", true));
        }

        rawTasks.push(Promise.resolve(createGradientSlide("Azure Horizon", "#2563eb", "CC")));

        const moonNames = [
            "moons", "earth moon", "jupiter callisto", "jupiter europa", "jupiter io",
            "saturn iapetus", "saturn enceladus", "neptune triton", "neptune proteus"
        ];
        for (const name of moonNames) {
            rawTasks.push(loadMediaFromUrl(`${HELIO_BASE}/moons/${name}.jpg`, formatTitle(name), "LL", true));
        }

        rawTasks.push(Promise.resolve(createGradientSlide("Emerald Canopy", "#059669", "CC")));
        rawTasks.push(loadMediaFromUrl(`${HELIO_BASE}/dwarfs/dwarfs.jpg`, "Dwarfs", "CC", true));

        rawTasks.push(Promise.resolve(createGradientSlide("Amber Dunes", "#d97706", "CC")));
        rawTasks.push(loadMediaFromUrl(`${HELIO_BASE}/comets/comets.jpg`, "Comets", "CC", true));

        rawTasks.push(Promise.resolve(createGradientSlide("Purple Aurora", "#7c3aed", "CC")));

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
            if (clearTimeline) studioApp.clearTimeline(false);
            studioApp.mediaItems = clearTimeline ? loadedItems : [...studioApp.mediaItems, ...loadedItems];
            studioApp.selectedIndices = [0];
            studioApp.renderFilmstrip();
            studioApp.renderMainStage();
            if (typeof showToast === "function") showToast(`Loaded ${loadedItems.length} Helio slides`, "success");
        }
    } finally {
        progress.finish();
    }
}

// ======================================================================
// DEMO 3: WIKIMEDIA COMMONS (Subject Names Only, Lock-Up Proof)
// ======================================================================
async function loadWikimediaDemo(studioApp, count = 8, clearTimeline = true) {
    const progress = new DemoProgressTracker("Loading Wikimedia Works...", "Fetching landscape art & photography...");

    const topics = ["mountain landscape", "national park", "scenic valley", "castle landscape", "glacier national park", "coastline cliff"];
    const topic = topics[Math.floor(Math.random() * topics.length)];

    try {
        // Direct search across File namespace (namespace 6)
        const apiUrl = `https://commons.wikimedia.org/w/api.php?action=query` +
            `&generator=search` +
            `&gsrsearch=${encodeURIComponent(topic)}` +
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

            return loadMediaFromUrl(targetUrl, cleanTitle, "LL", true).then(item => {
                loadedCount++;
                progress.setTarget(Math.round((loadedCount / selected.length) * 90));
                return item;
            });
        });

        const results = await Promise.all(tasks);
        const loadedItems = results.filter(Boolean);

        if (loadedItems.length > 0) {
            // Only clear existing timeline after downloads succeed
            if (clearTimeline) studioApp.clearTimeline(false);
            studioApp.mediaItems = clearTimeline ? loadedItems : [...studioApp.mediaItems, ...loadedItems];
            studioApp.selectedIndices = [0];
            studioApp.renderFilmstrip();
            studioApp.renderMainStage();
            if (typeof showToast === "function") showToast(`Loaded ${loadedItems.length} Wikimedia works`, "success");
        } else {
            throw new Error("Unable to decode Wikimedia thumbnails");
        }
    } catch (err) {
        console.error("Wikimedia loader error:", err);
        if (typeof showToast === "function") showToast("Could not load Wikimedia images. Please try again.", "error");
    } finally {
        // ALWAYS executed: guarantees the progress modal dismisses and never locks the UI
        progress.finish();
    }
}

// ======================================================================
// DEMO PICKER MODAL CONTROLLER
// ======================================================================
const DEMO_TAB_STORAGE_KEY = "videostudio_active_demo_tab";
let currentDemoCategory = localStorage.getItem(DEMO_TAB_STORAGE_KEY) || "bing";
let selectedChapterColor = "#dc2626";

function openDemoPickerModal(studioApp) {
    const modal = document.getElementById("demoPickerModal");
    if (!modal) {
        loadBingWallpapers(studioApp, 8, true);
        return;
    }

    modal.classList.remove("hidden");

    const tabs = {
        bing: document.getElementById("tabDemoBing"),
        helio: document.getElementById("tabDemoHelio"),
        wiki: document.getElementById("tabDemoWiki"),
        chapter: document.getElementById("tabDemoChapter")
    };

    const panels = {
        bing: document.getElementById("panelDemoBing"),
        helio: document.getElementById("panelDemoHelio"),
        wiki: document.getElementById("panelDemoWiki"),
        chapter: document.getElementById("panelDemoChapter")
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

        const activeClass = "px-4 py-2 text-xs sm:text-sm font-semibold rounded-t-lg bg-blue-600 text-white shadow whitespace-nowrap";
        const inactiveClass = "px-4 py-2 text-xs sm:text-sm font-medium rounded-t-lg bg-slate-800 hover:bg-slate-700 text-slate-300 whitespace-nowrap";

        Object.keys(tabs).forEach(k => {
            if (tabs[k]) tabs[k].className = (k === tabKey) ? activeClass : inactiveClass;
            if (panels[k]) panels[k].classList.toggle("hidden", k !== tabKey);
        });

        if (lblConfirm) {
            if (tabKey === "bing") lblConfirm.textContent = "Load Wallpapers";
            else if (tabKey === "helio") lblConfirm.textContent = "Load Helio Slides";
            else if (tabKey === "wiki") lblConfirm.textContent = "Load Wikimedia Works";
            else if (tabKey === "chapter") lblConfirm.textContent = "Add Chapter Divider";
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
            box.className = "swatch-box w-9 h-9 rounded-lg border-2 border-slate-700 hover:scale-105 transition-all shadow";
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
                b.className = "swatch-box w-9 h-9 rounded-lg border-2 border-white ring-2 ring-blue-500 scale-110 transition-all shadow-lg";
            } else {
                b.className = "swatch-box w-9 h-9 rounded-lg border-2 border-slate-700 hover:scale-105 transition-all shadow";
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

    switchTab(currentDemoCategory);
    updateSwatchSelection();

    const closeModal = () => modal.classList.add("hidden");
    if (btnClose) btnClose.onclick = closeModal;
    if (btnCancel) btnCancel.onclick = closeModal;

    if (btnConfirm) {
        btnConfirm.onclick = async () => {
            const active = modal.dataset.activeTab || currentDemoCategory;
            const clear = document.getElementById("chkUniversalClearTimeline")?.checked ?? true;

            closeModal();

            if (active === "bing") {
                const count = parseInt(document.getElementById("selBingCount")?.value || "8", 10);
                await loadBingWallpapers(studioApp, count, clear);
            } else if (active === "helio") {
                await loadHelioDemo(studioApp, clear);
            } else if (active === "wiki") {
                const count = parseInt(document.getElementById("selWikiCount")?.value || "8", 10);
                await loadWikimediaDemo(studioApp, count, clear);
            } else if (active === "chapter") {
                if (clear) studioApp.clearTimeline(false);
                const titleText = document.getElementById("txtChapterTitle")?.value || "";
                const isGrad = document.getElementById("chkChapterGradient")?.checked ?? true;
                const pos = document.getElementById("selChapterTitlePos")?.value || "CC";

                const slide = createChapterSlide(titleText, selectedChapterColor, isGrad, pos);
                studioApp.mediaItems.push(slide);
                studioApp.selectedIndices = [studioApp.mediaItems.length - 1];
                studioApp.renderFilmstrip();
                studioApp.renderMainStage();
                studioApp.ensureVisible(studioApp.mediaItems.length - 1);
                if (typeof showToast === "function") showToast("Added Chapter Divider", "success");
            }
        };
    }
}

// Global window assignments
window.loadMediaFromUrl = loadMediaFromUrl;
window.createChapterSlide = createChapterSlide;
window.createGradientSlide = createGradientSlide;
window.loadBingWallpapers = loadBingWallpapers;
window.loadHelioDemo = loadHelioDemo;
window.loadWikimediaDemo = loadWikimediaDemo;
window.loadDemoMedia = (app) => openDemoPickerModal(app || window.videoStudioApp);
window.openDemoPickerModal = openDemoPickerModal;
