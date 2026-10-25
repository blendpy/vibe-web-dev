"use strict";

// ======================================================================
// VIDEO PROJECT SETTINGS & EXPORT MANAGER
// Handles Resolution, Presets, Orientation, FPS, Export Modal & HTML Save
// ======================================================================

class VideoSettingsManager {
    constructor(app) {
        this.app = app;

        // Current Master Settings State
        this.opts = {
            out_w: 1920,
            out_h: 1080,
            isLandscape: true,
            fps: 30
        };

        this.savedSnapshot = null;
        this.updatingLive = false;

        // Platform & Broadcast Templates [Label, [Width, Height]]
        this.landscapeTemplates = [
            ["Custom Size", null],
            ["1080p Full HD (1920 × 1080) — 16:9", [1920, 1080]],
            ["4K Ultra HD (3840 × 2160) — 16:9", [3840, 2160]],
            ["720p HD (1280 × 720) — 16:9", [1280, 720]],
            ["4:3 Classic TV (1440 × 1080)", [1440, 1080]],
            ["21:9 Ultrawide Cinema (2560 × 1080)", [2560, 1080]]
        ];

        this.portraitTemplates = [
            ["Custom Size", null],
            ["1080 × 1920 — Shorts / TikTok / Reels (9:16)", [1080, 1920]],
            ["720 × 1280 — Mobile Vertical (9:16)", [720, 1280]],
            ["1080 × 1350 — Social Portrait (4:5)", [1080, 1350]],
            ["1080 × 1080 — Square Post (1:1)", [1080, 1080]]
        ];

        this.currentTemplates = this.landscapeTemplates;

        this.initSettingsBindings();
        this.initExportBindings();
        this.updateHeaderBadge();

        // Automatically restore saved project if this page was opened from a saved HTML file
        setTimeout(() => {
            this.restoreSavedProjectIfPresent();
        }, 0);
    }

    // ==================================================================
    // PART 1: PROJECT SETTINGS MODAL
    // ==================================================================

    initSettingsBindings() {
        document.getElementById("btnSettings")?.addEventListener("click", () => this.openModal());
        document.getElementById("btnSettingsCancel")?.addEventListener("click", () => this.cancelModal());
        document.getElementById("btnSettingsOk")?.addEventListener("click", () => this.applyModal());

        const onSizeInput = () => {
            if (!this.updatingLive) {
                const etrW = document.getElementById("etrVideoW");
                const etrH = document.getElementById("etrVideoH");
                const chk = document.getElementById("chkVideoLandscape");
                const w = parseInt(etrW?.value, 10);
                const h = parseInt(etrH?.value, 10);

                if (!isNaN(w) && !isNaN(h) && chk) {
                    const shouldBeLandscape = w >= h;
                    if (chk.checked !== shouldBeLandscape) {
                        chk.checked = shouldBeLandscape;
                        this.updateTemplatesDropdown();
                    }
                }
                this.syncReadouts();
                this.checkMatchingTemplate();
            }
        };
        document.getElementById("etrVideoW")?.addEventListener("input", onSizeInput);
        document.getElementById("etrVideoH")?.addEventListener("input", onSizeInput);

        document.getElementById("cmbVideoTemplate")?.addEventListener("change", (e) => {
            const cmb = e.target;
            const idx = cmb.selectedIndex;
            if (idx >= 0 && idx < this.currentTemplates.length) {
                const dims = this.currentTemplates[idx][1];
                if (dims) {
                    this.updatingLive = true;
                    const etrW = document.getElementById("etrVideoW");
                    const etrH = document.getElementById("etrVideoH");
                    if (etrW) etrW.value = String(dims[0]);
                    if (etrH) etrH.value = String(dims[1]);
                    this.updatingLive = false;
                    this.syncReadouts();
                }
                this.checkMatchingTemplate();
            }
        });

        document.getElementById("chkVideoLandscape")?.addEventListener("change", () => {
            this.updateTemplatesDropdown();
            this.enforceOrientation();
            this.syncReadouts();
            this.checkMatchingTemplate();
        });

        document.getElementById("btnFps30")?.addEventListener("click", () => this.setFramerate(30));
        document.getElementById("btnFps60")?.addEventListener("click", () => this.setFramerate(60));

        const modal = document.getElementById("settingsModal");
        modal?.addEventListener("click", (e) => {
            if (e.target === modal) this.cancelModal();
        });
    }

    setFramerate(fps) {
        this.opts.fps = fps;
        const activeCls = "px-3 py-1 rounded text-xs font-bold bg-blue-600 text-white shadow-sm transition";
        const inactiveCls = "px-3 py-1 rounded text-xs font-semibold text-slate-600 hover:text-slate-900 transition";

        const btn30 = document.getElementById("btnFps30");
        const btn60 = document.getElementById("btnFps60");
        if (btn30 && btn60) {
            btn30.className = fps === 30 ? activeCls : inactiveCls;
            btn60.className = fps === 60 ? activeCls : inactiveCls;
        }
    }

    gcd(a, b) {
        return b === 0 ? a : this.gcd(b, a % b);
    }

    syncReadouts() {
        const etrW = document.getElementById("etrVideoW");
        const etrH = document.getElementById("etrVideoH");
        const w = parseInt(etrW?.value, 10) || 1920;
        const h = parseInt(etrH?.value, 10) || 1080;

        const divisor = this.gcd(w, h);
        const rW = Math.round(w / divisor);
        const rH = Math.round(h / divisor);
        const ratioDec = (w / h).toFixed(2);

        const lblAspect = document.getElementById("lblSettingsAspect");
        if (lblAspect) {
            let label = `${rW}:${rH} (${ratioDec}:1)`;
            if (Math.abs(w / h - 16 / 9) < 0.02) label = `16:9 (${ratioDec}:1)`;
            else if (Math.abs(w / h - 9 / 16) < 0.02) label = `9:16 (${ratioDec}:1)`;
            else if (Math.abs(w / h - 4 / 3) < 0.02) label = `4:3 (${ratioDec}:1)`;
            else if (w === h) label = `1:1 (Square)`;
            lblAspect.textContent = label;
        }

        const lblMP = document.getElementById("lblSettingsMegapixels");
        if (lblMP) {
            const mp = ((w * h) / 1000000).toFixed(2);
            lblMP.textContent = `${mp} MP`;
        }
    }

    enforceOrientation() {
        const etrW = document.getElementById("etrVideoW");
        const etrH = document.getElementById("etrVideoH");
        const chk = document.getElementById("chkVideoLandscape");
        if (!etrW || !etrH || !chk) return;

        const w = parseInt(etrW.value, 10);
        const h = parseInt(etrH.value, 10);
        const isLandscape = chk.checked;

        if (!isNaN(w) && !isNaN(h)) {
            if ((isLandscape && w < h) || (!isLandscape && w > h)) {
                this.updatingLive = true;
                etrW.value = String(h);
                etrH.value = String(w);
                this.updatingLive = false;
            }
        }
    }

    updateTemplatesDropdown() {
        const chk = document.getElementById("chkVideoLandscape");
        const isLandscape = chk ? chk.checked : true;
        this.currentTemplates = isLandscape ? this.landscapeTemplates : this.portraitTemplates;

        const cmb = document.getElementById("cmbVideoTemplate");
        if (!cmb) return;
        cmb.innerHTML = "";
        for (const [label] of this.currentTemplates) {
            const opt = document.createElement("option");
            opt.textContent = label;
            cmb.appendChild(opt);
        }
    }

    checkMatchingTemplate() {
        const etrW = document.getElementById("etrVideoW");
        const etrH = document.getElementById("etrVideoH");
        const w = parseInt(etrW?.value, 10);
        const h = parseInt(etrH?.value, 10);

        let matchIdx = 0;
        if (!isNaN(w) && !isNaN(h)) {
            for (let i = 0; i < this.currentTemplates.length; i++) {
                const dims = this.currentTemplates[i][1];
                if (dims && dims[0] === w && dims[1] === h) {
                    matchIdx = i;
                    break;
                }
            }
        }
        const cmb = document.getElementById("cmbVideoTemplate");
        if (cmb) cmb.selectedIndex = matchIdx;
    }

    openModal() {
        this.savedSnapshot = { ...this.opts };

        this.updatingLive = true;
        const etrW = document.getElementById("etrVideoW");
        const etrH = document.getElementById("etrVideoH");
        const chk = document.getElementById("chkVideoLandscape");

        if (etrW) etrW.value = String(this.opts.out_w);
        if (etrH) etrH.value = String(this.opts.out_h);
        if (chk) chk.checked = this.opts.isLandscape;

        this.updateTemplatesDropdown();
        this.syncReadouts();
        this.checkMatchingTemplate();
        this.setFramerate(this.opts.fps);

        this.updatingLive = false;
        document.getElementById("settingsModal")?.classList.remove("hidden");
    }

    cancelModal() {
        if (this.savedSnapshot) {
            Object.assign(this.opts, this.savedSnapshot);
        }
        document.getElementById("settingsModal")?.classList.add("hidden");
    }

    _refitRectToAspectRatio(rect, mediaW, mediaH, targetRatio) {
        if (!rect || rect.length < 4) return [0, 0, mediaW, mediaH];
        const [rx, ry, rw, rh] = rect;
        const cx = rx + rw / 2;
        const cy = ry + rh / 2;

        const currentArea = rw * rh;
        let newW = Math.sqrt(currentArea * targetRatio);
        let newH = newW / targetRatio;

        if (newW > mediaW) {
            newW = mediaW;
            newH = newW / targetRatio;
        }
        if (newH > mediaH) {
            newH = mediaH;
            newW = newH * targetRatio;
        }

        let newX = Math.max(0, Math.min(mediaW - newW, cx - newW / 2));
        let newY = Math.max(0, Math.min(mediaH - newH, cy - newH / 2));

        return [Math.round(newX), Math.round(newY), Math.round(newW), Math.round(newH)];
    }

    resizeAllTransitions(newW, newH) {
        if (!this.app) return;
        const newRatio = newW / newH;

        if (this.app.startEditor) this.app.startEditor.RATIO = newRatio;
        if (this.app.endEditor) this.app.endEditor.RATIO = newRatio;

        if (Array.isArray(this.app.mediaItems)) {
            for (const item of this.app.mediaItems) {
                const mw = item.w || 1920;
                const mh = item.h || 1080;
                if (item.rectStart) {
                    item.rectStart = this._refitRectToAspectRatio(item.rectStart, mw, mh, newRatio);
                }
                if (item.rectEnd) {
                    item.rectEnd = this._refitRectToAspectRatio(item.rectEnd, mw, mh, newRatio);
                }
            }
        }

        const te = this.app.transEditor;
        if (te) {
            const maxPreviewW = 800;
            const maxPreviewH = 320;
            let prevW = Math.round(maxPreviewH * newRatio);
            let prevH = maxPreviewH;

            if (prevW > maxPreviewW) {
                prevW = maxPreviewW;
                prevH = Math.round(maxPreviewW / newRatio);
            }
            prevW = Math.max(2, prevW % 2 === 0 ? prevW : prevW + 1);
            prevH = Math.max(2, prevH % 2 === 0 ? prevH : prevH + 1);

            const transCanvas = document.getElementById("transCanvas") || te.canvas;
            if (transCanvas) {
                transCanvas.width = prevW;
                transCanvas.height = prevH;
            }

            if (Array.isArray(te.canvasSize)) {
                te.canvasSize = [prevW, prevH];
            }
            if (te.srcCanvas) {
                te.srcCanvas.width = prevW;
                te.srcCanvas.height = prevH;
            }
            if (te.dstCanvas) {
                te.dstCanvas.width = prevW;
                te.dstCanvas.height = prevH;
            }

            if (typeof te.setSlides === "function" && this.app.selectedIndices?.length) {
                const idx = this.app.selectedIndices[0];
                const currSlide = this.app.mediaItems[idx];
                const nextSlide = this.app.mediaItems[(idx + 1) % this.app.mediaItems.length];
                te.setSlides(currSlide, nextSlide);
            } else if (typeof te.loadImages === "function") {
                te.loadImages();
            } else if (typeof te.render === "function") {
                te.render();
            }
        }
    }

    applyModal() {
        const etrW = document.getElementById("etrVideoW");
        const etrH = document.getElementById("etrVideoH");
        const chk = document.getElementById("chkVideoLandscape");

        let w = parseInt(etrW?.value, 10) || 1920;
        let h = parseInt(etrH?.value, 10) || 1080;

        w = (w % 2 === 0) ? w : w + 1;
        h = (h % 2 === 0) ? h : h + 1;
        const isLandscape = chk ? chk.checked : (w >= h);

        const prevW = this.savedSnapshot ? this.savedSnapshot.out_w : this.opts.out_w;
        const prevH = this.savedSnapshot ? this.savedSnapshot.out_h : this.opts.out_h;
        const prevLandscape = this.savedSnapshot ? this.savedSnapshot.isLandscape : this.opts.isLandscape;

        const dimensionsChanged = (w !== prevW || h !== prevH || isLandscape !== prevLandscape);

        this.opts.out_w = w;
        this.opts.out_h = h;
        this.opts.isLandscape = isLandscape;
        this.savedSnapshot = { ...this.opts };

        document.getElementById("settingsModal")?.classList.add("hidden");
        this.updateHeaderBadge();

        if (this.app) {
            if (dimensionsChanged) {
                this.resizeAllTransitions(w, h);
            }
            this.app.renderMainStage?.();

            if (typeof showToast === "function") {
                const orientLabel = isLandscape ? "Landscape" : "Portrait";
                showToast(
                    dimensionsChanged
                        ? `Resized project & transitions to ${w} × ${h} (${orientLabel}, ${this.opts.fps} FPS)`
                        : `Settings updated (${this.opts.fps} FPS)`,
                    "success"
                );
            }
        }
    }

    updateHeaderBadge() {
        const lbl = document.getElementById("lblProjectName");
        if (lbl) {
            const orient = this.opts.isLandscape ? "Landscape" : "Portrait";
            lbl.textContent = `${this.opts.out_w} × ${this.opts.out_h} (${orient} • ${this.opts.fps} FPS)`;
        }
        const hudRes = document.getElementById("lblHudResolution");
        if (hudRes) {
            hudRes.textContent = `${this.opts.out_w} × ${this.opts.out_h}`;
        }
        const exportDims = document.getElementById("lblExportDims");
        if (exportDims) {
            exportDims.textContent = `${this.opts.out_w} × ${this.opts.out_h} px`;
        }
    }

    // ==================================================================
    // PART 2: EXPORT MODAL & STANDALONE HTML PROJECT SAVE/RESTORE
    // ==================================================================

    initExportBindings() {
        document.getElementById("btnExportVideo")?.addEventListener("click", () => this.openExportModal());
        document.getElementById("btnExportCancel")?.addEventListener("click", () => this.closeExportModal());
        document.getElementById("exportFormat")?.addEventListener("change", () => this.updateExportModalInfo());
        document.getElementById("btnExportConfirm")?.addEventListener("click", () => this.executeExportAction());
        document.getElementById("btnSaveProjectHtml")?.addEventListener("click", () => this.saveProjectAsHtml());

        const exportModal = document.getElementById("exportModal");
        exportModal?.addEventListener("click", (e) => {
            if (e.target === exportModal) this.closeExportModal();
        });
    }

    getEstimatedMovieStats() {
        const mediaItems = this.app?.mediaItems || [];
        const visibleItems = mediaItems.filter(item => !item.isHidden);
        let totalSeconds = 0;

        for (let i = 0; i < visibleItems.length; i++) {
            const item = visibleItems[i];
            const nextItem = visibleItems[i + 1];
            totalSeconds += (item.moveDuration || 5.0);
            if (nextItem) {
                totalSeconds += (item.transDuration || 2.0);
            }
        }

        const pixelScale = (this.opts.out_w * this.opts.out_h) / (1920 * 1080);
        const fpsScale = this.opts.fps === 60 ? 1.4 : 1.0;
        const estSizeMB = visibleItems.length
            ? Math.max(0.1, totalSeconds * 0.3125 * pixelScale * fpsScale)
            : 0;

        let estHtmlBytes = 120 * 1024;
        for (const item of mediaItems) {
            const w = item.w || 1920;
            const h = item.h || 1080;

            if (item.thumbUrl && item.thumbUrl.startsWith("data:image/")) {
                const thumbH = 140;
                const thumbW = Math.max(1, Math.round(thumbH * (w / h)));
                const areaRatio = Math.max(1, (w * h) / (thumbW * thumbH));
                estHtmlBytes += item.thumbUrl.length * Math.pow(areaRatio, 0.72);
            } else {
                estHtmlBytes += w * h * 0.22;
            }

            if (item.paintActions && item.paintActions.length > 0) {
                estHtmlBytes += JSON.stringify(item.paintActions).length;
            }
        }
        const estHtmlMB = Math.max(0.1, estHtmlBytes / (1024 * 1024));

        return { totalSeconds, estSizeMB, estHtmlMB, count: visibleItems.length };
    }

    openExportModal() {
        const mediaItems = this.app?.mediaItems || [];
        if (!mediaItems.length) {
            if (typeof showToast === "function") showToast("Timeline is empty. Add media to export.", "error");
            return;
        }
        this.updateExportModalInfo();
        document.getElementById("exportModal")?.classList.remove("hidden");
    }

    closeExportModal() {
        document.getElementById("exportModal")?.classList.add("hidden");
    }

    updateExportModalInfo() {
        const mediaItems = this.app?.mediaItems || [];
        const format = document.getElementById("exportFormat")?.value || "video/webm";
        const infoBox = document.getElementById("exportInfoBox");
        const primaryEl = document.getElementById("lblExportInfoPrimary");
        const secondaryEl = document.getElementById("lblExportInfoSecondary");
        const confirmIcon = document.getElementById("lblExportConfirmIcon");
        const confirmText = document.getElementById("lblExportConfirmText");
        const btnSaveHtml = document.getElementById("btnSaveProjectHtml");

        const { totalSeconds, estSizeMB, estHtmlMB } = this.getEstimatedMovieStats();
        const outW = this.opts.out_w || 1920;
        const outH = this.opts.out_h || 1080;

        if (btnSaveHtml) {
            const htmlSizeStr = estHtmlMB < 1.0
                ? `~${Math.round(estHtmlMB * 1024)} KB`
                : `~${estHtmlMB.toFixed(1)} MB`;
            btnSaveHtml.innerHTML = `
                <span>📦</span>
                <span class="leading-tight">Save Project as HTML...<br><span class="text-[11px] font-normal opacity-90">(${htmlSizeStr})</span></span>
            `;
        }

        if (format === "extract/images") {
            if (infoBox) {
                infoBox.className = "bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-800 space-y-1 transition-colors";
            }
            if (primaryEl) {
                primaryEl.innerHTML = `Original Media Items: <strong>${mediaItems.length} file${mediaItems.length === 1 ? "" : "s"}</strong>`;
            }
            if (secondaryEl) {
                secondaryEl.innerHTML = `Downloads all slide images individually to your computer.`;
            }
            if (confirmIcon) confirmIcon.textContent = "📂";
            if (confirmText) confirmText.textContent = "Extract Images";
        } else {
            if (infoBox) {
                infoBox.className = "bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-800 space-y-1 transition-colors";
            }
            if (primaryEl) {
                primaryEl.innerHTML = `Video Size: <strong id="lblExportDims">${outW} × ${outH} px</strong> • Duration: <strong>${totalSeconds.toFixed(1)}s</strong>`;
            }
            if (secondaryEl) {
                secondaryEl.innerHTML = `Estimated Output File Size: <strong id="lblExportEstSize">~${estSizeMB.toFixed(1)} MB</strong>`;
            }
            if (confirmIcon) confirmIcon.textContent = "🎬";

            const videoSizeStr = estSizeMB < 1.0
                ? `~${Math.round(estSizeMB * 1024)} KB`
                : `~${estSizeMB.toFixed(1)} MB`;
            if (confirmText) {
                confirmText.innerHTML = `Export Video<br><span class="text-[11px] font-normal opacity-90">(${videoSizeStr})</span>`;
            }
        }
    }

    async executeExportAction() {
        const format = document.getElementById("exportFormat")?.value || "video/webm";
        const rawName = document.getElementById("exportFilename")?.value?.trim() || "videostudio-movie";
        const cleanName = rawName.replace(/\.[^/.]+$/, "");
        this.closeExportModal();

        if (format === "extract/images") {
            await this.extractAllImages(cleanName);
        } else {
            await this.app?._playMovieSequence(true, cleanName);
        }
    }

    async extractAllImages(prefix = "slide") {
        const mediaItems = this.app?.mediaItems || [];
        if (!mediaItems.length) return;
        if (typeof showToast === "function") showToast(`Extracting ${mediaItems.length} media files...`, "info");

        for (let i = 0; i < mediaItems.length; i++) {
            const item = mediaItems[i];
            const src = item.getProcessedSource?.() || item.imgElement;
            if (!src) continue;

            const cvs = document.createElement("canvas");
            cvs.width = item.w || 1920;
            cvs.height = item.h || 1080;
            const ctx = cvs.getContext("2d");
            ctx.drawImage(src, 0, 0, cvs.width, cvs.height);

            const blob = await new Promise(res => cvs.toBlob(res, "image/png"));
            if (!blob) continue;

            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            const base = (item.filename || `${prefix}_${i + 1}`).replace(/\.[^/.]+$/, "");
            a.href = url;
            a.download = `${String(i + 1).padStart(2, "0")}_${base}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            await new Promise(r => setTimeout(r, 180));
        }
        if (typeof showToast === "function") showToast("All slide images extracted!", "success");
    }

    
    saveProjectAsHtml() {
        const mediaItems = this.app?.mediaItems || [];
        if (!mediaItems.length) {
            if (typeof showToast === "function") showToast("Timeline is empty. Add media before saving project.", "error");
            return;
        }

        const modal = document.getElementById("exportModal");
        if (modal) modal.classList.add("hidden");

        if (typeof showToast === "function") {
            showToast("Packaging project session into HTML...", "info");
        }

        setTimeout(() => {
            try {
                const elementToDataUrl = (el, fallbackW, fallbackH) => {
                    if (!el) return null;
                    if (typeof el.src === "string" && el.src.indexOf("data:") === 0) return el.src;
                    try {
                        const cvs = document.createElement("canvas");
                        cvs.width = el.naturalWidth || el.videoWidth || el.width || fallbackW || 1920;
                        cvs.height = el.naturalHeight || el.videoHeight || el.height || fallbackH || 1080;
                        const ctx = cvs.getContext("2d");
                        ctx.drawImage(el, 0, 0, cvs.width, cvs.height);
                        return cvs.toDataURL("image/jpeg", 0.92);
                    } catch (_) {
                        return el.src || null;
                    }
                };

                const serializedItems = mediaItems.map((item) => ({
                    filename: item.filename,
                    w: item.w,
                    h: item.h,
                    isVideo: item.isVideo,
                    videoDuration: item.videoDuration,
                    isHidden: item.isHidden,
                    isZoom: item.isZoom,
                    isLock: item.isLock,
                    moveDuration: item.moveDuration,
                    rotateStart: item.rotateStart,
                    rotateEnd: item.rotateEnd,
                    rectStart: item.rectStart,
                    rectEnd: item.rectEnd,
                    curRotation: item.curRotation,
                    curMirror: item.curMirror,
                    curColor: item.curColor,
                    curColormap: item.curColormap,
                    isTitle: item.isTitle,
                    title: item.title,
                    titleColor: item.titleColor,
                    titlePos: item.titlePos,
                    titleShadow: item.titleShadow,
                    titleFontSize: item.titleFontSize,
                    titleRelPos: item.titleRelPos,
                    isCustomPositioned: item.isCustomPositioned,
                    isMatte: item.isMatte,
                    matteColor: item.matteColor,
                    isBorder: item.isBorder,
                    borderColor: item.borderColor,
                    frameStyle: item.frameStyle,
                    frameSize: item.frameSize,
                    transDuration: item.transDuration,
                    transType: item.transType,
                    transSubtype: item.transSubtype,
                    transItem: item.transItem,
                    transRotation: item.transRotation,
                    transNegative: item.transNegative,
                    paintActions: item.paintActions || [],
                    dataUrl: elementToDataUrl(item.imgElement, item.w, item.h) || item.thumbUrl
                }));

                const sessionData = {
                    opts: this.opts,
                    items: serializedItems
                };

                const htmlClone = document.documentElement.outerHTML;

                // 1. Remove any previously embedded session payload script
                const tagEnd = '<\\/' + 'script>';
                const stripRegex = new RegExp('<script id="saved-session-payload">[\\s\\S]*?' + tagEnd, 'gi');
                let cleanHtml = htmlClone.replace(stripRegex, "");

                // 2. Ensure modals and demo overlays are hidden in the exported HTML
                cleanHtml = cleanHtml.replace(
                    /(id=["'](?:exportModal|settingsModal|demoPickerModal|demoLoadingOverlay)["'][^>]*class=["'])([^"']*)/gi,
                    (match, p1, p2) => p1 + (p2.includes("hidden") ? p2 : "hidden " + p2)
                );

                // 3. Replace relative script paths with full HTTP CDN paths
                cleanHtml = cleanHtml.replace(
                    /<script\s+src=["']?(?:\.\/)?photodemo\.js(?:\?[^"']*)?["']?\s*>\s*<\/script>/i,
                    '<script src="https://blendpy.github.io/vibe-web-dev/videostudio/photodemo.js"></script>'
                );
                cleanHtml = cleanHtml.replace(
                    /<script\s+src=["']?(?:\.\/)?photoframe\.js(?:\?[^"']*)?["']?\s*>\s*<\/script>/i,
                    '<script src="https://blendpy.github.io/vibe-web-dev/videostudio/photoframe.js"></script>'
                );
                cleanHtml = cleanHtml.replace(
                    /<script\s+src=["']?(?:\.\/)?photoeffects\.js(?:\?[^"']*)?["']?\s*>\s*<\/script>/i,
                    '<script src="https://blendpy.github.io/vibe-web-dev/videostudio/photoeffects.js"></script>'
                );
                cleanHtml = cleanHtml.replace(
                    /<script\s+src=["']?(?:\.\/)?phototransitions\.js(?:\?[^"']*)?["']?\s*>\s*<\/script>/i,
                    '<script src="https://blendpy.github.io/vibe-web-dev/videostudio/phototransitions.js"></script>'
                );
                cleanHtml = cleanHtml.replace(
                    /<script\s+src=["']?(?:\.\/)?photopaint_shapes\.js(?:\?[^"']*)?["']?\s*>\s*<\/script>/i,
                    '<script src="https://blendpy.github.io/vibe-web-dev/videostudio/photopaint_shapes.js"></script>'
                );
                cleanHtml = cleanHtml.replace(
                    /<script\s+src=["']?(?:\.\/)?photopaint_emoji\.js(?:\?[^"']*)?["']?\s*>\s*<\/script>/i,
                    '<script src="https://blendpy.github.io/vibe-web-dev/videostudio/photopaint_emoji.js"></script>'
                );
                cleanHtml = cleanHtml.replace(
                    /<script\s+src=["']?(?:\.\/)?photopaint\.js(?:\?[^"']*)?["']?\s*>\s*<\/script>/i,
                    '<script src="https://blendpy.github.io/vibe-web-dev/videostudio/photopaint.js"></script>'
                );
                cleanHtml = cleanHtml.replace(
                    /<script\s+src=["']?(?:\.\/)?videosettings\.js(?:\?[^"']*)?["']?\s*>\s*<\/script>/i,
                    '<script src="https://blendpy.github.io/vibe-web-dev/videostudio/videosettings.js"></script>'
                );
                cleanHtml = cleanHtml.replace(
                    /<script\s+src=["']?(?:\.\/)?videostudio\.js(?:\?[^"']*)?["']?\s*>\s*<\/script>/i,
                    '<script src="https://blendpy.github.io/vibe-web-dev/videostudio/videostudio.js"></script>'
                );

                // 4. Inject saved project payload before </head>
                const payloadScript = '\n<script id="saved-session-payload">\nwindow.__SAVED_VIDEOSTUDIO_PROJECT__ = ' +
                    JSON.stringify(sessionData) + ';\nwindow.SAVED_SESSION_DATA = window.__SAVED_VIDEOSTUDIO_PROJECT__;\n<' + '/script>';
                cleanHtml = cleanHtml.replace(/<\/head>/i, payloadScript + '\n<' + '/head>');

                const blob = new Blob(["<!DOCTYPE html>\n" + cleanHtml], { type: "text/html;charset=utf-8" });
                const url = URL.createObjectURL(blob);
                const fnEl = document.getElementById("exportFilename");
                const rawName = (fnEl ? fnEl.value : "videostudio-project").trim();
                const filename = `${rawName.replace(/\.(html|htm|webm|mp4)$/i, "")}.html`;

                const a = document.createElement("a");
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                a.remove();
                setTimeout(() => URL.revokeObjectURL(url), 5000);

                if (typeof showToast === "function") {
                    showToast(`Project successfully saved as "${filename}"!`, "success");
                }
            } catch (err) {
                if (typeof showToast === "function") {
                    showToast(`Failed to save project HTML: ${err.message}`, "error");
                }
            }
        }, 80);
    }

restoreSavedProjectIfPresent() {
        const saved = window.__SAVED_VIDEOSTUDIO_PROJECT__ || window.SAVED_SESSION_DATA;
        if (!saved || !this.app) return false;

        const itemsList = Array.isArray(saved) ? saved : (saved.items || []);
        if (!itemsList.length) return false;

        if (saved.opts) {
            Object.assign(this.opts, saved.opts);
            this.savedSnapshot = { ...this.opts };
            this.updateHeaderBadge();
        }

        // Prevent any demo modal or demo loader from clearing the restored timeline
        document.getElementById("demoPickerModal")?.classList.add("hidden");
        document.getElementById("demoLoadingOverlay")?.classList.add("hidden");

        this.app.mediaItems = [];
        const loadPromises = [];

        for (const data of itemsList) {
            const p = new Promise((resolve) => {
                const img = new Image();
                img.onload = () => {
                    const w = data.w || img.naturalWidth || img.width || 1920;
                    const h = data.h || img.naturalHeight || img.height || 1080;

                    const item = new MediaItem(
                        data.filename || "Slide",
                        w,
                        h,
                        img,
                        false
                    );
                    Object.assign(item, data);
                    item.imgElement = img;
                    item.w = w;
                    item.h = h;
                    item.invalidateProcessedCache?.();
                    item.generateThumbnail(); // Generate thumbnail *after* image data is loaded

                    this.app.mediaItems.push(item);
                    resolve();
                };
                img.onerror = () => {
                    resolve();
                };
                img.src = data.dataUrl || "";
            });
            loadPromises.push(p);
        }

        Promise.all(loadPromises).then(() => {
            if (this.app.mediaItems.length > 0) {
                this.app.selectedIndices = [0];
                this.resizeAllTransitions(this.opts.out_w, this.opts.out_h);
                this.app.renderFilmstrip?.();
                this.app.renderMainStage?.();
                if (typeof showToast === "function") {
                    showToast(`Restored ${this.app.mediaItems.length} slides from saved HTML project`, "success");
                }
            }
        });

        return true;
    }
}





window.VideoSettingsManager = VideoSettingsManager;

