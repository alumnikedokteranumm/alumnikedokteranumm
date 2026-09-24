import type { Metadata } from "next";
import Link from "next/link";
import { buatKlienServer } from "@/lib/supabase/server";
import { ambilSesi } from "@/lib/sesi";
import { JudulHalaman, Kartu, Kosong, Lencana, Pesan, TautanTombol } from "@/components/ui/dasar";
import { LABEL_JENIS_BAYAR } from "@/lib/konstanta";
import { rupiah, tanggal } from "@/lib/format";
import type { Pembayaran } from "@/lib/tipe";

export const metadata: Metadata = { title: "Riwayat Kontribusi", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const WARNA = { menunggu: "emas", diterima: "hijau", ditolak: "merah" } as const;
const LABEL = { menunggu: "Sedang diperiksa", diterima: "Diterima", ditolak: "Ditolak" } as const;

export default async function RiwayatKontribusi({ searchParams }: { searchParams: Promise<{ terkirim?: string }> }) {
  const { terkirim } = await searchParams;
  const { user } = await ambilSesi();
  const supabase = await buatKlienServer();
  const { data } = await supabase.from("pembayaran").select("*").eq("profil_id", user!.id).order("dibuat_pada", { ascending: false });
  const daftar = (data ?? []) as Pembayaran[];
  const tahun = new Date().getFullYear();
  const iuranLunas = daftar.some((b) => b.jenis === "iuran" && b.tahun_iuran === tahun && b.status === "diterima");
  const total = daftar.filter((b) => b.status === "diterima").reduce((s, b) => s + b.nominal, 0);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <Link href="/donasi" className="text-sm text-slate-500 hover:text-merek-700">← Iuran & Donasi</Link>
      <div className="mt-4">
        <JudulHalaman judul="Riwayat Kontribusi Saya" deskripsi="Semua iuran, donasi, dan pembayaran kegiatan yang pernah kamu konfirmasi."
          aksi={<TautanTombol href="/donasi/konfirmasi">+ Konfirmasi transfer</TautanTombol>} />
      </div>

      {terkirim && <div className="mb-6"><Pesan jenis="sukses" judul="Konfirmasi terkirim">Bendahara akan memeriksa mutasi rekening. Statusnya berubah di halaman ini.</Pesan></div>}

      <div className="mb-8 grid gap-4 sm:grid-cols-2">
        <Kartu className={`p-5 ${iuranLunas ? "border-emerald-200 bg-emerald-50" : ""}`}>
          <p className="text-sm text-slate-500">Iuran tahun {tahun}</p>
          <p className={`mt-1 text-xl font-bold ${iuranLunas ? "text-emerald-700" : "text-slate-900"}`}>{iuranLunas ? "✓ Lunas" : "Belum tercatat"}</p>
        </Kartu>
        <Kartu className="p-5">
          <p className="text-sm text-slate-500">Total kontribusi diterima</p>
          <p className="mt-1 text-xl font-bold text-merek-800">{rupiah(total)}</p>
        </Kartu>
      </div>

      {!daftar.length ? (
        <Kosong judul="Belum ada riwayat" pesan="Setelah transfer iuran atau donasi, unggah buktinya lewat tombol Konfirmasi transfer." />
      ) : (
        <Kartu className="overflow-hidden">
          <ul className="divide-y divide-slate-100">
            {daftar.map((b) => (
              <li key={b.id} className="flex flex-wrap items-center gap-3 px-5 py-4">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-slate-900">
                    {LABEL_JENIS_BAYAR[b.jenis]}{b.tahun_iuran ? ` ${b.tahun_iuran}` : ""}
                  </p>
                  <p className="text-sm text-slate-500">Transfer {tanggal(b.tanggal_transfer)}{b.bank_pengirim ? ` · ${b.bank_pengirim}` : ""}</p>
                  {b.catatan_pengurus && <p className="mt-1 text-sm text-slate-600">Catatan bendahara: {b.catatan_pengurus}</p>}
                </div>
                <p className="font-semibold text-slate-900">{rupiah(b.nominal)}</p>
                <Lencana warna={WARNA[b.status]}>{LABEL[b.status]}</Lencana>
              </li>
            ))}
          </ul>
        </Kartu>
      )}
    </div>
  );
}
