"use client";

import { useEffect, useRef, useState } from "react";

export default function WorkerCanvasDemo() {
  const cvRef = useRef<HTMLCanvasElement | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const [supportsOffscreen, setSupportsOffscreen] = useState(false);
  const [running, setRunning] = useState(false);
  const [text, setText] = useState("");
  const [latency, setLatency] = useState(0);

  useEffect(() => {
    const cv = cvRef.current!;
    cv.width = 320;
    cv.height = 180;

    const canOffscreen = "transferControlToOffscreen" in cv;
    setSupportsOffscreen(canOffscreen);

    const w = new Worker("/heavy.worker.js", { type: "module" });
    workerRef.current = w;

    if (canOffscreen) {
      // 메인에서는 getContext() 호출 금지!
      const off = (cv as any).transferControlToOffscreen();
      w.postMessage(
        { type: "INIT", canvas: off, width: cv.width, height: cv.height },
        [off]
      );
    }

    return () => {
      w.terminate();
      workerRef.current = null;
    };
  }, []);

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const t0 = performance.now();
    setTimeout(() => setLatency(Math.round(performance.now() - t0)), 0);
    setText(e.target.value);
  }

  function runWorker(seconds = 5) {
    if (running) return;
    setRunning(true);
    workerRef.current?.postMessage({ type: "START", seconds });
    const handle = (e: MessageEvent) => {
      if (e.data?.type === "DONE") {
        setRunning(false);
        workerRef.current?.removeEventListener("message", handle);
      }
    };
    workerRef.current?.addEventListener("message", handle);
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
        워커 캔버스
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
          onClick={() => runWorker(5)}
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
          {running ? "로딩중..." : "워커에서 실행(5s)"}
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
