# Alumni Kedokteran UMM — Portal Alumni Fakultas Kedokteran Universitas Muhammadiyah Malang

Portal alumni dengan direktori tertutup, tracer study, dan manajemen konten.

> **Bukan programmer?** Baca **[PANDUAN.md](PANDUAN.md)** — panduan langkah demi langkah.

## Fitur

| Publik | Alumni terverifikasi | Pengurus / Admin |
|---|---|---|
| Beranda + statistik agregat | Direktori alumni (cari & saring) | Verifikasi pendaftar |
| Tentang, visi-misi, pengurus | Profil alumni lain (kolom tersensor) | CRUD berita, agenda, galeri, lowongan, donasi, pengurus |
| Berita & artikel | Profil saya + pengaturan privasi | Rekap tracer study + ekspor CSV anonim |
| Agenda (SKP IDI, Google Calendar) | Tracer study (instrumen Dikti/LAM-PTKes) |
| | Video edukasi (YouTube unlisted, sematan nocookie) | CRUD video & dokumen |
| | Dokumen penting (bucket privat, signed URL 60 detik) | | Ekspor data alumni (terminimisasi) |
| Galeri foto | Unduh data saya (JSON) | Pengaturan teks situs |
| Karier & beasiswa | Permintaan hapus data (via pengurus) | Jejak audit + hapus akun |
| Iuran & donasi, Kontak, Kebijakan Privasi | | |

### Fitur lanjutan (`08_fitur_lanjutan.sql`)

| Fitur | Halaman | Admin | Keamanan |
|---|---|---|---|
| Mentoring (flash & berkelanjutan) | `/mentoring`, `/mentoring/saya` | angka agregat di dasbor | pesan hanya terbaca 2 pihak; kontak terbuka setelah mentor menerima; kuota per bulan |
| Webinar ber-SKP | `/skp`, `/skp/[id]`, `/sertifikat/[kode]`, `/verifikasi` | `/admin/webinar` | tautan Zoom & kode presensi di tabel terpisah; kunci kuis tak pernah keluar; sertifikat diterbitkan fungsi DB |
| Iuran, konfirmasi transfer, buku kas | `/donasi/konfirmasi`, `/donasi/saya`, `/laporan-keuangan` | `/admin/pembayaran`, Buku Kas | bukti di bucket privat `bukti`; kas otomatis tak bisa diedit manual; audit |
| Perpustakaan digital | `/pustaka` | Perpustakaan (editor generik) | khusus alumni terverifikasi |
| Arsip lulusan | `/arsip-lulusan` | `/admin/arsip` (impor tempel) | NIM hanya untuk pengurus; tanda "cocok arsip" saat verifikasi |

## Teknologi

- **Next.js 15** (App Router, Server Components, Server Actions) + **TypeScript**
- **Tailwind CSS v4**
- **Supabase**: Postgres, Auth (email + kata sandi), Storage
- Tanpa pustaka UI / grafik / markdown pihak ketiga — seluruh komponen ditulis sendiri

## Arsitektur privasi

Pelindungan data ditegakkan **di database**, bukan hanya di tampilan:

1. **RLS pada `profiles`** — pengguna hanya bisa `SELECT` barisnya sendiri; pengurus/admin bisa semua.
   Tidak ada policy `INSERT` (baris hanya dibuat trigger `buat_profil_baru`).
2. **Direktori lewat fungsi `SECURITY DEFINER`** (`cari_alumni`, `detail_alumni`) yang:
   memeriksa pemanggil `is_alumni_aktif()`, membuang profil `visibilitas = 'privat'`,
   dan meng-`NULL`-kan kolom kontak yang tidak diizinkan pemiliknya.
   STR, SIP, tanggal lahir lengkap tidak pernah dikembalikan.
3. **Trigger `kunci_kolom_sistem`** mencegah non-admin mengubah `peran`/`status` miliknya sendiri.
4. **Statistik publik** hanya agregat, kelompok berisi < 3 orang disembunyikan (k-anonymity sederhana).
5. **Foto profil** di bucket privat `avatar`; ditampilkan lewat signed URL 1 jam.
6. **Jejak audit** untuk verifikasi, perubahan peran, dan ekspor.
7. **Ekspor tracer** tanpa identitas & urutan diacak; **ekspor alumni** tanpa STR/SIP/tgl lahir/alamat.
8. Header keamanan (`X-Frame-Options`, `nosniff`, dll.), `no-store` untuk halaman berdata pribadi,
   dan `robots.txt` melarang pengindeksan halaman privat.
9. Perender markdown ditulis sendiri tanpa `dangerouslySetInnerHTML` (kebal XSS dari konten admin).

## Struktur

```
supabase/
  SEMUA_SEKALIGUS.sql   ← jalankan ini di SQL Editor (gabungan 01–08)
  01_skema.sql          tabel, enum, trigger
  02_keamanan.sql       Row Level Security
  03_fungsi.sql         cari_alumni, detail_alumni, statistik_publik, rekap_tracer
  04_penyimpanan.sql    bucket storage + policy
  05_data_awal.sql      konten contoh
  06_video_dokumen.sql  video edukasi & dokumen (khusus alumni) + bucket privat "dokumen"
  07_hapus_akun.sql     hapus akun oleh admin
  08_fitur_lanjutan.sql mentoring, webinar SKP + sertifikat, iuran & buku kas, pustaka, arsip lulusan
src/
  middleware.ts         proteksi rute (login / verifikasi / admin)
  actions/              Server Actions: autentikasi, profil, tracer, admin
  app/
    (auth)/             masuk, daftar, lupa-sandi
    direktori/          direktori + detail alumni
    video/ dokumen/     khusus alumni terverifikasi; dokumen/[id]/unduh = signed URL 60 detik
    profil/             profil saya, unduh data
    tracer-study/
    admin/              panel admin (konten generik berbasis skema)
    berita/ agenda/ galeri/ karier/ donasi/ kontak/ tentang/ privasi/
  components/           UI dasar, header, footer, unggah gambar
  lib/
    supabase/           klien browser / server / service-role / middleware
    skema-konten.ts     definisi bidang untuk editor admin generik
    konstanta.ts        daftar spesialisasi, provinsi, opsi tracer study
```

## Menjalankan

```bash
npm install
cp .env.example .env.local   # isi NEXT_PUBLIC_SUPABASE_URL & NEXT_PUBLIC_SUPABASE_ANON_KEY
npm run dev
```

Tanpa `.env.local`, situs tetap berjalan dengan data kosong dan menampilkan petunjuk penyiapan.

## Menambah jenis konten baru

1. Buat tabel + policy RLS (pola sama seperti `berita`).
2. Tambah entri di `src/lib/skema-konten.ts` → editor & daftar admin langsung jadi.
3. Tambah tautan di `src/app/admin/nav.tsx` dan buat halaman publiknya.
