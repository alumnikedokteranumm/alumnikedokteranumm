import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { FormMasuk } from "./form";
import { ambilSesi } from "@/lib/sesi";
import { Pesan } from "@/components/ui/dasar";

export const metadata: Metadata = { title: "Masuk", robots: { index: false } };

export default async function HalamanMasuk({
  searchParams,
}: { searchParams: Promise<{ lanjut?: string; galat?: string }> }) {
  const { user } = await ambilSesi();
  if (user) redirect("/profil");
  const { lanjut, galat } = await searchParams;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="font-serif text-2xl font-bold text-slate-900">Masuk ke akun alumni</h1>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">
        Gunakan email yang kamu daftarkan. Belum punya akun?{" "}
        <Link href="/daftar" className="font-medium text-merek-700 hover:underline">Daftar di sini</Link>.
      </p>
      {galat === "tautan-kedaluwarsa" && (
        <div className="mt-5">
          <Pesan jenis="ingat">Tautan dari email sudah kedaluwarsa atau dibuka di peramban berbeda. Silakan masuk, atau minta tautan baru.</Pesan>
        </div>
      )}
      <FormMasuk lanjut={lanjut ?? ""} />
    </div>
  );
}
