import { NextResponse, type NextRequest } from "next/server";
import { buatKlienServer } from "@/lib/supabase/server";

/**
 * Pintu unduhan dokumen. Tidak ada tautan permanen ke berkas: setiap klik
 * membuat tautan bertanda tangan yang hangus dalam 60 detik. Siapa yang boleh
 * sudah ditentukan aturan RLS (tabel dokumen + bucket "dokumen"), jadi bila
 * pemanggil bukan alumni terverifikasi, baris dokumennya memang tidak terlihat.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await buatKlienServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL(`/masuk?lanjut=/dokumen`, req.url));
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new NextResponse("Dokumen tidak ditemukan", { status: 404 });

  const { data: d } = await supabase.from("dokumen").select("file_path, nama_file").eq("id", id).maybeSingle();
  if (!d) return new NextResponse("Dokumen tidak ditemukan atau kamu tidak punya akses.", { status: 404 });

  const lihat = req.nextUrl.searchParams.get("lihat") === "1";
  const { data: tanda, error } = await supabase.storage.from("dokumen")
    .createSignedUrl(d.file_path, 60, lihat ? undefined : { download: d.nama_file || true });
  if (error || !tanda) return new NextResponse("Berkas tidak dapat dibuka. Hubungi pengurus.", { status: 500 });

  return NextResponse.redirect(tanda.signedUrl, { headers: { "Cache-Control": "private, no-store" } });
}
