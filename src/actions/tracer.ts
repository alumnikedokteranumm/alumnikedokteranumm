"use server";

import { revalidatePath } from "next/cache";
import { buatKlienServer } from "@/lib/supabase/server";
import { wajibMasuk } from "@/lib/sesi";
import { KOMPETENSI } from "@/lib/konstanta";
import type { HasilAksi } from "./autentikasi";

const t = (d: FormData, k: string) => {
  const v = String(d.get(k) ?? "").trim().slice(0, 1000);
  return v || null;
};
const skala = (d: FormData, k: string) => {
  const v = Number(d.get(k));
  return v >= 1 && v <= 5 ? v : null;
};

export async function simpanTracer(_s: HasilAksi, d: FormData): Promise<HasilAksi> {
  const { user, profil } = await wajibMasuk();
  if (profil?.status !== "terverifikasi") return { galat: "Tracer study hanya untuk alumni terverifikasi." };

  const tunggu = Number(d.get("masa_tunggu_bulan"));
  const isian: Record<string, unknown> = {
    profil_id: user.id,
    tahun_pengisian: new Date().getFullYear(),
    tahun_lulus: profil.tahun_lulus,
    status_saat_ini: t(d, "status_saat_ini"),
    masa_tunggu_bulan: Number.isFinite(tunggu) && tunggu >= 0 && tunggu <= 240 ? Math.round(tunggu) : null,
    cara_dapat_kerja: t(d, "cara_dapat_kerja"),
    jenis_instansi: t(d, "jenis_instansi"),
    tingkat_instansi: t(d, "tingkat_instansi"),
    posisi: t(d, "posisi"),
    lokasi_kerja: t(d, "lokasi_kerja"),
    rentang_pendapatan: t(d, "rentang_pendapatan"),
    kesesuaian_bidang: skala(d, "kesesuaian_bidang"),
    tingkat_pendidikan_sesuai: t(d, "tingkat_pendidikan_sesuai"),
    kepuasan_pendidikan: skala(d, "kepuasan_pendidikan"),
    saran: t(d, "saran"),
  };
  for (const k of KOMPETENSI) isian[k.kunci] = skala(d, k.kunci);

  if (!isian.status_saat_ini) return { galat: "Bagian A: status saat ini wajib dipilih." };

  const supabase = await buatKlienServer();
  const { error } = await supabase.from("tracer").upsert(isian, { onConflict: "profil_id,tahun_pengisian" });
  if (error) return { galat: `Gagal menyimpan: ${error.message}` };

  revalidatePath("/tracer-study");
  return { sukses: "Terima kasih! Jawabanmu tersimpan. Kamu bisa memperbaruinya kapan saja sepanjang tahun ini." };
}
