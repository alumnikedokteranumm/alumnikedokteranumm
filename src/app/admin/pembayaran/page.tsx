import Link from "next/link";
import { buatKlienServer } from "@/lib/supabase/server";
import { Kartu, Kosong, Lencana, Pesan } from "@/components/ui/dasar";
import { LABEL_JENIS_BAYAR } from "@/lib/konstanta";
import { angka, rupiah, tanggal, waktuRelatif } from "@/lib/format";
import { AksiPembayaran } from "./aksi";
import type { Pembayaran } from "@/lib/tipe";

const TAB = [
  { nilai: "menunggu", label: "Perlu diperiksa" },
  { nilai: "diterima", label: "Diterima" },
  { nilai: "ditolak", label: "Ditolak" },
];

type Baris = Pembayaran & { donasi: { judul: string } | null; acara: { judul: string } | null };

export default async function KelolaPembayaran({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const status = (await searchParams).status ?? "menunggu";
  const supabase = await buatKlienServer();
  const tahun = new Date().getFullYear();
  const [{ data, error }, { count: lunas }, { count: antre }] = await Promise.all([
    supabase.from("pembayaran").select("*, donasi(judul), acara(judul)").eq("status", status)
      .order("dibuat_pada", { ascending: status === "menunggu" }).limit(200),
    supabase.from("pembayaran").select("id", { count: "exact", head: true })
      .eq("jenis", "iuran").eq("tahun_iuran", tahun).eq("status", "diterima"),
    supabase.from("pembayaran").select("id", { count: "exact", head: true }).eq("status", "menunggu"),
  ]);
  const daftar = (data ?? []) as Baris[];

  return (
    <div>
      <h1 className="font-serif text-2xl font-bold text-slate-900">💳 Pembayaran</h1>
      <p className="mt-1 text-sm text-slate-500">
        Cocokkan setiap konfirmasi dengan mutasi rekening. Yang diterima otomatis masuk Buku Kas, menambah angka “terkumpul” program,
        dan mengaktifkan peserta webinar berbayar.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Kartu className={`p-5 ${(antre ?? 0) > 0 ? "border-amber-300 bg-amber-50" : ""}`}>
          <p className="text-sm text-slate-500">Menunggu diperiksa</p>
          <p className="mt-1 font-serif text-3xl font-bold text-slate-900">{angka(antre)}</p>
        </Kartu>
        <Kartu className="p-5">
          <p className="text-sm text-slate-500">Iuran {tahun} lunas</p>
          <p className="mt-1 font-serif text-3xl font-bold text-slate-900">{angka(lunas)} <span className="text-base font-normal text-slate-500">alumni</span></p>
        </Kartu>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {TAB.map((t) => (
          <Link key={t.nilai} href={`/admin/pembayaran?status=${t.nilai}`}
            className={`rounded-full px-3.5 py-1.5 text-sm ${status === t.nilai ? "bg-merek-700 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"}`}>
            {t.label}
          </Link>
        ))}
        <Link href="/admin/konten/kas" className="ml-auto rounded-full px-3.5 py-1.5 text-sm text-merek-700 hover:bg-merek-50">📒 Buku Kas & pengeluaran →</Link>
      </div>

      {error ? (
        <div className="mt-6"><Pesan jenis="galat">{error.message}</Pesan></div>
      ) : !daftar.length ? (
        <div className="mt-6"><Kosong judul="Tidak ada data" pesan={status === "menunggu" ? "Semua konfirmasi sudah diperiksa. 🎉" : "Belum ada."} /></div>
      ) : (
        <div className="mt-6 space-y-3">
          {daftar.map((b) => (
            <Kartu key={b.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-slate-900">{b.nama_pembayar}</p>
                    <Lencana warna="biru">{LABEL_JENIS_BAYAR[b.jenis]}{b.tahun_iuran ? ` ${b.tahun_iuran}` : ""}</Lencana>
                    {b.tampilkan_nama && <Lencana>nama boleh tampil</Lencana>}
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{b.donasi?.judul ?? b.acara?.judul ?? "—"}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    Transfer {tanggal(b.tanggal_transfer)}
                    {b.bank_pengirim ? ` · ${b.bank_pengirim}` : ""}
                    {b.atas_nama_pengirim ? ` · a.n. ${b.atas_nama_pengirim}` : ""}
                    {" · "}dikirim {waktuRelatif(b.dibuat_pada)}
                  </p>
                  {b.catatan && <p className="mt-1 text-sm text-slate-600">“{b.catatan}”</p>}
                  {b.catatan_pengurus && <p className="mt-1 text-sm text-slate-500">Catatan pengurus: {b.catatan_pengurus}</p>}
                </div>
                <p className="font-serif text-2xl font-bold text-slate-900">{rupiah(b.nominal)}</p>
              </div>
              <AksiPembayaran id={b.id} status={b.status} buktiPath={b.bukti_path} />
            </Kartu>
          ))}
        </div>
      )}
    </div>
  );
}
