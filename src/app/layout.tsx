import type { Metadata } from "next";
import { Black_Ops_One, Share_Tech_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import "./rogue-state.css";
import ClientUIEnforcer from "@/components/ClientUIEnforcer";
import ConvexClientProvider from "@/components/ConvexClientProvider";

const blackOpsOne = Black_Ops_One({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-header",
});

const shareTechMono = Share_Tech_Mono({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "The Battalion - Tactical Military Strategy",
  description: "A modern military conflict strategy game - The Battalion",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${blackOpsOne.variable} ${shareTechMono.variable}`}
      >
        <ClientUIEnforcer />
        {/* CRT Scanline Overlay */}
        <div className="scanline-overlay" />
        <ConvexClientProvider>{children}</ConvexClientProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
