import type { Metadata } from "next";
import Link from "next/link";
import { buatKlienServer } from "@/lib/supabase/server";
import { ambilSesi, tautanFotoBanyak } from "@/lib/sesi";
import { Avatar } from "@/components/avatar";
import { Isian, JudulHalaman, Kartu, Kosong, Lencana, Pesan, TautanTombol, Tombol } from "@/components/ui/dasar";
import { LABEL_PROFESI, TOPIK_MENTORING } from "@/lib/konstanta";
import type { KartuMentor } from "@/lib/tipe";

export const metadata: Metadata = { title: "Mentoring Alumni", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function HalamanMentoring({
  searchParams,
}: { searchParams: Promise<{ q?: string; topik?: string }> }) {
  const { q, topik } = await searchParams;
  const { user } = await ambilSesi();
  const supabase = await buatKlienServer();
  const [{ data, error }, { data: sayaMentor }] = await Promise.all([
    supabase.rpc("daftar_mentor", { q: q?.trim() || null, f_topik: topik || null }),
    supabase.from("mentor").select("aktif").eq("profil_id", user!.id).maybeSingle(),
  ]);
  const daftar = (data ?? []) as KartuMentor[];
  const foto = await tautanFotoBanyak(daftar.map((m) => m.foto_path));

  const chip = (aktif: boolean) =>
    `rounded-full px-3 py-1.5 text-sm ${aktif ? "bg-merek-700 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"}`;
  const tautan = (t?: string) => {
    const p = new URLSearchParams();
    if (t) p.set("topik", t);
    if (q) p.set("q", q);
    const qs = p.toString();
    return `/mentoring${qs ? `?${qs}` : ""}`;
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <JudulHalaman
        atas="Khusus alumni terverifikasi"
        judul="Mentoring Alumni"
        deskripsi="Tanya langsung ke senior yang sudah melewati jalannya: memilih spesialisasi, seleksi PPDS, buka praktik, sampai menjaga keseimbangan hidup. Mulai dari obrolan singkat 30 menit."
        aksi={
          <div className="flex flex-wrap gap-2">
            <TautanTombol href="/mentoring/saya" varian="garis">Kotak mentoring saya</TautanTombol>
            <TautanTombol href="/mentoring/saya#jadi-mentor" varian="kedua">
              {sayaMentor?.aktif ? "Atur profil mentor" : "Jadi mentor"}
            </TautanTombol>
          </div>
        }
      />

      <div className="mb-8 grid gap-4 md:grid-cols-3">
        {[
          ["1", "Pilih mentor", "Saring berdasarkan topik atau cari nama dan spesialisasi."],
          ["2", "Kirim permintaan", "Ceritakan singkat kebutuhanmu. Pilih obrolan kilat (±30 menit) atau pendampingan berkelanjutan."],
          ["3", "Terhubung", "Setelah mentor menerima, nomor WhatsApp dan email kalian saling terbuka."],
        ].map(([n, j, t]) => (
          <div key={n} className="flex gap-3 rounded-xl border border-merek-100 bg-merek-50/60 p-4">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-merek-700 text-sm font-bold text-white">{n}</span>
            <div><p className="font-semibold text-slate-900">{j}</p><p className="mt-0.5 text-sm leading-relaxed text-slate-600">{t}</p></div>
          </div>
        ))}
      </div>

      <form className="mb-4 flex flex-wrap gap-2">
        {topik && <input type="hidden" name="topik" value={topik} />}
        <Isian name="q" type="search" defaultValue={q} placeholder="Cari nama, spesialisasi, atau kata kunci…" className="max-w-md" />
        <Tombol type="submit" varian="garis">Cari</Tombol>
      </form>
      <div className="mb-8 flex flex-wrap gap-2">
        <Link href={tautan()} className={chip(!topik)}>Semua topik</Link>
        {TOPIK_MENTORING.map((t) => <Link key={t} href={tautan(t)} className={chip(topik === t)}>{t}</Link>)}
      </div>

      {error ? (
        <Pesan jenis="galat" judul="Data mentor belum bisa dimuat">
          {error.message}. Bila pesan menyebut fungsi tidak ditemukan, pengurus perlu menjalankan berkas
          <code className="mx-1">08_fitur_lanjutan.sql</code> di Supabase.
        </Pesan>
      ) : !daftar.length ? (
        <Kosong
          judul={q || topik ? "Belum ada mentor yang cocok" : "Belum ada mentor"}
          pesan={q || topik ? "Coba topik atau kata kunci lain." : "Jadilah yang pertama! Senior yang bersedia berbagi pengalaman sangat berarti bagi adik tingkat."}
          aksi={<TautanTombol href="/mentoring/saya#jadi-mentor">Daftar jadi mentor</TautanTombol>}
        />
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {daftar.map((m) => {
            const penuh = m.terpakai >= m.kuota_bulanan;
            const diriSendiri = m.id === user?.id;
            return (
              <Kartu key={m.id} className="flex flex-col p-6">
                <div className="flex items-start gap-4">
                  <Avatar nama={m.nama_tampil} url={m.foto_path ? foto.get(m.foto_path) : null} />
                  <div className="min-w-0">
                    <Link href={`/direktori/${m.id}`} className="font-semibold leading-snug text-slate-900 hover:text-merek-700">{m.nama_tampil}</Link>
                    <p className="mt-0.5 text-sm text-slate-600">
                      {m.spesialisasi || (m.status_profesi ? LABEL_PROFESI[m.status_profesi] : "Dokter")}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {[m.angkatan && `Angkatan ${m.angkatan}`, m.tempat_kerja, m.kota].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                </div>
                {m.pengantar && <p className="mt-4 line-clamp-4 text-sm leading-relaxed text-slate-700">“{m.pengantar}”</p>}
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {m.topik.map((t) => <Lencana key={t} warna="biru">{t}</Lencana>)}
                </div>
                <p className="mt-3 text-xs text-slate-500">Via: {m.cara_temu.join(", ") || "—"}</p>
                <div className="mt-auto flex items-center justify-between gap-3 pt-5">
                  <span className={`text-xs ${penuh ? "text-rose-600" : "text-slate-500"}`}>
                    {penuh ? "Kuota bulan ini penuh" : `Sisa kuota bulan ini: ${m.kuota_bulanan - m.terpakai}`}
                  </span>
                  {diriSendiri ? (
                    <Lencana warna="emas">Ini kamu</Lencana>
                  ) : penuh ? (
                    <span className="rounded-lg bg-slate-100 px-3.5 py-2 text-sm text-slate-400">Penuh</span>
                  ) : (
                    <TautanTombol href={`/mentoring/ajukan/${m.id}`} className="py-2">Ajak ngobrol</TautanTombol>
                  )}
                </div>
              </Kartu>
            );
          })}
        </div>
      )}
    </div>
  );
}
