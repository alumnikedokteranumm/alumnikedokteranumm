import { NextResponse } from "next/server";
import { buatKlienServer } from "@/lib/supabase/server";

/** Hak akses data (UU PDP Pasal 7): unduh salinan seluruh data milik sendiri. */
export async function GET() {
  const supabase = await buatKlienServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ galat: "Belum masuk" }, { status: 401 });

  const [{ data: profil }, { data: tracer }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("tracer").select("*").eq("profil_id", user.id),
  ]);

  const isi = {
    diekspor_pada: new Date().toISOString(),
    akun: { id: user.id, email: user.email, dibuat_pada: user.created_at, terakhir_masuk: user.last_sign_in_at },
    profil,
    tracer_study: tracer ?? [],
  };

  return new NextResponse(JSON.stringify(isi, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="data-saya-alumnikedokteranumm.json"`,
      "Cache-Control": "private, no-store",
    },
  });
}
