"use client";

import { useActionState, useEffect, useRef, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { hapusSkpMandiri, tambahSkpMandiri } from "@/actions/webinar";
import { Bidang, Isian, Pesan, Tombol } from "@/components/ui/dasar";

function Simpan() {
  const { pending } = useFormStatus();
  return <Tombol type="submit" disabled={pending}>{pending ? "Menyimpan…" : "+ Tambah ke portofolio"}</Tombol>;
}

export function FormSkpMandiri() {
  const [hasil, aksi] = useActionState(tambahSkpMandiri, null);
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => { if (hasil?.sukses) form.current?.reset(); }, [hasil]);

  return (
    <details className="group rounded-xl border border-slate-200 bg-white">
      <summary className="cursor-pointer list-none px-5 py-4 text-sm font-medium text-merek-700 hover:bg-slate-50">
        + Catat SKP dari kegiatan lain
      </summary>
      <form ref={form} action={aksi} className="space-y-4 border-t border-slate-100 p-5">
        {hasil?.galat && <Pesan jenis="galat">{hasil.galat}</Pesan>}
        {hasil?.sukses && <Pesan jenis="sukses">{hasil.sukses}</Pesan>}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2"><Bidang label="Nama kegiatan" wajib><Isian name="judul" required placeholder="Simposium Nasional Kardiologi 2026" /></Bidang></div>
          <Bidang label="Penyelenggara"><Isian name="penyelenggara" placeholder="PERKI Cabang Malang" /></Bidang>
          <Bidang label="Tanggal" wajib><Isian name="tanggal" type="date" required /></Bidang>
          <Bidang label="Jumlah SKP" wajib><Isian name="jumlah_skp" type="number" step="0.01" min="0.01" max="100" required /></Bidang>
          <Bidang label="Catatan"><Isian name="catatan" placeholder="No. sertifikat, dll." /></Bidang>
        </div>
        <div className="flex justify-end"><Simpan /></div>
      </form>
    </details>
  );
}

export function TombolHapusSkp({ id }: { id: string }) {
  const [sibuk, mulai] = useTransition();
  return (
    <button disabled={sibuk} className="text-slate-400 hover:text-rose-600 disabled:opacity-50"
      onClick={() => { if (confirm("Hapus catatan SKP ini?")) mulai(async () => { const g = await hapusSkpMandiri(id); if (g) alert(g); }); }}>
      Hapus
    </button>
  );
}

