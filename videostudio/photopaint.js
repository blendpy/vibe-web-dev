"use strict";

// ======================================================================
// PHOTO PAINT STUDIO (Port of Paint02.py, Paint_Shape.py, Paint_Helper.py, Paint_Emoji.py)
// ======================================================================

const PAINT_HANDLE_SIZE = 10;

// Lazy-Loader for PolyBoolJS (Loaded on demand so startup is never slowed down)
let polyBoolLoadPromise = null;
function ensurePolyBoolLoaded() {
    if (window.PolyBool) return Promise.resolve(window.PolyBool);
    if (polyBoolLoadPromise) return polyBoolLoadPromise;

    polyBoolLoadPromise = new Promise((resolve) => {
        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/npm/polybooljs@1.2.2/dist/polybool.min.js";
        script.async = true;
        script.onload = () => resolve(window.PolyBool || null);
        script.onerror = () => {
            console.warn("Could not load polybooljs from CDN; boolean ops unavailable.");
            polyBoolLoadPromise = null;
            resolve(null);
        };
        document.head.appendChild(script);
    });
    return polyBoolLoadPromise;
}


// ======================================================================
// SHARED RENDERER: COMPOSITES PAINT ACTIONS ONTO ANY SLIDE CANVAS
// ======================================================================
function drawSinglePaintAction(ctx, action) {
    if (!action) return;
    const color = action.color || "#0096fa";
    const fillAlpha = (action.fillOpacity ?? 47) / 100.0;
    const thickness = action.thickness ?? 2;
    const params = action.params || {};

    if (action.type === "line") {
        const pts = action.points || [];
        const showArrow = !!params["Show Arrow"];
        if (action.fill && !showArrow && pts.length >= 3) {
            ctx.save();
            ctx.beginPath();
            const cornerPct = (params["Corner Radius (%)"] ?? 0) / 100.0;
            addRoundedPolygonSubpath(ctx, pts, cornerPct, 500);
            ctx.fillStyle = hexToRgba(color, fillAlpha);
            ctx.fill("evenodd");
            ctx.strokeStyle = color;
            ctx.lineWidth = thickness;
            ctx.stroke();
            ctx.restore();
        } else {
            drawCanvasLine(ctx, pts, params, color, thickness);
        }
    } else if (action.type === "shape") {
        const [cx, cy] = action.center || [0, 0];
        const R = action.radius || 50;
        const angle = action.angle || 0;

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angle);

        if (action.shape === "Emoji") {
            const emojiChar = params["Emoji"] || "🙂";
            const isGray = !!params["Grayscale"];
            drawEmojiOnContext(ctx, emojiChar, Math.max(14, R * 1.4), isGray);
        } else {
            traceShapePathOnContext(ctx, action.shape, params, R);
            ctx.fillStyle = hexToRgba(color, fillAlpha);
            ctx.fill("evenodd");
            ctx.strokeStyle = color;
            ctx.lineWidth = thickness;
            ctx.lineJoin = "round";
            ctx.stroke();
        }
        ctx.restore();
    } else if (action.type === "polygon_shape") {
        ctx.save();
        ctx.beginPath();
        const cornerPct = (params["Corner Radius (%)"] ?? 0) / 100.0;
        for (const polyData of (action.polygons || [])) {
            const [extPts, intPts] = Array.isArray(polyData[0]) && Array.isArray(polyData[0][0])
                ? polyData
                : [polyData, []];
            if (extPts && extPts.length >= 3) {
                addRoundedPolygonSubpath(ctx, extPts, cornerPct, 500);
            }
            if (intPts) {
                for (const ring of intPts) {
                    if (ring && ring.length >= 3) {
                        addRoundedPolygonSubpath(ctx, ring, cornerPct, 500);
                    }
                }
            }
        }
        ctx.fillStyle = hexToRgba(color, fillAlpha);
        ctx.fill("evenodd");
        ctx.strokeStyle = color;
        ctx.lineWidth = thickness;
        ctx.lineJoin = "round";
        ctx.stroke();
        ctx.restore();
    } else if (action.type === "text") {
        if (action.isEditing) return;
        const textStr = action.text || "";
        if (!textStr.trim()) return;

        const [cx, cy] = action.center || [0, 0];
        const angle = action.angle || 0;
        const fontSize = Math.max(8, Math.round(action.fontSize || params["Text Size"] || 32));
        const fontFace = action.fontFace || "Inter";
        const isBold = !!(action.bold ?? params["Bold"]);
        const isItalic = !!(action.italic ?? params["Italic"]);
        const hasOutline = !!(action.outline ?? params["Text Outline"]);
        const hasBgPill = !!(action.bgPill ?? params["Background Pill"]);
        const bgOpacity = (action.bgOpacity ?? params["Bg Opacity (%)"] ?? 85) / 100.0;

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angle);
        ctx.font = `${isItalic ? "italic " : ""}${isBold ? "bold " : ""}${fontSize}px "${fontFace}", sans-serif`;

        const lines = textStr.split("\n");
        const lineHeight = fontSize * 1.22;
        let maxW = 20;
        lines.forEach((l) => {
            const m = ctx.measureText(l || " ");
            if (m.width > maxW) maxW = m.width;
        });
        const totalH = lines.length * lineHeight;
        const padX = 12, padY = 8;

        if (hasBgPill) {
            const [r, g, b] = hexToRgbArray(color);
            const lum = 0.299 * r + 0.587 * g + 0.114 * b;
            ctx.fillStyle = lum < 128 ? `rgba(248, 250, 252, ${bgOpacity})` : `rgba(15, 23, 42, ${bgOpacity})`;
            ctx.beginPath();
            // Reduce height by 4 pixels (cut from bottom, top y remains -totalH / 2 - padY)
            ctx.roundRect(-maxW / 2 - padX, -totalH / 2 - padY, maxW + padX * 2, totalH + padY * 2 - 11, 8);
            ctx.fill();
        }

        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        const startY = -totalH / 2;

        lines.forEach((line, i) => {
            const ly = startY + i * lineHeight;
            if (hasOutline) {
                const [r, g, b] = hexToRgbArray(color);
                const lum = 0.299 * r + 0.587 * g + 0.114 * b;
                ctx.strokeStyle = lum < 128 ? "#ffffff" : "#000000";
                ctx.lineWidth = Math.max(2, fontSize * 0.1);
                ctx.lineJoin = "round";
                ctx.strokeText(line, 0, ly);
            }
            ctx.fillStyle = color;
            ctx.fillText(line, 0, ly);
        });

        ctx.restore();
    }
}

function computeFloodFillLayer(baseCanvas, actions, fillIdx) {
    const fillAction = actions[fillIdx];
    const w = baseCanvas.width;
    const h = baseCanvas.height;
    if (w <= 0 || h <= 0) return null;

    // 1. Render background + all preceding actions onto a 1:1 work canvas
    const workCvs = document.createElement("canvas");
    workCvs.width = w;
    workCvs.height = h;
    const wCtx = workCvs.getContext("2d");
    wCtx.drawImage(baseCanvas, 0, 0);

    let startIndex = 0;
    for (let i = fillIdx - 1; i >= 0; i--) {
        if (actions[i].type === "clear") {
            startIndex = i + 1;
            break;
        }
    }

    for (let i = startIndex; i < fillIdx; i++) {
        const act = actions[i];
        if (act.type === "fill") {
            if (!act.cachedCanvas) act.cachedCanvas = computeFloodFillLayer(baseCanvas, actions, i);
            if (act.cachedCanvas) wCtx.drawImage(act.cachedCanvas, 0, 0);
        } else {
            drawSinglePaintAction(wCtx, act);
        }
    }

    const sx = Math.round(fillAction.pos[0]);
    const sy = Math.round(fillAction.pos[1]);
    if (sx < 0 || sx >= w || sy < 0 || sy >= h) return null;

    const srcData = wCtx.getImageData(0, 0, w, h).data;
    const startOffset = (sy * w + sx) * 4;
    const sr = srcData[startOffset];
    const sg = srcData[startOffset + 1];
    const sb = srcData[startOffset + 2];

    const tolerance = fillAction.params?.["Fill Tolerance"] ?? 18;
    const diff = Math.round((tolerance / 100.0) * 255);

    const visited = new Uint8Array(w * h);
    const queue = new Int32Array(w * h);
    let head = 0, tail = 0;

    const startIdx = sy * w + sx;
    visited[startIdx] = 1;
    queue[tail++] = startIdx;

    while (head < tail) {
        const curr = queue[head++];
        const cx = curr % w;
        const cy = (curr - cx) / w;

        // 4-connected neighbors
        if (cx > 0) {
            const n = curr - 1;
            if (!visited[n]) {
                const p = n * 4;
                if (Math.abs(srcData[p] - sr) <= diff && Math.abs(srcData[p + 1] - sg) <= diff && Math.abs(srcData[p + 2] - sb) <= diff) {
                    visited[n] = 1;
                    queue[tail++] = n;
                }
            }
        }
        if (cx < w - 1) {
            const n = curr + 1;
            if (!visited[n]) {
                const p = n * 4;
                if (Math.abs(srcData[p] - sr) <= diff && Math.abs(srcData[p + 1] - sg) <= diff && Math.abs(srcData[p + 2] - sb) <= diff) {
                    visited[n] = 1;
                    queue[tail++] = n;
                }
            }
        }
        if (cy > 0) {
            const n = curr - w;
            if (!visited[n]) {
                const p = n * 4;
                if (Math.abs(srcData[p] - sr) <= diff && Math.abs(srcData[p + 1] - sg) <= diff && Math.abs(srcData[p + 2] - sb) <= diff) {
                    visited[n] = 1;
                    queue[tail++] = n;
                }
            }
        }
        if (cy < h - 1) {
            const n = curr + w;
            if (!visited[n]) {
                const p = n * 4;
                if (Math.abs(srcData[p] - sr) <= diff && Math.abs(srcData[p + 1] - sg) <= diff && Math.abs(srcData[p + 2] - sb) <= diff) {
                    visited[n] = 1;
                    queue[tail++] = n;
                }
            }
        }
    }

    const outCvs = document.createElement("canvas");
    outCvs.width = w;
    outCvs.height = h;
    const outCtx = outCvs.getContext("2d");
    const outImg = outCtx.createImageData(w, h);
    const outData = outImg.data;

    const [fr, fg, fb] = hexToRgbArray(fillAction.color || "#0096fa");
    const fillType = fillAction.params?.["Fill Type"] || "Solid Color";

    for (let i = 0; i < tail; i++) {
        const idx = queue[i];
        const x = idx % w;
        const y = (idx - x) / w;
        const p = idx * 4;

        if (fillType === "Solid Color") {
            outData[p] = fr;
            outData[p + 1] = fg;
            outData[p + 2] = fb;
            outData[p + 3] = 255;
        } else if (fillType === "Transparent") {
            outData[p] = Math.round(srcData[p] * 0.5 + fr * 0.5);
            outData[p + 1] = Math.round(srcData[p + 1] * 0.5 + fg * 0.5);
            outData[p + 2] = Math.round(srcData[p + 2] * 0.5 + fb * 0.5);
            outData[p + 3] = 255;
        } else {
            let isFg = false;
            if (fillType === "Checkerboard") {
                isFg = (Math.floor(x / 10) + Math.floor(y / 10)) % 2 === 0;
            } else if (fillType === "Diagonal Stripes") {
                isFg = (x + y) % 15 < 7;
            } else if (fillType === "Polka Dots") {
                const cxP = (x % 20) - 10;
                const cyP = (y % 20) - 10;
                isFg = (cxP * cxP + cyP * cyP) <= 36;
            }
            outData[p] = isFg ? fr : 255;
            outData[p + 1] = isFg ? fg : 255;
            outData[p + 2] = isFg ? fb : 255;
            outData[p + 3] = 255;
        }
    }

    outCtx.putImageData(outImg, 0, 0);
    return outCvs;
}

function renderPaintActionsToCanvas(sourceEl, mediaItem) {
    if (!sourceEl) return null;
    const actions = mediaItem?.paintActions;
    if (!actions || !actions.length) return sourceEl;

    const w = sourceEl.naturalWidth || sourceEl.videoWidth || sourceEl.width || mediaItem.w || 1920;
    const h = sourceEl.naturalHeight || sourceEl.videoHeight || sourceEl.height || mediaItem.h || 1080;

    const cvs = document.createElement("canvas");
    cvs.width = w;
    cvs.height = h;
    const ctx = cvs.getContext("2d");
    ctx.drawImage(sourceEl, 0, 0, w, h);

    let startIndex = 0;
    for (let i = actions.length - 1; i >= 0; i--) {
        if (actions[i].type === "clear") {
            startIndex = i + 1;
            break;
        }
    }

    for (let i = startIndex; i < actions.length; i++) {
        const act = actions[i];
        if (act.type === "fill") {
            if (!act.cachedCanvas) {
                act.cachedCanvas = computeFloodFillLayer(cvs, actions, i);
            }
            if (act.cachedCanvas) {
                ctx.drawImage(act.cachedCanvas, 0, 0, w, h);
            }
        } else {
            drawSinglePaintAction(ctx, act);
        }
    }

    return cvs;
}

window.renderPaintActionsToCanvas = renderPaintActionsToCanvas;

// ======================================================================
// MAIN PHOTO PAINT EDITOR CLASS
// ======================================================================
class PhotoPaintEditor {
    constructor(app) {
        this.app = app;
        this.SHAPE_PARAMS = getPaintShapeParamsConfig();

        this.maintype = "Text"; // "Shapes", "Text", "Select"
        this.currentShape = "FontModern";
        this.lastSelectedShape = {
            "Shapes": "Line",
            "Text": "FontModern",
            "Select": "Select"
        };

        this.color = "#0096fa";
        this.thickness = 2;
        this.fillOpacity = 47; // ~120/255 alpha matching Python
        this.polarRotation = false;
        this.polyMode = "normal"; // "normal", "union", "disjoint", "intersect", "symmetric", "erase", "subtract"

        // Saved Parameters per tool
        this.savedParams = {};
        this.initSavedParams();

        // Viewport Transform State
        this.zoomFactor = 1.0;
        this.panX = 0;
        this.panY = 0;
        this.isPanning = false;
        this.lastPanMouse = [0, 0];

        // Canvas Interaction & Selection State
        this.selectedActionIndices = [];
        this.clipboard = [];
        this.pasteCascadeCount = 0;
        this.vertexEditMode = false;
        this.draggingVertexInfo = null;
        this.resizableBox = null;
        this.isResizingShape = false;
        this.isRotatingShape = false;
        this.origActionCopy = null;
        this.origGroupState = null;
        this.isMarqueeSelecting = false;
        this.marqueeAdditive = false;
        this.marqueeBaseSelection = [];
        this.marqueeRectWorld = null;
        this._handledSelectionOnDown = false;

        this.isDrawing = false;
        this.hasDragged = false;
        this.dragStartScreen = [0, 0];
        this.dragStartWorld = [0, 0];
        this.strokePoints = [];
        this.lastStrokePos = null;
        this.currentMouseWorld = [0, 0];
        this.isHoveringCanvas = false;

        // Cached Background Image Canvas for current slide
        this.bgCanvas = null;
        this.origW = 1920;
        this.origH = 1080;

        // Active Floating Rich Text Editor
        this.activeTextIdx = null;
        this.fontPreviewState = null;

        this.initDOM();
        this.buildSidebarUI();
        this.bindCanvasEvents();
    }

    get selectedActionIdx() {
        return this.selectedActionIndices.length > 0
            ? this.selectedActionIndices[this.selectedActionIndices.length - 1]
            : null;
    }

    set selectedActionIdx(val) {
        if (val === null || val === undefined) {
            this.selectedActionIndices = [];
        } else {
            this.selectedActionIndices = [val];
        }
    }

    get item() {
        const primaryIdx = this.app.selectedIndices[this.app.selectedIndices.length - 1];
        return this.app.mediaItems[primaryIdx] || null;
    }

    get actions() {
        const itm = this.item;
        if (!itm) return [];
        if (!itm.paintActions) itm.paintActions = [];
        return itm.paintActions;
    }

    get undoneActions() {
        const itm = this.item;
        if (!itm) return [];
        if (!itm.paintUndoneActions) itm.paintUndoneActions = [];
        return itm.paintUndoneActions;
    }

    initSavedParams() {
        for (const [shapeName, params] of Object.entries(this.SHAPE_PARAMS)) {
            this.savedParams[shapeName] = {};
            for (const p of params) {
                if (p.length === 3) {
                    if ((p[1] === "choice" || p[1] === "font") && Array.isArray(p[2])) {
                        this.savedParams[shapeName][p[0]] = p[2][0];
                    } else {
                        this.savedParams[shapeName][p[0]] = p[2];
                    }
                } else {
                    this.savedParams[shapeName][p[0]] = p[3];
                }
            }
        }
    }

    initDOM() {
        this.stage = document.getElementById("paintStage");
        this.sidebarEl = document.getElementById("paintSidebar");
        this.canvasWrap = document.getElementById("paintCanvasWrap");
        this.canvas = document.getElementById("paintMainCanvas");
        this.ctx = this.canvas ? this.canvas.getContext("2d") : null;
        this.floatingTextWrap = document.getElementById("paintFloatingTextWrap");
        this.floatingTextarea = document.getElementById("paintFloatingTextarea");
        this.emojiModal = document.getElementById("paintEmojiModal");
    }




    // START SAMPLE TEXT
    updateSampleTextPreview() {
        this.updateFontPreviewOverlay();
    }

    updateFontPreviewOverlay() {
        if (this.maintype !== "Text" || !this.currentShape.startsWith("Font")) {
            this.fontPreviewState = null;
            return;
        }
        if (this.selectedActionIdx !== null && this.actions[this.selectedActionIdx]?.type === "text") {
            this.fontPreviewState = null;
            return;
        }
        const params = this.savedParams[this.currentShape] || {};
        const catKey = this.currentShape.replace("Font", "");
        this.fontPreviewState = {
            type: "text",
            text: "Sample Text",
            center: [Math.round(this.origW / 2), Math.round(this.origH / 2)],
            angle: 0,
            color: this.color,
            fontFace: params[catKey] || "Inter",
            fontSize: params["Text Size"] || 32,
            bold: !!params["Bold"],
            italic: !!params["Italic"],
            outline: !!params["Text Outline"],
            bgPill: !!params["Background Pill"],
            bgOpacity: params["Bg Opacity (%)"] ?? 85,
            params: { ...params }
        };
        this.redrawAll();
    }
    // END SAMPLE TEXT

    // ==================================================================
    // SIDEBAR UI CONSTRUCTION
    // ==================================================================
    buildSidebarUI() {
        if (!this.sidebarEl) return;
        this.sidebarEl.innerHTML = "";

        // 1. Top Mode Switcher Buttons: Shapes, Text, Select + Zoom Controls
        const modeRow = document.createElement("div");
        modeRow.className = "flex items-center gap-1 bg-slate-950/90 p-1.5 rounded-xl border border-slate-800 shrink-0";
        this.modeButtons = {};

        [
            { id: "Shapes", icon: "📐", label: "Shapes" },
            { id: "Text",   icon: "🔤", label: "Text" },
            { id: "Select", icon: "↗️", label: "Select" }
        ].forEach((m) => {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.innerHTML = `<span class="text-[13px]">${m.icon}</span> <span class="hidden sm:inline">${m.label}</span>`;
            btn.className = "flex-1 px-1.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition min-w-0";
            btn.addEventListener("click", () => this.setMainMode(m.id));
            this.modeButtons[m.id] = btn;
            modeRow.appendChild(btn);
        });

        const divider = document.createElement("div");
        divider.className = "w-px h-6 bg-slate-700 mx-0.5 shrink-0";
        modeRow.appendChild(divider);

        const btnZoomFit = document.createElement("button");
        btnZoomFit.type = "button";
        btnZoomFit.id = "btnPaintZoomFit";
        btnZoomFit.innerHTML = "🌐";
        btnZoomFit.title = "Zoom to Fit";
        btnZoomFit.className = "p-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs transition shrink-0 flex items-center justify-center";
        modeRow.appendChild(btnZoomFit);

        const btnZoom1to1 = document.createElement("button");
        btnZoom1to1.type = "button";
        btnZoom1to1.id = "btnPaintZoom1to1";
        btnZoom1to1.innerHTML = "🔍";
        btnZoom1to1.title = "Toggle 1:1 / 2:1 / 4:1 Zoom";
        btnZoom1to1.className = "p-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs transition shrink-0 flex items-center justify-center";
        modeRow.appendChild(btnZoom1to1);

        this.sidebarEl.appendChild(modeRow);

        // 2. Section 1: Select Type Grid
        const typeBox = document.createElement("div");
        typeBox.className = "bg-slate-950/70 border border-slate-800 rounded-xl p-2 shrink-0";
        const typeTitle = document.createElement("div");
        typeTitle.className = "text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 px-1";
        typeTitle.textContent = "1. Select Type";
        typeBox.appendChild(typeTitle);

        this.typeGridContainer = document.createElement("div");
        typeBox.appendChild(this.typeGridContainer);
        this.sidebarEl.appendChild(typeBox);

       // 3. Section 2: Dynamic Parameters Box
        const paramsBox = document.createElement("div");
        paramsBox.id = "paintParamsBox"; // ADDED ID
        paramsBox.className = "bg-slate-950/70 border border-slate-800 rounded-xl p-2.5 flex-1 min-h-[120px] overflow-y-auto filmstrip-scroll flex flex-col gap-2 transition-opacity";

        const paramsTitle = document.createElement("div");
        paramsTitle.className = "text-[11px] font-bold text-slate-400 uppercase tracking-wider px-0.5 shrink-0";
        paramsTitle.textContent = "2. Parameters";
        paramsBox.appendChild(paramsTitle);

        this.paramsContentEl = document.createElement("div");
        this.paramsContentEl.className = "flex flex-col gap-2 flex-1";
        paramsBox.appendChild(this.paramsContentEl);
        this.sidebarEl.appendChild(paramsBox);

        // 4. Polygon Boolean Operations Bar (Visible for closed geometric shapes)
        this.polyOpsBox = document.createElement("div");
        this.polyOpsBox.className = "bg-slate-950/70 border border-slate-800 rounded-xl p-2 shrink-0 space-y-1.5";
        this.polyOpsBox.innerHTML = `
            <div class="flex items-center justify-between gap-2">
                <span class="text-[11px] font-bold text-slate-300 shrink-0">Polygon Op:</span>
                <select id="paintPolyOpSelect" class="flex-1 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 font-semibold focus:outline-none">
                    <option value="union">Union (^U)</option>
                    <option value="disjoint">Disjoint (^D)</option>
                    <option value="intersect">Intersect (^I)</option>
                    <option value="symmetric">Symmetric (^S)</option>
                    <option value="erase">Erase (^E)</option>
                    <option value="subtract">Subtract</option>
                </select>
            </div>
            <div class="grid grid-cols-3 gap-1.5">
                <button type="button" id="btnPaintPolyNormal" class="px-2 py-1 rounded text-xs font-bold bg-sky-500 text-slate-950">Normal</button>
                <button type="button" id="btnPaintPolyAuto" class="px-2 py-1 rounded text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">Union</button>
                <button type="button" id="btnPaintPolyApplyNow" class="px-2 py-1 rounded text-xs font-semibold bg-emerald-600/90 hover:bg-emerald-500 text-white" title="Apply operation immediately to selected/overlapping shapes">Apply Now</button>
            </div>
        `;
        this.sidebarEl.appendChild(this.polyOpsBox);

        // 5. Preview & Global Style Box
        const previewBox = document.createElement("div");
        previewBox.className = "bg-slate-950/70 border border-slate-800 rounded-xl p-2 shrink-0 flex items-center gap-2.5";
        previewBox.innerHTML = `
            <div class="flex-1 flex flex-col gap-1.5 min-w-0">
                <div class="flex items-center justify-between gap-1.5">
                    <button type="button" id="btnPaintClear" class="flex-1 p-1.5 rounded bg-slate-800 hover:bg-red-900/60 border border-slate-700 text-xs flex items-center justify-center" title="Clear All Paint on Slide">🗑️</button>
                    <button type="button" id="btnPaintUndo" class="flex-1 p-1.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs flex items-center justify-center" title="Undo (Ctrl+Z)">↩️</button>
                    <button type="button" id="btnPaintRedo" class="flex-1 p-1.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs flex items-center justify-center" title="Redo (Ctrl+Y)">↪️</button>
                </div>

                <div class="flex items-center justify-between gap-1 pt-0.5">
                    <span id="lblPaintColor" class="text-[11px] font-bold text-slate-300">Color:</span>
                    <input type="color" id="inpPaintColor" value="${this.color}" class="w-10 h-6 rounded cursor-pointer bg-transparent border border-slate-700">
                </div>

                <div id="rowPaintStrokeWidth" class="flex flex-col gap-0.5">
                    <div class="flex justify-between text-[10px] text-slate-400 font-semibold">
                        <span>Width:</span>
                        <span id="lblPaintWidthVal" class="text-amber-400 font-bold">${this.thickness}px</span>
                    </div>
                    <input type="range" id="sliderPaintWidth" min="1" max="25" value="${this.thickness}" class="w-full accent-blue-500 cursor-pointer h-1.5">
                </div>

                <div id="rowPaintFillOpacity" class="flex flex-col gap-0.5">
                    <div class="flex justify-between text-[10px] text-slate-400 font-semibold">
                        <span>Fill Alpha:</span>
                        <span id="lblPaintAlphaVal" class="text-amber-400 font-bold">${this.fillOpacity}%</span>
                    </div>
                    <input type="range" id="sliderPaintAlpha" min="0" max="100" value="${this.fillOpacity}" class="w-full accent-blue-500 cursor-pointer h-1.5">
                </div>

                <label id="rowPaintPolar" class="flex items-center gap-1.5 text-[10.5px] font-semibold text-slate-300 cursor-pointer pt-0.5 select-none">
                    <input type="checkbox" id="chkPaintPolar" class="rounded bg-slate-800 border-slate-700 text-blue-600">
                    <span>Polar Rotation</span>
                </label>
            </div>

            <div class="w-[156px] h-[156px] shrink-0 rounded-lg border border-slate-800 bg-[#1c1c20] overflow-hidden flex items-center justify-center shadow-inner relative">
                <canvas id="paintPreviewCanvas" width="156" height="156" class="block w-full h-full"></canvas>
            </div>
        `;
        this.sidebarEl.appendChild(previewBox);

        this.previewCanvas = document.getElementById("paintPreviewCanvas");
        this.previewCtx = this.previewCanvas ? this.previewCanvas.getContext("2d") : null;

        this.bindSidebarControls();
        this.setMainMode("Text", true);
    }

    bindSidebarControls() {
        const polySelect = document.getElementById("paintPolyOpSelect");
        const btnNormal = document.getElementById("btnPaintPolyNormal");
        const btnAuto = document.getElementById("btnPaintPolyAuto");
        const btnApplyNow = document.getElementById("btnPaintPolyApplyNow");

        const updatePolyUI = () => {
            const opName = polySelect.value;
            const opTitle = opName.charAt(0).toUpperCase() + opName.slice(1);
            btnAuto.textContent = opTitle;
            if (this.polyMode === "normal") {
                btnNormal.className = "px-2 py-1 rounded text-xs font-bold bg-sky-300 text-slate-950 border border-sky-400";
                btnAuto.className = "px-2 py-1 rounded text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700";
            } else {
                this.polyMode = opName;
                btnAuto.className = "px-2 py-1 rounded text-xs font-bold bg-sky-300 text-slate-950 border border-sky-400";
                btnNormal.className = "px-2 py-1 rounded text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700";
            }
        };

        polySelect?.addEventListener("change", () => {
            if (this.polyMode !== "normal") this.polyMode = polySelect.value;
            updatePolyUI();
        });
        btnNormal?.addEventListener("click", () => {
            this.polyMode = "normal";
            updatePolyUI();
        });
        btnAuto?.addEventListener("click", () => {
            this.polyMode = polySelect.value;
            updatePolyUI();
            ensurePolyBoolLoaded();
        });
        btnApplyNow?.addEventListener("click", async () => {
            await ensurePolyBoolLoaded();
            this.performBooleanOperation(polySelect.value, null);
        });

        document.getElementById("btnPaintClear")?.addEventListener("click", () => this.clearCanvas(true));
        document.getElementById("btnPaintUndo")?.addEventListener("click", () => this.undo());
        document.getElementById("btnPaintRedo")?.addEventListener("click", () => this.redo());
        document.getElementById("btnPaintZoomFit")?.addEventListener("click", () => this.zoomToFit());
        document.getElementById("btnPaintZoom1to1")?.addEventListener("click", () => this.zoomOneToOne());

        



        


        const colorInp = document.getElementById("inpPaintColor");
        colorInp?.addEventListener("input", () => {
            this.color = colorInp.value;
            if (this.selectedActionIndices.length > 0) {
                this.beginLiveEditSession();
                let minIdx = Infinity;
                this.selectedActionIndices.forEach((idx) => {
                    const act = this.actions[idx];
                    if (act) {
                        act.color = this.color;
                        if (act.type === "fill") delete act.cachedCanvas;
                        if (idx < minIdx) minIdx = idx;
                    }
                });
                if (minIdx !== Infinity) this.invalidateFillsAfter(minIdx);
            }
            if (this.activeTextIdx !== null && this.actions[this.activeTextIdx]) {
                this.beginLiveEditSession();
                this.actions[this.activeTextIdx].color = this.color;
                if (this.floatingTextarea) this.floatingTextarea.style.color = this.color;
            }
            this.updateSampleTextPreview();
            this.renderPreviewPanel();
            this.redrawAll();
        });
        colorInp?.addEventListener("change", () => {
            if (this._preEditSnapshot) {
                this.commitLiveEditSession();
            }
        });

        const widthSlider = document.getElementById("sliderPaintWidth");
        widthSlider?.addEventListener("input", () => {
            this.thickness = parseInt(widthSlider.value, 10);
            document.getElementById("lblPaintWidthVal").textContent = `${this.thickness}px`;
            if (this.selectedActionIndices.length > 0) {
                this.beginLiveEditSession();
                let minIdx = Infinity;
                this.selectedActionIndices.forEach((idx) => {
                    if (this.actions[idx]) {
                        this.actions[idx].thickness = this.thickness;
                        if (idx < minIdx) minIdx = idx;
                    }
                });
                if (minIdx !== Infinity) this.invalidateFillsAfter(minIdx);
            }
            this.renderPreviewPanel();
            this.redrawAll();
        });
        widthSlider?.addEventListener("change", () => {
            if (this._preEditSnapshot) {
                this.commitLiveEditSession();
            }
        });

        const alphaSlider = document.getElementById("sliderPaintAlpha");
        alphaSlider?.addEventListener("input", () => {
            this.fillOpacity = parseInt(alphaSlider.value, 10);
            document.getElementById("lblPaintAlphaVal").textContent = `${this.fillOpacity}%`;
            if (this.selectedActionIndices.length > 0) {
                this.beginLiveEditSession();
                let minIdx = Infinity;
                this.selectedActionIndices.forEach((idx) => {
                    if (this.actions[idx]) {
                        this.actions[idx].fillOpacity = this.fillOpacity;
                        if (idx < minIdx) minIdx = idx;
                    }
                });
                if (minIdx !== Infinity) this.invalidateFillsAfter(minIdx);
            }
            this.renderPreviewPanel();
            this.redrawAll();
        });
        alphaSlider?.addEventListener("change", () => {
            if (this._preEditSnapshot) {
                this.commitLiveEditSession();
            }
        });






        const chkPolar = document.getElementById("chkPaintPolar");
        chkPolar?.addEventListener("change", () => {
            this.polarRotation = chkPolar.checked;
            this.renderPreviewPanel();
        });
    }

    setMainMode(mode, isInit = false) {
        this.commitActiveText();
        this.maintype = mode;

        Object.entries(this.modeButtons).forEach(([id, btn]) => {
            if (id === mode) {
                btn.className = "flex-1 px-1.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 bg-blue-600 text-white shadow min-w-0";
            } else {
                btn.className = "flex-1 px-1.5 py-1.5 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 min-w-0";
            }
        });

        this.rebuildTypeSelectorGrid();
        this.updateParametersUI();
        this.renderPreviewPanel();
        if (!isInit) this.redrawAll();
    }


    drawShapeIconOnCanvas(cvs, shapeName) {
        const ctx = cvs.getContext("2d");
        const w = cvs.width, h = cvs.height;
        ctx.clearRect(0, 0, w, h);

        ctx.save();
        ctx.translate(w / 2, h / 2);
        const R = Math.min(w, h) * 0.38;

        if (shapeName === "Emoji") {
            const em = this.savedParams["Emoji"]?.["Emoji"] || "🙂";
            drawEmojiOnContext(ctx, em, 18, false);
        } else if (shapeName === "Fill") {
            ctx.font = "17px sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("🪣", 0, 1);
        } else {
            traceShapePathOnContext(ctx, shapeName, {}, R);
            if (shapeName !== "Line") {
                ctx.fillStyle = "rgba(14, 165, 233, 0.45)";
                ctx.fill("evenodd");
            }
            ctx.strokeStyle = "#38bdf8";
            ctx.lineWidth = 1.6;
            ctx.stroke();
        }
        ctx.restore();
    }

    rebuildTypeSelectorGrid() {
        if (!this.typeGridContainer) return;
        this.typeGridContainer.innerHTML = "";
        this.shapeButtons = {};

        if (this.maintype === "Shapes") {
            const grid = document.createElement("div");
            grid.className = "grid grid-cols-7 gap-1 justify-items-center";
            const shapeNames = Object.keys(this.SHAPE_PARAMS).filter(k => !k.startsWith("Font"));

            if (!shapeNames.includes(this.currentShape)) {
                this.currentShape = this.lastSelectedShape["Shapes"] || "Line";
            }

            shapeNames.forEach((sName) => {
                const btn = document.createElement("button");
                btn.type = "button";
                btn.title = sName;
                btn.className = "w-[38px] h-[34px] rounded-lg border flex items-center justify-center transition p-0.5";

                const iconCvs = document.createElement("canvas");
                iconCvs.width = 32;
                iconCvs.height = 28;
                iconCvs.className = "block pointer-events-none";
                this.drawShapeIconOnCanvas(iconCvs, sName);
                btn.iconCanvas = iconCvs;
                btn.appendChild(iconCvs);

                btn.addEventListener("click", () => {
                    this.currentShape = sName;
                    this.lastSelectedShape["Shapes"] = sName;
                    this.highlightActiveTypeButton();
                    this.updateParametersUI();
                    this.renderPreviewPanel();
                });

                this.shapeButtons[sName] = btn;
                grid.appendChild(btn);
            });
            this.typeGridContainer.appendChild(grid);
        } else if (this.maintype === "Text") {
            const grid = document.createElement("div");
            grid.className = "grid grid-cols-5 gap-1";
            const fontShapes = Object.keys(this.SHAPE_PARAMS).filter(k => k.startsWith("Font"));

            if (!fontShapes.includes(this.currentShape)) {
                this.currentShape = this.lastSelectedShape["Text"] || "FontModern";
            }

            fontShapes.forEach((fName) => {
                const label = fName.replace("Font", "");
                const btn = document.createElement("button");
                btn.type = "button";
                btn.textContent = label;
                btn.className = "px-1.5 py-1.5 rounded-lg border text-[11px] font-bold transition truncate";
                btn.addEventListener("click", () => {
                    this.currentShape = fName;
                    this.lastSelectedShape["Text"] = fName;
                    this.highlightActiveTypeButton();
                    this.updateParametersUI();
                    this.syncActiveTextWithParams();
                });
                this.shapeButtons[fName] = btn;
                grid.appendChild(btn);
            });
            this.typeGridContainer.appendChild(grid);
        


} else if (this.maintype === "Select") {
            this.currentShape = "Select";
            const wrap = document.createElement("div");
            wrap.className = "flex flex-col gap-2 px-1 py-1";
            wrap.innerHTML = `
                <div class="text-xs text-slate-300 leading-relaxed">
                    Click or drag a box to select objects. <b>Double-click</b> a shape to edit vertices.
                </div>
                <div class="grid grid-cols-2 gap-1.5 pt-0.5">
                    <button type="button" id="btnTypePanelGroup" disabled class="py-1.5 px-2 rounded-lg border text-xs font-semibold transition bg-slate-900/50 border-slate-800 text-slate-600 cursor-not-allowed" title="Group Selected Objects (Ctrl+G)">
                        ^-G Group
                    </button>
                    <button type="button" id="btnTypePanelUngroup" disabled class="py-1.5 px-2 rounded-lg border text-xs font-semibold transition bg-slate-900/50 border-slate-800 text-slate-600 cursor-not-allowed" title="Ungroup Selected Objects (Ctrl+Shift+G)">
                        ^Shift-G Ungroup
                    </button>
                </div>
            `;
            this.typeGridContainer.appendChild(wrap);

            document.getElementById("btnTypePanelGroup")?.addEventListener("click", () => this.groupSelectedActions());
            document.getElementById("btnTypePanelUngroup")?.addEventListener("click", () => this.ungroupSelectedActions());
        }

        this.highlightActiveTypeButton();
        this.updateGroupButtonsState();
    }

    updateGroupButtonsState() {
        const btnGroup = document.getElementById("btnTypePanelGroup");
        const btnUngroup = document.getElementById("btnTypePanelUngroup");
        if (!btnGroup && !btnUngroup) return;

        const selIndices = (this.selectedActionIndices || []).filter(i => !!this.actions[i]);
        const canGroup = selIndices.length > 1;
        const canUngroup = selIndices.some(i => !!this.actions[i]?.groupId);

        const activeCls = "py-1.5 px-2 rounded-lg border text-xs font-semibold transition bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200 cursor-pointer";
        const disabledCls = "py-1.5 px-2 rounded-lg border text-xs font-semibold transition bg-slate-900/50 border-slate-800 text-slate-600 cursor-not-allowed";

        if (btnGroup) {
            btnGroup.disabled = !canGroup;
            btnGroup.className = canGroup ? activeCls : disabledCls;
        }
        if (btnUngroup) {
            btnUngroup.disabled = !canUngroup;
            btnUngroup.className = canUngroup ? activeCls : disabledCls;
        }
    }






    highlightActiveTypeButton() {
        Object.entries(this.shapeButtons || {}).forEach(([name, btn]) => {
            if (name === this.currentShape) {
                btn.style.backgroundColor = "rgb(173, 216, 230)";
                btn.style.color = "#0f172a";
                btn.style.borderColor = "#38bdf8";
            } else {
                btn.style.backgroundColor = "#0f172a";
                btn.style.color = "#cbd5e1";
                btn.style.borderColor = "#334155";
            }
        });
    }

    updateParametersUI() {
        if (!this.paramsContentEl) return;
        this.paramsContentEl.innerHTML = "";
        this.samplePanelCanvas = null;

        const hasSel = this.selectedActionIdx !== null && this.actions[this.selectedActionIdx];
        const selAct = hasSel ? this.actions[this.selectedActionIdx] : null;
        const activeParamKey = (this.maintype === "Select" && selAct)
            ? this.getActionParamShapeKey(selAct)
            : this.currentShape;

        const showPoly = (this.maintype === "Shapes" && !["Line", "Fill", "Emoji"].includes(this.currentShape)) ||
                         (this.maintype === "Select" && selAct && ["shape", "polygon_shape", "line"].includes(selAct.type));
        const showPolar = (this.maintype === "Shapes" && !["Line", "Fill", "Arrow"].includes(this.currentShape));
        const showWidth = (this.maintype === "Shapes" && !["Fill", "Emoji"].includes(this.currentShape)) ||
                          (this.maintype === "Select" && (!selAct || !["fill", "text"].includes(selAct.type)));
        const showAlpha = (this.maintype === "Shapes" && !["Line", "Fill", "Emoji"].includes(this.currentShape)) ||
                          (this.maintype === "Select" && (!selAct || ["shape", "polygon_shape", "line"].includes(selAct.type)));

        if (this.polyOpsBox) this.polyOpsBox.classList.toggle("hidden", !showPoly);
        document.getElementById("rowPaintPolar")?.classList.toggle("hidden", !showPolar);
        document.getElementById("rowPaintStrokeWidth")?.classList.toggle("hidden", !showWidth);
        document.getElementById("rowPaintFillOpacity")?.classList.toggle("hidden", !showAlpha);

        const paramsBox = document.getElementById("paintParamsBox");
        if (paramsBox) paramsBox.classList.remove("hidden");

        if (this.maintype === "Select") {
            this.buildSelectModePanel();
            if (!selAct || !activeParamKey) return;
        }

        let params = this.SHAPE_PARAMS[activeParamKey] || [];
        if (selAct && selAct.type === "polygon_shape") {
            params = [["Corner Radius (%)", 0, 100, 0]];
        }
        const curDict = this.savedParams[activeParamKey] || {};

        let skipNext = false;
        for (let i = 0; i < params.length; i++) {
            if (skipNext) {
                skipNext = false;
                continue;
            }
            const param = params[i];
            const label = param[0];

            if (activeParamKey === "Line" && (label === "Head Length (%)" || label === "Head Inset (%)")) {
                if (!curDict["Show Arrow"]) continue;
            }

            // Combine Bold & Italic on one row
            if (label === "Bold" && i + 1 < params.length && params[i + 1][0] === "Italic") {
                skipNext = true;
                const row = document.createElement("div");
                row.className = "flex items-center justify-between gap-2";
                row.innerHTML = `<span class="text-xs font-semibold text-slate-300">Style:</span>`;

                const btnWrap = document.createElement("div");
                btnWrap.className = "flex gap-1.5";

                ["Bold", "Italic"].forEach((styleKey) => {
                    const b = document.createElement("button");
                    b.type = "button";
                    b.textContent = styleKey;
                    const active = !!curDict[styleKey];
                    b.className = `px-3 py-1 rounded text-xs border transition ${styleKey === "Bold" ? "font-bold" : "italic"} ${
                        active ? "bg-sky-300 text-slate-950 border-sky-400" : "bg-slate-800 text-slate-300 border-slate-700"
                    }`;
                    b.addEventListener("click", () => {
                        this.beginLiveEditSession();
                        curDict[styleKey] = !curDict[styleKey];
                        this.applyParamToSelectedAction(activeParamKey, styleKey, curDict[styleKey], true);
                        this.updateParametersUI();
                    });
                    btnWrap.appendChild(b);
                });

                row.appendChild(btnWrap);
                this.paramsContentEl.appendChild(row);
            } else if (param.length === 3 && param[1] === "bool") {
                const row = document.createElement("label");
                row.className = "flex items-center justify-between gap-2 text-xs font-semibold text-slate-300 cursor-pointer py-0.5";
                const chk = document.createElement("input");
                chk.type = "checkbox";
                chk.checked = !!curDict[label];
                chk.className = "rounded bg-slate-800 border-slate-700 text-blue-600";
                chk.addEventListener("change", () => {
                    this.beginLiveEditSession();
                    curDict[label] = chk.checked;
                    this.applyParamToSelectedAction(activeParamKey, label, chk.checked, true);
                    if (activeParamKey === "Triangle" && label === "Allow Obtuse") {
                        this.updateParametersUI();
                    }
                    this.renderPreviewPanel();
                });
                row.innerHTML = `<span>${label}</span>`;
                row.appendChild(chk);
                this.paramsContentEl.appendChild(row);
            } else if (param[1] === "toggle") {
                const btnLabel = param.length === 4 ? param[2] : label;
                const row = document.createElement("div");
                row.className = "flex items-center justify-between gap-2";
                const btn = document.createElement("button");
                btn.type = "button";
                btn.textContent = btnLabel;
                const active = !!curDict[label];
                btn.className = `px-3 py-1 rounded text-xs font-bold border transition ${
                    active ? "bg-sky-300 text-slate-950 border-sky-400" : "bg-slate-800 text-slate-300 border-slate-700"
                }`;
                btn.addEventListener("click", () => {
                    this.beginLiveEditSession();
                    curDict[label] = !curDict[label];
                    this.applyParamToSelectedAction(activeParamKey, label, curDict[label], true);
                    this.updateParametersUI();
                    this.renderPreviewPanel();
                });
                row.innerHTML = `<span class="text-xs font-semibold text-slate-300">${label}:</span>`;
                row.appendChild(btn);
                this.paramsContentEl.appendChild(row);
            } else if (param.length === 3 && param[1] === "choice") {
                const choices = param[2];
                const row = document.createElement("div");
                row.className = "flex items-center justify-between gap-2";
                const sel = document.createElement("select");
                sel.className = "bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 font-semibold";
                choices.forEach((c) => {
                    const opt = document.createElement("option");
                    opt.value = c;
                    opt.textContent = c;
                    if (c === curDict[label]) opt.selected = true;
                    sel.appendChild(opt);
                });
                sel.addEventListener("change", () => {
                    this.beginLiveEditSession();
                    curDict[label] = sel.value;
                    this.applyParamToSelectedAction(activeParamKey, label, sel.value, true);
                    this.renderPreviewPanel();
                });
                row.innerHTML = `<span class="text-xs font-semibold text-slate-300">${label}:</span>`;
                row.appendChild(sel);
                this.paramsContentEl.appendChild(row);
            

            } else if (param.length === 3 && param[1] === "font") {
                const fontList = param[2];
                const currentFont = curDict[label] || fontList[0];
                const isBold = !!curDict["Bold"];
                const isItalic = !!curDict["Italic"];

                const listBox = document.createElement("div");
                listBox.tabIndex = 0;
                listBox.className = "max-h-[100px] overflow-y-auto filmstrip-scroll border border-slate-800 rounded-lg bg-slate-900 divide-y divide-slate-800/60 focus:outline-none focus:border-sky-500";

                let selectedBtn = null;

                const selectFontByName = (fName) => {
                    this._fontListScrollTop = listBox.scrollTop;
                    this._shouldFocusFontList = true;
                    this.beginLiveEditSession();
                    curDict[label] = fName;
                    this.applyParamToSelectedAction(activeParamKey, label, fName, true);
                    this.updateParametersUI();
                    this.updateFontPreviewOverlay();
                };

                fontList.forEach((fName) => {
                    const itemBtn = document.createElement("button");
                    itemBtn.type = "button";
                    itemBtn.textContent = fName;
                    itemBtn.style.fontFamily = `"${fName}", sans-serif`;
                    itemBtn.style.fontWeight = isBold ? "bold" : "normal";
                    itemBtn.style.fontStyle = isItalic ? "italic" : "normal";
                    const isSel = fName === currentFont;
                    itemBtn.className = `w-full text-left px-2.5 py-1 text-xs transition focus:outline-none ${
                        isSel ? "bg-sky-300 text-slate-950 font-bold" : "text-slate-200 hover:bg-slate-800"
                    }`;
                    if (isSel) selectedBtn = itemBtn;

                    itemBtn.addEventListener("click", () => {
                        selectFontByName(fName);
                    });
                    listBox.appendChild(itemBtn);
                });

                // Allow Up/Down arrow keys to cycle fonts while focus is in the font list
                listBox.addEventListener("keydown", (e) => {
                    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                        e.preventDefault();
                        const curIdx = fontList.indexOf(currentFont);
                        const nextIdx = e.key === "ArrowDown"
                            ? Math.min(fontList.length - 1, curIdx + 1)
                            : Math.max(0, curIdx - 1);
                        if (nextIdx !== curIdx && fontList[nextIdx]) {
                            selectFontByName(fontList[nextIdx]);
                        }
                    }
                });

                this.paramsContentEl.appendChild(listBox);

                if (this._fontListScrollTop !== undefined) {
                    listBox.scrollTop = this._fontListScrollTop;
                }

                // Restore scroll position and return focus after text/sample updates complete
                requestAnimationFrame(() => {
                    if (this._fontListScrollTop !== undefined) {
                        listBox.scrollTop = this._fontListScrollTop;
                    }
                    if (selectedBtn) {
                        selectedBtn.scrollIntoView({ block: "nearest" });
                        if (this._shouldFocusFontList) {
                            this._shouldFocusFontList = false;
                            selectedBtn.focus({ preventScroll: true });
                        }
                    }
                });
            







            } else if (param.length === 3 && param[1] === "emoji_grid") {
                if (!this.quickEmojiList) {
                    this.quickEmojiList = ["🙂", "🥷", "🦊", "🍎", "🏀", "✈️", "🌎", "🎥", "📝", "💙", "◀️", "🏁"];
                }
                const currentEmoji = curDict[label] || "🙂";

                const grid = document.createElement("div");
                grid.className = "grid grid-cols-6 gap-1 pt-1";
                this.quickEmojiList.forEach((em) => {
                    const eb = document.createElement("button");
                    eb.type = "button";
                    eb.textContent = em;
                    const active = em === currentEmoji;
                    eb.className = `h-8 rounded-lg border text-base flex items-center justify-center transition ${
                        active ? "bg-sky-300 border-sky-400 scale-105" : "bg-slate-900 border-slate-700 hover:bg-slate-800"
                    }`;
                    eb.addEventListener("click", () => {
                        this.beginLiveEditSession();
                        this.selectEmoji(em);
                        this.commitLiveEditSession();
                    });
                    grid.appendChild(eb);
                });
                this.paramsContentEl.appendChild(grid);
            } else if (param.length === 3 && param[1] === "button") {
                const btn = document.createElement("button");
                btn.type = "button";
                btn.textContent = param[2];
                btn.className = "w-full py-1.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow transition mt-1";
                btn.addEventListener("click", () => this.openEmojiPickerModal());
                this.paramsContentEl.appendChild(btn);
            } else if (param.length === 4) {
                let [, minVal, maxVal] = param;
                let curVal = curDict[label] ?? param[3];

                if (activeParamKey === "Triangle" && label === "Top Shift (%)") {
                    const allowObtuse = !!curDict["Allow Obtuse"];
                    minVal = allowObtuse ? -200 : -50;
                    maxVal = allowObtuse ? 200 : 50;
                    curVal = Math.max(minVal, Math.min(maxVal, curVal));
                    curDict[label] = curVal;
                }

                const wrap = document.createElement("div");
                wrap.className = "flex flex-col gap-0.5";
                wrap.innerHTML = `
                    <div class="flex justify-between text-[11px] font-semibold text-slate-300">
                        <span>${label}</span>
                        <span class="val-readout text-amber-400 font-bold">${curVal}</span>
                    </div>
                `;
                const slider = document.createElement("input");
                slider.type = "range";
                slider.min = String(minVal);
                slider.max = String(maxVal);
                slider.value = String(curVal);
                slider.className = "w-full accent-blue-500 cursor-pointer h-1.5";
                const valSpan = wrap.querySelector(".val-readout");

                slider.addEventListener("input", () => {
                    this.beginLiveEditSession();
                    const v = parseInt(slider.value, 10);
                    curDict[label] = v;
                    valSpan.textContent = String(v);
                    this.applyParamToSelectedAction(activeParamKey, label, v, false);
                    if (activeParamKey.startsWith("Font")) {
                        this.updateSampleTextPreview();
                    }
                    this.renderPreviewPanel();
                });

                slider.addEventListener("change", () => {
                    if (this._preEditSnapshot) {
                        this.commitLiveEditSession();
                    }
                });

                wrap.appendChild(slider);
                this.paramsContentEl.appendChild(wrap);
            }
        }
        if (activeParamKey && activeParamKey.startsWith("Font")) {
            this.updateFontPreviewOverlay();
        } else {
            this.fontPreviewState = null;
        }
    }





    buildSelectModePanel() {
        this.updateGroupButtonsState();

        const selIndices = this.selectedActionIndices.filter(i => !!this.actions[i]);
        const count = selIndices.length;
        const primaryAct = count > 0 ? this.actions[selIndices[count - 1]] : null;
        const hasGroupedItem = selIndices.some(i => !!this.actions[i]?.groupId);
        const canVertexEdit = count === 1 && ["shape", "polygon_shape", "line"].includes(primaryAct.type) && primaryAct.shape !== "Emoji";

        const wrap = document.createElement("div");
        wrap.className = "flex flex-col gap-2";

        if (count === 0) {
            wrap.innerHTML = `
                <div class="text-xs text-slate-400 italic py-1.5 text-center">
                    No object selected (${this.clipboard.length ? "Ctrl+V to paste" : "Ctrl+Click or Ctrl+A to select"}).
                </div>
                ${this.clipboard.length > 0 ? `
                <button type="button" id="btnSelectPaste" class="w-full py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200">
                    Paste (${this.clipboard.length}) (Ctrl+V)
                </button>` : ""}
            `;
        } else {
            const labelText = count === 1
                ? `${primaryAct.shape || primaryAct.type.toUpperCase()}${primaryAct.groupId ? " (Grouped)" : ""}`
                : `${count} Objects${hasGroupedItem ? " (Grouped)" : ""}`;

            wrap.innerHTML = `
                <div class="text-xs font-bold text-sky-400 px-1">Selected: ${labelText}</div>
                ${canVertexEdit ? `
                <button type="button" id="btnSelectToggleVertex" class="w-full py-1.5 px-3 rounded-lg font-bold text-xs border transition ${
                    this.vertexEditMode
                        ? "bg-amber-400 text-slate-950 border-amber-300"
                        : "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
                }">
                    ${this.vertexEditMode ? "✓ Vertex Edit Mode Active" : "Edit Individual Vertices"}
                </button>` : ""}
                <div class="grid grid-cols-2 gap-1.5">
                    <button type="button" id="btnSelectCopy" class="py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200" title="Copy (Ctrl+C)">Copy (^C)</button>
                    <button type="button" id="btnSelectPaste" ${!this.clipboard.length ? "disabled" : ""} class="py-1.5 px-2 rounded-lg border text-xs font-semibold transition ${
                        this.clipboard.length ? "bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200" : "bg-slate-900/50 border-slate-800 text-slate-600 cursor-not-allowed"
                    }" title="Paste (Ctrl+V)">Paste (^V)</button>
                </div>
                <div class="grid grid-cols-2 gap-1.5">
                    <button type="button" id="btnSelectDuplicate" class="py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200">Duplicate</button>
                    <button type="button" id="btnSelectDelete" class="py-1.5 px-2 rounded-lg bg-red-900/60 hover:bg-red-800 border border-red-700/60 text-xs font-semibold text-red-100">Delete</button>
                </div>
            `;
        }

        this.paramsContentEl.appendChild(wrap);

        document.getElementById("btnSelectToggleVertex")?.addEventListener("click", () => {
            if (this.selectedActionIndices.length !== 1) return;
            this.saveUndoSnapshot();
            if (!this.vertexEditMode) {
                this.convertShapeToEditable(this.selectedActionIdx);
                this.vertexEditMode = true;
            } else {
                this.vertexEditMode = false;
            }
            this.commitPaintChanges();
            this.updateParametersUI();
            this.redrawAll();
        });

        document.getElementById("btnSelectCopy")?.addEventListener("click", () => this.copySelectedActions());
        document.getElementById("btnSelectPaste")?.addEventListener("click", () => this.pasteClipboardActions());
        document.getElementById("btnSelectDuplicate")?.addEventListener("click", () => this.duplicateSelectedActions());
        document.getElementById("btnSelectDelete")?.addEventListener("click", () => this.deleteSelectedActions());
    }

    getStartIndexAfterClear() {
        for (let i = this.actions.length - 1; i >= 0; i--) {
            if (this.actions[i].type === "clear") return i + 1;
        }
        return 0;
    }

    selectAllActions() {
        const startIdx = this.getStartIndexAfterClear();
        const allIndices = [];
        for (let i = startIdx; i < this.actions.length; i++) {
            const act = this.actions[i];
            if (act && act.type !== "fill" && act.type !== "clear") {
                allIndices.push(i);
            }
        }
        this.selectedActionIndices = allIndices;
        this.vertexEditMode = false;
        this.syncPanelToSelectedAction();
        this.updateGroupButtonsState();
        this.redrawAll();
        if (typeof showToast === "function") {
            showToast(`Selected all ${allIndices.length} paint object${allIndices.length === 1 ? "" : "s"}`, "info");
        }
    }




    getGroupPeerIndices(idx) {
        const act = this.actions[idx];
        if (!act) return [];
        if (!act.groupId) return [idx];
        const gid = act.groupId;
        const startIdx = this.getStartIndexAfterClear();
        const peers = [];
        for (let i = startIdx; i < this.actions.length; i++) {
            if (this.actions[i]?.groupId === gid) peers.push(i);
        }
        return peers.length ? peers : [idx];
    }

    selectActionWithGroup(idx, toggle = false) {
        if (idx === null || idx === undefined || !this.actions[idx]) {
            if (!toggle) {
                this.selectedActionIndices = [];
                this.vertexEditMode = false;
            }
            return;
        }
        const peers = this.getGroupPeerIndices(idx);
        if (!toggle) {
            this.selectedActionIndices = [...peers];
        } else {
            const alreadySelected = this.selectedActionIndices.includes(idx);
            if (alreadySelected) {
                this.selectedActionIndices = this.selectedActionIndices.filter(i => !peers.includes(i));
            } else {
                for (const p of peers) {
                    if (!this.selectedActionIndices.includes(p)) {
                        this.selectedActionIndices.push(p);
                    }
                }
            }
        }
        if (this.selectedActionIndices.length !== 1) {
            this.vertexEditMode = false;
        }
    }

    offsetActionClone(clone, dx, dy) {
        if (clone.center) clone.center = [clone.center[0] + dx, clone.center[1] + dy];
        if (clone.pos) clone.pos = [clone.pos[0] + dx, clone.pos[1] + dy];
        if (clone.points) clone.points = clone.points.map(([x, y]) => [x + dx, y + dy]);
        if (clone.polygons) {
            clone.polygons = clone.polygons.map(([ext, ints]) => [
                ext.map(([x, y]) => [x + dx, y + dy]),
                (ints || []).map(r => r.map(([x, y]) => [x + dx, y + dy]))
            ]);
        }
        return clone;
    }

    groupSelectedActions() {
        const valid = this.selectedActionIndices.filter(i => !!this.actions[i]);
        if (valid.length < 2) return;
        this.saveUndoSnapshot();
        const newGroupId = "grp_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6);
        valid.forEach((idx) => {
            this.actions[idx].groupId = newGroupId;
        });
        this.vertexEditMode = false;
        this.commitPaintChanges();
        this.updateParametersUI();
        this.redrawAll();
        if (typeof showToast === "function") showToast(`Grouped ${valid.length} objects`, "info");
    }

    ungroupSelectedActions() {
        const valid = this.selectedActionIndices.filter(i => !!this.actions[i]?.groupId);
        if (!valid.length) return;
        this.saveUndoSnapshot();
        valid.forEach((idx) => {
            delete this.actions[idx].groupId;
        });
        this.commitPaintChanges();
        this.updateParametersUI();
        this.redrawAll();
        if (typeof showToast === "function") showToast("Ungrouped selected objects", "info");
    }

    copySelectedActions() {
        const sorted = [...this.selectedActionIndices].filter(i => !!this.actions[i]).sort((a, b) => a - b);
        if (!sorted.length) return;
        this.clipboard = sorted.map((idx) => {
            const copy = { ...this.actions[idx] };
            delete copy.cachedCanvas;
            return JSON.parse(JSON.stringify(copy));
        });
        this.pasteCascadeCount = 0;
        this.updateParametersUI();
        if (typeof showToast === "function") {
            showToast(`Copied ${this.clipboard.length} object${this.clipboard.length > 1 ? "s" : ""}`, "info");
        }
    }

    pasteClipboardActions() {
        if (!this.clipboard || !this.clipboard.length) return;
        this.saveUndoSnapshot();
        this.pasteCascadeCount = (this.pasteCascadeCount || 0) + 1;
        const offset = 24 * this.pasteCascadeCount;

        const groupMap = new Map();
        const newIndices = [];

        this.clipboard.forEach((item) => {
            const clone = JSON.parse(JSON.stringify(item));
            this.offsetActionClone(clone, offset, offset);
            if (clone.groupId) {
                if (!groupMap.has(clone.groupId)) {
                    groupMap.set(clone.groupId, "grp_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6));
                }
                clone.groupId = groupMap.get(clone.groupId);
            }
            this.actions.push(clone);
            newIndices.push(this.actions.length - 1);
        });

        this.selectedActionIndices = newIndices;
        this.vertexEditMode = false;
        this.syncPanelToSelectedAction();
        this.commitPaintChanges();
        this.redrawAll();
    }

    duplicateSelectedActions() {
        this.copySelectedActions();
        this.pasteClipboardActions();
    }

    deleteSelectedActions() {
        const sorted = [...this.selectedActionIndices].filter(i => !!this.actions[i]).sort((a, b) => b - a);
        if (!sorted.length) return;
        this.saveUndoSnapshot();
        const minIdx = sorted[sorted.length - 1];
        for (const idx of sorted) {
            this.actions.splice(idx, 1);
        }
        this.selectedActionIndices = [];
        this.vertexEditMode = false;
        this.invalidateFillsAfter(minIdx);
        this.commitPaintChanges();
        this.updateParametersUI();
        this.redrawAll();
    }

   


    // ==================================================================
    // 156x156 PREVIEW PANEL & 2x LOUPE MAGNIFIER
    // ==================================================================
    renderPreviewPanel() {
        if (!this.previewCtx || !this.previewCanvas) return;
        const ctx = this.previewCtx;
        const w = this.previewCanvas.width;
        const h = this.previewCanvas.height;

        ctx.fillStyle = "#1c1c20";
        ctx.fillRect(0, 0, w, h);

        const cx = w / 2, cy = h / 2;
        const R = Math.min(w, h) * 0.35;
        const params = this.savedParams[this.currentShape] || {};

        // 1. Live 2x Loupe Mode when hovering over the main canvas
        if (this.isHoveringCanvas && this.bgCanvas) {
            const [wx, wy] = this.currentMouseWorld;
            const zoom = 2.0;
            const cropW = w / zoom;
            const cropH = h / zoom;

            ctx.save();
            ctx.drawImage(
                this.bgCanvas,
                wx - cropW / 2, wy - cropH / 2, cropW, cropH,
                0, 0, w, h
            );

            // Overlay ghost outline of active shape inside the loupe
            if (this.maintype === "Shapes" && this.currentShape !== "Fill") {
                ctx.translate(cx, cy);
                if (this.currentShape === "Emoji") {
                    drawEmojiOnContext(ctx, params["Emoji"] || "🙂", Math.max(12, R * 1.2), !!params["Grayscale"]);
                } else {
                    traceShapePathOnContext(ctx, this.currentShape, params, R);
                    ctx.strokeStyle = this.color;
                    ctx.lineWidth = Math.max(1, this.thickness);
                    ctx.stroke();
                }
            }
            ctx.restore();

            // Loupe reticle box & ticks
            const boxSz = 42;
            const x1 = cx - boxSz / 2, y1 = cy - boxSz / 2;
            ctx.strokeStyle = "rgba(0,0,0,0.85)";
            ctx.lineWidth = 3;
            ctx.strokeRect(x1, y1, boxSz, boxSz);
            ctx.strokeStyle = "#00e6ff";
            ctx.lineWidth = 1.8;
            ctx.strokeRect(x1, y1, boxSz, boxSz);

            const halfTic = 5;
            ctx.beginPath();
            ctx.moveTo(cx, y1 - halfTic); ctx.lineTo(cx, y1 + halfTic);
            ctx.moveTo(cx, y1 + boxSz - halfTic); ctx.lineTo(cx, y1 + boxSz + halfTic);
            ctx.moveTo(x1 - halfTic, cy); ctx.lineTo(x1 + halfTic, cy);
            ctx.moveTo(x1 + boxSz - halfTic, cy); ctx.lineTo(x1 + boxSz + halfTic, cy);
            ctx.strokeStyle = "#ffe600";
            ctx.lineWidth = 2;
            ctx.stroke();
            return;
        }

        // 2. Standard Shape Preview Mode
        ctx.save();
        ctx.translate(cx, cy);

        if (this.currentShape === "Emoji") {
            drawEmojiOnContext(ctx, params["Emoji"] || "🙂", Math.max(18, R * 1.35), !!params["Grayscale"]);
        } else if (this.currentShape === "Fill") {
            drawEmojiOnContext(ctx, "🪣", 42, false);
        } else if (this.currentShape.startsWith("Font")) {
            ctx.fillStyle = this.color;
            ctx.font = "bold 26px Inter, sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("Aa", 0, 0);
        } else if (this.maintype === "Shapes") {
            traceShapePathOnContext(ctx, this.currentShape, params, R);
            if (this.currentShape !== "Line") {
                ctx.fillStyle = hexToRgba(this.color, this.fillOpacity / 100.0);
                ctx.fill("evenodd");
            }
            ctx.strokeStyle = this.color;
            ctx.lineWidth = this.thickness;
            ctx.lineJoin = "round";
            ctx.lineCap = "round";
            ctx.stroke();

            if (this.currentShape === "Triangle") {
                drawTrianglePreviewMetrics(ctx, params, R);
            }
        }
        ctx.restore();
    }

    // ==================================================================
    // EMOJI & COUNTRY FLAG MODAL PICKER
    // ==================================================================
    selectEmoji(newEmoji) {
        if (!this.quickEmojiList) {
            this.quickEmojiList = ["🙂", "🥷", "🦊", "🍎", "🏀", "✈️", "🌎", "🎥", "📝", "💙", "◀️", "🏁"];
        }
        if (!this.savedParams["Emoji"]) this.savedParams["Emoji"] = {};
        const oldEmoji = this.savedParams["Emoji"]["Emoji"] || "🙂";
        this.savedParams["Emoji"]["Emoji"] = newEmoji;

        // If the new emoji is not already in the quick-grid, replace the active button's slot
        if (!this.quickEmojiList.includes(newEmoji)) {
            const activeIdx = this.quickEmojiList.indexOf(oldEmoji);
            if (activeIdx !== -1) {
                this.quickEmojiList[activeIdx] = newEmoji;
            } else {
                this.quickEmojiList[0] = newEmoji;
            }
        }

        // If an existing emoji shape on the canvas is selected, update it immediately
        if (this.selectedActionIdx !== null && this.actions[this.selectedActionIdx]?.shape === "Emoji") {
            if (!this.actions[this.selectedActionIdx].params) this.actions[this.selectedActionIdx].params = {};
            this.actions[this.selectedActionIdx].params["Emoji"] = newEmoji;
            this.commitPaintChanges();
            this.redrawAll();
        }

        const btn = this.shapeButtons?.["Emoji"];
        if (btn && btn.iconCanvas) {
            this.drawShapeIconOnCanvas(btn.iconCanvas, "Emoji");
        }
        this.updateParametersUI();
        this.renderPreviewPanel();
    }


    openEmojiPickerModal() {
        const currentEmoji = this.savedParams["Emoji"]?.["Emoji"] || "🙂";
        if (typeof openPaintEmojiPickerModal === "function") {
            openPaintEmojiPickerModal(currentEmoji, (selected) => {
                this.selectEmoji(selected);
            });
        }
    }

    // ==================================================================
    // COORDINATE TRANSFORMS & VIEWPORT CONTROLS
    // ==================================================================
    getTransformParams() {
        if (!this.canvas) return [1, 0, 0];
        const cw = this.canvas.width;
        const ch = this.canvas.height;
        if (cw <= 0 || ch <= 0 || this.origW <= 0 || this.origH <= 0) return [1, 0, 0];

        const fitScale = Math.min(cw / this.origW, ch / this.origH) * 0.96;
        const scale = fitScale * this.zoomFactor;
        const ox = (cw - this.origW * scale) / 2 + this.panX;
        const oy = (ch - this.origH * scale) / 2 + this.panY;
        return [scale, ox, oy];
    }

    screenToWorld(sx, sy) {
        const [scale, ox, oy] = this.getTransformParams();
        if (scale === 0) return [sx, sy];
        return [(sx - ox) / scale, (sy - oy) / scale];
    }

    worldToScreen(wx, wy) {
        const [scale, ox, oy] = this.getTransformParams();
        return [ox + wx * scale, oy + wy * scale];
    }

    worldToLocal(wx, wy, cx, cy, angle) {
        const dx = wx - cx, dy = wy - cy;
        const cosA = Math.cos(angle), sinA = Math.sin(angle);
        return [dx * cosA + dy * sinA, -dx * sinA + dy * cosA];
    }

    localToWorld(lx, ly, cx, cy, angle) {
        const cosA = Math.cos(angle), sinA = Math.sin(angle);
        return [cx + lx * cosA - ly * sinA, cy + lx * sinA + ly * cosA];
    }

    zoomToFit() {
        this.zoomFactor = 1.0;
        this.panX = 0;
        this.panY = 0;
        this.redrawAll();
    }

    zoomOneToOne() {
        if (!this.canvas) return;
        const cw = this.canvas.width, ch = this.canvas.height;
        const fitScale = Math.min(cw / this.origW, ch / this.origH) * 0.96;
        if (fitScale <= 0) return;

        const curEffective = fitScale * this.zoomFactor;
        let targetScale = 1.0;
        if (Math.abs(curEffective - 1.0) < 0.05) targetScale = 2.0;
        else if (Math.abs(curEffective - 2.0) < 0.05) targetScale = 4.0;

        this.zoomFactor = targetScale / fitScale;
        this.redrawAll();
    }

    clearCanvas(saveHistory = true) {
        this.commitActiveText();
        this.selectedActionIdx = null;
        this.vertexEditMode = false;
        if (saveHistory) {
            this.actions.push({ type: "clear" });
            this.undoneActions.length = 0;
        } else {
            this.actions.length = 0;
            this.undoneActions.length = 0;
        }
        this.commitPaintChanges();
        this.redrawAll();
    }

    

   get undoStack() {
        const itm = this.item;
        if (!itm) return [];
        if (!itm.paintUndoStack) itm.paintUndoStack = [];
        return itm.paintUndoStack;
    }

    get redoStack() {
        const itm = this.item;
        if (!itm) return [];
        if (!itm.paintRedoStack) itm.paintRedoStack = [];
        return itm.paintRedoStack;
    }

    cloneActionsState(actionsList = this.actions) {
        return actionsList.map((act) => {
            const copy = { ...act };
            delete copy.cachedCanvas; // Avoid serializing HTMLCanvasElement into {}
            return JSON.parse(JSON.stringify(copy));
        });
    }

    beginLiveEditSession() {
        if (!this._preEditSnapshot) {
            this._preEditSnapshot = this.cloneActionsState();
        }
    }

    commitLiveEditSession() {
        if (this._preEditSnapshot) {
            this.undoStack.push(this._preEditSnapshot);
            if (this.undoStack.length > 50) this.undoStack.shift();
            this.redoStack.length = 0;
            this._preEditSnapshot = null;
        }
        this.commitPaintChanges();
    }

    saveUndoSnapshot() {
        this._preEditSnapshot = null;
        this.undoStack.push(this.cloneActionsState());
        if (this.undoStack.length > 50) this.undoStack.shift();
        this.redoStack.length = 0;
    }

    undo() {
        this.commitActiveText();
        this._preEditSnapshot = null;
        if (this.undoStack.length > 0) {
            this.redoStack.push(this.cloneActionsState());
            const prevState = this.undoStack.pop();
            this.item.paintActions = prevState;
            if (this.selectedActionIdx !== null && this.selectedActionIdx >= this.actions.length) {
                this.selectedActionIdx = null;
                this.vertexEditMode = false;
            }
            this.syncPanelToSelectedAction();
            this.commitPaintChanges();
            this.redrawAll();
        } else if (this.actions.length > 0) {
            // Fallback for legacy items created before undoStack existed
            this.redoStack.push(this.cloneActionsState());
            this.actions.pop();
            this.selectedActionIdx = null;
            this.vertexEditMode = false;
            this.updateParametersUI();
            this.commitPaintChanges();
            this.redrawAll();
        }
    }

    redo() {
        this.commitActiveText();
        this._preEditSnapshot = null;
        if (this.redoStack.length > 0) {
            this.undoStack.push(this.cloneActionsState());
            const nextState = this.redoStack.pop();
            this.item.paintActions = nextState;
            this.syncPanelToSelectedAction();
            this.commitPaintChanges();
            this.redrawAll();
        }
    }

    invalidateFillsAfter(startIdx = 0) {
        if (startIdx === null || startIdx === undefined) return;
        for (let i = Math.max(0, startIdx); i < this.actions.length; i++) {
            if (this.actions[i].type === "fill") {
                delete this.actions[i].cachedCanvas;
            }
        }
    }

    commitPaintChanges() {
        const itm = this.item;
        if (!itm) return;
        itm.generateThumbnail();
        this.app.renderFilmstrip();
    }

    getActionParamShapeKey(act) {
        if (!act) return null;
        if (act.type === "shape") return act.shape;
        if (act.type === "line") return "Line";
        if (act.type === "fill") return "Fill";
        if (act.type === "polygon_shape") return "Rectangle";
        if (act.type === "text") {
            const face = act.fontFace || "Inter";
            for (const [cat, list] of Object.entries(PAINT_FONT_CATEGORIES)) {
                if (list.includes(face)) return "Font" + cat;
            }
            return "FontModern";
        }
        return null;
    }

    syncPanelToSelectedAction() {
        if (this.selectedActionIdx === null || !this.actions[this.selectedActionIdx]) {
            this.updateParametersUI();
            return;
        }

        const act = this.actions[this.selectedActionIdx];

        // 1. Sync Global Color, Stroke Width, and Fill Opacity UI
        if (act.color) {
            this.color = act.color;
            const colorInp = document.getElementById("inpPaintColor");
            if (colorInp) colorInp.value = this.color;
        }
        if (act.thickness !== undefined) {
            this.thickness = act.thickness;
            const wSlider = document.getElementById("sliderPaintWidth");
            const wLbl = document.getElementById("lblPaintWidthVal");
            if (wSlider) wSlider.value = String(this.thickness);
            if (wLbl) wLbl.textContent = `${this.thickness}px`;
        }
        if (act.fillOpacity !== undefined) {
            this.fillOpacity = act.fillOpacity;
            const aSlider = document.getElementById("sliderPaintAlpha");
            const aLbl = document.getElementById("lblPaintAlphaVal");
            if (aSlider) aSlider.value = String(this.fillOpacity);
            if (aLbl) aLbl.textContent = `${this.fillOpacity}%`;
        }

        // 2. Sync Shape / Line / Text / Polygon Parameters into savedParams
        const paramKey = this.getActionParamShapeKey(act);
        if (paramKey && this.savedParams[paramKey]) {
            if (act.params) {
                Object.assign(this.savedParams[paramKey], act.params);
            }
            if (act.type === "text") {
                const catName = paramKey.replace("Font", "");
                this.savedParams[paramKey][catName] = act.fontFace || "Inter";
                this.savedParams[paramKey]["Text Size"] = Math.round(act.fontSize || 32);
                this.savedParams[paramKey]["Bold"] = !!act.bold;
                this.savedParams[paramKey]["Italic"] = !!act.italic;
                this.savedParams[paramKey]["Text Outline"] = !!act.outline;
                this.savedParams[paramKey]["Background Pill"] = !!act.bgPill;
                this.savedParams[paramKey]["Bg Opacity (%)"] = act.bgOpacity ?? 85;
            }

            if (this.maintype === "Shapes" && !paramKey.startsWith("Font")) {
                this.currentShape = paramKey;
                this.lastSelectedShape["Shapes"] = paramKey;
                this.highlightActiveTypeButton();
            } else if (this.maintype === "Text" && paramKey.startsWith("Font")) {
                this.currentShape = paramKey;
                this.lastSelectedShape["Text"] = paramKey;
                this.highlightActiveTypeButton();
            }
        }

        this.updateParametersUI();
        this.updateSampleTextPreview();
        this.renderPreviewPanel();
    }

    applyParamToSelectedAction(paramKey, label, value, isFinalized = true) {
        const targets = this.activeTextIdx !== null
            ? [this.activeTextIdx]
            : this.selectedActionIndices;
        if (!targets.length) return;

        let minModifiedIdx = Infinity;

        targets.forEach((targetIdx) => {
            const act = this.actions[targetIdx];
            if (!act) return;
            const actParamKey = this.getActionParamShapeKey(act);
            if (actParamKey !== paramKey && !(act.type === "polygon_shape" && label === "Corner Radius (%)")) {
                return;
            }

            if (!act.params) act.params = {};
            act.params[label] = value;

            if (act.type === "text") {
                const catName = paramKey.replace("Font", "");
                if (label === catName) act.fontFace = value;
                else if (label === "Text Size") act.fontSize = value;
                else if (label === "Bold") act.bold = !!value;
                else if (label === "Italic") act.italic = !!value;
                else if (label === "Text Outline") act.outline = !!value;
                else if (label === "Background Pill") act.bgPill = !!value;
                else if (label === "Bg Opacity (%)") act.bgOpacity = value;

                if (this.activeTextIdx === targetIdx && this.floatingTextarea) {
                    const [scale] = this.getTransformParams();
                    this.floatingTextarea.style.fontFamily = `"${act.fontFace}", sans-serif`;
                    this.floatingTextarea.style.fontSize = `${Math.max(12, Math.round(act.fontSize * scale))}px`;
                    this.floatingTextarea.style.fontWeight = act.bold ? "bold" : "normal";
                    this.floatingTextarea.style.fontStyle = act.italic ? "italic" : "normal";
                    this.floatingTextarea.style.color = act.color;
                    this.autoResizeFloatingTextarea();
                }
            }

            if (act.type === "fill") {
                delete act.cachedCanvas;
            }
            if (targetIdx < minModifiedIdx) minModifiedIdx = targetIdx;
        });

        if (minModifiedIdx !== Infinity) {
            this.invalidateFillsAfter(minModifiedIdx);
        }

        if (isFinalized) {
            this.commitLiveEditSession();
        }
        this.redrawAll();
    }

    getSelectionCenterAndAngle() {
        const valid = this.selectedActionIndices.filter(i => !!this.actions[i]);
        if (valid.length === 0) return [[0, 0], 0];
        if (valid.length === 1) {
            return this.getActionCenterAndAngle(this.actions[valid[0]]);
        }
        const allVerts = [];
        valid.forEach((idx) => {
            allVerts.push(...this.getActionVertices(this.actions[idx]));
        });
        if (!allVerts.length) return [[0, 0], 0];
        const xs = allVerts.map(v => v[0]);
        const ys = allVerts.map(v => v[1]);
        return [[(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2], 0];
    }

    getSelectionLocalBounds() {
        const valid = this.selectedActionIndices.filter(i => !!this.actions[i]);
        if (valid.length === 0) return null;
        if (valid.length === 1) {
            return this.getActionLocalBounds(this.actions[valid[0]]);
        }
        const allVerts = [];
        valid.forEach((idx) => {
            allVerts.push(...this.getActionVertices(this.actions[idx]));
        });
        if (!allVerts.length) return null;
        const xs = allVerts.map(v => v[0]);
        const ys = allVerts.map(v => v[1]);
        const w = Math.max(8, Math.max(...xs) - Math.min(...xs));
        const h = Math.max(8, Math.max(...ys) - Math.min(...ys));
        return [-w / 2, -h / 2, w, h];
    }

    doesActionIntersectRect(act, minX, minY, maxX, maxY) {
        if (!act || act.type === "fill" || act.type === "clear") return false;
        const verts = this.getActionVertices(act);
        if (!verts.length) return false;

        const xs = verts.map(v => v[0]);
        const ys = verts.map(v => v[1]);
        const aMinX = Math.min(...xs), aMaxX = Math.max(...xs);
        const aMinY = Math.min(...ys), aMaxY = Math.max(...ys);

        // Reject if bounding boxes do not overlap
        if (aMaxX < minX || aMinX > maxX || aMaxY < minY || aMinY > maxY) return false;

        // Accept if any vertex is inside the marquee rectangle
        for (const [vx, vy] of verts) {
            if (vx >= minX && vx <= maxX && vy >= minY && vy <= maxY) return true;
        }

        // Accept if any edge of the shape is close to or crosses the marquee rectangle
        const rectCorners = [[minX, minY], [maxX, minY], [maxX, maxY], [minX, maxY]];
        if (verts.length >= 3 && this.pointInPolygon((minX + maxX) / 2, (minY + maxY) / 2, verts)) {
            return true;
        }
        for (let i = 0; i < verts.length; i++) {
            const p1 = verts[i];
            const p2 = verts[(i + 1) % verts.length];
            if (i === verts.length - 1 && act.type === "line" && !act.fill) break;
            for (const [cx, cy] of rectCorners) {
                if (this.distToSegment(cx, cy, p1[0], p1[1], p2[0], p2[1]) <= Math.max(maxX - minX, maxY - minY) * 0.5) {
                    return true;
                }
            }
        }
        return true;
    }




    // ==================================================================
    // ACTION BOUNDS, VERTICES & HIT TESTING
    // ==================================================================
    getActionVertices(action) {
        if (!action || action.type === "fill") return [];
        if (action.type === "line") return action.points || [];
        if (action.type === "polygon_shape") {
            const verts = [];
            for (const polyData of (action.polygons || [])) {
                const [ext, ints] = Array.isArray(polyData[0]) && Array.isArray(polyData[0][0]) ? polyData : [polyData, []];
                verts.push(...ext);
                for (const r of (ints || [])) verts.push(...r);
            }
            return verts;
        }
        if (action.type === "shape") {
            const [cx, cy] = action.center || [0, 0];
            const R = action.radius || 50;
            const angle = action.angle || 0;
            if (action.shape === "Emoji") {
                return paintTransformPts([[-R, -R], [R, -R], [R, R], [-R, R]], cx, cy, angle);
            }
            const localPts = getShapeVertices(action.shape, action.params || {}, R);
            return localPts.length ? paintTransformPts(localPts, cx, cy, angle) : [[cx, cy]];
        }
        if (action.type === "text") {
            const [cx, cy] = action.center || [0, 0];
            const angle = action.angle || 0;
            const bounds = this.getActionLocalBounds(action);
            if (bounds) {
                const [, , lw, lh] = bounds;
                const hw = lw / 2, hh = lh / 2;
                return paintTransformPts([[-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh]], cx, cy, angle);
            }
        }
        return [];
    }

    getActionCenterAndAngle(action) {
        if (action.type === "shape" || action.type === "text") {
            return [action.center || [0, 0], action.angle || 0];
        }
        if (action.type === "fill") {
            return [action.pos || [0, 0], 0];
        }
        if (action.center && action.angle !== undefined) {
            return [action.center, action.angle];
        }
        const verts = this.getActionVertices(action);
        if (verts.length) {
            const xs = verts.map(v => v[0]);
            const ys = verts.map(v => v[1]);
            const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
            const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
            action.center = [cx, cy];
            action.angle = action.angle || 0;
            return [action.center, action.angle];
        }
        return [[0, 0], 0];
    }

    getActionLocalBounds(action) {
        if (!action || action.type === "fill") return null;
        if (action.type === "shape") {
            const R = action.radius || 50;
            let localPts = action.shape === "Emoji"
                ? [[-R, -R], [R, -R], [R, R], [-R, R]]
                : getShapeVertices(action.shape, action.params || {}, R);
            if (!localPts.length) localPts = [[-R, -R], [R, -R], [R, R], [-R, R]];
            const xs = localPts.map(p => p[0]);
            const ys = localPts.map(p => p[1]);
            const minX = Math.min(...xs), maxX = Math.max(...xs);
            const minY = Math.min(...ys), maxY = Math.max(...ys);
            return [minX, minY, maxX - minX, maxY - minY];
        }
        if (action.type === "text") {
            const fontSize = Math.max(8, Math.round(action.fontSize || action.params?.["Text Size"] || 32));
            const fontFace = action.fontFace || "Inter";
            const isBold = !!(action.bold ?? action.params?.["Bold"]);
            const isItalic = !!(action.italic ?? action.params?.["Italic"]);
            const lines = (action.text || "Text").split("\n");

            if (this.ctx) {
                this.ctx.save();
                this.ctx.font = `${isItalic ? "italic " : ""}${isBold ? "bold " : ""}${fontSize}px "${fontFace}", sans-serif`;
                let maxW = 30;
                lines.forEach(l => {
                    const m = this.ctx.measureText(l || " ");
                    if (m.width > maxW) maxW = m.width;
                });
                this.ctx.restore();
                const totalH = lines.length * fontSize * 1.22;
                const padX = 12, padY = 8;
                return [-maxW / 2 - padX, -totalH / 2 - padY, maxW + padX * 2, totalH + padY * 2 - 11];
            }
            return [-60, -25, 120, 50];
        }

        const [[cx, cy], angle] = this.getActionCenterAndAngle(action);
        const verts = this.getActionVertices(action);
        if (!verts.length) return [-10, -10, 20, 20];
        const localPts = verts.map(([vx, vy]) => this.worldToLocal(vx, vy, cx, cy, angle));
        const xs = localPts.map(p => p[0]);
        const ys = localPts.map(p => p[1]);
        const minX = Math.min(...xs), maxX = Math.max(...xs);
        const minY = Math.min(...ys), maxY = Math.max(...ys);
        return [minX, minY, Math.max(4, maxX - minX), Math.max(4, maxY - minY)];
    }

    pointInPolygon(px, py, ring) {
        let inside = false;
        for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
            const xi = ring[i][0], yi = ring[i][1];
            const xj = ring[j][0], yj = ring[j][1];
            const intersect = ((yi > py) !== (yj > py)) && (px < ((xj - xi) * (py - yi)) / (yj - yi + 1e-10) + xi);
            if (intersect) inside = !inside;
        }
        return inside;
    }

    distToSegment(px, py, x1, y1, x2, y2) {
        const dx = x2 - x1, dy = y2 - y1;
        const lenSq = dx * dx + dy * dy;
        let t = lenSq > 0 ? ((px - x1) * dx + (py - y1) * dy) / lenSq : 0;
        t = Math.max(0, Math.min(1, t));
        return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
    }

    hitTestShape(wx, wy) {
        let startIndex = 0;
        for (let i = this.actions.length - 1; i >= 0; i--) {
            if (this.actions[i].type === "clear") {
                startIndex = i + 1;
                break;
            }
        }

        const [scale] = this.getTransformParams();
        const tol = 10.0 / Math.max(0.1, scale);

        for (let i = this.actions.length - 1; i >= startIndex; i--) {
            const act = this.actions[i];
            if (act.type === "fill") continue;

            if (act.type === "text" || (act.type === "shape" && act.shape === "Emoji")) {
                const [[cx, cy], angle] = this.getActionCenterAndAngle(act);
                const bounds = this.getActionLocalBounds(act);
                if (bounds) {
                    const [lx, ly] = this.worldToLocal(wx, wy, cx, cy, angle);
                    if (lx >= bounds[0] - tol && lx <= bounds[0] + bounds[2] + tol &&
                        ly >= bounds[1] - tol && ly <= bounds[1] + bounds[3] + tol) {
                        return i;
                    }
                }
                continue;
            }

            if (act.type === "line") {
                const pts = act.points || [];
                if (act.fill && pts.length >= 3 && this.pointInPolygon(wx, wy, pts)) return i;
                for (let j = 0; j < pts.length - 1; j++) {
                    if (this.distToSegment(wx, wy, pts[j][0], pts[j][1], pts[j + 1][0], pts[j + 1][1]) <= tol + (act.thickness || 2) / 2) {
                        return i;
                    }
                }
                continue;
            }

            if (act.type === "shape") {
                const verts = this.getActionVertices(act);
                if (verts.length >= 3 && this.pointInPolygon(wx, wy, verts)) return i;
                for (let j = 0; j < verts.length; j++) {
                    const nxt = verts[(j + 1) % verts.length];
                    if (this.distToSegment(wx, wy, verts[j][0], verts[j][1], nxt[0], nxt[1]) <= tol) return i;
                }
            } else if (act.type === "polygon_shape") {
                for (const polyData of (act.polygons || [])) {
                    const [ext, ints] = Array.isArray(polyData[0]) && Array.isArray(polyData[0][0]) ? polyData : [polyData, []];
                    if (ext.length >= 3 && this.pointInPolygon(wx, wy, ext)) {
                        let inHole = false;
                        for (const hole of (ints || [])) {
                            if (this.pointInPolygon(wx, wy, hole)) {
                                inHole = true;
                                break;
                            }
                        }
                        if (!inHole) return i;
                    }
                    for (let j = 0; j < ext.length; j++) {
                        const nxt = ext[(j + 1) % ext.length];
                        if (this.distToSegment(wx, wy, ext[j][0], ext[j][1], nxt[0], nxt[1]) <= tol) return i;
                    }
                }
            }
        }
        return null;
    }

    hitTestVertex(action, wx, wy) {
        if (!action || action.type === "fill") return null;
        const [scale] = this.getTransformParams();
        const scaledTol = 14.0 / Math.max(0.1, scale);
        let closest = null;
        let minDist = Infinity;

        if (action.type === "line") {
            (action.points || []).forEach(([vx, vy], idx) => {
                const d = Math.hypot(wx - vx, wy - vy);
                if (d <= scaledTol && d < minDist) {
                    minDist = d;
                    closest = ["line", idx];
                }
            });
        } else if (action.type === "polygon_shape") {
            (action.polygons || []).forEach((polyData, pIdx) => {
                const [ext, ints] = Array.isArray(polyData[0]) && Array.isArray(polyData[0][0]) ? polyData : [polyData, []];
                ext.forEach(([vx, vy], vIdx) => {
                    const d = Math.hypot(wx - vx, wy - vy);
                    if (d <= scaledTol && d < minDist) {
                        minDist = d;
                        closest = ["poly_ext", pIdx, vIdx];
                    }
                });
                (ints || []).forEach((ring, rIdx) => {
                    ring.forEach(([vx, vy], vIdx) => {
                        const d = Math.hypot(wx - vx, wy - vy);
                        if (d <= scaledTol && d < minDist) {
                            minDist = d;
                            closest = ["poly_int", pIdx, rIdx, vIdx];
                        }
                    });
                });
            });
        }
        return closest;
    }

    convertShapeToEditable(idx) {
        const act = this.actions[idx];
        if (!act || act.type === "polygon_shape" || act.type === "fill" || act.type === "text") return;
        if (act.type === "shape" && act.shape !== "Emoji") {
            const [[cx, cy], angle] = this.getActionCenterAndAngle(act);
            const outerLocal = getShapeVertices(act.shape, act.params || {}, act.radius || 50);
            const outerWorld = paintTransformPts(outerLocal, cx, cy, angle);
            const holeLocal = getShapeHoleVertices(act.shape, act.params || {}, act.radius || 50);
            const holesWorld = holeLocal ? [paintTransformPts(holeLocal, cx, cy, angle)] : [];

            if (outerWorld.length >= 3) {
                this.actions[idx] = {
                    type: "polygon_shape",
                    polygons: [[outerWorld, holesWorld]],
                    color: act.color,
                    fillOpacity: act.fillOpacity,
                    thickness: act.thickness,
                    params: { ...(act.params || {}) },
                    center: [cx, cy],
                    angle
                };
            }
        }
    }

    recalculateShapeCenter(action) {
        if (!action || !["line", "polygon_shape"].includes(action.type) || !action.center) return;
        const [cx, cy] = action.center;
        const angle = action.angle || 0;
        const verts = this.getActionVertices(action);
        if (!verts.length) return;

        const cosA = Math.cos(-angle), sinA = Math.sin(-angle);
        const lxs = [], lys = [];
        verts.forEach(([vx, vy]) => {
            const dx = vx - cx, dy = vy - cy;
            lxs.push(dx * cosA - dy * sinA);
            lys.push(dx * sinA + dy * cosA);
        });

        const lcx = (Math.min(...lxs) + Math.max(...lxs)) / 2;
        const lcy = (Math.min(...lys) + Math.max(...lys)) / 2;
        const cosF = Math.cos(angle), sinF = Math.sin(angle);
        action.center = [
            cx + lcx * cosF - lcy * sinF,
            cy + lcx * sinF + lcy * cosF
        ];
    }

    deleteVertexFromShape(action, vInfo) {
        const type = vInfo[0];
        if (type === "line") {
            const idx = vInfo[1];
            if (action.points.length > 2) action.points.splice(idx, 1);
        } else if (type === "poly_ext") {
            const [, pIdx, vIdx] = vInfo;
            const ext = action.polygons[pIdx][0];
            if (ext.length > 3) ext.splice(vIdx, 1);
        } else if (type === "poly_int") {
            const [, pIdx, rIdx, vIdx] = vInfo;
            const ring = action.polygons[pIdx][1][rIdx];
            if (ring.length > 3) ring.splice(vIdx, 1);
            else action.polygons[pIdx][1].splice(rIdx, 1);
        }
    }

    // ==================================================================
    // BOOLEAN POLYGON OPERATIONS (Powered by Lazy-Loaded PolyBoolJS)
    // ==================================================================
    actionToPolyBool(action) {
        if (!action) return null;
        if (action.type === "shape") {
            if (action.shape === "Emoji") return null;
            const [[cx, cy], angle] = this.getActionCenterAndAngle(action);
            const outerLocal = getShapeVertices(action.shape, action.params || {}, action.radius || 50);
            if (outerLocal.length < 3) return null;
            const regions = [paintTransformPts(outerLocal, cx, cy, angle)];
            const holeLocal = getShapeHoleVertices(action.shape, action.params || {}, action.radius || 50);
            if (holeLocal && holeLocal.length >= 3) {
                regions.push(paintTransformPts(holeLocal, cx, cy, angle));
            }
            return { regions, inverted: false };
        }
        if (action.type === "line") {
            if (!action.fill || !action.points || action.points.length < 3) return null;
            return { regions: [action.points.map(([x, y]) => [x, y])], inverted: false };
        }
        if (action.type === "polygon_shape") {
            const regions = [];
            for (const polyData of (action.polygons || [])) {
                const [ext, ints] = Array.isArray(polyData[0]) && Array.isArray(polyData[0][0]) ? polyData : [polyData, []];
                if (ext && ext.length >= 3) regions.push(ext.map(([x, y]) => [x, y]));
                for (const r of (ints || [])) {
                    if (r && r.length >= 3) regions.push(r.map(([x, y]) => [x, y]));
                }
            }
            return regions.length ? { regions, inverted: false } : null;
        }
        return null;
    }

    bboxesOverlap(polyA, polyB) {
        const getBounds = (pb) => {
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            pb.regions.forEach(reg => reg.forEach(([x, y]) => {
                if (x < minX) minX = x; if (x > maxX) maxX = x;
                if (y < minY) minY = y; if (y > maxY) maxY = y;
            }));
            return { minX, minY, maxX, maxY };
        };
        const a = getBounds(polyA), b = getBounds(polyB);
        return !(b.minX > a.maxX || b.maxX < a.minX || b.minY > a.maxY || b.maxY < a.minY);
    }

    async performBooleanOperation(opType = "union", newAction = null) {
        if (opType === "normal") {
            if (newAction) this.actions.push(newAction);
            return;
        }

        if (newAction) {
            if (newAction.shape === "Emoji") {
                this.actions.push(newAction);
                return;
            }
            this.actions.push(newAction);
            this.selectedActionIdx = this.actions.length - 1;
        }

        const PolyBool = await ensurePolyBoolLoaded();
        if (!PolyBool) {
            this.commitPaintChanges();
            this.redrawAll();
            return;
        }

        let startIndex = 0;
        for (let i = this.actions.length - 1; i >= 0; i--) {
            if (this.actions[i].type === "clear") {
                startIndex = i + 1;
                break;
            }
        }

        const validIndices = [];
        const polyMap = new Map();
        for (let i = startIndex; i < this.actions.length; i++) {
            const pb = this.actionToPolyBool(this.actions[i]);
            if (pb && pb.regions.length > 0) {
                validIndices.push(i);
                polyMap.set(i, pb);
            }
        }
        if (validIndices.length < 2) {
            this.commitPaintChanges();
            this.redrawAll();
            return;
        }

        let targetIdx = this.selectedActionIdx;
        if (targetIdx === null || !polyMap.has(targetIdx)) {
            targetIdx = validIndices[validIndices.length - 1];
        }
        const targetAct = this.actions[targetIdx];
        const targetPoly = polyMap.get(targetIdx);

        // Find overlapping shapes
        const overlappingIndices = [];
        for (const idx of validIndices) {
            if (idx === targetIdx) continue;
            const otherPoly = polyMap.get(idx);
            if (!this.bboxesOverlap(targetPoly, otherPoly)) continue;
            try {
                const inter = PolyBool.intersect(targetPoly, otherPoly);
                if (inter && inter.regions && inter.regions.length > 0) {
                    overlappingIndices.push(idx);
                }
            } catch (_) {}
        }

        if (!overlappingIndices.length) {
            this.commitPaintChanges();
            this.redrawAll();
            return;
        }

        try {
            let combinedSources = polyMap.get(overlappingIndices[0]);
            for (let i = 1; i < overlappingIndices.length; i++) {
                combinedSources = PolyBool.union(combinedSources, polyMap.get(overlappingIndices[i]));
            }

            let resultPoly = null;
            let indicesToRemove = [];

            if (opType === "union") {
                resultPoly = PolyBool.union(targetPoly, combinedSources);
                indicesToRemove = [...overlappingIndices, targetIdx].sort((a, b) => b - a);
            } else if (opType === "intersect") {
                resultPoly = PolyBool.intersect(targetPoly, combinedSources);
                indicesToRemove = [...overlappingIndices, targetIdx].sort((a, b) => b - a);
            } else if (opType === "symmetric") {
                resultPoly = PolyBool.xor(targetPoly, combinedSources);
                indicesToRemove = [...overlappingIndices, targetIdx].sort((a, b) => b - a);
            } else if (opType === "subtract") {
                resultPoly = PolyBool.difference(targetPoly, combinedSources);
                indicesToRemove = [...overlappingIndices, targetIdx].sort((a, b) => b - a);
            } else if (opType === "erase") {
                resultPoly = PolyBool.difference(combinedSources, targetPoly);
                indicesToRemove = [...overlappingIndices, targetIdx].sort((a, b) => b - a);
            } else if (opType === "disjoint") {
                resultPoly = PolyBool.difference(targetPoly, combinedSources);
                indicesToRemove = [targetIdx];
            }

            if (resultPoly && resultPoly.regions && resultPoly.regions.length > 0) {
                for (const remIdx of indicesToRemove) {
                    this.actions.splice(remIdx, 1);
                }
                const newShape = {
                    type: "polygon_shape",
                    polygons: resultPoly.regions.map(reg => [reg, []]),
                    color: targetAct.color || this.color,
                    fillOpacity: targetAct.fillOpacity ?? this.fillOpacity,
                    thickness: targetAct.thickness ?? this.thickness,
                    params: { ...(targetAct.params || {}) }
                };
                this.getActionCenterAndAngle(newShape);
                this.actions.push(newShape);
                this.selectedActionIdx = this.actions.length - 1;
                this.invalidateFillsAfter(0);
            } else if (opType === "disjoint" || opType === "erase") {
                for (const remIdx of indicesToRemove) {
                    this.actions.splice(remIdx, 1);
                }
                this.selectedActionIdx = null;
                this.invalidateFillsAfter(0);
            }
        } catch (err) {
            console.warn("Boolean operation error:", err);
        }

        this.commitPaintChanges();
        this.redrawAll();
    }

    // ==================================================================
    // INLINE FLOATING RICH TEXT EDITOR
    // ==================================================================
    openFloatingTextEditor(idx) {
        const act = this.actions[idx];
        if (!act || !this.floatingTextWrap || !this.floatingTextarea) return;

        this.activeTextIdx = idx;
        act.isEditing = true;

        const [sx, sy] = this.worldToScreen(act.center[0], act.center[1]);
        const [scale] = this.getTransformParams();
        const scaledFont = Math.max(12, Math.round((act.fontSize || 32) * scale));

        this.floatingTextWrap.classList.remove("hidden");
        this.floatingTextWrap.style.left = `${Math.round(sx - 90)}px`;
        this.floatingTextWrap.style.top = `${Math.round(sy - scaledFont / 2 - 8)}px`;

        this.floatingTextarea.value = act.text || "";
        this.floatingTextarea.style.fontFamily = `"${act.fontFace || "Inter"}", sans-serif`;
        this.floatingTextarea.style.fontSize = `${scaledFont}px`;
        this.floatingTextarea.style.fontWeight = act.bold ? "bold" : "normal";
        this.floatingTextarea.style.fontStyle = act.italic ? "italic" : "normal";
        this.floatingTextarea.style.color = act.color || this.color;

        this.autoResizeFloatingTextarea();
        setTimeout(() => {
            this.floatingTextarea.focus();
            this.floatingTextarea.select();
        }, 20);

        this.redrawAll();
    }

    autoResizeFloatingTextarea() {
        if (!this.floatingTextarea) return;
        this.floatingTextarea.style.height = "auto";
        this.floatingTextarea.style.width = "auto";
        const w = Math.max(160, Math.min(600, this.floatingTextarea.scrollWidth + 24));
        const h = Math.max(44, this.floatingTextarea.scrollHeight + 8);
        this.floatingTextarea.style.width = `${w}px`;
        this.floatingTextarea.style.height = `${h}px`;
    }

    syncActiveTextWithParams() {
        const targetIdx = this.activeTextIdx !== null ? this.activeTextIdx : this.selectedActionIdx;
        if (targetIdx === null || !this.actions[targetIdx] || this.actions[targetIdx].type !== "text") return;

        const act = this.actions[targetIdx];
        const params = this.savedParams[this.currentShape] || {};
        const catKey = this.currentShape.replace("Font", "");

        if (params[catKey]) act.fontFace = params[catKey];
        if (params["Text Size"] !== undefined) act.fontSize = params["Text Size"];
        if (params["Bold"] !== undefined) act.bold = !!params["Bold"];
        if (params["Italic"] !== undefined) act.italic = !!params["Italic"];
        if (params["Text Outline"] !== undefined) act.outline = !!params["Text Outline"];
        if (params["Background Pill"] !== undefined) act.bgPill = !!params["Background Pill"];
        if (params["Bg Opacity (%)"] !== undefined) act.bgOpacity = params["Bg Opacity (%)"];
        act.color = this.color;

        if (this.activeTextIdx !== null && this.floatingTextarea) {
            const [scale] = this.getTransformParams();
            this.floatingTextarea.style.fontFamily = `"${act.fontFace}", sans-serif`;
            this.floatingTextarea.style.fontSize = `${Math.max(12, Math.round(act.fontSize * scale))}px`;
            this.floatingTextarea.style.fontWeight = act.bold ? "bold" : "normal";
            this.floatingTextarea.style.fontStyle = act.italic ? "italic" : "normal";
            this.floatingTextarea.style.color = act.color;
            this.autoResizeFloatingTextarea();
        }

        this.commitPaintChanges();
        this.redrawAll();
    }

    commitActiveText() {
        if (this.activeTextIdx === null) return;
        const act = this.actions[this.activeTextIdx];
        if (act) {
            act.isEditing = false;
            act.text = this.floatingTextarea ? this.floatingTextarea.value : act.text;
            if (!act.text || !act.text.trim()) {
                this.actions.splice(this.activeTextIdx, 1);
            }
        }
        this.activeTextIdx = null;
        if (this.floatingTextWrap) this.floatingTextWrap.classList.add("hidden");
        this.commitPaintChanges();
        this.redrawAll();
    }

    // ==================================================================
    // CANVAS POINTER, WHEEL & KEYBOARD EVENTS
    // ==================================================================
    bindCanvasEvents() {
        if (!this.canvas) return;

        this.floatingTextarea?.addEventListener("input", () => this.autoResizeFloatingTextarea());
        this.floatingTextarea?.addEventListener("blur", () => this.commitActiveText());
        this.floatingTextarea?.addEventListener("keydown", (e) => {
            if (e.key === "Escape") {
                e.preventDefault();
                this.commitActiveText();
            }
        });

        this.canvas.addEventListener("pointerdown", (e) => this.onPointerDown(e));
        window.addEventListener("pointermove", (e) => this.onPointerMove(e));
        window.addEventListener("pointerup", (e) => this.onPointerUp(e));
        this.canvas.addEventListener("dblclick", (e) => this.onDoubleClick(e));

        this.canvas.addEventListener("pointerenter", () => {
            this.isHoveringCanvas = true;
            this.renderPreviewPanel();
        });
        this.canvas.addEventListener("pointerleave", () => {
            this.isHoveringCanvas = false;
            this.renderPreviewPanel();
        });

        this.canvas.addEventListener("wheel", (e) => {
            e.preventDefault();
            if (e.deltaY < 0) this.zoomFactor *= 1.15;
            else if (e.deltaY > 0) this.zoomFactor /= 1.15;
            this.zoomFactor = Math.max(0.1, Math.min(this.zoomFactor, 30.0));

            const rect = this.canvas.getBoundingClientRect();
            this.currentMouseWorld = this.screenToWorld(e.clientX - rect.left, e.clientY - rect.top);
            this.redrawAll();
            this.renderPreviewPanel();
        }, { passive: false });
    }

    

























    captureOrigGroupState() {
        const [[cx, cy], angle] = this.getSelectionCenterAndAngle();
        const bounds = this.getSelectionLocalBounds();
        if (!bounds) return null;
        const actionsMap = new Map();
        this.selectedActionIndices.forEach((idx) => {
            if (this.actions[idx]) {
                const copy = { ...this.actions[idx] };
                delete copy.cachedCanvas;
                actionsMap.set(idx, JSON.parse(JSON.stringify(copy)));
            }
        });
        return {
            cx,
            cy,
            angle,
            currentAngle: angle,
            bounds: [...bounds],
            actions: actionsMap
        };
    }

    applyBoxResize() {
        if (!this.origGroupState || !this.resizableBox) return;
        const { cx, cy, angle, bounds: origBounds, actions: origMap } = this.origGroupState;
        const [origLx, origLy, origLw, origLh] = origBounds;
        const safeLw = origLw || 0.001, safeLh = origLh || 0.001;
        const { x: newLx, y: newLy, width: newLw, height: newLh } = this.resizableBox;
        const scaleX = newLw / safeLw;
        const scaleY = newLh / safeLh;
        const cosA = Math.cos(angle), sinA = Math.sin(angle);

        const transformLocalPt = ([px, py]) => {
            const dx = px - cx, dy = py - cy;
            const lx = dx * cosA + dy * sinA;
            const ly = -dx * sinA + dy * cosA;
            const slx = newLx + (lx - origLx) * scaleX;
            const sly = newLy + (ly - origLy) * scaleY;
            return [
                cx + slx * cosA - sly * sinA,
                cy + slx * sinA + sly * cosA
            ];
        };

        for (const [idx, origAct] of origMap.entries()) {
            const act = this.actions[idx];
            if (!act) continue;
            const [[actCx, actCy]] = this.getActionCenterAndAngle(origAct);

            if (act.type === "line") {
                act.points = origAct.points.map(pt => transformLocalPt(pt));
                act.center = transformLocalPt([actCx, actCy]);
            } else if (act.type === "polygon_shape") {
                act.polygons = origAct.polygons.map(([ext, ints]) => [
                    ext.map(pt => transformLocalPt(pt)),
                    (ints || []).map(r => r.map(pt => transformLocalPt(pt)))
                ]);
                act.center = transformLocalPt([actCx, actCy]);
            } else if (act.type === "shape") {
                const avgScale = (Math.abs(scaleX) + Math.abs(scaleY)) / 2;
                act.radius = (origAct.radius || 50) * avgScale;
                act.center = transformLocalPt([actCx, actCy]);
            } else if (act.type === "text") {
                const avgScale = (Math.abs(scaleX) + Math.abs(scaleY)) / 2;
                act.fontSize = Math.max(8, (origAct.fontSize || 32) * avgScale);
                act.center = transformLocalPt([actCx, actCy]);
            }
        }
    }

    onPointerDown(e) {
        if (!this.item) return;

        // Middle mouse button or Alt+LeftClick pans the canvas
        if (e.button === 1 || (e.button === 0 && e.altKey)) {
            e.preventDefault();
            this.isPanning = true;
            this.lastPanMouse = [e.clientX, e.clientY];
            this.canvas.setPointerCapture(e.pointerId);
            return;
        }

        if (e.button !== 0) return;
        if (this.activeTextIdx !== null) {
            this.commitActiveText();
            return;
        }

        const rect = this.canvas.getBoundingClientRect();
        const sx = e.clientX - rect.left;
        const sy = e.clientY - rect.top;
        const [wx, wy] = this.screenToWorld(sx, sy);
        const isCtrl = e.ctrlKey || e.metaKey;

        this.isDrawing = true;
        this.hasDragged = false;
        this.isMarqueeSelecting = false;
        this.marqueeRectWorld = null;
        this._handledSelectionOnDown = false;
        this.dragStartScreen = [sx, sy];
        this.dragStartWorld = [wx, wy];

        // 1. Check active ResizableBox handles first (when not Ctrl-clicking to toggle selection)
        if (!isCtrl && this.selectedActionIndices.length > 0 && !this.vertexEditMode) {
            const [[cx, cy], angle] = this.getSelectionCenterAndAngle();
            const bounds = this.getSelectionLocalBounds();
            if (bounds) {
                const [scale] = this.getTransformParams();
                const hs = PAINT_HANDLE_SIZE / Math.max(0.001, scale);
                const pad = 10.0 / Math.max(0.001, scale);
                const box = new PaintResizableBox(bounds[0], bounds[1], bounds[2], bounds[3], hs, pad);
                const [lx, ly] = this.worldToLocal(wx, wy, cx, cy, angle);
                const handleId = box.hitTestHandle(lx, ly);

                if (handleId) {
                    this.beginLiveEditSession();
                    if (
                        this.selectedActionIndices.length === 1 &&
                        handleId !== "rot" &&
                        !["se", "sw", "ne", "nw", "c"].includes(handleId)
                    ) {
                        const singleAct = this.actions[this.selectedActionIdx];
                        if (singleAct?.type === "shape" && singleAct.shape !== "Emoji") {
                            this.convertShapeToEditable(this.selectedActionIdx);
                        }
                    }
                    this.resizableBox = box;
                    this.origGroupState = this.captureOrigGroupState();
                    if (handleId === "rot") {
                        this.isRotatingShape = true;
                    } else {
                        this.resizableBox.startDrag(handleId, [lx, ly]);
                        this.isResizingShape = true;
                    }
                    this.canvas.setPointerCapture(e.pointerId);
                    return;
                }
            }
        }

        // 2. Check Vertex handles if in Vertex Edit Mode
        if (!isCtrl && this.selectedActionIndices.length === 1 && this.vertexEditMode) {
            const act = this.actions[this.selectedActionIdx];
            const vHit = this.hitTestVertex(act, wx, wy);
            if (vHit) {
                this.beginLiveEditSession();
                this.draggingVertexInfo = vHit;
                this.canvas.setPointerCapture(e.pointerId);
                return;
            }
        }

        // 3. Hit test existing objects on the canvas
        const hitIdx = this.hitTestShape(wx, wy);

        // Ctrl+Click on any object toggles it (and its group) in the multi-selection
        if (isCtrl && hitIdx !== null) {
            this.selectActionWithGroup(hitIdx, true);
            this._handledSelectionOnDown = true;
            this.syncPanelToSelectedAction();
            this.isDrawing = false;
            this.redrawAll();
            return;
        }

        // Ctrl+Drag on empty space (or dragging on empty space in Select mode) starts Marquee Selection
        if ((this.maintype === "Select" && hitIdx === null) || (isCtrl && hitIdx === null)) {
            this.isMarqueeSelecting = true;
            this.marqueeAdditive = isCtrl;
            this.marqueeBaseSelection = isCtrl ? [...this.selectedActionIndices] : [];
            if (!isCtrl) {
                this.selectedActionIndices = [];
                this.vertexEditMode = false;
                this.updateParametersUI();
            }
            this.redrawAll();
            this.canvas.setPointerCapture(e.pointerId);
            return;
        }

        // 4. Flood Fill Tool
        if (this.maintype === "Shapes" && this.currentShape === "Fill") {
            this.selectedActionIndices = [];
            this.vertexEditMode = false;
            const fillAct = {
                type: "fill",
                pos: [wx, wy],
                color: this.color,
                params: { ...(this.savedParams["Fill"] || {}) }
            };
            this.saveUndoSnapshot();
            this.actions.push(fillAct);
            this.undoneActions.length = 0;
            this.isDrawing = false;
            this.commitPaintChanges();
            this.redrawAll();
            return;
        }

        // 5. Text Tool Creation or Selection
        if (this.maintype === "Text" && this.currentShape.startsWith("Font")) {
            if (hitIdx !== null && this.actions[hitIdx]?.type === "text") {
                this.selectActionWithGroup(hitIdx, false);
                this._handledSelectionOnDown = true;
                this.syncPanelToSelectedAction();
                this.isDrawing = false;
                this.redrawAll();
                return;
            }

            this.selectedActionIndices = [];
            this.vertexEditMode = false;
            const params = this.savedParams[this.currentShape] || {};
            const catKey = this.currentShape.replace("Font", "");
            const newTextAct = {
                type: "text",
                text: "Text",
                center: [wx, wy],
                angle: 0,
                color: this.color,
                fontFace: params[catKey] || "Inter",
                fontSize: params["Text Size"] || 32,
                bold: !!params["Bold"],
                italic: !!params["Italic"],
                outline: !!params["Text Outline"],
                bgPill: !!params["Background Pill"],
                bgOpacity: params["Bg Opacity (%)"] ?? 85,
                params: { ...params }
            };
            this.saveUndoSnapshot();
            this.actions.push(newTextAct);
            this.undoneActions.length = 0;
            this.isDrawing = false;
            this.openFloatingTextEditor(this.actions.length - 1);
            return;
        }

        // 6. Standard Object Hit or Shape Drawing Start
        if (hitIdx !== null) {
            if (!this.selectedActionIndices.includes(hitIdx)) {
                this.selectActionWithGroup(hitIdx, false);
                this.syncPanelToSelectedAction();
            }
            this._handledSelectionOnDown = true;

            // In Select mode, dragging anywhere on a selected object moves the whole selection
            if (this.maintype === "Select" && !this.vertexEditMode) {
                const [[cx, cy], angle] = this.getSelectionCenterAndAngle();
                const bounds = this.getSelectionLocalBounds();
                if (bounds) {
                    this.beginLiveEditSession();
                    const [scale] = this.getTransformParams();
                    const hs = PAINT_HANDLE_SIZE / Math.max(0.001, scale);
                    const pad = 10.0 / Math.max(0.001, scale);
                    const box = new PaintResizableBox(bounds[0], bounds[1], bounds[2], bounds[3], hs, pad);
                    const [lx, ly] = this.worldToLocal(wx, wy, cx, cy, angle);
                    this.resizableBox = box;
                    this.origGroupState = this.captureOrigGroupState();
                    this.resizableBox.startDrag("c", [lx, ly]);
                    this.isResizingShape = true;
                }
            }
        } else {
            this.selectedActionIndices = [];
            this.vertexEditMode = false;
            if (this.maintype === "Select") this.updateParametersUI();
        }
        this.redrawAll();

        if (this.maintype === "Shapes" && this.currentShape === "Line") {
            this.strokePoints = [[wx, wy]];
            this.lastStrokePos = [wx, wy];
        }

        this.canvas.setPointerCapture(e.pointerId);
    }

    onPointerMove(e) {
        if (!this.canvas || this.app.activeTab !== "tabPaint") return;

        // Clear temporary font preview overlay as soon as mouse moves into the image canvas
        if (this.isHoveringCanvas && this.fontPreviewState) {
            this.fontPreviewState = null;
            this.redrawAll();
        }

        if (this.isPanning) {
            const dx = e.clientX - this.lastPanMouse[0];
            const dy = e.clientY - this.lastPanMouse[1];
            this.panX += dx;
            this.panY += dy;
            this.lastPanMouse = [e.clientX, e.clientY];
            this.redrawAll();
            return;
        }

        const rect = this.canvas.getBoundingClientRect();
        const sx = e.clientX - rect.left;
        const sy = e.clientY - rect.top;
        let [wx, wy] = this.screenToWorld(sx, sy);
        this.currentMouseWorld = [wx, wy];

        if (this.isHoveringCanvas) {
            this.renderPreviewPanel();
        }

        if (!this.isDrawing) return;

        if (Math.hypot(sx - this.dragStartScreen[0], sy - this.dragStartScreen[1]) > 5) {
            this.hasDragged = true;
        }

        // 0. Marquee Drag-Box Selection
        if (this.isMarqueeSelecting) {
            const [startWx, startWy] = this.dragStartWorld;
            const minX = Math.min(startWx, wx), maxX = Math.max(startWx, wx);
            const minY = Math.min(startWy, wy), maxY = Math.max(startWy, wy);
            this.marqueeRectWorld = [minX, minY, maxX - minX, maxY - minY];

            const startIdx = this.getStartIndexAfterClear();
            const nextSel = new Set(this.marqueeBaseSelection);
            for (let i = startIdx; i < this.actions.length; i++) {
                if (this.doesActionIntersectRect(this.actions[i], minX, minY, maxX, maxY)) {
                    for (const peerIdx of this.getGroupPeerIndices(i)) {
                        nextSel.add(peerIdx);
                    }
                }
            }
            this.selectedActionIndices = Array.from(nextSel).sort((a, b) => a - b);
            this.redrawAll();
            return;
        }

        // 1. Resizing / Moving via ResizableBox (Single or Multi-Selection)
        if (this.isResizingShape && this.resizableBox && this.origGroupState) {
            const { cx, cy, angle } = this.origGroupState;
            const [lx, ly] = this.worldToLocal(wx, wy, cx, cy, angle);
            this.resizableBox.updateDrag([lx, ly]);
            this.applyBoxResize();
            this.redrawAll();
            return;
        }

        // 2. Rotating via ResizableBox 'rot' pin (Single or Multi-Selection)
        if (this.isRotatingShape && this.origGroupState) {
            const { cx, cy, angle: origGroupAngle, actions: origMap } = this.origGroupState;
            const startAng = Math.atan2(this.dragStartWorld[1] - cy, this.dragStartWorld[0] - cx);
            const currAng = Math.atan2(wy - cy, wx - cx);
            const diff = currAng - startAng;
            this.origGroupState.currentAngle = origGroupAngle + diff;

            for (const [idx, origAct] of origMap.entries()) {
                const act = this.actions[idx];
                if (!act) continue;
                const [[actCx, actCy], actOrigAngle] = this.getActionCenterAndAngle(origAct);
                act.center = paintRotatePt(actCx, actCy, cx, cy, diff);
                act.angle = (actOrigAngle || 0) + diff;

                if (act.type === "line") {
                    act.points = origAct.points.map(([px, py]) => paintRotatePt(px, py, cx, cy, diff));
                } else if (act.type === "polygon_shape") {
                    act.polygons = origAct.polygons.map(([ext, ints]) => [
                        ext.map(([vx, vy]) => paintRotatePt(vx, vy, cx, cy, diff)),
                        (ints || []).map(r => r.map(([vx, vy]) => paintRotatePt(vx, vy, cx, cy, diff)))
                    ]);
                }
            }
            this.redrawAll();
            return;
        }

        // 3. Dragging Individual Vertex
        if (this.draggingVertexInfo && this.selectedActionIdx !== null) {
            const act = this.actions[this.selectedActionIdx];
            const info = this.draggingVertexInfo;
            if (info[0] === "line") {
                act.points[info[1]] = [wx, wy];
            } else if (info[0] === "poly_ext") {
                act.polygons[info[1]][0][info[2]] = [wx, wy];
            } else if (info[0] === "poly_int") {
                act.polygons[info[1]][1][info[2]][info[3]] = [wx, wy];
            }
            this.redrawAll();
            return;
        }

        if (this.maintype !== "Shapes" || !this.hasDragged) return;

        if (this.selectedActionIndices.length > 0) {
            this.selectedActionIndices = [];
            this.vertexEditMode = false;
        }

        // 4. Live Freehand / Snapped Line Drawing
        if (this.currentShape === "Line") {
            const params = this.savedParams["Line"] || {};
            const selAngle = params["Line Angles"] || "Freehand";
            const angleSteps = {
                "30° Snap": Math.PI / 6,
                "45° Snap": Math.PI / 4,
                "90° Snap": Math.PI / 2
            };
            const step = angleSteps[selAngle];

            if (step && this.strokePoints.length > 0) {
                const [ax, ay] = this.strokePoints[this.strokePoints.length - 1];
                const dx = wx - ax, dy = wy - ay;
                const dist = Math.hypot(dx, dy);
                if (dist > 0) {
                    const snapped = Math.round(Math.atan2(dy, dx) / step) * step;
                    wx = ax + dist * Math.cos(snapped);
                    wy = ay + dist * Math.sin(snapped);
                }
            }

            const minDist = params["Minimum Distance"] ?? 12;
            const minDistSq = minDist > 0 ? minDist * minDist : 1;
            if (this.lastStrokePos) {
                const dx = wx - this.lastStrokePos[0], dy = wy - this.lastStrokePos[1];
                if (dx * dx + dy * dy >= minDistSq) {
                    this.strokePoints.push([wx, wy]);
                    this.lastStrokePos = [wx, wy];
                }
            }

            this.redrawAll();
            this.drawLivePreviewStroke(wx, wy);
        } else {
            // 5. Live Parametric Shape Dragging
            this.redrawAll();
            this.drawLivePreviewShape(wx, wy);
        }
    }

    drawLivePreviewStroke(wx, wy) {
        if (!this.ctx) return;
        const [scale, ox, oy] = this.getTransformParams();
        const pts = [...this.strokePoints];
        if (!pts.length || pts[pts.length - 1][0] !== wx || pts[pts.length - 1][1] !== wy) {
            pts.push([wx, wy]);
        }

        this.ctx.save();
        this.ctx.translate(ox, oy);
        this.ctx.scale(scale, scale);
        drawCanvasLine(this.ctx, pts, this.savedParams["Line"] || {}, this.color, this.thickness);

        // Start-point snap ring indicator
        const [fx, fy] = pts[0];
        const r = 6.0 / Math.max(0.001, scale);
        this.ctx.beginPath();
        this.ctx.arc(fx, fy, r, 0, Math.PI * 2);
        this.ctx.fillStyle = "#ffffff";
        this.ctx.fill();
        this.ctx.strokeStyle = "#000000";
        this.ctx.lineWidth = 1.2 / Math.max(0.001, scale);
        this.ctx.stroke();
        this.ctx.restore();
    }

    drawLivePreviewShape(wx, wy) {
        if (!this.ctx) return;
        const [sx, sy] = this.dragStartWorld;
        let cx = sx, cy = sy, R = 0, angle = 0;

        if (this.currentShape === "Arrow") {
            const dx = wx - sx, dy = wy - sy;
            R = Math.hypot(dx, dy) / 2;
            cx = sx + dx / 2;
            cy = sy + dy / 2;
            angle = Math.atan2(dy, dx);
        } else {
            const dx = wx - cx, dy = wy - cy;
            R = Math.hypot(dx, dy);
            angle = this.polarRotation ? Math.atan2(dy, dx) : 0;
        }
        if (R <= 1) return;

        const [scale, ox, oy] = this.getTransformParams();
        const params = this.savedParams[this.currentShape] || {};

        this.ctx.save();
        this.ctx.translate(ox, oy);
        this.ctx.scale(scale, scale);
        this.ctx.translate(cx, cy);
        this.ctx.rotate(angle);

        if (this.currentShape === "Emoji") {
            drawEmojiOnContext(this.ctx, params["Emoji"] || "🙂", Math.max(14, R * 1.4), !!params["Grayscale"]);
        } else {
            traceShapePathOnContext(this.ctx, this.currentShape, params, R);
            this.ctx.fillStyle = hexToRgba(this.color, this.fillOpacity / 100.0);
            this.ctx.fill("evenodd");
            this.ctx.strokeStyle = this.color;
            this.ctx.lineWidth = this.thickness;
            this.ctx.stroke();
        }
        this.ctx.restore();
    }

    async onPointerUp(e) {
        if (this.isPanning) {
            this.isPanning = false;
            try { this.canvas.releasePointerCapture(e.pointerId); } catch (_) {}
            return;
        }

        if (!this.isDrawing) return;
        this.isDrawing = false;
        try { this.canvas.releasePointerCapture(e.pointerId); } catch (_) {}

        if (this.isMarqueeSelecting) {
            this.isMarqueeSelecting = false;
            this.marqueeRectWorld = null;
            this._preEditSnapshot = null;
            this.syncPanelToSelectedAction();
            this.redrawAll();
            return;
        }

        if (this.isRotatingShape) {
            this.isRotatingShape = false;
            this.origGroupState = null;
            if (this.selectedActionIndices.length > 0) {
                this.invalidateFillsAfter(Math.min(...this.selectedActionIndices));
            }
            if (this.hasDragged) this.commitLiveEditSession();
            else this._preEditSnapshot = null;
            this.redrawAll();
            return;
        }

        if (this.isResizingShape) {
            if (this.resizableBox) this.resizableBox.stopDrag();
            this.isResizingShape = false;
            this.origGroupState = null;
            if (this.selectedActionIndices.length > 0) {
                this.invalidateFillsAfter(Math.min(...this.selectedActionIndices));
            }
            if (this.hasDragged) this.commitLiveEditSession();
            else this._preEditSnapshot = null;
            this.redrawAll();
            return;
        }

        if (this.draggingVertexInfo) {
            if (this.selectedActionIdx !== null && this.actions[this.selectedActionIdx]) {
                this.recalculateShapeCenter(this.actions[this.selectedActionIdx]);
                this.invalidateFillsAfter(this.selectedActionIdx);
            }
            this.draggingVertexInfo = null;
            this.commitLiveEditSession();
            this.redrawAll();
            return;
        }

        const rect = this.canvas.getBoundingClientRect();
        const [wx, wy] = this.screenToWorld(e.clientX - rect.left, e.clientY - rect.top);

        if (!this.hasDragged) {
            this._preEditSnapshot = null;
            const hitIdx = this.hitTestShape(wx, wy);
            if (hitIdx !== null) {
                if (!this._handledSelectionOnDown) {
                    this.selectActionWithGroup(hitIdx, e.ctrlKey || e.metaKey);
                }
                this.syncPanelToSelectedAction();
            } else {
                this.selectedActionIndices = [];
                this.vertexEditMode = false;
                if (this.maintype === "Shapes" && this.currentShape !== "Line" && this.currentShape !== "Fill") {
                    const action = {
                        type: "shape",
                        shape: this.currentShape,
                        center: [wx, wy],
                        radius: 65,
                        angle: 0,
                        color: this.color,
                        fillOpacity: this.fillOpacity,
                        thickness: this.thickness,
                        params: { ...(this.savedParams[this.currentShape] || {}) }
                    };
                    this.undoneActions.length = 0;
                    this.saveUndoSnapshot();
                    await this.performBooleanOperation(this.polyMode, action);
                    this.selectedActionIndices = [this.actions.length - 1];
                    this.syncPanelToSelectedAction();
                    this.commitPaintChanges();
                }
            }
            this.redrawAll();
            return;
        }

        if (this.maintype !== "Shapes") return;

        if (this.currentShape === "Line") {
            const pts = [...this.strokePoints];
            if (!pts.length || pts[pts.length - 1][0] !== wx || pts[pts.length - 1][1] !== wy) {
                pts.push([wx, wy]);
            }
            if (pts.length >= 2) {
                let fillPoly = false;
                if (pts.length >= 3) {
                    const [scale] = this.getTransformParams();
                    const d = Math.hypot(pts[0][0] - pts[pts.length - 1][0], pts[0][1] - pts[pts.length - 1][1]);
                    if (d < 15.0 / Math.max(0.1, scale)) fillPoly = true;
                }
                const action = {
                    type: "line",
                    points: pts,
                    color: this.color,
                    fillOpacity: this.fillOpacity,
                    thickness: this.thickness,
                    params: { ...(this.savedParams["Line"] || {}) },
                    fill: fillPoly
                };
                this.undoneActions.length = 0;
                this.saveUndoSnapshot();
                await this.performBooleanOperation(this.polyMode, action);
                this.selectedActionIndices = [this.actions.length - 1];
                this.syncPanelToSelectedAction();
                this.commitPaintChanges();
            }
        } else {
            const [sx, sy] = this.dragStartWorld;
            let cx = sx, cy = sy, R = 0, angle = 0;
            if (this.currentShape === "Arrow") {
                const dx = wx - sx, dy = wy - sy;
                R = Math.hypot(dx, dy) / 2;
                cx = sx + dx / 2;
                cy = sy + dy / 2;
                angle = Math.atan2(dy, dx);
            } else {
                const dx = wx - cx, dy = wy - cy;
                R = Math.hypot(dx, dy);
                angle = this.polarRotation ? Math.atan2(dy, dx) : 0;
            }
            if (R > 3) {
                const action = {
                    type: "shape",
                    shape: this.currentShape,
                    center: [cx, cy],
                    radius: R,
                    angle,
                    color: this.color,
                    fillOpacity: this.fillOpacity,
                    thickness: this.thickness,
                    params: { ...(this.savedParams[this.currentShape] || {}) }
                };
                this.undoneActions.length = 0;
                this.saveUndoSnapshot();
                await this.performBooleanOperation(this.polyMode, action);
                this.selectedActionIndices = [this.actions.length - 1];
                this.syncPanelToSelectedAction();
                this.commitPaintChanges();
            }
        }

        this.redrawAll();
    }

    onDoubleClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const [wx, wy] = this.screenToWorld(e.clientX - rect.left, e.clientY - rect.top);
        const hitIdx = this.hitTestShape(wx, wy);
        if (hitIdx !== null) {
            const act = this.actions[hitIdx];
            if (act.type === "text") {
                this.openFloatingTextEditor(hitIdx);
                return;
            }
            this.saveUndoSnapshot();
            this.convertShapeToEditable(hitIdx);
            this.selectedActionIndices = [hitIdx];
            this.vertexEditMode = true;
            this.commitPaintChanges();
            this.updateParametersUI();
            this.redrawAll();
        }
    }

    handleKeyDown(e) {
        if (this.activeTextIdx !== null) return false;

        const ctrl = e.ctrlKey || e.metaKey;
        const shift = e.shiftKey;
        const key = e.key.toLowerCase();

        if (ctrl && key === "z") {
            e.preventDefault();
            if (shift) this.redo();
            else this.undo();
            return true;
        }
        if (ctrl && key === "y") {
            e.preventDefault();
            this.redo();
            return true;
        }

        // Select All Paint Objects (Ctrl+A) when Paint tab is active
        if (ctrl && !shift && key === "a") {
            e.preventDefault();
            this.selectAllActions();
            return true;
        }
        // Group (Ctrl+G) and Ungroup (Ctrl+Shift+G)
        if (ctrl && key === "g") {
            e.preventDefault();
            if (shift) this.ungroupSelectedActions();
            else this.groupSelectedActions();
            return true;
        }

        // Copy (Ctrl+C) and Paste (Ctrl+V)
        if (ctrl && key === "c") {
            if (this.selectedActionIndices.length > 0) {
                e.preventDefault();
                this.copySelectedActions();
                return true;
            }
        }
        if (ctrl && key === "v") {
            if (this.clipboard && this.clipboard.length > 0) {
                e.preventDefault();
                this.pasteClipboardActions();
                return true;
            }
        }

        // Boolean operation shortcuts: Ctrl+U, Ctrl+I, Ctrl+S, Ctrl+E, Ctrl+D
        const boolShortcuts = { u: "union", i: "intersect", s: "symmetric", e: "erase", d: "disjoint" };
        if (ctrl && !shift && boolShortcuts[key]) {
            e.preventDefault();
            this.performBooleanOperation(boolShortcuts[key], null);
            return true;
        }

        if (e.key === "Delete" || e.key === "Backspace") {
            if (this.selectedActionIndices.length > 0) {
                e.preventDefault();
                if (!this.vertexEditMode) {
                    this.deleteSelectedActions();
                } else if (this.selectedActionIdx !== null) {
                    const idx = this.selectedActionIdx;
                    const act = this.actions[idx];
                    const [mx, my] = this.currentMouseWorld;
                    const vHit = this.hitTestVertex(act, mx, my);
                    if (vHit) {
                        this.saveUndoSnapshot();
                        this.deleteVertexFromShape(act, vHit);
                        this.invalidateFillsAfter(idx);
                        this.commitPaintChanges();
                        this.redrawAll();
                    }
                }
                return true;
            }
        }
        return false;
    }

    // ==================================================================
    // STAGE SYNC & FULL CANVAS REDRAW
    // ==================================================================
    syncWithActiveItem() {
        ensurePolyBoolLoaded();
        this.commitActiveText();
        const itm = this.item;
        if (!itm) return;

        // Build clean effects-only background canvas (before paint actions)
        const src = itm.getEffectsOnlySource ? itm.getEffectsOnlySource() : itm.imgElement;
        if (src) {
            this.origW = src.naturalWidth || src.videoWidth || src.width || itm.w || 1920;
            this.origH = src.naturalHeight || src.videoHeight || src.height || itm.h || 1080;
            const cvs = document.createElement("canvas");
            cvs.width = this.origW;
            cvs.height = this.origH;
            cvs.getContext("2d").drawImage(src, 0, 0, this.origW, this.origH);
            this.bgCanvas = cvs;
        }

        this.selectedActionIndices = [];
        this.vertexEditMode = false;
        this.resizeMainCanvas();
        this.redrawAll();
        this.renderPreviewPanel();
    }

    resizeMainCanvas() {
        if (!this.canvas || !this.canvasWrap) return;
        const w = Math.max(300, this.canvasWrap.clientWidth - 4);
        const h = Math.max(200, this.canvasWrap.clientHeight - 4);
        if (this.canvas.width !== w || this.canvas.height !== h) {
            this.canvas.width = w;
            this.canvas.height = h;
        }
    }

    redrawAll() {
        if (!this.ctx || !this.canvas) return;
        this.resizeMainCanvas();

        const ctx = this.ctx;
        const cw = this.canvas.width;
        const ch = this.canvas.height;

        ctx.fillStyle = "#0b0f19";
        ctx.fillRect(0, 0, cw, ch);

        if (!this.bgCanvas) return;

        const [scale, ox, oy] = this.getTransformParams();
        ctx.save();
        ctx.translate(ox, oy);
        ctx.scale(scale, scale);

        ctx.drawImage(this.bgCanvas, 0, 0, this.origW, this.origH);

        let startIndex = 0;
        for (let i = this.actions.length - 1; i >= 0; i--) {
            if (this.actions[i].type === "clear") {
                startIndex = i + 1;
                break;
            }
        }

        for (let i = startIndex; i < this.actions.length; i++) {
            const act = this.actions[i];
            if (act.type === "fill") {
                if (!act.cachedCanvas) {
                    act.cachedCanvas = computeFloodFillLayer(this.bgCanvas, this.actions, i);
                }
                if (act.cachedCanvas) {
                    ctx.drawImage(act.cachedCanvas, 0, 0, this.origW, this.origH);
                }
            } else {
                drawSinglePaintAction(ctx, act);
            }
        }

        // Render temporary font preview in center of image if active
        if (this.fontPreviewState) {
            drawSinglePaintAction(ctx, this.fontPreviewState);
        }

        // Draw Marquee Drag-Selection Box if active
        if (this.isMarqueeSelecting && this.marqueeRectWorld) {
            const [mx, my, mw, mh] = this.marqueeRectWorld;
            ctx.save();
            ctx.fillStyle = "rgba(56, 189, 248, 0.14)";
            ctx.strokeStyle = "#38bdf8";
            ctx.lineWidth = Math.max(1, 1.5 / scale);
            ctx.setLineDash([5 / scale, 4 / scale]);
            ctx.fillRect(mx, my, mw, mh);
            ctx.strokeRect(mx, my, mw, mh);
            ctx.restore();
        }

        // Draw Selection / Vertex Edit Overlays
        const validSelected = this.selectedActionIndices.filter(i => !!this.actions[i]);
        if (validSelected.length > 0) {
            const primaryAct = this.actions[validSelected[validSelected.length - 1]];
            if (primaryAct.isEditing) {
                // Skip box while inline textarea is open
            } else if (validSelected.length === 1 && this.vertexEditMode) {
                const act = primaryAct;
                const verts = this.getActionVertices(act);
                if (verts.length) {
                    const xs = verts.map(v => v[0]);
                    const ys = verts.map(v => v[1]);
                    const minX = Math.min(...xs), maxX = Math.max(...xs);
                    const minY = Math.min(...ys), maxY = Math.max(...ys);

                    ctx.save();
                    ctx.strokeStyle = "rgba(255, 160, 0, 0.85)";
                    ctx.lineWidth = Math.max(1, 2 / scale);
                    ctx.setLineDash([4 / scale, 4 / scale]);
                    ctx.strokeRect(minX - 4 / scale, minY - 4 / scale, (maxX - minX) + 8 / scale, (maxY - minY) + 8 / scale);
                    ctx.setLineDash([]);

                    const hs = 8 / scale;
                    ctx.fillStyle = "#ffe600";
                    ctx.strokeStyle = "#ff1e1e";
                    ctx.lineWidth = Math.max(1, 1.8 / scale);
                    verts.forEach(([vx, vy]) => {
                        ctx.fillRect(vx - hs / 2, vy - hs / 2, hs, hs);
                        ctx.strokeRect(vx - hs / 2, vy - hs / 2, hs, hs);
                    });

                    // Live vertex interior angle readout while dragging
                    if (this.draggingVertexInfo) {
                        const info = this.draggingVertexInfo;
                        let pts = [], vIdx = -1, isClosed = true;
                        if (info[0] === "line") {
                            pts = act.points; vIdx = info[1]; isClosed = !!act.fill;
                        } else if (info[0] === "poly_ext") {
                            pts = act.polygons[info[1]][0]; vIdx = info[2];
                        } else if (info[0] === "poly_int") {
                            pts = act.polygons[info[1]][1][info[2]]; vIdx = info[3];
                        }
                        if (pts && vIdx >= 0 && vIdx < pts.length) {
                            const deg = paintCalculateVertexAngle(pts, vIdx, isClosed);
                            if (deg !== null) {
                                const [vx, vy] = pts[vIdx];
                                const labelStr = `${deg.toFixed(1)}°`;
                                const fSize = Math.max(10, Math.round(13 / scale));
                                ctx.font = `bold ${fSize}px Inter, sans-serif`;
                                const tw = ctx.measureText(labelStr).width;
                                const tx = vx + 12 / scale;
                                const ty = vy - 22 / scale;

                                ctx.fillStyle = "rgba(15, 23, 42, 0.88)";
                                ctx.strokeStyle = "#ffe600";
                                ctx.lineWidth = 1.2 / scale;
                                ctx.beginPath();
                                ctx.roundRect(tx - 4 / scale, ty - 2 / scale, tw + 8 / scale, fSize + 6 / scale, 4 / scale);
                                ctx.fill();
                                ctx.stroke();

                                ctx.fillStyle = "#ffe600";
                                ctx.textBaseline = "top";
                                ctx.fillText(labelStr, tx, ty);
                            }
                        }
                    }
                    ctx.restore();
                }
            } else {
                // Highlight individual member bounds when multiple objects are selected
                if (validSelected.length > 1) {
                    ctx.save();
                    ctx.strokeStyle = "rgba(56, 189, 248, 0.45)";
                    ctx.lineWidth = Math.max(1, 1.2 / scale);
                    ctx.setLineDash([3 / scale, 3 / scale]);
                    validSelected.forEach((idx) => {
                        const member = this.actions[idx];
                        const [[mcx, mcy], mAngle] = this.getActionCenterAndAngle(member);
                        const mBounds = this.getActionLocalBounds(member);
                        if (mBounds) {
                            ctx.save();
                            ctx.translate(mcx, mcy);
                            ctx.rotate(mAngle);
                            ctx.strokeRect(mBounds[0], mBounds[1], mBounds[2], mBounds[3]);
                            ctx.restore();
                        }
                    });
                    ctx.restore();
                }

                // Draw Shared ResizableBox
                if ((!this.isResizingShape && !this.isRotatingShape) || !this.origGroupState) {
                    const [[cx, cy], angle] = this.getSelectionCenterAndAngle();
                    const bounds = this.getSelectionLocalBounds();
                    if (bounds) {
                        const hs = PAINT_HANDLE_SIZE / Math.max(0.001, scale);
                        const pad = 10.0 / Math.max(0.001, scale);
                        const box = new PaintResizableBox(bounds[0], bounds[1], bounds[2], bounds[3], hs, pad);
                        ctx.save();
                        ctx.translate(cx, cy);
                        ctx.rotate(angle);
                        box.draw(ctx, scale);
                        ctx.restore();
                    }
                } else if (this.origGroupState) {
                    const box = this.resizableBox;
                    if (box) {
                        box.handleSize = PAINT_HANDLE_SIZE / Math.max(0.001, scale);
                        box.hitPadding = 10.0 / Math.max(0.001, scale);
                        const drawAngle = this.isRotatingShape
                            ? (this.origGroupState.currentAngle ?? this.origGroupState.angle)
                            : this.origGroupState.angle;
                        ctx.save();
                        ctx.translate(this.origGroupState.cx, this.origGroupState.cy);
                        ctx.rotate(drawAngle);
                        box.draw(ctx, scale);
                        ctx.restore();
                    }
                }
            }
        }

        ctx.restore();
    }
}

window.PhotoPaintEditor = PhotoPaintEditor;
