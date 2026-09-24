import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { buatKlienServer } from "@/lib/supabase/server";
import { ambilSesi, tautanFoto } from "@/lib/sesi";
import { Avatar } from "@/components/avatar";
import { Kartu, Lencana, Pesan } from "@/components/ui/dasar";
import { LABEL_PROFESI } from "@/lib/konstanta";
import { FormAjukan } from "./form";
import type { KartuMentor } from "@/lib/tipe";

export const metadata: Metadata = { title: "Ajukan Mentoring", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AjukanMentoring({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { profil } = await ambilSesi();
  const supabase = await buatKlienServer();
  const { data } = await supabase.rpc("daftar_mentor", { q: null, f_topik: null });
  const m = ((data ?? []) as KartuMentor[]).find((x) => x.id === id);
  if (!m) notFound();
  const foto = await tautanFoto(m.foto_path);
  const kontakKosong = !profil?.whatsapp && !profil?.no_hp;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <Link href="/mentoring" className="text-sm text-slate-500 hover:text-merek-700">← Semua mentor</Link>
      <h1 className="mt-4 font-serif text-3xl font-bold text-slate-900">Ajak ngobrol</h1>

      <Kartu className="mt-6 flex items-start gap-4 p-5">
        <Avatar nama={m.nama_tampil} url={foto} />
        <div className="min-w-0">
          <p className="font-semibold text-slate-900">{m.nama_tampil}</p>
          <p className="text-sm text-slate-600">{m.spesialisasi || (m.status_profesi ? LABEL_PROFESI[m.status_profesi] : "Dokter")}</p>
          {m.pengantar && <p className="mt-2 text-sm leading-relaxed text-slate-700">“{m.pengantar}”</p>}
          <div className="mt-2 flex flex-wrap gap-1.5">{m.topik.map((t) => <Lencana key={t} warna="biru">{t}</Lencana>)}</div>
        </div>
      </Kartu>

      {kontakKosong && (
        <div className="mt-6">
          <Pesan jenis="ingat" judul="Nomor WhatsApp-mu belum diisi">
            Mentor akan menghubungimu lewat WhatsApp atau email setelah menerima permintaan.
            Lengkapi dulu nomor WhatsApp di <Link href="/profil" className="font-medium underline">Profil Saya</Link>.
          </Pesan>
        </div>
      )}

      <div className="mt-6">
        <FormAjukan mentorId={m.id} topik={m.topik} />
      </div>
    </div>
  );
}
