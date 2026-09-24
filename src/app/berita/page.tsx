import type { Metadata } from "next";
import Link from "next/link";
import { ambilBerita } from "@/lib/data";
import { JudulHalaman, Kosong, Lencana } from "@/components/ui/dasar";
import { tanggal } from "@/lib/format";
import { KATEGORI_BERITA } from "@/lib/konstanta";

export const metadata: Metadata = { title: "Berita & Artikel", description: "Kabar terbaru dari Alumni Kedokteran UMM." };
export const revalidate = 300;

export default async function DaftarBerita({ searchParams }: { searchParams: Promise<{ kategori?: string }> }) {
  const { kategori } = await searchParams;
  const semua = await ambilBerita();
  const daftar = kategori ? semua.filter((b) => b.kategori === kategori) : semua;
  const [utama, ...sisa] = daftar;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <JudulHalaman atas="Kabar almamater" judul="Berita & Artikel"
        deskripsi="Pengumuman resmi, liputan kegiatan, prestasi alumni, dan tulisan ilmiah populer." />

      <div className="mb-8 flex flex-wrap gap-2">
        <Link href="/berita" className={`rounded-full px-3.5 py-1.5 text-sm ${!kategori ? "bg-merek-700 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"}`}>Semua</Link>
        {KATEGORI_BERITA.map((k) => (
          <Link key={k} href={`/berita?kategori=${encodeURIComponent(k)}`}
            className={`rounded-full px-3.5 py-1.5 text-sm ${kategori === k ? "bg-merek-700 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"}`}>
            {k}
          </Link>
        ))}
      </div>

      {!utama ? (
        <Kosong judul="Belum ada berita" pesan="Pengurus belum menerbitkan berita di kategori ini." />
      ) : (
        <>
          <Link href={`/berita/${utama.slug}`} className="group mb-12 grid overflow-hidden rounded-2xl border border-slate-200 bg-white md:grid-cols-2">
            <div className="aspect-[16/10] bg-gradient-to-br from-merek-700 to-merek-900 md:aspect-auto">
              {utama.sampul_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={utama.sampul_url} alt="" className="size-full object-cover" />
              )}
            </div>
            <div className="p-8">
              <Lencana warna="hijau">{utama.kategori}</Lencana>
              <h2 className="mt-4 font-serif text-2xl font-bold leading-snug text-slate-900 group-hover:text-merek-700">{utama.judul}</h2>
              <p className="mt-3 leading-relaxed text-slate-600">{utama.ringkasan}</p>
              <p className="mt-5 text-sm text-slate-400">{tanggal(utama.terbit_pada)}</p>
            </div>
          </Link>

          <div className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {sisa.map((b) => (
              <Link key={b.id} href={`/berita/${b.slug}`} className="group">
                <article>
                  <div className="aspect-[16/10] overflow-hidden rounded-xl bg-gradient-to-br from-merek-100 to-merek-50">
                    {b.sampul_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={b.sampul_url} alt="" loading="lazy" className="size-full object-cover transition-transform group-hover:scale-[1.03]" />
                    )}
                  </div>
                  <p className="mt-4 text-xs font-medium uppercase tracking-wider text-merek-600">{b.kategori}</p>
                  <h3 className="mt-1.5 font-serif text-lg font-bold leading-snug text-slate-900 group-hover:text-merek-700">{b.judul}</h3>
                  <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-600">{b.ringkasan}</p>
                  <p className="mt-3 text-xs text-slate-400">{tanggal(b.terbit_pada)}</p>
                </article>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
