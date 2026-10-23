"use strict";

// ======================================================================
// UTILITIES: Toast Notifications
// ======================================================================
function showToast(message, type = "info") {
    const container = document.getElementById("toastContainer");
    if (!container) return;
    const toast = document.createElement("div");
    const colors = {
        info: "bg-slate-800 text-white border-slate-700",
        success: "bg-emerald-600 text-white border-emerald-500",
        error: "bg-red-600 text-white border-red-500"
    };
    toast.className = `pointer-events-auto px-4 py-2 rounded-xl shadow-xl border text-xs sm:text-sm font-medium transition-all duration-300 transform translate-y-0 opacity-100 ${colors[type] || colors.info}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateY(-6px)";
        setTimeout(() => toast.remove(), 250);
    }, 2800);
}

// ======================================================================
// DATA MODEL: MediaItem (Port of Picture from Pictures.py)
// ======================================================================
class MediaItem {
    constructor(fileOrName, w = 1920, h = 1080, imgElement = null, isVideo = false, objectUrl = null) {
        this.id = "media_" + Math.random().toString(36).substring(2, 9);
        this.filename = typeof fileOrName === "string" ? fileOrName : fileOrName.name;
        this.w = w;
        this.h = h;
        this.imgElement = imgElement;
        this.objectUrl = objectUrl;
        this.isVideo = isVideo;
        this.videoDuration = "0:00";
        this.isHidden = false;

        // PhotoZoom Parameters (Port of PhotoZoom_2.py)
        this.isZoom = true;
        this.isLock = true;
        this.moveDuration = 5.0;

        this.rotateStart = 0;
        this.rotateEnd = 0;
        this.rectStart = [0, 0, w, h];
        this.rectEnd = [0, 0, w, h];
        this.applyRandomZoom();

        // PhotoEffects Parameters (Port of PhotoEffects_2.py)
        this.curRotation = "Normal";
        this.curMirror = "Normal";
        this.curColor = "Normal";
        this.curColormap = "Normal";

        // PhotoFrame & Title Parameters (Port of PhotoFrame.py)
        this.isTitle = false;
        this.title = this.filename.replace(/\.[^/.]+$/, "").replace(/_/g, " ");
        this.titleColor = "#ffffff";
        this.titlePos = "LL";
        this.titleShadow = true;
        this.titleFontSize = 26;
        this.titleRelPos = null;
        this.isCustomPositioned = false;
        this.isMatte = false;
        this.matteColor = "#dddddd";
        this.isBorder = false;
        this.borderColor = "#111144";
        this.frameStyle = 2; // Default: 2 (Bevel Mat)
        this.frameSize = 1;  // Default: 1 (16px)
        this.rotationAngle = 0;

        // Transitions Parameters (Port of PhotoTransitions.py)
        this.transDuration = 2.0;
        this.transType = "Fade";
        this.transSubtype = "Simple";
        this.transItem = "Replace";
        this.transRotation = 0;
        this.transNegative = false;

        // Paint Parameters (Port of Paint02.py)
        this.paintActions = [];
        this.paintUndoneActions = [];

        // Aspect ratio cache
        this.aspectRatio = w / h;

        // Thumbnail Cache
        this.thumbUrl = null;
        if (imgElement) {
            this.generateThumbnail();
        }
    }

    getEffectsOnlySource() {
        if (!this.imgElement) return null;
        if (
            typeof applyImageEffectsToCanvas === "function" &&
            (this.curRotation !== "Normal" ||
             this.curMirror !== "Normal" ||
             this.curColor !== "Normal" ||
             this.curColormap !== "Normal")
        ) {
            return applyImageEffectsToCanvas(
                this.imgElement,
                this.curRotation,
                this.curMirror,
                this.curColor,
                this.curColormap
            );
        }
        return this.imgElement;
    }

    getProcessedSource() {
        const base = this.getEffectsOnlySource();
        if (!base) return null;
        if (this.paintActions && this.paintActions.length > 0 && typeof renderPaintActionsToCanvas === "function") {
            return renderPaintActionsToCanvas(base, this);
        }
        return base;
    }

    applyRandomZoom() {
        const ratio = 1920 / 1080;
        const imgW = this.w;
        const imgH = this.h;

        this.rotateStart = 0;
        this.rotateEnd = 0;

        let fullW = imgW;
        let fullH = Math.round(fullW / ratio);
        if (fullH > imgH) {
            fullH = imgH;
            fullW = Math.round(fullH * ratio);
        }
        const fullX = Math.round((imgW - fullW) / 2);
        const fullY = Math.round((imgH - fullH) / 2);
        const fullRect = [fullX, fullY, fullW, fullH];

        const calcPresetRect = (posName, w, h) => {
            let x = Math.round((imgW - w) / 2);
            let y = Math.round((imgH - h) / 2);

            if (posName.includes("L") && !posName.includes("Center") && posName !== "LC") {
                x = 0;
            } else if (posName.includes("R")) {
                x = imgW - w;
            }

            if (posName.includes("U")) {
                y = 0;
            } else if (posName.includes("D") || posName === "LL" || posName === "LC" || posName === "LR") {
                y = imgH - h;
            }

            return [Math.max(0, x), Math.max(0, y), w, h];
        };

        const positions = ["UL", "UC", "UR", "Left", "Center", "Right", "LL", "LC", "LR"];
        const pos1 = positions[Math.floor(Math.random() * positions.length)];
        let pos2 = positions[Math.floor(Math.random() * positions.length)];
        while (pos2 === pos1) {
            pos2 = positions[Math.floor(Math.random() * positions.length)];
        }

        const zoomScale = 0.60 + Math.random() * 0.15;
        const zoomW = Math.round(fullW * zoomScale);
        const zoomH = Math.round(zoomW / ratio);

        const motionType = Math.random();
        if (motionType < 0.45) {
            this.rectStart = fullRect;
            this.rectEnd = calcPresetRect(pos2, zoomW, zoomH);
        } else if (motionType < 0.90) {
            this.rectStart = calcPresetRect(pos1, zoomW, zoomH);
            this.rectEnd = fullRect;
        } else {
            this.rectStart = calcPresetRect(pos1, zoomW, zoomH);
            this.rectEnd = calcPresetRect(pos2, zoomW, zoomH);
        }
    }

    resetToFullExtent() {
        const ratio = 1920 / 1080;
        let fullW = this.w;
        let fullH = Math.round(fullW / ratio);
        
        // If the 16:9 height exceeds the image height, constrain to height and recalculate width
        if (fullH > this.h) {
            fullH = this.h;
            fullW = Math.round(fullH * ratio);
        }
        
        // Center the 16:9 crop box perfectly inside the image bounds
        const fullX = Math.round((this.w - fullW) / 2);
        const fullY = Math.round((this.h - fullH) / 2);
        
        this.rectStart = [fullX, fullY, fullW, fullH];
        this.rectEnd = [fullX, fullY, fullW, fullH];
    }
    
    // ==================================================================
    // FULL COMPOSITE THUMBNAIL GENERATOR (Effects + Frame + Title + Aspect)
    // ==================================================================
    generateThumbnail() {
        if (!this.imgElement) return;

        const src = this.getProcessedSource() || this.imgElement;
        const sw = src.naturalWidth || src.videoWidth || src.width || this.w;
        const sh = src.naturalHeight || src.videoHeight || src.height || this.h;

        const targetBaseH = 140;
        const targetBaseW = Math.max(1, Math.round(targetBaseH * (sw / sh)));

        const thumbMatteSizes = [2, 5, 10, 16];
        const fWidth = this.isMatte ? thumbMatteSizes[this.frameSize ?? 1] : 0;
        const borderPad = (this.isMatte && this.isBorder) ? 2 : 0;
        const totalPad = fWidth + borderPad;

        const cvsW = targetBaseW + totalPad * 2;
        const cvsH = targetBaseH + totalPad * 2;

        const cvs = document.createElement("canvas");
        cvs.width = cvsW;
        cvs.height = cvsH;
        const ctx = cvs.getContext("2d");
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        const imgX = totalPad;
        const imgY = totalPad;
        const imgW = targetBaseW;
        const imgH = targetBaseH;

        this.aspectRatio = cvsW / cvsH;

        if (this.isMatte) {
            const ox = imgX - fWidth;
            const oy = imgY - fWidth;
            const ow = imgW + fWidth * 2;
            const oh = imgH + fWidth * 2;
            const styleIdx = this.frameStyle ?? 2;

            ctx.save();
            ctx.fillStyle = this.matteColor || "#dddddd";

            if (styleIdx === 0) {
                ctx.beginPath();
                ctx.rect(ox, oy, ow, oh);
                ctx.rect(imgX, imgY, imgW, imgH);
                ctx.fill("evenodd");
            } else if (styleIdx === 1) {
                const r = Math.max(3, Math.round(fWidth * 0.75));
                ctx.beginPath();
                ctx.roundRect(ox, oy, ow, oh, r);
                ctx.rect(imgX, imgY, imgW, imgH);
                ctx.fill("evenodd");
            } else if (styleIdx === 2) {
                ctx.beginPath();
                ctx.rect(ox, oy, ow, oh);
                ctx.rect(imgX, imgY, imgW, imgH);
                ctx.fill("evenodd");

                ctx.lineWidth = Math.max(1, Math.round(fWidth * 0.3));
                ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
                ctx.beginPath();
                ctx.moveTo(ox, oy + oh); ctx.lineTo(ox, oy); ctx.lineTo(ox + ow, oy);
                ctx.moveTo(imgX + imgW, imgY + imgH); ctx.lineTo(imgX, imgY + imgH); ctx.lineTo(imgX, imgY);
                ctx.stroke();

                ctx.strokeStyle = "rgba(0, 0, 0, 0.65)";
                ctx.beginPath();
                ctx.moveTo(ox + ow, oy); ctx.lineTo(ox + ow, oy + oh); ctx.lineTo(ox, oy + oh);
                ctx.moveTo(imgX, imgY); ctx.lineTo(imgX + imgW, imgY); ctx.lineTo(imgX + imgW, imgY + imgH);
                ctx.stroke();
            }
            ctx.restore();

            if (this.isBorder) {
                ctx.save();
                ctx.strokeStyle = this.borderColor || "#111144";
                ctx.lineWidth = 2;
                const bx = ox - 1;
                const by = oy - 1;
                const bw = ow + 2;
                const bh = oh + 2;
                ctx.beginPath();
                if (styleIdx === 1) {
                    ctx.roundRect(bx, by, bw, bh, Math.max(4, Math.round(fWidth * 0.75 + 1)));
                } else {
                    ctx.rect(bx, by, bw, bh);
                }
                ctx.stroke();
                ctx.restore();
            }
        }

        ctx.save();
        ctx.beginPath();
        ctx.rect(imgX, imgY, imgW, imgH);
        ctx.clip();
        ctx.drawImage(src, 0, 0, sw, sh, imgX, imgY, imgW, imgH);
        ctx.restore();

        if (this.isTitle && this.title && this.title.trim()) {
            ctx.save();
            const lines = this.title.split("\n");
            const fontSize = Math.max(8, Math.round((this.titleFontSize || 26) * (targetBaseH / 360)));
            ctx.font = `bold ${fontSize}px Inter, sans-serif`;

            let maxLineW = 0;
            const lineHeight = Math.round(fontSize * 1.22);
            lines.forEach((line) => {
                const m = ctx.measureText(line);
                if (m.width > maxLineW) maxLineW = m.width;
            });
            const textW = Math.round(maxLineW);
            const textH = Math.round(lineHeight * lines.length);

            let tx, ty;
            const pad = Math.max(3, Math.round(targetBaseH * 0.04));

            if (this.isCustomPositioned && this.titleRelPos) {
                tx = Math.round(imgX + this.titleRelPos[0] * imgW);
                ty = Math.round(imgY + this.titleRelPos[1] * imgH);
            } else {
                const pos = this.titlePos || "LL";
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

            ctx.textBaseline = "top";
            ctx.textAlign = "left";

            if (this.titleShadow) {
                const hex = (this.titleColor || "#ffffff").replace("#", "");
                const num = parseInt(hex.length === 3 ? hex.split("").map(c => c+c).join("") : hex, 16);
                const r = (num >> 16) & 255;
                const g = (num >> 8) & 255;
                const b = num & 255;
                const lum = 0.299 * r + 0.587 * g + 0.114 * b;
                ctx.fillStyle = lum < 128 ? "rgba(240, 240, 240, 0.85)" : "rgba(10, 10, 10, 0.85)";
                const sOffset = 1;
                lines.forEach((line, idx) => {
                    ctx.fillText(line, tx + sOffset, ty + idx * lineHeight + sOffset);
                });
            }

            ctx.fillStyle = this.titleColor || "#ffffff";
            lines.forEach((line, idx) => {
                ctx.fillText(line, tx, ty + idx * lineHeight);
            });
            ctx.restore();
        }

        this.thumbUrl = cvs.toDataURL("image/jpeg", 0.90);
    }

    dispose() {
        if (this.objectUrl) {
            URL.revokeObjectURL(this.objectUrl);
            this.objectUrl = null;
        }
    }
}

// ======================================================================
// MEDIA FILE LOADER
// ======================================================================
function loadMediaFile(file) {
    return new Promise((resolve, reject) => {
        const isVideo = file.type.startsWith("video/") || /\.(mp4|webm|mov|mkv|ogg)$/i.test(file.name);
        const url = URL.createObjectURL(file);

        if (!isVideo) {
            const img = new Image();
            img.onload = () => {
                const w = img.naturalWidth || img.width || 1920;
                const h = img.naturalHeight || img.height || 1080;
                const item = new MediaItem(file.name, w, h, img, false, url);
                resolve(item);
            };
            img.onerror = () => {
                URL.revokeObjectURL(url);
                reject(new Error(`Failed to load image: ${file.name}`));
            };
            img.src = url;
        } else {
            const video = document.createElement("video");
            video.preload = "metadata";
            video.muted = true;
            video.playsInline = true;

            video.onloadedmetadata = () => {
                video.currentTime = Math.min(1.0, (video.duration || 0) * 0.25);
            };

            video.onseeked = () => {
                const vw = video.videoWidth || 1280;
                const vh = video.videoHeight || 720;
                const cvs = document.createElement("canvas");
                cvs.width = vw;
                cvs.height = vh;
                const ctx = cvs.getContext("2d");
                ctx.drawImage(video, 0, 0, vw, vh);

                const item = new MediaItem(file.name, vw, vh, cvs, true, url);
                const mins = Math.floor(video.duration / 60);
                const secs = Math.floor(video.duration % 60);
                item.videoDuration = `${mins}:${secs.toString().padStart(2, "0")}`;
                resolve(item);
            };

            video.onerror = () => {
                URL.revokeObjectURL(url);
                reject(new Error(`Failed to decode video: ${file.name}`));
            };
            video.src = url;
        }
    });
}

// ======================================================================
// INTERACTIVE SECTION CANVAS EDITOR (Multi-Selection Aware)
// ======================================================================
class ImageSectionEditorCanvas {
    constructor(canvasEl, isEnd, app) {
        this.canvas = canvasEl;
        this.ctx = canvasEl.getContext("2d");
        this.isEnd = isEnd;
        this.app = app;
        this.RATIO = 1920 / 1080;

        this.action = null;
        this.startPointer = { x: 0, y: 0 };
        this.startRect = [0, 0, 1920, 1080];
        this.startAngle = 0;
        this.isRotating = false;

        this.initEvents();
    }

    get item() {
        const primaryIdx = this.app.selectedIndices[this.app.selectedIndices.length - 1];
        return this.app.mediaItems[primaryIdx] || null;
    }

    get rect() {
        if (!this.item) return [0, 0, 1920, 1080];
        return this.isEnd ? this.item.rectEnd : this.item.rectStart;
    }

    set rect(val) {
        for (const itm of this.app.getSelectedItems()) {
            if (this.isEnd) itm.rectEnd = [...val];
            else itm.rectStart = [...val];
        }
    }

    get angle() {
        if (!this.item) return 0;
        return this.isEnd ? this.item.rotateEnd : this.item.rotateStart;
    }

    set angle(val) {
        for (const itm of this.app.getSelectedItems()) {
            if (this.isEnd) itm.rotateEnd = val;
            else itm.rotateStart = val;
        }
    }

    getTransform() {
        const item = this.item;
        if (!item || !item.w || !item.h) return { scale: 1, left: 0, top: 0, imgW: 100, imgH: 100 };
        const cw = this.canvas.width;
        const ch = this.canvas.height;
        const scale = Math.min(cw / item.w, ch / item.h);
        const imgW = item.w * scale;
        const imgH = item.h * scale;
        const left = (cw - imgW) / 2;
        const top = (ch - imgH) / 2;
        return { scale, left, top, imgW, imgH };
    }

    initEvents() {
        this.canvas.addEventListener("pointerdown", (e) => this.onPointerDown(e));
        window.addEventListener("pointermove", (e) => this.onPointerMove(e));
        window.addEventListener("pointerup", (e) => this.onPointerUp(e));
        this.canvas.addEventListener("wheel", (e) => this.onWheel(e), { passive: false });
    }

    clientToLocal(px, py) {
        const { scale, left, top } = this.getTransform();
        const rect = this.rect;
        const ccx = left + (rect[0] + rect[2] / 2) * scale;
        const ccy = top + (rect[1] + rect[3] / 2) * scale;
        const rad = (-this.angle * Math.PI) / 180;
        const dx = px - ccx;
        const dy = py - ccy;
        const lx = dx * Math.cos(rad) - dy * Math.sin(rad);
        const ly = dx * Math.sin(rad) + dy * Math.cos(rad);
        return { lx, ly, ccx, ccy, scale, left, top };
    }

    findHitTarget(px, py) {
        const { lx, ly, scale } = this.clientToLocal(px, py);
        const rect = this.rect;
        const hw = (rect[2] * scale) / 2;
        const hh = (rect[3] * scale) / 2;

        const pinY = -hh - 26;
        if (Math.hypot(lx, ly - pinY) <= 14) return "rotate";

        const tol = 14;
        const nearLeft = Math.abs(lx - -hw) <= tol;
        const nearRight = Math.abs(lx - hw) <= tol;
        const nearTop = Math.abs(ly - -hh) <= tol;
        const nearBottom = Math.abs(ly - hh) <= tol;

        if (nearTop && nearLeft) return "resize-tl";
        if (nearTop && nearRight) return "resize-tr";
        if (nearBottom && nearLeft) return "resize-bl";
        if (nearBottom && nearRight) return "resize-br";

        if (nearTop && Math.abs(lx) <= hw) return "resize-t";
        if (nearBottom && Math.abs(lx) <= hw) return "resize-b";
        if (nearLeft && Math.abs(ly) <= hh) return "resize-l";
        if (nearRight && Math.abs(ly) <= hh) return "resize-r";

        if (Math.abs(lx) <= hw && Math.abs(ly) <= hh) return "inside";
        return null;
    }

    onPointerDown(e) {
        if (!this.item || e.button !== 0) return;
        const canvasRect = this.canvas.getBoundingClientRect();
        const px = e.clientX - canvasRect.left;
        const py = e.clientY - canvasRect.top;

        this.action = this.findHitTarget(px, py);
        if (!this.action) return;

        this.canvas.setPointerCapture(e.pointerId);
        this.startPointer = { x: px, y: py };
        this.startRect = [...this.rect];
        this.startAngle = this.angle;
        this.isRotating = (this.action === "rotate");
        this.render();
    }

    keepInImage() {
        const item = this.item;
        if (!item) return;

        let [x, y, w, h] = this.rect;
        const minW = 120;
        if (w < minW) {
            w = minW;
            h = Math.round(w / this.RATIO);
        }

        if (item.isLock) {
            if (w > item.w) {
                w = item.w;
                h = Math.round(w / this.RATIO);
            }
            if (h > item.h) {
                h = item.h;
                w = Math.round(h * this.RATIO);
            }

            if (x < 0) x = 0;
            if (y < 0) y = 0;
            if (x + w > item.w) x = item.w - w;
            if (y + h > item.h) y = item.h - h;
        }

        this.rect = [Math.round(x), Math.round(y), Math.round(w), Math.round(h)];
    }

    onPointerMove(e) {
        if (!this.item) return;
        const canvasRect = this.canvas.getBoundingClientRect();
        const px = e.clientX - canvasRect.left;
        const py = e.clientY - canvasRect.top;

        if (!this.action) {
            const hit = this.findHitTarget(px, py);
            const cursorMap = {
                "rotate": "grab",
                "inside": "move",
                "resize-tl": "nwse-resize",
                "resize-br": "nwse-resize",
                "resize-tr": "nesw-resize",
                "resize-bl": "nesw-resize",
                "resize-t": "ns-resize",
                "resize-b": "ns-resize",
                "resize-l": "ew-resize",
                "resize-r": "ew-resize"
            };
            this.canvas.style.cursor = cursorMap[hit] || "default";
            return;
        }

        const { scale, left, top } = this.getTransform();
        const item = this.item;

        if (this.action === "rotate") {
            const ccx = left + (this.startRect[0] + this.startRect[2] / 2) * scale;
            const ccy = top + (this.startRect[1] + this.startRect[3] / 2) * scale;
            const angleCurrent = (Math.atan2(py - ccy, px - ccx) * 180) / Math.PI;
            const angleStart = (Math.atan2(this.startPointer.y - ccy, this.startPointer.x - ccx) * 180) / Math.PI;
            let targetAngle = (this.startAngle + (angleCurrent - angleStart)) % 360;
            if (targetAngle < 0) targetAngle += 360;

            const snaps = [0, 45, 90, 135, 180, 225, 270, 315, 360];
            for (const snap of snaps) {
                if (Math.abs(targetAngle - snap) < 5) {
                    targetAngle = snap === 360 ? 0 : snap;
                    break;
                }
            }
            this.angle = Math.round(targetAngle);
        } else if (this.action === "inside") {
            const dx = (px - this.startPointer.x) / scale;
            const dy = (py - this.startPointer.y) / scale;
            let nx = this.startRect[0] + dx;
            let ny = this.startRect[1] + dy;
            const nw = this.startRect[2];
            const nh = this.startRect[3];

            this.rect = [Math.round(nx), Math.round(ny), Math.round(nw), Math.round(nh)];
            this.keepInImage();
        } else if (this.action.startsWith("resize-")) {
            const handle = this.action.replace("resize-", "");
            const hasL = handle.includes("l");
            const hasR = handle.includes("r");
            const hasT = handle.includes("t");
            const hasB = handle.includes("b");

            const rad = (-this.startAngle * Math.PI) / 180;
            const dxGlobal = (px - this.startPointer.x) / scale;
            const dyGlobal = (py - this.startPointer.y) / scale;
            const ldx = dxGlobal * Math.cos(rad) - dyGlobal * Math.sin(rad);
            const ldy = dxGlobal * Math.sin(rad) + dyGlobal * Math.cos(rad);

            let dx = null;
            let dy = null;
            if (hasL) dx = -ldx;
            else if (hasR) dx = ldx;

            if (hasT) dy = -ldy;
            else if (hasB) dy = ldy;

            let deltaW = 0;
            if (dy === null || (dx !== null && Math.abs(dx) > Math.abs(dy * this.RATIO))) {
                deltaW = dx;
            } else {
                deltaW = dy * this.RATIO;
            }

            let newW = this.startRect[2] + deltaW;
            let newH = newW / this.RATIO;

            const minW = 120;
            if (newW < minW) {
                newW = minW;
                newH = newW / this.RATIO;
                deltaW = newW - this.startRect[2];
            }

            if (item.isLock) {
                if (newW > item.w) {
                    newW = item.w;
                    newH = newW / this.RATIO;
                    deltaW = newW - this.startRect[2];
                }
                if (newH > item.h) {
                    newH = item.h;
                    newW = newH * this.RATIO;
                    deltaW = newW - this.startRect[2];
                }
            }

            let nx = this.startRect[0];
            let ny = this.startRect[1];

            if (hasL) nx = this.startRect[0] - deltaW;
            if (hasT) ny = this.startRect[1] - (deltaW / this.RATIO);

            if (this.action === "resize-t" || this.action === "resize-b") {
                nx = this.startRect[0] + (this.startRect[2] - newW) / 2;
            }
            if (this.action === "resize-l" || this.action === "resize-r") {
                ny = this.startRect[1] + (this.startRect[3] - newH) / 2;
            }

            this.rect = [Math.round(nx), Math.round(ny), Math.round(newW), Math.round(newH)];
            this.keepInImage();
        }

        this.app.startEditor.render();
        if (this.app.mediaItems[this.app.selectedIndices[this.app.selectedIndices.length - 1]]?.isZoom) {
            this.app.endEditor.render();
        }
    }

    onPointerUp(e) {
        if (this.action) {
            try { this.canvas.releasePointerCapture(e.pointerId); } catch (_) {}
            this.action = null;
            this.isRotating = false;
            this.render();
        }
    }

    onWheel(e) {
        e.preventDefault();
        const item = this.item;
        if (!item) return;

        const delta = e.deltaY > 0 ? 0.95 : 1.05;
        let newW = this.rect[2] * delta;
        let newH = newW / this.RATIO;

        const minW = 120;
        if (newW < minW) {
            newW = minW;
            newH = newW / this.RATIO;
        }

        if (item.isLock) {
            if (newW > item.w) {
                newW = item.w;
                newH = newW / this.RATIO;
            }
            if (newH > item.h) {
                newH = item.h;
                newW = newH * this.RATIO;
            }
        }

        const cx = this.rect[0] + this.rect[2] / 2;
        const cy = this.rect[1] + this.rect[3] / 2;
        let nx = cx - newW / 2;
        let ny = cy - newH / 2;

        this.rect = [Math.round(nx), Math.round(ny), Math.round(newW), Math.round(newH)];
        this.keepInImage();
        this.app.startEditor.render();
        this.app.endEditor.render();
    }

    render() {
        const item = this.item;
        const ctx = this.ctx;
        const cw = this.canvas.width;
        const ch = this.canvas.height;

        ctx.clearRect(0, 0, cw, ch);
        if (!item || !item.imgElement) return;

        const { scale, left, top, imgW, imgH } = this.getTransform();
        const isInteracting = (this.action === "inside" || this.action === "rotate" || this.isRotating);
        const sourceToDraw = item.getProcessedSource() || item.imgElement;

        ctx.fillStyle = "#090d16";
        ctx.fillRect(0, 0, cw, ch);
        ctx.drawImage(sourceToDraw, left, top, imgW, imgH);

        const rect = this.rect;
        const rad = (this.angle * Math.PI) / 180;
        const ccx = left + (rect[0] + rect[2] / 2) * scale;
        const ccy = top + (rect[1] + rect[3] / 2) * scale;
        const rw = rect[2] * scale;
        const rh = rect[3] * scale;
        const hw = rw / 2;
        const hh = rh / 2;

        const cos = Math.cos(rad);
        const sin = Math.sin(rad);
        const pts = [
            [-hw, -hh],
            [hw, -hh],
            [hw, hh],
            [-hw, hh]
        ].map(([px, py]) => [ccx + px * cos - py * sin, ccy + px * sin + py * cos]);

        ctx.save();
        ctx.beginPath();
        ctx.rect(left, top, imgW, imgH);
        ctx.moveTo(pts[0][0], pts[0][1]);
        ctx.lineTo(pts[1][0], pts[1][1]);
        ctx.lineTo(pts[2][0], pts[2][1]);
        ctx.lineTo(pts[3][0], pts[3][1]);
        ctx.closePath();
        ctx.fillStyle = isInteracting ? "rgba(0, 0, 0, 0.68)" : "rgba(0, 0, 0, 0.54)";
        ctx.fill("evenodd");
        ctx.restore();

        ctx.save();
        ctx.translate(ccx, ccy);
        ctx.rotate(rad);

        const boxColor = this.isEnd ? "#f59e0b" : "#06b6d4";
        ctx.strokeStyle = boxColor;
        ctx.lineWidth = isInteracting ? 3 : 2;
        ctx.strokeRect(-hw, -hh, rw, rh);

        ctx.strokeStyle = isInteracting 
            ? (this.isEnd ? "rgba(251, 191, 36, 0.9)" : "rgba(34, 211, 238, 0.9)")
            : (this.isEnd ? "rgba(245, 158, 11, 0.45)" : "rgba(6, 182, 212, 0.45)");
        ctx.lineWidth = isInteracting ? 2.5 : 1;
        ctx.beginPath();
        ctx.moveTo(-hw, -hh + rh / 3); ctx.lineTo(hw, -hh + rh / 3);
        ctx.moveTo(-hw, -hh + (2 * rh) / 3); ctx.lineTo(hw, -hh + (2 * rh) / 3);
        ctx.moveTo(-hw + rw / 3, -hh); ctx.lineTo(-hw + rw / 3, hh);
        ctx.moveTo(-hw + (2 * rw) / 3, -hh); ctx.lineTo(-hw + (2 * rw) / 3, hh);
        ctx.stroke();

        const ticLen = isInteracting ? 10 : 5;
        const ticWidth = isInteracting ? 3 : 1.5;
        ctx.lineWidth = ticWidth;
        ctx.strokeStyle = isInteracting 
            ? (this.isEnd ? "#fbbf24" : "#22d3ee") 
            : (this.isEnd ? "rgba(245, 158, 11, 0.7)" : "rgba(6, 182, 212, 0.7)");

        const xGrid = [-hw + rw / 3, -hw + (2 * rw) / 3];
        const yGrid = [-hh + rh / 3, -hh + (2 * rh) / 3];

        ctx.beginPath();
        for (const gx of xGrid) {
            for (const gy of yGrid) {
                ctx.moveTo(gx - ticLen, gy); ctx.lineTo(gx + ticLen, gy);
                ctx.moveTo(gx, gy - ticLen); ctx.lineTo(gx + ticLen, gy);
            }
        }
        ctx.stroke();

        const pinY = -hh - 26;
        ctx.strokeStyle = boxColor;
        ctx.lineWidth = isInteracting ? 3 : 2;
        ctx.beginPath();
        ctx.moveTo(0, -hh);
        ctx.lineTo(0, pinY);
        ctx.stroke();

        ctx.fillStyle = boxColor;
        ctx.beginPath();
        ctx.arc(0, pinY, isInteracting ? 7 : 5, 0, Math.PI * 2);
        ctx.fill();

        const hs = isInteracting ? 11 : 7;
        ctx.fillStyle = "#ffffff";
        ctx.strokeStyle = boxColor;
        ctx.lineWidth = isInteracting ? 2.5 : 1;
        [
            [-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh],
            [0, -hh], [0, hh], [-hw, 0], [hw, 0]
        ].forEach(([hx, hy]) => {
            ctx.fillRect(hx - hs / 2, hy - hs / 2, hs, hs);
            ctx.strokeRect(hx - hs / 2, hy - hs / 2, hs, hs);
        });

        ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
        ctx.fillRect(-hw + 6, hh - 24, 115, 18);
        ctx.fillStyle = "#e2e8f0";
        ctx.font = "bold 10px Inter, sans-serif";
        ctx.textAlign = "left";
        ctx.fillText(`${rect[2]} × ${rect[3]} px`, -hw + 10, hh - 11);

        ctx.restore();

        if (this.isRotating) {
            ctx.save();
            ctx.strokeStyle = "rgba(6, 182, 212, 0.75)";
            ctx.lineWidth = 2.5;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.arc(ccx, ccy, 60, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);

            ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
            ctx.beginPath();
            ctx.arc(ccx, ccy, 28, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = "#38bdf8";
            ctx.stroke();

            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 14px Inter, sans-serif";
            ctx.textAlign = "center";
            ctx.fillText(`${Math.round(this.angle)}°`, ccx, ccy + 5);
            ctx.restore();
        }
    }
}

// ======================================================================
// MASTER CONTROLLER (CombinedFrame & PicturesLayout Port)
// ======================================================================
class VideoStudioApp {
    constructor() {
        this.mediaItems = [];
        this.selectedIndices = [];
        this.activeTab = "tabOverview";

        // Viewport Stage & Canvas
        this.stageEl = document.getElementById("workspaceStage");
        this.overviewStage = document.getElementById("overviewStage");
        this.canvas = document.getElementById("mainCanvas");
        this.ctx = this.canvas.getContext("2d");

        // Zoom Dual-Frame Components (PhotoZoom_2.py Port)
        this.zoomStage = document.getElementById("zoomStage");
        this.zoomWrapper = document.getElementById("zoomEditorsWrapper");
        this.zoomEndContainer = document.getElementById("zoomEndFrameContainer");
        this.startCanvas = document.getElementById("zoomStartCanvas");
        this.endCanvas = document.getElementById("zoomEndCanvas");

        this.startEditor = new ImageSectionEditorCanvas(this.startCanvas, false, this);
        this.endEditor = new ImageSectionEditorCanvas(this.endCanvas, true, this);

        // Frame & Title Component (PhotoFrame.py Port)
        this.frameStage = document.getElementById("frameStage");
        this.frameEditor = typeof PhotoFrameEditor === "function" ? new PhotoFrameEditor(this) : null;

        // Effects Component (PhotoEffects_2.py Port)
        this.effectsStage = document.getElementById("effectsStage");
        this.effectsEditor = typeof PhotoEffectsEditor === "function" ? new PhotoEffectsEditor(this) : null;

        // Transitions Component (PhotoTransitions.py Port)
        this.transStage = document.getElementById("transStage");
        this.transEditor = typeof PhotoTransitionEditor === "function" ? new PhotoTransitionEditor(this) : null;

        // Paint Component (Paint02.py Port)
        this.paintStage = document.getElementById("paintStage");
        this.paintEditor = typeof PhotoPaintEditor === "function" ? new PhotoPaintEditor(this) : null;

        // Preview Overlay Components
        this.previewOverlay = document.getElementById("zoomPreviewOverlay");
        this.previewCanvas = document.getElementById("zoomPreviewCanvas");
        this.previewCtx = this.previewCanvas.getContext("2d");
        this.previewRafId = null;

        // Drawer State (HoverCollapsiblePicturesPanel port)
        this.isPinned = true;
        this.isExpanded = true;
        this.drawerEl = document.getElementById("filmstripDrawer");
        this.trackEl = document.getElementById("filmstripTrack");

        // Horizontal-Only Drag State
        this.isDragging = false;
        this.dragCandidateIdx = null;
        this.movingIndices = [];
        this.dragGrabOffsetX = 0;
        this.dragYPosition = 0;
        this.ghostEl = null;
        this.spacerEl = null;
        this.currentDropIdx = null;
        this.scrollVelocity = 0;
        this.scrollRafId = null;

        this.initBindings();
        this.updateDrawerHeight();
        this.renderFilmstrip();
        this.renderMainStage();
    }

    getSelectedItems() {
        if (!this.selectedIndices.length) return [];
        return this.selectedIndices.map(i => this.mediaItems[i]).filter(Boolean);
    }

    initBindings() {
        const fileInput = document.getElementById("mediaFileInput");
        document.getElementById("btnAddMedia").addEventListener("click", () => fileInput.click());
        fileInput.addEventListener("change", async (e) => {
            if (e.target.files && e.target.files.length > 0) {
                await this.ingestFiles(Array.from(e.target.files));
                fileInput.value = "";
            }
        });

        document.getElementById("btnLoadDemo").addEventListener("click", () => this.loadDemoMedia());
        document.getElementById("btnClearTimeline").addEventListener("click", () => this.clearTimeline());

        // Horizontal Mouse Wheel Scrolling on Filmstrip
        this.trackEl.addEventListener("wheel", (e) => {
            if (e.deltaY !== 0 || e.deltaX !== 0) {
                e.preventDefault();
                const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
                this.trackEl.scrollLeft += delta;
            }
        }, { passive: false });

        // Zoom Toolbar Controls (Multi-Selection Aware)
        const zoomDurSlider = document.getElementById("zoomDurationSlider");
        zoomDurSlider.addEventListener("input", () => {
            const val = parseFloat((zoomDurSlider.value / 10).toFixed(1));
            document.getElementById("lblZoomDuration").textContent = `${val.toFixed(1)}s`;
            for (const itm of this.getSelectedItems()) {
                itm.moveDuration = val;
            }
            this.renderFilmstrip();
        });

        document.getElementById("chkAllowZoom").addEventListener("change", (e) => {
            const allow = e.target.checked;
            for (const itm of this.getSelectedItems()) {
                itm.isZoom = allow;
                // Instantly snap both zoom boxes to the maximum 16:9 crop that fits inside the image
                itm.resetToFullExtent(); 
            }
            this.updateZoomFramesVisibility();
        });

        document.getElementById("chkLockBoundingBox").addEventListener("change", (e) => {
            const lock = e.target.checked;
            for (const itm of this.getSelectedItems()) {
                itm.isLock = lock;
            }
            this.startEditor.keepInImage();
            this.endEditor.keepInImage();
            this.startEditor.render();
            this.endEditor.render();
        });

        document.getElementById("btnZoomRandom").addEventListener("click", () => this.applyRandomZoomMotion());
        document.getElementById("btnZoomPreview").addEventListener("click", () => this.startKenBurnsPreview());
        document.getElementById("btnStopPreview").addEventListener("click", () => this.stopKenBurnsPreview());

        // Global External File Drag & Drop
        const overlay = document.getElementById("dropOverlay");
        const overlayPrompt = document.getElementById("dropOverlayPrompt");

        window.addEventListener("dragenter", (e) => {
            if (this.isDragging) return;
            if (!e.dataTransfer || !e.dataTransfer.types.includes("Files")) return;
            e.preventDefault();

            if (this.mediaItems.length === 0) {
                overlayPrompt.classList.remove("hidden");
            } else {
                overlayPrompt.classList.add("hidden");
            }
            overlay.classList.remove("hidden");
        });

        window.addEventListener("dragover", (e) => {
            if (this.isDragging) return;
            if (!e.dataTransfer || !e.dataTransfer.types.includes("Files")) return;
            e.preventDefault();
            e.dataTransfer.dropEffect = "copy";
            overlay.classList.remove("hidden");
        });

        this.stageEl.addEventListener("dragleave", (e) => {
            if (!this.stageEl.contains(e.relatedTarget)) {
                overlay.classList.add("hidden");
            }
        });

        window.addEventListener("drop", async (e) => {
            if (this.isDragging) return;
            e.preventDefault();
            overlay.classList.add("hidden");

            const droppedFiles = [];
            if (e.dataTransfer) {
                if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
                    for (let i = 0; i < e.dataTransfer.items.length; i++) {
                        const item = e.dataTransfer.items[i];
                        if (item.kind === "file") {
                            const file = item.getAsFile();
                            if (file) droppedFiles.push(file);
                        }
                    }
                } else if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    for (let i = 0; i < e.dataTransfer.files.length; i++) {
                        droppedFiles.push(e.dataTransfer.files[i]);
                    }
                }
            }

            if (droppedFiles.length > 0) {
                await this.ingestFiles(droppedFiles);
            }
        });

        // Hover Collapsible Drawer Physics
        this.drawerEl.addEventListener("mouseenter", () => {
            if (!this.isPinned && !this.isExpanded) {
                this.isExpanded = true;
                this.updateDrawerHeight();
            }
        });

        this.stageEl.addEventListener("mouseenter", () => {
            if (!this.isPinned && this.isExpanded) {
                this.isExpanded = false;
                this.updateDrawerHeight();
            }
        });

        // Pin Button
        document.getElementById("btnPinDrawer").addEventListener("click", () => {
            this.isPinned = !this.isPinned;
            document.getElementById("lblPinIcon").textContent = this.isPinned ? "📌" : "📍";
            if (this.isPinned) {
                this.isExpanded = true;
                this.updateDrawerHeight();
            }
            showToast(this.isPinned ? "Filmstrip pinned open" : "Filmstrip will auto-collapse on hover", "info");
        });

        // Reorder Buttons
        document.getElementById("btnMoveLeft").addEventListener("click", () => this.moveSelection(-1));
        document.getElementById("btnMoveRight").addEventListener("click", () => this.moveSelection(1));

        // Hide Slide Checkbox
        document.getElementById("chkHideSlide").addEventListener("change", (e) => {
            if (!this.selectedIndices.length) return;
            for (const idx of this.selectedIndices) {
                if (this.mediaItems[idx]) {
                    this.mediaItems[idx].isHidden = e.target.checked;
                }
            }
            this.renderFilmstrip();
        });

        // Tool Tabs
        const tabs = ["tabOverview", "tabFrame", "tabZoom", "tabEffects", "tabTrans", "tabPaint"];
        tabs.forEach((tabId) => {
            const btn = document.getElementById(tabId);
            if (btn) {
                btn.addEventListener("click", () => this.setActiveTab(tabId));
            }
        });

        // Keyboard Shortcuts
        window.addEventListener("keydown", (e) => this.handleKeyDown(e));

        // Window Resizing
        window.addEventListener("resize", () => {
            this.renderMainStage();
        });

        // Pointer-based Horizontal Drag and Reorder Listeners
        window.addEventListener("pointermove", (e) => this.onPointerMove(e));
        window.addEventListener("pointerup", (e) => this.onPointerUp(e));
        window.addEventListener("pointercancel", (e) => this.onPointerUp(e));

        // Movie Playback & Export bindings
        document.getElementById("btnPlayAll")?.addEventListener("click", () => {
            this._playMovieSequence(false); // Play mode
        });
        document.getElementById("btnExportVideo")?.addEventListener("click", () => {
            this._playMovieSequence(true);  // Export mode
        });

    }

    updateDrawerHeight() {
        // Force the drawer to collapse to 44px (hiding thumbnails) when in Paint mode
        if (this.activeTab === "tabPaint") {
            this.drawerEl.style.height = "44px";
        } else {
            this.drawerEl.style.height = this.isExpanded ? "180px" : "44px";
        }
        setTimeout(() => this.renderMainStage(), 210);
    }


    async ingestFiles(files) {
        const validExts = /\.(jpe?g|png|webp|bmp|gif|mp4|webm|mov|mkv|ogg)$/i;
        const validFiles = files.filter(f => validExts.test(f.name) || f.type.startsWith("image/") || f.type.startsWith("video/"));

        if (!validFiles.length) {
            showToast("No supported images or videos found.", "error");
            return;
        }

        const results = await Promise.allSettled(validFiles.map(f => loadMediaFile(f)));
        const successfulItems = [];

        results.forEach((res) => {
            if (res.status === "fulfilled" && res.value) {
                successfulItems.push(res.value);
            }
        });

        if (successfulItems.length > 0) {
            let insertIdx = this.mediaItems.length;

            if (this.selectedIndices.length > 0) {
                const maxSelected = Math.max(...this.selectedIndices);
                if (maxSelected >= 0 && maxSelected < this.mediaItems.length) {
                    insertIdx = maxSelected + 1;
                }
            }

            this.mediaItems.splice(insertIdx, 0, ...successfulItems);
            this.selectedIndices = successfulItems.map((_, i) => insertIdx + i);

            this.renderFilmstrip();
            this.renderMainStage();
            this.ensureVisible(insertIdx);
            showToast(`Inserted ${successfulItems.length} media item${successfulItems.length > 1 ? "s" : ""}`, "success");
        }
    }

    async loadDemoMedia() {
        if (typeof window.loadDemoMedia === "function") {
            await window.loadDemoMedia(this);
        } else if (typeof loadDemoMedia === "function") {
            await loadDemoMedia(this);
        }
    }

    clearTimeline(showNotification = true) {
        this.mediaItems.forEach(item => item.dispose());
        this.mediaItems = [];
        this.selectedIndices = [];
        this.renderFilmstrip();
        this.renderMainStage();
        if (showNotification) {
            showToast("Timeline cleared", "info");
        }
    }


    // ==================================================================
    // MOVIE PREVIEW & EXPORT ENGINE (Continuous Motion Transitions)
    // ==================================================================
    async _playMovieSequence(isExporting = false) {
        const visibleItems = this.mediaItems.filter(item => !item.isHidden);
        if (!visibleItems.length) {
            showToast("Timeline is empty. Add media to preview or export.", "error");
            return;
        }

        // 1. Create Fullscreen Overlay if it doesn't exist
        let overlay = document.getElementById("moviePreviewOverlay");
        let canvas, ctx, lblStatus, btnStop;
        
        if (!overlay) {
            overlay = document.createElement("div");
            overlay.id = "moviePreviewOverlay";
            overlay.className = "fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center";
            overlay.innerHTML = `
                <canvas id="moviePreviewCanvas" width="1920" height="1080" class="max-w-full max-h-full object-contain shadow-2xl"></canvas>
                <div class="absolute top-8 left-1/2 -translate-x-1/2 bg-slate-900/90 text-white px-6 py-2.5 rounded-full border border-slate-700 font-bold flex items-center gap-6 shadow-2xl backdrop-blur-md">
                    <span id="lblMovieStatus" class="text-amber-400">Playing...</span>
                    <div class="w-px h-5 bg-slate-700"></div>
                    <button id="btnStopMovie" class="text-red-400 hover:text-red-300 transition flex items-center gap-1.5">
                        <span class="text-lg leading-none">⏹</span> Stop
                    </button>
                </div>
            `;
            document.body.appendChild(overlay);
        }

        overlay.classList.remove("hidden");
        canvas = document.getElementById("moviePreviewCanvas");
        ctx = canvas.getContext("2d");
        lblStatus = document.getElementById("lblMovieStatus");
        btnStop = document.getElementById("btnStopMovie");
        
        this._stopSequence = false;
        btnStop.onclick = () => { this._stopSequence = true; };

        // 2. Setup MediaRecorder for Export
        let recorder = null;
        let chunks = [];
        
        if (isExporting) {
            lblStatus.textContent = "Initializing Export...";
            try {
                const stream = canvas.captureStream(30);
                recorder = new MediaRecorder(stream, { mimeType: "video/webm;codecs=vp9" });
                
                recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
                recorder.onstop = () => {
                    if (chunks.length === 0) return;
                    const blob = new Blob(chunks, { type: "video/webm" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `VideoStudio_Export_${Date.now()}.webm`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    showToast("Video Export Complete! Check your downloads.", "success");
                };
                recorder.start();
            } catch (err) {
                console.error("MediaRecorder Error:", err);
                showToast("Video export is not supported in this browser.", "error");
                overlay.classList.add("hidden");
                return;
            }
        }

        // Offscreen buffers for transitioning between two moving frames
        const cvsA = document.createElement("canvas");
        cvsA.width = 1920; cvsA.height = 1080;
        const ctxA = cvsA.getContext("2d");

        const cvsB = document.createElement("canvas");
        cvsB.width = 1920; cvsB.height = 1080;
        const ctxB = cvsB.getContext("2d");

        // Helper to render a slide at a specific percentage of its motion path (t)
        const renderSlide = (targetCtx, item, t, cw, ch) => {
            const src = item.getProcessedSource() || item.imgElement;
            if (!src) return;

            const r1 = item.rectStart || [0, 0, item.w, item.h];
            const r2 = item.isZoom ? (item.rectEnd || r1) : r1;
            const a1 = item.rotateStart || 0;
            const a2 = item.isZoom ? (item.rotateEnd || a1) : a1;

            // Extrapolate perfectly even if t > 1.0
            const curX = r1[0] + (r2[0] - r1[0]) * t;
            const curY = r1[1] + (r2[1] - r1[1]) * t;
            const curW = r1[2] + (r2[2] - r1[2]) * t;
            const curH = r1[3] + (r2[3] - r1[3]) * t;
            const curAngle = a1 + (a2 - a1) * t;

            targetCtx.save();
            targetCtx.fillStyle = "#000000";
            targetCtx.fillRect(0, 0, cw, ch);
            targetCtx.translate(cw / 2, ch / 2);
            targetCtx.rotate((-curAngle * Math.PI) / 180);

            const scale = Math.max(cw / curW, ch / curH);
            const renderW = item.w * scale;
            const renderH = item.h * scale;
            const offsetX = -(curX + curW / 2) * scale;
            const offsetY = -(curY + curH / 2) * scale;

            targetCtx.imageSmoothingEnabled = true;
            targetCtx.imageSmoothingQuality = "high";
            targetCtx.drawImage(src, offsetX, offsetY, renderW, renderH);
            targetCtx.restore();
        };

        let slideTimeOffsetMs = 0; // Tracks time already consumed by the previous transition

        // 3. Render Loop (Iterate through slides)
        for (let i = 0; i < visibleItems.length; i++) {
            if (this._stopSequence) break;
            
            const item = visibleItems[i];
            const nextItem = visibleItems[i + 1];

            const durationMs = (item.moveDuration || 5.0) * 1000;
            const transMs = nextItem ? ((item.transDuration || 2.0) * 1000) : 0;
            
            lblStatus.textContent = isExporting 
                ? `Exporting Slide ${i + 1} of ${visibleItems.length}...` 
                : `Playing Slide ${i + 1} of ${visibleItems.length}`;
            
            // Phase 1: Pure Slide 
            // Deduct the time this slide already spent animating during the previous transition
            const phase1Duration = Math.max(0, durationMs - slideTimeOffsetMs);
            let currentItemTimeMs = slideTimeOffsetMs;

            if (phase1Duration > 0) {
                let start = performance.now();
                await new Promise(resolve => {
                    const drawPhase1 = (now) => {
                        if (this._stopSequence) return resolve();
                        
                        const realElapsed = now - start;
                        currentItemTimeMs = slideTimeOffsetMs + realElapsed;
                        
                        // Calculate 't' based on total time, maintaining the exact trajectory
                        const t = currentItemTimeMs / durationMs; 

                        renderSlide(ctx, item, t, canvas.width, canvas.height);
                        
                        if (realElapsed < phase1Duration) requestAnimationFrame(drawPhase1);
                        else {
                            currentItemTimeMs = slideTimeOffsetMs + phase1Duration;
                            resolve();
                        }
                    };
                    requestAnimationFrame(drawPhase1);
                });
            }

            if (this._stopSequence) break;
            if (!nextItem) continue;

            // Phase 2: Transition Window
            lblStatus.textContent = isExporting 
                ? `Transitioning ${i + 1} ➔ ${i + 2}...` 
                : `Transitioning ${i + 1} ➔ ${i + 2}`;

            let startTrans = performance.now();
            const nextDurationMs = (nextItem.moveDuration || 5.0) * 1000;
            const phase2StartTimeMs = currentItemTimeMs;

            await new Promise(resolve => {
                const drawPhase2 = (now) => {
                    if (this._stopSequence) return resolve();
                    
                    const elapsed = now - startTrans;
                    const p = Math.min(1.0, elapsed / transMs); 

                    // Extrapolate current slide's motion past 100%, and start next slide's motion from 0.0
                    currentItemTimeMs = phase2StartTimeMs + elapsed;
                    const tA = currentItemTimeMs / durationMs;
                    const tB = elapsed / nextDurationMs;

                    renderSlide(ctxA, item, tA, canvas.width, canvas.height);
                    renderSlide(ctxB, nextItem, tB, canvas.width, canvas.height);

                    // Hook into the TransEditor to apply the selected mask effect seamlessly
                    const te = this.transEditor;
                    if (te) {
                        const backup = {
                            ctx: te.ctx, canvas: te.canvas, size: te.canvasSize,
                            src: te.srcCanvas, dst: te.dstCanvas, mode: te.mode,
                            prog: te.progress, rot: te.activeRotationIdx, neg: te.maskInverted
                        };

                        te.ctx = ctx;
                        te.canvas = canvas;
                        te.canvasSize = [1920, 1080];
                        te.srcCanvas = cvsA;
                        te.dstCanvas = cvsB;
                        te.progress = p;
                        te.activeRotationIdx = item.transRotation || 0;
                        te.maskInverted = !!item.transNegative;

                        const imgTypes = { "Threshold": "activeThresholdIdx", "Distortion": "activeDistortionIdx", "Spiral": "activeSpiralIdx", "Wave": "activeWaveIdx", "Mosaic": "activeMosaicIdx", "Picture": "activePictholdIdx" };
                        if (imgTypes[item.transType]) {
                            te.mode = `Type-${item.transType}`;
                            te[imgTypes[item.transType]] = parseInt(item.transItem, 10) || 0;
                        } else {
                            te.mode = `${item.transSubtype}-${item.transItem}`;
                        }

                        te.renderCanvas();
                        Object.assign(te, backup);
                    } else {
                        // Fallback crossfade
                        ctx.globalAlpha = 1.0;
                        ctx.drawImage(cvsA, 0, 0);
                        ctx.globalAlpha = p;
                        ctx.drawImage(cvsB, 0, 0);
                        ctx.globalAlpha = 1.0;
                    }

                    if (elapsed < transMs) requestAnimationFrame(drawPhase2);
                    else resolve();
                };
                requestAnimationFrame(drawPhase2);
            });
            
            // Pass the consumed transition time to the next loop iteration
            slideTimeOffsetMs = transMs;
        }
        
        // 4. Cleanup & Stop Recording
        if (recorder && recorder.state !== "inactive") {
            lblStatus.textContent = "Processing Video File...";
            recorder.stop();
        }
        
        overlay.classList.add("hidden");
        if (!isExporting && !this._stopSequence) showToast("Playback Finished", "success");
    }





    selectSlide(index, multi = false, range = false) {
        if (index < 0 || index >= this.mediaItems.length) return;

        if (range && this.selectedIndices.length > 0) {
            const last = this.selectedIndices[this.selectedIndices.length - 1];
            const start = Math.min(last, index);
            const end = Math.max(last, index);
            this.selectedIndices = [];
            for (let i = start; i <= end; i++) this.selectedIndices.push(i);
        } else if (multi) {
            const existing = this.selectedIndices.indexOf(index);
            if (existing !== -1) {
                if (this.selectedIndices.length > 1) this.selectedIndices.splice(existing, 1);
            } else {
                this.selectedIndices.push(index);
            }
        } else {
            this.selectedIndices = [index];
        }

        const primaryIdx = this.selectedIndices[this.selectedIndices.length - 1];
        const primary = this.mediaItems[primaryIdx];
        if (primary) {
            document.getElementById("chkHideSlide").checked = primary.isHidden;
        }

        this.renderFilmstrip();
        this.renderMainStage();
    }

    moveSelection(delta) {
        if (!this.selectedIndices.length) return;

        const firstPositions = new Map();
        Array.from(this.trackEl.children).forEach((cardEl, idx) => {
            if (this.mediaItems[idx]) {
                firstPositions.set(this.mediaItems[idx].id, cardEl.getBoundingClientRect().left);
            }
        });

        if (delta === -1) {
            const sorted = [...this.selectedIndices].sort((a, b) => a - b);
            if (sorted[0] === 0) return;
            const newSelection = [];
            for (const idx of sorted) {
                const [item] = this.mediaItems.splice(idx, 1);
                this.mediaItems.splice(idx - 1, 0, item);
                newSelection.push(idx - 1);
            }
            this.selectedIndices = newSelection;
        } else if (delta === 1) {
            const sorted = [...this.selectedIndices].sort((a, b) => b - a);
            if (sorted[0] === this.mediaItems.length - 1) return;
            const newSelection = [];
            for (const idx of sorted) {
                const [item] = this.mediaItems.splice(idx, 1);
                this.mediaItems.splice(idx + 1, 0, item);
                newSelection.push(idx + 1);
            }
            this.selectedIndices = newSelection.sort((a, b) => a - b);
        }

        this.renderFilmstrip();
        this.renderMainStage();
        this.ensureVisible(this.selectedIndices[0]);

        Array.from(this.trackEl.children).forEach((cardEl, idx) => {
            const item = this.mediaItems[idx];
            if (!item) return;
            const oldLeft = firstPositions.get(item.id);
            if (oldLeft !== undefined) {
                const newLeft = cardEl.getBoundingClientRect().left;
                const deltaX = oldLeft - newLeft;
                if (deltaX !== 0) {
                    cardEl.style.transition = "none";
                    cardEl.style.transform = `translateX(${deltaX}px)`;
                    void cardEl.offsetWidth;

                    cardEl.style.transition = "transform 240ms cubic-bezier(0.25, 1, 0.5, 1)";
                    cardEl.style.transform = "translateX(0px)";

                    const onEnd = () => {
                        cardEl.style.transition = "";
                        cardEl.style.transform = "";
                        cardEl.removeEventListener("transitionend", onEnd);
                    };
                    cardEl.addEventListener("transitionend", onEnd);
                }
            }
        });
    }

    ensureVisible(index) {
        if (this.trackEl.children[index]) {
            this.trackEl.children[index].scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
        }
    }

    onCardPointerDown(e, idx, cardEl) {
        if (e.button !== 0) return;

        this.dragCandidateIdx = idx;
        const slideBox = cardEl.querySelector(".slide-box") || cardEl;
        const rect = slideBox.getBoundingClientRect();
        this.dragGrabOffsetX = e.clientX - rect.left;

        if (!this.selectedIndices.includes(idx)) {
            if (!e.ctrlKey && !e.metaKey && !e.shiftKey) {
                this.selectedIndices = [idx];
                this.renderFilmstrip();
            }
        }

        this.movingIndices = [...this.selectedIndices].sort((a, b) => a - b);
    }

    onPointerMove(e) {
        if (this.dragCandidateIdx === null) return;

        if (!this.isDragging) {
            this.isDragging = true;
            this.startHorizontalDrag(e);
        }

        if (this.isDragging) {
            this.updateHorizontalGhost(e.clientX);
            this.updateDropSpacer(e.clientX);
            this.updateAutoScroll(e.clientX);
        }
    }

    startHorizontalDrag(e) {
        document.body.style.cursor = "grabbing";

        const primaryIdx = this.dragCandidateIdx;
        const item = this.mediaItems[primaryIdx];
        const cardEl = this.trackEl.children[primaryIdx];
        if (!item || !cardEl) return;

        const slideBox = cardEl.querySelector(".slide-box") || cardEl;
        const cardRect = slideBox.getBoundingClientRect();
        const drawerRect = this.drawerEl.getBoundingClientRect();
        const restingTop = cardRect.top - drawerRect.top;
        this.dragYPosition = restingTop;

        const ghostW = Math.round(cardRect.width) || 150;
        const ghostH = Math.round(cardRect.height) || 120;

        const ghost = document.createElement("div");
        ghost.id = "filmstripDragGhost";
        ghost.className = "absolute pointer-events-none z-50 rounded-lg overflow-hidden border-2 border-amber-400 ring-4 ring-amber-500/40 shadow-2xl opacity-95 transition-none bg-[#070b14] flex flex-col";
        ghost.style.width = `${ghostW}px`;
        ghost.style.height = `${ghostH}px`;
        ghost.style.top = `${this.dragYPosition}px`;

        if (item.thumbUrl) {
            const ghostImg = document.createElement("img");
            ghostImg.src = item.thumbUrl;
            ghostImg.className = "w-full flex-1 object-contain block";
            ghost.appendChild(ghostImg);
        } else {
            ghost.classList.add("bg-slate-800");
        }

        if (this.movingIndices.length > 1) {
            const badge = document.createElement("div");
            badge.className = "absolute top-1.5 right-1.5 bg-blue-600 text-white font-bold text-[11px] px-2 py-0.5 rounded-full shadow-lg border border-blue-400";
            badge.textContent = `${this.movingIndices.length} slides`;
            ghost.appendChild(badge);
        }

        this.drawerEl.appendChild(ghost);
        this.ghostEl = ghost;

        const spacer = document.createElement("div");
        spacer.id = "dragDropSpacer";
        spacer.className = "shrink-0 rounded-lg border-2 border-dashed border-blue-400 bg-blue-500/15 transition-all duration-150";
        spacer.style.width = `${ghostW * this.movingIndices.length}px`;
        spacer.style.height = `${ghostH}px`;
        this.spacerEl = spacer;

        this.movingIndices.forEach((i) => {
            if (this.trackEl.children[i]) {
                this.trackEl.children[i].classList.add("opacity-20", "scale-95");
            }
        });

        this.currentDropIdx = primaryIdx;
        this.updateHorizontalGhost(e.clientX);
        this.startAutoScrollLoop();
    }

    updateHorizontalGhost(clientX) {
        if (!this.ghostEl) return;
        const drawerRect = this.drawerEl.getBoundingClientRect();
        const ghostX = clientX - drawerRect.left - this.dragGrabOffsetX;
        this.ghostEl.style.left = `${ghostX}px`;
    }

    updateDropSpacer(clientX) {
        if (!this.spacerEl) return;

        const visibleCards = Array.from(this.trackEl.querySelectorAll(".filmstrip-card"));
        let targetIdx = this.mediaItems.length;

        for (let i = 0; i < visibleCards.length; i++) {
            const card = visibleCards[i];
            const rect = card.getBoundingClientRect();
            const midpoint = rect.left + rect.width / 2;

            if (clientX < midpoint) {
                targetIdx = i;
                break;
            }
        }

        if (this.currentDropIdx !== targetIdx) {
            this.currentDropIdx = targetIdx;
            if (targetIdx >= visibleCards.length) {
                this.trackEl.appendChild(this.spacerEl);
            } else {
                this.trackEl.insertBefore(this.spacerEl, visibleCards[targetIdx]);
            }
        }
    }

    updateAutoScroll(clientX) {
        const rect = this.trackEl.getBoundingClientRect();
        const edgeZone = 45;
        const speed = 14;

        if (clientX < rect.left + edgeZone) {
            this.scrollVelocity = -speed;
        } else if (clientX > rect.right - edgeZone) {
            this.scrollVelocity = speed;
        } else {
            this.scrollVelocity = 0;
        }
    }

    startAutoScrollLoop() {
        if (this.scrollRafId) return;
        const step = () => {
            if (this.isDragging) {
                if (this.scrollVelocity !== 0) {
                    this.trackEl.scrollLeft += this.scrollVelocity;
                }
                this.scrollRafId = requestAnimationFrame(step);
            } else {
                this.scrollRafId = null;
            }
        };
        this.scrollRafId = requestAnimationFrame(step);
    }

    onPointerUp(e) {
        document.body.style.cursor = "default";
        this.scrollVelocity = 0;

        if (this.isDragging) {
            this.isDragging = false;

            if (this.ghostEl) {
                this.ghostEl.remove();
                this.ghostEl = null;
            }
            if (this.spacerEl) {
                this.spacerEl.remove();
                this.spacerEl = null;
            }

            if (this.currentDropIdx !== null && this.movingIndices.length > 0) {
                const movingItems = this.movingIndices.map(i => this.mediaItems[i]);
                const numBefore = this.movingIndices.filter(i => i < this.currentDropIdx).length;
                let insertIdx = this.currentDropIdx - numBefore;
                insertIdx = Math.max(0, Math.min(insertIdx, this.mediaItems.length - movingItems.length));

                this.mediaItems = this.mediaItems.filter(item => !movingItems.includes(item));
                this.mediaItems.splice(insertIdx, 0, ...movingItems);

                this.selectedIndices = [];
                for (let i = 0; i < movingItems.length; i++) {
                    this.selectedIndices.push(insertIdx + i);
                }
            }

            this.dragCandidateIdx = null;
            this.movingIndices = [];
            this.currentDropIdx = null;

            this.renderFilmstrip();
            this.renderMainStage();
        } else if (this.dragCandidateIdx !== null) {
            this.selectSlide(this.dragCandidateIdx, e.ctrlKey || e.metaKey, e.shiftKey);
            this.dragCandidateIdx = null;
        }
    }

    setActiveTab(tabId) {
        this.activeTab = tabId;
        const tabs = ["tabOverview", "tabFrame", "tabZoom", "tabEffects", "tabTrans", "tabPaint"];
        tabs.forEach((id) => {
            const btn = document.getElementById(id);
            if (!btn) return;
            if (id === tabId) {
                btn.className = "tab-btn px-2.5 py-1 rounded font-semibold bg-blue-600 text-white shadow";
            } else {
                btn.className = "tab-btn px-2.5 py-1 rounded font-medium bg-slate-800 hover:bg-slate-700 text-slate-300";
            }
        });
        
        // Trigger drawer height recalculation immediately when tabs change
        this.updateDrawerHeight();
        this.renderMainStage();
    }

    updateZoomFramesVisibility() {
        const primaryIdx = this.selectedIndices[this.selectedIndices.length - 1];
        const item = this.mediaItems[primaryIdx];
        const allowZoom = item ? item.isZoom : true;

        if (allowZoom) {
            this.zoomWrapper.className = "flex-1 w-full grid grid-cols-2 gap-3 min-h-0";
            this.zoomEndContainer.classList.remove("hidden");
        } else {
            this.zoomWrapper.className = "flex-1 w-full grid grid-cols-1 gap-3 min-h-0";
            this.zoomEndContainer.classList.add("hidden");
        }

        this.resizeZoomCanvases();
        this.startEditor.render();
        if (allowZoom) this.endEditor.render();
    }

    resizeZoomCanvases() {
        const primaryIdx = this.selectedIndices[this.selectedIndices.length - 1];
        const item = this.mediaItems[primaryIdx];
        if (!item) return;

        const container1 = this.startCanvas.parentElement;
        if (container1) {
            this.startCanvas.width = container1.clientWidth - 8;
            this.startCanvas.height = container1.clientHeight - 8;
        }

        const container2 = this.endCanvas.parentElement;
        if (container2) {
            this.endCanvas.width = container2.clientWidth - 8;
            this.endCanvas.height = container2.clientHeight - 8;
        }
    }

    applyRandomZoomMotion() {
        for (const itm of this.getSelectedItems()) {
            itm.applyRandomZoom();
        }

        this.startEditor.render();
        this.endEditor.render();
        showToast("Applied random Ken Burns pan & zoom to selected slide(s)", "info");
    }

    startKenBurnsPreview() {
        const primaryIdx = this.selectedIndices[this.selectedIndices.length - 1];
        const item = this.mediaItems[primaryIdx];
        if (!item || !item.imgElement) return;

        this.previewOverlay.classList.remove("hidden");
        const stageW = this.stageEl.clientWidth;
        const stageH = this.stageEl.clientHeight;

        let drawW = Math.min(1920, stageW - 32);
        let drawH = Math.round(drawW / (1920 / 1080));
        if (drawH > stageH - 32) {
            drawH = stageH - 32;
            drawW = Math.round(drawH * (1920 / 1080));
        }

        this.previewCanvas.width = drawW;
        this.previewCanvas.height = drawH;

        const duration = Math.max(0.1, item.moveDuration);
        const startTime = performance.now();
        const sourceToDraw = item.getProcessedSource() || item.imgElement;

        const step = (now) => {
            const elapsed = (now - startTime) / 1000;
            const t = Math.min(1.0, elapsed / duration);

            const r1 = item.rectStart;
            const r2 = item.isZoom ? item.rectEnd : item.rectStart;
            const a1 = item.rotateStart;
            const a2 = item.isZoom ? item.rotateEnd : item.rotateStart;

            const curX = r1[0] + (r2[0] - r1[0]) * t;
            const curY = r1[1] + (r2[1] - r1[1]) * t;
            const curW = r1[2] + (r2[2] - r1[2]) * t;
            const curH = r1[3] + (r2[3] - r1[3]) * t;
            const curAngle = a1 + (a2 - a1) * t;

            const ctx = this.previewCtx;
            ctx.fillStyle = "#000000";
            ctx.fillRect(0, 0, drawW, drawH);

            ctx.save();
            ctx.translate(drawW / 2, drawH / 2);
            ctx.rotate((-curAngle * Math.PI) / 180);

            const scale = Math.max(drawW / curW, drawH / curH);
            const renderW = item.w * scale;
            const renderH = item.h * scale;
            const offsetX = -(curX + curW / 2) * scale;
            const offsetY = -(curY + curH / 2) * scale;

            ctx.drawImage(sourceToDraw, offsetX, offsetY, renderW, renderH);
            ctx.restore();

            document.getElementById("lblPreviewProgress").textContent = `Cinematic Pan Preview: ${Math.round(t * 100)}%`;

            if (t < 1.0) {
                this.previewRafId = requestAnimationFrame(step);
            } else {
                setTimeout(() => this.stopKenBurnsPreview(), 300);
            }
        };

        this.previewRafId = requestAnimationFrame(step);
    }

    stopKenBurnsPreview() {
        if (this.previewRafId) {
            cancelAnimationFrame(this.previewRafId);
            this.previewRafId = null;
        }
        this.previewOverlay.classList.add("hidden");
    }

    // ==================================================================
    // FILMSTRIP RENDERING (Thumbnails + Index & Name + Cyan Duration)
    // ==================================================================
    renderFilmstrip() {
        this.trackEl.innerHTML = "";

        const selCount = this.selectedIndices.length;
        const lblCount = document.getElementById("lblSelectionCount");
        if (lblCount) {
            lblCount.textContent = selCount > 1 
                ? `${selCount} of ${this.mediaItems.length} slides selected` 
                : `${this.mediaItems.length} slide${this.mediaItems.length === 1 ? "" : "s"}`;
        }

        const sortedSel = [...this.selectedIndices].sort((a, b) => a - b);
        const minSel = sortedSel[0];
        const maxSel = sortedSel[sortedSel.length - 1];

        document.getElementById("btnMoveLeft").disabled = !(minSel > 0);
        document.getElementById("btnMoveRight").disabled = !(maxSel < this.mediaItems.length - 1);

        this.mediaItems.forEach((item, idx) => {
            const isSelected = this.selectedIndices.includes(idx);
            const aspect = item.aspectRatio || (item.w / item.h) || (16 / 9);

            const thumbH = 96;
            const thumbW = Math.max(68, Math.min(240, Math.round(thumbH * aspect)));

            // Outer unit for this slide slot (relative positioning anchor)
            const unit = document.createElement("div");
            unit.className = `filmstrip-card relative flex flex-col shrink-0 cursor-pointer select-none transition-transform duration-100 ease-out ${
                isSelected ? "-translate-y-0.5 z-10" : "translate-y-0"
            } ${item.isHidden ? "opacity-35" : "opacity-100"}`;
            unit.style.width = `${thumbW}px`;

            // Thumbnail Frame
            const thumbFrame = document.createElement("div");
            thumbFrame.className = `relative rounded-lg overflow-hidden border-2 transition-all duration-100 ease-out bg-[#070b14] ${
                isSelected
                    ? "border-amber-400 ring-2 ring-amber-400/50 shadow-lg"
                    : "border-slate-700 hover:border-slate-500"
            }`;
            thumbFrame.style.width = `${thumbW}px`;
            thumbFrame.style.height = `${thumbH}px`;

            if (item.thumbUrl) {
                const img = document.createElement("img");
                img.src = item.thumbUrl;
                img.alt = item.title;
                img.className = "w-full h-full object-contain block pointer-events-none select-none";
                thumbFrame.appendChild(img);
            }

            if (item.isVideo) {
                const videoBadge = document.createElement("div");
                videoBadge.className = "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-2 py-0.5 rounded bg-black/85 border border-slate-700 text-[10px] text-cyan-400 font-bold tracking-wide pointer-events-none shadow";
                videoBadge.textContent = `▶ ${item.videoDuration}`;
                thumbFrame.appendChild(videoBadge);
            }

            unit.appendChild(thumbFrame);

            // Text Below Thumbnail: Index + Image Name on Left, Move Duration on Right
            const infoRow = document.createElement("div");
            infoRow.className = "flex items-center justify-between px-1 pt-1 text-[11px] pointer-events-none gap-1 min-w-0";
            infoRow.innerHTML = `
                <div class="flex items-baseline gap-1 min-w-0 flex-1 truncate">
                    <span class="${isSelected ? "text-amber-400 font-bold" : "text-slate-400"} text-[11px] shrink-0">#${idx + 1}</span>
                    <span class="${isSelected ? "text-slate-200" : "text-slate-400"} text-[9.5px] font-medium truncate" title="${item.title}">${item.title}</span>
                </div>
                <span class="${isSelected ? "text-amber-400 font-bold" : "text-cyan-400 font-bold"} text-[11px] shrink-0 ml-1">${item.moveDuration}s</span>
            `;
            unit.appendChild(infoRow);

            // Centered Transition Badge (Overlaps the boundary between current and next thumbnail)
            if (idx < this.mediaItems.length - 1) {
                const transBadge = document.createElement("div");
                transBadge.className = "absolute z-20 px-1.5 py-0.5 rounded-full bg-slate-900/95 border border-slate-700/90 text-[9.5px] font-semibold text-slate-300 shadow-md backdrop-blur-sm pointer-events-none select-none whitespace-nowrap";
                transBadge.style.left = "calc(100% + 4px)";
                transBadge.style.top = `${Math.round(thumbH / 2)}px`;
                transBadge.style.transform = "translate(-50%, -50%)";
                transBadge.textContent = `${item.transDuration}s`;
                unit.appendChild(transBadge);
            }

            unit.addEventListener("pointerdown", (e) => this.onCardPointerDown(e, idx, unit));
            this.trackEl.appendChild(unit);
        });
    }



    renderMainStage() {
        const primaryIdx = this.selectedIndices[this.selectedIndices.length - 1];
        const item = this.mediaItems[primaryIdx];

if (this.paintStage) this.paintStage.classList.add("hidden");

        // 1. Hide all stages first (and stop transition timer if leaving tabTrans)
        this.overviewStage.classList.add("hidden");
        this.zoomStage.classList.add("hidden");
        if (this.frameStage) this.frameStage.classList.add("hidden");
        if (this.effectsStage) this.effectsStage.classList.add("hidden");
        if (this.transStage) {
            this.transStage.classList.add("hidden");
            if (this.transEditor && this.activeTab !== "tabTrans") {
                this.transEditor.stopAnimation();
            }
        }

        if (this.activeTab === "tabPaint" && this.paintStage && this.paintEditor) {
            this.paintStage.classList.remove("hidden");
            if (!item) return;
            this.paintEditor.syncWithActiveItem();
            return;
        }

        // 2. Route to the active tab
        if (this.activeTab === "tabZoom") {
            this.zoomStage.classList.remove("hidden");
            if (!item) return;

            document.getElementById("zoomDurationSlider").value = Math.round(item.moveDuration * 10);
            document.getElementById("lblZoomDuration").textContent = `${item.moveDuration.toFixed(1)}s`;
            document.getElementById("chkAllowZoom").checked = item.isZoom;
            document.getElementById("chkLockBoundingBox").checked = item.isLock;

            this.updateZoomFramesVisibility();
            return;
        }


        if (this.activeTab === "tabFrame" && this.frameStage && this.frameEditor) {
            this.frameStage.classList.remove("hidden");
            if (!item) return;
            this.frameEditor.syncWithActiveItem();
            return;
        }

        if (this.activeTab === "tabEffects" && this.effectsStage && this.effectsEditor) {
            this.effectsStage.classList.remove("hidden");
            if (!item) return;
            this.effectsEditor.syncWithActiveItem();
            return;
        }

        if (this.activeTab === "tabTrans" && this.transStage && this.transEditor) {
            this.transStage.classList.remove("hidden");
            if (!item) return;
            this.transEditor.syncWithActiveItem();
            return;
        }

        // 3. Default: Overview Mode
        this.overviewStage.classList.remove("hidden");

        const hud = document.getElementById("stageHud");
        const stageW = this.stageEl.clientWidth;
        const stageH = this.stageEl.clientHeight;

        if (stageW <= 0 || stageH <= 0) return;

        if (!item || !item.imgElement) {
            hud.classList.add("hidden");
            this.canvas.width = Math.min(800, stageW - 32);
            this.canvas.height = Math.min(500, stageH - 32);

            this.ctx.fillStyle = "#0f172a";
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            this.ctx.strokeStyle = "#334155";
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(10, 10, this.canvas.width - 20, this.canvas.height - 20);

            this.ctx.fillStyle = "#94a3b8";
            this.ctx.font = "bold 16px Inter, sans-serif";
            this.ctx.textAlign = "center";
            this.ctx.fillText("Drop Images or Videos Here to Begin", this.canvas.width / 2, this.canvas.height / 2 - 8);
            this.ctx.font = "500 12px Inter, sans-serif";
            this.ctx.fillStyle = "#64748b";
            this.ctx.fillText("Click 'Add Media' or 'Load Demo' in the top toolbar", this.canvas.width / 2, this.canvas.height / 2 + 18);
            return;
        }

        const sourceToDraw = item.getProcessedSource() || item.imgElement;
        const srcW = sourceToDraw.naturalWidth || sourceToDraw.width || item.w;
        const srcH = sourceToDraw.naturalHeight || sourceToDraw.height || item.h;

        hud.classList.remove("hidden");
        document.getElementById("lblHudSlideTitle").textContent = `#${primaryIdx + 1} — ${item.filename}`;
        document.getElementById("lblHudResolution").textContent = `${srcW} × ${srcH} px`;
        document.getElementById("lblHudDuration").textContent = `Duration: ${item.moveDuration}s`;

        const pad = 24;
        const maxW = Math.max(100, stageW - pad);
        const maxH = Math.max(100, stageH - pad);

        const imgAspect = srcW / srcH;
        let drawW = maxW;
        let drawH = drawW / imgAspect;

        if (drawH > maxH) {
            drawH = maxH;
            drawW = drawH * imgAspect;
        }

        drawW = Math.round(drawW);
        drawH = Math.round(drawH);

        this.canvas.width = drawW;
        this.canvas.height = drawH;

        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = "high";
        this.ctx.drawImage(sourceToDraw, 0, 0, srcW, srcH, 0, 0, drawW, drawH);
    }


    handleKeyDown(e) {
        if (["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName)) return;

        if (this.previewRafId) {
            this.stopKenBurnsPreview();
            return;
        }

        // Forward Paint-specific keyboard shortcuts (Undo, Redo, Delete Shape, Boolean Ops)
        if (this.activeTab === "tabPaint" && this.paintEditor) {
            if (this.paintEditor.handleKeyDown(e)) return;
        }

        // Ctrl+A / Cmd+A Select All
        if ((e.ctrlKey || e.metaKey) && (e.key === "a" || e.key === "A")) {
            e.preventDefault();
            this.selectedIndices = this.mediaItems.map((_, i) => i);
            this.renderFilmstrip();
            this.renderMainStage();
            showToast(`Selected all ${this.mediaItems.length} slides`, "info");
            return;
        }

        const primaryIdx = this.selectedIndices[this.selectedIndices.length - 1];
        if (primaryIdx === undefined) return;

        if (e.key === " " && this.activeTab === "tabZoom") {
            e.preventDefault();
            this.startKenBurnsPreview();
            return;
        }

        if (e.ctrlKey || e.metaKey) {
            if (e.key === "ArrowLeft") {
                e.preventDefault();
                this.moveSelection(-1);
                return;
            } else if (e.key === "ArrowRight") {
                e.preventDefault();
                this.moveSelection(1);
                return;
            }
        }

        if (e.key === "ArrowLeft") {
            e.preventDefault();
            this.selectSlide(primaryIdx - 1);
        } else if (e.key === "ArrowRight") {
            e.preventDefault();
            this.selectSlide(primaryIdx + 1);
        } else if (e.key === "Delete" || e.key === "Backspace") {
            e.preventDefault();
            const sorted = [...this.selectedIndices].sort((a, b) => b - a);
            for (const idx of sorted) {
                const [removed] = this.mediaItems.splice(idx, 1);
                if (removed) removed.dispose();
            }
            this.selectedIndices = this.mediaItems.length > 0 ? [Math.min(sorted[sorted.length - 1], this.mediaItems.length - 1)] : [];
            this.renderFilmstrip();
            this.renderMainStage();
            showToast(`Removed ${sorted.length} slide${sorted.length > 1 ? "s" : ""}`, "info");
        }
    }
}

// Global window assignments
window.MediaItem = MediaItem;
window.showToast = showToast;

window.onload = function () {
    window.videoStudioApp = new VideoStudioApp();
};
