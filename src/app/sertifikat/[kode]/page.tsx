import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { buatKlienServer } from "@/lib/supabase/server";
import { ambilPengaturan } from "@/lib/sesi";
import { Logo } from "@/components/logo";
import { TombolCetak } from "./cetak";
import { tanggal } from "@/lib/format";
import type { AcaraWebinar, Peserta } from "@/lib/tipe";

export const metadata: Metadata = { title: "Sertifikat", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function Sertifikat({ params }: { params: Promise<{ kode: string }> }) {
  const { kode } = await params;
  if (!/^[0-9A-F]{12}$/.test(kode)) notFound();
  const supabase = await buatKlienServer();

  // RLS: hanya pemilik sertifikat (atau pengurus) yang bisa membaca baris peserta
  const { data } = await supabase.from("peserta_acara").select("*, acara(*)").eq("kode_verifikasi", kode).maybeSingle();
  const ps = data as (Peserta & { acara: AcaraWebinar }) | null;
  if (!ps?.nomor_sertifikat || !ps.acara) notFound();

  const [{ data: v }, p] = await Promise.all([
    supabase.rpc("verifikasi_sertifikat", { p_kode: kode }),
    ambilPengaturan(),
  ]);
  const nama = (v as { nama: string }[] | null)?.[0]?.nama ?? "";
  const situs = process.env.NEXT_PUBLIC_SITE_URL || "";
  const a = ps.acara;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 print:p-0">
      <style>{`@page { size: A4 landscape; margin: 0 } @media print { body { background: #fff } }`}</style>
      <div className="tanpa-cetak mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link href={`/skp/${ps.acara_id}`} className="text-sm text-slate-500 hover:text-merek-700">← Ruang peserta</Link>
        <TombolCetak />
      </div>

      {/* Rasio A4 lanskap: 297 × 210 mm */}
      <div className="relative mx-auto aspect-[297/210] w-full max-w-[1123px] overflow-hidden bg-white shadow-xl print:shadow-none">
        <div className="absolute inset-[3%] border-[3px] border-merek-800" />
        <div className="absolute inset-[4.2%] border border-emas-500" />
        <div className="absolute inset-0 flex flex-col items-center px-[10%] pt-[6.5%] text-center">
          <Logo className="size-[11%] min-h-10 min-w-10" />
          <p className="mt-[1.2%] text-[clamp(8px,1.3vw,14px)] font-semibold uppercase tracking-[0.3em] text-merek-700">
            {p.nama_organisasi || "Alumni Kedokteran UMM"}
          </p>
          <h1 className="mt-[2%] font-serif text-[clamp(20px,4.4vw,50px)] font-bold tracking-wide text-merek-900">SERTIFIKAT</h1>
          <p className="text-[clamp(7px,1.1vw,12px)] text-slate-500">Nomor: {ps.nomor_sertifikat}</p>

          <p className="mt-[2.5%] text-[clamp(8px,1.35vw,15px)] text-slate-600">diberikan kepada</p>
          <p className="mt-[0.8%] font-serif text-[clamp(16px,3.3vw,38px)] font-bold text-slate-900">{nama}</p>
          <div className="mx-auto mt-[0.8%] h-px w-1/2 bg-emas-500" />

          <p className="mt-[2%] text-[clamp(8px,1.35vw,15px)] text-slate-600">atas partisipasinya sebagai <strong>Peserta</strong> dalam kegiatan</p>
          <p className="mt-[1%] max-w-[85%] font-serif text-[clamp(11px,2vw,23px)] font-semibold leading-snug text-merek-900">{a.judul}</p>
          <p className="mt-[1%] text-[clamp(8px,1.25vw,14px)] text-slate-600">
            {tanggal(a.mulai)}{a.lokasi ? ` · ${a.lokasi}` : ""}
          </p>
          {a.skp_idi ? (
            <p className="mt-[1.5%] rounded-full bg-emas-300/40 px-[2%] py-[0.5%] text-[clamp(8px,1.3vw,15px)] font-semibold text-merek-900">
              {String(a.skp_idi).replace(".", ",")} SKP{a.nomor_skp ? ` · No. ${a.nomor_skp}` : ""}
            </p>
          ) : null}

          <div className="mt-auto mb-[6.5%] flex w-full items-end justify-between text-left">
            <div className="text-[clamp(6px,0.95vw,11px)] leading-relaxed text-slate-500">
              <p>Kode verifikasi: <span className="font-mono font-semibold text-slate-700">{kode}</span></p>
              <p>Cek keaslian: {situs.replace(/^https?:\/\//, "") || "situs AKU"}/verifikasi?kode={kode}</p>
            </div>
            <div className="text-center">
              <p className="text-[clamp(7px,1.1vw,13px)] text-slate-600">{a.jabatan_penandatangan || "Ketua Umum"}</p>
              <div className="h-[clamp(24px,5vw,60px)]" />
              <p className="border-t border-slate-400 px-4 pt-1 text-[clamp(8px,1.25vw,14px)] font-semibold text-slate-900">
                {a.penandatangan || p.sambutan_nama || "Ketua Umum"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <p className="tanpa-cetak mt-6 text-center text-sm text-slate-500">
        Tips: di jendela cetak pilih <strong>“Simpan sebagai PDF”</strong>, orientasi <strong>Lanskap</strong>, dan aktifkan <strong>“Grafis latar”</strong>.
      </p>
    </div>
  );
}
