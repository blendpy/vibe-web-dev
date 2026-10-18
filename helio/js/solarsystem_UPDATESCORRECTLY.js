// =============================================================
// SOLARSYSTEM.JS - Core 2D Canvas Rendering Engine
// =============================================================

const state = {
  epochMs: Date.now(),
  simSpeed: 1,
  playbackDirection: 1,
  isPlaying: true,
  scaleMode: 'readable',
  activeCategory: 'planets',
  showNodesOverlay: false,
  selectedBodyId: null,
  cameraLockId: null,
  hoveredOrbitId: null,
  pan: { x: 0, y: 0 },
  zoom: 1.0,
  isDragging: false,
  dragStart: { x: 0, y: 0 }
};

let lastRenderTime = performance.now();
let animationFrameId = null;

const canvas = document.getElementById('observatory-canvas') || document.querySelector('canvas');
const ctx = canvas ? canvas.getContext('2d', { alpha: false }) : null;
let dpr = window.devicePixelRatio || 1;

function resizeCanvas() {
  if (!canvas) return;
  const w = window.innerWidth;
  const h = window.innerHeight;
  // Cap DPR to 1.25 to reduce GPU fill-rate workload by ~31% vs 1.5
  dpr = Math.min(window.devicePixelRatio || 1, 1.25);
  canvas.width = Math.floor(w * dpr);
  canvas.height = Math.floor(h * dpr);
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Procedural Asteroid Belt (750 batched particles)
const ASTEROID_CLOUD_COUNT = 750;
const asteroidCloud = [];
for (let i = 0; i < ASTEROID_CLOUD_COUNT; i++) {
  const a = 2.1 + Math.random() * 1.2;
  const angle = Math.random() * Math.PI * 2;
  const speed = 0.0003 + (1 / Math.pow(a, 1.5)) * 0.0007;
  const size = 0.4 + Math.random() * 0.85;
  asteroidCloud.push({ a, angle, speed, size });
}

// Procedural Kuiper Belt (400 batched particles)
const KUIPER_CLOUD_COUNT = 400;
const kuiperCloud = [];
for (let i = 0; i < KUIPER_CLOUD_COUNT; i++) {
  const a = 30 + Math.random() * 20;
  const angle = Math.random() * Math.PI * 2;
  const speed = 0.0003 + (1 / Math.pow(a, 1.5)) * 0.0007;
  const size = 0.3 + Math.random() * 0.7;
  kuiperCloud.push({ a, angle, speed, size });
}

// Procedural Starfield
const STAR_COUNT = 300;
const starfield = [];
for (let i = 0; i < STAR_COUNT; i++) {
  starfield.push({
    x: Math.random(),
    y: Math.random(),
    radius: 0.4 + Math.random() * 1.1,
    alpha: 0.15 + Math.random() * 0.7,
    twinkleSpeed: 0.002 + Math.random() * 0.004,
    phase: Math.random() * Math.PI * 2
  });
}

function auToScreen(xAU, yAU) {
  if (!canvas) return { x: 0, y: 0 };
  const centerX = (canvas.width / 2) / dpr + state.pan.x;
  const centerY = (canvas.height / 2) / dpr + state.pan.y;

  let screenX, screenY;
  if (state.scaleMode === 'readable') {
    const rAU = Math.hypot(xAU, yAU);
    const angle = Math.atan2(yAU, xAU);
    const rScreen = rAU === 0 ? 0 : Math.pow(rAU, 0.47) * 92 * state.zoom;
    screenX = centerX + Math.cos(angle) * rScreen;
    screenY = centerY + Math.sin(angle) * rScreen;
  } else {
    const scalePx = 48 * state.zoom;
    screenX = centerX + xAU * scalePx;
    screenY = centerY + yAU * scalePx;
  }
  return { x: screenX, y: screenY };
}

// Raw 3D AU Orbit Cache (Key: `${bodyId}_${century}`)
const rawOrbitCache = new Map();

function getCachedOrbitPointsAU(body, epochMs, segments = 64) {
  const dDays = (epochMs - 946728000000) / 86400000;
  const T = dDays / 36525;
  // Cache key quantizes by ~100 years so geometry only updates over deep time
  const cacheKey = `${body.id}_${segments}_${Math.floor(T)}`;
  
  if (rawOrbitCache.has(cacheKey)) {
    return rawOrbitCache.get(cacheKey);
  }

  const ptsAU = [];
  const a = body.a0 + (body.aRate || 0) * T;
  const e = body.e0 + (body.eRate || 0) * T;
  const I_deg = body.I0 + (body.IRate || 0) * T;
  const longPeri_deg = body.longPeri0 + (body.longPeriRate || 0) * T;
  const node_deg = body.node0 + (body.nodeRate || 0) * T;

  const I = I_deg * (Math.PI / 180);
  const node = node_deg * (Math.PI / 180);
  const omega = (longPeri_deg - node_deg) * (Math.PI / 180);
  const b = a * Math.sqrt(Math.max(0, 1 - e * e));

  for (let i = 0; i <= segments; i++) {
    const E = (i / segments) * Math.PI * 2;
    const x_orb = a * (Math.cos(E) - e);
    const y_orb = b * Math.sin(E);

    const x_ecl = (Math.cos(omega) * Math.cos(node) - Math.sin(omega) * Math.sin(node) * Math.cos(I)) * x_orb +
                  (-Math.sin(omega) * Math.cos(node) - Math.cos(omega) * Math.sin(node) * Math.cos(I)) * y_orb;
    const y_ecl = (Math.cos(omega) * Math.sin(node) + Math.sin(omega) * Math.cos(node) * Math.cos(I)) * x_orb +
                  (-Math.sin(omega) * Math.sin(node) + Math.cos(omega) * Math.cos(node) * Math.cos(I)) * y_orb;
    const z_ecl = (Math.sin(omega) * Math.sin(I)) * x_orb + (Math.cos(omega) * Math.sin(I)) * y_orb;

    ptsAU.push({ xAU: x_ecl, yAU: y_ecl, zAU: z_ecl });
  }

  rawOrbitCache.set(cacheKey, ptsAU);
  return ptsAU;
}

function generateOrbitSegments(body, epochMs, segments = 64) {
  const ptsAU = getCachedOrbitPointsAU(body, epochMs, segments);
  const pts = new Array(ptsAU.length);
  for (let i = 0; i < ptsAU.length; i++) {
    const scr = auToScreen(ptsAU[i].xAU, ptsAU[i].yAU);
    pts[i] = { x: scr.x, y: scr.y, zAU: ptsAU[i].zAU };
  }
  return pts;
}
let calculatedPositions = {};
let renderElapsed = 0;

function render(timestamp) {
  if (!ctx) return;
  animationFrameId = requestAnimationFrame(render);

  const elapsed = timestamp - lastRenderTime;
  const dt = Math.min(elapsed / 1000, 0.1);
  lastRenderTime = timestamp;

  // 1. Advance Epoch in ALL views
  if (state.isPlaying) {
    state.epochMs += (state.playbackDirection * state.simSpeed * dt * 1000);
  }

  // 2. Keep the selected body coordinates up-to-date
  if (state.selectedBodyId && CELESTIAL_BODIES[state.selectedBodyId]) {
    calculatedPositions[state.selectedBodyId] = calculateHeliocentricPosition(
      CELESTIAL_BODIES[state.selectedBodyId], 
      state.epochMs
    );
  }

  // 3. IF IN 3D MODE: Skip all expensive canvas rendering passes!
  if (canvas.classList.contains('hidden')) {
    return;
  }


  // Smooth Camera Tracking (2D only)
  if (state.cameraLockId) {
    let targetXAU = 0, targetYAU = 0;
    if (state.cameraLockId !== 'sun' && CELESTIAL_BODIES[state.cameraLockId]) {
      const targetPos = calculateHeliocentricPosition(CELESTIAL_BODIES[state.cameraLockId], state.epochMs);
      targetXAU = targetPos.xAU;
      targetYAU = targetPos.yAU;
    }

    let targetOffset;
    if (state.scaleMode === 'readable') {
      const rAU = Math.hypot(targetXAU, targetYAU);
      const angle = Math.atan2(targetYAU, targetXAU);
      const rScreen = rAU === 0 ? 0 : Math.pow(rAU, 0.47) * 92 * state.zoom;
      targetOffset = { x: -Math.cos(angle) * rScreen, y: -Math.sin(angle) * rScreen };
    } else {
      const scalePx = 48 * state.zoom;
      targetOffset = { x: -targetXAU * scalePx, y: -targetYAU * scalePx };
    }

    state.pan.x += (targetOffset.x - state.pan.x) * 0.1;
    state.pan.y += (targetOffset.y - state.pan.y) * 0.1;
  }

  // Calculate instantaneous positions for active categories
  calculatedPositions = {};
  for (const [key, body] of Object.entries(CELESTIAL_BODIES)) {
    calculatedPositions[key] = calculateHeliocentricPosition(body, state.epochMs);
  }

  // Clear Frame
  ctx.save();
  ctx.scale(dpr, dpr);
  ctx.fillStyle = '#02040a';
  ctx.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr);

  drawStarfield(timestamp);
  drawEclipticGrid();
  
  // Batched Particle Clouds
  drawAsteroidBelt();
  drawKuiperBelt();

  // Draw Orbits & Bodies
  for (const key of CATEGORIES.planets) {
    const isHovered = (state.hoveredOrbitId === key);
    const isSelected = (state.selectedBodyId === key);
    const isCurrentCategory = (state.activeCategory === 'planets');
    drawTwoToneOrbit(CELESTIAL_BODIES[key], isHovered, isSelected, isCurrentCategory, false);
  }

  if (state.activeCategory !== 'planets') {
    for (const key of CATEGORIES[state.activeCategory]) {
      const isHovered = (state.hoveredOrbitId === key);
      const isSelected = (state.selectedBodyId === key);
      const isComet = (state.activeCategory === 'comets');
      drawTwoToneOrbit(CELESTIAL_BODIES[key], isHovered, isSelected, true, isComet);
    }
  }

  drawSun(timestamp);

  for (const key of CATEGORIES.planets) {
    drawCelestialBody(CELESTIAL_BODIES[key], calculatedPositions[key], timestamp);
  }
  if (state.activeCategory !== 'planets') {
    for (const key of CATEGORIES[state.activeCategory]) {
      drawCelestialBody(CELESTIAL_BODIES[key], calculatedPositions[key], timestamp);
    }
  }

  ctx.restore();
  
  if (typeof updateHUD === 'function') updateHUD();
}

function drawStarfield(timestamp) {
  const w = canvas.width / dpr;
  const h = canvas.height / dpr;
  for (let i = 0; i < starfield.length; i++) {
    const s = starfield[i];
    const sx = (s.x * w + state.pan.x * 0.04) % w;
    const sy = (s.y * h + state.pan.y * 0.04) % h;
    const fx = sx < 0 ? sx + w : sx;
    const fy = sy < 0 ? sy + h : sy;
    const alpha = s.alpha * (0.65 + 0.35 * Math.sin(timestamp * s.twinkleSpeed + s.phase));
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha.toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(fx, fy, s.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawEclipticGrid() {
  const center = auToScreen(0, 0);
  const ringAUs = [1, 5.2, 10, 30, 50];
  ctx.lineWidth = 1;
  ctx.setLineDash([2, 5]);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)';
  for (const au of ringAUs) {
    const pt = auToScreen(au, 0);
    const r = Math.abs(pt.x - center.x);
    ctx.beginPath();
    ctx.arc(center.x, center.y, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.setLineDash([]);
}

function drawAsteroidBelt() {
  ctx.fillStyle = 'rgba(203, 213, 225, 0.32)';
  ctx.beginPath();
  for (let i = 0; i < asteroidCloud.length; i++) {
    const p = asteroidCloud[i];
    const curAngle = p.angle + (state.epochMs * 0.00000000008 * p.speed);
    const scr = auToScreen(p.a * Math.cos(curAngle), p.a * Math.sin(curAngle));
    ctx.moveTo(scr.x + p.size, scr.y);
    ctx.arc(scr.x, scr.y, p.size, 0, Math.PI * 2);
  }
  ctx.fill();
}

function drawKuiperBelt() {
  ctx.fillStyle = 'rgba(160, 210, 255, 0.12)';
  ctx.beginPath();
  for (let i = 0; i < kuiperCloud.length; i++) {
    const p = kuiperCloud[i];
    const curAngle = p.angle + (state.epochMs * 0.00000000008 * p.speed);
    const scr = auToScreen(p.a * Math.cos(curAngle), p.a * Math.sin(curAngle));
    ctx.moveTo(scr.x + p.size, scr.y);
    ctx.arc(scr.x, scr.y, p.size, 0, Math.PI * 2);
  }
  ctx.fill();
}

function drawTwoToneOrbit(body, isHovered, isSelected, isProminent, isComet = false) {
  const pts = generateOrbitSegments(body, state.epochMs, 64);
  if (pts.length < 2) return;

  const shouldShowNodes = (isSelected || isHovered || (state.showNodesOverlay && isProminent)) && (body.I0 > 0.4);
  const strokeColor = body.color;

  // Base glow underneath if selected or hovered
  if (isSelected || isHovered) {
    ctx.beginPath();
    for (let i = 0; i < pts.length; i++) {
      if (i === 0) ctx.moveTo(pts[i].x, pts[i].y);
      else ctx.lineTo(pts[i].x, pts[i].y);
    }
    ctx.strokeStyle = isSelected ? (body.glow || 'rgba(56,189,248,0.25)') : 'rgba(56,189,248,0.25)';
    ctx.lineWidth = isSelected ? 5.5 : 4.5;
    ctx.stroke();
  }

  const aboveLineWidth = isSelected ? 2.6 : (isHovered ? 2.0 : (isProminent ? 1.4 : 1.0));
  const belowLineWidth = aboveLineWidth * 0.85;

  // Smooth contiguous multi-segment stroke
  let currentAbove = null;
  for (let i = 0; i < pts.length - 1; i++) {
    const isAbove = ((pts[i].zAU + pts[i + 1].zAU) / 2 >= 0);
    if (isAbove !== currentAbove) {
      if (currentAbove !== null) ctx.stroke();
      ctx.beginPath();
      currentAbove = isAbove;
      if (isAbove) {
        ctx.strokeStyle = isSelected ? strokeColor : (isHovered ? '#38bdf8' : (isProminent ? strokeColor : 'rgba(255, 255, 255, 0.16)'));
        ctx.lineWidth = aboveLineWidth;
        ctx.setLineDash([]);
      } else {
        ctx.strokeStyle = isSelected ? strokeColor : (isHovered ? '#38bdf8' : (isProminent ? 'rgba(255, 255, 255, 0.28)' : 'rgba(255, 255, 255, 0.07)'));
        ctx.lineWidth = belowLineWidth;
        ctx.setLineDash(isSelected ? [4, 4] : (isHovered ? [4, 4] : (isProminent ? [3, 4] : [2, 3])));
      }
      ctx.moveTo(pts[i].x, pts[i].y);
    }
    ctx.lineTo(pts[i + 1].x, pts[i + 1].y);
  }
  ctx.stroke();
  ctx.setLineDash([]);

  // Draw Line of Nodes
  if (shouldShowNodes) {
    const nodes = calculateOrbitalNodes(body, state.epochMs);
    const pAsc = auToScreen(nodes.asc.xAU, nodes.asc.yAU);
    const pDesc = auToScreen(nodes.desc.xAU, nodes.desc.yAU);
    const pSun = auToScreen(0, 0);

    ctx.beginPath();
    ctx.moveTo(pDesc.x, pDesc.y);
    ctx.lineTo(pSun.x, pSun.y);
    ctx.lineTo(pAsc.x, pAsc.y);
    ctx.strokeStyle = isSelected ? 'rgba(56, 189, 248, 0.55)' : 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1.0;
    ctx.setLineDash([2, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

    drawNodeBadge(pAsc.x, pAsc.y, '☊', '#34d399', isSelected || isHovered);
    drawNodeBadge(pDesc.x, pDesc.y, '☋', '#fbbf24', isSelected || isHovered);
  }
}

function drawNodeBadge(x, y, symbol, color, showTextLabel) {
  ctx.save();
  ctx.fillStyle = '#060b14';
  ctx.beginPath();
  ctx.arc(x, y, 6.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.font = 'bold 9px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(symbol, x, y);
  if (showTextLabel) {
    ctx.font = '600 9px "Space Grotesk", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(symbol === '☊' ? 'Ascending (☊)' : 'Descending (☋)', x, y + 12);
  }
  ctx.restore();
}

function drawSun(timestamp) {
  const scr = auToScreen(0, 0);
  const isSelected = (state.selectedBodyId === 'sun');
  const pulse = 1 + 0.04 * Math.sin(timestamp * 0.003);

  const grad = ctx.createRadialGradient(scr.x, scr.y, 4, scr.x, scr.y, 40 * pulse);
  grad.addColorStop(0, 'rgba(251, 191, 36, 0.9)');
  grad.addColorStop(0.25, 'rgba(245, 158, 11, 0.35)');
  grad.addColorStop(0.65, 'rgba(234, 88, 12, 0.08)');
  grad.addColorStop(1, 'rgba(234, 88, 12, 0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(scr.x, scr.y, 40 * pulse, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#fef08a';
  ctx.beginPath();
  ctx.arc(scr.x, scr.y, 11, 0, Math.PI * 2);
  ctx.fill();

  if (isSelected) {
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(scr.x, scr.y, 18, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawCelestialBody(body, pos, timestamp) {
  const scr = auToScreen(pos.xAU, pos.yAU);
  const isSelected = (state.selectedBodyId === body.id);
  const isHovered = (state.hoveredOrbitId === body.id);
  const baseR = Math.max(3.0, body.radius * Math.min(1.5, Math.max(0.65, state.zoom * 0.85)));

  // Comet tail
  if (body.isComet && pos.rAU < 4.2) {
    const sunScr = auToScreen(0, 0);
    const dx = scr.x - sunScr.x;
    const dy = scr.y - sunScr.y;
    const dLen = Math.hypot(dx, dy);

    if (dLen > 0.001) {
      const dirX = dx / dLen;
      const dirY = dy / dLen;
      const tailLen = Math.min(140, Math.max(25, (4.2 - pos.rAU) * 38 * state.zoom));

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(scr.x, scr.y);
      ctx.lineTo(scr.x + dirX * tailLen, scr.y + dirY * tailLen);
      ctx.strokeStyle = 'rgba(103, 232, 249, 0.75)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(scr.x, scr.y);
      const spread = tailLen * 0.18;
      ctx.lineTo(scr.x + dirX * tailLen + dirY * spread, scr.y + dirY * tailLen - dirX * spread);
      ctx.lineTo(scr.x + dirX * tailLen - dirY * spread, scr.y + dirY * tailLen + dirX * spread);
      ctx.closePath();

      const tailGrad = ctx.createLinearGradient(scr.x, scr.y, scr.x + dirX * tailLen, scr.y + dirY * tailLen);
      tailGrad.addColorStop(0, 'rgba(255, 255, 255, 0.65)');
      tailGrad.addColorStop(0.3, 'rgba(103, 232, 249, 0.25)');
      tailGrad.addColorStop(1, 'rgba(103, 232, 249, 0)');
      ctx.fillStyle = tailGrad;
      ctx.fill();
      ctx.restore();
    }
  }

  if (isSelected || isHovered) {
    ctx.fillStyle = body.glow;
    ctx.beginPath();
    ctx.arc(scr.x, scr.y, baseR + 7, 0, Math.PI * 2);
    ctx.fill();
  }

  if (body.isOval) {
    ctx.save();
    ctx.translate(scr.x, scr.y);
    ctx.rotate(0.45);
    ctx.fillStyle = body.color;
    ctx.beginPath();
    ctx.ellipse(0, 0, baseR * 1.5, baseR * 0.75, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else if (body.isContactBinary) {
    ctx.save();
    ctx.translate(scr.x, scr.y);
    ctx.rotate(0.3);
    ctx.fillStyle = '#fb7185';
    ctx.beginPath();
    ctx.arc(-baseR * 0.45, 0, baseR * 0.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f43f5e';
    ctx.beginPath();
    ctx.arc(baseR * 0.55, 0, baseR * 0.58, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fecdd3';
    ctx.ellipse(0, 0, baseR * 0.2, baseR * 0.45, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else if (body.hasRings) {
    ctx.save();
    ctx.translate(scr.x, scr.y);
    ctx.rotate(-0.35);
    ctx.strokeStyle = 'rgba(234, 179, 8, 0.45)';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.ellipse(0, 0, baseR * 2.2, baseR * 0.85, 0, Math.PI, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = body.color;
    ctx.beginPath();
    ctx.arc(scr.x, scr.y, baseR, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.translate(scr.x, scr.y);
    ctx.rotate(-0.35);
    ctx.strokeStyle = 'rgba(234, 179, 8, 0.75)';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.ellipse(0, 0, baseR * 2.2, baseR * 0.85, 0, 0, Math.PI);
    ctx.stroke();
    ctx.restore();
  } else if (body.id === 'earth') {
    ctx.fillStyle = body.color;
    ctx.beginPath();
    ctx.arc(scr.x, scr.y, baseR, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(96, 165, 250, 0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(scr.x, scr.y, baseR + 1.2, 0, Math.PI * 2);
    ctx.stroke();

    const moonAngle = (state.epochMs / (27.3 * 86400000)) * Math.PI * 2;
    const moonDist = baseR + 6;
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.arc(scr.x + Math.cos(moonAngle) * moonDist, scr.y + Math.sin(moonAngle) * moonDist, 1.2, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = body.color;
    ctx.beginPath();
    ctx.arc(scr.x, scr.y, baseR, 0, Math.PI * 2);
    ctx.fill();
  }

  if (isSelected) {
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(scr.x, scr.y, baseR + 5, 0, Math.PI * 2);
    ctx.stroke();
  }

  const showLabel = isSelected || isHovered || state.zoom > 1.1 || body.category === 'planets';
  if (showLabel) {
    ctx.font = '500 10px "Space Grotesk", sans-serif';
    ctx.fillStyle = isSelected ? '#38bdf8' : (isHovered ? '#ffffff' : 'rgba(255, 255, 255, 0.7)');
    ctx.textAlign = 'center';
    ctx.fillText(body.name, scr.x, scr.y - baseR - 5);
  }
}

function distToSegment(px, py, x1, y1, x2, y2) {
  const l2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
  if (l2 === 0) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
}

let lastHoverCheckTime = 0;
function findOrbitAtScreenPoint(screenX, screenY) {
  const tolerance = 9.5;
  const sunCenter = auToScreen(0, 0);
  const mouseDistFromSun = Math.hypot(screenX - sunCenter.x, screenY - sunCenter.y);
  const candidateKeys = Array.from(new Set([...CATEGORIES[state.activeCategory], ...CATEGORIES.planets]));

  for (const key of candidateKeys) {
    const body = CELESTIAL_BODIES[key];
    const pts = generateOrbitSegments(body, state.epochMs, 48);

    let minR = Infinity, maxR = -Infinity;
    for (let i = 0; i < pts.length; i++) {
      const d = Math.hypot(pts[i].x - sunCenter.x, pts[i].y - sunCenter.y);
      if (d < minR) minR = d;
      if (d > maxR) maxR = d;
    }
    if (mouseDistFromSun < minR - tolerance || mouseDistFromSun > maxR + tolerance) continue;

    for (let i = 0; i < pts.length - 1; i++) {
      if (distToSegment(screenX, screenY, pts[i].x, pts[i].y, pts[i + 1].x, pts[i + 1].y) <= tolerance) {
        return key;
      }
    }
  }
  return null;
}

function findBodyAtScreenPoint(screenX, screenY) {
  const sun = auToScreen(0, 0);
  if (Math.hypot(screenX - sun.x, screenY - sun.y) < 18) return 'sun';

  const activeKeys = Array.from(new Set([...CATEGORIES[state.activeCategory], ...CATEGORIES.planets]));
  for (const key of activeKeys) {
    const body = CELESTIAL_BODIES[key];
    const pos = calculateHeliocentricPosition(body, state.epochMs);
    const scr = auToScreen(pos.xAU, pos.yAU);
    const radius = Math.max(7, body.radius * Math.min(1.6, Math.max(0.7, state.zoom * 0.8)));
    if (Math.hypot(screenX - scr.x, screenY - scr.y) <= radius + 6) return key;
  }
  return null;
}

function isPointInWorkspace(screenX, screenY) {
  const W = window.innerWidth;
  const H = window.innerHeight;
  const drawerW = (W >= 1024) ? 420 : ((W >= 640) ? 380 : 0);
  const minX = 40;
  const maxX = (W >= 640) ? (W - drawerW - 40) : (W - 40);
  const minY = 95;
  const maxY = H - 55;

  if (screenX < minX || screenX > maxX || screenY < minY || screenY > maxY) return false;

  const epochRight = (W < 640) ? 310 : 355;
  const epochTop = H - 215;
  if (screenX < epochRight && screenY > epochTop) return false;

  return true;
}

function getBodyScreenPosition(bodyId) {
  if (!bodyId) return null;
  if (bodyId === 'sun') return auToScreen(0, 0);
  const body = CELESTIAL_BODIES[bodyId];
  if (!body) return null;
  const pos = calculateHeliocentricPosition(body, state.epochMs);
  return auToScreen(pos.xAU, pos.yAU);
}

function getWorkspaceCenter() {
  const W = window.innerWidth;
  const H = window.innerHeight;
  const drawerW = (W >= 1024) ? 420 : ((W >= 640) ? 380 : 0);
  const availWidth = (W >= 640) ? (W - drawerW) : W;
  return { x: availWidth / 2, y: (85 + H) / 2 };
}

let cameraTweenAnimationId = null;

function animateCameraTo(targetPanX, targetPanY, targetZoom, duration = 750) {
  if (cameraTweenAnimationId) {
    cancelAnimationFrame(cameraTweenAnimationId);
    cameraTweenAnimationId = null;
  }

  const startPanX = state.pan.x;
  const startPanY = state.pan.y;
  const startZoom = state.zoom;
  const startTime = performance.now();

  function stepCamera(now) {
    const elapsed = now - startTime;
    const progress = Math.min(1, elapsed / duration);
    const ease = 1 - Math.pow(1 - progress, 3);

    state.pan.x = startPanX + (targetPanX - startPanX) * ease;
    state.pan.y = startPanY + (targetPanY - startPanY) * ease;
    state.zoom = startZoom + (targetZoom - startZoom) * ease;

    if (progress < 1) cameraTweenAnimationId = requestAnimationFrame(stepCamera);
    else cameraTweenAnimationId = null;
  }
  cameraTweenAnimationId = requestAnimationFrame(stepCamera);
}

function zoomAndPanToBody(bodyId) {
  state.cameraLockId = null;
  if (typeof updateCameraLockUI === 'function') updateCameraLockUI();

  let targetXAU = 0, targetYAU = 0, rAU = 1.0;
  if (bodyId !== 'sun' && CELESTIAL_BODIES[bodyId]) {
    const pos = calculateHeliocentricPosition(CELESTIAL_BODIES[bodyId], state.epochMs);
    targetXAU = pos.xAU;
    targetYAU = pos.yAU;
    rAU = Math.max(0.25, pos.rAU);
  }

  let targetZoom;
  if (bodyId === 'sun') {
    targetZoom = Math.min(2.0, Math.max(0.9, state.zoom));
  } else if (state.scaleMode === 'readable') {
    const idealZoom = 280 / (Math.pow(rAU, 0.47) * 92);
    targetZoom = Math.min(1.75, Math.max(0.25, idealZoom));
  } else {
    const idealZoom = 300 / (rAU * 48);
    targetZoom = Math.min(2.2, Math.max(0.12, idealZoom));
  }

  let offX = 0, offY = 0;
  if (bodyId !== 'sun') {
    if (state.scaleMode === 'readable') {
      const rScreen = Math.pow(rAU, 0.47) * 92 * targetZoom;
      const angle = Math.atan2(targetYAU, targetXAU);
      offX = Math.cos(angle) * rScreen;
      offY = Math.sin(angle) * rScreen;
    } else {
      const scalePx = 48 * targetZoom;
      offX = targetXAU * scalePx;
      offY = targetYAU * scalePx;
    }
  }

  const wsCenter = getWorkspaceCenter();
  const canvasCenterX = (canvas.width / 2) / dpr;
  const canvasCenterY = (canvas.height / 2) / dpr;
  const targetPanX = wsCenter.x - canvasCenterX - offX;
  const targetPanY = wsCenter.y - canvasCenterY - offY;

  animateCameraTo(targetPanX, targetPanY, targetZoom, 750);
}

function handleSelectCelestialBody(bodyId) {
  if (!bodyId) return;
  const currentPos = getBodyScreenPosition(bodyId);
  const isVisible = currentPos && isPointInWorkspace(currentPos.x, currentPos.y);

  if (typeof selectBody === 'function') selectBody(bodyId);

  if (!isVisible) {
    zoomAndPanToBody(bodyId);
  }
}

let isTransitioning = false;
function zoomToPlanet3D(targetId) {
  if (isTransitioning || !targetId || targetId === 'sun') return;
  const targetBody = CELESTIAL_BODIES[targetId];
  if (!targetBody) return;

  if (typeof selectBody === 'function') selectBody(targetId);

  // In-Memory Handoff through HeliosBridge
  if (window.HeliosBridge && typeof window.HeliosBridge.enterInspectorView === 'function') {
    window.HeliosBridge.enterInspectorView(targetId);
    return;
  }
  if (typeof window.enterInspectorView === 'function') {
    window.enterInspectorView(targetId);
    return;
  }

  window.location.href = `terra3d.html?planet=${encodeURIComponent(targetId)}&epoch=${state.epochMs}`;
}

// Canvas Interaction Listeners
if (canvas) {
  canvas.addEventListener('dblclick', (e) => {
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const clickedBody = findBodyAtScreenPoint(clickX, clickY);
    if (clickedBody && clickedBody !== 'sun') {
      zoomToPlanet3D(clickedBody);
      return;
    }
    const clickedOrbit = findOrbitAtScreenPoint(clickX, clickY);
    if (clickedOrbit) {
      zoomToPlanet3D(clickedOrbit);
    }
  });

  canvas.addEventListener('mousedown', (e) => {
    if (cameraTweenAnimationId) {
      cancelAnimationFrame(cameraTweenAnimationId);
      cameraTweenAnimationId = null;
    }
    state.isDragging = true;
    state.dragStart = { x: e.clientX, y: e.clientY };
  });

  window.addEventListener('mousemove', (e) => {
    if (state.isDragging) {
      state.pan.x += e.clientX - state.dragStart.x;
      state.pan.y += e.clientY - state.dragStart.y;
      state.dragStart = { x: e.clientX, y: e.clientY };
      state.cameraLockId = null;
      if(typeof updateCameraLockUI === 'function') updateCameraLockUI();
    }
    
    // Throttled orbit hover check to keep frame-rates high
    const now = performance.now();
    if (now - lastHoverCheckTime > 30) {
      lastHoverCheckTime = now;
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const hoveredOrbit = findOrbitAtScreenPoint(mouseX, mouseY);
      state.hoveredOrbitId = hoveredOrbit;

      const hoverHud = document.getElementById('orbit-hover-hud');
      if (hoverHud) {
        if (hoveredOrbit && CELESTIAL_BODIES[hoveredOrbit]) {
          const b = CELESTIAL_BODIES[hoveredOrbit];
          hoverHud.style.left = `${e.clientX}px`;
          hoverHud.style.top = `${e.clientY - 12}px`;
          const nameEl = document.getElementById('hover-planet-name');
          if (nameEl) nameEl.textContent = b.name;
          const tagEl = document.getElementById('hover-planet-tag');
          if (tagEl) tagEl.textContent = b.category === 'comets' ? 'COMET' : (b.category === 'asteroids' ? 'ASTEROID' : (b.category === 'kbos' ? 'KBO' : 'ORBIT'));
          const indEl = document.getElementById('hover-planet-indicator');
          if (indEl) indEl.style.backgroundColor = b.color;
          hoverHud.classList.remove('hidden');
          canvas.style.cursor = 'pointer';
        } else {
          hoverHud.classList.add('hidden');
          canvas.style.cursor = state.isDragging ? 'grabbing' : 'grab';
        }
      }
    }
  });

  window.addEventListener('mouseup', (e) => {
    if (state.isDragging) {
      state.isDragging = false;
      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      const clickedBody = findBodyAtScreenPoint(clickX, clickY);
      if (clickedBody) {
        if (typeof selectBody === 'function') selectBody(clickedBody);
        return;
      }
      const clickedOrbit = findOrbitAtScreenPoint(clickX, clickY);
      if (clickedOrbit) {
        if (typeof selectBody === 'function') selectBody(clickedOrbit);
        return;
      }
    }
    state.isDragging = false;
  });

  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
    state.zoom = Math.max(0.12, Math.min(22.0, state.zoom * zoomFactor));
  }, { passive: false });
}

// Auto-start immediately
function startHeliosEngine() {
  if(typeof populateCategoryDock === 'function') populateCategoryDock('planets');
  if(typeof updatePlaybackUI === 'function') updatePlaybackUI();
  if (!animationFrameId) {
    lastRenderTime = performance.now();
    animationFrameId = requestAnimationFrame(render);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startHeliosEngine);
} else {
  startHeliosEngine();
}


// Put 2D Solar System to sleep
window.sleepSolarSystem = function() {
  state.isPlaying = false;
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
  const canvas = document.getElementById('observatory-canvas');
  if (canvas) canvas.classList.add('hidden');
};

// Wake up 2D Solar System
window.wakeSolarSystem = function() {
  const canvas = document.getElementById('observatory-canvas');
  if (canvas) canvas.classList.remove('hidden');

  state.isPlaying = true;
  lastRenderTime = performance.now();
  if (!animationFrameId) {
    animationFrameId = requestAnimationFrame(render);
  }
};

// Ensure this runs after the DOM and the WebGL renderer are ready
document.addEventListener('DOMContentLoaded', () => {
  const webglContainer = document.getElementById('webgl-container'); // Or whatever holds your canvas
  
  if (webglContainer) {
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    webglContainer.addEventListener('dblclick', (event) => {
      // Ensure global camera and scene variables exist before proceeding
      if (typeof camera === 'undefined' || typeof scene === 'undefined') return;
      
      // Calculate mouse position relative to the canvas
      const rect = webglContainer.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      // Shoot ray from camera
      raycaster.setFromCamera(mouse, camera);

      // Intersect against all objects in the scene
      const intersects = raycaster.intersectObjects(scene.children, true);

      if (intersects.length > 0) {
        // Find the first intersected object that has a valid name assigned
        const clickedMesh = intersects.find(hit => hit.object && hit.object.name);
        
        if (clickedMesh) {
          const targetName = clickedMesh.object.name;
          
          // Route the clicked 3D object to the infographic panel
          updateInfographicPanel(targetName);
          
          // Optional: Also change the focus of the app to the double-clicked body
          if (typeof setPlanet === 'function') setPlanet(targetName);
        }
      }
    });
  }
});

