import type { Metadata } from "next";
import { buatKlienServer } from "@/lib/supabase/server";
import { kelompokkan } from "@/lib/pengurus";
import { KelolaStruktur } from "./kelola";
import type { Pengurus } from "@/lib/tipe";

export const metadata: Metadata = { title: "Struktur Pengurus" };
export const dynamic = "force-dynamic";

export default async function HalamanPengurus() {
  const supabase = await buatKlienServer();
  const { data } = await supabase.from("pengurus").select("*").order("urutan", { nullsFirst: false }).order("nama");
  const daftar = (data ?? []) as Pengurus[];
  const periode = daftar.find((o) => o.periode)?.periode ?? "";
  return <KelolaStruktur k={kelompokkan(daftar)} jumlah={daftar.length} periode={periode} />;
}
