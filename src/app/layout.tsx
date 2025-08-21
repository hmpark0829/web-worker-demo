import type { Metadata } from "next";
import "./globals.css";
import ClientTime from "@/components/ClientTime";
import ServerTime from "@/components/ServerTime";
import WorkerTime from "@/components/WorkerTime";
import FpsTimeline from "@/components/FpsTimeline";
import Clock from "@/components/Clock";

export const metadata: Metadata = {
  title: "웹 워커 데모",
  description: "웹 워커 데모 페이지",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <div className="fixed top-50 left-0 w-full z-50">
          <Clock />
          {/* <div className="flex items-center justify-center">
            <ClientTime />
            <WorkerTime />
          </div> */}
          {/* <FpsTimeline /> */}
        </div>
        {children}
      </body>
    </html>
  );
}
