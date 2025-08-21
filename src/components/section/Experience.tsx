"use client";

import { useState } from "react";
import MainCanvasDemo from "../MainCanvasDemo";
import WorkerCanvasDemo from "../WorkerCanvasDemo";

export default function Experience() {
  return (
    <section>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <MainCanvasDemo />
        <WorkerCanvasDemo />
      </div>
    </section>
  );
}
