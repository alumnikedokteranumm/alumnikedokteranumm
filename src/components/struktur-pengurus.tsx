import { Avatar } from "./avatar";
import { kelompokkan } from "@/lib/pengurus";
import type { Pengurus } from "@/lib/tipe";

function Label({ children }: { children: string }) {
  return (
    <div className="mb-4 mt-12 flex items-center gap-4 first:mt-0">
      <h3 className="shrink-0 text-xs font-semibold uppercase tracking-[0.25em] text-merek-600">{children}</h3>
      <span className="h-px flex-1 bg-slate-200" aria-hidden />
    </div>
  );
}

/** Garis penghubung tipis antartingkat, seperti bagan organisasi. */
function Garis() {
  return <div className="mx-auto h-6 w-px bg-merek-200" aria-hidden />;
}

function KartuOrang({ o, jabatan = true }: { o: Pengurus; jabatan?: boolean }) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4">
      <Avatar nama={o.nama} url={o.foto_url} ukuran="size-12" teks="text-sm" />
      <div className="min-w-0">
        <p className="font-semibold leading-snug text-slate-900">{o.nama}</p>
        {jabatan && <p className="text-sm text-merek-700">{o.jabatan}</p>}
      </div>
    </div>
  );
}

export function StrukturPengurus({ daftar }: { daftar: Pengurus[] }) {
  const k = kelompokkan(daftar);
  const wakil = k.harian.filter((o) => /wakil/i.test(o.jabatan));
  const sekretaris = k.harian.filter((o) => /sekretaris/i.test(o.jabatan));
  const bendahara = k.harian.filter((o) => /bendahara/i.test(o.jabatan));
  const harianLain = k.harian.filter((o) => !wakil.includes(o) && !sekretaris.includes(o) && !bendahara.includes(o));

  return (
    <div>
      {k.pembina.length > 0 && (
        <>
          <Label>Pelindung & Penanggungjawab</Label>
          <div className="grid gap-4 sm:grid-cols-2">{k.pembina.map((o) => <KartuOrang key={o.id} o={o} />)}</div>
        </>
      )}

      {k.dewan.length > 0 && (
        <>
          <Label>Dewan Konsultatif</Label>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{k.dewan.map((o) => <KartuOrang key={o.id} o={o} jabatan={false} />)}</div>
        </>
      )}

      {(k.ketua || k.harian.length > 0) && (
        <>
          <Label>Pengurus Harian</Label>
          {k.ketua && (
            <div className="mx-auto flex max-w-md flex-col items-center gap-3 rounded-2xl border-2 border-merek-600 bg-gradient-to-b from-merek-50 to-white px-6 py-7 text-center">
              <Avatar nama={k.ketua.nama} url={k.ketua.foto_url} ukuran="size-24" teks="text-2xl" />
              <div>
                <p className="font-serif text-xl font-bold text-slate-900">{k.ketua.nama}</p>
                <p className="mt-0.5 font-medium text-merek-700">{k.ketua.jabatan}</p>
              </div>
            </div>
          )}
          {wakil.length > 0 && (
            <>
              {k.ketua && <Garis />}
              <div className="mx-auto grid max-w-md gap-4">{wakil.map((o) => <KartuOrang key={o.id} o={o} />)}</div>
            </>
          )}
          {(sekretaris.length > 0 || bendahara.length > 0) && (
            <>
              <Garis />
              {/* Sekretaris di kiri, Bendahara di kanan */}
              <div className="grid gap-4 md:grid-cols-2 md:gap-6">
                <div className="grid content-start gap-4">{sekretaris.map((o) => <KartuOrang key={o.id} o={o} />)}</div>
                <div className="grid content-start gap-4">{bendahara.map((o) => <KartuOrang key={o.id} o={o} />)}</div>
              </div>
            </>
          )}
          {harianLain.length > 0 && (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{harianLain.map((o) => <KartuOrang key={o.id} o={o} />)}</div>
          )}
        </>
      )}

      {k.divisi.length > 0 && (
        <>
          <Label>Divisi</Label>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {k.divisi.map((d) => (
              <div key={d.nama} className="flex flex-col rounded-xl border border-slate-200 bg-white p-5">
                <h4 className="font-serif text-lg font-bold leading-snug text-merek-900">{d.nama}</h4>
                {d.ketua.map((o) => (
                  <div key={o.id} className="mt-4 flex items-center gap-3">
                    <Avatar nama={o.nama} url={o.foto_url} ukuran="size-11" teks="text-sm" />
                    <div className="min-w-0">
                      <p className="font-semibold leading-snug text-slate-900">{o.nama}</p>
                      <p className="text-xs font-medium uppercase tracking-wider text-merek-600">Ketua divisi</p>
                    </div>
                  </div>
                ))}
                {d.anggota.length > 0 && (
                  <ul className={`space-y-1.5 text-sm text-slate-600 ${d.ketua.length ? "mt-4 border-t border-slate-100 pt-4" : "mt-4"}`}>
                    {d.anggota.map((o) => (
                      <li key={o.id} className="flex gap-2"><span className="text-merek-400" aria-hidden>•</span>{o.nama}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {k.lainnya.length > 0 && (
        <>
          <Label>Pengurus Lainnya</Label>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{k.lainnya.map((o) => <KartuOrang key={o.id} o={o} />)}</div>
        </>
      )}
    </div>
  );
}
