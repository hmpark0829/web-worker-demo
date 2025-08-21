// public/heavy.worker.js (핵심만)
let ctx = null,
  W = 0,
  H = 0,
  running = false;

onmessage = (e) => {
  const { type } = e.data || {};

  if (type === "INIT") {
    const off = e.data.canvas; // OffscreenCanvas (transferred)
    W = e.data.width;
    H = e.data.height;
    ctx = off.getContext("2d", { willReadFrequently: true });

    // 초기 노이즈
    const img = ctx.createImageData(W, H);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = (Math.random() * 255) | 0;
      img.data[i] = v;
      img.data[i + 1] = v;
      img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    return;
  }

  if (type === "START" && !running) {
    running = true;
    const seconds = e.data.seconds ?? 5;
    const endAt = performance.now() + seconds * 1000;

    while (performance.now() < endAt) {
      // … heavyArrayOps / bigJsonRoundtrip …

      // ⬇️ 여기! getImageData는 (0,0,W,H)입니다.
      const img = ctx.getImageData(0, 0, W, H);
      const d = img.data;
      for (let p = 0; p < 3; p++) {
        for (let i = 0; i < d.length; i += 4) {
          const g = (d[i] + d[i + 1] + d[i + 2]) / 3;
          d[i] = g;
          d[i + 1] = g;
          d[i + 2] = g;
        }
      }
      ctx.putImageData(img, 0, 0);
    }

    // 마무리: 색 반전
    const img2 = ctx.getImageData(0, 0, W, H);
    const d2 = img2.data;
    for (let i = 0; i < d2.length; i += 4) {
      d2[i] = 255 - d2[i];
      d2[i + 1] = 255 - d2[i + 1];
      d2[i + 2] = 255 - d2[i + 2];
    }
    ctx.putImageData(img2, 0, 0);

    postMessage({ type: "DONE" });
    running = false;
  }
};
