import "server-only";
import { unstable_rethrow } from "next/navigation";
import { buatKlienServer } from "./supabase/server";
import { SUPABASE_SIAP } from "./konfig";
import type {
  Acara, Album, Berita, Dokumen, Donasi, Foto, Lowongan, Pengurus, StatistikPublik, Video,
} from "./tipe";

/** Bungkus semua pembacaan supaya galat jaringan tidak merusak halaman. */
async function aman<T>(kerja: () => Promise<T>, cadangan: T): Promise<T> {
  if (!SUPABASE_SIAP) return cadangan;
  try {
    return await kerja();
  } catch (e) {
    // Sinyal internal Next.js (halaman dinamis, redirect, notFound) harus diteruskan,
    // bukan ditelan — kalau ditelan, halaman bisa tersimpan statis dengan data kosong.
    unstable_rethrow(e);
    console.error("[data]", e);
    return cadangan;
  }
}

export const STATISTIK_KOSONG: StatistikPublik = {
  total_alumni: 0, total_angkatan: 0, total_spesialis: 0, total_kota: 0,
  sebaran_provinsi: [], sebaran_profesi: [],
};

export function ambilStatistik() {
  return aman(async () => {
    const supabase = await buatKlienServer();
    const { data } = await supabase.rpc("statistik_publik");
    return (data ?? STATISTIK_KOSONG) as StatistikPublik;
  }, STATISTIK_KOSONG);
}

export function ambilBerita(batas = 100, hanyaTerbit = true) {
  return aman(async () => {
    const supabase = await buatKlienServer();
    let kueri = supabase.from("berita").select("*").order("terbit_pada", { ascending: false, nullsFirst: false }).limit(batas);
    if (hanyaTerbit) kueri = kueri.eq("terbit", true);
    const { data } = await kueri;
    return (data ?? []) as Berita[];
  }, [] as Berita[]);
}

export function ambilSatuBerita(slug: string) {
  return aman(async () => {
    const supabase = await buatKlienServer();
    const { data } = await supabase.from("berita").select("*").eq("slug", slug).maybeSingle();
    return (data ?? null) as Berita | null;
  }, null as Berita | null);
}

export function ambilAcara({ mendatang, batas = 100, hanyaTerbit = true }:
  { mendatang?: boolean; batas?: number; hanyaTerbit?: boolean } = {}) {
  return aman(async () => {
    const supabase = await buatKlienServer();
    let kueri = supabase.from("acara").select("*").limit(batas);
    if (hanyaTerbit) kueri = kueri.eq("terbit", true);
    if (mendatang === true) kueri = kueri.gte("mulai", new Date().toISOString()).order("mulai", { ascending: true });
    else if (mendatang === false) kueri = kueri.lt("mulai", new Date().toISOString()).order("mulai", { ascending: false });
    else kueri = kueri.order("mulai", { ascending: false });
    const { data } = await kueri;
    return (data ?? []) as Acara[];
  }, [] as Acara[]);
}

export function ambilSatuAcara(slug: string) {
  return aman(async () => {
    const supabase = await buatKlienServer();
    const { data } = await supabase.from("acara").select("*").eq("slug", slug).maybeSingle();
    return (data ?? null) as Acara | null;
  }, null as Acara | null);
}

export function ambilAlbum(batas = 100, hanyaTerbit = true) {
  return aman(async () => {
    const supabase = await buatKlienServer();
    let kueri = supabase.from("album").select("*").order("tanggal", { ascending: false, nullsFirst: false }).limit(batas);
    if (hanyaTerbit) kueri = kueri.eq("terbit", true);
    const { data } = await kueri;
    return (data ?? []) as Album[];
  }, [] as Album[]);
}

export function ambilSatuAlbum(slug: string) {
  return aman(async () => {
    const supabase = await buatKlienServer();
    const { data: album } = await supabase.from("album").select("*").eq("slug", slug).maybeSingle();
    if (!album) return null;
    const { data: foto } = await supabase.from("foto").select("*").eq("album_id", album.id).order("urutan");
    return { album: album as Album, foto: (foto ?? []) as Foto[] };
  }, null as { album: Album; foto: Foto[] } | null);
}

export function ambilLowongan(batas = 100, hanyaTerbit = true) {
  return aman(async () => {
    const supabase = await buatKlienServer();
    let kueri = supabase.from("lowongan").select("*").order("dibuat_pada", { ascending: false }).limit(batas);
    if (hanyaTerbit) kueri = kueri.eq("terbit", true);
    const { data } = await kueri;
    return (data ?? []) as Lowongan[];
  }, [] as Lowongan[]);
}

export function ambilSatuLowongan(id: string) {
  return aman(async () => {
    const supabase = await buatKlienServer();
    const { data } = await supabase.from("lowongan").select("*").eq("id", id).maybeSingle();
    return (data ?? null) as Lowongan | null;
  }, null as Lowongan | null);
}

export function ambilDonasi() {
  return aman(async () => {
    const supabase = await buatKlienServer();
    const { data } = await supabase.from("donasi").select("*").eq("aktif", true).order("dibuat_pada");
    return (data ?? []) as Donasi[];
  }, [] as Donasi[]);
}

/** Nama donatur yang mengizinkan namanya tampil (tanpa nominal). */
export function ambilDonatur(donasiId: string) {
  return aman(async () => {
    const supabase = await buatKlienServer();
    const { data } = await supabase.rpc("donatur_program", { p_donasi: donasiId });
    return (data ?? []) as { nama: string; angkatan: number | null; tanggal: string }[];
  }, [] as { nama: string; angkatan: number | null; tanggal: string }[]);
}

export function ambilPengurus() {
  return aman(async () => {
    const supabase = await buatKlienServer();
    const { data } = await supabase.from("pengurus").select("*").order("urutan");
    return (data ?? []) as Pengurus[];
  }, [] as Pengurus[]);
}

/* ---- Khusus alumni terverifikasi: aturan RLS di database yang menyaring ---- */

export function ambilVideo() {
  return aman(async () => {
    const supabase = await buatKlienServer();
    const { data } = await supabase.from("video").select("*").eq("terbit", true)
      .order("tanggal", { ascending: false, nullsFirst: false }).order("dibuat_pada", { ascending: false });
    return (data ?? []) as Video[];
  }, [] as Video[]);
}

export function ambilSatuVideo(id: string) {
  return aman(async () => {
    const supabase = await buatKlienServer();
    const { data } = await supabase.from("video").select("*").eq("id", id).eq("terbit", true).maybeSingle();
    return (data ?? null) as Video | null;
  }, null as Video | null);
}

export function ambilDokumen() {
  return aman(async () => {
    const supabase = await buatKlienServer();
    const { data } = await supabase.from("dokumen").select("*").eq("terbit", true)
      .order("tanggal_dokumen", { ascending: false, nullsFirst: false });
    return (data ?? []) as Dokumen[];
  }, [] as Dokumen[]);
}
