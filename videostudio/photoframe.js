"use strict";

// ======================================================================
// PHOTO FRAME & TITLE STUDIO (Port of PhotoFrame.py with Multi-Selection & Effects Pipeline)
// ======================================================================
class PhotoFrameEditor {
    constructor(app) {
        this.app = app;
        this.pixelWidths = [6, 16, 32, 54]; // 0: 6px, 1: 16px, 2: 32px, 3: 54px

        // Canvas & Context
        this.stage = document.getElementById("frameStage");
        this.canvas = document.getElementById("frameCanvas");
        this.ctx = this.canvas.getContext("2d");

        // Interaction State
        this.isDraggingTitle = false;
        this.isResizingTitle = false;
        this.dragOffset = { x: 0, y: 0 };
        this.startMouseY = 0;
        this.startFontSize = 26;

        // Bounding geometry calculated per render frame
        this.currentImgRect = { x: 0, y: 0, w: 0, h: 0 };
        this.titleRect = { x: 0, y: 0, w: 0, h: 0 };

        this.initDOMElements();
        this.initEventListeners();
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

    initDOMElements() {
        // Title Controls
        this.chkTitle = document.getElementById("chkTitleToggle");
        this.txtInput = document.getElementById("txtTitleInput");
        this.colText = document.getElementById("colTitleColor");
        this.chkShadow = document.getElementById("chkTitleShadow");
        this.sldFontSize = document.getElementById("sldTitleFontSize");
        this.lblFontSize = document.getElementById("lblTitleFontSize");
        this.matrixButtons = document.querySelectorAll(".frame-matrix-btn");

        // Matte & Border Controls
        this.chkMatte = document.getElementById("chkMatteToggle");
        this.colMatte = document.getElementById("colMatteColor");
        this.chkBorder = document.getElementById("chkBorderToggle");
        this.colBorder = document.getElementById("colBorderColor");
        this.borderControlGroup = document.getElementById("borderControlGroup");
        this.styleButtons = document.querySelectorAll(".matte-style-btn");
        this.sizeButtons = document.querySelectorAll(".matte-size-btn");
    }

    initEventListeners() {
        // Title inputs
        this.chkTitle.addEventListener("change", () => {
            const val = this.chkTitle.checked;
            for (const itm of this.getSelectedItems()) {
                itm.isTitle = val;
                itm.generateThumbnail();
            }
            this.app.renderFilmstrip();
            this.render();
        });

        this.txtInput.addEventListener("input", () => {
            const val = this.txtInput.value;
            for (const itm of this.getSelectedItems()) {
                itm.title = val;
                itm.generateThumbnail();
            }
            this.app.renderFilmstrip();
            this.render();
        });

        this.colText.addEventListener("input", () => {
            const val = this.colText.value;
            for (const itm of this.getSelectedItems()) {
                itm.titleColor = val;
                itm.generateThumbnail();
            }
            this.app.renderFilmstrip();
            this.render();
        });

        this.chkShadow.addEventListener("change", () => {
            const val = this.chkShadow.checked;
            for (const itm of this.getSelectedItems()) {
                itm.titleShadow = val;
                itm.generateThumbnail();
            }
            this.app.renderFilmstrip();
            this.render();
        });

        this.sldFontSize.addEventListener("input", () => {
            const val = parseInt(this.sldFontSize.value, 10);
            this.lblFontSize.textContent = `${val}px`;
            for (const itm of this.getSelectedItems()) {
                itm.titleFontSize = val;
                itm.generateThumbnail();
            }
            this.app.renderFilmstrip();
            this.render();
        });

        // 9-button Matrix Position Selector
        this.matrixButtons.forEach((btn) => {
            btn.addEventListener("click", () => {
                const pos = btn.dataset.pos;
                for (const itm of this.getSelectedItems()) {
                    itm.titlePos = pos;
                    itm.isCustomPositioned = false;
                    itm.titleRelPos = null;
                    itm.generateThumbnail();
                }
                this.app.renderFilmstrip();
                this.syncMatrixButtons();
                this.render();
            });
        });

        // Matte & Border inputs
        this.chkMatte.addEventListener("change", () => {
            const val = this.chkMatte.checked;
            for (const itm of this.getSelectedItems()) {
                itm.isMatte = val;
                itm.generateThumbnail();
            }
            this.app.renderFilmstrip();
            this.syncMatteAndBorderState();
            this.render();
        });

        this.colMatte.addEventListener("input", () => {
            const val = this.colMatte.value;
            for (const itm of this.getSelectedItems()) {
                itm.matteColor = val;
                itm.generateThumbnail();
            }
            this.app.renderFilmstrip();
            this.render();
        });

        this.chkBorder.addEventListener("change", () => {
            const val = this.chkBorder.checked;
            for (const itm of this.getSelectedItems()) {
                itm.isBorder = val;
                itm.generateThumbnail();
            }
            this.app.renderFilmstrip();
            this.render();
        });

        this.colBorder.addEventListener("input", () => {
            const val = this.colBorder.value;
            for (const itm of this.getSelectedItems()) {
                itm.borderColor = val;
                itm.generateThumbnail();
            }
            this.app.renderFilmstrip();
            this.render();
        });

        // Style buttons
        this.styleButtons.forEach((btn) => {
            btn.addEventListener("click", () => {
                const styleIdx = parseInt(btn.dataset.style, 10);
                for (const itm of this.getSelectedItems()) {
                    itm.frameStyle = styleIdx;
                    itm.generateThumbnail();
                }
                this.app.renderFilmstrip();
                this.syncStyleButtons();
                this.render();
            });
        });

        // Size buttons
        this.sizeButtons.forEach((btn) => {
            btn.addEventListener("click", () => {
                const sizeIdx = parseInt(btn.dataset.size, 10);
                for (const itm of this.getSelectedItems()) {
                    itm.frameSize = sizeIdx;
                    itm.generateThumbnail();
                }
                this.app.renderFilmstrip();
                this.syncSizeButtons();
                this.render();
            });
        });

        // Interactive Canvas Pointer Tracking (Drag & Resize title)
        this.canvas.addEventListener("pointerdown", (e) => this.onPointerDown(e));
        window.addEventListener("pointermove", (e) => this.onPointerMove(e));
        window.addEventListener("pointerup", (e) => this.onPointerUp(e));
    }

    syncWithActiveItem() {
        const item = this.item;
        if (!item) return;

        if (item.frameStyle === undefined) item.frameStyle = 2;
        if (item.frameSize === undefined) item.frameSize = 1;
        if (item.titleShadow === undefined) item.titleShadow = true;
        if (item.titleFontSize === undefined) item.titleFontSize = 26;
        if (item.titleRelPos === undefined) item.titleRelPos = null;
        if (item.isCustomPositioned === undefined) item.isCustomPositioned = false;

        this.chkTitle.checked = item.isTitle;
        this.txtInput.value = item.title;
        this.colText.value = item.titleColor || "#ffffff";
        this.chkShadow.checked = item.titleShadow;
        this.sldFontSize.value = item.titleFontSize;
        this.lblFontSize.textContent = `${item.titleFontSize}px`;

        this.chkMatte.checked = item.isMatte;
        this.colMatte.value = item.matteColor || "#dddddd";
        this.chkBorder.checked = item.isBorder;
        this.colBorder.value = item.borderColor || "#111144";

        this.syncMatteAndBorderState();
        this.syncMatrixButtons();
        this.syncStyleButtons();
        this.syncSizeButtons();
        this.resizeCanvas();
        this.render();
    }

    syncMatteAndBorderState() {
        const matteActive = this.item ? !!this.item.isMatte : false;

        this.chkBorder.disabled = !matteActive;
        this.colBorder.disabled = !matteActive;

        if (this.borderControlGroup) {
            if (matteActive) {
                this.borderControlGroup.classList.remove("opacity-40", "pointer-events-none");
            } else {
                this.borderControlGroup.classList.add("opacity-40", "pointer-events-none");
            }
        }
    }

    syncMatrixButtons() {
        let pos = (this.item && !this.item.isCustomPositioned) ? this.item.titlePos : null;
        if (pos === "CC") pos = "Center";
        this.matrixButtons.forEach((btn) => {
            if (btn.dataset.pos === pos) {
                btn.className = "frame-matrix-btn font-semibold bg-blue-600 text-white rounded text-[11px] shadow border border-blue-400";
            } else {
                btn.className = "frame-matrix-btn font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] border border-slate-700";
            }
        });
    }

    syncStyleButtons() {
        const activeStyle = this.item ? (this.item.frameStyle ?? 2) : 2;
        this.styleButtons.forEach((btn) => {
            const idx = parseInt(btn.dataset.style, 10);
            if (idx === activeStyle) {
                btn.className = "matte-style-btn flex-1 py-1 px-1.5 rounded font-semibold bg-blue-600 text-white border border-blue-400 text-xs shadow";
            } else {
                btn.className = "matte-style-btn flex-1 py-1 px-1.5 rounded font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs";
            }
        });
    }

    syncSizeButtons() {
        const activeSize = this.item ? (this.item.frameSize ?? 1) : 1;
        this.sizeButtons.forEach((btn) => {
            const idx = parseInt(btn.dataset.size, 10);
            if (idx === activeSize) {
                btn.className = "matte-size-btn flex-1 py-1 rounded font-semibold bg-blue-600 text-white border border-blue-400 text-xs shadow";
            } else {
                btn.className = "matte-size-btn flex-1 py-1 rounded font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs";
            }
        });
    }

    resizeCanvas() {
        const container = this.canvas.parentElement;
        if (!container) return;
        this.canvas.width = Math.max(300, container.clientWidth - 16);
        this.canvas.height = Math.max(200, container.clientHeight - 16);
    }

    onPointerDown(e) {
        if (!this.item || !this.item.isTitle || e.button !== 0) return;

        const rect = this.canvas.getBoundingClientRect();
        const px = e.clientX - rect.left;
        const py = e.clientY - rect.top;

        const tr = this.titleRect;
        const grip = { x: tr.x + tr.w - 12, y: tr.y + tr.h - 12, w: 16, h: 16 };

        if (px >= grip.x && px <= grip.x + grip.w && py >= grip.y && py <= grip.y + grip.h) {
            this.isResizingTitle = true;
            this.startMouseY = py;
            this.startFontSize = this.item.titleFontSize || 26;
            this.canvas.setPointerCapture(e.pointerId);
            return;
        }

        if (px >= tr.x && px <= tr.x + tr.w && py >= tr.y && py <= tr.y + tr.h) {
            this.isDraggingTitle = true;
            this.dragOffset = { x: px - tr.x, y: py - tr.y };
            this.canvas.setPointerCapture(e.pointerId);
            return;
        }
    }

    onPointerMove(e) {
        if (!this.item || !this.item.isTitle) return;

        const rect = this.canvas.getBoundingClientRect();
        const px = e.clientX - rect.left;
        const py = e.clientY - rect.top;

        if (this.isResizingTitle) {
            const dy = py - this.startMouseY;
            const newSize = Math.max(10, Math.min(120, Math.round(this.startFontSize + dy * 0.4)));
            for (const itm of this.getSelectedItems()) {
                itm.titleFontSize = newSize;
            }
            this.sldFontSize.value = newSize;
            this.lblFontSize.textContent = `${newSize}px`;
            this.render();
            return;
        }

        if (this.isDraggingTitle) {
            const r = this.currentImgRect;
            if (r.w > 0 && r.h > 0) {
                const newX = px - this.dragOffset.x;
                const newY = py - this.dragOffset.y;
                const relPos = [(newX - r.x) / r.w, (newY - r.y) / r.h];
                for (const itm of this.getSelectedItems()) {
                    itm.titleRelPos = [...relPos];
                    itm.isCustomPositioned = true;
                }
                this.syncMatrixButtons();
                this.render();
            }
            return;
        }

        const tr = this.titleRect;
        const grip = { x: tr.x + tr.w - 12, y: tr.y + tr.h - 12, w: 16, h: 16 };
        if (px >= grip.x && px <= grip.x + grip.w && py >= grip.y && py <= grip.y + grip.h) {
            this.canvas.style.cursor = "nwse-resize";
        } else if (px >= tr.x && px <= tr.x + tr.w && py >= tr.y && py <= tr.y + tr.h) {
            this.canvas.style.cursor = "move";
        } else {
            this.canvas.style.cursor = "default";
        }
    }

    onPointerUp(e) {
        if (this.isDraggingTitle || this.isResizingTitle) {
            try { this.canvas.releasePointerCapture(e.pointerId); } catch (_) {}
            this.isDraggingTitle = false;
            this.isResizingTitle = false;
            for (const itm of this.getSelectedItems()) {
                itm.generateThumbnail();
            }
            this.app.renderFilmstrip();
            this.render();
        }
    }

    // ==================================================================
    // MAIN RENDERING ENGINE (Includes Active Image Effects)
    // ==================================================================
    render() {
        const item = this.item;
        const ctx = this.ctx;
        const cw = this.canvas.width;
        const ch = this.canvas.height;

        ctx.clearRect(0, 0, cw, ch);
        if (!item || !item.imgElement) return;

        const sourceToDraw = (typeof item.getProcessedSource === "function" ? item.getProcessedSource() : null) || item.imgElement;
        const srcW = sourceToDraw.naturalWidth || sourceToDraw.videoWidth || sourceToDraw.width || item.w;
        const srcH = sourceToDraw.naturalHeight || sourceToDraw.videoHeight || sourceToDraw.height || item.h;

        const fWidth = item.isMatte ? this.pixelWidths[item.frameSize ?? 1] : 0;
        const borderPad = (item.isMatte && item.isBorder) ? 8 : 0;
        const totalPad = (fWidth + borderPad + 18) * 2;

        const maxW = Math.max(80, cw - totalPad);
        const maxH = Math.max(60, ch - totalPad);

        const imgAspect = srcW / srcH;
        let sw = maxW;
        let sh = Math.round(sw / imgAspect);
        if (sh > maxH) {
            sh = maxH;
            sw = Math.round(sh * imgAspect);
        }

        const cx = Math.round(cw / 2);
        const cy = Math.round(ch / 2);
        const imgX = Math.round(cx - sw / 2);
        const imgY = Math.round(cy - sh / 2);

        this.currentImgRect = { x: imgX, y: imgY, w: sw, h: sh };

        // 1. Draw Structural Matte Frame
        if (item.isMatte) {
            this.drawMatteFrame(ctx, imgX, imgY, sw, sh, fWidth, item.frameStyle ?? 2, item.matteColor || "#dddddd");

            if (item.isBorder) {
                this.drawOuterBorder(ctx, imgX, imgY, sw, sh, fWidth, item.frameStyle ?? 2, item.borderColor || "#111144");
            }
        }

        // 2. Draw Post-Effects Processed Image
        ctx.save();
        ctx.beginPath();
        ctx.rect(imgX, imgY, sw, sh);
        ctx.clip();
        ctx.drawImage(sourceToDraw, 0, 0, srcW, srcH, imgX, imgY, sw, sh);
        ctx.restore();

        // 3. Draw Title Typography
        if (item.isTitle && item.title && item.title.trim()) {
            this.drawTitle(ctx, imgX, imgY, sw, sh, fWidth, item);
        }
    }

    drawMatteFrame(ctx, x, y, w, h, fWidth, styleIdx, matteColor) {
        ctx.save();
        ctx.fillStyle = matteColor;

        const ox = x - fWidth;
        const oy = y - fWidth;
        const ow = w + fWidth * 2;
        const oh = h + fWidth * 2;

        if (styleIdx === 0) {
            ctx.beginPath();
            ctx.rect(ox, oy, ow, oh);
            ctx.rect(x, y, w, h);
            ctx.fill("evenodd");
        } else if (styleIdx === 1) {
            const radius = Math.max(8, Math.round(fWidth / 2 + 6));
            ctx.beginPath();
            ctx.roundRect(ox, oy, ow, oh, radius);
            ctx.rect(x, y, w, h);
            ctx.fill("evenodd");
        } else if (styleIdx === 2) {
            ctx.beginPath();
            ctx.rect(ox, oy, ow, oh);
            ctx.rect(x, y, w, h);
            ctx.fill("evenodd");

            ctx.lineWidth = Math.max(2, Math.min(4, Math.round(fWidth / 5)));

            ctx.strokeStyle = "rgba(255, 255, 255, 0.75)";
            ctx.beginPath();
            ctx.moveTo(ox, oy + oh); ctx.lineTo(ox, oy); ctx.lineTo(ox + ow, oy);
            ctx.moveTo(x + w, y + h); ctx.lineTo(x, y + h); ctx.lineTo(x, y);
            ctx.stroke();

            ctx.strokeStyle = "rgba(0, 0, 0, 0.55)";
            ctx.beginPath();
            ctx.moveTo(ox + ow, oy); ctx.lineTo(ox + ow, oy + oh); ctx.lineTo(ox, oy + oh);
            ctx.moveTo(x, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + h);
            ctx.stroke();
        }
        ctx.restore();
    }

    drawOuterBorder(ctx, x, y, w, h, fWidth, styleIdx, borderColor) {
        ctx.save();
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 4;

        const bx = x - fWidth - 2;
        const by = y - fWidth - 2;
        const bw = w + (fWidth * 2) + 4;
        const bh = h + (fWidth * 2) + 4;

        ctx.beginPath();
        if (styleIdx === 1) {
            const radius = Math.max(10, Math.round(fWidth / 2 + 8));
            ctx.roundRect(bx, by, bw, bh, radius);
        } else {
            ctx.rect(bx, by, bw, bh);
        }
        ctx.stroke();
        ctx.restore();
    }

    drawTitle(ctx, imgX, imgY, imgW, imgH, fWidth, item) {
        const lines = item.title.split("\n");
        const fontSize = item.titleFontSize || 26;
        ctx.font = `bold ${fontSize}px Inter, sans-serif`;

        let maxLineW = 0;
        const lineHeight = Math.round(fontSize * 1.25);
        lines.forEach((line) => {
            const m = ctx.measureText(line);
            if (m.width > maxLineW) maxLineW = m.width;
        });

        const textW = Math.round(maxLineW);
        const textH = Math.round(lineHeight * lines.length);

        let tx, ty;
        const pad = 14;

        if (item.isCustomPositioned && item.titleRelPos) {
            tx = Math.round(imgX + item.titleRelPos[0] * imgW);
            ty = Math.round(imgY + item.titleRelPos[1] * imgH);
        } else {
            const pos = item.titlePos || "LL";
            switch (pos) {
                case "UL": tx = imgX + pad; ty = imgY + pad; break;
                case "UR": tx = imgX + imgW - textW - pad; ty = imgY + pad; break;
                case "LL": tx = imgX + pad; ty = imgY + imgH - textH - pad; break;
                case "LR": tx = imgX + imgW - textW - pad; ty = imgY + imgH - textH - pad; break;
                case "Center":
                case "CC":
                    tx = imgX + (imgW - textW) / 2;
                    ty = imgY + (imgH - textH) / 2;
                    break;
                case "Left": tx = imgX + pad; ty = imgY + (imgH - textH) / 2; break;
                case "Right": tx = imgX + imgW - textW - pad; ty = imgY + (imgH - textH) / 2; break;
                case "Up": tx = imgX + (imgW - textW) / 2; ty = imgY + pad; break;
                case "Down": tx = imgX + (imgW - textW) / 2; ty = imgY + imgH - textH - pad; break;
                default:
                    tx = imgX + pad; ty = imgY + imgH - textH - pad;
                    break;
            }
        }

        tx = Math.round(tx);
        ty = Math.round(ty);
        this.titleRect = { x: tx - 6, y: ty - 4, w: textW + 12, h: textH + 8 };

        ctx.save();
        ctx.textBaseline = "top";
        ctx.textAlign = "left";

        if (item.titleShadow) {
            const rgb = this.hexToRgb(item.titleColor || "#ffffff");
            const lum = 0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b;
            ctx.fillStyle = lum < 128 ? "rgba(240, 240, 240, 0.9)" : "rgba(15, 15, 15, 0.9)";
            const sOffset = Math.max(2, Math.round(fontSize / 18));
            lines.forEach((line, idx) => {
                ctx.fillText(line, tx + sOffset, ty + idx * lineHeight + sOffset);
            });
        }

        ctx.fillStyle = item.titleColor || "#ffffff";
        lines.forEach((line, idx) => {
            ctx.fillText(line, tx, ty + idx * lineHeight);
        });

        ctx.strokeStyle = "rgba(250, 204, 21, 0.85)";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(this.titleRect.x, this.titleRect.y, this.titleRect.w, this.titleRect.h);
        ctx.setLineDash([]);

        ctx.fillStyle = "#eab308";
        ctx.fillRect(this.titleRect.x + this.titleRect.w - 10, this.titleRect.y + this.titleRect.h - 10, 10, 10);
        ctx.restore();
    }

    hexToRgb(hex) {
        let c = hex.replace("#", "");
        if (c.length === 3) c = c.split("").map((x) => x + x).join("");
        const num = parseInt(c, 16);
        return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
    }
}
