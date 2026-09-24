import "server-only";
import { cache } from "react";
import { buatKlienServer } from "./supabase/server";
import { SUPABASE_SIAP } from "./konfig";
import type { Profil } from "./tipe";
import { PENGATURAN_BAWAAN } from "./konstanta";

/**
 * Ambil pengguna + profilnya untuk permintaan yang sedang berjalan.
 * Dibungkus cache() agar satu permintaan halaman hanya menanyakannya sekali.
 */
export const ambilSesi = cache(async () => {
  if (!SUPABASE_SIAP) return { user: null, profil: null as Profil | null };
  const supabase = await buatKlienServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { user: null, profil: null as Profil | null };

  const { data: profil } = await supabase
    .from("profiles").select("*").eq("id", user.id).maybeSingle();

  return { user, profil: (profil ?? null) as Profil | null };
});

export async function wajibMasuk() {
  const sesi = await ambilSesi();
  if (!sesi.user) throw new Error("Silakan masuk terlebih dahulu.");
  return sesi;
}

export async function wajibPengurus() {
  const sesi = await wajibMasuk();
  if (!sesi.profil || !["admin", "pengurus"].includes(sesi.profil.peran)) {
    throw new Error("Halaman ini khusus pengurus.");
  }
  return sesi;
}

export async function wajibAdmin() {
  const sesi = await wajibMasuk();
  if (sesi.profil?.peran !== "admin") throw new Error("Tindakan ini khusus admin.");
  return sesi;
}

/** Ubah path foto di bucket tertutup jadi tautan sementara (1 jam). */
export async function tautanFoto(path: string | null | undefined) {
  if (!path || !SUPABASE_SIAP) return null;
  const supabase = await buatKlienServer();
  const { data } = await supabase.storage.from("avatar").createSignedUrl(path, 3600);
  return data?.signedUrl ?? null;
}

export async function tautanFotoBanyak(daftar: (string | null)[]) {
  const bersih = daftar.filter(Boolean) as string[];
  if (!bersih.length || !SUPABASE_SIAP) return new Map<string, string>();
  const supabase = await buatKlienServer();
  const { data } = await supabase.storage.from("avatar").createSignedUrls(bersih, 3600);
  const peta = new Map<string, string>();
  data?.forEach((d) => { if (d.path && d.signedUrl) peta.set(d.path, d.signedUrl); });
  return peta;
}

/** Baca tabel pengaturan jadi objek biasa. */
export const ambilPengaturan = cache(async () => {
  if (!SUPABASE_SIAP) return { ...PENGATURAN_BAWAAN };
  const supabase = await buatKlienServer();
  const { data } = await supabase.from("pengaturan").select("kunci, nilai");
  const hasil: Record<string, string> = { ...PENGATURAN_BAWAAN };
  // Nilai dari database menggantikan bawaan, kecuali bila dikosongkan untuk kolom yang punya bawaan
  data?.forEach((r) => { if (r.nilai?.trim() || !(r.kunci in PENGATURAN_BAWAAN)) hasil[r.kunci] = r.nilai ?? ""; });
  return hasil;
});
