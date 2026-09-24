export type Peran = "pending" | "alumni" | "pengurus" | "admin";
export type StatusVerifikasi = "menunggu" | "terverifikasi" | "ditolak";
export type Visibilitas = "publik" | "alumni" | "privat";
export type StatusProfesi =
  | "koas" | "internsip" | "dokter_umum" | "ppds" | "spesialis"
  | "subspesialis" | "akademisi" | "non_klinis" | "studi_lanjut"
  | "belum_bekerja" | "lainnya";

export type Profil = {
  id: string;
  nim: string | null;
  gelar_depan: string | null;
  nama_lengkap: string;
  gelar_belakang: string | null;
  jenis_kelamin: "L" | "P" | null;
  tempat_lahir: string | null;
  tanggal_lahir: string | null;
  angkatan: number | null;
  tahun_lulus: number | null;
  prodi: string | null;
  email_kontak: string | null;
  no_hp: string | null;
  whatsapp: string | null;
  alamat: string | null;
  kota: string | null;
  provinsi: string | null;
  kode_pos: string | null;
  negara: string | null;
  status_profesi: StatusProfesi | null;
  spesialisasi: string | null;
  subspesialisasi: string | null;
  tempat_kerja: string | null;
  jabatan: string | null;
  kota_kerja: string | null;
  provinsi_kerja: string | null;
  no_str: string | null;
  str_berlaku_sampai: string | null;
  no_sip: string | null;
  anggota_idi: boolean | null;
  cabang_idi: string | null;
  bio: string | null;
  linkedin: string | null;
  instagram: string | null;
  situs_web: string | null;
  foto_path: string | null;
  visibilitas: Visibilitas;
  tampilkan_email: boolean;
  tampilkan_no_hp: boolean;
  tampilkan_whatsapp: boolean;
  tampilkan_alamat: boolean;
  tampilkan_tempat_kerja: boolean;
  tampilkan_tanggal_lahir: boolean;
  setuju_kebijakan: boolean;
  setuju_pada: string | null;
  peran: Peran;
  status: StatusVerifikasi;
  catatan_admin: string | null;
  diverifikasi_pada: string | null;
  dibuat_pada: string;
};

/** Baris hasil fungsi cari_alumni() — sudah disensor di database. */
export type BarisDirektori = {
  id: string;
  nama_tampil: string;
  nim: string | null;
  angkatan: number | null;
  tahun_lulus: number | null;
  status_profesi: StatusProfesi | null;
  spesialisasi: string | null;
  tempat_kerja: string | null;
  jabatan: string | null;
  kota_kerja: string | null;
  kota: string | null;
  provinsi: string | null;
  foto_path: string | null;
  bio: string | null;
  email_kontak: string | null;
  no_hp: string | null;
  whatsapp: string | null;
  linkedin: string | null;
  instagram: string | null;
  situs_web: string | null;
  total: number;
};

export type DetailAlumni = Omit<BarisDirektori, "total"> & {
  prodi: string | null;
  subspesialisasi: string | null;
  provinsi_kerja: string | null;
  alamat: string | null;
  anggota_idi: boolean | null;
  cabang_idi: string | null;
  ulang_tahun: string | null;
};

export type Berita = {
  id: string; slug: string; judul: string; ringkasan: string | null;
  konten: string; kategori: string | null; sampul_url: string | null;
  penulis_id: string | null; terbit: boolean; terbit_pada: string | null;
  dibuat_pada: string;
};

export type Acara = {
  id: string; slug: string; judul: string; deskripsi: string | null;
  jenis: string | null; lokasi: string | null; daring: boolean;
  mulai: string; selesai: string | null; skp_idi: number | null;
  biaya: string | null; kuota: number | null; link_pendaftaran: string | null;
  poster_url: string | null; terbit: boolean;
};

export type Album = {
  id: string; slug: string; judul: string; deskripsi: string | null;
  tanggal: string | null; sampul_url: string | null; terbit: boolean;
};

export type Foto = { id: string; album_id: string; url: string; keterangan: string | null; urutan: number | null };

export type Lowongan = {
  id: string; judul: string; institusi: string; jenis: string | null;
  lokasi: string | null; tipe_kerja: string | null; deskripsi: string;
  kualifikasi: string | null; kontak: string | null; tautan: string | null;
  batas_lamar: string | null; terbit: boolean; dibuat_pada: string;
};

export type Donasi = {
  id: string; judul: string; deskripsi: string; target: number | null;
  terkumpul: number | null; bank: string | null; no_rekening: string | null;
  atas_nama: string | null; narahubung: string | null; aktif: boolean;
};

export type Pengurus = {
  id: string; nama: string; jabatan: string; periode: string | null;
  angkatan: number | null; foto_url: string | null; urutan: number | null;
};

export type Tracer = {
  id: string; profil_id: string; tahun_pengisian: number; tahun_lulus: number | null;
  status_saat_ini: string | null; masa_tunggu_bulan: number | null;
  cara_dapat_kerja: string | null; jenis_instansi: string | null;
  tingkat_instansi: string | null; posisi: string | null; lokasi_kerja: string | null;
  rentang_pendapatan: string | null; kesesuaian_bidang: number | null;
  tingkat_pendidikan_sesuai: string | null;
  k_etika: number | null; k_keahlian: number | null; k_bahasa_asing: number | null;
  k_teknologi: number | null; k_komunikasi: number | null; k_kerjasama: number | null;
  k_pengembangan_diri: number | null; k_kepemimpinan: number | null;
  kepuasan_pendidikan: number | null; saran: string | null;
};

export type StatistikPublik = {
  total_alumni: number;
  total_angkatan: number;
  total_spesialis: number;
  total_kota: number;
  sebaran_provinsi: { provinsi: string; jumlah: number }[];
  sebaran_profesi: { status: string; jumlah: number }[];
};

export type RekapTracer = {
  jumlah_responden: number;
  rata_masa_tunggu: number | null;
  persen_tunggu_kurang_6_bulan: number | null;
  rata_kesesuaian: number | null;
  rata_kepuasan: number | null;
  kompetensi: Record<string, number | null>;
  status_kerja: { label: string; jumlah: number }[];
  jenis_instansi: { label: string; jumlah: number }[];
};

export type Video = {
  id: string; judul: string; url_video: string; kategori: string | null;
  pembicara: string | null; tanggal: string | null; durasi: string | null;
  deskripsi: string | null; terbit: boolean; dibuat_pada: string;
};

export type Dokumen = {
  id: string; judul: string; kategori: string | null; nomor_dokumen: string | null;
  tanggal_dokumen: string | null; berlaku_sampai: string | null; deskripsi: string | null;
  file_path: string; nama_file: string | null; ukuran_byte: number | null;
  terbit: boolean; dibuat_pada: string;
};

/* ======================================================= FITUR LANJUTAN (08) */

export type StatusMentoring = "menunggu" | "diterima" | "ditolak" | "selesai" | "dibatalkan";

export type Mentor = {
  profil_id: string; aktif: boolean; topik: string[]; cara_temu: string[];
  pengantar: string | null; kuota_bulanan: number;
};

/** Baris hasil fungsi daftar_mentor(). */
export type KartuMentor = {
  id: string; nama_tampil: string; angkatan: number | null; status_profesi: StatusProfesi | null;
  spesialisasi: string | null; tempat_kerja: string | null; kota: string | null; foto_path: string | null;
  topik: string[]; cara_temu: string[]; pengantar: string | null; kuota_bulanan: number; terpakai: number;
};

/** Baris hasil fungsi permintaan_mentoring_saya(). */
export type PermintaanMentoring = {
  id: string; peran: "mentor" | "mentee"; lawan_id: string; lawan_nama: string;
  lawan_angkatan: number | null; lawan_spesialisasi: string | null; lawan_foto: string | null;
  jenis: "flash" | "berkelanjutan"; topik: string; pesan: string; status: StatusMentoring;
  balasan: string | null; dibuat_pada: string; diperbarui_pada: string;
  kontak_email: string | null; kontak_wa: string | null;
};

/** Kolom tambahan acara untuk webinar ber-SKP. */
export type AcaraWebinar = Acara & {
  pendaftaran_web: boolean; terbuka_umum: boolean; biaya_nominal: number | null;
  nomor_skp: string | null; ambang_kuis: number | null; penandatangan: string | null;
  jabatan_penandatangan: string | null;
};

/** Hasil fungsi tautan_ruang_acara() — hanya untuk peserta terdaftar. */
export type RuangAcara = { tautan: string | null; catatan: string | null; presensi_aktif: boolean; jumlah_soal: number };

export type StatusPeserta = "menunggu_bayar" | "terdaftar" | "batal";

export type Peserta = {
  id: string; acara_id: string; profil_id: string; status: StatusPeserta;
  terdaftar_pada: string; hadir_pada: string | null; percobaan_presensi: number;
  skor_kuis: number | null; percobaan_kuis: number; kuis_pada: string | null;
  nilai_materi: number | null; nilai_narasumber: number | null; nilai_teknis: number | null;
  saran: string | null; evaluasi_pada: string | null;
  nomor_sertifikat: string | null; kode_verifikasi: string | null; sertifikat_pada: string | null;
};

export type SoalKuis = { id: string; acara_id: string; urutan: number; pertanyaan: string; opsi: string[]; kunci: number };

export type SkpMandiri = {
  id: string; profil_id: string; judul: string; penyelenggara: string | null;
  tanggal: string; jumlah_skp: number; catatan: string | null;
};

export type ProgramDana = Donasi & { jenis: "donasi" | "iuran"; nominal_iuran: number | null };

export type StatusPembayaran = "menunggu" | "diterima" | "ditolak";

export type Pembayaran = {
  id: string; profil_id: string | null; nama_pembayar: string; jenis: "iuran" | "donasi" | "acara";
  donasi_id: string | null; acara_id: string | null; tahun_iuran: number | null; nominal: number;
  tanggal_transfer: string; bank_pengirim: string | null; atas_nama_pengirim: string | null;
  bukti_path: string | null; catatan: string | null; tampilkan_nama: boolean; status: StatusPembayaran;
  catatan_pengurus: string | null; diperiksa_pada: string | null; dibuat_pada: string;
};

export type BarisKas = {
  id: string; tanggal: string; arah: "masuk" | "keluar"; kategori: string; uraian: string;
  nominal: number; pembayaran_id: string | null;
};

export type LaporanKas = {
  saldo_awal: number; masuk: number; keluar: number;
  per_bulan: { bulan: number; masuk: number | null; keluar: number | null }[];
  per_kategori: { arah: "masuk" | "keluar"; kategori: string; jumlah: number }[];
  tahun_tersedia: number[];
};

export type Pustaka = {
  id: string; judul: string; kategori: string | null; url: string; penyedia: string | null;
  deskripsi: string | null; akses: string | null; urutan: number | null; terbit: boolean;
};

export type BarisArsip = {
  nama: string; angkatan: number | null; tahun_lulus: number | null; keterangan: string | null; bergabung: boolean;
};
