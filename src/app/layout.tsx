import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Sentez - Edge Social AI & Security Engine",
  description: "TEKNOFEST Sosyal İnovasyon Yarışması - Uçta Hesaplama ($0 API Maliyeti) Yerli Güvenlik ve Sosyal Ağ Altyapısı",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className={`${inter.className} h-full antialiased dark`}>
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-100">{children}</body>
    </html>
  );
}
