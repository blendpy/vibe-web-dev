"use strict";

// ======================================================================
// IMAGE EFFECTS PROCESSING PIPELINE
// ======================================================================
function applyImageEffectsToCanvas(sourceEl, rotation = "Normal", mirror = "Normal", color = "Normal", colormap = "Normal", targetMaxW = null, targetMaxH = null) {
    if (!sourceEl) return null;

    const srcW = sourceEl.naturalWidth || sourceEl.videoWidth || sourceEl.width || 800;
    const srcH = sourceEl.naturalHeight || sourceEl.videoHeight || sourceEl.height || 600;

    let workW = srcW;
    let workH = srcH;
    if (targetMaxW && targetMaxH) {
        const scale = Math.min(targetMaxW / srcW, targetMaxH / srcH);
        workW = Math.max(1, Math.round(srcW * scale));
        workH = Math.max(1, Math.round(srcH * scale));
    }

    // 1. ROTATION & FLIP STAGE
    const swapDims = (rotation === "90" || rotation === "270");
    const rotCanvas = document.createElement("canvas");
    rotCanvas.width = swapDims ? workH : workW;
    rotCanvas.height = swapDims ? workW : workH;
    const rCtx = rotCanvas.getContext("2d");

    rCtx.save();
    rCtx.translate(rotCanvas.width / 2, rotCanvas.height / 2);

    if (rotation === "Flip Horizontal") {
        rCtx.scale(-1, 1);
    } else if (rotation === "Flip Vertical") {
        rCtx.scale(1, -1);
    } else if (rotation === "180") {
        rCtx.rotate(Math.PI);
    } else if (rotation === "90") {
        rCtx.rotate(Math.PI / 2);
    } else if (rotation === "270") {
        rCtx.rotate(-Math.PI / 2);
    }

    rCtx.drawImage(sourceEl, 0, 0, srcW, srcH, -workW / 2, -workH / 2, workW, workH);
    rCtx.restore();

    // 2. MIRROR STAGE
    const W = rotCanvas.width;
    const H = rotCanvas.height;
    const hw = Math.floor(W / 2);
    const hh = Math.floor(H / 2);

    let workCanvas = rotCanvas;

    if (mirror !== "Normal") {
        const mirCanvas = document.createElement("canvas");
        mirCanvas.width = W;
        mirCanvas.height = H;
        const mCtx = mirCanvas.getContext("2d");

        const drawQuad = (sx, sy, sw, sh, dx, dy, dw, dh, flipX, flipY) => {
            mCtx.save();
            mCtx.translate(dx + (flipX ? dw : 0), dy + (flipY ? dh : 0));
            mCtx.scale(flipX ? -1 : 1, flipY ? -1 : 1);
            mCtx.drawImage(rotCanvas, sx, sy, sw, sh, 0, 0, dw, dh);
            mCtx.restore();
        };

        if (mirror === "Top to Bottom") {
            drawQuad(0, 0, W, hh, 0, 0, W, hh, false, false);
            drawQuad(0, 0, W, hh, 0, hh, W, H - hh, false, true);
        } else if (mirror === "Bottom to Top") {
            drawQuad(0, hh, W, H - hh, 0, hh, W, H - hh, false, false);
            drawQuad(0, hh, W, H - hh, 0, 0, W, hh, false, true);
        } else if (mirror === "Left to Right") {
            drawQuad(0, 0, hw, H, 0, 0, hw, H, false, false);
            drawQuad(0, 0, hw, H, hw, 0, W - hw, H, true, false);
        } else if (mirror === "Right to Left") {
            drawQuad(hw, 0, W - hw, H, hw, 0, W - hw, H, false, false);
            drawQuad(hw, 0, W - hw, H, 0, 0, hw, H, true, false);
        } else if (mirror === "Top to Bottom & Left to Right") {
            drawQuad(0, 0, hw, hh, 0, 0, hw, hh, false, false);
            drawQuad(0, 0, hw, hh, hw, 0, W - hw, hh, true, false);
            drawQuad(0, 0, hw, hh, 0, hh, hw, H - hh, false, true);
            drawQuad(0, 0, hw, hh, hw, hh, W - hw, H - hh, true, true);
        } else if (mirror === "Bottom to Top & Left to Right") {
            drawQuad(0, hh, hw, H - hh, 0, hh, hw, H - hh, false, false);
            drawQuad(0, hh, hw, H - hh, 0, 0, hw, hh, false, true);
            drawQuad(0, hh, hw, H - hh, hw, hh, W - hw, H - hh, true, false);
            drawQuad(0, hh, hw, H - hh, hw, 0, W - hw, hh, true, true);
        } else if (mirror === "Top to Bottom & Right to Left") {
            drawQuad(hw, 0, W - hw, hh, hw, 0, W - hw, hh, false, false);
            drawQuad(hw, 0, W - hw, hh, 0, 0, hw, hh, true, false);
            drawQuad(hw, 0, W - hw, hh, hw, hh, W - hw, H - hh, false, true);
            drawQuad(hw, 0, W - hw, hh, 0, hh, hw, H - hh, true, true);
        } else if (mirror === "Bottom to Top & Right to Left") {
            drawQuad(hw, hh, W - hw, H - hh, hw, hh, W - hw, H - hh, false, false);
            drawQuad(hw, hh, W - hw, H - hh, 0, hh, hw, H - hh, true, false);
            drawQuad(hw, hh, W - hw, H - hh, hw, 0, W - hw, hh, false, true);
            drawQuad(hw, hh, W - hw, H - hh, 0, 0, hw, hh, true, true);
        } else {
            mCtx.drawImage(rotCanvas, 0, 0);
        }

        workCanvas = mirCanvas;
    }

    // 3. COLOR & COLORMAP PIXEL SHADER STAGE
    if (color === "Normal" && colormap === "Normal") {
        return workCanvas;
    }

    const ctx = workCanvas.getContext("2d");
    const imgData = ctx.getImageData(0, 0, W, H);
    const data = imgData.data;
    const len = data.length;

    if (color !== "Normal") {
        for (let i = 0; i < len; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const lum = 0.299 * r + 0.587 * g + 0.114 * b;

            if (color === "Monochrome") {
                data[i] = data[i + 1] = data[i + 2] = lum;
            } else if (color === "Sepia") {
                data[i]     = Math.min(255, 0.393 * r + 0.769 * g + 0.189 * b);
                data[i + 1] = Math.min(255, 0.349 * r + 0.686 * g + 0.168 * b);
                data[i + 2] = Math.min(255, 0.272 * r + 0.534 * g + 0.131 * b);
            } else if (color === "Cross Processing") {
                const nr = r < 128 ? 0.8 * r : Math.min(255, 1.25 * (r - 128) + 102);
                const ng = g < 128 ? 0.75 * g : Math.min(255, 1.35 * (g - 128) + 96);
                const nb = Math.min(255, b * 0.7 + 45);
                data[i] = nr;
                data[i + 1] = ng;
                data[i + 2] = nb;
            } else if (color === "Teal and Orange") {
                const norm = lum / 255;
                const tealR = 0, tealG = 135, tealB = 155;
                const orgR = 255, orgG = 145, orgB = 45;
                const mixR = tealR * (1 - norm) + orgR * norm;
                const mixG = tealG * (1 - norm) + orgG * norm;
                const mixB = tealB * (1 - norm) + orgB * norm;
                data[i]     = Math.min(255, r * 0.45 + mixR * 0.55);
                data[i + 1] = Math.min(255, g * 0.45 + mixG * 0.55);
                data[i + 2] = Math.min(255, b * 0.45 + mixB * 0.55);
            } else if (color === "Duotone/Tritone") {
                const t = lum / 255;
                if (t < 0.5) {
                    const u = t * 2;
                    data[i]     = 24 * (1 - u) + 195 * u;
                    data[i + 1] = 16 * (1 - u) + 45 * u;
                    data[i + 2] = 72 * (1 - u) + 115 * u;
                } else {
                    const u = (t - 0.5) * 2;
                    data[i]     = 195 * (1 - u) + 252 * u;
                    data[i + 1] = 45 * (1 - u) + 215 * u;
                    data[i + 2] = 115 * (1 - u) + 110 * u;
                }
            } else if (color === "Color (Red) Splashing") {
                if (!(r > g * 1.25 && r > b * 1.25 && r > 45)) {
                    data[i] = data[i + 1] = data[i + 2] = lum;
                }
            } else if (color === "Color (Green) Splashing") {
                if (!(g > r * 1.12 && g > b * 1.12 && g > 40)) {
                    data[i] = data[i + 1] = data[i + 2] = lum;
                }
            } else if (color === "Color (Blue) Splashing") {
                if (!(b > r * 1.15 && b > g * 1.12 && b > 45)) {
                    data[i] = data[i + 1] = data[i + 2] = lum;
                }
            }
        }
    }

    if (colormap !== "Normal") {
        if (colormap === "Invert") {
            for (let i = 0; i < len; i += 4) {
                data[i]     = 255 - data[i];
                data[i + 1] = 255 - data[i + 1];
                data[i + 2] = 255 - data[i + 2];
            }
        } else if (colormap === "Posterize 4") {
            for (let i = 0; i < len; i += 4) {
                data[i]     = data[i] & 0xF0;
                data[i + 1] = data[i + 1] & 0xF0;
                data[i + 2] = data[i + 2] & 0xF0;
            }
        } else if (colormap === "Auto Constrast Equalize" || colormap === "Auto White Balance") {
            let minR = 255, maxR = 0;
            let minG = 255, maxG = 0;
            let minB = 255, maxB = 0;
            let sumR = 0, sumG = 0, sumB = 0;

            for (let i = 0; i < len; i += 4) {
                const r = data[i], g = data[i + 1], b = data[i + 2];
                if (r < minR) minR = r; if (r > maxR) maxR = r;
                if (g < minG) minG = g; if (g > maxG) maxG = g;
                if (b < minB) minB = b; if (b > maxB) maxB = b;
                sumR += r; sumG += g; sumB += b;
            }

            if (colormap === "Auto Constrast Equalize") {
                const rangeR = Math.max(1, maxR - minR);
                const rangeG = Math.max(1, maxG - minG);
                const rangeB = Math.max(1, maxB - minB);
                for (let i = 0; i < len; i += 4) {
                    data[i]     = Math.min(255, Math.max(0, ((data[i] - minR) * 255) / rangeR));
                    data[i + 1] = Math.min(255, Math.max(0, ((data[i + 1] - minG) * 255) / rangeG));
                    data[i + 2] = Math.min(255, Math.max(0, ((data[i + 2] - minB) * 255) / rangeB));
                }
            } else {
                const pixelCount = len / 4;
                const avgR = sumR / pixelCount || 1;
                const avgG = sumG / pixelCount || 1;
                const avgB = sumB / pixelCount || 1;
                const avgGray = (avgR + avgG + avgB) / 3;
                const scaleR = avgGray / avgR;
                const scaleG = avgGray / avgG;
                const scaleB = avgGray / avgB;

                for (let i = 0; i < len; i += 4) {
                    data[i]     = Math.min(255, Math.max(0, data[i] * scaleR));
                    data[i + 1] = Math.min(255, Math.max(0, data[i] * scaleG));
                    data[i + 2] = Math.min(255, Math.max(0, data[i] * scaleB));
                }
            }
        }
    }

    ctx.putImageData(imgData, 0, 0);
    return workCanvas;
}

// ======================================================================
// PHOTO EFFECTS PANEL CONTROLLER (Port of PhotoEffects_2.py)
// ======================================================================
class PhotoEffectsEditor {
    constructor(app) {
        this.app = app;

        this.ROTATIONS = ["Normal", "Flip Horizontal", "180", "Flip Vertical", "90", "270"];
        this.MIRRORS = [
            "Normal", "Top to Bottom", "Bottom to Top", "Left to Right", "Right to Left",
            "Top to Bottom & Left to Right", "Bottom to Top & Left to Right",
            "Top to Bottom & Right to Left", "Bottom to Top & Right to Left"
        ];
        this.COLORS = [
            "Normal", "Monochrome", "Sepia", "Cross Processing",
            "Teal and Orange", "Duotone/Tritone", "Color (Red) Splashing",
            "Color (Green) Splashing", "Color (Blue) Splashing"
        ];
        this.COLORMAPS = [
            "Normal", "Invert", "Auto Constrast Equalize", "Auto White Balance", "Posterize 4"
        ];

        this.stage = document.getElementById("effectsStage");
        this.canvas = document.getElementById("effectsCanvas");
        this.ctx = this.canvas ? this.canvas.getContext("2d") : null;

        this.rotButtons = {};
        this.mirrorButtons = {};
        this.colorButtons = {};
        this.colormapButtons = {};

        this.rotLabels = {};
        this.mirrorLabels = {};
        this.colorLabels = {};
        this.colormapLabels = {};

        this.hoveredEffect = "";
        this.hoveredCategory = "";
        this.mainRenderedCanvas = null;
        this.hoverRenderedCanvas = null;

        this.buildButtonRows();
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

    buildButtonRows() {
        // Order: Color, Color Map, Rotation, Mirror
        this.createEffectRow("effectsRowColor", this.COLORS, this.colorButtons, this.colorLabels, "color");
        this.createEffectRow("effectsRowColormap", this.COLORMAPS, this.colormapButtons, this.colormapLabels, "colormap");
        this.createEffectRow("effectsRowRotation", this.ROTATIONS, this.rotButtons, this.rotLabels, "rot");
        this.createEffectRow("effectsRowMirror", this.MIRRORS, this.mirrorButtons, this.mirrorLabels, "mirror");
    }

    createEffectRow(containerId, effectsList, btnDict, labelDict, category) {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = "";

        const rowWrap = container.closest(".effect-row-container") || container;
        rowWrap.addEventListener("pointerenter", () => {
            rowWrap.classList.add("is-row-hovered");
        });
        rowWrap.addEventListener("pointerleave", () => {
            rowWrap.classList.remove("is-row-hovered");
        });

        effectsList.forEach((effectName, idx) => {
            const itemWrap = document.createElement("div");
            itemWrap.className = "effect-item-wrapper flex flex-col items-center shrink-0 w-[72px] select-none";

            const btn = document.createElement("button");
            btn.type = "button";
            btn.title = effectName;
            btn.dataset.effect = effectName;
            btn.dataset.category = category;
            btn.className = "effect-thumb-btn relative w-[68px] h-[48px] rounded-lg border-2 border-slate-700 bg-slate-900 p-0.5 flex flex-col items-center justify-center overflow-hidden transition-all focus:outline-none";

            const thumbCvs = document.createElement("canvas");
            thumbCvs.width = 62;
            thumbCvs.height = 40;
            thumbCvs.className = "block rounded pointer-events-none";
            btn.appendChild(thumbCvs);
            btn.thumbCanvas = thumbCvs;

            const labelBox = document.createElement("div");
            labelBox.className = "effect-label-box w-full text-center px-0.5 overflow-hidden flex items-center justify-center";

            const labelSpan = document.createElement("span");
            labelSpan.className = "text-[9px] leading-[11px] font-medium text-slate-300 text-center select-none line-clamp-2 break-words";
            labelSpan.textContent = effectName;
            labelBox.appendChild(labelSpan);

            itemWrap.appendChild(btn);
            itemWrap.appendChild(labelBox);

            btn.addEventListener("click", () => {
                this.applyEffectChange(category, effectName);
            });

            btn.addEventListener("pointerenter", () => {
                this.hoveredEffect = effectName;
                this.hoveredCategory = category;
                this.updateHoverPreview();
                this.renderCanvas();
            });

            btn.addEventListener("pointerleave", () => {
                this.hoveredEffect = "";
                this.hoveredCategory = "";
                this.hoverRenderedCanvas = null;
                this.renderCanvas();
            });

            btn.addEventListener("keydown", (e) => {
                if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
                    e.preventDefault();
                    e.stopPropagation();
                    const dir = e.key === "ArrowRight" ? 1 : -1;
                    const nextIdx = (idx + dir + effectsList.length) % effectsList.length;
                    const nextEffect = effectsList[nextIdx];
                    const nextBtn = btnDict[nextEffect];
                    if (nextBtn) {
                        nextBtn.focus();
                        this.applyEffectChange(category, nextEffect);
                    }
                }
            });

            btnDict[effectName] = btn;
            labelDict[effectName] = labelSpan;
            container.appendChild(itemWrap);
        });
    }

    applyEffectChange(category, effectName) {
        const selected = this.getSelectedItems();
        if (!selected.length) return;

        for (const itm of selected) {
            if (category === "rot") itm.curRotation = effectName;
            else if (category === "mirror") itm.curMirror = effectName;
            else if (category === "color") itm.curColor = effectName;
            else if (category === "colormap") itm.curColormap = effectName;
            itm.generateThumbnail();
        }

        this.app.renderFilmstrip();
        this.refreshAllViews();
    }

    isHoveredActive() {
        const item = this.item;
        if (!item || !this.hoveredEffect) return false;
        if (this.hoveredCategory === "rot" && this.hoveredEffect === item.curRotation) return true;
        if (this.hoveredCategory === "mirror" && this.hoveredEffect === item.curMirror) return true;
        if (this.hoveredCategory === "color" && this.hoveredEffect === item.curColor) return true;
        if (this.hoveredCategory === "colormap" && this.hoveredEffect === item.curColormap) return true;
        return false;
    }

    updateHoverPreview() {
        const item = this.item;
        if (!item || !item.imgElement || !this.hoveredEffect || this.isHoveredActive()) {
            this.hoverRenderedCanvas = null;
            return;
        }

        const rot = this.hoveredCategory === "rot" ? this.hoveredEffect : item.curRotation;
        const mir = this.hoveredCategory === "mirror" ? this.hoveredEffect : item.curMirror;
        const col = this.hoveredCategory === "color" ? this.hoveredEffect : item.curColor;
        const cmap = this.hoveredCategory === "colormap" ? this.hoveredEffect : item.curColormap;

        this.hoverRenderedCanvas = applyImageEffectsToCanvas(item.imgElement, rot, mir, col, cmap, 900, 450);
    }

    syncWithActiveItem() {
        this.resizeCanvas();
        this.refreshAllViews();
    }

    resizeCanvas() {
        if (!this.canvas || !this.canvas.parentElement) return;
        const wrap = this.canvas.parentElement;
        const w = Math.max(300, Math.floor(wrap.clientWidth - 4));
        const h = Math.max(80, Math.floor(wrap.clientHeight - 4));
        if (this.canvas.width !== w || this.canvas.height !== h) {
            this.canvas.width = w;
            this.canvas.height = h;
        }
    }

    refreshAllViews() {
        const item = this.item;
        if (!item || !item.imgElement) return;

        this.mainRenderedCanvas = applyImageEffectsToCanvas(
            item.imgElement,
            item.curRotation,
            item.curMirror,
            item.curColor,
            item.curColormap,
            900,
            450
        );

        this.ROTATIONS.forEach((rot) => {
            const btn = this.rotButtons[rot];
            const lbl = this.rotLabels[rot];
            if (!btn) return;
            const res = applyImageEffectsToCanvas(item.imgElement, rot, item.curMirror, item.curColor, item.curColormap, 62, 40);
            this.drawThumbIntoButton(btn, lbl, res, rot === item.curRotation);
        });

        this.MIRRORS.forEach((mir) => {
            const btn = this.mirrorButtons[mir];
            const lbl = this.mirrorLabels[mir];
            if (!btn) return;
            const res = applyImageEffectsToCanvas(item.imgElement, item.curRotation, mir, item.curColor, item.curColormap, 62, 40);
            this.drawThumbIntoButton(btn, lbl, res, mir === item.curMirror);
        });

        this.COLORS.forEach((col) => {
            const btn = this.colorButtons[col];
            const lbl = this.colorLabels[col];
            if (!btn) return;
            const res = applyImageEffectsToCanvas(item.imgElement, item.curRotation, item.curMirror, col, item.curColormap, 62, 40);
            this.drawThumbIntoButton(btn, lbl, res, col === item.curColor);
        });

        this.COLORMAPS.forEach((cmap) => {
            const btn = this.colormapButtons[cmap];
            const lbl = this.colormapLabels[cmap];
            if (!btn) return;
            const res = applyImageEffectsToCanvas(item.imgElement, item.curRotation, item.curMirror, item.curColor, cmap, 62, 40);
            this.drawThumbIntoButton(btn, lbl, res, cmap === item.curColormap);
        });

        this.updateHoverPreview();
        this.renderCanvas();
    }

    drawThumbIntoButton(btn, lbl, processedCanvas, isActive) {
        const cvs = btn.thumbCanvas;
        const ctx = cvs.getContext("2d");
        ctx.fillStyle = "#141414";
        ctx.fillRect(0, 0, cvs.width, cvs.height);

        if (processedCanvas) {
            const scale = Math.min(cvs.width / processedCanvas.width, cvs.height / processedCanvas.height);
            const dw = Math.round(processedCanvas.width * scale);
            const dh = Math.round(processedCanvas.height * scale);
            const dx = Math.floor((cvs.width - dw) / 2);
            const dy = Math.floor((cvs.height - dh) / 2);
            ctx.drawImage(processedCanvas, dx, dy, dw, dh);
        }

        if (isActive) {
            btn.style.backgroundColor = "rgb(173, 216, 230)";
            btn.style.borderColor = "#38bdf8";
            btn.classList.add("ring-2", "ring-sky-400/50", "scale-105");
            if (lbl) {
                lbl.className = "text-[9px] leading-[11px] font-bold text-sky-400 text-center select-none line-clamp-2 break-words";
            }
        } else {
            btn.style.backgroundColor = "";
            btn.style.borderColor = "";
            btn.classList.remove("ring-2", "ring-sky-400/50", "scale-105");
            if (lbl) {
                lbl.className = "text-[9px] leading-[11px] font-medium text-slate-300 text-center select-none line-clamp-2 break-words";
            }
        }
    }

    // ==================================================================
    // STABLE PREVIEW RENDERING (Right Image Positioned Directly Beside Left Image)
    // ==================================================================
    renderCanvas() {
        if (!this.ctx || !this.canvas) return;
        const ctx = this.ctx;
        const cw = this.canvas.width;
        const ch = this.canvas.height;
        const item = this.item;

        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, cw, ch);

        if (!item || !this.mainRenderedCanvas) return;

        const isHovering = this.hoverRenderedCanvas !== null && !this.isHoveredActive();

        // 1. Text panel on far left (250px wide reserved column, zero overlap with preview images)
        const textPanelW = 250;
        const leftPad = textPanelW + 16;
        const textX = 16;

        const colorVal = (isHovering && this.hoveredCategory === "color") ? this.hoveredEffect : item.curColor;
        const isColorHovered = isHovering && this.hoveredCategory === "color";

        const colormapVal = (isHovering && this.hoveredCategory === "colormap") ? this.hoveredEffect : item.curColormap;
        const isColormapHovered = isHovering && this.hoveredCategory === "colormap";

        const rotVal = (isHovering && this.hoveredCategory === "rot") ? this.hoveredEffect : item.curRotation;
        const isRotHovered = isHovering && this.hoveredCategory === "rot";

        const mirrorVal = (isHovering && this.hoveredCategory === "mirror") ? this.hoveredEffect : item.curMirror;
        const isMirrorHovered = isHovering && this.hoveredCategory === "mirror";

        const getLineColor = (val, isHovered) => {
            if (isHovered) return "#06b6d4";
            return val !== "Normal" ? "#ff4d4d" : "#ffffff";
        };

        ctx.font = "bold 12px Inter, sans-serif";
        ctx.textBaseline = "top";
        ctx.textAlign = "left";

        const statusLines = [
            { label: "Color", val: colorVal, hovered: isColorHovered, y: 18 },
            { label: "Color Map", val: colormapVal, hovered: isColormapHovered, y: 40 },
            { label: "Rotation", val: rotVal, hovered: isRotHovered, y: 62 },
            { label: "Mirror", val: mirrorVal, hovered: isMirrorHovered, y: 84 }
        ];

        statusLines.forEach(({ label, val, hovered, y }) => {
            ctx.fillStyle = getLineColor(val, hovered);
            ctx.fillText(`${label}: ${val}`, textX, y);
        });

        // 2. Compute fixed slot geometry so the main image retains the exact same size on hover
        const availW = Math.max(60, cw - leftPad - 16);
        const availH = Math.max(40, ch - 16);
        const gap = 16;
        const slotW = Math.max(30, Math.floor((availW - gap) / 2));

        const mw = this.mainRenderedCanvas.width;
        const mh = this.mainRenderedCanvas.height;
        const scale = Math.min(slotW / mw, availH / mh);
        const dw = Math.round(mw * scale);
        const dh = Math.round(mh * scale);
        const x1 = leftPad;
        const y1 = Math.floor((ch - dh) / 2);

        // Always draw the main image at the exact same size and position
        ctx.drawImage(this.mainRenderedCanvas, x1, y1, dw, dh);

        if (isHovering) {
            // Divider line placed directly after the left image
            const dividerX = x1 + dw + Math.floor(gap / 2);
            ctx.strokeStyle = "#334155";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(dividerX, 8);
            ctx.lineTo(dividerX, ch - 8);
            ctx.stroke();

            // Right image (Hover Preview) positioned directly next to the divider
            const hw = this.hoverRenderedCanvas.width;
            const hh = this.hoverRenderedCanvas.height;
            const scale2 = Math.min(slotW / hw, availH / hh);
            const dw2 = Math.round(hw * scale2);
            const dh2 = Math.round(hh * scale2);
            const x2 = x1 + dw + gap;
            const y2 = Math.floor((ch - dh2) / 2);
            ctx.drawImage(this.hoverRenderedCanvas, x2, y2, dw2, dh2);
        }
    }
}
