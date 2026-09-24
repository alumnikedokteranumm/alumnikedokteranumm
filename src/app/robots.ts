import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const situs = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return {
    rules: [{
      userAgent: "*",
      allow: "/",
      // Halaman berisi data pribadi tidak boleh diindeks mesin pencari
      disallow: ["/direktori", "/profil", "/admin", "/tracer-study", "/video", "/dokumen", "/menunggu-verifikasi", "/auth", "/atur-ulang-sandi",
        "/mentoring", "/skp", "/sertifikat", "/verifikasi", "/pustaka", "/arsip-lulusan", "/laporan-keuangan", "/donasi/konfirmasi", "/donasi/saya"],
    }],
    sitemap: `${situs}/sitemap.xml`,
  };
}
