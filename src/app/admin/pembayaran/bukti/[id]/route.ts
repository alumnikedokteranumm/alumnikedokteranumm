import { NextResponse, type NextRequest } from "next/server";
import { buatKlienServer } from "@/lib/supabase/server";

/** Buka bukti transfer lewat tautan bertanda tangan yang hangus dalam 5 menit. */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new NextResponse("Tidak ditemukan", { status: 404 });
  const supabase = await buatKlienServer();
  const { data: b } = await supabase.from("pembayaran").select("bukti_path").eq("id", id).maybeSingle();
  if (!b?.bukti_path) return new NextResponse("Bukti tidak ditemukan atau kamu tidak punya akses.", { status: 404 });
  const { data, error } = await supabase.storage.from("bukti").createSignedUrl(b.bukti_path, 300);
  if (error || !data) return new NextResponse("Bukti tidak dapat dibuka.", { status: 500 });
  return NextResponse.redirect(data.signedUrl, { headers: { "Cache-Control": "private, no-store" } });
}
