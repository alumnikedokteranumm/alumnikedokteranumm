"use client";

import { Tombol } from "@/components/ui/dasar";

export default function Galat({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <p className="text-5xl">⚠️</p>
      <h1 className="mt-4 font-serif text-2xl font-bold text-slate-900">Terjadi kendala</h1>
      <p className="mt-3 text-slate-600">{error.message || "Sesuatu tidak berjalan semestinya. Silakan coba lagi."}</p>
      {error.digest && <p className="mt-2 font-mono text-xs text-slate-400">Kode: {error.digest}</p>}
      <Tombol onClick={reset} className="mt-8">Coba lagi</Tombol>
    </div>
  );
}
