import Link from "next/link";
import { buatKlienServer } from "@/lib/supabase/server";
import { Kartu, Lencana } from "@/components/ui/dasar";
import { angka, waktuRelatif } from "@/lib/format";

export default async function DasborAdmin() {
  const supabase = await buatKlienServer();
  const tahun = new Date().getFullYear();
  const profil = () => supabase.from("profiles").select("id", { count: "exact", head: true });

  const [menunggu, terverifikasi, ditolak, tracer, berita, acara, lowongan, { data: terbaru }, bayar, { data: mentoring }, peserta] = await Promise.all([
    profil().eq("status", "menunggu"),
    profil().eq("status", "terverifikasi"),
    profil().eq("status", "ditolak"),
    supabase.from("tracer").select("id", { count: "exact", head: true }).eq("tahun_pengisian", tahun),
    supabase.from("berita").select("id", { count: "exact", head: true }),
    supabase.from("acara").select("id", { count: "exact", head: true }).gte("mulai", new Date().toISOString()),
    supabase.from("lowongan").select("id", { count: "exact", head: true }).eq("terbit", true),
    supabase.from("profiles").select("id, nama_lengkap, angkatan, tahun_lulus, nim, status, dibuat_pada")
      .order("dibuat_pada", { ascending: false }).limit(8),
    supabase.from("pembayaran").select("id", { count: "exact", head: true }).eq("status", "menunggu"),
    supabase.rpc("statistik_mentoring"),
    supabase.from("peserta_acara").select("id", { count: "exact", head: true }).not("nomor_sertifikat", "is", null),
  ]);
  const m = (mentoring ?? null) as { mentor_aktif: number; permintaan: number; diterima: number } | null;

  const kartu = [
    { label: "Menunggu verifikasi", nilai: menunggu.count, href: "/admin/alumni?status=menunggu", sorot: (menunggu.count ?? 0) > 0 },
    { label: "Alumni terverifikasi", nilai: terverifikasi.count, href: "/admin/alumni?status=terverifikasi" },
    { label: `Responden tracer ${tahun}`, nilai: tracer.count, href: "/admin/tracer" },
    { label: "Ditolak", nilai: ditolak.count, href: "/admin/alumni?status=ditolak" },
    { label: "Transfer perlu diperiksa", nilai: bayar.count, href: "/admin/pembayaran", sorot: (bayar.count ?? 0) > 0 },
    { label: "Mentor aktif", nilai: m?.mentor_aktif ?? 0, href: "/mentoring" },
    { label: "Sesi mentoring terjalin", nilai: m?.diterima ?? 0, href: "/mentoring" },
    { label: "Sertifikat SKP terbit", nilai: peserta.count, href: "/admin/webinar" },
  ];
  const persenTracer = terverifikasi.count ? Math.round(((tracer.count ?? 0) / terverifikasi.count) * 100) : 0;

  return (
    <div>
      <h1 className="font-serif text-2xl font-bold text-slate-900">Ringkasan</h1>
      <p className="mt-1 text-sm text-slate-500">Kondisi terkini keanggotaan dan konten situs.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kartu.map((k) => (
          <Link key={k.label} href={k.href}>
            <Kartu className={`p-5 transition-all hover:shadow-md ${k.sorot ? "border-amber-300 bg-amber-50" : ""}`}>
              <p className="text-sm text-slate-500">{k.label}</p>
              <p className={`mt-1 font-serif text-3xl font-bold ${k.sorot ? "text-amber-700" : "text-slate-900"}`}>{angka(k.nilai)}</p>
            </Kartu>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Kartu className="p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Pendaftar terbaru</h2>
            <Link href="/admin/alumni" className="text-sm text-merek-700 hover:underline">Semua →</Link>
          </div>
          <ul className="mt-4 divide-y divide-slate-100">
            {(terbaru ?? []).map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-800">{a.nama_lengkap || "(belum isi nama)"}</p>
                  <p className="text-xs text-slate-500">
                    {a.nim ? `NIM ${a.nim} · ` : ""}Angk. {a.angkatan ?? "—"} · daftar {waktuRelatif(a.dibuat_pada)}
                  </p>
                </div>
                <Lencana warna={a.status === "terverifikasi" ? "hijau" : a.status === "ditolak" ? "merah" : "emas"}>{a.status}</Lencana>
              </li>
            ))}
            {!terbaru?.length && <li className="py-6 text-center text-sm text-slate-400">Belum ada pendaftar.</li>}
          </ul>
        </Kartu>

        <div className="space-y-4">
          <Kartu className="p-6">
            <h2 className="font-semibold text-slate-900">Partisipasi tracer study {tahun}</h2>
            <p className="mt-3 font-serif text-4xl font-bold text-merek-800">{persenTracer}%</p>
            <div className="mt-2 h-2 rounded-full bg-slate-100"><div className="h-full rounded-full bg-merek-600" style={{ width: `${persenTracer}%` }} /></div>
            <p className="mt-2 text-xs text-slate-500">{angka(tracer.count)} dari {angka(terverifikasi.count)} alumni terverifikasi. Target LAM-PTKes umumnya ≥ 30–50%.</p>
          </Kartu>

          <Kartu className="p-6">
            <h2 className="font-semibold text-slate-900">Konten</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-slate-500">Berita (semua)</dt><dd className="font-medium">{angka(berita.count)}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Agenda mendatang</dt><dd className="font-medium">{angka(acara.count)}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Lowongan terbit</dt><dd className="font-medium">{angka(lowongan.count)}</dd></div>
            </dl>
          </Kartu>

        </div>
      </div>
    </div>
  );
}
