"use server";

import { revalidatePath } from "next/cache";
import { buatKlienServer } from "@/lib/supabase/server";
import { wajibMasuk } from "@/lib/sesi";
import type { HasilAksi } from "./autentikasi";

const teks = (d: FormData, k: string, maks = 300) => {
  const v = String(d.get(k) ?? "").trim().slice(0, maks);
  return v === "" ? null : v;
};
const bilangan = (d: FormData, k: string) => {
  const v = Number(String(d.get(k) ?? "").trim());
  return Number.isFinite(v) && v > 0 ? Math.trunc(v) : null;
};
const centang = (d: FormData, k: string) => d.get(k) === "on";

function tautanAman(v: string | null) {
  if (!v) return null;
  const url = /^https?:\/\//i.test(v) ? v : `https://${v}`;
  try {
    const u = new URL(url);
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : null;
  } catch {
    return null;
  }
}

/** Simpan seluruh isian halaman Profil Saya. */
export async function simpanProfil(_s: HasilAksi, d: FormData): Promise<HasilAksi> {
  const { user } = await wajibMasuk();

  const nama = teks(d, "nama_lengkap", 120);
  if (!nama || nama.length < 3) return { galat: "Nama lengkap wajib diisi." };

  const angkatan = bilangan(d, "angkatan");
  const lulus = bilangan(d, "tahun_lulus");
  const tahunIni = new Date().getFullYear();
  if (angkatan && (angkatan < 1990 || angkatan > tahunIni)) return { galat: "Tahun angkatan tidak masuk akal." };
  if (lulus && (lulus < 1990 || lulus > tahunIni + 1)) return { galat: "Tahun lulus tidak masuk akal." };
  if (angkatan && lulus && lulus < angkatan) return { galat: "Tahun lulus tidak boleh lebih awal dari angkatan." };

  const visibilitas = String(d.get("visibilitas") ?? "alumni");
  const jk = String(d.get("jenis_kelamin") ?? "");

  const perubahan = {
    gelar_depan: teks(d, "gelar_depan", 40),
    nama_lengkap: nama,
    gelar_belakang: teks(d, "gelar_belakang", 80),
    nim: teks(d, "nim", 30),
    jenis_kelamin: jk === "L" || jk === "P" ? jk : null,
    tempat_lahir: teks(d, "tempat_lahir", 80),
    tanggal_lahir: teks(d, "tanggal_lahir", 10),
    angkatan,
    tahun_lulus: lulus,

    email_kontak: teks(d, "email_kontak", 120),
    no_hp: teks(d, "no_hp", 25),
    whatsapp: teks(d, "whatsapp", 25),
    alamat: teks(d, "alamat", 400),
    kota: teks(d, "kota", 80),
    provinsi: teks(d, "provinsi", 60),
    kode_pos: teks(d, "kode_pos", 10),
    negara: teks(d, "negara", 60) ?? "Indonesia",

    status_profesi: teks(d, "status_profesi", 30),
    spesialisasi: teks(d, "spesialisasi", 100),
    subspesialisasi: teks(d, "subspesialisasi", 100),
    tempat_kerja: teks(d, "tempat_kerja", 160),
    jabatan: teks(d, "jabatan", 100),
    kota_kerja: teks(d, "kota_kerja", 80),
    provinsi_kerja: teks(d, "provinsi_kerja", 60),
    no_str: teks(d, "no_str", 40),
    str_berlaku_sampai: teks(d, "str_berlaku_sampai", 10),
    no_sip: teks(d, "no_sip", 60),
    anggota_idi: centang(d, "anggota_idi"),
    cabang_idi: teks(d, "cabang_idi", 80),

    bio: teks(d, "bio", 600),
    linkedin: tautanAman(teks(d, "linkedin", 200)),
    instagram: teks(d, "instagram", 60)?.replace(/^@/, "") ?? null,
    situs_web: tautanAman(teks(d, "situs_web", 200)),

    visibilitas: ["publik", "alumni", "privat"].includes(visibilitas) ? visibilitas : "alumni",
    tampilkan_email: centang(d, "tampilkan_email"),
    tampilkan_no_hp: centang(d, "tampilkan_no_hp"),
    tampilkan_whatsapp: centang(d, "tampilkan_whatsapp"),
    tampilkan_alamat: centang(d, "tampilkan_alamat"),
    tampilkan_tempat_kerja: centang(d, "tampilkan_tempat_kerja"),
    tampilkan_tanggal_lahir: centang(d, "tampilkan_tanggal_lahir"),
    setuju_kebijakan: true,
  };

  const supabase = await buatKlienServer();
  const { error } = await supabase.from("profiles").update(perubahan).eq("id", user.id);

  if (error) {
    if (error.code === "23505") return { galat: "NIM tersebut sudah dipakai akun lain. Hubungi pengurus bila ini keliru." };
    return { galat: `Gagal menyimpan: ${error.message}` };
  }

  revalidatePath("/profil");
  revalidatePath("/direktori");
  return { sukses: "Profil tersimpan." };
}

/** Dipanggil setelah browser selesai mengunggah foto ke bucket "avatar". */
export async function simpanFotoProfil(path: string | null) {
  const { user } = await wajibMasuk();
  if (path && !path.startsWith(`${user.id}/`)) throw new Error("Path foto tidak sah.");

  const supabase = await buatKlienServer();
  const { error } = await supabase.from("profiles").update({ foto_path: path }).eq("id", user.id);
  if (error) throw new Error(error.message);
  // "layout" supaya foto kecil di header ikut diperbarui, bukan hanya halaman profil
  revalidatePath("/", "layout");
}
