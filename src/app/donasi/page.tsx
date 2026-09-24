import type { Metadata } from "next";
import Link from "next/link";
import { ambilDonasi, ambilDonatur } from "@/lib/data";
import { ambilPengaturan } from "@/lib/sesi";
import { JudulHalaman, Kartu, Kosong, Pesan, TautanTombol } from "@/components/ui/dasar";
import { TombolSalin } from "@/components/salin";
import { rupiah } from "@/lib/format";

export const metadata: Metadata = { title: "Iuran & Donasi", description: "Iuran anggota dan program donasi Alumni Kedokteran UMM." };
export const revalidate = 300;

export default async function Donasi() {
  const [program, p] = await Promise.all([ambilDonasi(), ambilPengaturan()]);
  const donatur = await Promise.all(program.map((d) => ambilDonatur(d.id)));

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <JudulHalaman atas="Berbagi untuk almamater" judul="Iuran & Donasi"
        deskripsi="Kontribusi alumni membiayai kegiatan organisasi, beasiswa adik tingkat, dan program pengabdian masyarakat."
        aksi={<TautanTombol href="/donasi/saya" varian="garis">Riwayat kontribusi saya</TautanTombol>} />

      <div className="mb-8 grid gap-3 sm:grid-cols-3">
        {[
          ["1", "Transfer", "ke rekening resmi program di bawah."],
          ["2", "Konfirmasi", "unggah bukti transfer lewat tombol Konfirmasi."],
          ["3", "Tercatat", "bendahara memeriksa, dana masuk laporan keuangan."],
        ].map(([n, j, t]) => (
          <div key={n} className="flex items-start gap-3 rounded-xl border border-merek-100 bg-merek-50/60 p-4 text-sm">
            <span className="grid size-7 shrink-0 place-items-center rounded-full bg-merek-700 text-xs font-bold text-white">{n}</span>
            <p className="text-slate-600"><strong className="text-slate-900">{j}</strong> {t}</p>
          </div>
        ))}
      </div>

      {!program.length ? (
        <Kosong judul="Belum ada program aktif" pesan="Program donasi dan informasi iuran akan diumumkan di sini." />
      ) : (
        <div className="space-y-6">
          {program.map((d, i) => {
            const persen = d.target ? Math.min(100, Math.round(((d.terkumpul ?? 0) / d.target) * 100)) : null;
            return (
              <Kartu key={d.id} className="overflow-hidden">
                <div className="p-6 sm:p-8">
                  <h2 className="font-serif text-xl font-bold text-slate-900">{d.judul}</h2>
                  <p className="mt-3 whitespace-pre-line leading-relaxed text-slate-600">{d.deskripsi}</p>

                  {persen !== null && (
                    <div className="mt-6">
                      <div className="flex justify-between text-sm">
                        <span className="font-semibold text-merek-800">{rupiah(d.terkumpul)}</span>
                        <span className="text-slate-500">dari {rupiah(d.target)}</span>
                      </div>
                      <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-gradient-to-r from-merek-500 to-merek-700" style={{ width: `${persen}%` }} />
                      </div>
                      <p className="mt-1.5 text-xs text-slate-500">{persen}% tercapai</p>
                    </div>
                  )}
                </div>

                {d.no_rekening && (
                  <div className="border-t border-slate-200 bg-slate-50 px-6 py-5 sm:px-8">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Transfer ke</p>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2">
                      <div>
                        <p className="text-sm text-slate-500">{d.bank}</p>
                        <p className="font-mono text-xl font-bold tracking-wider text-slate-900">{d.no_rekening}</p>
                        <p className="text-sm text-slate-600">a.n. {d.atas_nama}</p>
                      </div>
                      <TombolSalin teks={d.no_rekening.replace(/\s/g, "")} label="Salin nomor" />
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <TautanTombol href={`/donasi/konfirmasi?program=${d.id}`} className="py-2">Sudah transfer? Konfirmasi di sini</TautanTombol>
                      {d.narahubung && <span className="text-sm text-slate-600">Pertanyaan: <strong>{d.narahubung}</strong></span>}
                    </div>
                  </div>
                )}

                {donatur[i].length > 0 && (
                  <div className="border-t border-slate-200 px-6 py-5 sm:px-8">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Terima kasih kepada</p>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">
                      {donatur[i].map((x) => `${x.nama}${x.angkatan ? ` (${x.angkatan})` : ""}`).join(" · ")}
                      <span className="text-slate-400"> · serta para donatur anonim</span>
                    </p>
                  </div>
                )}
              </Kartu>
            );
          })}
        </div>
      )}

      <div className="mt-8 space-y-3">
        {p.donasi_catatan && (
          <Pesan jenis="info" judul="Transparansi">
            {p.donasi_catatan} Alumni terverifikasi dapat melihat rinciannya di halaman{" "}
            <Link href="/laporan-keuangan" className="font-medium underline">Laporan Keuangan</Link>.
          </Pesan>
        )}
        <Pesan jenis="ingat" judul="Waspada penipuan">
          Rekening resmi hanya yang tercantum di halaman ini. Pengurus tidak pernah meminta transfer ke rekening pribadi.
        </Pesan>
      </div>
    </div>
  );
}
