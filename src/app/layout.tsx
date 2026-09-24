import type { Metadata, Viewport } from "next";
import { Inter, Lora } from "next/font/google";
import "./globals.css";
import { KepalaSitus } from "@/components/kepala-situs";
import { KakiSitus } from "@/components/kaki-situs";
import { NAMA_SITUS } from "@/lib/konstanta";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const lora = Lora({ subsets: ["latin"], variable: "--font-lora", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: {
    default: NAMA_SITUS,
    template: `%s · ${NAMA_SITUS}`,
  },
  description:
    "Portal resmi Alumni Kedokteran UMM: direktori alumni, agenda ilmiah, peluang karier, tracer study, dan kabar almamater.",
  keywords: ["alumni", "kedokteran", "UMM", "Universitas Muhammadiyah Malang", "dokter", "alumnikedokteranumm"],
  openGraph: {
    type: "website",
    locale: "id_ID",
    siteName: NAMA_SITUS,
    title: NAMA_SITUS,
    description: "Direktori alumni, agenda ilmiah, peluang karier, dan tracer study FK UMM.",
    images: [{ url: "/logo-512.png", width: 512, height: 512, alt: NAMA_SITUS }],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#172a52",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${inter.variable} ${lora.variable}`}>
      <body className="flex min-h-dvh flex-col font-sans antialiased">
        <a
          href="#isi"
          className="tanpa-cetak sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-merek-700 focus:px-4 focus:py-2 focus:text-sm focus:text-white"
        >
          Lompat ke isi utama
        </a>
        <KepalaSitus />
        <main id="isi" className="flex-1">{children}</main>
        <KakiSitus />
      </body>
    </html>
  );
}
