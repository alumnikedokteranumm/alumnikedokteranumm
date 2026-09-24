import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ambilSesi, tautanFoto } from "@/lib/sesi";
import { FormProfil } from "./form-profil";
import { ZonaBahaya } from "./zona-bahaya";
import { UnggahFoto } from "@/components/unggah-foto";
import { Kartu, Lencana, Pesan, TautanTombol } from "@/components/ui/dasar";
import { aksiKeluar } from "@/actions/autentikasi";
import { tanggal } from "@/lib/format";

export const metadata: Metadata = { title: "Profil Saya", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function HalamanProfil({
  searchParams,
}: { searchParams: Promise<{ baru?: string; sandi?: string }> }) {
  const { user, profil } = await ambilSesi();
  if (!user || !profil) redirect("/masuk?lanjut=/profil");
  const q = await searchParams;
  const fotoUrl = await tautanFoto(profil.foto_path);

  const lengkap = [profil.nim, profil.angkatan, profil.tahun_lulus, profil.status_profesi, profil.kota || profil.kota_kerja]
    .filter(Boolean).length;
  const persen = Math.round((lengkap / 5) * 100);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-merek-600">Akun alumni</p>
          <h1 className="mt-1 font-serif text-3xl font-bold text-slate-900">Profil Saya</h1>
          <p className="mt-1.5 text-sm text-slate-500">{user.email} · terdaftar {tanggal(profil.dibuat_pada)}</p>
        </div>
        <form action={aksiKeluar}>
          <button className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            Keluar
          </button>
        </form>
      </div>

      <div className="mb-6 space-y-3">
        {q.baru && <Pesan jenis="sukses" judul="Akun berhasil dibuat">Lengkapi data di bawah agar pengurus bisa memverifikasi keanggotaanmu.</Pesan>}
        {q.sandi && <Pesan jenis="sukses">Kata sandi berhasil diperbarui.</Pesan>}

        {profil.status === "menunggu" && (
          <Pesan jenis="ingat" judul="Menunggu verifikasi pengurus">
            Akses direktori alumni dan tracer study akan terbuka setelah pengurus mencocokkan datamu
            dengan arsip fakultas. Pastikan <strong>NIM, angkatan, dan tahun lulus</strong> sudah terisi
            dengan benar — itu yang paling mempercepat proses.
          </Pesan>
        )}
        {profil.status === "ditolak" && (
          <Pesan jenis="galat" judul="Pendaftaran belum dapat diverifikasi">
            {profil.catatan_admin || "Data belum cocok dengan arsip fakultas."} Perbaiki data lalu hubungi pengurus lewat halaman Kontak.
          </Pesan>
        )}
        {profil.status === "terverifikasi" && (
          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-merek-200 bg-merek-50 px-4 py-3 text-sm text-merek-900">
            <Lencana warna="hijau">✓ Terverifikasi</Lencana>
            <span>Kamu punya akses penuh ke ruang alumni.</span>
            <div className="ml-auto flex gap-2">
              <TautanTombol href="/direktori" varian="halus" className="px-3 py-1.5">Direktori</TautanTombol>
              <TautanTombol href="/video" varian="halus" className="px-3 py-1.5">Video</TautanTombol>
              <TautanTombol href="/dokumen" varian="halus" className="px-3 py-1.5">Dokumen</TautanTombol>
              <TautanTombol href="/tracer-study" varian="halus" className="px-3 py-1.5">Tracer Study</TautanTombol>
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="space-y-6">
          <Kartu className="p-6">
            <h2 className="text-base font-semibold text-slate-900">Foto profil</h2>
            <div className="mt-4">
              <UnggahFoto idPengguna={user.id} nama={profil.nama_lengkap} urlAwal={fotoUrl} />
            </div>
          </Kartu>

          <FormProfil profil={profil} />

          <ZonaBahaya />
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <Kartu className="p-5">
            <p className="text-sm font-semibold text-slate-900">Kelengkapan data inti</p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-merek-600 transition-all" style={{ width: `${persen}%` }} />
            </div>
            <p className="mt-2 text-xs text-slate-500">{persen}% — NIM, angkatan, tahun lulus, profesi, dan kota.</p>
          </Kartu>

          <Kartu className="p-5 text-sm leading-relaxed text-slate-600">
            <p className="font-semibold text-slate-900">Siapa yang bisa melihat datamu?</p>
            <ul className="mt-3 space-y-2.5">
              <li><strong className="text-slate-800">Publik:</strong> tidak ada data pribadimu. Hanya angka statistik gabungan.</li>
              <li><strong className="text-slate-800">Alumni terverifikasi:</strong> nama, angkatan, profesi, kota, serta kontak yang kamu centang.</li>
              <li><strong className="text-slate-800">Pengurus:</strong> seluruh data untuk keperluan verifikasi. Setiap tindakan pengurus tercatat.</li>
              <li><strong className="text-slate-800">Hanya kamu:</strong> nomor STR, SIP, dan tanggal lahir.</li>
            </ul>
          </Kartu>

          <Kartu className="p-5 text-sm">
            <p className="font-semibold text-slate-900">Hak atas datamu</p>
            <p className="mt-2 leading-relaxed text-slate-600">Kamu berhak mendapatkan salinan seluruh data yang kami simpan tentang dirimu.</p>
            <a href="/profil/unduh" className="mt-3 inline-block font-medium text-merek-700 hover:underline">Unduh data saya (JSON) →</a>
          </Kartu>
        </aside>
      </div>
    </div>
  );
}
