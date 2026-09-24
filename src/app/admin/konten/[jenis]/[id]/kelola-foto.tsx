"use client";

import { useRef, useState, useTransition } from "react";
import { hapusFoto, tambahFoto } from "@/actions/admin";
import { unggahKePublik } from "@/components/unggah-gambar";
import { Kartu } from "@/components/ui/dasar";
import type { Foto } from "@/lib/tipe";

export function KelolaFoto({ albumId, foto }: { albumId: string; foto: Foto[] }) {
  const masukan = useRef<HTMLInputElement>(null);
  const [kemajuan, setKemajuan] = useState<string | null>(null);
  const [galat, setGalat] = useState<string | null>(null);
  const [, mulai] = useTransition();

  const unggahBanyak = async (daftar: FileList) => {
    setGalat(null);
    const berkas = Array.from(daftar);
    for (let i = 0; i < berkas.length; i++) {
      setKemajuan(`Mengunggah ${i + 1} dari ${berkas.length}…`);
      try {
        const url = await unggahKePublik(berkas[i], `galeri/${albumId}`);
        await tambahFoto(albumId, url);
      } catch (e) {
        setGalat(`${berkas[i].name}: ${e instanceof Error ? e.message : "gagal"}`);
      }
    }
    setKemajuan(null);
  };

  return (
    <Kartu className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold text-slate-900">Foto dalam album ({foto.length})</h2>
          <p className="text-sm text-slate-500">Pilih beberapa foto sekaligus. Foto otomatis diperkecil sebelum diunggah.</p>
        </div>
        <button type="button" disabled={Boolean(kemajuan)} onClick={() => masukan.current?.click()}
          className="rounded-lg bg-merek-700 px-4 py-2 text-sm font-medium text-white hover:bg-merek-800 disabled:opacity-50">
          {kemajuan ?? "+ Unggah foto"}
        </button>
        <input ref={masukan} type="file" multiple accept="image/jpeg,image/png,image/webp,image/avif" className="hidden"
          onChange={(e) => { if (e.target.files?.length) unggahBanyak(e.target.files); e.target.value = ""; }} />
      </div>
      {galat && <p className="mt-3 text-sm text-rose-600">{galat}</p>}

      {foto.length > 0 && (
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {foto.map((f) => (
            <div key={f.id} className="group relative aspect-square overflow-hidden rounded-lg bg-slate-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={f.url} alt="" className="size-full object-cover" />
              <button type="button"
                onClick={() => { if (confirm("Hapus foto ini?")) mulai(() => hapusFoto(f.id, albumId)); }}
                className="absolute right-2 top-2 rounded-md bg-white/90 px-2 py-1 text-xs font-medium text-rose-600 opacity-0 shadow transition-opacity group-hover:opacity-100 focus:opacity-100">
                Hapus
              </button>
            </div>
          ))}
        </div>
      )}
    </Kartu>
  );
}
