import Link from "next/link";
import { notFound } from "next/navigation";
import { buatKlienServer } from "@/lib/supabase/server";
import { Kartu, Lencana } from "@/components/ui/dasar";
import { tanggalJam } from "@/lib/format";
import { FormRuang, FormSoal, TombolHadir } from "./form";
import type { AcaraWebinar, Peserta, SoalKuis } from "@/lib/tipe";

type BarisPeserta = Peserta & {
  profiles: { nama_lengkap: string; gelar_depan: string | null; gelar_belakang: string | null; angkatan: number | null; email_kontak: string | null } | null;
};

function rata(nilai: (number | null)[]) {
  const ada = nilai.filter((n): n is number => typeof n === "number");
  return ada.length ? (ada.reduce((a, b) => a + b, 0) / ada.length).toFixed(2).replace(".", ",") : "—";
}

/** Ubah soal tersimpan kembali ke format teks yang bisa diedit. */
function soalKeTeks(soal: SoalKuis[]) {
  return soal.map((s) =>
    [s.pertanyaan, ...s.opsi.map((o, i) => `${i === s.kunci ? "*" : ""}${String.fromCharCode(97 + i)}. ${o}`)].join("\n"),
  ).join("\n\n");
}

export default async function KelolaWebinar({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const supabase = await buatKlienServer();
  const [{ data: a }, { data: r }, { data: s }, { data: p }] = await Promise.all([
    supabase.from("acara").select("*").eq("id", id).maybeSingle(),
    supabase.from("acara_rahasia").select("*").eq("acara_id", id).maybeSingle(),
    supabase.from("soal_kuis").select("*").eq("acara_id", id).order("urutan"),
    supabase.from("peserta_acara").select("*, profiles(nama_lengkap, gelar_depan, gelar_belakang, angkatan, email_kontak)")
      .eq("acara_id", id).order("terdaftar_pada"),
  ]);
  if (!a) notFound();
  const acara = a as AcaraWebinar;
  const peserta = (p ?? []) as BarisPeserta[];
  const aktif = peserta.filter((x) => x.status !== "batal");
  const sudahEvaluasi = aktif.filter((x) => x.evaluasi_pada);
  const saran = sudahEvaluasi.filter((x) => x.saran);

  return (
    <div>
      <Link href="/admin/webinar" className="text-sm text-slate-500 hover:text-merek-700">← Webinar & SKP</Link>
      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-bold text-slate-900">{acara.judul}</h1>
          <p className="mt-1 text-sm text-slate-500">{tanggalJam(acara.mulai)} · {acara.skp_idi ?? 0} SKP · nilai lulus kuis {acara.ambang_kuis ?? 70}</p>
        </div>
        <div className="flex gap-3 text-sm">
          <Link href={`/admin/konten/acara/${id}`} className="text-merek-700 hover:underline">Ubah detail kegiatan</Link>
          <a href={`/skp/${id}`} target="_blank" className="text-slate-500 hover:underline">Lihat sebagai peserta ↗</a>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <FormRuang acaraId={id} awal={{
          tautan_ruang: r?.tautan_ruang ?? "", catatan_peserta: r?.catatan_peserta ?? "", kode_presensi: r?.kode_presensi ?? "",
        }} />
        <FormSoal acaraId={id} awal={soalKeTeks((s ?? []) as SoalKuis[])} />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-4">
        {[
          ["Terdaftar", aktif.filter((x) => x.status === "terdaftar").length],
          ["Menunggu bayar", aktif.filter((x) => x.status === "menunggu_bayar").length],
          ["Hadir", aktif.filter((x) => x.hadir_pada).length],
          ["Sertifikat terbit", aktif.filter((x) => x.nomor_sertifikat).length],
        ].map(([l, n]) => (
          <Kartu key={String(l)} className="p-4"><p className="text-xs text-slate-500">{l}</p><p className="font-serif text-2xl font-bold text-slate-900">{n}</p></Kartu>
        ))}
      </div>

      <Kartu className="mt-6 p-6">
        <h2 className="font-semibold text-slate-900">Hasil evaluasi ({sudahEvaluasi.length} responden)</h2>
        <dl className="mt-3 grid gap-4 text-sm sm:grid-cols-3">
          <div><dt className="text-slate-500">Materi</dt><dd className="text-xl font-bold text-merek-800">{rata(sudahEvaluasi.map((x) => x.nilai_materi))} / 5</dd></div>
          <div><dt className="text-slate-500">Narasumber</dt><dd className="text-xl font-bold text-merek-800">{rata(sudahEvaluasi.map((x) => x.nilai_narasumber))} / 5</dd></div>
          <div><dt className="text-slate-500">Teknis</dt><dd className="text-xl font-bold text-merek-800">{rata(sudahEvaluasi.map((x) => x.nilai_teknis))} / 5</dd></div>
        </dl>
        {saran.length > 0 && (
          <ul className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-sm text-slate-700">
            {saran.slice(0, 30).map((x) => <li key={x.id}>“{x.saran}”</li>)}
          </ul>
        )}
      </Kartu>

      <h2 className="mb-3 mt-8 font-semibold text-slate-900">Peserta ({aktif.length})</h2>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
            <tr><th className="px-4 py-3">Nama</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Hadir</th><th className="px-4 py-3">Kuis</th><th className="px-4 py-3">Evaluasi</th><th className="px-4 py-3">Sertifikat</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {peserta.map((x) => {
              const pr = x.profiles;
              const nama = pr ? [pr.gelar_depan, pr.nama_lengkap].filter(Boolean).join(" ") + (pr.gelar_belakang ? `, ${pr.gelar_belakang}` : "") : "—";
              return (
                <tr key={x.id} className={x.status === "batal" ? "opacity-50" : ""}>
                  <td className="px-4 py-2.5">
                    <p className="font-medium text-slate-900">{nama}</p>
                    <p className="text-xs text-slate-500">{[pr?.angkatan && `Angk. ${pr.angkatan}`, pr?.email_kontak].filter(Boolean).join(" · ")}</p>
                  </td>
                  <td className="px-4 py-2.5">
                    <Lencana warna={x.status === "terdaftar" ? "biru" : x.status === "menunggu_bayar" ? "emas" : "netral"}>{x.status.replace("_", " ")}</Lencana>
                  </td>
                  <td className="px-4 py-2.5">
                    {x.hadir_pada ? <span className="text-emerald-700">✓</span> : x.status === "terdaftar" ? <TombolHadir pesertaId={x.id} acaraId={id} /> : "—"}
                  </td>
                  <td className="px-4 py-2.5 text-slate-600">{x.skor_kuis ?? "—"}{x.percobaan_kuis ? <span className="text-xs text-slate-400"> ({x.percobaan_kuis}×)</span> : null}</td>
                  <td className="px-4 py-2.5">{x.evaluasi_pada ? "✓" : "—"}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-slate-600">{x.nomor_sertifikat ?? "—"}</td>
                </tr>
              );
            })}
            {!peserta.length && <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">Belum ada pendaftar.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
