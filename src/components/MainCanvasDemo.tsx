"use client";

import { useEffect, useRef, useState } from "react";

export default function MainCanvasDemo() {
  const cvRef = useRef<HTMLCanvasElement | null>(null);
  const [running, setRunning] = useState(false);
  const [latency, setLatency] = useState(0);
  const [text, setText] = useState("");

  useEffect(() => {
    const cv = cvRef.current!;
    cv.width = 320;
    cv.height = 180;
    const ctx = cv.getContext("2d")!;
    const img = ctx.createImageData(cv.width, cv.height);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = (Math.random() * 255) | 0;
      img.data[i] = v;
      img.data[i + 1] = v;
      img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  }, []);

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const t0 = performance.now();
    setTimeout(() => setLatency(Math.round(performance.now() - t0)), 0);
    setText(e.target.value);
  }

  async function runMain(seconds = 5) {
    if (running) return;
    setRunning(true);
    const endAt = performance.now() + seconds * 1000;

    const cv = cvRef.current!;
    const ctx = cv.getContext("2d", { willReadFrequently: true })!;

    function heavyArrayOps(n = 6_000_000) {
      const arr = new Float64Array(n);
      for (let i = 0; i < n; i++) arr[i] = Math.random();
      let sum = 0;
      for (let i = 0; i < n; i++) sum += Math.sqrt(arr[i]);
      return sum;
    }
    function bigJsonRoundtrip(items = 80_000) {
      const obj = Array.from({ length: items }, (_, i) => ({
        i,
        v: Math.random().toString(36).slice(2),
        t: Date.now(),
      }));
      const s = JSON.stringify(obj);
      const parsed = JSON.parse(s);
      return parsed.length;
    }
    function canvasGrayscale(passes = 3) {
      const img = ctx.getImageData(0, 0, cv.width, cv.height);
      const d = img.data;
      for (let p = 0; p < passes; p++) {
        for (let i = 0; i < d.length; i += 4) {
          const g = (d[i] + d[i + 1] + d[i + 2]) / 3;
          d[i] = g;
          d[i + 1] = g;
          d[i + 2] = g;
        }
      }
      ctx.putImageData(img, 0, 0);
    }

    while (performance.now() < endAt) {
      heavyArrayOps(6_000_000);
      bigJsonRoundtrip(80_000);
      canvasGrayscale(3);
    }

    // 마커: 반전
    const fin = ctx.getImageData(0, 0, cv.width, cv.height);
    const d = fin.data;
    for (let i = 0; i < d.length; i += 4) {
      d[i] = 255 - d[i];
      d[i + 1] = 255 - d[i + 1];
      d[i + 2] = 255 - d[i + 2];
    }
    ctx.putImageData(fin, 0, 0);

    setRunning(false);
  }

  return (
    <section
      style={{
        background: "#141821",
        border: "1px solid #1f2430",
        borderRadius: 16,
        padding: 16,
      }}
    >
      <h2 className="text-white" style={{ fontWeight: 700, marginBottom: 8 }}>
        메인 스레드 캔버스
      </h2>

      <div
        style={{
          display: "flex",
          gap: 8,
          alignItems: "center",
          flexWrap: "wrap",
          marginBottom: 10,
        }}
      >
        <input
          placeholder="여기에 타이핑"
          value={text}
          onChange={onChange}
          style={{
            background: "#0f131b",
            color: "#e9eef2",
            border: "1px solid #2a3142",
            borderRadius: 8,
            padding: "8px 10px",
            width: 200,
          }}
        />
        <span style={{ fontSize: 12, color: "#99a3ad", width: 100 }}>
          입력 지연:{" "}
          <b style={{ color: latency > 80 ? "#f38ba3" : "#65d5a1" }}>
            {latency}ms
          </b>
        </span>
        <button
          disabled={running}
          onClick={() => runMain(5)}
          style={{
            background: "#2b3245",
            color: "#e9eef2",
            border: "1px solid #394058",
            padding: "8px 12px",
            borderRadius: 10,
            cursor: "pointer",
          }}
          className="disabled:opacity-50"
        >
          {running ? "로딩중..." : "메인에서 실행(5s)"}
        </button>
      </div>

      <canvas
        ref={cvRef}
        style={{
          width: 400,
          height: 400,
          border: "1px solid #2a3142",
          borderRadius: 8,
        }}
      />
    </section>
  );
}
