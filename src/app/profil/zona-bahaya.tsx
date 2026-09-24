import Link from "next/link";
import { Kartu } from "@/components/ui/dasar";

export function ZonaBahaya() {
  return (
    <Kartu className="p-6">
      <h2 className="text-base font-semibold text-slate-900">Keamanan & akun</h2>
      <div className="mt-4">
        <Link href="/atur-ulang-sandi" className="inline-block rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
          Ganti kata sandi
        </Link>
      </div>
      <p className="mt-4 text-sm leading-relaxed text-slate-500">
        Ingin akun dan datamu dihapus? Ajukan permintaan ke pengurus melalui{" "}
        <Link href="/kontak" className="font-medium text-merek-700 hover:underline">halaman Kontak</Link>.
        Permintaan diproses paling lambat 3 × 24 jam.
      </p>
    </Kartu>
  );
}
