// BASELINE: pre-optimization behavior (copied from projects.js, with only the perf-related changes reverted)
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { DecalGeometry } from "three/addons/geometries/DecalGeometry.js";

let scene, camera, renderer, controls, pmremGenerator;
let keys = [];
let animTextures = [];
const UNIT = 2.1;
const absY = 0.3; // Global resting height for keys
let ambientLight;
let envTexture = null;
let lightMode = "on"; // "on" | "off"
let boardGlowMesh = null;

const PALETTE = {
  BG: 0x050608,
  CHASSIS: 0x121417,
  ALPHA: 0x1c1f23,
  MOD: 0x24282e,
  ACCENT: 0x0a1622,
  LEGEND_LIGHT: 0xe0e0e0,
  LEGEND_DARK: 0x111111,
  BACKLIGHT_A: 0x4da8ff,
  BACKLIGHT_B: 0x2ecc71,
};

export function initKeyboard() {
  const canvas = document.getElementById("keyboard-canvas");
  if (!canvas) return;
  scene = new THREE.Scene();
  scene.background = new THREE.Color(PALETTE.BG);
  camera = new THREE.PerspectiveCamera(
    28,
    window.innerWidth / window.innerHeight,
    0.1,
    1000,
  );
  camera.position.set(13, 15, 18);
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  // Baseline: no DPR cap at 1.0 (higher clarity, higher cost)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  pmremGenerator = new THREE.PMREMGenerator(renderer);
  envTexture = pmremGenerator.fromScene(new RoomEnvironment()).texture;
  scene.environment = envTexture;
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  ambientLight = new THREE.AmbientLight(0xffffff, 0.03);
  scene.add(ambientLight);
  createKeyboard();
  applyLightMode(lightMode);
  animate();
  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  });
  canvas.addEventListener("click", onKeyClick);
  canvas.addEventListener("pointermove", onPointerMove);
}

// Baseline: no pause/resume hooks, no visibility pause.

// Allow non-module scripts (main.js) to control light mode.
window.addEventListener("toggle-light", () => {
  lightMode = lightMode === "on" ? "off" : "on";
  applyLightMode(lightMode);
});
window.addEventListener("set-light-mode", (e) => {
  const mode = e?.detail;
  if (mode !== "on" && mode !== "off") return;
  lightMode = mode;
  applyLightMode(lightMode);
});

function onPointerMove(e) {
  // Baseline: every pointer event raycasts immediately (no rAF throttle, allocates objects)
  const mouse = new THREE.Vector2(
    (e.clientX / window.innerWidth) * 2 - 1,
    -(e.clientY / window.innerHeight) * 2 + 1,
  );
  const rc = new THREE.Raycaster();
  rc.setFromCamera(mouse, camera);
  const intersects = rc.intersectObjects(scene.children, true);
  const found = intersects.some((i) => {
    let t = i.object;
    while (t && !t.userData.id) t = t.parent;
    return t && t.userData.id;
  });
  renderer.domElement.style.cursor = found ? "pointer" : "default";
}

function animate() {
  const time = performance.now() * 0.0003;
  animTextures.forEach((t) => {
    t.offset.x = Math.sin(time * 0.5) * 0.25;
    t.offset.y = Math.cos(time * 0.3) * 0.15;
  });
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

function createAuroraTexture() {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = 1024;
  canvas.height = 1024;
  const grad = ctx.createRadialGradient(512, 512, 0, 512, 512, 900);
  grad.addColorStop(0, "#00ff88");
  grad.addColorStop(0.4, "#00f2fe");
  grad.addColorStop(0.7, "#6d48b1");
  grad.addColorStop(1, "#000428");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 1024);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(0.01, 0.01);
  animTextures.push(texture);
  return texture;
}

function createUnderGlowTexture() {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = 512;
  canvas.height = 512;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const g = ctx.createRadialGradient(256, 256, 8, 256, 256, 250);
  g.addColorStop(0.0, "rgba(255,255,255,0.90)");
  g.addColorStop(0.18, "rgba(255,255,255,0.52)");
  g.addColorStop(0.45, "rgba(255,255,255,0.24)");
  g.addColorStop(0.72, "rgba(255,255,255,0.10)");
  g.addColorStop(1.0, "rgba(255,255,255,0.0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.generateMipmaps = false;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.anisotropy = 2;
  texture.needsUpdate = true;
  return texture;
}

function createBoardGlowTexture() {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = 1024;
  canvas.height = 1024;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const g = ctx.createRadialGradient(512, 512, 40, 512, 512, 520);
  g.addColorStop(0.0, "rgba(255,255,255,0.85)");
  g.addColorStop(0.35, "rgba(255,255,255,0.35)");
  g.addColorStop(0.65, "rgba(255,255,255,0.12)");
  g.addColorStop(1.0, "rgba(255,255,255,0.0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const v = ctx.createRadialGradient(512, 512, 360, 512, 512, 720);
  v.addColorStop(0.0, "rgba(0,0,0,0.0)");
  v.addColorStop(1.0, "rgba(0,0,0,0.55)");
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.generateMipmaps = false;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  return texture;
}

function applyTapering(geo, scale) {
  const pos = geo.attributes.position;
  geo.computeBoundingBox();
  const topY = geo.boundingBox.max.y;
  for (let i = 0; i < pos.count; i++) {
    if (pos.getY(i) > topY - 0.22) {
      pos.setX(i, pos.getX(i) * scale);
      pos.setZ(i, pos.getZ(i) * scale);
    }
  }
  geo.computeVertexNormals();
  pos.needsUpdate = true;
}

function createLKey(wTop, wBot, h, d) {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.lineTo(-wBot + 0.15, 0);
  s.lineTo(-wBot + 0.15, h / 2 + 0.15);
  s.lineTo(-wTop, h / 2 + 0.15);
  s.lineTo(-wTop, h);
  s.lineTo(0, h);
  s.lineTo(0, 0);
  const geo = new THREE.ExtrudeGeometry(s, {
    depth: d,
    bevelEnabled: true,
    bevelThickness: 0.12,
    bevelSize: 0.12,
  });
  geo.center();
  geo.rotateX(Math.PI / 2);
  geo.rotateY(Math.PI);
  geo.rotateZ(Math.PI);
  applyTapering(geo, 0.82);
  return geo;
}

function createLegend(
  mesh,
  text,
  kw,
  kd,
  color,
  offset = { x: 0, y: 0.402, z: 0 },
) {
  const baseCanvas = document.createElement("canvas");
  const baseCtx = baseCanvas.getContext("2d");
  baseCanvas.width = 512;
  baseCanvas.height = 512 / (kw / kd);
  baseCtx.fillStyle = color;
  baseCtx.textAlign = "center";
  baseCtx.textBaseline = "middle";
  baseCtx.font = `bold ${text.length > 5 ? 85 : 125}px Pretendard`;
  if (["⚙", "♥", "⛶", "⏻", "✎"].includes(text))
    baseCtx.font = "bold 220px sans-serif";
  baseCtx.fillText(text, baseCanvas.width / 2, baseCanvas.height / 2);
  const baseTexture = new THREE.CanvasTexture(baseCanvas);
  baseTexture.anisotropy = 8;
  baseTexture.generateMipmaps = true;
  baseTexture.needsUpdate = true;

  const glowCanvas = document.createElement("canvas");
  const glowCtx = glowCanvas.getContext("2d");
  glowCanvas.width = baseCanvas.width;
  glowCanvas.height = baseCanvas.height;
  glowCtx.textAlign = "center";
  glowCtx.textBaseline = "middle";
  glowCtx.font = baseCtx.font;
  glowCtx.fillStyle = "#ffffff";
  glowCtx.shadowColor = "#ffffff";
  glowCtx.shadowBlur = 42;
  glowCtx.fillText(text, glowCanvas.width / 2, glowCanvas.height / 2);
  glowCtx.shadowBlur = 0;
  glowCtx.globalAlpha = 0.92;
  glowCtx.fillText(text, glowCanvas.width / 2, glowCanvas.height / 2);
  const glowTexture = new THREE.CanvasTexture(glowCanvas);
  glowTexture.anisotropy = 8;
  glowTexture.generateMipmaps = false;
  glowTexture.minFilter = THREE.LinearFilter;
  glowTexture.magFilter = THREE.LinearFilter;
  glowTexture.needsUpdate = true;

  const decalGeo = new DecalGeometry(
    mesh,
    new THREE.Vector3(offset.x, offset.y, offset.z),
    new THREE.Euler(-Math.PI / 2, 0, 0),
    new THREE.Vector3(kw * 0.75, kd * 0.75, 0.15),
  );
  const dm = new THREE.Mesh(
    decalGeo,
    new THREE.MeshPhysicalMaterial({
      map: baseTexture,
      transparent: true,
      polygonOffset: true,
      polygonOffsetFactor: -10,
    }),
  );
  dm.userData = {
    kind: "legend",
    baseMaterial: dm.material,
    baseTexture,
    glowTexture,
  };
  dm.renderOrder = 10;
  return dm;
}

const fullScreenElement = { height: 6.7, width: 8.8, thickness: 0.45 };

function createKeyboard() {
  const cMat = new THREE.MeshPhysicalMaterial({
    color: PALETTE.CHASSIS,
    metalness: 0.9,
    roughness: 0.2,
  });
  const baseOuter = new THREE.Mesh(
    new RoundedBoxGeometry(
      fullScreenElement.width + 0.6,
      0.45,
      fullScreenElement.height + 0.6,
      4,
      0.3,
    ),
    cMat,
  );
  baseOuter.position.y = -0.38;
  scene.add(baseOuter);

  const fS = new THREE.Shape();
  const w = fullScreenElement.width + 0.6,
    h = fullScreenElement.height + 0.6,
    r = 0.4;
  fS.moveTo(-w / 2 + r, -h / 2);
  fS.lineTo(w / 2 - r, -h / 2);
  fS.absarc(w / 2 - r, -h / 2 + r, r, -Math.PI / 2, 0, false);
  fS.lineTo(w / 2, h / 2 - r);
  fS.absarc(w / 2 - r, h / 2 - r, r, 0, Math.PI / 2, false);
  fS.lineTo(-w / 2 + r, h / 2);
  fS.absarc(-w / 2 + r, h / 2 - r, r, Math.PI / 2, Math.PI, false);
  fS.lineTo(-w / 2, -h / 2 + r);
  fS.absarc(-w / 2 + r, -h / 2 + r, r, Math.PI, Math.PI * 1.5, false);
  const hP = new THREE.Path();
  const hw = fullScreenElement.width,
    hh = fullScreenElement.height,
    hr = 0.2;
  hP.moveTo(-hw / 2 + hr, -hh / 2);
  hP.lineTo(hw / 2 - hr, -hh / 2);
  hP.absarc(hw / 2 - hr, -hh / 2 + hr, hr, -Math.PI / 2, 0, false);
  hP.lineTo(hw / 2, hh / 2 - hr);
  hP.absarc(hw / 2 - hr, hh / 2 - hr, hr, 0, Math.PI / 2, false);
  hP.lineTo(-hw / 2 + hr, hh / 2);
  hP.absarc(-hw / 2 + hr, hh / 2 - hr, hr, Math.PI / 2, Math.PI, false);
  hP.lineTo(-hw / 2, -hh / 2 + hr);
  hP.absarc(-hw / 2 + hr, -hh / 2 + hr, hr, Math.PI, Math.PI * 1.5, false);
  fS.holes.push(hP);
  const frame = new THREE.Mesh(
    new THREE.ExtrudeGeometry(fS, {
      depth: 0.85,
      bevelEnabled: true,
      bevelThickness: 0.12,
      bevelSize: 0.12,
      bevelSegments: 8,
    }),
    cMat,
  );
  frame.rotateX(Math.PI / 2);
  frame.position.y = -0.15;
  scene.add(frame);

  const boardGlowTex = createBoardGlowTexture();
  const boardGlowMat = new THREE.MeshBasicMaterial({
    map: boardGlowTex,
    transparent: true,
    opacity: 0.0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    depthTest: true,
    color: 0xffffff,
  });
  boardGlowMat.toneMapped = false;

  const boardW = fullScreenElement.width + 0.35;
  const boardH = fullScreenElement.height + 0.35;
  boardGlowMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(boardW, boardH),
    boardGlowMat,
  );
  boardGlowMesh.rotation.x = -Math.PI / 2;
  boardGlowMesh.position.y = 0.12;
  boardGlowMesh.renderOrder = 2;
  boardGlowMesh.userData = { kind: "boardGlow" };
  scene.add(boardGlowMesh);

  const layout = [
    {
      id: "tab",
      label: "⏻",
      pos: [-3.15, absY, -2.15],
      color: PALETTE.MOD,
      scale: [2.1, 0.8, 2.1],
      legend: PALETTE.LEGEND_LIGHT,
    },
    {
      id: "resume",
      label: "Resume",
      pos: [0.0, absY, -2.15],
      material: "aurora",
      scale: [4.2, 0.8, 2.1],
      legend: PALETTE.LEGEND_DARK,
    },
    {
      id: "heart",
      label: "♥",
      pos: [3.15, absY, -2.15],
      color: PALETTE.MOD,
      scale: [2.1, 0.8, 2.1],
      legend: PALETTE.LEGEND_LIGHT,
    },
    {
      id: "edit",
      label: "✎",
      pos: [-3.15, absY, 0.0],
      color: PALETTE.MOD,
      scale: [2.1, 0.8, 2.1],
      legend: PALETTE.LEGEND_LIGHT,
    },
    {
      id: "fs",
      label: "⛶",
      pos: [-1.05, absY, 0.0],
      color: PALETTE.MOD,
      scale: [2.1, 0.8, 2.1],
      legend: PALETTE.LEGEND_LIGHT,
    },
    {
      id: "works",
      label: "Works",
      pos: [-1.05, absY, 2.15],
      color: 0xeeeeee,
      material: "chrome",
      scale: [6.3, 0.8, 2.1],
      legend: PALETTE.LEGEND_DARK,
    },
    {
      id: "contact",
      label: "Hire Me ↵",
      pos: [2.1, absY, 1.07],
      material: "aurora",
      type: "iso_enter",
      scale: [3.8, 0.7, 3.8],
      legend: PALETTE.LEGEND_DARK,
      textOffset: { x: 0, y: 0.402, z: -0.8 },
    },
  ];

  layout.forEach((c) => {
    const kG = new THREE.Group();
    kG.position.set(...c.pos);
    let geo;
    let kw = c.scale ? c.scale[0] : 2.1,
      kd = c.scale ? c.scale[2] : 2.1;
    if (c.type === "iso_enter")
      geo = createLKey(c.scale[0], c.scale[0] * 0.5, c.scale[2], 0.5);
    else {
      geo = new RoundedBoxGeometry(kw, 0.8, kd, 8, 0.12);
      applyTapering(geo, 0.82);
    }
    const keyMaterial = new THREE.MeshPhysicalMaterial({
      color: c.color || 0xffffff,
      map: c.material === "aurora" ? createAuroraTexture() : null,
      metalness: c.material === "chrome" ? 1.0 : 0.1,
      roughness: 0.4,
    });
    const mesh = new THREE.Mesh(geo, keyMaterial);
    mesh.userData = { id: c.id, kind: "keycap", baseMaterial: keyMaterial };
    kG.add(mesh);
    const legendMesh = createLegend(
      mesh,
      c.label,
      kw,
      kd,
      "#" + c.legend.toString(16).padStart(6, "0"),
      c.textOffset,
    );
    kG.add(legendMesh);

    const makeBL = () => {
      const l = new THREE.PointLight(PALETTE.BACKLIGHT_A, 0, 5.0);
      l.userData = { kind: "backlight" };
      return l;
    };
    const bl1 = makeBL();
    const bl2 = makeBL();
    const bl3 = makeBL();
    const bl4 = makeBL();

    const spreadX = Math.max(0.25, kw * 0.3);
    const spreadZ = Math.max(0.25, kd * 0.3);
    const y = -0.24;
    bl1.position.set(-spreadX, y, -spreadZ);
    bl2.position.set(spreadX, y, -spreadZ);
    bl3.position.set(-spreadX, y, spreadZ);
    bl4.position.set(spreadX, y, spreadZ);

    kG.add(bl1, bl2, bl3, bl4);
    kG.userData = {
      id: c.id,
      kind: "keyGroup",
      backLights: [bl1, bl2, bl3, bl4],
    };

    const ugTex = createUnderGlowTexture();
    const ugMat = new THREE.MeshBasicMaterial({
      map: ugTex,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: true,
      color: 0xffffff,
    });
    ugMat.toneMapped = false;
    const ugW = kw * 1.05;
    const ugH = kd * 1.05;
    const underGlow = new THREE.Mesh(new THREE.PlaneGeometry(ugW, ugH), ugMat);
    underGlow.rotation.x = -Math.PI / 2;
    underGlow.position.set(0, -0.38, 0);
    underGlow.renderOrder = 1;
    underGlow.userData = { kind: "underglow" };
    kG.add(underGlow);
    kG.userData.underGlow = underGlow;

    const ugMat2 = new THREE.MeshBasicMaterial({
      map: ugTex,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: true,
      color: 0xffffff,
    });
    ugMat2.toneMapped = false;
    const underGlowWide = new THREE.Mesh(
      new THREE.PlaneGeometry(kw * 1.55, kd * 1.55),
      ugMat2,
    );
    underGlowWide.rotation.x = -Math.PI / 2;
    underGlowWide.position.set(0, -0.40, 0);
    underGlowWide.renderOrder = 0;
    underGlowWide.userData = { kind: "underglowWide" };
    kG.add(underGlowWide);
    kG.userData.underGlowWide = underGlowWide;

    if (c.material === "aurora") {
      const accent = new THREE.PointLight(0x00d2ff, 6, 4);
      accent.userData = { kind: "accentLight", baseIntensity: 6 };
      kG.add(accent);
      kG.userData.accentLight = accent;
    }
    scene.add(kG);
    keys.push(kG);
  });
}

function getBacklightColorForKey(id) {
  const a = new THREE.Color(PALETTE.BACKLIGHT_A);
  const b = new THREE.Color(PALETTE.BACKLIGHT_B);
  const t =
    id === "resume" || id === "contact"
      ? 0.35
      : id === "works"
        ? 0.15
        : id === "tab" || id === "figma"
          ? 0.55
          : 0.45;
  return a.lerp(b, t);
}

function applyLightMode(mode) {
  const btn = document.getElementById("btn-light-toggle");
  if (btn) btn.textContent = `Light: ${mode.toUpperCase()}`;

  if (!scene || !renderer) return;

  if (mode === "on") {
    scene.environment = envTexture;
    if (ambientLight) ambientLight.intensity = 0.03;
    renderer.toneMappingExposure = 1.0;

    keys.forEach((kG) => {
      const keycap = kG.children.find((c) => c.userData?.kind === "keycap");
      if (keycap?.userData?.baseMaterial)
        keycap.material = keycap.userData.baseMaterial;

      const legend = kG.children.find((c) => c.userData?.kind === "legend");
      if (legend?.userData?.baseMaterial)
        legend.material = legend.userData.baseMaterial;

      const backLights = kG.userData?.backLights;
      if (backLights) backLights.forEach((l) => (l.intensity = 0));

      const underGlow = kG.userData?.underGlow;
      if (underGlow) underGlow.material.opacity = 0.0;
      const underGlowWide = kG.userData?.underGlowWide;
      if (underGlowWide) underGlowWide.material.opacity = 0.0;

      const accent = kG.userData?.accentLight;
      if (accent) accent.intensity = accent.userData?.baseIntensity ?? 6;
    });
    if (boardGlowMesh) boardGlowMesh.material.opacity = 0.0;
    return;
  }

  scene.environment = null;
  if (ambientLight) ambientLight.intensity = 0.006;
  renderer.toneMappingExposure = 0.95;

  if (boardGlowMesh) {
    const g = boardGlowMesh.material;
    g.opacity = 0.28;
    g.color = new THREE.Color(PALETTE.BACKLIGHT_A).lerp(
      new THREE.Color(PALETTE.BACKLIGHT_B),
      0.45,
    );
  }

  keys.forEach((kG) => {
    const id = kG.userData?.id;
    const backlightColor = getBacklightColorForKey(id);

    const keycap = kG.children.find((c) => c.userData?.kind === "keycap");
    if (keycap) {
      if (!keycap.userData.offMaterial) {
        const base = keycap.userData.baseMaterial;
        const m = base.clone();
        m.color = new THREE.Color(0x070809);
        m.map = null;
        m.emissive = new THREE.Color(0x000000);
        m.emissiveMap = null;
        m.emissiveIntensity = 0;
        m.roughness = 0.92;
        m.metalness = 0.06;
        keycap.userData.offMaterial = m;
      }
      keycap.material = keycap.userData.offMaterial;
    }

    const legend = kG.children.find((c) => c.userData?.kind === "legend");
    if (legend) {
      if (!legend.userData.offMaterial) {
        const m = new THREE.MeshBasicMaterial({
          map: legend.userData.glowTexture,
          transparent: true,
          opacity: 0.9,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          depthTest: true,
          polygonOffset: true,
          polygonOffsetFactor: -10,
          polygonOffsetUnits: -4,
          color: 0xffffff,
        });
        m.toneMapped = false;
        legend.userData.offMaterial = m;
      }
      legend.material = legend.userData.offMaterial;
      legend.material.color = backlightColor.clone().multiplyScalar(1.2);
    }

    const backLights = kG.userData?.backLights;
    if (backLights) {
      const isAccentKey = Boolean(kG.userData?.accentLight);
      const intensity = isAccentKey ? 0.42 : 0.32;
      const distance = isAccentKey ? 3.8 : 3.2;
      backLights.forEach((l) => {
        l.color.copy(backlightColor);
        l.intensity = intensity;
        l.distance = distance;
        l.decay = 2;
      });
    }

    const underGlow = kG.userData?.underGlow;
    if (underGlow) {
      underGlow.material.color = backlightColor.clone().multiplyScalar(1.15);
      underGlow.material.opacity = 0.26;
    }

    const underGlowWide = kG.userData?.underGlowWide;
    if (underGlowWide) {
      underGlowWide.material.color = backlightColor.clone().multiplyScalar(0.95);
      underGlowWide.material.opacity = 0.14;
    }

    const accent = kG.userData?.accentLight;
    if (accent) {
      accent.color.setHex(0x00d2ff);
      accent.intensity = 1.8;
      accent.distance = 4.2;
      accent.decay = 2;
    }
  });
}

function playClickSound() {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();

  const clickOsc = ctx.createOscillator();
  const clickGain = ctx.createGain();
  clickOsc.type = "sine";
  clickOsc.frequency.setValueAtTime(5800, ctx.currentTime);
  clickOsc.frequency.exponentialRampToValueAtTime(
    3600,
    ctx.currentTime + 0.007,
  );
  clickGain.gain.setValueAtTime(0.18, ctx.currentTime);
  clickGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.014);

  const bufferSize = ctx.sampleRate * 0.018;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  const noiseGain = ctx.createGain();
  const hpFilter = ctx.createBiquadFilter();
  hpFilter.type = "highpass";
  hpFilter.frequency.value = 3800;

  noiseGain.gain.setValueAtTime(0.04, ctx.currentTime);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.016);

  const thud = ctx.createOscillator();
  const thudGain = ctx.createGain();
  thud.type = "triangle";
  thud.frequency.setValueAtTime(220, ctx.currentTime);
  thudGain.gain.setValueAtTime(0.03, ctx.currentTime);
  thudGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.02);

  clickOsc.connect(clickGain);
  clickGain.connect(ctx.destination);
  noise.connect(hpFilter);
  hpFilter.connect(noiseGain);
  noiseGain.connect(ctx.destination);
  thud.connect(thudGain);
  thudGain.connect(ctx.destination);

  clickOsc.start();
  noise.start();
  thud.start();
  clickOsc.stop(ctx.currentTime + 0.026);
  noise.stop(ctx.currentTime + 0.026);
  thud.stop(ctx.currentTime + 0.026);
}

function onKeyClick(e) {
  const mouse = new THREE.Vector2(
    (e.clientX / window.innerWidth) * 2 - 1,
    -(e.clientY / window.innerHeight) * 2 + 1,
  );
  const rc = new THREE.Raycaster();
  rc.setFromCamera(mouse, camera);
  const intersects = rc.intersectObjects(scene.children, true);
  if (intersects.length > 0) {
    let t = intersects[0].object;
    while (t && !t.userData.id) t = t.parent;
    if (t && t.userData.id) {
      playClickSound();
      const g = t.parent;
      const start = performance.now();
      function s(time) {
        let p = (time - start) / 120;
        if (p < 1) {
          let v = Math.sin(p * Math.PI);
          g.position.y = absY - 0.22 * v;
          requestAnimationFrame(s);
        } else {
          g.position.y = absY;
        }
      }
      requestAnimationFrame(s);
      window.dispatchEvent(
        new CustomEvent("key-pressed", { detail: t.userData.id }),
      );
    }
  }
}

initKeyboard();

