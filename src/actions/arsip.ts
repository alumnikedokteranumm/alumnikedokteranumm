"use server";

import { revalidatePath } from "next/cache";
import { buatKlienServer } from "@/lib/supabase/server";
import { wajibPengurus } from "@/lib/sesi";
import type { HasilAksi } from "./autentikasi";

type BarisArsip = { nama: string; nim: string | null; angkatan: number | null; tahun_lulus: number | null; keterangan: string | null };

const tahun = (v: string | undefined) => {
  const n = Number((v ?? "").trim());
  return Number.isInteger(n) && n >= 1980 && n <= 2100 ? n : null;
};

/**
 * Impor tempel dari Excel / Google Sheets. Satu baris per lulusan, kolom:
 *   Nama ; NIM ; Angkatan ; Tahun lulus ; Keterangan
 * Pemisah boleh tab (hasil salin dari spreadsheet), titik koma, atau koma.
 * NIM yang sudah ada diperbarui, bukan digandakan.
 */
export async function imporArsip(_s: HasilAksi, d: FormData): Promise<HasilAksi> {
  await wajibPengurus();
  const teks = String(d.get("data") ?? "").replace(/\r/g, "");
  const baris: BarisArsip[] = [];
  const lewati: number[] = [];

  teks.split("\n").forEach((mentah, i) => {
    if (!mentah.trim()) return;
    const kol = mentah.split(mentah.includes("\t") ? "\t" : mentah.includes(";") ? ";" : ",").map((k) => k.trim());
    const nama = kol[0]?.replace(/^"|"$/g, "");
    // Lewati baris judul kolom
    if (!nama || /^nama$/i.test(nama)) return;
    const lulus = tahun(kol[3]);
    if (nama.length < 3 || (!lulus && !tahun(kol[2]))) { lewati.push(i + 1); return; }
    baris.push({ nama: nama.slice(0, 150), nim: kol[1] || null, angkatan: tahun(kol[2]), tahun_lulus: lulus, keterangan: kol[4]?.slice(0, 200) || null });
  });

  if (!baris.length) return { galat: "Tidak ada baris yang bisa dibaca. Periksa format: Nama ; NIM ; Angkatan ; Tahun lulus." };

  const supabase = await buatKlienServer();
  const denganNim = baris.filter((b) => b.nim);
  // NIM ganda dalam satu tempelan: ambil yang terakhir
  const unik = [...new Map(denganNim.map((b) => [b.nim, b])).values()];
  const tanpaNim = baris.filter((b) => !b.nim);

  if (unik.length) {
    const { error } = await supabase.from("arsip_lulusan").upsert(unik, { onConflict: "nim" });
    if (error) return { galat: `Gagal menyimpan: ${error.message}` };
  }
  if (tanpaNim.length) {
    const { error } = await supabase.from("arsip_lulusan").insert(tanpaNim);
    if (error) return { galat: `Gagal menyimpan: ${error.message}` };
  }
  revalidatePath("/admin/arsip");
  revalidatePath("/arsip-lulusan");
  return {
    sukses: `${unik.length + tanpaNim.length} lulusan tersimpan.` +
      (lewati.length ? ` Baris dilewati (nama/tahun tidak terbaca): ${lewati.slice(0, 15).join(", ")}${lewati.length > 15 ? "…" : ""}.` : ""),
  };
}

export async function hapusArsip(id: string): Promise<string | null> {
  await wajibPengurus();
  const supabase = await buatKlienServer();
  const { error } = await supabase.from("arsip_lulusan").delete().eq("id", id);
  if (error) return error.message;
  revalidatePath("/admin/arsip");
  revalidatePath("/arsip-lulusan");
  return null;
}
