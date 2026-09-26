"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { gantiNamaDivisi, hapusOrang, simpanOrang, simpanPeriode, simpanUrutan } from "@/actions/pengurus";
import { Avatar } from "@/components/avatar";
import { IsianFotoBulat } from "@/components/unggah-foto-bulat";
import { Isian, Pesan, Pilihan, Tombol } from "@/components/ui/dasar";
import { namaDivisi, urutanTampil, type Kelompok } from "@/lib/pengurus";
import type { Pengurus } from "@/lib/tipe";

/* ------------------------------------------------------------ jenis kelompok */
type Jenis =
  | { tipe: "pembina" } | { tipe: "dewan" } | { tipe: "harian" } | { tipe: "lainnya" }
  | { tipe: "divisi"; nama: string };

const SARAN: Record<string, string[]> = {
  pembina: ["Pelindung", "Penanggungjawab", "Penasihat"],
  harian: ["Ketua Umum", "Wakil Ketua Umum", "Sekretaris 1", "Sekretaris 2", "Bendahara 1", "Bendahara 2"],
};

/* ------------------------------------------------------------------ formulir */
function Simpan({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return <Tombol type="submit" disabled={pending} className="py-2">{pending ? "Menyimpan…" : label}</Tombol>;
}

function FormOrang({ jenis, awal, tutup }: { jenis: Jenis; awal?: Pengurus; tutup: () => void }) {
  const [hasil, aksi] = useActionState(simpanOrang.bind(null, awal?.id ?? null), null);
  const ketuaAwal = awal ? /^(ketua|koordinator)\s/i.test(awal.jabatan) : false;
  const [peran, setPeran] = useState(ketuaAwal ? "ketua" : "anggota");
  const [jabatan, setJabatan] = useState(awal?.jabatan ?? (jenis.tipe === "dewan" ? "Dewan Konsultatif" : ""));
  useEffect(() => { if (hasil?.sukses) tutup(); }, [hasil, tutup]);

  const jabatanAkhir = jenis.tipe === "divisi" ? (peran === "ketua" ? `Ketua ${jenis.nama}` : jenis.nama) : jabatan;
  const idDaftar = `saran-${jenis.tipe}`;

  return (
    <form action={aksi} className="space-y-3 border-t border-merek-100 bg-merek-50/50 px-4 py-4">
      {hasil?.galat && <Pesan jenis="galat">{hasil.galat}</Pesan>}
      <input type="hidden" name="jabatan" value={jabatanAkhir} />
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">Nama lengkap dan gelar</span>
          <Isian name="nama" defaultValue={awal?.nama} required autoFocus placeholder="dr. Zainal Ulu, MMRS" />
        </label>
        {jenis.tipe === "divisi" ? (
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Peran di {jenis.nama}</span>
            <Pilihan value={peran} onChange={(e) => setPeran(e.target.value)}>
              <option value="anggota">Anggota</option>
              <option value="ketua">Ketua Divisi</option>
            </Pilihan>
          </label>
        ) : jenis.tipe === "dewan" ? (
          <p className="self-end pb-2.5 text-sm text-slate-500">Jabatan: Dewan Konsultatif</p>
        ) : (
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Jabatan</span>
            <Isian value={jabatan} onChange={(e) => setJabatan(e.target.value)} list={SARAN[jenis.tipe] ? idDaftar : undefined}
              required placeholder={SARAN[jenis.tipe]?.[0] ?? "Tulis jabatan"} />
            {SARAN[jenis.tipe] && <datalist id={idDaftar}>{SARAN[jenis.tipe].map((s) => <option key={s} value={s} />)}</datalist>}
          </label>
        )}
      </div>
      <fieldset className="text-sm">
        <legend className="mb-1 font-medium text-slate-700">Foto (opsional)</legend>
        <IsianFotoBulat nama="foto_url" awal={awal?.foto_url ?? null} folder="pengurus" />
      </fieldset>
      <div className="flex gap-2">
        <Simpan label={awal ? "Simpan perubahan" : "Tambahkan"} />
        <button type="button" onClick={tutup} className="rounded-lg px-3 py-2 text-sm text-slate-500 hover:bg-slate-100">Batal</button>
      </div>
    </form>
  );
}

/* ---------------------------------------------------------------- tombol ikon */
function Ikon({ label, onClick, disabled, children, bahaya }:
  { label: string; onClick: () => void; disabled?: boolean; children: React.ReactNode; bahaya?: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} aria-label={label} title={label}
      className={`grid size-8 place-items-center rounded-md text-slate-400 disabled:opacity-25 ${bahaya ? "hover:bg-rose-50 hover:text-rose-600" : "hover:bg-slate-100 hover:text-slate-700"}`}>
      {children}
    </button>
  );
}
const Panah = ({ atas }: { atas?: boolean }) => (
  <svg viewBox="0 0 20 20" className="size-4" fill="currentColor" aria-hidden><path d={atas ? "M10 4l5 6h-3.5v6h-3v-6H5z" : "M10 16l-5-6h3.5V4h3v6H15z"} /></svg>
);

/* ============================================================== komponen utama */
export function KelolaStruktur({ k, jumlah, periode }: { k: Kelompok; jumlah: number; periode: string }) {
  const [sibuk, mulai] = useTransition();
  const [galat, setGalat] = useState<string | null>(null);
  const [buka, setBuka] = useState<string | null>(null); // "tambah:<kunci>" | "ubah:<id>"
  const [divisiBaru, setDivisiBaru] = useState("");
  const [namaDivBaru, setNamaDivBaru] = useState<string | null>(null);
  const [ubahDiv, setUbahDiv] = useState<{ lama: string; baru: string } | null>(null);
  const [periodeIsi, setPeriodeIsi] = useState<string | null>(null);

  const jalankan = (kerja: () => Promise<string | null>) =>
    mulai(async () => { setGalat(null); const g = await kerja(); if (g) setGalat(g); });

  /** Geser item di dalam satu daftar (a↔b), lalu simpan urutan seluruhnya. */
  const geser = (daftar: Pengurus[], i: number, arah: -1 | 1) => {
    const j = i + arah;
    if (j < 0 || j >= daftar.length) return;
    const baru = structuredClone(k);
    // tukar posisi kedua orang di salinan struktur (dicari berdasarkan id)
    const ganti = (arr: Pengurus[]) => {
      const x = arr.findIndex((o) => o.id === daftar[i].id), y = arr.findIndex((o) => o.id === daftar[j].id);
      if (x >= 0 && y >= 0) [arr[x], arr[y]] = [arr[y], arr[x]];
    };
    [baru.pembina, baru.dewan, baru.harian, baru.lainnya, ...baru.divisi.flatMap((d) => [d.ketua, d.anggota])].forEach(ganti);
    jalankan(() => simpanUrutan(urutanTampil(baru)));
  };

  const geserDivisi = (i: number, arah: -1 | 1) => {
    const j = i + arah;
    if (j < 0 || j >= k.divisi.length) return;
    const baru = structuredClone(k);
    [baru.divisi[i], baru.divisi[j]] = [baru.divisi[j], baru.divisi[i]];
    jalankan(() => simpanUrutan(urutanTampil(baru)));
  };

  // Dipanggil sebagai fungsi biasa (bukan <Baris />): komponen yang didefinisikan di dalam
  // komponen lain akan dipasang ulang setiap render dan mengosongkan formulir yang sedang diisi.
  const baris = ({ o, daftar, i, jenis, lencana }:
    { o: Pengurus; daftar: Pengurus[]; i: number; jenis: Jenis; lencana?: string }) => (
    <li key={o.id} className="border-b border-slate-100 last:border-0">
      <div className="flex items-center gap-3 px-4 py-2.5">
        <Avatar nama={o.nama} url={o.foto_url} ukuran="size-9" teks="text-xs" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-slate-900">{o.nama}</p>
          {/* jabatan di bawah nama; bila sudah tampil sebagai lencana, hanya di layar HP */}
          {jenis.tipe !== "divisi" && jenis.tipe !== "dewan" && (
            <p className={`text-xs text-slate-500 ${lencana ? "sm:hidden" : ""}`}>{o.jabatan}</p>
          )}
        </div>
        {lencana && <span className="hidden rounded-full bg-merek-50 px-2 py-0.5 text-xs font-medium text-merek-700 sm:inline">{lencana}</span>}
        <div className="flex shrink-0">
          <Ikon label="Naikkan" disabled={sibuk || i === 0} onClick={() => geser(daftar, i, -1)}><Panah atas /></Ikon>
          <Ikon label="Turunkan" disabled={sibuk || i === daftar.length - 1} onClick={() => geser(daftar, i, 1)}><Panah /></Ikon>
          <Ikon label="Ubah" onClick={() => setBuka(buka === `ubah:${o.id}` ? null : `ubah:${o.id}`)}>
            <svg viewBox="0 0 20 20" className="size-4" fill="currentColor" aria-hidden><path d="M13.6 3.6a2 2 0 0 1 2.8 2.8l-8.5 8.5-3.6.8.8-3.6 8.5-8.5Z" /></svg>
          </Ikon>
          <Ikon label="Hapus" bahaya disabled={sibuk}
            onClick={() => { if (confirm(`Hapus ${o.nama} dari struktur pengurus?`)) jalankan(() => hapusOrang(o.id)); }}>
            <svg viewBox="0 0 20 20" className="size-4" fill="currentColor" aria-hidden><path d="M8 3h4l1 1h3v2H4V4h3l1-1Zm-2 4h8l-.6 9.2a1 1 0 0 1-1 .8H7.6a1 1 0 0 1-1-.8L6 7Z" /></svg>
          </Ikon>
        </div>
      </div>
      {buka === `ubah:${o.id}` && <FormOrang jenis={jenis} awal={o} tutup={() => setBuka(null)} />}
    </li>
  );

  const bagian = ({ kunci, judul, jenis, isi, aksiJudul }:
    { kunci: string; judul: string; jenis: Jenis; isi: React.ReactNode; aksiJudul?: React.ReactNode }) => (
    <section key={kunci} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-slate-50 px-4 py-2.5">
        <h2 className="flex-1 font-semibold text-slate-900">{judul}</h2>
        {aksiJudul}
        <button type="button" onClick={() => setBuka(buka === `tambah:${kunci}` ? null : `tambah:${kunci}`)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
          + Tambah{jenis.tipe === "divisi" ? " anggota" : ""}
        </button>
      </div>
      {buka === `tambah:${kunci}` && <FormOrang jenis={jenis} tutup={() => setBuka(null)} />}
      <ul>{isi}</ul>
    </section>
  );

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-slate-900">👥 Struktur Pengurus</h1>
          <p className="mt-1 text-sm text-slate-500">
            {jumlah} pengurus · tampil di halaman <Link href="/tentang#pengurus" target="_blank" className="text-merek-700 hover:underline">Tentang ↗</Link>
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-slate-500">Periode</span>
          {periodeIsi === null ? (
            <button type="button" onClick={() => setPeriodeIsi(periode)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-medium text-slate-800 hover:bg-slate-50">
              {periode || "Belum diisi"} ✎
            </button>
          ) : (
            <>
              <Isian value={periodeIsi} onChange={(e) => setPeriodeIsi(e.target.value)} className="w-36 py-1.5" placeholder="2026–2031" />
              <Tombol className="py-1.5" disabled={sibuk}
                onClick={() => jalankan(async () => { const g = await simpanPeriode(periodeIsi); if (!g) setPeriodeIsi(null); return g; })}>Simpan</Tombol>
            </>
          )}
        </div>
      </div>

      <p className="mt-3 text-sm text-slate-500">
        Atur urutan dengan tombol panah. Urutan di sini sama dengan urutan di halaman Tentang.
      </p>
      {galat && <div className="mt-4"><Pesan jenis="galat">{galat}</Pesan></div>}
      {sibuk && <p className="mt-2 text-sm text-merek-700">Menyimpan…</p>}

      <div className="mt-6 space-y-4">
        {bagian({ kunci: "pembina", judul: "Pelindung & Penanggungjawab", jenis: { tipe: "pembina" },
          isi: k.pembina.map((o, i) => baris({ o, i, daftar: k.pembina, jenis: { tipe: "pembina" } })) })}
        {bagian({ kunci: "dewan", judul: "Dewan Konsultatif", jenis: { tipe: "dewan" },
          isi: k.dewan.map((o, i) => baris({ o, i, daftar: k.dewan, jenis: { tipe: "dewan" } })) })}
        {bagian({ kunci: "harian", judul: "Pengurus Harian", jenis: { tipe: "harian" },
          isi: <>
            {/* Ketua selalu paling atas; panah hanya menggeser wakil, sekretaris, bendahara */}
            {k.ketua && baris({ o: k.ketua, i: 0, daftar: [k.ketua], jenis: { tipe: "harian" }, lencana: k.ketua.jabatan })}
            {k.harian.map((o, i) => baris({ o, i, daftar: k.harian, jenis: { tipe: "harian" }, lencana: o.jabatan }))}
          </> })}
      </div>

      <div className="mt-10 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-serif text-xl font-bold text-slate-900">Divisi</h2>
        {namaDivBaru === null ? (
          <button type="button" onClick={() => setNamaDivBaru("")}
            className="rounded-lg border border-merek-300 bg-merek-50 px-3.5 py-2 text-sm font-medium text-merek-800 hover:bg-merek-100">
            + Divisi baru
          </button>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <Isian autoFocus value={namaDivBaru} onChange={(e) => setNamaDivBaru(e.target.value)} placeholder="Nama divisi, mis. Advokasi" className="w-60 py-2" />
            <Tombol className="py-2" onClick={() => {
              const nama = namaDivisi(namaDivBaru);
              if (!nama) return setGalat("Tulis nama divisinya dulu.");
              if (k.divisi.some((d) => d.nama.toLowerCase() === nama.toLowerCase())) return setGalat(`${nama} sudah ada.`);
              setGalat(null); setDivisiBaru(nama); setNamaDivBaru(null); setBuka("tambah:divisi-baru");
            }}>Lanjut</Tombol>
            <button type="button" onClick={() => setNamaDivBaru(null)} className="px-2 text-sm text-slate-500">Batal</button>
          </div>
        )}
      </div>

      <div className="mt-4 space-y-4">
        {divisiBaru && buka === "tambah:divisi-baru" && (
          <section className="overflow-hidden rounded-xl border-2 border-dashed border-merek-300 bg-white">
            <p className="px-4 pt-3 text-sm text-slate-600">
              <strong>{divisiBaru}</strong> — tambahkan anggota pertamanya. Divisi tersimpan setelah ada anggota.
            </p>
            <FormOrang jenis={{ tipe: "divisi", nama: divisiBaru }} tutup={() => { setBuka(null); setDivisiBaru(""); }} />
          </section>
        )}

        {k.divisi.map((d, di) => {
          const jenis: Jenis = { tipe: "divisi", nama: d.nama };
          return bagian({
            kunci: `div:${d.nama}`, judul: d.nama, jenis,
            aksiJudul: ubahDiv?.lama === d.nama ? (
              <span className="flex w-full items-center gap-2 sm:w-auto">
                <Isian autoFocus value={ubahDiv.baru} onChange={(e) => setUbahDiv({ lama: d.nama, baru: e.target.value })} className="w-56 py-1.5" />
                <Tombol className="py-1.5" disabled={sibuk}
                  onClick={() => jalankan(async () => { const g = await gantiNamaDivisi(d.nama, ubahDiv.baru); if (!g) setUbahDiv(null); return g; })}>Simpan</Tombol>
                <button type="button" onClick={() => setUbahDiv(null)} className="text-sm text-slate-500">Batal</button>
              </span>
            ) : (
              <span className="flex">
                <Ikon label="Ganti nama divisi" onClick={() => setUbahDiv({ lama: d.nama, baru: d.nama })}>
                  <svg viewBox="0 0 20 20" className="size-4" fill="currentColor" aria-hidden><path d="M13.6 3.6a2 2 0 0 1 2.8 2.8l-8.5 8.5-3.6.8.8-3.6 8.5-8.5Z" /></svg>
                </Ikon>
                <Ikon label="Naikkan divisi" disabled={sibuk || di === 0} onClick={() => geserDivisi(di, -1)}><Panah atas /></Ikon>
                <Ikon label="Turunkan divisi" disabled={sibuk || di === k.divisi.length - 1} onClick={() => geserDivisi(di, 1)}><Panah /></Ikon>
              </span>
            ),
            isi: <>
              {d.ketua.map((o, i) => baris({ o, i, daftar: d.ketua, jenis, lencana: "Ketua Divisi" }))}
              {d.anggota.map((o, i) => baris({ o, i, daftar: d.anggota, jenis, lencana: "Anggota" }))}
            </>,
          });
        })}
      </div>

      {k.lainnya.length > 0 && (
        <div className="mt-8">
          {bagian({ kunci: "lainnya", judul: "Pengurus Lainnya", jenis: { tipe: "lainnya" },
            isi: k.lainnya.map((o, i) => baris({ o, i, daftar: k.lainnya, jenis: { tipe: "lainnya" } })) })}
          <p className="mt-2 text-xs text-slate-500">Jabatan di kelompok ini tidak cocok dengan kelompok mana pun. Ubah jabatannya bila perlu.</p>
        </div>
      )}
    </div>
  );
}
