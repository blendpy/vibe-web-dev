/**
 * EMOJI MEMORY MATCH SOLITAIRE — HTML5 Canvas Port & Enhancement of EmojiMatch.py
 * Preserves the wxPython 50% random flash hint, adjustable flash duration slider,
 * smooth alpha card-to-artwork fade transitions, and 400-particle victory confetti.
 */


// --- Synthesized Web Audio Sound Engine ---
class SoundEffects {
    constructor() {
        this.enabled = true;
        this.ctx = null;
    }

    initContext() {
        if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    playFlip() {
        if (!this.enabled) return;
        this.initContext();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(280, now);
        osc.frequency.exponentialRampToValueAtTime(420, now + 0.06);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.065);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.07);
    }

    playMatch() {
        if (!this.enabled) return;
        this.initContext();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const freqs = [523.25, 659.25, 783.99]; // C5, E5, G5
        freqs.forEach((f, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(f, now + idx * 0.045);
            gain.gain.setValueAtTime(0.12, now + idx * 0.045);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.045 + 0.28);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now + idx * 0.045);
            osc.stop(now + idx * 0.045 + 0.3);
        });
    }

    playMismatch() {
        if (!this.enabled) return;
        this.initContext();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        [240, 180].forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + i * 0.09);
            gain.gain.setValueAtTime(0.08, now + i * 0.09);
            gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.09 + 0.14);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now + i * 0.09);
            osc.stop(now + i * 0.09 + 0.15);
        });
    }

    playHint() {
        if (!this.enabled) return;
        this.initContext();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.25);
        gain.gain.setValueAtTime(0.07, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.3);
    }

    playVictory() {
        if (!this.enabled) return;
        this.initContext();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + i * 0.09);
            gain.gain.setValueAtTime(0.15, now + i * 0.09);
            gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.09 + 0.55);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now + i * 0.09);
            osc.stop(now + i * 0.09 + 0.6);
        });
    }
}

// --- MemoryTile Model (mirrors Python MemoryTile class in EmojiMatch.py) ---
class MemoryTile {
    constructor(col, row, emoji, subCanvas) {
        this.gridPos = { col, row };
        this.emoji = emoji;
        this.subCanvas = subCanvas;
        this.isRevealed = false;
        this.isFlipped = false;
        this.isFading = false;
        this.fadeAlpha = 0.0; // 0.0 (card face) -> 1.0 (revealed artwork)
        this.isFlashing = false;
    }
}


// --- Main Memory Match Game Controller ---
class MemoryPuzzleApp {
    constructor() {
        this.canvas = document.getElementById('puzzleCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.miniCanvas = document.getElementById('miniPreviewCanvas');
        this.miniCtx = this.miniCanvas.getContext('2d');

        this.sfx = new SoundEffects();

        this.emojiPool = [
            "🎨", "🚀", "💎", "🧩", "🦊", "👑", "🍕", "🍀",
            "👻", "🎸", "🪐", "🍿", "🥑", "🐙", "🌈", "🏎️",
            "🔮", "🦁"
        ];

        this.gridSize = 4;
        this.tiles = [];
        this.boardWidth = 600;
        this.boardHeight = 600;
        this.baseCanvas = null;
        this.artType = 'classic';
        this.uploadedImages = new Map();
        this.uploadCounter = 0;

        this.selectedTiles = [];
        this.lockInput = false;
        this.flashDurationMs = 500;
        this.mismatchTimeout = null;
        this.flashTimeout = null;

        // Challenge Modes & Timers
        this.challengeMode = 'auto'; // 'auto', 'casual', 'timed', 'moves'
        this.activeConstraint = 'timed';
        this.movesMade = 0;
        this.movesLeft = 28;
        this.timeLeft = 180;
        this.timeElapsed = 0;
        this.gameActive = false;
        this.isPaused = false;

        // Victory Confetti State
        this.victoryAchieved = false;
        this.victoryFrame = 0;
        this.confettiParticles = [];

        this.bindEvents();
        this.startGameLoop();
        this.startSecondTimer();
        this.startNewGame(false);
    }

    bindEvents() {
        document.querySelectorAll('.grid-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.gridSize = parseInt(btn.dataset.grid, 10);
                document.querySelectorAll('.grid-btn').forEach(b => {
                    b.className = 'grid-btn btn-game py-2 rounded-lg text-xs font-bold border border-slate-700 bg-slate-800/80 text-slate-300 hover:bg-slate-700';
                });
                btn.className = 'grid-btn btn-game py-2 rounded-lg text-xs font-bold border border-indigo-500 bg-indigo-600/30 text-white shadow-sm';
                this.startNewGame(false);
            });
        });

        // Hint Flash Duration Slider
        const slider = document.getElementById('flashDurationSlider');
        const sliderLabel = document.getElementById('flashDurationLabel');
        if (slider) {
            slider.addEventListener('input', (e) => {
                this.flashDurationMs = parseInt(e.target.value, 10);
                if (sliderLabel) {
                    sliderLabel.textContent = `${(this.flashDurationMs / 1000).toFixed(1)}s`;
                }
            });
        }

        document.getElementById('modeSelect')?.addEventListener('change', (e) => {
            this.challengeMode = e.target.value;
            this.startNewGame(false);
        });

        document.getElementById('artSelect')?.addEventListener('change', (e) => {
            this.artType = e.target.value;
            this.startNewGame(false);
        });

        const uploadInput = document.getElementById('imageUploadInput');
        if (uploadInput) {
            uploadInput.addEventListener('change', (e) => {
                if (e.target.files && e.target.files.length > 0) {
                    Array.from(e.target.files).forEach(file => this.handleUploadedFile(file));
                    uploadInput.value = '';
                }
            });
        }

        document.getElementById('randomPlantBtn')?.addEventListener('click', () => this.loadRandomPlant());
        document.getElementById('fullscreenBtn')?.addEventListener('click', () => this.toggleFullScreen());

        document.addEventListener('fullscreenchange', () => this.syncFullscreenUI());
        window.addEventListener('resize', () => this.updateFullscreenCanvasSize());

        const stage = document.getElementById('boardStage');
        if (stage) {
            window.addEventListener('dragover', (e) => {
                e.preventDefault();
                stage.classList.add('drag-over-file');
            });
            window.addEventListener('dragleave', () => {
                stage.classList.remove('drag-over-file');
            });
            window.addEventListener('drop', (e) => {
                e.preventDefault();
                stage.classList.remove('drag-over-file');
                if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    Array.from(e.dataTransfer.files).forEach(file => this.handleUploadedFile(file));
                }
            });
        }

        document.getElementById('restartBtn')?.addEventListener('click', () => this.startNewGame(true));
        document.getElementById('hintBtn')?.addEventListener('click', () => this.onHint());

        document.getElementById('soundToggleBtn')?.addEventListener('click', () => {
            this.sfx.enabled = !this.sfx.enabled;
            document.getElementById('soundOnIcon')?.classList.toggle('hidden', !this.sfx.enabled);
            document.getElementById('soundOffIcon')?.classList.toggle('hidden', this.sfx.enabled);
        });

        const rulesModal = document.getElementById('rulesModal');
        document.getElementById('helpModalBtn')?.addEventListener('click', () => rulesModal?.classList.remove('hidden'));
        document.getElementById('closeRulesBtn')?.addEventListener('click', () => rulesModal?.classList.add('hidden'));
        document.getElementById('gotItRulesBtn')?.addEventListener('click', () => rulesModal?.classList.add('hidden'));

        document.getElementById('modalRetryBtn')?.addEventListener('click', () => {
            document.getElementById('gameOverModal')?.classList.add('hidden');
            this.startNewGame(true);
        });
        document.getElementById('modalContinueCasualBtn')?.addEventListener('click', () => {
            document.getElementById('gameOverModal')?.classList.add('hidden');
            this.challengeMode = 'casual';
            const ms = document.getElementById('modeSelect');
            if (ms) ms.value = 'casual';
            this.activeConstraint = 'casual';
            this.gameActive = true;
            this.updateStatusReadout();
        });

        window.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
            if (e.code === 'Space') {
                e.preventDefault();
                if (!e.repeat) this.togglePause();
                return;
            }
            if (e.key.toLowerCase() === 'h') this.onHint();
        });

        this.canvas.addEventListener('pointerdown', (e) => this.onPointerDown(e));
    }

    toggleFullScreen() {
        const section = document.getElementById('puzzleSection') || this.canvas.closest('section') || document.getElementById('boardStage');
        if (!section) return;

        if (!document.fullscreenElement) {
            section.requestFullscreen().catch(() => {});
        } else {
            document.exitFullscreen().catch(() => {});
        }
    }

    syncFullscreenUI() {
        const isFull = !!document.fullscreenElement;
        document.getElementById('fullscreenEnterIcon')?.classList.toggle('hidden', isFull);
        document.getElementById('fullscreenExitIcon')?.classList.toggle('hidden', !isFull);
        this.updateFullscreenCanvasSize();
    }

    updateFullscreenCanvasSize() {
        if (!document.fullscreenElement) {
            this.canvas.style.width = '';
            this.canvas.style.height = '';
            return;
        }
        const toolbar = document.getElementById('topToolbar');
        const toolbarH = toolbar ? toolbar.offsetHeight : 56;
        const availW = window.innerWidth - 48;
        const availH = window.innerHeight - toolbarH - 48;
        const size = Math.floor(Math.min(availW, availH));

        this.canvas.style.width = `${size}px`;
        this.canvas.style.height = `${size}px`;
    }

    handleUploadedFile(file) {
        if (!file.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const img = new Image();
            img.onload = () => {
                this.uploadCounter++;
                const customKey = `uploaded_${this.uploadCounter}`;
                const cleanName = file.name.replace(/\.[^/.]+$/, '').slice(0, 28) || `Uploaded #${this.uploadCounter}`;

                this.uploadedImages.set(customKey, img);

                const artSelect = document.getElementById('artSelect');
                if (artSelect) {
                    const newOption = document.createElement('option');
                    newOption.value = customKey;
                    newOption.textContent = `📷 ${cleanName}`;
                    artSelect.insertBefore(newOption, artSelect.firstChild);
                    artSelect.value = customKey;
                }

                this.artType = customKey;
                this.startNewGame(false);
            };
            img.src = ev.target.result;
        };
        reader.readAsDataURL(file);
    }

    loadRandomPlant() {
        loadSharedRandomPlant(this, 'artSelect');
    }

    pickRandomArtwork() {
        const artSelect = document.getElementById('artSelect');
        if (!artSelect) return;
        const options = Array.from(artSelect.options).filter(opt => !opt.disabled);
        if (options.length === 0) return;

        let candidates = options;
        if (options.length > 1) {
            const others = options.filter(opt => opt.value !== this.artType);
            if (others.length > 0) candidates = others;
        }
        const chosen = candidates[Math.floor(Math.random() * candidates.length)];
        this.artType = chosen.value;
        artSelect.value = chosen.value;
    }

    togglePause() {
        if (!this.gameActive || this.victoryAchieved) return;
        this.isPaused = !this.isPaused;
        this.updateStatusReadout();
    }

    getCanvasCoordinates(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    }

    // --- Game Initialization (Mirrors start_new_game in EmojiMatch.py) ---
    startNewGame(pickRandom = false) {
        if (pickRandom) {
            this.pickRandomArtwork();
        }

        if (this.mismatchTimeout) clearTimeout(this.mismatchTimeout);
        if (this.flashTimeout) clearTimeout(this.flashTimeout);

        document.getElementById('gameOverModal')?.classList.add('hidden');
        this.lockInput = false;
        this.victoryAchieved = false;
        this.victoryFrame = 0;
        this.isPaused = false;
        this.selectedTiles = [];

        // Keep internal layout square (600x600) just like EmojiMatch.py
        const uploadedImg = this.uploadedImages.get(this.artType) || null;
        const rawArt = ArtworkGenerator.createArtwork(this.artType, uploadedImg);

        this.boardWidth = Math.floor(600 / this.gridSize) * this.gridSize;
        this.boardHeight = this.boardWidth;

        this.baseCanvas = document.createElement('canvas');
        this.baseCanvas.width = this.boardWidth;
        this.baseCanvas.height = this.boardHeight;
        const bCtx = this.baseCanvas.getContext('2d');
        bCtx.imageSmoothingEnabled = true;
        bCtx.imageSmoothingQuality = 'high';
        bCtx.drawImage(rawArt, 0, 0, this.boardWidth, this.boardHeight);

        this.canvas.width = this.boardWidth;
        this.canvas.height = this.boardHeight;
        const aspectBadge = document.getElementById('aspectBadge');
        if (aspectBadge) aspectBadge.textContent = `${this.boardWidth}×${this.boardHeight}`;

        this.updateFullscreenCanvasSize();

        // Draw Mini Reference Preview
        this.miniCanvas.width = 120;
        this.miniCanvas.height = 120;
        this.miniCtx.clearRect(0, 0, 120, 120);
        this.miniCtx.drawImage(this.baseCanvas, 0, 0, 120, 120);

        // Build Emoji Deck
        this.tiles = [];
        const totalSlots = this.gridSize * this.gridSize;
        const numPairs = Math.floor(totalSlots / 2);

        const poolCopy = [...this.emojiPool];
        for (let i = poolCopy.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [poolCopy[i], poolCopy[j]] = [poolCopy[j], poolCopy[i]];
        }

        const selectedEmojis = poolCopy.slice(0, Math.min(numPairs, poolCopy.length));
        while (selectedEmojis.length < numPairs) {
            selectedEmojis.push(this.emojiPool[Math.floor(Math.random() * this.emojiPool.length)]);
        }

        const gameDeck = [...selectedEmojis, ...selectedEmojis];
        if (totalSlots % 2 !== 0) {
            gameDeck.push("🃏");
        }

        // Fisher-Yates shuffle
        for (let i = gameDeck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [gameDeck[i], gameDeck[j]] = [gameDeck[j], gameDeck[i]];
        }

        const tileW = this.boardWidth / this.gridSize;
        const tileH = this.boardHeight / this.gridSize;

        let idx = 0;
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const sub = document.createElement('canvas');
                sub.width = tileW;
                sub.height = tileH;
                sub.getContext('2d').drawImage(
                    this.baseCanvas,
                    col * tileW, row * tileH, tileW, tileH,
                    0, 0, tileW, tileH
                );
                this.tiles.push(new MemoryTile(col, row, gameDeck[idx++], sub));
            }
        }

        // Configure Mode Constraints (Standard Rules = 3:00 Timer across all grids)
        this.movesMade = 0;
        this.timeElapsed = 0;

        this.activeConstraint = this.challengeMode;
        if (this.challengeMode === 'auto') {
            this.activeConstraint = 'timed';
        }

        const timeMap = { 3: 60, 4: 120, 5: 150, 6: 180 };
        const moveMap = { 3: 12, 4: 24, 5: 38, 6: 54 };
        this.timeLeft = (this.challengeMode === 'auto') ? 180 : (timeMap[this.gridSize] || 180);
        this.movesLeft = moveMap[this.gridSize] || 30;

        this.gameActive = true;
        this.updateTelemetry();
        this.updateStatusReadout();

        // Trigger initial 50% random flash just like EmojiMatch.py
        this.triggerRandomFlash();
    }

    // --- 50% Random Flash Hint (Exact port of trigger_random_flash in EmojiMatch.py) ---
    triggerRandomFlash() {
        const unmatchedTiles = this.tiles.filter(t => !t.isRevealed && !t.isFading && !t.isFlipped);
        if (unmatchedTiles.length === 0) return;

        this.lockInput = true;
        const halfCount = Math.ceil(unmatchedTiles.length / 2);

        const shuffled = [...unmatchedTiles];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }

        const flashSubset = shuffled.slice(0, halfCount);
        for (const tile of flashSubset) {
            tile.isFlashing = true;
        }

        this.sfx.playHint();
        this.updateStatusReadout();

        if (this.flashTimeout) clearTimeout(this.flashTimeout);
        this.flashTimeout = setTimeout(() => {
            for (const tile of this.tiles) {
                tile.isFlashing = false;
            }
            this.lockInput = false;
            this.updateStatusReadout();
        }, this.flashDurationMs);
    }

    onHint() {
        if (!this.gameActive || this.lockInput || this.victoryAchieved || this.isPaused) return;
        this.triggerRandomFlash();
    }

    onPointerDown(e) {
        if (this.victoryAchieved) {
            this.startNewGame(true);
            return;
        }
        if (this.isPaused) {
            this.togglePause();
            return;
        }
        if (!this.gameActive || this.lockInput) return;

        const pt = this.getCanvasCoordinates(e);
        const tileW = this.boardWidth / this.gridSize;
        const tileH = this.boardHeight / this.gridSize;

        const col = Math.floor(pt.x / tileW);
        const row = Math.floor(pt.y / tileH);
        if (col < 0 || col >= this.gridSize || row < 0 || row >= this.gridSize) return;

        const clickedTile = this.tiles.find(t => t.gridPos.col === col && t.gridPos.row === row);
        if (!clickedTile || clickedTile.isRevealed || clickedTile.isFading || clickedTile.isFlipped || clickedTile.isFlashing) {
            return;
        }

        // Special case for odd-sized grids (3x3, 5x5): Wild Joker card "🃏" auto-fades in!
        if (clickedTile.emoji === "🃏") {
            clickedTile.isFading = true;
            clickedTile.fadeAlpha = 0.0;
            this.sfx.playMatch();
            this.updateTelemetry();
            return;
        }

        clickedTile.isFlipped = true;
        this.selectedTiles.push(clickedTile);
        this.sfx.playFlip();

        if (this.selectedTiles.length === 2) {
            this.checkMatches();
        }
    }

    checkMatches() {
        const [tile1, tile2] = this.selectedTiles;
        this.movesMade++;
        if (this.activeConstraint === 'moves') {
            this.movesLeft--;
        }

        if (tile1.emoji === tile2.emoji) {
            this.lockInput = true;
            tile1.isFading = true;
            tile2.isFading = true;
            tile1.fadeAlpha = 0.0;
            tile2.fadeAlpha = 0.0;
            tile1.isFlipped = false;
            tile2.isFlipped = false;
            this.selectedTiles = [];
            this.sfx.playMatch();
            this.updateTelemetry();
        } else {
            this.lockInput = true;
            this.sfx.playMismatch();
            this.updateTelemetry();

            if (this.mismatchTimeout) clearTimeout(this.mismatchTimeout);
            this.mismatchTimeout = setTimeout(() => {
                for (const t of this.selectedTiles) {
                    t.isFlipped = false;
                }
                this.selectedTiles = [];
                this.lockInput = false;

                if (this.activeConstraint === 'moves' && this.movesLeft <= 0) {
                    this.endGame(false, 'You ran out of pair attempts!');
                }
            }, 900);
        }
    }

    checkVictoryCondition() {
        if (this.tiles.every(t => t.isRevealed) && !this.victoryAchieved) {
            this.endGame(true);
        } else if (this.activeConstraint === 'moves' && this.movesLeft <= 0 && !this.tiles.some(t => t.isFading)) {
            this.endGame(false, 'You ran out of pair attempts!');
        }
    }

    setupConfetti() {
        this.confettiParticles = [];
        const colors = [
            'rgb(255, 80, 80)', 'rgb(80, 255, 80)', 'rgb(80, 80, 255)',
            'rgb(255, 220, 50)', 'rgb(255, 80, 255)', 'rgb(80, 255, 255)',
            'rgb(255, 150, 50)', 'rgb(150, 80, 255)', 'rgb(50, 255, 150)'
        ];

        for (let i = 0; i < 400; i++) {
            this.confettiParticles.push({
                x: -20 + Math.random() * (this.boardWidth + 40),
                y: -100 + Math.random() * 90,
                vx: -5 + Math.random() * 10,
                vy: 2 + Math.random() * 6,
                rot: Math.random() * 360,
                vrot: -12 + Math.random() * 24,
                sizeW: 8 + Math.random() * 8,
                sizeH: 5 + Math.random() * 5,
                color: colors[Math.floor(Math.random() * colors.length)]
            });
        }
    }

    endGame(victory, reason = '') {
        this.gameActive = false;

        if (victory) {
            this.victoryAchieved = true;
            this.victoryFrame = 0;
            this.setupConfetti();
            this.sfx.playVictory();
            this.updateTelemetry();
            this.updateStatusReadout();
        } else {
            const revealedCount = this.tiles.filter(t => t.isRevealed).length;
            const pct = Math.round((revealedCount / this.tiles.length) * 100);
            const modalTitle = document.getElementById('modalTitle');
            const modalReason = document.getElementById('modalReason');
            if (modalTitle) modalTitle.textContent = 'Challenge Ended';
            if (modalReason) modalReason.textContent = `${reason} You revealed ${pct}% of the hidden artwork.`;
            document.getElementById('gameOverModal')?.classList.remove('hidden');
            this.updateStatusReadout();
        }
    }

    startSecondTimer() {
        setInterval(() => {
            if (!this.gameActive || this.victoryAchieved || this.isPaused) return;

            this.timeElapsed++;
            if (this.activeConstraint === 'timed') {
                this.timeLeft--;
                if (this.timeLeft <= 0) {
                    this.timeLeft = 0;
                    this.endGame(false, 'Time ran out!');
                }
            }
            this.updateTelemetry();
            this.updateStatusReadout();
        }, 1000);
    }

    formatTime(sec) {
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }

    updateTelemetry() {
        const totalTiles = this.gridSize * this.gridSize;
        const totalPairs = Math.floor(totalTiles / 2);
        const revealedTiles = this.tiles.filter(t => t.isRevealed || t.isFading).length;
        const pairsFound = Math.floor(this.tiles.filter(t => (t.isRevealed || t.isFading) && t.emoji !== "🃏").length / 2);
        const pairsLeft = Math.max(0, totalPairs - pairsFound);
        const pct = totalTiles > 0 ? Math.round((revealedTiles / totalTiles) * 100) : 0;

        document.getElementById('statPairsLeft').textContent = pairsLeft;
        document.getElementById('statPairsFound').textContent = pairsFound;
        document.getElementById('statPairsTotalSub').textContent = `of ${totalPairs} pairs`;
        document.getElementById('statRevealedTiles').textContent = `${revealedTiles}/${totalTiles}`;
        document.getElementById('completionPercent').textContent = `${pct}% Revealed`;
        document.getElementById('progressBar').style.width = `${pct}%`;

        if (this.activeConstraint === 'moves') {
            document.getElementById('statMovesLabel').textContent = 'Attempts Left';
            document.getElementById('statMoves').textContent = this.movesLeft;
            document.getElementById('statMovesSub').textContent = `${this.movesMade} used`;
        } else {
            document.getElementById('statMovesLabel').textContent = 'Pair Attempts';
            document.getElementById('statMoves').textContent = this.movesMade;
            document.getElementById('statMovesSub').textContent = 'Flips made';
        }

        if (this.activeConstraint === 'timed') {
            document.getElementById('statTimerLabel').textContent = 'Time Left';
            document.getElementById('statTimer').textContent = this.formatTime(this.timeLeft);
            document.getElementById('statTimerSub').textContent = 'Countdown';
        } else {
            document.getElementById('statTimerLabel').textContent = 'Elapsed Time';
            document.getElementById('statTimer').textContent = this.formatTime(this.timeElapsed);
            document.getElementById('statTimerSub').textContent = 'Active clock';
        }
    }

    updateStatusReadout() {
        const statusText = document.getElementById('statusText');
        const statusDot = document.getElementById('statusDot');
        if (!statusText || !statusDot) return;

        if (this.victoryAchieved) {
            statusText.textContent = 'VICTORY! Click Board for Random Puzzle';
            statusDot.className = 'w-2 h-2 rounded-full bg-amber-400 animate-ping';
            return;
        }
        if (this.isPaused) {
            statusText.textContent = 'PAUSED & HIDDEN (Press Space)';
            statusDot.className = 'w-2 h-2 rounded-full bg-amber-400';
            return;
        }
        if (this.tiles.some(t => t.isFlashing)) {
            statusText.textContent = 'Flashing 50% Hint...';
            statusDot.className = 'w-2 h-2 rounded-full bg-amber-400 animate-ping';
            return;
        }
        if (this.activeConstraint === 'timed') {
            statusText.textContent = `Timed Mode • ${this.formatTime(this.timeLeft)}`;
            statusDot.className = this.timeLeft <= 30
                ? 'w-2 h-2 rounded-full bg-rose-500 animate-ping'
                : 'w-2 h-2 rounded-full bg-amber-400 animate-pulse';
        } else if (this.activeConstraint === 'moves') {
            statusText.textContent = `Move Challenge • ${this.movesLeft} Left`;
            statusDot.className = 'w-2 h-2 rounded-full bg-sky-400 animate-pulse';
        } else {
            statusText.textContent = 'Casual Mode';
            statusDot.className = 'w-2 h-2 rounded-full bg-emerald-400';
        }
    }

    startGameLoop() {
        const step = () => {
            this.updateAnimations();
            this.renderBoard();
            requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    }

    updateAnimations() {
        if (this.isPaused) return;

        let finishedFade = false;
        for (const tile of this.tiles) {
            if (tile.isFading) {
                tile.fadeAlpha += 0.04;
                if (tile.fadeAlpha >= 1.0) {
                    tile.fadeAlpha = 1.0;
                    tile.isFading = false;
                    tile.isRevealed = true;
                    finishedFade = true;
                }
            }
        }

        if (finishedFade) {
            if (!this.tiles.some(t => t.isFading) && !this.tiles.some(t => t.isFlashing) && this.selectedTiles.length < 2) {
                this.lockInput = false;
            }
            this.updateTelemetry();
            this.checkVictoryCondition();
        }

        if (this.victoryAchieved) {
            this.victoryFrame++;
            for (const p of this.confettiParticles) {
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.22;
                p.rot += p.vrot;
            }
            if (this.victoryFrame > 160) {
                for (const p of this.confettiParticles) {
                    if (p.y > this.boardHeight + 20) {
                        p.y = -50 + Math.random() * 40;
                        p.x = -20 + Math.random() * (this.boardWidth + 40);
                        p.vy = 2 + Math.random() * 4;
                    }
                }
            }
        }
    }

    // --- Board Rendering (Exact port of on_paint in EmojiMatch.py) ---
    renderBoard() {
        this.ctx.clearRect(0, 0, this.boardWidth, this.boardHeight);

        // Pause Curtain
        if (this.isPaused) {
            const grad = this.ctx.createLinearGradient(0, 0, this.boardWidth, this.boardHeight);
            grad.addColorStop(0, '#0f172a');
            grad.addColorStop(0.5, '#1e1b4b');
            grad.addColorStop(1, '#090d16');
            this.ctx.fillStyle = grad;
            this.ctx.fillRect(0, 0, this.boardWidth, this.boardHeight);

            this.ctx.strokeStyle = 'rgba(99, 102, 241, 0.12)';
            this.ctx.lineWidth = 2;
            for (let i = -this.boardHeight; i < this.boardWidth + this.boardHeight; i += 36) {
                this.ctx.beginPath();
                this.ctx.moveTo(i, 0);
                this.ctx.lineTo(i - this.boardHeight, this.boardHeight);
                this.ctx.stroke();
            }

            const cx = this.boardWidth / 2;
            const cy = this.boardHeight / 2;
            const boxW = Math.min(380, this.boardWidth - 40);
            const boxH = 150;

            this.ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
            this.ctx.strokeStyle = 'rgba(99, 102, 241, 0.45)';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.roundRect(cx - boxW / 2, cy - boxH / 2, boxW, boxH, 16);
            this.ctx.fill();
            this.ctx.stroke();

            this.ctx.fillStyle = '#818cf8';
            this.ctx.fillRect(cx - 16, cy - 48, 10, 32);
            this.ctx.fillRect(cx + 6, cy - 48, 10, 32);

            this.ctx.fillStyle = '#f8fafc';
            this.ctx.font = '800 18px Inter, sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText('PUZZLE PAUSED & HIDDEN', cx, cy + 12);

            this.ctx.fillStyle = '#94a3b8';
            this.ctx.font = '500 13px Inter, sans-serif';
            this.ctx.fillText('Press Space or Click Board to Resume', cx, cy + 40);
            return;
        }

        const tileW = this.boardWidth / this.gridSize;
        const tileH = this.boardHeight / this.gridSize;
        const fontSize = Math.max(18, Math.floor(tileW * 0.42));

        for (const tile of this.tiles) {
            const { col, row } = tile.gridPos;
            const x = col * tileW;
            const y = row * tileH;

            if (tile.isRevealed) {
                this.ctx.drawImage(tile.subCanvas, x, y);
            } else if (tile.isFading) {
                // Draw revealed image slice underneath and fade out the card overlay
                this.ctx.drawImage(tile.subCanvas, x, y);
                const invAlpha = Math.max(0, 1.0 - tile.fadeAlpha);

                this.ctx.save();
                this.ctx.fillStyle = `rgba(240, 240, 245, ${invAlpha})`;
                this.ctx.strokeStyle = `rgba(100, 100, 250, ${invAlpha})`;
                this.ctx.lineWidth = 3;
                this.ctx.fillRect(x, y, tileW, tileH);
                this.ctx.strokeRect(x + 1.5, y + 1.5, tileW - 3, tileH - 3);

                this.ctx.globalAlpha = invAlpha;
                this.ctx.font = `${fontSize}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif`;
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillStyle = '#000000';
                this.ctx.fillText(tile.emoji, x + tileW / 2, y + tileH / 2);
                this.ctx.restore();
            } else if (tile.isFlipped || tile.isFlashing) {
                // Face-up card
                this.ctx.fillStyle = 'rgb(240, 240, 245)';
                this.ctx.fillRect(x, y, tileW, tileH);

                this.ctx.strokeStyle = 'rgb(100, 100, 250)';
                this.ctx.lineWidth = tile.isFlipped ? 3 : 1.5;
                this.ctx.strokeRect(x + 1, y + 1, tileW - 2, tileH - 2);

                this.ctx.font = `${fontSize}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif`;
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillStyle = '#000000';
                this.ctx.fillText(tile.emoji, x + tileW / 2, y + tileH / 2);
            } else {
                // Face-down card back with dotted inner border (from EmojiMatch.py)
                this.ctx.fillStyle = 'rgb(45, 45, 60)';
                this.ctx.fillRect(x, y, tileW, tileH);

                this.ctx.strokeStyle = 'rgb(70, 70, 90)';
                this.ctx.lineWidth = 2;
                this.ctx.strokeRect(x + 1, y + 1, tileW - 2, tileH - 2);

                const pad = Math.max(4, Math.floor(tileW * 0.1));
                this.ctx.save();
                this.ctx.strokeStyle = 'rgb(90, 90, 115)';
                this.ctx.lineWidth = 1;
                this.ctx.setLineDash([3, 3]);
                this.ctx.strokeRect(x + pad, y + pad, tileW - pad * 2, tileH - pad * 2);
                this.ctx.restore();
            }
        }

        // Victory Confetti Particles
        if (this.victoryAchieved) {
            for (const p of this.confettiParticles) {
                if (p.y > this.boardHeight + 20) continue;
                this.ctx.save();
                this.ctx.translate(p.x, p.y);
                this.ctx.rotate((p.rot * Math.PI) / 180);
                this.ctx.fillStyle = p.color;
                this.ctx.fillRect(-p.sizeW / 2, -p.sizeH / 2, p.sizeW, p.sizeH);
                this.ctx.restore();
            }
        }
    }
}

window.onload = function () {
    window.memoryPuzzleApp = new MemoryPuzzleApp();
};
