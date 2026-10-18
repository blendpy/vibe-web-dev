// =============================================================
// GLOBE_SHADERS.JS - GLSL Shader Materials
// =============================================================


const earthVertexShader = `
varying vec2 vUv; varying vec3 vNormal; varying vec3 vWorldPosition;
varying vec3 vLocalPos; // ADDED FOR CUTOUT
void main() {
vUv = uv; vNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
vLocalPos = position; // ADDED FOR CUTOUT
vec4 worldPosition = modelMatrix * vec4(position, 1.0); vWorldPosition = worldPosition.xyz; gl_Position = projectionMatrix * viewMatrix * worldPosition;
}`;

const earthFragmentShader = `
uniform sampler2D uDayTexture; uniform sampler2D uNightTexture; uniform sampler2D uWaterTexture;
uniform vec3 uSunDirection; uniform float uNightIntensity; uniform bool uEnableNightLights;
uniform bool uEnableSpecular; uniform bool uIsBlueMarble; uniform vec3 uMoonShadowPos;
uniform vec2 uMoonShadowUV; uniform float uEclipseIntensity;
uniform bool uEnableCutout; // ADDED FOR CUTOUT
varying vec2 vUv; varying vec3 vNormal; varying vec3 vWorldPosition; varying vec3 vLocalPos;

void main() {
// GPU FIREWALL: Instantly discards the Front-Right-Top quadrant if cutout is active
if (uEnableCutout && vLocalPos.x > 0.0 && vLocalPos.y > 0.0 && vLocalPos.z > 0.0) discard;

vec4 dayColor = texture2D(uDayTexture, vUv);
if (!uEnableNightLights) {
vec3 finalColor = dayColor.rgb;
if (uEnableSpecular) {
vec3 normal = normalize(vNormal); vec3 sunDir = normalize(uSunDirection); float waterMask = texture2D(uWaterTexture, vUv).r;
vec3 viewDir = normalize(cameraPosition - vWorldPosition); vec3 halfVector = normalize(sunDir + viewDir);
float NdotH = max(dot(normal, halfVector), 0.0); float sunDot = max(dot(normal, sunDir), 0.0);
float specular = pow(NdotH, 32.0) * waterMask * sunDot; finalColor += vec3(0.4, 0.7, 1.0) * specular * 0.8;
}
if (uEclipseIntensity > 0.0) {
vec3 worldPosNorm = normalize(vWorldPosition); float dist = distance(worldPosNorm, normalize(uMoonShadowPos));
float shadowMask = smoothstep(0.35, 0.0, dist); float penumbraMask = smoothstep(0.75, 0.20, dist);
float totalShadow = (shadowMask * 0.96 + penumbraMask * 0.55) * uEclipseIntensity;
if (uIsBlueMarble) { vec3 redShadow = vec3(0.95, 0.15, 0.15); finalColor = mix(finalColor, redShadow, totalShadow * 0.85); } 
else { finalColor *= (1.0 - totalShadow); }
}
gl_FragColor = vec4(finalColor, 1.0); return;
}
vec3 normal = normalize(vNormal); vec3 sunDir = normalize(uSunDirection);
float sunDot = dot(normal, sunDir); vec4 nightColor = texture2D(uNightTexture, vUv) * uNightIntensity;
float terminator = smoothstep(-0.15, 0.15, sunDot); vec3 dayLitColor = dayColor.rgb * max(sunDot, 0.08);
if (uEclipseIntensity > 0.0) {
vec3 worldPosNorm = normalize(vWorldPosition); float dist = distance(worldPosNorm, normalize(uMoonShadowPos));
float shadowMask = smoothstep(0.35, 0.0, dist); float penumbraMask = smoothstep(0.75, 0.20, dist);
float totalShadow = (shadowMask * 0.96 + penumbraMask * 0.55) * uEclipseIntensity;
if (uIsBlueMarble) { vec3 redShadow = vec3(0.95, 0.15, 0.15); dayLitColor.rgb = mix(dayLitColor.rgb, redShadow, totalShadow * 0.85); } 
else { dayLitColor.rgb *= (1.0 - totalShadow); }
}
vec3 finalColor = mix(nightColor.rgb, dayLitColor, terminator);
if (uEnableSpecular) {
float waterMask = texture2D(uWaterTexture, vUv).r; vec3 viewDir = normalize(cameraPosition - vWorldPosition);
vec3 halfVector = normalize(sunDir + viewDir); float NdotH = max(dot(normal, halfVector), 0.0);
float specular = pow(NdotH, 32.0) * waterMask * max(sunDot, 0.0); finalColor += vec3(0.4, 0.7, 1.0) * specular * 0.8;
}
gl_FragColor = vec4(finalColor, 1.0);
}`;

const atmosphereVertexShader = `
varying vec3 vNormal; void main() { vNormal = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;
const atmosphereFragmentShader = `
varying vec3 vNormal; uniform float uGlowIntensity;
void main() { float intensity = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.5) * uGlowIntensity; gl_FragColor = vec4(0.3, 0.6, 1.0, 1.0) * intensity; }
`;

// --- ANALYTICAL PLANETARY RING SHADOW SHADERS ---
const ringShadowUniforms = {
  uSunDirection: { value: new THREE.Vector3(1, 0, 0) }
};

const ringVertexShader = `
varying vec3 vWorldPosition;
void main() {
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vWorldPosition = worldPos.xyz;
  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`;

const ringFragmentShader = `
uniform vec3 uColor;
uniform float uOpacity;
uniform vec3 uSunDirection;
varying vec3 vWorldPosition;

void main() {
  vec3 sunDir = normalize(uSunDirection);
  
  // 1. Analytical planet shadow projection
  float proj = dot(vWorldPosition, sunDir);
  float shadow = 1.0;

  if (proj < 0.0) {
    float distToAxis = length(vWorldPosition - proj * sunDir);
    float shadowFactor = smoothstep(4.90, 5.08, distToAxis);
    shadow = mix(0.06, 1.0, shadowFactor);
  }

  // 2. Vinyl record grooves (pure GPU procedural math)
  float r = length(vWorldPosition);
  // High-frequency fine grooves (160.0) combined with broader track groupings (35.0)
  float grooves = 0.65 + 0.22 * sin(r * 160.0) + 0.13 * sin(r * 35.0);

  // Apply grooves to both color intensity and opacity
  gl_FragColor = vec4(uColor * shadow * grooves, uOpacity * grooves);
}
`;

// -------------------------------------------------------------
// PARENT SKY RING SHADERS (High-Fidelity Rings Viewed from Moons)
// -------------------------------------------------------------
const parentSkyRingVertexShader = `
varying vec3 vWorldPosition;
varying vec3 vLocalPosition;

void main() {
  vLocalPosition = position;
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vWorldPosition = worldPos.xyz;
  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`;

const parentSkyRingFragmentShader = `
uniform vec3 uColor;
uniform float uOpacity;
uniform vec3 uSunDirection;
uniform vec3 uPlanetWorldCenter;
uniform float uPlanetRadius;
uniform float uInnerRadius;
uniform float uOuterRadius;

varying vec3 vWorldPosition;
varying vec3 vLocalPosition;

void main() {
  // 1. Normalized radial position across ring plane (0.0 = inner edge, 1.0 = outer rim)
  float r = length(vLocalPosition.xy);
  float t = (r - uInnerRadius) / (uOuterRadius - uInnerRadius);
  if (t < 0.0 || t > 1.0) discard;

  // 2. Anatomical ring structure: C Ring, B Ring, Cassini Division, A Ring & Encke Gap
  float bandDensity = 1.0;
  if (t < 0.22) {
    // C Ring (faint inner crepe ring)
    bandDensity = smoothstep(0.0, 0.06, t) * 0.38;
  } else if (t < 0.68) {
    // B Ring (brightest, densest core)
    bandDensity = 0.95 + 0.05 * sin(t * 120.0);
  } else if (t < 0.74) {
    // Cassini Division (prominent dark gap)
    float inGap = smoothstep(0.68, 0.695, t) * (1.0 - smoothstep(0.725, 0.74, t));
    bandDensity = mix(0.95, 0.06, inGap);
  } else if (t < 0.96) {
    // A Ring with Encke gap
    float encke = smoothstep(0.88, 0.888, t) * (1.0 - smoothstep(0.892, 0.90, t));
    bandDensity = mix(0.78, 0.12, encke);
  } else {
    // Outer F-ring edge taper
    bandDensity = (1.0 - smoothstep(0.96, 1.0, t)) * 0.45;
  }

  // 3. High-frequency vinyl record micro-grooves
  float grooves = 0.72 + 0.18 * sin(r * 32.0) + 0.10 * sin(r * 110.0);
  float structure = bandDensity * grooves;

  // 4. Analytical shadow cast by parent planet onto its rings
  vec3 sunDir = normalize(uSunDirection);
  vec3 toRing = vWorldPosition - uPlanetWorldCenter;
  float proj = dot(toRing, sunDir);
  float shadow = 1.0;

  if (proj < 0.0) {
    // Ring point is behind the planet relative to the Sun
    float distToAxis = length(toRing - proj * sunDir);
    float shadowEdge = smoothstep(uPlanetRadius * 0.97, uPlanetRadius * 1.03, distToAxis);
    shadow = mix(0.06, 1.0, shadowEdge);
  }

  vec3 finalColor = uColor * shadow * structure;
  float finalAlpha = uOpacity * structure * max(shadow, 0.35);

  gl_FragColor = vec4(finalColor, finalAlpha);
}
`;

// --- EARTH SKY SHADER WITH ECLIPSE SHADOW PROJECTION ---
const earthSkyVertexShader = `
varying vec2 vUv;
varying vec3 vNormalWorld;
varying vec3 vLocalPos;

void main() {
  vUv = uv;
  vLocalPos = position;
  vNormalWorld = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const earthSkyFragmentShader = `
uniform sampler2D uDayTexture;
uniform vec3 uSunDirection;
uniform vec3 uMoonShadowLocalPos;
uniform float uEclipseIntensity;
varying vec2 vUv;
varying vec3 vNormalWorld;
varying vec3 vLocalPos;

void main() {
  vec4 dayColor = texture2D(uDayTexture, vUv);
  
  // 1. Phased Sunlight on Earth (as viewed from the Moon)
  vec3 N = normalize(vNormalWorld);
  vec3 L = normalize(uSunDirection);
  float NdotL = dot(N, L);
  float light = clamp(NdotL * 1.25 + 0.05, 0.05, 1.0);
  vec3 finalColor = dayColor.rgb * light;

  // 2. Moon's Umbra and Penumbra Shadow on Earth's Surface
  if (uEclipseIntensity > 0.0) {
    vec3 normLocal = normalize(vLocalPos);
    vec3 shadowNorm = normalize(uMoonShadowLocalPos);
    float dist = distance(normLocal, shadowNorm);
    
    // Umbra core (~150-300 km total shadow) and Penumbra outer gradient
    float umbra = smoothstep(0.12, 0.01, dist);
    float penumbra = smoothstep(0.42, 0.08, dist);
    float totalShadow = (umbra * 0.96 + penumbra * 0.55) * uEclipseIntensity;
    
    finalColor *= (1.0 - totalShadow);
  }

  gl_FragColor = vec4(finalColor, 1.0);
}
`;


const interiorCapVertexShader = `
  varying vec3 vLocalPos;
  varying vec3 vNormal;

  void main() {
    // Compute world-aligned local position on the 3D cutout planes
    vec4 modelPos = modelMatrix * vec4(position, 1.0);
    vLocalPos = (modelMatrix * vec4(position, 0.0)).xyz;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const interiorCapFragmentShader = `
  uniform float uRadii[5];
  uniform vec3 uColors[5];
  uniform int uLayerTypes[5];
  uniform int uLayerCount;
  uniform bool uIsGas;

  varying vec3 vLocalPos;
  varying vec3 vNormal;

  // --- 3D Procedural Noise Functions ---
  float hash(vec3 p) {
    p = fract(p * 0.3183099 + 0.1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }

  float noise3D(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x),
          mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
      mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
          mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
  }

  float fbm(vec3 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) {
      v += a * noise3D(p);
      p = p * 2.05 + vec3(13.7, 7.2, 5.1);
      a *= 0.5;
    }
    return v;
  }

  void main() {
    float r = length(vLocalPos) / 5.0;
    if (r > 1.0) discard;

    // Gas Giant smooth gradient mode
    if (uIsGas) {
      vec3 gasColor = uColors[0];
      for (int i = 0; i < 4; i++) {
        if (i + 1 < uLayerCount) {
          float prevR = uRadii[i];
          float nextR = uRadii[i + 1];
          float t = clamp((r - prevR) / max(nextR - prevR, 0.001), 0.0, 1.0);
          if (r >= prevR) gasColor = mix(uColors[i], uColors[i + 1], t);
        }
      }
      // Subtle atmospheric banding noise
      float band = fbm(vLocalPos * 2.5 + vec3(r * 12.0));
      gasColor *= (0.9 + 0.2 * band);
      gl_FragColor = vec4(gasColor, 1.0);
      return;
    }

    // Determine active layer
    vec3 baseColor = uColors[uLayerCount - 1];
    int matType = uLayerTypes[uLayerCount - 1];
    float distToBorder = 1.0;

    for (int i = 0; i < 5; i++) {
      if (i < uLayerCount) {
        if (r <= uRadii[i]) {
          baseColor = uColors[i];
          matType = uLayerTypes[i];
          distToBorder = abs(r - uRadii[i]);
          if (i > 0) distToBorder = min(distToBorder, abs(r - uRadii[i - 1]));
          break;
        }
      }
    }

    vec3 finalColor = baseColor;

    // --- Apply Procedural Texture by Material Type ---
    if (matType == 0) {
      // 0: ROCK / MANTLE (Craggy multi-octave FBM + concentric strata)
      float grain = fbm(vLocalPos * 4.5);
      float fineGrain = noise3D(vLocalPos * 18.0);
      float strata = sin(r * 80.0 + grain * 6.0) * 0.5 + 0.5;
      float rockPattern = mix(grain, fineGrain, 0.35) * 0.7 + strata * 0.3;
      finalColor = baseColor * (0.68 + 0.64 * rockPattern);

    } else if (matType == 1) {
      // 1: ICE / SUBSURFACE OCEAN (Bright specular tint + sharp fracture lines)
      float n1 = fbm(vLocalPos * 3.5);
      float cracks = 1.0 - abs(noise3D(vLocalPos * 9.0 + n1 * 2.0) * 2.0 - 1.0);
      cracks = pow(cracks, 4.0);
      finalColor = mix(baseColor * (0.85 + 0.25 * n1), vec3(0.92, 0.98, 1.0), cracks * 0.55);

    } else if (matType == 2) {
      // 2: METAL / CORE (Crystalline metallic grain + directional sheen)
      float crystal = noise3D(vLocalPos * 14.0);
      float radialSheen = abs(dot(normalize(vLocalPos), vec3(0.577)));
      finalColor = baseColor * (0.8 + 0.35 * crystal) + vec3(0.15) * pow(radialSheen, 3.0);

    } else if (matType == 3) {
      // 3: LAVA / MAGMA (Dark cooling crust with glowing molten fissures)
      float flow = fbm(vLocalPos * 3.0);
      float veins = 1.0 - abs(noise3D(vLocalPos * 6.5 + flow * 2.5) * 2.0 - 1.0);
      veins = smoothstep(0.55, 0.92, veins);
      vec3 crustColor = baseColor * 0.45;
      vec3 magmaGlow = mix(vec3(1.0, 0.35, 0.0), vec3(1.0, 0.92, 0.4), veins);
      finalColor = mix(crustColor, magmaGlow, veins);
    }

    // Subtle dark geological seam between concentric layers
    float borderEdge = smoothstep(0.0, 0.008, distToBorder);
    finalColor *= (0.72 + 0.28 * borderEdge);

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;



