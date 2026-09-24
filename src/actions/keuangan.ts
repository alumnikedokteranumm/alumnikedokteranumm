"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { buatKlienServer } from "@/lib/supabase/server";
import { wajibMasuk, wajibPengurus } from "@/lib/sesi";
import type { HasilAksi } from "./autentikasi";
import type { StatusPembayaran } from "@/lib/tipe";

/** Alumni mengonfirmasi transfer (bukti sudah diunggah dari browser ke bucket "bukti"). */
export async function kirimPembayaran(_s: HasilAksi, d: FormData): Promise<HasilAksi> {
  await wajibMasuk();
  const jenis = String(d.get("jenis") ?? "");
  const nominal = Number(String(d.get("nominal") ?? "").replace(/\D/g, ""));
  const id = (k: string) => {
    const v = String(d.get(k) ?? "");
    return /^[0-9a-f-]{36}$/i.test(v) ? v : null;
  };

  const supabase = await buatKlienServer();
  const { error } = await supabase.rpc("kirim_pembayaran", {
    p_jenis: jenis,
    p_donasi: id("donasi_id"),
    p_acara: id("acara_id"),
    p_tahun: Number(d.get("tahun_iuran")) || null,
    p_nominal: nominal,
    p_tanggal: String(d.get("tanggal_transfer") ?? "") || null,
    p_bank: String(d.get("bank_pengirim") ?? "").trim() || null,
    p_atas_nama: String(d.get("atas_nama_pengirim") ?? "").trim() || null,
    p_bukti: String(d.get("bukti_path") ?? ""),
    p_catatan: String(d.get("catatan") ?? "").trim() || null,
    p_tampilkan_nama: d.get("tampilkan_nama") === "on",
  });
  if (error) return { galat: error.message };
  revalidatePath("/donasi", "layout");
  redirect("/donasi/saya?terkirim=1");
}

/** Bendahara/pengurus memeriksa konfirmasi transfer. */
export async function periksaPembayaran(id: string, status: StatusPembayaran, catatan?: string): Promise<string | null> {
  await wajibPengurus();
  const supabase = await buatKlienServer();
  const { error } = await supabase.rpc("periksa_pembayaran", { p_id: id, p_status: status, p_catatan: catatan ?? null });
  if (error) return error.message;
  revalidatePath("/admin/pembayaran");
  revalidatePath("/donasi", "layout");
  revalidatePath("/laporan-keuangan");
  return null;
}
