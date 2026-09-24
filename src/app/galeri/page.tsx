import type { Metadata } from "next";
import Link from "next/link";
import { ambilAlbum } from "@/lib/data";
import { JudulHalaman, Kosong } from "@/components/ui/dasar";
import { tanggal } from "@/lib/format";

export const metadata: Metadata = { title: "Galeri Kegiatan", description: "Dokumentasi kegiatan Alumni Kedokteran UMM." };
export const revalidate = 600;

export default async function Galeri() {
  const album = await ambilAlbum();
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <JudulHalaman atas="Dokumentasi" judul="Galeri Kegiatan" deskripsi="Momen reuni, kegiatan ilmiah, dan bakti sosial alumni FK UMM." />
      {!album.length ? (
        <Kosong judul="Galeri masih kosong" pesan="Album foto akan muncul di sini setelah pengurus mengunggahnya." />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {album.map((a) => (
            <Link key={a.id} href={`/galeri/${a.slug}`} className="group">
              <div className="aspect-[4/3] overflow-hidden rounded-xl bg-gradient-to-br from-merek-100 to-slate-100">
                {a.sampul_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={a.sampul_url} alt="" loading="lazy" className="size-full object-cover transition-transform duration-300 group-hover:scale-105" />
                )}
              </div>
              <h2 className="mt-3 font-semibold text-slate-900 group-hover:text-merek-700">{a.judul}</h2>
              {a.tanggal && <p className="mt-0.5 text-sm text-slate-500">{tanggal(a.tanggal)}</p>}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
