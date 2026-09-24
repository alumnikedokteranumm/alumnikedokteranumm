"use client";

import { useActionState, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { batalAcara, daftarAcara, isiPresensi, kirimEvaluasi, kirimKuis } from "@/actions/webinar";
import { AreaTeks, Isian, Pesan, Tombol } from "@/components/ui/dasar";

function Kirim({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return <Tombol type="submit" disabled={pending}>{pending ? "Mengirim…" : label}</Tombol>;
}

export function TombolDaftar({ acaraId, berbayar }: { acaraId: string; berbayar: boolean }) {
  const [sibuk, mulai] = useTransition();
  const [galat, setGalat] = useState<string | null>(null);
  const router = useRouter();
  return (
    <div>
      <Tombol disabled={sibuk} onClick={() => mulai(async () => {
        setGalat(null);
        const h = await daftarAcara(acaraId);
        if (h.galat) setGalat(h.galat); else router.refresh();
      })}>
        {sibuk ? "Mendaftarkan…" : berbayar ? "Daftar & lanjut ke pembayaran" : "Daftar sekarang"}
      </Tombol>
      {galat && <p className="mt-2 text-sm text-rose-600">{galat}</p>}
    </div>
  );
}

export function TombolBatal({ acaraId }: { acaraId: string }) {
  const [sibuk, mulai] = useTransition();
  const router = useRouter();
  return (
    <button disabled={sibuk} className="text-sm text-slate-400 hover:text-rose-600 disabled:opacity-50"
      onClick={() => {
        if (!confirm("Batalkan pendaftaran kegiatan ini?")) return;
        mulai(async () => { const g = await batalAcara(acaraId); if (g) alert(g); else router.refresh(); });
      }}>
      Batalkan pendaftaran
    </button>
  );
}

export function FormPresensi({ acaraId }: { acaraId: string }) {
  const [hasil, aksi] = useActionState(isiPresensi.bind(null, acaraId), null);
  return (
    <form action={aksi} className="space-y-2">
      {hasil?.galat && <Pesan jenis="galat">{hasil.galat}</Pesan>}
      {hasil?.sukses && <Pesan jenis="sukses">{hasil.sukses}</Pesan>}
      <div className="flex flex-wrap gap-2">
        <Isian name="kode" required autoComplete="off" placeholder="Kode dari panitia" className="max-w-56 font-mono uppercase tracking-widest" />
        <Kirim label="Kirim presensi" />
      </div>
    </form>
  );
}

export function FormKuis({ acaraId, soal, sisa, skorTerakhir }:
  { acaraId: string; soal: { id: string; pertanyaan: string; opsi: string[] }[]; sisa: number; skorTerakhir: number | null }) {
  const [jawaban, setJawaban] = useState<Record<string, number>>({});
  const [sibuk, mulai] = useTransition();
  const [pesan, setPesan] = useState<{ jenis: "galat" | "info"; teks: string } | null>(null);
  const router = useRouter();
  const lengkap = soal.every((s) => jawaban[s.id] !== undefined);

  return (
    <div className="space-y-5">
      <p className="text-sm text-slate-600">
        {soal.length} soal · sisa kesempatan {sisa}×{skorTerakhir !== null ? ` · nilai terbaik sejauh ini ${skorTerakhir}` : ""}
      </p>
      {soal.map((s, i) => (
        <fieldset key={s.id} className="rounded-lg border border-slate-200 p-4">
          <legend className="px-1 text-sm font-medium text-slate-900">{i + 1}. {s.pertanyaan}</legend>
          <div className="mt-2 space-y-1.5">
            {s.opsi.map((o, j) => (
              <label key={j} className="flex cursor-pointer items-start gap-2.5 rounded-md px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-50 has-[:checked]:bg-merek-50">
                <input type="radio" name={s.id} checked={jawaban[s.id] === j} onChange={() => setJawaban((v) => ({ ...v, [s.id]: j }))} className="mt-0.5" />
                <span><span className="font-medium">{String.fromCharCode(65 + j)}.</span> {o}</span>
              </label>
            ))}
          </div>
        </fieldset>
      ))}
      {pesan && <Pesan jenis={pesan.jenis}>{pesan.teks}</Pesan>}
      <Tombol disabled={sibuk || !lengkap} onClick={() => {
        if (!confirm("Kirim jawaban? Setiap pengiriman mengurangi satu kesempatan.")) return;
        mulai(async () => {
          const h = await kirimKuis(acaraId, jawaban);
          if (h.galat) setPesan({ jenis: "galat", teks: h.galat });
          else { setPesan({ jenis: "info", teks: `Nilaimu: ${h.skor}` }); setJawaban({}); router.refresh(); }
        });
      }}>
        {sibuk ? "Menilai…" : lengkap ? "Kirim jawaban" : "Jawab semua soal dulu"}
      </Tombol>
    </div>
  );
}

function Skala({ nama, label }: { nama: string; label: string }) {
  return (
    <fieldset>
      <legend className="mb-1.5 text-sm font-medium text-slate-700">{label}</legend>
      <div className="flex flex-wrap gap-1.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <label key={n} className="grid size-10 cursor-pointer place-items-center rounded-lg border border-slate-300 text-sm font-medium text-slate-600 hover:bg-slate-50 has-[:checked]:border-merek-600 has-[:checked]:bg-merek-700 has-[:checked]:text-white">
            <input type="radio" name={nama} value={n} required className="sr-only" />{n}
          </label>
        ))}
        <span className="ml-2 self-center text-xs text-slate-400">1 = sangat kurang · 5 = sangat baik</span>
      </div>
    </fieldset>
  );
}

export function FormEvaluasi({ acaraId }: { acaraId: string }) {
  const [hasil, aksi] = useActionState(kirimEvaluasi.bind(null, acaraId), null);
  return (
    <form action={aksi} className="space-y-4">
      {hasil?.galat && <Pesan jenis="galat">{hasil.galat}</Pesan>}
      <Skala nama="materi" label="Materi bermanfaat untuk praktik" />
      <Skala nama="narasumber" label="Penyampaian narasumber" />
      <Skala nama="teknis" label="Kelancaran teknis (suara, gambar, jadwal)" />
      <AreaTeks name="saran" placeholder="Saran atau topik yang ingin dibahas berikutnya (opsional)" className="min-h-20" />
      <Kirim label="Kirim evaluasi" />
    </form>
  );
}
