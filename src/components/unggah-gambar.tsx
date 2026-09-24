"use client";

import { useRef, useState } from "react";
import { buatKlienBrowser } from "@/lib/supabase/client";

const JENIS_SAH = ["image/jpeg", "image/png", "image/webp", "image/avif"];

/** Perkecil gambar besar di browser (sisi terpanjang maks. 1600px). */
async function siapkan(berkas: File, sisi = 1600): Promise<Blob> {
  const bitmap = await createImageBitmap(berkas);
  if (Math.max(bitmap.width, bitmap.height) <= sisi && berkas.size < 900_000) return berkas;
  const skala = sisi / Math.max(bitmap.width, bitmap.height);
  const kanvas = document.createElement("canvas");
  kanvas.width = Math.round(bitmap.width * Math.min(1, skala));
  kanvas.height = Math.round(bitmap.height * Math.min(1, skala));
  kanvas.getContext("2d")!.drawImage(bitmap, 0, 0, kanvas.width, kanvas.height);
  return new Promise((ok, gagal) => kanvas.toBlob((b) => (b ? ok(b) : gagal(new Error("Gagal memproses gambar"))), "image/jpeg", 0.85));
}

/** Unggah ke bucket "publik" lalu kembalikan URL publiknya. */
export async function unggahKePublik(berkas: File, folder: string) {
  if (!JENIS_SAH.includes(berkas.type)) throw new Error("Format harus JPG, PNG, WEBP, atau AVIF.");
  const blob = await siapkan(berkas);
  const nama = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
  const supabase = buatKlienBrowser();
  const { error } = await supabase.storage.from("publik").upload(nama, blob, { contentType: "image/jpeg", cacheControl: "31536000" });
  if (error) throw error;
  return supabase.storage.from("publik").getPublicUrl(nama).data.publicUrl;
}

/** Isian formulir untuk satu gambar. Nilainya dikirim lewat <input hidden>. */
export function IsianGambar({ nama, awal, folder }: { nama: string; awal: string | null; folder: string }) {
  const [url, setUrl] = useState(awal ?? "");
  const [sibuk, setSibuk] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);
  const masukan = useRef<HTMLInputElement>(null);

  return (
    <div>
      <input type="hidden" name={nama} value={url} />
      <div className="flex flex-wrap items-start gap-4">
        <div className="grid aspect-[16/10] w-48 place-items-center overflow-hidden rounded-lg border border-dashed border-slate-300 bg-slate-50">
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt="" className="size-full object-cover" />
          ) : (
            <span className="text-xs text-slate-400">Belum ada gambar</span>
          )}
        </div>
        <div className="space-y-2">
          <div className="flex gap-2">
            <button type="button" disabled={sibuk} onClick={() => masukan.current?.click()}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">
              {sibuk ? "Mengunggah…" : url ? "Ganti" : "Pilih gambar"}
            </button>
            {url && <button type="button" onClick={() => setUrl("")} className="rounded-lg px-3 py-1.5 text-sm text-rose-600 hover:bg-rose-50">Hapus</button>}
          </div>
          <p className="text-xs text-slate-500">Otomatis diperkecil. Maks. 5 MB.</p>
          {galat && <p className="text-xs text-rose-600">{galat}</p>}
        </div>
      </div>
      <input ref={masukan} type="file" accept={JENIS_SAH.join(",")} className="hidden"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (!f) return;
          setSibuk(true); setGalat(null);
          try { setUrl(await unggahKePublik(f, folder)); }
          catch (err) { setGalat(err instanceof Error ? err.message : "Gagal mengunggah"); }
          finally { setSibuk(false); }
        }} />
    </div>
  );
}
