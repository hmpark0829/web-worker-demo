"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

type Sample = { t: number; dt: number; fps: number };

function useFpsMeter(maxSamples = 180) {
  const [samples, setSamples] = useState<Sample[]>([]);
  const lastRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    let mounted = true;
    function loop(ts: number) {
      if (!mounted) return;
      const last = lastRef.current ?? ts;
      const dt = ts - last;
      lastRef.current = ts;

      const fps = dt > 0 ? 1000 / dt : 0;
      setSamples((prev) => {
        const next = [...prev, { t: ts, dt, fps }];
        if (next.length > maxSamples) next.shift();
        return next;
      });

      rafRef.current = requestAnimationFrame(loop);
    }
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      mounted = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [maxSamples]);

  // Long Task 로그 (콘솔로 표시)
  useEffect(() => {
    // 일부 브라우저에서 지원
    try {
      const po = new PerformanceObserver((list) => {
        for (const e of list.getEntries()) {
          console.warn("Long Task ~", Math.round(e.duration), "ms");
        }
      });
      po.observe({ entryTypes: ["longtask"] as any });
      return () => po.disconnect();
    } catch {
      // ignore
    }
  }, []);

  const currentFps = samples.length ? samples[samples.length - 1].fps : 0;
  const stutters = useMemo(
    () => samples.filter((s) => s.dt > 33.3).length, // 30fps 밑으로 떨어진 프레임 개수
    [samples]
  );

  return { samples, currentFps, stutters };
}

export default function FpsTimeline({
  height = 60,
  width = 220,
  targetFps = 60,
}: {
  height?: number;
  width?: number;
  targetFps?: number;
}) {
  const { samples, currentFps, stutters } = useFpsMeter();

  // Sparkline path 계산
  const padding = 6;
  const W = width;
  const H = height;
  const innerW = W - padding * 2;
  const innerH = H - padding * 2;
  const maxFps = targetFps; // y축 위쪽(60fps)
  const minFps = 0;

  const path = useMemo(() => {
    if (!samples.length) return "";
    const N = samples.length;
    const stepX = innerW / (N - 1 || 1);
    const points: string[] = [];
    for (let i = 0; i < N; i++) {
      const s = samples[i];
      const fps = Math.max(minFps, Math.min(maxFps, s.fps));
      const x = padding + i * stepX;
      const y =
        padding + innerH - ((fps - minFps) / (maxFps - minFps)) * innerH;
      points.push(`${x},${y}`);
    }
    return "M " + points.join(" L ");
  }, [samples, innerW, innerH, padding, maxFps]);

  // 최근 스터터 여부(> 50ms)
  const lastStutter = samples.length
    ? samples[samples.length - 1].dt > 50
    : false;

  return (
    <div
      style={{
        position: "fixed",
        right: 24,
        bottom: 24,
        zIndex: 1000,
        background: "#141821cc",
        border: "1px solid #1f2430",
        borderRadius: 16,
        padding: 10,
        boxShadow: "0 2px 12px #0006",
        width: W,
        height: H + 40,
        minWidth: 180,
        minHeight: 60,
        fontSize: 12,
        color: "#99a3ad",
        userSelect: "none",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 8,
          marginBottom: 4,
        }}
      >
        <div style={{ fontWeight: 700, fontSize: 13 }}>FPS</div>
        <div style={{ fontSize: 11, color: "#99a3ad" }}>
          <b style={{ color: lastStutter ? "#f38ba3" : "#65d5a1" }}>
            {Math.round(currentFps)}
          </b>{" "}
          · Stutters({">"}33ms): {stutters}
        </div>
      </div>

      <svg
        width={W}
        height={H}
        style={{ display: "block", width: "100%", maxWidth: W }}
      >
        {/* 배경 가이드 라인 (60/30fps) */}
        <g>
          {/* 60fps 라인 */}
          <line
            x1={padding}
            x2={W - padding}
            y1={
              padding + (innerH - ((60 - minFps) / (maxFps - minFps)) * innerH)
            }
            y2={
              padding + (innerH - ((60 - minFps) / (maxFps - minFps)) * innerH)
            }
            stroke="#2a3142"
            strokeDasharray="4 4"
          />
          {/* 30fps 라인 */}
          <line
            x1={padding}
            x2={W - padding}
            y1={
              padding + (innerH - ((30 - minFps) / (maxFps - minFps)) * innerH)
            }
            y2={
              padding + (innerH - ((30 - minFps) / (maxFps - minFps)) * innerH)
            }
            stroke="#394058"
            strokeDasharray="4 4"
          />
        </g>

        {/* Sparkline */}
        <path d={path} fill="none" stroke="#65d5a1" strokeWidth={2} />

        {/* 최근 프레임 마커 */}
        {samples.length > 0 &&
          (() => {
            const i = samples.length - 1;
            const s = samples[i];
            const fps = Math.max(minFps, Math.min(maxFps, s.fps));
            const x = padding + (innerW / (samples.length - 1 || 1)) * i;
            const y =
              padding + innerH - ((fps - minFps) / (maxFps - minFps)) * innerH;
            return (
              <circle
                cx={x}
                cy={y}
                r={3}
                fill={lastStutter ? "#f38ba3" : "#65d5a1"}
              />
            );
          })()}
      </svg>

      <div
        style={{
          display: "flex",
          gap: 8,
          marginTop: 4,
          fontSize: 11,
          color: "#99a3ad",
        }}
      >
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
          <span
            style={{
              width: 10,
              height: 2,
              background: "#65d5a1",
              display: "inline-block",
            }}
          />
          FPS
        </span>
        <span style={{ marginLeft: "auto", color: "#99a3ad" }}>
          {samples.length ? Math.round(samples[samples.length - 1].dt) : 0}ms
        </span>
      </div>
    </div>
  );
}
