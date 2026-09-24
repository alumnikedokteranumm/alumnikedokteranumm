import { redirect } from "next/navigation";
import { ambilSesi } from "@/lib/sesi";
import { buatKlienServer } from "@/lib/supabase/server";
import { FormPengaturan } from "./form";

export default async function Pengaturan() {
  const { profil } = await ambilSesi();
  if (profil?.peran !== "admin") redirect("/admin");
  const supabase = await buatKlienServer();
  const { data } = await supabase.from("pengaturan").select("*").order("kunci");
  return (
    <div>
      <h1 className="font-serif text-2xl font-bold text-slate-900">Pengaturan Situs</h1>
      <p className="mt-1 text-sm text-slate-500">Teks dan kontak yang tampil di beranda, halaman Tentang, footer, dan Kontak.</p>
      <div className="mt-6"><FormPengaturan baris={data ?? []} /></div>
    </div>
  );
}
