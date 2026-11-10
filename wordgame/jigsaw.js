/**
 * JIGSAW SOLITAIRE — Main Game Controller (jigsaw.js)
 * Works alongside jigsaw_artwork.js for procedural and custom image rendering.
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

    playPickup() {
        if (!this.enabled) return;
        this.initContext();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(240, now);
        osc.frequency.exponentialRampToValueAtTime(340, now + 0.06);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.065);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.07);
    }

    playSwap(mergedNewEdges = 0) {
        if (!this.enabled) return;
        this.initContext();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;

        if (mergedNewEdges > 0) {
            const freqs = [523.25, 659.25, 783.99];
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
        } else {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(190, now);
            osc.frequency.exponentialRampToValueAtTime(110, now + 0.07);
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.075);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.08);
        }
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
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.35);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.4);
    }

    playWarning() {
        if (!this.enabled) return;
        this.initContext();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        [310, 240].forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, now + i * 0.12);
            gain.gain.setValueAtTime(0.09, now + i * 0.12);
            gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.18);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now + i * 0.12);
            osc.stop(now + i * 0.12 + 0.2);
        });
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

// --- JigsawTile Model ---
class JigsawTile {
    constructor(sourcePos, currentPos, subCanvas) {
        this.sourcePos = sourcePos;   // { col, row }
        this.currentPos = currentPos; // { col, row }
        this.subCanvas = subCanvas;
    }
}

// --- Main Jigsaw Solitaire Game Controller ---
class JigsawSolitaireApp {
    constructor() {
        this.canvas = document.getElementById('puzzleCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.miniCanvas = document.getElementById('miniPreviewCanvas');
        this.miniCtx = this.miniCanvas.getContext('2d');

        this.sfx = new SoundEffects();

        this.gridSize = 4;
        this.tiles = [];
        this.boardWidth = 600;
        this.boardHeight = 600;
        this.baseCanvas = null;
        this.artType = 'classic';
        this.uploadedImages = new Map(); // key -> HTMLImageElement
        this.uploadCounter = 0;

        this.selectedCluster = [];
        this.dragAnchorTile = null;
        this.dragStartPositions = new Map();
        this.dragCurrentPixel = null;
        this.dragOffset = null;

        this.undoStack = [];

        this.challengeMode = 'auto';
        this.movesMade = 0;
        this.movesLeft = 40;
        this.timeLeft = 180;
        this.timeElapsed = 0;
        this.gameActive = false;
        this.isPaused = false;

        this.victoryAchieved = false;
        this.victoryFrame = 0;
        this.confettiParticles = [];

        this.hintActive = false;
        this.hintFrame = 0;
        this.hintColor = 'rgb(245, 158, 11)';
        this.hintZeroCorrect = false;

        this.snapFlashAlpha = 0;
        this.snapFlashTiles = [];

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
            if (e.key.toLowerCase() === 'z') this.undoMove();
        });

        this.canvas.addEventListener('pointerdown', (e) => this.onPointerDown(e));
        window.addEventListener('pointermove', (e) => this.onPointerMove(e));
        window.addEventListener('pointerup', (e) => this.onPointerUp(e));
        window.addEventListener('pointercancel', (e) => this.onPointerUp(e));
    }

    toggleFullScreen() {
        // Put the entire puzzle section (top toolbar + board stage) into fullscreen
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
        const aspect = this.boardWidth / this.boardHeight;

        let targetW = availW;
        let targetH = targetW / aspect;
        if (targetH > availH) {
            targetH = availH;
            targetW = targetH * aspect;
        }

        this.canvas.style.width = `${Math.floor(targetW)}px`;
        this.canvas.style.height = `${Math.floor(targetH)}px`;
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

        if (this.isPaused) {
            this.selectedCluster = [];
            this.dragAnchorTile = null;
            this.dragCurrentPixel = null;
        }

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

    startNewGame(pickRandom = false) {
        if (pickRandom) {
            this.pickRandomArtwork();
        }

        document.getElementById('gameOverModal')?.classList.add('hidden');
        document.getElementById('hintWarningBanner')?.classList.add('hidden');
        this.victoryAchieved = false;
        this.hintActive = false;
        this.hintZeroCorrect = false;
        this.victoryFrame = 0;
        this.isPaused = false;
        this.undoStack = [];

        const uploadedImg = this.uploadedImages.get(this.artType) || null;
        this.baseCanvas = ArtworkGenerator.createArtwork(this.artType, uploadedImg);
        this.boardWidth = Math.floor(this.baseCanvas.width / this.gridSize) * this.gridSize;
        this.boardHeight = Math.floor(this.baseCanvas.height / this.gridSize) * this.gridSize;

        this.canvas.width = this.boardWidth;
        this.canvas.height = this.boardHeight;
        const aspectBadge = document.getElementById('aspectBadge');
        if (aspectBadge) aspectBadge.textContent = `${this.boardWidth}×${this.boardHeight}`;

        this.updateFullscreenCanvasSize();

        this.miniCanvas.width = 120;
        this.miniCanvas.height = 120;
        this.miniCtx.clearRect(0, 0, 120, 120);
        const scale = Math.min(120 / this.boardWidth, 120 / this.boardHeight);
        const mw = this.boardWidth * scale;
        const mh = this.boardHeight * scale;
        this.miniCtx.drawImage(this.baseCanvas, (120 - mw) / 2, (120 - mh) / 2, mw, mh);

        this.tiles = [];
        this.selectedCluster = [];
        this.dragAnchorTile = null;

        const tileW = this.boardWidth / this.gridSize;
        const tileH = this.boardHeight / this.gridSize;

        const allPositions = [];
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                allPositions.push({ col, row });
            }
        }

        const shuffledPositions = allPositions.map(p => ({ ...p }));
        let attempts = 0;
        while (attempts < 20) {
            for (let i = shuffledPositions.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffledPositions[i], shuffledPositions[j]] = [shuffledPositions[j], shuffledPositions[i]];
            }
            const isDifferent = allPositions.some((p, i) => p.col !== shuffledPositions[i].col || p.row !== shuffledPositions[i].row);
            if (isDifferent) break;
            attempts++;
        }

        let idx = 0;
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const sub = document.createElement('canvas');
                sub.width = tileW;
                sub.height = tileH;
                const sCtx = sub.getContext('2d');
                sCtx.drawImage(
                    this.baseCanvas,
                    col * tileW, row * tileH, tileW, tileH,
                    0, 0, tileW, tileH
                );

                const randPos = shuffledPositions[idx++];
                this.tiles.push(new JigsawTile({ col, row }, { ...randPos }, sub));
            }
        }

        this.movesMade = 0;
        this.timeElapsed = 0;

// Determine active constraint rule (Standard Rules = 3:00 timer on all grid sizes)
this.activeConstraint = this.challengeMode;
if (this.challengeMode === 'auto') {
    this.activeConstraint = 'timed';
}

// Use 180s (3:00) for Standard Rules on all grids; scale Timed Blitz and Move Limits by grid size
const timeMap = { 3: 60, 4: 120, 5: 150, 6: 180 };
const moveMap = { 3: 15, 4: 28, 5: 40, 6: 55 };
this.timeLeft = (this.challengeMode === 'auto') ? 180 : (timeMap[this.gridSize] || 180);
this.movesLeft = moveMap[this.gridSize] || 40;

        this.gameActive = true;
        this.updateTelemetry();
        this.updateStatusReadout();
    }

    getTileAtBoardPos(col, row) {
        for (const tile of this.tiles) {
            if (tile.currentPos.col === col && tile.currentPos.row === row) {
                return tile;
            }
        }
        return null;
    }

    getAdjacencyMatches(tile) {
        const { col: cCol, row: cRow } = tile.currentPos;
        const { col: sCol, row: sRow } = tile.sourcePos;
        const matches = { up: false, down: false, left: false, right: false };

        const upNb = this.getTileAtBoardPos(cCol, cRow - 1);
        if (upNb && upNb.sourcePos.col === sCol && upNb.sourcePos.row === sRow - 1) matches.up = true;

        const downNb = this.getTileAtBoardPos(cCol, cRow + 1);
        if (downNb && downNb.sourcePos.col === sCol && downNb.sourcePos.row === sRow + 1) matches.down = true;

        const leftNb = this.getTileAtBoardPos(cCol - 1, cRow);
        if (leftNb && leftNb.sourcePos.col === sCol - 1 && leftNb.sourcePos.row === sRow) matches.left = true;

        const rightNb = this.getTileAtBoardPos(cCol + 1, cRow);
        if (rightNb && rightNb.sourcePos.col === sCol + 1 && rightNb.sourcePos.row === sRow) matches.right = true;

        return matches;
    }

    findCluster(startTile) {
        const cluster = new Set();
        const queue = [startTile];

        while (queue.length > 0) {
            const current = queue.shift();
            if (!cluster.has(current)) {
                cluster.add(current);
                const { col: cCol, row: cRow } = current.currentPos;
                const { col: sCol, row: sRow } = current.sourcePos;

                const neighbors = [
                    [cCol, cRow - 1, sCol, sRow - 1],
                    [cCol, cRow + 1, sCol, sRow + 1],
                    [cCol - 1, cRow, sCol - 1, sRow],
                    [cCol + 1, cRow, sCol + 1, sRow]
                ];

                for (const [nc, nr, nsC, nsR] of neighbors) {
                    const nb = this.getTileAtBoardPos(nc, nr);
                    if (nb && nb.sourcePos.col === nsC && nb.sourcePos.row === nsR && !cluster.has(nb)) {
                        queue.push(nb);
                    }
                }
            }
        }
        return Array.from(cluster);
    }

    countTotalClustersAndMatchedEdges() {
        const visited = new Set();
        let clustersCount = 0;
        let largestCluster = 0;
        for (const tile of this.tiles) {
            if (!visited.has(tile)) {
                clustersCount++;
                const cl = this.findCluster(tile);
                if (cl.length > largestCluster) {
                    largestCluster = cl.length;
                }
                cl.forEach(t => visited.add(t));
            }
        }

        let matchedInternalEdges = 0;
        let homeTilesCount = 0;
        for (const tile of this.tiles) {
            const m = this.getAdjacencyMatches(tile);
            if (m.right) matchedInternalEdges++;
            if (m.down) matchedInternalEdges++;
            if (tile.currentPos.col === tile.sourcePos.col && tile.currentPos.row === tile.sourcePos.row) {
                homeTilesCount++;
            }
        }
        const totalInternalEdges = 2 * this.gridSize * (this.gridSize - 1);
        return {
            clustersCount,
            largestCluster,
            homeTilesCount,
            matchedInternalEdges,
            totalInternalEdges
        };
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
        if (!this.gameActive || this.hintActive) return;

        const pt = this.getCanvasCoordinates(e);
        const tileW = this.boardWidth / this.gridSize;
        const tileH = this.boardHeight / this.gridSize;
        const col = Math.floor(pt.x / tileW);
        const row = Math.floor(pt.y / tileH);

        const tile = this.getTileAtBoardPos(col, row);
        if (tile) {
            this.canvas.setPointerCapture(e.pointerId);
            this.dragAnchorTile = tile;
            this.selectedCluster = this.findCluster(tile);
            this.dragStartPositions.clear();
            for (const t of this.selectedCluster) {
                this.dragStartPositions.set(t, { ...t.currentPos });
            }

            const tilePixelX = col * tileW;
            const tilePixelY = row * tileH;
            this.dragOffset = { x: pt.x - tilePixelX, y: pt.y - tilePixelY };
            this.dragCurrentPixel = pt;
            this.sfx.playPickup();
        }
    }

    onPointerMove(e) {
        if (this.selectedCluster.length > 0 && this.dragAnchorTile) {
            this.dragCurrentPixel = this.getCanvasCoordinates(e);
        }
    }

    onPointerUp(e) {
        if (this.victoryAchieved) return;
        if (this.selectedCluster.length === 0 || !this.dragAnchorTile) return;

        const pt = this.dragCurrentPixel || this.getCanvasCoordinates(e);
        const tileW = this.boardWidth / this.gridSize;
        const tileH = this.boardHeight / this.gridSize;

        const anchorVisualX = pt.x - this.dragOffset.x + tileW / 2;
        const anchorVisualY = pt.y - this.dragOffset.y + tileH / 2;
        const targetCol = Math.floor(anchorVisualX / tileW);
        const targetRow = Math.floor(anchorVisualY / tileH);

        const anchorStart = this.dragStartPositions.get(this.dragAnchorTile);
        const dCol = targetCol - anchorStart.col;
        const dRow = targetRow - anchorStart.row;

        if (dCol !== 0 || dRow !== 0) {
            const targetPositions = new Map();
            let validMove = true;

            for (const tile of this.selectedCluster) {
                const sPos = this.dragStartPositions.get(tile);
                const tCol = sPos.col + dCol;
                const tRow = sPos.row + dRow;

                if (tCol >= 0 && tCol < this.gridSize && tRow >= 0 && tRow < this.gridSize) {
                    targetPositions.set(tile, { col: tCol, row: tRow });
                } else {
                    validMove = false;
                    break;
                }
            }

            if (validMove) {
                const snapshot = this.tiles.map(t => ({
                    tile: t,
                    pos: { ...t.currentPos }
                }));
                this.undoStack.push(snapshot);

                const beforeStats = this.countTotalClustersAndMatchedEdges();

                const posKey = (p) => `${p.col},${p.row}`;
                const oldPositionsSet = new Set(Array.from(this.dragStartPositions.values()).map(posKey));
                const newPositionsSet = new Set(Array.from(targetPositions.values()).map(posKey));

                const trulyVacated = [];
                for (const p of this.dragStartPositions.values()) {
                    if (!newPositionsSet.has(posKey(p))) {
                        trulyVacated.push({ ...p });
                    }
                }

                const trulyInvadedKeys = new Set();
                for (const p of targetPositions.values()) {
                    if (!oldPositionsSet.has(posKey(p))) {
                        trulyInvadedKeys.add(posKey(p));
                    }
                }

                const selectedSet = new Set(this.selectedCluster);
                const displacedTiles = [];
                for (const tile of this.tiles) {
                    if (!selectedSet.has(tile) && trulyInvadedKeys.has(posKey(tile.currentPos))) {
                        displacedTiles.push(tile);
                    }
                }

                const displacedByCluster = new Map();
                for (const dt of displacedTiles) {
                    const cl = this.findCluster(dt);
                    const cId = cl
                        .map(t => `${t.sourcePos.col}:${t.sourcePos.row}`)
                        .sort()
                        .join('|');
                    if (!displacedByCluster.has(cId)) {
                        displacedByCluster.set(cId, []);
                    }
                    displacedByCluster.get(cId).push(dt);
                }

                trulyVacated.sort((a, b) => (a.row - b.row) || (a.col - b.col));

                for (const [tile, pos] of targetPositions.entries()) {
                    tile.currentPos = { ...pos };
                }

                for (const parts of displacedByCluster.values()) {
                    parts.sort((a, b) => (a.currentPos.row - b.currentPos.row) || (a.currentPos.col - b.currentPos.col));
                    for (const part of parts) {
                        if (trulyVacated.length > 0) {
                            part.currentPos = trulyVacated.shift();
                        }
                    }
                }

                this.movesMade++;
                if (this.activeConstraint === 'moves') {
                    this.movesLeft--;
                }

                const afterStats = this.countTotalClustersAndMatchedEdges();
                const newEdges = Math.max(0, afterStats.matchedInternalEdges - beforeStats.matchedInternalEdges);
                this.sfx.playSwap(newEdges);

                if (newEdges > 0) {
                    this.snapFlashTiles = this.findCluster(this.dragAnchorTile);
                    this.snapFlashAlpha = 1.0;
                }

                this.updateTelemetry();
                this.checkGameState();
            }
        }

        this.selectedCluster = [];
        this.dragAnchorTile = null;
        this.dragCurrentPixel = null;
    }

    undoMove() {
        if (this.undoStack.length === 0 || !this.gameActive || this.victoryAchieved || this.isPaused) return;
        const snapshot = this.undoStack.pop();
        for (const item of snapshot) {
            item.tile.currentPos = { ...item.pos };
        }
        this.movesMade = Math.max(0, this.movesMade - 1);
        if (this.activeConstraint === 'moves') {
            this.movesLeft++;
        }
        this.sfx.playPickup();
        this.updateTelemetry();
    }

    checkGameState() {
        let solved = true;
        for (const tile of this.tiles) {
            const matches = this.getAdjacencyMatches(tile);
            if (tile.sourcePos.row > 0 && !matches.up) solved = false;
            if (tile.sourcePos.row < this.gridSize - 1 && !matches.down) solved = false;
            if (tile.sourcePos.col > 0 && !matches.left) solved = false;
            if (tile.sourcePos.col < this.gridSize - 1 && !matches.right) solved = false;
        }

        if (solved) {
            this.endGame(true);
        } else if (this.activeConstraint === 'moves' && this.movesLeft <= 0) {
            this.endGame(false, 'You ran out of available moves!');
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
            this.updateStatusReadout();
        } else {
            const stats = this.countTotalClustersAndMatchedEdges();
            const pct = Math.round((stats.matchedInternalEdges / stats.totalInternalEdges) * 100);
            const modalTitle = document.getElementById('modalTitle');
            const modalReason = document.getElementById('modalReason');
            if (modalTitle) modalTitle.textContent = 'Challenge Ended';
            if (modalReason) modalReason.textContent = `${reason} You connected ${pct}% of the puzzle edges.`;
            document.getElementById('gameOverModal')?.classList.remove('hidden');
            this.updateStatusReadout();
        }
    }

    onHint() {
        if (this.victoryAchieved || this.hintActive || !this.gameActive || this.isPaused) return;

        let correctCount = 0;
        for (const tile of this.tiles) {
            if (tile.currentPos.col === tile.sourcePos.col && tile.currentPos.row === tile.sourcePos.row) {
                correctCount++;
            }
        }

        this.hintActive = true;
        this.hintFrame = 0;
        this.hintZeroCorrect = (correctCount === 0);

        const warningBanner = document.getElementById('hintWarningBanner');
        if (this.hintZeroCorrect && warningBanner) {
            warningBanner.classList.remove('hidden');
            this.sfx.playWarning();
        } else if (warningBanner) {
            warningBanner.classList.add('hidden');
            this.sfx.playHint();
        }

        const r = Math.floor(40 + Math.random() * 200);
        const g = Math.floor(40 + Math.random() * 200);
        const b = Math.floor(40 + Math.random() * 200);
        this.hintColor = `rgb(${r}, ${g}, ${b})`;
        this.updateStatusReadout();
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
        const {
            clustersCount,
            largestCluster,
            homeTilesCount,
            matchedInternalEdges,
            totalInternalEdges
        } = this.countTotalClustersAndMatchedEdges();
        const totalTiles = this.gridSize * this.gridSize;
        const pct = totalInternalEdges > 0 ? Math.round((matchedInternalEdges / totalInternalEdges) * 100) : 100;

        const elClusters = document.getElementById('statClusters');
        const elLargest = document.getElementById('statLargestCluster');
        const elLargestSub = document.getElementById('statLargestClusterSub');
        const elHome = document.getElementById('statHomeTiles');
        const elCompletion = document.getElementById('completionPercent');
        const elProgressBar = document.getElementById('progressBar');

        if (elClusters) elClusters.textContent = clustersCount;
        if (elLargest) elLargest.textContent = largestCluster;
        if (elLargestSub) elLargestSub.textContent = `of ${totalTiles} tiles`;
        if (elHome) elHome.textContent = `${homeTilesCount}/${totalTiles}`;
        if (elCompletion) elCompletion.textContent = `${pct}% Joined`;
        if (elProgressBar) elProgressBar.style.width = `${pct}%`;

        const elMovesLabel = document.getElementById('statMovesLabel');
        const elMoves = document.getElementById('statMoves');
        const elMovesSub = document.getElementById('statMovesSub');

        if (this.activeConstraint === 'moves') {
            if (elMovesLabel) elMovesLabel.textContent = 'Moves Left';
            if (elMoves) elMoves.textContent = this.movesLeft;
            if (elMovesSub) elMovesSub.textContent = `${this.movesMade} used`;
        } else {
            if (elMovesLabel) elMovesLabel.textContent = 'Total Moves';
            if (elMoves) elMoves.textContent = this.movesMade;
            if (elMovesSub) elMovesSub.textContent = 'Swaps made';
        }

        const elTimerLabel = document.getElementById('statTimerLabel');
        const elTimer = document.getElementById('statTimer');
        const elTimerSub = document.getElementById('statTimerSub');

        if (this.activeConstraint === 'timed') {
            if (elTimerLabel) elTimerLabel.textContent = 'Time Left';
            if (elTimer) elTimer.textContent = this.formatTime(this.timeLeft);
            if (elTimerSub) elTimerSub.textContent = 'Countdown';
        } else {
            if (elTimerLabel) elTimerLabel.textContent = 'Elapsed Time';
            if (elTimer) elTimer.textContent = this.formatTime(this.timeElapsed);
            if (elTimerSub) elTimerSub.textContent = 'Active clock';
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
        if (this.hintActive) {
            if (this.hintZeroCorrect) {
                statusText.textContent = '⚠️ Warning: None of the tiles are in the correct location!';
                statusDot.className = 'w-2 h-2 rounded-full bg-rose-500 animate-ping';
            } else {
                statusText.textContent = 'Showing Misplaced Tiles Hint...';
                statusDot.className = 'w-2 h-2 rounded-full bg-amber-400 animate-pulse';
            }
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
        } else if (this.hintActive) {
            this.hintFrame += 1.25;
            if (this.hintFrame > 150) {
                this.hintActive = false;
                this.hintZeroCorrect = false;
                document.getElementById('hintWarningBanner')?.classList.add('hidden');
                this.updateStatusReadout();
            }
        }

        if (this.snapFlashAlpha > 0) {
            this.snapFlashAlpha = Math.max(0, this.snapFlashAlpha - 0.04);
        }
    }

    drawTileBorders(tile, x, y, tileW, tileH) {
        if (this.victoryAchieved || this.hintActive) return;

        const matches = this.getAdjacencyMatches(tile);
        this.ctx.strokeStyle = 'rgb(180, 180, 180)';
        this.ctx.lineWidth = 2;

        this.ctx.beginPath();
        if (!matches.up) {
            this.ctx.moveTo(x, y);
            this.ctx.lineTo(x + tileW, y);
        }
        if (!matches.down) {
            this.ctx.moveTo(x, y + tileH);
            this.ctx.lineTo(x + tileW, y + tileH);
        }
        if (!matches.left) {
            this.ctx.moveTo(x, y);
            this.ctx.lineTo(x, y + tileH);
        }
        if (!matches.right) {
            this.ctx.moveTo(x + tileW, y);
            this.ctx.lineTo(x + tileW, y + tileH);
        }
        this.ctx.stroke();
    }

    drawHintMaskedTile(tile, x, y, tileW, tileH, progress) {
        this.ctx.drawImage(tile.subCanvas, x, y);

        const c = 2 * (1 - progress);
        const W = this.boardWidth;
        const H = this.boardHeight;

        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.rect(x, y, tileW, tileH);
        this.ctx.clip();

        this.ctx.beginPath();
        const xInt = c * W;
        const yInt = c * H;
        this.ctx.moveTo(xInt, 0);
        this.ctx.lineTo(0, yInt);
        this.ctx.lineTo(0, H * 3);
        this.ctx.lineTo(W * 3, H * 3);
        this.ctx.lineTo(W * 3, 0);
        this.ctx.closePath();

        this.ctx.fillStyle = this.hintColor;
        this.ctx.fill();
        this.ctx.restore();
    }

    renderBoard() {
        this.ctx.clearRect(0, 0, this.boardWidth, this.boardHeight);

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

            this.ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
            this.ctx.strokeStyle = 'rgba(99, 102, 241, 0.45)';
            this.ctx.lineWidth = 2;
            const boxW = Math.min(380, this.boardWidth - 40);
            const boxH = 150;
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
        const progress = this.hintActive ? (1.0 - Math.abs(75 - this.hintFrame) / 75.0) : 0.0;
        const selectedSet = new Set(this.selectedCluster);

        // 1. Stationary tiles & vacated slots
        for (const tile of this.tiles) {
            if (!this.victoryAchieved && !this.hintActive && selectedSet.has(tile)) {
                const sc = this.dragStartPositions.get(tile);
                this.ctx.fillStyle = 'rgb(15, 15, 15)';
                this.ctx.fillRect(sc.col * tileW, sc.row * tileH, tileW, tileH);

                this.ctx.save();
                this.ctx.strokeStyle = 'rgb(80, 80, 80)';
                this.ctx.lineWidth = 1;
                this.ctx.setLineDash([4, 4]);
                this.ctx.strokeRect(sc.col * tileW + 1, sc.row * tileH + 1, tileW - 2, tileH - 2);
                this.ctx.restore();
                continue;
            }

            const { col: cCol, row: cRow } = tile.currentPos;
            const x = cCol * tileW;
            const y = cRow * tileH;

            const isMisplaced = (tile.currentPos.col !== tile.sourcePos.col || tile.currentPos.row !== tile.sourcePos.row);
            if (this.hintActive && !this.hintZeroCorrect && isMisplaced) {
                this.drawHintMaskedTile(tile, x, y, tileW, tileH, progress);
            } else {
                this.ctx.drawImage(tile.subCanvas, x, y);
            }

            this.drawTileBorders(tile, x, y, tileW, tileH);
        }

        // 2. Newly Merged Cluster Golden Pulse
        if (this.snapFlashAlpha > 0 && this.snapFlashTiles.length > 0) {
            this.ctx.save();
            this.ctx.strokeStyle = `rgba(250, 204, 21, ${this.snapFlashAlpha})`;
            this.ctx.fillStyle = `rgba(250, 204, 21, ${this.snapFlashAlpha * 0.18})`;
            this.ctx.lineWidth = 4;
            for (const t of this.snapFlashTiles) {
                const x = t.currentPos.col * tileW;
                const y = t.currentPos.row * tileH;
                this.ctx.fillRect(x, y, tileW, tileH);
                this.ctx.strokeRect(x + 2, y + 2, tileW - 4, tileH - 4);
            }
            this.ctx.restore();
        }

        // 3. Live Drop Target Preview & Dragged Cluster
        if (!this.victoryAchieved && !this.hintActive && this.selectedCluster.length > 0 && this.dragCurrentPixel) {
            const anchorStart = this.dragStartPositions.get(this.dragAnchorTile);
            const anchorPixelX = this.dragCurrentPixel.x - this.dragOffset.x;
            const anchorPixelY = this.dragCurrentPixel.y - this.dragOffset.y;

            const targetCol = Math.floor((anchorPixelX + tileW / 2) / tileW);
            const targetRow = Math.floor((anchorPixelY + tileH / 2) / tileH);
            const dCol = targetCol - anchorStart.col;
            const dRow = targetRow - anchorStart.row;

            let validPreview = true;
            const previewCells = [];
            for (const tile of this.selectedCluster) {
                const sPos = this.dragStartPositions.get(tile);
                const tc = sPos.col + dCol;
                const tr = sPos.row + dRow;
                previewCells.push({ col: tc, row: tr });
                if (tc < 0 || tc >= this.gridSize || tr < 0 || tr >= this.gridSize) {
                    validPreview = false;
                }
            }

            this.ctx.save();
            this.ctx.lineWidth = 2.5;
            this.ctx.strokeStyle = validPreview ? 'rgba(52, 211, 153, 0.9)' : 'rgba(251, 113, 133, 0.9)';
            this.ctx.fillStyle = validPreview ? 'rgba(52, 211, 153, 0.14)' : 'rgba(251, 113, 133, 0.16)';
            for (const cell of previewCells) {
                if (cell.col >= 0 && cell.col < this.gridSize && cell.row >= 0 && cell.row < this.gridSize) {
                    this.ctx.fillRect(cell.col * tileW, cell.row * tileH, tileW, tileH);
                    this.ctx.strokeRect(cell.col * tileW + 1.5, cell.row * tileH + 1.5, tileW - 3, tileH - 3);
                }
            }
            this.ctx.restore();

            this.ctx.save();
            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
            this.ctx.shadowBlur = 18;
            this.ctx.shadowOffsetY = 8;

            for (const tile of this.selectedCluster) {
                const sPos = this.dragStartPositions.get(tile);
                const relColOffset = sPos.col - anchorStart.col;
                const relRowOffset = sPos.row - anchorStart.row;

                const dragX = anchorPixelX + relColOffset * tileW;
                const dragY = anchorPixelY + relRowOffset * tileH;

                this.ctx.drawImage(tile.subCanvas, dragX, dragY);
            }
            this.ctx.restore();

            for (const tile of this.selectedCluster) {
                const sPos = this.dragStartPositions.get(tile);
                const relColOffset = sPos.col - anchorStart.col;
                const relRowOffset = sPos.row - anchorStart.row;

                const dragX = anchorPixelX + relColOffset * tileW;
                const dragY = anchorPixelY + relRowOffset * tileH;
                this.drawTileBorders(tile, dragX, dragY, tileW, tileH);
            }
        }

        // 4. Victory Confetti Particles
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
    window.jigsawApp = new JigsawSolitaireApp();
};
