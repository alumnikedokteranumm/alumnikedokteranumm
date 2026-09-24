-- #############################################################################
--  Alumni Kedokteran UMM — SELURUH DATABASE DALAM SATU BERKAS
--
--  Cara pakai: Supabase → SQL Editor → New query → tempel SELURUH isi berkas
--  ini → klik "Run". Aman dijalankan ulang (tidak menggandakan data).
--
--  Berkas ini gabungan dari 01_skema, 02_keamanan, 03_fungsi, 04_penyimpanan,
--  06_video_dokumen, 07_hapus_akun, 05_data_awal, dan 08_fitur_lanjutan.
--  Bila ingin mengubah sesuatu, ubah berkas aslinya.
-- #############################################################################




-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> 01_skema.sql

-- =============================================================================
--  Alumni Kedokteran UMM — 01. SKEMA DATABASE
--  Jalankan file ini PERTAMA di Supabase → SQL Editor → New query → Run.
-- =============================================================================

-- ---------- Tipe data (enum) -------------------------------------------------
do $$ begin
  create type public.peran as enum ('pending','alumni','pengurus','admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.status_verifikasi as enum ('menunggu','terverifikasi','ditolak');
exception when duplicate_object then null; end $$;

do $$ begin
  -- visibilitas profil di direktori
  create type public.visibilitas as enum ('publik','alumni','privat');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.status_profesi as enum (
    'koas','internsip','dokter_umum','ppds','spesialis','subspesialis',
    'akademisi','non_klinis','studi_lanjut','belum_bekerja','lainnya'
  );
exception when duplicate_object then null; end $$;

-- =============================================================================
--  TABEL UTAMA: profiles (1 baris = 1 alumni, terhubung ke akun login)
-- =============================================================================
create table if not exists public.profiles (
  id                    uuid primary key references auth.users(id) on delete cascade,

  -- Identitas
  nim                   text unique,
  gelar_depan           text,
  nama_lengkap          text not null default '',
  gelar_belakang        text,
  jenis_kelamin         text check (jenis_kelamin in ('L','P')),
  tempat_lahir          text,
  tanggal_lahir         date,
  angkatan              int  check (angkatan between 1990 and 2100),
  tahun_lulus           int  check (tahun_lulus between 1990 and 2100),
  prodi                 text default 'Pendidikan Dokter',

  -- Kontak & domisili
  email_kontak          text,
  no_hp                 text,
  whatsapp              text,
  alamat                text,
  kota                  text,
  provinsi              text,
  kode_pos              text,
  negara                text default 'Indonesia',

  -- Profesi
  status_profesi        public.status_profesi default 'dokter_umum',
  spesialisasi          text,
  subspesialisasi       text,
  tempat_kerja          text,
  jabatan               text,
  kota_kerja            text,
  provinsi_kerja        text,
  no_str                text,            -- SENSITIF: tidak pernah tampil di direktori
  str_berlaku_sampai    date,
  no_sip                text,            -- SENSITIF
  anggota_idi           boolean default false,
  cabang_idi            text,

  -- Publik / sosial
  bio                   text,
  linkedin              text,
  instagram             text,
  situs_web             text,
  foto_path             text,            -- path di storage bucket "avatar"

  -- Pengaturan privasi (dipegang penuh oleh alumni sendiri)
  visibilitas           public.visibilitas not null default 'alumni',
  tampilkan_email       boolean not null default false,
  tampilkan_no_hp       boolean not null default false,
  tampilkan_whatsapp    boolean not null default false,
  tampilkan_alamat      boolean not null default false,
  tampilkan_tempat_kerja boolean not null default true,
  tampilkan_tanggal_lahir boolean not null default false,

  -- Persetujuan (amanat UU No. 27/2022 Pelindungan Data Pribadi)
  setuju_kebijakan      boolean not null default false,
  setuju_pada           timestamptz,

  -- Sistem
  peran                 public.peran not null default 'pending',
  status               public.status_verifikasi not null default 'menunggu',
  catatan_admin         text,
  diverifikasi_oleh     uuid references auth.users(id) on delete set null,
  diverifikasi_pada     timestamptz,
  dibuat_pada           timestamptz not null default now(),
  diperbarui_pada       timestamptz not null default now()
);

create index if not exists idx_profiles_angkatan    on public.profiles(angkatan);
create index if not exists idx_profiles_tahun_lulus on public.profiles(tahun_lulus);
create index if not exists idx_profiles_status      on public.profiles(status);
create index if not exists idx_profiles_kota        on public.profiles(lower(kota));
create index if not exists idx_profiles_spesialisasi on public.profiles(lower(spesialisasi));

-- =============================================================================
--  KONTEN PUBLIK
-- =============================================================================
create table if not exists public.berita (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,
  judul         text not null,
  ringkasan     text,
  konten        text not null default '',
  kategori      text default 'Umum',
  sampul_url    text,
  penulis_id    uuid references public.profiles(id) on delete set null,
  terbit        boolean not null default false,
  terbit_pada   timestamptz,
  dibuat_pada   timestamptz not null default now(),
  diperbarui_pada timestamptz not null default now()
);
create index if not exists idx_berita_terbit on public.berita(terbit, terbit_pada desc);

create table if not exists public.acara (
  id              uuid primary key default gen_random_uuid(),
  slug            text unique not null,
  judul           text not null,
  deskripsi       text default '',
  jenis           text default 'Seminar',           -- Reuni / Seminar / Webinar / Bakti Sosial
  lokasi          text,
  daring          boolean not null default false,
  mulai           timestamptz not null,
  selesai         timestamptz,
  skp_idi         numeric(4,1),                     -- jumlah SKP IDI bila ada
  biaya           text,
  kuota           int,
  link_pendaftaran text,
  poster_url      text,
  terbit          boolean not null default false,
  dibuat_pada     timestamptz not null default now()
);
create index if not exists idx_acara_mulai on public.acara(terbit, mulai desc);

create table if not exists public.album (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  judul       text not null,
  deskripsi   text,
  tanggal     date,
  sampul_url  text,
  terbit      boolean not null default false,
  dibuat_pada timestamptz not null default now()
);

create table if not exists public.foto (
  id          uuid primary key default gen_random_uuid(),
  album_id    uuid not null references public.album(id) on delete cascade,
  url         text not null,
  keterangan  text,
  urutan      int default 0
);
create index if not exists idx_foto_album on public.foto(album_id, urutan);

create table if not exists public.lowongan (
  id            uuid primary key default gen_random_uuid(),
  judul         text not null,
  institusi     text not null,
  jenis         text default 'Dokter Umum',   -- Dokter Umum / Spesialis / PPDS / Beasiswa / Akademik
  lokasi        text,
  tipe_kerja    text default 'Purna waktu',
  deskripsi     text default '',
  kualifikasi   text,
  kontak        text,
  tautan        text,
  batas_lamar   date,
  terbit        boolean not null default false,
  dibuat_oleh   uuid references public.profiles(id) on delete set null,
  dibuat_pada   timestamptz not null default now()
);
create index if not exists idx_lowongan_terbit on public.lowongan(terbit, dibuat_pada desc);

create table if not exists public.donasi (
  id            uuid primary key default gen_random_uuid(),
  judul         text not null,
  deskripsi     text default '',
  target        bigint,
  terkumpul     bigint default 0,
  bank          text,
  no_rekening   text,
  atas_nama     text,
  narahubung    text,
  aktif         boolean not null default true,
  dibuat_pada   timestamptz not null default now()
);

create table if not exists public.pengurus (
  id          uuid primary key default gen_random_uuid(),
  nama        text not null,
  jabatan     text not null,
  periode     text,
  angkatan    int,
  foto_url    text,
  urutan      int default 0
);

-- Pengaturan situs (key-value, diedit lewat halaman admin)
create table if not exists public.pengaturan (
  kunci       text primary key,
  nilai       text,
  keterangan  text
);

-- =============================================================================
--  TRACER STUDY (mengacu instrumen Tracer Study Dikti & borang LAM-PTKes)
-- =============================================================================
create table if not exists public.tracer (
  id                    uuid primary key default gen_random_uuid(),
  profil_id             uuid not null references public.profiles(id) on delete cascade,
  tahun_pengisian       int not null default extract(year from now()),
  tahun_lulus           int,

  -- Bagian A: status & masa tunggu
  status_saat_ini       text,      -- Bekerja / Wiraswasta / Melanjutkan studi / Belum bekerja
  masa_tunggu_bulan     int,       -- bulan sejak lulus sampai kerja pertama
  cara_dapat_kerja      text,
  jenis_instansi        text,      -- RS Pemerintah / RS Swasta / Puskesmas / Klinik / Instansi pendidikan / dll
  tingkat_instansi      text,      -- Lokal / Nasional / Multinasional
  posisi                text,
  lokasi_kerja          text,
  rentang_pendapatan    text,

  -- Bagian B: kesesuaian
  kesesuaian_bidang     int check (kesesuaian_bidang between 1 and 5),
  tingkat_pendidikan_sesuai text,

  -- Bagian C: penilaian kompetensi (1 = sangat kurang … 5 = sangat baik)
  k_etika               int check (k_etika between 1 and 5),
  k_keahlian            int check (k_keahlian between 1 and 5),
  k_bahasa_asing        int check (k_bahasa_asing between 1 and 5),
  k_teknologi           int check (k_teknologi between 1 and 5),
  k_komunikasi          int check (k_komunikasi between 1 and 5),
  k_kerjasama           int check (k_kerjasama between 1 and 5),
  k_pengembangan_diri   int check (k_pengembangan_diri between 1 and 5),
  k_kepemimpinan        int check (k_kepemimpinan between 1 and 5),

  -- Bagian D: umpan balik
  kepuasan_pendidikan   int check (kepuasan_pendidikan between 1 and 5),
  saran                 text,

  dibuat_pada           timestamptz not null default now(),
  diperbarui_pada       timestamptz not null default now(),
  unique (profil_id, tahun_pengisian)
);
create index if not exists idx_tracer_tahun on public.tracer(tahun_pengisian, tahun_lulus);

-- =============================================================================
--  JEJAK AUDIT — mencatat tindakan admin atas data pribadi
-- =============================================================================
create table if not exists public.jejak_audit (
  id          bigserial primary key,
  aktor_id    uuid references auth.users(id) on delete set null,
  aksi        text not null,      -- verifikasi / tolak / ubah_peran / ekspor_data / hapus
  target_id   uuid,
  rincian     jsonb,
  dibuat_pada timestamptz not null default now()
);
create index if not exists idx_audit_waktu on public.jejak_audit(dibuat_pada desc);

-- =============================================================================
--  TRIGGER
-- =============================================================================

-- 1. Otomatis buat baris profil saat ada pendaftaran akun baru
create or replace function public.buat_profil_baru()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, nama_lengkap, email_kontak, setuju_kebijakan, setuju_pada)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nama_lengkap', ''),
    new.email,
    coalesce((new.raw_user_meta_data->>'setuju_kebijakan')::boolean, false),
    case when (new.raw_user_meta_data->>'setuju_kebijakan')::boolean then now() end
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.buat_profil_baru();

-- 2. Stempel waktu diperbarui_pada
create or replace function public.stempel_waktu()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.diperbarui_pada := now();
  return new;
end $$;

drop trigger if exists trg_profiles_waktu on public.profiles;
create trigger trg_profiles_waktu before update on public.profiles
  for each row execute function public.stempel_waktu();

drop trigger if exists trg_tracer_waktu on public.tracer;
create trigger trg_tracer_waktu before update on public.tracer
  for each row execute function public.stempel_waktu();

drop trigger if exists trg_berita_waktu on public.berita;
create trigger trg_berita_waktu before update on public.berita
  for each row execute function public.stempel_waktu();

-- 3. PENTING: cegah alumni menaikkan perannya sendiri jadi admin
create or replace function public.kunci_kolom_sistem()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  peran_aktor public.peran;
begin
  -- auth.uid() kosong = dijalankan dari SQL Editor Supabase atau kunci service role
  -- (keduanya konteks tepercaya). Pengguna website SELALU punya auth.uid().
  if auth.uid() is null then
    if new.setuju_kebijakan and not coalesce(old.setuju_kebijakan, false) then
      new.setuju_pada := now();
    end if;
    return new;
  end if;

  select p.peran into peran_aktor from public.profiles p where p.id = auth.uid();

  if peran_aktor is distinct from 'admin' then
    new.peran             := old.peran;
    new.status            := old.status;
    new.catatan_admin     := old.catatan_admin;
    new.diverifikasi_oleh := old.diverifikasi_oleh;
    new.diverifikasi_pada := old.diverifikasi_pada;
  end if;

  -- Catat kapan persetujuan kebijakan privasi diberikan
  if new.setuju_kebijakan and not coalesce(old.setuju_kebijakan, false) then
    new.setuju_pada := now();
  end if;

  return new;
end $$;

drop trigger if exists trg_profiles_kunci on public.profiles;
create trigger trg_profiles_kunci before update on public.profiles
  for each row execute function public.kunci_kolom_sistem();


-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> 02_keamanan.sql

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


-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> 03_fungsi.sql

-- =============================================================================
--  Alumni Kedokteran UMM — 03. FUNGSI DIREKTORI & STATISTIK
--  Jalankan SETELAH 02_keamanan.sql.
--
--  Website TIDAK PERNAH membaca tabel profiles untuk direktori. Ia memanggil
--  fungsi di bawah ini, yang: (1) memeriksa pemanggil sudah alumni terverifikasi,
--  (2) membuang baris yang disembunyikan pemiliknya, (3) mengganti kolom privat
--  jadi NULL sebelum data meninggalkan database.
--  Nomor STR, SIP, NIK, alamat lengkap, dan tanggal lahir tidak pernah keluar.
-- =============================================================================

-- -----------------------------------------------------------------------------
--  cari_alumni() — mesin pencari direktori
-- -----------------------------------------------------------------------------
drop function if exists public.cari_alumni(text,int,int,text,text,public.status_profesi,int,int);

create or replace function public.cari_alumni(
  q               text  default null,
  f_angkatan      int   default null,
  f_tahun_lulus   int   default null,
  f_kota          text  default null,
  f_spesialisasi  text  default null,
  f_status        public.status_profesi default null,
  hal             int   default 1,
  per_hal         int   default 12
)
returns table (
  id              uuid,
  nama_tampil     text,
  nim             text,
  angkatan        int,
  tahun_lulus     int,
  status_profesi  public.status_profesi,
  spesialisasi    text,
  tempat_kerja    text,
  jabatan         text,
  kota_kerja      text,
  kota            text,
  provinsi        text,
  foto_path       text,
  bio             text,
  email_kontak    text,
  no_hp           text,
  whatsapp        text,
  linkedin        text,
  instagram       text,
  situs_web       text,
  total           bigint
)
language plpgsql stable security definer set search_path = '' as $$
declare
  batas  int := least(greatest(coalesce(per_hal, 12), 1), 60);
  lompat int := (greatest(coalesce(hal, 1), 1) - 1) * batas;
  aku    uuid := auth.uid();
begin
  if not public.is_alumni_aktif() then
    raise exception 'Akses ditolak: direktori alumni hanya untuk alumni terverifikasi.'
      using errcode = '42501';
  end if;

  return query
  with tersaring as (
    select p.*, count(*) over () as jml
    from public.profiles p
    where p.status = 'terverifikasi'
      and (p.visibilitas in ('publik','alumni') or p.id = aku)
      and (q is null or q = '' or (
            coalesce(p.nama_lengkap,'')  ilike '%' || q || '%' or
            coalesce(p.nim,'')           ilike '%' || q || '%' or
            coalesce(p.spesialisasi,'')  ilike '%' || q || '%' or
            coalesce(p.tempat_kerja,'')  ilike '%' || q || '%' or
            coalesce(p.kota_kerja,'')    ilike '%' || q || '%' or
            coalesce(p.kota,'')          ilike '%' || q || '%'))
      and (f_angkatan     is null or p.angkatan    = f_angkatan)
      and (f_tahun_lulus  is null or p.tahun_lulus = f_tahun_lulus)
      and (f_kota         is null or f_kota = '' or
           coalesce(p.kota_kerja, p.kota, '') ilike '%' || f_kota || '%')
      and (f_spesialisasi is null or f_spesialisasi = '' or
           coalesce(p.spesialisasi,'') ilike '%' || f_spesialisasi || '%')
      and (f_status       is null or p.status_profesi = f_status)
    order by p.angkatan nulls last, p.nama_lengkap
    limit batas offset lompat
  )
  select
    t.id,
    trim(both ' ' from
      coalesce(t.gelar_depan || ' ', '') || t.nama_lengkap ||
      coalesce(', ' || t.gelar_belakang, '')) as nama_tampil,
    t.nim,
    t.angkatan,
    t.tahun_lulus,
    t.status_profesi,
    t.spesialisasi,
    case when t.tampilkan_tempat_kerja or t.id = aku then t.tempat_kerja end,
    case when t.tampilkan_tempat_kerja or t.id = aku then t.jabatan     end,
    case when t.tampilkan_tempat_kerja or t.id = aku then t.kota_kerja  end,
    t.kota,
    t.provinsi,
    t.foto_path,
    t.bio,
    case when t.tampilkan_email    or t.id = aku then t.email_kontak end,
    case when t.tampilkan_no_hp    or t.id = aku then t.no_hp        end,
    case when t.tampilkan_whatsapp or t.id = aku then t.whatsapp     end,
    t.linkedin,
    t.instagram,
    t.situs_web,
    t.jml
  from tersaring t;
end $$;

-- -----------------------------------------------------------------------------
--  detail_alumni() — halaman profil satu alumni (aturan penyensoran sama)
-- -----------------------------------------------------------------------------
drop function if exists public.detail_alumni(uuid);

create or replace function public.detail_alumni(target uuid)
returns table (
  id uuid, nama_tampil text, nim text, angkatan int, tahun_lulus int, prodi text,
  status_profesi public.status_profesi, spesialisasi text, subspesialisasi text,
  tempat_kerja text, jabatan text, kota_kerja text, provinsi_kerja text,
  kota text, provinsi text, alamat text, bio text, foto_path text,
  email_kontak text, no_hp text, whatsapp text,
  linkedin text, instagram text, situs_web text,
  anggota_idi boolean, cabang_idi text,
  ulang_tahun text          -- 'DD-MM' saja, tahun lahir tidak pernah keluar
)
language plpgsql stable security definer set search_path = '' as $$
declare aku uuid := auth.uid();
begin
  if not public.is_alumni_aktif() then
    raise exception 'Akses ditolak.' using errcode = '42501';
  end if;

  return query
  select
    p.id,
    trim(both ' ' from coalesce(p.gelar_depan || ' ', '') || p.nama_lengkap ||
         coalesce(', ' || p.gelar_belakang, '')),
    p.nim, p.angkatan, p.tahun_lulus, p.prodi,
    p.status_profesi, p.spesialisasi, p.subspesialisasi,
    case when p.tampilkan_tempat_kerja or p.id = aku then p.tempat_kerja   end,
    case when p.tampilkan_tempat_kerja or p.id = aku then p.jabatan        end,
    case when p.tampilkan_tempat_kerja or p.id = aku then p.kota_kerja     end,
    case when p.tampilkan_tempat_kerja or p.id = aku then p.provinsi_kerja end,
    p.kota, p.provinsi,
    case when p.tampilkan_alamat or p.id = aku then p.alamat end,
    p.bio, p.foto_path,
    case when p.tampilkan_email    or p.id = aku then p.email_kontak end,
    case when p.tampilkan_no_hp    or p.id = aku then p.no_hp        end,
    case when p.tampilkan_whatsapp or p.id = aku then p.whatsapp     end,
    p.linkedin, p.instagram, p.situs_web, p.anggota_idi, p.cabang_idi,
    case when p.tampilkan_tanggal_lahir or p.id = aku
         then to_char(p.tanggal_lahir, 'DD-MM') end
  from public.profiles p
  where p.id = target
    and p.status = 'terverifikasi'
    and (p.visibilitas in ('publik','alumni') or p.id = aku);
end $$;

-- -----------------------------------------------------------------------------
--  opsi_filter() — daftar angkatan / kota / spesialisasi untuk dropdown
-- -----------------------------------------------------------------------------
create or replace function public.opsi_filter()
returns json language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_alumni_aktif() then
    raise exception 'Akses ditolak.' using errcode = '42501';
  end if;

  return json_build_object(
    'angkatan', (select coalesce(json_agg(a order by a desc), '[]'::json)
                 from (select distinct angkatan a from public.profiles
                       where status='terverifikasi' and angkatan is not null) s),
    'kota', (select coalesce(json_agg(k order by k), '[]'::json)
             from (select distinct coalesce(kota_kerja, kota) k from public.profiles
                   where status='terverifikasi'
                     and coalesce(kota_kerja, kota) is not null) s),
    'spesialisasi', (select coalesce(json_agg(sp order by sp), '[]'::json)
                     from (select distinct spesialisasi sp from public.profiles
                           where status='terverifikasi' and spesialisasi is not null
                             and spesialisasi <> '') s)
  );
end $$;

-- -----------------------------------------------------------------------------
--  statistik_publik() — hanya ANGKA AGREGAT, aman untuk pengunjung umum.
--  Tidak ada nama, tidak ada kontak. Sebaran yang isinya < 3 orang disembunyikan
--  supaya seseorang tidak bisa ditebak dari angka kecil.
-- -----------------------------------------------------------------------------
create or replace function public.statistik_publik()
returns json language sql stable security definer set search_path = '' as $$
  select json_build_object(
    'total_alumni',   (select count(*) from public.profiles where status='terverifikasi'),
    'total_angkatan', (select count(distinct angkatan) from public.profiles
                       where status='terverifikasi' and angkatan is not null),
    'total_spesialis',(select count(*) from public.profiles
                       where status='terverifikasi'
                         and status_profesi in ('spesialis','subspesialis')),
    'total_kota',     (select count(distinct coalesce(kota_kerja, kota)) from public.profiles
                       where status='terverifikasi' and coalesce(kota_kerja, kota) is not null),
    'sebaran_provinsi', (
      select coalesce(json_agg(x), '[]'::json) from (
        select coalesce(provinsi_kerja, provinsi) as provinsi, count(*) as jumlah
        from public.profiles
        where status='terverifikasi' and coalesce(provinsi_kerja, provinsi) is not null
        group by 1 having count(*) >= 3 order by 2 desc limit 10) x),
    'sebaran_profesi', (
      select coalesce(json_agg(x), '[]'::json) from (
        select status_profesi::text as status, count(*) as jumlah
        from public.profiles where status='terverifikasi' and status_profesi is not null
        group by 1 having count(*) >= 3 order by 2 desc) x)
  );
$$;

-- -----------------------------------------------------------------------------
--  rekap_tracer() — ringkasan tracer study untuk borang akreditasi (admin saja)
-- -----------------------------------------------------------------------------
create or replace function public.rekap_tracer(tahun int default null)
returns json language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_pengurus() then
    raise exception 'Akses ditolak.' using errcode = '42501';
  end if;

  return (
    select json_build_object(
      'jumlah_responden',      count(*),
      'rata_masa_tunggu',      round(avg(masa_tunggu_bulan)::numeric, 1),
      'persen_tunggu_kurang_6_bulan',
          round(100.0 * count(*) filter (where masa_tunggu_bulan <= 6)
                / nullif(count(*) filter (where masa_tunggu_bulan is not null), 0), 1),
      'rata_kesesuaian',       round(avg(kesesuaian_bidang)::numeric, 2),
      'rata_kepuasan',         round(avg(kepuasan_pendidikan)::numeric, 2),
      'kompetensi', json_build_object(
        'Etika',                round(avg(k_etika)::numeric, 2),
        'Keahlian bidang ilmu', round(avg(k_keahlian)::numeric, 2),
        'Bahasa asing',         round(avg(k_bahasa_asing)::numeric, 2),
        'Teknologi informasi',  round(avg(k_teknologi)::numeric, 2),
        'Komunikasi',           round(avg(k_komunikasi)::numeric, 2),
        'Kerja sama tim',       round(avg(k_kerjasama)::numeric, 2),
        'Pengembangan diri',    round(avg(k_pengembangan_diri)::numeric, 2),
        'Kepemimpinan',         round(avg(k_kepemimpinan)::numeric, 2)
      ),
      'status_kerja', (
        select coalesce(json_agg(x), '[]'::json) from (
          select coalesce(status_saat_ini,'Tidak diisi') as label, count(*) as jumlah
          from public.tracer t2
          where (tahun is null or t2.tahun_pengisian = tahun)
          group by 1 order by 2 desc) x),
      'jenis_instansi', (
        select coalesce(json_agg(x), '[]'::json) from (
          select coalesce(jenis_instansi,'Tidak diisi') as label, count(*) as jumlah
          from public.tracer t3
          where (tahun is null or t3.tahun_pengisian = tahun)
          group by 1 order by 2 desc) x)
    )
    from public.tracer t
    where (tahun is null or t.tahun_pengisian = tahun)
  );
end $$;

-- -----------------------------------------------------------------------------
--  Hak akses fungsi
-- -----------------------------------------------------------------------------
revoke all on function public.cari_alumni  from anon, public;
revoke all on function public.detail_alumni from anon, public;
revoke all on function public.opsi_filter   from anon, public;
revoke all on function public.rekap_tracer  from anon, public;

grant execute on function public.cari_alumni   to authenticated;
grant execute on function public.detail_alumni to authenticated;
grant execute on function public.opsi_filter   to authenticated;
grant execute on function public.rekap_tracer  to authenticated;
grant execute on function public.statistik_publik to anon, authenticated;


-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> 04_penyimpanan.sql

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


-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> 06_video_dokumen.sql

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


-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> 07_hapus_akun.sql

-- =============================================================================
--  Alumni Kedokteran UMM — 07. HAPUS AKUN
--  Menghapus akun login beserta profil, jawaban tracer, dan data terkait
--  (ikut terhapus otomatis lewat "on delete cascade").
--  Tidak memerlukan kunci service_role: pemeriksaan hak dilakukan di sini.
-- =============================================================================

-- ---------- Admin menghapus akun pendaftar (mis. data asal ketik) ------------
create or replace function public.hapus_pengguna(target uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  peran_target public.peran;
begin
  if not public.is_admin() then
    raise exception 'Hanya admin yang boleh menghapus akun.' using errcode = '42501';
  end if;
  if target = auth.uid() then
    raise exception 'Kamu tidak bisa menghapus akunmu sendiri dari sini.';
  end if;

  select p.peran into peran_target from public.profiles p where p.id = target;
  if peran_target = 'admin' then
    raise exception 'Akun admin tidak bisa dihapus. Turunkan dulu perannya menjadi alumni.';
  end if;

  -- Catat siapa menghapus siapa (nama & NIM saja, untuk akuntabilitas)
  insert into public.jejak_audit (aktor_id, aksi, target_id, rincian)
  select auth.uid(), 'hapus_pengguna', target,
         jsonb_build_object('nama', p.nama_lengkap, 'nim', p.nim, 'status', p.status)
  from public.profiles p where p.id = target;

  delete from auth.users where id = target;
end $$;

-- ---------- Alumni TIDAK boleh menghapus akunnya sendiri ------------------
-- Permintaan penghapusan (hak UU PDP Pasal 8) diajukan ke pengurus, lalu admin
-- menghapus lewat hapus_pengguna(). Fungsi hapus-sendiri versi lama dicabut:
drop function if exists public.hapus_akun_saya();

revoke all on function public.hapus_pengguna(uuid) from public, anon;
grant execute on function public.hapus_pengguna(uuid) to authenticated;


-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> 05_data_awal.sql

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


-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> 08_fitur_lanjutan.sql

-- =============================================================================
--  Alumni Kedokteran UMM — 08. FITUR LANJUTAN
--  Terinspirasi Harvard Medical Alumni (mentoring), Johns Hopkins (CME &
--  perpustakaan), dan Medical Alumni Association Maryland (iuran & arsip).
--
--    A. Mentoring alumni (termasuk "flash-mentoring" 30 menit)
--    B. Webinar ber-SKP: daftar → presensi → kuis → evaluasi → sertifikat
--    C. Iuran & donasi: konfirmasi transfer + buku kas + laporan keuangan
--    D. Perpustakaan digital & arsip lulusan
--
--  Jalankan SETELAH 01–07. Aman dijalankan ulang (tidak menggandakan data).
-- =============================================================================


-- #############################################################################
--  A. MENTORING
-- #############################################################################

do $$ begin
  create type public.status_mentoring as enum ('menunggu','diterima','ditolak','selesai','dibatalkan');
exception when duplicate_object then null; end $$;

-- Alumni yang bersedia menjadi mentor (1 baris per orang)
create table if not exists public.mentor (
  profil_id       uuid primary key references public.profiles(id) on delete cascade,
  aktif           boolean not null default true,
  topik           text[]  not null default '{}',   -- Pilih spesialisasi, Persiapan PPDS, dll.
  cara_temu       text[]  not null default '{}',   -- Chat WhatsApp / Panggilan video / Tatap muka
  pengantar       text,
  kuota_bulanan   int not null default 3 check (kuota_bulanan between 1 and 20),
  dibuat_pada     timestamptz not null default now(),
  diperbarui_pada timestamptz not null default now()
);

create table if not exists public.permintaan_mentoring (
  id              uuid primary key default gen_random_uuid(),
  mentee_id       uuid not null references public.profiles(id) on delete cascade,
  mentor_id       uuid not null references public.profiles(id) on delete cascade,
  jenis           text not null default 'flash' check (jenis in ('flash','berkelanjutan')),
  topik           text not null,
  pesan           text not null,
  status          public.status_mentoring not null default 'menunggu',
  balasan         text,
  dibuat_pada     timestamptz not null default now(),
  diperbarui_pada timestamptz not null default now(),
  check (mentee_id <> mentor_id)
);
create index if not exists idx_mentoring_mentor on public.permintaan_mentoring(mentor_id, status);
create index if not exists idx_mentoring_mentee on public.permintaan_mentoring(mentee_id, status);

drop trigger if exists trg_mentor_waktu on public.mentor;
create trigger trg_mentor_waktu before update on public.mentor
  for each row execute function public.stempel_waktu();

alter table public.mentor               enable row level security;
alter table public.permintaan_mentoring enable row level security;

drop policy if exists mentor_baca           on public.mentor;
drop policy if exists mentor_kelola_sendiri on public.mentor;
drop policy if exists mentoring_para_pihak  on public.permintaan_mentoring;

create policy mentor_baca on public.mentor
  for select to authenticated
  using (profil_id = (select auth.uid()) or public.is_alumni_aktif());

create policy mentor_kelola_sendiri on public.mentor
  for all to authenticated
  using (profil_id = (select auth.uid()))
  with check (profil_id = (select auth.uid()) and public.is_alumni_aktif());

-- Isi percakapan mentoring hanya bisa dibaca kedua pihak — pengurus pun tidak.
-- Penulisan hanya lewat fungsi di bawah (tidak ada policy insert/update).
create policy mentoring_para_pihak on public.permintaan_mentoring
  for select to authenticated
  using ((select auth.uid()) in (mentee_id, mentor_id));

revoke all on public.mentor               from anon;
revoke all on public.permintaan_mentoring from anon;

-- ---------- daftar_mentor(): kartu mentor yang aktif -------------------------
drop function if exists public.daftar_mentor(text, text);
create or replace function public.daftar_mentor(q text default null, f_topik text default null)
returns table (
  id uuid, nama_tampil text, angkatan int, status_profesi public.status_profesi,
  spesialisasi text, tempat_kerja text, kota text, foto_path text,
  topik text[], cara_temu text[], pengantar text, kuota_bulanan int, terpakai int
)
language plpgsql stable security definer set search_path = '' as $$
declare
  awal_bulan timestamptz := date_trunc('month', now() at time zone 'Asia/Jakarta') at time zone 'Asia/Jakarta';
begin
  if not public.is_alumni_aktif() then
    raise exception 'Fitur mentoring khusus alumni terverifikasi.' using errcode = '42501';
  end if;

  return query
  select
    p.id,
    trim(both ' ' from coalesce(p.gelar_depan || ' ', '') || p.nama_lengkap ||
         coalesce(', ' || p.gelar_belakang, '')),
    p.angkatan, p.status_profesi, p.spesialisasi,
    case when p.tampilkan_tempat_kerja then p.tempat_kerja end,
    coalesce(case when p.tampilkan_tempat_kerja then p.kota_kerja end, p.kota),
    p.foto_path, m.topik, m.cara_temu, m.pengantar, m.kuota_bulanan,
    (select count(*)::int from public.permintaan_mentoring r
      where r.mentor_id = m.profil_id and r.dibuat_pada >= awal_bulan
        and r.status in ('menunggu','diterima','selesai'))
  from public.mentor m
  join public.profiles p on p.id = m.profil_id
  where m.aktif
    and p.status = 'terverifikasi'
    and p.visibilitas <> 'privat'
    and (q is null or q = '' or
         p.nama_lengkap ilike '%' || q || '%' or
         coalesce(p.spesialisasi, '') ilike '%' || q || '%' or
         coalesce(m.pengantar, '') ilike '%' || q || '%' or
         array_to_string(m.topik, ' ') ilike '%' || q || '%')
    and (f_topik is null or f_topik = '' or f_topik = any(m.topik))
  order by p.angkatan nulls last, p.nama_lengkap;
end $$;

-- ---------- ajukan_mentoring(): kirim permintaan ke mentor -------------------
create or replace function public.ajukan_mentoring(p_mentor uuid, p_jenis text, p_topik text, p_pesan text)
returns uuid language plpgsql volatile security definer set search_path = '' as $$
declare
  aku uuid := auth.uid();
  m public.mentor%rowtype;
  terpakai int;
  id_baru uuid;
  awal_bulan timestamptz := date_trunc('month', now() at time zone 'Asia/Jakarta') at time zone 'Asia/Jakarta';
begin
  if not public.is_alumni_aktif() then
    raise exception 'Fitur mentoring khusus alumni terverifikasi.' using errcode = '42501';
  end if;
  if p_mentor = aku then
    raise exception 'Kamu tidak bisa mengajukan mentoring ke dirimu sendiri.';
  end if;

  select * into m from public.mentor where profil_id = p_mentor and aktif;
  if not found then
    raise exception 'Mentor tidak ditemukan atau sedang tidak menerima permintaan.';
  end if;

  if length(trim(coalesce(p_pesan, ''))) < 30 then
    raise exception 'Ceritakan kebutuhanmu minimal 30 karakter supaya mentor bisa bersiap.';
  end if;
  if exists (select 1 from public.permintaan_mentoring r
             where r.mentee_id = aku and r.mentor_id = p_mentor and r.status in ('menunggu','diterima')) then
    raise exception 'Kamu masih punya permintaan yang aktif ke mentor ini.';
  end if;
  if (select count(*) from public.permintaan_mentoring r
      where r.mentee_id = aku and r.status = 'menunggu') >= 3 then
    raise exception 'Maksimal 3 permintaan menunggu sekaligus. Tunggu jawaban mentor atau batalkan salah satunya.';
  end if;

  select count(*) into terpakai from public.permintaan_mentoring r
  where r.mentor_id = p_mentor and r.dibuat_pada >= awal_bulan
    and r.status in ('menunggu','diterima','selesai');
  if terpakai >= m.kuota_bulanan then
    raise exception 'Kuota mentor ini bulan ini sudah penuh. Coba mentor lain atau bulan depan.';
  end if;

  insert into public.permintaan_mentoring (mentee_id, mentor_id, jenis, topik, pesan)
  values (aku, p_mentor,
          case when p_jenis = 'berkelanjutan' then 'berkelanjutan' else 'flash' end,
          left(coalesce(nullif(trim(p_topik), ''), 'Lainnya'), 120),
          left(trim(p_pesan), 2000))
  returning id into id_baru;
  return id_baru;
end $$;

-- ---------- jawab_mentoring(): terima / tolak / selesai / batalkan -----------
create or replace function public.jawab_mentoring(p_id uuid, p_status public.status_mentoring, p_balasan text default null)
returns void language plpgsql volatile security definer set search_path = '' as $$
declare
  aku uuid := auth.uid();
  r public.permintaan_mentoring%rowtype;
begin
  select * into r from public.permintaan_mentoring where id = p_id for update;
  if not found or aku is null or (aku <> r.mentor_id and aku <> r.mentee_id) then
    raise exception 'Permintaan tidak ditemukan.' using errcode = '42501';
  end if;

  if aku = r.mentor_id and (
       (r.status = 'menunggu' and p_status in ('diterima','ditolak')) or
       (r.status = 'diterima' and p_status = 'selesai')) then
    null;
  elsif aku = r.mentee_id and (
       (r.status in ('menunggu','diterima') and p_status = 'dibatalkan') or
       (r.status = 'diterima' and p_status = 'selesai')) then
    null;
  else
    raise exception 'Perubahan status ini tidak diizinkan.';
  end if;

  update public.permintaan_mentoring set
    status = p_status,
    balasan = case when aku = r.mentor_id and nullif(trim(coalesce(p_balasan, '')), '') is not null
                   then left(trim(p_balasan), 2000) else r.balasan end,
    diperbarui_pada = now()
  where id = p_id;
end $$;

-- ---------- permintaan_mentoring_saya(): kotak masuk & keluar ----------------
-- Kontak (email & WhatsApp) lawan bicara baru terbuka setelah mentor MENERIMA.
-- Mentor setuju saat menerima; mentee setuju saat mengirim (diberi tahu di formulir).
drop function if exists public.permintaan_mentoring_saya();
create or replace function public.permintaan_mentoring_saya()
returns table (
  id uuid, peran text, lawan_id uuid, lawan_nama text, lawan_angkatan int,
  lawan_spesialisasi text, lawan_foto text, jenis text, topik text, pesan text,
  status public.status_mentoring, balasan text, dibuat_pada timestamptz,
  diperbarui_pada timestamptz, kontak_email text, kontak_wa text
)
language sql stable security definer set search_path = '' as $$
  select
    r.id,
    case when r.mentor_id = auth.uid() then 'mentor' else 'mentee' end,
    p.id,
    trim(both ' ' from coalesce(p.gelar_depan || ' ', '') || p.nama_lengkap ||
         coalesce(', ' || p.gelar_belakang, '')),
    p.angkatan, p.spesialisasi, p.foto_path,
    r.jenis, r.topik, r.pesan, r.status, r.balasan, r.dibuat_pada, r.diperbarui_pada,
    case when r.status in ('diterima','selesai') then p.email_kontak end,
    case when r.status in ('diterima','selesai') then coalesce(p.whatsapp, p.no_hp) end
  from public.permintaan_mentoring r
  join public.profiles p
    on p.id = case when r.mentor_id = auth.uid() then r.mentee_id else r.mentor_id end
  where auth.uid() in (r.mentor_id, r.mentee_id)
  order by (r.status = 'menunggu') desc, r.diperbarui_pada desc;
$$;

-- ---------- statistik_mentoring(): angka agregat untuk pengurus -------------
create or replace function public.statistik_mentoring()
returns json language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_pengurus() then
    raise exception 'Akses ditolak.' using errcode = '42501';
  end if;
  return json_build_object(
    'mentor_aktif', (select count(*) from public.mentor where aktif),
    'permintaan',   (select count(*) from public.permintaan_mentoring),
    'diterima',     (select count(*) from public.permintaan_mentoring where status in ('diterima','selesai')),
    'selesai',      (select count(*) from public.permintaan_mentoring where status = 'selesai'),
    'menunggu',     (select count(*) from public.permintaan_mentoring where status = 'menunggu')
  );
end $$;


-- #############################################################################
--  B. WEBINAR BER-SKP + SERTIFIKAT
-- #############################################################################

alter table public.acara
  add column if not exists pendaftaran_web       boolean not null default false,
  add column if not exists terbuka_umum          boolean not null default false,
  add column if not exists biaya_nominal         bigint,
  add column if not exists nomor_skp             text,
  add column if not exists ambang_kuis           int default 70,       -- nilai minimal kuis (0–100)
  add column if not exists penandatangan         text,
  add column if not exists jabatan_penandatangan text;

-- Tautan Zoom & kode presensi TIDAK boleh ikut terbaca publik bersama tabel acara,
-- jadi disimpan di tabel terpisah yang hanya bisa dibaca pengurus.
create table if not exists public.acara_rahasia (
  acara_id        uuid primary key references public.acara(id) on delete cascade,
  tautan_ruang    text,          -- tautan Zoom / Google Meet
  catatan_peserta text,          -- Meeting ID, passcode, tata tertib, dll.
  kode_presensi   text           -- diumumkan panitia di tengah acara
);

create table if not exists public.soal_kuis (
  id          uuid primary key default gen_random_uuid(),
  acara_id    uuid not null references public.acara(id) on delete cascade,
  urutan      int not null default 0,
  pertanyaan  text not null,
  opsi        text[] not null check (cardinality(opsi) between 2 and 6),
  kunci       int not null check (kunci >= 0)      -- indeks opsi yang benar (mulai 0)
);
create index if not exists idx_soal_acara on public.soal_kuis(acara_id, urutan);

create table if not exists public.peserta_acara (
  id                  uuid primary key default gen_random_uuid(),
  acara_id            uuid not null references public.acara(id) on delete cascade,
  profil_id           uuid not null references public.profiles(id) on delete cascade,
  status              text not null default 'terdaftar'
                      check (status in ('menunggu_bayar','terdaftar','batal')),
  terdaftar_pada      timestamptz not null default now(),
  hadir_pada          timestamptz,
  percobaan_presensi  int not null default 0,
  skor_kuis           int,
  percobaan_kuis      int not null default 0,
  kuis_pada           timestamptz,
  nilai_materi        int check (nilai_materi between 1 and 5),
  nilai_narasumber    int check (nilai_narasumber between 1 and 5),
  nilai_teknis        int check (nilai_teknis between 1 and 5),
  saran               text,
  evaluasi_pada       timestamptz,
  nomor_sertifikat    text unique,
  kode_verifikasi     text unique,
  sertifikat_pada     timestamptz,
  unique (acara_id, profil_id)
);
create index if not exists idx_peserta_profil on public.peserta_acara(profil_id);

create sequence if not exists public.nomor_sertifikat_seq;

-- Catatan SKP dari kegiatan di luar AKU (portofolio pribadi, hanya pemiliknya yang bisa lihat)
create table if not exists public.skp_mandiri (
  id            uuid primary key default gen_random_uuid(),
  profil_id     uuid not null references public.profiles(id) on delete cascade,
  judul         text not null,
  penyelenggara text,
  tanggal       date not null,
  jumlah_skp    numeric(5,2) not null check (jumlah_skp > 0 and jumlah_skp <= 100),
  catatan       text,
  dibuat_pada   timestamptz not null default now()
);
create index if not exists idx_skp_mandiri on public.skp_mandiri(profil_id, tanggal desc);

alter table public.acara_rahasia enable row level security;
alter table public.soal_kuis     enable row level security;
alter table public.peserta_acara enable row level security;
alter table public.skp_mandiri   enable row level security;

drop policy if exists rahasia_pengurus  on public.acara_rahasia;
drop policy if exists soal_pengurus     on public.soal_kuis;
drop policy if exists peserta_baca      on public.peserta_acara;
drop policy if exists peserta_ubah      on public.peserta_acara;
drop policy if exists peserta_hapus     on public.peserta_acara;
drop policy if exists skp_mandiri_sendiri on public.skp_mandiri;

create policy rahasia_pengurus on public.acara_rahasia
  for all to authenticated using (public.is_pengurus()) with check (public.is_pengurus());

-- Kunci jawaban hanya bisa dibaca pengurus; peserta mengambil soal lewat fungsi.
create policy soal_pengurus on public.soal_kuis
  for all to authenticated using (public.is_pengurus()) with check (public.is_pengurus());

create policy peserta_baca on public.peserta_acara
  for select to authenticated using (profil_id = (select auth.uid()) or public.is_pengurus());
create policy peserta_ubah on public.peserta_acara
  for update to authenticated using (public.is_pengurus()) with check (public.is_pengurus());
create policy peserta_hapus on public.peserta_acara
  for delete to authenticated using (public.is_pengurus());

create policy skp_mandiri_sendiri on public.skp_mandiri
  for all to authenticated
  using (profil_id = (select auth.uid()))
  with check (profil_id = (select auth.uid()));

revoke all on public.acara_rahasia from anon;
revoke all on public.soal_kuis     from anon;
revoke all on public.peserta_acara from anon;
revoke all on public.skp_mandiri   from anon;

-- ---------- _coba_sertifikat(): terbitkan bila semua syarat terpenuhi -------
-- Syarat: terdaftar + hadir (kode presensi) + evaluasi terisi + lulus kuis (bila ada kuis).
create or replace function public._coba_sertifikat(p_peserta uuid)
returns void language plpgsql volatile security definer set search_path = '' as $$
declare
  ps public.peserta_acara%rowtype;
  ambang int;
begin
  select * into ps from public.peserta_acara where id = p_peserta for update;
  if not found or ps.nomor_sertifikat is not null or ps.status <> 'terdaftar'
     or ps.hadir_pada is null or ps.evaluasi_pada is null then
    return;
  end if;

  select coalesce(a.ambang_kuis, 70) into ambang from public.acara a where a.id = ps.acara_id;
  if exists (select 1 from public.soal_kuis s where s.acara_id = ps.acara_id)
     and coalesce(ps.skor_kuis, 0) < ambang then
    return;
  end if;

  update public.peserta_acara set
    nomor_sertifikat = lpad(nextval('public.nomor_sertifikat_seq')::text, 5, '0')
                       || '/AKU-SKP/' || to_char(now() at time zone 'Asia/Jakarta', 'YYYY'),
    kode_verifikasi  = upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12)),
    sertifikat_pada  = now()
  where id = p_peserta;
end $$;
revoke all on function public._coba_sertifikat(uuid) from public, anon, authenticated;

-- ---------- daftar_acara() / batal_acara() ----------------------------------
create or replace function public.daftar_acara(p_acara uuid)
returns text language plpgsql volatile security definer set search_path = '' as $$
declare
  aku uuid := auth.uid();
  a public.acara%rowtype;
  lama text;
  jml int;
  st text;
begin
  if aku is null then
    raise exception 'Silakan masuk terlebih dahulu.' using errcode = '42501';
  end if;

  select * into a from public.acara where id = p_acara and terbit and pendaftaran_web;
  if not found then
    raise exception 'Kegiatan ini tidak membuka pendaftaran lewat website.';
  end if;
  if not a.terbuka_umum and not public.is_alumni_aktif() then
    raise exception 'Kegiatan ini khusus alumni yang sudah diverifikasi.' using errcode = '42501';
  end if;
  if now() > coalesce(a.selesai, a.mulai + interval '3 hours') then
    raise exception 'Pendaftaran sudah ditutup karena kegiatan telah selesai.';
  end if;

  select ps.status into lama from public.peserta_acara ps where ps.acara_id = p_acara and ps.profil_id = aku;
  if lama in ('terdaftar','menunggu_bayar') then
    return lama;
  end if;

  if a.kuota is not null then
    select count(*) into jml from public.peserta_acara ps where ps.acara_id = p_acara and ps.status <> 'batal';
    if jml >= a.kuota then
      raise exception 'Maaf, kuota peserta sudah penuh.';
    end if;
  end if;

  st := case
          when coalesce(a.biaya_nominal, 0) <= 0 then 'terdaftar'
          -- sudah pernah membayar lalu batal → tidak perlu bayar lagi
          when exists (select 1 from public.pembayaran b
                       where b.acara_id = p_acara and b.profil_id = aku and b.status = 'diterima') then 'terdaftar'
          else 'menunggu_bayar'
        end;

  insert into public.peserta_acara (acara_id, profil_id, status)
  values (p_acara, aku, st)
  on conflict (acara_id, profil_id) do update set status = excluded.status, terdaftar_pada = now();
  return st;
end $$;

create or replace function public.batal_acara(p_acara uuid)
returns void language plpgsql volatile security definer set search_path = '' as $$
begin
  update public.peserta_acara set status = 'batal'
  where acara_id = p_acara and profil_id = auth.uid() and hadir_pada is null;
end $$;

-- ---------- tautan_ruang_acara(): tautan Zoom khusus peserta terdaftar ------
create or replace function public.tautan_ruang_acara(p_acara uuid)
returns json language plpgsql stable security definer set search_path = '' as $$
begin
  if not exists (select 1 from public.peserta_acara ps
                 where ps.acara_id = p_acara and ps.profil_id = auth.uid() and ps.status = 'terdaftar') then
    return null;
  end if;
  return json_build_object(
    'tautan',         (select r.tautan_ruang    from public.acara_rahasia r where r.acara_id = p_acara),
    'catatan',        (select r.catatan_peserta from public.acara_rahasia r where r.acara_id = p_acara),
    'presensi_aktif', coalesce((select coalesce(r.kode_presensi, '') <> ''
                                from public.acara_rahasia r where r.acara_id = p_acara), false),
    'jumlah_soal',    (select count(*) from public.soal_kuis s where s.acara_id = p_acara));
end $$;

-- ---------- isi_presensi(): 'hadir' | 'salah' --------------------------------
create or replace function public.isi_presensi(p_acara uuid, p_kode text)
returns text language plpgsql volatile security definer set search_path = '' as $$
declare
  ps public.peserta_acara%rowtype;
  a public.acara%rowtype;
  kode_benar text;
begin
  select * into ps from public.peserta_acara
  where acara_id = p_acara and profil_id = auth.uid() for update;
  if not found or ps.status <> 'terdaftar' then
    raise exception 'Kamu belum terdaftar sebagai peserta kegiatan ini.';
  end if;
  if ps.hadir_pada is not null then
    return 'hadir';
  end if;

  select * into a from public.acara where id = p_acara;
  if now() < a.mulai - interval '30 minutes' then
    raise exception 'Presensi baru dibuka 30 menit sebelum kegiatan dimulai.';
  end if;
  if now() > coalesce(a.selesai, a.mulai + interval '3 hours') + interval '3 hours' then
    raise exception 'Waktu presensi sudah ditutup.';
  end if;
  if ps.percobaan_presensi >= 10 then
    raise exception 'Terlalu banyak percobaan kode yang salah. Hubungi panitia.';
  end if;

  select r.kode_presensi into kode_benar from public.acara_rahasia r where r.acara_id = p_acara;
  if coalesce(trim(kode_benar), '') = '' then
    raise exception 'Panitia belum mengaktifkan kode presensi.';
  end if;

  if upper(trim(coalesce(p_kode, ''))) <> upper(trim(kode_benar)) then
    update public.peserta_acara set percobaan_presensi = percobaan_presensi + 1 where id = ps.id;
    return 'salah';
  end if;

  update public.peserta_acara set hadir_pada = now() where id = ps.id;
  perform public._coba_sertifikat(ps.id);
  return 'hadir';
end $$;

-- ---------- soal_kuis_peserta(): soal TANPA kunci jawaban -------------------
drop function if exists public.soal_kuis_peserta(uuid);
create or replace function public.soal_kuis_peserta(p_acara uuid)
returns table (id uuid, pertanyaan text, opsi text[])
language plpgsql stable security definer set search_path = '' as $$
begin
  if not exists (select 1 from public.peserta_acara ps
                 where ps.acara_id = p_acara and ps.profil_id = auth.uid()
                   and ps.status = 'terdaftar' and ps.hadir_pada is not null) then
    raise exception 'Kuis terbuka setelah kamu mengisi presensi.' using errcode = '42501';
  end if;
  return query
  select s.id, s.pertanyaan, s.opsi from public.soal_kuis s
  where s.acara_id = p_acara order by s.urutan, s.id;
end $$;

-- ---------- kirim_kuis(): jawaban berbentuk {"<id soal>": <indeks opsi>} ----
create or replace function public.kirim_kuis(p_acara uuid, p_jawaban jsonb)
returns int language plpgsql volatile security definer set search_path = '' as $$
declare
  ps public.peserta_acara%rowtype;
  s record;
  total int := 0;
  benar int := 0;
  skor int;
begin
  select * into ps from public.peserta_acara
  where acara_id = p_acara and profil_id = auth.uid() for update;
  if not found or ps.status <> 'terdaftar' or ps.hadir_pada is null then
    raise exception 'Kuis terbuka setelah kamu mengisi presensi.';
  end if;
  if ps.percobaan_kuis >= 3 then
    raise exception 'Kesempatan mengerjakan kuis sudah habis (maksimal 3 kali).';
  end if;

  for s in select id, kunci from public.soal_kuis where acara_id = p_acara loop
    total := total + 1;
    if (p_jawaban ->> s.id::text) ~ '^\d+$' and (p_jawaban ->> s.id::text)::int = s.kunci then
      benar := benar + 1;
    end if;
  end loop;
  if total = 0 then
    raise exception 'Kegiatan ini tidak memiliki kuis.';
  end if;

  skor := round(100.0 * benar / total);
  update public.peserta_acara set
    skor_kuis = greatest(coalesce(skor_kuis, 0), skor),
    percobaan_kuis = percobaan_kuis + 1,
    kuis_pada = now()
  where id = ps.id;
  perform public._coba_sertifikat(ps.id);
  return skor;
end $$;

-- ---------- kirim_evaluasi() --------------------------------------------------
create or replace function public.kirim_evaluasi(p_acara uuid, p_materi int, p_narasumber int, p_teknis int, p_saran text)
returns void language plpgsql volatile security definer set search_path = '' as $$
declare
  ps public.peserta_acara%rowtype;
begin
  select * into ps from public.peserta_acara
  where acara_id = p_acara and profil_id = auth.uid() for update;
  if not found or ps.status <> 'terdaftar' or ps.hadir_pada is null then
    raise exception 'Evaluasi terbuka setelah kamu mengisi presensi.';
  end if;
  if p_materi not between 1 and 5 or p_narasumber not between 1 and 5 or p_teknis not between 1 and 5 then
    raise exception 'Semua penilaian wajib diisi (1–5).';
  end if;

  update public.peserta_acara set
    nilai_materi = p_materi, nilai_narasumber = p_narasumber, nilai_teknis = p_teknis,
    saran = left(nullif(trim(coalesce(p_saran, '')), ''), 2000),
    evaluasi_pada = now()
  where id = ps.id;
  perform public._coba_sertifikat(ps.id);
end $$;

-- ---------- tandai_hadir_manual(): pengurus menandai hadir (kendala teknis) -
create or replace function public.tandai_hadir_manual(p_peserta uuid)
returns void language plpgsql volatile security definer set search_path = '' as $$
begin
  if not public.is_pengurus() then
    raise exception 'Akses ditolak.' using errcode = '42501';
  end if;
  update public.peserta_acara set hadir_pada = coalesce(hadir_pada, now())
  where id = p_peserta and status = 'terdaftar';
  perform public._coba_sertifikat(p_peserta);
  insert into public.jejak_audit (aktor_id, aksi, target_id) values (auth.uid(), 'tandai_hadir_manual', p_peserta);
end $$;

-- ---------- verifikasi_sertifikat(): cek keaslian, boleh diakses publik ------
drop function if exists public.verifikasi_sertifikat(text);
create or replace function public.verifikasi_sertifikat(p_kode text)
returns table (nomor_sertifikat text, nama text, judul_acara text, mulai timestamptz,
               skp numeric, nomor_skp text, diterbitkan timestamptz)
language sql stable security definer set search_path = '' as $$
  select ps.nomor_sertifikat,
         trim(both ' ' from coalesce(p.gelar_depan || ' ', '') || p.nama_lengkap ||
              coalesce(', ' || p.gelar_belakang, '')),
         a.judul, a.mulai, a.skp_idi, a.nomor_skp, ps.sertifikat_pada
  from public.peserta_acara ps
  join public.profiles p on p.id = ps.profil_id
  join public.acara a on a.id = ps.acara_id
  where ps.kode_verifikasi = upper(trim(p_kode)) and ps.nomor_sertifikat is not null;
$$;


-- #############################################################################
--  C. IURAN, DONASI & LAPORAN KEUANGAN
-- #############################################################################

alter table public.donasi
  add column if not exists jenis         text not null default 'donasi',
  add column if not exists nominal_iuran bigint;
do $$ begin
  alter table public.donasi add constraint donasi_jenis_cek check (jenis in ('donasi','iuran'));
exception when duplicate_object then null; end $$;

-- Program contoh "Iuran Anggota Tahunan" dari data awal ditandai sebagai iuran
update public.donasi set jenis = 'iuran', nominal_iuran = coalesce(nominal_iuran, 150000)
where judul = 'Iuran Anggota Tahunan' and jenis = 'donasi' and target is null;

create table if not exists public.pembayaran (
  id                 uuid primary key default gen_random_uuid(),
  -- set null (bukan cascade): catatan keuangan tetap ada walau akun dihapus
  profil_id          uuid references public.profiles(id) on delete set null,
  nama_pembayar      text not null,
  jenis              text not null check (jenis in ('iuran','donasi','acara')),
  donasi_id          uuid references public.donasi(id) on delete set null,
  acara_id           uuid references public.acara(id)  on delete set null,
  tahun_iuran        int,
  nominal            bigint not null check (nominal > 0),
  tanggal_transfer   date not null,
  bank_pengirim      text,
  atas_nama_pengirim text,
  bukti_path         text,                 -- di bucket tertutup "bukti"
  catatan            text,
  tampilkan_nama     boolean not null default false,
  status             text not null default 'menunggu' check (status in ('menunggu','diterima','ditolak')),
  catatan_pengurus   text,
  diperiksa_oleh     uuid references auth.users(id) on delete set null,
  diperiksa_pada     timestamptz,
  dibuat_pada        timestamptz not null default now()
);
create index if not exists idx_pembayaran_status on public.pembayaran(status, dibuat_pada desc);
create index if not exists idx_pembayaran_profil on public.pembayaran(profil_id);

-- Buku kas umum: pemasukan otomatis dari pembayaran yang diterima,
-- pengeluaran dicatat bendahara lewat Panel Admin.
create table if not exists public.kas (
  id             uuid primary key default gen_random_uuid(),
  tanggal        date not null default current_date,
  arah           text not null check (arah in ('masuk','keluar')),
  kategori       text not null default 'Lainnya',
  uraian         text not null,
  nominal        bigint not null check (nominal > 0),
  pembayaran_id  uuid unique references public.pembayaran(id) on delete cascade,
  dibuat_pada    timestamptz not null default now()
);
create index if not exists idx_kas_tanggal on public.kas(tanggal desc);

alter table public.pembayaran enable row level security;
alter table public.kas        enable row level security;

drop policy if exists pembayaran_baca on public.pembayaran;
drop policy if exists kas_baca        on public.kas;
drop policy if exists kas_tambah      on public.kas;
drop policy if exists kas_ubah        on public.kas;
drop policy if exists kas_hapus       on public.kas;

create policy pembayaran_baca on public.pembayaran
  for select to authenticated using (profil_id = (select auth.uid()) or public.is_pengurus());

-- Laporan kas terbuka untuk seluruh alumni terverifikasi (transparansi)
create policy kas_baca on public.kas
  for select to authenticated using (public.is_alumni_aktif() or public.is_pengurus());
-- Baris otomatis dari pembayaran (pembayaran_id terisi) tidak bisa diubah manual
create policy kas_tambah on public.kas
  for insert to authenticated with check (public.is_pengurus() and pembayaran_id is null);
create policy kas_ubah on public.kas
  for update to authenticated
  using (public.is_pengurus() and pembayaran_id is null)
  with check (public.is_pengurus() and pembayaran_id is null);
create policy kas_hapus on public.kas
  for delete to authenticated using (public.is_pengurus() and pembayaran_id is null);

revoke all on public.pembayaran from anon;
revoke all on public.kas        from anon;

-- Bucket tertutup untuk bukti transfer: bukti/<id-pengguna>/<berkas>
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('bukti', 'bukti', false, 5242880, array['image/jpeg','image/png','image/webp','application/pdf'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists bukti_unggah_sendiri on storage.objects;
drop policy if exists bukti_baca           on storage.objects;
drop policy if exists bukti_hapus          on storage.objects;

create policy bukti_unggah_sendiri on storage.objects
  for insert to authenticated
  with check (bucket_id = 'bukti' and (storage.foldername(name))[1] = auth.uid()::text);
create policy bukti_baca on storage.objects
  for select to authenticated
  using (bucket_id = 'bukti' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_pengurus()));
create policy bukti_hapus on storage.objects
  for delete to authenticated
  using (bucket_id = 'bukti' and public.is_pengurus());

-- ---------- kirim_pembayaran(): alumni mengonfirmasi transfer ----------------
create or replace function public.kirim_pembayaran(
  p_jenis text, p_donasi uuid, p_acara uuid, p_tahun int, p_nominal bigint,
  p_tanggal date, p_bank text, p_atas_nama text, p_bukti text, p_catatan text,
  p_tampilkan_nama boolean
) returns uuid language plpgsql volatile security definer set search_path = '' as $$
declare
  aku uuid := auth.uid();
  nama text;
  id_baru uuid;
begin
  if aku is null then
    raise exception 'Silakan masuk terlebih dahulu.' using errcode = '42501';
  end if;
  if p_jenis not in ('iuran','donasi','acara') then
    raise exception 'Jenis pembayaran tidak dikenal.';
  end if;
  if p_nominal is null or p_nominal < 1000 or p_nominal > 10000000000 then
    raise exception 'Nominal transfer tidak masuk akal.';
  end if;
  if p_tanggal is null or p_tanggal > (now() at time zone 'Asia/Jakarta')::date
     or p_tanggal < (now() at time zone 'Asia/Jakarta')::date - 365 then
    raise exception 'Tanggal transfer tidak valid.';
  end if;
  if coalesce(p_bukti, '') = '' or split_part(p_bukti, '/', 1) <> aku::text then
    raise exception 'Bukti transfer wajib diunggah.';
  end if;
  if (select count(*) from public.pembayaran b where b.profil_id = aku and b.status = 'menunggu') >= 5 then
    raise exception 'Kamu masih punya 5 konfirmasi yang menunggu diperiksa bendahara.';
  end if;

  if p_jenis in ('iuran','donasi') and not exists (
       select 1 from public.donasi d where d.id = p_donasi and d.aktif
         and d.jenis = case when p_jenis = 'iuran' then 'iuran' else 'donasi' end) then
    raise exception 'Program tidak ditemukan atau sudah ditutup.';
  end if;
  if p_jenis = 'iuran' and (p_tahun is null or p_tahun < 2000
       or p_tahun > extract(year from now())::int + 1) then
    raise exception 'Tahun iuran tidak valid.';
  end if;
  if p_jenis = 'acara' and not exists (
       select 1 from public.peserta_acara ps where ps.acara_id = p_acara and ps.profil_id = aku
         and ps.status in ('menunggu_bayar','terdaftar')) then
    raise exception 'Daftar dulu sebagai peserta kegiatan sebelum mengonfirmasi pembayaran.';
  end if;

  select trim(both ' ' from coalesce(p.gelar_depan || ' ', '') || p.nama_lengkap ||
              coalesce(', ' || p.gelar_belakang, ''))
    into nama from public.profiles p where p.id = aku;

  insert into public.pembayaran (profil_id, nama_pembayar, jenis, donasi_id, acara_id, tahun_iuran,
    nominal, tanggal_transfer, bank_pengirim, atas_nama_pengirim, bukti_path, catatan, tampilkan_nama)
  values (aku, coalesce(nullif(nama, ''), '(tanpa nama)'), p_jenis,
    case when p_jenis <> 'acara' then p_donasi end,
    case when p_jenis = 'acara' then p_acara end,
    case when p_jenis = 'iuran' then p_tahun end,
    p_nominal, p_tanggal, left(p_bank, 80), left(p_atas_nama, 120), p_bukti, left(p_catatan, 500),
    coalesce(p_tampilkan_nama, false))
  returning id into id_baru;
  return id_baru;
end $$;

-- ---------- periksa_pembayaran(): bendahara menerima / menolak --------------
create or replace function public.periksa_pembayaran(p_id uuid, p_status text, p_catatan text default null)
returns void language plpgsql volatile security definer set search_path = '' as $$
declare
  b public.pembayaran%rowtype;
  judul text;
begin
  if not public.is_pengurus() then
    raise exception 'Hanya pengurus yang boleh memeriksa pembayaran.' using errcode = '42501';
  end if;
  if p_status not in ('menunggu','diterima','ditolak') then
    raise exception 'Status tidak dikenal.';
  end if;

  select * into b from public.pembayaran where id = p_id for update;
  if not found then
    raise exception 'Data pembayaran tidak ditemukan.';
  end if;
  if b.status = p_status then
    update public.pembayaran set catatan_pengurus = nullif(trim(coalesce(p_catatan, '')), '') where id = p_id;
    return;
  end if;

  -- 1) Batalkan efek penerimaan lama (koreksi)
  if b.status = 'diterima' then
    delete from public.kas where pembayaran_id = b.id;
    if b.donasi_id is not null then
      update public.donasi set terkumpul = greatest(0, coalesce(terkumpul, 0) - b.nominal) where id = b.donasi_id;
    end if;
    if b.acara_id is not null and b.profil_id is not null then
      update public.peserta_acara set status = 'menunggu_bayar'
      where acara_id = b.acara_id and profil_id = b.profil_id and status = 'terdaftar';
    end if;
  end if;

  -- 2) Terapkan efek penerimaan baru
  if p_status = 'diterima' then
    if b.jenis = 'acara' then
      select a.judul into judul from public.acara a where a.id = b.acara_id;
    else
      select d.judul into judul from public.donasi d where d.id = b.donasi_id;
    end if;

    insert into public.kas (tanggal, arah, kategori, uraian, nominal, pembayaran_id)
    values (b.tanggal_transfer, 'masuk',
      case b.jenis when 'iuran' then 'Iuran anggota' when 'donasi' then 'Donasi' else 'Registrasi kegiatan' end,
      case b.jenis
        when 'iuran' then 'Iuran anggota tahun ' || coalesce(b.tahun_iuran::text, '')
        when 'donasi' then 'Donasi — ' || coalesce(judul, 'program')
        else 'Registrasi — ' || coalesce(judul, 'kegiatan') end,
      b.nominal, b.id);

    if b.donasi_id is not null then
      update public.donasi set terkumpul = coalesce(terkumpul, 0) + b.nominal where id = b.donasi_id;
    end if;
    if b.acara_id is not null and b.profil_id is not null then
      update public.peserta_acara set status = 'terdaftar'
      where acara_id = b.acara_id and profil_id = b.profil_id and status = 'menunggu_bayar';
    end if;
  end if;

  update public.pembayaran set
    status = p_status,
    catatan_pengurus = nullif(trim(coalesce(p_catatan, '')), ''),
    diperiksa_oleh = case when p_status = 'menunggu' then null else auth.uid() end,
    diperiksa_pada = case when p_status = 'menunggu' then null else now() end
  where id = p_id;

  insert into public.jejak_audit (aktor_id, aksi, target_id, rincian)
  values (auth.uid(), 'periksa_pembayaran', p_id,
          jsonb_build_object('status', p_status, 'nominal', b.nominal, 'jenis', b.jenis));
end $$;

-- ---------- laporan_kas(): ringkasan untuk halaman Laporan Keuangan --------
create or replace function public.laporan_kas(p_tahun int)
returns json language plpgsql stable security definer set search_path = '' as $$
declare
  awal date := make_date(p_tahun, 1, 1);
  akhir date := make_date(p_tahun + 1, 1, 1);
begin
  if not (public.is_alumni_aktif() or public.is_pengurus()) then
    raise exception 'Laporan keuangan khusus alumni terverifikasi.' using errcode = '42501';
  end if;

  return json_build_object(
    'saldo_awal', (select coalesce(sum(case when arah = 'masuk' then nominal else -nominal end), 0)
                   from public.kas where tanggal < awal),
    'masuk',      (select coalesce(sum(nominal), 0) from public.kas
                   where arah = 'masuk' and tanggal >= awal and tanggal < akhir),
    'keluar',     (select coalesce(sum(nominal), 0) from public.kas
                   where arah = 'keluar' and tanggal >= awal and tanggal < akhir),
    'per_bulan', (
      select coalesce(json_agg(x order by x.bulan), '[]'::json) from (
        select extract(month from tanggal)::int as bulan,
               sum(nominal) filter (where arah = 'masuk')  as masuk,
               sum(nominal) filter (where arah = 'keluar') as keluar
        from public.kas where tanggal >= awal and tanggal < akhir
        group by 1) x),
    'per_kategori', (
      select coalesce(json_agg(x order by x.arah, x.jumlah desc), '[]'::json) from (
        select arah, kategori, sum(nominal) as jumlah
        from public.kas where tanggal >= awal and tanggal < akhir
        group by 1, 2) x),
    'tahun_tersedia', (
      select coalesce(json_agg(t order by t desc), '[]'::json) from (
        select distinct extract(year from tanggal)::int as t from public.kas) y)
  );
end $$;

-- ---------- donatur_program(): nama donatur yang MENGIZINKAN namanya tampil -
drop function if exists public.donatur_program(uuid);
create or replace function public.donatur_program(p_donasi uuid)
returns table (nama text, angkatan int, tanggal date)
language sql stable security definer set search_path = '' as $$
  select b.nama_pembayar, p.angkatan, b.tanggal_transfer
  from public.pembayaran b
  left join public.profiles p on p.id = b.profil_id
  where b.donasi_id = p_donasi and b.status = 'diterima' and b.tampilkan_nama
  order by b.diperiksa_pada desc nulls last
  limit 40;
$$;


-- #############################################################################
--  D. PERPUSTAKAAN DIGITAL & ARSIP LULUSAN
-- #############################################################################

create table if not exists public.pustaka (
  id          uuid primary key default gen_random_uuid(),
  judul       text not null,
  kategori    text default 'Jurnal & Database',
  url         text not null,
  penyedia    text,
  deskripsi   text,
  akses       text default 'Gratis',
  urutan      int default 0,
  terbit      boolean not null default true,
  dibuat_pada timestamptz not null default now()
);

create table if not exists public.arsip_lulusan (
  id          uuid primary key default gen_random_uuid(),
  nama        text not null,
  nim         text unique,
  angkatan    int,
  tahun_lulus int,
  keterangan  text,             -- mis. "Sumpah dokter periode II"
  dibuat_pada timestamptz not null default now()
);
create index if not exists idx_arsip_lulus on public.arsip_lulusan(tahun_lulus, nama);

alter table public.pustaka       enable row level security;
alter table public.arsip_lulusan enable row level security;

drop policy if exists pustaka_baca    on public.pustaka;
drop policy if exists pustaka_kelola  on public.pustaka;
drop policy if exists arsip_pengurus  on public.arsip_lulusan;

create policy pustaka_baca on public.pustaka
  for select to authenticated using ((terbit and public.is_alumni_aktif()) or public.is_pengurus());
create policy pustaka_kelola on public.pustaka
  for all to authenticated using (public.is_pengurus()) with check (public.is_pengurus());

-- Arsip berisi NIM → hanya pengurus yang membaca tabelnya langsung.
-- Alumni melihatnya lewat fungsi di bawah (tanpa NIM).
create policy arsip_pengurus on public.arsip_lulusan
  for all to authenticated using (public.is_pengurus()) with check (public.is_pengurus());

revoke all on public.pustaka       from anon;
revoke all on public.arsip_lulusan from anon;

drop function if exists public.lihat_arsip(int, text);
create or replace function public.lihat_arsip(p_tahun_lulus int default null, q text default null)
returns table (nama text, angkatan int, tahun_lulus int, keterangan text, bergabung boolean)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_alumni_aktif() then
    raise exception 'Arsip lulusan khusus alumni terverifikasi.' using errcode = '42501';
  end if;
  return query
  select a.nama, a.angkatan, a.tahun_lulus, a.keterangan,
         exists (select 1 from public.profiles p
                 where a.nim is not null and p.nim = a.nim and p.status = 'terverifikasi')
  from public.arsip_lulusan a
  where (p_tahun_lulus is null or a.tahun_lulus = p_tahun_lulus)
    and (q is null or q = '' or a.nama ilike '%' || q || '%')
  order by a.tahun_lulus nulls last, a.nama
  limit 500;
end $$;

create or replace function public.ringkasan_arsip()
returns json language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_alumni_aktif() then
    raise exception 'Arsip lulusan khusus alumni terverifikasi.' using errcode = '42501';
  end if;
  return (
    select coalesce(json_agg(x order by x.tahun_lulus desc), '[]'::json) from (
      select a.tahun_lulus,
             count(*) as jumlah,
             count(*) filter (where exists (
               select 1 from public.profiles p
               where a.nim is not null and p.nim = a.nim and p.status = 'terverifikasi')) as bergabung
      from public.arsip_lulusan a
      where a.tahun_lulus is not null
      group by a.tahun_lulus) x
  );
end $$;


-- #############################################################################
--  HAK AKSES FUNGSI
-- #############################################################################
revoke all on function
  public.daftar_mentor(text, text), public.ajukan_mentoring(uuid, text, text, text),
  public.jawab_mentoring(uuid, public.status_mentoring, text), public.permintaan_mentoring_saya(),
  public.statistik_mentoring(), public.daftar_acara(uuid), public.batal_acara(uuid),
  public.tautan_ruang_acara(uuid), public.isi_presensi(uuid, text), public.soal_kuis_peserta(uuid),
  public.kirim_kuis(uuid, jsonb), public.kirim_evaluasi(uuid, int, int, int, text),
  public.tandai_hadir_manual(uuid),
  public.kirim_pembayaran(text, uuid, uuid, int, bigint, date, text, text, text, text, boolean),
  public.periksa_pembayaran(uuid, text, text), public.laporan_kas(int),
  public.lihat_arsip(int, text), public.ringkasan_arsip()
from public, anon;

grant execute on function
  public.daftar_mentor(text, text), public.ajukan_mentoring(uuid, text, text, text),
  public.jawab_mentoring(uuid, public.status_mentoring, text), public.permintaan_mentoring_saya(),
  public.statistik_mentoring(), public.daftar_acara(uuid), public.batal_acara(uuid),
  public.tautan_ruang_acara(uuid), public.isi_presensi(uuid, text), public.soal_kuis_peserta(uuid),
  public.kirim_kuis(uuid, jsonb), public.kirim_evaluasi(uuid, int, int, int, text),
  public.tandai_hadir_manual(uuid),
  public.kirim_pembayaran(text, uuid, uuid, int, bigint, date, text, text, text, text, boolean),
  public.periksa_pembayaran(uuid, text, text), public.laporan_kas(int),
  public.lihat_arsip(int, text), public.ringkasan_arsip()
to authenticated;

-- Dua fungsi ini aman untuk publik: hanya data yang memang boleh diumumkan
grant execute on function public.verifikasi_sertifikat(text) to anon, authenticated;
grant execute on function public.donatur_program(uuid)       to anon, authenticated;


-- #############################################################################
--  DATA AWAL — perpustakaan digital (sumber gratis & tepercaya)
-- #############################################################################
insert into public.pustaka (judul, kategori, url, penyedia, deskripsi, akses, urutan)
select * from (values
  ('PubMed', 'Jurnal & Database', 'https://pubmed.ncbi.nlm.nih.gov/', 'U.S. National Library of Medicine',
   'Mesin pencari lebih dari 35 juta sitasi literatur biomedis. Gunakan filter "Free full text" untuk artikel gratis.', 'Gratis', 1),
  ('PubMed Central (PMC)', 'Jurnal & Database', 'https://pmc.ncbi.nlm.nih.gov/', 'U.S. National Library of Medicine',
   'Arsip artikel teks lengkap yang bisa dibaca dan diunduh gratis.', 'Gratis', 2),
  ('Cochrane Library', 'Jurnal & Database', 'https://www.cochranelibrary.com/', 'Cochrane',
   'Tinjauan sistematis — rujukan utama kedokteran berbasis bukti. Abstrak dan ringkasan awam gratis.', 'Sebagian gratis', 3),
  ('DOAJ', 'Jurnal & Database', 'https://doaj.org/', 'Directory of Open Access Journals',
   'Direktori jurnal akses terbuka yang sudah melalui telaah sejawat.', 'Gratis', 4),
  ('Garuda', 'Jurnal & Database', 'https://garuda.kemdikbud.go.id/', 'Kemendiktisaintek',
   'Portal jurnal ilmiah Indonesia, termasuk jurnal kedokteran dalam negeri.', 'Gratis', 5),
  ('WHO IRIS', 'Pedoman Klinis', 'https://iris.who.int/', 'World Health Organization',
   'Repositori resmi pedoman dan publikasi WHO.', 'Gratis', 10),
  ('NICE Guidance', 'Pedoman Klinis', 'https://www.nice.org.uk/guidance', 'NICE (Inggris)',
   'Pedoman klinis berbasis bukti yang ringkas dan rutin diperbarui.', 'Gratis', 11),
  ('Plataran Sehat', 'Pendidikan Berkelanjutan & SKP', 'https://lms.kemkes.go.id/', 'Kementerian Kesehatan RI',
   'Pelatihan daring resmi Kemenkes dan pencatatan SKP tenaga medis.', 'Perlu daftar (gratis)', 20),
  ('MDCalc', 'Alat Bantu Klinis', 'https://www.mdcalc.com/', 'MDCalc',
   'Ratusan kalkulator dan skor klinis (CURB-65, Wells, CHA₂DS₂-VASc, dll.) lengkap dengan rujukannya.', 'Gratis', 30)
) as v(judul, kategori, url, penyedia, deskripsi, akses, urutan)
where not exists (select 1 from public.pustaka);
