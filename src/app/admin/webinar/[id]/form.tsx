"use client";

import { useActionState, useRef, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { simpanRuang, simpanSoal, tandaiHadir } from "@/actions/webinar";
import { AreaTeks, Bidang, Isian, Kartu, Pesan, Tombol } from "@/components/ui/dasar";

function Simpan({ label = "Simpan" }: { label?: string }) {
  const { pending } = useFormStatus();
  return <Tombol type="submit" disabled={pending}>{pending ? "Menyimpan…" : label}</Tombol>;
}

export function FormRuang({ acaraId, awal }:
  { acaraId: string; awal: { tautan_ruang: string; catatan_peserta: string; kode_presensi: string } }) {
  const [hasil, aksi] = useActionState(simpanRuang.bind(null, acaraId), null);
  const kode = useRef<HTMLInputElement>(null);
  const acak = () => {
    const huruf = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    if (kode.current) kode.current.value = Array.from({ length: 6 }, () => huruf[Math.floor(Math.random() * huruf.length)]).join("");
  };

  return (
    <Kartu className="p-6">
      <h2 className="font-semibold text-slate-900">Ruang & presensi</h2>
      <p className="mt-1 text-sm text-slate-500">Hanya terlihat oleh peserta yang terdaftar (dan sudah lunas bila berbayar).</p>
      <form action={aksi} className="mt-4 space-y-4">
        {hasil?.galat && <Pesan jenis="galat">{hasil.galat}</Pesan>}
        {hasil?.sukses && <Pesan jenis="sukses">{hasil.sukses}</Pesan>}
        <Bidang label="Tautan Zoom / Google Meet"><Isian name="tautan_ruang" type="url" defaultValue={awal.tautan_ruang} placeholder="https://zoom.us/j/…" /></Bidang>
        <Bidang label="Catatan untuk peserta" petunjuk="Meeting ID, passcode, aturan nama tampilan, dsb.">
          <AreaTeks name="catatan_peserta" defaultValue={awal.catatan_peserta} className="min-h-20" />
        </Bidang>
        <Bidang label="Kode presensi" petunjuk="Umumkan di tengah webinar. Kosongkan untuk menutup presensi. Peserta punya 10 kali percobaan.">
          <div className="flex gap-2">
            <Isian ref={kode} name="kode_presensi" defaultValue={awal.kode_presensi} className="max-w-44 font-mono uppercase tracking-widest" />
            <button type="button" onClick={acak} className="rounded-lg border border-slate-300 px-3 text-sm text-slate-600 hover:bg-slate-50">🎲 Acak</button>
          </div>
        </Bidang>
        <div className="flex justify-end"><Simpan /></div>
      </form>
    </Kartu>
  );
}

const CONTOH = `Apa terapi lini pertama syok anafilaktik?
a. Difenhidramin IV
*b. Epinefrin IM 0,5 mg
c. Deksametason IV
d. Salbutamol nebulisasi

Posisi pasien syok anafilaktik yang dianjurkan adalah…
*a. Terlentang dengan tungkai ditinggikan
b. Duduk tegak
c. Miring kiri`;

export function FormSoal({ acaraId, awal }: { acaraId: string; awal: string }) {
  const [hasil, aksi] = useActionState(simpanSoal.bind(null, acaraId), null);
  return (
    <Kartu className="p-6">
      <h2 className="font-semibold text-slate-900">Soal kuis</h2>
      <p className="mt-1 text-sm text-slate-500">
        Satu soal per blok, pisahkan dengan <strong>baris kosong</strong>. Baris pertama pertanyaan, berikutnya pilihan jawaban.
        Beri tanda <strong>*</strong> di depan jawaban benar. Kosongkan semua untuk kegiatan tanpa kuis.
      </p>
      <form action={aksi} className="mt-4 space-y-4">
        {hasil?.galat && <Pesan jenis="galat">{hasil.galat}</Pesan>}
        {hasil?.sukses && <Pesan jenis="sukses">{hasil.sukses}</Pesan>}
        <AreaTeks name="soal" defaultValue={awal} placeholder={CONTOH} className="min-h-80 font-mono text-[13px] leading-relaxed" />
        <div className="flex justify-end"><Simpan label="Simpan soal" /></div>
      </form>
    </Kartu>
  );
}

export function TombolHadir({ pesertaId, acaraId }: { pesertaId: string; acaraId: string }) {
  const [sibuk, mulai] = useTransition();
  return (
    <button disabled={sibuk} className="text-xs text-merek-700 hover:underline disabled:opacity-50"
      onClick={() => {
        if (!confirm("Tandai peserta ini hadir? Gunakan bila peserta mengikuti acara tetapi gagal mengisi kode presensi.")) return;
        mulai(async () => { const g = await tandaiHadir(pesertaId, acaraId); if (g) alert(g); });
      }}>
      Tandai hadir
    </button>
  );
}
