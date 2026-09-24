import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

function gabung(...kelas: (string | false | null | undefined)[]) {
  return kelas.filter(Boolean).join(" ");
}

/* ------------------------------------------------------------------ Tombol */
type VarianTombol = "utama" | "kedua" | "garis" | "halus" | "bahaya";
const GAYA_TOMBOL: Record<VarianTombol, string> = {
  utama:  "bg-merek-700 text-white hover:bg-merek-800 shadow-sm",
  kedua:  "bg-emas-400 text-merek-950 font-semibold hover:bg-emas-300 shadow-sm",
  garis:  "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
  halus:  "bg-merek-50 text-merek-800 hover:bg-merek-100",
  bahaya: "bg-rose-600 text-white hover:bg-rose-700",
};
const DASAR_TOMBOL =
  "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium " +
  "transition-colors disabled:cursor-not-allowed disabled:opacity-55";

export function Tombol({
  varian = "utama", className, ...sisa
}: ComponentProps<"button"> & { varian?: VarianTombol }) {
  return <button className={gabung(DASAR_TOMBOL, GAYA_TOMBOL[varian], className)} {...sisa} />;
}

export function TautanTombol({
  varian = "utama", className, ...sisa
}: ComponentProps<typeof Link> & { varian?: VarianTombol }) {
  return <Link className={gabung(DASAR_TOMBOL, GAYA_TOMBOL[varian], className)} {...sisa} />;
}

/* -------------------------------------------------------------- Kartu & dll */
export function Kartu({ className, ...sisa }: ComponentProps<"div">) {
  return <div className={gabung("rounded-xl border border-slate-200 bg-white", className)} {...sisa} />;
}

export function Lencana({
  warna = "netral", className, ...sisa
}: ComponentProps<"span"> & { warna?: "netral" | "hijau" | "emas" | "biru" | "merah" }) {
  const palet = {
    netral: "bg-slate-100 text-slate-600",
    hijau:  "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
    emas:   "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
    biru:   "bg-sky-50 text-sky-700 ring-1 ring-sky-200",
    merah:  "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
  }[warna];
  return <span className={gabung("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium", palet, className)} {...sisa} />;
}

/* ------------------------------------------------------------ Isian formulir */
const DASAR_ISIAN =
  "w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 " +
  "placeholder:text-slate-400 focus:border-merek-500 focus:ring-2 focus:ring-merek-100 " +
  "disabled:bg-slate-50 disabled:text-slate-500";

export function Isian({ className, ...sisa }: ComponentProps<"input">) {
  return <input className={gabung(DASAR_ISIAN, className)} {...sisa} />;
}
export function AreaTeks({ className, ...sisa }: ComponentProps<"textarea">) {
  return <textarea className={gabung(DASAR_ISIAN, "min-h-28 resize-y", className)} {...sisa} />;
}
export function Pilihan({ className, ...sisa }: ComponentProps<"select">) {
  return <select className={gabung(DASAR_ISIAN, "pr-9", className)} {...sisa} />;
}

/**
 * Label + isian. Pakai `grup` bila isinya berisi beberapa kontrol (radio, tombol,
 * unggah gambar) — dirender sebagai <fieldset> supaya tidak ada <label> bersarang.
 */
export function Bidang({
  label, petunjuk, wajib, grup, children,
}: { label: string; petunjuk?: string; wajib?: boolean; grup?: boolean; children: ReactNode }) {
  const judul = (
    <>
      {label}{wajib && <span className="ml-0.5 text-rose-500">*</span>}
    </>
  );
  const ket = petunjuk && <span className="mt-1.5 block text-xs leading-relaxed text-slate-500">{petunjuk}</span>;

  if (grup) {
    return (
      <fieldset className="block min-w-0">
        <legend className="mb-1.5 block text-sm font-medium text-slate-700">{judul}</legend>
        {children}
        {ket}
      </fieldset>
    );
  }
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">{judul}</span>
      {children}
      {ket}
    </label>
  );
}

export function Sakelar({
  label, petunjuk, ...sisa
}: ComponentProps<"input"> & { label: string; petunjuk?: string }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-3.5 transition-colors hover:bg-slate-50 has-[:checked]:border-merek-300 has-[:checked]:bg-merek-50/50">
      <input type="checkbox" className="mt-0.5 size-4 shrink-0 rounded border-slate-300 text-merek-600 focus:ring-merek-500" {...sisa} />
      <span className="min-w-0">
        <span className="block text-sm font-medium text-slate-800">{label}</span>
        {petunjuk && <span className="mt-0.5 block text-xs leading-relaxed text-slate-500">{petunjuk}</span>}
      </span>
    </label>
  );
}

/* ------------------------------------------------------------------ Pesan */
export function Pesan({
  jenis = "info", judul, children,
}: { jenis?: "info" | "sukses" | "galat" | "ingat"; judul?: string; children: ReactNode }) {
  const palet = {
    info:   "border-sky-200 bg-sky-50 text-sky-900",
    sukses: "border-emerald-200 bg-emerald-50 text-emerald-900",
    galat:  "border-rose-200 bg-rose-50 text-rose-900",
    ingat:  "border-amber-200 bg-amber-50 text-amber-900",
  }[jenis];
  return (
    <div className={gabung("rounded-lg border px-4 py-3 text-sm", palet)} role={jenis === "galat" ? "alert" : undefined}>
      {judul && <p className="mb-0.5 font-semibold">{judul}</p>}
      <div className="leading-relaxed">{children}</div>
    </div>
  );
}

export function Kosong({ judul, pesan, aksi }: { judul: string; pesan: string; aksi?: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white/60 px-6 py-14 text-center">
      <p className="text-base font-semibold text-slate-700">{judul}</p>
      <p className="mx-auto mt-1.5 max-w-md text-sm leading-relaxed text-slate-500">{pesan}</p>
      {aksi && <div className="mt-5">{aksi}</div>}
    </div>
  );
}

export function JudulHalaman({
  atas, judul, deskripsi, aksi,
}: { atas?: string; judul: string; deskripsi?: string; aksi?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-6">
      <div className="max-w-2xl">
        {atas && <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-merek-600">{atas}</p>}
        <h1 className="font-serif text-3xl font-bold tracking-tight text-slate-900">{judul}</h1>
        {deskripsi && <p className="mt-2.5 text-[15px] leading-relaxed text-slate-600">{deskripsi}</p>}
      </div>
      {aksi}
    </div>
  );
}
