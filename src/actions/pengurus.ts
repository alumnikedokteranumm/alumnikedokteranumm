"use server";

import { revalidatePath } from "next/cache";
import { buatKlienServer } from "@/lib/supabase/server";
import { wajibPengurus } from "@/lib/sesi";
import { namaDivisi } from "@/lib/pengurus";
import type { HasilAksi } from "./autentikasi";

/* Pesan dari `throw` disamarkan Next.js di produksi, jadi aksi mengembalikan
   pesan galat sebagai nilai biasa. */

function segarkan() {
  revalidatePath("/admin/pengurus");
  revalidatePath("/", "layout"); // halaman Tentang + foto ketua di beranda
}

/** Tambah (id = null) atau ubah satu pengurus. Jabatan sudah dirakit formulir. */
export async function simpanOrang(id: string | null, _s: HasilAksi, d: FormData): Promise<HasilAksi> {
  await wajibPengurus();
  const nama = String(d.get("nama") ?? "").trim().slice(0, 150);
  const jabatan = String(d.get("jabatan") ?? "").trim().replace(/\s+/g, " ").slice(0, 120);
  const foto_url = String(d.get("foto_url") ?? "").trim() || null;
  if (nama.length < 3) return { galat: "Nama lengkap wajib diisi." };
  if (!jabatan) return { galat: "Jabatan wajib diisi." };

  const supabase = await buatKlienServer();
  if (id) {
    const { error } = await supabase.from("pengurus").update({ nama, jabatan, foto_url }).eq("id", id);
    if (error) return { galat: error.message };
  } else {
    // Pengurus baru ditaruh paling akhir di kelompoknya; periode mengikuti yang sudah ada
    const { data: akhir } = await supabase.from("pengurus").select("urutan, periode")
      .order("urutan", { ascending: false, nullsFirst: false }).limit(1).maybeSingle();
    const { error } = await supabase.from("pengurus").insert({
      nama, jabatan, foto_url, periode: akhir?.periode ?? null, urutan: (akhir?.urutan ?? 0) + 1,
    });
    if (error) return { galat: error.message };
  }
  segarkan();
  return { sukses: id ? "Perubahan tersimpan." : `${nama} ditambahkan.` };
}

export async function hapusOrang(id: string): Promise<string | null> {
  await wajibPengurus();
  const supabase = await buatKlienServer();
  const { error } = await supabase.from("pengurus").delete().eq("id", id);
  if (error) return error.message;
  segarkan();
  return null;
}

/** Simpan urutan baru seluruh pengurus (daftar id sesuai urutan tampil). */
export async function simpanUrutan(ids: string[]): Promise<string | null> {
  await wajibPengurus();
  if (!ids.every((x) => /^[0-9a-f-]{36}$/i.test(x))) return "Data urutan tidak valid.";
  const supabase = await buatKlienServer();
  const hasil = await Promise.all(ids.map((id, i) => supabase.from("pengurus").update({ urutan: i + 1 }).eq("id", id)));
  const galat = hasil.find((h) => h.error)?.error;
  if (galat) return galat.message;
  segarkan();
  return null;
}

/** Ganti nama divisi: jabatan semua anggota & ketuanya ikut berubah. */
export async function gantiNamaDivisi(lama: string, baru: string): Promise<string | null> {
  await wajibPengurus();
  const namaBaru = namaDivisi(baru);
  if (!namaBaru) return "Nama divisi wajib diisi.";
  const supabase = await buatKlienServer();
  const { data } = await supabase.from("pengurus").select("id, jabatan");
  const kecil = lama.toLowerCase();
  const ubah = (data ?? []).flatMap((o) => {
    const j = o.jabatan.trim();
    if (j.toLowerCase() === kecil) return [{ id: o.id, jabatan: namaBaru }];
    if (/^(ketua|koordinator)\s+/i.test(j) && j.replace(/^(ketua|koordinator)\s+/i, "").toLowerCase() === kecil) {
      return [{ id: o.id, jabatan: `${j.match(/^(ketua|koordinator)/i)![0]} ${namaBaru}` }];
    }
    return [];
  });
  const hasil = await Promise.all(ubah.map((u) => supabase.from("pengurus").update({ jabatan: u.jabatan }).eq("id", u.id)));
  const galat = hasil.find((h) => h.error)?.error;
  if (galat) return galat.message;
  segarkan();
  return null;
}

/** Periode kepengurusan berlaku untuk semua pengurus. */
export async function simpanPeriode(periode: string): Promise<string | null> {
  await wajibPengurus();
  const nilai = periode.trim().slice(0, 40);
  if (!nilai) return "Periode wajib diisi, contoh: 2026–2031";
  const supabase = await buatKlienServer();
  const { error } = await supabase.from("pengurus").update({ periode: nilai }).not("id", "is", null);
  if (error) return error.message;
  segarkan();
  return null;
}
