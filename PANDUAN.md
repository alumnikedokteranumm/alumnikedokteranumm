# Panduan Lengkap — Website Alumni Kedokteran UMM

Panduan ini ditulis untuk kamu yang **tidak bisa coding**. Ikuti urutannya, satu langkah
dalam satu waktu. Total waktu sekitar **45–60 menit** untuk pertama kali.

> 💡 Setiap kotak abu-abu berisi perintah. Salin persis, tempel di aplikasi **Terminal**
> (tekan `⌘ + Spasi`, ketik *Terminal*, Enter), lalu tekan Enter.

---

## Daftar Isi

1. [Pasang paket pendukung](#langkah-1--pasang-paket-pendukung-5-menit)
2. [Buat database gratis di Supabase](#langkah-2--buat-database-gratis-di-supabase-15-menit)
3. [Coba jalankan di laptop](#langkah-3--coba-jalankan-di-laptop-5-menit)
4. [Jadikan dirimu admin](#langkah-4--jadikan-dirimu-admin-3-menit)
5. [Online-kan website (Vercel)](#langkah-5--online-kan-website-gratis-di-vercel-20-menit)
6. [Wajib sebelum diumumkan ke alumni](#langkah-6--wajib-sebelum-diumumkan-ke-alumni)
7. [Panduan harian pengurus](#panduan-harian-untuk-pengurus)
8. [Fitur baru: mentoring, webinar SKP, iuran, perpustakaan & arsip](#fitur-baru-mentoring-webinar-skp-iuran-perpustakaan--arsip)
9. [Kalau ada masalah](#kalau-ada-masalah)

---

## Langkah 1 — Pasang paket pendukung (5 menit)

Buka Terminal lalu jalankan dua perintah ini satu per satu:

```bash
cd "/Users/snf_akbar/website aku/alumnikedokteranumm"
```

```bash
npm install
```

Tunggu sampai selesai (1–3 menit). Kalau muncul tulisan kuning `warn`, itu **normal**.
Yang penting tidak ada tulisan merah `ERR!` di bagian akhir.

---

## Langkah 2 — Buat database gratis di Supabase (15 menit)

Supabase adalah tempat menyimpan data alumni, akun login, dan foto.

### 2a. Buat akun & proyek

1. Buka **https://supabase.com** → klik **Start your project** → daftar pakai akun GitHub atau email.
2. Klik **New project**, lalu isi:
   - **Name**: `alumnikedokteranumm`
   - **Database Password**: klik *Generate a password*, lalu **simpan di tempat aman** (catatan HP / pengelola kata sandi).
   - **Region**: pilih **Southeast Asia (Singapore)** — paling dekat dengan Indonesia, jadi website lebih cepat.
3. Klik **Create new project**. Tunggu ±2 menit sampai statusnya siap.

### 2b. Pasang struktur database (satu kali klik)

1. Di menu kiri, klik **SQL Editor** (ikon `>_`).
2. Klik **+ New query**.
3. Buka berkas **`supabase/SEMUA_SEKALIGUS.sql`** dari folder proyek (klik kanan → *Open With* → *TextEdit*).
   Tekan `⌘ + A` (pilih semua), `⌘ + C` (salin).
4. Kembali ke Supabase, klik di kotak editor, tekan `⌘ + V` (tempel).
5. Klik tombol hijau **Run** di kanan bawah.
6. Harus muncul **"Success. No rows returned"**. ✅

> Kalau muncul peringatan *"This query has destructive operations"*, klik **Run this query** —
> itu karena ada perintah `drop … if exists` yang aman.

### 2c. Salin dua kunci ke website

1. Di Supabase, klik ⚙️ **Project Settings** (kiri bawah) → **Data API** (atau **API**).
2. Salin **Project URL** (bentuknya `https://abcdefgh.supabase.co`).
3. Masuk ke **API Keys** → salin kunci **`anon` `public`** (panjang, diawali `eyJ…`).
   Kalau yang tampil *Publishable key* (`sb_publishable_…`), itu juga boleh dipakai.
4. Di folder proyek, buka berkas **`.env.local`** dengan TextEdit.
   > Berkas berawalan titik tersembunyi di Finder. Tekan `⌘ + Shift + .` (titik) untuk menampilkannya.
5. Isi seperti ini, lalu simpan (`⌘ + S`):

```
NEXT_PUBLIC_SUPABASE_URL=https://abcdefgh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...(panjang)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

> ⚠️ Jangan pernah menyalin kunci **`service_role`** / **Secret key** — website ini tidak membutuhkannya,
> dan kunci itu bisa membuka seluruh data alumni.

### 2d. Atur alamat login

1. Supabase → **Authentication** → **URL Configuration**.
2. **Site URL**: `http://localhost:3000`
3. **Redirect URLs** → **Add URL** → `http://localhost:3000/**` → Save.

---

## Langkah 3 — Coba jalankan di laptop (5 menit)

Di Terminal (masih di folder proyek):

```bash
npm run dev
```

Tunggu sampai muncul `Ready`, lalu buka **http://localhost:3000** di browser. 🎉

Kamu akan melihat beranda lengkap dengan contoh berita, agenda, lowongan, dan donasi.
Untuk mematikan server, kembali ke Terminal dan tekan `Ctrl + C`.

---

## Langkah 4 — Jadikan dirimu admin (3 menit)

1. Di website (http://localhost:3000), klik **Daftar Alumni** dan buat akun dengan email kamu.
2. Buka email → klik tautan konfirmasi dari Supabase.
3. Kembali ke Supabase → **SQL Editor** → **+ New query**, tempel ini
   (**ganti emailnya** dengan email yang barusan kamu pakai mendaftar):

```sql
update public.profiles set peran = 'admin', status = 'terverifikasi'
where id = (select id from auth.users where email = 'email-kamu@gmail.com');
```

4. Klik **Run** → harus muncul *"Success. 1 row affected"*.
5. Muat ulang website → sekarang ada menu **Admin** di kanan atas.

---

## Langkah 5 — Online-kan website gratis di Vercel (20 menit)

### 5a. Taruh kode di GitHub

1. Buat akun di **https://github.com** (gratis).
2. Klik **+** (kanan atas) → **New repository**.
   - Nama: `alumnikedokteranumm`
   - Pilih **Private** ← penting.
   - Klik **Create repository**.
3. Di halaman berikutnya, klik tautan **"uploading an existing file"**.
4. Buka folder proyek di Finder. Pilih **semua isi folder KECUALI** folder `node_modules`,
   folder `.next`, dan berkas `.env.local`. Seret ke halaman GitHub.
   > ⚠️ **Jangan pernah mengunggah `.env.local`** — isinya kunci rahasia.
5. Klik **Commit changes**.
   > GitHub membatasi 100 berkas sekali unggah. Kalau muncul peringatan itu, unggah folder `src`
   > dulu, *Commit*, lalu klik **Add file → Upload files** untuk sisanya.

### 5b. Hubungkan ke Vercel

1. Buka **https://vercel.com** → **Sign Up** → pilih **Continue with GitHub**.
2. Klik **Add New… → Project** → pilih repositori `alumnikedokteranumm` → **Import**.
3. Buka bagian **Environment Variables**, tambahkan satu per satu:

| Name | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | (sama dengan di `.env.local`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | (sama dengan di `.env.local`) |
| `NEXT_PUBLIC_SITE_URL` | `https://alumnikedokteranumm.vercel.app` (sesuaikan nanti) |

4. Klik **Deploy**. Tunggu 2–3 menit.
5. Vercel memberi alamat seperti `https://alumnikedokteranumm.vercel.app`. Salin alamat itu.
6. Kalau alamatnya berbeda dari yang kamu isi di `NEXT_PUBLIC_SITE_URL`: Vercel → Project →
   **Settings → Environment Variables** → ubah → lalu **Deployments → ⋯ → Redeploy**.

### 5c. Beri tahu Supabase alamat barunya

Supabase → **Authentication → URL Configuration**:
- **Site URL**: `https://alumnikedokteranumm.vercel.app`
- **Redirect URLs**: tambahkan `https://alumnikedokteranumm.vercel.app/**`

### 5d. (Opsional) Pakai domain sendiri

Misalnya `ikafkumm.org` (±Rp200 ribu/tahun di Niagahoster/Rumahweb/Cloudflare), atau minta
subdomain `ika.fk.umm.ac.id` ke bagian IT kampus. Di Vercel: **Settings → Domains → Add**,
lalu ikuti petunjuk DNS-nya. Setelah aktif, ulangi langkah 5b-6 dan 5c dengan domain baru.

---

## Langkah 6 — Wajib sebelum diumumkan ke alumni

Centang satu per satu:

- [ ] **Ganti data contoh.** Panel Admin → *Pengurus* (nama asli), *Donasi* (nomor rekening asli),
      *Pengaturan Situs* (telepon, WhatsApp, sambutan ketua, dan **akun media sosial** — cukup tulis nama akunnya,
      misalnya `@alumnikedokteranumm`; ikon Instagram/YouTube/TikTok/dll. otomatis muncul di footer, beranda, dan halaman Kontak). Hapus lowongan & berita contoh bila perlu.
- [ ] **Pasang layanan email sendiri (SMTP).** ⚠️ Email bawaan Supabase dibatasi **hanya beberapa
      email per jam** — cukup untuk mencoba, **tidak cukup** saat ratusan alumni mendaftar bersamaan.
      Daftar gratis di **Resend** (resend.com, 3.000 email/bulan) atau **Brevo** (300 email/hari),
      lalu isi di Supabase → **Authentication → Emails → SMTP Settings**.
- [ ] **Terjemahkan email konfirmasi.** Supabase → **Authentication → Emails → Templates**.
      Ubah teks *Confirm signup* dan *Reset password* ke Bahasa Indonesia (jangan hapus `{{ .ConfirmationURL }}`).
- [ ] **Minta pengurus/penasihat hukum membaca `/privasi`.** Halaman Kebijakan Privasi sudah
      disusun mengacu UU No. 27/2022 (PDP), tetapi tetap perlu ditinjau & disahkan organisasi.
- [ ] **Tetapkan admin kedua.** Supaya tidak bergantung pada satu orang. Panel Admin →
      Verifikasi & Anggota → ubah peran seseorang menjadi *admin*.
- [ ] **Siapkan cadangan data.** Paket gratis Supabase **tidak menyediakan cadangan yang bisa diunduh**.
      Lakukan **Ekspor CSV** dari Panel Admin setiap bulan dan simpan di Google Drive pengurus,
      atau naik ke paket Pro (US$25/bulan) yang punya cadangan harian otomatis.

> 📌 **Catatan paket gratis Supabase:** proyek yang **tidak diakses sama sekali selama 7 hari**
> akan dijeda otomatis. Cukup buka dashboard Supabase dan klik *Restore*. Selama website rutin
> dikunjungi alumni, ini tidak akan terjadi.

---

## Panduan harian untuk pengurus

### Menghapus pendaftar asal ketik

**Admin → Verifikasi & Anggota** → pada akun yang dimaksud klik **🗑️ Hapus akun** → konfirmasi.
Akun, profil, foto, dan jawaban tracer study-nya terhapus permanen dan tercatat di **Jejak Audit**.
Akun admin tidak bisa dihapus (turunkan dulu perannya), dan kamu tidak bisa menghapus akunmu sendiri dari sini.

### Memverifikasi alumni baru

1. Masuk → **Admin** → **Verifikasi & Anggota** (tab *Menunggu*).
2. Klik **Lihat detail** untuk membuka data lengkap.
3. Cocokkan **NIM, angkatan, dan tahun lulus** dengan arsip fakultas / buku wisuda.
4. Klik **✓ Verifikasi**, atau **✕ Tolak…** dan tulis alasannya (alasan akan dilihat pendaftar).

### Peran pengguna

| Peran | Bisa apa |
|---|---|
| `pending` | Baru daftar. Hanya bisa mengisi profil sendiri. |
| `alumni` | Direktori alumni, video edukasi, dokumen penting, tracer study, profil. |
| `pengurus` | + mengelola berita, agenda, galeri, video, dokumen, lowongan, donasi, pengurus; melihat data alumni & rekap tracer. |
| `admin` | + memverifikasi alumni, mengubah peran, ekspor data, pengaturan situs, jejak audit. |

> Berikan peran **admin** hanya kepada 2–3 orang yang benar-benar dipercaya.

### Menulis berita

**Admin → Berita → + Tambah berita.** Isi judul, ringkasan, gambar sampul, dan isi.
Untuk format teks, pakai:

```
## Judul bagian
Paragraf biasa. **Teks tebal** dan *teks miring*.

- Butir daftar
- Butir lain

1. Langkah pertama
2. Langkah kedua
```

Klik tab **Pratinjau** untuk melihat hasilnya. Centang **Terbitkan** agar tampil untuk publik —
tanpa centang, berita tersimpan sebagai draf.

### Menambah foto galeri

**Admin → Galeri → + Tambah album** → isi judul → **Simpan** → di bawah akan muncul
tombol **+ Unggah foto** (bisa pilih banyak sekaligus).

### Menambah video edukasi

Video **tidak** disimpan di website (kuota gratis Supabase hanya 1 GB), melainkan di YouTube:

1. Buka **studio.youtube.com** dengan akun YouTube organisasi → **Buat → Upload video**.
2. Di langkah **Visibilitas**, pilih **Tidak publik (Unlisted)** — video tidak muncul di pencarian
   YouTube dan hanya bisa ditonton oleh orang yang punya tautannya.
3. Salin tautan videonya (contoh: `https://youtu.be/abc123XYZ00`).
4. Di website: **Admin → Video Edukasi → + Tambah video** → tempel tautan, isi judul, narasumber,
   kategori → centang **Terbitkan** → **Simpan**.

> 🔒 Halaman Video di website hanya bisa dibuka alumni terverifikasi. Tapi karena berkasnya di YouTube,
> siapa pun yang **memegang tautan YouTube-nya** tetap bisa menonton. Jadi jangan pilih status *Publik*,
> dan untuk materi yang sangat sensitif pilih **Pribadi (Private)** lalu undang email tertentu di YouTube.

### Mengunggah dokumen penting (sertifikat akreditasi, SK, formulir)

1. **Admin → Dokumen → + Tambah dokumen**.
2. Klik **Pilih berkas** → pilih PDF-nya (maks. 25 MB; Word/Excel/PowerPoint/JPG/PNG juga bisa).
3. Isi judul, kategori (mis. *Akreditasi*), nomor SK, tanggal, dan **Berlaku sampai** untuk sertifikat —
   alumni akan melihat tanda *Berlaku* / *Kedaluwarsa* secara otomatis.
4. Centang **Terbitkan** → **Simpan**.

> 🔒 Berkas disimpan di penyimpanan tertutup. Tombol *Unduh* membuat tautan yang hangus dalam 60 detik,
> jadi tautan unduhan tidak bisa disebar ke luar. Dokumen yang belum dicentang *Terbitkan* hanya bisa
> dilihat pengurus. Kalau berkas diganti atau dokumen dihapus, berkas lamanya ikut terhapus.

### Rekap tracer study untuk akreditasi

**Admin → Rekap Tracer Study** menampilkan masa tunggu kerja, kesesuaian bidang, dan
penilaian 8 kompetensi. Klik **⬇ Ekspor CSV** untuk mengolahnya di Excel. File ekspor
**tidak berisi nama atau NIM** — aman untuk dilampirkan di borang.

---

## Fitur baru: mentoring, webinar SKP, iuran, perpustakaan & arsip

Fitur ini meniru hal terbaik dari tiga asosiasi alumni kedokteran dunia:
**mentoring** ala Harvard, **webinar ber-SKP + perpustakaan** ala Johns Hopkins,
dan **iuran transparan + arsip lulusan** ala Medical Alumni Association Maryland.

### ⚠️ Pasang dulu database-nya (sekali saja, 2 menit)

1. Buka **supabase.com** → proyekmu → menu kiri **SQL Editor** → **New query**.
2. Buka berkas `supabase/08_fitur_lanjutan.sql` di laptop (klik kanan → *Buka dengan* → TextEdit),
   tekan `⌘ + A` lalu `⌘ + C`.
3. Tempel di SQL Editor (`⌘ + V`) → klik **Run**. Harus muncul *Success. No rows returned*.

> Aman dijalankan ulang. Kalau sebelumnya belum pernah memasang database sama sekali,
> cukup jalankan `SEMUA_SEKALIGUS.sql` — isinya sudah termasuk berkas 08.

Setelah itu **online-kan ulang** website (kirim kode ke GitHub → Vercel memperbarui otomatis).

### 🤝 Mentoring alumni

- Alumni membuka **Ruang Alumni → Mentoring**, memilih mentor sesuai topik (pilih spesialisasi,
  seleksi PPDS, buka praktik, dll.), lalu mengirim permintaan *obrolan kilat ±30 menit* atau *pendampingan*.
- Alumni senior mendaftar jadi mentor di **Mentoring → Jadi mentor**: pilih topik, cara bertemu, dan kuota per bulan.
- Setelah mentor menekan **Terima**, nomor WhatsApp & email keduanya saling terbuka. Isi pesan
  **tidak bisa dibaca pengurus** — hanya angka ringkasannya yang tampil di dasbor Admin.
- 💡 Ajak 10–20 senior dari berbagai spesialisasi jadi mentor pertama sebelum fitur ini diumumkan.

### 🎓 Webinar ber-SKP dengan sertifikat otomatis

1. **Admin → Agenda → + Tambah agenda**. Isi seperti biasa, lalu lengkapi:
   *Jumlah SKP*, *Nomor akreditasi SKP*, *Penanda tangan sertifikat*, *Biaya pendaftaran web* (kosongkan bila gratis).
2. Centang **Buka pendaftaran lewat website**. Centang juga *Boleh diikuti dokter non-alumni* bila webinarnya untuk umum.
3. Buka **Admin → Webinar & SKP** → klik kegiatannya:
   - Isi **tautan Zoom** dan catatan (Meeting ID, passcode). Hanya peserta terdaftar yang bisa melihatnya.
   - Tulis **soal kuis** dengan format sederhana (contoh ada di kotaknya). Beri tanda `*` di depan jawaban benar.
     Kosongkan bila tanpa kuis.
4. **Saat webinar berlangsung**: klik 🎲 **Acak** untuk membuat kode presensi → **Simpan** → umumkan kodenya di Zoom.
5. Peserta mengisi kode → kuis → evaluasi, lalu **sertifikat terbit otomatis** (bisa diunduh sebagai PDF).
   Setiap sertifikat punya kode verifikasi yang bisa dicek siapa pun di `/verifikasi`.
6. Peserta yang hadir tapi gagal mengisi kode (sinyal buruk, dll.) bisa ditandai **Tandai hadir** di daftar peserta.

> ⚖️ **Soal SKP:** sejak UU Kesehatan 17/2023, SKP dikelola Kementerian Kesehatan lewat Plataran Sehat /
> SATUSEHAT SDMK. Ajukan akreditasi SKP kegiatanmu di sana (atau lewat lembaga berwenang) dan
> tuliskan nomornya di kolom *Nomor akreditasi SKP*. Portofolio SKP di website ini adalah catatan
> pribadi alumni untuk memudahkan rekap, bukan pengganti pencatatan resmi.

### 💳 Iuran, konfirmasi transfer & laporan keuangan

1. **Admin → Program Iuran & Donasi → + Tambah program donasi**: buat program *Iuran Anggota Tahunan*,
   pilih **Jenis program: iuran**, isi besar iuran per tahun dan nomor rekening, centang *Tampilkan*.
   Program lain (mis. *Donasi AKU*, beasiswa, bakti sosial) tetap berjenis **donasi**.
2. Alumni transfer, lalu menekan **Sudah transfer? Konfirmasi di sini** dan mengunggah bukti transfer.
3. Bendahara membuka **Admin → Pembayaran**, klik **🧾 Lihat bukti**, cocokkan dengan mutasi rekening, lalu **✓ Terima**.
   Otomatis: masuk Buku Kas, angka *terkumpul* bertambah, peserta webinar berbayar jadi aktif.
   Salah terima? Klik **✕ Tolak** — semua efeknya dibatalkan kembali.
4. **Pengeluaran** dicatat di **Admin → Buku Kas → + Tambah transaksi** (jenis *keluar*).
5. Alumni terverifikasi bisa melihat **Laporan Keuangan** (saldo, grafik per bulan, rincian) —
   tanpa nama pembayar.

### 📚 Perpustakaan digital

Sudah terisi 9 sumber gratis (PubMed, Cochrane, WHO, NICE, Plataran Sehat, MDCalc, dll.).
Tambah/ubah di **Admin → Perpustakaan**. Hanya alumni terverifikasi yang bisa membuka halamannya.

### 🗂️ Arsip lulusan

1. Siapkan daftar lulusan di Excel/Google Sheets dengan kolom berurutan:
   **Nama · NIM · Angkatan · Tahun lulus · Keterangan**.
2. Blok semua barisnya → `⌘ + C` → buka **Admin → Arsip Lulusan** → tempel di kotak impor → **Impor**.
3. Hasilnya:
   - Alumni bisa melihat daftar lulusan per tahun dan siapa yang sudah bergabung (NIM tidak ditampilkan).
   - Di **Verifikasi & Anggota**, pendaftar yang NIM-nya cocok dengan arsip diberi tanda hijau
     **✓ cocok arsip** — verifikasi jadi jauh lebih cepat.

---

## Kalau ada masalah

| Gejala | Penyebab & solusi |
|---|---|
| Beranda menampilkan kotak kuning "database belum tersambung" | `.env.local` belum diisi atau salah ketik. Ulangi Langkah 2c, lalu matikan (`Ctrl+C`) dan jalankan ulang `npm run dev`. |
| `command not found: npm` | Node.js belum terpasang. Unduh versi LTS dari **nodejs.org**, pasang, tutup & buka ulang Terminal. |
| Email konfirmasi tidak datang | Cek folder spam. Bila banyak yang mendaftar, batas email bawaan Supabase habis → pasang SMTP (Langkah 6). |
| Setelah klik tautan email muncul "tautan kedaluwarsa" | Tautan harus dibuka di **browser yang sama** dengan saat mendaftar. Atau Redirect URL di Supabase belum ditambahkan (Langkah 2d / 5c). |
| Menu Admin tidak muncul | Langkah 4 belum dijalankan, atau email di perintah SQL tidak sama persis. |
| Alumni bilang "Akses ditolak" di direktori | Akunnya belum diverifikasi. Buka Admin → Verifikasi & Anggota. |
| Vercel gagal deploy | Buka tab **Deployments → Build Logs**. Paling sering: Environment Variables belum diisi. |
| Lupa kata sandi admin | Pakai fitur **Lupa kata sandi** di halaman Masuk. |
| Halaman Mentoring / Webinar / Pembayaran menampilkan pesan "function … does not exist" | Berkas `08_fitur_lanjutan.sql` belum dijalankan di Supabase. Lihat bagian *Fitur baru* di atas. |
| Peserta bilang "Kode presensi salah" | Pastikan kode di Admin → Webinar sudah **disimpan**. Huruf besar/kecil tidak berpengaruh. |
| Sertifikat tidak muncul | Peserta harus: hadir (isi kode) + lulus kuis (bila ada) + mengisi evaluasi. Cek kolomnya di daftar peserta. |

---

*Struktur teknis proyek dijelaskan di [README.md](README.md).*
