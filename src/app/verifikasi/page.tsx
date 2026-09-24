import type { Metadata } from "next";
import { buatKlienServer } from "@/lib/supabase/server";
import { SUPABASE_SIAP } from "@/lib/konfig";
import { Isian, JudulHalaman, Kartu, Pesan, Tombol } from "@/components/ui/dasar";
import { tanggal, tanggalJam } from "@/lib/format";

export const metadata: Metadata = { title: "Verifikasi Sertifikat", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

type Hasil = { nomor_sertifikat: string; nama: string; judul_acara: string; mulai: string; skp: number | null; nomor_skp: string | null; diterbitkan: string };

export default async function Verifikasi({ searchParams }: { searchParams: Promise<{ kode?: string }> }) {
  const kode = (await searchParams).kode?.trim().toUpperCase() ?? "";
  let hasil: Hasil | null = null;
  if (kode && /^[0-9A-F]{12}$/.test(kode) && SUPABASE_SIAP) {
    const supabase = await buatKlienServer();
    const { data } = await supabase.rpc("verifikasi_sertifikat", { p_kode: kode });
    hasil = ((data ?? []) as Hasil[])[0] ?? null;
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <JudulHalaman atas="Untuk panitia, instansi, atau siapa pun" judul="Verifikasi Sertifikat"
        deskripsi="Masukkan 12 karakter kode verifikasi yang tercetak di pojok kiri bawah sertifikat." />
      <form className="flex gap-2">
        <Isian name="kode" defaultValue={kode} placeholder="Contoh: 3FA91C0B7D2E" maxLength={12} className="font-mono uppercase tracking-widest" />
        <Tombol type="submit">Periksa</Tombol>
      </form>

      {kode && (
        <div className="mt-8">
          {hasil ? (
            <Kartu className="overflow-hidden">
              <div className="bg-emerald-600 px-6 py-3 text-sm font-semibold text-white">✓ Sertifikat asli & tercatat</div>
              <dl className="grid gap-4 p-6 text-sm sm:grid-cols-2">
                <div><dt className="text-slate-500">Nama</dt><dd className="font-semibold text-slate-900">{hasil.nama}</dd></div>
                <div><dt className="text-slate-500">Nomor sertifikat</dt><dd className="font-mono text-slate-900">{hasil.nomor_sertifikat}</dd></div>
                <div className="sm:col-span-2"><dt className="text-slate-500">Kegiatan</dt><dd className="font-semibold text-slate-900">{hasil.judul_acara}</dd></div>
                <div><dt className="text-slate-500">Tanggal kegiatan</dt><dd className="text-slate-900">{tanggal(hasil.mulai)}</dd></div>
                <div><dt className="text-slate-500">SKP</dt><dd className="text-slate-900">{hasil.skp ?? "—"}{hasil.nomor_skp ? ` (No. ${hasil.nomor_skp})` : ""}</dd></div>
                <div className="sm:col-span-2"><dt className="text-slate-500">Diterbitkan</dt><dd className="text-slate-900">{tanggalJam(hasil.diterbitkan)}</dd></div>
              </dl>
            </Kartu>
          ) : (
            <Pesan jenis="galat" judul="Sertifikat tidak ditemukan">
              Periksa kembali kodenya. Bila kode sudah benar, sertifikat tersebut tidak diterbitkan oleh Alumni Kedokteran UMM.
            </Pesan>
          )}
        </div>
      )}
    </div>
  );
}
