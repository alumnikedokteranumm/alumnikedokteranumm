import type { Metadata } from "next";
import Link from "next/link";
import { ambilLowongan } from "@/lib/data";
import { JudulHalaman, Kartu, Kosong, Lencana, Pesan } from "@/components/ui/dasar";
import { JENIS_LOWONGAN } from "@/lib/konstanta";
import { tanggalSingkat, waktuRelatif } from "@/lib/format";

export const metadata: Metadata = { title: "Karier & Beasiswa", description: "Lowongan dokter, program PPDS, dan beasiswa untuk alumni FK UMM." };
export const revalidate = 300;

export default async function Karier({ searchParams }: { searchParams: Promise<{ jenis?: string }> }) {
  const { jenis } = await searchParams;
  const hariIni = new Date().toISOString().slice(0, 10);
  const semua = (await ambilLowongan()).filter((l) => !l.batas_lamar || l.batas_lamar >= hariIni);
  const daftar = jenis ? semua.filter((l) => l.jenis === jenis) : semua;

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <JudulHalaman atas="Peluang" judul="Karier & Beasiswa"
        deskripsi="Lowongan dari rumah sakit dan klinik mitra, informasi PPDS, serta beasiswa pendidikan lanjut — dikurasi pengurus." />

      <div className="mb-6 flex flex-wrap gap-2">
        <Link href="/karier" className={`rounded-full px-3.5 py-1.5 text-sm ${!jenis ? "bg-merek-700 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"}`}>Semua ({semua.length})</Link>
        {JENIS_LOWONGAN.map((j) => {
          const n = semua.filter((l) => l.jenis === j).length;
          return n ? (
            <Link key={j} href={`/karier?jenis=${encodeURIComponent(j)}`}
              className={`rounded-full px-3.5 py-1.5 text-sm ${jenis === j ? "bg-merek-700 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"}`}>
              {j} ({n})
            </Link>
          ) : null;
        })}
      </div>

      {!daftar.length ? (
        <Kosong judul="Belum ada lowongan aktif" pesan="Punya informasi lowongan di tempatmu bekerja? Kirimkan ke pengurus lewat halaman Kontak." />
      ) : (
        <div className="space-y-3">
          {daftar.map((l) => (
            <Link key={l.id} href={`/karier/${l.id}`} className="group block">
              <Kartu className="flex flex-wrap items-start justify-between gap-4 p-5 transition-all hover:border-merek-300 hover:shadow-md">
                <div className="min-w-0">
                  <div className="flex flex-wrap gap-1.5">
                    <Lencana warna={l.jenis === "Beasiswa" ? "emas" : "hijau"}>{l.jenis}</Lencana>
                    {l.tipe_kerja && <Lencana>{l.tipe_kerja}</Lencana>}
                  </div>
                  <h2 className="mt-2 font-semibold text-slate-900 group-hover:text-merek-700">{l.judul}</h2>
                  <p className="mt-0.5 text-sm text-slate-600">{l.institusi}{l.lokasi ? ` · ${l.lokasi}` : ""}</p>
                </div>
                {l.batas_lamar && (
                  <div className="text-right text-sm">
                    <p className="text-slate-400">Batas</p>
                    <p className="font-medium text-slate-700">{tanggalSingkat(l.batas_lamar)}</p>
                    <p className="text-xs text-amber-600">{waktuRelatif(l.batas_lamar + "T23:59:59+07:00")}</p>
                  </div>
                )}
              </Kartu>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-10">
        <Pesan jenis="info" judul="Hati-hati penipuan">
          Pengurus Alumni Kedokteran UMM tidak pernah memungut biaya untuk lowongan yang dipasang di sini.
          Selalu verifikasi langsung ke institusi sebelum mengirim dokumen pribadi.
        </Pesan>
      </div>
    </div>
  );
}
