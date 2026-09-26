import type { Pengurus } from "./tipe";

/*
 * Pengurus dikelompokkan otomatis dari teks jabatannya, tanpa kolom tambahan:
 *   Pelindung & Penanggungjawab: Pelindung, Penanggung jawab, Pembina, Penasihat
 *   Dewan Konsultatif: jabatan yang mengandung "Dewan"
 *   Pengurus Harian  : Ketua (Umum/AKU), Wakil Ketua, Sekretaris, Bendahara
 *   Divisi           : "Ketua Divisi X" = ketua, "Divisi X" = anggota
 * Urutan di dalam kelompok (dan urutan antardivisi) mengikuti kolom `urutan`.
 */
const PEMBINA = /pelindung|penanggung\s*jawab|pembina|penasi?h?e?at/i;
export const KETUA_UMUM = /^ketua(\s+(umum|aku))?$/i;
const HARIAN = /wakil\s+ketua|sekretaris|bendahara/i;
const DIVISI = /^(ketua|koordinator)?\s*(divisi|bidang)\s+(.+)$/i;

export type Divisi = { nama: string; ketua: Pengurus[]; anggota: Pengurus[] };
export type Kelompok = {
  pembina: Pengurus[]; dewan: Pengurus[]; ketua: Pengurus | null; harian: Pengurus[];
  divisi: Divisi[]; lainnya: Pengurus[];
};

export function kelompokkan(daftar: Pengurus[]): Kelompok {
  const pembina: Pengurus[] = [], dewan: Pengurus[] = [], harian: Pengurus[] = [], lainnya: Pengurus[] = [];
  let ketua: Pengurus | null = null;
  const divisi = new Map<string, Divisi>();

  for (const o of daftar) {
    const j = o.jabatan.trim();
    const d = j.match(DIVISI);
    if (KETUA_UMUM.test(j) && !ketua) ketua = o;
    else if (PEMBINA.test(j)) pembina.push(o);
    else if (/dewan/i.test(j)) dewan.push(o);
    else if (HARIAN.test(j)) harian.push(o);
    else if (d) {
      const kunci = d[3].trim().toLowerCase();
      if (!divisi.has(kunci)) divisi.set(kunci, { nama: `${d[2][0].toUpperCase()}${d[2].slice(1).toLowerCase()} ${d[3].trim()}`, ketua: [], anggota: [] });
      (d[1] ? divisi.get(kunci)!.ketua : divisi.get(kunci)!.anggota).push(o);
    } else lainnya.push(o);
  }
  return { pembina, dewan, ketua, harian, divisi: [...divisi.values()], lainnya };
}

/** Urutan tampil seluruh pengurus, sesuai susunan halaman Tentang. */
export function urutanTampil(k: Kelompok): string[] {
  return [
    ...k.pembina, ...k.dewan, ...(k.ketua ? [k.ketua] : []), ...k.harian,
    ...k.divisi.flatMap((d) => [...d.ketua, ...d.anggota]), ...k.lainnya,
  ].map((o) => o.id);
}

/** "Advokasi" / "divisi advokasi" → "Divisi Advokasi" */
export function namaDivisi(teks: string) {
  const inti = teks.trim().replace(/^(divisi|bidang)\s+/i, "").replace(/\s+/g, " ");
  return inti ? `Divisi ${inti[0].toUpperCase()}${inti.slice(1)}` : "";
}
