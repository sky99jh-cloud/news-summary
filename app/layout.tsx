import type { Metadata } from "next";
import { Hahmlet, IBM_Plex_Sans_KR } from "next/font/google";
import "./globals.css";

const display = Hahmlet({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "600", "700"],
});

const sans = IBM_Plex_Sans_KR({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "실시간 뉴스 요약",
  description: "네이버 뉴스 검색과 AI 요약·분석",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${display.variable} ${sans.variable}`}>
      <body className="font-ui min-h-screen antialiased text-[var(--paper)]">
        {children}
      </body>
    </html>
  );
}
