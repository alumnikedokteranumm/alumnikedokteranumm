import type { Metadata } from "next";
import Link from "next/link";
import { buatKlienServer } from "@/lib/supabase/server";
import { ambilSesi, tautanFotoBanyak } from "@/lib/sesi";
import { JudulHalaman, Kosong, Pesan } from "@/components/ui/dasar";
import { FormMentor } from "./form-mentor";
import { KartuPermintaan } from "./kartu-permintaan";
import type { Mentor, PermintaanMentoring } from "@/lib/tipe";

export const metadata: Metadata = { title: "Kotak Mentoring Saya", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function MentoringSaya({ searchParams }: { searchParams: Promise<{ terkirim?: string }> }) {
  const { terkirim } = await searchParams;
  const { user, profil } = await ambilSesi();
  const supabase = await buatKlienServer();
  const [{ data: rpc }, { data: mentor }] = await Promise.all([
    supabase.rpc("permintaan_mentoring_saya"),
    supabase.from("mentor").select("*").eq("profil_id", user!.id).maybeSingle(),
  ]);
  const semua = (rpc ?? []) as PermintaanMentoring[];
  const foto = await tautanFotoBanyak(semua.map((r) => r.lawan_foto));
  const masuk = semua.filter((r) => r.peran === "mentor");
  const keluar = semua.filter((r) => r.peran === "mentee");
  const menungguMasuk = masuk.filter((r) => r.status === "menunggu").length;

  const Daftar = ({ isi, kosong }: { isi: PermintaanMentoring[]; kosong: React.ReactNode }) =>
    isi.length ? (
      <div className="space-y-4">
        {isi.map((r) => <KartuPermintaan key={r.id} r={r} foto={r.lawan_foto ? foto.get(r.lawan_foto) ?? null : null} />)}
      </div>
    ) : <>{kosong}</>;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <Link href="/mentoring" className="text-sm text-slate-500 hover:text-merek-700">← Cari mentor</Link>
      <div className="mt-4">
        <JudulHalaman judul="Kotak Mentoring Saya" deskripsi="Permintaan yang kamu kirim, permintaan yang masuk untukmu sebagai mentor, dan pengaturan profil mentor." />
      </div>

      {terkirim && (
        <div className="mb-6">
          <Pesan jenis="sukses" judul="Permintaan terkirim">
            Mentor akan melihatnya saat membuka halaman ini. Kamu bisa membatalkan selama belum dijawab.
          </Pesan>
        </div>
      )}
      {profil?.visibilitas === "privat" && (
        <div className="mb-6">
          <Pesan jenis="ingat" judul="Profilmu diatur privat">
            Profil privat tidak tampil di daftar mentor. Ubah visibilitas di <Link href="/profil" className="underline">Profil Saya</Link> bila ingin menjadi mentor.
          </Pesan>
        </div>
      )}

      <section className="mb-12">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900">
          Permintaan masuk
          {menungguMasuk > 0 && <span className="rounded-full bg-amber-500 px-2 py-0.5 text-xs font-bold text-white">{menungguMasuk} baru</span>}
        </h2>
        <Daftar isi={masuk} kosong={
          <Kosong judul="Belum ada permintaan masuk"
            pesan={mentor?.aktif ? "Permintaan dari adik tingkat akan muncul di sini." : "Aktifkan profil mentor di bawah supaya alumni lain bisa menghubungimu."} />
        } />
      </section>

      <section className="mb-12">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Permintaan yang saya kirim</h2>
        <Daftar isi={keluar} kosong={
          <Kosong judul="Belum ada" pesan="Cari senior yang sesuai minatmu di halaman Mentoring." />
        } />
      </section>

      <section id="jadi-mentor" className="scroll-mt-24">
        <h2 className="mb-1 text-lg font-semibold text-slate-900">Profil mentor saya</h2>
        <p className="mb-4 text-sm text-slate-500">Luangkan 30 menit sebulan untuk adik tingkat. Kamu yang menentukan topik dan kuotanya.</p>
        <FormMentor awal={(mentor ?? null) as Mentor | null} />
      </section>
    </div>
  );
}
