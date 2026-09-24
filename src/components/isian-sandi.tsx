"use client";

import { useState, type ComponentProps } from "react";
import { Isian } from "./ui/dasar";

/** Isian kata sandi dengan tombol mata untuk menampilkan / menyembunyikan isinya. */
export function IsianSandi({ className, ...sisa }: Omit<ComponentProps<"input">, "type">) {
  const [lihat, setLihat] = useState(false);
  return (
    <span className="relative block">
      <Isian {...sisa} type={lihat ? "text" : "password"} className={`pr-11 ${className ?? ""}`} />
      <button type="button" onClick={() => setLihat((v) => !v)}
        aria-label={lihat ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"} aria-pressed={lihat}
        title={lihat ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
        className="absolute inset-y-0 right-0 grid w-11 place-items-center rounded-r-lg text-slate-400 hover:text-slate-700">
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          {lihat ? (
            <>
              <path d="M3 3l18 18" />
              <path d="M10.6 5.1A10.4 10.4 0 0 1 12 5c6.5 0 10 7 10 7a17.6 17.6 0 0 1-3.2 4.1M6.6 6.6C3.9 8.4 2 12 2 12s3.5 7 10 7a9.7 9.7 0 0 0 5.4-1.6" />
              <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
            </>
          ) : (
            <>
              <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
              <circle cx="12" cy="12" r="3" />
            </>
          )}
        </svg>
      </button>
    </span>
  );
}
