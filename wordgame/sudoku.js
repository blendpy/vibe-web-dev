// --- Constants & Configurations ---
const GRID_SIZES = {
    "4×4 (Mini)": { size: 4, boxH: 2, boxW: 2 },
    "6×6": { size: 6, boxH: 2, boxW: 3 },
    "9×9 (Classic)": { size: 9, boxH: 3, boxW: 3 },
    "12×12 (Dodeka)": { size: 12, boxH: 3, boxW: 4 },
    "16×16 (Hex)": { size: 16, boxH: 4, boxW: 4 },
    "25×25 (Giant)": { size: 25, boxH: 5, boxW: 5 },
};

const DIFFICULTIES = {
    "Easy": 0.35,
    "Medium": 0.50,
    "Hard": 0.63,
    "Very Difficult": 0.72,
    "Symbol": 0.50,
};

const HINT_TECHNIQUES = {
    "Auto / Any Available": [4, 6, 9, 12, 16, 25],
    "Naked Single": [4, 6, 9, 12, 16, 25],
    "Hidden Single": [4, 6, 9, 12, 16, 25],
    "Cross-Hatching": [4, 6, 9, 12, 16, 25],
    "Naked Pair": [6, 9, 12, 16, 25],
    "Pointing Pair": [6, 9, 12, 16, 25],
    "The 45 Rule": [9],
};

const CELL_SHAPES = ["Square", "Circle", "Heart", "X", "Plus", "Triangle", "Diamond", "Star"];

const WORD_PRESETS = {
    4: ["CUBE", "ECHO", "GAME", "GLOW", "GRID", "LYNX", "MATH", "PLAY", "ZINC", "ZONE"],
    6: ["Anchor", "Beyond", "Comedy", "Dragon", "Exotic", "Figure", "Flight", "Golden", "Honest", "Island", "Jungle", "Knight", "Launch", "Matrix", "Nebula", "Oxygen", "Planet", "Queasy", "Rocket", "Silver", "Spring", "Timber", "Urgent", "Voyage", "Winter", "Yogurt", "Zodiac"],
    9: ["Abduction", "Algorithm", "Amplitude", "Backfired", "Bystander", "Cabinetry", "Chemistry", "Comprised", "Complaint", "Copyright", "Culminate", "Dangerous", "Deflating", "Disproven", "Duplicate", "Flowchart", "Fractions", "Formulate", "Geraniums", "Hijackers", "Housemaid", "Hypocrite", "HeartSync", "Imputable", "Inclosure", "Interlock", "Jailhouse", "Juxtapose", "Logarithm", "Metalwork", "Notarized", "Obscenity", "Observant", "Outpacing", "Pathogens", "Provinces", "Prudently", "Quicksand", "Randomize", "Schmaltzy", "Seduction", "Soldering", "Stepchild", "Sunflower", "Spreading", "Voluntary"],
    12: ["Ambidextrous", "Bankruptcies", "Cabinetworks", "Centrifugals", "Considerably", "Countervails", "Demographics", "Discountable", "Discrepantly", "Disreputably", "Exclusionary", "Hypnotizable", "Housewarming", "Nightwalkers", "Malnourished", "Packinghouse", "Postcardlike", "Stenographic", "Thunderclaps", "Unglamorized", "Unprofitable", "Unforgivable"],
    16: ["Uncopyrightable!"],
    25: ["abcdefghijklmnopqrstuvwxy"],
};

// --- Helper Functions ---
function distToSegment(p, a, b) {
    const px = p[0], py = p[1], ax = a[0], ay = a[1], bx = b[0], by = b[1];
    const l2 = (bx - ax) ** 2 + (by - ay) ** 2;
    if (l2 === 0) return Math.hypot(px - ax, py - ay);
    let t = Math.max(0, Math.min(1, ((px - ax) * (bx - ax) + (py - ay) * (by - ay)) / l2));
    const projX = ax + t * (bx - ax);
    const projY = ay + t * (by - ay);
    return Math.hypot(px - projX, py - projY);
}

function popcount32(x) {
    x = x - ((x >>> 1) & 0x55555555);
    x = (x & 0x33333333) + ((x >>> 2) & 0x33333333);
    return (((x + (x >>> 4)) & 0x0F0F0F0F) * 0x01010101) >>> 24;
}

function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        let j = (Math.random() * (i + 1)) | 0;
        let tmp = arr[i];
        arr[i] = arr[j];
        arr[j] = tmp;
    }
    return arr;
}

function getHintShapeMask(shapeName, size) {
    if (shapeName === "Random" || !shapeName) return null;
    let mask = Array.from({ length: size }, () => Array(size).fill(false));

    function getCoords(r, c) {
        let x = (2 * c - (size - 1)) / Math.max(1, size - 1);
        let y = ((size - 1) - 2 * r) / Math.max(1, size - 1);
        return [x, y];
    }

    if (shapeName === "X") {
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                let [x, y] = getCoords(r, c);
                if (Math.min(Math.abs(x - y) / 1.4142, Math.abs(x + y) / 1.4142) <= 0.22) mask[r][c] = true;
            }
        }
    } else if (shapeName === "Circle") {
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                let [x, y] = getCoords(r, c);
                if (Math.abs(Math.hypot(x, y) - 0.68) <= 0.22) mask[r][c] = true;
            }
        }
    } else if (shapeName === "Heart") {
        let heartPts = [];
        for (let i = 0; i < 100; i++) {
            let t = 2 * Math.PI * i / 100;
            let hx = 0.75 * (Math.sin(t) ** 3);
            let hy = 0.05 + (0.65 * Math.cos(t) - 0.25 * Math.cos(2 * t) - 0.1 * Math.cos(3 * t) - 0.05 * Math.cos(4 * t)) / 1.2;
            heartPts.push([hx, hy]);
        }
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                let [x, y] = getCoords(r, c);
                let minD = Math.min(...heartPts.map(([hx, hy]) => Math.hypot(x - hx, y - hy)));
                if (minD <= 0.22) mask[r][c] = true;
            }
        }
    } else if (shapeName === "Plus") {
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                let [x, y] = getCoords(r, c);
                if ((Math.abs(x) <= 0.22 && Math.abs(y) <= 0.85) || (Math.abs(y) <= 0.22 && Math.abs(x) <= 0.85)) mask[r][c] = true;
            }
        }
    } else if (shapeName === "Triangle") {
        let pts = [[0, 0.85], [-0.8, -0.65], [0.8, -0.65]];
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                let [x, y] = getCoords(r, c);
                let d = Math.min(distToSegment([x, y], pts[0], pts[1]), distToSegment([x, y], pts[1], pts[2]), distToSegment([x, y], pts[2], pts[0]));
                if (d <= 0.20) mask[r][c] = true;
            }
        }
    } else if (shapeName === "Diamond") {
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                let [x, y] = getCoords(r, c);
                if (Math.abs((Math.abs(x) + Math.abs(y)) - 0.75) <= 0.22) mask[r][c] = true;
            }
        }
    } else if (shapeName === "Square") {
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                let [x, y] = getCoords(r, c);
                if (Math.abs(Math.max(Math.abs(x), Math.abs(y)) - 0.75) <= 0.22) mask[r][c] = true;
            }
        }
    } else if (shapeName === "Star") {
        let starPts = [];
        for (let i = 0; i < 10; i++) {
            let rad = (i % 2 === 0) ? 0.85 : 0.35;
            let angle = Math.PI / 2 - i * (Math.PI / 5);
            starPts.push([rad * Math.cos(angle), rad * Math.sin(angle)]);
        }
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                let [x, y] = getCoords(r, c);
                let d = Math.min(...Array.from({ length: 10 }, (_, i) => distToSegment([x, y], starPts[i], starPts[(i + 1) % 10])));
                if (d <= 0.18) mask[r][c] = true;
            }
        }
    }
    return mask;
}

// --- Sudoku Generator & High-Speed Bitmask Engine ---
class SudokuGenerator {
    static isValid(board, row, col, val, size, boxH, boxW) {
        for (let i = 0; i < size; i++) {
            if (board[row][i] === val || board[i][col] === val) return false;
        }
        let startRow = Math.floor(row / boxH) * boxH;
        let startCol = Math.floor(col / boxW) * boxW;
        for (let r = startRow; r < startRow + boxH; r++) {
            for (let c = startCol; c < startCol + boxW; c++) {
                if (board[r][c] === val) return false;
            }
        }
        return true;
    }

    static solve(board, size, boxH, boxW) {
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                if (board[r][c] === 0) {
                    let nums = shuffleArray(Array.from({ length: size }, (_, i) => i + 1));
                    for (let val of nums) {
                        if (SudokuGenerator.isValid(board, r, c, val, size, boxH, boxW)) {
                            board[r][c] = val;
                            if (SudokuGenerator.solve(board, size, boxH, boxW)) return true;
                            board[r][c] = 0;
                        }
                    }
                    return false;
                }
            }
        }
        return true;
    }

    static generateSolvedBoard(size, boxH, boxW) {
        let board = Array.from({ length: size }, () => Array(size).fill(0));
        if (size <= 9) {
            SudokuGenerator.solve(board, size, boxH, boxW);
            return board;
        }

        let base = shuffleArray(Array.from({ length: size }, (_, i) => i + 1));
        for (let r = 0; r < size; r++) {
            let shift = (r % boxH) * boxW + Math.floor(r / boxH);
            for (let c = 0; c < size; c++) {
                board[r][c] = base[(c + shift) % size];
            }
        }

        const numBands = size / boxH;
        const numStacks = size / boxW;

        let rowOrder = [];
        let bands = shuffleArray(Array.from({ length: numBands }, (_, i) => i));
        for (let b of bands) {
            let bandRows = shuffleArray(Array.from({ length: boxH }, (_, i) => b * boxH + i));
            rowOrder.push(...bandRows);
        }

        let colOrder = [];
        let stacks = shuffleArray(Array.from({ length: numStacks }, (_, i) => i));
        for (let s of stacks) {
            let stackCols = shuffleArray(Array.from({ length: boxW }, (_, i) => s * boxW + i));
            colOrder.push(...stackCols);
        }

        let shuffled = Array.from({ length: size }, () => Array(size).fill(0));
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                shuffled[r][c] = board[rowOrder[r]][colOrder[c]];
            }
        }
        return shuffled;
    }

    static checkStructuralSymmetry(board, size, boxH, boxW) {
        let symCounts = new Int32Array(size + 1);
        let rowCounts = new Int32Array(size);
        let colCounts = new Int32Array(size);
        let totalClues = 0;

        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                let v = board[r][c];
                if (v !== 0) {
                    symCounts[v]++;
                    rowCounts[r]++;
                    colCounts[c]++;
                    totalClues++;
                }
            }
        }

        let missingSymbols = 0;
        for (let v = 1; v <= size; v++) {
            if (symCounts[v] === 0) missingSymbols++;
        }
        if (missingSymbols >= 2) {
            return {
                ambiguous: true,
                reason: `Missing Symbol Symmetry (${missingSymbols} symbols have 0 givens on the board and can be freely swapped).`
            };
        }

        if (size === 9 && totalClues < 17) {
            return {
                ambiguous: true,
                reason: `Insufficient Clues (${totalClues} givens; 9×9 Sudoku requires at least 17 clues for a unique solution).`
            };
        }

        for (let br = 0; br < size; br += boxH) {
            let emptyRowsInBand = 0;
            for (let r = br; r < br + boxH; r++) {
                if (rowCounts[r] === 0) emptyRowsInBand++;
            }
            if (emptyRowsInBand >= 2) {
                return {
                    ambiguous: true,
                    reason: `Interchangeable Empty Rows (${emptyRowsInBand} completely empty rows in the same horizontal box band).`
                };
            }
        }

        for (let bc = 0; bc < size; bc += boxW) {
            let emptyColsInStack = 0;
            for (let c = bc; c < bc + boxW; c++) {
                if (colCounts[c] === 0) emptyColsInStack++;
            }
            if (emptyColsInStack >= 2) {
                return {
                    ambiguous: true,
                    reason: `Interchangeable Empty Columns (${emptyColsInStack} completely empty columns in the same vertical box stack).`
                };
            }
        }

        return { ambiguous: false, reason: null };
    }

    static countSolutions(board, size, boxH, boxW, limit = 2, options = {}) {
        const {
            knownSolution = null,
            propagateOnly = false,
            maxNodes = Infinity,
            stats = null
        } = options;

        const numCells = size * size;
        const numBoxesC = size / boxW;
        const allMask = (1 << size) - 1;

        const rowMask = new Int32Array(size);
        const colMask = new Int32Array(size);
        const boxMask = new Int32Array(size);
        const grid = new Int32Array(numCells);
        const elimMask = new Int32Array(numCells);

        const cellRow = new Int32Array(numCells);
        const cellCol = new Int32Array(numCells);
        const cellBox = new Int32Array(numCells);
        const boxCells = Array.from({ length: size }, () => []);

        let emptyCount = 0;
        let matchesKnownSolution = (knownSolution !== null);

        for (let r = 0; r < size; r++) {
            let br = Math.floor(r / boxH) * numBoxesC;
            for (let c = 0; c < size; c++) {
                let idx = r * size + c;
                let b = br + Math.floor(c / boxW);
                cellRow[idx] = r;
                cellCol[idx] = c;
                cellBox[idx] = b;
                boxCells[b].push(idx);

                let val = board[r][c];
                if (val !== 0) {
                    let bit = 1 << (val - 1);
                    if ((rowMask[r] & bit) || (colMask[c] & bit) || (boxMask[b] & bit)) {
                        return 0;
                    }
                    grid[idx] = bit;
                    rowMask[r] |= bit;
                    colMask[c] |= bit;
                    boxMask[b] |= bit;
                    if (matchesKnownSolution && knownSolution[r][c] !== val) {
                        matchesKnownSolution = false;
                    }
                } else {
                    grid[idx] = 0;
                    emptyCount++;
                }
            }
        }

        const initialEmpty = emptyCount;
        if (stats) {
            stats.initialEmpty = initialEmpty;
            stats.preFilled = 0;
            stats.symmetryReason = null;
        }

        if (limit >= 2 && !propagateOnly) {
            const symCheck = SudokuGenerator.checkStructuralSymmetry(board, size, boxH, boxW);
            if (symCheck.ambiguous) {
                if (stats) stats.symmetryReason = symCheck.reason;
                if (matchesKnownSolution) return 2;
                let hasOne = SudokuGenerator.countSolutions(board, size, boxH, boxW, 1);
                return hasOne > 0 ? 2 : 0;
            }
        }

        const trailIdx = new Int32Array(numCells);
        const trailBit = new Int32Array(numCells);
        let trailTop = 0;

        const elimTrailIdx = new Int32Array(numCells * size);
        const elimTrailBits = new Int32Array(numCells * size);
        let elimTrailTop = 0;

        function place(idx, bit) {
            let r = cellRow[idx], c = cellCol[idx], b = cellBox[idx];
            grid[idx] = bit;
            rowMask[r] |= bit;
            colMask[c] |= bit;
            boxMask[b] |= bit;
            trailIdx[trailTop] = idx;
            trailBit[trailTop] = bit;
            trailTop++;
            emptyCount--;
        }

        function eliminate(idx, bits) {
            let actual = bits & ~elimMask[idx];
            if (actual === 0) return false;
            elimMask[idx] |= actual;
            elimTrailIdx[elimTrailTop] = idx;
            elimTrailBits[elimTrailTop] = actual;
            elimTrailTop++;
            return true;
        }

        function undoTo(savedTop, savedElimTop) {
            while (trailTop > savedTop) {
                trailTop--;
                let idx = trailIdx[trailTop];
                let bit = trailBit[trailTop];
                let r = cellRow[idx], c = cellCol[idx], b = cellBox[idx];
                grid[idx] = 0;
                rowMask[r] &= ~bit;
                colMask[c] &= ~bit;
                boxMask[b] &= ~bit;
                emptyCount++;
            }
            while (elimTrailTop > savedElimTop) {
                elimTrailTop--;
                elimMask[elimTrailIdx[elimTrailTop]] &= ~elimTrailBits[elimTrailTop];
            }
        }

        const boxRowMasks = new Int32Array(boxH);
        const boxColMasks = new Int32Array(boxW);

        function propagate(useAdvancedRules) {
            let changed = true;
            while (changed) {
                changed = false;

                // 1. Naked Singles & Dead-End Check
                for (let idx = 0; idx < numCells; idx++) {
                    if (grid[idx] !== 0) continue;
                    let r = cellRow[idx], c = cellCol[idx], b = cellBox[idx];
                    let avail = allMask & ~(rowMask[r] | colMask[c] | boxMask[b] | elimMask[idx]);
                    if (avail === 0) return false;
                    if ((avail & (avail - 1)) === 0) {
                        place(idx, avail);
                        changed = true;
                    }
                }

                if (emptyCount === 0) return true;

                // 2. Hidden Singles & Naked Pairs in Rows
                for (let r = 0; r < size; r++) {
                    let missing = allMask & ~rowMask[r];
                    if (missing === 0) continue;
                    let once = 0, multiple = 0;
                    let rowStart = r * size;
                    let seenPairs = 0;

                    for (let c = 0; c < size; c++) {
                        let idx = rowStart + c;
                        if (grid[idx] === 0) {
                            let avail = allMask & ~(rowMask[r] | colMask[c] | boxMask[cellBox[idx]] | elimMask[idx]);
                            if (avail === 0) return false;
                            multiple |= (once & avail);
                            once |= avail;

                            if (useAdvancedRules && popcount32(avail) === 2) {
                                if ((seenPairs & avail) === avail) {
                                    for (let prevC = 0; prevC < c; prevC++) {
                                        let prevIdx = rowStart + prevC;
                                        if (grid[prevIdx] === 0) {
                                            let prevAvail = allMask & ~(rowMask[r] | colMask[prevC] | boxMask[cellBox[prevIdx]] | elimMask[prevIdx]);
                                            if (prevAvail === avail) {
                                                for (let k = 0; k < size; k++) {
                                                    if (k !== c && k !== prevC) {
                                                        let otherIdx = rowStart + k;
                                                        if (grid[otherIdx] === 0) {
                                                            let otherAvail = allMask & ~(rowMask[r] | colMask[k] | boxMask[cellBox[otherIdx]] | elimMask[otherIdx]);
                                                            if ((otherAvail & avail) !== 0) {
                                                                if ((otherAvail & ~avail) === 0) return false;
                                                                if (eliminate(otherIdx, avail)) changed = true;
                                                            }
                                                        }
                                                    }
                                                }
                                                break;
                                            }
                                        }
                                    }
                                }
                                seenPairs |= avail;
                            }
                        }
                    }
                    if ((once & missing) !== missing) return false;
                    let singles = once & ~multiple & missing;
                    if (singles !== 0) {
                        for (let c = 0; c < size; c++) {
                            let idx = rowStart + c;
                            if (grid[idx] === 0) {
                                let avail = allMask & ~(rowMask[r] | colMask[c] | boxMask[cellBox[idx]] | elimMask[idx]);
                                let match = avail & singles;
                                if (match !== 0) {
                                    if ((match & (match - 1)) !== 0) return false;
                                    place(idx, match);
                                    singles &= ~match;
                                    changed = true;
                                }
                            }
                        }
                    }
                }

                // 3. Hidden Singles & Naked Pairs in Columns
                for (let c = 0; c < size; c++) {
                    let missing = allMask & ~colMask[c];
                    if (missing === 0) continue;
                    let once = 0, multiple = 0;
                    let seenPairs = 0;

                    for (let r = 0; r < size; r++) {
                        let idx = r * size + c;
                        if (grid[idx] === 0) {
                            let avail = allMask & ~(rowMask[r] | colMask[c] | boxMask[cellBox[idx]] | elimMask[idx]);
                            if (avail === 0) return false;
                            multiple |= (once & avail);
                            once |= avail;

                            if (useAdvancedRules && popcount32(avail) === 2) {
                                if ((seenPairs & avail) === avail) {
                                    for (let prevR = 0; prevR < r; prevR++) {
                                        let prevIdx = prevR * size + c;
                                        if (grid[prevIdx] === 0) {
                                            let prevAvail = allMask & ~(rowMask[prevR] | colMask[c] | boxMask[cellBox[prevIdx]] | elimMask[prevIdx]);
                                            if (prevAvail === avail) {
                                                for (let k = 0; k < size; k++) {
                                                    if (k !== r && k !== prevR) {
                                                        let otherIdx = k * size + c;
                                                        if (grid[otherIdx] === 0) {
                                                            let otherAvail = allMask & ~(rowMask[k] | colMask[c] | boxMask[cellBox[otherIdx]] | elimMask[otherIdx]);
                                                            if ((otherAvail & avail) !== 0) {
                                                                if ((otherAvail & ~avail) === 0) return false;
                                                                if (eliminate(otherIdx, avail)) changed = true;
                                                            }
                                                        }
                                                    }
                                                }
                                                break;
                                            }
                                        }
                                    }
                                }
                                seenPairs |= avail;
                            }
                        }
                    }
                    if ((once & missing) !== missing) return false;
                    let singles = once & ~multiple & missing;
                    if (singles !== 0) {
                        for (let r = 0; r < size; r++) {
                            let idx = r * size + c;
                            if (grid[idx] === 0) {
                                let avail = allMask & ~(rowMask[r] | colMask[c] | boxMask[cellBox[idx]] | elimMask[idx]);
                                let match = avail & singles;
                                if (match !== 0) {
                                    if ((match & (match - 1)) !== 0) return false;
                                    place(idx, match);
                                    singles &= ~match;
                                    changed = true;
                                }
                            }
                        }
                    }
                }

                // 4. Hidden Singles & Pointing Pairs (Locked Candidates) in Boxes
                for (let b = 0; b < size; b++) {
                    let missing = allMask & ~boxMask[b];
                    if (missing === 0) continue;
                    let once = 0, multiple = 0;
                    let bCells = boxCells[b];

                    if (useAdvancedRules) {
                        boxRowMasks.fill(0);
                        boxColMasks.fill(0);
                    }

                    let startR = Math.floor(b / numBoxesC) * boxH;
                    let startC = (b % numBoxesC) * boxW;

                    for (let k = 0; k < size; k++) {
                        let idx = bCells[k];
                        if (grid[idx] === 0) {
                            let r = cellRow[idx], c = cellCol[idx];
                            let avail = allMask & ~(rowMask[r] | colMask[c] | boxMask[b] | elimMask[idx]);
                            if (avail === 0) return false;
                            multiple |= (once & avail);
                            once |= avail;
                            if (useAdvancedRules) {
                                boxRowMasks[r - startR] |= avail;
                                boxColMasks[c - startC] |= avail;
                            }
                        }
                    }
                    if ((once & missing) !== missing) return false;
                    let singles = once & ~multiple & missing;
                    if (singles !== 0) {
                        for (let k = 0; k < size; k++) {
                            let idx = bCells[k];
                            if (grid[idx] === 0) {
                                let avail = allMask & ~(rowMask[cellRow[idx]] | colMask[cellCol[idx]] | boxMask[b] | elimMask[idx]);
                                let match = avail & singles;
                                if (match !== 0) {
                                    if ((match & (match - 1)) !== 0) return false;
                                    place(idx, match);
                                    singles &= ~match;
                                    changed = true;
                                }
                            }
                        }
                    }

                    // Pointing Pairs / Triples (Box-Line Reduction)
                    if (useAdvancedRules && !changed) {
                        let onceR = 0, multR = 0;
                        for (let rIn = 0; rIn < boxH; rIn++) {
                            let m = boxRowMasks[rIn];
                            multR |= (onceR & m);
                            onceR |= m;
                        }
                        let lockedRowSymbols = onceR & ~multR;
                        if (lockedRowSymbols !== 0) {
                            for (let rIn = 0; rIn < boxH; rIn++) {
                                let lockedBits = boxRowMasks[rIn] & lockedRowSymbols;
                                if (lockedBits !== 0) {
                                    let r = startR + rIn;
                                    let rowStart = r * size;
                                    for (let c = 0; c < size; c++) {
                                        if (c < startC || c >= startC + boxW) {
                                            let idx = rowStart + c;
                                            if (grid[idx] === 0) {
                                                let avail = allMask & ~(rowMask[r] | colMask[c] | boxMask[cellBox[idx]] | elimMask[idx]);
                                                if ((avail & lockedBits) !== 0) {
                                                    if ((avail & ~lockedBits) === 0) return false;
                                                    if (eliminate(idx, lockedBits)) changed = true;
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }

                        let onceC = 0, multC = 0;
                        for (let cIn = 0; cIn < boxW; cIn++) {
                            let m = boxColMasks[cIn];
                            multC |= (onceC & m);
                            onceC |= m;
                        }
                        let lockedColSymbols = onceC & ~multC;
                        if (lockedColSymbols !== 0) {
                            for (let cIn = 0; cIn < boxW; cIn++) {
                                let lockedBits = boxColMasks[cIn] & lockedColSymbols;
                                if (lockedBits !== 0) {
                                    let c = startC + cIn;
                                    for (let r = 0; r < size; r++) {
                                        if (r < startR || r >= startR + boxH) {
                                            let idx = r * size + c;
                                            if (grid[idx] === 0) {
                                                let avail = allMask & ~(rowMask[r] | colMask[c] | boxMask[cellBox[idx]] | elimMask[idx]);
                                                if ((avail & lockedBits) !== 0) {
                                                    if ((avail & ~lockedBits) === 0) return false;
                                                    if (eliminate(idx, lockedBits)) changed = true;
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            return true;
        }

        if (!propagate(true)) {
            return 0;
        }

        if (stats) {
            stats.preFilled = initialEmpty - emptyCount;
        }

        if (emptyCount === 0) return 1;
        if (propagateOnly) return 2;

        let count = 0;
        let nodesExplored = 0;
        let budgetExceeded = false;

        function solveMRV() {
            if (count >= limit || budgetExceeded) return;
            if (emptyCount === 0) {
                count++;
                return;
            }

            if (++nodesExplored > maxNodes) {
                budgetExceeded = true;
                return;
            }

            let bestIdx = -1;
            let bestAvail = 0;
            let minCands = size + 1;
            let maxConstraintScore = -1;

            for (let idx = 0; idx < numCells; idx++) {
                if (grid[idx] !== 0) continue;
                let r = cellRow[idx], c = cellCol[idx], b = cellBox[idx];
                let avail = allMask & ~(rowMask[r] | colMask[c] | boxMask[b] | elimMask[idx]);
                if (avail === 0) return;

                let cands = popcount32(avail);
                if (cands < minCands) {
                    minCands = cands;
                    bestIdx = idx;
                    bestAvail = avail;
                    maxConstraintScore = popcount32(rowMask[r]) + popcount32(colMask[c]) + popcount32(boxMask[b]);
                } else if (cands === minCands) {
                    let score = popcount32(rowMask[r]) + popcount32(colMask[c]) + popcount32(boxMask[b]);
                    if (score > maxConstraintScore) {
                        maxConstraintScore = score;
                        bestIdx = idx;
                        bestAvail = avail;
                    }
                }
            }

            if (bestIdx === -1) return;

            let solBit = 0;
            if (matchesKnownSolution) {
                let r = cellRow[bestIdx], c = cellCol[bestIdx];
                solBit = 1 << (knownSolution[r][c] - 1);
            }

            let firstPassMask = bestAvail & ~solBit;
            let secondPassMask = bestAvail & solBit;

            for (let pass = 0; pass < 2; pass++) {
                let passMask = (pass === 0) ? firstPassMask : secondPassMask;
                for (let mask = passMask; mask !== 0; mask &= (mask - 1)) {
                    let bit = mask & -mask;
                    let savedTop = trailTop;
                    let savedElimTop = elimTrailTop;

                    place(bestIdx, bit);
                    if (propagate(false)) {
                        solveMRV();
                    }
                    undoTo(savedTop, savedElimTop);

                    if (count >= limit || budgetExceeded) return;
                }
            }
        }

        solveMRV();

        if (budgetExceeded) {
            return limit;
        }
        return count;
    }

    static isImmediateLocalSingle(puzzle, r, c, val, size, boxH, boxW) {
        const allMask = (1 << size) - 1;
        const targetBit = 1 << (val - 1);

        let rMask = 0, cMask = 0, bMask = 0;
        let startR = Math.floor(r / boxH) * boxH;
        let startC = Math.floor(c / boxW) * boxW;

        for (let i = 0; i < size; i++) {
            let rv = puzzle[r][i];
            if (rv !== 0) rMask |= (1 << (rv - 1));
            let cv = puzzle[i][c];
            if (cv !== 0) cMask |= (1 << (cv - 1));
        }
        for (let br = startR; br < startR + boxH; br++) {
            for (let bc = startC; bc < startC + boxW; bc++) {
                let bv = puzzle[br][bc];
                if (bv !== 0) bMask |= (1 << (bv - 1));
            }
        }

        let cellAvail = allMask & ~(rMask | cMask | bMask);
        if (cellAvail === targetBit) return true;

        function canPlaceVal(rr, cc) {
            for (let i = 0; i < size; i++) {
                if (puzzle[rr][i] === val || puzzle[i][cc] === val) return false;
            }
            let sr = Math.floor(rr / boxH) * boxH;
            let sc = Math.floor(cc / boxW) * boxW;
            for (let br = sr; br < sr + boxH; br++) {
                for (let bc = sc; bc < sc + boxW; bc++) {
                    if (puzzle[br][bc] === val) return false;
                }
            }
            return true;
        }

        let possibleInRow = true;
        for (let cc = 0; cc < size; cc++) {
            if (cc !== c && puzzle[r][cc] === 0 && canPlaceVal(r, cc)) {
                possibleInRow = false;
                break;
            }
        }
        if (possibleInRow) return true;

        let possibleInCol = true;
        for (let rr = 0; rr < size; rr++) {
            if (rr !== r && puzzle[rr][c] === 0 && canPlaceVal(rr, c)) {
                possibleInCol = false;
                break;
            }
        }
        if (possibleInCol) return true;

        let possibleInBox = true;
        for (let br = startR; br < startR + boxH; br++) {
            for (let bc = startC; bc < startC + boxW; bc++) {
                if ((br !== r || bc !== c) && puzzle[br][bc] === 0 && canPlaceVal(br, bc)) {
                    possibleInBox = false;
                    break;
                }
            }
            if (!possibleInBox) break;
        }
        return possibleInBox;
    }

    static generate(size, boxH, boxW, removeRatio = 0.50, hintShape = "Random", difficulty = "Medium") {
        let shapeMask = getHintShapeMask(hintShape, size);

        if (shapeMask !== null) {
            let bestPuzzle = null;
            let bestSolution = null;
            let bestUnique = false;
            let bestPreFilled = -1;

            const attempts = size <= 9 ? 6 : 3;
            for (let attempt = 0; attempt < attempts; attempt++) {
                let solution = SudokuGenerator.generateSolvedBoard(size, boxH, boxW);
                let puzzle = solution.map((row, r) => row.map((val, c) => shapeMask[r][c] ? val : 0));

                let stats = { initialEmpty: 0, preFilled: 0 };
                let count = SudokuGenerator.countSolutions(puzzle, size, boxH, boxW, 2, {
                    knownSolution: solution,
                    maxNodes: 200,
                    stats
                });

                let isUnique = (count === 1);
                if (isUnique || stats.preFilled > bestPreFilled) {
                    bestPuzzle = puzzle;
                    bestSolution = solution;
                    bestUnique = isUnique;
                    bestPreFilled = stats.preFilled;
                    if (isUnique) break;
                }
            }
            return { puzzle: bestPuzzle, solution: bestSolution, uniqueGuaranteed: bestUnique };
        }

        let solution = SudokuGenerator.generateSolvedBoard(size, boxH, boxW);
        let puzzle = solution.map(row => [...row]);

        let cells = [];
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) cells.push([r, c]);
        }
        shuffleArray(cells);

        let totalCells = size * size;
        let minClues = (size === 9) ? 17 : Math.ceil(totalCells * 0.22);
        let targetRemovals = Math.min(totalCells - minClues, Math.floor(totalCells * removeRatio));
        let removed = 0;

        let symCounts = new Int32Array(size + 1).fill(size);
        let rowCounts = new Int32Array(size).fill(size);
        let colCounts = new Int32Array(size).fill(size);
        let zeroSymbolCount = 0;

        const requirePurePropagation = (difficulty === "Easy" || size >= 16);
        const nodeBudget = (size <= 9) ? 500 : (size === 12 ? 120 : 40);

        for (let [r, c] of cells) {
            if (removed >= targetRemovals) break;

            let temp = puzzle[r][c];

            if (symCounts[temp] === 1 && zeroSymbolCount >= 1) {
                continue;
            }

            if (rowCounts[r] === 1) {
                let bandStart = Math.floor(r / boxH) * boxH;
                let hasEmptyRowInBand = false;
                for (let br = bandStart; br < bandStart + boxH; br++) {
                    if (br !== r && rowCounts[br] === 0) { hasEmptyRowInBand = true; break; }
                }
                if (hasEmptyRowInBand) continue;
            }
            if (colCounts[c] === 1) {
                let stackStart = Math.floor(c / boxW) * boxW;
                let hasEmptyColInStack = false;
                for (let bc = stackStart; bc < stackStart + boxW; bc++) {
                    if (bc !== c && colCounts[bc] === 0) { hasEmptyColInStack = true; break; }
                }
                if (hasEmptyColInStack) continue;
            }

            puzzle[r][c] = 0;

            let uniqueAfterRemoval = SudokuGenerator.isImmediateLocalSingle(puzzle, r, c, temp, size, boxH, boxW);

            if (!uniqueAfterRemoval) {
                let solCount = SudokuGenerator.countSolutions(puzzle, size, boxH, boxW, 2, {
                    knownSolution: solution,
                    propagateOnly: requirePurePropagation,
                    maxNodes: nodeBudget
                });
                uniqueAfterRemoval = (solCount === 1);
            }

            if (uniqueAfterRemoval) {
                removed++;
                symCounts[temp]--;
                if (symCounts[temp] === 0) zeroSymbolCount++;
                rowCounts[r]--;
                colCounts[c]--;
            } else {
                puzzle[r][c] = temp;
            }
        }

        return { puzzle, solution, uniqueGuaranteed: true };
    }
}

// --- Deduction Hint Engine ---
class HintEngine {
    static getCandidates(board, size, boxH, boxW, r, c) {
        if (board[r][c] !== 0) return new Set();
        let cands = new Set();
        for (let val = 1; val <= size; val++) {
            if (SudokuGenerator.isValid(board, r, c, val, size, boxH, boxW)) cands.add(val);
        }
        return cands;
    }

    static find45Rule(board, size, boxH, boxW, symbolMap) {
        let expectedSum = (size * (size + 1)) / 2;

        for (let r = 0; r < size; r++) {
            let zeros = [];
            for (let c = 0; c < size; c++) if (board[r][c] === 0) zeros.push(c);
            if (zeros.length === 1) {
                let c = zeros[0];
                let currentSum = board[r].reduce((a, b) => a + b, 0);
                let val = expectedSum - currentSum;
                let sym = symbolMap[val] || String(val);
                return { r, c, val, msg: `The 45 Rule (Sum Rule):\nRow ${r+1} has ${size - 1} numbers filled (sum = ${currentSum}). Missing calculation gives ${expectedSum} - ${currentSum} = ${sym} at Row ${r+1}, Col ${c+1}.` };
            }
        }

        for (let c = 0; c < size; c++) {
            let zeros = [];
            for (let r = 0; r < size; r++) if (board[r][c] === 0) zeros.push(r);
            if (zeros.length === 1) {
                let r = zeros[0];
                let currentSum = 0;
                for (let row = 0; row < size; row++) currentSum += board[row][c];
                let val = expectedSum - currentSum;
                let sym = symbolMap[val] || String(val);
                return { r, c, val, msg: `The 45 Rule (Sum Rule):\nColumn ${c+1} has ${size - 1} numbers filled (sum = ${currentSum}). Missing calculation gives ${expectedSum} - ${currentSum} = ${sym} at Row ${r+1}, Col ${c+1}.` };
            }
        }

        for (let br = 0; br < size / boxH; br++) {
            for (let bc = 0; bc < size / boxW; bc++) {
                let cells = [];
                for (let r = br * boxH; r < (br + 1) * boxH; r++) {
                    for (let c = bc * boxW; c < (bc + 1) * boxW; c++) cells.push([r, c]);
                }
                let zeros = cells.filter(([r, c]) => board[r][c] === 0);
                if (zeros.length === 1) {
                    let [r, c] = zeros[0];
                    let currentSum = cells.reduce((sum, [rr, cc]) => sum + board[rr][cc], 0);
                    let val = expectedSum - currentSum;
                    let sym = symbolMap[val] || String(val);
                    return { r, c, val, msg: `The 45 Rule (Sum Rule):\nBlock (${br+1},${bc+1}) has ${size - 1} cells filled (sum = ${currentSum}). Missing calculation gives ${expectedSum} - ${currentSum} = ${sym} at Row ${r+1}, Col ${c+1}.` };
                }
            }
        }
        return null;
    }

    static findNakedSingle(board, size, boxH, boxW, symbolMap) {
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                if (board[r][c] === 0) {
                    let cands = HintEngine.getCandidates(board, size, boxH, boxW, r, c);
                    if (cands.size === 1) {
                        let val = Array.from(cands)[0];
                        let sym = symbolMap[val] || String(val);
                        return { r, c, val, msg: `Naked Single:\nCell at Row ${r+1}, Col ${c+1} has only ONE possible symbol (${sym}) remaining because all others appear in its shared row, column, or block.` };
                    }
                }
            }
        }
        return null;
    }

    static findHiddenSingle(board, size, boxH, boxW, symbolMap) {
        for (let r = 0; r < size; r++) {
            for (let val = 1; val <= size; val++) {
                if (board[r].includes(val)) continue;
                let validCols = [];
                for (let c = 0; c < size; c++) {
                    if (board[r][c] === 0 && SudokuGenerator.isValid(board, r, c, val, size, boxH, boxW)) validCols.push(c);
                }
                if (validCols.length === 1) {
                    let c = validCols[0];
                    let sym = symbolMap[val] || String(val);
                    return { r, c, val, msg: `Hidden Single:\nIn Row ${r+1}, symbol '${sym}' can only fit into Col ${c+1}.` };
                }
            }
        }

        for (let c = 0; c < size; c++) {
            for (let val = 1; val <= size; val++) {
                let found = false;
                for (let r = 0; r < size; r++) if (board[r][c] === val) { found = true; break; }
                if (found) continue;
                let validRows = [];
                for (let r = 0; r < size; r++) {
                    if (board[r][c] === 0 && SudokuGenerator.isValid(board, r, c, val, size, boxH, boxW)) validRows.push(r);
                }
                if (validRows.length === 1) {
                    let r = validRows[0];
                    let sym = symbolMap[val] || String(val);
                    return { r, c, val, msg: `Hidden Single:\nIn Column ${c+1}, symbol '${sym}' can only fit into Row ${r+1}.` };
                }
            }
        }
        return null;
    }

    static findCrossHatching(board, size, boxH, boxW, symbolMap) {
        for (let br = 0; br < size / boxH; br++) {
            for (let bc = 0; bc < size / boxW; bc++) {
                let cells = [];
                for (let r = br * boxH; r < (br + 1) * boxH; r++) {
                    for (let c = bc * boxW; c < (bc + 1) * boxW; c++) cells.push([r, c]);
                }
                let blockVals = new Set(cells.map(([r, c]) => board[r][c]).filter(v => v !== 0));

                for (let val = 1; val <= size; val++) {
                    if (blockVals.has(val)) continue;
                    let validSpots = cells.filter(([r, c]) => board[r][c] === 0 && SudokuGenerator.isValid(board, r, c, val, size, boxH, boxW));
                    if (validSpots.length === 1) {
                        let [r, c] = validSpots[0];
                        let sym = symbolMap[val] || String(val);
                        return { r, c, val, msg: `Cross-Hatching:\nScanning intersecting lines across Block (${br+1},${bc+1}) eliminates all other spots for '${sym}', leaving Row ${r+1}, Col ${c+1}.` };
                    }
                }
            }
        }
        return null;
    }

    static findNakedPair(board, size, boxH, boxW, symbolMap) {
        for (let r = 0; r < size; r++) {
            let emptyCells = [];
            for (let c = 0; c < size; c++) if (board[r][c] === 0) emptyCells.push(c);
            let candsMap = {};
            for (let c of emptyCells) candsMap[c] = HintEngine.getCandidates(board, size, boxH, boxW, r, c);

            let pairs = emptyCells.filter(c => candsMap[c].size === 2);
            for (let i = 0; i < pairs.length; i++) {
                for (let j = i + 1; j < pairs.length; j++) {
                    let c1 = pairs[i], c2 = pairs[j];
                    let set1 = Array.from(candsMap[c1]), set2 = Array.from(candsMap[c2]);
                    if (set1.length === set2.length && set1.every(v => set2.includes(v))) {
                        let pairVals = set1.map(v => symbolMap[v] || String(v)).join(", ");
                        let msg = `Naked Pair Found:\nCells at Row ${r+1}, Col ${c1+1} and Col ${c2+1} share candidates {${pairVals}}.\n\nThese are erased from other cells in Row ${r+1}!`;
                        for (let cOther of emptyCells) {
                            if (cOther !== c1 && cOther !== c2) {
                                let rem = new Set([...candsMap[cOther]].filter(x => !candsMap[c1].has(x)));
                                if (rem.size === 1) {
                                    let val = Array.from(rem)[0];
                                    let sym = symbolMap[val] || String(val);
                                    return { r, c: cOther, val, msg: msg + `\nReveals symbol '${sym}' at Row ${r+1}, Col ${cOther+1}!` };
                                }
                            }
                        }
                        let valSample = set1[0];
                        return { r, c: c1, val: valSample, msg };
                    }
                }
            }
        }
        return null;
    }

    static findPointingPair(board, size, boxH, boxW, symbolMap) {
        for (let br = 0; br < size / boxH; br++) {
            for (let bc = 0; bc < size / boxW; bc++) {
                let cells = [];
                for (let r = br * boxH; r < (br + 1) * boxH; r++) {
                    for (let c = bc * boxW; c < (bc + 1) * boxW; c++) cells.push([r, c]);
                }
                for (let val = 1; val <= size; val++) {
                    let spots = cells.filter(([r, c]) => board[r][c] === 0 && SudokuGenerator.isValid(board, r, c, val, size, boxH, boxW));
                    if (spots.length === 2 || spots.length === 3) {
                        let rows = new Set(spots.map(([r, c]) => r));
                        let sym = symbolMap[val] || String(val);
                        if (rows.size === 1) {
                            let r = Array.from(rows)[0];
                            let msg = `Pointing Pair/Triple:\nIn Block (${br+1},${bc+1}), '${sym}' is restricted exclusively to Row ${r+1}.\nIt is eliminated from the rest of Row ${r+1}.`;
                            let targetCols = [];
                            for (let c = 0; c < size; c++) {
                                if (!cells.some(([cr, cc]) => cr === r && cc === c) && board[r][c] === 0 && HintEngine.getCandidates(board, size, boxH, boxW, r, c).has(val)) {
                                    targetCols.push(c);
                                }
                            }
                            if (targetCols.length > 0) {
                                return { r, c: targetCols[0], val: board[r][targetCols[0]] || val, msg };
                            }
                        }
                    }
                }
            }
        }
        return null;
    }
}

// --- Main Web Application Class ---
class SudokuApp {
    constructor() {
        this.currentSizeName = "9×9 (Classic)";
        this.currentDifficulty = "Medium";
        this.selectedHintType = "Auto / Any Available";
        this.allowModifyGivens = false;
        this.currentShape = "Square";
        this.currentHintShape = "Random";

        this.selectedCell = null;
        this.activeGreenHintCell = null;
        this.highlightedValue = null;
        this.bigHintCells = new Set();
        this.isUniqueGuaranteed = true;

        this.undoStack = [];
        this.redoStack = [];
        this._explosionCleanup = null;

        this.puzzleData = [];
        this.initialGivenMask = [];
        this.hintMask = [];
        this.solutionData = [];
        this.symbolMap = {};
        this.tempSymbols = {};

        // 1. Process URL query parameters for size and difficulty
        this.loadURLParams();

        // 2. Initialize UI with chosen size/difficulty (and inject Undo/Redo UI if needed)
        this.ensureDynamicUIAndStyles();
        this.initUI();
        this.updateSymbolMapDefaults();

        // 3. Generate initial puzzle board
        this.generateNewBoard();

        // 4. Apply post-generation URL preset actions (random words and big hints)
        this.applyURLPostParams();

        // 5. Setup keyboard and input events
        this.bindEvents();
    }

    /**
     * Ensures Undo/Redo buttons and palette highlight CSS exist even if HTML wasn't updated.
     */
    ensureDynamicUIAndStyles() {
        if (!document.getElementById("sudoku-dynamic-styles")) {
            const style = document.createElement("style");
            style.id = "sudoku-dynamic-styles";
            style.textContent = `
                .btn-row { display: flex; gap: 8px; }
                .btn-row button { flex: 1; }
                button:disabled { opacity: 0.5; cursor: not-allowed; }
                .palette-btn.all-used { opacity: 0.55; background-color: #dcdcdc; }
                .palette-btn.peer-conflict {
                    background-color: #ffcdd2 !important;
                    color: #b71c1c !important;
                    border-color: #d32f2f !important;
                    opacity: 1 !important;
                }
                .palette-btn.peer-conflict:hover { background-color: #ef9a9a !important; }
                .palette-btn.active-highlight {
                    background-color: #ffe082 !important;
                    color: #000 !important;
                    border: 2px solid #f57f17 !important;
                    opacity: 1 !important;
                }
                @keyframes solvedBoardPop {
                    0% { transform: scale(0.95); box-shadow: 0 0 0 rgba(46, 125, 50, 0); }
                    50% { transform: scale(1.03); box-shadow: 0 0 32px rgba(46, 125, 50, 0.75); }
                    100% { transform: scale(1); box-shadow: 0 0 0 rgba(46, 125, 50, 0); }
                }
                .solved-pop {
                    animation: solvedBoardPop 0.6s ease-out;
                }
            `;
            document.head.appendChild(style);
        }

        if (!document.getElementById("undo-btn")) {
            const leftPanel = document.querySelector(".left-panel");
            const checkboxLabel = document.querySelector(".checkbox-label");
            if (leftPanel) {
                const btnRow = document.createElement("div");
                btnRow.className = "btn-row";
                btnRow.innerHTML = `
                    <button class="secondary-btn" id="undo-btn" onclick="app.undo()" title="Undo (Ctrl+Z)" disabled>↩️ Undo</button>
                    <button class="secondary-btn" id="redo-btn" onclick="app.redo()" title="Redo (Ctrl+Y)" disabled>↪️ Redo</button>
                `;
                if (checkboxLabel) {
                    leftPanel.insertBefore(btnRow, checkboxLabel);
                } else {
                    leftPanel.appendChild(btnRow);
                }
            }
        }
    }

    loadURLParams() {
        const params = new URLSearchParams(window.location.search);

        const sizeParam = params.get("size");
        if (sizeParam) {
            const targetSize = parseInt(sizeParam, 10);
            for (let key in GRID_SIZES) {
                if (GRID_SIZES[key].size === targetSize) {
                    this.currentSizeName = key;
                    break;
                }
            }
        }

        const diffParam = params.get("difficulty") || params.get("rating");
        if (diffParam) {
            const clean = diffParam.toLowerCase().replace(/[\s\-_]+/g, "");
            for (let key in DIFFICULTIES) {
                if (key.toLowerCase().replace(/[\s\-_]+/g, "") === clean) {
                    this.currentDifficulty = key;
                    break;
                }
            }
        }
    }

    getRandomWordForSize(size) {
        if (size > 16) return null;
        if (size === 16) return "UNCOPYRIGHTABLE!";
        const words = WORD_PRESETS[size];
        if (words && words.length > 0) {
            return words[Math.floor(Math.random() * words.length)].toUpperCase();
        }
        return null;
    }

    applyWordToSymbols(word) {
        const { size } = GRID_SIZES[this.currentSizeName];
        const defaultSymbols = "123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
        const upper = word.toUpperCase();
        for (let num = 1; num <= size; num++) {
            this.symbolMap[num] = (num - 1 < upper.length) ? upper[num - 1] : defaultSymbols[num - 1];
            let input = document.getElementById(`sym-input-${num}`);
            if (input) input.value = this.symbolMap[num];
        }
        this.renderBoardState();
        this.buildPalette();
    }

    applyURLPostParams() {
        const params = new URLSearchParams(window.location.search);
        const { size } = GRID_SIZES[this.currentSizeName];
        const isRandom = (params.get("random") || "").toLowerCase() === "true" || params.get("random") === "1";
        const isBigHint = (params.get("bighint") || "").toLowerCase() === "true" || params.get("bighint") === "1";

        let randomWord = null;
        if (isRandom) {
            randomWord = this.getRandomWordForSize(size);
        }

        if (isBigHint) {
            this.addBigHint(randomWord);
        } else if (isRandom && randomWord) {
            this.applyWordToSymbols(randomWord);
        }
    }

    initUI() {
        const gridRadios = document.getElementById("grid-size-radios");
        gridRadios.innerHTML = "";
        for (let key in GRID_SIZES) {
            let label = document.createElement("label");
            label.innerHTML = `<input type="radio" name="grid-size" value="${key}" ${key === this.currentSizeName ? 'checked' : ''}> ${key}`;
            label.querySelector("input").addEventListener("change", (e) => {
                this.currentSizeName = e.target.value;
                this.onSizeChange();
            });
            gridRadios.appendChild(label);
        }

        const diffRadios = document.getElementById("difficulty-radios");
        diffRadios.innerHTML = "";
        for (let key in DIFFICULTIES) {
            let label = document.createElement("label");
            label.innerHTML = `<input type="radio" name="difficulty" value="${key}" ${key === this.currentDifficulty ? 'checked' : ''}> ${key}`;
            label.querySelector("input").addEventListener("change", (e) => {
                this.currentDifficulty = e.target.value;
                this.onDifficultyChange();
            });
            diffRadios.appendChild(label);
        }

        const cellShapeRadios = document.getElementById("cell-shape-radios");
        cellShapeRadios.innerHTML = "";
        CELL_SHAPES.forEach(shape => {
            let label = document.createElement("label");
            label.innerHTML = `<input type="radio" name="cell-shape" value="${shape}" ${shape === this.currentShape ? 'checked' : ''}> ${shape}`;
            cellShapeRadios.appendChild(label);
        });

        const hintShapeRadios = document.getElementById("hint-shape-radios");
        hintShapeRadios.innerHTML = "";
        [...CELL_SHAPES, "Random"].forEach(shape => {
            let label = document.createElement("label");
            label.innerHTML = `<input type="radio" name="hint-shape" value="${shape}" ${shape === this.currentHintShape ? 'checked' : ''}> ${shape}`;
            hintShapeRadios.appendChild(label);
        });

        this.updateHintDropdown();
        this.updateUndoRedoButtons();
    }

    updateSymbolMapDefaults() {
        const { size } = GRID_SIZES[this.currentSizeName];
        const chars = "123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
        this.symbolMap = {};
        for (let i = 0; i < size; i++) {
            this.symbolMap[i + 1] = chars[i];
        }
    }

    updateHintDropdown() {
        const { size } = GRID_SIZES[this.currentSizeName];
        const select = document.getElementById("hint-technique-select");
        select.innerHTML = "";
        for (let tech in HINT_TECHNIQUES) {
            if (HINT_TECHNIQUES[tech].includes(size)) {
                let opt = document.createElement("option");
                opt.value = tech;
                opt.textContent = tech;
                if (tech === this.selectedHintType) opt.selected = true;
                select.appendChild(opt);
            }
        }
        if (!select.value && select.options.length > 0) {
            this.selectedHintType = select.options[0].value;
            select.selectedIndex = 0;
        }
        select.onchange = (e) => { this.selectedHintType = e.target.value; };
    }

    updateUndoRedoButtons() {
        const undoBtn = document.getElementById("undo-btn");
        const redoBtn = document.getElementById("redo-btn");
        if (undoBtn) undoBtn.disabled = (this.undoStack.length === 0);
        if (redoBtn) redoBtn.disabled = (this.redoStack.length === 0);
    }

    recordMove(r, c, newVal, newGiven, newHint) {
        const prevVal = this.puzzleData[r][c];
        const prevGiven = this.initialGivenMask[r][c];
        const prevHint = this.hintMask[r][c];

        if (prevVal === newVal && prevGiven === newGiven && prevHint === newHint) {
            return;
        }

        this.undoStack.push({
            r,
            c,
            prevVal,
            newVal,
            prevGiven,
            newGiven,
            prevHint,
            newHint
        });
        this.redoStack = [];
        this.updateUndoRedoButtons();
    }

    undo() {
        if (this.undoStack.length === 0) return;
        const step = this.undoStack.pop();
        this.redoStack.push(step);

        this.puzzleData[step.r][step.c] = step.prevVal;
        this.initialGivenMask[step.r][step.c] = step.prevGiven;
        this.hintMask[step.r][step.c] = step.prevHint;

        this.selectedCell = [step.r, step.c];
        this.activeGreenHintCell = null;
        this.highlightedValue = step.prevVal !== 0 ? step.prevVal : null;

        this.updateUndoRedoButtons();
        this.updateStatusBadge();
        this.renderBoardState();
    }

    redo() {
        if (this.redoStack.length === 0) return;
        const step = this.redoStack.pop();
        this.undoStack.push(step);

        this.puzzleData[step.r][step.c] = step.newVal;
        this.initialGivenMask[step.r][step.c] = step.newGiven;
        this.hintMask[step.r][step.c] = step.newHint;

        this.selectedCell = [step.r, step.c];
        this.activeGreenHintCell = null;
        this.highlightedValue = step.newVal !== 0 ? step.newVal : null;

        this.updateUndoRedoButtons();
        this.updateStatusBadge();
        this.renderBoardState();
        this.checkBoardSolved();
    }

    onDifficultyChange() {
        if (this.currentDifficulty !== "Symbol") {
            this.currentHintShape = "Random";
        }
        this.generateNewBoard();
    }

    onSizeChange() {
        this.selectedCell = null;
        this.activeGreenHintCell = null;
        this.highlightedValue = null;
        this.bigHintCells.clear();
        this.updateSymbolMapDefaults();
        this.updateHintDropdown();
        this.generateNewBoard();
    }

    updateStatusBadge(hintText = null) {
        const badge = document.getElementById("status-badge");
        badge.className = "status-badge";

        let uniqStr = this.isUniqueGuaranteed ? "✅ Unique Solution: Guaranteed 1 valid solution." : "⚠️ Board Notice: Multiple valid solutions may exist.";

        if (hintText) {
            badge.classList.add("info");
            badge.textContent = `${uniqStr}\n\n💡 Hint Explanation:\n${hintText}`;
        } else {
            if (this.isUniqueGuaranteed) {
                badge.textContent = "✅ Unique Solution\n\nGuaranteed exactly 1 valid solution.";
            } else {
                badge.classList.add("warning");
                badge.textContent = "⚠️ Board Notice\n\nShape mask applied; multiple valid solutions may exist.";
            }
        }
    }

    generateNewBoard() {
        if (this._explosionCleanup) {
            this._explosionCleanup();
        }

        this.selectedCell = null;
        this.activeGreenHintCell = null;
        this.highlightedValue = null;
        this.bigHintCells.clear();
        this.undoStack = [];
        this.redoStack = [];
        this.updateUndoRedoButtons();

        const { size, boxH, boxW } = GRID_SIZES[this.currentSizeName];
        const ratio = DIFFICULTIES[this.currentDifficulty];

        let activeHintShape = this.currentHintShape;
        if (this.currentDifficulty === "Symbol" && activeHintShape === "Random") {
            activeHintShape = CELL_SHAPES[Math.floor(Math.random() * CELL_SHAPES.length)];
        }

        const gen = SudokuGenerator.generate(size, boxH, boxW, ratio, activeHintShape, this.currentDifficulty);
        this.puzzleData = gen.puzzle;
        this.solutionData = gen.solution;
        this.isUniqueGuaranteed = gen.uniqueGuaranteed;

        this.initialGivenMask = Array.from({ length: size }, (_, r) =>
            Array.from({ length: size }, (_, c) => this.puzzleData[r][c] !== 0)
        );
        this.hintMask = Array.from({ length: size }, () => Array(size).fill(false));

        this.updateStatusBadge();
        this.buildGuiGrid();
    }

    giveHint() {
        const { size, boxH, boxW } = GRID_SIZES[this.currentSizeName];
        let hintResult = null;

        const techFuncs = {
            "The 45 Rule": HintEngine.find45Rule,
            "Naked Single": HintEngine.findNakedSingle,
            "Hidden Single": HintEngine.findHiddenSingle,
            "Cross-Hatching": HintEngine.findCrossHatching,
            "Naked Pair": HintEngine.findNakedPair,
            "Pointing Pair": HintEngine.findPointingPair,
        };

        if (techFuncs[this.selectedHintType]) {
            hintResult = techFuncs[this.selectedHintType](this.puzzleData, size, boxH, boxW, this.symbolMap);
        } else {
            for (let techName in techFuncs) {
                if (HINT_TECHNIQUES[techName].includes(size)) {
                    hintResult = techFuncs[techName](this.puzzleData, size, boxH, boxW, this.symbolMap);
                    if (hintResult) break;
                }
            }
        }

        if (hintResult) {
            const { r, c, msg } = hintResult;
            let actualVal = this.solutionData[r][c];
            this.recordMove(r, c, actualVal, this.initialGivenMask[r][c], true);
            this.puzzleData[r][c] = actualVal;
            this.hintMask[r][c] = true;
            this.selectedCell = [r, c];
            this.activeGreenHintCell = [r, c];
            this.highlightedValue = null;

            this.renderBoardState();
            this.updateStatusBadge(msg);
            this.checkBoardSolved();
        } else {
            let unsolvedCells = [];
            for (let r = 0; r < size; r++) {
                for (let c = 0; c < size; c++) {
                    if (this.puzzleData[r][c] !== this.solutionData[r][c]) unsolvedCells.push([r, c]);
                }
            }
            if (unsolvedCells.length === 0) {
                this.updateStatusBadge("The puzzle is already complete!");
                this.playVictoryExplosion();
                return;
            }

            if (this.selectedHintType !== "Auto / Any Available") {
                if (!confirm(`No active '${this.selectedHintType}' opportunities were found in the current board state.\n\nWould you like a general solution hint for an open cell instead?`)) {
                    return;
                }
            }

            let [r, c] = unsolvedCells[Math.floor(Math.random() * unsolvedCells.length)];
            let actualVal = this.solutionData[r][c];
            let sym = this.symbolMap[actualVal] || String(actualVal);

            this.recordMove(r, c, actualVal, this.initialGivenMask[r][c], true);
            this.puzzleData[r][c] = actualVal;
            this.hintMask[r][c] = true;
            this.selectedCell = [r, c];
            this.activeGreenHintCell = [r, c];
            this.highlightedValue = null;

            this.renderBoardState();
            this.updateStatusBadge(`Revealed candidate symbol '${sym}' at Row ${r+1}, Col ${c+1}.`);
            this.checkBoardSolved();
        }
    }

    getCellSize(size) {
        if (size > 9) {
            let targetDim = size <= 16 ? 650 : 720;
            return Math.max(24, Math.min(48, Math.floor(targetDim / size)));
        } else {
            return Math.max(28, Math.min(48, Math.floor(450 / size)));
        }
    }

    buildGuiGrid() {
        const gridContainer = document.getElementById("sudoku-grid");
        gridContainer.innerHTML = "";

        const { size, boxH, boxW } = GRID_SIZES[this.currentSizeName];
        const cellSize = this.getCellSize(size);

        gridContainer.style.gridTemplateColumns = `repeat(${size / boxW}, auto)`;

        this.cellCanvases = Array.from({ length: size }, () => Array(size).fill(null));

        for (let br = 0; br < size / boxH; br++) {
            for (let bc = 0; bc < size / boxW; bc++) {
                let boxFrame = document.createElement("div");
                boxFrame.className = "box-frame";
                boxFrame.style.gridTemplateColumns = `repeat(${boxW}, auto)`;
                boxFrame.style.gap = "1px";
                boxFrame.style.marginRight = (bc < (size / boxW) - 1) ? "2px" : "0";
                boxFrame.style.marginBottom = (br < (size / boxH) - 1) ? "2px" : "0";

                for (let rIn = 0; rIn < boxH; rIn++) {
                    for (let cIn = 0; cIn < boxW; cIn++) {
                        let r = br * boxH + rIn;
                        let c = bc * boxW + cIn;

                        let canvas = document.createElement("canvas");
                        canvas.className = "cell-canvas";
                        canvas.width = cellSize;
                        canvas.height = cellSize;

                        canvas.addEventListener("click", () => this.selectCell(r, c));
                        this.cellCanvases[r][c] = canvas;
                        boxFrame.appendChild(canvas);
                    }
                }
                gridContainer.appendChild(boxFrame);
            }
        }

        this.buildPalette();
        this.renderBoardState();
    }

    /**
     * Returns a Set of values (1..size) assigned in the given cell's row, column, or box.
     */
    getAssignedPeerValues(r, c) {
        const { size, boxH, boxW } = GRID_SIZES[this.currentSizeName];
        const assigned = new Set();

        for (let i = 0; i < size; i++) {
            if (this.puzzleData[r][i] !== 0) assigned.add(this.puzzleData[r][i]);
            if (this.puzzleData[i][c] !== 0) assigned.add(this.puzzleData[i][c]);
        }

        const startRow = Math.floor(r / boxH) * boxH;
        const startCol = Math.floor(c / boxW) * boxW;
        for (let rr = startRow; rr < startRow + boxH; rr++) {
            for (let cc = startCol; cc < startCol + boxW; cc++) {
                if (this.puzzleData[rr][cc] !== 0) assigned.add(this.puzzleData[rr][cc]);
            }
        }

        return assigned;
    }

    /**
     * Clicking a palette button highlights matching characters on the board,
     * and if an editable empty cell is currently selected, also inputs the value into that cell.
     */
    onPaletteSymbolClick(val) {
        if (this.selectedCell) {
            const [r, c] = this.selectedCell;
            const canEdit = !this.initialGivenMask[r][c] || this.allowModifyGivens;
            if (canEdit && this.puzzleData[r][c] === 0) {
                this.inputValue(val, true);
                return;
            }
        }
        this.highlightedValue = val;
        this.activeGreenHintCell = null;
        this.renderBoardState();
    }

    buildPalette() {
        const paletteContainer = document.getElementById("palette-buttons");
        paletteContainer.innerHTML = "";

        const { size } = GRID_SIZES[this.currentSizeName];

        // Count current occurrences of each value on the board
        const counts = {};
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                let val = this.puzzleData[r][c];
                if (val !== 0) {
                    counts[val] = (counts[val] || 0) + 1;
                }
            }
        }

        // If an empty cell is selected, find all values assigned in its row, column, or box
        let peerAssigned = null;
        if (this.selectedCell) {
            const [sr, sc] = this.selectedCell;
            if (this.puzzleData[sr][sc] === 0) {
                peerAssigned = this.getAssignedPeerValues(sr, sc);
            }
        }

        for (let val = 1; val <= size; val++) {
            let sym = this.symbolMap[val] || String(val);
            let btn = document.createElement("button");
            btn.className = "palette-btn";
            btn.textContent = sym;

            if ((counts[val] || 0) >= size) {
                btn.classList.add("all-used");
                btn.title = `All ${size} instance(s) of '${sym}' are on the board (Click to highlight).`;
            }

            if (peerAssigned && peerAssigned.has(val)) {
                btn.classList.add("peer-conflict");
                btn.title = `'${sym}' is already assigned in the selected cell's row, column, or group.`;
            }

            if (this.highlightedValue === val) {
                btn.classList.add("active-highlight");
            }

            btn.onclick = () => this.onPaletteSymbolClick(val);
            paletteContainer.appendChild(btn);
        }

        let clearBtn = document.createElement("button");
        clearBtn.className = "palette-btn";
        clearBtn.style.minWidth = "60px";
        clearBtn.textContent = "⌫ Clear";
        clearBtn.onclick = () => this.inputValue(0);
        paletteContainer.appendChild(clearBtn);
    }

    selectCell(r, c) {
        this.selectedCell = [r, c];
        if (this.activeGreenHintCell && (this.activeGreenHintCell[0] !== r || this.activeGreenHintCell[1] !== c)) {
            this.activeGreenHintCell = null;
            this.updateStatusBadge();
        }

        // Clicking a cell with a character already assigned highlights matching characters in the puzzle;
        // clicking an empty cell clears the matching highlight and highlights conflicting palette buttons red.
        if (this.puzzleData[r][c] !== 0) {
            this.highlightedValue = this.puzzleData[r][c];
        } else {
            this.highlightedValue = null;
        }

        this.renderBoardState();
    }

    inputValue(value, keepHighlight = false) {
        if (!this.selectedCell) return;
        let [r, c] = this.selectedCell;

        if (this.initialGivenMask[r][c] && !this.allowModifyGivens) return;

        const newGiven = this.allowModifyGivens ? (value !== 0) : this.initialGivenMask[r][c];
        this.recordMove(r, c, value, newGiven, false);

        this.puzzleData[r][c] = value;
        if (this.allowModifyGivens) {
            this.initialGivenMask[r][c] = newGiven;
        }
        this.hintMask[r][c] = false;
        this.activeGreenHintCell = null;
        this.highlightedValue = (keepHighlight && value !== 0) ? value : null;

        this.updateStatusBadge();
        this.renderBoardState();
        this.checkBoardSolved();
    }

    moveToNextCell() {
        const { size } = GRID_SIZES[this.currentSizeName];
        let curIdx = this.selectedCell ? (this.selectedCell[0] * size + this.selectedCell[1]) : -1;

        for (let i = 1; i <= size * size; i++) {
            let nextIdx = (curIdx + i) % (size * size);
            let nr = Math.floor(nextIdx / size);
            let nc = nextIdx % size;
            if (!this.initialGivenMask[nr][nc] || this.allowModifyGivens) {
                this.selectCell(nr, nc);
                break;
            }
        }
    }

    applySpaceHint() {
        if (!this.selectedCell) return;
        let [r, c] = this.selectedCell;
        if (this.initialGivenMask[r][c] && !this.allowModifyGivens) return;

        let correctVal = this.solutionData[r][c];
        let sym = this.symbolMap[correctVal] || String(correctVal);

        this.recordMove(r, c, correctVal, this.initialGivenMask[r][c], true);
        this.puzzleData[r][c] = correctVal;
        this.hintMask[r][c] = true;
        this.activeGreenHintCell = [r, c];
        this.highlightedValue = null;

        this.updateStatusBadge(`Spacebar Hint:\nFilled Row ${r+1}, Col ${c+1} with correct symbol '${sym}'.`);
        this.renderBoardState();
        this.checkBoardSolved();
    }

    bindEvents() {
        window.addEventListener("keydown", (e) => {
            if (e.target && e.target.tagName === "INPUT" && e.target.type === "text") {
                return;
            }

            if (e.ctrlKey || e.metaKey) {
                const lowerKey = e.key.toLowerCase();
                if (lowerKey === "z") {
                    e.preventDefault();
                    if (e.shiftKey) {
                        this.redo();
                    } else {
                        this.undo();
                    }
                    return;
                }
                if (lowerKey === "y") {
                    e.preventDefault();
                    this.redo();
                    return;
                }
                return;
            }

            if (e.altKey) return;

            let key = e.key.toUpperCase();

            if (["TAB", "ENTER"].includes(key)) {
                e.preventDefault();
                this.moveToNextCell();
                return;
            }

            if (e.code === "Space") {
                e.preventDefault();
                this.applySpaceHint();
                return;
            }

            if (!this.selectedCell) return;
            let [r, c] = this.selectedCell;
            if (this.initialGivenMask[r][c] && !this.allowModifyGivens) return;

            if (["BACKSPACE", "DELETE"].includes(key)) {
                this.inputValue(0);
                return;
            }

            const { size } = GRID_SIZES[this.currentSizeName];
            for (let num = 1; num <= size; num++) {
                let sym = (this.symbolMap[num] || "").toUpperCase();
                if (key === sym) {
                    this.inputValue(num);
                    return;
                }
            }
        });
    }

    isConflict(r, c) {
        let val = this.puzzleData[r][c];
        if (val === 0) return false;

        const { size, boxH, boxW } = GRID_SIZES[this.currentSizeName];

        for (let col = 0; col < size; col++) {
            if (col !== c && this.puzzleData[r][col] === val) return true;
        }

        for (let row = 0; row < size; row++) {
            if (row !== r && this.puzzleData[row][c] === val) return true;
        }

        let startRow = Math.floor(r / boxH) * boxH;
        let startCol = Math.floor(c / boxW) * boxW;
        for (let row = startRow; row < startRow + boxH; row++) {
            for (let col = startCol; col < startCol + boxW; col++) {
                if ((row !== r || col !== c) && this.puzzleData[row][col] === val) return true;
            }
        }
        return false;
    }

    renderBoardState() {
        const { size } = GRID_SIZES[this.currentSizeName];
        const cellSize = this.getCellSize(size);
        const fontSize = Math.max(8, Math.floor(cellSize * 0.45));

        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                let val = this.puzzleData[r][c];
                let symbolText = (val !== 0) ? (this.symbolMap[val] || "") : "";
                let canvas = this.cellCanvases[r][c];
                let ctx = canvas.getContext("2d");

                ctx.clearRect(0, 0, cellSize, cellSize);

                let isGiven = this.initialGivenMask[r][c];
                let isHint = this.hintMask[r][c];
                let isSelected = this.selectedCell && this.selectedCell[0] === r && this.selectedCell[1] === c;
                let isInvalid = this.isConflict(r, c);
                let isActiveGreenHint = this.activeGreenHintCell && this.activeGreenHintCell[0] === r && this.activeGreenHintCell[1] === c;
                let isBigHint = Array.from(this.bigHintCells).some(([br, bc]) => br === r && bc === c);
                let isMatchingHighlight = (this.highlightedValue !== null && val !== 0 && val === this.highlightedValue);

                let bgColor = "#ffffff";
                let fgColor = "#1565c0";
                let fontWeight = "normal";

                if (isActiveGreenHint) {
                    bgColor = "#e8f5e9"; fgColor = "#2e7d32"; fontWeight = "bold";
                } else if (isInvalid) {
                    bgColor = !isSelected ? "#ffcdd2" : "#ef9a9a"; fgColor = "#b71c1c"; fontWeight = "bold";
                } else if (isMatchingHighlight) {
                    bgColor = "#ffe082"; fgColor = "#000000"; fontWeight = "bold";
                } else if (isSelected) {
                    bgColor = "#bbdefb"; fgColor = "#000000"; fontWeight = "bold";
                } else if (isBigHint) {
                    bgColor = "#b3e5fc"; fgColor = "#000000"; fontWeight = "bold";
                } else if (isGiven) {
                    bgColor = "#e8f0fe"; fgColor = "#000000"; fontWeight = "bold";
                } else if (isHint) {
                    bgColor = "#fff9c4"; fgColor = "#d97706"; fontWeight = "bold";
                }

                let borderColor = isActiveGreenHint
                    ? "#2e7d32"
                    : (isSelected ? "#0056b3" : (isInvalid ? "#d32f2f" : (isMatchingHighlight ? "#f57f17" : "#888888")));

                this.drawShape(ctx, this.currentShape, cellSize, bgColor, borderColor);

                if (symbolText) {
                    ctx.fillStyle = fgColor;
                    ctx.font = `${fontWeight} ${fontSize}px Consolas, monospace`;
                    ctx.textAlign = "center";
                    ctx.textBaseline = "middle";
                    ctx.fillText(symbolText, cellSize / 2, cellSize / 2);
                }
            }
        }
        this.buildPalette();
    }

    drawShape(ctx, shape, s, bgColor, borderColor) {
        let pad = 2;
        let x1 = pad, y1 = pad, x2 = s - pad, y2 = s - pad;
        let w = x2 - x1, h = y2 - y1;
        let xc = (x1 + x2) / 2, yc = (y1 + y2) / 2;

        ctx.fillStyle = bgColor;
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = ["#0056b3", "#d32f2f", "#2e7d32", "#f57f17"].includes(borderColor) ? 2.0 : 1.5;

        ctx.beginPath();
        if (shape === "Circle") {
            ctx.arc(xc, yc, w / 2, 0, 2 * Math.PI);
        } else if (shape === "Diamond") {
            ctx.moveTo(xc, y1); ctx.lineTo(x2, yc); ctx.lineTo(xc, y2); ctx.lineTo(x1, yc); ctx.closePath();
        } else if (shape === "Triangle") {
            ctx.moveTo(xc, y1); ctx.lineTo(x2, y2); ctx.lineTo(x1, y2); ctx.closePath();
        } else if (shape === "Plus") {
            let coords = [[0.35, 0.05], [0.65, 0.05], [0.65, 0.35], [0.95, 0.35], [0.95, 0.65], [0.65, 0.65], [0.65, 0.95], [0.35, 0.95], [0.35, 0.65], [0.05, 0.65], [0.05, 0.35], [0.35, 0.35]];
            coords.forEach(([rx, ry], i) => {
                let px = x1 + rx * w, py = y1 + ry * h;
                if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
            });
            ctx.closePath();
        } else if (shape === "X") {
            let coords = [[0.05, 0.25], [0.25, 0.05], [0.50, 0.30], [0.75, 0.05], [0.95, 0.25], [0.70, 0.50], [0.95, 0.75], [0.75, 0.95], [0.50, 0.70], [0.25, 0.95], [0.05, 0.75], [0.30, 0.50]];
            coords.forEach(([rx, ry], i) => {
                let px = x1 + rx * w, py = y1 + ry * h;
                if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
            });
            ctx.closePath();
        } else if (shape === "Star") {
            for (let i = 0; i < 10; i++) {
                let r = (i % 2 === 0) ? (w / 2 * 0.95) : (w / 2 * 0.42);
                let angle = -Math.PI / 2 + i * (Math.PI / 5);
                let px = xc + r * Math.cos(angle), py = yc + r * Math.sin(angle);
                if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
            }
            ctx.closePath();
        } else if (shape === "Heart") {
            let steps = 40;
            for (let i = 0; i < steps; i++) {
                let t = 2 * Math.PI * i / steps;
                let hx = 16 * (Math.sin(t) ** 3);
                let hy = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
                let px = xc + (hx / 16.5) * (w / 2 * 0.92);
                let py = yc + (hy / 17.5) * (h / 2 * 0.92) + h * 0.03;
                if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
            }
            ctx.closePath();
        } else { // Square
            ctx.rect(x1, y1, w, h);
        }

        ctx.fill();
        ctx.stroke();
    }

    /**
     * Checks if every cell on the board is filled and has no Sudoku rule conflicts.
     */
    checkBoardSolved() {
        const { size } = GRID_SIZES[this.currentSizeName];
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                if (this.puzzleData[r][c] === 0 || this.isConflict(r, c)) {
                    return false;
                }
            }
        }

        this.selectedCell = null;
        this.activeGreenHintCell = null;
        this.highlightedValue = null;
        this.renderBoardState();
        this.updateStatusBadge("🎉 Congratulations! You solved the Sudoku puzzle correctly!");
        this.playVictoryExplosion();
        return true;
    }

    /**
     * Explodes the puzzle cells outward with celebratory particles and shockwaves,
     * then smoothly reassembles and reveals the completed solved puzzle on the board.
     */
    playVictoryExplosion() {
        if (this._explosionCleanup) {
            this._explosionCleanup();
        }

        const gridEl = document.getElementById("sudoku-grid");
        if (!gridEl) return;

        const { size } = GRID_SIZES[this.currentSizeName];
        const gridRect = gridEl.getBoundingClientRect();
        const centerX = gridRect.left + gridRect.width / 2;
        const centerY = gridRect.top + gridRect.height / 2;

        const overlay = document.createElement("canvas");
        overlay.width = window.innerWidth;
        overlay.height = window.innerHeight;
        overlay.style.cssText = "position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:9999;pointer-events:auto;cursor:pointer;";
        document.body.appendChild(overlay);
        const ctx = overlay.getContext("2d");

        // Capture each cell's rendered canvas & screen coordinates
        const tiles = [];
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                const cellCanvas = this.cellCanvases[r][c];
                if (!cellCanvas) continue;
                const rect = cellCanvas.getBoundingClientRect();
                const homeX = rect.left + rect.width / 2;
                const homeY = rect.top + rect.height / 2;

                const dx = homeX - centerX;
                const dy = homeY - centerY;
                const dist = Math.hypot(dx, dy) || 1;
                const angle = Math.atan2(dy, dx) + (Math.random() - 0.5) * 0.5;
                const speed = (6.0 + Math.random() * 9.5) * (0.55 + dist / Math.max(120, gridRect.width * 0.5));

                const snap = document.createElement("canvas");
                snap.width = cellCanvas.width;
                snap.height = cellCanvas.height;
                snap.getContext("2d").drawImage(cellCanvas, 0, 0);

                tiles.push({
                    img: snap,
                    w: rect.width,
                    h: rect.height,
                    homeX,
                    homeY,
                    x: homeX,
                    y: homeY,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed - (3.0 + Math.random() * 4.0),
                    rot: 0,
                    vRot: (Math.random() - 0.5) * 0.32,
                    scale: 1,
                    vScale: 0.008 + Math.random() * 0.012,
                    peakX: homeX,
                    peakY: homeY,
                    peakRot: 0,
                    peakScale: 1
                });
            }
        }

        // Celebratory firework/explosion sparks
        const colors = ["#ffd54f", "#ffca28", "#4fc3f7", "#81c784", "#ff8a65", "#ba68c8", "#ff5252", "#ffffff"];
        const sparks = Array.from({ length: 180 }, () => {
            const ang = Math.random() * Math.PI * 2;
            const spd = 4 + Math.random() * 16;
            return {
                x: centerX + (Math.random() - 0.5) * (gridRect.width * 0.35),
                y: centerY + (Math.random() - 0.5) * (gridRect.height * 0.35),
                vx: Math.cos(ang) * spd,
                vy: Math.sin(ang) * spd - 3.5,
                radius: 3 + Math.random() * 5.5,
                color: colors[(Math.random() * colors.length) | 0],
                alpha: 1
            };
        });

        // Hide the static DOM grid while its tiles explode on the overlay
        gridEl.style.visibility = "hidden";

        const explodeDuration = 1350;
        const reassembleDuration = 850;
        const totalDuration = explodeDuration + reassembleDuration;
        let startTime = null;
        let currentElapsed = 0;
        let peakCaptured = false;
        let rafId = null;

        const finishAnimation = () => {
            if (rafId) cancelAnimationFrame(rafId);
            if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
            gridEl.style.visibility = "visible";
            gridEl.classList.remove("solved-pop");
            void gridEl.offsetWidth;
            gridEl.classList.add("solved-pop");
            this._explosionCleanup = null;
        };

        this._explosionCleanup = finishAnimation;
        overlay.addEventListener("click", () => {
            if (currentElapsed > 450) {
                finishAnimation();
            }
        });

        const animate = (now) => {
            if (startTime === null) startTime = now;
            const elapsed = now - startTime;
            currentElapsed = elapsed;

            if (elapsed >= totalDuration) {
                finishAnimation();
                return;
            }

            ctx.clearRect(0, 0, overlay.width, overlay.height);

            // Darken backdrop so exploding puzzle cells & sparks stand out vividly
            let backdropAlpha = 0.72;
            if (elapsed > explodeDuration) {
                const reassembleProgress = (elapsed - explodeDuration) / reassembleDuration;
                backdropAlpha = 0.72 * (1 - reassembleProgress);
            }
            ctx.fillStyle = `rgba(15, 23, 42, ${backdropAlpha})`;
            ctx.fillRect(0, 0, overlay.width, overlay.height);

            if (elapsed < explodeDuration) {
                // Phase 1: Puzzle Explosion
                const progress = elapsed / explodeDuration;

                // Initial bright core flash & shockwave rings
                if (progress < 0.5) {
                    const ringProgress = progress / 0.5;
                    const maxRad = Math.max(gridRect.width, gridRect.height) * 0.95;

                    ctx.save();
                    ctx.beginPath();
                    ctx.arc(centerX, centerY, ringProgress * maxRad, 0, Math.PI * 2);
                    ctx.strokeStyle = `rgba(255, 215, 64, ${1 - ringProgress})`;
                    ctx.lineWidth = 8 * (1 - ringProgress);
                    ctx.stroke();

                    ctx.beginPath();
                    ctx.arc(centerX, centerY, ringProgress * maxRad * 0.65, 0, Math.PI * 2);
                    ctx.strokeStyle = `rgba(79, 195, 247, ${(1 - ringProgress) * 0.85})`;
                    ctx.lineWidth = 5 * (1 - ringProgress);
                    ctx.stroke();
                    ctx.restore();
                }

                for (let t of tiles) {
                    t.x += t.vx;
                    t.y += t.vy;
                    t.vy += 0.24; // Gravity
                    t.vx *= 0.99;
                    t.rot += t.vRot;
                    t.scale = Math.min(1.35, t.scale + t.vScale);

                    ctx.save();
                    ctx.translate(t.x, t.y);
                    ctx.rotate(t.rot);
                    ctx.scale(t.scale, t.scale);
                    ctx.shadowColor = "rgba(0, 0, 0, 0.45)";
                    ctx.shadowBlur = 10;
                    ctx.drawImage(t.img, -t.w / 2, -t.h / 2, t.w, t.h);
                    ctx.strokeStyle = "#ffd54f";
                    ctx.lineWidth = 1.5;
                    ctx.strokeRect(-t.w / 2, -t.h / 2, t.w, t.h);
                    ctx.restore();
                }
            } else {
                // Phase 2: Reassemble back into the solved puzzle
                if (!peakCaptured) {
                    peakCaptured = true;
                    for (let t of tiles) {
                        t.peakX = t.x;
                        t.peakY = t.y;
                        t.peakRot = t.rot;
                        t.peakScale = t.scale;
                    }
                }

                const tNorm = Math.min(1, (elapsed - explodeDuration) / reassembleDuration);
                const ease = 1 - Math.pow(1 - tNorm, 3); // Cubic ease-out

                for (let t of tiles) {
                    const curX = t.peakX + (t.homeX - t.peakX) * ease;
                    const curY = t.peakY + (t.homeY - t.peakY) * ease;
                    const curRot = t.peakRot * (1 - ease);
                    const curScale = t.peakScale + (1 - t.peakScale) * ease;

                    ctx.save();
                    ctx.translate(curX, curY);
                    ctx.rotate(curRot);
                    ctx.scale(curScale, curScale);
                    ctx.shadowColor = `rgba(0, 0, 0, ${0.4 * (1 - ease)})`;
                    ctx.shadowBlur = 8 * (1 - ease);
                    ctx.drawImage(t.img, -t.w / 2, -t.h / 2, t.w, t.h);
                    ctx.restore();
                }
            }

            // Update & render celebratory sparks
            for (let s of sparks) {
                s.x += s.vx;
                s.y += s.vy;
                s.vy += 0.2;
                s.alpha = Math.max(0, 1 - elapsed / totalDuration);

                ctx.save();
                ctx.globalAlpha = s.alpha;
                ctx.fillStyle = s.color;
                ctx.shadowColor = s.color;
                ctx.shadowBlur = 6;
                ctx.beginPath();
                ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }

            // Celebratory banner text at the top of the board area
            const bannerAlpha = elapsed < explodeDuration
                ? Math.min(1, elapsed / 220)
                : Math.max(0, 1 - (elapsed - explodeDuration) / reassembleDuration);
            if (bannerAlpha > 0.02) {
                ctx.save();
                ctx.globalAlpha = bannerAlpha;
                ctx.font = "bold 36px Arial, Helvetica, sans-serif";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.shadowColor = "rgba(0, 0, 0, 0.7)";
                ctx.shadowBlur = 12;
                ctx.fillStyle = "#ffd54f";
                ctx.fillText("🎉 PUZZLE SOLVED! 🎉", centerX, Math.max(48, gridRect.top - 28));
                ctx.restore();
            }

            rafId = requestAnimationFrame(animate);
        };

        rafId = requestAnimationFrame(animate);
    }

    solvePuzzle() {
        this.puzzleData = this.solutionData.map(row => [...row]);
        this.selectedCell = null;
        this.activeGreenHintCell = null;
        this.highlightedValue = null;
        this.renderBoardState();
        this.updateStatusBadge("🎉 Congratulations! You solved the Sudoku puzzle correctly!");
        this.playVictoryExplosion();
    }

    verifyUniqueSolution() {
        const { size, boxH, boxW } = GRID_SIZES[this.currentSizeName];

        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                if (this.puzzleData[r][c] !== 0 && this.isConflict(r, c)) {
                    alert("❌ No solutions exist for the current grid state!\n\nReason: There are conflicting values violating Sudoku rules on the board.");
                    return;
                }
            }
        }

        let boardCopy = this.puzzleData.map(row => [...row]);
        let stats = { initialEmpty: 0, preFilled: 0, symmetryReason: null };
        let count = SudokuGenerator.countSolutions(boardCopy, size, boxH, boxW, 2, {
            knownSolution: this.solutionData,
            stats
        });

        this.isUniqueGuaranteed = (count === 1);
        this.updateStatusBadge();

        let details = stats.symmetryReason
            ? `\n\nPre-Check Triggered: ${stats.symmetryReason}`
            : `\n\nRule Pre-Fill: ${stats.preFilled} of ${stats.initialEmpty} empty cell(s) resolved deterministically via Naked/Hidden Singles, Pointing Pairs, and Naked Pairs.`;

        let msg = (count === 0) ? `❌ No valid solutions exist for the current board state.${details}` :
                  (count === 1) ? `✅ Exactly ONE unique solution exists for the current board state!${details}` :
                                  `⚠️ MULTIPLE valid solutions exist for the current board state.${details}`;

        alert(msg);
    }

    // Modal Control Methods
    openShapeModal() {
        document.getElementById("shape-modal").classList.add("active");
    }

    closeShapeModal() {
        document.getElementById("shape-modal").classList.remove("active");
    }

    applyShapeModal() {
        const selectedCellShape = document.querySelector('input[name="cell-shape"]:checked').value;
        const selectedHintShape = document.querySelector('input[name="hint-shape"]:checked').value;

        let hintShapeChanged = selectedHintShape !== this.currentHintShape;
        this.currentShape = selectedCellShape;
        this.currentHintShape = selectedHintShape;

        if (this.currentHintShape !== "Random") {
            this.currentDifficulty = "Symbol";
            let diffRadio = document.querySelector(`input[name="difficulty"][value="Symbol"]`);
            if (diffRadio) diffRadio.checked = true;
        }

        this.closeShapeModal();

        if (hintShapeChanged || this.currentDifficulty === "Symbol") {
            this.generateNewBoard();
        } else {
            this.renderBoardState();
        }
    }

    openSymbolModal() {
        const { size } = GRID_SIZES[this.currentSizeName];
        document.getElementById("use-numbers-btn").style.display = [4, 6, 9].includes(size) ? "none" : "inline-block";

        const presetList = document.getElementById("preset-list");
        presetList.innerHTML = "";
        const words = size <= 16 ? (WORD_PRESETS[size] || []) : [];

        if (words.length > 0) {
            words.forEach(word => {
                let item = document.createElement("div");
                item.className = "preset-item";
                item.textContent = word;
                item.onclick = () => {
                    document.querySelectorAll(".preset-item").forEach(el => el.classList.remove("selected"));
                    item.classList.add("selected");
                    this.applyWordPreset(word);
                };
                presetList.appendChild(item);
            });
        } else {
            presetList.innerHTML = `<div class="preset-item">(None available)</div>`;
        }

        const entries = document.getElementById("symbol-entries");
        entries.innerHTML = "";
        this.tempSymbols = { ...this.symbolMap };

        for (let num = 1; num <= size; num++) {
            let row = document.createElement("div");
            row.className = "symbol-row";
            row.innerHTML = `<label style="width:70px;">Value ${num}:</label><input type="text" id="sym-input-${num}" value="${this.tempSymbols[num] || num}">`;
            entries.appendChild(row);
        }

        document.getElementById("symbol-modal").classList.add("active");
    }

    closeSymbolModal() {
        document.getElementById("symbol-modal").classList.remove("active");
    }

    applyWordPreset(word) {
        const { size } = GRID_SIZES[this.currentSizeName];
        const upper = word.toUpperCase();
        for (let num = 1; num <= size; num++) {
            let input = document.getElementById(`sym-input-${num}`);
            if (input && num - 1 < upper.length) {
                input.value = upper[num - 1];
            }
        }
    }

    resetSymbolsDefault() {
        const { size } = GRID_SIZES[this.currentSizeName];
        const chars = "123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
        for (let num = 1; num <= size; num++) {
            let input = document.getElementById(`sym-input-${num}`);
            if (input) input.value = chars[num - 1];
        }
    }

    useAlphabetSymbols() {
        const { size } = GRID_SIZES[this.currentSizeName];
        const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        for (let num = 1; num <= size; num++) {
            let input = document.getElementById(`sym-input-${num}`);
            if (input) {
                input.value = num <= 26 ? alphabet[num - 1] : `A${alphabet[num - 27]}`;
            }
        }
    }

    useNumericSymbols() {
        const { size } = GRID_SIZES[this.currentSizeName];
        for (let num = 1; num <= size; num++) {
            let input = document.getElementById(`sym-input-${num}`);
            if (input) input.value = String(num);
        }
    }

    addBigHint(presetWord = null) {
        const { size } = GRID_SIZES[this.currentSizeName];
        const defaultSymbols = "123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
        const modalOpen = document.getElementById("symbol-modal").classList.contains("active");

        let selectedPreset = modalOpen ? document.querySelector(".preset-item.selected") : null;
        let symbols = [];

        if (presetWord && size <= 16) {
            let word = presetWord.toUpperCase();
            symbols = Array.from({ length: size }, (_, i) => i < word.length ? word[i] : defaultSymbols[i]);
        } else if (selectedPreset && size <= 16) {
            let word = selectedPreset.textContent.toUpperCase();
            symbols = Array.from({ length: size }, (_, i) => i < word.length ? word[i] : defaultSymbols[i]);
        } else {
            let currentSymbols = [];
            for (let i = 1; i <= size; i++) {
                let input = document.getElementById(`sym-input-${i}`);
                currentSymbols.push(input ? input.value.trim() : (this.symbolMap[i] || defaultSymbols[i - 1]));
            }
            let isDefault = currentSymbols.every((val, idx) => val === defaultSymbols[idx]);

            if (isDefault && size <= 16) {
                let word = this.getRandomWordForSize(size);
                symbols = word
                    ? Array.from({ length: size }, (_, i) => i < word.length ? word[i] : defaultSymbols[i])
                    : currentSymbols;
            } else {
                symbols = currentSymbols;
            }
        }

        let choice = ["top_row", "middle_row", "center_col"][Math.floor(Math.random() * 3)];
        let lineCells = [];
        if (choice === "top_row") {
            for (let c = 0; c < size; c++) lineCells.push([0, c]);
        } else if (choice === "middle_row") {
            for (let c = 0; c < size; c++) lineCells.push([Math.floor(size / 2), c]);
        } else {
            for (let r = 0; r < size; r++) lineCells.push([r, Math.floor(size / 2)]);
        }

        let solVals = lineCells.map(([r, c]) => this.solutionData[r][c]);

        for (let i = 0; i < size; i++) {
            let v = solVals[i];
            let sym = symbols[i];
            this.symbolMap[v] = sym;
            let input = document.getElementById(`sym-input-${v}`);
            if (input) input.value = sym;
        }

        this.bigHintCells = new Set(lineCells);
        if (modalOpen) {
            this.applySymbolModal();
        } else {
            this.renderBoardState();
            this.buildPalette();
        }
    }

    applySymbolModal() {
        const { size } = GRID_SIZES[this.currentSizeName];
        let newSymbols = {};
        let used = new Set();

        for (let num = 1; num <= size; num++) {
            let input = document.getElementById(`sym-input-${num}`);
            let sym = input.value.trim();
            if (!sym) {
                alert(`Symbol for value ${num} cannot be empty!`);
                return;
            }
            if (used.has(sym)) {
                alert(`Duplicate Error: Symbol '${sym}' is used multiple times! Every symbol must be unique.`);
                return;
            }
            used.add(sym);
            newSymbols[num] = sym;
        }

        this.symbolMap = newSymbols;
        this.closeSymbolModal();
        this.renderBoardState();
        this.buildPalette();
    }

    printPuzzle() {
        const { size } = GRID_SIZES[this.currentSizeName];
        const titleStr = `Sudoku ${this.currentSizeName} - Level: ${this.currentDifficulty}`;

        const printHeader = document.getElementById("print-header");
        printHeader.innerHTML = `<h2>${titleStr}</h2><p>Symbols: ${Array.from({ length: size }, (_, i) => this.symbolMap[i + 1]).join(", ")}</p>`;

        window.print();
    }
}

// Global App Initialization
let app;
window.onload = () => {
    app = new SudokuApp();
};