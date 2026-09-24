"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { aksiDaftar } from "@/actions/autentikasi";
import { Bidang, Isian, Pesan, Tombol } from "@/components/ui/dasar";

function TombolKirim() {
  const { pending } = useFormStatus();
  return <Tombol type="submit" disabled={pending} className="w-full py-3">{pending ? "Mendaftarkan…" : "Buat Akun"}</Tombol>;
}

export function FormDaftar() {
  const [hasil, aksi] = useActionState(aksiDaftar, null);

  if (hasil?.sukses) {
    return (
      <div className="mt-7">
        <Pesan jenis="sukses" judul="Cek email kamu">{hasil.sukses}</Pesan>
      </div>
    );
  }

  return (
    <form action={aksi} className="mt-7 space-y-4">
      {hasil?.galat && <Pesan jenis="galat">{hasil.galat}</Pesan>}

      <Bidang label="Nama lengkap" petunjuk="Tanpa gelar — gelar diisi nanti di halaman profil." wajib>
        <Isian name="nama_lengkap" required minLength={3} autoComplete="name" placeholder="Ahmad Fauzi" />
      </Bidang>

      <Bidang label="Email aktif" petunjuk="Dipakai untuk masuk dan menerima pemberitahuan pengurus." wajib>
        <Isian name="email" type="email" required autoComplete="email" placeholder="nama@contoh.com" />
      </Bidang>

      <Bidang label="Kata sandi" petunjuk="Minimal 8 karakter. Gunakan kombinasi huruf dan angka." wajib>
        <Isian name="sandi" type="password" required minLength={8} autoComplete="new-password" placeholder="••••••••" />
      </Bidang>

      <Bidang label="Ulangi kata sandi" wajib>
        <Isian name="ulangi" type="password" required minLength={8} autoComplete="new-password" placeholder="••••••••" />
      </Bidang>

      <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-3.5 text-sm hover:bg-slate-50">
        <input type="checkbox" name="setuju" required className="mt-0.5 size-4 shrink-0 rounded border-slate-300 text-merek-600 focus:ring-merek-500" />
        <span className="leading-relaxed text-slate-600">
          Saya menyatakan benar-benar alumni FK UMM dan menyetujui{" "}
          <Link href="/privasi" target="_blank" className="font-medium text-merek-700 hover:underline">Kebijakan Privasi</Link>{" "}
          serta pengelolaan data pribadi saya sesuai UU No. 27 Tahun 2022.
        </span>
      </label>

      <TombolKirim />
    </form>
  );
}
