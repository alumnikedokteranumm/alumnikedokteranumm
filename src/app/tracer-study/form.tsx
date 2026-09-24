"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { simpanTracer } from "@/actions/tracer";
import { AreaTeks, Bidang, Isian, Kartu, Pesan, Pilihan, Tombol } from "@/components/ui/dasar";
import {
  CARA_DAPAT_KERJA, JENIS_INSTANSI, KOMPETENSI, RENTANG_PENDAPATAN, SKALA_5, STATUS_KERJA,
} from "@/lib/konstanta";
import type { Tracer } from "@/lib/tipe";

function Simpan() {
  const { pending } = useFormStatus();
  return <Tombol type="submit" disabled={pending} className="px-8 py-3">{pending ? "Menyimpan…" : "Kirim Jawaban"}</Tombol>;
}

function Skala({ nama, awal, kiri = "Sangat kurang", kanan = "Sangat baik" }:
  { nama: string; awal?: number | null; kiri?: string; kanan?: string }) {
  return (
    <div>
      <div className="grid grid-cols-5 gap-1.5">
        {SKALA_5.map((s) => (
          <label key={s.nilai} className="cursor-pointer">
            <input type="radio" name={nama} value={s.nilai} defaultChecked={awal === s.nilai} className="peer sr-only" />
            <span className="block rounded-lg border border-slate-300 bg-white py-2.5 text-center text-sm font-semibold text-slate-600 transition-colors peer-checked:border-merek-600 peer-checked:bg-merek-600 peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-merek-300 hover:border-merek-400" title={s.label}>
              {s.nilai}
            </span>
          </label>
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[11px] text-slate-400"><span>{kiri}</span><span>{kanan}</span></div>
    </div>
  );
}

function Bagian({ huruf, judul, children }: { huruf: string; judul: string; children: React.ReactNode }) {
  return (
    <Kartu className="p-6">
      <div className="flex items-center gap-3">
        <span className="grid size-8 place-items-center rounded-full bg-merek-700 text-sm font-bold text-white">{huruf}</span>
        <h2 className="text-base font-semibold text-slate-900">{judul}</h2>
      </div>
      <div className="mt-5 space-y-5">{children}</div>
    </Kartu>
  );
}

export function FormTracer({ awal }: { awal: Tracer | null }) {
  const [hasil, aksi] = useActionState(simpanTracer, null);
  const atas = useRef<HTMLDivElement>(null);
  useEffect(() => { if (hasil) atas.current?.scrollIntoView({ behavior: "smooth", block: "center" }); }, [hasil]);
  const a = awal;

  return (
    <form action={aksi} className="space-y-6">
      <div ref={atas}>
        {hasil?.galat && <Pesan jenis="galat">{hasil.galat}</Pesan>}
        {hasil?.sukses && <Pesan jenis="sukses" judul="Tersimpan">{hasil.sukses}</Pesan>}
      </div>

      <Bagian huruf="A" judul="Status dan masa tunggu kerja">
        <Bidang label="Status kamu saat ini" wajib>
          <Pilihan name="status_saat_ini" defaultValue={a?.status_saat_ini ?? ""} required>
            <option value="">— Pilih —</option>
            {STATUS_KERJA.map((v) => <option key={v}>{v}</option>)}
          </Pilihan>
        </Bidang>
        <Bidang label="Berapa bulan setelah lulus kamu mendapat pekerjaan pertama?"
          petunjuk="Hitung sejak tanggal lulus/sumpah dokter. Masa internsip dihitung sebagai bekerja. Isi 0 bila langsung bekerja.">
          <Isian name="masa_tunggu_bulan" type="number" min={0} max={240} defaultValue={a?.masa_tunggu_bulan ?? ""} className="max-w-40" />
        </Bidang>
        <Bidang label="Bagaimana kamu mendapatkan pekerjaan tersebut?">
          <Pilihan name="cara_dapat_kerja" defaultValue={a?.cara_dapat_kerja ?? ""}>
            <option value="">— Pilih —</option>
            {CARA_DAPAT_KERJA.map((v) => <option key={v}>{v}</option>)}
          </Pilihan>
        </Bidang>
      </Bagian>

      <Bagian huruf="B" judul="Tempat kerja saat ini">
        <div className="grid gap-4 sm:grid-cols-2">
          <Bidang label="Jenis instansi">
            <Pilihan name="jenis_instansi" defaultValue={a?.jenis_instansi ?? ""}>
              <option value="">— Pilih —</option>
              {JENIS_INSTANSI.map((v) => <option key={v}>{v}</option>)}
            </Pilihan>
          </Bidang>
          <Bidang label="Tingkat instansi">
            <Pilihan name="tingkat_instansi" defaultValue={a?.tingkat_instansi ?? ""}>
              <option value="">— Pilih —</option>
              {["Lokal / wilayah", "Nasional", "Multinasional / internasional"].map((v) => <option key={v}>{v}</option>)}
            </Pilihan>
          </Bidang>
          <Bidang label="Posisi / jabatan">
            <Isian name="posisi" defaultValue={a?.posisi ?? ""} placeholder="Contoh: Dokter jaga IGD" />
          </Bidang>
          <Bidang label="Kota / kabupaten">
            <Isian name="lokasi_kerja" defaultValue={a?.lokasi_kerja ?? ""} />
          </Bidang>
        </div>
        <Bidang label="Rentang pendapatan per bulan" petunjuk="Opsional. Hanya dilaporkan sebagai sebaran gabungan.">
          <Pilihan name="rentang_pendapatan" defaultValue={a?.rentang_pendapatan ?? ""}>
            <option value="">— Pilih —</option>
            {RENTANG_PENDAPATAN.map((v) => <option key={v}>{v}</option>)}
          </Pilihan>
        </Bidang>
      </Bagian>

      <Bagian huruf="C" judul="Kesesuaian pendidikan dengan pekerjaan">
        <Bidang grup label="Seberapa erat bidang studimu dengan pekerjaan sekarang?">
          <Skala nama="kesesuaian_bidang" awal={a?.kesesuaian_bidang} kiri="Tidak sama sekali" kanan="Sangat erat" />
        </Bidang>
        <Bidang label="Tingkat pendidikan apa yang paling tepat untuk pekerjaanmu saat ini?">
          <Pilihan name="tingkat_pendidikan_sesuai" defaultValue={a?.tingkat_pendidikan_sesuai ?? ""}>
            <option value="">— Pilih —</option>
            {["Setingkat lebih tinggi", "Tingkat yang sama", "Setingkat lebih rendah", "Tidak perlu pendidikan tinggi"].map((v) => <option key={v}>{v}</option>)}
          </Pilihan>
        </Bidang>
      </Bagian>

      <Bagian huruf="D" judul="Penilaian kompetensi diri">
        <p className="-mt-2 text-sm leading-relaxed text-slate-500">
          Menurutmu, seberapa baik FK UMM membekalimu pada kompetensi berikut? (1 = sangat kurang, 5 = sangat baik)
        </p>
        {KOMPETENSI.map((k) => (
          <Bidang grup key={k.kunci} label={k.label}>
            <Skala nama={k.kunci} awal={a?.[k.kunci as keyof Tracer] as number | null} />
          </Bidang>
        ))}
      </Bagian>

      <Bagian huruf="E" judul="Umpan balik untuk almamater">
        <Bidang grup label="Secara keseluruhan, seberapa puas kamu dengan pendidikan di FK UMM?">
          <Skala nama="kepuasan_pendidikan" awal={a?.kepuasan_pendidikan} kiri="Sangat tidak puas" kanan="Sangat puas" />
        </Bidang>
        <Bidang label="Saran untuk perbaikan kurikulum, fasilitas, atau layanan alumni">
          <AreaTeks name="saran" defaultValue={a?.saran ?? ""} maxLength={1000} placeholder="Tuliskan dengan bebas…" />
        </Bidang>
      </Bagian>

      <div className="flex justify-end"><Simpan /></div>
    </form>
  );
}
