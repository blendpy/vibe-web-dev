/**
 * JIGSAW SOLITAIRE — Standalone Artwork Generator (jigsaw_artwork.js)
 * Contains all procedural puzzle artworks and custom image scaling.
 */

(function () {
    function buildArtworkCanvas(type, customImg = null, targetCanvas = null) {
        const offCanvas = targetCanvas || document.createElement('canvas');
        const ctx = offCanvas.getContext('2d');

        // 1. Custom User Uploaded or Plant Image (with aspect ratio preservation up to 600px max box)
        if (customImg) {
            const origW = customImg.naturalWidth || customImg.width || 600;
            const origH = customImg.naturalHeight || customImg.height || 600;
            const aspect = origW / origH;
            let w = 600, h = 600;
            if (aspect >= 1.0) {
                w = 600;
                h = Math.max(240, Math.round(600 / aspect));
            } else {
                h = 600;
                w = Math.max(240, Math.round(600 * aspect));
            }
            offCanvas.width = w;
            offCanvas.height = h;
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(customImg, 0, 0, w, h);
            return offCanvas;
        }

        // 2. Classic Geometric Picture (600x600)
        if (type === 'classic' || !type) {
            offCanvas.width = 600;
            offCanvas.height = 600;

            // Background rgb(235, 235, 242)
            ctx.fillStyle = 'rgb(235, 235, 242)';
            ctx.fillRect(0, 0, 600, 600);

            // Subtle grid guide lines so solid areas are easier & prettier to distinguish
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.05)';
            ctx.lineWidth = 2;
            for (let i = 60; i < 600; i += 60) {
                ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 600); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(600, i); ctx.stroke();
            }

            // Center Red Circle: Brush(230, 90, 90), DrawCircle(300, 300, 190)
            ctx.fillStyle = 'rgb(230, 90, 90)';
            ctx.strokeStyle = '#1e1e1e';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(300, 300, 190, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Blue Squares: Brush(90, 160, 230), (80, 80, 160, 160) & (360, 360, 160, 160)
            ctx.fillStyle = 'rgb(90, 160, 230)';
            ctx.fillRect(80, 80, 160, 160);
            ctx.strokeRect(80, 80, 160, 160);
            ctx.fillRect(360, 360, 160, 160);
            ctx.strokeRect(360, 360, 160, 160);

            // Green Corner Triangles: Brush(40, 180, 100)
            ctx.fillStyle = 'rgb(40, 180, 100)';
            const triangles = [
                [[500, 0], [600, 0], [600, 100]],     // Upper right
                [[0, 500], [0, 600], [100, 600]],     // Lower left
                [[0, 0], [100, 0], [0, 100]],         // Upper left
                [[600, 500], [600, 600], [500, 600]]  // Lower right
            ];
            triangles.forEach(pts => {
                ctx.beginPath();
                ctx.moveTo(pts[0][0], pts[0][1]);
                ctx.lineTo(pts[1][0], pts[1][1]);
                ctx.lineTo(pts[2][0], pts[2][1]);
                ctx.closePath();
                ctx.fill();
            });

            // Center Bold Label "JIGSAW SOLITAIRE" in rgb(60, 60, 60)
            ctx.fillStyle = 'rgb(60, 60, 60)';
            ctx.font = '800 34px Inter, Helvetica, Arial, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('JIGSAW SOLITAIRE', 300, 300);

            return offCanvas;
        }

        // 3. Sunset Alpine Peaks (Landscape Aspect Ratio 600x480)
        if (type === 'mountains') {
            offCanvas.width = 600;
            offCanvas.height = 480;

            // Sky gradient
            const sky = ctx.createLinearGradient(0, 0, 0, 320);
            sky.addColorStop(0, '#1e1b4b');
            sky.addColorStop(0.35, '#7e22ce');
            sky.addColorStop(0.7, '#f97316');
            sky.addColorStop(1, '#fde047');
            ctx.fillStyle = sky;
            ctx.fillRect(0, 0, 600, 320);

            // Glowing Sun
            const sunGrad = ctx.createRadialGradient(300, 210, 10, 300, 210, 110);
            sunGrad.addColorStop(0, '#fffbeb');
            sunGrad.addColorStop(0.5, '#fde047');
            sunGrad.addColorStop(1, 'rgba(251, 146, 60, 0)');
            ctx.fillStyle = sunGrad;
            ctx.beginPath();
            ctx.arc(300, 210, 110, 0, Math.PI * 2);
            ctx.fill();

            // Distant Mountain Range
            const drawRange = (points, color) => {
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.moveTo(0, 330);
                points.forEach(([x, y]) => ctx.lineTo(x, y));
                ctx.lineTo(600, 330);
                ctx.closePath();
                ctx.fill();
            };

            drawRange([[0,230],[90,140],[170,200],[260,110],[350,185],[450,95],[540,175],[600,140]], '#581c87');
            drawRange([[0,260],[70,195],[160,245],[235,165],[330,230],[410,155],[510,225],[600,190]], '#3b0764');
            drawRange([[0,295],[110,230],[200,275],[310,210],[420,270],[520,220],[600,265]], '#1e1b4b');

            // Alpine Lake Reflection
            const lake = ctx.createLinearGradient(0, 320, 0, 480);
            lake.addColorStop(0, '#fb923c');
            lake.addColorStop(0.4, '#a855f7');
            lake.addColorStop(1, '#0f172a');
            ctx.fillStyle = lake;
            ctx.fillRect(0, 320, 600, 160);

            // Water ripples
            ctx.fillStyle = 'rgba(254, 240, 138, 0.55)';
            for (let y = 330; y < 470; y += 12) {
                const w = 140 - (y - 330) * 0.7;
                const xOff = Math.sin(y * 0.3) * 12;
                ctx.fillRect(300 - w / 2 + xOff, y, w, 4);
            }

            // Foreground Pine Silhouettes
            ctx.fillStyle = '#090d16';
            for (let x = 15; x < 600; x += 38) {
                if (x > 210 && x < 390) continue; // Keep center lake view open
                const h = 55 + ((x * 17) % 45);
                const base = 335;
                for (let tier = 0; tier < 3; tier++) {
                    ctx.beginPath();
                    ctx.moveTo(x, base - h + tier * 15);
                    ctx.lineTo(x - 18 - tier * 4, base - tier * 10);
                    ctx.lineTo(x + 18 + tier * 4, base - tier * 10);
                    ctx.closePath();
                    ctx.fill();
                }
            }
            return offCanvas;
        }

        // 4. Stained Glass Mandala (Square 600x600)
        if (type === 'lotus') {
            offCanvas.width = 600;
            offCanvas.height = 600;

            const bg = ctx.createRadialGradient(300, 300, 20, 300, 300, 420);
            bg.addColorStop(0, '#fef08a');
            bg.addColorStop(0.35, '#f43f5e');
            bg.addColorStop(0.7, '#6366f1');
            bg.addColorStop(1, '#0f172a');
            ctx.fillStyle = bg;
            ctx.fillRect(0, 0, 600, 600);

            ctx.save();
            ctx.translate(300, 300);

            const rings = [
                { count: 16, rIn: 180, rOut: 280, hueStart: 190, hueStep: 12 },
                { count: 12, rIn: 110, rOut: 190, hueStart: 310, hueStep: 18 },
                { count: 8,  rIn: 45,  rOut: 115, hueStart: 35,  hueStep: 25 }
            ];

            rings.forEach(ring => {
                for (let i = 0; i < ring.count; i++) {
                    const angle = (i * Math.PI * 2) / ring.count;
                    const nextAngle = ((i + 1) * Math.PI * 2) / ring.count;
                    const midAngle = (angle + nextAngle) / 2;

                    ctx.save();
                    const hue = (ring.hueStart + i * ring.hueStep) % 360;
                    ctx.fillStyle = `hsl(${hue}, 85%, 58%)`;
                    ctx.strokeStyle = '#0f172a';
                    ctx.lineWidth = 4;

                    ctx.beginPath();
                    ctx.moveTo(Math.cos(angle) * ring.rIn, Math.sin(angle) * ring.rIn);
                    ctx.quadraticCurveTo(
                        Math.cos(angle) * ring.rOut,
                        Math.sin(angle) * ring.rOut,
                        Math.cos(midAngle) * (ring.rOut + 18),
                        Math.sin(midAngle) * (ring.rOut + 18)
                    );
                    ctx.quadraticCurveTo(
                        Math.cos(nextAngle) * ring.rOut,
                        Math.sin(nextAngle) * ring.rOut,
                        Math.cos(nextAngle) * ring.rIn,
                        Math.sin(nextAngle) * ring.rIn
                    );
                    ctx.closePath();
                    ctx.fill();
                    ctx.stroke();
                    ctx.restore();
                }
            });

            // Center Medallion
            ctx.fillStyle = '#fde047';
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.arc(0, 0, 44, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            ctx.restore();
            return offCanvas;
        }

        // 5. Neon Synthwave Horizon (Square 600x600)
        if (type === 'synthwave') {
            offCanvas.width = 600;
            offCanvas.height = 600;

            const sky = ctx.createLinearGradient(0, 0, 0, 350);
            sky.addColorStop(0, '#090514');
            sky.addColorStop(0.5, '#2e1065');
            sky.addColorStop(1, '#db2777');
            ctx.fillStyle = sky;
            ctx.fillRect(0, 0, 600, 350);

            // Stars
            for (let i = 0; i < 60; i++) {
                const sx = (i * 97) % 600;
                const sy = (i * 53) % 240;
                ctx.fillStyle = i % 3 === 0 ? '#38bdf8' : '#ffffff';
                ctx.fillRect(sx, sy, 3, 3);
            }

            // Retro Segmented Sun
            const sunGrad = ctx.createLinearGradient(0, 110, 0, 330);
            sunGrad.addColorStop(0, '#fde047');
            sunGrad.addColorStop(0.5, '#f97316');
            sunGrad.addColorStop(1, '#ec4899');
            ctx.fillStyle = sunGrad;
            ctx.beginPath();
            ctx.arc(300, 230, 120, 0, Math.PI * 2);
            ctx.fill();

            // Horizontal cutouts across lower sun
            ctx.fillStyle = '#2e1065';
            for (let y = 240; y < 345; y += 18) {
                const stripeH = (y - 230) * 0.08 + 2;
                ctx.fillRect(160, y, 280, stripeH);
            }

            // Floor perspective grid
            ctx.fillStyle = '#110726';
            ctx.fillRect(0, 340, 600, 260);

            ctx.strokeStyle = '#22d3ee';
            ctx.lineWidth = 2;
            // Perspective verticals
            for (let i = -10; i <= 10; i++) {
                ctx.beginPath();
                ctx.moveTo(300 + i * 18, 340);
                ctx.lineTo(300 + i * 95, 600);
                ctx.stroke();
            }
            // Perspective horizontals
            ctx.strokeStyle = '#f43f5e';
            let y = 345;
            let step = 6;
            while (y < 600) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(600, y);
                ctx.stroke();
                y += step;
                step *= 1.25;
            }

            return offCanvas;
        }

        // 6. Starry Lighthouse Harbor (Portrait 480x600)
        if (type === 'harbor') {
            offCanvas.width = 480;
            offCanvas.height = 600;

            const sky = ctx.createLinearGradient(0, 0, 0, 400);
            sky.addColorStop(0, '#020617');
            sky.addColorStop(0.5, '#1e3a8a');
            sky.addColorStop(1, '#0284c7');
            ctx.fillStyle = sky;
            ctx.fillRect(0, 0, 480, 400);

            // Swirling Van Gogh style star halos
            const stars = [[90, 80, 26], [220, 60, 18], [400, 100, 34], [150, 160, 20], [310, 140, 22]];
            stars.forEach(([sx, sy, r]) => {
                const g = ctx.createRadialGradient(sx, sy, 2, sx, sy, r);
                g.addColorStop(0, '#fef9c3');
                g.addColorStop(0.5, '#facc15');
                g.addColorStop(1, 'rgba(250, 204, 21, 0)');
                ctx.fillStyle = g;
                ctx.beginPath();
                ctx.arc(sx, sy, r, 0, Math.PI * 2);
                ctx.fill();
            });

            // Lighthouse Beam
            const beam = ctx.createLinearGradient(130, 195, 480, 120);
            beam.addColorStop(0, 'rgba(254, 240, 138, 0.75)');
            beam.addColorStop(1, 'rgba(254, 240, 138, 0)');
            ctx.fillStyle = beam;
            ctx.beginPath();
            ctx.moveTo(130, 195);
            ctx.lineTo(480, 70);
            ctx.lineTo(480, 250);
            ctx.closePath();
            ctx.fill();

            // Rocky Cliff & Lighthouse Tower
            ctx.fillStyle = '#1e293b';
            ctx.beginPath();
            ctx.moveTo(0, 400);
            ctx.lineTo(0, 320);
            ctx.lineTo(180, 340);
            ctx.lineTo(220, 400);
            ctx.closePath();
            ctx.fill();

            // Lighthouse stripes
            ctx.fillStyle = '#f8fafc';
            ctx.fillRect(112, 200, 36, 140);
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(112, 225, 36, 28);
            ctx.fillRect(112, 280, 36, 28);
            ctx.fillStyle = '#fde047';
            ctx.fillRect(116, 182, 28, 18);

            // Harbor Water
            const sea = ctx.createLinearGradient(0, 400, 0, 600);
            sea.addColorStop(0, '#0369a1');
            sea.addColorStop(1, '#0f172a');
            ctx.fillStyle = sea;
            ctx.fillRect(0, 400, 480, 200);

            // Sailboat on Right
            ctx.fillStyle = '#f97316';
            ctx.beginPath();
            ctx.moveTo(330, 435);
            ctx.lineTo(385, 320);
            ctx.lineTo(385, 435);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = '#facc15';
            ctx.beginPath();
            ctx.moveTo(392, 435);
            ctx.lineTo(392, 345);
            ctx.lineTo(435, 435);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = '#7c2d12';
            ctx.beginPath();
            ctx.moveTo(315, 442);
            ctx.lineTo(445, 442);
            ctx.lineTo(425, 468);
            ctx.lineTo(335, 468);
            ctx.closePath();
            ctx.fill();

            return offCanvas;
        }

        // Fallback to classic if an unknown type is passed
        return buildArtworkCanvas('classic', null, offCanvas);
    }

    // Attach or override methods on ArtworkGenerator so it works whether or not
    // ArtworkGenerator is still declared inside jigsaw.js
    if (typeof ArtworkGenerator !== 'undefined') {
        ArtworkGenerator.createArtwork = function (type, customImg = null) {
            return buildArtworkCanvas(type, customImg, null);
        };
        ArtworkGenerator.renderProcedural = function (type, offCanvas, ctx) {
            buildArtworkCanvas(type, null, offCanvas);
        };
    } else {
        window.ArtworkGenerator = class ArtworkGenerator {
            static createArtwork(type, customImg = null) {
                return buildArtworkCanvas(type, customImg, null);
            }
            static renderProcedural(type, offCanvas, ctx) {
                buildArtworkCanvas(type, null, offCanvas);
            }
        };
    }
})();