import Link from "next/link";
import { Logo } from "./logo";
import { MenuSeluler } from "./menu-seluler";
import { MenuAlumni } from "./menu-alumni";
import { TAUTAN_ALUMNI } from "@/lib/navigasi";
import { TautanAktif } from "./tautan-aktif";
import { ambilSesi, ambilPengaturan, tautanFoto } from "@/lib/sesi";
import { TautanTombol } from "./ui/dasar";
import { Avatar } from "./avatar";

const TAUTAN_UMUM = [
  { href: "/", label: "Beranda" },
  { href: "/tentang", label: "Tentang" },
  { href: "/berita", label: "Berita" },
  { href: "/agenda", label: "Agenda" },
  { href: "/galeri", label: "Galeri" },
  { href: "/karier", label: "Karier" },
  { href: "/donasi", label: "Donasi" },
];

export async function KepalaSitus() {
  const { user, profil } = await ambilSesi();
  const pengaturan = await ambilPengaturan();
  // Foto profil di bucket tertutup → tautan sementara; kosong = tampil inisial
  const foto = await tautanFoto(profil?.foto_path);
  const masuk = Boolean(user);
  const alumniAktif = profil?.status === "terverifikasi" && profil.peran !== "pending";
  const pengurus = profil ? ["admin", "pengurus"].includes(profil.peran) : false;

  const tautanSeluler = [
    ...TAUTAN_UMUM,
    ...(alumniAktif
      ? TAUTAN_ALUMNI.map((t) => ({ href: t.href, label: `${t.ikon} ${t.label}` }))
      : masuk ? [{ href: "/skp", label: "🎓 Webinar & SKP" }] : []),
    ...(masuk ? [{ href: "/profil", label: "Profil Saya" }] : [{ href: "/masuk", label: "Masuk" }, { href: "/daftar", label: "Daftar" }]),
    ...(pengurus ? [{ href: "/admin", label: "Panel Admin" }] : []),
  ];

  return (
    <header className="tanpa-cetak sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <Logo className="size-11" />
          <span className="leading-none">
            <span className="block text-[17px] font-bold tracking-tight text-slate-900">
              {pengaturan.singkatan || "Alumni Kedokteran UMM"}
            </span>
            {/* Kepanjangan ditampilkan bila singkatan berbeda, mis. "AKU" → "Alumni Kedokteran UMM" */}
            {pengaturan.nama_organisasi && pengaturan.nama_organisasi !== pengaturan.singkatan && (
              <span className="mt-1 block text-[11px] font-medium text-slate-500">{pengaturan.nama_organisasi}</span>
            )}
          </span>
        </Link>

        <nav className="ml-4 hidden items-center gap-0.5 lg:flex">
          {TAUTAN_UMUM.slice(1).map((t) => (
            <TautanAktif key={t.href} href={t.href}>{t.label}</TautanAktif>
          ))}
          {alumniAktif && <MenuAlumni />}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {masuk ? (
            <>
              {pengurus && (
                <Link href="/admin" className="hidden rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 sm:block">
                  Admin
                </Link>
              )}
              <Link href="/profil" className="flex items-center gap-2 rounded-lg py-1.5 pl-1.5 pr-3 hover:bg-slate-100" title="Profil saya">
                <Avatar nama={profil?.nama_lengkap || "Alumni"} url={foto} ukuran="size-8" teks="text-xs" />
                <span className="hidden max-w-48 truncate text-sm font-medium text-slate-700 sm:block"
                  title={profil?.nama_lengkap || undefined}>
                  {profil?.nama_lengkap || "Profil"}
                </span>
              </Link>
            </>
          ) : (
            <>
              <Link href="/masuk" className="hidden rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 sm:block">
                Masuk
              </Link>
              <span className="hidden sm:block">
                <TautanTombol href="/daftar" className="whitespace-nowrap px-3.5 py-2">Daftar Alumni</TautanTombol>
              </span>
            </>
          )}
          <MenuSeluler tautan={tautanSeluler} />
        </div>
      </div>
    </header>
  );
}
