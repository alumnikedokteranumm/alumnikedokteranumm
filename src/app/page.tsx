import Image from "next/image";
import Link from "next/link";
import { TautanTombol, Kartu, Lencana, Pesan } from "@/components/ui/dasar";
import { ambilStatistik, ambilBerita, ambilAcara, ambilPengurus } from "@/lib/data";
import { ambilPengaturan, ambilSesi } from "@/lib/sesi";
import { SUPABASE_SIAP } from "@/lib/konfig";
import { DAFTAR_SOSMED, DeretSosmed } from "@/components/sosmed";
import { angka, tanggal, tanggalJam, waktuRelatif } from "@/lib/format";

export const revalidate = 300;

/* ---------- Kartu gaya majalah: 1 sorotan besar + kartu mendatar di sampingnya ---------- */
type ItemSorotan = {
  id: string; href: string; judul: string; gambar: string | null; tanggal: string;
  ringkasan?: string | null; label?: React.ReactNode; tanggalKotak?: Date;
};

const BULAN_PENDEK = ["JAN", "FEB", "MAR", "APR", "MEI", "JUN", "JUL", "AGU", "SEP", "OKT", "NOV", "DES"];

function GambarKartu({ item, besar }: { item: ItemSorotan; besar?: boolean }) {
  if (item.gambar) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={item.gambar} alt="" loading="lazy"
        className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
    );
  }
  // Tanpa gambar: blok biru dongker berisi tanggal (agenda) atau lambang (berita)
  const t = item.tanggalKotak && new Date(item.tanggalKotak.getTime() + 7 * 3600_000);
  return (
    <div className="pola-hero grid size-full place-items-center bg-merek-800 text-white">
      {t ? (
        <div className="text-center leading-none">
          <p className={`font-serif font-bold ${besar ? "text-6xl" : "text-4xl"}`}>{t.getUTCDate()}</p>
          <p className={`mt-2 font-semibold tracking-[0.25em] text-emas-300 ${besar ? "text-base" : "text-xs"}`}>
            {BULAN_PENDEK[t.getUTCMonth()]} {t.getUTCFullYear()}
          </p>
        </div>
      ) : (
        <Image src="/logo-256.png" alt="" width={256} height={256} className={`opacity-90 ${besar ? "size-24" : "size-14"}`} />
      )}
    </div>
  );
}

function IkonJam() {
  return (
    <svg viewBox="0 0 24 24" className="size-4 shrink-0 text-merek-700" fill="currentColor" aria-hidden>
      <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm1 5v4.6l3.2 1.9-.8 1.3L11 12.4V7h2Z" />
    </svg>
  );
}

function BacaSelengkapnya({ teks }: { teks: string }) {
  return (
    <span className="mt-4 inline-flex items-center gap-2 whitespace-nowrap text-xs font-semibold uppercase tracking-[0.15em] text-merek-700">
      {teks}
      <span aria-hidden className="transition-transform group-hover:translate-x-1">→</span>
    </span>
  );
}

function GridSorotan({ items, teksBaca }: { items: ItemSorotan[]; teksBaca: string }) {
  const [utama, ...lain] = items;
  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <Link href={utama.href} className="group block">
        <article>
          <div className="aspect-[16/10] overflow-hidden rounded-xl bg-slate-100">
            <GambarKartu item={utama} besar />
          </div>
          <div className="px-1 pt-5">
            {utama.label && <div className="mb-2.5 flex flex-wrap gap-1.5">{utama.label}</div>}
            <h3 className="font-serif text-2xl font-bold leading-snug text-merek-900 group-hover:text-merek-700">{utama.judul}</h3>
            <p className="mt-3 flex items-center gap-2 text-sm text-slate-600"><IkonJam />{utama.tanggal}</p>
            {utama.ringkasan && <p className="mt-3 line-clamp-3 text-[15px] leading-relaxed text-slate-600">{utama.ringkasan}</p>}
            <BacaSelengkapnya teks={teksBaca} />
          </div>
        </article>
      </Link>

      {lain.length > 0 && (
        <div className="grid content-start gap-8 sm:grid-cols-2 lg:col-span-2">
          {lain.map((it) => (
            <Link key={it.id} href={it.href} className="group block">
              <article className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] gap-4">
                <div className="aspect-[4/3.6] overflow-hidden rounded-xl bg-slate-100">
                  <GambarKartu item={it} />
                </div>
                <div className="min-w-0">
                  {it.label && <div className="mb-2 flex flex-wrap gap-1">{it.label}</div>}
                  <h3 className="line-clamp-4 font-serif text-lg font-bold leading-snug text-merek-900 group-hover:text-merek-700">{it.judul}</h3>
                  <p className="mt-2.5 flex items-center gap-1.5 text-[13px] text-slate-600"><IkonJam />{it.tanggal}</p>
                  <BacaSelengkapnya teks={teksBaca} />
                </div>
              </article>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function JudulBagian({ atas, judul }: { atas: string; judul: string }) {
  return (
    <div className="mb-12 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.35em] text-merek-600">{atas}</p>
      <h2 className="mt-3 font-serif text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">{judul}</h2>
    </div>
  );
}

function LambangHero({ ukuran }: { ukuran: string }) {
  return (
    <div className="relative mx-auto">
      {/* cahaya emas lembut di belakang lambang */}
      <div className="absolute inset-4 rounded-full bg-emas-400/30 blur-3xl" aria-hidden />
      <Image src="/logo-512.png" alt="Lambang Alumni Kedokteran UMM" width={512} height={512} priority
        className={`relative drop-shadow-[0_20px_40px_rgba(0,0,0,0.35)] ${ukuran}`} />
    </div>
  );
}


export default async function Beranda() {
  const [stat, berita, agenda, p, sesi, pengurus] = await Promise.all([
    ambilStatistik(),
    ambilBerita(5),
    ambilAcara({ mendatang: true, batas: 5 }),
    ambilPengaturan(),
    ambilSesi(),
    ambilPengurus(),
  ]);
  // Foto sambutan: dari Pengaturan Situs, atau foto Ketua Umum di menu Pengurus
  const fotoKetua = p.sambutan_foto?.trim() ||
    pengurus.find((x) => /ketua umum/i.test(x.jabatan) && x.foto_url)?.foto_url || null;

  const angkaSorot = [
    { nilai: stat.total_alumni,   label: "Alumni terdata",      imbuhan: "" },
    { nilai: stat.total_angkatan, label: "Angkatan",            imbuhan: "" },
    { nilai: stat.total_spesialis,label: "Dokter spesialis",    imbuhan: "" },
    { nilai: stat.total_kota,     label: "Kota tempat mengabdi",imbuhan: "" },
  ];

  return (
    <>
      {!SUPABASE_SIAP && (
        <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
          <Pesan jenis="ingat" judul="Website berjalan, tapi database belum tersambung">
            Buka berkas <code className="font-mono">PANDUAN.md</code> di folder proyek, ikuti
            Langkah 2 untuk membuat proyek Supabase gratis dan menyalin dua kunci ke berkas{" "}
            <code className="font-mono">.env.local</code>. Setelah itu semua data akan muncul di sini.
          </Pesan>
        </div>
      )}

      {/* ------------------------------------------------------------ HERO */}
      <section className="pola-hero relative overflow-hidden bg-merek-900 text-white">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_auto] lg:gap-16 lg:px-8 lg:py-24">
          <div className="order-last max-w-3xl text-center lg:order-first lg:text-left">
            <span className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-emas-400 ring-1 ring-emas-400/30">
              Portal Resmi Alumni
            </span>
            <h1 className="mt-5 font-serif text-4xl font-bold leading-[1.15] tracking-tight sm:text-5xl lg:text-6xl">
              {p.tagline || "Merawat Silaturahmi, Menguatkan Pengabdian"}
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-merek-100 lg:mx-0">
              Rumah digital {p.nama_organisasi || "Alumni Kedokteran UMM"}.
              Satu tempat untuk menemukan sejawat, mengikuti agenda ilmiah, membaca peluang karier,
              dan berkontribusi bagi almamater.
            </p>
            <div className="mt-9 flex flex-wrap justify-center gap-3 lg:justify-start">
              {sesi.user ? (
                <TautanTombol href="/direktori" varian="kedua" className="px-6 py-3 text-base">
                  Buka Direktori Alumni
                </TautanTombol>
              ) : (
                <TautanTombol href="/daftar" varian="kedua" className="px-6 py-3 text-base">
                  Daftar Keanggotaan
                </TautanTombol>
              )}
              <TautanTombol href="/tentang" varian="garis"
                className="border-white/25 bg-white/5 px-6 py-3 text-base text-white hover:bg-white/10">
                Tentang Kami
              </TautanTombol>
            </div>
          </div>
          <LambangHero ukuran="size-44 sm:size-56 lg:size-80" />
        </div>
      </section>

      {/* ------------------------------------------------------- STATISTIK */}
      {/* Disembunyikan sampai ada alumni terverifikasi, supaya tidak tampil "0" saat baru diluncurkan */}
      {stat.total_alumni > 0 && (
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 px-4 sm:px-6 lg:grid-cols-4 lg:divide-x lg:divide-slate-200 lg:px-8">
          {angkaSorot.map((a) => (
            <div key={a.label} className="bg-white px-2 py-8 text-center">
              <p className="font-serif text-4xl font-bold text-merek-800">
                {angka(a.nilai)}{a.imbuhan}
              </p>
              <p className="mt-1.5 text-sm text-slate-600">{a.label}</p>
            </div>
          ))}
        </div>
        <p className="pb-6 text-center text-xs text-slate-400">
          Angka agregat dari profil alumni terverifikasi. Tidak ada data pribadi yang ditampilkan di halaman publik.
        </p>
      </section>
      )}

      {/* -------------------------------------------------------- SAMBUTAN */}
      {p.sambutan_isi && (
        <section className="bg-white py-20">
          <div className={`mx-auto px-4 sm:px-6 lg:px-8 ${fotoKetua ? "max-w-5xl" : "max-w-4xl"}`}>
            <div className={`relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-merek-50 to-white ${
              fotoKetua ? "md:grid md:grid-cols-[minmax(0,19rem)_minmax(0,1fr)]" : ""}`}>
              {fotoKetua && (
                <div className="relative h-80 bg-merek-100 md:h-auto md:min-h-full">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={fotoKetua} alt={p.sambutan_nama || "Ketua Umum"}
                    className="absolute inset-0 size-full object-cover object-top" />
                  {/* gradasi agar foto melebur ke latar kotak sambutan */}
                  <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-merek-50 to-transparent md:inset-y-0 md:left-auto md:right-0 md:h-auto md:w-28 md:bg-gradient-to-l" aria-hidden />
                </div>
              )}
              <div className={`relative p-8 sm:p-12 ${fotoKetua ? "md:pl-6" : ""}`}>
                <span className="pointer-events-none absolute right-6 top-2 select-none font-serif text-[9rem] leading-none text-emas-400/25" aria-hidden>&rdquo;</span>
                <p className="relative text-xs font-semibold uppercase tracking-[0.14em] text-merek-600">
                  {p.sambutan_judul || "Sambutan Ketua Umum"}
                </p>
                <blockquote className="relative mt-5 font-serif text-lg leading-[1.85] text-slate-700">
                  {p.sambutan_isi}
                </blockquote>
                {p.sambutan_nama && (
                  <p className="relative mt-6 border-t border-slate-200 pt-5 text-sm font-semibold text-slate-900">
                    {p.sambutan_nama}
                    <span className="mt-0.5 block font-normal text-slate-500">Ketua Umum Alumni Kedokteran UMM</span>
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ---------------------------------------------------------- AGENDA */}
      {agenda.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <JudulBagian atas="Jangan sampai terlewat" judul="Agenda Terdekat" />
          <GridSorotan teksBaca="Lihat detail" items={agenda.map((a) => ({
            id: a.id, href: `/agenda/${a.slug}`, judul: a.judul, gambar: a.poster_url,
            tanggal: `${tanggalJam(a.mulai)} · ${waktuRelatif(a.mulai)}`,
            ringkasan: [a.lokasi, a.deskripsi].filter(Boolean).join(" — "),
            tanggalKotak: new Date(a.mulai),
            label: (
              <>
                <Lencana warna="hijau">{a.jenis}</Lencana>
                {a.daring && <Lencana warna="biru">Daring</Lencana>}
                {a.skp_idi && <Lencana warna="emas">{a.skp_idi} SKP</Lencana>}
              </>
            ),
          }))} />
          <div className="mt-12 text-center">
            <TautanTombol href="/agenda" varian="garis" className="px-6">Lihat semua agenda →</TautanTombol>
          </div>
        </section>
      )}

      {/* ---------------------------------------------------------- BERITA */}
      {berita.length > 0 && (
        <section className="border-y border-slate-200 bg-white py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <JudulBagian atas="Kabar alumni" judul="Berita Terbaru" />
            <GridSorotan teksBaca="Baca selengkapnya" items={berita.map((b) => ({
              id: b.id, href: `/berita/${b.slug}`, judul: b.judul, gambar: b.sampul_url,
              tanggal: tanggal(b.terbit_pada), ringkasan: b.ringkasan,
            }))} />
            <div className="mt-12 text-center">
              <TautanTombol href="/berita" varian="garis" className="px-6">Semua berita →</TautanTombol>
            </div>
          </div>
        </section>
      )}

      {/* --------------------------------------------------------- LAYANAN */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-merek-600">Apa yang bisa kamu lakukan</p>
          <h2 className="mt-2 font-serif text-3xl font-bold tracking-tight text-slate-900">
            Layanan untuk alumni
          </h2>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { href: "/direktori", judul: "Direktori Alumni", teks: "Cari sejawat berdasarkan angkatan, kota, atau bidang spesialisasi. Tertutup — hanya untuk alumni terverifikasi.", ikon: "M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM12 14a7 7 0 0 0-7 7h14a7 7 0 0 0-7-7Z", kunci: true },
            { href: "/video", judul: "Video Edukasi", teks: "Rekaman webinar, kuliah tamu, dan materi keterampilan klinis untuk belajar kapan saja.", ikon: "M15 10l4.55-2.28A1 1 0 0 1 21 8.62v6.76a1 1 0 0 1-1.45.9L15 14M5 18h8a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2Z", kunci: true },
            { href: "/dokumen", judul: "Dokumen Penting", teks: "Unduh sertifikat akreditasi, SK, pedoman, dan formulir resmi dalam format PDF.", ikon: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M12 18v-6M9 15l3 3 3-3", kunci: true },
            { href: "/agenda", judul: "Agenda Ilmiah", teks: "Seminar, webinar ber-SKP, workshop, dan temu alumni. Lengkap dengan tautan pendaftaran.", ikon: "M8 2v4M16 2v4M3 10h18M5 6h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z" },
            { href: "/karier", judul: "Karier & Beasiswa", teks: "Lowongan dokter umum dan spesialis, program PPDS, serta informasi beasiswa pendidikan lanjut.", ikon: "M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2ZM8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" },
            { href: "/tracer-study", judul: "Tracer Study", teks: "Kuesioner singkat yang menjadi dasar akreditasi LAM-PTKes dan perbaikan kurikulum FK UMM.", ikon: "M9 11l3 3 8-8M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11", kunci: true },
            { href: "/mentoring", judul: "Mentoring Alumni", teks: "Ngobrol 30 menit dengan senior soal pilihan spesialis, PPDS, buka praktik, atau karier non-klinis.", ikon: "M17 20h5v-2a3 3 0 0 0-5.36-1.86M17 20H7m10 0v-2c0-.66-.13-1.28-.36-1.86M7 20H2v-2a3 3 0 0 1 5.36-1.86M7 20v-2c0-.66.13-1.28.36-1.86m0 0a5 5 0 0 1 9.28 0M15 7a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z", kunci: true },
            { href: "/skp", judul: "Webinar & SKP", teks: "Daftar webinar, isi presensi dan kuis, lalu unduh sertifikat ber-SKP. Riwayat SKP-mu tercatat rapi.", ikon: "M12 14l9-5-9-5-9 5 9 5Zm0 0v6m-5-8.2V17l5 3 5-3v-5.2" },
            { href: "/pustaka", judul: "Perpustakaan Digital", teks: "Jurnal, pedoman klinis, dan kalkulator klinis gratis yang dikurasi pengurus dalam satu halaman.", ikon: "M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15Z", kunci: true },
            { href: "/arsip-lulusan", judul: "Arsip Lulusan", teks: "Daftar lulusan FK UMM per tahun sejak angkatan pertama. Lihat siapa teman seangkatan yang sudah bergabung.", ikon: "M21 8v13H3V8M1 3h22v5H1zM10 12h4", kunci: true },
            { href: "/donasi", judul: "Iuran & Donasi", teks: "Bayar iuran, konfirmasi transfer dengan bukti, dan pantau laporan keuangan yang terbuka.", ikon: "M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1L12 21.2l7.7-7.7 1.1-1a5.5 5.5 0 0 0 0-7.9Z" },
            { href: "/berita", judul: "Kabar Almamater", teks: "Berita kegiatan, prestasi alumni, dan pengumuman resmi dari pengurus Alumni Kedokteran UMM.", ikon: "M4 4h16v16H4zM8 8h8M8 12h8M8 16h5" },
          ].map((k) => (
            <Link key={k.href} href={k.href} className="group">
              <Kartu className="h-full p-6 transition-all hover:-translate-y-0.5 hover:border-merek-300 hover:shadow-md">
                <div className="flex items-start justify-between">
                  <span className="grid size-11 place-items-center rounded-lg bg-merek-50 text-merek-700">
                    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                      <path d={k.ikon} />
                    </svg>
                  </span>
                  {k.kunci && <Lencana warna="netral">Khusus alumni</Lencana>}
                </div>
                <h3 className="mt-4 text-base font-semibold text-slate-900 group-hover:text-merek-700">{k.judul}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{k.teks}</p>
              </Kartu>
            </Link>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------- MEDSOS */}
      {DAFTAR_SOSMED.some((s) => p[s.kunci]?.trim()) && (
        <section className="mx-auto max-w-7xl px-4 pt-16 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-6 rounded-2xl border border-slate-200 bg-white px-8 py-7">
            <div>
              <h2 className="font-serif text-xl font-bold text-slate-900">Ikuti kabar kami</h2>
              <p className="mt-1 text-sm text-slate-600">Dokumentasi kegiatan, info webinar, dan kabar alumni setiap pekan.</p>
            </div>
            <DeretSosmed p={p} />
          </div>
        </section>
      )}

      {/* ------------------------------------------------------------- CTA */}
      {!sesi.user && (
        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-merek-800 px-8 py-14 text-center sm:px-14">
            <h2 className="font-serif text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Sudah terdaftar sebagai alumni?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-merek-100">
              Perbarui datamu agar sejawat dan adik tingkat bisa menemukanmu. Pendaftaran gratis,
              diverifikasi pengurus, dan kamu sepenuhnya mengendalikan data mana yang boleh terlihat.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <TautanTombol href="/daftar" varian="kedua" className="px-6 py-3 text-base">Daftar Sekarang</TautanTombol>
              <TautanTombol href="/privasi" varian="garis"
                className="border-white/25 bg-white/5 px-6 py-3 text-base text-white hover:bg-white/10">
                Baca Kebijakan Privasi
              </TautanTombol>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
