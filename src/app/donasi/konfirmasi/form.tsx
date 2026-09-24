"use client";

import { useActionState, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { kirimPembayaran } from "@/actions/keuangan";
import { buatKlienBrowser } from "@/lib/supabase/client";
import { Bidang, Isian, Kartu, Pesan, Pilihan, Sakelar, Tombol } from "@/components/ui/dasar";
import { TombolSalin } from "@/components/salin";
import { rupiah } from "@/lib/format";

type Program = {
  id: string; judul: string; jenis: "donasi" | "iuran"; nominal_iuran: number | null;
  bank: string | null; no_rekening: string | null; atas_nama: string | null;
};
type AcaraBayar = { id: string; judul: string; biaya: number; bank: string | null; no_rekening: string | null; atas_nama: string | null };

const JENIS_SAH: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "application/pdf": "pdf" };

function Kirim({ siap }: { siap: boolean }) {
  const { pending } = useFormStatus();
  return <Tombol type="submit" disabled={pending || !siap} className="px-6">{pending ? "Mengirim…" : "Kirim konfirmasi"}</Tombol>;
}

export function FormKonfirmasi({ idPengguna, program, programAwal, acara }:
  { idPengguna: string; program: Program[]; programAwal: string | null; acara: AcaraBayar | null }) {
  const [hasil, aksi] = useActionState(kirimPembayaran, null);
  const [pilih, setPilih] = useState(programAwal && program.some((p) => p.id === programAwal) ? programAwal : program[0]?.id ?? "");
  const [bukti, setBukti] = useState<{ path: string; nama: string } | null>(null);
  const [sibuk, setSibuk] = useState(false);
  const [galatUnggah, setGalatUnggah] = useState<string | null>(null);
  const masukan = useRef<HTMLInputElement>(null);

  const p = program.find((x) => x.id === pilih);
  const jenis = acara ? "acara" : p?.jenis ?? "donasi";
  const rek = acara ?? p;
  const tahun = new Date().getFullYear();
  const hariIni = new Date(Date.now() + 7 * 3600_000).toISOString().slice(0, 10);

  const unggah = async (f: File) => {
    setGalatUnggah(null);
    const ext = JENIS_SAH[f.type];
    if (!ext) return setGalatUnggah("Format bukti harus JPG, PNG, WEBP, atau PDF.");
    if (f.size > 5 * 1024 * 1024) return setGalatUnggah("Ukuran bukti maksimal 5 MB.");
    setSibuk(true);
    try {
      const path = `${idPengguna}/${Date.now()}.${ext}`;
      const { error } = await buatKlienBrowser().storage.from("bukti").upload(path, f, { contentType: f.type });
      if (error) throw error;
      setBukti({ path, nama: f.name });
    } catch (e) {
      setGalatUnggah(e instanceof Error ? e.message : "Gagal mengunggah bukti.");
    } finally {
      setSibuk(false);
    }
  };

  return (
    <form action={aksi} className="space-y-5">
      {hasil?.galat && <Pesan jenis="galat">{hasil.galat}</Pesan>}
      <input type="hidden" name="jenis" value={jenis} />
      {acara && <input type="hidden" name="acara_id" value={acara.id} />}
      <input type="hidden" name="bukti_path" value={bukti?.path ?? ""} />

      <Kartu className="space-y-5 p-6">
        {acara ? (
          <div>
            <p className="text-sm text-slate-500">Pembayaran kegiatan</p>
            <p className="font-semibold text-slate-900">{acara.judul}</p>
          </div>
        ) : (
          <Bidang label="Untuk program" wajib>
            <Pilihan name="donasi_id" value={pilih} onChange={(e) => setPilih(e.target.value)}>
              {program.map((x) => <option key={x.id} value={x.id}>{x.judul}{x.jenis === "iuran" ? " (iuran)" : ""}</option>)}
            </Pilihan>
          </Bidang>
        )}

        {rek?.no_rekening && (
          <div className="flex flex-wrap items-center gap-4 rounded-lg bg-slate-50 px-4 py-3">
            <div>
              <p className="text-xs text-slate-500">Transfer ke {rek.bank}</p>
              <p className="font-mono text-lg font-bold tracking-wider text-slate-900">{rek.no_rekening}</p>
              <p className="text-xs text-slate-600">a.n. {rek.atas_nama}</p>
            </div>
            <TombolSalin teks={rek.no_rekening.replace(/\s/g, "")} label="Salin nomor" />
          </div>
        )}

        <div className="grid gap-5 sm:grid-cols-2">
          {jenis === "iuran" && (
            <Bidang label="Iuran untuk tahun" wajib>
              <Pilihan name="tahun_iuran" defaultValue={tahun}>
                {[tahun + 1, tahun, tahun - 1, tahun - 2].map((t) => <option key={t} value={t}>{t}</option>)}
              </Pilihan>
            </Bidang>
          )}
          <Bidang label="Nominal yang ditransfer (Rp)" wajib
            petunjuk={jenis === "iuran" && p?.nominal_iuran ? `Iuran per tahun ${rupiah(p.nominal_iuran)}.` : undefined}>
            <Isian key={`${jenis}-${pilih}`} name="nominal" inputMode="numeric" required
              defaultValue={acara ? acara.biaya || "" : jenis === "iuran" ? p?.nominal_iuran ?? "" : ""} placeholder="150000" />
          </Bidang>
          <Bidang label="Tanggal transfer" wajib>
            <Isian type="date" name="tanggal_transfer" required max={hariIni} defaultValue={hariIni} />
          </Bidang>
          <Bidang label="Bank / dompet digital pengirim"><Isian name="bank_pengirim" placeholder="BSI, BCA, GoPay…" /></Bidang>
          <Bidang label="Nama pemilik rekening pengirim" petunjuk="Bila berbeda dengan namamu, mis. rekening pasangan.">
            <Isian name="atas_nama_pengirim" />
          </Bidang>
          <Bidang label="Catatan"><Isian name="catatan" placeholder="Opsional" /></Bidang>
        </div>

        <Bidang label="Bukti transfer" wajib grup>
          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4">
            <p className="min-w-0 flex-1 text-sm text-slate-600">
              {bukti ? <>✓ <strong>{bukti.nama}</strong> terunggah</> : "Tangkapan layar m-banking atau foto struk (JPG/PNG/PDF, maks. 5 MB)."}
            </p>
            <button type="button" disabled={sibuk} onClick={() => masukan.current?.click()}
              className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">
              {sibuk ? "Mengunggah…" : bukti ? "Ganti" : "Pilih berkas"}
            </button>
          </div>
          {galatUnggah && <p className="mt-2 text-sm text-rose-600">{galatUnggah}</p>}
          <input ref={masukan} type="file" className="hidden" accept={Object.keys(JENIS_SAH).join(",")}
            onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) unggah(f); }} />
        </Bidang>

        {jenis === "donasi" && (
          <Sakelar name="tampilkan_nama" label="Tampilkan nama saya di daftar donatur"
            petunjuk="Hanya nama dan angkatan — nominal tidak pernah ditampilkan. Biarkan kosong untuk berdonasi secara anonim." />
        )}
      </Kartu>

      <p className="text-xs leading-relaxed text-slate-500">
        Bukti transfer disimpan di penyimpanan tertutup dan hanya bisa dibuka olehmu serta pengurus yang memeriksa.
      </p>
      <div className="flex justify-end"><Kirim siap={Boolean(bukti) && !sibuk} /></div>
    </form>
  );
}
