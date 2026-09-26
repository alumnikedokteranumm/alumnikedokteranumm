"use client";

import { useEffect, useRef, useState } from "react";
import { unggahKePublik } from "./unggah-gambar";

const D = 224;          // diameter lingkaran pratinjau (px)
const KELUAR = 600;     // ukuran foto hasil potongan (px, persegi)

type Atur = { src: string; w: number; h: number; zoom: number; x: number; y: number };

/** Batasi geseran supaya lingkaran selalu tertutup foto (tidak ada celah kosong). */
function batasi(a: Atur): Atur {
  const s = Math.max(D / a.w, D / a.h) * a.zoom;
  const lebih = { x: Math.max(0, (a.w * s - D) / 2), y: Math.max(0, (a.h * s - D) / 2) };
  return { ...a, x: Math.min(lebih.x, Math.max(-lebih.x, a.x)), y: Math.min(lebih.y, Math.max(-lebih.y, a.y)) };
}

/**
 * Unggah foto profil bulat: pilih foto → geser & perbesar di dalam lingkaran →
 * "Pakai foto ini" memotongnya jadi persegi 600px lalu mengunggahnya.
 * Nilainya (URL publik) dikirim lewat <input hidden name={nama}>.
 */
export function IsianFotoBulat({ nama, awal, folder }: { nama: string; awal: string | null; folder: string }) {
  const [url, setUrl] = useState(awal ?? "");
  const [atur, setAtur] = useState<Atur | null>(null);
  const [sibuk, setSibuk] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);
  const masukan = useRef<HTMLInputElement>(null);
  const seret = useRef<{ px: number; py: number; x: number; y: number } | null>(null);

  useEffect(() => () => { if (atur?.src.startsWith("blob:")) URL.revokeObjectURL(atur.src); }, [atur?.src]);

  const mulaiAtur = (src: string) => {
    setGalat(null);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => setAtur({ src, w: img.naturalWidth, h: img.naturalHeight, zoom: 1, x: 0, y: 0 });
    img.onerror = () => setGalat("Foto tidak bisa dibuka. Coba pilih ulang fotonya.");
    img.src = src;
  };

  const pilih = (f: File) => {
    if (!["image/jpeg", "image/png", "image/webp"].includes(f.type)) return setGalat("Format harus JPG, PNG, atau WEBP.");
    if (f.size > 15 * 1024 * 1024) return setGalat("Foto terlalu besar (maks. 15 MB).");
    mulaiAtur(URL.createObjectURL(f));
  };

  const pakai = async () => {
    if (!atur) return;
    setSibuk(true); setGalat(null);
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = atur.src;
      await img.decode();
      const s = Math.max(D / atur.w, D / atur.h) * atur.zoom;
      const kiri = D / 2 - (atur.w * s) / 2 + atur.x;
      const atas = D / 2 - (atur.h * s) / 2 + atur.y;
      const kanvas = document.createElement("canvas");
      kanvas.width = kanvas.height = KELUAR;
      const ctx = kanvas.getContext("2d")!;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, KELUAR, KELUAR);
      ctx.drawImage(img, -kiri / s, -atas / s, D / s, D / s, 0, 0, KELUAR, KELUAR);
      const blob = await new Promise<Blob>((ok, gagal) =>
        kanvas.toBlob((b) => (b ? ok(b) : gagal(new Error("Gagal memproses foto"))), "image/jpeg", 0.9));
      setUrl(await unggahKePublik(new File([blob], "foto.jpg", { type: "image/jpeg" }), folder));
      setAtur(null);
    } catch (e) {
      setGalat(e instanceof Error ? e.message : "Gagal mengunggah foto.");
    } finally {
      setSibuk(false);
    }
  };

  const s = atur ? Math.max(D / atur.w, D / atur.h) * atur.zoom : 1;

  return (
    <div>
      <input type="hidden" name={nama} value={url} />
      <div className="flex flex-wrap items-start gap-5">
        {atur ? (
          <div
            className="relative shrink-0 cursor-grab touch-none select-none overflow-hidden rounded-full bg-slate-200 ring-4 ring-merek-100 active:cursor-grabbing"
            style={{ width: D, height: D }}
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              seret.current = { px: e.clientX, py: e.clientY, x: atur.x, y: atur.y };
            }}
            onPointerMove={(e) => {
              const m = seret.current;
              if (m) setAtur(batasi({ ...atur, x: m.x + e.clientX - m.px, y: m.y + e.clientY - m.py }));
            }}
            onPointerUp={() => { seret.current = null; }}
            onPointerCancel={() => { seret.current = null; }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={atur.src} alt="" draggable={false} className="pointer-events-none absolute max-w-none"
              style={{
                width: atur.w * s, height: atur.h * s,
                left: D / 2 - (atur.w * s) / 2 + atur.x, top: D / 2 - (atur.h * s) / 2 + atur.y,
              }} />
          </div>
        ) : url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="Foto" className="shrink-0 rounded-full object-cover ring-4 ring-merek-50" style={{ width: D / 2, height: D / 2 }} />
        ) : (
          <div className="grid shrink-0 place-items-center rounded-full border-2 border-dashed border-slate-300 bg-slate-50 text-center text-xs text-slate-400"
            style={{ width: D / 2, height: D / 2 }}>Belum ada foto</div>
        )}

        <div className="min-w-0 flex-1 space-y-2.5 text-sm">
          {atur ? (
            <>
              <p className="text-slate-600"><strong>Geser foto</strong> di dalam lingkaran, lalu atur besar-kecilnya:</p>
              <label className="flex items-center gap-3">
                <span className="text-slate-500">Perbesar</span>
                <input type="range" min={1} max={3} step={0.01} value={atur.zoom}
                  onChange={(e) => setAtur(batasi({ ...atur, zoom: Number(e.target.value) }))} className="w-40 accent-merek-700" />
              </label>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={pakai} disabled={sibuk}
                  className="rounded-lg bg-merek-700 px-3.5 py-2 font-medium text-white hover:bg-merek-800 disabled:opacity-50">
                  {sibuk ? "Mengunggah…" : "✓ Pakai foto ini"}
                </button>
                <button type="button" onClick={() => setAtur(null)} disabled={sibuk}
                  className="rounded-lg px-3 py-2 text-slate-500 hover:bg-slate-100">Batal</button>
              </div>
              <p className="text-xs text-amber-700">Klik “Pakai foto ini” dulu sebelum menyimpan formulir.</p>
            </>
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => masukan.current?.click()}
                  className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 font-medium text-slate-700 hover:bg-slate-50">
                  {url ? "Ganti foto" : "Pilih foto"}
                </button>
                {url && (
                  <>
                    <button type="button" onClick={() => mulaiAtur(url)}
                      className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 font-medium text-slate-700 hover:bg-slate-50">
                      Atur posisi
                    </button>
                    <button type="button" onClick={() => setUrl("")} className="rounded-lg px-3 py-2 text-rose-600 hover:bg-rose-50">Hapus</button>
                  </>
                )}
              </div>
              <p className="text-xs text-slate-500">Setelah memilih foto, kamu bisa menggeser dan memperbesarnya. Tampilan bulat ini sama dengan di website.</p>
            </>
          )}
          {galat && <p className="text-rose-600">{galat}</p>}
        </div>
      </div>
      <input ref={masukan} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) pilih(f); }} />
    </div>
  );
}
