"use server";

import { revalidatePath } from "next/cache";
import { buatKlienServer } from "@/lib/supabase/server";
import { wajibMasuk, wajibPengurus } from "@/lib/sesi";
import type { HasilAksi } from "./autentikasi";

/* Pesan dari `throw` disamarkan Next.js di produksi, jadi semua aksi di sini
   mengembalikan pesan galat sebagai nilai biasa. */

function segarkan(acaraId?: string) {
  revalidatePath("/skp");
  if (acaraId) revalidatePath(`/skp/${acaraId}`);
}

/* ============================================================ PESERTA */

export async function daftarAcara(acaraId: string): Promise<{ galat?: string; status?: string }> {
  await wajibMasuk();
  const supabase = await buatKlienServer();
  const { data, error } = await supabase.rpc("daftar_acara", { p_acara: acaraId });
  if (error) return { galat: error.message };
  segarkan(acaraId);
  return { status: String(data) };
}

export async function batalAcara(acaraId: string): Promise<string | null> {
  await wajibMasuk();
  const supabase = await buatKlienServer();
  const { error } = await supabase.rpc("batal_acara", { p_acara: acaraId });
  if (error) return error.message;
  segarkan(acaraId);
  return null;
}

export async function isiPresensi(acaraId: string, _s: HasilAksi, d: FormData): Promise<HasilAksi> {
  await wajibMasuk();
  const kode = String(d.get("kode") ?? "").trim();
  if (!kode) return { galat: "Masukkan kode presensi yang diumumkan panitia." };
  const supabase = await buatKlienServer();
  const { data, error } = await supabase.rpc("isi_presensi", { p_acara: acaraId, p_kode: kode });
  if (error) return { galat: error.message };
  if (data === "salah") return { galat: "Kode presensi salah. Periksa kembali huruf dan angkanya." };
  segarkan(acaraId);
  return { sukses: "Presensi tercatat. Terima kasih sudah hadir!" };
}

export async function kirimKuis(acaraId: string, jawaban: Record<string, number>): Promise<{ galat?: string; skor?: number }> {
  await wajibMasuk();
  const supabase = await buatKlienServer();
  const { data, error } = await supabase.rpc("kirim_kuis", { p_acara: acaraId, p_jawaban: jawaban });
  if (error) return { galat: error.message };
  segarkan(acaraId);
  return { skor: Number(data) };
}

export async function kirimEvaluasi(acaraId: string, _s: HasilAksi, d: FormData): Promise<HasilAksi> {
  await wajibMasuk();
  const nilai = (k: string) => Number(d.get(k)) || 0;
  const supabase = await buatKlienServer();
  const { error } = await supabase.rpc("kirim_evaluasi", {
    p_acara: acaraId,
    p_materi: nilai("materi"),
    p_narasumber: nilai("narasumber"),
    p_teknis: nilai("teknis"),
    p_saran: String(d.get("saran") ?? ""),
  });
  if (error) return { galat: error.message };
  segarkan(acaraId);
  return { sukses: "Evaluasi terkirim. Terima kasih atas masukanmu!" };
}

/* ====================================================== SKP MANDIRI */

export async function tambahSkpMandiri(_s: HasilAksi, d: FormData): Promise<HasilAksi> {
  const { user } = await wajibMasuk();
  const judul = String(d.get("judul") ?? "").trim().slice(0, 200);
  const tanggal = String(d.get("tanggal") ?? "");
  const jumlah = Number(String(d.get("jumlah_skp") ?? "").replace(",", "."));
  if (judul.length < 3) return { galat: "Nama kegiatan wajib diisi." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(tanggal)) return { galat: "Tanggal kegiatan wajib diisi." };
  if (!Number.isFinite(jumlah) || jumlah <= 0 || jumlah > 100) return { galat: "Jumlah SKP harus antara 0,01 dan 100." };

  const supabase = await buatKlienServer();
  const { error } = await supabase.from("skp_mandiri").insert({
    profil_id: user.id, judul, tanggal, jumlah_skp: jumlah,
    penyelenggara: String(d.get("penyelenggara") ?? "").trim().slice(0, 200) || null,
    catatan: String(d.get("catatan") ?? "").trim().slice(0, 500) || null,
  });
  if (error) return { galat: `Gagal menyimpan: ${error.message}` };
  revalidatePath("/skp");
  return { sukses: "Kegiatan SKP ditambahkan ke portofoliomu." };
}

export async function hapusSkpMandiri(id: string): Promise<string | null> {
  await wajibMasuk();
  const supabase = await buatKlienServer();
  const { error } = await supabase.from("skp_mandiri").delete().eq("id", id);
  if (error) return error.message;
  revalidatePath("/skp");
  return null;
}

/* ============================================================ PENGURUS */

export async function simpanRuang(acaraId: string, _s: HasilAksi, d: FormData): Promise<HasilAksi> {
  await wajibPengurus();
  const tautan = String(d.get("tautan_ruang") ?? "").trim();
  if (tautan && !/^https:\/\//i.test(tautan)) return { galat: "Tautan ruang harus diawali https://" };
  const supabase = await buatKlienServer();
  const { error } = await supabase.from("acara_rahasia").upsert({
    acara_id: acaraId,
    tautan_ruang: tautan || null,
    catatan_peserta: String(d.get("catatan_peserta") ?? "").trim() || null,
    kode_presensi: String(d.get("kode_presensi") ?? "").trim().toUpperCase() || null,
  });
  if (error) return { galat: error.message };
  revalidatePath(`/admin/webinar/${acaraId}`);
  segarkan(acaraId);
  return { sukses: "Tersimpan." };
}

/**
 * Format soal (satu blok per soal, dipisah baris kosong):
 *   Apa obat pilihan pertama anafilaksis?
 *   a. Difenhidramin
 *   *b. Epinefrin IM
 *   c. Deksametason
 * Tanda * menandai jawaban benar.
 */
export async function simpanSoal(acaraId: string, _s: HasilAksi, d: FormData): Promise<HasilAksi> {
  await wajibPengurus();
  const mentah = String(d.get("soal") ?? "").replace(/\r/g, "").trim();
  const blok = mentah ? mentah.split(/\n\s*\n/) : [];
  const soal: { acara_id: string; urutan: number; pertanyaan: string; opsi: string[]; kunci: number }[] = [];

  for (const [i, b] of blok.entries()) {
    const baris = b.split("\n").map((x) => x.trim()).filter(Boolean);
    const pertanyaan = baris[0]?.replace(/^\d+[.)]\s*/, "");
    const opsiMentah = baris.slice(1);
    const kunci = opsiMentah.findIndex((o) => o.startsWith("*"));
    const opsi = opsiMentah.map((o) => o.replace(/^\*?\s*[a-fA-F][.)]\s*/, "").replace(/^\*\s*/, ""));
    if (!pertanyaan || opsi.length < 2) return { galat: `Soal ${i + 1}: minimal 2 pilihan jawaban.` };
    if (opsi.length > 6) return { galat: `Soal ${i + 1}: maksimal 6 pilihan jawaban.` };
    if (kunci < 0) return { galat: `Soal ${i + 1}: tandai jawaban benar dengan * di depannya.` };
    if (opsiMentah.filter((o) => o.startsWith("*")).length > 1) return { galat: `Soal ${i + 1}: hanya boleh satu jawaban benar.` };
    soal.push({ acara_id: acaraId, urutan: i + 1, pertanyaan, opsi, kunci });
  }

  const supabase = await buatKlienServer();
  const { error: e1 } = await supabase.from("soal_kuis").delete().eq("acara_id", acaraId);
  if (e1) return { galat: e1.message };
  if (soal.length) {
    const { error: e2 } = await supabase.from("soal_kuis").insert(soal);
    if (e2) return { galat: e2.message };
  }
  revalidatePath(`/admin/webinar/${acaraId}`);
  return { sukses: soal.length ? `${soal.length} soal tersimpan.` : "Kuis dihapus — sertifikat terbit tanpa kuis." };
}

export async function tandaiHadir(pesertaId: string, acaraId: string): Promise<string | null> {
  await wajibPengurus();
  const supabase = await buatKlienServer();
  const { error } = await supabase.rpc("tandai_hadir_manual", { p_peserta: pesertaId });
  if (error) return error.message;
  revalidatePath(`/admin/webinar/${acaraId}`);
  return null;
}
