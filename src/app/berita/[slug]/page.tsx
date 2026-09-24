import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ambilBerita, ambilSatuBerita } from "@/lib/data";
import { Markdown } from "@/lib/markdown";
import { Lencana } from "@/components/ui/dasar";
import { tanggal } from "@/lib/format";

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const b = await ambilSatuBerita((await params).slug);
  if (!b) return { title: "Berita tidak ditemukan" };
  return {
    title: b.judul,
    description: b.ringkasan ?? undefined,
    openGraph: { title: b.judul, description: b.ringkasan ?? undefined, images: b.sampul_url ? [b.sampul_url] : [], type: "article" },
  };
}

export default async function BacaBerita({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const b = await ambilSatuBerita(slug);
  if (!b || !b.terbit) notFound();
  const lain = (await ambilBerita(4)).filter((x) => x.id !== b.id).slice(0, 3);
  const menitBaca = Math.max(1, Math.round(b.konten.split(/\s+/).length / 200));

  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <Link href="/berita" className="text-sm text-slate-500 hover:text-merek-700">← Semua berita</Link>
      <header className="mt-6">
        <Lencana warna="hijau">{b.kategori}</Lencana>
        <h1 className="mt-4 font-serif text-3xl font-bold leading-tight text-slate-900 sm:text-4xl">{b.judul}</h1>
        {b.ringkasan && <p className="mt-4 text-lg leading-relaxed text-slate-600">{b.ringkasan}</p>}
        <p className="mt-5 text-sm text-slate-400">{tanggal(b.terbit_pada)} · {menitBaca} menit membaca</p>
      </header>

      {b.sampul_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={b.sampul_url} alt="" className="mt-8 aspect-[16/9] w-full rounded-2xl object-cover" />
      )}

      <div className="mt-8 border-t border-slate-200 pt-4">
        <Markdown teks={b.konten} />
      </div>

      {lain.length > 0 && (
        <aside className="mt-16 border-t border-slate-200 pt-8">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Baca juga</h2>
          <ul className="mt-4 divide-y divide-slate-100">
            {lain.map((x) => (
              <li key={x.id}>
                <Link href={`/berita/${x.slug}`} className="group block py-4">
                  <p className="font-semibold text-slate-900 group-hover:text-merek-700">{x.judul}</p>
                  <p className="mt-1 text-xs text-slate-400">{tanggal(x.terbit_pada)}</p>
                </Link>
              </li>
            ))}
          </ul>
        </aside>
      )}
    </article>
  );
}
