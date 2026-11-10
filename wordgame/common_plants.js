/**
 * JIGSAW SOLITAIRE — Standalone Artwork Generator (jigsaw_artwork.js)
 * Contains all procedural puzzle artworks and non-distorting image clipping.
 */
/**
 * JIGSAW & EMOJI SOLITAIRE — Shared Plant Image Loader & Config (jigsaw_plants.js)
 * Manages plant image categories, URL resolution, and dynamic dropdown insertion.
 */

// ============================================================================
// PLANT IMAGE LIST (Supports fruit, fern, cactus, and fungus folders)
// Simply add filenames like "fern-boston.webp" or full URLs to PLANT_IMAGES.
// ============================================================================
const PLANT_BASE_URL = "https://blendpy.github.io/vibe-web-dev/plants/sample/fruit/";
const PLANT_IMAGES = [
    "fruit-calamondin-orange.webp",
    "fruit-blackberry-arapaho.webp",
    "fruit-grape-concord.webp",
    "cactus-ocotillo.webp",
    "cactus-sansevieria-trifasciata.webp",
    "cactus-kingcup-claret-cup.webp",
    "cactus-joshua-tree.webp",
    "fern-asparagus.webp",
    "fern-autumn-brilliance.webp",
    "fern-australian-tree.webp",
    "fern-blue-star.webp",
    "fern-kimberly-queen.webp",
    "fungus-almond-agaricus.webp",
    "fungus-indigo-milk-cap.webp",
    "fungus-pink-oyster.webp",
    "fungus-wine-cap.webp",
    "fungus-blue-oyster.webp",

    // Add more fruit-*, fern-*, cactus-*, or fungus-* filenames here
];

function resolvePlantUrl(entry) {
    if (/^https?:\/\//i.test(entry)) return entry;
    const cleanFile = entry.split('/').pop();
    const prefix = cleanFile.split('-')[0].toLowerCase();
    const validFolders = ['fruit', 'fern', 'cactus', 'fungus'];

    // Replace the trailing folder in PLANT_BASE_URL if the filename starts with fruit-, fern-, cactus-, or fungus-
    if (validFolders.includes(prefix)) {
        const rootSampleUrl = PLANT_BASE_URL.replace(/\/(fruit|fern|cactus|fungus)\/?$/i, '/');
        return `${rootSampleUrl}${prefix}/${cleanFile}`;
    }
    return new URL(entry, PLANT_BASE_URL).href;
}

function loadSharedRandomPlant(appInstance, selectElementId = 'artSelect') {
    if (!PLANT_IMAGES || PLANT_IMAGES.length === 0) return;
    const rawEntry = PLANT_IMAGES[Math.floor(Math.random() * PLANT_IMAGES.length)];
    const url = resolvePlantUrl(rawEntry);

    const cleanFile = rawEntry.split('/').pop().replace(/\.[^/.]+$/, '');
    const parts = cleanFile.split('-');
    const category = parts[0] ? parts[0].toUpperCase() : 'PLANT';
    const plantTitle = (parts.length > 1 ? parts.slice(1) : parts)
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
    const displayName = `🌿 ${plantTitle} (${category})`;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
        appInstance.uploadCounter = (appInstance.uploadCounter || 0) + 1;
        const plantKey = `plant_${appInstance.uploadCounter}`;
        appInstance.uploadedImages.set(plantKey, img);

        const artSelect = document.getElementById(selectElementId);
        if (artSelect) {
            const opt = document.createElement('option');
            opt.value = plantKey;
            opt.textContent = displayName;
            artSelect.insertBefore(opt, artSelect.firstChild);
            artSelect.value = plantKey;
        }

        appInstance.artType = plantKey;
        appInstance.startNewGame(false);
    };
    img.onerror = () => {
        alert(`Could not load plant image specimen: "${plantTitle}" (${rawEntry}).`);
    };
    img.src = url;
}




(function () {
    function buildArtworkCanvas(type, customImg = null, targetCanvas = null) {
        const offCanvas = targetCanvas || document.createElement('canvas');
        offCanvas.width = 600;
        offCanvas.height = 600;
        const ctx = offCanvas.getContext('2d');

        const artKey = (type || 'classic').toString().toLowerCase().trim();

        // 1. Custom User Uploaded or Plant Image (Center-clipped to 600x600 without distortion)
        if (customImg) {
            const origW = customImg.naturalWidth || customImg.width || 600;
            const origH = customImg.naturalHeight || customImg.height || 600;
            const aspect = origW / origH;

            let drawW = 600;
            let drawH = 600;
            let offsetX = 0;
            let offsetY = 0;

            // Center-crop scale (object-fit: cover) to fill 600x600 cleanly
            if (aspect > 1.0) {
                // Wider than tall
                drawW = 600 * aspect;
                offsetX = (600 - drawW) / 2;
            } else {
                // Taller than wide
                drawH = 600 / aspect;
                offsetY = (600 - drawH) / 2;
            }

            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(0, 0, 600, 600);
            ctx.drawImage(customImg, offsetX, offsetY, drawW, drawH);
            return offCanvas;
        }

        // 2. Classic Geometric Picture (600x600)
        if (artKey === 'classic') {
            ctx.fillStyle = 'rgb(235, 235, 242)';
            ctx.fillRect(0, 0, 600, 600);

            ctx.strokeStyle = 'rgba(0, 0, 0, 0.05)';
            ctx.lineWidth = 2;
            for (let i = 60; i < 600; i += 60) {
                ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 600); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(600, i); ctx.stroke();
            }

            ctx.fillStyle = 'rgb(230, 90, 90)';
            ctx.strokeStyle = '#1e1e1e';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(300, 300, 190, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = 'rgb(90, 160, 230)';
            ctx.fillRect(80, 80, 160, 160);
            ctx.strokeRect(80, 80, 160, 160);
            ctx.fillRect(360, 360, 160, 160);
            ctx.strokeRect(360, 360, 160, 160);

            ctx.fillStyle = 'rgb(40, 180, 100)';
            const triangles = [
                [[500, 0], [600, 0], [600, 100]],
                [[0, 500], [0, 600], [100, 600]],
                [[0, 0], [100, 0], [0, 100]],
                [[600, 500], [600, 600], [500, 600]]
            ];
            triangles.forEach(pts => {
                ctx.beginPath();
                ctx.moveTo(pts[0][0], pts[0][1]);
                ctx.lineTo(pts[1][0], pts[1][1]);
                ctx.lineTo(pts[2][0], pts[2][1]);
                ctx.closePath();
                ctx.fill();
            });

            ctx.fillStyle = 'rgb(60, 60, 60)';
            ctx.font = '800 34px Inter, Helvetica, Arial, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('JIGSAW SOLITAIRE', 300, 300);

            return offCanvas;
        }

        // 3. Sunset Alpine Peaks (600x600 Center Clipped)
        if (artKey === 'mountains' || artKey === 'sunset') {
            const sky = ctx.createLinearGradient(0, 0, 0, 320);
            sky.addColorStop(0, '#1e1b4b');
            sky.addColorStop(0.35, '#7e22ce');
            sky.addColorStop(0.7, '#f97316');
            sky.addColorStop(1, '#fde047');
            ctx.fillStyle = sky;
            ctx.fillRect(0, 0, 600, 600);

            const sunGrad = ctx.createRadialGradient(300, 210, 10, 300, 210, 110);
            sunGrad.addColorStop(0, '#fffbeb');
            sunGrad.addColorStop(0.5, '#fde047');
            sunGrad.addColorStop(1, 'rgba(251, 146, 60, 0)');
            ctx.fillStyle = sunGrad;
            ctx.beginPath();
            ctx.arc(300, 210, 110, 0, Math.PI * 2);
            ctx.fill();

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

            const lake = ctx.createLinearGradient(0, 320, 0, 600);
            lake.addColorStop(0, '#fb923c');
            lake.addColorStop(0.4, '#a855f7');
            lake.addColorStop(1, '#0f172a');
            ctx.fillStyle = lake;
            ctx.fillRect(0, 320, 600, 280);
            return offCanvas;
        }

        // 4. Stained Glass Mandala (Square 600x600)
        if (artKey === 'lotus' || artKey === 'mandala') {
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
        if (artKey === 'synthwave') {
            const sky = ctx.createLinearGradient(0, 0, 0, 350);
            sky.addColorStop(0, '#090514');
            sky.addColorStop(0.5, '#2e1065');
            sky.addColorStop(1, '#db2777');
            ctx.fillStyle = sky;
            ctx.fillRect(0, 0, 600, 350);

            for (let i = 0; i < 60; i++) {
                const sx = (i * 97) % 600;
                const sy = (i * 53) % 240;
                ctx.fillStyle = i % 3 === 0 ? '#38bdf8' : '#ffffff';
                ctx.fillRect(sx, sy, 3, 3);
            }

            const sunGrad = ctx.createLinearGradient(0, 110, 0, 330);
            sunGrad.addColorStop(0, '#fde047');
            sunGrad.addColorStop(0.5, '#f97316');
            sunGrad.addColorStop(1, '#ec4899');
            ctx.fillStyle = sunGrad;
            ctx.beginPath();
            ctx.arc(300, 230, 120, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#2e1065';
            for (let y = 240; y < 345; y += 18) {
                const stripeH = (y - 230) * 0.08 + 2;
                ctx.fillRect(160, y, 280, stripeH);
            }

            ctx.fillStyle = '#110726';
            ctx.fillRect(0, 340, 600, 260);

            ctx.strokeStyle = '#22d3ee';
            ctx.lineWidth = 2;
            for (let i = -10; i <= 10; i++) {
                ctx.beginPath();
                ctx.moveTo(300 + i * 18, 340);
                ctx.lineTo(300 + i * 95, 600);
                ctx.stroke();
            }
            return offCanvas;
        }

        // 6. Starry Lighthouse Harbor (600x600 Center Clipped)
        if (artKey === 'harbor' || artKey === 'lighthouse') {
            const sky = ctx.createLinearGradient(0, 0, 0, 400);
            sky.addColorStop(0, '#020617');
            sky.addColorStop(0.5, '#1e3a8a');
            sky.addColorStop(1, '#0284c7');
            ctx.fillStyle = sky;
            ctx.fillRect(0, 0, 600, 600);

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

            return offCanvas;
        }

        return buildArtworkCanvas('classic', null, offCanvas);
    }

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
