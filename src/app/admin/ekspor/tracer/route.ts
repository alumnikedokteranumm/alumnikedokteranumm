import { NextResponse, type NextRequest } from "next/server";
import { buatKlienServer } from "@/lib/supabase/server";
import { keCsv, responsCsv } from "@/lib/csv";
import { KOMPETENSI } from "@/lib/konstanta";

/**
 * Ekspor jawaban tracer study TANPA identitas (tidak ada nama, NIM, atau ID).
 * Cukup untuk olah data borang akreditasi, tanpa membuka siapa menjawab apa.
 */
export async function GET(req: NextRequest) {
  const supabase = await buatKlienServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ galat: "Belum masuk" }, { status: 401 });
  const { data: saya } = await supabase.from("profiles").select("peran").eq("id", user.id).single();
  if (!saya || !["admin", "pengurus"].includes(saya.peran)) return NextResponse.json({ galat: "Khusus pengurus" }, { status: 403 });

  const tahun = req.nextUrl.searchParams.get("tahun");
  let q = supabase.from("tracer").select("*").order("tahun_lulus");
  if (tahun && tahun !== "semua") q = q.eq("tahun_pengisian", Number(tahun));
  const { data, error } = await q;
  if (error) return NextResponse.json({ galat: error.message }, { status: 500 });

  // Acak urutan supaya baris tidak bisa dicocokkan dengan urutan pendaftaran
  const baris = [...(data ?? [])].sort(() => Math.random() - 0.5).map((r, i) => ({ ...r, no: i + 1 }));
  await supabase.from("jejak_audit").insert({ aktor_id: user.id, aksi: "ekspor_tracer", rincian: { tahun, jumlah: baris.length } });

  const csv = keCsv(baris, [
    { kunci: "no", judul: "No" },
    { kunci: "tahun_pengisian", judul: "Tahun Pengisian" },
    { kunci: "tahun_lulus", judul: "Tahun Lulus" },
    { kunci: "status_saat_ini", judul: "Status Saat Ini" },
    { kunci: "masa_tunggu_bulan", judul: "Masa Tunggu (bulan)" },
    { kunci: "cara_dapat_kerja", judul: "Cara Mendapat Kerja" },
    { kunci: "jenis_instansi", judul: "Jenis Instansi" },
    { kunci: "tingkat_instansi", judul: "Tingkat Instansi" },
    { kunci: "posisi", judul: "Posisi" },
    { kunci: "lokasi_kerja", judul: "Lokasi Kerja" },
    { kunci: "rentang_pendapatan", judul: "Rentang Pendapatan" },
    { kunci: "kesesuaian_bidang", judul: "Kesesuaian Bidang (1-5)" },
    { kunci: "tingkat_pendidikan_sesuai", judul: "Tingkat Pendidikan Sesuai" },
    ...KOMPETENSI.map((k) => ({ kunci: k.kunci, judul: `${k.label} (1-5)` })),
    { kunci: "kepuasan_pendidikan", judul: "Kepuasan Pendidikan (1-5)" },
    { kunci: "saran", judul: "Saran" },
  ]);
  return responsCsv(csv, `tracer-study-${tahun ?? "semua"}-${new Date().toISOString().slice(0, 10)}.csv`);
}
