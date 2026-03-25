import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import AuthProvider from "../components/AuthProvider";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Painter's Blue Tax Assist | 画家のための青色申告支援",
  description: "Google Drive と Gemini AI を活用した、画家・アーティスト専用の確定申告（青色申告）支援アプリです。レシート画像を自動解析し、仕訳データを弥生や円簿会計用に出力します。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={`${inter.variable} ${playfair.variable} antialiased`}>
      <body className="font-sans">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
