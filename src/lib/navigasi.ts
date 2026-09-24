/**
 * Menu "Ruang Alumni". Disimpan di berkas biasa (bukan "use client") supaya bisa
 * dibaca komponen server (header seluler) maupun komponen klien (menu desktop).
 */
export const TAUTAN_ALUMNI = [
  { href: "/direktori", label: "Direktori Alumni", ket: "Cari sejawat per angkatan & kota", ikon: "👥" },
  { href: "/mentoring", label: "Mentoring", ket: "Ngobrol dengan senior, jadi mentor", ikon: "🤝" },
  { href: "/skp", label: "Webinar & SKP", ket: "Presensi, kuis, sertifikat, portofolio SKP", ikon: "🎓" },
  { href: "/video", label: "Video Edukasi", ket: "Rekaman webinar & materi klinis", ikon: "🎬" },
  { href: "/pustaka", label: "Perpustakaan Digital", ket: "Jurnal, pedoman, kalkulator klinis", ikon: "📚" },
  { href: "/dokumen", label: "Dokumen Penting", ket: "Sertifikat akreditasi, SK, formulir", ikon: "📄" },
  { href: "/arsip-lulusan", label: "Arsip Lulusan", ket: "Daftar lulusan per tahun", ikon: "🗂️" },
  { href: "/laporan-keuangan", label: "Laporan Keuangan", ket: "Pemasukan & pengeluaran organisasi", ikon: "📊" },
  { href: "/tracer-study", label: "Tracer Study", ket: "Kuesioner alumni tahunan", ikon: "📋" },
];
