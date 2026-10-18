// =============================================================
// SOLARSYSTEM_PHYSICS.JS - Orbital Math & Keplerian Elements
// =============================================================

function solveKepler(M_rad, e) {
  let E = M_rad;
  for (let i = 0; i < 12; i++) {
    const delta = (E - e * Math.sin(E) - M_rad) / (1 - e * Math.cos(E));
    E -= delta;
    if (Math.abs(delta) < 1e-7) break;
  }
  return E;
}

function calculateHeliocentricPosition(body, epochMs) {
  const dDays = (epochMs - 946728000000) / 86400000;
  const T = dDays / 36525;

  const a = body.a0 + (body.aRate || 0) * T;
  const e = body.e0 + (body.eRate || 0) * T;
  const I_deg = body.I0 + (body.IRate || 0) * T;
  const L_deg = body.L0 + (body.LRate || 0) * T;
  const longPeri_deg = body.longPeri0 + (body.longPeriRate || 0) * T;
  const node_deg = body.node0 + (body.nodeRate || 0) * T;

  const I = I_deg * (Math.PI / 180);
  const node = node_deg * (Math.PI / 180);
  const omega = (longPeri_deg - node_deg) * (Math.PI / 180);

  let M_deg = (L_deg - longPeri_deg) % 360;
  if (M_deg < 0) M_deg += 360;
  const M = M_deg * (Math.PI / 180);

  const E = solveKepler(M, e);

  const x_orb = a * (Math.cos(E) - e);
  const y_orb = a * Math.sqrt(Math.max(0, 1 - e * e)) * Math.sin(E);

  const x_ecl = (Math.cos(omega) * Math.cos(node) - Math.sin(omega) * Math.sin(node) * Math.cos(I)) * x_orb +
                (-Math.sin(omega) * Math.cos(node) - Math.cos(omega) * Math.sin(node) * Math.cos(I)) * y_orb;
  const y_ecl = (Math.cos(omega) * Math.sin(node) + Math.sin(omega) * Math.cos(node) * Math.cos(I)) * x_orb +
                (-Math.sin(omega) * Math.sin(node) + Math.cos(omega) * Math.cos(node) * Math.cos(I)) * y_orb;
  const z_ecl = (Math.sin(omega) * Math.sin(I)) * x_orb + (Math.cos(omega) * Math.sin(I)) * y_orb;

  const r = Math.sqrt(x_ecl * x_ecl + y_ecl * y_ecl + z_ecl * z_ecl);
  const eclipticLongDeg = (Math.atan2(y_ecl, x_ecl) * (180 / Math.PI) + 360) % 360;

  const GM_SUN = 1.3271244e11;
  const AU_KM = 149597870.7;
  const velocityKmS = Math.sqrt(Math.max(0, GM_SUN * (2 / (r * AU_KM) - 1 / (a * AU_KM))));

  return {
    xAU: x_ecl, yAU: y_ecl, zAU: z_ecl,
    rAU: r, aAU: a, e, I_deg,
    node_deg: (node_deg % 360 + 360) % 360,
    omega_deg: ((longPeri_deg - node_deg) % 360 + 360) % 360,
    velocityKmS, eclipticLongDeg
  };
}

function calculateOrbitalNodes(body, epochMs) {
  const dDays = (epochMs - 946728000000) / 86400000;
  const T = dDays / 36525;
  const a = body.a0 + (body.aRate || 0) * T;
  const e = body.e0 + (body.eRate || 0) * T;
  const I_deg = body.I0 + (body.IRate || 0) * T;
  const longPeri_deg = body.longPeri0 + (body.longPeriRate || 0) * T;
  const node_deg = body.node0 + (body.nodeRate || 0) * T;

  const nodeRad = node_deg * (Math.PI / 180);
  const omegaRad = (longPeri_deg - node_deg) * (Math.PI / 180);

  const r_asc = (a * (1 - e * e)) / (1 + e * Math.cos(omegaRad));
  const r_desc = (a * (1 - e * e)) / (1 - e * Math.cos(omegaRad));

  return {
    asc: { xAU: r_asc * Math.cos(nodeRad), yAU: r_asc * Math.sin(nodeRad), zAU: 0, rAU: r_asc, longDeg: (node_deg % 360 + 360) % 360 },
    desc: { xAU: -r_desc * Math.cos(nodeRad), yAU: -r_desc * Math.sin(nodeRad), zAU: 0, rAU: r_desc, longDeg: ((node_deg + 180) % 360 + 360) % 360 },
    inclinationDeg: I_deg
  };
}