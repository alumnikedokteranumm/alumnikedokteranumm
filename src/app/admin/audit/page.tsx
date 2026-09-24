import { redirect } from "next/navigation";
import { ambilSesi } from "@/lib/sesi";
import { buatKlienServer } from "@/lib/supabase/server";
import { Kosong } from "@/components/ui/dasar";
import { tanggalJam } from "@/lib/format";

const LABEL: Record<string, string> = {
  verifikasi: "Memverifikasi alumni", tolak: "Menolak pendaftar", set_menunggu: "Mengembalikan ke antrean",
  ubah_peran: "Mengubah peran", ekspor_alumni: "Mengekspor data alumni", ekspor_tracer: "Mengekspor data tracer",
  ubah_pengaturan: "Mengubah pengaturan situs", hapus_akun_sendiri: "Menghapus akunnya sendiri",
  hapus_pengguna: "Menghapus akun pendaftar",
};

export default async function JejakAudit() {
  const { profil } = await ambilSesi();
  if (profil?.peran !== "admin") redirect("/admin");

  const supabase = await buatKlienServer();
  const { data } = await supabase.from("jejak_audit").select("*").order("dibuat_pada", { ascending: false }).limit(200);
  const baris = data ?? [];

  const id = [...new Set(baris.flatMap((b) => [b.aktor_id, b.target_id]).filter(Boolean))];
  const { data: orang } = id.length
    ? await supabase.from("profiles").select("id, nama_lengkap").in("id", id)
    : { data: [] };
  const nama = new Map((orang ?? []).map((o) => [o.id, o.nama_lengkap]));

  return (
    <div>
      <h1 className="font-serif text-2xl font-bold text-slate-900">Jejak Audit</h1>
      <p className="mt-1 text-sm text-slate-500">
        Catatan tindakan pengurus atas data pribadi — dibutuhkan untuk akuntabilitas sesuai UU PDP. 200 catatan terakhir.
      </p>
      {!baris.length ? (
        <div className="mt-6"><Kosong judul="Belum ada catatan" pesan="Tindakan verifikasi, perubahan peran, dan ekspor data akan tercatat di sini." /></div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
              <tr><th className="px-4 py-3 font-medium">Waktu</th><th className="px-4 py-3 font-medium">Pelaku</th><th className="px-4 py-3 font-medium">Tindakan</th><th className="px-4 py-3 font-medium">Sasaran</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {baris.map((b) => (
                <tr key={b.id}>
                  <td className="whitespace-nowrap px-4 py-2.5 text-slate-500">{tanggalJam(b.dibuat_pada)}</td>
                  <td className="px-4 py-2.5 font-medium text-slate-800">{nama.get(b.aktor_id) ?? "(akun terhapus)"}</td>
                  <td className="px-4 py-2.5 text-slate-700">
                    {LABEL[b.aksi] ?? b.aksi}
                    {b.rincian?.peran && <span className="text-slate-400"> → {b.rincian.peran}</span>}
                    {b.rincian?.jumlah != null && <span className="text-slate-400"> ({b.rincian.jumlah} baris)</span>}
                  </td>
                  <td className="px-4 py-2.5 text-slate-600">
                    {b.target_id ? nama.get(b.target_id) ?? b.rincian?.nama ?? "(akun terhapus)" : "—"}
                    {b.rincian?.nim && <span className="text-slate-400"> · NIM {b.rincian.nim}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
