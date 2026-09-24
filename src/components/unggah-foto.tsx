"use client";

import { useRef, useState, useTransition } from "react";
import { buatKlienBrowser } from "@/lib/supabase/client";
import { simpanFotoProfil } from "@/actions/profil";
import { inisial, warnaAvatar } from "@/lib/format";

const MAKS_BYTE = 2 * 1024 * 1024;
const JENIS_SAH = ["image/jpeg", "image/png", "image/webp"];

/** Perkecil foto di browser dulu supaya hemat kuota & cepat dimuat. */
async function perkecil(berkas: File, sisi = 512): Promise<Blob> {
  const bitmap = await createImageBitmap(berkas);
  const skala = Math.min(1, sisi / Math.max(bitmap.width, bitmap.height));
  const kanvas = document.createElement("canvas");
  kanvas.width = Math.round(bitmap.width * skala);
  kanvas.height = Math.round(bitmap.height * skala);
  kanvas.getContext("2d")!.drawImage(bitmap, 0, 0, kanvas.width, kanvas.height);
  return new Promise((ok, gagal) =>
    kanvas.toBlob((b) => (b ? ok(b) : gagal(new Error("Gagal memproses foto"))), "image/jpeg", 0.86),
  );
}

export function UnggahFoto({
  idPengguna, nama, urlAwal,
}: { idPengguna: string; nama: string; urlAwal: string | null }) {
  const [url, setUrl] = useState(urlAwal);
  const [galat, setGalat] = useState<string | null>(null);
  const [sibuk, mulai] = useTransition();
  const masukan = useRef<HTMLInputElement>(null);

  const pilih = (e: React.ChangeEvent<HTMLInputElement>) => {
    const berkas = e.target.files?.[0];
    e.target.value = "";
    if (!berkas) return;
    setGalat(null);
    if (!JENIS_SAH.includes(berkas.type)) return setGalat("Format harus JPG, PNG, atau WEBP.");
    if (berkas.size > MAKS_BYTE * 4) return setGalat("Ukuran foto terlalu besar (maks. 8 MB sebelum diperkecil).");

    mulai(async () => {
      try {
        const blob = await perkecil(berkas);
        const path = `${idPengguna}/foto.jpg`;
        const supabase = buatKlienBrowser();
        const { error } = await supabase.storage.from("avatar")
          .upload(path, blob, { upsert: true, contentType: "image/jpeg", cacheControl: "60" });
        if (error) throw error;
        await simpanFotoProfil(path);
        const { data } = await supabase.storage.from("avatar").createSignedUrl(path, 3600);
        setUrl(data?.signedUrl ? `${data.signedUrl}&t=${Date.now()}` : null);
      } catch (err) {
        setGalat(err instanceof Error ? err.message : "Gagal mengunggah foto.");
      }
    });
  };

  const hapus = () =>
    mulai(async () => {
      const supabase = buatKlienBrowser();
      await supabase.storage.from("avatar").remove([`${idPengguna}/foto.jpg`]);
      await simpanFotoProfil(null);
      setUrl(null);
    });

  return (
    <div className="flex flex-wrap items-center gap-5">
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="Foto profil" className="size-24 rounded-full object-cover ring-4 ring-merek-50" />
      ) : (
        <span className={`grid size-24 place-items-center rounded-full text-2xl font-bold ring-4 ring-merek-50 ${warnaAvatar(nama || "A")}`}>
          {inisial(nama || "Alumni")}
        </span>
      )}
      <div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => masukan.current?.click()} disabled={sibuk}
            className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">
            {sibuk ? "Memproses…" : url ? "Ganti foto" : "Unggah foto"}
          </button>
          {url && (
            <button type="button" onClick={hapus} disabled={sibuk}
              className="rounded-lg px-3.5 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 disabled:opacity-50">
              Hapus
            </button>
          )}
        </div>
        <p className="mt-2 text-xs text-slate-500">JPG/PNG/WEBP. Foto hanya terlihat oleh alumni terverifikasi.</p>
        {galat && <p className="mt-1.5 text-xs text-rose-600">{galat}</p>}
        <input ref={masukan} type="file" accept={JENIS_SAH.join(",")} onChange={pilih} className="hidden" />
      </div>
    </div>
  );
}
