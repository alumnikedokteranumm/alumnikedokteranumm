import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ambilSatuAlbum } from "@/lib/data";
import { Kosong } from "@/components/ui/dasar";
import { tanggal } from "@/lib/format";

export const revalidate = 600;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const h = await ambilSatuAlbum((await params).slug);
  return { title: h?.album.judul ?? "Album" };
}

export default async function Album({ params }: { params: Promise<{ slug: string }> }) {
  const h = await ambilSatuAlbum((await params).slug);
  if (!h || !h.album.terbit) notFound();
  const { album, foto } = h;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <Link href="/galeri" className="text-sm text-slate-500 hover:text-merek-700">← Semua album</Link>
      <h1 className="mt-5 font-serif text-3xl font-bold text-slate-900">{album.judul}</h1>
      <p className="mt-1.5 text-sm text-slate-500">{album.tanggal ? tanggal(album.tanggal) : ""}{foto.length ? ` · ${foto.length} foto` : ""}</p>
      {album.deskripsi && <p className="mt-4 max-w-3xl leading-relaxed text-slate-600">{album.deskripsi}</p>}

      {!foto.length ? (
        <div className="mt-8"><Kosong judul="Belum ada foto" pesan="Foto untuk album ini belum diunggah." /></div>
      ) : (
        <div className="mt-8 columns-1 gap-4 sm:columns-2 lg:columns-3">
          {foto.map((f) => (
            <a key={f.id} href={f.url} target="_blank" rel="noreferrer" className="mb-4 block break-inside-avoid overflow-hidden rounded-xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={f.url} alt={f.keterangan ?? ""} loading="lazy" className="w-full transition-opacity hover:opacity-90" />
              {f.keterangan && <p className="bg-white px-3 py-2 text-sm text-slate-600">{f.keterangan}</p>}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
