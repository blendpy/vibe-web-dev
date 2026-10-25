// ======================================================================
// PHASE 3: INTERACTIVE PREVIEW AREA & APPLICATION CONTROLLER
// ======================================================================

const MODE = {
    INSENSITIVE: 0,
    FLYING: 1,
    SWAPPING_OR_MOVING: 2,
    RESIZING: 3
};

class PhotoCollageApp {
    constructor() {
        this.history = [];
        this.history_index = -1;

        this.opts = {
            border_w: 0.01,
            border_c: "#000000",
            out_w: 800,
            out_h: 600,
            pause_duration: 0.5,
            use_defined_zoom: false,
            picture_gap: 0
        };

        this.savedOptsSnapshot = null;

        this.canvas = document.getElementById("previewCanvas");
        this.ctx = this.canvas.getContext("2d");
        this.renderedImageCanvas = null;
        this.collage = null;
        this.mode = MODE.FLYING;

        this.x = 0;
        this.y = 0;
        this.press_raw_x = 0;
        this.press_raw_y = 0;

        this.swap_origin = { cell: null, x: 0, y: 0 };
        this.swap_dest = { cell: null, x: 0, y: 0 };

        this.resize_type = null;
        this.resize_edge = null;
        this.resize_start_col_w = 0;
        this.resize_start_neighbor_col_w = 0;
        this.resize_start_cell_h = 0;
        this.resize_start_neighbor_cell_h = 0;
        this.neighbor_cell = null;
        this.neighbor_col = null;
        this.resize_col = null;

        this.animating = false;
        this.anim_start_time = 0;
        this.zoom_duration = 1.5;
        this.fade_duration = 1.5;
        this.anim_duration = 3.5;
        this.anim_cell_photo = null;
        this.anim_source_rect = null;
        this.on_zoom_complete_callback = null;
        this.animFrameId = null;

        this.zoom_queue = [];
        this.current_cell = null;
        this.is_running_sequential_zoom = false;

        this.landscape_templates = [
            ["Custom Size", null],
            ["███ 800 × 600", [800, 600]],
            ["███ 1600 × 1200", [1600, 1200]],
            ["███ 1920 × 1080", [1920, 1080]],
            ["███ 3508 x 2480 - A4 landscape (300ppi)", [3508, 2480]],
            ["███ 4960 x 3508 - A3 landscape (300ppi)", [4960, 3508]],
            ["███ 3300 x 2550 - US-Letter landscape (300ppi)", [3300, 2550]]
        ];

        this.portrait_templates = [
            ["Custom Size", null],
            ["█ 600 × 800", [600, 800]],
            ["█ 1200 × 1600", [1200, 1600]],
            ["█ 1080 x 1920", [1080, 1920]],
            ["█ 2480 x 3508 - A4 portrait (300ppi)", [2480, 3508]],
            ["█ 3508 x 4960 - A3 portrait (300ppi)", [3508, 4960]],
            ["█ 2550 x 3300 - US-Letter portrait (300ppi)", [2550, 3300]]
        ];
        this.current_templates = this.landscape_templates;
        this.updating_live = false;

        this.initBindings();
        this.resizeCanvasToContainer();
    }

    updateSaveModalUi() {
        const fmtEl = document.getElementById("saveFormat");
        const infoBox = document.getElementById("saveInfoBox");
        const lblInfo = document.getElementById("lblSaveInfo");
        const lblConfirmIcon = document.getElementById("lblSaveConfirmIcon");
        const lblConfirmText = document.getElementById("lblSaveConfirmText");
        const btnConfirm = document.getElementById("btnSaveConfirm");

        if (!fmtEl || !lblInfo || !lblConfirmText) return;

        const format = fmtEl.value;

        if (format === "video/animation") {
            infoBox.className = "bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 transition-colors";
            lblInfo.innerHTML = "A slideshow animation video will be recorded cycling through all collage photos at <strong>" + this.opts.out_w + " × " + this.opts.out_h + "</strong> resolution.";
            lblConfirmIcon.textContent = "🎬";
            lblConfirmText.innerHTML = "Create Animation<br class=\"hidden sm:inline\">(as WebM Video)";
            btnConfirm.className = "px-3 sm:px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs sm:text-sm font-medium shadow-sm transition flex items-center justify-center text-center gap-1.5";
        } else if (format === "extract/images") {
            const count = (this.history[this.history_index] && this.history[this.history_index].photolist) 
                ? this.history[this.history_index].photolist.length 
                : 0;
            infoBox.className = "bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-900 transition-colors";
            lblInfo.innerHTML = "All <strong>" + count + "</strong> loaded photos will be extracted and saved individually in their original resolutions.";
            lblConfirmIcon.textContent = "📂";
            lblConfirmText.innerHTML = "Extract All Images<br class=\"hidden sm:inline\">(Individual Files)";
            btnConfirm.className = "px-3 sm:px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-medium shadow-sm transition flex items-center justify-center text-center gap-1.5";
        } else {
            infoBox.className = "bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-800 transition-colors";
            lblInfo.innerHTML = "Poster will be rendered at full resolution: <strong>" + this.opts.out_w + " × " + this.opts.out_h + "</strong> pixels.";
            lblConfirmIcon.textContent = "💾";
            lblConfirmText.innerHTML = "Download Poster<br class=\"hidden sm:inline\">(as One Image)";
            btnConfirm.className = "px-3 sm:px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-medium shadow-sm transition flex items-center justify-center text-center gap-1.5";
        }
    }

    initBindings() {
        const fileInput = document.getElementById("fileInput");
        const btnChoose = document.getElementById("btnChooseImages");
        if (btnChoose && fileInput) {
            btnChoose.addEventListener("click", () => fileInput.click());
            fileInput.addEventListener("change", (e) => {
                if (e.target.files && e.target.files.length > 0) {
                    this.handleFilesSelected(Array.from(e.target.files));
                    fileInput.value = "";
                }
            });
        }

        const bindBtn = (id, fn) => {
            const el = document.getElementById(id);
            if (el) el.addEventListener("click", fn);
        };

        const saveFormatSelect = document.getElementById("saveFormat");
        if (saveFormatSelect) {
            saveFormatSelect.addEventListener("change", () => {
                this.updateSaveModalUi();
            });
        }

        bindBtn("btnLoadDemo", () => this.loadDemoPhotos());
        bindBtn("btnSavePoster", () => this.openSaveModal());
        bindBtn("btnUndo", () => this.select_prev_layout());
        bindBtn("btnRedo", () => this.select_next_layout());
        bindBtn("btnNewLayout", () => this.regenerate_layout());
        bindBtn("btnZoomAll", () => this.on_zoom_all_clicked());
        bindBtn("btnClearAll", () => this.clearAllPhotos());
        bindBtn("btnSettings", () => this.openSettingsModal());

        bindBtn("btnHudPrev", () => this.navigate_sequential_preview(false));
        bindBtn("btnHudNext", () => this.navigate_sequential_preview(true));
        bindBtn("btnHudStop", () => this.cancel_sequential_zoom());

        bindBtn("btnSaveCancel", () => {
            const modal = document.getElementById("saveModal");
            if (modal) modal.classList.add("hidden");
        });
        bindBtn("btnSaveConfirm", () => this.executeSavePoster());
        bindBtn("btnSaveProject", () => this.executeSaveProjectHtml());

        const wrapper = document.getElementById("previewWrapper");
        const dropOverlay = document.getElementById("dropOverlay");
        if (wrapper && dropOverlay) {
            window.addEventListener("dragover", (e) => {
                e.preventDefault();
                dropOverlay.classList.remove("hidden");
            });
            wrapper.addEventListener("dragleave", (e) => {
                if (e.relatedTarget === null || !wrapper.contains(e.relatedTarget)) {
                    dropOverlay.classList.add("hidden");
                }
            });
            window.addEventListener("drop", (e) => {
                e.preventDefault();
                dropOverlay.classList.add("hidden");
                if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    this.handleFilesSelected(Array.from(e.dataTransfer.files));
                }
            });
        }

        this.canvas.addEventListener("mousemove", (e) => this.motion_notify_event(e));
        this.canvas.addEventListener("mouseleave", (e) => this.motion_notify_event(e));
        this.canvas.addEventListener("mousedown", (e) => {
            if (e.button === 0) this.button_press_event(e);
        });
        window.addEventListener("mouseup", (e) => {
            if (e.button === 0) this.button_release_event(e);
        });

        this.canvas.addEventListener("touchstart", (e) => {
            if (e.touches.length === 1) {
                e.preventDefault();
                const rect = this.canvas.getBoundingClientRect();
                const touch = e.touches[0];
                const synthEvent = {
                    offsetX: touch.clientX - rect.left,
                    offsetY: touch.clientY - rect.top
                };
                this.motion_notify_event(synthEvent);
                this.button_press_event(synthEvent);
            }
        }, { passive: false });

        this.canvas.addEventListener("touchmove", (e) => {
            if (e.touches.length === 1) {
                e.preventDefault();
                const rect = this.canvas.getBoundingClientRect();
                const touch = e.touches[0];
                this.motion_notify_event({
                    offsetX: touch.clientX - rect.left,
                    offsetY: touch.clientY - rect.top
                });
            }
        }, { passive: false });

        this.canvas.addEventListener("touchend", (e) => {
            if (e.changedTouches.length === 1) {
                e.preventDefault();
                const rect = this.canvas.getBoundingClientRect();
                const touch = e.changedTouches[0];
                this.button_release_event({
                    offsetX: touch.clientX - rect.left,
                    offsetY: touch.clientY - rect.top
                });
            }
        }, { passive: false });

        window.addEventListener("keydown", (e) => this.on_window_key_press(e));

        // Clipboard Paste Listener (Supports Copy Image, blocks Copy Image Address)
        window.addEventListener("paste", (e) => this.handle_paste_event(e));

        this.resizeTimeout = null;
        window.addEventListener("resize", () => {
            this.resizeCanvasToContainer();
            if (this.collage && this.collage.photolist.length > 0 && !this.animating) {
                clearTimeout(this.resizeTimeout);
                this.resizeTimeout = setTimeout(() => {
                    this.render_preview(false);
                }, 120);
            } else {
                this.on_paint();
            }
        });

        this.initSettingsModalBindings();
    }

    handle_paste_event(e) {
        // Do not intercept pasting if active inside an input or textarea (e.g. filename)
        if (["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName)) {
            return;
        }

        const clipboardData = e.clipboardData || window.clipboardData;
        if (!clipboardData) return;

        const items = clipboardData.items;
        const imageFiles = [];

        if (items) {
            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                if (item.type && item.type.startsWith("image/")) {
                    const file = item.getAsFile();
                    if (file) {
                        const ext = item.type.split("/")[1] || "png";
                        const defaultName = `Pasted_Image_${Date.now()}.${ext}`;
                        const namedFile = new File([file], (file.name && file.name !== "image.png") ? file.name : defaultName, {
                            type: file.type
                        });
                        imageFiles.push(namedFile);
                    }
                }
            }
        }

        if (imageFiles.length > 0) {
            e.preventDefault();
            this.handleFilesSelected(imageFiles);
        } else {
            // Check if user copied an image URL/address instead of the image itself
            const pastedText = clipboardData.getData("text/plain")?.trim() || "";
            const isUrlLike = /^(https?:\/\/|data:image\/|\/)/i.test(pastedText) || /\.(png|jpe?g|webp|gif|svg)(\?.*)?$/i.test(pastedText);

            if (isUrlLike) {
                e.preventDefault();
                showToast("Pasting image URLs is disabled. Right-click the image and choose 'Copy Image' instead.", "info");
            }
        }
    }

    resizeCanvasToContainer() {
        const wrapper = document.getElementById("previewWrapper");
        if (!wrapper) return;
        const rect = wrapper.getBoundingClientRect();
        this.canvas.width = Math.max(300, Math.floor(rect.width));
        this.canvas.height = Math.max(200, Math.floor(rect.height));
    }

    async handleFilesSelected(files) {
        const results = [];
        const badFiles = [];

        this.showComputingDialog(true, "Loading media files...");
        for (let i = 0; i < files.length; i++) {
            try {
                const photo = await loadMediaFileAsPhoto(files[i]);
                results.push(photo);
            } catch (err) {
                badFiles.push(files[i].name);
            }
            this.updateComputingDialog((i + 1) / files.length);
        }
        this.showComputingDialog(false);

        if (badFiles.length > 0) {
            showToast(`Could not open: ${badFiles.join(", ")}`, "error");
        }

        if (results.length > 0) {
            this.update_photolist(results);
            showToast(`Added ${results.length} media item${results.length > 1 ? "s" : ""}`, "success");
        }
    }

    loadDemoPhotos() {
        this.cancel_sequential_zoom();
        this.stop_single_zoom();
        if (typeof createDemoPhotoList !== "function") return;
        const demoPhotos = createDemoPhotoList();
        const new_collage = new UserCollage(demoPhotos);
        new_collage.make_page(this.opts);
        this.render_from_new_collage(new_collage);
        showToast("Loaded demo photos! Click any photo to zoom or drag borders to resize.", "info");
    }

    clearAllPhotos() {
        this.cancel_sequential_zoom();
        this.stop_single_zoom();
        this.renderedImageCanvas = null;
        this.collage = null;
        this.mode = MODE.INSENSITIVE;
        this.history = [];
        this.history_index = -1;
        this.update_tool_buttons();
        this.on_paint();
        showToast("Cleared collage workspace", "info");
    }

    update_photolist(newPhotoObjects) {
        let photolist = [];
        if (this.history_index >= 0 && this.history_index < this.history.length) {
            photolist = this.history[this.history_index].photolist.map(p => p.clone());
        }

        const existingNames = new Set(photolist.map(p => `${p.filename}_${p.w}x${p.h}`));
        for (const photo of newPhotoObjects) {
            const key = `${photo.filename}_${photo.w}x${photo.h}`;
            if (!existingNames.has(key)) {
                photolist.push(photo);
                existingNames.add(key);
            } else {
                photo.filename = `${photo.filename} (${photolist.length + 1})`;
                photolist.push(photo);
            }
        }

        if (photolist.length > 0) {
            const new_collage = new UserCollage(photolist);
            new_collage.make_page(this.opts);
            this.render_from_new_collage(new_collage);
        } else {
            this.update_tool_buttons();
        }
    }

    render_from_new_collage(collage_obj) {
        if (this.history_index >= -1 && this.history_index < this.history.length - 1) {
            this.history = this.history.slice(0, this.history_index + 1);
        }
        this.history.push(collage_obj.duplicate());
        this.history_index = this.history.length - 1;
        this.update_tool_buttons();
        this.render_preview(false);
    }

    regenerate_layout() {
        if (this.history_index < 0 || this.history_index >= this.history.length) return;
        this.cancel_sequential_zoom();
        this.stop_single_zoom();
        const current = this.history[this.history_index];
        const new_collage = new UserCollage(current.photolist);
        new_collage.make_page(this.opts);
        this.render_from_new_collage(new_collage);
    }

    select_prev_layout() {
        if (this.history_index <= 0) return;
        this.cancel_sequential_zoom();
        this.stop_single_zoom();
        this.history_index -= 1;
        this.update_tool_buttons();
        this.render_preview(false);
    }

    select_next_layout() {
        if (this.history_index >= this.history.length - 1) return;
        this.cancel_sequential_zoom();
        this.stop_single_zoom();
        this.history_index += 1;
        this.update_tool_buttons();
        this.render_preview(false);
    }

    update_tool_buttons() {
        const hasValidCollage = this.history_index >= 0 && this.history_index < this.history.length;
        const setDisabled = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.disabled = val;
        };

        setDisabled("btnUndo", !(this.history_index > 0));
        setDisabled("btnRedo", !(this.history_index < this.history.length - 1));

        const lblIdx = document.getElementById("lblHistoryIndex");
        if (lblIdx) {
            lblIdx.textContent = hasValidCollage ? `${this.history_index + 1} / ${this.history.length}` : "-";
        }

        setDisabled("btnSavePoster", !hasValidCollage);
        setDisabled("btnNewLayout", !hasValidCollage);
        setDisabled("btnZoomAll", !hasValidCollage);
        setDisabled("btnClearAll", !hasValidCollage);

        const photoCount = hasValidCollage ? this.history[this.history_index].photolist.length : 0;
        const colCount = (hasValidCollage && this.history[this.history_index].page) ? this.history[this.history_index].page.no_cols : 0;
        
        const elPhotos = document.getElementById("statusPhotos");
        if (elPhotos) elPhotos.textContent = `${photoCount} photo${photoCount === 1 ? "" : "s"} loaded`;
        
        const elRes = document.getElementById("statusResolution");
        if (elRes) elRes.textContent = `Output: ${this.opts.out_w} × ${this.opts.out_h} px`;
        
        const elCols = document.getElementById("statusCols");
        if (elCols) elCols.textContent = `Columns: ${colCount}`;
    }

    render_preview(show_computing = false) {
        if (!this.history.length || this.history_index < 0 || this.history_index >= this.history.length) {
            this.on_paint();
            return;
        }

        const padding = 28;
        const w = Math.max(50, this.canvas.width - padding * 2);
        const h = Math.max(50, this.canvas.height - padding * 2);

        const target_w = this.opts.out_w >= 200 ? this.opts.out_w : w;
        const target_h = this.opts.out_h >= 200 ? this.opts.out_h : h;

        const collage_obj = this.history[this.history_index];
        if (!collage_obj.page || !collage_obj.page.cols.length) return;

        collage_obj.page.target_ratio = (1.0 * target_h) / target_w;
        collage_obj.page.adjust_cols_heights();
        collage_obj.page.fix_voids();
        collage_obj.page.scale_to_fit(w, h);

        if (show_computing) {
            this.showComputingDialog(true, "Performing image computation...");
            this.updateComputingDialog(0.5);
        }

        const scaleFactor = collage_obj.page.w / Math.max(1, target_w);
        const renderedCanvas = renderCollageToCanvas(collage_obj.page, this.opts, Math.max(0.4, scaleFactor));

        this.set_collage(renderedCanvas, collage_obj);
        this.update_tool_buttons();

        if (show_computing) {
            this.updateComputingDialog(1.0);
            setTimeout(() => this.showComputingDialog(false), 120);
        }
    }

    set_collage(renderedCanvas, collage_obj) {
        this.renderedImageCanvas = renderedCanvas;
        this.collage = collage_obj.duplicate();
        this.mode = MODE.FLYING;
        this.on_paint();
    }

    showComputingDialog(visible, title = "Performing image computation...") {
        const dlg = document.getElementById("computingDialog");
        const lbl = document.getElementById("lblComputingTitle");
        if (lbl) lbl.textContent = title;
        if (!dlg) return;
        if (visible) dlg.classList.remove("hidden");
        else dlg.classList.add("hidden");
    }

    updateComputingDialog(fraction) {
        const pct = Math.round(Math.max(0, Math.min(1, fraction)) * 100);
        const bar = document.getElementById("computingBar");
        if (bar) bar.style.width = `${pct}%`;
        const lbl = document.getElementById("lblComputingPct");
        if (lbl) lbl.textContent = `${pct}%`;
    }

    get_image_offset() {
        if (!this.renderedImageCanvas) return [0, 0];
        const w = this.canvas.width;
        const h = this.canvas.height;
        return [
            Math.round((w - this.renderedImageCanvas.width) / 2.0),
            Math.round((h - this.renderedImageCanvas.height) / 2.0)
        ];
    }

    get_pos_in_image(rawX, rawY) {
        if (this.renderedImageCanvas) {
            const [x0, y0] = this.get_image_offset();
            return [Math.round(rawX - x0), Math.round(rawY - y0)];
        }
        return [Math.round(rawX), Math.round(rawY)];
    }

    dist_to_vertical_segment(px, py, lx, ly0, ly1) {
        const dx = px - lx;
        let dy = 0;
        if (py < ly0 || py > ly1) {
            dy = Math.min(Math.abs(py - ly0), Math.abs(py - ly1));
        }
        return Math.sqrt(dx * dx + dy * dy);
    }

    dist_to_horizontal_segment(px, py, ly, lx0, lx1) {
        const dy = py - ly;
        let dx = 0;
        if (px < lx0 || px > lx1) {
            dx = Math.min(Math.abs(px - lx0), Math.abs(px - lx1));
        }
        return Math.sqrt(dx * dx + dy * dy);
    }

    _get_all_cells() {
        if (!this.collage || !this.collage.page) return [];
        const cells = [];
        for (const col of this.collage.page.cols) {
            for (const cell of col.cells) {
                cells.push(cell);
            }
        }
        return cells;
    }

    get_closest_edge(x, y) {
        if (!this.collage || !this.collage.page) {
            return [null, null, Infinity];
        }

        const pageW = this.collage.page.w;
        const pageH = this.collage.page.h;
        if (x < -15 || x > pageW + 15 || y < -15 || y > pageH + 15) {
            return [null, null, Infinity];
        }

        let best_cell = null;
        let best_edge = null;
        let min_dist = Infinity;
        const eps = 2.0;

        for (const cell of this._get_all_cells()) {
            if (cell.x > eps) {
                const d_left = this.dist_to_vertical_segment(x, y, cell.x, cell.y, cell.y + cell.h);
                if (d_left < min_dist) {
                    min_dist = d_left;
                    best_cell = cell;
                    best_edge = "left";
                }
            }

            if (cell.x + cell.w < pageW - eps) {
                const d_right = this.dist_to_vertical_segment(x, y, cell.x + cell.w, cell.y, cell.y + cell.h);
                if (d_right < min_dist) {
                    min_dist = d_right;
                    best_cell = cell;
                    best_edge = "right";
                }
            }

            if (cell.y > eps) {
                const d_top = this.dist_to_horizontal_segment(x, y, cell.y, cell.x, cell.x + cell.w);
                if (d_top < min_dist) {
                    min_dist = d_top;
                    best_cell = cell;
                    best_edge = "top";
                }
            }

            if (cell.y + cell.h < pageH - eps) {
                const d_bottom = this.dist_to_horizontal_segment(x, y, cell.y + cell.h, cell.x, cell.x + cell.w);
                if (d_bottom < min_dist) {
                    min_dist = d_bottom;
                    best_cell = cell;
                    best_edge = "bottom";
                }
            }
        }

        return [best_cell, best_edge, min_dist];
    }

    is_over_delete_button(cell, x, y) {
        if (!cell) return false;
        const radius = 9;
        const margin = 6;
        const cx = Math.floor(cell.x + cell.w - radius - margin);
        const cy = Math.floor(cell.y + radius + margin);
        const dist_sq = (cx - x) ** 2 + (cy - y) ** 2;
        return dist_sq <= (radius + 3) ** 2;
    }

    delete_cell(cell) {
        if (!cell || !this.collage) return;
        const targetPhoto = cell.photo;
        const idx = this.collage.photolist.indexOf(targetPhoto);
        if (idx !== -1) {
            this.collage.photolist.splice(idx, 1);
        }

        if (this.collage.photolist.length > 0) {
            this.collage.make_page(this.opts);
            this.render_from_new_collage(this.collage);
            showToast(`Removed "${targetPhoto.filename}"`, "info");
        } else {
            this.renderedImageCanvas = null;
            this.collage = null;
            this.mode = MODE.INSENSITIVE;
            this.history_index = this.history.length;
            this.update_tool_buttons();
            this.on_paint();
        }
    }

    delete_hovered_photo() {
        if (!this.collage || !this.collage.page) return;
        const cell = this.collage.page.get_cell_at_position(this.x, this.y);
        if (cell) {
            this.delete_cell(cell);
        }
    }

    paint_vertical_line(x, y0_line, y1_line, color = "#ffff00", width = 4) {
        const [x0, y0] = this.get_image_offset();
        const ctx = this.ctx;
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.beginPath();
        ctx.moveTo(x0 + x, y0 + y0_line);
        ctx.lineTo(x0 + x, y0 + y1_line);
        ctx.stroke();
        ctx.restore();
    }

    paint_horizontal_line(y, x0_line, x1_line, color = "#ffff00", width = 4) {
        const [x0, y0] = this.get_image_offset();
        const ctx = this.ctx;
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.beginPath();
        ctx.moveTo(x0 + x0_line, y0 + y);
        ctx.lineTo(x0 + x1_line, y0 + y);
        ctx.stroke();
        ctx.restore();
    }

    paint_image_border(cell, dash = null) {
        if (!cell) return;
        const [x0, y0] = this.get_image_offset();
        const ctx = this.ctx;
        ctx.save();
        ctx.strokeStyle = "#ffff00";
        ctx.lineWidth = 2.5;
        if (dash) ctx.setLineDash(dash);
        ctx.strokeRect(x0 + cell.x + 1, y0 + cell.y + 1, cell.w - 2, cell.h - 2);
        ctx.restore();
    }

    paint_image_delete_button(cell) {
        if (!cell) return;
        const [x0, y0] = this.get_image_offset();
        const radius = 9;
        const margin = 6;

        const cx = Math.floor(x0 + cell.x + cell.w - radius - margin);
        const cy = Math.floor(y0 + cell.y + radius + margin);

        const ctx = this.ctx;
        ctx.save();
        ctx.fillStyle = "rgba(220, 50, 50, 0.92)";
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.5;

        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.lineWidth = 2;
        const offset = 4;
        ctx.beginPath();
        ctx.moveTo(cx - offset, cy - offset);
        ctx.lineTo(cx + offset, cy + offset);
        ctx.moveTo(cx + offset, cy - offset);
        ctx.lineTo(cx - offset, cy + offset);
        ctx.stroke();
        ctx.restore();
    }

    on_paint() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        ctx.clearRect(0, 0, w, h);

        if (this.renderedImageCanvas && this.collage && this.collage.page) {
            const [x0, y0] = this.get_image_offset();

            ctx.save();
            ctx.shadowColor = "rgba(15, 23, 42, 0.25)";
            ctx.shadowBlur = 24;
            ctx.shadowOffsetY = 6;
            ctx.drawImage(this.renderedImageCanvas, x0, y0);
            ctx.restore();

            if (this.mode === MODE.RESIZING && this.swap_origin.cell) {
                const cell = this.swap_origin.cell;
                if (this.resize_type === "horizontal") {
                    const edge_x = this.resize_edge === "left" ? cell.x : cell.x + cell.w;
                    const dx = this.x - this.swap_origin.x;
                    const line_x = edge_x + dx;
                    this.paint_vertical_line(line_x, 0, this.renderedImageCanvas.height);
                } else if (this.resize_type === "vertical") {
                    const edge_y = this.resize_edge === "top" ? cell.y : cell.y + cell.h;
                    const dy = this.y - this.swap_origin.y;
                    const line_y = edge_y + dy;
                    this.paint_horizontal_line(line_y, 0, this.renderedImageCanvas.width);
                }
            } else if (this.mode === MODE.FLYING && !this.animating) {
                const [closest_cell, edge, dist] = this.get_closest_edge(this.x, this.y);
                const edge_threshold = 12;

                if (closest_cell && dist <= edge_threshold) {
                    if (edge === "left" || edge === "right") {
                        const line_x = edge === "left" ? closest_cell.x : closest_cell.x + closest_cell.w;
                        this.paint_vertical_line(line_x, 0, this.renderedImageCanvas.height);
                        this.canvas.style.cursor = "ew-resize";
                        const hint = document.getElementById("statusHint");
                        if (hint) hint.textContent = "Drag left or right to resize adjacent columns";
                    } else if (edge === "top" || edge === "bottom") {
                        const line_y = edge === "top" ? closest_cell.y : closest_cell.y + closest_cell.h;
                        this.paint_horizontal_line(line_y, 0, this.renderedImageCanvas.width);
                        this.canvas.style.cursor = "ns-resize";
                        const hint = document.getElementById("statusHint");
                        if (hint) hint.textContent = "Drag up or down to resize adjacent cells";
                    }
                } else {
                    const active = this.collage.page.get_cell_at_position(this.x, this.y);
                    if (active) {
                        const hint = document.getElementById("statusHint");
                        if (this.is_over_delete_button(active, this.x, this.y)) {
                            this.canvas.style.cursor = "pointer";
                            if (hint) hint.textContent = `Click to remove "${active.photo.filename}" from collage`;
                        } else {
                            this.canvas.style.cursor = "move";
                            if (hint) hint.textContent = `"${active.photo.filename}" — Click to zoom full size • Drag to pan or swap with another cell • Press Del to delete`;
                        }
                        this.paint_image_delete_button(active);
                    } else {
                        this.canvas.style.cursor = "default";
                        const hint = document.getElementById("statusHint");
                        if (hint) hint.textContent = "Tip: Click a photo to zoom full-size • Drag inside a cell to pan or swap • Drag yellow borders to resize";
                    }
                }
            } else if (this.mode === MODE.SWAPPING_OR_MOVING && !this.animating) {
                this.paint_image_border(this.swap_origin.cell, [5, 5]);
                const cell = this.collage.page.get_cell_at_position(this.x, this.y);
                const hint = document.getElementById("statusHint");
                if (cell && cell !== this.swap_origin.cell) {
                    this.paint_image_border(cell, [5, 5]);
                    if (hint) hint.textContent = `Release mouse to swap with "${cell.photo.filename}"`;
                } else {
                    if (hint) hint.textContent = "Drag inside cell to pan photo crop offset, or drag onto another cell to swap";
                }
            }
        } else {
            this.canvas.style.cursor = "default";
            ctx.save();
            ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
            ctx.strokeStyle = "#cbd5e1";
            ctx.lineWidth = 2;
            const boxW = Math.min(520, w - 40);
            const boxH = 190;
            const bx = (w - boxW) / 2;
            const by = (h - boxH) / 2;
            ctx.beginPath();
            ctx.roundRect(bx, by, boxW, boxH, 16);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = "#334155";
            ctx.font = "bold 16px Inter, sans-serif";
            ctx.textAlign = "center";
            const lines = [
                "Drag & Drop Images Here (or Paste with Ctrl+V)",
                "Drag a box to move/swap image",
                "Move near line to resize",
                "Click red circle or Del to delete an image"
            ];
            lines.forEach((line, idx) => {
                ctx.font = idx === 0 ? "bold 18px Inter, sans-serif" : "500 14px Inter, sans-serif";
                ctx.fillStyle = idx === 0 ? "#1e293b" : "#475569";
                ctx.fillText(line, w / 2, by + 50 + idx * 32);
            });
            ctx.restore();
        }

        if (this.animating && this.anim_cell_photo && this.anim_cell_photo.imgElement) {
            const elapsed = (performance.now() - this.anim_start_time) / 1000.0;
            const pause_dur = this.opts.pause_duration;

            const t = Math.min(elapsed / this.zoom_duration, 1.0);
            const easedT = 1 - Math.pow(1 - t, 2.5);

            let alpha = 1.0;
            if (elapsed > this.zoom_duration + pause_dur) {
                alpha = Math.max(0.0, 1.0 - (elapsed - this.zoom_duration - pause_dur) / this.fade_duration);
            }

            const target_w = w;
            const target_h = h;
            const img_w = this.anim_cell_photo.w;
            const img_h = this.anim_cell_photo.h;
            const img_ratio = img_w / img_h;

            let final_w, final_h;
            if ((target_w / target_h) > img_ratio) {
                final_h = target_h * 0.92;
                final_w = final_h * img_ratio;
            } else {
                final_w = target_w * 0.92;
                final_h = final_w / img_ratio;
            }

            const final_x = (target_w - final_w) / 2.0;
            const final_y = (target_h - final_h) / 2.0;

            const [src_x, src_y, src_w, src_h] = this.anim_source_rect;
            const current_x = src_x + (final_x - src_x) * easedT;
            const current_y = src_y + (final_y - src_y) * easedT;
            const current_w = src_w + (final_w - src_w) * easedT;
            const current_h = src_h + (final_h - src_h) * easedT;

            ctx.save();
            ctx.fillStyle = `rgba(15, 23, 42, ${0.55 * easedT * alpha})`;
            ctx.fillRect(0, 0, w, h);

            ctx.globalAlpha = alpha;
            ctx.shadowColor = "rgba(0, 0, 0, 0.45)";
            ctx.shadowBlur = 30;
            ctx.drawImage(this.anim_cell_photo.imgElement, current_x, current_y, current_w, current_h);

            ctx.shadowBlur = 0;
            ctx.fillStyle = "rgba(15, 23, 42, 0.75)";
            const labelText = `${this.anim_cell_photo.filename} (${this.anim_cell_photo.w} × ${this.anim_cell_photo.h})`;
            ctx.font = "500 12px Inter, sans-serif";
            const textW = ctx.measureText(labelText).width + 20;
            ctx.beginPath();
            ctx.roundRect(current_x + (current_w - textW) / 2, current_y + current_h - 34, textW, 24, 12);
            ctx.fill();
            ctx.fillStyle = "#ffffff";
            ctx.textAlign = "center";
            ctx.fillText(labelText, current_x + current_w / 2, current_y + current_h - 18);
            ctx.restore();
        }
    }

    motion_notify_event(evt) {
        if (!this.renderedImageCanvas || !this.collage || !this.collage.page) return;
        [this.x, this.y] = this.get_pos_in_image(evt.offsetX, evt.offsetY);
        if (!this.animating) {
            this.on_paint();
        }
    }

    button_press_event(evt) {
        this.canvas.focus();
        if (this.animating) {
            if (this.is_running_sequential_zoom) {
                this.cancel_sequential_zoom();
            } else {
                this.stop_single_zoom();
            }
            return;
        }
        if (this.mode !== MODE.FLYING || !this.collage || !this.collage.page) return;

        const [x, y] = this.get_pos_in_image(evt.offsetX, evt.offsetY);
        const cell = this.collage.page.get_cell_at_position(x, y);

        if (cell && this.is_over_delete_button(cell, x, y)) {
            this.delete_cell(cell);
            return;
        }

        this.press_raw_x = evt.offsetX;
        this.press_raw_y = evt.offsetY;
        this.x = x;
        this.y = y;

        const [closest_cell, edge, dist] = this.get_closest_edge(x, y);
        const edge_threshold = 12;

        if (closest_cell && dist <= edge_threshold) {
            this.mode = MODE.RESIZING;
            this.swap_origin.cell = closest_cell;
            this.swap_origin.x = x;
            this.swap_origin.y = y;

            const cols = this.collage.page.cols;

            if (edge === "left" || edge === "right") {
                this.resize_type = "horizontal";
                this.resize_edge = edge;

                const boundaryCol = (edge === "right")
                    ? closest_cell.parents[closest_cell.parents.length - 1]
                    : closest_cell.parents[0];

                this.resize_col = boundaryCol;
                this.resize_start_col_w = boundaryCol ? boundaryCol.w : closest_cell.w;
                this.neighbor_col = null;

                if (boundaryCol && cols.includes(boundaryCol)) {
                    const c_idx = cols.indexOf(boundaryCol);
                    if (edge === "right" && c_idx + 1 < cols.length) {
                        this.neighbor_col = cols[c_idx + 1];
                        this.resize_start_neighbor_col_w = this.neighbor_col.w;
                    } else if (edge === "left" && c_idx - 1 >= 0) {
                        this.neighbor_col = cols[c_idx - 1];
                        this.resize_start_neighbor_col_w = this.neighbor_col.w;
                    }
                }
            } else if (edge === "top" || edge === "bottom") {
                this.resize_type = "vertical";
                this.resize_edge = edge;

                const parent_container = closest_cell.parents[0];
                const cells_in_col = parent_container ? parent_container.cells : [];
                this.resize_start_cell_h = closest_cell.h;
                this.neighbor_cell = null;

                if (cells_in_col.includes(closest_cell)) {
                    const c_idx = cells_in_col.indexOf(closest_cell);
                    if (edge === "bottom" && c_idx + 1 < cells_in_col.length) {
                        this.neighbor_cell = cells_in_col[c_idx + 1];
                        this.resize_start_neighbor_cell_h = this.neighbor_cell.h;
                    } else if (edge === "top" && c_idx - 1 >= 0) {
                        this.neighbor_cell = cells_in_col[c_idx - 1];
                        this.resize_start_neighbor_cell_h = this.neighbor_cell.h;
                    }
                }
            }
        } else if (cell) {
            this.mode = MODE.SWAPPING_OR_MOVING;
            this.swap_origin.cell = cell;
            this.swap_origin.x = x;
            this.swap_origin.y = y;
        }

        this.on_paint();
    }

    button_release_event(evt) {
        if (this.animating) return;

        if (this.mode === MODE.RESIZING) {
            const dx = evt.offsetX - this.press_raw_x;
            const dy = evt.offsetY - this.press_raw_y;
            const MIN_SIZE = 20;
            let changed = false;

            if (this.resize_type === "horizontal" && this.resize_col && this.neighbor_col) {
                if (this.resize_edge === "right") {
                    const new_col_w = this.resize_start_col_w + dx;
                    const new_neighbor_w = this.resize_start_neighbor_col_w - dx;
                    if (new_col_w >= MIN_SIZE && new_neighbor_w >= MIN_SIZE) {
                        this.resize_col.w = new_col_w;
                        this.neighbor_col.w = new_neighbor_w;
                        changed = true;
                    }
                } else if (this.resize_edge === "left") {
                    const new_col_w = this.resize_start_col_w - dx;
                    const new_neighbor_w = this.resize_start_neighbor_col_w + dx;
                    if (new_col_w >= MIN_SIZE && new_neighbor_w >= MIN_SIZE) {
                        this.resize_col.w = new_col_w;
                        this.neighbor_col.w = new_neighbor_w;
                        changed = true;
                    }
                }
            } else if (this.resize_type === "vertical" && this.swap_origin.cell && this.neighbor_cell) {
                const cell = this.swap_origin.cell;
                const target_cell = cell.is_extension() ? cell.origin : cell;
                const target_neighbor = this.neighbor_cell.is_extension() ? this.neighbor_cell.origin : this.neighbor_cell;

                if (this.resize_edge === "bottom") {
                    const new_cell_h = this.resize_start_cell_h + dy;
                    const new_neighbor_h = this.resize_start_neighbor_cell_h - dy;
                    if (new_cell_h >= MIN_SIZE && new_neighbor_h >= MIN_SIZE) {
                        target_cell.h = new_cell_h;
                        target_neighbor.h = new_neighbor_h;
                        target_cell.is_manual = true;
                        target_neighbor.is_manual = true;
                        changed = true;
                    }
                } else if (this.resize_edge === "top") {
                    const new_cell_h = this.resize_start_cell_h - dy;
                    const new_neighbor_h = this.resize_start_neighbor_cell_h + dy;
                    if (new_cell_h >= MIN_SIZE && new_neighbor_h >= MIN_SIZE) {
                        target_cell.h = new_cell_h;
                        target_neighbor.h = new_neighbor_h;
                        target_cell.is_manual = true;
                        target_neighbor.is_manual = true;
                        changed = true;
                    }
                }
            }

            this.mode = MODE.FLYING;
            if (changed && this.collage) {
                this.render_from_new_collage(this.collage);
            } else {
                this.on_paint();
            }
        } else if (this.mode === MODE.SWAPPING_OR_MOVING) {
            const drag_distance = Math.sqrt(
                (evt.offsetX - this.press_raw_x) ** 2 +
                (evt.offsetY - this.press_raw_y) ** 2
            );

            if (drag_distance < 4) {
                const clickedCell = this.swap_origin.cell;
                this.mode = MODE.FLYING;
                this.swap_origin.cell = null;
                this.start_zoom_fade_animation(clickedCell);
                return;
            }

            [this.swap_dest.x, this.swap_dest.y] = this.get_pos_in_image(evt.offsetX, evt.offsetY);
            this.swap_dest.cell = (this.collage && this.collage.page)
                ? this.collage.page.get_cell_at_position(this.swap_dest.x, this.swap_dest.y)
                : null;

            if (this.swap_dest.cell && this.swap_origin.cell !== this.swap_dest.cell) {
                this.collage.page.swap_photos(this.swap_origin.cell, this.swap_dest.cell);
                this.render_from_new_collage(this.collage);
            } else if (this.swap_origin.cell) {
                const move_x = (this.swap_origin.x - this.x) / this.swap_origin.cell.w;
                const move_y = (this.swap_origin.y - this.y) / this.swap_origin.cell.h;
                this.swap_origin.cell.photo.move(move_x, move_y);
                this.render_from_new_collage(this.collage);
            }

            this.mode = MODE.FLYING;
            this.swap_origin.cell = null;
            this.on_paint();
        }
    }

    start_zoom_fade_animation(cell) {
        if (!cell || this.animating) return;
        this.anim_cell_photo = cell.photo;
        const [x0, y0] = this.get_image_offset();
        this.anim_source_rect = [x0 + cell.x, y0 + cell.y, cell.w, cell.h];

        const pause_dur = this.opts.pause_duration;
        this.anim_duration = this.zoom_duration + pause_dur + this.fade_duration;
        this.anim_start_time = performance.now();
        this.animating = true;
        this.on_zoom_complete_callback = null;

        this.runAnimationLoop();
    }

    start_sequential_zoom(cell, on_done_callback) {
        if (this.animating || !cell) return false;
        this.on_zoom_complete_callback = on_done_callback;
        this.anim_cell_photo = cell.photo;
        const [x0, y0] = this.get_image_offset();
        this.anim_source_rect = [x0 + cell.x, y0 + cell.y, cell.w, cell.h];

        const pause_dur = this.opts.pause_duration;
        this.anim_duration = this.zoom_duration + pause_dur + this.fade_duration;
        this.anim_start_time = performance.now();
        this.animating = true;

        this.runAnimationLoop();
        return true;
    }

    runAnimationLoop() {
        if (!this.animating) return;
        const elapsed = (performance.now() - this.anim_start_time) / 1000.0;

        if (elapsed >= this.anim_duration) {
            this.animating = false;
            this.anim_cell_photo = null;
            this.on_paint();

            if (this.on_zoom_complete_callback) {
                const cb = this.on_zoom_complete_callback;
                this.on_zoom_complete_callback = null;
                cb();
            }
            return;
        }

        this.on_paint();
        this.animFrameId = requestAnimationFrame(() => this.runAnimationLoop());
    }

    stop_single_zoom() {
        if (this.animating) {
            this.animating = false;
            this.anim_cell_photo = null;
            if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
            this.on_paint();
        }
    }

    stop_sequential_zoom() {
        if (this.animating) {
            this.animating = false;
            this.anim_cell_photo = null;
            this.on_zoom_complete_callback = null;
            if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
            this.on_paint();
        }
    }

    get_layout_cells() {
        const cells = [];
        if (this.collage && this.collage.page && this.collage.page.cols) {
            for (const col of this.collage.page.cols) {
                for (const cell of col.cells) {
                    if (!cell.is_extension()) {
                        cells.push(cell);
                    }
                }
            }
        }
        return cells;
    }

    on_zoom_all_clicked() {
        if (!this.collage || !this.collage.page || !this.collage.page.cols.length) return;

        if (this.is_running_sequential_zoom) {
            this.cancel_sequential_zoom();
            return;
        }

        this.zoom_queue = this.get_layout_cells();
        if (!this.zoom_queue.length) return;

        this.is_running_sequential_zoom = true;
        const lbl = document.getElementById("lblZoomAll");
        if (lbl) lbl.textContent = "Stop";
        const hud = document.getElementById("zoomHud");
        if (hud) hud.classList.remove("hidden");
        this.current_cell = null;
        this.process_next_zoom_queue_item();
    }

    process_next_zoom_queue_item() {
        if (!this.is_running_sequential_zoom) return;
        if (!this.zoom_queue.length) {
            this.reset_sequential_zoom_ui();
            return;
        }

        const allCells = this.get_layout_cells();
        this.current_cell = this.zoom_queue.shift();
        const currentIdx = allCells.indexOf(this.current_cell) + 1;
        const hudStatus = document.getElementById("lblHudStatus");
        if (hudStatus) hudStatus.textContent = `Previewing ${currentIdx} / ${allCells.length}: ${this.current_cell.photo.filename}`;

        const success = this.start_sequential_zoom(this.current_cell, () => {
            this.process_next_zoom_queue_item();
        });

        if (!success) {
            setTimeout(() => this.process_next_zoom_queue_item(), 0);
        }
    }

    navigate_sequential_preview(forward = true) {
        this.stop_sequential_zoom();
        const all_cells = this.get_layout_cells();
        if (!all_cells.length) return;

        if (forward) {
            if (this.zoom_queue.length > 0) {
                this.process_next_zoom_queue_item();
            } else {
                this.reset_sequential_zoom_ui();
            }
        } else {
            const curr_idx = all_cells.includes(this.current_cell) ? all_cells.indexOf(this.current_cell) : 0;
            const prev_idx = curr_idx - 1;
            if (prev_idx >= 0) {
                this.zoom_queue = all_cells.slice(prev_idx);
            } else {
                this.zoom_queue = all_cells.slice();
            }
            this.process_next_zoom_queue_item();
        }
    }

    cancel_sequential_zoom() {
        this.is_running_sequential_zoom = false;
        this.zoom_queue = [];
        this.current_cell = null;
        this.stop_sequential_zoom();
        this.reset_sequential_zoom_ui();
    }

    reset_sequential_zoom_ui() {
        this.is_running_sequential_zoom = false;
        this.current_cell = null;
        const lbl = document.getElementById("lblZoomAll");
        if (lbl) lbl.textContent = "Preview All";
        const hud = document.getElementById("zoomHud");
        if (hud) hud.classList.add("hidden");
    }

    on_window_key_press(event) {
        if (["INPUT", "SELECT", "TEXTAREA"].includes(document.activeElement?.tagName)) {
            return;
        }

        if (event.key === "Delete" || event.key === "Backspace") {
            event.preventDefault();
            this.delete_hovered_photo();
            return;
        }

        if (this.is_running_sequential_zoom) {
            if (event.key === "ArrowLeft") {
                event.preventDefault();
                this.navigate_sequential_preview(false);
                return;
            } else if (event.key === "ArrowRight") {
                event.preventDefault();
                this.navigate_sequential_preview(true);
                return;
            } else if (event.key === "Escape" || event.key === " ") {
                event.preventDefault();
                this.cancel_sequential_zoom();
                return;
            }
        }

        if (this.animating) {
            this.stop_single_zoom();
        }
    }

    initSettingsModalBindings() {
        const etrOutW = document.getElementById("etrOutW");
        const etrOutH = document.getElementById("etrOutH");
        const cmbTemplate = document.getElementById("cmbTemplate");
        const chkLandscape = document.getElementById("chkLandscape");
        const chkRandomLoc = document.getElementById("chkRandomLoc");
        const thicknessScale = document.getElementById("thicknessScale");
        const colorButton = document.getElementById("colorButton");
        const pauseScale = document.getElementById("pauseScale");

        if (!etrOutW || !etrOutH) return;

        const onSizeChanged = () => {
            if (!this.updating_live) {
                this.trigger_live_update();
                this.check_for_matching_template();
            }
        };
        etrOutW.addEventListener("input", onSizeChanged);
        etrOutH.addEventListener("input", onSizeChanged);

        if (cmbTemplate) {
            cmbTemplate.addEventListener("change", () => {
                const idx = cmbTemplate.selectedIndex;
                if (idx >= 0 && idx < this.current_templates.length) {
                    const dims = this.current_templates[idx][1];
                    if (dims) {
                        this.updating_live = true;
                        etrOutW.value = String(dims[0]);
                        etrOutH.value = String(dims[1]);
                        this.updating_live = false;
                        this.trigger_live_update();
                    }
                    this.check_for_matching_template();
                }
            });
        }

        if (chkLandscape) {
            chkLandscape.addEventListener("change", () => {
                this.update_templates_dropdown();
                this.enforce_orientation_constraint();
                this.trigger_live_update();
                this.check_for_matching_template();
            });
        }

        if (chkRandomLoc) {
            chkRandomLoc.addEventListener("change", () => {
                this.update_border_controls_visibility();
                this.trigger_live_update();
            });
        }

        if (thicknessScale) {
            thicknessScale.addEventListener("input", () => {
                const val = parseInt(thicknessScale.value, 10) || 0;
                const lbl = document.getElementById("lblThicknessVal");
                if (lbl) lbl.textContent = `${val} (${(val / 10).toFixed(1)}%)`;
                this.trigger_live_update();
            });
        }

        if (colorButton) {
            colorButton.addEventListener("input", () => {
                this.trigger_live_update();
            });
        }

        if (pauseScale) {
            pauseScale.addEventListener("input", () => {
                const val = parseInt(pauseScale.value, 10) || 0;
                const lbl = document.getElementById("lblPauseVal");
                if (lbl) lbl.textContent = `${val} (${(val / 10).toFixed(1)}s)`;
                this.trigger_live_update();
            });
        }

        const btnOk = document.getElementById("btnSettingsOk");
        if (btnOk) {
            btnOk.addEventListener("click", () => {
                this.apply_opts(this.opts);
                const modal = document.getElementById("settingsModal");
                if (modal) modal.classList.add("hidden");
                if (this.history.length > 0) {
                    this.render_preview(true);
                }
            });
        }

        const btnCancel = document.getElementById("btnSettingsCancel");
        if (btnCancel) {
            btnCancel.addEventListener("click", () => {
                if (this.savedOptsSnapshot) {
                    Object.assign(this.opts, this.savedOptsSnapshot);
                }
                const modal = document.getElementById("settingsModal");
                if (modal) modal.classList.add("hidden");
                if (this.history.length > 0) {
                    this.render_preview(false);
                }
            });
        }
    }

    openSettingsModal() {
        this.cancel_sequential_zoom();
        this.stop_single_zoom();

        this.savedOptsSnapshot = { ...this.opts };

        this.updating_live = true;
        document.getElementById("etrOutW").value = String(this.opts.out_w);
        document.getElementById("etrOutH").value = String(this.opts.out_h);
        document.getElementById("chkLandscape").checked = this.opts.out_w >= this.opts.out_h;
        document.getElementById("chkRandomLoc").checked = this.opts.picture_gap > 0;

        const pctVal = Math.round(this.opts.border_w * 1000.0);
        document.getElementById("thicknessScale").value = String(pctVal);
        const lblThick = document.getElementById("lblThicknessVal");
        if (lblThick) lblThick.textContent = `${pctVal} (${(pctVal / 10).toFixed(1)}%)`;

        document.getElementById("colorButton").value = colorNameToHex(this.opts.border_c);

        const pauseVal = Math.round(this.opts.pause_duration * 10);
        document.getElementById("pauseScale").value = String(pauseVal);
        const lblPause = document.getElementById("lblPauseVal");
        if (lblPause) lblPause.textContent = `${pauseVal} (${(pauseVal / 10).toFixed(1)}s)`;

        this.update_templates_dropdown();
        this.update_border_controls_visibility();
        this.updating_live = false;

        const modal = document.getElementById("settingsModal");
        if (modal) modal.classList.remove("hidden");
    }

    update_border_controls_visibility() {
        const chk = document.getElementById("chkRandomLoc");
        const showControls = chk ? !chk.checked : true;
        const container = document.getElementById("borderControlsContainer");
        if (!container) return;
        if (showControls) container.classList.remove("hidden");
        else container.classList.add("hidden");
    }

    update_templates_dropdown() {
        const chk = document.getElementById("chkLandscape");
        const isLandscape = chk ? chk.checked : true;
        this.current_templates = isLandscape ? this.landscape_templates : this.portrait_templates;

        const cmb = document.getElementById("cmbTemplate");
        if (!cmb) return;
        cmb.innerHTML = "";
        for (const [label] of this.current_templates) {
            const opt = document.createElement("option");
            opt.textContent = label;
            cmb.appendChild(opt);
        }
        this.check_for_matching_template();
    }

    check_for_matching_template() {
        let match_index = 0;
        const wVal = parseInt(document.getElementById("etrOutW").value, 10);
        const hVal = parseInt(document.getElementById("etrOutH").value, 10);

        if (!isNaN(wVal) && !isNaN(hVal)) {
            for (let i = 0; i < this.current_templates.length; i++) {
                const dims = this.current_templates[i][1];
                if (dims && dims[0] === wVal && dims[1] === hVal) {
                    match_index = i;
                    break;
                }
            }
        }
        const cmb = document.getElementById("cmbTemplate");
        if (cmb) cmb.selectedIndex = match_index;
    }

    enforce_orientation_constraint() {
        const etrOutW = document.getElementById("etrOutW");
        const etrOutH = document.getElementById("etrOutH");
        if (!etrOutW || !etrOutH) return;
        const w = parseInt(etrOutW.value, 10);
        const h = parseInt(etrOutH.value, 10);
        const chk = document.getElementById("chkLandscape");
        const is_landscape = chk ? chk.checked : true;

        if (!isNaN(w) && !isNaN(h)) {
            if ((is_landscape && w < h) || (!is_landscape && w > h)) {
                this.updating_live = true;
                etrOutW.value = String(h);
                etrOutH.value = String(w);
                this.updating_live = false;
            }
        }
    }

    trigger_live_update() {
        this.apply_opts(this.opts);
        this.render_preview(false);
    }

    apply_opts(opts) {
        this.enforce_orientation_constraint();
        const etrW = document.getElementById("etrOutW");
        const etrH = document.getElementById("etrOutH");
        const wVal = etrW ? parseInt(etrW.value, 10) : 800;
        const hVal = etrH ? parseInt(etrH.value, 10) : 600;
        opts.out_w = (!isNaN(wVal) && wVal >= 100) ? wVal : 800;
        opts.out_h = (!isNaN(hVal) && hVal >= 100) ? hVal : 600;

        const thickEl = document.getElementById("thicknessScale");
        const thickVal = thickEl ? (parseFloat(thickEl.value) || 0) : 10;
        opts.border_w = (thickVal / 10.0) / 100.0;

        const colEl = document.getElementById("colorButton");
        opts.border_c = colEl ? colEl.value : "#000000";

        const pauseEl = document.getElementById("pauseScale");
        const pauseVal = pauseEl ? (parseFloat(pauseEl.value) || 0) : 5;
        opts.pause_duration = pauseVal / 10.0;

        const chkRand = document.getElementById("chkRandomLoc");
        opts.picture_gap = (chkRand && chkRand.checked) ? 20 : 0;
    }

    openSaveModal() {
        if (!this.history.length || this.history_index < 0) return;
        const lbl = document.getElementById("lblSaveDims");
        if (lbl) lbl.textContent = `${this.opts.out_w} × ${this.opts.out_h}`;
        const modal = document.getElementById("saveModal");
        if (modal) modal.classList.remove("hidden");
    }

    executeSavePoster() {
        if (!this.history.length || this.history_index < 0) return;
        const modal = document.getElementById("saveModal");
        if (modal) modal.classList.add("hidden");

        const fmtEl = document.getElementById("saveFormat");
        const format = fmtEl ? fmtEl.value : "image/png";

        if (format === "video/animation") {
            this.executeExportAnimationVideo();
        } else if (format === "extract/images") {
            this.executeExtractAllImages();
        } else {
            this.executeExportSingleImage(format);
        }
    }

    executeExportSingleImage(mimeType) {
        this.showComputingDialog(true, "Rendering high-resolution poster...");
        this.updateComputingDialog(0.3);

        setTimeout(() => {
            try {
                const exportCollage = this.history[this.history_index].duplicate();
                exportCollage.page.target_ratio = (1.0 * this.opts.out_h) / this.opts.out_w;
                exportCollage.page.adjust_cols_heights();
                exportCollage.page.fix_voids();
                exportCollage.page.scale_to_fit(this.opts.out_w, this.opts.out_h);

                const finalCanvas = renderCollageToCanvas(exportCollage.page, this.opts, 1.0);
                this.updateComputingDialog(0.85);

                const extMap = {
                    "image/png": "png",
                    "image/jpeg": "jpg",
                    "image/webp": "webp"
                };
                const ext = extMap[mimeType] || "png";
                const fnEl = document.getElementById("saveFilename");
                const rawName = (fnEl ? fnEl.value : "photocollage-poster").trim();
                const filename = `${rawName.replace(/\.(png|jpg|jpeg|webp)$/i, "")}.${ext}`;

                finalCanvas.toBlob((blob) => {
                    this.showComputingDialog(false);
                    if (!blob) {
                        showToast("Failed to encode poster image.", "error");
                        return;
                    }
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = filename;
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    setTimeout(() => URL.revokeObjectURL(url), 5000);
                    showToast(`Poster saved as "${filename}" (${finalCanvas.width} × ${finalCanvas.height} px)!`, "success");
                }, mimeType, 0.95);
            } catch (err) {
                this.showComputingDialog(false);
                showToast(`Failed to save poster: ${err.message}`, "error");
            }
        }, 60);
    }

    executeExportAnimationVideo() {
        const collage = this.history[this.history_index];
        if (!collage || !collage.page) return;

        const cells = this.get_layout_cells();
        if (!cells.length) {
            showToast("No photos available to animate.", "error");
            return;
        }

        let outW = this.opts.out_w;
        let outH = this.opts.out_h;
        const maxDim = 1920;
        if (Math.max(outW, outH) > maxDim) {
            const scale = maxDim / Math.max(outW, outH);
            outW = Math.round(outW * scale);
            outH = Math.round(outH * scale);
        }
        outW = (outW % 2 === 0) ? outW : outW + 1;
        outH = (outH % 2 === 0) ? outH : outH + 1;

        this.showComputingDialog(true, "Recording animation video...");
        this.updateComputingDialog(0.05);

        const exportCollage = collage.duplicate();
        exportCollage.page.target_ratio = (1.0 * outH) / outW;
        exportCollage.page.adjust_cols_heights();
        exportCollage.page.fix_voids();
        exportCollage.page.scale_to_fit(outW, outH);
        const basePosterCanvas = renderCollageToCanvas(exportCollage.page, this.opts, 1.0);

        const recCanvas = document.createElement("canvas");
        recCanvas.width = outW;
        recCanvas.height = outH;
        const recCtx = recCanvas.getContext("2d");

        let mimeType = "video/webm;codecs=vp9";
        if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp8") 
                ? "video/webm;codecs=vp8" 
                : "video/webm";
        }

        const stream = recCanvas.captureStream(30);
        let mediaRecorder;
        try {
            mediaRecorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 8000000 });
        } catch (e) {
            this.showComputingDialog(false);
            showToast("Video recording not supported in this browser.", "error");
            return;
        }

        const chunks = [];
        mediaRecorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) chunks.push(e.data);
        };

        mediaRecorder.onstop = () => {
            const blob = new Blob(chunks, { type: "video/webm" });
            const url = URL.createObjectURL(blob);
            const fnEl = document.getElementById("saveFilename");
            const rawName = (fnEl ? fnEl.value : "photocollage-animation").trim();
            const filename = `${rawName.replace(/\.(webm|mp4|png|jpg)$/i, "")}.webm`;

            const a = document.createElement("a");
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            a.remove();
            setTimeout(() => URL.revokeObjectURL(url), 5000);

            this.showComputingDialog(false);
            showToast(`Animation video saved as "${filename}"!`, "success");
        };

        mediaRecorder.start();

        const zoomDur = 1.0;
        const pauseDur = Math.max(0.5, this.opts.pause_duration);
        const fadeDur = 0.8;
        const cellCycleDur = zoomDur + pauseDur + fadeDur;
        const introDur = 1.5;
        const outroDur = 2.0;
        const totalDur = introDur + (cells.length * cellCycleDur) + outroDur;

        const fps = 30;
        const totalFrames = Math.round(totalDur * fps);
        let currentFrame = 0;

        const drawFrame = () => {
            const time = currentFrame / fps;

            recCtx.drawImage(basePosterCanvas, 0, 0, outW, outH);

            if (time >= introDur && time < introDur + (cells.length * cellCycleDur)) {
                const animTime = time - introDur;
                const cellIdx = Math.floor(animTime / cellCycleDur);
                const cellTime = animTime % cellCycleDur;
                const cell = cells[cellIdx];

                if (cell && cell.photo && cell.photo.imgElement) {
                    const img = cell.photo.imgElement;
                    const imgRatio = cell.photo.w / cell.photo.h;
                    let finalW, finalH;

                    if ((outW / outH) > imgRatio) {
                        finalH = outH * 0.92;
                        finalW = finalH * imgRatio;
                    } else {
                        finalW = outW * 0.92;
                        finalH = finalW / imgRatio;
                    }

                    const finalX = (outW - finalW) / 2;
                    const finalY = (outH - finalH) / 2;

                    let t = 0;
                    let alpha = 1.0;

                    if (cellTime < zoomDur) {
                        t = 1 - Math.pow(1 - (cellTime / zoomDur), 2.5);
                    } else if (cellTime < zoomDur + pauseDur) {
                        t = 1.0;
                    } else {
                        t = 1.0;
                        alpha = Math.max(0.0, 1.0 - ((cellTime - zoomDur - pauseDur) / fadeDur));
                    }

                    const curX = cell.x + (finalX - cell.x) * t;
                    const curY = cell.y + (finalY - cell.y) * t;
                    const curW = cell.w + (finalW - cell.w) * t;
                    const curH = cell.h + (finalH - cell.h) * t;

                    recCtx.save();
                    recCtx.fillStyle = `rgba(15, 23, 42, ${0.6 * t * alpha})`;
                    recCtx.fillRect(0, 0, outW, outH);

                    recCtx.globalAlpha = alpha;
                    recCtx.shadowColor = "rgba(0, 0, 0, 0.45)";
                    recCtx.shadowBlur = 25;
                    recCtx.drawImage(img, curX, curY, curW, curH);

                    recCtx.shadowBlur = 0;
                    recCtx.fillStyle = "rgba(15, 23, 42, 0.75)";
                    const labelText = `${cell.photo.filename} (${cell.photo.w} × ${cell.photo.h})`;
                    recCtx.font = "500 16px Inter, sans-serif";
                    const textW = recCtx.measureText(labelText).width + 24;
                    recCtx.beginPath();
                    recCtx.roundRect(curX + (curW - textW) / 2, curY + curH - 42, textW, 30, 15);
                    recCtx.fill();
                    recCtx.fillStyle = "#ffffff";
                    recCtx.textAlign = "center";
                    recCtx.fillText(labelText, curX + curW / 2, curY + curH - 22);
                    recCtx.restore();
                }
            }

            currentFrame++;
            this.updateComputingDialog(currentFrame / totalFrames);

            if (currentFrame < totalFrames) {
                requestAnimationFrame(drawFrame);
            } else {
                mediaRecorder.stop();
            }
        };

        requestAnimationFrame(drawFrame);
    }

    executeExtractAllImages() {
        const collage = this.history[this.history_index];
        if (!collage || !collage.photolist || !collage.photolist.length) {
            showToast("No images to extract.", "error");
            return;
        }

        const photos = collage.photolist;
        this.showComputingDialog(true, "Extracting images...");
        this.updateComputingDialog(0.05);

        let completed = 0;

        photos.forEach((photo, idx) => {
            setTimeout(() => {
                try {
                    const canvas = document.createElement("canvas");
                    canvas.width = photo.w;
                    canvas.height = photo.h;
                    const ctx = canvas.getContext("2d");

                    if (photo.imgElement) {
                        ctx.drawImage(photo.imgElement, 0, 0, photo.w, photo.h);
                    }

                    canvas.toBlob((blob) => {
                        if (blob) {
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement("a");
                            a.href = url;
                            
                            let outName = photo.filename;
                            if (!/\.(png|jpe?g|webp|gif)$/i.test(outName)) {
                                outName += ".png";
                            }
                            a.download = outName;
                            document.body.appendChild(a);
                            a.click();
                            a.remove();
                            setTimeout(() => URL.revokeObjectURL(url), 5000);
                        }

                        completed++;
                        this.updateComputingDialog(completed / photos.length);

                        if (completed === photos.length) {
                            setTimeout(() => {
                                this.showComputingDialog(false);
                                showToast(`Extracted ${completed} images successfully!`, "success");
                            }, 300);
                        }
                    }, "image/png");
                } catch (err) {
                    completed++;
                    if (completed === photos.length) {
                        this.showComputingDialog(false);
                    }
                }
            }, idx * 220);
        });
    }

    executeSaveProjectHtml() {
        if (!this.history.length || this.history_index < 0) return;
        const modal = document.getElementById("saveModal");
        if (modal) modal.classList.add("hidden");

        this.showComputingDialog(true, "Packaging project session into HTML...");
        this.updateComputingDialog(0.3);

        setTimeout(() => {
            try {
                const elementToDataUrl = (el) => {
                    if (!el) return null;
                    if (el.src && el.src.indexOf("data:") === 0) return el.src;
                    if (el.tagName === "CANVAS") {
                        try {
                            return el.toDataURL("image/png");
                        } catch (e) {
                            return null;
                        }
                    }
                    const cvs = document.createElement("canvas");
                    cvs.width = el.naturalWidth || el.width || 800;
                    cvs.height = el.naturalHeight || el.height || 600;
                    const ctx = cvs.getContext("2d");
                    try {
                        ctx.drawImage(el, 0, 0);
                        return cvs.toDataURL("image/jpeg", 0.92);
                    } catch (err) {
                        return null;
                    }
                };

                const serializedHistory = this.history.map((uc) => {
                    return {
                        photolist: uc.photolist.map((p) => ({
                            filename: p.filename,
                            w: p.w,
                            h: p.h,
                            orientation: p.orientation,
                            offset_w: p.offset_w,
                            offset_h: p.offset_h,
                            isVideo: p.isVideo,
                            dataUrl: elementToDataUrl(p.imgElement)
                        }))
                    };
                });

                const sessionData = {
                    opts: this.opts,
                    history_index: this.history_index,
                    history: serializedHistory
                };

                this.showComputingDialog(false);

                const htmlClone = document.documentElement.outerHTML;

                const tagEnd = '<\\/' + 'script>';
                const stripRegex = new RegExp('<script id="saved-session-payload">[\\s\\S]*?' + tagEnd, 'gi');
                let cleanHtml = htmlClone.replace(stripRegex, "");

                // Replace local script references with CDN paths so standalone HTML works anywhere
                cleanHtml = cleanHtml.replace(
                    /<script\s+src=["']?photocollage\.js["']?>\s*<\/script>/i,
                    '<script src="https://blendpy.github.io/vibe-web-dev/photocollage/photocollage.js"></script>'
                );
                cleanHtml = cleanHtml.replace(
                    /<script\s+src=["']?photocollage_demo\.js["']?>\s*<\/script>/i,
                    '<script src="https://blendpy.github.io/vibe-web-dev/photocollage/photocollage_demo.js"></script>'
                );
                cleanHtml = cleanHtml.replace(
                    /<script\s+src=["']?photocollage_appcontrol\.js["']?>\s*<\/script>/i,
                    '<script src="https://blendpy.github.io/vibe-web-dev/photocollage/photocollage_appcontrol.js"></script>'
                );

                const payloadScript = '\n<script id="saved-session-payload">\nwindow.SAVED_SESSION_DATA = ' + 
                    JSON.stringify(sessionData) + ';\n<' + '/script>';
                cleanHtml = cleanHtml.replace(/<\/body>/i, payloadScript + '\n<' + '/body>');

                const blob = new Blob([cleanHtml], { type: "text/html;charset=utf-8" });
                const url = URL.createObjectURL(blob);
                const fnEl = document.getElementById("saveFilename");
                const rawName = (fnEl ? fnEl.value : "photocollage-project").trim();
                const filename = `${rawName.replace(/\.(html|htm)$/i, "")}.html`;

                const a = document.createElement("a");
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                a.remove();
                setTimeout(() => URL.revokeObjectURL(url), 5000);

                showToast(`Project successfully saved as "${filename}"!`, "success");
            } catch (err) {
                this.showComputingDialog(false);
                showToast(`Failed to save project HTML: ${err.message}`, "error");
            }
        }, 80);
    }
}
