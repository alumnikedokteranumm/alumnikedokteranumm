import {
  JENIS_ACARA, JENIS_LOWONGAN, KATEGORI_BERITA, KATEGORI_DOKUMEN, KATEGORI_PENGELUARAN, KATEGORI_PUSTAKA, KATEGORI_VIDEO,
} from "./konstanta";

export type JenisBidang =
  | "teks" | "teks_panjang" | "markdown" | "tanggal" | "waktu"
  | "angka" | "centang" | "pilihan" | "gambar" | "url"
  /** unggah berkas ke bucket tertutup "dokumen" */
  | "berkas"
  /** diisi otomatis oleh komponen lain (mis. nama & ukuran berkas), tidak ditampilkan */
  | "tersembunyi";

export type DefinisiBidang = {
  nama: string;
  label: string;
  jenis: JenisBidang;
  wajib?: boolean;
  opsi?: string[];
  petunjuk?: string;
  penuh?: boolean;
};

export type SkemaKonten = {
  tabel: "berita" | "acara" | "album" | "lowongan" | "donasi" | "pengurus" | "video" | "dokumen" | "kas" | "pustaka";
  judul: string;
  tunggal: string;
  ikon: string;
  bidang: DefinisiBidang[];
  /** Kolom yang tampil di tabel daftar */
  kolomDaftar: { nama: string; label: string; jenis?: "tanggal" | "waktu" | "centang" | "rupiah" }[];
  urut: { kolom: string; naik: boolean };
  /** Bila diisi, slug dibuat otomatis dari kolom ini */
  slugDari?: string;
  /** Tautan ke halaman publik */
  tautanPublik?: (baris: Record<string, unknown>) => string;
};

export const SKEMA: Record<string, SkemaKonten> = {
  berita: {
    tabel: "berita", judul: "Berita & Artikel", tunggal: "berita", ikon: "📰",
    slugDari: "judul",
    tautanPublik: (b) => `/berita/${b.slug}`,
    urut: { kolom: "dibuat_pada", naik: false },
    kolomDaftar: [
      { nama: "judul", label: "Judul" },
      { nama: "kategori", label: "Kategori" },
      { nama: "terbit", label: "Terbit", jenis: "centang" },
      { nama: "terbit_pada", label: "Tanggal", jenis: "tanggal" },
    ],
    bidang: [
      { nama: "judul", label: "Judul", jenis: "teks", wajib: true, penuh: true },
      { nama: "ringkasan", label: "Ringkasan", jenis: "teks_panjang", petunjuk: "1–2 kalimat. Tampil di kartu berita dan pratinjau media sosial.", penuh: true },
      { nama: "kategori", label: "Kategori", jenis: "pilihan", opsi: KATEGORI_BERITA },
      { nama: "terbit_pada", label: "Tanggal terbit", jenis: "waktu", petunjuk: "Kosongkan untuk memakai waktu sekarang." },
      { nama: "sampul_url", label: "Gambar sampul", jenis: "gambar", penuh: true },
      { nama: "konten", label: "Isi berita", jenis: "markdown", wajib: true, penuh: true },
      { nama: "terbit", label: "Terbitkan (tampil untuk publik)", jenis: "centang", penuh: true },
    ],
  },

  acara: {
    tabel: "acara", judul: "Agenda Kegiatan", tunggal: "agenda", ikon: "📅",
    slugDari: "judul",
    tautanPublik: (a) => `/agenda/${a.slug}`,
    urut: { kolom: "mulai", naik: false },
    kolomDaftar: [
      { nama: "judul", label: "Judul" },
      { nama: "jenis", label: "Jenis" },
      { nama: "mulai", label: "Mulai", jenis: "waktu" },
      { nama: "terbit", label: "Terbit", jenis: "centang" },
    ],
    bidang: [
      { nama: "judul", label: "Nama kegiatan", jenis: "teks", wajib: true, penuh: true },
      { nama: "jenis", label: "Jenis", jenis: "pilihan", opsi: JENIS_ACARA },
      { nama: "daring", label: "Kegiatan daring (online)", jenis: "centang" },
      { nama: "mulai", label: "Mulai", jenis: "waktu", wajib: true },
      { nama: "selesai", label: "Selesai", jenis: "waktu" },
      { nama: "lokasi", label: "Tempat / platform", jenis: "teks", penuh: true },
      { nama: "skp_idi", label: "Jumlah SKP", jenis: "angka", petunjuk: "Kosongkan bila tidak ada." },
      { nama: "kuota", label: "Kuota peserta", jenis: "angka" },
      { nama: "biaya", label: "Biaya", jenis: "teks", petunjuk: "Contoh: Rp150.000 / Gratis untuk alumni" },
      { nama: "link_pendaftaran", label: "Tautan pendaftaran", jenis: "url", petunjuk: "Google Form, Eventbrite, dll." },
      { nama: "poster_url", label: "Poster", jenis: "gambar", penuh: true },
      { nama: "deskripsi", label: "Deskripsi", jenis: "markdown", penuh: true },
      { nama: "biaya_nominal", label: "Biaya pendaftaran web (Rp)", jenis: "angka",
        petunjuk: "Hanya untuk pendaftaran lewat website. Kosongkan / 0 bila gratis. Peserta berbayar mengunggah bukti transfer ke rekening program Iuran." },
      { nama: "ambang_kuis", label: "Nilai lulus kuis (0–100)", jenis: "angka", petunjuk: "Bawaan 70. Tidak berlaku bila kegiatan tanpa kuis." },
      { nama: "nomor_skp", label: "Nomor akreditasi SKP", jenis: "teks", petunjuk: "Nomor SK/akreditasi SKP dari Kemenkes (Plataran Sehat) atau lembaga berwenang. Dicetak di sertifikat." },
      { nama: "penandatangan", label: "Penanda tangan sertifikat", jenis: "teks", petunjuk: "Contoh: dr. Ahmad Fauzi, Sp.PD" },
      { nama: "jabatan_penandatangan", label: "Jabatan penanda tangan", jenis: "teks", petunjuk: "Contoh: Ketua Umum Alumni Kedokteran UMM" },
      { nama: "terbit", label: "Terbitkan", jenis: "centang", penuh: true },
      { nama: "pendaftaran_web", label: "Buka pendaftaran lewat website (presensi, kuis, sertifikat otomatis)", jenis: "centang", penuh: true },
      { nama: "terbuka_umum", label: "Boleh diikuti dokter non-alumni (akun belum terverifikasi)", jenis: "centang", penuh: true },
    ],
  },

  album: {
    tabel: "album", judul: "Galeri Foto", tunggal: "album", ikon: "🖼️",
    slugDari: "judul",
    tautanPublik: (a) => `/galeri/${a.slug}`,
    urut: { kolom: "tanggal", naik: false },
    kolomDaftar: [
      { nama: "judul", label: "Album" },
      { nama: "tanggal", label: "Tanggal", jenis: "tanggal" },
      { nama: "terbit", label: "Terbit", jenis: "centang" },
    ],
    bidang: [
      { nama: "judul", label: "Judul album", jenis: "teks", wajib: true, penuh: true },
      { nama: "tanggal", label: "Tanggal kegiatan", jenis: "tanggal" },
      { nama: "sampul_url", label: "Foto sampul", jenis: "gambar", penuh: true },
      { nama: "deskripsi", label: "Keterangan", jenis: "teks_panjang", penuh: true },
      { nama: "terbit", label: "Terbitkan", jenis: "centang", penuh: true },
    ],
  },

  lowongan: {
    tabel: "lowongan", judul: "Karier & Beasiswa", tunggal: "lowongan", ikon: "💼",
    tautanPublik: (l) => `/karier/${l.id}`,
    urut: { kolom: "dibuat_pada", naik: false },
    kolomDaftar: [
      { nama: "judul", label: "Posisi" },
      { nama: "institusi", label: "Institusi" },
      { nama: "batas_lamar", label: "Batas", jenis: "tanggal" },
      { nama: "terbit", label: "Terbit", jenis: "centang" },
    ],
    bidang: [
      { nama: "judul", label: "Posisi / nama program", jenis: "teks", wajib: true, penuh: true },
      { nama: "institusi", label: "Institusi", jenis: "teks", wajib: true },
      { nama: "jenis", label: "Jenis", jenis: "pilihan", opsi: JENIS_LOWONGAN },
      { nama: "lokasi", label: "Lokasi", jenis: "teks" },
      { nama: "tipe_kerja", label: "Tipe", jenis: "pilihan", opsi: ["Purna waktu", "Paruh waktu", "Kontrak", "Beasiswa", "Magang"] },
      { nama: "batas_lamar", label: "Batas pendaftaran", jenis: "tanggal", petunjuk: "Lowongan otomatis tersembunyi setelah tanggal ini." },
      { nama: "kontak", label: "Kontak", jenis: "teks", petunjuk: "Email atau nomor narahubung." },
      { nama: "tautan", label: "Tautan info/pendaftaran", jenis: "url", penuh: true },
      { nama: "deskripsi", label: "Deskripsi", jenis: "markdown", penuh: true },
      { nama: "kualifikasi", label: "Kualifikasi", jenis: "teks_panjang", petunjuk: "Satu syarat per baris.", penuh: true },
      { nama: "terbit", label: "Terbitkan", jenis: "centang", penuh: true },
    ],
  },

  video: {
    tabel: "video", judul: "Video Edukasi", tunggal: "video", ikon: "🎬",
    tautanPublik: (v) => `/video/${v.id}`,
    urut: { kolom: "tanggal", naik: false },
    kolomDaftar: [
      { nama: "judul", label: "Judul" },
      { nama: "kategori", label: "Kategori" },
      { nama: "tanggal", label: "Tanggal", jenis: "tanggal" },
      { nama: "terbit", label: "Terbit", jenis: "centang" },
    ],
    bidang: [
      { nama: "judul", label: "Judul video", jenis: "teks", wajib: true, penuh: true },
      { nama: "url_video", label: "Tautan YouTube", jenis: "url", wajib: true, penuh: true,
        petunjuk: "Unggah video ke YouTube dengan status \"Tidak publik\" (Unlisted), lalu salin tautannya ke sini." },
      { nama: "kategori", label: "Kategori", jenis: "pilihan", opsi: KATEGORI_VIDEO },
      { nama: "pembicara", label: "Narasumber", jenis: "teks", petunjuk: "Contoh: dr. Ahmad, Sp.PD-KGEH" },
      { nama: "tanggal", label: "Tanggal kegiatan", jenis: "tanggal" },
      { nama: "durasi", label: "Durasi", jenis: "teks", petunjuk: "Contoh: 1 jam 20 menit" },
      { nama: "deskripsi", label: "Deskripsi / ringkasan materi", jenis: "markdown", penuh: true },
      { nama: "terbit", label: "Terbitkan (tampil untuk alumni terverifikasi)", jenis: "centang", penuh: true },
    ],
  },

  dokumen: {
    tabel: "dokumen", judul: "Dokumen Penting", tunggal: "dokumen", ikon: "📄",
    tautanPublik: () => "/dokumen",
    urut: { kolom: "dibuat_pada", naik: false },
    kolomDaftar: [
      { nama: "judul", label: "Judul" },
      { nama: "kategori", label: "Kategori" },
      { nama: "berlaku_sampai", label: "Berlaku s.d.", jenis: "tanggal" },
      { nama: "terbit", label: "Terbit", jenis: "centang" },
    ],
    bidang: [
      { nama: "judul", label: "Judul dokumen", jenis: "teks", wajib: true, penuh: true,
        petunjuk: "Contoh: Sertifikat Akreditasi Program Studi Pendidikan Dokter — Unggul" },
      { nama: "file_path", label: "Berkas", jenis: "berkas", wajib: true, penuh: true },
      { nama: "nama_file", label: "Nama berkas", jenis: "tersembunyi" },
      { nama: "ukuran_byte", label: "Ukuran berkas", jenis: "tersembunyi" },
      { nama: "kategori", label: "Kategori", jenis: "pilihan", opsi: KATEGORI_DOKUMEN },
      { nama: "nomor_dokumen", label: "Nomor dokumen / SK", jenis: "teks" },
      { nama: "tanggal_dokumen", label: "Tanggal dokumen", jenis: "tanggal" },
      { nama: "berlaku_sampai", label: "Berlaku sampai", jenis: "tanggal", petunjuk: "Untuk sertifikat akreditasi. Kosongkan bila tidak ada masa berlaku." },
      { nama: "deskripsi", label: "Keterangan singkat", jenis: "teks_panjang", penuh: true },
      { nama: "terbit", label: "Terbitkan (bisa diunduh alumni terverifikasi)", jenis: "centang", penuh: true },
    ],
  },

  donasi: {
    tabel: "donasi", judul: "Iuran & Donasi", tunggal: "program donasi", ikon: "💝",
    urut: { kolom: "dibuat_pada", naik: true },
    kolomDaftar: [
      { nama: "judul", label: "Program" },
      { nama: "terkumpul", label: "Terkumpul", jenis: "rupiah" },
      { nama: "target", label: "Target", jenis: "rupiah" },
      { nama: "aktif", label: "Aktif", jenis: "centang" },
    ],
    bidang: [
      { nama: "judul", label: "Nama program", jenis: "teks", wajib: true, penuh: true },
      { nama: "jenis", label: "Jenis program", jenis: "pilihan", opsi: ["donasi", "iuran"],
        petunjuk: "Pilih \"iuran\" untuk iuran anggota tahunan — alumni akan memilih tahun iuran saat konfirmasi transfer." },
      { nama: "nominal_iuran", label: "Besar iuran per tahun (Rp)", jenis: "angka", petunjuk: "Khusus program iuran." },
      { nama: "deskripsi", label: "Deskripsi", jenis: "teks_panjang", penuh: true },
      { nama: "target", label: "Target (Rp)", jenis: "angka", petunjuk: "Kosongkan untuk iuran rutin tanpa target." },
      { nama: "terkumpul", label: "Terkumpul (Rp)", jenis: "angka", petunjuk: "Bertambah otomatis setiap konfirmasi transfer diterima di menu Pembayaran. Ubah manual hanya untuk dana yang masuk di luar website." },
      { nama: "bank", label: "Bank", jenis: "teks" },
      { nama: "no_rekening", label: "Nomor rekening", jenis: "teks" },
      { nama: "atas_nama", label: "Atas nama", jenis: "teks" },
      { nama: "narahubung", label: "Narahubung konfirmasi", jenis: "teks" },
      { nama: "aktif", label: "Tampilkan di halaman donasi", jenis: "centang", penuh: true },
    ],
  },

  kas: {
    tabel: "kas", judul: "Buku Kas", tunggal: "transaksi", ikon: "📒",
    tautanPublik: () => "/laporan-keuangan",
    urut: { kolom: "tanggal", naik: false },
    kolomDaftar: [
      { nama: "uraian", label: "Uraian" },
      { nama: "tanggal", label: "Tanggal", jenis: "tanggal" },
      { nama: "arah", label: "Arah" },
      { nama: "nominal", label: "Nominal", jenis: "rupiah" },
    ],
    bidang: [
      { nama: "arah", label: "Jenis transaksi", jenis: "pilihan", opsi: ["keluar", "masuk"],
        petunjuk: "Pemasukan dari konfirmasi transfer tercatat OTOMATIS. Pakai \"masuk\" hanya untuk dana di luar website, mis. sponsor atau kas tunai." },
      { nama: "tanggal", label: "Tanggal", jenis: "tanggal", wajib: true },
      { nama: "uraian", label: "Uraian", jenis: "teks", wajib: true, penuh: true, petunjuk: "Contoh: Konsumsi rapat pengurus Juli 2026" },
      { nama: "kategori", label: "Kategori", jenis: "pilihan", opsi: [...KATEGORI_PENGELUARAN, "Sponsor", "Pemasukan lain"] },
      { nama: "nominal", label: "Nominal (Rp)", jenis: "angka", wajib: true },
    ],
  },

  pustaka: {
    tabel: "pustaka", judul: "Perpustakaan Digital", tunggal: "sumber", ikon: "📚",
    tautanPublik: () => "/pustaka",
    urut: { kolom: "urutan", naik: true },
    kolomDaftar: [
      { nama: "judul", label: "Judul" },
      { nama: "kategori", label: "Kategori" },
      { nama: "akses", label: "Akses" },
      { nama: "terbit", label: "Tampil", jenis: "centang" },
    ],
    bidang: [
      { nama: "judul", label: "Nama sumber", jenis: "teks", wajib: true, penuh: true },
      { nama: "url", label: "Tautan", jenis: "url", wajib: true, penuh: true },
      { nama: "kategori", label: "Kategori", jenis: "pilihan", opsi: KATEGORI_PUSTAKA },
      { nama: "akses", label: "Akses", jenis: "pilihan", opsi: ["Gratis", "Sebagian gratis", "Perlu daftar (gratis)", "Berbayar / langganan"] },
      { nama: "penyedia", label: "Penyedia", jenis: "teks", petunjuk: "Contoh: Kementerian Kesehatan RI" },
      { nama: "urutan", label: "Urutan tampil", jenis: "angka", petunjuk: "Angka kecil tampil lebih dulu." },
      { nama: "deskripsi", label: "Keterangan singkat", jenis: "teks_panjang", penuh: true },
      { nama: "terbit", label: "Tampilkan untuk alumni", jenis: "centang", penuh: true },
    ],
  },

  pengurus: {
    tabel: "pengurus", judul: "Struktur Pengurus", tunggal: "pengurus", ikon: "👥",
    urut: { kolom: "urutan", naik: true },
    kolomDaftar: [
      { nama: "urutan", label: "#" },
      { nama: "nama", label: "Nama" },
      { nama: "jabatan", label: "Jabatan" },
      { nama: "periode", label: "Periode" },
    ],
    bidang: [
      { nama: "nama", label: "Nama lengkap & gelar", jenis: "teks", wajib: true, penuh: true },
      { nama: "jabatan", label: "Jabatan", jenis: "teks", wajib: true },
      { nama: "periode", label: "Periode", jenis: "teks", petunjuk: "Contoh: 2024–2027" },
      { nama: "angkatan", label: "Angkatan", jenis: "angka" },
      { nama: "urutan", label: "Urutan tampil", jenis: "angka", petunjuk: "Angka kecil tampil lebih dulu." },
      { nama: "foto_url", label: "Foto", jenis: "gambar", penuh: true },
    ],
  },
};

export const JENIS_KONTEN = Object.keys(SKEMA);

/* -------- Konversi waktu: form memakai jam WIB, database menyimpan UTC -------- */
export function isoKeMasukanWaktu(iso: string | null | undefined) {
  if (!iso) return "";
  const d = new Date(new Date(iso).getTime() + 7 * 3600_000);
  return d.toISOString().slice(0, 16);
}
export function masukanWaktuKeIso(nilai: string) {
  if (!nilai) return null;
  return new Date(`${nilai}:00+07:00`).toISOString();
}
