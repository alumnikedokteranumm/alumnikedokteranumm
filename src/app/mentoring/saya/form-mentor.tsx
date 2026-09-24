"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { simpanMentor } from "@/actions/mentoring";
import { AreaTeks, Bidang, Isian, Kartu, Pesan, Sakelar, Tombol } from "@/components/ui/dasar";
import { CARA_TEMU, TOPIK_MENTORING } from "@/lib/konstanta";
import type { Mentor } from "@/lib/tipe";

function Simpan() {
  const { pending } = useFormStatus();
  return <Tombol type="submit" disabled={pending}>{pending ? "Menyimpan…" : "Simpan profil mentor"}</Tombol>;
}

function Centang({ nama, nilai, pilih }: { nama: string; nilai: string; pilih: boolean }) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 has-[:checked]:border-merek-400 has-[:checked]:bg-merek-50/60">
      <input type="checkbox" name={nama} value={nilai} defaultChecked={pilih} className="size-4 rounded border-slate-300" />
      {nilai}
    </label>
  );
}

export function FormMentor({ awal }: { awal: Mentor | null }) {
  const [hasil, aksi] = useActionState(simpanMentor, null);
  return (
    <form action={aksi} className="space-y-4">
      {hasil?.galat && <Pesan jenis="galat">{hasil.galat}</Pesan>}
      {hasil?.sukses && <Pesan jenis="sukses">{hasil.sukses}</Pesan>}
      <Kartu className="space-y-5 p-6">
        <Sakelar name="aktif" defaultChecked={awal ? awal.aktif : true} label="Saya bersedia menjadi mentor"
          petunjuk="Matikan kapan saja bila sedang sibuk — profilmu disembunyikan dari daftar mentor." />
        <Bidang label="Topik yang bisa saya bimbing" grup>
          <div className="grid gap-2 sm:grid-cols-2">
            {TOPIK_MENTORING.map((t) => <Centang key={t} nama="topik" nilai={t} pilih={awal?.topik.includes(t) ?? false} />)}
          </div>
        </Bidang>
        <Bidang label="Cara bertemu" grup>
          <div className="flex flex-wrap gap-2">
            {CARA_TEMU.map((t) => <Centang key={t} nama="cara_temu" nilai={t} pilih={awal?.cara_temu.includes(t) ?? t === "Chat WhatsApp"} />)}
          </div>
        </Bidang>
        <Bidang label="Perkenalan singkat" petunjuk="2–3 kalimat: pengalamanmu dan hal yang paling sering kamu bantu. Tampil di kartu mentor.">
          <AreaTeks name="pengantar" defaultValue={awal?.pengantar ?? ""} maxLength={600}
            placeholder="Lulus PPDS Ilmu Penyakit Dalam UNAIR 2022, sekarang di RS daerah. Senang berbagi soal strategi seleksi PPDS dan hidup sebagai residen sambil berkeluarga." />
        </Bidang>
        <Bidang label="Maksimal permintaan per bulan" petunjuk="Permintaan baru otomatis ditutup bila kuota bulan ini sudah terpakai.">
          <Isian type="number" name="kuota_bulanan" min={1} max={20} defaultValue={awal?.kuota_bulanan ?? 3} className="max-w-32" />
        </Bidang>
      </Kartu>
      <div className="flex justify-end"><Simpan /></div>
    </form>
  );
}
