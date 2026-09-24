const ZONA = "Asia/Jakarta";

export function tanggal(nilai: string | Date | null | undefined) {
  if (!nilai) return "—";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric", month: "long", year: "numeric", timeZone: ZONA,
  }).format(new Date(nilai));
}

export function tanggalSingkat(nilai: string | Date | null | undefined) {
  if (!nilai) return "—";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric", month: "short", year: "numeric", timeZone: ZONA,
  }).format(new Date(nilai));
}

export function tanggalJam(nilai: string | Date | null | undefined) {
  if (!nilai) return "—";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit", timeZone: ZONA,
  }).format(new Date(nilai)) + " WIB";
}

export function rupiah(nilai: number | null | undefined) {
  if (nilai == null) return "—";
  return new Intl.NumberFormat("id-ID", {
    style: "currency", currency: "IDR", maximumFractionDigits: 0,
  }).format(nilai);
}

export function angka(nilai: number | null | undefined) {
  if (nilai == null) return "0";
  return new Intl.NumberFormat("id-ID").format(nilai);
}

/** "2 hari lagi" / "3 hari yang lalu" */
export function waktuRelatif(nilai: string | Date | null | undefined) {
  if (!nilai) return "—";
  const selisih = new Date(nilai).getTime() - Date.now();
  const hari = Math.round(selisih / 86_400_000);
  const rtf = new Intl.RelativeTimeFormat("id-ID", { numeric: "auto" });
  if (Math.abs(hari) >= 30) return rtf.format(Math.round(hari / 30), "month");
  if (Math.abs(hari) >= 1) return rtf.format(hari, "day");
  return rtf.format(Math.round(selisih / 3_600_000), "hour");
}

export function inisial(nama: string) {
  return nama
    .replace(/^(dr|drg|prof|Sp|M)\.?\s*/gi, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((k) => k[0]?.toUpperCase() ?? "")
    .join("");
}

export function keSlug(teks: string) {
  return teks
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** Warna latar avatar yang stabil untuk nama yang sama. */
export function warnaAvatar(kunci: string) {
  const palet = [
    "bg-emerald-100 text-emerald-700", "bg-sky-100 text-sky-700",
    "bg-amber-100 text-amber-700", "bg-rose-100 text-rose-700",
    "bg-violet-100 text-violet-700", "bg-teal-100 text-teal-700",
  ];
  let jml = 0;
  for (const huruf of kunci) jml = (jml + huruf.charCodeAt(0)) % 997;
  return palet[jml % palet.length];
}
