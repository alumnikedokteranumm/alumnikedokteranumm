import { Fragment, type ReactNode } from "react";

/**
 * Perender Markdown sederhana — sengaja ditulis sendiri, bukan memakai pustaka.
 *
 * Alasannya keamanan: fungsi ini TIDAK PERNAH menyisipkan HTML mentah ke halaman
 * (tidak ada dangerouslySetInnerHTML), sehingga tulisan yang diketik pengurus
 * tidak bisa menyisipkan skrip berbahaya. Yang didukung: judul (##, ###),
 * paragraf, daftar berpoin (-), daftar bernomor, **tebal**, *miring*, dan `kode`.
 */

function gaya(teks: string, kunciAwal: string): ReactNode[] {
  const potongan = teks.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  return potongan.filter(Boolean).map((bagian, i) => {
    const k = `${kunciAwal}-${i}`;
    if (bagian.startsWith("**") && bagian.endsWith("**"))
      return <strong key={k} className="font-semibold text-slate-900">{bagian.slice(2, -2)}</strong>;
    if (bagian.startsWith("*") && bagian.endsWith("*") && bagian.length > 2)
      return <em key={k}>{bagian.slice(1, -1)}</em>;
    if (bagian.startsWith("`") && bagian.endsWith("`"))
      return <code key={k} className="rounded bg-slate-100 px-1.5 py-0.5 text-[0.9em] text-slate-800">{bagian.slice(1, -1)}</code>;
    return <Fragment key={k}>{bagian}</Fragment>;
  });
}

export function Markdown({ teks }: { teks: string }) {
  const baris = (teks ?? "").replace(/\r\n/g, "\n").split("\n");
  const keluaran: ReactNode[] = [];
  let daftar: string[] = [];
  let jenisDaftar: "ul" | "ol" | null = null;

  const tutupDaftar = (kunci: string) => {
    if (!daftar.length) return;
    const isi = daftar.map((b, i) => (
      <li key={i} className="leading-relaxed">{gaya(b, `${kunci}-${i}`)}</li>
    ));
    keluaran.push(
      jenisDaftar === "ol" ? (
        <ol key={kunci} className="my-4 list-decimal space-y-1.5 pl-6 text-slate-700">{isi}</ol>
      ) : (
        <ul key={kunci} className="my-4 list-disc space-y-1.5 pl-6 text-slate-700">{isi}</ul>
      ),
    );
    daftar = [];
    jenisDaftar = null;
  };

  baris.forEach((baris_, i) => {
    const b = baris_.trimEnd();
    const kunci = `b${i}`;

    if (/^\s*[-*]\s+/.test(b)) {
      if (jenisDaftar === "ol") tutupDaftar(`${kunci}-x`);
      jenisDaftar = "ul";
      daftar.push(b.replace(/^\s*[-*]\s+/, ""));
      return;
    }
    if (/^\s*\d+[.)]\s+/.test(b)) {
      if (jenisDaftar === "ul") tutupDaftar(`${kunci}-x`);
      jenisDaftar = "ol";
      daftar.push(b.replace(/^\s*\d+[.)]\s+/, ""));
      return;
    }
    tutupDaftar(`l${i}`);

    if (!b.trim()) return;
    if (b.startsWith("#### ")) keluaran.push(<h4 key={kunci} className="mt-6 mb-2 text-base font-semibold text-slate-900">{gaya(b.slice(5), kunci)}</h4>);
    else if (b.startsWith("### ")) keluaran.push(<h3 key={kunci} className="mt-7 mb-2 text-lg font-semibold text-slate-900">{gaya(b.slice(4), kunci)}</h3>);
    else if (b.startsWith("## ")) keluaran.push(<h2 key={kunci} className="mt-8 mb-3 text-xl font-bold text-slate-900">{gaya(b.slice(3), kunci)}</h2>);
    else if (b.startsWith("# ")) keluaran.push(<h2 key={kunci} className="mt-8 mb-3 text-2xl font-bold text-slate-900">{gaya(b.slice(2), kunci)}</h2>);
    else if (b.startsWith("> ")) keluaran.push(
      <blockquote key={kunci} className="my-4 border-l-4 border-emas-400 bg-amber-50/60 py-2 pl-4 text-slate-700 italic">{gaya(b.slice(2), kunci)}</blockquote>);
    else if (/^-{3,}$/.test(b.trim())) keluaran.push(<hr key={kunci} className="my-8 border-slate-200" />);
    else keluaran.push(<p key={kunci} className="my-4 leading-[1.8] text-slate-700">{gaya(b, kunci)}</p>);
  });

  tutupDaftar("akhir");
  return <div className="text-[15px]">{keluaran}</div>;
}
