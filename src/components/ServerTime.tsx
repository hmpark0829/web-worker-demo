"use client";

import { useEffect, useState } from "react";

export default function ServerTime() {
  const [serverTime, setServerTime] = useState("");

  const fetchServerTime = async () => {
    const res = await fetch("/api/time");
    const data = await res.json();
    setServerTime(new Date(data.time).toLocaleTimeString());
  };

  useEffect(() => {
    fetchServerTime();
    const interval = setInterval(fetchServerTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <h1>서버 시계</h1>
      <p>{serverTime}</p>
    </div>
  );
}
