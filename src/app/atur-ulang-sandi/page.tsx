import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { FormGantiSandi } from "./form";
import { ambilSesi } from "@/lib/sesi";
import { Logo } from "@/components/logo";

export const metadata: Metadata = { title: "Atur Ulang Kata Sandi", robots: { index: false } };

export default async function HalamanAturUlang() {
  const { user } = await ambilSesi();
  if (!user) redirect("/lupa-sandi");

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="mb-8 flex items-center justify-center gap-2.5">
        <Logo className="size-16" />
        <span className="text-lg font-bold text-slate-900">Alumni Kedokteran UMM</span>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="font-serif text-2xl font-bold text-slate-900">Buat kata sandi baru</h1>
        <p className="mt-2 text-sm text-slate-600">Masukkan kata sandi baru untuk akun <strong>{user.email}</strong>.</p>
        <FormGantiSandi />
      </div>
    </div>
  );
}
