import Link from "next/link";
import { notFound } from "next/navigation";
import { buatKlienServer } from "@/lib/supabase/server";
import { SKEMA } from "@/lib/skema-konten";
import { EditorKonten } from "./editor";
import { KelolaFoto } from "./kelola-foto";
import { Pesan } from "@/components/ui/dasar";
import type { Foto } from "@/lib/tipe";

export default async function UbahKonten({
  params, searchParams,
}: { params: Promise<{ jenis: string; id: string }>; searchParams: Promise<{ tersimpan?: string }> }) {
  const { jenis, id } = await params;
  const { tersimpan } = await searchParams;
  const skema = SKEMA[jenis];
  if (!skema) notFound();

  const baru = id === "baru";
  let baris: Record<string, unknown> | null = null;
  let foto: Foto[] = [];

  if (!baru) {
    if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
    const supabase = await buatKlienServer();
    const { data } = await supabase.from(skema.tabel).select("*").eq("id", id).maybeSingle();
    if (!data) notFound();
    baris = data;
    if (skema.tabel === "album") {
      const { data: f } = await supabase.from("foto").select("*").eq("album_id", id).order("urutan");
      foto = (f ?? []) as Foto[];
    }
  }

  return (
    <div>
      <Link href={`/admin/konten/${jenis}`} className="text-sm text-slate-500 hover:text-merek-700">← {skema.judul}</Link>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-2xl font-bold text-slate-900">
          {baru ? `Tambah ${skema.tunggal}` : `Ubah ${skema.tunggal}`}
        </h1>
        {!baru && skema.tautanPublik && baris && (
          <a href={skema.tautanPublik(baris)} target="_blank" className="text-sm text-merek-700 hover:underline">Lihat di situs ↗</a>
        )}
      </div>

      <div className="mt-6">
        {skema.tabel === "kas" && baris?.pembayaran_id ? (
          <Pesan jenis="info" judul="Transaksi otomatis">
            Baris ini tercatat otomatis dari konfirmasi transfer yang diterima, jadi tidak bisa diubah di sini.
            Untuk mengoreksi, buka <Link href="/admin/pembayaran?status=diterima" className="underline">Pembayaran</Link> lalu ubah statusnya.
          </Pesan>
        ) : (
          <EditorKonten jenis={jenis} id={baru ? null : id} awal={baris} tersimpan={Boolean(tersimpan)} />
        )}
      </div>

      {skema.tabel === "album" && !baru && (
        <div className="mt-8"><KelolaFoto albumId={id} foto={foto} /></div>
      )}
      {skema.tabel === "album" && baru && (
        <p className="mt-6 text-sm text-slate-500">💡 Simpan album terlebih dahulu, lalu kamu bisa mengunggah foto-fotonya.</p>
      )}
    </div>
  );
}
