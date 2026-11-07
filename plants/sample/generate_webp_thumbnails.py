#!/usr/init/env python3
"""
WEBP Image Scanner and Thumbnail Creator

Scans the current working directory and all subdirectories for WebP images,
shows file dimensions in a Tkinter GUI, reports min/max dimensions, and
creates aspect-ratio-preserving thumbnails prefixed with "xx_" inside a
dedicated "thumbnails" subfolder in each source image's directory.

Dependency:
    python -m pip install Pillow

Run:
    python webp_thumbnail_gui.py
"""

import os
import threading
import tkinter as tk
from tkinter import ttk, messagebox
from pathlib import Path
from PIL import Image, ImageOps, UnidentifiedImageError

THUMB_PREFIX = "xx_"
THUMB_DIR_NAME = "thumbnails"
SUPPORTED_SUFFIX = ".webp"


class WebPThumbnailApp:
    def __init__(self, root):
        self.root = root
        self.root.title("WEBP Image Scanner and Thumbnail Creator")
        self.root.geometry("1000x680")
        self.root.minsize(760, 480)

        self.image_records = []
        self.scan_root = Path.cwd()
        self.scan_thread = None
        self.create_thread = None

        # Variables for settings
        self.width_var = tk.StringVar(value="170")
        self.height_var = tk.StringVar(value="170")
        self.quality_var = tk.StringVar(value="80")
        self.folder_var = tk.StringVar(value=str(self.scan_root))
        self.status_var = tk.StringVar(value="Ready")

        # Variables for dynamic statistics
        self.min_width_var = tk.StringVar(value="?")
        self.min_height_var = tk.StringVar(value="?")
        self.max_width_var = tk.StringVar(value="?")
        self.max_height_var = tk.StringVar(value="?")
        self.total_images_var = tk.StringVar(value="?")
        self.total_thumbs_var = tk.StringVar(value="?")

        # Reference to the dynamic button
        self.action_btn = None

        self._build_ui()
        self.root.after(100, self.scan_images)

    def _build_ui(self):
        outer = ttk.Frame(self.root, padding=10)
        outer.pack(fill="both", expand=True)

        # --- Folder Selection ---
        folder_frame = ttk.Frame(outer)
        folder_frame.pack(fill="x", pady=(0, 8))
        ttk.Label(folder_frame, text="Folder to scan:").pack(side="left")
        ttk.Entry(folder_frame, textvariable=self.folder_var).pack(
            side="left", fill="x", expand=True, padx=8
        )
        ttk.Button(folder_frame, text="Scan", command=self.scan_images).pack(side="left")

        # --- Settings and Stats Grid ---
        settings = ttk.LabelFrame(outer, text="Thumbnail settings", padding=8)
        settings.pack(fill="x", pady=(0, 8))

        # Column Headers
        ttk.Label(settings, text="Width", font=("", 9, "bold")).grid(row=0, column=1, pady=(0, 5))
        ttk.Label(settings, text="Height", font=("", 9, "bold")).grid(row=0, column=2, pady=(0, 5))

        # Row 1: Output Size & Quality
        ttk.Label(settings, text="Output Size:").grid(row=1, column=0, sticky="e", padx=5, pady=2)
        
        # Right-centered Entry fields for Width and Height
        w_entry = ttk.Entry(settings, textvariable=self.width_var, width=7, justify="right")
        w_entry.grid(row=1, column=1, padx=5, pady=2)
        h_entry = ttk.Entry(settings, textvariable=self.height_var, width=7, justify="right")
        h_entry.grid(row=1, column=2, padx=5, pady=2)
        
        ttk.Label(settings, text="WebP Quality (0-100):").grid(row=1, column=3, sticky="e", padx=(20, 5), pady=2)
        ttk.Entry(settings, textvariable=self.quality_var, width=7).grid(row=1, column=4, sticky="w", padx=5, pady=2)

        # Row 2: Current Min & Total Images Found
        ttk.Label(settings, text="Current Min:").grid(row=2, column=0, sticky="e", padx=5, pady=2)
        ttk.Label(settings, textvariable=self.min_width_var).grid(row=2, column=1, padx=5, pady=2)
        ttk.Label(settings, textvariable=self.min_height_var).grid(row=2, column=2, padx=5, pady=2)
        
        ttk.Label(settings, text="Total Images Found:").grid(row=2, column=3, sticky="e", padx=(20, 5), pady=2)
        ttk.Label(settings, textvariable=self.total_images_var).grid(row=2, column=4, sticky="w", padx=5, pady=2)

        # Row 3: Current Max & Total Thumbnails Needed
        ttk.Label(settings, text="Current Max:").grid(row=3, column=0, sticky="e", padx=5, pady=2)
        ttk.Label(settings, textvariable=self.max_width_var).grid(row=3, column=1, padx=5, pady=2)
        ttk.Label(settings, textvariable=self.max_height_var).grid(row=3, column=2, padx=5, pady=2)
        
        ttk.Label(settings, text="Total Thumbnails Needed:").grid(row=3, column=3, sticky="e", padx=(20, 5), pady=2)
        ttk.Label(settings, textvariable=self.total_thumbs_var).grid(row=3, column=4, sticky="w", padx=5, pady=2)

        # Action Button (Spanning Rows 1-3 in Column 5)
        self.action_btn = tk.Button(
            settings, 
            text="Create Thumbnails", 
            command=self.create_thumbnails, 
            bg="lightblue", 
            height=4, 
            font=("", 10, "bold")
        )
        self.action_btn.grid(row=1, column=5, rowspan=3, padx=(30, 5), pady=2, sticky="nsew")

        # Bottom Info Label
        ttk.Label(
            settings,
            text=f'Info: Output saves to "{THUMB_DIR_NAME}" subfolder, filename prefixed with "{THUMB_PREFIX}"',
            foreground="gray"
        ).grid(row=4, column=0, columnspan=6, pady=(10, 0), sticky="w")

        # --- File Listing ---
        listing = ttk.LabelFrame(outer, text="WEBP files", padding=6)
        listing.pack(fill="both", expand=True)

        columns = ("filename", "width", "height")
        self.tree = ttk.Treeview(listing, columns=columns, show="headings")
        self.tree.heading("filename", text="File")
        self.tree.heading("width", text="Width (px)")
        self.tree.heading("height", text="Height (px)")
        self.tree.column("filename", width=700, anchor="w")
        self.tree.column("width", width=90, anchor="e")
        self.tree.column("height", width=90, anchor="e")

        yscroll = ttk.Scrollbar(listing, orient="vertical", command=self.tree.yview)
        xscroll = ttk.Scrollbar(listing, orient="horizontal", command=self.tree.xview)
        self.tree.configure(yscrollcommand=yscroll.set, xscrollcommand=xscroll.set)

        self.tree.grid(row=0, column=0, sticky="nsew")
        yscroll.grid(row=0, column=1, sticky="ns")
        xscroll.grid(row=1, column=0, sticky="ew")
        listing.rowconfigure(0, weight=1)
        listing.columnconfigure(0, weight=1)

        # --- Status Footer ---
        bottom = ttk.Frame(outer)
        bottom.pack(fill="x", pady=(8, 0))
        self.progress = ttk.Progressbar(bottom, mode="determinate")
        self.progress.pack(side="left", fill="x", expand=True, padx=(0, 10))
        ttk.Label(bottom, textvariable=self.status_var).pack(side="left")

    def _get_scan_root(self):
        raw = self.folder_var.get().strip()
        if not raw:
            raise ValueError("Enter a folder to scan.")
        path = Path(raw).expanduser().resolve()
        if not path.is_dir():
            raise ValueError(f"This folder does not exist:\n{path}")
        return path

    def scan_images(self):
        if self.scan_thread and self.scan_thread.is_alive():
            return
        try:
            root_path = self._get_scan_root()
        except ValueError as exc:
            messagebox.showerror("Invalid folder", str(exc))
            return

        self.scan_root = root_path
        self._set_busy(True, "Scanning for WEBP files...")
        self.image_records = []
        for item in self.tree.get_children():
            self.tree.delete(item)
            
        self.min_width_var.set("?")
        self.max_width_var.set("?")
        self.min_height_var.set("?")
        self.max_height_var.set("?")
        self.total_images_var.set("...")
        self.total_thumbs_var.set("...")

        if self.action_btn:
            self.action_btn.config(text="Create Thumbnails", state="normal")

        self.scan_thread = threading.Thread(
            target=self._scan_worker, args=(root_path,), daemon=True
        )
        self.scan_thread.start()

    def _scan_worker(self, root_path):
        records = []
        errors = []
        try:
            for folder, dirs, files in os.walk(root_path):
                # Do not scan inside existing thumbnail directories
                dirs[:] = [d for d in dirs if d.lower() != THUMB_DIR_NAME.lower()]

                for filename in files:
                    path = Path(folder) / filename
                    if path.suffix.lower() != SUPPORTED_SUFFIX:
                        continue
                    # Skip thumbnail files if any exist outside thumbnail folders
                    if path.name.lower().startswith(THUMB_PREFIX.lower()):
                        continue
                    try:
                        with Image.open(path) as img:
                            width, height = img.size
                        records.append({
                            "path": path,
                            "width": width,
                            "height": height,
                        })
                    except (OSError, UnidentifiedImageError) as exc:
                        errors.append(f"{path}: {exc}")
        except Exception as exc:
            errors.append(str(exc))

        records.sort(key=lambda item: str(item["path"]).lower())
        self.root.after(0, self._finish_scan, records, errors)

    def update_thumbnail_counts(self):
        """Recalculate thumbnails needed based on image records."""
        if not self.image_records:
            return

        thumbs_needed = len(self.image_records)
        self.total_thumbs_var.set(str(thumbs_needed))

        if thumbs_needed == 0:
            self.action_btn.config(text="Nothing needs\nto be generated", state="disabled")
        else:
            self.action_btn.config(text="Create Thumbnails", state="normal")

    def _finish_scan(self, records, errors):
        self.image_records = records
        for record in records:
            try:
                shown_path = str(record["path"].relative_to(self.scan_root))
            except ValueError:
                shown_path = str(record["path"])
            self.tree.insert(
                "", "end",
                values=(shown_path, record["width"], record["height"]),
            )

        if records:
            widths = [r["width"] for r in records]
            heights = [r["height"] for r in records]
            
            # Update Grid Statistics
            self.min_width_var.set(str(min(widths)))
            self.max_width_var.set(str(max(widths)))
            self.min_height_var.set(str(min(heights)))
            self.max_height_var.set(str(max(heights)))
            self.total_images_var.set(str(len(records)))
            
            # Update counts
            self.update_thumbnail_counts()
        else:
            self.min_width_var.set("?")
            self.max_width_var.set("?")
            self.min_height_var.set("?")
            self.max_height_var.set("?")
            self.total_images_var.set("0")
            self.total_thumbs_var.set("0")
            if self.action_btn:
                self.action_btn.config(text="Nothing needs\nto be generated", state="disabled")

        status = f"Scan complete: {len(records)} image(s)"
        if errors:
            status += f"; {len(errors)} file(s) could not be read"
        self._set_busy(False, status)

        if errors:
            preview = "\n".join(errors[:8])
            if len(errors) > 8:
                preview += f"\n... and {len(errors) - 8} more."
            messagebox.showwarning("Some files could not be read", preview)

    def create_thumbnails(self):
        if self.create_thread and self.create_thread.is_alive():
            return
        if not self.image_records:
            messagebox.showinfo("No images", "Scan a folder with WEBP images first.")
            return

        try:
            max_width = int(self.width_var.get())
            max_height = int(self.height_var.get())
            quality = int(self.quality_var.get())
            if max_width <= 0 or max_height <= 0 or not 0 <= quality <= 100:
                raise ValueError
        except ValueError:
            messagebox.showerror(
                "Invalid settings",
                "Width and height must be positive whole numbers, and WEBP quality must be an integer from 0 to 100."
            )
            return

        records = list(self.image_records)
        self.progress["value"] = 0
        self.progress["maximum"] = len(records)
        self._set_busy(True, "Creating thumbnails...")

        self.create_thread = threading.Thread(
            target=self._thumbnail_worker,
            args=(records, max_width, max_height, quality),
            daemon=True,
        )
        self.create_thread.start()

    def _thumbnail_worker(self, records, max_width, max_height, quality):
        made = 0
        errors = []
        total = len(records)

        for index, record in enumerate(records, start=1):
            source = record["path"]
            thumb_folder = source.parent / THUMB_DIR_NAME
            output = thumb_folder / f"{THUMB_PREFIX}{source.name}"

            try:
                # Ensure the thumbnails directory exists before writing
                thumb_folder.mkdir(parents=True, exist_ok=True)

                with Image.open(source) as img:
                    img = ImageOps.exif_transpose(img)
                    img.thumbnail((max_width, max_height), Image.Resampling.LANCZOS)
                    img.save(output, format="WEBP", quality=quality, method=6)
                made += 1
            except Exception as exc:
                errors.append(f"{source}: {exc}")

            self.root.after(0, self._update_progress, index, total)

        self.root.after(0, self._finish_thumbnails, made, errors)

    def _update_progress(self, current, total):
        self.progress["maximum"] = max(total, 1)
        self.progress["value"] = current
        self.status_var.set(f"Creating thumbnails: {current}/{total}")

    def _finish_thumbnails(self, made, errors):
        self._set_busy(False, f"Finished: {made} thumbnail(s) created")
        if errors:
            preview = "\n".join(errors[:8])
            if len(errors) > 8:
                preview += f"\n... and {len(errors) - 8} more."
            messagebox.showwarning(
                "Thumbnail creation finished with errors",
                f"Created {made} thumbnail(s).\n\n{preview}",
            )
        else:
            messagebox.showinfo(
                "Complete",
                f"Created {made} thumbnail(s).\n"
                f"Each thumbnail is saved in a '{THUMB_DIR_NAME}' folder with the '{THUMB_PREFIX}' prefix."
            )
        self.scan_images()

    def _set_busy(self, busy, status):
        self.status_var.set(status)
        self.root.configure(cursor="watch" if busy else "")


def main():
    root = tk.Tk()
    app = WebPThumbnailApp(root)
    root.mainloop()


if __name__ == "__main__":
    main()
