import Link from "next/link";
import { notFound } from "next/navigation";
import { buatKlienServer } from "@/lib/supabase/server";
import { SKEMA } from "@/lib/skema-konten";
import { Kosong, Lencana, Pesan, TautanTombol } from "@/components/ui/dasar";
import { rupiah, tanggalSingkat, tanggalJam } from "@/lib/format";

export default async function DaftarKonten({
  params, searchParams,
}: { params: Promise<{ jenis: string }>; searchParams: Promise<{ dihapus?: string }> }) {
  const { jenis } = await params;
  const { dihapus } = await searchParams;
  const skema = SKEMA[jenis];
  if (!skema) notFound();

  const supabase = await buatKlienServer();
  const { data, error } = await supabase.from(skema.tabel).select("*")
    .order(skema.urut.kolom, { ascending: skema.urut.naik, nullsFirst: false }).limit(300);
  const baris = (data ?? []) as Record<string, unknown>[];

  const tampil = (nilai: unknown, jenisKolom?: string) => {
    if (nilai === null || nilai === undefined || nilai === "") return <span className="text-slate-300">—</span>;
    if (jenisKolom === "centang") return nilai ? <Lencana warna="hijau">Ya</Lencana> : <Lencana>Draf</Lencana>;
    if (jenisKolom === "tanggal") return tanggalSingkat(String(nilai));
    if (jenisKolom === "waktu") return tanggalJam(String(nilai));
    if (jenisKolom === "rupiah") return rupiah(Number(nilai));
    return String(nilai);
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-slate-900">{skema.ikon} {skema.judul}</h1>
          <p className="mt-1 text-sm text-slate-500">{baris.length} {skema.tunggal}</p>
        </div>
        <TautanTombol href={`/admin/konten/${jenis}/baru`}>+ Tambah {skema.tunggal}</TautanTombol>
      </div>

      {dihapus && <div className="mt-4"><Pesan jenis="sukses">Berhasil dihapus.</Pesan></div>}
      {error && <div className="mt-4"><Pesan jenis="galat">{error.message}</Pesan></div>}

      {!baris.length ? (
        <div className="mt-6">
          <Kosong judul={`Belum ada ${skema.tunggal}`} pesan="Mulai dengan menekan tombol Tambah di kanan atas."
            aksi={<TautanTombol href={`/admin/konten/${jenis}/baru`}>+ Tambah {skema.tunggal}</TautanTombol>} />
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full min-w-[600px] text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
              <tr>
                {skema.kolomDaftar.map((k) => <th key={k.nama} className="px-4 py-3 font-medium">{k.label}</th>)}
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {baris.map((b) => (
                <tr key={String(b.id)} className="hover:bg-slate-50/60">
                  {skema.kolomDaftar.map((k, i) => (
                    <td key={k.nama} className={`px-4 py-3 ${i === 0 ? "font-medium text-slate-900" : "text-slate-600"}`}>
                      {i === 0 ? (
                        <Link href={`/admin/konten/${jenis}/${b.id}`} className="hover:text-merek-700 hover:underline">{tampil(b[k.nama], k.jenis)}</Link>
                      ) : tampil(b[k.nama], k.jenis)}
                    </td>
                  ))}
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <Link href={`/admin/konten/${jenis}/${b.id}`} className="text-merek-700 hover:underline">Ubah</Link>
                    {skema.tautanPublik && (
                      <a href={skema.tautanPublik(b)} target="_blank" className="ml-3 text-slate-400 hover:text-slate-700">Lihat ↗</a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
