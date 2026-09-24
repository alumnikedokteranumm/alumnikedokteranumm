"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavAdmin({ admin }: { admin: boolean }) {
  const jalur = usePathname();
  const grup = [
    { judul: "", tautan: [{ href: "/admin", label: "Ringkasan", ikon: "📊" }] },
    { judul: "Data alumni", tautan: [
      { href: "/admin/alumni", label: "Verifikasi & Anggota", ikon: "🩺" },
      { href: "/admin/tracer", label: "Rekap Tracer Study", ikon: "📈" },
      { href: "/admin/arsip", label: "Arsip Lulusan", ikon: "🗂️" },
    ] },
    { judul: "Layanan alumni", tautan: [
      { href: "/admin/webinar", label: "Webinar & SKP", ikon: "🎓" },
      { href: "/admin/konten/pustaka", label: "Perpustakaan", ikon: "📚" },
    ] },
    { judul: "Keuangan", tautan: [
      { href: "/admin/pembayaran", label: "Pembayaran", ikon: "💳" },
      { href: "/admin/konten/kas", label: "Buku Kas", ikon: "📒" },
      { href: "/admin/konten/donasi", label: "Program Iuran & Donasi", ikon: "💝" },
    ] },
    { judul: "Konten situs", tautan: [
      { href: "/admin/konten/berita", label: "Berita", ikon: "📰" },
      { href: "/admin/konten/acara", label: "Agenda", ikon: "📅" },
      { href: "/admin/konten/album", label: "Galeri", ikon: "🖼️" },
      { href: "/admin/konten/video", label: "Video Edukasi", ikon: "🎬" },
      { href: "/admin/konten/dokumen", label: "Dokumen", ikon: "📄" },
      { href: "/admin/konten/lowongan", label: "Karier", ikon: "💼" },
      { href: "/admin/konten/pengurus", label: "Pengurus", ikon: "👥" },
    ] },
    ...(admin ? [{ judul: "Sistem", tautan: [
      { href: "/admin/pengaturan", label: "Pengaturan Situs", ikon: "⚙️" },
      { href: "/admin/audit", label: "Jejak Audit", ikon: "🔍" },
    ] }] : []),
  ];

  return (
    <nav className="flex gap-1 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
      {grup.map((g) => (
        <div key={g.judul} className="contents lg:mb-3 lg:block">
          {g.judul && <p className="mb-1 mt-2 hidden px-3 text-[11px] font-medium text-slate-400 lg:block">{g.judul}</p>}
          {g.tautan.map((t) => {
            const aktif = t.href === "/admin" ? jalur === "/admin" : jalur.startsWith(t.href);
            return (
              <Link key={t.href} href={t.href}
                className={`flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm ${aktif ? "bg-merek-50 font-medium text-merek-800" : "text-slate-600 hover:bg-slate-100"}`}>
                <span aria-hidden>{t.ikon}</span>{t.label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
