import Link from "next/link";
import { Logo } from "./logo";
import { DeretSosmed } from "./sosmed";
import { ambilPengaturan } from "@/lib/sesi";

export async function KakiSitus() {
  const p = await ambilPengaturan();
  const tahun = new Date().getFullYear();

  const kolom = [
    {
      judul: "Organisasi",
      tautan: [
        { href: "/tentang", label: "Tentang Kami" },
        { href: "/tentang#visi-misi", label: "Visi & Misi" },
        { href: "/tentang#pengurus", label: "Struktur Pengurus" },
        { href: "/kontak", label: "Kontak & Sekretariat" },
      ],
    },
    {
      judul: "Informasi",
      tautan: [
        { href: "/berita", label: "Berita & Artikel" },
        { href: "/agenda", label: "Agenda Kegiatan" },
        { href: "/galeri", label: "Galeri Foto" },
        { href: "/karier", label: "Karier & Beasiswa" },
      ],
    },
    {
      judul: "Alumni",
      tautan: [
        { href: "/daftar", label: "Daftar Keanggotaan" },
        { href: "/direktori", label: "Direktori Alumni" },
        { href: "/video", label: "Video Edukasi" },
        { href: "/dokumen", label: "Dokumen Penting" },
        { href: "/tracer-study", label: "Tracer Study" },
        { href: "/donasi", label: "Iuran & Donasi" },
      ],
    },
  ];

  return (
    <footer className="tanpa-cetak mt-20 border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div className="max-w-sm">
            <div className="flex items-center gap-2.5">
              <Logo className="size-12" />
              <span className="leading-none">
                <span className="block text-[17px] font-bold text-slate-900">{p.singkatan || "Alumni Kedokteran UMM"}</span>
                {p.nama_organisasi && p.nama_organisasi !== p.singkatan && (
                  <span className="mt-1 block text-xs text-slate-500">{p.nama_organisasi}</span>
                )}
              </span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-slate-600">
              {p.tagline || "Merawat Silaturahmi, Menguatkan Pengabdian"}
            </p>
            {p.alamat && <p className="mt-4 text-sm leading-relaxed text-slate-500">{p.alamat}</p>}
            <div className="mt-3 space-y-1 text-sm">
              {[p.email, p.email_kampus].filter(Boolean).map((e) => (
                <p key={e}><a href={`mailto:${e}`} className="break-all text-merek-700 hover:underline">{e}</a></p>
              ))}
              {p.telepon && <p className="text-slate-500">{p.telepon}</p>}
            </div>
            <div className="mt-5"><DeretSosmed p={p} /></div>
          </div>

          {kolom.map((k) => (
            <div key={k.judul}>
              <h2 className="text-sm font-semibold text-slate-900">{k.judul}</h2>
              <ul className="mt-4 space-y-2.5">
                {k.tautan.map((t) => (
                  <li key={t.href + t.label}>
                    <Link href={t.href} className="text-sm text-slate-600 hover:text-merek-700 hover:underline">
                      {t.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-slate-200 pt-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {tahun} {p.singkatan || "Alumni Kedokteran UMM"}. Hak cipta dilindungi.</p>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <Link href="/privasi" className="hover:text-merek-700 hover:underline">Kebijakan Privasi</Link>
            <Link href="/kontak" className="hover:text-merek-700 hover:underline">Kontak</Link>
            <a href="https://kedokteran.umm.ac.id/" target="_blank" rel="noreferrer noopener" className="hover:text-merek-700 hover:underline">
              Situs FK UMM ↗
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
