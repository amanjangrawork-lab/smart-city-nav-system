import type { Metadata } from "next";
import { Fraunces, Sora } from "next/font/google";
import { SmoothScroll } from "@/components/SmoothScroll";
import "./globals.css";

const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", display: "swap" });
const sora = Sora({ subsets: ["latin"], variable: "--font-sora", display: "swap" });

export const metadata: Metadata = {
  title: "Smart City Navigation System",
  description:
    "A 3D scroll-driven smart-city navigation platform for Delhi NCR: route planning, live traffic, and Python-powered pathfinding (Dijkstra, A*, Floyd-Warshall) running in the browser.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${sora.variable}`}>
      <body>
        <a className="skip-link" href="#main">Skip to content</a>
        <SmoothScroll />
        {children}
      </body>
    </html>
  );
}
