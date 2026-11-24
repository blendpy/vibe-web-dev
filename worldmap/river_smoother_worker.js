/*************************************************************************
 * river_smoother_worker.js
 * Background Web Worker for Zigzag Angle Dampening + Spline Densification
 *************************************************************************/

self.onmessage = function (e) {
    const { id, geojson, options = {} } = e.data;
    const t0 = performance.now();

    const {
        zigzagTolMeters = 30.0,     // Max vertex shift for sawtooth filter (m)
        splineMethod = 'chaikin',   // 'chaikin', 'bspline', or 'none'
        splineStepMeters = 30.0,    // Resample / control-point spacing (m)
        angleGenDeg = 3.0,          // Post-smooth angle generalization (0 = off)
        lockEnds = true             // Lock first/last vertex to preserve junctions
    } = options;

    let vertsBefore = 0;
    let vertsAfter = 0;

    const outFeatures = geojson.features.map((feat) => {
        const geom = feat.geometry;
        if (!geom) return feat;

        if (geom.type === 'LineString') {
            vertsBefore += geom.coordinates.length;
            const smoothed = processPart(
                geom.coordinates,
                zigzagTolMeters,
                splineMethod,
                splineStepMeters,
                angleGenDeg,
                lockEnds
            );
            vertsAfter += smoothed.length;
            return {
                ...feat,
                geometry: { type: 'LineString', coordinates: smoothed }
            };
        }

        if (geom.type === 'MultiLineString') {
            const newParts = geom.coordinates.map((part) => {
                vertsBefore += part.length;
                const smoothed = processPart(
                    part,
                    zigzagTolMeters,
                    splineMethod,
                    splineStepMeters,
                    angleGenDeg,
                    lockEnds
                );
                vertsAfter += smoothed.length;
                return smoothed;
            });
            return {
                ...feat,
                geometry: { type: 'MultiLineString', coordinates: newParts }
            };
        }

        return feat;
    });

    self.postMessage({
        id,
        geojson: { ...geojson, features: outFeatures },
        stats: {
            vertsBefore,
            vertsAfter,
            elapsedMs: Math.round(performance.now() - t0)
        }
    });
};

function processPart(coords, zigzagTolM, splineMethod, splineStepM, angleGenDeg, lockEnds) {
    const n = coords.length;
    if (n < 3) return coords;

    // 1. Convert [lon, lat] to local tangent-plane meters
    const x0 = coords[0][0];
    const y0 = coords[0][1];
    const midY = 0.5 * (y0 + coords[n - 1][1]);
    const latRad = (midY * Math.PI) / 180.0;

    const lonScale = Math.max(
        111412.84 * Math.cos(latRad) - 93.5 * Math.cos(3.0 * latRad),
        1e-6
    );
    const latScale =
        111132.92 - 559.82 * Math.cos(2.0 * latRad) + 1.175 * Math.cos(4.0 * latRad);

    let xs = new Array(n);
    let ys = new Array(n);
    for (let i = 0; i < n; i++) {
        xs[i] = (coords[i][0] - x0) * lonScale;
        ys[i] = (coords[i][1] - y0) * latScale;
    }

    // 2. Zigzag Angle Dampening (8° to 85° alternating sawtooth turns)
    if (zigzagTolM > 0) {
        [xs, ys] = smoothZigzagDampening(xs, ys, zigzagTolM, lockEnds);
    }

    // 3. Spline densification
    if (splineMethod === 'chaikin') {
        [xs, ys] = smoothChaikin(xs, ys, splineStepM, lockEnds);
    } else if (splineMethod === 'bspline') {
        [xs, ys] = smoothBSpline(xs, ys, splineStepM, lockEnds);
    }

    // 4. Optional angle-based generalization
    if (angleGenDeg > 0) {
        [xs, ys] = generalizeByAngle(xs, ys, angleGenDeg);
    }

    // 5. Transform back to [lon, lat]
    const invLon = 1.0 / lonScale;
    const invLat = 1.0 / latScale;
    const out = new Array(xs.length);

    for (let i = 0; i < xs.length; i++) {
        out[i] = [x0 + xs[i] * invLon, y0 + ys[i] * invLat];
    }

    if (lockEnds && out.length >= 2) {
        out[0] = [coords[0][0], coords[0][1]];
        out[out.length - 1] = [coords[n - 1][0], coords[n - 1][1]];
    }

    return out;
}

function smoothZigzagDampening(xs, ys, tolM, lockEnds) {
    const n = xs.length;
    if (n < 3) return [xs, ys];

    const origX = xs.slice();
    const origY = ys.slice();
    let curX = xs.slice();
    let curY = ys.slice();

    const minRad = (8.0 * Math.PI) / 180.0;
    const maxRad = (85.0 * Math.PI) / 180.0;
    const startI = lockEnds ? 1 : 0;
    const endI = lockEnds ? n - 1 : n;

    for (let iter = 0; iter < 8; iter++) {
        const angles = new Float64Array(n);
        for (let i = 1; i < n - 1; i++) {
            const v1x = curX[i] - curX[i - 1];
            const v1y = curY[i] - curY[i - 1];
            const v2x = curX[i + 1] - curX[i];
            const v2y = curY[i + 1] - curY[i];
            if ((v1x === 0 && v1y === 0) || (v2x === 0 && v2y === 0)) continue;
            angles[i] = Math.atan2(v1x * v2y - v1y * v2x, v1x * v2x + v1y * v2y);
        }

        const nxtX = curX.slice();
        const nxtY = curY.slice();
        let moved = false;

        for (let i = startI; i < endI; i++) {
            let candX, candY;
            if (i === 0) {
                const midX = 0.5 * (curX[0] + curX[1]);
                const midY = 0.5 * (curY[0] + curY[1]);
                candX = curX[0] + 0.35 * (midX - curX[0]);
                candY = curY[0] + 0.35 * (midY - curY[0]);
            } else if (i === n - 1) {
                const midX = 0.5 * (curX[n - 2] + curX[n - 1]);
                const midY = 0.5 * (curY[n - 2] + curY[n - 1]);
                candX = curX[n - 1] + 0.35 * (midX - curX[n - 1]);
                candY = curY[n - 1] + 0.35 * (midY - curY[n - 1]);
            } else {
                const a = angles[i];
                const absA = Math.abs(a);
                const isZigzag =
                    absA >= minRad &&
                    absA <= maxRad &&
                    (a * angles[i - 1] < 0.0 || a * angles[i + 1] < 0.0);
                if (!isZigzag) continue;

                const midX = 0.5 * (curX[i - 1] + curX[i + 1]);
                const midY = 0.5 * (curY[i - 1] + curY[i + 1]);
                candX = curX[i] + 0.6 * (midX - curX[i]);
                candY = curY[i] + 0.6 * (midY - curY[i]);
            }

            const dx0 = candX - origX[i];
            const dy0 = candY - origY[i];
            const dist0 = Math.hypot(dx0, dy0);
            if (dist0 > tolM && dist0 > 1e-12) {
                const scale = tolM / dist0;
                candX = origX[i] + dx0 * scale;
                candY = origY[i] + dy0 * scale;
            }

            if (Math.abs(candX - curX[i]) > 1e-6 || Math.abs(candY - curY[i]) > 1e-6) {
                nxtX[i] = candX;
                nxtY[i] = candY;
                moved = true;
            }
        }

        curX = nxtX;
        curY = nxtY;
        if (!moved) break;
    }

    return [curX, curY];
}

function resamplePolyline(xs, ys, maxStep) {
    const n = xs.length;
    if (n < 2 || maxStep <= 0) return [xs, ys];

    const outX = [xs[0]];
    const outY = [ys[0]];

    for (let i = 0; i < n - 1; i++) {
        const x0 = xs[i], y0 = ys[i];
        const x1 = xs[i + 1], y1 = ys[i + 1];
        const dx = x1 - x0;
        const dy = y1 - y0;
        const segLen = Math.hypot(dx, dy);
        if (segLen > maxStep) {
            const steps = Math.ceil(segLen / maxStep);
            const invSteps = 1.0 / steps;
            for (let s = 1; s < steps; s++) {
                const t = s * invSteps;
                outX.push(x0 + dx * t);
                outY.push(y0 + dy * t);
            }
        }
        outX.push(x1);
        outY.push(y1);
    }

    return [outX, outY];
}

function smoothChaikin(xs, ys, stepM, lockEnds) {
    if (xs.length < 3) return [xs, ys];
    let [rx, ry] = resamplePolyline(xs, ys, Math.max(stepM * 0.75, 1.0));

    for (let pass = 0; pass < 2; pass++) {
        const m = rx.length;
        if (m < 3) break;
        const nx = lockEnds ? [rx[0]] : [];
        const ny = lockEnds ? [ry[0]] : [];
        for (let i = 0; i < m - 1; i++) {
            const x0 = rx[i], y0 = ry[i];
            const x1 = rx[i + 1], y1 = ry[i + 1];
            nx.push(0.75 * x0 + 0.25 * x1, 0.25 * x0 + 0.75 * x1);
            ny.push(0.75 * y0 + 0.25 * y1, 0.25 * y0 + 0.75 * y1);
        }
        if (lockEnds) {
            nx.push(rx[m - 1]);
            ny.push(ry[m - 1]);
        }
        rx = nx;
        ry = ny;
    }

    return [rx, ry];
}

function smoothBSpline(xs, ys, stepM, lockEnds) {
    const n = xs.length;
    if (n < 3) return [xs, ys];

    // Uniform arc-length sampling
    const cum = new Float64Array(n);
    for (let i = 1; i < n; i++) {
        cum[i] = cum[i - 1] + Math.hypot(xs[i] - xs[i - 1], ys[i] - ys[i - 1]);
    }
    const totalLen = cum[n - 1];
    if (totalLen <= stepM * 1.25) return [[xs[0], xs[n - 1]], [ys[0], ys[n - 1]]];

    const numSpans = Math.max(2, Math.round(totalLen / stepM));
    const actualStep = totalLen / numSpans;
    const cx = [xs[0]];
    const cy = [ys[0]];
    let segIdx = 0;

    for (let k = 1; k < numSpans; k++) {
        const targetD = k * actualStep;
        while (segIdx < n - 2 && cum[segIdx + 1] < targetD) segIdx++;
        const spanD = cum[segIdx + 1] - cum[segIdx];
        const t = spanD > 1e-12 ? (targetD - cum[segIdx]) / spanD : 0.0;
        cx.push(xs[segIdx] + (xs[segIdx + 1] - xs[segIdx]) * t);
        cy.push(ys[segIdx] + (ys[segIdx + 1] - ys[segIdx]) * t);
    }
    cx.push(xs[n - 1]);
    cy.push(ys[n - 1]);

    if (cx.length < 3) return [cx, cy];

    const px = [cx[0], cx[0], ...cx, cx[cx.length - 1], cx[cx.length - 1]];
    const py = [cy[0], cy[0], ...cy, cy[cy.length - 1], cy[cy.length - 1]];

    const outX = [cx[0]];
    const outY = [cy[0]];
    const subSteps = 4;
    const inv6 = 1.0 / 6.0;

    for (let i = 0; i < px.length - 3; i++) {
        for (let s = 1; s <= subSteps; s++) {
            const t = s / subSteps;
            const t2 = t * t;
            const t3 = t2 * t;
            const omt = 1.0 - t;

            const b0 = omt * omt * omt * inv6;
            const b1 = (3.0 * t3 - 6.0 * t2 + 4.0) * inv6;
            const b2 = (-3.0 * t3 + 3.0 * t2 + 3.0 * t + 1.0) * inv6;
            const b3 = t3 * inv6;

            outX.push(b0 * px[i] + b1 * px[i + 1] + b2 * px[i + 2] + b3 * px[i + 3]);
            outY.push(b0 * py[i] + b1 * py[i + 1] + b2 * py[i + 2] + b3 * py[i + 3]);
        }
    }

    if (lockEnds) {
        outX[0] = xs[0];
        outY[0] = ys[0];
        outX[outX.length - 1] = xs[n - 1];
        outY[outY.length - 1] = ys[n - 1];
    }

    return [outX, outY];
}

function generalizeByAngle(xs, ys, angleTolDeg) {
    const n = xs.length;
    if (n < 3 || angleTolDeg <= 0) return [xs, ys];

    const tolRad = (angleTolDeg * Math.PI) / 180.0;
    const outX = [xs[0]];
    const outY = [ys[0]];

    for (let i = 1; i < n - 1; i++) {
        const v1x = xs[i] - outX[outX.length - 1];
        const v1y = ys[i] - outY[outY.length - 1];
        const v2x = xs[i + 1] - xs[i];
        const v2y = ys[i + 1] - ys[i];
        if ((v1x === 0 && v1y === 0) || (v2x === 0 && v2y === 0)) continue;

        const turnRad = Math.abs(Math.atan2(v1x * v2y - v1y * v2x, v1x * v2x + v1y * v2y));
        if (turnRad >= tolRad) {
            outX.push(xs[i]);
            outY.push(ys[i]);
        }
    }

    outX.push(xs[n - 1]);
    outY.push(ys[n - 1]);
    return [outX, outY];
}