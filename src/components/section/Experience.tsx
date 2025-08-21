"use client";

import { useState } from "react";
import Blocking from "../\bBlocking";
import MainThreadLoadDemo from "../MainThreadLoadDemo";
import MainCanvasDemo from "../MainCanvasDemo";
import WorkerCanvasDemo from "../WorkerCanvasDemo";

export default function Experience() {
  const [duration, setDuration] = useState("");

  return (
    <section>
      <input
        value={duration}
        onChange={(e) => setDuration(e.target.value)}
        className="w-full h-10 bg-white"
      />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <MainCanvasDemo />
        <WorkerCanvasDemo />
      </div>
    </section>
  );
}
