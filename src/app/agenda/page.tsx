import type { Metadata } from "next";
import Link from "next/link";
import { ambilAcara } from "@/lib/data";
import { JudulHalaman, Kartu, Kosong, Lencana } from "@/components/ui/dasar";
import { tanggalJam, tanggalSingkat } from "@/lib/format";
import type { Acara } from "@/lib/tipe";

export const metadata: Metadata = { title: "Agenda Kegiatan", description: "Seminar, webinar ber-SKP, workshop, dan temu alumni FK UMM." };
export const revalidate = 300;

function KotakTanggal({ iso }: { iso: string }) {
  const d = new Date(iso);
  const opsi = { timeZone: "Asia/Jakarta" } as const;
  return (
    <div className="w-16 shrink-0 overflow-hidden rounded-lg border border-slate-200 text-center">
      <p className="bg-merek-700 py-1 text-[11px] font-semibold uppercase text-white">
        {d.toLocaleDateString("id-ID", { month: "short", ...opsi })}
      </p>
      <p className="py-1.5 font-serif text-2xl font-bold text-slate-900">{d.toLocaleDateString("id-ID", { day: "numeric", ...opsi })}</p>
    </div>
  );
}

function Baris({ a, lalu }: { a: Acara; lalu?: boolean }) {
  return (
    <Link href={`/agenda/${a.slug}`} className="group">
      <Kartu className={`flex gap-5 p-5 transition-all hover:border-merek-300 hover:shadow-md ${lalu ? "opacity-75" : ""}`}>
        <KotakTanggal iso={a.mulai} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap gap-1.5">
            <Lencana warna="hijau">{a.jenis}</Lencana>
            {a.daring && <Lencana warna="biru">Daring</Lencana>}
            {a.skp_idi && <Lencana warna="emas">{a.skp_idi} SKP</Lencana>}
          </div>
          <h2 className="mt-2 font-semibold text-slate-900 group-hover:text-merek-700">{a.judul}</h2>
          <p className="mt-1 text-sm text-slate-500">{tanggalJam(a.mulai)} · {a.lokasi}</p>
          {!lalu && a.biaya && <p className="mt-1 text-sm text-slate-500">Biaya: {a.biaya}</p>}
        </div>
      </Kartu>
    </Link>
  );
}

export default async function Agenda() {
  const [mendatang, lalu] = await Promise.all([
    ambilAcara({ mendatang: true, batas: 50 }),
    ambilAcara({ mendatang: false, batas: 12 }),
  ]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <JudulHalaman atas="Kalender kegiatan" judul="Agenda"
        deskripsi="Kegiatan ilmiah, sosial, dan silaturahmi alumni. Acara ber-SKP ditandai lencana emas." />

      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">Akan datang</h2>
      {mendatang.length ? (
        <div className="space-y-3">{mendatang.map((a) => <Baris key={a.id} a={a} />)}</div>
      ) : (
        <Kosong judul="Belum ada agenda terjadwal" pesan="Pantau halaman ini atau ikuti media sosial Alumni Kedokteran UMM untuk kabar terbaru." />
      )}

      {lalu.length > 0 && (
        <>
          <h2 className="mb-4 mt-14 text-sm font-semibold uppercase tracking-wider text-slate-400">Sudah berlangsung</h2>
          <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
            {lalu.map((a) => (
              <li key={a.id}>
                <Link href={`/agenda/${a.slug}`} className="flex items-center justify-between gap-4 px-5 py-3.5 text-sm hover:bg-slate-50">
                  <span className="font-medium text-slate-700">{a.judul}</span>
                  <span className="shrink-0 text-slate-400">{tanggalSingkat(a.mulai)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
