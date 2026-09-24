import Link from "next/link";
import { buatKlienServer } from "@/lib/supabase/server";
import { Kartu, Kosong, Lencana, Pesan, TautanTombol } from "@/components/ui/dasar";
import { tanggalJam } from "@/lib/format";
import type { AcaraWebinar } from "@/lib/tipe";

export default async function DaftarWebinar() {
  const supabase = await buatKlienServer();
  const [{ data, error }, { data: peserta }] = await Promise.all([
    supabase.from("acara").select("*").eq("pendaftaran_web", true).order("mulai", { ascending: false }).limit(100),
    supabase.from("peserta_acara").select("acara_id, status, hadir_pada, nomor_sertifikat"),
  ]);
  const acara = (data ?? []) as AcaraWebinar[];
  const hitung = (id: string) => {
    const p = (peserta ?? []).filter((x) => x.acara_id === id && x.status !== "batal");
    return { daftar: p.length, hadir: p.filter((x) => x.hadir_pada).length, sertifikat: p.filter((x) => x.nomor_sertifikat).length };
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-slate-900">🎓 Webinar & SKP</h1>
          <p className="mt-1 text-sm text-slate-500">Kegiatan yang membuka pendaftaran lewat website: atur tautan Zoom, kode presensi, kuis, dan pantau peserta.</p>
        </div>
        <TautanTombol href="/admin/konten/acara/baru">+ Kegiatan baru</TautanTombol>
      </div>

      <div className="mt-6">
        <Pesan jenis="info" judul="Cara membuat webinar ber-SKP">
          1) Buat/ubah kegiatan di menu <strong>Agenda</strong>, isi jumlah SKP & nomor akreditasinya, lalu centang
          <em> “Buka pendaftaran lewat website”</em>. 2) Kegiatan muncul di bawah — klik untuk mengisi tautan Zoom, kode presensi, dan soal kuis.
          3) Saat webinar, umumkan kode presensi. Sertifikat terbit otomatis untuk peserta yang hadir, lulus kuis, dan mengisi evaluasi.
        </Pesan>
      </div>

      {error ? <div className="mt-6"><Pesan jenis="galat">{error.message}</Pesan></div>
        : !acara.length ? (
          <div className="mt-6"><Kosong judul="Belum ada webinar dengan pendaftaran web" pesan="Centang “Buka pendaftaran lewat website” pada salah satu agenda." /></div>
        ) : (
          <div className="mt-6 space-y-3">
            {acara.map((a) => {
              const h = hitung(a.id);
              return (
                <Link key={a.id} href={`/admin/webinar/${a.id}`} className="block">
                  <Kartu className="flex flex-wrap items-center gap-4 p-5 transition-shadow hover:shadow-md">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-900">{a.judul}</p>
                      <p className="text-sm text-slate-500">{tanggalJam(a.mulai)}</p>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {!a.terbit && <Lencana>Draf</Lencana>}
                        {a.skp_idi && <Lencana warna="emas">{a.skp_idi} SKP</Lencana>}
                        {a.terbuka_umum && <Lencana warna="biru">Terbuka umum</Lencana>}
                      </div>
                    </div>
                    <dl className="flex gap-6 text-center text-sm">
                      {[["Daftar", h.daftar], ["Hadir", h.hadir], ["Sertifikat", h.sertifikat]].map(([l, n]) => (
                        <div key={String(l)}><dd className="font-serif text-2xl font-bold text-slate-900">{n}</dd><dt className="text-xs text-slate-500">{l}</dt></div>
                      ))}
                    </dl>
                  </Kartu>
                </Link>
              );
            })}
          </div>
        )}
    </div>
  );
}
