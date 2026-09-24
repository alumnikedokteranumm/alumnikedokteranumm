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
