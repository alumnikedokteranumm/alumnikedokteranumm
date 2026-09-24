import type { Metadata } from "next";
import Link from "next/link";
import { buatKlienServer } from "@/lib/supabase/server";
import { tautanFotoBanyak } from "@/lib/sesi";
import { Avatar } from "@/components/avatar";
import { Isian, JudulHalaman, Kartu, Kosong, Lencana, Pesan, Pilihan, Tombol } from "@/components/ui/dasar";
import { LABEL_PROFESI, OPSI_PROFESI } from "@/lib/konstanta";
import type { BarisDirektori, StatusProfesi } from "@/lib/tipe";
import { angka } from "@/lib/format";

export const metadata: Metadata = { title: "Direktori Alumni", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const PER_HAL = 12;

type Saring = { q?: string; angkatan?: string; lulus?: string; kota?: string; spesialisasi?: string; status?: string; hal?: string };

export default async function Direktori({ searchParams }: { searchParams: Promise<Saring> }) {
  const s = await searchParams;
  const hal = Math.max(1, Number(s.hal) || 1);
  const supabase = await buatKlienServer();

  const [{ data, error }, { data: opsi }] = await Promise.all([
    supabase.rpc("cari_alumni", {
      q: s.q?.trim() || null,
      f_angkatan: Number(s.angkatan) || null,
      f_tahun_lulus: Number(s.lulus) || null,
      f_kota: s.kota?.trim() || null,
      f_spesialisasi: s.spesialisasi?.trim() || null,
      f_status: (s.status as StatusProfesi) || null,
      hal,
      per_hal: PER_HAL,
    }),
    supabase.rpc("opsi_filter"),
  ]);

  const baris = (data ?? []) as BarisDirektori[];
  const total = baris[0]?.total ?? 0;
  const jmlHal = Math.max(1, Math.ceil(total / PER_HAL));
  const foto = await tautanFotoBanyak(baris.map((b) => b.foto_path));
  const pilihan = (opsi ?? { angkatan: [], kota: [], spesialisasi: [] }) as {
    angkatan: number[]; kota: string[]; spesialisasi: string[];
  };
  const adaSaring = Boolean(s.q || s.angkatan || s.lulus || s.kota || s.spesialisasi || s.status);

  const urlHal = (n: number) => {
    const p = new URLSearchParams(Object.entries(s).filter(([k, v]) => v && k !== "hal") as [string, string][]);
    if (n > 1) p.set("hal", String(n));
    const qs = p.toString();
    return `/direktori${qs ? `?${qs}` : ""}`;
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <JudulHalaman
        atas="Khusus alumni terverifikasi"
        judul="Direktori Alumni"
        deskripsi="Temukan sejawat berdasarkan nama, angkatan, kota, atau bidang keahlian. Kontak hanya tampil bila pemiliknya mengizinkan."
      />

      <form method="get" className="mb-8 rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <div className="sm:col-span-2 lg:col-span-2">
            <label className="sr-only" htmlFor="q">Cari</label>
            <Isian id="q" name="q" defaultValue={s.q} placeholder="Cari nama, NIM, RS, kota…" type="search" />
          </div>
          <Pilihan name="angkatan" defaultValue={s.angkatan ?? ""} aria-label="Angkatan">
            <option value="">Semua angkatan</option>
            {pilihan.angkatan.map((a) => <option key={a} value={a}>Angkatan {a}</option>)}
          </Pilihan>
          <Pilihan name="status" defaultValue={s.status ?? ""} aria-label="Status profesi">
            <option value="">Semua profesi</option>
            {OPSI_PROFESI.map((o) => <option key={o.nilai} value={o.nilai}>{o.label}</option>)}
          </Pilihan>
          <Pilihan name="spesialisasi" defaultValue={s.spesialisasi ?? ""} aria-label="Spesialisasi">
            <option value="">Semua spesialisasi</option>
            {pilihan.spesialisasi.map((v) => <option key={v}>{v}</option>)}
          </Pilihan>
          <Pilihan name="kota" defaultValue={s.kota ?? ""} aria-label="Kota">
            <option value="">Semua kota</option>
            {pilihan.kota.map((v) => <option key={v}>{v}</option>)}
          </Pilihan>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Tombol type="submit">Cari</Tombol>
          {adaSaring && <Link href="/direktori" className="text-sm text-slate-500 hover:text-slate-800 hover:underline">Hapus saringan</Link>}
          <p className="ml-auto text-sm text-slate-500">
            {angka(total)} alumni ditemukan
          </p>
        </div>
      </form>

      {error ? (
        <Pesan jenis="galat" judul="Direktori tidak dapat dimuat">{error.message}</Pesan>
      ) : baris.length === 0 ? (
        <Kosong
          judul={adaSaring ? "Tidak ada yang cocok" : "Direktori masih kosong"}
          pesan={adaSaring
            ? "Coba kata kunci lain, atau longgarkan saringan angkatan/kota."
            : "Belum ada alumni terverifikasi yang memilih tampil di direktori."}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {baris.map((a) => (
            <Link key={a.id} href={`/direktori/${a.id}`} className="group">
              <Kartu className="flex h-full flex-col p-5 transition-all hover:border-merek-300 hover:shadow-md">
                <div className="flex items-start gap-4">
                  <Avatar nama={a.nama_tampil} url={a.foto_path ? foto.get(a.foto_path) : null} />
                  <div className="min-w-0">
                    <h2 className="font-semibold leading-snug text-slate-900 group-hover:text-merek-700">{a.nama_tampil}</h2>
                    <p className="mt-0.5 text-sm text-slate-500">
                      Angkatan {a.angkatan ?? "—"}{a.tahun_lulus ? ` · Lulus ${a.tahun_lulus}` : ""}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {a.status_profesi && <Lencana warna="hijau">{LABEL_PROFESI[a.status_profesi]}</Lencana>}
                  {a.spesialisasi && <Lencana warna="biru">{a.spesialisasi}</Lencana>}
                </div>
                <div className="mt-auto space-y-1 pt-4 text-sm text-slate-600">
                  {a.tempat_kerja && <p className="truncate">🏥 {a.tempat_kerja}</p>}
                  {(a.kota_kerja || a.kota) && <p className="truncate">📍 {a.kota_kerja || a.kota}{a.provinsi ? `, ${a.provinsi}` : ""}</p>}
                </div>
              </Kartu>
            </Link>
          ))}
        </div>
      )}

      {jmlHal > 1 && (
        <nav className="mt-10 flex items-center justify-center gap-2" aria-label="Halaman">
          {hal > 1 && <Link href={urlHal(hal - 1)} className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm hover:bg-slate-50">← Sebelumnya</Link>}
          <span className="px-3 text-sm text-slate-600">Halaman {hal} dari {jmlHal}</span>
          {hal < jmlHal && <Link href={urlHal(hal + 1)} className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm hover:bg-slate-50">Berikutnya →</Link>}
        </nav>
      )}

      <p className="mt-10 text-center text-xs leading-relaxed text-slate-400">
        Data direktori hanya untuk keperluan silaturahmi dan rujukan profesional antaralumni.
        Dilarang menyalin, menjual, atau memakainya untuk promosi tanpa izin pemilik data.
      </p>
    </div>
  );
}
