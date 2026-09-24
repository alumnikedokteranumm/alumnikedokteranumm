import { TautanTombol } from "@/components/ui/dasar";

export default function TidakDitemukan() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <p className="font-serif text-7xl font-bold text-merek-200">404</p>
      <h1 className="mt-4 font-serif text-2xl font-bold text-slate-900">Halaman tidak ditemukan</h1>
      <p className="mt-3 text-slate-600">Halaman yang kamu cari mungkin sudah dipindahkan, dihapus, atau alamatnya salah ketik.</p>
      <div className="mt-8 flex justify-center gap-3">
        <TautanTombol href="/">Ke Beranda</TautanTombol>
        <TautanTombol href="/kontak" varian="garis">Laporkan</TautanTombol>
      </div>
    </div>
  );
}
