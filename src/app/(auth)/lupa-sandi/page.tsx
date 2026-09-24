import type { Metadata } from "next";
import Link from "next/link";
import { FormLupaSandi } from "./form";

export const metadata: Metadata = { title: "Lupa Kata Sandi", robots: { index: false } };

export default function HalamanLupaSandi() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="font-serif text-2xl font-bold text-slate-900">Lupa kata sandi</h1>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">
        Masukkan email yang kamu pakai mendaftar. Kami akan mengirimkan tautan untuk membuat kata sandi baru.
      </p>
      <FormLupaSandi />
      <p className="mt-6 border-t border-slate-200 pt-5 text-center text-sm text-slate-600">
        <Link href="/masuk" className="font-medium text-merek-700 hover:underline">← Kembali ke halaman masuk</Link>
      </p>
    </div>
  );
}
