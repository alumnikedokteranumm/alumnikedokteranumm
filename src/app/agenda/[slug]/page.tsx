import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ambilSatuAcara } from "@/lib/data";
import { Markdown } from "@/lib/markdown";
import { Kartu, Lencana, TautanTombol } from "@/components/ui/dasar";
import { tanggalJam } from "@/lib/format";
import type { AcaraWebinar } from "@/lib/tipe";

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const a = await ambilSatuAcara((await params).slug);
  return a ? { title: a.judul, description: a.deskripsi?.slice(0, 160) } : { title: "Agenda tidak ditemukan" };
}

/** Tautan "Tambahkan ke Google Calendar" */
function tautanKalender(judul: string, mulai: string, selesai: string | null, lokasi: string | null) {
  const f = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const akhir = selesai ?? new Date(new Date(mulai).getTime() + 2 * 3600_000).toISOString();
  const p = new URLSearchParams({ action: "TEMPLATE", text: judul, dates: `${f(mulai)}/${f(akhir)}`, location: lokasi ?? "" });
  return `https://calendar.google.com/calendar/render?${p}`;
}

export default async function DetailAgenda({ params }: { params: Promise<{ slug: string }> }) {
  const a = await ambilSatuAcara((await params).slug);
  if (!a || !a.terbit) notFound();
  const sudahLewat = new Date(a.selesai ?? a.mulai) < new Date();

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <Link href="/agenda" className="text-sm text-slate-500 hover:text-merek-700">← Semua agenda</Link>
      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div>
          <div className="flex flex-wrap gap-1.5">
            <Lencana warna="hijau">{a.jenis}</Lencana>
            {a.daring && <Lencana warna="biru">Daring</Lencana>}
            {a.skp_idi && <Lencana warna="emas">{a.skp_idi} SKP</Lencana>}
            {sudahLewat && <Lencana>Sudah berlangsung</Lencana>}
          </div>
          <h1 className="mt-4 font-serif text-3xl font-bold leading-tight text-slate-900 sm:text-4xl">{a.judul}</h1>
          {a.poster_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={a.poster_url} alt={`Poster ${a.judul}`} className="mt-8 w-full rounded-xl border border-slate-200" />
          )}
          <div className="mt-6"><Markdown teks={a.deskripsi ?? ""} /></div>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <Kartu className="p-6">
            <dl className="space-y-4 text-sm">
              <div><dt className="text-slate-500">Mulai</dt><dd className="mt-0.5 font-medium text-slate-900">{tanggalJam(a.mulai)}</dd></div>
              {a.selesai && <div><dt className="text-slate-500">Selesai</dt><dd className="mt-0.5 font-medium text-slate-900">{tanggalJam(a.selesai)}</dd></div>}
              <div><dt className="text-slate-500">Tempat</dt><dd className="mt-0.5 font-medium text-slate-900">{a.lokasi || "—"}</dd></div>
              {a.biaya && <div><dt className="text-slate-500">Biaya</dt><dd className="mt-0.5 font-medium text-slate-900">{a.biaya}</dd></div>}
              {a.kuota && <div><dt className="text-slate-500">Kuota</dt><dd className="mt-0.5 font-medium text-slate-900">{a.kuota} peserta</dd></div>}
            </dl>
            {!sudahLewat && (
              <div className="mt-6 space-y-2">
                {(a as AcaraWebinar).pendaftaran_web ? (
                  <TautanTombol href={`/skp/${a.id}`} className="w-full">Daftar di website →</TautanTombol>
                ) : a.link_pendaftaran && (
                  <TautanTombol href={a.link_pendaftaran} target="_blank" rel="noreferrer noopener" className="w-full">Daftar Sekarang ↗</TautanTombol>
                )}
                <TautanTombol href={tautanKalender(a.judul, a.mulai, a.selesai, a.lokasi)} target="_blank" rel="noreferrer noopener" varian="garis" className="w-full">
                  + Google Calendar
                </TautanTombol>
              </div>
            )}
            {sudahLewat && (a as AcaraWebinar).pendaftaran_web && (
              <TautanTombol href={`/skp/${a.id}`} varian="halus" className="mt-6 w-full">Ruang peserta & sertifikat →</TautanTombol>
            )}
          </Kartu>
        </aside>
      </div>
    </div>
  );
}
