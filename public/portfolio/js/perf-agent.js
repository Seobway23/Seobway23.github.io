/**
 * Perf Agent (opt-in via ?perf=1)
 * - Runs inside portfolio pages (baseline/optimized)
 * - Exposes a postMessage API to let a harness page collect metrics
 */
(function () {
  const params = new URLSearchParams(location.search);
  if (params.get("perf") !== "1") return;

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  async function measureOverlayDelay(panelId, runs) {
    const overlay = document.querySelector("#stage-overlay");
    const closeBtn = document.querySelector("#btn-close-overlay");
    const samples = [];

    for (let i = 0; i < runs; i++) {
      closeBtn?.click();
      await sleep(60);

      const t0 = performance.now();
      window.dispatchEvent(new CustomEvent("key-pressed", { detail: panelId }));

      while (performance.now() - t0 < 4000) {
        const panel = document.querySelector("#panel-" + panelId);
        const ok =
          overlay?.classList.contains("active") && panel?.classList.contains("active");
        if (ok) break;
        await sleep(10);
      }
      const t1 = performance.now();
      samples.push(t1 - t0);

      closeBtn?.click();
      await sleep(120);
    }

    samples.sort((a, b) => a - b);
    const mean = samples.reduce((s, v) => s + v, 0) / samples.length;
    const p50 = samples[Math.floor(samples.length * 0.5)];
    const p95 = samples[Math.floor(samples.length * 0.95)];
    return { runs, mean, p50, p95, samples };
  }

  async function measureRafJank(ms) {
    const frames = [];
    let last = performance.now();
    const start = last;

    function tick(now) {
      const dt = now - last;
      frames.push(dt);
      last = now;
      if (now - start < ms) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
    await sleep(ms + 120);

    const over33 = frames.filter((dt) => dt > 33.3).length;
    const over50 = frames.filter((dt) => dt > 50).length;
    const over100 = frames.filter((dt) => dt > 100).length;
    const maxDt = Math.max(...frames);
    const meanDt = frames.reduce((s, v) => s + v, 0) / frames.length;
    return { ms, frameCount: frames.length, meanDt, maxDt, over33, over50, over100 };
  }

  async function measurePointerMoveDispatchCost(events) {
    const canvas = document.querySelector("#keyboard-canvas");
    const rect = canvas?.getBoundingClientRect();
    const baseX = rect ? rect.left + rect.width * 0.5 : window.innerWidth * 0.5;
    const baseY = rect ? rect.top + rect.height * 0.5 : window.innerHeight * 0.5;

    const closeBtn = document.querySelector("#btn-close-overlay");
    closeBtn?.click();
    await sleep(80);

    const t0 = performance.now();
    for (let i = 0; i < events; i++) {
      const x = baseX + ((i % 20) - 10);
      const y = baseY + ((((i / 20) | 0) % 20) - 10);
      canvas?.dispatchEvent(
        new PointerEvent("pointermove", { clientX: x, clientY: y, bubbles: true }),
      );
    }
    const t1 = performance.now();
    return { events, totalMs: t1 - t0, perEventMs: (t1 - t0) / events };
  }

  function getCanvasMetrics() {
    const canvas = document.querySelector("#keyboard-canvas");
    const w = window.innerWidth;
    const h = window.innerHeight;
    const cw = canvas?.width ?? null;
    const ch = canvas?.height ?? null;
    const effectiveDprX = cw != null ? cw / w : null;
    const effectiveDprY = ch != null ? ch / h : null;
    return {
      window: { w, h, devicePixelRatio: window.devicePixelRatio },
      canvas: { cw, ch, effectiveDprX, effectiveDprY },
    };
  }

  async function runSuite(opts) {
    const warmupMs = opts?.warmupMs ?? 1500;
    const overlayRuns = opts?.overlayRuns ?? 12;
    const overlayPanelId = opts?.overlayPanelId ?? "works";
    const jankMs = opts?.jankMs ?? 5000;
    const pointerEvents = opts?.pointerEvents ?? 300;

    await sleep(warmupMs);
    const canvasMetrics = getCanvasMetrics();
    const overlayDelay = await measureOverlayDelay(overlayPanelId, overlayRuns);
    const jank = await measureRafJank(jankMs);
    const pointerMove = await measurePointerMoveDispatchCost(pointerEvents);

    return { canvasMetrics, overlayDelay, jank, pointerMove };
  }

  window.addEventListener("message", async (e) => {
    const msg = e?.data;
    if (!msg || msg.type !== "PORTFOLIO_PERF_RUN") return;
    const requestId = msg.requestId;
    try {
      const result = await runSuite(msg.options || {});
      e.source?.postMessage(
        { type: "PORTFOLIO_PERF_RESULT", requestId, ok: true, result },
        "*",
      );
    } catch (err) {
      e.source?.postMessage(
        {
          type: "PORTFOLIO_PERF_RESULT",
          requestId,
          ok: false,
          error: String(err?.stack || err),
        },
        "*",
      );
    }
  });
})();

