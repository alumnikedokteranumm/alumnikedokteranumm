"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { simpanPengaturan } from "@/actions/admin";
import { AreaTeks, Bidang, Isian, Kartu, Pesan, Tombol } from "@/components/ui/dasar";

const GRUP = [
  { judul: "Identitas", kunci: ["nama_organisasi", "singkatan", "tagline"] },
  { judul: "Kontak", kunci: ["alamat", "email", "email_kampus", "telepon", "whatsapp"] },
  { judul: "Media sosial", kunci: ["instagram", "youtube", "tiktok", "facebook", "linkedin", "x"] },
  { judul: "Beranda — sambutan", kunci: ["sambutan_judul", "sambutan_nama", "sambutan_isi"] },
  { judul: "Halaman Tentang", kunci: ["tentang_sejarah", "tentang_visi", "tentang_misi"] },
  { judul: "Halaman Donasi", kunci: ["donasi_catatan"] },
];
const LABEL_CADANGAN: Record<string, string> = {
  email_kampus: "Email resmi kampus", tiktok: "TikTok", linkedin: "LinkedIn", x: "X (Twitter)",
};
const MEDSOS = "Boleh tautan lengkap atau cukup nama akun, contoh: @alumnikedokteranumm. Kosongkan bila tidak punya — ikonnya tidak akan tampil.";
const PETUNJUK: Record<string, string> = {
  tentang_misi: "Pisahkan setiap butir misi dengan titik koma ( ; )",
  whatsapp: "Nomor narahubung, contoh 0812xxxxxxx. Akan menjadi tombol chat WhatsApp di halaman Kontak.",
  instagram: MEDSOS, youtube: MEDSOS, tiktok: MEDSOS, facebook: MEDSOS, linkedin: MEDSOS, x: MEDSOS,
};
const PANJANG = new Set(["sambutan_isi", "tentang_sejarah", "tentang_visi", "tentang_misi", "alamat", "donasi_catatan"]);

function Simpan() {
  const { pending } = useFormStatus();
  return <Tombol type="submit" disabled={pending}>{pending ? "Menyimpan…" : "Simpan Pengaturan"}</Tombol>;
}

export function FormPengaturan({ baris }: { baris: { kunci: string; nilai: string | null; keterangan: string | null }[] }) {
  const [hasil, aksi] = useActionState(simpanPengaturan, null);
  const peta = new Map(baris.map((b) => [b.kunci, b]));

  return (
    <form action={aksi} className="space-y-6">
      {hasil?.galat && <Pesan jenis="galat">{hasil.galat}</Pesan>}
      {hasil?.sukses && <Pesan jenis="sukses">{hasil.sukses}</Pesan>}
      {GRUP.map((g) => (
        <Kartu key={g.judul} className="p-6">
          <h2 className="font-semibold text-slate-900">{g.judul}</h2>
          <div className="mt-4 space-y-4">
            {g.kunci.map((k) => {
              const b = peta.get(k);
              return (
                <Bidang key={k} label={b?.keterangan || LABEL_CADANGAN[k] || k} petunjuk={PETUNJUK[k]}>
                  {PANJANG.has(k)
                    ? <AreaTeks name={`p_${k}`} defaultValue={b?.nilai ?? ""} />
                    : <Isian name={`p_${k}`} defaultValue={b?.nilai ?? ""} />}
                </Bidang>
              );
            })}
          </div>
        </Kartu>
      ))}
      <div className="flex justify-end"><Simpan /></div>
    </form>
  );
}
