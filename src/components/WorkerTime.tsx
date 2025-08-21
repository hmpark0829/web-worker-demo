"use client";

import { useEffect, useRef, useState } from "react";

export default function WorkerTime({
  consoleOn = false,
}: {
  consoleOn?: boolean;
}) {
  const [time, setTime] = useState("");
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    // 워커 인스턴스는 한 번만 생성
    const worker = new Worker(new URL("../worker/unit.ts", import.meta.url));
    workerRef.current = worker;

    worker.onmessage = (e) => {
      const t = new Date(e.data).toLocaleTimeString();
      setTime(t);
    };

    return () => {
      worker.terminate();
    };
  }, []);

  // 워커 콘솔 on/off 메시지 전송 (consoleOn prop과 동기화)
  useEffect(() => {
    if (workerRef.current) {
      workerRef.current.postMessage({ type: "console", enabled: consoleOn });
    }
  }, [consoleOn]);

  return (
    <div>
      <h1>Worker</h1>
      <p>{time}</p>
    </div>
  );
}
