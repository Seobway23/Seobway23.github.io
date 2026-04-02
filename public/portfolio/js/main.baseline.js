/* BASELINE: pre-optimization behavior */
let activePanelId = null;

const stageOverlay = document.getElementById("stage-overlay");
const closeBtn = document.getElementById("btn-close-overlay");
const drawCanvas = document.getElementById("draw-canvas");
const drawCtx = drawCanvas.getContext("2d");

const drawerTools = document.getElementById("drawer-tools");
const btnDrawerToggle = document.getElementById("btn-drawer-toggle");
const btnClear = document.getElementById("btn-clear");
const btnDraw = document.getElementById("btn-draw");
const btnFs = document.getElementById("btn-fs");
const btnExitDraw = document.getElementById("btn-exit-draw");

let editMode = false;
if (drawerTools) drawerTools.style.display = "none";

function openOverlay(panelId) {
  if (activePanelId) closeOverlay();

  // Baseline: wait for keypress animation to finish (approx 250ms)
  setTimeout(() => {
    const panel = document.getElementById("panel-" + panelId);
    if (!panel) return;

    activePanelId = panelId;
    stageOverlay.classList.add("active");
    panel.classList.add("active");
    closeBtn.classList.add("active");

    window.dispatchEvent(new CustomEvent("pause-3d"));
    triggerAnims(panel);
  }, 250);
}

function closeOverlay() {
  if (!activePanelId) return;
  const panel = document.getElementById("panel-" + activePanelId);
  if (panel) panel.classList.remove("active");
  stageOverlay.classList.remove("active");
  closeBtn.classList.remove("active");
  activePanelId = null;
  window.dispatchEvent(new CustomEvent("resume-3d"));
}

function triggerAnims(panel) {
  panel.querySelectorAll(".anim-item, .anim-L, .anim-R").forEach((el) => {
    el.classList.remove("go");
    void el.offsetWidth;
    el.classList.add("go");
  });
}

window.addEventListener("key-pressed", (e) => {
  const keyId = e.detail;
  if (["resume", "works", "contact"].includes(keyId)) openOverlay(keyId);
  if (keyId === "tab") window.dispatchEvent(new CustomEvent("toggle-light"));
  if (keyId === "edit") toggleEditMode();
  if (keyId === "fs") toggleFullscreen();
});

closeBtn.addEventListener("click", closeOverlay);

document.addEventListener("keydown", (e) => {
  if (["INPUT", "TEXTAREA"].includes(e.target.tagName)) return;
  if (e.key === "Escape") {
    if (drawActive) toggleDraw(false);
    else closeOverlay();
  }
  switch (e.key.toLowerCase()) {
    case "f":
      toggleFullscreen();
      break;
    case "d":
      toggleDraw();
      break;
    case "c":
      clearCanvas();
      break;
  }
});

btnDrawerToggle.addEventListener("click", () => {
  if (!editMode) return;
  drawerTools.classList.add("active");
});
btnDraw.addEventListener("click", () => toggleDraw());
btnClear.addEventListener("click", clearCanvas);
btnFs.addEventListener("click", toggleFullscreen);
btnExitDraw.addEventListener("click", () => toggleEditMode(false));

function applyEditModeUI() {
  if (!drawerTools) return;
  drawerTools.style.display = editMode ? "flex" : "none";
  if (editMode) drawerTools.classList.add("active");
  else drawerTools.classList.remove("active");
}

function toggleEditMode(force) {
  editMode = force !== undefined ? force : !editMode;
  applyEditModeUI();
  if (!editMode) toggleDraw(false);
}

function clearCanvas() {
  drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
}

function toggleFullscreen() {
  if (!document.fullscreenElement)
    document.documentElement.requestFullscreen().catch(() => {});
  else document.exitFullscreen().catch(() => {});
}

let drawActive = false;
let isDrawing = false;
let lastX = 0,
  lastY = 0;

function sizeDrawCanvas() {
  drawCanvas.width = window.innerWidth;
  drawCanvas.height = window.innerHeight;
}

function toggleDraw(force) {
  if (force === true && !editMode) toggleEditMode(true);
  if (force === undefined && !editMode) return;

  drawActive = force !== undefined ? force : !drawActive;
  drawCanvas.classList.toggle("active", drawActive);
  btnExitDraw.style.display = drawActive ? "block" : "none";
  if (btnDraw) btnDraw.innerHTML = drawActive ? "🛑 Stop Drawing" : "🖌 Pen Drawing";
  if (drawActive) {
    sizeDrawCanvas();
    if (drawerTools) drawerTools.classList.add("active");
  }
  if (!drawActive && drawerTools) drawerTools.classList.add("active");
}

function getPos(e) {
  const src = e.touches ? e.touches[0] : e;
  return [src.clientX, src.clientY];
}

drawCanvas.addEventListener("pointerdown", (e) => {
  if (!drawActive) return;
  isDrawing = true;
  [lastX, lastY] = getPos(e);
});

drawCanvas.addEventListener("pointermove", (e) => {
  if (!isDrawing || !drawActive) return;
  const [x, y] = getPos(e);
  drawCtx.beginPath();
  const g = drawCtx.createLinearGradient(lastX, lastY, x, y);
  g.addColorStop(0, "#4DA8FF");
  g.addColorStop(1, "#2ECC71");
  drawCtx.strokeStyle = g;
  drawCtx.lineWidth = 3;
  drawCtx.lineCap = "round";
  drawCtx.moveTo(lastX, lastY);
  drawCtx.lineTo(x, y);
  drawCtx.stroke();
  [lastX, lastY] = [x, y];
});

drawCanvas.addEventListener("pointerup", () => (isDrawing = false));

window.addEventListener("resize", () => {
  if (drawActive) sizeDrawCanvas();
});

sizeDrawCanvas();
document.documentElement.setAttribute("data-theme", "dark");

