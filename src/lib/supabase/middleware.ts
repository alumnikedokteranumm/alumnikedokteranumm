import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_ANON, SUPABASE_SIAP, SUPABASE_URL } from "@/lib/konfig";

/** Halaman yang wajib login. */
const BUTUH_LOGIN = [
  "/direktori", "/profil", "/tracer-study", "/video", "/dokumen", "/admin", "/menunggu-verifikasi",
  "/mentoring", "/skp", "/sertifikat", "/pustaka", "/arsip-lulusan", "/laporan-keuangan",
  "/donasi/konfirmasi", "/donasi/saya",
];
/** Halaman yang hanya untuk pengurus/admin. */
const BUTUH_ADMIN = ["/admin"];
/** Halaman yang wajib sudah diverifikasi pengurus. */
const BUTUH_VERIFIKASI = [
  "/direktori", "/tracer-study", "/video", "/dokumen",
  "/mentoring", "/pustaka", "/arsip-lulusan", "/laporan-keuangan",
];
// Catatan: /skp (webinar) sengaja tidak wajib verifikasi — webinar bisa dibuka untuk
// dokter umum non-alumni. Aturan siapa boleh daftar ditegakkan di database per kegiatan.

export async function perbaruiSesi(request: NextRequest) {
  if (!SUPABASE_SIAP) return NextResponse.next({ request });

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    SUPABASE_URL,
    SUPABASE_ANON,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(daftarCookie: { name: string; value: string; options: CookieOptions }[]) {
          daftarCookie.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          daftarCookie.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Jangan disisipi kode apa pun di antara createServerClient dan getUser().
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const jalur = request.nextUrl.pathname;
  const perluLogin = BUTUH_LOGIN.some((p) => jalur.startsWith(p));

  if (perluLogin && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/masuk";
    url.searchParams.set("lanjut", jalur);
    return NextResponse.redirect(url);
  }

  if (user && perluLogin) {
    const { data: profil } = await supabase
      .from("profiles")
      .select("peran, status")
      .eq("id", user.id)
      .maybeSingle();

    const peran = profil?.peran ?? "pending";
    const status = profil?.status ?? "menunggu";
    const terverifikasi = status === "terverifikasi" && peran !== "pending";

    if (BUTUH_ADMIN.some((p) => jalur.startsWith(p)) && !["admin", "pengurus"].includes(peran)) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }

    if (BUTUH_VERIFIKASI.some((p) => jalur.startsWith(p)) && !terverifikasi) {
      const url = request.nextUrl.clone();
      url.pathname = "/menunggu-verifikasi";
      return NextResponse.redirect(url);
    }

    if (jalur === "/menunggu-verifikasi" && terverifikasi) {
      const url = request.nextUrl.clone();
      url.pathname = "/direktori";
      return NextResponse.redirect(url);
    }
  }

  return response;
}
