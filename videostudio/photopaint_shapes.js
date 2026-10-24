"use strict";

// ======================================================================
// PHOTO PAINT SHAPES & GEOMETRY (Port of Paint_Shape.py & Paint_Helper.py)
// ======================================================================

const PAINT_FONT_CATEGORIES = {
    "Modern": ["Inter", "Arial", "Segoe UI", "Roboto", "Helvetica", "Verdana", "Trebuchet MS", "Ubuntu", "Gill Sans", "Optima"],
    "Serif": ["Georgia", "Times New Roman", "Garamond", "Palatino", "Bookman", "Baskerville", "Cambria", "Didot"],
    "Mono": ["JetBrains Mono", "Fira Code", "Consolas", "Courier New", "Monaco", "Lucida Console", "Ubuntu Mono"],
    "Fancy": ["Impact", "Copperplate", "Papyrus", "Brush Script MT", "Comic Sans MS", "Snell Roundhand", "Chancery", "Stencil"],
    "Symbol": ["Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", "Symbol", "Wingdings"]
};

function getPaintShapeParamsConfig() {
    const config = {
        "Line": [
            ["Minimum Distance", 0, 50, 12],
            ["Corner Radius (%)", 0, 100, 30],
            ["Line Angles", "choice", ["Freehand", "30° Snap", "45° Snap", "90° Snap"]],
            ["Show Arrow", "toggle", "Show Arrow Head", false],
            ["Head Length (%)", 10, 100, 60],
            ["Head Inset (%)", 0, 100, 15]
        ],
        "Triangle": [
            ["Allow Obtuse", "bool", false],
            ["Top Shift (%)", -50, 50, 0],
            ["Corner Radius (%)", 0, 100, 0],
            ["Hole (%)", 0, 90, 0]
        ],
        "Rectangle": [
            ["Corner Radius (%)", 0, 100, 0],
            ["Hole (%)", 0, 90, 0]
        ],
        "Equilateral Polygon": [
            ["Number of Sides", 3, 24, 5],
            ["Corner Radius (%)", 0, 100, 0],
            ["Hole (%)", 0, 90, 0]
        ],
        "Circle": [
            ["Hole (%)", 0, 90, 0]
        ],
        "Ellipse": [
            ["Aspect Ratio (%)", 30, 100, 70],
            ["Hole (%)", 0, 90, 0]
        ],
        "Crescent": [
            ["Arch (Degrees)", 15, 360, 180],
            ["Hole (%)", -95, 95, 50]
        ],
        "Plus": [
            ["Arms", 3, 12, 4],
            ["Thickness (%)", 10, 150, 40],
            ["Corner Radius (%)", 0, 100, 0],
            ["Hole (%)", 0, 90, 0]
        ],
        "Star": [
            ["Arms", 3, 20, 5],
            ["Depth (%)", 5, 95, 50],
            ["Corner Radius (%)", 0, 100, 0],
            ["Hole (%)", 0, 90, 0]
        ],
        "Cog": [
            ["Teeth", 4, 30, 8],
            ["Radius-1 Outer (%)", 20, 100, 100],
            ["Radius-3 Root (%)", 10, 95, 60],
            ["Splay (%)", 0, 100, 20],
            ["Hole (%)", 0, 90, 40]
        ],
        "Pie Chart": [
            ["Percent Shown (%)", 1, 100, 75],
            ["Hole (%)", 0, 90, 0]
        ],
        "Arrow": [
            ["Base Thickness (%)", 5, 100, 25],
            ["Head Thickness (%)", 20, 150, 55],
            ["Head Length (%)", 10, 90, 40],
            ["Head Inset (%)", -40, 40, 0],
            ["Corner Radius (%)", 0, 100, 0]
        ],
        "Emoji": [
            ["Grayscale", "bool", false],
            ["Emoji", "emoji_grid", "🙂"],
            ["Change", "button", "Open Emoji Selection"]
        ],
        "Fill": [
            ["Fill Tolerance", 1, 100, 18],
            ["Fill Type", "choice", ["Solid Color", "Transparent", "Checkerboard", "Diagonal Stripes", "Polka Dots"]]
        ]
    };

    Object.entries(PAINT_FONT_CATEGORIES).forEach(([cat, fontList]) => {
        config["Font" + cat] = [
            [cat, "font", fontList],
            ["Bold", "toggle", false],
            ["Italic", "toggle", false],
            ["Text Size", 10, 120, 32],
            ["Text Outline", "bool", false],
            ["Background Pill", "bool", false],
            ["Bg Opacity (%)", 10, 100, 65]
        ];
    });

    return config;
}

// ======================================================================
// GEOMETRY & TRANSFORM HELPERS (Ported from Paint_Helper.py)
// ======================================================================
function paintTransformPts(pts, cx, cy, angle) {
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);
    return pts.map(([x, y]) => [
        cx + x * cosA - y * sinA,
        cy + x * sinA + y * cosA
    ]);
}

function paintRotatePt(px, py, cx, cy, theta) {
    const cosA = Math.cos(theta);
    const sinA = Math.sin(theta);
    const dx = px - cx;
    const dy = py - cy;
    return [cx + dx * cosA - dy * sinA, cy + dx * sinA + dy * cosA];
}

function paintCalculateVertexAngle(pts, idx, isClosed = true) {
    const n = pts.length;
    if (n < 2) return null;
    const v = pts[idx];

    if (isClosed || (idx > 0 && idx < n - 1)) {
        const pPrev = pts[(idx - 1 + n) % n];
        const pNext = pts[(idx + 1) % n];
        const v1 = [pPrev[0] - v[0], pPrev[1] - v[1]];
        const v2 = [pNext[0] - v[0], pNext[1] - v[1]];
        const ang1 = Math.atan2(v1[1], v1[0]);
        const ang2 = Math.atan2(v2[1], v2[0]);
        let diff = Math.abs(ang1 - ang2) * (180 / Math.PI);
        if (diff > 180) diff = 360 - diff;
        return diff;
    } else {
        const otherIdx = idx === 0 ? 1 : n - 2;
        const pOther = pts[otherIdx];
        const dx = v[0] - pOther[0];
        const dy = v[1] - pOther[1];
        return ((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360;
    }
}

function getShapeVertices(shapeType, params, R) {
    if (R <= 0) return [];

    if (shapeType === "Triangle") {
        const shift = (params["Top Shift (%)"] ?? 0) / 100.0;
        const allowObtuse = !!params["Allow Obtuse"];
        let scaleFactor = 1.0;
        if (allowObtuse) {
            const maxAbsX = Math.max(1.0, Math.abs(shift * 2.0));
            if (maxAbsX > 1.1) scaleFactor = 1.1 / maxAbsX;
        }
        const H = R * Math.sqrt(3);
        return [
            [-R * scaleFactor, (H / 2) * scaleFactor],
            [R * scaleFactor, (H / 2) * scaleFactor],
            [shift * R * 2 * scaleFactor, (-H / 2) * scaleFactor]
        ];
    } else if (shapeType === "Rectangle") {
        const w = R * 2.2, h = R * 1.5;
        return [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]];
    } else if (shapeType === "Equilateral Polygon") {
        const sides = Math.max(3, parseInt(params["Number of Sides"] ?? 5, 10));
        const pts = [];
        for (let i = 0; i < sides; i++) {
            const ang = (i * 2 * Math.PI) / sides - Math.PI / 2;
            pts.push([R * Math.cos(ang), R * Math.sin(ang)]);
        }
        return pts;
    } else if (shapeType === "Circle") {
        const pts = [];
        for (let i = 0; i < 36; i++) {
            const ang = (i * 2 * Math.PI) / 36;
            pts.push([R * Math.cos(ang), R * Math.sin(ang)]);
        }
        return pts;
    } else if (shapeType === "Ellipse") {
        const aspect = (params["Aspect Ratio (%)"] ?? 70) / 100.0;
        const pts = [];
        for (let i = 0; i < 36; i++) {
            const ang = (i * 2 * Math.PI) / 36;
            pts.push([R * Math.cos(ang), R * aspect * Math.sin(ang)]);
        }
        return pts;
    } else if (shapeType === "Star") {
        const depth = (params["Depth (%)"] ?? 50) / 100.0;
        const arms = Math.max(3, parseInt(params["Arms"] ?? 5, 10));
        const innerR = R * (1.0 - depth);
        const pts = [];
        for (let i = 0; i < arms * 2; i++) {
            const rPt = i % 2 === 0 ? R : innerR;
            const ang = (i * Math.PI) / arms - Math.PI / 2;
            pts.push([rPt * Math.cos(ang), rPt * Math.sin(ang)]);
        }
        return pts;
    } else if (shapeType === "Plus") {
        const plusArms = Math.max(3, parseInt(params["Arms"] ?? 4, 10));
        const thicknessPct = (params["Thickness (%)"] ?? 40) / 100.0;
        const w = thicknessPct * R * 0.5;
        const armData = [];
        for (let i = 0; i < plusArms; i++) {
            const ang = (i * 2 * Math.PI) / plusArms - Math.PI / 2;
            const ux = Math.cos(ang), uy = Math.sin(ang);
            const vx = -uy, vy = ux;
            armData.push({
                ux, uy,
                tl: [R * ux + w * vx, R * uy + w * vy],
                tr: [R * ux - w * vx, R * uy - w * vy]
            });
        }
        const pts = [];
        for (let i = 0; i < plusArms; i++) {
            const nextI = (i + 1) % plusArms;
            const cur = armData[i];
            const nxt = armData[nextI];
            const dx = cur.tr[0] - nxt.tl[0];
            const dy = cur.tr[1] - nxt.tl[1];
            const det = -cur.ux * nxt.uy + cur.uy * nxt.ux;
            const t = Math.abs(det) > 1e-6 ? (dx * -nxt.uy - dy * -nxt.ux) / det : R;
            pts.push(cur.tl, cur.tr, [cur.tr[0] - t * cur.ux, cur.tr[1] - t * cur.uy]);
        }
        return pts;
    } else if (shapeType === "Arrow") {
        const minR = Math.min(R, 60);
        const bt = ((params["Base Thickness (%)"] ?? 25) / 100.0) * minR;
        const ht = ((params["Head Thickness (%)"] ?? 55) / 100.0) * minR;
        const hl = ((params["Head Length (%)"] ?? 40) / 100.0) * minR;
        const hi = ((params["Head Inset (%)"] ?? 0) / 100.0) * R;
        return [
            [-R, -bt / 2], [R - hl, -bt / 2], [R - hl + hi, -ht / 2],
            [R, 0], [R - hl + hi, ht / 2], [R - hl, bt / 2], [-R, bt / 2]
        ];
    } else if (shapeType === "Pie Chart") {
        const percent = (params["Percent Shown (%)"] ?? 75) / 100.0;
        const holePct = Math.abs(params["Hole (%)"] ?? 0) / 100.0;
        const numSteps = Math.max(8, Math.round(32 * percent));
        const pts = [];
        if (percent < 1.0) {
            if (holePct > 0) {
                for (let i = 0; i <= numSteps; i++) {
                    const ang = -Math.PI / 2 + (percent * 2 * Math.PI * i) / numSteps;
                    pts.push([R * Math.cos(ang), R * Math.sin(ang)]);
                }
                for (let i = numSteps; i >= 0; i--) {
                    const ang = -Math.PI / 2 + (percent * 2 * Math.PI * i) / numSteps;
                    pts.push([R * holePct * Math.cos(ang), R * holePct * Math.sin(ang)]);
                }
            } else {
                pts.push([0, 0]);
                for (let i = 0; i <= numSteps; i++) {
                    const ang = -Math.PI / 2 + (percent * 2 * Math.PI * i) / numSteps;
                    pts.push([R * Math.cos(ang), R * Math.sin(ang)]);
                }
            }
        } else {
            for (let i = 0; i < 36; i++) {
                const ang = (i * 2 * Math.PI) / 36;
                pts.push([R * Math.cos(ang), R * Math.sin(ang)]);
            }
        }
        return pts;
    } else if (shapeType === "Crescent") {
        const A = ((params["Arch (Degrees)"] ?? 180) * Math.PI) / 180.0;
        const holePct = Math.abs(params["Hole (%)"] ?? 50) / 100.0;
        const pts = [];
        if (A > 0.001) {
            if (A >= 2 * Math.PI - 0.001) {
                for (let i = 0; i < 36; i++) {
                    const ang = (i * 2 * Math.PI) / 36;
                    pts.push([R * Math.cos(ang), R * Math.sin(ang)]);
                }
            } else {
                const startAng = -A / 2, endAng = A / 2;
                const numPts = 20;
                for (let i = 0; i <= numPts; i++) {
                    const ang = startAng + ((endAng - startAng) * i) / numPts;
                    pts.push([R * Math.cos(ang), R * Math.sin(ang)]);
                }
                const xChord = R * Math.cos(A / 2);
                const yChord = R * Math.sin(A / 2);
                const x3 = xChord + (R - xChord) * holePct;
                if (Math.abs(x3 - xChord) < 1e-5) {
                    pts.push([xChord, -yChord]);
                } else {
                    const cx = (x3 * x3 - R * R) / (2 * (x3 - xChord));
                    const rI = Math.abs(x3 - cx);
                    const aBot = Math.atan2(yChord, xChord - cx);
                    const aTop = Math.atan2(-yChord, xChord - cx);
                    for (let i = 0; i <= numPts; i++) {
                        const ang = aBot + ((aTop - aBot) * i) / numPts;
                        pts.push([cx + rI * Math.cos(ang), rI * Math.sin(ang)]);
                    }
                }
            }
        }
        return pts;
    } else if (shapeType === "Cog") {
        const r1Base = (params["Radius-1 Outer (%)"] ?? 100) / 100.0;
        const r3Base = (params["Radius-3 Root (%)"] ?? 60) / 100.0;
        const splay = (params["Splay (%)"] ?? 20) / 100.0;
        const teeth = Math.max(4, parseInt(params["Teeth"] ?? 8, 10));
        const totalPts = teeth * 4;
        const r1 = r1Base * R, r3 = r3Base * R;
        const pts = [];
        for (let i = 0; i < totalPts; i++) {
            let ang = (i * 2 * Math.PI) / totalPts - Math.PI / 2;
            const mod = i % 4;
            let rCurr = r1;
            if (mod === 0) { rCurr = r1; ang += (Math.PI / totalPts) * splay; }
            else if (mod === 1) { rCurr = r1; ang -= (Math.PI / totalPts) * splay; }
            else if (mod === 2) { rCurr = r3; ang -= (Math.PI / totalPts) * splay; }
            else { rCurr = r3; ang += (Math.PI / totalPts) * splay; }
            pts.push([rCurr * Math.cos(ang), rCurr * Math.sin(ang)]);
        }
        return pts;
    }
    return [];
}

function getShapeHoleVertices(shapeType, params, R) {
    const holePct = Math.abs(params["Hole (%)"] ?? 0) / 100.0;
    if (holePct <= 0.001) return null;

    if (shapeType === "Pie Chart" && (params["Percent Shown (%)"] ?? 75) < 100) {
        return null; // Wedge contour already includes inner radial cutout
    }
    if (shapeType === "Crescent") {
        const A = ((params["Arch (Degrees)"] ?? 180) * Math.PI) / 180.0;
        if (A < 2 * Math.PI - 0.001) return null;
        const x3 = -R + 2 * R * holePct;
        const cx = (x3 - R) / 2.0;
        const rI = Math.abs(x3 + R) / 2.0;
        const pts = [];
        for (let i = 0; i < 36; i++) {
            const ang = (i * 2 * Math.PI) / 36;
            pts.push([cx + rI * Math.cos(ang), rI * Math.sin(ang)]);
        }
        return pts;
    }
    if (shapeType === "Circle" || shapeType === "Cog" || shapeType === "Pie Chart") {
        const rH = R * holePct;
        const pts = [];
        for (let i = 0; i < 36; i++) {
            const ang = (i * 2 * Math.PI) / 36;
            pts.push([rH * Math.cos(ang), rH * Math.sin(ang)]);
        }
        return pts;
    }

    const outer = getShapeVertices(shapeType, params, R);
    if (!outer.length) return null;

    if (shapeType === "Triangle") {
        const cx = (outer[0][0] + outer[1][0] + outer[2][0]) / 3.0;
        const cy = (outer[0][1] + outer[1][1] + outer[2][1]) / 3.0;
        return outer.map(([x, y]) => [cx + (x - cx) * holePct, cy + (y - cy) * holePct]);
    }

    return outer.map(([x, y]) => [x * holePct, y * holePct]);
}

function addRoundedPolygonSubpath(ctx, vertices, cornerPct, R) {
    const clean = [];
    for (const pt of vertices) {
        if (!clean.length || Math.hypot(pt[0] - clean[clean.length - 1][0], pt[1] - clean[clean.length - 1][1]) > 1e-4) {
            clean.push(pt);
        }
    }
    if (clean.length > 1 && Math.hypot(clean[0][0] - clean[clean.length - 1][0], clean[0][1] - clean[clean.length - 1][1]) < 1e-4) {
        clean.pop();
    }

    const n = clean.length;
    if (n === 0) return;
    if (cornerPct <= 0 || n < 3) {
        ctx.moveTo(clean[0][0], clean[0][1]);
        for (let i = 1; i < n; i++) ctx.lineTo(clean[i][0], clean[i][1]);
        ctx.closePath();
        return;
    }

    const rMax = R * 0.4;
    const rVal = cornerPct * rMax;
    const APts = [];
    const BPts = [];

    for (let i = 0; i < n; i++) {
        const pCurr = clean[i];
        const pPrev = clean[(i - 1 + n) % n];
        const pNext = clean[(i + 1) % n];

        const v1x = pPrev[0] - pCurr[0], v1y = pPrev[1] - pCurr[1];
        const v2x = pNext[0] - pCurr[0], v2y = pNext[1] - pCurr[1];
        const d1 = Math.hypot(v1x, v1y), d2 = Math.hypot(v2x, v2y);

        const r = (d1 > 1e-4 && d2 > 1e-4) ? Math.min(rVal, d1 * 0.45, d2 * 0.45) : 0;
        if (r > 0.01) {
            APts.push([pCurr[0] + r * (v1x / d1), pCurr[1] + r * (v1y / d1)]);
            BPts.push([pCurr[0] + r * (v2x / d2), pCurr[1] + r * (v2y / d2)]);
        } else {
            APts.push(pCurr);
            BPts.push(pCurr);
        }
    }

    ctx.moveTo(BPts[n - 1][0], BPts[n - 1][1]);
    for (let i = 0; i < n; i++) {
        ctx.lineTo(APts[i][0], APts[i][1]);
        if (APts[i][0] !== BPts[i][0] || APts[i][1] !== BPts[i][1]) {
            ctx.quadraticCurveTo(clean[i][0], clean[i][1], BPts[i][0], BPts[i][1]);
        } else {
            ctx.lineTo(BPts[i][0], BPts[i][1]);
        }
    }
    ctx.closePath();
}

function addRoundedOpenSubpath(ctx, vertices, cornerPct, R) {
    const clean = [];
    for (const pt of vertices) {
        if (!clean.length || Math.hypot(pt[0] - clean[clean.length - 1][0], pt[1] - clean[clean.length - 1][1]) > 1e-4) {
            clean.push(pt);
        }
    }
    const n = clean.length;
    if (n === 0) return;
    if (cornerPct <= 0 || n < 3) {
        ctx.moveTo(clean[0][0], clean[0][1]);
        for (let i = 1; i < n; i++) ctx.lineTo(clean[i][0], clean[i][1]);
        return;
    }

    const rMax = R * 0.4;
    const rVal = cornerPct * rMax;

    ctx.moveTo(clean[0][0], clean[0][1]);
    for (let i = 1; i < n - 1; i++) {
        const pPrev = clean[i - 1], pCurr = clean[i], pNext = clean[i + 1];
        const v1x = pPrev[0] - pCurr[0], v1y = pPrev[1] - pCurr[1];
        const v2x = pNext[0] - pCurr[0], v2y = pNext[1] - pCurr[1];
        const d1 = Math.hypot(v1x, v1y), d2 = Math.hypot(v2x, v2y);
        const r = (d1 > 1e-4 && d2 > 1e-4) ? Math.min(rVal, d1 * 0.45, d2 * 0.45) : 0;

        if (r > 0.01) {
            const ax = pCurr[0] + r * (v1x / d1), ay = pCurr[1] + r * (v1y / d1);
            const bx = pCurr[0] + r * (v2x / d2), by = pCurr[1] + r * (v2y / d2);
            ctx.lineTo(ax, ay);
            ctx.quadraticCurveTo(pCurr[0], pCurr[1], bx, by);
        } else {
            ctx.lineTo(pCurr[0], pCurr[1]);
        }
    }
    ctx.lineTo(clean[n - 1][0], clean[n - 1][1]);
}

function drawCanvasLine(ctx, pts, params, colorHex, thickness) {
    if (!pts || pts.length < 2) return;
    const cornerPct = (params["Corner Radius (%)"] ?? 0) / 100.0;
    const showArrow = !!params["Show Arrow"];

    ctx.save();
    ctx.beginPath();
    if (cornerPct > 0 && pts.length >= 3) {
        addRoundedOpenSubpath(ctx, pts, cornerPct, 500);
    } else {
        ctx.moveTo(pts[0][0], pts[0][1]);
        for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    }
    ctx.strokeStyle = colorHex;
    ctx.lineWidth = thickness;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();

    if (showArrow) {
        let idx = pts.length - 2;
        const pEnd = pts[pts.length - 1];
        let pPrev = pts[idx];
        let dx = pEnd[0] - pPrev[0], dy = pEnd[1] - pPrev[1];
        let dist = Math.hypot(dx, dy);

        while (dist < 10 && idx > 0) {
            idx--;
            pPrev = pts[idx];
            dx = pEnd[0] - pPrev[0];
            dy = pEnd[1] - pPrev[1];
            dist = Math.hypot(dx, dy);
        }

        const ux = dist > 0 ? dx / dist : 1;
        const uy = dist > 0 ? dy / dist : 0;
        const nx = -uy, ny = ux;

        const headScale = Math.max(15.0, thickness * 4.0);
        const hl = ((params["Head Length (%)"] ?? 40) / 100.0) * headScale * 2;
        const ht = 0.2 * headScale * 2;
        const hi = ((params["Head Inset (%)"] ?? 0) / 100.0) * headScale * 2;

        const left = [pEnd[0] - hl * ux + (ht / 2) * nx, pEnd[1] - hl * uy + (ht / 2) * ny];
        const right = [pEnd[0] - hl * ux - (ht / 2) * nx, pEnd[1] - hl * uy - (ht / 2) * ny];
        const inset = [pEnd[0] - (hl - hi) * ux, pEnd[1] - (hl - hi) * uy];

        ctx.beginPath();
        ctx.moveTo(pEnd[0], pEnd[1]);
        ctx.lineTo(left[0], left[1]);
        ctx.lineTo(inset[0], inset[1]);
        ctx.lineTo(right[0], right[1]);
        ctx.closePath();
        ctx.fillStyle = colorHex;
        ctx.fill();
    }
    ctx.restore();
}

function traceShapePathOnContext(ctx, shapeType, params, R) {
    ctx.beginPath();
    if (R <= 0) return;

    if (shapeType === "Line") {
        const cornerPct = (params["Corner Radius (%)"] ?? 0) / 100.0;
        const showArrow = !!params["Show Arrow"];
        const vertices = [[-R * 0.8, R * 0.5], [-R * 0.2, -R * 0.5], [R * 0.4, R * 0.3], [R * 0.8, -R * 0.3]];
        addRoundedOpenSubpath(ctx, vertices, cornerPct, R);

        if (showArrow) {
            const [endX, endY] = vertices[3];
            const dx = endX - vertices[2][0], dy = endY - vertices[2][1];
            const dist = Math.hypot(dx, dy) || 1;
            const ux = dx / dist, uy = dy / dist;
            const nx = -uy, ny = ux;
            const hl = ((params["Head Length (%)"] ?? 40) / 100.0) * R;
            const ht = 0.2 * R;
            const hi = ((params["Head Inset (%)"] ?? 0) / 100.0) * R;

            ctx.moveTo(endX, endY);
            ctx.lineTo(endX - hl * ux + (ht / 2) * nx, endY - hl * uy + (ht / 2) * ny);
            ctx.lineTo(endX - (hl - hi) * ux, endY - (hl - hi) * uy);
            ctx.lineTo(endX - hl * ux - (ht / 2) * nx, endY - hl * uy - (ht / 2) * ny);
            ctx.closePath();
        }
        return;
    }

    const cornerPct = (params["Corner Radius (%)"] ?? 0) / 100.0;
    const outerPts = getShapeVertices(shapeType, params, R);
    if (outerPts.length >= 3) {
        addRoundedPolygonSubpath(ctx, outerPts, cornerPct, R);
    }

    const holePts = getShapeHoleVertices(shapeType, params, R);
    if (holePts && holePts.length >= 3) {
        const holePct = Math.abs(params["Hole (%)"] ?? 0) / 100.0;
        addRoundedPolygonSubpath(ctx, holePts, cornerPct * holePct, R * holePct);
    }
}

function drawEmojiOnContext(ctx, emojiChar, fontSize, isGrayscale) {
    ctx.save();
    if (isGrayscale) {
        ctx.filter = "grayscale(100%)";
    }
    ctx.font = `${Math.round(fontSize)}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(emojiChar || "🙂", 0, 0);
    ctx.restore();
}

function hexToRgba(hex, alpha = 1.0) {
    const clean = (hex || "#0096fa").replace("#", "");
    const num = parseInt(clean.length === 3 ? clean.split("").map(c => c + c).join("") : clean, 16);
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function hexToRgbArray(hex) {
    const clean = (hex || "#0096fa").replace("#", "");
    const num = parseInt(clean.length === 3 ? clean.split("").map(c => c + c).join("") : clean, 16);
    return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function drawTrianglePreviewMetrics(ctx, params, R) {
    const localPts = getShapeVertices("Triangle", params, R);
    if (!localPts || localPts.length < 3) return;

    const sortedByY = [...localPts].sort((a, b) => b[1] - a[1]);
    const bottomA = sortedByY[0], bottomB = sortedByY[1], v1 = sortedByY[2];
    const [v3, v2] = bottomA[0] < bottomB[0] ? [bottomA, bottomB] : [bottomB, bottomA];

    const baseLenPx = Math.hypot(v2[0] - v3[0], v2[1] - v3[1]);
    if (baseLenPx <= 0) return;

    const scale = 1.0 / baseLenPx;
    const lenBase = 1.0;
    const lenLeft = Math.hypot(v1[0] - v3[0], v1[1] - v3[1]) * scale;
    const lenRight = Math.hypot(v2[0] - v1[0], v2[1] - v1[1]) * scale;

    const calcAngleInfo = (pPrev, pCurr, pNext) => {
        const va = [pPrev[0] - pCurr[0], pPrev[1] - pCurr[1]];
        const vb = [pNext[0] - pCurr[0], pNext[1] - pCurr[1]];
        const magA = Math.hypot(va[0], va[1]);
        const magB = Math.hypot(vb[0], vb[1]);
        if (magA === 0 || magB === 0) return [0, 0, 0, 0];
        const dot = va[0] * vb[0] + va[1] * vb[1];
        const cosAngle = Math.max(-1, Math.min(1, dot / (magA * magB)));
        const angleDeg = (Math.acos(cosAngle) * 180) / Math.PI;
        const a1 = Math.atan2(va[1], va[0]);
        const a2 = Math.atan2(vb[1], vb[0]);
        let diff = (a2 - a1) % (2 * Math.PI);
        if (diff < 0) diff += 2 * Math.PI;
        let sweep = diff > Math.PI ? -(2 * Math.PI - diff) : diff;
        return [angleDeg, a1, sweep, Math.min(magA, magB)];
    };

    const [ang1, st1, sw1, r1] = calcAngleInfo(v3, v1, v2);
    const [ang2, st2, sw2, r2] = calcAngleInfo(v1, v2, v3);
    const [ang3, st3, sw3, r3] = calcAngleInfo(v2, v3, v1);

    ctx.save();
    ctx.strokeStyle = "rgb(217, 119, 6)";
    ctx.lineWidth = 1.8;
    [[v1, st1, sw1, Math.min(r1 * 0.25, 18)], [v2, st2, sw2, Math.min(r2 * 0.25, 18)], [v3, st3, sw3, Math.min(r3 * 0.25, 18)]].forEach(([v, st, sw, arcR]) => {
        if (arcR > 2) {
            ctx.beginPath();
            ctx.arc(v[0], v[1], arcR, st, st + sw, sw < 0);
            ctx.stroke();
        }
    });

    ctx.font = "bold 9.5px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#ffffff";

    [[v1, ang1, st1 + sw1 / 2], [v2, ang2, st2 + sw2 / 2], [v3, ang3, st3 + sw3 / 2]].forEach(([v, deg, bisect]) => {
        const tx = v[0] + 18 * Math.cos(bisect);
        const ty = v[1] + 18 * Math.sin(bisect);
        ctx.fillText(`${deg.toFixed(1)}°`, tx, ty);
    });

    ctx.fillStyle = "#38bdf8";
    const edges = [
        [(v3[0] + v2[0]) / 2, (v3[1] + v2[1]) / 2 + 11, lenBase.toFixed(2)],
        [(v1[0] + v3[0]) / 2 - 12, (v1[1] + v3[1]) / 2, lenLeft.toFixed(2)],
        [(v1[0] + v2[0]) / 2 + 12, (v1[1] + v2[1]) / 2, lenRight.toFixed(2)]
    ];
    edges.forEach(([mx, my, txt]) => ctx.fillText(txt, mx, my));
    ctx.restore();
}

// ======================================================================
// RESIZABLE BOUNDING BOX (Ported from ResizableBox in Paint_Helper.py)
// ======================================================================
class PaintResizableBox {
    constructor(x, y, width, height, handleSize = 10, hitPadding = 10) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.handleSize = handleSize;
        this.hitPadding = hitPadding;

        this.activeHandle = null;
        this.dragStartMouse = [0, 0];
        this.dragStartRect = { x, y, width, height };
    }

    getHandles() {
        const hs = this.handleSize;
        const half = hs / 2;
        const rotDist = hs * 2.5;
        const { x, y, width: w, height: h } = this;
        const cx = x + w / 2;
        const cy = y + h / 2;

        return {
            nw:  { x: x - half, y: y - half, w: hs, h: hs },
            ne:  { x: x + w - half, y: y - half, w: hs, h: hs },
            se:  { x: x + w - half, y: y + h - half, w: hs, h: hs },
            sw:  { x: x - half, y: y + h - half, w: hs, h: hs },
            n:   { x: cx - half, y: y - half, w: hs, h: hs },
            e:   { x: x + w - half, y: cy - half, w: hs, h: hs },
            s:   { x: cx - half, y: y + h - half, w: hs, h: hs },
            w:   { x: x - half, y: cy - half, w: hs, h: hs },
            c:   { x: cx - half, y: cy - half, w: hs, h: hs },
            rot: { x: cx - half, y: y - rotDist - half, w: hs, h: hs }
        };
    }

    hitTestHandle(px, py) {
        const pad = this.hitPadding;
        let closest = null;
        let minDist = Infinity;

        for (const [id, r] of Object.entries(this.getHandles())) {
            if (px >= r.x - pad && px <= r.x + r.w + pad && py >= r.y - pad && py <= r.y + r.h + pad) {
                const cx = r.x + r.w / 2;
                const cy = r.y + r.h / 2;
                const d = Math.hypot(px - cx, py - cy);
                if (d < minDist) {
                    minDist = d;
                    closest = id;
                }
            }
        }
        return closest;
    }

    startDrag(handleId, mousePt) {
        this.activeHandle = handleId;
        this.dragStartMouse = mousePt;
        this.dragStartRect = { x: this.x, y: this.y, width: this.width, height: this.height };
    }

    updateDrag(mousePt) {
        if (!this.activeHandle) return;
        const dx = mousePt[0] - this.dragStartMouse[0];
        const dy = mousePt[1] - this.dragStartMouse[1];
        const { x: ox, y: oy, width: ow, height: oh } = this.dragStartRect;
        const aspect = oh !== 0 ? ow / oh : 1.0;

        let nx = ox, ny = oy, nw = ow, nh = oh;

        if (this.activeHandle === "e") {
            nw = Math.max(10, ow + dx);
        } else if (this.activeHandle === "w") {
            nw = Math.max(10, ow - dx);
            nx = ox + (ow - nw);
        } else if (this.activeHandle === "s") {
            nh = Math.max(10, oh + dy);
        } else if (this.activeHandle === "n") {
            nh = Math.max(10, oh - dy);
            ny = oy + (oh - nh);
        } else if (this.activeHandle === "c") {
            nx = ox + dx;
            ny = oy + dy;
        } else if (["se", "sw", "ne", "nw"].includes(this.activeHandle)) {
            const proposedW = ["se", "ne"].includes(this.activeHandle) ? ow + dx : ow - dx;
            nw = Math.max(10, proposedW);
            nh = nw / aspect;
            if (this.activeHandle === "sw") nx = ox + (ow - nw);
            else if (this.activeHandle === "ne") ny = oy + (oh - nh);
            else if (this.activeHandle === "nw") {
                nx = ox + (ow - nw);
                ny = oy + (oh - nh);
            }
        }

        this.x = nx;
        this.y = ny;
        this.width = nw;
        this.height = nh;
    }

    stopDrag() {
        this.activeHandle = null;
    }

    draw(ctx, scale = 1.0) {
        ctx.save();
        ctx.strokeStyle = "#0ea5e9";
        ctx.lineWidth = Math.max(1, 1.5 / scale);
        ctx.setLineDash([4 / scale, 4 / scale]);
        ctx.strokeRect(this.x, this.y, this.width, this.height);
        ctx.setLineDash([]);

        const handles = this.getHandles();
        ctx.fillStyle = "#ffffff";
        ctx.strokeStyle = "#0284c7";
        ctx.lineWidth = Math.max(1, 1.2 / scale);

        for (const [id, r] of Object.entries(handles)) {
            if (id === "rot") {
                const cx = this.x + this.width / 2;
                ctx.beginPath();
                ctx.moveTo(cx, this.y);
                ctx.lineTo(cx, r.y + r.h / 2);
                ctx.stroke();

                ctx.beginPath();
                ctx.arc(r.x + r.w / 2, r.y + r.h / 2, r.w / 2, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
            } else {
                ctx.fillRect(r.x, r.y, r.w, r.h);
                ctx.strokeRect(r.x, r.y, r.w, r.h);
            }
        }
        ctx.restore();
    }
}

// Global window assignments for modular script usage
window.PAINT_FONT_CATEGORIES = PAINT_FONT_CATEGORIES;
window.getPaintShapeParamsConfig = getPaintShapeParamsConfig;
window.paintTransformPts = paintTransformPts;
window.paintRotatePt = paintRotatePt;
window.paintCalculateVertexAngle = paintCalculateVertexAngle;
window.getShapeVertices = getShapeVertices;
window.getShapeHoleVertices = getShapeHoleVertices;
window.addRoundedPolygonSubpath = addRoundedPolygonSubpath;
window.addRoundedOpenSubpath = addRoundedOpenSubpath;
window.drawCanvasLine = drawCanvasLine;
window.traceShapePathOnContext = traceShapePathOnContext;
window.drawEmojiOnContext = drawEmojiOnContext;
window.hexToRgba = hexToRgba;
window.hexToRgbArray = hexToRgbArray;
window.drawTrianglePreviewMetrics = drawTrianglePreviewMetrics;
window.PaintResizableBox = PaintResizableBox;