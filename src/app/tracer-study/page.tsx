import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ambilSesi } from "@/lib/sesi";
import { buatKlienServer } from "@/lib/supabase/server";
import { FormTracer } from "./form";
import { JudulHalaman, Pesan } from "@/components/ui/dasar";
import { tanggal } from "@/lib/format";
import type { Tracer } from "@/lib/tipe";

export const metadata: Metadata = { title: "Tracer Study", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function HalamanTracer() {
  const { user, profil } = await ambilSesi();
  if (!user || !profil) redirect("/masuk?lanjut=/tracer-study");

  const supabase = await buatKlienServer();
  const tahun = new Date().getFullYear();
  const { data } = await supabase.from("tracer").select("*")
    .eq("profil_id", user.id).eq("tahun_pengisian", tahun).maybeSingle();
  const jawaban = data as (Tracer & { diperbarui_pada: string }) | null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <JudulHalaman
        atas={`Periode ${tahun}`}
        judul="Tracer Study Alumni"
        deskripsi="Sekitar 7 menit. Jawabanmu membantu FK UMM memperbaiki kurikulum dan menjadi bahan borang akreditasi LAM-PTKes."
      />

      <div className="mb-6 space-y-3">
        {jawaban && (
          <Pesan jenis="sukses" judul="Kamu sudah mengisi tahun ini">
            Terakhir diperbarui {tanggal(jawaban.diperbarui_pada)}. Silakan ubah bila ada yang berubah.
          </Pesan>
        )}
        <Pesan jenis="info">
          <strong>Kerahasiaan:</strong> hasil tracer study hanya dilaporkan dalam bentuk angka gabungan
          (rata-rata dan persentase). Jawaban per orang tidak pernah dipublikasikan.
        </Pesan>
      </div>

      {!profil.tahun_lulus && (
        <div className="mb-6">
          <Pesan jenis="ingat">Tahun lulus belum terisi di profilmu. Lengkapi dulu agar jawabanmu masuk ke kohort yang tepat.</Pesan>
        </div>
      )}

      <FormTracer awal={jawaban} />
    </div>
  );
}
