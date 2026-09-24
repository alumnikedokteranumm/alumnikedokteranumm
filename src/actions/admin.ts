"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { buatKlienServer } from "@/lib/supabase/server";
import { wajibAdmin, wajibPengurus } from "@/lib/sesi";
import { SKEMA, masukanWaktuKeIso } from "@/lib/skema-konten";
import { keSlug } from "@/lib/format";
import { idYoutube } from "@/lib/youtube";
import type { HasilAksi } from "./autentikasi";
import type { Peran, StatusVerifikasi } from "@/lib/tipe";

async function catatAudit(aksi: string, targetId: string | null, rincian?: Record<string, unknown>) {
  const supabase = await buatKlienServer();
  const { data: { user } } = await supabase.auth.getUser();
  await supabase.from("jejak_audit").insert({ aktor_id: user?.id, aksi, target_id: targetId, rincian: rincian ?? null });
}

function segarkanPublik() {
  revalidatePath("/", "layout");
}

/* =============================================================== ALUMNI */

export async function verifikasiAlumni(id: string, status: StatusVerifikasi, catatan?: string) {
  const { user } = await wajibAdmin();
  const supabase = await buatKlienServer();

  const perubahan: Record<string, unknown> = {
    status,
    catatan_admin: catatan?.trim() || null,
    diverifikasi_oleh: user.id,
    diverifikasi_pada: new Date().toISOString(),
  };
  // Alumni yang diterima otomatis naik dari "pending" ke "alumni"
  if (status === "terverifikasi") {
    const { data } = await supabase.from("profiles").select("peran").eq("id", id).single();
    if (data?.peran === "pending") perubahan.peran = "alumni";
  }

  const { error } = await supabase.from("profiles").update(perubahan).eq("id", id);
  if (error) throw new Error(error.message);
  await catatAudit(status === "terverifikasi" ? "verifikasi" : status === "ditolak" ? "tolak" : "set_menunggu", id, { catatan });
  revalidatePath("/admin/alumni");
  revalidatePath("/admin");
}

/** Hapus permanen akun pendaftar (mis. data asal ketik). Akun admin & diri sendiri ditolak database. */
export async function hapusPengguna(id: string) {
  await wajibAdmin();
  const supabase = await buatKlienServer();
  // Foto profil dihapus lebih dulu (policy storage mengizinkan admin menghapus)
  await supabase.storage.from("avatar").remove([`${id}/foto.jpg`]);
  const { error } = await supabase.rpc("hapus_pengguna", { target: id });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/alumni");
  revalidatePath("/admin");
  revalidatePath("/", "layout");
}

export async function ubahPeran(id: string, peran: Peran) {
  const { user } = await wajibAdmin();
  if (id === user.id && peran !== "admin") {
    throw new Error("Kamu tidak bisa menurunkan peranmu sendiri. Minta admin lain melakukannya.");
  }
  const supabase = await buatKlienServer();
  const { error } = await supabase.from("profiles").update({ peran }).eq("id", id);
  if (error) throw new Error(error.message);
  await catatAudit("ubah_peran", id, { peran });
  revalidatePath("/admin/alumni");
}

/* ============================================================== KONTEN */

export async function simpanKonten(jenis: string, id: string | null, _s: HasilAksi, d: FormData): Promise<HasilAksi> {
  const { user } = await wajibPengurus();
  const skema = SKEMA[jenis];
  if (!skema) return { galat: "Jenis konten tidak dikenal." };

  const baris: Record<string, unknown> = {};
  for (const b of skema.bidang) {
    const mentah = d.get(b.nama);
    const teks = typeof mentah === "string" ? mentah.trim() : "";

    switch (b.jenis) {
      case "centang":
        baris[b.nama] = mentah === "on";
        break;
      case "angka": {
        const n = Number(teks.replace(/[^\d.,-]/g, "").replace(",", "."));
        baris[b.nama] = teks === "" || !Number.isFinite(n) ? null : n;
        break;
      }
      case "waktu":
        baris[b.nama] = masukanWaktuKeIso(teks);
        break;
      case "url":
        if (teks && !/^https?:\/\//i.test(teks)) return { galat: `${b.label} harus diawali https://` };
        baris[b.nama] = teks || null;
        break;
      default:
        baris[b.nama] = teks || null;
    }

    if (b.wajib && (baris[b.nama] === null || baris[b.nama] === "")) {
      return { galat: `${b.label} wajib diisi.` };
    }
  }

  // Aturan tambahan per jenis
  if (skema.tabel === "berita") {
    baris.konten = baris.konten ?? "";
    if (baris.terbit && !baris.terbit_pada) baris.terbit_pada = new Date().toISOString();
    if (!id) baris.penulis_id = user.id;
  }
  if (skema.tabel === "lowongan" && !id) baris.dibuat_oleh = user.id;
  if (skema.tabel === "video" && !idYoutube(String(baris.url_video ?? ""))) {
    return { galat: "Tautan video harus tautan YouTube yang valid, contoh: https://youtu.be/abc123XYZ00" };
  }
  if (skema.tabel === "acara" && baris.selesai && baris.mulai && String(baris.selesai) < String(baris.mulai)) {
    return { galat: "Waktu selesai tidak boleh sebelum waktu mulai." };
  }

  const supabase = await buatKlienServer();

  // Dokumen: bila berkas diganti, berkas lama dihapus dari penyimpanan
  let berkasLama: string | null = null;
  if (skema.tabel === "dokumen" && id) {
    const { data: lama } = await supabase.from("dokumen").select("file_path").eq("id", id).single();
    if (lama?.file_path && lama.file_path !== baris.file_path) berkasLama = lama.file_path;
  }

  if (skema.slugDari && !id) {
    const dasar = keSlug(String(baris[skema.slugDari] ?? "")) || "tanpa-judul";
    let slug = dasar;
    for (let i = 2; i < 50; i++) {
      const { data } = await supabase.from(skema.tabel).select("id").eq("slug", slug).maybeSingle();
      if (!data) break;
      slug = `${dasar}-${i}`;
    }
    baris.slug = slug;
  }

  const { data, error } = id
    ? await supabase.from(skema.tabel).update(baris).eq("id", id).select("id").single()
    : await supabase.from(skema.tabel).insert(baris).select("id").single();

  if (error) return { galat: `Gagal menyimpan: ${error.message}` };
  if (berkasLama) await supabase.storage.from("dokumen").remove([berkasLama]);

  segarkanPublik();
  if (!id) redirect(`/admin/konten/${jenis}/${data.id}?tersimpan=1`);
  return { sukses: "Perubahan tersimpan." };
}

export async function hapusKonten(jenis: string, id: string) {
  await wajibPengurus();
  const skema = SKEMA[jenis];
  if (!skema) throw new Error("Jenis konten tidak dikenal.");
  const supabase = await buatKlienServer();
  const { data: dok } = skema.tabel === "dokumen"
    ? await supabase.from("dokumen").select("file_path").eq("id", id).single()
    : { data: null };
  const { error } = await supabase.from(skema.tabel).delete().eq("id", id);
  if (error) throw new Error(error.message);
  if (dok?.file_path) await supabase.storage.from("dokumen").remove([dok.file_path]);
  await catatAudit(`hapus_${skema.tabel}`, id);
  segarkanPublik();
  redirect(`/admin/konten/${jenis}?dihapus=1`);
}

/* =============================================================== FOTO */

export async function tambahFoto(albumId: string, url: string, keterangan?: string) {
  await wajibPengurus();
  const supabase = await buatKlienServer();
  const { count } = await supabase.from("foto").select("id", { count: "exact", head: true }).eq("album_id", albumId);
  const { error } = await supabase.from("foto").insert({ album_id: albumId, url, keterangan: keterangan || null, urutan: count ?? 0 });
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/konten/album/${albumId}`);
  segarkanPublik();
}

export async function hapusFoto(fotoId: string, albumId: string) {
  await wajibPengurus();
  const supabase = await buatKlienServer();
  const { data } = await supabase.from("foto").select("url").eq("id", fotoId).single();
  await supabase.from("foto").delete().eq("id", fotoId);
  const path = data?.url?.split("/storage/v1/object/public/publik/")[1];
  if (path) await supabase.storage.from("publik").remove([decodeURIComponent(path)]);
  revalidatePath(`/admin/konten/album/${albumId}`);
  segarkanPublik();
}

/* ========================================================= PENGATURAN */

export async function simpanPengaturan(_s: HasilAksi, d: FormData): Promise<HasilAksi> {
  await wajibAdmin();
  const supabase = await buatKlienServer();
  const baris = [...d.entries()]
    .filter(([k]) => k.startsWith("p_"))
    .map(([k, v]) => ({ kunci: k.slice(2), nilai: String(v).trim() }));

  const { error } = await supabase.from("pengaturan").upsert(baris, { onConflict: "kunci" });
  if (error) return { galat: error.message };
  await catatAudit("ubah_pengaturan", null, { kunci: baris.map((b) => b.kunci) });
  segarkanPublik();
  return { sukses: "Pengaturan situs tersimpan." };
}
