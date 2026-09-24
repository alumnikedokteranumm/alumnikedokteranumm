"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { ajukanMentoring } from "@/actions/mentoring";
import { AreaTeks, Bidang, Kartu, Pesan, Pilihan, Tombol } from "@/components/ui/dasar";

function Kirim() {
  const { pending } = useFormStatus();
  return <Tombol type="submit" disabled={pending} className="px-6">{pending ? "Mengirim…" : "Kirim permintaan"}</Tombol>;
}

export function FormAjukan({ mentorId, topik }: { mentorId: string; topik: string[] }) {
  const [hasil, aksi] = useActionState(ajukanMentoring.bind(null, mentorId), null);

  return (
    <form action={aksi} className="space-y-5">
      {hasil?.galat && <Pesan jenis="galat">{hasil.galat}</Pesan>}
      <Kartu className="space-y-5 p-6">
        <Bidang label="Jenis sesi" grup>
          <div className="grid gap-2 sm:grid-cols-2">
            {[
              ["flash", "⚡ Obrolan kilat", "Sekali ngobrol ±30 menit untuk satu pertanyaan spesifik."],
              ["berkelanjutan", "🌱 Pendampingan", "Beberapa kali bertemu, mis. selama persiapan seleksi PPDS."],
            ].map(([nilai, judul, ket], i) => (
              <label key={nilai} className="flex cursor-pointer gap-3 rounded-lg border border-slate-200 p-3.5 has-[:checked]:border-merek-400 has-[:checked]:bg-merek-50/60">
                <input type="radio" name="jenis" value={nilai} defaultChecked={i === 0} className="mt-1" />
                <span><span className="block text-sm font-medium text-slate-900">{judul}</span><span className="block text-xs text-slate-500">{ket}</span></span>
              </label>
            ))}
          </div>
        </Bidang>
        <Bidang label="Topik" wajib>
          <Pilihan name="topik" defaultValue={topik[0]}>
            {topik.map((t) => <option key={t}>{t}</option>)}
            <option>Lainnya</option>
          </Pilihan>
        </Bidang>
        <Bidang label="Ceritakan kebutuhanmu" wajib
          petunjuk="Contoh: “Saya dokter internsip tahun 2025, tertarik Sp.PD. Ingin tahu gambaran seleksi di UB dan UNAIR, serta cara menyiapkan portofolio.” Minimal 30 karakter.">
          <AreaTeks name="pesan" required minLength={30} maxLength={2000} className="min-h-36" />
        </Bidang>
      </Kartu>
      <Pesan jenis="info">
        Bila mentor menerima, <strong>nomor WhatsApp dan email di profilmu akan terlihat oleh mentor ini</strong> (dan kontaknya terlihat olehmu) —
        hanya untuk kalian berdua. Isi percakapan tidak bisa dibaca pengurus.
      </Pesan>
      <div className="flex justify-end"><Kirim /></div>
    </form>
  );
}
