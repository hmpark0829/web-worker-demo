"use client";
import React, { useRef } from "react";
import { FullPage } from "@/components/Fullpage"; // 위 컴포넌트를 같은 폴더에 두었다고 가정
import Intro from "@/components/section/Intro";
import Experience from "@/components/section/Experience";

export default function Page() {
  return (
    <FullPage
      options={{
        anchors: ["home", "work", "contact"],
        duration: 900,
        easing: (t) =>
          t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
        loop: false,
        keyboard: true,
        onLeave: (from, to) => {
          // analytics, 섹션 전환 트리거 등
          // console.log("leave", from, "->", to);
        },
        afterLoad: (idx) => {
          // console.log("after", idx);
        },
      }}
    >
      <div className="h-full w-full flex flex-col items-center justify-center bg-red-300">
        <Intro />
      </div>
      <div className="h-full w-full flex items-center justify-center bg-green-300">
        <Experience />
      </div>
      <div className="h-full w-full flex items-center justify-center bg-blue-300">
        <h1 className="text-5xl font-bold">Contact</h1>
      </div>
      <div className="h-full w-full flex items-center justify-center bg-blue-300">
        <h1 className="text-5xl font-bold">Contact</h1>
      </div>
    </FullPage>
  );
}
