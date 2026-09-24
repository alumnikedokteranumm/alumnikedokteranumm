"use client";

import { useState } from "react";
import { Isian, Pilihan } from "./ui/dasar";
import { KELOMPOK_SPESIALISASI, SPESIALISASI, labelSpesialisasi } from "@/lib/konstanta";

const LAINNYA = "__lainnya__";

/**
 * Pilihan spesialisasi berkelompok (36 spesialisasi MKKI). Pilihan "Lainnya…"
 * memunculkan isian bebas untuk penulisan yang berbeda di STR.
 * Nilai yang dikirim ke server lewat <input hidden name={nama}>.
 */
export function PilihSpesialisasi({ nama, awal }: { nama: string; awal: string | null }) {
  const nilaiAwal = awal?.trim() ?? "";
  const adaDiDaftar = SPESIALISASI.includes(nilaiAwal);
  const [pilih, setPilih] = useState(nilaiAwal === "" ? "" : adaDiDaftar ? nilaiAwal : LAINNYA);
  const [bebas, setBebas] = useState(adaDiDaftar ? "" : nilaiAwal);

  const nilai = pilih === LAINNYA ? bebas.trim() : pilih;

  return (
    <div className="space-y-2">
      <input type="hidden" name={nama} value={nilai} />
      <Pilihan value={pilih} onChange={(e) => setPilih(e.target.value)} aria-label="Spesialisasi">
        <option value="">— Belum / tidak ada (dokter umum) —</option>
        {KELOMPOK_SPESIALISASI.map((k) => (
          <optgroup key={k.kelompok} label={k.kelompok}>
            {k.daftar.map(([gelar, bidang]) => {
              const label = labelSpesialisasi(gelar, bidang);
              return <option key={gelar} value={label}>{label}</option>;
            })}
          </optgroup>
        ))}
        <option value={LAINNYA}>Lainnya… (tulis sendiri)</option>
      </Pilihan>
      {pilih === LAINNYA && (
        <Isian value={bebas} onChange={(e) => setBebas(e.target.value)} maxLength={100}
          placeholder="Tulis sesuai STR, contoh: Kedokteran Nuklir dan Teranostik Molekuler (Sp.KN)" autoFocus />
      )}
    </div>
  );
}
