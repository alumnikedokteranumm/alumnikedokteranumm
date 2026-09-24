import type { Metadata } from "next";
import Link from "next/link";
import { ambilPengaturan } from "@/lib/sesi";

export const metadata: Metadata = {
  title: "Kebijakan Privasi",
  description: "Bagaimana Alumni Kedokteran UMM mengumpulkan, menggunakan, dan melindungi data pribadi alumni.",
};
export const revalidate = 3600;

const BERLAKU = "1 Oktober 2026";

export default async function Privasi() {
  const p = await ambilPengaturan();
  const org = p.nama_organisasi || "Alumni Kedokteran UMM";
  const email = [p.email, p.email_kampus].filter(Boolean).join(" atau ") || "sekretariat";

  const Bab = ({ no, judul, children }: { no: number; judul: string; children: React.ReactNode }) => (
    <section id={`bab-${no}`} className="scroll-mt-24 border-t border-slate-200 pt-8">
      <h2 className="font-serif text-xl font-bold text-slate-900">{no}. {judul}</h2>
      <div className="mt-4 space-y-4 text-[15px] leading-[1.8] text-slate-700">{children}</div>
    </section>
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-merek-600">Dokumen resmi</p>
      <h1 className="mt-2 font-serif text-4xl font-bold text-slate-900">Kebijakan Privasi</h1>
      <p className="mt-3 text-sm text-slate-500">Berlaku sejak {BERLAKU}</p>

      <div className="mt-8 rounded-xl border border-merek-200 bg-merek-50/60 p-6">
        <p className="font-semibold text-merek-900">Ringkasnya</p>
        <ul className="mt-3 space-y-2 text-sm leading-relaxed text-merek-900">
          <li>• Data kamu dipakai untuk <strong>silaturahmi alumni, verifikasi keanggotaan, dan tracer study</strong> — bukan untuk dijual atau iklan.</li>
          <li>• Pengunjung umum <strong>tidak bisa</strong> melihat data pribadi siapa pun. Hanya angka statistik gabungan.</li>
          <li>• <strong>Kamu yang memilih</strong> kontak mana yang terlihat oleh sesama alumni.</li>
          <li>• Nomor STR, SIP, dan tanggal lahir lengkap <strong>tidak pernah</strong> ditampilkan kepada alumni lain.</li>
          <li>• Kamu bisa <strong>mengunduh</strong> seluruh datamu kapan saja, dan <strong>meminta penghapusan</strong> melalui pengurus.</li>
        </ul>
      </div>

      <div className="mt-10 space-y-10">
        <Bab no={1} judul="Siapa kami">
          <p>Kebijakan ini menjelaskan bagaimana <strong>{org}</strong> (&ldquo;kami&rdquo;) selaku <em>pengendali data pribadi</em> memproses data pribadi pengguna portal ini, sesuai Undang-Undang Nomor 27 Tahun 2022 tentang Pelindungan Data Pribadi (&ldquo;UU PDP&rdquo;).</p>
        </Bab>

        <Bab no={2} judul="Data yang kami kumpulkan">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-sm">
              <thead><tr className="border-b border-slate-200 text-left text-slate-500"><th className="py-2 pr-4 font-medium">Jenis</th><th className="py-2 font-medium">Contoh</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                <tr><td className="py-2.5 pr-4 font-medium">Identitas</td><td className="py-2.5">Nama, gelar, NIM, angkatan, tahun lulus, jenis kelamin, tempat & tanggal lahir</td></tr>
                <tr><td className="py-2.5 pr-4 font-medium">Kontak</td><td className="py-2.5">Email, nomor HP/WhatsApp, alamat domisili</td></tr>
                <tr><td className="py-2.5 pr-4 font-medium">Profesi</td><td className="py-2.5">Status profesi, spesialisasi, tempat kerja, jabatan, keanggotaan IDI</td></tr>
                <tr><td className="py-2.5 pr-4 font-medium">Legalitas praktik</td><td className="py-2.5">Nomor STR, masa berlaku STR, nomor SIP <em>(opsional)</em></td></tr>
                <tr><td className="py-2.5 pr-4 font-medium">Tracer study</td><td className="py-2.5">Masa tunggu kerja, jenis instansi, rentang pendapatan, penilaian kompetensi</td></tr>
                <tr><td className="py-2.5 pr-4 font-medium">Teknis</td><td className="py-2.5">Waktu masuk terakhir, cookie sesi login (tanpa pelacak iklan)</td></tr>
              </tbody>
            </table>
          </div>
          <p>Seluruh isian selain nama, email, NIM, angkatan, dan tahun lulus bersifat <strong>sukarela</strong>.</p>
        </Bab>

        <Bab no={3} judul="Untuk apa data digunakan">
          <ul className="list-disc space-y-2 pl-6">
            <li><strong>Verifikasi keanggotaan</strong> — mencocokkan pendaftar dengan arsip lulusan FK UMM.</li>
            <li><strong>Direktori alumni</strong> — memungkinkan sesama alumni terverifikasi saling menemukan dan merujuk.</li>
            <li><strong>Tracer study</strong> — dilaporkan kepada fakultas dalam bentuk agregat untuk akreditasi dan evaluasi kurikulum.</li>
            <li><strong>Komunikasi organisasi</strong> — undangan kegiatan, pengumuman, dan informasi iuran.</li>
            <li><strong>Statistik publik</strong> — jumlah alumni per provinsi/profesi, tanpa identitas, dan kelompok di bawah 3 orang disembunyikan.</li>
          </ul>
          <p>Dasar pemrosesan adalah <strong>persetujuan</strong> yang kamu berikan saat mendaftar (Pasal 20 ayat 2 huruf a UU PDP).</p>
        </Bab>

        <Bab no={4} judul="Siapa yang dapat melihat data kamu">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-sm">
              <thead><tr className="border-b border-slate-200 text-left text-slate-500"><th className="py-2 pr-4 font-medium">Pihak</th><th className="py-2 font-medium">Yang dapat dilihat</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                <tr><td className="py-2.5 pr-4 font-medium">Pengunjung umum</td><td className="py-2.5">Tidak ada data pribadi. Hanya angka statistik gabungan.</td></tr>
                <tr><td className="py-2.5 pr-4 font-medium">Alumni terverifikasi</td><td className="py-2.5">Nama, angkatan, profesi, kota — serta kontak dan tempat kerja <em>hanya jika kamu izinkan</em>.</td></tr>
                <tr><td className="py-2.5 pr-4 font-medium">Pengurus / admin</td><td className="py-2.5">Seluruh data profil, untuk verifikasi dan administrasi. Setiap verifikasi, perubahan peran, dan ekspor data tercatat di jejak audit.</td></tr>
                <tr><td className="py-2.5 pr-4 font-medium">Fakultas Kedokteran UMM</td><td className="py-2.5">Rekap tracer study dalam bentuk agregat.</td></tr>
              </tbody>
            </table>
          </div>
          <p>Kami <strong>tidak menjual, menyewakan, atau membagikan</strong> data pribadi kepada pihak ketiga untuk tujuan komersial.</p>
        </Bab>

        <Bab no={5} judul="Bagaimana data dilindungi">
          <ul className="list-disc space-y-2 pl-6">
            <li>Aturan akses ditegakkan langsung di dalam database (<em>Row Level Security</em>), sehingga tetap berlaku walaupun terjadi kesalahan pada tampilan situs.</li>
            <li>Kolom yang kamu sembunyikan disaring di database <strong>sebelum</strong> data dikirim ke browser siapa pun.</li>
            <li>Foto profil disimpan di penyimpanan tertutup dan hanya dapat dibuka lewat tautan sementara berdurasi 1 jam.</li>
            <li>Seluruh lalu lintas dienkripsi dengan HTTPS. Kata sandi disimpan dalam bentuk <em>hash</em> dan tidak dapat dibaca oleh pengurus.</li>
            <li>Data disimpan pada layanan Supabase (infrastruktur awan). Bila server berada di luar Indonesia, pemindahan dilakukan dengan tingkat pelindungan yang setara sesuai Pasal 56 UU PDP.</li>
          </ul>
        </Bab>

        <Bab no={6} judul="Hak kamu sebagai subjek data">
          <p>Sesuai Pasal 5–13 UU PDP, kamu berhak untuk:</p>
          <ul className="list-disc space-y-2 pl-6">
            <li><strong>Mengakses & mendapatkan salinan</strong> data — melalui tombol <Link href="/profil" className="text-merek-700 underline">Unduh data saya</Link> di halaman profil.</li>
            <li><strong>Memperbarui & memperbaiki</strong> data — kapan saja di halaman profil.</li>
            <li><strong>Membatasi pemrosesan</strong> — dengan mengubah visibilitas menjadi &ldquo;Privat&rdquo;.</li>
            <li><strong>Menghapus</strong> data dan menarik persetujuan — dengan mengajukan permintaan tertulis ke <strong>{email}</strong>; pengurus akan menghapus akun beserta seluruh datamu.</li>
            <li><strong>Mengajukan keberatan</strong> atas pemrosesan tertentu.</li>
          </ul>
          <p>Permintaan tertulis kami tanggapi paling lambat 3 × 24 jam sejak diterima.</p>
        </Bab>

        <Bab no={7} judul="Berapa lama data disimpan">
          <p>Data profil disimpan selama akun kamu aktif. Bila akun dihapus, data profil, foto, dan jawaban tracer study ikut terhapus permanen. Rekap tracer study yang sudah berupa angka gabungan (tanpa identitas) dapat tetap disimpan untuk keperluan dokumentasi akreditasi.</p>
        </Bab>

        <Bab no={8} judul="Kewajiban pengguna direktori">
          <p>Dengan mengakses direktori, kamu setuju untuk <strong>tidak</strong> menyalin massal, menjual, mempublikasikan, atau memakai data alumni lain untuk promosi komersial, politik, maupun kepentingan lain di luar silaturahmi dan rujukan profesional. Pelanggaran dapat berakibat pencabutan akses dan dapat dikenai sanksi sesuai Pasal 65 & 67 UU PDP.</p>
        </Bab>

        <Bab no={9} judul="Kegagalan pelindungan data">
          <p>Bila terjadi kebocoran data, kami akan memberitahukan kepada alumni yang terdampak dan kepada lembaga yang berwenang paling lambat 3 × 24 jam, sesuai Pasal 46 UU PDP.</p>
        </Bab>

        <Bab no={10} judul="Hubungi kami">
          <p>Pertanyaan, permintaan, atau keluhan tentang data pribadi dapat disampaikan ke <strong>{email}</strong> atau melalui halaman <Link href="/kontak" className="text-merek-700 underline">Kontak</Link>.</p>
          <p className="text-sm text-slate-500">Kebijakan ini dapat diperbarui. Perubahan penting akan diumumkan melalui email dan halaman berita.</p>
        </Bab>
      </div>
    </div>
  );
}
