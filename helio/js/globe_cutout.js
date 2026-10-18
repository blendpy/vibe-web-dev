// =============================================================
// GLOBE_CUTOUT.JS - 3D Shader-Driven Planetary Stratigraphy
// =============================================================

window.planetaryInteriorGroup = null;
let currentInteriorPlanet = null;

const MATERIAL_TYPE_MAP = {
  rock: 0,
  ice: 1,
  ocean: 1,
  water: 1,
  metal: 2,
  core: 2,
  lava: 3,
  magma: 3,
  melt: 3
};

function resolveLayerType(layerName) {
  const name = String(layerName || '').toLowerCase();
  for (const [key, typeCode] of Object.entries(MATERIAL_TYPE_MAP)) {
    if (name.includes(key)) return typeCode;
  }
  return 0; // Default to Rock
}

function clearInteriorGroup() {
  if (!window.planetaryInteriorGroup) return;
  while (window.planetaryInteriorGroup.children.length > 0) {
    const child = window.planetaryInteriorGroup.children[0];
    if (child.geometry) child.geometry.dispose();
    if (child.material) {
      if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
      else child.material.dispose();
    }
    window.planetaryInteriorGroup.remove(child);
  }
}

function buildPlanetaryInterior(planetKey) {
  if (typeof globeGroup === 'undefined' || !globeGroup) return;

  if (!window.planetaryInteriorGroup) {
    window.planetaryInteriorGroup = new THREE.Group();
    window.planetaryInteriorGroup.name = 'planetaryInteriorGroup';
    globeGroup.add(window.planetaryInteriorGroup);
  }

  clearInteriorGroup();

  const key = String(planetKey || 'earth').toLowerCase();
  const interiorData = (typeof PLANETARY_INTERIORS !== 'undefined' && PLANETARY_INTERIORS[key])
    ? PLANETARY_INTERIORS[key]
    : (typeof PLANETARY_INTERIORS !== 'undefined' ? PLANETARY_INTERIORS.earth : null);

  if (!interiorData || !interiorData.layers || interiorData.layers.length === 0) return;
  currentInteriorPlanet = key;

  const globeRadius = 5.0;
  const layers = interiorData.layers.slice(0, 5); // Shader supports up to 5 layers
  const isGas = !!interiorData.isGas;

  const radiiArray = [1.0, 1.0, 1.0, 1.0, 1.0];
  const colorsArray = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
  const typesArray = [0, 0, 0, 0, 0];

  layers.forEach((l, idx) => {
    radiiArray[idx] = l.radius;
    const c = new THREE.Color(l.color);
    colorsArray[idx].set(c.r, c.g, c.b);
    typesArray[idx] = resolveLayerType(l.name);
  });

  // 1. Shaded Cutout Quadrant Walls (XY, YZ, XZ)
  const capGeo = new THREE.RingGeometry(0.001, globeRadius + 0.005, 64, 1, 0, Math.PI / 2);
  const capMat = new THREE.ShaderMaterial({
    vertexShader: interiorCapVertexShader,
    fragmentShader: interiorCapFragmentShader,
    uniforms: {
      uRadii: { value: radiiArray },
      uColors: { value: colorsArray },
      uLayerTypes: { value: typesArray },
      uLayerCount: { value: layers.length },
      uIsGas: { value: isGas }
    },
    side: THREE.DoubleSide
  });

  // Wall 1: Z=0 plane (XY quadrant)
  window.planetaryInteriorGroup.add(new THREE.Mesh(capGeo, capMat));

  // Wall 2: X=0 plane (YZ quadrant)
  const wallX = new THREE.Mesh(capGeo, capMat);
  wallX.rotation.y = -Math.PI / 2;
  window.planetaryInteriorGroup.add(wallX);

  // Wall 3: Y=0 plane (XZ quadrant)
  const wallY = new THREE.Mesh(capGeo, capMat);
  wallY.rotation.x = Math.PI / 2;
  window.planetaryInteriorGroup.add(wallY);

  // 2. Central Glowing 3D Inner Core
  const coreRadius = Math.max(0.35, layers[0].radius * globeRadius);
  const coreColor = new THREE.Color(layers[0].color);

  const coreMat = new THREE.MeshStandardMaterial({
    color: coreColor,
    emissive: coreColor,
    emissiveIntensity: 1.6, // Radiant core glow
    roughness: 0.25,
    metalness: 0.3
  });

  const coreSphere = new THREE.Mesh(new THREE.SphereGeometry(coreRadius, 48, 48), coreMat);
  coreSphere.name = 'interior_3d_core';
  window.planetaryInteriorGroup.add(coreSphere);

  // Core Cavity Light
  const coreLight = new THREE.PointLight(coreColor.getHex(), 2.0, 12.0, 1.2);
  coreLight.position.set(0.5, 0.5, 0.5);
  window.planetaryInteriorGroup.add(coreLight);
}

window.updateCutout = function() {
  const chk = document.getElementById('chk-interior') || document.getElementById('chk-cutout');
  const activePlanet = (typeof currentPlanet !== 'undefined' ? currentPlanet : 'earth').toLowerCase();

  // Verify that an interior configuration exists in globe_config.js
  const hasInterior = (typeof PLANETARY_INTERIORS !== 'undefined') && !!PLANETARY_INTERIORS[activePlanet];
  const isEnabled = hasInterior && chk ? chk.checked : false;

  if (isEnabled && (!window.planetaryInteriorGroup || currentInteriorPlanet !== activePlanet)) {
    buildPlanetaryInterior(activePlanet);
  }

  if (window.planetaryInteriorGroup) {
    window.planetaryInteriorGroup.visible = isEnabled;
  }

  if (typeof atmosphereMesh !== 'undefined' && atmosphereMesh) {
    atmosphereMesh.visible = !isEnabled;
  }

  // Toggle surface cutout on planet and cloud materials
  const targetMaterials = [
    typeof earthMesh !== 'undefined' ? earthMesh?.material : null,
    typeof cloudMesh !== 'undefined' ? cloudMesh?.material : null,
    typeof venusCloudMesh !== 'undefined' ? venusCloudMesh?.material : null,
    typeof marsDustMesh !== 'undefined' ? marsDustMesh?.material : null
  ].filter(Boolean);

  if (typeof planetMaterials !== 'undefined') {
    Object.values(planetMaterials).forEach(mat => {
      if (mat && !targetMaterials.includes(mat)) {
        targetMaterials.push(mat);
      }
    });
  }

  targetMaterials.forEach(mat => {
    if (!mat) return;
    if (mat.uniforms && mat.uniforms.uEnableCutout) {
      mat.uniforms.uEnableCutout.value = isEnabled;
    } else if (mat.userData && mat.userData.uEnableCutout) {
      mat.userData.uEnableCutout.value = isEnabled;
    }
  });
};
