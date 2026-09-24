import type { Metadata } from "next";
import Link from "next/link";
import { buatKlienServer } from "@/lib/supabase/server";
import { Isian, JudulHalaman, Kartu, Kosong, Lencana, Tombol } from "@/components/ui/dasar";
import { angka } from "@/lib/format";
import type { BarisArsip } from "@/lib/tipe";

export const metadata: Metadata = { title: "Arsip Lulusan", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

type Ringkas = { tahun_lulus: number; jumlah: number; bergabung: number };

export default async function ArsipLulusan({ searchParams }: { searchParams: Promise<{ tahun?: string; q?: string }> }) {
  const s = await searchParams;
  const supabase = await buatKlienServer();
  const { data: r } = await supabase.rpc("ringkasan_arsip");
  const ringkas = (r ?? []) as Ringkas[];
  const tahun = Number(s.tahun) || (s.q ? null : ringkas[0]?.tahun_lulus ?? null);
  const { data } = tahun || s.q
    ? await supabase.rpc("lihat_arsip", { p_tahun_lulus: tahun, q: s.q?.trim() || null })
    : { data: [] };
  const daftar = (data ?? []) as BarisArsip[];
  const total = ringkas.reduce((a, b) => a + b.jumlah, 0);
  const gabung = ringkas.reduce((a, b) => a + b.bergabung, 0);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <JudulHalaman atas="Khusus alumni terverifikasi" judul="Arsip Lulusan"
        deskripsi="Catatan lulusan Fakultas Kedokteran UMM per tahun, disusun pengurus dari arsip fakultas. Tanda ✓ berarti alumni tersebut sudah bergabung di portal." />

      {!ringkas.length ? (
        <Kosong judul="Arsip belum diisi" pesan="Pengurus sedang menyusun data lulusan dari arsip fakultas." />
      ) : (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            {[
              ["Lulusan tercatat", angka(total)],
              ["Sudah bergabung di portal", `${angka(gabung)} (${total ? Math.round((gabung / total) * 100) : 0}%)`],
              ["Tahun lulusan", `${ringkas[ringkas.length - 1].tahun_lulus}–${ringkas[0].tahun_lulus}`],
            ].map(([l, n]) => (
              <Kartu key={l} className="p-5"><p className="text-sm text-slate-500">{l}</p><p className="mt-1 text-2xl font-bold text-merek-800">{n}</p></Kartu>
            ))}
          </div>

          <form className="mb-5 flex gap-2">
            <Isian name="q" type="search" defaultValue={s.q} placeholder="Cari nama di semua tahun…" className="max-w-sm" />
            <Tombol type="submit" varian="garis">Cari</Tombol>
          </form>

          <div className="mb-8 flex flex-wrap gap-1.5">
            {ringkas.map((x) => (
              <Link key={x.tahun_lulus} href={`/arsip-lulusan?tahun=${x.tahun_lulus}`}
                className={`rounded-lg px-3 py-1.5 text-sm ${tahun === x.tahun_lulus && !s.q ? "bg-merek-700 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"}`}>
                {x.tahun_lulus} <span className="opacity-60">· {x.jumlah}</span>
              </Link>
            ))}
          </div>

          <h2 className="mb-3 font-semibold text-slate-900">
            {s.q ? `Hasil pencarian “${s.q}”` : `Lulusan tahun ${tahun}`} <span className="font-normal text-slate-400">({daftar.length})</span>
          </h2>
          {!daftar.length ? (
            <Kosong judul="Tidak ditemukan" pesan="Coba ejaan lain atau pilih tahun." />
          ) : (
            <Kartu className="overflow-hidden">
              <ul className="grid divide-y divide-slate-100 sm:grid-cols-2 sm:divide-y-0">
                {daftar.map((a, i) => (
                  <li key={`${a.nama}-${i}`} className="flex items-center justify-between gap-3 border-slate-100 px-5 py-3 sm:border-b">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-900">{a.nama}</p>
                      <p className="text-xs text-slate-500">
                        {[a.angkatan && `Angkatan ${a.angkatan}`, s.q && a.tahun_lulus && `Lulus ${a.tahun_lulus}`, a.keterangan].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    {a.bergabung ? <Lencana warna="hijau">✓ Bergabung</Lencana> : <span className="text-xs text-slate-400">Belum bergabung</span>}
                  </li>
                ))}
              </ul>
            </Kartu>
          )}
          <p className="mt-4 text-sm text-slate-500">
            Kenal teman yang belum bergabung? Ajak mereka mendaftar di <strong>/daftar</strong> supaya jejaring alumni makin lengkap.
            Menemukan data yang keliru? Kabari pengurus lewat <Link href="/kontak" className="underline">Kontak</Link>.
          </p>
        </>
      )}
    </div>
  );
}
