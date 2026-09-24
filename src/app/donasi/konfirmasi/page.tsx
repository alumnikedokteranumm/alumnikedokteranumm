import type { Metadata } from "next";
import Link from "next/link";
import { buatKlienServer } from "@/lib/supabase/server";
import { ambilSesi } from "@/lib/sesi";
import { JudulHalaman, Kosong, Pesan } from "@/components/ui/dasar";
import { FormKonfirmasi } from "./form";
import type { AcaraWebinar, ProgramDana } from "@/lib/tipe";

export const metadata: Metadata = { title: "Konfirmasi Transfer", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function KonfirmasiTransfer({
  searchParams,
}: { searchParams: Promise<{ program?: string; acara?: string }> }) {
  const q = await searchParams;
  const { user } = await ambilSesi();
  const supabase = await buatKlienServer();
  const { data: p } = await supabase.from("donasi").select("*").eq("aktif", true).order("dibuat_pada");
  const program = (p ?? []) as ProgramDana[];

  let acara: AcaraWebinar | null = null;
  if (q.acara && /^[0-9a-f-]{36}$/i.test(q.acara)) {
    const { data } = await supabase.from("acara").select("*").eq("id", q.acara).maybeSingle();
    acara = data as AcaraWebinar | null;
  }
  // Pembayaran kegiatan masuk ke rekening utama organisasi (program iuran)
  const rekeningUtama = program.find((x) => x.jenis === "iuran" && x.no_rekening) ?? program.find((x) => x.no_rekening) ?? null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <Link href={acara ? `/skp/${acara.id}` : "/donasi"} className="text-sm text-slate-500 hover:text-merek-700">← Kembali</Link>
      <div className="mt-4">
        <JudulHalaman judul="Konfirmasi Transfer"
          deskripsi="Sudah transfer? Unggah buktinya di sini. Bendahara memeriksa mutasi rekening lalu menandai pembayaranmu diterima — biasanya dalam 1×24 jam kerja." />
      </div>

      {!program.length && !acara ? (
        <Kosong judul="Belum ada program aktif" pesan="Pengurus belum membuka program iuran atau donasi." />
      ) : (
        <FormKonfirmasi
          idPengguna={user!.id}
          program={program.map((x) => ({
            id: x.id, judul: x.judul, jenis: x.jenis, nominal_iuran: x.nominal_iuran,
            bank: x.bank, no_rekening: x.no_rekening, atas_nama: x.atas_nama,
          }))}
          programAwal={q.program ?? null}
          acara={acara ? {
            id: acara.id, judul: acara.judul, biaya: acara.biaya_nominal ?? 0,
            bank: rekeningUtama?.bank ?? null, no_rekening: rekeningUtama?.no_rekening ?? null, atas_nama: rekeningUtama?.atas_nama ?? null,
          } : null}
        />
      )}

      <div className="mt-8">
        <Pesan jenis="ingat" judul="Waspada penipuan">
          Transfer hanya ke rekening yang tercantum di website ini. Pengurus tidak pernah meminta transfer ke rekening pribadi.
        </Pesan>
      </div>
    </div>
  );
}
