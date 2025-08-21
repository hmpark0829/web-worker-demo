"use client";

import { useState } from "react";
import ClientTime from "./ClientTime";
import WorkerTime from "./WorkerTime";

export default function Clock() {
  const [consoleOn, setConsoleOn] = useState(false);

  return (
    <div>
      <button
        style={{
          position: "fixed",
          top: 24,
          right: 24,
          zIndex: 2000,
          padding: "8px 16px",
          borderRadius: 8,
          background: consoleOn ? "#65d5a1" : "#394058",
          color: "#fff",
          border: "none",
          fontWeight: 700,
          cursor: "pointer",
          boxShadow: "0 2px 8px #0003",
        }}
        onClick={() => setConsoleOn((v) => !v)}
      >
        {consoleOn ? "끄기" : "켜기"}
        {consoleOn && (
          <div className="flex items-center justify-center">
            <ClientTime consoleOn={consoleOn} />
            <WorkerTime consoleOn={consoleOn} />
          </div>
        )}
      </button>
    </div>
  );
}
