import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ambilSesi, ambilPengaturan } from "@/lib/sesi";
import { Kartu, TautanTombol } from "@/components/ui/dasar";

export const metadata: Metadata = { title: "Menunggu Verifikasi", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function MenungguVerifikasi() {
  const { user, profil } = await ambilSesi();
  if (!user) redirect("/masuk");
  const p = await ambilPengaturan();
  const dataInti = Boolean(profil?.nim && profil?.angkatan && profil?.tahun_lulus);

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <Kartu className="p-8 text-center sm:p-12">
        <span className="mx-auto grid size-16 place-items-center rounded-full bg-amber-50 text-3xl">⏳</span>
        <h1 className="mt-6 font-serif text-2xl font-bold text-slate-900">
          {profil?.status === "ditolak" ? "Verifikasi belum berhasil" : "Akunmu sedang diverifikasi"}
        </h1>
        <p className="mx-auto mt-3 max-w-md leading-relaxed text-slate-600">
          {profil?.status === "ditolak"
            ? profil.catatan_admin || "Data belum cocok dengan arsip fakultas. Perbaiki profil lalu hubungi pengurus."
            : "Direktori alumni hanya dibuka untuk lulusan FK UMM yang sudah dicocokkan dengan arsip fakultas. Ini melindungi data pribadi seluruh alumni — termasuk datamu."}
        </p>

        <ol className="mx-auto mt-8 max-w-sm space-y-3 text-left text-sm">
          <li className="flex items-center gap-3">
            <span className="grid size-6 place-items-center rounded-full bg-merek-600 text-xs text-white">✓</span>
            <span className="text-slate-700">Akun dibuat</span>
          </li>
          <li className="flex items-center gap-3">
            <span className={`grid size-6 place-items-center rounded-full text-xs ${dataInti ? "bg-merek-600 text-white" : "bg-amber-100 text-amber-700"}`}>
              {dataInti ? "✓" : "2"}
            </span>
            <span className={dataInti ? "text-slate-700" : "font-medium text-amber-800"}>
              {dataInti ? "NIM, angkatan & tahun lulus terisi" : "Lengkapi NIM, angkatan & tahun lulus"}
            </span>
          </li>
          <li className="flex items-center gap-3">
            <span className="grid size-6 place-items-center rounded-full bg-slate-100 text-xs text-slate-500">3</span>
            <span className="text-slate-500">Pengurus memverifikasi (1–3 hari kerja)</span>
          </li>
        </ol>

        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <TautanTombol href="/profil">{dataInti ? "Lihat profil saya" : "Lengkapi profil sekarang"}</TautanTombol>
          <TautanTombol href="/kontak" varian="garis">Hubungi pengurus</TautanTombol>
        </div>
        {p.email && <p className="mt-6 text-xs text-slate-400">Pertanyaan: {p.email}</p>}
      </Kartu>
    </div>
  );
}
