"use strict";

// ======================================================================
// VIDEO PROJECT SETTINGS MANAGER (Resolution, Presets, Orientation & FPS)
// ======================================================================

class VideoSettingsManager {
    constructor(app) {
        this.app = app;

        // Master Settings State
        this.opts = {
            out_w: 1920,
            out_h: 1080,
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

        // Initialize when DOM is available
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", () => this.init());
        } else {
            this.init();
        }
    }

    init() {
        this.initBindings();
        this.updateHeaderBadge();
    }

    initBindings() {
        document.getElementById("btnSettings")?.addEventListener("click", () => this.openModal());
        document.getElementById("btnSettingsCancel")?.addEventListener("click", () => this.cancelModal());
        document.getElementById("btnSettingsOk")?.addEventListener("click", () => this.applyModal());

        const onSizeInput = () => {
            if (!this.updatingLive) {
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
        if (chk) chk.checked = this.opts.out_w >= this.opts.out_h;

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

    applyModal() {
        const etrW = document.getElementById("etrVideoW");
        const etrH = document.getElementById("etrVideoH");

        let w = parseInt(etrW?.value, 10) || 1920;
        let h = parseInt(etrH?.value, 10) || 1080;

        // Ensure dimensions are even numbers for video encoders
        w = (w % 2 === 0) ? w : w + 1;
        h = (h % 2 === 0) ? h : h + 1;

        this.opts.out_w = w;
        this.opts.out_h = h;

        document.getElementById("settingsModal")?.classList.add("hidden");
        this.updateHeaderBadge();

        // Broadcast updated aspect ratio to zoom canvases and preview stages
        if (this.app) {
            const newRatio = w / h;
            if (this.app.startEditor) this.app.startEditor.RATIO = newRatio;
            if (this.app.endEditor) this.app.endEditor.RATIO = newRatio;
            this.app.renderMainStage();
            if (typeof showToast === "function") {
                showToast(`Project updated: ${w} × ${h} (${this.opts.fps} FPS)`, "success");
            }
        }
    }

    updateHeaderBadge() {
        const lbl = document.getElementById("lblProjectName");
        if (lbl) {
            lbl.textContent = `${this.opts.out_w} × ${this.opts.out_h} (${this.opts.fps} FPS) Project Workspace`;
        }
    }
}

window.VideoSettingsManager = VideoSettingsManager;
