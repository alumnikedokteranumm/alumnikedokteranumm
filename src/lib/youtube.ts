/**
 * Ambil ID video dari berbagai bentuk tautan YouTube:
 * youtube.com/watch?v=ID, youtu.be/ID, youtube.com/shorts/ID, /live/ID, /embed/ID
 */
export function idYoutube(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url.trim());
    const host = u.hostname.replace(/^www\.|^m\./, "");
    let id: string | null = null;
    if (host === "youtu.be") id = u.pathname.slice(1).split("/")[0];
    else if (host === "youtube.com" || host === "youtube-nocookie.com") {
      id = u.searchParams.get("v");
      const m = u.pathname.match(/^\/(shorts|live|embed)\/([^/?#]+)/);
      if (!id && m) id = m[2];
    }
    return id && /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}

export const gambarMiniYoutube = (id: string) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

/** Mode "nocookie": YouTube tidak memasang cookie pelacak sebelum video diputar. */
export const sematanYoutube = (id: string) =>
  `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1`;
