import type { Metadata } from "next";
import "./globals.css";

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
      <body className="antialiased">{children}</body>
    </html>
  );
}
