import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { FormDaftar } from "./form";
import { ambilSesi } from "@/lib/sesi";

export const metadata: Metadata = {
  title: "Daftar Keanggotaan",
  description: "Pendaftaran keanggotaan Alumni Kedokteran UMM.",
};

export default async function HalamanDaftar() {
  const { user } = await ambilSesi();
  if (user) redirect("/profil");

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="font-serif text-2xl font-bold text-slate-900">Daftar keanggotaan</h1>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">
        Khusus lulusan Fakultas Kedokteran UMM. Setelah mendaftar, pengurus akan memeriksa
        data kamu sebelum akses direktori dibuka — biasanya 1–3 hari kerja.
      </p>

      <ol className="mt-6 space-y-2.5 rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
        {["Buat akun di formulir ini", "Lengkapi profil (NIM, angkatan, tahun lulus)", "Pengurus memverifikasi", "Direktori alumni terbuka"].map((t, i) => (
          <li key={t} className="flex gap-3">
            <span className="grid size-5 shrink-0 place-items-center rounded-full bg-merek-700 text-[11px] font-bold text-white">{i + 1}</span>
            {t}
          </li>
        ))}
      </ol>

      <FormDaftar />

      <p className="mt-6 border-t border-slate-200 pt-5 text-center text-sm text-slate-600">
        Sudah punya akun? <Link href="/masuk" className="font-medium text-merek-700 hover:underline">Masuk di sini</Link>
      </p>
    </div>
  );
}
