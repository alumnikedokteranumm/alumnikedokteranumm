"use client";

import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_ANON, SUPABASE_URL } from "@/lib/konfig";

/** Klien Supabase untuk komponen yang berjalan di browser. */
export function buatKlienBrowser() {
  return createBrowserClient(
    SUPABASE_URL,
    SUPABASE_ANON,
  );
}
