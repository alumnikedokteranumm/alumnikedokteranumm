-- =============================================================================
--  Alumni Kedokteran UMM — 02. KEAMANAN BARIS (Row Level Security)
--  Jalankan SETELAH 01_skema.sql.
--
--  Prinsip: database menolak lebih dulu. Walaupun ada bug di kode website,
--  Postgres tetap tidak mengizinkan orang membaca data yang bukan haknya.
-- =============================================================================

-- ---------- Fungsi bantu peran ----------------------------------------------
-- SECURITY DEFINER: berjalan sebagai pemilik tabel sehingga tidak memicu
-- rekursi tak berujung saat dipakai di dalam policy tabel profiles itu sendiri.

create or replace function public.peran_saya()
returns public.peran language sql stable security definer set search_path = '' as $$
  select p.peran from public.profiles p where p.id = (select auth.uid());
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce(
    (select p.peran = 'admin' from public.profiles p where p.id = (select auth.uid())),
    false);
$$;

-- Pengurus = admin + pengurus (boleh kelola konten, TIDAK boleh ubah peran)
create or replace function public.is_pengurus()
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce(
    (select p.peran in ('admin','pengurus') from public.profiles p where p.id = (select auth.uid())),
    false);
$$;

-- Alumni aktif = sudah diverifikasi admin. Hanya mereka yang boleh buka direktori.
create or replace function public.is_alumni_aktif()
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce(
    (select p.status = 'terverifikasi' and p.peran in ('alumni','pengurus','admin')
       from public.profiles p where p.id = (select auth.uid())),
    false);
$$;

grant execute on function public.peran_saya, public.is_admin,
                          public.is_pengurus, public.is_alumni_aktif to authenticated;

-- =============================================================================
--  profiles — TABEL PALING SENSITIF
--  Aturan: seseorang hanya bisa membaca BARIS MILIKNYA SENDIRI.
--  Direktori alumni TIDAK membaca tabel ini langsung; ia lewat fungsi
--  public.cari_alumni() di file 03 yang sudah menyaring kolom privat.
-- =============================================================================
alter table public.profiles enable row level security;

drop policy if exists profiles_baca_sendiri   on public.profiles;
drop policy if exists profiles_baca_pengurus  on public.profiles;
drop policy if exists profiles_ubah_sendiri   on public.profiles;
drop policy if exists profiles_ubah_admin     on public.profiles;
drop policy if exists profiles_sisip_sendiri  on public.profiles;
drop policy if exists profiles_hapus_admin    on public.profiles;

create policy profiles_baca_sendiri on public.profiles
  for select to authenticated using (id = (select auth.uid()));

create policy profiles_baca_pengurus on public.profiles
  for select to authenticated using (public.is_pengurus());

-- Sengaja TIDAK ada policy INSERT: baris profil hanya dibuat oleh trigger
-- buat_profil_baru() saat mendaftar, sehingga tidak ada yang bisa menyisipkan
-- baris dengan peran 'admin' buatannya sendiri.

-- Alumni boleh mengubah datanya sendiri; kolom sistem (peran, status) tetap
-- dikunci oleh trigger kunci_kolom_sistem() dari file 01.
create policy profiles_ubah_sendiri on public.profiles
  for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy profiles_ubah_admin on public.profiles
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

create policy profiles_hapus_admin on public.profiles
  for delete to authenticated using (public.is_admin());

-- =============================================================================
--  tracer — jawaban kuesioner
--  Alumni: hanya jawabannya sendiri. Admin: semua (untuk rekap akreditasi).
-- =============================================================================
alter table public.tracer enable row level security;

drop policy if exists tracer_sendiri on public.tracer;
drop policy if exists tracer_admin   on public.tracer;

create policy tracer_sendiri on public.tracer
  for all to authenticated
  using (profil_id = (select auth.uid()))
  with check (profil_id = (select auth.uid()) and public.is_alumni_aktif());

create policy tracer_admin on public.tracer
  for select to authenticated using (public.is_pengurus());

-- =============================================================================
--  KONTEN PUBLIK — siapa pun boleh baca yang sudah terbit,
--  hanya pengurus/admin yang boleh menulis.
-- =============================================================================
do $$
declare t text;
begin
  foreach t in array array['berita','acara','album','lowongan'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I', t||'_baca_publik', t);
    execute format('drop policy if exists %I on public.%I', t||'_kelola_pengurus', t);
    execute format(
      'create policy %I on public.%I for select to anon, authenticated using (terbit = true or public.is_pengurus())',
      t||'_baca_publik', t);
    execute format(
      'create policy %I on public.%I for all to authenticated using (public.is_pengurus()) with check (public.is_pengurus())',
      t||'_kelola_pengurus', t);
  end loop;

  -- Tabel tanpa kolom "terbit": boleh dibaca siapa saja
  foreach t in array array['foto','donasi','pengurus','pengaturan'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I', t||'_baca_publik', t);
    execute format('drop policy if exists %I on public.%I', t||'_kelola_pengurus', t);
    execute format(
      'create policy %I on public.%I for select to anon, authenticated using (true)', t||'_baca_publik', t);
    execute format(
      'create policy %I on public.%I for all to authenticated using (public.is_pengurus()) with check (public.is_pengurus())',
      t||'_kelola_pengurus', t);
  end loop;
end $$;

-- =============================================================================
--  jejak_audit — hanya admin yang boleh membaca; penulisan lewat fungsi server.
-- =============================================================================
alter table public.jejak_audit enable row level security;
drop policy if exists audit_baca_admin  on public.jejak_audit;
drop policy if exists audit_tulis_masuk on public.jejak_audit;

create policy audit_baca_admin on public.jejak_audit
  for select to authenticated using (public.is_admin());

create policy audit_tulis_masuk on public.jejak_audit
  for insert to authenticated
  with check (aktor_id = (select auth.uid()) and public.is_pengurus());

-- =============================================================================
--  Cabut akses langsung anon ke tabel profil & tracer (sabuk pengaman kedua)
-- =============================================================================
revoke all on public.profiles    from anon;
revoke all on public.tracer      from anon;
revoke all on public.jejak_audit from anon;
