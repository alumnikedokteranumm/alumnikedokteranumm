"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { simpanProfil } from "@/actions/profil";
import { AreaTeks, Bidang, Isian, Kartu, Pesan, Pilihan, Sakelar, Tombol } from "@/components/ui/dasar";
import { LABEL_VISIBILITAS, OPSI_PROFESI, PROVINSI } from "@/lib/konstanta";
import { PilihSpesialisasi } from "@/components/pilih-spesialisasi";
import type { Profil } from "@/lib/tipe";

function TombolSimpan() {
  const { pending } = useFormStatus();
  return <Tombol type="submit" disabled={pending} className="px-6">{pending ? "Menyimpan…" : "Simpan Profil"}</Tombol>;
}

function Bagian({ judul, keterangan, children }: { judul: string; keterangan?: string; children: React.ReactNode }) {
  return (
    <Kartu className="p-6">
      <h2 className="text-base font-semibold text-slate-900">{judul}</h2>
      {keterangan && <p className="mt-1 text-sm leading-relaxed text-slate-500">{keterangan}</p>}
      <div className="mt-5 grid gap-4 sm:grid-cols-2">{children}</div>
    </Kartu>
  );
}

const Penuh = ({ children }: { children: React.ReactNode }) => <div className="sm:col-span-2">{children}</div>;

export function FormProfil({ profil: p }: { profil: Profil }) {
  const [hasil, aksi] = useActionState(simpanProfil, null);
  const tahunIni = new Date().getFullYear();
  const puncak = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (hasil) puncak.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [hasil]);

  return (
    <form action={aksi} className="space-y-6">
      <div ref={puncak}>
        {hasil?.galat && <Pesan jenis="galat">{hasil.galat}</Pesan>}
        {hasil?.sukses && <Pesan jenis="sukses">{hasil.sukses}</Pesan>}
      </div>

      <Bagian judul="Identitas & akademik" keterangan="Data ini dipakai pengurus untuk mencocokkan keanggotaanmu dengan arsip fakultas.">
        <Bidang label="Gelar depan" petunjuk="Contoh: dr. atau Prof. dr.">
          <Isian name="gelar_depan" defaultValue={p.gelar_depan ?? "dr."} />
        </Bidang>
        <Bidang label="Gelar belakang" petunjuk="Contoh: Sp.PD, M.Kes">
          <Isian name="gelar_belakang" defaultValue={p.gelar_belakang ?? ""} />
        </Bidang>
        <Penuh>
          <Bidang label="Nama lengkap (tanpa gelar)" wajib>
            <Isian name="nama_lengkap" defaultValue={p.nama_lengkap} required minLength={3} />
          </Bidang>
        </Penuh>
        <Bidang label="NIM" petunjuk="Nomor induk mahasiswa saat kuliah di FK UMM." wajib>
          <Isian name="nim" defaultValue={p.nim ?? ""} inputMode="numeric" />
        </Bidang>
        <Bidang label="Jenis kelamin">
          <Pilihan name="jenis_kelamin" defaultValue={p.jenis_kelamin ?? ""}>
            <option value="">— Pilih —</option>
            <option value="L">Laki-laki</option>
            <option value="P">Perempuan</option>
          </Pilihan>
        </Bidang>
        <Bidang label="Angkatan (tahun masuk)" wajib>
          <Isian name="angkatan" type="number" min={1990} max={tahunIni} defaultValue={p.angkatan ?? ""} />
        </Bidang>
        <Bidang label="Tahun lulus profesi dokter" wajib>
          <Isian name="tahun_lulus" type="number" min={1990} max={tahunIni + 1} defaultValue={p.tahun_lulus ?? ""} />
        </Bidang>
        <Bidang label="Tempat lahir">
          <Isian name="tempat_lahir" defaultValue={p.tempat_lahir ?? ""} />
        </Bidang>
        <Bidang label="Tanggal lahir" petunjuk="Tidak pernah ditampilkan di direktori.">
          <Isian name="tanggal_lahir" type="date" defaultValue={p.tanggal_lahir ?? ""} />
        </Bidang>
      </Bagian>

      <Bagian judul="Profesi & tempat kerja">
        <Bidang label="Status profesi saat ini" wajib>
          <Pilihan name="status_profesi" defaultValue={p.status_profesi ?? "dokter_umum"}>
            {OPSI_PROFESI.map((o) => <option key={o.nilai} value={o.nilai}>{o.label}</option>)}
          </Pilihan>
        </Bidang>
        <Bidang grup label="Spesialisasi" petunjuk="Isi juga bila sedang PPDS (pilih bidang yang sedang ditempuh).">
          <PilihSpesialisasi nama="spesialisasi" awal={p.spesialisasi} />
        </Bidang>
        <Bidang label="Subspesialisasi / konsultan">
          <Isian name="subspesialisasi" defaultValue={p.subspesialisasi ?? ""} placeholder="Contoh: Gastroenterohepatologi" />
        </Bidang>
        <Bidang label="Jabatan">
          <Isian name="jabatan" defaultValue={p.jabatan ?? ""} placeholder="Contoh: Kepala IGD" />
        </Bidang>
        <Penuh>
          <Bidang label="Tempat kerja utama">
            <Isian name="tempat_kerja" defaultValue={p.tempat_kerja ?? ""} placeholder="Contoh: RSU Universitas Muhammadiyah Malang" />
          </Bidang>
        </Penuh>
        <Bidang label="Kota tempat kerja">
          <Isian name="kota_kerja" defaultValue={p.kota_kerja ?? ""} placeholder="Contoh: Malang" />
        </Bidang>
        <Bidang label="Provinsi tempat kerja">
          <Pilihan name="provinsi_kerja" defaultValue={p.provinsi_kerja ?? ""}>
            <option value="">— Pilih —</option>
            {PROVINSI.map((v) => <option key={v}>{v}</option>)}
          </Pilihan>
        </Bidang>
      </Bagian>

      <Bagian judul="Legalitas praktik" keterangan="🔒 Hanya kamu dan admin yang bisa melihat bagian ini. Tidak pernah muncul di direktori.">
        <Bidang label="Nomor STR">
          <Isian name="no_str" defaultValue={p.no_str ?? ""} autoComplete="off" />
        </Bidang>
        <Bidang label="STR berlaku sampai" petunjuk="Kosongkan bila STR seumur hidup.">
          <Isian name="str_berlaku_sampai" type="date" defaultValue={p.str_berlaku_sampai ?? ""} />
        </Bidang>
        <Bidang label="Nomor SIP">
          <Isian name="no_sip" defaultValue={p.no_sip ?? ""} autoComplete="off" />
        </Bidang>
        <Bidang label="Cabang IDI">
          <Isian name="cabang_idi" defaultValue={p.cabang_idi ?? ""} placeholder="Contoh: IDI Cabang Kota Malang" />
        </Bidang>
        <Penuh>
          <Sakelar name="anggota_idi" defaultChecked={p.anggota_idi ?? false} label="Saya anggota aktif Ikatan Dokter Indonesia" />
        </Penuh>
      </Bagian>

      <Bagian judul="Kontak & domisili">
        <Bidang label="Email kontak" petunjuk="Boleh berbeda dengan email login.">
          <Isian name="email_kontak" type="email" defaultValue={p.email_kontak ?? ""} />
        </Bidang>
        <Bidang label="Nomor HP">
          <Isian name="no_hp" type="tel" defaultValue={p.no_hp ?? ""} placeholder="08…" />
        </Bidang>
        <Bidang label="Nomor WhatsApp">
          <Isian name="whatsapp" type="tel" defaultValue={p.whatsapp ?? ""} placeholder="628…" />
        </Bidang>
        <Bidang label="Kota domisili">
          <Isian name="kota" defaultValue={p.kota ?? ""} />
        </Bidang>
        <Bidang label="Provinsi domisili">
          <Pilihan name="provinsi" defaultValue={p.provinsi ?? ""}>
            <option value="">— Pilih —</option>
            {PROVINSI.map((v) => <option key={v}>{v}</option>)}
          </Pilihan>
        </Bidang>
        <Bidang label="Kode pos">
          <Isian name="kode_pos" defaultValue={p.kode_pos ?? ""} inputMode="numeric" />
        </Bidang>
        <Penuh>
          <Bidang label="Alamat lengkap">
            <AreaTeks name="alamat" defaultValue={p.alamat ?? ""} className="min-h-20" />
          </Bidang>
        </Penuh>
        <input type="hidden" name="negara" value={p.negara ?? "Indonesia"} />
      </Bagian>

      <Bagian judul="Tentang saya & media sosial">
        <Penuh>
          <Bidang label="Bio singkat" petunjuk="Maks. 600 karakter. Ceritakan minat klinis, riset, atau hal yang ingin kamu bagikan ke sejawat.">
            <AreaTeks name="bio" maxLength={600} defaultValue={p.bio ?? ""} />
          </Bidang>
        </Penuh>
        <Bidang label="LinkedIn">
          <Isian name="linkedin" defaultValue={p.linkedin ?? ""} placeholder="linkedin.com/in/…" />
        </Bidang>
        <Bidang label="Instagram">
          <Isian name="instagram" defaultValue={p.instagram ?? ""} placeholder="@namapengguna" />
        </Bidang>
        <Penuh>
          <Bidang label="Situs web / praktik">
            <Isian name="situs_web" defaultValue={p.situs_web ?? ""} placeholder="https://…" />
          </Bidang>
        </Penuh>
      </Bagian>

      <Kartu className="border-merek-200 p-6">
        <h2 className="text-base font-semibold text-slate-900">🔐 Pengaturan privasi</h2>
        <p className="mt-1 text-sm leading-relaxed text-slate-500">
          Kamu yang memutuskan. Pengaturan ini ditegakkan langsung oleh database, bukan sekadar disembunyikan di tampilan.
        </p>

        <fieldset className="mt-5">
          <legend className="mb-2.5 text-sm font-medium text-slate-700">Tampil di direktori alumni?</legend>
          <div className="space-y-2">
            {(Object.keys(LABEL_VISIBILITAS) as (keyof typeof LABEL_VISIBILITAS)[]).map((k) => (
              <label key={k} className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-3.5 hover:bg-slate-50 has-[:checked]:border-merek-300 has-[:checked]:bg-merek-50/50">
                <input type="radio" name="visibilitas" value={k} defaultChecked={p.visibilitas === k}
                  className="mt-0.5 size-4 text-merek-600 focus:ring-merek-500" />
                <span className="text-sm text-slate-700">{LABEL_VISIBILITAS[k]}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="mt-6">
          <legend className="mb-2.5 text-sm font-medium text-slate-700">Informasi yang boleh dilihat alumni lain</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            <Sakelar name="tampilkan_tempat_kerja" defaultChecked={p.tampilkan_tempat_kerja} label="Tempat kerja & jabatan" petunjuk="Membantu sejawat merujuk pasien." />
            <Sakelar name="tampilkan_email" defaultChecked={p.tampilkan_email} label="Email kontak" />
            <Sakelar name="tampilkan_whatsapp" defaultChecked={p.tampilkan_whatsapp} label="Nomor WhatsApp" />
            <Sakelar name="tampilkan_no_hp" defaultChecked={p.tampilkan_no_hp} label="Nomor HP" />
            <Sakelar name="tampilkan_alamat" defaultChecked={p.tampilkan_alamat} label="Alamat lengkap" petunjuk="Tidak disarankan." />
            <Sakelar name="tampilkan_tanggal_lahir" defaultChecked={p.tampilkan_tanggal_lahir} label="Ucapan ulang tahun" petunjuk="Hanya hari & bulan, tahun tidak pernah ditampilkan." />
          </div>
        </fieldset>
      </Kartu>

      <div className="sticky bottom-4 z-10 flex items-center justify-end gap-3 rounded-xl border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur">
        <p className="mr-auto hidden pl-2 text-xs text-slate-500 sm:block">Perubahan baru tersimpan setelah tombol ini ditekan.</p>
        <TombolSimpan />
      </div>
    </form>
  );
}
