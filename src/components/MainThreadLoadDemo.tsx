// app/_components/MainThreadLoadDemo.tsx (일부 추가)
"use client";

import { useEffect, useRef, useState } from "react";

export default function MainThreadLoadDemo() {
  const [text, setText] = useState("");
  const [latency, setLatency] = useState(0);
  const [runningMain, setRunningMain] = useState(false);
  const [runningWorker, setRunningWorker] = useState(false);

  // app/_components/MainThreadLoadDemo.tsx (핵심 부분만 발췌)
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const [supportsOffscreen, setSupportsOffscreen] = useState(false);
  const transferredRef = useRef(false); // 이미 오프스크린으로 넘겼는지

  useEffect(() => {
    const cv = canvasRef.current!;
    cv.width = 320;
    cv.height = 180;

    const canOffscreen = "transferControlToOffscreen" in cv;
    setSupportsOffscreen(canOffscreen);

    workerRef.current = new Worker("/heavy.worker.js", { type: "module" });

    if (canOffscreen) {
      // 🚫 메인에서 getContext() 호출 금지!
      const off = (cv as any).transferControlToOffscreen();
      transferredRef.current = true;
      workerRef.current.postMessage(
        { type: "INIT", canvas: off, width: cv.width, height: cv.height },
        [off]
      );
    } else {
      // 폴백: 오프스크린 없음 → 이때만 메인에서 컨텍스트 사용
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
    }

    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, []);

  async function runWorkerWork(seconds = 5) {
    // 이미 오프스크린으로 넘긴 경우: 메인에서 getContext() 쓰지 말고 START만 전송
    if (supportsOffscreen && transferredRef.current) {
      workerRef.current?.postMessage({ type: "START", seconds });
      return;
    }

    // 폴백 경로: 오프스크린 미지원 → 메인에서 ImageData를 워커에 전송
    const cv = canvasRef.current!;
    const ctx = cv.getContext("2d", { willReadFrequently: true })!;
    const img = ctx.getImageData(0, 0, cv.width, cv.height);
    workerRef.current?.postMessage(
      {
        type: "START",
        seconds,
        imageBuffer: img.data.buffer,
        w: cv.width,
        h: cv.height,
      },
      [img.data.buffer] // transfer
    );

    // 폴백에서 워커가 돌려주는 이미지를 그려주기
    workerRef.current!.onmessage = (e: MessageEvent) => {
      const { type, imageBuffer, w, h } = e.data || {};
      if (type === "PARTIAL_IMAGE" || type === "FINAL_IMAGE") {
        const img = new ImageData(new Uint8ClampedArray(imageBuffer), w, h);
        ctx.putImageData(img, 0, 0);
      }
    };
  }

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const t0 = performance.now();
    setTimeout(() => setLatency(Math.round(performance.now() - t0)), 0);
    setText(e.target.value);
  }

  // ⛔ 메인 스레드에서 실행 (기존처럼)
  async function runMainThreadWork(seconds = 5) {
    if (runningMain) return;
    setRunningMain(true);
    const endAt = performance.now() + seconds * 1000;
    const cv = canvasRef.current!;
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
    const img = ctx.getImageData(0, 0, cv.width, cv.height);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      d[i] = 255 - d[i];
      d[i + 1] = 255 - d[i + 1];
      d[i + 2] = 255 - d[i + 2];
    }
    ctx.putImageData(img, 0, 0);
    setRunningMain(false);
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
      <div style={{ fontWeight: 700, marginBottom: 8 }}>
        타이핑 지연 체감 + 시각적 작업 (메인 vs 워커)
      </div>

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
          placeholder="여기에 타이핑 해보세요"
          value={text}
          onChange={onChange}
          style={{
            background: "#0f131b",
            color: "#e9eef2",
            border: "1px solid #2a3142",
            borderRadius: 8,
            padding: "8px 10px",
            width: 240,
          }}
        />
        <span style={{ fontSize: 12, color: "#99a3ad" }}>
          최근 입력 지연:{" "}
          <b style={{ color: latency > 80 ? "#f38ba3" : "#65d5a1" }}>
            {latency}ms
          </b>
        </span>
      </div>

      <div
        style={{
          display: "flex",
          gap: 8,
          alignItems: "center",
          flexWrap: "wrap",
          marginBottom: 10,
        }}
      >
        <button
          disabled={runningMain}
          onClick={() => runMainThreadWork(5)}
          style={{
            background: "#2b3245",
            color: "#e9eef2",
            border: "1px solid #394058",
            padding: "8px 12px",
            borderRadius: 10,
            cursor: "pointer",
          }}
        >
          메인 스레드에서 실행(5s)
        </button>
        <button
          disabled={runningWorker}
          onClick={() => runWorkerWork(5)}
          style={{
            background: "#2b3245",
            color: "#e9eef2",
            border: "1px solid #394058",
            padding: "8px 12px",
            borderRadius: 10,
            cursor: "pointer",
          }}
        >
          워커에서 실행(5s)
        </button>
        <span style={{ fontSize: 12, color: "#99a3ad" }}>
          워커 실행 중에도 타이핑이 **부드럽게 유지**되는지 비교해 보세요.
        </span>
      </div>

      <canvas
        ref={canvasRef}
        style={{
          width: 320,
          height: 180,
          border: "1px solid #2a3142",
          borderRadius: 8,
        }}
      />
    </section>
  );
}
