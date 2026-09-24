"use client";

import { useState, useTransition } from "react";
import { periksaPembayaran } from "@/actions/keuangan";
import type { StatusPembayaran } from "@/lib/tipe";

export function AksiPembayaran({ id, status, buktiPath }: { id: string; status: StatusPembayaran; buktiPath: string | null }) {
  const [sibuk, mulai] = useTransition();
  const [catatan, setCatatan] = useState("");
  const [galat, setGalat] = useState<string | null>(null);

  const ubah = (baru: StatusPembayaran, tanya?: string) => {
    if (tanya && !confirm(tanya)) return;
    mulai(async () => {
      setGalat(null);
      const g = await periksaPembayaran(id, baru, catatan);
      if (g) setGalat(g);
    });
  };

  return (
    <div className="mt-4 border-t border-slate-100 pt-4">
      <div className="flex flex-wrap items-center gap-2">
        {buktiPath && (
          <a href={`/admin/pembayaran/bukti/${id}`} target="_blank" rel="noopener"
            className="rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
            🧾 Lihat bukti
          </a>
        )}
        <input value={catatan} onChange={(e) => setCatatan(e.target.value)} placeholder="Catatan untuk pembayar (opsional)"
          className="min-w-52 flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm" />
        {status !== "diterima" && (
          <button disabled={sibuk} onClick={() => ubah("diterima", "Dana sudah masuk ke rekening? Pembayaran akan dicatat di Buku Kas.")}
            className="rounded-lg bg-emerald-600 px-3.5 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50">
            ✓ Terima
          </button>
        )}
        {status !== "ditolak" && (
          <button disabled={sibuk}
            onClick={() => ubah("ditolak", status === "diterima"
              ? "Batalkan penerimaan? Catatan di Buku Kas dan angka terkumpul akan dikurangi kembali."
              : "Tolak konfirmasi ini? Tulis alasannya di kolom catatan.")}
            className="rounded-lg border border-rose-200 px-3.5 py-1.5 text-sm font-medium text-rose-600 hover:bg-rose-50 disabled:opacity-50">
            ✕ Tolak
          </button>
        )}
      </div>
      {galat && <p className="mt-2 text-sm text-rose-600">{galat}</p>}
    </div>
  );
}
