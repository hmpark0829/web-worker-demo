"use client";

import { useRef } from "react";

export type StressMode =
  | "blocking" // 완전 블로킹 (중단 불가: 시연용)
  | "cpu-chunks" // 연산을 조각내서 중단 가능
  | "json-chunks" // JSON 직렬화/역직렬화 조각
  | "layout-thrash"; // 레이아웃 스래싱 조각

export function useStressLogger() {
  const logRef = useRef<HTMLElement | null>(null);
  const setEl = (el: HTMLElement | null) => (logRef.current = el);
  const log = (...args: any[]) => {
    const line = args
      .map((v) => (typeof v === "object" ? JSON.stringify(v) : String(v)))
      .join(" ");
    if (logRef.current)
      logRef.current.textContent = line + "\n" + logRef.current.textContent;
    // 콘솔에도

    console.log(...args);
  };
  return { setEl, log };
}

export function createAbortable() {
  const controller = new AbortController();
  return { controller, signal: controller.signal };
}

/** 완전 블로킹(중단 불가) — 데모 감탄사 유발용 */
export function blockingBusyLoop(ms = 1200) {
  const t0 = performance.now();
  while (performance.now() - t0 < ms) {
    Math.sqrt(Math.random());
  }
}

/** 중단 가능한 CPU 부하(조각 처리) */
export function startCpuChunks(opts: {
  signal: AbortSignal;
  totalMs?: number; // 총 작업 시간 목표
  sliceMs?: number; // 각 조각(프레임)에서 붙잡을 시간
  onProgress?: (p: number) => void;
}) {
  const { signal, totalMs = 8000, sliceMs = 8, onProgress } = opts;
  const tStart = performance.now();

  function tick() {
    if (signal.aborted) return;

    const sliceEnd = performance.now() + sliceMs;
    // 이 조각에서 CPU 태우기
    while (performance.now() < sliceEnd) {
      Math.imul(Math.floor(Math.random() * 1e7), 7919);
      Math.sqrt(Math.random());
    }

    const elapsed = performance.now() - tStart;
    onProgress?.(Math.min(1, elapsed / totalMs));

    if (elapsed < totalMs) {
      // 다음 프레임에 양보
      requestAnimationFrame(tick);
    }
  }
  requestAnimationFrame(tick);
}

/** JSON 대용량 직렬화/역직렬화(조각 처리) */
export function startJsonChunks(opts: {
  signal: AbortSignal;
  chunks?: number; // 몇 번에 나눌지
  chunkSize?: number; // 각 청크에 몇 개 아이템 생성할지
  onProgress?: (p: number) => void;
}) {
  const { signal, chunks = 40, chunkSize = 1800, onProgress } = opts;
  let made: any[] = [];
  let i = 0;

  function makeChunk() {
    if (signal.aborted) return;
    // 데이터 생성
    const part = Array.from({ length: chunkSize }, (_, k) => ({
      i: i * chunkSize + k,
      v: Math.random().toString(36).slice(2),
      t: Date.now(),
    }));
    made.push(...part);

    i++;
    onProgress?.(i / chunks);

    if (i < chunks) {
      // 메인 스레드 양보
      setTimeout(makeChunk, 0);
    } else {
      // 직렬화/역직렬화도 조각내기
      const s = JSON.stringify(made);
      made = []; // 메모리 해제
      let j = 0;
      const step = 8; // 문자열을 잘라서 부분 파싱 흉내 (시연용)
      function parseChunk() {
        if (signal.aborted) return;
        // 실제로는 한번에 JSON.parse(s)로 끝내지만,
        // 데모상 "여러 조각"으로 보이게 가짜 작업:
        const until = Math.min(s.length, (j + step) * (s.length / step));
        JSON.parse(s.slice(0, until)); // 일부만 파싱해도 에러 발생 가능 -> try/catch
        j++;
        if (j < step) setTimeout(parseChunk, 0);
      }
      setTimeout(parseChunk, 0);
    }
  }
  setTimeout(makeChunk, 0);
}

/** 레이아웃 스래싱(조각 처리) */
export function startLayoutThrash(opts: {
  signal: AbortSignal;
  target: HTMLElement;
  iterations?: number;
  onProgress?: (p: number) => void;
}) {
  const { signal, target, iterations = 2000, onProgress } = opts;
  let i = 0;

  function tick() {
    if (signal.aborted) return;
    const sliceEnd = performance.now() + 6; // 각 조각 6ms
    while (performance.now() < sliceEnd && i < iterations) {
      target.style.paddingLeft = i % 2 ? "1px" : "2px";
      void target.offsetHeight; // 강제 동기 레이아웃
      i++;
    }
    onProgress?.(i / iterations);
    if (i < iterations) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}
