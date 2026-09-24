"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { buatKlienServer } from "@/lib/supabase/server";
import { wajibMasuk } from "@/lib/sesi";
import { CARA_TEMU, TOPIK_MENTORING } from "@/lib/konstanta";
import type { HasilAksi } from "./autentikasi";
import type { StatusMentoring } from "@/lib/tipe";

/** Simpan / perbarui kesediaan menjadi mentor. */
export async function simpanMentor(_s: HasilAksi, d: FormData): Promise<HasilAksi> {
  const { user } = await wajibMasuk();
  const topik = d.getAll("topik").map(String).filter((t) => TOPIK_MENTORING.includes(t));
  const caraTemu = d.getAll("cara_temu").map(String).filter((t) => CARA_TEMU.includes(t));
  const pengantar = String(d.get("pengantar") ?? "").trim().slice(0, 600);
  const kuota = Math.min(20, Math.max(1, Math.trunc(Number(d.get("kuota_bulanan")) || 3)));
  const aktif = d.get("aktif") === "on";

  if (aktif && !topik.length) return { galat: "Pilih minimal satu topik yang ingin kamu bimbing." };
  if (aktif && !caraTemu.length) return { galat: "Pilih minimal satu cara bertemu." };
  if (aktif && pengantar.length < 20) return { galat: "Tulis perkenalan singkat minimal 20 karakter." };

  const supabase = await buatKlienServer();
  const { error } = await supabase.from("mentor").upsert({
    profil_id: user.id, aktif, topik, cara_temu: caraTemu, pengantar: pengantar || null, kuota_bulanan: kuota,
  });
  if (error) return { galat: `Gagal menyimpan: ${error.message}` };
  revalidatePath("/mentoring", "layout");
  return { sukses: aktif ? "Tersimpan. Profil mentormu sekarang tampil di halaman Mentoring." : "Tersimpan. Kamu tidak menerima permintaan baru untuk sementara." };
}

export async function ajukanMentoring(mentorId: string, _s: HasilAksi, d: FormData): Promise<HasilAksi> {
  await wajibMasuk();
  const supabase = await buatKlienServer();
  const { error } = await supabase.rpc("ajukan_mentoring", {
    p_mentor: mentorId,
    p_jenis: String(d.get("jenis") ?? "flash"),
    p_topik: String(d.get("topik") ?? ""),
    p_pesan: String(d.get("pesan") ?? ""),
  });
  if (error) return { galat: error.message };
  revalidatePath("/mentoring", "layout");
  redirect("/mentoring/saya?terkirim=1");
}

/** Mengembalikan pesan galat (atau null bila berhasil) — pesan dari `throw` disamarkan Next.js di produksi. */
export async function jawabMentoring(id: string, status: StatusMentoring, balasan?: string): Promise<string | null> {
  await wajibMasuk();
  const supabase = await buatKlienServer();
  const { error } = await supabase.rpc("jawab_mentoring", { p_id: id, p_status: status, p_balasan: balasan ?? null });
  if (error) return error.message;
  revalidatePath("/mentoring", "layout");
  return null;
}
