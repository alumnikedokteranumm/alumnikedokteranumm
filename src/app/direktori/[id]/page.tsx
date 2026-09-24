import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { buatKlienServer } from "@/lib/supabase/server";
import { tautanFoto } from "@/lib/sesi";
import { Avatar } from "@/components/avatar";
import { Kartu, Lencana } from "@/components/ui/dasar";
import { LABEL_PROFESI } from "@/lib/konstanta";
import type { DetailAlumni } from "@/lib/tipe";

export const metadata: Metadata = { title: "Profil Alumni", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const BULAN = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];

export default async function DetailAlumniPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const supabase = await buatKlienServer();
  const { data } = await supabase.rpc("detail_alumni", { target: id });
  const a = (data as DetailAlumni[] | null)?.[0];
  if (!a) notFound();

  const foto = await tautanFoto(a.foto_path);
  const wa = a.whatsapp?.replace(/\D/g, "").replace(/^0/, "62");
  const ultah = a.ulang_tahun ? (() => {
    const [h, b] = a.ulang_tahun!.split("-").map(Number);
    return `${h} ${BULAN[b - 1]}`;
  })() : null;

  const kontak = [
    a.email_kontak && { label: "Email", nilai: a.email_kontak, href: `mailto:${a.email_kontak}` },
    wa && { label: "WhatsApp", nilai: a.whatsapp!, href: `https://wa.me/${wa}` },
    a.no_hp && { label: "Telepon", nilai: a.no_hp, href: `tel:${a.no_hp}` },
    a.linkedin && { label: "LinkedIn", nilai: "Lihat profil", href: a.linkedin },
    a.instagram && { label: "Instagram", nilai: `@${a.instagram}`, href: `https://instagram.com/${a.instagram}` },
    a.situs_web && { label: "Situs web", nilai: a.situs_web.replace(/^https?:\/\//, ""), href: a.situs_web },
  ].filter(Boolean) as { label: string; nilai: string; href: string }[];

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <Link href="/direktori" className="text-sm text-slate-500 hover:text-merek-700">← Kembali ke direktori</Link>

      <Kartu className="mt-5 overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-merek-800 to-merek-600" />
        <div className="px-6 pb-8 sm:px-8">
          <div className="-mt-12 flex flex-wrap items-end gap-5">
            <div className="rounded-full bg-white p-1.5">
              <Avatar nama={a.nama_tampil} url={foto} ukuran="size-24" teks="text-2xl" />
            </div>
            <div className="pb-1">
              <h1 className="font-serif text-2xl font-bold text-slate-900">{a.nama_tampil}</h1>
              <p className="text-sm text-slate-500">
                Angkatan {a.angkatan ?? "—"}{a.tahun_lulus ? ` · Lulus ${a.tahun_lulus}` : ""}{a.nim ? ` · NIM ${a.nim}` : ""}
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {a.status_profesi && <Lencana warna="hijau">{LABEL_PROFESI[a.status_profesi]}</Lencana>}
            {a.spesialisasi && <Lencana warna="biru">{a.spesialisasi}</Lencana>}
            {a.subspesialisasi && <Lencana warna="biru">{a.subspesialisasi}</Lencana>}
            {a.anggota_idi && <Lencana warna="emas">Anggota IDI{a.cabang_idi ? ` · ${a.cabang_idi}` : ""}</Lencana>}
            {ultah && <Lencana>🎂 {ultah}</Lencana>}
          </div>

          {a.bio && <p className="mt-6 whitespace-pre-line leading-relaxed text-slate-700">{a.bio}</p>}

          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Praktik & domisili</h2>
              <dl className="mt-3 space-y-3 text-sm">
                {a.tempat_kerja && <div><dt className="text-slate-500">Tempat kerja</dt><dd className="font-medium text-slate-800">{a.tempat_kerja}{a.jabatan ? ` — ${a.jabatan}` : ""}</dd></div>}
                {a.kota_kerja && <div><dt className="text-slate-500">Kota praktik</dt><dd className="font-medium text-slate-800">{a.kota_kerja}{a.provinsi_kerja ? `, ${a.provinsi_kerja}` : ""}</dd></div>}
                {a.kota && <div><dt className="text-slate-500">Domisili</dt><dd className="font-medium text-slate-800">{a.kota}{a.provinsi ? `, ${a.provinsi}` : ""}</dd></div>}
                {a.alamat && <div><dt className="text-slate-500">Alamat</dt><dd className="text-slate-800">{a.alamat}</dd></div>}
                {!a.tempat_kerja && !a.kota_kerja && !a.kota && <p className="text-slate-400">Tidak ada informasi yang dibagikan.</p>}
              </dl>
            </section>

            <section>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Kontak</h2>
              {kontak.length ? (
                <ul className="mt-3 space-y-2">
                  {kontak.map((k) => (
                    <li key={k.label}>
                      <a href={k.href} target={k.href.startsWith("http") ? "_blank" : undefined} rel="noreferrer noopener"
                        className="flex items-center justify-between rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm hover:border-merek-300 hover:bg-merek-50/40">
                        <span className="text-slate-500">{k.label}</span>
                        <span className="truncate pl-3 font-medium text-merek-700">{k.nilai}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm leading-relaxed text-slate-400">
                  Alumni ini memilih tidak membagikan kontak. Kamu bisa menghubungi melalui pengurus.
                </p>
              )}
            </section>
          </div>
        </div>
      </Kartu>
    </div>
  );
}
