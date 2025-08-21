"use client";

import Clock from "@/components/Clock";
import Experience from "@/components/section/Experience";

export default function Home() {
  return (
    <div className="h-screen w-full flex items-center justify-center bg-green-300">
      <div className="fixed top-50 left-0 w-full z-50">
        <Clock />
      </div>
      <Experience />
    </div>
  );
}
