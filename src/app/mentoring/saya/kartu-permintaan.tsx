"use client";

import { useState, useTransition } from "react";
import { jawabMentoring } from "@/actions/mentoring";
import { Avatar } from "@/components/avatar";
import { AreaTeks, Kartu, Lencana } from "@/components/ui/dasar";
import { LABEL_STATUS_MENTORING } from "@/lib/konstanta";
import { waktuRelatif } from "@/lib/format";
import type { PermintaanMentoring, StatusMentoring } from "@/lib/tipe";

function tautanWa(nomor: string) {
  const angka = nomor.replace(/\D/g, "").replace(/^0/, "62");
  return `https://wa.me/${angka}`;
}

export function KartuPermintaan({ r, foto }: { r: PermintaanMentoring; foto: string | null }) {
  const [sibuk, mulai] = useTransition();
  const [balasan, setBalasan] = useState("");
  const [galat, setGalat] = useState<string | null>(null);
  const sayaMentor = r.peran === "mentor";
  const st = LABEL_STATUS_MENTORING[r.status];

  const ubah = (status: StatusMentoring, konfirmasi?: string) => {
    if (konfirmasi && !confirm(konfirmasi)) return;
    mulai(async () => {
      setGalat(null);
      const g = await jawabMentoring(r.id, status, balasan);
      if (g) setGalat(g);
    });
  };

  return (
    <Kartu className={`p-5 ${r.status === "menunggu" && sayaMentor ? "border-amber-300" : ""}`}>
      <div className="flex flex-wrap items-start gap-4">
        <Avatar nama={r.lawan_nama} url={foto} ukuran="size-12" teks="text-sm" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-slate-900">{r.lawan_nama}</p>
            <Lencana warna={st.warna}>{st.label}</Lencana>
            <Lencana>{r.jenis === "flash" ? "⚡ Obrolan kilat" : "🌱 Pendampingan"}</Lencana>
          </div>
          <p className="text-sm text-slate-500">
            {sayaMentor ? "Meminta bimbingan darimu" : "Mentor"} · {[r.lawan_angkatan && `Angkatan ${r.lawan_angkatan}`, r.lawan_spesialisasi].filter(Boolean).join(" · ")}
          </p>
          <p className="mt-3 text-sm font-medium text-slate-800">Topik: {r.topik}</p>
          <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-slate-700">{r.pesan}</p>
          {r.balasan && (
            <div className="mt-3 rounded-lg bg-slate-50 px-3.5 py-2.5 text-sm text-slate-700">
              <span className="text-xs font-medium text-slate-500">Pesan mentor:</span>
              <p className="whitespace-pre-line">{r.balasan}</p>
            </div>
          )}

          {(r.kontak_wa || r.kontak_email) && (
            <div className="mt-3 flex flex-wrap gap-2">
              {r.kontak_wa && (
                <a href={tautanWa(r.kontak_wa)} target="_blank" rel="noreferrer noopener"
                  className="rounded-lg bg-emerald-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-emerald-700">
                  💬 WhatsApp {r.kontak_wa}
                </a>
              )}
              {r.kontak_email && (
                <a href={`mailto:${r.kontak_email}`} className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                  ✉️ {r.kontak_email}
                </a>
              )}
            </div>
          )}
          {r.status === "diterima" && !r.kontak_wa && !r.kontak_email && (
            <p className="mt-3 text-sm text-amber-700">Kontak belum diisi di profil yang bersangkutan. Minta lewat grup angkatan atau pengurus.</p>
          )}

          <p className="mt-3 text-xs text-slate-400">Dikirim {waktuRelatif(r.dibuat_pada)}</p>
        </div>
      </div>

      {sayaMentor && r.status === "menunggu" && (
        <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
          <AreaTeks value={balasan} onChange={(e) => setBalasan(e.target.value)} className="min-h-20"
            placeholder="Pesan singkat (opsional), mis. “Boleh, saya kabari lewat WA untuk atur jadwal ya.”" />
          <div className="flex flex-wrap gap-2">
            <button disabled={sibuk} onClick={() => ubah("diterima")}
              className="rounded-lg bg-merek-700 px-4 py-2 text-sm font-medium text-white hover:bg-merek-800 disabled:opacity-50">
              ✓ Terima & buka kontak
            </button>
            <button disabled={sibuk} onClick={() => ubah("ditolak", "Tolak permintaan ini? Mentee akan melihat statusnya.")}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50">
              Belum bisa
            </button>
          </div>
        </div>
      )}
      {r.status === "diterima" && (
        <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
          <button disabled={sibuk} onClick={() => ubah("selesai")}
            className="rounded-lg bg-merek-50 px-4 py-2 text-sm font-medium text-merek-800 hover:bg-merek-100 disabled:opacity-50">
            Tandai selesai
          </button>
          {!sayaMentor && (
            <button disabled={sibuk} onClick={() => ubah("dibatalkan", "Batalkan sesi mentoring ini?")}
              className="rounded-lg px-4 py-2 text-sm text-slate-500 hover:bg-slate-100 disabled:opacity-50">Batalkan</button>
          )}
        </div>
      )}
      {!sayaMentor && r.status === "menunggu" && (
        <div className="mt-4 border-t border-slate-100 pt-4">
          <button disabled={sibuk} onClick={() => ubah("dibatalkan", "Batalkan permintaan ini?")}
            className="rounded-lg px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-100 disabled:opacity-50">Batalkan permintaan</button>
        </div>
      )}
      {galat && <p className="mt-2 text-sm text-rose-600">{galat}</p>}
    </Kartu>
  );
}
