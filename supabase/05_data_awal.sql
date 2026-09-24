-- =============================================================================
--  Alumni Kedokteran UMM — 05. DATA AWAL
--  Jalankan TERAKHIR. Isinya contoh konten supaya website tidak kosong melompong.
--  Semua boleh kamu hapus/ubah nanti lewat halaman Admin.
-- =============================================================================

insert into public.pengaturan (kunci, nilai, keterangan) values
  ('nama_organisasi', 'Alumni Kedokteran UMM', 'Nama organisasi'),
  ('singkatan',       'Alumni Kedokteran UMM',                            'Singkatan/akronim'),
  ('tagline',         'Merawat Silaturahmi, Menguatkan Pengabdian', 'Slogan di beranda'),
  ('alamat',          'Jl. Bendungan Sutami No.188, Sumbersari, Kec. Lowokwaru, Kota Malang, Jawa Timur 65145', 'Alamat sekretariat'),
  ('email',           'alumnikedokteran.umm@gmail.com', 'Email utama'),
  ('email_kampus',    'alumnifk@umm.ac.id',      'Email resmi kampus'),
  ('telepon',         '(0341) 551149',           'Telepon sekretariat'),
  ('whatsapp',        '',                        'Nomor WA narahubung'),
  ('instagram',       '',                        'Instagram'),
  ('youtube',         '',                        'YouTube'),
  ('tiktok',          '',                        'TikTok'),
  ('facebook',        '',                        'Facebook'),
  ('linkedin',        '',                        'LinkedIn'),
  ('x',               '',                        'X (Twitter)'),
  ('sambutan_judul',  'Sambutan Ketua Umum',     'Judul blok sambutan'),
  ('sambutan_nama',   'dr. (Nama Ketua), Sp.PD', 'Nama ketua umum'),
  ('sambutan_isi',    'Assalamu''alaikum warahmatullahi wabarakatuh. Selamat datang di rumah digital alumni Fakultas Kedokteran Universitas Muhammadiyah Malang. Portal ini kami hadirkan agar tali silaturahmi antaralumni tetap terjaga, agar kabar dan peluang dapat mengalir lebih cepat, dan agar kontribusi kita kepada almamater serta masyarakat semakin terarah. Mari perbarui data, aktif berbagi, dan terus mengabdi.', 'Isi sambutan'),
  ('tentang_sejarah', 'Fakultas Kedokteran Universitas Muhammadiyah Malang meluluskan dokter-dokter yang kini tersebar di seluruh penjuru Indonesia — dari puskesmas di pelosok hingga rumah sakit rujukan nasional, dari ruang kuliah hingga lembaga kebijakan kesehatan. Alumni Kedokteran UMM lahir dari kebutuhan sederhana: agar para lulusan tetap saling terhubung setelah jubah putih dikenakan di tempat yang berbeda-beda.', 'Paragraf sejarah'),
  ('tentang_visi',    'Menjadi wadah alumni yang solid, profesional, dan berkontribusi nyata bagi kemajuan almamater serta derajat kesehatan masyarakat.', 'Visi'),
  ('tentang_misi',    'Mempererat silaturahmi antaralumni lintas angkatan;Mengembangkan kapasitas profesional melalui pendidikan berkelanjutan;Mendukung pengembangan akademik dan mutu lulusan FK UMM;Menggerakkan pengabdian masyarakat di bidang kesehatan;Membangun jejaring karier dan kolaborasi keilmuan', 'Misi, pisahkan dengan titik koma'),
  ('donasi_catatan',  'Setiap rupiah dicatat dan dilaporkan secara terbuka dalam laporan keuangan tahunan Alumni Kedokteran UMM.', 'Catatan di halaman donasi')
on conflict (kunci) do nothing;

insert into public.pengurus (nama, jabatan, periode, urutan)
select * from (values
  ('dr. (Nama Ketua), Sp.PD',        'Ketua Umum',        '2024–2027', 1),
  ('dr. (Nama Sekretaris), M.Kes',   'Sekretaris Umum',   '2024–2027', 2),
  ('dr. (Nama Bendahara)',           'Bendahara Umum',    '2024–2027', 3),
  ('dr. (Nama), Sp.A',               'Ketua Bidang Organisasi',        '2024–2027', 4),
  ('dr. (Nama), Sp.OG',              'Ketua Bidang Pengembangan Profesi','2024–2027', 5),
  ('dr. (Nama)',                     'Ketua Bidang Pengabdian Masyarakat','2024–2027', 6)
) as v(nama, jabatan, periode, urutan)
where not exists (select 1 from public.pengurus);

insert into public.berita (slug, judul, ringkasan, kategori, konten, terbit, terbit_pada) values
(
  'portal-alumni-fk-umm-resmi-dibuka',
  'Portal Alumni FK UMM Resmi Dibuka',
  'Satu pintu untuk data alumni, agenda ilmiah, peluang karier, dan tracer study — semuanya dalam satu tempat.',
  'Pengumuman',
  '## Selamat datang

Portal ini dibangun untuk menjawab satu pertanyaan yang sering muncul di grup angkatan: *"Ada yang tahu kontak dr. siapa yang sekarang di kota ini?"*

### Apa yang bisa kamu lakukan di sini

- **Perbarui data diri** supaya teman seangkatan dan adik tingkat bisa menemukanmu.
- **Cari alumni** berdasarkan angkatan, kota, atau bidang spesialisasi.
- **Ikuti agenda ilmiah** — seminar dan webinar ber-SKP IDI.
- **Lihat peluang karier** dari sesama alumni dan mitra institusi.
- **Isi tracer study**, yang datanya dipakai untuk akreditasi dan perbaikan kurikulum.

### Data kamu aman

Direktori alumni hanya bisa dibuka oleh alumni yang sudah diverifikasi pengurus. Kamu sendiri yang menentukan kontak mana yang boleh dilihat. Nomor STR dan SIP tidak pernah ditampilkan kepada siapa pun selain dirimu sendiri.

Mari mulai dengan melengkapi profil.',
  true, now()
),
(
  'tracer-study-2026-dibuka',
  'Tracer Study 2026 Telah Dibuka',
  'Pengisian kuesioner hanya butuh 7 menit, tetapi menentukan arah perbaikan kurikulum FK UMM.',
  'Akademik',
  '## Kenapa tracer study penting

Tracer study adalah cara fakultas mendengar suara lulusannya. Dari jawabanmu, fakultas mengetahui berapa lama rata-rata lulusan menunggu pekerjaan pertama, seberapa sesuai ilmu yang diajarkan dengan praktik di lapangan, dan kompetensi mana yang perlu diperkuat.

Hasilnya dipakai untuk dua hal: **borang akreditasi LAM-PTKes** dan **evaluasi kurikulum**.

### Cara mengisi

1. Masuk ke akun alumni.
2. Buka menu **Tracer Study**.
3. Isi empat bagian singkat, lalu simpan.

Jawaban dilaporkan dalam bentuk angka rata-rata, tidak pernah per individu.',
  true, now() - interval '3 days'
)
on conflict (slug) do nothing;

insert into public.acara (slug, judul, deskripsi, jenis, lokasi, daring, mulai, selesai, skp_idi, biaya, link_pendaftaran, terbit) values
('temu-alumni-akbar-2026', 'Temu Alumni Akbar FK UMM 2026',
 'Reuni lintas angkatan: sesi ilmiah pagi, ramah tamah siang, dan malam keakraban. Sekaligus pelantikan pengurus periode baru.',
 'Reuni', 'Aula GKB IV, Kampus III UMM, Malang', false,
 now() + interval '60 days', now() + interval '60 days 10 hours', null, 'Rp350.000', '', true),
('webinar-kegawatdaruratan', 'Webinar: Tata Laksana Kegawatdaruratan di Layanan Primer',
 'Pembaruan panduan penanganan kasus gawat darurat yang paling sering dijumpai dokter layanan primer. Sertifikat ber-SKP IDI.',
 'Webinar', 'Zoom Meeting', true,
 now() + interval '14 days', now() + interval '14 days 3 hours', 3.0, 'Gratis untuk alumni', '', true)
on conflict (slug) do nothing;

insert into public.lowongan (judul, institusi, jenis, lokasi, tipe_kerja, deskripsi, kualifikasi, kontak, batas_lamar, terbit)
select * from (values
('Dokter Umum IGD', 'RS Universitas Muhammadiyah Malang', 'Dokter Umum', 'Malang, Jawa Timur', 'Purna waktu',
 'Dibutuhkan dokter umum untuk penempatan Instalasi Gawat Darurat dengan sistem sif.',
 'Lulusan FK terakreditasi;Memiliki STR aktif;Sertifikat ACLS/ATLS masih berlaku;Bersedia kerja sif',
 'sdm@rsumm.ac.id', (now() + interval '45 days')::date, true),
('Beasiswa PPDS Program Kemitraan', 'Kementerian Kesehatan RI', 'Beasiswa', 'Seluruh Indonesia', 'Beasiswa',
 'Program bantuan biaya pendidikan dokter spesialis bagi dokter yang bersedia ditempatkan di daerah setelah lulus.',
 'Dokter umum dengan STR aktif;Masa pengabdian minimal 1 tahun;Lolos seleksi universitas tujuan',
 'Lihat laman resmi Kemenkes', (now() + interval '30 days')::date, true)
) as v(judul, institusi, jenis, lokasi, tipe_kerja, deskripsi, kualifikasi, kontak, batas_lamar, terbit)
where not exists (select 1 from public.lowongan);

insert into public.donasi (judul, deskripsi, target, terkumpul, bank, no_rekening, atas_nama, narahubung, aktif)
select * from (values
('Iuran Anggota Tahunan',
 'Iuran anggota membiayai operasional sekretariat, penerbitan buletin alumni, dan kegiatan temu ilmiah rutin. Besaran iuran Rp150.000 per tahun.',
 null::bigint, 0::bigint, 'Bank Syariah Indonesia', '0000000000', 'Alumni Kedokteran UMM', 'Bendahara — (isi nomor WA)', true),
('Beasiswa Adik Tingkat',
 'Dana bantuan pendidikan bagi mahasiswa FK UMM dari keluarga prasejahtera yang terkendala biaya, terutama saat memasuki tahap profesi.',
 250000000::bigint, 0::bigint, 'Bank Syariah Indonesia', '0000000000', 'Alumni Kedokteran UMM', 'Bendahara — (isi nomor WA)', true)
) as v(judul, deskripsi, target, terkumpul, bank, no_rekening, atas_nama, narahubung, aktif)
where not exists (select 1 from public.donasi);

-- =============================================================================
--  CARA MENJADIKAN DIRIMU ADMIN
--  1. Daftar dulu lewat halaman /daftar di website.
--  2. Ganti alamat email di bawah ini dengan email yang kamu pakai mendaftar.
--  3. Hapus tanda komentar (--) di depan blok update, lalu jalankan.
-- =============================================================================
-- update public.profiles set peran = 'admin', status = 'terverifikasi'
-- where id = (select id from auth.users where email = 'email-kamu@contoh.com');
