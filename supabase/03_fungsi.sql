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
