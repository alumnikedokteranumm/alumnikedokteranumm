import type { StatusProfesi } from "./tipe";

export const NAMA_SITUS = "Alumni Kedokteran UMM";

/** Nilai bawaan pengaturan situs — dipakai bila belum diisi di Admin → Pengaturan Situs. */
export const PENGATURAN_BAWAAN: Record<string, string> = {
  singkatan: NAMA_SITUS,
  nama_organisasi: NAMA_SITUS,
  email: "alumnikedokteran.umm@gmail.com",
  email_kampus: "alumnifk@umm.ac.id",
};

export const LABEL_PROFESI: Record<StatusProfesi, string> = {
  koas: "Dokter Muda (Koas)",
  internsip: "Internsip",
  dokter_umum: "Dokter Umum",
  ppds: "PPDS (Residen)",
  spesialis: "Dokter Spesialis",
  subspesialis: "Dokter Subspesialis",
  akademisi: "Akademisi / Dosen",
  non_klinis: "Non-klinis (industri, kebijakan, dll.)",
  studi_lanjut: "Studi Lanjut (S2/S3)",
  belum_bekerja: "Belum Bekerja",
  lainnya: "Lainnya",
};

export const OPSI_PROFESI = Object.entries(LABEL_PROFESI).map(([nilai, label]) => ({
  nilai: nilai as StatusProfesi,
  label,
}));

export const LABEL_VISIBILITAS = {
  publik: "Publik — nama & profesi boleh muncul di statistik terbuka",
  alumni: "Alumni saja — hanya alumni terverifikasi yang bisa melihat (disarankan)",
  privat: "Privat — sembunyikan saya dari direktori sepenuhnya",
} as const;

export const PROVINSI = [
  "Aceh","Sumatera Utara","Sumatera Barat","Riau","Kepulauan Riau","Jambi",
  "Sumatera Selatan","Kepulauan Bangka Belitung","Bengkulu","Lampung",
  "DKI Jakarta","Jawa Barat","Banten","Jawa Tengah","DI Yogyakarta","Jawa Timur",
  "Bali","Nusa Tenggara Barat","Nusa Tenggara Timur",
  "Kalimantan Barat","Kalimantan Tengah","Kalimantan Selatan","Kalimantan Timur","Kalimantan Utara",
  "Sulawesi Utara","Gorontalo","Sulawesi Tengah","Sulawesi Barat","Sulawesi Selatan","Sulawesi Tenggara",
  "Maluku","Maluku Utara","Papua","Papua Barat","Papua Barat Daya","Papua Tengah",
  "Papua Pegunungan","Papua Selatan","Luar Negeri",
];

/**
 * 36 spesialisasi kedokteran (tanpa kedokteran gigi) mengikuti nomenklatur MKKI.
 * Disimpan di profil sebagai "Bidang (Gelar)", mis. "Ilmu Penyakit Dalam (Sp.PD)",
 * supaya direktori bisa dicari lewat nama bidang maupun gelar.
 */
export const KELOMPOK_SPESIALISASI: { kelompok: string; daftar: [gelar: string, bidang: string][] }[] = [
  {
    kelompok: "Klinik Medik",
    daftar: [
      ["Sp.PD", "Ilmu Penyakit Dalam"],
      ["Sp.A", "Ilmu Kesehatan Anak"],
      ["Sp.JP", "Kardiologi dan Kedokteran Vaskular"],
      ["Sp.P", "Pulmonologi dan Kedokteran Respirasi"],
      ["Sp.N", "Neurologi"],
      ["Sp.KJ", "Psikiatri / Kedokteran Jiwa"],
      ["Sp.D.V.E", "Dermatologi, Venereologi, dan Estetika"],
      ["Sp.M", "Oftalmologi (Ilmu Kesehatan Mata)"],
      ["Sp.T.H.T.B.K.L", "THT Bedah Kepala Leher"],
      ["Sp.K.F.R", "Kedokteran Fisik dan Rehabilitasi"],
      ["Sp.GK", "Gizi Klinik"],
      ["Sp.FK", "Farmakologi Klinik"],
      ["Sp.And", "Andrologi"],
      ["Sp.Ak", "Akupunktur Medik"],
    ],
  },
  {
    kelompok: "Bedah & Perioperatif",
    daftar: [
      ["Sp.An-TI", "Anestesiologi dan Terapi Intensif"],
      ["Sp.B", "Ilmu Bedah"],
      ["Sp.BA", "Bedah Anak"],
      ["Sp.BS", "Bedah Saraf"],
      ["Sp.BTKV", "Bedah Toraks, Kardiak, dan Vaskular"],
      ["Sp.B.P.R.E", "Bedah Plastik Rekonstruksi dan Estetik"],
      ["Sp.O.T", "Orthopaedi dan Traumatologi"],
      ["Sp.U", "Urologi"],
      ["Sp.OG", "Obstetri dan Ginekologi"],
    ],
  },
  {
    kelompok: "Penunjang / Diagnostik",
    daftar: [
      ["Sp.Rad", "Radiologi"],
      ["Sp.Onk.Rad", "Onkologi Radiasi"],
      ["Sp.KN", "Kedokteran Nuklir"],
      ["Sp.PK", "Patologi Klinik"],
      ["Sp.PA", "Patologi Anatomik"],
      ["Sp.MK", "Mikrobiologi Klinik"],
      ["Sp.ParK", "Parasitologi Klinik"],
      ["Sp.F.M", "Kedokteran Forensik dan Medikolegal"],
    ],
  },
  {
    kelompok: "Layanan Primer, Emergensi & Kedokteran Khusus",
    daftar: [
      ["Sp.EM", "Kedokteran Emergensi"],
      ["Sp.KKLP", "Kedokteran Keluarga Layanan Primer"],
      ["Sp.KO", "Kedokteran Olahraga"],
      ["Sp.Ok", "Kedokteran Okupasi"],
      ["Sp.KP", "Kedokteran Penerbangan"],
    ],
  },
];

export const labelSpesialisasi = (gelar: string, bidang: string) => `${bidang} (${gelar})`;

/** Daftar datar semua label, dipakai untuk pencocokan nilai tersimpan. */
export const SPESIALISASI = KELOMPOK_SPESIALISASI.flatMap((k) =>
  k.daftar.map(([gelar, bidang]) => labelSpesialisasi(gelar, bidang)));

export const JENIS_ACARA = ["Reuni","Seminar","Webinar","Workshop","Bakti Sosial","Rapat","Lainnya"];
export const KATEGORI_BERITA = ["Umum","Pengumuman","Akademik","Kegiatan","Prestasi","Bakti Sosial"];
export const KATEGORI_VIDEO = [
  "Webinar & Seminar","Kuliah Tamu","Keterampilan Klinis","Update Pedoman Klinis",
  "Persiapan PPDS & Karier","Etika & Medikolegal","Lainnya",
];
export const KATEGORI_DOKUMEN = [
  "Akreditasi","SK & Legalitas","Pedoman & Panduan","Formulir",
  "Laporan Kegiatan & Keuangan","Materi Ilmiah","Lainnya",
];
export const JENIS_LOWONGAN = ["Dokter Umum","Dokter Spesialis","PPDS","Beasiswa","Akademik","Non-klinis","Lainnya"];

// --- Pilihan untuk kuesioner tracer study --------------------------------
export const STATUS_KERJA = [
  "Bekerja (purna waktu / paruh waktu)",
  "Wiraswasta / praktik mandiri",
  "Melanjutkan pendidikan (PPDS/S2/S3)",
  "Belum memungkinkan bekerja",
  "Tidak bekerja tetapi sedang mencari kerja",
];

export const JENIS_INSTANSI = [
  "RS Pemerintah","RS Swasta","RS TNI/Polri","Puskesmas","Klinik Pratama/Utama",
  "Instansi Pendidikan (kampus)","Kementerian/Dinas Kesehatan","Industri Farmasi/Alkes",
  "Organisasi Non-Pemerintah","Wiraswasta","Lainnya",
];

export const CARA_DAPAT_KERJA = [
  "Melamar langsung ke institusi","Informasi dari alumni/kolega","Iklan lowongan / media sosial",
  "Ditempatkan pemerintah (Nusantara Sehat / PTT / WKDS)","Melanjutkan tempat internsip",
  "Membangun usaha/praktik sendiri","Lainnya",
];

export const RENTANG_PENDAPATAN = [
  "< Rp5 juta","Rp5–10 juta","Rp10–15 juta","Rp15–25 juta","Rp25–50 juta","> Rp50 juta",
  "Tidak ingin menjawab",
];

export const KOMPETENSI = [
  { kunci: "k_etika",             label: "Etika dan profesionalisme" },
  { kunci: "k_keahlian",          label: "Keahlian berdasarkan bidang ilmu" },
  { kunci: "k_bahasa_asing",      label: "Kemampuan bahasa asing" },
  { kunci: "k_teknologi",         label: "Penggunaan teknologi informasi" },
  { kunci: "k_komunikasi",        label: "Kemampuan komunikasi" },
  { kunci: "k_kerjasama",         label: "Kerja sama tim" },
  { kunci: "k_pengembangan_diri", label: "Pengembangan diri" },
  { kunci: "k_kepemimpinan",      label: "Kepemimpinan" },
] as const;

export const SKALA_5 = [
  { nilai: 1, label: "Sangat kurang" },
  { nilai: 2, label: "Kurang" },
  { nilai: 3, label: "Cukup" },
  { nilai: 4, label: "Baik" },
  { nilai: 5, label: "Sangat baik" },
];

// --- Fitur lanjutan: mentoring, webinar SKP, keuangan, perpustakaan -------
export const TOPIK_MENTORING = [
  "Memilih spesialisasi",
  "Persiapan & seleksi PPDS",
  "Internsip & awal karier",
  "Buka praktik / klinik mandiri",
  "Karier non-klinis & industri",
  "Studi lanjut & beasiswa luar negeri",
  "Riset & publikasi ilmiah",
  "Karier akademik / dosen",
  "Keseimbangan kerja & kehidupan",
  "Etika & medikolegal",
];

export const CARA_TEMU = ["Chat WhatsApp", "Panggilan video", "Tatap muka"];

export const LABEL_STATUS_MENTORING = {
  menunggu: { label: "Menunggu jawaban", warna: "emas" },
  diterima: { label: "Diterima", warna: "hijau" },
  ditolak: { label: "Belum bisa", warna: "merah" },
  selesai: { label: "Selesai", warna: "biru" },
  dibatalkan: { label: "Dibatalkan", warna: "netral" },
} as const;

export const KATEGORI_PUSTAKA = [
  "Jurnal & Database", "Pedoman Klinis", "Pendidikan Berkelanjutan & SKP",
  "Alat Bantu Klinis", "E-book & Buku Ajar", "Lainnya",
];

export const KATEGORI_PENGELUARAN = [
  "Operasional sekretariat", "Kegiatan ilmiah", "Bakti sosial & pengabdian",
  "Beasiswa", "Konsumsi & akomodasi", "Honor narasumber", "Biaya bank & administrasi", "Lainnya",
];

export const LABEL_JENIS_BAYAR = { iuran: "Iuran anggota", donasi: "Donasi", acara: "Registrasi kegiatan" } as const;
