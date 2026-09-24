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
