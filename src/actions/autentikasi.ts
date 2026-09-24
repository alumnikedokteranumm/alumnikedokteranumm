"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { buatKlienServer } from "@/lib/supabase/server";

export type HasilAksi = { galat?: string; sukses?: string } | null;

function pesanRamah(kode: string) {
  const peta: Record<string, string> = {
    "Invalid login credentials": "Email atau kata sandi salah.",
    "Email not confirmed": "Email belum dikonfirmasi. Silakan cek kotak masuk email kamu.",
    "User already registered": "Email ini sudah terdaftar. Silakan masuk atau gunakan fitur lupa kata sandi.",
    "Password should be at least 6 characters": "Kata sandi minimal 8 karakter.",
    "Email rate limit exceeded": "Terlalu banyak percobaan. Coba lagi beberapa menit lagi.",
    "For security purposes, you can only request this after 60 seconds":
      "Demi keamanan, tunggu 60 detik sebelum mencoba lagi.",
  };
  return peta[kode] ?? kode;
}

async function asalSitus() {
  const h = await headers();
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    (h.get("origin") ?? `https://${h.get("host") ?? "localhost:3000"}`)
  );
}

/* ------------------------------------------------------------------ MASUK */
export async function aksiMasuk(_sebelum: HasilAksi, data: FormData): Promise<HasilAksi> {
  const email = String(data.get("email") ?? "").trim().toLowerCase();
  const sandi = String(data.get("sandi") ?? "");
  const lanjut = String(data.get("lanjut") ?? "");

  if (!email || !sandi) return { galat: "Email dan kata sandi wajib diisi." };

  const supabase = await buatKlienServer();
  const { error } = await supabase.auth.signInWithPassword({ email, password: sandi });
  if (error) return { galat: pesanRamah(error.message) };

  revalidatePath("/", "layout");
  redirect(lanjut && lanjut.startsWith("/") ? lanjut : "/profil");
}

/* ----------------------------------------------------------------- DAFTAR */
export async function aksiDaftar(_sebelum: HasilAksi, data: FormData): Promise<HasilAksi> {
  const nama = String(data.get("nama_lengkap") ?? "").trim();
  const email = String(data.get("email") ?? "").trim().toLowerCase();
  const sandi = String(data.get("sandi") ?? "");
  const ulangi = String(data.get("ulangi") ?? "");
  const setuju = data.get("setuju") === "on";

  if (nama.length < 3) return { galat: "Nama lengkap wajib diisi (minimal 3 huruf)." };
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { galat: "Format email tidak sah." };
  if (sandi.length < 8) return { galat: "Kata sandi minimal 8 karakter." };
  if (sandi !== ulangi) return { galat: "Konfirmasi kata sandi tidak sama." };
  if (!setuju) return { galat: "Kamu perlu menyetujui Kebijakan Privasi untuk mendaftar." };

  const supabase = await buatKlienServer();
  const { data: hasil, error } = await supabase.auth.signUp({
    email,
    password: sandi,
    options: {
      data: { nama_lengkap: nama, setuju_kebijakan: true },
      emailRedirectTo: `${await asalSitus()}/auth/callback?lanjut=/profil`,
    },
  });
  if (error) return { galat: pesanRamah(error.message) };

  // Persetujuan kebijakan privasi dicatat oleh trigger database dari metadata di atas.
  if (hasil.session) {
    revalidatePath("/", "layout");
    redirect("/profil?baru=1");
  }

  return {
    sukses:
      "Pendaftaran diterima. Kami mengirim tautan konfirmasi ke emailmu — buka tautan itu untuk mengaktifkan akun, lalu lengkapi profil.",
  };
}

/* ------------------------------------------------------------ LUPA SANDI */
export async function aksiLupaSandi(_sebelum: HasilAksi, data: FormData): Promise<HasilAksi> {
  const email = String(data.get("email") ?? "").trim().toLowerCase();
  if (!email) return { galat: "Masukkan email kamu." };

  const supabase = await buatKlienServer();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${await asalSitus()}/auth/callback?lanjut=/atur-ulang-sandi`,
  });
  if (error) return { galat: pesanRamah(error.message) };

  // Jawaban sengaja dibuat sama, terdaftar atau tidak, supaya orang luar
  // tidak bisa menebak email mana yang terdaftar sebagai alumni.
  return {
    sukses:
      "Bila email tersebut terdaftar, kami sudah mengirimkan tautan untuk mengatur ulang kata sandi. Silakan cek kotak masuk dan folder spam.",
  };
}

/* -------------------------------------------------------- GANTI KATA SANDI */
export async function aksiGantiSandi(_sebelum: HasilAksi, data: FormData): Promise<HasilAksi> {
  const sandi = String(data.get("sandi") ?? "");
  const ulangi = String(data.get("ulangi") ?? "");
  if (sandi.length < 8) return { galat: "Kata sandi minimal 8 karakter." };
  if (sandi !== ulangi) return { galat: "Konfirmasi kata sandi tidak sama." };

  const supabase = await buatKlienServer();
  const { error } = await supabase.auth.updateUser({ password: sandi });
  if (error) return { galat: pesanRamah(error.message) };

  revalidatePath("/", "layout");
  redirect("/profil?sandi=1");
}

/* ----------------------------------------------------------------- KELUAR */
export async function aksiKeluar() {
  const supabase = await buatKlienServer();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
