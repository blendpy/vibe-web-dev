// =============================================================
// GLOBE_COMET.JS - Dual-Tail (Type I Ion & Type II Dust) Engine
// =============================================================

if (typeof window.cometTailMesh === 'undefined') {
  window.cometTailMesh = null;
}
let cometTailUniforms = null;

/**
 * Validates comet identity against CELESTIAL_BODIES catalog.
 */
function isCometBody(bodyName) {
  if (!bodyName) return false;
  const key = String(bodyName).trim().toLowerCase();

  if (typeof CELESTIAL_BODIES !== 'undefined') {
    const body = CELESTIAL_BODIES[key];
    if (body) {
      return Boolean(body.isComet || body.category === 'comets');
    }
  }

  if (typeof CATEGORIES !== 'undefined' && Array.isArray(CATEGORIES.comets)) {
    return CATEGORIES.comets.includes(key);
  }

  return false;
}

/**
 * Orients the dual-tail assembly:
 * - Local -Y points strictly 180° away from the Sun (anti-solar vector).
 * - Local +X aligns in the orbital plane to give the dust tail its characteristic curve.
 */
function alignTailAwayFromSun(tailGroup, sunDirTowardsSun) {
  if (!tailGroup || !sunDirTowardsSun) return;

  const colY = sunDirTowardsSun.clone().normalize();
  const worldUp = new THREE.Vector3(0, 1, 0);

  let colZ = new THREE.Vector3().crossVectors(colY, worldUp);
  if (colZ.lengthSq() < 1e-4) {
    colZ = new THREE.Vector3().crossVectors(colY, new THREE.Vector3(0, 0, 1));
  }
  colZ.normalize();

  const colX = new THREE.Vector3().crossVectors(colY, colZ).normalize();

  // Orthonormal basis: +Y toward Sun, -Y away from Sun, +X sideways in orbital plane
  const rotMatrix = new THREE.Matrix4().makeBasis(colX, colY, colZ);
  tailGroup.quaternion.setFromRotationMatrix(rotMatrix);
  tailGroup.updateMatrixWorld(true);
}

/**
 * Generates an asymmetric curved frustum geometry for the Type II Dust Tail.
 * Deflects along +X using a non-linear power curve to simulate radiation-pressure lag.
 */
function createCurvedDustGeometry(topRadius, bottomRadius, length, radialSegs = 48, heightSegs = 36, curveDeflection = 26.0) {
  const geom = new THREE.CylinderGeometry(topRadius, bottomRadius, length, radialSegs, heightSegs, true);
  // Apex sits at y = 0; tail extends down along -Y
  geom.translate(0, -length / 2, 0);

  const pos = geom.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    const t = Math.min(1.0, Math.max(0.0, -y / length));
    
    // Parabolic orbital lag sweep along +X
    const bendX = Math.pow(t, 1.7) * curveDeflection;
    // Broadening fan envelope
    const fanWidth = 1.0 + 0.85 * t;
    const fanDepth = 1.0 + 0.25 * t;

    const x = pos.getX(i) * fanWidth + bendX;
    const z = pos.getZ(i) * fanDepth;
    pos.setXYZ(i, x, y, z);
  }
  pos.needsUpdate = true;
  geom.computeVertexNormals();
  return geom;
}

/**
 * Builds the complete dual-tail assembly:
 * 1. Type I Ion Tail (narrow, straight cyan plasma filaments).
 * 2. Type II Dust Tail (wide, curved golden-white silicate plume).
 * 3. Coma sublimation envelope.
 */
function initCometTail() {
  if (typeof scene === 'undefined' || !scene) return;
  if (window.cometTailMesh) {
    if (!scene.children.includes(window.cometTailMesh)) scene.add(window.cometTailMesh);
    return;
  }

  const group = new THREE.Group();
  group.name = 'proceduralCometGroup';
  group.frustumCulled = false;
  group.visible = false;

  cometTailUniforms = {
    uTime: { value: 0.0 },
    uActivity: { value: 1.0 }
  };

  // -------------------------------------------------------------
  // 1. TYPE I ION (PLASMA) TAIL: Needle-straight, blue-cyan gas
  // -------------------------------------------------------------
  const ionLength = 96.0;
  const ionTopRadius = 3.8;
  const ionBottomRadius = 9.5;

  const ionGeom = new THREE.CylinderGeometry(ionTopRadius, ionBottomRadius, ionLength, 64, 24, true);
  ionGeom.translate(0, -ionLength / 2, 0);

  const sharedVertexShader = `
    varying vec2 vUv;
    varying vec3 vNormalView;
    varying vec3 vViewPos;
    void main() {
      vUv = uv;
      vNormalView = normalize(normalMatrix * normal);
      vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
      vViewPos = mvPos.xyz;
      gl_Position = projectionMatrix * mvPos;
    }
  `;

  const ionFragmentShader = `
    uniform float uTime;
    uniform float uActivity;
    varying vec2 vUv;
    varying vec3 vNormalView;
    varying vec3 vViewPos;

    void main() {
      float dist = clamp(1.0 - vUv.y, 0.0, 1.0);
      float entryFade = smoothstep(0.0, 0.05, dist);
      float lengthFade = pow(1.0 - dist, 1.5);

      vec3 viewDir = normalize(-vViewPos);
      float viewDot = abs(dot(normalize(vNormalView), viewDir));
      float edgeSoftness = pow(viewDot, 1.8);

      // Fine longitudinal streamers + subtle solar wind flow ripples
      float angle = vUv.x * 6.2831853;
      float flow = dist * 7.0 - uTime * 0.55;
      float s1 = 0.5 + 0.5 * sin(angle * 8.0 + sin(flow * 0.8));
      float s2 = 0.5 + 0.5 * sin(angle * 16.0 - flow * 0.4 + 1.2);
      float streamers = 0.55 + 0.30 * pow(s1, 2.0) + 0.15 * pow(s2, 1.5);

      // Ionized CO+ & N2+ plasma emission: brilliant white -> cyan -> deep blue
      vec3 rootColor = vec3(0.92, 0.98, 1.00);
      vec3 midColor  = vec3(0.20, 0.76, 0.98);
      vec3 tipColor  = vec3(0.12, 0.28, 0.88);

      vec3 col = mix(rootColor, midColor, smoothstep(0.0, 0.25, dist));
      col = mix(col, tipColor, smoothstep(0.25, 0.85, dist));

      float alpha = entryFade * lengthFade * edgeSoftness * streamers * 0.90 * uActivity;
      gl_FragColor = vec4(col * alpha, alpha);
    }
  `;

  const ionMat = new THREE.ShaderMaterial({
    uniforms: cometTailUniforms,
    vertexShader: sharedVertexShader,
    fragmentShader: ionFragmentShader,
    transparent: true,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    depthWrite: false
  });

  const ionMesh = new THREE.Mesh(ionGeom, ionMat);
  ionMesh.name = 'cometIonTailMesh';
  group.add(ionMesh);

  // Cross-plane ion core to preserve axial density
  const coreGeom = new THREE.PlaneGeometry(ionTopRadius * 1.8, ionLength, 8, 16);
  coreGeom.translate(0, -ionLength / 2, 0);

  const coreFragmentShader = `
    uniform float uTime;
    uniform float uActivity;
    varying vec2 vUv;
    void main() {
      float dist = clamp(1.0 - vUv.y, 0.0, 1.0);
      float entryFade = smoothstep(0.0, 0.05, dist);
      float lengthFade = pow(1.0 - dist, 1.7);
      float radial = abs(vUv.x - 0.5) * 2.0;
      float spine = exp(-radial * radial * 18.0);

      vec3 col = mix(vec3(0.95, 0.99, 1.0), vec3(0.22, 0.74, 0.98), smoothstep(0.0, 0.4, dist));
      float alpha = spine * entryFade * lengthFade * 0.55 * uActivity;
      gl_FragColor = vec4(col * alpha, alpha);
    }
  `;

  const coreMat = new THREE.ShaderMaterial({
    uniforms: cometTailUniforms,
    vertexShader: sharedVertexShader,
    fragmentShader: coreFragmentShader,
    transparent: true,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    depthWrite: false
  });

  const p1 = new THREE.Mesh(coreGeom, coreMat);
  const p2 = new THREE.Mesh(coreGeom, coreMat);
  p2.rotation.y = Math.PI / 2;
  group.add(p1);
  group.add(p2);

  // -------------------------------------------------------------
  // 2. TYPE II DUST TAIL: Broad, curving, warm golden-white fan
  // -------------------------------------------------------------
  const dustLength = 72.0;
  const dustGeom = createCurvedDustGeometry(4.4, 21.0, dustLength, 54, 36, 26.0);

  const dustFragmentShader = `
    uniform float uActivity;
    varying vec2 vUv;
    varying vec3 vNormalView;
    varying vec3 vViewPos;

    void main() {
      float dist = clamp(1.0 - vUv.y, 0.0, 1.0);
      float entryFade = smoothstep(0.0, 0.08, dist);
      float lengthFade = pow(1.0 - dist, 1.25);

      vec3 viewDir = normalize(-vViewPos);
      float viewDot = abs(dot(normalize(vNormalView), viewDir));
      float edgeSoftness = pow(viewDot, 1.45);

      // Microscopic dust reflection: warm sunlit cream -> amber gold -> soft brown
      vec3 innerDust = vec3(1.00, 0.96, 0.86);
      vec3 midDust   = vec3(0.98, 0.84, 0.56);
      vec3 outerDust = vec3(0.78, 0.55, 0.32);

      vec3 col = mix(innerDust, midDust, smoothstep(0.0, 0.45, dist));
      col = mix(col, outerDust, smoothstep(0.45, 0.95, dist));

      float alpha = entryFade * lengthFade * edgeSoftness * 0.62 * uActivity;
      gl_FragColor = vec4(col * alpha, alpha);
    }
  `;

  const dustMat = new THREE.ShaderMaterial({
    uniforms: cometTailUniforms,
    vertexShader: sharedVertexShader,
    fragmentShader: dustFragmentShader,
    transparent: true,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    depthWrite: false
  });

  const dustMesh = new THREE.Mesh(dustGeom, dustMat);
  dustMesh.name = 'cometDustTailMesh';
  group.add(dustMesh);

  // -------------------------------------------------------------
  // 3. GASEOUS COMA ENVELOPE: Soft glow enclosing the nucleus
  // -------------------------------------------------------------
  const comaGeom = new THREE.SphereGeometry(5.35, 36, 36);
  const comaFragmentShader = `
    uniform float uActivity;
    varying vec3 vNormalView;
    varying vec3 vViewPos;

    void main() {
      vec3 viewDir = normalize(-vViewPos);
      float viewDot = clamp(dot(normalize(vNormalView), viewDir), 0.0, 1.0);
      float rim = pow(1.0 - viewDot, 2.4);

      vec3 comaColor = vec3(0.48, 0.88, 0.98);
      float alpha = rim * 0.60 * uActivity;
      gl_FragColor = vec4(comaColor * alpha, alpha);
    }
  `;

  const comaMat = new THREE.ShaderMaterial({
    uniforms: cometTailUniforms,
    vertexShader: sharedVertexShader,
    fragmentShader: comaFragmentShader,
    transparent: true,
    blending: THREE.AdditiveBlending,
    side: THREE.FrontSide,
    depthWrite: false
  });

  const comaMesh = new THREE.Mesh(comaGeom, comaMat);
  comaMesh.name = 'cometComaEnvelope';
  group.add(comaMesh);

  window.cometTailMesh = group;
  scene.add(window.cometTailMesh);
}

/**
 * Per-frame updates triggered from globe.js animate()
 */
function update3DCometTail(bodyName) {
  const active = bodyName || (typeof currentPlanet !== 'undefined' ? currentPlanet : '');
  const isComet = isCometBody(active);

  if (!window.cometTailMesh) {
    initCometTail();
  }
  if (!window.cometTailMesh) return;

  window.cometTailMesh.visible = isComet;
  if (!isComet) return;

  if (cometTailUniforms) {
    cometTailUniforms.uTime.value = performance.now() * 0.001;
  }

  let sunDir = null;
  if (typeof earthMaterial !== 'undefined' && earthMaterial?.uniforms?.uSunDirection?.value) {
    sunDir = earthMaterial.uniforms.uSunDirection.value;
  } else if (typeof sunMesh !== 'undefined' && sunMesh && sunMesh.position.lengthSq() > 1e-4) {
    sunDir = sunMesh.position;
  }

  if (sunDir && sunDir.lengthSq() > 1e-4) {
    alignTailAwayFromSun(window.cometTailMesh, sunDir);
  }
}
window.update3DCometTail = update3DCometTail;

// Legacy shims
function createCometTailMesh() {
  initCometTail();
  return window.cometTailMesh;
}
function updateCometTail(cometMesh, tailMesh) {
  update3DCometTail();
}
