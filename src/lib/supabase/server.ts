import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SUPABASE_ANON, SUPABASE_URL } from "@/lib/konfig";

/**
 * Klien Supabase untuk Server Component / Server Action.
 * Memakai kunci "anon", jadi semua aturan Row Level Security tetap berlaku.
 */
export async function buatKlienServer() {
  const cookieStore = await cookies();

  return createServerClient(
    SUPABASE_URL,
    SUPABASE_ANON,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(daftarCookie: { name: string; value: string; options: CookieOptions }[]) {
          try {
            daftarCookie.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Dipanggil dari Server Component — penyegaran sesi sudah
            // ditangani oleh middleware, jadi aman diabaikan.
          }
        },
      },
    },
  );
}
