"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export function MenuSeluler({ tautan }: { tautan: { href: string; label: string }[] }) {
  const [buka, setBuka] = useState(false);
  const jalur = usePathname();

  useEffect(() => setBuka(false), [jalur]);
  useEffect(() => {
    document.body.style.overflow = buka ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [buka]);

  return (
    <>
      <button
        type="button"
        onClick={() => setBuka((v) => !v)}
        aria-expanded={buka}
        aria-label={buka ? "Tutup menu" : "Buka menu"}
        className="grid size-10 place-items-center rounded-lg text-slate-600 hover:bg-slate-100 lg:hidden"
      >
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
          {buka ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
        </svg>
      </button>

      {buka && (
        <div className="fixed inset-x-0 top-16 z-40 max-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-slate-200 bg-white p-4 shadow-lg lg:hidden">
          <nav className="flex flex-col gap-0.5">
            {tautan.map((t) => (
              <Link
                key={t.href}
                href={t.href}
                className={`rounded-lg px-3.5 py-3 text-[15px] font-medium ${
                  jalur === t.href || (t.href !== "/" && jalur.startsWith(t.href))
                    ? "bg-merek-50 text-merek-800"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                {t.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </>
  );
}
