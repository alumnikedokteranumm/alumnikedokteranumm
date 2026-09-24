import type { Metadata } from "next";
import Image from "next/image";
import { ambilPengaturan } from "@/lib/sesi";
import { ambilPengurus, ambilStatistik } from "@/lib/data";
import { StrukturPengurus } from "@/components/struktur-pengurus";
import { Kartu, TautanTombol } from "@/components/ui/dasar";
import { LABEL_PROFESI } from "@/lib/konstanta";
import { angka } from "@/lib/format";
import type { StatusProfesi } from "@/lib/tipe";

export const metadata: Metadata = {
  title: "Tentang Kami",
  description: "Sejarah, visi, misi, dan struktur pengurus Alumni Kedokteran UMM.",
};
export const revalidate = 600;

export default async function Tentang() {
  const [p, pengurus, stat] = await Promise.all([ambilPengaturan(), ambilPengurus(), ambilStatistik()]);
  const misi = (p.tentang_misi || "").split(";").map((m) => m.trim()).filter(Boolean);
  const maksProv = Math.max(1, ...stat.sebaran_provinsi.map((x) => x.jumlah));

  return (
    <>
      <section className="pola-hero bg-merek-900 py-20 text-white">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <Image src="/logo-512.png" alt="Lambang Alumni Kedokteran UMM" width={512} height={512} priority
            className="mx-auto mb-8 size-36 drop-shadow-[0_16px_32px_rgba(0,0,0,0.35)] sm:size-44" />
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emas-400">Tentang Kami</p>
          <h1 className="mt-4 font-serif text-4xl font-bold leading-tight sm:text-5xl">
            {p.nama_organisasi || "Alumni Kedokteran UMM"}
          </h1>
          {p.tagline && <p className="mx-auto mt-5 max-w-2xl text-lg text-merek-100">{p.tagline}</p>}
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        {p.tentang_sejarah && (
          <section className="mx-auto max-w-3xl">
            <h2 className="font-serif text-2xl font-bold text-slate-900">Sejarah singkat</h2>
            <p className="mt-4 whitespace-pre-line text-[17px] leading-[1.85] text-slate-700">{p.tentang_sejarah}</p>
          </section>
        )}

        <section id="visi-misi" className="mt-16 scroll-mt-24 grid gap-6 md:grid-cols-[1fr_1.4fr]">
          <Kartu className="bg-merek-50/50 p-7">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-merek-600">Visi</p>
            <p className="mt-3 font-serif text-xl leading-relaxed text-slate-800">{p.tentang_visi || "—"}</p>
          </Kartu>
          <Kartu className="p-7">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-merek-600">Misi</p>
            <ol className="mt-4 space-y-3">
              {misi.map((m, i) => (
                <li key={i} className="flex gap-3.5 text-slate-700">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-merek-700 text-xs font-bold text-white">{i + 1}</span>
                  <span className="leading-relaxed">{m}</span>
                </li>
              ))}
            </ol>
          </Kartu>
        </section>

        {stat.total_alumni > 0 && (
          <section className="mt-16">
            <h2 className="font-serif text-2xl font-bold text-slate-900">Alumni dalam angka</h2>
            <p className="mt-2 text-sm text-slate-500">Dihitung dari {angka(stat.total_alumni)} profil terverifikasi. Kelompok berisi kurang dari 3 orang tidak ditampilkan untuk melindungi identitas.</p>
            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <Kartu className="p-6">
                <h3 className="text-sm font-semibold text-slate-900">Sebaran provinsi tempat mengabdi</h3>
                <ul className="mt-4 space-y-2.5">
                  {stat.sebaran_provinsi.map((x) => (
                    <li key={x.provinsi} className="text-sm">
                      <div className="flex justify-between text-slate-700"><span>{x.provinsi}</span><span className="font-medium">{angka(x.jumlah)}</span></div>
                      <div className="mt-1 h-1.5 rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-merek-500" style={{ width: `${(x.jumlah / maksProv) * 100}%` }} />
                      </div>
                    </li>
                  ))}
                  {!stat.sebaran_provinsi.length && <li className="text-sm text-slate-400">Data belum cukup.</li>}
                </ul>
              </Kartu>
              <Kartu className="p-6">
                <h3 className="text-sm font-semibold text-slate-900">Jalur karier alumni</h3>
                <ul className="mt-4 divide-y divide-slate-100">
                  {stat.sebaran_profesi.map((x) => (
                    <li key={x.status} className="flex justify-between py-2 text-sm">
                      <span className="text-slate-700">{LABEL_PROFESI[x.status as StatusProfesi] ?? x.status}</span>
                      <span className="font-medium text-slate-900">{angka(x.jumlah)}</span>
                    </li>
                  ))}
                  {!stat.sebaran_profesi.length && <li className="py-2 text-sm text-slate-400">Data belum cukup.</li>}
                </ul>
              </Kartu>
            </div>
          </section>
        )}

        <section id="pengurus" className="mt-16 scroll-mt-24">
          <h2 className="font-serif text-2xl font-bold text-slate-900">Struktur Pengurus</h2>
          {pengurus[0]?.periode && <p className="mt-1 text-sm text-slate-500">Periode {pengurus[0].periode}</p>}
          <div className="mt-8"><StrukturPengurus daftar={pengurus} /></div>
        </section>

        <section className="mt-16 rounded-2xl bg-slate-900 px-8 py-12 text-center text-white">
          <h2 className="font-serif text-2xl font-bold">Ingin terlibat sebagai pengurus atau relawan?</h2>
          <p className="mx-auto mt-3 max-w-xl text-slate-300">Kami selalu membuka ruang bagi alumni yang ingin berkontribusi — di bidang ilmiah, sosial, maupun digital.</p>
          <TautanTombol href="/kontak" varian="kedua" className="mt-6">Hubungi Sekretariat</TautanTombol>
        </section>
      </div>
    </>
  );
}
