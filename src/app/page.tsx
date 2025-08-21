"use client";

import MainTread from "@/components/MainTread";

export default function Home() {
  function busyLoop(ms = 800) {
    const t0 = performance.now();
    while (performance.now() - t0 < ms) {
      // CPU 바운드 연산
      Math.sqrt(Math.random());
    }
  }

  return (
    <div>
      데모 페이지입니다!
      <MainTread />
    </div>
  );
}
