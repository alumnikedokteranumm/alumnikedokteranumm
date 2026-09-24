import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ambilSatuVideo, ambilVideo } from "@/lib/data";
import { Markdown } from "@/lib/markdown";
import { Lencana, Pesan } from "@/components/ui/dasar";
import { gambarMiniYoutube, idYoutube, sematanYoutube } from "@/lib/youtube";
import { tanggal } from "@/lib/format";

export const metadata: Metadata = { title: "Video Edukasi", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function PutarVideo({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const v = await ambilSatuVideo(id);
  if (!v) notFound();

  const idYt = idYoutube(v.url_video);
  const lain = (await ambilVideo()).filter((x) => x.id !== v.id)
    .sort((a, b) => Number(b.kategori === v.kategori) - Number(a.kategori === v.kategori))
    .slice(0, 6);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Link href="/video" className="text-sm text-slate-500 hover:text-merek-700">← Semua video</Link>

      <div className="mt-4 grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0">
          <div className="aspect-video overflow-hidden rounded-xl bg-black shadow-sm">
            {idYt ? (
              <iframe
                src={sematanYoutube(idYt)}
                title={v.judul}
                className="size-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            ) : (
              <div className="grid size-full place-items-center p-6 text-center text-sm text-slate-300">
                Tautan video tidak valid. Hubungi pengurus.
              </div>
            )}
          </div>

          <div className="mt-5 flex flex-wrap gap-1.5">
            {v.kategori && <Lencana warna="biru">{v.kategori}</Lencana>}
          </div>
          <h1 className="mt-2 font-serif text-2xl font-bold leading-snug text-slate-900 sm:text-3xl">{v.judul}</h1>
          <p className="mt-2 text-sm text-slate-500">
            {[v.pembicara && `Narasumber: ${v.pembicara}`, v.tanggal && tanggal(v.tanggal), v.durasi].filter(Boolean).join(" · ")}
          </p>

          {v.deskripsi?.trim() && <div className="mt-4 border-t border-slate-200 pt-2"><Markdown teks={v.deskripsi} /></div>}

          <div className="mt-8">
            <Pesan jenis="ingat">Khusus komunitas alumni. Mohon tidak merekam ulang atau menyebarkan video ini tanpa izin.</Pesan>
          </div>
        </div>

        {lain.length > 0 && (
          <aside>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Video lainnya</h2>
            <ul className="mt-4 space-y-4">
              {lain.map((x) => {
                const idX = idYoutube(x.url_video);
                return (
                  <li key={x.id}>
                    <Link href={`/video/${x.id}`} className="group flex gap-3">
                      <div className="aspect-video w-36 shrink-0 overflow-hidden rounded-lg bg-merek-900">
                        {idX && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={gambarMiniYoutube(idX)} alt="" loading="lazy" className="size-full object-cover" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="line-clamp-2 text-sm font-medium leading-snug text-slate-800 group-hover:text-merek-700">{x.judul}</p>
                        <p className="mt-1 truncate text-xs text-slate-500">{x.pembicara ?? x.kategori}</p>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </aside>
        )}
      </div>
    </div>
  );
}
