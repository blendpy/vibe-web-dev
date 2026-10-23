        // ======================================================================
        // CURATED DEMO PHOTO GENERATOR (High-Res Procedural Photography Art)
        // Guarantees 0ms load time, varied aspect ratios, and taint-free export!
        // ======================================================================
        function createDemoPhotoList() {
            const specs = [
                { name: "Alpine_Sunset.jpg", w: 1200, h: 800, theme: "mountains" },
                { name: "Tokyo_Neon_Night.jpg", w: 800, h: 1100, theme: "city" },
                { name: "Pacific_Coastline.jpg", w: 1200, h: 750, theme: "ocean" },
                { name: "Botanical_Monstera.jpg", w: 900, h: 900, theme: "botanical" },
                { name: "Sahara_Dunes.jpg", w: 1100, h: 750, theme: "desert" },
                { name: "Nordic_Lighthouse.jpg", w: 750, h: 1050, theme: "lighthouse" },
                { name: "Autumn_Birch_Forest.jpg", w: 1000, h: 800, theme: "forest" },
                { name: "Modern_Architecture.jpg", w: 850, h: 1050, theme: "architecture" }
            ];

            return specs.map(spec => {
                const c = document.createElement("canvas");
                c.width = spec.w;
                c.height = spec.h;
                const ctx = c.getContext("2d");
                const W = spec.w;
                const H = spec.h;

                if (spec.theme === "mountains") {
                    const grad = ctx.createLinearGradient(0, 0, 0, H);
                    grad.addColorStop(0, "#1e1b4b");
                    grad.addColorStop(0.45, "#c026d3");
                    grad.addColorStop(0.75, "#f97316");
                    grad.addColorStop(1, "#fde047");
                    ctx.fillStyle = grad;
                    ctx.fillRect(0, 0, W, H);

                    // Sun
                    ctx.fillStyle = "rgba(254, 240, 138, 0.92)";
                    ctx.beginPath();
                    ctx.arc(W * 0.68, H * 0.42, H * 0.14, 0, Math.PI * 2);
                    ctx.fill();

                    // Layered mountain ridges
                    const layers = [
                        { color: "#4c1d95", yBase: 0.55, amp: 0.15, seed: 1.2 },
                        { color: "#311042", yBase: 0.68, amp: 0.12, seed: 2.7 },
                        { color: "#0f172a", yBase: 0.82, amp: 0.08, seed: 4.5 }
                    ];
                    layers.forEach(layer => {
                        ctx.fillStyle = layer.color;
                        ctx.beginPath();
                        ctx.moveTo(0, H);
                        for (let x = 0; x <= W; x += 20) {
                            const y = H * layer.yBase - Math.sin(x * 0.005 + layer.seed) * H * layer.amp - Math.cos(x * 0.013 - layer.seed) * H * (layer.amp * 0.5);
                            ctx.lineTo(x, y);
                        }
                        ctx.lineTo(W, H);
                        ctx.closePath();
                        ctx.fill();
                    });
                } else if (spec.theme === "city") {
                    const grad = ctx.createLinearGradient(0, 0, 0, H);
                    grad.addColorStop(0, "#020617");
                    grad.addColorStop(0.6, "#0f172a");
                    grad.addColorStop(1, "#1e1b4b");
                    ctx.fillStyle = grad;
                    ctx.fillRect(0, 0, W, H);

                    // Glow
                    const radial = ctx.createRadialGradient(W * 0.5, H * 0.65, 20, W * 0.5, H * 0.65, W * 0.7);
                    radial.addColorStop(0, "rgba(56, 189, 248, 0.35)");
                    radial.addColorStop(0.5, "rgba(236, 72, 153, 0.2)");
                    radial.addColorStop(1, "transparent");
                    ctx.fillStyle = radial;
                    ctx.fillRect(0, 0, W, H);

                    // Skyline buildings
                    const blds = [
                        [0.05, 0.45, 0.14], [0.17, 0.30, 0.16], [0.31, 0.22, 0.18],
                        [0.47, 0.35, 0.15], [0.60, 0.18, 0.17], [0.75, 0.38, 0.15], [0.88, 0.48, 0.12]
                    ];
                    blds.forEach(([bx, by, bw], i) => {
                        const x = bx * W, y = by * H, w = bw * W, h = H - y;
                        ctx.fillStyle = i % 2 === 0 ? "#0f172a" : "#1e293b";
                        ctx.fillRect(x, y, w, h);
                        // Windows
                        for (let wy = y + 18; wy < H - 40; wy += 24) {
                            for (let wx = x + 12; wx < x + w - 16; wx += 18) {
                                if (((wx * 13 + wy * 7) % 5) !== 0) {
                                    ctx.fillStyle = ((wx + wy) % 3 === 0) ? "#38bdf8" : "#f472b6";
                                    ctx.fillRect(wx, wy, 8, 12);
                                }
                            }
                        }
                    });
                } else if (spec.theme === "ocean") {
                    const sky = ctx.createLinearGradient(0, 0, 0, H * 0.55);
                    sky.addColorStop(0, "#0284c7");
                    sky.addColorStop(1, "#bae6fd");
                    ctx.fillStyle = sky;
                    ctx.fillRect(0, 0, W, H * 0.55);

                    const sea = ctx.createLinearGradient(0, H * 0.5, 0, H);
                    sea.addColorStop(0, "#0369a1");
                    sea.addColorStop(0.5, "#0d9488");
                    sea.addColorStop(1, "#f59e0b");
                    ctx.fillStyle = sea;
                    ctx.fillRect(0, H * 0.5, W, H * 0.5);

                    // Waves & foam curves
                    for (let i = 0; i < 6; i++) {
                        ctx.strokeStyle = `rgba(255,255,255,${0.35 + i * 0.1})`;
                        ctx.lineWidth = 4 + i * 2;
                        ctx.beginPath();
                        const baseY = H * (0.56 + i * 0.07);
                        for (let x = 0; x <= W; x += 15) {
                            const y = baseY + Math.sin(x * 0.012 + i) * 14;
                            if (x === 0) ctx.moveTo(x, y);
                            else ctx.lineTo(x, y);
                        }
                        ctx.stroke();
                    }
                } else if (spec.theme === "botanical") {
                    const bg = ctx.createLinearGradient(0, 0, W, H);
                    bg.addColorStop(0, "#064e3b");
                    bg.addColorStop(1, "#022c22");
                    ctx.fillStyle = bg;
                    ctx.fillRect(0, 0, W, H);

                    const leaves = [
                        { x: W * 0.3, y: H * 0.35, r: 220, c: "#059669" },
                        { x: W * 0.72, y: H * 0.32, r: 200, c: "#10b981" },
                        { x: W * 0.5, y: H * 0.65, r: 250, c: "#34d399" }
                    ];
                    leaves.forEach(lf => {
                        ctx.fillStyle = lf.c;
                        ctx.beginPath();
                        ctx.ellipse(lf.x, lf.y, lf.r, lf.r * 0.72, -0.4, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.strokeStyle = "#064e3b";
                        ctx.lineWidth = 6;
                        ctx.beginPath();
                        ctx.moveTo(lf.x - lf.r * 0.6, lf.y + lf.r * 0.3);
                        ctx.lineTo(lf.x + lf.r * 0.6, lf.y - lf.r * 0.3);
                        ctx.stroke();
                    });
                } else if (spec.theme === "desert") {
                    const sky = ctx.createLinearGradient(0, 0, 0, H);
                    sky.addColorStop(0, "#fbbf24");
                    sky.addColorStop(0.5, "#f59e0b");
                    sky.addColorStop(1, "#b45309");
                    ctx.fillStyle = sky;
                    ctx.fillRect(0, 0, W, H);

                    ctx.fillStyle = "#fef3c7";
                    ctx.beginPath();
                    ctx.arc(W * 0.25, H * 0.26, 75, 0, Math.PI * 2);
                    ctx.fill();

                    // Sand dunes
                    ctx.fillStyle = "#d97706";
                    ctx.beginPath();
                    ctx.moveTo(0, H);
                    ctx.quadraticCurveTo(W * 0.35, H * 0.38, W, H * 0.68);
                    ctx.lineTo(W, H);
                    ctx.fill();

                    ctx.fillStyle = "#92400e";
                    ctx.beginPath();
                    ctx.moveTo(0, H);
                    ctx.quadraticCurveTo(W * 0.65, H * 0.48, W, H * 0.55);
                    ctx.lineTo(W, H);
                    ctx.fill();
                } else if (spec.theme === "lighthouse") {
                    const sky = ctx.createLinearGradient(0, 0, 0, H);
                    sky.addColorStop(0, "#1e3a8a");
                    sky.addColorStop(0.6, "#60a5fa");
                    sky.addColorStop(1, "#e0f2fe");
                    ctx.fillStyle = sky;
                    ctx.fillRect(0, 0, W, H);

                    // Light beam
                    ctx.fillStyle = "rgba(254, 249, 195, 0.28)";
                    ctx.beginPath();
                    ctx.moveTo(W * 0.5, H * 0.3);
                    ctx.lineTo(0, H * 0.12);
                    ctx.lineTo(0, H * 0.45);
                    ctx.closePath();
                    ctx.fill();

                    // Tower
                    ctx.fillStyle = "#f8fafc";
                    ctx.beginPath();
                    ctx.moveTo(W * 0.44, H * 0.78);
                    ctx.lineTo(W * 0.47, H * 0.28);
                    ctx.lineTo(W * 0.53, H * 0.28);
                    ctx.lineTo(W * 0.56, H * 0.78);
                    ctx.closePath();
                    ctx.fill();

                    ctx.fillStyle = "#dc2626";
                    ctx.fillRect(W * 0.455, H * 0.42, W * 0.09, H * 0.1);
                    ctx.fillRect(W * 0.448, H * 0.60, W * 0.104, H * 0.1);
                    ctx.fillRect(W * 0.46, H * 0.23, W * 0.08, H * 0.05);

                    // Cliff
                    ctx.fillStyle = "#334155";
                    ctx.beginPath();
                    ctx.arc(W * 0.5, H * 0.95, W * 0.38, Math.PI, 0);
                    ctx.fill();
                } else if (spec.theme === "forest") {
                    const bg = ctx.createLinearGradient(0, 0, 0, H);
                    bg.addColorStop(0, "#7c2d12");
                    bg.addColorStop(0.6, "#ea580c");
                    bg.addColorStop(1, "#facc15");
                    ctx.fillStyle = bg;
                    ctx.fillRect(0, 0, W, H);

                    // Birch trunks
                    for (let i = 0; i < 9; i++) {
                        const tx = (i + 0.5) * (W / 9) + Math.sin(i * 3) * 25;
                        const tw = 24 + (i % 3) * 12;
                        ctx.fillStyle = "#f8fafc";
                        ctx.fillRect(tx, 0, tw, H);
                        ctx.fillStyle = "#1e293b";
                        for (let y = 40; y < H; y += 75) {
                            ctx.fillRect(tx, y + (i * 17) % 30, tw * 0.65, 8);
                        }
                    }
                } else {
                    // Modern Architecture
                    const bg = ctx.createLinearGradient(0, 0, W, H);
                    bg.addColorStop(0, "#0f172a");
                    bg.addColorStop(1, "#334155");
                    ctx.fillStyle = bg;
                    ctx.fillRect(0, 0, W, H);

                    const colors = ["#38bdf8", "#818cf8", "#f43f5e", "#fbbf24", "#e2e8f0"];
                    for (let i = 0; i < 7; i++) {
                        ctx.fillStyle = colors[i % colors.length];
                        ctx.beginPath();
                        ctx.moveTo(W * (0.1 + i * 0.12), H);
                        ctx.lineTo(W * (0.28 + i * 0.1), H * (0.15 + (i % 3) * 0.14));
                        ctx.lineTo(W * (0.48 + i * 0.1), H);
                        ctx.closePath();
                        ctx.fill();
                    }
                }

                // Subtle corner vignette for photographic depth
                const vig = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75);
                vig.addColorStop(0, "transparent");
                vig.addColorStop(1, "rgba(0,0,0,0.22)");
                ctx.fillStyle = vig;
                ctx.fillRect(0, 0, W, H);

                return new Photo(spec.name, W, H, 0, c, false);
            });
        }

