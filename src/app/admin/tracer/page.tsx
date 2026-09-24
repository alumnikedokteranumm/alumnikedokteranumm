import Link from "next/link";
import { buatKlienServer } from "@/lib/supabase/server";
import { Kartu, Kosong, Pesan } from "@/components/ui/dasar";
import { angka } from "@/lib/format";
import type { RekapTracer } from "@/lib/tipe";

function Batang({ data }: { data: { label: string; jumlah: number }[] }) {
  const total = data.reduce((a, b) => a + b.jumlah, 0) || 1;
  const maks = Math.max(1, ...data.map((d) => d.jumlah));
  return (
    <ul className="space-y-3">
      {data.map((d) => (
        <li key={d.label} className="text-sm">
          <div className="flex justify-between gap-3">
            <span className="text-slate-700">{d.label}</span>
            <span className="shrink-0 tabular-nums text-slate-500">{angka(d.jumlah)} · {Math.round((d.jumlah / total) * 100)}%</span>
          </div>
          <div className="mt-1 h-2 rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-merek-600" style={{ width: `${(d.jumlah / maks) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

export default async function RekapTracerPage({ searchParams }: { searchParams: Promise<{ tahun?: string }> }) {
  const { tahun: t } = await searchParams;
  const tahunIni = new Date().getFullYear();
  const tahun = t === "semua" ? null : Number(t) || tahunIni;

  const supabase = await buatKlienServer();
  const { data, error } = await supabase.rpc("rekap_tracer", { tahun });
  const r = data as RekapTracer | null;

  const indikator = r ? [
    { label: "Responden", nilai: angka(r.jumlah_responden), ket: "" },
    { label: "Rata-rata masa tunggu", nilai: r.rata_masa_tunggu != null ? `${r.rata_masa_tunggu} bln` : "—", ket: "LAM-PTKes: unggul bila < 6 bulan" },
    { label: "Mendapat kerja ≤ 6 bulan", nilai: r.persen_tunggu_kurang_6_bulan != null ? `${r.persen_tunggu_kurang_6_bulan}%` : "—", ket: "" },
    { label: "Kesesuaian bidang", nilai: r.rata_kesesuaian != null ? `${r.rata_kesesuaian} / 5` : "—", ket: "" },
    { label: "Kepuasan pendidikan", nilai: r.rata_kepuasan != null ? `${r.rata_kepuasan} / 5` : "—", ket: "" },
  ] : [];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-slate-900">Rekap Tracer Study</h1>
          <p className="mt-1 text-sm text-slate-500">Data agregat untuk borang akreditasi dan evaluasi kurikulum.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {[tahunIni, tahunIni - 1, tahunIni - 2].map((th) => (
            <Link key={th} href={`/admin/tracer?tahun=${th}`}
              className={`rounded-full px-3.5 py-1.5 text-sm ${tahun === th ? "bg-merek-700 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200"}`}>{th}</Link>
          ))}
          <Link href="/admin/tracer?tahun=semua" className={`rounded-full px-3.5 py-1.5 text-sm ${tahun === null ? "bg-merek-700 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200"}`}>Semua</Link>
          <a href={`/admin/ekspor/tracer?tahun=${tahun ?? "semua"}`} className="rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50">⬇ Ekspor CSV</a>
        </div>
      </div>

      {error ? (
        <div className="mt-6"><Pesan jenis="galat">{error.message}</Pesan></div>
      ) : !r || !r.jumlah_responden ? (
        <div className="mt-6"><Kosong judul="Belum ada responden" pesan="Umumkan tracer study lewat berita dan grup angkatan agar alumni terverifikasi mengisinya." /></div>
      ) : (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {indikator.map((i) => (
              <Kartu key={i.label} className="p-5">
                <p className="text-xs text-slate-500">{i.label}</p>
                <p className="mt-1 font-serif text-2xl font-bold text-slate-900">{i.nilai}</p>
                {i.ket && <p className="mt-1 text-[11px] text-slate-400">{i.ket}</p>}
              </Kartu>
            ))}
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <Kartu className="p-6">
              <h2 className="font-semibold text-slate-900">Status alumni saat ini</h2>
              <div className="mt-4"><Batang data={r.status_kerja} /></div>
            </Kartu>
            <Kartu className="p-6">
              <h2 className="font-semibold text-slate-900">Jenis instansi tempat bekerja</h2>
              <div className="mt-4"><Batang data={r.jenis_instansi} /></div>
            </Kartu>
          </div>

          <Kartu className="mt-6 p-6">
            <h2 className="font-semibold text-slate-900">Penilaian kompetensi (rata-rata 1–5)</h2>
            <ul className="mt-5 grid gap-x-10 gap-y-4 sm:grid-cols-2">
              {Object.entries(r.kompetensi).map(([label, n]) => (
                <li key={label} className="text-sm">
                  <div className="flex justify-between"><span className="text-slate-700">{label}</span><span className="font-semibold tabular-nums">{n ?? "—"}</span></div>
                  <div className="mt-1 h-2 rounded-full bg-slate-100">
                    <div className={`h-full rounded-full ${(n ?? 0) >= 4 ? "bg-merek-600" : (n ?? 0) >= 3 ? "bg-amber-500" : "bg-rose-500"}`} style={{ width: `${((n ?? 0) / 5) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-5 text-xs text-slate-400">Hijau ≥ 4 · Kuning 3–3,9 · Merah &lt; 3 — kompetensi merah layak menjadi prioritas perbaikan kurikulum.</p>
          </Kartu>
        </>
      )}
    </div>
  );
}
