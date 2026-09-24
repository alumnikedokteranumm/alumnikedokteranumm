"use client";

import { useActionState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { hapusArsip, imporArsip } from "@/actions/arsip";
import { AreaTeks, Kartu, Pesan, Tombol } from "@/components/ui/dasar";

function Simpan() {
  const { pending } = useFormStatus();
  return <Tombol type="submit" disabled={pending}>{pending ? "Mengimpor…" : "Impor"}</Tombol>;
}

export function FormImpor() {
  const [hasil, aksi] = useActionState(imporArsip, null);
  return (
    <Kartu className="p-6">
      <h2 className="font-semibold text-slate-900">Impor dari Excel / Google Sheets</h2>
      <p className="mt-1 text-sm leading-relaxed text-slate-500">
        Susun kolom berurutan: <strong>Nama · NIM · Angkatan · Tahun lulus · Keterangan</strong> (keterangan boleh kosong).
        Blok semua barisnya di spreadsheet, salin (Ctrl/⌘+C), lalu tempel di kotak ini. NIM yang sudah ada akan diperbarui, tidak dobel.
      </p>
      <form action={aksi} className="mt-4 space-y-3">
        {hasil?.galat && <Pesan jenis="galat">{hasil.galat}</Pesan>}
        {hasil?.sukses && <Pesan jenis="sukses">{hasil.sukses}</Pesan>}
        <AreaTeks name="data" required className="min-h-40 font-mono text-[13px]"
          placeholder={"Ahmad Fauzi\t201810330311001\t2018\t2024\tSumpah dokter periode I\nSiti Rahmawati\t201810330311002\t2018\t2024"} />
        <div className="flex justify-end"><Simpan /></div>
      </form>
    </Kartu>
  );
}

export function TombolHapusArsip({ id, nama }: { id: string; nama: string }) {
  const [sibuk, mulai] = useTransition();
  return (
    <button disabled={sibuk} className="text-xs text-slate-400 hover:text-rose-600 disabled:opacity-50"
      onClick={() => { if (confirm(`Hapus "${nama}" dari arsip?`)) mulai(async () => { const g = await hapusArsip(id); if (g) alert(g); }); }}>
      Hapus
    </button>
  );
}
