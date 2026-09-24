export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
// Supabase menyebut kunci ini "anon key" (lama) atau "publishable key" (baru) — keduanya diterima.
export const SUPABASE_ANON =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";

/**
 * Website tetap bisa dibuka walau Supabase belum disiapkan — halaman akan
 * tampil dengan data kosong dan sebuah petunjuk, bukan layar galat.
 * Nilai contoh dari .env.example ("xxxx", "...") dianggap belum diisi.
 */
export const SUPABASE_SIAP =
  /^https:\/\/.+/.test(SUPABASE_URL) &&
  !SUPABASE_URL.includes("xxxx") &&
  SUPABASE_ANON.length > 30 &&
  !SUPABASE_ANON.endsWith("...");
