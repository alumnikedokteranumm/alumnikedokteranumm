import type { Metadata } from "next";
import Link from "next/link";
import { buatKlienServer } from "@/lib/supabase/server";
import { ambilSesi } from "@/lib/sesi";
import { JudulHalaman, Kartu, Kosong, Lencana, Pesan, TautanTombol } from "@/components/ui/dasar";
import { rupiah, tanggal, tanggalJam } from "@/lib/format";
import { FormSkpMandiri, TombolHapusSkp } from "./skp-mandiri";
import type { AcaraWebinar, Peserta, SkpMandiri } from "@/lib/tipe";

export const metadata: Metadata = { title: "Webinar & SKP", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

type PesertaDenganAcara = Peserta & { acara: AcaraWebinar | null };

const LABEL_STATUS = {
  menunggu_bayar: { teks: "Menunggu pembayaran", warna: "emas" },
  terdaftar: { teks: "Terdaftar", warna: "biru" },
  batal: { teks: "Batal", warna: "netral" },
} as const;

function angkaSkp(n: number) {
  return new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 }).format(n);
}

export default async function HubSkp() {
  const { user, profil } = await ambilSesi();
  const supabase = await buatKlienServer();

  const [{ data: acara }, { data: milik }, { data: mandiri }] = await Promise.all([
    supabase.from("acara").select("*").eq("terbit", true).eq("pendaftaran_web", true)
      .gte("mulai", new Date(Date.now() - 2 * 86_400_000).toISOString()).order("mulai"),
    supabase.from("peserta_acara").select("*, acara(*)").eq("profil_id", user!.id).order("terdaftar_pada", { ascending: false }),
    supabase.from("skp_mandiri").select("*").eq("profil_id", user!.id).order("tanggal", { ascending: false }),
  ]);

  const terbuka = ((acara ?? []) as AcaraWebinar[])
    .filter((a) => new Date(a.selesai ?? new Date(a.mulai).getTime() + 3 * 3600_000) >= new Date());
  const saya = (milik ?? []) as PesertaDenganAcara[];
  const idSaya = new Set(saya.filter((p) => p.status !== "batal").map((p) => p.acara_id));
  const sertifikat = saya.filter((p) => p.nomor_sertifikat && p.acara);
  const catatan = (mandiri ?? []) as SkpMandiri[];
  const alumniAktif = profil?.status === "terverifikasi" && profil.peran !== "pending";

  // Portofolio: gabungan sertifikat AKU + catatan mandiri
  const portofolio = [
    ...sertifikat.map((p) => ({
      id: p.id, judul: p.acara!.judul, penyelenggara: "Alumni Kedokteran UMM", tanggal: p.acara!.mulai,
      skp: Number(p.acara!.skp_idi ?? 0), kode: p.kode_verifikasi, mandiri: false,
    })),
    ...catatan.map((c) => ({
      id: c.id, judul: c.judul, penyelenggara: c.penyelenggara ?? "—", tanggal: c.tanggal,
      skp: Number(c.jumlah_skp), kode: null, mandiri: true,
    })),
  ].sort((a, b) => b.tanggal.localeCompare(a.tanggal));

  const tahunIni = new Date().getFullYear();
  const totalTahunIni = portofolio.filter((p) => new Date(p.tanggal).getFullYear() === tahunIni).reduce((s, p) => s + p.skp, 0);
  const total5 = portofolio.filter((p) => new Date(p.tanggal).getFullYear() > tahunIni - 5).reduce((s, p) => s + p.skp, 0);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <JudulHalaman
        atas="Pendidikan kedokteran berkelanjutan"
        judul="Webinar & SKP"
        deskripsi="Daftar webinar, isi presensi dan kuis di hari-H, lalu unduh sertifikat yang langsung tercatat di portofolio SKP-mu."
      />

      {!alumniAktif && (
        <div className="mb-8">
          <Pesan jenis="info">
            Akunmu belum diverifikasi sebagai alumni. Kamu tetap bisa mengikuti webinar yang dibuka untuk umum.
          </Pesan>
        </div>
      )}

      {/* ---------------------------------------------------- WEBINAR TERBUKA */}
      <section className="mb-14">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Pendaftaran dibuka</h2>
        {!terbuka.length ? (
          <Kosong judul="Belum ada webinar yang membuka pendaftaran" pesan="Pantau halaman Agenda untuk kegiatan berikutnya." aksi={<TautanTombol href="/agenda" varian="garis">Lihat Agenda</TautanTombol>} />
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {terbuka.map((a) => (
              <Kartu key={a.id} className="flex flex-col p-6">
                <div className="flex flex-wrap gap-1.5">
                  <Lencana warna="hijau">{a.jenis}</Lencana>
                  {a.skp_idi && <Lencana warna="emas">{a.skp_idi} SKP</Lencana>}
                  <Lencana warna={a.biaya_nominal ? "netral" : "biru"}>{a.biaya_nominal ? rupiah(a.biaya_nominal) : "Gratis"}</Lencana>
                  {!a.terbuka_umum && <Lencana>Khusus alumni</Lencana>}
                </div>
                <h3 className="mt-3 font-serif text-lg font-bold leading-snug text-slate-900">{a.judul}</h3>
                <p className="mt-1 text-sm text-slate-600">{tanggalJam(a.mulai)} · {a.lokasi || (a.daring ? "Daring" : "—")}</p>
                <div className="mt-auto flex flex-wrap gap-2 pt-5">
                  <TautanTombol href={`/skp/${a.id}`} varian={idSaya.has(a.id) ? "halus" : "utama"}>
                    {idSaya.has(a.id) ? "Buka ruang peserta →" : "Daftar"}
                  </TautanTombol>
                  <TautanTombol href={`/agenda/${a.slug}`} varian="garis">Detail</TautanTombol>
                </div>
              </Kartu>
            ))}
          </div>
        )}
      </section>

      {/* ---------------------------------------------------- KEGIATAN SAYA */}
      <section className="mb-14">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Kegiatan yang saya ikuti</h2>
        {!saya.length ? (
          <p className="text-sm text-slate-500">Belum ada. Kegiatan yang kamu daftari akan muncul di sini.</p>
        ) : (
          <Kartu className="overflow-hidden">
            <ul className="divide-y divide-slate-100">
              {saya.filter((p) => p.acara).map((p) => {
                const st = LABEL_STATUS[p.status];
                return (
                  <li key={p.id} className="flex flex-wrap items-center gap-3 px-5 py-4">
                    <div className="min-w-0 flex-1">
                      <Link href={`/skp/${p.acara_id}`} className="font-medium text-slate-900 hover:text-merek-700">{p.acara!.judul}</Link>
                      <p className="text-sm text-slate-500">{tanggalJam(p.acara!.mulai)}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Lencana warna={st.warna}>{st.teks}</Lencana>
                      {p.hadir_pada && <Lencana warna="hijau">Hadir</Lencana>}
                      {p.nomor_sertifikat && <Lencana warna="emas">Sertifikat terbit</Lencana>}
                    </div>
                  </li>
                );
              })}
            </ul>
          </Kartu>
        )}
      </section>

      {/* ---------------------------------------------------- PORTOFOLIO SKP */}
      <section>
        <h2 className="mb-1 text-lg font-semibold text-slate-900">Portofolio SKP saya</h2>
        <p className="mb-4 text-sm text-slate-500">
          Sertifikat dari AKU tercatat otomatis. Tambahkan juga kegiatan dari penyelenggara lain supaya semua SKP-mu terkumpul di satu tempat.
          Hanya kamu yang bisa melihat portofolio ini.
        </p>

        <div className="mb-5 grid gap-4 sm:grid-cols-3">
          {[
            [`SKP tahun ${tahunIni}`, angkaSkp(totalTahunIni)],
            ["SKP 5 tahun terakhir", angkaSkp(total5)],
            ["Jumlah kegiatan", String(portofolio.length)],
          ].map(([l, n]) => (
            <Kartu key={l} className="p-5">
              <p className="text-sm text-slate-500">{l}</p>
              <p className="mt-1 font-serif text-3xl font-bold text-merek-800">{n}</p>
            </Kartu>
          ))}
        </div>

        {portofolio.length > 0 && (
          <div className="mb-6 overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
                <tr><th className="px-4 py-3">Tanggal</th><th className="px-4 py-3">Kegiatan</th><th className="px-4 py-3">Penyelenggara</th><th className="px-4 py-3 text-right">SKP</th><th className="px-4 py-3" /></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {portofolio.map((p) => (
                  <tr key={p.id}>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{tanggal(p.tanggal)}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">{p.judul}</td>
                    <td className="px-4 py-3 text-slate-600">{p.penyelenggara}</td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900">{angkaSkp(p.skp)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      {p.kode ? <Link href={`/sertifikat/${p.kode}`} className="text-merek-700 hover:underline">Sertifikat</Link>
                        : p.mandiri ? <TombolHapusSkp id={p.id} /> : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <FormSkpMandiri />
        <p className="mt-4 text-xs leading-relaxed text-slate-500">
          Portofolio ini adalah catatan pribadi untuk memudahkan rekap. Pengakuan SKP resmi untuk perpanjangan SIP tetap mengikuti
          pencatatan di Plataran Sehat / SATUSEHAT SDMK Kementerian Kesehatan.
        </p>
      </section>
    </div>
  );
}
