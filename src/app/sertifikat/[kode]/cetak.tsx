"use client";

import { Tombol } from "@/components/ui/dasar";

export function TombolCetak() {
  return <Tombol varian="kedua" onClick={() => window.print()}>⬇ Unduh PDF / Cetak</Tombol>;
}
