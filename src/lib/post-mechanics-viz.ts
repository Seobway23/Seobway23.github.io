/**
 * 포스트 본문 내 역학/시각화 테스트 블록 하이드레이션.
 * 마크다운 펜스: ```diagramatics | jsxgraph | three
 * 본문은 JSON: { "preset": "..." } (파싱 실패 시 preset 기본값 사용)
 */

type VizSpec = { preset?: string; interactive?: boolean; caption?: string };

function parseSpec(code: string): VizSpec {
  try {
    const o = JSON.parse(code) as VizSpec;
    return o && typeof o === "object" ? o : {};
  } catch {
    return {};
  }
}

function captionAfter(wrapper: HTMLElement, badge: string, text: string) {
  const cap = document.createElement("div");
  cap.className = "mechanics-viz-caption";
  cap.innerHTML =
    `<span class="mechanics-viz-badge">${badge}</span>` +
    (text ? `<span class="mechanics-viz-text">${text}</span>` : "");
  wrapper.insertAdjacentElement("afterend", cap);
}

type EarthPressureMode = "both" | "active" | "passive";

async function renderDiagramatics(el: HTMLElement, spec: VizSpec) {
  const {
    V2,
    polygon,
    rectangle_corner,
    diagram_combine,
    arrow1,
    text,
    draw_to_svg_element,
    circle,
    line,
  } = await import("diagramatics");

  const preset = spec.preset || "earth_pressure";
  let diagram;

  const drawOpts = {
    background_color: "#121214",
    padding: 22,
    render_text: true,
    global_scale_factor: 1.32,
  } as const;

  const buildEarthPressureDiagram = (mode: EarthPressureMode) => {
    const soil = polygon([V2(-5, -2.5), V2(5, -2.5), V2(5, 2.5), V2(-5, 2.5)])
      .fill("#8d7b52")
      .stroke("#5c4f35")
      .strokewidth(1.6);
    const wall = rectangle_corner(V2(-0.2, -2.5), V2(0.2, 2.5))
      .fill("#3d3d42")
      .stroke("#1a1a1c")
      .strokewidth(1.1);
    const activeWedge = polygon([V2(0.2, -2.5), V2(3.8, -2.5), V2(0.2, 0.45)])
      .fill("rgba(200, 90, 70, 0.38)")
      .stroke("#c62828")
      .strokewidth(1.35)
      .strokedasharray([6, 4]);
    const passiveWedge = polygon([V2(0.2, -2.5), V2(3.2, -2.5), V2(0.2, 1.15)])
      .fill("rgba(70, 130, 200, 0.32)")
      .stroke("#1565c0")
      .strokewidth(1.35)
      .strokedasharray([6, 4]);
    /** 주동: 흙이 벽을 밀음 — 화살표는 흙(오른쪽)에서 벽(왼쪽)으로 */
    const arrowSoilToWall = arrow1(V2(2.35, -0.42), V2(0.48, -0.42), 0.16)
      .stroke("#ff8a80")
      .fill("#ff8a80");
    /** 수동: 벽이 흙을 밀음 — 화살표는 벽에서 흙 안쪽으로 */
    const arrowWallToSoil = arrow1(V2(0.48, 0.72), V2(2.05, 0.72), 0.16)
      .stroke("#82b1ff")
      .fill("#82b1ff");
    const titleBoth = text("주동 = 흙→옹벽(흙이 미는 토압)   |   수동 = 옹벽→흙(벽이 흙을 밀 때의 저항)")
      .textfill("#e0e0e0")
      .fontsize(13);
    const labActive = text("주동: 흙이 벽을 밀어 옴 (Ph 방향)")
      .textfill("#ffcdd2")
      .fontsize(13);
    const labPassive = text("수동: 벽이 흙을 밀어 넣음 (벽이 흙에 주는 힘)")
      .textfill("#bbdefb")
      .fontsize(13);
    const labSoil = text("뒤채움 흙").textfill("#d7ccc8").fontsize(12).translate(V2(3.2, 2.15));
    const labWall = text("옹벽").textfill("#bdbdbd").fontsize(12).translate(V2(-0.05, 0.2));

    if (mode === "both") {
      return diagram_combine(
        soil,
        wall,
        labSoil,
        labWall,
        titleBoth.translate(V2(-4.75, 2.62)),
        activeWedge,
        passiveWedge,
        arrowSoilToWall,
        arrowWallToSoil,
        labActive.translate(V2(-4.75, 2.12)),
        labPassive.translate(V2(-4.75, 1.62)),
      );
    }
    if (mode === "active") {
      return diagram_combine(
        soil,
        wall,
        labSoil,
        labWall,
        activeWedge,
        arrowSoilToWall,
        labActive.translate(V2(-4.75, 2.12)),
      );
    }
    return diagram_combine(
      soil,
      wall,
      labSoil,
      labWall,
      passiveWedge,
      arrowWallToSoil,
      labPassive.translate(V2(-4.75, 2.12)),
    );
  };

  if (preset === "earth_pressure") {
    const interactive = spec.interactive === true;
    if (interactive) {
      const toolbar = document.createElement("div");
      toolbar.className = "mechanics-viz-toolbar";
      toolbar.setAttribute("role", "group");
      toolbar.setAttribute("aria-label", "주동·수동 보기 전환");

      const mkBtn = (label: string, mode: EarthPressureMode) => {
        const b = document.createElement("button");
        b.type = "button";
        b.textContent = label;
        b.dataset.mode = mode;
        return b;
      };
      toolbar.append(
        mkBtn("둘 다", "both"),
        mkBtn("주동만 (흙→벽)", "active"),
        mkBtn("수동만 (벽→흙)", "passive"),
      );
      el.appendChild(toolbar);

      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("width", "100%");
      svg.setAttribute("height", "420");
      svg.style.display = "block";
      svg.classList.add("diagramatics-canvas");
      el.appendChild(svg);

      let current: EarthPressureMode = "both";
      const redraw = () => {
        draw_to_svg_element(svg, buildEarthPressureDiagram(current), { ...drawOpts });
        toolbar.querySelectorAll("button").forEach((btn) => {
          const m = (btn as HTMLButtonElement).dataset.mode as EarthPressureMode;
          btn.classList.toggle("mechanics-viz-toolbar-btn--active", m === current);
        });
      };
      toolbar.addEventListener("click", (ev) => {
        const t = (ev.target as HTMLElement).closest("button");
        if (!t?.dataset.mode) return;
        current = t.dataset.mode as EarthPressureMode;
        redraw();
      });
      redraw();
      return;
    }
    diagram = buildEarthPressureDiagram("both");
  } else if (preset === "retaining_wall_fbd") {
    const ground = line(V2(-2.2, -2.35), V2(2.2, -2.35)).stroke("#666").strokewidth(1.2);
    const wall = rectangle_corner(V2(-0.24, -2.32), V2(0.24, 2.15))
      .fill("#3d3d42")
      .stroke("#1a1a1c")
      .strokewidth(1.2);
    const ph = arrow1(V2(1.55, 0.55), V2(0.32, 0.55), 0.13).stroke("#e57373").fill("#e57373");
    const wgt = arrow1(V2(0, 1.85), V2(0, 0.35), 0.12).stroke("#bdbdbd").fill("#bdbdbd");
    const rn = arrow1(V2(0, -2.32), V2(0, -0.85), 0.1).stroke("#81c784").fill("#81c784");
    const tfr = arrow1(V2(-0.24, -2.28), V2(-1.25, -2.28), 0.1).stroke("#ffb74d").fill("#ffb74d");
    diagram = diagram_combine(
      ground,
      wall,
      ph,
      wgt,
      rn,
      tfr,
      text("Ph (토압 합력)").textfill("#ffcdd2").fontsize(10).translate(V2(0.85, 0.95)),
      text("W (자중)").textfill("#e0e0e0").fontsize(10).translate(V2(0.35, 1.1)),
      text("Rn (저면 반력)").textfill("#c8e6c9").fontsize(10).translate(V2(0.4, -1.35)),
      text("T (저면 마찰)").textfill("#ffe0b2").fontsize(10).translate(V2(-1.15, -1.95)),
      text("기초 저면").textfill("#aaa").fontsize(9).translate(V2(0.55, -2.65)),
    );
  } else if (preset === "lever_moment") {
    const ground = line(V2(-1.6, -0.55), V2(1.6, -0.55)).stroke("#666").strokewidth(1);
    const pivot = polygon([V2(-0.12, -0.55), V2(0.12, -0.55), V2(0, -0.85)])
      .fill("#888")
      .stroke("#444")
      .strokewidth(1);
    const beam = line(V2(-1.35, -0.08), V2(1.35, -0.08)).stroke("#bdbdbd").strokewidth(5);
    const f = arrow1(V2(1.0, 1.05), V2(1.0, -0.08), 0.11).stroke("#e57373").fill("#e57373");
    const dline = line(V2(1.0, -0.55), V2(0, -0.55)).stroke("#90caf9").strokewidth(0.8).strokedasharray([3, 3]);
    diagram = diagram_combine(
      ground,
      pivot,
      beam,
      f,
      dline,
      text("축(지지점)").textfill("#aaa").fontsize(9).translate(V2(-0.35, -1.05)),
      text("팔 길이 d").textfill("#bbdefb").fontsize(10).translate(V2(0.35, -0.42)),
      text("힘 F").textfill("#ffcdd2").fontsize(10).translate(V2(1.05, 0.35)),
      text("모멘트 ≈ F × d (축에 대한 ‘돌리는 세기’)").textfill("#ccc").fontsize(10).translate(V2(-1.45, 0.55)),
    );
  } else if (preset === "balance_horizontal") {
    const block = rectangle_corner(V2(-0.4, -0.28), V2(0.4, 0.28))
      .fill("#4a4a50")
      .stroke("#222")
      .strokewidth(1);
    const push = arrow1(V2(-1.35, 0), V2(-0.42, 0), 0.11).stroke("#e57373").fill("#e57373");
    const resist = arrow1(V2(1.35, 0), V2(0.42, 0), 0.11).stroke("#64b5f6").fill("#64b5f6");
    diagram = diagram_combine(
      block,
      push,
      resist,
      text("밀어오는 힘").textfill("#ffcdd2").fontsize(10).translate(V2(-1.25, 0.42)),
      text("막는 힘").textfill("#bbdefb").fontsize(10).translate(V2(0.55, 0.42)),
      text("크기가 같으면 수평으로 안 움직임 (ΣFx = 0)").textfill("#ccc").fontsize(10).translate(V2(-1.55, -0.62)),
    );
  } else if (preset === "pressure_triangle_resultant") {
    const ground = line(V2(-0.5, -2.35), V2(2.2, -2.35)).stroke("#666").strokewidth(1);
    const wall = rectangle_corner(V2(-0.24, -2.32), V2(0.24, 2.12))
      .fill("#3d3d42")
      .stroke("#1a1a1c")
      .strokewidth(1);
    const tri = polygon([V2(0.24, 2.12), V2(0.24, -2.32), V2(1.05, -2.32)])
      .fill("rgba(229, 115, 115, 0.25)")
      .stroke("#e57373")
      .strokewidth(1.2);
    const cy = (2.12 + (-2.32) + (-2.32)) / 3;
    const cx = (0.24 + 0.24 + 1.05) / 3;
    const dot = circle(0.08).fill("#ffeb3b").stroke("#f9a825").strokewidth(1);
    diagram = diagram_combine(
      ground,
      wall,
      tri,
      dot.translate(V2(cx, cy)),
      line(V2(0.24, -2.32), V2(cx, cy)).stroke("#888").strokewidth(0.8).strokedasharray([4, 3]),
      text("삼각형 = 수평 토압 분포(0→최대)").textfill("#ffcdd2").fontsize(13).translate(V2(-0.45, 2.35)),
      text("노란 점 = 합력 Ph 작용점").textfill("#fff59d").fontsize(13).translate(V2(0.15, -0.25)),
    );
  } else if (preset === "unit_circle_trig") {
    const r = 2;
    const circ = circle(r).fill("none").stroke("#90caf9").strokewidth(1.5);
    const xaxis = line(V2(-2.6, 0), V2(2.6, 0)).stroke("#888").strokewidth(0.8);
    const yaxis = line(V2(0, -2.6), V2(0, 2.6)).stroke("#888").strokewidth(0.8);
    const theta = Math.PI * 0.35;
    const px = r * Math.cos(theta);
    const py = r * Math.sin(theta);
    const rad = line(V2(0, 0), V2(px, py)).stroke("#ffb74d").strokewidth(2);
    const projX = line(V2(px, py), V2(px, 0))
      .stroke("#81c784")
      .strokewidth(1)
      .strokedasharray([4, 3]);
    const projY = line(V2(px, py), V2(0, py))
      .stroke("#ba68c8")
      .strokewidth(1)
      .strokedasharray([4, 3]);
    diagram = diagram_combine(
      xaxis,
      yaxis,
      circ,
      rad,
      projX,
      projY,
      text("cos θ").textfill("#a5d6a7").fontsize(12).translate(V2(px / 2 - 0.2, -0.35)),
      text("sin θ").textfill("#ce93d8").fontsize(12).translate(V2(0.25, py / 2)),
    );
  } else {
    diagram = text("알 수 없는 preset").textfill("#ffffff");
  }

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", "100%");
  svg.setAttribute("height", "400");
  svg.style.display = "block";
  svg.classList.add("diagramatics-canvas");
  el.appendChild(svg);
  draw_to_svg_element(svg, diagram, { ...drawOpts });
}

async function renderJsxgraph(el: HTMLElement, spec: VizSpec) {
  const JXG = (await import("jsxgraph")).default;
  el.style.minHeight = spec.preset === "ka_kp_linear" ? "380px" : "300px";
  el.style.width = "100%";

  const preset = spec.preset || "harmonic_ts";

  const axisStroke = "#9ca3af";
  const axesKaKp = {
    x: {
      name: "깊이 z (m, 지표에서 아래로)",
      strokeColor: axisStroke,
      ticks: {
        strokeColor: "#6b7280",
        label: { strokeColor: "#d1d5db" },
      },
      label: { position: "rt" as const, offset: [-5, 16], strokeColor: "#e5e7eb" },
    },
    y: {
      name: "수평 토압 성분 σh (임의 단위, ∝ z)",
      strokeColor: axisStroke,
      ticks: {
        strokeColor: "#6b7280",
        label: { strokeColor: "#d1d5db" },
      },
      label: { position: "rt" as const, offset: [10, -6], strokeColor: "#e5e7eb" },
    },
  };
  const axesDefault = {
    x: { name: "t", strokeColor: "#888" },
    y: { name: "x(t)", strokeColor: "#888" },
  };

  // 컨테이너는 반드시 이미 DOM에 붙어 있어야 함 (id 문자열만 넘기면 미부착 시 not found)
  const brd = JXG.JSXGraph.initBoard(el, {
    boundingbox: preset === "ka_kp_linear" ? [-0.35, 3.45, 5.35, -0.35] : [-0.5, 1.3, 6.5, -1.3],
    axis: true,
    showNavigation: preset === "ka_kp_linear",
    showCopyright: false,
    keepaspectratio: false,
    pan: { enabled: preset === "ka_kp_linear" },
    zoom: { enabled: preset === "ka_kp_linear" },
    defaultAxes: preset === "ka_kp_linear" ? axesKaKp : axesDefault,
  });

  if (preset === "ka_kp_linear") {
    /** 동일 z에서 Kp > Ka 이므로 수동(빨강)이 더 가파름 */
    brd.create(
      "functiongraph",
      [
        function (x: number) {
          return 0.22 * x;
        },
      ],
      { strokeColor: "#42a5f5", strokeWidth: 3, name: "Ka (주동, 완만)" },
    );
    brd.create(
      "functiongraph",
      [
        function (x: number) {
          return 0.45 * x;
        },
      ],
      { strokeColor: "#ef5350", strokeWidth: 3, name: "Kp (수동, 가파름)" },
    );
    brd.create("text", [-0.32, 3.28, "파랑: σh ∝ Ka·z (주동, 완만)"], {
      fontSize: 13,
      strokeColor: "#93c5fd",
    });
    brd.create("text", [-0.32, 2.98, "빨강: σh ∝ Kp·z (수동, 가파름)"], {
      fontSize: 13,
      strokeColor: "#fca5a5",
    });
    brd.create("text", [-0.32, 2.65, "같은 z에서 Kp>Ka → 수동 쪽 압력이 더 큼 (기울기는 임의)"], {
      fontSize: 11,
      strokeColor: "#9ca3af",
    });
  } else {
    brd.create(
      "functiongraph",
      [
        function (x: number) {
          return Math.cos(x);
        },
      ],
      { strokeColor: "#66bb6a", strokeWidth: 2 },
    );
    brd.create(
      "functiongraph",
      [
        function (x: number) {
          return Math.sin(x);
        },
      ],
      { strokeColor: "#ffa726", strokeWidth: 2 },
    );
  }
}

function addTetrahedronMesh(
  THREE: typeof import("three"),
  scene: THREE.Scene,
  a: THREE.Vector3,
  b: THREE.Vector3,
  c: THREE.Vector3,
  d: THREE.Vector3,
  color: number,
  opacity: number,
) {
  const positions = new Float32Array([
    a.x,
    a.y,
    a.z,
    b.x,
    b.y,
    b.z,
    c.x,
    c.y,
    c.z,
    d.x,
    d.y,
    d.z,
  ]);
  const indices = [0, 1, 2, 0, 1, 3, 1, 2, 3, 0, 2, 3];
  const geom = new THREE.BufferGeometry();
  geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geom.setIndex(indices);
  geom.computeVertexNormals();
  const mat = new THREE.MeshStandardMaterial({
    color,
    transparent: true,
    opacity,
    side: THREE.DoubleSide,
    depthWrite: false,
    roughness: 0.85,
    metalness: 0.05,
  });
  const mesh = new THREE.Mesh(geom, mat);
  scene.add(mesh);
  return mesh as import("three").Mesh;
}

async function renderThree(el: HTMLElement, spec: VizSpec) {
  const THREE = await import("three");
  const { OrbitControls } = await import("three/addons/controls/OrbitControls.js");
  const preset = spec.preset || "retaining_3d";
  const interactiveRetain = preset === "retaining_3d" && spec.interactive === true;

  el.style.display = "flex";
  el.style.flexDirection = "column";

  if (interactiveRetain) {
    const legend = document.createElement("div");
    legend.className = "mechanics-viz-3d-legend";
    legend.innerHTML = [
      "<p><strong>이 장면에서 보는 것</strong></p>",
      "<ul>",
      '<li><span style="color:#e57373;font-weight:600">붉은 쐐기·화살표</span> — <strong>주동</strong>: 뒤채움 흙이 옹벽을 밀어 옴 (흙 → 벽).</li>',
      '<li><span style="color:#64b5f6;font-weight:600">푸른 쐐기·화살표</span> — <strong>수동</strong>: 옹벽이 흙을 밀어 넣을 때 흙이 주는 저항 방향으로 표현 (벽 → 흙).</li>',
      "</ul>",
      "<p>위 평면 그림(주동/수동)과 같은 색 규칙입니다. 버튼으로 한 종류만 남겨 집중해 보세요.</p>",
    ].join("");
    el.appendChild(legend);
  }

  let retainToolbar: HTMLDivElement | null = null;
  if (interactiveRetain) {
    retainToolbar = document.createElement("div");
    retainToolbar.className = "mechanics-viz-toolbar";
    retainToolbar.setAttribute("role", "group");
    retainToolbar.setAttribute("aria-label", "3D 주동·수동 보기");
    for (const [label, mode] of [
      ["둘 다", "both"],
      ["주동만 (흙→벽)", "active"],
      ["수동만 (벽→흙)", "passive"],
    ] as const) {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = label;
      b.dataset.mode = mode;
      retainToolbar.appendChild(b);
    }
    el.appendChild(retainToolbar);
  }

  const canvasHost = document.createElement("div");
  canvasHost.style.flex = "1";
  canvasHost.style.minHeight = interactiveRetain ? "400px" : "300px";
  canvasHost.style.width = "100%";
  el.appendChild(canvasHost);

  const w = Math.max(canvasHost.clientWidth || el.clientWidth, 320);
  const h = interactiveRetain ? 400 : 300;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x121214);

  const camera = new THREE.PerspectiveCamera(48, w / h, 0.1, 100);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  canvasHost.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.enablePan = true;

  const amb = new THREE.AmbientLight(0x606070, 0.9);
  scene.add(amb);
  const dir = new THREE.DirectionalLight(0xffffff, 1.1);
  dir.position.set(4, 8, 6);
  scene.add(dir);

  if (preset === "retaining_3d") {
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(8, 5),
      new THREE.MeshStandardMaterial({ color: 0x7a6b4a, roughness: 0.9, metalness: 0 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    scene.add(ground);
    const wall = new THREE.Mesh(
      new THREE.BoxGeometry(0.35, 2.2, 2.4),
      new THREE.MeshStandardMaterial({ color: 0x3a3a40, roughness: 0.65, metalness: 0.15 }),
    );
    wall.position.set(0, 1.1, 0);
    scene.add(wall);
    const wedgeActive = addTetrahedronMesh(
      THREE,
      scene,
      new THREE.Vector3(0.18, 0, -1.35),
      new THREE.Vector3(3.6, 0, -1.35),
      new THREE.Vector3(0.18, 0, 1.35),
      new THREE.Vector3(0.18, 1.35, 0),
      0xb85c5c,
      0.4,
    );
    const wedgePassive = addTetrahedronMesh(
      THREE,
      scene,
      new THREE.Vector3(0.18, 0, -1.1),
      new THREE.Vector3(2.4, 0, -1.1),
      new THREE.Vector3(0.18, 0, 1.1),
      new THREE.Vector3(0.18, 0.52, 0),
      0x4470c2,
      0.34,
    );
    const arrowActive = new THREE.ArrowHelper(
      new THREE.Vector3(-1, 0.06, 0).normalize(),
      new THREE.Vector3(0.22, 1.05, 0.15),
      1.15,
      0xe57373,
      0.26,
      0.13,
    );
    const arrowPassive = new THREE.ArrowHelper(
      new THREE.Vector3(1, 0.08, 0).normalize(),
      new THREE.Vector3(0.22, 0.52, -0.3),
      0.9,
      0x64b5f6,
      0.22,
      0.11,
    );
    scene.add(arrowActive);
    scene.add(arrowPassive);

    if (retainToolbar) {
      let mode: EarthPressureMode = "both";
      const sync = () => {
        wedgeActive.visible = mode !== "passive";
        wedgePassive.visible = mode !== "active";
        arrowActive.visible = mode !== "passive";
        arrowPassive.visible = mode !== "active";
        retainToolbar!.querySelectorAll("button").forEach((btn) => {
          const m = (btn as HTMLButtonElement).dataset.mode as EarthPressureMode;
          btn.classList.toggle("mechanics-viz-toolbar-btn--active", m === mode);
        });
      };
      retainToolbar.addEventListener("click", (ev) => {
        const t = (ev.target as HTMLElement).closest("button");
        if (!t?.dataset.mode) return;
        mode = t.dataset.mode as EarthPressureMode;
        sync();
      });
      sync();
    }

    controls.target.set(1.2, 0.75, 0);
    camera.position.set(4.2, 2.5, 4.6);
  } else if (preset === "complex_spiral") {
    const axes = new THREE.AxesHelper(1.2);
    scene.add(axes);
    const circlePts: THREE.Vector3[] = [];
    for (let i = 0; i <= 72; i++) {
      const a = (i / 72) * Math.PI * 2;
      circlePts.push(new THREE.Vector3(Math.cos(a), Math.sin(a), 0));
    }
    scene.add(
      new THREE.LineLoop(
        new THREE.BufferGeometry().setFromPoints(circlePts),
        new THREE.LineBasicMaterial({ color: 0x64b5f6 }),
      ),
    );
    const helixPts: THREE.Vector3[] = [];
    for (let i = 0; i <= 200; i++) {
      const t = (i / 200) * Math.PI * 2.85;
      helixPts.push(new THREE.Vector3(Math.cos(t), Math.sin(t), t * 0.22));
    }
    const helixPath = new THREE.CatmullRomCurve3(helixPts);
    scene.add(
      new THREE.Mesh(
        new THREE.TubeGeometry(helixPath, 260, 0.048, 8, false),
        new THREE.MeshStandardMaterial({ color: 0x9575cd, metalness: 0.15, roughness: 0.5 }),
      ),
    );
    const theta0 = Math.PI * 0.38;
    const cx = Math.cos(theta0);
    const cy = Math.sin(theta0);
    const cz = theta0 * 0.22;
    const tip = new THREE.Mesh(
      new THREE.SphereGeometry(0.072, 20, 20),
      new THREE.MeshStandardMaterial({ color: 0xffb74d, metalness: 0.2, roughness: 0.4 }),
    );
    tip.position.set(cx, cy, cz);
    scene.add(tip);
    const dashA = new THREE.LineDashedMaterial({ color: 0x81c784, dashSize: 0.07, gapSize: 0.05 });
    const dashB = new THREE.LineDashedMaterial({ color: 0xba68c8, dashSize: 0.07, gapSize: 0.05 });
    const l1 = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(cx, cy, cz), new THREE.Vector3(cx, cy, 0)]),
      dashA,
    );
    l1.computeLineDistances();
    scene.add(l1);
    const l2 = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(cx, cy, 0), new THREE.Vector3(cx, 0, 0)]),
      dashA.clone(),
    );
    l2.computeLineDistances();
    scene.add(l2);
    const l3 = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(cx, cy, 0), new THREE.Vector3(0, cy, 0)]),
      dashB,
    );
    l3.computeLineDistances();
    scene.add(l3);
    const mkAxisDot = (x: number, y: number, z: number, col: number) => {
      const m = new THREE.Mesh(
        new THREE.SphereGeometry(0.038, 14, 14),
        new THREE.MeshStandardMaterial({ color: col }),
      );
      m.position.set(x, y, z);
      scene.add(m);
    };
    mkAxisDot(cx, 0, 0, 0x81c784);
    mkAxisDot(0, cy, 0, 0xba68c8);
    controls.target.set(0, 0.2, 0);
    camera.position.set(2.9, 2.1, 2.9);
  } else {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshStandardMaterial({ color: 0x444466 }),
    );
    scene.add(mesh);
    controls.target.set(0, 0, 0);
    camera.position.set(2.2, 2.2, 2.2);
  }

  controls.update();

  const hint = document.createElement("div");
  hint.className = "mechanics-viz-hint";
  hint.textContent =
    preset === "complex_spiral"
      ? "드래그: 회전 · 휠: 줌 · 우클릭 드래그: 팬 — 축 색은 X·Y·Z(실수·허수·매개 t 축 직관)"
      : interactiveRetain
        ? "드래그: 회전 · 휠: 줌 · 우클릭: 팬 — 갈색: 지면, 회색 덩어리: 옹벽, 반투명 쐐기: 흙 쪽 파괴·슬립면 스케치"
        : "드래그: 회전 · 휠: 줌 · 우클릭 드래그: 팬";
  el.appendChild(hint);

  let raf = 0;
  const tick = () => {
    raf = requestAnimationFrame(tick);
    controls.update();
    renderer.render(scene, camera);
  };
  tick();

  const ro = new ResizeObserver(() => {
    const rw = Math.max(canvasHost.clientWidth || el.clientWidth, 280);
    const rh = interactiveRetain ? 400 : 300;
    camera.aspect = rw / rh;
    camera.updateProjectionMatrix();
    renderer.setSize(rw, rh);
  });
  ro.observe(canvasHost);

  (el as HTMLElement & { __threeCleanup?: () => void }).__threeCleanup = () => {
    cancelAnimationFrame(raf);
    ro.disconnect();
    controls.dispose();
    renderer.dispose();
  };
}

const LANGS = ["diagramatics", "jsxgraph", "three"] as const;

const BADGE: Record<(typeof LANGS)[number], string> = {
  diagramatics: "Diagramatics",
  jsxgraph: "JSXGraph",
  three: "Three.js",
};

export async function hydrateMechanicsVisualizations(root: HTMLElement | null) {
  if (!root) return;

  root.querySelectorAll(".mechanics-viz-caption").forEach((n) => n.remove());
  root.querySelectorAll(".mechanics-viz-wrapper").forEach((w) => {
    const inner = w.querySelector(".mechanics-viz-inner") as (HTMLElement & {
      __threeCleanup?: () => void;
    }) | null;
    inner?.__threeCleanup?.();
    w.remove();
  });
  root.querySelectorAll("pre[data-mechanics-rendered]").forEach((pre) => {
    (pre as HTMLElement).style.display = "";
    delete (pre as HTMLElement).dataset.mechanicsRendered;
  });

  for (const lang of LANGS) {
    const blocks = root.querySelectorAll(`code.language-${lang}`);
    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      const pre = block.parentElement;
      if (!pre || (pre as HTMLElement).dataset.mechanicsRendered) continue;

      const spec = parseSpec(block.textContent || "");
      const wrapper = document.createElement("div");
      wrapper.className =
        "mechanics-viz-wrapper my-6 w-full overflow-hidden rounded-xl border border-gray-700 bg-[#121214]";
      const inner = document.createElement("div");
      inner.className = "mechanics-viz-inner w-full p-3";
      wrapper.appendChild(inner);

      (pre as HTMLElement).dataset.mechanicsRendered = "true";
      (pre as HTMLElement).style.display = "none";
      pre.insertAdjacentElement("afterend", wrapper);

      try {
        if (lang === "diagramatics") await renderDiagramatics(inner, spec);
        else if (lang === "jsxgraph") await renderJsxgraph(inner, spec);
        else await renderThree(inner, spec);
      } catch (e) {
        console.error(`[mechanics-viz] ${lang}`, e);
        inner.innerHTML = `<p class="text-sm text-red-300 p-4">시각화 로드 실패 (${lang}). 콘솔을 확인하세요.</p>`;
      }

      const desc =
        spec.caption?.trim() ||
        (lang === "diagramatics"
          ? "벡터·다각형 조합 SVG (토압 스케치 / 단원)"
          : lang === "jsxgraph"
            ? "함수 그래프 보드"
            : "WebGL 3D 씬");
      captionAfter(wrapper, BADGE[lang], desc);
    }
  }
}
