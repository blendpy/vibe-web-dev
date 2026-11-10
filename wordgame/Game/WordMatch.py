import wx
import random
import math
import heapq  # Used for Level 3 and Level 4 path solvers
import re
from collections import deque

class WordData:
    def __init__(self, word, pronunciation, pos, meaning, sample):
        self.word = word.upper()
        self.pronunciation = pronunciation
        self.pos = pos
        self.meaning = meaning
        self.sample = sample

class AnimatedTile:
    def __init__(self, letter, index):
        self.letter = letter
        self.current_idx = index
        self.target_idx = index
        
        # Rendering coordinate offsets
        self.x = float(index)
        self.y = 0.0
        self.target_x = float(index)
        self.target_y = 0.0

class WordPuzzleGame(wx.Frame):
    def __init__(self):
        super().__init__(None, title="Linguistic Word Mechanics Puzzle", style=wx.DEFAULT_FRAME_STYLE)
        
        # Word pool database
        self.word_pool = [
            WordData("STOP", "staap", "noun/verb", "Come to an end; cease from action.", "Please stop at the red light."),
            WordData("TESSELLATION", "teh-suh-lay-shuhn", "noun", "An arrangement of shapes closely fitted together, in a repeated pattern without gaps.", "M.C. Escher is famous for his beautiful lizard tessellations."),
            WordData("SOLVING", "saal-ving", "verb", "Finding an answer to, explanation for, or means of effectively dealing with a problem.", "We are solving this visual mechanics puzzle together!"),
            WordData("LABYRINTH", "la-buh-rinth", "noun", "A complicated irregular network of passages or paths.", "The ancient castle contained a dark labyrinth beneath its floors."),
            WordData("FELINE", "fee-line", "adjective/noun", "Relating to or affecting cats; a member of the cat family.", "The cat walked across the room with effortless feline grace."),
            WordData("RESONANCE", "reh-zuhn-uhns", "noun", "The quality in a sound of being deep, full, and reverberating.", "The acoustic room gave the ambient music a beautiful warmth and resonance."),
            WordData("EPHEMERAL", "uh-feh-muh-ruhl", "adjective", "Lasting for a very short time.", "The autumn colors are beautiful but ephemeral.")
        ]
        
        # Game State
        self.current_word_idx = 0  
        self.current_mode = 0     # 0: Flash Card, 1: Send to End, 2: Slide-Swap, 3: Reverse-Rotation, 4: Combo
        self.tiles = []
        self.lock_input = False
        self.key_queue = []       # Queue to hold buffered keystrokes and Backspaces
        self.click_history = []   # History stack of moved AnimatedTile objects for Level 2+ Backspaces
        
        # Solver State
        self.auto_solve_mode = False
        self.solved_path_steps = []  
        
        # Mechanical Animation States
        self.anim_phase = 0
        self.anim_step = 0.0
        self.selected_tile_idx = -1
        
        # Flash Card Stagger Animation Tracking
        self.flashcard_elapsed = 0.0
        
        # Track the currently hovered tile index
        self.hovered_idx = None
        
        # Victory Celebration Screen States
        self.victory_phase = False
        self.victory_words = []
        self.font_options = ["Arial", "Times New Roman", "Courier New", "Verdana", "Georgia", "Impact", "Trebuchet MS"]
        
        # Set up UI Timers
        self.TICK_TIMER_ID = wx.NewIdRef()
        self.tick_timer = wx.Timer(self, self.TICK_TIMER_ID.GetId())
        self.Bind(wx.EVT_TIMER, self.on_engine_tick, id=self.TICK_TIMER_ID.GetId())
        
        self.init_ui()
        self.start_word_challenge()
        self.tick_timer.Start(20)  # 50 FPS Smooth engine tick

        # Bind hover and mouse-leave events directly to the canvas board panel
        self.board.Bind(wx.EVT_MOTION, self.OnMouseMove)
        self.board.Bind(wx.EVT_LEAVE_WINDOW, self.OnMouseLeave)
        
        # Bind keyboard handler
        self.Bind(wx.EVT_CHAR_HOOK, self.on_key_down)
        
    def init_ui(self):
        self.main_panel = wx.Panel(self)
        self.main_layout = wx.BoxSizer(wx.VERTICAL)
        
        # Top Dashboard Control Bar
        control_sizer = wx.BoxSizer(wx.HORIZONTAL)
        control_sizer.Add(wx.StaticText(self.main_panel, label="Mode:"), 0, wx.ALIGN_CENTER_VERTICAL | wx.LEFT, 15)
        
        # Dropdown Choices
        self.mode_choice = wx.Choice(self.main_panel, choices=[
            "Level 0: Flash Card Reveal",
            "Level 1: Send to End",
            "Level 2: Slide-Swap", 
            "Level 3: Reverse-Rotation",
            "Level 4: Reverse then Slide"
        ])
        self.mode_choice.SetSelection(0)
        self.mode_choice.Bind(wx.EVT_CHOICE, self.on_mode_changed)
        control_sizer.Add(self.mode_choice, 0, wx.ALIGN_CENTER_VERTICAL | wx.LEFT, 5)
        
        # Auto-Solve Button
        self.solve_btn = wx.Button(self.main_panel, label="Auto-Solve")
        self.solve_btn.Bind(wx.EVT_BUTTON, self.trigger_auto_solver)
        control_sizer.Add(self.solve_btn, 0, wx.ALIGN_CENTER_VERTICAL | wx.LEFT, 10)
        
        # Next Word Button
        next_btn = wx.Button(self.main_panel, label="Next Word")
        next_btn.Bind(wx.EVT_BUTTON, lambda e: self.cycle_word())
        control_sizer.Add(next_btn, 0, wx.ALIGN_CENTER_VERTICAL | wx.LEFT, 10)
        
        # Easy Word Button
        easy_btn = wx.Button(self.main_panel, label="Easy Word")
        easy_btn.Bind(wx.EVT_BUTTON, lambda e: self.find_easy_word())
        control_sizer.Add(easy_btn, 0, wx.ALIGN_CENTER_VERTICAL | wx.LEFT, 10)
        
        # Hint Checkbox
        self.hint_checkbox = wx.CheckBox(self.main_panel, label="Show Hint")
        self.hint_checkbox.SetValue(True)
        self.hint_checkbox.Bind(wx.EVT_CHECKBOX, lambda e: self.board.Refresh())
        control_sizer.Add(self.hint_checkbox, 0, wx.ALIGN_CENTER_VERTICAL | wx.LEFT, 15)
        
        self.status_display = wx.StaticText(self.main_panel, label="", style=wx.ALIGN_RIGHT)
        font = self.status_display.GetFont()
        font.SetWeight(wx.FONTWEIGHT_BOLD)
        self.status_display.SetFont(font)
        control_sizer.Add(self.status_display, 1, wx.ALIGN_CENTER_VERTICAL | wx.RIGHT, 15)
        
        self.main_layout.Add(control_sizer, 0, wx.EXPAND | wx.TOP | wx.BOTTOM, 10)
        
        # Metadata Display Card
        self.meta_panel = wx.Panel(self.main_panel, style=wx.BORDER_THEME)
        self.meta_panel.SetBackgroundColour(wx.Colour(35, 38, 46))
        meta_sizer = wx.BoxSizer(wx.VERTICAL)
        
        self.txt_pronounce = wx.StaticText(self.meta_panel, label="")
        self.txt_pronounce.SetForegroundColour(wx.Colour(170, 180, 195))
        self.txt_pos = wx.StaticText(self.meta_panel, label="")
        self.txt_pos.SetForegroundColour(wx.Colour(140, 190, 255))
        self.txt_meaning = wx.StaticText(self.meta_panel, label="", style=wx.ST_NO_AUTORESIZE)
        self.txt_meaning.SetForegroundColour(wx.Colour(230, 235, 245))
        
        self.txt_sample = wx.StaticText(self.meta_panel, label="", style=wx.ST_NO_AUTORESIZE)
        
        f_meta = self.txt_meaning.GetFont()
        f_meta.SetPointSize(11)
        self.txt_meaning.SetFont(f_meta)
        self.txt_sample.SetFont(f_meta)
        
        meta_sizer.Add(self.txt_pronounce, 0, wx.ALL, 6)
        meta_sizer.Add(self.txt_pos, 0, wx.LEFT | wx.RIGHT | wx.BOTTOM, 6)
        meta_sizer.Add(self.txt_meaning, 0, wx.LEFT | wx.RIGHT | wx.BOTTOM | wx.EXPAND, 6)
        meta_sizer.Add(self.txt_sample, 0, wx.LEFT | wx.RIGHT | wx.BOTTOM | wx.EXPAND, 6)
        
        self.meta_panel.SetSizer(meta_sizer)
        self.main_layout.Add(self.meta_panel, 0, wx.EXPAND | wx.LEFT | wx.RIGHT, 15)
        
        # Interactive Graphic Canvas
        self.board = wx.Panel(self.main_panel, style=wx.BORDER_SUNKEN)
        self.board.SetDoubleBuffered(True)
        self.board.SetBackgroundColour(wx.Colour(20, 21, 24))
        self.board.Bind(wx.EVT_PAINT, self.on_paint)
        self.board.Bind(wx.EVT_LEFT_DOWN, self.on_mouse_down)
        self.main_layout.Add(self.board, 1, wx.EXPAND | wx.ALL, 15)
        
        # Under-canvas Descriptive Instructions Panel
        self.instruction_panel = wx.Panel(self.main_panel)
        self.instruction_panel.SetBackgroundColour(wx.Colour(28, 30, 35))
        instr_sizer = wx.BoxSizer(wx.VERTICAL)
        
        self.txt_instruction = wx.StaticText(self.instruction_panel, label="", style=wx.ALIGN_CENTER_HORIZONTAL)
        self.txt_instruction.SetForegroundColour(wx.Colour(210, 215, 225))
        f_instr = self.txt_instruction.GetFont()
        f_instr.SetPointSize(11)
        f_instr.SetStyle(wx.FONTSTYLE_ITALIC)
        self.txt_instruction.SetFont(f_instr)
        
        instr_sizer.Add(self.txt_instruction, 0, wx.ALL | wx.EXPAND, 24)
        self.instruction_panel.SetSizer(instr_sizer)
        self.main_layout.Add(self.instruction_panel, 0, wx.EXPAND | wx.LEFT | wx.RIGHT | wx.BOTTOM, 15)
        
        self.main_panel.SetSizer(self.main_layout)
        
        frame_sizer = wx.BoxSizer(wx.VERTICAL)
        frame_sizer.Add(self.main_panel, 1, wx.EXPAND)
        self.SetSizer(frame_sizer)
        
        self.SetClientSize((950, 620))
        self.SetMinSize((700, 520))

    def set_sample_markup(self, control, wd, color_text="#E1F5D2", size_attr=""):
        """Helper to set the sample label with the primary word highlighted in bright, bold red."""
        sample = wd.sample
        word = wd.word
        
        # Match word case-insensitively, preferring word boundaries
        pattern = re.compile(rf"\b({re.escape(word)})\b", re.IGNORECASE)
        if not pattern.search(sample):
            pattern = re.compile(rf"({re.escape(word)})", re.IGNORECASE)
            
        def replace_match(match):
            return f'<span foreground="#FF3333"><b>{match.group(1)}</b></span>'
            
        marked_up_sample = pattern.sub(replace_match, sample)
        final_markup = f'<span foreground="{color_text}"{size_attr}>Sample: "{marked_up_sample}"</span>'
        control.SetLabelMarkup(final_markup)
        
        # Force recalculation of label bounds to prevent descender clipping
        control.InvalidateBestSize()

    def show_victory_sample(self):
        """Displays the sample text inside the instruction panel in a slightly larger font."""
        wd = self.word_pool[self.current_word_idx]
        self.set_sample_markup(self.txt_instruction, wd, color_text="#D2D7E1", size_attr=' size="large"')
        self.txt_instruction.InvalidateBestSize()
        self.instruction_panel.Layout()
        self.main_panel.Layout()  # Propagate layout updates to the main window container

    def simulate_send_to_end(self, current_tuple, click_idx):
        """Level 1 Mechanic: Send the clicked tile directly to the end of the list."""
        return current_tuple[:click_idx] + current_tuple[click_idx+1:] + (current_tuple[click_idx],)

    def simulate_mirror_pivot(self, current_tuple, click_idx):
        length = len(current_tuple)
        temp = [None] * length
        for i in range(length):
            target = (2 * click_idx - i) % length
            temp[target] = current_tuple[i]
        return tuple(temp)

    def simulate_slide_swap(self, current_tuple, click_idx):
        length = len(current_tuple)
        temp = [None] * length
        for current_pos, letter in enumerate(current_tuple):
            if current_pos < click_idx:
                new_pos = current_pos + (length - 1 - click_idx) + 1
            elif current_pos > click_idx:
                new_pos = current_pos - click_idx - 1
            else:
                new_pos = length - 1 - click_idx
            temp[new_pos] = letter
        return tuple(temp)

    def simulate_reverse_rotation(self, current_tuple, click_idx):
        left = current_tuple[:click_idx]
        pivot = (current_tuple[click_idx],)
        right = current_tuple[click_idx + 1:]
        return left[::-1] + pivot + right[::-1]

    def simulate_combo_move(self, current_tuple, click_idx):
        interim = self.simulate_reverse_rotation(current_tuple, click_idx)
        return self.simulate_slide_swap(interim, click_idx)

    def calculate_shortest_solve_path(self, start_tuple, target_word, game_mode=1):
        if game_mode == 0:
            return []  # Flash card requires no mechanical solving path
            
        elif game_mode == 1:  # LEVEL 1: Send to End Solver (BFS)
            state = tuple(start_tuple)
            target = tuple(target_word)
            if state == target:
                return []
            
            queue = deque([(state, [])])
            visited = {state}
            
            while queue:
                curr_state, path = queue.popleft()
                if curr_state == target:
                    return path
                for click_idx in range(len(curr_state)):
                    next_state = self.simulate_send_to_end(curr_state, click_idx)
                    if next_state not in visited:
                        visited.add(next_state)
                        queue.append((next_state, path + [click_idx]))
            return []
            
        elif game_mode == 2:  # LEVEL 2: Slide-Swap Solver
            state = list(start_tuple)
            target = list(target_word)
            n = len(state)
            path = []

            limit = 0
            while state != target and limit < 300:
                limit += 1
                k = 0
                for check_k in range(n, 0, -1):
                    if state[n - check_k:] == target[:check_k]:
                        k = check_k
                        break
                if state == target:
                    break
                needed_char = target[k]
                p = -1
                for idx in range(n - k - 1, -1, -1):
                    if state[idx] == needed_char:
                        p = idx
                        break
                if p == -1:
                    break 

                if k == 0:
                    click_idx = p + 1
                    path.append(click_idx)
                    state = list(self.simulate_slide_swap(tuple(state), click_idx))
                else:
                    path.append(p)
                    state = list(self.simulate_slide_swap(tuple(state), p))
                    if state == target:
                        break
                    right_click_idx = n - p
                    if right_click_idx < n:
                        path.append(right_click_idx)
                        state = list(self.simulate_slide_swap(tuple(state), right_click_idx))
            return path
            
        elif game_mode == 3:  # LEVEL 3: Reverse-Rotation Solver
            state = tuple(start_tuple)
            target = tuple(target_word)
            n = len(state)
            full_path = []
            
            for k in range(1, n + 1):
                stage_path = self._solve_reverse_rotation_stage(state, target, k)
                if stage_path is None:
                    return []
                for step in stage_path:
                    state = self.simulate_reverse_rotation(state, step)
                    full_path.append(step)
            return full_path
            
        else:  # LEVEL 4: Combo Solver
            state = tuple(start_tuple)
            target = tuple(target_word)
            
            def get_global_heuristic(curr):
                return sum(1 for i in range(len(curr)) if curr[i] != target[i])
                
            if state == target:
                return []
                
            counter = 0
            open_set = [(get_global_heuristic(state), counter, state, [])]
            g_score = {state: 0}
            max_iterations = 6000  
            
            while open_set and counter < max_iterations:
                _, _, current_state, path = heapq.heappop(open_set)
                if current_state == target:
                    return path
                    
                current_g = g_score.get(current_state, float('inf'))
                for click_idx in range(len(current_state)):
                    next_state = self.simulate_combo_move(current_state, click_idx)
                    tentative_g = current_g + 1
                    
                    if tentative_g < g_score.get(next_state, float('inf')):
                        g_score[next_state] = tentative_g
                        f_score = tentative_g + get_global_heuristic(next_state)
                        counter += 1
                        heapq.heappush(open_set, (f_score, counter, next_state, path + [click_idx]))
            return []

    def _solve_reverse_rotation_stage(self, start_tuple, target_tuple, k):
        target_prefix = target_tuple[:k]
        length = len(start_tuple)
        
        def get_heuristic(current):
            score = 0
            for i in range(k):
                if current[i] != target_prefix[i]:
                    score += 1
            return score

        if get_heuristic(start_tuple) == 0:
            return []

        counter = 0
        open_set = [(get_heuristic(start_tuple), counter, start_tuple, [])]
        g_score = {start_tuple: 0}
        
        max_iterations = 4000
        iterations = 0

        while open_set and iterations < max_iterations:
            iterations += 1
            _, _, current_state, path = heapq.heappop(open_set)
            if get_heuristic(current_state) == 0:
                return path

            current_g = g_score.get(current_state, float('inf'))
            for click_idx in range(length):
                next_state = self.simulate_reverse_rotation(current_state, click_idx)
                tentative_g = current_g + 1
                
                if tentative_g < g_score.get(next_state, float('inf')):
                    g_score[next_state] = tentative_g
                    f_score = tentative_g + get_heuristic(next_state)
                    counter += 1
                    heapq.heappush(open_set, (f_score, counter, next_state, path + [click_idx]))
        return None
    
    def start_word_challenge(self):
        self.lock_input = False
        self.anim_phase = 0
        self.anim_step = 0.0
        self.selected_tile_idx = -1
        self.click_history.clear() # Reset undo memory stack
        self.auto_solve_mode = False
        self.solved_path_steps = []
        self.key_queue.clear()     # Flush the input buffer queue
        
        # Reset Victory State
        self.victory_phase = False
        self.victory_words = []
        
        wd = self.word_pool[self.current_word_idx]
        
        self.txt_pronounce.SetLabel(f"Pronunciation: \"{wd.pronunciation}\"")
        self.txt_pos.SetLabel(f"Part of Speech: {wd.pos.upper()}")
        self.txt_meaning.SetLabel(f"Meaning: {wd.meaning}")
        
        # Apply bright red markup highlighting to the sample label
        self.set_sample_markup(self.txt_sample, wd)
        self.meta_panel.Layout()
        
        if self.current_mode == 0:
            self.solve_btn.Enable(False)
            self.txt_instruction.SetLabel(
                "Mode: Flash Card Reveal. Watch the word construct itself cleanly from left to right."
            )
            # Level 0 requires letters in the absolute correct order
            letter_order = list(wd.word)
            self.anim_phase = 50  # Isolated ID to prevent boundary collision with Level 2/3
            self.flashcard_elapsed = 0.0
            self.lock_input = True
        else:
            self.solve_btn.Enable(True)
            if self.current_mode == 1:  # LEVEL 1
                self.txt_instruction.SetLabel(
                    "Instructions: Click a tile, press a letter key, or press Backspace to reverse.\n"
                    "Chosen letters slide to the end; Backspace pulls the last tile to the front."
                )
            elif self.current_mode == 2:  # LEVEL 2
                self.txt_instruction.SetLabel(
                    "Instructions: Click a tile, press a letter key, or press Backspace to repeat.\n"
                    "Chosen tiles slide-swap; Backspace clicks the previous tile again."
                )
            elif self.current_mode == 3:  # LEVEL 3
                self.txt_instruction.SetLabel(
                    "Instructions: Click a tile, press a letter key, or press Backspace to repeat.\n"
                    "Chosen tiles act as anchors; Backspace clicks the previous tile again."
                )
            else:   # LEVEL 4
                self.txt_instruction.SetLabel(
                    "Instructions: Click a tile, press a letter key, or press Backspace to repeat.\n"
                    "Combines Reverse-Rotation and Slide-Swap; Backspace clicks the previous tile again."
                )
                
            # Scramble for actual gameplay levels
            indices = list(range(len(wd.word)))
            if len(indices) > 1:
                while indices == list(range(len(wd.word))):
                    random.shuffle(indices)
            letter_order = [wd.word[idx] for idx in indices]
            
        self.txt_instruction.InvalidateBestSize()
        self.instruction_panel.Layout()
        self.main_panel.Layout()
        
        self.tiles = []
        for position, letter in enumerate(letter_order):
            tile = AnimatedTile(letter, position)
            if self.current_mode == 0:
                tile.y = -12.0  # Safe offset placing them entirely off the top screen
            self.tiles.append(tile)
            
        if self.current_mode == 0:
            self.status_display.SetLabel("Reviewing structural flash card arrangement...")
        else:
            self.status_display.SetLabel("Rearrange the tiles to build the correct word target!")
        self.board.Refresh()

    def trigger_auto_solver(self, event):
        if self.anim_phase > 0 or self.auto_solve_mode or self.victory_phase or self.current_mode == 0:
            return
            
        wd = self.word_pool[self.current_word_idx]
        letter_order = [t.letter for t in self.tiles]
        start_state = tuple(letter_order)
        
        self.status_display.SetLabel("Solving layout...")
        self.solved_path_steps = self.calculate_shortest_solve_path(start_state, wd.word, game_mode=self.current_mode)
        
        if self.solved_path_steps:
            self.auto_solve_mode = True
            self.lock_input = True
            self.solve_btn.Enable(False)
        else:
            self.status_display.SetLabel("No direct path found within limits.")

    def cycle_word(self):
        self.current_word_idx = (self.current_word_idx + 1) % len(self.word_pool)
        self.start_word_challenge()

    def find_easy_word(self):
        # Scan through the pool to find the next word shorter than 8 letters
        start_search = self.current_word_idx
        num_words = len(self.word_pool)
        for i in range(1, num_words + 1):
            next_check = (start_search + i) % num_words
            if len(self.word_pool[next_check].word) < 8:
                self.current_word_idx = next_check
                self.start_word_challenge()
                return
        # If none found, just cycle normally
        self.cycle_word()

    def on_mode_changed(self, event):
        self.current_mode = self.mode_choice.GetSelection()
        self.start_word_challenge()

    def execute_mechanical_shift(self, tile_index, is_undo=False):
        if self.victory_phase or self.current_mode == 0: return
        self.selected_tile_idx = tile_index
        clicked_tile = self.tiles[tile_index]
        
        # Track active player moves into stack (exclude Backspace-triggered undos and engine solvers)
        if not is_undo and not self.auto_solve_mode:
            self.click_history.append(clicked_tile)
            
        self.anim_step = 0.0
        
        if self.current_mode == 1:  # LEVEL 1: Send to End
            self.anim_phase = 41
            for t in self.tiles:
                t.target_x = t.x
                if t.current_idx == self.selected_tile_idx:
                    t.target_y = -1.2  # Lift up
                else:
                    t.target_y = 0.0

        elif self.current_mode == 2:  # LEVEL 2: Slide-Swap
            self.anim_phase = 1
            for t in self.tiles:
                t.target_x = t.x
                if t.current_idx < self.selected_tile_idx:
                    t.target_y = 1.2  
                elif t.current_idx > self.selected_tile_idx:
                    t.target_y = -1.2  
                else:
                    t.target_y = 0.0
        else:  # LEVELS 3 & 4: Rotation/Combo
            self.anim_phase = 10
            for t in self.tiles:
                if t.current_idx < self.selected_tile_idx:
                    t.target_idx = self.selected_tile_idx - 1 - t.current_idx
                elif t.current_idx > self.selected_tile_idx:
                    start_r = self.selected_tile_idx + 1
                    size_r = len(self.tiles) - start_r
                    local_idx = t.current_idx - start_r
                    t.target_idx = start_r + (size_r - 1 - local_idx)
                else:
                    t.target_idx = t.current_idx

    def execute_level1_backspace(self):
        """Level 1 Backspace Mechanic: Move the very last tile to the front of the list."""
        if self.victory_phase or self.current_mode != 1: return
        self.selected_tile_idx = len(self.tiles) - 1
        self.anim_step = 0.0
        self.anim_phase = 61
        for t in self.tiles:
            t.target_x = t.x
            if t.current_idx == self.selected_tile_idx:
                t.target_y = -1.2  # Lift up
            else:
                t.target_y = 0.0

    def trigger_auto_reversal(self):
        self.lock_input = True
        self.selected_tile_idx = -1
        self.anim_step = 0.0
        self.anim_phase = 30 
        for t in self.tiles:
            t.target_idx = len(self.tiles) - 1 - t.current_idx

    def check_victory_conditions(self, word_layout, wd):
        if word_layout == wd.word:
            self.status_display.SetLabel("Correct! Puzzle Complete! (Click screen or press any key to advance)")
            self.victory_phase = True
            self.key_queue.clear() # Prevent leftover keystrokes from bleeding into next puzzle
            self.show_victory_sample()
        elif word_layout == wd.word[::-1]:
            self.status_display.SetLabel("Correct (Spelled Backwards)! Auto-reversing layout...")
            self.trigger_auto_reversal()

    def process_key_queue(self):
        """Processes the next queued mechanical keystroke in the buffer."""
        if self.victory_phase:
            self.key_queue.clear()
            return

        # Stop if we are currently animating, or wait for the engine to yield lock
        if self.lock_input or self.anim_phase > 0:
            return

        while self.key_queue:
            char_to_process = self.key_queue.pop(0)

            # Special Backspace Key Processing Branch
            if char_to_process == "BACKSPACE":
                if self.current_mode == 1:
                    self.lock_input = True
                    self.hovered_idx = None
                    self.execute_level1_backspace()
                    break
                elif self.current_mode >= 2:
                    if self.click_history:
                        # Pop the exact last tile we physically clicked/moved
                        last_tile = self.click_history.pop()
                        
                        # Find its current physical index on the board
                        current_location = -1
                        for idx, tile in enumerate(self.tiles):
                            if tile is last_tile:
                                current_location = idx
                                break
                        
                        if current_location != -1:
                            self.lock_input = True
                            self.hovered_idx = None
                            self.execute_mechanical_shift(current_location, is_undo=True)
                            break
                continue

            # Recalculate target indexes from leftmost tile based on updated arrangement
            matched_idx = -1
            for idx, tile in enumerate(self.tiles):
                if tile.letter == char_to_process:
                    matched_idx = idx
                    break

            if matched_idx != -1:
                self.lock_input = True
                self.hovered_idx = None
                self.execute_mechanical_shift(matched_idx)
                break  # Yield key loops; animation engine callback will trigger next evaluation

    def on_engine_tick(self, event):
        refresh_needed = False
        wd = self.word_pool[self.current_word_idx]
        
        if self.victory_phase:
            if len(self.victory_words) < 160:  
                w, h = self.board.GetSize()
                word_entry = {
                    'text': wd.word,
                    'x': random.randint(-20, max(10, w - 60)),
                    'y': random.randint(0, max(10, h - 20)),
                    'color': wx.Colour(random.randint(30, 110), random.randint(30, 110), random.randint(30, 110)),
                    'size': random.randint(14, 48),
                    'font_name': random.choice(self.font_options)
                }
                self.victory_words.append(word_entry)
                refresh_needed = True
        
        if self.auto_solve_mode and self.anim_phase == 0 and not self.victory_phase:
            rebuilt_str = "".join([t.letter for t in self.tiles])
            if rebuilt_str != wd.word and len(self.solved_path_steps) > 0:
                next_click_idx = self.solved_path_steps.pop(0)
                self.execute_mechanical_shift(next_click_idx)
                refresh_needed = True
            elif rebuilt_str == wd.word:
                self.status_display.SetLabel("Correct! Word solved flawlessly. (Click screen to advance)")
                self.auto_solve_mode = False
                self.solve_btn.Enable(True)
                self.victory_phase = True
                self.show_victory_sample()

        # Level 0 Flash Card Sequential Dynamic Entry Animation (Isolated Phase 50)
        if self.anim_phase == 50:
            refresh_needed = True
            self.flashcard_elapsed += 0.14  # Continuous timeline velocity (no frame skips)
            
            all_done = True
            for idx, tile in enumerate(self.tiles):
                # Each tile animation span occupies exactly 1.0 interval units
                if self.flashcard_elapsed < idx:
                    # Tile has not begun its sequence yet
                    tile.y = -12.0
                    all_done = False
                elif self.flashcard_elapsed >= idx + 1.0:
                    # Animation finished
                    tile.y = 0.0
                else:
                    # Local cubic easing inside its active bracket
                    all_done = False
                    t = self.flashcard_elapsed - idx  # normalized local progression: 0.0 -> 1.0
                    ease_factor = 1.0 - ((1.0 - t) ** 3)
                    tile.y = -12.0 * (1.0 - ease_factor)
            
            # Ensure the animation doesn't cut off early
            if self.flashcard_elapsed < len(self.tiles):
                all_done = False

            if all_done:
                self.anim_phase = 0
                self.status_display.SetLabel("Flash card arrangement finalized. (Click screen to advance)")
                self.victory_phase = True
                self.show_victory_sample()

        # Level 1 Send to End Animations
        if 40 < self.anim_phase < 50:
            refresh_needed = True
            self.anim_step += 0.08
            
            if self.anim_step >= 1.0:
                self.anim_step = 0.0
                self.anim_phase += 1
                
                if self.anim_phase == 42:  
                    for t in self.tiles:
                        t.x = t.target_x
                        t.y = t.target_y
                        if t.current_idx == self.selected_tile_idx:
                            t.target_x = float(len(self.tiles) - 1)
                        elif t.current_idx > self.selected_tile_idx:
                            t.target_x = float(t.current_idx - 1)
                        else:
                            t.target_x = float(t.current_idx)
                            
                elif self.anim_phase == 43:  
                    for t in self.tiles:
                        t.x = t.target_x
                        t.y = t.target_y
                        t.target_y = 0.0
                        
                elif self.anim_phase == 44:  
                    final_arrangement = [None] * len(self.tiles)
                    for t in self.tiles:
                        log_idx = int(round(t.target_x))
                        t.current_idx = log_idx
                        t.x = float(log_idx)
                        t.y = 0.0
                        final_arrangement[log_idx] = t
                        
                    self.tiles = final_arrangement
                    self.anim_phase = 0
                    
                    if not self.auto_solve_mode:
                        self.lock_input = False
                        rebuilt_str = "".join([t.letter for t in self.tiles])
                        self.check_victory_conditions(rebuilt_str, wd)
                        # Process keyboard input buffer once we're done and not in victory
                        if not self.victory_phase:
                            self.process_key_queue()
            
            for t in self.tiles:
                if self.anim_phase == 41:  
                    if t.current_idx == self.selected_tile_idx:
                        t.y = 0.0 - (1.2 * self.anim_step)
                elif self.anim_phase == 42:  
                    t.x = t.x + (t.target_x - t.x) * self.anim_step
                elif self.anim_phase == 43:  
                    t.y = t.y + (t.target_y - t.y) * self.anim_step

        # Level 1 Backspace (Send Last Tile to Front) Animations
        if 60 < self.anim_phase < 70:
            refresh_needed = True
            self.anim_step += 0.08

            if self.anim_step >= 1.0:
                self.anim_step = 0.0
                self.anim_phase += 1

                if self.anim_phase == 62:
                    for t in self.tiles:
                        t.x = t.target_x
                        t.y = t.target_y
                        if t.current_idx == len(self.tiles) - 1:
                            t.target_x = 0.0
                        else:
                            t.target_x = float(t.current_idx + 1)
                
                elif self.anim_phase == 63:
                    for t in self.tiles:
                        t.x = t.target_x
                        t.y = t.target_y
                        t.target_y = 0.0
                
                elif self.anim_phase == 64:
                    final_arrangement = [None] * len(self.tiles)
                    for t in self.tiles:
                        log_idx = int(round(t.target_x))
                        t.current_idx = log_idx
                        t.x = float(log_idx)
                        t.y = 0.0
                        final_arrangement[log_idx] = t
                    
                    self.tiles = final_arrangement
                    self.anim_phase = 0

                    if not self.auto_solve_mode:
                        self.lock_input = False
                        rebuilt_str = "".join([t.letter for t in self.tiles])
                        self.check_victory_conditions(rebuilt_str, wd)
                        if not self.victory_phase:
                            self.process_key_queue()

            for t in self.tiles:
                if self.anim_phase == 61:
                    if t.current_idx == len(self.tiles) - 1:
                        t.y = 0.0 - (1.2 * self.anim_step)
                elif self.anim_phase == 62:
                    t.x = t.x + (t.target_x - t.x) * self.anim_step
                elif self.anim_phase == 63:
                    t.y = t.y + (t.target_y - t.y) * self.anim_step
                    
        # Level 2 Slide Animations
        if 0 < self.anim_phase < 10:
            refresh_needed = True
            self.anim_step += 0.08  
            
            if self.anim_step >= 1.0:
                self.anim_step = 0.0
                self.anim_phase += 1
                
                if self.anim_phase == 2:  
                    for t in self.tiles:
                        t.x = t.target_x
                        t.y = t.target_y
                        if t.current_idx < self.selected_tile_idx:
                            t.target_x = t.current_idx + (len(self.tiles) - 1 - self.selected_tile_idx) + 1
                        elif t.current_idx > self.selected_tile_idx:
                            t.target_x = t.current_idx - self.selected_tile_idx - 1
                        else:
                            t.target_x = len(self.tiles) - 1 - self.selected_tile_idx
                            
                elif self.anim_phase == 3:  
                    for t in self.tiles:
                        t.x = t.target_x
                        t.y = t.target_y
                        t.target_y = 0.0
                        
                elif self.anim_phase == 4:  
                    final_arrangement = [None] * len(self.tiles)
                    for t in self.tiles:
                        log_idx = int(round(t.target_x))
                        t.current_idx = log_idx
                        t.x = float(log_idx)
                        t.y = 0.0
                        final_arrangement[log_idx] = t
                        
                    self.tiles = final_arrangement
                    self.anim_phase = 0
                    
                    if not self.auto_solve_mode:
                        self.lock_input = False
                        rebuilt_str = "".join([t.letter for t in self.tiles])
                        self.check_victory_conditions(rebuilt_str, wd)
                        # Process keyboard input buffer once we're done and not in victory
                        if not self.victory_phase:
                            self.process_key_queue()
            
            for t in self.tiles:
                if self.anim_phase == 1:  
                    if t.current_idx < self.selected_tile_idx:
                        t.y = 0.0 + (1.2 * self.anim_step)
                    elif t.current_idx > self.selected_tile_idx:
                        t.y = 0.0 - (1.2 * self.anim_step)
                elif self.anim_phase == 2:  
                    t.x = t.x + (t.target_x - t.x) * self.anim_step
                    if t.current_idx == self.selected_tile_idx:
                        t.y = 0.0 + math.sin(self.anim_step * math.pi) * 0.2
                elif self.anim_phase == 3:  
                    t.y = t.y + (t.target_y - t.y) * self.anim_step

        # Level 3 & 4 Rotation Animations
        elif 10 <= self.anim_phase < 20:
            refresh_needed = True
            self.anim_step += 0.04  
            
            if self.anim_step >= 1.0:
                final_arrangement = [None] * len(self.tiles)
                for t in self.tiles:
                    t.current_idx = t.target_idx
                    t.x = float(t.target_idx)
                    t.y = 0.0
                    final_arrangement[t.target_idx] = t
                    
                self.tiles = final_arrangement
                
                if self.current_mode == 4:  # LEVEL 4: Combo Slide transition triggers next
                    self.anim_phase = 1
                    self.anim_step = 0.0
                    for t in self.tiles:
                        t.target_x = t.x
                        if t.current_idx < self.selected_tile_idx:
                            t.target_y = 1.2  
                        elif t.current_idx > self.selected_tile_idx:
                            t.target_y = -1.2  
                        else:
                            t.target_y = 0.0
                else:
                    self.anim_phase = 0
                    self.anim_step = 0.0
                    
                    if not self.auto_solve_mode:
                        self.lock_input = False
                        rebuilt_str = "".join([t.letter for t in self.tiles])
                        self.check_victory_conditions(rebuilt_str, wd)
                        # Process keyboard input buffer once we're done and not in victory
                        if not self.victory_phase:
                            self.process_key_queue()
            else:
                num_tiles = len(self.tiles)
                left_size = self.selected_tile_idx
                right_size = num_tiles - (self.selected_tile_idx + 1)
                
                mid_left = (left_size - 1) / 2.0 if left_size > 0 else 0.0
                mid_right = self.selected_tile_idx + 1 + (right_size - 1) / 2.0 if right_size > 0 else 0.0
                
                for t in self.tiles:
                    if t.current_idx < self.selected_tile_idx:
                        t.x = t.current_idx + (t.target_idx - t.current_idx) * self.anim_step
                        if left_size > 1:
                            dist = abs(t.current_idx - mid_left)
                            v_factor = 1.0 - (dist / mid_left) if mid_left > 0 else 1.0
                        else:
                            v_factor = 1.0
                        v_factor = max(0.0, min(1.0, v_factor))
                        t.y = -1.2 * v_factor * math.sin(self.anim_step * math.pi)
                        
                    elif t.current_idx > self.selected_tile_idx:
                        t.x = t.current_idx + (t.target_idx - t.current_idx) * self.anim_step
                        if right_size > 1:
                            dist = abs(t.current_idx - mid_right)
                            half_span = (right_size - 1) / 2.0
                            v_factor = 1.0 - (dist / half_span) if half_span > 0 else 1.0
                        else:
                            v_factor = 1.0
                        v_factor = max(0.0, min(1.0, v_factor))
                        t.y = 1.2 * v_factor * math.sin(self.anim_step * math.pi)
                    else:
                        t.x = float(t.current_idx)
                        t.y = 0.0

        # Solution Backwards Auto-Reversal Animation Phase
        elif self.anim_phase == 30:
            refresh_needed = True
            self.anim_step += 0.05
            
            if self.anim_step >= 1.0:
                final_arrangement = [None] * len(self.tiles)
                for t in self.tiles:
                    t.current_idx = t.target_idx
                    t.x = float(t.target_idx)
                    t.y = 0.0
                    final_arrangement[t.target_idx] = t
                self.tiles = final_arrangement
                self.anim_phase = 0
                self.anim_step = 0.0
                self.victory_phase = True
                self.key_queue.clear() # Clear keyboard buffer on final victory phase
                self.show_victory_sample()
            else:
                num_tiles = len(self.tiles)
                midpoint = (num_tiles - 1) / 2.0
                for t in self.tiles:
                    t.x = t.current_idx + (t.target_idx - t.current_idx) * self.anim_step
                    direction = 1 if t.current_idx < midpoint else -1
                    t.y = direction * 1.0 * math.sin(self.anim_step * math.pi)

        if refresh_needed:
            self.board.Refresh()

    def on_mouse_down(self, event):
        # Intercept screen clicks during victory to immediately proceed to next word
        if self.victory_phase:
            self.cycle_word()
            return

        if self.lock_input or self.auto_solve_mode or self.anim_phase > 0 or self.current_mode == 0:
            return
            
        w, h = self.board.GetSize()
        num_tiles = len(self.tiles)
        if num_tiles == 0: return
        
        tile_w = min(70, w // (num_tiles + 2))
        total_grid_w = tile_w * num_tiles
        start_x = (w - total_grid_w) // 2
        center_y = h // 2
        
        pt = event.GetPosition()
        
        if center_y - tile_w//2 <= pt.y <= center_y + tile_w//2:
            clicked_col = (pt.x - start_x) // tile_w
            if 0 <= clicked_col < num_tiles:
                self.lock_input = True
                self.execute_mechanical_shift(clicked_col)

    def on_key_down(self, event):
        """Keyboard control handler with input buffer queue & Backspace hook."""
        if self.victory_phase:
            self.key_queue.clear()
            self.cycle_word()
            return

        if self.auto_solve_mode or self.current_mode == 0:
            event.Skip()
            return

        raw_key = event.GetKeyCode()
        if raw_key == wx.WXK_BACK:
            # Buffer backspaces seamlessly into queue
            self.key_queue.append("BACKSPACE")
            if self.anim_phase == 0 and not self.lock_input:
                self.process_key_queue()
            return

        key = event.GetUnicodeKey()
        if key == wx.WXK_NONE:
            event.Skip()
            return

        # Convert character to uppercase to match the raw tiles list
        char_pressed = chr(key).upper()

        # Check if the pressed key is a playable letter in the current puzzle
        valid_letters = {t.letter for t in self.tiles}
        if char_pressed in valid_letters:
            self.key_queue.append(char_pressed)
            # If the engine is idle, process the queued buffer immediately
            if self.anim_phase == 0 and not self.lock_input:
                self.process_key_queue()
        else:
            event.Skip()

    def OnMouseMove(self, event):
        if self.lock_input or self.auto_solve_mode or self.anim_phase > 0 or self.victory_phase or self.current_mode == 0:
            if self.hovered_idx is not None:
                self.hovered_idx = None
                self.board.Refresh()
            return

        w, h = self.board.GetSize()
        num_tiles = len(self.tiles)
        if num_tiles == 0: return
        
        tile_w = min(70, w // (num_tiles + 2))
        total_grid_w = tile_w * num_tiles
        start_x = (w - total_grid_w) // 2
        center_y = h // 2
        
        pt = event.GetPosition()
        
        target_hover = None
        if center_y - tile_w//2 <= pt.y <= center_y + tile_w//2:
            col = (pt.x - start_x) // tile_w
            if 0 <= col < num_tiles:
                target_hover = col
                
        if self.hovered_idx != target_hover:
            self.hovered_idx = target_hover
            self.board.Refresh()  

    def OnMouseLeave(self, event):
        if self.hovered_idx is not None:
            self.hovered_idx = None
            self.board.Refresh()

    def on_paint(self, event):
        dc = wx.PaintDC(self.board)
        w, h = self.board.GetSize()
        
        if self.victory_words:
            for word in self.victory_words:
                f_celebrate = wx.Font(word['size'], wx.FONTFAMILY_DEFAULT, wx.FONTSTYLE_NORMAL, wx.FONTWEIGHT_BOLD, faceName=word['font_name'])
                dc.SetFont(f_celebrate)
                dc.SetTextForeground(word['color'])
                dc.DrawText(word['text'], word['x'], word['y'])
        
        wd = self.word_pool[self.current_word_idx]
        num_tiles = len(self.tiles)
        if num_tiles == 0: return
        
        tile_w = min(70, w // (num_tiles + 2))
        total_grid_w = tile_w * num_tiles
        start_x = (w - total_grid_w) // 2
        center_y = h // 2
        
        font = wx.Font(max(12, int(tile_w * 0.45)), wx.FONTFAMILY_SWISS, wx.FONTSTYLE_NORMAL, wx.FONTWEIGHT_BOLD)
        dc.SetFont(font)
        
        dc.SetPen(wx.Pen(wx.Colour(45, 48, 55), 2, wx.PENSTYLE_DOT))
        dc.DrawLine(start_x, center_y, start_x + total_grid_w, center_y)

        # Primary Tiles Hint Prefix Evaluation Logic (FORWARD Direction ONLY)
        primary_blue_indices = [False] * len(self.tiles)
        if self.current_mode != 0 and self.anim_phase == 0 and self.hint_checkbox.IsChecked() and len(wd.word) > 0:
            current_str = "".join([t.letter for t in self.tiles])
            best_len = 0
            best_start_idx = -1
            target_pattern = wd.word
            
            for pattern_len in range(1, len(target_pattern) + 1):
                sub_str = target_pattern[:pattern_len]
                idx = current_str.find(sub_str)
                if idx != -1:
                    if pattern_len > best_len:
                        best_len = pattern_len
                        best_start_idx = idx

            if best_start_idx != -1:
                for i in range(best_start_idx, best_start_idx + best_len):
                    primary_blue_indices[i] = True
        
        for idx, tile in enumerate(self.tiles):
            # Only draw tiles that have crossed the timeline threshold in Level 0
            if self.current_mode == 0 and self.anim_phase == 50 and self.flashcard_elapsed < idx:
                continue
                
            draw_x = int(start_x + (tile.x * tile_w))
            draw_y = int(center_y - (tile_w // 2) + (tile.y * tile_w))
            
            tile_rect = wx.Rect(draw_x, draw_y, tile_w - 6, tile_w - 6)
            
            if self.current_mode == 0:
                bg_color = wx.Colour(70, 110, 190)
                border_color = wx.Colour(140, 180, 255)
            elif self.anim_phase == 0:
                # Apply Light Blue styling if it matches the current sequence pattern and hint is checked
                if self.hint_checkbox.IsChecked() and primary_blue_indices[idx]:
                    bg_color = wx.Colour(38, 55, 75)
                    border_color = wx.Colour(110, 180, 255)
                else:
                    is_correct = (wd.word[tile.current_idx] == tile.letter)
                    bg_color = wx.Colour(40, 140, 80) if is_correct else wx.Colour(180, 50, 50)
                    border_color = wx.Colour(100, 255, 150) if is_correct else wx.Colour(255, 110, 110)
            else:
                if tile.current_idx == self.selected_tile_idx:
                    bg_color = wx.Colour(40, 160, 120)
                    border_color = wx.Colour(150, 255, 200)
                else:
                    bg_color = wx.Colour(55, 60, 72)
                    border_color = wx.Colour(90, 100, 120)
                    
            dc.SetBrush(wx.Brush(bg_color))
            dc.SetPen(wx.Pen(border_color, 2))
            dc.DrawRectangle(tile_rect)
            
            dc.SetTextForeground(wx.Colour(255, 255, 255))
            dc.DrawLabel(tile.letter, tile_rect, wx.ALIGN_CENTER)

        # Hover Hint Preview Sub-System Layer (FORWARD Direction ONLY)
        if self.current_mode != 0 and self.hovered_idx is not None and self.anim_phase == 0 and not self.auto_solve_mode and not self.victory_phase:
            current_state_tuple = tuple(t.letter for t in self.tiles)
            if self.current_mode == 1:  # LEVEL 1
                preview_state = self.simulate_send_to_end(current_state_tuple, self.hovered_idx)
            elif self.current_mode == 2:  # LEVEL 2
                preview_state = self.simulate_slide_swap(current_state_tuple, self.hovered_idx)
            elif self.current_mode == 3:  # LEVEL 3
                preview_state = self.simulate_reverse_rotation(current_state_tuple, self.hovered_idx)
            else:  # LEVEL 4
                preview_state = self.simulate_combo_move(current_state_tuple, self.hovered_idx)

            preview_y = center_y + (tile_w // 2) + 24 

            light_gray_bg = wx.Colour(38, 41, 48)        
            light_gray_border = wx.Colour(85, 92, 105)  
            text_color = wx.Colour(165, 172, 185)         

            light_blue_bg = wx.Colour(38, 55, 75)
            light_blue_border = wx.Colour(110, 180, 255)
            blue_text_color = wx.Colour(180, 220, 255)

            blue_indices = [False] * len(preview_state)
            
            if self.hint_checkbox.IsChecked() and len(wd.word) > 0:
                preview_str = "".join(preview_state)
                best_len = 0
                best_start_idx = -1
                target_pattern = wd.word
                
                for pattern_len in range(1, len(target_pattern) + 1):
                    sub_str = target_pattern[:pattern_len]
                    idx = preview_str.find(sub_str)
                    if idx != -1:
                        if pattern_len > best_len:
                            best_len = pattern_len
                            best_start_idx = idx

                if best_start_idx != -1:
                    for i in range(best_start_idx, best_start_idx + best_len):
                        blue_indices[i] = True

            for i, letter in enumerate(preview_state):
                draw_x = int(start_x + (i * tile_w))
                tile_rect = wx.Rect(draw_x, preview_y, tile_w - 6, tile_w - 6)

                if blue_indices[i]:
                    dc.SetBrush(wx.Brush(light_blue_bg))
                    dc.SetPen(wx.Pen(light_blue_border, 1, style=wx.PENSTYLE_SHORT_DASH))
                    dc.SetTextForeground(blue_text_color)
                else:
                    dc.SetBrush(wx.Brush(light_gray_bg))
                    dc.SetPen(wx.Pen(light_gray_border, 1, style=wx.PENSTYLE_SHORT_DASH))
                    dc.SetTextForeground(text_color)

                dc.DrawRectangle(tile_rect)
                dc.DrawLabel(letter, tile_rect, wx.ALIGN_CENTER)

                
if __name__ == "__main__":
    app = wx.App()
    frame = WordPuzzleGame()
    frame.Show()
    app.MainLoop()
