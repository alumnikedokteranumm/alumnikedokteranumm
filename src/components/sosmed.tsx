import type { ReactNode } from "react";

type Sosmed = { kunci: string; label: string; dasar: string; ikon: ReactNode };

const garis = { fill: "none", stroke: "currentColor", strokeWidth: 1.9, strokeLinecap: "round", strokeLinejoin: "round" } as const;

/** Urutan tampil ikon media sosial. `dasar` dipakai bila admin hanya mengisi nama akun. */
export const DAFTAR_SOSMED: Sosmed[] = [
  {
    kunci: "instagram", label: "Instagram", dasar: "https://instagram.com/",
    ikon: <g {...garis}><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" /></g>,
  },
  {
    kunci: "youtube", label: "YouTube", dasar: "https://youtube.com/@",
    ikon: <g><rect x="2" y="5" width="20" height="14" rx="4" fill="currentColor" /><path d="M10 9v6l5-3z" fill="#fff" /></g>,
  },
  {
    kunci: "tiktok", label: "TikTok", dasar: "https://www.tiktok.com/@",
    ikon: <path fill="currentColor" d="M16.6 3c.3 2.3 1.7 3.8 3.9 4v3.1a7 7 0 0 1-3.9-1.2v6.2a5.6 5.6 0 1 1-5.6-5.6c.3 0 .6 0 .9.1v3.2a2.5 2.5 0 1 0 1.7 2.3V3h3Z" />,
  },
  {
    kunci: "facebook", label: "Facebook", dasar: "https://facebook.com/",
    ikon: <path fill="currentColor" d="M13.5 21v-7.5h2.6l.4-3h-3V8.6c0-.9.3-1.5 1.5-1.5h1.6V4.4a21 21 0 0 0-2.3-.1c-2.3 0-3.9 1.4-3.9 4v2.2H7.8v3h2.6V21h3.1Z" />,
  },
  {
    kunci: "linkedin", label: "LinkedIn", dasar: "https://www.linkedin.com/company/",
    ikon: <g {...garis}><rect x="3" y="3" width="18" height="18" rx="3" /><path d="M8 10.5V17M8 7.5v.01M12 17v-6.5M12 13.5a2.5 2.5 0 0 1 5 0V17" /></g>,
  },
  {
    kunci: "x", label: "X (Twitter)", dasar: "https://x.com/",
    ikon: <path fill="currentColor" d="M17.8 3h3l-6.6 7.6L22 21h-6.1l-4.8-6.2L5.6 21h-3l7.1-8.1L2.2 3h6.2l4.3 5.7L17.8 3Zm-1 16.2h1.7L7.3 4.7H5.5l11.3 14.5Z" />,
  },
];

/** Admin boleh mengisi tautan lengkap atau cukup nama akun (dengan/tanpa @). */
export function tautanSosmed(s: Sosmed, nilai: string | undefined | null) {
  const v = (nilai ?? "").trim();
  if (!v) return null;
  if (/^https?:\/\//i.test(v)) return v;
  if (/^[\w.-]+\.[a-z]{2,}\//i.test(v)) return `https://${v}`;           // mis. instagram.com/akun
  return s.dasar + v.replace(/^@/, "");
}

export function IkonSosmed({ kunci, className = "size-5" }: { kunci: string; className?: string }) {
  const s = DAFTAR_SOSMED.find((x) => x.kunci === kunci);
  return s ? <svg viewBox="0 0 24 24" className={className} aria-hidden>{s.ikon}</svg> : null;
}

/** Deretan ikon bulat — dipakai di footer dan beranda. Kosong bila belum ada akun diisi. */
export function DeretSosmed({ p, gelap = false }: { p: Record<string, string>; gelap?: boolean }) {
  const ada = DAFTAR_SOSMED.map((s) => ({ s, url: tautanSosmed(s, p[s.kunci]) })).filter((x) => x.url);
  if (!ada.length) return null;
  return (
    <ul className="flex flex-wrap gap-2">
      {ada.map(({ s, url }) => (
        <li key={s.kunci}>
          <a href={url!} target="_blank" rel="noreferrer noopener" aria-label={s.label} title={s.label}
            className={`grid size-10 place-items-center rounded-full transition-colors ${gelap
              ? "bg-white/10 text-white hover:bg-emas-400 hover:text-merek-950"
              : "bg-merek-50 text-merek-700 hover:bg-merek-700 hover:text-white"}`}>
            <IkonSosmed kunci={s.kunci} />
          </a>
        </li>
      ))}
    </ul>
  );
}
