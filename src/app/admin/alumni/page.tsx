import Link from "next/link";
import { buatKlienServer } from "@/lib/supabase/server";
import { ambilSesi } from "@/lib/sesi";
import { Isian, Kartu, Kosong, Lencana, Tombol } from "@/components/ui/dasar";
import { AksiAlumni } from "./aksi";
import { LABEL_PROFESI } from "@/lib/konstanta";
import { angka, tanggal, waktuRelatif } from "@/lib/format";
import type { Profil } from "@/lib/tipe";

const PER_HAL = 25;
const TAB = [
  { nilai: "menunggu", label: "Menunggu" },
  { nilai: "terverifikasi", label: "Terverifikasi" },
  { nilai: "ditolak", label: "Ditolak" },
  { nilai: "semua", label: "Semua" },
];

export default async function KelolaAlumni({
  searchParams,
}: { searchParams: Promise<{ status?: string; q?: string; hal?: string }> }) {
  const s = await searchParams;
  const status = s.status ?? "menunggu";
  const hal = Math.max(1, Number(s.hal) || 1);
  const { profil: saya } = await ambilSesi();
  const admin = saya?.peran === "admin";

  const supabase = await buatKlienServer();
  let kueri = supabase.from("profiles").select("*", { count: "exact" })
    .order(status === "menunggu" ? "dibuat_pada" : "nama_lengkap", { ascending: true })
    .range((hal - 1) * PER_HAL, hal * PER_HAL - 1);
  if (status !== "semua") kueri = kueri.eq("status", status);
  if (s.q?.trim()) {
    const q = s.q.trim().replace(/[%,()]/g, " ");
    kueri = kueri.or(`nama_lengkap.ilike.%${q}%,nim.ilike.%${q}%,email_kontak.ilike.%${q}%,tempat_kerja.ilike.%${q}%`);
  }
  const { data, count, error } = await kueri;
  const daftar = (data ?? []) as Profil[];

  // Cocokkan NIM pendaftar dengan arsip lulusan fakultas (bila arsip sudah diisi)
  const nimDaftar = daftar.map((a) => a.nim).filter((n): n is string => Boolean(n));
  const { data: arsip } = nimDaftar.length
    ? await supabase.from("arsip_lulusan").select("nim, nama, angkatan, tahun_lulus").in("nim", nimDaftar)
    : { data: [] };
  const petaArsip = new Map((arsip ?? []).map((x) => [x.nim as string, x]));
  const jmlHal = Math.max(1, Math.ceil((count ?? 0) / PER_HAL));

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-slate-900">Verifikasi & Anggota</h1>
          <p className="mt-1 text-sm text-slate-500">
            Cocokkan NIM, angkatan, dan tahun lulus dengan arsip fakultas sebelum menyetujui.
          </p>
        </div>
        {admin && (
          <a href={`/admin/ekspor/alumni?status=${status}`} className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            ⬇ Ekspor CSV
          </a>
        )}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        {TAB.map((t) => (
          <Link key={t.nilai} href={`/admin/alumni?status=${t.nilai}`}
            className={`rounded-full px-3.5 py-1.5 text-sm ${status === t.nilai ? "bg-merek-700 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"}`}>
            {t.label}
          </Link>
        ))}
        <form className="ml-auto flex gap-2">
          <input type="hidden" name="status" value={status} />
          <Isian name="q" defaultValue={s.q} placeholder="Cari nama / NIM / email" className="w-56 py-2" />
          <Tombol type="submit" varian="garis" className="py-2">Cari</Tombol>
        </form>
      </div>

      <p className="mt-4 text-sm text-slate-500">{angka(count)} data</p>

      {error ? (
        <p className="mt-4 text-sm text-rose-600">{error.message}</p>
      ) : !daftar.length ? (
        <div className="mt-4"><Kosong judul="Tidak ada data" pesan={status === "menunggu" ? "Semua pendaftar sudah ditindaklanjuti. 🎉" : "Tidak ada yang cocok."} /></div>
      ) : (
        <div className="mt-4 space-y-3">
          {daftar.map((a) => (
            <Kartu key={a.id} className="p-5">
              <details className="group">
                <summary className="flex cursor-pointer list-none flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-slate-900">
                        {[a.gelar_depan, a.nama_lengkap || "(belum isi nama)"].filter(Boolean).join(" ")}{a.gelar_belakang ? `, ${a.gelar_belakang}` : ""}
                      </p>
                      <Lencana warna={a.status === "terverifikasi" ? "hijau" : a.status === "ditolak" ? "merah" : "emas"}>{a.status}</Lencana>
                      {a.peran !== "alumni" && a.peran !== "pending" && <Lencana warna="biru">{a.peran}</Lencana>}
                      {a.visibilitas === "privat" && <Lencana>privat</Lencana>}
                      {a.nim && petaArsip.has(a.nim) && (() => {
                        const x = petaArsip.get(a.nim)!;
                        return (
                          <Lencana warna="hijau" title={`Arsip: ${x.nama} · angkatan ${x.angkatan ?? "—"} · lulus ${x.tahun_lulus ?? "—"}`}>
                            ✓ cocok arsip: {x.nama}{x.tahun_lulus ? ` (${x.tahun_lulus})` : ""}
                          </Lencana>
                        );
                      })()}
                    </div>
                    <p className="mt-1 text-sm text-slate-600">
                      NIM <strong>{a.nim || "—"}</strong> · Angkatan <strong>{a.angkatan ?? "—"}</strong> · Lulus <strong>{a.tahun_lulus ?? "—"}</strong>
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400">Daftar {waktuRelatif(a.dibuat_pada)} · {a.email_kontak}</p>
                  </div>
                  <span className="text-xs text-merek-700 group-open:hidden">Lihat detail ▾</span>
                  <span className="hidden text-xs text-merek-700 group-open:inline">Tutup ▴</span>
                </summary>

                <dl className="mt-4 grid gap-x-6 gap-y-2 border-t border-slate-100 pt-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
                  {[
                    ["Jenis kelamin", a.jenis_kelamin === "L" ? "Laki-laki" : a.jenis_kelamin === "P" ? "Perempuan" : "—"],
                    ["TTL", [a.tempat_lahir, a.tanggal_lahir && tanggal(a.tanggal_lahir)].filter(Boolean).join(", ") || "—"],
                    ["No. HP / WA", [a.no_hp, a.whatsapp].filter(Boolean).join(" / ") || "—"],
                    ["Profesi", a.status_profesi ? LABEL_PROFESI[a.status_profesi] : "—"],
                    ["Spesialisasi", a.spesialisasi || "—"],
                    ["Tempat kerja", [a.tempat_kerja, a.kota_kerja].filter(Boolean).join(", ") || "—"],
                    ["Domisili", [a.kota, a.provinsi].filter(Boolean).join(", ") || "—"],
                    ["No. STR", a.no_str || "—"],
                    ["STR berlaku", a.str_berlaku_sampai ? tanggal(a.str_berlaku_sampai) : "—"],
                    ["Persetujuan privasi", a.setuju_kebijakan ? `Ya (${tanggal(a.setuju_pada)})` : "Belum"],
                    ["Diverifikasi", a.diverifikasi_pada ? tanggal(a.diverifikasi_pada) : "—"],
                    ["Catatan admin", a.catatan_admin || "—"],
                  ].map(([k, v]) => (
                    <div key={k}><dt className="text-xs text-slate-400">{k}</dt><dd className="text-slate-700">{v}</dd></div>
                  ))}
                </dl>
              </details>

              {admin && <AksiAlumni id={a.id} nama={a.nama_lengkap} status={a.status} peran={a.peran} diriSendiri={a.id === saya?.id} />}
            </Kartu>
          ))}
        </div>
      )}

      {jmlHal > 1 && (
        <nav className="mt-6 flex items-center justify-center gap-2 text-sm">
          {hal > 1 && <Link href={`/admin/alumni?status=${status}&q=${s.q ?? ""}&hal=${hal - 1}`} className="rounded-lg border px-3 py-1.5 hover:bg-slate-50">←</Link>}
          <span className="text-slate-600">{hal} / {jmlHal}</span>
          {hal < jmlHal && <Link href={`/admin/alumni?status=${status}&q=${s.q ?? ""}&hal=${hal + 1}`} className="rounded-lg border px-3 py-1.5 hover:bg-slate-50">→</Link>}
        </nav>
      )}
    </div>
  );
}
