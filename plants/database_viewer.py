#!/usr/bin/env python3
"""
Botanical Infographic Resizer & Naming Tool
Scans download directory for *.jpeg images, matches them to database plant IDs,
omits already-existing images in sample/{category}/{id}.webp, and resamples
assigned images to max 350x350 px saving directly as sample/{category}/{id}.webp.
"""

import os
import re
import glob
import shutil
from collections import defaultdict
import wx
from PIL import Image

# Directory where database files are stored
DB_DIR = "databases"

# Canonical category mapping with one JS database file per category inside databases/
CATEGORY_MAP = sorted([
    (f[:-len("_data.js")].capitalize(), f)
    for f in os.listdir(DB_DIR)
    if f.endswith("_data.js") and os.path.isfile(os.path.join(DB_DIR, f))
]) if os.path.exists(DB_DIR) else []

DUPLICATES_CAT = "DUPLICATES"
JPEG_OUTPUT_DIR = "jpeg_images"
REQUIRED_PLANT_FIELDS = [
    "name", "botanical", "zone", "climates", "sun", "water",
    "size", "cost", "lifespan", "ornamental", "propagation", "notes",
]

EXPORT_FIELD_OPTIONS = [
    "None",
    "origin",
    "flower",
    "zone",
    "climates",
    "sun",
    "water",
    "cost",
    "lifespan",
    "ornamental",
    "propagation",
    "notes",
]

DEFAULT_FIND = " [find] "
DEFAULT_REPLACE = " [replace] "
DEFAULT_SUFFIX = "_data.js"


def load_database_plants():
    """Parses local .js files in databases/ to extract {category: [(id, name, subcategory), ...]} robustly."""
    catalog = {}
    for cat_name, js_file in CATEGORY_MAP:
        catalog[cat_name] = []
        file_path = os.path.join(DB_DIR, js_file)
        if not os.path.exists(file_path):
            print(f"Warning: Could not find database file '{file_path}'")
            continue

        try:
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()

            # Match individual object blocks: { ... }
            blocks = re.findall(r'\{([^{}]+)\}', content)
            for block in blocks:
                id_match = re.search(r'["\']?id["\']?\s*:\s*["\']([^"\']+)["\']', block)
                name_match = re.search(r'["\']?name["\']?\s*:\s*["\']([^"\']+)["\']', block)
                subcat_match = re.search(r'["\']?subcategory["\']?\s*:\s*["\']([^"\']+)["\']', block)
                if id_match and name_match:
                    pid = id_match.group(1).strip()
                    pname = name_match.group(1).strip()
                    subcat = subcat_match.group(1).strip() if subcat_match else "General"
                    catalog[cat_name].append((pid, pname, subcat))
        except Exception as e:
            print(f"Error loading {file_path}: {e}")

    return catalog


def scan_category_for_missing(target_cat_name):
    """
    Parses object blocks from the JavaScript database file of target_cat_name in databases/.
    Extracts strings, arrays, booleans, and numbers, normalizing all keys to lowercase
    and resolving common aliases (infographic/infographics, sun/light, notes/description).
    """
    js_file = None
    for cat_name, file_name in CATEGORY_MAP:
        if cat_name == target_cat_name:
            js_file = file_name
            break

    if not js_file:
        return []

    file_path = os.path.join(DB_DIR, js_file)
    if not os.path.exists(file_path):
        return []

    prop_pattern = re.compile(
        r'["\']?(\w+)["\']?\s*:\s*(?:"([^"]*)"|\'([^\']*)\'|\[([\s\S]*?)\]|([^,\r\n}]+))'
    )

    missing_entries = []
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()

        object_blocks = re.findall(r'\{([^{}]+)\}', content)

        for block in object_blocks:
            raw_pairs = {}
            for m in prop_pattern.finditer(block):
                k = m.group(1).lower()
                v = (
                    m.group(2) if m.group(2) is not None else
                    m.group(3) if m.group(3) is not None else
                    m.group(4) if m.group(4) is not None else
                    m.group(5)
                )
                if v is not None:
                    raw_pairs[k] = v.strip().rstrip(",")

            pid = raw_pairs.get("id", "").strip()
            if not pid:
                continue

            missing_keys = []
            for field in REQUIRED_PLANT_FIELDS:
                f_norm = field.strip().lower()

                # Check direct match first
                val = raw_pairs.get(f_norm, "")

                # Strip quotes/brackets if any remain
                if isinstance(val, str):
                    val = val.strip().strip("[]'\"")

                if not val:
                    missing_keys.append(field)

            if missing_keys:
                pname = raw_pairs.get("name", pid).strip()
                disp = f"{pname}  [{pid}] — Missing: {', '.join(missing_keys)}"
                missing_entries.append((disp, pid))

    except Exception as e:
        print(f"Error checking missing entries in {file_path}: {e}")

    return sorted(missing_entries, key=lambda x: x[0].lower())


class FindReplaceDialog(wx.Dialog):
    """Dialog for finding and replacing text across JS database files."""
    def __init__(self, parent):
        super().__init__(parent, title="JS Data File Find & Replace", size=(580, 560))
        self.parent = parent

        initial_dir = os.path.abspath(DB_DIR) if os.path.exists(DB_DIR) else os.getcwd()
        self.selected_dir = initial_dir

        self.init_ui()
        self.CentreOnParent()

    def init_ui(self):
        panel = wx.Panel(self)
        main_sizer = wx.BoxSizer(wx.VERTICAL)

        # 1. Directory Selection
        dir_box = wx.BoxSizer(wx.HORIZONTAL)
        dir_lbl = wx.StaticText(panel, label="Target Directory:")
        dir_box.Add(dir_lbl, 0, wx.ALIGN_CENTER_VERTICAL | wx.RIGHT, 8)

        self.dir_txt = wx.StaticText(panel, label=self.selected_dir)
        self.dir_txt.SetForegroundColour(wx.Colour(0, 70, 180))
        self.dir_txt.SetFont(self.dir_txt.GetFont().Italic())
        dir_box.Add(self.dir_txt, 1, wx.ALIGN_CENTER_VERTICAL | wx.RIGHT, 8)

        btn_browse = wx.Button(panel, label="Browse...")
        btn_browse.Bind(wx.EVT_BUTTON, self.on_browse)
        dir_box.Add(btn_browse, 0, wx.ALIGN_CENTER_VERTICAL)
        main_sizer.Add(dir_box, 0, wx.EXPAND | wx.ALL, 12)

        # 2. Form Grid
        grid = wx.FlexGridSizer(rows=3, cols=2, vgap=10, hgap=10)
        grid.AddGrowableCol(1, 1)

        # Find Text
        lbl_find = wx.StaticText(panel, label="Find text:")
        self.find_entry = wx.TextCtrl(panel, value=DEFAULT_FIND)
        grid.Add(lbl_find, 0, wx.ALIGN_CENTER_VERTICAL)
        grid.Add(self.find_entry, 1, wx.EXPAND)

        # Replace Text
        lbl_replace = wx.StaticText(panel, label="Replace with:")
        self.replace_entry = wx.TextCtrl(panel, value=DEFAULT_REPLACE)
        grid.Add(lbl_replace, 0, wx.ALIGN_CENTER_VERTICAL)
        grid.Add(self.replace_entry, 1, wx.EXPAND)

        # Suffix / Ext Text
        lbl_suffix = wx.StaticText(panel, label="File Suffix/Ext:")
        self.suffix_entry = wx.TextCtrl(panel, value=DEFAULT_SUFFIX)
        grid.Add(lbl_suffix, 0, wx.ALIGN_CENTER_VERTICAL)
        grid.Add(self.suffix_entry, 1, wx.EXPAND)

        main_sizer.Add(grid, 0, wx.EXPAND | wx.LEFT | wx.RIGHT | wx.BOTTOM, 12)

        # 3. Action Buttons
        btn_box = wx.BoxSizer(wx.HORIZONTAL)
        self.btn_execute = wx.Button(panel, label="Execute Find & Replace")
        self.btn_execute.SetFont(self.btn_execute.GetFont().Bold())
        self.btn_execute.Bind(wx.EVT_BUTTON, self.on_execute)
        btn_box.Add(self.btn_execute, 0, wx.RIGHT, 8)

        btn_close = wx.Button(panel, wx.ID_CLOSE, label="Close")
        btn_close.Bind(wx.EVT_BUTTON, lambda e: self.EndModal(wx.ID_CLOSE))
        btn_box.Add(btn_close, 0)

        main_sizer.Add(btn_box, 0, wx.ALIGN_CENTER_HORIZONTAL | wx.TOP | wx.BOTTOM, 10)

        # 4. Status Footer
        self.status_lbl = wx.StaticText(panel, label="Ready. Press Execute to scan and replace text in files.")
        self.status_lbl.SetForegroundColour(wx.Colour(80, 80, 80))
        main_sizer.Add(self.status_lbl, 0, wx.EXPAND | wx.LEFT | wx.RIGHT | wx.BOTTOM, 12)

        panel.SetSizer(main_sizer)

    def on_browse(self, event):
        dlg = wx.DirDialog(self, "Select Folder Containing Files", defaultPath=self.selected_dir)
        if dlg.ShowModal() == wx.ID_OK:
            self.selected_dir = dlg.GetPath()
            self.dir_txt.SetLabel(self.selected_dir)
            self.dir_txt.GetParent().Layout()
        dlg.Destroy()

    def on_execute(self, event):
        find_str = self.find_entry.GetValue()
        replace_str = self.replace_entry.GetValue()
        suffix_str = self.suffix_entry.GetValue().strip()

        if not find_str:
            wx.MessageBox("The 'Find' field cannot be empty.", "Error", wx.OK | wx.ICON_ERROR)
            return

        if not suffix_str:
            wx.MessageBox("The file suffix/extension field cannot be empty.", "Error", wx.OK | wx.ICON_ERROR)
            return

        file_pattern = f"*{suffix_str}"
        search_path = os.path.join(self.selected_dir, file_pattern)
        target_files = sorted(glob.glob(search_path))

        if not target_files:
            wx.MessageBox(
                f"No files matching '{file_pattern}' were found in '{self.selected_dir}'.",
                "No Files Found",
                wx.OK | wx.ICON_INFORMATION
            )
            return

        modified_count = 0
        total_replacements = 0

        for file_path in target_files:
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    content = f.read()

                occurrences = content.count(find_str)
                if occurrences > 0:
                    updated_content = content.replace(find_str, replace_str)
                    with open(file_path, "w", encoding="utf-8") as f:
                        f.write(updated_content)

                    modified_count += 1
                    total_replacements += occurrences
            except Exception as e:
                wx.MessageBox(
                    f"Could not process file {os.path.basename(file_path)}:\n{str(e)}",
                    "File Error",
                    wx.OK | wx.ICON_ERROR
                )
                return

        msg = (
            f"Process complete!\n\n"
            f"Files altered: {modified_count} out of {len(target_files)}\n"
            f"Total substitutions: {total_replacements}"
        )
        wx.MessageBox(msg, "Success", wx.OK | wx.ICON_INFORMATION)
        self.status_lbl.SetLabel(f"Last run: Replaced {total_replacements} item(s) across {modified_count} file(s).")

        # If any database files were modified, refresh the parent viewer automatically
        if modified_count > 0 and hasattr(self.parent, "on_refresh_images"):
            self.parent.on_refresh_images(None)


class ImageNamerFrame(wx.Frame):
    def __init__(self):
        super().__init__(
            parent=None,
            title="Botanical Infographic Namer & Resampler (.jpeg -> sample/{category}/{id}.webp)",
            size=(1200, 750)
        )

        # Ensure output folder for renamed JPEGs exists in the current directory
        os.makedirs(JPEG_OUTPUT_DIR, exist_ok=True)

        self.catalog = load_database_plants()
        self.image_files = []
        self.current_img_idx = 0
        self.assignments = {}
        self.plant_data_map = {}

        self._scan_download_images()

        self.init_ui()
        self.Bind(wx.EVT_CHAR_HOOK, self.on_key_hook)
        self.Centre()
        self.update_image_display()

    def _scan_download_images(self):
        """Scans ~/Downloads for .jpeg images and matches filenames to plant IDs."""
        download_dir = os.path.expanduser("~/Downloads")
        if os.path.isdir(download_dir):
            self.image_files = sorted([
                os.path.join(download_dir, f)
                for f in os.listdir(download_dir)
                if os.path.isfile(os.path.join(download_dir, f)) and (f.lower().endswith(".jpeg") or f.lower().endswith(".jpg") or f.lower().endswith(".webp") )
            ])
        else:
            self.image_files = []

        # Retain existing assignments only for files still present
        valid_files = set(self.image_files)
        self.assignments = {
            k: v for k, v in self.assignments.items() if k in valid_files
        }

        pid_lookup = {}
        for cat_name, entries in self.catalog.items():
            for pid, pname, subcat in entries:
                pid_lookup[pid] = (cat_name, pid, pname)

        for f in self.image_files:
            if f not in self.assignments:
                base_name, _ = os.path.splitext(os.path.basename(f))
                if base_name in pid_lookup:
                    self.assignments[f] = pid_lookup[base_name]

        if not self.image_files:
            self.current_img_idx = 0
        elif self.current_img_idx >= len(self.image_files):
            self.current_img_idx = len(self.image_files) - 1

    def init_ui(self):
        self.main_panel = wx.Panel(self)
        main_sizer = wx.BoxSizer(wx.VERTICAL)

        header_panel = wx.Panel(self.main_panel)
        header_panel.SetBackgroundColour(wx.Colour(27, 46, 34))
        header_sizer = wx.BoxSizer(wx.HORIZONTAL)

        title_lbl = wx.StaticText(header_panel, label="🌿 Botanical Image Namer & Resampler")
        title_lbl.SetForegroundColour(wx.Colour(240, 253, 244))
        title_lbl.SetFont(wx.Font(13, wx.FONTFAMILY_SWISS, wx.FONTSTYLE_NORMAL, wx.FONTWEIGHT_BOLD))
        header_sizer.Add(title_lbl, 0, wx.ALL | wx.ALIGN_CENTER_VERTICAL, 10)

        header_sizer.AddStretchSpacer()

        self.img_counter_lbl = wx.StaticText(header_panel, label="No .jpeg images found")
        self.img_counter_lbl.SetForegroundColour(wx.Colour(167, 243, 208))
        self.img_counter_lbl.SetFont(wx.Font(10, wx.FONTFAMILY_SWISS, wx.FONTSTYLE_NORMAL, wx.FONTWEIGHT_BOLD))
        header_sizer.Add(self.img_counter_lbl, 0, wx.ALL | wx.ALIGN_CENTER_VERTICAL, 10)

        self.btn_refresh_top = wx.Button(header_panel, label="🔄 Refresh Images")
        self.btn_refresh_top.Bind(wx.EVT_BUTTON, self.on_refresh_images)
        header_sizer.Add(self.btn_refresh_top, 0, wx.RIGHT | wx.TOP | wx.BOTTOM | wx.ALIGN_CENTER_VERTICAL, 6)

        self.btn_verify = wx.Button(header_panel, label="🔍 Verify Images")
        self.btn_verify.Bind(wx.EVT_BUTTON, self.on_verify_images)
        header_sizer.Add(self.btn_verify, 0, wx.RIGHT | wx.TOP | wx.BOTTOM | wx.ALIGN_CENTER_VERTICAL, 6)

        self.btn_find_replace = wx.Button(header_panel, label="📝 Find / Replace")
        self.btn_find_replace.Bind(wx.EVT_BUTTON, self.on_open_find_replace)
        header_sizer.Add(self.btn_find_replace, 0, wx.RIGHT | wx.TOP | wx.BOTTOM | wx.ALIGN_CENTER_VERTICAL, 10)

        header_panel.SetSizer(header_sizer)
        main_sizer.Add(header_panel, 0, wx.EXPAND)

        work_sizer = wx.BoxSizer(wx.HORIZONTAL)

        # Column 1 (Far Left): Category Selector & Filter Checkboxes
        col1_panel = wx.Panel(self.main_panel)
        col1_sizer = wx.BoxSizer(wx.VERTICAL)

        cat_title = wx.StaticText(col1_panel, label="1. Select Category")
        cat_title.SetFont(wx.Font(10, wx.FONTFAMILY_SWISS, wx.FONTSTYLE_NORMAL, wx.FONTWEIGHT_BOLD))
        col1_sizer.Add(cat_title, 0, wx.ALL, 6)

        cat_choices = [cat[0] for cat in CATEGORY_MAP] + [DUPLICATES_CAT]
        self.cat_listbox = wx.ListBox(
            col1_panel,
            choices=cat_choices,
            style=wx.LB_SINGLE
        )
        self.cat_listbox.Bind(wx.EVT_LISTBOX, self.on_category_selected)
        col1_sizer.Add(self.cat_listbox, 1, wx.EXPAND | wx.LEFT | wx.RIGHT | wx.BOTTOM, 6)

        # Checkbox to only show plants without a thumbnail
        self.chk_no_thumb = wx.CheckBox(col1_panel, label="Only Without Thumbnail")
        self.chk_no_thumb.SetFont(wx.Font(9, wx.FONTFAMILY_SWISS, wx.FONTSTYLE_NORMAL, wx.FONTWEIGHT_BOLD))
        self.chk_no_thumb.Bind(wx.EVT_CHECKBOX, self.on_toggle_filters)
        col1_sizer.Add(self.chk_no_thumb, 0, wx.LEFT | wx.RIGHT | wx.BOTTOM, 6)

        # Checkbox to toggle missing field view for the currently selected category
        self.chk_missing = wx.CheckBox(col1_panel, label="Show Missing Fields")
        self.chk_missing.SetFont(wx.Font(9, wx.FONTFAMILY_SWISS, wx.FONTSTYLE_NORMAL, wx.FONTWEIGHT_BOLD))
        self.chk_missing.Bind(wx.EVT_CHECKBOX, self.on_toggle_filters)
        col1_sizer.Add(self.chk_missing, 0, wx.LEFT | wx.RIGHT | wx.BOTTOM, 6)

        # Checkbox to sort by subcategory (default off)
        self.chk_sort_subcat = wx.CheckBox(col1_panel, label="Sort by Subcategory")
        self.chk_sort_subcat.SetFont(wx.Font(9, wx.FONTFAMILY_SWISS, wx.FONTSTYLE_NORMAL, wx.FONTWEIGHT_BOLD))
        self.chk_sort_subcat.Bind(wx.EVT_CHECKBOX, self.on_toggle_filters)
        col1_sizer.Add(self.chk_sort_subcat, 0, wx.LEFT | wx.RIGHT | wx.BOTTOM, 6)

        col1_panel.SetSizer(col1_sizer)
        work_sizer.Add(col1_panel, 0, wx.EXPAND | wx.ALL, 4)

        # Column 2 (Middle): Database Plant List + Action Buttons & Export Dropdown
        col2_panel = wx.Panel(self.main_panel)
        col2_sizer = wx.BoxSizer(wx.VERTICAL)

        self.id_title = wx.StaticText(col2_panel, label="2. Available Plant Names (Missing Images)")
        self.id_title.SetFont(wx.Font(10, wx.FONTFAMILY_SWISS, wx.FONTSTYLE_NORMAL, wx.FONTWEIGHT_BOLD))
        col2_sizer.Add(self.id_title, 0, wx.ALL, 6)

        self.plants_listbox = wx.ListCtrl(
            col2_panel, 
            style=wx.LC_REPORT | wx.LC_NO_HEADER | wx.LC_SINGLE_SEL
        )
        self.plants_listbox.InsertColumn(0, "Plant", width=420)
        self.plants_listbox.Bind(wx.EVT_LIST_ITEM_SELECTED, self.on_plant_selected)
        col2_sizer.Add(self.plants_listbox, 1, wx.EXPAND | wx.LEFT | wx.RIGHT | wx.BOTTOM, 6)

        # Action buttons row below plant listbox
        col2_btn_sizer = wx.BoxSizer(wx.HORIZONTAL)

        self.btn_copy_list = wx.Button(col2_panel, label="📋 Copy List")
        self.btn_copy_list.Bind(wx.EVT_BUTTON, self.on_copy_list)
        col2_btn_sizer.Add(self.btn_copy_list, 0, wx.RIGHT, 4)

        self.btn_export_list = wx.Button(col2_panel, label="📤 Export List")
        self.btn_export_list.Bind(wx.EVT_BUTTON, self.on_export_list)
        col2_btn_sizer.Add(self.btn_export_list, 0, wx.RIGHT, 4)

        # Dropdown list for extra exported field
        self.choice_export_field = wx.Choice(col2_panel, choices=EXPORT_FIELD_OPTIONS)
        self.choice_export_field.SetSelection(0)
        col2_btn_sizer.Add(self.choice_export_field, 0, wx.ALIGN_CENTER_VERTICAL)

        col2_sizer.Add(col2_btn_sizer, 0, wx.LEFT | wx.RIGHT | wx.BOTTOM, 6)
        col2_panel.SetSizer(col2_sizer)
        work_sizer.Add(col2_panel, 1, wx.EXPAND | wx.ALL, 4)

        # Column 3 (Far Right): Image Display & Controls
        self.col3_panel = wx.Panel(self.main_panel)
        col3_sizer = wx.BoxSizer(wx.VERTICAL)

        preview_title = wx.StaticText(self.col3_panel, label="3. Image Preview & Assignment")
        preview_title.SetFont(wx.Font(10, wx.FONTFAMILY_SWISS, wx.FONTSTYLE_NORMAL, wx.FONTWEIGHT_BOLD))
        col3_sizer.Add(preview_title, 0, wx.ALL, 6)

        self.img_display = wx.StaticBitmap(self.col3_panel, size=(550, 450))
        self.img_display.SetBackgroundColour(wx.Colour(20, 20, 20))
        col3_sizer.Add(self.img_display, 0, wx.ALIGN_CENTER | wx.ALL, 8)

        self.assigned_info_panel = wx.Panel(self.col3_panel)
        self.assigned_info_panel.SetBackgroundColour(wx.Colour(240, 245, 240))
        info_sizer = wx.BoxSizer(wx.VERTICAL)

        self.file_name_lbl = wx.StaticText(self.assigned_info_panel, label="File: None")
        self.file_name_lbl.SetFont(wx.Font(9, wx.FONTFAMILY_TELETYPE, wx.FONTSTYLE_NORMAL, wx.FONTWEIGHT_BOLD))
        info_sizer.Add(self.file_name_lbl, 0, wx.ALL, 4)

        self.assigned_lbl = wx.StaticText(self.assigned_info_panel, label="Assigned Path: (Unassigned)")
        self.assigned_lbl.SetFont(wx.Font(10, wx.FONTFAMILY_SWISS, wx.FONTSTYLE_NORMAL, wx.FONTWEIGHT_BOLD))
        self.assigned_lbl.SetForegroundColour(wx.Colour(180, 50, 50))
        info_sizer.Add(self.assigned_lbl, 0, wx.ALL, 4)

        self.dup_warning_lbl = wx.StaticText(self.assigned_info_panel, label="")
        self.dup_warning_lbl.SetFont(wx.Font(9, wx.FONTFAMILY_SWISS, wx.FONTSTYLE_NORMAL, wx.FONTWEIGHT_BOLD))
        self.dup_warning_lbl.SetForegroundColour(wx.Colour(210, 0, 0))
        info_sizer.Add(self.dup_warning_lbl, 0, wx.LEFT | wx.RIGHT | wx.BOTTOM, 4)

        self.assigned_info_panel.SetSizer(info_sizer)
        col3_sizer.Add(self.assigned_info_panel, 0, wx.EXPAND | wx.LEFT | wx.RIGHT | wx.BOTTOM, 8)

        nav_sizer = wx.BoxSizer(wx.HORIZONTAL)
        self.btn_prev = wx.Button(self.col3_panel, label="◀ Prev (Left Arrow)")
        self.btn_prev.Bind(wx.EVT_BUTTON, lambda e: self.navigate_image(-1))
        nav_sizer.Add(self.btn_prev, 1, wx.RIGHT, 4)

        self.btn_refresh = wx.Button(self.col3_panel, label="🔄 Refresh")
        self.btn_refresh.Bind(wx.EVT_BUTTON, self.on_refresh_images)
        nav_sizer.Add(self.btn_refresh, 0, wx.LEFT | wx.RIGHT, 4)

        self.btn_next = wx.Button(self.col3_panel, label="Next (Right Arrow) ▶")
        self.btn_next.Bind(wx.EVT_BUTTON, lambda e: self.navigate_image(1))
        nav_sizer.Add(self.btn_next, 1, wx.LEFT, 4)
        col3_sizer.Add(nav_sizer, 0, wx.EXPAND | wx.LEFT | wx.RIGHT | wx.BOTTOM, 8)

        self.col3_panel.SetSizer(col3_sizer)
        work_sizer.Add(self.col3_panel, 1, wx.EXPAND | wx.ALL, 4)

        main_sizer.Add(work_sizer, 1, wx.EXPAND)

        # Bottom Action Bar
        bottom_panel = wx.Panel(self.main_panel)
        bottom_panel.SetBackgroundColour(wx.Colour(235, 238, 235))
        bottom_sizer = wx.BoxSizer(wx.HORIZONTAL)

        self.status_lbl = wx.StaticText(
            bottom_panel,
            label="Use Left/Right arrow keys to switch images. Click any plant on the list to assign."
        )
        self.status_lbl.SetForegroundColour(wx.Colour(70, 70, 70))
        bottom_sizer.Add(self.status_lbl, 1, wx.ALL | wx.ALIGN_CENTER_VERTICAL, 10)

        self.btn_save = wx.Button(bottom_panel, label="💾 Save New Names (sample/{category}/{id}.webp)")
        self.btn_save.SetFont(wx.Font(10, wx.FONTFAMILY_SWISS, wx.FONTSTYLE_NORMAL, wx.FONTWEIGHT_BOLD))
        self.btn_save.SetBackgroundColour(wx.Colour(20, 110, 60))
        self.btn_save.SetForegroundColour(wx.Colour(255, 255, 255))
        self.btn_save.Bind(wx.EVT_BUTTON, self.on_save_new_names)
        bottom_sizer.Add(self.btn_save, 0, wx.ALL | wx.ALIGN_CENTER_VERTICAL, 8)

        bottom_panel.SetSizer(bottom_sizer)
        main_sizer.Add(bottom_panel, 0, wx.EXPAND)

        self.main_panel.SetSizer(main_sizer)

        if self.cat_listbox.GetCount() > 0:
            self.cat_listbox.SetSelection(0)
            self.on_category_selected(None)

    def on_open_find_replace(self, event):
        """Opens the Find & Replace dialog box."""
        dlg = FindReplaceDialog(self)
        dlg.ShowModal()
        dlg.Destroy()

    def add_plant_item(self, display_str, pid):
        """Helper to insert an item into ListCtrl and map string ID in plant_data_map."""
        idx = self.plants_listbox.InsertItem(self.plants_listbox.GetItemCount(), display_str)
        self.plant_data_map[idx] = pid
        
        # Check if item has Thumbnail prefix/indicator
        if "Thumbnail:" in display_str or "Thumbnails:" in display_str:
            self.plants_listbox.SetItemTextColour(idx, wx.Colour(20, 140, 50))
            bold_font = self.plants_listbox.GetFont().Bold()
            self.plants_listbox.SetItemFont(idx, bold_font)

    def on_refresh_images(self, event):
        """Reloads database plants from databases/ and rescans the ~/Downloads folder for .jpeg images."""
        self.catalog = load_database_plants()
        self._scan_download_images()
        self.on_category_selected(None)
        self.update_image_display()
        self.status_lbl.SetLabel(
            f"🔄 Refreshed! Found {len(self.image_files)} .jpeg image(s) in ~/Downloads."
        )

    def on_verify_images(self, event):
        """
        Looks for orphaned/misplaced .webp files in sample folders and offers to move/rename them.
        Handles category changes in parent folder, embedded category names in the file, or both.
        Excludes all images starting with 'xx_'.
        """
        sample_base = "sample"
        if not os.path.isdir(sample_base):
            wx.MessageBox(
                f"Directory '{sample_base}' does not exist.",
                "Verify Images",
                wx.OK | wx.ICON_INFORMATION
            )
            return

        self.catalog = load_database_plants()

        def normalize_name(s):
            return re.sub(r'[^a-z0-9]', '', str(s).lower())

        cat_keywords = set()
        for cat_name, entries in self.catalog.items():
            c_low = cat_name.lower().strip()
            cat_keywords.add(c_low)
            if c_low.endswith("s"):
                cat_keywords.add(c_low[:-1])
            for _, _, subcat in entries:
                if subcat and subcat.lower() != "general":
                    s_low = subcat.lower().strip()
                    cat_keywords.add(s_low)
                    if s_low.endswith("s"):
                        cat_keywords.add(s_low[:-1])

        valid_paths = set()
        plants_by_key = defaultdict(list)

        for cat_name, entries in self.catalog.items():
            cat_folder = cat_name.lower()
            for pid, pname, subcat in entries:
                expected_path = os.path.normpath(os.path.join(sample_base, cat_folder, f"{pid}.webp"))
                valid_paths.add(expected_path)

                plant_obj = (cat_name, pid, pname)
                pid_clean = pid.lower().strip()
                norm_pname = normalize_name(pname)
                norm_pid = normalize_name(pid)

                plants_by_key[pid_clean].append(plant_obj)
                plants_by_key[norm_pid].append(plant_obj)
                plants_by_key[norm_pname].append(plant_obj)

                for kw in sorted(cat_keywords, key=len, reverse=True):
                    for sep in ("_", "-", " "):
                        prefix = kw + sep
                        if pid_clean.startswith(prefix):
                            core = pid_clean[len(prefix):]
                            plants_by_key[core].append(plant_obj)
                            plants_by_key[normalize_name(core)].append(plant_obj)
                        suffix = sep + kw
                        if pid_clean.endswith(suffix):
                            core = pid_clean[:-len(suffix)]
                            plants_by_key[core].append(plant_obj)
                            plants_by_key[normalize_name(core)].append(plant_obj)

        all_webp_files = []
        for root_dir, _, files in os.walk(sample_base):
            for f in files:
                if f.lower().endswith(".webp") and not f.lower().startswith("xx_"):
                    all_webp_files.append(os.path.normpath(os.path.join(root_dir, f)))

        proposed_fixes = []
        unmatched_orphans = []

        def get_stem_candidates(raw_stem, parent_folder=""):
            candidates = set()
            s = raw_stem.lower().strip()
            candidates.add(s)
            candidates.add(normalize_name(s))

            if parent_folder:
                p = parent_folder.lower().strip()
                for sep in ("_", "-", " "):
                    prefix = p + sep
                    if s.startswith(prefix):
                        core = s[len(prefix):]
                        candidates.add(core)
                        candidates.add(normalize_name(core))
                    suffix = sep + p
                    if s.endswith(suffix):
                        core = s[:-len(suffix)]
                        candidates.add(core)
                        candidates.add(normalize_name(core))

            for kw in sorted(cat_keywords, key=len, reverse=True):
                for sep in ("_", "-", " "):
                    prefix = kw + sep
                    if s.startswith(prefix):
                        core = s[len(prefix):]
                        candidates.add(core)
                        candidates.add(normalize_name(core))
                    suffix = sep + kw
                    if s.endswith(suffix):
                        core = s[:-len(suffix)]
                        candidates.add(core)
                        candidates.add(normalize_name(core))

            return [c for c in candidates if c]

        for fpath in all_webp_files:
            if fpath in valid_paths:
                continue

            current_parent = os.path.basename(os.path.dirname(fpath)).lower()
            current_filename = os.path.basename(fpath)
            stem = os.path.splitext(current_filename)[0]

            candidates = get_stem_candidates(stem, current_parent)
            matched_plants = []
            seen_plants = set()

            for cand in candidates:
                if cand in plants_by_key:
                    for p in plants_by_key[cand]:
                        if p not in seen_plants:
                            seen_plants.add(p)
                            matched_plants.append(p)

            match = None
            if len(matched_plants) == 1:
                match = matched_plants[0]
            elif len(matched_plants) > 1:
                same_cat = [p for p in matched_plants if p[0].lower() == current_parent]
                if len(same_cat) == 1:
                    match = same_cat[0]
                else:
                    cat_list = ", ".join(f"{p[0]}:{p[1]}" for p in matched_plants[:3])
                    unmatched_orphans.append((fpath, f"Ambiguous match across database ({cat_list})"))
                    continue

            if match:
                cat_name, pid, pname = match
                target_path = os.path.normpath(os.path.join(sample_base, cat_name.lower(), f"{pid}.webp"))
                if target_path == fpath:
                    continue

                if os.path.exists(target_path):
                    unmatched_orphans.append((fpath, f"Target already exists: {target_path}"))
                else:
                    target_parent = cat_name.lower()
                    target_filename = f"{pid}.webp"
                    parent_changed = (current_parent != target_parent)
                    name_changed = (current_filename.lower() != target_filename.lower())

                    if parent_changed and name_changed:
                        desc = f"Category ({current_parent} → {target_parent}) & Name ({current_filename} → {target_filename})"
                    elif parent_changed:
                        desc = f"Category folder moved ({current_parent} → {target_parent})"
                    else:
                        desc = f"Renamed to ID ({current_filename} → {target_filename})"

                    proposed_fixes.append((fpath, target_path, pname, desc))
            else:
                unmatched_orphans.append((fpath, "No matching database plant found"))

        if not proposed_fixes and not unmatched_orphans:
            wx.MessageBox(
                "All WebP images in 'sample/' match their expected database location.\nNo orphaned files found!",
                "Image Verification Complete",
                wx.OK | wx.ICON_INFORMATION
            )
            return

        if not proposed_fixes and unmatched_orphans:
            preview_lines = [f"• {src} ({reason})" for src, reason in unmatched_orphans[:10]]
            if len(unmatched_orphans) > 10:
                preview_lines.append(f"... and {len(unmatched_orphans) - 10} more.")
            wx.MessageBox(
                f"Found {len(unmatched_orphans)} orphaned WebP file(s), but none could be automatically resolved:\n\n"
                + "\n".join(preview_lines),
                "No Fixes Available",
                wx.OK | wx.ICON_WARNING
            )
            return

        preview_lines = []
        for src, dst, pname, desc in proposed_fixes[:12]:
            preview_lines.append(f"• {src}\n   ↳ {dst} ({pname})\n     [{desc}]")
        if len(proposed_fixes) > 12:
            preview_lines.append(f"... and {len(proposed_fixes) - 12} more.")

        confirm_msg = (
            f"Found {len(proposed_fixes)} orphaned/misplaced WebP file(s) that can be matched to database entries:\n\n"
            + "\n".join(preview_lines) +
            "\n\nDo you want to move and rename these files now?"
        )

        res = wx.MessageBox(confirm_msg, "Confirm Fixing Images", wx.YES_NO | wx.ICON_QUESTION)
        if res != wx.YES:
            return

        fixed_count = 0
        errors = []
        for src, dst, _, _ in proposed_fixes:
            try:
                os.makedirs(os.path.dirname(dst), exist_ok=True)
                shutil.move(src, dst)
                fixed_count += 1
            except Exception as e:
                errors.append(f"{src} -> {dst}: {e}")

        self.on_category_selected(None)
        self.update_image_display()

        if errors:
            msg = f"Fixed {fixed_count} file(s) with errors:\n" + "\n".join(errors[:8])
            wx.MessageBox(msg, "Verification Finished with Errors", wx.OK | wx.ICON_ERROR)
        else:
            wx.MessageBox(
                f"Successfully moved and renamed {fixed_count} WebP image(s) to match the database!",
                "Images Fixed",
                wx.OK | wx.ICON_INFORMATION
            )
            self.status_lbl.SetLabel(f"Verification complete: Fixed {fixed_count} image(s).")

    def on_key_hook(self, event):
        key = event.GetKeyCode()
        if key == wx.WXK_LEFT:
            self.navigate_image(-1)
        elif key == wx.WXK_RIGHT:
            self.navigate_image(1)
        else:
            event.Skip()

    def on_copy_list(self, event):
        count = self.plants_listbox.GetItemCount()
        if count == 0:
            self.status_lbl.SetLabel("List is empty — nothing to copy.")
            return

        items = [self.plants_listbox.GetItemText(i) for i in range(count)]
        full_text = "\n".join(items)

        if wx.TheClipboard.Open():
            wx.TheClipboard.SetData(wx.TextDataObject(full_text))
            wx.TheClipboard.Close()
            self.status_lbl.SetLabel(f"📋 Copied {count} item(s) to clipboard!")
        else:
            wx.MessageBox("Unable to open the clipboard.", "Copy Error", wx.OK | wx.ICON_ERROR)

    def _extract_field_value(self, block, target_field):
        """Extracts and normalizes the value of target_field from an object block."""
        key_pattern = r"(?:origin|orgin)" if target_field in ("origin", "orgin") else re.escape(target_field)
        m = re.search(
            rf'["\']?{key_pattern}["\']?\s*:\s*(?:"([^"]*)"|\'([^\']*)\'|\[([\s\S]*?)\]|([^,\r\n}}]+))',
            block,
            re.IGNORECASE
        )
        if not m:
            return ""

        val = (
            m.group(1) if m.group(1) is not None else
            m.group(2) if m.group(2) is not None else
            m.group(3) if m.group(3) is not None else
            m.group(4)
        )
        if val is None:
            return ""

        clean_val = val.strip().rstrip(",")
        clean_val = re.sub(r'\s+', ' ', clean_val).strip()
        clean_val = clean_val.strip("[]'\"").strip()
        return clean_val

    def on_export_list(self, event):
        """Exports all plants across database files in databases/ to plant_list.txt."""
        output_lines = []
        js_files = sorted([
            f for f in os.listdir(DB_DIR)
            if f.endswith("_data.js") and os.path.isfile(os.path.join(DB_DIR, f))
        ]) if os.path.exists(DB_DIR) else []

        selected_field = self.choice_export_field.GetStringSelection()
        append_field = selected_field and selected_field != "None"

        for js_file in js_files:
            cat_name = js_file[:-len("_data.js")].capitalize()
            file_path = os.path.join(DB_DIR, js_file)
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    content = f.read()

                blocks = re.findall(r'\{([^{}]+)\}', content)
                for block in blocks:
                    id_m = re.search(r'["\']?id["\']?\s*:\s*["\']([^"\']+)["\']', block)
                    name_m = re.search(r'["\']?name["\']?\s*:\s*["\']([^"\']+)["\']', block)
                    bot_m = re.search(r'["\']?botanical["\']?\s*:\s*["\']([^"\']+)["\']', block)

                    if id_m and name_m:
                        pid = id_m.group(1).strip()
                        pname = name_m.group(1).strip()
                        pbot = bot_m.group(1).strip() if bot_m else ""
                        row = f"{cat_name} | {pid} | {pname} | {pbot}"

                        if append_field:
                            field_val = self._extract_field_value(block, selected_field)
                            row += f" | {field_val}"

                        output_lines.append(row)
            except Exception as e:
                print(f"Error reading {file_path}: {e}")

        try:
            with open("plant_list.txt", "w", encoding="utf-8") as out:
                out.write("\n".join(output_lines))
            extra_msg = f" (including '{selected_field}')" if append_field else ""
            self.status_lbl.SetLabel(f"📤 Exported {len(output_lines)} plants{extra_msg} to plant_list.txt")
            wx.MessageBox(
                f"Successfully exported {len(output_lines)} plants{extra_msg} to 'plant_list.txt'.",
                "Export Complete",
                wx.OK | wx.ICON_INFORMATION
            )
        except Exception as e:
            wx.MessageBox(f"Failed to export plant list:\n{e}", "Export Error", wx.OK | wx.ICON_ERROR)

    def find_database_duplicates(self):
        name_map = defaultdict(list)
        id_map = defaultdict(list)

        for cat_name, entries in self.catalog.items():
            for pid, pname, subcat in entries:
                norm_name = pname.strip().lower()
                name_map[norm_name].append((cat_name, pid, pname))
                id_map[pid.strip().lower()].append((cat_name, pid, pname))

        dup_entries = []
        seen = set()

        for norm_name, occurrences in sorted(name_map.items()):
            if len(occurrences) > 1:
                for cat_name, pid, pname in occurrences:
                    key = (cat_name, pid, pname)
                    if key not in seen:
                        seen.add(key)
                        dup_entries.append((f"{pname}  [{pid}]  — ({cat_name})", pid))

        for norm_id, occurrences in sorted(id_map.items()):
            if len(occurrences) > 1:
                for cat_name, pid, pname in occurrences:
                    key = (cat_name, pid, pname)
                    if key not in seen:
                        seen.add(key)
                        dup_entries.append((f"{pname}  [{pid}]  — ({cat_name}) [Duplicate ID]", pid))

        return dup_entries

    def on_toggle_filters(self, event):
        """Re-evaluates the list when any filter or sort checkbox is toggled."""
        self.on_category_selected(None)

    def on_category_selected(self, event):
        sel = self.cat_listbox.GetSelection()
        if sel == wx.NOT_FOUND:
            return
        cat_name = self.cat_listbox.GetString(sel)
        self.plants_listbox.DeleteAllItems()
        self.plant_data_map.clear()

        # Handle DUPLICATES view
        if cat_name == DUPLICATES_CAT:
            self.col3_panel.Hide()
            self.btn_save.Hide()
            self.chk_missing.Disable()
            self.chk_no_thumb.Disable()
            self.chk_sort_subcat.Disable()
            self.id_title.SetLabel("2. Duplicate Plant Names Across Database")

            dup_entries = self.find_database_duplicates()
            for display_str, pid in dup_entries:
                self.add_plant_item(display_str, pid)

            self.status_lbl.SetLabel(f"Found {len(dup_entries)} duplicate plant entry/entries.")
            self.main_panel.Layout()
            return

        self.chk_missing.Enable()
        self.chk_no_thumb.Enable()
        self.chk_sort_subcat.Enable()

        # Handle MISSING view for the selected category file
        if self.chk_missing.GetValue():
            self.col3_panel.Hide()
            self.btn_save.Hide()
            self.id_title.SetLabel(f"2. {cat_name} Plants with Missing Fields")

            missing_entries = scan_category_for_missing(cat_name)
            cat_folder = cat_name.lower()
            only_no_thumb = self.chk_no_thumb.GetValue()

            shown_count = 0
            for display_str, pid in missing_entries:
                target_path = os.path.join("sample", cat_folder, f"{pid}.webp")
                if only_no_thumb and os.path.exists(target_path):
                    continue
                self.add_plant_item(display_str, pid)
                shown_count += 1

            self.status_lbl.SetLabel(
                f"Found {shown_count} entry/entries with missing fields in {cat_name}."
            )
            self.main_panel.Layout()
            return

        # Regular category view: restore Column 3 and Save button
        if not self.col3_panel.IsShown():
            self.col3_panel.Show()
        if not self.btn_save.IsShown():
            self.btn_save.Show()

        only_no_thumb = self.chk_no_thumb.GetValue()
        sort_by_subcat = self.chk_sort_subcat.GetValue()

        if only_no_thumb:
            self.id_title.SetLabel("2. Available Plant Names (Without Thumbnail Only)")
        else:
            self.id_title.SetLabel("2. Available Plant Names (All Plants)")
        self.main_panel.Layout()

        cat_folder = cat_name.lower()
        plant_entries = list(self.catalog.get(cat_name, []))
        total_plants = len(plant_entries)
        thumbnail_count = 0

        if sort_by_subcat:
            plant_entries = sorted(plant_entries, key=lambda x: (x[2].lower(), x[1].lower()))

        for pid, pname, subcat in plant_entries:
            target_path = os.path.join("sample", cat_folder, f"{pid}.webp")
            display_prefix = f"[{subcat}] " if sort_by_subcat else ""
            if os.path.exists(target_path):
                thumbnail_count += 1
                if not only_no_thumb:
                    self.add_plant_item(f"{display_prefix}Thumbnail: {pname}  [{pid}]", pid)
            else:
                self.add_plant_item(f"{display_prefix}{pname}  [{pid}]", pid)

        missing_thumb_count = total_plants - thumbnail_count
        self.status_lbl.SetLabel(
            f"Category '{cat_name}': {total_plants} total plant(s) "
            f"({thumbnail_count} with thumbnails, {missing_thumb_count} without)."
        )

        if self.image_files:
            cur_file = self.image_files[self.current_img_idx]
            if cur_file in self.assignments:
                _, assigned_id, _ = self.assignments[cur_file]
                for idx, pid_val in self.plant_data_map.items():
                    if pid_val == assigned_id:
                        self.plants_listbox.SetItemState(idx, wx.LIST_STATE_SELECTED | wx.LIST_STATE_FOCUSED, wx.LIST_STATE_SELECTED | wx.LIST_STATE_FOCUSED)
                        self.plants_listbox.EnsureVisible(idx)
                        break

    def get_duplicate_files(self, target_file, plant_id):
        duplicates = []
        for fname, (_, pid, _) in self.assignments.items():
            if fname != target_file and pid == plant_id:
                duplicates.append(fname)
        return duplicates

    def on_plant_selected(self, event):
        """Assigns the selected plant ID to the current image (ignored in DUPLICATES or Missing views)."""
        cat_sel = self.cat_listbox.GetSelection()
        if cat_sel != wx.NOT_FOUND:
            if self.cat_listbox.GetString(cat_sel) == DUPLICATES_CAT or self.chk_missing.GetValue():
                return

        if not self.image_files:
            return

        sel = self.plants_listbox.GetFirstSelected()
        if sel == -1:
            return

        pid = self.plant_data_map.get(sel, "")
        item_text = self.plants_listbox.GetItemText(sel)
        if "]" in item_text:
            item_text = item_text.split("]", 1)[1].strip()
        clean_text = item_text.removeprefix("Thumbnail: ").strip()
        pname = clean_text.split("  [")[0]

        cat_name = self.cat_listbox.GetString(cat_sel)

        cur_file = self.image_files[self.current_img_idx]
        self.assignments[cur_file] = (cat_name, pid, pname)

        self.update_assignment_ui()
        dest_path = f"sample/{cat_name.lower()}/{pid}.webp"
        self.status_lbl.SetLabel(f"Assigned '{cur_file}' -> {dest_path} ({pname})")

    def navigate_image(self, delta):
        if not self.image_files or not self.col3_panel.IsShown():
            return
        new_idx = self.current_img_idx + delta
        if 0 <= new_idx < len(self.image_files):
            self.current_img_idx = new_idx
            self.update_image_display()

    def update_image_display(self):
        if not self.image_files:
            self.img_counter_lbl.SetLabel("0 .jpeg images found")
            self.file_name_lbl.SetLabel("File: None")
            self.assigned_lbl.SetLabel("No '.jpeg' images found in downloads directory.")
            self.dup_warning_lbl.SetLabel("")
            empty_bmp = wx.Bitmap(550, 450)
            dc = wx.MemoryDC(empty_bmp)
            dc.SetBackground(wx.Brush(wx.Colour(20, 20, 20)))
            dc.Clear()
            del dc
            self.img_display.SetBitmap(empty_bmp)
            return

        cur_file = self.image_files[self.current_img_idx]
        total = len(self.image_files)
        self.img_counter_lbl.SetLabel(f"Image {self.current_img_idx + 1} of {total}")
        self.file_name_lbl.SetLabel(f"File: {cur_file}")

        try:
            pil_img = Image.open(cur_file)
            orig_w, orig_h = pil_img.size
            pil_copy = pil_img.copy()
            pil_copy.thumbnail((550, 450), Image.Resampling.LANCZOS)

            wx_img = wx.Image(pil_copy.width, pil_copy.height)
            wx_img.SetData(pil_copy.convert("RGB").tobytes())
            self.img_display.SetBitmap(wx.Bitmap(wx_img))
            self.file_name_lbl.SetLabel(f"File: {cur_file} ({orig_w}×{orig_h})")
        except Exception as e:
            print(f"Failed to load image preview: {e}")

        self.update_assignment_ui()

    def update_assignment_ui(self):
        if not self.image_files:
            return
        cur_file = self.image_files[self.current_img_idx]
        if cur_file in self.assignments:
            cat_name, pid, pname = self.assignments[cur_file]
            dest_path = f"sample/{cat_name.lower()}/{pid}.webp"
            self.assigned_lbl.SetLabel(f"✔ Assigned: {dest_path}\n   ({pname})")
            self.assigned_lbl.SetForegroundColour(wx.Colour(20, 120, 50))

            dup_files = self.get_duplicate_files(cur_file, pid)
            target_disk_path = os.path.join("sample", cat_name.lower(), f"{pid}.webp")

            if dup_files:
                dup_list_str = ", ".join(dup_files)
                self.dup_warning_lbl.SetLabel(
                    f"⚠️ WARNING: '{pid}' is already assigned to: {dup_list_str}!"
                )
            elif os.path.exists(target_disk_path):
                self.dup_warning_lbl.SetLabel(
                    f"⚠️ WARNING: '{dest_path}' already exists on disk!"
                )
            else:
                self.dup_warning_lbl.SetLabel("")

            cur_cat_sel = self.cat_listbox.GetSelection()
            if cur_cat_sel == wx.NOT_FOUND or (
                self.cat_listbox.GetString(cur_cat_sel) != DUPLICATES_CAT and not self.chk_missing.GetValue()
            ):
                for i in range(self.cat_listbox.GetCount()):
                    if self.cat_listbox.GetString(i) == cat_name:
                        if self.cat_listbox.GetSelection() != i:
                            self.cat_listbox.SetSelection(i)
                            self.on_category_selected(None)
                        break

                for idx, pid_val in self.plant_data_map.items():
                    if pid_val == pid:
                        self.plants_listbox.SetItemState(idx, wx.LIST_STATE_SELECTED | wx.LIST_STATE_FOCUSED, wx.LIST_STATE_SELECTED | wx.LIST_STATE_FOCUSED)
                        self.plants_listbox.EnsureVisible(idx)
                        break
        else:
            self.assigned_lbl.SetLabel("⏳ Unassigned (Select category & plant name)")
            self.assigned_lbl.SetForegroundColour(wx.Colour(180, 50, 50))
            self.dup_warning_lbl.SetLabel("")

        self.assigned_info_panel.Layout()

    def on_save_new_names(self, event):
        if not self.assignments:
            wx.MessageBox(
                "No images have been assigned a plant name yet.",
                "Nothing to Save",
                wx.OK | wx.ICON_WARNING
            )
            return

        unassigned_count = len(self.image_files) - len(self.assignments)
        if unassigned_count > 0:
            res = wx.MessageBox(
                f"{unassigned_count} image(s) are still unassigned.\n"
                f"Do you want to proceed and save the {len(self.assignments)} assigned images?",
                "Unassigned Images Remaining",
                wx.YES_NO | wx.ICON_QUESTION
            )
            if res != wx.YES:
                return

        os.makedirs(JPEG_OUTPUT_DIR, exist_ok=True)
        processed = 0
        errors = []

        for src_file, (cat_name, pid, pname) in list(self.assignments.items()):
            dest_dir = os.path.join("sample", cat_name.lower())
            os.makedirs(dest_dir, exist_ok=True)
            dest_file = os.path.join(dest_dir, f"{pid}.webp")

            try:
                with Image.open(src_file) as im:
                    rgb_im = im.convert("RGB")
                    rgb_im.save(dest_file, "WEBP", quality=80, optimize=True)

                new_jpeg_path = os.path.join(JPEG_OUTPUT_DIR, f"{pid}.jpeg")
                if os.path.abspath(src_file) != os.path.abspath(new_jpeg_path) and os.path.exists(src_file):
                    if os.path.exists(new_jpeg_path):
                        os.remove(new_jpeg_path)
                    shutil.move(src_file, new_jpeg_path)

                processed += 1
            except Exception as e:
                errors.append(f"{src_file} -> {dest_file}: {e}")

        self.assignments.clear()
        self.current_img_idx = 0
        self._scan_download_images()

        self.on_category_selected(None)
        self.update_image_display()

        if errors:
            msg = f"Saved {processed} images with errors:\n" + "\n".join(errors)
            wx.MessageBox(msg, "Finished with Errors", wx.OK | wx.ICON_ERROR)
        else:
            wx.MessageBox(
                f"Successfully saved {processed} WebP images and moved renamed originals!\n\n"
                f"WebPs saved to: 'sample/[category]/[id].webp'\n"
                f"JPEGs moved to: '{JPEG_OUTPUT_DIR}/[id].jpeg'",
                "Save Complete",
                wx.OK | wx.ICON_INFORMATION
            )
            self.status_lbl.SetLabel(
                f"Done! Processed {processed} image(s) into '{JPEG_OUTPUT_DIR}/'."
            )


if __name__ == "__main__":
    app = wx.App()
    frame = ImageNamerFrame()
    frame.Show()
    app.MainLoop()
