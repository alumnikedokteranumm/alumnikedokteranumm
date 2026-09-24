import type { Metadata } from "next";
import { buatKlienServer } from "@/lib/supabase/server";
import { Isian, JudulHalaman, Kosong, Lencana, Tombol } from "@/components/ui/dasar";
import { KATEGORI_PUSTAKA } from "@/lib/konstanta";
import type { Pustaka } from "@/lib/tipe";

export const metadata: Metadata = { title: "Perpustakaan Digital", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function Perpustakaan({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const supabase = await buatKlienServer();
  const { data } = await supabase.from("pustaka").select("*").eq("terbit", true).order("urutan").order("judul");
  const semua = (data ?? []) as Pustaka[];
  const kata = q?.trim().toLowerCase();
  const daftar = kata
    ? semua.filter((p) => `${p.judul} ${p.penyedia ?? ""} ${p.deskripsi ?? ""} ${p.kategori ?? ""}`.toLowerCase().includes(kata))
    : semua;
  const urutan = [...new Set([...KATEGORI_PUSTAKA, ...daftar.map((p) => p.kategori ?? "Lainnya")])];
  const grup = urutan.map((k) => ({ k, isi: daftar.filter((p) => (p.kategori ?? "Lainnya") === k) })).filter((g) => g.isi.length);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <JudulHalaman atas="Khusus alumni terverifikasi" judul="Perpustakaan Digital"
        deskripsi="Sumber rujukan klinis dan ilmiah pilihan pengurus — jurnal, pedoman, database, dan alat bantu klinis. Sebagian besar gratis dan bisa diakses dari mana saja." />

      <form className="mb-8 flex gap-2">
        <Isian name="q" type="search" defaultValue={q} placeholder="Cari sumber: pedoman, jurnal, kalkulator…" className="max-w-md" />
        <Tombol type="submit" varian="garis">Cari</Tombol>
      </form>

      {!grup.length ? (
        <Kosong judul={semua.length ? "Tidak ada yang cocok" : "Perpustakaan masih kosong"}
          pesan={semua.length ? "Coba kata kunci lain." : "Pengurus akan menambahkan sumber rujukan ke sini."} />
      ) : (
        <div className="space-y-10">
          {grup.map((g) => (
            <section key={g.k}>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">{g.k}</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {g.isi.map((p) => (
                  <a key={p.id} href={p.url} target="_blank" rel="noreferrer noopener"
                    className="group flex flex-col rounded-xl border border-slate-200 bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-merek-300 hover:shadow-md">
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-semibold text-slate-900 group-hover:text-merek-700">{p.judul} <span aria-hidden className="text-slate-400">↗</span></p>
                      {p.akses && <Lencana warna={p.akses === "Gratis" ? "hijau" : "netral"}>{p.akses}</Lencana>}
                    </div>
                    {p.penyedia && <p className="mt-0.5 text-xs text-slate-500">{p.penyedia}</p>}
                    {p.deskripsi && <p className="mt-2 text-sm leading-relaxed text-slate-600">{p.deskripsi}</p>}
                  </a>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
