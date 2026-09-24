"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { TAUTAN_ALUMNI } from "@/lib/navigasi";

/** Tombol "Ruang Alumni" di header desktop, berisi menu khusus alumni terverifikasi. */
export function MenuAlumni() {
  const [buka, setBuka] = useState(false);
  const jalur = usePathname();
  const wadah = useRef<HTMLDivElement>(null);
  const aktif = TAUTAN_ALUMNI.some((t) => jalur.startsWith(t.href));

  useEffect(() => setBuka(false), [jalur]);
  useEffect(() => {
    if (!buka) return;
    const klikLuar = (e: MouseEvent) => { if (!wadah.current?.contains(e.target as Node)) setBuka(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setBuka(false); };
    document.addEventListener("mousedown", klikLuar);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", klikLuar); document.removeEventListener("keydown", esc); };
  }, [buka]);

  return (
    <div ref={wadah} className="relative">
      <button type="button" onClick={() => setBuka((v) => !v)} aria-expanded={buka} aria-haspopup="menu"
        className={`flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
          aktif || buka ? "bg-merek-50 text-merek-800" : "text-merek-700 hover:bg-merek-50"}`}>
        Ruang Alumni
        <svg viewBox="0 0 20 20" className={`size-4 transition-transform ${buka ? "rotate-180" : ""}`} fill="currentColor" aria-hidden>
          <path d="M5.3 7.3a1 1 0 0 1 1.4 0L10 10.6l3.3-3.3a1 1 0 1 1 1.4 1.4l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 0 1 0-1.4Z" />
        </svg>
      </button>

      {buka && (
        <div role="menu" className="absolute left-0 top-full z-50 mt-2 grid w-[36rem] grid-cols-2 gap-0.5 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
          {TAUTAN_ALUMNI.map((t) => (
            <Link key={t.href} href={t.href} role="menuitem"
              className={`flex items-start gap-3 rounded-lg px-3 py-2.5 ${jalur.startsWith(t.href) ? "bg-merek-50" : "hover:bg-slate-50"}`}>
              <span className="text-lg leading-none" aria-hidden>{t.ikon}</span>
              <span>
                <span className="block text-sm font-medium text-slate-900">{t.label}</span>
                <span className="block text-xs text-slate-500">{t.ket}</span>
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
