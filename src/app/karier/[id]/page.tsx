import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ambilSatuLowongan } from "@/lib/data";
import { Markdown } from "@/lib/markdown";
import { Kartu, Lencana, TautanTombol } from "@/components/ui/dasar";
import { tanggal } from "@/lib/format";

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const l = await ambilSatuLowongan((await params).id);
  return l ? { title: `${l.judul} — ${l.institusi}` } : { title: "Lowongan" };
}

export default async function DetailLowongan({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const l = await ambilSatuLowongan(id);
  if (!l || !l.terbit) notFound();
  const syarat = (l.kualifikasi ?? "").split(/[;\n]/).map((s) => s.trim()).filter(Boolean);
  const kontakEmail = l.kontak && /^[^@\s]+@[^@\s]+$/.test(l.kontak);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <Link href="/karier" className="text-sm text-slate-500 hover:text-merek-700">← Semua lowongan</Link>
      <div className="mt-6 flex flex-wrap gap-1.5">
        <Lencana warna={l.jenis === "Beasiswa" ? "emas" : "hijau"}>{l.jenis}</Lencana>
        {l.tipe_kerja && <Lencana>{l.tipe_kerja}</Lencana>}
      </div>
      <h1 className="mt-3 font-serif text-3xl font-bold text-slate-900">{l.judul}</h1>
      <p className="mt-2 text-lg text-slate-600">{l.institusi}{l.lokasi ? ` · ${l.lokasi}` : ""}</p>

      <div className="mt-8 grid gap-8 md:grid-cols-[1fr_260px]">
        <div>
          <Markdown teks={l.deskripsi} />
          {syarat.length > 0 && (
            <>
              <h2 className="mt-8 text-lg font-bold text-slate-900">Kualifikasi</h2>
              <ul className="mt-3 space-y-2">
                {syarat.map((s) => (
                  <li key={s} className="flex gap-3 text-slate-700"><span className="text-merek-600">✓</span>{s}</li>
                ))}
              </ul>
            </>
          )}
        </div>
        <Kartu className="h-fit p-5">
          <dl className="space-y-3 text-sm">
            {l.batas_lamar && <div><dt className="text-slate-500">Batas pendaftaran</dt><dd className="font-medium">{tanggal(l.batas_lamar)}</dd></div>}
            {l.kontak && <div><dt className="text-slate-500">Kontak</dt><dd className="break-words font-medium">{l.kontak}</dd></div>}
            <div><dt className="text-slate-500">Diunggah</dt><dd className="font-medium">{tanggal(l.dibuat_pada)}</dd></div>
          </dl>
          <div className="mt-5 space-y-2">
            {l.tautan && <TautanTombol href={l.tautan} target="_blank" rel="noreferrer noopener" className="w-full">Lamar / Info Lengkap ↗</TautanTombol>}
            {kontakEmail && <TautanTombol href={`mailto:${l.kontak}?subject=${encodeURIComponent("Lamaran: " + l.judul)}`} varian="garis" className="w-full">Kirim Email</TautanTombol>}
          </div>
        </Kartu>
      </div>
    </div>
  );
}
