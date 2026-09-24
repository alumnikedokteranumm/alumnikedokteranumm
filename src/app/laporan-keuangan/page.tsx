import type { Metadata } from "next";
import Link from "next/link";
import { buatKlienServer } from "@/lib/supabase/server";
import { JudulHalaman, Kartu, Kosong, Pesan } from "@/components/ui/dasar";
import { rupiah, tanggalSingkat } from "@/lib/format";
import type { BarisKas, LaporanKas } from "@/lib/tipe";

export const metadata: Metadata = { title: "Laporan Keuangan", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const BULAN = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

export default async function LaporanKeuangan({ searchParams }: { searchParams: Promise<{ tahun?: string }> }) {
  const sekarang = new Date().getFullYear();
  const tahun = Math.min(sekarang + 1, Math.max(2000, Number((await searchParams).tahun) || sekarang));
  const supabase = await buatKlienServer();
  const [{ data: l, error }, { data: rincian }] = await Promise.all([
    supabase.rpc("laporan_kas", { p_tahun: tahun }),
    supabase.from("kas").select("*").gte("tanggal", `${tahun}-01-01`).lt("tanggal", `${tahun + 1}-01-01`)
      .order("tanggal", { ascending: false }).limit(500),
  ]);
  const lap = l as LaporanKas | null;
  const baris = (rincian ?? []) as BarisKas[];
  const tahunList = [...new Set([sekarang, ...(lap?.tahun_tersedia ?? [])])].sort((a, b) => b - a);

  if (error || !lap) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <JudulHalaman judul="Laporan Keuangan" />
        <Pesan jenis="galat">Laporan belum bisa dimuat{error ? `: ${error.message}` : "."}</Pesan>
      </div>
    );
  }

  const saldoAkhir = lap.saldo_awal + lap.masuk - lap.keluar;
  const perBulan = Array.from({ length: 12 }, (_, i) => {
    const b = lap.per_bulan.find((x) => x.bulan === i + 1);
    return { bulan: BULAN[i], masuk: b?.masuk ?? 0, keluar: b?.keluar ?? 0 };
  });
  const puncak = Math.max(1, ...perBulan.flatMap((b) => [b.masuk, b.keluar]));
  const kategori = (arah: "masuk" | "keluar") => lap.per_kategori.filter((k) => k.arah === arah);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <JudulHalaman atas="Transparansi dana" judul="Laporan Keuangan"
        deskripsi="Buku kas organisasi: pemasukan dari iuran, donasi, dan registrasi kegiatan, serta pengeluaran yang dicatat bendahara. Diperbarui otomatis."
        aksi={
          <form className="flex items-center gap-2 text-sm">
            <label htmlFor="tahun" className="text-slate-500">Tahun</label>
            <select id="tahun" name="tahun" defaultValue={tahun}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2">
              {tahunList.map((t) => <option key={t}>{t}</option>)}
            </select>
            <button className="rounded-lg border border-slate-300 bg-white px-3 py-2 hover:bg-slate-50">Tampilkan</button>
          </form>
        } />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Saldo awal", lap.saldo_awal, "text-slate-900"],
          ["Pemasukan", lap.masuk, "text-emerald-700"],
          ["Pengeluaran", lap.keluar, "text-rose-700"],
          ["Saldo akhir", saldoAkhir, "text-merek-800"],
        ].map(([label, nilai, warna]) => (
          <Kartu key={String(label)} className="p-5">
            <p className="text-sm text-slate-500">{label} {tahun}</p>
            <p className={`mt-1 text-xl font-bold ${warna}`}>{rupiah(Number(nilai))}</p>
          </Kartu>
        ))}
      </div>

      <Kartu className="mt-6 p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold text-slate-900">Arus kas per bulan</h2>
          <div className="flex gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-emerald-500" />Pemasukan</span>
            <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-rose-400" />Pengeluaran</span>
          </div>
        </div>
        <div className="mt-6 flex h-48 items-end gap-1 sm:gap-2" role="img" aria-label={`Grafik pemasukan dan pengeluaran per bulan tahun ${tahun}`}>
          {perBulan.map((b) => (
            <div key={b.bulan} className="flex h-full flex-1 flex-col justify-end">
              <div className="flex flex-1 items-end justify-center gap-0.5">
                <div className="w-1/2 max-w-4 rounded-t bg-emerald-500" style={{ height: `${(b.masuk / puncak) * 100}%` }}
                  title={`${b.bulan}: masuk ${rupiah(b.masuk)}`} />
                <div className="w-1/2 max-w-4 rounded-t bg-rose-400" style={{ height: `${(b.keluar / puncak) * 100}%` }}
                  title={`${b.bulan}: keluar ${rupiah(b.keluar)}`} />
              </div>
              <p className="mt-1.5 text-center text-[11px] text-slate-500">{b.bulan}</p>
            </div>
          ))}
        </div>
      </Kartu>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        {(["masuk", "keluar"] as const).map((arah) => (
          <Kartu key={arah} className="p-6">
            <h2 className="font-semibold text-slate-900">{arah === "masuk" ? "Sumber pemasukan" : "Penggunaan dana"}</h2>
            {kategori(arah).length ? (
              <ul className="mt-4 space-y-3">
                {kategori(arah).map((k) => {
                  const total = arah === "masuk" ? lap.masuk : lap.keluar;
                  const persen = total ? Math.round((k.jumlah / total) * 100) : 0;
                  return (
                    <li key={k.kategori}>
                      <div className="flex justify-between gap-3 text-sm">
                        <span className="text-slate-700">{k.kategori}</span>
                        <span className="font-medium text-slate-900">{rupiah(k.jumlah)} <span className="text-slate-400">· {persen}%</span></span>
                      </div>
                      <div className="mt-1 h-1.5 rounded-full bg-slate-100">
                        <div className={`h-full rounded-full ${arah === "masuk" ? "bg-emerald-500" : "bg-rose-400"}`} style={{ width: `${persen}%` }} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : <p className="mt-4 text-sm text-slate-400">Belum ada catatan.</p>}
          </Kartu>
        ))}
      </div>

      <h2 className="mb-3 mt-10 font-semibold text-slate-900">Rincian transaksi {tahun}</h2>
      {!baris.length ? (
        <Kosong judul="Belum ada transaksi" pesan="Transaksi tahun ini akan muncul setelah bendahara menerima pembayaran atau mencatat pengeluaran." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
              <tr><th className="px-4 py-3">Tanggal</th><th className="px-4 py-3">Uraian</th><th className="px-4 py-3">Kategori</th><th className="px-4 py-3 text-right">Masuk</th><th className="px-4 py-3 text-right">Keluar</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {baris.map((b) => (
                <tr key={b.id}>
                  <td className="whitespace-nowrap px-4 py-2.5 text-slate-600">{tanggalSingkat(b.tanggal)}</td>
                  <td className="px-4 py-2.5 text-slate-800">{b.uraian}</td>
                  <td className="px-4 py-2.5 text-slate-500">{b.kategori}</td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-right text-emerald-700">{b.arah === "masuk" ? rupiah(b.nominal) : ""}</td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-right text-rose-700">{b.arah === "keluar" ? rupiah(b.nominal) : ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-4 text-xs text-slate-500">
        Nama pembayar tidak ditampilkan di laporan ini. Pertanyaan tentang laporan dapat disampaikan lewat halaman <Link href="/kontak" className="underline">Kontak</Link>.
      </p>
    </div>
  );
}
