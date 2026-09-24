import { NextResponse, type NextRequest } from "next/server";
import { buatKlienServer } from "@/lib/supabase/server";
import { keCsv, responsCsv } from "@/lib/csv";
import { LABEL_PROFESI } from "@/lib/konstanta";
import type { StatusProfesi } from "@/lib/tipe";

/**
 * Ekspor daftar alumni (khusus admin). Sengaja TIDAK menyertakan nomor STR/SIP,
 * tanggal lahir, dan alamat lengkap — minimisasi data sesuai UU PDP Pasal 16.
 * Setiap ekspor dicatat di jejak audit.
 */
export async function GET(req: NextRequest) {
  const supabase = await buatKlienServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ galat: "Belum masuk" }, { status: 401 });
  const { data: saya } = await supabase.from("profiles").select("peran").eq("id", user.id).single();
  if (saya?.peran !== "admin") return NextResponse.json({ galat: "Khusus admin" }, { status: 403 });

  const status = req.nextUrl.searchParams.get("status") ?? "terverifikasi";
  let q = supabase.from("profiles").select(
    "gelar_depan, nama_lengkap, gelar_belakang, nim, jenis_kelamin, angkatan, tahun_lulus, email_kontak, no_hp, whatsapp, status_profesi, spesialisasi, tempat_kerja, jabatan, kota_kerja, provinsi_kerja, kota, provinsi, anggota_idi, status, peran, dibuat_pada",
  ).order("angkatan").order("nama_lengkap");
  if (status !== "semua") q = q.eq("status", status);
  const { data, error } = await q;
  if (error) return NextResponse.json({ galat: error.message }, { status: 500 });

  const baris = (data ?? []).map((r) => ({
    ...r,
    status_profesi: r.status_profesi ? LABEL_PROFESI[r.status_profesi as StatusProfesi] : "",
    anggota_idi: r.anggota_idi ? "Ya" : "Tidak",
    dibuat_pada: r.dibuat_pada?.slice(0, 10),
  }));

  await supabase.from("jejak_audit").insert({ aktor_id: user.id, aksi: "ekspor_alumni", rincian: { status, jumlah: baris.length } });

  const csv = keCsv(baris, [
    { kunci: "gelar_depan", judul: "Gelar Depan" }, { kunci: "nama_lengkap", judul: "Nama Lengkap" },
    { kunci: "gelar_belakang", judul: "Gelar Belakang" }, { kunci: "nim", judul: "NIM" },
    { kunci: "jenis_kelamin", judul: "L/P" }, { kunci: "angkatan", judul: "Angkatan" },
    { kunci: "tahun_lulus", judul: "Tahun Lulus" }, { kunci: "email_kontak", judul: "Email" },
    { kunci: "no_hp", judul: "No. HP" }, { kunci: "whatsapp", judul: "WhatsApp" },
    { kunci: "status_profesi", judul: "Status Profesi" }, { kunci: "spesialisasi", judul: "Spesialisasi" },
    { kunci: "tempat_kerja", judul: "Tempat Kerja" }, { kunci: "jabatan", judul: "Jabatan" },
    { kunci: "kota_kerja", judul: "Kota Kerja" }, { kunci: "provinsi_kerja", judul: "Provinsi Kerja" },
    { kunci: "kota", judul: "Kota Domisili" }, { kunci: "provinsi", judul: "Provinsi Domisili" },
    { kunci: "anggota_idi", judul: "Anggota IDI" }, { kunci: "status", judul: "Status Verifikasi" },
    { kunci: "peran", judul: "Peran" }, { kunci: "dibuat_pada", judul: "Tanggal Daftar" },
  ]);
  return responsCsv(csv, `alumni-${status}-${new Date().toISOString().slice(0, 10)}.csv`);
}
