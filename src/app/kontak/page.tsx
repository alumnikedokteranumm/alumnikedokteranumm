import type { Metadata } from "next";
import { ambilPengaturan } from "@/lib/sesi";
import { JudulHalaman, Kartu } from "@/components/ui/dasar";
import { DAFTAR_SOSMED, IkonSosmed, tautanSosmed } from "@/components/sosmed";

export const metadata: Metadata = { title: "Kontak", description: "Hubungi sekretariat Alumni Kedokteran UMM." };
export const revalidate = 600;

export default async function Kontak() {
  const p = await ambilPengaturan();
  const wa = p.whatsapp?.replace(/\D/g, "").replace(/^0/, "62");

  const saluran = [
    p.email && { judul: "Email", isi: p.email, href: `mailto:${p.email}`, ket: "Dibalas dalam 1–3 hari kerja" },
    p.email_kampus && { judul: "Email resmi kampus", isi: p.email_kampus, href: `mailto:${p.email_kampus}`, ket: "Untuk surat-menyurat resmi" },
    wa && { judul: "WhatsApp", isi: p.whatsapp, href: `https://wa.me/${wa}`, ket: "Senin–Jumat, 08.00–16.00 WIB" },
    p.telepon && { judul: "Telepon", isi: p.telepon, href: `tel:${p.telepon.replace(/[^\d+]/g, "")}`, ket: "Jam kerja kampus" },
  ].filter(Boolean) as { judul: string; isi: string; href: string; ket: string }[];

  const sosmed = DAFTAR_SOSMED
    .map((s) => ({ ...s, url: tautanSosmed(s, p[s.kunci]), akun: (p[s.kunci] ?? "").trim() }))
    .filter((s) => s.url);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <JudulHalaman atas="Sekretariat" judul="Hubungi Kami"
        deskripsi="Untuk verifikasi keanggotaan, kerja sama kegiatan, pemasangan lowongan, atau pertanyaan seputar data pribadi." />

      <div className="grid gap-6 md:grid-cols-[1.2fr_1fr]">
        <div className="grid content-start gap-4 sm:grid-cols-2">
          {saluran.map((s) => (
            <a key={s.judul} href={s.href} target={s.href.startsWith("http") ? "_blank" : undefined} rel="noreferrer noopener" className="group">
              <Kartu className="h-full p-5 transition-all hover:border-merek-300 hover:shadow-md">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{s.judul}</p>
                <p className="mt-1.5 break-words font-semibold text-slate-900 group-hover:text-merek-700">{s.isi}</p>
                {s.ket && <p className="mt-1 text-xs text-slate-500">{s.ket}</p>}
              </Kartu>
            </a>
          ))}
        </div>

        <Kartu className="p-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Alamat sekretariat</p>
          <p className="mt-2 leading-relaxed text-slate-800">{p.alamat || "Fakultas Kedokteran Universitas Muhammadiyah Malang"}</p>
          <div className="mt-5 overflow-hidden rounded-lg border border-slate-200">
            <iframe
              title="Peta lokasi FK UMM"
              src={`https://www.google.com/maps?q=${encodeURIComponent(p.alamat || "Fakultas Kedokteran Universitas Muhammadiyah Malang")}&output=embed`}
              className="h-64 w-full"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </Kartu>
      </div>

      {sosmed.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-4 font-semibold text-slate-900">Ikuti kami</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {sosmed.map((s) => (
              <a key={s.kunci} href={s.url!} target="_blank" rel="noreferrer noopener" className="group">
                <Kartu className="flex items-center gap-4 p-4 transition-all hover:border-merek-300 hover:shadow-md">
                  <span className="grid size-11 shrink-0 place-items-center rounded-full bg-merek-50 text-merek-700 transition-colors group-hover:bg-merek-700 group-hover:text-white">
                    <IkonSosmed kunci={s.kunci} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400">{s.label}</span>
                    <span className="block truncate font-medium text-slate-900 group-hover:text-merek-700">
                      {/^https?:/i.test(s.akun) ? s.akun.replace(/^https?:\/\/(www\.)?/i, "").replace(/\/$/, "") : `@${s.akun.replace(/^@/, "")}`}
                    </span>
                  </span>
                </Kartu>
              </a>
            ))}
          </div>
        </section>
      )}

      <Kartu className="mt-8 p-6">
        <h2 className="font-semibold text-slate-900">Pertanyaan yang sering diajukan</h2>
        <dl className="mt-4 divide-y divide-slate-100">
          {[
            ["Berapa lama proses verifikasi akun?", "Biasanya 1–3 hari kerja. Pastikan NIM, angkatan, dan tahun lulus sudah terisi di profil agar pengurus bisa mencocokkan dengan arsip fakultas."],
            ["Saya lupa NIM, bagaimana?", "Isi angkatan dan tahun lulus saja, lalu hubungi sekretariat. Pengurus dapat membantu mencari di arsip."],
            ["Bagaimana cara menyembunyikan nomor HP saya?", "Masuk → Profil Saya → bagian Pengaturan Privasi → hilangkan centang pada Nomor HP/WhatsApp → Simpan."],
            ["Bagaimana cara menghapus data saya?", "Kirim permintaan tertulis ke email sekretariat dari email yang kamu pakai mendaftar. Pengurus akan menghapus akun beserta seluruh datamu paling lambat 3 × 24 jam."],
            ["Saya ingin memasang info lowongan.", "Kirim detail lowongan (posisi, institusi, kualifikasi, kontak, batas waktu) ke email sekretariat. Gratis."],
          ].map(([t, j]) => (
            <div key={t} className="py-4">
              <dt className="font-medium text-slate-800">{t}</dt>
              <dd className="mt-1 text-sm leading-relaxed text-slate-600">{j}</dd>
            </div>
          ))}
        </dl>
      </Kartu>
    </div>
  );
}
