import type { Metadata } from "next";
import Link from "next/link";
import { ambilVideo } from "@/lib/data";
import { Isian, JudulHalaman, Kosong, Lencana, Pesan, Tombol } from "@/components/ui/dasar";
import { KATEGORI_VIDEO } from "@/lib/konstanta";
import { gambarMiniYoutube, idYoutube } from "@/lib/youtube";
import { tanggal } from "@/lib/format";

export const metadata: Metadata = { title: "Video Edukasi", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function DaftarVideo({
  searchParams,
}: { searchParams: Promise<{ kategori?: string; q?: string }> }) {
  const { kategori, q } = await searchParams;
  const semua = await ambilVideo();
  const kata = q?.trim().toLowerCase();
  const daftar = semua.filter((v) =>
    (!kategori || v.kategori === kategori) &&
    (!kata || `${v.judul} ${v.pembicara ?? ""} ${v.deskripsi ?? ""}`.toLowerCase().includes(kata)));

  const chip = (aktif: boolean) =>
    `rounded-full px-3.5 py-1.5 text-sm ${aktif ? "bg-merek-700 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"}`;
  const tautan = (k?: string) => {
    const p = new URLSearchParams();
    if (k) p.set("kategori", k);
    if (q) p.set("q", q);
    const qs = p.toString();
    return `/video${qs ? `?${qs}` : ""}`;
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <JudulHalaman
        atas="Khusus alumni terverifikasi"
        judul="Video Edukasi"
        deskripsi="Rekaman webinar, kuliah tamu, dan materi keterampilan klinis dari sejawat dan narasumber pilihan."
      />

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Link href={tautan()} className={chip(!kategori)}>Semua ({semua.length})</Link>
        {KATEGORI_VIDEO.map((k) => {
          const n = semua.filter((v) => v.kategori === k).length;
          return n ? <Link key={k} href={tautan(k)} className={chip(kategori === k)}>{k} ({n})</Link> : null;
        })}
        <form className="ml-auto flex gap-2">
          {kategori && <input type="hidden" name="kategori" value={kategori} />}
          <Isian name="q" type="search" defaultValue={q} placeholder="Cari judul / pembicara" className="w-56 py-2" />
          <Tombol type="submit" varian="garis" className="py-2">Cari</Tombol>
        </form>
      </div>

      {!daftar.length ? (
        <Kosong
          judul={semua.length ? "Tidak ada video yang cocok" : "Belum ada video"}
          pesan={semua.length ? "Coba kata kunci atau kategori lain." : "Rekaman kegiatan ilmiah akan diunggah pengurus ke sini."}
        />
      ) : (
        <div className="grid gap-x-6 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
          {daftar.map((v) => {
            const idYt = idYoutube(v.url_video);
            return (
              <Link key={v.id} href={`/video/${v.id}`} className="group">
                <div className="relative aspect-video overflow-hidden rounded-xl bg-merek-900">
                  {idYt && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={gambarMiniYoutube(idYt)} alt="" loading="lazy"
                      className="size-full object-cover transition-transform duration-300 group-hover:scale-105" />
                  )}
                  <span className="absolute inset-0 grid place-items-center bg-black/10 transition-colors group-hover:bg-black/25">
                    <span className="grid size-14 place-items-center rounded-full bg-white/95 shadow-lg transition-transform group-hover:scale-110">
                      <svg viewBox="0 0 24 24" className="ml-1 size-6 text-merek-800" fill="currentColor" aria-hidden><path d="M8 5v14l11-7z" /></svg>
                    </span>
                  </span>
                  {v.durasi && (
                    <span className="absolute bottom-2 right-2 rounded bg-black/75 px-1.5 py-0.5 text-xs font-medium text-white">{v.durasi}</span>
                  )}
                </div>
                <div className="mt-3">
                  {v.kategori && <Lencana warna="biru">{v.kategori}</Lencana>}
                  <h2 className="mt-2 font-semibold leading-snug text-slate-900 group-hover:text-merek-700">{v.judul}</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {[v.pembicara, v.tanggal && tanggal(v.tanggal)].filter(Boolean).join(" · ")}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <div className="mt-12">
        <Pesan jenis="ingat">
          Materi ini disediakan khusus untuk komunitas alumni. Mohon tidak menyebarkan tautan video ke luar komunitas
          tanpa izin pengurus dan narasumber.
        </Pesan>
      </div>
    </div>
  );
}
