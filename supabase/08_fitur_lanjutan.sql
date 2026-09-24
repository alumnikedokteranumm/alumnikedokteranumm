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
