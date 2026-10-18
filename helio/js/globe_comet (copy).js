// =============================================================
// GLOBE_COMET.JS - 3D Inspector Coma, Ion & Curved Dust Tails
// =============================================================

if (typeof window.cometTailMesh === 'undefined') {
  window.cometTailMesh = null;
}

/**
 * Returns true ONLY when the active 3D body is a comet in CELESTIAL_BODIES.
 */
function isCometBody(bodyName) {
  if (!bodyName) return false;
  const key = String(bodyName).trim().toLowerCase();

  // 1. Check CELESTIAL_BODIES database from solarsystem_data.js[cite: 9]
  if (typeof CELESTIAL_BODIES !== 'undefined') {
    const body = CELESTIAL_BODIES[key];
    if (body) {
      return Boolean(body.isComet || body.category === 'comets');
    }
  }

  // 2. Check CATEGORIES.comets array if defined[cite: 9]
  if (typeof CATEGORIES !== 'undefined' && Array.isArray(CATEGORIES.comets)) {
    return CATEGORIES.comets.includes(key);
  }

  return false;
}

/**
 * Returns the live world-space unit vector pointing FROM the globe center (0,0,0) TOWARD the 3D Sun.
 */
function getInspectorSunDirection() {
  const sunDir = new THREE.Vector3(1, 0, 0);

  if (typeof sunMesh !== 'undefined' && sunMesh) {
    sunMesh.updateMatrixWorld(true);
    sunMesh.getWorldPosition(sunDir);
    if (sunDir.lengthSq() > 1e-5) {
      return sunDir.normalize();
    }
  }

  if (typeof earthUniforms !== 'undefined' && earthUniforms?.uSunDirection?.value) {
    sunDir.copy(earthUniforms.uSunDirection.value);
    if (sunDir.lengthSq() > 1e-5) {
      return sunDir.normalize();
    }
  }

  if (typeof ringShadowUniforms !== 'undefined' && ringShadowUniforms?.uSunDirection?.value) {
    sunDir.copy(ringShadowUniforms.uSunDirection.value);
    if (sunDir.lengthSq() > 1e-5) {
      return sunDir.normalize();
    }
  }

  if (typeof scene !== 'undefined' && scene) {
    for (let i = 0; i < scene.children.length; i++) {
      const obj = scene.children[i];
      if (obj.isDirectionalLight && obj.position.lengthSq() > 1e-5) {
        return sunDir.copy(obj.position).normalize();
      }
    }
  }

  return sunDir.normalize();
}

/**
 * Orients the tail group so that its primary emission axis points strictly 
 * 180° AWAY from the Sun (anti-solar wind direction).
 */
function alignTailAwayFromSun(tailMesh, sunDirTowardsSun) {
  const antiSunDir = sunDirTowardsSun.clone().negate().normalize();
  const worldUp = new THREE.Vector3(0, 1, 0);

  const localY = antiSunDir;
  const localX = new THREE.Vector3().crossVectors(worldUp, localY);
  if (localX.lengthSq() < 1e-4) {
    localX.set(1, 0, 0);
  } else {
    localX.normalize();
  }
  const localZ = new THREE.Vector3().crossVectors(localX, localY).normalize();

  const rotMatrix = new THREE.Matrix4().makeBasis(localX, localY, localZ);
  tailMesh.quaternion.setFromRotationMatrix(rotMatrix);

  if (tailMesh.parent && tailMesh.parent.type !== 'Scene') {
    const parentQuat = new THREE.Quaternion();
    tailMesh.parent.getWorldQuaternion(parentQuat);
    tailMesh.quaternion.premultiply(parentQuat.invert());
  }
}

/**
 * Builds a curved frustum geometry for the Type II Dust Tail.
 */
function createCurvedDustGeometry(topRadius, bottomRadius, length, radialSegs = 48, heightSegs = 32, curveDeflection = 18.5) {
  const geom = new THREE.CylinderGeometry(topRadius, bottomRadius, length, radialSegs, heightSegs, true);
  geom.translate(0, length / 2, 0);

  const pos = geom.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    const t = Math.min(1.0, Math.max(0.0, y / length));
    const bendX = Math.pow(t, 1.85) * curveDeflection;
    const x = pos.getX(i) * (1.0 + 0.42 * t) + bendX;
    const z = pos.getZ(i) * (1.0 + 0.15 * t);
    pos.setXYZ(i, x, y, z);
  }
  pos.needsUpdate = true;
  geom.computeVertexNormals();
  return geom;
}

/**
 * Satisfies globe.js when it calls createCometTailMesh().
 */
function createCometTailMesh(baseRadius = 1.8, baseLength = 24.0) {
  if (!window.cometTailMesh) {
    initCometTail();
  }
  return window.cometTailMesh;
}

function updateCometTail(cometMesh, tailMesh, rAU, sunPos = null) {
  const target = tailMesh || window.cometTailMesh;
  if (!target) return;
  const activeName = (typeof currentPlanet !== 'undefined') ? currentPlanet : '';
  target.visible = isCometBody(activeName);
}

/**
 * Initializes the full multi-component GLSL 3D Comet Tail in the 3D scene.
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

  const sharedUniforms = {
    uTime: { value: 0.0 },
    uActivity: { value: 1.0 }
  };

  const ionLength = 90.0;
  const ionTopRadius = 4.65;
  const ionBottomRadius = 11.8;

  const ionGeom = new THREE.CylinderGeometry(ionTopRadius, ionBottomRadius, ionLength, 64, 24, true);
  ionGeom.translate(0, ionLength / 2, 0);

  const ionVertexShader = `
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
      float dist = clamp(vUv.y, 0.0, 1.0);
      float entryFade = smoothstep(0.0, 0.065, dist);
      float lengthFade = pow(1.0 - dist, 1.55);

      vec3 viewDir = normalize(-vViewPos);
      float viewDot = abs(dot(normalize(vNormalView), viewDir));
      float edgeSoftness = pow(viewDot, 1.65);

      float angle = vUv.x * 6.2831853;
      float flow = dist * 5.0 - uTime * 0.35;
      float s1 = 0.5 + 0.5 * sin(angle * 6.0 + sin(flow * 0.7));
      float s2 = 0.5 + 0.5 * sin(angle * 13.0 - flow * 0.45 + 1.4);
      float s3 = 0.5 + 0.5 * sin(angle * 23.0 + flow * 0.8);
      float streamers = 0.52 + 0.28 * pow(s1, 2.0) + 0.20 * pow(s2 * s3, 1.5);

      vec3 rootColor = vec3(0.88, 0.98, 1.00);
      vec3 midColor  = vec3(0.22, 0.78, 0.98);
      vec3 tipColor  = vec3(0.10, 0.32, 0.85);

      vec3 col = mix(rootColor, midColor, smoothstep(0.0, 0.22, dist));
      col = mix(col, tipColor, smoothstep(0.22, 0.85, dist));

      float alpha = entryFade * lengthFade * edgeSoftness * streamers * 0.82 * uActivity;
      gl_FragColor = vec4(col * alpha, alpha);
    }
  `;

  const ionMat = new THREE.ShaderMaterial({
    uniforms: sharedUniforms,
    vertexShader: ionVertexShader,
    fragmentShader: ionFragmentShader,
    transparent: true,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    depthWrite: false
  });

  const mainMesh = new THREE.Mesh(ionGeom, ionMat);
  mainMesh.name = 'cometIonTailMesh';
  mainMesh.frustumCulled = false;
  group.add(mainMesh);

  // Crossed core planes
  const coreGeom = new THREE.PlaneGeometry(ionTopRadius * 1.9, ionLength, 16, 24);
  coreGeom.translate(0, ionLength / 2, 0);

  const coreFragmentShader = `
    uniform float uTime;
    uniform float uActivity;
    varying vec2 vUv;
    varying vec3 vNormalView;
    varying vec3 vViewPos;

    void main() {
      float dist = clamp(vUv.y, 0.0, 1.0);
      float entryFade = smoothstep(0.0, 0.06, dist);
      float lengthFade = pow(1.0 - dist, 1.75);
      float radial = abs(vUv.x - 0.5) * 2.0;
      float lateralFade = pow(max(0.0, 1.0 - radial), 2.2);
      float spine = exp(-radial * radial * 14.0);
      float pulse = 0.8 + 0.2 * sin(dist * 18.0 - uTime * 1.6);

      vec3 col = mix(vec3(0.92, 0.99, 1.0), vec3(0.20, 0.72, 0.98), smoothstep(0.0, 0.35, dist));
      float alpha = (lateralFade * 0.38 + spine * 0.45) * entryFade * lengthFade * pulse * uActivity;
      gl_FragColor = vec4(col * alpha, alpha);
    }
  `;

  const coreMat = new THREE.ShaderMaterial({
    uniforms: sharedUniforms,
    vertexShader: ionVertexShader,
    fragmentShader: coreFragmentShader,
    transparent: true,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    depthWrite: false
  });

  const corePlane1 = new THREE.Mesh(coreGeom, coreMat);
  const corePlane2 = new THREE.Mesh(coreGeom, coreMat);
  corePlane2.rotation.y = Math.PI / 2;
  group.add(corePlane1);
  group.add(corePlane2);

  // Curved Dust Tail
  const dustGeom = createCurvedDustGeometry(4.7, 17.5, 74.0, 48, 32, 18.5);
  const dustFragmentShader = `
    uniform float uActivity;
    varying vec2 vUv;
    varying vec3 vNormalView;
    varying vec3 vViewPos;

    void main() {
      float dist = clamp(vUv.y, 0.0, 1.0);
      float entryFade = smoothstep(0.0, 0.08, dist);
      float lengthFade = pow(1.0 - dist, 1.35);

      vec3 viewDir = normalize(-vViewPos);
      float viewDot = abs(dot(normalize(vNormalView), viewDir));
      float edgeSoftness = pow(viewDot, 1.85);

      vec3 innerDust = vec3(1.00, 0.95, 0.82);
      vec3 outerDust = vec3(0.85, 0.68, 0.48);
      vec3 col = mix(innerDust, outerDust, smoothstep(0.0, 0.75, dist));

      float alpha = entryFade * lengthFade * edgeSoftness * 0.52 * uActivity;
      gl_FragColor = vec4(col * alpha, alpha);
    }
  `;

  const dustMat = new THREE.ShaderMaterial({
    uniforms: sharedUniforms,
    vertexShader: ionVertexShader,
    fragmentShader: dustFragmentShader,
    transparent: true,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    depthWrite: false
  });

  const dustTailMesh = new THREE.Mesh(dustGeom, dustMat);
  dustTailMesh.name = 'cometDustTailMesh';
  group.add(dustTailMesh);

  // Gaseous Coma Envelope
  const comaGeom = new THREE.SphereGeometry(5.42, 48, 48);
  const comaVertexShader = `
    varying vec3 vLocalPos;
    varying vec3 vNormalView;
    varying vec3 vViewPos;
    void main() {
      vLocalPos = position;
      vNormalView = normalize(normalMatrix * normal);
      vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
      vViewPos = mvPos.xyz;
      gl_Position = projectionMatrix * mvPos;
    }
  `;

  const comaFragmentShader = `
    uniform float uActivity;
    varying vec3 vLocalPos;
    varying vec3 vNormalView;
    varying vec3 vViewPos;

    void main() {
      vec3 viewDir = normalize(-vViewPos);
      float viewDot = clamp(dot(normalize(vNormalView), viewDir), 0.0, 1.0);
      float rim = pow(1.0 - viewDot, 2.2);
      float sunward = clamp(normalize(vLocalPos).y * 0.5 + 0.5, 0.0, 1.0);
      float hoodIntensity = mix(0.55, 1.15, sunward);

      vec3 comaColor = mix(vec3(0.35, 0.85, 0.98), vec3(0.88, 0.98, 1.0), sunward);
      float alpha = rim * hoodIntensity * 0.72 * uActivity;
      gl_FragColor = vec4(comaColor * alpha, alpha);
    }
  `;

  const comaMat = new THREE.ShaderMaterial({
    uniforms: sharedUniforms,
    vertexShader: comaVertexShader,
    fragmentShader: comaFragmentShader,
    transparent: true,
    blending: THREE.AdditiveBlending,
    side: THREE.FrontSide,
    depthWrite: false
  });

  const comaMesh = new THREE.Mesh(comaGeom, comaMat);
  comaMesh.name = 'cometComaEnvelope';
  group.add(comaMesh);

  group.onBeforeRender = function() {
    const activeName = (typeof currentPlanet !== 'undefined') ? currentPlanet : '';
    const isComet = isCometBody(activeName);
    
    group.visible = isComet;
    for (let i = 0; i < group.children.length; i++) {
      group.children[i].visible = isComet;
    }

    if (isComet) {
      sharedUniforms.uTime.value = performance.now() * 0.001;
      const sunDir = getInspectorSunDirection();
      alignTailAwayFromSun(group, sunDir);
    }
  };

  window.cometTailMesh = group;
  scene.add(window.cometTailMesh);
}
