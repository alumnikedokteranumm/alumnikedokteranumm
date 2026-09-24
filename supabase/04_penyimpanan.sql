-- =============================================================================
--  Alumni Kedokteran UMM — 04. PENYIMPANAN BERKAS (Storage)
--  Jalankan SETELAH 03_fungsi.sql.
--
--  Dua ember (bucket):
--   • "publik" : sampul berita, poster acara, foto galeri, logo → boleh dilihat siapa pun
--   • "avatar" : foto profil alumni → TERTUTUP. Hanya alumni terverifikasi yang
--                bisa melihat, lewat tautan bertanda tangan yang kedaluwarsa 1 jam.
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('publik', 'publik', true, 5242880,
        array['image/jpeg','image/png','image/webp','image/avif'])
on conflict (id) do update set
  public = true, file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg','image/png','image/webp','image/avif'];

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatar', 'avatar', false, 2097152,
        array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set
  public = false, file_size_limit = 2097152,
  allowed_mime_types = array['image/jpeg','image/png','image/webp'];

-- ---------- Bucket publik ----------------------------------------------------
drop policy if exists publik_baca    on storage.objects;
drop policy if exists publik_kelola  on storage.objects;

create policy publik_baca on storage.objects
  for select to anon, authenticated using (bucket_id = 'publik');

create policy publik_kelola on storage.objects
  for all to authenticated
  using (bucket_id = 'publik' and public.is_pengurus())
  with check (bucket_id = 'publik' and public.is_pengurus());

-- ---------- Bucket avatar ----------------------------------------------------
-- Susunan berkas: avatar/<id-pengguna>/foto.jpg
-- Sehingga seseorang hanya bisa menulis ke dalam foldernya sendiri.
drop policy if exists avatar_baca_alumni on storage.objects;
drop policy if exists avatar_unggah_sendiri on storage.objects;
drop policy if exists avatar_ubah_sendiri on storage.objects;
drop policy if exists avatar_hapus_sendiri on storage.objects;

create policy avatar_baca_alumni on storage.objects
  for select to authenticated
  using (bucket_id = 'avatar'
         and (public.is_alumni_aktif() or (storage.foldername(name))[1] = auth.uid()::text));

create policy avatar_unggah_sendiri on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatar'
              and (storage.foldername(name))[1] = auth.uid()::text);

create policy avatar_ubah_sendiri on storage.objects
  for update to authenticated
  using (bucket_id = 'avatar' and (storage.foldername(name))[1] = auth.uid()::text);

create policy avatar_hapus_sendiri on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatar'
         and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));
