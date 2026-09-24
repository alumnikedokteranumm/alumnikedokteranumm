import type { Metadata } from "next";
import { ambilDokumen } from "@/lib/data";
import { Isian, JudulHalaman, Kartu, Kosong, Lencana, Pesan, Tombol } from "@/components/ui/dasar";
import { KATEGORI_DOKUMEN } from "@/lib/konstanta";
import { tanggal } from "@/lib/format";
import type { Dokumen } from "@/lib/tipe";

export const metadata: Metadata = { title: "Dokumen Penting", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

function ukuran(b: number | null) {
  if (!b) return null;
  return b >= 1_048_576 ? `${(b / 1_048_576).toFixed(1).replace(".", ",")} MB` : `${Math.max(1, Math.round(b / 1024))} KB`;
}

function jenisBerkas(nama: string | null) {
  const ext = (nama ?? "").split(".").pop()?.toLowerCase() ?? "";
  if (ext === "pdf") return { label: "PDF", warna: "bg-rose-50 text-rose-700 ring-rose-200", bisaDilihat: true };
  if (["doc", "docx"].includes(ext)) return { label: "DOC", warna: "bg-sky-50 text-sky-700 ring-sky-200", bisaDilihat: false };
  if (["xls", "xlsx"].includes(ext)) return { label: "XLS", warna: "bg-emerald-50 text-emerald-700 ring-emerald-200", bisaDilihat: false };
  if (["ppt", "pptx"].includes(ext)) return { label: "PPT", warna: "bg-orange-50 text-orange-700 ring-orange-200", bisaDilihat: false };
  if (["jpg", "jpeg", "png"].includes(ext)) return { label: "IMG", warna: "bg-violet-50 text-violet-700 ring-violet-200", bisaDilihat: true };
  return { label: "FILE", warna: "bg-slate-100 text-slate-600 ring-slate-200", bisaDilihat: false };
}

function BarisDokumen({ d }: { d: Dokumen }) {
  const jenis = jenisBerkas(d.nama_file);
  const hariIni = new Date().toISOString().slice(0, 10);
  const kedaluwarsa = d.berlaku_sampai && d.berlaku_sampai < hariIni;

  return (
    <li className="flex flex-wrap items-center gap-4 px-5 py-4">
      <span className={`grid size-11 shrink-0 place-items-center rounded-lg text-[11px] font-bold ring-1 ${jenis.warna}`}>{jenis.label}</span>
      <div className="min-w-0 flex-1">
        <p className="font-medium text-slate-900">{d.judul}</p>
        <p className="mt-0.5 text-sm text-slate-500">
          {[d.nomor_dokumen && `No. ${d.nomor_dokumen}`, d.tanggal_dokumen && tanggal(d.tanggal_dokumen), ukuran(d.ukuran_byte)]
            .filter(Boolean).join(" · ")}
        </p>
        {d.deskripsi && <p className="mt-1 text-sm leading-relaxed text-slate-600">{d.deskripsi}</p>}
        {d.berlaku_sampai && (
          <div className="mt-1.5">
            <Lencana warna={kedaluwarsa ? "merah" : "hijau"}>
              {kedaluwarsa ? "Kedaluwarsa" : "Berlaku"} s.d. {tanggal(d.berlaku_sampai)}
            </Lencana>
          </div>
        )}
      </div>
      <div className="flex gap-2">
        {jenis.bisaDilihat && (
          <a href={`/dokumen/${d.id}/unduh?lihat=1`} target="_blank" rel="noopener"
            className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            Lihat
          </a>
        )}
        <a href={`/dokumen/${d.id}/unduh`}
          className="rounded-lg bg-merek-700 px-3.5 py-2 text-sm font-medium text-white hover:bg-merek-800">
          ⬇ Unduh
        </a>
      </div>
    </li>
  );
}

export default async function DaftarDokumen({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const semua = await ambilDokumen();
  const kata = q?.trim().toLowerCase();
  const daftar = kata
    ? semua.filter((d) => `${d.judul} ${d.nomor_dokumen ?? ""} ${d.deskripsi ?? ""} ${d.kategori ?? ""}`.toLowerCase().includes(kata))
    : semua;

  // Kelompokkan per kategori, mengikuti urutan baku lalu kategori lain di belakang
  const urutan = [...KATEGORI_DOKUMEN, ...new Set(daftar.map((d) => d.kategori ?? "Lainnya"))];
  const grup = [...new Set(urutan)]
    .map((k) => ({ kategori: k, isi: daftar.filter((d) => (d.kategori ?? "Lainnya") === k) }))
    .filter((g) => g.isi.length);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <JudulHalaman
        atas="Khusus alumni terverifikasi"
        judul="Dokumen Penting"
        deskripsi="Sertifikat akreditasi, surat keputusan, pedoman, dan formulir resmi yang dapat diunduh alumni."
      />

      <form className="mb-6 flex gap-2">
        <Isian name="q" type="search" defaultValue={q} placeholder="Cari judul, nomor SK, atau kategori…" className="max-w-md" />
        <Tombol type="submit" varian="garis">Cari</Tombol>
      </form>

      {!grup.length ? (
        <Kosong
          judul={semua.length ? "Tidak ada dokumen yang cocok" : "Belum ada dokumen"}
          pesan={semua.length ? "Coba kata kunci lain." : "Dokumen resmi akan diunggah pengurus ke sini."}
        />
      ) : (
        <div className="space-y-8">
          {grup.map((g) => (
            <section key={g.kategori}>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">{g.kategori}</h2>
              <Kartu className="overflow-hidden">
                <ul className="divide-y divide-slate-100">
                  {g.isi.map((d) => <BarisDokumen key={d.id} d={d} />)}
                </ul>
              </Kartu>
            </section>
          ))}
        </div>
      )}

      <div className="mt-10">
        <Pesan jenis="info" judul="Tautan unduhan bersifat sementara">
          Setiap tautan unduhan hanya berlaku 60 detik dan hanya bisa dibuat oleh alumni yang sudah masuk.
          Dokumen ini untuk keperluan alumni — mohon tidak diunggah ulang ke tempat umum.
        </Pesan>
      </div>
    </div>
  );
}
