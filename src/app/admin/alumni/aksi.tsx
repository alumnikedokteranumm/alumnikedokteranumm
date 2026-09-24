"use client";

import { useState, useTransition } from "react";
import { hapusPengguna, ubahPeran, verifikasiAlumni } from "@/actions/admin";
import type { Peran, StatusVerifikasi } from "@/lib/tipe";

export function AksiAlumni({ id, nama, status, peran, diriSendiri }:
  { id: string; nama: string; status: StatusVerifikasi; peran: Peran; diriSendiri: boolean }) {
  const [sibuk, mulai] = useTransition();
  const [modeTolak, setModeTolak] = useState(false);
  const [catatan, setCatatan] = useState("");
  const [galat, setGalat] = useState<string | null>(null);

  const jalankan = (kerja: () => Promise<void>) =>
    mulai(async () => {
      setGalat(null);
      try { await kerja(); setModeTolak(false); } catch (e) { setGalat(e instanceof Error ? e.message : "Gagal"); }
    });

  return (
    <div className="mt-4 border-t border-slate-100 pt-4">
      <div className="flex flex-wrap items-center gap-2">
        {status !== "terverifikasi" && (
          <button disabled={sibuk} onClick={() => jalankan(() => verifikasiAlumni(id, "terverifikasi"))}
            className="rounded-lg bg-merek-700 px-3.5 py-1.5 text-sm font-medium text-white hover:bg-merek-800 disabled:opacity-50">
            ✓ Verifikasi
          </button>
        )}
        {status !== "ditolak" && !diriSendiri && (
          <button disabled={sibuk} onClick={() => setModeTolak((v) => !v)}
            className="rounded-lg border border-rose-200 px-3.5 py-1.5 text-sm font-medium text-rose-600 hover:bg-rose-50 disabled:opacity-50">
            ✕ Tolak…
          </button>
        )}
        {!diriSendiri && peran !== "admin" && (
          <button disabled={sibuk}
            onClick={() => {
              const yakin = confirm(
                `Hapus PERMANEN akun "${nama || "(tanpa nama)"}"?\n\n` +
                "Akun login, profil, foto, dan jawaban tracer study-nya akan terhapus dan tidak bisa dikembalikan.");
              if (yakin) jalankan(() => hapusPengguna(id));
            }}
            className="rounded-lg px-3 py-1.5 text-sm text-rose-600 hover:bg-rose-50 disabled:opacity-50">
            🗑️ Hapus akun
          </button>
        )}
        {status !== "menunggu" && !diriSendiri && (
          <button disabled={sibuk} onClick={() => jalankan(() => verifikasiAlumni(id, "menunggu"))}
            className="rounded-lg px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-100 disabled:opacity-50">
            Kembalikan ke antrean
          </button>
        )}

        <label className="ml-auto flex items-center gap-2 text-sm text-slate-500">
          Peran
          <select defaultValue={peran} disabled={sibuk || diriSendiri}
            onChange={(e) => {
              const baru = e.target.value as Peran;
              if (baru === "admin" && !confirm("Jadikan admin? Admin bisa melihat SELURUH data pribadi alumni dan mengubah peran orang lain.")) {
                e.target.value = peran; return;
              }
              jalankan(() => ubahPeran(id, baru));
            }}
            className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-700 disabled:opacity-50">
            <option value="pending">pending</option>
            <option value="alumni">alumni</option>
            <option value="pengurus">pengurus (kelola konten)</option>
            <option value="admin">admin (akses penuh)</option>
          </select>
        </label>
      </div>

      {modeTolak && (
        <div className="mt-3 flex flex-wrap gap-2">
          <input value={catatan} onChange={(e) => setCatatan(e.target.value)}
            placeholder="Alasan (akan dilihat pendaftar), mis: NIM tidak ditemukan di arsip"
            className="min-w-64 flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm" />
          <button disabled={sibuk} onClick={() => jalankan(() => verifikasiAlumni(id, "ditolak", catatan))}
            className="rounded-lg bg-rose-600 px-3.5 py-1.5 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-50">
            Tolak
          </button>
        </div>
      )}
      {galat && <p className="mt-2 text-sm text-rose-600">{galat}</p>}
    </div>
  );
}
