"use strict";

// ======================================================================
// PHOTO TRANSITIONS STUDIO (Port of PhotoTransitions.py)
// 3 Rows x 15 Buttons (5 Groups of 3) = 45 Unique Masks Per Category
// ======================================================================
const TCOLUMNS = 15;
const TMAX_ROWS = 3;
const TMASK_COUNT = TCOLUMNS * TMAX_ROWS; // 45 unique masks

class PhotoTransitionEditor {
    constructor(app) {
        this.app = app;
        this.canvasSize = [800, 300];

        // Transition State (Defaults: Fade, Simple Replace)
        this.transDuration = 2.0;
        this.transType = "Fade";
        this.transSubtype = "Simple";
        this.transItem = "Replace";
        this.activeRotationIdx = 0; // 0: Normal 0°, 1: Flip 180°, 2: Right 90°, 3: Left -90°
        this.maskInverted = false;
        this.isRandomizerOpen = false;

        // Animation State
        this.mode = null;
        this.progress = 0.0;
        this.isReversing = false;
        this.animStep = 0.0;
        this.animTimer = null;

        // Cached Slide Canvases
        this.srcCanvas = null;
        this.dstCanvas = null;

        // Mask Data & Button Collections (45 items per category)
        this.imageCategories = ["Threshold", "Distortion", "Spiral", "Wave", "Mosaic", "Picture"];

        this.thresholdData = null;
        this.activeThresholdIdx = 0;
        this.thresholdButtons = [];

        this.distortionData = null;
        this.activeDistortionIdx = 0;
        this.distortionButtons = [];

        this.spiralData = null;
        this.activeSpiralIdx = 0;
        this.spiralButtons = [];

        this.waveData = null;
        this.activeWaveIdx = 0;
        this.waveButtons = [];

        this.mosaicData = null;
        this.activeMosaicIdx = 0;
        this.mosaicButtons = [];

        this.pictholdData = null;
        this.activePictholdIdx = 0;
        this.pictholdButtons = [];

        this.typeButtons = {};
        this.imageSubButtons = {};
        this.allSubButtons = [];
        this.rotationButtons = [];

        // Randomizer State
        this.randomTypes = ["No Fade", "Fade", "Threshold", "Distortion", "Spiral", "Wave", "Mosaic", "Picture"];
        this.randomSliders = {};
        this.randomLabels = {};

        this.initDOM();
        this.buildUI();
        this.bindEvents();
    }

    get item() {
        const primaryIdx = this.app.selectedIndices[this.app.selectedIndices.length - 1];
        return this.app.mediaItems[primaryIdx] || null;
    }

    getSelectedItems() {
        if (!this.app || !this.app.selectedIndices || !this.app.selectedIndices.length) {
            return this.item ? [this.item] : [];
        }
        return this.app.selectedIndices.map(i => this.app.mediaItems[i]).filter(Boolean);
    }

    initDOM() {
        this.stage = document.getElementById("transStage");
        this.canvas = document.getElementById("transCanvas");
        this.ctx = this.canvas ? this.canvas.getContext("2d") : null;

        this.sliderDuration = document.getElementById("transDurationSlider");
        this.lblDurVal = document.getElementById("lblTransDuration");
        this.btnRandomToggle = document.getElementById("btnTransRandomToggle");

        this.typeColumnEl = document.getElementById("transTypeColumn");
        this.rightColumn = document.getElementById("transRightColumn");
        this.groupsContainer = document.getElementById("transGroupsContainer");
        this.randomPanel = document.getElementById("transRandomPanel");
    }

    getEmojiForLabel(label) {
        const isWipe = label.startsWith("Wipe-");
        const dir = label.split("-")[1];

        // Directional vector arrows
        const dirArrows = {
            "Left":  `<path d="M15 10H5M5 10L9.5 5.5M5 10L9.5 14.5"/>` + (isWipe ? `<line x1="3" y1="4" x2="3" y2="16" stroke-opacity="0.55"/>` : ""),
            "Right": `<path d="M5 10H15M15 10L10.5 5.5M15 10L10.5 14.5"/>` + (isWipe ? `<line x1="17" y1="4" x2="17" y2="16" stroke-opacity="0.55"/>` : ""),
            "Up":    `<path d="M10 15V5M10 5L5.5 9.5M10 5L14.5 9.5"/>` + (isWipe ? `<line x1="4" y1="3" x2="16" y2="3" stroke-opacity="0.55"/>` : ""),
            "Down":  `<path d="M10 5V15M10 15L5.5 10.5M10 15L14.5 10.5"/>` + (isWipe ? `<line x1="4" y1="17" x2="16" y2="17" stroke-opacity="0.55"/>` : ""),
            "UL":    `<path d="M14.5 14.5L5.5 5.5M5.5 5.5H12M5.5 5.5V12"/>`,
            "UR":    `<path d="M5.5 14.5L14.5 5.5M14.5 5.5H8M14.5 5.5V12"/>`,
            "LR":    `<path d="M5.5 5.5L14.5 14.5M14.5 14.5H8M14.5 14.5V8"/>`,
            "LL":    `<path d="M14.5 5.5L5.5 14.5M5.5 14.5H12M5.5 14.5V8"/>`
        };

        if (dirArrows[dir]) {
            return `<svg class="w-4 h-4 pointer-events-none" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${dirArrows[dir]}</svg>`;
        }

        const specials = {
            "Simple-Replace": `
                <svg class="w-5 h-4 pointer-events-none" viewBox="0 0 24 18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="2" y="2" width="13" height="10" rx="1.5" stroke-opacity="0.6"/>
                    <rect x="9" y="6" width="13" height="10" rx="1.5"/>
                    <line x1="9" y1="16" x2="15" y2="6" stroke-dasharray="2 2"/>
                </svg>`,
            "Slide-Replace": `
                <svg class="w-5 h-4 pointer-events-none" viewBox="0 0 24 18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="2" y="3" width="12" height="12" rx="1.5" stroke-opacity="0.5"/>
                    <rect x="10" y="3" width="12" height="12" rx="1.5"/>
                </svg>`,
            "Pan In-Center": `
                <span class="inline-flex items-center gap-1 pointer-events-none">
                    <svg class="w-4 h-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M2 2L7 7M7 7H3M7 7V3"/>
                        <path d="M18 2L13 7M13 7H17M13 7V3"/>
                        <path d="M2 18L7 13M7 13H3M7 13V17"/>
                        <path d="M18 18L13 13M13 13H17M13 13V17"/>
                    </svg>
                    <span class="text-[10px] font-bold tracking-tight">In</span>
                </span>`,
            "Pan Out-Center": `
                <span class="inline-flex items-center gap-1 pointer-events-none">
                    <svg class="w-4 h-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M7 7L2 2M2 2H6M2 2V6"/>
                        <path d="M13 7L18 2M18 2H14M18 2V6"/>
                        <path d="M7 13L2 18M2 18H6M2 18V14"/>
                        <path d="M13 13L18 18M18 18H14M18 18V14"/>
                    </svg>
                    <span class="text-[10px] font-bold tracking-tight">Out</span>
                </span>`,
            "Zoom-OneA": `
                <span class="inline-flex items-center gap-1 pointer-events-none">
                    <svg class="w-4 h-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="2.5" y="3.5" width="15" height="13" rx="2"/>
                        <line x1="10" y1="7" x2="10" y2="13"/>
                        <line x1="7" y1="10" x2="13" y2="10"/>
                    </svg>
                    <span class="text-[10px] font-bold">1+</span>
                </span>`,
            "Zoom-OneB": `
                <span class="inline-flex items-center gap-1 pointer-events-none">
                    <svg class="w-4 h-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="2.5" y="3.5" width="15" height="13" rx="2"/>
                        <line x1="7" y1="10" x2="13" y2="10"/>
                    </svg>
                    <span class="text-[10px] font-bold">1−</span>
                </span>`,
            "Zoom-FlipB": `
                <span class="inline-flex items-center gap-1 pointer-events-none">
                    <svg class="w-4 h-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M3 7H15L12 4M17 13H5L8 16"/>
                    </svg>
                    <span class="text-[10px] font-bold">2+</span>
                </span>`,
            "Zoom-FlipA": `
                <span class="inline-flex items-center gap-1 pointer-events-none">
                    <svg class="w-4 h-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M3 7H15L12 4M17 13H5L8 16"/>
                    </svg>
                    <span class="text-[10px] font-bold">2−</span>
                </span>`
        };

        return specials[label] || `<span>${label}</span>`;
    }

    buildUI() {
        if (!this.groupsContainer) return;
        this.groupsContainer.innerHTML = "";
        this.groupEls = {};

        // 1. Build Left Column Type Buttons: Fade, No Fade, Image
        if (this.typeColumnEl) {
            this.typeColumnEl.innerHTML = "";
            const leftTypes = ["Fade", "No Fade", "Image"];
            leftTypes.forEach((tName) => {
                const btn = document.createElement("button");
                btn.type = "button";
                btn.textContent = tName;
                btn.className = "w-full px-2 py-1.5 rounded text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 transition";
                btn.addEventListener("click", () => this.handleLeftTypeClick(tName));
                this.typeButtons[tName] = btn;
                this.typeColumnEl.appendChild(btn);
            });
        }

        // 2. Image Choices Row (Visible when "Image" is active)
        const imgChoicesRow = document.createElement("div");
        imgChoicesRow.className = "flex items-center gap-1.5 py-1.5 flex-wrap justify-center border-b border-slate-800 mb-2 w-full";
        this.imageCategories.forEach((sub) => {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.textContent = sub;
            btn.className = "px-3 py-1 rounded text-xs font-semibold border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 transition-colors";
            btn.addEventListener("click", () => this.handleImageChoiceClick(sub));
            this.imageSubButtons[sub] = btn;
            imgChoicesRow.appendChild(btn);
        });
        this.groupsContainer.appendChild(imgChoicesRow);
        this.groupEls["ImageChoicesRow"] = imgChoicesRow;

        // 3. Generic Action Sub-group Builder
        const addGroup = (label, subTypes) => {
            const row = document.createElement("div");
            row.className = "flex items-center gap-1.5 py-1 flex-wrap";

            const lbl = document.createElement("span");
            lbl.className = "w-20 text-xs font-bold text-slate-300 text-right pr-2 shrink-0";
            lbl.textContent = `${label}:`;
            row.appendChild(lbl);

            subTypes.forEach((sub) => {
                const fullLabel = `${label}-${sub}`;
                const btn = document.createElement("button");
                btn.type = "button";
                btn.internalName = fullLabel;
                btn.title = `${label} ${sub}`;
                btn.innerHTML = this.getEmojiForLabel(fullLabel);
                btn.className = "min-w-[48px] h-[30px] px-2.5 py-1 rounded text-xs font-semibold border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 inline-flex items-center justify-center transition-colors";
                btn.addEventListener("click", () => this.handleSubButtonClick(fullLabel));
                this.allSubButtons.push(btn);
                row.appendChild(btn);
            });

            this.groupsContainer.appendChild(row);
            this.groupEls[label] = row;
        };

        // No Fade Category Rows (Exactly 3 Rows)
        addGroup("Slide", ["Left", "Right", "Up", "Down", "Replace"]);
        addGroup("Wipe", ["Left", "Right", "Up", "Down", "UL", "UR", "LR", "LL"]);
        addGroup("Zoom", ["OneA", "OneB", "FlipB", "FlipA"]);

        // Fade Category Rows (Exactly 3 Rows)
        addGroup("Pan Out", ["Left", "Right", "Up", "Down", "Center", "UL", "UR", "LR", "LL"]);
        addGroup("Pan In", ["Left", "Right", "Up", "Down", "Center", "UL", "UR", "LR", "LL"]);
        addGroup("Simple", ["Replace"]);

        // 4. Mask Selector Grids (3 rows x 15 buttons per row)
        ["ThresholdGrid", "DistortionGrid", "SpiralGrid", "WaveGrid", "MosaicGrid", "PictureGrid"].forEach((gridName) => {
            const grid = document.createElement("div");
            grid.className = "flex flex-col gap-1.5 items-center py-1 px-2";
            this.groupsContainer.appendChild(grid);
            this.groupEls[gridName] = grid;
        });

        // 5. Right Vertical Column: 5 Variant Buttons
        const rotHelpBubbles = ["Normal 0°", "Flip 180°", "Right 90°", "Left -90°"];
        const rightCol = this.rightColumn || document.createElement("div");
        rightCol.innerHTML = "";
        this.rotationButtons = [];

        for (let i = 0; i < 4; i++) {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.idx = i;
            btn.title = rotHelpBubbles[i];
            btn.className = "w-[68px] h-[46px] rounded-lg border-2 border-slate-700 bg-slate-900 p-0.5 flex items-center justify-center overflow-hidden transition-all";

            const cvs = document.createElement("canvas");
            cvs.width = 60;
            cvs.height = 38;
            cvs.className = "block rounded pointer-events-none";
            btn.appendChild(cvs);
            btn.thumbCanvas = cvs;

            btn.addEventListener("click", () => this.onRotationClick(i));
            this.rotationButtons.push(btn);
            rightCol.appendChild(btn);
        }

        this.negativeBtn = document.createElement("button");
        this.negativeBtn.type = "button";
        this.negativeBtn.title = "Negative";
        this.negativeBtn.innerHTML = `
            <svg class="w-3.5 h-3.5 mr-1 pointer-events-none" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8">
                <circle cx="10" cy="10" r="7"/>
                <path d="M10 3A7 7 0 0 1 10 17Z" fill="currentColor"/>
            </svg>
            <span>Neg</span>
        `;
        this.negativeBtn.className = "w-[68px] h-[42px] rounded-lg border-2 border-slate-700 bg-slate-800 text-[11px] font-bold text-slate-200 hover:bg-slate-700 transition-colors flex items-center justify-center";
        this.negativeBtn.addEventListener("click", () => this.onNegativeClick());
        rightCol.appendChild(this.negativeBtn);

        this.groupEls["RotationGrid"] = rightCol;

        // 6. Randomizer Sliders Panel
        this.buildRandomizerPanel();
    }

    buildRandomizerPanel() {
        if (!this.randomPanel) return;
        this.randomPanel.innerHTML = "";

        const defaultDist = {
            "No Fade": 12, "Fade": 13, "Threshold": 13,
            "Distortion": 12, "Spiral": 12, "Wave": 13, "Mosaic": 13, "Picture": 12
        };

        const listWrap = document.createElement("div");
        listWrap.className = "space-y-1.5 w-full max-w-md mx-auto";

        this.randomTypes.forEach((rType) => {
            const row = document.createElement("div");
            row.className = "flex items-center gap-3 text-xs";

            const lbl = document.createElement("span");
            lbl.className = "w-24 font-semibold text-slate-300 text-right";
            lbl.textContent = `${rType}:`;

            const slider = document.createElement("input");
            slider.type = "range";
            slider.min = "0";
            slider.max = "100";
            slider.value = String(defaultDist[rType]);
            slider.className = "flex-1 accent-blue-500 cursor-pointer";

            const valLbl = document.createElement("span");
            valLbl.className = "w-10 font-bold text-amber-400 text-right";
            valLbl.textContent = `${defaultDist[rType]}%`;

            slider.addEventListener("input", () => this.onRandomSliderChanged(rType));

            this.randomSliders[rType] = slider;
            this.randomLabels[rType] = valLbl;

            row.appendChild(lbl);
            row.appendChild(slider);
            row.appendChild(valLbl);
            listWrap.appendChild(row);
        });

        const btnAssign = document.createElement("button");
        btnAssign.type = "button";
        btnAssign.textContent = "Assign Random Transition";
        btnAssign.className = "mt-3 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg transition";
        btnAssign.addEventListener("click", () => this.onAssignRandomTransitions());

        this.randomPanel.appendChild(listWrap);
        this.randomPanel.appendChild(btnAssign);
    }

    bindEvents() {
        if (this.sliderDuration) {
            this.sliderDuration.addEventListener("input", () => {
                const val = parseInt(this.sliderDuration.value, 10);
                this.transDuration = parseFloat((val / 10).toFixed(1));
                if (this.lblDurVal) this.lblDurVal.textContent = `${this.transDuration.toFixed(1)}s`;
                this.saveToPicture();
            });
        }

        if (this.btnRandomToggle) {
            this.btnRandomToggle.addEventListener("click", () => {
                this.isRandomizerOpen = !this.isRandomizerOpen;
                this.syncRandomizerToggleUI();
                this.updateVisibleGroups(`Type-${this.transType}`);
            });
        }

        // Arrow key navigation for 3x15 mask grids (TCOLUMNS = 15)
        window.addEventListener("keydown", (e) => {
            if (this.app.activeTab !== "tabTrans" || this.isRandomizerOpen) return;
            if (["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName)) return;

            if (!this.imageCategories.includes(this.transType)) return;
            if (!["ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp"].includes(e.key)) return;

            let data = null;
            let curIdx = 0;
            if (this.transType === "Threshold") { data = this.thresholdData; curIdx = this.activeThresholdIdx; }
            else if (this.transType === "Distortion") { data = this.distortionData; curIdx = this.activeDistortionIdx; }
            else if (this.transType === "Spiral") { data = this.spiralData; curIdx = this.activeSpiralIdx; }
            else if (this.transType === "Wave") { data = this.waveData; curIdx = this.activeWaveIdx; }
            else if (this.transType === "Mosaic") { data = this.mosaicData; curIdx = this.activeMosaicIdx; }
            else if (this.transType === "Picture") { data = this.pictholdData; curIdx = this.activePictholdIdx; }

            if (!data || !data.length) return;

            let newIdx = curIdx;
            if (e.key === "ArrowRight") newIdx = curIdx + 1;
            else if (e.key === "ArrowLeft") newIdx = curIdx - 1;
            else if (e.key === "ArrowDown") newIdx = curIdx + TCOLUMNS;
            else if (e.key === "ArrowUp") newIdx = curIdx - TCOLUMNS;

            if (newIdx >= 0 && newIdx < data.length) {
                e.preventDefault();
                e.stopPropagation();
                if (this.transType === "Threshold") this.updateThresholdSelection(newIdx);
                else if (this.transType === "Distortion") this.updateDistortionSelection(newIdx);
                else if (this.transType === "Spiral") this.updateSpiralSelection(newIdx);
                else if (this.transType === "Wave") this.updateWaveSelection(newIdx);
                else if (this.transType === "Mosaic") this.updateMosaicSelection(newIdx);
                else if (this.transType === "Picture") this.updatePictureSelection(newIdx);
            }
        }, true);
    }

    syncRandomizerToggleUI() {
        if (!this.btnRandomToggle) return;
        if (this.isRandomizerOpen) {
            this.btnRandomToggle.textContent = "Close Randomizer";
            this.btnRandomToggle.className = "w-full px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 text-slate-950 shadow";
            this.randomPanel.classList.remove("hidden");
            this.groupsContainer.classList.add("hidden");
        } else {
            this.btnRandomToggle.textContent = "Random";
            this.btnRandomToggle.className = "w-full px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition";
            this.randomPanel.classList.add("hidden");
            this.groupsContainer.classList.remove("hidden");
        }
    }

    onRandomSliderChanged(changedType) {
        const newVal = parseInt(this.randomSliders[changedType].value, 10);
        const otherTypes = this.randomTypes.filter(t => t !== changedType);
        const otherSum = otherTypes.reduce((acc, t) => acc + parseInt(this.randomSliders[t].value, 10), 0);
        const targetOtherSum = 100 - newVal;

        if (otherSum === 0) {
            if (targetOtherSum > 0) {
                const share = targetOtherSum / otherTypes.length;
                let remainder = targetOtherSum;
                otherTypes.forEach((t, i) => {
                    const val = i < otherTypes.length - 1 ? Math.round(share) : remainder;
                    this.randomSliders[t].value = String(val);
                    remainder -= val;
                });
            }
        } else {
            let remainder = targetOtherSum;
            otherTypes.forEach((t, i) => {
                const cur = parseInt(this.randomSliders[t].value, 10);
                if (i === otherTypes.length - 1) {
                    this.randomSliders[t].value = String(Math.max(0, remainder));
                } else {
                    const allocated = Math.round((cur / otherSum) * targetOtherSum);
                    this.randomSliders[t].value = String(Math.max(0, allocated));
                    remainder -= allocated;
                }
            });
        }

        const total = this.randomTypes.reduce((acc, t) => acc + parseInt(this.randomSliders[t].value, 10), 0);
        if (total !== 100) {
            const adj = 100 - total;
            for (const t of otherTypes) {
                const cur = parseInt(this.randomSliders[t].value, 10);
                if (cur + adj >= 0 && cur + adj <= 100) {
                    this.randomSliders[t].value = String(cur + adj);
                    break;
                }
            }
        }

        this.randomTypes.forEach((t) => {
            this.randomLabels[t].textContent = `${this.randomSliders[t].value}%`;
        });
    }

    onAssignRandomTransitions() {
        let targets = this.getSelectedItems();
        if (!targets.length) targets = this.app.mediaItems;
        if (!targets.length) {
            showToast("No pictures found to randomize.", "error");
            return;
        }

        this.ensureMaskDataLoaded();

        const options = {
            "No Fade": { "Slide": ["Left", "Right", "Up", "Down", "Replace"], "Wipe": ["Left", "Right", "Up", "Down", "UL", "UR", "LR", "LL"], "Zoom": ["OneA", "OneB", "FlipA", "FlipB"] },
            "Fade": { "Pan Out": ["Left", "Right", "Up", "Down", "Center", "UL", "UR", "LR", "LL"], "Pan In": ["Left", "Right", "Up", "Down", "Center", "UL", "UR", "LR", "LL"], "Simple": ["Replace"] },
            "Threshold": { "Threshold": Array.from({ length: this.thresholdData.length }, (_, i) => i) },
            "Distortion": { "Distortion": Array.from({ length: this.distortionData.length }, (_, i) => i) },
            "Spiral": { "Spiral": Array.from({ length: this.spiralData.length }, (_, i) => i) },
            "Wave": { "Wave": Array.from({ length: this.waveData.length }, (_, i) => i) },
            "Mosaic": { "Mosaic": Array.from({ length: this.mosaicData.length }, (_, i) => i) },
            "Picture": { "Picture": Array.from({ length: this.pictholdData.length }, (_, i) => i) }
        };

        const pool = [];
        this.randomTypes.forEach((t) => {
            const weight = parseInt(this.randomSliders[t].value, 10) || 0;
            for (let i = 0; i < weight; i++) pool.push(t);
        });
        const activePool = pool.length ? pool : this.randomTypes;

        targets.forEach((pic) => {
            const assignedType = activePool[Math.floor(Math.random() * activePool.length)];
            const subtypesObj = options[assignedType];
            const subtypeKeys = Object.keys(subtypesObj);
            const assignedSubtype = subtypeKeys[Math.floor(Math.random() * subtypeKeys.length)];
            const itemsList = subtypesObj[assignedSubtype];
            const assignedItem = itemsList[Math.floor(Math.random() * itemsList.length)];

            pic.transDuration = this.transDuration;
            pic.transType = assignedType;
            pic.transSubtype = assignedSubtype;
            pic.transItem = assignedItem;
            pic.transNegative = Math.random() < 0.5;
            pic.transRotation = Math.floor(Math.random() * 4);
        });

        this.isRandomizerOpen = false;
        this.syncRandomizerToggleUI();
        this.syncWithActiveItem();
        this.app.renderFilmstrip();
        showToast(`Randomized transitions for ${targets.length} slide(s)`, "success");
    }

    ensureMaskDataLoaded() {
        if (!this.thresholdData) this.thresholdData = this.generateMasksForCategory("Threshold", TMASK_COUNT);
        if (!this.distortionData) this.distortionData = this.generateMasksForCategory("Distortion", TMASK_COUNT);
        if (!this.spiralData) this.spiralData = this.generateMasksForCategory("Spiral", TMASK_COUNT);
        if (!this.waveData) this.waveData = this.generateMasksForCategory("Wave", TMASK_COUNT);
        if (!this.mosaicData) this.mosaicData = this.generateMasksForCategory("Mosaic", TMASK_COUNT);
        this.rebuildPictureMaskData();
    }

    rebuildPictureMaskData() {
        const items = this.app.mediaItems || [];
        this.pictholdData = [];

        items.slice(0, TMASK_COUNT).forEach((itm, idx) => {
            const cvs = document.createElement("canvas");
            cvs.width = 160;
            cvs.height = 90;
            const ctx = cvs.getContext("2d");
            const src = itm.getProcessedSource ? itm.getProcessedSource() : itm.imgElement;
            if (src) {
                ctx.drawImage(src, 0, 0, 160, 90);
            }
            this.pictholdData.push({ canvas: cvs, name: itm.title || `Slide_${idx + 1}` });
        });

        if (this.pictholdData.length === 0) {
            this.pictholdData = this.generateMasksForCategory("Threshold", 15);
        }
    }

    pseudoHash(x, y, seed = 1) {
        const h = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453;
        return h - Math.floor(h);
    }

    generateMasksForCategory(category, count = 45) {
        const masks = [];
        const w = 160, h = 90;

        const thresholdNames = [
            "Linear Horizontal", "Linear Vertical", "Linear Diagonal",
            "Barn Door Vertical", "Barn Door Horizontal", "Cross Split",
            "Circle Iris", "Oval Iris", "Clock Sweep",
            "Dual Fan Sweep", "Quad Windmill", "Octa Pinwheel",
            "Diamond Iris", "Box Iris", "Octagon Iris",
            "H-Blinds 4", "H-Blinds 8", "H-Blinds 14",
            "V-Blinds 4", "V-Blinds 8", "V-Blinds 14",
            "Diag Blinds TL 4", "Diag Blinds TL 8", "Diag Blinds TL 14",
            "Diag Blinds TR 4", "Diag Blinds TR 8", "Diag Blinds TR 14",
            "Bullseye 3 Rings", "Bullseye 6 Rings", "Bullseye 10 Rings",
            "Diamond Rings 4", "Box Rings 4", "Box Rings 8",
            "Corner Arc TL", "Corner Arc BR", "Four Corners",
            "Top Arch Drape", "Side Stage Curtains", "Bowtie Wipe",
            "Chevron Right", "Chevron Down", "Multi Chevron",
            "Expanding Plus", "Expanding X", "Swiss Grid Cross"
        ];

        const mosaicNames = [
            "Checker Coarse", "Checker Medium", "Checker Fine",
            "Halftone Dots Coarse", "Halftone Dots Medium", "Halftone Dots Fine",
            "Diamond Grid Coarse", "Diamond Grid Medium", "Diamond Grid Fine",
            "Hex Honeycomb Coarse", "Hex Honeycomb Medium", "Hex Honeycomb Fine",
            "Brick Wall Coarse", "Brick Wall Medium", "Brick Wall Fine",
            "Pixel Blocks L-R", "Pixel Blocks Radial", "Pixel Blocks Diag",
            "Dissolve Fine Grain", "Dissolve Med Grain", "Dissolve Coarse",
            "Rose 4 Petals", "Rose 8 Petals", "Rose 12 Petals",
            "Crystals Large", "Crystals Medium", "Crystals Fine",
            "Tartan Plaid Coarse", "Tartan Plaid Medium", "Tartan Plaid Fine",
            "Triangle Mesh Coarse", "Triangle Mesh Medium", "Triangle Mesh Fine",
            "Stepped Pyramid 4", "Stepped Pyramid 8", "Stepped Pyramid 12",
            "Stained Wheel 6", "Stained Wheel 12", "Stained Wheel 24",
            "Diag Halftone Coarse", "Diag Halftone Medium", "Diag Halftone Fine",
            "Barcode Strips Coarse", "Barcode Strips Medium", "Barcode Strips Fine"
        ];

        for (let idx = 0; idx < count; idx++) {
            const cvs = document.createElement("canvas");
            cvs.width = w;
            cvs.height = h;
            const ctx = cvs.getContext("2d");
            const imgData = ctx.createImageData(w, h);
            const data = imgData.data;

            const trio = Math.floor(idx / 3);
            const sub = idx % 3;

            for (let y = 0; y < h; y++) {
                const ny = y / (h - 1);
                const cy = ny - 0.5;
                for (let x = 0; x < w; x++) {
                    const nx = x / (w - 1);
                    const cx = nx - 0.5;
                    const r = Math.hypot(cx, cy) * 1.4142;
                    const theta = (Math.atan2(cy, cx) + Math.PI) / (2 * Math.PI);
                    let v = 0;

                    if (category === "Threshold") {
                        switch (trio) {
                            case 0: v = sub === 0 ? nx : sub === 1 ? ny : (nx + ny) * 0.5; break;
                            case 1: v = sub === 0 ? Math.abs(cx) * 2 : sub === 1 ? Math.abs(cy) * 2 : Math.min(Math.abs(cx), Math.abs(cy)) * 2; break;
                            case 2: v = sub === 0 ? r : sub === 1 ? Math.hypot(cx * 1.6, cy * 0.9) * 1.4 : theta; break;
                            case 3: const blades = sub === 0 ? 2 : sub === 1 ? 4 : 8; v = (theta * blades) % 1; break;
                            case 4: const d1 = Math.abs(cx) + Math.abs(cy), d2 = Math.max(Math.abs(cx), Math.abs(cy)) * 2; v = sub === 0 ? d1 : sub === 1 ? d2 : (d1 + d2) * 0.5; break;
                            case 5: const hb = sub === 0 ? 4 : sub === 1 ? 8 : 14; v = (ny * hb) % 1; break;
                            case 6: const vb = sub === 0 ? 4 : sub === 1 ? 8 : 14; v = (nx * vb) % 1; break;
                            case 7: const db1 = sub === 0 ? 4 : sub === 1 ? 8 : 14; v = ((nx + ny) * 0.5 * db1) % 1; break;
                            case 8: const db2 = sub === 0 ? 4 : sub === 1 ? 8 : 14; v = (((1 - nx) + ny) * 0.5 * db2) % 1; break;
                            case 9: const rings = sub === 0 ? 3 : sub === 1 ? 6 : 10; v = (r * rings) % 1; break;
                            case 10: const dMetric = sub === 0 ? (Math.abs(cx) + Math.abs(cy)) * 4 : Math.max(Math.abs(cx), Math.abs(cy)) * (sub === 1 ? 8 : 16); v = dMetric % 1; break;
                            case 11: v = sub === 0 ? Math.hypot(nx, ny) * 0.71 : sub === 1 ? Math.hypot(1 - nx, 1 - ny) * 0.71 : Math.min(Math.hypot(nx, ny), Math.hypot(1 - nx, ny), Math.hypot(nx, 1 - ny), Math.hypot(1 - nx, 1 - ny)) * 1.42; break;
                            case 12: v = sub === 0 ? ny + Math.sin(nx * Math.PI) * 0.35 - 0.15 : sub === 1 ? Math.abs(cx) * 2 * (1 - ny * 0.35) : Math.abs(cy) / (Math.abs(cx) + 0.15); break;
                            case 13: v = sub === 0 ? (nx * 0.7 + Math.abs(cy) * 0.6) : sub === 1 ? (ny * 0.7 + Math.abs(cx) * 0.6) : ((nx * 3 + Math.abs((ny * 3) % 1 - 0.5)) % 1); break;
                            case 14: v = sub === 0 ? Math.min(Math.abs(cx), Math.abs(cy)) * 3.2 + r * 0.25 : sub === 1 ? Math.min(Math.abs(cx - cy), Math.abs(cx + cy)) * 2.5 + r * 0.2 : Math.min(Math.abs((nx * 3) % 1 - 0.5), Math.abs((ny * 3) % 1 - 0.5)) * 2.5 + r * 0.3; break;
                        }
                    } else if (category === "Distortion") {
                        const fx = (2 + (trio % 5) * 1.8) * (1 + sub * 0.45);
                        const fy = (2 + ((trio * 2) % 5) * 1.8) * (1 + sub * 0.45);
                        const phase = trio * 0.7 + sub * 1.1;

                        if (trio < 5) {
                            const w1 = Math.sin(nx * fx * Math.PI + Math.cos(ny * fy * Math.PI + phase));
                            const w2 = Math.cos(ny * fy * Math.PI - Math.sin(nx * fx * Math.PI - phase));
                            v = (w1 * w2 + 1) * 0.5 * 0.75 + (sub === 0 ? nx : sub === 1 ? ny : r) * 0.25;
                        } else if (trio < 10) {
                            const turb = Math.sin(nx * fx * 2 + Math.sin(ny * fy * 3 + Math.cos(nx * fy * 2)));
                            const base = sub === 0 ? nx : sub === 1 ? (nx + ny) * 0.5 : r;
                            v = Math.sin((base + turb * 0.25) * Math.PI * (2 + sub)) * 0.5 + 0.5;
                        } else {
                            const angle = Math.atan2(cy, cx) + Math.sin(r * fx * 2) * (1 + sub * 0.8);
                            const eddy = Math.sin(angle * (2 + (trio % 4)) + r * fy * 3);
                            v = (eddy + 1) * 0.35 + r * 0.3;
                        }
                    } else if (category === "Spiral") {
                        const arms = [1, 2, 3, 4, 5, 6, 8, 10, 12, 2, 3, 4, 6, 8, 12][trio];
                        const twist = (1.5 + sub * 1.4) * (trio % 2 === 0 ? 1 : -1);

                        if (trio < 5) {
                            v = (theta * arms + r * twist) % 1;
                        } else if (trio < 9) {
                            const logR = Math.log(r + 0.08) * (1.2 + sub * 0.6);
                            v = (theta * arms + logR * (trio % 2 === 0 ? 1 : -1)) % 1;
                        } else if (trio < 12) {
                            const s1 = (theta * arms + r * Math.abs(twist)) % 1;
                            const s2 = (theta * arms - r * Math.abs(twist) + 10) % 1;
                            v = (Math.sin(s1 * Math.PI * 2) * Math.cos(s2 * Math.PI * 2) + 1) * 0.5 * 0.75 + r * 0.25;
                        } else {
                            if (trio === 12) {
                                const r1 = Math.hypot(cx + 0.22, cy), t1 = (Math.atan2(cy, cx + 0.22) + Math.PI) / (2 * Math.PI);
                                const r2 = Math.hypot(cx - 0.22, cy), t2 = (Math.atan2(cy, cx - 0.22) + Math.PI) / (2 * Math.PI);
                                v = ((t1 - t2) * (2 + sub) + (r1 + r2) * 2) % 1;
                            } else if (trio === 13) {
                                const sqR = Math.max(Math.abs(cx), Math.abs(cy)) * 2;
                                v = (theta * (1 + sub * 2) + sqR * (2 + sub)) % 1;
                            } else {
                                const dR = (Math.abs(cx) + Math.abs(cy));
                                v = (theta * (2 + sub * 2) - dR * (2.5 + sub)) % 1;
                            }
                        }
                        if (v < 0) v += 1;
                    } else if (category === "Wave") {
                        const freq = 2 + sub * 2 + (trio % 3);
                        const amp = 0.12 + sub * 0.05;

                        switch (trio) {
                            case 0: v = nx + Math.sin(ny * freq * Math.PI * 2) * amp; break;
                            case 1: v = ny + Math.sin(nx * freq * Math.PI * 2) * amp; break;
                            case 2: v = (nx + ny) * 0.5 + Math.sin((nx - ny) * freq * Math.PI * 2) * amp; break;
                            case 3: v = r * 0.7 + (Math.sin(r * (3 + sub * 3) * Math.PI * 2) + 1) * 0.15; break;
                            case 4:
                                const dL = Math.hypot(nx, ny - 0.5), dR = Math.hypot(1 - nx, ny - 0.5);
                                v = (Math.sin(dL * freq * 10) + Math.sin(dR * freq * 10) + 2) * 0.2 + nx * 0.2;
                                break;
                            case 5:
                                const c1 = Math.hypot(nx, ny), c2 = Math.hypot(1 - nx, 1 - ny);
                                v = (Math.cos((c1 - c2) * freq * 10) + 1) * 0.35 + r * 0.3;
                                break;
                            case 6: v = (Math.sin(nx * freq * Math.PI) * Math.sin(ny * freq * Math.PI) + 1) * 0.35 + nx * 0.3; break;
                            case 7: const zig = Math.abs(((ny * freq * 2) % 2) - 1); v = nx * 0.8 + zig * 0.2; break;
                            case 8: const zag = Math.abs(((nx * freq * 2) % 2) - 1); v = ny * 0.8 + zag * 0.2; break;
                            case 9: v = r + Math.sin(theta * (4 + sub * 4) * Math.PI * 2) * 0.15; break;
                            case 10: v = nx * 0.6 + (Math.sin(ny * freq * 6 + nx * 8) + Math.cos(ny * freq * 6 - nx * 8) + 2) * 0.1; break;
                            case 11: v = (Math.sin(nx * (3 + sub) * Math.PI) + Math.sin(ny * (4 + sub * 2) * Math.PI) + 2) * 0.2 + r * 0.2; break;
                            case 12: v = ny * 0.7 + Math.exp(-ny * 2) * Math.sin(nx * freq * 10) * 0.25 + 0.1; break;
                            case 13: const boxD = Math.max(Math.abs(cx), Math.abs(cy)) * 2; v = boxD * 0.65 + (Math.sin(boxD * (4 + sub * 3) * Math.PI * 2) + 1) * 0.175; break;
                            case 14: v = (Math.sin(nx * freq * 6 + ny * 6) * Math.cos(nx * freq * 6 - ny * 6) + 1) * 0.35 + (nx + ny) * 0.15; break;
                        }
                    } else if (category === "Mosaic") {
                        const scale = sub === 0 ? 5 : sub === 1 ? 9 : 15;
                        switch (trio) {
                            case 0:
                                const cxIdx = Math.floor(nx * scale * 1.6), cyIdx = Math.floor(ny * scale);
                                v = (((cxIdx + cyIdx) % 2 === 0) ? 0.35 : 0.0) + (nx * 0.45 + ny * 0.2);
                                break;
                            case 1:
                                const gx = (nx * scale * 1.6) % 1 - 0.5, gy = (ny * scale) % 1 - 0.5;
                                v = Math.hypot(gx, gy) * 1.1 + nx * 0.35;
                                break;
                            case 2:
                                const dx = Math.abs(((nx * scale * 1.5) % 1) - 0.5), dy = Math.abs(((ny * scale) % 1) - 0.5);
                                v = (dx + dy) * 0.75 + (nx + ny) * 0.125;
                                break;
                            case 3:
                                const rowH = Math.floor(ny * scale * 1.2);
                                const hx = ((nx * scale * 1.6) + (rowH % 2) * 0.5) % 1 - 0.5;
                                const hy = (ny * scale * 1.2) % 1 - 0.5;
                                v = Math.hypot(hx, hy) * 1.05 + r * 0.35;
                                break;
                            case 4:
                                const bRow = Math.floor(ny * scale * 1.4);
                                const bx = ((nx * scale) + (bRow % 2) * 0.5) % 1;
                                const by = (ny * scale * 1.4) % 1;
                                const mortar = Math.min(bx, 1 - bx, by, 1 - by) * 4;
                                v = Math.min(1, mortar * 0.45) + this.pseudoHash(Math.floor((nx * scale) + (bRow % 2) * 0.5), bRow, idx) * 0.35 + ny * 0.2;
                                break;
                            case 5:
                                const px = Math.floor(nx * 16), py = Math.floor(ny * 9);
                                const rnd = this.pseudoHash(px, py, sub + 10);
                                const grad = sub === 0 ? nx : sub === 1 ? r : (nx + ny) * 0.5;
                                v = grad * 0.65 + rnd * 0.35;
                                break;
                            case 6:
                                const gSize = sub === 0 ? 1 : sub === 1 ? 2 : 4;
                                const dRnd = this.pseudoHash(Math.floor(x / gSize), Math.floor(y / gSize), sub + 20);
                                v = dRnd * 0.75 + r * 0.25;
                                break;
                            case 7:
                                const petals = sub === 0 ? 4 : sub === 1 ? 8 : 12;
                                const rose = Math.abs(Math.cos(theta * petals * Math.PI));
                                v = (r * 0.7 + (1 - rose) * 0.3);
                                break;
                            case 8:
                                const cScale = sub === 0 ? 4 : sub === 1 ? 7 : 11;
                                const ix = Math.floor(nx * cScale * 1.6), iy = Math.floor(ny * cScale);
                                const fxCell = (nx * cScale * 1.6) - ix, fyCell = (ny * cScale) - iy;
                                let minDist = 10;
                                for (let oy = -1; oy <= 1; oy++) {
                                    for (let ox = -1; ox <= 1; ox++) {
                                        const ppx = ox + this.pseudoHash(ix + ox, iy + oy, 1) - fxCell;
                                        const ppy = oy + this.pseudoHash(iy + oy, ix + ox, 2) - fyCell;
                                        const d = Math.hypot(ppx, ppy);
                                        if (d < minDist) minDist = d;
                                    }
                                }
                                v = Math.min(1, minDist * 0.85 + nx * 0.25);
                                break;
                            case 9:
                                const tx = Math.abs(Math.sin(nx * scale * Math.PI)), ty = Math.abs(Math.sin(ny * scale * Math.PI));
                                v = (tx + ty) * 0.38 + (nx + ny) * 0.12;
                                break;
                            case 10:
                                const u = nx * scale * 1.5, vCoord = ny * scale;
                                const tri = ((u + vCoord * 0.5) % 1 + (vCoord % 1)) * 0.5;
                                v = tri * 0.65 + nx * 0.35;
                                break;
                            case 11:
                                const steps = sub === 0 ? 4 : sub === 1 ? 8 : 12;
                                const boxDist = Math.max(Math.abs(cx), Math.abs(cy)) * 2;
                                v = Math.floor(boxDist * steps) / steps;
                                break;
                            case 12:
                                const segs = sub === 0 ? 6 : sub === 1 ? 12 : 24;
                                const rBand = Math.floor(r * 5) / 5;
                                const aSeg = Math.floor(theta * segs) / segs;
                                v = (rBand * 0.55 + this.pseudoHash(rBand * 10, aSeg * segs, sub) * 0.45);
                                break;
                            case 13:
                                const rx = (nx + ny) * scale, ry = (nx - ny) * scale;
                                const dgx = ((rx % 1) + 1) % 1 - 0.5, dgy = ((ry % 1) + 1) % 1 - 0.5;
                                v = Math.hypot(dgx, dgy) * 1.1 + (nx + ny) * 0.18;
                                break;
                            case 14:
                                const bCols = sub === 0 ? 12 : sub === 1 ? 24 : 40;
                                const colHash = this.pseudoHash(Math.floor(nx * bCols), 0, sub + 50);
                                v = colHash * 0.6 + ny * 0.4;
                                break;
                        }
                    }

                    const lum = Math.max(0, Math.min(255, Math.round(v * 255)));
                    const p = (y * w + x) * 4;
                    data[p] = lum;
                    data[p + 1] = lum;
                    data[p + 2] = lum;
                    data[p + 3] = 255;
                }
            }

            ctx.putImageData(imgData, 0, 0);
            const labelName = category === "Threshold" ? (thresholdNames[idx] || `Threshold_${idx + 1}`)
                            : category === "Mosaic" ? (mosaicNames[idx] || `Mosaic_${idx + 1}`)
                            : `${category}_${idx + 1}`;
            masks.push({ canvas: cvs, name: labelName });
        }
        return masks;
    }

    // ==================================================================
    // 3 ROWS x 15 BUTTONS (5 GROUPS OF 3 PER ROW) SELECTOR GRID
    // ==================================================================
    populateSelectorGrid(data, gridName, onClickIdx, buttonList) {
        const gridEl = this.groupEls[gridName];
        if (!gridEl) return;
        gridEl.innerHTML = "";
        buttonList.length = 0;

        gridEl.className = "flex flex-col gap-1.5 items-center py-1 px-2";
        const totalRows = Math.min(TMAX_ROWS, Math.ceil(data.length / TCOLUMNS));

        for (let r = 0; r < totalRows; r++) {
            const rowDiv = document.createElement("div");
            rowDiv.className = "flex items-center gap-4";

            for (let g = 0; g < 5; g++) {
                const groupDiv = document.createElement("div");
                groupDiv.className = "flex items-center gap-0.5";

                for (let b = 0; b < 3; b++) {
                    const i = r * TCOLUMNS + g * 3 + b;
                    if (i >= data.length) break;
                    const item = data[i];

                    const btn = document.createElement("button");
                    btn.type = "button";
                    btn.idx = i;
                    btn.title = item.name.replace(/_/g, " ");
                    btn.className = "w-[44px] h-[34px] rounded border border-slate-700 bg-slate-900 p-0.5 flex items-center justify-center overflow-hidden transition-all";

                    const thumb = document.createElement("canvas");
                    thumb.width = 40;
                    thumb.height = 30;
                    thumb.className = "block rounded pointer-events-none";
                    const tCtx = thumb.getContext("2d");
                    tCtx.drawImage(item.canvas, 0, 0, 40, 30);
                    btn.appendChild(thumb);

                    btn.addEventListener("click", () => onClickIdx(i));
                    buttonList.push(btn);
                    groupDiv.appendChild(btn);
                }

                if (groupDiv.children.length > 0) {
                    rowDiv.appendChild(groupDiv);
                }
            }
            gridEl.appendChild(rowDiv);
        }
    }

    // ==================================================================
    // DUPLICATE VARIANT PIXEL MATCHER & HIGHLIGHT CONTROLLER
    // ==================================================================
    areCanvasesEqual(cvsA, cvsB) {
        if (!cvsA || !cvsB) return false;
        if (cvsA.width !== cvsB.width || cvsA.height !== cvsB.height) return false;

        const ctxA = cvsA.getContext("2d");
        const ctxB = cvsB.getContext("2d");
        const imgA = ctxA.getImageData(0, 0, cvsA.width, cvsA.height).data;
        const imgB = ctxB.getImageData(0, 0, cvsB.width, cvsB.height).data;
        const len = imgA.length;

        for (let i = 0; i < len; i += 4) {
            if (Math.abs(imgA[i] - imgB[i]) > 3) return false;
        }
        return true;
    }

    highlightButton(btn, isActive, isDuplicate = false) {
        if (!btn) return;
        if (isActive) {
            btn.style.backgroundColor = "rgb(173, 216, 230)";
            btn.style.color = "#0f172a";
            btn.style.borderColor = "#38bdf8";
            btn.style.opacity = "1";
            btn.style.transform = isDuplicate ? "scale(0.85)" : "scale(1)";
            btn.style.borderStyle = isDuplicate ? "dashed" : "solid";
        } else if (isDuplicate) {
            btn.style.backgroundColor = "";
            btn.style.color = "";
            btn.style.borderColor = "rgba(100, 116, 139, 0.7)";
            btn.style.opacity = "0.45";
            btn.style.transform = "scale(0.82)";
            btn.style.borderStyle = "dashed";
        } else {
            btn.style.backgroundColor = "";
            btn.style.color = "";
            btn.style.borderColor = "";
            btn.style.opacity = "1";
            btn.style.transform = "scale(1)";
            btn.style.borderStyle = "solid";
        }
    }

    transformMaskCanvas(baseCanvas, rotIdx, invert) {
        const swap = (rotIdx === 2 || rotIdx === 3);
        const w = swap ? baseCanvas.height : baseCanvas.width;
        const h = swap ? baseCanvas.width : baseCanvas.height;

        const out = document.createElement("canvas");
        out.width = w;
        out.height = h;
        const ctx = out.getContext("2d");

        ctx.save();
        ctx.translate(w / 2, h / 2);
        if (rotIdx === 1) ctx.rotate(Math.PI);
        else if (rotIdx === 2) ctx.rotate(Math.PI / 2);
        else if (rotIdx === 3) ctx.rotate(-Math.PI / 2);
        ctx.drawImage(baseCanvas, -baseCanvas.width / 2, -baseCanvas.height / 2);
        ctx.restore();

        if (invert) {
            const imgData = ctx.getImageData(0, 0, w, h);
            const d = imgData.data;
            for (let i = 0; i < d.length; i += 4) {
                d[i] = 255 - d[i];
                d[i + 1] = 255 - d[i + 1];
                d[i + 2] = 255 - d[i + 2];
            }
            ctx.putImageData(imgData, 0, 0);
        }

        return out;
    }

    updateRotationButtons() {
        if (!this.rotationButtons || this.rotationButtons.length < 4) return;
        this.ensureMaskDataLoaded();

        let item = null;
        if (this.transType === "Distortion") item = this.distortionData[this.activeDistortionIdx % this.distortionData.length];
        else if (this.transType === "Spiral") item = this.spiralData[this.activeSpiralIdx % this.spiralData.length];
        else if (this.transType === "Wave") item = this.waveData[this.activeWaveIdx % this.waveData.length];
        else if (this.transType === "Mosaic") item = this.mosaicData[this.activeMosaicIdx % this.mosaicData.length];
        else item = this.thresholdData[this.activeThresholdIdx % this.thresholdData.length];

        if (!item) return;

        const helpBubbles = ["Normal 0°", "Flip 180°", "Right 90°", "Left -90°"];
        const variants = [];
        for (let i = 0; i < 4; i++) {
            variants.push(this.transformMaskCanvas(item.canvas, i, this.maskInverted));
        }

        // Duplicate variant checks
        const isDup180 = this.areCanvasesEqual(variants[0], variants[1]);
        const isDup90 = this.areCanvasesEqual(variants[0], variants[2]);
        const isDupNeg90_0 = this.areCanvasesEqual(variants[0], variants[3]);
        const isDupNeg90_90 = this.areCanvasesEqual(variants[2], variants[3]);
        const isDupNeg90 = isDupNeg90_0 || isDupNeg90_90;

        const isDuplicate = [false, isDup180, isDup90, isDupNeg90];
        const dupNotes = [
            "",
            isDup180 ? " (Same as Normal 0°)" : "",
            isDup90 ? " (Same as Normal 0°)" : "",
            isDupNeg90_0 ? " (Same as Normal 0°)" : (isDupNeg90_90 ? " (Same as Right 90°)" : "")
        ];

        for (let i = 0; i < 4; i++) {
            const btn = this.rotationButtons[i];
            const ctx = btn.thumbCanvas.getContext("2d");
            ctx.clearRect(0, 0, 60, 38);
            ctx.drawImage(variants[i], 0, 0, 60, 38);

            const dup = isDuplicate[i];
            btn.title = helpBubbles[i] + dupNotes[i];

            const isActive = (i === this.activeRotationIdx);
            this.highlightButton(btn, isActive, dup);
        }

        if (this.negativeBtn) {
            this.negativeBtn.title = "Negative";
            this.highlightButton(this.negativeBtn, this.maskInverted, false);
        }
    }

    updateThresholdSelection(idx) {
        this.activeThresholdIdx = idx;
        this.transType = "Threshold";
        this.transSubtype = "Threshold";
        this.transItem = idx;
        this.thresholdButtons.forEach((b, i) => this.highlightButton(b, i === idx));
        this.updateRotationButtons();
        this.startTrans("Type-Threshold");
        this.saveToPicture();
    }

    updateDistortionSelection(idx) {
        this.activeDistortionIdx = idx;
        this.transType = "Distortion";
        this.transSubtype = "Distortion";
        this.transItem = idx;
        this.distortionButtons.forEach((b, i) => this.highlightButton(b, i === idx));
        this.updateRotationButtons();
        this.startTrans("Type-Distortion");
        this.saveToPicture();
    }

    updateSpiralSelection(idx) {
        this.activeSpiralIdx = idx;
        this.transType = "Spiral";
        this.transSubtype = "Spiral";
        this.transItem = idx;
        this.spiralButtons.forEach((b, i) => this.highlightButton(b, i === idx));
        this.updateRotationButtons();
        this.startTrans("Type-Spiral");
        this.saveToPicture();
    }

    updateWaveSelection(idx) {
        this.activeWaveIdx = idx;
        this.transType = "Wave";
        this.transSubtype = "Wave";
        this.transItem = idx;
        this.waveButtons.forEach((b, i) => this.highlightButton(b, i === idx));
        this.updateRotationButtons();
        this.startTrans("Type-Wave");
        this.saveToPicture();
    }

    updateMosaicSelection(idx) {
        this.activeMosaicIdx = idx;
        this.transType = "Mosaic";
        this.transSubtype = "Mosaic";
        this.transItem = idx;
        this.mosaicButtons.forEach((b, i) => this.highlightButton(b, i === idx));
        this.updateRotationButtons();
        this.startTrans("Type-Mosaic");
        this.saveToPicture();
    }

    updatePictureSelection(idx) {
        this.activePictholdIdx = idx;
        this.transType = "Picture";
        this.transSubtype = "Picture";
        this.transItem = idx;
        this.pictholdButtons.forEach((b, i) => this.highlightButton(b, i === idx));
        this.startTrans("Type-Picture");
        this.saveToPicture();
    }

    onRotationClick(idx) {
        this.activeRotationIdx = idx;
        this.updateRotationButtons();
        this.startTrans(`Type-${this.transType}`);
        this.saveToPicture();
    }

    onNegativeClick() {
        this.maskInverted = !this.maskInverted;
        this.highlightButton(this.negativeBtn, this.maskInverted);
        this.updateRotationButtons();
        this.startTrans(`Type-${this.transType}`);
        this.saveToPicture();
    }

    handleLeftTypeClick(tName) {
        Object.entries(this.typeButtons).forEach(([lbl, btn]) => {
            this.highlightButton(btn, lbl === tName);
        });

        if (tName === "Fade") {
            this.transType = "Fade";
            this.transSubtype = "Simple";
            this.transItem = "Replace";
            this.startTrans("Type-Fade");
        } else if (tName === "No Fade") {
            this.transType = "No Fade";
            this.transSubtype = "Slide";
            this.transItem = "Replace";
            this.startTrans("Type-No Fade");
        } else if (tName === "Image") {
            if (!this.imageCategories.includes(this.transType)) {
                this.transType = "Threshold";
                this.transSubtype = "Threshold";
                this.transItem = this.activeThresholdIdx;
            }
            this.startTrans(`Type-${this.transType}`);
        }

        this.updateVisibleGroups(`Type-${this.transType}`);
        this.saveToPicture();
    }

    handleImageChoiceClick(sub) {
        Object.entries(this.imageSubButtons).forEach(([lbl, btn]) => {
            this.highlightButton(btn, lbl === sub);
        });

        this.transType = sub;
        this.transSubtype = sub;
        if (sub === "Threshold") this.transItem = this.activeThresholdIdx;
        else if (sub === "Distortion") this.transItem = this.activeDistortionIdx;
        else if (sub === "Spiral") this.transItem = this.activeSpiralIdx;
        else if (sub === "Wave") this.transItem = this.activeWaveIdx;
        else if (sub === "Mosaic") this.transItem = this.activeMosaicIdx;
        else if (sub === "Picture") this.transItem = this.activePictholdIdx;

        this.updateVisibleGroups(`Type-${this.transType}`);
        this.startTrans(`Type-${this.transType}`);
        this.saveToPicture();
    }

    handleSubButtonClick(label) {
        this.allSubButtons.forEach(btn => this.highlightButton(btn, btn.internalName === label));

        if (!label.startsWith("Type-")) {
            const [subtype, item] = label.split("-");
            this.transSubtype = subtype;
            this.transItem = item;
        }

        this.startTrans(label);
        this.saveToPicture();
    }

    updateVisibleGroups(activeType) {
        this.ensureMaskDataLoaded();

        const isImgType = this.imageCategories.some(t => activeType.includes(t));

        let activeLeft = "Fade";
        if (activeType.includes("No Fade")) activeLeft = "No Fade";
        else if (isImgType) activeLeft = "Image";

        Object.entries(this.typeButtons).forEach(([lbl, btn]) => {
            this.highlightButton(btn, lbl === activeLeft);
        });

        if (isImgType) {
            Object.entries(this.imageSubButtons).forEach(([lbl, btn]) => {
                this.highlightButton(btn, activeType.includes(lbl));
            });
            this.groupEls["ImageChoicesRow"].classList.remove("hidden");
        } else {
            this.groupEls["ImageChoicesRow"].classList.add("hidden");
        }

        if (activeType.includes("Threshold") && !this.thresholdButtons.length) {
            this.populateSelectorGrid(this.thresholdData, "ThresholdGrid", (i) => this.updateThresholdSelection(i), this.thresholdButtons);
        }
        if (activeType.includes("Distortion") && !this.distortionButtons.length) {
            this.populateSelectorGrid(this.distortionData, "DistortionGrid", (i) => this.updateDistortionSelection(i), this.distortionButtons);
        }
        if (activeType.includes("Spiral") && !this.spiralButtons.length) {
            this.populateSelectorGrid(this.spiralData, "SpiralGrid", (i) => this.updateSpiralSelection(i), this.spiralButtons);
        }
        if (activeType.includes("Wave") && !this.waveButtons.length) {
            this.populateSelectorGrid(this.waveData, "WaveGrid", (i) => this.updateWaveSelection(i), this.waveButtons);
        }
        if (activeType.includes("Mosaic") && !this.mosaicButtons.length) {
            this.populateSelectorGrid(this.mosaicData, "MosaicGrid", (i) => this.updateMosaicSelection(i), this.mosaicButtons);
        }
        if (activeType.includes("Picture")) {
            this.rebuildPictureMaskData();
            this.populateSelectorGrid(this.pictholdData, "PictureGrid", (i) => this.updatePictureSelection(i), this.pictholdButtons);
        }

        // Restored 3 rows for No Fade and 3 rows for Fade
        let show = [];
        if (activeType.includes("No Fade")) show = ["Slide", "Wipe", "Zoom"];
        else if (activeType.includes("Fade")) show = ["Pan Out", "Pan In", "Simple"];
        else if (activeType.includes("Threshold")) show = ["ThresholdGrid", "RotationGrid"];
        else if (activeType.includes("Distortion")) show = ["DistortionGrid", "RotationGrid"];
        else if (activeType.includes("Spiral")) show = ["SpiralGrid", "RotationGrid"];
        else if (activeType.includes("Wave")) show = ["WaveGrid", "RotationGrid"];
        else if (activeType.includes("Mosaic")) show = ["MosaicGrid", "RotationGrid"];
        else if (activeType.includes("Picture")) show = ["PictureGrid"];

        Object.entries(this.groupEls).forEach(([name, el]) => {
            if (name === "ImageChoicesRow") return;
            if (name === "RotationGrid") {
                const showRot = show.includes("RotationGrid") && !this.isRandomizerOpen;
                if (showRot) {
                    el.classList.remove("invisible", "pointer-events-none");
                } else {
                    el.classList.add("invisible", "pointer-events-none");
                }
            } else if (show.includes(name)) {
                el.classList.remove("hidden");
            } else {
                el.classList.add("hidden");
            }
        });

        if (isImgType && !activeType.includes("Picture")) {
            this.updateRotationButtons();
        }
    }

    createPaddedSlideCanvas(mediaItem, fallbackColor = "#0f172a") {
        const [cw, ch] = this.canvasSize;
        const cvs = document.createElement("canvas");
        cvs.width = cw;
        cvs.height = ch;
        const ctx = cvs.getContext("2d");

        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, cw, ch);

        if (!mediaItem || !mediaItem.imgElement) {
            ctx.fillStyle = fallbackColor;
            ctx.fillRect(0, 0, cw, ch);
            return cvs;
        }

        const src = mediaItem.getProcessedSource ? mediaItem.getProcessedSource() : mediaItem.imgElement;
        const sw = src.naturalWidth || src.videoWidth || src.width || mediaItem.w;
        const sh = src.naturalHeight || src.videoHeight || src.height || mediaItem.h;

        const scale = Math.min(cw / sw, ch / sh);
        const dw = Math.max(1, Math.round(sw * scale));
        const dh = Math.max(1, Math.round(sh * scale));
        const dx = Math.floor((cw - dw) / 2);
        const dy = Math.floor((ch - dh) / 2);

        ctx.drawImage(src, 0, 0, sw, sh, dx, dy, dw, dh);
        return cvs;
    }

    syncWithActiveItem() {
        const pic = this.item;
        if (!pic) return;

        this.transDuration = pic.transDuration ?? 2.0;
        this.transType = pic.transType || "Fade";
        this.transSubtype = pic.transSubtype || "Simple";
        this.transItem = pic.transItem ?? "Replace";
        this.activeRotationIdx = pic.transRotation ?? 0;
        this.maskInverted = !!pic.transNegative;

        const items = this.app.mediaItems;
        const curIdx = items.indexOf(pic);
        let nextPic = pic;
        if (curIdx !== -1 && items.length > 1) {
            nextPic = (curIdx + 1 < items.length) ? items[curIdx + 1] : items[0];
        }

        this.srcCanvas = this.createPaddedSlideCanvas(pic, "#064e3b");
        this.dstCanvas = this.createPaddedSlideCanvas(nextPic, "#1e3a8a");

        if (this.sliderDuration) this.sliderDuration.value = String(Math.round(this.transDuration * 10));
        if (this.lblDurVal) this.lblDurVal.textContent = `${this.transDuration.toFixed(1)}s`;

        const targetTypeLabel = `Type-${this.transType}`;
        this.updateVisibleGroups(targetTypeLabel);

        this.allSubButtons.forEach(b => this.highlightButton(b, false));
        this.thresholdButtons.forEach(b => this.highlightButton(b, false));
        this.distortionButtons.forEach(b => this.highlightButton(b, false));
        this.spiralButtons.forEach(b => this.highlightButton(b, false));
        this.waveButtons.forEach(b => this.highlightButton(b, false));
        this.mosaicButtons.forEach(b => this.highlightButton(b, false));
        this.pictholdButtons.forEach(b => this.highlightButton(b, false));

        if (this.imageCategories.includes(this.transType)) {
            const idx = parseInt(this.transItem, 10) || 0;
            if (this.transType === "Threshold") {
                this.activeThresholdIdx = idx;
                this.highlightButton(this.thresholdButtons[idx], true);
            } else if (this.transType === "Distortion") {
                this.activeDistortionIdx = idx;
                this.highlightButton(this.distortionButtons[idx], true);
            } else if (this.transType === "Spiral") {
                this.activeSpiralIdx = idx;
                this.highlightButton(this.spiralButtons[idx], true);
            } else if (this.transType === "Wave") {
                this.activeWaveIdx = idx;
                this.highlightButton(this.waveButtons[idx], true);
            } else if (this.transType === "Mosaic") {
                this.activeMosaicIdx = idx;
                this.highlightButton(this.mosaicButtons[idx], true);
            } else if (this.transType === "Picture") {
                this.activePictholdIdx = idx;
                this.highlightButton(this.pictholdButtons[idx], true);
            }
            this.updateRotationButtons();
            this.startTrans(targetTypeLabel);
        } else {
            const targetBtnLabel = `${this.transSubtype}-${this.transItem}`;
            this.allSubButtons.forEach((btn) => {
                if (btn.internalName === targetBtnLabel) {
                    this.highlightButton(btn, true);
                }
            });
            this.startTrans(targetBtnLabel);
        }
    }

    saveToPicture() {
        const targets = this.getSelectedItems();
        if (!targets.length) return;

        for (const pic of targets) {
            pic.transDuration = this.transDuration;
            pic.transType = this.transType;
            pic.transSubtype = this.transSubtype;
            pic.transItem = this.transItem;
            pic.transRotation = this.activeRotationIdx;
            pic.transNegative = this.maskInverted;
        }
        this.app.renderFilmstrip();
    }

    stopAnimation() {
        if (this.animTimer) {
            clearInterval(this.animTimer);
            this.animTimer = null;
        }
    }

    startTrans(mode) {
        this.stopAnimation();
        if (!this.srcCanvas || !this.dstCanvas) return;

        this.mode = mode;
        this.progress = 0.0;
        this.isReversing = false;

        if (mode.startsWith("Type-No Fade")) {
            this.animStep = 1.0;
            this.renderCanvas();
            this.animTimer = setInterval(() => this.onAnimate(), 800);
        } else {
            const interval = 30;
            const totalMs = Math.max(100, Math.round(this.transDuration * 1000));
            this.animStep = interval / totalMs;
            this.renderCanvas();
            this.animTimer = setInterval(() => this.onAnimate(), interval);
        }
    }

    onAnimate() {
        this.progress += this.animStep;

        if (!this.isReversing) {
            if (this.progress >= 1.0) {
                this.progress = 1.0;
                this.isReversing = true;

                if (this.mode && this.mode.startsWith("Type-No Fade")) {
                    this.animStep = -1.0;
                    this.stopAnimation();
                    this.animTimer = setInterval(() => this.onAnimate(), 500);
                } else {
                    const interval = 30;
                    const reverseTotalMs = 600.0;
                    this.animStep = -(interval / reverseTotalMs);
                }
                this.renderCanvas();
                return;
            }
        } else {
            if (this.progress <= 0.0) {
                this.progress = 0.0;
                this.mode = null;
                this.stopAnimation();
                this.renderCanvas();
                return;
            }
        }

        this.renderCanvas();
    }

    getCornerModes() {
        let m = this.mode || "";
        if (m.includes("-UL") || m.includes("-UR")) m += "-Up";
        if (m.includes("-LL") || m.includes("-LR")) m += "-Down";
        if (m.includes("-UL") || m.includes("-LL")) m += "-Left";
        if (m.includes("-UR") || m.includes("-LR")) m += "-Right";
        return m;
    }

    renderCanvas() {
        if (!this.ctx || !this.canvas) return;
        const ctx = this.ctx;
        const [cw, ch] = this.canvasSize;

        if (this.canvas.width !== cw || this.canvas.height !== ch) {
            this.canvas.width = cw;
            this.canvas.height = ch;
        }

        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, cw, ch);

        if (!this.srcCanvas) return;
        const src = this.srcCanvas;
        const dst = this.dstCanvas || this.srcCanvas;

        if (!this.mode) {
            ctx.drawImage(src, 0, 0);
            return;
        }

        const p = Math.max(0, Math.min(1, this.progress));

        if (this.mode.startsWith("Type-No Fade")) {
            ctx.drawImage(p > 0.5 ? dst : src, 0, 0);
        } else if (this.mode.startsWith("Type-Fade") || this.mode.startsWith("Simple-Replace")) {
            ctx.drawImage(src, 0, 0);
            ctx.save();
            ctx.globalAlpha = p;
            ctx.drawImage(dst, 0, 0);
            ctx.restore();
        } else if (this.imageCategories.some(t => this.mode.startsWith(`Type-${t}`))) {
            this.ensureMaskDataLoaded();
            let activeMask = null;
            if (this.mode.startsWith("Type-Threshold")) activeMask = this.thresholdData[this.activeThresholdIdx % this.thresholdData.length]?.canvas;
            else if (this.mode.startsWith("Type-Distortion")) activeMask = this.distortionData[this.activeDistortionIdx % this.distortionData.length]?.canvas;
            else if (this.mode.startsWith("Type-Spiral")) activeMask = this.spiralData[this.activeSpiralIdx % this.spiralData.length]?.canvas;
            else if (this.mode.startsWith("Type-Wave")) activeMask = this.waveData[this.activeWaveIdx % this.waveData.length]?.canvas;
            else if (this.mode.startsWith("Type-Mosaic")) activeMask = this.mosaicData[this.activeMosaicIdx % this.mosaicData.length]?.canvas;
            else if (this.mode.startsWith("Type-Picture")) activeMask = this.pictholdData[this.activePictholdIdx % this.pictholdData.length]?.canvas;

            if (!activeMask) {
                ctx.drawImage(src, 0, 0);
                return;
            }

            const isPic = this.mode.startsWith("Type-Picture");
            const orientedMask = this.transformMaskCanvas(
                activeMask,
                isPic ? 0 : this.activeRotationIdx,
                isPic ? false : this.maskInverted
            );

            if (!this._maskScaleCvs) {
                this._maskScaleCvs = document.createElement("canvas");
                this._maskScaleCvs.width = cw;
                this._maskScaleCvs.height = ch;
            }
            const mCtx = this._maskScaleCvs.getContext("2d");
            mCtx.drawImage(orientedMask, 0, 0, cw, ch);

            const maskData = mCtx.getImageData(0, 0, cw, ch).data;
            const srcData = src.getContext("2d").getImageData(0, 0, cw, ch).data;
            const dstData = dst.getContext("2d").getImageData(0, 0, cw, ch).data;
            const outImg = ctx.createImageData(cw, ch);
            const out = outImg.data;

            const thresholdVal = 255 - Math.floor(p * 255);
            for (let i = 0; i < out.length; i += 4) {
                const lum = maskData[i];
                if (lum > thresholdVal) {
                    out[i] = dstData[i];
                    out[i + 1] = dstData[i + 1];
                    out[i + 2] = dstData[i + 2];
                    out[i + 3] = 255;
                } else {
                    out[i] = srcData[i];
                    out[i + 1] = srcData[i + 1];
                    out[i + 2] = srcData[i + 2];
                    out[i + 3] = 255;
                }
            }
            ctx.putImageData(outImg, 0, 0);
        } else if (this.mode.startsWith("Slide-")) {
            if (this.mode.includes("-Replace")) {
                ctx.drawImage(dst, 0, 0);
            } else {
                let dx = 0, dy = 0;
                if (this.mode.includes("-Left")) dx = -Math.round(cw * p);
                else if (this.mode.includes("-Right")) dx = Math.round(cw * p);
                else if (this.mode.includes("-Up")) dy = -Math.round(ch * p);
                else if (this.mode.includes("-Down")) dy = Math.round(ch * p);

                ctx.drawImage(src, dx, dy);
                const ox = this.mode.includes("Left") ? cw : this.mode.includes("Right") ? -cw : 0;
                const oy = this.mode.includes("Up") ? ch : this.mode.includes("Down") ? -ch : 0;
                ctx.drawImage(dst, dx + ox, dy + oy);
            }
        } else if (this.mode.startsWith("Wipe-")) {
            ctx.drawImage(src, 0, 0);
            const m = this.getCornerModes();
            let clipX = 0, clipY = 0, clipW = cw, clipH = ch;

            if (m.includes("-Right")) clipW = Math.round(cw * p);
            if (m.includes("-Left")) { clipW = Math.round(cw * p); clipX = cw - clipW; }
            if (m.includes("-Down")) clipH = Math.round(ch * p);
            if (m.includes("-Up")) { clipH = Math.round(ch * p); clipY = ch - clipH; }

            ctx.save();
            ctx.beginPath();
            ctx.rect(clipX, clipY, clipW, clipH);
            ctx.clip();
            ctx.drawImage(dst, 0, 0);
            ctx.restore();
        } else if (this.mode.startsWith("Zoom-")) {
            if (this.mode.includes("OneA")) {
                ctx.drawImage(src, 0, 0);
                const curW = Math.max(1, Math.round(cw * p));
                const curH = Math.max(1, Math.round(ch * p));
                ctx.drawImage(dst, 0, 0, cw, ch, Math.floor((cw - curW) / 2), Math.floor((ch - curH) / 2), curW, curH);
            } else if (this.mode.includes("OneB")) {
                const scale = 1.0 - p;
                const curW = Math.max(1, Math.round(cw * scale));
                const curH = Math.max(1, Math.round(ch * scale));
                ctx.drawImage(dst, 0, 0);
                ctx.drawImage(src, 0, 0, cw, ch, Math.floor((cw - curW) / 2), Math.floor((ch - curH) / 2), curW, curH);
            } else if (this.mode.includes("FlipA")) {
                const curW2 = Math.max(1, Math.round(cw * p));
                const curH2 = Math.max(1, Math.round(ch * p));
                ctx.drawImage(dst, 0, 0, cw, ch, Math.floor((cw - curW2) / 2), Math.floor((ch - curH2) / 2), curW2, curH2);
                const scale = 1.0 - p;
                const curW1 = Math.max(1, Math.round(cw * scale));
                const curH1 = Math.max(1, Math.round(ch * scale));
                ctx.drawImage(src, 0, 0, cw, ch, Math.floor((cw - curW1) / 2), Math.floor((ch - curH1) / 2), curW1, curH1);
            } else if (this.mode.includes("FlipB")) {
                const scale = 1.0 - p;
                const curW1 = Math.max(1, Math.round(cw * scale));
                const curH1 = Math.max(1, Math.round(ch * scale));
                ctx.drawImage(src, 0, 0, cw, ch, Math.floor((cw - curW1) / 2), Math.floor((ch - curH1) / 2), curW1, curH1);
                const curW2 = Math.max(1, Math.round(cw * p));
                const curH2 = Math.max(1, Math.round(ch * p));
                ctx.drawImage(dst, 0, 0, cw, ch, Math.floor((cw - curW2) / 2), Math.floor((ch - curH2) / 2), curW2, curH2);
            }
        } else if (this.mode.startsWith("Pan Out-")) {
            ctx.drawImage(dst, 0, 0);
            const curZoom = 0.3 + p * 0.7;
            const cropW = Math.max(1, Math.round(cw * curZoom));
            const cropH = Math.max(1, Math.round(ch * curZoom));
            const m = this.getCornerModes();

            const startX = m.includes("-Left") ? 0 : m.includes("-Right") ? (cw - cropW) : Math.floor((cw - cropW) / 2);
            const startY = m.includes("-Up") ? 0 : m.includes("-Down") ? (ch - cropH) : Math.floor((ch - cropH) / 2);
            const endX = Math.floor((cw - cropW) / 2);
            const endY = Math.floor((ch - cropH) / 2);

            const curX = Math.round(startX + (endX - startX) * p);
            const curY = Math.round(startY + (endY - startY) * p);

            ctx.save();
            ctx.globalAlpha = p;
            ctx.drawImage(src, curX, curY, cropW, cropH, 0, 0, cw, ch);
            ctx.restore();
        } else if (this.mode.startsWith("Pan In-")) {
            ctx.drawImage(src, 0, 0);
            const curZoom = 0.8 - p * 0.7;
            const cropW = Math.max(1, Math.round(cw * curZoom));
            const cropH = Math.max(1, Math.round(ch * curZoom));
            const m = this.getCornerModes();

            const startX = m.includes("-Right") ? 0 : m.includes("-Left") ? (cw - cropW) : Math.floor((cw - cropW) / 2);
            const startY = m.includes("-Down") ? 0 : m.includes("-Up") ? (ch - cropH) : Math.floor((ch - cropH) / 2);
            const endX = Math.floor((cw - cropW) / 2);
            const endY = Math.floor((ch - cropH) / 2);

            const curX = Math.round(startX + (endX - startX) * p);
            const curY = Math.round(startY + (endY - startY) * p);

            ctx.save();
            ctx.globalAlpha = 1.0 - p;
            ctx.drawImage(dst, curX, curY, cropW, cropH, 0, 0, cw, ch);
            ctx.restore();
        }
    }
}

window.PhotoTransitionEditor = PhotoTransitionEditor;
