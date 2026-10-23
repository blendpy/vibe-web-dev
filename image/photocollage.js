"use strict";

// ======================================================================
// UTILITY: Toast Notifications (No alert() or confirm())
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
    toast.className = `pointer-events-auto px-4 py-2.5 rounded-xl shadow-lg border text-xs sm:text-sm font-medium transition-all duration-300 transform translate-y-0 opacity-100 ${colors[type] || colors.info}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateY(-8px)";
        setTimeout(() => toast.remove(), 300);
    }, 3200);
}

function colorNameToHex(colorStr) {
    if (!colorStr) return "#000000";
    if (colorStr.startsWith("#") && (colorStr.length === 7 || colorStr.length === 4)) {
        return colorStr;
    }
    const ctx = document.createElement("canvas").getContext("2d");
    ctx.fillStyle = colorStr;
    return ctx.fillStyle;
}

// ======================================================================
// PHASE 1: COLLAGE CORE STRUCTURES
// ======================================================================

class Photo {
    constructor(filename, w, h, orientation = 0, imgElement = null, isVideo = false) {
        this.filename = filename;
        this.w = w;
        this.h = h;
        this.orientation = orientation;
        this.offset_w = 0.5;
        this.offset_h = 0.5;
        this.imgElement = imgElement;
        this.isVideo = isVideo;
    }

    get ratio() {
        return this.h / this.w;
    }

    move(x, y) {
        this.offset_w = Photo.calculate_new_offset(this.offset_w, x);
        this.offset_h = Photo.calculate_new_offset(this.offset_h, y);
    }

    static calculate_new_offset(offset, value) {
        let new_offset = offset + value;
        if (new_offset < 0) new_offset = 0;
        else if (new_offset > 1) new_offset = 1;
        return new_offset;
    }

    clone() {
        const copy = new Photo(this.filename, this.w, this.h, this.orientation, this.imgElement, this.isVideo);
        copy.offset_w = this.offset_w;
        copy.offset_h = this.offset_h;
        return copy;
    }
}

class Cell {
    constructor(parents, photo) {
        if (!parents) return;
        this.parents = parents;
        this.photo = photo;
        this.extent = null;
        this.is_manual = false;
        this.h = this.w * this.wanted_ratio;
        this.rand_dx = (Math.random() * 2) - 1;
        this.rand_dy = (Math.random() * 2) - 1;
        this.rand_z = Math.random();
    }

    get x() {
        return this.parents[0].x;
    }

    get y() {
        let prev = null;
        for (const c of this.parents[0].cells) {
            if (this === c) {
                if (prev) return prev.y + prev.h;
                return 0;
            }
            prev = c;
        }
        return 0;
    }

    get w() {
        return this.parents.reduce((sum, c) => sum + c.w, 0);
    }

    set w(value) {
        this._w = value;
    }

    get ratio() {
        return this.h / this.w;
    }

    get wanted_ratio() {
        return this.photo.ratio;
    }

    scale(alpha) {
        this.h *= alpha;
    }

    is_extended() {
        return this.extent !== null && this.extent !== undefined;
    }

    is_extension() {
        return false;
    }

    content_coords() {
        if (this.wanted_ratio < this.ratio) {
            const h = this.h;
            const w = this.h / this.wanted_ratio;
            const y = this.y;
            const x = this.x - (w - this.w) / 2.0;
            return [x, y, w, h];
        } else if (this.wanted_ratio > this.ratio) {
            const w = this.w;
            const h = this.w * this.wanted_ratio;
            const x = this.x;
            const y = this.y - (h - this.h) / 2.0;
            return [x, y, w, h];
        } else {
            return [this.x, this.y, this.w, this.h];
        }
    }

    top_neighbor() {
        let prev = null;
        for (const c of this.parents[0].cells) {
            if (this === c) return prev;
            prev = c;
        }
        return null;
    }

    bottom_neighbor() {
        let prev = null;
        const cells = this.parents[0].cells;
        for (let i = cells.length - 1; i >= 0; i--) {
            const c = cells[i];
            if (this === c) return prev;
            prev = c;
        }
        return null;
    }
}

class CellExtent extends Cell {
    constructor(cell) {
        super(null, null);
        this.origin = cell;
        this.origin.extent = this;
    }

    get parents() {
        return [this.origin.parents[1]];
    }

    set parents(val) {}

    get photo() {
        return this.origin.photo;
    }

    set photo(val) {
        this.origin.photo = val;
    }

    get y() {
        return this.origin.y;
    }

    get h() {
        return this.origin.h;
    }

    set h(val) {
        this.origin.h = val;
    }

    is_extension() {
        return true;
    }

    scale(alpha) {}
}

class Column {
    constructor(parent, w) {
        this.parent = parent;
        this.cells = [];
        this.w = w;
    }

    get h() {
        if (!this.cells.length) return 0;
        const last = this.cells[this.cells.length - 1];
        return last.y + last.h;
    }

    get x() {
        let x = 0;
        for (const c of this.parent.cols) {
            if (this === c) break;
            x += c.w;
        }
        return x;
    }

    scale(alpha) {
        this.w *= alpha;
        for (const c of this.cells) {
            c.scale(alpha);
        }
    }

    left_neighbor() {
        let prev = null;
        for (const c of this.parent.cols) {
            if (this === c) return prev;
            prev = c;
        }
        return null;
    }

    right_neighbor() {
        let prev = null;
        const cols = this.parent.cols;
        for (let i = cols.length - 1; i >= 0; i--) {
            const c = cols[i];
            if (this === c) return prev;
            prev = c;
        }
        return null;
    }

    adjust_height(target_h) {
        class Group {
            constructor(y) {
                this.y = y;
                this.h = 0;
                this.cells = [];
            }
        }

        const groups = [new Group(0)];
        for (const c of this.cells) {
            if (!c.is_extension()) {
                groups[groups.length - 1].cells.push(c);
            } else {
                groups[groups.length - 1].h = c.y - groups[groups.length - 1].y;
                groups.push(new Group(c.y + c.h));
            }
        }
        groups[groups.length - 1].h = target_h - groups[groups.length - 1].y;

        for (const group of groups) {
            if (!group.cells.length) continue;

            const auto_cells = group.cells.filter(c => !c.is_manual);
            const manual_cells = group.cells.filter(c => c.is_manual);

            const used_h = manual_cells.reduce((sum, c) => sum + c.h, 0);
            const remaining_h = group.h - used_h;

            if (!auto_cells.length) {
                if (used_h > 0 && group.h > 0 && Math.abs(used_h - group.h) > 0.5) {
                    const alpha = group.h / used_h;
                    for (const c of manual_cells) {
                        c.h *= alpha;
                    }
                }
                continue;
            }

            const total_auto_h = auto_cells.reduce((sum, c) => sum + c.h, 0);
            if (total_auto_h > 0 && remaining_h > 0) {
                const alpha = remaining_h / total_auto_h;
                for (const c of auto_cells) {
                    c.h = c.h * alpha;
                }
            }
        }
    }
}

class Page {
    constructor(w, target_ratio, no_cols) {
        this.target_ratio = target_ratio;
        const safeCols = Math.max(1, no_cols);
        const col_w = w / safeCols;
        this.cols = [];
        for (let i = 0; i < safeCols; i++) {
            this.cols.push(new Column(this, col_w));
        }
    }

    get no_cols() {
        return this.cols.length;
    }

    get w() {
        return this.cols.reduce((sum, c) => sum + c.w, 0);
    }

    get h() {
        if (!this.cols.length) return 0;
        return Math.max(...this.cols.map(c => c.h));
    }

    get ratio() {
        return this.h / this.w;
    }

    scale(alpha) {
        for (const c of this.cols) {
            c.scale(alpha);
        }
    }

    scale_to_fit(max_w, max_h = null) {
        if (this.w <= 0 || this.h <= 0) return;
        if (max_h === null || this.w * max_h > this.h * max_w) {
            this.scale(max_w / this.w);
        } else {
            this.scale(max_h / this.h);
        }
    }

    next_free_col() {
        const minimum = Math.min(...this.cols.map(c => c.h));
        const candidates = this.cols.filter(c => Math.abs(c.h - minimum) < 1e-9);
        return candidates[Math.floor(Math.random() * candidates.length)] || this.cols[0];
    }

    add_cell_single_col(col, photo) {
        col.cells.push(new Cell([col], photo));
    }

    add_cell_multi_col(col1, col2, photo) {
        const cell = new Cell([col1, col2], photo);
        const extent = new CellExtent(cell);
        col1.cells.push(cell);
        col2.cells.push(extent);
    }

    add_cell(photo) {
        const col = this.next_free_col();
        const left = col.left_neighbor();
        const right = col.right_neighbor();
        if (2 * Math.random() > photo.ratio) {
            if (left && Math.abs(col.h - left.h) < 0.5 * col.w) {
                return this.add_cell_multi_col(left, col, photo);
            } else if (right && Math.abs(col.h - right.h) < 0.5 * col.w) {
                return this.add_cell_multi_col(col, right, photo);
            }
        }
        this.add_cell_single_col(col, photo);
    }

    remove_empty_cols() {
        this.cols = this.cols.filter(col => col.cells.length > 0);
    }

    remove_bottom_holes() {
        for (const col of this.cols) {
            if (!col.cells.length) continue;
            const cell = col.cells[col.cells.length - 1];
            if (cell === col.cells[0]) continue;

            const top = cell.top_neighbor();
            if (!top) continue;

            if (!cell.is_extended() && !cell.is_extension()) {
                if (top.is_extended() && top.extent.bottom_neighbor() === null && col.right_neighbor()) {
                    const extent = new CellExtent(cell);
                    col.right_neighbor().cells.push(extent);
                    cell.parents = [col, col.right_neighbor()];
                } else if (top.is_extension() && top.origin.bottom_neighbor() === null && col.left_neighbor()) {
                    const idx = col.cells.indexOf(cell);
                    if (idx !== -1) col.cells.splice(idx, 1);
                    col.left_neighbor().cells.push(cell);
                    const extent = new CellExtent(cell);
                    col.cells.push(extent);
                    cell.parents = [col.left_neighbor(), col];
                }
            } else if (cell.is_extended() && cell.extent.bottom_neighbor() === null) {
                const extTop = cell.extent.top_neighbor();
                if (extTop && extTop.is_extended() && extTop.extent.bottom_neighbor() === null &&
                    col.right_neighbor() && col.right_neighbor().right_neighbor()) {
                    const idx1 = col.cells.indexOf(cell);
                    if (idx1 !== -1) col.cells.splice(idx1, 1);
                    const rCol = col.right_neighbor();
                    const idx2 = rCol.cells.indexOf(cell.extent);
                    if (idx2 !== -1) rCol.cells.splice(idx2, 1);
                    rCol.cells.push(cell);
                    rCol.right_neighbor().cells.push(cell.extent);
                    cell.parents = [rCol, rCol.right_neighbor()];
                } else if (top.is_extension() && top.origin.bottom_neighbor() === null &&
                           col.left_neighbor() && col.right_neighbor()) {
                    const idx1 = col.cells.indexOf(cell);
                    if (idx1 !== -1) col.cells.splice(idx1, 1);
                    const rCol = col.right_neighbor();
                    const idx2 = rCol.cells.indexOf(cell.extent);
                    if (idx2 !== -1) rCol.cells.splice(idx2, 1);
                    col.left_neighbor().cells.push(cell);
                    col.cells.push(cell.extent);
                    cell.parents = [col.left_neighbor(), col];
                }
            }
        }
    }

    adjust_cols_heights() {
        const target_h = this.w * this.target_ratio;
        for (const c of this.cols) {
            c.adjust_height(target_h);
        }
    }

    fix_voids() {
        if (!this.cols.length) return;
        const target_h = this.h;
        const epsilon = 1.0;

        for (const col of this.cols) {
            const current_h = col.h;
            const void_height = target_h - current_h;
            if (void_height > epsilon) {
                const auto_cells = col.cells.filter(c => !c.is_manual && !c.is_extension());
                if (auto_cells.length > 0) {
                    const add_per_cell = void_height / auto_cells.length;
                    for (const c of auto_cells) {
                        c.h += add_per_cell;
                    }
                } else {
                    const non_ext = col.cells.filter(c => !c.is_extension());
                    if (non_ext.length > 0) {
                        const add_per_cell = void_height / non_ext.length;
                        for (const c of non_ext) {
                            c.h += add_per_cell;
                        }
                    }
                }
            }
        }
    }

    adjust() {
        this.remove_empty_cols();
        this.remove_bottom_holes();
        this.adjust_cols_heights();
        this.fix_voids();
    }

    get_cell_at_position(x, y) {
        for (const col of this.cols) {
            if (col.x <= x && x <= col.x + col.w) {
                for (const cell of col.cells) {
                    if (cell.y <= y && y <= cell.y + cell.h) {
                        if (cell.is_extension()) {
                            return cell.origin;
                        }
                        return cell;
                    }
                }
            }
        }
        return null;
    }

    swap_photos(cell1, cell2) {
        const temp = cell1.photo;
        cell1.photo = cell2.photo;
        cell2.photo = temp;
    }

    clone(photoMap = new Map()) {
        const newPage = new Page(1.0, this.target_ratio, this.cols.length);
        newPage.cols = this.cols.map(col => new Column(newPage, col.w));

        const cellMap = new Map();

        for (let cIdx = 0; cIdx < this.cols.length; cIdx++) {
            const oldCol = this.cols[cIdx];
            for (const oldCell of oldCol.cells) {
                if (!oldCell.is_extension()) {
                    const parentCols = oldCell.parents.map(p => {
                        const pIdx = this.cols.indexOf(p);
                        return newPage.cols[pIdx];
                    });
                    let clonedPhoto = photoMap.get(oldCell.photo);
                    if (!clonedPhoto) {
                        clonedPhoto = oldCell.photo.clone();
                        photoMap.set(oldCell.photo, clonedPhoto);
                    }
                    const newCell = new Cell(parentCols, clonedPhoto);
                    newCell.h = oldCell.h;
                    newCell.is_manual = oldCell.is_manual;
                    newCell.rand_dx = oldCell.rand_dx;
                    newCell.rand_dy = oldCell.rand_dy;
                    newCell.rand_z = oldCell.rand_z;
                    cellMap.set(oldCell, newCell);
                }
            }
        }

        for (let cIdx = 0; cIdx < this.cols.length; cIdx++) {
            const oldCol = this.cols[cIdx];
            const newCol = newPage.cols[cIdx];
            for (const oldCell of oldCol.cells) {
                if (!oldCell.is_extension()) {
                    newCol.cells.push(cellMap.get(oldCell));
                } else {
                    const originCell = cellMap.get(oldCell.origin);
                    const newExtent = new CellExtent(originCell);
                    newCol.cells.push(newExtent);
                }
            }
        }

        return newPage;
    }
}

class UserCollage {
    constructor(photolist) {
        this.photolist = photolist.map(p => p.clone());
        this.page = null;
    }

    make_page(opts) {
        if (!this.photolist.length) return;
        const ratio = (1.0 * opts.out_h) / opts.out_w;
        const avg_ratio = this.photolist.reduce((sum, photo) => sum + (1.0 * photo.h) / photo.w, 0) / this.photolist.length;
        const virtual_no_imgs = 2 * this.photolist.length;
        const no_cols = Math.max(1, Math.round(Math.sqrt((avg_ratio / ratio) * virtual_no_imgs)));

        this.page = new Page(1.0, ratio, no_cols);
        for (let i = this.photolist.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.photolist[i], this.photolist[j]] = [this.photolist[j], this.photolist[i]];
        }
        for (const photo of this.photolist) {
            this.page.add_cell(photo);
        }
        this.page.adjust();
    }

    duplicate() {
        const photoMap = new Map();
        const clonedList = this.photolist.map(p => {
            const cp = p.clone();
            photoMap.set(p, cp);
            return cp;
        });
        const newUc = new UserCollage([]);
        newUc.photolist = clonedList;
        if (this.page) {
            newUc.page = this.page.clone(photoMap);
        }
        return newUc;
    }
}

// ======================================================================
// PHASE 2: RENDERING SUBSYSTEM
// ======================================================================

function randomSkeletonColor() {
    let r = Math.floor(Math.random() * 256);
    let g = Math.floor(Math.random() * 256);
    let b = Math.floor(Math.random() * 256);
    if (r + g + b > 0.7 * 3 * 256) {
        r = Math.max(0, r - 50);
        g = Math.max(0, g - 50);
        b = Math.max(0, b - 50);
    }
    return `rgb(${r},${g},${b})`;
}

function renderCollageToCanvas(page, opts, scaleFactor = 1.0) {
    const width = Math.max(1, Math.round(page.w));
    const height = Math.max(1, Math.round(page.h));

    const offCanvas = document.createElement("canvas");
    offCanvas.width = width;
    offCanvas.height = height;
    const ctx = offCanvas.getContext("2d");

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);

    const border_width = opts.border_w * Math.max(page.w, page.h);
    const picture_gap = opts.picture_gap * scaleFactor;

    if (picture_gap === 0) {
        drawSkeleton(ctx, page);
    }

    const all_cells = [];
    for (const col of page.cols) {
        for (const c of col.cells) {
            if (!c.is_extension()) {
                all_cells.push(c);
            }
        }
    }

    if (picture_gap > 0) {
        all_cells.sort((a, b) => a.rand_z - b.rand_z);
    }

    for (const c of all_cells) {
        let dx = 0;
        let dy = 0;
        if (picture_gap > 0) {
            dx = Math.round(c.rand_dx * picture_gap);
            dy = Math.round(c.rand_dy * picture_gap);
        }
        drawCroppedPhotoInCell(ctx, c, dx, dy);
    }

    if (picture_gap === 0 && border_width > 0) {
        drawBorders(ctx, page, border_width, opts.border_c);
    }

    return offCanvas;
}

function drawSkeleton(ctx, page) {
    ctx.save();
    ctx.lineWidth = 1;
    for (const col of page.cols) {
        for (const c of col.cells) {
            if (c.is_extension()) continue;
            const color = randomSkeletonColor();
            let [x, y, w, h] = c.content_coords();
            w = Math.max(1, w);
            h = Math.max(1, h);

            ctx.strokeStyle = color;
            ctx.strokeRect(x, y, w - 1, h - 1);
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + w - 1, y + h - 1);
            ctx.moveTo(x, y + h - 1);
            ctx.lineTo(x + w - 1, y);
            ctx.stroke();
        }
    }
    ctx.restore();
}

function drawCroppedPhotoInCell(ctx, cell, dx = 0, dy = 0) {
    const img = cell.photo.imgElement;
    if (!img) return;

    const imgW = cell.photo.w;
    const imgH = cell.photo.h;
    const cellW = cell.w;
    const cellH = cell.h;

    if (cellW <= 0 || cellH <= 0 || imgW <= 0 || imgH <= 0) return;

    const shape = imgW * cellH - imgH * cellW;
    let sx = 0, sy = 0, sw = imgW, sh = imgH;

    if (shape > 0) {
        sw = (cellW / cellH) * imgH;
        const widthToCrop = imgW - sw;
        sx = widthToCrop * cell.photo.offset_w;
    } else if (shape < 0) {
        sh = (cellH / cellW) * imgW;
        const heightToCrop = imgH - sh;
        sy = heightToCrop * cell.photo.offset_h;
    }

    sx = Math.max(0, Math.min(imgW - 1, sx));
    sy = Math.max(0, Math.min(imgH - 1, sy));
    sw = Math.max(1, Math.min(imgW - sx, sw));
    sh = Math.max(1, Math.min(imgH - sy, sh));

    const destX = Math.round(cell.x + dx);
    const destY = Math.round(cell.y + dy);
    const destW = Math.max(1, Math.round(cellW));
    const destH = Math.max(1, Math.round(cellH));

    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, sx, sy, sw, sh, destX, destY, destW, destH);
    ctx.restore();
}

function drawBorders(ctx, page, borderWidth, borderColor) {
    if (borderWidth <= 0) return;
    const W = page.w;
    const H = page.h;
    const border = borderWidth;

    ctx.save();
    ctx.fillStyle = borderColor || "#000000";

    ctx.fillRect(0, 0, border, H);
    ctx.fillRect(W - border, 0, border, H);
    ctx.fillRect(0, 0, W, border);
    ctx.fillRect(0, H - border, W, border);

    for (const col of page.cols) {
        for (let i = 1; i < col.cells.length; i++) {
            const c = col.cells[i];
            ctx.fillRect(col.x, c.y - border / 2.0, col.w, border);
        }
        if (col.x > 0) {
            for (const c of col.cells) {
                if (!c.is_extension()) {
                    ctx.fillRect(col.x - border / 2.0, c.y, border, c.h);
                }
            }
        }
    }
    ctx.restore();
}

function loadMediaFileAsPhoto(file) {
    return new Promise((resolve, reject) => {
        const isVideo = file.type.startsWith("video/") ||
            /\.(mp4|m4v|mov|webm|mkv|avi|flv|wmv)$/i.test(file.name);

        const url = URL.createObjectURL(file);

        if (!isVideo) {
            const img = new Image();
            img.onload = () => {
                const w = img.naturalWidth || img.width;
                const h = img.naturalHeight || img.height;
                if (w > 0 && h > 0) {
                    resolve(new Photo(file.name, w, h, 0, img, false));
                } else {
                    URL.revokeObjectURL(url);
                    reject(new Error(file.name));
                }
            };
            img.onerror = () => {
                URL.revokeObjectURL(url);
                reject(new Error(file.name));
            };
            img.src = url;
        } else {
            const video = document.createElement("video");
            video.preload = "metadata";
            video.muted = true;
            video.playsInline = true;

            video.onloadedmetadata = () => {
                const seekTarget = Math.min(1.0, (video.duration || 0) * 0.25);
                video.currentTime = seekTarget;
            };

            video.onseeked = () => {
                try {
                    const vw = video.videoWidth || 640;
                    const vh = video.videoHeight || 360;
                    const frameCanvas = document.createElement("canvas");
                    frameCanvas.width = vw;
                    frameCanvas.height = vh;
                    const fCtx = frameCanvas.getContext("2d");
                    fCtx.drawImage(video, 0, 0, vw, vh);
                    URL.revokeObjectURL(url);
                    resolve(new Photo(file.name, vw, vh, 0, frameCanvas, true));
                } catch (err) {
                    URL.revokeObjectURL(url);
                    reject(new Error(file.name));
                }
            };

            video.onerror = () => {
                URL.revokeObjectURL(url);
                reject(new Error(file.name));
            };

            video.src = url;
        }
    });
}


// ======================================================================
// APPLICATION BOOTSTRAPPER
// ======================================================================
window.onload = function () {
    const app = new PhotoCollageApp();
    window.photoCollageApp = app;

    if (window.SAVED_SESSION_DATA) {
        app.showComputingDialog(true, "Restoring saved project session...");
        app.updateComputingDialog(0.3);

        setTimeout(() => {
            try {
                const data = window.SAVED_SESSION_DATA;
                app.opts = Object.assign(app.opts, data.opts);
                app.history_index = data.history_index;

                let loadedImagesCount = 0;
                let totalImagesCount = 0;
                data.history.forEach((h) => {
                    totalImagesCount += h.photolist.length;
                });

                if (totalImagesCount === 0) {
                    app.showComputingDialog(false);
                    app.render_preview(false);
                    return;
                }

                app.history = data.history.map((hState) => {
                    const reconstructedList = hState.photolist.map((pData) => {
                        const img = new Image();
                        const p = new Photo(pData.filename, pData.w, pData.h, pData.orientation, img, pData.isVideo);
                        p.offset_w = pData.offset_w;
                        p.offset_h = pData.offset_h;

                        img.onload = () => {
                            loadedImagesCount++;
                            if (loadedImagesCount === totalImagesCount) {
                                app.showComputingDialog(false);
                                app.render_preview(false);
                                showToast("Restored saved project successfully!", "success");
                            }
                        };
                        img.onerror = () => {
                            loadedImagesCount++;
                            if (loadedImagesCount === totalImagesCount) {
                                app.showComputingDialog(false);
                                app.render_preview(false);
                            }
                        };
                        img.src = pData.dataUrl;
                        return p;
                    });

                    const uc = new UserCollage(reconstructedList);
                    uc.make_page(app.opts);
                    return uc;
                });

                setTimeout(() => {
                    app.showComputingDialog(false);
                    if (app.history.length > 0) {
                        app.render_preview(false);
                    }
                }, 500);
            } catch (err) {
                app.showComputingDialog(false);
                showToast(`Error restoring session: ${err.message}`, "error");
                app.loadDemoPhotos();
            }
        }, 100);
    } else {
        app.loadDemoPhotos();
    }
};
