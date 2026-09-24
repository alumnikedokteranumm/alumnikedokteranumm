import { inisial, warnaAvatar } from "@/lib/format";

export function Avatar({ nama, url, ukuran = "size-14", teks = "text-base" }:
  { nama: string; url?: string | null; ukuran?: string; teks?: string }) {
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt="" loading="lazy" className={`${ukuran} shrink-0 rounded-full object-cover`} />;
  }
  return (
    <span className={`${ukuran} ${teks} grid shrink-0 place-items-center rounded-full font-bold ${warnaAvatar(nama)}`} aria-hidden>
      {inisial(nama)}
    </span>
  );
}
