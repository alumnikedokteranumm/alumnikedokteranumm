-- =============================================================================
--  Alumni Kedokteran UMM — 06. VIDEO EDUKASI & DOKUMEN PENTING
--  Keduanya KHUSUS alumni terverifikasi. Pengunjung umum dan akun yang belum
--  diverifikasi tidak bisa melihat daftar, membuka, maupun mengunduhnya.
-- =============================================================================

-- ---------- Video edukasi (berkas videonya di YouTube, di sini hanya tautannya)
create table if not exists public.video (
  id           uuid primary key default gen_random_uuid(),
  judul        text not null,
  url_video    text not null,             -- tautan YouTube (disarankan status "Unlisted")
  kategori     text default 'Webinar & Seminar',
  pembicara    text,
  tanggal      date,
  durasi       text,                      -- contoh: "1 jam 20 menit"
  deskripsi    text default '',
  terbit       boolean not null default false,
  dibuat_pada  timestamptz not null default now()
);
create index if not exists idx_video_terbit on public.video(terbit, tanggal desc);

-- ---------- Dokumen penting (berkasnya di bucket tertutup "dokumen")
create table if not exists public.dokumen (
  id              uuid primary key default gen_random_uuid(),
  judul           text not null,
  kategori        text default 'Akreditasi',
  nomor_dokumen   text,                   -- nomor SK / sertifikat
  tanggal_dokumen date,
  berlaku_sampai  date,                   -- untuk sertifikat akreditasi, dsb.
  deskripsi       text,
  file_path       text not null,          -- path di bucket "dokumen"
  nama_file       text,                   -- nama asli berkas saat diunggah
  ukuran_byte     bigint,
  terbit          boolean not null default false,
  dibuat_pada     timestamptz not null default now()
);
create index if not exists idx_dokumen_terbit on public.dokumen(terbit, kategori);

-- ---------- Keamanan baris
alter table public.video   enable row level security;
alter table public.dokumen enable row level security;

drop policy if exists video_baca_alumni   on public.video;
drop policy if exists video_kelola        on public.video;
drop policy if exists dokumen_baca_alumni on public.dokumen;
drop policy if exists dokumen_kelola      on public.dokumen;

create policy video_baca_alumni on public.video
  for select to authenticated
  using ((terbit and public.is_alumni_aktif()) or public.is_pengurus());

create policy video_kelola on public.video
  for all to authenticated using (public.is_pengurus()) with check (public.is_pengurus());

create policy dokumen_baca_alumni on public.dokumen
  for select to authenticated
  using ((terbit and public.is_alumni_aktif()) or public.is_pengurus());

create policy dokumen_kelola on public.dokumen
  for all to authenticated using (public.is_pengurus()) with check (public.is_pengurus());

revoke all on public.video   from anon;
revoke all on public.dokumen from anon;

-- ---------- Bucket tertutup untuk berkas dokumen (maks. 25 MB per berkas)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('dokumen', 'dokumen', false, 26214400, array[
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'image/jpeg', 'image/png'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists dokumen_berkas_baca   on storage.objects;
drop policy if exists dokumen_berkas_kelola on storage.objects;

-- Alumni hanya bisa membuka berkas yang terhubung ke dokumen yang SUDAH TERBIT.
-- Berkas draf atau berkas yang sudah dilepas dari dokumennya tidak bisa diakses.
create policy dokumen_berkas_baca on storage.objects
  for select to authenticated
  using (bucket_id = 'dokumen' and (
    public.is_pengurus() or (
      public.is_alumni_aktif() and exists (
        select 1 from public.dokumen d where d.file_path = storage.objects.name and d.terbit))));

create policy dokumen_berkas_kelola on storage.objects
  for all to authenticated
  using (bucket_id = 'dokumen' and public.is_pengurus())
  with check (bucket_id = 'dokumen' and public.is_pengurus());
