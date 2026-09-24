"use client";

import { useRef, useState } from "react";
import { buatKlienBrowser } from "@/lib/supabase/client";
import { keSlug } from "@/lib/format";

const MAKS_BYTE = 25 * 1024 * 1024;
const JENIS_SAH: Record<string, string> = {
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.ms-excel": "xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "application/vnd.ms-powerpoint": "ppt",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
  "image/jpeg": "jpg",
  "image/png": "png",
};

function ukuran(b: number) {
  return b >= 1_048_576 ? `${(b / 1_048_576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`;
}

/**
 * Unggah berkas ke bucket TERTUTUP "dokumen". Mengisi tiga isian tersembunyi:
 * path berkas, nama asli berkas, dan ukurannya — dibaca saat formulir disimpan.
 */
export function IsianBerkas({ nama, awal }: {
  nama: string;
  awal: { path: string | null; namaFile: string | null; ukuran: number | null };
}) {
  const [berkas, setBerkas] = useState(awal);
  const [sibuk, setSibuk] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);
  const masukan = useRef<HTMLInputElement>(null);

  const pilih = async (f: File) => {
    setGalat(null);
    const ext = JENIS_SAH[f.type];
    if (!ext) return setGalat("Jenis berkas tidak didukung. Gunakan PDF, Word, Excel, PowerPoint, JPG, atau PNG.");
    if (f.size > MAKS_BYTE) return setGalat(`Berkas terlalu besar (${ukuran(f.size)}). Maksimal 25 MB — kompres PDF-nya dulu.`);

    setSibuk(true);
    try {
      const dasar = keSlug(f.name.replace(/\.[^.]+$/, "")) || "dokumen";
      const path = `${new Date().getFullYear()}/${Date.now()}-${dasar}.${ext}`;
      const { error } = await buatKlienBrowser().storage.from("dokumen")
        .upload(path, f, { contentType: f.type, upsert: false });
      if (error) throw error;
      setBerkas({ path, namaFile: f.name, ukuran: f.size });
    } catch (e) {
      setGalat(e instanceof Error ? e.message : "Gagal mengunggah berkas.");
    } finally {
      setSibuk(false);
    }
  };

  return (
    <div>
      <input type="hidden" name={nama} value={berkas.path ?? ""} />
      <input type="hidden" name="nama_file" value={berkas.namaFile ?? ""} />
      <input type="hidden" name="ukuran_byte" value={berkas.ukuran ?? ""} />

      <div className="flex flex-wrap items-center gap-4 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4">
        <span className="grid size-12 shrink-0 place-items-center rounded-lg bg-rose-50 text-xs font-bold text-rose-700 ring-1 ring-rose-200">
          {(berkas.namaFile?.split(".").pop() ?? "—").toUpperCase().slice(0, 4)}
        </span>
        <div className="min-w-0 flex-1">
          {berkas.path ? (
            <>
              <p className="truncate text-sm font-medium text-slate-800">{berkas.namaFile ?? berkas.path}</p>
              {berkas.ukuran ? <p className="text-xs text-slate-500">{ukuran(berkas.ukuran)} · tersimpan di penyimpanan tertutup</p> : null}
            </>
          ) : (
            <p className="text-sm text-slate-500">Belum ada berkas. PDF disarankan, maks. 25 MB.</p>
          )}
        </div>
        <button type="button" disabled={sibuk} onClick={() => masukan.current?.click()}
          className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">
          {sibuk ? "Mengunggah…" : berkas.path ? "Ganti berkas" : "Pilih berkas"}
        </button>
      </div>
      {galat && <p className="mt-2 text-sm text-rose-600">{galat}</p>}
      <input ref={masukan} type="file" className="hidden" accept={Object.keys(JENIS_SAH).join(",")}
        onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) pilih(f); }} />
    </div>
  );
}
