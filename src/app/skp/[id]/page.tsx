import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { buatKlienServer } from "@/lib/supabase/server";
import { ambilSesi } from "@/lib/sesi";
import { Kartu, Lencana, Pesan, TautanTombol } from "@/components/ui/dasar";
import { rupiah, tanggalJam } from "@/lib/format";
import { FormEvaluasi, FormKuis, FormPresensi, TombolBatal, TombolDaftar } from "./langkah";
import type { AcaraWebinar, Peserta, RuangAcara } from "@/lib/tipe";

export const metadata: Metadata = { title: "Ruang Peserta", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

function Langkah({ no, judul, status, children }:
  { no: number; judul: string; status: "selesai" | "aktif" | "nanti"; children?: React.ReactNode }) {
  const bulat = {
    selesai: "bg-emerald-600 text-white",
    aktif: "bg-merek-700 text-white ring-4 ring-merek-100",
    nanti: "bg-slate-200 text-slate-500",
  }[status];
  return (
    <li className="relative flex gap-4 pb-8 last:pb-0">
      <span className="absolute left-4 top-9 h-[calc(100%-2.25rem)] w-px bg-slate-200 [li:last-child_&]:hidden" aria-hidden />
      <span className={`relative grid size-8 shrink-0 place-items-center rounded-full text-sm font-bold ${bulat}`}>
        {status === "selesai" ? "✓" : no}
      </span>
      <div className="min-w-0 flex-1 pt-1">
        <p className={`font-semibold ${status === "nanti" ? "text-slate-400" : "text-slate-900"}`}>{judul}</p>
        {children && <div className="mt-2">{children}</div>}
      </div>
    </li>
  );
}

export default async function RuangPeserta({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { user, profil } = await ambilSesi();
  const supabase = await buatKlienServer();

  const [{ data: a }, { data: ps }] = await Promise.all([
    supabase.from("acara").select("*").eq("id", id).eq("terbit", true).maybeSingle(),
    supabase.from("peserta_acara").select("*").eq("acara_id", id).eq("profil_id", user!.id).maybeSingle(),
  ]);
  if (!a) notFound();
  const acara = a as AcaraWebinar;
  const peserta = ps as Peserta | null;

  const aktif = peserta && peserta.status !== "batal";
  const terdaftar = peserta?.status === "terdaftar";
  const { data: ruangData } = terdaftar ? await supabase.rpc("tautan_ruang_acara", { p_acara: id }) : { data: null };
  const ruang = ruangData as RuangAcara | null;

  const ambang = acara.ambang_kuis ?? 70;
  const adaKuis = (ruang?.jumlah_soal ?? 0) > 0;
  const hadir = Boolean(peserta?.hadir_pada);
  const lulusKuis = !adaKuis || (peserta?.skor_kuis ?? 0) >= ambang;
  const sisaKuis = 3 - (peserta?.percobaan_kuis ?? 0);
  const perluSoal = terdaftar && hadir && adaKuis && !lulusKuis && sisaKuis > 0;
  const { data: soalData } = perluSoal ? await supabase.rpc("soal_kuis_peserta", { p_acara: id }) : { data: null };
  const soal = (soalData ?? []) as { id: string; pertanyaan: string; opsi: string[] }[];

  const mulai = new Date(acara.mulai);
  const selesai = new Date(acara.selesai ?? mulai.getTime() + 3 * 3600_000);
  const sekarang = new Date();
  const presensiBuka = sekarang >= new Date(mulai.getTime() - 30 * 60_000);
  const presensiTutup = sekarang > new Date(selesai.getTime() + 3 * 3600_000);
  const sudahSelesai = sekarang > selesai;
  const bolehDaftar = acara.pendaftaran_web && !sudahSelesai &&
    (acara.terbuka_umum || (profil?.status === "terverifikasi" && profil.peran !== "pending"));

  let no = 0;
  const berbayar = (acara.biaya_nominal ?? 0) > 0;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <Link href="/skp" className="text-sm text-slate-500 hover:text-merek-700">← Webinar & SKP</Link>

      <div className="mt-4 flex flex-wrap gap-1.5">
        <Lencana warna="hijau">{acara.jenis}</Lencana>
        {acara.skp_idi && <Lencana warna="emas">{acara.skp_idi} SKP</Lencana>}
        {berbayar ? <Lencana>{rupiah(acara.biaya_nominal)}</Lencana> : <Lencana warna="biru">Gratis</Lencana>}
      </div>
      <h1 className="mt-3 font-serif text-3xl font-bold leading-tight text-slate-900">{acara.judul}</h1>
      <p className="mt-2 text-slate-600">{tanggalJam(acara.mulai)} · {acara.lokasi || "Daring"}</p>
      <Link href={`/agenda/${acara.slug}`} className="mt-1 inline-block text-sm text-merek-700 hover:underline">Lihat deskripsi lengkap →</Link>

      {!acara.pendaftaran_web ? (
        <div className="mt-8"><Pesan jenis="info">Kegiatan ini tidak memakai pendaftaran lewat website. Lihat halaman agenda untuk cara mendaftar.</Pesan></div>
      ) : (
        <Kartu className="mt-8 p-6 sm:p-8">
          <ol>
            <Langkah no={++no} judul="Pendaftaran" status={aktif ? "selesai" : "aktif"}>
              {aktif ? (
                <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
                  Terdaftar sejak {tanggalJam(peserta!.terdaftar_pada)}.
                  {!hadir && !sudahSelesai && <TombolBatal acaraId={id} />}
                </div>
              ) : bolehDaftar ? (
                <TombolDaftar acaraId={id} berbayar={berbayar} />
              ) : (
                <p className="text-sm text-slate-500">
                  {sudahSelesai ? "Pendaftaran sudah ditutup." : "Kegiatan ini khusus alumni yang sudah diverifikasi pengurus."}
                </p>
              )}
            </Langkah>

            {berbayar && (
              <Langkah no={++no} judul={`Pembayaran ${rupiah(acara.biaya_nominal)}`}
                status={terdaftar ? "selesai" : peserta?.status === "menunggu_bayar" ? "aktif" : "nanti"}>
                {peserta?.status === "menunggu_bayar" && (
                  <div className="space-y-2 text-sm text-slate-600">
                    <p>Transfer lalu unggah bukti transfernya. Status berubah setelah bendahara memeriksa (biasanya 1×24 jam).</p>
                    <TautanTombol href={`/donasi/konfirmasi?acara=${id}`} className="py-2">Konfirmasi pembayaran</TautanTombol>
                  </div>
                )}
              </Langkah>
            )}

            <Langkah no={++no} judul="Masuk ruang webinar" status={!terdaftar ? "nanti" : hadir || sudahSelesai ? "selesai" : "aktif"}>
              {terdaftar && (
                ruang?.tautan ? (
                  <div className="space-y-2">
                    {!sudahSelesai && (
                      <a href={ruang.tautan} target="_blank" rel="noreferrer noopener"
                        className="inline-flex rounded-lg bg-merek-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-merek-800">
                        Buka Zoom / ruang webinar ↗
                      </a>
                    )}
                    {ruang.catatan && <p className="whitespace-pre-line rounded-lg bg-slate-50 px-3.5 py-2.5 text-sm text-slate-700">{ruang.catatan}</p>}
                    <p className="text-xs text-slate-500">Tautan ini khusus peserta terdaftar — mohon tidak disebarkan.</p>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">Tautan ruang akan muncul di sini menjelang acara.</p>
                )
              )}
            </Langkah>

            <Langkah no={++no} judul="Presensi" status={!terdaftar ? "nanti" : hadir ? "selesai" : presensiBuka && !presensiTutup ? "aktif" : "nanti"}>
              {terdaftar && !hadir && (
                presensiTutup ? <p className="text-sm text-rose-600">Waktu presensi sudah ditutup.</p>
                  : !presensiBuka ? <p className="text-sm text-slate-500">Dibuka 30 menit sebelum acara. Kode presensi diumumkan panitia saat webinar berlangsung.</p>
                  : !ruang?.presensi_aktif ? <p className="text-sm text-slate-500">Tunggu panitia mengumumkan kode presensi.</p>
                  : <FormPresensi acaraId={id} />
              )}
              {hadir && <p className="text-sm text-slate-600">Hadir tercatat {tanggalJam(peserta!.hadir_pada)}.</p>}
            </Langkah>

            {adaKuis && (
              <Langkah no={++no} judul={`Kuis (nilai lulus ${ambang})`} status={!hadir ? "nanti" : lulusKuis ? "selesai" : "aktif"}>
                {hadir && (lulusKuis ? (
                  <p className="text-sm text-slate-600">Nilai terbaikmu: <strong>{peserta?.skor_kuis}</strong>. Lulus.</p>
                ) : sisaKuis <= 0 ? (
                  <p className="text-sm text-rose-600">Nilai terbaikmu {peserta?.skor_kuis ?? 0}. Kesempatan sudah habis — hubungi panitia.</p>
                ) : (
                  <FormKuis acaraId={id} soal={soal} sisa={sisaKuis} skorTerakhir={peserta?.skor_kuis ?? null} />
                ))}
              </Langkah>
            )}

            <Langkah no={++no} judul="Evaluasi kegiatan" status={!hadir ? "nanti" : peserta?.evaluasi_pada ? "selesai" : "aktif"}>
              {hadir && !peserta?.evaluasi_pada && <FormEvaluasi acaraId={id} />}
            </Langkah>

            <Langkah no={++no} judul="Sertifikat" status={peserta?.nomor_sertifikat ? "selesai" : "nanti"}>
              {peserta?.kode_verifikasi ? (
                <div className="flex flex-wrap items-center gap-3">
                  <TautanTombol href={`/sertifikat/${peserta.kode_verifikasi}`} varian="kedua">🎓 Lihat & unduh sertifikat</TautanTombol>
                  <span className="text-sm text-slate-500">No. {peserta.nomor_sertifikat}</span>
                </div>
              ) : hadir && peserta?.evaluasi_pada && !lulusKuis ? (
                <p className="text-sm text-slate-500">Sertifikat terbit setelah nilai kuis mencapai {ambang}.</p>
              ) : (
                <p className="text-sm text-slate-500">Terbit otomatis setelah presensi{adaKuis ? ", lulus kuis," : ""} dan evaluasi terisi.</p>
              )}
            </Langkah>
          </ol>
        </Kartu>
      )}
    </div>
  );
}
