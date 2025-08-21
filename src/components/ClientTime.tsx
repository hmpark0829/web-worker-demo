"use client";

import { useState, useEffect } from "react";

export default function ClientTime({
  consoleOn = false,
}: {
  consoleOn?: boolean;
}) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setTime((prev) => {
        const next = new Date(prev.getTime() + 1000);
        if (consoleOn) {
          console.log("클라이언트 시계 tick:", next.toLocaleTimeString());
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [consoleOn]);

  return (
    <div>
      <h1>Client</h1>
      <p>{time.toLocaleTimeString()}</p>
    </div>
  );
}
