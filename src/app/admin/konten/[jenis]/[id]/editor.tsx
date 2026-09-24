"use client";

import { useActionState, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { hapusKonten, simpanKonten } from "@/actions/admin";
import { SKEMA, isoKeMasukanWaktu, type DefinisiBidang } from "@/lib/skema-konten";
import { AreaTeks, Bidang, Isian, Kartu, Pesan, Pilihan, Sakelar, Tombol } from "@/components/ui/dasar";
import { IsianGambar } from "@/components/unggah-gambar";
import { IsianBerkas } from "@/components/unggah-berkas";
import { Markdown } from "@/lib/markdown";

function TombolSimpan() {
  const { pending } = useFormStatus();
  return <Tombol type="submit" disabled={pending} className="px-6">{pending ? "Menyimpan…" : "Simpan"}</Tombol>;
}

function EditorMarkdown({ nama, awal }: { nama: string; awal: string }) {
  const [teks, setTeks] = useState(awal);
  const [pratinjau, setPratinjau] = useState(false);
  return (
    <div>
      <div className="mb-2 flex items-center gap-1 text-xs">
        <button type="button" onClick={() => setPratinjau(false)} className={`rounded-md px-2.5 py-1 ${!pratinjau ? "bg-slate-800 text-white" : "text-slate-500 hover:bg-slate-100"}`}>Tulis</button>
        <button type="button" onClick={() => setPratinjau(true)} className={`rounded-md px-2.5 py-1 ${pratinjau ? "bg-slate-800 text-white" : "text-slate-500 hover:bg-slate-100"}`}>Pratinjau</button>
        <span className="ml-auto text-slate-400">## Judul · **tebal** · *miring* · - daftar · 1. bernomor</span>
      </div>
      <input type="hidden" name={nama} value={teks} />
      {pratinjau ? (
        <div className="min-h-64 rounded-lg border border-slate-200 bg-white px-5 py-2">
          {teks.trim() ? <Markdown teks={teks} /> : <p className="py-6 text-sm text-slate-400">Belum ada isi.</p>}
        </div>
      ) : (
        <AreaTeks value={teks} onChange={(e) => setTeks(e.target.value)} className="min-h-72 font-mono text-[13px] leading-relaxed" />
      )}
    </div>
  );
}

function IsianBidang({ b, nilai, folder, baris }:
  { b: DefinisiBidang; nilai: unknown; folder: string; baris: Record<string, unknown> | null }) {
  const teks = nilai === null || nilai === undefined ? "" : String(nilai);
  switch (b.jenis) {
    case "teks_panjang": return <AreaTeks name={b.nama} defaultValue={teks} required={b.wajib} />;
    case "markdown":     return <EditorMarkdown nama={b.nama} awal={teks} />;
    case "tanggal":      return <Isian type="date" name={b.nama} defaultValue={teks.slice(0, 10)} required={b.wajib} />;
    case "waktu":        return <Isian type="datetime-local" name={b.nama} defaultValue={isoKeMasukanWaktu(teks)} required={b.wajib} />;
    case "angka":        return <Isian type="number" step="any" name={b.nama} defaultValue={teks} required={b.wajib} />;
    case "url":          return <Isian type="url" name={b.nama} defaultValue={teks} placeholder="https://" required={b.wajib} />;
    case "gambar":       return <IsianGambar nama={b.nama} awal={teks || null} folder={folder} />;
    case "berkas":
      return (
        <IsianBerkas nama={b.nama} awal={{
          path: teks || null,
          namaFile: (baris?.nama_file as string | null) ?? null,
          ukuran: (baris?.ukuran_byte as number | null) ?? null,
        }} />
      );
    case "tersembunyi":  return null;
    case "pilihan":
      return (
        <Pilihan name={b.nama} defaultValue={teks || b.opsi?.[0]}>
          {b.opsi?.map((o) => <option key={o}>{o}</option>)}
        </Pilihan>
      );
    default: return <Isian name={b.nama} defaultValue={teks} required={b.wajib} />;
  }
}

export function EditorKonten({ jenis, id, awal, tersimpan }:
  { jenis: string; id: string | null; awal: Record<string, unknown> | null; tersimpan: boolean }) {
  const skema = SKEMA[jenis];
  const [hasil, aksi] = useActionState(simpanKonten.bind(null, jenis, id), null);
  const [menghapus, mulaiHapus] = useTransition();

  const biasa = skema.bidang.filter((b) => b.jenis !== "centang" && b.jenis !== "tersembunyi");
  const centang = skema.bidang.filter((b) => b.jenis === "centang");

  return (
    <form action={aksi} className="space-y-6">
      {tersimpan && !hasil && <Pesan jenis="sukses">Tersimpan.</Pesan>}
      {hasil?.galat && <Pesan jenis="galat">{hasil.galat}</Pesan>}
      {hasil?.sukses && <Pesan jenis="sukses">{hasil.sukses}</Pesan>}

      <Kartu className="p-6">
        <div className="grid gap-5 sm:grid-cols-2">
          {biasa.map((b) => (
            <div key={b.nama} className={b.penuh || b.jenis === "markdown" || b.jenis === "gambar" || b.jenis === "berkas" ? "sm:col-span-2" : ""}>
              <Bidang label={b.label} petunjuk={b.petunjuk} wajib={b.wajib} grup={b.jenis === "markdown" || b.jenis === "gambar" || b.jenis === "berkas"}>
                <IsianBidang b={b} nilai={awal?.[b.nama]} folder={skema.tabel} baris={awal} />
              </Bidang>
            </div>
          ))}
        </div>
        {centang.length > 0 && (
          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            {centang.map((b) => (
              <Sakelar key={b.nama} name={b.nama} label={b.label}
                defaultChecked={awal ? Boolean(awal[b.nama]) : b.nama === "aktif"} />
            ))}
          </div>
        )}
      </Kartu>

      <div className="flex flex-wrap items-center justify-between gap-3">
        {id ? (
          <button type="button" disabled={menghapus}
            onClick={() => { if (confirm(`Hapus ${skema.tunggal} ini secara permanen?`)) mulaiHapus(() => hapusKonten(jenis, id)); }}
            className="rounded-lg px-4 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 disabled:opacity-50">
            {menghapus ? "Menghapus…" : "Hapus"}
          </button>
        ) : <span />}
        <TombolSimpan />
      </div>
    </form>
  );
}
