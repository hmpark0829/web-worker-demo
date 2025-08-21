"use client";

import { useRef, useState } from "react";
import {
  useStressLogger,
  createAbortable,
  blockingBusyLoop,
  startCpuChunks,
  startJsonChunks,
  startLayoutThrash,
} from "@/utils/stress";

export default function Experience() {
  const [duration, setDuration] = useState(60);
  const [clientText, setClientText] = useState("—");
  const [workerText, setWorkerText] = useState("—");
  const [serverText, setServerText] = useState("—");

  const { setEl: setLogEl, log } = useStressLogger();
  const abortRef = useRef<AbortController | null>(null);
  const thrashBoxRef = useRef<HTMLDivElement | null>(null);

  // ── 타이머(너가 이미 만든 로직) ─────────────────────────
  // ... (생략: 기존 "모두 시작/정지" 타이머 로직 그대로 사용)
  // 여기서는 부하 유발/중단 관련 버튼만 보여줄게요.
  // ────────────────────────────────────────────────────────

  function startBlocking() {
    log("Blocking 1200ms...");
    blockingBusyLoop(10000); // 중단 불가(시연용)
    log("Blocking done.");
  }

  function heavyArrayOps(n = 5_000_000) {
    const arr = new Float64Array(n);
    for (let i = 0; i < n; i++) arr[i] = Math.random();
    let sum = 0;
    for (let i = 0; i < n; i++) sum += Math.sqrt(arr[i]);
    return sum;
  }

  function startJson() {
    if (abortRef.current) abortRef.current.abort();
    const { controller, signal } = createAbortable();
    abortRef.current = controller;
    log("JSON chunks start");
    startJsonChunks({
      signal,
      chunks: 40,
      chunkSize: 1800,
      onProgress: (p) => {
        if ((p * 100) % 10 < 1) log(`JSON progress ${(p * 100).toFixed(0)}%`);
      },
    });
  }

  function startLayout() {
    if (abortRef.current) abortRef.current.abort();
    const { controller, signal } = createAbortable();
    abortRef.current = controller;
    log("Layout thrash start");
    if (!thrashBoxRef.current) return;
    startLayoutThrash({
      signal,
      target: thrashBoxRef.current,
      iterations: 3000,
      onProgress: (p) => {
        if ((p * 100) % 10 < 1) log(`Layout progress ${(p * 100).toFixed(0)}%`);
      },
    });
  }

  function stopAllStress() {
    abortRef.current?.abort();
    abortRef.current = null;
    log("Stress cancelled.");
  }

  return (
    <div>
      {/* (기존 타이머 UI는 생략) */}

      <section
        style={{
          background: "#141821",
          border: "1px solid #1f2430",
          borderRadius: 16,
          padding: 16,
          marginTop: 16,
        }}
      >
        <div style={{ fontWeight: 700, marginBottom: 8 }}>
          메인 스레드 부하 유발 (Next.js)
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={startBlocking} style={btn}>
            완전 블로킹(중단 불가, 1.2s)
          </button>
          <button onClick={() => heavyArrayOps()} style={btn}>
            CPU 조각(중단 가능)
          </button>
          <button onClick={startJson} style={btn}>
            JSON 조각(중단 가능)
          </button>
          <button onClick={startLayout} style={btn}>
            레이아웃 스래싱(중단 가능)
          </button>
          <button onClick={stopAllStress} style={btn}>
            중단
          </button>
        </div>

        <div ref={setLogEl as any} style={logStyle} />
        <div
          ref={thrashBoxRef}
          style={{
            marginTop: 10,
            width: 260,
            height: 80,
            background: "#0f131b",
            border: "1px dashed #2a3142",
            borderRadius: 8,
          }}
        />
      </section>
    </div>
  );
}

const btn: React.CSSProperties = {
  background: "#2b3245",
  color: "#e9eef2",
  border: "1px solid #394058",
  padding: "8px 12px",
  borderRadius: 10,
  cursor: "pointer",
};
const logStyle: React.CSSProperties = {
  whiteSpace: "pre-wrap",
  fontSize: 12,
  maxHeight: 180,
  overflow: "auto",
  background: "#0f131b",
  border: "1px solid #2a3142",
  borderRadius: 10,
  padding: 10,
  marginTop: 12,
};
