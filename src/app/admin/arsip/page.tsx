import Link from "next/link";
import { buatKlienServer } from "@/lib/supabase/server";
import { Isian, Kartu, Kosong, Tombol } from "@/components/ui/dasar";
import { angka } from "@/lib/format";
import { FormImpor, TombolHapusArsip } from "./form";

type Baris = { id: string; nama: string; nim: string | null; angkatan: number | null; tahun_lulus: number | null; keterangan: string | null };

export default async function KelolaArsip({ searchParams }: { searchParams: Promise<{ q?: string; tahun?: string }> }) {
  const s = await searchParams;
  const supabase = await buatKlienServer();
  let kueri = supabase.from("arsip_lulusan").select("*", { count: "exact" })
    .order("tahun_lulus", { ascending: false, nullsFirst: false }).order("nama").limit(200);
  if (s.tahun && Number(s.tahun)) kueri = kueri.eq("tahun_lulus", Number(s.tahun));
  if (s.q?.trim()) {
    const q = s.q.trim().replace(/[%,()]/g, " ");
    kueri = kueri.or(`nama.ilike.%${q}%,nim.ilike.%${q}%`);
  }
  const { data, count } = await kueri;
  const daftar = (data ?? []) as Baris[];

  return (
    <div>
      <h1 className="font-serif text-2xl font-bold text-slate-900">🗂️ Arsip Lulusan</h1>
      <p className="mt-1 text-sm text-slate-500">
        Data lulusan dari arsip fakultas. Selain tampil di halaman Arsip Lulusan (tanpa NIM), data ini membantu verifikasi:
        pendaftar yang NIM-nya cocok diberi tanda <strong>“cocok arsip”</strong> di menu Verifikasi.
      </p>

      <div className="mt-6"><FormImpor /></div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">{angka(count)} data{s.q || s.tahun ? " (tersaring)" : ""}</p>
        <form className="flex gap-2">
          <Isian name="tahun" defaultValue={s.tahun} placeholder="Tahun lulus" className="w-32 py-2" inputMode="numeric" />
          <Isian name="q" defaultValue={s.q} placeholder="Cari nama / NIM" className="w-52 py-2" />
          <Tombol type="submit" varian="garis" className="py-2">Cari</Tombol>
          {(s.q || s.tahun) && <Link href="/admin/arsip" className="self-center text-sm text-slate-500 hover:underline">Reset</Link>}
        </form>
      </div>

      {!daftar.length ? (
        <div className="mt-4"><Kosong judul="Belum ada data" pesan="Tempel daftar lulusan di kotak impor di atas." /></div>
      ) : (
        <Kartu className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
              <tr><th className="px-4 py-3">Nama</th><th className="px-4 py-3">NIM</th><th className="px-4 py-3">Angkatan</th><th className="px-4 py-3">Lulus</th><th className="px-4 py-3">Keterangan</th><th className="px-4 py-3" /></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {daftar.map((b) => (
                <tr key={b.id}>
                  <td className="px-4 py-2.5 font-medium text-slate-900">{b.nama}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-slate-600">{b.nim ?? "—"}</td>
                  <td className="px-4 py-2.5 text-slate-600">{b.angkatan ?? "—"}</td>
                  <td className="px-4 py-2.5 text-slate-600">{b.tahun_lulus ?? "—"}</td>
                  <td className="px-4 py-2.5 text-slate-500">{b.keterangan ?? ""}</td>
                  <td className="px-4 py-2.5 text-right"><TombolHapusArsip id={b.id} nama={b.nama} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Kartu>
      )}
    </div>
  );
}
