/** Ubah array objek menjadi CSV yang langsung terbaca rapi di Excel (UTF-8 + BOM, pemisah ;). */
export function keCsv(baris: Record<string, unknown>[], kolom: { kunci: string; judul: string }[]) {
  const sel = (v: unknown) => {
    if (v === null || v === undefined) return "";
    let s = String(v);
    // Cegah "CSV injection": sel yang diawali = + - @ bisa dieksekusi sebagai rumus di Excel
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
    return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const kepala = kolom.map((k) => sel(k.judul)).join(";");
  const isi = baris.map((b) => kolom.map((k) => sel(b[k.kunci])).join(";"));
  return "﻿" + [kepala, ...isi].join("\r\n");
}

export function responsCsv(csv: string, namaBerkas: string) {
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${namaBerkas}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
