import { NextResponse, type NextRequest } from "next/server";
import { buatKlienServer } from "@/lib/supabase/server";

/**
 * Tujuan tautan yang dikirim lewat email (konfirmasi akun / atur ulang sandi).
 * Supabase menyertakan "code", lalu kita tukarkan menjadi sesi login.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const lanjutMentah = searchParams.get("lanjut") ?? "/profil";
  const lanjut = lanjutMentah.startsWith("/") ? lanjutMentah : "/profil";

  if (code) {
    const supabase = await buatKlienServer();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${lanjut}`);
  }

  return NextResponse.redirect(`${origin}/masuk?galat=tautan-kedaluwarsa`);
}
