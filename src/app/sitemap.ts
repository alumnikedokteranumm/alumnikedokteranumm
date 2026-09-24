import type { MetadataRoute } from "next";
import { ambilAcara, ambilBerita } from "@/lib/data";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const situs = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const [berita, acara] = await Promise.all([ambilBerita(), ambilAcara()]);
  const statis = ["", "/tentang", "/berita", "/agenda", "/galeri", "/karier", "/donasi", "/kontak", "/privasi", "/daftar"];

  return [
    ...statis.map((j) => ({ url: `${situs}${j}`, changeFrequency: "weekly" as const, priority: j === "" ? 1 : 0.7 })),
    ...berita.map((b) => ({ url: `${situs}/berita/${b.slug}`, lastModified: b.terbit_pada ?? undefined, priority: 0.6 })),
    ...acara.map((a) => ({ url: `${situs}/agenda/${a.slug}`, priority: 0.5 })),
  ];
}
